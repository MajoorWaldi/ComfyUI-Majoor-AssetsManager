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

    it("maxSize eviction holds under 10 000-entry flood", () => {
        const MAX = 100;
        let now = 1_000;
        const cache = createTTLCache({ ttlMs: 60_000, maxSize: MAX, now: () => now });

        for (let i = 0; i < 10_000; i++) {
            cache.set(`key-${i}`, i);
        }

        // Size must never exceed maxSize
        expect(cache.size).toBeLessThanOrEqual(MAX);

        // Only the latest MAX entries should survive (LRU-by-insertion order)
        for (let i = 10_000 - MAX; i < 10_000; i++) {
            expect(cache.get(`key-${i}`)).toBe(i);
        }
        // Earliest entries evicted
        expect(cache.get("key-0")).toBeUndefined();
        expect(cache.get(`key-${10_000 - MAX - 1}`)).toBeUndefined();
    });

    it("set-order update moves entry to end — survives subsequent eviction", () => {
        let now = 1_000;
        const cache = createTTLCache({ ttlMs: 60_000, maxSize: 3, now: () => now });

        cache.set("a", 1);
        cache.set("b", 2);
        cache.set("c", 3);

        // Re-set "a": should move it to the most-recent position
        cache.set("a", 100);

        // Adding a 4th entry should evict the oldest — "b", not "a"
        cache.set("d", 4);

        expect(cache.get("a")).toBe(100); // "a" was re-set — kept
        expect(cache.get("b")).toBeUndefined(); // oldest surviving — evicted
        expect(cache.get("c")).toBe(3);
        expect(cache.get("d")).toBe(4);
    });

    it("expired entries are pruned on get — size stays within maxSize", () => {
        let now = 1_000;
        const TTL = 500;
        const MAX = 5;
        const cache = createTTLCache({ ttlMs: TTL, maxSize: MAX, now: () => now });

        for (let i = 0; i < MAX; i++) cache.set(`e-${i}`, i);
        expect(cache.size).toBe(MAX);

        // Advance time past TTL
        now += TTL + 1;

        // All entries should be expired
        expect(cache.size).toBe(0);
        for (let i = 0; i < MAX; i++) {
            expect(cache.get(`e-${i}`)).toBeUndefined();
        }

        // Cache can accept new entries up to maxSize again
        for (let i = 0; i < MAX; i++) cache.set(`f-${i}`, i * 2);
        expect(cache.size).toBe(MAX);
    });
});
