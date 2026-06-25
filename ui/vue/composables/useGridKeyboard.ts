import { onUnmounted, watch } from "vue";
import { installGridKeyboard } from "../../features/grid/GridKeyboard.js";
import { showTagsPopover } from "../../features/contextmenu/GridContextMenu.js";

/**
 * useGridKeyboard  -  Vue lifecycle wrapper around the legacy GridKeyboard engine.
 *
 * Phase 4.4 step: the keyboard lifecycle moves under Vue even though the
 * underlying keyboard implementation is still the legacy imperative module.
 *
 * @param {import("vue").Ref<HTMLElement|null>} gridContainerRef
 */
export function bindLegacyGridKeyboard(container: HTMLElement | null | undefined): () => void {
    if (!container) return () => {};
    const c = container as any;
    try {
        const keyboard = installGridKeyboard({
            gridContainer: container,
            getState: () => c._mjrGetGridState?.() || {},
            getSelectedAssets: () => c._mjrGetSelectedAssets?.() || [],
            getActiveAsset: () => c._mjrGetActiveAsset?.() || null,
            onAssetChanged: (asset) => {
                c._mjrOnKeyboardAssetChanged?.(asset);
            },
            onOpenDetails: () => {
                c._mjrOpenKeyboardDetails?.();
            },
            onOpenTagsEditor: (asset: any) => {
                const activeCard =
                    container.querySelector?.(
                        `.mjr-asset-card[data-mjr-asset-id="${CSS?.escape ? CSS.escape(String(asset?.id || "")) : asset?.id || ""}"]`,
                    ) || null;
                let rect: any = null;
                try {
                    rect = activeCard?.getBoundingClientRect?.() || container.getBoundingClientRect();
                } catch (e) {
                    console.debug?.("[useGridKeyboard] rect lookup failed", e);
                }
                const x = Math.round((rect?.left || 0) + Math.min((rect?.width || 0) * 0.5, 160));
                const y = Math.round((rect?.top || 0) + Math.min((rect?.height || 0) * 0.5, 120));
                showTagsPopover(x, y, asset, () => {
                    c._mjrOnKeyboardAssetChanged?.(asset);
                });
            },
        });
        keyboard.bind();
        c._mjrGridKeyboard = keyboard;
        return () => {
            try {
                keyboard.dispose?.();
            } catch (e) {
                console.debug?.("[useGridKeyboard] dispose failed", e);
            }
            if (c._mjrGridKeyboard === keyboard) {
                c._mjrGridKeyboard = null;
            }
        };
    } catch (e) {
        console.debug?.("[useGridKeyboard] bind failed", e);
        return () => {};
    }
}

export function useGridKeyboard(gridContainerRef: any): any {
    let disposeKeyboard: any = null;

    const cleanup = () => {
        try {
            disposeKeyboard?.();
        } catch (e) {
            console.debug?.("[useGridKeyboard] cleanup failed", e);
        }
        disposeKeyboard = null;
    };

    watch(
        gridContainerRef,
        (next, prev) => {
            if (prev) cleanup();
            if (next) {
                disposeKeyboard = bindLegacyGridKeyboard(next);
            }
        },
        { immediate: true },
    );

    onUnmounted(cleanup);
}
