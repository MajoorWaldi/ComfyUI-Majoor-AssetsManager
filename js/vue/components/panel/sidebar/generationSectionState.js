import { buildViewURL } from "../../../../api/endpoints.js";
import { loadMajoorSettings } from "../../../../app/settings.js";
import {
    buildWorkflowPresentation,
    formatLoRAItem,
    formatModelLabel,
    normalizeGenerationMetadata,
    normalizePromptsForDisplay,
    sanitizePromptForDisplay,
} from "../../../../components/sidebar/parsers/geninfoParser.js";

const IMAGE_EXTENSIONS = new Set([
    "png",
    "jpg",
    "jpeg",
    "webp",
    "gif",
    "bmp",
    "tiff",
    "tif",
    "avif",
    "heic",
    "heif",
    "apng",
    "hdr",
    "svg",
]);

function assetExtension(asset) {
    const raw = String(asset?.filename || asset?.name || asset?.filepath || asset?.path || "")
        .trim()
        .toLowerCase();
    if (!raw || !raw.includes(".")) return "";
    return raw.split(".").pop() || "";
}

export function isImageLikeAsset(asset) {
    const kind = String(asset?.kind || "")
        .trim()
        .toLowerCase();
    if (kind === "image") return true;
    const mime = String(asset?.mime || asset?.mimetype || "")
        .trim()
        .toLowerCase();
    if (mime.startsWith("image/")) return true;
    return IMAGE_EXTENSIONS.has(assetExtension(asset));
}

export function isJpegAsset(asset) {
    const ext = assetExtension(asset);
    return ext === "jpg" || ext === "jpeg";
}

export function isGenerationAiEnabled() {
    try {
        const settings = loadMajoorSettings();
        return !!(settings?.ai?.vectorSearchEnabled ?? true);
    } catch {
        return true;
    }
}

export function getAlignmentColor(score) {
    if (score >= 0.75) return "#4CAF50";
    if (score >= 0.5) return "#8BC34A";
    if (score >= 0.3) return "#FF9800";
    return "#F44336";
}

export function getAlignmentLabel(score) {
    if (score >= 0.85) return "Excellent";
    if (score >= 0.7) return "Good";
    if (score >= 0.5) return "Fair";
    if (score >= 0.3) return "Low";
    return "Very Low";
}

export function normalizeCaptionDisplay(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const lines = [];
    for (const line of raw.replace(/\r\n/g, "\n").split("\n")) {
        let item = String(line || "").trim();
        if (!item) continue;
        if (/^title\s*:/i.test(item)) continue;
        if (/^caption\s*:/i.test(item)) {
            item = item.replace(/^caption\s*:/i, "").trim();
        }
        if (item) lines.push(item);
    }
    return (lines.length ? lines.join(" ") : raw).replace(/\s+/g, " ").replace(/:{2,}\s*$/, "").trim();
}

export function inputPreviewCandidates(inputAsset) {
    const filename = String(inputAsset?.filename || "").trim();
    if (!filename) return [];
    const subfolder = String(inputAsset?.subfolder || "").trim();
    const preferredType = String(inputAsset?.folder_type || "input")
        .trim()
        .toLowerCase();
    const candidates = [];
    const pushType = (type) => {
        if (!type) return;
        const url = buildViewURL(filename, subfolder, type);
        if (url && !candidates.includes(url)) candidates.push(url);
    };
    if (preferredType === "input" || preferredType === "output") pushType(preferredType);
    pushType("input");
    pushType("output");
    return candidates;
}

export function isSafeOpenUrl(url) {
    const value = String(url || "").trim();
    if (!value) return false;
    if (value.startsWith("/")) return true;
    try {
        const parsed = new URL(value);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        return false;
    }
}

export function formatPipelineValue(value) {
    if (value === undefined || value === null || value === "") return "-";
    return String(value);
}

