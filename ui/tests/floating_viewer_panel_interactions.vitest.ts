import { describe, expect, it, vi } from "vitest";

import {
    initFloatingViewerDrag,
    initFloatingViewerEdgeResize,
    stopFloatingViewerEdgeResize,
} from "../features/viewer/floatingViewerPanel.js";

describe("floating viewer panel interactions", () => {
    it("tracks header drag through window-level pointer events", () => {
        const windowListeners = new Map();
        const addWindowListener = vi.fn((type, handler) => windowListeners.set(type, handler));
        const releasePointerCapture = vi.fn();
        const handle = {
            ownerDocument: { defaultView: { addEventListener: addWindowListener } },
            addEventListener: vi.fn((type, handler) => {
                if (type === "pointerdown") (handle as any)._down = handler;
            }),
            setPointerCapture: vi.fn(),
            releasePointerCapture,
        };
        const el = {
            offsetWidth: 200,
            offsetHeight: 100,
            style: {},
            getBoundingClientRect: () => ({ left: 30, top: 40, right: 230, bottom: 140 }),
        };
        const viewer = {
            element: el,
            _isPopped: false,
            _getResizeDirectionFromPoint: () => "",
        };

        globalThis.window = { innerWidth: 800, innerHeight: 600 } as any;

        initFloatingViewerDrag(viewer, handle as any);
        (handle as any)._down({
            button: 0,
            pointerId: 7,
            clientX: 50,
            clientY: 60,
            target: { closest: () => null },
            preventDefault: vi.fn(),
        });

        expect(addWindowListener).toHaveBeenCalledWith(
            "pointermove",
            expect.any(Function),
            expect.objectContaining({ signal: expect.any(AbortSignal) }),
        );

        windowListeners.get("pointermove")({ clientX: 150, clientY: 180 });
        expect((el.style as any).left).toBe("130px");
        expect((el.style as any).top).toBe("160px");

        windowListeners.get("pointerup")({});
        expect(releasePointerCapture).toHaveBeenCalledWith(7);
    });

    it("cleans resize window listeners when edge resize is stopped", () => {
        const abort = vi.fn();
        const viewer = {
            element: {
                releasePointerCapture: vi.fn(),
                classList: { remove: vi.fn() },
                style: {},
            },
            _resizeState: { pointerId: 3 },
            _resizeWindowCleanup: abort,
        };

        stopFloatingViewerEdgeResize(viewer);

        expect(abort).toHaveBeenCalledTimes(1);
        expect(viewer._resizeWindowCleanup).toBeNull();
        expect(viewer._resizeState).toBeNull();
    });

    it("binds active edge resize movement to the window", () => {
        const windowListeners = new Map();
        const addWindowListener = vi.fn((type, handler) => windowListeners.set(type, handler));
        const element = {
            ownerDocument: { defaultView: { addEventListener: addWindowListener } },
            style: {},
            classList: { add: vi.fn(), remove: vi.fn() },
            setPointerCapture: vi.fn(),
            releasePointerCapture: vi.fn(),
            getBoundingClientRect: () => ({
                left: 100,
                top: 100,
                right: 300,
                bottom: 250,
                width: 200,
                height: 150,
            }),
        };
        const viewer = {
            element,
            _isPopped: false,
            _panelAC: new AbortController(),
            _resizeState: null,
            _getResizeDirectionFromPoint: () => "se",
            _resizeCursorForDirection: () => "nwse-resize",
            _stopEdgeResize: vi.fn(() => {
                viewer._resizeState = null;
            }),
        };
        const addElementListener = vi.fn((type, handler) => {
            if (type === "pointerdown") (element as any)._down = handler;
        });
        (element as any).addEventListener = addElementListener;
        globalThis.window = {
            innerWidth: 1000,
            innerHeight: 800,
            getComputedStyle: () => ({ minWidth: "120", minHeight: "100" }) as any,
        } as any;

        initFloatingViewerEdgeResize(viewer, element as any);
        (element as any)._down({
            button: 0,
            pointerId: 11,
            clientX: 298,
            clientY: 248,
            preventDefault: vi.fn(),
            stopPropagation: vi.fn(),
        });

        expect(addWindowListener).toHaveBeenCalledWith(
            "pointermove",
            expect.any(Function),
            expect.objectContaining({ signal: expect.any(AbortSignal) }),
        );
        windowListeners.get("pointermove")({ pointerId: 11, clientX: 348, clientY: 288 });
        expect((element.style as any).width).toBe("250px");
        expect((element.style as any).height).toBe("190px");
    });

    it("does not steal clicks from toolbar buttons near a resize edge", () => {
        const addWindowListener = vi.fn();
        const element = {
            ownerDocument: { defaultView: { addEventListener: addWindowListener } },
            style: {},
            classList: { add: vi.fn(), remove: vi.fn() },
            setPointerCapture: vi.fn(),
            releasePointerCapture: vi.fn(),
            getBoundingClientRect: () => ({
                left: 100,
                top: 100,
                right: 300,
                bottom: 250,
                width: 200,
                height: 150,
            }),
        };
        const viewer = {
            element,
            _isPopped: false,
            _panelAC: new AbortController(),
            _resizeState: null,
            _getResizeDirectionFromPoint: () => "w",
            _resizeCursorForDirection: () => "ew-resize",
            _stopEdgeResize: vi.fn(),
        };
        const addElementListener = vi.fn((type, handler) => {
            if (type === "pointerdown") (element as any)._down = handler;
        });
        (element as any).addEventListener = addElementListener;
        globalThis.window = {
            innerWidth: 1000,
            innerHeight: 800,
            getComputedStyle: () => ({ minWidth: "120", minHeight: "100" }) as any,
        } as any;
        const preventDefault = vi.fn();
        const stopPropagation = vi.fn();

        initFloatingViewerEdgeResize(viewer, element as any);
        (element as any)._down({
            button: 0,
            pointerId: 12,
            clientX: 101,
            clientY: 120,
            target: { closest: (selector) => selector.includes("button") },
            preventDefault,
            stopPropagation,
        });

        expect(preventDefault).not.toHaveBeenCalled();
        expect(stopPropagation).not.toHaveBeenCalled();
        expect(element.setPointerCapture).not.toHaveBeenCalled();
        expect(addWindowListener).not.toHaveBeenCalled();
        expect(viewer._resizeState).toBeNull();
    });
});
