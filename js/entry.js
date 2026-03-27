/**
 * Entry Point - Majoor Assets Manager
 * Registers extension with ComfyUI and mounts UI.
 */

import { testAPI, triggerStartupScan } from "./app/bootstrap.js";
import { checkMajoorVersion } from "./app/versionCheck.js";
import { ensureStyleLoaded } from "./app/style.js";
import { buildMajoorSettings, registerMajoorSettings } from "./app/settings.js";
import {
    activateSidebarTabCompat,
    getComfyApi,
    registerBottomPanelTabCompat,
    registerSidebarTabCompat,
    registerCommandCompat,
    setComfyApi,
    setComfyApp,
    waitForComfyApi,
    waitForComfyApp
} from "./app/comfyApiBridge.js";
import { EVENTS } from "./app/events.js";
import { initDragDrop } from "./features/dnd/DragDrop.js";
import { teardownFloatingViewerManager, floatingViewerManager } from "./features/viewer/floatingViewerManager.js";
import { NODE_STREAM_FEATURE_ENABLED, NODE_STREAM_REACTIVATION_DOC } from "./features/viewer/nodeStream/nodeStreamFeatureFlag.js";
import { loadAssets, upsertAsset, removeAssetsFromGrid } from "./features/grid/GridView.js";
import { renderAssetsManager, getActiveGridContainer } from "./features/panel/AssetsManagerPanel.js";
import { getGeneratedFeedBottomPanelTab, pushGeneratedAsset } from "./features/bottomPanel/GeneratedFeedTab.js";
import { extractOutputFiles } from "./utils/extractOutputFiles.js";
import { post } from "./api/client.js";
import { ENDPOINTS } from "./api/endpoints.js";
import { comfyToast } from "./app/toast.js";
import { t } from "./app/i18n.js";
import { getEnrichmentState, setEnrichmentState } from "./app/runtimeState.js";
import { reportError } from "./utils/logging.js";
import { createTTLCache } from "./utils/ttlCache.js";
import { app } from "../../scripts/app.js";

// Lazy-loaded modules — resolved on first use to speed up startup.
/** @type {import("./features/viewer/LiveStreamTracker.js") | null} */
let _liveStreamMod = null;
/** @type {import("./features/viewer/nodeStream/NodeStreamController.js") | null} */
let _nodeStreamMod = null;

const UI_FLAGS = {
    useComfyThemeUI: true,
};

// Runtime cleanup key (used for hot-reload cleanup in ComfyUI)
const ENTRY_RUNTIME_KEY = "__MJR_ENTRY_RUNTIME__";
const SIDEBAR_TAB_ID = "majoor-assets";
const EXECUTION_RUNTIME_KEY = "__MJR_EXECUTION_RUNTIME__";

function ensureExecutionRuntime() {
    try {
        if (typeof window === "undefined") return {
            active_prompt_id: null,
            queue_remaining: null,
            progress_node: null,
            progress_value: null,
            progress_max: null,
            cached_nodes: [],
        };
        if (!window[EXECUTION_RUNTIME_KEY] || typeof window[EXECUTION_RUNTIME_KEY] !== "object") {
            window[EXECUTION_RUNTIME_KEY] = {
                active_prompt_id: null,
                queue_remaining: null,
                progress_node: null,
                progress_value: null,
                progress_max: null,
                cached_nodes: [],
            };
        }
        return window[EXECUTION_RUNTIME_KEY];
    } catch (e) {
        console.debug?.(e);
        return {};
    }
}

function emitRuntimeStatus(partial = {}) {
    try {
        const runtime = ensureExecutionRuntime();
        Object.assign(runtime, partial || {});
        window.dispatchEvent(new CustomEvent(EVENTS.RUNTIME_STATUS, { detail: { ...runtime } }));
    } catch (e) { console.debug?.(e); }
}

