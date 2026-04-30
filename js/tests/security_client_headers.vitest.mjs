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
            store.delete(key);
        },
    };
}

function readHeader(headers, name) {
    if (!headers) return null;
    if (typeof headers.get === "function") return headers.get(name);
    return headers[name] ?? null;
}

describe("api client security headers", () => {
    let client;

    beforeEach(async () => {
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
            json: async () => ({ ok: true, data: {} }),
        }));
        client = await import("../api/client.js");
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("adds X-Requested-With header on POST (write) requests", async () => {
        await client.post("/mjr/am/test", { foo: 1 });

        // POST may trigger an auth bootstrap fetch before the actual request
        const calls = globalThis.fetch.mock.calls;
        const postCall = calls.find(([, opts]) => (opts?.method || "").toUpperCase() === "POST");
        expect(postCall).toBeTruthy();
        const xrw = readHeader(postCall[1].headers, "X-Requested-With");
        expect(xrw).toBe("XMLHttpRequest");
    });

    it("does not add X-Requested-With header on GET (read) requests", async () => {
        await client.get("/mjr/am/test");

        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
        const [, callOptions] = globalThis.fetch.mock.calls[0];
        const xrw = readHeader(callOptions.headers, "X-Requested-With");
        expect(xrw).toBeNull();
    });

    it("injects X-MJR-Token and Authorization when a token is available", async () => {
        const token = "mjr_test_token_abc123";
        client.setRuntimeSecurityToken(token);

        await client.post("/mjr/am/test", {});

        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
        const [, callOptions] = globalThis.fetch.mock.calls[0];
        const mjrToken = readHeader(callOptions.headers, "X-MJR-Token");
        const authHeader = readHeader(callOptions.headers, "Authorization");
        expect(mjrToken).toBe(token);
        expect(authHeader).toBe(`Bearer ${token}`);
    });

    it("does not leak token into unrelated header fields", async () => {
        const token = "mjr_secret_12345";
        client.setRuntimeSecurityToken(token);

        await client.post("/mjr/am/test", {});

        const [, callOptions] = globalThis.fetch.mock.calls[0];
        const cookie = readHeader(callOptions.headers, "Cookie");
        expect(cookie).toBeNull();
    });

    it("never sends credentials in URL query parameters", async () => {
        const token = "mjr_secret_99999";
        client.setRuntimeSecurityToken(token);

        await client.get("/mjr/am/assets?page=1");

        const [callUrl] = globalThis.fetch.mock.calls[0];
        expect(String(callUrl)).not.toContain(token);
    });
});
