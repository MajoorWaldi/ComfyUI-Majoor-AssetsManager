import { EVENTS } from "../../app/events.js";

export async function registerRealtimeListeners({
    api,
    runtime,
    executionRuntime,
    appRef,
    liveStreamModule,
    ensureExecutionRuntime,
    emitRuntimeStatus,
    getActiveGridContainer,
    pushGeneratedAsset,
    upsertAsset,
    removeAssetsFromGrid,
    getEnrichmentState,
    setEnrichmentState,
    comfyToast,
    t,
    reportError,
    registerCleanableListener,
}) {
    api._mjrExecutedHandler = (event) => {
        try {
            executionRuntime.handleExecutedEvent(event, { appRef });
        } catch (error) {
            reportError(error, "entry.executed");
        }
    };
    registerCleanableListener(runtime, api, "executed", api._mjrExecutedHandler);

    api._mjrExecutionStartHandler = (event) => {
        try {
            executionRuntime.handleExecutionStart(event, {
                setCurrentJobId: (jobId) => liveStreamModule?.setCurrentJobId(jobId),
            });
        } catch (error) {
            reportError(error, "entry.execution_start");
        }
    };
    api._mjrExecutionEndHandler = (event) => {
        try {
            executionRuntime.handleExecutionEnd(event, {
                setCurrentJobId: (jobId) => liveStreamModule?.setCurrentJobId(jobId),
            });
        } catch (error) {
            reportError(error, "entry.execution_end");
        }
    };
    api._mjrStacksUpdatedHandler = (event) => {
        try {
            executionRuntime.notifyStacksUpdated(event?.detail || {});
        } catch (error) {
            reportError(error, "entry.stacks_updated");
        }
    };
    api._mjrRuntimeStatusHandler = (event) => {
        try {
            const detail = event?.detail || {};
            emitRuntimeStatus({
                progress_node: detail?.node ?? null,
                progress_value: Number.isFinite(Number(detail?.value)) ? Number(detail.value) : null,
                progress_max: Number.isFinite(Number(detail?.max)) ? Number(detail.max) : null,
                queue_remaining: Number.isFinite(Number(detail?.exec_info?.queue_remaining))
                    ? Number(detail.exec_info.queue_remaining)
                    : Number.isFinite(Number(detail?.queue_remaining))
                      ? Number(detail.queue_remaining)
                      : ensureExecutionRuntime().queue_remaining,
            });
        } catch (error) {
            reportError(error, "entry.runtime_status");
        }
    };
    api._mjrExecutionCachedHandler = (event) => {
        try {
            const detail = event?.detail || {};
            emitRuntimeStatus({
                active_prompt_id:
                    detail?.prompt_id || detail?.promptId || ensureExecutionRuntime().active_prompt_id || null,
                cached_nodes: Array.isArray(detail?.nodes) ? detail.nodes.slice() : [],
            });
        } catch (error) {
            reportError(error, "entry.execution_cached");
        }
    };
    registerCleanableListener(runtime, api, "execution_start", api._mjrExecutionStartHandler);
    registerCleanableListener(runtime, api, "execution_success", api._mjrExecutionEndHandler);
    registerCleanableListener(runtime, api, "execution_error", api._mjrExecutionEndHandler);
    registerCleanableListener(runtime, api, "execution_interrupted", api._mjrExecutionEndHandler);
    registerCleanableListener(runtime, api, "mjr.stacks.updated", api._mjrStacksUpdatedHandler);
    registerCleanableListener(runtime, api, "progress", api._mjrRuntimeStatusHandler);
    registerCleanableListener(runtime, api, "status", api._mjrRuntimeStatusHandler);
    registerCleanableListener(runtime, api, EVENTS.RUNTIME_STATUS, api._mjrRuntimeStatusHandler);
    registerCleanableListener(runtime, api, "execution_cached", api._mjrExecutionCachedHandler);

    function markRecentAssetUpsert() {
        try {
            window.__mjrLastAssetUpsert = Date.now();
            window.__mjrLastAssetUpsertCount =
                (Number(window.__mjrLastAssetUpsertCount || 0) || 0) + 1;
        } catch (e) {
            console.debug?.(e);
        }
    }

    function upsertLiveAssetIntoGrid(grid, detail) {
        const assetId = String(detail?.id || "").trim();
        const kind = String(detail?.kind || "").trim();
        const filename = String(detail?.filename || "").trim();
        const filepath = String(detail?.filepath || "").trim();
        const hasRenderableFields = !!kind && (!!filename || !!filepath);
        let existsInGrid = false;
        if (assetId) {
            try {
                if (typeof grid?._mjrHasAssetId === "function") {
                    existsInGrid = !!grid._mjrHasAssetId(assetId);
                } else {
                    existsInGrid = !!grid.querySelector(
                        `.mjr-asset-card[data-mjr-asset-id="${assetId.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, "\\$1")}"]`,
                    );
                }
            } catch (e) {
                console.debug?.(e);
            }
        }
        const canUpsert = hasRenderableFields || existsInGrid;
        const handled = canUpsert ? !!upsertAsset(grid, detail) : false;
        if (handled) {
            markRecentAssetUpsert();
        }
    }

    api._mjrAssetAddedHandler = (event) => {
        try {
            const grid = getActiveGridContainer();
            if (grid && event?.detail) {
                const liveEvent = executionRuntime.prepareLiveAssetEvent(event.detail);
                // Deferred assets (multi-output, awaiting stack_id) are buffered so they
                // can be replayed once notifyStacksUpdated fires refreshGeneratedFeedHosts.
                // Previously they were silently dropped, causing invisible assets when stack
                // finalization succeeded but the WS event arrived before stack assignment.
                if (liveEvent?.defer) {
                    const detail = liveEvent?.detail || event.detail;
                    if (executionRuntime.isRenderableLiveAsset(detail)) {
                        pushGeneratedAsset(detail);
                    }
                    return;
                }
                const detail = liveEvent?.detail || event.detail;
                const renderable = executionRuntime.isRenderableLiveAsset(detail);
                if (renderable) {
                    pushGeneratedAsset(detail);
                }
                const scope = grid.dataset?.mjrScope || "output";
                if (scope !== "output" && scope !== "all") return;
                const query = grid.dataset?.mjrQuery || "*";
                const canDirectUpsert = String(query).trim() === "*";
                if (canDirectUpsert && renderable) {
                    const handled = !!upsertAsset(grid, detail);
                    if (handled) {
                        try {
                            window.__mjrLastAssetUpsert = Date.now();
                            window.__mjrLastAssetUpsertCount =
                                (Number(window.__mjrLastAssetUpsertCount || 0) || 0) + 1;
                        } catch (e) {
                            console.debug?.(e);
                        }
                    }
                }
            }
        } catch (error) {
            reportError(error, "entry.asset_added");
        }
    };
    registerCleanableListener(runtime, api, "mjr-asset-added", api._mjrAssetAddedHandler);

    api._mjrAssetUpdatedHandler = (event) => {
        try {
            const grid = getActiveGridContainer();
            if (grid && event?.detail) {
                const liveEvent = executionRuntime.prepareLiveAssetEvent(event.detail);
                if (liveEvent?.defer) return;
                const detail = liveEvent?.detail || event.detail;
                if (executionRuntime.isRenderableLiveAsset(detail)) {
                    pushGeneratedAsset(detail);
                }
                upsertLiveAssetIntoGrid(grid, detail);
            }
        } catch (error) {
            reportError(error, "entry.asset_updated");
        }
    };
    registerCleanableListener(runtime, api, "mjr-asset-updated", api._mjrAssetUpdatedHandler);

    api._mjrScanCompleteHandler = (event) => {
        try {
            const detail = event?.detail || {};
            window.dispatchEvent(new CustomEvent(EVENTS.SCAN_COMPLETE, { detail }));
        } catch (e) {
            console.debug?.(e);
        }
    };
    registerCleanableListener(runtime, api, EVENTS.SCAN_COMPLETE, api._mjrScanCompleteHandler);

    api._mjrScanProgressHandler = (event) => {
        try {
            const detail = event?.detail || {};
            window.dispatchEvent(new CustomEvent(EVENTS.SCAN_PROGRESS, { detail }));
        } catch (e) {
            console.debug?.(e);
        }
    };
    registerCleanableListener(runtime, api, EVENTS.SCAN_PROGRESS, api._mjrScanProgressHandler);

    api._mjrAssetIndexingHandler = (event) => {
        try {
            const detail = event?.detail || {};
            window.dispatchEvent(new CustomEvent(EVENTS.ASSET_INDEXING, { detail }));
        } catch (e) {
            console.debug?.(e);
        }
    };
    registerCleanableListener(runtime, api, EVENTS.ASSET_INDEXING, api._mjrAssetIndexingHandler);

    api._mjrAssetIndexedHandler = (event) => {
        try {
            const detail = event?.detail || {};
            window.dispatchEvent(new CustomEvent(EVENTS.ASSET_INDEXED, { detail }));
            const grid = getActiveGridContainer();
            if (grid && detail) {
                const liveEvent = executionRuntime.prepareLiveAssetEvent(detail);
                if (liveEvent?.defer) return;
                const nextDetail = liveEvent?.detail || detail;
                if (executionRuntime.isRenderableLiveAsset(nextDetail)) {
                    pushGeneratedAsset(nextDetail);
                }
                upsertLiveAssetIntoGrid(grid, nextDetail);
            }
        } catch (e) {
            console.debug?.(e);
        }
    };
    registerCleanableListener(runtime, api, EVENTS.ASSET_INDEXED, api._mjrAssetIndexedHandler);

    api._mjrEnrichmentStatusHandler = (event) => {
        try {
            const detail = event?.detail || {};
            const queued = Number(detail?.queued);
            const queueLeft = Number(detail?.queue_left);
            const queueLen = Number.isFinite(queued)
                ? Math.max(0, Math.floor(queued))
                : Number.isFinite(queueLeft)
                  ? Math.max(0, Math.floor(queueLeft))
                  : 0;
            const active = !!detail?.active || queueLen > 0;
            const prev = getEnrichmentState().active;
            setEnrichmentState(active, queueLen);
            window.dispatchEvent(new CustomEvent(EVENTS.ENRICHMENT_STATUS, { detail }));
            if (prev && !active) {
                comfyToast(t("toast.enrichmentComplete", "Metadata enrichment complete"), "success", 2600);
            }
        } catch (e) {
            console.debug?.(e);
        }
    };
    registerCleanableListener(runtime, api, EVENTS.ENRICHMENT_STATUS, api._mjrEnrichmentStatusHandler);

    api._mjrDbRestoreStatusHandler = (event) => {
        try {
            const detail = event?.detail || {};
            const step = String(detail?.step || "");
            const level = String(detail?.level || "info");
            const op = String(detail?.operation || "");
            window.dispatchEvent(new CustomEvent(EVENTS.DB_RESTORE_STATUS, { detail }));
            const isDelete = op === "delete_db";
            const isReset = op === "reset_index";
            if (isDelete && !["started", "done", "failed"].includes(step)) {
                return;
            }
            const map = {
                started: isDelete
                    ? t("toast.dbDeleteTriggered", "Deleting database and rebuilding...")
                    : isReset
                      ? t("toast.resetTriggered", "Reset triggered: Reindexing all files...")
                      : t("toast.dbRestoreStarted", "DB restore started"),
                stopping_workers: t("toast.dbRestoreStopping", "Stopping running workers"),
                resetting_db: t("toast.dbRestoreResetting", "Unlocking and resetting database"),
                delete_db: t("toast.dbDeleteTriggered", "Deleting database and rebuilding..."),
                recreate_db: t("toast.dbRestoreReplacing", "Recreating database"),
                replacing_files: t("toast.dbRestoreReplacing", "Replacing database files"),
                restarting_scan: t("toast.dbRestoreRescan", "Restarting scan"),
                done: isDelete
                    ? t("toast.dbDeleteSuccess", "Database deleted and rebuilt. Files are being reindexed.")
                    : isReset
                      ? t("toast.resetStarted", "Index reset started. Files will be reindexed in the background.")
                      : t("toast.dbRestoreSuccess", "Database backup restored"),
                failed: String(
                    detail?.message ||
                        (isDelete
                            ? t("toast.dbDeleteFailed", "Failed to delete database")
                            : isReset
                              ? t("toast.resetFailed", "Failed to reset index")
                              : t("toast.dbRestoreFailed", "Failed to restore DB backup")),
                ),
            };
            const msg = map[step] || String(detail?.message || "");
            if (!msg) return;
            const tone =
                level === "error" || step === "failed"
                    ? "error"
                    : step === "done"
                      ? "success"
                      : "info";
            comfyToast(msg, tone, step === "done" || step === "failed" ? 2800 : 1800);
        } catch (e) {
            console.debug?.(e);
        }
    };
    registerCleanableListener(runtime, api, EVENTS.DB_RESTORE_STATUS, api._mjrDbRestoreStatusHandler);

    const assetsDeletedHandler = (event) => {
        try {
            const ids = Array.isArray(event?.detail?.ids)
                ? event.detail.ids.map((x) => String(x || "")).filter(Boolean)
                : [];
            if (!ids.length) return;
            const grid = getActiveGridContainer();
            if (grid) removeAssetsFromGrid(grid, ids);
        } catch (e) {
            console.debug?.(e);
        }
    };
    registerCleanableListener(runtime, window, EVENTS.ASSETS_DELETED, assetsDeletedHandler);

    if (runtime && typeof runtime === "object") {
        runtime.api = api;
        runtime.assetsDeletedHandler = assetsDeletedHandler;
    }
    console.debug("[Majoor] Real-time listener registered");
}
