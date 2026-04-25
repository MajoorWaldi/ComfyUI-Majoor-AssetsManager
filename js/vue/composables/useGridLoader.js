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
    compareAssets,
    fetchPage as fetchGridPage,
    flushUpsertBatch,
    getUpsertBatchState,
    resolvePageAdvanceCount,
    upsertAsset as queueUpsertAsset,
} from "./useVirtualGrid.js";

const GRID_SNAPSHOT_CACHE = new Map();
const GRID_SNAPSHOT_CACHE_MAX = 8;
const GRID_SNAPSHOT_ASSET_LIMIT = 800;
const GRID_SNAPSHOT_STORAGE_KEY = "mjr_grid_snapshot_cache_v2";
const GRID_SNAPSHOT_TTL_MS = 30 * 60 * 1000;
const UPSERT_BATCH_DEBOUNCE_MS = 200;
const UPSERT_BATCH_MAX_SIZE = 50;
const UPSERT_BATCH_STATE = new WeakMap();
// 0 = no artificial skeleton hold. The skeleton naturally lasts the duration
// of the network/render work; an additional minimum delay only made the first
// paint feel sluggish on cold opens. Keep at 0 unless flicker is reintroduced.
const MIN_LOADING_SKELETON_MS = 0;
const GRID_SNAPSHOT_PERSIST_DEBOUNCE_MS = 1500;
let gridSnapshotStorageLoaded = false;
let gridSnapshotPersistTimer = null;
let gridSnapshotPersistPending = false;

const GRID_SNAPSHOT_ASSET_FIELDS = [
    "id",
    "filename",
    "name",
    "filepath",
    "path",
    "fullpath",
    "full_path",
    "subfolder",
    "source",
    "type",
    "root_id",
    "custom_root_id",
    "kind",
    "ext",
    "size",
    "mtime",
    "generation_time",
    "file_creation_time",
    "created_at",
    "updated_at",
    "indexed_at",
    "width",
    "height",
    "duration",
    "thumbnail_url",
    "thumb_url",
    "poster",
    "url",
    "rating",
    "tags",
    "has_workflow",
    "hasWorkflow",
    "has_generation_data",
    "hasGenerationData",
    "workflow_type",
    "workflowType",
    "generation_time_ms",
    "positive_prompt",
    "enhanced_caption",
    "auto_tags",
    "has_ai_info",
    "has_ai_vector",
    "has_ai_auto_tags",
    "has_ai_enhanced_caption",
    "job_id",
    "stack_id",
    "source_node_id",
    "source_node_type",
    "date",
    "date_exact",
];

function waitMs(ms) {
    return new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
}

