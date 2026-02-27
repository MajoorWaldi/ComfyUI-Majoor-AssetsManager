export function createGridController({ gridContainer, loadAssets, loadAssetsFromList, getCollectionAssets, disposeGrid, getQuery, state }) {
    let _isReloading = false;
    let _pendingReload = false;
    let _lastReloadErrorAt = 0;
    const RELOAD_WATCHDOG_MS = 30000;

    const runWithWatchdog = async (promiseFactory, timeoutMs = RELOAD_WATCHDOG_MS) => {
        let timer = null;
        try {
            const timeoutPromise = new Promise((_, reject) => {
                timer = setTimeout(() => {
                    const err = new Error(`Grid reload watchdog timeout (${timeoutMs}ms)`);
                    err.name = "GridReloadTimeout";
                    reject(err);
                }, timeoutMs);
            });
            return await Promise.race([promiseFactory(), timeoutPromise]);
        } finally {
            if (timer) clearTimeout(timer);
        }
    };

    const runReloadOnce = async () => {
        // Expose the current query on the container so external listeners (ComfyUI executed events)
        // can decide whether to do incremental upserts or avoid disrupting an active search.
        try {
            gridContainer.dataset.mjrQuery = String(getQuery?.() ?? "*") || "*";
        } catch {}
        gridContainer.dataset.mjrScope = state.scope;
        gridContainer.dataset.mjrCustomRootId = state.customRootId || "";
        const subfolder = state.currentFolderRelativePath || "";
        gridContainer.dataset.mjrSubfolder = subfolder;
        gridContainer.dataset.mjrFilterKind = state.kindFilter || "";
        gridContainer.dataset.mjrFilterWorkflowOnly = state.workflowOnly ? "1" : "0";
        gridContainer.dataset.mjrFilterMinRating = String(state.minRating || 0);
        gridContainer.dataset.mjrFilterMinSizeMB = String(state.minSizeMB || 0);
        gridContainer.dataset.mjrFilterMaxSizeMB = String(state.maxSizeMB || 0);
        gridContainer.dataset.mjrFilterResolutionCompare = String(state.resolutionCompare || "gte");
        gridContainer.dataset.mjrFilterMinWidth = String(state.minWidth || 0);
        gridContainer.dataset.mjrFilterMinHeight = String(state.minHeight || 0);
        gridContainer.dataset.mjrFilterMaxWidth = String(state.maxWidth || 0);
        gridContainer.dataset.mjrFilterMaxHeight = String(state.maxHeight || 0);
        gridContainer.dataset.mjrFilterWorkflowType = String(state.workflowType || "");
        gridContainer.dataset.mjrFilterDateRange = state.dateRangeFilter || "";
        gridContainer.dataset.mjrFilterDateExact = state.dateExactFilter || "";
        gridContainer.dataset.mjrSort = state.sort || "mtime_desc";

        // Keep selection durable across re-renders by persisting it in the dataset
        // (GridView re-applies selection as cards are created).
        try {
            const selected = Array.isArray(state.selectedAssetIds) ? state.selectedAssetIds.filter(Boolean).map(String) : [];
            if (selected.length) {
                gridContainer.dataset.mjrSelectedAssetIds = JSON.stringify(selected);
                gridContainer.dataset.mjrSelectedAssetId = String(state.activeAssetId || selected[0] || "");
            } else {
                delete gridContainer.dataset.mjrSelectedAssetIds;
                delete gridContainer.dataset.mjrSelectedAssetId;
            }
        } catch {}

        if (state.scope === "custom" && !state.customRootId && !state.currentFolderRelativePath) {
            try {
                disposeGrid(gridContainer);
            } catch {}
            // Browser mode: no selected custom root required. Start at filesystem roots.
            state.currentFolderRelativePath = "";
        }

        if (state.collectionId) {
            const res = await getCollectionAssets?.(state.collectionId);
            if (res?.ok && res.data && Array.isArray(res.data.assets)) {
                const title = state.collectionName ? `Collection: ${state.collectionName}` : "Collection";
                const result = await loadAssetsFromList(gridContainer, res.data.assets, { title, reset: true });
                try {
                    state.lastGridCount = Number(result?.count || 0) || 0;
                    state.lastGridTotal = Number(result?.total || 0) || 0;
                    gridContainer.dispatchEvent?.(new CustomEvent("mjr:grid-stats", { detail: result || {} }));
                } catch {}
                return;
            }
            // If collection fetch fails, fall back to normal loading and clear the broken state.
            state.collectionId = "";
            state.collectionName = "";
        }

        const result = await loadAssets(gridContainer, getQuery());
        try {
            state.lastGridCount = Number(result?.count || 0) || 0;
            state.lastGridTotal = Number(result?.total || 0) || 0;
            gridContainer.dispatchEvent?.(new CustomEvent("mjr:grid-stats", { detail: result || {} }));
        } catch {}
    };

    let _debounceTimer = null;

    const _doReload = async () => {
        _pendingReload = true;
        if (_isReloading) return;
        _isReloading = true;
        try {
            while (_pendingReload) {
                _pendingReload = false;
                try {
                    await runWithWatchdog(() => runReloadOnce());
                } catch (err) {
                    // Keep UI responsive even if one reload got stuck, but don't fail silently.
                    try {
                        const now = Date.now();
                        if (now - Number(_lastReloadErrorAt || 0) > 2000) {
                            _lastReloadErrorAt = now;
                            console.warn("[Majoor] Grid reload failed", err);
                        }
                    } catch {}
                }
            }
        } finally {
            _isReloading = false;
        }
    };

    // Input debounce: batches rapid reloadGrid() calls (e.g., scope switch +
    // watcher event arriving simultaneously) into a single _doReload execution.
    // The inner coalescing loop still handles calls that arrive mid-reload.
    const reloadGrid = () => {
        return new Promise((resolve) => {
            if (_debounceTimer) clearTimeout(_debounceTimer);
            _debounceTimer = setTimeout(() => {
                _debounceTimer = null;
                _doReload().then(resolve).catch(resolve);
            }, 150);
        });
    };

    return { reloadGrid };
}
