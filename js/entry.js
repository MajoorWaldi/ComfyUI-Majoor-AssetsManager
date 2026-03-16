/**
 * Entry Point - Majoor Assets Manager
 * Registers extension with ComfyUI and mounts UI.
 */

import { testAPI, triggerStartupScan } from "./app/bootstrap.js";
import { checkMajoorVersion } from "./app/versionCheck.js";
import { ensureStyleLoaded } from "./app/style.js";
import { buildMajoorSettings, registerMajoorSettings } from "./app/settings.js";
import {
    getComfyApi,
    registerSidebarTabCompat,
    setComfyApi,
    setComfyApp,
    waitForComfyApi,
    waitForComfyApp
} from "./app/comfyApiBridge.js";
import { EVENTS } from "./app/events.js";
import { initDragDrop } from "./features/dnd/DragDrop.js";
import { initLiveStreamTracker, teardownLiveStreamTracker, setCurrentJobId } from "./features/viewer/LiveStreamTracker.js";
import { teardownFloatingViewerManager } from "./features/viewer/floatingViewerManager.js";
import { loadAssets, upsertAsset, scrollGridToTop, removeAssetsFromGrid } from "./features/grid/GridView.js";
import { renderAssetsManager, getActiveGridContainer } from "./features/panel/AssetsManagerPanel.js";
import { extractOutputFiles } from "./utils/extractOutputFiles.js";
import { post } from "./api/client.js";
import { ENDPOINTS } from "./api/endpoints.js";
import { comfyToast } from "./app/toast.js";
import { t } from "./app/i18n.js";
import { getEnrichmentState, setEnrichmentState } from "./app/runtimeState.js";
import { reportError } from "./utils/logging.js";
import { app } from "../../scripts/app.js";

const UI_FLAGS = {
    useComfyThemeUI: true,
};

// Runtime cleanup key (used for hot-reload cleanup in ComfyUI)
const ENTRY_RUNTIME_KEY = "__MJR_ENTRY_RUNTIME__";

function removeApiHandlers(api) {
    if (!api) return;
    try {
        if (api._mjrAssetUpdateReloadTimer) {
            clearTimeout(api._mjrAssetUpdateReloadTimer);
            api._mjrAssetUpdateReloadTimer = null;
        }
        if (api._mjrExecutedHandler) {
            api.removeEventListener("executed", api._mjrExecutedHandler);
        }
        if (api._mjrAssetAddedHandler) {
            api.removeEventListener("mjr-asset-added", api._mjrAssetAddedHandler);
        }
        if (api._mjrAssetUpdatedHandler) {
            api.removeEventListener("mjr-asset-updated", api._mjrAssetUpdatedHandler);
        }
        if (api._mjrScanCompleteHandler) {
            api.removeEventListener(EVENTS.SCAN_COMPLETE, api._mjrScanCompleteHandler);
        }
        if (api._mjrExecutionStartHandler) {
            api.removeEventListener("execution_start", api._mjrExecutionStartHandler);
        }
        if (api._mjrExecutionEndHandler) {
            api.removeEventListener("execution_success", api._mjrExecutionEndHandler);
            api.removeEventListener("execution_error", api._mjrExecutionEndHandler);
            api.removeEventListener("execution_interrupted", api._mjrExecutionEndHandler);
        }
        if (api._mjrEnrichmentStatusHandler) {
            api.removeEventListener(EVENTS.ENRICHMENT_STATUS, api._mjrEnrichmentStatusHandler);
        }
        if (api._mjrDbRestoreStatusHandler) {
            api.removeEventListener(EVENTS.DB_RESTORE_STATUS, api._mjrDbRestoreStatusHandler);
        }
    } catch (error) {
        reportError(error, "entry.removeApiHandlers");
    }
}

function removeRuntimeWindowHandlers(runtime) {
    try {
        const handler = runtime?.assetsDeletedHandler;
        if (handler && typeof window !== "undefined") {
            window.removeEventListener(EVENTS.ASSETS_DELETED, handler);
        }
    } catch (error) {
        reportError(error, "entry.removeRuntimeWindowHandlers");
    }
}

