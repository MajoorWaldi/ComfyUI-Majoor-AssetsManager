/**
 * useVirtualGrid.js - unified virtualization module for the Vue migration.
 *
 * This centralizes virtualization helpers that were previously split
 * across VirtualScroller.js and InfiniteScroll.js.
 */
import { getFilenameKey, shouldHideSiblingAsset, unregisterHiddenSibling } from "../../features/grid/AssetCardRenderer.js";
import {
    gridQueryHasActiveFilters,
    readGridQueryFromDataset,
} from "../grid/useGridQuery.js";
import { syncAssetCollectionState } from "../grid/useAssetCollection.js";
import { resolvePageAdvance } from "../grid/usePagedAssets.js";

export function isPotentialScrollContainer(el) {
    if (!el || el === window) return false;
    if (el === document.body || el === document.documentElement) return false;
    try {
        const style = window.getComputedStyle(el);
        const overflowY = String(style?.overflowY || "");
        if (!/(auto|scroll|overlay)/.test(overflowY)) return false;
        const clientH = Number(el.clientHeight) || 0;
        if (clientH <= 0) return false;
        return true;
    } catch {
        return false;
    }
}

export function detectScrollRoot(gridContainer) {
    try {
        const browse = gridContainer?.closest?.(".mjr-am-browse") || null;
        if (browse && isPotentialScrollContainer(browse)) return browse;
    } catch (e) {
        console.debug?.(e);
    }
    try {
        let cur = gridContainer?.parentElement;
        while (cur && cur !== document.body && cur !== document.documentElement) {
            if (isPotentialScrollContainer(cur)) return cur;
            cur = cur.parentElement;
        }
    } catch (e) {
        console.debug?.(e);
    }
    return gridContainer?.parentElement || null;
}

export function getScrollContainer(gridContainer, state) {
    try {
        const cur = state?.scrollRoot;
        if (cur && cur instanceof HTMLElement) return cur;
    } catch (e) {
        console.debug?.(e);
    }
    const detected = detectScrollRoot(gridContainer);
    if (detected && state) state.scrollRoot = detected;
    return detected;
}

export function ensureVirtualGrid(gridContainer, state, deps) {
    if (state.virtualGrid) {
        // Guard: a disposed instance has its DOM detached; discard it so a fresh one is created.
        if (state.virtualGrid._disposed) {
            state.virtualGrid = null;
        } else {
            return state.virtualGrid;
        }
    }
    const scrollRoot = getScrollContainer(gridContainer, state);
    try {
        deps.gridDebug("virtualGrid:scrollRoot", {
            scrollRoot:
                scrollRoot === document.body
                    ? "document.body"
                    : scrollRoot === document.documentElement
                      ? "document.documentElement"
                      : scrollRoot?.className || scrollRoot?.tagName || null,
        });
    } catch (e) {
        console.debug?.(e);
    }
    state.virtualGrid = new deps.VirtualGrid(gridContainer, scrollRoot, deps.optionsFactory());
    if (!state._cardKeydownHandler) {
        const handler = (event) => {
            try {
                if (!event?.key) return;
                if (event.key !== "Enter" && event.key !== " ") return;
                const card = event.target?.closest?.(".mjr-asset-card");
                if (!card) return;
                event.preventDefault();
                card.click();
            } catch (e) {
                console.debug?.(e);
            }
        };
        state._cardKeydownHandler = handler;
        gridContainer.addEventListener("keydown", handler, true);
    }
    return state.virtualGrid;
}

export function ensureSentinel(gridContainer, state, sentinelClass) {
    let sentinel = state.sentinel;
    if (
        sentinel &&
        sentinel.isConnected &&
        sentinel.parentNode === gridContainer &&
        !sentinel.nextSibling
    )
        return sentinel;
    if (sentinel) {
        sentinel.remove();
    } else {
        sentinel = document.createElement("div");
        sentinel.className = sentinelClass;
        sentinel.style.cssText =
            "height: 1px; width: 100%; position: absolute; bottom: 0; left: 0; pointer-events: none; z-index: -10;";
        state.sentinel = sentinel;
    }
    gridContainer.appendChild(sentinel);
    if (state.observer) {
        try {
            state.observer.observe(sentinel);
        } catch (e) {
            console.debug?.(e);
        }
    }
    return sentinel;
}

