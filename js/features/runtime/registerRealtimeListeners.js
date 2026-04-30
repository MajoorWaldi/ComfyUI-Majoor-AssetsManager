import { EVENTS } from "../../app/events.js";
import { recordToastHistory } from "../../app/toast.js";
import { vectorIndexAsset } from "../../api/client.js";

const AUTO_VECTOR_INDEX_DEDUPE_MS = 30_000;
const _autoVectorIndexSeenAt = new Map();
const LIVE_PLACEHOLDER_PREFIX = "live";

function toNullableBool(value) {
    if (value === true || value === 1 || value === "1") return true;
    if (value === false || value === 0 || value === "0") return false;
    return null;
}

function hasVectorEmbedding(detail) {
    const flags = [
        detail?.has_ai_vector,
        detail?.hasAiVector,
        detail?.has_vector_embedding,
        detail?.hasVectorEmbedding,
        detail?.vector_indexed,
        detail?.vectorIndexed,
    ];
    for (const flag of flags) {
        const parsed = toNullableBool(flag);
        if (parsed !== null) return parsed;
    }
    return false;
}

function shouldSkipAutoVectorIndex(assetId) {
    const now = Date.now();
    const previous = Number(_autoVectorIndexSeenAt.get(assetId) || 0);
    if (previous > 0 && now - previous < AUTO_VECTOR_INDEX_DEDUPE_MS) {
        return true;
    }
    _autoVectorIndexSeenAt.set(assetId, now);
    if (_autoVectorIndexSeenAt.size > 500) {
        const minTs = now - 5 * AUTO_VECTOR_INDEX_DEDUPE_MS;
        for (const [id, ts] of _autoVectorIndexSeenAt.entries()) {
            if (Number(ts) < minTs) _autoVectorIndexSeenAt.delete(id);
        }
    }
    return false;
}

function maybeAutoVectorIndexAsset(detail) {
    const assetId = String(detail?.id || "").trim();
    if (!assetId) return;
    if (hasVectorEmbedding(detail)) return;
    if (shouldSkipAutoVectorIndex(assetId)) return;
    void vectorIndexAsset(assetId).catch((e) =>
        console.debug?.("[Majoor] auto vector index failed", e),
    );
}

function inferLiveAssetKind(detail) {
    const explicit = String(detail?.kind || "")
        .trim()
        .toLowerCase();
    if (explicit) return explicit;
    const rawName = String(
        detail?.filename || detail?.filepath || detail?.path || detail?.fullpath || "",
    ).trim();
    const ext = rawName.includes(".") ? rawName.split(".").pop()?.toLowerCase?.() || "" : "";
    if (!ext) return "";
    if (
        [
            "png",
            "jpg",
            "jpeg",
            "webp",
            "gif",
            "bmp",
            "tif",
            "tiff",
            "avif",
            "heic",
            "heif",
        ].includes(ext)
    ) {
        return "image";
    }
    if (["mp4", "webm", "mov", "mkv", "avi", "m4v"].includes(ext)) return "video";
    if (["mp3", "wav", "flac", "ogg"].includes(ext)) return "audio";
    if (["glb", "gltf", "obj", "fbx", "ply", "stl", "splat", "ksplat", "spz"].includes(ext)) {
        return "model3d";
    }
    return "unknown";
}