function openAssetsManagerPanel(runtimeApp) {
    const opened = activateSidebarTabCompat(runtimeApp, SIDEBAR_TAB_ID);
    if (!opened) {
        try {
            window.dispatchEvent(new Event(EVENTS.OPEN_ASSETS_MANAGER));
        } catch (e) { console.debug?.(e); }
    }
    return opened;
}

function triggerRefreshGrid() {
    try {
        window.dispatchEvent(new CustomEvent(EVENTS.RELOAD_GRID, { detail: { reason: "command" } }));
    } catch (e) { console.debug?.(e); }
}

function registerNativeCommands(runtimeApp) {
    const commands = [
        {
            id: "mjr.openAssetsManager",
            label: t("manager.title", "Assets Manager"),
            icon: "pi pi-folder-open",
            function: () => openAssetsManagerPanel(runtimeApp),
        },
        {
            id: "mjr.scanAssets",
            label: t("command.scanAssets", "Scan assets"),
            icon: "pi pi-refresh",
            function: () => triggerStartupScan(),
        },
        {
            id: "mjr.toggleFloatingViewer",
            label: t("command.toggleFloatingViewer", "Toggle floating viewer"),
            icon: "pi pi-images",
            function: () => window.dispatchEvent(new Event(EVENTS.MFV_TOGGLE)),
        },
        {
            id: "mjr.refreshAssetsGrid",
            label: t("command.refreshAssetsGrid", "Refresh assets grid"),
            icon: "pi pi-sync",
            function: () => triggerRefreshGrid(),
        },
    ];
    for (const command of commands) {
        registerCommandCompat(runtimeApp, command);
    }
}

function isMajoorTrackableNode(node) {
    const comfyClass = String(node?.comfyClass || node?.type || node?.constructor?.type || "").trim();
    if (!comfyClass) return false;
    return /save|load|preview/i.test(comfyClass);
}

function nodeMenuEntry(label, callback) {
    return {
        content: label,
        callback,
    };
}

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
        if (api._mjrRuntimeStatusHandler) {
            api.removeEventListener("progress", api._mjrRuntimeStatusHandler);
            api.removeEventListener("status", api._mjrRuntimeStatusHandler);
            api.removeEventListener("execution_cached", api._mjrExecutionCachedHandler);
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

function cleanupEntryRuntime(runtime) {
    if (!runtime || typeof runtime !== "object") return;
    try {
        const cleanups = Array.isArray(runtime._listenerCleanupFns) ? runtime._listenerCleanupFns : [];
        for (const cleanup of cleanups) {
            try {
                cleanup?.();
            } catch (e) { console.debug?.(e); }
        }
        runtime._listenerCleanupFns = [];
    } catch (e) { console.warn("[MJR teardown]", e); }
    try {
        const controllers = Array.isArray(runtime._cleanupControllers) ? runtime._cleanupControllers : [];
        for (const controller of controllers) {
            try {
                controller?.abort?.();
            } catch (e) { console.debug?.(e); }
        }
        runtime._cleanupControllers = [];
    } catch (e) { console.warn("[MJR teardown]", e); }
    try {
        removeApiHandlers(runtime.api || null);
        removeRuntimeWindowHandlers(runtime);
    } catch (e) { console.warn("[MJR teardown]", e); }
}

function _registerCleanableListener(runtime, target, event, handler, options = undefined) {
    if (!runtime || !target?.addEventListener || typeof handler !== "function") return null;
    const listenerOptions = options && typeof options === "object" ? { ...options } : options;
    if (typeof AbortController !== "undefined") {
        try {
            const controller = new AbortController();
            const nextOptions =
                listenerOptions && typeof listenerOptions === "object"
                    ? { ...listenerOptions, signal: controller.signal }
                    : { signal: controller.signal };
            target.addEventListener(event, handler, nextOptions);
            runtime._cleanupControllers = Array.isArray(runtime._cleanupControllers) ? runtime._cleanupControllers : [];
            runtime._cleanupControllers.push(controller);
            return controller;
        } catch (e) { console.debug?.(e); }
    }
    target.addEventListener(event, handler, listenerOptions);
    runtime._listenerCleanupFns = Array.isArray(runtime._listenerCleanupFns) ? runtime._listenerCleanupFns : [];
    runtime._listenerCleanupFns.push(() => {
        try {
            target.removeEventListener(event, handler, listenerOptions);
        } catch (e) { console.debug?.(e); }
    });
    return null;
}

function installEntryRuntimeController() {
    try {
        if (typeof window !== "undefined") {
            // Replace previous runtime entry to allow cleanup on hot-reload.
            // Handlers are removed explicitly via removeApiHandlers / removeRuntimeWindowHandlers.
            try {
                const prev = window[ENTRY_RUNTIME_KEY];
                cleanupEntryRuntime(prev);
            } catch (e) { console.warn("[MJR teardown]", e); }
            // Tear down MFV module-level listeners before re-registering (NM-3, NM-4).
            try { _liveStreamMod?.teardownLiveStreamTracker(window.__MJR_RUNTIME_APP__); } catch (e) { console.warn("[MJR teardown]", e); }
            try { _nodeStreamMod?.teardownNodeStream(window.__MJR_RUNTIME_APP__); } catch (e) { console.warn("[MJR teardown]", e); }
            try { teardownFloatingViewerManager(); } catch (e) { console.warn("[MJR teardown]", e); }
            window[ENTRY_RUNTIME_KEY] = {
                api: null,
                assetsDeletedHandler: null,
                _cleanupControllers: [],
                _listenerCleanupFns: [],
            };
        }
    } catch (e) { console.warn("[MJR teardown]", e); }
}

function _safeCssEscape(value) {
    const str = String(value ?? "");
    try {
        if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
            return CSS.escape(str);
        }
    } catch (e) { console.debug?.(e); }
    return str.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, "\\$1");
}

