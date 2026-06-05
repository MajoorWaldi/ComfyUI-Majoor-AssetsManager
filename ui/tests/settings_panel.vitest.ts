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
const syncBackendExecutionGroupingSettings = vi.fn();
const toggleWatcher = vi.fn().mockResolvedValue({ ok: true });
let loadedSettings;

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
    DEFAULT_SETTINGS: {
        i18n: { followComfyLanguage: true },
        watcher: { enabled: true },
        grid: { sample: true },
    },
    applySettingsToConfig,
    loadMajoorSettings: () => loadedSettings,
    saveMajoorSettings,
    syncBackendSecuritySettings,
    syncBackendVectorSearchSettings,
    syncBackendExecutionGroupingSettings,
}));

vi.mock("../app/settings/settingsRuntime.js", () => ({
    startRuntimeStatusDashboard,
}));

vi.mock("../app/settings/settingsGrid.js", () => ({
    registerGridSettings: (addSetting, settings) => {
        addSetting({
            id: "Majoor.Grid.Sample",
            name: "Majoor: Sample setting",
            category: ["Wrong Category"],
            type: "boolean",
            defaultValue: settings.grid?.sample !== false,
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
        loadedSettings = {
            i18n: { followComfyLanguage: true },
            watcher: { enabled: true },
            grid: { sample: false },
        };
        globalThis.window = createWindow();
    });

    it("builds normalized settings definitions without runtime bootstrap", async () => {
        const mod = await import("../app/settings/SettingsPanel.js");
        const settings = mod.buildMajoorSettings({ id: "app" });

        expect(settings).toHaveLength(2);
        expect(settings[0].id).toBe("Majoor.General.ResetAllSettings");
        expect(settings[1].name).toBe("Sample setting");
        expect(settings[1].category).toEqual([
            "Majoor Assets Manager",
            "Assets Panel",
            "Wrong Category",
        ]);
        expect(settings[1].tooltip).toBe("Sample setting");
        expect(startRuntimeStatusDashboard).not.toHaveBeenCalled();
        expect(syncBackendSecuritySettings).not.toHaveBeenCalled();
    });

    it("synchronizes setting values with the ComfyUI settings API", async () => {
        const setSettingValue = vi.fn();
        const app = {
            ui: {
                settings: { setSettingValue },
            },
        };
        const mod = await import("../app/settings/SettingsPanel.js");

        const settings = mod.buildMajoorSettings(app);
        settings[1].onChange(true);

        expect(setSettingValue).toHaveBeenCalledWith("Majoor.Grid.Sample", false);
        expect(setSettingValue).toHaveBeenCalledWith("Majoor.Grid.Sample", true);
    });

    it("rebuilds definitions from the latest persisted settings on each open", async () => {
        loadedSettings = {
            i18n: { followComfyLanguage: true },
            watcher: { enabled: true },
            grid: { sample: true },
        };
        const mod = await import("../app/settings/SettingsPanel.js");

        const first = mod.buildMajoorSettings({ id: "app" });
        expect(first[1].defaultValue).toBe(true);

        loadedSettings = {
            i18n: { followComfyLanguage: true },
            watcher: { enabled: true },
            grid: {},
        };
        const second = mod.buildMajoorSettings({ id: "app" });

        expect(second).not.toBe(first);
        expect(second[1].defaultValue).toBe(true);
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

    it("separates native ComfyUI settings into clear Majoor sections without changing ids", async () => {
        vi.doMock("../app/settings/settingsGrid.js", () => ({
            registerGridSettings: (addSetting) => {
                addSetting({
                    id: "Majoor.Grid.PageSize",
                    name: "Majoor: Page size",
                    category: ["Majoor Assets Manager", "Grid", "Page size"],
                    type: "number",
                    defaultValue: 200,
                });
            },
        }));
        vi.doMock("../app/settings/settingsViewer.js", () => ({
            registerViewerSettings: (addSetting) => {
                addSetting({
                    id: "Majoor.Viewer.MfvLiveDefault",
                    name: "Majoor: Live stream by default",
                    category: ["Majoor Assets Manager", "Floating Viewer", "Live stream"],
                    type: "boolean",
                    defaultValue: true,
                });
            },
        }));
        vi.doMock("../app/settings/settingsSecurity.js", () => ({
            registerSecuritySettings: (addSetting) => {
                addSetting({
                    id: "Majoor.Security.AllowDelete",
                    name: "Majoor: Allow delete",
                    category: ["Majoor Assets Manager", "Security", "Allow delete"],
                    type: "boolean",
                    defaultValue: false,
                });
            },
        }));
        vi.doMock("../app/settings/settingsAdvanced.js", () => ({
            registerAdvancedSettings: (addSetting) => {
                addSetting({
                    id: "Majoor.Db.Timeout",
                    name: "Majoor: DB timeout",
                    category: ["Majoor Assets Manager", "Advanced", "Database"],
                    type: "number",
                    defaultValue: 30,
                });
            },
        }));
        vi.doMock("../app/settings/settingsSearch.js", () => ({
            registerSearchSettings: (addSetting) => {
                addSetting({
                    id: "Majoor.AI.VectorSearchEnabled",
                    name: "Majoor: Semantic search",
                    category: ["Majoor Assets Manager", "Search", "AI"],
                    type: "boolean",
                    defaultValue: true,
                });
            },
        }));

        const mod = await import("../app/settings/SettingsPanel.js");
        const definitions = mod.buildMajoorSettings({ id: "app" });
        const categoryById = new Map(
            definitions.map((definition) => [definition.id, definition.category]),
        );

        expect(categoryById.get("Majoor.Grid.PageSize")).toEqual([
            "Majoor Assets Manager",
            "Assets Panel",
            "Page size",
        ]);
        expect(categoryById.get("Majoor.Viewer.MfvLiveDefault")).toEqual([
            "Majoor Assets Manager",
            "Viewer & Floating Viewer",
            "Live stream",
        ]);
        expect(categoryById.get("Majoor.Security.AllowDelete")).toEqual([
            "Majoor Assets Manager",
            "Security",
            "Allow delete",
        ]);
        expect(categoryById.get("Majoor.Db.Timeout")).toEqual([
            "Majoor Assets Manager",
            "Advanced",
            "Database",
        ]);
        expect(categoryById.get("Majoor.AI.VectorSearchEnabled")).toEqual([
            "Majoor Assets Manager",
            "Search & AI",
            "AI",
        ]);
    });
});
