import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../features/viewer/nodeStream/nodeStreamFeatureFlag.js", () => ({
    NODE_STREAM_FEATURE_ENABLED: true,
}));

describe("entryDebugApi", () => {
    beforeEach(() => {
        vi.resetModules();
        globalThis.window = {};
    });

    afterEach(() => {
        delete globalThis.window;
        vi.restoreAllMocks();
    });

    it("exposes an inspection-only Node Stream API", async () => {
        const resolveNodeStreamModule = vi.fn(async () => ({
            listAdapters: vi.fn(() => [{ name: "video-output", priority: 10 }]),
        }));

        const { exposeDebugApis } = await import("../features/runtime/entryDebugApi.js");
        exposeDebugApis({ resolveNodeStreamModule });

        expect(window.MajoorNodeStream.mode).toBe("selection-only");
        expect(window.MajoorNodeStream.registerAdapter).toBeUndefined();
        expect(window.MajoorNodeStream.createAdapter).toBeUndefined();
        await expect(window.MajoorNodeStream.listAdapters()).resolves.toEqual([
            { name: "video-output", priority: 10 },
        ]);
    });
});
