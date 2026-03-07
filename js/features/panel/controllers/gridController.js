import { vectorSearch, hybridSearch, vectorStats } from "../../../api/client.js";
import { comfyToast } from "../../../app/toast.js";
import { t } from "../../../app/i18n.js";
import { loadMajoorSettings } from "../../../app/settings.js";

export function createGridController({
    gridContainer,
    loadAssets,
    loadAssetsFromList,
    getCollectionAssets,
    disposeGrid,
    getQuery,
    searchInputEl,
    state,
}) {
    let _isReloading = false;
    let _pendingReload = false;
    let _lastReloadErrorAt = 0;
    let _lastAiHintAt = 0;
    const RELOAD_WATCHDOG_MS = 30000;
    const AI_RELOAD_WATCHDOG_MS = 150000;
    const AI_HINT_COOLDOWN_MS = 15_000;

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
            return searchInputEl?.dataset?.mjrSemanticMode === "1";
        } catch { return false; }
    };

    const _isAiEnabled = () => {
        try {
            const settings = loadMajoorSettings();
            return !!(settings?.ai?.vectorSearchEnabled ?? true);
        } catch {
            return true;
        }
    };

    const _safeErrorText = (value, fallback = "") => {
        try {
            if (value && typeof value === "object") {
                const txt = String(value.error || value.message || fallback || "").trim();
                return txt;
            }
        } catch {
            // no-op
        }
        try {
            return String(value || fallback || "").trim();
        } catch {
            return String(fallback || "").trim();
        }
    };

    const _buildSemanticFilterOptions = () => {
        const rawSubfolder = String(state.currentFolderRelativePath || "").trim();
        const isCustomBrowserMode = state.scope === "custom" && !state.customRootId;
        return {
            subfolder: !isCustomBrowserMode && rawSubfolder ? rawSubfolder : null,
            kind: state.kindFilter || null,
            hasWorkflow: state.workflowOnly ? true : null,
            minRating: Number(state.minRating || 0) > 0 ? Number(state.minRating || 0) : null,
            minSizeMB: Number(state.minSizeMB || 0) > 0 ? Number(state.minSizeMB || 0) : null,
            maxSizeMB: Number(state.maxSizeMB || 0) > 0 ? Number(state.maxSizeMB || 0) : null,
            minWidth: Number(state.minWidth || 0) > 0 ? Number(state.minWidth || 0) : null,
            minHeight: Number(state.minHeight || 0) > 0 ? Number(state.minHeight || 0) : null,
            maxWidth: Number(state.maxWidth || 0) > 0 ? Number(state.maxWidth || 0) : null,
            maxHeight: Number(state.maxHeight || 0) > 0 ? Number(state.maxHeight || 0) : null,
            workflowType: String(state.workflowType || "").trim().toUpperCase() || null,
            dateRange: String(state.dateRangeFilter || "").trim().toLowerCase() || null,
            dateExact: String(state.dateExactFilter || "").trim() || null,
        };
    };

    const _notifyAiSearchDiagnostic = async (reason = "") => {
        const now = Date.now();
        if (now - Number(_lastAiHintAt || 0) < AI_HINT_COOLDOWN_MS) return;
        _lastAiHintAt = now;

        try {
            const statsRes = await vectorStats();
            if (statsRes?.ok && statsRes?.data) {
                const total = Number(statsRes.data?.total || 0) || 0;
                if (total <= 10) {
                    comfyToast(
                        t(
                            "toast.aiSearchNeedsBackfill",
                            "AI search index is almost empty ({count} vectors). Run Enrich, then Vector Backfill for existing assets.",
                            { count: total }
                        ),
                        "warn",
                        6500
                    );
                    return;
                }
            }
        } catch {
            // ignore and continue with generic hint
        }

        const msg = _safeErrorText(
            reason,
            t("toast.aiSearchUnavailable", "AI search is currently unavailable. Falling back to normal search.")
        );
        comfyToast(msg, "warn", 5200);
    };

    /**
     * Load assets using hybrid search when in semantic mode, with fallback chain:
     * hybridSearch → vectorSearch (pure semantic) → FTS.
     *
     * Auto-detection: queries starting with "ai:" or containing 3+ words
     * automatically trigger AI semantic search without toggling the button.
     */
    const _loadWithSemanticFallback = async (query) => {
        let q = String(query || "").trim();

        // ── "ai:" prefix forces semantic search ────────────────────
        const hasAiPrefix = /^ai:\s*/i.test(q);
        if (hasAiPrefix) {
            q = q.replace(/^ai:\s*/i, "").trim();
        }

        const aiEnabled = _isAiEnabled();
        const semanticMode = aiEnabled && _isSemanticMode();
        if (!aiEnabled) {
            const ftsQuery = hasAiPrefix ? (q || "*") : query;
            return await loadAssets(gridContainer, ftsQuery);
        }

        const wordCount = q.split(/\s+/).filter(Boolean).length;
        const visualSingleWordKeywords = new Set([
            "green", "red", "blue", "yellow", "orange", "purple", "pink", "black", "white", "gray", "grey",
            "vert", "rouge", "bleu", "jaune", "violet", "rose", "noir", "blanc", "gris",
        ]);
        const looksVisualSingleWord = wordCount === 1 && visualSingleWordKeywords.has(String(q || "").toLowerCase());
        const looksNaturalLanguage =
            (q.length >= 12 &&
            q.includes(" ") &&
            q !== "*" &&
            !/[a-z]+\s*:/i.test(q)) ||
            hasAiPrefix ||
            wordCount >= 3 ||
            looksVisualSingleWord;
        const shouldAutoAiSearch = looksNaturalLanguage && !semanticMode;
        let aiAttempted = false;
        let aiError = "";

        if (shouldAutoAiSearch && q) {
            aiAttempted = true;
            try {
                const filters = _buildSemanticFilterOptions();
                const vecRes = await vectorSearch(q, {
                    topK: 100,
                    scope: state.scope || "output",
                    customRootId: state.customRootId || "",
                    ...filters,
                });
                if (vecRes?.ok && Array.isArray(vecRes.data) && vecRes.data.length > 0) {
                    return await loadAssetsFromList(gridContainer, vecRes.data, {
                        title: `AI Search: "${q}" (${vecRes.data.length} results)`,
                        reset: true,
                    });
                }
                if (vecRes?.ok === false) {
                    aiError = _safeErrorText(vecRes?.error || vecRes?.message, aiError);
                }
            } catch (err) {
                aiError = _safeErrorText(err, aiError);
                console.debug?.("[Majoor] Automatic AI search failed, falling back to FTS", err);
            }
        }

        if (semanticMode && q && q !== "*") {
            aiAttempted = true;
            const filters = _buildSemanticFilterOptions();
            // Try hybrid search first (FTS + semantic via RRF)
            try {
                const hybRes = await hybridSearch(q, {
                    topK: 100,
                    scope: state.scope || "output",
                    customRootId: state.customRootId || "",
                    ...filters,
                });
                if (hybRes?.ok && Array.isArray(hybRes.data) && hybRes.data.length > 0) {
                    return await loadAssetsFromList(gridContainer, hybRes.data, {
                        title: `AI Search: "${q}" (${hybRes.data.length} results)`,
                        reset: true,
                    });
                }
                if (hybRes?.ok === false) {
                    aiError = _safeErrorText(hybRes?.error || hybRes?.message, aiError);
                }
            } catch (err) {
                aiError = _safeErrorText(err, aiError);
                console.debug?.("[Majoor] Hybrid search failed, trying pure semantic", err);
            }
            // Fallback to pure vector search
            try {
                const vecRes = await vectorSearch(q, {
                    topK: 100,
                    scope: state.scope || "output",
                    customRootId: state.customRootId || "",
                    ...filters,
                });
                if (vecRes?.ok && Array.isArray(vecRes.data) && vecRes.data.length > 0) {
                    return await loadAssetsFromList(gridContainer, vecRes.data, {
                        title: `AI Search: "${q}" (${vecRes.data.length} results)`,
                        reset: true,
                    });
                }
                if (vecRes?.ok === false) {
                    aiError = _safeErrorText(vecRes?.error || vecRes?.message, aiError);
                }
                // Empty vector results → fall through to normal FTS search
            } catch (err) {
                aiError = _safeErrorText(err, aiError);
                console.debug?.("[Majoor] Semantic search failed, falling back to FTS", err);
            }
        }
        const ftsQuery = hasAiPrefix ? (q || "*") : query;
        const ftsResult = await loadAssets(gridContainer, ftsQuery);

        if (looksNaturalLanguage) {
            const count = Number(ftsResult?.count || 0) || 0;
            if (count === 0) {
                try {
                    aiAttempted = true;
                    const filters = _buildSemanticFilterOptions();
                    const hybRes = await hybridSearch(q, {
                        topK: 100,
                        scope: state.scope || "output",
                        customRootId: state.customRootId || "",
                        ...filters,
                    });
                    if (hybRes?.ok && Array.isArray(hybRes.data) && hybRes.data.length > 0) {
                        return await loadAssetsFromList(gridContainer, hybRes.data, {
                            title: `AI Fallback: "${q}" (${hybRes.data.length} results)`,
                            reset: true,
                        });
                    }
                    if (hybRes?.ok === false) {
                        aiError = _safeErrorText(hybRes?.error || hybRes?.message, aiError);
                    }
                } catch (err) {
                    aiError = _safeErrorText(err, aiError);
                    console.debug?.("[Majoor] Automatic AI fallback failed", err);
                }
            }
        }

        if (aiAttempted) {
            const count = Number(ftsResult?.count || 0) || 0;
            if (count === 0) {
                void _notifyAiSearchDiagnostic(aiError);
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

        if (String(state.viewScope || "").toLowerCase() === "similar") {
            const list = Array.isArray(state.similarResults) ? state.similarResults : [];
            const sourceId = String(state.similarSourceAssetId || "").trim();
            const title = String(
                state.similarTitle
                || t("search.similarResults", "Similar to asset #{id} ({n} results)", {
                    id: sourceId || "?",
                    n: list.length,
                })
            ).trim();
            const result = await loadAssetsFromList(gridContainer, list, { title: title || "Similar", reset: true });
            try {
                state.lastGridCount = Number(result?.count || 0) || 0;
                state.lastGridTotal = Number(result?.total || 0) || 0;
                gridContainer.dispatchEvent?.(new CustomEvent("mjr:grid-stats", { detail: result || {} }));
            } catch (e) { console.debug?.(e); }
            return;
        }

        const result = await _loadWithSemanticFallback(getQuery());
        
        // Track search query timing if timer was started
        try {
            const hasSearchTimer = !!window.MajoorMetrics?.hasTimer?.('searchQuery');
            const searchDuration = hasSearchTimer
                ? window.MajoorMetrics?.endTimer?.('searchQuery', 'searchQuery')
                : 0;
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
                    const useAiTimeout = _isAiEnabled() && (_isSemanticMode() || String(getQuery?.() || "").length >= 12);
                    await runWithWatchdog(() => runReloadOnce(), useAiTimeout ? AI_RELOAD_WATCHDOG_MS : RELOAD_WATCHDOG_MS);
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
