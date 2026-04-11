/**
 * Auth token management – bootstrap, persist, invalidate.
 *
 * Extracted from client.js to keep the API surface thin.
 *
 * Security boundary – sessionStorage vs localStorage
 * ===================================================
 * Write-auth tokens are stored in **sessionStorage** on purpose:
 *   - Session-scoped: cleared when the tab closes (no long-lived secret on disk).
 *   - Same-origin only: inaccessible to other tabs/windows that haven't
 *     bootstrapped their own token.
 *   - Not sent automatically in HTTP requests: fetched explicitly per-call and
 *     injected via the `X-MJR-Token` header.
 *
 * **localStorage** is used only for user-facing settings (never for secrets).
 * If a legacy `security.apiToken` value is found in localStorage it is migrated
 * to sessionStorage once and then wiped from localStorage immediately.
 *
 * Web Crypto encryption of the sessionStorage value was evaluated and deemed
 * unnecessary: sessionStorage is already same-origin-scoped and tab-scoped,
 * and the token lifetime is short (session-only). Adding encryption would
 * increase complexity without meaningful security gain in this context.
 */

import { SETTINGS_KEY } from "../app/settingsStore.js";
import { t } from "../app/i18n.js";
import { comfyToast } from "../app/toast.js";
import { createTTLCache } from "../utils/ttlCache.js";

const AUTH_TOKEN_CACHE_TTL_MS = 2000;
const AUTH_BOOTSTRAP_FAILURE_TTL_MS = 15_000;
const WRITE_AUTH_TOAST_TTL_MS = 8_000;
const RUNTIME_TOKEN_KEY = "__mjr_write_token";
const AUTH_TOKEN_CACHE_KEY = "token";

let _authTokenRefreshInFlight = null;
let _lastAuthBootstrapFailure = null;
let _lastWriteAuthToast = null;

const _authTokenCache = createTTLCache({ ttlMs: AUTH_TOKEN_CACHE_TTL_MS, maxSize: 1 });

// ---------------------------------------------------------------------------
// Low-level session / localStorage helpers
// ---------------------------------------------------------------------------

function _readSessionAuthToken() {
    try {
        return String(sessionStorage?.getItem?.(RUNTIME_TOKEN_KEY) || "").trim();
    } catch {
        return "";
    }
}

function _writeSessionAuthToken(token) {
    const normalized = String(token || "").trim();
    try {
        if (normalized) {
            sessionStorage?.setItem?.(RUNTIME_TOKEN_KEY, normalized);
        } else {
            sessionStorage?.removeItem?.(RUNTIME_TOKEN_KEY);
        }
        return true;
    } catch {
        return false;
    }
}

