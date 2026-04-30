/**
 * Inline Asset Sidebar - Integrates into the Assets Manager panel
 *
 * This module keeps the public API stable (`showAssetInSidebar`, `closeSidebar`)
 * while delegating UI rendering to Vue components via `useActiveAsset` (Phase 5).
 */

import { getAssetMetadata, getFileMetadataScoped, getFolderInfo } from "../../api/client.js";
import { loadMajoorSettings } from "../../app/settings.js";
import {
    setActiveAsset,
    clearActiveAsset,
    patchActiveAsset,
} from "../../vue/composables/useActiveAsset.js";

const SIDEBAR_OPEN_WIDTH_PX = 360;
const SIDEBAR_MIN_WIDTH_PX = 240;
const SIDEBAR_MAX_WIDTH_PX = 640;

function _sidebarWidthFromSettings() {
    try {
        const settings = loadMajoorSettings();
        const raw = Number(settings?.sidebar?.widthPx);
        if (!Number.isFinite(raw)) return SIDEBAR_OPEN_WIDTH_PX;
        return Math.max(SIDEBAR_MIN_WIDTH_PX, Math.min(SIDEBAR_MAX_WIDTH_PX, Math.round(raw)));
    } catch {
        return SIDEBAR_OPEN_WIDTH_PX;
    }
}

function _applySidebarOpenState(sidebar, open) {
    if (!sidebar) return;
    const isLeft = String(sidebar?.dataset?.position || "right").toLowerCase() === "left";
    const borderColor = "var(--mjr-border, rgba(255,255,255,0.12))";
    if (open) {
        const w = `${_sidebarWidthFromSettings()}px`;
        sidebar.style.flex = `0 0 ${w}`;
        sidebar.style.width = w;
        sidebar.style.maxWidth = w;
        sidebar.style.minWidth = "0";
        sidebar.style.overflow = "hidden";
        sidebar.style.borderLeft = isLeft ? "none" : `1px solid ${borderColor}`;
        sidebar.style.borderRight = isLeft ? `1px solid ${borderColor}` : "none";
    } else {
        sidebar.style.flex = "0 0 0px";
        sidebar.style.width = "0";
        sidebar.style.maxWidth = "0";
        sidebar.style.minWidth = "0";
        sidebar.style.overflow = "hidden";
        sidebar.style.borderLeft = "none";
        sidebar.style.borderRight = "none";
    }
}

// ─── metadata helpers ─────────────────────────────────────────────────────────

function _hasMeaningfulMetadataRaw(value) {
    if (value == null) return false;
    let obj = value;
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed || trimmed === "{}" || trimmed === "null") return false;
        try {
            obj = JSON.parse(trimmed);
        } catch {
            return false;
        }
    }
    if (typeof obj === "object") {
        try {
            if (obj.geninfo || obj.prompt || obj.workflow) return true;
            if (obj.metadata_raw && typeof obj.metadata_raw === "object") {
                return Boolean(
                    obj.metadata_raw.geninfo ||
                    obj.metadata_raw.prompt ||
                    obj.metadata_raw.workflow,
                );
            }
            return false;
        } catch {
            return false;
        }
    }
    return false;
}

function _hasGenerationLikeData(obj) {
    if (!obj) return false;
    return !!(obj.geninfo || obj.prompt || _hasMeaningfulMetadataRaw(obj.metadata_raw));
}

/**
 * Show asset in inline sidebar.
 *
 * Phase 5: DOM building is now owned by Vue (SidebarSection.vue →
 * AssetSidebarContent.vue). This function only:
 *  1. Applies CSS open-state to the sidebar element (imperative, unchanged).
 *  2. Calls setActiveAsset(asset, onUpdate) to trigger Vue re-render.
 *  3. Sets backward-compat properties (_currentAsset, _currentFullAsset) that
 *     sidebarController.js still reads.
 *  4. Fires loadMetadataAsync which calls patchActiveAsset() with enrichment.
 */
