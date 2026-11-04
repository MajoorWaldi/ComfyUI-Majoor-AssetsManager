/**
 * Pure helpers for the Studio viewer and its media player.
 *
 * Kept free of DOM/Vue so frame maths, time formatting and loop handling are
 * unit-tested in isolation.
 */

import { parseFpsValue, readAssetFps } from "../../../utils/mediaFps.js";

export type StudioMediaKind = "image" | "video" | "audio" | "model3d" | "other";

const IMAGE_EXTS = new Set([
    "png",
    "jpg",
    "jpeg",
    "webp",
    "gif",
    "bmp",
    "avif",
    "tif",
    "tiff",
    "jxl",
    "exr",
    "svg",
]);
const VIDEO_EXTS = new Set(["mp4", "webm", "mov", "mkv", "avi", "m4v"]);
const AUDIO_EXTS = new Set(["mp3", "wav", "flac", "ogg", "opus", "m4a", "aac", "aiff"]);
const MODEL3D_EXTS = new Set(["glb", "gltf", "obj", "fbx", "stl", "ply", "splat", "ksplat", "spz"]);

export function assetExt(asset: any): string {
    const name = String(asset?.filename || asset?.name || asset?.filepath || "").trim();
    const dot = name.lastIndexOf(".");
    return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

export function studioMediaKind(asset: any): StudioMediaKind {
    const kind = String(asset?.kind || "")
        .trim()
        .toLowerCase();
    if (kind === "image" || kind === "video" || kind === "audio" || kind === "model3d") return kind;
    const ext = assetExt(asset);
    if (IMAGE_EXTS.has(ext)) return "image";
    if (VIDEO_EXTS.has(ext)) return "video";
    if (AUDIO_EXTS.has(ext)) return "audio";
    if (MODEL3D_EXTS.has(ext)) return "model3d";
    return "other";
}

/** `m:ss.cc` (or `h:mm:ss.cc`); `withCentis=false` drops the hundredths. */
export function formatMediaTime(seconds: number, { withCentis = true } = {}): string {
    const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
    const totalCentis = Math.floor(safe * 100 + 1e-6);
    const centis = totalCentis % 100;
    const totalSeconds = Math.floor(totalCentis / 100);
    const s = totalSeconds % 60;
    const m = Math.floor(totalSeconds / 60) % 60;
    const h = Math.floor(totalSeconds / 3600);
    const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
    const base = `${h > 0 ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
    return withCentis ? `${base}.${String(centis).padStart(2, "0")}` : base;
}

/** Index of the frame shown at `time` (0-based). */
export function frameAtTime(time: number, fps: number | null | undefined): number {
    if (!fps || !Number.isFinite(fps) || fps <= 0) return 0;
    return Math.max(0, Math.floor(Math.max(0, time) * fps + 1e-6));
}

/**
 * Seek target that displays `frame`: slightly inside the frame interval so
 * decoders do not round back to the previous frame.
 */
export function timeForFrame(frame: number, fps: number | null | undefined): number {
    if (!fps || !Number.isFinite(fps) || fps <= 0) return 0;
    return Math.max(0, (Math.max(0, Math.floor(frame)) + 0.25) / fps);
}

export function stepFrameTime(
    time: number,
    fps: number | null | undefined,
    delta: number,
    duration: number,
): number {
    const rate = fps && Number.isFinite(fps) && fps > 0 ? fps : 24;
    const target = timeForFrame(frameAtTime(time, rate) + delta, rate);
    const max = Number.isFinite(duration) && duration > 0 ? duration : target;
    return Math.min(Math.max(0, target), Math.max(0, max - 0.5 / rate));
}

export function totalFrames(
    duration: number,
    fps: number | null | undefined,
    hint?: number | null,
): number | null {
    const h = Number(hint);
    if (Number.isFinite(h) && h > 0) return Math.floor(h);
    if (!fps || !Number.isFinite(duration) || duration <= 0) return null;
    return Math.max(1, Math.round(duration * fps));
}

export interface LoopRange {
    a: number | null;
    b: number | null;
}

/** Normalised A-B range (A < B, inside [0, duration]) or null when incomplete. */
export function normalizeLoop(loop: LoopRange, duration: number): { a: number; b: number } | null {
    if (loop.a == null || loop.b == null) return null;
    const max = Number.isFinite(duration) && duration > 0 ? duration : Math.max(loop.a, loop.b);
    const a = Math.min(Math.max(0, Math.min(loop.a, loop.b)), max);
    const b = Math.min(Math.max(0, Math.max(loop.a, loop.b)), max);
    return b - a >= 0.02 ? { a, b } : null;
}

/** Where playback should jump when an A-B loop is active, else null. */
export function loopWrapTarget(time: number, loop: LoopRange, duration: number): number | null {
    const range = normalizeLoop(loop, duration);
    if (!range) return null;
    if (time >= range.b || time < range.a - 0.05) return range.a;
    return null;
}

export const PLAYBACK_RATES = [0.25, 0.5, 1, 1.5, 2] as const;

export function resolveAssetFps(asset: any, info?: any): number | null {
    return (
        readAssetFps(asset) ??
        parseFpsValue(info?.fps_raw ?? info?.fps ?? info?.frame_rate) ??
        parseFpsValue(asset?.fps)
    );
}

/** Short technical summary for the header, e.g. "1024×1024 · PNG · 1.2 MB". */
export function assetSummary(asset: any): string {
    const parts: string[] = [];
    const w = Number(asset?.width);
    const h = Number(asset?.height);
    if (w > 0 && h > 0) parts.push(`${w}×${h}`);
    const ext = assetExt(asset);
    if (ext) parts.push(ext.toUpperCase());
    const duration = Number(asset?.duration);
    if (duration > 0) parts.push(formatMediaTime(duration, { withCentis: false }));
    const size = Number(asset?.size);
    if (size > 0) parts.push(formatBytes(size));
    return parts.join(" · ");
}

export function formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return "";
    const units = ["B", "KB", "MB", "GB"];
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit += 1;
    }
    return `${value >= 10 || unit === 0 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
}

/** Index window of the filmstrip around `index` (keeps huge lists cheap). */
export function filmstripWindow(
    count: number,
    index: number,
    radius = 40,
): { start: number; end: number } {
    if (count <= 0) return { start: 0, end: 0 };
    const span = radius * 2 + 1;
    if (count <= span) return { start: 0, end: count };
    let start = Math.max(0, index - radius);
    let end = start + span;
    if (end > count) {
        end = count;
        start = count - span;
    }
    return { start, end };
}
