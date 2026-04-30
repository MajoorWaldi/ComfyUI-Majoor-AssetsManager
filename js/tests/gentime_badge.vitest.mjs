import { describe, expect, it } from "vitest";

import { genTimeColor, normalizeGenerationTimeMs } from "../components/Badges.js";

describe("generation time badge helpers", () => {
    it("normalise correctement les valeurs en ms et sec", () => {
        expect(normalizeGenerationTimeMs(8421)).toBe(8421);
        expect(normalizeGenerationTimeMs("8421")).toBe(8421);
        expect(normalizeGenerationTimeMs("8421ms")).toBe(8421);
        expect(normalizeGenerationTimeMs("8.421s")).toBeCloseTo(8421, 3);
    });

    it("rejette les valeurs invalides, negatives ou hors bornes", () => {
        expect(normalizeGenerationTimeMs(0)).toBe(0);
        expect(normalizeGenerationTimeMs(-20)).toBe(0);
        expect(normalizeGenerationTimeMs("")).toBe(0);
        expect(normalizeGenerationTimeMs("NaN")).toBe(0);
        expect(normalizeGenerationTimeMs(86_400_000)).toBe(0);
    });

    it("applique les paliers de couleur attendus", () => {
        expect(genTimeColor(5_000)).toBe("#4CAF50");
        expect(genTimeColor(12_000)).toBe("#8BC34A");
        expect(genTimeColor(35_000)).toBe("#FFC107");
        expect(genTimeColor(70_000)).toBe("#FF9800");
    });
});
