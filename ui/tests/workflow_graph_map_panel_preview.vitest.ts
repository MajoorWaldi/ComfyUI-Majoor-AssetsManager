// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest";

const drawWorkflowMinimapMock = vi.fn(() => null);
const buildFloatingViewerMediaElementMock = vi.fn((asset) => {
    const root = document.createElement("div");
    root.className = `preview-${String(asset?.filename || "none")}`;
    root._mjrMediaControlsHandle = { destroy: vi.fn() };
    const video = document.createElement("video");
    video.pause = vi.fn();
    root.appendChild(video);
    return root;
});

vi.mock("../components/sidebar/utils/minimap.js", () => ({
    drawWorkflowMinimap: drawWorkflowMinimapMock,
    synthesizeWorkflowFromPromptGraph: vi.fn(() => null),
}));

vi.mock("../features/viewer/floatingViewerMedia.js", () => ({
    buildFloatingViewerMediaElement: buildFloatingViewerMediaElementMock,
}));

describe("WorkflowGraphMapPanel preview", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        buildFloatingViewerMediaElementMock.mockClear();
        drawWorkflowMinimapMock.mockClear();
    });

    it("reuses the same preview media on repeated refreshes", async () => {
        const { WorkflowGraphMapPanel } =
            await import("../features/viewer/workflowGraphMap/WorkflowGraphMapPanel.js");

        const panel = new WorkflowGraphMapPanel();
        document.body.appendChild(panel.el);

        panel.setAsset({
            filename: "clip.mp4",
            kind: "video",
            previewCandidates: ["/asset/clip.mp4"],
        });
        await Promise.resolve();

        const firstPreview = panel._preview.firstChild;
        panel.refresh();
        panel.refresh();

        expect(buildFloatingViewerMediaElementMock).toHaveBeenCalledTimes(1);
        expect(panel._preview.firstChild).toBe(firstPreview);
    });

    it("tears down the old preview media when the asset changes", async () => {
        const { WorkflowGraphMapPanel } =
            await import("../features/viewer/workflowGraphMap/WorkflowGraphMapPanel.js");

        const panel = new WorkflowGraphMapPanel();
        document.body.appendChild(panel.el);

        panel.setAsset({
            filename: "clip-a.mp4",
            kind: "video",
            previewCandidates: ["/asset/clip-a.mp4"],
        });
        await Promise.resolve();

        const firstPreview = panel._preview.firstChild;
        const destroySpy = firstPreview._mjrMediaControlsHandle.destroy;
        const pauseSpy = firstPreview.querySelector("video").pause;

        panel.setAsset({
            filename: "clip-b.mp4",
            kind: "video",
            previewCandidates: ["/asset/clip-b.mp4"],
        });
        await Promise.resolve();

        expect(buildFloatingViewerMediaElementMock).toHaveBeenCalledTimes(2);
        expect(destroySpy).toHaveBeenCalledTimes(1);
        expect(pauseSpy).toHaveBeenCalledTimes(1);
        expect(panel._preview.firstChild).not.toBe(firstPreview);
    });
});
