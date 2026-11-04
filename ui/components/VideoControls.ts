import { noop, safeCall, safeAddListener } from "../utils/safeCall.js";
import { t } from "../app/i18n.js";

function mountPreviewControls(video: any, hostEl: any) {
    const unsubs: any[] = [];
    try {
        // Preview thumbnails should loop continuously (muted).
        video.controls = false;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;
    } catch (e: any) {
        console.debug?.(e);
    }

    const controls = document.createElement("div");
    controls.className = "mjr-video-controls mjr-video-controls--preview";
    try {
        controls.setAttribute("role", "group");
        controls.setAttribute("aria-label", t("video.previewControls", "Video preview controls"));
    } catch (e: any) {
        console.debug?.(e);
    }

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mjr-video-preview-btn";
    btn.title = t("video.playPause", "Play/Pause");
    try {
        btn.setAttribute("aria-label", t("video.playPause", "Play/Pause"));
    } catch (e: any) {
        console.debug?.(e);
    }

    const icon = document.createElement("span");
    icon.className = "pi pi-play";
    try {
        icon.setAttribute("aria-hidden", "true");
    } catch (e: any) {
        console.debug?.(e);
    }
    btn.appendChild(icon);
    controls.appendChild(btn);

    const setIcon = () => {
        try {
            const paused = Boolean(video?.paused);
            icon.className = `pi ${paused ? "pi-play" : "pi-pause"}`;
        } catch (e: any) {
            console.debug?.(e);
        }
    };

    const tryPlay = () => {
        try {
            const p = video.play?.();
            if (p && typeof p.catch === "function") p.catch(() => {});
        } catch (e: any) {
            console.debug?.(e);
        }
    };

    const toggle = (e: any) => {
        try {
            e?.stopPropagation?.();
        } catch (e: any) {
            console.debug?.(e);
        }
        try {
            if (video.paused) {
                tryPlay();
            } else {
                video.pause?.();
            }
        } catch (e: any) {
            console.debug?.(e);
        }
        setIcon();
    };

    try {
        hostEl.appendChild(controls);
    } catch (e: any) {
        console.debug?.(e);
    }

    // Best-effort autoplay.
    try {
        tryPlay();
    } catch (e: any) {
        console.debug?.(e);
    }
    unsubs.push(safeAddListener(video, "loadedmetadata", () => tryPlay(), { passive: true }));
    unsubs.push(safeAddListener(video, "canplay", () => tryPlay(), { passive: true }));

    unsubs.push(safeAddListener(btn, "click", toggle));
    unsubs.push(safeAddListener(video, "play", setIcon, { passive: true }));
    unsubs.push(safeAddListener(video, "pause", setIcon, { passive: true }));
    unsubs.push(safeAddListener(video, "ended", () => tryPlay(), { passive: true }));
    try {
        setIcon();
    } catch (e: any) {
        console.debug?.(e);
    }

    return {
        controlsEl: controls,
        destroy: () => {
            try {
                for (const u of unsubs) safeCall(() => u?.());
            } catch (e: any) {
                console.debug?.(e);
            }
            try {
                controls.remove?.();
            } catch (e: any) {
                console.debug?.(e);
            }
        },
    };
}

/**
 * Minimal play/pause overlay with continuous muted looping, used by the asset
 * sidebar preview. Must never throw.
 */
export function mountVideoControls(video: any, opts: Record<string, any> = {}) {
    try {
        const hostEl = opts?.hostEl || video?.parentElement;
        if (!video || !hostEl) return { controlsEl: null, destroy: noop };
        return mountPreviewControls(video, hostEl);
    } catch (e: any) {
        console.debug?.(e);
        return { controlsEl: null, destroy: noop };
    }
}
