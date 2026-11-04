import { APP_CONFIG } from "../../app/config.js";
import { buildAssetViewURL } from "../../api/endpoints.js";
import { createModel3DMediaElement, MODEL3D_EXTS } from "./model3dRenderer.js";
import { mountFloatingViewerSimplePlayer } from "./floatingViewerSimplePlayer.js";
import { readAssetFps, readAssetFrameCount } from "../../utils/mediaFps.js";
import { mountStudioPlayerHost } from "./studio/mountStudioPlayer.js";

const VIDEO_EXTS = new Set([".mp4", ".webm", ".mov", ".avi", ".mkv", ".m4v"]);
const AUDIO_EXTS = new Set([".mp3", ".wav", ".flac", ".ogg", ".m4a", ".aac", ".opus", ".wma"]);

export function getFloatingViewerMediaExt(filename: any): string {
    try {
        const name = String(filename || "").trim();
        const idx = name.lastIndexOf(".");
        return idx >= 0 ? name.slice(idx).toLowerCase() : "";
    } catch (_e: any) {
        return "";
    }
}

export function getFloatingViewerMediaKind(fileData: any): string {
    const kind = String(fileData?.kind || "").toLowerCase();
    if (kind === "video") return "video";
    if (kind === "audio") return "audio";
    if (kind === "model3d") return "model3d";
    const rawType = String(fileData?.type || "").toLowerCase();
    const assetType = String(fileData?.asset_type || fileData?.media_type || rawType).toLowerCase();
    if (assetType === "video") return "video";
    if (assetType === "audio") return "audio";
    if (assetType === "model3d") return "model3d";
    const mime = String(fileData?.mime || fileData?.mimetype || fileData?.content_type || "")
        .trim()
        .toLowerCase();
    if (mime.startsWith("video/")) return "video";
    if (mime.startsWith("audio/")) return "audio";
    if (mime.startsWith("image/gif")) return "gif";
    const ext = getFloatingViewerMediaExt(fileData?.filename || "");
    if (ext === ".gif") return "gif";
    if (VIDEO_EXTS.has(ext)) return "video";
    if (AUDIO_EXTS.has(ext)) return "audio";
    if (MODEL3D_EXTS.has(ext)) return "model3d";
    return "image";
}

export function resolveFloatingViewerMediaUrl(fileData: any): string {
    if (!fileData) return "";
    if (fileData.url) return String(fileData.url);
    if (fileData.filename) return buildAssetViewURL(fileData) || "";
    return "";
}

export function createFloatingViewerEmptyState(
    msg: string = "No media  -  select assets in the grid",
): HTMLElement {
    const div = document.createElement("div");
    div.className = "mjr-mfv-empty";
    div.textContent = msg;
    return div;
}

export function createFloatingViewerSlotLabel(text: string, side: string): HTMLElement {
    const el = document.createElement("div");
    el.className = `mjr-mfv-label label-${side}`;
    el.textContent = text;
    return el;
}

export function attemptFloatingViewerAutoplay(mediaEl: any): void {
    if (!mediaEl || typeof mediaEl.play !== "function") return;
    try {
        const p = mediaEl.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
    } catch (e: any) {
        console.debug?.(e);
    }
}

// Browsers generally block unmuted autoplay. When the caller wants sound on by
// default, try playing unmuted first and fall back to muted playback if the
// browser rejects it, so the media still autoplays either way.
export function attemptFloatingViewerAutoplayWithSound(mediaEl: any): void {
    if (!mediaEl || typeof mediaEl.play !== "function") return;
    try {
        const p = mediaEl.play();
        if (p && typeof p.catch === "function") {
            p.catch(() => {
                try {
                    mediaEl.muted = true;
                    attemptFloatingViewerAutoplay(mediaEl);
                } catch (e: any) {
                    console.debug?.(e);
                }
            });
        }
    } catch (e: any) {
        console.debug?.(e);
    }
}

