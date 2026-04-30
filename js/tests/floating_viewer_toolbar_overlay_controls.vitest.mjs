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
        toggle() {
            this.isVisible = !this.isVisible;
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

vi.mock("../components/sidebar/parsers/geninfoParser.js", () => ({
    normalizeGenerationMetadata: vi.fn((v) => v),
    sanitizePromptForDisplay: vi.fn((v) => v),
}));

describe("floating viewer toolbar overlay controls", () => {
    it("renders guides and mask/format controls in the toolbar", async () => {
        const { buildFloatingViewerToolbar } =
            await import("../features/viewer/floatingViewerUi.js");

        const viewer = {
            element: document.createElement("div"),
            _channel: "rgb",
            _exposureEV: 0,
            _gridMode: 0,
            _overlayFormat: "image",
            _overlayMaskOpacity: 0.65,
            _overlayMaskEnabled: false,
            _updateModeBtnUI: vi.fn(),
            _updatePinUI: vi.fn(),
            _updateGenBtnUI: vi.fn(),
            _bindDocumentUiHandlers: vi.fn(),
            _redrawOverlayGuides: vi.fn(),
        };

        const bar = buildFloatingViewerToolbar(viewer);

        expect(bar.querySelector(".mjr-mfv-guides-trigger")).toBeTruthy();
        expect(bar.querySelector(".mjr-mfv-ch-trigger")).toBeTruthy();
        expect(viewer._guidesSelect).toBeTruthy();
        expect(viewer._channelSelect).toBeTruthy();
        expect(viewer._exposureCtl?.input).toBeTruthy();
        expect(viewer._formatSelect).toBeTruthy();
        expect(viewer._formatToggle).toBeTruthy();
        expect(viewer._maskOpacityCtl?.input).toBeTruthy();
        expect(viewer._guidesSelect.value).toBe("0");
        expect(viewer._channelSelect.value).toBe("rgb");
        // When _overlayMaskEnabled is false, format initialises to "off"
        expect(viewer._formatSelect.value).toBe("off");
    });
});
