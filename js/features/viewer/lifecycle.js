import { safeAddListener, safeCall } from "../../utils/safeCall.js";

export { safeAddListener, safeCall };

export function destroyMediaProcessorsIn(rootEl) {
    if (!rootEl) return;
    try {
        rootEl._mjrSyncAbort?.abort?.();
    } catch (e) { console.debug?.(e); }
    try {
        rootEl._mjrSyncAbort = null;
    } catch (e) { console.debug?.(e); }

    // Stop any media elements first (best-effort).
    try {
        const mediaEls = rootEl.querySelectorAll?.("video, audio");
        if (mediaEls && mediaEls.length) {
            for (const el of mediaEls) {
                try {
                    el.pause?.();
                } catch (e) { console.debug?.(e); }
                try {
                    el?._mjrAudioViz?.destroy?.();
                } catch (e) { console.debug?.(e); }
                try {
                    el._mjrAudioViz = null;
                } catch (e) { console.debug?.(e); }
                try {
                    el.currentTime = 0;
                } catch (e) { console.debug?.(e); }
                try {
                    el.removeAttribute?.("src");
                } catch (e) { console.debug?.(e); }
                try {
                    el.load?.();
                } catch (e) { console.debug?.(e); }
            }
        }
    } catch (e) { console.debug?.(e); }

    try {
        const canvases = rootEl.querySelectorAll?.(".mjr-viewer-media, .mjr-viewer-audio-viz");
        if (canvases && canvases.length) {
            for (const c of canvases) {
                try {
                    c?._mjrProc?.destroy?.();
                } catch (e) { console.debug?.(e); }
                try {
                    c._mjrProc = null;
                } catch (e) { console.debug?.(e); }
                try {
                    c.width = 0;
                    c.height = 0;
                } catch (e) { console.debug?.(e); }
            }
        }
    } catch (e) { console.debug?.(e); }
}

export function createViewerLifecycle(overlay) {
    const unsubs = [];
    try {
        overlay._mjrViewerUnsubs = unsubs;
    } catch (e) { console.debug?.(e); }

    const lifecycle = {
        unsubs,
        safeAddListener,
        safeCall,
        destroyMediaProcessorsIn,
        _observer: null,
        disposeAll: () => {
            try {
                lifecycle._observer?.disconnect?.();
            } catch (e) { console.debug?.(e); }
            try {
                for (const u of unsubs) safeCall(u);
            } catch (e) { console.debug?.(e); }
            try {
                unsubs.length = 0;
            } catch (e) { console.debug?.(e); }
        },
    };

    // Fallback: if the overlay is removed from DOM without calling dispose, clean up listeners.
    try {
        if (overlay && typeof MutationObserver !== "undefined") {
            const obs = new MutationObserver(() => {
                try {
                    if (!document.contains(overlay)) {
                        try {
                            obs.disconnect();
                        } catch (e) { console.debug?.(e); }
                        safeCall(() => lifecycle.disposeAll?.(), "lifecycle:autoDispose");
                    }
                } catch (e) { console.debug?.(e); }
            });
            const targetNode = overlay?.parentElement;
            if (targetNode) {
                obs.observe(targetNode, { childList: true });
            } else {
                obs.observe(document.body, { childList: true });
            }
            lifecycle._observer = obs;
        }
    } catch (e) { console.debug?.(e); }

    try {
        overlay._mjrViewerLifecycle = lifecycle;
    } catch (e) { console.debug?.(e); }

    return lifecycle;
}
