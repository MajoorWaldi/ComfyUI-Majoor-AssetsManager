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

import { t } from "../../../../app/i18n.js";

type LooseRecord = Record<string, any>;
type Field = { label: string; value: any; override?: boolean };
type LtxDirectorSegment = {
    key: string;
    label: string;
    prompt: string;
    inLabel: string;
    outLabel: string;
    filename: string;
    filepath: string;
    type: string;
    isVideo: boolean;
    isAudio: boolean;
    previewCandidates: string[];
};
type LtxDirectorState = {
    title: string;
    globalPrompt: string;
    fields: Field[];
    segments: LtxDirectorSegment[];
};
type IdeogramElement = {
    key: string;
    label: string;
    description: string;
    text: string;
    bbox: string;
    palette: string[];
};
type IdeogramState = {
    title: string;
    json: string;
    highLevelDescription: string;
    background: string;
    fields: Field[];
    elements: IdeogramElement[];
    colorPalette: string[];
};
type BranchCard = {
    key: string;
    label: string;
    accent: string;
    modelFields: Field[];
    samplingFields: Field[];
    loras: string[];
};

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

function assetExtension(asset: LooseRecord | null | undefined): string {
    const raw = String(asset?.filename || asset?.name || asset?.filepath || asset?.path || "")
        .trim()
        .toLowerCase();
    if (!raw || !raw.includes(".")) return "";
    return raw.split(".").pop() || "";
}

