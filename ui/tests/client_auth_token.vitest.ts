/**
 * Unit tests for clientAuth.js - token retention, migration, and invalidation.
 *
 * These tests focus on the token lifecycle: reading, writing, loading from
 * legacy localStorage, and clearing memory tokens. Write-auth bootstrap and
 * toast notifications are covered in api_client_dedupe.vitest.ts.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Must match SETTINGS_KEY from ui/app/settingsStore.js
const SETTINGS_KEY = "mjrSettings";

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

async function loadAuth() {
    return import("../api/clientAuth.js");
}

beforeEach(() => {
    vi.resetModules();
    globalThis.localStorage = makeStorage() as any;
    globalThis.sessionStorage = makeStorage() as any;
    globalThis.window = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        location: { origin: "http://localhost" } as any,
    } as any;
    globalThis.CustomEvent = class {
        constructor(type, init) {
            (this as any).type = type;
            (this as any).detail = init?.detail;
        }
    } as any;
    globalThis.fetch = vi.fn(async () => ({
        status: 200,
        headers: { get: (name) => (name === "content-type" ? "application/json" : null) },
        json: async () => ({ ok: true, data: {} }),
    })) as any;
    globalThis.app = { extensionManager: { toast: { add: vi.fn() } } };
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("setRuntimeSecurityToken", () => {
    it("retains the token in module memory", async () => {
        const { setRuntimeSecurityToken, readAuthToken } = await loadAuth();
        setRuntimeSecurityToken("mjr_abc123");
        expect(readAuthToken()).toBe("mjr_abc123");
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
        const { setRuntimeSecurityToken, readAuthToken } = await loadAuth();
        setRuntimeSecurityToken("  mjr_trimmed  ");
        expect(readAuthToken()).toBe("mjr_trimmed");
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

    it("prefers runtime memory over localStorage settings", async () => {
        const settings = { security: { apiToken: "local_token" } };
        globalThis.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

        const { setRuntimeSecurityToken, readAuthToken } = await loadAuth();
        setRuntimeSecurityToken("runtime_token");
        expect(readAuthToken()).toBe("runtime_token");
    });
});

describe("readAuthToken - localStorage migration", () => {
    it("loads a legacy apiToken from localStorage into memory", async () => {
        const settings = { security: { apiToken: "mjr_legacy_token" } };
        globalThis.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

        const { readAuthToken } = await loadAuth();
        expect(readAuthToken()).toBe("mjr_legacy_token");
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

describe("ensureWriteAuthToken with force=true clears stale runtime token", () => {
    it("removes the memory token when bootstrap refreshes only the cookie", async () => {
        globalThis.fetch = vi.fn(async (url) => {
            if (String(url).includes("bootstrap-token")) {
                return {
                    status: 200,
                    headers: {
                        get: (name) => (name === "content-type" ? "application/json" : null),
                    },
                    json: async () => ({ ok: true, data: {} }),
                };
            }
            return {
                status: 200,
                headers: { get: (name) => (name === "content-type" ? "application/json" : null) },
                json: async () => ({ ok: true, data: null }),
            };
        }) as any;

        const { ensureWriteAuthToken, setRuntimeSecurityToken, readAuthToken } = await loadAuth();
        setRuntimeSecurityToken("stale_token");
        await ensureWriteAuthToken({ force: true });

        expect(readAuthToken()).toBe("");
    });
});

describe("invalidateAuthTokenCache", () => {
    it("keeps the memory token readable after cache invalidation", async () => {
        const { setRuntimeSecurityToken, readAuthToken, invalidateAuthTokenCache } =
            await loadAuth();

        setRuntimeSecurityToken("initial_token");
        expect(readAuthToken()).toBe("initial_token");

        invalidateAuthTokenCache();
        expect(readAuthToken()).toBe("initial_token");
    });
});

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

    it("accepts RFC 6750 base64url-like tokens", async () => {
        const { setRuntimeSecurityToken } = await loadAuth();
        expect(setRuntimeSecurityToken("abc~def+ghi/jkl=")).toBe(true);
    });

    it("rejects tokens containing internal spaces", async () => {
        const { setRuntimeSecurityToken } = await loadAuth();
        expect(setRuntimeSecurityToken("token with space")).toBe(false);
        expect(setRuntimeSecurityToken("two  spaces")).toBe(false);
    });

    it("rejects tokens containing control characters", async () => {
        const { setRuntimeSecurityToken } = await loadAuth();
        expect(setRuntimeSecurityToken("tok\nen")).toBe(false);
        expect(setRuntimeSecurityToken("tok\x00en")).toBe(false);
        expect(setRuntimeSecurityToken("tok\ten")).toBe(false);
    });

    it("rejects tokens containing injection-relevant characters", async () => {
        const { setRuntimeSecurityToken } = await loadAuth();
        expect(setRuntimeSecurityToken('tok"en')).toBe(false);
        expect(setRuntimeSecurityToken("tok,en")).toBe(false);
        expect(setRuntimeSecurityToken("tok;en")).toBe(false);
        expect(setRuntimeSecurityToken("tok@en")).toBe(false);
    });

    it("does not retain a rejected token", async () => {
        const { setRuntimeSecurityToken, readAuthToken } = await loadAuth();
        setRuntimeSecurityToken("bad token!");
        expect(readAuthToken()).toBe("");
    });
});
