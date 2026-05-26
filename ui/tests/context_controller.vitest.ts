import { describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

import { createContextController } from "../features/panel/controllers/contextController.js";
import { usePanelStore } from "../stores/usePanelStore.js";

function createControl() {
    return {
        value: "",
        checked: false,
        classList: { toggle: vi.fn() },
    };
}

describe("contextController", () => {
    it("clears the search query through Pinia in pinia-only mode", async () => {
        setActivePinia(createPinia());
        const panelStore = usePanelStore();
        panelStore.searchQuery = "cats";

        const searchInputEl = createControl();
        searchInputEl.value = "cats";
        const reloadGrid = vi.fn(async () => ({}));

        const controller = createContextController({
            state: null,
            gridContainer: { dataset: {} },
            filterBtn: createControl(),
            sortBtn: createControl(),
            collectionsBtn: createControl(),
            searchInputEl,
            kindSelect: createControl(),
            wfCheckbox: createControl(),
            workflowTypeSelect: createControl(),
            ratingSelect: createControl(),
            minSizeInput: createControl(),
            maxSizeInput: createControl(),
            minWidthInput: createControl(),
            minHeightInput: createControl(),
            maxWidthInput: createControl(),
            maxHeightInput: createControl(),
            resolutionPresetSelect: createControl(),
            dateRangeSelect: createControl(),
            dateExactInput: createControl(),
            sortController: {
                setSortIcon: vi.fn(),
                renderSortMenu: vi.fn(),
            },
            updateSummaryBar: vi.fn(),
            reloadGrid,
        });

        await controller.actions.clearQuery();

        expect(searchInputEl.value).toBe("");
        expect(panelStore.searchQuery).toBe("");
        expect(reloadGrid).toHaveBeenCalledTimes(1);
    });
});
