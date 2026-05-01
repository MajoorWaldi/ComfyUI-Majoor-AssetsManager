<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, watch } from "vue";
import { APP_CONFIG } from "../../../app/config.js";
import { EVENTS } from "../../../app/events.js";
import { get } from "../../../api/client.js";
import { buildStackMembersURL } from "../../../api/endpoints.js";
import { requestViewerOpen } from "../../../features/viewer/viewerOpenRequest.js";
import { ensureStackGroupCard, ensureDupStackCard } from "../../../features/grid/StackGroupCards.js";
import { setSelectedIdsDataset } from "../../../features/grid/GridSelectionManager.js";
import { applyGridSettingsClasses, configureGridContainer } from "../../../features/grid/gridApi.js";
import { bindAssetDragStart } from "../../../features/dnd/DragDrop.js";
import { preserveRepresentativeGenerationTime, selectStackRepresentative } from "../../../features/grid/AssetCardRenderer.js";
import AssetCardInner from "./AssetCardInner.vue";
import FolderCard from "./FolderCard.vue";
import { useGridState } from "../../composables/useGridState.js";
import { useGridLoader } from "../../composables/useGridLoader.js";
import { isGridHostVisible } from "../../composables/gridVisibility.js";
import { buildStaticGridRows, useGridVirtualRows } from "../../grid/useGridVirtualRows.js";
import { useInfiniteTrigger } from "../../grid/useInfiniteTrigger.js";
import { buildDisplayAssets, isRenderableAsset } from "../../grid/useGridDisplayAssets.js";
import { readRenderedAssetCards } from "./gridDomBridge.js";

const props = defineProps({
    scrollElement: {
        type: [Object, null],
        default: null,
    },
    virtualize: {
        type: Boolean,
        default: true,
    },
    applyDefaultSettingsClasses: {
        type: Boolean,
        default: true,
    },
    onCardRendered: {
        type: Function,
        default: null,
    },
    onCardDblclick: {
        type: Function,
        default: null,
    },
    emitWindowSelectionEvents: {
        type: Boolean,
        default: true,
    },
});

const gridContainerRef = ref(null);
const hostWidth = ref(1024); // Fallback until ResizeObserver fires
const hasMeasuredHostWidthOnce = ref(true); // Don't block first render
const settingsVersion = ref(0);
const scrollVelocityRows = ref(0);
const cardFilenameKeys = new WeakMap();
let measureRaf = 0;
let lastScrollSampleTop = 0;
let lastScrollSampleAt = 0;

// ─── Stack service (provide/inject for AssetCardInner Vue buttons) ────────────

function _sortMembersByMtime(items) {
    return (Array.isArray(items) ? items : []).slice().sort((a, b) => {
        const am = Number(a?.mtime || a?.created_at || 0) || 0;
        const bm = Number(b?.mtime || b?.created_at || 0) || 0;
        return bm - am;
    });
}

provide("mjrStackService", {
    openStackGroup: async (asset) => {
        const gc = gridContainerRef.value;
        if (!gc || !asset) return;
        const stackId = String(asset.stack_id || "").trim();
        if (!stackId) return;
        const groupKey = `stack:${stackId}`;
        if (!gc._mjrStackMembersCache) gc._mjrStackMembersCache = new Map();
        let members = gc._mjrStackMembersCache.get(groupKey);
        if (!Array.isArray(members)) {
            const res = await get(buildStackMembersURL(stackId), { timeoutMs: 30_000 });
            if (res?.ok && Array.isArray(res?.data)) {
                members = res.data;
                gc._mjrStackMembersCache.set(groupKey, members);
            } else {
                return;
            }
        }
        const ordered = _sortMembersByMtime(members);
        gc.dispatchEvent(
            new CustomEvent(EVENTS.OPEN_STACK_GROUP, {
                bubbles: true,
                detail: {
                    asset,
                    members: ordered,
                    title: `Generation group (${ordered.length} assets)`,
                    stackId,
                },
            }),
        );
    },
    openDupGroup: (asset) => {
        const gc = gridContainerRef.value;
        if (!gc || !asset) return;
        const members = Array.isArray(asset._mjrDupMembers) ? asset._mjrDupMembers : [asset];
        gc.dispatchEvent(
            new CustomEvent(EVENTS.OPEN_STACK_GROUP, {
                bubbles: true,
                detail: {
                    asset,
                    members,
                    title: `Duplicates — ${members.length} copies`,
                    isDupGroup: true,
                },
            }),
        );
    },
});

const {
    state,
    selectedIdSet,
    setLoadingMessage,
    clearLoadingMessage,
    setStatusMessage,
    clearStatusMessage,
    resetAssets,
    setSelection,
    reconcileSelection,
    getSelectedAssets,
    getActiveAsset,
} = useGridState();

function resolveElement(maybeRef) {
    if (!maybeRef) return null;
    if (typeof maybeRef === "object" && "value" in maybeRef) {
        return maybeRef.value || null;
    }
    return maybeRef;
}

const scrollElementRef = computed(() => resolveElement(props.scrollElement));

function readRenderedCards() {
    return readRenderedAssetCards(gridContainerRef.value);
}

function scrollToAssetId(assetId, { align = "auto" } = {}) {
    const id = String(assetId || "").trim();
    if (!id) return;
    const visibleAssets = Array.isArray(renderableAssets.value) ? renderableAssets.value : [];
    const index = visibleAssets.findIndex(
        (asset) => String(asset?.id || "") === id,
    );
    if (index < 0) return;

    if (props.virtualize) {
        const rowIndex = Math.floor(index / Math.max(1, columnCount.value));
        try {
            rowVirtualizer.value.scrollToIndex(rowIndex, { align });
        } catch (e) {
            console.debug?.(e);
        }
        return;
    }

    try {
        state.cardElements.get(id)?.scrollIntoView?.({
            block: "nearest",
            inline: "nearest",
        });
    } catch (e) {
        console.debug?.(e);
    }
}

function isGridVisible() {
    return isGridHostVisible(gridContainerRef.value, scrollElementRef.value);
}

const loader = useGridLoader({
    gridContainerRef,
    state,
    setLoadingMessage,
    clearLoadingMessage,
    setStatusMessage,
    clearStatusMessage,
    resetAssets,
    setSelection,
    reconcileSelection,
    readScrollElement: () => scrollElementRef.value,
    readRenderedCards,
    scrollToAssetId,
    canLoadMore: isGridVisible,
});

