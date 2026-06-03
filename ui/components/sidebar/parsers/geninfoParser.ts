import { parseA1111Parameters } from "./a1111ParamsParser.js";
import { looksLikeComfyPromptGraph, parseComfyUIWorkflow } from "./comfyWorkflowParser.js";

const FILEPATH_PROMPT_RE =
    /^(?:[a-z]:[\\/]|[\\/]{1,2}|\.{1,2}[\\/]|~[\\/]).+?[\\/][^\\/\n]+\.(?:png|jpe?g|webp|gif|bmp|tiff?|avif|heic|heif|apng|hdr|svg|mp4|webm|mov|mkv|avi|m4v|mp3|wav|flac|ogg|glb|gltf|obj|fbx|ply|stl|ckpt|safetensors|pt|pth|bin|gguf|json|ya?ml)$/i;
const FILEPATH_SEGMENTED_PROMPT_RE =
    /^(?!.*[,;])(?!.*\b(?:cinematic|portrait|landscape|lighting|style|detailed|masterpiece|photo|render)\b).*(?:[\\/][^\\/\n]+){2,}\.(?:png|jpe?g|webp|gif|bmp|tiff?|avif|heic|heif|apng|hdr|svg|mp4|webm|mov|mkv|avi|m4v|mp3|wav|flac|ogg|glb|gltf|obj|fbx|ply|stl|ckpt|safetensors|pt|pth|bin|gguf|json|ya?ml)$/i;

