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

    it("does not mix prompt samplers with workflow subgraph UI nodes", () => {
        const prompt = {
            "34:14": {
                class_type: "SamplerCustom",
                inputs: {
                    noise: ["34:13", 0],
                    guider: ["34:15", 0],
                    sampler: ["34:17", 0],
                    sigmas: ["34:16", 0],
                    latent_image: ["34:8", 0],
                },
            },
            "34:13": { class_type: "RandomNoise", inputs: { noise_seed: 455122126103069 } },
            "34:15": { class_type: "CFGGuider", inputs: { cfg: 1 } },
            "34:16": { class_type: "BasicScheduler", inputs: { scheduler: "simple", steps: 4, denoise: 1 } },
            "34:17": { class_type: "KSamplerSelect", inputs: { sampler_name: "euler" } },
            "34:8": { class_type: "EmptyLatentImage", inputs: {} },
        };
        const workflow = {
            nodes: [{ id: 34, type: "subgraph-id" }],
            definitions: {
                subgraphs: [
                    {
                        id: "subgraph-id",
                        nodes: [
                            {
                                id: 14,
                                type: "SamplerCustom",
                                inputs: [
                                    { name: "enabled", type: "BOOLEAN", widget: { name: "enabled" } },
                                    { name: "pass", type: "INT", widget: { name: "pass" } },
                                ],
                                widgets_values: [true, 1],
                            },
                        ],
                    },
                ],
            },
        };

        const parsed = parseComfyUIWorkflow({ prompt, workflow });

        expect(parsed).toMatchObject({
            sampler: "euler",
            scheduler: "simple",
            steps: 4,
            cfg: 1,
            denoise: 1,
            seed: 455122126103069,
        });
        expect(parsed?.all_samplers).toBeUndefined();
    });
});