export function stopObserver(state, gridContainer = null) {
    try {
        if (state.observer) state.observer.disconnect();
    } catch (e) {
        console.debug?.(e);
    }
    state.observer = null;
    try {
        if (state.sentinel && state.sentinel.isConnected) state.sentinel.remove();
    } catch (e) {
        console.debug?.(e);
    }
    state.sentinel = null;
    try {
        if (state.scrollTarget && state.scrollHandler) {
            state.scrollTarget.removeEventListener("scroll", state.scrollHandler);
        }
    } catch (e) {
        console.debug?.(e);
    }
    state.scrollRoot = null;
    state.scrollTarget = null;
    state.scrollHandler = null;
    state.ignoreNextScroll = false;
    state.userScrolled = false;
    state.allowUntilFilled = true;
    if (gridContainer && state._cardKeydownHandler) {
        try {
            gridContainer.removeEventListener("keydown", state._cardKeydownHandler, true);
        } catch (e) {
            console.debug?.(e);
        }
        state._cardKeydownHandler = null;
    }
}

export function captureScrollMetrics(state) {
    const root = state?.scrollRoot;
    if (!root) return null;
    try {
        if (!root.isConnected) return null;
    } catch (e) {
        console.debug?.(e);
    }
    const clientHeight = Number(root.clientHeight) || 0;
    if (clientHeight <= 0) return null;
    const scrollHeight = Number(root.scrollHeight) || 0;
    const scrollTop = Number(root.scrollTop) || 0;
    const bottomGap = scrollHeight - (scrollTop + clientHeight);
    return { clientHeight, scrollHeight, scrollTop, bottomGap };
}

export function maybeKeepPinnedToBottom(_state, _before) {
    return;
}

export function resolvePageAdvanceCount({ count = 0, limit = 0, offset = 0, total = null } = {}) {
    return resolvePageAdvance({ count, limit, offset, total });
}

export function startInfiniteScroll(gridContainer, state, deps) {
    if (!deps.config.INFINITE_SCROLL_ENABLED) return;
    stopObserver(state);
    const sentinel = ensureSentinel(gridContainer, state, deps.sentinelClass);
    let rootEl;
    try {
        rootEl = state?.virtualGrid?.scrollElement || null;
    } catch {
        rootEl = null;
    }
    if (!rootEl) rootEl = getScrollContainer(gridContainer, state);
    if (!rootEl || !(rootEl instanceof HTMLElement)) {
        deps.gridDebug("infiniteScroll:disabled", { reason: "no scroll container" });
        return;
    }
    state.scrollRoot = rootEl;
    state.userScrolled = false;
    const scrollTarget = rootEl;
    state.scrollTarget = scrollTarget;
    deps.gridDebug("infiniteScroll:setup", {
        rootEl: rootEl?.className || rootEl?.tagName || null,
        scrollTarget: scrollTarget?.className || scrollTarget?.tagName || null,
        rootMargin: deps.config.INFINITE_SCROLL_ROOT_MARGIN || "800px",
        threshold: deps.config.INFINITE_SCROLL_THRESHOLD ?? 0.01,
        offset: Number(state?.offset || 0) || 0,
        done: !!state?.done,
    });
    if (scrollTarget && !state.scrollHandler) {
        state.scrollHandler = () => {
            if (state.ignoreNextScroll) {
                state.ignoreNextScroll = false;
                return;
            }
            state.userScrolled = true;
            try {
                if (state.loading || state.done || state.allowUntilFilled) return;
                const m = captureScrollMetrics(state);
                const bottomGapPx = Math.max(0, Number(deps.config.BOTTOM_GAP_PX || 80));
                if (m && m.bottomGap <= bottomGapPx) {
                    Promise.resolve(deps.loadNextPage(gridContainer, state)).catch(() => null);
                }
            } catch (e) {
                console.debug?.(e);
            }
        };
        try {
            scrollTarget.addEventListener("scroll", state.scrollHandler, { passive: true });
        } catch (e) {
            console.debug?.(e);
        }
    }
    const observerRoot = rootEl;
    state.observer = new IntersectionObserver(
        (entries) => {
            for (const entry of entries || []) {
                if (!entry.isIntersecting) continue;
                if (state.loading || state.done) return;
                const metrics = captureScrollMetrics(state);
                if (!metrics) return;
                const fillsViewport = metrics
                    ? metrics.scrollHeight > metrics.clientHeight + 40
                    : false;
                if (!state.userScrolled && fillsViewport && !state.allowUntilFilled) return;
                try {
                    state.observer?.unobserve?.(sentinel);
                } catch (e) {
                    console.debug?.(e);
                }
                state.userScrolled = false;
                if (fillsViewport) state.allowUntilFilled = false;
                Promise.resolve(deps.loadNextPage(gridContainer, state))
                    .catch(() => null)
                    .finally(() => {
                        if (state.done) return;
                        if (!sentinel.isConnected) return;
                        try {
                            state.observer?.observe?.(sentinel);
                        } catch (e) {
                            console.debug?.(e);
                        }
                    });
            }
        },
        {
            root: observerRoot,
            rootMargin: deps.config.INFINITE_SCROLL_ROOT_MARGIN || "800px",
            threshold: deps.config.INFINITE_SCROLL_THRESHOLD ?? 0.01,
        },
    );
    state.observer.observe(sentinel);
}


