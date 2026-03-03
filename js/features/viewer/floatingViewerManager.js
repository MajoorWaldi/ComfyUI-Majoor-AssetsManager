/**
 * floatingViewerManager — singleton controller for the Majoor Floating Viewer (MFV).
 *
 * Responsibilities:
 *  - Instantiate/reuse the FloatingViewer DOM element (lazy).
 *  - Handle MFV_OPEN / MFV_CLOSE / MFV_TOGGLE / MFV_LIVE_TOGGLE global events.
 *  - On open: immediately load the currently-selected assets from the grid.
 *  - Subscribe to window "mjr:selection-changed" and update the viewer when open.
 *  - Expose `upsertWithContent(fileData)` for LiveStreamTracker.
 */

import { FloatingViewer, MFV_MODES } from "./FloatingViewer.js";
import { EVENTS } from "../../app/events.js";
import { getAssetsBatch } from "../../api/client.js";
import { getActiveGridContainer } from "../panel/AssetsManagerPanel.js";
import { getSelectedIdSet } from "../grid/GridSelectionManager.js";
import { reportError } from "../../utils/logging.js";

// ── Module state ──────────────────────────────────────────────────────────────

/** @type {FloatingViewer | null} */
let _instance = null;
let _liveActive = true;
let _previewActive = false;
let _selectionListenerBound = false;
let _fetchAC = null; // AbortController for the latest in-flight batch fetch

// ── Internal helpers ──────────────────────────────────────────────────────────

function _getInstance() {
    if (!_instance) {
        _instance = new FloatingViewer();
        document.body.appendChild(_instance.render());
    }
    return _instance;
}

function _cancelFetch() {
    try { _fetchAC?.abort(); } catch (e) { console.debug?.(e); }
    _fetchAC = null;
}

/**
 * When only 1 asset is selected and the MFV is in a compare mode,
 * look up the adjacent card in the rendered grid DOM to use as slot B.
 * This provides a "compare with next" fallback without requiring Ctrl+click.
 * @param {string} selectedId
 * @returns {string | null}
 */
function _findAdjacentGridId(selectedId) {
    try {
        const grid = getActiveGridContainer();
        if (!grid) return null;
        const cards = Array.from(grid.querySelectorAll("[data-mjr-asset-id]"));
        const idx = cards.findIndex((c) => c.dataset.mjrAssetId === String(selectedId));
        if (idx < 0) return null;
        // Prefer the next card; fall back to the previous one
        const adjacent = cards[idx + 1] ?? cards[idx - 1] ?? null;
        const adjId = adjacent?.dataset?.mjrAssetId ?? null;
        return adjId && adjId !== String(selectedId) ? adjId : null;
    } catch (e) {
        console.debug?.("[MFV] _findAdjacentGridId error", e);
        return null;
    }
}

/**
 * Fetch up to 2 assets by ID and load them into the viewer.
 * If only 1 ID is provided and the viewer is in a compare mode,
 * the adjacent grid asset is automatically used as slot B.
 * @param {string[]} selectedIds
 */
async function _loadFromIds(selectedIds) {
    if (!selectedIds.length || !_instance) return;
    _cancelFetch();

    const ac = typeof AbortController !== "undefined" ? new AbortController() : null;
    _fetchAC = ac;

    try {
        let ids = selectedIds.slice(0, 2);

        // Compare-mode fallback: if only 1 asset, auto-pick the adjacent grid item for slot B.
        const mode = _instance._mode;
        if (ids.length === 1 && (mode === MFV_MODES.AB || mode === MFV_MODES.SIDE)) {
            const adjId = _findAdjacentGridId(ids[0]);
            if (adjId) ids = [ids[0], adjId];
        }

        const result = await getAssetsBatch(ids);
        if (ac?.signal.aborted) return;
        if (!result?.ok || !Array.isArray(result.data) || !result.data.length) return;
        if (!_instance) return; // disposed while fetching

        const assets = result.data;
        if (ids.length >= 2 && assets.length >= 2) {
            _instance.loadMediaPair(assets[0], assets[1]);
        } else {
            _instance.loadMediaA(assets[0], { autoMode: true });
        }
    } catch (e) {
        if (e?.name !== "AbortError") {
            reportError(e, "floatingViewerManager._loadFromIds");
        }
    } finally {
        if (_fetchAC === ac) _fetchAC = null;
    }
}

