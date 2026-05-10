/**
 * floatingViewerManager — singleton controller for the Majoor Floating Viewer (MFV).
 *
 * Responsibilities:
 *  - Instantiate/reuse the FloatingViewer DOM element (lazy).
 *  - Expose install/remove helpers for MFV global events; Vue now owns when
 *    those handlers are active.
 *  - On open: immediately load the currently-selected assets from the grid.
 *  - Subscribe to window "mjr:selection-changed" and update the viewer when open.
 *  - Expose `upsertWithContent(fileData)` for LiveStreamTracker.
 */

import { EVENTS } from "../../app/events.js";
import { APP_CONFIG } from "../../app/config.js";
import { getAssetsBatch } from "../../api/client.js";
import { getActiveGridContainer } from "../panel/panelRuntimeRefs.js";
import { getSelectedIdSet } from "../grid/GridSelectionManager.js";
import { getHotkeysState, isHotkeysSuspended } from "../panel/controllers/hotkeysState.js";
import { reportError } from "../../utils/logging.js";
import { NODE_STREAM_FEATURE_ENABLED } from "./nodeStream/nodeStreamFeatureFlag.js";
import { appendFloatingViewerNode } from "./viewerRuntimeHosts.js";
import { getComfyApp } from "../../app/comfyApiBridge.js";

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
const MFV_MODES = Object.freeze({
    SIMPLE: "simple",
    AB: "ab",
    SIDE: "side",
    GRID: "grid",
    GRAPH: "graph",
});

function _normalizeRequestedMode(mode) {
    const normalized = String(mode || "")
        .trim()
        .toLowerCase();
    if (normalized === "sidebyside") return MFV_MODES.SIDE;
    if (Object.values(MFV_MODES).includes(normalized)) return normalized;
    return "";
}

// ── Module state ──────────────────────────────────────────────────────────────

/** @type {FloatingViewer | null} */
let _instance = null;
function _getDefaultLiveActive() {
    return APP_CONFIG.MFV_LIVE_DEFAULT !== false;
}

function _getDefaultPreviewActive() {
    return APP_CONFIG.MFV_PREVIEW_DEFAULT !== false;
}

let _liveActive = _getDefaultLiveActive();
let _previewActive = _getDefaultPreviewActive();
let _nodeStreamActive = false;
let _selectionListenerBound = false;
let _fetchAC = null; // AbortController for the latest in-flight batch fetch
let _loadSeq = 0; // Sequence counter to discard stale _loadFromIds responses

function _syncToggleDefaultsFromConfig() {
    _liveActive = _getDefaultLiveActive();
    _previewActive = _getDefaultPreviewActive();
    _instance?.setLiveActive(_liveActive);
    _instance?.setPreviewActive(_previewActive);
}

// ── Internal helpers ──────────────────────────────────────────────────────────

async function _getInstance() {
    if (!_instance) {
        const FV = await _loadFloatingViewer();
        if (!_instance) {
            // re-check after await
            _instance = new FV({
                controller: {
                    close: () => floatingViewerManager.close(),
                    toggle: () => floatingViewerManager.toggle(),
                    toggleLive: () => floatingViewerManager.toggleLive(),
                    togglePreview: () => floatingViewerManager.togglePreview(),
                    toggleNodeStream: () => floatingViewerManager.toggleNodeStream(),
                    popOut: () => floatingViewerManager.popOut(),
                    onModeChanged: (mode) => {
                        if (!_instance?.isVisible) return;
                        if (mode === MFV_MODES.SIMPLE) return;
                        _syncCurrentGridSelection();
                    },
                    handleForwardedKeydown: (event) => _onGlobalKeydown(event),
                },
            });
            appendFloatingViewerNode(_instance.render());
        }
    }
    try {
        const node = _instance?.element || null;
        if (node?.isConnected === false) {
            appendFloatingViewerNode(node);
        }
    } catch (e) {
        console.debug?.(e);
    }
    return _instance;
}

function _cancelFetch() {
    try {
        _fetchAC?.abort();
    } catch (e) {
        console.debug?.(e);
    }
    _fetchAC = null;
}

function _getSelectionSourceGrid() {
    try {
        const lastGrid = window.__MJR_LAST_SELECTION_GRID__;
        if (lastGrid?.isConnected) return lastGrid;
    } catch (e) {
        console.debug?.(e);
    }
    return getActiveGridContainer();
}

