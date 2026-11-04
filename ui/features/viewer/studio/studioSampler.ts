/**
 * Pixel access for the Studio review tools (zebra, scopes, probe, loupe).
 *
 * Draws the *source* media (image or the current video frame) into small
 * reusable canvases. Sources are same-origin (/view, /mjr/am), so reading
 * pixels is allowed; failures (tainted canvas, frame not ready) return null.
 */

import { sampleSize } from "./studioFx.js";

export type StudioSource = HTMLImageElement | HTMLVideoElement | HTMLCanvasElement;

let sampleCanvas: HTMLCanvasElement | null = null;
let pixelCanvas: HTMLCanvasElement | null = null;

function canvas2d(existing: HTMLCanvasElement | null, w: number, h: number) {
    const c = existing || document.createElement("canvas");
    if (c.width !== w) c.width = w;
    if (c.height !== h) c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    return { c, ctx };
}

export function sourceSize(source: StudioSource | null | undefined): { w: number; h: number } {
    if (!source) return { w: 0, h: 0 };
    if (source instanceof HTMLVideoElement)
        return { w: source.videoWidth || 0, h: source.videoHeight || 0 };
    if (source instanceof HTMLImageElement)
        return { w: source.naturalWidth || 0, h: source.naturalHeight || 0 };
    return { w: source.width || 0, h: source.height || 0 };
}

export function isSourceReady(source: StudioSource | null | undefined): boolean {
    if (!source) return false;
    if (source instanceof HTMLVideoElement) return source.readyState >= 2 && source.videoWidth > 0;
    if (source instanceof HTMLImageElement) return source.complete && source.naturalWidth > 0;
    return source.width > 0;
}

/** Downsampled RGBA pixels of the source (long edge <= max). */
export function sampleImageData(
    source: StudioSource | null | undefined,
    max = 256,
): { data: Uint8ClampedArray; width: number; height: number } | null {
    if (!isSourceReady(source)) return null;
    const { w, h } = sourceSize(source);
    const size = sampleSize(w, h, max);
    if (!size.w || !size.h) return null;
    try {
        const { c, ctx } = canvas2d(sampleCanvas, size.w, size.h);
        sampleCanvas = c;
        if (!ctx) return null;
        ctx.clearRect(0, 0, size.w, size.h);
        ctx.drawImage(source as CanvasImageSource, 0, 0, size.w, size.h);
        const img = ctx.getImageData(0, 0, size.w, size.h);
        return { data: img.data, width: size.w, height: size.h };
    } catch {
        return null;
    }
}

/** RGBA at source pixel (x, y), or null. */
export function pixelAt(
    source: StudioSource | null | undefined,
    x: number,
    y: number,
): [number, number, number, number] | null {
    if (!isSourceReady(source)) return null;
    const { w, h } = sourceSize(source);
    const px = Math.floor(x);
    const py = Math.floor(y);
    if (px < 0 || py < 0 || px >= w || py >= h) return null;
    try {
        const { c, ctx } = canvas2d(pixelCanvas, 1, 1);
        pixelCanvas = c;
        if (!ctx) return null;
        ctx.clearRect(0, 0, 1, 1);
        ctx.drawImage(source as CanvasImageSource, px, py, 1, 1, 0, 0, 1, 1);
        const d = ctx.getImageData(0, 0, 1, 1).data;
        return [d[0], d[1], d[2], d[3]];
    } catch {
        return null;
    }
}

/** Nearest-neighbour magnification of the region around (x, y) into `target`. */
export function drawLoupe(
    target: HTMLCanvasElement,
    source: StudioSource | null | undefined,
    x: number,
    y: number,
    zoom: number,
): boolean {
    if (!isSourceReady(source)) return false;
    const ctx = target.getContext("2d");
    if (!ctx) return false;
    const span = target.width / Math.max(1, zoom);
    try {
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = "#111";
        ctx.fillRect(0, 0, target.width, target.height);
        ctx.drawImage(
            source as CanvasImageSource,
            Math.floor(x - span / 2),
            Math.floor(y - span / 2),
            Math.ceil(span),
            Math.ceil(span),
            0,
            0,
            target.width,
            target.height,
        );
        return true;
    } catch {
        return false;
    }
}

/** PNG blob of the source at native resolution (copy / export current frame). */
export async function sourceToPngBlob(
    source: StudioSource | null | undefined,
): Promise<Blob | null> {
    if (!isSourceReady(source)) return null;
    const { w, h } = sourceSize(source);
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    try {
        c.getContext("2d")?.drawImage(source as CanvasImageSource, 0, 0);
        return await new Promise((resolve) => c.toBlob(resolve, "image/png"));
    } catch {
        return null;
    }
}