// Deduplication for executed events (ComfyUI can fire multiple times for same file)
// Window (ms) to ignore duplicate file events from the same execution
const DEDUPE_TTL_MS = 2000;
const RECENT_FILES_MAX = 2000; // Hard cap to prevent unbounded growth
const recentFiles = createTTLCache({ ttlMs: DEDUPE_TTL_MS, maxSize: RECENT_FILES_MAX });
const INDEX_RETRYABLE_CODES = new Set(["DB_MAINTENANCE", "TIMEOUT", "NETWORK_ERROR", "SERVICE_UNAVAILABLE"]);
const INDEX_RETRY_MAX_ATTEMPTS = 8;
const INDEX_RETRY_BASE_DELAY_MS = 1200;
const INDEX_RETRY_MAX_DELAY_MS = 15_000;

// Track execution start times to compute generation duration
const EXECUTION_START_TTL_MS = 10 * 60 * 1000;
const EXECUTION_STARTS_MAX = 500; // Hard cap to prevent unbounded growth
const executionStarts = createTTLCache({ ttlMs: EXECUTION_START_TTL_MS, maxSize: EXECUTION_STARTS_MAX });

function rememberExecutionStart(promptId, timestampMs) {
    if (!promptId) return;
    const ts = Number(timestampMs) || Date.now();
    executionStarts.set(String(promptId), ts, { at: ts });
    pruneExecutionStarts();
}

function pruneExecutionStarts() {
    executionStarts.prune();
}

