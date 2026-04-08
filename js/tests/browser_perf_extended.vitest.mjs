// @vitest-environment happy-dom
/**
 * Extended browser performance tests.
 *
 * Each scenario measures elapsed wall-clock time with performance.now() and
 * asserts it completes under a generous-but-finite budget.  The thresholds are
 * intentionally loose (they must pass on a slow CI runner or an under-powered
 * laptop) while still catching catastrophic regressions (O(n²) blowups, etc.).
 *
 * Coverage:
 *   • AssetCardRenderer  – selectStackRepresentative, getFilenameKey/Ext/Stem,
 *                          buildCollisionPaths, shouldHideSiblingAsset (large batches)
 *   • imagePreloader     – deduplication, cache-eviction at 250-item limit
 *   • viewer/keyboard    – rapid keydown dispatch (debounce, no-op paths)
 *   • mediaFactory       – _extOf / _parseFps helpers via createViewerMediaFactory
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Measure elapsed ms for a synchronous thunk. */
function elapsed(fn) {
    const t0 = performance.now();
    fn();
    return performance.now() - t0;
}

/** Build a synthetic asset. */
function makeAsset(overrides = {}) {
    return {
        id: overrides.id ?? Math.random().toString(36).slice(2),
        filename: overrides.filename ?? "image.png",
        kind: overrides.kind ?? "image",
        mtime: overrides.mtime ?? Date.now(),
        size: overrides.size ?? 1024,
        has_generation_data: overrides.has_generation_data ?? 0,
        subfolder: overrides.subfolder ?? "",
        source: overrides.source ?? "output",
        root_id: overrides.root_id ?? "root1",
        ...overrides,
    };
}

// ─── AssetCardRenderer ──────────────────────────────────────────────────────

describe("AssetCardRenderer – pure string helpers (large batches)", () => {
    let mod;

    beforeEach(async () => {
        mod = await import("../features/grid/AssetCardRenderer.js");
    });

    it("getFilenameKey processes 50 000 filenames under 200 ms", () => {
        const names = Array.from({ length: 50_000 }, (_, i) => `asset_${i}.png`);
        const ms = elapsed(() => {
            for (const n of names) mod.getFilenameKey(n);
        });
        expect(ms).toBeLessThan(200);
    });

    it("getExtUpper processes 50 000 filenames under 200 ms", () => {
        const exts = ["png", "jpg", "webp", "mp4", "webm", "gif", "wav", "glb"];
        const names = Array.from({ length: 50_000 }, (_, i) => `file_${i}.${exts[i % exts.length]}`);
        const ms = elapsed(() => {
            for (const n of names) mod.getExtUpper(n);
        });
        expect(ms).toBeLessThan(200);
    });

    it("getStemLower processes 50 000 filenames under 200 ms", () => {
        const names = Array.from({ length: 50_000 }, (_, i) => `ComfyUI_${i}_00001_.png`);
        const ms = elapsed(() => {
            for (const n of names) mod.getStemLower(n);
        });
        expect(ms).toBeLessThan(200);
    });

    it("getFilenameKey is case-insensitive and trims whitespace", () => {
        expect(mod.getFilenameKey("  Image.PNG  ")).toBe("image.png");
        expect(mod.getFilenameKey("")).toBe("");
        expect(mod.getFilenameKey(null)).toBe("");
    });

    it("getExtUpper returns upper-cased extension", () => {
        expect(mod.getExtUpper("photo.jpeg")).toBe("JPEG");
        expect(mod.getExtUpper("no-ext")).toBe("NO-EXT");
        expect(mod.getExtUpper("")).toBe("");
    });

    it("getStemLower strips extension correctly", () => {
        expect(mod.getStemLower("ComfyUI_00001_.png")).toBe("comfyui_00001_");
        expect(mod.getStemLower("archive.tar.gz")).toBe("archive.tar");
        expect(mod.getStemLower("noext")).toBe("noext");
    });
});

