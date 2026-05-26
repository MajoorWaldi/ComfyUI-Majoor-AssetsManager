/**
 * UI registration - sidebar, bottom panel, commands, node menu items.
 *
 * Vue migration notes
 * -------------------
 * Sidebar and bottom-panel tabs are now registered with `type: 'custom'` backed
 * by a full Vue 3 + Pinia application mounted inside the container element.
 * This replaces both the old DOM-manipulation approach AND the keep-alive hack
 * (`_mjrKeepAliveMounted`): `mountKeepAlive` mounts the Vue app only once and
 * re-uses the live DOM on subsequent `render()` calls, preserving all grid
 * state and scroll positions across tab-switch cycles.
 *
 * Commands are declared as a plain array on the extension object (declarative
 * API) so ComfyUI surfaces them in the command palette and the shortcut editor
 * without any extra imperative registration calls.
 */

import { runStartupWarmup } from "../../app/bootstrap.js";
import {
    activateSidebarTabForApp,
    registerBottomPanelTabForApp,
    registerCommandForApp,
    registerKeybindingForApp,
    registerSidebarTabForApp,
} from "../../app/hostAdapter.js";
import { EVENTS } from "../../app/events.js";
import { openMajoorSettings } from "../../app/openMajoorSettings.js";
import { comfyToast } from "../../app/toast.js";
import { t } from "../../app/i18n.js";
import { mountKeepAlive, unmountKeepAlive } from "../../vue/createVueApp.js";
import GlobalRuntimeApp from "../../vue/GlobalRuntime.vue";
import AssetsManagerApp from "../../vue/App.vue";
import GeneratedFeedApp from "../../vue/GeneratedFeedApp.vue";
import { mountTopBarMfvButton, teardownTopBarMfvButton } from "./topBarMfvButton.js";
import { startEarlyFetch, consumeEarlyFetch } from "./earlyFetch.js";
import { configureSidebarAssetBadge, resetSidebarAssetBadge } from "./sidebarAssetBadge.js";
import { consumePendingGeneratedAssets } from "./pendingGeneratedAssets.js";

// -- keep-alive mount keys -----------------------------------------------------
const GLOBAL_RUNTIME_ROOT_ID = "mjr-global-runtime-root";
const GLOBAL_RUNTIME_MOUNT_KEY = "_mjrGlobalRuntimeVueApp";
const SIDEBAR_MOUNT_KEY = "_mjrSidebarVueApp";
const FEED_MOUNT_KEY = "_mjrFeedVueApp";
let _lastSelectionToolboxNode: any = null;

// Re-exported from the dedicated lightweight module so existing imports
// continue to work. The module is auto-evaluated as a top-level side effect
// from `entry.js` so the first /list request leaves the browser before this
// (heavier, Vue-importing) module is even parsed.
export { startEarlyFetch, consumeEarlyFetch };

function ensureGlobalRuntimeRoot() {
    if (typeof document === "undefined" || !document?.body) return null;
    let root = document.getElementById(GLOBAL_RUNTIME_ROOT_ID);
    if (root) return root;

    root = document.createElement("div");
    root.id = GLOBAL_RUNTIME_ROOT_ID;
    root.setAttribute("role", "presentation");
    root.style.cssText =
        // Keep runtime hosts above panel layers so main viewer overlay cannot render underneath.
        "position:fixed;inset:0;overflow:visible;pointer-events:none;z-index:10020;";
    document.body.appendChild(root);
    return root;
}

export function mountGlobalRuntime(): boolean {
    try {
        const root = ensureGlobalRuntimeRoot();
        if (!root) return false;
        const mounted = !!mountKeepAlive(root, GlobalRuntimeApp, GLOBAL_RUNTIME_MOUNT_KEY);
        mountTopBarMfvButton();
        return mounted;
    } catch {
        return false;
    }
}

export function teardownGlobalRuntime(): void {
    try {
        teardownTopBarMfvButton();
        const root = document.getElementById(GLOBAL_RUNTIME_ROOT_ID);
        if (!root) return;
        unmountKeepAlive(root, GLOBAL_RUNTIME_MOUNT_KEY);
        root.remove?.();
    } catch {
        /* ignore */
    }
}

export { teardownTopBarMfvButton };

// -- sidebar helpers -----------------------------------------------------------

export function openAssetsManagerPanel(runtimeApp: any, sidebarTabId: string): boolean {
    const opened = activateSidebarTabForApp(runtimeApp, sidebarTabId);
    resetSidebarAssetBadge();
    if (!opened) {
        try {
            window.dispatchEvent(new Event(EVENTS.OPEN_ASSETS_MANAGER));
        } catch (e) {
            console.debug?.(e);
        }
    }
    return opened;
}

