import { describe, expect, it, vi } from "vitest";

vi.mock("../app/i18n.js", () => ({
    t: (key, fallback) => fallback || key,
}));

vi.mock("../api/client.js", () => ({
    getLtxavRgbFallbackSettings: vi.fn(() => Promise.resolve({ ok: false })),
    setLtxavRgbFallbackSettings: vi.fn(() => Promise.resolve({ ok: true })),
}));

vi.mock("../app/toast.js", () => ({
    comfyToast: vi.fn(),
}));

describe("settingsViewer categories", () => {
    it("keeps MFV settings in a separate Floating Viewer block", async () => {
        const settings = {
            viewer: {
                allowPanAtZoom1: true,
                floatingPauseDuringExecution: true,
                mfvLiveDefault: true,
                mfvPreviewDefault: true,
                mfvSidebarPosition: "right",
                mfvPreviewMethod: "auto",
                ltxavRgbFallback: false,
            },
            workflowMinimap: { enabled: true },
        };
        const definitions = [];

        const mod = await import("../app/settings/settingsViewer.js");
        mod.registerViewerSettings(
            (definition) => definitions.push(definition),
            settings,
            vi.fn(),
        );

        const categoryById = new Map(
            definitions.map((definition) => [definition.id, definition.category?.[1]]),
        );

        expect(categoryById.get("Majoor.Viewer.AllowPanAtZoom1")).toBe("Viewer");
        expect(categoryById.get("Majoor.Viewer.DisableWebGL")).toBe("Viewer");
        expect(categoryById.get("Majoor.Viewer.PauseDuringExecution")).toBe("Viewer");
        expect(categoryById.get("Majoor.WorkflowMinimap.Enabled")).toBe("Viewer");

        expect(categoryById.get("Majoor.Viewer.FloatingPauseDuringExecution")).toBe(
            "Floating Viewer",
        );
        expect(categoryById.get("Majoor.Viewer.MfvLiveDefault")).toBe("Floating Viewer");
        expect(categoryById.get("Majoor.Viewer.MfvPreviewDefault")).toBe("Floating Viewer");
        expect(categoryById.has("Majoor.Viewer.MfvLiveAutoOpen")).toBe(false);
        expect(categoryById.has("Majoor.Viewer.MfvPreviewAutoOpen")).toBe(false);
        expect(categoryById.has("Majoor.Viewer.MfvNodeStreamAutoOpen")).toBe(false);
        expect(categoryById.get("Majoor.Viewer.MfvSidebarPosition")).toBe("Floating Viewer");
        expect(categoryById.get("Majoor.Viewer.MfvPreviewMethod")).toBe("Floating Viewer");
        expect(categoryById.get("Majoor.Viewer.LtxavRgbFallback")).toBe("Floating Viewer");
    });
});