const infiniteCanLoad = computed(() => !state.loading && !state.done && isGridVisible());
const { sentinelRef: infiniteSentinelRef } = useInfiniteTrigger({
    rootRef: scrollElementRef,
    enabled: true,
    canLoad: infiniteCanLoad,
    loadMore: () => loader.loadNextPage(),
    rootMargin: "900px",
});

function getAssetExt(asset) {
    const filename = String(asset?.filename || "");
    const idx = filename.lastIndexOf(".");
    return idx >= 0 ? filename.slice(idx + 1).toUpperCase() : "";
}

function getAssetStem(asset) {
    const filename = String(asset?.filename || "");
    const idx = filename.lastIndexOf(".");
    return idx >= 0 ? filename.slice(0, idx).toLowerCase() : filename.toLowerCase();
}

function isSelected(asset) {
    return selectedIdSet.value.has(String(asset?.id || ""));
}

function isFolderAsset(asset) {
    return String(asset?.kind || "").toLowerCase() === "folder";
}

function isAssetStacked(asset) {
    const gc = gridContainerRef.value;
    if (!gc || String(gc.dataset?.mjrGroupStacks || "") !== "1") return false;
    return !!String(asset?.stack_id || "").trim() && Number(asset?.stack_asset_count || 0) > 1;
}

function isLivePlaceholderAsset(asset) {
    return (
        asset?._mjrLivePlaceholder === true ||
        asset?.is_live_placeholder === true ||
        String(asset?.id || "")
            .trim()
            .toLowerCase()
            .startsWith("live:")
    );
}

function updateSelectionDatasets() {
    const container = gridContainerRef.value;
    if (!container) return;
    const set = new Set(
        (Array.isArray(state.selectedIds) ? state.selectedIds : [])
            .map((id) => String(id || "").trim())
            .filter(Boolean),
    );
    setSelectedIdsDataset(container, set, state.activeId || "");
    try {
        if (set.size) {
            container.dataset.mjrSelectedAssetId = String(state.activeId || Array.from(set)[0] || "");
        } else {
            delete container.dataset.mjrSelectedAssetId;
        }
    } catch (e) {
        console.debug?.(e);
    }
}

function emitSelectionChanged() {
    const container = gridContainerRef.value;
    if (!container) return;
    const selectedIds = Array.isArray(state.selectedIds) ? state.selectedIds.slice() : [];
    const activeId = String(state.activeId || "");
    const selectionKey = `${selectedIds.join("|")}::${activeId}`;
    if (selectionKey === emitSelectionChanged._lastSelectionKey) return;
    emitSelectionChanged._lastSelectionKey = selectionKey;
    const selectedAssets = getSelectedAssets();
    const detail = {
        selectedIds,
        activeId,
        selectedAssets,
    };
    try {
        container.dispatchEvent(new CustomEvent("mjr:selection-changed", { detail }));
    } catch (e) {
        console.debug?.(e);
    }
    if (props.emitWindowSelectionEvents) {
        try {
            window.dispatchEvent(new CustomEvent("mjr:selection-changed", { detail }));
        } catch (e) {
            console.debug?.(e);
        }
    }
}

emitSelectionChanged._lastSelectionKey = "";

const displayAssets = computed(() => buildDisplayAssets(state.assets));

const renderableAssets = computed(() => {
    const assets = Array.isArray(displayAssets.value) ? displayAssets.value : [];
    return assets.filter((asset) => isRenderableAsset(asset));
});

function emitGridStats() {
    const container = gridContainerRef.value;
    if (!container) return;
    const detail = {
        count: Array.isArray(renderableAssets.value) ? renderableAssets.value.length : 0,
        total: Number(state.total || 0) || 0,
    };
    try {
        container.dataset.mjrShown = String(detail.count);
        container.dataset.mjrTotal = String(detail.total);
        container.dataset.mjrHiddenPngSiblings = String(
            Number(state.hiddenPngSiblings || 0) || 0,
        );
    } catch (e) {
        console.debug?.(e);
    }
    try {
        container.dispatchEvent(new CustomEvent("mjr:grid-stats", { detail }));
    } catch (e) {
        console.debug?.(e);
    }
}

function onKeyboardAssetChanged(asset) {
    if (!asset?.id) return;
    const target = (Array.isArray(state.assets) ? state.assets : []).find(
        (entry) => String(entry?.id || "") === String(asset.id),
    );
    if (!target) return;
    try {
        target.rating = asset.rating;
        target.tags = asset.tags;
    } catch (e) {
        console.debug?.(e);
    }
}

function openKeyboardDetails() {
    try {
        window.dispatchEvent(new CustomEvent("mjr:open-sidebar", { detail: { tab: "details" } }));
    } catch (e) {
        console.debug?.(e);
    }
}

