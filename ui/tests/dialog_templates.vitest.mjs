import { beforeEach, describe, expect, it, vi } from "vitest";

const getExtensionDialogApi = vi.fn(() => null);
const getComfyApp = vi.fn(() => null);

vi.mock("../app/comfyApiBridge.js", () => ({
    getComfyApp,
    getExtensionDialogApi,
}));

vi.mock("../app/i18n.js", () => ({
    t: (_key, fallback) => fallback,
}));

beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getExtensionDialogApi.mockReturnValue(null);
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

describe("DialogTemplates", () => {
    it("remains usable when imported directly", async () => {
        const mod = await import("../app/DialogTemplates.js");

        await expect(mod.comfyConfirm("Delete?")).resolves.toBe(true);
        await expect(mod.comfyPrompt("Name", "x")).resolves.toBe("fallback");
        expect(window.confirm).toHaveBeenCalled();
        expect(window.prompt).toHaveBeenCalled();
    });
});
