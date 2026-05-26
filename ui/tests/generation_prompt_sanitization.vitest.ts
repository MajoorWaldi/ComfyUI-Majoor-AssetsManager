// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";

import {
    normalizeGenerationMetadata,
    normalizePromptsForDisplay,
    sanitizePromptForDisplay,
} from "../components/sidebar/parsers/geninfoParser.js";
import { buildGenerationSectionState } from "../vue/components/panel/sidebar/generationSectionState.js";

describe("generation prompt sanitization", () => {
    it("drops filepath-like positive prompts from display", () => {
        expect(
            sanitizePromptForDisplay(
                "d:/__comfy_outputs/projects/veille/02_out/videos/260402/lidox.mp4",
            ),
        ).toBe("");
    });

    it("keeps natural-language prompts intact", () => {
        expect(sanitizePromptForDisplay("sunset over mountains, cinematic lighting")).toBe(
            "sunset over mountains, cinematic lighting",
        );
    });

    it("prevents alignment UI when the only prompt is a filepath", () => {
        const prompts = normalizePromptsForDisplay(
            "d:/__comfy_outputs/projects/veille/02_out/videos/260402/lidox.mp4",
            "",
        );
        expect(prompts.positive).toBe("");

        const state = buildGenerationSectionState({
            id: 8050,
            kind: "video",
            prompt: "d:/__comfy_outputs/projects/veille/02_out/videos/260402/lidox.mp4",
        });

        expect(state.kind).toBe("empty");
        expect(state.positivePrompt).toBe("");
        expect(state.showAlignment).toBe(false);
    });

    it("builds a readable workflow label for API nodes", () => {
        const state = buildGenerationSectionState({
            id: 13,
            kind: "video",
            geninfo: {
                engine: {
                    type: "img2vid",
                    sampler_mode: "api",
                    api_provider: "happy_horse",
                },
                checkpoint: { name: "happyhorse-1.0-i2v" },
                positive: { value: "steampunk ship girl with binoculars" },
            },
        });

        expect(state.workflowType).toBe("img2vid");
        expect(state.workflowLabel).toBe("API Image-to-Video");
        expect(state.workflowBadge).toBe("Happy Horse");
    });

    it("keeps explicit WAN high/low noise models distinct in generation state", () => {
        const state = buildGenerationSectionState({
            id: 99,
            kind: "video",
            geninfo: {
                positive: { value: "living gelatinous blob" },
                checkpoint: { name: "wan2.2_i2v_high_noise_14B_fp8_scaled" },
                models: {
                    unet: { name: "wan2.2_i2v_high_noise_14B_fp8_scaled" },
                    unet_high_noise: { name: "wan2.2_i2v_high_noise_14B_fp8_scaled" },
                    unet_low_noise: { name: "wan2.2_i2v_low_noise_14B_fp8_scaled" },
                    clip: { name: "umt5_xxl_fp8_e4m3fn_scaled" },
                    vae: { name: "wan_2.1_vae" },
                },
                model_groups: [
                    {
                        key: "high_noise",
                        label: "High Noise",
                        model: { name: "wan2.2_i2v_high_noise_14B_fp8_scaled" },
                        loras: [{ name: "high_noise_model_rank64", strength_model: 0.5 }],
                    },
                    {
                        key: "low_noise",
                        label: "Low Noise",
                        model: { name: "wan2.2_i2v_low_noise_14B_fp8_scaled" },
                        loras: [{ name: "low_noise_model_rank64", strength_model: 1.0 }],
                    },
                ],
                loras: [
                    { name: "high_noise_model_rank64", strength_model: 0.5 },
                    { name: "low_noise_model_rank64", strength_model: 1.0 },
                ],
                steps: { value: 8 },
                cfg_high_noise: { value: 1.0 },
                cfg_low_noise: { value: 1.0 },
            },
        });

        expect(state.kind).toBe("full");
        expect(state.modelGroups).toEqual([
            {
                key: "high_noise",
                label: "High Noise",
                model: "wan2.2_i2v_high_noise_14B_fp8_scaled",
                loras: ["high_noise_model_rank64 (m=0.5)"],
            },
            {
                key: "low_noise",
                label: "Low Noise",
                model: "wan2.2_i2v_low_noise_14B_fp8_scaled",
                loras: ["low_noise_model_rank64 (m=1)"],
            },
        ]);
        expect(state.modelFields).toEqual(
            expect.arrayContaining([
                { label: "CLIP", value: "umt5_xxl_fp8_e4m3fn_scaled" },
                { label: "VAE", value: "wan_2.1_vae" },
            ]),
        );
        expect(state.modelFields.find((item) => item.label === "UNet High Noise")).toBeFalsy();
        expect(state.modelFields.find((item) => item.label === "UNet Low Noise")).toBeFalsy();
        expect(state.modelFields.find((item) => item.label === "UNet")).toBeFalsy();
        expect(state.samplingFields).toEqual(
            expect.arrayContaining([
                { label: "Steps", value: 8 },
                { label: "CFG High Noise", value: 1 },
                { label: "CFG Low Noise", value: 1 },
            ]),
        );
        expect(state.modelFields.find((item) => item.label === "LoRAs")?.value).toContain(
            "high_noise_model_rank64 (m=0.5)",
        );
    });

    it("summarizes multi-model geninfo for normalized viewer consumers", () => {
        const normalized = normalizeGenerationMetadata({
            geninfo: {
                checkpoint: { name: "wan2.2_i2v_high_noise_14B_fp8_scaled" },
                models: {
                    unet_high_noise: { name: "wan2.2_i2v_high_noise_14B_fp8_scaled" },
                    unet_low_noise: { name: "wan2.2_i2v_low_noise_14B_fp8_scaled" },
                    clip: { name: "umt5_xxl_fp8_e4m3fn_scaled" },
                },
                model_groups: [{ key: "high_noise", label: "High Noise", model: { name: "wan2.2_i2v_high_noise_14B_fp8_scaled" }, loras: [] }],
            },
        });

        expect(normalized.models.unet_high_noise.name).toBe(
            "wan2.2_i2v_high_noise_14B_fp8_scaled",
        );
        expect(normalized.models.unet_low_noise.name).toBe(
            "wan2.2_i2v_low_noise_14B_fp8_scaled",
        );
        expect(normalized.model_groups[0].label).toBe("High Noise");
    });
});