/**
 * Read the current grid selection and immediately populate the viewer.
 * Called when the MFV opens so the user sees content right away.
 */
function _syncCurrentGridSelection() {
    try {
        const grid = getActiveGridContainer();
        if (!grid) return;
        const selected = getSelectedIdSet(grid);
        if (!selected.size) return;
        void _loadFromIds(Array.from(selected));
    } catch (e) {
        console.debug?.("[MFV] Error reading current grid selection", e);
    }
}

// ── Selection listener (active while MFV is visible) ─────────────────────────

function _onSelectionChanged(e) {
    if (!_instance?.isVisible) return;
    const selectedIds = Array.isArray(e?.detail?.selectedIds)
        ? e.detail.selectedIds.map(String).filter(Boolean)
        : [];
    if (selectedIds.length) {
        void _loadFromIds(selectedIds);
        return;
    }
    // Fallback: if payload is missing/empty, read latest selection directly from grid dataset.
    try {
        const grid = getActiveGridContainer();
        if (!grid) return;
        const ids = Array.from(getSelectedIdSet(grid)).map(String).filter(Boolean);
        if (!ids.length) return;
        void _loadFromIds(ids);
    } catch (err) {
        console.debug?.("[MFV] selection fallback failed", err);
    }
}

function _bindSelectionListener() {
    if (_selectionListenerBound) return;
    window.addEventListener(EVENTS.SELECTION_CHANGED, _onSelectionChanged);
    _selectionListenerBound = true;
}

function _unbindSelectionListener() {
    window.removeEventListener(EVENTS.SELECTION_CHANGED, _onSelectionChanged);
    _selectionListenerBound = false;
    _cancelFetch();
}

// ── Public API ────────────────────────────────────────────────────────────────

export const floatingViewerManager = {
    open() {
        const inst = _getInstance();
        inst.show();
        inst.setLiveActive(_liveActive); // Sync button visual state
        _bindSelectionListener();
        // KEY FIX: immediately show whatever is selected in the grid.
        _syncCurrentGridSelection();
        window.dispatchEvent(new CustomEvent(EVENTS.MFV_VISIBILITY_CHANGED, { detail: { visible: true } }));
    },

    close() {
        if (_instance) _instance.hide();
        _unbindSelectionListener();
        window.dispatchEvent(new CustomEvent(EVENTS.MFV_VISIBILITY_CHANGED, { detail: { visible: false } }));
    },

    toggle() {
        if (_instance?.isVisible) {
            floatingViewerManager.close();
        } else {
            floatingViewerManager.open();
        }
    },

    /**
     * Open the MFV (if needed) and load a single file/asset.
     * Used by LiveStreamTracker for the live generation feed.
     * @param {object} fileData  Raw output { filename, subfolder, type } or full asset object.
     */
    upsertWithContent(fileData) {
        const inst = _getInstance();
        inst.show();
        _bindSelectionListener();
        inst.loadMediaA(fileData, { autoMode: true });
    },

    setLiveActive(active) {
        _liveActive = Boolean(active);
        _instance?.setLiveActive(_liveActive);
    },

    getLiveActive() {
        return _liveActive;
    },

    /**
     * Toggle the viewer between popped-out (separate window) and inline.
     * When popping out, the viewer is first opened (if not visible) so the
     * user always sees content in the new window.
     */
    popOut() {
        const inst = _getInstance();
        if (inst.isPopped) {
            inst.popIn();
        } else {
            // Ensure the viewer is visible and loaded before popping out
            if (!inst.isVisible) {
                floatingViewerManager.open();
            }
            inst.popOut();
        }
    },

    // ── Preview stream (KSampler denoising steps) ─────────────────────────

    setPreviewActive(active) {
        _previewActive = Boolean(active);
        _instance?.setPreviewActive(_previewActive);
    },

    getPreviewActive() {
        return _previewActive;
    },

    /**
     * Feed a preview blob from the KSampler WebSocket into the viewer.
     * If preview mode is off or the viewer is not visible, the blob is ignored.
     * @param {Blob} blob  JPEG/PNG Blob from the ComfyUI `b_preview` event.
     */
    feedPreviewBlob(blob) {
        if (!_previewActive) return;
        const inst = _getInstance();
        if (!inst.isVisible) {
            inst.show();
        }
        inst.loadPreviewBlob(blob);
    },
};