function _assetMatchesActiveFilters(gridContainer, asset) {
    if (!asset || typeof asset !== "object") return false;
    const query = readGridQueryFromDataset(gridContainer?.dataset || {});
    const scope = query.scope;
    const subfolder = query.subfolder.toLowerCase();
    const kind = query.kind;
    const workflowOnly = query.workflowOnly;
    const minRating = query.minRating;
    const workflowType = query.workflowType.toLowerCase();
    const dateExact = query.dateExact;
    const assetSubfolder = String(asset?.subfolder || "").trim().toLowerCase();
    const assetType = String(asset?.type || asset?.source || "output")
        .trim()
        .toLowerCase();
    const assetKind = String(asset?.kind || "").trim().toLowerCase();
    const assetWorkflowType = String(asset?.workflow_type || asset?.workflowType || "")
        .trim()
        .toLowerCase();
    const assetDate = String(asset?.date_exact || asset?.date || "").trim();
    const hasWorkflow = asset?.has_workflow ?? asset?.hasWorkflow ?? null;

    if (scope && scope !== "all" && assetType && assetType !== scope) return false;
    if (subfolder && assetSubfolder !== subfolder) return false;
    if (kind && assetKind && assetKind !== kind) return false;
    // Treat null/undefined has_workflow as "pending" (enrichment in progress)
    // so freshly generated assets are not rejected by the workflow-only filter.
    // Only reject when has_workflow is explicitly false/0.
    if (workflowOnly && hasWorkflow !== null && !hasWorkflow) return false;
    if (minRating > 0 && (Number(asset?.rating || 0) || 0) < minRating) return false;
    if (workflowType && assetWorkflowType !== workflowType) return false;
    if (dateExact && assetDate && assetDate !== dateExact) return false;

    return true;
}

