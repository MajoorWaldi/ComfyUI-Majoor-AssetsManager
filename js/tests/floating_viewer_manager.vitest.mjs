import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => {
    const MFV_MODES = {
        SIMPLE: "simple",
        AB: "ab",
        SIDE: "side",
    };

    let viewerMode = MFV_MODES.SIMPLE;
    let lastViewer = null;
    let activeGrid = null;
    let pinnedSlot = null;
    let viewerPopped = false;

    const getAssetsBatchMock = vi.fn();
    const getSelectedIdSetMock = vi.fn();
    const reportErrorMock = vi.fn();

    class FloatingViewerMock {
        constructor() {
            this._mode = viewerMode;
            this._mediaA = null;
            this._mediaB = null;
            this._pinnedSlots =
                typeof pinnedSlot === "object" && pinnedSlot instanceof Set
                    ? pinnedSlot
                    : pinnedSlot
                      ? new Set([pinnedSlot])
                      : new Set();
            this._isPopped = viewerPopped;
            this.isVisible = false;
            this.show = vi.fn(() => {
                this.isVisible = true;
            });
            this.hide = vi.fn(() => {
                this.isVisible = false;
            });
            this.loadMediaA = vi.fn((asset, opts) => {
                this._mediaA = asset;
                this._lastLoadMediaA = [asset, opts];
            });
            this.loadMediaPair = vi.fn((assetA, assetB) => {
                this._mediaA = assetA;
                this._mediaB = assetB;
                this._lastLoadMediaPair = [assetA, assetB];
            });
            this.setMode = vi.fn((mode) => {
                this._mode = mode;
            });
            this.setLiveActive = vi.fn();
            this.setPreviewActive = vi.fn();
            this.setNodeStreamActive = vi.fn();
            this.loadPreviewBlob = vi.fn();
            this.dispose = vi.fn(() => {
                this.isVisible = false;
            });
            lastViewer = this;
        }

        render() {
            return { nodeName: "DIV" };
        }

        get isPopped() {
            return this._isPopped;
        }

        getPinnedSlots() {
            return this._pinnedSlots;
        }

        popOut = vi.fn(() => {
            this._isPopped = true;
        });

        popIn = vi.fn(() => {
            this._isPopped = false;
        });
    }

    return {
        MFV_MODES,
        FloatingViewerMock,
        getAssetsBatchMock,
        getSelectedIdSetMock,
        reportErrorMock,
        getActiveGridContainer() {
            return activeGrid;
        },
        reset() {
            viewerMode = MFV_MODES.SIMPLE;
            lastViewer = null;
            activeGrid = null;
            pinnedSlot = null;
            viewerPopped = false;
            getAssetsBatchMock.mockReset();
            getSelectedIdSetMock.mockReset();
            reportErrorMock.mockReset();
        },
        setActiveGrid(grid) {
            activeGrid = grid;
        },
        setViewerMode(mode) {
            viewerMode = mode;
        },
        setPinnedSlot(slot) {
            pinnedSlot = slot || null;
        },
        setViewerPopped(popped) {
            viewerPopped = Boolean(popped);
        },
        getLastViewer() {
            return lastViewer;
        },
    };
});

vi.mock("../features/viewer/FloatingViewer.js", () => ({
    FloatingViewer: state.FloatingViewerMock,
    MFV_MODES: state.MFV_MODES,
}));

vi.mock("../api/client.js", () => ({
    getAssetsBatch: state.getAssetsBatchMock,
}));

vi.mock("../features/panel/panelRuntimeRefs.js", () => ({
    getActiveGridContainer: () => state.getActiveGridContainer(),
}));

vi.mock("../features/grid/GridSelectionManager.js", () => ({
    getSelectedIdSet: state.getSelectedIdSetMock,
}));

vi.mock("../utils/logging.js", () => ({
    reportError: state.reportErrorMock,
}));

function createWindowStub() {
    const listeners = new Map();
    return {
        addEventListener(type, handler) {
            if (!listeners.has(type)) listeners.set(type, new Set());
            listeners.get(type).add(handler);
        },
        removeEventListener(type, handler) {
            listeners.get(type)?.delete(handler);
        },
        dispatchEvent(event) {
            const handlers = Array.from(listeners.get(event?.type) || []);
            for (const handler of handlers) {
                handler(event);
            }
            return true;
        },
    };
}

