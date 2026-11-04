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
        id: (overrides as any).id ?? Math.random().toString(36).slice(2),
        filename: (overrides as any).filename ?? "image.png",
        kind: (overrides as any).kind ?? "image",
        mtime: (overrides as any).mtime ?? Date.now(),
        size: (overrides as any).size ?? 1024,
        has_generation_data: (overrides as any).has_generation_data ?? 0,
        subfolder: (overrides as any).subfolder ?? "",
        source: (overrides as any).source ?? "output",
        root_id: (overrides as any).root_id ?? "root1",
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
        const names = Array.from(
            { length: 50_000 },
            (_, i) => `file_${i}.${exts[i % exts.length]}`,
        );
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
                ? makeAsset({
                      filename: `${base}.mp4`,
                      kind: "video",
                      source: "output",
                      root_id: "r3",
                  })
                : makeAsset({
                      filename: `${base}.png`,
                      kind: "image",
                      source: "output",
                      root_id: "r3",
                  });
        });
        const ms = elapsed(() => {
            for (const asset of assets) mod.shouldHideSiblingAsset(asset, state, enabledSettings);
        });
        expect(ms).toBeLessThan(30);
    });
});
