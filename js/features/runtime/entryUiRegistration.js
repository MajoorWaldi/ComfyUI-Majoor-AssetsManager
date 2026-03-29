import {
    activateSidebarTabCompat,
    registerBottomPanelTabCompat,
    registerCommandCompat,
    registerSidebarTabCompat,
} from "../../app/comfyApiBridge.js";
import { EVENTS } from "../../app/events.js";
import { comfyToast } from "../../app/toast.js";
import { t } from "../../app/i18n.js";
import { renderAssetsManager } from "../panel/AssetsManagerPanel.js";
import { getGeneratedFeedBottomPanelTab } from "../bottomPanel/GeneratedFeedTab.js";

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
            function: () => window.dispatchEvent(new Event(EVENTS.MFV_TOGGLE)),
        },
        {
            id: "mjr.refreshAssetsGrid",
            label: t("command.refreshAssetsGrid", "Refresh assets grid"),
            icon: "pi pi-sync",
            function: () => triggerRefreshGrid(),
        },
    ];
}

export function registerNativeCommands(runtimeApp, options) {
    for (const command of buildNativeCommands(runtimeApp, options)) {
        registerCommandCompat(runtimeApp, command);
    }
}

export function registerAssetsSidebar(runtimeApp, { sidebarTabId, useComfyThemeUI }) {
    return registerSidebarTabCompat(runtimeApp, {
        id: sidebarTabId,
        icon: "pi pi-folder",
        title: t("manager.title"),
        label: t("manager.sidebarLabel"),
        tooltip: t("tooltip.sidebarTab"),
        type: "custom",
        render: (el) => {
            try {
                if (el?._mjrKeepAliveMounted) {
                    return;
                }
                el._mjrKeepAliveMounted = true;
            } catch (e) {
                console.debug?.(e);
            }
            void renderAssetsManager(el, { useComfyThemeUI });
        },
        destroy: (el) => {
            // Keep the panel mounted between sidebar open/close cycles so the grid
            // state and DOM survive and reopening the tab does not force a reload.
            try {
                el?._mjrKeepAliveMounted;
            } catch (e) {
                console.debug?.(e);
            }
        },
    });
}

export function registerGeneratedBottomPanel(runtimeApp) {
    return registerBottomPanelTabCompat(runtimeApp, getGeneratedFeedBottomPanelTab());
}

export function buildBottomPanelTabs() {
    return [getGeneratedFeedBottomPanelTab()];
}

export function isMajoorTrackableNode(node) {
    const comfyClass = String(
        node?.comfyClass || node?.type || node?.constructor?.type || "",
    ).trim();
    if (!comfyClass) return false;
    return /save|load|preview/i.test(comfyClass);
}

function nodeMenuEntry(label, callback) {
    return {
        content: label,
        callback,
    };
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
