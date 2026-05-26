import { describe, expect, it, vi } from "vitest";

vi.mock("../app/i18n.js", () => ({
    t: (key, fallback) =>
        ({
            "summary.assets": "Assets",
            "summary.selected": "Selected",
            "summary.hidden": "Hidden",
            "summary.duplicates": "Duplicates",
            "summary.similar": "Similar",
            "scope.output": "Output",
        })[key] ||
        fallback ||
        key,
}));

describe("summaryBarState", () => {
    it("builds summary text and duplicate badge state from grid datasets", async () => {
        const { buildSummaryBarState } = await import("../vue/components/panel/summaryBarState.js");

        const gridContainer = {
            dataset: {
                mjrTotal: "20",
                mjrShown: "8",
                mjrScope: "output",
                mjrSelectedAssetIds: JSON.stringify(["1", "2"]),
                mjrHiddenPngSiblings: "3",
                mjrHidePngSiblingsEnabled: "1",
            },
            _mjrGetRenderedCards: vi.fn(() => [
                { _mjrAsset: { kind: "image" } },
                { _mjrAsset: { kind: "folder" } },
            ]),
        };

        const result = buildSummaryBarState({
            state: {
                lastGridCount: 0,
                lastGridTotal: 0,
                selectedAssetIds: [],
                scope: "output",
                viewScope: "",
            },
            gridContainer,
            context: {
                rawQuery: "cats",
                duplicatesAlert: { exactCount: 2, similarCount: 1 },
            },
        });

        expect(result.shown).toBe(8);
        expect(result.total).toBe(20);
        expect(result.summaryText).toContain("Assets: 8/20");
        expect(result.summaryText).toContain("Selected: 2");
        expect(result.summaryText).toContain("Output");
        expect(result.summaryText).toContain("Hidden: 3");
        expect(result.showDuplicates).toBe(true);
        expect(result.duplicateText).toBe("Duplicates: 2 | Similar: 1");
        expect(result.rawQuery).toBe("cats");
    });
});