function installGridApi(container) {
    if (!container) return;
    container._mjrSelectionManagedByVue = true;
    try {
        container._mjrPrimaryPointerSelectionUnbind?.();
    } catch (e) {
        console.debug?.(e);
    }
    try {
        disposeAssetDragStart?.();
    } catch (e) {
        console.debug?.(e);
    }
    configureGridContainer(container, {
        applySettingsClasses: props.applyDefaultSettingsClasses,
    });
    try {
        disposeAssetDragStart = bindAssetDragStart(container);
    } catch (e) {
        console.debug?.(e);
        disposeAssetDragStart = null;
    }
    container._mjrPrimaryPointerSelectionUnbind = () => {};
    container._mjrGetAssets = () =>
        Array.isArray(renderableAssets.value) ? renderableAssets.value : [];
    container._mjrSetSelection = (ids, activeId = "") => {
        const detail = setSelection(ids, activeId);
        updateSelectionDatasets();
        emitSelectionChanged();
        return detail.selectedIds;
    };
    const removeAssetsFromGrid = (assetIds, options = {}) => {
        const result = loader.removeAssets(assetIds, options);
        emitGridStats();
        return result;
    };
    container._mjrRemoveAssets = removeAssetsFromGrid;
    container._mjrGetRenderedCards = () => readRenderedCards();
    container._mjrScrollToAssetId = (assetId, options = {}) => {
        scrollToAssetId(assetId, options);
    };
    container._mjrHasAssetId = (assetId) =>
        (Array.isArray(state.assets) ? state.assets : []).some(
            (asset) => String(asset?.id || "") === String(assetId || ""),
        );
    container._mjrGetGridState = () => state;
    container._mjrGetSelectedAssets = () => getSelectedAssets();
    container._mjrGetActiveAsset = () => getActiveAsset();
    container._mjrOnKeyboardAssetChanged = (asset) => onKeyboardAssetChanged(asset);
    container._mjrOpenKeyboardDetails = () => openKeyboardDetails();
    const refreshGridApi = () => {
        if (props.applyDefaultSettingsClasses) {
            applyGridSettingsClasses(container);
            settingsVersion.value += 1;
        }
        return loader.refreshGrid();
    };
    const disposeGridApi = () => {
        loader.prepareGridForScopeSwitch();
        loader.dispose();
        state.cardElements.clear();
        container._mjrGridApi = null;
    };
    container._mjrGridApi = {
        reload: (...args) => loader.reload(...args),
        loadAssetsFromList: (...args) => loader.loadAssetsFromList(...args),
        appendNextPage: (...args) => loader.appendNextPage(...args),
        refreshHead: (...args) => loader.refreshHead(...args),
        upsertRealtime: (...args) => loader.upsertRealtime(...args),
        upsertRealtimeNow: (...args) => loader.upsertAssetNow(...args),
        prepareForScopeSwitch: () => loader.prepareGridForScopeSwitch(),
        refreshGrid: refreshGridApi,
        captureAnchor: () => loader.captureAnchor(),
        restoreAnchor: (anchor) => loader.restoreAnchor(anchor),
        hydrateFromSnapshot: (...args) => loader.hydrateFromSnapshot(...args),
        removeAssets: removeAssetsFromGrid,
        dispose: disposeGridApi,
        getCanonicalState: () => loader.getCanonicalState(),
        getDebugSnapshot: () => loader.getDebugSnapshot(),
    };
    container._mjrLoadAssets = (...args) => loader.loadAssets(...args);
    container._mjrLoadAssetsFromList = (...args) => loader.loadAssetsFromList(...args);
    container._mjrPrepareForScopeSwitch = () => loader.prepareGridForScopeSwitch();
    container._mjrRefreshGrid = refreshGridApi;
    container._mjrCaptureAnchor = () => loader.captureAnchor();
    container._mjrRestoreAnchor = (anchor) => loader.restoreAnchor(anchor);
    container._mjrHydrateFromSnapshot = (...args) => loader.hydrateFromSnapshot(...args);
    container._mjrUpsertAsset = (asset) => loader.upsertAsset(asset);
    container._mjrUpsertAssetNow = (asset) => loader.upsertAssetNow(asset);
    container._mjrGetCanonicalState = () => loader.getCanonicalState();
    container._mjrGetDebugSnapshot = () => loader.getDebugSnapshot();
    container._mjrDispose = disposeGridApi;
}

watch(
    gridContainerRef,
    (container) => {
        if (container) {
            installGridApi(container);
            updateSelectionDatasets();
            emitGridStats();
        }
    },
    { immediate: true },
);

watch(
    () => `${(state.selectedIds || []).join("|")}::${String(state.activeId || "")}`,
    () => {
        if (!gridContainerRef.value) return;
        updateSelectionDatasets();
        emitSelectionChanged();
    },
    { flush: "post" },
);

watch(
    () =>
        `${Array.isArray(renderableAssets.value) ? renderableAssets.value.length : 0}::${Number(state.total || 0)}::${Number(state.hiddenPngSiblings || 0)}`,
    () => {
        if (!gridContainerRef.value) return;
        emitGridStats();
    },
    { flush: "post", immediate: true },
);

function getActiveGridMinSize() {
    const container = gridContainerRef.value;
    const isBottomFeed = String(container?.dataset?.mjrBottomFeed || "").toLowerCase() === "true";
    const fallbackMinSize = Number(APP_CONFIG.GRID_MIN_SIZE || 120) || 120;
    if (isBottomFeed) {
        return Math.max(
            80,
            Number(APP_CONFIG.FEED_GRID_MIN_SIZE || fallbackMinSize) || fallbackMinSize,
        );
    }
    return Math.max(80, fallbackMinSize);
}

const columnCount = computed(() => {
    settingsVersion.value;
    const gap = Math.max(0, Number(APP_CONFIG.GRID_GAP || 10) || 10);
    const minWidth = getActiveGridMinSize();
    const width = Number(hostWidth.value || 0) || Number(scrollElementRef.value?.clientWidth || 0) || 0;
    if (width <= 0) return 1;
    return Math.max(1, Math.floor((width + gap) / (minWidth + gap)));
});

const hasMeasuredHostWidth = computed(() => {
    const width = Number(hostWidth.value || 0) || Number(scrollElementRef.value?.clientWidth || 0) || 0;
    return width > 0;
});

const gapPx = computed(() => {
    settingsVersion.value;
    return Math.max(0, Number(APP_CONFIG.GRID_GAP || 10) || 10);
});

const itemWidth = computed(() => {
    const cols = Math.max(1, columnCount.value);
    const width =
        Number(hostWidth.value || 0) || Number(scrollElementRef.value?.clientWidth || 0) || 0;
    if (width <= 0) return getActiveGridMinSize();
    return Math.max(80, Math.floor((width - gapPx.value * Math.max(0, cols - 1)) / cols));
});

const estimateRowHeight = computed(() => {
    settingsVersion.value;
    const showDetails = !!APP_CONFIG.GRID_SHOW_DETAILS;
    const thumbHeight = itemWidth.value;
    const metaHeight = showDetails ? 82 : 0;
    return thumbHeight + metaHeight + gapPx.value;
});

const rows = computed(() => {
    const assets = Array.isArray(renderableAssets.value) ? renderableAssets.value : [];
    if (props.virtualize) return [];
    return buildStaticGridRows(assets, columnCount.value);
});

function updateScrollVelocity(element) {
    try {
        const now = typeof performance !== "undefined" && typeof performance.now === "function"
            ? performance.now()
            : Date.now();
        const top = Number(element?.scrollTop || 0) || 0;
        const dt = Math.max(16, now - Number(lastScrollSampleAt || now));
        const dy = Math.abs(top - Number(lastScrollSampleTop || top));
        const rowsPerFrame = (dy / Math.max(1, estimateRowHeight.value)) * (16 / dt);
        scrollVelocityRows.value = Math.max(0, Math.min(20, rowsPerFrame));
        lastScrollSampleTop = top;
        lastScrollSampleAt = now;
    } catch (e) {
        console.debug?.(e);
    }
}

// Adaptive overscan: keep ~1 full viewport of rows buffered, plus extra rows
// during fast scrolls, clamped to avoid runaway render bursts.
const adaptiveOverscan = computed(() => {
    const rowH = Math.max(1, estimateRowHeight.value);
    const clientH = scrollElementRef.value?.clientHeight || 0;
    if (clientH <= 0) return 6;
    const viewportRows = Math.ceil(clientH / rowH);
    const velocityRows = Math.ceil(scrollVelocityRows.value * 3);
    return Math.max(3, Math.min(30, viewportRows + velocityRows));
});

