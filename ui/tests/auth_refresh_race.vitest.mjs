/**
 * Race-condition tests for concurrent write operations during auth token refresh.
 *
 * These tests verify that:
 *   1. Only one bootstrap request is issued when multiple writes land simultaneously.
 *   2. All concurrent callers eventually receive a valid token.
 *   3. A refresh that fails under concurrent load doesn't leave one caller
 *      stuck with a stale/empty token while another succeeds.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const RUNTIME_TOKEN_KEY = "__mjr_write_token";
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
    };
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
    globalThis.app = { extensionManager: { toast: { add: vi.fn() } } };
});

afterEach(() => {
    vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Concurrent bootstrap — single fetch
// ---------------------------------------------------------------------------

describe("concurrent auth bootstrap", () => {
    it("issues only one bootstrap request when multiple writes fire simultaneously", async () => {
        let bootstrapResolve;
        const bootstrapPromise = new Promise((resolve) => {
            bootstrapResolve = resolve;
        });
        let bootstrapCalls = 0;

        globalThis.fetch = vi.fn(async (url) => {
            if (String(url).includes("bootstrap-token")) {
                bootstrapCalls += 1;
                await bootstrapPromise;
                return {
                    status: 200,
                    headers: { get: (n) => (n === "content-type" ? "application/json" : null) },
                    json: async () => ({ ok: true, data: { token: "race_token_abc" } }),
                };
            }
            const sentToken =
                typeof url === "string" && url.includes("asset") ? "race_token_abc" : "";
            return {
                status: sentToken ? 200 : 401,
                headers: { get: (n) => (n === "content-type" ? "application/json" : null) },
                json: async () =>
                    sentToken
                        ? { ok: true, data: { asset_id: 1 } }
                        : { ok: false, code: "AUTH_REQUIRED", error: "no token" },
            };
        });

        const { default: client } = await import("../api/client.js")
            .then((m) => ({ default: m }))
            .catch(() => import("../api/client.js").then((m) => ({ default: m })));
        const c = await import("../api/client.js");

        // Fire three concurrent write operations before the bootstrap resolves.
        const p1 = c.updateAssetRating(1, 5);
        const p2 = c.updateAssetRating(2, 4);
        const p3 = c.updateAssetRating(3, 3);

        // Let the promises start resolving
        await Promise.resolve();
        await Promise.resolve();

        // Exactly one bootstrap call should be in-flight.
        expect(bootstrapCalls).toBe(1);

        // Resolve the bootstrap
        bootstrapResolve();
        await Promise.all([p1, p2, p3]);

        // Still only one bootstrap call total
        expect(bootstrapCalls).toBe(1);
        expect(globalThis.sessionStorage.getItem(RUNTIME_TOKEN_KEY)).toBe("race_token_abc");
    });

    it("all concurrent callers get a result even when bootstrap fails", async () => {
        globalThis.fetch = vi.fn(async (url) => {
            if (String(url).includes("bootstrap-token")) {
                return {
                    status: 403,
                    headers: { get: (n) => (n === "content-type" ? "application/json" : null) },
                    json: async () => ({
                        ok: false,
                        code: "BOOTSTRAP_DISABLED",
                        error: "Bootstrap disabled on remote clients.",
                    }),
                };
            }
            return {
                status: 401,
                headers: { get: (n) => (n === "content-type" ? "application/json" : null) },
                json: async () => ({ ok: false, code: "AUTH_REQUIRED", error: "no token" }),
            };
        });

        const c = await import("../api/client.js");

        const results = await Promise.all([
            c.updateAssetRating(1, 5),
            c.updateAssetRating(2, 4),
            c.updateAssetRating(3, 3),
        ]);

        // Every caller must receive a result (no hanging promises / uncaught errors)
        expect(results).toHaveLength(3);
        for (const result of results) {
            expect(typeof result).toBe("object");
            expect(result).not.toBeNull();
            expect(result.ok).toBe(false);
        }
    });
});

// ---------------------------------------------------------------------------
// Concurrent tag writes share a single dedup key per endpoint
// ---------------------------------------------------------------------------

describe("concurrent tag writes", () => {
    it("sends separate requests for different asset IDs", async () => {
        const token = "concurrent_tag_token";
        globalThis.sessionStorage.setItem(RUNTIME_TOKEN_KEY, token);

        globalThis.fetch = vi.fn(async () => ({
            status: 200,
            headers: { get: (n) => (n === "content-type" ? "application/json" : null) },
            json: async () => ({ ok: true, data: { tags: [] } }),
        }));

        const c = await import("../api/client.js");

        await Promise.all([
            c.updateAssetTags(1, ["a"]),
            c.updateAssetTags(2, ["b"]),
            c.updateAssetTags(3, ["c"]),
        ]);

        // POST requests are not deduplicated — 3 writes = 3 fetch calls
        const tagCalls = globalThis.fetch.mock.calls.filter(([url]) =>
            String(url).includes("/asset/tags"),
        );
        expect(tagCalls).toHaveLength(3);
    });
});
