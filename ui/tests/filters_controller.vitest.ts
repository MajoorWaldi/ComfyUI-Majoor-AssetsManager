import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { usePanelStore } from "../stores/usePanelStore.js";

class ElementStub {
    constructor() {
        (this as any).value = "";
        (this as any).checked = false;
        (this as any).listeners = new Map();
        (this as any).classList = {
            toggle: vi.fn(),
        };
    }

    addEventListener(type, handler) {
        const key = String(type);
        const handlers = (this as any).listeners.get(key) || [];
        handlers.push(handler);
        (this as any).listeners.set(key, handlers);
    }

    removeEventListener(type, handler) {
        const key = String(type);
        const handlers = (this as any).listeners.get(key) || [];
        (this as any).listeners.set(
            key,
            handlers.filter((item) => item !== handler),
        );
    }

    dispatchEvent(event) {
        const payload = event || {};
        payload.type = String(payload.type || "");
        payload.target = payload.target || this;
        for (const handler of (this as any).listeners.get(payload.type) || []) {
            handler(payload);
        }
    }
}

function createControl() {
    return new ElementStub();
}

describe("filtersController", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("clears stale max resolution bounds when a preset is selected", async () => {
        setActivePinia(createPinia());
        const panelStore = usePanelStore();
        const { bindFilters } = await import("../features/panel/controllers/filtersController.js");

        const state = {
            minWidth: 0,
            minHeight: 0,
            maxWidth: 1280,
            maxHeight: 720,
            minSizeMB: 0,
            maxSizeMB: 0,
            kindFilter: "",
            workflowOnly: false,
            minRating: 0,
            workflowType: "",
            dateRangeFilter: "",
            dateExactFilter: "",
        };

        const resolutionPresetSelect = createControl();
        const minWidthInput = createControl();
        const minHeightInput = createControl();
        const maxWidthInput = createControl();
        const maxHeightInput = createControl();
        (maxWidthInput as any).value = "1280";
        (maxHeightInput as any).value = "720";

        const reloadGrid = vi.fn(async () => ({}));
        const onFiltersChanged = vi.fn();
        const reconcileSelection = vi.fn();

        bindFilters({
            state,
            kindSelect: createControl(),
            wfCheckbox: createControl(),
            workflowTypeSelect: createControl(),
            ratingSelect: createControl(),
            minSizeInput: createControl(),
            maxSizeInput: createControl(),
            resolutionPresetSelect,
            minWidthInput,
            minHeightInput,
            maxWidthInput,
            maxHeightInput,
            dateRangeSelect: createControl(),
            dateExactInput: createControl(),
            reloadGrid,
            reconcileSelection,
            onFiltersChanged,
            lifecycleSignal: null,
        });

        (resolutionPresetSelect as any).value = "fhd";
        resolutionPresetSelect.dispatchEvent({ type: "change" });

        expect(panelStore.minWidth).toBe(1920);
        expect(panelStore.minHeight).toBe(1080);
        expect(panelStore.maxWidth).toBe(0);
        expect(panelStore.maxHeight).toBe(0);
        expect((minWidthInput as any).value).toBe("1920");
        expect((minHeightInput as any).value).toBe("1080");
        expect((maxWidthInput as any).value).toBe("");
        expect((maxHeightInput as any).value).toBe("");
        expect(onFiltersChanged).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(250);
        expect(reconcileSelection).toHaveBeenCalledTimes(1);
        expect(reloadGrid).toHaveBeenCalledTimes(1);
    });
});
