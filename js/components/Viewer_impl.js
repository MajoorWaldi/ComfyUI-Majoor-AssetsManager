/**
 * Asset Viewer Component
 * Supports Single, A/B Compare, and Side-by-Side modes
 */

import { buildAssetViewURL } from "../api/endpoints.js";
import { updateAssetRating, getAssetMetadata, getAssetsBatch, getViewerInfo, getFileMetadataScoped } from "../api/client.js";
import { ASSET_RATING_CHANGED_EVENT, ASSET_TAGS_CHANGED_EVENT } from "../app/events.js";
import { bindViewerContextMenu } from "../features/viewer/ViewerContextMenu.js";
import { createFileBadge, createRatingBadge, createTagsBadge } from "./Badges.js";
import { APP_CONFIG } from "../app/config.js";
import { safeDispatchCustomEvent } from "../utils/events.js";
import { safeClosest } from "../utils/dom.js";
import {
    isPlayableViewerKind,
    collectPlayableMediaElements,
    pickPrimaryPlayableMedia,
    mountUnifiedMediaControls,
} from "../features/viewer/mediaPlayer.js";
import { createDefaultViewerState, loadViewerPrefs, saveViewerPrefs } from "../features/viewer/ViewerState.js";
import { createViewerLifecycle, destroyMediaProcessorsIn, safeAddListener, safeCall } from "../features/viewer/lifecycle.js";
import { createViewerToolbar } from "../features/viewer/ViewerToolbar.js";
import { installViewerKeyboard } from "../features/viewer/ViewerKeyboard.js";
import { installFollowerVideoSync } from "../features/viewer/videoSync.js";
import { createViewerGrid } from "../features/viewer/grid.js";
import { installViewerProbe } from "../features/viewer/probe.js";
import { createViewerLoupe } from "../features/viewer/loupe.js";
import { renderABCompareView } from "../features/viewer/abCompare.js";
import { renderSideBySideView } from "../features/viewer/sideBySide.js";
import { createViewerMetadataHydrator } from "../features/viewer/metadata.js";
import { createViewerPanZoom, createViewerMediaFactory } from "../features/viewer/ViewerCanvas.js";
import { drawScopesLight } from "../features/viewer/scopes.js";
import { ensureViewerMetadataAsset, buildViewerMetadataBlocks } from "../features/viewer/genInfo.js";
import { createIconButton } from "./buttons.js";
import { createFrameExporter } from "../features/viewer/frameExport.js";
import { createImagePreloader } from "../features/viewer/imagePreloader.js";
import { getViewerInstance as _getViewerInstance } from "../features/viewer/viewerInstanceManager.js";
import { createPlayerBarManager } from "../features/viewer/playerBarManager.js";
import { getHotkeysState, setHotkeysScope } from "../features/panel/controllers/hotkeysState.js";
import { createFilmstrip } from "../features/viewer/filmstrip.js";

/**
 * Viewer modes
 */
const VIEWER_MODES = {
    SINGLE: 'single',
    AB_COMPARE: 'ab',
    SIDE_BY_SIDE: 'sidebyside'
};

/**
 * Create the main viewer overlay
 */
