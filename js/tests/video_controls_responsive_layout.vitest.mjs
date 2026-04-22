import { Window } from "happy-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("../app/i18n.js", () => ({
    t: (_key, fallback) => fallback || "",
}));

describe("video controls responsive layout", () => {
    it("switches to stacked layout when the host is narrow", async () => {
        const window = new Window();
        globalThis.window = window;
        globalThis.document = window.document;
        Object.defineProperty(globalThis, "navigator", {
            configurable: true,
            value: window.navigator,
        });

        const resizeObservers = [];
        globalThis.ResizeObserver = class {
            constructor(cb) {
                this.cb = cb;
                resizeObservers.push(this);
            }
            observe() {}
            disconnect() {}
        };

        const { mountVideoControls } = await import("../components/VideoControls.js");

        const host = document.createElement("div");
        Object.defineProperty(host, "clientWidth", {
            configurable: true,
            get: () => 520,
        });
        const video = document.createElement("video");
        host.appendChild(video);
        document.body.appendChild(host);

        const mounted = mountVideoControls(video, {
            variant: "viewer",
            mediaKind: "video",
            hostEl: host,
        });

        resizeObservers[0]?.cb?.();

        expect(mounted.controlsEl?.dataset?.mjrLayout).toBe("stacked");
        mounted.destroy();
    });
});
