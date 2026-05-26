import { EVENTS } from "../../app/events.js";
import { getViewerInstance } from "../../components/Viewer.js";

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

export function requestViewerOpen({ assets = [], asset = null, index = 0, mode = "" }: { assets?: unknown[]; asset?: unknown; index?: number; mode?: string } = {}): boolean {
    const list = normalizeAssets(assets, asset);
    if (!list.length) return false;
    const safeIndex = Math.max(0, Math.min(Number(index) || 0, list.length - 1));
    const viewerMode = normalizeViewerMode(mode);
    const detail = {
        assets: list,
        index: safeIndex,
        mode: viewerMode,
        handled: false,
    };

    try {
        window.dispatchEvent(
            new CustomEvent(EVENTS.OPEN_VIEWER, {
                detail,
            }),
        );
        if (detail.handled === true) return true;
    } catch (e: any) {
        console.debug?.(e);
    }

    try {
        const viewer = getViewerInstance();
        viewer.open(list, safeIndex);
        if (viewerMode) viewer.setMode?.(viewerMode);
        return true;
    } catch (e: any) {
        console.debug?.(e);
    }
    return false;
}
