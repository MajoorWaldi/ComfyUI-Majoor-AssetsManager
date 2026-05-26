/**
 * useDragDrop — Vue lifecycle wrapper for the DnD service.
 *
 * Initialises the global drag-and-drop handlers (window dragover/drop/
 * dragleave, capture phase) when the component mounts and disposes them
 * when it unmounts.  Mounted from the always-on GlobalRuntime Vue app so DnD
 * stays available even when the sidebar tab has not been opened.
 *
 * Phase 7 strangler-fig: DnD stays as a service module; this composable
 * is the thin Vue adapter.
 */
import { onMounted, onUnmounted } from "vue";
import {
    installDragDropRuntime,
    teardownDragDropRuntime,
} from "../../features/dnd/DragDrop.js";

export function useDragDrop() {
    let _dispose: any = null;

    onMounted(() => {
        try {
            _dispose = installDragDropRuntime() ?? null;
        } catch (e) {
            console.warn("[Majoor] useDragDrop: init failed", e);
        }
    });

    onUnmounted(() => {
        try {
            _dispose?.({ force: true });
        } catch (e) {
            console.debug?.(e);
        }
        try {
            teardownDragDropRuntime({ force: true });
        } catch (e) {
            console.debug?.(e);
        }
        _dispose = null;
    });
}