function _clearLocalSettingsAuthToken() {
    try {
        const raw = localStorage?.getItem?.(SETTINGS_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        const next = parsed && typeof parsed === "object" ? parsed : {};
        const target = next?.data && typeof next.data === "object" ? next.data : next;
        if (
            target?.security &&
            typeof target.security === "object" &&
            String(target.security.apiToken || "").trim()
        ) {
            target.security.apiToken = "";
            localStorage?.setItem?.(SETTINGS_KEY, JSON.stringify(next));
        }
    } catch (e) {
        console.debug?.(e);
    }
}

function _clearAuthToken() {
    try {
        _authTokenCache.delete(AUTH_TOKEN_CACHE_KEY);
    } catch (e) {
        console.debug?.(e);
    }
    _writeSessionAuthToken("");
    _clearLocalSettingsAuthToken();
}

// ---------------------------------------------------------------------------
// Read / persist
// ---------------------------------------------------------------------------

export function readAuthToken() {
    const cached = _authTokenCache.get(AUTH_TOKEN_CACHE_KEY);
    if (cached !== undefined) {
        return cached;
    }
    const now = Date.now();

    const sessionToken = _readSessionAuthToken();
    if (sessionToken) {
        _authTokenCache.set(AUTH_TOKEN_CACHE_KEY, sessionToken, { at: now });
        return sessionToken;
    }

    try {
        const raw = localStorage?.getItem?.(SETTINGS_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        const payload = parsed?.data && typeof parsed.data === "object" ? parsed.data : parsed;
        const token = String(payload?.security?.apiToken || "").trim();
        if (token) {
            _writeSessionAuthToken(token);
            try {
                const mutable = parsed && typeof parsed === "object" ? parsed : {};
                const target =
                    mutable?.data && typeof mutable.data === "object" ? mutable.data : mutable;
                if (target?.security && typeof target.security === "object") {
                    target.security.apiToken = "";
                    localStorage?.setItem?.(SETTINGS_KEY, JSON.stringify(mutable));
                    window?.dispatchEvent?.(
                        new CustomEvent("mjr-settings-changed", {
                            detail: { key: "security.apiToken" },
                        }),
                    );
                }
            } catch (e) {
                console.debug?.(e);
            }
        }
        _authTokenCache.set(AUTH_TOKEN_CACHE_KEY, token, { at: now });
        return token;
    } catch {
        _authTokenCache.set(AUTH_TOKEN_CACHE_KEY, "", { at: now });
        return "";
    }
}

function _persistAuthToken(token) {
    const normalized = String(token || "").trim();
    if (!normalized) return false;
    try {
        _authTokenCache.set(AUTH_TOKEN_CACHE_KEY, normalized);
        _lastAuthBootstrapFailure = null;
        _writeSessionAuthToken(normalized);
        _clearLocalSettingsAuthToken();
        try {
            window?.dispatchEvent?.(
                new CustomEvent("mjr-settings-changed", { detail: { key: "security.apiToken" } }),
            );
        } catch (e) {
            console.debug?.(e);
        }
        return true;
    } catch {
        return false;
    }
}

// RFC 6750 token68 charset + underscore. Covers "mjr_<hex>" generated tokens and
// standard Bearer token values. Rejects control chars, spaces, or injection attempts
// before the value reaches an Authorization header.
const _TOKEN_FORMAT_RE = /^[A-Za-z0-9._\-~+/]+=*$/;

export function setRuntimeSecurityToken(token) {
    const normalized = String(token || "").trim();
    if (!normalized) return false;
    if (!_TOKEN_FORMAT_RE.test(normalized)) {
        console.debug?.("[MJR auth] Rejected malformed security token (invalid characters)");
        return false;
    }
    return _persistAuthToken(normalized);
}

// ---------------------------------------------------------------------------
// Bootstrap failure tracking
// ---------------------------------------------------------------------------

function _rememberAuthBootstrapFailure(details = {}) {
    const code = String(details?.code || "")
        .trim()
        .toUpperCase();
    const error = String(details?.error || "").trim();
    const status = Number(details?.status || 0) || 0;
    _lastAuthBootstrapFailure = {
        code,
        error,
        status,
        at: Date.now(),
    };
}

function _readAuthBootstrapFailure() {
    const cached = _lastAuthBootstrapFailure;
    if (!cached) return null;
    const age = Date.now() - (Number(cached.at || 0) || 0);
    if (age < 0 || age > AUTH_BOOTSTRAP_FAILURE_TTL_MS) {
        _lastAuthBootstrapFailure = null;
        return null;
    }
    return cached;
}

// ---------------------------------------------------------------------------
// Write-auth error messaging
// ---------------------------------------------------------------------------

function _buildWriteAuthErrorMessage(result) {
    const failure = _readAuthBootstrapFailure();
    const resultCode = String(result?.code || "")
        .trim()
        .toUpperCase();
    const resultError = String(result?.error || "").trim();
    const failureCode = String(failure?.code || "")
        .trim()
        .toUpperCase();
    const failureError = String(failure?.error || "")
        .trim()
        .toLowerCase();
    const resultErrorLower = resultError.toLowerCase();

    if (
        failureCode === "FORBIDDEN" &&
        (failureError.includes("already configured") || failureError.includes("rotate-token"))
    ) {
        return t(
            "toast.writeAuthConfiguredTokenRequired",
            "Write access requires the Majoor API token already configured on the server. Open Settings -> Security -> API Token and enter the matching token.",
        );
    }

    if (
        failureCode === "AUTH_REQUIRED" &&
        (failureError.includes("sign in to comfyui") ||
            failureError.includes("authenticated comfyui user"))
    ) {
        return t(
            "toast.writeAuthSignInRequired",
            "Write access is blocked. Sign in to ComfyUI first, then retry so Majoor can bootstrap the remote session token automatically.",
        );
    }

    if (
        failureCode === "BOOTSTRAP_DISABLED" ||
        (failureCode === "AUTH_REQUIRED" && failureError.includes("bootstrap")) ||
        (resultCode === "AUTH_REQUIRED" && resultErrorLower.includes("api token"))
    ) {
        return t(
            "toast.writeAuthBootstrapHelp",
            "Write access is blocked. Sign in to ComfyUI and retry so Majoor can bootstrap the remote session automatically, or set a Majoor API token in Settings -> Security.",
        );
    }

    return "";
}

function _notifyWriteAuthFailure(message) {
    const normalized = String(message || "").trim();
    if (!normalized) return;
    const now = Date.now();
    const cached = _lastWriteAuthToast;
    if (
        cached &&
        cached.message === normalized &&
        now - (Number(cached.at || 0) || 0) < WRITE_AUTH_TOAST_TTL_MS
    ) {
        return;
    }
    _lastWriteAuthToast = { message: normalized, at: now };
    try {
        comfyToast(
            {
                summary: t("toast.writeAuthTitle", "Majoor remote write access"),
                detail: normalized,
            },
            "warning",
            6500,
            { noHistory: true },
        );
    } catch (e) {
        console.debug?.(e);
    }
}

export function normalizeWriteAuthFailure(result) {
    const code = String(result?.code || "")
        .trim()
        .toUpperCase();
    const error = String(result?.error || "")
        .trim()
        .toLowerCase();
    const authLikeForbidden = code === "FORBIDDEN" && error.includes("write operation blocked");
    if (code !== "AUTH_REQUIRED" && !authLikeForbidden) {
        return result;
    }
    const message = _buildWriteAuthErrorMessage(result);
    if (!message) {
        return result;
    }
    _notifyWriteAuthFailure(message);
    return { ...result, error: message };
}

// ---------------------------------------------------------------------------
// Server bootstrap
// ---------------------------------------------------------------------------

async function _refreshAuthTokenFromServer() {
    try {
        const response = await fetch("/mjr/am/settings/security/bootstrap-token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest",
            },
            body: "{}",
        });
        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
            _rememberAuthBootstrapFailure({
                code: "INVALID_RESPONSE",
                error: `Bootstrap token request returned non-JSON response (${response.status})`,
                status: response.status,
            });
            return { ok: false, token: false };
        }
        const payload = await response.json().catch((e) => {
            console.debug?.("[MJR auth] JSON parse error:", e);
            return null;
        });
        if (!payload || typeof payload !== "object") {
            _rememberAuthBootstrapFailure({
                code: "INVALID_RESPONSE",
                error: "Bootstrap token response was invalid.",
                status: response.status,
            });
            return { ok: false, token: false };
        }
        if (!payload.ok) {
            _rememberAuthBootstrapFailure({
                code: payload?.code,
                error: payload?.error,
                status: response.status,
            });
            return { ok: false, token: false };
        }
        const token = String(payload?.data?.token || "").trim();
        if (token) return { ok: _persistAuthToken(token), token: true };
        _lastAuthBootstrapFailure = null;
        return { ok: true, token: false };
    } catch (error) {
        _rememberAuthBootstrapFailure({
            code: "NETWORK_ERROR",
            error: error?.message || "Bootstrap token request failed.",
            status: 0,
        });
        return { ok: false, token: false };
    }
}

