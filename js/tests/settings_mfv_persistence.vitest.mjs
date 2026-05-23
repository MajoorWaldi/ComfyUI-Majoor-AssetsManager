import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../app/dialogs.js", () => ({
    comfyAlert: vi.fn(),
}));

vi.mock("../utils/events.js", () => ({
    safeDispatchCustomEvent: vi.fn(),
}));

vi.mock("../api/client.js", () => ({
    bootstrapSecurityToken: vi.fn(),
    getExecutionGroupingSettings: vi.fn(),
    getLtxavRgbFallbackSettings: vi.fn(() => Promise.resolve({ ok: false })),
    getSecuritySettings: vi.fn(),
    getVectorSearchSettings: vi.fn(),
    setLtxavRgbFallbackSettings: vi.fn(() => Promise.resolve({ ok: true })),
}));

vi.mock("../app/toast.js", () => ({
    comfyToast: vi.fn(),
}));

vi.mock("../app/i18n.js", () => ({
    t: (key, fallback) => fallback || key,
}));

function createStorage() {
    const data = new Map();
    return {
        get length() {
            return data.size;
        },
        key(index) {
            return Array.from(data.keys())[index] ?? null;
        },
        getItem(key) {
            return data.has(String(key)) ? data.get(String(key)) : null;
        },
        setItem(key, value) {
            data.set(String(key), String(value));
        },
        removeItem(key) {
            data.delete(String(key));
        },
    };
}

describe("MFV settings persistence", () => {
    beforeEach(() => {
        vi.resetModules();
        globalThis.window = {
            localStorage: createStorage(),
            addEventListener: vi.fn(),
        };
        globalThis.document = {
            querySelectorAll: vi.fn(() => []),
        };
    });

    it("persists Live Stream and KSampler Preview defaults across reload-style reads", async () => {
        const { loadMajoorSettings, saveMajoorSettings } = await import(
            "../app/settings/settingsCore.js"
        );
        const { registerViewerSettings } = await import("../app/settings/settingsViewer.js");

        const settings = loadMajoorSettings();
        settings.viewer.mfvLiveDefault = false;
        settings.viewer.mfvPreviewDefault = false;
        saveMajoorSettings(settings);

        let reloaded = loadMajoorSettings();
        let definitions = [];
        registerViewerSettings((definition) => definitions.push(definition), reloaded, vi.fn());

        definitions.find((definition) => definition.id === "Majoor.Viewer.MfvLiveDefault").onChange(
            true,
        );
        definitions
            .find((definition) => definition.id === "Majoor.Viewer.MfvPreviewDefault")
            .onChange(true);

        reloaded = loadMajoorSettings();
        expect(reloaded.viewer.mfvLiveDefault).toBe(true);
        expect(reloaded.viewer.mfvPreviewDefault).toBe(true);

        definitions = [];
        registerViewerSettings((definition) => definitions.push(definition), reloaded, vi.fn());

        expect(
            definitions.find((definition) => definition.id === "Majoor.Viewer.MfvLiveDefault")
                .defaultValue,
        ).toBe(true);
        expect(
            definitions.find((definition) => definition.id === "Majoor.Viewer.MfvPreviewDefault")
                .defaultValue,
        ).toBe(true);
    });
});
