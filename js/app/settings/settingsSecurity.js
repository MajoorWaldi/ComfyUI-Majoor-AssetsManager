/**
 * Settings section: Safety + Security + Remote.
 */

import { setSecuritySettings, setRuntimeSecurityToken } from "../../api/client.js";
import { t } from "../i18n.js";
import { comfyToast } from "../toast.js";
import { _safeBool } from "./settingsUtils.js";
import {
    saveMajoorSettings,
    applySettingsToConfig,
    syncBackendSecuritySettings,
} from "./settingsCore.js";

const SETTINGS_PREFIX = "Majoor";
const SETTINGS_CATEGORY = "Majoor Assets Manager";
const MIN_RECOMMENDED_TOKEN_LENGTH = 16;

function normalizeSecurityBoolean(value) {
    return !!value;
}

function shouldSkipBooleanSecurityUpdate(currentValue, nextValue) {
    return normalizeSecurityBoolean(currentValue) === normalizeSecurityBoolean(nextValue);
}

function normalizeSecurityToken(value) {
    return typeof value === "string" ? value.trim() : "";
}

function isLoopbackHostname(hostname) {
    const value = String(hostname || "")
        .trim()
        .toLowerCase();
    return value === "localhost" || value === "127.0.0.1" || value === "::1";
}

function getRuntimeLocation() {
    return globalThis.location || globalThis.window?.location || null;
}

function shouldAllowInsecureTokenTransportByDefault() {
    const runtimeLocation = getRuntimeLocation();
    if (!runtimeLocation) return false;
    const protocol = String(runtimeLocation.protocol || "").toLowerCase();
    const hostname = String(runtimeLocation.hostname || "").trim();
    return protocol === "http:" && !isLoopbackHostname(hostname);
}

function getCryptoRandomValues(target) {
    const cryptoApi = globalThis.crypto;
    if (!cryptoApi?.getRandomValues) {
        throw new Error("Secure token generation requires crypto.getRandomValues().");
    }
    return cryptoApi.getRandomValues(target);
}

function buildRandomTokenSegment(byteCount) {
    const size = Math.max(4, Number(byteCount) || 0);
    const buffer = new Uint8Array(size);
    getCryptoRandomValues(buffer);
    return Array.from(buffer, (value) => value.toString(16).padStart(2, "0")).join("");
}

export function generateRecommendedApiToken() {
    return `mjr_${buildRandomTokenSegment(18)}`;
}

export function isRecommendedRemoteLanSecurity(security) {
    const token = String(security?.apiToken || "").trim();
    return (
        token.length >= MIN_RECOMMENDED_TOKEN_LENGTH &&
        _safeBool(security?.allowWrite, true) &&
        _safeBool(security?.requireAuth, false) &&
        !_safeBool(security?.allowRemoteWrite, false)
    );
}

export function buildRecommendedRemoteLanSecuritySettings(security) {
    const current = security && typeof security === "object" ? security : {};
    const token = String(current.apiToken || "").trim();
    return {
        apiToken: token.length >= MIN_RECOMMENDED_TOKEN_LENGTH ? token : generateRecommendedApiToken(),
        allowWrite: true,
        requireAuth: true,
        allowRemoteWrite: false,
        allowInsecureTokenTransport: shouldAllowInsecureTokenTransportByDefault(),
    };
}

function buildBackendSecurityPayload(security) {
    const sec = security || {};
    return {
        safe_mode: _safeBool(sec.safeMode, false),
        allow_write: _safeBool(sec.allowWrite, true),
        require_auth: _safeBool(sec.requireAuth, false),
        allow_remote_write: _safeBool(sec.allowRemoteWrite, true),
        allow_insecure_token_transport: _safeBool(sec.allowInsecureTokenTransport, true),
        allow_delete: _safeBool(sec.allowDelete, true),
        allow_rename: _safeBool(sec.allowRename, true),
        allow_open_in_folder: _safeBool(sec.allowOpenInFolder, true),
        allow_reset_index: _safeBool(sec.allowResetIndex, false),
        ...(String(sec.apiToken || "").trim()
            ? { api_token: String(sec.apiToken || "").trim() }
            : {}),
    };
}

function pushSecuritySettings(security) {
    return setSecuritySettings(buildBackendSecurityPayload(security));
}

