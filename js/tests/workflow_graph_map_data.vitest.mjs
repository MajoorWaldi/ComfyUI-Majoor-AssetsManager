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
