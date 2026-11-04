import { EVENTS } from "../../app/events.js";

function normalizeViewerMode(mode: any) {
    const normalized = String(mode || "")
        .trim()
        .toLowerCase();
    if (normalized === "ab" || normalized === "sidebyside") return normalized;
    return "";
}

function normalizeAssets(assets: any, asset: any) {
    const list = Array.isArray(assets) ? assets.filter(Boolean) : [];
    if (list.length) return list;
    return asset ? [asset] : [];
}

/**
 * Ask the main (Studio) viewer to open. Resolves true when a viewer handled
 * the request (the Studio overlay listens for OPEN_VIEWER).
 */
export function requestViewerOpen({
    assets = [],
    asset = null,
    index = 0,
    mode = "",
}: { assets?: unknown[]; asset?: unknown; index?: number; mode?: string } = {}): boolean {
    const list = normalizeAssets(assets, asset);
    if (!list.length) return false;
    const safeIndex = Math.max(0, Math.min(Number(index) || 0, list.length - 1));
    const detail = {
        assets: list,
        index: safeIndex,
        mode: normalizeViewerMode(mode),
        handled: false,
    };

    try {
        window.dispatchEvent(new CustomEvent(EVENTS.OPEN_VIEWER, { detail }));
    } catch (e: any) {
        console.debug?.(e);
    }
    return detail.handled === true;
}
