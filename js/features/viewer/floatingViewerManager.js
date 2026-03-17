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
import { getHotkeysState, isHotkeysSuspended } from "../panel/controllers/hotkeysState.js";
import { reportError } from "../../utils/logging.js";
import { setNodeStreamActive as setControllerNodeStreamActive } from "./nodeStream/NodeStreamController.js";
import { NODE_STREAM_FEATURE_ENABLED } from "./nodeStream/nodeStreamFeatureFlag.js";

// ── Module state ──────────────────────────────────────────────────────────────

/** @type {FloatingViewer | null} */
let _instance = null;
let _liveActive = false;
let _previewActive = false;
let _nodeStreamActive = false;
let _selectionListenerBound = false;
let _fetchAC = null; // AbortController for the latest in-flight batch fetch
let _loadSeq = 0;   // Sequence counter to discard stale _loadFromIds responses

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

function _disposeInstance() {
    if (!_instance) return;
    try { _instance.dispose?.(); } catch (e) { console.debug?.(e); }
    _instance = null;
}

function _emitVisibilityChanged(visible) {
    window.dispatchEvent(new CustomEvent(EVENTS.MFV_VISIBILITY_CHANGED, {
        detail: { visible: Boolean(visible) },
    }));
}

function _syncViewerControls(inst) {
    if (!inst) return;
    inst.setLiveActive(_liveActive);
    inst.setPreviewActive(_previewActive);
    inst.setNodeStreamActive?.(NODE_STREAM_FEATURE_ENABLED ? _nodeStreamActive : false);
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

    const seq = ++_loadSeq;
    const ac = typeof AbortController !== "undefined" ? new AbortController() : null;
    _fetchAC = ac;

    try {
        const pinnedSlot = _instance.getPinnedSlot();
        let ids = selectedIds.slice(0, 2);

        const mode = _instance._mode;
        if (pinnedSlot && (mode === MFV_MODES.AB || mode === MFV_MODES.SIDE)) {
            // With a pinned side, only one new asset is needed.
            ids = [ids[0]];
        } else if (ids.length === 1 && (mode === MFV_MODES.AB || mode === MFV_MODES.SIDE)) {
            // Compare-mode fallback: if only 1 asset, auto-pick the adjacent grid item for slot B.
            const adjId = _findAdjacentGridId(ids[0]);
            if (adjId) ids = [ids[0], adjId];
        }

        const result = await getAssetsBatch(ids, ac ? { signal: ac.signal } : {});
        if (ac?.signal.aborted) return;
        if (_loadSeq !== seq) return; // stale — a newer _loadFromIds call was made
        if (!result?.ok || !Array.isArray(result.data) || !result.data.length) return;
        if (!_instance) return; // disposed while fetching

        const assets = result.data;
        if (pinnedSlot === "A" && _instance._mediaA) {
            _instance.loadMediaPair(_instance._mediaA, assets[0]);
        } else if (pinnedSlot === "B" && _instance._mediaB) {
            _instance.loadMediaPair(assets[0], _instance._mediaB);
        } else if (ids.length >= 2 && assets.length >= 2) {
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
        _syncViewerControls(inst);
        _bindSelectionListener();
        // KEY FIX: immediately show whatever is selected in the grid.
        _syncCurrentGridSelection();
        _emitVisibilityChanged(true);
    },

    close() {
        if (_instance) {
            try {
                if (_instance.isPopped) _instance.popIn();
                _instance.hide();
            } catch (e) { console.debug?.(e); }
        }
        _unbindSelectionListener();
        _emitVisibilityChanged(false);
    },

    toggle() {
        if (_instance?.isVisible) {
            floatingViewerManager.close();
        } else {
            floatingViewerManager.open();
        }
    },

    toggleLive() {
        floatingViewerManager.setLiveActive(!_liveActive);
    },

    togglePreview() {
        floatingViewerManager.setPreviewActive(!_previewActive);
    },

    toggleCompareAB() {
        const inst = _getInstance();
        const wasVisible = Boolean(inst.isVisible);

        if (!wasVisible) {
            inst.setMode(MFV_MODES.AB);
            inst.show();
            _syncViewerControls(inst);
            _bindSelectionListener();
            _syncCurrentGridSelection();
            _emitVisibilityChanged(true);
            return;
        }

        if (inst._mode === MFV_MODES.AB) {
            inst.setMode(MFV_MODES.SIDE);
            return;
        }

        if (inst._mode === MFV_MODES.SIDE) {
            inst.setMode(MFV_MODES.SIMPLE);
            return;
        }

        inst.setMode(MFV_MODES.AB);
        if (inst._mode === MFV_MODES.AB) {
            _syncCurrentGridSelection();
        }
    },

    /**
     * Open the MFV (if needed) and load a single file/asset.
     * Used by LiveStreamTracker for the live generation feed.
     * @param {object} fileData  Raw output { filename, subfolder, type } or full asset object.
     */
    upsertWithContent(fileData) {
        const inst = _getInstance();
        const wasVisible = Boolean(inst.isVisible);
        inst.show();
        _syncViewerControls(inst);
        _bindSelectionListener();

        const mode = inst._mode;
        const inCompare = mode === MFV_MODES.AB || mode === MFV_MODES.SIDE;
        if (inCompare) {
            // In compare mode: route the live stream to the non-pinned slot so the
            // user's selection or pin stays intact.  Default: stream → B, selection → A.
            const pin = inst.getPinnedSlot();
            if (pin === "B") {
                inst.loadMediaPair(fileData, inst._mediaB); // B pinned — stream to A
            } else {
                inst.loadMediaPair(inst._mediaA, fileData); // A pinned (or no pin) — stream to B
            }
        } else {
            inst.loadMediaA(fileData, { autoMode: true });
        }

        if (!wasVisible) _emitVisibilityChanged(true);
    },

    setLiveActive(active) {
        _liveActive = Boolean(active);
        _instance?.setLiveActive(_liveActive);
    },

    getLiveActive() {
        return _liveActive;
    },

    /**
     * Toggle the viewer between the expanded dialog overlay and the floating panel.
     * If the viewer isn't open yet, it is opened first so there's something to see.
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
        const wasVisible = Boolean(inst.isVisible);
        if (!inst.isVisible) {
            inst.show();
        }
        _syncViewerControls(inst);
        inst.loadPreviewBlob(blob);
        if (!wasVisible) _emitVisibilityChanged(true);
    },

    // ── Node Stream (intermediate node outputs) ───────────────────────────

    toggleNodeStream() {
        if (!NODE_STREAM_FEATURE_ENABLED) return;
        floatingViewerManager.setNodeStreamActive(!_nodeStreamActive);
    },

    setNodeStreamActive(active) {
        if (!NODE_STREAM_FEATURE_ENABLED) {
            void active;
            _nodeStreamActive = false;
            setControllerNodeStreamActive(false);
            _instance?.setNodeStreamActive?.(false);
            return;
        }

        _nodeStreamActive = Boolean(active);
        setControllerNodeStreamActive(_nodeStreamActive);
        _instance?.setNodeStreamActive?.(_nodeStreamActive);
    },

    getNodeStreamActive() {
        return NODE_STREAM_FEATURE_ENABLED ? _nodeStreamActive : false;
    },

    /**
     * Feed an intermediate node output into the viewer.
     * Called by the NodeStreamController when a watched node produces output.
     * @param {object} fileData  { filename, subfolder, type, kind?, _nodeId?, _classType? }
     */
    feedNodeStream(fileData) {
        if (!NODE_STREAM_FEATURE_ENABLED) {
            void fileData;
            return;
        }
        if (!_nodeStreamActive) return;
        const inst = _getInstance();
        const wasVisible = Boolean(inst.isVisible);
        if (!inst.isVisible) {
            inst.show();
            _bindSelectionListener();
        }
        _syncViewerControls(inst);

        const mode = inst._mode;
        const inCompare = mode === MFV_MODES.AB || mode === MFV_MODES.SIDE;
        if (inCompare) {
            const pin = inst.getPinnedSlot();
            if (pin === "B") {
                inst.loadMediaPair(fileData, inst._mediaB);
            } else {
                inst.loadMediaPair(inst._mediaA, fileData);
            }
        } else {
            inst.loadMediaA(fileData, { autoMode: true });
        }

        if (!wasVisible) _emitVisibilityChanged(true);
    },
};

// ── Global event wiring (NM-3: named references so teardown can remove them) ──
// Using named handler functions prevents duplicate listeners from accumulating
// on hot-reload. entry.js calls teardownFloatingViewerManager() in its cleanup
// path before re-registering, mirroring the pattern used for API handlers.

let _globalHandlersInstalled = false;

const _onMfvOpen          = () => floatingViewerManager.open();
const _onMfvClose         = () => floatingViewerManager.close();
const _onMfvToggle        = () => floatingViewerManager.toggle();
const _onMfvLiveToggle    = () => floatingViewerManager.toggleLive();
const _onMfvPreviewToggle    = () => floatingViewerManager.togglePreview();
const _onMfvNodeStreamToggle = () => floatingViewerManager.toggleNodeStream();
const _onMfvPopout           = () => floatingViewerManager.popOut();
const _onBeforeUnload        = () => {
    try { if (_instance?.isPopped) _instance.popIn(); } catch (e) { /* noop */ }
};
const _onGlobalKeydown    = (event) => {
    if (!_instance?.isVisible) return;
    if (isHotkeysSuspended()) return;
    if (getHotkeysState().scope === "viewer") return;

    const lower = event?.key?.toLowerCase?.() || "";
    const isTypingTarget =
        event?.target?.isContentEditable ||
        event?.target?.closest?.("input, textarea, select, [contenteditable='true']");
    if (isTypingTarget) return;

    const consume = () => {
        event.preventDefault?.();
        event.stopPropagation?.();
        event.stopImmediatePropagation?.();
    };

    if (!event?.ctrlKey && !event?.metaKey && !event?.altKey && !event?.shiftKey) {
        if (lower === "v") {
            consume();
            floatingViewerManager.toggle();
            return;
        }
        if (lower === "k") {
            consume();
            floatingViewerManager.togglePreview();
            return;
        }
        if (lower === "l") {
            consume();
            floatingViewerManager.toggleLive();
            return;
        }
        if (NODE_STREAM_FEATURE_ENABLED && lower === "n") {
            consume();
            floatingViewerManager.toggleNodeStream();
            return;
        }
        if (lower === "c") {
            consume();
            floatingViewerManager.toggleCompareAB();
        }
        return;
    }

};

function _installGlobalHandlers() {
    if (_globalHandlersInstalled) return;
    window.addEventListener(EVENTS.MFV_OPEN,           _onMfvOpen);
    window.addEventListener(EVENTS.MFV_CLOSE,          _onMfvClose);
    window.addEventListener(EVENTS.MFV_TOGGLE,         _onMfvToggle);
    window.addEventListener(EVENTS.MFV_LIVE_TOGGLE,    _onMfvLiveToggle);
    window.addEventListener(EVENTS.MFV_PREVIEW_TOGGLE,    _onMfvPreviewToggle);
    if (NODE_STREAM_FEATURE_ENABLED) {
        window.addEventListener(EVENTS.MFV_NODESTREAM_TOGGLE, _onMfvNodeStreamToggle);
    }
    window.addEventListener(EVENTS.MFV_POPOUT,            _onMfvPopout);
    window.addEventListener("keydown", _onGlobalKeydown, true);
    window.addEventListener("beforeunload", _onBeforeUnload);
    _globalHandlersInstalled = true;
}

function _removeGlobalHandlers() {
    window.removeEventListener(EVENTS.MFV_OPEN,           _onMfvOpen);
    window.removeEventListener(EVENTS.MFV_CLOSE,          _onMfvClose);
    window.removeEventListener(EVENTS.MFV_TOGGLE,         _onMfvToggle);
    window.removeEventListener(EVENTS.MFV_LIVE_TOGGLE,    _onMfvLiveToggle);
    window.removeEventListener(EVENTS.MFV_PREVIEW_TOGGLE, _onMfvPreviewToggle);
    if (NODE_STREAM_FEATURE_ENABLED) {
        window.removeEventListener(EVENTS.MFV_NODESTREAM_TOGGLE, _onMfvNodeStreamToggle);
    }
    window.removeEventListener(EVENTS.MFV_POPOUT,         _onMfvPopout);
    window.removeEventListener("keydown", _onGlobalKeydown, true);
    window.removeEventListener("beforeunload", _onBeforeUnload);
    _globalHandlersInstalled = false;
}

/**
 * Fully tear down the singleton and its global listeners.
 * Called from entry.js during hot-reload cleanup so the next module instance
 * starts from a clean slate.
 */
export function teardownFloatingViewerManager() {
    const wasVisible = Boolean(_instance?.isVisible);
    // If the viewer is popped out to a separate window, bring it back first
    try { if (_instance?.isPopped) _instance.popIn(); } catch (e) { console.debug?.(e); }
    _removeGlobalHandlers();
    _unbindSelectionListener();
    _cancelFetch();
    _loadSeq += 1;
    _liveActive = false;
    _previewActive = false;
    _nodeStreamActive = false;
    try { setControllerNodeStreamActive(false); } catch (e) { console.debug?.(e); }
    _disposeInstance();
    if (wasVisible) _emitVisibilityChanged(false);
    // entry.js calls teardown during setup before the current module continues
    // initializing, so re-arm the current module's global listeners immediately.
    _installGlobalHandlers();
}

_installGlobalHandlers();
