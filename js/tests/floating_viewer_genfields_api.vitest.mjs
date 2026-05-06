// @vitest-environment happy-dom

import { describe, expect, it, vi } from "vitest";

vi.mock("../app/i18n.js", () => ({
    t: (_key, fallback) => fallback || "",
}));

vi.mock("../app/events.js", () => ({
    EVENTS: {},
}));

vi.mock("../app/config.js", () => ({
    APP_CONFIG: {},
}));

vi.mock("../utils/tooltipShortcuts.js", () => ({
    appendTooltipHint: vi.fn(),
    setTooltipHint: vi.fn(),
}));

vi.mock("../features/viewer/nodeStream/nodeStreamFeatureFlag.js", () => ({
    NODE_STREAM_FEATURE_ENABLED: false,
}));

vi.mock("../features/viewer/workflowSidebar/WorkflowSidebar.js", () => ({
    WorkflowSidebar: class {
        constructor() {
            this.el = document.createElement("div");
            this.isVisible = false;
        }
    },
}));

vi.mock("../features/viewer/workflowSidebar/sidebarRunButton.js", () => ({
    createRunButton: () => ({ el: document.createElement("div") }),
}));

vi.mock("../features/viewer/floatingViewerProgress.js", () => ({
    buildFloatingViewerMediaProgressOverlay: () => document.createElement("div"),
    buildFloatingViewerProgressBar: () => document.createElement("div"),
}));

describe("floating viewer gen fields api summary", () => {
    it("prepends readable API workflow and provider to compact model summary", async () => {
        const { getFloatingViewerGenFields } = await import("../features/viewer/floatingViewerUi.js");

        const fields = getFloatingViewerGenFields(null, {
            geninfo: {
                engine: {
                    type: "img2vid",
                    sampler_mode: "api",
                    api_provider: "happy_horse",
                },
                checkpoint: { name: "happyhorse-1.0-i2v" },
                positive: { value: "girl on a steampunk ship" },
                seed: { value: 123 },
            },
        });

        expect(fields.prompt).toBe("girl on a steampunk ship");
        expect(fields.seed).toBe("123");
        expect(fields.model).toBe("API Image-to-Video • Happy Horse | happyhorse-1.0-i2v");
    });
});
