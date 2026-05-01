import { beforeEach, describe, expect, it, vi } from "vitest";

import {
    createPanelHotkeysController,
    setHotkeysSuspended,
} from "../features/panel/controllers/panelHotkeysController.js";
import { setHotkeysScope } from "../features/panel/controllers/hotkeysState.js";

const panelRuntimeState = vi.hoisted(() => ({
    activeGrid: null,
}));

vi.mock("../features/panel/panelRuntimeRefs.js", () => ({
    getActiveGridContainer: vi.fn(() => panelRuntimeState.activeGrid),
}));

function createWindowStub() {
    const listeners = new Map();
    return {
        addEventListener(type, handler) {
            if (!listeners.has(type)) listeners.set(type, new Set());
            listeners.get(type).add(handler);
        },
        removeEventListener(type, handler) {
            listeners.get(type)?.delete(handler);
        },
        dispatchEvent(event) {
            const handlers = Array.from(listeners.get(event?.type) || []);
            for (const handler of handlers) {
                handler(event);
            }
            return true;
        },
    };
}

function createBoundElement() {
    const listeners = new Map();
    return {
        _containsSet: new Set(),
        addEventListener(type, handler) {
            if (!listeners.has(type)) listeners.set(type, new Set());
            listeners.get(type).add(handler);
        },
        removeEventListener(type, handler) {
            listeners.get(type)?.delete(handler);
        },
        emit(type, event = {}) {
            const handlers = Array.from(listeners.get(type) || []);
            for (const handler of handlers) {
                handler(event);
            }
        },
        contains(target) {
            return this._containsSet.has(target);
        },
    };
}

function createKeyEvent(key, target = null, extras = {}) {
    return {
        key,
        target,
        ctrlKey: false,
        metaKey: false,
        altKey: false,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        stopImmediatePropagation: vi.fn(),
        ...extras,
    };
}

beforeEach(() => {
    globalThis.window = createWindowStub();
    globalThis.document = {
        body: { nodeName: "BODY" },
        activeElement: null,
    };
    panelRuntimeState.activeGrid = null;
    setHotkeysSuspended(false);
    setHotkeysScope(null);
});

describe("panelHotkeysController", () => {
    it("does not toggle the floating viewer with modified V so paste remains available", () => {
        const onToggleFloatingViewer = vi.fn();
        const controller = createPanelHotkeysController({ onToggleFloatingViewer });
        const boundEl = createBoundElement();

        controller.bind(boundEl);
        boundEl.emit("mouseenter");

        const event = createKeyEvent("v", null, { ctrlKey: true });
        window.dispatchEvent({ type: "keydown", ...event });

        expect(onToggleFloatingViewer).not.toHaveBeenCalled();
        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(event.stopPropagation).not.toHaveBeenCalled();
        expect(event.stopImmediatePropagation).not.toHaveBeenCalled();
    });

    it("toggles the floating viewer with plain V when body focus is on the panel context", () => {
        const onToggleFloatingViewer = vi.fn();
        const controller = createPanelHotkeysController({ onToggleFloatingViewer });
        const boundEl = createBoundElement();
        boundEl.isConnected = true;

        controller.bind(boundEl);
        document.activeElement = document.body;

        const event = createKeyEvent("v");
        window.dispatchEvent({ type: "keydown", ...event });

        expect(onToggleFloatingViewer).toHaveBeenCalledTimes(1);
        expect(event.preventDefault).toHaveBeenCalledTimes(1);
    });

    it("does not toggle the floating viewer while typing in an input", () => {
        const onToggleFloatingViewer = vi.fn();
        const controller = createPanelHotkeysController({ onToggleFloatingViewer });
        const boundEl = createBoundElement();

        controller.bind(boundEl);
        boundEl.emit("mouseenter");

        const target = {
            isContentEditable: false,
            closest: vi.fn(() => ({ tagName: "INPUT" })),
        };
        const event = createKeyEvent("v", target, { ctrlKey: true });
        window.dispatchEvent({ type: "keydown", ...event });

        expect(onToggleFloatingViewer).not.toHaveBeenCalled();
        expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it("does not hijack Ctrl+Shift+V", () => {
        const onToggleFloatingViewer = vi.fn();
        const controller = createPanelHotkeysController({ onToggleFloatingViewer });
        const boundEl = createBoundElement();

        controller.bind(boundEl);
        boundEl.emit("mouseenter");

        const event = createKeyEvent("v", null, { ctrlKey: true, shiftKey: true });
        window.dispatchEvent({ type: "keydown", ...event });

        expect(onToggleFloatingViewer).not.toHaveBeenCalled();
        expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it("lets grid navigation keys pass through when the active context is an asset grid", () => {
        const controller = createPanelHotkeysController();
        const boundEl = createBoundElement();
        const activeGrid = {
            contains: vi.fn((target) => target === document.body),
        };
        panelRuntimeState.activeGrid = activeGrid;
        boundEl.isConnected = true;

        controller.bind(boundEl);
        document.activeElement = document.body;

        const event = createKeyEvent("ArrowRight", {
            closest: vi.fn(() => activeGrid),
        });
        window.dispatchEvent({ type: "keydown", ...event });

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(event.stopPropagation).not.toHaveBeenCalled();
        expect(event.stopImmediatePropagation).not.toHaveBeenCalled();
    });
});