export async function fetchPage(
    gridContainer,
    query,
    limit,
    offset,
    deps,
    { requestId = 0, signal = null, cursor = null } = {},
) {
    const coerceQueryText = (value) => {
        if (typeof value === "string") return value;
        if (value && typeof value === "object") {
            if (typeof value.value === "string") return value.value;
            if (typeof value.target?.value === "string") return value.target.value;
        }
        return String(value || "");
    };

    const queryState = readGridQueryFromDataset(gridContainer?.dataset || {});
    const {
        scope,
        customRootId,
        subfolder,
        kind,
        workflowOnly,
        minRating,
        minSizeMB,
        maxSizeMB,
        resolutionCompare,
        minWidth,
        minHeight,
        maxWidth,
        maxHeight,
        workflowType,
        dateRange,
        dateExact,
        groupStacks,
    } = queryState;
    const sortKey = queryState.sort || "mtime_desc";
    const requestedQueryRaw = coerceQueryText(query).trim();
    const requestedQuery = requestedQueryRaw || "*";
    const normalizedRequestedQuery = /^\[object\s+HTML.*Element\]$/i.test(requestedQuery)
        ? "*"
        : requestedQuery;
    const safeQuery = deps.sanitizeQuery(normalizedRequestedQuery) || normalizedRequestedQuery;
    try {
        const isOutputScope = String(scope || "").toLowerCase() === "output";
        const hasActiveFilters = gridQueryHasActiveFilters({
            ...queryState,
            q: safeQuery,
        });
        const isDefaultOutputBrowse =
            isOutputScope &&
            Number(offset ?? 0) === 0 &&
            safeQuery === "*" &&
            !hasActiveFilters &&
            String(sortKey || "mtime_desc").toLowerCase() === "mtime_desc";
        const includeTotal = !(isOutputScope && (Number(offset ?? 0) > 0 || isDefaultOutputBrowse));
        const cursorForRequest = Number(offset ?? 0) > 0 ? null : cursor || null;
        const url = deps.buildListURL({
            q: safeQuery,
            limit,
            offset,
            scope,
            subfolder,
            customRootId: customRootId || null,
            kind: kind || null,
            hasWorkflow: workflowOnly ? true : null,
            minRating: minRating > 0 ? minRating : null,
            minSizeMB: minSizeMB > 0 ? minSizeMB : null,
            maxSizeMB: maxSizeMB > 0 ? maxSizeMB : null,
            resolutionCompare,
            minWidth: minWidth > 0 ? minWidth : null,
            minHeight: minHeight > 0 ? minHeight : null,
            maxWidth: maxWidth > 0 ? maxWidth : null,
            maxHeight: maxHeight > 0 ? maxHeight : null,
            workflowType: workflowType || null,
            dateRange: dateRange || null,
            dateExact: dateExact || null,
            sort: sortKey,
            cursor: cursorForRequest,
            includeTotal,
            groupStacks,
        });
        const result = await deps.get(url, { timeoutMs: 120_000, ...(signal ? { signal } : {}) });
        try {
            const state = deps.getGridState(gridContainer);
            if (state && Number(state.requestId) !== Number(requestId)) {
                return { ok: false, stale: true, error: "Stale response" };
            }
        } catch (e) {
            console.debug?.(e);
        }
        if (result.ok) {
            const assets = result.data?.assets || [];
            const serverCount = Array.isArray(assets) ? assets.length : 0;
            const rawTotal = result.data?.total;
            const total = rawTotal == null ? null : Number(rawTotal ?? 0) || 0;
            const responseLimit = Math.max(0, Number(result.data?.limit) || 0);
            const responseOffset = Math.max(0, Number(result.data?.offset) || 0);
            const nextCursor = result.data?.next_cursor || result.data?.nextCursor || null;
            const hasMore = typeof result.data?.has_more === "boolean" ? result.data.has_more : null;
            return {
                ok: true,
                assets,
                total,
                count: serverCount,
                limit: responseLimit,
                offset: responseOffset,
                nextCursor,
                hasMore,
                sortKey,
                safeQuery,
            };
        }
        try {
            if (String(result?.code || "") === "ABORTED")
                return { ok: false, aborted: true, error: "Aborted" };
        } catch (e) {
            console.debug?.(e);
        }
        return { ok: false, error: result.error };
    } catch (error) {
        try {
            if (String(error?.name || "") === "AbortError")
                return { ok: false, aborted: true, error: "Aborted" };
        } catch (e) {
            console.debug?.(e);
        }
        return { ok: false, error: error.message };
    }
}