const gridVirtualRows = useGridVirtualRows({
    scrollRef: scrollElementRef,
    items: renderableAssets,
    columnCount,
    estimateRowHeight,
    overscan: adaptiveOverscan,
    enabled: computed(() => props.virtualize),
});

const rowCount = gridVirtualRows.rowCount;
const rowVirtualizer = gridVirtualRows.virtualizer;
const virtualRowsWithItems = gridVirtualRows.virtualRows;
const totalSize = gridVirtualRows.totalSize;

const virtualRowByIndex = computed(() => {
    const map = new Map();
    for (const row of virtualRowsWithItems.value) {
        map.set(row.index, row.virtual || row);
    }
    return map;
});

const showGridDetails = computed(() => {
    settingsVersion.value;
    return !!APP_CONFIG.GRID_SHOW_DETAILS;
});

const skeletonCardCount = computed(() => {
    const cols = Math.max(1, Number(columnCount.value || 1));
    return Math.max(12, Math.min(36, cols * 4));
});

const skeletonCards = computed(() =>
    Array.from({ length: Number(skeletonCardCount.value || 12) }, (_, index) => index),
);

const skeletonRows = computed(() => {
    const cols = Math.max(1, Number(columnCount.value || 1));
    const cards = skeletonCards.value;
    const rowsList = [];
    for (let index = 0; index < cards.length; index += cols) {
        rowsList.push(cards.slice(index, index + cols));
    }
    return rowsList;
});

const skeletonMetaHeight = computed(() => {
    const cardHeight = Math.max(80, Number(estimateRowHeight.value || 0) - Number(gapPx.value || 0));
    const thumb = Math.max(80, Number(itemWidth.value || 0));
    return Math.max(0, cardHeight - thumb);
});

const skeletonRowStyle = computed(() => ({
    display: "flex",
    gap: `${gapPx.value}px`,
    paddingBottom: `${gapPx.value}px`,
    boxSizing: "border-box",
}));

const skeletonCardStyle = computed(() => {
    const width = Math.max(80, Number(itemWidth.value || 0));
    const cardHeight = Math.max(80, Number(estimateRowHeight.value || 0) - Number(gapPx.value || 0));
    return {
        width: `${width}px`,
        flex: `0 0 ${width}px`,
        minWidth: `${width}px`,
        height: `${cardHeight}px`,
        borderRadius: "12px",
        border: "1px solid rgba(255,255,255,0.22)",
        background: "rgba(192,198,206,0.20)",
        overflow: "hidden",
        boxShadow: "0 6px 18px rgba(0,0,0,0.24)",
        boxSizing: "border-box",
    };
});

const skeletonThumbStyle = computed(() => {
    const width = Math.max(80, Number(itemWidth.value || 0));
    return {
        width: "100%",
        height: `${width}px`,
        background: "linear-gradient(90deg, rgba(168,174,182,0.40) 0%, rgba(220,225,232,0.54) 50%, rgba(168,174,182,0.40) 100%)",
        backgroundSize: "220% 100%",
        animation: "mjr-skeleton-shimmer 2.2s ease-in-out infinite",
    };
});

const skeletonLineTitleStyle = computed(() => ({
    height: "10px",
    margin: "10px 10px 6px",
    borderRadius: "8px",
    width: "72%",
    background: "linear-gradient(90deg, rgba(162,168,176,0.38) 0%, rgba(214,219,226,0.52) 50%, rgba(162,168,176,0.38) 100%)",
    backgroundSize: "220% 100%",
    animation: "mjr-skeleton-shimmer 2.2s ease-in-out infinite",
}));

const skeletonLineMetaStyle = computed(() => ({
    height: "10px",
    margin: "0 10px 10px",
    borderRadius: "8px",
    width: "48%",
    background: "linear-gradient(90deg, rgba(160,166,173,0.34) 0%, rgba(208,214,221,0.48) 50%, rgba(160,166,173,0.34) 100%)",
    backgroundSize: "220% 100%",
    animation: "mjr-skeleton-shimmer 2.2s ease-in-out infinite",
}));

const skeletonInfoStyle = computed(() => ({
    display: showGridDetails.value ? "block" : "none",
    minHeight: `${Math.max(0, Number(skeletonMetaHeight.value || 0))}px`,
}));

function updateHostWidth() {
    const width =
        Number(scrollElementRef.value?.clientWidth || 0) ||
        Number(gridContainerRef.value?.clientWidth || 0) ||
        0;
    if (width > 0) {
        hostWidth.value = width;
    }
}

let resizeObserver = null;
let disposeAssetDragStart = null;
let settingsListenerBound = false;

function scheduleInitialHostMeasurements() {
    _forceVirtualizerMeasure();
    const measureSoon = () => {
        _forceVirtualizerMeasure();
        void maybeFillViewport();
    };
    try {
        requestAnimationFrame(() => {
            requestAnimationFrame(measureSoon);
        });
    } catch {
        setTimeout(measureSoon, 0);
    }
    for (const delayMs of [80, 180, 400]) {
        setTimeout(measureSoon, delayMs);
    }
}

onMounted(() => {
    scheduleInitialHostMeasurements();
});

watch(
    scrollElementRef,
    (element, previous) => {
        try {
            resizeObserver?.disconnect?.();
        } catch (e) {
            console.debug?.(e);
        }
        if (!element) return;
        updateHostWidth();
        try {
            resizeObserver = new ResizeObserver(() => {
                updateHostWidth();
            });
            resizeObserver.observe(element);
        } catch (e) {
            console.debug?.(e);
            resizeObserver = null;
        }
    },
    { immediate: true },
);

watch(
    () => rowCount.value,
    async () => {
        if (!hasMeasuredHostWidth.value) return;
        await nextTick();
        syncAllRenderedDuplicateCards();
        scheduleVirtualizerMeasure();
    },
);

watch(
    () => state.assets,
    async (newAssets) => {
        if (!Array.isArray(newAssets) || newAssets.length === 0) {
            const gc = gridContainerRef.value;
            if (gc?._mjrStackMembersCache) gc._mjrStackMembersCache.clear();
        }
        await nextTick();
        syncAllRenderedDuplicateCards();
    },
);