function buildLivePlaceholderAsset(detail, { jobId = "" } = {}) {
    const filename = String(detail?.filename || "").trim();
    const rawPath = String(
        detail?.filepath || detail?.path || detail?.fullpath || detail?.full_path || "",
    ).trim();
    const subfolder = String(
        detail?.subfolder || detail?.sub_folder || detail?.subFolder || "",
    ).trim();
    const type = String(detail?.type || detail?.source || "output")
        .trim()
        .toLowerCase();
    const rootId = String(detail?.root_id || detail?.custom_root_id || "").trim();
    const kind = inferLiveAssetKind(detail);
    if (!kind || (!filename && !rawPath)) return null;
    const normalizedName = filename || rawPath.split(/[/\\]/).filter(Boolean).pop() || "";
    if (!normalizedName) return null;
    const normalizedPath =
        rawPath || (subfolder ? `${subfolder}/${normalizedName}` : normalizedName);
    const identity = [type || "output", rootId, subfolder, normalizedName]
        .map((part) =>
            String(part || "")
                .trim()
                .toLowerCase(),
        )
        .join("|");
    const nowSeconds = Date.now() / 1000;
    const nextJobId = String(detail?.job_id || jobId || "").trim();
    return {
        id: `${LIVE_PLACEHOLDER_PREFIX}:${identity || normalizedPath.toLowerCase()}`,
        filename: normalizedName,
        filepath: normalizedPath,
        path: normalizedPath,
        subfolder,
        type: type || "output",
        source: type || "output",
        kind,
        mtime: Number(detail?.mtime) || nowSeconds,
        has_workflow: detail?.has_workflow ?? detail?.hasWorkflow ?? null,
        has_generation_data: detail?.has_generation_data ?? detail?.hasGenerationData ?? null,
        generation_time_ms:
            Number.isFinite(Number(detail?.generation_time_ms)) &&
            Number(detail?.generation_time_ms) > 0
                ? Number(detail.generation_time_ms)
                : undefined,
        source_node_id: String(detail?.source_node_id || "").trim() || undefined,
        source_node_type: String(detail?.source_node_type || "").trim() || undefined,
        job_id: nextJobId || undefined,
        root_id: rootId || undefined,
        custom_root_id: rootId || undefined,
        is_live_placeholder: true,
        _mjrLivePlaceholder: true,
        _mjrLiveStatus: "pending",
        _mjrLiveLabel: "In progress",
    };
}

function safeEscapeAssetId(value) {
    const raw = String(value || "");
    try {
        if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
            return CSS.escape(raw);
        }
    } catch (e) {
        console.debug?.(e);
    }
    return raw.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, "\\$1");
}

function resolveMaintenanceTitle(op, t) {
    const operation = String(op || "")
        .trim()
        .toLowerCase();
    if (operation === "delete_db") return t("btn.deleteDb", "Delete DB");
    if (operation === "reset_index") return t("btn.resetIndex", "Reset index");
    if (operation === "restore_db") return t("btn.dbRestore", "Restore DB");
    return t("btn.maintenance", "Maintenance");
}