describe("AssetCardRenderer – selectStackRepresentative (large stacks)", () => {
    let mod;

    beforeEach(async () => {
        mod = await import("../features/grid/AssetCardRenderer.js");
    });

    it("selects from 1 000 assets under 10 ms", () => {
        const assets = Array.from({ length: 1_000 }, (_, i) =>
            makeAsset({ id: `a${i}`, kind: "image", mtime: i }),
        );
        const ms = elapsed(() => mod.selectStackRepresentative(assets));
        expect(ms).toBeLessThan(10);
    });

    it("selects from 10 000 assets under 50 ms", () => {
        const assets = Array.from({ length: 10_000 }, (_, i) =>
            makeAsset({ id: `a${i}`, kind: i % 3 === 0 ? "video" : "image", mtime: i }),
        );
        let result;
        const ms = elapsed(() => {
            result = mod.selectStackRepresentative(assets);
        });
        expect(ms).toBeLessThan(50);
        // Should prefer video
        expect(result?.kind).toBe("video");
    });

    it("prefers video-with-audio over plain video", () => {
        const assets = [
            makeAsset({ id: "v1", kind: "video", filename: "clip.mp4", mtime: 100 }),
            makeAsset({ id: "va", kind: "video", filename: "clip-audio.mp4", mtime: 50 }),
            makeAsset({ id: "img", kind: "image", filename: "thumb.png", mtime: 200 }),
        ];
        const rep = mod.selectStackRepresentative(assets);
        expect(rep.id).toBe("va");
    });

    it("falls back to highest mtime when kinds are equal", () => {
        const assets = Array.from({ length: 100 }, (_, i) =>
            makeAsset({ id: `img${i}`, kind: "image", mtime: i }),
        );
        const rep = mod.selectStackRepresentative(assets);
        expect(rep.id).toBe("img99");
    });

    it("returns null for empty array", () => {
        expect(mod.selectStackRepresentative([])).toBeNull();
        expect(mod.selectStackRepresentative(null)).toBeNull();
    });

    it("returns the single element for a 1-element array", () => {
        const a = makeAsset({ id: "solo" });
        expect(mod.selectStackRepresentative([a])).toBe(a);
    });
});

describe("AssetCardRenderer – buildCollisionPaths", () => {
    let mod;

    beforeEach(async () => {
        mod = await import("../features/grid/AssetCardRenderer.js");
    });

    it("deduplicates 5 000 assets with identical paths under 20 ms", () => {
        const bucket = Array.from({ length: 5_000 }, (_, i) =>
            makeAsset({ filepath: `outputs/image_${i % 100}.png` }),
        );
        let paths;
        const ms = elapsed(() => {
            paths = mod.buildCollisionPaths(bucket);
        });
        expect(ms).toBeLessThan(20);
        expect(paths.length).toBe(100);
    });

    it("returns empty array for empty bucket", () => {
        expect(mod.buildCollisionPaths([])).toEqual([]);
        expect(mod.buildCollisionPaths(null)).toEqual([]);
    });

    it("excludes blank paths", () => {
        // Use plain objects — makeAsset() sets filename:"image.png" which
        // becomes the fallback when filepath/path/subfolder are all empty.
        const bucket = [
            { filepath: "", path: "", subfolder: "", filename: "" },
            { filepath: "  ", path: "", subfolder: "", filename: "" },
            makeAsset({ filepath: "real/path.png" }),
        ];
        expect(mod.buildCollisionPaths(bucket)).toEqual(["real/path.png"]);
    });
});