function registerFilenameCard(card, asset) {
    const nextKey = String(asset?.filename || "").trim().toLowerCase();
    const prevKey = cardFilenameKeys.get(card);
    if (prevKey && prevKey !== nextKey) {
        const prevSet = state.renderedFilenameMap.get(prevKey);
        if (prevSet) {
            prevSet.delete(card);
            if (!prevSet.size) state.renderedFilenameMap.delete(prevKey);
        }
    }
    if (!nextKey) {
        cardFilenameKeys.delete(card);
        return;
    }
    let cards = state.renderedFilenameMap.get(nextKey);
    if (!cards) {
        cards = new Set();
        state.renderedFilenameMap.set(nextKey, cards);
    }
    cards.add(card);
    cardFilenameKeys.set(card, nextKey);
}

function unregisterFilenameCard(card) {
    if (!card) return;
    const prevKey = cardFilenameKeys.get(card);
    if (!prevKey) return;
    const prevSet = state.renderedFilenameMap.get(prevKey);
    if (prevSet) {
        prevSet.delete(card);
        if (!prevSet.size) state.renderedFilenameMap.delete(prevKey);
    }
    cardFilenameKeys.delete(card);
}

function syncRenderedDuplicateCards(filenameKey) {
    const key = String(filenameKey || "").trim().toLowerCase();
    if (!key) return;

    const renderedSet = state.renderedFilenameMap.get(key);
    const renderedCards = Array.from(renderedSet || []);
    if (!renderedCards.length) return;

    const allMembers = (Array.isArray(state.assets) ? state.assets : []).filter(
        (asset) => String(asset?.filename || "").trim().toLowerCase() === key,
    );
    const count = Math.max(
        Number(state.filenameCounts?.get?.(key) || 0) || 0,
        allMembers.length,
    );

    // Select the best representative: prefer video_with_audio > video > image.
    const selectedAsset = selectStackRepresentative(allMembers);
    const selectedCard = renderedCards.find((card) => {
        const cardAssetId = String(card._mjrAsset?.id || "");
        const selectedId = String(selectedAsset?.id || "");
        return cardAssetId && selectedId && cardAssetId === selectedId;
    }) || renderedCards[0];
    const primaryCard = selectedCard || renderedCards[0] || null;
    const primaryAsset = primaryCard?._mjrAsset || selectedAsset || allMembers[0] || null;
    preserveRepresentativeGenerationTime(primaryAsset, allMembers);

    for (const card of renderedCards) {
        delete card.dataset.mjrDupHidden;
        const asset = card._mjrAsset;
        if (asset) {
            asset._mjrNameCollision = false;
            delete asset._mjrNameCollisionCount;
            delete asset._mjrNameCollisionPaths;
            asset._mjrDupStack = false;
            asset._mjrDupMembers = null;
            asset._mjrDupCount = 0;
            asset._mjrDupHidden = false;
        }
    }

    if (!primaryCard || !primaryAsset || count < 2) {
        for (const card of renderedCards) {
            try {
                // ...
            } catch (e) {
                console.debug?.(e);
            }
        }
        return;
    }

    primaryAsset._mjrDupStack = true;
    primaryAsset._mjrDupMembers = allMembers.length ? allMembers : [primaryAsset];
    primaryAsset._mjrDupCount = primaryAsset._mjrDupMembers.length;
    primaryAsset._mjrNameCollision = false;

    for (let index = 1; index < renderedCards.length; index += 1) {
        renderedCards[index].dataset.mjrDupHidden = "true";
        if (renderedCards[index]._mjrAsset) {
            renderedCards[index]._mjrAsset._mjrDupHidden = true;
        }
    }
}

function syncAllRenderedDuplicateCards() {
    for (const key of state.renderedFilenameMap.keys()) {
        syncRenderedDuplicateCards(key);
    }
}

function bindCardRef(asset, node) {
    const id = String(asset?.id || "").trim();
    if (!id) return;
    if (!node) {
        const prev = state.cardElements.get(id);
        const prevKey = prev ? cardFilenameKeys.get(prev) : "";
        unregisterFilenameCard(prev);
        state.cardElements.delete(id);
        syncRenderedDuplicateCards(prevKey);
        return;
    }

    const card = node?.$el ?? node;
    if (!(card instanceof HTMLElement)) return;
    state.cardElements.set(id, card);
    card._mjrIsVue = true;
    card._mjrAsset = asset;
    card._mjrReactiveAsset = asset;
    card.dataset.mjrKind = String(asset?.kind || "");
    registerFilenameCard(card, asset);
    syncRenderedDuplicateCards(String(asset?.filename || "").trim().toLowerCase());

    try {
        props.onCardRendered?.(card, asset, gridContainerRef.value);
    } catch (e) {
        console.debug?.(e);
    }
}

function getCardRef(asset) {
    return (node) => bindCardRef(asset, node);
}

function isInteractiveTarget(target, currentTarget) {
    try {
        const interactive = target?.closest?.("a, button, input, textarea, select, label");
        return !!(interactive && currentTarget?.contains?.(interactive));
    } catch {
        return false;
    }
}

const pointerSelectionDedup = {
    assetId: "",
    at: 0,
};

function handleCardClick(event, asset) {
    const id = String(asset?.id || "").trim();
    if (!id) return;
    if (event?.type === "click" && Number(event?.detail || 0) > 0) {
        const elapsed = Date.now() - Number(pointerSelectionDedup.at || 0);
        if (pointerSelectionDedup.assetId === id && elapsed >= 0 && elapsed < 500) {
            pointerSelectionDedup.assetId = "";
            pointerSelectionDedup.at = 0;
            return;
        }
    }
    if (isInteractiveTarget(event?.target, event?.currentTarget)) return;

    const assets = Array.isArray(state.assets) ? state.assets : [];
    const currentIndex = assets.findIndex((entry) => String(entry?.id || "") === id);
    const currentSelection = Array.isArray(state.selectedIds) ? state.selectedIds.slice() : [];

    if (event?.shiftKey && currentIndex >= 0) {
        const anchorId = String(state.selectionAnchorId || state.activeId || id).trim();
        const anchorIndex = assets.findIndex((entry) => String(entry?.id || "") === anchorId);
        const resolvedAnchor = anchorIndex >= 0 ? anchorIndex : currentIndex;
        const from = Math.min(resolvedAnchor, currentIndex);
        const to = Math.max(resolvedAnchor, currentIndex);
        const ids = assets
            .slice(from, to + 1)
            .map((entry) => String(entry?.id || ""))
            .filter(Boolean);
        setSelection(ids, id);
        return;
    }

    if (event?.ctrlKey || event?.metaKey) {
        const nextIds = new Set(currentSelection.map(String));
        if (nextIds.has(id)) nextIds.delete(id);
        else nextIds.add(id);
        const list = Array.from(nextIds);
        setSelection(list, nextIds.has(id) ? id : list[0] || "");
        return;
    }

    setSelection([id], id);
    try {
        state.cardElements.get(id)?.focus?.({ preventScroll: true });
    } catch (e) {
        console.debug?.(e);
    }
}