export function normalizeGenerationMetadata(raw: any): Record<string, any> | null {
    if (!raw) return null;

    if (typeof raw === "object") {
        const geninfo = raw.geninfo || raw.GenInfo || raw.generation || null;
        if (geninfo && typeof geninfo === "object") {
            const mapped: Record<string, any> = {};
            const overrideFields = new Set<string>();
            const markOverride = (keys: string | string[], field: any) => {
                if (!field || typeof field !== "object") return;
                if (field.confidence !== "override" && field.source !== "majoor_geninfo") return;
                for (const key of Array.isArray(keys) ? keys : [keys]) overrideFields.add(key);
            };
            const pos = geninfo.positive?.value ?? geninfo.positive?.text ?? null;
            const neg = geninfo.negative?.value ?? geninfo.negative?.text ?? null;
            if (typeof pos === "string" && pos.trim()) mapped.prompt = pos;
            if (typeof neg === "string" && neg.trim()) mapped.negative_prompt = neg;
            markOverride("prompt", geninfo.positive);
            markOverride("negative_prompt", geninfo.negative);

            const ckpt = geninfo.checkpoint?.name ?? geninfo.checkpoint ?? null;
            if (typeof ckpt === "string" && ckpt.trim()) mapped.model = ckpt;
            markOverride(["model", "checkpoint"], geninfo.checkpoint);

            const clip = geninfo.clip?.name ?? geninfo.clip ?? null;
            if (typeof clip === "string" && clip.trim()) mapped.clip = clip;
            markOverride("clip", geninfo.clip);
            const vae = geninfo.vae?.name ?? geninfo.vae ?? null;
            if (typeof vae === "string" && vae.trim()) mapped.vae = vae;
            markOverride("vae", geninfo.vae);

            const models = geninfo.models;
            if (models && typeof models === "object") {
                mapped.models = models;
            }

            const modelGroups = Array.isArray(geninfo.model_groups) ? geninfo.model_groups : null;
            if (modelGroups && modelGroups.length) mapped.model_groups = modelGroups;

            const loras = Array.isArray(geninfo.loras) ? geninfo.loras : null;
            if (loras) mapped.loras = loras;
            if (loras?.some((item: any) => item?.confidence === "override" || item?.source === "majoor_geninfo")) {
                overrideFields.add("loras");
            }

            const sampler = geninfo.sampler?.name ?? geninfo.sampler ?? null;
            if (typeof sampler === "string" && sampler.trim()) mapped.sampler = sampler;
            markOverride("sampler", geninfo.sampler);
            const scheduler = geninfo.scheduler?.name ?? geninfo.scheduler ?? null;
            if (typeof scheduler === "string" && scheduler.trim()) mapped.scheduler = scheduler;
            markOverride("scheduler", geninfo.scheduler);

            const steps = geninfo.steps?.value ?? geninfo.steps ?? null;
            if (steps !== null && steps !== undefined) mapped.steps = steps;
            markOverride("steps", geninfo.steps);
            const cfg = geninfo.cfg?.value ?? geninfo.cfg ?? null;
            if (cfg !== null && cfg !== undefined) mapped.cfg = cfg;
            markOverride(["cfg", "cfg_scale"], geninfo.cfg);
            const cfgHighNoise = geninfo.cfg_high_noise?.value ?? geninfo.cfg_high_noise ?? null;
            if (cfgHighNoise !== null && cfgHighNoise !== undefined)
                mapped.cfg_high_noise = cfgHighNoise;
            const cfgLowNoise = geninfo.cfg_low_noise?.value ?? geninfo.cfg_low_noise ?? null;
            if (cfgLowNoise !== null && cfgLowNoise !== undefined)
                mapped.cfg_low_noise = cfgLowNoise;
            const seed = geninfo.seed?.value ?? geninfo.seed ?? null;
            if (seed !== null && seed !== undefined) mapped.seed = seed;
            markOverride("seed", geninfo.seed);
            const voice = geninfo.voice?.name ?? geninfo.voice?.value ?? geninfo.voice ?? null;
            if (voice !== null && voice !== undefined && String(voice).trim())
                mapped.voice = String(voice).trim();
            const language = geninfo.language?.value ?? geninfo.language ?? null;
            if (language !== null && language !== undefined && String(language).trim())
                mapped.language = String(language).trim();
            const temperature = geninfo.temperature?.value ?? geninfo.temperature ?? null;
            if (temperature !== null && temperature !== undefined) mapped.temperature = temperature;
            const topK = geninfo.top_k?.value ?? geninfo.top_k ?? null;
            if (topK !== null && topK !== undefined) mapped.top_k = topK;
            const topP = geninfo.top_p?.value ?? geninfo.top_p ?? null;
            if (topP !== null && topP !== undefined) mapped.top_p = topP;
            const repetitionPenalty =
                geninfo.repetition_penalty?.value ?? geninfo.repetition_penalty ?? null;
            if (repetitionPenalty !== null && repetitionPenalty !== undefined)
                mapped.repetition_penalty = repetitionPenalty;
            const maxNewTokens = geninfo.max_new_tokens?.value ?? geninfo.max_new_tokens ?? null;
            if (maxNewTokens !== null && maxNewTokens !== undefined)
                mapped.max_new_tokens = maxNewTokens;
            const device = geninfo.device?.value ?? geninfo.device ?? null;
            if (device !== null && device !== undefined && String(device).trim())
                mapped.device = String(device).trim();
            const voicePreset = geninfo.voice_preset?.value ?? geninfo.voice_preset ?? null;
            if (voicePreset !== null && voicePreset !== undefined && String(voicePreset).trim())
                mapped.voice_preset = String(voicePreset).trim();
            const instruct = geninfo.instruct?.value ?? geninfo.instruct ?? null;
            if (instruct !== null && instruct !== undefined && String(instruct).trim())
                mapped.instruct = String(instruct).trim();
            const dtype = geninfo.dtype?.value ?? geninfo.dtype ?? null;
            if (dtype !== null && dtype !== undefined && String(dtype).trim())
                mapped.dtype = String(dtype).trim();
            const attnImplementation =
                geninfo.attn_implementation?.value ?? geninfo.attn_implementation ?? null;
            if (
                attnImplementation !== null &&
                attnImplementation !== undefined &&
                String(attnImplementation).trim()
            )
                mapped.attn_implementation = String(attnImplementation).trim();
            const xVectorOnlyMode =
                geninfo.x_vector_only_mode?.value ?? geninfo.x_vector_only_mode ?? null;
            if (xVectorOnlyMode !== null && xVectorOnlyMode !== undefined)
                mapped.x_vector_only_mode = xVectorOnlyMode;
            const useTorchCompile =
                geninfo.use_torch_compile?.value ?? geninfo.use_torch_compile ?? null;
            if (useTorchCompile !== null && useTorchCompile !== undefined)
                mapped.use_torch_compile = useTorchCompile;
            const useCudaGraphs = geninfo.use_cuda_graphs?.value ?? geninfo.use_cuda_graphs ?? null;
            if (useCudaGraphs !== null && useCudaGraphs !== undefined)
                mapped.use_cuda_graphs = useCudaGraphs;
            const compileMode = geninfo.compile_mode?.value ?? geninfo.compile_mode ?? null;
            if (compileMode !== null && compileMode !== undefined && String(compileMode).trim())
                mapped.compile_mode = String(compileMode).trim();
            const enableChunking =
                geninfo.enable_chunking?.value ?? geninfo.enable_chunking ?? null;
            if (enableChunking !== null && enableChunking !== undefined)
                mapped.enable_chunking = enableChunking;
            const maxCharsPerChunk =
                geninfo.max_chars_per_chunk?.value ?? geninfo.max_chars_per_chunk ?? null;
            if (maxCharsPerChunk !== null && maxCharsPerChunk !== undefined)
                mapped.max_chars_per_chunk = maxCharsPerChunk;
            const chunkMethod =
                geninfo.chunk_combination_method?.value ?? geninfo.chunk_combination_method ?? null;
            if (chunkMethod !== null && chunkMethod !== undefined && String(chunkMethod).trim())
                mapped.chunk_combination_method = String(chunkMethod).trim();
            const silenceBetweenChunks =
                geninfo.silence_between_chunks_ms?.value ??
                geninfo.silence_between_chunks_ms ??
                null;
            if (silenceBetweenChunks !== null && silenceBetweenChunks !== undefined)
                mapped.silence_between_chunks_ms = silenceBetweenChunks;
            const enableAudioCache =
                geninfo.enable_audio_cache?.value ?? geninfo.enable_audio_cache ?? null;
            if (enableAudioCache !== null && enableAudioCache !== undefined)
                mapped.enable_audio_cache = enableAudioCache;
            const batchSize = geninfo.batch_size?.value ?? geninfo.batch_size ?? null;
            if (batchSize !== null && batchSize !== undefined) mapped.batch_size = batchSize;
            const denoise = geninfo.denoise?.value ?? geninfo.denoise ?? null;
            if (denoise !== null && denoise !== undefined) mapped.denoise = denoise;
            markOverride(["denoise", "denoising"], geninfo.denoise);
            const clipSkip =
                geninfo.clip_skip?.value ?? geninfo.clip_skip ?? geninfo.clipSkip ?? null;
            if (clipSkip !== null && clipSkip !== undefined) mapped.clip_skip = clipSkip;

            const inputs = geninfo.inputs;
            if (Array.isArray(inputs)) {
                mapped.inputs = inputs;
            }
            const lyrics = geninfo.lyrics?.value ?? geninfo.lyrics ?? null;
            if (typeof lyrics === "string" && lyrics.trim()) mapped.lyrics = lyrics;
            const lyricsStrength =
                geninfo.lyrics_strength?.value ?? geninfo.lyrics_strength ?? null;
            if (lyricsStrength !== null && lyricsStrength !== undefined)
                mapped.lyrics_strength = lyricsStrength;
            const notes = geninfo.notes?.value ?? geninfo.workflow_notes?.value ?? geninfo.notes ?? geninfo.workflow_notes ?? null;
            if (typeof notes === "string" && notes.trim()) mapped.workflow_notes = notes.trim();
            markOverride(["workflow_notes", "notes"], geninfo.notes ?? geninfo.workflow_notes);
            if (Array.isArray(geninfo.custom_info)) mapped.custom_info = geninfo.custom_info;
            if (Array.isArray(geninfo.custom_info) && geninfo.engine?.mode === "override") {
                overrideFields.add("custom_info");
            }

            // Multi-output workflow prompts
            if (
                Array.isArray(geninfo.all_positive_prompts) &&
                geninfo.all_positive_prompts.length > 1
            ) {
                mapped.all_positive_prompts = geninfo.all_positive_prompts;
            }
            if (
                Array.isArray(geninfo.all_negative_prompts) &&
                geninfo.all_negative_prompts.length > 1
            ) {
                mapped.all_negative_prompts = geninfo.all_negative_prompts;
            }

            // Multi-output workflow samplers
            if (Array.isArray(geninfo.all_samplers) && geninfo.all_samplers.length > 1) {
                mapped.all_samplers = geninfo.all_samplers;
            }

            // Multi-pass chained pipeline samplers
            if (Array.isArray(geninfo.chained_passes) && geninfo.chained_passes.length > 1) {
                mapped.chained_passes = geninfo.chained_passes;
            }

            // Multi-pass workflow checkpoints
            if (Array.isArray(geninfo.all_checkpoints) && geninfo.all_checkpoints.length > 1) {
                mapped.all_checkpoints = geninfo.all_checkpoints;
            }

            const size = geninfo.size || null;
            if (size && typeof size === "object") {
                if (size.width !== undefined) mapped.width = size.width;
                if (size.height !== undefined) mapped.height = size.height;
            }

            if (geninfo.engine && typeof geninfo.engine === "object") {
                mapped.engine = geninfo.engine;
                if (
                    geninfo.engine.mode === "override" ||
                    geninfo.engine.parser_version === "geninfo-override-v1" ||
                    geninfo.engine.source === "majoor_geninfo"
                ) {
                    mapped.is_override = true;
                }
            }
            if (overrideFields.size) mapped.override_fields = Array.from(overrideFields);
            enrichSamplerStagesFromNativeWorkflow(mapped, raw);

            if (Object.keys(mapped).length) return mapped;
        }

        const parsedFromWorkflow = parseComfyUIWorkflow(raw);
        if (parsedFromWorkflow) return parsedFromWorkflow;

        if (looksLikeComfyPromptGraph(raw)) {
            const parsed = parseComfyUIWorkflow({ prompt: raw });
            if (parsed) return parsed;
        }

        const flatKeys = [
            "prompt",
            "negative_prompt",
            "negativePrompt",
            "steps",
            "sampler",
            "sampler_name",
            "cfg",
            "cfg_scale",
            "seed",
            "width",
            "height",
        ];
        const hasFlatKey = flatKeys.some((k: any) => Object.prototype.hasOwnProperty.call(raw, k));
        if (hasFlatKey) return raw;

        const maybeParams =
            raw["parameters"] ||
            raw["PNG:Parameters"] ||
            raw["EXIF:UserComment"] ||
            raw["UserComment"] ||
            raw["ImageDescription"] ||
            null;
        if (typeof maybeParams === "string") {
            const parsed = parseA1111Parameters(maybeParams);
            if (parsed) return parsed;
        }

        const innerWorkflow =
            raw.workflow || raw.Workflow || raw.comfy || raw.comfyui || raw.ComfyUI || null;
        if (innerWorkflow && typeof innerWorkflow === "object") {
            const parsed = parseComfyUIWorkflow(innerWorkflow);
            if (parsed) return parsed;
        }

        return raw;
    }

    if (typeof raw === "string") {
        const text = raw.trim();
        if (!text) return null;
        const parsedParams = parseA1111Parameters(text);
        if (parsedParams) return parsedParams;

        if (
            (text.startsWith("{") && text.endsWith("}")) ||
            (text.startsWith("[") && text.endsWith("]"))
        ) {
            try {
                const obj = JSON.parse(text);
                return normalizeGenerationMetadata(obj);
            } catch {
                return null;
            }
        }
        return { prompt: text };
    }

    return null;
}