function createViewer() {
    const overlay = document.createElement("div");
    // mjr-assets-manager class allows access to theme variables (colors, fonts)
    overlay.className = "mjr-viewer-overlay mjr-assets-manager";
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.95);
        z-index: 10000;
        display: none;
        flex-direction: column;
        box-sizing: border-box;
    `;
    // Ensure the overlay can receive focus so keyboard shortcuts work reliably.
    // (We still install a capture listener on `window` to beat ComfyUI global handlers.)
    overlay.tabIndex = -1;
    overlay.setAttribute("role", "dialog");

    const lifecycle = createViewerLifecycle(overlay);
    const lifecycleUnsubs = lifecycle.unsubs || [];

    const state = createDefaultViewerState();
    state.mode = VIEWER_MODES.SINGLE;
    try {
        const prefs = loadViewerPrefs();
        if (prefs && typeof prefs === "object") {
            if (typeof prefs.analysisMode === "string") state.analysisMode = prefs.analysisMode || "none";
            if (typeof prefs.loupeEnabled === "boolean") state.loupeEnabled = prefs.loupeEnabled;
            if (typeof prefs.probeEnabled === "boolean") state.probeEnabled = prefs.probeEnabled;
            if (typeof prefs.hudEnabled === "boolean") state.hudEnabled = prefs.hudEnabled;
            if (typeof prefs.genInfoOpen === "boolean") state.genInfoOpen = prefs.genInfoOpen;
            if (typeof prefs.audioVisualizerMode === "string") state.audioVisualizerMode = prefs.audioVisualizerMode || "artistic";
        }
    } catch (e) { console.debug?.(e); }
    const IMAGE_PRELOAD_EXTENSIONS = new Set([
        "png", "jpg", "jpeg", "webp", "gif", "bmp", "tiff", "avif", "heic", "hdr", "svg", "apng"
    ]);

    let panzoom = null;
    let mediaFactory = null;

    function mediaTransform() {
        try {
            return panzoom?.mediaTransform?.() || "";
        } catch {
            return "";
        }
    }

    function clampPanToBounds() {
        try {
            panzoom?.clampPanToBounds?.();
        } catch (e) { console.debug?.(e); }
    }

    function applyTransform() {
        try {
            panzoom?.applyTransform?.();
        } catch (e) { console.debug?.(e); }
    }

    function setZoom(next, opts) {
        try {
            panzoom?.setZoom?.(next, opts);
        } catch (e) { console.debug?.(e); }
    }

    function updatePanCursor() {
        try {
            panzoom?.updatePanCursor?.();
        } catch (e) { console.debug?.(e); }
    }

    function getPrimaryMedia() {
        try {
            return panzoom?.getPrimaryMedia?.() || null;
        } catch {
            return null;
        }
    }

    function getMediaNaturalSize(mediaEl) {
        try {
            return panzoom?.getMediaNaturalSize?.(mediaEl) || { w: 0, h: 0 };
        } catch {
            return { w: 0, h: 0 };
        }
    }

    function getViewportRect() {
        try {
            return panzoom?.getViewportRect?.() || null;
        } catch {
            return null;
        }
    }

    function computeOneToOneZoom() {
        try {
            return panzoom?.computeOneToOneZoom?.() ?? null;
        } catch {
            return null;
        }
    }

    function updateMediaNaturalSize() {
        try {
            panzoom?.updateMediaNaturalSize?.();
        } catch (e) { console.debug?.(e); }
    }

    function createMediaElement(asset, url) {
        try {
            return mediaFactory?.createMediaElement?.(asset, url) || document.createElement("div");
        } catch {
            return document.createElement("div");
        }
    }

    function createCompareMediaElement(asset, url) {
        try {
            return mediaFactory?.createCompareMediaElement?.(asset, url) || document.createElement("div");
        } catch {
            return document.createElement("div");
        }
    }

    let toolbar = null;
    // Late-bound close handler: default to "soft close" until API exists, then upgrade close button to full dispose.
    let _requestCloseFromButton = () => closeViewer();

    // Header (toolbar)
    let header = document.createElement("div");
    header.className = "mjr-viewer-header";
    header.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 12px 20px;
        background: var(--mjr-surface-0, rgba(0, 0, 0, 0.8));
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        color: white;
        box-sizing: border-box;
    `;
    let filename = document.createElement("span");
    filename.className = "mjr-viewer-filename";
    filename.style.cssText =
        "font-size: 14px; font-weight: 500; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;";
    let badgesBar = document.createElement("div");
    badgesBar.className = "mjr-viewer-badges";
    badgesBar.style.cssText = "display:flex; gap:8px; align-items:center; flex-wrap:wrap;";
    let filenameRight = null;
    let badgesBarRight = null;
    let rightMeta = null;
    try {
        header.appendChild(filename);
        header.appendChild(badgesBar);
    } catch (e) { console.debug?.(e); }

    try {
        toolbar = createViewerToolbar({
            VIEWER_MODES,
            state,
            lifecycle,
            getCanAB: () => canAB(),
            onToggleFullscreen: () => {
                try {
                    if (!document.fullscreenElement) {
                        try {
                            overlay.requestFullscreen();
                        } catch (e) { console.debug?.(e); }
                    } else {
                        try {
                            document.exitFullscreen();
                        } catch (e) { console.debug?.(e); }
                    }
                } catch (e) { console.debug?.(e); }
            },
            // Close button should fully tear down the viewer (remove overlay + listeners) to avoid leaks/ghost UI.
            onClose: () => _requestCloseFromButton?.(),
            onMode: (mode) => {
                try {
                    if (mode === VIEWER_MODES.AB_COMPARE && !canAB()) return;
                    if (mode === VIEWER_MODES.SIDE_BY_SIDE && !canSide()) return;
                    state.mode = mode;
                    updateUI();
                    try {
                        toolbar?.syncToolsUIFromState?.();
                    } catch (e) { console.debug?.(e); }
                } catch (e) { console.debug?.(e); }
            },
            onZoomIn: () => {
                try {
                    setZoom((Number(state.zoom) || 1) + 0.25, { clientX: state._lastPointerX, clientY: state._lastPointerY });
                } catch (e) { console.debug?.(e); }
            },
            onZoomOut: () => {
                try {
                    setZoom((Number(state.zoom) || 1) - 0.25, { clientX: state._lastPointerX, clientY: state._lastPointerY });
                } catch (e) { console.debug?.(e); }
            },
            onZoomReset: () => {
                try {
                    setZoom(1);
                } catch (e) { console.debug?.(e); }
            },
            onZoomOneToOne: () => {
                try {
                    const tryApply = () => {
                        const z = computeOneToOneZoom();
                        if (z == null) return false;
                        const near = Math.abs((Number(state.zoom) || 1) - z) < 0.01;
                        setZoom(near ? 1 : z, { clientX: state._lastPointerX, clientY: state._lastPointerY });
                        return true;
                    };

                    // Sometimes processors haven't set canvas natural size yet; retry once after a frame.
                    if (tryApply()) return;
                    try {
                        requestAnimationFrame(() => {
                            try {
                                updateMediaNaturalSize();
                            } catch (e) { console.debug?.(e); }
                            try {
                                tryApply();
                            } catch (e) { console.debug?.(e); }
                        });
                    } catch (e) { console.debug?.(e); }
                } catch (e) { console.debug?.(e); }
            },
            onCompareModeChanged: () => {
                try {
                    if (state.mode === VIEWER_MODES.AB_COMPARE) {
                        renderAsset();
                        // Rebind the player bar to the newly created video elements (wipe/difference re-renders AB view).
                        syncPlayerBar();
                    }
                } catch (e) { console.debug?.(e); }
            },
            onExportFrame: () => {
                try {
                    void exportCurrentFrame({ toClipboard: false });
                } catch (e) { console.debug?.(e); }
            },
            onCopyFrame: () => {
                try {
                    void exportCurrentFrame({ toClipboard: true });
                } catch (e) { console.debug?.(e); }
            },
            onAudioVizModeChanged: () => {
                try {
                    const current = state.assets[state.currentIndex];
                    if (String(current?.kind || "") !== "audio") return;
                    renderAsset();
                    syncPlayerBar();
                } catch (e) { console.debug?.(e); }
            },
            onToolsChanged: () => {
                try {
                    toolbar?.syncToolsUIFromState?.();
                } catch (e) { console.debug?.(e); }
                try {
                    saveViewerPrefs(state);
                } catch (e) { console.debug?.(e); }
                try {
                    applyDistractionFreeUI();
                } catch (e) { console.debug?.(e); }
                try {
                    if (state.mode === VIEWER_MODES.AB_COMPARE) {
                        const m = String(state.abCompareMode || "wipe");
                        if (m !== "wipe" && m !== "wipeV") {
                            abView?._mjrDiffRequest?.();
                        }
                    }
                } catch (e) { console.debug?.(e); }
                try {
                    if (!state.probeEnabled) probeTooltip.style.display = "none";
                } catch (e) { console.debug?.(e); }
                try {
                    if (!state.loupeEnabled) loupeWrap.style.display = "none";
                } catch (e) { console.debug?.(e); }
                try {
                    scheduleOverlayRedraw();
                } catch (e) { console.debug?.(e); }
                try {
                    scheduleApplyGrade?.();
                } catch (e) { console.debug?.(e); }
                try {
                    void renderGenInfoPanel();
                } catch (e) { console.debug?.(e); }
            },
        });
        if (toolbar?.headerEl) header = toolbar.headerEl;
        if (toolbar?.filenameEl) filename = toolbar.filenameEl;
        if (toolbar?.badgesBarEl) badgesBar = toolbar.badgesBarEl;
        if (toolbar?.filenameRightEl) filenameRight = toolbar.filenameRightEl;
        if (toolbar?.badgesBarRightEl) badgesBarRight = toolbar.badgesBarRightEl;
        if (toolbar?.rightMetaEl) rightMeta = toolbar.rightMetaEl;
    } catch (e) { console.debug?.(e); }

    // Content area (stage + optional right sidebar)
    const contentRow = document.createElement("div");
    contentRow.className = "mjr-viewer-content-row";
    contentRow.style.cssText = `
        flex: 1;
        display: flex;
        min-height: 0;
        overflow: hidden;
    `;

    const content = document.createElement("div");
    content.className = "mjr-viewer-content";
    content.style.cssText = `
        flex: 1;
        min-width: 0;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    // Single view container
    const singleView = document.createElement("div");
    singleView.className = "mjr-viewer-single";
    singleView.style.cssText = `
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    // A/B compare container
    const abView = document.createElement("div");
    abView.className = "mjr-viewer-ab";
    abView.style.cssText = `
        width: 100%;
        height: 100%;
        display: none;
        position: relative;
    `;

    // Side-by-side container
    const sideView = document.createElement("div");
    sideView.className = "mjr-viewer-sidebyside";
    sideView.style.cssText = `
        width: 100%;
        height: 100%;
        display: none;
        flex-direction: row;
        gap: 2px;
    `;

    content.appendChild(singleView);
    content.appendChild(abView);
    content.appendChild(sideView);

    // Overlay layer (grid + probe + loupe). Rendered above media, pointer-events disabled to avoid
    // interfering with pan/zoom gestures.
    const overlayLayer = document.createElement("div");
    overlayLayer.className = "mjr-viewer-overlay-layer";
    overlayLayer.style.cssText = `
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 50;
    `;

    const gridCanvas = document.createElement("canvas");
    gridCanvas.className = "mjr-viewer-grid-canvas";
    gridCanvas.style.cssText = `
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: none;
    `;

    const probeTooltip = document.createElement("div");
    probeTooltip.className = "mjr-viewer-probe";
    probeTooltip.style.cssText = `
        position: absolute;
        display: none;
        padding: 6px 8px;
        border-radius: 6px;
        background: rgba(0, 0, 0, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.14);
        color: rgba(255, 255, 255, 0.92);
        font-size: 11px;
        line-height: 1.2;
        white-space: pre;
        max-width: 280px;
        transform: translate3d(0,0,0);
    `;

    const loupeWrap = document.createElement("div");
    loupeWrap.className = "mjr-viewer-loupe";
    loupeWrap.style.cssText = `
        position: absolute;
        display: none;
        width: 120px;
        height: 120px;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,0.16);
        box-shadow: 0 8px 18px rgba(0,0,0,0.45);
        background: rgba(0,0,0,0.65);
        transform: translate3d(0,0,0);
    `;

    const loupeCanvas = document.createElement("canvas");
    loupeCanvas.width = 120;
    loupeCanvas.height = 120;
    loupeCanvas.style.cssText = "width:100%; height:100%; display:block; image-rendering: pixelated;";
    loupeWrap.appendChild(loupeCanvas);

    overlayLayer.appendChild(gridCanvas);
    overlayLayer.appendChild(probeTooltip);
    overlayLayer.appendChild(loupeWrap);
    content.appendChild(overlayLayer);

    // Sidebar: generation info (Right).
    const genInfoOverlay = document.createElement("div");
    genInfoOverlay.className = "mjr-viewer-geninfo mjr-viewer-geninfo--right";
    genInfoOverlay.style.cssText = `
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        width: min(420px, 48vw);
        display: none;
        flex-direction: column;
        overflow: hidden;
        background: rgba(0, 0, 0, 0.88);
        border-left: 1px solid rgba(255,255,255,0.12);
        pointer-events: auto;
        backdrop-filter: blur(10px);
        z-index: 10001;
    `;
    const genInfoHeader = document.createElement("div");
    genInfoHeader.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 10px 12px;
        border-bottom: 1px solid rgba(255,255,255,0.10);
        color: rgba(255,255,255,0.92);
    `;
    const genInfoTitle = document.createElement("div");
    genInfoTitle.textContent = "Generation Info";
    genInfoTitle.style.cssText = "font-size: 13px; font-weight: 600;";
    genInfoHeader.appendChild(genInfoTitle);
    const genInfoBody = document.createElement("div");
    genInfoBody.style.cssText = `
        flex: 1;
        overflow: auto;
        padding: 12px;
        color: rgba(255,255,255,0.92);
    `;
    genInfoOverlay.appendChild(genInfoHeader);
    genInfoOverlay.appendChild(genInfoBody);

    // Sidebar: generation info (Left).
    const genInfoOverlayLeft = document.createElement("div");
    genInfoOverlayLeft.className = "mjr-viewer-geninfo mjr-viewer-geninfo--left";
    genInfoOverlayLeft.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        width: min(420px, 48vw);
        display: none;
        flex-direction: column;
        overflow: hidden;
        background: rgba(0, 0, 0, 0.88);
        border-right: 1px solid rgba(255,255,255,0.12);
        pointer-events: auto;
        backdrop-filter: blur(10px);
        z-index: 10001;
    `;
    const genInfoHeaderLeft = genInfoHeader.cloneNode(true); // Shallow clone structure
    // safe: clearing existing static node content only
    genInfoHeaderLeft.innerHTML = "";
    const genInfoTitleLeft = document.createElement("div");
    genInfoTitleLeft.textContent = "Generation Info (A)";
    genInfoTitleLeft.style.cssText = "font-size: 13px; font-weight: 600;";
    genInfoHeaderLeft.appendChild(genInfoTitleLeft);
    const genInfoBodyLeft = document.createElement("div");
    genInfoBodyLeft.style.cssText = `
        flex: 1;
        overflow: auto;
        padding: 12px;
        color: rgba(255,255,255,0.92);
    `;
    genInfoOverlayLeft.appendChild(genInfoHeaderLeft);
    genInfoOverlayLeft.appendChild(genInfoBodyLeft);

    // Mount the row (stage)
    try {
        contentRow.appendChild(content);
    } catch (e) { console.debug?.(e); }

    // Footer with navigation
    const footer = document.createElement("div");
    footer.className = "mjr-viewer-footer";
    footer.style.cssText = `
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 12px 20px;
        background: rgba(0, 0, 0, 0.8);
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        color: white;
        gap: 20px;
    `;

    const prevBtn = createIconButton("<", "Previous (Left Arrow)");
    prevBtn.classList.add("mjr-viewer-nav-btn", "mjr-viewer-nav-btn--prev");
    prevBtn.style.fontSize = "24px";
    const indexInfo = document.createElement("span");
    indexInfo.className = "mjr-viewer-index";
    indexInfo.style.cssText = "font-size: 14px;";
    const nextBtn = createIconButton(">", "Next (Right Arrow)");
    nextBtn.classList.add("mjr-viewer-nav-btn", "mjr-viewer-nav-btn--next");
    nextBtn.style.fontSize = "24px";

    const navBar = document.createElement("div");
    navBar.className = "mjr-viewer-nav";
    navBar.style.cssText = "display:flex; align-items:center; gap:20px;";

    navBar.appendChild(prevBtn);
    navBar.appendChild(indexInfo);
    navBar.appendChild(nextBtn);

    const playerBarHost = document.createElement("div");
    playerBarHost.className = "mjr-viewer-playerbar";
    playerBarHost.style.cssText = "display:none; width: 100%;";

    footer.appendChild(navBar);
    footer.appendChild(playerBarHost);

    // Filmstrip — horizontal thumbnail strip between content and footer.
    const filmstrip = createFilmstrip({
        state,
        buildAssetViewURL,
        onNavigate: (idx) => {
            try {
                // Plain click exits filmstrip compare mode before navigating
                if (state.compareAsset != null) {
                    state.compareAsset = null;
                    state.mode = VIEWER_MODES.SINGLE;
                }
                state.currentIndex = idx;
                updateUI();
            } catch (e) { console.debug?.(e); }
        },
        onCompare: (idx) => {
            try {
                const assets = Array.isArray(state.assets) ? state.assets : [];
                const chosen = assets[idx];
                if (!chosen) return;
                // Ignore if user clicks the current A asset
                if (chosen === assets[state.currentIndex]) return;
                // Toggle off compare mode if clicking the current B asset
                if (chosen === state.compareAsset) {
                    state.compareAsset = null;
                    state.mode = VIEWER_MODES.SINGLE;
                    updateUI();
                    return;
                }
                // If only two assets, always use AB_COMPARE for clarity
                if (assets.length === 2) {
                    state.compareAsset = assets[1 - state.currentIndex];
                    state.mode = VIEWER_MODES.AB_COMPARE;
                } else {
                    // Otherwise, prefer Side-by-Side if possible
                    state.compareAsset = chosen;
                    state.mode = canSide() ? VIEWER_MODES.SIDE_BY_SIDE : VIEWER_MODES.AB_COMPARE;
                }
                updateUI();
            } catch (e) { console.debug?.(e); }
        },
    });

    overlay.appendChild(header);
    overlay.appendChild(contentRow);
    overlay.appendChild(filmstrip.el);
    overlay.appendChild(footer);
    overlay.appendChild(genInfoOverlay);
    overlay.appendChild(genInfoOverlayLeft);

    // Light Dismiss: Close on background click (smart drag detection)
    try {
        let _ptrDown = null;
        // Capture pointerdown to track start pos, even if children stop propagation
        overlay.addEventListener("pointerdown", (e) => {
            if (e.isPrimary === false) return;
            _ptrDown = { x: e.clientX, y: e.clientY, t: Date.now() };
        }, { capture: true, passive: true });

        overlay.addEventListener("click", (e) => {
            try {
                if (e.defaultPrevented || e.button !== 0) return;

                // Drag/Selection check
                if (_ptrDown) {
                    const dx = e.clientX - _ptrDown.x;
                    const dy = e.clientY - _ptrDown.y;
                    const dist = Math.hypot(dx, dy);
                    // If moved more than 6px or held longer than 600ms (selection/drag), ignore.
                    if (dist > 6 || (Date.now() - _ptrDown.t > 600)) return;
                }

                const t = e.target;
                if (safeClosest(t, ".mjr-viewer-header") ||
                    safeClosest(t, ".mjr-viewer-footer") ||
                    safeClosest(t, ".mjr-viewer-geninfo") ||
                    safeClosest(t, ".mjr-video-controls") ||
                    safeClosest(t, ".mjr-context-menu") ||
                    safeClosest(t, ".mjr-ab-slider") ||
                    safeClosest(t, ".mjr-viewer-loupe") ||
                    safeClosest(t, ".mjr-viewer-probe") ||
                    safeClosest(t, ".mjr-viewer-media") ||
                    (t && (t.tagName === "IMG" || t.tagName === "VIDEO" || t.tagName === "CANVAS"))) {
                    return;
                }
                _requestCloseFromButton();
            } catch (e) { console.debug?.(e); }
        });
    } catch (e) { console.debug?.(e); }

    const metadataHydrator = createViewerMetadataHydrator({
        state,
        VIEWER_MODES,
        APP_CONFIG,
        getAssetMetadata,
        getAssetsBatch,
    });
    const VIEWER_INFO_CACHE_TTL_MS = 5 * 60 * 1000;
    const VIEWER_INFO_CACHE_MAX = 256;
    const _viewerInfoCache = new Map();
    const _viewerInfoCachePrune = () => {
        try {
            const now = Date.now();
            for (const [k, entry] of _viewerInfoCache.entries()) {
                const ts = Number(entry?.at) || 0;
                if (!ts || now - ts > VIEWER_INFO_CACHE_TTL_MS) _viewerInfoCache.delete(k);
            }
            if (_viewerInfoCache.size <= VIEWER_INFO_CACHE_MAX) return;
            const ordered = Array.from(_viewerInfoCache.entries()).sort(
                (a, b) => (Number(a?.[1]?.at) || 0) - (Number(b?.[1]?.at) || 0)
            );
            const overflow = _viewerInfoCache.size - VIEWER_INFO_CACHE_MAX;
            for (let i = 0; i < overflow; i += 1) {
                const key = ordered?.[i]?.[0];
                if (key != null) _viewerInfoCache.delete(key);
            }
        } catch (e) { console.debug?.(e); }
    };
    const _viewerInfoCacheGet = (id) => {
        try {
            const key = String(id ?? "");
            if (!key) return null;
            const entry = _viewerInfoCache.get(key);
            if (!entry || typeof entry !== "object") return null;
            const ts = Number(entry?.at) || 0;
            if (!ts || Date.now() - ts > VIEWER_INFO_CACHE_TTL_MS) {
                _viewerInfoCache.delete(key);
                return null;
            }
            return entry?.data || null;
        } catch {
            return null;
        }
    };
    const _viewerInfoCacheSet = (id, data) => {
        try {
            const key = String(id ?? "");
            if (!key || !data) return;
            _viewerInfoCache.set(key, { data, at: Date.now() });
            _viewerInfoCachePrune();
        } catch (e) { console.debug?.(e); }
    };

    const hydrateVisibleMetadata = async () => {
        try {
            await metadataHydrator?.hydrateVisibleMetadata?.();
        } catch (e) { console.debug?.(e); }
    };

    try {
        panzoom = createViewerPanZoom({
            overlay,
            content,
            singleView,
            abView,
            sideView,
            state,
            VIEWER_MODES,
            scheduleOverlayRedraw,
            lifecycle,
        });
    } catch {
        panzoom = null;
    }

    const clearCanvas = (ctx, w, h) => {
        try {
            ctx.clearRect(0, 0, w, h);
        } catch (e) { console.debug?.(e); }
    };

    // Overlay drawing (grid + probe + loupe)
    let _overlayRAF = null;
    function scheduleOverlayRedraw(immediate) {
        try {
            if (overlay.style.display === "none") return;
            if (immediate === true) {
                if (_overlayRAF != null) {
                    cancelAnimationFrame(_overlayRAF);
                    _overlayRAF = null;
                }
                try {
                    redrawOverlays();
                } catch (e) { console.debug?.(e); }
                return;
            }
            if (_overlayRAF != null) return;
            _overlayRAF = requestAnimationFrame(() => {
                _overlayRAF = null;
                try {
                    redrawOverlays();
                } catch (e) { console.debug?.(e); }
            });
        } catch (e) { console.debug?.(e); }
    }

    const getOverlayMedia = () => {
        try {
            if (state?.mode === VIEWER_MODES.SINGLE) {
                return singleView?.querySelector?.(".mjr-viewer-media") || null;
            }
            if (state?.mode === VIEWER_MODES.AB_COMPARE) {
                return abView?.querySelector?.(".mjr-viewer-media") || null;
            }
            if (state?.mode === VIEWER_MODES.SIDE_BY_SIDE) {
                return sideView?.querySelector?.(".mjr-viewer-media") || null;
            }
        } catch (e) { console.debug?.(e); }
        return null;
    };

    const grid = createViewerGrid({
        gridCanvas,
        content,
        state,
        VIEWER_MODES,
        getPrimaryMedia: getOverlayMedia,
        getViewportRect,
        clearCanvas,
    });

    const redrawOverlays = () => {
        const hasPanHint = (() => {
            try {
                const at = Number(state?._panHintAt) || 0;
                return at > 0 && Date.now() - at < 900;
            } catch {
                return false;
            }
        })();
        try {
            const showHud = state?.mode === VIEWER_MODES.SINGLE && Boolean(state?.hudEnabled);
            const showScopes = String(state?.scopesMode || "off") !== "off";
            const showMask = Boolean(state?.overlayMaskEnabled);
            gridCanvas.style.display =
                state.gridMode === 0 && !showMask && !hasPanHint && !showHud && !showScopes ? "none" : "";
        } catch (e) { console.debug?.(e); }

        const size = grid.ensureCanvasSize();
        if (!(size.w > 0 && size.h > 0)) return;
        const wantGridOrMask = (() => {
            const showHud = state?.mode === VIEWER_MODES.SINGLE && Boolean(state?.hudEnabled);
            return (Number(state.gridMode) || 0) !== 0 || Boolean(state?.overlayMaskEnabled) || showHud;
        })();
        if (wantGridOrMask) {
            grid.redrawGrid(size);
        } else {
            try {
                const ctx = gridCanvas.getContext("2d");
                if (ctx) clearCanvas(ctx, size.w, size.h);
            } catch (e) { console.debug?.(e); }
        }

        if (hasPanHint) {
            try {
                const ctx = gridCanvas.getContext("2d");
                if (ctx) {
                    const rect = content?.getBoundingClientRect?.();
                    const x0 = Number(state?._panHintX);
                    const y0 = Number(state?._panHintY);
                    const x = rect && Number.isFinite(x0) ? x0 - rect.left : size.w / 2;
                    const y = rect && Number.isFinite(y0) ? y0 - rect.top : size.h * 0.78;
                    const pad = 10;
                    const tx = Math.max(pad, Math.min(size.w - pad, x));
                    const ty = Math.max(pad, Math.min(size.h - pad, y));
                    ctx.save();
                    ctx.font = "12px var(--comfy-font, ui-sans-serif, system-ui)";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    const msg = "Zoom in to pan";
                    const metrics = ctx.measureText(msg);
                    const w = Math.min(size.w - 2 * pad, Math.max(140, metrics.width + 26));
                    const h = 26;
                    ctx.fillStyle = "rgba(0,0,0,0.65)";
                    ctx.strokeStyle = "rgba(255,255,255,0.18)";
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    const rx = tx - w / 2;
                    const ry = ty - h / 2;
                    const r = 10;
                    ctx.moveTo(rx + r, ry);
                    ctx.arcTo(rx + w, ry, rx + w, ry + h, r);
                    ctx.arcTo(rx + w, ry + h, rx, ry + h, r);
                    ctx.arcTo(rx, ry + h, rx, ry, r);
                    ctx.arcTo(rx, ry, rx + w, ry, r);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                    ctx.fillStyle = "rgba(255,255,255,0.92)";
                    ctx.fillText(msg, tx, ty);
                    ctx.restore();
                }
            } catch (e) { console.debug?.(e); }
        }

        // HUD: bbox + image WxH label (drawn in `grid.js`). No filename overlay here.

        // Scopes (optional): RGB histogram + luma waveform (downscaled, best-effort).
        try {
            const scopesMode = String(state?.scopesMode || "off");
            if (scopesMode !== "off") {
                const ctx = gridCanvas.getContext("2d");
                if (ctx) {
                    let root = singleView;
                    if (state?.mode === VIEWER_MODES.AB_COMPARE) root = abView;
                    else if (state?.mode === VIEWER_MODES.SIDE_BY_SIDE) root = sideView;
                    const any = root?.querySelector?.("canvas.mjr-viewer-media") || overlay?.querySelector?.("canvas.mjr-viewer-media");
                    if (any && any instanceof HTMLCanvasElement) {
                        drawScopesLight(ctx, { w: size.w, h: size.h }, any, { mode: scopesMode, channel: state?.channel });
                    }
                }
            }
        } catch (e) { console.debug?.(e); }

        if (state.mode !== VIEWER_MODES.SINGLE) {
            try {
                probeTooltip.style.display = "none";
            } catch (e) { console.debug?.(e); }
            try {
                loupeWrap.style.display = "none";
            } catch (e) { console.debug?.(e); }
        }
    };

    // ----------------------------------------------------------------------------
    // Generation Info side panel (prompt/model/etc)
    // ----------------------------------------------------------------------------

    const stopGenInfoFetch = () => {
        try {
            state._genInfoAbort?.abort?.();
        } catch (e) { console.debug?.(e); }
        state._genInfoAbort = null;
        try {
            state._genInfoReqId = (Number(state._genInfoReqId) || 0) + 1;
        } catch (e) { console.debug?.(e); }
    };

    const ensureGenInfoAsset = async (asset, { signal } = {}) => {
        try {
            return await ensureViewerMetadataAsset(asset, {
                getAssetMetadata,
                getFileMetadataScoped,
                metadataCache: metadataHydrator,
                signal,
            });
        } catch {
            return asset;
        }
    };

    const shouldShowGenInfoLoading = (asset) => {
        try {
            if (!asset || typeof asset !== "object") return false;
            if (asset?.geninfo || asset?.prompt || asset?.workflow || asset?.metadata) return false;
            const mime = String(asset?.mime || asset?.mimetype || asset?.type || "").toLowerCase();
            if (mime.startsWith("video/")) return true;
            const p = String(asset?.filepath || asset?.path || asset?.filename || asset?.name || "").toLowerCase();
            const ext = p.split(".").pop() || "";
            if (["mp4", "webm", "mov", "mkv", "avi", "m4v", "gif"].includes(ext)) return true;
            // If we have nothing at all, show a loading hint while hydration runs.
            return true;
        } catch {
            return false;
        }
    };

    const renderGenInfoPanel = async () => {
        const canABMode = canAB();
        const canSideMode = canSide();
        const mode = state.mode;
        const open = Boolean(state?.genInfoOpen) && !state?.distractionFree;

        // Determine if we should show split panels
        const isDual = open && (
            (mode === VIEWER_MODES.AB_COMPARE && canABMode) ||
            (mode === VIEWER_MODES.SIDE_BY_SIDE && canSideMode)
        );

        try {
            genInfoOverlay.style.display = open ? "flex" : "none";
            genInfoOverlayLeft.style.display = isDual ? "flex" : "none";
            // Reserve space so the viewer shrinks.
            overlay.style.paddingRight = open ? "min(420px, 48vw)" : "0px";
            overlay.style.paddingLeft = isDual ? "min(420px, 48vw)" : "0px";

            if (!open) {
                stopGenInfoFetch();
                try { genInfoBody.innerHTML = ""; } catch (e) { console.debug?.(e); }
                try { genInfoBodyLeft.innerHTML = ""; } catch (e) { console.debug?.(e); }
                return;
            }
        } catch {
            return;
        }

        stopGenInfoFetch();
        const reqId = (Number(state?._genInfoReqId) || 0) + 1;
        try { state._genInfoReqId = reqId; } catch (e) { console.debug?.(e); }
        const ac = new AbortController();
        state._genInfoAbort = ac;

        const renderNow = ({ left, right, single }) => {
            try { genInfoBody.innerHTML = ""; } catch (e) { console.debug?.(e); }
            try { genInfoBodyLeft.innerHTML = ""; } catch (e) { console.debug?.(e); }

            const onRetry = () => {
                try {
                    if (!state?.genInfoOpen) state.genInfoOpen = true;
                    void renderGenInfoPanel();
                } catch (e) { console.debug?.(e); }
            };

            const addBlockTo = (targetBody, title, assetObj, loading) => {
                if (!targetBody) return;
                try {
                    try {
                        targetBody.appendChild(
                            buildViewerMetadataBlocks({
                                title,
                                asset: assetObj,
                                ui: { loading: Boolean(loading), onRetry },
                            })
                        );
                        return;
                    } catch (e) { console.debug?.(e); }
                    
                    // Fallback manual rendering
                    const block = document.createElement("div");
                    block.style.cssText = "display:flex; flex-direction:column; gap:10px; margin-bottom: 14px;";
                    
                    if (title) {
                        const h = document.createElement("div");
                        h.textContent = title;
                        h.style.cssText = "font-size: 12px; font-weight: 600; letter-spacing: 0.02em; color: rgba(255,255,255,0.86);";
                        block.appendChild(h);
                    }

                    const empty = document.createElement("div");
                    empty.style.cssText = "padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.72);";
                    empty.textContent = "No generation data found for this file.";
                    block.appendChild(empty);
                    
                    try {
                        const raw = assetObj?.metadata_raw;
                        if (raw != null) {
                            const details = document.createElement("details");
                            details.style.cssText = "border: 1px solid rgba(255,255,255,0.10); border-radius: 10px; background: rgba(255,255,255,0.04); overflow: hidden;";
                            const summary = document.createElement("summary");
                            summary.textContent = "Raw metadata";
                            summary.style.cssText = "cursor: pointer; padding: 10px 12px; color: rgba(255,255,255,0.78); user-select: none;";
                            const pre = document.createElement("pre");
                            pre.style.cssText = "margin:0; padding: 10px 12px; max-height: 280px; overflow:auto; font-size: 11px; line-height: 1.35; color: rgba(255,255,255,0.86);";
                            let txt = "";
                            try {
                                if (typeof raw === "string") txt = raw;
                                else txt = JSON.stringify(raw, null, 2);
                            } catch {
                                txt = String(raw);
                            }
                            if (txt.length > 40_000) txt = `${txt.slice(0, 40_000)}\n…(truncated)…`;
                            pre.textContent = txt;
                            details.appendChild(summary);
                            details.appendChild(pre);
                            block.appendChild(details);
                        }
                    } catch (e) { console.debug?.(e); }
                    targetBody.appendChild(block);
                } catch (e) { console.debug?.(e); }
            };

            if (isDual) {
                 if (left) {
                     genInfoTitleLeft.textContent = left.title || "Asset A";
                     addBlockTo(genInfoBodyLeft, "", left.asset, left.loading);
                 }
                 if (right) {
                     genInfoTitle.textContent = right.title || "Asset B";
                     addBlockTo(genInfoBody, "", right.asset, right.loading);
                 }
            } else {
                 // Single mode
                 if (single) {
                     genInfoTitle.textContent = single.title || "Generation Info";
                     addBlockTo(genInfoBody, "", single.asset, single.loading);
                 }
            }
        };

        // Resolve assets and perform initial render
        try {
            const current = state?.assets?.[state?.currentIndex] || null;
            if (!current) {
                renderNow({});
                return;
            }

            let assetLeft = null;
            let assetRight = null;
            let assetSingle = null;

            if (isDual) {
                // Determine A and B
                if (mode === VIEWER_MODES.SIDE_BY_SIDE) {
                    // Side-by-side can be fixed-order (2-up set) or filmstrip compare (A=current, B=chosen).
                    if (state?.compareAsset) {
                        assetLeft = current;
                        assetRight = state.compareAsset;
                    } else {
                        assetLeft = state.assets[0];
                        assetRight = state.assets[1];
                    }
                } else {
                    // AB_COMPARE: Swappable roles (Current vs Other)
                    assetLeft = current;
                    const other = state?.compareAsset || 
                        (state.assets.length === 2 ? state.assets[1 - state.currentIndex] : null);
                    assetRight = other;
                }
            } else {
                assetSingle = current;
            }

            // Initial render (cache)
            const getCached = (a) => a ? (metadataHydrator?.getCached?.(a.id)?.data || a) : null;
            
            renderNow({
                left: isDual ? {
                    title: "Asset A",
                    asset: getCached(assetLeft),
                    loading: shouldShowGenInfoLoading(getCached(assetLeft))
                } : null,
                right: isDual ? {
                    title: "Asset B",
                    asset: getCached(assetRight),
                    loading: shouldShowGenInfoLoading(getCached(assetRight))
                } : null,
                single: !isDual ? {
                    title: "Generation Info",
                    asset: getCached(assetSingle),
                    loading: shouldShowGenInfoLoading(getCached(assetSingle))
                } : null
            });

            // Hydrate logic
            if (state._genInfoReqId !== reqId) return;
            
            if (isDual) {
                const lFull = assetLeft ? await ensureGenInfoAsset(assetLeft, { signal: ac.signal }) : null;
                const rFull = assetRight ? await ensureGenInfoAsset(assetRight, { signal: ac.signal }) : null;
                if (state._genInfoReqId !== reqId) return;
                
                renderNow({
                    left: {
                        title: "Asset A",
                        asset: lFull,
                        loading: false
                    },
                    right: {
                         title: "Asset B",
                         asset: rFull,
                         loading: false
                    }
                });
            } else {
                const sFull = assetSingle ? await ensureGenInfoAsset(assetSingle, { signal: ac.signal }) : null;
                if (state._genInfoReqId !== reqId) return;
                
                renderNow({
                    single: {
                        title: "Generation Info",
                        asset: sFull,
                        loading: false
                    }
                });
            }

        } catch (e) { console.debug?.(e); }
    };

    // No close button in panel (toggle via toolbar / shortcut).

    // ----------------------------------------------------------------------------
    // Export frame (PNG download + clipboard copy)
    // ----------------------------------------------------------------------------

    const { exportCurrentFrame } = createFrameExporter({ state, VIEWER_MODES, singleView, abView, sideView });

    // Smooth animation loop using requestAnimationFrame (only when needed)
    // REMOVED: Animation loop (requestAnimationFrame) for performance
    // Direct transform updates only

    const renderBadges = () => {
        const clear = (el) => {
            try {
                if (el) el.innerHTML = "";
            } catch (e) { console.debug?.(e); }
        };
        clear(badgesBar);
        clear(badgesBarRight);

        const makePill = (asset, { showName } = {}) => {
            if (!asset) return null;
            const pill = document.createElement("div");
            pill.className = "mjr-viewer-asset-pill";
            pill.style.cssText = `
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 2px 8px;
                border-radius: 999px;
                border: 1px solid rgba(255,255,255,0.14);
                background: rgba(255,255,255,0.08);
                font-size: 12px;
                max-width: 360px;
                overflow: hidden;
            `;

            const name = document.createElement("span");
            name.textContent = String(asset.filename || "");
            name.style.cssText =
                "max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; opacity:0.95;";

            const extBadge = createFileBadge(asset.filename, asset.kind, !!asset?._mjrNameCollision);
            try {
                extBadge.style.position = "static";
                extBadge.style.top = "";
                extBadge.style.left = "";
                extBadge.style.padding = "2px 6px";
                extBadge.style.fontSize = "10px";
                extBadge.style.borderRadius = "6px";
                extBadge.style.pointerEvents = "none";
            } catch (e) { console.debug?.(e); }

            const stars = createRatingBadge(asset.rating || 0);
            if (stars) {
                try {
                    stars.style.position = "static";
                    stars.style.top = "";
                    stars.style.right = "";
                    stars.style.padding = "2px 6px";
                    stars.style.fontSize = "12px";
                } catch (e) { console.debug?.(e); }
            }

            const tags = createTagsBadge(Array.isArray(asset.tags) ? asset.tags : []);
            if (tags) {
                try {
                    tags.style.position = "static";
                    tags.style.bottom = "";
                    tags.style.left = "";
                    tags.style.maxWidth = "220px";
                    tags.style.pointerEvents = "none";
                } catch (e) { console.debug?.(e); }
            }

            pill.appendChild(extBadge);
            if (showName) pill.appendChild(name);
            if (stars) pill.appendChild(stars);
            if (tags && tags.style.display !== "none") pill.appendChild(tags);

            try {
                if (asset.filepath) pill.title = String(asset.filepath);
            } catch (e) { console.debug?.(e); }
            return pill;
        };

        const isSingle = state.mode === VIEWER_MODES.SINGLE;
        const isAB = state.mode === VIEWER_MODES.AB_COMPARE && canAB();
        const isSide = state.mode === VIEWER_MODES.SIDE_BY_SIDE && canSide();

        // A/B and Side-by-side: when we have a right badge bar, split per side to keep the header readable.
        if ((isAB || isSide) && badgesBarRight) {
            const current = state.assets?.[state.currentIndex] || null;
            const sideUsesCompare = isSide && state.compareAsset != null;
            const leftAsset = isAB
                ? (state.compareAsset != null ? current : state.assets?.[0] || null)
                : sideUsesCompare
                    ? current
                    : state.assets?.[0] || null;
            const rightAsset = isAB
                ? (state.compareAsset != null ? state.compareAsset : state.assets?.[1] || null)
                : sideUsesCompare
                    ? state.compareAsset
                    : state.assets?.[Math.max(0, (state.assets?.length || 1) - 1)] || null;
            const leftPill = makePill(leftAsset, { showName: false });
            const rightPill = makePill(rightAsset, { showName: false });
            try {
                if (leftPill) badgesBar.appendChild(leftPill);
            } catch (e) { console.debug?.(e); }
            try {
                if (rightPill) badgesBarRight.appendChild(rightPill);
            } catch (e) { console.debug?.(e); }
            return;
        }

        const items = isSingle
            ? [state.assets[state.currentIndex]].filter(Boolean)
            : Array.isArray(state.assets)
              ? state.assets.slice(0, 4)
              : [];

        for (const a of items) {
            const pill = makePill(a, { showName: !isSingle });
            if (!pill) continue;
            try {
                badgesBar.appendChild(pill);
            } catch (e) { console.debug?.(e); }
        }
    };

    function canAB() {
        return state.assets.length === 2 || state.compareAsset != null;
    }

    function canSide() {
        const n = state.assets.length;
        return (n >= 2 && n <= 4) || (n >= 1 && state.compareAsset != null);
    }

    function applyDistractionFreeUI() {
        const on = Boolean(state?.distractionFree);
        try {
            header.style.display = on ? "none" : "";
        } catch (e) { console.debug?.(e); }
        try {
            footer.style.display = on ? "none" : "";
        } catch (e) { console.debug?.(e); }
        try {
            overlay.classList.toggle("mjr-viewer-focus", on);
        } catch (e) { console.debug?.(e); }
        try {
            if (on) {
                overlay.style.paddingRight = "0px";
                overlay.style.paddingLeft = "0px";
                genInfoOverlay.style.display = "none";
                genInfoOverlayLeft.style.display = "none";
            }
        } catch (e) { console.debug?.(e); }
    }

    // Update UI based on state
    function updateUI() {
        // FORCE RESET: Always reset zoom/pan when changing images
        state.zoom = 1;
        state.panX = 0;
        state.panY = 0;
        state.targetZoom = 1;

        // Clear filmstrip compare asset when leaving compare modes
        try {
            if (
                state.mode !== VIEWER_MODES.AB_COMPARE &&
                state.mode !== VIEWER_MODES.SIDE_BY_SIDE &&
                state.compareAsset != null
            ) {
                state.compareAsset = null;
            }
        } catch (e) { console.debug?.(e); }

        // Update filename
        const current = state.assets[state.currentIndex];
        const isAB = state.mode === VIEWER_MODES.AB_COMPARE && canAB();
        const isSide = state.mode === VIEWER_MODES.SIDE_BY_SIDE && canSide();
        // In filmstrip-compare AB mode, A = current navigated asset, B = compareAsset.
        // In traditional AB mode (exactly 2 assets), A = assets[0], B = assets[1].
        const isFilmCompareAB = isAB && state.compareAsset != null;
        const isFilmCompareSide = isSide && state.compareAsset != null;
        const leftAsset = isAB
            ? (isFilmCompareAB ? current : state.assets?.[0]) || null
            : isSide
                ? (isFilmCompareSide ? current : state.assets?.[0]) || null
                : current || null;
        const rightAsset = isAB
            ? (isFilmCompareAB ? state.compareAsset : state.assets?.[1]) || null
            : isSide
                ? (isFilmCompareSide
                    ? state.compareAsset
                    : Array.isArray(state.assets) && state.assets.length >= 2
                        ? state.assets[state.assets.length - 1]
                        : null)
                : null;
        try {
            filename.textContent = leftAsset?.filename || "";
        } catch (e) { console.debug?.(e); }
        try {
            if (rightMeta && filenameRight && rightAsset && rightAsset !== leftAsset) {
                rightMeta.style.display = "flex";
                filenameRight.textContent = rightAsset?.filename || "";
            } else if (rightMeta && filenameRight) {
                rightMeta.style.display = "none";
                filenameRight.textContent = "";
            }
        } catch (e) { console.debug?.(e); }
        // Update index
        if (state.mode === VIEWER_MODES.AB_COMPARE && canAB()) {
            indexInfo.textContent = "2 selected";
        } else if (state.mode === VIEWER_MODES.SIDE_BY_SIDE && canSide()) {
            indexInfo.textContent = state.compareAsset != null ? "2 selected" : `${state.assets.length} selected`;
        } else {
            indexInfo.textContent = `${state.currentIndex + 1} / ${state.assets.length}`;
        }

        if (state.mode === VIEWER_MODES.AB_COMPARE && !canAB()) state.mode = VIEWER_MODES.SINGLE;
        if (state.mode === VIEWER_MODES.SIDE_BY_SIDE && !canSide()) state.mode = VIEWER_MODES.SINGLE;
        try {
            toolbar?.syncModeButtons?.({ canAB, canSide });
        } catch (e) { console.debug?.(e); }

        // Show/hide views
        singleView.style.display = state.mode === VIEWER_MODES.SINGLE ? 'flex' : 'none';
        abView.style.display = state.mode === VIEWER_MODES.AB_COMPARE ? 'block' : 'none';
        sideView.style.display = state.mode === VIEWER_MODES.SIDE_BY_SIDE ? 'flex' : 'none';

        // Cleanup hidden views to prevent processor loops and listener buildup.
        try {
            if (state.mode !== VIEWER_MODES.SINGLE) {
                destroyMediaProcessorsIn(singleView);
                singleView.innerHTML = "";
            }
        } catch (e) { console.debug?.(e); }
        try {
            if (state.mode !== VIEWER_MODES.AB_COMPARE) {
                destroyMediaProcessorsIn(abView);
                abView.innerHTML = "";
            }
        } catch (e) { console.debug?.(e); }
        try {
            if (state.mode !== VIEWER_MODES.SIDE_BY_SIDE) {
                destroyMediaProcessorsIn(sideView);
                sideView.innerHTML = "";
            }
        } catch (e) { console.debug?.(e); }

        renderBadges();

        // Hide navigation for compare modes (selected-set compare).
        const hideNav =
            (state.mode === VIEWER_MODES.AB_COMPARE && canAB()) ||
            (state.mode === VIEWER_MODES.SIDE_BY_SIDE && canSide());
        try {
            prevBtn.style.display = hideNav ? "none" : "";
            nextBtn.style.display = hideNav ? "none" : "";
        } catch (e) { console.debug?.(e); }

        // Render current asset
        renderAsset();
        preloadAdjacentAssets(state.assets, state.currentIndex);
        // Mount/unmount the video player bar depending on current media.
        syncPlayerBar();
        try {
            toolbar?.syncToolsUIFromState?.();
        } catch (e) { console.debug?.(e); }
        try {
            applyDistractionFreeUI();
        } catch (e) { console.debug?.(e); }
        try {
            scheduleApplyGrade?.();
        } catch (e) { console.debug?.(e); }
        scheduleOverlayRedraw();
        try {
            void renderGenInfoPanel();
        } catch (e) { console.debug?.(e); }

        // Hydrate rating/tags for visible assets and refresh the badge bar.
        try {
            void hydrateVisibleMetadata().then(() => {
                try {
                    renderBadges();
                } catch (e) { console.debug?.(e); }
            });
        } catch (e) { console.debug?.(e); }

        // Sync filmstrip highlight and scroll position.
        try {
            const isSingle = state.mode === VIEWER_MODES.SINGLE;
            filmstrip.sync({ isSingle });
        } catch (e) { console.debug?.(e); }
    }

    // Render the current asset based on mode
    function renderAsset() {
        const current = state.assets[state.currentIndex];
        if (!current) return;

        const viewUrl = buildAssetViewURL(current);
        if (!viewUrl) {
            try {
                destroyMediaProcessorsIn(singleView);
            } catch (e) { console.debug?.(e); }
            try {
                singleView.innerHTML = "";
                const err = document.createElement("div");
                err.className = "mjr-viewer-media";
                err.style.cssText = "color:#ff9a9a; font-size:13px; padding:16px; text-align:center;";
                err.textContent = "Cannot open asset: missing or invalid filename/path.";
                singleView.appendChild(err);
            } catch (e) { console.debug?.(e); }
            return;
        }

        if (state.mode === VIEWER_MODES.SINGLE) {
            try {
                destroyMediaProcessorsIn(singleView);
            } catch (e) { console.debug?.(e); }
            singleView.innerHTML = '';
            state._mediaW = 0;
            state._mediaH = 0;
            const media = createMediaElement(current, viewUrl);
            singleView.appendChild(media);
        } else if (state.mode === VIEWER_MODES.AB_COMPARE) {
            if (canAB()) {
                renderABCompareView({
                    abView,
                    state,
                    currentAsset: current,
                    viewUrl,
                    buildAssetViewURL,
                    createCompareMediaElement,
                    destroyMediaProcessorsIn,
                });
            }
        } else if (state.mode === VIEWER_MODES.SIDE_BY_SIDE) {
            if (canSide()) {
                renderSideBySideView({
                    sideView,
                    state,
                    currentAsset: current,
                    viewUrl,
                    buildAssetViewURL,
                    createMediaElement,
                    destroyMediaProcessorsIn,
                });
            }
        }
        applyTransform();
        updatePanCursor();
    }

    const { preloadAdjacentAssets, preloadImageForAsset, trackPreloadRef } = createImagePreloader({
        buildAssetViewURL,
        IMAGE_PRELOAD_EXTENSIONS,
        state,
    });

    const { destroyPlayerBar, syncPlayerBar: _syncPlayerBarImpl } = createPlayerBarManager({
        state,
        APP_CONFIG,
        VIEWER_MODES,
        overlay,
        navBar,
        playerBarHost,
        singleView,
        abView,
        sideView,
        metadataHydrator,
        isPlayableViewerKind,
        collectPlayableMediaElements,
        pickPrimaryPlayableMedia,
        mountUnifiedMediaControls,
        installFollowerVideoSync,
        getViewerInfo,
        scheduleOverlayRedraw,
        viewerInfoCacheGet: _viewerInfoCacheGet,
        viewerInfoCacheSet: _viewerInfoCacheSet,
    });
    const syncPlayerBar = () => _syncPlayerBarImpl();


    // ----------------------------------------------------------------------------
    // Image processing (Nuke-like): exposure, gamma, channels, false color, zebra
    // ----------------------------------------------------------------------------

    const MAX_PROC_PIXELS = APP_CONFIG.VIEWER_MAX_PROC_PIXELS ?? 12_000_000;

    const getGradeParams = () => ({
        exposureEV: Number(state.exposureEV) || 0,
        gamma: Math.max(0.1, Math.min(3, Number(state.gamma) || 1)),
        channel: state.channel || "rgb",
        analysisMode: state.analysisMode || "none",
        zebraThreshold: Math.max(0, Math.min(1, Number(state.zebraThreshold) || 0.95)),
    });

    const applyGradeToVisibleMedia = () => {
        const params = getGradeParams();
        try {
            const els = overlay.querySelectorAll(".mjr-viewer-media");
            for (const el of els) {
                try {
                    const proc = el?._mjrProc;
                    if (proc?.setParams) proc.setParams(params);
                } catch (e) { console.debug?.(e); }
            }
        } catch (e) { console.debug?.(e); }
        // If A/B compare is showing a computed diff canvas, force a refresh after grade changes.
        try {
            if (state?.mode === VIEWER_MODES.AB_COMPARE) {
                abView?._mjrDiffRequest?.();
            }
        } catch (e) { console.debug?.(e); }
    };

    const isDefaultGrade = (params) => {
        try {
            if (!params) return true;
            const exposureEV = Number(params.exposureEV) || 0;
            const gamma = Number(params.gamma) || 1;
            const channel = String(params.channel || "rgb");
            const analysisMode = String(params.analysisMode || "none");
            return (
                Math.abs(exposureEV) < 0.0001 &&
                Math.abs(gamma - 1) < 0.0001 &&
                channel === "rgb" &&
                analysisMode === "none"
            );
        } catch {
            return true;
        }
    };

    const MAX_PROC_PIXELS_VIDEO = APP_CONFIG.VIEWER_MAX_PROC_PIXELS_VIDEO ?? 3_000_000;
    const VIDEO_GRADE_THROTTLE_FPS = APP_CONFIG.VIEWER_VIDEO_GRADE_THROTTLE_FPS ?? 15;

    try {
        mediaFactory = createViewerMediaFactory({
            overlay,
            state,
            mediaTransform,
            updateMediaNaturalSize,
            clampPanToBounds,
            applyTransform,
            scheduleOverlayRedraw,
            getGradeParams,
            isDefaultGrade,
            tonemap: null,
            maxProcPixels: MAX_PROC_PIXELS,
            maxProcPixelsVideo: MAX_PROC_PIXELS_VIDEO,
            disableWebGL: !!APP_CONFIG.VIEWER_DISABLE_WEBGL_VIDEO,
            videoGradeThrottleFps: VIDEO_GRADE_THROTTLE_FPS,
            safeAddListener,
            safeCall,
        });
    } catch {
        mediaFactory = null;
    }

    // Navigation
    lifecycleUnsubs.push(
        safeAddListener(prevBtn, "click", () => {
            if (state.currentIndex > 0) {
                state.currentIndex--;
                updateUI();
            }
        })
    );

    lifecycleUnsubs.push(
        safeAddListener(nextBtn, "click", () => {
            if (state.currentIndex < state.assets.length - 1) {
                state.currentIndex++;
                updateUI();
            }
        })
    );

    // Nuke-like processing controls (images only): channel/exposure/gamma/analysis.
    let _gradeRAF = null;
    const scheduleApplyGrade = () => {
        try {
            if (_gradeRAF != null) return;
            _gradeRAF = requestAnimationFrame(() => {
                _gradeRAF = null;
                try {
                    applyGradeToVisibleMedia();
                } catch (e) { console.debug?.(e); }
            });
        } catch (e) { console.debug?.(e); }
    };

    const syncToolsUIFromState = () => {
        try {
            toolbar?.syncToolsUIFromState?.();
        } catch (e) { console.debug?.(e); }
    };

    // Mouse wheel zoom (trackpad-friendly). Capture + preventDefault so ComfyUI canvas doesn't zoom underneath.
    const navigateViewerAssets = (direction) => {
        if (!Array.isArray(state.assets) || state.assets.length === 0) {
            return false;
        }
        const nextIndex = state.currentIndex + direction;
        if (nextIndex < 0 || nextIndex >= state.assets.length) {
            return false;
        }
        state.currentIndex = nextIndex;
        updateUI();
        return true;
    };

    const onWheelZoom = (e) => {
        if (overlay.style.display === "none") return;
        try {
            const t = e.target;
            if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) {
                return;
            }
        } catch (e) { console.debug?.(e); }

        // Only zoom when hovering the viewer content area.
        try {
            if (!content.contains(e.target)) return;
        } catch (e) { console.debug?.(e); }

        try {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation?.();
        } catch (e) { console.debug?.(e); }

        if (e.shiftKey) {
            const delta = Number(e.deltaY) || 0;
            if (delta) {
                const direction = delta > 0 ? 1 : -1;
                if (navigateViewerAssets(direction)) {
                    return;
                }
            }
        }

        const dy = Number(e.deltaY) || 0;
        if (!dy) return;

        // Smooth scaling: wheel down -> zoom out, wheel up -> zoom in.
        const factor = Math.exp(-dy * 0.0015);
        const next = (Number(state.zoom) || 1) * factor;
        setZoom(next, { clientX: e.clientX, clientY: e.clientY });
        // setZoom now handles transform application directly
    };

    // Pixel probe + loupe sampling (Radiance-inspired).

    const positionOverlayBox = (el, clientX, clientY, { offsetX = 16, offsetY = 16 } = {}) => {
        try {
            const v = getViewportRect();
            if (!v) return;
            const vp = content.getBoundingClientRect();
            const x0 = (Number(clientX) || 0) - vp.left;
            const y0 = (Number(clientY) || 0) - vp.top;
            const w = Number(el.offsetWidth) || 0;
            const h = Number(el.offsetHeight) || 0;
            let x = x0 + offsetX;
            let y = y0 + offsetY;
            const pad = 10;
            x = Math.max(pad, Math.min(x, v.width - w - pad));
            y = Math.max(pad, Math.min(y, v.height - h - pad));
            el.style.left = `${Math.round(x)}px`;
            el.style.top = `${Math.round(y)}px`;
        } catch (e) { console.debug?.(e); }
    };

    const loupe = createViewerLoupe({
        state,
        loupeCanvas,
        loupeWrap,
        getMediaNaturalSize,
        positionOverlayBox,
    });

    const probe = installViewerProbe({
        overlay,
        content,
        state,
        VIEWER_MODES,
        getPrimaryMedia,
        getMediaNaturalSize,
        getViewportRect,
        positionOverlayBox,
        probeTooltip,
        loupeWrap,
        onLoupeRedraw: loupe.redraw,
        lifecycle,
    });

    // Resize observer so grid canvas stays crisp and overlays remain aligned.
    try {
        if (!content._mjrOverlayResizeBound && "ResizeObserver" in window) {
            try {
                overlay._mjrResizeObserver?.disconnect?.();
            } catch (e) { console.debug?.(e); }
            const ro = new ResizeObserver(() => {
                try {
                    state._viewportCache = null;
                } catch (e) { console.debug?.(e); }
                scheduleOverlayRedraw();
            });
            try {
                ro.observe(content);
            } catch (e) { console.debug?.(e); }
            overlay._mjrResizeObserver = ro;
            lifecycleUnsubs.push(() => {
                try {
                    ro.disconnect();
                } catch (e) { console.debug?.(e); }
            });
            content._mjrOverlayResizeBound = true;
        }
    } catch (e) { console.debug?.(e); }

    // Keyboard shortcuts (installed on capture phase to avoid ComfyUI/global handlers eating events).
    const keyboard = installViewerKeyboard({
        overlay,
        content,
        singleView,
        state,
        VIEWER_MODES,
        computeOneToOneZoom,
        setZoom,
        scheduleOverlayRedraw,
        scheduleApplyGrade,
        syncToolsUIFromState,
        navigateViewerAssets,
        closeViewer,
        renderBadges,
        updateAssetRating,
        safeDispatchCustomEvent,
        ASSET_RATING_CHANGED_EVENT,
        probeTooltip,
        loupeWrap,
        renderGenInfoPanel,
        getVideoControls: () => {
            try {
                return state?._videoControlsMounted || null;
            } catch {
                return null;
            }
        },
        lifecycle,
    });

    // Bind/unbind global listeners only while the viewer is visible.
    // Prevents hotkeys/scroll from leaking to ComfyUI/browser when the viewer is closed.
    let _openUnsubs = [];
    const disposeOpenListeners = () => {
        try {
            for (const u of _openUnsubs) safeCall(u);
        } catch (e) { console.debug?.(e); }
        _openUnsubs = [];
        try {
            keyboard?.unbind?.();
        } catch (e) { console.debug?.(e); }
    };
    const bindOpenListeners = () => {
        disposeOpenListeners();
        try {
            _openUnsubs.push(
                safeAddListener(overlay, "click", (e) => {
                    try {
                        if (e.target !== overlay) return;
                    } catch (e) { console.debug?.(e); }
                    closeViewer();
                })
            );
        } catch (e) { console.debug?.(e); }
        try {
            _openUnsubs.push(safeAddListener(content, "wheel", onWheelZoom, { passive: false, capture: true }));
        } catch (e) { console.debug?.(e); }
        try {
            _openUnsubs.push(
                safeAddListener(
                    content,
                    "mousemove",
                    (e) => {
                        try {
                            state._lastPointerX = e.clientX;
                            state._lastPointerY = e.clientY;
                        } catch (e) { console.debug?.(e); }
                    },
                    { passive: true, capture: true }
                )
            );
        } catch (e) { console.debug?.(e); }
        try {
            keyboard?.bind?.();
        } catch (e) { console.debug?.(e); }
    };

    // Keep viewer badges in sync when tags/ratings change elsewhere (sidebar, panel hotkeys, etc.).
    try {
        if (!overlay._mjrBadgeSyncBound) {
            const onRatingSync = (e) => {
                try {
                    const id = e?.detail?.assetId;
                    const rating = e?.detail?.rating;
                    if (id == null) return;
                    for (const a of state.assets || []) {
                        if (a?.id != null && String(a.id) === String(id)) {
                            a.rating = rating;
                        }
                    }
                    try {
                        metadataHydrator?.deleteCached?.(id);
                    } catch (e) { console.debug?.(e); }
                    renderBadges();
                } catch (e) { console.debug?.(e); }
            };
            const onTagsSync = (e) => {
                try {
                    const id = e?.detail?.assetId;
                    const tags = e?.detail?.tags;
                    if (id == null) return;
                    for (const a of state.assets || []) {
                        if (a?.id != null && String(a.id) === String(id)) {
                            a.tags = tags;
                        }
                    }
                    try {
                        metadataHydrator?.deleteCached?.(id);
                    } catch (e) { console.debug?.(e); }
                    renderBadges();
                } catch (e) { console.debug?.(e); }
            };
            lifecycleUnsubs.push(safeAddListener(window, ASSET_RATING_CHANGED_EVENT, onRatingSync, { passive: true }));
            lifecycleUnsubs.push(safeAddListener(window, ASSET_TAGS_CHANGED_EVENT, onTagsSync, { passive: true }));
            overlay._mjrBadgeSyncBound = true;
        }
    } catch (e) { console.debug?.(e); }

    function closeViewer() {
        try {
            metadataHydrator?.abort?.();
        } catch (e) { console.debug?.(e); }
        try {
            destroyPlayerBar();
        } catch (e) { console.debug?.(e); }
        try {
            state._scopesVideoAbort?.abort?.();
        } catch (e) { console.debug?.(e); }
        state._scopesVideoAbort = null;
        // Clear any pending hint timers (avoid callbacks after close/dispose).
        try {
            if (state._panHintTimer) clearTimeout(state._panHintTimer);
        } catch (e) { console.debug?.(e); }
        state._panHintTimer = null;
        try {
            state._panHintAt = 0;
        } catch (e) { console.debug?.(e); }

        // Abort compare-mode background work (sync listeners, diff loops).
        try {
            abView?._mjrSyncAbort?.abort?.();
        } catch (e) { console.debug?.(e); }
        try {
            abView?._mjrDiffAbort?.abort?.();
        } catch (e) { console.debug?.(e); }
        try {
            abView._mjrSyncAbort = null;
        } catch (e) { console.debug?.(e); }
        try {
            abView._mjrDiffAbort = null;
        } catch (e) { console.debug?.(e); }
        try {
            sideView?._mjrSyncAbort?.abort?.();
        } catch (e) { console.debug?.(e); }
        try {
            sideView._mjrSyncAbort = null;
        } catch (e) { console.debug?.(e); }
        try {
            abView?._mjrSliderAbort?.abort?.();
        } catch (e) { console.debug?.(e); }
        try {
            abView._mjrSliderAbort = null;
        } catch (e) { console.debug?.(e); }
        // Ensure media playback is fully stopped when closing the overlay.
        // Hiding the overlay alone does not stop HTMLMediaElement audio in all browsers.
        try {
            const mediaEls = overlay.querySelectorAll?.("video, audio");
            if (mediaEls && mediaEls.length) {
                for (const el of mediaEls) {
                    try {
                        el.muted = true;
                    } catch (e) { console.debug?.(e); }
                    try {
                        el.pause?.();
                    } catch (e) { console.debug?.(e); }
                    try {
                        el.currentTime = 0;
                    } catch (e) { console.debug?.(e); }
                    try {
                        // Remove all <source> children (if any) and unload the element.
                        const sources = el.querySelectorAll?.("source");
                        if (sources && sources.length) {
                            for (const s of sources) {
                                try {
                                    s.remove();
                                } catch (e) { console.debug?.(e); }
                            }
                        }
                    } catch (e) { console.debug?.(e); }
                    try {
                        el.removeAttribute?.("src");
                    } catch (e) { console.debug?.(e); }
                    try {
                        // Some browsers keep playing unless we force a reload after removing src.
                        el.load?.();
                    } catch (e) { console.debug?.(e); }
                }
            }
        } catch (e) { console.debug?.(e); }

        // Free DOM resources (and ensure playback stops even if `pause()` was ignored).
        try {
            destroyMediaProcessorsIn(singleView);
            singleView.innerHTML = "";
        } catch (e) { console.debug?.(e); }
        try {
            destroyMediaProcessorsIn(abView);
            abView.innerHTML = "";
        } catch (e) { console.debug?.(e); }
        try {
            destroyMediaProcessorsIn(sideView);
            sideView.innerHTML = "";
        } catch (e) { console.debug?.(e); }

        try {
            state.genInfoOpen = false;
        } catch (e) { console.debug?.(e); }
        try {
            stopGenInfoFetch();
        } catch (e) { console.debug?.(e); }
        try {
            genInfoOverlay.style.display = "none";
            genInfoBody.innerHTML = "";
        } catch (e) { console.debug?.(e); }
        try {
            genInfoOverlayLeft.style.display = "none";
            genInfoBodyLeft.innerHTML = "";
        } catch (e) { console.debug?.(e); }

        overlay.style.display = 'none';
        disposeOpenListeners();
        try {
            document.body.style.overflow = state._prevBodyOverflow ?? '';
        } catch {
            document.body.style.overflow = '';
        }

        // FIX: Restore focus to previously focused element for accessibility
        try {
            if (state._prevFocusedElement && typeof state._prevFocusedElement.focus === 'function') {
                state._prevFocusedElement.focus();
            }
            state._prevFocusedElement = null;
        } catch (e) { console.debug?.(e); }

        // Restore previous hotkeys scope if available.
        const prevScope = state?._prevHotkeyScope;
        setHotkeysScope(prevScope || "panel");
        state._prevHotkeyScope = null;
    }

    // Public API
    const api = {
        open(assets, startIndex = 0, compareAsset = null) {
            bindOpenListeners();
            state.assets = Array.isArray(assets) ? assets : [assets];
            state.currentIndex = Math.max(0, Math.min(startIndex, state.assets.length - 1));
            // Rebuild the filmstrip thumbnail strip for the new asset list.
            try { filmstrip.rebuild(); } catch (e) { console.debug?.(e); }
            state.zoom = 1;
            state.panX = 0;
            state.panY = 0;
            state.targetZoom = 1;
            state._userInteracted = false;
            state._panHintAt = 0;
            try {
                if (state._panHintTimer) clearTimeout(state._panHintTimer);
            } catch (e) { console.debug?.(e); }
            state._panHintTimer = null;
            state._lastPointerX = null;
            state._lastPointerY = null;
            state._mediaW = 0;
            state._mediaH = 0;
            state.compareAsset = compareAsset;
            state.gridMode = 0;
            stopGenInfoFetch();
            state._probe = null;
            try {
                probeTooltip.style.display = "none";
            } catch (e) { console.debug?.(e); }
            try {
                loupeWrap.style.display = "none";
            } catch (e) { console.debug?.(e); }

            overlay.style.display = 'flex';

            // FIX: Store previously focused element and set focus to overlay for accessibility
            try {
                state._prevFocusedElement = document.activeElement;
            } catch {
                state._prevFocusedElement = null;
            }

            // Focus the overlay so screen readers announce it as a dialog
            overlay.focus();

            try {
                state._prevBodyOverflow = document.body.style.overflow;
            } catch {
                state._prevBodyOverflow = '';
            }
            document.body.style.overflow = 'hidden';

            // Set hotkeys scope to viewer (takes priority over panel)
            state._prevHotkeyScope = getHotkeysState().scope || null;
            setHotkeysScope("viewer");

            updateUI();
            try {
                syncToolsUIFromState();
            } catch (e) { console.debug?.(e); }
            try {
                scheduleApplyGrade();
            } catch (e) { console.debug?.(e); }
            scheduleOverlayRedraw();
            // No animation loop needed - transforms are applied directly
        },

        close() {
            closeViewer();
            // No animation loop to stop
        },

        setMode(mode) {
            if (Object.values(VIEWER_MODES).includes(mode)) {
                state.mode = mode;
                updateUI();
            }
        },

        setCompareAsset(asset) {
            state.compareAsset = asset;
            updateUI();
        },

        dispose() {
            // Best-effort: never throw to UI.
            try {
                closeViewer();
            } catch (e) { console.debug?.(e); }
            try {
                _viewerInfoCache.clear();
            } catch (e) { console.debug?.(e); }

            try {
                destroyMediaProcessorsIn(singleView);
            } catch (e) { console.debug?.(e); }
            try {
                destroyMediaProcessorsIn(abView);
            } catch (e) { console.debug?.(e); }
            try {
                destroyMediaProcessorsIn(sideView);
            } catch (e) { console.debug?.(e); }

            try {
                if (_overlayRAF != null) cancelAnimationFrame(_overlayRAF);
            } catch (e) { console.debug?.(e); }
            try {
                if (_gradeRAF != null) cancelAnimationFrame(_gradeRAF);
            } catch (e) { console.debug?.(e); }
            try {
                probe?.dispose?.();
            } catch (e) { console.debug?.(e); }
            try {
                keyboard?.dispose?.();
            } catch (e) { console.debug?.(e); }

            try {
                overlay._mjrResizeObserver?.disconnect?.();
            } catch (e) { console.debug?.(e); }
            try {
                overlay._mjrResizeObserver = null;
            } catch (e) { console.debug?.(e); }
            try {
                metadataHydrator?.dispose?.();
            } catch (e) { console.debug?.(e); }

            try {
                for (const u of overlay._mjrViewerUnsubs || []) safeCall(u);
            } catch (e) { console.debug?.(e); }
            try {
                overlay._mjrViewerUnsubs = [];
            } catch (e) { console.debug?.(e); }
            try {
                state._preloadRefs?.clear?.();
            } catch (e) { console.debug?.(e); }
            try {
                state._preloadedAssetKeys?.clear?.();
            } catch (e) { console.debug?.(e); }

            try {
                overlay.remove?.();
            } catch (e) { console.debug?.(e); }
        }
    };

    // Upgrade the toolbar close button to a full dispose once API is available.
    try {
        _requestCloseFromButton = () => api.dispose();
    } catch (e) { console.debug?.(e); }

    overlay._mjrViewerAPI = api;

    // Right-click context menu (viewer): tags/rating/open-in-folder/copy path.
    try {
        bindViewerContextMenu({
            overlayEl: overlay,
            getCurrentAsset: () => state.assets[state.currentIndex],
            getCurrentViewUrl: (asset) => buildAssetViewURL(asset),
            onAssetChanged: () => {
                try {
                    renderBadges();
                } catch (e) { console.debug?.(e); }
            },
        });
    } catch (e) { console.debug?.(e); }

    return overlay;
}

/**
 * Helper to create icon button
 */


/**
 * Get or create global viewer instance
 */
export function getViewerInstance() {
    return _getViewerInstance(createViewer);
}
