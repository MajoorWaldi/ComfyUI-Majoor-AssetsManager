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
        const app = {
            ui: {},
            extensionManager: {
                toast,
                dialog,
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
        expect(mod.registerCommandCompat(app, { id: "mjr.test" })).toBe(true);
        expect(mod.registerKeybindingCompat(app, { commandId: "mjr.test" })).toBe(true);
        expect(mod.registerBottomPanelTabCompat(app, { id: "mjr.feed" })).toBe(true);
    });

    it("returns false when native manager APIs are unavailable", async () => {
        const app = { ui: {} };
        const mod = await import("../app/comfyApiBridge.js");
        mod.setComfyApp(app);

        expect(mod.getExtensionToastApi()).toBeNull();
        expect(mod.getExtensionDialogApi()).toBeNull();
        expect(mod.activateSidebarTabCompat(app, "missing")).toBe(false);
        expect(mod.registerCommandCompat(app, { id: "mjr.test" })).toBe(false);
        expect(mod.registerBottomPanelTabCompat(app, { id: "mjr.feed" })).toBe(false);
    });
});