describe("AssetCardRenderer – shouldHideSiblingAsset (sibling state machine)", () => {
    let mod;

    beforeEach(async () => {
        mod = await import("../features/grid/AssetCardRenderer.js");
    });

    const enabledSettings = () => ({ siblings: { hidePngSiblings: true } });
    const disabledSettings = () => ({ siblings: { hidePngSiblings: false } });

    it("hides PNG when a video sibling exists for the same stem", () => {
        const state = {};
        const video = makeAsset({
            filename: "ComfyUI_00001_.mp4",
            kind: "video",
            source: "output",
            root_id: "r1",
            subfolder: "",
        });
        const png = makeAsset({
            filename: "ComfyUI_00001_.png",
            kind: "image",
            source: "output",
            root_id: "r1",
            subfolder: "",
        });
        // First: video registers, PNG should NOT yet be hidden (video seen first)
        const r1 = mod.shouldHideSiblingAsset(video, state, enabledSettings);
        expect(r1.hidden).toBe(false);

        // Now PNG arrives: should be hidden
        const r2 = mod.shouldHideSiblingAsset(png, state, enabledSettings);
        expect(r2.hidden).toBe(true);
    });

    it("does NOT hide PNG when setting is disabled", () => {
        const state = {};
        const video = makeAsset({ filename: "clip.mp4", kind: "video" });
        const png = makeAsset({ filename: "clip.png", kind: "image" });
        mod.shouldHideSiblingAsset(video, state, disabledSettings);
        const r = mod.shouldHideSiblingAsset(png, state, disabledSettings);
        expect(r.hidden).toBe(false);
        expect(r.hideEnabled).toBe(false);
    });

    it("removes previously-admitted PNG when video arrives after PNG (via stemMap)", () => {
        // removeExistingHiddenSiblings checks stemMap, which is normally
        // populated by appendAssets (not by shouldHideSiblingAsset itself).
        // We pre-populate stemMap to match that real-world contract.
        const png = makeAsset({
            filename: "frame.png",
            kind: "image",
            source: "output",
            root_id: "r2",
            subfolder: "sub",
        });
        const video = makeAsset({
            filename: "frame.mp4",
            kind: "video",
            source: "output",
            root_id: "r2",
            subfolder: "sub",
        });
        // matchKey for the PNG: "output|r2|sub|media|frame"
        const matchKey = "output|r2|sub|media|frame";
        const state = {
            stemMap: new Map([[matchKey, [png]]]),
        };

        // PNG not yet checked for hiding (already admitted, in stemMap)
        // Video arrives → should find and remove the PNG from stemMap
        const r = mod.shouldHideSiblingAsset(video, state, enabledSettings);
        expect(r.hidden).toBe(false);
        expect(r.removed.some((a) => a.filename === "frame.png")).toBe(true);
        // stemMap entry should be gone after removal
        expect(state.stemMap.has(matchKey)).toBe(false);
    });

    it("processes 500 mixed assets (PNG + video siblings) under 30 ms", () => {
        const state = {};
        const assets = Array.from({ length: 500 }, (_, i) => {
            const base = `file_${i % 50}`;
            return i % 2 === 0
                ? makeAsset({ filename: `${base}.mp4`, kind: "video", source: "output", root_id: "r3" })
                : makeAsset({ filename: `${base}.png`, kind: "image", source: "output", root_id: "r3" });
        });
        const ms = elapsed(() => {
            for (const asset of assets) mod.shouldHideSiblingAsset(asset, state, enabledSettings);
        });
        expect(ms).toBeLessThan(30);
    });
});

// ─── imagePreloader ──────────────────────────────────────────────────────────

describe("imagePreloader – deduplication and cache eviction", () => {
    const IMAGE_PRELOAD_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "gif", "bmp", "tiff"]);

    function makePreloader(state = {}) {
        return (async () => {
            const { createImagePreloader } = await import("../features/viewer/imagePreloader.js");
            return createImagePreloader({
                buildAssetViewURL: (a) => `/view/${a.id}.png`,
                IMAGE_PRELOAD_EXTENSIONS,
                state,
            });
        })();
    }

    it("skips already-preloaded keys (deduplication)", async () => {
        const state = {};
        const { preloadImageForAsset } = await makePreloader(state);
        const asset = makeAsset({ id: "dup-1", kind: "image" });

        preloadImageForAsset(asset, "/view/dup-1.png");
        preloadImageForAsset(asset, "/view/dup-1.png");
        preloadImageForAsset(asset, "/view/dup-1.png");

        // Only one key should be stored
        expect(state._preloadedAssetKeys?.size).toBe(1);
    });

    it("clears cache after 250-item limit", async () => {
        const state = {};
        const { preloadImageForAsset } = await makePreloader(state);

        for (let i = 0; i < 260; i++) {
            const asset = makeAsset({ id: `asset-${i}`, kind: "image" });
            preloadImageForAsset(asset, `/view/asset-${i}.png`);
        }
        // After clear the set is small (only items added since last clear)
        expect(state._preloadedAssetKeys?.size).toBeLessThan(20);
    });

    it("ignores non-image assets", async () => {
        const state = {};
        const { preloadImageForAsset } = await makePreloader(state);
        const video = makeAsset({ id: "v1", kind: "video", filename: "clip.mp4" });
        preloadImageForAsset(video, "/view/v1.mp4");
        expect(state._preloadedAssetKeys?.size ?? 0).toBe(0);
    });

    it("preloadAdjacentAssets skips out-of-bounds indices", async () => {
        const state = {};
        const { preloadAdjacentAssets } = await makePreloader(state);
        const assets = [makeAsset({ id: "only", kind: "image" })];
        preloadAdjacentAssets(assets, 0); // ±3 would go -3…+3 → all OOB except 0
        // The center itself is NOT preloaded (only adjacents)
        expect(state._preloadedAssetKeys?.size ?? 0).toBe(0);
    });

    it("preloadAdjacentAssets preloads ±3 neighbours from a large list", async () => {
        const state = {};
        const { preloadAdjacentAssets } = await makePreloader(state);
        const assets = Array.from({ length: 20 }, (_, i) =>
            makeAsset({ id: `img${i}`, kind: "image", filename: `img${i}.png` }),
        );
        preloadAdjacentAssets(assets, 10);
        // Expected: indices 7,8,9,11,12,13 → 6 assets
        expect(state._preloadedAssetKeys?.size).toBe(6);
    });

    it("preloads 300 unique assets under 100 ms", async () => {
        const state = {};
        const { preloadImageForAsset } = await makePreloader(state);
        const assets = Array.from({ length: 300 }, (_, i) =>
            makeAsset({ id: `bulk-${i}`, kind: "image", filename: `img${i}.png` }),
        );
        const ms = elapsed(() => {
            for (const a of assets) preloadImageForAsset(a, `/view/${a.id}.png`);
        });
        expect(ms).toBeLessThan(100);
    });
});