export function emitAgendaStatus(dateExact, hasResults) {
    if (!dateExact) return;
    try {
        window?.dispatchEvent?.(
            new CustomEvent("MJR:AgendaStatus", {
                detail: { date: dateExact, hasResults: Boolean(hasResults) },
            }),
        );
    } catch (e) {
        console.debug?.(e);
    }
}

export async function loadNextPage(gridContainer, state, deps) {
    if (state.loading || state.done) return;
    const limit = Math.max(1, Math.min(deps.config.MAX_PAGE_SIZE, deps.config.DEFAULT_PAGE_SIZE));
    state.loading = true;
    const before = deps.captureScrollMetrics(state);
    deps.gridDebug("loadNextPage:start", {
        q: String(state?.query || ""),
        limit,
        offset: Number(state?.offset ?? 0) || 0,
    });
    try {
        const page = await fetchPage(gridContainer, state.query, limit, state.offset, deps, {
            requestId: Number(state.requestId ?? 0) || 0,
            signal: state.abortController?.signal || null,
        });
        const dateExact = readGridQueryFromDataset(gridContainer?.dataset || {}).dateExact;
        emitAgendaStatus(
            dateExact,
            page.ok && Array.isArray(page.assets) && page.assets.length > 0,
        );
        if (!page.ok) {
            if (page.aborted || page.stale) return;
            state.done = true;
            deps.stopObserver(state);
            return;
        }
        if (page.total != null) state.total = page.total;
        const added = deps.appendAssets(gridContainer, page.assets || [], state);
        const consumedCount = resolvePageAdvanceCount({
            count: page.count,
            limit: page.limit || limit,
            offset: state.offset,
            total: page.total != null ? page.total : state.total,
        });
        state.offset += consumedCount;
        deps.gridDebug("loadNextPage:append", { added, offset: state.offset });
        deps.maybeKeepPinnedToBottom(state, before);
        const knownTotal = Number(state.total);
        if (
            consumedCount <= 0 ||
            (Number.isFinite(knownTotal) && knownTotal > 0 && state.offset >= knownTotal)
        ) {
            state.done = true;
            deps.stopObserver(state);
        }
    } finally {
        state.loading = false;
    }
}

export function getSortValue(asset, sortKey) {
    switch (sortKey) {
        case "mtime_desc":
            // Negate so that larger mtime (newer) sorts first in ascending numeric order.
            return -(Number(asset?.mtime) || 0);
        case "mtime_asc":
            return Number(asset?.mtime) || 0;
        case "name_asc":
        case "name_desc":
            return String(asset?.filename || "").toLowerCase();
        default:
            // Default to newest-first (descending mtime) via negation.
            return -(Number(asset?.mtime) || 0);
    }
}

export function compareAssets(a, b, sortKey) {
    if (sortKey === "name_desc") {
        // Reverse the natural string order for descending name sort.
        const av = String(a?.filename || "").toLowerCase();
        const bv = String(b?.filename || "").toLowerCase();
        if (av > bv) return -1;
        if (av < bv) return 1;
        return 0;
    }
    // For mtime sorts, getSortValue already negates desc values,
    // so a plain ascending compare yields the correct order.
    const av = getSortValue(a, sortKey);
    const bv = getSortValue(b, sortKey);
    if (av < bv) return -1;
    if (av > bv) return 1;
    return 0;
}

export function shouldInsertBefore(assetValue, cardValue, sortKey) {
    if (sortKey === "name_asc") return String(assetValue) < String(cardValue);
    if (sortKey === "name_desc") return String(assetValue) > String(cardValue);
    return Number(assetValue) < Number(cardValue);
}

export function findInsertPosition(array, asset, sortKey) {
    const assetValue = getSortValue(asset, sortKey);
    for (let i = 0; i < array.length; i++) {
        const arrValue = getSortValue(array[i], sortKey);
        if (shouldInsertBefore(assetValue, arrValue, sortKey)) return i;
    }
    return array.length;
}

