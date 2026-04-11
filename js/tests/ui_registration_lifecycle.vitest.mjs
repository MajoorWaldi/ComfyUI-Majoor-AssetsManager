// @vitest-environment happy-dom
/**
 * Lifecycle contract tests for entryUiRegistration.js.
 *
 * These tests verify the ComfyUI render/destroy orchestration layer:
 *   - render() mounts the Vue app via mountKeepAlive — once
 *   - destroy() is intentionally a NO-OP (keepalive preserved across tab switches)
 *   - Full teardown (teardownAssetsSidebar, teardownGeneratedFeed, teardownGlobalRuntime)
 *     calls unmountKeepAlive exactly once and is idempotent
 *   - mountGlobalRuntime creates the fixed-position root element and is idempotent
 *   - isMajoorTrackableNode classifies node types correctly
 *   - consumeEarlyFetch returns null when nothing has been prefetched
 *
 * All Vue app components and heavy API dependencies are mocked so the tests
 * exercise only the orchestration logic, not Vue rendering or network calls.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── hoisted mock handles ──────────────────────────────────────────────────────
// vi.hoisted() ensures these are available when vi.mock() factory functions run.

const {
    mockMountKeepAlive,
    mockUnmountKeepAlive,
    mockRegisterSidebarTabCompat,
    mockRegisterBottomPanelTabCompat,
    mockGet,
} = vi.hoisted(() => ({
    mockMountKeepAlive: vi.fn(() => true),
    mockUnmountKeepAlive: vi.fn(),
    mockRegisterSidebarTabCompat: vi.fn((_app, def) => def),
    mockRegisterBottomPanelTabCompat: vi.fn((_app, def) => def),
    mockGet: vi.fn(() => Promise.resolve(null)),
}));

// ── module mocks ──────────────────────────────────────────────────────────────

vi.mock("../vue/createVueApp.js", () => ({
    mountKeepAlive: mockMountKeepAlive,
    unmountKeepAlive: mockUnmountKeepAlive,
    createMjrApp: vi.fn(),
}));

vi.mock("../app/comfyApiBridge.js", () => ({
    activateSidebarTabCompat: vi.fn(() => false),
    registerSidebarTabCompat: mockRegisterSidebarTabCompat,
    registerBottomPanelTabCompat: mockRegisterBottomPanelTabCompat,
    registerCommandCompat: vi.fn(() => true),
    registerKeybindingCompat: vi.fn(() => true),
    setComfyApp: vi.fn((app) => app),
    getComfyApp: vi.fn(() => null),
    getExtensionToastApi: vi.fn(() => null),
    getExtensionDialogApi: vi.fn(() => null),
    getExtensionManager: vi.fn(() => null),
    getSettingValue: vi.fn(() => null),
    getSettingsApi: vi.fn(() => null),
    waitForComfyApp: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("../api/client.js", () => ({
    get: mockGet,
    post: vi.fn(),
    patch: vi.fn(),
    del: vi.fn(),
}));

vi.mock("../api/endpoints.js", () => ({
    buildListURL: vi.fn(() => "/mjr/am/assets?q=*"),
}));

vi.mock("../app/bootstrap.js", () => ({
    runStartupWarmup: vi.fn(() => Promise.resolve()),
}));

vi.mock("../app/config.js", () => ({
    APP_CONFIG: { DEFAULT_PAGE_SIZE: 200 },
}));

vi.mock("../app/events.js", () => ({
    EVENTS: {
        OPEN_ASSETS_MANAGER: "mjr:open-assets-manager",
        RELOAD_GRID: "mjr:reload-grid",
        MFV_TOGGLE: "mjr:mfv-toggle",
    },
}));

vi.mock("../app/toast.js", () => ({
    comfyToast: vi.fn(),
}));

vi.mock("../app/i18n.js", () => ({
    t: vi.fn((_key, fallback) => fallback ?? _key),
}));

// Minimal Vue component stubs — just need to be mountable objects
vi.mock("../vue/GlobalRuntime.vue", () => ({ default: { render: () => null } }));
vi.mock("../vue/App.vue", () => ({ default: { render: () => null } }));
vi.mock("../vue/GeneratedFeedApp.vue", () => ({ default: { render: () => null } }));

// ── import the module under test ──────────────────────────────────────────────
// Static import — all mocks are in place when this resolves.

import {
    consumeEarlyFetch,
    getGeneratedFeedBottomPanelTab,
    isMajoorTrackableNode,
    mountGlobalRuntime,
    registerAssetsSidebar,
    teardownAssetsSidebar,
    teardownGeneratedFeed,
    teardownGlobalRuntime,
} from "../features/runtime/entryUiRegistration.js";

// ─────────────────────────────────────────────────────────────────────────────
describe("render / destroy — keepalive contract", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockMountKeepAlive.mockReturnValue(true);
    });

    it("render() calls mountKeepAlive with the container element", () => {
        const el = document.createElement("div");
        registerAssetsSidebar({}, { sidebarTabId: "mjr-assets" });
        const tabDef = mockRegisterSidebarTabCompat.mock.calls[0][1];

        tabDef.render(el);

        expect(mockMountKeepAlive).toHaveBeenCalledTimes(1);
        expect(mockMountKeepAlive.mock.calls[0][0]).toBe(el);
    });

    it("destroy() is a no-op — does NOT call unmountKeepAlive", () => {
        const el = document.createElement("div");
        registerAssetsSidebar({}, { sidebarTabId: "mjr-assets" });
        const tabDef = mockRegisterSidebarTabCompat.mock.calls[0][1];

        tabDef.render(el);
        tabDef.destroy(el); // intentional no-op

        expect(mockUnmountKeepAlive).not.toHaveBeenCalled();
    });

    it("re-render after destroy uses the same mount key (app stays alive)", () => {
        const el1 = document.createElement("div");
        const el2 = document.createElement("div");
        registerAssetsSidebar({}, { sidebarTabId: "mjr-assets" });
        const tabDef = mockRegisterSidebarTabCompat.mock.calls[0][1];

        tabDef.render(el1);
        tabDef.destroy(el1); // no-op
        tabDef.render(el2); // re-render after tab switch

        const [call1, call2] = mockMountKeepAlive.mock.calls;
        expect(call1[2]).toBe(call2[2]); // same mount key both times
    });

    it("bottom-panel destroy() is also a no-op", () => {
        const el = document.createElement("div");
        const tabDef = getGeneratedFeedBottomPanelTab();

        tabDef.render(el);
        tabDef.destroy(el);

        expect(mockUnmountKeepAlive).not.toHaveBeenCalled();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("teardown helpers — idempotency and safety", () => {
    beforeEach(() => vi.clearAllMocks());

    it("teardownAssetsSidebar calls unmountKeepAlive once", () => {
        teardownAssetsSidebar();
        expect(mockUnmountKeepAlive).toHaveBeenCalledTimes(1);
    });

    it("teardownAssetsSidebar is idempotent — second call does not throw", () => {
        expect(() => {
            teardownAssetsSidebar();
            teardownAssetsSidebar();
        }).not.toThrow();
    });

    it("teardownGeneratedFeed calls unmountKeepAlive once", () => {
        teardownGeneratedFeed();
        expect(mockUnmountKeepAlive).toHaveBeenCalledTimes(1);
    });

    it("teardownGeneratedFeed is idempotent — second call does not throw", () => {
        expect(() => {
            teardownGeneratedFeed();
            teardownGeneratedFeed();
        }).not.toThrow();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("mountGlobalRuntime / teardownGlobalRuntime", () => {
    const ROOT_ID = "mjr-global-runtime-root";

    beforeEach(() => {
        vi.clearAllMocks();
        mockMountKeepAlive.mockReturnValue(true);
        document.getElementById(ROOT_ID)?.remove();
    });

    afterEach(() => {
        document.getElementById(ROOT_ID)?.remove();
    });

    it("mountGlobalRuntime creates #mjr-global-runtime-root in document.body", () => {
        mountGlobalRuntime();
        expect(document.getElementById(ROOT_ID)).toBeTruthy();
    });

    it("mountGlobalRuntime calls mountKeepAlive with the root element", () => {
        mountGlobalRuntime();
        expect(mockMountKeepAlive).toHaveBeenCalledTimes(1);
        const calledWithEl = mockMountKeepAlive.mock.calls[0][0];
        expect(calledWithEl?.id).toBe(ROOT_ID);
    });

    it("mountGlobalRuntime is idempotent — second call reuses existing root", () => {
        mountGlobalRuntime();
        const firstRoot = document.getElementById(ROOT_ID);
        mountGlobalRuntime();
        const secondRoot = document.getElementById(ROOT_ID);

        // Same DOM node
        expect(firstRoot).toBe(secondRoot);
    });

    it("teardownGlobalRuntime removes the root element from DOM", () => {
        mountGlobalRuntime();
        expect(document.getElementById(ROOT_ID)).toBeTruthy();

        teardownGlobalRuntime();
        expect(document.getElementById(ROOT_ID)).toBeFalsy();
    });

    it("teardownGlobalRuntime calls unmountKeepAlive", () => {
        mountGlobalRuntime();
        teardownGlobalRuntime();
        expect(mockUnmountKeepAlive).toHaveBeenCalledTimes(1);
    });

    it("teardownGlobalRuntime is safe when root never existed", () => {
        expect(() => teardownGlobalRuntime()).not.toThrow();
    });

    it("teardownGlobalRuntime is idempotent — second call does not throw", () => {
        mountGlobalRuntime();
        teardownGlobalRuntime();
        expect(() => teardownGlobalRuntime()).not.toThrow();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("isMajoorTrackableNode — node classifier", () => {
    it.each([
        // Save* nodes
        [{ comfyClass: "SaveImage" }, true, "SaveImage"],
        [{ comfyClass: "SaveAnimatedWEBP" }, true, "SaveAnimatedWEBP"],
        [{ comfyClass: "SaveVideo" }, true, "SaveVideo"],
        // Load* nodes
        [{ comfyClass: "LoadImage" }, true, "LoadImage"],
        [{ type: "LoadImageMask" }, true, "LoadImageMask via type"],
        // Preview* nodes
        [{ comfyClass: "PreviewImage" }, true, "PreviewImage"],
        [{ constructor: { type: "PreviewAudio" } }, true, "PreviewAudio via constructor.type"],
        // Non-trackable
        // NOTE: CheckpointLoaderSimple contains "Loader" → matches /load/i → IS trackable by design
        [{ comfyClass: "CheckpointLoaderSimple" }, true, "CheckpointLoaderSimple has 'load'"],
        [{ comfyClass: "KSampler" }, false, "KSampler"],
        [{ comfyClass: "CLIPTextEncode" }, false, "CLIPTextEncode"],
        [{ comfyClass: "VAEDecode" }, false, "VAEDecode"],
        // Edge cases
        [null, false, "null node"],
        [undefined, false, "undefined node"],
        [{}, false, "empty object"],
        [{ comfyClass: "" }, false, "empty comfyClass"],
    ])("(%s) → %s [%s]", (node, expected) => {
        expect(isMajoorTrackableNode(node)).toBe(expected);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("consumeEarlyFetch — module-level state guard", () => {
    it("returns null for a key that does not match the cached key", () => {
        // Key mismatch always returns null regardless of whether a fetch was started.
        expect(consumeEarlyFetch("this-key:was:never:started")).toBeNull();
    });

    it("second consumption always returns null — cache is cleared after first read", () => {
        // First call: may return a Promise if render() ran startEarlyFetch, or null.
        consumeEarlyFetch();
        // Second call: cache was cleared by the first call — always null.
        expect(consumeEarlyFetch()).toBeNull();
    });

    it("does not throw when called with any argument", () => {
        expect(() => consumeEarlyFetch()).not.toThrow();
        expect(() => consumeEarlyFetch("output:*:mtime_desc")).not.toThrow();
        expect(() => consumeEarlyFetch(null)).not.toThrow();
        expect(() => consumeEarlyFetch(undefined)).not.toThrow();
    });
});
