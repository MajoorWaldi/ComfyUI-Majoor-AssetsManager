import { parseA1111Parameters } from "./a1111ParamsParser.js";
import { looksLikeComfyPromptGraph, parseComfyUIWorkflow } from "./comfyWorkflowParser.js";

export function normalizeGenerationMetadata(raw) {
    if (!raw) return null;

        if (typeof raw === "object") {
            const geninfo = raw.geninfo || raw.GenInfo || raw.generation || null;
            if (geninfo && typeof geninfo === "object") {
                const mapped = {};
                const pos = geninfo.positive?.value ?? geninfo.positive?.text ?? null;
                const neg = geninfo.negative?.value ?? geninfo.negative?.text ?? null;
                if (typeof pos === "string" && pos.trim()) mapped.prompt = pos;
                if (typeof neg === "string" && neg.trim()) mapped.negative_prompt = neg;

                const ckpt = geninfo.checkpoint?.name ?? geninfo.checkpoint ?? null;
                if (typeof ckpt === "string" && ckpt.trim()) mapped.model = ckpt;

                const clip = geninfo.clip?.name ?? geninfo.clip ?? null;
                if (typeof clip === "string" && clip.trim()) mapped.clip = clip;
                const vae = geninfo.vae?.name ?? geninfo.vae ?? null;
                if (typeof vae === "string" && vae.trim()) mapped.vae = vae;

                const models = geninfo.models;
                if (models && typeof models === "object") {
                    mapped.models = models;
                }

                const loras = Array.isArray(geninfo.loras) ? geninfo.loras : null;
                if (loras) mapped.loras = loras;

            const sampler = geninfo.sampler?.name ?? geninfo.sampler ?? null;
            if (typeof sampler === "string" && sampler.trim()) mapped.sampler = sampler;
            const scheduler = geninfo.scheduler?.name ?? geninfo.scheduler ?? null;
            if (typeof scheduler === "string" && scheduler.trim()) mapped.scheduler = scheduler;

            const steps = geninfo.steps?.value ?? geninfo.steps ?? null;
            if (steps !== null && steps !== undefined) mapped.steps = steps;
            const cfg = geninfo.cfg?.value ?? geninfo.cfg ?? null;
            if (cfg !== null && cfg !== undefined) mapped.cfg = cfg;
            const seed = geninfo.seed?.value ?? geninfo.seed ?? null;
            if (seed !== null && seed !== undefined) mapped.seed = seed;
            const voice = geninfo.voice?.name ?? geninfo.voice?.value ?? geninfo.voice ?? null;
            if (voice !== null && voice !== undefined && String(voice).trim()) mapped.voice = String(voice).trim();
            const language = geninfo.language?.value ?? geninfo.language ?? null;
            if (language !== null && language !== undefined && String(language).trim()) mapped.language = String(language).trim();
            const temperature = geninfo.temperature?.value ?? geninfo.temperature ?? null;
            if (temperature !== null && temperature !== undefined) mapped.temperature = temperature;
            const topK = geninfo.top_k?.value ?? geninfo.top_k ?? null;
            if (topK !== null && topK !== undefined) mapped.top_k = topK;
            const topP = geninfo.top_p?.value ?? geninfo.top_p ?? null;
            if (topP !== null && topP !== undefined) mapped.top_p = topP;
            const repetitionPenalty = geninfo.repetition_penalty?.value ?? geninfo.repetition_penalty ?? null;
            if (repetitionPenalty !== null && repetitionPenalty !== undefined) mapped.repetition_penalty = repetitionPenalty;
            const maxNewTokens = geninfo.max_new_tokens?.value ?? geninfo.max_new_tokens ?? null;
            if (maxNewTokens !== null && maxNewTokens !== undefined) mapped.max_new_tokens = maxNewTokens;
            const device = geninfo.device?.value ?? geninfo.device ?? null;
            if (device !== null && device !== undefined && String(device).trim()) mapped.device = String(device).trim();
            const voicePreset = geninfo.voice_preset?.value ?? geninfo.voice_preset ?? null;
            if (voicePreset !== null && voicePreset !== undefined && String(voicePreset).trim()) mapped.voice_preset = String(voicePreset).trim();
            const instruct = geninfo.instruct?.value ?? geninfo.instruct ?? null;
            if (instruct !== null && instruct !== undefined && String(instruct).trim()) mapped.instruct = String(instruct).trim();
            const dtype = geninfo.dtype?.value ?? geninfo.dtype ?? null;
            if (dtype !== null && dtype !== undefined && String(dtype).trim()) mapped.dtype = String(dtype).trim();
            const attnImplementation = geninfo.attn_implementation?.value ?? geninfo.attn_implementation ?? null;
            if (attnImplementation !== null && attnImplementation !== undefined && String(attnImplementation).trim())
                mapped.attn_implementation = String(attnImplementation).trim();
            const xVectorOnlyMode = geninfo.x_vector_only_mode?.value ?? geninfo.x_vector_only_mode ?? null;
            if (xVectorOnlyMode !== null && xVectorOnlyMode !== undefined) mapped.x_vector_only_mode = xVectorOnlyMode;
            const useTorchCompile = geninfo.use_torch_compile?.value ?? geninfo.use_torch_compile ?? null;
            if (useTorchCompile !== null && useTorchCompile !== undefined) mapped.use_torch_compile = useTorchCompile;
            const useCudaGraphs = geninfo.use_cuda_graphs?.value ?? geninfo.use_cuda_graphs ?? null;
            if (useCudaGraphs !== null && useCudaGraphs !== undefined) mapped.use_cuda_graphs = useCudaGraphs;
            const compileMode = geninfo.compile_mode?.value ?? geninfo.compile_mode ?? null;
            if (compileMode !== null && compileMode !== undefined && String(compileMode).trim()) mapped.compile_mode = String(compileMode).trim();
            const enableChunking = geninfo.enable_chunking?.value ?? geninfo.enable_chunking ?? null;
            if (enableChunking !== null && enableChunking !== undefined) mapped.enable_chunking = enableChunking;
            const maxCharsPerChunk = geninfo.max_chars_per_chunk?.value ?? geninfo.max_chars_per_chunk ?? null;
            if (maxCharsPerChunk !== null && maxCharsPerChunk !== undefined) mapped.max_chars_per_chunk = maxCharsPerChunk;
            const chunkMethod = geninfo.chunk_combination_method?.value ?? geninfo.chunk_combination_method ?? null;
            if (chunkMethod !== null && chunkMethod !== undefined && String(chunkMethod).trim())
                mapped.chunk_combination_method = String(chunkMethod).trim();
            const silenceBetweenChunks = geninfo.silence_between_chunks_ms?.value ?? geninfo.silence_between_chunks_ms ?? null;
            if (silenceBetweenChunks !== null && silenceBetweenChunks !== undefined)
                mapped.silence_between_chunks_ms = silenceBetweenChunks;
            const enableAudioCache = geninfo.enable_audio_cache?.value ?? geninfo.enable_audio_cache ?? null;
            if (enableAudioCache !== null && enableAudioCache !== undefined) mapped.enable_audio_cache = enableAudioCache;
            const batchSize = geninfo.batch_size?.value ?? geninfo.batch_size ?? null;
            if (batchSize !== null && batchSize !== undefined) mapped.batch_size = batchSize;
            const denoise = geninfo.denoise?.value ?? geninfo.denoise ?? null;
            if (denoise !== null && denoise !== undefined) mapped.denoise = denoise;
            const clipSkip = geninfo.clip_skip?.value ?? geninfo.clip_skip ?? geninfo.clipSkip ?? null;
            if (clipSkip !== null && clipSkip !== undefined) mapped.clip_skip = clipSkip;

            const inputs = geninfo.inputs;
            if (Array.isArray(inputs)) {
                mapped.inputs = inputs;
            }
            const lyrics = geninfo.lyrics?.value ?? geninfo.lyrics ?? null;
            if (typeof lyrics === "string" && lyrics.trim()) mapped.lyrics = lyrics;
            const lyricsStrength = geninfo.lyrics_strength?.value ?? geninfo.lyrics_strength ?? null;
            if (lyricsStrength !== null && lyricsStrength !== undefined) mapped.lyrics_strength = lyricsStrength;

            // Multi-output workflow prompts
            if (Array.isArray(geninfo.all_positive_prompts) && geninfo.all_positive_prompts.length > 1) {
                mapped.all_positive_prompts = geninfo.all_positive_prompts;
            }
            if (Array.isArray(geninfo.all_negative_prompts) && geninfo.all_negative_prompts.length > 1) {
                mapped.all_negative_prompts = geninfo.all_negative_prompts;
            }

            const size = geninfo.size || null;
            if (size && typeof size === "object") {
                if (size.width !== undefined) mapped.width = size.width;
                if (size.height !== undefined) mapped.height = size.height;
            }

            if (geninfo.engine && typeof geninfo.engine === "object") {
                mapped.engine = geninfo.engine;
            }

            if (Object.keys(mapped).length) return mapped;
        }

        const flatKeys = ["prompt", "negative_prompt", "negativePrompt", "steps", "sampler", "sampler_name", "cfg", "cfg_scale", "seed", "width", "height"];
        const hasFlatKey = flatKeys.some((k) => Object.prototype.hasOwnProperty.call(raw, k));
        if (hasFlatKey) return raw;

        const parsedFromWorkflow = parseComfyUIWorkflow(raw);
        if (parsedFromWorkflow) return parsedFromWorkflow;

        if (looksLikeComfyPromptGraph(raw)) {
            const parsed = parseComfyUIWorkflow({ prompt: raw });
            if (parsed) return parsed;
        }

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

        const innerWorkflow = raw.workflow || raw.Workflow || raw.comfy || raw.comfyui || raw.ComfyUI || null;
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

        if ((text.startsWith("{") && text.endsWith("}")) || (text.startsWith("[") && text.endsWith("]"))) {
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

export function normalizePromptsForDisplay(positive, negative) {
    let pos = typeof positive === "string" ? positive : "";
    let neg = typeof negative === "string" ? negative : "";

    // Always check if positive contains a negative block, even if negative is already provided.
    // This prevents the "pos/neg concatenation" bug where both sources appear.
    if (pos) {
        const marker = /(?:^|\n)\s*Negative prompt:\s*/i;
        if (marker.test(pos)) {
            const parts = pos.split(marker);
            const extractedPos = (parts[0] || "").trim();
            const tail = parts.slice(1).join("Negative prompt:").trim();
            const maybeParamsIdx = tail.search(/\n\s*Steps:\s*\d+/i);
            const extractedNeg = (maybeParamsIdx >= 0 ? tail.slice(0, maybeParamsIdx) : tail).trim();

            if (extractedPos) pos = extractedPos;
            // Only use extractedNeg if we don't already have an explicit negative
            if (!neg && extractedNeg) neg = extractedNeg;
        }
    }

    if (pos && neg && pos.trim() === neg.trim()) {
        neg = "";
    }

    return { positive: pos, negative: neg };
}

export function formatModelLabel(value) {
    if (!value) return "";
    const s = String(value).trim().replace(/\\/g, "/");
    const base = s.split("/").pop() || s;
    return base.replace(/\.(safetensors|ckpt|pt|pth|bin|gguf|json)$/i, "");
}

export function formatLoRAItem(lora) {
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
