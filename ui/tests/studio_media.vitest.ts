import { describe, expect, it, vi } from "vitest";

vi.mock("../app/settings/settingsCore.js", () => ({
    loadMajoorSettings: vi.fn(() => ({ viewer: {} })),
}));

import { loadMajoorSettings } from "../app/settings/settingsCore.js";
import {
    assetSummary,
    filmstripWindow,
    formatMediaTime,
    frameAtTime,
    loopWrapTarget,
    normalizeLoop,
    resolveAssetFps,
    stepFrameTime,
    studioMediaKind,
    timeForFrame,
    totalFrames,
} from "../features/viewer/studio/studioMedia.js";
import { shouldUseStudioViewer } from "../features/viewer/studio/studioViewerState.js";

describe("studio media helpers", () => {
    it("formats time for short and long media", () => {
        expect(formatMediaTime(0)).toBe("0:00.00");
        expect(formatMediaTime(3.256)).toBe("0:03.25");
        expect(formatMediaTime(65.5, { withCentis: false })).toBe("1:05");
        expect(formatMediaTime(3725)).toBe("1:02:05.00");
        expect(formatMediaTime(Number.NaN)).toBe("0:00.00");
    });

    it("maps time <-> frames and steps exactly one frame", () => {
        expect(frameAtTime(1, 24)).toBe(24);
        expect(frameAtTime(1, null)).toBe(0);
        const t10 = timeForFrame(10, 24);
        expect(frameAtTime(t10, 24)).toBe(10);
        expect(frameAtTime(stepFrameTime(t10, 24, 1, 10), 24)).toBe(11);
        expect(frameAtTime(stepFrameTime(t10, 24, -1, 10), 24)).toBe(9);
        expect(stepFrameTime(0, 24, -1, 10)).toBeGreaterThanOrEqual(0);
        // never past the last frame
        expect(stepFrameTime(9.99, 24, 5, 10)).toBeLessThan(10);
        expect(totalFrames(2, 24)).toBe(48);
        expect(totalFrames(2, 24, 50)).toBe(50);
    });

    it("normalises A-B loops and wraps playback", () => {
        expect(normalizeLoop({ a: 4, b: 2 }, 10)).toEqual({ a: 2, b: 4 });
        expect(normalizeLoop({ a: 2, b: null }, 10)).toBeNull();
        expect(loopWrapTarget(4.2, { a: 2, b: 4 }, 10)).toBe(2);
        expect(loopWrapTarget(3, { a: 2, b: 4 }, 10)).toBeNull();
        expect(loopWrapTarget(9, { a: null, b: null }, 10)).toBeNull();
    });

    it("resolves fps from ffprobe metadata or viewer info", () => {
        expect(
            resolveAssetFps({
                metadata_raw: { raw_ffprobe: { video_stream: { avg_frame_rate: "30000/1001" } } },
            }),
        ).toBeCloseTo(29.97, 2);
        expect(resolveAssetFps({}, { fps_raw: "24/1" })).toBe(24);
        expect(resolveAssetFps({}, {})).toBeNull();
    });

    it("detects media kind and summarises the asset", () => {
        expect(studioMediaKind({ filename: "a.PNG" })).toBe("image");
        expect(studioMediaKind({ kind: "video", filename: "x" })).toBe("video");
        expect(studioMediaKind({ filename: "m.glb" })).toBe("model3d");
        expect(studioMediaKind({ filename: "a.opus" })).toBe("audio");
        expect(assetSummary({ filename: "a.png", width: 1024, height: 768, size: 1536 })).toBe(
            "1024×768 · PNG · 1.5 KB",
        );
    });

    it("keeps the filmstrip window bounded around the current index", () => {
        expect(filmstripWindow(10, 3, 40)).toEqual({ start: 0, end: 10 });
        expect(filmstripWindow(1000, 500, 40)).toEqual({ start: 460, end: 541 });
        expect(filmstripWindow(1000, 995, 40)).toEqual({ start: 919, end: 1000 });
    });
});

describe("viewer routing", () => {
    const image = { id: 1, filename: "a.png", kind: "image" };

    it("uses the Studio viewer by default", () => {
        expect(shouldUseStudioViewer([image], 0)).toBe(true);
    });

    it("keeps compare modes, 3D and the classic setting on the classic viewer", () => {
        expect(shouldUseStudioViewer([image, image], 0, "ab")).toBe(false);
        expect(shouldUseStudioViewer([image, image], 0, "sidebyside")).toBe(false);
        expect(shouldUseStudioViewer([{ filename: "m.glb" }], 0)).toBe(false);
        (loadMajoorSettings as any).mockReturnValueOnce({ viewer: { classic: true } });
        expect(shouldUseStudioViewer([image], 0)).toBe(false);
    });
});
