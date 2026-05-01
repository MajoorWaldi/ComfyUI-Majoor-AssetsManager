import { nextTick } from "vue";
import { get } from "../../api/client.js";
import { EVENTS } from "../../app/events.js";
import { buildListURL } from "../../api/endpoints.js";
import { APP_CONFIG } from "../../app/config.js";
import { loadMajoorSettings } from "../../app/settings.js";
import { setFileBadgeCollision } from "../../components/Badges.js";
import { pickRootId } from "../../utils/ids.js";
import { isGridHostVisible } from "./gridVisibility.js";
import { consumeEarlyFetch, peekEarlyFetchKey } from "../../features/runtime/earlyFetch.js";
import { mjrDbg } from "../../utils/logging.js";
import {
    appendAssets as cardAppendAssets,
} from "../../features/grid/AssetCardRenderer.js";
import { getStackAwareAssetKey, ensureDupStackCard, disposeStackGroupCards } from "../../features/grid/StackGroupCards.js";
import {
    gridListQueryKey,
    isDefaultOutputBrowseQuery,
    readGridQueryFromDataset,
    readGridQueryText,
    readGridSortKey,
} from "../grid/useGridQuery.js";
import {
    buildGridSnapshotKey,
    compactSnapshotAsset,
    flushGridSnapshotsPersist,
    getGridSnapshot,
    hasGridSnapshot,
    rememberGridSnapshot,
} from "../grid/useGridSnapshotCache.js";
import { removeAssetsFromState, syncAssetCollectionState } from "../grid/useAssetCollection.js";
import { usePagedAssets } from "../grid/usePagedAssets.js";
import {
    compareAssets,
    fetchPage as fetchGridPage,
    flushUpsertBatch,
    getUpsertBatchState,
    upsertAsset as queueUpsertAsset,
} from "./useVirtualGrid.js";
import {
    findAssetCardById,
    findSelectedAssetCard,
    readGridShownCount,
} from "../components/grid/gridDomBridge.js";

const UPSERT_BATCH_DEBOUNCE_MS = 200;
const UPSERT_BATCH_MAX_SIZE = 50;
const UPSERT_BATCH_STATE = new WeakMap();
const IMMEDIATE_RESET_REASONS = new Set([
    "collection",
    "filter",
    "initial",
    "scope",
    "search",
    "sort",
]);
// 0 = no artificial skeleton hold. The skeleton naturally lasts the duration
// of the network/render work; an additional minimum delay only made the first
// paint feel sluggish on cold opens. Keep at 0 unless flicker is reintroduced.
const MIN_LOADING_SKELETON_MS = 0;
function waitMs(ms) {
    return new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
}

function getStableRealtimeAssetKey(asset) {
    if (!asset || typeof asset !== "object") return "";
    if (asset.id != null && String(asset.id).trim()) {
        return `id:${String(asset.id).trim()}`;
    }
    const type = String(asset?.type || asset?.source || "output")
        .trim()
        .toLowerCase();
    const rootId = String(pickRootId(asset) || "")
        .trim()
        .toLowerCase();
    const subfolder = String(asset?.subfolder || "")
        .trim()
        .toLowerCase();
    const filename = String(asset?.filename || "")
        .trim()
        .toLowerCase();
    if (filename) return `${type}|${rootId}|${subfolder}|${filename}`;
    const filepath = String(
        asset?.filepath || asset?.path || asset?.fullpath || asset?.full_path || "",
    )
        .trim()
        .toLowerCase();
    return filepath ? `${type}|${rootId}|path|${filepath}` : "";
}

