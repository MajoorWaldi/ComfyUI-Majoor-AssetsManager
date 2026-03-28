import { beforeEach, describe, expect, it, vi } from "vitest";

const applySettingsToConfig = vi.fn();
const initI18n = vi.fn();
const saveMajoorSettings = vi.fn();
const safeDispatchCustomEvent = vi.fn();
const setFollowComfyLanguage = vi.fn();
const startComfyLanguageSync = vi.fn();
const t = vi.fn((k, def) => def || k);
const startRuntimeStatusDashboard = vi.fn();
const syncBackendSecuritySettings = vi.fn();
const syncBackendVectorSearchSettings = vi.fn();
const toggleWatcher = vi.fn().mockResolvedValue({ ok: true });

vi.mock("../utils/events.js", () => ({
    safeDispatchCustomEvent,
}));

vi.mock("../app/i18n.js", () => ({
    initI18n,
    setFollowComfyLanguage,
    startComfyLanguageSync,
    t,
}));

vi.mock("../utils/debounce.js", () => ({
    debounce: (fn) => fn,
}));

vi.mock("../api/client.js", () => ({
    getWatcherStatus: vi.fn().mockResolvedValue({ ok: true, data: { enabled: true } }),
    toggleWatcher,
}));

vi.mock("../app/settings/settingsCore.js", () => ({
    applySettingsToConfig,
    loadMajoorSettings: () => ({
        i18n: { followComfyLanguage: true },
        watcher: { enabled: true },
        grid: {},
    }),
    saveMajoorSettings,
    syncBackendSecuritySettings,
    syncBackendVectorSearchSettings,
}));

vi.mock("../app/settings/settingsRuntime.js", () => ({
    startRuntimeStatusDashboard,
}));

vi.mock("../app/settings/settingsGrid.js", () => ({
    registerGridSettings: (addSetting) => {
        addSetting({
            id: "Majoor.Grid.Sample",
            name: "Majoor: Sample setting",
            category: ["Wrong Category"],
            type: "boolean",
            defaultValue: true,
        });
    },
}));

vi.mock("../app/settings/settingsViewer.js", () => ({
    registerViewerSettings: vi.fn(),
}));

vi.mock("../app/settings/settingsScanning.js", () => ({
    registerScanningSettings: vi.fn(),
}));

vi.mock("../app/settings/settingsFeed.js", () => ({
    registerFeedSettings: vi.fn(),
}));

vi.mock("../app/settings/settingsSecurity.js", () => ({
    registerSecuritySettings: vi.fn(),
}));

vi.mock("../app/settings/settingsAdvanced.js", () => ({
    registerAdvancedSettings: vi.fn(),
}));

vi.mock("../app/settings/settingsSearch.js", () => ({
    registerSearchSettings: vi.fn(),
}));

vi.mock("../app/settingsStore.js", () => ({
    SETTINGS_KEY: "mjrSettings",
}));

function createWindow() {
    return {
        addEventListener: vi.fn(),
        localStorage: {
            getItem: vi.fn(() => null),
            removeItem: vi.fn(),
            setItem: vi.fn(),
        },
    };
}

describe("SettingsPanel", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        globalThis.window = createWindow();
    });

    it("builds normalized settings definitions without runtime bootstrap", async () => {
        const mod = await import("../app/settings/SettingsPanel.js");
        const settings = mod.buildMajoorSettings({ id: "app" });

        expect(settings).toHaveLength(1);
        expect(settings[0].name).toBe("Sample setting");
        expect(settings[0].category).toEqual(["Majoor Assets Manager"]);
        expect(startRuntimeStatusDashboard).not.toHaveBeenCalled();
        expect(syncBackendSecuritySettings).not.toHaveBeenCalled();
    });

    it("initializes runtime side effects once during register", async () => {
        const mod = await import("../app/settings/SettingsPanel.js");

        mod.buildMajoorSettings({ id: "app" });
        mod.registerMajoorSettings({ id: "runtime" });
        mod.registerMajoorSettings({ id: "runtime" });
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(initI18n).toHaveBeenCalledTimes(1);
        expect(applySettingsToConfig).toHaveBeenCalledTimes(1);
        expect(startComfyLanguageSync).toHaveBeenCalledTimes(1);
        expect(startRuntimeStatusDashboard).toHaveBeenCalledTimes(1);
        expect(syncBackendSecuritySettings).toHaveBeenCalledTimes(1);
        expect(syncBackendVectorSearchSettings).toHaveBeenCalledTimes(1);
        expect(toggleWatcher).toHaveBeenCalledTimes(1);
    });
});