// ── Global event wiring (NM-3: named references so teardown can remove them) ──
// Using named handler functions prevents duplicate listeners from accumulating
// on hot-reload. entry.js calls teardownFloatingViewerManager() in its cleanup
// path before re-registering, mirroring the pattern used for API handlers.

let _globalHandlersInstalled = false;

const _onMfvOpen       = () => floatingViewerManager.open();
const _onMfvClose      = () => floatingViewerManager.close();
const _onMfvToggle     = () => floatingViewerManager.toggle();
const _onMfvLiveToggle    = () => floatingViewerManager.setLiveActive(!_liveActive);
const _onMfvPreviewToggle = () => floatingViewerManager.setPreviewActive(!_previewActive);
const _onMfvPopout        = () => floatingViewerManager.popOut();

function _installGlobalHandlers() {
    if (_globalHandlersInstalled) return;
    window.addEventListener(EVENTS.MFV_OPEN,           _onMfvOpen);
    window.addEventListener(EVENTS.MFV_CLOSE,          _onMfvClose);
    window.addEventListener(EVENTS.MFV_TOGGLE,         _onMfvToggle);
    window.addEventListener(EVENTS.MFV_LIVE_TOGGLE,    _onMfvLiveToggle);
    window.addEventListener(EVENTS.MFV_PREVIEW_TOGGLE, _onMfvPreviewToggle);
    window.addEventListener(EVENTS.MFV_POPOUT,         _onMfvPopout);
    _globalHandlersInstalled = true;
}

/**
 * Remove the global MFV event listeners registered by this module, then
 * immediately re-register them for a clean slate.
 * Call from entry.js installEntryRuntimeController() so listeners don't
 * accumulate on hot-reload (NM-3).
 */
export function teardownFloatingViewerManager() {
    // If the viewer is popped out to a separate window, bring it back first
    try { if (_instance?.isPopped) _instance.popIn(); } catch (e) { console.debug?.(e); }
    window.removeEventListener(EVENTS.MFV_OPEN,        _onMfvOpen);
    window.removeEventListener(EVENTS.MFV_CLOSE,       _onMfvClose);
    window.removeEventListener(EVENTS.MFV_TOGGLE,      _onMfvToggle);
    window.removeEventListener(EVENTS.MFV_LIVE_TOGGLE,    _onMfvLiveToggle);
    window.removeEventListener(EVENTS.MFV_PREVIEW_TOGGLE, _onMfvPreviewToggle);
    window.removeEventListener(EVENTS.MFV_POPOUT,         _onMfvPopout);
    _globalHandlersInstalled = false;
    _installGlobalHandlers(); // Re-register immediately so handlers are always active
}

_installGlobalHandlers();

// Close the pop-out window when the main ComfyUI page unloads
window.addEventListener("beforeunload", () => {
    try { if (_instance?.isPopped) _instance.popIn(); } catch (e) { /* noop */ }
});
