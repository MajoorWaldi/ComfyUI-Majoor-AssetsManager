import { beforeEach, describe, expect, it, vi } from "vitest";

const createModel3DMediaElement = vi.fn(() => ({ kind: "3d-host" }));
const isModel3DAsset = vi.fn((asset) => String(asset?.kind || "").toLowerCase() === "model3d");

vi.mock("../features/viewer/model3dRenderer.js", () => ({
    createModel3DMediaElement,
    isModel3DAsset,
}));

vi.mock("../features/viewer/imageProcessor.js", () => ({
    createImageProcessor: vi.fn(),
    drawMediaError: vi.fn(),
}));

vi.mock("../features/viewer/videoProcessor.js", () => ({
    createVideoProcessor: vi.fn(),
}));

vi.mock("../features/viewer/audioVisualizer.js", () => ({
    createAudioVisualizer: vi.fn(),
}));

function createElement(tagName) {
    return {
        tagName: String(tagName || "").toUpperCase(),
        className: "",
        style: {},
        dataset: {},
        appendChild: vi.fn(),
        addEventListener: vi.fn(),
        setAttribute: vi.fn(),
        removeAttribute: vi.fn(),
        querySelector: vi.fn(() => null),
        querySelectorAll: vi.fn(() => []),
    };
}

describe("createViewerMediaFactory 3D", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        globalThis.document = {
            createElement: vi.fn((tag) => createElement(tag)),
        };
    });

    it("routes model3d assets to the shared 3D renderer", async () => {
        const { createViewerMediaFactory } = await import("../features/viewer/mediaFactory.js");
        const factory = createViewerMediaFactory({
            overlay: { querySelectorAll: () => [] },
            state: {},
            mediaTransform: () => "",
            updateMediaNaturalSize: vi.fn(),
            clampPanToBounds: vi.fn(),
            applyTransform: vi.fn(),
            scheduleOverlayRedraw: vi.fn(),
            getGradeParams: () => ({}),
            isDefaultGrade: () => true,
        });

        const asset = { id: 7, kind: "model3d", filename: "mesh.glb" };
        const el = factory.createMediaElement(asset, "/view?filename=mesh.glb&type=output");

        expect(el).toEqual({ kind: "3d-host" });
        expect(createModel3DMediaElement).toHaveBeenCalledTimes(1);
        expect(createModel3DMediaElement.mock.calls[0][0]).toBe(asset);
    });

    it("wraps audio assets in the enhanced audio preview shell", async () => {
        const { createViewerMediaFactory } = await import("../features/viewer/mediaFactory.js");
        const { createAudioVisualizer } = await import("../features/viewer/audioVisualizer.js");
        const factory = createViewerMediaFactory({
            overlay: { querySelectorAll: () => [] },
            state: { audioVisualizerMode: "simple" },
            mediaTransform: () => "",
        });

        const el = factory.createMediaElement(
            { id: 8, kind: "audio", filename: "track.wav" },
            "/view?filename=track.wav&type=output",
        );

        expect(el.className).toBe("mjr-viewer-audio-shell");
        expect(document.createElement).toHaveBeenCalledWith("canvas");
        expect(document.createElement).toHaveBeenCalledWith("audio");
        expect(createAudioVisualizer).toHaveBeenCalledWith(
            expect.objectContaining({
                mode: "simple",
                pauseDuringExecution: true,
            }),
        );
    });

    it("skips disabled transforms for 3D canvases", async () => {
        const elA = { style: {}, _mjrDisableViewerTransform: false };
        const elB = { style: {}, _mjrDisableViewerTransform: true };
        const overlay = { querySelectorAll: () => [elA, elB] };
        const { createViewerMediaFactory } = await import("../features/viewer/mediaFactory.js");
        const factory = createViewerMediaFactory({
            overlay,
            state: {},
            mediaTransform: () => "scale(2)",
        });

        factory.applyTransformToVisibleMedia();

        expect(elA.style.transform).toBe("scale(2)");
        expect(elB.style.transform).toBeUndefined();
    });
});