// ─── viewer/keyboard – rapid keydown dispatch ────────────────────────────────

describe("viewer/keyboard – rapid keydown dispatch", () => {
    let installViewerKeyboard;

    beforeEach(async () => {
        ({ installViewerKeyboard } = await import("../features/viewer/keyboard.js"));
    });

    function makeMinimalDeps(overrides = {}) {
        const overlay = document.createElement("div");
        overlay.style.display = "flex";
        document.body.appendChild(overlay);

        const state = {
            mode: "SINGLE",
            zoom: 1,
            assets: [
                makeAsset({ id: "k1", kind: "image" }),
                makeAsset({ id: "k2", kind: "image" }),
            ],
            currentIndex: 0,
            ...overrides.state,
        };
        const VIEWER_MODES = { SINGLE: "SINGLE" };
        const navigateCalls = [];

        return {
            overlay,
            state,
            VIEWER_MODES,
            navigateCalls,
            _content: document.createElement("div"),
            singleView: document.createElement("div"),
            computeOneToOneZoom: () => 1,
            setZoom: vi.fn(),
            scheduleOverlayRedraw: vi.fn(),
            scheduleApplyGrade: vi.fn(),
            syncToolsUIFromState: vi.fn(),
            applyDistractionFreeUI: vi.fn(),
            navigateViewerAssets: vi.fn((d) => navigateCalls.push(d)),
            closeViewer: vi.fn(),
            renderBadges: vi.fn(),
            updateAssetRating: vi.fn().mockResolvedValue({ ok: true }),
            safeDispatchCustomEvent: vi.fn(),
            ASSET_RATING_CHANGED_EVENT: "mjr:ratingChanged",
            probeTooltip: document.createElement("div"),
            loupeWrap: document.createElement("div"),
            getVideoControls: () => null,
            lifecycle: { unsubs: [] },
            renderGenInfoPanel: vi.fn(),
        };
    }

    it("dispatches 200 ArrowRight events under 100 ms", () => {
        const deps = makeMinimalDeps();
        const kb = installViewerKeyboard(deps);
        kb.bind();

        const ms = elapsed(() => {
            for (let i = 0; i < 200; i++) {
                window.dispatchEvent(
                    new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
                );
            }
        });
        expect(ms).toBeLessThan(100);
        expect(deps.navigateViewerAssets).toHaveBeenCalledTimes(200);
        kb.dispose();
    });

    it("dispatches 200 ArrowLeft events under 100 ms", () => {
        const deps = makeMinimalDeps();
        const kb = installViewerKeyboard(deps);
        kb.bind();

        const ms = elapsed(() => {
            for (let i = 0; i < 200; i++) {
                window.dispatchEvent(
                    new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
                );
            }
        });
        expect(ms).toBeLessThan(100);
        expect(deps.navigateViewerAssets).toHaveBeenCalledTimes(200);
        kb.dispose();
    });

    it("rating debounce: 50 rapid digit-key presses schedule only one pending update", () => {
        vi.useFakeTimers();
        const deps = makeMinimalDeps();
        const kb = installViewerKeyboard(deps);
        kb.bind();

        for (let i = 0; i < 50; i++) {
            const key = String((i % 5) + 1); // '1'..'5'
            window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
        }

        // Advance past debounce window (300 ms)
        vi.advanceTimersByTime(400);
        expect(deps.updateAssetRating).toHaveBeenCalledTimes(1);

        kb.dispose();
        vi.useRealTimers();
    });

    it("Escape calls closeViewer once", () => {
        const deps = makeMinimalDeps();
        const kb = installViewerKeyboard(deps);
        kb.bind();
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        expect(deps.closeViewer).toHaveBeenCalledTimes(1);
        kb.dispose();
    });

    it("F key toggles fullscreen without throwing", () => {
        const deps = makeMinimalDeps();
        const kb = installViewerKeyboard(deps);
        kb.bind();
        expect(() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "f", bubbles: true }));
        }).not.toThrow();
        kb.dispose();
    });

    it("bind/unbind lifecycle: events are ignored after unbind", () => {
        const deps = makeMinimalDeps();
        const kb = installViewerKeyboard(deps);
        kb.bind();
        kb.unbind();

        window.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
        );
        expect(deps.navigateViewerAssets).not.toHaveBeenCalled();
    });

    it("zoom +/- keys call setZoom", () => {
        const deps = makeMinimalDeps();
        const kb = installViewerKeyboard(deps);
        kb.bind();

        window.dispatchEvent(new KeyboardEvent("keydown", { key: "=", bubbles: true }));
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "-", bubbles: true }));

        expect(deps.setZoom).toHaveBeenCalledTimes(2);
        kb.dispose();
    });
});