function enrichSamplerStagesFromNativeWorkflow(mapped: Record<string, any>, raw: any) {
    const nativeWorkflow =
        raw?.workflow ||
        raw?.Workflow ||
        raw?.comfy_workflow ||
        raw?.comfy ||
        raw?.comfyui ||
        raw?.ComfyUI ||
        null;
    if (!nativeWorkflow || typeof nativeWorkflow !== "object") return;
    const parsed = parseComfyUIWorkflow(nativeWorkflow);
    const nativeSamplers = Array.isArray(parsed?.all_samplers) ? parsed.all_samplers : [];
    if (!nativeSamplers.length) return;
    for (const key of ["all_samplers", "chained_passes"]) {
        const current = Array.isArray(mapped[key]) ? mapped[key] : [];
        if (!current.length) continue;
        mapped[key] = current.map((item: any, index: number) => {
            const stage = nativeSamplers[index]?.pass_stage;
            if (!stage || item?.pass_stage) return item;
            return { ...item, pass_stage: stage };
        });
    }
    if (!Array.isArray(mapped.all_samplers) && nativeSamplers.length > 1) {
        mapped.all_samplers = nativeSamplers;
    }
}

export function looksLikeFilePathPrompt(value: any): boolean {
    const raw = typeof value === "string" ? value.trim() : "";
    if (!raw || raw.includes("\n")) return false;
    return FILEPATH_PROMPT_RE.test(raw) || FILEPATH_SEGMENTED_PROMPT_RE.test(raw);
}

