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
      this._pinnedSlot = pinnedSlot;
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
      this.loadPreviewBlob = vi.fn();
      lastViewer = this;
    }

    render() {
      return { nodeName: "DIV" };
    }

    get isPopped() {
      return this._isPopped;
    }

    getPinnedSlot() {
      return this._pinnedSlot;
    }

    popOut = vi.fn(() => {
      this._isPopped = true;
    })

    popIn = vi.fn(() => {
      this._isPopped = false;
    })

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

vi.mock("../features/panel/AssetsManagerPanel.js", () => ({
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

async function flushAsyncWork() {
  await Promise.resolve();
  await Promise.resolve();
}

beforeEach(() => {
  vi.resetModules();
  state.reset();
  globalThis.window = createWindowStub();
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

    const { floatingViewerManager } = await import("../features/viewer/floatingViewerManager.js");
    floatingViewerManager.open();
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

    const { floatingViewerManager } = await import("../features/viewer/floatingViewerManager.js");
    floatingViewerManager.open();
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

    const { floatingViewerManager } = await import("../features/viewer/floatingViewerManager.js");
    floatingViewerManager.open();

    const viewer = state.getLastViewer();
    viewer._mediaA = { id: 9001, filename: "reference-a.png" };

    window.dispatchEvent(new CustomEvent("mjr:selection-changed", {
      detail: { selectedIds: ["202"] },
    }));
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

    const { floatingViewerManager } = await import("../features/viewer/floatingViewerManager.js");
    floatingViewerManager.open();

    const viewer = state.getLastViewer();
    viewer._mediaB = { id: 9002, filename: "reference-b.png" };

    window.dispatchEvent(new CustomEvent("mjr:selection-changed", {
      detail: { selectedIds: ["301"] },
    }));
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

    const { floatingViewerManager } = await import("../features/viewer/floatingViewerManager.js");
    floatingViewerManager.open();

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

    const { floatingViewerManager } = await import("../features/viewer/floatingViewerManager.js");
    floatingViewerManager.setLiveActive(true);
    floatingViewerManager.upsertWithContent({ filename: "live-output.png", type: "output" });

    const viewer = state.getLastViewer();
    expect(viewer).toBeTruthy();
    expect(viewer.isVisible).toBe(true);
    expect(viewer.setLiveActive).toHaveBeenLastCalledWith(true);
    expect(viewer.setPreviewActive).toHaveBeenLastCalledWith(false);
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

    const { floatingViewerManager } = await import("../features/viewer/floatingViewerManager.js");
    floatingViewerManager.setPreviewActive(true);
    floatingViewerManager.feedPreviewBlob(blob);

    const viewer = state.getLastViewer();
    expect(viewer).toBeTruthy();
    expect(viewer.isVisible).toBe(true);
    expect(viewer.setLiveActive).toHaveBeenLastCalledWith(false);
    expect(viewer.setPreviewActive).toHaveBeenLastCalledWith(true);
    expect(viewer.loadPreviewBlob).toHaveBeenCalledWith(blob);
    expect(seen).toEqual([true]);
  });

  it("toggles live stream with L while the floating viewer is visible", async () => {
    const { floatingViewerManager } = await import("../features/viewer/floatingViewerManager.js");
    floatingViewerManager.open();

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

    expect(viewer.setLiveActive).toHaveBeenLastCalledWith(true);
    expect(floatingViewerManager.getLiveActive()).toBe(true);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it("toggles the floating viewer off with V while it is visible", async () => {
    const { floatingViewerManager } = await import("../features/viewer/floatingViewerManager.js");
    floatingViewerManager.open();

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

  it("toggles sampler preview with K while the floating viewer is visible", async () => {
    const { floatingViewerManager } = await import("../features/viewer/floatingViewerManager.js");
    floatingViewerManager.open();

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

    expect(viewer.setPreviewActive).toHaveBeenLastCalledWith(true);
    expect(floatingViewerManager.getPreviewActive()).toBe(true);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
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

    const { floatingViewerManager } = await import("../features/viewer/floatingViewerManager.js");
    floatingViewerManager.open();
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

    expect(viewer.setMode).toHaveBeenLastCalledWith("simple");
    expect(viewer.hide).not.toHaveBeenCalled();
    expect(viewer.isVisible).toBe(true);
    expect(toOffEvent.preventDefault).toHaveBeenCalledTimes(1);
  });
});