export function findAssetElement(gridContainer, assetId) {
    const escaped = _safeEscape(String(assetId));
    return gridContainer.querySelector(`[data-mjr-asset-id="${escaped}"]`);
}

function _safeEscape(value) {
    try {
        return CSS?.escape
            ? CSS.escape(value)
            : value.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, "\\$1");
    } catch {
        return value.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, "\\$1");
    }
}

export function getUpsertBatchState(gridContainer, upsertState) {
    let s = upsertState.get(gridContainer);
    if (!s) {
        s = { pending: new Map(), timer: null, flushing: false };
        upsertState.set(gridContainer, s);
    }
    return s;
}

function _normalizeAssetIdentityPart(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase();
}

function _isLivePlaceholderAsset(asset) {
    return (
        asset?._mjrLivePlaceholder === true ||
        asset?.is_live_placeholder === true ||
        String(asset?.id || "")
            .trim()
            .toLowerCase()
            .startsWith("live:")
    );
}

function _clearLivePlaceholderState(asset) {
    if (!asset || typeof asset !== "object") return asset;
    try {
        delete asset._mjrLivePlaceholder;
        delete asset._mjrLiveStatus;
        delete asset._mjrLiveLabel;
        delete asset.is_live_placeholder;
    } catch (e) {
        console.debug?.(e);
    }
    return asset;
}

function _getAssetIdentityKey(asset) {
    if (!asset || typeof asset !== "object") return "";
    const type = _normalizeAssetIdentityPart(asset?.type || asset?.source || "output");
    const rootId = _normalizeAssetIdentityPart(asset?.root_id || asset?.custom_root_id || "");
    const subfolder = _normalizeAssetIdentityPart(asset?.subfolder || "");
    const filename = _normalizeAssetIdentityPart(asset?.filename || "");
    if (filename) return `${type}|${rootId}|${subfolder}|${filename}`;
    const filepath = _normalizeAssetIdentityPart(
        asset?.filepath || asset?.path || asset?.fullpath || asset?.full_path || "",
    );
    if (!filepath) return "";
    return `${type}|${rootId}|path|${filepath}`;
}

function _findExistingAssetIndex(state, assetId, candidateAsset) {
    const list = Array.isArray(state?.assets) ? state.assets : [];
    if (assetId) {
        const exactIndex = list.findIndex((asset) => String(asset?.id || "") === assetId);
        if (exactIndex > -1) return exactIndex;
    }
    const identityKey = _getAssetIdentityKey(candidateAsset);
    if (!identityKey) return -1;
    return list.findIndex((asset) => _getAssetIdentityKey(asset) === identityKey);
}

function _shouldKeepExistingAssetOnFilterMismatch(incomingAsset, existingAsset) {
    if (!existingAsset || typeof existingAsset !== "object") return false;
    if (!incomingAsset || typeof incomingAsset !== "object") return false;
    if (_isLivePlaceholderAsset(existingAsset)) return true;
    const protectedFields = [
        "filename",
        "filepath",
        "path",
        "fullpath",
        "full_path",
        "subfolder",
        "type",
        "source",
        "root_id",
        "custom_root_id",
        "kind",
        "rating",
        "workflow_type",
        "workflowType",
        "date_exact",
        "date",
    ];
    return !protectedFields.some((field) => Object.prototype.hasOwnProperty.call(incomingAsset, field));
}

