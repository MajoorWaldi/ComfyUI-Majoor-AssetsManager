import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
    vi.resetModules();
    globalThis.window = {};
    globalThis.globalThis = globalThis;
});

describe("comfyApiBridge", () => {
    it("discovers extension manager native surfaces from the app", async () => {
        const toast = { add: vi.fn() };
        const dialog = { confirm: vi.fn(), prompt: vi.fn() };
        const registerSidebarTab = vi.fn();
        const app = {
            ui: {},
            extensionManager: {
                toast,
                dialog,
                registerSidebarTab,
                activateSidebarTab: vi.fn(),
                registerCommand: vi.fn(),
                registerKeybinding: vi.fn(),
                registerBottomPanelTab: vi.fn(),
            },
        };

        const mod = await import("../app/comfyApiBridge.js");
        mod.setComfyApp(app);

        expect(mod.getExtensionToastApi()).toBe(toast);
        expect(mod.getExtensionDialogApi()).toBe(dialog);
        expect(mod.activateSidebarTabCompat(app, "majoor-assets")).toBe(true);
        expect(app.extensionManager.activateSidebarTab).toHaveBeenCalledWith("majoor-assets");
        expect(mod.registerSidebarTabCompat(app, { id: "majoor-assets" })).toBe(true);
        expect(registerSidebarTab).toHaveBeenCalledWith({ id: "majoor-assets" });
        expect(mod.registerCommandCompat(app, { id: "mjr.test" })).toBe(true);
        expect(mod.registerKeybindingCompat(app, { commandId: "mjr.test" })).toBe(true);
        expect(mod.registerBottomPanelTabCompat(app, { id: "mjr.feed" })).toBe(true);
    });

    it("supports nested sidebar and bottom panel controllers from newer ComfyUI runtimes", async () => {
        const toggleSidebarTab = vi.fn();
        const registerSidebarTab = vi.fn();
        const registerBottomPanelTab = vi.fn();
        const app = {
            ui: {},
            extensionManager: {
                sidebarTab: {
                    activeSidebarTabId: "",
                    toggleSidebarTab,
                    registerSidebarTab,
                },
                bottomPanel: {
                    registerBottomPanelTab,
                },
            },
        };

        const mod = await import("../app/comfyApiBridge.js");
        mod.setComfyApp(app);

        expect(mod.activateSidebarTabCompat(app, "majoor-assets")).toBe(true);
        expect(toggleSidebarTab).toHaveBeenCalledWith("majoor-assets");
        expect(mod.registerSidebarTabCompat(app, { id: "majoor-assets" })).toBe(true);
        expect(registerSidebarTab).toHaveBeenCalledWith({ id: "majoor-assets" });
        expect(mod.registerBottomPanelTabCompat(app, { id: "mjr.feed" })).toBe(true);
        expect(registerBottomPanelTab).toHaveBeenCalledWith({ id: "mjr.feed" });
    });

    it("prefers sidebarTabStore and supports workspaceStore sidebar fallback", async () => {
        const storeToggle = vi.fn();
        const legacyToggle = vi.fn();
        const workspaceToggle = vi.fn();
        const app = {
            ui: {},
            extensionManager: {
                sidebarTab: { toggleSidebarTab: legacyToggle },
                sidebarTabStore: { toggleSidebarTab: storeToggle },
                workspaceStore: { sidebarTab: { toggleSidebarTab: workspaceToggle } },
            },
        };

        const mod = await import("../app/comfyApiBridge.js");
        mod.setComfyApp(app);

        expect(mod.getSidebarController(app)).toBe(app.extensionManager.sidebarTabStore);
        expect(mod.activateSidebarTabCompat(app, "majoor-assets")).toBe(true);
        expect(storeToggle).toHaveBeenCalledWith("majoor-assets");
        expect(legacyToggle).not.toHaveBeenCalled();
        expect(workspaceToggle).not.toHaveBeenCalled();

        delete app.extensionManager.sidebarTabStore;
        delete app.extensionManager.sidebarTab;
        expect(mod.getSidebarController(app)).toBe(app.extensionManager.workspaceStore.sidebarTab);
    });

    it("does not toggle a sidebar tab that is already active", async () => {
        const toggleSidebarTab = vi.fn();
        const app = {
            ui: {},
            extensionManager: {
                sidebarTab: {
                    activeSidebarTabId: "majoor-assets",
                    toggleSidebarTab,
                },
            },
        };

        const mod = await import("../app/comfyApiBridge.js");
        mod.setComfyApp(app);

        expect(mod.activateSidebarTabCompat(app, "majoor-assets")).toBe(true);
        expect(toggleSidebarTab).not.toHaveBeenCalled();
    });

    it("returns false when native manager APIs are unavailable", async () => {
        const app = { ui: {} };
        const mod = await import("../app/comfyApiBridge.js");
        mod.setComfyApp(app);

        expect(mod.getExtensionToastApi()).toBeNull();
        expect(mod.getExtensionDialogApi()).toBeNull();
        expect(mod.activateSidebarTabCompat(app, "missing")).toBe(false);
        expect(mod.registerSidebarTabCompat(app, { id: "missing" })).toBe(false);
        expect(mod.registerCommandCompat(app, { id: "mjr.test" })).toBe(false);
        expect(mod.registerBottomPanelTabCompat(app, { id: "mjr.feed" })).toBe(false);
    });

    it("accepts alert-only extension dialog APIs", async () => {
        const dialog = { alert: vi.fn() };
        const app = {
            ui: {},
            extensionManager: { dialog },
        };

        const mod = await import("../app/comfyApiBridge.js");
        mod.setComfyApp(app);

        expect(mod.getExtensionDialogApi(app)).toBe(dialog);
    });

    it("reads and writes settings through current and legacy ComfyUI settings APIs", async () => {
        const setSettingValue = vi.fn();
        const app = {
            ui: {
                settings: {
                    getSettingValue: vi.fn((key) => (key === "Majoor.Test" ? true : undefined)),
                    setSettingValue,
                },
            },
        };

        const mod = await import("../app/comfyApiBridge.js");

        expect(mod.getSettingValue(app, "Majoor.Test")).toBe(true);
        expect(mod.setSettingValue(app, "Majoor.Test", false)).toBe(true);
        expect(setSettingValue).toHaveBeenCalledWith("Majoor.Test", false);
    });

    it("falls back to map-like settings stores when helper methods are unavailable", async () => {
        const app = {
            settings: {
                settings: new Map([["Majoor.Test", "from-map"]]),
            },
        };

        const mod = await import("../app/comfyApiBridge.js");

        expect(mod.getSettingValue(app, "Majoor.Test")).toBe("from-map");
        expect(mod.setSettingValue(app, "Majoor.Test", "next")).toBe(true);
        expect(app.settings.settings.get("Majoor.Test")).toBe("next");
    });
});