function installEntryRuntimeController() {
    try {
        if (typeof window !== "undefined") {
            // Replace previous runtime entry to allow cleanup on hot-reload.
            // Handlers are removed explicitly via removeApiHandlers / removeRuntimeWindowHandlers.
            try {
                const prev = window[ENTRY_RUNTIME_KEY];
                removeApiHandlers(prev?.api || null);
                removeRuntimeWindowHandlers(prev);
            } catch (e) { console.warn("[MJR teardown]", e); }
            // Tear down MFV module-level listeners before re-registering (NM-3, NM-4).
            try { teardownLiveStreamTracker(window.__MJR_RUNTIME_APP__); } catch (e) { console.warn("[MJR teardown]", e); }
            try { teardownFloatingViewerManager(); } catch (e) { console.warn("[MJR teardown]", e); }
            window[ENTRY_RUNTIME_KEY] = { api: null, assetsDeletedHandler: null };
        }
    } catch (e) { console.warn("[MJR teardown]", e); }
}

// Deduplication for executed events (ComfyUI can fire multiple times for same file)
// Window (ms) to ignore duplicate file events from the same execution
const DEDUPE_TTL_MS = 2000;
const recentFiles = new Map(); // key -> timestamp
const INDEX_RETRYABLE_CODES = new Set(["DB_MAINTENANCE", "TIMEOUT", "NETWORK_ERROR", "SERVICE_UNAVAILABLE"]);
const INDEX_RETRY_MAX_ATTEMPTS = 8;
const INDEX_RETRY_BASE_DELAY_MS = 1200;
const INDEX_RETRY_MAX_DELAY_MS = 15_000;

// Track execution start times to compute generation duration
const EXECUTION_START_TTL_MS = 10 * 60 * 1000;
const executionStarts = new Map(); // prompt_id -> timestamp(ms)

function rememberExecutionStart(promptId, timestampMs) {
    if (!promptId) return;
    const ts = Number(timestampMs) || Date.now();
    executionStarts.set(String(promptId), ts);
    pruneExecutionStarts();
}

function pruneExecutionStarts() {
    const now = Date.now();
    for (const [key, ts] of executionStarts) {
        if (!ts || now - ts > EXECUTION_START_TTL_MS) {
            executionStarts.delete(key);
        }
    }
}

function dedupeFiles(files) {
    const now = Date.now();
    // Prune old entries
    for (const [key, ts] of recentFiles) {
        if (now - ts > DEDUPE_TTL_MS) recentFiles.delete(key);
    }
    // Filter out recently seen files
    const fresh = [];
    for (const f of files) {
        // toLowerCase for case-insensitive path dedup (Windows paths may differ in casing)
        const key = `${f.type || ""}|${f.subfolder || ""}|${f.filename || ""}`.toLowerCase();
        if (!recentFiles.has(key)) {
            recentFiles.set(key, now);
            fresh.push(f);
        }
    }
    return fresh;
}

function _indexRetryDelayMs(attempt) {
    const a = Math.max(1, Number(attempt) || 1);
    const exp = Math.min(6, a - 1);
    return Math.min(INDEX_RETRY_MAX_DELAY_MS, INDEX_RETRY_BASE_DELAY_MS * (2 ** exp));
}

function _shouldRetryIndexResponse(res) {
    const code = String(res?.code || "").trim().toUpperCase();
    return INDEX_RETRYABLE_CODES.has(code);
}

function scheduleGenerationIndex(files, attempt = 1) {
    const payloadFiles = Array.isArray(files) ? files : [];
    if (!payloadFiles.length) return;
    post(ENDPOINTS.INDEX_FILES, { files: payloadFiles, origin: "generation" })
        .then((res) => {
            if (res?.ok) return;
            if (_shouldRetryIndexResponse(res) && attempt < INDEX_RETRY_MAX_ATTEMPTS) {
                const delayMs = _indexRetryDelayMs(attempt);
                setTimeout(() => scheduleGenerationIndex(payloadFiles, attempt + 1), delayMs);
                return;
            }
            try {
                const code = String(res?.code || "INDEX_FAILED");
                const msg = String(res?.error || "Indexing generated files failed");
                reportError(new Error(`${code}: ${msg}`), "entry.executed.index");
            } catch (e) { console.debug?.(e); }
        })
        .catch((error) => reportError(error, "entry.executed.index"));
}

