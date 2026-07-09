// @vitest-environment happy-dom

import { describe, expect, it, vi } from "vitest";

import { WorkflowGraphMapPanel } from "../features/viewer/workflowGraphMap/WorkflowGraphMapPanel.js";

describe("WorkflowGraphMapPanel drag", () => {
    it("tracks graph-map pan through window-level pointer events", () => {
        const windowListeners = new Map();
        const win = {
            addEventListener: vi.fn((type, handler) => windowListeners.set(type, handler)),
            removeEventListener: vi.fn((type) => windowListeners.delete(type)),
            setTimeout: (fn) => fn(),
        };
        const panel = new WorkflowGraphMapPanel({ large: true });
        panel._workflow = { nodes: [], links: [] };
        panel._view = { zoom: 1, centerX: 100, centerY: 200 };
        panel._renderInfo = { resolvedView: { renderScale: 2, centerX: 100, centerY: 200 } };
        panel._renderCanvas = vi.fn();
        panel._renderDetails = vi.fn();
        panel._canvas = {
            ownerDocument: { defaultView: win },
            setPointerCapture: vi.fn(),
            releasePointerCapture: vi.fn(),
        };

        panel._handlePointerDown({
            button: 0,
            pointerId: 2,
            clientX: 40,
            clientY: 60,
            preventDefault: vi.fn(),
        });

        expect(win.addEventListener).toHaveBeenCalledWith("pointermove", expect.any(Function));
        windowListeners.get("pointermove")({ pointerId: 2, clientX: 60, clientY: 90 });

        expect(panel._view.centerX).toBe(90);
        expect(panel._view.centerY).toBe(185);
        expect(panel._renderCanvas).toHaveBeenCalledTimes(1);
        expect(panel._renderDetails).toHaveBeenCalledTimes(1);

        windowListeners.get("pointerup")({ pointerId: 2 });
        expect(panel._canvas.releasePointerCapture).toHaveBeenCalledWith(2);
        expect(win.removeEventListener).toHaveBeenCalledWith("pointermove", expect.any(Function));
        expect(panel._drag).toBeNull();
    });

    it("allows deep wheel zoom for inspecting dense nested subgraphs", () => {
        const panel = new WorkflowGraphMapPanel({ large: true });
        panel._workflow = { nodes: [{ id: 1, pos: [0, 0], size: [100, 80] }], links: [] };
        panel._view = { zoom: 8, centerX: 100, centerY: 100 };
        panel._renderInfo = {
            resolvedView: {
                renderScale: 2,
                viewMinX: 0,
                viewMinY: 0,
                visibleW: 200,
                visibleH: 120,
                pad: 6,
            },
        };
        panel._canvas = {
            getBoundingClientRect: () => ({ left: 0, top: 0 }),
        };
        panel.refresh = vi.fn();

        panel._handleWheel({
            deltaY: -1,
            clientX: 50,
            clientY: 40,
            preventDefault: vi.fn(),
        });

        expect(panel._view.zoom).toBeGreaterThan(8);
        expect(panel._view.zoom).toBeLessThanOrEqual(64);
        expect(panel.refresh).toHaveBeenCalledTimes(1);
    });
});
