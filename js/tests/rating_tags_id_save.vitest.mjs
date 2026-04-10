/**
 * rating_tags_id_save.vitest.mjs
 *
 * Tests that after a successful rating/tag save the returned DB asset_id
 * is stored on the asset object — even when the existing id is a synthetic
 * string ("asset:…") produced by AssetCardRenderer for unindexed assets.
 *
 * Bug: the original condition `props.asset.id == null` never triggered for
 * synthetic ids, so subsequent calls fell back to filepath-based resolution
 * that could fail with "File not found".
 */
import { describe, expect, it, vi } from "vitest";
import { normalizeAssetId } from "../utils/ids.js";

// ---------------------------------------------------------------------------
// normalizeAssetId rejects synthetic IDs
// ---------------------------------------------------------------------------

describe("normalizeAssetId rejects synthetic card IDs", () => {
    it("returns empty for asset:… prefixed ids", () => {
        expect(normalizeAssetId("asset:output||foo/bar.png||bar.png")).toBe("");
    });

    it("returns empty for non-integer string ids", () => {
        expect(normalizeAssetId("abc-123")).toBe("");
        expect(normalizeAssetId("asset:0")).toBe("");
        expect(normalizeAssetId(null)).toBe("");
        expect(normalizeAssetId(undefined)).toBe("");
        expect(normalizeAssetId(0)).toBe("");
    });

    it("returns valid string for positive integers", () => {
        expect(normalizeAssetId(42)).toBe("42");
        expect(normalizeAssetId("42")).toBe("42");
    });
});

// ---------------------------------------------------------------------------
// ID save-back logic (unit-level, no Vue mount)
// ---------------------------------------------------------------------------

/**
 * Simulates the ID save-back logic used in both RatingEditor.vue and
 * TagsEditor.vue after a successful API response.
 */
function applyIdSaveBack(asset, responseAssetId) {
    const newId = responseAssetId ?? null;
    // NEW condition matching the fix:
    if (newId != null && !normalizeAssetId(asset.id)) {
        asset.id = newId;
    }
}

describe("ID save-back after successful rating/tag update", () => {
    it("saves DB id when asset.id is null", () => {
        const asset = { id: null, filepath: "/output/img.png" };
        applyIdSaveBack(asset, 123);
        expect(asset.id).toBe(123);
    });

    it("saves DB id when asset.id is undefined", () => {
        const asset = { filepath: "/output/img.png" };
        applyIdSaveBack(asset, 456);
        expect(asset.id).toBe(456);
    });

    it("saves DB id when asset.id is a synthetic string", () => {
        const asset = { id: "asset:output||foo/bar.png||bar.png", filepath: "/output/bar.png" };
        applyIdSaveBack(asset, 789);
        expect(asset.id).toBe(789);
    });

    it("saves DB id when asset.id is empty string", () => {
        const asset = { id: "", filepath: "/output/img.png" };
        applyIdSaveBack(asset, 100);
        expect(asset.id).toBe(100);
    });

    it("saves DB id when asset.id is 0", () => {
        const asset = { id: 0, filepath: "/output/img.png" };
        applyIdSaveBack(asset, 55);
        expect(asset.id).toBe(55);
    });

    it("does NOT overwrite a valid integer id", () => {
        const asset = { id: 42, filepath: "/output/img.png" };
        applyIdSaveBack(asset, 999);
        // Already has a valid DB id — do not overwrite
        expect(asset.id).toBe(42);
    });

    it("does NOT overwrite a valid integer-string id", () => {
        const asset = { id: "42", filepath: "/output/img.png" };
        applyIdSaveBack(asset, 999);
        expect(asset.id).toBe("42");
    });

    it("does not save when response asset_id is null", () => {
        const asset = { id: "asset:synth", filepath: "/x.png" };
        applyIdSaveBack(asset, null);
        expect(asset.id).toBe("asset:synth");
    });

    it("does not save when response asset_id is undefined", () => {
        const asset = { id: "asset:synth", filepath: "/x.png" };
        applyIdSaveBack(asset, undefined);
        expect(asset.id).toBe("asset:synth");
    });
});
