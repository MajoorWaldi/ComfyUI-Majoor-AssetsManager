/**
 * Viewer instance manager — ensures a single active viewer overlay in the DOM.
 * Cleans up stale overlays before mounting a new one.
 */

import { appendViewerOverlayNode, getManagedViewerOverlayNodes } from "./viewerRuntimeHosts.js";

export function getViewerInstance(createViewer) {
    const all = getManagedViewerOverlayNodes();
    if (all.length) {
        const keep = all[all.length - 1];
        for (const el of all) {
            if (el === keep) continue;
            try {
                el?._mjrViewerAPI?.dispose?.();
            } catch (e) {
                console.debug?.(e);
            }
            try {
                el.remove?.();
            } catch (e) {
                console.debug?.(e);
            }
        }
        if (keep && keep._mjrViewerAPI) return keep._mjrViewerAPI;
        try {
            keep?.remove?.();
        } catch (e) {
            console.debug?.(e);
        }
    }

    const viewer = createViewer();
    appendViewerOverlayNode(viewer);
    return viewer._mjrViewerAPI;
}