function normalizeSnapshotPart(value, fallback = "") {
    try {
        return String(value ?? fallback).trim();
    } catch {
        return String(fallback);
    }
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

export function buildGridSnapshotKey(parts = {}) {
    return JSON.stringify({
        scope: normalizeSnapshotPart(parts.scope || "output", "output"),
        query: normalizeSnapshotPart(parts.query || "*", "*"),
        customRootId: normalizeSnapshotPart(parts.customRootId || ""),
        subfolder: normalizeSnapshotPart(parts.subfolder || ""),
        collectionId: normalizeSnapshotPart(parts.collectionId || ""),
        viewScope: normalizeSnapshotPart(parts.viewScope || ""),
        kind: normalizeSnapshotPart(parts.kind || ""),
        workflowOnly: normalizeSnapshotPart(parts.workflowOnly ? "1" : ""),
        minRating: normalizeSnapshotPart(parts.minRating || ""),
        minSizeMB: normalizeSnapshotPart(parts.minSizeMB || ""),
        maxSizeMB: normalizeSnapshotPart(parts.maxSizeMB || ""),
        resolutionCompare: normalizeSnapshotPart(parts.resolutionCompare || ""),
        minWidth: normalizeSnapshotPart(parts.minWidth || ""),
        minHeight: normalizeSnapshotPart(parts.minHeight || ""),
        maxWidth: normalizeSnapshotPart(parts.maxWidth || ""),
        maxHeight: normalizeSnapshotPart(parts.maxHeight || ""),
        workflowType: normalizeSnapshotPart(parts.workflowType || "").toUpperCase(),
        dateRange: normalizeSnapshotPart(parts.dateRange || ""),
        dateExact: normalizeSnapshotPart(parts.dateExact || ""),
        sort: normalizeSnapshotPart(parts.sort || "mtime_desc", "mtime_desc"),
        semanticMode: normalizeSnapshotPart(parts.semanticMode ? "1" : ""),
    });
}

function gridSnapshotStorage() {
    // Use localStorage so cached grid snapshots survive a full ComfyUI tab
    // reload and the very first cold open of a new session can paint instantly
    // from cache before the first /list response arrives. sessionStorage was
    // wiped on every reload, defeating the whole purpose of the snapshot.
    try {
        return globalThis?.localStorage || null;
    } catch {
        return null;
    }
}

function migrateLegacySessionSnapshots(storage) {
    // One-shot migration: lift any pre-existing sessionStorage snapshot into
    // localStorage so users keep their cached grid on the very first run after
    // upgrade. Safe no-op when nothing legacy is present.
    try {
        const legacy = globalThis?.sessionStorage;
        if (!legacy || !storage) return;
        const raw = legacy.getItem?.(GRID_SNAPSHOT_STORAGE_KEY);
        if (!raw) return;
        if (!storage.getItem?.(GRID_SNAPSHOT_STORAGE_KEY)) {
            storage.setItem(GRID_SNAPSHOT_STORAGE_KEY, raw);
        }
        legacy.removeItem(GRID_SNAPSHOT_STORAGE_KEY);
    } catch (e) {
        console.debug?.(e);
    }
}

function compactSnapshotAsset(asset) {
    if (!asset || typeof asset !== "object") return null;
    const out = {};
    for (const field of GRID_SNAPSHOT_ASSET_FIELDS) {
        if (asset[field] !== undefined) out[field] = asset[field];
    }
    if (!out.type && out.source) out.type = out.source;
    if (!out.source && out.type) out.source = out.type;
    if (!out.kind) out.kind = asset.kind || "image";
    if (Array.isArray(out.tags)) out.tags = out.tags.slice(0, 80);
    if (Array.isArray(out.auto_tags)) out.auto_tags = out.auto_tags.slice(0, 80);
    return out;
}

function normalizeGridSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") return null;
    const at = Number(snapshot.at || 0) || 0;
    if (!at || Date.now() - at > GRID_SNAPSHOT_TTL_MS) return null;
    const assets = Array.isArray(snapshot.assets)
        ? snapshot.assets.map(compactSnapshotAsset).filter(Boolean)
        : [];
    if (!assets.length) return null;
    const totalRaw = Number(snapshot.total ?? assets.length);
    const offsetRaw = Number(snapshot.offset ?? assets.length);
    return {
        assets,
        title: normalizeSnapshotPart(snapshot.title || "Cached", "Cached"),
        at,
        total: Number.isFinite(totalRaw) ? Math.max(0, totalRaw) : assets.length,
        offset: Number.isFinite(offsetRaw) ? Math.max(assets.length, offsetRaw) : assets.length,
        done: !!snapshot.done,
        query: normalizeSnapshotPart(snapshot.query || "*", "*"),
    };
}

function pruneGridSnapshotCache() {
    const now = Date.now();
    for (const [key, snapshot] of GRID_SNAPSHOT_CACHE.entries()) {
        const at = Number(snapshot?.at || 0) || 0;
        if (!at || now - at > GRID_SNAPSHOT_TTL_MS) {
            GRID_SNAPSHOT_CACHE.delete(key);
        }
    }
    while (GRID_SNAPSHOT_CACHE.size > GRID_SNAPSHOT_CACHE_MAX) {
        const oldestKey = GRID_SNAPSHOT_CACHE.keys().next().value;
        if (!oldestKey) break;
        GRID_SNAPSHOT_CACHE.delete(oldestKey);
    }
}

