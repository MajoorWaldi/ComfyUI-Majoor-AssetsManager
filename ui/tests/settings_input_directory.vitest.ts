// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerAdvancedSettings } from "../app/settings/settingsAdvanced.js";
import { DEFAULT_SETTINGS, saveMajoorSettings } from "../app/settings/settingsCore.js";
import { getInputDirectorySetting, setInputDirectorySetting } from "../api/client.js";
import { comfyToast } from "../app/toast.js";

vi.mock("../api/client.js", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../api/client.js")>();
    const unavailable = vi.fn().mockResolvedValue({ ok: false });
    return {
        ...actual,
        getInputDirectorySetting: vi.fn(),
        setInputDirectorySetting: vi.fn(),
        getOutputDirectorySetting: unavailable,
        getIndexDirectorySetting: unavailable,
        getWorkflowRootsSetting: unavailable,
        getMetadataFallbackSettings: unavailable,
        getRouteLoggingSettings: unavailable,
        getStartupLoggingSettings: unavailable,
        getHuggingFaceSettings: unavailable,
        getAiLoggingSettings: unavailable,
        vectorStats: unavailable,
    };
});

vi.mock("../app/settings/settingsCore.js", async (importOriginal) => ({
    ...(await importOriginal<typeof import("../app/settings/settingsCore.js")>()),
    saveMajoorSettings: vi.fn(),
}));

vi.mock("../app/toast.js", () => ({ comfyToast: vi.fn(), recordToastHistory: vi.fn() }));
vi.mock("../app/i18n.js", () => ({
    t: (key: string, fallback?: string) => fallback || key,
    getSupportedLanguages: () => [],
    getCurrentLang: () => "en",
}));

function register() {
    const settings = structuredClone(DEFAULT_SETTINGS);
    const definitions: any[] = [];
    const notify = vi.fn();
    let input: any;
    const setSettingValue = vi.fn((_id, value) => input?.onChange(value));
    registerAdvancedSettings(
        (definition) => definitions.push(definition), settings, notify,
        { ui: { settings: { setSettingValue } } },
    );
    input = definitions.find((definition) => definition.id === "Majoor.Paths.InputDirectory");
    return { settings, input, notify, setSettingValue };
}

describe("Input Directory setting", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        vi.mocked(getInputDirectorySetting).mockResolvedValue({
            ok: true, data: { input_directory: "/custom/inputs" },
        });
        vi.mocked(setInputDirectorySetting).mockImplementation(async (value) => ({
            ok: true, data: { input_directory: value },
        }));
    });

    afterEach(() => vi.useRealTimers());

    it("loads the persisted backend override and registers a Paths / Input field", async () => {
        const { settings, input, notify, setSettingValue } = register();
        await vi.advanceTimersByTimeAsync(700);
        expect(input.category).toContain("Paths / Input");
        expect(input.type).toBe("text");
        expect(settings.paths.inputDirectory).toBe("/custom/inputs");
        expect(notify).toHaveBeenCalledWith("paths.inputDirectory");
        expect(setSettingValue).toHaveBeenCalledWith("Majoor.Paths.InputDirectory", "/custom/inputs");
        expect(setInputDirectorySetting).not.toHaveBeenCalled();
    });

    it("debounces edits, trims paths, and supports clearing the override", async () => {
        const { settings, input } = register();
        await vi.advanceTimersByTimeAsync(0);
        input.onChange("/first");
        input.onChange(" /second ");
        await vi.advanceTimersByTimeAsync(699);
        expect(setInputDirectorySetting).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1);
        expect(setInputDirectorySetting).toHaveBeenCalledExactlyOnceWith(
            "/second", expect.objectContaining({ signal: expect.any(AbortSignal) }),
        );
        expect(settings.paths.inputDirectory).toBe("/second");
        input.onChange("");
        await vi.advanceTimersByTimeAsync(700);
        expect(settings.paths.inputDirectory).toBe("");
        expect(saveMajoorSettings).toHaveBeenCalledWith(settings);
    });

    it("restores the committed value when the backend rejects a path", async () => {
        const { settings, input, setSettingValue } = register();
        await vi.advanceTimersByTimeAsync(0);
        vi.mocked(setInputDirectorySetting).mockResolvedValue({
            ok: false, data: null, error: "Directory does not exist",
        });
        input.onChange("/missing");
        await vi.advanceTimersByTimeAsync(700);
        expect(settings.paths.inputDirectory).toBe("/custom/inputs");
        expect(setSettingValue).toHaveBeenLastCalledWith("Majoor.Paths.InputDirectory", "/custom/inputs");
        expect(comfyToast).toHaveBeenCalledWith("Directory does not exist", "error");
    });

    it("does not let initial backend loading overwrite a new edit", async () => {
        const { settings, input } = register();
        input.onChange("/new");
        await vi.advanceTimersByTimeAsync(0);
        expect(settings.paths.inputDirectory).toBe("/new");
        await vi.advanceTimersByTimeAsync(700);
        expect(settings.paths.inputDirectory).toBe("/new");
    });

    it("ignores stale saves when another path is entered while a request is pending", async () => {
        const { settings, input } = register();
        await vi.advanceTimersByTimeAsync(0);
        let finishFirst!: (value: any) => void;
        vi.mocked(setInputDirectorySetting).mockImplementationOnce(
            () => new Promise((resolve) => { finishFirst = resolve; }),
        );
        input.onChange("/first");
        await vi.advanceTimersByTimeAsync(700);
        const options = vi.mocked(setInputDirectorySetting).mock.calls[0][1];
        input.onChange("/second");
        expect(options?.signal.aborted).toBe(true);
        finishFirst({ ok: true, data: { input_directory: "/first" } });
        await vi.advanceTimersByTimeAsync(0);
        expect(settings.paths.inputDirectory).toBe("/second");
        await vi.advanceTimersByTimeAsync(700);
        expect(settings.paths.inputDirectory).toBe("/second");
    });
});
