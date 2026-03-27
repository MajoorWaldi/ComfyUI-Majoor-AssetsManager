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

import { EVENTS } from "../../app/events.js";
import { getAssetsBatch } from "../../api/client.js";
import { getActiveGridContainer } from "../panel/AssetsManagerPanel.js";
import { getSelectedIdSet } from "../grid/GridSelectionManager.js";
import { getHotkeysState, isHotkeysSuspended } from "../panel/controllers/hotkeysState.js";
import { reportError } from "../../utils/logging.js";
import { NODE_STREAM_FEATURE_ENABLED } from "./nodeStream/nodeStreamFeatureFlag.js";

// Lazy-loaded modules — loaded on first use to avoid blocking startup.
/** @type {typeof import("./FloatingViewer.js").FloatingViewer | null} */
let _FloatingViewerClass = null;
let _floatingViewerLoadPromise = null;

async function _loadFloatingViewer() {
    if (_FloatingViewerClass) return _FloatingViewerClass;
    if (!_floatingViewerLoadPromise) {
        _floatingViewerLoadPromise = import("./FloatingViewer.js").then((m) => {
            _FloatingViewerClass = m.FloatingViewer;
            return _FloatingViewerClass;
        });
    }
    return _floatingViewerLoadPromise;
}

/** @type {((active: boolean) => void) | null} */
let _setControllerNodeStreamActive = null;
let _nodeStreamModPromise = null;

async function _loadNodeStreamController() {
    if (_setControllerNodeStreamActive) return;
    if (!_nodeStreamModPromise) {
        _nodeStreamModPromise = import("./nodeStream/NodeStreamController.js").then((m) => {
            _setControllerNodeStreamActive = m.setNodeStreamActive;
        });
    }
    return _nodeStreamModPromise;
}

// Inline MFV mode constants (avoids eager import of FloatingViewer.js).
const MFV_MODES = Object.freeze({ SIMPLE: "simple", AB: "ab", SIDE: "side", GRID: "grid" });

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

async function _getInstance() {
    if (!_instance) {
        const FV = await _loadFloatingViewer();
        if (!_instance) { // re-check after await
            _instance = new FV();
            document.body.appendChild(_instance.render());
        }
    }
    return _instance;
}

function _cancelFetch() {
    try { _fetchAC?.abort(); } catch (e) { console.debug?.(e); }
    _fetchAC = null;
}

