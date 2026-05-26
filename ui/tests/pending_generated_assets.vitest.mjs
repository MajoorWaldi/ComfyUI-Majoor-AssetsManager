import { beforeEach, describe, expect, it, vi } from "vitest";

describe("pendingGeneratedAssets", () => {
    beforeEach(() => {
        vi.resetModules();
        globalThis.window = {};
    });

    it("tracks and consumes generated assets waiting for panel reload", async () => {
        const mod = await import("../features/runtime/pendingGeneratedAssets.js");

        expect(mod.getPendingGeneratedAssetCount()).toBe(0);
        mod.markPendingGeneratedAsset();
        mod.markPendingGeneratedAsset(5);

        expect(mod.getPendingGeneratedAssetCount()).toBe(6);
        expect(globalThis.window.__mjrPendingGeneratedAssetCount).toBe(6);
        expect(mod.consumePendingGeneratedAssets()).toBe(6);
        expect(mod.getPendingGeneratedAssetCount()).toBe(0);
        expect(globalThis.window.__mjrPendingGeneratedAssetCount).toBe(0);
    });
});