export function sanitizePromptForDisplay(value: any): string {
    const text = typeof value === "string" ? value.trim() : "";
    if (!text) return "";
    return looksLikeFilePathPrompt(text) ? "" : text;
}

export function normalizePromptsForDisplay(positive: any, negative: any) {
    let pos = sanitizePromptForDisplay(positive);
    let neg = sanitizePromptForDisplay(negative);

    // Always check if positive contains a negative block, even if negative is already provided.
    // This prevents the "pos/neg concatenation" bug where both sources appear.
    if (pos) {
        const marker = /(?:^|\n)\s*Negative prompt:\s*/i;
        if (marker.test(pos)) {
            const parts = pos.split(marker);
            const extractedPos = (parts[0] || "").trim();
            const tail = parts.slice(1).join("Negative prompt:").trim();
            const maybeParamsIdx = tail.search(/\n\s*Steps:\s*\d+/i);
            const extractedNeg = (
                maybeParamsIdx >= 0 ? tail.slice(0, maybeParamsIdx) : tail
            ).trim();

            if (extractedPos) pos = sanitizePromptForDisplay(extractedPos);
            // Only use extractedNeg if we don't already have an explicit negative
            if (!neg && extractedNeg) neg = sanitizePromptForDisplay(extractedNeg);
        }
    }

    if (pos && neg && pos.trim() === neg.trim()) {
        neg = "";
    }

    return { positive: pos, negative: neg };
}