function dedupeAssetsByKey(state, deps) {
    const seenIds = new Set();
    const seenKeys = new Set();
    const filenamePrimary = new Map();
    const deduped = [];
    for (const asset of Array.isArray(state?.assets) ? state.assets : []) {
        const assetId = asset?.id != null ? String(asset.id) : "";
        const key = deps.assetKey(asset);
        const filenameKey = getFilenameKey(asset?.filename);
        if (assetId && seenIds.has(assetId)) continue;
        if (key && seenKeys.has(key)) continue;

        if (filenameKey) {
            const primary = filenamePrimary.get(filenameKey);
            if (primary) {
                const prevMembers = Array.isArray(primary._mjrDupMembers) ? primary._mjrDupMembers : [primary];
                const prevIds = new Set(prevMembers.map((a) => String(a?.id || "")));
                const merged = [
                    ...prevMembers,
                    ...[asset].filter((a) => !prevIds.has(String(a?.id || ""))),
                ];
                primary._mjrDupStack = true;
                primary._mjrDupMembers = merged;
                primary._mjrDupCount = merged.length;
                primary._mjrNameCollision = false;
                delete primary._mjrNameCollisionCount;
                delete primary._mjrNameCollisionPaths;

                asset._mjrNameCollision = false;
                delete asset._mjrNameCollisionCount;
                delete asset._mjrNameCollisionPaths;
                asset._mjrDupStack = false;
                asset._mjrDupMembers = null;
                asset._mjrDupCount = 0;
                continue;
            }
        }

        if (assetId) seenIds.add(assetId);
        if (key) seenKeys.add(key);
        if (filenameKey) filenamePrimary.set(filenameKey, asset);

        asset._mjrNameCollision = false;
        delete asset._mjrNameCollisionCount;
        delete asset._mjrNameCollisionPaths;
        deduped.push(asset);
    }
    state.assets = deduped;
    syncAssetCollectionState(state, { assetKey: deps.assetKey });
}

/**
 * Flush all pending upsert operations into the grid.
 *
 * Concurrency guard: `batchState.flushing` prevents re-entrant flushes.
 * Items arriving during a flush are accumulated in `batchState.pending` and
 * a follow-up flush is scheduled in the `finally` block (BUG-01).
 */
