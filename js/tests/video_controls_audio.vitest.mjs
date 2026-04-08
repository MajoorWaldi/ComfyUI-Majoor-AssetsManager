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
});