function handleCardPrimaryMouseDown(event, asset) {
    if (Number(event?.button ?? 0) !== 0) return;
    pointerSelectionDedup.assetId = String(asset?.id || "").trim();
    pointerSelectionDedup.at = Date.now();
    handleCardClick(event, asset);
}

function openAssetViewer(asset) {
    const mediaAssets = (Array.isArray(state.assets) ? state.assets : []).filter(
        (entry) => !isFolderAsset(entry),
    );
    const mediaIndex = mediaAssets.findIndex(
        (entry) => String(entry?.id || "") === String(asset?.id || ""),
    );
    if (!mediaAssets.length || mediaIndex < 0) return;
    requestViewerOpen({ assets: mediaAssets, index: mediaIndex });
}

function handleCardDblclick(asset) {
    try {
        if (typeof props.onCardDblclick === "function") {
            props.onCardDblclick({
                asset,
                assets: Array.isArray(state.assets) ? state.assets : [],
                gridContainer: gridContainerRef.value,
            });
            return;
        }
    } catch (e) {
        console.debug?.(e);
    }

    if (isFolderAsset(asset)) {
        try {
            gridContainerRef.value?.dispatchEvent?.(
                new CustomEvent("mjr:open-folder-asset", {
                    bubbles: true,
                    detail: { asset },
                }),
            );
        } catch (e) {
            console.debug?.(e);
        }
        return;
    }

    openAssetViewer(asset);
}

let scrollCleanup = null;
let fillViewportPromise = null;
let lastFillViewportAt = 0;
let lastFillViewportKey = "";

function _forceVirtualizerMeasure() {
    updateHostWidth();
    try {
        rowVirtualizer.value?.measure?.();
    } catch (e) {
        console.debug?.(e);
    }
}

function scheduleVirtualizerMeasure() {
    if (measureRaf) return;
    try {
        measureRaf = requestAnimationFrame(() => {
            measureRaf = 0;
            try {
                rowVirtualizer.value?.measure?.();
            } catch (e) {
                console.debug?.(e);
            }
        });
    } catch (e) {
        console.debug?.(e);
        measureRaf = 0;
        try {
            rowVirtualizer.value?.measure?.();
        } catch (err) {
            console.debug?.(err);
        }
    }
}

function handleKeepAliveAttached() {
    _forceVirtualizerMeasure();
    // Le layout du nouveau container n'est pas encore calculé au moment
    // où keepalive-attached est dispatché. Double-rAF + setTimeout 150ms
    // couvrent les layouts complexes (animations ComfyUI, heavy CSS recalc).
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            _forceVirtualizerMeasure();
            void maybeFillViewport();
        });
    });
    // Fallback: certains environnements (animations, heavy reflow) ne
    // stabilisent pas les dimensions dans deux frames. Ce setTimeout garantit
    // une mesure finale après que le navigateur ait fini la mise en page.
    setTimeout(() => {
        _forceVirtualizerMeasure();
        void maybeFillViewport();
    }, 150);
}

function bindInfiniteScroll(element) {
    if (!element || !props.virtualize) return () => {};
    const onScroll = () => {
        updateScrollVelocity(element);
    };
    element.addEventListener("scroll", onScroll, { passive: true });
    try {
        requestAnimationFrame(() => {
            onScroll();
            void maybeFillViewport();
        });
    } catch {
        setTimeout(() => {
            onScroll();
            void maybeFillViewport();
        }, 0);
    }
    return () => {
        try {
            element.removeEventListener("scroll", onScroll);
        } catch (e) {
            console.debug?.(e);
        }
    };
}

watch(
    scrollElementRef,
    (element) => {
        try {
            scrollCleanup?.();
        } catch (e) {
            console.debug?.(e);
        }
        scrollCleanup = bindInfiniteScroll(element);
    },
    { immediate: true },
);

function readEffectiveViewportHeight(element) {
    const direct = Number(element?.clientHeight || 0) || 0;
    if (direct > 0) return direct;
    const gridHeight = Number(gridContainerRef.value?.clientHeight || 0) || 0;
    if (gridHeight > 0) return gridHeight;
    try {
        return Math.max(0, Math.floor(Number(window?.innerHeight || 0) * 0.7));
    } catch {
        return 0;
    }
}

async function maybeFillViewport() {
    if (!props.virtualize || !hasMeasuredHostWidth.value || state.loading || state.done) return;
    const element = scrollElementRef.value;
    if (!element) return;
    const assetCount = Array.isArray(state.assets) ? state.assets.length : 0;
    const fillKey = `${assetCount}::${columnCount.value}`;
    const now = Date.now();
    if (fillViewportPromise) return;
    if (fillKey === lastFillViewportKey && now - lastFillViewportAt < 500) return;
    await nextTick();
    const scrollHeight = Number(element.scrollHeight || 0) || 0;
    const clientHeight = readEffectiveViewportHeight(element);
    if (scrollHeight <= clientHeight + 40) {
        const beforeCount = assetCount;
        fillViewportPromise = Promise.resolve(loader.loadNextPage())
            .catch((e) => console.debug?.(e))
            .finally(() => {
                const afterCount = Array.isArray(state.assets) ? state.assets.length : 0;
                lastFillViewportAt = Date.now();
                lastFillViewportKey = afterCount === beforeCount ? fillKey : "";
                fillViewportPromise = null;
                setTimeout(() => {
                    void maybeFillViewport();
                }, 0);
            });
    }
}

watch(
    () => `${Array.isArray(state.assets) ? state.assets.length : 0}::${columnCount.value}::${state.loading}::${state.done}`,
    () => {
        void maybeFillViewport();
    },
    { flush: "post" },
);

function measureRow(node) {
    if (!node || !props.virtualize) return;
    try {
        rowVirtualizer.value.measureElement(node);
    } catch (e) {
        console.debug?.(e);
    }
}

function cardStyle() {
    return {
        width: `${itemWidth.value}px`,
        flex: `0 0 ${itemWidth.value}px`,
        minWidth: `${itemWidth.value}px`,
    };
}

function getVirtualRowByIndex(index) {
    return virtualRowByIndex.value.get(index) || null;
}

function virtualRowStyle(index) {
    const row = getVirtualRowByIndex(index);
    return {
        position: "absolute",
        left: "0",
        top: "0",
        transform: `translateY(${Number(row?.start || 0)}px)`,
        width: "100%",
        display: "flex",
        gap: `${gapPx.value}px`,
        paddingBottom: `${gapPx.value}px`,
        boxSizing: "border-box",
    };
}