function dedupeFiles(files) {
    recentFiles.prune();
    // Filter out recently seen files
    const fresh = [];
    for (const f of files) {
        // toLowerCase for case-insensitive path dedup (Windows paths may differ in casing)
        const key = `${f.type || ""}|${f.subfolder || ""}|${f.filename || ""}`.toLowerCase();
        if (!recentFiles.has(key)) {
            recentFiles.set(key, true);
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

function scheduleGenerationIndex(files, attempt = 1, meta = {}) {
    const payloadFiles = Array.isArray(files) ? files : [];
    if (!payloadFiles.length) return;
    const payload = {
        files: payloadFiles,
        origin: "generation",
    };
    if (meta?.prompt_id || meta?.promptId) {
        payload.prompt_id = String(meta.prompt_id || meta.promptId);
    }
    post(ENDPOINTS.INDEX_FILES, payload)
        .then((res) => {
            if (res?.ok) return;
            if (_shouldRetryIndexResponse(res) && attempt < INDEX_RETRY_MAX_ATTEMPTS) {
                const delayMs = _indexRetryDelayMs(attempt);
                setTimeout(() => scheduleGenerationIndex(payloadFiles, attempt + 1, meta), delayMs);
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
    commands: [
        {
            id: "mjr.openAssetsManager",
            label: "Open Assets Manager",
            icon: "pi pi-folder-open",
            function: () => openAssetsManagerPanel(app),
        },
        {
            id: "mjr.scanAssets",
            label: "Scan Assets",
            icon: "pi pi-refresh",
            function: () => triggerStartupScan(),
        },
        {
            id: "mjr.toggleFloatingViewer",
            label: "Toggle Floating Viewer",
            icon: "pi pi-images",
            function: () => window.dispatchEvent(new Event(EVENTS.MFV_TOGGLE)),
        },
        {
            id: "mjr.refreshAssetsGrid",
            label: "Refresh Assets Grid",
            icon: "pi pi-sync",
            function: () => triggerRefreshGrid(),
        },
    ],
    async setup() {
        installEntryRuntimeController();
        // Seed the bridge with the module-imported app so waitForComfyApp
        // resolves immediately (newer ComfyUI may not expose app on window/globalThis).
        setComfyApp(app);
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

        // Lazy-load LiveStreamTracker in the background (not needed for initial render).
        void import("./features/viewer/LiveStreamTracker.js").then((mod) => {
            _liveStreamMod = mod;
            try { mod.initLiveStreamTracker(runtimeApp); } catch (e) { console.warn("[MJR setup] initLiveStreamTracker failed:", e); }
        }).catch((e) => console.warn("[MJR setup] LiveStreamTracker load failed:", e));

        if (NODE_STREAM_FEATURE_ENABLED) {
            // Lazy-load NodeStream in the background (feature-flagged, not needed at startup).
            void import("./features/viewer/nodeStream/NodeStreamController.js").then((mod) => {
                _nodeStreamMod = mod;
                try {
                    mod.initNodeStream({
                        app: runtimeApp,
                        onOutput: (fileData) => floatingViewerManager.feedNodeStream(fileData),
                    });
                } catch (e) { console.warn("[MJR setup] initNodeStream failed:", e); }
            }).catch((e) => console.warn("[MJR setup] NodeStream load failed:", e));
        } else {
            console.debug(`[Majoor] Node Stream disabled by feature flag. See ${NODE_STREAM_REACTIVATION_DOC}`);
        }

        registerMajoorSettings(runtimeApp, () => {
            const grid = getActiveGridContainer();
            if (grid) loadAssets(grid);
        });
        registerNativeCommands(runtimeApp);

        setTimeout(() => { void checkMajoorVersion(); }, 5000);

        // Initialize API listeners in the background so sidebar tab registration
        // is not blocked by API readiness polling.
        void (async () => {
            // Get ComfyUI API – errors are caught below to avoid unhandled rejections.
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

                        scheduleGenerationIndex(files, 1, { prompt_id: promptId });
                    } catch (error) {
                        reportError(error, "entry.executed");
                    }
                };
                _registerCleanableListener(runtime, api, "executed", api._mjrExecutedHandler);

                // Track execution start/end to compute duration
                api._mjrExecutionStartHandler = (event) => {
                    try {
                        const promptId = event?.detail?.prompt_id || event?.detail?.promptId;
                        const ts = event?.detail?.timestamp;
                        rememberExecutionStart(promptId, ts);
                        // Feed jobId to LiveStreamTracker so b_preview_with_metadata
                        // events from stale executions are filtered out (ComfyUI v1.42+).
                        _liveStreamMod?.setCurrentJobId(promptId || null);
                        emitRuntimeStatus({
                            active_prompt_id: promptId || null,
                            cached_nodes: [],
                            progress_node: null,
                            progress_value: null,
                            progress_max: null,
                        });
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
                        _liveStreamMod?.setCurrentJobId(null);
                        emitRuntimeStatus({
                            active_prompt_id: null,
                            cached_nodes: [],
                            progress_node: null,
                            progress_value: null,
                            progress_max: null,
                        });
                    } catch (error) {
                        reportError(error, "entry.execution_end");
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
                            active_prompt_id: detail?.prompt_id || detail?.promptId || ensureExecutionRuntime().active_prompt_id || null,
                            cached_nodes: Array.isArray(detail?.nodes) ? detail.nodes.slice() : [],
                        });
                    } catch (error) {
                        reportError(error, "entry.execution_cached");
                    }
                };
                _registerCleanableListener(runtime, api, "execution_start", api._mjrExecutionStartHandler);
                _registerCleanableListener(runtime, api, "execution_success", api._mjrExecutionEndHandler);
                _registerCleanableListener(runtime, api, "execution_error", api._mjrExecutionEndHandler);
                _registerCleanableListener(runtime, api, "execution_interrupted", api._mjrExecutionEndHandler);
                _registerCleanableListener(runtime, api, "progress", api._mjrRuntimeStatusHandler);
                _registerCleanableListener(runtime, api, "status", api._mjrRuntimeStatusHandler);
                _registerCleanableListener(runtime, api, "execution_cached", api._mjrExecutionCachedHandler);

                // Listen for backend push - upsert asset directly to grid
                api._mjrAssetAddedHandler = (event) => {
                    try {
                        const grid = getActiveGridContainer();
                        if (grid && event?.detail) {
                            pushGeneratedAsset(event.detail);
                            // Only handle direct updates when the active grid shows output or "all" scope.
                            const scope = grid.dataset?.mjrScope || "output";
                            if (scope !== "output" && scope !== "all") return;
                            const query = grid.dataset?.mjrQuery || "*";
                            const canDirectUpsert = String(query).trim() === "*";
                            if (canDirectUpsert) {
                                const handled = !!upsertAsset(grid, event.detail);
                                if (handled) {
                                    // Signal that we handled this event so handleCountersUpdate
                                    // skips its own reload within the next window.
                                    try { window.__mjrLastAssetUpsert = Date.now(); } catch (e) { console.debug?.(e); }
                                }
                            }
                            // No fallback reload here — let handleCountersUpdate's
                            // queuedReload() handle it (preserves scroll anchor).
                        }
                    } catch (error) {
                        reportError(error, "entry.asset_added");
                    }
                };
                _registerCleanableListener(runtime, api, "mjr-asset-added", api._mjrAssetAddedHandler);

                api._mjrAssetUpdatedHandler = (event) => {
                    try {
                        const grid = getActiveGridContainer();
                        if (grid && event?.detail) {
                            pushGeneratedAsset(event.detail);
                            const detail = event.detail;
                            const assetId = String(detail?.id || "").trim();
                            const kind = String(detail?.kind || "").trim();
                            const filename = String(detail?.filename || "").trim();
                            const filepath = String(detail?.filepath || "").trim();
                            const hasRenderableFields = !!kind && (!!filename || !!filepath);
                            let existsInGrid = false;
                            if (assetId) {
                                try {
                                    const escapedId = _safeCssEscape(assetId);
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

                            // Non-renderable partial updates for unseen assets — let
                            // handleCountersUpdate's queuedReload() pick up changes
                            // (preserves scroll anchor and avoids reload storms).
                        }
                    } catch (error) {
                        reportError(error, "entry.asset_updated");
                    }
                };
                _registerCleanableListener(runtime, api, "mjr-asset-updated", api._mjrAssetUpdatedHandler);

                // Listen for scan-complete events to avoid "Unknown message type" warnings
                api._mjrScanCompleteHandler = (event) => {
                    try {
                        const detail = event?.detail || {};
                        window.dispatchEvent(new CustomEvent(EVENTS.SCAN_COMPLETE, { detail }));
                    } catch (e) { console.debug?.(e); }
                };
                _registerCleanableListener(runtime, api, EVENTS.SCAN_COMPLETE, api._mjrScanCompleteHandler);

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
                _registerCleanableListener(runtime, api, EVENTS.ENRICHMENT_STATUS, api._mjrEnrichmentStatusHandler);

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
                _registerCleanableListener(runtime, api, EVENTS.DB_RESTORE_STATUS, api._mjrDbRestoreStatusHandler);

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
                _registerCleanableListener(runtime, window, EVENTS.ASSETS_DELETED, assetsDeletedHandler);
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
        })().catch((e) => reportError(e, "entry.api_setup"));

        // Register sidebar tab
        if (registerSidebarTabCompat(runtimeApp, {
                id: SIDEBAR_TAB_ID,
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

        try {
            registerBottomPanelTabCompat(runtimeApp, getGeneratedFeedBottomPanelTab());
        } catch (e) {
            console.debug?.("[Majoor] Bottom panel tab registration unavailable", e);
        }

        // Export metrics for debugging (accessible via console)
        if (typeof window !== "undefined") {
            window.MajoorDebug = {
                exportMetrics: () => window.MajoorMetrics?.exportMetrics?.(),
                getMetrics: () => window.MajoorMetrics?.getMetricsReport?.(),
                resetMetrics: () => window.MajoorMetrics?.resetMetrics?.(),
            };
            console.debug?.("[Majoor] Debug commands available: window.MajoorDebug.exportMetrics(), window.MajoorDebug.getMetrics(), window.MajoorDebug.resetMetrics()");
            if (NODE_STREAM_FEATURE_ENABLED) {
                // Expose NodeStream API for third-party adapter registration (lazy-resolved).
                const _nsApi = (fn) => async (...args) => {
                    if (!_nodeStreamMod) {
                        _nodeStreamMod = await import("./features/viewer/nodeStream/NodeStreamController.js");
                    }
                    return _nodeStreamMod[fn](...args);
                };
                window.MajoorNodeStream = {
                    registerAdapter: _nsApi("registerAdapter"),
                    listAdapters: _nsApi("listAdapters"),
                    async createAdapter(config) {
                        const { createAdapter } = await import("./features/viewer/nodeStream/adapters/BaseAdapter.js");
                        return createAdapter(config);
                    },
                    async getKnownNodeSets() {
                        const { getKnownNodeSets } = await import("./features/viewer/nodeStream/adapters/KnownNodesAdapter.js");
                        return getKnownNodeSets();
                    },
                };
                console.debug?.("[Majoor] NodeStream API: window.MajoorNodeStream.registerAdapter(adapter), .createAdapter(config), .listAdapters()");
            } else {
                try { delete window.MajoorNodeStream; } catch (e) { window.MajoorNodeStream = undefined; }
            }
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

    getNodeMenuItems(node) {
        if (!isMajoorTrackableNode(node)) return [];
        return [
            nodeMenuEntry("View in Assets Manager", () => openAssetsManagerPanel(app)),
            nodeMenuEntry("Open in Floating Viewer", () => {
                try {
                    window.dispatchEvent(new Event(EVENTS.MFV_OPEN));
                } catch (e) { console.debug?.(e); }
            }),
            nodeMenuEntry("Index Output", () => {
                try {
                    triggerRefreshGrid();
                    comfyToast(t("toast.rescanningFile", "Rescanning file…"), "info", 1800);
                } catch (e) { console.debug?.(e); }
            }),
        ];
    },
    bottomPanelTabs: [
        getGeneratedFeedBottomPanelTab(),
    ],
});