export function triggerRefreshGrid(): void {
    try {
        window.dispatchEvent(
            new CustomEvent(EVENTS.RELOAD_GRID, { detail: { reason: "command" } }),
        );
    } catch (e) {
        console.debug?.(e);
    }
}

// -- commands (declarative array for ComfyUI extension API) --------------------

function firstTrackableSelectionItem(selectedItem: any) {
    return getSelectionItems(selectedItem).find(isMajoorTrackableNode) || null;
}

function resolveNodeContextDetail(node: any) {
    const sourceNodeId = String(node?.id ?? node?.nodeId ?? node?.node_id ?? "").trim();
    if (!sourceNodeId) return null;
    const sourceNodeType = String(
        node?.comfyClass || node?.type || node?.constructor?.type || "",
    ).trim();
    const title = String(
        node?.title || node?.properties?.title || node?.properties?.name || sourceNodeType || "",
    ).trim();
    return {
        source_node_id: sourceNodeId,
        sourceNodeId,
        source_node_type: sourceNodeType,
        sourceNodeType,
        title,
    };
}

function openNodeContext(runtimeApp: any, sidebarTabId: any) {
    const detail = resolveNodeContextDetail(_lastSelectionToolboxNode);
    if (!detail) {
        comfyToast(t("toast.nodeContextMissing", "Select an output node first."), "info", 2200);
        return false;
    }
    openAssetsManagerPanel(runtimeApp, sidebarTabId);
    try {
        if (typeof window !== "undefined") {
            (window as any).MajoorAssetsManager = (window as any).MajoorAssetsManager || {};
            (window as any).MajoorAssetsManager.pendingNodeContext = detail;
            window.dispatchEvent(new CustomEvent(EVENTS.OPEN_NODE_CONTEXT, { detail }));
        }
    } catch (e) {
        console.debug?.(e);
    }
    return true;
}

export function buildNativeCommands(runtimeApp: any, { sidebarTabId, triggerStartupScan }: { sidebarTabId: string; triggerStartupScan: () => void }): unknown[] {
    return [
        {
            id: "mjr.openAssetsManager",
            label: t("manager.title", "Assets Manager"),
            tooltip: t("tooltip.openAssetsManager", "Open Majoor Assets Manager"),
            title: t("tooltip.openAssetsManager", "Open Majoor Assets Manager"),
            description: t("tooltip.openAssetsManager", "Open Majoor Assets Manager"),
            icon: "pi pi-folder-open",
            function: () => openAssetsManagerPanel(runtimeApp, sidebarTabId),
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
            function: () => {
                try {
                    window.dispatchEvent(new Event(EVENTS.MFV_TOGGLE));
                } catch (e) {
                    console.debug?.(e);
                }
            },
        },
        {
            id: "mjr.refreshAssetsGrid",
            label: t("command.refreshAssetsGrid", "Refresh assets grid"),
            icon: "pi pi-sync",
            function: () => triggerRefreshGrid(),
        },
        {
            id: "mjr.openFloatingViewer",
            label: t("command.openFloatingViewer", "Open floating viewer"),
            tooltip: t("tooltip.openFloatingViewer", "Open Majoor floating viewer"),
            title: t("tooltip.openFloatingViewer", "Open Majoor floating viewer"),
            description: t("tooltip.openFloatingViewer", "Open Majoor floating viewer"),
            icon: "pi pi-window-maximize",
            function: () => {
                try {
                    window.dispatchEvent(new Event(EVENTS.MFV_OPEN));
                } catch (e) {
                    console.debug?.(e);
                }
            },
        },
        {
            id: "mjr.openSettings",
            label: t("command.openSettings", "Open Majoor settings"),
            icon: "pi pi-cog",
            function: () => openMajoorSettings(runtimeApp),
        },
        {
            id: "mjr.openNodeContext",
            label: t("command.openNodeContext", "Show assets from selected node"),
            tooltip: t(
                "tooltip.openNodeContext",
                "Show the latest indexed assets produced by this node",
            ),
            title: t(
                "tooltip.openNodeContext",
                "Show the latest indexed assets produced by this node",
            ),
            description: t(
                "tooltip.openNodeContext",
                "Show the latest indexed assets produced by this node",
            ),
            icon: "pi pi-sitemap",
            function: () => openNodeContext(runtimeApp, sidebarTabId),
        },
    ];
}

