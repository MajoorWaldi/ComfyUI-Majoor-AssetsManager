/**
 * Shared state of the Studio viewer (the default main viewer).
 *
 * A tiny reactive singleton: open/close, the asset list and the current
 * index. The Vue overlay renders from it; `ViewerPortal` decides whether an
 * open request goes here or to the classic viewer.
 */

import { reactive } from "vue";

import { loadMajoorSettings } from "../../../app/settings/settingsCore.js";
import { studioMediaKind } from "./studioMedia.js";

export const studioViewerState = reactive({
    open: false,
    assets: [] as any[],
    index: 0,
    /** Bumped on every open so the overlay can reset per-session UI. */
    session: 0,
});

export function currentStudioAsset(): any {
    return studioViewerState.assets[studioViewerState.index] ?? null;
}

export function openStudioViewer(assets: unknown[], index = 0): boolean {
    const list = (Array.isArray(assets) ? assets : []).filter(Boolean);
    if (!list.length) return false;
    studioViewerState.assets = list;
    studioViewerState.index = Math.max(0, Math.min(Number(index) || 0, list.length - 1));
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
 * The classic viewer keeps the compare modes (A/B, side-by-side), 3D models,
 * and anyone who switched back to it in the settings.
 */
export function shouldUseStudioViewer(assets: unknown[], index: number, mode = ""): boolean {
    const normalizedMode = String(mode || "")
        .trim()
        .toLowerCase();
    if (normalizedMode === "ab" || normalizedMode === "sidebyside") return false;
    try {
        if (loadMajoorSettings()?.viewer?.classic === true) return false;
    } catch (e) {
        console.debug?.(e);
    }
    const list = Array.isArray(assets) ? assets : [];
    const asset = list[Math.max(0, Math.min(Number(index) || 0, list.length - 1))];
    return !!asset && studioMediaKind(asset) !== "model3d";
}
