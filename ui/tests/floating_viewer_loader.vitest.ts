import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
    ensureViewerMetadataAssetMock: vi.fn(),
}));

vi.mock("../features/viewer/genInfo.js", () => ({
    ensureViewerMetadataAsset: state.ensureViewerMetadataAssetMock,
}));

vi.mock("../api/client.js", () => ({
    getAssetMetadata: vi.fn(),
    getFileMetadataScoped: vi.fn(),
}));

describe("floating viewer loader", () => {
    beforeEach(() => {
        state.ensureViewerMetadataAssetMock.mockReset();
    });

    it("refreshes graph map immediately while metadata enrichment is pending", async () => {
        let resolveMetadata: any = null;
        state.ensureViewerMetadataAssetMock.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveMetadata = resolve;
                }),
        );
        const { loadFloatingViewerMediaA } = await import("../features/viewer/floatingViewerLoader.js");
        const viewer = {
            _mediaA: null,
            _mode: "graph",
            _refreshGen: 0,
            _resetMfvZoom: vi.fn(),
            _refresh: vi.fn(),
            _updateModeBtnUI: vi.fn(),
        };
        const rawAsset = { id: 10, filename: "graph.png", workflow: { nodes: [] } };
        const enrichedAsset = { ...rawAsset, workflow: { nodes: [{ id: 1 }] } };

        loadFloatingViewerMediaA(viewer, rawAsset, { autoMode: true });

        expect(viewer._mediaA).toBe(rawAsset);
        expect(viewer._refresh).toHaveBeenCalledTimes(1);
        expect(state.ensureViewerMetadataAssetMock).toHaveBeenCalledTimes(1);

        resolveMetadata(enrichedAsset);
        await Promise.resolve();
        await Promise.resolve();

        expect(viewer._mediaA).toBe(enrichedAsset);
        expect(viewer._refresh).toHaveBeenCalledTimes(2);
    });
});
