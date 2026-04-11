/**
 * Entry Point — Majoor Assets Manager
 *
 * Registers the ComfyUI extension and wires up the Vue-based UI.
 *
 * Vue migration summary
 * ─────────────────────
 * • Sidebar and bottom-panel tabs mount isolated Vue 3 + Pinia applications
 *   (see js/vue/App.vue and js/vue/GeneratedFeedApp.vue).
 * • Keep-alive is handled by mountKeepAlive() in createVueApp.js — no more
 *   _mjrKeepAliveMounted DOM flags.
 * • Commands are declared on the extension object (declarative API) so ComfyUI
 *   surfaces them in the palette and shortcut editor automatically.
 * • Toast notifications route through app.extensionManager.toast (ComfyUI's
 *   PrimeVue toast) with a DOM fallback — no changes needed in toast.js as it
 *   already prefers the native API.
 */

import { testAPI, triggerStartupScan } from "./app/bootstrap.js";
import { checkMajoorVersion } from "./app/versionCheck.js";
import { ensureStyleLoaded } from "./app/style.js";
import { buildMajoorSettings, registerMajoorSettings } from "./app/settings.js";
import {
    getComfyApi,
    setComfyApi,
    setComfyApp,
    waitForComfyApi,
    waitForComfyApp,
} from "./app/comfyApiBridge.js";
import { EVENTS } from "./app/events.js";
import {
    teardownFloatingViewerManager,
    floatingViewerManager,
} from "./features/viewer/floatingViewerManager.js";
import { ensureFloatingViewerProgressTracking } from "./features/viewer/floatingViewerProgress.js";
import {
    NODE_STREAM_FEATURE_ENABLED,
    NODE_STREAM_REACTIVATION_DOC,
} from "./features/viewer/nodeStream/nodeStreamFeatureFlag.js";
import { loadAssets, upsertAsset, upsertAssetNow, removeAssetsFromGrid } from "./features/grid/gridApi.js";
import { getActiveGridContainer } from "./features/panel/panelRuntimeRefs.js";
import { pushGeneratedAsset, refreshGeneratedFeedHosts } from "./features/bottomPanel/feed/feedHost.js";
import { createExecutionRuntimeController } from "./features/stacks/executionRuntimeController.js";
import { extractOutputFiles } from "./utils/extractOutputFiles.js";
import { post } from "./api/client.js";
import { ENDPOINTS } from "./api/endpoints.js";
import { comfyToast } from "./app/toast.js";
import { t } from "./app/i18n.js";
import { APP_CONFIG } from "./app/config.js";
import { getRuntimeEnrichmentState, setRuntimeEnrichmentState } from "./stores/runtimeEnrichmentState.js";
import { reportError, mjrDbg } from "./utils/logging.js";
import { app } from "../../scripts/app.js";
import { registerRealtimeListeners } from "./features/runtime/registerRealtimeListeners.js";
import { exposeDebugApis } from "./features/runtime/entryDebugApi.js";
import {
    buildBottomPanelTabs,
    buildNativeCommands,
    getMajoorNodeMenuItems,
    mountGlobalRuntime,
    registerAssetsSidebar,
    registerNativeCommands,
    teardownGeneratedFeed,
    teardownAssetsSidebar,
    teardownGlobalRuntime,
} from "./features/runtime/entryUiRegistration.js";
import {
    ENTRY_RUNTIME_KEY,
    cleanupEntryRuntime,
    installEntryRuntimeController,
    registerCleanableListener,
    removeApiHandlers,
    removeRuntimeWindowHandlers,
} from "./features/runtime/entryRuntimeLifecycle.js";

// ── lazy module handles ───────────────────────────────────────────────────────

/** @type {import("./features/viewer/LiveStreamTracker.js") | null} */
let liveStreamModule = null;
/** @type {import("./features/viewer/nodeStream/NodeStreamController.js") | null} */
let nodeStreamModule = null;

// ── constants ─────────────────────────────────────────────────────────────────

const SIDEBAR_TAB_ID = "majoor-assets";
const EXECUTION_RUNTIME_KEY = "__MJR_EXECUTION_RUNTIME__";
const EXTENSION_NAME = "Majoor.AssetsManager";
let _lastExecutionBackendSync = { active: null, promptId: "" };
let _deferredGridReloadTimer = null;

// ── execution runtime helpers ─────────────────────────────────────────────────

function ensureExecutionRuntime() {
    try {
        if (typeof window === "undefined") {
            return {
                active_prompt_id: null,
                queue_remaining: null,
                progress_node: null,
                progress_value: null,
                progress_max: null,
                cached_nodes: [],
            };
        }
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
    } catch (e) {
        console.debug?.(e);
    }
}

