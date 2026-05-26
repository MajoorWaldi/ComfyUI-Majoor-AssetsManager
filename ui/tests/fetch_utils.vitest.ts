/**
 * Standalone tests for createApiFetchClient / fetchUtils.js.
 *
 * Tests the fetch wrapper layer directly: timeout, retry, deduplication,
 * and non-JSON response handling.  Auth injection is covered separately in
 * security_client_headers.vitest.mjs.
 *
 * Each test uses vi.resetModules() + a dynamic import so the module-level
 * _pendingRequests Map starts empty and tests never interfere with each other.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readHeader(headers, name) {
    if (!headers) return null;
    if (typeof headers.get === "function") return headers.get(name);
    return headers[name] ?? null;
}

function makeJsonFetch(body, status = 200) {
    return vi.fn(async () => ({
        status,
        headers: { get: (name) => (name === "content-type" ? "application/json" : null) },
        json: async () => body,
    }));
}

function makeAbortableFetch() {
    /**
     * Returns a fetch mock that rejects with AbortError when the signal fires,
     * and never resolves otherwise.  Used to test timeout behaviour with real timers.
     */
    return vi.fn(
        (_, { signal } = {}) =>
            new Promise((resolve, reject) => {
                if (signal?.aborted) {
                    const err = new Error("Aborted");
                    err.name = "AbortError";
                    reject(err);
                    return;
                }
                if (signal) {
                    signal.addEventListener(
                        "abort",
                        () => {
                            const err = new Error("Aborted");
                            err.name = "AbortError";
                            reject(err);
                        },
                        { once: true },
                    );
                }
            }),
    );
}

async function importUtils() {
    return import("../api/fetchUtils.js");
}

function makeClient(mod, overrides = {}) {
    return mod.createApiFetchClient({
        readObsEnabled: () => false,
        readAuthToken: () => "",
        ensureWriteAuthToken: async () => "",
        normalizeWriteAuthFailure: (r) => r,
        ...overrides,
    });
}

// ---------------------------------------------------------------------------
// Module reset before every test
// ---------------------------------------------------------------------------

beforeEach(() => {
    vi.resetModules();
});

