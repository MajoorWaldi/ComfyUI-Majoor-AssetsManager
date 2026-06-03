// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest";

import { setComfyApp } from "../app/comfyApiBridge.js";
import { findWorkflowNode, resolveAssetWorkflow } from "../features/viewer/workflowGraphMap/workflowGraphMapData.js";
import {
    copyNodeJson,
    transferNodeParamsToSelectedCanvasNode,
} from "../features/viewer/workflowGraphMap/workflowGraphMapActions.js";

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

    it("transfers prompt-enriched subgraph sampler values instead of ambiguous widgets_values", () => {
        const target = {
            id: 3,
            type: "KSampler",
            widgets: [
                { name: "seed", type: "number", value: 0 },
                { name: "control_after_generate", type: "combo", value: "fixed" },
                { name: "steps", type: "number", value: 1 },
                { name: "cfg", type: "number", value: 0 },
                { name: "sampler_name", type: "combo", value: "euler" },
                { name: "scheduler", type: "combo", value: "normal" },
                { name: "denoise", type: "number", value: 0 },
            ],
        };
        setComfyApp({
            canvas: {
                selected_nodes: { 3: target },
                setDirty: vi.fn(),
                draw: vi.fn(),
            },
            graph: {
                setDirtyCanvas: vi.fn(),
                change: vi.fn(),
            },
        });
        const workflow = _makePromptEnrichedSamplerWorkflow();

        const result = transferNodeParamsToSelectedCanvasNode(findWorkflowNode(workflow, "95::3"));

        expect(result.ok).toBe(true);
        expect(result.count).toBe(6);
        expect(target.widgets.map((widget) => widget.value)).toEqual([
            1088132929177955,
            "fixed",
            8,
            1,
            "res_multistep",
            "simple",
            1,
        ]);
    });

    it("copies prompt-enriched sampler nodes with normalized widgets and no internal fields", async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: { writeText },
        });
        const workflow = _makePromptEnrichedSamplerWorkflow();
        const node = findWorkflowNode(workflow, "95::3");

        await expect(copyNodeJson(node)).resolves.toBe(true);

        const copied = JSON.parse(writeText.mock.calls[0][0]);
        expect(copied.widgets_values).toEqual([
            1088132929177955,
            "randomize",
            8,
            1,
            "res_multistep",
            "simple",
            1,
        ]);
        expect(copied._mjrPromptInputs).toBeUndefined();
        expect(copied._mjrSubgraphProxyParams).toBeUndefined();
    });
});

function _makePromptEnrichedSamplerWorkflow() {
    return resolveAssetWorkflow({
        workflow: {
            nodes: [
                {
                    id: 95,
                    type: "c20beb1e-2a45-4872-913e-21018c09c578",
                },
            ],
            definitions: {
                subgraphs: [
                    {
                        id: "c20beb1e-2a45-4872-913e-21018c09c578",
                        nodes: [
                            {
                                id: 3,
                                type: "KSampler",
                                inputs: [
                                    { name: "seed", type: "INT", link: 71, widget: { name: "seed" } },
                                    { name: "steps", type: "INT", link: 72, widget: { name: "steps" } },
                                ],
                                widgets_values: [
                                    1088132929177955,
                                    "randomize",
                                    8,
                                    1,
                                    "res_multistep",
                                    "simple",
                                    1,
                                ],
                            },
                        ],
                    },
                ],
            },
        },
        prompt: {
            "95:3": {
                class_type: "KSampler",
                inputs: {
                    seed: 1088132929177955,
                    steps: 8,
                    cfg: 1,
                    sampler_name: "res_multistep",
                    scheduler: "simple",
                    denoise: 1,
                },
            },
        },
    });
}