function createGrid(ids = []) {
    return {
        querySelectorAll() {
            return ids.map((id) => ({ dataset: { mjrAssetId: String(id) } }));
        },
    };
}

/**
 * Drain the microtask queue so fire-and-forget async work (e.g. _loadFromIds
 * triggered by _syncCurrentGridSelection inside open()) has time to complete.
 *
 * The dynamic import mock resolves in ~2 microticks, _getInstance needs ~2 more,
 * and _loadFromIds adds another ~2.  8 ticks provides comfortable headroom.
 */
async function flushAsyncWork() {
    for (let i = 0; i < 8; i++) {
        await Promise.resolve();
    }
}

beforeEach(() => {
    vi.resetModules();
    state.reset();
    globalThis.window = createWindowStub();
    globalThis.requestAnimationFrame = (cb) => {
        cb();
        return 1;
    };
    globalThis.cancelAnimationFrame = vi.fn();
    globalThis.document = {
        body: {
            appendChild: vi.fn(),
        },
    };
    globalThis.CustomEvent = class {
        constructor(type, init = {}) {
            this.type = type;
            this.detail = init.detail;
        }
    };
});

describe("floatingViewerManager", () => {
    it("loads the current selection when no pin is active", async () => {
        state.setActiveGrid(createGrid(["101"]));
        state.getSelectedIdSetMock.mockReturnValue(new Set(["101"]));
        state.getAssetsBatchMock.mockResolvedValue({
            ok: true,
            data: [{ id: 101, filename: "one.png" }],
        });

        const { floatingViewerManager } =
            await import("../features/viewer/floatingViewerManager.js");
        await floatingViewerManager.open();
        await flushAsyncWork();

        const viewer = state.getLastViewer();
        expect(viewer).toBeTruthy();
        expect(viewer.loadMediaA).toHaveBeenCalledWith(
            { id: 101, filename: "one.png" },
            { autoMode: true },
        );
        expect(state.reportErrorMock).not.toHaveBeenCalled();
    });

    it("keeps compare-mode fallback working when no pin is active", async () => {
        state.setViewerMode(state.MFV_MODES.AB);
        state.setActiveGrid(createGrid(["10", "11", "12"]));
        state.getSelectedIdSetMock.mockReturnValue(new Set(["11"]));
        state.getAssetsBatchMock.mockResolvedValue({
            ok: true,
            data: [
                { id: 11, filename: "left.png" },
                { id: 12, filename: "right.png" },
            ],
        });

        const { floatingViewerManager } =
            await import("../features/viewer/floatingViewerManager.js");
        await floatingViewerManager.open();
        await flushAsyncWork();

        const viewer = state.getLastViewer();
        expect(viewer.loadMediaPair).toHaveBeenCalledWith(
            { id: 11, filename: "left.png" },
            { id: 12, filename: "right.png" },
        );
        expect(state.getAssetsBatchMock).toHaveBeenCalledWith(
            ["11", "12"],
            expect.objectContaining({ signal: expect.any(Object) }),
        );
        expect(state.reportErrorMock).not.toHaveBeenCalled();
    });

    it("preserves pinned slot A and updates slot B from new selections", async () => {
        state.setViewerMode(state.MFV_MODES.AB);
        state.setPinnedSlot("A");
        state.setActiveGrid(createGrid(["201", "202"]));
        state.getSelectedIdSetMock.mockReturnValue(new Set());
        state.getAssetsBatchMock.mockResolvedValue({
            ok: true,
            data: [{ id: 202, filename: "candidate.png" }],
        });

        const { floatingViewerManager } =
            await import("../features/viewer/floatingViewerManager.js");
        await floatingViewerManager.open();

        const viewer = state.getLastViewer();
        viewer._mediaA = { id: 9001, filename: "reference-a.png" };

        window.dispatchEvent(
            new CustomEvent("mjr:selection-changed", {
                detail: { selectedIds: ["202"] },
            }),
        );
        await flushAsyncWork();

        expect(viewer.loadMediaPair).toHaveBeenCalledWith(
            { id: 9001, filename: "reference-a.png" },
            { id: 202, filename: "candidate.png" },
        );
        expect(state.getAssetsBatchMock).toHaveBeenCalledWith(
            ["202"],
            expect.objectContaining({ signal: expect.any(Object) }),
        );
    });

    it("preserves pinned slot B and updates slot A from new selections", async () => {
        state.setViewerMode(state.MFV_MODES.AB);
        state.setPinnedSlot("B");
        state.setActiveGrid(createGrid(["301", "302"]));
        state.getSelectedIdSetMock.mockReturnValue(new Set());
        state.getAssetsBatchMock.mockResolvedValue({
            ok: true,
            data: [{ id: 301, filename: "candidate-a.png" }],
        });

        const { floatingViewerManager } =
            await import("../features/viewer/floatingViewerManager.js");
        await floatingViewerManager.open();

        const viewer = state.getLastViewer();
        viewer._mediaB = { id: 9002, filename: "reference-b.png" };

        window.dispatchEvent(
            new CustomEvent("mjr:selection-changed", {
                detail: { selectedIds: ["301"] },
            }),
        );
        await flushAsyncWork();

        expect(viewer.loadMediaPair).toHaveBeenCalledWith(
            { id: 301, filename: "candidate-a.png" },
            { id: 9002, filename: "reference-b.png" },
        );
        expect(state.getAssetsBatchMock).toHaveBeenCalledWith(
            ["301"],
            expect.objectContaining({ signal: expect.any(Object) }),
        );
    });

    it("pops the viewer back in before closing when it is popped out", async () => {
        state.setViewerPopped(true);

        const { floatingViewerManager } =
            await import("../features/viewer/floatingViewerManager.js");
        await floatingViewerManager.open();

        const viewer = state.getLastViewer();
        expect(viewer.isVisible).toBe(true);
        expect(viewer.isPopped).toBe(true);

        floatingViewerManager.close();

        expect(viewer.popIn).toHaveBeenCalledTimes(1);
        expect(viewer.hide).toHaveBeenCalledTimes(1);
        expect(viewer.isVisible).toBe(false);
    });

    it("emits visibility and syncs control states when live stream auto-opens the viewer", async () => {
        const seen = [];
        window.addEventListener("mjr:mfv-visibility-changed", (event) => {
            seen.push(Boolean(event?.detail?.visible));
        });

        const { floatingViewerManager } =
            await import("../features/viewer/floatingViewerManager.js");
        floatingViewerManager.setLiveActive(true);
        await floatingViewerManager.upsertWithContent({
            filename: "live-output.png",
            type: "output",
        });

        const viewer = state.getLastViewer();
        expect(viewer).toBeTruthy();
        expect(viewer.isVisible).toBe(true);
        expect(viewer.setLiveActive).toHaveBeenLastCalledWith(true);
        expect(viewer.setPreviewActive).toHaveBeenLastCalledWith(true);
        expect(viewer.loadMediaA).toHaveBeenCalledWith(
            { filename: "live-output.png", type: "output" },
            { autoMode: true },
        );
        expect(seen).toEqual([true]);
    });

    it("emits visibility and syncs preview state when preview stream auto-opens the viewer", async () => {
        const seen = [];
        const blob = { fake: "blob" };
        window.addEventListener("mjr:mfv-visibility-changed", (event) => {
            seen.push(Boolean(event?.detail?.visible));
        });

        const { floatingViewerManager } =
            await import("../features/viewer/floatingViewerManager.js");
        floatingViewerManager.setPreviewActive(true);
        await floatingViewerManager.feedPreviewBlob(blob);

        const viewer = state.getLastViewer();
        expect(viewer).toBeTruthy();
        expect(viewer.isVisible).toBe(true);
        expect(viewer.setLiveActive).toHaveBeenLastCalledWith(true);
        expect(viewer.setPreviewActive).toHaveBeenLastCalledWith(true);
        expect(viewer.loadPreviewBlob).toHaveBeenCalledWith(blob);
        expect(seen).toEqual([true]);
    });

    it("toggles live stream with L while the floating viewer is visible", async () => {
        const { floatingViewerManager, installFloatingViewerGlobalHandlers } =
            await import("../features/viewer/floatingViewerManager.js");
        installFloatingViewerGlobalHandlers();
        await floatingViewerManager.open();

        const viewer = state.getLastViewer();
        const event = {
            type: "keydown",
            key: "l",
            ctrlKey: false,
            metaKey: false,
            altKey: false,
            shiftKey: false,
            preventDefault: vi.fn(),
            stopPropagation: vi.fn(),
            stopImmediatePropagation: vi.fn(),
        };
        window.dispatchEvent(event);

        expect(viewer.setLiveActive).toHaveBeenLastCalledWith(false);
        expect(floatingViewerManager.getLiveActive()).toBe(false);
        expect(event.preventDefault).toHaveBeenCalledTimes(1);
    });

    it("toggles the floating viewer off with V while it is visible", async () => {
        const { floatingViewerManager, installFloatingViewerGlobalHandlers } =
            await import("../features/viewer/floatingViewerManager.js");
        installFloatingViewerGlobalHandlers();
        await floatingViewerManager.open();

        const viewer = state.getLastViewer();
        expect(viewer.isVisible).toBe(true);

        const event = {
            type: "keydown",
            key: "v",
            ctrlKey: false,
            metaKey: false,
            altKey: false,
            shiftKey: false,
            preventDefault: vi.fn(),
            stopPropagation: vi.fn(),
            stopImmediatePropagation: vi.fn(),
        };
        window.dispatchEvent(event);

        expect(viewer.hide).toHaveBeenCalledTimes(1);
        expect(viewer.isVisible).toBe(false);
        expect(event.preventDefault).toHaveBeenCalledTimes(1);
    });

    it("reinstalls global listeners after teardown so toggle can open a new viewer again", async () => {
        const {
            floatingViewerManager,
            installFloatingViewerGlobalHandlers,
            teardownFloatingViewerManager,
        } = await import("../features/viewer/floatingViewerManager.js");
        installFloatingViewerGlobalHandlers();
        await floatingViewerManager.open();

        const firstViewer = state.getLastViewer();
        expect(firstViewer).toBeTruthy();

        teardownFloatingViewerManager({ reinstallGlobalHandlers: true });
        expect(firstViewer.dispose).toHaveBeenCalledTimes(1);

        window.dispatchEvent(new CustomEvent("mjr:mfv-toggle"));
        await flushAsyncWork();

        const secondViewer = state.getLastViewer();
        expect(secondViewer).toBeTruthy();
        expect(secondViewer).not.toBe(firstViewer);
        expect(secondViewer.isVisible).toBe(true);
    });

    it("toggles sampler preview with K while the floating viewer is visible", async () => {
        const { floatingViewerManager, installFloatingViewerGlobalHandlers } =
            await import("../features/viewer/floatingViewerManager.js");
        installFloatingViewerGlobalHandlers();
        await floatingViewerManager.open();

        const viewer = state.getLastViewer();
        const event = {
            type: "keydown",
            key: "k",
            ctrlKey: false,
            metaKey: false,
            altKey: false,
            shiftKey: false,
            preventDefault: vi.fn(),
            stopPropagation: vi.fn(),
            stopImmediatePropagation: vi.fn(),
        };
        window.dispatchEvent(event);

        expect(viewer.setPreviewActive).toHaveBeenLastCalledWith(false);
        expect(floatingViewerManager.getPreviewActive()).toBe(false);
        expect(event.preventDefault).toHaveBeenCalledTimes(1);
    });

    it("syncs live and preview defaults when viewer settings change", async () => {
        const { APP_CONFIG } = await import("../app/config.js");
        APP_CONFIG.MFV_LIVE_DEFAULT = true;
        APP_CONFIG.MFV_PREVIEW_DEFAULT = true;

        const { floatingViewerManager, installFloatingViewerGlobalHandlers } =
            await import("../features/viewer/floatingViewerManager.js");
        installFloatingViewerGlobalHandlers();
        await floatingViewerManager.open();

        const viewer = state.getLastViewer();
        expect(floatingViewerManager.getLiveActive()).toBe(true);
        expect(floatingViewerManager.getPreviewActive()).toBe(true);

        APP_CONFIG.MFV_LIVE_DEFAULT = false;
        APP_CONFIG.MFV_PREVIEW_DEFAULT = false;
        window.dispatchEvent(
            new CustomEvent("mjr-settings-changed", { detail: { key: "viewer.mfvLiveDefault" } }),
        );
        window.dispatchEvent(
            new CustomEvent("mjr-settings-changed", {
                detail: { key: "viewer.mfvPreviewDefault" },
            }),
        );

        expect(viewer.setLiveActive).toHaveBeenLastCalledWith(false);
        expect(viewer.setPreviewActive).toHaveBeenLastCalledWith(false);
        expect(floatingViewerManager.getLiveActive()).toBe(false);
        expect(floatingViewerManager.getPreviewActive()).toBe(false);
    });

    it("re-attaches an existing detached MFV node on reopen", async () => {
        const { floatingViewerManager } =
            await import("../features/viewer/floatingViewerManager.js");

        await floatingViewerManager.open();
        const viewer = state.getLastViewer();
        expect(viewer).toBeTruthy();

        floatingViewerManager.close();

        const callsBefore = document.body.appendChild.mock.calls.length;
        viewer.element = { isConnected: false };

        await floatingViewerManager.open();
        await flushAsyncWork();

        expect(state.getLastViewer()).toBe(viewer);
        expect(document.body.appendChild.mock.calls.length).toBeGreaterThan(callsBefore);
    });

    it("cycles compare modes with C as A/B, side-by-side, then compare off without closing", async () => {
        state.setActiveGrid(createGrid(["410", "411"]));
        state.getSelectedIdSetMock.mockReturnValue(new Set(["410"]));
        state.getAssetsBatchMock.mockResolvedValue({
            ok: true,
            data: [
                { id: 410, filename: "left.png" },
                { id: 411, filename: "right.png" },
            ],
        });

        const { floatingViewerManager, installFloatingViewerGlobalHandlers } =
            await import("../features/viewer/floatingViewerManager.js");
        installFloatingViewerGlobalHandlers();
        await floatingViewerManager.open();
        await flushAsyncWork();

        const viewer = state.getLastViewer();
        const toCompareEvent = {
            type: "keydown",
            key: "c",
            ctrlKey: false,
            metaKey: false,
            altKey: false,
            shiftKey: false,
            preventDefault: vi.fn(),
            stopPropagation: vi.fn(),
            stopImmediatePropagation: vi.fn(),
        };
        window.dispatchEvent(toCompareEvent);
        await flushAsyncWork();

        expect(viewer.setMode).toHaveBeenLastCalledWith("ab");
        expect(viewer.loadMediaPair).toHaveBeenCalledWith(
            { id: 410, filename: "left.png" },
            { id: 411, filename: "right.png" },
        );

        const toSimpleEvent = {
            type: "keydown",
            key: "c",
            ctrlKey: false,
            metaKey: false,
            altKey: false,
            shiftKey: false,
            preventDefault: vi.fn(),
            stopPropagation: vi.fn(),
            stopImmediatePropagation: vi.fn(),
        };
        window.dispatchEvent(toSimpleEvent);
        await flushAsyncWork();

        expect(viewer.setMode).toHaveBeenLastCalledWith("side");
        expect(toSimpleEvent.preventDefault).toHaveBeenCalledTimes(1);

        const toOffEvent = {
            type: "keydown",
            key: "c",
            ctrlKey: false,
            metaKey: false,
            altKey: false,
            shiftKey: false,
            preventDefault: vi.fn(),
            stopPropagation: vi.fn(),
            stopImmediatePropagation: vi.fn(),
        };
        window.dispatchEvent(toOffEvent);
        await flushAsyncWork();

        expect(viewer.setMode).toHaveBeenLastCalledWith("simple");
        expect(viewer.hide).not.toHaveBeenCalled();
        expect(viewer.isVisible).toBe(true);
        expect(toOffEvent.preventDefault).toHaveBeenCalledTimes(1);
    });
});
