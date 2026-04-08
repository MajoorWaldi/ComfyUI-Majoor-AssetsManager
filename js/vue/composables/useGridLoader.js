import { nextTick } from "vue";
import { get } from "../../api/client.js";
import { buildListURL } from "../../api/endpoints.js";
import { APP_CONFIG } from "../../app/config.js";
import { loadMajoorSettings } from "../../app/settings.js";
import { setFileBadgeCollision } from "../../components/Badges.js";
import { pickRootId } from "../../utils/ids.js";
import { isGridHostVisible } from "./gridVisibility.js";
import { consumeEarlyFetch } from "../../features/runtime/entryUiRegistration.js";
import {
    appendAssets as cardAppendAssets,
} from "../../features/grid/AssetCardRenderer.js";
import { getStackAwareAssetKey, ensureDupStackCard } from "../../features/grid/StackGroupCards.js";
import {
    compareAssets,
    fetchPage as fetchGridPage,
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
const MIN_LOADING_SKELETON_MS = 180;
let gridSnapshotStorageLoaded = false;

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
    });
}

function gridSnapshotStorage() {
    try {
        return globalThis?.sessionStorage || null;
    } catch {
        return null;
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

function persistGridSnapshotsToStorage() {
    try {
        pruneGridSnapshotCache();
        const storage = gridSnapshotStorage();
        if (!storage) return;
        storage.setItem(
            GRID_SNAPSHOT_STORAGE_KEY,
            JSON.stringify({
                version: 2,
                entries: Array.from(GRID_SNAPSHOT_CACHE.entries()),
            }),
        );
    } catch (e) {
        console.debug?.(e);
    }
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
    if (!query || query.trim() === "") return query;
    if (query === "*") return "*";

    let cleaned = "";
    if (query.length > 256) {
        cleaned = query.replace(/[^a-z0-9\s-]/gi, " ");
    } else {
        try {
            cleaned = query.replace(/[^\p{L}\p{N}\s-]/gu, " ");
        } catch {
            cleaned = query.replace(/[^a-z0-9\s-]/gi, " ");
        }
    }
    return cleaned.trim() || query;
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
    await nextTick();
    await new Promise((resolve) => {
        try {
            requestAnimationFrame(() => requestAnimationFrame(resolve));
        } catch {
            resolve();
        }
    });
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
    function getGridContainer() {
        return resolveElement(gridContainerRef);
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

    async function fetchPage(query, limit, offset, { requestId = 0, signal = null } = {}) {
        const gridContainer = getGridContainer();
        if (!gridContainer) {
            return { ok: false, error: "Grid unavailable" };
        }

        // Try to use early-fetched data for the first page of default browse context.
        // This significantly reduces perceived load time when opening the panel.
        if (offset === 0) {
            const scope = String(gridContainer.dataset?.mjrScope || "output").toLowerCase();
            const sort = String(gridContainer.dataset?.mjrSort || "mtime_desc").toLowerCase();
            const normalizedQuery = String(query || "*").trim() || "*";
            const isDefaultContext = scope === "output" && normalizedQuery === "*" && sort === "mtime_desc";
            
            if (isDefaultContext) {
                const earlyFetchPromise = consumeEarlyFetch("output:*:mtime_desc");
                if (earlyFetchPromise) {
                    try {
                        const earlyResult = await earlyFetchPromise;
                        // API returns { ok, data: { assets: [...], total, ... } }
                        const earlyAssets = earlyResult?.data?.assets;
                        if (earlyResult?.ok && Array.isArray(earlyAssets)) {
                            console.debug("[Grid] Using early-fetched data:", earlyAssets.length, "assets");
                            return {
                                ok: true,
                                assets: earlyAssets,
                                total: Number(earlyResult.data?.total ?? earlyResult.meta?.total ?? earlyAssets.length) || 0,
                                count: earlyAssets.length,
                                limit: limit,
                                offset: 0,
                            };
                        }
                    } catch (e) {
                        console.debug("[Grid] Early fetch failed, falling back to normal fetch", e);
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

    function finalizeLoad({ title = "" } = {}) {
        clearLoadingMessage();
        if (!(Array.isArray(state.assets) && state.assets.length)) {
            if (!state.statusMessage || !state.statusError) {
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
            return { ok: true, skipped: true, hidden: true };
        }

        const baseLimit = Math.max(
            1,
            Math.min(APP_CONFIG.MAX_PAGE_SIZE, APP_CONFIG.DEFAULT_PAGE_SIZE),
        );
        const loadingStartedAt = Date.now();
        // Dynamically calculate max empty batches based on total assets
        // For 7000+ assets: allows ~200+ empty batches before giving up
        // For smaller sets: proportional (min 8, max 200)
        const totalAssets = Number(state.total || 0) || 1000;
        const MAX_EMPTY_APPEND_BATCHES = Math.min(
            200,
            Math.max(8, Math.ceil((totalAssets / 1000) * 30))
        );
        state.loading = true;
        clearStatusMessage();
        try {
            let emptyAppendBatches = 0;
            while (!state.done) {
                if (!canLoadFromHost()) {
                    return { ok: true, skipped: true, hidden: true };
                }
                const currentLimit = getAdaptivePageLimit(baseLimit, emptyAppendBatches);
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

                const fetchedCount = Number(page.count || 0) || 0;
                const consumedCount = resolvePageAdvanceCount({
                    count: fetchedCount,
                    limit: Number(page.limit || currentLimit) || currentLimit,
                    offset: state.offset,
                    total: page.total != null ? page.total : state.total,
                });
                const addedCount = Number(appendAssets(gridContainer, page.assets || []) || 0) || 0;
                state.offset += consumedCount;
                const wasDone = state.done;
                state.done =
                    consumedCount <= 0 ||
                    (Number.isFinite(Number(state.total)) &&
                        Number(state.total || 0) > 0 &&
                        state.offset >= Number(state.total || 0));

                // Debug logging
                if (emptyAppendBatches > 0 || state.done) {
                    console.debug(`[Grid LoadPage] offset=${state.offset}, fetched=${fetchedCount}, consumed=${consumedCount}, added=${addedCount}, limit=${currentLimit}, done=${state.done}, visibleCount=${state.assets.length}, total=${state.total}, emptyBatches=${emptyAppendBatches}/${MAX_EMPTY_APPEND_BATCHES}`);
                }

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

                // If a fetched page adds zero visible cards (dedupe/hide), keep fetching
                // so infinite scroll doesn't stall at the current bottom.
                // Limit is now dynamic based on total assets to handle large libraries.
                emptyAppendBatches += 1;
                if (emptyAppendBatches >= MAX_EMPTY_APPEND_BATCHES) {
                    console.debug(`[Grid] Empty append batches limit reached: ${emptyAppendBatches}/${MAX_EMPTY_APPEND_BATCHES}`);
                    return {
                        ok: true,
                        count: 0,
                        total: state.total,
                        skippedEmpty: true,
                    };
                }
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

    async function loadAssets(query = "*", options = {}) {
        const { reset = true } = options || {};
        const gridContainer = getGridContainer();
        if (!gridContainer) {
            return { ok: false, error: "Grid unavailable" };
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
            resetAssets({ query: safeQuery, total: null, done: false });
            clearPendingUpserts();
            clearStatusMessage();
            setLoadingMessage(
                safeQuery === "*" ? "Loading assets..." : `Searching for "${safeQuery}"...`,
            );
        }

        const result = await loadNextPage();

        // Prefetch next page immediately for faster scrolling (non-blocking)
        if (
            APP_CONFIG.PREFETCH_NEXT_PAGE &&
            result?.ok &&
            !result?.skipped &&
            !state.done &&
            !result?.aborted
        ) {
            // Schedule prefetch after current microtask to not block initial render
            queueMicrotask(() => {
                if (!state.done && !state.loading) {
                    loadNextPage().catch(() => {/* ignore prefetch errors */});
                }
            });
        }

        if (reset) {
            finalizeLoad({ title: safeQuery });
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
        const { title = "Collection", reset = true, showLoading = true } = options || {};
        const gridContainer = getGridContainer();
        if (!gridContainer) {
            return { ok: false, error: "Grid unavailable" };
        }

        const list = Array.isArray(assets) ? assets.slice() : [];
        const loadingStartedAt = Date.now();

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
            resetAssets({
                query: String(title || "Collection"),
                total: list.length,
                done: true,
            });
            resetAssetCollectionsState(state);
            clearStatusMessage();
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
        clearPendingUpserts();
        clearLoadingMessage();
        clearStatusMessage();
        resetAssets({ query: state.query || "*", total: null, done: false });
        resetAssetCollectionsState(state);
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
        if (Array.isArray(state.assets) && state.assets.length) {
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
        finalizeLoad({ title: snapshot.title || options.title || "Cached" });
        return true;
    }

    function upsertAsset(asset) {
        const gridContainer = getGridContainer();
        if (!gridContainer || !asset || !asset.id) return false;
        return queueUpsertAsset(gridContainer, asset, {
            getOrCreateState: () => state,
            ensureVirtualGrid: () => state.virtualGrid,
            upsertState: UPSERT_BATCH_STATE,
            maxBatchSize: UPSERT_BATCH_MAX_SIZE,
            debounceMs: UPSERT_BATCH_DEBOUNCE_MS,
            assetKey: (asset) => assetKey(asset, gridContainer),
            loadMajoorSettings,
        });
    }

    function dispose() {
        rememberSnapshot(state.query || "Cached");
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
        dispose,
    };
}