afterEach(() => {
    vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// delay()
// ---------------------------------------------------------------------------

describe("delay()", () => {
    it("resolves after the specified number of milliseconds", async () => {
        const { delay } = await importUtils();
        const start = Date.now();
        await delay(20);
        expect(Date.now() - start).toBeGreaterThanOrEqual(10);
    });

    it("resolves immediately for 0ms without throwing", async () => {
        const { delay } = await importUtils();
        await expect(delay(0)).resolves.toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// fetchAPI – timeout (real timers, short window)
// ---------------------------------------------------------------------------

describe("fetchAPI timeout", () => {
    it("returns TIMEOUT when the request exceeds timeoutMs", async () => {
        globalThis.fetch = makeAbortableFetch();
        const mod = await importUtils();
        const { fetchAPI } = makeClient(mod);

        // timeoutMs is clamped to a minimum of 1 000 ms internally.
        const result = await fetchAPI("/mjr/am/timeout-test", { timeoutMs: 1_000 });

        expect(result.ok).toBe(false);
        expect(result.code).toBe("TIMEOUT");
        expect(result.timeout_ms).toBe(1_000);
        expect(result.data).toBeNull();
    }, 4_000);
});

// ---------------------------------------------------------------------------
// fetchAPI – non-JSON / malformed response
// ---------------------------------------------------------------------------

describe("fetchAPI non-JSON response", () => {
    it("returns INVALID_RESPONSE when the server sends text/plain", async () => {
        globalThis.fetch = vi.fn(async () => ({
            status: 500,
            headers: { get: () => "text/plain" },
        }));

        const mod = await importUtils();
        const { fetchAPI } = makeClient(mod);
        const result = await fetchAPI("/mjr/am/test");

        expect(result.ok).toBe(false);
        expect(result.code).toBe("INVALID_RESPONSE");
        expect(result.status).toBe(500);
    });

    it("returns INVALID_RESPONSE when the JSON body is not an object", async () => {
        globalThis.fetch = vi.fn(async () => ({
            status: 200,
            headers: { get: (name) => (name === "content-type" ? "application/json" : null) },
            json: async () => null,
        }));

        const mod = await importUtils();
        const { fetchAPI } = makeClient(mod);
        const result = await fetchAPI("/mjr/am/test");

        expect(result.ok).toBe(false);
        expect(result.code).toBe("INVALID_RESPONSE");
    });

    it("returns INVALID_RESPONSE when json() throws a parse error", async () => {
        globalThis.fetch = vi.fn(async () => ({
            status: 200,
            headers: { get: (name) => (name === "content-type" ? "application/json" : null) },
            json: async () => {
                throw new SyntaxError("Unexpected token");
            },
        }));

        const mod = await importUtils();
        const { fetchAPI } = makeClient(mod);
        const result = await fetchAPI("/mjr/am/test");

        expect(result.ok).toBe(false);
        expect(result.code).toBe("INVALID_RESPONSE");
    });
});

// ---------------------------------------------------------------------------
// fetchAPI – retry on network error
// ---------------------------------------------------------------------------

describe("fetchAPI retry on network error", () => {
    it("retries on TypeError network failure and succeeds on third attempt", async () => {
        let calls = 0;
        globalThis.fetch = vi.fn(async () => {
            calls += 1;
            if (calls <= 2) throw new TypeError("Failed to fetch");
            return {
                status: 200,
                headers: { get: (name) => (name === "content-type" ? "application/json" : null) },
                json: async () => ({ ok: true, data: { retried: true } }),
            };
        });

        const mod = await importUtils();
        vi.spyOn(mod, "delay").mockResolvedValue(undefined);

        const { fetchAPI } = makeClient(mod);
        const result = await fetchAPI("/mjr/am/retry-test");

        expect(calls).toBe(3);
        expect(result.ok).toBe(true);
    });

    it("returns NETWORK_ERROR with retries count after exhausting all retries", async () => {
        globalThis.fetch = vi.fn(async () => {
            throw new TypeError("Failed to fetch");
        });

        const mod = await importUtils();
        vi.spyOn(mod, "delay").mockResolvedValue(undefined);

        const { fetchAPI } = makeClient(mod);
        const result = await fetchAPI("/mjr/am/retry-exhaust");

        expect(result.ok).toBe(false);
        expect(result.code).toBe("NETWORK_ERROR");
        // 1 original + 3 retries = 4 total calls
        expect(globalThis.fetch).toHaveBeenCalledTimes(4);
        expect(result.retries).toBe(3);
    });

    it("does not retry AbortError (non-retryable)", async () => {
        const abortError = new Error("Aborted");
        abortError.name = "AbortError";
        globalThis.fetch = vi.fn(async () => {
            throw abortError;
        });

        const mod = await importUtils();
        const { fetchAPI } = makeClient(mod);
        const result = await fetchAPI("/mjr/am/no-retry");

        // AbortError → single attempt, no retry
        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
        expect(result.ok).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// get() – request deduplication
// ---------------------------------------------------------------------------

describe("get() request deduplication", () => {
    it("issues only one fetch for two concurrent identical GET requests", async () => {
        let resolveFetch;
        const blocker = new Promise((resolve) => {
            resolveFetch = resolve;
        });
        globalThis.fetch = vi.fn(() => blocker);

        const mod = await importUtils();
        const { get } = makeClient(mod);

        const p1 = get("/mjr/am/dedup-test");
        const p2 = get("/mjr/am/dedup-test");

        // Settle the fetch
        resolveFetch({
            status: 200,
            headers: { get: (name) => (name === "content-type" ? "application/json" : null) },
            json: async () => ({ ok: true, data: { id: 1 } }),
        });

        const [r1, r2] = await Promise.all([p1, p2]);

        expect(r1.ok).toBe(true);
        expect(r2.ok).toBe(true);
        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it("issues a second fetch after the first completes", async () => {
        globalThis.fetch = makeJsonFetch({ ok: true, data: [] });

        const mod = await importUtils();
        const { get } = makeClient(mod);

        await get("/mjr/am/sequential");
        await get("/mjr/am/sequential");

        expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });

    it("bypasses deduplication when dedupe:false is passed", async () => {
        let resolveFetch;
        const blocker = new Promise((resolve) => {
            resolveFetch = resolve;
        });
        globalThis.fetch = vi.fn(() => blocker);

        const mod = await importUtils();
        const { get } = makeClient(mod);

        const p1 = get("/mjr/am/no-dedup");
        const p2 = get("/mjr/am/no-dedup", { dedupe: false });

        // Both are in-flight — fetch should have been called twice
        await Promise.resolve(); // flush microtasks
        await Promise.resolve();

        resolveFetch({
            status: 200,
            headers: { get: (name) => (name === "content-type" ? "application/json" : null) },
            json: async () => ({ ok: true, data: null }),
        });
        await Promise.all([p1, p2]);

        expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });
});

// ---------------------------------------------------------------------------
// post() – basic smoke test
// ---------------------------------------------------------------------------

describe("post()", () => {
    it("sends a JSON body and returns the parsed response", async () => {
        globalThis.fetch = makeJsonFetch({ ok: true, data: { created: true } });

        const mod = await importUtils();
        const { post } = makeClient(mod);
        const result = await post("/mjr/am/asset/rating", { rating: 4 });

        expect(result.ok).toBe(true);
        const [, opts] = globalThis.fetch.mock.calls[0];
        expect(opts.method).toBe("POST");
        expect(JSON.parse(opts.body)).toEqual({ rating: 4 });
        expect(readHeader(opts.headers, "Content-Type")).toBe("application/json");
    });

    it("returns NETWORK_ERROR when fetch throws on a POST", async () => {
        globalThis.fetch = vi.fn(async () => {
            throw new TypeError("Failed to fetch");
        });

        const mod = await importUtils();
        vi.spyOn(mod, "delay").mockResolvedValue(undefined);

        const { post } = makeClient(mod);
        const result = await post("/mjr/am/asset/tags", { tags: [] });

        expect(result.ok).toBe(false);
        expect(result.code).toBe("NETWORK_ERROR");
    });
});