async function syncExecutionBackendState({ active, promptId = "" } = {}) {
    const nextActive = !!active;
    const nextPromptId = String(promptId || "").trim();
    if (
        _lastExecutionBackendSync.active === nextActive &&
        _lastExecutionBackendSync.promptId === nextPromptId
    ) {
        return;
    }
    _lastExecutionBackendSync = { active: nextActive, promptId: nextPromptId };
    try {
        await post(ENDPOINTS.RUNTIME_EXECUTION, {
            active: nextActive,
            prompt_id: nextPromptId || undefined,
            cooldown_ms: Number(APP_CONFIG.EXECUTION_IDLE_GRACE_MS) || 6000,
        });
    } catch (e) {
        reportError(e, "entry.execution_state_sync");
    }
}

function isExecutionActive() {
    try {
        return !!String(ensureExecutionRuntime()?.active_prompt_id || "").trim();
    } catch (e) {
        console.debug?.(e);
        return false;
    }
}

function scheduleGridReloadWhenIdle(delayMs = 1200) {
    try {
        if (_deferredGridReloadTimer) {
            clearTimeout(_deferredGridReloadTimer);
        }
    } catch (e) {
        console.debug?.(e);
    }
    _deferredGridReloadTimer = setTimeout(() => {
        _deferredGridReloadTimer = null;
        if (isExecutionActive()) {
            scheduleGridReloadWhenIdle(delayMs);
            return;
        }
        const grid = getActiveGridContainer();
        if (grid) {
            loadAssets(grid);
        }
    }, Math.max(250, Number(delayMs) || 0));
}

// ── lazy module initialisation ─────────────────────────────────────────────────

function setupLazyModules(runtimeApp) {
    void import("./features/viewer/LiveStreamTracker.js")
        .then((mod) => {
            liveStreamModule = mod;
            try {
                mod.initLiveStreamTracker(runtimeApp);
            } catch (e) {
                console.warn("[MJR setup] initLiveStreamTracker failed:", e);
            }
        })
        .catch((e) => console.warn("[MJR setup] LiveStreamTracker load failed:", e));

    if (!NODE_STREAM_FEATURE_ENABLED) {
        console.debug("[Majoor] Node Stream disabled by feature flag.");
        return;
    }

    void import("./features/viewer/nodeStream/NodeStreamController.js")
        .then((mod) => {
            nodeStreamModule = mod;
            try {
                mod.initNodeStream({
                    app: runtimeApp,
                    onOutput: (fileData) => floatingViewerManager.feedNodeStream(fileData),
                });
            } catch (e) {
                console.warn("[MJR setup] initNodeStream failed:", e);
            }
        })
        .catch((e) => console.warn("[MJR setup] NodeStream load failed:", e));
}

// ── API listener setup ────────────────────────────────────────────────────────

async function setupApiListeners(runtimeApp, executionRuntime) {
    const api =
        (await waitForComfyApi({ app: runtimeApp, timeoutMs: 4000 })) || getComfyApi(runtimeApp);
    setComfyApi(api || null);
    if (!api) {
        console.warn("Majoor API not available, real-time updates disabled");
        return;
    }
    void ensureFloatingViewerProgressTracking({ api, app: runtimeApp }).catch((e) =>
        console.debug?.("[Majoor] MFV progress tracking init failed", e),
    );

    let runtime = null;
    try {
        runtime = typeof window !== "undefined" ? window[ENTRY_RUNTIME_KEY] || null : null;
    } catch (e) {
        console.debug?.(e);
    }

    removeApiHandlers(runtime?.api || null, reportError);
    if (api !== runtime?.api) removeApiHandlers(api, reportError);
    removeRuntimeWindowHandlers(runtime, reportError);

    await registerRealtimeListeners({
        api,
        runtime,
        executionRuntime,
        appRef: app,
        liveStreamModule,
        ensureExecutionRuntime,
        emitRuntimeStatus,
        getActiveGridContainer,
        pushGeneratedAsset,
        upsertAsset,
        upsertAssetNow,
        removeAssetsFromGrid,
        getEnrichmentState: getRuntimeEnrichmentState,
        setEnrichmentState: setRuntimeEnrichmentState,
        comfyToast,
        t,
        reportError,
        registerCleanableListener,
        syncExecutionBackendState,
    });
}

// ── execution runtime controller ──────────────────────────────────────────────

const executionRuntime = createExecutionRuntimeController({
    post,
    ENDPOINTS,
    reportError,
    extractOutputFiles,
    ensureExecutionRuntime,
    emitRuntimeStatus,
    refreshGeneratedFeedHosts,
    getActiveGridContainer,
});