function staticRowStyle() {
    return {
        display: "flex",
        gap: `${gapPx.value}px`,
        paddingBottom: `${gapPx.value}px`,
        boxSizing: "border-box",
    };
}

function onSettingsChanged() {
    settingsVersion.value += 1;
    if (props.applyDefaultSettingsClasses && gridContainerRef.value) {
        applyGridSettingsClasses(gridContainerRef.value);
    }
}

watch(
    () => props.applyDefaultSettingsClasses,
    () => {
        if (gridContainerRef.value && props.applyDefaultSettingsClasses) {
            applyGridSettingsClasses(gridContainerRef.value);
        }
    },
    { immediate: true },
);

onBeforeUnmount(() => {
    try {
        gridContainerRef.value?._mjrPrimaryPointerSelectionUnbind?.();
    } catch (e) {
        console.debug?.(e);
    }
    try {
        if (gridContainerRef.value) {
            gridContainerRef.value._mjrPrimaryPointerSelectionUnbind = null;
            gridContainerRef.value._mjrSelectionManagedByVue = false;
        }
    } catch (e) {
        console.debug?.(e);
    }
    try {
        resizeObserver?.disconnect?.();
    } catch (e) {
        console.debug?.(e);
    }
    try {
        scrollCleanup?.();
    } catch (e) {
        console.debug?.(e);
    }
    try {
        if (measureRaf) cancelAnimationFrame(measureRaf);
    } catch (e) {
        console.debug?.(e);
    }
    measureRaf = 0;
    try {
        loader.dispose();
    } catch (e) {
        console.debug?.(e);
    }
    try {
        disposeAssetDragStart?.();
    } catch (e) {
        console.debug?.(e);
    }
    disposeAssetDragStart = null;
    try {
        window.removeEventListener("mjr-settings-changed", onSettingsChanged);
        settingsListenerBound = false;
    } catch (e) {
        console.debug?.(e);
    }
    try {
        window.removeEventListener("mjr:keepalive-attached", handleKeepAliveAttached);
    } catch (e) {
        console.debug?.(e);
    }
});

watch(
    gridContainerRef,
    (container) => {
        if (!container) return;
        if (settingsListenerBound) return;
        window.addEventListener("mjr-settings-changed", onSettingsChanged);
        window.addEventListener("mjr:keepalive-attached", handleKeepAliveAttached);
        settingsListenerBound = true;
    },
    { immediate: true },
);

defineExpose({
    get gridContainer() {
        return gridContainerRef.value;
    },
    get assets() {
        return Array.isArray(state.assets) ? state.assets : [];
    },
    loadAssets(...args) {
        return loader.loadAssets(...args);
    },
    loadAssetsFromList(...args) {
        return loader.loadAssetsFromList(...args);
    },
    loadNextPage(...args) {
        return loader.loadNextPage(...args);
    },
    appendNextPage(...args) {
        return loader.appendNextPage(...args);
    },
    refreshHead(...args) {
        return loader.refreshHead(...args);
    },
    upsertRealtime(...args) {
        return loader.upsertRealtime(...args);
    },
    prepareGridForScopeSwitch(...args) {
        return loader.prepareGridForScopeSwitch(...args);
    },
    refreshGrid(...args) {
        return loader.refreshGrid(...args);
    },
    removeAssets(...args) {
        return loader.removeAssets(...args);
    },
    upsertAsset(...args) {
        return loader.upsertAsset(...args);
    },
    getCanonicalState(...args) {
        return loader.getCanonicalState(...args);
    },
    getDebugSnapshot(...args) {
        return loader.getDebugSnapshot(...args);
    },
    captureAnchor(...args) {
        return loader.captureAnchor(...args);
    },
    restoreAnchor(...args) {
        return loader.restoreAnchor(...args);
    },
    hydrateFromSnapshot(...args) {
        return loader.hydrateFromSnapshot(...args);
    },
    dispose() {
        return loader.dispose();
    },
});
</script>

