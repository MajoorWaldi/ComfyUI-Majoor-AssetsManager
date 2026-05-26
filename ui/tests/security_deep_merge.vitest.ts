import { describe, expect, it } from "vitest";
import { deepMerge } from "../app/settings/settingsUtils.js";

describe("deepMerge prototype-pollution resistance", () => {
    it("rejects __proto__ keys in the merge source", () => {
        const base = { a: 1 };
        const malicious = JSON.parse('{"__proto__": {"polluted": true}}');
        const merged = deepMerge(base, malicious);

        expect(merged.polluted).toBeUndefined();
        expect({}.polluted).toBeUndefined();
        expect(merged.a).toBe(1);
    });

    it("rejects constructor key in the merge source", () => {
        const base = {};
        const malicious = { constructor: { prototype: { polluted: true } } };
        const merged = deepMerge(base, malicious);

        expect(Object.hasOwn(merged, "constructor")).toBe(false);
        expect({}.polluted).toBeUndefined();
    });

    it("rejects prototype key in the merge source", () => {
        const base = {};
        const malicious = { prototype: { polluted: true } };
        const merged = deepMerge(base, malicious);

        expect(merged.prototype).toBeUndefined();
    });

    it("rejects nested __proto__ keys recursively", () => {
        const base = { nested: {} };
        const malicious = { nested: JSON.parse('{"__proto__": {"deep": true}}') };
        const merged = deepMerge(base, malicious);

        expect(merged.nested.deep).toBeUndefined();
        expect({}.deep).toBeUndefined();
    });

    it("performs normal deep merge for safe keys", () => {
        const base = { a: 1, nested: { x: 10 } };
        const patch = { b: 2, nested: { y: 20 } };
        const merged = deepMerge(base, patch);

        expect(merged).toEqual({ a: 1, b: 2, nested: { x: 10, y: 20 } });
    });

    it("returns a shallow copy of base when next is null or undefined", () => {
        const base = { a: 1 };
        expect(deepMerge(base, null)).toEqual({ a: 1 });
        expect(deepMerge(base, undefined)).toEqual({ a: 1 });
    });

    it("does not mutate the original base object", () => {
        const base = { a: 1, nested: { x: 10 } };
        const patch = { nested: { y: 20 } };
        deepMerge(base, patch);

        expect(base).toEqual({ a: 1, nested: { x: 10 } });
    });

    it("overwrites arrays instead of merging them", () => {
        const base = { items: [1, 2, 3] };
        const patch = { items: [4, 5] };
        const merged = deepMerge(base, patch);

        expect(merged.items).toEqual([4, 5]);
    });
});