function tokenFieldPlaceholder(settings) {
    const tokenHint = String(settings?.security?.tokenHint || "").trim();
    if (tokenHint) {
        return t(
            "setting.sec.token.placeholderConfigured",
            "Token configured on server ({tokenHint}). Leave blank to keep the current server token.",
            { tokenHint },
        );
    }
    if (settings?.security?.tokenConfigured) {
        return t(
            "setting.sec.token.placeholderConfiguredGeneric",
            "Token configured on server. Leave blank to keep the current server token.",
        );
    }
    return t("setting.sec.token.placeholder", "Auto-generated for this browser session.");
}

/**
 * Register all Security-related settings (Safety, Security toggles, Remote, API token).
 *
 * @param {Function} safeAddSetting - Wrapped addSetting function from the parent.
 * @param {object}   settings       - Live settings object (mutated on change).
 * @param {Function} notifyApplied  - Callback(key) to schedule change notifications.
 */
export function registerSecuritySettings(safeAddSetting, settings, notifyApplied) {
    const cat = (section, label) => [SETTINGS_CATEGORY, section, label];

    // ──────────────────────────────────────────────
    // Section: Security
    // ──────────────────────────────────────────────

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Safety.ConfirmDeletion`,
        category: cat(t("cat.security"), "Confirm before deleting"),
        name: "Confirm before deleting",
        tooltip:
            "Show a confirmation dialog before deleting files. Disabling this allows instant deletion.",
        type: "boolean",
        defaultValue: settings.safety?.confirmDeletion !== false,
        onChange: (value) => {
            if (shouldSkipBooleanSecurityUpdate(settings.safety?.confirmDeletion !== false, value)) {
                return;
            }
            settings.safety = settings.safety || {};
            settings.safety.confirmDeletion = !!value;
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("safety.confirmDeletion");
        },
    });

    const registerSecurityToggle = (key, nameKey, descKey, sectionKey = "cat.security") => {
        safeAddSetting({
            id: `${SETTINGS_PREFIX}.Security.${key}`,
            category: cat(t(sectionKey), t(nameKey).replace("Majoor: ", "")),
            name: t(nameKey),
            tooltip: t(descKey),
            type: "boolean",
            defaultValue: !!settings.security?.[key],
            onChange: (value) => {
                if (shouldSkipBooleanSecurityUpdate(settings.security?.[key], value)) {
                    return;
                }
                settings.security = settings.security || {};
                settings.security[key] = !!value;
                saveMajoorSettings(settings);
                notifyApplied(`security.${key}`);
                try {
                    pushSecuritySettings(settings.security)
                        .then((res) => {
                            if (res?.ok && res.data?.prefs) {
                                syncBackendSecuritySettings();
                            } else if (res && res.ok === false) {
                                console.warn(
                                    "[Majoor] backend security settings update failed",
                                    res.error || res,
                                );
                            }
                        })
                        .catch(() => {});
                } catch (e) {
                    console.debug?.(e);
                }
            },
        });
    };

    registerSecurityToggle("safeMode", "setting.sec.safe.name", "setting.sec.safe.desc");
    registerSecurityToggle("allowWrite", "setting.sec.write.name", "setting.sec.write.desc");
    registerSecurityToggle("allowDelete", "setting.sec.del.name", "setting.sec.del.desc");
    registerSecurityToggle("allowRename", "setting.sec.ren.name", "setting.sec.ren.desc");
    registerSecurityToggle("allowOpenInFolder", "setting.sec.open.name", "setting.sec.open.desc");
    registerSecurityToggle("allowResetIndex", "setting.sec.reset.name", "setting.sec.reset.desc");

    // ──────────────────────────────────────────────
    // Section: Remote
    // ──────────────────────────────────────────────

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Security.RemoteLanPreset`,
        category: cat(
            t("cat.remote"),
            t("setting.sec.remoteLanPreset.name").replace("Majoor: ", ""),
        ),
        name: t("setting.sec.remoteLanPreset.name"),
        tooltip: t("setting.sec.remoteLanPreset.desc"),
        type: "boolean",
        defaultValue: isRecommendedRemoteLanSecurity(settings.security),
        onChange: (value) => {
            settings.security = settings.security || {};
            if (shouldSkipBooleanSecurityUpdate(settings.security.remoteLanPreset, value)) {
                return;
            }
            settings.security.remoteLanPreset = !!value;
            if (!value) {
                saveMajoorSettings(settings);
                notifyApplied("security.remoteLanPreset");
                return;
            }

            let patch;
            try {
                patch = buildRecommendedRemoteLanSecuritySettings(settings.security);
            } catch (error) {
                comfyToast(
                    error?.message ||
                        t(
                            "toast.remoteLanPresetFailed",
                            "Failed to apply the recommended remote LAN setup.",
                        ),
                    "error",
                );
                return;
            }
            Object.assign(settings.security, patch);
            settings.security.tokenConfigured = true;
            settings.security.tokenHint = String(patch.apiToken || "").trim()
                ? `...${String(patch.apiToken).trim().slice(-4)}`
                : "";
            if (patch.apiToken) {
                setRuntimeSecurityToken(patch.apiToken);
            }
            saveMajoorSettings(settings);
            notifyApplied("security.remoteLanPreset");
            notifyApplied("security.apiToken");
            notifyApplied("security.allowWrite");
            notifyApplied("security.requireAuth");
            notifyApplied("security.allowRemoteWrite");
            notifyApplied("security.allowInsecureTokenTransport");

            try {
                pushSecuritySettings(settings.security)
                    .then((res) => {
                        if (res?.ok && res.data?.prefs) {
                            syncBackendSecuritySettings();
                            comfyToast(
                                t(
                                    "toast.remoteLanPresetApplied",
                                    "Recommended remote LAN setup applied. This browser session is now authorized for Majoor write operations.",
                                ),
                                "success",
                            );
                        } else if (res && res.ok === false) {
                            comfyToast(
                                res.error ||
                                    t(
                                        "toast.remoteLanPresetFailed",
                                        "Failed to apply the recommended remote LAN setup.",
                                    ),
                                "error",
                            );
                            console.warn(
                                "[Majoor] backend remote LAN preset update failed",
                                res.error || res,
                            );
                        }
                    })
                    .catch((error) => {
                        comfyToast(
                            error?.message ||
                                t(
                                    "toast.remoteLanPresetFailed",
                                    "Failed to apply the recommended remote LAN setup.",
                                ),
                            "error",
                        );
                    });
            } catch (e) {
                console.debug?.(e);
            }
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Security.ApiToken`,
        category: cat(t("cat.remote"), t("setting.sec.token.name").replace("Majoor: ", "")),
        name: t("setting.sec.token.name", "Majoor: API Token"),
        tooltip: t(
            "setting.sec.token.desc",
            "Store the API token used for write operations. Majoor sends it via X-MJR-Token and Authorization headers.",
        ),
        type: "text",
        defaultValue: settings.security?.apiToken || "",
        attrs: {
            placeholder: tokenFieldPlaceholder(settings),
        },
        onChange: (value) => {
            settings.security = settings.security || {};
            const nextToken = normalizeSecurityToken(value);
            if (normalizeSecurityToken(settings.security.apiToken) === nextToken) {
                return;
            }
            settings.security.apiToken = nextToken;
            if (settings.security.apiToken) {
                settings.security.tokenConfigured = true;
                settings.security.tokenHint = `...${settings.security.apiToken.slice(-4)}`;
                setRuntimeSecurityToken(settings.security.apiToken);
            }
            saveMajoorSettings(settings);
            notifyApplied("security.apiToken");
            // Skip backend call when token is empty: the token is auto-generated and
            // managed server-side, so an empty field just means "use the auto-generated one".
            if (!settings.security.apiToken) return;
            try {
                setSecuritySettings({ api_token: settings.security.apiToken })
                    .then((res) => {
                        if (res?.ok && res.data?.prefs) {
                            syncBackendSecuritySettings();
                        } else if (res && res.ok === false) {
                            console.warn("[Majoor] backend token update failed", res.error || res);
                        }
                    })
                    .catch(() => {});
            } catch (e) {
                console.debug?.(e);
            }
        },
    });

    registerSecurityToggle(
        "requireAuth",
        "setting.sec.requireAuth.name",
        "setting.sec.requireAuth.desc",
        "cat.remote",
    );

    registerSecurityToggle(
        "allowRemoteWrite",
        "setting.sec.remote.name",
        "setting.sec.remote.desc",
        "cat.remote",
    );

    registerSecurityToggle(
        "allowInsecureTokenTransport",
        "setting.sec.insecureTransport.name",
        "setting.sec.insecureTransport.desc",
        "cat.remote",
    );
}
