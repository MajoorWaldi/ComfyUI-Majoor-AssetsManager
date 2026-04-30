import { beforeEach, describe, expect, it, vi } from "vitest";
import { getRuntimeState, setRuntimeStatePatch } from "../app/runtimeState.js";

describe("runtimeState prototype-pollution resistance", () => {
    beforeEach(() => {
        const state = getRuntimeState();
        for (const key of Object.keys(state)) {
            delete state[key];
        }
        Object.assign(state, {
            api: null,
            assetsDeletedHandler: null,
            enrichmentActive: false,
            enrichmentQueueLength: 0,
        });
    });

    it("blocks __proto__ key from being set via patch", () => {
        const proto = Object.getPrototypeOf({});
        const patch = JSON.parse('{"__proto__": {"polluted": true}}');
        setRuntimeStatePatch(patch);

        expect({}.polluted).toBeUndefined();
        expect(Object.getPrototypeOf({})).toBe(proto);
    });

    it("blocks constructor key from being set via patch", () => {
        setRuntimeStatePatch({ constructor: "evil" });

        const state = getRuntimeState();
        expect(Object.hasOwn(state, "constructor")).toBe(false);
    });

    it("blocks prototype key from being set via patch", () => {
        setRuntimeStatePatch({ prototype: { polluted: true } });

        const state = getRuntimeState();
        expect(state.prototype).toBeUndefined();
    });

    it("applies safe keys normally", () => {
        setRuntimeStatePatch({ enrichmentActive: true, enrichmentQueueLength: 5 });

        const state = getRuntimeState();
        expect(state.enrichmentActive).toBe(true);
        expect(state.enrichmentQueueLength).toBe(5);
    });

    it("handles null/undefined patch gracefully", () => {
        expect(() => setRuntimeStatePatch(null)).not.toThrow();
        expect(() => setRuntimeStatePatch(undefined)).not.toThrow();
        expect(() => setRuntimeStatePatch()).not.toThrow();
    });

    it("uses Symbol key so state is not enumerable on globalThis", () => {
        getRuntimeState();
        const keys = Object.keys(globalThis);
        const hasPlainKey = keys.some((k) => k.includes("runtime_state") || k.includes("majoor"));
        expect(hasPlainKey).toBe(false);
    });
});
