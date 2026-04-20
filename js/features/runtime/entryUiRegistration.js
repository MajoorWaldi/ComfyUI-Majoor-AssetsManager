/**
 * UI registration — sidebar, bottom panel, commands, node menu items.
 *
 * Vue migration notes
 * ───────────────────
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

import { get } from "../../api/client.js";
import { buildListURL } from "../../api/endpoints.js";
import { runStartupWarmup } from "../../app/bootstrap.js";
import { APP_CONFIG } from "../../app/config.js";
import {
    activateSidebarTabCompat,
    registerBottomPanelTabCompat,
    registerCommandCompat,
    registerSidebarTabCompat,
} from "../../app/comfyApiBridge.js";
import { EVENTS } from "../../app/events.js";
import { comfyToast } from "../../app/toast.js";
import { t } from "../../app/i18n.js";
import { mountKeepAlive, unmountKeepAlive } from "../../vue/createVueApp.js";
import GlobalRuntimeApp from "../../vue/GlobalRuntime.vue";
import AssetsManagerApp from "../../vue/App.vue";
import GeneratedFeedApp from "../../vue/GeneratedFeedApp.vue";
import { mountTopBarMfvButton, teardownTopBarMfvButton } from "./topBarMfvButton.js";

// ── keep-alive mount keys ─────────────────────────────────────────────────────
const GLOBAL_RUNTIME_ROOT_ID = "mjr-global-runtime-root";
const GLOBAL_RUNTIME_MOUNT_KEY = "_mjrGlobalRuntimeVueApp";
const SIDEBAR_MOUNT_KEY = "_mjrSidebarVueApp";
const FEED_MOUNT_KEY = "_mjrFeedVueApp";

// ── early fetch for faster initial load ──────────────────────────────────────
// Start fetching assets as soon as sidebar is activated, before Vue fully mounts.
// This prefetched data is consumed by useGridLoader when it initializes.
let _earlyFetchPromise = null;
let _earlyFetchKey = null;
// 15 seconds — wide enough to cover slow ComfyUI startups and delayed sidebar
// opens while still invalidating stale data before it becomes misleading.
const EARLY_FETCH_TTL_MS = 15000;
let _earlyFetchTimestamp = 0;
let _earlyFetchAC = null;

// Abort the in-flight early fetch on page unload so it doesn't appear as an
// epoch-1 cancelled request in the next session's network log.
try {
    window.addEventListener("pagehide", () => {
        try { _earlyFetchAC?.abort?.(); } catch (e) { /* ignore */ }
        _earlyFetchAC = null;
        _earlyFetchPromise = null;
        _earlyFetchKey = null;
    }, { once: true });
} catch (e) { /* ignore */ }

function isExecutionBusy() {
    try {
        return !!String(window?.__MJR_EXECUTION_RUNTIME__?.active_prompt_id || "").trim();
    } catch {
        return false;
    }
}

function startEarlyFetch() {
    if (isExecutionBusy()) {
        return null;
    }
    const now = Date.now();
    const key = "output:*:mtime_desc"; // Default browse context

    // Skip if we already have a valid prefetch
    if (_earlyFetchPromise && _earlyFetchKey === key && (now - _earlyFetchTimestamp) < EARLY_FETCH_TTL_MS) {
        return _earlyFetchPromise;
    }

    _earlyFetchKey = key;
    _earlyFetchTimestamp = now;

    try {
        // Create a dedicated AbortController so we can cancel this request
        // cleanly on page unload (pagehide) instead of letting the browser
        // kill it mid-flight and produce epoch-1 entries in the next session.
        try { _earlyFetchAC?.abort?.(); } catch (e) { /* ignore */ }
        _earlyFetchAC = typeof AbortController !== "undefined" ? new AbortController() : null;
        const url = buildListURL({
            query: "*",
            limit: APP_CONFIG.DEFAULT_PAGE_SIZE || 200,
            offset: 0,
            scope: "output",
            sort: "mtime_desc",
            // Include total so useGridLoader can set state.total correctly.
            // Without it the fallback was earlyAssets.length (page size),
            // which caused state.done=true after the first page and blocked
            // all subsequent pagination / infinite scroll.
            includeTotal: true,
        });
        _earlyFetchPromise = get(url, _earlyFetchAC ? { signal: _earlyFetchAC.signal } : {}).catch(() => null);
    } catch {
        _earlyFetchPromise = null;
        _earlyFetchAC = null;
    }

    return _earlyFetchPromise;
}

/**
 * Start the early fetch from an external caller (e.g. entry.js setup).
 * Safe to call multiple times — returns existing promise if still valid.
 */
export { startEarlyFetch };

/**
 * Consume the early fetch result if available and matching.
 * Called by useGridLoader on first load.
 */
