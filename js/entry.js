/**
 * Entry Point - Majoor Assets Manager
 * Registers extension with ComfyUI and mounts UI.
 */

import { runStartupWarmup, testAPI, triggerStartupScan } from "./app/bootstrap.js";
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
import { initDragDrop } from "./features/dnd/DragDrop.js";
import {
    teardownFloatingViewerManager,
    floatingViewerManager,
} from "./features/viewer/floatingViewerManager.js";
import {
    NODE_STREAM_FEATURE_ENABLED,
    NODE_STREAM_REACTIVATION_DOC,
} from "./features/viewer/nodeStream/nodeStreamFeatureFlag.js";
import { loadAssets, upsertAsset, removeAssetsFromGrid } from "./features/grid/GridView.js";
import { getActiveGridContainer } from "./features/panel/AssetsManagerPanel.js";
import {
    pushGeneratedAsset,
    refreshGeneratedFeedHosts,
} from "./features/bottomPanel/GeneratedFeedTab.js";
import { createExecutionRuntimeController } from "./features/stacks/executionRuntimeController.js";
import { extractOutputFiles } from "./utils/extractOutputFiles.js";
import { post } from "./api/client.js";
import { ENDPOINTS } from "./api/endpoints.js";
import { comfyToast } from "./app/toast.js";
import { t } from "./app/i18n.js";
import { getEnrichmentState, setEnrichmentState } from "./app/runtimeState.js";
import { reportError } from "./utils/logging.js";
import { app } from "../../scripts/app.js";
import { registerRealtimeListeners } from "./features/runtime/registerRealtimeListeners.js";
import { exposeDebugApis } from "./features/runtime/entryDebugApi.js";
import {
    buildBottomPanelTabs,
    buildNativeCommands,
    getMajoorNodeMenuItems,
    registerAssetsSidebar,
    registerGeneratedBottomPanel,
    registerNativeCommands,
} from "./features/runtime/entryUiRegistration.js";
import {
    ENTRY_RUNTIME_KEY,
    cleanupEntryRuntime,
    installEntryRuntimeController,
    registerCleanableListener as registerCleanableListener,
    removeApiHandlers,
    removeRuntimeWindowHandlers,
} from "./features/runtime/entryRuntimeLifecycle.js";

/** @type {import("./features/viewer/LiveStreamTracker.js") | null} */
let liveStreamModule = null;
/** @type {import("./features/viewer/nodeStream/NodeStreamController.js") | null} */
let nodeStreamModule = null;

const UI_FLAGS = {
    useComfyThemeUI: true,
};

const SIDEBAR_TAB_ID = "majoor-assets";
const EXECUTION_RUNTIME_KEY = "__MJR_EXECUTION_RUNTIME__";

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
        console.debug(
            `[Majoor] Node Stream disabled by feature flag. See ${NODE_STREAM_REACTIVATION_DOC}`,
        );
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

async function setupApiListeners(runtimeApp, executionRuntime) {
    const api =
        (await waitForComfyApi({ app: runtimeApp, timeoutMs: 4000 })) || getComfyApi(runtimeApp);
    setComfyApi(api || null);
    if (!api) {
        console.warn("Majoor API not available, real-time updates disabled");
        return;
    }

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
        removeAssetsFromGrid,
        getEnrichmentState,
        setEnrichmentState,
        comfyToast,
        t,
        reportError,
        registerCleanableListener,
    });
}

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

app.registerExtension({
    name: "Majoor.AssetsManager",
    settings: buildMajoorSettings(app),
    commands: buildNativeCommands(app, {
        sidebarTabId: SIDEBAR_TAB_ID,
        triggerStartupScan,
    }),
    async setup() {
        installEntryRuntimeController({
            cleanupEntryRuntimeFn: cleanupEntryRuntime,
            teardownLiveStreamTracker: (runtimeApp) =>
                liveStreamModule?.teardownLiveStreamTracker(runtimeApp),
            teardownNodeStream: (runtimeApp) => nodeStreamModule?.teardownNodeStream(runtimeApp),
            teardownFloatingViewerManager,
            reportError,
        });

        setComfyApp(app);
        const runtimeApp = (await waitForComfyApp({ timeoutMs: 12000 })) || app;
        setComfyApp(runtimeApp);
        try {
            if (typeof window !== "undefined") window.__MJR_RUNTIME_APP__ = runtimeApp;
        } catch (e) {
            console.debug?.(e);
        }

        testAPI();
        ensureStyleLoaded({ enabled: UI_FLAGS.useComfyThemeUI });

        try {
            initDragDrop();
        } catch (e) {
            console.warn("[MJR setup] initDragDrop failed:", e);
        }

        setupLazyModules(runtimeApp);

        registerMajoorSettings(runtimeApp, () => {
            const grid = getActiveGridContainer();
            if (grid) loadAssets(grid);
        });
        registerNativeCommands(runtimeApp, {
            sidebarTabId: SIDEBAR_TAB_ID,
            triggerStartupScan,
        });

        setTimeout(() => {
            void checkMajoorVersion();
        }, 5000);

        void setupApiListeners(runtimeApp, executionRuntime).catch((e) =>
            reportError(e, "entry.api_setup"),
        );

        if (
            registerAssetsSidebar(runtimeApp, {
                sidebarTabId: SIDEBAR_TAB_ID,
                useComfyThemeUI: UI_FLAGS.useComfyThemeUI,
            })
        ) {
            console.debug("[Majoor] Sidebar tab registered");
        } else {
            console.warn(
                "Majoor Assets Manager: extensionManager.registerSidebarTab is unavailable",
            );
        }

        try {
            registerGeneratedBottomPanel(runtimeApp);
        } catch (e) {
            console.debug?.("[Majoor] Bottom panel tab registration unavailable", e);
        }

        // Explicit warmup sequence: API/DB/counters first, then index scan only if idle.
        void runStartupWarmup({ delayMs: 200, idleOnly: true }).catch((e) =>
            reportError(e, "entry.startup_warmup"),
        );

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

    /**
     * ComfyUI v1.42+ hook: fires when individual node outputs are updated during execution.
     * @param {Map<string, object>} nodeOutputs
     */
    onNodeOutputsUpdated(nodeOutputs) {
        try {
            executionRuntime.handleNodeOutputsUpdated(nodeOutputs);
        } catch (e) {
            console.debug?.("[Majoor] onNodeOutputsUpdated error", e);
        }
    },

    getNodeMenuItems(node) {
        return getMajoorNodeMenuItems(node, app, { sidebarTabId: SIDEBAR_TAB_ID });
    },
    bottomPanelTabs: buildBottomPanelTabs(),
});
