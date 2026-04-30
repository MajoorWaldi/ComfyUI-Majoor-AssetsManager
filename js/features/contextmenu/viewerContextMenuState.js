import { reactive } from "vue";

function createLayerState() {
    return {
        open: false,
        x: 0,
        y: 0,
        items: [],
        title: "",
    };
}

export const viewerContextMenuState = reactive({
    portalOwnerId: "",
    mountedPortalIds: [],
    main: createLayerState(),
    submenu: createLayerState(),
    tags: {
        open: false,
        x: 0,
        y: 0,
        asset: null,
        onChanged: null,
    },
});

let _nextPortalId = 1;

function _resetLayer(layer) {
    if (!layer) return;
    layer.open = false;
    layer.x = 0;
    layer.y = 0;
    layer.items = [];
    layer.title = "";
}

function _broadcastCloseAllMenus(source = "") {
    try {
        window.dispatchEvent(
            new CustomEvent("mjr-close-all-menus", { detail: { source: String(source || "") } }),
        );
    } catch (e) {
        console.debug?.(e);
    }
}

export function acquireViewerContextMenuPortalOwner() {
    const id = `mjr-viewer-context-menu-portal-${_nextPortalId++}`;
    viewerContextMenuState.mountedPortalIds.push(id);
    if (!viewerContextMenuState.portalOwnerId) {
        viewerContextMenuState.portalOwnerId = id;
    }
    return id;
}

export function releaseViewerContextMenuPortalOwner(id) {
    const next = viewerContextMenuState.mountedPortalIds.filter((entry) => entry !== id);
    viewerContextMenuState.mountedPortalIds.splice(
        0,
        viewerContextMenuState.mountedPortalIds.length,
        ...next,
    );
    if (viewerContextMenuState.portalOwnerId === id) {
        viewerContextMenuState.portalOwnerId = viewerContextMenuState.mountedPortalIds[0] || "";
    }
}

export function isViewerContextMenuPortalOwner(id) {
    return String(viewerContextMenuState.portalOwnerId || "") === String(id || "");
}

export function openViewerContextMenu({ x = 0, y = 0, items = [], title = "" } = {}) {
    _broadcastCloseAllMenus("viewer");
    closeViewerTagsPopover();
    closeViewerSubmenu();
    viewerContextMenuState.main.open = true;
    viewerContextMenuState.main.x = Number(x) || 0;
    viewerContextMenuState.main.y = Number(y) || 0;
    viewerContextMenuState.main.items = Array.isArray(items) ? items.filter(Boolean) : [];
    viewerContextMenuState.main.title = String(title || "");
}

export function closeViewerContextMenu() {
    _resetLayer(viewerContextMenuState.main);
    closeViewerSubmenu();
}

export function openViewerSubmenu({ x = 0, y = 0, items = [], title = "" } = {}) {
    viewerContextMenuState.submenu.open = true;
    viewerContextMenuState.submenu.x = Number(x) || 0;
    viewerContextMenuState.submenu.y = Number(y) || 0;
    viewerContextMenuState.submenu.items = Array.isArray(items) ? items.filter(Boolean) : [];
    viewerContextMenuState.submenu.title = String(title || "");
}

export function closeViewerSubmenu() {
    _resetLayer(viewerContextMenuState.submenu);
}

export function openViewerTagsPopover({ x = 0, y = 0, asset = null, onChanged = null } = {}) {
    closeViewerContextMenu();
    viewerContextMenuState.tags.open = !!asset;
    viewerContextMenuState.tags.x = Number(x) || 0;
    viewerContextMenuState.tags.y = Number(y) || 0;
    viewerContextMenuState.tags.asset = asset || null;
    viewerContextMenuState.tags.onChanged = typeof onChanged === "function" ? onChanged : null;
}

export function closeViewerTagsPopover() {
    viewerContextMenuState.tags.open = false;
    viewerContextMenuState.tags.x = 0;
    viewerContextMenuState.tags.y = 0;
    viewerContextMenuState.tags.asset = null;
    viewerContextMenuState.tags.onChanged = null;
}

export function closeAllViewerContextMenus() {
    closeViewerContextMenu();
    closeViewerTagsPopover();
}
