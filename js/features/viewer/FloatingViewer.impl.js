/**
 * FloatingViewer (MFV) - Majoor Floating Viewer
 *
 * Lightweight floating panel: drag, CSS resize, 3 modes (Simple / A/B / Side-by-Side),
 * Live Stream toggle, and mouse-wheel zoom + click-drag pan.
 * Styled via theme-comfy.css (.mjr-mfv scope).
 */

import { installFollowerVideoSync } from "./videoSync.js";
import { isModel3DInteractionTarget } from "./model3dRenderer.js";
import {
    MFV_MODES,
    MFV_ZOOM_FACTOR,
    MFV_ZOOM_MAX,
    MFV_ZOOM_MIN,
} from "./floatingViewerConstants.js";
import {
    buildFloatingViewerMediaElement as _buildMediaEl,
    canFloatingViewerWheelScroll as _canWheelScrollElement,
    createFloatingViewerEmptyState as _makeEmptyState,
    createFloatingViewerSlotLabel as _makeLabel,
    findFloatingViewerScrollableAncestor as _findScrollableAncestor,
    getFloatingViewerMediaKind as _mediaKind,
    pauseFloatingViewerMediaIn as _pauseMediaIn,
} from "./floatingViewerMedia.js";
import {
    applyFloatingViewerSidebarPosition,
    bindFloatingViewerDocumentUiHandlers,
    buildFloatingViewerGenInfoDOM,
    buildFloatingViewerHeader,
    buildFloatingViewerToolbar,
    getFloatingViewerGenFields,
    rebindFloatingViewerControlHandlers,
    renderFloatingViewer,
    unbindFloatingViewerDocumentUiHandlers,
    updateFloatingViewerGenButtonUI,
    updateFloatingViewerSettingsBtnState,
} from "./floatingViewerUi.js";
import {
    cycleFloatingViewerMode,
    getFloatingViewerPinnedSlots,
    loadFloatingViewerPreviewBlob,
    notifyFloatingViewerModeChanged,
    revokeFloatingViewerPreviewBlob,
    setFloatingViewerLiveActive,
    setFloatingViewerMode,
    setFloatingViewerNodeStreamActive,
    setFloatingViewerPreviewActive,
    updateFloatingViewerModeButtonUI,
    updateFloatingViewerPinUI,
} from "./floatingViewerMode.js";
import {
    activateFloatingViewerDesktopExpandedFallback,
    clearFloatingViewerPopoutCloseWatch,
    fallbackPopoutFloatingViewer,
    installFloatingViewerPopoutStyles,
    popInFloatingViewer,
    popOutFloatingViewer,
    scheduleFloatingViewerPopInFromPopupClose,
    setFloatingViewerDesktopExpanded,
    startFloatingViewerPopoutCloseWatch,
    tryFloatingViewerElectronPopupFallback,
    updateFloatingViewerPopoutButtonUI,
} from "./floatingViewerPopout.js";
import {
    bindFloatingViewerPanelInteractions,
    getFloatingViewerResizeCursor,
    getFloatingViewerResizeDirectionFromPoint,
    initFloatingViewerDrag,
    initFloatingViewerEdgeResize,
    stopFloatingViewerEdgeResize,
} from "./floatingViewerPanel.js";
import {
    captureFloatingViewerView,
    drawFloatingViewerGenInfoOverlay,
    drawFloatingViewerMediaFit,
    estimateFloatingViewerGenInfoOverlayHeight,
} from "./floatingViewerCapture.js";
import {
    loadFloatingViewerMediaA,
    loadFloatingViewerMediaPair,
    loadFloatingViewerMediaQuad,
} from "./floatingViewerLoader.js";
import { disposeFloatingViewerProgressBar } from "./floatingViewerProgress.js";
import { WorkflowGraphMapPanel } from "./workflowGraphMap/WorkflowGraphMapPanel.js";
import { buildGenerationSectionState } from "../../vue/components/panel/sidebar/generationSectionState.js";

function _hasSimplePlayerControls(mediaEl) {
    try {
        return (
            !!mediaEl?.classList?.contains("mjr-mfv-simple-player") ||
            !!mediaEl?.classList?.contains("mjr-mfv-player-host") ||
            !!mediaEl?.querySelector?.(".mjr-video-controls, .mjr-mfv-simple-player-controls")
        );
    } catch (e) {
        console.debug?.(e);
        return false;
    }
}

export { MFV_MODES } from "./floatingViewerConstants.js";

let _mfvInstanceSeq = 0;

export class FloatingViewer {
    constructor({ controller = null } = {}) {
        this._instanceId = ++_mfvInstanceSeq;
        this._controller = controller && typeof controller === "object" ? { ...controller } : null;
        this.element = null;
        this.isVisible = false;
        this._contentEl = null;
        this._genSidebarEl = null;
        this._closeBtn = null;
        this._modeBtn = null;
        this._pinGroup = null;
        this._pinBtns = null;
        this._liveBtn = null;
        this._genBtn = null;
        this._genDropdown = null;
        this._genSidebarEnabled = true;
        this._captureBtn = null;
        this._genInfoSelections = new Set([
            "prompt",
            "seed",
            "model",
            "lora",
            "sampler",
            "scheduler",
            "cfg",
            "step",
            "genTime",
        ]);
        this._mode = MFV_MODES.SIMPLE;
        this._mediaA = null;
        this._mediaB = null;
        this._mediaC = null;
        this._mediaD = null;
        this._pinnedSlots = new Set();
        this._abDividerX = 0.5; // 0..1

        // Pan/zoom state
        this._zoom = 1;
        this._panX = 0;
        this._panY = 0;
        this._panzoomAC = null; // AbortController for event cleanup
        this._dragging = false;
        this._compareSyncAC = null;

        // AbortController for toolbar/header button click listeners (NM-1).
        // Aborted in dispose() so listeners are cleaned up without needing named references.
        this._btnAC = null;
        // Generation counter: incremented on every loadMediaA/loadMediaPair call so
        // stale async metadata enrichment results can be discarded (NM-2).
        this._refreshGen = 0;

        // Pop-out state: external window reference and button.
        this._popoutWindow = null;
        this._popoutBtn = null;
        this._isPopped = false;
        this._desktopExpanded = false;
        this._desktopExpandRestore = null;
        this._desktopPopoutUnsupported = false;
        this._popoutCloseHandler = null;
        this._popoutKeydownHandler = null;
        this._popoutCloseTimer = null;
        this._popoutRestoreGuard = false;

        // Preview stream state: button ref + last blob URL for cleanup.
        this._previewBtn = null;
        this._previewBlobUrl = null;
        this._previewActive = false;

        // Node stream state: button ref + currently selected node overlay.
        this._nodeStreamBtn = null;
        this._nodeStreamActive = false;
        /** @type {{ nodeId: string, classType: string, title?: string } | null} */
        this._nodeStreamSelection = null;
        this._nodeStreamOverlayEl = null;

        // Master AbortController for document-level UI handlers (e.g. click-outside).
        // Aborted in dispose() to guarantee all listeners are removed atomically.
        this._docAC = new AbortController();
        // AbortController for pop-out window listeners (beforeunload, keydown, etc.).
        this._popoutAC = null;

        // Panel-level listeners and edge-resize state.
        this._panelAC = new AbortController();
        this._resizeState = null;
        this._titleId = `mjr-mfv-title-${this._instanceId}`;
        this._genDropdownId = `mjr-mfv-gen-dropdown-${this._instanceId}`;
        this._progressEl = null;
        this._progressNodesEl = null;
        this._progressStepsEl = null;
        this._progressTextEl = null;
        this._mediaProgressEl = null;
        this._mediaProgressTextEl = null;
        this._progressUpdateHandler = null;
        this._progressCurrentNodeId = null;
        this._docClickHost = null;
        this._handleDocClick = null;
        this._mediaControlHandles = [];
        this._layoutObserver = null;
        this._channel = "rgb";
        this._exposureEV = 0;
        this._gridMode = 0;
        this._overlayMaskEnabled = false;
        this._overlayMaskOpacity = 0.65;
        this._overlayFormat = "image";
        this._graphMapPanel = new WorkflowGraphMapPanel({ large: true });
    }

