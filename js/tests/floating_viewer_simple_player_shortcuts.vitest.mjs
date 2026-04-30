// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../utils/mediaFps.js", () => ({
    readAssetFps: vi.fn(() => 24),
}));

describe("floatingViewerSimplePlayer keyboard shortcuts", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
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
});