function sanitizeQuery(query) {
    if (query == null) return query;

    const raw = String(query);
    if (raw.trim() === "") return raw;
    if (raw.trim() === "*") return "*";

    const cleaned = raw
        .replace(/[\u0000-\u001f\u007f]+/g, " ")
        .replace(/[<>]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    return cleaned || raw;
}

function coerceQueryText(query) {
    if (typeof query === "string") return query;
    if (query && typeof query === "object") {
        if (typeof query.value === "string") return query.value;
        if (typeof query.target?.value === "string") return query.target.value;
        try {
            if (typeof query.querySelector === "function") {
                const nested =
                    query.querySelector("#mjr-search-input") ||
                    query.querySelector("input.mjr-input") ||
                    query.querySelector("input[type='text']") ||
                    query.querySelector("textarea");
                if (nested && typeof nested.value === "string") return nested.value;
            }
        } catch (e) {
            console.debug?.(e);
        }
    }
    return String(query || "");
}

function resolveElement(maybeRef) {
    if (!maybeRef) return null;
    if (typeof maybeRef === "object" && "value" in maybeRef) {
        return maybeRef.value || null;
    }
    return maybeRef;
}

async function waitForLayout() {
    // PERF FIX #3: single nextTick instead of nextTick + double rAF.
    // The double rAF was costing ~33ms per call for negligible benefit;
    // the virtualizer + ResizeObserver settle on their own without it.
    await nextTick();
}

function formatLoadErrorMessage(prefix, err) {
    const message = String(prefix || "Failed to load");
    try {
        const raw = String(err?.message || err || "").trim();
        const low = raw.toLowerCase();
        if (!raw) return message;
        if (
            low.includes("database is locked") ||
            low.includes("database table is locked") ||
            low.includes("database schema is locked")
        ) {
            return `${message}: the database is temporarily locked. Please retry in a few seconds.`;
        }
        return `${message}: ${raw}`;
    } catch {
        return message;
    }
}

function getAdaptivePageLimit(baseLimit, emptyAppendBatches) {
    const safeBaseLimit = Math.max(1, Math.min(APP_CONFIG.MAX_PAGE_SIZE, Number(baseLimit) || 1));
    const growthStep = Math.max(0, Number(emptyAppendBatches) || 0);
    if (growthStep <= 0) return safeBaseLimit;
    const multiplier = 2 ** Math.min(growthStep, 5);
    return Math.max(1, Math.min(APP_CONFIG.MAX_PAGE_SIZE, safeBaseLimit * multiplier));
}

function resetAssetCollectionsState(state) {
    state.seenKeys = new Set();
    state.assetIdSet = new Set();
    state.filenameCounts = new Map();
    state.nonImageSiblingKeys = new Set();
    state.stemMap = new Map();
    state.renderedFilenameMap = new Map();
    state.hiddenPngSiblings = 0;
}

export function useGridLoader({
    gridContainerRef,
    state,
    setLoadingMessage,
    clearLoadingMessage,
    setStatusMessage,
    clearStatusMessage,
    resetAssets,
    setSelection,
    reconcileSelection,
    readScrollElement = () => null,
    readRenderedCards = () => [],
    scrollToAssetId = () => {},
    canLoadMore = null,
} = {}) {
    let deferVisualResetUntilNextPage = false;
    let deferredExecutionReload = null;
    let prefetchTimer = null;
    const metrics = {
        pagesRequested: 0,
        assetsReceived: 0,
        visibleAssetsAdded: 0,
        hiddenOrDedupedAssets: 0,
        apiTimeMs: 0,
        renderTimeMs: 0,
        resetCount: 0,
        blockedImmediateResetCount: 0,
        scrollRestoreCount: 0,
        lastReloadReason: "",
        lastResetReason: "",
        lastAppendReason: "",
        lastOperation: "",
    };

    function nowMs() {
        try {
            return typeof performance !== "undefined" && typeof performance.now === "function"
                ? performance.now()
                : Date.now();
        } catch {
            return Date.now();
        }
    }

    function recordOperation(name, detail = {}) {
        metrics.lastOperation = String(name || "");
        if (detail.reloadReason) metrics.lastReloadReason = String(detail.reloadReason || "");
        if (detail.appendReason) metrics.lastAppendReason = String(detail.appendReason || "");
    }

    function getGridContainer() {
        return resolveElement(gridContainerRef);
    }

    function getContextState() {
        return buildCurrentSnapshotParts();
    }

    function getCanonicalState() {
        const scrollElement = readScrollElement();
        return {
            assets: Array.isArray(state.assets) ? state.assets : [],
            pagination: {
                query: String(state.query || "*"),
                offset: Number(state.offset || 0) || 0,
                total: state.total == null ? null : Number(state.total) || 0,
                loading: !!state.loading,
                done: !!state.done,
                requestId: Number(state.requestId || 0) || 0,
            },
            selection: {
                selectedIds: Array.isArray(state.selectedIds)
                    ? state.selectedIds.map(String).filter(Boolean)
                    : [],
                activeId: String(state.activeId || ""),
                anchorId: String(state.selectionAnchorId || ""),
            },
            viewport: {
                scrollTop: Number(scrollElement?.scrollTop || 0) || 0,
                clientHeight: Number(scrollElement?.clientHeight || 0) || 0,
                scrollHeight: Number(scrollElement?.scrollHeight || 0) || 0,
            },
            context: getContextState(),
        };
    }

    function getDebugSnapshot() {
        const canonical = getCanonicalState();
        return {
            ...canonical,
            counts: {
                loaded: canonical.assets.length,
                visible: readGridShownCount(getGridContainer(), canonical.assets.length),
                total: canonical.pagination.total,
            },
            metrics: { ...metrics },
        };
    }

    function buildCurrentSnapshotParts() {
        const gridContainer = getGridContainer();
        return readGridQueryFromDataset(gridContainer?.dataset || {}, {
            q: readGridQueryText(gridContainer, state.query || "*"),
            resolutionCompare: gridContainer?.dataset?.mjrFilterResolutionCompare || "",
        });
    }

    function getCurrentResetContext(query = state.query || "*") {
        return {
            ...buildCurrentSnapshotParts(),
            query: String(query || "*"),
        };
    }

    function classifyContextResetReason(nextContext) {
        const previous = state._mjrLastGridContext || null;
        if (!previous) {
            return Array.isArray(state.assets) && state.assets.length ? "unknown" : "initial";
        }
        if (String(previous.collectionId || "") !== String(nextContext.collectionId || "")) {
            return "collection";
        }
        if (
            String(previous.scope || "") !== String(nextContext.scope || "") ||
            String(previous.customRootId || "") !== String(nextContext.customRootId || "") ||
            String(previous.subfolder || "") !== String(nextContext.subfolder || "") ||
            String(previous.viewScope || "") !== String(nextContext.viewScope || "")
        ) {
            return "scope";
        }
        if (String(previous.sort || "") !== String(nextContext.sort || "")) {
            return "sort";
        }
        const filterKeys = [
            "kind",
            "workflowOnly",
            "minRating",
            "minSizeMB",
            "maxSizeMB",
            "resolutionCompare",
            "minWidth",
            "minHeight",
            "maxWidth",
            "maxHeight",
            "workflowType",
            "dateRange",
            "dateExact",
            "semanticMode",
        ];
        if (filterKeys.some((key) => String(previous[key] || "") !== String(nextContext[key] || ""))) {
            return "filter";
        }
        if (String(previous.query || "*") !== String(nextContext.query || "*")) {
            return "search";
        }
        return "refresh";
    }

    function resolveResetReason(query, options = {}) {
        const explicit = String(options?.resetReason || options?.reason || "").trim().toLowerCase();
        const nextContext = getCurrentResetContext(query);
        const reason = explicit || classifyContextResetReason(nextContext);
        return { reason, nextContext };
    }

    function canResetImmediately(reason) {
        return IMMEDIATE_RESET_REASONS.has(String(reason || "").toLowerCase());
    }

    function rememberCurrentGridContext(context = null) {
        try {
            state._mjrLastGridContext = context || getCurrentResetContext(state.query || "*");
        } catch (e) {
            console.debug?.(e);
        }
    }

    function shouldPreserveVisibleOnReset({ reset = true, preserveVisibleUntilReady = true } = {}) {
        if (!reset || preserveVisibleUntilReady === false) return false;
        return Array.isArray(state.assets) && state.assets.length > 0;
    }

    function canLoadFromHost() {
        try {
            if (typeof canLoadMore === "function") {
                return !!canLoadMore();
            }
        } catch (e) {
            console.debug?.(e);
        }
        return isGridHostVisible(getGridContainer(), readScrollElement());
    }

    function isExecutionBusy() {
        if (!APP_CONFIG.DEFER_GRID_FETCH_DURING_EXECUTION) {
            return false;
        }
        // PERF FIX #2: never defer the very first load (empty grid).
        // The user expects assets to appear immediately when the panel opens,
        // even if a generation is already in progress.
        try {
            if (!Array.isArray(state.assets) || state.assets.length === 0) {
                return false;
            }
        } catch (e) {
            console.debug?.(e);
        }
        try {
            return !!String(window?.__MJR_EXECUTION_RUNTIME__?.active_prompt_id || "").trim();
        } catch (e) {
            console.debug?.(e);
            return false;
        }
    }

    function clearDeferredExecutionReload() {
        try {
            if (deferredExecutionReload?.timer) {
                clearTimeout(deferredExecutionReload.timer);
            }
        } catch (e) {
            console.debug?.(e);
        }
        try {
            if (deferredExecutionReload?.listener) {
                window.removeEventListener(EVENTS.RUNTIME_STATUS, deferredExecutionReload.listener);
            }
        } catch (e) {
            console.debug?.(e);
        }
        deferredExecutionReload = null;
    }

    function clearPrefetchTimer() {
        try {
            if (prefetchTimer) {
                clearTimeout(prefetchTimer);
            }
        } catch (e) {
            console.debug?.(e);
        }
        prefetchTimer = null;
    }

    function scheduleNextPagePrefetch(requestId, delayMs = APP_CONFIG.PREFETCH_NEXT_PAGE_DELAY_MS) {
        if (!APP_CONFIG.PREFETCH_NEXT_PAGE) {
            return;
        }
        clearPrefetchTimer();
        const resolvedDelayMs = Math.max(0, Number(delayMs) || 0);
        prefetchTimer = setTimeout(() => {
            prefetchTimer = null;
            if (state.requestId !== requestId || state.done || state.loading) {
                return;
            }
            loadNextPage().catch((error) => {
                console.debug?.("[AssetsManager][GridLoader] Delayed prefetch failed", error);
            });
        }, resolvedDelayMs);
    }

    function scheduleDeferredExecutionReload(query, options = {}) {
        clearDeferredExecutionReload();
        // Capture the snapshot context at schedule time so we can detect a
        // user-initiated scope/sort/filter switch during execution. If the
        // user navigates away (e.g. starts a generation on Output, switches
        // to Custom, generation finishes) the deferred reload must NOT fire
        // — otherwise it would clobber the new context's grid state.
        const scheduledScopeKey = (() => {
            try {
                // Ensure we capture to correct snapshot parts even during rapid clicks.
                return buildGridSnapshotKey(buildCurrentSnapshotParts());
            } catch (e) {
                console.debug?.(e);
                return null;
            }
        })();
        const retry = () => {
            if (isExecutionBusy()) {
                try {
                    deferredExecutionReload = {
                        ...deferredExecutionReload,
                        timer: setTimeout(retry, 1250),
                    };
                } catch (e) {
                    console.debug?.(e);
                }
                return;
            }
            clearDeferredExecutionReload();
            // Re-read the current query from the grid container at retry time
            // instead of using the stale captured value. The user may have
            // changed the search query while execution was in progress.
            const gridContainer = getGridContainer();
            // Bail if the grid context (scope/sort/filters) changed during
            // execution — the user is now looking at a different view and a
            // reload would corrupt it.
            if (scheduledScopeKey) {
                let currentKey = null;
                try {
                    currentKey = buildGridSnapshotKey(buildCurrentSnapshotParts());
                } catch (e) {
                    console.debug?.(e);
                }
                if (currentKey && currentKey !== scheduledScopeKey) {
                    mjrDbg(
                        "[Grid] Deferred execution reload skipped — scope/filter changed during execution",
                    );
                    return;
                }
            }
            const freshQuery = readGridQueryText(gridContainer, query);
            Promise.resolve()
                .then(() =>
                    loadAssets(freshQuery, {
                        ...(options || {}),
                        reset: true,
                        preserveVisibleUntilReady: true,
                    }),
                )
                .catch((e) => console.debug?.(e));
        };
        const listener = (event) => {
            const activePromptId = String(event?.detail?.active_prompt_id || "").trim();
            if (!activePromptId) {
                retry();
            }
        };
        deferredExecutionReload = {
            listener,
            timer: setTimeout(retry, 1250),
        };
        try {
            window.addEventListener(EVENTS.RUNTIME_STATUS, listener);
        } catch (e) {
            console.debug?.(e);
        }
    }

    function assetKey(asset, gridContainer = null) {
        if (!asset || typeof asset !== "object") return "";
        const fallback =
            asset.id != null
                ? `id:${asset.id}`
                : `${asset.type || ""}|${pickRootId(asset)}|${asset.filepath || ""}|${asset.subfolder || ""}|${asset.filename || ""}`;
        try {
            const grid = gridContainer || getGridContainer() || globalThis?.__MJR_LAST_ASSETKEY_GRID__;
            return getStackAwareAssetKey(grid, asset, fallback);
        } catch (e) {
            console.debug?.(e);
            return fallback;
        }
    }

    function rememberSnapshot(title = "") {
        try {
            const gridContainer = getGridContainer();
            const assets = Array.isArray(state.assets) ? state.assets : [];
            if (!gridContainer || !assets.length) return;
            const snapshotAssets = assets
                .map(compactSnapshotAsset)
                .filter(Boolean);
            if (!snapshotAssets.length) return;
            const wasTruncated = snapshotAssets.length < assets.length;
            const rawOffset = Number(state.offset || snapshotAssets.length) || snapshotAssets.length;
            const rawTotal = Number(state.total ?? snapshotAssets.length);
            const snapshotParts = readGridQueryFromDataset(gridContainer.dataset || {}, {
                q: readGridQueryText(gridContainer, state.query || "*"),
                resolutionCompare: gridContainer.dataset?.mjrFilterResolutionCompare || "",
            });
            const key = buildGridSnapshotKey(snapshotParts);
            if (!key) return;
            rememberGridSnapshot(key, {
                assets: snapshotAssets,
                title: String(title || "").trim(),
                query: String(state.query || snapshotParts.query || "*").trim() || "*",
                total: Number.isFinite(rawTotal) ? rawTotal : snapshotAssets.length,
                offset: wasTruncated
                    ? snapshotAssets.length
                    : Math.max(snapshotAssets.length, rawOffset),
                done: wasTruncated ? false : !!state.done,
            });
        } catch (e) {
            console.debug?.(e);
        }
    }

    function clearPendingUpserts() {
        const gridContainer = getGridContainer();
        if (!gridContainer) return;
        try {
            const batchState = UPSERT_BATCH_STATE.get(gridContainer);
            if (!batchState) return;
            if (batchState.timer) {
                clearTimeout(batchState.timer);
                batchState.timer = null;
            }
            batchState.pending.clear();
            batchState.flushing = false;
        } catch (e) {
            console.debug?.(e);
        }
    }

    function appendAssets(gridContainer, assets) {
        const startedAt = nowMs();
        const receivedCount = Array.isArray(assets) ? assets.length : 0;
        const addedCount = cardAppendAssets(gridContainer, assets, state, {
            loadMajoorSettings,
            clearGridMessage: () => {
                clearStatusMessage();
            },
            ensureVirtualGrid: () => state.virtualGrid,
            setFileBadgeCollision,
            assetKey: (asset) => assetKey(asset, gridContainer),
            ensureDupStackCard: (gc, card, asset) => ensureDupStackCard(gc, card, asset),
        });
        metrics.renderTimeMs += Math.max(0, nowMs() - startedAt);
        metrics.assetsReceived += receivedCount;
        metrics.visibleAssetsAdded += Number(addedCount || 0) || 0;
        metrics.hiddenOrDedupedAssets += Math.max(0, receivedCount - (Number(addedCount || 0) || 0));
        return addedCount;
    }

    /**
     * Build a key fingerprint that matches `_buildEarlyFetchKey` in
     * features/runtime/earlyFetch.js. The two MUST stay in sync — when they
     * diverge the grid silently falls back to a second /list round-trip,
     * which is precisely what the early fetch was meant to avoid.
     */
    function buildEarlyFetchMatchKey(gridContainer, query) {
        const normalizedQuery = String(query || "*").trim() || "*";
        return gridListQueryKey(readGridQueryFromDataset(gridContainer?.dataset || {}, {
            q: normalizedQuery,
        }));
    }

    function isDefaultOutputBrowseContext(query) {
        const context = buildCurrentSnapshotParts();
        const safeQuery = sanitizeQuery(coerceQueryText(query).trim() || "*") || "*";
        return isDefaultOutputBrowseQuery({ ...context, q: safeQuery });
    }

    function normalizePageForPagination(page, { query = "*", limit = 0, offset = 0 } = {}) {
        if (!page?.ok || page.total == null || !isDefaultOutputBrowseContext(query)) {
            return page;
        }
        const total = Number(page.total);
        const count = Number(page.count ?? page.assets?.length ?? 0) || 0;
        const requestedLimit = Math.max(1, Number(limit) || 1);
        const currentOffset = Math.max(0, Number(offset) || 0);
        const pageEnd = currentOffset + count;
        const totalLooksLikeReturnedWindow =
            Number.isFinite(total) &&
            total > 0 &&
            total <= pageEnd &&
            count > 0 &&
            count < requestedLimit;
        if (!totalLooksLikeReturnedWindow) return page;
        return { ...page, total: null };
    }

    async function fetchPage(query, limit, offset, { requestId = 0, signal = null } = {}) {
        const gridContainer = getGridContainer();
        if (!gridContainer) {
            return { ok: false, error: "Grid unavailable" };
        }

        // Try to use early-fetched data for the first page of default browse context.
        // This significantly reduces perceived load time when opening the panel.
        if (offset === 0) {
            // Match against the FULL filter fingerprint, not just scope+sort.
            // The early-fetch URL is built with the persisted filters too, so
            // a workflowOnly/minRating/etc match here means the prefetched
            // payload is the right one and we skip a redundant /list call.
            const matchKey = buildEarlyFetchMatchKey(gridContainer, query);
            const earlyKey = peekEarlyFetchKey();
            if (earlyKey && earlyKey === matchKey) {
                const earlyFetchPromise = consumeEarlyFetch(matchKey);
                if (earlyFetchPromise) {
                    try {
                        const earlyResult = await earlyFetchPromise;
                        // Discard early fetch if the request has been superseded
                        // (e.g. scope switch while the promise was pending).
                        if (Number(state.requestId) !== Number(requestId)) {
                            return { ok: false, stale: true, error: "Stale early fetch" };
                        }
                        if (signal?.aborted) {
                            return { ok: false, aborted: true, error: "Aborted" };
                        }
                        // API returns { ok, data: { assets: [...], total, ... } }
                        const earlyAssets = earlyResult?.data?.assets;
                        if (earlyResult?.ok && Array.isArray(earlyAssets)) {
                            mjrDbg("[Grid] Using early-fetched data:", earlyAssets.length, "assets");
                            // Use null when the backend did not return a total (includeTotal=false).
                            // Falling back to earlyAssets.length would incorrectly set state.total
                            // to the page size (e.g. 80), causing state.done=true after the first
                            // page and blocking all subsequent pagination / infinite scroll.
                            const rawTotal = earlyResult.data?.total ?? earlyResult.meta?.total ?? null;
                            return normalizePageForPagination({
                                ok: true,
                                assets: earlyAssets,
                                total: rawTotal != null ? Number(rawTotal) || 0 : null,
                                count: earlyAssets.length,
                                limit: limit,
                                offset: 0,
                                nextCursor: earlyResult.data?.next_cursor || earlyResult.data?.nextCursor || null,
                            }, { query, limit, offset });
                        }
                    } catch (e) {
                        mjrDbg("[Grid] Early fetch failed, falling back to normal fetch", e);
                    }
                }
            }
        }

        const page = await fetchGridPage(
            gridContainer,
            query,
            limit,
            offset,
            {
                sanitizeQuery,
                buildListURL,
                get,
                getGridState: () => state,
            },
            { requestId, signal, cursor: state.cursor || null },
        );
        return normalizePageForPagination(page, { query, limit, offset });
    }

    const pagedAssets = usePagedAssets({
        query: {
            get value() {
                return state.query || "*";
            },
            set value(value) {
                state.query = String(value || "*") || "*";
            },
        },
        collection: {
            append(assets = []) {
                const gridContainer = getGridContainer();
                return gridContainer && assets.length
                    ? Number(appendAssets(gridContainer, assets) || 0) || 0
                    : 0;
            },
            reset() {},
        },
        fetchPage: async ({ query, limit, offset, requestId }) => {
            const pageStartedAt = nowMs();
            metrics.pagesRequested += 1;
            const page = await fetchPage(query, limit, offset, {
                requestId,
                signal: state.abortController?.signal || null,
            });
            metrics.apiTimeMs += Math.max(0, nowMs() - pageStartedAt);
            return page;
        },
        pageSize: APP_CONFIG.DEFAULT_PAGE_SIZE,
    });

    function syncPagedStateFromLegacy() {
        pagedAssets.setPageState({
            offset: state.offset,
            cursor: state.cursor,
            total: state.total,
            done: state.done,
            requestId: state.requestId,
            loading: false,
            error: null,
        });
    }

    function setLegacyPageState(nextState = {}, { syncPaged = true } = {}) {
        if (!nextState || typeof nextState !== "object") return;
        if (Object.prototype.hasOwnProperty.call(nextState, "offset")) {
            state.offset = Math.max(0, Number(nextState.offset || 0) || 0);
        }
        if (Object.prototype.hasOwnProperty.call(nextState, "cursor")) {
            state.cursor = nextState.cursor || null;
        }
        if (Object.prototype.hasOwnProperty.call(nextState, "total")) {
            state.total = nextState.total == null ? null : Math.max(0, Number(nextState.total) || 0);
        }
        if (Object.prototype.hasOwnProperty.call(nextState, "done")) {
            state.done = !!nextState.done;
        }
        if (syncPaged) syncPagedStateFromLegacy();
    }

    function syncLegacyStateFromPaged() {
        const pageState = pagedAssets.getPageState();
        setLegacyPageState(pageState, { syncPaged: false });
    }

    function repairOffsetFromLoadedAssets() {
        const loadedCount = Array.isArray(state.assets) ? state.assets.length : 0;
        if (loadedCount <= 0 || state.done) return;
        if (Number(state.offset || 0) >= loadedCount) return;
        setLegacyPageState({ offset: loadedCount }, { syncPaged: true });
    }

    function finalizeLoad({ title = "", showEmptyMessage = true } = {}) {
        clearLoadingMessage();
        if (!(Array.isArray(state.assets) && state.assets.length)) {
            if (showEmptyMessage && (!state.statusMessage || !state.statusError)) {
                setStatusMessage("No assets found");
            }
        } else {
            clearStatusMessage();
            rememberSnapshot(title || state.query);
        }
        const visibleIds = (Array.isArray(state.assets) ? state.assets : [])
            .map((asset) => String(asset?.id || ""))
            .filter(Boolean);
        const resultIsComplete =
            !!state.done ||
            (Number.isFinite(Number(state.total)) &&
                Number(state.total || 0) <= visibleIds.length);
        if (resultIsComplete) {
            reconcileSelection(visibleIds, { activeId: state.activeId });
        }
    }

    // Append invariant: pagination may advance offset and append/patch assets,
    // but it must not visually reset the grid, move scroll, or prune selection.
    async function loadNextPage() {
        const gridContainer = getGridContainer();
        if (!gridContainer || state.loading || state.done) return { ok: true, skipped: true };
        const scrollElement = readScrollElement();
        const scrollTopBefore = Number(scrollElement?.scrollTop || 0) || 0;
        let userScrolledDuringLoad = false;
        const markUserScrollDuringLoad = () => {
            userScrolledDuringLoad = true;
        };
        try {
            scrollElement?.addEventListener?.("scroll", markUserScrollDuringLoad, {
                passive: true,
                once: true,
            });
        } catch (e) {
            console.debug?.(e);
        }
        const selectionBefore = Array.isArray(state.selectedIds) ? state.selectedIds.join("|") : "";
        const activeBefore = String(state.activeId || "");
        recordOperation("appendNextPage", { appendReason: "pagination" });
        if (!canLoadFromHost()) {
            // When the grid is empty (initial load or post-reattach) and the host
            // isn't measured yet, schedule a single retry so the first page loads
            // once the layout settles — prevents a permanent blank grid.
            if (!state.assets.length && !state.loading && APP_CONFIG.PREFETCH_NEXT_PAGE) {
                scheduleNextPagePrefetch(state.requestId, 400);
            }
            return { ok: true, skipped: true, hidden: true };
        }
        if (isExecutionBusy()) {
            return { ok: true, skipped: true, busy: true };
        }

        const baseLimit = Math.max(
            1,
            Math.min(APP_CONFIG.MAX_PAGE_SIZE, APP_CONFIG.DEFAULT_PAGE_SIZE),
        );
        const loadingStartedAt = Date.now();
        state.loading = true;
        clearStatusMessage();
        try {
            if (!state.done) {
                if (!canLoadFromHost()) {
                    return { ok: true, skipped: true, hidden: true };
                }
                repairOffsetFromLoadedAssets();
                syncPagedStateFromLegacy();
                // Capture requestId at load start so beforeApplyPage can abort
                // if a scope switch incremented it while the fetch was in flight.
                const _loadReqId = state.requestId;
                const pageResult = await pagedAssets.loadUntilVisible({
                    maxEmptyPages: 6,
                    canContinue: () => canLoadFromHost(),
                    getLimit: (emptyPageIndex) => getAdaptivePageLimit(baseLimit, emptyPageIndex),
                    beforeApplyPage: (page) => {
                        // Scope switch (or any requestId bump) happened while the
                        // fetch was in flight — discard the page to avoid applying
                        // stale data from the wrong offset / scope.
                        if (state.requestId !== _loadReqId) {
                            return { ok: false, stale: true };
                        }
                        const pageAssets = Array.isArray(page.assets) ? page.assets : [];
                        const responseHasItems = pageAssets.length > 0;
                        // Only commit a visual reset when the new page has
                        // something to render OR when the backend reports
                        // total=0. Transient empty pages must keep cached
                        // cards visible during scope switches.
                        if (!deferVisualResetUntilNextPage) return null;
                        const responseAssertsEmpty = page.total != null && Number(page.total) === 0;
                        if (responseHasItems || responseAssertsEmpty) {
                            resetAssets({ query: state.query || "*", total: null, done: false });
                            setLegacyPageState({ offset: 0, cursor: null, total: null, done: false });
                            resetAssetCollectionsState(state);
                            metrics.resetCount += 1;
                            deferVisualResetUntilNextPage = false;
                            return null;
                        }
                        if (Array.isArray(state.assets) && state.assets.length) {
                            mjrDbg(
                                "[Grid LoadPage] empty response with cached visible assets — preserving cached view",
                                { offset: state.offset, query: state.query },
                            );
                            return {
                                ok: true,
                                count: 0,
                                total: state.total,
                                preservedCached: true,
                            };
                        }
                        return null;
                    },
                    onEmptyPage: (result) => {
                        if (result.emptyPageIndex <= 0) return;
                        mjrDbg(`[Grid LoadPage] fetched adaptive page with no visible additions: offset=${state.offset}, fetched=${result.count}, consumed=${result.advanced}, added=${result.added}, limit=${result.limit}, done=${state.done}, visibleCount=${state.assets.length}, total=${state.total}`);
                    },
                });
                syncLegacyStateFromPaged();
                repairOffsetFromLoadedAssets();

                if (!pageResult.ok) {
                    if (pageResult.aborted || pageResult.stale) {
                        return pageResult;
                    }
                    setLegacyPageState({ done: true });
                    setStatusMessage(
                        formatLoadErrorMessage("Failed to load assets", pageResult?.error || "Unknown error"),
                        { error: true },
                    );
                    return pageResult;
                }

                if (pageResult.preservedCached) return pageResult;

                if (state.done || pageResult.added > 0) {
                    rememberSnapshot(state.query || readGridQueryText(gridContainer, "*"));
                    return {
                        ok: true,
                        count: pageResult.count,
                        total: state.total,
                    };
                }

                const emptyResult = pageResult.lastResult || pageResult.firstResult || pageResult;
                mjrDbg(`[Grid LoadPage] fetched one page with no visible additions: offset=${state.offset}, fetched=${pageResult.count}, consumed=${emptyResult.advanced}, added=${emptyResult.added}, limit=${emptyResult.limit || baseLimit}, done=${state.done}, visibleCount=${state.assets.length}, total=${state.total}`);
                if (!state.done && APP_CONFIG.PREFETCH_NEXT_PAGE) {
                    scheduleNextPagePrefetch(
                        Number(state.requestId ?? 0) || 0,
                        Math.min(APP_CONFIG.PREFETCH_NEXT_PAGE_DELAY_MS ?? 700, 250),
                    );
                }
                return {
                    ok: true,
                    count: pageResult.count,
                    total: state.total,
                    skippedEmpty: true,
                };
            }

            return {
                ok: true,
                count: 0,
                total: state.total,
            };
        } catch (err) {
            try {
                if (String(err?.name || "") === "AbortError") {
                    return { ok: false, aborted: true, error: "Aborted" };
                }
            } catch (e) {
                console.debug?.(e);
            }
            setStatusMessage(formatLoadErrorMessage("Failed to load assets", err), {
                error: true,
            });
            return { ok: false, error: err?.message || String(err) };
        } finally {
            try {
                scrollElement?.removeEventListener?.("scroll", markUserScrollDuringLoad);
            } catch (e) {
                console.debug?.(e);
            }
            try {
                if (
                    scrollElement &&
                    !userScrolledDuringLoad &&
                    Number(scrollElement.scrollTop || 0) !== scrollTopBefore
                ) {
                    scrollElement.scrollTop = scrollTopBefore;
                    metrics.scrollRestoreCount += 1;
                }
            } catch (e) {
                console.debug?.(e);
            }
            try {
                const selectionAfter = Array.isArray(state.selectedIds)
                    ? state.selectedIds.join("|")
                    : "";
                if (
                    (selectionAfter !== selectionBefore || String(state.activeId || "") !== activeBefore) &&
                    typeof setSelection === "function"
                ) {
                    setSelection(selectionBefore ? selectionBefore.split("|").filter(Boolean) : [], activeBefore, {
                        preserveAnchor: true,
                    });
                }
            } catch (e) {
                console.debug?.(e);
            }
            try {
                const elapsedMs = Date.now() - loadingStartedAt;
                if (elapsedMs < MIN_LOADING_SKELETON_MS) {
                    await waitMs(MIN_LOADING_SKELETON_MS - elapsedMs);
                }
            } catch (e) {
                console.debug?.(e);
            }
            state.loading = false;
            clearLoadingMessage();
        }
    }

    /**
     * Background "head refresh" used after the snapshot fast-path returns
     * cached:true. The snapshot may be stale (assets were generated while
     * the user was on another scope, or the snapshot was restored from
     * localStorage at page load), so we silently re-fetch page 0 and
     * upsert any new items at their correct sort position. Existing cards
     * stay put, scroll position is preserved, no flicker.
     *
     * Returns early when the request is superseded (state.requestId
     * changed during the fetch) or when ComfyUI is generating.
     */
    let _headRefreshTimer = null;
    function scheduleSnapshotHeadRefresh(delayMs = 250) {
        recordOperation("refreshHead", { appendReason: "snapshotHeadRefresh" });
        try {
            if (_headRefreshTimer) clearTimeout(_headRefreshTimer);
        } catch (e) {
            console.debug?.(e);
        }
        const requestId = state.requestId;
        // Capture the active grid context (scope/sort/filters) at schedule
        // time. If the user changes any filter or scope before the head
        // refresh fires, we must abort — otherwise upsertAsset() would
        // inject items that don't match the current filter into the grid.
        let scheduledKey = null;
        try {
            scheduledKey = buildGridSnapshotKey(buildCurrentSnapshotParts());
        } catch (e) {
            console.debug?.(e);
        }
        _headRefreshTimer = setTimeout(async () => {
            _headRefreshTimer = null;
            if (Number(state.requestId) !== Number(requestId)) return;
            if (isExecutionBusy()) return;
            const gridContainer = getGridContainer();
            if (!gridContainer) return;
            // Filter/scope guard: bail if the user navigated away.
            if (scheduledKey) {
                let currentKey = null;
                try {
                    currentKey = buildGridSnapshotKey(buildCurrentSnapshotParts());
                } catch (e) {
                    console.debug?.(e);
                }
                if (currentKey && currentKey !== scheduledKey) {
                    mjrDbg("[Grid] Snapshot head refresh skipped — context changed");
                    return;
                }
            }
            const headLimit = Math.max(
                1,
                Math.min(APP_CONFIG.MAX_PAGE_SIZE, APP_CONFIG.DEFAULT_PAGE_SIZE),
            );
            try {
                const page = await fetchPage(state.query || "*", headLimit, 0, {
                    requestId,
                    signal: state.abortController?.signal || null,
                });
                if (Number(state.requestId) !== Number(requestId)) return;
                // Re-check context after the await — the user may have
                // switched scope while the fetch was in flight.
                if (scheduledKey) {
                    let currentKey = null;
                    try {
                        currentKey = buildGridSnapshotKey(buildCurrentSnapshotParts());
                    } catch (e) {
                        console.debug?.(e);
                    }
                    if (currentKey && currentKey !== scheduledKey) {
                        mjrDbg("[Grid] Snapshot head refresh discarded — context changed mid-fetch");
                        return;
                    }
                }
                if (!page?.ok) return;
                const pageAssets = Array.isArray(page.assets) ? page.assets : [];
                if (page.total != null) setLegacyPageState({ total: page.total });
                if (!pageAssets.length) return;
                let inserted = 0;
                for (const asset of pageAssets) {
                    if (asset && asset.id != null && upsertAsset(asset)) inserted += 1;
                }
                if (inserted > 0) {
                    rememberSnapshot(state.query || "*");
                    mjrDbg("[Grid] Snapshot head refresh: inserted", inserted, "new asset(s)");
                }
            } catch (e) {
                console.debug?.("[Grid] Snapshot head refresh failed", e);
            }
        }, Math.max(0, Number(delayMs) || 0));
    }

    async function loadAssets(query = "*", options = {}) {
        const startRequestId = state.requestId;
        const { reset = true, preserveVisibleUntilReady = true } = options || {};
        const gridContainer = getGridContainer();
        if (!gridContainer) {
            return { ok: false, error: "Grid unavailable" };
        }

        if (state.requestId !== startRequestId) {
            console.debug?.("[Grid] loadAssets aborted early due to rapid scope switch");
            return { ok: false, aborted: true };
        }

        try {
            globalThis.__MJR_LAST_ASSETKEY_GRID__ = gridContainer;
        } catch (e) {
            console.debug?.(e);
        }

        const requestedQuery = coerceQueryText(query).trim() || "*";
        const normalizedRequestedQuery = /^\[object\s+HTML.*Element\]$/i.test(requestedQuery)
            ? "*"
            : requestedQuery;
        const safeQuery = sanitizeQuery(normalizedRequestedQuery) || normalizedRequestedQuery;
        state.query = safeQuery;
        const resetInfo = reset
            ? resolveResetReason(safeQuery, options)
            : { reason: "append", nextContext: getCurrentResetContext(safeQuery) };
        recordOperation("reload", { reloadReason: resetInfo.reason || "loadAssets" });

        if (reset && isExecutionBusy()) {
            // Try to hydrate from a cached snapshot before deferring so the
            // grid never appears empty during a generation. Only the API
            // refresh is deferred — the user still sees the previously loaded
            // assets immediately. Falls back to the original "deferred" state
            // when no snapshot is available.
            let hydratedFromSnapshot = false;
            try {
                const snapshotParts = buildCurrentSnapshotParts();
                snapshotParts.query = safeQuery;
                const snapshotKey = buildGridSnapshotKey(snapshotParts);
                if (hasGridSnapshot(snapshotKey)) {
                    hydratedFromSnapshot = await hydrateFromSnapshot(snapshotParts, {
                        allowReplaceExisting: true,
                    });
                    if (state.requestId > startRequestId + (hydratedFromSnapshot ? 1 : 0)) {
                        console.debug?.("[Grid] loadAssets aborted during deferral due to scope switch");
                        return { ok: false, aborted: true };
                    }
                }
            } catch (e) {
                console.debug?.(e);
            }
            if (hydratedFromSnapshot) {
                clearLoadingMessage();
                state.loading = false;
            } else {
                setLoadingMessage("Grid refresh deferred while ComfyUI is generating...");
            }
            scheduleDeferredExecutionReload(safeQuery, options || {});
            return {
                ok: true,
                deferred: true,
                cached: hydratedFromSnapshot,
                count: Number(state.offset || 0) || 0,
                total: Number(state.total || 0) || 0,
            };
        }

        if (reset) {
            const resetReason = resetInfo.reason || "unknown";
            metrics.lastResetReason = resetReason;
            const allowImmediateReset = canResetImmediately(resetReason);
            if (!allowImmediateReset && Array.isArray(state.assets) && state.assets.length) {
                metrics.blockedImmediateResetCount += 1;
            }
            deferVisualResetUntilNextPage = !allowImmediateReset || shouldPreserveVisibleOnReset({
                reset,
                preserveVisibleUntilReady,
            });
            try {
                state.abortController?.abort?.();
            } catch (e) {
                console.debug?.(e);
            }
            state.loading = false;
            try {
                state.abortController =
                    typeof AbortController !== "undefined" ? new AbortController() : null;
            } catch {
                state.abortController = null;
            }
            state.requestId = (Number(state.requestId) || 0) + 1;
            clearPrefetchTimer();
            clearPendingUpserts();
            clearStatusMessage();
            if (deferVisualResetUntilNextPage) {
                state.query = safeQuery;
                setLegacyPageState({ offset: 0, cursor: null, total: null, done: false });
                resetAssetCollectionsState(state);
            } else {
                resetAssets({ query: safeQuery, total: null, done: false });
                setLegacyPageState({ offset: 0, cursor: null, total: null, done: false });
                resetAssetCollectionsState(state);
                metrics.resetCount += 1;
            }
            setLoadingMessage(
                safeQuery === "*" ? "Loading assets..." : `Searching for "${safeQuery}"...`,
            );
        }

        const result = await loadNextPage();
        repairOffsetFromLoadedAssets();

        // Prefetch next page after the first render settles.
        if (
            APP_CONFIG.PREFETCH_NEXT_PAGE &&
            result?.ok &&
            !result?.skipped &&
            !state.done &&
            !result?.aborted
        ) {
            scheduleNextPagePrefetch(state.requestId);
        }

        if (reset) {
            const showEmptyMessage = !(
                result?.skipped ||
                result?.hidden ||
                result?.aborted ||
                result?.stale ||
                result?.preservedCached ||
                result?.busy
            );
            finalizeLoad({ title: safeQuery, showEmptyMessage });
            rememberCurrentGridContext(resetInfo.nextContext);
        }
        return {
            ok: !!result?.ok,
            count: Number(state.offset || 0) || 0,
            total: Number(state.total || 0) || 0,
            error: result?.error,
            aborted: !!result?.aborted,
        };
    }

    async function loadAssetsFromList(assets, options = {}) {
        const {
            title = "Collection",
            reset = true,
            showLoading = true,
            preserveVisibleUntilReady = true,
        } = options || {};
        recordOperation("reload", { reloadReason: options?.resetReason || options?.reason || "collection" });
        const gridContainer = getGridContainer();
        if (!gridContainer) {
            return { ok: false, error: "Grid unavailable" };
        }

        const list = Array.isArray(assets) ? assets.slice() : [];
        const loadingStartedAt = Date.now();

        const preserveVisible = shouldPreserveVisibleOnReset({
            reset,
            preserveVisibleUntilReady,
        });

        if (reset) {
            metrics.lastResetReason = String(options?.resetReason || options?.reason || "collection");

            try {
                state.abortController?.abort?.();
            } catch (e) {
                console.debug?.(e);
            }
            try {
                state.abortController =
                    typeof AbortController !== "undefined" ? new AbortController() : null;
            } catch {
                state.abortController = null;
            }
            state.requestId = (Number(state.requestId) || 0) + 1;
            clearPendingUpserts();
            clearStatusMessage();
            if (preserveVisible) {
                state.query = String(title || "Collection");
                setLegacyPageState({ offset: 0, cursor: null, total: list.length, done: true });
            } else {
                resetAssets({
                    query: String(title || "Collection"),
                    total: list.length,
                    done: true,
                });
                setLegacyPageState({ offset: 0, cursor: null, total: list.length, done: true });
                resetAssetCollectionsState(state);
                metrics.resetCount += 1;
            }
            if (showLoading) {
                setLoadingMessage(list.length ? `Loading ${title}...` : `${title} is empty`);
                state.loading = true;
            } else {
                clearLoadingMessage();
                state.loading = false;
            }
        }

        try {
            const sortKey = readGridSortKey(gridContainer, "mtime_desc");
            const sorted = list.sort((a, b) => compareAssets(a, b, sortKey));
            if (reset && preserveVisible) {
                resetAssets({
                    query: String(title || "Collection"),
                    total: list.length,
                    done: true,
                });
                resetAssetCollectionsState(state);
                metrics.resetCount += 1;
            }
            appendAssets(gridContainer, sorted);
            setLegacyPageState({ offset: sorted.length, cursor: null, total: sorted.length, done: true });
            finalizeLoad({ title });
            rememberCurrentGridContext(getCurrentResetContext(String(title || "Collection")));
            return { ok: true, count: sorted.length, total: sorted.length };
        } catch (err) {
            setStatusMessage(formatLoadErrorMessage("Failed to load collection", err), {
                error: true,
            });
            return { ok: false, error: err?.message || String(err) };
        } finally {
            if (showLoading) {
                try {
                    const elapsedMs = Date.now() - loadingStartedAt;
                    if (elapsedMs < MIN_LOADING_SKELETON_MS) {
                        await waitMs(MIN_LOADING_SKELETON_MS - elapsedMs);
                    }
                } catch (e) {
                    console.debug?.(e);
                }
            }
            state.loading = false;
            if (showLoading) {
                clearLoadingMessage();
            }
        }
    }

    function prepareGridForScopeSwitch() {
        recordOperation("reload", { reloadReason: "scopeSwitch" });
        try {
            disposeStackGroupCards(getGridContainer());
        } catch (e) {
            console.debug?.(e);
        }
        try {
            state.abortController?.abort?.();
        } catch (e) {
            console.debug?.(e);
        }
        state.abortController = null;
        state.requestId = (Number(state.requestId) || 0) + 1;
        state.loading = true;
        // Reset pagination state so that any maybeFillViewport call triggered
        // by the visual reset cannot start a competing load before reloadGrid()
        // hands the new request to loadAssets(reset).
        setLegacyPageState({ offset: 0, cursor: null, total: null, done: false });
        resetAssets({ query: state.query || "*", total: null, done: false });
        clearPrefetchTimer();
        clearPendingUpserts();
        clearLoadingMessage();
        clearStatusMessage();
        resetAssetCollectionsState(state);
        deferVisualResetUntilNextPage = true;
        // void hydrateFromSnapshot(buildCurrentSnapshotParts(), { allowReplaceExisting: true }); // Disabled: prevents old images from flashing during tab switch
        setSelection([], "");
    }

    function refreshGrid() {
        state.virtualGrid?.setItems?.(state.assets || []);
    }

    function removeAssets(assetIds, { updateSelection = true } = {}) {
        const removedCount = removeAssetsFromState(state, assetIds, {
            assetKey: (asset) => assetKey(asset, getGridContainer()),
        });
        if (!removedCount) {
            return { ok: false, removed: 0, selectedIds: state.selectedIds.slice() };
        }

        if (Number.isFinite(Number(state.total))) {
            setLegacyPageState({ total: Math.max(0, Number(state.total || 0) - removedCount) });
        }

        if (updateSelection) {
            const visibleIds = state.assets.map((asset) => String(asset?.id || "")).filter(Boolean);
            reconcileSelection(visibleIds, { activeId: state.activeId });
        }

        if (!state.assets.length && !state.loading) {
            setStatusMessage("No assets found");
        }

        return {
            ok: true,
            removed: removedCount,
            selectedIds: state.selectedIds.slice(),
        };
    }

    function captureAnchor() {
        const gridContainer = getGridContainer();
        const scrollElement = readScrollElement();
        if (!gridContainer || !scrollElement) return null;

        const isCardVisibleInHost = (card) => {
            if (!card) return false;
            try {
                const rect = card.getBoundingClientRect();
                const hostRect = scrollElement.getBoundingClientRect();
                return rect.bottom >= hostRect.top && rect.top <= hostRect.bottom;
            } catch {
                return false;
            }
        };

        const selectedElement = findSelectedAssetCard(gridContainer);
        const visibleCards = readRenderedCards();
        const firstVisible = visibleCards.find((card) => isCardVisibleInHost(card)) || visibleCards[0] || null;
        const selectedVisible = isCardVisibleInHost(selectedElement);
        const anchorEl = selectedVisible ? selectedElement : firstVisible;
        if (!anchorEl) return null;

        try {
            const rect = anchorEl.getBoundingClientRect();
            const hostRect = scrollElement.getBoundingClientRect();
            return {
                id: String(anchorEl.dataset?.mjrAssetId || ""),
                top: rect.top - hostRect.top,
                scrollTop: Number(scrollElement.scrollTop || 0) || 0,
            };
        } catch (e) {
            console.debug?.(e);
            return null;
        }
    }

    async function restoreAnchor(anchor) {
        const gridContainer = getGridContainer();
        const scrollElement = readScrollElement();
        if (!gridContainer || !scrollElement || !anchor) return;

        await waitForLayout();

        const id = String(anchor.id || "").trim();
        if (!id) {
            scrollElement.scrollTop = Number(anchor.scrollTop || 0) || 0;
            metrics.scrollRestoreCount += 1;
            return;
        }

        scrollToAssetId(id, { align: "start" });
        await waitForLayout();

        const target = findAssetCardById(gridContainer, id);
        if (!target) {
            scrollElement.scrollTop = Number(anchor.scrollTop || 0) || 0;
            metrics.scrollRestoreCount += 1;
            return;
        }

        try {
            const rect = target.getBoundingClientRect();
            const hostRect = scrollElement.getBoundingClientRect();
            const delta = rect.top - hostRect.top - Number(anchor.top || 0);
            scrollElement.scrollTop = (Number(scrollElement.scrollTop || 0) || 0) + delta;
            metrics.scrollRestoreCount += 1;
        } catch (e) {
            console.debug?.(e);
            scrollElement.scrollTop = Number(anchor.scrollTop || 0) || 0;
            metrics.scrollRestoreCount += 1;
        }
    }

    async function hydrateFromSnapshot(parts = {}, options = {}) {
        const gridContainer = getGridContainer();
        if (!gridContainer) return false;
        const key = buildGridSnapshotKey(parts);
        const snapshot = getGridSnapshot(key);
        if (!snapshot || !Array.isArray(snapshot.assets) || !snapshot.assets.length) {
            return false;
        }
        if (!options.allowReplaceExisting && Array.isArray(state.assets) && state.assets.length) {
            return false;
        }
        metrics.lastResetReason = "snapshot";
        try {
            state.abortController?.abort?.();
        } catch (e) {
            console.debug?.(e);
        }
        try {
            state.abortController =
                typeof AbortController !== "undefined" ? new AbortController() : null;
        } catch {
            state.abortController = null;
        }
        state.requestId = (Number(state.requestId) || 0) + 1;
        clearPrefetchTimer();
        clearPendingUpserts();
        resetAssets({
            query: snapshot.query || options.title || "Cached",
            total: Number(snapshot.total ?? snapshot.assets.length) || snapshot.assets.length,
            done: !!snapshot.done,
        });
        resetAssetCollectionsState(state);
        metrics.resetCount += 1;
        clearStatusMessage();
        clearLoadingMessage();
        state.loading = false;

        appendAssets(gridContainer, snapshot.assets);
        setLegacyPageState({
            offset: Math.max(
                Number(snapshot.assets.length || 0) || 0,
                Number(snapshot.offset || snapshot.assets.length) || snapshot.assets.length,
            ),
            cursor: snapshot.cursor || null,
            total: Number(snapshot.total ?? snapshot.assets.length) || snapshot.assets.length,
            done: !!snapshot.done,
        });
        // Mark this hydrate so loadAssets fast-path can skip a redundant
        // re-hydrate triggered immediately after by scopeController.
        state._mjrLastHydrateKey = key;
        state._mjrLastHydrateAt = Date.now();
        rememberCurrentGridContext({ ...parts, query: snapshot.query || parts.query || "*" });
        // The snapshot is now on screen — any subsequent prefetch must
        // APPEND, not reset. Clear the defer flag set by
        // prepareGridForScopeSwitch / loadAssets so loadNextPage doesn't
        // wipe visible cards on the next response.
        deferVisualResetUntilNextPage = false;
        finalizeLoad({ title: snapshot.title || options.title || "Cached" });
        return true;
    }

    function _buildUpsertDeps(gridContainer) {
        return {
            getOrCreateState: () => state,
            ensureVirtualGrid: () => state.virtualGrid,
            upsertState: UPSERT_BATCH_STATE,
            maxBatchSize: UPSERT_BATCH_MAX_SIZE,
            debounceMs: UPSERT_BATCH_DEBOUNCE_MS,
            assetKey: (asset) => getStableRealtimeAssetKey(asset) || assetKey(asset, gridContainer),
            loadMajoorSettings,
        };
    }

    function upsertAsset(asset) {
        recordOperation("upsertRealtime", { appendReason: "realtime" });
        const gridContainer = getGridContainer();
        if (!gridContainer || !asset || !asset.id) return false;
        return queueUpsertAsset(gridContainer, asset, _buildUpsertDeps(gridContainer));
    }

    /**
     * Upsert an asset and flush within the current microtask boundary.
     *
     * Multiple calls in the same event-loop tick are coalesced into a single
     * flush via queueMicrotask.  This avoids N separate flush+setItems calls
     * when N WebSocket events arrive nearly simultaneously (e.g. 5 images
     * generated in a batch), while still being much faster than the 200 ms
     * debounce path.
     */
    let _immediateFlushScheduled = false;
    function upsertAssetNow(asset) {
        recordOperation("upsertRealtime", { appendReason: "realtimeImmediate" });
        const gridContainer = getGridContainer();
        if (!gridContainer || !asset || !asset.id) return false;
        const deps = _buildUpsertDeps(gridContainer);
        const ok = queueUpsertAsset(gridContainer, asset, deps);
        if (ok && !_immediateFlushScheduled) {
            _immediateFlushScheduled = true;
            queueMicrotask(() => {
                _immediateFlushScheduled = false;
                const gc = getGridContainer();
                if (gc) flushUpsertBatch(gc, _buildUpsertDeps(gc));
            });
        }
        return ok;
    }

    function dispose() {
        rememberSnapshot(state.query || "Cached");
        // Force any pending debounced storage write to flush before unload.
        try { flushGridSnapshotsPersist(); } catch (e) { console.debug?.(e); }
        clearDeferredExecutionReload();
        clearPrefetchTimer();
        try {
            state.abortController?.abort?.();
        } catch (e) {
            console.debug?.(e);
        }
        const gridContainer = getGridContainer();
        if (gridContainer) {
            try {
                const batchState = getUpsertBatchState(gridContainer, UPSERT_BATCH_STATE);
                if (batchState?.timer) {
                    clearTimeout(batchState.timer);
                    batchState.timer = null;
                }
                batchState?.pending?.clear?.();
            } catch (e) {
                console.debug?.(e);
            }
        }
    }

    // Abort any in-flight requests before the page unloads so they don't
    // appear as epoch-1 cancelled requests in the next session's network log.
    try {
        window.addEventListener("pagehide", dispose, { once: true });
    } catch (e) {
        console.debug?.(e);
    }

    return {
        reload: loadAssets,
        appendNextPage: loadNextPage,
        refreshHead: scheduleSnapshotHeadRefresh,
        upsertRealtime: upsertAssetNow,
        loadAssets,
        loadAssetsFromList,
        loadNextPage,
        prepareGridForScopeSwitch,
        refreshGrid,
        removeAssets,
        captureAnchor,
        restoreAnchor,
        hydrateFromSnapshot,
        upsertAsset,
        upsertAssetNow,
        getCanonicalState,
        getDebugSnapshot,
        dispose,
    };
}
