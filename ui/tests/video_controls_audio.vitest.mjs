import { Window } from "happy-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("../app/i18n.js", () => ({
    t: (_key, fallback) => fallback || "",
}));

describe("audio viewer controls", () => {
    it("hides video-only controls for audio media", async () => {
        const window = new Window();
        globalThis.window = window;
        globalThis.document = window.document;
        Object.defineProperty(globalThis, "navigator", {
            configurable: true,
            value: window.navigator,
        });

        const { mountVideoControls } = await import("../components/VideoControls.js");

        const host = document.createElement("div");
        const audio = document.createElement("audio");
        host.appendChild(audio);
        document.body.appendChild(host);

        const mounted = mountVideoControls(audio, {
            variant: "viewerbar",
            mediaKind: "audio",
            hostEl: host,
        });

        expect(mounted.controlsEl).toBeTruthy();
        expect(mounted.controlsEl.getAttribute("aria-label")).toBe("Audio controls");
        expect(mounted.controlsEl.querySelector(".mjr-video-range--seek")).toBeTruthy();
        expect(mounted.controlsEl.querySelector(".mjr-video-num--speed")).toBeTruthy();
        expect(mounted.controlsEl.querySelector(".mjr-video-btn--mute")).toBeTruthy();
        expect(mounted.controlsEl.querySelector(".mjr-video-num--fps")).toBeNull();
        expect(mounted.controlsEl.querySelector(".mjr-video-num--step")).toBeNull();
        expect(mounted.controlsEl.querySelector(".mjr-video-num--in")).toBeNull();
        expect(mounted.controlsEl.querySelector(".mjr-video-num--out")).toBeNull();
        expect(mounted.controlsEl.querySelector(".mjr-video-btn--jump")).toBeNull();
        expect(mounted.controlsEl.querySelector(".mjr-video-btn--mark")).toBeNull();
        expect(mounted.setInPoint()).toBe(false);
        expect(mounted.setOutPoint()).toBe(false);
        expect(mounted.goToIn()).toBe(false);
        expect(mounted.goToOut()).toBe(false);

        mounted.destroy();
    });

    it("keeps the viewerbar frame readout aligned with actual video frames", async () => {
        const window = new Window();
        globalThis.window = window;
        globalThis.document = window.document;
        Object.defineProperty(globalThis, "navigator", {
            configurable: true,
            value: window.navigator,
        });

        let rvfcCallback = null;
        let paused = true;
        let currentTime = 0;

        const { mountVideoControls } = await import("../components/VideoControls.js");

        const host = document.createElement("div");
        const video = document.createElement("video");
        host.appendChild(video);
        document.body.appendChild(host);

        Object.defineProperty(video, "paused", {
            configurable: true,
            get: () => paused,
        });
        Object.defineProperty(video, "currentTime", {
            configurable: true,
            get: () => currentTime,
            set: (value) => {
                currentTime = Number(value) || 0;
            },
        });
        Object.defineProperty(video, "duration", {
            configurable: true,
            get: () => 2,
        });
        video.requestVideoFrameCallback = vi.fn((cb) => {
            rvfcCallback = cb;
            return 1;
        });
        video.cancelVideoFrameCallback = vi.fn();

        const mounted = mountVideoControls(video, {
            variant: "viewerbar",
            mediaKind: "video",
            hostEl: host,
            initialFps: 24,
        });

        paused = false;
        video.dispatchEvent(new window.Event("play"));

        currentTime = 0.5 / 24;
        rvfcCallback?.(0, { mediaTime: currentTime });

        const frameLabel = mounted.controlsEl.querySelector(".mjr-video-frame");
        const playheadLabel = mounted.controlsEl.querySelector(".mjr-video-seek-playhead-label");
        expect(frameLabel?.textContent || "").toContain("F: 0");
        expect(playheadLabel?.textContent || "").toBe("0");

        currentTime = 1.25 / 24;
        rvfcCallback?.(16, { mediaTime: currentTime });

        expect(frameLabel?.textContent || "").toContain("F: 1");
        expect(playheadLabel?.textContent || "").toBe("1");

        mounted.destroy();
    });

    it("expands the frame stepping range when the real frame count arrives after metadata load", async () => {
        const window = new Window();
        globalThis.window = window;
        globalThis.document = window.document;
        Object.defineProperty(globalThis, "navigator", {
            configurable: true,
            value: window.navigator,
        });

        let currentTime = 0;

        const { mountVideoControls } = await import("../components/VideoControls.js");

        const host = document.createElement("div");
        const video = document.createElement("video");
        host.appendChild(video);
        document.body.appendChild(host);

        Object.defineProperty(video, "currentTime", {
            configurable: true,
            get: () => currentTime,
            set: (value) => {
                currentTime = Number(value) || 0;
            },
        });
        Object.defineProperty(video, "duration", {
            configurable: true,
            get: () => 28 / 30,
        });

        const mounted = mountVideoControls(video, {
            variant: "viewerbar",
            mediaKind: "video",
            hostEl: host,
        });

        video.dispatchEvent(new window.Event("loadedmetadata"));
        mounted.setMediaInfo({ frameCount: 41 });
        mounted.goToOut();

        const frameLabel = mounted.controlsEl.querySelector(".mjr-video-frame");
        expect(frameLabel?.textContent || "").toContain("F: 41 / 41");
        expect(currentTime).toBeCloseTo(41 / 30, 5);

        mounted.destroy();
    });
});