// ─── mediaFactory – extension and fps helpers ────────────────────────────────

describe("mediaFactory – _extOf / _parseFps via createViewerMediaFactory", () => {
    // We test the public surface: createMediaElement / createCompareMediaElement
    // for different asset kinds — verifying they return a valid DOM element
    // without throwing, which exercises the kind-routing logic.

    let factory;

    beforeEach(async () => {
        const { createViewerMediaFactory } = await import("../features/viewer/mediaFactory.js");
        factory = createViewerMediaFactory({
            overlay: document.createElement("div"),
            state: {},
            mediaTransform: () => "",
            updateMediaNaturalSize: vi.fn(),
            clampPanToBounds: vi.fn(),
            applyTransform: vi.fn(),
            scheduleOverlayRedraw: vi.fn(),
            getGradeParams: () => ({}),
            isDefaultGrade: () => true,
            tonemap: "none",
            maxProcPixels: 4_000_000,
            maxProcPixelsVideo: 2_000_000,
            disableWebGL: true, // keep tests fast
            videoGradeThrottleFps: 0,
        });
    });

    const kinds = [
        { kind: "image", filename: "photo.png", url: "/view/photo.png" },
        { kind: "image", filename: "animated.gif", url: "/view/animated.gif" },
        { kind: "image", filename: "animated.webp", url: "/view/animated.webp" },
        { kind: "video", filename: "clip.mp4", url: "/view/clip.mp4" },
        { kind: "audio", filename: "track.wav", url: "/view/track.wav" },
        { kind: "unknown", filename: "data.bin", url: "/view/data.bin" },
    ];

    for (const { kind, filename, url } of kinds) {
        it(`createMediaElement for kind="${kind}" filename="${filename}" returns a DOM element`, () => {
            const asset = makeAsset({ id: `med-${kind}`, kind, filename });
            const el = factory.createMediaElement(asset, url);
            expect(el).toBeInstanceOf(Element);
        });

        it(`createCompareMediaElement for kind="${kind}" filename="${filename}" returns a DOM element`, () => {
            const asset = makeAsset({ id: `cmp-${kind}`, kind, filename });
            const el = factory.createCompareMediaElement(asset, url);
            expect(el).toBeInstanceOf(Element);
        });
    }

    it("creates 100 image elements under 500 ms", () => {
        const assets = Array.from({ length: 100 }, (_, i) =>
            makeAsset({ id: `bulk-img-${i}`, kind: "image", filename: `img${i}.png` }),
        );
        const ms = elapsed(() => {
            for (const a of assets) factory.createMediaElement(a, `/view/${a.id}.png`);
        });
        expect(ms).toBeLessThan(500);
    });

    it("applyTransformToVisibleMedia does not throw on empty overlay", () => {
        expect(() => factory.applyTransformToVisibleMedia()).not.toThrow();
    });
});
