import { beforeEach, describe, expect, it, vi } from "vitest";

const comfyToastMock = vi.fn();

vi.mock("../app/i18n.js", () => ({
    t: (_key, fallback) => fallback,
}));

vi.mock("../app/toast.js", () => ({
    comfyToast: comfyToastMock,
}));

vi.mock("../app/events.js", () => ({
    EVENTS: {},
}));

vi.mock("../api/endpoints.js", () => ({
    buildViewURL: vi.fn(() => ""),
    buildAssetViewURL: vi.fn(() => ""),
}));

vi.mock("../features/viewer/genInfo.js", () => ({
    ensureViewerMetadataAsset: vi.fn(async (asset) => asset),
}));

vi.mock("../api/client.js", () => ({
    getAssetMetadata: vi.fn(async () => ({})),
    getFileMetadataScoped: vi.fn(async () => ({})),
}));

vi.mock("../components/sidebar/parsers/geninfoParser.js", () => ({
    normalizeGenerationMetadata: vi.fn((meta) => meta),
}));

const installFollowerVideoSyncMock = vi.fn(() => ({ abort: vi.fn() }));

vi.mock("../features/viewer/videoSync.js", () => ({
    installFollowerVideoSync: installFollowerVideoSyncMock,
}));

describe("FloatingViewer", () => {
    beforeEach(() => {
        comfyToastMock.mockReset();
        globalThis.document = {
            adoptNode: vi.fn((node) => node),
            body: {
                appendChild: vi.fn(),
            },
            createElement: vi.fn(() => ({
                className: "",
                setAttribute: vi.fn(),
                appendChild: vi.fn(),
                replaceChildren: vi.fn(),
            })),
        };
    });

    it("rebinds panel interactions when popping back into the main document", async () => {
        const { FloatingViewer } = await import("../features/viewer/FloatingViewer.js");

        const popup = {
            removeEventListener: vi.fn(),
            close: vi.fn(),
        };
        const element = {
            ownerDocument: { name: "popup-doc" },
            classList: {
                add: vi.fn(),
            },
            setAttribute: vi.fn(),
        };
        // Create a real instance and patch necessary properties
        const viewer = new FloatingViewer();
        viewer._isPopped = true;
        viewer.element = element;
        viewer._popoutWindow = popup;
        viewer._clearPopoutCloseWatch = vi.fn();
        viewer._resetGenDropdownForCurrentDocument = vi.fn();
        viewer._bindPanelInteractions = vi.fn();
        viewer._bindDocumentUiHandlers = vi.fn();
        viewer._updatePopoutBtnUI = vi.fn();
        viewer.isVisible = false;

        // Mock the popout AbortController so we can spy on abort()
        const mockPopoutAC = { abort: vi.fn() };
        viewer._popoutAC = mockPopoutAC;

        // Spy on the prototype method
        const rebindSpy = vi.spyOn(FloatingViewer.prototype, "_rebindControlHandlers");

        viewer.popIn({ closePopupWindow: false });

        expect(document.adoptNode).toHaveBeenCalledWith(element);
        expect(document.body.appendChild).toHaveBeenCalledWith(element);
        expect(viewer._clearPopoutCloseWatch).toHaveBeenCalledTimes(1);
        // AbortController.abort() is called to remove popup listeners (not manual removeEventListener)
        expect(mockPopoutAC.abort).toHaveBeenCalledTimes(1);
        expect(viewer._resetGenDropdownForCurrentDocument).toHaveBeenCalledTimes(1);
        expect(rebindSpy).toHaveBeenCalledTimes(1);
        expect(viewer._bindPanelInteractions).toHaveBeenCalledTimes(1);
        expect(viewer._bindDocumentUiHandlers).toHaveBeenCalledTimes(1);
        expect(viewer._updatePopoutBtnUI).toHaveBeenCalledTimes(1);
        expect(element.classList.add).toHaveBeenCalledWith("is-visible");
        expect(element.setAttribute).toHaveBeenCalledWith("aria-hidden", "false");
        expect(viewer.isVisible).toBe(true);
        expect(viewer._isPopped).toBe(false);
        expect(viewer._popoutWindow).toBeNull();
        expect(popup.close).not.toHaveBeenCalled();
    });

    it("refreshes drag and resize bindings when interactions are rebound", async () => {
        const { FloatingViewer } = await import("../features/viewer/FloatingViewer.js");

        const oldController = {
            abort: vi.fn(),
        };
        const header = { nodeName: "HEADER" };
        const element = {
            querySelector: vi.fn(() => header),
        };
        const viewer = {
            element,
            _panelAC: oldController,
            _stopEdgeResize: vi.fn(),
            _initEdgeResize: vi.fn(),
            _initDrag: vi.fn(),
        };

        FloatingViewer.prototype._bindPanelInteractions.call(viewer);

        expect(viewer._stopEdgeResize).toHaveBeenCalledTimes(1);
        expect(oldController.abort).toHaveBeenCalledTimes(1);
        expect(viewer._panelAC).toBeInstanceOf(AbortController);
        expect(viewer._panelAC).not.toBe(oldController);
        expect(viewer._initEdgeResize).toHaveBeenCalledWith(element);
        expect(element.querySelector).toHaveBeenCalledWith(".mjr-mfv-header");
        expect(viewer._initDrag).toHaveBeenCalledWith(header);
    });

    it("rebinds toolbar and header controls with a fresh abort controller", async () => {
        const { FloatingViewer } = await import("../features/viewer/FloatingViewer.js");

        const oldController = {
            abort: vi.fn(),
        };
        const closeBtn = { addEventListener: vi.fn() };
        const modeBtn = { addEventListener: vi.fn() };
        const pinSelect = { addEventListener: vi.fn() };
        const liveBtn = { addEventListener: vi.fn() };
        const previewBtn = { addEventListener: vi.fn() };
        const genBtn = { addEventListener: vi.fn() };
        const popoutBtn = { addEventListener: vi.fn() };
        const captureBtn = { addEventListener: vi.fn() };
        const viewer = {
            _btnAC: oldController,
            _closeBtn: closeBtn,
            _modeBtn: modeBtn,
            _pinSelect: pinSelect,
            _liveBtn: liveBtn,
            _previewBtn: previewBtn,
            _genBtn: genBtn,
            _popoutBtn: popoutBtn,
            _captureBtn: captureBtn,
            _genDropdown: null,
            _pinnedSlot: null,
            _mode: "simple",
            _cycleMode: vi.fn(),
            _updatePinSelectUI: vi.fn(),
            _closeGenDropdown: vi.fn(),
            _openGenDropdown: vi.fn(),
            _captureView: vi.fn(),
            setMode: vi.fn(),
        };

        FloatingViewer.prototype._rebindControlHandlers.call(viewer);

        expect(oldController.abort).toHaveBeenCalledTimes(1);
        expect(viewer._btnAC).toBeInstanceOf(AbortController);
        expect(closeBtn.addEventListener).toHaveBeenCalledWith(
            "click",
            expect.any(Function),
            expect.objectContaining({ signal: viewer._btnAC.signal }),
        );
        expect(modeBtn.addEventListener).toHaveBeenCalledWith(
            "click",
            expect.any(Function),
            expect.objectContaining({ signal: viewer._btnAC.signal }),
        );
        expect(pinSelect.addEventListener).toHaveBeenCalledWith(
            "change",
            expect.any(Function),
            expect.objectContaining({ signal: viewer._btnAC.signal }),
        );
        expect(liveBtn.addEventListener).toHaveBeenCalledWith(
            "click",
            expect.any(Function),
            expect.objectContaining({ signal: viewer._btnAC.signal }),
        );
        expect(previewBtn.addEventListener).toHaveBeenCalledWith(
            "click",
            expect.any(Function),
            expect.objectContaining({ signal: viewer._btnAC.signal }),
        );
        expect(genBtn.addEventListener).toHaveBeenCalledWith(
            "click",
            expect.any(Function),
            expect.objectContaining({ signal: viewer._btnAC.signal }),
        );
        expect(popoutBtn.addEventListener).toHaveBeenCalledWith(
            "click",
            expect.any(Function),
            expect.objectContaining({ signal: viewer._btnAC.signal }),
        );
        expect(captureBtn.addEventListener).toHaveBeenCalledWith(
            "click",
            expect.any(Function),
            expect.objectContaining({ signal: viewer._btnAC.signal }),
        );
    });

    it("does not hijack wheel scrolling inside scrollable overlay content", async () => {
        const { FloatingViewer } = await import("../features/viewer/FloatingViewer.js");

        const wheelHandlers = [];
        const contentEl = {
            addEventListener: vi.fn((type, handler) => {
                if (type === "wheel") wheelHandlers.push(handler);
            }),
        };
        const scrollableOverlay = {
            scrollTop: 20,
            scrollHeight: 200,
            clientHeight: 100,
            scrollLeft: 0,
            scrollWidth: 100,
            clientWidth: 100,
            parentElement: null,
        };
        const target = {
            nodeType: 1,
            parentElement: scrollableOverlay,
            closest: vi.fn(() => null),
        };
        const viewer = {
            _zoom: 1,
            _destroyPanZoom: vi.fn(),
            _setMfvZoom: vi.fn(),
        };

        const originalGetComputedStyle = globalThis.window?.getComputedStyle;
        globalThis.window = {
            ...(globalThis.window || {}),
            getComputedStyle: vi.fn((element) => {
                if (element === scrollableOverlay) {
                    return { overflowY: "auto", overflowX: "hidden" };
                }
                return { overflowY: "visible", overflowX: "visible" };
            }),
        };

        try {
            FloatingViewer.prototype._initPanZoom.call(viewer, contentEl);
            expect(wheelHandlers).toHaveLength(1);

            const preventDefault = vi.fn();
            wheelHandlers[0]({
                target,
                deltaY: 30,
                deltaX: 0,
                preventDefault,
                clientX: 10,
                clientY: 10,
            });

            expect(preventDefault).not.toHaveBeenCalled();
            expect(viewer._setMfvZoom).not.toHaveBeenCalled();
        } finally {
            if (originalGetComputedStyle) {
                globalThis.window.getComputedStyle = originalGetComputedStyle;
            }
        }
    });

    it("includes shortcut hints in MFV tooltips", async () => {
        const { FloatingViewer, MFV_MODES } = await import("../features/viewer/FloatingViewer.js");

        const modeBtn = {
            title: "",
            replaceChildren: vi.fn(),
            setAttribute: vi.fn(),
            removeAttribute: vi.fn(),
        };
        const liveBtn = {
            title: "",
            classList: { toggle: vi.fn() },
            replaceChildren: vi.fn(),
            setAttribute: vi.fn(),
        };
        const previewBtn = {
            title: "",
            classList: { toggle: vi.fn() },
            replaceChildren: vi.fn(),
            setAttribute: vi.fn(),
        };

        const viewer = {
            _mode: MFV_MODES.AB,
            _modeBtn: modeBtn,
            _liveBtn: liveBtn,
            _previewBtn: previewBtn,
            _previewActive: false,
            _revokePreviewBlob: vi.fn(),
        };

        FloatingViewer.prototype._updateModeBtnUI.call(viewer);
        FloatingViewer.prototype.setLiveActive.call(viewer, true);
        FloatingViewer.prototype.setPreviewActive.call(viewer, false);

        expect(modeBtn.title).toContain("(C)");
        expect(modeBtn.setAttribute).toHaveBeenCalledWith(
            "aria-label",
            expect.stringContaining("(C)"),
        );
        expect(liveBtn.title).toContain("(L)");
        expect(liveBtn.setAttribute).toHaveBeenCalledWith(
            "aria-label",
            expect.stringContaining("(L)"),
        );
        expect(previewBtn.title).toContain("(K)");
        expect(previewBtn.setAttribute).toHaveBeenCalledWith(
            "aria-label",
            expect.stringContaining("(K)"),
        );
    });

    it("uses about:blank popup in browser contexts even when Document PiP exists", async () => {
        const { FloatingViewer } = await import("../features/viewer/FloatingViewer.js");

        const requestWindow = vi.fn(() => Promise.resolve());
        globalThis.window = {
            documentPictureInPicture: { requestWindow },
            open: vi.fn(),
            navigator: { userAgent: "Mozilla/5.0 Code/1.113.0 Electron/39.8.3" },
            screenX: 0,
            screenLeft: 0,
            screenY: 0,
            screenTop: 0,
            outerWidth: 1280,
            outerHeight: 900,
        };

        const viewer = {
            _isPopped: false,
            element: { offsetWidth: 640, offsetHeight: 480 },
            _stopEdgeResize: vi.fn(),
            _fallbackPopout: vi.fn(),
        };

        FloatingViewer.prototype.popOut.call(viewer);

        expect(viewer._fallbackPopout).toHaveBeenCalledWith(viewer.element, 640, 480);
        expect(requestWindow).not.toHaveBeenCalled();
    });

    it("uses popup window first in Electron app contexts", async () => {
        const { FloatingViewer } = await import("../features/viewer/FloatingViewer.js");

        const requestWindow = vi.fn(() => new Promise(() => {}));
        globalThis.window = {
            documentPictureInPicture: { requestWindow },
            process: { versions: { electron: "39.8.3" } },
            open: vi.fn(),
            screenX: 0,
            screenLeft: 0,
            screenY: 0,
            screenTop: 0,
            outerWidth: 1280,
            outerHeight: 900,
        };

        const viewer = {
            _isPopped: false,
            element: { offsetWidth: 640, offsetHeight: 480 },
            _stopEdgeResize: vi.fn(),
            _tryElectronPopupFallback: vi.fn(() => true),
        };

        FloatingViewer.prototype.popOut.call(viewer);

        expect(viewer._tryElectronPopupFallback).toHaveBeenCalledWith(
            viewer.element,
            640,
            480,
            expect.any(Error),
        );
        expect(requestWindow).not.toHaveBeenCalled();
    });

    it("uses popup first for desktop Electron user agents even without exposed bridge", async () => {
        const { FloatingViewer } = await import("../features/viewer/FloatingViewer.js");

        const requestWindow = vi.fn(() => new Promise(() => {}));
        globalThis.window = {
            documentPictureInPicture: { requestWindow },
            navigator: { userAgent: "Mozilla/5.0 Electron/39.8.3 Safari/537.36" },
            open: vi.fn(),
            screenX: 0,
            screenLeft: 0,
            screenY: 0,
            screenTop: 0,
            outerWidth: 1280,
            outerHeight: 900,
        };

        const viewer = {
            _isPopped: false,
            element: { offsetWidth: 640, offsetHeight: 480 },
            _stopEdgeResize: vi.fn(),
            _tryElectronPopupFallback: vi.fn(() => true),
        };

        FloatingViewer.prototype.popOut.call(viewer);

        expect(viewer._tryElectronPopupFallback).toHaveBeenCalledWith(
            viewer.element,
            640,
            480,
            expect.any(Error),
        );
        expect(requestWindow).not.toHaveBeenCalled();
    });

    it("falls back in-app for desktop Electron when popup and PiP are unavailable", async () => {
        const { FloatingViewer } = await import("../features/viewer/FloatingViewer.js");

        globalThis.window = {
            navigator: { userAgent: "Mozilla/5.0 Electron/39.8.3 Safari/537.36" },
            open: vi.fn(),
            screenX: 0,
            screenLeft: 0,
            screenY: 0,
            screenTop: 0,
            outerWidth: 1280,
            outerHeight: 900,
        };

        const viewer = {
            _isPopped: false,
            _desktopExpanded: false,
            _desktopExpandRestore: null,
            _desktopPopoutUnsupported: false,
            element: { offsetWidth: 640, offsetHeight: 480 },
            _stopEdgeResize: vi.fn(),
            _fallbackPopout: vi.fn(),
            _resetGenDropdownForCurrentDocument: vi.fn(),
            _rebindControlHandlers: vi.fn(),
            _bindPanelInteractions: vi.fn(),
            _bindDocumentUiHandlers: vi.fn(),
            _updatePopoutBtnUI: vi.fn(),
            _setDesktopExpanded: FloatingViewer.prototype._setDesktopExpanded,
            _activateDesktopExpandedFallback: FloatingViewer.prototype._activateDesktopExpandedFallback,
            _tryElectronPopupFallback: FloatingViewer.prototype._tryElectronPopupFallback,
        };

        viewer.element.classList = { add: vi.fn(), remove: vi.fn(), toggle: vi.fn() };
        viewer.element.setAttribute = vi.fn();
        viewer.element.getAttribute = vi.fn(() => null);
        viewer.element.removeAttribute = vi.fn();
        viewer.element.style = {};
        viewer.element.parentNode = null;
        viewer.element.nextSibling = null;

        FloatingViewer.prototype.popOut.call(viewer);

        expect(viewer._fallbackPopout).toHaveBeenCalledWith(viewer.element, 640, 480);
        expect(viewer._desktopExpanded).toBe(true);
        expect(comfyToastMock).toHaveBeenCalledWith(
            "Desktop PiP is unavailable here. Viewer expanded inside the app instead.",
            "warning",
            4500,
        );
    });

    it("falls back to Document PiP when Desktop popup creation fails", async () => {
        const { FloatingViewer } = await import("../features/viewer/FloatingViewer.js");

        const requestWindow = vi.fn(() => new Promise(() => {}));
        globalThis.window = {
            documentPictureInPicture: { requestWindow },
            process: { versions: { electron: "39.8.3" } },
            open: vi.fn(() => null),
            screenX: 0,
            screenLeft: 0,
            screenY: 0,
            screenTop: 0,
            outerWidth: 1280,
            outerHeight: 900,
        };

        const viewer = {
            _isPopped: false,
            _popoutWindow: null,
            element: { offsetWidth: 640, offsetHeight: 480 },
            _stopEdgeResize: vi.fn(),
            _tryElectronPopupFallback: vi.fn(() => false),
        };

        FloatingViewer.prototype.popOut.call(viewer);

        expect(viewer._tryElectronPopupFallback).toHaveBeenCalledWith(
            viewer.element,
            640,
            480,
            expect.any(Error),
        );
        expect(requestWindow).toHaveBeenCalledWith({ width: 640, height: 480 });
    });

    it("installs follower sync for compare-mode playable media", async () => {
        const { FloatingViewer, MFV_MODES } = await import("../features/viewer/FloatingViewer.js");

        const leader = { nodeName: "VIDEO" };
        const follower = { nodeName: "VIDEO" };
        const viewer = {
            _mode: MFV_MODES.AB,
            _contentEl: {
                querySelectorAll: vi.fn(() => [leader, follower]),
            },
            _compareSyncAC: null,
            _destroyCompareSync: FloatingViewer.prototype._destroyCompareSync,
        };

        FloatingViewer.prototype._initCompareSync.call(viewer);

        expect(installFollowerVideoSyncMock).toHaveBeenCalledWith(leader, [follower], {
            threshold: 0.08,
        });
        expect(viewer._compareSyncAC).toBeTruthy();
    });

    it("tears down previous compare sync before reinitializing", async () => {
        const { FloatingViewer, MFV_MODES } = await import("../features/viewer/FloatingViewer.js");

        const abort = vi.fn();
        const viewer = {
            _mode: MFV_MODES.SIDE,
            _contentEl: {
                querySelectorAll: vi.fn(() => []),
            },
            _compareSyncAC: { abort },
            _destroyCompareSync: FloatingViewer.prototype._destroyCompareSync,
        };

        FloatingViewer.prototype._initCompareSync.call(viewer);

        expect(abort).toHaveBeenCalledTimes(1);
        expect(viewer._compareSyncAC).toBeNull();
    });

    it("enables autoplay for audio in MFV", async () => {
        const { FloatingViewer } = await import("../features/viewer/FloatingViewer.js");

        const play = vi.fn(() => Promise.resolve());
        const addEventListener = vi.fn();
        const appendChild = vi.fn();
        const audioEl = {
            className: "",
            src: "",
            controls: false,
            autoplay: false,
            preload: "",
            play,
            addEventListener,
        };
        const genericEl = () => ({
            className: "",
            textContent: "",
            setAttribute: vi.fn(),
            appendChild,
            replaceChildren: vi.fn(),
        });

        globalThis.document.createElement = vi.fn((tag) => {
            if (tag === "audio") return audioEl;
            return genericEl();
        });

        const viewer = new FloatingViewer();
        const _wrap = viewer.constructor ? null : null;
        const result = FloatingViewer.prototype._renderSimple.call({
            _mediaA: { kind: "audio", url: "http://example.test/audio.mp3", filename: "audio.mp3" },
            _contentEl: { appendChild: vi.fn() },
            _buildGenInfoDOM: vi.fn(),
        });

        expect(result).toBeUndefined();
        expect(audioEl.autoplay).toBe(true);
        expect(play).toHaveBeenCalled();
        expect(addEventListener).toHaveBeenCalledWith("loadedmetadata", expect.any(Function), {
            once: true,
        });
    });

    it("pauses playable media when the floating viewer is hidden", async () => {
        const { FloatingViewer } = await import("../features/viewer/FloatingViewer.js");

        const pauseA = vi.fn();
        const pauseB = vi.fn();
        const viewer = new FloatingViewer();
        viewer.element = {
            querySelectorAll: vi.fn(() => [{ pause: pauseA }, { pause: pauseB }]),
            classList: { remove: vi.fn() },
            setAttribute: vi.fn(),
        };
        viewer._destroyPanZoom = vi.fn();
        viewer._destroyCompareSync = vi.fn();
        viewer._stopEdgeResize = vi.fn();
        viewer._closeGenDropdown = vi.fn();
        viewer.isVisible = true;

        viewer.hide();

        expect(pauseA).toHaveBeenCalledTimes(1);
        expect(pauseB).toHaveBeenCalledTimes(1);
        expect(viewer.element.classList.remove).toHaveBeenCalledWith("is-visible");
        expect(viewer.element.setAttribute).toHaveBeenCalledWith("aria-hidden", "true");
        expect(viewer.isVisible).toBe(false);
    });
});
