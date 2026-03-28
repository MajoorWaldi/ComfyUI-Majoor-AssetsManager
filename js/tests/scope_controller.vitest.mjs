import { describe, expect, it, vi } from "vitest";

import { createScopeController } from "../features/panel/controllers/scopeController.js";

function makeButton(scope) {
    const classes = new Set();
    return {
        dataset: { scope },
        style: { display: "" },
        classList: {
            toggle(name, active) {
                if (active) classes.add(name);
                else classes.delete(name);
            },
            has(name) {
                return classes.has(name);
            },
        },
    };
}

describe("scopeController similar scope", () => {
    it("activates a temporary similar scope and clears it cleanly", async () => {
        const tabButtons = {
            tabAll: makeButton("all"),
            tabInputs: makeButton("input"),
            tabOutputs: makeButton("output"),
            tabCustom: makeButton("custom"),
            tabSimilar: makeButton("similar"),
        };
        const state = {
            scope: "output",
            viewScope: "",
            similarResults: [{ asset_id: 7 }],
            similarTitle: "Similar to asset #42 (1 results)",
            similarSourceAssetId: "42",
            collectionId: "",
            collectionName: "",
            currentFolderRelativePath: "",
            customRootId: "",
        };
        const reloadGrid = vi.fn(async () => {});
        const onChanged = vi.fn();
        const onScopeChanged = vi.fn();
        const onBeforeReload = vi.fn();
        const popovers = { close: vi.fn() };
        const customMenuBtn = { style: { display: "" } };
        const customPopover = { style: { display: "" } };

        const controller = createScopeController({
            state,
            tabButtons,
            customMenuBtn,
            customPopover,
            popovers,
            reloadGrid,
            onChanged,
            onScopeChanged,
            onBeforeReload,
        });

        controller.setActiveTabStyles();
        expect(tabButtons.tabSimilar.style.display).toBe("");
        expect(tabButtons.tabOutputs.classList.has("is-active")).toBe(true);

        await controller.setScope("similar");
        expect(state.viewScope).toBe("similar");
        expect(tabButtons.tabSimilar.classList.has("is-active")).toBe(true);
        expect(onScopeChanged).not.toHaveBeenCalled();
        expect(onBeforeReload).toHaveBeenCalledTimes(1);
        expect(reloadGrid).toHaveBeenCalledTimes(1);

        await controller.clearSimilarScope({ reload: false });
        expect(state.viewScope).toBe("");
        expect(state.similarResults).toEqual([]);
        expect(state.similarTitle).toBe("");
        expect(state.similarSourceAssetId).toBe("");
        expect(tabButtons.tabSimilar.style.display).toBe("none");
    });
});
