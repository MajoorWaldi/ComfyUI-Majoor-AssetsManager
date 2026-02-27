/**
 * Viewer instance manager — ensures a single active viewer overlay in the DOM.
 * Cleans up stale overlays before mounting a new one.
 */

export function getViewerInstance(createViewer) {
    const all = Array.from(document.querySelectorAll?.(".mjr-viewer-overlay") || []);
    if (all.length) {
        const keep = all[all.length - 1];
        for (const el of all) {
            if (el === keep) continue;
            try {
                el?._mjrViewerAPI?.dispose?.();
            } catch (e) { console.debug?.(e); }
            try {
                el.remove?.();
            } catch (e) { console.debug?.(e); }
        }
        if (keep && keep._mjrViewerAPI) return keep._mjrViewerAPI;
        try {
            keep?.remove?.();
        } catch (e) { console.debug?.(e); }
    }

    const viewer = createViewer();
    document.body.appendChild(viewer);
    return viewer._mjrViewerAPI;
}
