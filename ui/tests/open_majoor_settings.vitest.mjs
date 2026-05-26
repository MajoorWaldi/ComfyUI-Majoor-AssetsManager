// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest";

const buildMajoorSettingsMock = vi.fn();

vi.mock("../app/comfyApiBridge.js", () => ({
    getComfyApp: vi.fn(() => ({ id: "app" })),
}));

vi.mock("../app/i18n.js", () => ({
    t: (_key, fallback) => fallback || "",
}));

vi.mock("../app/settings/SettingsPanel.js", () => ({
    buildMajoorSettings: buildMajoorSettingsMock,
}));

describe("openMajoorSettings", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        document.head.innerHTML = "";
        buildMajoorSettingsMock.mockReset();
        buildMajoorSettingsMock.mockReturnValue([
            {
                id: "Majoor.Grid.ShowDetails",
                category: ["Majoor Assets Manager", "Cards", "Show card details"],
                name: "Show metadata panel",
                tooltip: "Show the bottom details panel",
                type: "boolean",
                defaultValue: true,
                onChange: vi.fn(),
            },
            {
                id: "Majoor.Cards.ThumbSize",
                category: ["Majoor Assets Manager", "Cards", "Card size"],
                name: "Card Size",
                type: "combo",
                defaultValue: "Medium",
                options: ["Small", "Medium", "Large"],
                onChange: vi.fn(),
            },
        ]);
    });

    it("opens the Majoor-owned settings dialog instead of generic Comfy open methods", async () => {
        const { openMajoorSettings } = await import("../app/openMajoorSettings.js");
        const app = {
            open: vi.fn(),
            ui: { open: vi.fn() },
        };

        const opened = openMajoorSettings(app);

        expect(opened).toBe(true);
        expect(app.open).not.toHaveBeenCalled();
        expect(app.ui.open).not.toHaveBeenCalled();
        expect(document.getElementById("mjr-settings-dialog")?.hidden).toBe(false);
        expect(document.querySelector(".mjr-settings-group-title")?.textContent).toBe("Cards");
        expect(document.querySelector(".mjr-settings-group-icon i")?.className).toBe(
            "pi pi-th-large",
        );
        expect(document.querySelector(".mjr-settings-group-meta")?.textContent).toBe(
            "2 settings",
        );
        expect(document.querySelector(".mjr-settings-group")?.open).toBe(false);
        expect(document.querySelector(".mjr-settings-name")?.textContent).toBe(
            "Show metadata panel",
        );
    });

    it("commits changes through the original Comfy settings definitions", async () => {
        const { openMajoorSettings } = await import("../app/openMajoorSettings.js");
        const definitions = buildMajoorSettingsMock();
        buildMajoorSettingsMock.mockReturnValue(definitions);

        openMajoorSettings({});
        const checkbox = document.querySelector("input[type='checkbox']");
        checkbox.checked = false;
        checkbox.dispatchEvent(new Event("change", { bubbles: true }));

        expect(definitions[0].onChange).toHaveBeenCalledWith(false);
        expect(definitions[0].defaultValue).toBe(false);
    });

    it("catches async setting failures instead of leaving unhandled rejections", async () => {
        const { openMajoorSettings } = await import("../app/openMajoorSettings.js");
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        const asyncFailure = vi.fn(async () => {
            throw new Error("backend failed");
        });
        buildMajoorSettingsMock.mockReturnValue([
            {
                id: "Majoor.Search.Vector",
                category: ["Majoor Assets Manager", "Search", "AI"],
                name: "AI semantic search",
                type: "boolean",
                defaultValue: true,
                onChange: asyncFailure,
            },
        ]);

        openMajoorSettings({});
        const checkbox = document.querySelector("input[type='checkbox']");
        checkbox.checked = false;
        checkbox.dispatchEvent(new Event("change", { bubbles: true }));
        await Promise.resolve();

        expect(asyncFailure).toHaveBeenCalledWith(false);
        expect(errorSpy).toHaveBeenCalledWith(
            "[Majoor] settings change failed",
            expect.any(Error),
        );
        errorSpy.mockRestore();
    });

    it("filters settings inside the Majoor dialog", async () => {
        const { openMajoorSettings } = await import("../app/openMajoorSettings.js");

        openMajoorSettings({});
        const search = document.querySelector(".mjr-settings-search");
        search.value = "card size";
        search.dispatchEvent(new Event("input", { bubbles: true }));

        const names = Array.from(document.querySelectorAll(".mjr-settings-name")).map((el) =>
            el.textContent,
        );
        expect(names).toEqual(["Card Size"]);
        expect(document.querySelector(".mjr-settings-group")?.open).toBe(true);
    });
});
