import { Window } from "happy-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("../app/i18n.js", () => ({
    t: (_key, fallback) => fallback || "",
}));

function makePointerEvent(window, type, props = {}) {
    const event = new window.Event(type, { bubbles: true, cancelable: true });
    for (const [key, value] of Object.entries(props)) {
        Object.defineProperty(event, key, {
            configurable: true,
            value,
        });
    }
    event.preventDefault = vi.fn(event.preventDefault.bind(event));
    event.stopPropagation = vi.fn(event.stopPropagation.bind(event));
    return event;
}

describe("video controls seek drag", () => {
    it("lets the MFV timeline scrub freely without playback sync overwriting the drag", async () => {
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
            get: () => 10,
        });

        const mounted = mountVideoControls(video, {
            variant: "viewerbar",
            mediaKind: "video",
            hostEl: host,
        });

        const seekWrap = mounted.controlsEl.querySelector(".mjr-video-seek-wrap");
        const seek = mounted.controlsEl.querySelector(".mjr-video-range--seek");
        seekWrap.getBoundingClientRect = () => ({ left: 10, width: 100 });

        seekWrap.dispatchEvent(
            makePointerEvent(window, "pointerdown", {
                button: 0,
                pointerId: 1,
                clientX: 60,
                target: seekWrap,
            }),
        );

        expect(currentTime).toBeCloseTo(5, 5);
        expect(seek.value).toBe("500");

        currentTime = 1;
        video.dispatchEvent(new window.Event("timeupdate"));
        expect(seek.value).toBe("500");

        window.dispatchEvent(
            makePointerEvent(window, "pointermove", {
                pointerId: 1,
                clientX: 100,
                target: seekWrap,
            }),
        );

        expect(currentTime).toBeCloseTo(9, 5);
        expect(seek.value).toBe("900");

        window.dispatchEvent(
            makePointerEvent(window, "pointerup", {
                pointerId: 1,
                clientX: 100,
                target: seekWrap,
            }),
        );

        currentTime = 2;
        video.dispatchEvent(new window.Event("timeupdate"));
        expect(seek.value).toBe("200");

        mounted.destroy();
    });
});
