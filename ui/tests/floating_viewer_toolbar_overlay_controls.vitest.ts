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

const openMajoorSettingsMock = vi.fn();

vi.mock("../app/openMajoorSettings.js", () => ({
    openMajoorSettings: openMajoorSettingsMock,
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
            (this as any).el = document.createElement("div");
            (this as any).isVisible = false;
        }
        toggle() {
            (this as any).isVisible = !(this as any).isVisible;
        }
    },
}));

vi.mock("../features/viewer/workflowSidebar/sidebarRunButton.js", () => ({
    createRunButton: () => {
        const el = document.createElement("div");
        el.className = "mjr-mfv-run-controls";
        const stop = document.createElement("button");
        stop.className = "mjr-icon-btn mjr-mfv-stop-btn";
        el.appendChild(stop);
        return { el };
    },
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
        expect((viewer as any)._guidesSelect).toBeTruthy();
        expect((viewer as any)._channelSelect).toBeTruthy();
        expect((viewer as any)._exposureCtl?.input).toBeTruthy();
        expect((viewer as any)._formatSelect).toBeTruthy();
        expect((viewer as any)._formatToggle).toBeTruthy();
        expect((viewer as any)._maskOpacityCtl?.input).toBeTruthy();
        expect((viewer as any)._guidesSelect.value).toBe("0");
        expect((viewer as any)._channelSelect.value).toBe("rgb");
        // When _overlayMaskEnabled is false, format initialises to "off"
        expect((viewer as any)._formatSelect.value).toBe("off");
    });

    it("renders a Majoor settings shortcut beside the MFV stop controls", async () => {
        const { buildFloatingViewerToolbar, rebindFloatingViewerControlHandlers } =
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
            _updateSettingsBtnState: vi.fn(),
        };

        const bar = buildFloatingViewerToolbar(viewer);
        rebindFloatingViewerControlHandlers(viewer);

        const stopControls = Array.from(bar.children).find((child) =>
            child.classList?.contains("mjr-mfv-run-controls"),
        );
        const settingsBtn = bar.querySelector(".mjr-mfv-majoor-settings-btn");

        expect(settingsBtn).toBeTruthy();
        expect(settingsBtn?.previousElementSibling).toBe(stopControls);
        expect(settingsBtn?.querySelector("i")?.className).toBe("pi pi-cog");

        settingsBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));

        expect(openMajoorSettingsMock).toHaveBeenCalledTimes(1);
    });
});
