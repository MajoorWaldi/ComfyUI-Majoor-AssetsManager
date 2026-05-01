import { computed, shallowReactive } from "vue";

function normalizeIds(value) {
    return Array.from(value || [])
        .map((id) => String(id || "").trim())
        .filter(Boolean);
}

export function useGridState() {
    const state = shallowReactive({
        query: "*",
        offset: 0,
        cursor: null,
        total: null,
        loading: false,
        done: false,
        seenKeys: new Set(),
        assets: [],
        assetIdSet: new Set(),
        filenameCounts: new Map(),
        nonImageSiblingKeys: new Set(),
        stemMap: new Map(),
        renderedFilenameMap: new Map(),
        hiddenPngSiblings: 0,
        requestId: 0,
        abortController: null,
        loadingMessage: "",
        statusMessage: "",
        statusError: false,
        selectedIds: [],
        activeId: "",
        selectionAnchorId: "",
        cardElements: new Map(),
        virtualGrid: null,
    });

    state.virtualGrid = {
        setItems(items) {
            state.assets = Array.isArray(items) ? items.slice() : [];
        },
    };

    const selectedIdSet = computed(() => new Set(normalizeIds(state.selectedIds)));

    function setStatusMessage(message = "", { error = false } = {}) {
        state.statusMessage = String(message || "");
        state.statusError = !!error;
    }

    function clearStatusMessage() {
        state.statusMessage = "";
        state.statusError = false;
    }

    function clearLoadingMessage() {
        state.loadingMessage = "";
    }

    function setLoadingMessage(message = "") {
        state.loadingMessage = String(message || "");
    }

    function resetCollections() {
        state.seenKeys = new Set();
        state.assetIdSet = new Set();
        state.filenameCounts = new Map();
        state.nonImageSiblingKeys = new Set();
        state.stemMap = new Map();
        state.renderedFilenameMap = new Map();
        state.hiddenPngSiblings = 0;
    }

    function resetAssets({ query = "*", total = null, done = false } = {}) {
        state.query = String(query || "*") || "*";
        state.offset = 0;
        state.cursor = null;
        state.total = total == null ? null : Number(total) || 0;
        state.done = !!done;
        state.assets = [];
        resetCollections();
    }

    function setSelection(ids, activeId = "", { preserveAnchor = false } = {}) {
        const nextIds = Array.from(new Set(normalizeIds(ids)));
        const nextActive = String(activeId || nextIds[0] || "").trim();
        state.selectedIds = nextIds;
        state.activeId = nextActive;
        if (!preserveAnchor) {
            if (nextActive) {
                state.selectionAnchorId = nextActive;
            } else if (!nextIds.length) {
                state.selectionAnchorId = "";
            }
        }
        return {
            selectedIds: nextIds,
            activeId: nextActive,
        };
    }

    function reconcileSelection(visibleAssetIds, { activeId = "" } = {}) {
        const visible = new Set(normalizeIds(visibleAssetIds));
        const nextIds = normalizeIds(state.selectedIds).filter((id) => visible.has(id));
        const nextActive = String(activeId || state.activeId || nextIds[0] || "").trim();
        const resolvedActive = visible.has(nextActive) ? nextActive : nextIds[0] || "";
        // Pruning visible assets must not reset the Shift+Click anchor.
        return setSelection(nextIds, resolvedActive, { preserveAnchor: true });
    }

    function getSelectedAssets() {
        const selected = selectedIdSet.value;
        return (Array.isArray(state.assets) ? state.assets : []).filter((asset) =>
            selected.has(String(asset?.id || "")),
        );
    }

    function getActiveAsset() {
        const activeId = String(state.activeId || "").trim();
        if (activeId) {
            const found = (Array.isArray(state.assets) ? state.assets : []).find(
                (asset) => String(asset?.id || "") === activeId,
            );
            if (found) return found;
        }
        return getSelectedAssets()[0] || null;
    }

    return {
        state,
        selectedIdSet,
        setLoadingMessage,
        clearLoadingMessage,
        setStatusMessage,
        clearStatusMessage,
        resetCollections,
        resetAssets,
        setSelection,
        reconcileSelection,
        getSelectedAssets,
        getActiveAsset,
    };
}
