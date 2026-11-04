/* @vitest-environment happy-dom */

import { describe, expect, it, vi } from "vitest";

vi.mock("../app/settings/settingsCore.js", async (importOriginal) => ({
    ...((await importOriginal()) as object),
    loadMajoorSettings: vi.fn(() => ({ viewer: {} })),
}));

import { loadMajoorSettings } from "../app/settings/settingsCore.js";
import { buildFloatingViewerStudioPlayer } from "../features/viewer/floatingViewerMedia.js";

const VIDEO = { filename: "clip.mp4", kind: "video", type: "output", subfolder: "" };

describe("floating viewer Studio player", () => {
    it("mounts the Studio player behind the MFV player-host contract", () => {
        const host = buildFloatingViewerStudioPlayer(VIDEO, {
            initialMuted: true,
            initialPlaybackRate: 1.5,
        });
        expect(host).not.toBeNull();
        document.body.appendChild(host as HTMLElement);

        expect(host?.classList.contains("mjr-mfv-player-host")).toBe(true);
        const video = host?.querySelector("video") as HTMLVideoElement;
        expect(video).toBeTruthy();
        expect(video.muted).toBe(true);
        expect(video.playbackRate).toBe(1.5);
        expect(host?.querySelector(".mjr-studio-player.is-compact")).toBeTruthy();

        const handle = (host as any)._mjrMediaControlsHandle;
        expect(typeof handle.togglePlay).toBe("function");
        expect(typeof handle.stepFrames).toBe("function");

        const pause = vi.spyOn(video, "pause").mockImplementation(() => {});
        Object.defineProperty(video, "duration", { configurable: true, value: 10 });
        handle.stepFrames(1);
        expect(pause).toHaveBeenCalled();

        vi.spyOn(video, "load").mockImplementation(() => {});
        handle.destroy();
        expect(video.getAttribute("src")).toBeNull();
        expect(host?.querySelector(".mjr-studio-player")).toBeNull(); // app unmounted
        handle.destroy(); // idempotent
        host?.remove();
    });

    it("keeps legacy renderers for images and when the classic viewer is selected", () => {
        expect(buildFloatingViewerStudioPlayer({ filename: "a.png", kind: "image" })).toBeNull();
        (loadMajoorSettings as any).mockReturnValueOnce({ viewer: { classic: true } });
        expect(buildFloatingViewerStudioPlayer(VIDEO)).toBeNull();
    });

    it("forces mute for generated preview clips", () => {
        const host = buildFloatingViewerStudioPlayer(
            { ...VIDEO, _isPreview: true },
            { initialMuted: false },
        );
        expect((host?.querySelector("video") as HTMLVideoElement).muted).toBe(true);
        (host as any)._mjrMediaControlsHandle.destroy();
    });
});
