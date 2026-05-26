import { beforeEach, describe, expect, it, vi } from "vitest";

const getExtensionDialogApi = vi.fn(() => null);
const getExtensionToastApi = vi.fn(() => null);
const getComfyApp = vi.fn(() => null);

vi.mock("../app/comfyApiBridge.js", () => ({
    getComfyApp,
    getExtensionDialogApi,
    getExtensionToastApi,
}));

vi.mock("../app/i18n.js", () => ({
    t: (_key, fallback) => fallback,
}));

beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getExtensionDialogApi.mockReturnValue(null);
    getExtensionToastApi.mockReturnValue(null);
    getComfyApp.mockReturnValue(null);
    globalThis.window = {
        confirm: vi.fn(() => true),
        prompt: vi.fn(() => "fallback"),
        alert: vi.fn(),
    };
    globalThis.document = {
        createElement: vi.fn(() => ({ style: {}, appendChild: vi.fn(), setAttribute: vi.fn() })),
    };
});

describe("dialogs", () => {
    it("uses extension dialog confirm/prompt first", async () => {
        getExtensionDialogApi.mockReturnValue({
            confirm: vi.fn(async () => true),
            prompt: vi.fn(async () => "native-value"),
        });

        const mod = await import("../app/dialogs.js");
        await expect(mod.comfyConfirm("Delete?")).resolves.toBe(true);
        await expect(mod.comfyPrompt("Name", "x")).resolves.toBe("native-value");
        expect(window.confirm).not.toHaveBeenCalled();
        expect(window.prompt).not.toHaveBeenCalled();
    });

    it("uses extension dialog alert before toast and browser alert", async () => {
        const alert = vi.fn(async () => undefined);
        const addAlert = vi.fn();
        getExtensionDialogApi.mockReturnValue({ alert });
        getExtensionToastApi.mockReturnValue({
            add: vi.fn(),
            addAlert,
        });

        const mod = await import("../app/dialogs.js");
        await mod.comfyAlert("Indexed", "Majoor");

        expect(alert).toHaveBeenCalledWith({ title: "Majoor", message: "Indexed" });
        expect(addAlert).not.toHaveBeenCalled();
        expect(window.alert).not.toHaveBeenCalled();
    });

    it("uses extension toast alert before browser alert", async () => {
        const addAlert = vi.fn();
        getExtensionToastApi.mockReturnValue({
            add: vi.fn(),
            addAlert,
        });

        const mod = await import("../app/dialogs.js");
        await mod.comfyAlert("Indexed");

        expect(addAlert).toHaveBeenCalledWith("Indexed");
        expect(window.alert).not.toHaveBeenCalled();
    });

    it("falls back to window dialogs when no native surface exists", async () => {
        const mod = await import("../app/dialogs.js");
        await expect(mod.comfyConfirm("Delete?")).resolves.toBe(true);
        await expect(mod.comfyPrompt("Name", "x")).resolves.toBe("fallback");
        expect(window.confirm).toHaveBeenCalled();
        expect(window.prompt).toHaveBeenCalled();
    });
});
