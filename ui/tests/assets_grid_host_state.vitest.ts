import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

import { usePanelStore } from "../stores/usePanelStore.js";
import {
    bindGridHostState,
    installGridScrollSync,
    restoreGridUiState,
} from "../vue/components/grid/assetsGridHostState.js";

function createFakeElement() {
    const el = new EventTarget();
    (el as any).dataset = {};
    (el as any).scrollTop = 0;
    (el as any).scrollLeft = 0;
    (el as any).querySelector = vi.fn(() => null);
    return el;
}

describe("assetsGridHostState", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.restoreAllMocks();
        globalThis.CustomEvent =
            globalThis.CustomEvent ||
            (class extends Event {
                constructor(type, init = {}) {
                    super(type);
                    (this as any).detail = (init as any).detail;
                }
            } as any);
        globalThis.requestAnimationFrame = (callback) => {
            (callback as any)();
            return 1;
        };
        globalThis.cancelAnimationFrame = () => {};
    });

    it("syncs scroll, stats, and selection into the panel store", () => {
        const panelStore = usePanelStore();
        const gridWrapper = createFakeElement();
        (gridWrapper as any).scrollTop = 91;

        const disposeScroll = installGridScrollSync(gridWrapper, panelStore);
        gridWrapper.dispatchEvent(new Event("scroll"));
        expect(panelStore.scrollTop).toBe(91);

        const gridContainer = createFakeElement();
        const onContextChanged = vi.fn();
        const markUserInteraction = vi.fn();
        const disposeState = bindGridHostState(gridContainer, {
            panelStore,
            onContextChanged,
            markUserInteraction,
        });

        gridContainer.dispatchEvent(
            new CustomEvent("mjr:grid-stats", {
                detail: { count: 5, total: 17 },
            }),
        );
        expect(panelStore.lastGridCount).toBe(5);
        expect(panelStore.lastGridTotal).toBe(17);

        gridContainer.dispatchEvent(
            new CustomEvent("mjr:selection-changed", {
                detail: { selectedIds: ["a1", "a2"], activeId: "a2" },
            }),
        );
        expect(panelStore.selectedAssetIds).toEqual(["a1", "a2"]);
        expect(panelStore.activeAssetId).toBe("a2");
        expect(markUserInteraction).toHaveBeenCalledTimes(1);
        expect(onContextChanged).toHaveBeenCalledTimes(2);

        disposeState();
        disposeScroll();
    });

    it("restores scroll, selection, and sidebar toggle from the panel store", async () => {
        const panelStore = usePanelStore();
        panelStore.scrollTop = 33;
        panelStore.selectedAssetIds = ["asset-7"];
        panelStore.activeAssetId = "asset-7";
        panelStore.sidebarOpen = true;

        const gridWrapper = createFakeElement();
        const gridContainer = createFakeElement();
        (gridContainer as any)._mjrSetSelection = vi.fn();
        (gridContainer as any)._mjrScrollToAssetId = vi.fn();

        const onRestoreSidebar = vi.fn();

        await restoreGridUiState({
            initialLoadPromise: Promise.resolve({ ok: true }),
            gridWrapper,
            gridContainer,
            panelStore,
            onRestoreSidebar,
        });

        expect((gridWrapper as any).scrollTop).toBe(33);
        expect((gridContainer as any)._mjrSetSelection).toHaveBeenCalledWith(
            ["asset-7"],
            "asset-7",
        );
        // scrollToAssetId is now always called so the selected card is scrolled into
        // view even when a saved scrollTop was restored (align:"auto" keeps the view
        // stable when the card is already visible).
        expect((gridContainer as any)._mjrScrollToAssetId).toHaveBeenCalledWith("asset-7");
        expect(onRestoreSidebar).toHaveBeenCalledTimes(1);
    });
});
