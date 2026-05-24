/**
 * useGridContextMenu.js â€” Vue lifecycle wrapper for bindGridContextMenu.
 *
 * Ties context-menu setup/teardown to the Vue component lifecycle so the
 * imperative unbind function is always called on unmount, even during
 * ComfyUI tab-switch cycles.
 *
 * Usage:
 *   const gridContainerRef = ref(null);
 *   useGridContextMenu(gridContainerRef, () => state);
 *
 * Phase 6.2 â€” strangler-fig lifecycle wrapper.
 */

import { watch, onUnmounted } from "vue";
import { bindGridContextMenu } from "../../features/contextmenu/GridContextMenu.js";

/**
 * @param {import("vue").Ref<HTMLElement|null>} gridContainerRef
 * @param {() => object} getState
 */
export function useGridContextMenu(gridContainerRef: any, getState: () => Record<string, any>): any {
    let _unbind: any = null;

    function _bind(container: any) {
        if (!container || container._mjrGridContextMenuBound) return;
        try {
            _unbind = bindGridContextMenu({
                gridContainer: container,
                getState,
            });
        } catch (e) {
            console.debug?.("[useGridContextMenu] bind failed", e);
        }
    }

    function _cleanup() {
        try { _unbind?.(); } catch {}
        _unbind = null;
    }

    // Re-bind whenever the grid container element changes (e.g. after re-mount).
    watch(gridContainerRef, (newEl, oldEl) => {
        if (oldEl) _cleanup();
        if (newEl) _bind(newEl);
    }, { immediate: true });

    onUnmounted(_cleanup);
}
