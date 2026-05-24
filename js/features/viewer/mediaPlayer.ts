import { mountVideoControls } from "../../components/VideoControls.js";

export function isPlayableViewerKind(kind: string): boolean {
    const k = String(kind || "").toLowerCase();
    return k === "video" || k === "audio";
}

export function collectPlayableMediaElements({
    mode,
    VIEWER_MODES,
    singleView,
    abView,
    sideView,
}: Record<string, any> = {}): Record<string, any> {
    try {
        let root = singleView;
        if (mode === VIEWER_MODES?.AB_COMPARE) root = abView;
        else if (mode === VIEWER_MODES?.SIDE_BY_SIDE) root = sideView;
        if (!root) return [];
        return Array.from(
            root.querySelectorAll?.(".mjr-viewer-video-src, .mjr-viewer-audio-src") || [],
        );
    } catch {
        return [];
    }
}

export function pickPrimaryPlayableMedia(elements: unknown[]): any {
    try {
        const arr = Array.isArray(elements) ? elements : [];
        return arr.find((v: any) => String(v?.dataset?.mjrCompareRole || "") === "A") || arr[0] || null;
    } catch {
        return null;
    }
}

export function mountUnifiedMediaControls(mediaEl: any, opts: Record<string, any> = {}): any {
    try {
        if (!mediaEl) return null;
        const mediaKind = String(opts?.mediaKind || "").toLowerCase();
        return mountVideoControls(mediaEl, { ...opts, mediaKind });
    } catch {
        return null;
    }
}
