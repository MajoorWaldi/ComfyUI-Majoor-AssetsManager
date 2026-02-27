/** Infinite scroll / upsert helpers extracted from GridView_impl.js (P3-B-05). */

export async function fetchPage(gridContainer, query, limit, offset, deps, { requestId = 0, signal = null } = {}) {
    const scope = gridContainer?.dataset?.mjrScope || "output";
    const customRootId = gridContainer?.dataset?.mjrCustomRootId || "";
    const subfolder = gridContainer?.dataset?.mjrSubfolder || "";
    const kind = gridContainer?.dataset?.mjrFilterKind || "";
    const workflowOnly = gridContainer?.dataset?.mjrFilterWorkflowOnly === "1";
    const minRating = Number(gridContainer?.dataset?.mjrFilterMinRating || 0) || 0;
    const minSizeMB = Number(gridContainer?.dataset?.mjrFilterMinSizeMB || 0) || 0;
    const maxSizeMB = Number(gridContainer?.dataset?.mjrFilterMaxSizeMB || 0) || 0;
    const resolutionCompare = String(gridContainer?.dataset?.mjrFilterResolutionCompare || "gte") === "lte" ? "lte" : "gte";
    const minWidth = Number(gridContainer?.dataset?.mjrFilterMinWidth || 0) || 0;
    const minHeight = Number(gridContainer?.dataset?.mjrFilterMinHeight || 0) || 0;
    const maxWidth = Number(gridContainer?.dataset?.mjrFilterMaxWidth || 0) || 0;
    const maxHeight = Number(gridContainer?.dataset?.mjrFilterMaxHeight || 0) || 0;
    const workflowType = String(gridContainer?.dataset?.mjrFilterWorkflowType || "").trim().toUpperCase();
    const dateRange = String(gridContainer?.dataset?.mjrFilterDateRange || "").trim().toLowerCase();
    const dateExact = String(gridContainer?.dataset?.mjrFilterDateExact || "").trim();
    const sortKey = gridContainer?.dataset?.mjrSort || "mtime_desc";
    const requestedQuery = query && query.trim() ? query : "*";
    const safeQuery = deps.sanitizeQuery(requestedQuery) || requestedQuery;
    try {
        const includeTotal = !(String(scope || "").toLowerCase() === "output" && Number(offset || 0) > 0);
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
            includeTotal,
        });
        const result = await deps.get(url, signal ? { signal } : undefined);
        try {
            const state = deps.getGridState(gridContainer);
            if (state && Number(state.requestId) !== Number(requestId)) {
                return { ok: false, stale: true, error: "Stale response" };
            }
        } catch (e) { console.debug?.(e); }
        if (result.ok) {
            const assets = (result.data?.assets) || [];
            const serverCount = Array.isArray(assets) ? assets.length : 0;
            const rawTotal = result.data?.total;
            const total = rawTotal == null ? null : (Number(rawTotal || 0) || 0);
            return { ok: true, assets, total, count: serverCount, sortKey, safeQuery };
        }
        try {
            if (String(result?.code || "") === "ABORTED") return { ok: false, aborted: true, error: "Aborted" };
        } catch (e) { console.debug?.(e); }
        return { ok: false, error: result.error };
    } catch (error) {
        try {
            if (String(error?.name || "") === "AbortError") return { ok: false, aborted: true, error: "Aborted" };
        } catch (e) { console.debug?.(e); }
        return { ok: false, error: error.message };
    }
}

export function emitAgendaStatus(dateExact, hasResults) {
    if (!dateExact) return;
    try {
        window?.dispatchEvent?.(new CustomEvent("MJR:AgendaStatus", { detail: { date: dateExact, hasResults: Boolean(hasResults) } }));
    } catch (e) { console.debug?.(e); }
}

