// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../utils/mediaFps.js", () => ({
    readAssetFps: vi.fn(() => 24),
}));

describe("floatingViewerSimplePlayer keyboard shortcuts", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        vi.restoreAllMocks();
    });

    it("toggles play and pause with Space on the player root", async () => {
        const { mountFloatingViewerSimplePlayer } =
            await import("../features/viewer/floatingViewerSimplePlayer.js");

        const video = document.createElement("video");
        let paused = true;
        Object.defineProperty(video, "paused", {
            configurable: true,
            get: () => paused,
        });
        video.play = vi.fn(() => {
            paused = false;
            return Promise.resolve();
        });
        video.pause = vi.fn(() => {
            paused = true;
        });

        const root = mountFloatingViewerSimplePlayer(
            video,
            { filename: "clip.mp4" },
            { kind: "video" },
        );
        document.body.appendChild(root);

        root.dispatchEvent(
            new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true }),
        );
        expect(video.pause).toHaveBeenCalledTimes(1);

        root.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Spacebar", bubbles: true, cancelable: true }),
        );
        expect(video.play).toHaveBeenCalled();
    });

    it("steps backward and forward frame-by-frame with ArrowLeft and ArrowRight", async () => {
        const { mountFloatingViewerSimplePlayer } =
            await import("../features/viewer/floatingViewerSimplePlayer.js");

        const video = document.createElement("video");
        let paused = false;
        let currentTime = 1;
        Object.defineProperty(video, "paused", {
            configurable: true,
            get: () => paused,
        });
        Object.defineProperty(video, "currentTime", {
            configurable: true,
            get: () => currentTime,
            set: (value) => {
                currentTime = Number(value);
            },
        });
        Object.defineProperty(video, "duration", {
            configurable: true,
            get: () => 10,
        });
        video.play = vi.fn(() => {
            paused = false;
            return Promise.resolve();
        });
        video.pause = vi.fn(() => {
            paused = true;
        });

        const root = mountFloatingViewerSimplePlayer(
            video,
            { filename: "clip.mp4" },
            { kind: "video" },
        );
        document.body.appendChild(root);

        root.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, cancelable: true }),
        );
        expect(video.pause).toHaveBeenCalledTimes(1);
        expect(currentTime).toBeCloseTo(23 / 24, 5);

        root.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }),
        );
        expect(currentTime).toBeCloseTo(1, 5);
    });

    it("exposes the same keyboard handler for MFV global routing from child controls", async () => {
        const { mountFloatingViewerSimplePlayer } =
            await import("../features/viewer/floatingViewerSimplePlayer.js");

        const video = document.createElement("video");
        let currentTime = 1;
        Object.defineProperty(video, "currentTime", {
            configurable: true,
            get: () => currentTime,
            set: (value) => {
                currentTime = Number(value);
            },
        });
        Object.defineProperty(video, "duration", {
            configurable: true,
            get: () => 10,
        });
        video.play = vi.fn(() => Promise.resolve());
        video.pause = vi.fn();

        const root = mountFloatingViewerSimplePlayer(
            video,
            { filename: "clip.mp4" },
            { kind: "video" },
        );
        document.body.appendChild(root);
        const seek = root.querySelector(".mjr-mfv-simple-player-seek");
        const event = new KeyboardEvent("keydown", {
            key: "ArrowLeft",
            bubbles: true,
            cancelable: true,
        });
        Object.defineProperty(event, "target", { configurable: true, value: seek });

        root._mjrSimplePlayerHandleKeydown(event);

        expect(video.pause).toHaveBeenCalledTimes(1);
        expect(currentTime).toBeCloseTo(23 / 24, 5);
        expect(event.defaultPrevented).toBe(true);
    });

    it("updates timeline on video-frame callbacks while playing", async () => {
        const { mountFloatingViewerSimplePlayer } =
            await import("../features/viewer/floatingViewerSimplePlayer.js");

        const video = document.createElement("video");
        let paused = true;
        let currentTime = 0;
        let frameCallback = null;
        Object.defineProperty(video, "paused", {
            configurable: true,
            get: () => paused,
        });
        Object.defineProperty(video, "currentTime", {
            configurable: true,
            get: () => currentTime,
            set: (value) => {
                currentTime = Number(value);
            },
        });
        Object.defineProperty(video, "duration", {
            configurable: true,
            get: () => 10,
        });
        video.requestVideoFrameCallback = vi.fn((cb) => {
            frameCallback = cb;
            return 7;
        });
        video.cancelVideoFrameCallback = vi.fn();
        video.play = vi.fn(() => {
            paused = false;
            video.dispatchEvent(new Event("play"));
            return Promise.resolve();
        });
        video.pause = vi.fn(() => {
            paused = true;
            video.dispatchEvent(new Event("pause"));
        });

        const root = mountFloatingViewerSimplePlayer(
            video,
            { filename: "clip.mp4" },
            { kind: "video" },
        );
        document.body.appendChild(root);
        const seek = root.querySelector(".mjr-mfv-simple-player-seek");

        currentTime = 5;
        frameCallback?.(0, { mediaTime: 5 });

        expect(video.requestVideoFrameCallback).toHaveBeenCalled();
        expect(seek.value).toBe("500");

        root._mjrMediaControlsHandle.destroy();
        expect(video.cancelVideoFrameCallback).toHaveBeenCalledWith(7);
    });
});