// ── extension registration ─────────────────────────────────────────────────────
// Keep registration unconditional. ComfyUI reload needs setup() to run again,
// and installEntryRuntimeController() already tears down the previous runtime.
app.registerExtension({
    name: EXTENSION_NAME,

    /**
     * Declarative settings — registered with ComfyUI's settings panel.
     * Replaces the imperative registerMajoorSettings() call for the settings UI.
     */
    settings: buildMajoorSettings(app),

    /**
     * Declarative commands — ComfyUI surfaces these in the command palette
     * and the shortcut editor without additional imperative calls.
     */
    commands: buildNativeCommands(app, {
        sidebarTabId: SIDEBAR_TAB_ID,
        triggerStartupScan,
    }),

    /**
     * Declarative bottom-panel tabs — processed by ComfyUI's extension service.
     * Each tab's render/destroy callbacks mount/unmount the Vue app via
     * mountKeepAlive() so state survives panel collapse/expand cycles.
     */
    bottomPanelTabs: buildBottomPanelTabs(),

    // ── lifecycle ──────────────────────────────────────────────────────────────

    async setup() {
        // 1. Runtime lifecycle controller (handles extension cleanup on reload).
        installEntryRuntimeController({
            cleanupEntryRuntimeFn: cleanupEntryRuntime,
            teardownLiveStreamTracker: (runtimeApp) =>
                liveStreamModule?.teardownLiveStreamTracker(runtimeApp),
            teardownNodeStream: (runtimeApp) => nodeStreamModule?.teardownNodeStream(runtimeApp),
            teardownFloatingViewerManager,
            teardownGeneratedFeed,
            teardownAssetsSidebar,
            teardownGlobalRuntime,
            reportError,
        });

        // 2. Resolve the ComfyUI app reference (may take a few frames to be ready).
        setComfyApp(app);
        const runtimeApp = (await waitForComfyApp({ timeoutMs: 12000 })) || app;
        setComfyApp(runtimeApp);
        try {
            if (typeof window !== "undefined") window.__MJR_RUNTIME_APP__ = runtimeApp;
        } catch (e) {
            console.debug?.(e);
        }

        // 3. Baseline checks.
        testAPI();
        ensureStyleLoaded({ enabled: true });
        mountGlobalRuntime();

        // 4. Global runtime — viewer + DnD stay mounted from the always-on Vue runtime.

        // 5. Lazy viewer modules (non-blocking).
        setupLazyModules(runtimeApp);

        // 6. Settings runtime init (applies settings to APP_CONFIG, starts watcher sync…).
        registerMajoorSettings(runtimeApp, () => {
            const grid = getActiveGridContainer();
            if (!grid) return;
            if (APP_CONFIG.DEFER_GRID_FETCH_DURING_EXECUTION && isExecutionActive()) {
                scheduleGridReloadWhenIdle();
                return;
            }
            loadAssets(grid);
        });

        // 7. Fallback command registration for older ComfyUI versions that don't
        //    process the declarative `commands` array on the extension object.
        registerNativeCommands(runtimeApp, {
            sidebarTabId: SIDEBAR_TAB_ID,
            triggerStartupScan,
        });

        // 8. Version check (deferred so it doesn't slow startup).
        setTimeout(() => {
            void checkMajoorVersion();
        }, 5000);

        // 9. WebSocket / realtime listeners.
        void setupApiListeners(runtimeApp, executionRuntime).catch((e) =>
            reportError(e, "entry.api_setup"),
        );

        // 10. Register sidebar tab (Vue app mounts on first open via mountKeepAlive).
        if (
            registerAssetsSidebar(runtimeApp, {
                sidebarTabId: SIDEBAR_TAB_ID,
            })
        ) {
            mjrDbg("[Majoor] Sidebar tab registered (Vue)");
        } else {
            console.warn(
                "Majoor Assets Manager: extensionManager.registerSidebarTab is unavailable",
            );
        }

        // 11. Bottom panel tab is registered declaratively via `bottomPanelTabs`.

        // 12. Startup warmup: API/DB/counters first, then idle index scan.
        // 12. Debug API surface (development/support).
        exposeDebugApis({
            resolveNodeStreamModule: async () => {
                if (!nodeStreamModule) {
                    nodeStreamModule = await import(
                        "./features/viewer/nodeStream/NodeStreamController.js"
                    );
                }
                return nodeStreamModule;
            },
        });
    },

    // ── hooks ──────────────────────────────────────────────────────────────────

    /**
     * ComfyUI v1.42+ — fires when individual node outputs are updated during
     * a workflow execution.  Feeds the execution-stack runtime so the bottom
     * feed panel receives live assets.
     */
    onNodeOutputsUpdated(nodeOutputs) {
        try {
            executionRuntime.handleNodeOutputsUpdated(nodeOutputs);
        } catch (e) {
            console.debug?.("[Majoor] onNodeOutputsUpdated error", e);
        }
    },

    /** Context-menu items injected into ComfyUI node right-click menus. */
    getNodeMenuItems(node) {
        return getMajoorNodeMenuItems(node, app, { sidebarTabId: SIDEBAR_TAB_ID });
    },
});
