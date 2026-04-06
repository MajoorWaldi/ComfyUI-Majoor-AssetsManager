import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
    };
}

describe("api client request deduplication", () => {
    beforeEach(() => {
        vi.resetModules();
        globalThis.localStorage = makeStorage();
        globalThis.sessionStorage = makeStorage();
        const toastAdd = vi.fn();
        globalThis.app = { ui: {}, extensionManager: { toast: { add: toastAdd } } };
        globalThis.window = {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
            location: { origin: "http://localhost" },
            app: globalThis.app,
        };
        globalThis.CustomEvent = class {
            constructor(type, init) {
                this.type = type;
                this.detail = init?.detail;
            }
        };
        globalThis.fetch = vi.fn(async () => ({
            status: 200,
            headers: { get: (name) => (name === "content-type" ? "application/json" : null) },
            json: async () => ({ ok: true, data: { id: 7 } }),
        }));
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("shares the same in-flight promise for duplicate asset metadata requests", async () => {
        let resolveFetch;
        const fetchPromise = new Promise((resolve) => {
            resolveFetch = resolve;
        });
        globalThis.fetch = vi.fn(() => fetchPromise);

        const client = await import("../api/client.js");
        const first = client.getAssetMetadata(7);
        const _second = client.getAssetMetadata(7);

        expect(globalThis.fetch).toHaveBeenCalledTimes(0);
        await Promise.resolve();
        expect(globalThis.fetch).toHaveBeenCalledTimes(1);

        resolveFetch({
            status: 200,
            headers: { get: (name) => (name === "content-type" ? "application/json" : null) },
            json: async () => ({ ok: true, data: { id: 7 } }),
        });

        const result = await first;
        expect(result.ok).toBe(true);

        await client.getAssetMetadata(7);
        expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });

    it("clears the pending entry after a rejected request", async () => {
        globalThis.fetch = vi.fn(async () => ({
            status: 500,
            headers: { get: (name) => (name === "content-type" ? "application/json" : null) },
            json: async () => ({ ok: false, error: "server sad" }),
        }));

        const client = await import("../api/client.js");
        const first = await client.vectorFindSimilar(5, 10);
        const second = await client.vectorFindSimilar(5, 10);

        expect(first.ok).toBe(false);
        expect(second.ok).toBe(false);
        expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });

    it("invalidates the available tags cache after a successful tag update", async () => {
        globalThis.fetch = vi.fn(async (url) => {
            if (String(url).includes("/mjr/am/tags")) {
                return {
                    status: 200,
                    headers: { get: (name) => (name === "content-type" ? "application/json" : null) },
                    json: async () => ({ ok: true, data: ["old-tag"] }),
                };
            }
            if (String(url).includes("/mjr/am/asset/tags")) {
                return {
                    status: 200,
                    headers: { get: (name) => (name === "content-type" ? "application/json" : null) },
                    json: async () => ({ ok: true, data: { asset_id: 7, tags: [] } }),
                };
            }
            return {
                status: 200,
                headers: { get: (name) => (name === "content-type" ? "application/json" : null) },
                json: async () => ({ ok: true, data: null }),
            };
        });

        const client = await import("../api/client.js");

        const first = await client.getAvailableTags();
        expect(first.ok).toBe(true);
        expect(first.data).toEqual(["old-tag"]);

        await client.updateAssetTags(7, []);
        await client.getAvailableTags();

        const tagFetches = globalThis.fetch.mock.calls.filter(([url]) =>
            String(url).includes("/mjr/am/tags"),
        );
        expect(tagFetches).toHaveLength(2);
    });

    it("rewrites bootstrap auth failures into actionable write guidance", async () => {
        globalThis.fetch = vi.fn(async (url) => {
            if (String(url).includes("/mjr/am/settings/security/bootstrap-token")) {
                return {
                    status: 403,
                    headers: { get: (name) => (name === "content-type" ? "application/json" : null) },
                    json: async () => ({
                        ok: false,
                        code: "BOOTSTRAP_DISABLED",
                        error: "Bootstrap token is disabled for remote clients unless an authenticated ComfyUI user is requesting initial provisioning.",
                    }),
                };
            }
            if (String(url).includes("/mjr/am/asset/tags")) {
                return {
                    status: 401,
                    headers: { get: (name) => (name === "content-type" ? "application/json" : null) },
                    json: async () => ({
                        ok: false,
                        code: "AUTH_REQUIRED",
                        error: "Write operation blocked: missing or invalid API token.",
                    }),
                };
            }
            return {
                status: 200,
                headers: { get: (name) => (name === "content-type" ? "application/json" : null) },
                json: async () => ({ ok: true, data: null }),
            };
        });

        const client = await import("../api/client.js");
        const result = await client.updateAssetTags(7, ["remote"]);

        expect(result.ok).toBe(false);
        expect(result.error).toContain("Sign in to ComfyUI");
        expect(result.error).toContain("Settings -> Security");
        expect(globalThis.app.extensionManager.toast.add).toHaveBeenCalledTimes(1);
        const [payload] = globalThis.app.extensionManager.toast.add.mock.calls[0];
        expect(String(payload?.summary || "")).toContain("Majoor remote write access");
        expect(String(payload?.detail || "")).toContain("Sign in to ComfyUI");
    });
});
