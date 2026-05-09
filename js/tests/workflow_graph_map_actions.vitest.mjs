// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest";

import { setComfyApp } from "../app/comfyApiBridge.js";
import { transferNodeParamsToSelectedCanvasNode } from "../features/viewer/workflowGraphMap/workflowGraphMapActions.js";

describe("workflow graph map actions", () => {
    beforeEach(() => {
        setComfyApp({
            canvas: {
                selected_nodes: {},
                setDirty: vi.fn(),
                draw: vi.fn(),
            },
            graph: {
                setDirtyCanvas: vi.fn(),
                change: vi.fn(),
            },
        });
    });

    it("transfers source widget values to the selected canvas node by widget name", () => {
        const target = {
            id: 104,
            type: "WanMoekSamplerAdvanced",
            widgets: [
                { name: "boundary", type: "float", value: 0 },
                { name: "add_noise", type: "combo", value: "disable" },
                { name: "noise_seed", type: "int", value: 1 },
                { name: "control_after_generate", type: "combo", value: "fixed" },
                { name: "steps", type: "int", value: 1 },
            ],
        };
        const app = setComfyApp({
            canvas: {
                selected_nodes: { 104: target },
                setDirty: vi.fn(),
                draw: vi.fn(),
            },
            graph: {
                setDirtyCanvas: vi.fn(),
                change: vi.fn(),
            },
        });

        const result = transferNodeParamsToSelectedCanvasNode({
            id: 12,
            type: "WanMoekSamplerAdvanced",
            inputs: [
                { name: "model_high_noise", link: 1 },
                { name: "positive", link: 2 },
                { name: "boundary", widget: true },
                { name: "add_noise", widget: true },
                { name: "noise_seed", widget: true },
                { name: "control_after_generate", widget: true },
                { name: "steps", widget: true },
            ],
            widgets_values: [0.9, "enable", 131289120546304, "randomize", 20],
        });

        expect(result.ok).toBe(true);
        expect(result.count).toBe(5);
        expect(target.widgets.map((widget) => widget.value)).toEqual([
            0.9,
            "enable",
            131289120546304,
            "randomize",
            20,
        ]);
        expect(app.canvas.setDirty).toHaveBeenCalled();
        expect(app.graph.change).toHaveBeenCalled();
    });
});
