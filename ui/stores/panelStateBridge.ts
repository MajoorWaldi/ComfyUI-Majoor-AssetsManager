import { getOptionalPanelStore } from "./getOptionalPanelStore.js";

type PanelStoreFacade = ReturnType<typeof getOptionalPanelStore>;

interface PanelStateBridge {
    panelStore: PanelStoreFacade;
    hydrateStoreFromLegacy: () => void;
    read: (key: string, fallback?: any) => any;
    write: (key: string, value: any) => void;
    controllerState: () => PanelStoreFacade;
    isPiniaOnly: true;
}

/**
 * Creates a thin read/write facade over the Pinia panel store.
 *
 * The `state` and `keys` parameters are kept for call-site compatibility but
 * are no longer used — migration to Pinia-only (Phase 3) is complete.
 *
 */
export function createPanelStateBridge(_state: any, _keys: string[] = []): PanelStateBridge {
    const panelStore = getOptionalPanelStore();

    const read = (key: string, fallback: any = "") => {
        try {
            if (panelStore && key in panelStore) {
                const value = panelStore[key as keyof typeof panelStore];
                if (value !== undefined) return value;
            }
        } catch (e) {
            console.debug?.(e);
        }
        return fallback;
    };

    const write = (key: string, value: any) => {
        try {
            if (panelStore && key in panelStore) {
                (panelStore as unknown as Record<string, any>)[key] = value;
            }
        } catch (e) {
            console.debug?.(e);
        }
    };

    const controllerState = () => panelStore;

    return {
        panelStore,
        hydrateStoreFromLegacy: () => {},
        read,
        write,
        controllerState,
        isPiniaOnly: true,
    };
}