function _getSelectionSourceGrid() {
    try {
        const lastGrid = window.__MJR_LAST_SELECTION_GRID__;
        if (lastGrid?.isConnected) return lastGrid;
    } catch (e) { console.debug?.(e); }
    return getActiveGridContainer();
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
        const grid = _getSelectionSourceGrid();
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
 * Fetch up to 4 assets by ID and load them into the viewer.
 * In grid mode, up to 4 are loaded; in compare modes up to 2.
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
        const mode = _instance._mode;
        const isGrid = mode === MFV_MODES.GRID;
        const isCompare = mode === MFV_MODES.AB || mode === MFV_MODES.SIDE;
        const maxSlots = isGrid ? 4 : 2;
        let ids = selectedIds.slice(0, maxSlots);

        if (pinnedSlot && (isCompare || isGrid)) {
            // With a pinned slot, only load new assets into non-pinned slots.
            // Remove duplicates of pinned content; limit to maxSlots - 1 new.
            ids = ids.slice(0, maxSlots - 1);
        } else if (ids.length === 1 && isCompare) {
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

        // Grid mode: load up to 4 assets
        if (isGrid) {
            if (pinnedSlot) {
                // Keep the pinned slot, fill others from new assets
                const slotMedia = {
                    A: _instance._mediaA,
                    B: _instance._mediaB,
                    C: _instance._mediaC,
                    D: _instance._mediaD,
                };
                const freeSlots = ["A", "B", "C", "D"].filter((s) => s !== pinnedSlot);
                let ai = 0;
                for (const slot of freeSlots) {
                    if (ai < assets.length) slotMedia[slot] = assets[ai++];
                }
                _instance.loadMediaQuad(slotMedia.A, slotMedia.B, slotMedia.C, slotMedia.D);
            } else if (assets.length >= 3) {
                _instance.loadMediaQuad(assets[0], assets[1], assets[2], assets[3] || null);
            } else if (assets.length >= 2) {
                _instance.loadMediaPair(assets[0], assets[1]);
            } else {
                _instance.loadMediaA(assets[0], { autoMode: true });
            }
            return;
        }

        // AB / Side / Simple modes (C/D pins only valid in GRID, handled above)
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
        const grid = _getSelectionSourceGrid();
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
        const grid = _getSelectionSourceGrid();
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
    async open() {
        const inst = await _getInstance();
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

    async toggle() {
        if (_instance?.isVisible) {
            floatingViewerManager.close();
        } else {
            await floatingViewerManager.open();
        }
    },

    toggleLive() {
        floatingViewerManager.setLiveActive(!_liveActive);
    },

    togglePreview() {
        floatingViewerManager.setPreviewActive(!_previewActive);
    },

    async toggleCompareAB() {
        const inst = await _getInstance();
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

        // Cycle: AB → Side → Grid → Simple → AB
        const cycle = {
            [MFV_MODES.AB]:     MFV_MODES.SIDE,
            [MFV_MODES.SIDE]:   MFV_MODES.SIMPLE,
            [MFV_MODES.GRID]:   MFV_MODES.SIMPLE,
            [MFV_MODES.SIMPLE]: MFV_MODES.AB,
        };
        const next = cycle[inst._mode] || MFV_MODES.AB;
        inst.setMode(next);
        // Re-sync grid selection when entering a multi-asset mode so the viewer
        // is populated with the current selection (not stale from a previous mode).
        if (next !== MFV_MODES.SIMPLE) {
            _syncCurrentGridSelection();
        }
    },

    /**
     * Open the MFV (if needed) and load a single file/asset.
     * Used by LiveStreamTracker for the live generation feed.
     * @param {object} fileData  Raw output { filename, subfolder, type } or full asset object.
     */
    async upsertWithContent(fileData) {
        const inst = await _getInstance();
        const wasVisible = Boolean(inst.isVisible);
        inst.show();
        _syncViewerControls(inst);
        _bindSelectionListener();

        const mode = inst._mode;
        const inCompare = mode === MFV_MODES.AB || mode === MFV_MODES.SIDE || mode === MFV_MODES.GRID;
        if (inCompare) {
            // In compare/grid mode: route the live stream to the first non-pinned slot.
            const pin = inst.getPinnedSlot();
            if (mode === MFV_MODES.GRID) {
                const slotMedia = { A: inst._mediaA, B: inst._mediaB, C: inst._mediaC, D: inst._mediaD };
                const freeSlot = ["A", "B", "C", "D"].find((s) => s !== pin) || "A";
                slotMedia[freeSlot] = fileData;
                inst.loadMediaQuad(slotMedia.A, slotMedia.B, slotMedia.C, slotMedia.D);
            } else if (pin === "B") {
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
    async popOut() {
        const inst = await _getInstance();
        if (inst.isPopped) {
            inst.popIn();
        } else {
            // Ensure the viewer is visible and loaded before popping out
            if (!inst.isVisible) {
                await floatingViewerManager.open();
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
    async feedPreviewBlob(blob) {
        if (!_previewActive) return;
        const inst = await _getInstance();
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
            if (_setControllerNodeStreamActive) _setControllerNodeStreamActive(false);
            _instance?.setNodeStreamActive?.(false);
            return;
        }

        _nodeStreamActive = Boolean(active);
        // Lazy-load NodeStreamController then apply state.
        void _loadNodeStreamController().then(() => {
            if (_setControllerNodeStreamActive) _setControllerNodeStreamActive(_nodeStreamActive);
        });
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
    async feedNodeStream(fileData) {
        if (!NODE_STREAM_FEATURE_ENABLED) {
            void fileData;
            return;
        }
        if (!_nodeStreamActive) return;
        const inst = await _getInstance();
        const wasVisible = Boolean(inst.isVisible);
        if (!inst.isVisible) {
            inst.show();
            _bindSelectionListener();
        }
        _syncViewerControls(inst);

        const mode = inst._mode;
        const inCompare = mode === MFV_MODES.AB || mode === MFV_MODES.SIDE || mode === MFV_MODES.GRID;
        if (inCompare) {
            const pin = inst.getPinnedSlot();
            if (mode === MFV_MODES.GRID) {
                const slotMedia = { A: inst._mediaA, B: inst._mediaB, C: inst._mediaC, D: inst._mediaD };
                const freeSlot = ["A", "B", "C", "D"].find((s) => s !== pin) || "A";
                slotMedia[freeSlot] = fileData;
                inst.loadMediaQuad(slotMedia.A, slotMedia.B, slotMedia.C, slotMedia.D);
            } else if (pin === "B") {
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
    try { if (_setControllerNodeStreamActive) _setControllerNodeStreamActive(false); } catch (e) { console.debug?.(e); }
    _disposeInstance();
    if (wasVisible) _emitVisibilityChanged(false);
    // entry.js calls teardown during setup before the current module continues
    // initializing, so re-arm the current module's global listeners immediately.
    _installGlobalHandlers();
}

_installGlobalHandlers();