export function resolvePassName(passData, index) {
    const explicitName = String(passData?.pass_name || "").trim();
    if (explicitName) return explicitName;
    const denoise = Number(passData?.denoise);
    if (index === 0 || denoise === 1) return "Base";
    if (Number.isFinite(denoise) && denoise < 1) return "Refine / Upscale";
    return `Pass ${index + 1}`;
}

function getMetadataSource(asset) {
    if (asset?.geninfo && typeof asset.geninfo === "object") {
        return { geninfo: asset.geninfo };
    }
    if (
        asset?.metadata &&
        (typeof asset.metadata === "object" || typeof asset.metadata === "string")
    ) {
        return asset.metadata;
    }
    if (asset?.prompt && (typeof asset.prompt === "object" || typeof asset.prompt === "string")) {
        return asset.prompt;
    }
    if (asset?.metadata_raw) return asset.metadata_raw;
    if (asset?.exif) return asset.exif;
    return null;
}

function hasDisplayableFields(obj) {
    try {
        if (!obj || typeof obj !== "object") return false;
        if (obj.engine && typeof obj.engine === "object" && obj.engine.type) return true;
        if (sanitizePromptForDisplay(obj.prompt)) return true;
        if (
            typeof (obj.negative_prompt || obj.negativePrompt) === "string" &&
            sanitizePromptForDisplay(obj.negative_prompt || obj.negativePrompt)
        ) {
            return true;
        }
        if (obj.models || obj.model || obj.checkpoint || obj.loras) return true;
        if (
            obj.sampler ||
            obj.sampler_name ||
            obj.steps ||
            obj.cfg ||
            obj.cfg_scale ||
            obj.cfg_high_noise ||
            obj.cfg_low_noise ||
            obj.scheduler
        ) return true;
        if (Array.isArray(obj.chained_passes) && obj.chained_passes.length > 0) return true;
        if (Array.isArray(obj.all_samplers) && obj.all_samplers.length > 0) return true;
        if (obj.seed || obj.denoise || obj.denoising || obj.clip_skip) return true;
        if (obj.voice || obj.language || obj.temperature || obj.top_k || obj.top_p || obj.repetition_penalty || obj.max_new_tokens) {
            return true;
        }
        if (obj.device || obj.voice_preset || obj.instruct || obj.dtype || obj.attn_implementation) {
            return true;
        }
        if (
            obj.enable_chunking !== undefined ||
            obj.max_chars_per_chunk ||
            obj.chunk_combination_method ||
            obj.silence_between_chunks_ms
        ) {
            return true;
        }
        if (
            obj.enable_audio_cache !== undefined ||
            obj.batch_size !== undefined ||
            obj.use_torch_compile !== undefined ||
            obj.use_cuda_graphs !== undefined ||
            obj.compile_mode
        ) {
            return true;
        }
        if (typeof obj.lyrics === "string" && obj.lyrics.trim()) return true;
    } catch {
        return false;
    }
    return false;
}

function pickModelName(model) {
    if (!model) return "";
    if (typeof model === "string") return formatModelLabel(model);
    if (typeof model === "object") return formatModelLabel(model.name || model.value || "");
    return "";
}

function pushUniqueModelField(modelFields, seenPairs, label, value) {
    const text = String(value || "").trim();
    if (!text) return;
    const key = `${label}::${text}`;
    if (seenPairs.has(key)) return;
    seenPairs.add(key);
    modelFields.push({ label, value: text });
}

function pickLoraBranchKey(item) {
    const source = String(item?.source || "").toLowerCase();
    const name = String(item?.name || item?.lora_name || "").toLowerCase();
    const haystack = `${source} ${name}`;
    if (haystack.includes("high_noise") || haystack.includes("high noise")) return "high_noise";
    if (haystack.includes("low_noise") || haystack.includes("low noise")) return "low_noise";
    return "";
}

