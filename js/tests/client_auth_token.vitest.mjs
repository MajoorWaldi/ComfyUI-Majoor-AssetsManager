/**
 * Unit tests for clientAuth.js — token persistence, migration, and invalidation.
 *
 * These tests focus on the token lifecycle: reading, writing, migrating from
 * legacy localStorage, and clearing tokens from sessionStorage.  Write-auth
 * bootstrap and toast notifications are covered in api_client_dedupe.vitest.mjs.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const RUNTIME_TOKEN_KEY = "__mjr_write_token";
// Must match SETTINGS_KEY from js/app/settingsStore.js
const SETTINGS_KEY = "mjrSettings";

// ---------------------------------------------------------------------------
// Storage factory (shared between tests)
// ---------------------------------------------------------------------------

function makeStorage() {
    const store = new Map();
    return {
        getItem(key) {
            return store.has(key) ? store.get(key) : null;
        },
        setItem(key, value) {
            store.set(String(key), String(value));
        },
        removeItem(key) {
            store.delete(String(key));
        },
        _store: store,
    };
}

// ---------------------------------------------------------------------------
// Module setup helpers
// ---------------------------------------------------------------------------

async function loadAuth() {
    return import("../api/clientAuth.js");
}

beforeEach(() => {
    vi.resetModules();
    globalThis.localStorage = makeStorage();
    globalThis.sessionStorage = makeStorage();
    globalThis.window = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        location: { origin: "http://localhost" },
    };
    globalThis.CustomEvent = class {
        constructor(type, init) {
            this.type = type;
            this.detail = init?.detail;
        }
    };
    // Default: bootstrap endpoint returns no token
    globalThis.fetch = vi.fn(async () => ({
        status: 200,
        headers: { get: (name) => (name === "content-type" ? "application/json" : null) },
        json: async () => ({ ok: true, data: {} }),
    }));
    // toast mock
    globalThis.app = { extensionManager: { toast: { add: vi.fn() } } };
});

afterEach(() => {
    vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// setRuntimeSecurityToken + readAuthToken
// ---------------------------------------------------------------------------

describe("setRuntimeSecurityToken", () => {
    it("persists the token in sessionStorage", async () => {
        const { setRuntimeSecurityToken } = await loadAuth();
        setRuntimeSecurityToken("mjr_abc123");
        expect(globalThis.sessionStorage.getItem(RUNTIME_TOKEN_KEY)).toBe("mjr_abc123");
    });

    it("returns true on success", async () => {
        const { setRuntimeSecurityToken } = await loadAuth();
        expect(setRuntimeSecurityToken("mjr_abc123")).toBe(true);
    });

    it("returns false for empty / whitespace-only input", async () => {
        const { setRuntimeSecurityToken } = await loadAuth();
        expect(setRuntimeSecurityToken("")).toBe(false);
        expect(setRuntimeSecurityToken("   ")).toBe(false);
        expect(setRuntimeSecurityToken(null)).toBe(false);
    });

    it("trims surrounding whitespace before storing", async () => {
        const { setRuntimeSecurityToken } = await loadAuth();
        setRuntimeSecurityToken("  mjr_trimmed  ");
        expect(globalThis.sessionStorage.getItem(RUNTIME_TOKEN_KEY)).toBe("mjr_trimmed");
    });
});

describe("readAuthToken", () => {
    it("reads a token previously stored with setRuntimeSecurityToken", async () => {
        const { setRuntimeSecurityToken, readAuthToken } = await loadAuth();
        setRuntimeSecurityToken("mjr_session_token");
        expect(readAuthToken()).toBe("mjr_session_token");
    });

    it("returns empty string when no token is stored", async () => {
        const { readAuthToken } = await loadAuth();
        expect(readAuthToken()).toBe("");
    });

    it("prefers sessionStorage over localStorage settings", async () => {
        globalThis.sessionStorage.setItem(RUNTIME_TOKEN_KEY, "session_token");
        const settings = { security: { apiToken: "local_token" } };
        globalThis.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

        const { readAuthToken } = await loadAuth();
        expect(readAuthToken()).toBe("session_token");
    });
});

// ---------------------------------------------------------------------------
// Legacy localStorage migration
// ---------------------------------------------------------------------------

describe("readAuthToken – localStorage migration", () => {
    it("migrates a legacy apiToken from localStorage to sessionStorage", async () => {
        const settings = { security: { apiToken: "mjr_legacy_token" } };
        globalThis.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

        const { readAuthToken } = await loadAuth();
        const token = readAuthToken();

        expect(token).toBe("mjr_legacy_token");
        expect(globalThis.sessionStorage.getItem(RUNTIME_TOKEN_KEY)).toBe("mjr_legacy_token");
    });

    it("wipes the apiToken from localStorage after migration", async () => {
        const settings = { security: { apiToken: "mjr_legacy_wipe" } };
        globalThis.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

        const { readAuthToken } = await loadAuth();
        readAuthToken();

        const stored = JSON.parse(globalThis.localStorage.getItem(SETTINGS_KEY) || "{}");
        expect(String(stored?.security?.apiToken || "")).toBe("");
    });
});

// ---------------------------------------------------------------------------
// Token clearing (sessionStorage)
// ---------------------------------------------------------------------------

describe("ensureWriteAuthToken with force=true clears stale sessionStorage token", () => {
    it("removes the sessionStorage token when bootstrap refreshes only the cookie (no new token)", async () => {
        // Bootstrap returns ok:true but no token → cookie-only refresh
        globalThis.fetch = vi.fn(async (url) => {
            if (String(url).includes("bootstrap-token")) {
                return {
                    status: 200,
                    headers: {
                        get: (name) => (name === "content-type" ? "application/json" : null),
                    },
                    json: async () => ({ ok: true, data: {} }), // no token field
                };
            }
            return {
                status: 200,
                headers: { get: (name) => (name === "content-type" ? "application/json" : null) },
                json: async () => ({ ok: true, data: null }),
            };
        });

        globalThis.sessionStorage.setItem(RUNTIME_TOKEN_KEY, "stale_token");

        const { ensureWriteAuthToken } = await loadAuth();
        await ensureWriteAuthToken({ force: true });

        expect(globalThis.sessionStorage.getItem(RUNTIME_TOKEN_KEY)).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// invalidateAuthTokenCache
// ---------------------------------------------------------------------------

describe("invalidateAuthTokenCache", () => {
    it("forces readAuthToken to re-read from sessionStorage after invalidation", async () => {
        const { setRuntimeSecurityToken, readAuthToken, invalidateAuthTokenCache } =
            await loadAuth();

        setRuntimeSecurityToken("initial_token");
        expect(readAuthToken()).toBe("initial_token"); // cached

        // Directly update sessionStorage (bypassing the module API)
        globalThis.sessionStorage.setItem(RUNTIME_TOKEN_KEY, "updated_token");

        // Without invalidation the TTL cache still returns the old value
        expect(readAuthToken()).toBe("initial_token");

        invalidateAuthTokenCache();
        expect(readAuthToken()).toBe("updated_token");
    });
});

// ---------------------------------------------------------------------------
// setRuntimeSecurityToken — token format validation (RFC 6750 token68)
// ---------------------------------------------------------------------------

describe("setRuntimeSecurityToken token format validation", () => {
    it("accepts a standard mjr_ prefixed hex token", async () => {
        const { setRuntimeSecurityToken, readAuthToken } = await loadAuth();
        const token = "mjr_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6";
        expect(setRuntimeSecurityToken(token)).toBe(true);
        expect(readAuthToken()).toBe(token);
    });

    it("accepts alphanumeric tokens with dots, hyphens, underscores", async () => {
        const { setRuntimeSecurityToken } = await loadAuth();
        expect(setRuntimeSecurityToken("token.with-dots_and.dashes")).toBe(true);
        expect(setRuntimeSecurityToken("ABC123")).toBe(true);
        expect(setRuntimeSecurityToken("a")).toBe(true);
    });

    it("accepts RFC 6750 base64url-like tokens (tilde, plus, slash, equals)", async () => {
        const { setRuntimeSecurityToken } = await loadAuth();
        // Characters allowed by the token68 charset used in Authorization: Bearer
        expect(setRuntimeSecurityToken("abc~def+ghi/jkl=")).toBe(true);
    });

    it("rejects tokens containing internal spaces", async () => {
        const { setRuntimeSecurityToken } = await loadAuth();
        // Internal spaces break the Authorization: Bearer header value
        expect(setRuntimeSecurityToken("token with space")).toBe(false);
        expect(setRuntimeSecurityToken("two  spaces")).toBe(false);
        // Note: leading/trailing whitespace is trimmed before validation (see trim test above)
    });

    it("rejects tokens containing control characters", async () => {
        const { setRuntimeSecurityToken } = await loadAuth();
        expect(setRuntimeSecurityToken("tok\nen")).toBe(false);
        expect(setRuntimeSecurityToken("tok\x00en")).toBe(false);
        expect(setRuntimeSecurityToken("tok\ten")).toBe(false);
    });

    it("rejects tokens containing injection-relevant characters", async () => {
        const { setRuntimeSecurityToken } = await loadAuth();
        // Characters that could break an Authorization header value
        expect(setRuntimeSecurityToken('tok"en')).toBe(false);
        expect(setRuntimeSecurityToken("tok,en")).toBe(false);
        expect(setRuntimeSecurityToken("tok;en")).toBe(false);
        expect(setRuntimeSecurityToken("tok@en")).toBe(false);
    });

    it("does not store a rejected token in sessionStorage", async () => {
        const { setRuntimeSecurityToken } = await loadAuth();
        setRuntimeSecurityToken("bad token!");
        expect(globalThis.sessionStorage.getItem(RUNTIME_TOKEN_KEY)).toBeNull();
    });
});
