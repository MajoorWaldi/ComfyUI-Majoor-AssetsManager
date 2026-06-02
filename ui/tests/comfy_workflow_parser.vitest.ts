import { describe, expect, it } from "vitest";

import { parseComfyUIWorkflow } from "../components/sidebar/parsers/comfyWorkflowParser.js";

describe("comfy workflow parser", () => {
    it("extracts metadata from official saved workflow nodes", () => {
        const parsed = parseComfyUIWorkflow({
            nodes: [
                {
                    id: 1,
                    type: "CLIPTextEncode",
                    title: "Positive Prompt",
                    inputs: [{ name: "text", type: "STRING", widget: { name: "text" } }],
                    widgets_values: ["cinematic saved workflow prompt"],
                },
                {
                    id: 2,
                    type: "KSampler",
                    inputs: [
                        { name: "seed", type: "INT", widget: { name: "seed" } },
                        { name: "steps", type: "INT", widget: { name: "steps" } },
                        { name: "cfg", type: "FLOAT", widget: { name: "cfg" } },
                        { name: "sampler_name", type: "COMBO", widget: { name: "sampler_name" } },
                    ],
                    widgets_values: [1234, 24, 7.5, "euler"],
                },
            ],
        });

        expect(parsed).toMatchObject({
            prompt: "cinematic saved workflow prompt",
            seed: 1234,
            steps: 24,
            cfg: 7.5,
            sampler: "euler",
        });
    });

    it("extracts metadata from template wrappers and subgraph definitions", () => {
        const parsed = parseComfyUIWorkflow({
            template: {
                nodes: [{ id: 10, type: "shared-subgraph" }],
                definitions: {
                    subgraphs: [
                        {
                            id: "shared-subgraph",
                            name: "Prompt Subgraph",
                            nodes: [
                                {
                                    id: 1,
                                    type: "CLIPTextEncode",
                                    title: "Negative Prompt",
                                    inputs: [{ name: "text", type: "STRING", widget: { name: "text" } }],
                                    widgets_values: ["low quality, blurry"],
                                },
                                {
                                    id: 2,
                                    type: "CheckpointLoaderSimple",
                                    inputs: [{ name: "ckpt_name", type: "COMBO", widget: { name: "ckpt_name" } }],
                                    widgets_values: ["model.safetensors"],
                                },
                            ],
                        },
                    ],
                },
            },
        });

        expect(parsed).toMatchObject({
            negative_prompt: "low quality, blurry",
            model: "model.safetensors",
        });
    });
});
