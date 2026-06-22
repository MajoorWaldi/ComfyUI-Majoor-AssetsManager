import { Window } from "happy-dom";
import { describe, expect, it } from "vitest";

describe("VideoControls FPS override state", () => {
    it("marks FPS as modified only when it differs from the source FPS", async () => {
        const window = new Window();
        globalThis.window = window as any;
        globalThis.document = window.document as any;
        Object.defineProperty(globalThis, "navigator", {
            configurable: true,
            value: window.navigator,
        });

        const { mountVideoControls } = await import("../components/VideoControls.js");

        const host = document.createElement("div");
        const video = document.createElement("video");
        host.appendChild(video);
        document.body.appendChild(host);

        Object.defineProperty(video, "duration", {
            configurable: true,
            get: () => 10,
        });

        const mounted = mountVideoControls(video, {
            variant: "viewerbar",
            mediaKind: "video",
            hostEl: host,
            initialFps: 24000 / 1001,
        });

        const fpsInput = mounted.controlsEl?.querySelector(
            ".mjr-video-num--fps",
        ) as HTMLInputElement | null;
        expect(fpsInput).toBeTruthy();
        expect(fpsInput?.classList.contains("is-overridden")).toBe(false);
        expect(Number(fpsInput?.value)).toBeCloseTo(23.976, 3);

        fpsInput!.value = "12";
        fpsInput!.dispatchEvent(new window.Event("change", { bubbles: true }));
        expect(fpsInput?.classList.contains("is-overridden")).toBe(true);
        expect(fpsInput?.value).toBe("12");

        mounted.setMediaInfo?.({ fps: 24 });
        expect(fpsInput?.classList.contains("is-overridden")).toBe(true);
        expect(fpsInput?.value).toBe("12");

        fpsInput!.value = "24";
        fpsInput!.dispatchEvent(new window.Event("change", { bubbles: true }));
        expect(fpsInput?.classList.contains("is-overridden")).toBe(false);

        mounted.destroy();
    });

    it("keeps source FPS visible when runtime frame callbacks report noisy estimates", async () => {
        const window = new Window();
        globalThis.window = window as any;
        globalThis.document = window.document as any;
        Object.defineProperty(globalThis, "navigator", {
            configurable: true,
            value: window.navigator,
        });

        const { mountVideoControls } = await import("../components/VideoControls.js");

        const host = document.createElement("div");
        const video = document.createElement("video");
        host.appendChild(video);
        document.body.appendChild(host);

        Object.defineProperty(video, "duration", {
            configurable: true,
            get: () => 10,
        });

        const mounted = mountVideoControls(video, {
            variant: "viewerbar",
            mediaKind: "video",
            hostEl: host,
            initialFps: 25,
        });

        const fpsInput = mounted.controlsEl?.querySelector(
            ".mjr-video-num--fps",
        ) as HTMLInputElement | null;
        expect(fpsInput?.value).toBe("25");

        mounted.setMediaInfo?.({ fps: 17.321, fpsSource: "rvfc" });
        expect(fpsInput?.value).toBe("25");
        expect(fpsInput?.classList.contains("is-overridden")).toBe(false);

        mounted.destroy();
    });
});