function buildModelGroupState(metadata) {
    const groups = [];
    const fromPayload = Array.isArray(metadata.model_groups) ? metadata.model_groups : [];
    if (fromPayload.length) {
        fromPayload.forEach((group) => {
            if (!group || typeof group !== "object") return;
            const modelName = pickModelName(group.model);
            const loras = Array.isArray(group.loras)
                ? group.loras.map((item) => formatLoRAItem(item)).filter(Boolean)
                : [];
            if (!modelName && !loras.length) return;
            groups.push({
                key: String(group.key || "").trim() || `group-${groups.length + 1}`,
                label: String(group.label || "").trim() || `Group ${groups.length + 1}`,
                model: modelName,
                loras,
            });
        });
        return groups;
    }

    const models = metadata.models && typeof metadata.models === "object" ? metadata.models : null;
    const loras = Array.isArray(metadata.loras) ? metadata.loras : [];
    if (!models) return groups;

    const fallbackGroups = [
        { key: "high_noise", label: "High Noise", model: pickModelName(models.unet_high_noise) },
        { key: "low_noise", label: "Low Noise", model: pickModelName(models.unet_low_noise) },
    ];
    fallbackGroups.forEach((group) => {
        const groupedLoras = loras
            .filter((item) => pickLoraBranchKey(item) === group.key)
            .map((item) => formatLoRAItem(item))
            .filter(Boolean);
        if (!group.model && !groupedLoras.length) return;
        groups.push({ ...group, loras: groupedLoras });
    });
    return groups;
}

function createBooleanField(label, value) {
    if (value === undefined || value === null) return null;
    return { label, value: value ? "on" : "off" };
}

