import { Window } from "happy-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("../app/i18n.js", () => ({
    t: (_key, fallback, params) => {
        if (!params || typeof fallback !== "string") return fallback || "";
        return fallback.replace(/\{(\w+)\}/g, (_match, name) => String(params[name] ?? ""));
    },
}));

describe("viewer toolbar", () => {
    it("reset restores all viewer tool defaults", async () => {
        const window = new Window();
        globalThis.window = window;
        globalThis.document = window.document;
        Object.defineProperty(globalThis, "navigator", {
            configurable: true,
            value: window.navigator,
        });

        const { createViewerToolbar } = await import("../features/viewer/toolbar.js");

        const state = {
            assets: [{ id: 1, kind: "image" }],
            currentIndex: 0,
            mode: "ab_compare",
            channel: "alpha",
            exposureEV: 2.5,
            gamma: 2.2,
            analysisMode: "zebra",
            scopesMode: "both",
            gridMode: 4,
            overlayMaskEnabled: true,
            overlayMaskOpacity: 0.2,
            overlayFormat: "16:9",
            probeEnabled: true,
            loupeEnabled: true,
            hudEnabled: false,
            distractionFree: true,
            genInfoOpen: false,
            abCompareMode: "difference",
            audioVisualizerMode: "simple",
        };

        const onToolsChanged = vi.fn();
        const onCompareModeChanged = vi.fn();
        const onAudioVizModeChanged = vi.fn();

        const toolbar = createViewerToolbar({
            VIEWER_MODES: {
                SINGLE: "single",
                AB_COMPARE: "ab_compare",
                SIDE_BY_SIDE: "side_by_side",
            },
            state,
            lifecycle: { unsubs: [] },
            onToolsChanged,
            onCompareModeChanged,
            onAudioVizModeChanged,
            getCanAB: () => true,
        });

        toolbar.syncToolsUIFromState();

        const resetButton = Array.from(toolbar.headerEl.querySelectorAll("button")).find(
            (button) => (button.textContent || "").trim() === "Reset",
        );

        expect(resetButton).toBeTruthy();

        resetButton.click();

        expect(state.channel).toBe("rgb");
        expect(state.exposureEV).toBe(0);
        expect(state.gamma).toBe(1);
        expect(state.analysisMode).toBe("none");
        expect(state.scopesMode).toBe("off");
        expect(state.gridMode).toBe(0);
        expect(state.overlayMaskEnabled).toBe(false);
        expect(state.overlayMaskOpacity).toBe(0.65);
        expect(state.overlayFormat).toBe("image");
        expect(state.probeEnabled).toBe(false);
        expect(state.loupeEnabled).toBe(false);
        expect(state.hudEnabled).toBe(true);
        expect(state.distractionFree).toBe(false);
        expect(state.genInfoOpen).toBe(true);
        expect(state.abCompareMode).toBe("wipe");
        expect(state.audioVisualizerMode).toBe("artistic");
        expect(onCompareModeChanged).toHaveBeenCalledTimes(1);
        expect(onAudioVizModeChanged).toHaveBeenCalledTimes(1);
        expect(onToolsChanged).toHaveBeenCalledTimes(1);
    });
});