function _disposeInstance() {
    if (!_instance) return;
    try {
        _instance.dispose?.();
    } catch (e) {
        console.debug?.(e);
    }
    _instance = null;
}

function _emitVisibilityChanged(visible) {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
        new CustomEvent(EVENTS.MFV_VISIBILITY_CHANGED, {
            detail: { visible: Boolean(visible) },
        }),
    );
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
        const pins = _instance.getPinnedSlots();
        const hasPins = pins.size > 0;
        const mode = _instance._mode;
        const isGrid = mode === MFV_MODES.GRID;
        const isCompare = mode === MFV_MODES.AB || mode === MFV_MODES.SIDE;
        const maxSlots = isGrid ? 4 : 2;
        let ids = selectedIds.slice(0, maxSlots);

        if (hasPins && (isCompare || isGrid)) {
            // With pinned slots, only load new assets into non-pinned slots.
            const freeCount = maxSlots - pins.size;
            ids = ids.slice(0, Math.max(1, freeCount));
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
            if (hasPins) {
                // Keep all pinned slots, fill others from new assets
                const slotMedia = {
                    A: _instance._mediaA,
                    B: _instance._mediaB,
                    C: _instance._mediaC,
                    D: _instance._mediaD,
                };
                const freeSlots = ["A", "B", "C", "D"].filter((s) => !pins.has(s));
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

        // AB / Side / Simple modes
        if (pins.has("A") && pins.has("B") && _instance._mediaA && _instance._mediaB) {
            // Both pinned — nothing to replace
            return;
        } else if (pins.has("A") && _instance._mediaA) {
            _instance.loadMediaPair(_instance._mediaA, assets[0]);
        } else if (pins.has("B") && _instance._mediaB) {
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
    // Filter out folder cards — they have no previewable media.
    const selectedAssets = Array.isArray(e?.detail?.selectedAssets) ? e.detail.selectedAssets : [];
    const folderIds = new Set(
        selectedAssets
            .filter((a) => String(a?.kind || "").toLowerCase() === "folder")
            .map((a) => String(a?.id || ""))
            .filter(Boolean),
    );
    const selectedIds = Array.isArray(e?.detail?.selectedIds)
        ? e.detail.selectedIds.map(String).filter((id) => Boolean(id) && !folderIds.has(id))
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
    if (typeof window === "undefined") return;
    window.addEventListener(EVENTS.SELECTION_CHANGED, _onSelectionChanged);
    _selectionListenerBound = true;
}

function _unbindSelectionListener() {
    if (typeof window !== "undefined") {
        window.removeEventListener(EVENTS.SELECTION_CHANGED, _onSelectionChanged);
    }
    _selectionListenerBound = false;
    _cancelFetch();
}

// ── Node selection hooks (canvas → sidebar sync) ─────────────────────────────

let _nodeSelectionBound = false;
let _origOnNodeSelected = null;
let _origOnSelectionChange = null;
let _origOnNodeDeselected = null;
let _hadOwnOnNodeSelected = false;
let _hadOwnOnSelectionChange = false;
let _hadOwnOnNodeDeselected = false;
let _canvasPointerupHandler = null;
let _sidebarRefreshTimer = null;
let _sidebarRefreshTimerKind = "";

function _onCanvasNodeSelection() {
    // Refresh the sidebar when canvas node selection changes
    if (_instance?.isVisible) _instance.refreshSidebar?.();
}

// Debounced version for DOM-level fallback — avoids double-refresh when
// LiteGraph callbacks already fired for the same interaction.
function _scheduleCanvasNodeSelection() {
    _clearScheduledCanvasNodeSelection();
    const host = typeof window !== "undefined" ? window : globalThis;
    if (typeof host.requestAnimationFrame === "function") {
        _sidebarRefreshTimerKind = "raf";
        _sidebarRefreshTimer = host.requestAnimationFrame(() => {
            _sidebarRefreshTimer = null;
            _sidebarRefreshTimerKind = "";
            _onCanvasNodeSelection();
        });
        return;
    }
    _sidebarRefreshTimerKind = "timeout";
    _sidebarRefreshTimer = host.setTimeout(() => {
        _sidebarRefreshTimer = null;
        _sidebarRefreshTimerKind = "";
        _onCanvasNodeSelection();
    }, 16);
}

function _clearScheduledCanvasNodeSelection() {
    if (_sidebarRefreshTimer == null) return;
    const host = typeof window !== "undefined" ? window : globalThis;
    try {
        if (_sidebarRefreshTimerKind === "raf" && typeof host.cancelAnimationFrame === "function") {
            host.cancelAnimationFrame(_sidebarRefreshTimer);
        } else if (typeof host.clearTimeout === "function") {
            host.clearTimeout(_sidebarRefreshTimer);
        }
    } catch (e) {
        console.debug?.(e);
    }
    _sidebarRefreshTimer = null;
    _sidebarRefreshTimerKind = "";
}

function _bindNodeSelectionListener() {
    if (_nodeSelectionBound) return;
    try {
        const app = getComfyApp();
        const canvas = app?.canvas;
        if (!canvas) return;

        _hadOwnOnNodeSelected = Object.prototype.hasOwnProperty.call(canvas, "onNodeSelected");
        _hadOwnOnSelectionChange = Object.prototype.hasOwnProperty.call(
            canvas,
            "onSelectionChange",
        );
        _hadOwnOnNodeDeselected = Object.prototype.hasOwnProperty.call(
            canvas,
            "onNodeDeselected",
        );

        _origOnNodeSelected = canvas.onNodeSelected;
        _origOnSelectionChange = canvas.onSelectionChange;
        _origOnNodeDeselected = canvas.onNodeDeselected;

        canvas.onNodeSelected = function (node) {
            _origOnNodeSelected?.call(this, node);
            _onCanvasNodeSelection();
        };
        canvas.onSelectionChange = function (selectedNodes) {
            _origOnSelectionChange?.call(this, selectedNodes);
            _onCanvasNodeSelection();
        };
        // Needed for deselect-all (click on empty canvas) — LiteGraph calls
        // onNodeDeselected for each previously-selected node when clearing.
        canvas.onNodeDeselected = function (node) {
            _origOnNodeDeselected?.call(this, node);
            _onCanvasNodeSelection();
        };

        // DOM-level fallback: catches cases that bypass LiteGraph callbacks
        // (e.g. keyboard-only selection, custom ComfyUI selection code).
        const canvasDomEl = canvas.canvas;
        if (canvasDomEl?.addEventListener) {
            _canvasPointerupHandler = _scheduleCanvasNodeSelection;
            canvasDomEl.addEventListener("pointerup", _canvasPointerupHandler);
        }

        _nodeSelectionBound = true;
    } catch (e) {
        console.debug?.("[MFV] _bindNodeSelectionListener error", e);
    }
}

function _unbindNodeSelectionListener() {
    if (!_nodeSelectionBound) return;
    _clearScheduledCanvasNodeSelection();
    try {
        const app = getComfyApp();
        const canvas = app?.canvas;
        if (canvas) {
            if (_hadOwnOnNodeSelected) canvas.onNodeSelected = _origOnNodeSelected;
            else delete canvas.onNodeSelected;
            if (_hadOwnOnSelectionChange) canvas.onSelectionChange = _origOnSelectionChange;
            else delete canvas.onSelectionChange;
            if (_hadOwnOnNodeDeselected) canvas.onNodeDeselected = _origOnNodeDeselected;
            else delete canvas.onNodeDeselected;
            if (_canvasPointerupHandler && canvas.canvas?.removeEventListener) {
                canvas.canvas.removeEventListener("pointerup", _canvasPointerupHandler);
            }
        }
    } catch (e) {
        console.debug?.("[MFV] _unbindNodeSelectionListener error", e);
    }
    _origOnNodeSelected = null;
    _origOnSelectionChange = null;
    _origOnNodeDeselected = null;
    _hadOwnOnNodeSelected = false;
    _hadOwnOnSelectionChange = false;
    _hadOwnOnNodeDeselected = false;
    _canvasPointerupHandler = null;
    _nodeSelectionBound = false;
}

// ── Public API ────────────────────────────────────────────────────────────────

export const floatingViewerManager = {
    /**
     * Open the MFV with explicit assets instead of syncing from the current grid selection.
     * Useful for context-menu actions where the right-clicked asset is the target.
     */
    async openAssets({ assets = [], asset = null, index = 0, mode = "" } = {}) {
        const list = Array.isArray(assets) ? assets.filter(Boolean) : asset ? [asset] : [];
        if (!list.length) return false;

        const inst = await _getInstance();
        const wasVisible = Boolean(inst.isVisible);
        const safeIndex = Math.max(0, Math.min(Number(index) || 0, list.length - 1));
        const requestedMode = _normalizeRequestedMode(mode);

        if (requestedMode) inst.setMode(requestedMode);
        inst.show();
        _syncViewerControls(inst);
        _bindSelectionListener();
        _bindNodeSelectionListener();

        const currentMode = inst._mode;
        if (currentMode === MFV_MODES.GRID && list.length >= 3) {
            inst.loadMediaQuad(list[0], list[1], list[2], list[3] || null);
        } else if (
            (currentMode === MFV_MODES.AB || currentMode === MFV_MODES.SIDE) &&
            list.length >= 2
        ) {
            inst.loadMediaPair(list[0], list[1]);
        } else {
            inst.loadMediaA(list[safeIndex], { autoMode: false });
        }

        if (!wasVisible) _emitVisibilityChanged(true);
        return true;
    },

    async open() {
        const inst = await _getInstance();
        inst.show();
        _syncViewerControls(inst);
        _bindSelectionListener();
        _bindNodeSelectionListener();
        // If canvas wasn't ready yet (ComfyUI still loading), retry once
        // via rAF so the node selection listener is installed as soon as possible.
        if (!_nodeSelectionBound) {
            requestAnimationFrame(() => _bindNodeSelectionListener());
        }
        // KEY FIX: immediately show whatever is selected in the grid.
        _syncCurrentGridSelection();
        _emitVisibilityChanged(true);
    },

    close() {
        if (_instance) {
            try {
                if (_instance.isPopped) _instance.popIn();
                _instance.hide();
            } catch (e) {
                console.debug?.(e);
            }
        }
        _unbindSelectionListener();
        _unbindNodeSelectionListener();
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
            [MFV_MODES.AB]: MFV_MODES.SIDE,
            [MFV_MODES.SIDE]: MFV_MODES.SIMPLE,
            [MFV_MODES.GRID]: MFV_MODES.SIMPLE,
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
        const inCompare =
            mode === MFV_MODES.AB || mode === MFV_MODES.SIDE || mode === MFV_MODES.GRID;
        if (inCompare) {
            // In compare/grid mode: route the live stream to the first non-pinned slot.
            const pins = inst.getPinnedSlots();
            if (mode === MFV_MODES.GRID) {
                const slotMedia = {
                    A: inst._mediaA,
                    B: inst._mediaB,
                    C: inst._mediaC,
                    D: inst._mediaD,
                };
                const freeSlot = ["A", "B", "C", "D"].find((s) => !pins.has(s)) || "A";
                slotMedia[freeSlot] = fileData;
                inst.loadMediaQuad(slotMedia.A, slotMedia.B, slotMedia.C, slotMedia.D);
            } else if (pins.has("B")) {
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
    async feedPreviewBlob(blob, opts = {}) {
        if (!_previewActive) return;
        const inst = await _getInstance();
        const wasVisible = Boolean(inst.isVisible);
        if (!inst.isVisible) {
            inst.show();
        }
        _syncViewerControls(inst);
        inst.loadPreviewBlob(blob, ...(Object.keys(opts).length ? [opts] : []));
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
     * Forward the canvas-selected node info to the viewer overlay.
     * Called by NodeStreamController.onStatus when the selection changes.
     * Only takes effect when the feature flag is on.
     * @param {string} nodeId
     * @param {string} classType
     * @param {string} [title]
     */
    setNodeStreamSelection(nodeId, classType, title) {
        if (!NODE_STREAM_FEATURE_ENABLED) return;
        const inst = _instance;
        if (!inst) return;
        if (nodeId == null || nodeId === "") {
            inst.setNodeStreamSelection?.(null);
            return;
        }
        inst.setNodeStreamSelection?.({ nodeId, classType, title });
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
        const inCompare =
            mode === MFV_MODES.AB || mode === MFV_MODES.SIDE || mode === MFV_MODES.GRID;
        if (inCompare) {
            const pins = inst.getPinnedSlots();
            if (mode === MFV_MODES.GRID) {
                const slotMedia = {
                    A: inst._mediaA,
                    B: inst._mediaB,
                    C: inst._mediaC,
                    D: inst._mediaD,
                };
                const freeSlot = ["A", "B", "C", "D"].find((s) => !pins.has(s)) || "A";
                slotMedia[freeSlot] = fileData;
                inst.loadMediaQuad(slotMedia.A, slotMedia.B, slotMedia.C, slotMedia.D);
            } else if (pins.has("B")) {
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

const _onMfvOpen = () => floatingViewerManager.open();
const _onMfvClose = () => floatingViewerManager.close();
const _onMfvToggle = () => floatingViewerManager.toggle();
const _onMfvLiveToggle = () => floatingViewerManager.toggleLive();
const _onMfvPreviewToggle = () => floatingViewerManager.togglePreview();
const _onMfvNodeStreamToggle = () => floatingViewerManager.toggleNodeStream();
const _onMfvPopout = () => floatingViewerManager.popOut();
const _onBeforeUnload = () => {
    try {
        if (_instance?.isPopped) _instance.popIn();
    } catch {
        /* noop */
    }
};
const _onSettingsChanged = (event) => {
    const key = String(event?.detail?.key || "");
    if (
        !key ||
        key === "viewer" ||
        key === "viewer.mfvLiveDefault" ||
        key === "viewer.mfvPreviewDefault"
    ) {
        _syncToggleDefaultsFromConfig();
    }
};
const _onGlobalKeydown = (event) => {
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

export function installFloatingViewerGlobalHandlers() {
    if (_globalHandlersInstalled) return;
    if (typeof window === "undefined" || !window?.addEventListener) return;
    window.addEventListener(EVENTS.MFV_OPEN, _onMfvOpen);
    window.addEventListener(EVENTS.MFV_CLOSE, _onMfvClose);
    window.addEventListener(EVENTS.MFV_TOGGLE, _onMfvToggle);
    window.addEventListener(EVENTS.MFV_LIVE_TOGGLE, _onMfvLiveToggle);
    window.addEventListener(EVENTS.MFV_PREVIEW_TOGGLE, _onMfvPreviewToggle);
    if (NODE_STREAM_FEATURE_ENABLED) {
        window.addEventListener(EVENTS.MFV_NODESTREAM_TOGGLE, _onMfvNodeStreamToggle);
    }
    window.addEventListener(EVENTS.MFV_POPOUT, _onMfvPopout);
    window.addEventListener(EVENTS.SETTINGS_CHANGED, _onSettingsChanged);
    window.addEventListener("keydown", _onGlobalKeydown, true);
    window.addEventListener("beforeunload", _onBeforeUnload);
    _globalHandlersInstalled = true;
}

export function removeFloatingViewerGlobalHandlers() {
    if (typeof window === "undefined" || !window?.removeEventListener) {
        _globalHandlersInstalled = false;
        return;
    }
    window.removeEventListener(EVENTS.MFV_OPEN, _onMfvOpen);
    window.removeEventListener(EVENTS.MFV_CLOSE, _onMfvClose);
    window.removeEventListener(EVENTS.MFV_TOGGLE, _onMfvToggle);
    window.removeEventListener(EVENTS.MFV_LIVE_TOGGLE, _onMfvLiveToggle);
    window.removeEventListener(EVENTS.MFV_PREVIEW_TOGGLE, _onMfvPreviewToggle);
    if (NODE_STREAM_FEATURE_ENABLED) {
        window.removeEventListener(EVENTS.MFV_NODESTREAM_TOGGLE, _onMfvNodeStreamToggle);
    }
    window.removeEventListener(EVENTS.MFV_POPOUT, _onMfvPopout);
    window.removeEventListener(EVENTS.SETTINGS_CHANGED, _onSettingsChanged);
    window.removeEventListener("keydown", _onGlobalKeydown, true);
    window.removeEventListener("beforeunload", _onBeforeUnload);
    _globalHandlersInstalled = false;
}

/**
 * Fully tear down the singleton and its global listeners.
 * Called from entry.js during hot-reload cleanup so the next module instance
 * starts from a clean slate.
 */
export function teardownFloatingViewerManager({ reinstallGlobalHandlers = false } = {}) {
    const wasVisible = Boolean(_instance?.isVisible);
    // If the viewer is popped out to a separate window, bring it back first
    try {
        if (_instance?.isPopped) _instance.popIn();
    } catch (e) {
        console.debug?.(e);
    }
    removeFloatingViewerGlobalHandlers();
    _unbindSelectionListener();
    _unbindNodeSelectionListener();
    _cancelFetch();
    _loadSeq += 1;
    _liveActive = _getDefaultLiveActive();
    _previewActive = _getDefaultPreviewActive();
    _nodeStreamActive = false;
    try {
        if (_setControllerNodeStreamActive) _setControllerNodeStreamActive(false);
    } catch (e) {
        console.debug?.(e);
    }
    _disposeInstance();
    if (wasVisible) _emitVisibilityChanged(false);
    if (reinstallGlobalHandlers) {
        installFloatingViewerGlobalHandlers();
    }
}