<template>
    <div
        ref="gridContainerRef"
        class="mjr-grid"
        tabindex="0"
        role="grid"
        style="position: relative; min-height: 100%;"
    >
        <div
            v-if="state.loading && !state.assets.length"
            class="mjr-grid-loading-overlay"
            style="position:absolute; inset:0; z-index:4; display:flex; align-items:flex-start; justify-content:center; padding:14px; pointer-events:none; background:rgba(20,22,28,0.55); backdrop-filter:blur(2px);"
        >
            <div style="width:100%;">
                <div
                    class="mjr-grid-skeleton-layout"
                >
                    <div
                        v-for="(row, rowIndex) in skeletonRows"
                        :key="`skr-${rowIndex}`"
                        :style="skeletonRowStyle"
                    >
                        <div
                            v-for="idx in row"
                            :key="`sk-${idx}`"
                            class="mjr-grid-skeleton-card"
                            :style="skeletonCardStyle"
                        >
                            <div
                                class="mjr-grid-skeleton-thumb mjr-grid-skeleton-shimmer"
                                :style="skeletonThumbStyle"
                            />
                            <div :style="skeletonInfoStyle">
                                <div
                                    class="mjr-grid-skeleton-line mjr-grid-skeleton-line--title mjr-grid-skeleton-shimmer"
                                    :style="skeletonLineTitleStyle"
                                />
                                <div
                                    class="mjr-grid-skeleton-line mjr-grid-skeleton-line--meta mjr-grid-skeleton-shimmer"
                                    :style="skeletonLineMetaStyle"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    style="margin-top:10px; font-size:12px; opacity:0.68; text-align:center;"
                >
                    {{ state.loadingMessage || "Loading assets..." }}
                </div>
            </div>
        </div>

        <div
            v-if="state.statusMessage && !state.assets.length && !state.loading"
            class="mjr-grid-message"
            :style="{
                position: 'absolute',
                inset: '0',
                zIndex: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                textAlign: 'center',
                pointerEvents: 'none',
                fontSize: '14px',
                lineHeight: '1.4',
                color: state.statusError
                    ? 'var(--error-text, #f44336)'
                    : 'var(--muted-text, #bdbdbd)',
                background: 'rgba(0, 0, 0, 0.35)',
            }"
        >
            {{ state.statusMessage }}
        </div>

        <div
            v-if="virtualize"
            :style="{
                height: `${totalSize}px`,
                position: 'relative',
                width: '100%',
                gridColumn: '1 / -1',
            }"
        >
            <div
                v-for="virtualRow in virtualRowsWithItems"
                :key="virtualRow.key"
                :ref="measureRow"
                :data-index="virtualRow.index"
                :style="virtualRowStyle(virtualRow.index)"
            >
                <template v-if="virtualRow.items.length">
                <template
                    v-for="asset in virtualRow.items"
                    :key="String(asset.id)"
                >
                    <FolderCard
                        v-if="isFolderAsset(asset)"
                        :ref="getCardRef(asset)"
                        :asset="asset"
                        :selected="isSelected(asset)"
                        :style="cardStyle()"
                        @mousedown.left="handleCardPrimaryMouseDown($event, asset)"
                        @click="handleCardClick($event, asset)"
                        @dblclick.stop="handleCardDblclick(asset)"
                    />

                    <div
                        v-else
                        :ref="getCardRef(asset)"
                        class="mjr-asset-card mjr-card"
                        role="button"
                        tabindex="0"
                        draggable="true"
                        :style="[cardStyle(), asset._mjrDupHidden ? { display: 'none' } : null]"
                        :class="{
                            'is-selected': isSelected(asset),
                            'mjr-live-placeholder': isLivePlaceholderAsset(asset),
                        }"
                        :data-mjr-asset-id="String(asset.id ?? '')"
                        :data-mjr-filename-key="String(asset.filename || '').toLowerCase()"
                        :data-mjr-ext="getAssetExt(asset)"
                        :data-mjr-stem="getAssetStem(asset)"
                        :data-mjr-kind="String(asset.kind || '')"
                        :data-mjr-live-placeholder="isLivePlaceholderAsset(asset) ? 'true' : undefined"
                        :data-mjr-stacked="isAssetStacked(asset) ? 'true' : undefined"
                        :data-mjr-stack-count="isAssetStacked(asset) ? String(asset.stack_asset_count || 0) : undefined"
                        :data-mjr-dup-stacked="asset._mjrDupStack ? 'true' : undefined"
                        :data-mjr-dup-count="asset._mjrDupStack ? String(asset._mjrDupCount || 0) : undefined"
                        :aria-label="`Asset ${asset.filename || ''}`"
                        :aria-selected="isSelected(asset) ? 'true' : 'false'"
                        @mousedown.left="handleCardPrimaryMouseDown($event, asset)"
                        @click="handleCardClick($event, asset)"
                        @dblclick.stop="handleCardDblclick(asset)"
                    >
                        <AssetCardInner :asset="asset" />
                    </div>
                </template>
                </template>
            </div>
        </div>

        <div v-else style="display:flex; flex-direction:column; width:100%;">
            <div
                v-for="row in rows"
                :key="row.index"
                :style="staticRowStyle()"
            >
                <template
                    v-for="asset in row.items"
                    :key="String(asset.id)"
                >
                    <FolderCard
                        v-if="isFolderAsset(asset)"
                        :ref="getCardRef(asset)"
                        :asset="asset"
                        :selected="isSelected(asset)"
                        :style="cardStyle()"
                        @mousedown.left="handleCardPrimaryMouseDown($event, asset)"
                        @click="handleCardClick($event, asset)"
                        @dblclick.stop="handleCardDblclick(asset)"
                    />

                    <div
                        v-else
                        :ref="getCardRef(asset)"
                        class="mjr-asset-card mjr-card"
                        role="button"
                        tabindex="0"
                        draggable="true"
                        :style="[cardStyle(), asset._mjrDupHidden ? { display: 'none' } : null]"
                        :class="{
                            'is-selected': isSelected(asset),
                            'mjr-live-placeholder': isLivePlaceholderAsset(asset),
                        }"
                        :data-mjr-asset-id="String(asset.id ?? '')"
                        :data-mjr-filename-key="String(asset.filename || '').toLowerCase()"
                        :data-mjr-ext="getAssetExt(asset)"
                        :data-mjr-stem="getAssetStem(asset)"
                        :data-mjr-kind="String(asset.kind || '')"
                        :data-mjr-live-placeholder="isLivePlaceholderAsset(asset) ? 'true' : undefined"
                        :data-mjr-stacked="isAssetStacked(asset) ? 'true' : undefined"
                        :data-mjr-stack-count="isAssetStacked(asset) ? String(asset.stack_asset_count || 0) : undefined"
                        :data-mjr-dup-stacked="asset._mjrDupStack ? 'true' : undefined"
                        :data-mjr-dup-count="asset._mjrDupStack ? String(asset._mjrDupCount || 0) : undefined"
                        :aria-label="`Asset ${asset.filename || ''}`"
                        :aria-selected="isSelected(asset) ? 'true' : 'false'"
                        @mousedown.left="handleCardPrimaryMouseDown($event, asset)"
                        @click="handleCardClick($event, asset)"
                        @dblclick.stop="handleCardDblclick(asset)"
                    >
                        <AssetCardInner :asset="asset" />
                    </div>
                </template>
            </div>
        </div>

        <div
            ref="infiniteSentinelRef"
            aria-hidden="true"
            style="height:1px; width:100%; pointer-events:none; grid-column:1 / -1;"
        />
    </div>
</template>

<style scoped>
.mjr-grid-skeleton-layout {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
    gap: 12px;
}

.mjr-grid-skeleton-card {
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.22);
    background: rgba(192, 198, 206, 0.2);
    overflow: hidden;
    min-height: 146px;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.24);
}

.mjr-grid-skeleton-thumb {
    aspect-ratio: 1 / 1;
    width: 100%;
    background: linear-gradient(
        90deg,
        rgba(156, 162, 171, 0.52) 0%,
        rgba(220, 225, 232, 0.72) 45%,
        rgba(156, 162, 171, 0.52) 100%
    );
    background-size: 240% 100%;
    animation: mjr-grid-skeleton-shimmer 1.2s linear infinite;
}

.mjr-grid-skeleton-line {
    height: 10px;
    margin: 8px 10px;
    border-radius: 8px;
    background: linear-gradient(
        90deg,
        rgba(164, 170, 179, 0.48) 0%,
        rgba(214, 219, 226, 0.7) 45%,
        rgba(164, 170, 179, 0.48) 100%
    );
    background-size: 240% 100%;
    animation: mjr-grid-skeleton-shimmer 1.2s linear infinite;
}

.mjr-grid-skeleton-line--title {
    width: 72%;
}

.mjr-grid-skeleton-line--meta {
    width: 48%;
    margin-top: 2px;
    margin-bottom: 10px;
}

@keyframes mjr-grid-skeleton-shimmer {
    0% {
        background-position: 100% 0;
    }
    100% {
        background-position: -100% 0;
    }
}
</style>
