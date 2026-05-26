import { describe, expect, it, vi } from "vitest";

import {
    findAssetCardById,
    findSelectedAssetCard,
    readGridShownCount,
    readRenderedAssetCards,
} from "../vue/components/grid/gridDomBridge.js";

describe("gridDomBridge", () => {
    it("centralizes legacy card lookups behind selectors", () => {
        const selected = { id: "selected" };
        const cards = [{ id: "a" }, { id: "b" }];
        const byId = { id: "asset:1" };
        const grid = {
            dataset: { mjrShown: "12" },
            querySelector: vi.fn((selector) => {
                if (selector === ".mjr-asset-card.is-selected") return selected;
                if (selector.includes('data-mjr-asset-id="asset\\:1"')) return byId;
                return null;
            }),
            querySelectorAll: vi.fn((selector) => (selector === ".mjr-asset-card" ? cards : [])),
        };

        expect(readRenderedAssetCards(grid)).toEqual(cards);
        expect(findSelectedAssetCard(grid)).toBe(selected);
        expect(findAssetCardById(grid, "asset:1")).toBe(byId);
        expect(readGridShownCount(grid, 0)).toBe(12);
    });

    it("falls back safely when the DOM is unavailable", () => {
        expect(readRenderedAssetCards(null)).toEqual([]);
        expect(findSelectedAssetCard(null)).toBeNull();
        expect(findAssetCardById(null, "a")).toBeNull();
        expect(readGridShownCount({ dataset: { mjrShown: "NaN" } }, 7)).toBe(7);
    });
});