export async function ensureWriteAuthToken({ force = false, allowCookieRefresh = false } = {}) {
    const existing = readAuthToken();
    if (existing && !force) return existing;
    let refreshResult = { ok: false, token: false };
    if (!_authTokenRefreshInFlight) {
        _authTokenRefreshInFlight = (async () => {
            try {
                return await _refreshAuthTokenFromServer();
            } finally {
                _authTokenRefreshInFlight = null;
            }
        })();
    }
    try {
        refreshResult = (await _authTokenRefreshInFlight) || refreshResult;
    } catch (e) {
        console.debug?.(e);
    }
    if (force && refreshResult?.ok && !refreshResult?.token && existing) {
        _clearAuthToken();
    } else if (force && !refreshResult?.ok) {
        const failure = _readAuthBootstrapFailure();
        const failureCode = String(failure?.code || "")
            .trim()
            .toUpperCase();
        if (!failureCode || !["NETWORK_ERROR", "INVALID_RESPONSE"].includes(failureCode)) {
            _clearAuthToken();
        }
    }
    const nextToken = readAuthToken();
    if (!nextToken && allowCookieRefresh && refreshResult?.ok) {
        return true;
    }
    return nextToken;
}

export function invalidateAuthTokenCache() {
    _authTokenCache.clear();
}
