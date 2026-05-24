import { reactive } from "vue";

function createLayerState() {
    return {
        open: false,
        x: 0,
        y: 0,
        items: [] as any[],
        title: "",
    };
}

export const viewerContextMenuState = reactive({
    portalOwnerId: "",
    mountedPortalIds: [] as string[],
    main: createLayerState(),
    submenu: createLayerState(),
    tags: {
        open: false,
        x: 0,
        y: 0,
        asset: null as any,
        onChanged: null as ((() => void) | null),
    },
});

let _nextPortalId = 1;

function _resetLayer(layer: any) {
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
    } catch (e: any) {
        console.debug?.(e);
    }
}

export function acquireViewerContextMenuPortalOwner(): string {
    const id = `mjr-viewer-context-menu-portal-${_nextPortalId++}`;
    viewerContextMenuState.mountedPortalIds.push(id);
    if (!viewerContextMenuState.portalOwnerId) {
        viewerContextMenuState.portalOwnerId = id;
    }
    return id;
}

export function releaseViewerContextMenuPortalOwner(id: string): void {
    const next = viewerContextMenuState.mountedPortalIds.filter((entry: any) => entry !== id);
    viewerContextMenuState.mountedPortalIds.splice(
        0,
        viewerContextMenuState.mountedPortalIds.length,
        ...next,
    );
    if (viewerContextMenuState.portalOwnerId === id) {
        viewerContextMenuState.portalOwnerId = viewerContextMenuState.mountedPortalIds[0] || "";
    }
}

export function isViewerContextMenuPortalOwner(id: string): boolean {
    return String(viewerContextMenuState.portalOwnerId || "") === String(id || "");
}

export function openViewerContextMenu({ x = 0, y = 0, items = [], title = "" }: { x?: number; y?: number; items?: unknown[]; title?: string } = {}): void {
    _broadcastCloseAllMenus("viewer");
    closeViewerTagsPopover();
    closeViewerSubmenu();
    viewerContextMenuState.main.open = true;
    viewerContextMenuState.main.x = Number(x) || 0;
    viewerContextMenuState.main.y = Number(y) || 0;
    viewerContextMenuState.main.items = Array.isArray(items) ? items.filter(Boolean) : [];
    viewerContextMenuState.main.title = String(title || "");
}

export function closeViewerContextMenu(): void {
    _resetLayer(viewerContextMenuState.main);
    closeViewerSubmenu();
}

export function openViewerSubmenu({ x = 0, y = 0, items = [], title = "" }: { x?: number; y?: number; items?: unknown[]; title?: string } = {}): void {
    viewerContextMenuState.submenu.open = true;
    viewerContextMenuState.submenu.x = Number(x) || 0;
    viewerContextMenuState.submenu.y = Number(y) || 0;
    viewerContextMenuState.submenu.items = Array.isArray(items) ? items.filter(Boolean) : [];
    viewerContextMenuState.submenu.title = String(title || "");
}

export function closeViewerSubmenu(): void {
    _resetLayer(viewerContextMenuState.submenu);
}

export function openViewerTagsPopover({ x = 0, y = 0, asset = null, onChanged = null }: { x?: number; y?: number; asset?: unknown; onChanged?: (() => void) | null } = {}): void {
    closeViewerContextMenu();
    viewerContextMenuState.tags.open = !!asset;
    viewerContextMenuState.tags.x = Number(x) || 0;
    viewerContextMenuState.tags.y = Number(y) || 0;
    viewerContextMenuState.tags.asset = asset || null;
    viewerContextMenuState.tags.onChanged = typeof onChanged === "function" ? onChanged : null;
}

export function closeViewerTagsPopover(): void {
    viewerContextMenuState.tags.open = false;
    viewerContextMenuState.tags.x = 0;
    viewerContextMenuState.tags.y = 0;
    viewerContextMenuState.tags.asset = null;
    viewerContextMenuState.tags.onChanged = null;
}

export function closeAllViewerContextMenus(): void {
    closeViewerContextMenu();
    closeViewerTagsPopover();
}
