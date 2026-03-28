import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

class ElementStub {
    constructor() {
        this.value = "";
        this.checked = false;
        this.listeners = new Map();
        this.classList = {
            toggle: vi.fn(),
        };
    }

    addEventListener(type, handler) {
        const key = String(type);
        const handlers = this.listeners.get(key) || [];
        handlers.push(handler);
        this.listeners.set(key, handlers);
    }

    removeEventListener(type, handler) {
        const key = String(type);
        const handlers = this.listeners.get(key) || [];
        this.listeners.set(
            key,
            handlers.filter((item) => item !== handler),
        );
    }

    dispatchEvent(event) {
        const payload = event || {};
        payload.type = String(payload.type || "");
        payload.target = payload.target || this;
        for (const handler of this.listeners.get(payload.type) || []) {
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
        maxWidthInput.value = "1280";
        maxHeightInput.value = "720";

        const reloadGrid = vi.fn(async () => ({}));
        const onFiltersChanged = vi.fn();

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
            onFiltersChanged,
            lifecycleSignal: null,
        });

        resolutionPresetSelect.value = "fhd";
        resolutionPresetSelect.dispatchEvent({ type: "change" });

        expect(state.minWidth).toBe(1920);
        expect(state.minHeight).toBe(1080);
        expect(state.maxWidth).toBe(0);
        expect(state.maxHeight).toBe(0);
        expect(minWidthInput.value).toBe("1920");
        expect(minHeightInput.value).toBe("1080");
        expect(maxWidthInput.value).toBe("");
        expect(maxHeightInput.value).toBe("");
        expect(onFiltersChanged).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(250);
        expect(reloadGrid).toHaveBeenCalledTimes(1);
    });
});