export async function loadNextPage(gridContainer, state, deps) {
    if (state.loading || state.done) return;
    const limit = Math.max(1, Math.min(deps.config.MAX_PAGE_SIZE, deps.config.DEFAULT_PAGE_SIZE));
    state.loading = true;
    const before = deps.captureScrollMetrics(state);
    deps.gridDebug("loadNextPage:start", {
        q: String(state?.query || ""),
        limit,
        offset: Number(state?.offset || 0) || 0,
    });
    try {
        const page = await fetchPage(gridContainer, state.query, limit, state.offset, deps, {
            requestId: Number(state.requestId) || 0,
            signal: state.abortController?.signal || null,
        });
        const dateExact = String(gridContainer?.dataset?.mjrFilterDateExact || "").trim();
        emitAgendaStatus(dateExact, page.ok && Array.isArray(page.assets) && page.assets.length > 0);
        if (!page.ok) {
            if (page.aborted || page.stale) return;
            state.done = true;
            deps.stopObserver(state);
            return;
        }
        if (page.total != null) state.total = page.total;
        const added = deps.appendAssets(gridContainer, page.assets || [], state);
        state.offset += (page.count || 0);
        deps.gridDebug("loadNextPage:append", { added, offset: state.offset });
        deps.maybeKeepPinnedToBottom(state, before);
        if ((page.count || 0) === 0) {
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
            return -(Number(asset?.mtime) || 0);
        case "mtime_asc":
            return Number(asset?.mtime) || 0;
        case "name_asc":
        case "name_desc":
            return String(asset?.filename || "").toLowerCase();
        default:
            return -(Number(asset?.mtime) || 0);
    }
}

export function compareAssets(a, b, sortKey) {
    if (sortKey === "name_desc") {
        const av = String(a?.filename || "").toLowerCase();
        const bv = String(b?.filename || "").toLowerCase();
        if (av > bv) return -1;
        if (av < bv) return 1;
        return 0;
    }
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
    return gridContainer.querySelector(`[data-mjr-asset-id="${CSS.escape ? CSS.escape(String(assetId)) : String(assetId)}"]`);
}

export function getUpsertBatchState(gridContainer, upsertState) {
    let s = upsertState.get(gridContainer);
    if (!s) {
        s = { pending: new Map(), timer: null, flushing: false };
        upsertState.set(gridContainer, s);
    }
    return s;
}

export function flushUpsertBatch(gridContainer, deps) {
    const batchState = deps.upsertState.get(gridContainer);
    if (!batchState || batchState.pending.size === 0 || batchState.flushing) return;
    batchState.flushing = true;
    if (batchState.timer) {
        clearTimeout(batchState.timer);
        batchState.timer = null;
    }
    const state = deps.getOrCreateState(gridContainer);
    const vg = deps.ensureVirtualGrid(gridContainer, state);
    try {
        let modified = false;
        for (const [assetId, asset] of batchState.pending.entries()) {
            const key = deps.assetKey(asset);
            const existingIndex = state.assets.findIndex((a) => String(a.id) === assetId);
            if (existingIndex > -1) {
                const existingAsset = state.assets[existingIndex];
                Object.assign(existingAsset, asset);
                state.assets[existingIndex] = { ...existingAsset };
                modified = true;
            } else {
                const alreadySeen = state.seenKeys.has(key) || (asset.id != null && state.assetIdSet?.has?.(assetId));
                if (!alreadySeen) {
                    const sortKey = gridContainer.dataset.mjrSort || "mtime_desc";
                    const insertPos = findInsertPosition(state.assets, asset, sortKey);
                    state.seenKeys.add(key);
                    if (asset.id != null) state.assetIdSet?.add?.(assetId);
                    if (insertPos === -1) state.assets.push(asset);
                    else state.assets.splice(insertPos, 0, asset);
                    modified = true;
                }
            }
        }
        if (modified && vg) vg.setItems(state.assets);
    } finally {
        batchState.pending.clear();
        batchState.flushing = false;
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