export function findFloatingViewerScrollableAncestor(target: any, boundary: any) {
    let node = target && target.nodeType === 1 ? target : target?.parentElement || null;
    while (node && node !== boundary) {
        try {
            const style = window.getComputedStyle?.(node);
            const canScrollY = /(auto|scroll|overlay)/.test(String(style?.overflowY || ""));
            const canScrollX = /(auto|scroll|overlay)/.test(String(style?.overflowX || ""));
            if (canScrollY || canScrollX) {
                return node;
            }
        } catch (e: any) {
            console.debug?.(e);
        }
        node = node.parentElement || null;
    }
    return null;
}

export function canFloatingViewerWheelScroll(element: any, deltaX: any, deltaY: any) {
    if (!element) return false;
    if (Math.abs(Number(deltaY) || 0) >= Math.abs(Number(deltaX) || 0)) {
        const top = Number(element.scrollTop || 0);
        const maxTop = Math.max(
            0,
            Number(element.scrollHeight || 0) - Number(element.clientHeight || 0),
        );
        if (deltaY < 0 && top > 0) return true;
        if (deltaY > 0 && top < maxTop) return true;
    }
    const left = Number(element.scrollLeft || 0);
    const maxLeft = Math.max(
        0,
        Number(element.scrollWidth || 0) - Number(element.clientWidth || 0),
    );
    if (deltaX < 0 && left > 0) return true;
    if (deltaX > 0 && left < maxLeft) return true;
    return false;
}

export function pauseFloatingViewerMediaIn(rootEl: any) {
    if (!rootEl) return;
    try {
        const mediaEls = rootEl.querySelectorAll?.("video, audio");
        if (!mediaEls || !mediaEls.length) return;
        for (const el of mediaEls) {
            try {
                el.pause?.();
            } catch (e: any) {
                console.debug?.(e);
            }
        }
    } catch (e: any) {
        console.debug?.(e);
    }
}

/**
 * Stop *and release* every video/audio element under `rootEl` before it is
 * detached. Pausing is not enough: a detached <video> keeps its decoder and
 * network stream until garbage collection, and Chromium caps live media
 * players (~75). In Live mode the floating viewer re-renders on every
 * generation, so paused-only players piled up until new videos refused to
 * play anywhere in ComfyUI.
 */
export function releaseFloatingViewerMediaIn(rootEl: any) {
    if (!rootEl) return;
    try {
        const mediaEls = rootEl.querySelectorAll?.("video, audio");
        if (!mediaEls || !mediaEls.length) return;
        for (const el of mediaEls) {
            try {
                el.pause?.();
            } catch (e: any) {
                console.debug?.(e);
            }
            try {
                el.removeAttribute?.("src");
                for (const source of Array.from(el.querySelectorAll?.("source") || []) as any[]) {
                    source.remove?.();
                }
                el.load?.();
            } catch (e: any) {
                console.debug?.(e);
            }
        }
    } catch (e: any) {
        console.debug?.(e);
    }
}

/**
 * Studio player for the floating viewer's single-asset view (video / audio).
 *
 * Returns null when it does not apply (images, 3D) or cannot mount, so
 * callers fall back to the plain media element.
 */
export function buildFloatingViewerStudioPlayer(
    fileData: any,
    { initialMuted = false, initialPlaybackRate = 1, fill = false } = {},
): HTMLElement | null {
    const kind = getFloatingViewerMediaKind(fileData);
    if (kind !== "video" && kind !== "audio") return null;
    const url = resolveFloatingViewerMediaUrl(fileData);
    if (!url) return null;
    try {
        const fps = readAssetFps(fileData);
        return mountStudioPlayerHost({
            src: url,
            kind,
            filename: String(fileData?.filename || ""),
            fps,
            frameCount: readAssetFrameCount(fileData, fps) || null,
            // Generated preview clips are visual-only and must autoplay.
            initialMuted: fileData?._isPreview ? true : initialMuted,
            initialRate: initialPlaybackRate,
            compact: true,
            fill,
            // Same hook as the bare elements: zoom, pan, exposure / channel tone
            // and the overlay guides all address `.mjr-mfv-media`.
            mediaClass: "mjr-mfv-media",
        });
    } catch (e: any) {
        console.debug?.(e);
        return null;
    }
}

