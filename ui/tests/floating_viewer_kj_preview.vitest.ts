import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { loadFloatingViewerPreviewBlob } from "../features/viewer/floatingViewerMode.js";

describe("Floating Viewer KJNodes preview media", () => {
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;

    beforeEach(() => {
        URL.createObjectURL = vi.fn(() => "blob:kj-preview");
        URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
        URL.createObjectURL = originalCreateObjectUrl;
        URL.revokeObjectURL = originalRevokeObjectUrl;
    });

    it("loads an animated WebP override as preview image media", () => {
        const viewer = {
            _mode: "simple",
            _previewBlobUrl: null,
            _mediaA: null,
            _refreshGen: 0,
            _revokePreviewBlob: vi.fn(),
            _resetMfvZoom: vi.fn(),
            _updateModeBtnUI: vi.fn(),
            _refresh: vi.fn(),
        };
        const blob = new Blob(["webp"], { type: "image/webp" });

        loadFloatingViewerPreviewBlob(viewer, blob, {
            source: "kj-preview-override",
            sourceLabel: "KJ Preview Override · Node 5 · 2/10",
            nodeId: "5",
            mime: "image/webp",
            width: 640,
            height: 360,
            fps: 12,
            step: 2,
            total: 10,
        });

        expect(viewer._mediaA).toEqual(
            expect.objectContaining({
                url: "blob:kj-preview",
                filename: "preview.webp",
                kind: "image",
                mime: "image/webp",
                width: 640,
                height: 360,
                fps: 12,
                _isPreview: true,
                _previewSource: "kj-preview-override",
                _previewNodeId: "5",
                _previewStep: 2,
                _previewTotal: 10,
            }),
        );
        expect(viewer._refresh).toHaveBeenCalledTimes(1);
    });

    it("loads an MP4 override as video media", () => {
        const viewer = {
            _mode: "simple",
            _previewBlobUrl: null,
            _mediaA: null,
            _refreshGen: 0,
            _revokePreviewBlob: vi.fn(),
            _resetMfvZoom: vi.fn(),
            _updateModeBtnUI: vi.fn(),
            _refresh: vi.fn(),
        };

        loadFloatingViewerPreviewBlob(viewer, new Blob(["mp4"], { type: "video/mp4" }), {
            mime: "video/mp4",
        });

        expect(viewer._mediaA).toEqual(
            expect.objectContaining({
                filename: "preview.mp4",
                kind: "video",
                mime: "video/mp4",
            }),
        );
    });
});
