// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";

import {
    normalizeGenerationMetadata,
    normalizePromptsForDisplay,
    sanitizePromptForDisplay,
} from "../components/sidebar/parsers/geninfoParser.js";
import { parseComfyUIWorkflow } from "../components/sidebar/parsers/comfyWorkflowParser.js";
import SidebarGenerationSection from "../vue/components/panel/sidebar/SidebarGenerationSection.vue";
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

    it("prefers canonical metadata_raw over stale top-level geninfo mirrors", () => {
        const state = buildGenerationSectionState({
            id: 13009,
            kind: "video",
            geninfo: {
                positive: { value: "stale top-level prompt" },
                seed: { value: 111 },
                sampler: { name: "stale_sampler" },
                steps: { value: 1 },
            },
            metadata_raw: {
                geninfo: {
                    positive: { value: "fresh metadata_raw prompt" },
                    seed: { value: 42 },
                    sampler: { name: "euler_cfg_pp" },
                    steps: { value: 3 },
                },
            },
        });

        expect(state.positivePrompt).toBe("fresh metadata_raw prompt");
        expect(state.samplingFields).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ label: "Seed", value: 42 }),
                expect.objectContaining({ label: "Sampler", value: "euler_cfg_pp" }),
                expect.objectContaining({ label: "Steps", value: 3 }),
            ]),
        );
    });

    it("deduplicates sampler passes when prompt and workflow contain the same sampler", () => {
        const prompt = {
            "1": {
                class_type: "KSampler",
                inputs: {
                    seed: 42,
                    steps: 3,
                    cfg: 1,
                    sampler_name: "euler_cfg_pp",
                    scheduler: "simple",
                    denoise: 1,
                },
            },
            "2": {
                class_type: "KSampler",
                inputs: {
                    seed: 43,
                    steps: 8,
                    cfg: 1,
                    sampler_name: "euler_ancestral_cfg_pp",
                    scheduler: "simple",
                    denoise: 1,
                },
            },
        };
        const workflow = {
            nodes: [
                { id: 1, type: "KSampler", inputs: prompt["1"].inputs },
                { id: 2, type: "KSampler", inputs: prompt["2"].inputs },
            ],
        };

        const parsed = parseComfyUIWorkflow({ prompt, workflow });

        expect(parsed?.all_samplers).toHaveLength(2);
        expect(parsed?.all_samplers).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ sampler_name: "euler_cfg_pp", seed: 42, steps: 3 }),
                expect.objectContaining({ sampler_name: "euler_ancestral_cfg_pp", seed: 43, steps: 8 }),
            ]),
        );
    });

    it("deduplicates a prompt sampler repeated inside a workflow subgraph", () => {
        const prompt = {
            "30:3": {
                class_type: "KSampler",
                inputs: {
                    seed: 1103244806536411,
                    steps: 8,
                    cfg: 1,
                    sampler_name: "euler",
                    scheduler: "simple",
                    denoise: 1,
                    model: ["30:22", 0],
                },
            },
            "30:22": {
                class_type: "UNETLoader",
                inputs: { unet_name: "krea2_turbo_fp8_scaled.safetensors" },
            },
        };
        const workflow = {
            definitions: {
                subgraphs: [
                    {
                        nodes: [
                            {
                                id: 3,
                                type: "KSampler",
                                inputs: [
                                    { name: "seed", type: "INT", widget: { name: "seed" } },
                                    { name: "steps", type: "INT", widget: { name: "steps" } },
                                    { name: "cfg", type: "FLOAT", widget: { name: "cfg" } },
                                    { name: "sampler_name", type: "COMBO", widget: { name: "sampler_name" } },
                                    { name: "scheduler", type: "COMBO", widget: { name: "scheduler" } },
                                    { name: "denoise", type: "FLOAT", widget: { name: "denoise" } },
                                ],
                                widgets_values: [
                                    1103244806536411,
                                    8,
                                    1,
                                    "euler",
                                    "simple",
                                    1,
                                ],
                            },
                        ],
                    },
                ],
            },
        };

        const parsed = parseComfyUIWorkflow({ prompt, workflow });
        const state = buildGenerationSectionState({
            id: 13013,
            kind: "image",
            metadata_raw: {
                prompt: JSON.stringify(prompt),
                workflow,
            },
        });

        expect(parsed?.all_samplers).toBeUndefined();
        expect(state.pipelineTabs).toHaveLength(0);
        expect(state.branchCards.filter((branch) => branch.samplingFields.length)).toHaveLength(0);
        expect(state.samplingFields).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ label: "Seed", value: 1103244806536411 }),
                expect.objectContaining({ label: "Steps", value: 8 }),
                expect.objectContaining({ label: "Sampler", value: "euler" }),
            ]),
        );
    });

    it("keeps shared base CLIP VAE and LoRAs visible when branch cards are used", () => {
        const state = buildGenerationSectionState({
            id: 13010,
            kind: "video",
            metadata_raw: {
                geninfo: {
                    models: {
                        checkpoint: { name: "ltx-2.3-22b-dev-fp8.safetensors" },
                        clip: { name: "t5xxl_fp8_e4m3fn.safetensors" },
                        vae: { name: "ltxv_vae.safetensors" },
                    },
                    loras: [
                        { name: "ltx2.3_audio_reactive_lora_v2.safetensors", strength_model: 1.2 },
                        { name: "ltx-2.3-22b-distilled-lora-384.safetensors", strength_model: 0.5 },
                    ],
                },
            },
        });

        expect(state.branchCards).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    key: "base",
                    label: "Base",
                    modelFields: expect.arrayContaining([
                        expect.objectContaining({ label: "Model", value: "ltx-2.3-22b-dev-fp8" }),
                        expect.objectContaining({ label: "CLIP", value: "t5xxl_fp8_e4m3fn" }),
                        expect.objectContaining({ label: "VAE", value: "ltxv_vae" }),
                    ]),
                    loras: expect.arrayContaining([
                        "ltx2.3_audio_reactive_lora_v2 (m=1.2)",
                        "ltx-2.3-22b-distilled-lora-384 (m=0.5)",
                    ]),
                }),
            ]),
        );
    });

    it("keeps repeated base sampler passes in separate sidebar cards", () => {
        const state = buildGenerationSectionState({
            id: 13011,
            kind: "video",
            metadata_raw: {
                geninfo: {
                    chained_passes: [
                        {
                            pass_stage: "base",
                            sampler_name: "euler_ancestral_cfg_pp",
                            steps: 8,
                            cfg: 1,
                            seed: 767185649304890,
                        },
                        {
                            pass_stage: "base",
                            sampler_name: "euler_cfg_pp",
                            steps: 3,
                            seed: 42,
                        },
                    ],
                },
            },
        });

        const samplingCards = state.branchCards.filter((branch) => branch.samplingFields.length);
        expect(samplingCards).toHaveLength(2);
        expect(samplingCards.map((branch) => branch.key)).toEqual(["pass_1", "pass_2"]);
        expect(samplingCards.map((branch) => branch.label)).toEqual(["Pass 1", "Pass 2"]);
        expect(state.branchCards.filter((branch) => branch.modelFields.length)).toHaveLength(0);
        expect(samplingCards).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    key: "pass_1",
                    samplingFields: expect.arrayContaining([
                        expect.objectContaining({ label: "Sampler", value: "euler_ancestral_cfg_pp" }),
                        expect.objectContaining({ label: "Steps", value: "8" }),
                        expect.objectContaining({ label: "Seed", value: "767185649304890" }),
                    ]),
                }),
                expect.objectContaining({
                    key: "pass_2",
                    samplingFields: expect.arrayContaining([
                        expect.objectContaining({ label: "Sampler", value: "euler_cfg_pp" }),
                        expect.objectContaining({ label: "Steps", value: "3" }),
                        expect.objectContaining({ label: "Seed", value: "42" }),
                    ]),
                }),
            ]),
        );
    });

    it("uses the first positive sampler seed for the isolated seed block", () => {
        const state = buildGenerationSectionState({
            id: 13012,
            kind: "video",
            metadata_raw: {
                geninfo: {
                    seed: { value: 0 },
                    all_samplers: [
                        { pass_stage: "low", sampler_name: "euler", seed: 0 },
                        { pass_stage: "high", sampler_name: "euler", seed: 675458056445911 },
                    ],
                },
            },
        });

        expect(state.seed).toBe(675458056445911);
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
                        loras: [{ name: "low_noise_model_rank64", strength_model: 1.0000000000000002 }],
                    },
                ],
                loras: [
                    { name: "high_noise_model_rank64", strength_model: 0.5 },
                { name: "low_noise_model_rank64", strength_model: 1.0000000000000002 },
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
        expect(state.branchCards).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    label: "High",
                    modelFields: expect.arrayContaining([
                        expect.objectContaining({ label: "UNet", value: "wan2.2_i2v_high_noise_14B_fp8_scaled" }),
                    ]),
                    samplingFields: expect.arrayContaining([
                        expect.objectContaining({ label: "CFG", value: "1" }),
                    ]),
                    loras: ["high_noise_model_rank64 (m=0.5)"],
                }),
                expect.objectContaining({
                    label: "Low",
                    modelFields: expect.arrayContaining([
                        expect.objectContaining({ label: "UNet", value: "wan2.2_i2v_low_noise_14B_fp8_scaled" }),
                    ]),
                    loras: ["low_noise_model_rank64 (m=1)"],
                }),
                expect.objectContaining({
                    label: "Shared",
                    modelFields: expect.arrayContaining([
                        expect.objectContaining({ label: "CLIP", value: "umt5_xxl_fp8_e4m3fn_scaled" }),
                        expect.objectContaining({ label: "VAE", value: "wan_2.1_vae" }),
                    ]),
                }),
            ]),
        );
        expect(state.moduleBlocks.find((module) => module.title === "Upscale")).toBeFalsy();
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
        expect(state.moduleBlocks).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    title: "Upscale",
                    fields: expect.arrayContaining([
                        expect.objectContaining({
                            label: "Model",
                            value: "pid_flux1_1024_to_4096_4step_bf16.safetensors",
                        }),
                    ]),
                }),
            ]),
        );
    });

    it("resolves SamplerCustomAdvanced values through guider sampler noise and sigmas links", () => {
        const state = buildGenerationSectionState({
            id: 103,
            kind: "video",
            metadata: {
                prompt: {
                    "276": { class_type: "RandomNoise", inputs: { noise_seed: 42 } },
                    "277": { class_type: "RandomNoise", inputs: { noise_seed: 221923341291547 } },
                    "278": { class_type: "LTXVConcatAVLatent", inputs: { video_latent: ["288", 0], audio_latent: ["307", 1] } },
                    "280": { class_type: "KSamplerSelect", inputs: { sampler_name: "euler_cfg_pp" } },
                    "281": { class_type: "ManualSigmas", inputs: { sigmas: "0.85, 0.7250, 0.4219, 0.0" } },
                    "282": { class_type: "CFGGuider", inputs: { cfg: 1, model: ["285", 0] } },
                    "283": {
                        class_type: "SamplerCustomAdvanced",
                        inputs: {
                            noise: ["277", 0],
                            guider: ["314", 0],
                            sampler: ["291", 0],
                            sigmas: ["306", 0],
                            latent_image: ["318", 0],
                        },
                    },
                    "285": {
                        class_type: "LoraLoaderModelOnly",
                        inputs: {
                            lora_name: "ltx-2.3-22b-distilled-lora-384.safetensors",
                            strength_model: 0.5,
                            model: ["316", 0],
                        },
                    },
                    "291": { class_type: "KSamplerSelect", inputs: { sampler_name: "euler_ancestral_cfg_pp" } },
                    "287": { class_type: "LTXVLatentUpsampler", inputs: { samples: ["307", 0], upscale_model: ["311", 0] } },
                    "288": { class_type: "LTXVImgToVideoInplace", inputs: { latent: ["287", 0] } },
                    "296": { class_type: "LTXVImgToVideoInplace", inputs: {} },
                    "306": { class_type: "ManualSigmas", inputs: { sigmas: "1.0, 0.99375, 0.0" } },
                    "307": { class_type: "LTXVSeparateAVLatent", inputs: { av_latent: ["283", 0] } },
                    "308": {
                        class_type: "SamplerCustomAdvanced",
                        inputs: {
                            noise: ["276", 0],
                            guider: ["282", 0],
                            sampler: ["280", 0],
                            sigmas: ["281", 0],
                            latent_image: ["278", 0],
                        },
                    },
                    "311": {
                        class_type: "LatentUpscaleModelLoader",
                        inputs: { model_name: "ltx-2.3-spatial-upscaler-x2-1.1.safetensors" },
                    },
                    "314": { class_type: "CFGGuider", inputs: { cfg: 1, model: ["285", 0] } },
                    "316": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "ltx-2.3-22b-dev-fp8.safetensors" } },
                    "318": { class_type: "LTXVConcatAVLatent", inputs: { video_latent: ["296", 0], audio_latent: ["305", 0] } },
                },
            },
        });

        expect(state.modelFields).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ label: "Model", value: "ltx-2.3-22b-dev-fp8" }),
                expect.objectContaining({ label: "LoRA", value: expect.stringContaining("ltx-2.3-22b-distilled-lora-384") }),
                expect.objectContaining({ label: "Upscaler", value: "ltx-2.3-spatial-upscaler-x2-1.1" }),
            ]),
        );
        expect(state.branchCards).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    label: "Low",
                    samplingFields: expect.arrayContaining([
                        expect.objectContaining({ label: "Sampler", value: "euler_cfg_pp" }),
                        expect.objectContaining({ label: "Seed", value: "42" }),
                        expect.objectContaining({ label: "CFG", value: "1" }),
                    ]),
                }),
                expect.objectContaining({
                    label: "High",
                    samplingFields: expect.arrayContaining([
                        expect.objectContaining({ label: "Sampler", value: "euler_ancestral_cfg_pp" }),
                        expect.objectContaining({ label: "Seed", value: "221923341291547" }),
                    ]),
                }),
            ]),
        );
    });

    it("keeps LTX two-pass SamplerCustomAdvanced visible when steps come from ManualSigmas", () => {
        const state = buildGenerationSectionState({
            id: 105,
            kind: "video",
            metadata: {
                prompt: {
                    "285": { class_type: "RandomNoise", inputs: { noise_seed: 42 } },
                    "286": { class_type: "RandomNoise", inputs: { noise_seed: 89173056758850 } },
                    "288": { class_type: "KSamplerSelect", inputs: { sampler_name: "euler_cfg_pp" } },
                    "289": { class_type: "ManualSigmas", inputs: { sigmas: "0.85, 0.7250, 0.4219, 0.0" } },
                    "290": { class_type: "CFGGuider", inputs: { cfg: 1, model: ["349", 0] } },
                    "291": {
                        class_type: "SamplerCustomAdvanced",
                        inputs: {
                            noise: ["286", 0],
                            guider: ["315", 0],
                            sampler: ["298", 0],
                            sigmas: ["308", 0],
                            latent_image: ["326", 0],
                        },
                    },
                    "298": { class_type: "KSamplerSelect", inputs: { sampler_name: "euler_ancestral_cfg_pp" } },
                    "308": { class_type: "ManualSigmas", inputs: { sigmas: "1.0, 0.99375, 0.9875, 0.98125, 0.975, 0.909375, 0.725, 0.421875, 0.0" } },
                    "310": {
                        class_type: "SamplerCustomAdvanced",
                        inputs: {
                            noise: ["285", 0],
                            guider: ["290", 0],
                            sampler: ["288", 0],
                            sigmas: ["289", 0],
                            latent_image: ["287", 0],
                        },
                    },
                    "315": { class_type: "CFGGuider", inputs: { cfg: 1, model: ["349", 0] } },
                    "317": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "ltx-2.3-22b-dev-fp8.safetensors" } },
                    "349": {
                        class_type: "LoraLoaderModelOnly",
                        inputs: {
                            lora_name: "ltx2.3_audio_reactive_lora_v2.safetensors",
                            strength_model: 1.5,
                            model: ["317", 0],
                        },
                    },
                },
            },
        });

        expect(state.kind).toBe("full");
        expect(state.branchCards.some((branch) => branch.modelFields.length || branch.loras.length)).toBe(true);
        expect(state.branchCards.some((branch) => branch.samplingFields.length)).toBe(true);
        expect(state.branchCards).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    samplingFields: expect.arrayContaining([
                        expect.objectContaining({ label: "Sampler", value: "euler_cfg_pp" }),
                        expect.objectContaining({ label: "Steps", value: "3" }),
                        expect.objectContaining({ label: "CFG", value: "1" }),
                    ]),
                }),
                expect.objectContaining({
                    samplingFields: expect.arrayContaining([
                        expect.objectContaining({ label: "Sampler", value: "euler_ancestral_cfg_pp" }),
                        expect.objectContaining({ label: "Steps", value: "8" }),
                    ]),
                }),
            ]),
        );
    });

    it("keeps embedded two-pass sampler data when geninfo only exposes one pass", () => {
        const promptGraph = {
            "285": { class_type: "RandomNoise", inputs: { noise_seed: 42 } },
            "286": { class_type: "RandomNoise", inputs: { noise_seed: 89173056758850 } },
            "288": { class_type: "KSamplerSelect", inputs: { sampler_name: "euler_cfg_pp" } },
            "289": { class_type: "ManualSigmas", inputs: { sigmas: "0.85, 0.7250, 0.4219, 0.0" } },
            "290": { class_type: "CFGGuider", inputs: { cfg: 1, model: ["349", 0] } },
            "291": {
                class_type: "SamplerCustomAdvanced",
                inputs: {
                    noise: ["286", 0],
                    guider: ["315", 0],
                    sampler: ["298", 0],
                    sigmas: ["308", 0],
                    latent_image: ["326", 0],
                },
            },
            "298": { class_type: "KSamplerSelect", inputs: { sampler_name: "euler_ancestral_cfg_pp" } },
            "308": { class_type: "ManualSigmas", inputs: { sigmas: "1.0, 0.99375, 0.9875, 0.98125, 0.975, 0.909375, 0.725, 0.421875, 0.0" } },
            "310": {
                class_type: "SamplerCustomAdvanced",
                inputs: {
                    noise: ["285", 0],
                    guider: ["290", 0],
                    sampler: ["288", 0],
                    sigmas: ["289", 0],
                    latent_image: ["287", 0],
                },
            },
            "315": { class_type: "CFGGuider", inputs: { cfg: 1, model: ["349", 0] } },
            "317": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "ltx-2.3-22b-dev-fp8.safetensors" } },
            "349": {
                class_type: "LoraLoaderModelOnly",
                inputs: {
                    lora_name: "ltx2.3_audio_reactive_lora_v2.safetensors",
                    strength_model: 1.5,
                    model: ["317", 0],
                },
            },
        };

        const state = buildGenerationSectionState({
            id: 106,
            kind: "video",
            metadata_raw: {
                geninfo: {
                    seed: { value: 42 },
                    sampler: { name: "euler_cfg_pp" },
                    steps: { value: 3 },
                    cfg: { value: 1 },
                    denoise: { value: 1 },
                },
                raw_ffprobe: {
                    format: {
                        tags: {
                            prompt: JSON.stringify(promptGraph),
                        },
                    },
                },
            },
        });

        expect(state.pipelineTabs).toHaveLength(2);
        expect(state.branchCards.some((branch) => branch.samplingFields.length)).toBe(true);
        expect(state.branchCards).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    samplingFields: expect.arrayContaining([
                        expect.objectContaining({ label: "Sampler", value: "euler_cfg_pp" }),
                        expect.objectContaining({ label: "Steps", value: "3" }),
                        expect.objectContaining({ label: "Seed", value: "42" }),
                    ]),
                }),
                expect.objectContaining({
                    samplingFields: expect.arrayContaining([
                        expect.objectContaining({ label: "Sampler", value: "euler_ancestral_cfg_pp" }),
                        expect.objectContaining({ label: "Steps", value: "8" }),
                        expect.objectContaining({ label: "Seed", value: "89173056758850" }),
                    ]),
                }),
            ]),
        );
    });

    it("renders generic sampling when pipeline tabs exist without branch sampling cards", () => {
        const wrapper = mount(SidebarGenerationSection, {
            props: {
                asset: {
                    kind: "video",
                    metadata: {
                        prompt: "generated scene",
                        seed: 42,
                        sampler: "euler_cfg_pp",
                        scheduler: "simple",
                        steps: 8,
                        cfg: 1,
                        chained_passes: [{ pass_stage: "base" }, { pass_stage: "upscale" }],
                    },
                },
            },
            global: {
                stubs: {
                    MButton: { template: "<button><slot /></button>" },
                    GenerationInputThumb: true,
                },
            },
        });

        const text = wrapper.text();
        expect(text).toContain("Sampling");
        expect(text).toContain("euler_cfg_pp");
        expect(text).toContain("42");
        wrapper.unmount();
    });

    it("auto-builds sidebar fields from embedded ComfyUI prompt tags for any asset kind", () => {
        const promptGraph = {
            "1": {
                class_type: "CheckpointLoaderSimple",
                inputs: { ckpt_name: "universal-model.safetensors" },
            },
            "2": {
                class_type: "CLIPTextEncode",
                inputs: { text: "cinematic universal prompt", clip: ["1", 1] },
                _meta: { title: "CLIP Text Encode (Prompt)" },
            },
            "3": {
                class_type: "KSampler",
                inputs: {
                    seed: 123,
                    steps: 9,
                    cfg: 1.5,
                    sampler_name: "euler",
                    scheduler: "simple",
                    model: ["1", 0],
                    positive: ["2", 0],
                },
            },
        };

        for (const kind of ["image", "video", "audio", "3d"]) {
            const state = buildGenerationSectionState({
                id: `${kind}-embedded`,
                kind,
                metadata_raw: {
                    prompt: "D:/outputs/path-like-preview.mp4",
                    raw_ffprobe: {
                        format: {
                            tags: {
                                prompt: JSON.stringify(promptGraph),
                            },
                        },
                    },
                },
            });

            expect(state.kind, kind).toBe("full");
            expect(state.positivePrompt, kind).toBe("cinematic universal prompt");
            expect(state.samplingFields, kind).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ label: "Seed", value: 123 }),
                    expect.objectContaining({ label: "Sampler", value: "euler" }),
                    expect.objectContaining({ label: "Steps", value: 9 }),
                    expect.objectContaining({ label: "CFG Scale", value: 1.5 }),
                ]),
            );
            expect(state.modelFields, kind).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ label: "Model", value: "universal-model" }),
                ]),
            );
        }
    });

    it("resolves Wan high low samplers through Comfy switches", () => {
        const prompt = {
                    "131": { class_type: "PrimitiveBoolean", inputs: { value: true } },
                    "118": { class_type: "PrimitiveInt", inputs: { value: 4 } },
                    "122": { class_type: "PrimitiveFloat", inputs: { value: 1.0 } },
                    "124": { class_type: "PrimitiveInt", inputs: { value: 2 } },
                    "128": { class_type: "PrimitiveInt", inputs: { value: 20 } },
                    "119": {
                        class_type: "ComfySwitchNode",
                        inputs: { switch: ["131", 0], on_false: ["128", 0], on_true: ["118", 0] },
                    },
                    "120": {
                        class_type: "ComfySwitchNode",
                        inputs: { switch: ["131", 0], on_false: 3.5, on_true: ["122", 0] },
                    },
                    "125": {
                        class_type: "ComfySwitchNode",
                        inputs: { switch: ["131", 0], on_false: 10, on_true: ["124", 0] },
                    },
                    "95": {
                        class_type: "UNETLoader",
                        inputs: { unet_name: "WAN2.2/I2V/wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors" },
                    },
                    "96": {
                        class_type: "UNETLoader",
                        inputs: { unet_name: "WAN2.2/I2V/wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors" },
                    },
                    "101": {
                        class_type: "LoraLoaderModelOnly",
                        inputs: {
                            lora_name: "WAN2.2/I2V/high_noise_lora.safetensors",
                            strength_model: 1.0000000000000002,
                            model: ["95", 0],
                        },
                    },
                    "102": {
                        class_type: "LoraLoaderModelOnly",
                        inputs: {
                            lora_name: "WAN2.2/I2V/low_noise_lora.safetensors",
                            strength_model: 1.0000000000000002,
                            model: ["96", 0],
                        },
                    },
                    "116": {
                        class_type: "ComfySwitchNode",
                        inputs: { switch: ["131", 0], on_false: ["95", 0], on_true: ["101", 0] },
                    },
                    "117": {
                        class_type: "ComfySwitchNode",
                        inputs: { switch: ["131", 0], on_false: ["96", 0], on_true: ["102", 0] },
                    },
                    "103": { class_type: "ModelSamplingSD3", inputs: { shift: 5, model: ["117", 0] } },
                    "104": { class_type: "ModelSamplingSD3", inputs: { shift: 5, model: ["116", 0] } },
                    "85": {
                        class_type: "KSamplerAdvanced",
                        inputs: {
                            noise_seed: 0,
                            steps: ["119", 0],
                            cfg: ["120", 0],
                            sampler_name: "euler",
                            scheduler: "simple",
                            start_at_step: ["125", 0],
                            end_at_step: ["119", 0],
                            model: ["103", 0],
                        },
                    },
                    "86": {
                        class_type: "KSamplerAdvanced",
                        inputs: {
                            noise_seed: 555,
                            steps: ["119", 0],
                            cfg: ["120", 0],
                            sampler_name: "euler",
                            scheduler: "simple",
                            start_at_step: 0,
                            end_at_step: ["125", 0],
                            model: ["104", 0],
                        },
                    },
                };
        const state = buildGenerationSectionState({
            id: 104,
            kind: "video",
            metadata: {
                prompt: JSON.stringify(prompt),
            },
        });

        expect(state.branchCards).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    label: "Low",
                    modelFields: expect.arrayContaining([
                        expect.objectContaining({ label: "UNet", value: "wan2.2_i2v_low_noise_14B_fp8_scaled" }),
                    ]),
                    samplingFields: expect.arrayContaining([
                        expect.objectContaining({ label: "Steps", value: "4" }),
                        expect.objectContaining({ label: "CFG", value: "1" }),
                        expect.objectContaining({ label: "Start", value: "2" }),
                        expect.objectContaining({ label: "End", value: "4" }),
                    ]),
                    loras: ["low_noise_lora (m=1)"],
                }),
                expect.objectContaining({
                    label: "High",
                    modelFields: expect.arrayContaining([
                        expect.objectContaining({ label: "UNet", value: "wan2.2_i2v_high_noise_14B_fp8_scaled" }),
                    ]),
                    samplingFields: expect.arrayContaining([
                        expect.objectContaining({ label: "Start", value: "0" }),
                        expect.objectContaining({ label: "End", value: "2" }),
                    ]),
                    loras: ["high_noise_lora (m=1)"],
                }),
            ]),
        );
    });

    it("keeps Wan high and low branches when geninfo is low-only but embedded prompt has both", () => {
        const prompt = {
            "131": { class_type: "PrimitiveBoolean", inputs: { value: true } },
            "118": { class_type: "PrimitiveInt", inputs: { value: 4 } },
            "122": { class_type: "PrimitiveFloat", inputs: { value: 1.0 } },
            "124": { class_type: "PrimitiveInt", inputs: { value: 2 } },
            "119": {
                class_type: "ComfySwitchNode",
                inputs: { switch: ["131", 0], on_true: ["118", 0] },
            },
            "120": {
                class_type: "ComfySwitchNode",
                inputs: { switch: ["131", 0], on_true: ["122", 0] },
            },
            "125": {
                class_type: "ComfySwitchNode",
                inputs: { switch: ["131", 0], on_true: ["124", 0] },
            },
            "95": {
                class_type: "UNETLoader",
                inputs: { unet_name: "WAN2.2/I2V/wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors" },
            },
            "96": {
                class_type: "UNETLoader",
                inputs: { unet_name: "WAN2.2/I2V/wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors" },
            },
            "101": {
                class_type: "LoraLoaderModelOnly",
                inputs: {
                    lora_name: "WAN2.2/I2V/wan2.2_i2v_lightx2v_4steps_lora_v1_high_noise.safetensors",
                    strength_model: 1,
                    model: ["95", 0],
                },
            },
            "102": {
                class_type: "LoraLoaderModelOnly",
                inputs: {
                    lora_name: "WAN2.2/I2V/wan2.2_i2v_lightx2v_4steps_lora_v1_low_noise.safetensors",
                    strength_model: 1,
                    model: ["96", 0],
                },
            },
            "116": {
                class_type: "ComfySwitchNode",
                inputs: { switch: ["131", 0], on_false: ["95", 0], on_true: ["101", 0] },
            },
            "117": {
                class_type: "ComfySwitchNode",
                inputs: { switch: ["131", 0], on_false: ["96", 0], on_true: ["102", 0] },
            },
            "103": { class_type: "ModelSamplingSD3", inputs: { model: ["117", 0] } },
            "104": { class_type: "ModelSamplingSD3", inputs: { model: ["116", 0] } },
            "85": {
                class_type: "KSamplerAdvanced",
                inputs: {
                    noise_seed: 0,
                    steps: ["119", 0],
                    cfg: ["120", 0],
                    sampler_name: "euler",
                    scheduler: "simple",
                    start_at_step: ["125", 0],
                    model: ["103", 0],
                },
            },
            "86": {
                class_type: "KSamplerAdvanced",
                inputs: {
                    noise_seed: 675458056445911,
                    steps: ["119", 0],
                    cfg: ["120", 0],
                    sampler_name: "euler",
                    scheduler: "simple",
                    end_at_step: ["125", 0],
                    model: ["104", 0],
                },
            },
        };

        const state = buildGenerationSectionState({
            id: 260415,
            kind: "video",
            metadata_raw: {
                geninfo: {
                    models: {
                        unet: { name: "wan2.2_i2v_low_noise_14B_fp8_scaled" },
                        clip: { name: "umt5_xxl_fp8_e4m3fn_scaled" },
                        vae: { name: "wan_2.1_vae" },
                    },
                    loras: [
                        { name: "wan2.2_i2v_lightx2v_4steps_lora_v1_low_noise", strength_model: 1 },
                    ],
                    all_samplers: [
                        { pass_stage: "low", sampler_name: "euler", steps: 4, seed: 0 },
                        { pass_stage: "base", sampler_name: "euler", seed: 675458056445911 },
                    ],
                },
                raw_ffprobe: {
                    format: {
                        tags: {
                            prompt: JSON.stringify(prompt),
                        },
                    },
                },
            },
        });

        expect(state.branchCards.find((branch) => branch.label === "Base")).toBeFalsy();
        expect(state.moduleBlocks.find((module) => module.title === "Upscale")).toBeFalsy();
        expect(state.branchCards).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    label: "Shared",
                    modelFields: expect.arrayContaining([
                        expect.objectContaining({ label: "CLIP", value: "umt5_xxl_fp8_e4m3fn_scaled" }),
                        expect.objectContaining({ label: "VAE", value: "wan_2.1_vae" }),
                    ]),
                }),
            ]),
        );
        const highCard = state.branchCards.find((branch) => branch.label === "High");
        const lowCard = state.branchCards.find((branch) => branch.label === "Low");
        expect(highCard).toEqual(
            expect.objectContaining({
                modelFields: expect.arrayContaining([
                    expect.objectContaining({ label: "UNet", value: "wan2.2_i2v_high_noise_14B_fp8_scaled" }),
                ]),
                samplingFields: expect.arrayContaining([
                    expect.objectContaining({ label: "Seed", value: "675458056445911" }),
                ]),
                loras: ["wan2.2_i2v_lightx2v_4steps_lora_v1_high_noise (m=1)"],
            }),
        );
        expect(lowCard).toEqual(
            expect.objectContaining({
                modelFields: expect.arrayContaining([
                    expect.objectContaining({ label: "UNet", value: "wan2.2_i2v_low_noise_14B_fp8_scaled" }),
                ]),
                samplingFields: expect.arrayContaining([
                    expect.objectContaining({ label: "Seed", value: "0" }),
                ]),
                loras: ["wan2.2_i2v_lightx2v_4steps_lora_v1_low_noise (m=1)"],
            }),
        );
        expect(highCard?.modelFields.some((field) => ["CLIP", "VAE"].includes(field.label))).toBe(false);
        expect(lowCard?.modelFields.some((field) => ["CLIP", "VAE"].includes(field.label))).toBe(false);
    });

    it("builds LTX Director prompt boxes with global prompt and segment in/out values", () => {
        const timeline = {
            global_prompt: "golden glitter portrait, cinematic sunset light",
            segments: [
                {
                    id: "shot-a",
                    start: 0,
                    length: 50,
                    prompt: "camera turns to the other side of the model face",
                    type: "image",
                    imageFile: "Krea2_turbo_00020_.png",
                },
                {
                    id: "shot-b",
                    start: 50,
                    end: 100,
                    prompt: "the light starts shifting across her skin",
                    type: "image",
                    imageFile: "Krea2_turbo_00021_.png",
                },
            ],
        };
        const promptGraph = {
            "131": {
                class_type: "LTXDirector",
                inputs: {
                    model: ["35", 0],
                    clip: ["12", 0],
                    frame_rate: 25,
                    custom_width: 768,
                    custom_height: 1344,
                    duration_frames: 100,
                    timeline_data: JSON.stringify(timeline),
                },
            },
            "35": { class_type: "UNETLoader", inputs: { unet_name: "ltx-2.3-22b-distilled.safetensors" } },
            "12": { class_type: "DualCLIPLoader", inputs: { clip_name1: "gemma_3_12B_it.safetensors" } },
            "17": { class_type: "CFGGuider", inputs: { cfg: 1, model: ["131", 0] } },
            "19": {
                class_type: "SamplerCustomAdvanced",
                inputs: {
                    noise: ["30", 0],
                    guider: ["17", 0],
                    sampler: ["20", 0],
                    sigmas: ["21", 0],
                    latent_image: ["18", 0],
                },
            },
            "20": { class_type: "KSamplerSelect", inputs: { sampler_name: "euler" } },
            "21": { class_type: "BasicScheduler", inputs: { scheduler: "linear_quadratic", steps: 4, denoise: 0.42 } },
            "30": { class_type: "RandomNoise", inputs: { noise_seed: 0 } },
        };

        const state = buildGenerationSectionState({
            id: 10645,
            kind: "video",
            metadata_raw: {
                prompt: "D:/____COMFY_OUTPUTS/video/LTX_Director_00005_.mp4",
                raw_ffprobe: {
                    format: {
                        tags: {
                            prompt: JSON.stringify(promptGraph),
                        },
                    },
                },
            },
        });

        expect(state.kind).toBe("full");
        expect(state.ltxDirector?.globalPrompt).toBe("golden glitter portrait, cinematic sunset light");
        expect(state.ltxDirector?.fields).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ label: "FPS", value: "25" }),
                expect.objectContaining({ label: "Size", value: "768 x 1344" }),
            ]),
        );
        expect(state.ltxDirector?.segments).toEqual([
            expect.objectContaining({
                label: "Segment 1",
                prompt: "camera turns to the other side of the model face",
                inLabel: "0s",
                outLabel: "2s",
                filename: "Krea2_turbo_00020_.png",
                isVideo: false,
                isAudio: false,
                previewCandidates: expect.arrayContaining([
                    expect.stringContaining("Krea2_turbo_00020_.png"),
                ]),
            }),
            expect.objectContaining({
                label: "Segment 2",
                prompt: "the light starts shifting across her skin",
                inLabel: "2s",
                outLabel: "4s",
                filename: "Krea2_turbo_00021_.png",
            }),
        ]);
        expect(state.modelFields).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ label: "UNet", value: "ltx-2.3-22b-distilled" }),
                expect.objectContaining({ label: "CLIP", value: "gemma_3_12B_it" }),
            ]),
        );
        expect(state.samplingFields).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ label: "Seed", value: 0 }),
                expect.objectContaining({ label: "Sampler", value: "euler" }),
            ]),
        );
    });

    it("builds Ideogram 4 prompt builder state from the JSON text encoder input", () => {
        const promptGraph = {
            "167": {
                class_type: "CLIPTextEncode",
                inputs: { text: ["185", 0], clip: ["168", 0] },
                _meta: { title: "CLIP Text Encode (Positive Prompt)" },
            },
            "185": {
                class_type: "Ideogram4PromptBuilderKJ",
                inputs: {
                    width: 768,
                    height: 1376,
                    high_level_description: "luxury skincare campaign with a graceful silhouette",
                    background: "warm sunset gradient background",
                    style: "photo",
                    "style.photo": "DSLR photography",
                    aesthetics: "premium beauty mood",
                    lighting: "sunrise, sunset, warm",
                    medium: "photography",
                    elements_data: JSON.stringify([
                        {
                            x: 0.29,
                            y: 0.33,
                            w: 0.13,
                            h: 0.12,
                            type: "obj",
                            text: "",
                            desc: "scientific graphic around the cheek",
                            palette: ["#ffbf66"],
                        },
                    ]),
                    bg_brightness: 25,
                    coord_mode: "normalized",
                    bbox_order: "yx",
                },
                _meta: { title: "Ideogram 4 Prompt Builder KJ" },
            },
        };

        const state = buildGenerationSectionState({
            id: 1,
            kind: "image",
            metadata_raw: { prompt: JSON.stringify(promptGraph) },
        });

        expect(state.kind).toBe("full");
        expect(state.positivePrompt).toBe("");
        expect(state.ideogram?.highLevelDescription).toBe("luxury skincare campaign with a graceful silhouette");
        expect(state.ideogram?.background).toBe("warm sunset gradient background");
        expect(state.ideogram?.json).toContain('"high_level_description": "luxury skincare campaign with a graceful silhouette"');
        expect(state.ideogram?.json).toContain('"elements"');
        expect(state.ideogram?.elements).toEqual([
            expect.objectContaining({
                label: "Element 1",
                description: "scientific graphic around the cheek",
                bbox: "0.29, 0.33, 0.13, 0.12",
                palette: ["#ffbf66"],
            }),
        ]);
        expect(state.ideogram?.fields).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ label: "Style", value: "photo" }),
                expect.objectContaining({ label: "Size", value: "768 x 1376" }),
            ]),
        );
    });
});
