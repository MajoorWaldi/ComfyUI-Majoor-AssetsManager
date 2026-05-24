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

export const gridContextMenuState = reactive({
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

export function acquireGridContextMenuPortalOwner(): string {
    const id = `mjr-grid-context-menu-portal-${_nextPortalId++}`;
    gridContextMenuState.mountedPortalIds.push(id);
    if (!gridContextMenuState.portalOwnerId) {
        gridContextMenuState.portalOwnerId = id;
    }
    return id;
}

export function releaseGridContextMenuPortalOwner(id: string): void {
    const next = gridContextMenuState.mountedPortalIds.filter((entry: any) => entry !== id);
    gridContextMenuState.mountedPortalIds.splice(
        0,
        gridContextMenuState.mountedPortalIds.length,
        ...next,
    );
    if (gridContextMenuState.portalOwnerId === id) {
        gridContextMenuState.portalOwnerId = gridContextMenuState.mountedPortalIds[0] || "";
    }
}

export function isGridContextMenuPortalOwner(id: string): boolean {
    return String(gridContextMenuState.portalOwnerId || "") === String(id || "");
}

export function openGridContextMenu({ x = 0, y = 0, items = [], title = "" }: { x?: number; y?: number; items?: unknown[]; title?: string } = {}): void {
    _broadcastCloseAllMenus("grid");
    closeGridTagsPopover();
    closeGridSubmenu();
    gridContextMenuState.main.open = true;
    gridContextMenuState.main.x = Number(x) || 0;
    gridContextMenuState.main.y = Number(y) || 0;
    gridContextMenuState.main.items = Array.isArray(items) ? items.filter(Boolean) : [];
    gridContextMenuState.main.title = String(title || "");
}

export function closeGridContextMenu(): void {
    _resetLayer(gridContextMenuState.main);
    closeGridSubmenu();
}

export function openGridSubmenu({ x = 0, y = 0, items = [], title = "" }: { x?: number; y?: number; items?: unknown[]; title?: string } = {}): void {
    gridContextMenuState.submenu.open = true;
    gridContextMenuState.submenu.x = Number(x) || 0;
    gridContextMenuState.submenu.y = Number(y) || 0;
    gridContextMenuState.submenu.items = Array.isArray(items) ? items.filter(Boolean) : [];
    gridContextMenuState.submenu.title = String(title || "");
}

export function closeGridSubmenu(): void {
    _resetLayer(gridContextMenuState.submenu);
}

export function openGridTagsPopover({ x = 0, y = 0, asset = null, onChanged = null }: { x?: number; y?: number; asset?: unknown; onChanged?: (() => void) | null } = {}): void {
    closeGridContextMenu();
    gridContextMenuState.tags.open = !!asset;
    gridContextMenuState.tags.x = Number(x) || 0;
    gridContextMenuState.tags.y = Number(y) || 0;
    gridContextMenuState.tags.asset = asset || null;
    gridContextMenuState.tags.onChanged = typeof onChanged === "function" ? onChanged : null;
}

export function closeGridTagsPopover(): void {
    gridContextMenuState.tags.open = false;
    gridContextMenuState.tags.x = 0;
    gridContextMenuState.tags.y = 0;
    gridContextMenuState.tags.asset = null;
    gridContextMenuState.tags.onChanged = null;
}

export function closeAllGridContextMenus(): void {
    closeGridContextMenu();
    closeGridTagsPopover();
}
