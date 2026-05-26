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
});
