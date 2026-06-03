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
    mockRegisterKeybindingCompat,
    mockGet,
} = vi.hoisted(() => ({
    mockMountKeepAlive: vi.fn(() => true),
    mockUnmountKeepAlive: vi.fn(),
    mockRegisterSidebarTabCompat: vi.fn((_app, def) => def),
    mockRegisterBottomPanelTabCompat: vi.fn((_app, def) => def),
    mockRegisterKeybindingCompat: vi.fn(() => true),
    mockGet: vi.fn(() => Promise.resolve(null)),
}));

// ── module mocks ──────────────────────────────────────────────────────────────

vi.mock("../vue/createVueApp.js", () => ({
    mountKeepAlive: mockMountKeepAlive,
    unmountKeepAlive: mockUnmountKeepAlive,
    createMjrApp: vi.fn(),
}));

vi.mock("../app/comfyApiBridge.js", () => ({
    activateBottomPanelTabCompat: vi.fn(() => true),
    activateSidebarTabCompat: vi.fn(() => false),
    registerSidebarTabCompat: mockRegisterSidebarTabCompat,
    registerBottomPanelTabCompat: mockRegisterBottomPanelTabCompat,
    registerCommandCompat: vi.fn(() => true),
    registerKeybindingCompat: mockRegisterKeybindingCompat,
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
    getWatcherStatus: vi.fn(() => Promise.resolve(null)),
    toggleWatcher: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("../api/endpoints.js", () => ({
    buildListURL: vi.fn(() => "/mjr/am/assets?q=*"),
}));

vi.mock("../app/bootstrap.js", () => ({
    runStartupWarmup: vi.fn(() => Promise.resolve()),
}));

vi.mock("../app/config.js", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        APP_CONFIG: { ...actual.APP_CONFIG, DEFAULT_PAGE_SIZE: 200 },
    };
});

vi.mock("../app/events.js", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        EVENTS: {
            ...actual.EVENTS,
            OPEN_ASSETS_MANAGER: "mjr:open-assets-manager",
            RELOAD_GRID: "mjr:reload-grid",
            MFV_TOGGLE: "mjr:mfv-toggle",
            OPEN_NODE_CONTEXT: "mjr:open-node-context",
        },
    };
});

vi.mock("../app/toast.js", () => ({
    comfyToast: vi.fn(),
}));

vi.mock("../app/openMajoorSettings.js", () => ({
    openMajoorSettings: vi.fn(),
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
    buildAboutPageBadges,
    consumeEarlyFetch,
    getGeneratedFeedBottomPanelTab,
    buildNativeCommands,
    buildNativeKeybindings,
    buildNativeMenuCommands,
    getMajoorCanvasMenuItems,
    getMajoorSelectionToolboxCommands,
    isMajoorTrackableNode,
    mountGlobalRuntime,
    registerAssetsSidebar,
    registerNativeKeybindings,
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
describe("native ComfyUI frontend registration payloads", () => {
    beforeEach(() => vi.clearAllMocks());

    it("builds command palette actions for panel, viewer, refresh, scan, and settings", () => {
        const commands = buildNativeCommands(
            {},
            { sidebarTabId: "majoor-assets", triggerStartupScan: vi.fn() },
        );
        expect(commands.map((command) => command.id)).toEqual([
            "mjr.openAssetsManager",
            "mjr.scanAssets",
            "mjr.toggleFloatingViewer",
            "mjr.refreshAssetsGrid",
            "mjr.openFloatingViewer",
            "mjr.openGeneratedFeed",
            "mjr.openSettings",
            "mjr.openNodeContext",
        ]);
    });

    it("adds tooltips for commands shown as selection toolbox icons", () => {
        const commands = buildNativeCommands(
            {},
            { sidebarTabId: "majoor-assets", triggerStartupScan: vi.fn() },
        );
        const byId = new Map(commands.map((command) => [command.id, command]));

        for (const id of [
            "mjr.openNodeContext",
            "mjr.openAssetsManager",
            "mjr.openFloatingViewer",
            "mjr.openGeneratedFeed",
        ]) {
            const command = byId.get(id);
            expect(command.tooltip).toBeTruthy();
            expect(command.title).toBe(command.tooltip);
            expect(command.description).toBe(command.tooltip);
        }
    });

    it("builds declarative keybindings using non-browser-reserved combinations", () => {
        expect(buildNativeKeybindings()).toEqual([
            {
                combo: { alt: true, shift: true, key: "a" },
                commandId: "mjr.openAssetsManager",
            },
            {
                combo: { alt: true, shift: true, key: "v" },
                commandId: "mjr.toggleFloatingViewer",
            },
        ]);
    });

    it("registers keybindings imperatively for older ComfyUI hosts", () => {
        const app = { extensionManager: {} };

        registerNativeKeybindings(app);

        expect(mockRegisterKeybindingCompat).toHaveBeenCalledTimes(2);
        expect(mockRegisterKeybindingCompat.mock.calls[0][0]).toBe(app);
        expect(mockRegisterKeybindingCompat.mock.calls[0][1].commandId).toBe(
            "mjr.openAssetsManager",
        );
    });

    it("builds topbar menu commands under Extensions / Majoor Assets Manager", () => {
        const menuCommands = buildNativeMenuCommands();
        expect(menuCommands).toHaveLength(1);
        expect(menuCommands[0].path).toEqual(["Extensions", "Majoor Assets Manager"]);
        expect(menuCommands[0].commands).toContain("mjr.openSettings");
        expect(menuCommands[0].commands).toContain("mjr.openGeneratedFeed");
    });

    it("builds official ComfyUI canvas context menu items with a declarative submenu", () => {
        const triggerStartupScan = vi.fn();
        const items = getMajoorCanvasMenuItems(
            {},
            { sidebarTabId: "majoor-assets", triggerStartupScan },
        );

        expect(items[0]).toBeNull();
        expect(items[1].content).toBe("Majoor Assets Manager");
        expect(items[1].submenu.options.map((item) => item?.content).filter(Boolean)).toEqual([
            "Open Majoor Assets Manager",
            "Open floating viewer",
            "Open generated feed",
            "Refresh assets grid",
            "Scan assets",
            "Open Majoor settings",
        ]);
    });

    it("builds About page badges with version and docs metadata", () => {
        const badges = buildAboutPageBadges();
        expect(badges.map((badge) => badge.label)).toEqual([
            "Majoor Assets Manager",
            "v2.4.8",
            "Docs",
        ]);
        expect(badges[2].url).toContain("MajoorWaldi");
    });
});

describe("selection toolbox commands", () => {
    it("returns toolbox commands for trackable selected nodes", () => {
        expect(getMajoorSelectionToolboxCommands({ id: 12, comfyClass: "SaveImage" })).toEqual([
            "mjr.openNodeContext",
            "mjr.openAssetsManager",
            "mjr.openFloatingViewer",
        ]);
    });

    it("supports multi-selection containers and ignores non-trackable nodes", () => {
        expect(
            getMajoorSelectionToolboxCommands({
                items: [{ comfyClass: "KSampler" }, { id: 9, type: "PreviewImage" }],
            }),
        ).toEqual(["mjr.openNodeContext", "mjr.openAssetsManager", "mjr.openFloatingViewer"]);
        expect(getMajoorSelectionToolboxCommands({ comfyClass: "CLIPTextEncode" })).toEqual([]);
    });
});

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
