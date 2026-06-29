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

    it("keeps prompt from metadata_raw when top-level geninfo is partial", () => {
        const state = buildGenerationSectionState({
            id: 13008,
            kind: "image",
            filename: "Krea2_turbo_00001_.png",
            geninfo: {
                models: {
                    unet: { name: "krea2_turbo_fp8_scaled" },
                    clip: { name: "qwen3vl_4b_fp8_scaled" },
                    vae: { name: "qwen_image_vae" },
                },
                seed: { value: 397747871968973 },
                sampler: { name: "euler" },
                steps: { value: 8 },
            },
            metadata_raw: {
                geninfo: {
                    positive: {
                        value: "A high-resolution, surreal digital illustration showing a hand holding a martini glass.",
                    },
                    models: {
                        unet: { name: "krea2_turbo_fp8_scaled" },
                        clip: { name: "qwen3vl_4b_fp8_scaled" },
                        vae: { name: "qwen_image_vae" },
                    },
                    seed: { value: 397747871968973 },
                    sampler: { name: "euler" },
                    steps: { value: 8 },
                },
            },
        });

        expect(state.kind).toBe("full");
        expect(state.positivePrompt).toBe(
            "A high-resolution, surreal digital illustration showing a hand holding a martini glass.",
        );
        expect(state.modelFields).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ label: "UNet", value: "krea2_turbo_fp8_scaled" }),
            ]),
        );
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
                expect.objectContaining({ label: "CLIP", value: "umt5_xxl_fp8_e4m3fn_scaled" }),
                expect.objectContaining({ label: "VAE", value: "wan_2.1_vae" }),
            ]),
        );
        expect(state.modelFields.find((item) => item.label === "UNet High Noise")).toBeFalsy();
        expect(state.modelFields.find((item) => item.label === "UNet Low Noise")).toBeFalsy();
        expect(state.modelFields.find((item) => item.label === "UNet")).toBeFalsy();
        expect(state.samplingFields).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ label: "Steps", value: 8 }),
                expect.objectContaining({ label: "CFG High Noise", value: 1 }),
                expect.objectContaining({ label: "CFG Low Noise", value: 1 }),
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

    it("labels ComfyUI native sampler passes from upstream latent nodes", () => {
        const state = buildGenerationSectionState({
            id: 101,
            kind: "image",
            metadata: {
                prompt: {
                    "3": {
                        class_type: "KSampler",
                        inputs: {
                            seed: 1,
                            steps: 8,
                            cfg: 1,
                            sampler_name: "lcm",
                            scheduler: "simple",
                            denoise: 1,
                            latent_image: ["5", 0],
                        },
                    },
                    "5": {
                        class_type: "EmptyLatentImage",
                        inputs: { width: 512, height: 512, batch_size: 1 },
                    },
                    "9": {
                        class_type: "LatentUpscale",
                        inputs: { samples: ["3", 0], width: 1024, height: 1024 },
                    },
                    "10": {
                        class_type: "KSampler",
                        inputs: {
                            seed: 2,
                            steps: 4,
                            cfg: 1,
                            sampler_name: "lcm",
                            scheduler: "simple",
                            denoise: 0.35,
                            latent_image: ["9", 0],
                        },
                    },
                },
            },
        });

        expect(state.pipelineTabs.map((tab) => tab.label)).toEqual([
            "Text-to-Image",
            "Upscale",
        ]);
    });

    it("extracts sampler custom stages and models from linked ComfyUI nodes", () => {
        const state = buildGenerationSectionState({
            id: 102,
            kind: "image",
            metadata: {
                prompt: {
                    "244": { class_type: "LoadImage", inputs: { image: "source.png" } },
                    "95:29": { class_type: "VAELoader", inputs: { vae_name: "FLUX/ae.safetensors" } },
                    "95:28": {
                        class_type: "UNETLoader",
                        inputs: { unet_name: "Z-IMAGE/TURBO/z_image_turbo_bf16.safetensors" },
                    },
                    "95:13": {
                        class_type: "EmptySD3LatentImage",
                        inputs: { width: 1024, height: 1024 },
                    },
                    "95:242": {
                        class_type: "VAEEncode",
                        inputs: { pixels: ["244", 0], vae: ["95:29", 0] },
                    },
                    "95:243": {
                        class_type: "ComfySwitchNode",
                        inputs: { switch: true, on_false: ["95:13", 0], on_true: ["95:242", 0] },
                    },
                    "95:11": {
                        class_type: "ModelSamplingAuraFlow",
                        inputs: { model: ["95:28", 0] },
                    },
                    "95:3": {
                        class_type: "KSampler",
                        inputs: {
                            seed: 100,
                            steps: 8,
                            cfg: 1,
                            sampler_name: "res_multistep",
                            scheduler: "simple",
                            denoise: 1,
                            model: ["95:11", 0],
                            latent_image: ["95:243", 0],
                        },
                    },
                    "94:82": {
                        class_type: "UNETLoader",
                        inputs: { unet_name: "pid_flux1_1024_to_4096_4step_bf16.safetensors" },
                    },
                    "94:76": { class_type: "KSamplerSelect", inputs: { sampler_name: "lcm" } },
                    "94:77": {
                        class_type: "BasicScheduler",
                        inputs: { scheduler: "simple", steps: 4, denoise: 1, model: ["94:82", 0] },
                    },
                    "94:84": {
                        class_type: "EmptyChromaRadianceLatentImage",
                        inputs: { width: 4096, height: 4096 },
                    },
                    "94:86": {
                        class_type: "PiDConditioning",
                        inputs: { latent: ["95:3", 0] },
                    },
                    "94:75": {
                        class_type: "SamplerCustom",
                        inputs: {
                            noise_seed: 3,
                            cfg: 1,
                            model: ["94:82", 0],
                            positive: ["94:86", 0],
                            sampler: ["94:76", 0],
                            sigmas: ["94:77", 0],
                            latent_image: ["94:84", 0],
                        },
                    },
                },
            },
        });

        expect(state.pipelineTabs.map((tab) => tab.label)).toEqual(["Image-to-Image", "Upscale"]);
        expect(state.pipelineTabs[0].fields).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    label: "Model",
                    value: "Z-IMAGE/TURBO/z_image_turbo_bf16.safetensors",
                }),
                expect.objectContaining({ label: "Sampler", value: "res_multistep" }),
            ]),
        );
        expect(state.pipelineTabs[1].fields).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    label: "Model",
                    value: "pid_flux1_1024_to_4096_4step_bf16.safetensors",
                }),
                expect.objectContaining({ label: "Sampler", value: "lcm" }),
                expect.objectContaining({ label: "Steps", value: "4" }),
            ]),
        );
    });
});
