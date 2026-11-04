// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest";

const mountFloatingViewerSimplePlayerMock = vi.fn((mediaEl) => mediaEl);

vi.mock("../api/endpoints.js", () => ({
    buildViewURL: vi.fn((filename) => `/view/${filename}`),
    buildAssetViewURL: vi.fn((fileData) => `/asset/${fileData?.filename || ""}`),
}));

vi.mock("../features/viewer/model3dRenderer.js", () => ({
    MODEL3D_EXTS: new Set(),
    createModel3DMediaElement: vi.fn(),
}));

vi.mock("../features/viewer/floatingViewerSimplePlayer.js", () => ({
    mountFloatingViewerSimplePlayer: mountFloatingViewerSimplePlayerMock,
}));

vi.mock("../utils/mediaFps.js", () => ({
    readAssetFps: vi.fn(() => 24),
    readAssetFrameCount: vi.fn(() => 48),
}));

describe("floating viewer media player bridge", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        mountFloatingViewerSimplePlayerMock.mockClear();
    });

    it("uses the Studio player for video assets", async () => {
        const { buildFloatingViewerMediaElement } =
            await import("../features/viewer/floatingViewerMedia.js");

        const root: any = buildFloatingViewerMediaElement({
            filename: "clip.mp4",
            kind: "video",
        });

        expect(root?.classList.contains("mjr-mfv-player-host")).toBe(true);
        expect(root?.classList.contains("mjr-mfv-player-host--studio")).toBe(true);
        expect(root?._mjrMediaControlsHandle?.destroy).toBeTypeOf("function");
        expect(root?.querySelector(".mjr-studio-player video")).toBeTruthy();
        expect(mountFloatingViewerSimplePlayerMock).not.toHaveBeenCalled();
        root._mjrMediaControlsHandle.destroy();
    });

    it("uses the Studio player for audio assets and fills compare slots", async () => {
        const { buildFloatingViewerMediaElement } =
            await import("../features/viewer/floatingViewerMedia.js");

        const root: any = buildFloatingViewerMediaElement(
            { filename: "track.mp3", kind: "audio" },
            { fill: true },
        );

        expect(root?.classList.contains("mjr-mfv-player-host--fill")).toBe(true);
        expect(root?.querySelector(".mjr-studio-player.is-audio audio")).toBeTruthy();
        root._mjrMediaControlsHandle.destroy();
    });

    it("can render playable compare followers without duplicate controls", async () => {
        const { buildFloatingViewerMediaElement } =
            await import("../features/viewer/floatingViewerMedia.js");

        const video: any = buildFloatingViewerMediaElement(
            {
                filename: "compare-b.mp4",
                kind: "video",
            },
            { controls: false },
        );

        expect(video).toBeInstanceOf(HTMLVideoElement);
        expect(video.classList.contains("mjr-mfv-media")).toBe(true);
        expect(video.controls).toBe(false);
        expect(video.closest(".mjr-studio-player")).toBeNull();
    });

    it("starts generated video previews muted with metadata preload", async () => {
        const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
        const { buildFloatingViewerMediaElement } =
            await import("../features/viewer/floatingViewerMedia.js");

        const video: any = buildFloatingViewerMediaElement(
            {
                filename: "preview.mp4",
                mime: "video/mp4",
                _isPreview: true,
            },
            { controls: false },
        );

        expect(video?.muted).toBe(true);
        expect(video?.autoplay).toBe(true);
        expect(video?.playsInline).toBe(true);
        expect(video?.preload).toBe("metadata");
        expect(play).toHaveBeenCalled();
    });
});