export function consumeEarlyFetch(key = "output:*:mtime_desc") {
    if (!_earlyFetchPromise || _earlyFetchKey !== key) {
        return null;
    }
    const now = Date.now();
    if ((now - _earlyFetchTimestamp) >= EARLY_FETCH_TTL_MS) {
        _earlyFetchPromise = null;
        _earlyFetchKey = null;
        return null;
    }
    const promise = _earlyFetchPromise;
    // Clear after consumption to avoid stale reuse
    _earlyFetchPromise = null;
    _earlyFetchKey = null;
    _earlyFetchAC = null;
    return promise;
}

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

export function mountGlobalRuntime() {
    try {
        const root = ensureGlobalRuntimeRoot();
        if (!root) return false;
        const mounted = mountKeepAlive(root, GlobalRuntimeApp, GLOBAL_RUNTIME_MOUNT_KEY);
        mountTopBarMfvButton();
        return mounted;
    } catch {
        return false;
    }
}

export function teardownGlobalRuntime() {
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

// ── sidebar helpers ───────────────────────────────────────────────────────────

export function openAssetsManagerPanel(runtimeApp, sidebarTabId) {
    const opened = activateSidebarTabCompat(runtimeApp, sidebarTabId);
    if (!opened) {
        try {
            window.dispatchEvent(new Event(EVENTS.OPEN_ASSETS_MANAGER));
        } catch (e) {
            console.debug?.(e);
        }
    }
    return opened;
}

export function triggerRefreshGrid() {
    try {
        window.dispatchEvent(
            new CustomEvent(EVENTS.RELOAD_GRID, { detail: { reason: "command" } }),
        );
    } catch (e) {
        console.debug?.(e);
    }
}

// ── commands (declarative array for ComfyUI extension API) ────────────────────

export function buildNativeCommands(runtimeApp, { sidebarTabId, triggerStartupScan }) {
    return [
        {
            id: "mjr.openAssetsManager",
            label: t("manager.title", "Assets Manager"),
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
    ];
}

/** Imperatively registers commands — used as a fallback for older ComfyUI. */
export function registerNativeCommands(runtimeApp, options) {
    for (const command of buildNativeCommands(runtimeApp, options)) {
        registerCommandCompat(runtimeApp, command);
    }
}

// ── sidebar registration ──────────────────────────────────────────────────────

/**
 * Registers the Majoor Assets Manager sidebar tab.
 *
 * The tab uses `type: 'custom'` so we control the full lifecycle.
 * On `render()` a Vue 3 app (AssetsManagerApp) is mounted — or kept alive if
 * already mounted.  `destroy()` is intentionally a no-op so the Vue app (and
 * therefore the grid, scroll position, and selections) survive tab-switches.
 * Full teardown only happens when the extension is unregistered.
 */
export function registerAssetsSidebar(runtimeApp, { sidebarTabId }) {
    return registerSidebarTabCompat(runtimeApp, {
        id: sidebarTabId,
        icon: "pi pi-folder",
        title: t("manager.title"),
        label: t("manager.sidebarLabel"),
        tooltip: t("tooltip.sidebarTab"),
        type: "custom",

        render(el) {
            if (!isExecutionBusy()) {
                // Start fetching assets immediately to reduce perceived load time.
                // The Vue app will consume this prefetched data when it mounts.
                startEarlyFetch();
                void runStartupWarmup({ idleOnly: true }).catch(() => null);
            }
            // Mount the Vue app once; subsequent calls reuse the live instance.
            mountKeepAlive(el, AssetsManagerApp, SIDEBAR_MOUNT_KEY);
        },

        destroy(el) {
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
export function teardownAssetsSidebar() {
    try {
        unmountKeepAlive(null, SIDEBAR_MOUNT_KEY);
    } catch {
        /* ignore */
    }
}

// ── bottom panel registration ─────────────────────────────────────────────────

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

        render(el) {
            mountKeepAlive(el, GeneratedFeedApp, FEED_MOUNT_KEY);
        },

        destroy(el) {
            // Keep-alive: do not unmount on every hide.
            void el;
        },
    };
}

export function buildBottomPanelTabs() {
    return [getGeneratedFeedBottomPanelTab()];
}

export function registerGeneratedBottomPanel(runtimeApp) {
    return registerBottomPanelTabCompat(runtimeApp, getGeneratedFeedBottomPanelTab());
}

export function teardownGeneratedFeed() {
    try {
        unmountKeepAlive(null, FEED_MOUNT_KEY);
    } catch {
        /* ignore */
    }
}

// ── node context-menu items ───────────────────────────────────────────────────

export function isMajoorTrackableNode(node) {
    const comfyClass = String(
        node?.comfyClass || node?.type || node?.constructor?.type || "",
    ).trim();
    if (!comfyClass) return false;
    return /save|load|preview/i.test(comfyClass);
}

function nodeMenuEntry(label, callback) {
    return { content: label, callback };
}

export function getMajoorNodeMenuItems(node, runtimeApp, { sidebarTabId }) {
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
                comfyToast(t("toast.rescanningFile", "Rescanning file…"), "info", 1800);
            } catch (e) {
                console.debug?.(e);
            }
        }),
    ];
}
