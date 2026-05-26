import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("vue", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
    };
});

describe("useGridState", () => {
    let useGridState;

    beforeEach(async () => {
        vi.resetModules();
        const mod = await import("../vue/composables/useGridState.js");
        useGridState = mod.useGridState;
    });

    // -----------------------------------------------------------------------
    // Initial state
    // -----------------------------------------------------------------------
    it("returns initial state with defaults", () => {
        const { state } = useGridState();
        expect(state.query).toBe("*");
        expect(state.offset).toBe(0);
        expect(state.total).toBeNull();
        expect(state.loading).toBe(false);
        expect(state.done).toBe(false);
        expect(state.assets).toEqual([]);
        expect(state.selectedIds).toEqual([]);
        expect(state.activeId).toBe("");
    });

    it("provides a virtualGrid with setItems", () => {
        const { state } = useGridState();
        expect(state.virtualGrid).toBeDefined();
        state.virtualGrid.setItems([{ id: "1" }]);
        expect(state.assets).toEqual([{ id: "1" }]);
    });

    // -----------------------------------------------------------------------
    // resetAssets
    // -----------------------------------------------------------------------
    it("resetAssets clears assets and resets query/offset/done", () => {
        const { state, resetAssets } = useGridState();
        state.assets = [{ id: "1" }, { id: "2" }];
        state.offset = 100;
        state.seenKeys.add("k");

        resetAssets({ query: "cats", total: 42, done: true });

        expect(state.query).toBe("cats");
        expect(state.offset).toBe(0);
        expect(state.total).toBe(42);
        expect(state.done).toBe(true);
        expect(state.assets).toEqual([]);
        expect(state.seenKeys.size).toBe(0);
    });

    it("resetAssets defaults query to *", () => {
        const { resetAssets, state } = useGridState();
        resetAssets({});
        expect(state.query).toBe("*");
    });

    // -----------------------------------------------------------------------
    // resetCollections
    // -----------------------------------------------------------------------
    it("resetCollections preserves query but clears tracking sets", () => {
        const { state, resetCollections } = useGridState();
        state.query = "dogs";
        state.seenKeys.add("k1");
        state.assetIdSet.add("1");
        state.filenameCounts.set("f.png", 2);
        state.hiddenPngSiblings = 3;

        resetCollections();

        expect(state.query).toBe("dogs");
        expect(state.seenKeys.size).toBe(0);
        expect(state.assetIdSet.size).toBe(0);
        expect(state.filenameCounts.size).toBe(0);
        expect(state.hiddenPngSiblings).toBe(0);
    });

    // -----------------------------------------------------------------------
    // setSelection / reconcileSelection
    // -----------------------------------------------------------------------
    it("setSelection updates selectedIds and activeId", () => {
        const { setSelection, state } = useGridState();
        const result = setSelection(["1", "2"], "2");

        expect(result.selectedIds).toEqual(["1", "2"]);
        expect(result.activeId).toBe("2");
        expect(state.selectedIds).toEqual(["1", "2"]);
        expect(state.activeId).toBe("2");
    });

    it("setSelection defaults activeId to first selected", () => {
        const { setSelection, state } = useGridState();
        setSelection(["5", "3"]);
        expect(state.activeId).toBe("5");
    });

    it("setSelection deduplicates ids", () => {
        const { setSelection } = useGridState();
        const result = setSelection(["1", "2", "1"]);
        expect(result.selectedIds).toEqual(["1", "2"]);
    });

    it("setSelection clears anchor on empty selection", () => {
        const { setSelection, state } = useGridState();
        setSelection(["1"], "1");
        expect(state.selectionAnchorId).toBe("1");
        setSelection([]);
        expect(state.selectionAnchorId).toBe("");
    });

    it("reconcileSelection intersects with visibleAssetIds", () => {
        const { setSelection, reconcileSelection, state } = useGridState();
        state.assets = [{ id: "1" }, { id: "2" }, { id: "3" }];
        setSelection(["1", "2", "3"], "2");

        const result = reconcileSelection(["2", "3"]);
        expect(result.selectedIds).toEqual(["2", "3"]);
        expect(result.activeId).toBe("2");
    });

    it("reconcileSelection falls back to first visible if activeId removed", () => {
        const { setSelection, reconcileSelection } = useGridState();
        setSelection(["1", "2"], "1");

        const result = reconcileSelection(["2"]);
        expect(result.activeId).toBe("2");
    });

    // -----------------------------------------------------------------------
    // getSelectedAssets / getActiveAsset
    // -----------------------------------------------------------------------
    it("getSelectedAssets returns asset objects matching selectedIds", () => {
        const { state, setSelection, getSelectedAssets } = useGridState();
        state.assets = [{ id: "1" }, { id: "2" }, { id: "3" }];
        setSelection(["1", "3"]);

        const selected = getSelectedAssets();
        expect(selected).toEqual([{ id: "1" }, { id: "3" }]);
    });

    it("getActiveAsset returns the asset matching activeId", () => {
        const { state, setSelection, getActiveAsset } = useGridState();
        state.assets = [{ id: "1" }, { id: "2" }];
        setSelection(["1", "2"], "2");

        const active = getActiveAsset();
        expect(active).toEqual({ id: "2" });
    });

    it("getActiveAsset falls back to first selected if activeId not found", () => {
        const { state, setSelection, getActiveAsset } = useGridState();
        state.assets = [{ id: "1" }, { id: "2" }];
        setSelection(["1", "2"], "99");

        const active = getActiveAsset();
        expect(active).toEqual({ id: "1" });
    });

    it("getActiveAsset returns null when no selection", () => {
        const { getActiveAsset } = useGridState();
        expect(getActiveAsset()).toBeNull();
    });

    // -----------------------------------------------------------------------
    // Messages
    // -----------------------------------------------------------------------
    it("setStatusMessage / clearStatusMessage", () => {
        const { state, setStatusMessage, clearStatusMessage } = useGridState();
        setStatusMessage("Loading…", { error: false });
        expect(state.statusMessage).toBe("Loading…");
        expect(state.statusError).toBe(false);

        setStatusMessage("Oops", { error: true });
        expect(state.statusError).toBe(true);

        clearStatusMessage();
        expect(state.statusMessage).toBe("");
        expect(state.statusError).toBe(false);
    });

    it("setLoadingMessage / clearLoadingMessage", () => {
        const { state, setLoadingMessage, clearLoadingMessage } = useGridState();
        setLoadingMessage("Scanning…");
        expect(state.loadingMessage).toBe("Scanning…");

        clearLoadingMessage();
        expect(state.loadingMessage).toBe("");
    });

    // -----------------------------------------------------------------------
    // selectedIdSet computed
    // -----------------------------------------------------------------------
    it("selectedIdSet is a computed Set of normalized selectedIds", () => {
        const { selectedIdSet, setSelection } = useGridState();
        setSelection(["  10 ", "20"]);
        expect(selectedIdSet.value.has("10")).toBe(true);
        expect(selectedIdSet.value.has("20")).toBe(true);
        expect(selectedIdSet.value.size).toBe(2);
    });
});
