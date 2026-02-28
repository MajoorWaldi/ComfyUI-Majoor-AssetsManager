/**
 * Entry Point - Majoor Assets Manager
 * Registers extension with ComfyUI and mounts UI.
 */

import { testAPI, triggerStartupScan } from "./app/bootstrap.js";
import { checkMajoorVersion } from "./app/versionCheck.js";
import { ensureStyleLoaded } from "./app/style.js";
import { registerMajoorSettings, startRuntimeStatusDashboard } from "./app/settings.js";
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
import { initLiveStreamTracker } from "./features/viewer/LiveStreamTracker.js";
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
            } catch (e) { console.debug?.(e); }
            window[ENTRY_RUNTIME_KEY] = { api: null, assetsDeletedHandler: null };
        }
    } catch (e) { console.debug?.(e); }
}

// Deduplication for executed events (ComfyUI can fire multiple times for same file)
const DEDUPE_TTL_MS = 2000;
const recentFiles = new Map(); // key -> timestamp

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
        const key = `${f.type || ""}|${f.subfolder || ""}|${f.filename || ""}`.toLowerCase();
        if (!recentFiles.has(key)) {
            recentFiles.set(key, now);
            fresh.push(f);
        }
    }
    return fresh;
}

app.registerExtension({
    name: "Majoor.AssetsManager",

    async setup() {
        installEntryRuntimeController();
        const runtimeApp = (await waitForComfyApp({ timeoutMs: 6000 })) || app;
        setComfyApp(runtimeApp);

        // Initialize core services
        testAPI();
        ensureStyleLoaded({ enabled: UI_FLAGS.useComfyThemeUI });
        startRuntimeStatusDashboard();

        try {
            initDragDrop();
        } catch (e) { console.debug?.(e); }

        try {
            initLiveStreamTracker(runtimeApp);
        } catch (e) { console.debug?.(e); }

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
                removeApiHandlers(api);
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

                        post(ENDPOINTS.INDEX_FILES, { files, origin: "generation" })
                            .catch((error) => reportError(error, "entry.executed.index"));
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
                            // Only reload when the active grid shows output or "all" scope.
                            const scope = grid.dataset?.mjrScope || "output";
                            if (scope !== "output" && scope !== "all") return;
                            // Scroll to top first so the grid shows position 0 as soon as the
                            // reload response arrives — new asset appears at the top.
                            scrollGridToTop(grid);
                            // Full reload so the new asset is correctly sorted by the server.
                            const query = grid.dataset?.mjrQuery || "*";
                            loadAssets(grid, query).catch(() => {});
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
                            upsertAsset(grid, event.detail);
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
                tooltip: t("tooltip.sidebarTab"),
                type: "custom",
                render: (el) => {
                    void renderAssetsManager(el, { useComfyThemeUI: UI_FLAGS.useComfyThemeUI });
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
});
