import { vectorSearch, hybridSearch, vectorStats } from "../../../api/client.js";
import { comfyToast } from "../../../app/toast.js";
import { t } from "../../../app/i18n.js";
import { loadMajoorSettings } from "../../../app/settings.js";
import { APP_CONFIG } from "../../../app/config.js";
import { createPanelStateBridge } from "../../../stores/panelStateBridge.js";

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
    const { read, write } = createPanelStateBridge(state, [
        "scope",
        "customRootId",
        "currentFolderRelativePath",
        "kindFilter",
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
        "dateRangeFilter",
        "dateExactFilter",
        "sort",
        "activeAssetId",
        "selectedAssetIds",
        "collectionId",
        "collectionName",
        "viewScope",
        "similarResults",
        "similarTitle",
        "similarSourceAssetId",
        "lastGridCount",
        "lastGridTotal",
    ]);
    let _isReloading = false;
    let _pendingReload = false;
    let _nextReloadOptions = {};
    let _lastReloadErrorAt = 0;
    let _lastAiHintAt = 0;
    const RELOAD_WATCHDOG_MS = 30000;
    const AI_RELOAD_WATCHDOG_MS = 150000;
    const AI_HINT_COOLDOWN_MS = 15_000;
    const RELOAD_DEBOUNCE_MS = 30;

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
        } catch {
            return false;
        }
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

    const _hasSemanticContribution = (items = []) => {
        if (!Array.isArray(items) || items.length === 0) return false;
        return items.some((item) => {
            const matchType = String(item?._matchType || item?.matchType || "")
                .trim()
                .toLowerCase();
            if (matchType.includes("semantic")) return true;
            const vectorScore = Number(item?._vectorScore ?? item?.vectorScore ?? NaN);
            return Number.isFinite(vectorScore) && vectorScore > 0;
        });
    };

    const _buildSemanticFilterOptions = () => {
        const rawSubfolder = String(read("currentFolderRelativePath", "") || "").trim();
        const isCustomBrowserMode =
            read("scope", "output") === "custom" && !read("customRootId", "");
        return {
            subfolder: !isCustomBrowserMode && rawSubfolder ? rawSubfolder : null,
            kind: read("kindFilter", "") || null,
            hasWorkflow: read("workflowOnly", false) ? true : null,
            minRating: Number(read("minRating", 0) || 0) > 0 ? Number(read("minRating", 0) || 0) : null,
            minSizeMB: Number(read("minSizeMB", 0) || 0) > 0 ? Number(read("minSizeMB", 0) || 0) : null,
            maxSizeMB: Number(read("maxSizeMB", 0) || 0) > 0 ? Number(read("maxSizeMB", 0) || 0) : null,
            minWidth: Number(read("minWidth", 0) || 0) > 0 ? Number(read("minWidth", 0) || 0) : null,
            minHeight: Number(read("minHeight", 0) || 0) > 0 ? Number(read("minHeight", 0) || 0) : null,
            maxWidth: Number(read("maxWidth", 0) || 0) > 0 ? Number(read("maxWidth", 0) || 0) : null,
            maxHeight: Number(read("maxHeight", 0) || 0) > 0 ? Number(read("maxHeight", 0) || 0) : null,
            workflowType:
                String(read("workflowType", "") || "")
                    .trim()
                    .toUpperCase() || null,
            dateRange:
                String(read("dateRangeFilter", "") || "")
                    .trim()
                    .toLowerCase() || null,
            dateExact: String(read("dateExactFilter", "") || "").trim() || null,
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
                const eligibleTotal = Number(statsRes.data?.eligible_total || 0) || 0;
                const coverageRatio = Number(statsRes.data?.coverage_ratio ?? NaN);
                if (total <= 10) {
                    comfyToast(
                        t(
                            "toast.aiSearchNeedsBackfill",
                            "AI search index is almost empty ({count} vectors). Run Enrich, then Vector Backfill for existing assets.",
                            { count: total },
                        ),
                        "warn",
                        6500,
                    );
                    return;
                }
                if (
                    eligibleTotal > 0 &&
                    Number.isFinite(coverageRatio) &&
                    coverageRatio > 0 &&
                    coverageRatio < 0.75
                ) {
                    comfyToast(
                        t(
                            "toast.aiSearchPartiallyIndexed",
                            "AI search index is only partially built ({indexed}/{eligible}, {percent}%). Run Vector Backfill for existing assets.",
                            {
                                indexed: total,
                                eligible: eligibleTotal,
                                percent: Math.round(coverageRatio * 100),
                            },
                        ),
                        "warn",
                        7000,
                    );
                    return;
                }
            }
        } catch {
            // ignore and continue with generic hint
        }

        const msg = _safeErrorText(
            reason,
            t(
                "toast.aiSearchUnavailable",
                "AI search is currently unavailable. Falling back to normal search.",
            ),
        );
        comfyToast(msg, "warn", 5200);
    };

    /**
     * Load assets using hybrid search when in semantic mode, with fallback chain:
     * hybridSearch → vectorSearch (pure semantic) → FTS.
     *
        * Explicit activation only: semantic toggle or "ai:" prefix.
     */
    const _loadWithSemanticFallback = async (query, loadOptions = {}) => {
        let q = String(query || "").trim();

        // ── "ai:" prefix forces semantic search ────────────────────
        const hasAiPrefix = /^ai:\s*/i.test(q);
        if (hasAiPrefix) {
            q = q.replace(/^ai:\s*/i, "").trim();
        }

        const aiEnabled = _isAiEnabled();
        const semanticMode = aiEnabled && _isSemanticMode();
        if (!aiEnabled) {
            return await loadAssets(gridContainer, q || "*", loadOptions);
        }
        const semanticRequested = semanticMode || hasAiPrefix;
        let aiAttempted = false;
        let aiError = "";

        if (semanticRequested && q && q !== "*") {
            aiAttempted = true;
            const filters = _buildSemanticFilterOptions();
            // Try hybrid search first (FTS + semantic via RRF)
            try {
                const hybRes = await hybridSearch(q, {
                    topK: 100,
                    scope: read("scope", "output") || "output",
                    customRootId: read("customRootId", "") || "",
                    ...filters,
                });
                if (
                    hybRes?.ok &&
                    Array.isArray(hybRes.data) &&
                    hybRes.data.length > 0 &&
                    _hasSemanticContribution(hybRes.data)
                ) {
                    return await loadAssetsFromList(gridContainer, hybRes.data, {
                        title: `AI Search: "${q}" (${hybRes.data.length} results)`,
                        reset: true,
                        ...loadOptions,
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
                    scope: read("scope", "output") || "output",
                    customRootId: read("customRootId", "") || "",
                    ...filters,
                });
                if (vecRes?.ok && Array.isArray(vecRes.data) && vecRes.data.length > 0) {
                    return await loadAssetsFromList(gridContainer, vecRes.data, {
                        title: `AI Search: "${q}" (${vecRes.data.length} results)`,
                        reset: true,
                        ...loadOptions,
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
        const ftsResult = await loadAssets(gridContainer, q || "*", loadOptions);

        if (aiAttempted && aiError) {
            const count = Number(ftsResult?.count || 0) || 0;
            if (count === 0) {
                void _notifyAiSearchDiagnostic(aiError);
            }
        }

        return ftsResult;
    };

    const runReloadOnce = async (reloadOptions = {}) => {
        const prevViewScope = String(gridContainer.dataset.mjrViewScope || "")
            .trim()
            .toLowerCase();
        const nextViewScope = String(read("viewScope", state?.viewScope || "") || "")
            .trim()
            .toLowerCase();
        // Write scope and filter state to the container dataset BEFORE reading
        // the query so that fetchPage sees the finalized scope context.
        gridContainer.dataset.mjrScope = read("scope", "output");
        gridContainer.dataset.mjrViewScope = nextViewScope;
        gridContainer.dataset.mjrCustomRootId = read("customRootId", "") || "";
        const subfolder = read("currentFolderRelativePath", "") || "";
        gridContainer.dataset.mjrSubfolder = subfolder;
        gridContainer.dataset.mjrFilterKind = read("kindFilter", "") || "";
        gridContainer.dataset.mjrFilterWorkflowOnly = read("workflowOnly", false) ? "1" : "0";
        gridContainer.dataset.mjrFilterMinRating = String(read("minRating", 0) || 0);
        gridContainer.dataset.mjrFilterMinSizeMB = String(read("minSizeMB", 0) || 0);
        gridContainer.dataset.mjrFilterMaxSizeMB = String(read("maxSizeMB", 0) || 0);
        gridContainer.dataset.mjrFilterResolutionCompare = String(read("resolutionCompare", "gte") || "gte");
        gridContainer.dataset.mjrFilterMinWidth = String(read("minWidth", 0) || 0);
        gridContainer.dataset.mjrFilterMinHeight = String(read("minHeight", 0) || 0);
        gridContainer.dataset.mjrFilterMaxWidth = String(read("maxWidth", 0) || 0);
        gridContainer.dataset.mjrFilterMaxHeight = String(read("maxHeight", 0) || 0);
        gridContainer.dataset.mjrFilterWorkflowType = String(read("workflowType", "") || "");
        gridContainer.dataset.mjrFilterDateRange = read("dateRangeFilter", "") || "";
        gridContainer.dataset.mjrFilterDateExact = read("dateExactFilter", "") || "";
        gridContainer.dataset.mjrSort = read("sort", "mtime_desc") || "mtime_desc";
        gridContainer.dataset.mjrCollectionId = read("collectionId", "") || "";
        gridContainer.dataset.mjrSemanticMode = _isSemanticMode() ? "1" : "0";
        // Expose the current query on the container so external listeners (ComfyUI executed events)
        // can decide whether to do incremental upserts or avoid disrupting an active search.
        // Written after scope so that fetchPage sees the finalized context.
        try {
            gridContainer.dataset.mjrQuery = String(getQuery?.() ?? "*") || "*";
        } catch (e) {
            console.debug?.(e);
        }
        gridContainer.dataset.mjrGroupStacks =
            APP_CONFIG.EXECUTION_GROUPING_ENABLED &&
            (read("scope", "output") === "output" || read("scope", "output") === "all")
                ? "1"
                : "0";

        // Keep selection durable across re-renders by persisting it in the dataset
        // (GridView re-applies selection as cards are created).
        try {
            const selected = Array.isArray(read("selectedAssetIds", []))
                ? read("selectedAssetIds", []).filter(Boolean).map(String)
                : [];
            if (selected.length) {
                gridContainer.dataset.mjrSelectedAssetIds = JSON.stringify(selected);
                gridContainer.dataset.mjrSelectedAssetId = String(
                    read("activeAssetId", "") || selected[0] || "",
                );
            } else {
                delete gridContainer.dataset.mjrSelectedAssetIds;
                delete gridContainer.dataset.mjrSelectedAssetId;
            }
        } catch (e) {
            console.debug?.(e);
        }

        if (
            read("scope", "output") === "custom" &&
            !read("customRootId", "") &&
            !read("currentFolderRelativePath", "")
        ) {
            try {
                disposeGrid(gridContainer);
            } catch (e) {
                console.debug?.(e);
            }
            // Browser mode: no selected custom root required. Start at filesystem roots.
            write("currentFolderRelativePath", "");
        }

        if (read("collectionId", "")) {
            const res = await getCollectionAssets?.(read("collectionId", ""));
            if (res?.ok && res.data && Array.isArray(res.data.assets)) {
                const title = read("collectionName", "")
                    ? `Collection: ${read("collectionName", "")}`
                    : "Collection";
                const result = await loadAssetsFromList(gridContainer, res.data.assets, {
                    title,
                    reset: true,
                });
                try {
                    write("lastGridCount", Number(result?.count || 0) || 0);
                    write("lastGridTotal", Number(result?.total || 0) || 0);
                    gridContainer.dispatchEvent?.(
                        new CustomEvent("mjr:grid-stats", { detail: result || {} }),
                    );
                } catch (e) {
                    console.debug?.(e);
                }
                return;
            }
            // If collection fetch fails, fall back to normal loading and clear the broken state.
            write("collectionId", "");
            write("collectionName", "");
        }

        const viewScope = nextViewScope;
        if (viewScope === "similar") {
            const bridgeList = Array.isArray(read("similarResults", [])) ? read("similarResults", []) : [];
            const stateList = Array.isArray(state?.similarResults) ? state.similarResults : [];
            const list = bridgeList.length > 0 ? bridgeList : stateList;
            const sourceId = String(
                read("similarSourceAssetId", state?.similarSourceAssetId || "") || "",
            ).trim();
            const title = String(
                read("similarTitle", state?.similarTitle || "") ||
                    t("search.similarResults", "Similar to asset #{id} ({n} results)", {
                        id: sourceId || "?",
                        n: list.length,
                    }),
            ).trim();
            const result = await loadAssetsFromList(gridContainer, list, {
                title: title || "Similar",
                reset: true,
                ...reloadOptions,
            });
            try {
                write("lastGridCount", Number(result?.count || 0) || 0);
                write("lastGridTotal", Number(result?.total || 0) || 0);
                gridContainer.dispatchEvent?.(
                    new CustomEvent("mjr:grid-stats", { detail: result || {} }),
                );
            } catch (e) {
                console.debug?.(e);
            }
            return;
        }

        const exitingVirtualSimilarScope = prevViewScope === "similar" && viewScope !== "similar";
        const result = await _loadWithSemanticFallback(getQuery(), {
            ...reloadOptions,
            preserveVisibleUntilReady:
                reloadOptions.preserveVisibleUntilReady ?? !exitingVirtualSimilarScope,
        });

        // Track search query timing if timer was started
        try {
            const hasSearchTimer = !!window.MajoorMetrics?.hasTimer?.("searchQuery");
            const searchDuration = hasSearchTimer
                ? window.MajoorMetrics?.endTimer?.("searchQuery", "searchQuery")
                : 0;
            if (typeof searchDuration === "number" && searchDuration > 0) {
                window.MajoorMetrics?.trackSearchQuery?.(searchDuration);
            }
        } catch (e) {
            console.debug?.(e);
        }

        try {
            write("lastGridCount", Number(result?.count || 0) || 0);
            write("lastGridTotal", Number(result?.total || 0) || 0);
            gridContainer.dispatchEvent?.(
                new CustomEvent("mjr:grid-stats", { detail: result || {} }),
            );
        } catch (e) {
            console.debug?.(e);
        }
    };

    let _debounceTimer = null;

    const _doReload = async () => {
        _pendingReload = true;
        if (_isReloading) return;
        _isReloading = true;
        try {
            while (_pendingReload) {
                const reloadOptions = { ...(_nextReloadOptions || {}) };
                _nextReloadOptions = {};
                _pendingReload = false;
                try {
                    const useAiTimeout =
                        _isAiEnabled() &&
                        (_isSemanticMode() || String(getQuery?.() || "").length >= 12);
                    await runWithWatchdog(
                        () => runReloadOnce(reloadOptions),
                        useAiTimeout ? AI_RELOAD_WATCHDOG_MS : RELOAD_WATCHDOG_MS,
                    );
                } catch (err) {
                    // Keep UI responsive even if one reload got stuck, but don't fail silently.
                    try {
                        const now = Date.now();
                        if (now - Number(_lastReloadErrorAt || 0) > 2000) {
                            _lastReloadErrorAt = now;
                            console.warn("[Majoor] Grid reload failed", err);
                        }
                    } catch (e) {
                        console.debug?.(e);
                    }
                }
            }
        } finally {
            _isReloading = false;
        }
    };

    // Input debounce: batches rapid reloadGrid() calls (e.g., scope switch +
    // watcher event arriving simultaneously) into a single _doReload execution.
    // The inner coalescing loop still handles calls that arrive mid-reload.
    const reloadGrid = (options = {}) => {
        return new Promise((resolve, reject) => {
            _nextReloadOptions = { ...(_nextReloadOptions || {}), ...(options || {}) };
            if (_debounceTimer) clearTimeout(_debounceTimer);
            _debounceTimer = setTimeout(() => {
                _debounceTimer = null;
                _doReload().then(resolve).catch(reject);
            }, RELOAD_DEBOUNCE_MS);
        });
    };

    return { reloadGrid };
}