export function buildNativeKeybindings(): unknown[] {
    return [
        {
            combo: { alt: true, shift: true, key: "a" },
            commandId: "mjr.openAssetsManager",
        },
        {
            combo: { alt: true, shift: true, key: "v" },
            commandId: "mjr.toggleFloatingViewer",
        },
    ];
}

export function buildNativeMenuCommands(): unknown[] {
    return [
        {
            path: ["Extensions", "Majoor Assets Manager"],
            commands: [
                "mjr.openAssetsManager",
                "mjr.openFloatingViewer",
                "mjr.refreshAssetsGrid",
                "mjr.scanAssets",
                "mjr.openSettings",
            ],
        },
    ];
}

export function buildAboutPageBadges(): unknown[] {
    return [
        {
            label: "Majoor Assets Manager",
            icon: "pi pi-folder",
        },
        {
            label: "v2.4.8",
            icon: "pi pi-tag",
        },
        {
            label: "Docs",
            icon: "pi pi-book",
            url: "https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/blob/main/user_guide.html",
        },
    ];
}

/** Imperatively registers commands - used as a fallback for older ComfyUI. */
export function registerNativeCommands(runtimeApp: any, options: any): void {
    for (const command of buildNativeCommands(runtimeApp, options)) {
        registerCommandForApp(runtimeApp, command);
    }
}

export function registerNativeKeybindings(runtimeApp: any): void {
    for (const keybinding of buildNativeKeybindings()) {
        registerKeybindingForApp(runtimeApp, keybinding);
    }
}

// -- sidebar registration ------------------------------------------------------

/**
 * Registers the Majoor Assets Manager sidebar tab.
 *
 * The tab uses `type: 'custom'` so we control the full lifecycle.
 * On `render()` a Vue 3 app (AssetsManagerApp) is mounted - or kept alive if
 * already mounted.  `destroy()` is intentionally a no-op so the Vue app (and
 * therefore the grid, scroll position, and selections) survive tab-switches.
 * Full teardown only happens when the extension is unregistered.
 */
export function registerAssetsSidebar(runtimeApp: any, { sidebarTabId }: { sidebarTabId: string }): any {
    configureSidebarAssetBadge({ sidebarTabId });
    return registerSidebarTabForApp(runtimeApp, {
        id: sidebarTabId,
        icon: "pi pi-folder",
        title: t("manager.title"),
        label: t("manager.sidebarLabel"),
        tooltip: t("tooltip.sidebarTab"),
        type: "custom",

        render(el: any) {
            resetSidebarAssetBadge();
            // Generation/execution must not block panel rendering or warmup.
            // Backend handlers are independent of the prompt queue, so always
            // kick off the early fetch + warmup when the sidebar mounts.
            startEarlyFetch();
            void runStartupWarmup({ idleOnly: true }).catch(() => null);
            // Mount the Vue app once; subsequent calls reuse the live instance.
            mountKeepAlive(el, AssetsManagerApp, SIDEBAR_MOUNT_KEY);
            setTimeout(() => {
                const pending = consumePendingGeneratedAssets();
                if (!pending) return;
                try {
                    window.dispatchEvent(
                        new CustomEvent(EVENTS.RELOAD_GRID, {
                            detail: {
                                reason: "pending-generated-assets",
                                pending,
                            },
                        }),
                    );
                } catch (e) {
                    console.debug?.(e);
                }
            }, 0);
        },

        destroy(el: any) {
            // Keep-alive: intentionally do NOT call unmountKeepAlive here.
            // The Vue app stays mounted so the grid survives tab-switches.
            // unmountKeepAlive is only called on full extension teardown (see below).
            void el; // suppress lint warning
        },
    });
}

/**
 * Teardown the sidebar Vue app entirely (called only from the entry lifecycle
 * controller on extension cleanup / ComfyUI reload).
 */
export function teardownAssetsSidebar(): void {
    try {
        unmountKeepAlive(null, SIDEBAR_MOUNT_KEY);
    } catch {
        /* ignore */
    }
}

let _sidebarPrewarmStarted = false;
const PREWARM_HOST_ID = "mjr-sidebar-prewarm-host";

/**
 * Prewarm the Assets Manager sidebar Vue app on a detached container so the
 * heavy Vue mount (component tree creation, lazy chunk imports, store hydrate)
 * happens during browser idle time - well before the user clicks the tab.
 *
 * When `render(el)` is later called by ComfyUI, `mountKeepAlive` finds the
 * existing record and only re-attaches the live host into `el` (a single
 * `replaceChildren` call), making the click->cards latency drop from ~2 s to
 * essentially the time it takes to flush one DOM frame.
 *
 * Safe to call multiple times: only the first call does the work.
 */