export function isImageLikeAsset(asset: LooseRecord | null | undefined): boolean {
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

export function isJpegAsset(asset: LooseRecord | null | undefined): boolean {
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

export function getAlignmentColor(score: number): string {
    if (score >= 0.75) return "#4CAF50";
    if (score >= 0.5) return "#8BC34A";
    if (score >= 0.3) return "#FF9800";
    return "#F44336";
}

export function getAlignmentLabel(score: number): string {
    if (score >= 0.85) return "Excellent";
    if (score >= 0.7) return "Good";
    if (score >= 0.5) return "Fair";
    if (score >= 0.3) return "Low";
    return "Very Low";
}

export function normalizeCaptionDisplay(value: any): string {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const lines: any[] = [];
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

export function inputPreviewCandidates(inputAsset: LooseRecord | null | undefined): string[] {
    const filename = String(inputAsset?.filename || "").trim();
    if (!filename) return [];
    const subfolder = String(inputAsset?.subfolder || "").trim();
    const preferredType = String(inputAsset?.folder_type || "input")
        .trim()
        .toLowerCase();
    const candidates: string[] = [];
    const pushType = (type: string) => {
        if (!type) return;
        const url = buildViewURL(filename, subfolder, type);
        if (url && !candidates.includes(url)) candidates.push(url);
    };
    if (preferredType === "input" || preferredType === "output") pushType(preferredType);
    pushType("input");
    pushType("output");
    return candidates;
}

export function isSafeOpenUrl(url: any): boolean {
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

export function formatPipelineValue(value: any): string {
    if (value === undefined || value === null || value === "") return "-";
    return String(value);
}

export function resolvePassName(passData: LooseRecord | null | undefined, index: number): string {
    const stage = String(passData?.pass_stage || passData?.stage || passData?.kind || "")
        .trim()
        .toLowerCase();
    if (stage === "txt2img" || stage === "text_to_image" || stage === "text-to-image") {
        return t("sidebar.generation.stageTextToImage", "Text-to-Image");
    }
    if (stage === "img2img" || stage === "image_to_image" || stage === "image-to-image") {
        return t("sidebar.generation.stageImageToImage", "Image-to-Image");
    }
    if (stage === "inpaint" || stage === "inpainting") {
        return t("sidebar.generation.stageInpaint", "Inpaint");
    }
    if (stage === "upscale" || stage === "upscaling") {
        return t("sidebar.generation.stageUpscale", "Upscale");
    }
    if (stage === "refine" || stage === "refiner") {
        return t("sidebar.generation.stageRefine", "Refine");
    }
    const explicitName = String(passData?.pass_name || "").trim();
    if (explicitName && explicitName.toLowerCase() !== "base") return explicitName;
    const denoise = Number(passData?.denoise);
    if (index === 0 || denoise === 1) return t("sidebar.generation.stageBase", "Base");
    if (Number.isFinite(denoise) && denoise < 1) {
        return t("sidebar.generation.stageRefineUpscale", "Refine / Upscale");
    }
    return t("sidebar.generation.stagePassN", "Pass {n}", { n: index + 1 });
}

function getMetadataSources(asset: LooseRecord | null | undefined): any[] {
    const sources: any[] = [];
    if (asset?.metadata_raw) sources.push(asset.metadata_raw);
    if (asset?.workflow) sources.push(asset.workflow);
    if (asset?.metadata_raw?.workflow) sources.push(asset.metadata_raw.workflow);
    if (asset?.metadata_raw?.raw_ffprobe?.format?.tags) sources.push(asset.metadata_raw.raw_ffprobe.format.tags);
    if (asset?.metadata_raw?.ffprobe?.format?.tags) sources.push(asset.metadata_raw.ffprobe.format.tags);
    if (asset?.geninfo && typeof asset.geninfo === "object") {
        sources.push({ geninfo: asset.geninfo });
    }
    if (
        asset?.metadata &&
        (typeof asset.metadata === "object" || typeof asset.metadata === "string")
    ) {
        sources.push(asset.metadata);
    }
    if (asset?.prompt && (typeof asset.prompt === "object" || typeof asset.prompt === "string")) {
        sources.push(asset.prompt);
    }
    if (asset?.exif) sources.push(asset.exif);
    if (asset && typeof asset === "object") sources.push(asset);
    return sources;
}

function mergeMissingGenerationMetadata(target: LooseRecord, source: LooseRecord) {
    for (const [key, value] of Object.entries(source)) {
        if (value === undefined || value === null || value === "") continue;
        if (target[key] === undefined || target[key] === null || target[key] === "") {
            target[key] = value;
        }
    }
}

function normalizeAssetGenerationMetadata(asset: LooseRecord | null | undefined): LooseRecord | null {
    const sources = getMetadataSources(asset);
    const merged: LooseRecord = {};
    for (const source of sources) {
        const normalized = normalizeGenerationMetadata(source);
        if (!normalized || typeof normalized !== "object") continue;
        mergeMissingGenerationMetadata(merged, normalized);
    }
    return Object.keys(merged).length ? merged : null;
}

function hasDisplayableFields(obj: any): boolean {
    try {
        if (!obj || typeof obj !== "object") return false;
        if (obj.is_override) return true;
        if (typeof obj.workflow_notes === "string" && obj.workflow_notes.trim()) return true;
        if (typeof obj.notes === "string" && obj.notes.trim()) return true;
        if (Array.isArray(obj.custom_info) && obj.custom_info.length > 0) return true;
        if (obj.engine && typeof obj.engine === "object" && obj.engine.type) return true;
        if (sanitizePromptForDisplay(obj.prompt)) return true;
        if (
            typeof (obj.negative_prompt || obj.negativePrompt) === "string" &&
            sanitizePromptForDisplay(obj.negative_prompt || obj.negativePrompt)
        ) {
            return true;
        }
        if (obj.models || obj.model || obj.checkpoint || obj.loras) return true;
        if (obj.ltx_director && typeof obj.ltx_director === "object") return true;
        if (obj.ideogram && typeof obj.ideogram === "object") return true;
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

function pickModelName(model: any): string {
    if (!model) return "";
    if (typeof model === "string") return formatModelLabel(model);
    if (typeof model === "object") return formatModelLabel(model.name || model.value || "");
    return "";
}

function pushUniqueModelField(
    modelFields: Field[],
    seenPairs: Set<string>,
    label: string,
    value: any,
) {
    const text = String(value || "").trim();
    if (!text) return;
    const key = `${label}::${text}`;
    if (seenPairs.has(key)) return;
    seenPairs.add(key);
    modelFields.push({ label, value: text });
}

function pickLoraBranchKey(item: LooseRecord | null | undefined): string {
    const source = String(item?.source || "").toLowerCase();
    const name = String(item?.name || item?.lora_name || "").toLowerCase();
    const haystack = `${source} ${name}`;
    if (haystack.includes("high_noise") || haystack.includes("high noise")) return "high_noise";
    if (haystack.includes("low_noise") || haystack.includes("low noise")) return "low_noise";
    return "";
}

function buildModelGroupState(metadata: LooseRecord): any[] {
    const groups: any[] = [];
    const fromPayload = Array.isArray(metadata.model_groups) ? metadata.model_groups : [];
    if (fromPayload.length) {
        fromPayload.forEach((group) => {
            if (!group || typeof group !== "object") return;
            const modelName = pickModelName(group.model);
            const loras = Array.isArray(group.loras)
                ? group.loras.map((item: any) => formatLoRAItem(item)).filter(Boolean)
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
        { key: "high_noise", label: t("sidebar.generation.highNoise", "High Noise"), model: pickModelName(models.unet_high_noise) },
        { key: "low_noise", label: t("sidebar.generation.lowNoise", "Low Noise"), model: pickModelName(models.unet_low_noise) },
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

function createBooleanField(label: string, value: any): Field | null {
    if (value === undefined || value === null) return null;
    return { label, value: value ? t("state.on", "on") : t("state.off", "off") };
}

function hasMeaningfulValue(value: any): boolean {
    return value !== undefined && value !== null && String(value).trim() !== "";
}

function branchAccent(key: any): string {
    const normalized = String(key || "").toLowerCase();
    if (normalized.includes("high")) return "#52ffe8";
    if (normalized.includes("low")) return "#42A5F5";
    if (normalized.includes("refine")) return "#AB47BC";
    if (normalized.includes("upscale")) return "#66BB6A";
    if (normalized.includes("interpolation") || normalized.includes("video")) return "#dace26";
    return "#9C27B0";
}

function branchKeyFromLabel(label: any): string {
    return String(label || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

function normalizeBranchLabel(key: any, fallback: any): string {
    const raw = String(fallback || key || "").trim();
    const normalized = String(key || raw).toLowerCase();
    const passMatch = normalized.match(/^pass_(\d+)$/);
    if (passMatch) return t("sidebar.generation.stagePassN", "Pass {n}", { n: Number(passMatch[1]) });
    if (normalized.includes("high")) return "High";
    if (normalized.includes("low")) return "Low";
    if (normalized.includes("refine")) return "Refiner";
    if (normalized.includes("upscale")) return "Upscale";
    if (normalized.includes("text_to_image") || normalized.includes("image_to_image") || normalized === "base") return "Base";
    return raw || "Branch";
}

function findField(fields: Field[], names: string[]): Field | null {
    const wanted = new Set(names.map((name) => String(name).toLowerCase()));
    return fields.find((field) => wanted.has(String(field.label || "").toLowerCase())) || null;
}

function fieldIfValue(label: string, value: any): Field | null {
    return hasMeaningfulValue(value) ? { label, value } : null;
}

function branchKeyFromModel(value: any): string {
    const text = String(value || "").toLowerCase();
    if (text.includes("high_noise") || text.includes("high-noise") || text.includes("high noise")) return "high";
    if (text.includes("low_noise") || text.includes("low-noise") || text.includes("low noise")) return "low";
    return "";
}

function isDisplayScalar(value: any): boolean {
    if (Array.isArray(value)) return false;
    if (value && typeof value === "object") return false;
    return hasMeaningfulValue(value) && String(value).trim() !== "-";
}

function displayScalar(value: any): string {
    if (typeof value === "number") {
        if (Math.abs(value - Math.round(value)) < 1e-9) return String(Math.round(value));
        return value.toFixed(2).replace(/0+$/g, "").replace(/\.$/, "");
    }
    return String(value ?? "").trim();
}

function positiveSeedValue(value: any): any {
    if (!hasMeaningfulValue(value)) return null;
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return null;
    return value;
}

function pickSidebarSeed(metadata: LooseRecord, pipelineTabs: any[]): any {
    const direct = positiveSeedValue(metadata.seed);
    if (direct !== null) return direct;
    const samplerGroups = [
        Array.isArray(metadata.chained_passes) ? metadata.chained_passes : [],
        Array.isArray(metadata.all_samplers) ? metadata.all_samplers : [],
    ];
    for (const group of samplerGroups) {
        for (const passItem of group) {
            const seed = positiveSeedValue(passItem?.seed_val ?? passItem?.seed);
            if (seed !== null) return seed;
        }
    }
    for (const tab of pipelineTabs || []) {
        const seedField = findField(tab.fields || [], ["Seed"]);
        const seed = positiveSeedValue(seedField?.value);
        if (seed !== null) return seed;
    }
    return null;
}

function pushUniqueField(target: Field[], field: Field | null): void {
    if (!field || !isDisplayScalar(field.value)) return;
    const normalized = `${String(field.label || "").toLowerCase()}::${displayScalar(field.value)}`;
    if (target.some((item) => `${String(item.label || "").toLowerCase()}::${displayScalar(item.value)}` === normalized)) return;
    target.push({ ...field, value: displayScalar(field.value) });
}

function buildBranchCards(metadata: LooseRecord, modelGroups: any[], samplingFields: Field[], pipelineTabs: any[]): BranchCard[] {
    const cards = new Map<string, BranchCard>();
    const ensureCard = (key: string, label: string): BranchCard => {
        let normalizedKey = branchKeyFromLabel(key || label || "branch") || "branch";
        if (normalizedKey.includes("high")) normalizedKey = "high";
        if (normalizedKey.includes("low")) normalizedKey = "low";
        const existing = cards.get(normalizedKey);
        if (existing) return existing;
        const card = {
            key: normalizedKey,
            label: normalizeBranchLabel(normalizedKey, label),
            accent: branchAccent(normalizedKey),
            modelFields: [],
            samplingFields: [],
            loras: [],
        };
        cards.set(normalizedKey, card);
        return card;
    };
    const pushModelField = (card: BranchCard, label: string, value: any) => {
        const text = String(value || "").trim();
        if (!text) return;
        const duplicate = card.modelFields.some(
            (field) =>
                String(field.label || "").toLowerCase() === String(label || "").toLowerCase() &&
                formatModelLabel(field.value) === formatModelLabel(text),
        );
        if (!duplicate) card.modelFields.push({ label, value: text });
    };
    const pushLora = (card: BranchCard, value: any) => {
        const text = String(value || "").trim();
        if (text && !card.loras.includes(text)) card.loras.push(text);
    };

    for (const group of modelGroups || []) {
        const card = ensureCard(group.key, group.label);
        if (group.model) pushModelField(card, "UNet", group.model);
        for (const lora of group.loras || []) pushLora(card, lora);
    }

    const models = metadata.models && typeof metadata.models === "object" ? metadata.models : null;
    if (models) {
        const unetModel = pickModelName(models.unet);
        const unetRole = branchKeyFromModel(unetModel);
        const baseModel = pickModelName(models.checkpoint || (!unetRole ? models.unet : null) || metadata.model || metadata.checkpoint);
        const highModel = pickModelName(models.unet_high_noise) || (unetRole === "high" ? unetModel : "");
        const lowModel = pickModelName(models.unet_low_noise) || (unetRole === "low" ? unetModel : "");
        const sharedClip = pickModelName(models.clip);
        const sharedVae = pickModelName(models.vae);
        const ungroupedLoras = Array.isArray(metadata.loras)
            ? metadata.loras.map((item) => formatLoRAItem(item)).filter(Boolean)
            : [];
        const hasRoleBranches = Boolean(highModel || lowModel);
        const base = !hasRoleBranches && (baseModel || sharedClip || sharedVae || ungroupedLoras.length)
            ? ensureCard("base", "Base")
            : null;
        const shared = hasRoleBranches && (sharedClip || sharedVae)
            ? ensureCard("shared", "Shared")
            : null;
        const high = highModel ? ensureCard("high", "High") : null;
        const low = lowModel ? ensureCard("low", "Low") : null;
        if (base) {
            if (baseModel) pushModelField(base, metadata.model || metadata.checkpoint || models.checkpoint ? "Model" : "UNet", baseModel);
            if (sharedClip) pushModelField(base, "CLIP", sharedClip);
            if (sharedVae) pushModelField(base, "VAE", sharedVae);
            for (const lora of ungroupedLoras) pushLora(base, lora);
        }
        if (shared) {
            if (sharedClip) pushModelField(shared, "CLIP", sharedClip);
            if (sharedVae) pushModelField(shared, "VAE", sharedVae);
        }
        if (high) pushModelField(high, "UNet", highModel);
        if (low) pushModelField(low, "UNet", lowModel);
    }

    const high = cards.get("high") || cards.get("high_noise");
    const low = cards.get("low") || cards.get("low_noise");
    const commonSampling = [
        findField(samplingFields, ["Sampler"]),
        findField(samplingFields, ["Scheduler"]),
        findField(samplingFields, ["Steps"]),
        findField(samplingFields, ["Seed"]),
    ].filter(Boolean) as Field[];
    const cfgHigh = fieldIfValue("CFG", metadata.cfg_high_noise);
    const cfgLow = fieldIfValue("CFG", metadata.cfg_low_noise);
    if (high) [...commonSampling, ...(cfgHigh ? [cfgHigh] : [])].forEach((field) => pushUniqueField(high.samplingFields, field));
    if (low) [...commonSampling, ...(cfgLow ? [cfgLow] : [])].forEach((field) => pushUniqueField(low.samplingFields, field));

    const hasUpscalePass = (pipelineTabs || []).some((tab) => branchKeyFromLabel(tab.label).includes("upscale"));
    const genericTwoPassVideo = (pipelineTabs || []).length === 2 &&
        (pipelineTabs || []).every((tab) => ["base", "pass_2"].includes(branchKeyFromLabel(tab.label)));
    for (const [index, tab] of (pipelineTabs || []).entries()) {
        let key = branchKeyFromLabel(tab.label);
        if (!key) continue;
        const duplicatePassCount = (pipelineTabs || []).filter((item) => branchKeyFromLabel(item.label) === branchKeyFromLabel(tab.label)).length;
        const rawStageKey = branchKeyFromLabel(tab.stage);
        const duplicateStageCount = rawStageKey
            ? (pipelineTabs || []).filter((item) => branchKeyFromLabel(item.stage) === rawStageKey).length
            : 0;
        const model = findField(tab.fields || [], ["Model"]);
        const modelBranchKey = branchKeyFromModel(model?.value);
        if (["high", "low"].includes(key)) {
            // Keep explicit model-traced sampler role.
        } else if (modelBranchKey) key = modelBranchKey;
        else if (duplicateStageCount > 1) key = `pass_${index + 1}`;
        else if (duplicatePassCount > 1) key = `pass_${index + 1}`;
        else if (genericTwoPassVideo) key = index === 0 ? "high" : "low";
        else if (key === "base" && high && low) key = "high";
        else if (["text_to_image", "image_to_image"].includes(key)) key = hasUpscalePass ? "low" : "base";
        if (key.includes("upscale") && hasUpscalePass) key = "high";
        const card = ensureCard(key, tab.label);
        const generatedPassCard = /^pass_\d+$/i.test(key);
        if (!generatedPassCard && model && String(model.value || "") !== "-") {
            const nextModel = formatModelLabel(model.value);
            const duplicateModel = card.modelFields.some((field) => formatModelLabel(field.value) === nextModel);
            if (!duplicateModel) card.modelFields.push(model);
        }
        for (const field of (tab.fields || []) as Field[]) {
            if (!["Sampler", "Scheduler", "Steps", "CFG", "Denoise", "Seed", "Start", "End"].includes(String(field.label || ""))) continue;
            pushUniqueField(card.samplingFields, field);
        }
    }

    return Array.from(cards.values()).filter(
        (card) => card.modelFields.length || card.samplingFields.length || card.loras.length,
    );
}

function buildModuleBlocks(metadata: LooseRecord, pipelineTabs: any[], customInfoBlocks: any[], workflowType: string): any[] {
    const modules: any[] = [];
    const addModule = (key: string, title: string, accent: string, fields: Field[]) => {
        const visible = fields.filter((field) => field && hasMeaningfulValue(field.value) && String(field.value) !== "-");
        if (!visible.length) return;
        modules.push({ key, title, accent, fields: visible });
    };

    for (const tab of pipelineTabs || []) {
        const key = branchKeyFromLabel(tab.label);
        const hasUpscaleModel = (tab.fields || []).some((field: Field) => {
            const label = String(field?.label || "").toLowerCase();
            const value = String(field?.value || "").toLowerCase();
            return (
                label.includes("upscaler") ||
                value.includes("upscale") ||
                value.includes("upscaler") ||
                /(?:^|[_\s-])to[_\s-]?\d{3,5}(?:[_\s.-]|$)/i.test(value)
            );
        });
        if (key.includes("upscale") && (metadata.upscaler || hasUpscaleModel)) {
            addModule("upscale", "Upscale", "#66BB6A", tab.fields || []);
        }
        if (key.includes("interpolation") || key.includes("rife") || key.includes("film")) {
            addModule("interpolation", "Interpolation", "#26C6DA", tab.fields || []);
        }
    }

    addModule("audio", "MMAudio", "#26A69A", [
        fieldIfValue("Voice", metadata.voice),
        fieldIfValue("Language", metadata.language),
        fieldIfValue("Temperature", metadata.temperature),
        fieldIfValue("Lyrics Strength", metadata.lyrics_strength),
    ].filter(Boolean) as Field[]);

    addModule("interpolation", "Interpolation", "#26C6DA", [
        fieldIfValue("Engine", metadata.interpolation_engine || metadata.frame_interpolation || metadata.interpolator),
        fieldIfValue("Source FPS", metadata.source_fps || metadata.input_fps),
        fieldIfValue("Final FPS", metadata.final_fps || metadata.output_fps || metadata.fps),
    ].filter(Boolean) as Field[]);

    for (const block of customInfoBlocks || []) {
        modules.push({
            key: branchKeyFromLabel(block.title) || `module_${modules.length}`,
            title: block.title,
            accent: block.color || "#2196F3",
            fields: [{ label: "Info", value: block.content }],
        });
    }

    if (workflowType && !modules.some((module) => String(module.title).toLowerCase() === String(workflowType).toLowerCase())) {
        addModule("workflow_engine", workflowType, "#2196F3", [fieldIfValue("Engine", workflowType)].filter(Boolean) as Field[]);
    }

    const seen = new Set<string>();
    return modules.filter((module) => {
        const key = `${module.key}:${module.title}:${JSON.stringify(module.fields)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function overrideFieldSet(metadata: LooseRecord): Set<string> {
    return new Set(
        Array.isArray(metadata.override_fields)
            ? metadata.override_fields.map((key: any) => String(key || "").trim()).filter(Boolean)
            : [],
    );
}

function isOverrideField(fields: Set<string>, ...keys: string[]): boolean {
    return keys.some((key) => fields.has(key));
}

function normalizeCustomInfoBlocks(value: any): any[] {
    if (!Array.isArray(value)) return [];
    return value
        .filter((item) => item && typeof item === "object")
        .map((item, index) => ({
            title: String(item.title || t("sidebar.generation.customInfoN", "Custom Info {n}", { n: index + 1 })).trim(),
            content: String(item.content ?? item.value ?? "").trim(),
            color: /^#[0-9a-fA-F]{6}$/.test(String(item.color || "").trim())
                ? String(item.color).trim()
                : "#2196F3",
        }))
        .filter((item) => item.content);
}

function normalizeLtxDirectorState(value: any): LtxDirectorState | null {
    if (!value || typeof value !== "object") return null;
    const fields: Field[] = [];
    const pushField = (label: string, fieldValue: any) => {
        if (!hasMeaningfulValue(fieldValue)) return;
        fields.push({ label, value: displayScalar(fieldValue) });
    };
    pushField("FPS", value.frame_rate);
    pushField("Frames", value.duration_frames);
    pushField("Duration", value.duration_seconds);
    if (hasMeaningfulValue(value.width) || hasMeaningfulValue(value.height)) {
        fields.push({ label: "Size", value: `${value.width || "?"} x ${value.height || "?"}` });
    }

    const segments = Array.isArray(value.segments)
        ? value.segments
              .map((segment: any, index: number): LtxDirectorSegment | null => {
                  if (!segment || typeof segment !== "object") return null;
                  const prompt = sanitizePromptForDisplay(segment.prompt || segment.text || "");
                  const filename = String(segment.filename || segment.imageFile || segment.videoFile || segment.audioFile || "").trim();
                  const filepath = String(segment.filepath || segment.path || filename).trim();
                  const inLabel = String(segment.in || segment.in_label || segment.start || segment.start_frame || "").trim();
                  const outLabel = String(segment.out || segment.out_label || segment.end || segment.end_frame || "").trim();
                  if (!prompt && !filename && !inLabel && !outLabel) return null;
                  const mediaType = String(segment.type || "").trim().toLowerCase();
                  const isVideo = mediaType === "video" || /\.(mp4|mov|webm|mkv|avi|m4v)$/i.test(filename);
                  const isAudio = mediaType === "audio" || /\.(mp3|wav|flac|ogg|m4a|aac|opus)$/i.test(filename);
                  return {
                      key: String(segment.id || `segment-${index + 1}`),
                      label: `Segment ${index + 1}`,
                      prompt,
                      inLabel,
                      outLabel,
                      filename,
                      filepath,
                      type: String(segment.type || "").trim(),
                      isVideo,
                      isAudio,
                      previewCandidates: filename
                          ? inputPreviewCandidates({
                                filename,
                                filepath,
                                folder_type: String(segment.folder_type || segment.folderType || "input").trim(),
                                subfolder: String(segment.subfolder || "").trim(),
                            })
                          : [],
                  };
              })
              .filter(Boolean) as LtxDirectorSegment[]
        : [];

    const globalPrompt = sanitizePromptForDisplay(value.global_prompt || value.globalPrompt || "");
    if (!globalPrompt && !segments.length && !fields.length) return null;
    return {
        title: String(value.title || "LTX Director").trim(),
        globalPrompt,
        fields,
        segments,
    };
}

function normalizeIdeogramState(value: any): IdeogramState | null {
    if (!value || typeof value !== "object") return null;
    const payload = value.payload && typeof value.payload === "object" ? value.payload : value;
    const rawJson = typeof value.json === "string" && value.json.trim()
        ? value.json.trim()
        : JSON.stringify(payload, null, 2);
    const highLevelDescription = sanitizePromptForDisplay(
        value.high_level_description || value.highLevelDescription || payload.high_level_description || "",
    );
    const background = sanitizePromptForDisplay(value.background || payload.background || "");
    const fields: Field[] = [];
    const push = (label: string, fieldValue: any) => {
        if (!hasMeaningfulValue(fieldValue)) return;
        fields.push({ label, value: displayScalar(fieldValue) });
    };
    push("Style", payload.style);
    push("Photo Style", payload.photo_style || payload["style.photo"]);
    push("Medium", payload.medium);
    push("Lighting", payload.lighting);
    push("Aesthetics", payload.aesthetics);
    push("BG Brightness", payload.bg_brightness);
    if (hasMeaningfulValue(payload.width) || hasMeaningfulValue(payload.height)) {
        fields.push({ label: "Size", value: `${payload.width || "?"} x ${payload.height || "?"}` });
    }

    const elementsSource = Array.isArray(value.elements)
        ? value.elements
        : Array.isArray(payload.elements)
            ? payload.elements
            : [];
    const elements = elementsSource
        .map((item: any, index: number): IdeogramElement | null => {
            if (!item || typeof item !== "object") return null;
            const bbox = [item.x, item.y, item.w, item.h]
                .map((part) => Number(part))
                .map((part) => Number.isFinite(part) ? part.toFixed(3).replace(/0+$/g, "").replace(/\.$/, "") : "")
                .join(", ");
            const palette = Array.isArray(item.palette) ? item.palette.map((color: any) => String(color || "").trim()).filter(Boolean) : [];
            const description = String(item.desc || item.description || "").trim();
            const text = String(item.text || "").trim();
            if (!description && !text && !bbox && !palette.length) return null;
            return {
                key: String(item.id || `ideogram-element-${index + 1}`),
                label: `Element ${index + 1}`,
                description,
                text,
                bbox,
                palette,
            };
        })
        .filter(Boolean) as IdeogramElement[];
    const colorPalette = Array.isArray(value.color_palette)
        ? value.color_palette
        : Array.isArray(payload.color_palette)
            ? payload.color_palette
            : [];
    if (!rawJson && !highLevelDescription && !background && !elements.length) return null;
    return {
        title: String(value.title || "Ideogram 4").trim(),
        json: rawJson,
        highLevelDescription,
        background,
        fields,
        elements,
        colorPalette: colorPalette.map((color: any) => String(color || "").trim()).filter(Boolean),
    };
}

export function buildGenerationSectionState(asset: LooseRecord | null | undefined) {
    const normalized = normalizeAssetGenerationMetadata(asset);
    const emptyState = {
        kind: "empty",
        title: t("sidebar.generation.title", "Generation"),
        workflowType: "",
        workflowLabel: "",
        workflowBadge: "",
        isTruncated: false,
        positivePrompt: "",
        negativePrompt: "",
        positivePromptOverride: false,
        negativePromptOverride: false,
        promptTabs: [],
        mediaOnlyMessage: "",
        showAlignment: false,
        captionLabel: t("sidebar.generation.imageDescription", "Image Description"),
        emptyCaptionText: t("sidebar.generation.noImageDescription", "No image description yet."),
        isImageAsset: isImageLikeAsset(asset),
        lyrics: "",
        modelFields: [],
        modelGroups: [],
        branchCards: [],
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
        isOverride: false,
        overrideLabel: "",
        notesFields: [],
        customInfoBlocks: [],
        moduleBlocks: [],
        ltxDirector: null as LtxDirectorState | null,
        ideogram: null as IdeogramState | null,
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
                    t("sidebar.generation.mediaOnlyPipeline", "This file looks like a media-only pipeline (e.g. LoadVideo/VideoCombine) and does not contain generation parameters."),
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
    const ltxDirector = normalizeLtxDirectorState(metadata.ltx_director);
    const ideogram = normalizeIdeogramState(metadata.ideogram);
    const overriddenFields = overrideFieldSet(metadata);
    const engine = metadata.engine && typeof metadata.engine === "object" ? metadata.engine : null;
    const isOverride = Boolean(
        metadata.is_override ||
        engine?.mode === "override" ||
        engine?.parser_version === "geninfo-override-v1" ||
        engine?.source === "majoor_geninfo",
    );
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
                          label: t("sidebar.generation.promptN", "Prompt {n}", { n: index + 1 }),
                          positive: sanitizePromptForDisplay(prompts.positive),
                          negative: sanitizePromptForDisplay(prompts.negative),
                      };
                  })
                  .filter((item) => item.positive)
            : [];

    const modelFields: Field[] = [];
    const seenModelPairs = new Set<string>();
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
                pushUniqueModelField(modelFields, seenModelPairs, t("sidebar.generation.checkpointN", "Checkpoint {n}", { n: index + 1 }), name);
            });
        } else {
            const checkpoint = pickModelName(models.checkpoint);
            if (checkpoint && !branchNames.has(checkpoint)) {
                pushUniqueModelField(modelFields, seenModelPairs, t("sidebar.generation.checkpoint", "Checkpoint"), checkpoint);
            }
        }
        const fields = [
            ["UNet", pickModelName(models.unet)],
            ["Diffusion", pickModelName(models.diffusion)],
            [t("sidebar.generation.upscaler", "Upscaler"), pickModelName(models.upscaler)],
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
            t("sidebar.generation.model", "Model"),
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
                metadata.loras.length > 1 ? t("sidebar.generation.loras", "LoRAs") : "LoRA",
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
    if (!models && metadata.upscaler) {
        pushUniqueModelField(modelFields, seenModelPairs, t("sidebar.generation.upscaler", "Upscaler"), formatModelLabel(metadata.upscaler));
    }
    if (models && metadata.clip) pushUniqueModelField(modelFields, seenModelPairs, "CLIP", formatModelLabel(metadata.clip));
    if (models && metadata.vae) pushUniqueModelField(modelFields, seenModelPairs, "VAE", formatModelLabel(metadata.vae));
    for (const field of modelFields) {
        const label = String(field.label || "").toLowerCase();
        if (label.includes("checkpoint") || label === "model") field.override = isOverrideField(overriddenFields, "checkpoint", "model");
        if (label === "clip") field.override = isOverrideField(overriddenFields, "clip");
        if (label === "vae") field.override = isOverrideField(overriddenFields, "vae");
        if (label.includes("lora")) field.override = isOverrideField(overriddenFields, "loras");
    }

    const samplingFields: Field[] = [];
    if (hasMeaningfulValue(metadata.seed)) {
        samplingFields.push({ label: t("sidebar.generation.seed", "Seed"), value: metadata.seed, override: isOverrideField(overriddenFields, "seed") });
    }
    if (metadata.sampler || metadata.sampler_name) {
        samplingFields.push({ label: t("sidebar.generation.sampler", "Sampler"), value: metadata.sampler || metadata.sampler_name, override: isOverrideField(overriddenFields, "sampler", "sampler_name") });
    }
    if (hasMeaningfulValue(metadata.steps)) {
        samplingFields.push({ label: t("sidebar.generation.steps", "Steps"), value: metadata.steps, override: isOverrideField(overriddenFields, "steps") });
    }
    const cfgValue = hasMeaningfulValue(metadata.cfg) ? metadata.cfg : metadata.cfg_scale;
    if (hasMeaningfulValue(cfgValue)) {
        samplingFields.push({ label: t("sidebar.generation.cfgScale", "CFG Scale"), value: cfgValue, override: isOverrideField(overriddenFields, "cfg", "cfg_scale") });
    }
    if (metadata.cfg_high_noise !== undefined && metadata.cfg_high_noise !== null) {
        samplingFields.push({ label: t("sidebar.generation.cfgHighNoise", "CFG High Noise"), value: metadata.cfg_high_noise });
    }
    if (metadata.cfg_low_noise !== undefined && metadata.cfg_low_noise !== null) {
        samplingFields.push({ label: t("sidebar.generation.cfgLowNoise", "CFG Low Noise"), value: metadata.cfg_low_noise });
    }
    if (metadata.scheduler) samplingFields.push({ label: t("sidebar.generation.scheduler", "Scheduler"), value: metadata.scheduler, override: isOverrideField(overriddenFields, "scheduler") });
    const denoiseValue = hasMeaningfulValue(metadata.denoise) ? metadata.denoise : metadata.denoising;
    if (hasMeaningfulValue(denoiseValue)) samplingFields.push({ label: t("sidebar.generation.denoise", "Denoise"), value: denoiseValue, override: isOverrideField(overriddenFields, "denoise", "denoising") });

    let pipelineTabs: any[] = [];
    if (Array.isArray(metadata.chained_passes) && metadata.chained_passes.length > 1) {
        pipelineTabs = metadata.chained_passes
            .filter((passItem) => passItem && typeof passItem === "object")
            .map((passItem, index) => ({
                label: resolvePassName(passItem, index),
                stage: String(passItem?.pass_stage || "").trim(),
                fields: [
                    { label: t("sidebar.generation.model", "Model"), value: formatPipelineValue(passItem?.model) },
                    { label: t("sidebar.generation.sampler", "Sampler"), value: formatPipelineValue(passItem?.sampler_name || passItem?.sampler) },
                    { label: t("sidebar.generation.scheduler", "Scheduler"), value: formatPipelineValue(passItem?.scheduler) },
                    { label: t("sidebar.generation.steps", "Steps"), value: formatPipelineValue(passItem?.steps) },
                    { label: "CFG", value: formatPipelineValue(passItem?.cfg) },
                    { label: t("sidebar.generation.denoise", "Denoise"), value: formatPipelineValue(passItem?.denoise) },
                    { label: "Start", value: formatPipelineValue(passItem?.start_at_step) },
                    { label: "End", value: formatPipelineValue(passItem?.end_at_step) },
                    { label: t("sidebar.generation.seed", "Seed"), value: formatPipelineValue(passItem?.seed_val ?? passItem?.seed) },
                ],
            }));
    } else if (Array.isArray(metadata.all_samplers) && metadata.all_samplers.length > 1) {
        pipelineTabs = metadata.all_samplers
            .filter((passItem) => passItem && typeof passItem === "object")
            .map((passItem, index) => ({
                label: resolvePassName(passItem, index),
                stage: String(passItem?.pass_stage || "").trim(),
                fields: [
                    { label: t("sidebar.generation.model", "Model"), value: formatPipelineValue(passItem?.model) },
                    { label: t("sidebar.generation.sampler", "Sampler"), value: formatPipelineValue(passItem?.sampler_name || passItem?.sampler) },
                    { label: t("sidebar.generation.scheduler", "Scheduler"), value: formatPipelineValue(passItem?.scheduler) },
                    { label: t("sidebar.generation.steps", "Steps"), value: formatPipelineValue(passItem?.steps) },
                    { label: "CFG", value: formatPipelineValue(passItem?.cfg) },
                    { label: t("sidebar.generation.denoise", "Denoise"), value: formatPipelineValue(passItem?.denoise) },
                    { label: "Start", value: formatPipelineValue(passItem?.start_at_step) },
                    { label: "End", value: formatPipelineValue(passItem?.end_at_step) },
                    { label: t("sidebar.generation.seed", "Seed"), value: formatPipelineValue(passItem?.seed_val ?? passItem?.seed) },
                ],
            }));
    }

    const ttsFields: Field[] = [];
    if (metadata.voice) ttsFields.push({ label: t("sidebar.generation.narratorVoice", "Narrator Voice"), value: metadata.voice });
    if (metadata.language) ttsFields.push({ label: t("sidebar.generation.language", "Language"), value: metadata.language });
    if (metadata.top_k !== undefined && metadata.top_k !== null) ttsFields.push({ label: "Top-k", value: metadata.top_k });
    if (metadata.top_p !== undefined && metadata.top_p !== null) ttsFields.push({ label: "Top-p", value: metadata.top_p });
    if (metadata.temperature !== undefined && metadata.temperature !== null) ttsFields.push({ label: t("sidebar.generation.temperature", "Temperature"), value: metadata.temperature });
    if (metadata.repetition_penalty !== undefined && metadata.repetition_penalty !== null) {
        ttsFields.push({ label: t("sidebar.generation.repetitionPenalty", "Repetition Penalty"), value: metadata.repetition_penalty });
    }
    if (metadata.max_new_tokens !== undefined && metadata.max_new_tokens !== null) {
        ttsFields.push({ label: t("sidebar.generation.maxNewTokens", "Max New Tokens"), value: metadata.max_new_tokens });
    }

    const ttsEngineFields: Field[] = [];
    if (metadata.device) ttsEngineFields.push({ label: t("sidebar.generation.device", "Device"), value: metadata.device });
    if (metadata.voice_preset) ttsEngineFields.push({ label: t("sidebar.generation.voicePreset", "Voice Preset"), value: metadata.voice_preset });
    if (metadata.dtype) ttsEngineFields.push({ label: t("sidebar.generation.dtype", "Dtype"), value: metadata.dtype });
    if (metadata.attn_implementation) ttsEngineFields.push({ label: t("sidebar.generation.attention", "Attention"), value: metadata.attn_implementation });
    if (metadata.compile_mode) ttsEngineFields.push({ label: t("sidebar.generation.compileMode", "Compile Mode"), value: metadata.compile_mode });
    [
        createBooleanField(t("sidebar.generation.torchCompile", "Torch Compile"), metadata.use_torch_compile),
        createBooleanField(t("sidebar.generation.cudaGraphs", "CUDA Graphs"), metadata.use_cuda_graphs),
        createBooleanField(t("sidebar.generation.xVectorOnly", "X-Vector Only"), metadata.x_vector_only_mode),
    ]
        .filter(Boolean)
        .forEach((field) => ttsEngineFields.push(field as Field));

    const ttsRuntimeFields: Field[] = [];
    [
        createBooleanField(t("sidebar.generation.chunking", "Chunking"), metadata.enable_chunking),
        metadata.max_chars_per_chunk !== undefined && metadata.max_chars_per_chunk !== null
            ? { label: t("sidebar.generation.maxCharsChunk", "Max Chars/Chunk"), value: metadata.max_chars_per_chunk }
            : null,
        metadata.chunk_combination_method
            ? { label: t("sidebar.generation.chunkMethod", "Chunk Method"), value: metadata.chunk_combination_method }
            : null,
        metadata.silence_between_chunks_ms !== undefined && metadata.silence_between_chunks_ms !== null
            ? { label: t("sidebar.generation.silenceBetweenChunks", "Silence Between Chunks (ms)"), value: metadata.silence_between_chunks_ms }
            : null,
        createBooleanField(t("sidebar.generation.audioCache", "Audio Cache"), metadata.enable_audio_cache),
        metadata.batch_size !== undefined && metadata.batch_size !== null
            ? { label: t("sidebar.generation.batchSize", "Batch Size"), value: metadata.batch_size }
            : null,
    ]
        .filter(Boolean)
        .forEach((field) => ttsRuntimeFields.push(field as Field));

    const audioFields: Field[] = [];
    if (metadata.lyrics_strength !== undefined && metadata.lyrics_strength !== null) {
        audioFields.push({ label: t("sidebar.generation.lyricsStrength", "Lyrics Strength"), value: metadata.lyrics_strength });
    }

    const imageFields: Field[] = [];
    if (hasMeaningfulValue(denoiseValue) && !samplingFields.some((field) => field.label === "Denoise")) {
        imageFields.push({ label: t("sidebar.generation.denoise", "Denoise"), value: denoiseValue });
    }
    if (hasMeaningfulValue(metadata.clip_skip)) imageFields.push({ label: t("sidebar.generation.clipSkip", "Clip Skip"), value: metadata.clip_skip });

    const notesFields: Field[] = [];
    const notes = String(metadata.workflow_notes || metadata.notes || "").trim();
    if (notes) notesFields.push({ label: t("sidebar.generation.workflowNotes", "Workflow Notes"), value: notes, override: isOverrideField(overriddenFields, "workflow_notes", "notes") });
    const customInfoBlocks = normalizeCustomInfoBlocks(metadata.custom_info);
    const branchCards = buildBranchCards(metadata, modelGroups, samplingFields, pipelineTabs);
    const moduleBlocks = buildModuleBlocks(metadata, pipelineTabs, customInfoBlocks, workflowPresentation.workflowType);
    const sidebarSeed = pickSidebarSeed(metadata, pipelineTabs);

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
        positivePrompt: promptTabs.length || ideogram ? "" : String(cleanedPrompts.positive || "").trim(),
        negativePrompt: promptTabs.length ? "" : String(cleanedPrompts.negative || "").trim(),
        positivePromptOverride: isOverrideField(overriddenFields, "prompt", "positive", "positive_prompt"),
        negativePromptOverride: isOverrideField(overriddenFields, "negative_prompt", "negative", "negativePrompt"),
        promptTabs,
        showAlignment: !!asset?.id && (!!String(cleanedPrompts.positive || "").trim() || promptTabs.length > 0),
        isImageAsset: isImageLikeAsset(asset),
        lyrics: String(metadata.lyrics || "").trim(),
        modelFields,
        modelGroups,
        branchCards,
        pipelineTabs,
        samplingFields,
        ttsFields,
        ttsEngineFields,
        ttsInstruction: String(metadata.instruct || "").trim(),
        ttsRuntimeFields,
        audioFields,
        seed: sidebarSeed,
        imageFields,
        inputFiles,
        isOverride,
        overrideLabel: isOverride ? "Gen Info Override" : "",
        notesFields,
        customInfoBlocks,
        moduleBlocks,
        ltxDirector,
        ideogram,
    };
}
