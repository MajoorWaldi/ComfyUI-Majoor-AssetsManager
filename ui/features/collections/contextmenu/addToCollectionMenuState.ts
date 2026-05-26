import { reactive } from "vue";

export const addToCollectionMenuState = reactive({
    open: false,
    x: 0,
    y: 0,
    assets: [] as unknown[],
});

function broadcastCloseAllMenus() {
    try {
        window.dispatchEvent(new CustomEvent("mjr-close-all-menus"));
    } catch (e) {
        console.debug?.(e);
    }
}

export function openAddToCollectionMenu({ x = 0, y = 0, assets = [] }: { x?: number; y?: number; assets?: unknown[] } = {}): void {
    broadcastCloseAllMenus();
    addToCollectionMenuState.open = Array.isArray(assets) && assets.length > 0;
    addToCollectionMenuState.x = Number(x) || 0;
    addToCollectionMenuState.y = Number(y) || 0;
    addToCollectionMenuState.assets = Array.isArray(assets) ? [...assets] : [];
}

export function closeAddToCollectionMenu(): void {
    addToCollectionMenuState.open = false;
    addToCollectionMenuState.x = 0;
    addToCollectionMenuState.y = 0;
    addToCollectionMenuState.assets = [];
}
