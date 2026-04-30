// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest";

const mountUnifiedMediaControlsMock = vi.fn(() => ({ destroy: vi.fn() }));
const mountFloatingViewerSimplePlayerMock = vi.fn((mediaEl) => mediaEl);

vi.mock("../api/endpoints.js", () => ({
    buildViewURL: vi.fn((filename) => `/view/${filename}`),
    buildAssetViewURL: vi.fn((fileData) => `/asset/${fileData?.filename || ""}`),
}));

vi.mock("../features/viewer/model3dRenderer.js", () => ({
    MODEL3D_EXTS: new Set(),
    createModel3DMediaElement: vi.fn(),
}));

vi.mock("../features/viewer/mediaPlayer.js", () => ({
    mountUnifiedMediaControls: mountUnifiedMediaControlsMock,
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
        mountUnifiedMediaControlsMock.mockClear();
        mountFloatingViewerSimplePlayerMock.mockClear();
    });

    it("uses unified video controls for video assets", async () => {
        const { buildFloatingViewerMediaElement } =
            await import("../features/viewer/floatingViewerMedia.js");

        const root = buildFloatingViewerMediaElement({
            filename: "clip.mp4",
            kind: "video",
        });

        expect(root?.classList.contains("mjr-mfv-player-host")).toBe(true);
        expect(root?._mjrMediaControlsHandle?.destroy).toBeTypeOf("function");
        expect(root?.querySelector("video")).toBeTruthy();
        expect(mountUnifiedMediaControlsMock).toHaveBeenCalledWith(
            expect.any(HTMLVideoElement),
            expect.objectContaining({
                variant: "viewer",
                mediaKind: "video",
                initialFps: 24,
                initialFrameCount: 48,
            }),
        );
        expect(mountFloatingViewerSimplePlayerMock).not.toHaveBeenCalled();
    });

    it("uses unified video controls for audio assets", async () => {
        const { buildFloatingViewerMediaElement } =
            await import("../features/viewer/floatingViewerMedia.js");

        const root = buildFloatingViewerMediaElement({
            filename: "track.mp3",
            kind: "audio",
        });

        expect(root?.classList.contains("mjr-mfv-player-host")).toBe(true);
        expect(root?.querySelector("audio")).toBeTruthy();
        expect(mountUnifiedMediaControlsMock).toHaveBeenCalledWith(
            expect.any(HTMLAudioElement),
            expect.objectContaining({
                variant: "viewer",
                mediaKind: "audio",
            }),
        );
        expect(mountFloatingViewerSimplePlayerMock).not.toHaveBeenCalled();
    });
});
