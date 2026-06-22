/* @vitest-environment happy-dom */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("MediaBlobCache", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.resetModules();
        delete (window as any).__MJR_MEDIA_BLOB_CACHE__;
    });

    afterEach(() => {
        try {
            (window as any).__MJR_MEDIA_BLOB_CACHE__?.dispose?.();
        } catch {}
        delete (window as any).__MJR_MEDIA_BLOB_CACHE__;
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it("revokes released blob URLs after the short off-screen TTL", async () => {
        const blob = new Blob(["image"], { type: "image/png" });
        vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, blob: async () => blob })));
        const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:thumb-1");
        const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

        const { MediaBlobCache } = await import("../features/grid/MediaBlobCache.js");

        await expect(MediaBlobCache.acquireUrl("/view?filename=a.png")).resolves.toBe("blob:thumb-1");
        MediaBlobCache.releaseUrl("/view?filename=a.png");

        expect(createObjectURL).toHaveBeenCalledTimes(1);
        expect(revokeObjectURL).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(30_001);

        expect(revokeObjectURL).toHaveBeenCalledWith("blob:thumb-1");
    });
});