export function buildFloatingViewerMediaElement(
    fileData: any,
    { fill = false, controls = true, initialMuted = false, initialPlaybackRate = 1 } = {},
) {
    const url = resolveFloatingViewerMediaUrl(fileData);
    if (!url) return null;
    const kind = getFloatingViewerMediaKind(fileData);
    const mediaClass = `mjr-mfv-media mjr-mfv-media--fit-height${fill ? " mjr-mfv-media--fill" : ""}`;
    const ext = getFloatingViewerMediaExt(fileData?.filename || "");
    const isAnimatedWebp =
        ext === ".webp" && Number(fileData?.duration ?? fileData?.metadata_raw?.duration ?? 0) > 0;

    // Video / audio with controls use the Studio player (same as the main
    // viewer); the other slots of a compare view are bare, synced elements.
    if (controls && (kind === "audio" || kind === "video")) {
        const host = buildFloatingViewerStudioPlayer(fileData, {
            initialMuted,
            initialPlaybackRate,
            fill,
        });
        if (host) return host;
    }

    if (kind === "audio") {
        const audio = document.createElement("audio");
        audio.className = mediaClass;
        audio.src = url;
        audio.controls = false;
        audio.autoplay = true;
        audio.preload = "metadata";
        audio.loop = true;
        audio.muted = initialMuted;
        audio.playbackRate = initialPlaybackRate;
        const autoplay = initialMuted
            ? () => attemptFloatingViewerAutoplay(audio)
            : () => attemptFloatingViewerAutoplayWithSound(audio);
        try {
            audio.addEventListener("loadedmetadata", autoplay, { once: true });
        } catch (e: any) {
            console.debug?.(e);
        }
        autoplay();
        return audio;
    }

    if (kind === "video") {
        const v = document.createElement("video");
        v.className = mediaClass;
        v.src = url;
        v.controls = false;
        v.loop = true;
        v.preload = "metadata";
        // Generated preview clips (including KJNodes Model Preview Override)
        // are visual-only and must autoplay even under strict browser policies.
        v.muted = fileData?._isPreview ? true : initialMuted;
        v.playbackRate = initialPlaybackRate;
        v.autoplay = true;
        v.playsInline = true;
        const autoplay = v.muted
            ? () => attemptFloatingViewerAutoplay(v)
            : () => attemptFloatingViewerAutoplayWithSound(v);
        try {
            v.addEventListener("loadedmetadata", autoplay, { once: true });
        } catch (e: any) {
            console.debug?.(e);
        }
        autoplay();
        return v;
    }

    if (kind === "model3d") {
        return createModel3DMediaElement(fileData, url, {
            hostClassName: `mjr-model3d-host mjr-mfv-model3d-host${fill ? " mjr-mfv-model3d-host--fill" : ""}`,
            canvasClassName: `mjr-mfv-media mjr-model3d-render-canvas${fill ? " mjr-mfv-media--fill" : ""}`,
            hintText: "Rotate: left drag  Pan: right drag  Zoom: wheel or middle drag",
            disableViewerTransform: true,
            pauseDuringExecution: !!APP_CONFIG.FLOATING_VIEWER_PAUSE_DURING_EXECUTION,
        });
    }

    const img = document.createElement("img");
    img.className = mediaClass;
    img.src = url;
    img.alt = String(fileData?.filename || "");
    img.draggable = false;
    if (kind === "gif" || isAnimatedWebp) {
        const playerRoot = mountFloatingViewerSimplePlayer(img, fileData, {
            kind: kind === "gif" ? "gif" : "animated-image",
        });
        return playerRoot || img;
    }
    return img;
}

export function drawFloatingViewerCanvasRoundRect(
    ctx: any,
    x: any,
    y: any,
    w: any,
    h: any,
    r: any,
) {
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") {
        ctx.roundRect(x, y, w, h, r);
    } else {
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
}

export function drawFloatingViewerCanvasLabel(ctx: any, text: any, x: any, y: any) {
    ctx.save();
    ctx.font = "bold 10px system-ui, sans-serif";
    const pad = 5;
    const tw = ctx.measureText(text).width;
    ctx.fillStyle = "rgba(0,0,0,0.58)";
    drawFloatingViewerCanvasRoundRect(ctx, x, y, tw + pad * 2, 18, 4);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText(text, x + pad, y + 13);
    ctx.restore();
}