app.registerExtension({
    name: "Majoor.AssetsManager",
    settings: buildMajoorSettings(app),

    async setup() {
        installEntryRuntimeController();
        const runtimeApp = (await waitForComfyApp({ timeoutMs: 12000 })) || app;
        setComfyApp(runtimeApp);
        // Store app reference for teardown use in subsequent hot-reloads.
        try { if (typeof window !== "undefined") window.__MJR_RUNTIME_APP__ = runtimeApp; } catch (e) { console.debug?.(e); }

        // Initialize core services
        testAPI();
        ensureStyleLoaded({ enabled: UI_FLAGS.useComfyThemeUI });

        try {
            initDragDrop();
        } catch (e) { console.warn("[MJR setup] initDragDrop failed:", e); }

        try {
            initLiveStreamTracker(runtimeApp);
        } catch (e) { console.warn("[MJR setup] initLiveStreamTracker failed:", e); }

        registerMajoorSettings(runtimeApp, () => {
            const grid = getActiveGridContainer();
            if (grid) loadAssets(grid);
        });

        setTimeout(() => { void checkMajoorVersion(); }, 5000);

        // Initialize API listeners in the background so sidebar tab registration
        // is not blocked by API readiness polling.
        void (async () => {
            // Get ComfyUI API
            const api = (await waitForComfyApi({ app: runtimeApp, timeoutMs: 4000 })) || getComfyApi(runtimeApp);
            setComfyApi(api || null);
            if (api) {
                let runtime = null;
                try {
                    runtime = typeof window !== "undefined" ? (window[ENTRY_RUNTIME_KEY] || null) : null;
                } catch (e) { console.debug?.(e); }
                removeApiHandlers(runtime?.api || null);
                // Only clean up stale handlers on the new api if it is a different object
                // than the previous runtime's api (avoids redundant double-removal).
                if (api !== runtime?.api) removeApiHandlers(api);
                removeRuntimeWindowHandlers(runtime);

                // Listen for ComfyUI execution - extract output files and send to backend
                api._mjrExecutedHandler = (event) => {
                    try {
                        const outputFiles = dedupeFiles(extractOutputFiles(event?.detail?.output));
                        if (!outputFiles.length) return;

                        const promptId = event?.detail?.prompt_id || event?.detail?.promptId;
                        const startTs = promptId ? executionStarts.get(String(promptId)) : null;
                        const genTimeMs = startTs ? Math.max(0, Date.now() - startTs) : 0;

                        const files = genTimeMs > 0
                            ? outputFiles.map((f) => ({ ...f, generation_time_ms: genTimeMs }))
                            : outputFiles;

                        // Notify the MFV (and any other subscriber) that new files were generated.
                        try {
                            window.dispatchEvent(new CustomEvent(EVENTS.NEW_GENERATION_OUTPUT, { detail: { files } }));
                        } catch (e) { console.debug?.(e); }

                        scheduleGenerationIndex(files);
                    } catch (error) {
                        reportError(error, "entry.executed");
                    }
                };
                api.addEventListener("executed", api._mjrExecutedHandler);

                // Track execution start/end to compute duration
                api._mjrExecutionStartHandler = (event) => {
                    try {
                        const promptId = event?.detail?.prompt_id || event?.detail?.promptId;
                        const ts = event?.detail?.timestamp;
                        rememberExecutionStart(promptId, ts);
                        // Feed jobId to LiveStreamTracker so b_preview_with_metadata
                        // events from stale executions are filtered out (ComfyUI v1.42+).
                        setCurrentJobId(promptId || null);
                    } catch (error) {
                        reportError(error, "entry.execution_start");
                    }
                };
                api._mjrExecutionEndHandler = (event) => {
                    try {
                        const promptId = event?.detail?.prompt_id || event?.detail?.promptId;
                        if (promptId) {
                            executionStarts.delete(String(promptId));
                        }
                        pruneExecutionStarts();
                        // Clear jobId filter once execution completes.
                        setCurrentJobId(null);
                    } catch (error) {
                        reportError(error, "entry.execution_end");
                    }
                };
                api.addEventListener("execution_start", api._mjrExecutionStartHandler);
                api.addEventListener("execution_success", api._mjrExecutionEndHandler);
                api.addEventListener("execution_error", api._mjrExecutionEndHandler);
                api.addEventListener("execution_interrupted", api._mjrExecutionEndHandler);

                // Listen for backend push - upsert asset directly to grid
                api._mjrAssetAddedHandler = (event) => {
                    try {
                        const grid = getActiveGridContainer();
                        if (grid && event?.detail) {
                            // Only handle direct updates when the active grid shows output or "all" scope.
                            const scope = grid.dataset?.mjrScope || "output";
                            if (scope !== "output" && scope !== "all") return;
                            const query = grid.dataset?.mjrQuery || "*";
                            const canDirectUpsert = String(query).trim() === "*";
                            let handled = false;
                            if (canDirectUpsert) {
                                handled = !!upsertAsset(grid, event.detail);
                                if (handled) scrollGridToTop(grid);
                            }
                            if (!handled) {
                                // Fallback reload for filtered views or missing upsert context.
                                loadAssets(grid, query).catch(() => {});
                            }
                            // Signal that we handled this event so handleCountersUpdate skips
                            // its own fallback reload within the next 6 s.
                            try { window.__mjrLastAssetUpsert = Date.now(); } catch (e) { console.debug?.(e); }
                        }
                    } catch (error) {
                        reportError(error, "entry.asset_added");
                    }
                };
                api.addEventListener("mjr-asset-added", api._mjrAssetAddedHandler);

                api._mjrAssetUpdatedHandler = (event) => {
                    try {
                        const grid = getActiveGridContainer();
                        if (grid && event?.detail) {
                            const detail = event.detail;
                            const assetId = String(detail?.id || "").trim();
                            const kind = String(detail?.kind || "").trim();
                            const filename = String(detail?.filename || "").trim();
                            const filepath = String(detail?.filepath || "").trim();
                            const hasRenderableFields = !!kind && (!!filename || !!filepath);
                            let existsInGrid = false;
                            if (assetId) {
                                try {
                                    const escapedId = CSS?.escape ? CSS.escape(assetId) : assetId;
                                    existsInGrid = !!grid.querySelector(
                                        `.mjr-asset-card[data-mjr-asset-id="${escapedId}"]`
                                    );
                                } catch (e) { console.debug?.(e); }
                            }

                            const canUpsert = hasRenderableFields || existsInGrid;
                            const handled = canUpsert ? !!upsertAsset(grid, detail) : false;
                            if (handled) {
                                try { window.__mjrLastAssetUpsert = Date.now(); } catch (e) { console.debug?.(e); }
                                return;
                            }

                            // Ignore non-renderable partial updates for unseen assets, but force
                            // a debounced fallback reload so generated files still appear.
                            const scope = grid.dataset?.mjrScope || "output";
                            if (scope === "output" || scope === "all") {
                                const query = grid.dataset?.mjrQuery || "*";
                                try {
                                    if (api._mjrAssetUpdateReloadTimer) {
                                        clearTimeout(api._mjrAssetUpdateReloadTimer);
                                    }
                                } catch (e) { console.debug?.(e); }
                                api._mjrAssetUpdateReloadTimer = setTimeout(() => {
                                    api._mjrAssetUpdateReloadTimer = null;
                                    loadAssets(grid, query).catch(() => {});
                                }, 700);
                            }
                        }
                    } catch (error) {
                        reportError(error, "entry.asset_updated");
                    }
                };
                api.addEventListener("mjr-asset-updated", api._mjrAssetUpdatedHandler);

                // Listen for scan-complete events to avoid "Unknown message type" warnings
                api._mjrScanCompleteHandler = (event) => {
                    try {
                        const detail = event?.detail || {};
                        window.dispatchEvent(new CustomEvent(EVENTS.SCAN_COMPLETE, { detail }));
                    } catch (e) { console.debug?.(e); }
                };
                api.addEventListener(EVENTS.SCAN_COMPLETE, api._mjrScanCompleteHandler);

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
                        // Do not force a full grid reset on enrichment state flips.
                        // Panel-level listeners handle refresh with scroll/selection anchor preservation.
                        if (prev && !active) {
                            comfyToast(t("toast.enrichmentComplete", "Metadata enrichment complete"), "success", 2600);
                        }
                    } catch (e) { console.debug?.(e); }
                };
                api.addEventListener(EVENTS.ENRICHMENT_STATUS, api._mjrEnrichmentStatusHandler);

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
                                detail?.message
                                    || (isDelete
                                        ? t("toast.dbDeleteFailed", "Failed to delete database")
                                        : isReset
                                        ? t("toast.resetFailed", "Failed to reset index")
                                        : t("toast.dbRestoreFailed", "Failed to restore DB backup"))
                            ),
                        };
                        const msg = map[step] || String(detail?.message || "");
                        if (!msg) return;
                        const tone = level === "error" || step === "failed" ? "error" : step === "done" ? "success" : "info";
                        comfyToast(msg, tone, step === "done" || step === "failed" ? 2800 : 1800);
                    } catch (e) { console.debug?.(e); }
                };
                api.addEventListener(EVENTS.DB_RESTORE_STATUS, api._mjrDbRestoreStatusHandler);

                const assetsDeletedHandler = (event) => {
                    try {
                        const ids = Array.isArray(event?.detail?.ids)
                            ? event.detail.ids.map((x) => String(x || "")).filter(Boolean)
                            : [];
                        if (!ids.length) return;
                        const grid = getActiveGridContainer();
                        if (grid) removeAssetsFromGrid(grid, ids);
                    } catch (e) { console.debug?.(e); }
                };
                window.addEventListener(EVENTS.ASSETS_DELETED, assetsDeletedHandler);
                try {
                    if (runtime && typeof runtime === "object") {
                        runtime.api = api;
                        runtime.assetsDeletedHandler = assetsDeletedHandler;
                    }
                } catch (error) {
                    reportError(error, "entry.runtime_store");
                }
                triggerStartupScan();
                console.debug("[Majoor] Real-time listener registered");
            } else {
                console.warn("📂 Majoor [⚠️] API not available, real-time updates disabled");
            }
        })();

        // Register sidebar tab
        if (registerSidebarTabCompat(runtimeApp, {
                id: "majoor-assets",
                icon: "pi pi-folder",
                title: t("manager.title"),
                label: t("manager.sidebarLabel"),
                tooltip: t("tooltip.sidebarTab"),
                type: "custom",
                render: (el) => {
                    void renderAssetsManager(el, { useComfyThemeUI: UI_FLAGS.useComfyThemeUI });
                },
                destroy: (el) => {
                    try {
                        el?._eventCleanup?.();
                    } catch (e) { console.debug?.(e); }
                    try {
                        el?._mjrPanelState?._mjrDispose?.();
                    } catch (e) { console.debug?.(e); }
                    try {
                        el?._mjrPopoverManager?.dispose?.();
                    } catch (e) { console.debug?.(e); }
                    try {
                        el?.replaceChildren?.();
                    } catch (e) { console.debug?.(e); }
                },
            })) {

            console.debug("[Majoor] Sidebar tab registered");
        } else {
            console.warn("📂 Majoor Assets Manager: extensionManager.registerSidebarTab is unavailable");
        }

        // Export metrics for debugging (accessible via console)
        if (typeof window !== "undefined") {
            window.MajoorDebug = {
                exportMetrics: () => window.MajoorMetrics?.exportMetrics?.(),
                getMetrics: () => window.MajoorMetrics?.getMetricsReport?.(),
                resetMetrics: () => window.MajoorMetrics?.resetMetrics?.(),
            };
            console.log("[Majoor] Debug commands available: window.MajoorDebug.exportMetrics(), window.MajoorDebug.getMetrics(), window.MajoorDebug.resetMetrics()");
        }
    },

    /**
     * ComfyUI v1.42+ hook: fires when individual node outputs are updated during execution.
     * @param {Map<string, object>} nodeOutputs - Map of nodeId → outputs object
     */
    onNodeOutputsUpdated(nodeOutputs) {
        try {
            const files = [];
            for (const [, outputs] of (nodeOutputs instanceof Map ? nodeOutputs.entries() : Object.entries(nodeOutputs || {}))) {
                for (const items of Object.values(outputs || {})) {
                    if (!Array.isArray(items)) continue;
                    for (const item of items) {
                        if (item?.filename && item?.type) files.push(item);
                    }
                }
            }
            if (!files.length) return;
            scheduleGenerationIndex(files);
        } catch (e) {
            console.debug?.("[Majoor] onNodeOutputsUpdated error", e);
        }
    },
});
