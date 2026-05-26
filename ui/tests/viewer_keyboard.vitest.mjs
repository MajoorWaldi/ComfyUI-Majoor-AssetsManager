import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../app/toast.js", () => ({
    comfyToast: vi.fn(),
}));

vi.mock("../app/i18n.js", () => ({
    t: (_key, fallback, params) => {
        if (!params || typeof fallback !== "string") return fallback || "";
        return fallback.replace(/\{(\w+)\}/g, (_match, name) => String(params[name] ?? ""));
    },
}));

vi.mock("../features/panel/controllers/hotkeysState.js", () => ({
    isHotkeysSuspended: () => false,
}));

function createWindowMock() {
    const listeners = new Map();
    return {
        listeners,
        addEventListener(type, handler) {
            if (!listeners.has(type)) listeners.set(type, new Set());
            listeners.get(type).add(handler);
        },
        removeEventListener(type, handler) {
            listeners.get(type)?.delete(handler);
        },
        dispatch(type, event) {
            for (const handler of Array.from(listeners.get(type) || [])) {
                handler(event);
            }
        },
    };
}

function createKeyboardEvent(key) {
    return {
        key,
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        target: { tagName: "DIV", closest: () => null, isContentEditable: false },
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        stopImmediatePropagation: vi.fn(),
    };
}

describe("viewer keyboard", () => {
    beforeEach(() => {
        const windowMock = createWindowMock();
        globalThis.window = windowMock;
        globalThis.document = {
            fullscreenElement: null,
            exitFullscreen: vi.fn(),
            activeElement: null,
        };
        Object.defineProperty(globalThis, "navigator", {
            configurable: true,
            value: { clipboard: { writeText: vi.fn() } },
        });
    });

    it("toggles distraction-free mode with X only while bound", async () => {
        const { installViewerKeyboard } = await import("../features/viewer/keyboard.js");
        const state = {
            mode: "single",
            assets: [{ id: 1, kind: "image" }],
            currentIndex: 0,
            distractionFree: false,
        };
        const closeViewer = vi.fn();
        const applyDistractionFreeUI = vi.fn();
        const keyboard = installViewerKeyboard({
            overlay: {
                style: { display: "flex" },
                requestFullscreen: vi.fn(),
                contains: () => true,
            },
            singleView: { querySelector: () => null },
            state,
            VIEWER_MODES: { SINGLE: "single" },
            closeViewer,
            lifecycle: { unsubs: [] },
            syncToolsUIFromState: vi.fn(),
            applyDistractionFreeUI,
            renderGenInfoPanel: vi.fn(),
            setZoom: vi.fn(),
            scheduleOverlayRedraw: vi.fn(),
            scheduleApplyGrade: vi.fn(),
            navigateViewerAssets: vi.fn(),
            renderBadges: vi.fn(),
            updateAssetRating: vi.fn(),
            safeDispatchCustomEvent: vi.fn(),
            ASSET_RATING_CHANGED_EVENT: "rating",
            probeTooltip: { style: {} },
            loupeWrap: { style: {} },
            getVideoControls: vi.fn(),
        });

        keyboard.bind();
        window.dispatch("keydown", createKeyboardEvent("x"));
        expect(state.distractionFree).toBe(true);
        expect(applyDistractionFreeUI).toHaveBeenCalledTimes(1);

        keyboard.unbind();
        window.dispatch("keydown", createKeyboardEvent("x"));
        expect(state.distractionFree).toBe(true);
        expect(applyDistractionFreeUI).toHaveBeenCalledTimes(1);
        expect(closeViewer).not.toHaveBeenCalled();
    });

    it("routes Escape to closeViewer only while bound", async () => {
        const { installViewerKeyboard } = await import("../features/viewer/keyboard.js");
        const closeViewer = vi.fn();
        const keyboard = installViewerKeyboard({
            overlay: {
                style: { display: "flex" },
                requestFullscreen: vi.fn(),
                contains: () => true,
            },
            singleView: { querySelector: () => null },
            state: {
                mode: "single",
                assets: [{ id: 1, kind: "image" }],
                currentIndex: 0,
                distractionFree: false,
            },
            VIEWER_MODES: { SINGLE: "single" },
            closeViewer,
            lifecycle: { unsubs: [] },
            syncToolsUIFromState: vi.fn(),
            applyDistractionFreeUI: vi.fn(),
            renderGenInfoPanel: vi.fn(),
            setZoom: vi.fn(),
            scheduleOverlayRedraw: vi.fn(),
            scheduleApplyGrade: vi.fn(),
            navigateViewerAssets: vi.fn(),
            renderBadges: vi.fn(),
            updateAssetRating: vi.fn(),
            safeDispatchCustomEvent: vi.fn(),
            ASSET_RATING_CHANGED_EVENT: "rating",
            probeTooltip: { style: {} },
            loupeWrap: { style: {} },
            getVideoControls: vi.fn(),
        });

        keyboard.bind();
        window.dispatch("keydown", createKeyboardEvent("Escape"));
        expect(closeViewer).toHaveBeenCalledTimes(1);

        keyboard.unbind();
        window.dispatch("keydown", createKeyboardEvent("Escape"));
        expect(closeViewer).toHaveBeenCalledTimes(1);
    });
});