function loadGridSnapshotsFromStorage() {
    if (gridSnapshotStorageLoaded) return;
    gridSnapshotStorageLoaded = true;
    try {
        const storage = gridSnapshotStorage();
        migrateLegacySessionSnapshots(storage);
        const raw = storage?.getItem?.(GRID_SNAPSHOT_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        const entries = Array.isArray(parsed?.entries) ? parsed.entries : [];
        for (const entry of entries) {
            if (!Array.isArray(entry) || entry.length < 2) continue;
            const key = String(entry[0] || "");
            const snapshot = normalizeGridSnapshot(entry[1]);
            if (key && snapshot) GRID_SNAPSHOT_CACHE.set(key, snapshot);
        }
        pruneGridSnapshotCache();
    } catch (e) {
        console.debug?.(e);
    }
}

function persistGridSnapshotsToStorageNow() {
    // PERF FIX #4: in-memory cache only.
    // Persisting up to 8 snapshots * 800 assets caused multi-MB JSON.stringify
    // freezes on the main thread. We keep the in-memory cache so within-session
    // navigation is fast, but we no longer write to localStorage.
    try {
        pruneGridSnapshotCache();
    } catch (e) {
        console.debug?.(e);
    }
}

// Debounced persist: snapshot writes can be expensive (multi-MB JSON.stringify
// of up to 8 snapshots * 800 assets). Pagination + realtime upserts can call
// rememberSnapshot() repeatedly; collapse those into a single async write to
// keep the main thread responsive during scroll/generation bursts.
function persistGridSnapshotsToStorage() {
    gridSnapshotPersistPending = true;
    if (gridSnapshotPersistTimer) return;
    gridSnapshotPersistTimer = setTimeout(() => {
        gridSnapshotPersistTimer = null;
        if (!gridSnapshotPersistPending) return;
        gridSnapshotPersistPending = false;
        persistGridSnapshotsToStorageNow();
    }, GRID_SNAPSHOT_PERSIST_DEBOUNCE_MS);
}

function flushGridSnapshotsPersist() {
    if (gridSnapshotPersistTimer) {
        clearTimeout(gridSnapshotPersistTimer);
        gridSnapshotPersistTimer = null;
    }
    if (!gridSnapshotPersistPending) return;
    gridSnapshotPersistPending = false;
    persistGridSnapshotsToStorageNow();
}

function getGridSnapshot(key) {
    loadGridSnapshotsFromStorage();
    const snapshot = normalizeGridSnapshot(GRID_SNAPSHOT_CACHE.get(key));
    if (!snapshot) {
        GRID_SNAPSHOT_CACHE.delete(key);
        persistGridSnapshotsToStorage();
        return null;
    }
    GRID_SNAPSHOT_CACHE.delete(key);
    GRID_SNAPSHOT_CACHE.set(key, snapshot);
    persistGridSnapshotsToStorage();
    return snapshot;
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

function safeEscapeId(value) {
    const str = String(value ?? "");
    try {
        if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
            return CSS.escape(str);
        }
    } catch (e) {
        console.debug?.(e);
    }
    return str.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, "\\$1");
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

    function getGridContainer() {
        return resolveElement(gridContainerRef);
    }

    function buildCurrentSnapshotParts() {
        const gridContainer = getGridContainer();
        return {
            scope: gridContainer?.dataset?.mjrScope || "output",
            query: gridContainer?.dataset?.mjrQuery || state.query || "*",
            customRootId: gridContainer?.dataset?.mjrCustomRootId || "",
            subfolder: gridContainer?.dataset?.mjrSubfolder || "",
            collectionId: gridContainer?.dataset?.mjrCollectionId || "",
            viewScope: gridContainer?.dataset?.mjrViewScope || "",
            kind: gridContainer?.dataset?.mjrFilterKind || "",
            workflowOnly: gridContainer?.dataset?.mjrFilterWorkflowOnly === "1",
            minRating: gridContainer?.dataset?.mjrFilterMinRating || "",
            minSizeMB: gridContainer?.dataset?.mjrFilterMinSizeMB || "",
            maxSizeMB: gridContainer?.dataset?.mjrFilterMaxSizeMB || "",
            resolutionCompare: gridContainer?.dataset?.mjrFilterResolutionCompare || "",
            minWidth: gridContainer?.dataset?.mjrFilterMinWidth || "",
            minHeight: gridContainer?.dataset?.mjrFilterMinHeight || "",
            maxWidth: gridContainer?.dataset?.mjrFilterMaxWidth || "",
            maxHeight: gridContainer?.dataset?.mjrFilterMaxHeight || "",
            workflowType: gridContainer?.dataset?.mjrFilterWorkflowType || "",
            dateRange: gridContainer?.dataset?.mjrFilterDateRange || "",
            dateExact: gridContainer?.dataset?.mjrFilterDateExact || "",
            sort: gridContainer?.dataset?.mjrSort || "mtime_desc",
            semanticMode: gridContainer?.dataset?.mjrSemanticMode === "1",
        };
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
            const freshQuery =
                String(gridContainer?.dataset?.mjrQuery || "").trim() || query;
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
                .slice(0, GRID_SNAPSHOT_ASSET_LIMIT)
                .map(compactSnapshotAsset)
                .filter(Boolean);
            if (!snapshotAssets.length) return;
            const wasTruncated = snapshotAssets.length < assets.length;
            const rawOffset = Number(state.offset || snapshotAssets.length) || snapshotAssets.length;
            const rawTotal = Number(state.total ?? snapshotAssets.length);
            const key = buildGridSnapshotKey({
                scope: gridContainer.dataset?.mjrScope || "output",
                query: gridContainer.dataset?.mjrQuery || state.query || "*",
                customRootId: gridContainer.dataset?.mjrCustomRootId || "",
                subfolder: gridContainer.dataset?.mjrSubfolder || "",
                collectionId: gridContainer.dataset?.mjrCollectionId || "",
                viewScope: gridContainer.dataset?.mjrViewScope || "",
                kind: gridContainer.dataset?.mjrFilterKind || "",
                workflowOnly: gridContainer.dataset?.mjrFilterWorkflowOnly === "1",
                minRating: gridContainer.dataset?.mjrFilterMinRating || "",
                minSizeMB: gridContainer.dataset?.mjrFilterMinSizeMB || "",
                maxSizeMB: gridContainer.dataset?.mjrFilterMaxSizeMB || "",
                resolutionCompare: gridContainer.dataset?.mjrFilterResolutionCompare || "",
                minWidth: gridContainer.dataset?.mjrFilterMinWidth || "",
                minHeight: gridContainer.dataset?.mjrFilterMinHeight || "",
                maxWidth: gridContainer.dataset?.mjrFilterMaxWidth || "",
                maxHeight: gridContainer.dataset?.mjrFilterMaxHeight || "",
                workflowType: gridContainer.dataset?.mjrFilterWorkflowType || "",
                dateRange: gridContainer.dataset?.mjrFilterDateRange || "",
                dateExact: gridContainer.dataset?.mjrFilterDateExact || "",
                sort: gridContainer.dataset?.mjrSort || "mtime_desc",
            });
            if (!key) return;
            GRID_SNAPSHOT_CACHE.delete(key);
            GRID_SNAPSHOT_CACHE.set(key, {
                assets: snapshotAssets,
                title: String(title || "").trim(),
                query: String(state.query || gridContainer.dataset?.mjrQuery || "*").trim() || "*",
                total: Number.isFinite(rawTotal) ? rawTotal : snapshotAssets.length,
                offset: wasTruncated
                    ? snapshotAssets.length
                    : Math.max(snapshotAssets.length, rawOffset),
                done: wasTruncated ? false : !!state.done,
                at: Date.now(),
            });
            persistGridSnapshotsToStorage();
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
        return cardAppendAssets(gridContainer, assets, state, {
            loadMajoorSettings,
            clearGridMessage: () => {
                clearStatusMessage();
            },
            ensureVirtualGrid: () => state.virtualGrid,
            setFileBadgeCollision,
            assetKey: (asset) => assetKey(asset, gridContainer),
            ensureDupStackCard: (gc, card, asset) => ensureDupStackCard(gc, card, asset),
        });
    }

    /**
     * Build a key fingerprint that matches `_buildEarlyFetchKey` in
     * features/runtime/earlyFetch.js. The two MUST stay in sync — when they
     * diverge the grid silently falls back to a second /list round-trip,
     * which is precisely what the early fetch was meant to avoid.
     */
    function buildEarlyFetchMatchKey(gridContainer, query) {
        const ds = gridContainer?.dataset || {};
        const scope = String(ds.mjrScope || "output").toLowerCase();
        const sort = String(ds.mjrSort || "mtime_desc").toLowerCase();
        const customRootId = String(ds.mjrCustomRootId || "").trim();
        const subfolder = String(ds.mjrSubfolder || "").trim();
        const collectionId = String(ds.mjrCollectionId || "").trim();
        const kind = String(ds.mjrFilterKind || "").trim();
        const workflowOnly = String(ds.mjrFilterWorkflowOnly || "") === "1";
        const minRating = Number(ds.mjrFilterMinRating || 0) || 0;
        const minSizeMB = Number(ds.mjrFilterMinSizeMB || 0) || 0;
        const maxSizeMB = Number(ds.mjrFilterMaxSizeMB || 0) || 0;
        const resolutionCompare =
            String(ds.mjrFilterResolutionCompare || "gte") === "lte" ? "lte" : "gte";
        const minWidth = Number(ds.mjrFilterMinWidth || 0) || 0;
        const minHeight = Number(ds.mjrFilterMinHeight || 0) || 0;
        const maxWidth = Number(ds.mjrFilterMaxWidth || 0) || 0;
        const maxHeight = Number(ds.mjrFilterMaxHeight || 0) || 0;
        const workflowType = String(ds.mjrFilterWorkflowType || "").trim();
        const dateRange = String(ds.mjrFilterDateRange || "").trim().toLowerCase();
        const dateExact = String(ds.mjrFilterDateExact || "").trim();
        const normalizedQuery = String(query || "*").trim() || "*";
        return [
            scope,
            normalizedQuery,
            sort,
            customRootId,
            subfolder,
            collectionId,
            kind,
            workflowOnly ? "1" : "",
            minRating || "",
            minSizeMB || "",
            maxSizeMB || "",
            resolutionCompare,
            minWidth || "",
            minHeight || "",
            maxWidth || "",
            maxHeight || "",
            workflowType,
            dateRange,
            dateExact,
        ].join("|");
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
                            return {
                                ok: true,
                                assets: earlyAssets,
                                total: rawTotal != null ? Number(rawTotal) || 0 : null,
                                count: earlyAssets.length,
                                limit: limit,
                                offset: 0,
                            };
                        }
                    } catch (e) {
                        mjrDbg("[Grid] Early fetch failed, falling back to normal fetch", e);
                    }
                }
            }
        }

        return fetchGridPage(
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
            { requestId, signal },
        );
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
        reconcileSelection(visibleIds, { activeId: state.activeId });
    }

    async function loadNextPage() {
        const gridContainer = getGridContainer();
        if (!gridContainer || state.loading || state.done) return { ok: true, skipped: true };
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
                const currentLimit = getAdaptivePageLimit(baseLimit, 0);
                const page = await fetchPage(state.query, currentLimit, state.offset, {
                    requestId: Number(state.requestId ?? 0) || 0,
                    signal: state.abortController?.signal || null,
                });
                if (!page.ok) {
                    if (page.aborted || page.stale) {
                        return page;
                    }
                    state.done = true;
                    setStatusMessage(
                        formatLoadErrorMessage("Failed to load assets", page?.error || "Unknown error"),
                        { error: true },
                    );
                    return page;
                }

                if (page.total != null) {
                    state.total = Number(page.total) || 0;
                }

                const pageAssets = Array.isArray(page.assets) ? page.assets : [];
                const responseHasItems = pageAssets.length > 0;
                // Only commit a visual reset (which clears the previously
                // cached / snapshot-hydrated cards) when the new page has
                // something to render OR when the backend authoritatively
                // reports total=0. A transient empty response (network race,
                // stale offset after rapid scope switches, etc.) must NOT
                // wipe the visible assets — that was the root cause of the
                // "grid disappears on scope switch / return to Output" bug.
                if (deferVisualResetUntilNextPage) {
                    const responseAssertsEmpty =
                        page.total != null && Number(page.total) === 0;
                    if (responseHasItems || responseAssertsEmpty) {
                        resetAssets({ query: state.query || "*", total: null, done: false });
                        resetAssetCollectionsState(state);
                        deferVisualResetUntilNextPage = false;
                    } else if (Array.isArray(state.assets) && state.assets.length) {
                        // Keep cached cards visible, treat as benign empty
                        // batch and let the loop bail naturally.
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
                }

                const fetchedCount = Number(page.count || 0) || 0;
                const consumedCount = resolvePageAdvanceCount({
                    count: fetchedCount,
                    limit: Number(page.limit || currentLimit) || currentLimit,
                    offset: state.offset,
                    total: page.total != null ? page.total : state.total,
                });
                const addedCount = responseHasItems
                    ? Number(appendAssets(gridContainer, pageAssets) || 0) || 0
                    : 0;
                state.offset += consumedCount;
                state.done =
                    consumedCount <= 0 ||
                    (Number.isFinite(Number(state.total)) &&
                        Number(state.total || 0) > 0 &&
                        state.offset >= Number(state.total || 0));

                if (state.done || addedCount > 0) {
                    if (addedCount > 0 || state.done) {
                        rememberSnapshot(state.query || gridContainer.dataset?.mjrQuery || "*");
                    }
                    return {
                        ok: true,
                        count: fetchedCount,
                        total: state.total,
                    };
                }

                mjrDbg(`[Grid LoadPage] fetched one page with no visible additions: offset=${state.offset}, fetched=${fetchedCount}, consumed=${consumedCount}, added=${addedCount}, limit=${currentLimit}, done=${state.done}, visibleCount=${state.assets.length}, total=${state.total}`);
                return {
                    ok: true,
                    count: fetchedCount,
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
                if (page.total != null) state.total = Number(page.total) || state.total;
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
                if (GRID_SNAPSHOT_CACHE.has(snapshotKey)) {
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
            deferVisualResetUntilNextPage = shouldPreserveVisibleOnReset({
                reset,
                preserveVisibleUntilReady,
            });
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
            clearStatusMessage();
            if (deferVisualResetUntilNextPage) {
                state.query = safeQuery;
                state.offset = 0;
                state.total = null;
                state.done = false;
                resetAssetCollectionsState(state);
            } else {
                resetAssets({ query: safeQuery, total: null, done: false });
                resetAssetCollectionsState(state);
            }
            setLoadingMessage(
                safeQuery === "*" ? "Loading assets..." : `Searching for "${safeQuery}"...`,
            );

            // Fast path: Disabled to prevent flashing of ancient localized cache
            /*
            if (safeQuery === "*" && deferVisualResetUntilNextPage) {
                try {
                    const snapshotParts = buildCurrentSnapshotParts();
                    snapshotParts.query = "*";
                    const snapshotKey = buildGridSnapshotKey(snapshotParts);
                    if (state._mjrLastHydrateKey === snapshotKey &&
                        Date.now() - Number(state._mjrLastHydrateAt || 0) < 1500) {
                        state.offset = Math.max(
                            Number(state.offset || 0) || 0,
                            Number(state.assets?.length || 0) || 0,
                        );
                        state.loading = false;
                        deferVisualResetUntilNextPage = false;
                        clearLoadingMessage();
                        const bgRequestId = state.requestId;
                        scheduleNextPagePrefetch(
                            bgRequestId,
                            Math.min(APP_CONFIG.PREFETCH_NEXT_PAGE_DELAY_MS ?? 700, 250),
                        );
                        scheduleSnapshotHeadRefresh(200);
                        return {
                            ok: true,
                            count: Number(state.offset || 0) || 0,
                            total: Number(state.total || 0) || 0,
                            cached: true,
                        };
                    }
                    const hasSnapshot = GRID_SNAPSHOT_CACHE.has(snapshotKey);
                    const snapshotRequestIdBefore = state.requestId;
                    const didHydrate = hasSnapshot
                        ? await hydrateFromSnapshot(snapshotParts, {
                              allowReplaceExisting: true,
                          })
                        : false;
                    if (state.requestId > snapshotRequestIdBefore + (didHydrate ? 1 : 0)) {
                        console.debug?.("[Grid] loadAssets fast-path aborted due to scope switch");
                        return { ok: false, aborted: true };
                    }
                    if (didHydrate) {
                        state.offset = Math.max(
                            Number(state.offset || 0) || 0,
                            Number(state.assets?.length || 0) || 0,
                        );
                        state.done = false;
                        state.loading = false;
                        deferVisualResetUntilNextPage = false;
                        clearLoadingMessage();
                        const bgRequestId = state.requestId;
                        scheduleNextPagePrefetch(
                            bgRequestId,
                            Math.min(APP_CONFIG.PREFETCH_NEXT_PAGE_DELAY_MS ?? 700, 250),
                        );
                        scheduleSnapshotHeadRefresh(200);
                        return {
                            ok: true,
                            count: Number(state.offset || 0) || 0,
                            total: Number(state.total || 0) || 0,
                            cached: true,
                        };
                    }
                } catch (e) {
                    console.debug?.("[Grid] Snapshot fast-path failed, falling back", e);
                }
            }
            */
        }

        const result = await loadNextPage();

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
                state.offset = 0;
                state.total = list.length;
                state.done = true;
            } else {
                resetAssets({
                    query: String(title || "Collection"),
                    total: list.length,
                    done: true,
                });
                resetAssetCollectionsState(state);
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
            const sortKey = gridContainer.dataset?.mjrSort || "mtime_desc";
            const sorted = list.sort((a, b) => compareAssets(a, b, sortKey));
            if (reset && preserveVisible) {
                resetAssets({
                    query: String(title || "Collection"),
                    total: list.length,
                    done: true,
                });
                resetAssetCollectionsState(state);
            }
            appendAssets(gridContainer, sorted);
            state.offset = sorted.length;
            state.total = sorted.length;
            state.done = true;
            finalizeLoad({ title });
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
        try {
            state.abortController =
                typeof AbortController !== "undefined" ? new AbortController() : null;
        } catch {
            state.abortController = null;
        }
        state.requestId = (Number(state.requestId) || 0) + 1;
        state.loading = false;
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
        const ids = new Set(
            (Array.isArray(assetIds) ? assetIds : [assetIds])
                .map((raw) => {
                    if (raw == null) return "";
                    if (typeof raw === "object" && raw?.id != null) {
                        return String(raw.id);
                    }
                    return String(raw);
                })
                .filter(Boolean),
        );
        if (!ids.size) {
            return { ok: false, removed: 0, selectedIds: state.selectedIds.slice() };
        }

        let removedCount = 0;
        state.assets = (Array.isArray(state.assets) ? state.assets : []).filter((asset) => {
            const id = asset?.id != null ? String(asset.id) : "";
            if (id && ids.has(id)) {
                removedCount += 1;
                try {
                    state.assetIdSet.delete(id);
                } catch (e) {
                    console.debug?.(e);
                }
                return false;
            }
            return true;
        });

        if (Number.isFinite(Number(state.total))) {
            state.total = Math.max(0, Number(state.total || 0) - removedCount);
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

        const selectedElement = gridContainer.querySelector(".mjr-asset-card.is-selected");
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
            return;
        }

        scrollToAssetId(id, { align: "start" });
        await waitForLayout();

        const target = gridContainer.querySelector(
            `.mjr-asset-card[data-mjr-asset-id="${safeEscapeId(id)}"]`,
        );
        if (!target) {
            scrollElement.scrollTop = Number(anchor.scrollTop || 0) || 0;
            return;
        }

        try {
            const rect = target.getBoundingClientRect();
            const hostRect = scrollElement.getBoundingClientRect();
            const delta = rect.top - hostRect.top - Number(anchor.top || 0);
            scrollElement.scrollTop = (Number(scrollElement.scrollTop || 0) || 0) + delta;
        } catch (e) {
            console.debug?.(e);
            scrollElement.scrollTop = Number(anchor.scrollTop || 0) || 0;
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
        clearStatusMessage();
        clearLoadingMessage();
        state.loading = false;

        appendAssets(gridContainer, snapshot.assets);
        state.offset = Math.max(
            Number(snapshot.assets.length || 0) || 0,
            Number(snapshot.offset || snapshot.assets.length) || snapshot.assets.length,
        );
        state.total = Number(snapshot.total ?? snapshot.assets.length) || snapshot.assets.length;
        state.done = !!snapshot.done;
        // Mark this hydrate so loadAssets fast-path can skip a redundant
        // re-hydrate triggered immediately after by scopeController.
        state._mjrLastHydrateKey = key;
        state._mjrLastHydrateAt = Date.now();
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
        dispose,
    };
}