export function flushUpsertBatch(gridContainer, deps) {
    const batchState = deps.upsertState.get(gridContainer);
    if (!batchState || batchState.pending.size === 0 || batchState.flushing) return;
    batchState.flushing = true;
    if (batchState.timer) {
        clearTimeout(batchState.timer);
        batchState.timer = null;
    }
    // Snapshot the current batch so items arriving during the flush are not lost (BUG-01).
    const snapshot = new Map(batchState.pending);
    for (const key of snapshot.keys()) batchState.pending.delete(key);
    const state = deps.getOrCreateState(gridContainer);
    const vg = deps.ensureVirtualGrid(gridContainer, state);
    try {
        let modified = false;
        for (const [assetId, asset] of snapshot.entries()) {
            const incomingIsPlaceholder = _isLivePlaceholderAsset(asset);
            state.assetKeyFn = deps.assetKey;
            const siblingCheck = shouldHideSiblingAsset(asset, state, deps.loadMajoorSettings);
            if (Array.isArray(siblingCheck?.removed) && siblingCheck.removed.length) {
                const removedSet = new Set(siblingCheck.removed);
                state.assets = state.assets.filter((item) => {
                    const keep = !removedSet.has(item);
                    if (!keep) {
                        unregisterHiddenSibling(state, item, state);
                    }
                    return keep;
                });
                try {
                    state.hiddenPngSiblings =
                        (Number(state.hiddenPngSiblings || 0) || 0) + siblingCheck.removed.length;
                } catch (e) {
                    console.debug?.(e);
                }
                modified = true;
            }
            if (siblingCheck?.hidden) {
                try {
                    state.hiddenPngSiblings = (Number(state.hiddenPngSiblings || 0) || 0) + 1;
                } catch (e) {
                    console.debug?.(e);
                }
                continue;
            }
            const existingIndex = state.assets.findIndex((a) => String(a.id) === assetId);
            const existingAsset = existingIndex > -1 ? state.assets[existingIndex] : null;
            const candidateAsset = existingAsset ? { ...existingAsset, ...asset } : asset;
            const resolvedExistingIndex =
                existingIndex > -1
                    ? existingIndex
                    : _findExistingAssetIndex(state, assetId, candidateAsset);
            const resolvedExistingAsset =
                resolvedExistingIndex > -1 ? state.assets[resolvedExistingIndex] : null;
            const mergedCandidate = resolvedExistingAsset
                ? { ...resolvedExistingAsset, ...asset }
                : candidateAsset;
            const key = deps.assetKey(candidateAsset);
            const matchesFilters = _assetMatchesActiveFilters(gridContainer, mergedCandidate);
            if (!matchesFilters) {
                if (resolvedExistingIndex > -1) {
                    if (_shouldKeepExistingAssetOnFilterMismatch(asset, resolvedExistingAsset)) {
                        Object.assign(resolvedExistingAsset, asset);
                        if (!incomingIsPlaceholder) {
                            _clearLivePlaceholderState(resolvedExistingAsset);
                        }
                        state.assets[resolvedExistingIndex] = { ...resolvedExistingAsset };
                        modified = true;
                        continue;
                    }
                    const [removedAsset] = state.assets.splice(resolvedExistingIndex, 1);
                    unregisterHiddenSibling(state, removedAsset, state);
                    modified = true;
                }
                continue;
            }
            if (resolvedExistingIndex > -1) {
                const previousKey = deps.assetKey(resolvedExistingAsset);
                Object.assign(resolvedExistingAsset, asset);
                if (!incomingIsPlaceholder) {
                    _clearLivePlaceholderState(resolvedExistingAsset);
                }
                const mergedAsset = { ...resolvedExistingAsset };
                const nextKey = deps.assetKey(mergedAsset);
                state.assets[resolvedExistingIndex] = mergedAsset;
                if (previousKey && previousKey !== nextKey) {
                    state.seenKeys?.delete?.(previousKey);
                    if (nextKey) state.seenKeys?.add?.(nextKey);
                }
                modified = true;
            } else {
                const alreadySeen =
                    state.seenKeys.has(key) ||
                    (asset.id != null && state.assetIdSet?.has?.(assetId));
                if (!alreadySeen) {
                    const sortKey = readGridQueryFromDataset(gridContainer?.dataset || {}).sort || "mtime_desc";
                    const assetToInsert = incomingIsPlaceholder
                        ? candidateAsset
                        : _clearLivePlaceholderState({ ...candidateAsset });
                    const insertPos = findInsertPosition(state.assets, assetToInsert, sortKey);
                    state.seenKeys.add(key);
                    if (asset.id != null) state.assetIdSet?.add?.(assetId);
                    state.assets.splice(insertPos, 0, assetToInsert); // findInsertPosition never returns -1
                    modified = true;
                }
            }
        }
        if (modified && vg) {
            dedupeAssetsByKey(state, deps);
            try {
                gridContainer.dataset.mjrHiddenPngSiblings = String(
                    Number(state.hiddenPngSiblings || 0) || 0,
                );
            } catch (e) {
                console.debug?.(e);
            }
            vg.setItems(state.assets);
        }
    } finally {
        batchState.flushing = false;
        // Items may have arrived during the flush — reschedule if needed (BUG-01).
        // Use a short delay (1 frame) instead of the full debounce so rapid
        // generation events chain quickly instead of waiting 200 ms between
        // each visible card insertion.
        if (batchState.pending.size > 0 && !batchState.timer) {
            const followUpDelay = Math.min(16, deps.debounceMs);
            batchState.timer = setTimeout(() => {
                batchState.timer = null;
                flushUpsertBatch(gridContainer, deps);
            }, followUpDelay);
        }
    }
}

export function upsertAsset(gridContainer, asset, deps) {
    if (!asset || !asset.id) return false;
    const state = deps.getOrCreateState(gridContainer);
    const assetId = String(asset.id);
    const vg = deps.ensureVirtualGrid(gridContainer, state);
    if (!vg) return false;
    const batchState = getUpsertBatchState(gridContainer, deps.upsertState);
    batchState.pending.set(assetId, asset);
    if (batchState.pending.size >= deps.maxBatchSize) {
        flushUpsertBatch(gridContainer, deps);
    } else if (!batchState.timer && !batchState.flushing) {
        batchState.timer = setTimeout(() => {
            batchState.timer = null;
            flushUpsertBatch(gridContainer, deps);
        }, deps.debounceMs);
    }
    return true;
}
