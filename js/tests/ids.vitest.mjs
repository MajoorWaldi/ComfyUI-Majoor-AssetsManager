import { describe, expect, it } from "vitest";

import { normalizeAssetId } from "../utils/ids.js";

describe("normalizeAssetId", () => {
    it("accepts positive integer ids", () => {
        expect(normalizeAssetId(42)).toBe("42");
        expect(normalizeAssetId(" 42 ")).toBe("42");
    });

    it("rejects empty, non-numeric, and non-positive ids", () => {
        expect(normalizeAssetId("")).toBe("");
        expect(normalizeAssetId("abc")).toBe("");
        expect(normalizeAssetId("0")).toBe("");
        expect(normalizeAssetId("-7")).toBe("");
    });
});
