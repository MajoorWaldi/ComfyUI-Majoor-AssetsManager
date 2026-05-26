// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";

const viewerMock = vi.hoisted(() => ({
    open: vi.fn(),
    setMode: vi.fn(),
}));

const getViewerInstanceMock = vi.hoisted(() => vi.fn(() => viewerMock));

vi.mock("../components/Viewer.js", () => ({
    getViewerInstance: getViewerInstanceMock,
}));

describe("requestViewerOpen", () => {
    beforeEach(() => {
        viewerMock.open.mockClear();
        viewerMock.setMode.mockClear();
        getViewerInstanceMock.mockClear();
    });

    it("falls back to the viewer singleton when no portal listener handles the event", async () => {
        const { requestViewerOpen } = await import("../features/viewer/viewerOpenRequest.js");
        const asset = { id: 1, filename: "one.png", kind: "image" };

        const opened = requestViewerOpen({ assets: [asset], index: 0 });

        expect(opened).toBe(true);
        expect(getViewerInstanceMock).toHaveBeenCalledTimes(1);
        expect(viewerMock.open).toHaveBeenCalledWith([asset], 0);
    });

    it("does not double-open when the portal marks the event as handled", async () => {
        const { EVENTS } = await import("../app/events.js");
        const { requestViewerOpen } = await import("../features/viewer/viewerOpenRequest.js");
        const asset = { id: 2, filename: "two.png", kind: "image" };

        const onOpen = vi.fn((event) => {
            event.detail.handled = true;
        });
        window.addEventListener(EVENTS.OPEN_VIEWER, onOpen);
        try {
            const opened = requestViewerOpen({ assets: [asset], index: 0, mode: "ab" });

            expect(opened).toBe(true);
            expect(onOpen).toHaveBeenCalledTimes(1);
            expect(getViewerInstanceMock).not.toHaveBeenCalled();
            expect(viewerMock.open).not.toHaveBeenCalled();
        } finally {
            window.removeEventListener(EVENTS.OPEN_VIEWER, onOpen);
        }
    });
});