export function formatModelLabel(value: any): string {
    if (!value) return "";
    const s = String(value).trim().replace(/\\/g, "/");
    const base = s.split("/").pop() || s;
    return base.replace(/\.(safetensors|ckpt|pt|pth|bin|gguf|json)$/i, "");
}

export function formatLoRAItem(lora: any) {
    if (!lora) return "";
    if (typeof lora === "string") return formatModelLabel(lora);

    const name = formatModelLabel(lora.name || lora.lora_name || "");
    if (!name) return "";

    const w = lora.weight ?? lora.strength ?? null;
    const sm = lora.strength_model ?? null;
    const sc = lora.strength_clip ?? null;

    if (sm !== null || sc !== null) {
        const parts = [];
        if (sm !== null && sm !== undefined) parts.push(`m=${sm}`);
        if (sc !== null && sc !== undefined) parts.push(`c=${sc}`);
        return parts.length ? `${name} (${parts.join(", ")})` : name;
    }

    if (w !== null && w !== undefined) return `${name} (${w})`;
    return name;
}

export function humanizeWorkflowType(value: any): string {
    const raw = String(value || "").trim().toLowerCase();
    if (!raw) return "";
    if (raw === "img2vid") return "Image-to-Video";
    if (raw === "txt2vid") return "Text-to-Video";
    if (raw === "img2img") return "Image-to-Image";
    if (raw === "txt2img") return "Text-to-Image";
    if (raw === "vid2vid") return "Video-to-Video";
    if (raw === "tts") return "Text-to-Speech";
    if (raw === "audio") return "Audio";
    return raw
        .split(/[_\s-]+/)
        .filter(Boolean)
        .map((part: any) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

export function humanizeApiProvider(value: any): string {
    const raw = String(value || "").trim().toLowerCase();
    if (!raw || raw === "api") return "";
    const aliases = {
        happy_horse: "Happy Horse",
        google_gemini: "Google Gemini",
        google_veo: "Google Veo",
        openai: "OpenAI",
        anthropic: "Anthropic",
        black_forest_labs: "Black Forest Labs",
        stability_ai: "Stability AI",
        alibaba_wan: "Alibaba Wan",
        kling_ai: "Kling AI",
        luma_dream_machine: "Luma Dream Machine",
        minimax_hailuo: "MiniMax Hailuo",
        xai_grok: "xAI Grok",
        ltxv_api: "LTXV API",
        eleven_labs: "ElevenLabs",
        bytedance_seedance: "ByteDance Seedance",
    };
    if ((aliases as Record<string, any>)[raw]) return (aliases as Record<string, any>)[raw];
    return raw
        .split(/[_\s-]+/)
        .filter(Boolean)
        .map((part: any) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

export function buildWorkflowPresentation(metadata: any) {
    const engine = metadata?.engine && typeof metadata.engine === "object" ? metadata.engine : null;
    const workflowType = String(engine?.type || "").trim();
    const samplerMode = String(engine?.sampler_mode || "").trim().toLowerCase();
    const workflowLabelBase = humanizeWorkflowType(workflowType) || workflowType;
    const workflowBadge = humanizeApiProvider(engine?.api_provider);
    const workflowLabel = samplerMode === "api"
        ? `API ${workflowLabelBase || "Workflow"}`
        : workflowLabelBase;
    return {
        workflowType,
        workflowLabel: String(workflowLabel || workflowType).trim(),
        workflowBadge,
    };
}