    _dispatchControllerAction(methodName, fallbackEventType) {
        try {
            const handler = this._controller?.[methodName];
            if (typeof handler === "function") {
                return handler();
            }
        } catch (e) {
            console.debug?.(e);
        }
        if (!fallbackEventType) return undefined;
        try {
            window.dispatchEvent(new Event(fallbackEventType));
        } catch (e) {
            console.debug?.(e);
        }
        return undefined;
    }

    _forwardKeydownToController(event) {
        try {
            const handler = this._controller?.handleForwardedKeydown;
            if (typeof handler === "function") {
                handler(event);
                return;
            }
        } catch (e) {
            console.debug?.(e);
        }
        try {
            window.dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: event?.key,
                    code: event?.code,
                    keyCode: event?.keyCode,
                    ctrlKey: event?.ctrlKey,
                    shiftKey: event?.shiftKey,
                    altKey: event?.altKey,
                    metaKey: event?.metaKey,
                }),
            );
        } catch (e) {
            console.debug?.(e);
        }
    }

    // ── Build DOM ─────────────────────────────────────────────────────────────

    render() {
        return renderFloatingViewer(this);
    }

    _buildHeader() {
        return buildFloatingViewerHeader(this);
    }

    _buildToolbar() {
        return buildFloatingViewerToolbar(this);
    }

    _rebindControlHandlers() {
        return rebindFloatingViewerControlHandlers(this);
    }

    _updateSettingsBtnState(active) {
        return updateFloatingViewerSettingsBtnState(this, active);
    }

    _applySidebarPosition() {
        return applyFloatingViewerSidebarPosition(this);
    }

    refreshSidebar() {
        this._sidebar?.refresh();
    }

    _resetGenDropdownForCurrentDocument() {
        return undefined;
    }

    _bindDocumentUiHandlers() {
        return bindFloatingViewerDocumentUiHandlers(this);
    }

    _unbindDocumentUiHandlers() {
        return unbindFloatingViewerDocumentUiHandlers(this);
    }

    _isGenDropdownOpen() {
        return false;
    }

    _openGenDropdown() {
        return undefined;
    }

    _closeGenDropdown() {
        return undefined;
    }

    _updateGenBtnUI() {
        return updateFloatingViewerGenButtonUI(this);
    }

    _buildGenDropdown() {
        return null;
    }

    _getGenFields(fileData) {
        return getFloatingViewerGenFields(this, fileData);
    }

    _buildGenInfoDOM(fileData) {
        return buildFloatingViewerGenInfoDOM(this, fileData);
    }

    _notifyModeChanged() {
        return notifyFloatingViewerModeChanged(this);
    }

    _cycleMode() {
        return cycleFloatingViewerMode(this);
    }

    setMode(mode) {
        return setFloatingViewerMode(this, mode);
    }

    getPinnedSlots() {
        return getFloatingViewerPinnedSlots(this);
    }

    _updatePinUI() {
        return updateFloatingViewerPinUI(this);
    }

    _updateModeBtnUI() {
        return updateFloatingViewerModeButtonUI(this);
    }

    setLiveActive(active) {
        return setFloatingViewerLiveActive(this, active);
    }

    setPreviewActive(active) {
        return setFloatingViewerPreviewActive(this, active);
    }

    loadPreviewBlob(blob, opts = {}) {
        return loadFloatingViewerPreviewBlob(this, blob, opts);
    }

    _revokePreviewBlob() {
        return revokeFloatingViewerPreviewBlob(this);
    }

    setNodeStreamActive(active) {
        return setFloatingViewerNodeStreamActive(this, active);
    }

    /**
     * Update the "currently streamed node" overlay.
     * Pass `null` to hide the overlay (no node selected).
     * The overlay is purely informational and independent of media rendering:
     * if the selected node has no streamable preview, the existing media stays
     * but the overlay is still shown.
     * @param {{ nodeId: string|number, classType?: string, title?: string } | null} selection
     */
    setNodeStreamSelection(selection) {
        if (selection && (selection.nodeId != null || selection.classType)) {
            this._nodeStreamSelection = {
                nodeId: String(selection.nodeId ?? ""),
                classType: String(selection.classType || ""),
                title: selection.title ? String(selection.title) : "",
            };
        } else {
            this._nodeStreamSelection = null;
        }
        this._updateNodeStreamOverlay();
    }

    _updateNodeStreamOverlay() {
        const host = this._contentEl;
        if (!host) return;
        const sel = this._nodeStreamSelection;
        if (!sel) {
            if (this._nodeStreamOverlayEl) {
                this._nodeStreamOverlayEl.remove();
                this._nodeStreamOverlayEl = null;
            }
            return;
        }
        if (!this._nodeStreamOverlayEl || !this._nodeStreamOverlayEl.isConnected) {
            const el = document.createElement("div");
            el.className = "mjr-mfv-node-overlay";
            el.setAttribute("aria-live", "polite");
            this._nodeStreamOverlayEl = el;
        }
        if (this._nodeStreamOverlayEl.parentNode !== host) {
            host.appendChild(this._nodeStreamOverlayEl);
        }
        const idPart = sel.nodeId ? `#${sel.nodeId}` : "";
        const classPart = sel.classType || "Node";
        const titlePart = sel.title && sel.title !== sel.classType ? ` — ${sel.title}` : "";
        this._nodeStreamOverlayEl.textContent = `${idPart} · ${classPart}${titlePart}`.trim();
    }

    loadMediaA(fileData, { autoMode = false } = {}) {
        return loadFloatingViewerMediaA(this, fileData, { autoMode });
    }

    /**
     * Load two assets for compare modes.
     * Auto-switches from SIMPLE → AB on first call.
     */
    loadMediaPair(a, b) {
        return loadFloatingViewerMediaPair(this, a, b);
    }

    /**
     * Load up to 4 assets for grid compare mode.
     * Auto-switches to GRID mode if not already.
     */
    loadMediaQuad(a, b, c, d) {
        return loadFloatingViewerMediaQuad(this, a, b, c, d);
    }

    /** Apply current zoom+pan state to all media elements (img/video only — divider/overlays unaffected). */
    _applyTransform() {
        if (!this._contentEl) return;
        const z = Math.max(MFV_ZOOM_MIN, Math.min(MFV_ZOOM_MAX, this._zoom));
        const vw = this._contentEl.clientWidth || 0;
        const vh = this._contentEl.clientHeight || 0;
        const maxX = Math.max(0, ((z - 1) * vw) / 2);
        const maxY = Math.max(0, ((z - 1) * vh) / 2);
        this._panX = Math.max(-maxX, Math.min(maxX, this._panX));
        this._panY = Math.max(-maxY, Math.min(maxY, this._panY));
        const t = `translate(${this._panX}px,${this._panY}px) scale(${z})`;
        for (const el of this._contentEl.querySelectorAll(".mjr-mfv-media")) {
            if (el?._mjrDisableViewerTransform) continue;
            el.style.transform = t;
            el.style.transformOrigin = "center";
        }
        // Cursor feedback — use CSS classes
        this._contentEl.classList.remove("mjr-mfv-content--grab", "mjr-mfv-content--grabbing");
        if (z > 1.01) {
            this._contentEl.classList.add(
                this._dragging ? "mjr-mfv-content--grabbing" : "mjr-mfv-content--grab",
            );
        }
        this._applyMediaToneControls();
        this._redrawOverlayGuides();
    }

    _ensureToneFilterDefs() {
        if (this._toneFilterDefsEl?.isConnected) return this._toneFilterDefsEl;
        const svgNs = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNs, "svg");
        svg.setAttribute("aria-hidden", "true");
        svg.style.position = "absolute";
        svg.style.width = "0";
        svg.style.height = "0";
        svg.style.pointerEvents = "none";
        const defs = document.createElementNS(svgNs, "defs");
        const filters = [
            ["mjr-mfv-ch-r", "1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 1 0"],
            ["mjr-mfv-ch-g", "0 1 0 0 0  0 1 0 0 0  0 1 0 0 0  0 0 0 1 0"],
            ["mjr-mfv-ch-b", "0 0 1 0 0  0 0 1 0 0  0 0 1 0 0  0 0 0 1 0"],
            ["mjr-mfv-ch-a", "0 0 0 1 0  0 0 0 1 0  0 0 0 1 0  0 0 0 1 0"],
            [
                "mjr-mfv-ch-l",
                "0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0",
            ],
        ];
        for (const [id, values] of filters) {
            const filter = document.createElementNS(svgNs, "filter");
            filter.setAttribute("id", id);
            const matrix = document.createElementNS(svgNs, "feColorMatrix");
            matrix.setAttribute("type", "matrix");
            matrix.setAttribute("values", values);
            filter.appendChild(matrix);
            defs.appendChild(filter);
        }
        svg.appendChild(defs);
        this.element?.appendChild(svg);
        this._toneFilterDefsEl = svg;
        return svg;
    }

    _applyMediaToneControls() {
        this._ensureToneFilterDefs();
        if (!this._contentEl) return;
        const channel = String(this._channel || "rgb");
        const exposureScale = Math.pow(2, Number(this._exposureEV) || 0);
        const channelFilter = channel === "rgb" ? "" : `url(#mjr-mfv-ch-${channel})`;
        const brightnessFilter =
            Math.abs(exposureScale - 1) < 0.0001 ? "" : `brightness(${exposureScale})`;
        const filterValue = [channelFilter, brightnessFilter].filter(Boolean).join(" ").trim();
        const mediaEls = this._contentEl.querySelectorAll?.(".mjr-mfv-media") || [];
        for (const el of mediaEls) {
            try {
                el.style.filter = filterValue || "";
            } catch (e) {
                console.debug?.(e);
            }
        }
    }

    _getOverlayAspect(format, mediaEl, panelRect) {
        try {
            const f = String(format || "image");
            if (f === "image") {
                const nw =
                    Number(mediaEl?.videoWidth) ||
                    Number(mediaEl?.naturalWidth) ||
                    Number(panelRect?.width) ||
                    1;
                const nh =
                    Number(mediaEl?.videoHeight) ||
                    Number(mediaEl?.naturalHeight) ||
                    Number(panelRect?.height) ||
                    1;
                const a = nw / nh;
                return Number.isFinite(a) && a > 0 ? a : 1;
            }
            if (f === "16:9") return 16 / 9;
            if (f === "9:16") return 9 / 16;
            if (f === "1:1") return 1;
            if (f === "4:3") return 4 / 3;
            if (f === "2.39") return 2.39;
        } catch (e) {
            console.debug?.(e);
        }
        return 1;
    }

    _fitAspectInBox(boxW, boxH, aspect) {
        try {
            const bw = Number(boxW) || 0;
            const bh = Number(boxH) || 0;
            const a = Number(aspect) || 1;
            if (!(bw > 0 && bh > 0 && a > 0)) return { x: 0, y: 0, w: bw, h: bh };
            const boxA = bw / bh;
            let w = bw;
            let h = bh;
            if (a >= boxA) {
                h = bw / a;
            } else {
                w = bh * a;
            }
            return { x: (bw - w) / 2, y: (bh - h) / 2, w, h };
        } catch (e) {
            console.debug?.(e);
            return { x: 0, y: 0, w: Number(boxW) || 0, h: Number(boxH) || 0 };
        }
    }

    _drawMaskOutside(ctx, canvas, rects, alpha) {
        try {
            const a = Math.max(0, Math.min(0.92, Number(alpha) || 0));
            if (!(a > 0)) return;
            ctx.save();
            ctx.fillStyle = `rgba(0,0,0,${a})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = "destination-out";
            for (const r of rects) {
                if (!r || !(r.w > 1 && r.h > 1)) continue;
                ctx.fillRect(r.x, r.y, r.w, r.h);
            }
            ctx.restore();
        } catch (e) {
            console.debug?.(e);
        }
    }

    _redrawOverlayGuides() {
        const canvas = this._overlayCanvas;
        const host = this._contentEl;
        if (!canvas || !host) return;
        const ctx = canvas.getContext?.("2d");
        if (!ctx) return;

        const dpr = Math.max(1, Math.min(3, Number(window.devicePixelRatio) || 1));
        const cssW = host.clientWidth || 0;
        const cssH = host.clientHeight || 0;
        canvas.width = Math.max(1, Math.floor(cssW * dpr));
        canvas.height = Math.max(1, Math.floor(cssH * dpr));
        canvas.style.width = `${cssW}px`;
        canvas.style.height = `${cssH}px`;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!(this._gridMode || this._overlayMaskEnabled)) return;

        const hostRect = host.getBoundingClientRect?.();
        if (!hostRect) return;
        const panels = Array.from(
            host.querySelectorAll?.(
                ".mjr-mfv-simple-container, .mjr-mfv-side-panel, .mjr-mfv-grid-cell, .mjr-mfv-ab-layer",
            ) || [],
        );
        const panelEls = panels.length ? panels : [host];
        const formatRects = [];

        for (const panelEl of panelEls) {
            const mediaEl = panelEl.querySelector?.(".mjr-mfv-media");
            if (!mediaEl) continue;
            const panelRect = panelEl.getBoundingClientRect?.();
            if (!panelRect?.width || !panelRect?.height) continue;
            const baseW = Number(panelRect.width) || 0;
            const baseH = Number(panelRect.height) || 0;
            const aspect = this._getOverlayAspect(this._overlayFormat, mediaEl, panelRect);
            const fit = this._fitAspectInBox(baseW, baseH, aspect);
            const centerX = panelRect.left - hostRect.left + baseW / 2;
            const centerY = panelRect.top - hostRect.top + baseH / 2;
            const z = Math.max(0.1, Math.min(16, Number(this._zoom) || 1));
            const rectCss = {
                x: centerX + fit.x * z - (baseW * z) / 2 + (Number(this._panX) || 0),
                y: centerY + fit.y * z - (baseH * z) / 2 + (Number(this._panY) || 0),
                w: fit.w * z,
                h: fit.h * z,
            };
            formatRects.push({
                x: rectCss.x * dpr,
                y: rectCss.y * dpr,
                w: rectCss.w * dpr,
                h: rectCss.h * dpr,
            });
        }

        if (!formatRects.length) return;

        if (this._overlayMaskEnabled) {
            this._drawMaskOutside(ctx, canvas, formatRects, this._overlayMaskOpacity);
            ctx.save();
            ctx.setLineDash?.([Math.max(2, 4 * dpr), Math.max(2, 3 * dpr)]);
            ctx.strokeStyle = "rgba(255,255,255,0.22)";
            ctx.lineWidth = Math.max(1, Math.floor(dpr));
            for (const r of formatRects) {
                ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
            }
            ctx.restore();
        }

        if (this._mode !== MFV_MODES.SIMPLE || !this._gridMode) return;
        const rect = formatRects[0];
        if (!rect) return;
        ctx.save();
        ctx.translate(rect.x, rect.y);
        ctx.strokeStyle = "rgba(255,255,255,0.22)";
        ctx.lineWidth = Math.max(2, Math.round(1.25 * dpr));
        const drawLine = (x1, y1, x2, y2) => {
            ctx.beginPath();
            ctx.moveTo(Math.round(x1) + 0.5, Math.round(y1) + 0.5);
            ctx.lineTo(Math.round(x2) + 0.5, Math.round(y2) + 0.5);
            ctx.stroke();
        };
        if (this._gridMode === 1) {
            drawLine(rect.w / 3, 0, rect.w / 3, rect.h);
            drawLine((2 * rect.w) / 3, 0, (2 * rect.w) / 3, rect.h);
            drawLine(0, rect.h / 3, rect.w, rect.h / 3);
            drawLine(0, (2 * rect.h) / 3, rect.w, (2 * rect.h) / 3);
        } else if (this._gridMode === 2) {
            drawLine(rect.w / 2, 0, rect.w / 2, rect.h);
            drawLine(0, rect.h / 2, rect.w, rect.h / 2);
        } else if (this._gridMode === 3) {
            ctx.strokeRect(
                rect.w * 0.1 + 0.5,
                rect.h * 0.1 + 0.5,
                rect.w * 0.8 - 1,
                rect.h * 0.8 - 1,
            );
            ctx.strokeRect(
                rect.w * 0.05 + 0.5,
                rect.h * 0.05 + 0.5,
                rect.w * 0.9 - 1,
                rect.h * 0.9 - 1,
            );
        }
        ctx.restore();
    }

    /**
     * Set zoom, optionally centered at (clientX, clientY).
     * Keeps the image point under the cursor stationary.
     */
    _setMfvZoom(next, clientX, clientY) {
        const prev = Math.max(MFV_ZOOM_MIN, Math.min(MFV_ZOOM_MAX, this._zoom));
        const z = Math.max(MFV_ZOOM_MIN, Math.min(MFV_ZOOM_MAX, Number(next) || 1));
        if (clientX != null && clientY != null && this._contentEl) {
            const r = z / prev;
            const rect = this._contentEl.getBoundingClientRect();
            const ux = clientX - (rect.left + rect.width / 2);
            const uy = clientY - (rect.top + rect.height / 2);
            this._panX = this._panX * r + (1 - r) * ux;
            this._panY = this._panY * r + (1 - r) * uy;
        }
        this._zoom = z;
        // Snap back to exact fit to avoid drift.
        if (Math.abs(z - 1) < 0.001) {
            this._zoom = 1;
            this._panX = 0;
            this._panY = 0;
        }
        this._applyTransform();
    }

    /** Reset zoom and pan to the default 1:1 fit. Called when new media is loaded. */
    _resetMfvZoom() {
        this._zoom = 1;
        this._panX = 0;
        this._panY = 0;
        this._applyTransform();
    }

    _bindLayoutObserver() {
        this._unbindLayoutObserver();
        const target = this._contentEl;
        if (!target || typeof ResizeObserver === "undefined") return;
        try {
            this._layoutObserver = new ResizeObserver(() => {
                this._applyTransform();
            });
            this._layoutObserver.observe(target);
        } catch (e) {
            console.debug?.(e);
            this._layoutObserver = null;
        }
    }

    _unbindLayoutObserver() {
        try {
            this._layoutObserver?.disconnect?.();
        } catch (e) {
            console.debug?.(e);
        }
        this._layoutObserver = null;
    }

    /** Bind wheel + pointer events to the clip viewport element. */
    _initPanZoom(contentEl) {
        this._destroyPanZoom();
        if (!contentEl) return;
        this._panzoomAC = new AbortController();
        const sig = { signal: this._panzoomAC.signal };

        // Wheel → zoom centered at cursor
        contentEl.addEventListener(
            "wheel",
            (e) => {
                if (e.target?.closest?.("audio")) return;
                if (e.target?.closest?.(".mjr-video-controls, .mjr-mfv-simple-player-controls"))
                    return;
                if (isModel3DInteractionTarget(e.target)) return;
                const scrollableAncestor = _findScrollableAncestor(e.target, contentEl);
                if (
                    scrollableAncestor &&
                    _canWheelScrollElement(
                        scrollableAncestor,
                        Number(e.deltaX || 0),
                        Number(e.deltaY || 0),
                    )
                ) {
                    return;
                }
                e.preventDefault();
                const delta = e.deltaY || e.deltaX || 0;
                const factor = 1 - delta * MFV_ZOOM_FACTOR;
                this._setMfvZoom(this._zoom * factor, e.clientX, e.clientY);
            },
            { ...sig, passive: false },
        );

        // Pointer drag → pan (left or middle button, when zoomed in)
        let panActive = false;
        let startX = 0,
            startY = 0,
            startPanX = 0,
            startPanY = 0;

        contentEl.addEventListener(
            "pointerdown",
            (e) => {
                if (e.button !== 0 && e.button !== 1) return;
                if (this._zoom <= 1.01) return;
                // Let native video controls and the AB divider handle their own events.
                if (e.target?.closest?.("video")) return;
                if (e.target?.closest?.("audio")) return;
                if (e.target?.closest?.(".mjr-video-controls, .mjr-mfv-simple-player-controls"))
                    return;
                if (e.target?.closest?.(".mjr-mfv-ab-divider")) return;
                if (isModel3DInteractionTarget(e.target)) return;
                e.preventDefault();
                panActive = true;
                this._dragging = true;
                startX = e.clientX;
                startY = e.clientY;
                startPanX = this._panX;
                startPanY = this._panY;
                try {
                    contentEl.setPointerCapture(e.pointerId);
                } catch (e) {
                    console.debug?.(e);
                }
                this._applyTransform();
            },
            sig,
        );

        contentEl.addEventListener(
            "pointermove",
            (e) => {
                if (!panActive) return;
                this._panX = startPanX + (e.clientX - startX);
                this._panY = startPanY + (e.clientY - startY);
                this._applyTransform();
            },
            sig,
        );

        const endPan = (e) => {
            if (!panActive) return;
            panActive = false;
            this._dragging = false;
            try {
                contentEl.releasePointerCapture(e.pointerId);
            } catch (e) {
                console.debug?.(e);
            }
            this._applyTransform();
        };
        contentEl.addEventListener("pointerup", endPan, sig);
        contentEl.addEventListener("pointercancel", endPan, sig);

        // Double-click → zoom to 4× at cursor, or reset to fit
        contentEl.addEventListener(
            "dblclick",
            (e) => {
                if (e.target?.closest?.("video")) return;
                if (e.target?.closest?.("audio")) return;
                if (e.target?.closest?.(".mjr-video-controls, .mjr-mfv-simple-player-controls"))
                    return;
                if (isModel3DInteractionTarget(e.target)) return;
                const isNearFit = Math.abs(this._zoom - 1) < 0.05;
                this._setMfvZoom(isNearFit ? Math.min(4, this._zoom * 4) : 1, e.clientX, e.clientY);
            },
            sig,
        );
    }

    /** Remove all pan/zoom event listeners. */
    _destroyPanZoom() {
        try {
            this._panzoomAC?.abort();
        } catch (e) {
            console.debug?.(e);
        }
        this._panzoomAC = null;
        this._dragging = false;
    }

    _destroyCompareSync() {
        try {
            this._compareSyncAC?.abort?.();
        } catch (e) {
            console.debug?.(e);
        }
        this._compareSyncAC = null;
    }

    _destroyMediaControls() {
        const handles = Array.isArray(this._mediaControlHandles) ? this._mediaControlHandles : [];
        for (const handle of handles) {
            try {
                handle?.destroy?.();
            } catch (e) {
                console.debug?.(e);
            }
        }
        this._mediaControlHandles = [];
    }

    _trackMediaControls(rootEl) {
        try {
            const handle = rootEl?._mjrMediaControlsHandle || null;
            if (handle?.destroy) this._mediaControlHandles.push(handle);
        } catch (e) {
            console.debug?.(e);
        }
        return rootEl;
    }

    _initCompareSync() {
        this._destroyCompareSync();
        if (!this._contentEl) return;
        if (this._mode === MFV_MODES.SIMPLE) return;
        try {
            const playables = Array.from(this._contentEl.querySelectorAll("video"));
            if (playables.length < 2) return;
            const leader = playables[0] || null;
            const followers = playables.slice(1);
            if (!leader || !followers.length) return;
            this._compareSyncAC = installFollowerVideoSync(leader, followers, { threshold: 0.08 });
        } catch (e) {
            console.debug?.(e);
        }
    }

    // ── Render ────────────────────────────────────────────────────────────────

    _refresh() {
        if (!this._contentEl) return;
        this._sidebar?.setAsset?.(this._mediaA || null);
        // Tear down previous panzoom bindings before clearing DOM.
        this._destroyPanZoom();
        this._destroyCompareSync();
        this._destroyMediaControls();
        const overlayCanvas = this._overlayCanvas || null;
        this._contentEl.replaceChildren();
        this._contentEl.style.overflow = "hidden";

        switch (this._mode) {
            case MFV_MODES.SIMPLE:
                this._renderSimple();
                break;
            case MFV_MODES.AB:
                this._renderAB();
                break;
            case MFV_MODES.SIDE:
                this._renderSide();
                break;
            case MFV_MODES.GRID:
                this._renderGrid();
                break;
            case MFV_MODES.GRAPH:
                this._renderGraphMap();
                break;
        }

        if (overlayCanvas) {
            this._contentEl.appendChild(overlayCanvas);
        }

        // The Node Stream overlay lives inside the content area (top-left)
        // and must be re-attached after each refresh since replaceChildren()
        // above removes it.
        if (this._nodeStreamSelection) {
            this._updateNodeStreamOverlay();
        }

        if (this._mediaProgressEl) {
            this._contentEl.appendChild(this._mediaProgressEl);
        }

        this._applyMediaToneControls();
        this._applyTransform();
        if (this._mode !== MFV_MODES.GRAPH) {
            this._initPanZoom(this._contentEl);
        }
        this._initCompareSync();
        this._renderGenInfoSidebar();
    }

    _renderGenInfoSidebar() {
        const sidebar = this._genSidebarEl;
        if (!sidebar) return;
        sidebar.replaceChildren();

        const slots = this._getGenInfoSidebarSlots();

        if (
            this._mode === MFV_MODES.GRAPH ||
            !this._genSidebarEnabled ||
            slots.length === 0
        ) {
            sidebar.classList.remove("open");
            sidebar.setAttribute("hidden", "");
            this._updateGenBtnUI?.();
            return;
        }

        const title = document.createElement("div");
        title.className = "mjr-mfv-gen-sidebar-title";
        title.textContent = "Gen Info";
        sidebar.appendChild(title);

        let rendered = 0;
        for (const slot of slots) {
            if (_mediaKind(slot.media) === "audio") continue;
            const richContent = this._buildGenInfoSidebarContent(slot.media);
            if (!richContent) continue;
            const section = document.createElement("section");
            section.className = "mjr-mfv-gen-sidebar-section";
            const heading = document.createElement("div");
            heading.className = "mjr-mfv-gen-sidebar-heading";
            heading.textContent = slots.length > 1 ? `Asset ${slot.label}` : "Current Asset";
            const body = document.createElement("div");
            body.className = "mjr-mfv-gen-sidebar-body";
            body.appendChild(richContent);
            section.appendChild(heading);
            section.appendChild(body);
            sidebar.appendChild(section);
            rendered += 1;
        }

        if (!rendered) {
            sidebar.classList.remove("open");
            sidebar.setAttribute("hidden", "");
            return;
        }
        sidebar.removeAttribute("hidden");
        sidebar.classList.add("open");
        this._updateGenBtnUI?.();
    }

    _getGenInfoSidebarSlots() {
        const slotA = { media: this._mediaA, label: "A" };
        const slotB = { media: this._mediaB, label: "B" };
        const slotC = { media: this._mediaC, label: "C" };
        const slotD = { media: this._mediaD, label: "D" };
        const slots =
            this._mode === MFV_MODES.GRID
                ? [slotA, slotB, slotC, slotD]
                : this._mode === MFV_MODES.AB || this._mode === MFV_MODES.SIDE
                  ? [slotA, slotB]
                  : [slotA];
        return slots.filter((slot) => slot.media);
    }

    _buildGenInfoSidebarContent(asset) {
        const genTime = this._getGenFields(asset)?.genTime || "";
        let state = null;
        try {
            state = buildGenerationSectionState(asset);
        } catch (e) {
            console.debug?.(e);
        }
        if (state && state.kind !== "empty") {
            const root = document.createDocumentFragment();
            if (genTime) {
                root.appendChild(this._buildGenTimeBadge(genTime));
            }
            if (state.workflowType) {
                root.appendChild(
                    this._buildGenInfoCard({
                        title: "Workflow",
                        accent: "#2196F3",
                        value: [state.workflowLabel || state.workflowType, state.workflowBadge]
                            .filter(Boolean)
                            .join("  |  "),
                        compact: true,
                    }),
                );
            }
            if (state.positivePrompt) {
                root.appendChild(
                    this._buildGenInfoCard({
                        title: "Positive Prompt",
                        accent: "#4CAF50",
                        value: state.positivePrompt,
                        multiline: true,
                    }),
                );
            }
            if (state.negativePrompt) {
                root.appendChild(
                    this._buildGenInfoCard({
                        title: "Negative Prompt",
                        accent: "#F44336",
                        value: state.negativePrompt,
                        multiline: true,
                    }),
                );
            }
            for (const tab of state.promptTabs || []) {
                const value = [tab.positive, tab.negative ? `Negative:\n${tab.negative}` : ""]
                    .filter(Boolean)
                    .join("\n\n");
                root.appendChild(
                    this._buildGenInfoCard({
                        title: tab.label || "Prompt",
                        accent: "#4CAF50",
                        value,
                        multiline: true,
                    }),
                );
            }
            if (state.modelFields?.length) {
                const card = this._buildGenInfoFieldsCard(
                    "Model & LoRA",
                    "#9C27B0",
                    state.modelFields,
                );
                if (card) root.appendChild(card);
            }
            for (const group of state.modelGroups || []) {
                const fields = [
                    { label: "UNet", value: group.model || "-" },
                    ...(group.loras || []).map((value, index) => ({
                        label: index === 0 ? "LoRA" : `LoRA ${index + 1}`,
                        value,
                    })),
                ];
                const card = this._buildGenInfoFieldsCard(
                    group.label || "Model Branch",
                    "#AB47BC",
                    fields,
                );
                if (card) root.appendChild(card);
            }
            if (state.pipelineTabs?.length) {
                for (const tab of state.pipelineTabs) {
                    const card = this._buildGenInfoFieldsCard(
                        tab.label || "Generation Pipeline",
                        "#FF9800",
                        tab.fields || [],
                    );
                    if (card) root.appendChild(card);
                }
            } else if (state.samplingFields?.length) {
                const card = this._buildGenInfoFieldsCard("Sampling", "#FF9800", state.samplingFields);
                if (card) root.appendChild(card);
            }
            if (state.seed !== null && state.seed !== undefined && state.seed !== "") {
                root.appendChild(
                    this._buildGenInfoCard({
                        title: "Seed",
                        accent: "#E91E63",
                        value: String(state.seed),
                        seed: true,
                    }),
                );
            }
            if (state.mediaOnlyMessage) {
                root.appendChild(
                    this._buildGenInfoCard({
                        title: "Generation Data",
                        accent: "#9E9E9E",
                        value: state.mediaOnlyMessage,
                        multiline: true,
                    }),
                );
            }
            if (root.childNodes.length) return root;
        }
        const fallback = this._buildGenInfoDOM(asset);
        if (!genTime) return fallback;
        const root = document.createDocumentFragment();
        root.appendChild(this._buildGenTimeBadge(genTime));
        if (fallback) root.appendChild(fallback);
        return root;
    }

    _buildGenTimeBadge(value) {
        const badge = document.createElement("div");
        badge.className = "mjr-mfv-gen-time-badge";
        this._bindGenInfoCopy(badge, () => String(value || ""));
        const label = document.createElement("span");
        label.className = "mjr-mfv-gen-time-label";
        label.textContent = "Generation Time";
        const time = document.createElement("span");
        time.className = "mjr-mfv-gen-time-value";
        time.textContent = String(value || "");
        badge.appendChild(label);
        badge.appendChild(time);
        return badge;
    }

    _buildGenInfoCard({ title, accent, value, multiline = false, compact = false, seed = false }) {
        const card = document.createElement("div");
        card.className = `mjr-mfv-gen-card${seed ? " mjr-mfv-gen-card--seed" : ""}`;
        card.style.setProperty("--mjr-mfv-gen-accent", accent || "#2196F3");
        this._bindGenInfoCopy(card, () => String(value ?? ""));
        const heading = document.createElement("div");
        heading.className = "mjr-mfv-gen-card-title";
        heading.textContent = title || "";
        const content = document.createElement("div");
        content.className = `mjr-mfv-gen-card-value${multiline ? " is-multiline" : ""}${compact ? " is-compact" : ""}`;
        content.textContent = String(value ?? "");
        card.appendChild(heading);
        card.appendChild(content);
        return card;
    }

    _buildGenInfoFieldsCard(title, accent, fields) {
        const card = this._buildGenInfoCard({ title, accent, value: "" });
        this._bindGenInfoCopy(card, () =>
            (fields || [])
                .map((field) => {
                    const label = String(field?.label || "").trim();
                    const text = String(field?.value ?? "").trim();
                    return label && text && text !== "-" ? `${label}: ${text}` : "";
                })
                .filter(Boolean)
                .join("\n"),
        );
        const value = card.querySelector(".mjr-mfv-gen-card-value");
        value.replaceChildren();
        value.classList.add("is-fields");
        for (const field of fields || []) {
            const label = String(field?.label || "").trim();
            const text = String(field?.value ?? "").trim();
            if (!label || !text || text === "-") continue;
            const row = document.createElement("div");
            row.className = "mjr-mfv-gen-field";
            const key = document.createElement("span");
            key.className = "mjr-mfv-gen-field-label";
            key.textContent = label;
            const val = document.createElement("span");
            val.className = "mjr-mfv-gen-field-value";
            val.textContent = text;
            row.appendChild(key);
            row.appendChild(val);
            value.appendChild(row);
        }
        return value.childNodes.length ? card : null;
    }

    _bindGenInfoCopy(el, resolveText) {
        if (!el || typeof resolveText !== "function") return;
        el.title = "Click to copy";
        el.addEventListener("click", async (event) => {
            event.stopPropagation();
            const text = String(resolveText() || "").trim();
            if (!text) return;
            try {
                await navigator.clipboard?.writeText?.(text);
                el.classList.add("mjr-mfv-gen-copy-flash");
                setTimeout(() => el.classList.remove("mjr-mfv-gen-copy-flash"), 450);
            } catch (e) {
                console.debug?.(e);
            }
        });
    }

    _renderGraphMap() {
        this._contentEl.style.overflow = "hidden";
        this._graphMapPanel.setAsset(this._mediaA || null);
        this._contentEl.appendChild(this._graphMapPanel.el);
        this._graphMapPanel.refresh();
    }

    _renderSimple() {
        if (!this._mediaA) {
            this._contentEl.appendChild(_makeEmptyState());
            return;
        }
        const rawMediaEl = _buildMediaEl(this._mediaA);
        const mediaEl = this._trackMediaControls?.(rawMediaEl) || rawMediaEl;
        if (!mediaEl) {
            this._contentEl.appendChild(_makeEmptyState("Could not load media"));
            return;
        }
        const wrap = document.createElement("div");
        wrap.className = "mjr-mfv-simple-container";
        wrap.appendChild(mediaEl);
        this._contentEl.appendChild(wrap);
    }

    _renderAB() {
        const rawElA = this._mediaA ? _buildMediaEl(this._mediaA, { fill: true }) : null;
        const rawElB = this._mediaB
            ? _buildMediaEl(this._mediaB, { fill: true, controls: false })
            : null;
        const elA = this._trackMediaControls?.(rawElA) || rawElA;
        const elB = this._trackMediaControls?.(rawElB) || rawElB;
        const kindA = this._mediaA ? _mediaKind(this._mediaA) : "";
        const kindB = this._mediaB ? _mediaKind(this._mediaB) : "";

        if (!elA && !elB) {
            this._contentEl.appendChild(_makeEmptyState("Select 2 assets for A/B compare"));
            return;
        }
        if (!elB) {
            // Only one asset — render as simple
            this._renderSimple();
            return;
        }
        // Audio does not map well to clipped A/B mode; use side-by-side players instead.
        if (kindA === "audio" || kindB === "audio" || kindA === "model3d" || kindB === "model3d") {
            this._renderSide();
            return;
        }

        const container = document.createElement("div");
        container.className = "mjr-mfv-ab-container";

        // Layer A — full-size backdrop
        const layerA = document.createElement("div");
        layerA.className = "mjr-mfv-ab-layer";
        if (elA) layerA.appendChild(elA);

        // Layer B — clipped from the left edge to the divider
        const layerB = document.createElement("div");
        layerB.className = "mjr-mfv-ab-layer mjr-mfv-ab-layer--b";
        const pct = Math.round(this._abDividerX * 100);
        layerB.style.clipPath = `inset(0 0 0 ${pct}%)`;
        layerB.appendChild(elB);

        // Draggable divider bar
        const divider = document.createElement("div");
        divider.className = "mjr-mfv-ab-divider";
        divider.style.left = `${pct}%`;

        // Gen info overlays are placed at the container level (outside the clipped
        // layers) so they are never truncated by layerB's clip-path. Each overlay
        // is bounded to its own half, mirroring the canvas capture layout.
        const fragA = this._buildGenInfoDOM(this._mediaA);
        let genInfoAEl = null;
        if (fragA) {
            genInfoAEl = document.createElement("div");
            genInfoAEl.className = "mjr-mfv-geninfo-a";
            if (_hasSimplePlayerControls(elA)) {
                genInfoAEl.classList.add("mjr-mfv-geninfo--above-player");
            }
            genInfoAEl.appendChild(fragA);
            // Limit right edge to divider so it doesn't bleed into B side.
            genInfoAEl.style.right = `calc(${100 - pct}% + 8px)`;
        }
        const fragB = this._buildGenInfoDOM(this._mediaB);
        let genInfoBEl = null;
        if (fragB) {
            genInfoBEl = document.createElement("div");
            genInfoBEl.className = "mjr-mfv-geninfo-b";
            if (_hasSimplePlayerControls(elB)) {
                genInfoBEl.classList.add("mjr-mfv-geninfo--above-player");
            }
            genInfoBEl.appendChild(fragB);
            // Start at the divider — overrides CSS left:8px so it is never
            // clipped by layerB's clip-path.
            genInfoBEl.style.left = `calc(${pct}% + 8px)`;
        }

        let _abDivAC = null;
        divider.addEventListener(
            "pointerdown",
            (e) => {
                e.preventDefault();
                divider.setPointerCapture(e.pointerId);
                // Abort any previous drag listeners to prevent accumulation.
                try {
                    _abDivAC?.abort();
                } catch {}
                _abDivAC = new AbortController();
                const sig = _abDivAC.signal;
                const rect = container.getBoundingClientRect();

                const onMove = (me) => {
                    const x = Math.max(0.02, Math.min(0.98, (me.clientX - rect.left) / rect.width));
                    this._abDividerX = x;
                    const p = Math.round(x * 100);
                    layerB.style.clipPath = `inset(0 0 0 ${p}%)`;
                    divider.style.left = `${p}%`;
                    if (genInfoAEl) genInfoAEl.style.right = `calc(${100 - p}% + 8px)`;
                    if (genInfoBEl) genInfoBEl.style.left = `calc(${p}% + 8px)`;
                };
                const onUp = () => {
                    try {
                        _abDivAC?.abort();
                    } catch {}
                };
                divider.addEventListener("pointermove", onMove, { signal: sig });
                divider.addEventListener("pointerup", onUp, { signal: sig });
            },
            this._panelAC?.signal ? { signal: this._panelAC.signal } : undefined,
        );

        container.appendChild(layerA);
        container.appendChild(layerB);
        container.appendChild(divider);
        if (genInfoAEl) container.appendChild(genInfoAEl);
        if (genInfoBEl) container.appendChild(genInfoBEl);
        container.appendChild(_makeLabel("A", "left"));
        container.appendChild(_makeLabel("B", "right"));
        this._contentEl.appendChild(container);
    }

    _renderSide() {
        const rawElA = this._mediaA ? _buildMediaEl(this._mediaA) : null;
        const rawElB = this._mediaB ? _buildMediaEl(this._mediaB, { controls: false }) : null;
        const elA = this._trackMediaControls?.(rawElA) || rawElA;
        const elB = this._trackMediaControls?.(rawElB) || rawElB;
        const kindA = this._mediaA ? _mediaKind(this._mediaA) : "";
        const kindB = this._mediaB ? _mediaKind(this._mediaB) : "";

        if (!elA && !elB) {
            this._contentEl.appendChild(_makeEmptyState("Select 2 assets for Side-by-Side"));
            return;
        }

        const container = document.createElement("div");
        container.className = "mjr-mfv-side-container";

        const sideA = document.createElement("div");
        sideA.className = "mjr-mfv-side-panel";
        if (elA) sideA.appendChild(elA);
        else sideA.appendChild(_makeEmptyState("—"));
        sideA.appendChild(_makeLabel("A", "left"));

        // Gen info overlay for left
        const fragSideA = kindA === "audio" ? null : this._buildGenInfoDOM(this._mediaA);
        if (fragSideA) {
            const oa = document.createElement("div");
            oa.className = "mjr-mfv-geninfo-a";
            if (_hasSimplePlayerControls(elA)) {
                oa.classList.add("mjr-mfv-geninfo--above-player");
            }
            oa.appendChild(fragSideA);
            sideA.appendChild(oa);
        }

        const sideB = document.createElement("div");
        sideB.className = "mjr-mfv-side-panel";
        if (elB) sideB.appendChild(elB);
        else sideB.appendChild(_makeEmptyState("—"));
        sideB.appendChild(_makeLabel("B", "right"));

        // Gen info overlay for right
        const fragSideB = kindB === "audio" ? null : this._buildGenInfoDOM(this._mediaB);
        if (fragSideB) {
            const ob = document.createElement("div");
            ob.className = "mjr-mfv-geninfo-b";
            if (_hasSimplePlayerControls(elB)) {
                ob.classList.add("mjr-mfv-geninfo--above-player");
            }
            ob.appendChild(fragSideB);
            sideB.appendChild(ob);
        }

        container.appendChild(sideA);
        container.appendChild(sideB);
        this._contentEl.appendChild(container);
    }

    _renderGrid() {
        const slots = [
            { media: this._mediaA, label: "A" },
            { media: this._mediaB, label: "B" },
            { media: this._mediaC, label: "C" },
            { media: this._mediaD, label: "D" },
        ];
        const filled = slots.filter((s) => s.media);
        if (!filled.length) {
            this._contentEl.appendChild(_makeEmptyState("Select up to 4 assets for Grid Compare"));
            return;
        }

        const container = document.createElement("div");
        container.className = "mjr-mfv-grid-container";

        for (const { media, label } of slots) {
            const cell = document.createElement("div");
            cell.className = "mjr-mfv-grid-cell";
            if (media) {
                const kind = _mediaKind(media);
                const rawEl = _buildMediaEl(media, { controls: label === "A" });
                const el = this._trackMediaControls?.(rawEl) || rawEl;
                if (el) cell.appendChild(el);
                else cell.appendChild(_makeEmptyState("—"));
                cell.appendChild(
                    _makeLabel(label, label === "A" || label === "C" ? "left" : "right"),
                );
                if (kind !== "audio") {
                    const frag = this._buildGenInfoDOM(media);
                    if (frag) {
                        const overlay = document.createElement("div");
                        overlay.className = `mjr-mfv-geninfo-${label.toLowerCase()}`;
                        if (_hasSimplePlayerControls(el)) {
                            overlay.classList.add("mjr-mfv-geninfo--above-player");
                        }
                        overlay.appendChild(frag);
                        cell.appendChild(overlay);
                    }
                }
            } else {
                cell.appendChild(_makeEmptyState("—"));
                cell.appendChild(
                    _makeLabel(label, label === "A" || label === "C" ? "left" : "right"),
                );
            }
            container.appendChild(cell);
        }

        this._contentEl.appendChild(container);
    }

    // ── Visibility ────────────────────────────────────────────────────────────

    show() {
        if (!this.element) return;
        this._bindDocumentUiHandlers();
        this.element.classList.add("is-visible");
        this.element.setAttribute("aria-hidden", "false");
        this.isVisible = true;
    }

    hide() {
        if (!this.element) return;
        // Destroy pan/zoom so _dragging and pointer-capture state are reset cleanly
        // even if hide() is called mid-drag (NM-5).
        this._destroyPanZoom();
        this._destroyCompareSync();
        this._stopEdgeResize();
        this._closeGenDropdown();
        _pauseMediaIn(this.element);
        this.element.classList.remove("is-visible");
        this.element.setAttribute("aria-hidden", "true");
        this.isVisible = false;
    }

    // ── Pop-out / Pop-in (separate OS window for second monitor) ────────────

    _setDesktopExpanded(active) {
        return setFloatingViewerDesktopExpanded(this, active);
    }

    _activateDesktopExpandedFallback(error) {
        return activateFloatingViewerDesktopExpandedFallback(this, error);
    }

    _tryElectronPopupFallback(el, w, h, reason) {
        return tryFloatingViewerElectronPopupFallback(this, el, w, h, reason);
    }

    popOut() {
        return popOutFloatingViewer(this);
    }

    _fallbackPopout(el, w, h) {
        return fallbackPopoutFloatingViewer(this, el, w, h);
    }

    _clearPopoutCloseWatch() {
        return clearFloatingViewerPopoutCloseWatch(this);
    }

    _startPopoutCloseWatch() {
        return startFloatingViewerPopoutCloseWatch(this);
    }

    _schedulePopInFromPopupClose() {
        return scheduleFloatingViewerPopInFromPopupClose(this);
    }

    _installPopoutStyles(doc) {
        return installFloatingViewerPopoutStyles(this, doc);
    }

    popIn(options) {
        return popInFloatingViewer(this, options);
    }

    _updatePopoutBtnUI() {
        return updateFloatingViewerPopoutButtonUI(this);
    }

    get isPopped() {
        return this._isPopped || this._desktopExpanded;
    }

    _resizeCursorForDirection(dir) {
        return getFloatingViewerResizeCursor(dir);
    }

    _getResizeDirectionFromPoint(clientX, clientY, rect) {
        return getFloatingViewerResizeDirectionFromPoint(clientX, clientY, rect);
    }

    _stopEdgeResize() {
        return stopFloatingViewerEdgeResize(this);
    }

    _bindPanelInteractions() {
        return bindFloatingViewerPanelInteractions(this);
    }

    _initEdgeResize(el) {
        return initFloatingViewerEdgeResize(this, el);
    }

    _initDrag(handle) {
        return initFloatingViewerDrag(this, handle);
    }

    async _drawMediaFit(ctx, fileData, ox, oy, w, h, preferredVideo) {
        return drawFloatingViewerMediaFit(this, ctx, fileData, ox, oy, w, h, preferredVideo);
    }

    _estimateGenInfoOverlayHeight(ctx, fileData, regionWidth) {
        return estimateFloatingViewerGenInfoOverlayHeight(this, ctx, fileData, regionWidth);
    }

    _drawGenInfoOverlay(ctx, fileData, ox, oy, w, h) {
        return drawFloatingViewerGenInfoOverlay(this, ctx, fileData, ox, oy, w, h);
    }

    async _captureView() {
        return captureFloatingViewerView(this);
    }

    dispose() {
        disposeFloatingViewerProgressBar(this);
        this._destroyPanZoom();
        this._destroyCompareSync();
        this._destroyMediaControls();
        this._unbindLayoutObserver();
        this._stopEdgeResize();
        this._clearPopoutCloseWatch();
        try {
            this._panelAC?.abort();
            this._panelAC = null;
        } catch (e) {
            console.debug?.(e);
        }
        // Abort all button click listeners in one call (NM-1).
        try {
            this._btnAC?.abort();
            this._btnAC = null;
        } catch (e) {
            console.debug?.(e);
        }
        // Abort document-level and pop-out window listeners atomically.
        try {
            this._docAC?.abort();
            this._docAC = null;
        } catch (e) {
            console.debug?.(e);
        }
        try {
            this._popoutAC?.abort();
            this._popoutAC = null;
        } catch (e) {
            console.debug?.(e);
        }
        // Abort panzoom and compare-sync AbortControllers (belt-and-suspenders).
        try {
            this._panzoomAC?.abort();
            this._panzoomAC = null;
        } catch (e) {
            console.debug?.(e);
        }
        try {
            this._compareSyncAC?.abort?.();
            this._compareSyncAC = null;
        } catch (e) {
            console.debug?.(e);
        }
        // Pop-in before disposing so the element returns to the main document.
        try {
            if (this._isPopped) this.popIn();
        } catch (e) {
            console.debug?.(e);
        }
        this._revokePreviewBlob();
        if (this._onSidebarPosChanged) {
            window.removeEventListener("mjr-settings-changed", this._onSidebarPosChanged);
            this._onSidebarPosChanged = null;
        }
        try {
            this.element?.remove();
        } catch (e) {
            console.debug?.(e);
        }
        try {
            this._graphMapPanel?.dispose?.();
        } catch (e) {
            console.debug?.(e);
        }
        this._graphMapPanel = null;
        this.element = null;
        this._contentEl = null;
        this._genSidebarEl = null;
        this._closeBtn = null;
        this._modeBtn = null;
        this._pinGroup = null;
        this._pinBtns = null;
        this._liveBtn = null;
        this._nodeStreamBtn = null;
        this._popoutBtn = null;
        this._captureBtn = null;
        this._unbindDocumentUiHandlers();
        try {
            this._genDropdown?.remove();
        } catch (e) {
            console.debug?.(e);
        }
        this._mediaA = null;
        this._mediaB = null;
        this._mediaC = null;
        this._mediaD = null;
        this.isVisible = false;
    }
}
