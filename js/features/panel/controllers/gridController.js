import { vectorSearch, hybridSearch, getAuditAssets } from "../../../api/client.js";

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

    /**
     * Check if semantic / AI mode is active on the search input.
     */
    const _isSemanticMode = () => {
        try {
            const input = gridContainer?.closest?.(".mjr-am-panel")?.querySelector?.("#mjr-search-input");
            return input?.dataset?.mjrSemanticMode === "1";
        } catch { return false; }
    };

    /**
     * Check if audit mode is active on the search input.
     */
    const _isAuditMode = () => {
        try {
            const input = gridContainer?.closest?.(".mjr-am-panel")?.querySelector?.("#mjr-search-input");
            return input?.dataset?.mjrAuditMode === "1";
        } catch { return false; }
    };

    /**
     * Load assets using hybrid search when in semantic mode, with fallback chain:
     * hybridSearch → vectorSearch (pure semantic) → FTS.
     */
    const _loadWithSemanticFallback = async (query) => {
        const q = String(query || "").trim();
        const looksNaturalLanguage =
            q.length >= 12 &&
            q.includes(" ") &&
            q !== "*" &&
            !/[a-z]+\s*:/i.test(q);

        if (_isSemanticMode() && q && q !== "*") {
            // Try hybrid search first (FTS + semantic via RRF)
            try {
                const hybRes = await hybridSearch(q, {
                    topK: 100,
                    scope: state.scope || "output",
                    customRootId: state.customRootId || "",
                });
                if (hybRes?.ok && Array.isArray(hybRes.data) && hybRes.data.length > 0) {
                    return await loadAssetsFromList(gridContainer, hybRes.data, {
                        title: `AI Search: "${q}" (${hybRes.data.length} results)`,
                        reset: true,
                    });
                }
            } catch (err) {
                console.debug?.("[Majoor] Hybrid search failed, trying pure semantic", err);
            }
            // Fallback to pure vector search
            try {
                const vecRes = await vectorSearch(q, 100);
                if (vecRes?.ok && Array.isArray(vecRes.data) && vecRes.data.length > 0) {
                    return await loadAssetsFromList(gridContainer, vecRes.data, {
                        title: `AI Search: "${q}" (${vecRes.data.length} results)`,
                        reset: true,
                    });
                }
                // Empty vector results → fall through to normal FTS search
            } catch (err) {
                console.debug?.("[Majoor] Semantic search failed, falling back to FTS", err);
            }
        }
        const ftsResult = await loadAssets(gridContainer, query);

        if (looksNaturalLanguage) {
            const count = Number(ftsResult?.count || 0) || 0;
            if (count === 0) {
                try {
                    const hybRes = await hybridSearch(q, {
                        topK: 100,
                        scope: state.scope || "output",
                        customRootId: state.customRootId || "",
                    });
                    if (hybRes?.ok && Array.isArray(hybRes.data) && hybRes.data.length > 0) {
                        return await loadAssetsFromList(gridContainer, hybRes.data, {
                            title: `AI Fallback: "${q}" (${hybRes.data.length} results)`,
                            reset: true,
                        });
                    }
                } catch (err) {
                    console.debug?.("[Majoor] Automatic AI fallback failed", err);
                }
            }
        }

        return ftsResult;
    };

    const runReloadOnce = async () => {
        // Expose the current query on the container so external listeners (ComfyUI executed events)
        // can decide whether to do incremental upserts or avoid disrupting an active search.
        try {
            gridContainer.dataset.mjrQuery = String(getQuery?.() ?? "*") || "*";
        } catch (e) { console.debug?.(e); }
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
        } catch (e) { console.debug?.(e); }

        if (state.scope === "custom" && !state.customRootId && !state.currentFolderRelativePath) {
            try {
                disposeGrid(gridContainer);
            } catch (e) { console.debug?.(e); }
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
                } catch (e) { console.debug?.(e); }
                return;
            }
            // If collection fetch fails, fall back to normal loading and clear the broken state.
            state.collectionId = "";
            state.collectionName = "";
        }

        // Audit mode: show incomplete/low-quality assets
        if (_isAuditMode()) {
            try {
                const auditRes = await getAuditAssets({
                    filter: "incomplete",
                    sort: "alignment_asc",
                    scope: state.scope || "output",
                    customRootId: state.customRootId || "",
                    limit: 200,
                });
                if (auditRes?.ok && Array.isArray(auditRes.data)) {
                    const result = await loadAssetsFromList(gridContainer, auditRes.data, {
                        title: `Library Audit — ${auditRes.data.length} assets need attention`,
                        reset: true,
                    });
                    try {
                        state.lastGridCount = Number(result?.count || 0) || 0;
                        state.lastGridTotal = Number(result?.total || 0) || 0;
                        gridContainer.dispatchEvent?.(new CustomEvent("mjr:grid-stats", { detail: result || {} }));
                    } catch (e) { console.debug?.(e); }
                    return;
                }
            } catch (err) {
                console.debug?.("[Majoor] Audit load failed, falling back to normal search", err);
            }
        }

        const result = await _loadWithSemanticFallback(getQuery());
        
        // Track search query timing if timer was started
        try {
            const searchDuration = window.MajoorMetrics?.endTimer?.('searchQuery', 'searchQuery');
            if (typeof searchDuration === 'number' && searchDuration > 0) {
                window.MajoorMetrics?.trackSearchQuery?.(searchDuration);
            }
        } catch (e) { console.debug?.(e); }
        
        try {
            state.lastGridCount = Number(result?.count || 0) || 0;
            state.lastGridTotal = Number(result?.total || 0) || 0;
            gridContainer.dispatchEvent?.(new CustomEvent("mjr:grid-stats", { detail: result || {} }));
        } catch (e) { console.debug?.(e); }
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
                    } catch (e) { console.debug?.(e); }
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