export function prewarmAssetsSidebar(): boolean {
    if (_sidebarPrewarmStarted) return false;
    if (typeof document === "undefined" || !document?.body) return false;
    _sidebarPrewarmStarted = true;
    try {
        let host = document.getElementById(PREWARM_HOST_ID);
        if (!host) {
            host = document.createElement("div");
            host.id = PREWARM_HOST_ID;
            // Off-screen but attached so layout/measure paths work the same as
            // when the panel is visible. ResizeObserver and clientWidth still
            // need a non-zero box, so size the host like a typical sidebar.
            host.style.cssText =
                "position:fixed;left:-99999px;top:0;width:360px;height:600px;" +
                "overflow:hidden;visibility:hidden;pointer-events:none;contain:strict;";
            host.setAttribute("aria-hidden", "true");
            document.body.appendChild(host);
        }
        mountKeepAlive(host, AssetsManagerApp, SIDEBAR_MOUNT_KEY);
        return true;
    } catch (e) {
        console.debug?.(e);
        _sidebarPrewarmStarted = false;
        return false;
    }
}

// -- bottom panel registration -------------------------------------------------

/**
 * Returns the bottom-panel tab definition.
 * Used both as the declarative `bottomPanelTabs` array entry on the extension
 * object and as the argument to registerBottomPanelTabCompat() for older
 * ComfyUI versions.
 */
export function getGeneratedFeedBottomPanelTab() {
    return {
        id: "majoor-generated-feed",
        title: t("bottomFeed.title", "Generated Feed"),
        icon: "pi pi-images",
        type: "custom",

        render(el: any) {
            mountKeepAlive(el, GeneratedFeedApp, FEED_MOUNT_KEY);
        },

        destroy(el: any) {
            // Keep-alive: do not unmount on every hide.
            void el;
        },
    };
}

export function buildBottomPanelTabs(): unknown[] {
    return [getGeneratedFeedBottomPanelTab()];
}

export function registerGeneratedBottomPanel(runtimeApp: any): any {
    return registerBottomPanelTabForApp(runtimeApp, getGeneratedFeedBottomPanelTab());
}

export function teardownGeneratedFeed(): void {
    try {
        unmountKeepAlive(null, FEED_MOUNT_KEY);
    } catch {
        /* ignore */
    }
}

// -- node context-menu items ---------------------------------------------------

export function isMajoorTrackableNode(node: any): boolean {
    const comfyClass = String(
        node?.comfyClass || node?.type || node?.constructor?.type || "",
    ).trim();
    if (!comfyClass) return false;
    return /save|load|preview/i.test(comfyClass);
}

function getSelectionItems(selectedItem: any) {
    if (!selectedItem) return [];
    if (Array.isArray(selectedItem)) return selectedItem.filter(Boolean);
    if (selectedItem instanceof Set) return Array.from(selectedItem).filter(Boolean);
    if (selectedItem instanceof Map) return Array.from(selectedItem.values()).filter(Boolean);
    if (Array.isArray(selectedItem?.items)) return selectedItem.items.filter(Boolean);
    if (Array.isArray(selectedItem?.nodes)) return selectedItem.nodes.filter(Boolean);
    return [selectedItem];
}

export function getMajoorSelectionToolboxCommands(selectedItem: any): string[] {
    _lastSelectionToolboxNode = firstTrackableSelectionItem(selectedItem);
    if (!_lastSelectionToolboxNode) return [];
    return ["mjr.openNodeContext", "mjr.openAssetsManager", "mjr.openFloatingViewer"];
}

function nodeMenuEntry(label: any, callback: any) {
    return { content: label, callback };
}

export function getMajoorNodeMenuItems(node: any, runtimeApp: any, { sidebarTabId }: { sidebarTabId: string }): unknown[] {
    if (!isMajoorTrackableNode(node)) return [];
    return [
        nodeMenuEntry("View in Assets Manager", () =>
            openAssetsManagerPanel(runtimeApp, sidebarTabId),
        ),
        nodeMenuEntry("Open in Floating Viewer", () => {
            try {
                window.dispatchEvent(new Event(EVENTS.MFV_OPEN));
            } catch (e) {
                console.debug?.(e);
            }
        }),
        nodeMenuEntry("Index Output", () => {
            try {
                triggerRefreshGrid();
                comfyToast(t("toast.rescanningFile", "Rescanning file..."), "info", 1800);
            } catch (e) {
                console.debug?.(e);
            }
        }),
    ];
}
