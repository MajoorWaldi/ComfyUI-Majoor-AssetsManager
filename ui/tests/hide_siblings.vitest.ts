import { describe, expect, it } from "vitest";

import {
    appendAssets,
    rebuildAssetRendererState,
    shouldHideSiblingAsset,
} from "../features/grid/AssetCardRenderer.js";

function enabledSettings() {
    return { siblings: { hidePngSiblings: true } };
}

describe("hide siblings", () => {
    it("hides generated png siblings for video, audio, and model3d assets in the same context", () => {
        const state = {
            seenKeys: new Set(),
            assetIdSet: new Set(),
            stemMap: new Map(),
            nonImageSiblingKeys: new Set(),
            hiddenPngSiblings: 0,
            assetKeyFn: (asset) => String(asset?.id || ""),
        };

        expect(
            shouldHideSiblingAsset(
                {
                    id: "v1",
                    filename: "clip.mp4",
                    subfolder: "gen",
                    source: "output",
                    kind: "video",
                },
                state,
                enabledSettings,
            ),
        ).toMatchObject({ hidden: false });
        expect(
            shouldHideSiblingAsset(
                {
                    id: "a1",
                    filename: "sound.wav",
                    subfolder: "gen",
                    source: "output",
                    kind: "audio",
                },
                state,
                enabledSettings,
            ),
        ).toMatchObject({ hidden: false });
        expect(
            shouldHideSiblingAsset(
                {
                    id: "m1",
                    filename: "mesh.glb",
                    subfolder: "gen",
                    source: "output",
                    kind: "model3d",
                },
                state,
                enabledSettings,
            ),
        ).toMatchObject({ hidden: false });

        expect(
            shouldHideSiblingAsset(
                {
                    id: "p1",
                    filename: "clip.png",
                    subfolder: "gen",
                    source: "output",
                    kind: "image",
                },
                state,
                enabledSettings,
            ),
        ).toMatchObject({ hidden: true });
        expect(
            shouldHideSiblingAsset(
                {
                    id: "p2",
                    filename: "sound.png",
                    subfolder: "gen",
                    source: "output",
                    kind: "image",
                },
                state,
                enabledSettings,
            ),
        ).toMatchObject({ hidden: true });
        expect(
            shouldHideSiblingAsset(
                {
                    id: "p3",
                    filename: "mesh.glb.png",
                    subfolder: "gen",
                    source: "output",
                    kind: "image",
                },
                state,
                enabledSettings,
            ),
        ).toMatchObject({ hidden: true });
    });

    it("hides png siblings for webm video and webp image assets", () => {
        const state = {
            seenKeys: new Set(),
            assetIdSet: new Set(),
            stemMap: new Map(),
            nonImageSiblingKeys: new Set(),
            hiddenPngSiblings: 0,
            assetKeyFn: (asset) => String(asset?.id || ""),
        };

        expect(
            shouldHideSiblingAsset(
                {
                    id: "v1",
                    filename: "clip.webm",
                    subfolder: "gen",
                    source: "output",
                    kind: "video",
                },
                state,
                enabledSettings,
            ),
        ).toMatchObject({ hidden: false });
        expect(
            shouldHideSiblingAsset(
                {
                    id: "p1",
                    filename: "clip.png",
                    subfolder: "gen",
                    source: "output",
                    kind: "image",
                },
                state,
                enabledSettings,
            ),
        ).toMatchObject({ hidden: true });

        expect(
            shouldHideSiblingAsset(
                {
                    id: "w1",
                    filename: "poster.webp",
                    subfolder: "gen",
                    source: "output",
                    kind: "image",
                },
                state,
                enabledSettings,
            ),
        ).toMatchObject({ hidden: false });
        expect(
            shouldHideSiblingAsset(
                {
                    id: "p2",
                    filename: "poster.png",
                    subfolder: "gen",
                    source: "output",
                    kind: "image",
                },
                state,
                enabledSettings,
            ),
        ).toMatchObject({ hidden: true });
    });

    it("does not hide png files from a different folder context", () => {
        const state = {
            seenKeys: new Set(),
            assetIdSet: new Set(),
            stemMap: new Map(),
            nonImageSiblingKeys: new Set(),
            hiddenPngSiblings: 0,
            assetKeyFn: (asset) => String(asset?.id || ""),
        };

        shouldHideSiblingAsset(
            { id: "v1", filename: "clip.mp4", subfolder: "gen-a", source: "output", kind: "video" },
            state,
            enabledSettings,
        );

        expect(
            shouldHideSiblingAsset(
                {
                    id: "p1",
                    filename: "clip.png",
                    subfolder: "gen-b",
                    source: "output",
                    kind: "image",
                },
                state,
                enabledSettings,
            ),
        ).toMatchObject({ hidden: false });
    });

    it("does not leak a png when the png arrives before its video sibling in the same batch", () => {
        const state = {
            assets: [],
            filenameCounts: new Map(),
            hiddenPngSiblings: 0,
        };
        const virtualGrid = { setItems: (items) => (virtualGrid.items = [...items]), items: [] };
        const gridContainer = { dataset: {} };
        const deps = {
            loadMajoorSettings: enabledSettings,
            clearGridMessage: () => {},
            ensureVirtualGrid: () => virtualGrid,
            assetKey: (asset) => String(asset?.id || ""),
            setFileBadgeCollision: () => {},
            ensureDupStackCard: () => {},
        };

        const added = appendAssets(
            gridContainer,
            [
                {
                    id: "p1",
                    filename: "clip.png",
                    subfolder: "gen",
                    source: "output",
                    kind: "image",
                },
                {
                    id: "v1",
                    filename: "clip.mp4",
                    subfolder: "gen",
                    source: "output",
                    kind: "video",
                },
            ],
            state,
            deps,
        );

        expect(added).toBe(1);
        expect(state.hiddenPngSiblings).toBe(1);
        expect(state.assets.map((asset) => asset.filename)).toEqual(["clip.mp4"]);
        expect(virtualGrid.items.map((asset) => asset.filename)).toEqual(["clip.mp4"]);
        expect(gridContainer.dataset.mjrHiddenPngSiblings).toBe("1");
    });

    it("does not leak a png when the png arrives before its webp sibling in the same batch", () => {
        const state = {
            assets: [],
            filenameCounts: new Map(),
            hiddenPngSiblings: 0,
        };
        const virtualGrid = { setItems: (items) => (virtualGrid.items = [...items]), items: [] };
        const gridContainer = { dataset: {} };
        const deps = {
            loadMajoorSettings: enabledSettings,
            clearGridMessage: () => {},
            ensureVirtualGrid: () => virtualGrid,
            assetKey: (asset) => String(asset?.id || ""),
            setFileBadgeCollision: () => {},
            ensureDupStackCard: () => {},
        };

        const added = appendAssets(
            gridContainer,
            [
                {
                    id: "p1",
                    filename: "clip.png",
                    subfolder: "gen",
                    source: "output",
                    kind: "image",
                },
                {
                    id: "w1",
                    filename: "clip.webp",
                    subfolder: "gen",
                    source: "output",
                    kind: "image",
                },
            ],
            state,
            deps,
        );

        expect(added).toBe(1);
        expect(state.hiddenPngSiblings).toBe(1);
        expect(state.assets.map((asset) => asset.filename)).toEqual(["clip.webp"]);
        expect(virtualGrid.items.map((asset) => asset.filename)).toEqual(["clip.webp"]);
        expect(gridContainer.dataset.mjrHiddenPngSiblings).toBe("1");
    });

    it("rebuilds hidden sibling indexes from preserved visible assets", () => {
        const state = {
            assets: [
                {
                    id: "v1",
                    filename: "clip.mp4",
                    subfolder: "gen",
                    source: "output",
                    kind: "video",
                },
            ],
            hiddenPngSiblings: 2,
        };
        const virtualGrid = { setItems: (items) => (virtualGrid.items = [...items]), items: [] };
        const gridContainer = { dataset: {} };
        const deps = {
            loadMajoorSettings: enabledSettings,
            clearGridMessage: () => {},
            ensureVirtualGrid: () => virtualGrid,
            assetKey: (asset) => String(asset?.id || ""),
            setFileBadgeCollision: () => {},
            ensureDupStackCard: () => {},
        };

        rebuildAssetRendererState(state, state.assets, {
            assetKey: deps.assetKey,
            preserveHiddenCount: true,
        });

        const added = appendAssets(
            gridContainer,
            [
                {
                    id: "p1",
                    filename: "clip.png",
                    subfolder: "gen",
                    source: "output",
                    kind: "image",
                },
            ],
            state,
            deps,
        );

        expect(added).toBe(0);
        expect(state.assets.map((asset) => asset.filename)).toEqual(["clip.mp4"]);
        expect(state.hiddenPngSiblings).toBe(3);
        expect(gridContainer.dataset.mjrHiddenPngSiblings).toBe("3");
    });
});
