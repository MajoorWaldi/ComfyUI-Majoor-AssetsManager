// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";

import {
    getNodeDisplayName,
    getNodeInputSlotNames,
    getNodeParamEntries,
    getNodeTypeLabel,
    getNodeWidgetValueEntries,
    resolveAssetWorkflow,
} from "../features/viewer/workflowGraphMap/workflowGraphMapData.js";
import { synthesizeWorkflowFromPromptGraph } from "../components/sidebar/utils/minimap.js";

describe("workflow graph map data", () => {
    it("maps widgets_values to Comfy widget inputs without connected socket offset", () => {
        const node = {
            id: 104,
            type: "WanMoekSamplerAdvanced",
            inputs: [
                { name: "model_high_noise", link: 1 },
                { name: "model_low_noise", link: 2 },
                { name: "positive", link: 3 },
                { name: "negative", link: 4 },
                { name: "latent_image", link: 5 },
                { name: "boundary", widget: true },
                { name: "add_noise", widget: true },
                { name: "noise_seed", widget: true },
                { name: "control_after_generate", widget: true },
                { name: "steps", widget: true },
            ],
            widgets_values: [0.9, "enable", 131289120546304, "randomize", 20],
        };

        expect(getNodeInputSlotNames(node)).toEqual([
            "boundary",
            "add_noise",
            "noise_seed",
            "control_after_generate",
            "steps",
        ]);
        expect(getNodeParamEntries(node).slice(0, 5)).toEqual([
            ["boundary", 0.9],
            ["add_noise", "enable"],
            ["noise_seed", 131289120546304],
            ["control_after_generate", "randomize"],
            ["steps", 20],
        ]);
    });

    it("uses Comfy widget object metadata and skips linked non-widget inputs", () => {
        const node = {
            id: 7,
            type: "CustomSampler",
            inputs: [
                { name: "model", type: "MODEL", link: 1 },
                { name: "latent", type: "LATENT", link: 2 },
                { label: "scheduler mode", name: "scheduler", type: "COMBO", widget: { name: "scheduler" } },
                { label: "custom strength", name: "strength", type: "FLOAT", widget: { name: "strength" } },
            ],
            widgets_values: ["karras", 0.75],
        };

        expect(getNodeInputSlotNames(node)).toEqual(["scheduler mode", "custom strength"]);
        expect(getNodeWidgetValueEntries(node)).toEqual([
            { label: "scheduler mode", value: "karras", index: 0 },
            { label: "custom strength", value: 0.75, index: 1 },
        ]);
    });

    it("keeps linked widget labels and trailing unlinked widget inputs in widgets_values order", () => {
        const node = {
            id: 120,
            type: "WanFirstLastFrameToVideo",
            inputs: [
                { name: "positive", type: "CONDITIONING", link: 20 },
                { name: "negative", type: "CONDITIONING", link: 21 },
                { name: "vae", type: "VAE", link: 22 },
                { name: "width", type: "INT", link: 23, widget: { name: "width" } },
                { name: "height", type: "INT", link: 24, widget: { name: "height" } },
                { name: "length", type: "INT", link: 25, widget: { name: "length" } },
                { name: "batch_size", type: "INT" },
            ],
            widgets_values: [832, 480, 81, 1],
        };

        expect(getNodeInputSlotNames(node)).toEqual(["width", "height", "length", "batch_size"]);
        expect(getNodeParamEntries(node).slice(0, 4)).toEqual([
            ["width", 832],
            ["height", 480],
            ["length", 81],
            ["batch_size", 1],
        ]);
    });

    it("supports custom nodes that save widgets_values as a dictionary", () => {
        expect(
            getNodeWidgetValueEntries({
                type: "CustomNode",
                widgets_values: {
                    mode: "fast",
                    amount: 12,
                },
            }),
        ).toEqual([
            { label: "mode", value: "fast", index: 0 },
            { label: "amount", value: 12, index: 1 },
        ]);
    });

    it("extracts primitive and object params from synthesized prompt graphs", () => {
        const workflow = resolveAssetWorkflow({
            prompt: {
                85: {
                    class_type: "Power Lora Loader (rgthree)",
                    _meta: { title: "Power Lora Loader" },
                    inputs: {
                        model: ["140", 0],
                        clip: ["83", 0],
                        text: "cinematic portrait",
                        lora_2: {
                            on: true,
                            lora: "detailer.safetensors",
                            strength: 0.5,
                        },
                    },
                },
            },
        });

        const node = workflow.nodes.find((item) => String(item.id) === "85");
        expect(node.title).toBe("Power Lora Loader");
        expect(getNodeParamEntries(node)).toEqual([
            ["text", "cinematic portrait"],
            [
                "lora_2",
                {
                    on: true,
                    lora: "detailer.safetensors",
                    strength: 0.5,
                },
            ],
        ]);
    });

    it("treats colon-prefixed subgraph prompt references as links", () => {
        const prompt = {
            75: {
                inputs: {
                    filename_prefix: "video/LTX_2.3_i2v",
                    video: ["320:310", 0],
                },
                class_type: "SaveVideo",
                _meta: { title: "Save Video" },
            },
            "320:310": {
                inputs: {
                    fps: ["320:298", 0],
                    images: ["320:315", 0],
                    audio: ["320:297", 0],
                },
                class_type: "CreateVideo",
                _meta: { title: "Create Video" },
            },
            "320:298": {
                inputs: { expression: "a", "values.a": ["320:300", 0] },
                class_type: "ComfyMathExpression",
            },
            "320:300": {
                inputs: { value: 25 },
                class_type: "PrimitiveInt",
            },
        };

        const workflow = synthesizeWorkflowFromPromptGraph(prompt);
        const saveNode = workflow.nodes.find((node) => String(node.id) === "75");
        const createNode = workflow.nodes.find((node) => String(node.id) === "320:310");

        expect(workflow.links).toEqual(
            expect.arrayContaining([
                expect.arrayContaining(["320:310", 75]),
                expect.arrayContaining(["320:298", "320:310"]),
            ]),
        );
        expect(getNodeParamEntries(saveNode)).toEqual([["filename_prefix", "video/LTX_2.3_i2v"]]);
        expect(getNodeParamEntries(createNode)).toEqual([]);
    });

    it("uses readable names for opaque subgraph node types", () => {
        const workflow = resolveAssetWorkflow({
            workflow: {
                nodes: [
                    {
                        id: 20,
                        type: "12345678-1234-1234-1234-123456789abc",
                        properties: {},
                    },
                ],
                definitions: {
                    subgraphs: [
                        {
                            id: "12345678-1234-1234-1234-123456789abc",
                            name: "Face Detailer",
                            nodes: [],
                        },
                    ],
                },
            },
        });

        const node = workflow.nodes[0];
        expect(node.properties.subgraph_name).toBe("Face Detailer");
        expect(getNodeDisplayName(node)).toBe("Face Detailer");
        expect(getNodeTypeLabel(node)).toBe("Subgraph");
    });

    it("exposes subgraph proxy widget values on the parent node", () => {
        const workflow = resolveAssetWorkflow({
            workflow: {
                nodes: [
                    {
                        id: 320,
                        type: "2454ad83-157c-40dd-9f19-5daaf4041ce0",
                        properties: {
                            proxyWidgets: [
                                ["312", "value"],
                                ["299", "value"],
                                ["317", "text_encoder"],
                            ],
                        },
                    },
                ],
                definitions: {
                    subgraphs: [
                        {
                            id: "2454ad83-157c-40dd-9f19-5daaf4041ce0",
                            name: "Image to Video (LTX-2.3)",
                            inputs: [
                                { name: "value_2", label: "width" },
                                { name: "value_3", label: "height" },
                                { name: "text_encoder" },
                            ],
                            nodes: [
                                {
                                    id: 312,
                                    type: "PrimitiveInt",
                                    title: "Width",
                                    inputs: [],
                                    widgets_values: [1024],
                                },
                                {
                                    id: 299,
                                    type: "PrimitiveInt",
                                    title: "Height",
                                    inputs: [],
                                    widgets_values: [768],
                                },
                                {
                                    id: 317,
                                    type: "LTXAVTextEncoderLoader",
                                    title: "Text Encoder Loader",
                                    inputs: [{ name: "text_encoder", type: "COMBO", widget: { name: "text_encoder" } }],
                                    widgets_values: ["gemma_3_12B_it_fp4_mixed.safetensors"],
                                },
                            ],
                            links: [
                                [597, -10, 0, 312, 0, "INT"],
                                [598, -10, 1, 299, 0, "INT"],
                                [606, -10, 2, 317, 0, "COMBO"],
                            ],
                        },
                    ],
                },
            },
        });

        expect(getNodeParamEntries(workflow.nodes[0])).toEqual([
            ["width", 1024],
            ["height", 768],
            ["text_encoder", "gemma_3_12B_it_fp4_mixed.safetensors"],
        ]);
    });

    it("falls back to node title when the type is an opaque hash", () => {
        const node = {
            id: 7,
            type: "abcdefabcdefabcdefabcdefabcdefabcdef",
            title: "Regional Prompt",
        };

        expect(getNodeDisplayName(node)).toBe("Regional Prompt");
        expect(getNodeTypeLabel(node)).toBe("Subgraph");
    });
});
