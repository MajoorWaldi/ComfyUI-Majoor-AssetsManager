// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createViewerPanZoom } from "../features/viewer/panzoom.js";

describe("viewer panzoom performance", () => {
    const rafCallbacks: FrameRequestCallback[] = [];
    let rafId = 0;

    beforeEach(() => {
        rafCallbacks.length = 0;
        rafId = 0;
        vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb: FrameRequestCallback) => {
            rafCallbacks.push(cb);
            rafId += 1;
            return rafId;
        });
        vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    function makePointerEvent(type: string, props: Record<string, any> = {}) {
        const event = new Event(type, { bubbles: true, cancelable: true }) as any;
        Object.assign(event, {
            button: 0,
            pointerId: 1,
            clientX: 100,
            clientY: 100,
            preventDefault: vi.fn(),
            stopPropagation: vi.fn(),
            stopImmediatePropagation: vi.fn(),
            ...props,
        });
        return event;
    }

    function flushRaf() {
        const callbacks = rafCallbacks.splice(0);
        for (const cb of callbacks) cb(performance.now());
    }

    it("coalesces pan moves and avoids synchronous overlay redraws", () => {
        const overlay = document.createElement("div");
        const content = document.createElement("div") as any;
        const singleView = document.createElement("div");
        const abView = document.createElement("div");
        const sideView = document.createElement("div");
        const media = document.createElement("canvas") as any;
        const scheduleOverlayRedraw = vi.fn();

        overlay.style.display = "flex";
        content.setPointerCapture = vi.fn();
        content.releasePointerCapture = vi.fn();
        content.getBoundingClientRect = () => ({
            left: 0,
            top: 0,
            width: 800,
            height: 600,
            right: 800,
            bottom: 600,
        });
        singleView.getBoundingClientRect = vi.fn(() => ({
            left: 0,
            top: 0,
            width: 800,
            height: 600,
            right: 800,
            bottom: 600,
        }));
        media.className = "mjr-viewer-media";
        media._mjrNaturalW = 1600;
        media._mjrNaturalH = 900;
        singleView.appendChild(media);
        content.appendChild(singleView);
        overlay.appendChild(content);
        document.body.appendChild(overlay);

        const state: Record<string, any> = {
            mode: "single",
            assets: [{ width: 1600, height: 900 }],
            currentIndex: 0,
            zoom: 2,
            panX: 0,
            panY: 0,
        };

        createViewerPanZoom({
            overlay,
            content,
            singleView,
            abView,
            sideView,
            state,
            VIEWER_MODES: { SINGLE: "single", AB_COMPARE: "ab", SIDE_BY_SIDE: "sidebyside" },
            scheduleOverlayRedraw,
            lifecycle: { unsubs: [] },
        });

        content.dispatchEvent(makePointerEvent("pointerdown", { clientX: 100, clientY: 100 }));
        content.dispatchEvent(makePointerEvent("pointermove", { clientX: 120, clientY: 100 }));
        content.dispatchEvent(makePointerEvent("pointermove", { clientX: 140, clientY: 100 }));

        expect(scheduleOverlayRedraw).not.toHaveBeenCalled();
        expect(singleView.getBoundingClientRect).not.toHaveBeenCalled();

        flushRaf();

        expect(scheduleOverlayRedraw).toHaveBeenCalledTimes(1);
        expect(scheduleOverlayRedraw).toHaveBeenCalledWith();
        expect(media.style.transform).toContain("scale(2)");
    });
});