function buildMaintenanceProgress(op, step) {
    const operation = String(op || "")
        .trim()
        .toLowerCase();
    const currentStep = String(step || "")
        .trim()
        .toLowerCase();
    const flows = {
        delete_db: [
            "started",
            "stopping_workers",
            "resetting_db",
            "delete_db",
            "recreate_db",
            "restarting_scan",
            "done",
        ],
        reset_index: ["started", "stopping_workers", "resetting_db", "restarting_scan", "done"],
        db_restore: [
            "started",
            "stopping_workers",
            "resetting_db",
            "replacing_files",
            "restarting_scan",
            "done",
        ],
    };
    const steps = flows[operation] || flows.db_restore;
    const index = steps.indexOf(currentStep);
    const current = Math.min(steps.length, index >= 0 ? index + 1 : 0);
    const total = steps.length;
    return {
        current,
        total,
        percent: Math.round((current / total) * 100),
        label: currentStep.replace(/[_-]+/g, " "),
    };
}

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
    upsertAssetNow,
    removeAssetsFromGrid,
    getEnrichmentState,
    setEnrichmentState,
    comfyToast,
    t,
    reportError,
    registerCleanableListener,
    syncExecutionBackendState,
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
            void syncExecutionBackendState?.({
                active: true,
                promptId: event?.detail?.prompt_id || event?.detail?.promptId || "",
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
            void syncExecutionBackendState?.({
                active: false,
                promptId: event?.detail?.prompt_id || event?.detail?.promptId || "",
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
                progress_value: Number.isFinite(Number(detail?.value))
                    ? Number(detail.value)
                    : null,
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
                    detail?.prompt_id ||
                    detail?.promptId ||
                    ensureExecutionRuntime().active_prompt_id ||
                    null,
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

    function upsertLiveAssetIntoGrid(grid, detail, { immediate = false, force = false } = {}) {
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
                        `.mjr-asset-card[data-mjr-asset-id="${safeEscapeAssetId(assetId)}"]`,
                    );
                }
            } catch (e) {
                console.debug?.(e);
            }
        }
        const canUpsert = hasRenderableFields || existsInGrid;
        // For new assets (not yet in the grid), only upsert when the search is a
        // wildcard. This prevents injecting irrelevant assets into active text
        // filters (e.g. "gnome") regardless of which handler triggered the upsert.
        // Existing-asset updates always proceed so in-place metadata stays fresh.
        // The `force` flag bypasses this guard for ASSET_INDEXED events, which must
        // always surface the freshly-indexed asset regardless of the active query.
        if (!existsInGrid && canUpsert && !force) {
            const currentQuery = String(grid?.dataset?.mjrQuery || "*").trim() || "*";
            if (currentQuery !== "*") return;
        }
        // Ensure freshly-generated assets sort at the top (mtime_desc) even when
        // the backend event omits ``mtime``. Without a fallback the asset lands at
        // the very end of the list (getSortValue returns 0 for missing mtime).
        let liveDetail =
            !existsInGrid && canUpsert && !detail.mtime
                ? { ...detail, mtime: Date.now() / 1000 }
                : detail;
        // For brand-new generation assets that haven't been enriched yet,
        // force has_workflow/has_generation_data to null so the workflow dot
        // shows as "pending" (blue) while enrichment runs in the background.
        // A subsequent mjr-asset-updated event with the real values will update
        // the card in-place once enrichment completes.
        if (!existsInGrid && canUpsert) {
            const hwVal = detail.has_workflow ?? detail.hasWorkflow;
            const hgVal = detail.has_generation_data ?? detail.hasGenerationData;
            if (hwVal == null && hgVal == null) {
                // Already pending — no change needed
            } else if (hwVal == null || hgVal == null) {
                // Partially missing — normalise to null so dot stays pending
                liveDetail = {
                    ...liveDetail,
                    has_workflow: hwVal ?? null,
                    has_generation_data: hgVal ?? null,
                };
            }
            // If both are present (0/1) the backend has already done inline
            // metadata extraction — honour the real values.
        }
        // Use immediate flush for fresh generation events to bypass the
        // 200 ms debounce and show the card as soon as the WS event arrives.
        const doUpsert =
            immediate && typeof upsertAssetNow === "function" ? upsertAssetNow : upsertAsset;
        const handled = canUpsert ? !!doUpsert(grid, liveDetail) : false;
        if (handled) {
            markRecentAssetUpsert();
        }
    }

    api._mjrNewGenerationOutputHandler = (event) => {
        try {
            const grid = getActiveGridContainer();
            if (!grid) return;
            const scope = String(grid?.dataset?.mjrScope || "output")
                .trim()
                .toLowerCase();
            if (scope !== "output" && scope !== "all") return;
            const files = Array.isArray(event?.detail?.files) ? event.detail.files : [];
            const promptId = String(
                event?.detail?.prompt_id || event?.detail?.promptId || "",
            ).trim();
            for (const file of files) {
                const placeholder = buildLivePlaceholderAsset(file, { jobId: promptId });
                if (!placeholder) continue;
                upsertLiveAssetIntoGrid(grid, placeholder, { immediate: true, force: true });
            }
        } catch (error) {
            reportError(error, "entry.new_generation_output");
        }
    };
    registerCleanableListener(
        runtime,
        window,
        EVENTS.NEW_GENERATION_OUTPUT,
        api._mjrNewGenerationOutputHandler,
    );

    api._mjrAssetAddedHandler = (event) => {
        try {
            const grid = getActiveGridContainer();
            if (grid && event?.detail) {
                const liveEvent = executionRuntime.prepareLiveAssetEvent(event.detail);
                const detail = liveEvent?.detail || event.detail;
                const renderable = executionRuntime.isRenderableLiveAsset(detail);
                if (renderable) {
                    pushGeneratedAsset(detail);
                }
                maybeAutoVectorIndexAsset(detail);
                const scope = grid.dataset?.mjrScope || "output";
                if (scope !== "output" && scope !== "all") return;
                const query = grid.dataset?.mjrQuery || "*";
                const canDirectUpsert = String(query).trim() === "*";
                if (canDirectUpsert && renderable) {
                    upsertLiveAssetIntoGrid(grid, detail, { immediate: true });
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
                const detail = liveEvent?.detail || event.detail;
                if (executionRuntime.isRenderableLiveAsset(detail)) {
                    pushGeneratedAsset(detail);
                }
                // Use immediate flush for updates to assets already visible in
                // the grid (enrichment / vector indexing results). This avoids
                // a 200 ms debounce window during which the card shows stale
                // metadata or temporarily disappears then reappears.
                upsertLiveAssetIntoGrid(grid, detail, { immediate: true });
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
                const nextDetail = liveEvent?.detail || detail;
                if (executionRuntime.isRenderableLiveAsset(nextDetail)) {
                    pushGeneratedAsset(nextDetail);
                }
                maybeAutoVectorIndexAsset(nextDetail);
                upsertLiveAssetIntoGrid(grid, nextDetail, { immediate: true, force: true });
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
                comfyToast(
                    t("toast.enrichmentComplete", "Metadata enrichment complete"),
                    "success",
                    2600,
                );
            }
        } catch (e) {
            console.debug?.(e);
        }
    };
    registerCleanableListener(
        runtime,
        api,
        EVENTS.ENRICHMENT_STATUS,
        api._mjrEnrichmentStatusHandler,
    );

    api._mjrDbRestoreStatusHandler = (event) => {
        try {
            const detail = event?.detail || {};
            const step = String(detail?.step || "");
            const level = String(detail?.level || "info");
            const op = String(detail?.operation || "");
            window.dispatchEvent(new CustomEvent(EVENTS.DB_RESTORE_STATUS, { detail }));
            const isDelete = op === "delete_db";
            const isReset = op === "reset_index";
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
                    ? t(
                          "toast.dbDeleteSuccess",
                          "Database deleted and rebuilt. Files are being reindexed.",
                      )
                    : isReset
                      ? t(
                            "toast.resetStarted",
                            "Index reset started. Files will be reindexed in the background.",
                        )
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
            const historyOpts = {
                history: {
                    trackId: `maintenance:${
                        String(op || "db_restore")
                            .trim()
                            .toLowerCase() || "db_restore"
                    }`,
                    title: resolveMaintenanceTitle(op, t),
                    detail: msg,
                    status: step,
                    operation: String(op || "db_restore")
                        .trim()
                        .toLowerCase(),
                    progress: buildMaintenanceProgress(op, step),
                    source: String(detail?.name || "").trim() || "maintenance",
                    forceStore: true,
                },
            };
            if (isDelete && !["started", "done", "failed"].includes(step)) {
                recordToastHistory(msg, tone, 0, historyOpts);
                return;
            }
            comfyToast(msg, tone, step === "done" || step === "failed" ? 2800 : 1800, historyOpts);
        } catch (e) {
            console.debug?.(e);
        }
    };
    registerCleanableListener(
        runtime,
        api,
        EVENTS.DB_RESTORE_STATUS,
        api._mjrDbRestoreStatusHandler,
    );

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