export async function showAssetInSidebar(sidebar, asset, onUpdate) {
    if (!sidebar || !asset) return;
    const isFolderAsset = String(asset?.kind || "").toLowerCase() === "folder";

    try {
        if (sidebar._closeTimer) {
            clearTimeout(sidebar._closeTimer);
            sidebar._closeTimer = null;
        }
    } catch (e) {
        console.debug?.(e);
    }

    const requestSeq = (sidebar._requestSeq = (sidebar._requestSeq || 0) + 1);
    sidebar._currentFetchAbortController?.abort?.();
    sidebar._currentFetchAbortController = null;

    // Open sidebar CSS (still imperative — Vue owns content, not layout).
    sidebar.classList.add("is-open");
    _applySidebarOpenState(sidebar, true);

    // Backward-compat properties read by sidebarController.js.
    sidebar._currentAsset = asset;
    sidebar._currentFullAsset = asset;
    sidebar._ratingTagsSection = null;

    // Trigger Vue re-render with the base asset.
    setActiveAsset(asset, onUpdate);

    // ── Async metadata enrichment ─────────────────────────────────────────────
    const buildFetchOptions = () => {
        sidebar._currentFetchAbortController?.abort?.();
        const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
        sidebar._currentFetchAbortController = controller;
        return controller?.signal ? { signal: controller.signal } : {};
    };

    const applyUpdate = (extra = {}) => {
        if (sidebar._requestSeq !== requestSeq || sidebar._currentAsset !== asset) return;
        const updated = { ...(sidebar._currentFullAsset ?? asset), ...extra };
        sidebar._currentFullAsset = updated;
        patchActiveAsset(extra, onUpdate);
    };

    const loadMetadataAsync = async () => {
        if (sidebar._requestSeq !== requestSeq || sidebar._currentAsset !== asset) return;
        const opts = buildFetchOptions();
        const signal = opts.signal;

        if (isFolderAsset) {
            try {
                const filepath = String(asset?.filepath || asset?.subfolder || "").trim();
                const root_id = String(asset?.root_id || asset?.rootId || "").trim();
                const subfolder = root_id ? String(asset?.subfolder || "").trim() : "";
                const res = await getFolderInfo({ filepath, root_id, subfolder }, opts);
                if (!signal?.aborted && res?.ok && res.data) applyUpdate({ folder_info: res.data });
            } catch (err) {
                if (!signal?.aborted) console.warn("Failed to load folder details:", err);
            } finally {
                if (!signal?.aborted) sidebar._currentFetchAbortController = null;
            }
            return;
        }

        const current = () => sidebar._currentFullAsset ?? asset;
        try {
            if (asset.id && !_hasGenerationLikeData(current()) && !current().exif) {
                const result = await getAssetMetadata(asset.id, opts);
                if (signal?.aborted) return;
                if (result?.ok && result.data) applyUpdate(result.data);
            }
        } catch (err) {
            if (!signal?.aborted) console.warn("Failed to load full asset metadata:", err);
        }
        if (signal?.aborted) return;

        if (!_hasGenerationLikeData(current())) {
            const filename = String(current()?.filename || "").trim();
            const type = String(current()?.type || "output")
                .trim()
                .toLowerCase();
            const subfolder = String(current()?.subfolder || "").trim();
            const root_id = String(current()?.root_id || current()?.rootId || "").trim();
            if (filename) {
                try {
                    const result = await getFileMetadataScoped(
                        { type, filename, subfolder, root_id },
                        opts,
                    );
                    if (signal?.aborted) return;
                    if (result?.ok && result.data) {
                        const md = result.data;
                        applyUpdate({
                            prompt: current().prompt ?? md.prompt,
                            workflow: current().workflow ?? md.workflow,
                            geninfo: current().geninfo ?? md.geninfo,
                            exif: current().exif ?? md.exif,
                            ffprobe: current().ffprobe ?? md.ffprobe,
                            metadata_raw: current().metadata_raw ?? md,
                        });
                    }
                } catch (err) {
                    if (!signal?.aborted) console.warn("Failed to load scoped metadata:", err);
                }
            }
        }
        if (!signal?.aborted) sidebar._currentFetchAbortController = null;
    };

    void loadMetadataAsync();
}

/**
 * Close inline sidebar
 */
export function closeSidebar(sidebar) {
    if (!sidebar) return;

    sidebar._requestSeq = (sidebar._requestSeq || 0) + 1;
    sidebar.classList.remove("is-open");
    _applySidebarOpenState(sidebar, false);
    sidebar._currentAsset = null;
    sidebar._currentFullAsset = null;
    sidebar._currentFetchAbortController?.abort?.();
    sidebar._currentFetchAbortController = null;

    // Tell Vue to clear the sidebar content.
    clearActiveAsset();

    // Dispatch event so controllers can update their state.
    try {
        sidebar.dispatchEvent?.(new CustomEvent("mjr:sidebar-closed", { bubbles: true }));
    } catch (e) {
        console.debug?.(e);
    }
}

// Raw metadata is now available as a toggle inside WorkflowMinimapSection.
