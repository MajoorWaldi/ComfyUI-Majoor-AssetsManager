import { describe, expect, it } from "vitest";

import { createTTLCache } from "../utils/ttlCache.js";

describe("createTTLCache", () => {
    it("expires entries after ttl", () => {
        let now = 1_000;
        const cache = createTTLCache({ ttlMs: 100, maxSize: 10, now: () => now });

        cache.set("a", 1);
        expect(cache.get("a")).toBe(1);

        now = 1_150;
        expect(cache.get("a")).toBeUndefined();
        expect(cache.size).toBe(0);
    });

    it("evicts oldest entries when max size is exceeded", () => {
        let now = 1_000;
        const cache = createTTLCache({ ttlMs: 1_000, maxSize: 2, now: () => now });

        cache.set("a", 1, { at: now });
        now += 1;
        cache.set("b", 2, { at: now });
        now += 1;
        cache.set("c", 3, { at: now });

        expect(cache.get("a")).toBeUndefined();
        expect(cache.get("b")).toBe(2);
        expect(cache.get("c")).toBe(3);
        expect(cache.keys()).toEqual(["b", "c"]);
    });

    it("supports dynamic ttl and explicit timestamps", () => {
        let now = 5_000;
        let ttl = 500;
        const cache = createTTLCache({ ttlMs: () => ttl, maxSize: 5, now: () => now });

        cache.set("prompt-1", 4_000, { at: 4_000 });
        expect(cache.get("prompt-1")).toBeUndefined();

        ttl = 2_000;
        cache.set("prompt-2", 4_800, { at: 4_800 });
        expect(cache.get("prompt-2")).toBe(4_800);

        now = 7_000;
        expect(cache.get("prompt-2")).toBeUndefined();
    });
});