export function buildGenerationSectionState(asset) {
    const normalized = normalizeGenerationMetadata(getMetadataSource(asset));
    const emptyState = {
        kind: "empty",
        title: "Generation",
        workflowType: "",
        workflowLabel: "",
        workflowBadge: "",
        isTruncated: false,
        positivePrompt: "",
        negativePrompt: "",
        promptTabs: [],
        mediaOnlyMessage: "",
        showAlignment: false,
        captionLabel: "Image Description",
        emptyCaptionText: "No image description yet.",
        isImageAsset: isImageLikeAsset(asset),
        lyrics: "",
        modelFields: [],
        modelGroups: [],
        pipelineTabs: [],
        samplingFields: [],
        ttsFields: [],
        ttsEngineFields: [],
        ttsInstruction: "",
        ttsRuntimeFields: [],
        audioFields: [],
        seed: null,
        imageFields: [],
        inputFiles: [],
    };

    if (
        !normalized ||
        (typeof normalized === "object" && Object.keys(normalized).length === 0) ||
        !hasDisplayableFields(normalized)
    ) {
        const status = asset?.metadata_raw?.geninfo_status || asset?.geninfo_status;
        if (status && typeof status === "object" && status.kind === "media_pipeline") {
            return {
                ...emptyState,
                kind: "media-only",
                mediaOnlyMessage:
                    "This file looks like a media-only pipeline (e.g. LoadVideo/VideoCombine) and does not contain generation parameters.",
            };
        }

        if (isImageLikeAsset(asset) || isJpegAsset(asset)) {
            return {
                ...emptyState,
                kind: "caption-only",
                showAlignment: false,
            };
        }

        return emptyState;
    }

    const metadata = normalized;
    const workflowPresentation = buildWorkflowPresentation(metadata);
    const cleanedPrompts = normalizePromptsForDisplay(
        typeof metadata.prompt === "string" ? metadata.prompt : null,
        typeof (metadata.negative_prompt || metadata.negativePrompt) === "string"
            ? metadata.negative_prompt || metadata.negativePrompt
            : null,
    );

    const promptTabs =
        Array.isArray(metadata.all_positive_prompts) && metadata.all_positive_prompts.length > 1
            ? metadata.all_positive_prompts
                  .map((positive, index) => {
                      const prompts = normalizePromptsForDisplay(
                          typeof positive === "string" ? positive : "",
                          typeof metadata.all_negative_prompts?.[index] === "string"
                              ? metadata.all_negative_prompts[index]
                              : "",
                      );
                      return {
                          label: `Prompt ${index + 1}`,
                          positive: sanitizePromptForDisplay(prompts.positive),
                          negative: sanitizePromptForDisplay(prompts.negative),
                      };
                  })
                  .filter((item) => item.positive)
            : [];

    const modelFields = [];
    const seenModelPairs = new Set();
    const models = metadata.models && typeof metadata.models === "object" ? metadata.models : null;
    const modelGroups = buildModelGroupState(metadata);
    const groupedModelNames = new Set(
        modelGroups.map((group) => String(group.model || "").trim()).filter(Boolean),
    );
    const allCheckpoints =
        Array.isArray(metadata.all_checkpoints) && metadata.all_checkpoints.length > 1
            ? metadata.all_checkpoints
            : null;
    if (models) {
        const branchNames = new Set([
            pickModelName(models.unet_high_noise),
            pickModelName(models.unet_low_noise),
            ...groupedModelNames,
        ].filter(Boolean));
        if (allCheckpoints) {
            allCheckpoints.forEach((checkpoint, index) => {
                const name = pickModelName(checkpoint);
                pushUniqueModelField(modelFields, seenModelPairs, `Checkpoint ${index + 1}`, name);
            });
        } else {
            const checkpoint = pickModelName(models.checkpoint);
            if (checkpoint && !branchNames.has(checkpoint)) {
                pushUniqueModelField(modelFields, seenModelPairs, "Checkpoint", checkpoint);
            }
        }
        const fields = [
            ["UNet", pickModelName(models.unet)],
            ["Diffusion", pickModelName(models.diffusion)],
            ["Upscaler", pickModelName(models.upscaler)],
            ["CLIP", pickModelName(models.clip)],
            ["VAE", pickModelName(models.vae)],
        ];
        fields.forEach(([label, value]) => {
            if (branchNames.has(value)) return;
            pushUniqueModelField(modelFields, seenModelPairs, label, value);
        });
    } else if (metadata.model || metadata.checkpoint) {
        pushUniqueModelField(
            modelFields,
            seenModelPairs,
            "Model",
            formatModelLabel(metadata.model || metadata.checkpoint),
        );
    }

    if (Array.isArray(metadata.loras) && metadata.loras.length > 0) {
        const loraText = metadata.loras
            .map((item) => formatLoRAItem(item))
            .filter(Boolean)
            .join("\n");
        if (loraText) {
            pushUniqueModelField(
                modelFields,
                seenModelPairs,
                metadata.loras.length > 1 ? "LoRAs" : "LoRA",
                loraText,
            );
        }
    }

    if (!models && metadata.clip) pushUniqueModelField(modelFields, seenModelPairs, "CLIP", formatModelLabel(metadata.clip));
    if (!models && metadata.vae) pushUniqueModelField(modelFields, seenModelPairs, "VAE", formatModelLabel(metadata.vae));
    if (!models && metadata.unet) pushUniqueModelField(modelFields, seenModelPairs, "UNet", formatModelLabel(metadata.unet));
    if (!models && metadata.diffusion) {
        pushUniqueModelField(modelFields, seenModelPairs, "Diffusion", formatModelLabel(metadata.diffusion));
    }

    const samplingFields = [];
    if (metadata.sampler || metadata.sampler_name) {
        samplingFields.push({ label: "Sampler", value: metadata.sampler || metadata.sampler_name });
    }
    if (metadata.steps !== undefined && metadata.steps !== null) {
        samplingFields.push({ label: "Steps", value: metadata.steps });
    }
    if (metadata.cfg || metadata.cfg_scale) {
        samplingFields.push({ label: "CFG Scale", value: metadata.cfg || metadata.cfg_scale });
    }
    if (metadata.cfg_high_noise !== undefined && metadata.cfg_high_noise !== null) {
        samplingFields.push({ label: "CFG High Noise", value: metadata.cfg_high_noise });
    }
    if (metadata.cfg_low_noise !== undefined && metadata.cfg_low_noise !== null) {
        samplingFields.push({ label: "CFG Low Noise", value: metadata.cfg_low_noise });
    }
    if (metadata.scheduler) samplingFields.push({ label: "Scheduler", value: metadata.scheduler });

    let pipelineTabs = [];
    if (Array.isArray(metadata.chained_passes) && metadata.chained_passes.length > 1) {
        pipelineTabs = metadata.chained_passes
            .filter((passItem) => passItem && typeof passItem === "object")
            .map((passItem, index) => ({
                label: resolvePassName(passItem, index),
                fields: [
                    { label: "Sampler", value: formatPipelineValue(passItem?.sampler_name || passItem?.sampler) },
                    { label: "Scheduler", value: formatPipelineValue(passItem?.scheduler) },
                    { label: "Steps", value: formatPipelineValue(passItem?.steps) },
                    { label: "CFG", value: formatPipelineValue(passItem?.cfg) },
                    { label: "Denoise", value: formatPipelineValue(passItem?.denoise) },
                    { label: "Seed", value: formatPipelineValue(passItem?.seed_val || passItem?.seed) },
                ],
            }));
    } else if (Array.isArray(metadata.all_samplers) && metadata.all_samplers.length > 1) {
        pipelineTabs = metadata.all_samplers
            .filter((passItem) => passItem && typeof passItem === "object")
            .map((passItem, index) => ({
                label: resolvePassName(passItem, index),
                fields: [
                    { label: "Sampler", value: formatPipelineValue(passItem?.sampler_name || passItem?.sampler) },
                    { label: "Scheduler", value: formatPipelineValue(passItem?.scheduler) },
                    { label: "Steps", value: formatPipelineValue(passItem?.steps) },
                    { label: "CFG", value: formatPipelineValue(passItem?.cfg) },
                    { label: "Denoise", value: formatPipelineValue(passItem?.denoise) },
                    { label: "Seed", value: formatPipelineValue(passItem?.seed_val || passItem?.seed) },
                ],
            }));
    }

    const ttsFields = [];
    if (metadata.voice) ttsFields.push({ label: "Narrator Voice", value: metadata.voice });
    if (metadata.language) ttsFields.push({ label: "Language", value: metadata.language });
    if (metadata.top_k !== undefined && metadata.top_k !== null) ttsFields.push({ label: "Top-k", value: metadata.top_k });
    if (metadata.top_p !== undefined && metadata.top_p !== null) ttsFields.push({ label: "Top-p", value: metadata.top_p });
    if (metadata.temperature !== undefined && metadata.temperature !== null) ttsFields.push({ label: "Temperature", value: metadata.temperature });
    if (metadata.repetition_penalty !== undefined && metadata.repetition_penalty !== null) {
        ttsFields.push({ label: "Repetition Penalty", value: metadata.repetition_penalty });
    }
    if (metadata.max_new_tokens !== undefined && metadata.max_new_tokens !== null) {
        ttsFields.push({ label: "Max New Tokens", value: metadata.max_new_tokens });
    }

    const ttsEngineFields = [];
    if (metadata.device) ttsEngineFields.push({ label: "Device", value: metadata.device });
    if (metadata.voice_preset) ttsEngineFields.push({ label: "Voice Preset", value: metadata.voice_preset });
    if (metadata.dtype) ttsEngineFields.push({ label: "Dtype", value: metadata.dtype });
    if (metadata.attn_implementation) ttsEngineFields.push({ label: "Attention", value: metadata.attn_implementation });
    if (metadata.compile_mode) ttsEngineFields.push({ label: "Compile Mode", value: metadata.compile_mode });
    [
        createBooleanField("Torch Compile", metadata.use_torch_compile),
        createBooleanField("CUDA Graphs", metadata.use_cuda_graphs),
        createBooleanField("X-Vector Only", metadata.x_vector_only_mode),
    ]
        .filter(Boolean)
        .forEach((field) => ttsEngineFields.push(field));

    const ttsRuntimeFields = [];
    [
        createBooleanField("Chunking", metadata.enable_chunking),
        metadata.max_chars_per_chunk !== undefined && metadata.max_chars_per_chunk !== null
            ? { label: "Max Chars/Chunk", value: metadata.max_chars_per_chunk }
            : null,
        metadata.chunk_combination_method
            ? { label: "Chunk Method", value: metadata.chunk_combination_method }
            : null,
        metadata.silence_between_chunks_ms !== undefined && metadata.silence_between_chunks_ms !== null
            ? { label: "Silence Between Chunks (ms)", value: metadata.silence_between_chunks_ms }
            : null,
        createBooleanField("Audio Cache", metadata.enable_audio_cache),
        metadata.batch_size !== undefined && metadata.batch_size !== null
            ? { label: "Batch Size", value: metadata.batch_size }
            : null,
    ]
        .filter(Boolean)
        .forEach((field) => ttsRuntimeFields.push(field));

    const audioFields = [];
    if (metadata.lyrics_strength !== undefined && metadata.lyrics_strength !== null) {
        audioFields.push({ label: "Lyrics Strength", value: metadata.lyrics_strength });
    }

    const imageFields = [];
    if (metadata.denoise || metadata.denoising) {
        imageFields.push({ label: "Denoise", value: metadata.denoise || metadata.denoising });
    }
    if (metadata.clip_skip) imageFields.push({ label: "Clip Skip", value: metadata.clip_skip });

    const inputFiles = Array.isArray(metadata.inputs)
        ? metadata.inputs
              .filter((inputAsset) => inputAsset && typeof inputAsset === "object" && inputAsset.filename)
              .map((inputAsset, index) => ({
                  id: `${inputAsset.filename}-${index}`,
                  filename: String(inputAsset.filename || "").trim(),
                  filepath: String(inputAsset.filepath || inputAsset.filename || "").trim(),
                  role: String(inputAsset.role || "").trim(),
                  roleLabel: String(inputAsset.role || "").trim().replace(/_/g, " "),
                  isVideo:
                      String(inputAsset.type || "").toLowerCase() === "video" ||
                      /\.(mp4|mov|webm)$/i.test(String(inputAsset.filename || "")),
                  previewCandidates: inputPreviewCandidates(inputAsset),
              }))
        : [];

    return {
        ...emptyState,
        kind: "full",
        metadata,
        workflowType: workflowPresentation.workflowType,
        workflowLabel: workflowPresentation.workflowLabel,
        workflowBadge: workflowPresentation.workflowBadge,
        isTruncated: Boolean(asset?.geninfo?._truncated || asset?.metadata?._truncated || asset?.prompt?._truncated),
        positivePrompt: promptTabs.length ? "" : String(cleanedPrompts.positive || "").trim(),
        negativePrompt: promptTabs.length ? "" : String(cleanedPrompts.negative || "").trim(),
        promptTabs,
        showAlignment: !!asset?.id && (!!String(cleanedPrompts.positive || "").trim() || promptTabs.length > 0),
        isImageAsset: isImageLikeAsset(asset),
        lyrics: String(metadata.lyrics || "").trim(),
        modelFields,
        modelGroups,
        pipelineTabs,
        samplingFields,
        ttsFields,
        ttsEngineFields,
        ttsInstruction: String(metadata.instruct || "").trim(),
        ttsRuntimeFields,
        audioFields,
        seed: metadata.seed ?? null,
        imageFields,
        inputFiles,
    };
}
