// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";

import { EVENTS } from "../app/events.js";
import { requestViewerOpen } from "../features/viewer/viewerOpenRequest.js";

describe("requestViewerOpen", () => {
    const asset = { id: 1, filename: "one.png", kind: "image" };

    it("reports false when no viewer handles the request", () => {
        expect(requestViewerOpen({ assets: [asset], index: 0 })).toBe(false);
    });

    it("reports false without assets", () => {
        expect(requestViewerOpen({ assets: [] })).toBe(false);
    });

    it("dispatches OPEN_VIEWER and returns true once a listener handles it", () => {
        const onOpen = vi.fn((event: Event) => {
            (event as CustomEvent).detail.handled = true;
        });
        window.addEventListener(EVENTS.OPEN_VIEWER, onOpen);
        try {
            expect(requestViewerOpen({ asset, index: 5, mode: " AB " })).toBe(true);
            const detail = (onOpen.mock.calls[0][0] as CustomEvent).detail;
            expect(detail.assets).toEqual([asset]);
            expect(detail.index).toBe(0);
            expect(detail.mode).toBe("ab");
        } finally {
            window.removeEventListener(EVENTS.OPEN_VIEWER, onOpen);
        }
    });

    it("drops unknown modes", () => {
        const onOpen = vi.fn();
        window.addEventListener(EVENTS.OPEN_VIEWER, onOpen);
        try {
            requestViewerOpen({ assets: [asset], mode: "bogus" });
            expect((onOpen.mock.calls[0][0] as CustomEvent).detail.mode).toBe("");
        } finally {
            window.removeEventListener(EVENTS.OPEN_VIEWER, onOpen);
        }
    });
});
