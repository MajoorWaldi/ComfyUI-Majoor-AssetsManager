// @vitest-environment happy-dom
/**
 * CI performance-budget tests for grid rendering at 10 000+ assets.
 *
 * These tests guard against O(n²) regressions in the card-append pipeline
 * (deduplication, sibling-hide state-machine, filename-collision tracking).
 * Thresholds are intentionally generous to pass on under-powered CI runners
 * while still catching catastrophic blowups.
 */

import { beforeEach, describe, expect, it } from "vitest";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function elapsed(fn) {
    const t0 = performance.now();
    fn();
    return performance.now() - t0;
}

async function elapsedAsync(fn) {
    const t0 = performance.now();
    await fn();
    return performance.now() - t0;
}

function makeAsset(overrides = {}) {
    const i = overrides.i ?? 0;
    return {
        id: overrides.id ?? `asset-${i}`,
        filename: overrides.filename ?? `ComfyUI_${String(i).padStart(5, "0")}_00001_.png`,
        kind: overrides.kind ?? "image",
        mtime: overrides.mtime ?? i,
        size: overrides.size ?? 1024,
        filepath: overrides.filepath ?? `output/ComfyUI_${String(i).padStart(5, "0")}_00001_.png`,
        source: overrides.source ?? "output",
        root_id: overrides.root_id ?? "root1",
        subfolder: overrides.subfolder ?? "",
        has_generation_data: overrides.has_generation_data ?? 0,
        ...overrides,
    };
}

/** Minimal virtual-grid stub — just stores the items array (no DOM work). */
function makeFakeVirtualGrid() {
    let _items = [];
    return {
        setItems(items) {
            _items = Array.isArray(items) ? [...items] : [];
        },
        get length() {
            return _items.length;
        },
    };
}

/** Build the deps bag expected by appendAssets / AssetCardRenderer. */
function makeDeps(virtualGrid) {
    return {
        loadMajoorSettings: () => ({ siblings: { hidePngSiblings: false } }),
        clearGridMessage: () => {},
        ensureVirtualGrid: (_container, _state) => virtualGrid,
        assetKey: (asset) => String(asset?.id ?? ""),
        setFileBadgeCollision: () => {},
        ensureDupStackCard: () => {},
        updateGridSettingsClasses: () => {},
    };
}

function makeGridContainer() {
    const el = document.createElement("div");
    el.className = "mjr-grid";
    document.body.appendChild(el);
    return el;
}

// ─── appendAssets – full pipeline ────────────────────────────────────────────

describe("appendAssets – full pipeline perf budget", () => {
    let mod;

    beforeEach(async () => {
        mod = await import("../features/grid/AssetCardRenderer.js");
    });

    it("processes 10 000 unique assets under 400 ms", () => {
        const assets = Array.from({ length: 10_000 }, (_, i) => makeAsset({ i }));
        const state = { assets: [], filenameCounts: new Map(), hiddenPngSiblings: 0 };
        const vg = makeFakeVirtualGrid();
        const container = makeGridContainer();

        const ms = elapsed(() => {
            mod.appendAssets(container, assets, state, makeDeps(vg));
        });

        expect(ms).toBeLessThan(400);
        expect(state.assets.length).toBe(10_000);
        expect(vg.length).toBe(10_000);
    });

    it("deduplicates 10 000 assets — half pre-existing — under 400 ms", () => {
        const allAssets = Array.from({ length: 10_000 }, (_, i) => makeAsset({ i }));
        const preExisting = allAssets.slice(0, 5_000);

        const state = { assets: [], filenameCounts: new Map(), hiddenPngSiblings: 0 };
        const vg = makeFakeVirtualGrid();
        const container = makeGridContainer();
        const deps = makeDeps(vg);

        // Phase 1: load the first 5 000 — populates seenKeys / assetIdSet
        mod.appendAssets(container, preExisting, state, deps);
        expect(state.assets.length).toBe(5_000);

        // Phase 2: append all 10 000 — the first 5 000 are duplicates
        const ms = elapsed(() => {
            mod.appendAssets(container, allAssets, state, deps);
        });

        expect(ms).toBeLessThan(400);
        // Should now have exactly 10 000 unique assets
        expect(state.assets.length).toBe(10_000);
    });

    it("handles incremental batches of 1 000 (10 rounds) under 400 ms total", () => {
        const state = { assets: [], filenameCounts: new Map(), hiddenPngSiblings: 0 };
        const vg = makeFakeVirtualGrid();
        const container = makeGridContainer();
        const deps = makeDeps(vg);

        let totalMs = 0;
        for (let round = 0; round < 10; round++) {
            const batch = Array.from({ length: 1_000 }, (_, i) =>
                makeAsset({ i: round * 1_000 + i }),
            );
            totalMs += elapsed(() => mod.appendAssets(container, batch, state, deps));
        }

        expect(totalMs).toBeLessThan(400);
        expect(state.assets.length).toBe(10_000);
    });
});

// ─── Pure-function pipeline helpers at scale ─────────────────────────────────

describe("compareAssets + shouldHideSiblingAsset – 10k scale", () => {
    let acMod;

    beforeEach(async () => {
        acMod = await import("../features/grid/AssetCardRenderer.js");
    });

    it("shouldHideSiblingAsset processes 10 000 pure-image assets under 100 ms", () => {
        const settings = () => ({ siblings: { hidePngSiblings: true } });
        const state = {};
        const assets = Array.from({ length: 10_000 }, (_, i) =>
            makeAsset({ i, kind: "image", filename: `file_${i}.png` }),
        );

        const ms = elapsed(() => {
            for (const a of assets) acMod.shouldHideSiblingAsset(a, state, settings);
        });

        expect(ms).toBeLessThan(100);
    });

    it("selectStackRepresentative scans 10 000 mixed assets under 50 ms", () => {
        const kinds = ["image", "video", "audio", "model"];
        const assets = Array.from({ length: 10_000 }, (_, i) =>
            makeAsset({ i, kind: kinds[i % kinds.length] }),
        );

        let result;
        const ms = elapsed(() => {
            result = acMod.selectStackRepresentative(assets);
        });

        expect(ms).toBeLessThan(50);
        expect(result).not.toBeNull();
    });
});
