import { get } from "../../api/client.js";
import { ENDPOINTS } from "../../api/endpoints.js";
import { isGridHostVisible } from "./gridVisibility.js";

function nextFrame(callback) {
    try {
        if (typeof requestAnimationFrame === "function") {
            requestAnimationFrame(callback);
            return;
        }
    } catch (e) {
        console.debug?.(e);
    }
    setTimeout(callback, 0);
}

function isDefaultBrowseContext(state = {}, stableQuery = "*") {
    return (
        state.scope === "output" &&
        !state.collectionId &&
        stableQuery === "*" &&
        !state.kindFilter &&
        !state.workflowOnly &&
        !(Number(state.minRating || 0) > 0) &&
        !(Number(state.minSizeMB || 0) > 0) &&
        !(Number(state.maxSizeMB || 0) > 0) &&
        !(Number(state.minWidth || 0) > 0) &&
        !(Number(state.minHeight || 0) > 0) &&
        !(Number(state.maxWidth || 0) > 0) &&
        !(Number(state.maxHeight || 0) > 0) &&
        !String(state.workflowType || "").trim() &&
        !state.dateRangeFilter &&
        !state.dateExactFilter
    );
}

export function createAssetsQueryController({
    gridContainer,
    gridWrapper,
    readScrollElement = () => null,
    gridController,
    captureAnchor,
    restoreAnchor,
    restoreGridUiState = null,
    readScrollTop = () => 0,
    restoreSelectionState = () => {},
    readActiveAssetId = () => "",
    isSidebarOpen = () => false,
    toggleSidebarDetails = () => {},
    getQuery = () => "*",
    getScope = () => "output",
    loadAssets = null,
    lifecycleSignal = null,
} = {}) {
    let pendingReloadCount = 0;
    let isReloading = false;
    let autoLoadTimer = null;
    let searchDebounceTimer = null;
    let pendingAutoLoadPromise = null;
    let pendingAutoLoadDelayMs = 0;
    let lastKnownVisible = true;
    const mountedAt = Date.now();
    const BOOT_RELOAD_GRACE_MS = 8000;

    const isGridVisible = () => {
        try {
            const scrollElement =
                typeof readScrollElement === "function" ? readScrollElement() : gridWrapper;
            return isGridHostVisible(gridContainer, scrollElement || gridWrapper || null);
        } catch (e) {
            console.debug?.(e);
            return false;
        }
    };

    const syncVisibilityState = (nextVisible = null, { resumeQueuedReload = true } = {}) => {
        lastKnownVisible =
            typeof nextVisible === "boolean" ? nextVisible : isGridVisible();
        if (!lastKnownVisible) {
            if (autoLoadTimer) {
                clearTimeout(autoLoadTimer);
                autoLoadTimer = null;
            }
            return lastKnownVisible;
        }
        if (pendingAutoLoadPromise && !autoLoadTimer) {
            const promise = pendingAutoLoadPromise;
            const delayMs = pendingAutoLoadDelayMs || 50;
            pendingAutoLoadPromise = null;
            pendingAutoLoadDelayMs = 0;
            scheduleAutoLoad(promise, Math.min(delayMs, 50));
        }
        if (resumeQueuedReload && pendingReloadCount > 0 && !isReloading) {
            void queuedReload().catch((e) => console.debug?.(e));
        }
        return lastKnownVisible;
    };

    const hasGridAssets = () => {
        try {
            const state = gridContainer?._mjrGetGridState?.();
            if (Array.isArray(state?.assets) && state.assets.length > 0) return true;
        } catch (e) {
            console.debug?.(e);
        }

        try {
            const assets = gridContainer?._mjrGetAssets?.();
            if (Array.isArray(assets) && assets.length > 0) return true;
        } catch (e) {
            console.debug?.(e);
        }

        try {
            return gridContainer?.querySelector?.(".mjr-asset-card") != null;
        } catch (e) {
            console.debug?.(e);
            return false;
        }
    };

    const hasActiveGridLoad = () => {
        try {
            const state = gridContainer?._mjrGetGridState?.();
            return !!state?.loading;
        } catch (e) {
            console.debug?.(e);
            return false;
        }
    };

    const queuedReload = async () => {
        if (!gridContainer || !gridController?.reloadGrid) return;
        pendingReloadCount += 1;
        if (!syncVisibilityState(null, { resumeQueuedReload: false })) return;
        if (isReloading) return;

        isReloading = true;
        try {
            while (pendingReloadCount > 0) {
                if (!syncVisibilityState(null, { resumeQueuedReload: false })) return;
                pendingReloadCount = 0;
                const anchor =
                    typeof captureAnchor === "function" ? captureAnchor(gridContainer) : null;
                await gridController.reloadGrid();
                if (!syncVisibilityState(null, { resumeQueuedReload: false })) return;
                if (anchor && typeof restoreAnchor === "function") {
                    try {
                        const currentScrollTop = Number(readScrollTop() || 0) || 0;
                        const anchorScrollTop = Number(anchor?.scrollTop || 0) || 0;
                        // Only skip restore if user actively scrolled DOWN past the original
                        // position during the reload. A drop in scrollTop (currentScrollTop <
                        // anchorScrollTop) means the reload itself reset the scroll — we must
                        // restore in that case to avoid losing the user's position.
                        const userScrolledPastAnchor = currentScrollTop > anchorScrollTop + 8;
                        if (userScrolledPastAnchor) {
                            continue;
                        }
                        await restoreAnchor(gridContainer, anchor);
                    } catch (e) {
                        console.debug?.(e);
                    }
                }
            }
        } finally {
            isReloading = false;
        }
    };

    const restoreUiState = async (initialLoadPromise) => {
        if (typeof restoreGridUiState === "function") {
            return restoreGridUiState(initialLoadPromise);
        }

        try {
            await initialLoadPromise;
        } catch (e) {
            console.debug?.(e);
        }

        nextFrame(() => {
            const scrollTop = Number(readScrollTop() || 0) || 0;
            if (scrollTop > 0) {
                try {
                    gridWrapper.scrollTop = scrollTop;
                } catch (e) {
                    console.debug?.(e);
                }
            }

            try {
                restoreSelectionState({ scrollTop });
            } catch (e) {
                console.debug?.(e);
            }

            if (isSidebarOpen() && readActiveAssetId()) {
                try {
                    toggleSidebarDetails();
                } catch (e) {
                    console.debug?.(e);
                }
            }
        });
    };

    const checkAndAutoLoad = async (initialLoadPromise) => {
        try {
            await initialLoadPromise;
        } catch (e) {
            console.debug?.(e);
        }

        if (!gridContainer || typeof loadAssets !== "function") return;
        if (lifecycleSignal?.aborted) return;
        if (!syncVisibilityState()) {
            pendingAutoLoadPromise = initialLoadPromise;
            pendingAutoLoadDelayMs = 50;
            return;
        }

        if (hasGridAssets()) return;
        if (hasActiveGridLoad()) return;
        if (String(getScope() || "output") !== "output") return;
        if (String(getQuery() || "*") !== "*") return;

        try {
            const statusData = await get(`${ENDPOINTS.HEALTH_COUNTERS}?scope=output`, {
                signal: lifecycleSignal || undefined,
            });
            if (statusData?.ok && (statusData.data?.total_assets || 0) > 0) {
                await loadAssets(gridContainer);
            }
        } catch (e) {
            console.debug?.(e);
        }
    };

    const scheduleAutoLoad = (initialLoadPromise, delayMs = 2000) => {
        if (autoLoadTimer) clearTimeout(autoLoadTimer);
        if (!syncVisibilityState()) {
            pendingAutoLoadPromise = initialLoadPromise;
            pendingAutoLoadDelayMs = delayMs;
            return null;
        }
        pendingAutoLoadPromise = null;
        pendingAutoLoadDelayMs = 0;
        autoLoadTimer = setTimeout(() => {
            autoLoadTimer = null;
            checkAndAutoLoad(initialLoadPromise).catch(() => {});
        }, delayMs);
        return autoLoadTimer;
    };

    const createCountersUpdateHandler = ({
        state = {},
        getStableQuery = () => String(gridContainer?.dataset?.mjrQuery || "*").trim() || "*",
        getRecentUserInteractionAt = () => 0,
    } = {}) => {
        const runtimeWindow = globalThis?.window ?? globalThis;
        let lastKnownScan = null;
        let lastKnownIndexEnd = null;
        let lastKnownTotalAssets = null;
        let hasSeenFirstCounters = false;

        return async (counters = {}) => {
            if (!hasSeenFirstCounters) {
                hasSeenFirstCounters = true;
                lastKnownScan = counters.last_scan_end;
                lastKnownIndexEnd = counters.last_index_end;
                lastKnownTotalAssets = Number(counters.total_assets ?? null);
                return;
            }

            const hasNewScan = counters.last_scan_end && counters.last_scan_end !== lastKnownScan;
            const hasNewIndexEnd =
                counters.last_index_end && counters.last_index_end !== lastKnownIndexEnd;
            const totalAssets = Number(counters.total_assets ?? null);
            const stableQuery = String(getStableQuery() || "*").trim() || "*";
            const isDefaultBrowse = isDefaultBrowseContext(state, stableQuery);
            const inBootReloadGrace = Date.now() - mountedAt < BOOT_RELOAD_GRACE_MS;

            const totalDelta =
                Number.isFinite(totalAssets) && Number.isFinite(lastKnownTotalAssets)
                    ? totalAssets - lastKnownTotalAssets
                    : 0;
            const recentUpsertCount = Math.max(
                0,
                Number(runtimeWindow?.__mjrLastAssetUpsertCount || 0) || 0,
            );
            const hasNewTotal = totalDelta >= 20;

            if (Number.isFinite(totalAssets)) {
                lastKnownTotalAssets = totalAssets;
            }
            if (!isDefaultBrowse) {
                lastKnownScan = counters.last_scan_end;
                lastKnownIndexEnd = counters.last_index_end;
                return;
            }
            if (inBootReloadGrace && hasGridAssets()) {
                lastKnownScan = counters.last_scan_end;
                lastKnownIndexEnd = counters.last_index_end;
                return;
            }

            const recentUpsertMs = Date.now() - Number(runtimeWindow?.__mjrLastAssetUpsert || 0);
            const upsertHandledRecently = recentUpsertMs < 15000;
            const totalExplainedByRecentUpserts =
                upsertHandledRecently &&
                totalDelta > 0 &&
                recentUpsertCount > 0 &&
                totalDelta <= recentUpsertCount + 8;
            const totalOnlyBackgroundGrowth =
                hasNewTotal &&
                !hasNewScan &&
                !hasNewIndexEnd &&
                hasGridAssets();

            if (hasNewIndexEnd) lastKnownIndexEnd = counters.last_index_end;
            const needsFallbackReload =
                hasNewIndexEnd && !hasNewScan && !hasNewTotal && !upsertHandledRecently;

            if (totalExplainedByRecentUpserts) {
                lastKnownScan = counters.last_scan_end;
                lastKnownIndexEnd = counters.last_index_end;
                try {
                    runtimeWindow.__mjrLastAssetUpsertCount = 0;
                } catch (e) {
                    console.debug?.(e);
                }
                return;
            }
            if (totalOnlyBackgroundGrowth) {
                lastKnownScan = counters.last_scan_end;
                lastKnownIndexEnd = counters.last_index_end;
                return;
            }
            if (upsertHandledRecently) return;
            if (!hasNewScan && !hasNewTotal && !needsFallbackReload) return;

            lastKnownScan = counters.last_scan_end;
            lastKnownIndexEnd = counters.last_index_end;

            try {
                runtimeWindow.__mjrGridDirty = true;
                runtimeWindow.dispatchEvent?.(
                    new CustomEvent("mjr-grid-dirty", {
                        detail: {
                            reason: hasNewScan
                                ? "scan"
                                : hasNewIndexEnd
                                  ? "index"
                                  : "total",
                            counters,
                        },
                    }),
                );
            } catch (e) {
                console.debug?.(e);
            }

            try {
                const recentInteractionMs =
                    Date.now() - Math.max(0, Number(getRecentUserInteractionAt() || 0) || 0);
                if (!hasGridAssets() && recentInteractionMs > 1500) {
                    await queuedReload();
                }
            } catch (e) {
                console.debug?.(e);
            }

            try {
                runtimeWindow.__mjrLastAssetUpsertCount = 0;
            } catch (e) {
                console.debug?.(e);
            }
        };
    };

    const bindSearchInput = ({
        searchInputEl,
        lifecycleSignal = null,
        debounceMs = 200,
        onQueryChanged = () => {},
        onBeforeReload = () => {},
        startSearchTimer = () => {},
        reloadGrid = () => {},
    } = {}) => {
        if (!searchInputEl) return () => {};

        let lastSearchValue = "";

        const handleImmediateReload = () => {
            try {
                onBeforeReload();
            } catch (e) {
                console.debug?.(e);
            }
            try {
                startSearchTimer();
            } catch (e) {
                console.debug?.(e);
            }
            try {
                reloadGrid();
            } catch (e) {
                console.debug?.(e);
            }
        };

        const onInput = (event) => {
            const value = event?.target?.value ?? "";
            if (value === lastSearchValue) return;
            lastSearchValue = value;

            try {
                onQueryChanged(value);
            } catch (e) {
                console.debug?.(e);
            }

            if (searchDebounceTimer) clearTimeout(searchDebounceTimer);

            if (value.length === 0 || value === "*") {
                handleImmediateReload();
                return;
            }

            searchDebounceTimer = setTimeout(() => {
                searchDebounceTimer = null;
                handleImmediateReload();
            }, debounceMs);
        };

        const onKeypress = (event) => {
            if (event?.key !== "Enter") return;
            if (searchDebounceTimer) {
                clearTimeout(searchDebounceTimer);
                searchDebounceTimer = null;
            }
            handleImmediateReload();
        };

        searchInputEl.addEventListener("input", onInput, {
            signal: lifecycleSignal || undefined,
        });
        searchInputEl.addEventListener("keypress", onKeypress, {
            signal: lifecycleSignal || undefined,
        });

        return () => {
            if (searchDebounceTimer) {
                clearTimeout(searchDebounceTimer);
                searchDebounceTimer = null;
            }
            try {
                searchInputEl.removeEventListener("input", onInput);
            } catch (e) {
                console.debug?.(e);
            }
            try {
                searchInputEl.removeEventListener("keypress", onKeypress);
            } catch (e) {
                console.debug?.(e);
            }
        };
    };

    return {
        queuedReload,
        restoreUiState,
        scheduleAutoLoad,
        createCountersUpdateHandler,
        bindSearchInput,
        setVisibility(visible = null) {
            return syncVisibilityState(visible);
        },
        dispose() {
            if (autoLoadTimer) {
                clearTimeout(autoLoadTimer);
                autoLoadTimer = null;
            }
            pendingAutoLoadPromise = null;
            pendingAutoLoadDelayMs = 0;
            if (searchDebounceTimer) {
                clearTimeout(searchDebounceTimer);
                searchDebounceTimer = null;
            }
        },
    };
}
