/**
 * Shared state of the Studio viewer (the default main viewer).
 *
 * A tiny reactive singleton: open/close, the asset list and the current
 * index. The Vue overlay renders from it; `ViewerPortal` decides whether an
 * open request goes here or to the classic viewer.
 */

import { reactive } from "vue";

import { loadMajoorSettings } from "../../../app/settings/settingsCore.js";

export const studioViewerState = reactive({
    open: false,
    assets: [] as any[],
    index: 0,
    /** Bumped on every open so the overlay can reset per-session UI. */
    session: 0,
    /** Compare mode requested by the opener ("wipe", "side") or "". */
    compare: "" as "" | "wipe" | "side",
});

export function currentStudioAsset(): any {
    return studioViewerState.assets[studioViewerState.index] ?? null;
}

/** Map the classic viewer's open modes to a Studio compare mode. */
export function studioCompareForMode(mode = ""): "" | "wipe" | "side" {
    const m = String(mode || "")
        .trim()
        .toLowerCase();
    if (m === "ab") return "wipe";
    if (m === "sidebyside") return "side";
    return "";
}

export function openStudioViewer(assets: unknown[], index = 0, mode = ""): boolean {
    const list = (Array.isArray(assets) ? assets : []).filter(Boolean);
    if (!list.length) return false;
    studioViewerState.assets = list;
    studioViewerState.index = Math.max(0, Math.min(Number(index) || 0, list.length - 1));
    studioViewerState.compare = list.length > 1 ? studioCompareForMode(mode) : "";
    studioViewerState.session += 1;
    studioViewerState.open = true;
    return true;
}

export function closeStudioViewer(): void {
    studioViewerState.open = false;
}

export function goToStudioIndex(index: number): void {
    const count = studioViewerState.assets.length;
    if (!count) return;
    studioViewerState.index = ((Math.floor(index) % count) + count) % count;
}

export function stepStudioViewer(delta: number): void {
    goToStudioIndex(studioViewerState.index + delta);
}

/**
 * Whether an open request should use the Studio viewer.
 *
 * The Studio viewer handles every media kind and the compare modes; only
 * users who switched back to the classic viewer in the settings (or a
 * non-media file) go to the classic runtime.
 */
export function shouldUseStudioViewer(assets: unknown[], index: number, _mode = ""): boolean {
    try {
        if (loadMajoorSettings()?.viewer?.classic === true) return false;
    } catch (e) {
        console.debug?.(e);
    }
    const list = Array.isArray(assets) ? assets : [];
    const asset = list[Math.max(0, Math.min(Number(index) || 0, list.length - 1))];
    return !!asset;
}
