<script setup>
import { computed, ref, watch } from "vue";
import { vectorGenerateCaption, vectorGetAlignment } from "../../../../api/client.js";
import { t } from "../../../../app/i18n.js";
import { metadataSectionByKey } from "../../../../features/metadata/metadataSectionCatalog.js";
import GenerationInputThumb from "./GenerationInputThumb.vue";
import {
    buildGenerationSectionState,
    getAlignmentColor,
    getAlignmentLabel,
    isGenerationAiEnabled,
    normalizeCaptionDisplay,
} from "./generationSectionState.js";

const props = defineProps({
    asset: { type: Object, required: true },
});

const promptTabIndex = ref(0);
const pipelineTabIndex = ref(0);
const captionText = ref("");
const copyCaptionLabel = ref(t("action.copy", "Copy"));
const generateCaptionLabel = ref(t("action.generate", "Generate"));
const generatingCaption = ref(false);
const alignmentState = ref(createDefaultAlignmentState());

let alignmentRequestToken = 0;

function createDefaultAlignmentState() {
    return {
        scoreText: "...",
        scoreColor: "#888",
        qualityText: t("status.loading", "Loading"),
        qualityColor: "#888",
        qualityBackground: "rgba(127,127,127,0.3)",
        fillWidth: "0%",
        fillColor: "#666",
        aiStatusVisible: false,
        aiStatusText: t("sidebar.generation.aiDisabledEnv", "AI features are disabled (enable vector search env var)."),
    };
}

function hexToRgba(hex, alpha) {
    const normalized = String(hex || "")
        .trim()
        .replace(/^#/, "");
    if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return `rgba(255,255,255,${alpha})`;
    const r = Number.parseInt(normalized.slice(0, 2), 16);
    const g = Number.parseInt(normalized.slice(2, 4), 16);
    const b = Number.parseInt(normalized.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function boxStyle(accentColor, { emphasis = false, startAlpha = 0.16, endAlpha = 0.08 } = {}) {
    return {
        background: emphasis
            ? `linear-gradient(135deg, ${hexToRgba(accentColor, startAlpha)} 0%, ${hexToRgba(accentColor, endAlpha)} 100%)`
            : "var(--comfy-menu-bg, rgba(0,0,0,0.3))",
        borderLeft: `3px solid ${accentColor}`,
        border: emphasis
            ? `1px solid ${hexToRgba(accentColor, 0.45)}`
            : "1px solid var(--border-color, rgba(255,255,255,0.12))",
        boxShadow: emphasis ? `0 0 0 1px ${hexToRgba(accentColor, 0.15)} inset` : "none",
        borderRadius: "6px",
        padding: "12px",
    };
}

function seedBoxStyle() {
    return {
        background:
            "linear-gradient(135deg, rgba(233, 30, 99, 0.15) 0%, rgba(156, 39, 176, 0.15) 100%)",
        border: "2px solid #E91E63",
        borderRadius: "8px",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
    };
}

function overridePillStyle() {
    return {
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "999px",
        border: "1px solid rgba(0, 188, 212, 0.55)",
        background: "rgba(0, 188, 212, 0.16)",
        color: "#4DD0E1",
        fontSize: "9px",
        fontWeight: "700",
        lineHeight: "1",
        padding: "2px 6px",
        letterSpacing: "0.2px",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
    };
}

const sectionState = computed(() => buildGenerationSectionState(props.asset));
const aiEnabled = computed(() => isGenerationAiEnabled());
const isCaptionSectionVisible = computed(
    () => sectionState.value.kind === "full" || sectionState.value.kind === "caption-only",
);
const displayedCaption = computed(
    () =>
        normalizeCaptionDisplay(captionText.value) || sectionState.value.emptyCaptionText,
);
const canGenerateCaption = computed(
    () => aiEnabled.value && sectionState.value.isImageAsset && !!props.asset?.id,
);
const canCopyCaption = computed(
    () =>
        aiEnabled.value &&
        !!normalizeCaptionDisplay(displayedCaption.value) &&
        displayedCaption.value !== sectionState.value.emptyCaptionText,
);

const modelBranches = computed(() => sectionState.value.branchCards.filter((item) => item.modelFields.length || item.loras.length));
const samplingBranches = computed(() => sectionState.value.branchCards.filter((item) => item.samplingFields.length));
const loraBranches = computed(() => sectionState.value.branchCards.filter((item) => item.loras.length));

const parameterSections = computed(() => {
    const sections = [];
    const catalogTitle = (key, fallback) => metadataSectionByKey(key)?.title || fallback;
    if (!modelBranches.value.length && sectionState.value.modelFields.length) {
        sections.push({
            key: "model",
            title: catalogTitle("model", t("sidebar.generation.modelLora", "Model & LoRA")),
            accent: "#9C27B0",
            emphasis: true,
            fields: sectionState.value.modelFields,
        });
    }
    if (!samplingBranches.value.length && sectionState.value.samplingFields.length) {
        sections.push({
            key: "sampling",
            title: catalogTitle("sampler", t("sidebar.generation.sampling", "Sampling")),
            accent: "#FF9800",
            emphasis: true,
            fields: sectionState.value.samplingFields,
        });
    }
    if (sectionState.value.ttsFields.length || sectionState.value.workflowType.toLowerCase() === "tts") {
        sections.push({
            key: "tts",
            title: "TTS",
            accent: "#26A69A",
            emphasis: true,
            fields: sectionState.value.ttsFields,
        });
    }
    if (sectionState.value.ttsEngineFields.length) {
        sections.push({
            key: "tts-engine",
            title: "TTS Engine",
            accent: "#00897B",
            emphasis: false,
            fields: sectionState.value.ttsEngineFields,
        });
    }
    if (sectionState.value.ttsRuntimeFields.length) {
        sections.push({
            key: "tts-runtime",
            title: "TTS Runtime",
            accent: "#00796B",
            emphasis: false,
            fields: sectionState.value.ttsRuntimeFields,
        });
    }
    if (sectionState.value.audioFields.length) {
        sections.push({
            key: "audio",
            title: t("sidebar.generation.audio", "Audio"),
            accent: "#00BCD4",
            emphasis: false,
            fields: sectionState.value.audioFields,
        });
    }
    if (sectionState.value.imageFields.length) {
        sections.push({
            key: "image",
            title: t("sidebar.generation.image", "Image"),
            accent: "#2196F3",
            emphasis: false,
            fields: sectionState.value.imageFields,
        });
    }
    return sections;
});

function flashBackground(target, background, delay = 450) {
    if (!target) return;

    const previous = target.style.background;
    target.style.background = background;
    setTimeout(() => {
        target.style.background = previous || "";
    }, delay);
}

function modelGroupStyle(accentColor, emphasis = true) {
    return {
        background: emphasis
            ? `linear-gradient(135deg, ${hexToRgba(accentColor, 0.16)} 0%, ${hexToRgba(accentColor, 0.08)} 100%)`
            : "var(--comfy-menu-bg, rgba(0,0,0,0.3))",
        border: `1px solid ${hexToRgba(accentColor, 0.42)}`,
        boxShadow: `0 0 0 1px ${hexToRgba(accentColor, 0.14)} inset`,
        borderRadius: "8px",
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    };
}

function modelBranchAccent(branch) {
    return "#CE6DE0";
}

function samplingBranchAccent(branch) {
    const key = String(branch?.key || "").toLowerCase();
    if (key.includes("high")) return "#FFC107";
    if (key.includes("low")) return "#FFB300";
    if (key.includes("base")) return "#FF9800";
    if (key.includes("upscale") || key.includes("refine")) return "#FFCA28";
    if (key.includes("pass")) return "#FDD835";
    return "#FF9800";
}

function modelGroupAccent(key) {
    if (key === "high_noise") return "#FF7043";
    if (key === "low_noise") return "#29B6F6";
    return "#AB47BC";
}

async function copyText(value, target = null, background = "rgba(76, 175, 80, 0.35)") {
    const text = String(value ?? "").trim();
    if (!text || text === "-") return;
    try {
        await navigator.clipboard.writeText(text);
        flashBackground(target, background);
    } catch (e) {
        console.debug?.(e);
    }
}

function updateAlignmentDisabledState() {
    alignmentState.value = {
        scoreText: "AI OFF",
        scoreColor: "#9E9E9E",
        qualityText: t("status.disabled", "Disabled"),
        qualityColor: "#BDBDBD",
        qualityBackground: "rgba(158,158,158,0.25)",
        fillWidth: "0%",
        fillColor: "#777",
        aiStatusVisible: true,
        aiStatusText: t("sidebar.generation.aiDisabledSettings", "AI features are disabled in settings."),
    };
}

function resetAlignmentState() {
    alignmentState.value = createDefaultAlignmentState();
}

async function refreshAlignment() {
    alignmentRequestToken += 1;
    const currentToken = alignmentRequestToken;
    if (!sectionState.value.showAlignment || !props.asset?.id) {
        resetAlignmentState();
        return;
    }
    if (!aiEnabled.value) {
        updateAlignmentDisabledState();
        return;
    }

    resetAlignmentState();
    try {
        const response = await vectorGetAlignment(props.asset.id);
        if (currentToken !== alignmentRequestToken) return;

        const serviceUnavailable =
            !response?.ok &&
            (String(response?.code || "").toUpperCase() === "SERVICE_UNAVAILABLE" ||
                /vector search is not enabled/i.test(String(response?.error || "")));
        if (serviceUnavailable) {
            updateAlignmentDisabledState();
            return;
        }

        const score = response?.ok && response.data != null ? Number(response.data) : null;
        if (!Number.isFinite(score)) {
            alignmentState.value = {
                scoreText: "N/A",
                scoreColor: "#888",
            qualityText: t("status.na", "N/A"),
                qualityColor: "#888",
                qualityBackground: "rgba(127,127,127,0.3)",
                fillWidth: "0%",
                fillColor: "#666",
                aiStatusVisible: false,
                aiStatusText: "",
            };
            return;
        }

        const percentage = Math.round(score * 100);
        const color = getAlignmentColor(score);
        alignmentState.value = {
            scoreText: `${percentage}%`,
            scoreColor: color,
            qualityText: getAlignmentLabel(score),
            qualityColor: color,
            qualityBackground: `${color}33`,
            fillWidth: `${percentage}%`,
            fillColor: color,
            aiStatusVisible: false,
            aiStatusText: "",
        };
    } catch (e) {
        console.debug?.(e);
        if (currentToken !== alignmentRequestToken) return;
        alignmentState.value = {
            scoreText: "-",
            scoreColor: "#888",
            qualityText: t("status.unavailable", "Unavailable"),
            qualityColor: "#888",
            qualityBackground: "rgba(127,127,127,0.3)",
            fillWidth: "0%",
            fillColor: "#666",
            aiStatusVisible: false,
            aiStatusText: "",
        };
    }
}

async function regenerateCaption() {
    if (!canGenerateCaption.value || generatingCaption.value) return;
    generatingCaption.value = true;
    generateCaptionLabel.value = t("status.generating", "Generating...");
    try {
        const response = await vectorGenerateCaption(props.asset.id);
        if (response?.ok) {
            captionText.value = String(response?.data || "").trim();
        }
    } catch (e) {
        console.debug?.(e);
    } finally {
        generatingCaption.value = false;
        generateCaptionLabel.value = t("action.generate", "Generate");
    }
}

async function copyCaption() {
    if (!canCopyCaption.value) return;
    try {
        await navigator.clipboard.writeText(displayedCaption.value);
        copyCaptionLabel.value = t("viewer.copySuccessShort", "Copied!");
        setTimeout(() => {
            copyCaptionLabel.value = t("action.copy", "Copy");
        }, 900);
    } catch (e) {
        console.debug?.(e);
    }
}

watch(
    () => props.asset,
    () => {
        promptTabIndex.value = 0;
        pipelineTabIndex.value = 0;
        captionText.value = String(props.asset?.enhanced_caption || "").trim();
        copyCaptionLabel.value = t("action.copy", "Copy");
        generateCaptionLabel.value = t("action.generate", "Generate");
    },
    { immediate: true },
);

watch(
    () => [props.asset?.id, sectionState.value.kind, sectionState.value.showAlignment, aiEnabled.value],
    () => {
        void refreshAlignment();
    },
    { immediate: true },
);
</script>

<template>
    <div
        v-if="sectionState.kind !== 'empty'"
        style="display:flex;flex-direction:column;gap:12px"
    >
        <div
            v-if="sectionState.workflowType"
            :style="{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.18) 0%, rgba(0, 188, 212, 0.10) 100%)',
                borderLeft: '3px solid #2196F3',
                border: '1px solid rgba(33, 150, 243, 0.45)',
                boxShadow: '0 0 0 1px rgba(33, 150, 243, 0.15) inset',
                borderRadius: '6px',
                fontSize: '11px',
                color: 'var(--fg-color, #ccc)',
            }"
        >
            <span style="opacity:0.85">{{ t("viewer.workflow", "Workflow") }}</span>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end">
                <span
                    :title="t('sidebar.generation.workflowEngine', 'Workflow engine: {value}', { value: sectionState.workflowType })"
                    style="background:#2196F3;color:white;padding:2px 8px;border-radius:999px;font-weight:bold;font-size:10px;letter-spacing:0.2px"
                >
                    {{ sectionState.workflowLabel || sectionState.workflowType }}
                </span>
                <span
                    v-if="sectionState.workflowBadge"
                    :title="t('sidebar.generation.apiProvider', 'API provider: {value}', { value: sectionState.workflowBadge })"
                    style="background:rgba(255,255,255,0.08);color:var(--fg-color, #eee);padding:2px 8px;border-radius:999px;border:1px solid rgba(255,255,255,0.14);font-weight:600;font-size:10px;letter-spacing:0.2px"
                >
                    {{ sectionState.workflowBadge }}
                </span>
            </div>
        </div>

        <div
            v-if="sectionState.isOverride"
            :style="boxStyle('#00BCD4', { emphasis: true, startAlpha: 0.14, endAlpha: 0.08 })"
        >
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
                <span style="font-size:11px;font-weight:700;color:#00BCD4;text-transform:uppercase;letter-spacing:0.6px">
                    {{ t("sidebar.generation.override", "Override") }}
                </span>
                <span style="font-size:11px;color:var(--fg-color, rgba(255,255,255,0.9));font-weight:600">
                    {{ sectionState.overrideLabel }}
                </span>
            </div>
        </div>

        <div
            v-if="sectionState.isTruncated"
            :style="boxStyle('#FF9800', { emphasis: true, startAlpha: 0.12, endAlpha: 0.08 })"
        >
            <div style="font-size:11px;font-weight:600;color:#FF9800;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">
                {{ t("sidebar.generation.metadataTruncated", "Metadata Truncated") }}
            </div>
            <div style="font-size:12px;color:var(--fg-color, rgba(255,255,255,0.9));line-height:1.5;white-space:pre-wrap;word-break:break-word">
                {{ t("sidebar.generation.metadataTruncatedBody", "Generation data is incomplete because it exceeded the size limit.") }}
            </div>
        </div>

        <div
            v-if="sectionState.kind === 'media-only'"
            :style="boxStyle('#9E9E9E', { emphasis: true, startAlpha: 0.10, endAlpha: 0.06 })"
        >
            <div style="font-size:11px;font-weight:600;color:#9E9E9E;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">
                {{ t("sidebar.generation.generationData", "Generation Data") }}
            </div>
            <div style="font-size:12px;color:var(--fg-color, rgba(255,255,255,0.9));line-height:1.5;white-space:pre-wrap;word-break:break-word">
                {{ sectionState.mediaOnlyMessage }}
            </div>
        </div>

        <template v-if="sectionState.kind === 'full'">
            <div
                v-if="sectionState.ltxDirector"
                :style="boxStyle('#26C6DA', { emphasis: true, startAlpha: 0.15, endAlpha: 0.08 })"
            >
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px">
                    <div style="font-size:11px;font-weight:800;color:#26C6DA;text-transform:uppercase;letter-spacing:0.5px">
                        {{ sectionState.ltxDirector.title || "LTX Director" }}
                    </div>
                    <span style="font-size:10px;font-weight:700;color:#26C6DA;background:rgba(38,198,218,0.14);border:1px solid rgba(38,198,218,0.32);border-radius:999px;padding:2px 8px">
                        Director
                    </span>
                </div>

                <div
                    v-if="sectionState.ltxDirector.fields.length"
                    style="display:grid;grid-template-columns:repeat(auto-fit,minmax(92px,1fr));gap:8px;margin-bottom:10px"
                >
                    <div
                        v-for="field in sectionState.ltxDirector.fields"
                        :key="`ltx-field-${field.label}`"
                        style="border:1px solid rgba(255,255,255,0.10);border-radius:6px;background:rgba(255,255,255,0.045);padding:7px 8px;min-width:0"
                    >
                        <div style="font-size:9px;font-weight:800;color:rgba(255,255,255,0.55);text-transform:uppercase;letter-spacing:0.4px">
                            {{ field.label }}
                        </div>
                        <div style="font-size:12px;color:var(--fg-color,#eee);font-weight:650;word-break:break-word">
                            {{ field.value }}
                        </div>
                    </div>
                </div>

                <div
                    v-if="sectionState.ltxDirector.globalPrompt"
                    style="border:1px solid rgba(76,175,80,0.36);border-radius:6px;background:rgba(76,175,80,0.10);padding:10px;margin-bottom:10px"
                >
                    <div style="font-size:10px;font-weight:800;color:#66BB6A;text-transform:uppercase;letter-spacing:0.45px;margin-bottom:6px">
                        Global Prompt
                    </div>
                    <div
                        :title="t('action.clickToCopy', 'Click to copy')"
                        style="font-size:12px;color:var(--fg-color,#eee);line-height:1.45;white-space:pre-wrap;word-break:break-word;cursor:pointer"
                        @click="copyText(sectionState.ltxDirector.globalPrompt, $event.currentTarget)"
                    >
                        {{ sectionState.ltxDirector.globalPrompt }}
                    </div>
                </div>

                <div
                    v-if="sectionState.ltxDirector.segments.length"
                    style="display:flex;flex-direction:column;gap:8px"
                >
                    <div
                        v-for="segment in sectionState.ltxDirector.segments"
                        :key="segment.key"
                        style="border:1px solid rgba(38,198,218,0.30);border-radius:6px;background:rgba(38,198,218,0.075);padding:10px"
                    >
                        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px">
                            <div style="font-size:10px;font-weight:800;color:#26C6DA;text-transform:uppercase;letter-spacing:0.45px">
                                {{ segment.label }}
                            </div>
                            <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;justify-content:flex-end">
                                <span
                                    v-if="segment.inLabel"
                                    style="font-size:10px;color:#A7FFEB;background:rgba(0,150,136,0.16);border:1px solid rgba(0,150,136,0.30);border-radius:4px;padding:2px 6px;font-weight:700"
                                >
                                    in {{ segment.inLabel }}
                                </span>
                                <span
                                    v-if="segment.outLabel"
                                    style="font-size:10px;color:#FFE082;background:rgba(255,193,7,0.14);border:1px solid rgba(255,193,7,0.30);border-radius:4px;padding:2px 6px;font-weight:700"
                                >
                                    out {{ segment.outLabel }}
                                </span>
                            </div>
                        </div>
                        <div style="display:flex;gap:10px;align-items:flex-start;min-width:0">
                            <GenerationInputThumb
                                v-if="segment.filename"
                                :input-file="{
                                    filename: segment.filename,
                                    filepath: segment.filepath || segment.filename,
                                    role: segment.type || 'segment',
                                    roleLabel: segment.type || 'segment',
                                    isVideo: segment.isVideo,
                                    isAudio: segment.isAudio,
                                    previewCandidates: segment.previewCandidates,
                                }"
                            />
                            <div style="min-width:0;flex:1">
                                <div
                                    v-if="segment.prompt"
                                    :title="t('action.clickToCopy', 'Click to copy')"
                                    style="font-size:12px;color:var(--fg-color,#eee);line-height:1.45;white-space:pre-wrap;word-break:break-word;cursor:pointer"
                                    @click="copyText(segment.prompt, $event.currentTarget)"
                                >
                                    {{ segment.prompt }}
                                </div>
                                <div
                                    v-if="segment.filename || segment.type"
                                    style="font-size:10px;color:rgba(255,255,255,0.58);margin-top:7px;display:flex;gap:6px;flex-wrap:wrap"
                                >
                                    <span v-if="segment.type">{{ segment.type }}</span>
                                    <span v-if="segment.filename">{{ segment.filename }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div
                v-if="sectionState.ideogram"
                :style="boxStyle('#FFB300', { emphasis: true, startAlpha: 0.15, endAlpha: 0.08 })"
            >
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px">
                    <div style="font-size:11px;font-weight:800;color:#FFB300;text-transform:uppercase;letter-spacing:0.5px">
                        {{ sectionState.ideogram.title || "Ideogram 4" }}
                    </div>
                    <span style="font-size:10px;font-weight:700;color:#FFCA28;background:rgba(255,179,0,0.14);border:1px solid rgba(255,179,0,0.32);border-radius:999px;padding:2px 8px">
                        Prompt JSON
                    </span>
                </div>

                <div
                    v-if="sectionState.ideogram.fields.length"
                    style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px;margin-bottom:10px"
                >
                    <div
                        v-for="field in sectionState.ideogram.fields"
                        :key="`ideogram-field-${field.label}`"
                        style="border:1px solid rgba(255,255,255,0.10);border-radius:6px;background:rgba(255,255,255,0.045);padding:7px 8px;min-width:0"
                    >
                        <div style="font-size:9px;font-weight:800;color:rgba(255,255,255,0.55);text-transform:uppercase;letter-spacing:0.4px">
                            {{ field.label }}
                        </div>
                        <div style="font-size:12px;color:var(--fg-color,#eee);font-weight:650;word-break:break-word">
                            {{ field.value }}
                        </div>
                    </div>
                </div>

                <div
                    v-if="sectionState.ideogram.highLevelDescription"
                    style="border:1px solid rgba(76,175,80,0.34);border-radius:6px;background:rgba(76,175,80,0.09);padding:10px;margin-bottom:10px"
                >
                    <div style="font-size:10px;font-weight:800;color:#81C784;text-transform:uppercase;letter-spacing:0.45px;margin-bottom:6px">
                        High Level Description
                    </div>
                    <div
                        :title="t('action.clickToCopy', 'Click to copy')"
                        style="font-size:12px;color:var(--fg-color,#eee);line-height:1.45;white-space:pre-wrap;word-break:break-word;cursor:pointer"
                        @click="copyText(sectionState.ideogram.highLevelDescription, $event.currentTarget)"
                    >
                        {{ sectionState.ideogram.highLevelDescription }}
                    </div>
                </div>

                <div
                    v-if="sectionState.ideogram.background"
                    style="border:1px solid rgba(33,150,243,0.32);border-radius:6px;background:rgba(33,150,243,0.08);padding:10px;margin-bottom:10px"
                >
                    <div style="font-size:10px;font-weight:800;color:#64B5F6;text-transform:uppercase;letter-spacing:0.45px;margin-bottom:6px">
                        Background
                    </div>
                    <div
                        :title="t('action.clickToCopy', 'Click to copy')"
                        style="font-size:12px;color:var(--fg-color,#eee);line-height:1.45;white-space:pre-wrap;word-break:break-word;cursor:pointer"
                        @click="copyText(sectionState.ideogram.background, $event.currentTarget)"
                    >
                        {{ sectionState.ideogram.background }}
                    </div>
                </div>

                <div
                    v-if="sectionState.ideogram.elements.length"
                    style="display:flex;flex-direction:column;gap:8px;margin-bottom:10px"
                >
                    <div
                        v-for="element in sectionState.ideogram.elements"
                        :key="element.key"
                        style="border:1px solid rgba(255,179,0,0.30);border-radius:6px;background:rgba(255,179,0,0.075);padding:10px"
                    >
                        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px">
                            <div style="font-size:10px;font-weight:800;color:#FFCA28;text-transform:uppercase;letter-spacing:0.45px">
                                {{ element.label }}
                            </div>
                            <span
                                v-if="element.bbox"
                                style="font-size:10px;color:#FFE082;background:rgba(255,193,7,0.14);border:1px solid rgba(255,193,7,0.30);border-radius:4px;padding:2px 6px;font-weight:700"
                            >
                                bbox {{ element.bbox }}
                            </span>
                        </div>
                        <div
                            v-if="element.description"
                            :title="t('action.clickToCopy', 'Click to copy')"
                            style="font-size:12px;color:var(--fg-color,#eee);line-height:1.45;white-space:pre-wrap;word-break:break-word;cursor:pointer"
                            @click="copyText(element.description, $event.currentTarget)"
                        >
                            {{ element.description }}
                        </div>
                        <div
                            v-if="element.palette.length"
                            style="display:flex;flex-wrap:wrap;gap:5px;margin-top:8px"
                        >
                            <span
                                v-for="color in element.palette"
                                :key="`${element.key}-${color}`"
                                :title="color"
                                :style="{ width: '18px', height: '18px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.28)', background: color }"
                                @click="copyText(color, $event.currentTarget)"
                            />
                        </div>
                    </div>
                </div>

                <details style="border:1px solid rgba(255,179,0,0.30);border-radius:6px;background:rgba(0,0,0,0.16);overflow:hidden">
                    <summary style="cursor:pointer;padding:8px 10px;font-size:10px;font-weight:800;color:#FFCA28;text-transform:uppercase;letter-spacing:0.45px">
                        JSON sent to text encoder
                    </summary>
                    <pre
                        :title="t('action.clickToCopy', 'Click to copy')"
                        style="margin:0;padding:10px;max-height:260px;overflow:auto;font-size:11px;line-height:1.35;color:rgba(255,255,255,0.9);white-space:pre-wrap;word-break:break-word;cursor:pointer"
                        @click="copyText(sectionState.ideogram.json, $event.currentTarget)"
                    >{{ sectionState.ideogram.json }}</pre>
                </details>
            </div>

            <div
                v-if="!sectionState.ltxDirector && !sectionState.ideogram && sectionState.promptTabs.length"
                :style="boxStyle('#4CAF50', { emphasis: true, startAlpha: 0.16, endAlpha: 0.10 })"
            >
                <div style="font-size:11px;font-weight:600;color:#4CAF50;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">
                    {{ t("sidebar.generation.promptPipeline", "Prompt Pipeline ({count} variants)", { count: sectionState.promptTabs.length }) }}
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">
                    <MButton
                        v-for="(tab, index) in sectionState.promptTabs"
                        :key="tab.label"
                        type="button"
                        severity="secondary"
                        text
                        rounded
                        :style="{
                            appearance: 'none',
                            border: promptTabIndex === index ? '1px solid #4CAF50' : '1px solid var(--border-color, rgba(255,255,255,0.12))',
                            borderRadius: '999px',
                            background: promptTabIndex === index ? '#4CAF5033' : 'rgba(127,127,127,0.12)',
                            color: promptTabIndex === index ? '#4CAF50' : 'var(--fg-color, #ddd)',
                            fontSize: '11px',
                            padding: '4px 10px',
                            cursor: 'pointer',
                            fontWeight: promptTabIndex === index ? '700' : '500',
                            boxShadow: promptTabIndex === index ? '0 0 0 1px #4CAF5055 inset' : 'none',
                        }"
                        @click="promptTabIndex = index"
                    >
                        {{ tab.label }}
                    </MButton>
                </div>
                <div
                    v-for="(tab, index) in sectionState.promptTabs"
                    v-show="promptTabIndex === index"
                    :key="`${tab.label}-panel`"
                    style="display:flex;flex-direction:column;gap:8px;border:1px solid rgba(76, 175, 80, 0.35);border-radius:6px;background:linear-gradient(135deg, rgba(76, 175, 80, 0.12) 0%, rgba(33, 150, 243, 0.08) 100%);box-shadow:0 0 0 1px rgba(76, 175, 80, 0.12) inset;padding:10px"
                >
                    <div style="font-size:10px;font-weight:700;color:#4CAF50;letter-spacing:0.4px">
                        {{ t("sidebar.generation.positive", "POSITIVE") }}
                    </div>
                    <div
                        style="font-size:12px;color:var(--fg-color, #ddd);white-space:pre-wrap;line-height:1.35;cursor:pointer"
                        @click="copyText(tab.positive, $event.currentTarget)"
                    >
                        {{ tab.positive }}
                    </div>
                    <template v-if="tab.negative">
                        <div style="font-size:10px;font-weight:700;color:#F44336;letter-spacing:0.4px;margin-top:4px">
                            {{ t("sidebar.generation.negative", "NEGATIVE") }}
                        </div>
                        <div
                            style="font-size:12px;color:var(--fg-color, #ddd);white-space:pre-wrap;line-height:1.35;cursor:pointer"
                            @click="copyText(tab.negative, $event.currentTarget)"
                        >
                            {{ tab.negative }}
                        </div>
                    </template>
                </div>
            </div>

            <div
                v-else-if="!sectionState.ltxDirector && !sectionState.ideogram && sectionState.positivePrompt"
                :style="boxStyle('#4CAF50', { emphasis: true, startAlpha: 0.16, endAlpha: 0.10 })"
            >
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;font-weight:600;color:#4CAF50;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">
                    <span>{{ t("sidebar.generation.positivePrompt", "Positive Prompt") }}</span>
                    <span
                        v-if="sectionState.positivePromptOverride"
                        :style="overridePillStyle()"
                        :title="t('sidebar.generation.overrideTooltip', 'This field was forced by Majoor Gen Info Override')"
                    >
                        {{ t("sidebar.generation.override", "override") }}
                    </span>
                </div>
                <div
                    :title="t('action.clickToCopy', 'Click to copy')"
                    style="font-size:12px;color:var(--fg-color, rgba(255,255,255,0.9));line-height:1.5;white-space:pre-wrap;word-break:break-word;cursor:pointer"
                    @click="copyText(sectionState.positivePrompt, $event.currentTarget)"
                >
                    {{ sectionState.positivePrompt }}
                </div>
            </div>

            <div
                v-if="!sectionState.ltxDirector && !sectionState.ideogram && !sectionState.promptTabs.length && sectionState.negativePrompt"
                :style="boxStyle('#F44336', { emphasis: true, startAlpha: 0.16, endAlpha: 0.10 })"
            >
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;font-weight:600;color:#F44336;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">
                    <span>{{ t("sidebar.generation.negativePrompt", "Negative Prompt") }}</span>
                    <span
                        v-if="sectionState.negativePromptOverride"
                        :style="overridePillStyle()"
                        :title="t('sidebar.generation.overrideTooltip', 'This field was forced by Majoor Gen Info Override')"
                    >
                        {{ t("sidebar.generation.override", "override") }}
                    </span>
                </div>
                <div
                    :title="t('action.clickToCopy', 'Click to copy')"
                    style="font-size:12px;color:var(--fg-color, rgba(255,255,255,0.9));line-height:1.5;white-space:pre-wrap;word-break:break-word;cursor:pointer"
                    @click="copyText(sectionState.negativePrompt, $event.currentTarget)"
                >
                    {{ sectionState.negativePrompt }}
                </div>
            </div>
        </template>

        <div
            v-if="isCaptionSectionVisible"
            style="background:linear-gradient(135deg, rgba(0, 188, 212, 0.14) 0%, rgba(33, 150, 243, 0.10) 100%);border:1px solid rgba(0, 188, 212, 0.40);border-radius:6px;padding:12px;display:flex;flex-direction:column;gap:10px"
            :class="{ 'mjr-ai-disabled-block': !aiEnabled }"
        >
            <template v-if="sectionState.showAlignment">
                <div style="font-size:11px;font-weight:600;color:#00BCD4;text-transform:uppercase;letter-spacing:0.5px;display:flex;align-items:center;justify-content:space-between">
                    <span :title="t('sidebar.generation.promptAlignmentTooltip', 'How closely the generated image matches the prompt (SigLIP2 score)')">
                        {{ t("sidebar.generation.promptAlignment", "Prompt Alignment") }}
                    </span>
                </div>

                <div style="display:flex;align-items:center;gap:10px">
                    <div style="flex:1;height:8px;background:rgba(255,255,255,0.1);border-radius:4px;overflow:hidden">
                        <div
                            :style="{
                                height: '100%',
                                width: alignmentState.fillWidth,
                                background: alignmentState.fillColor,
                                borderRadius: '4px',
                                transition: 'width 0.6s ease, background 0.4s ease',
                            }"
                        />
                    </div>
                    <span
                        :style="{
                            fontSize: '13px',
                            fontWeight: '700',
                            color: alignmentState.scoreColor,
                            minWidth: '60px',
                            textAlign: 'right',
                            fontFamily: `'Consolas', 'Monaco', monospace`,
                        }"
                    >
                        {{ alignmentState.scoreText }}
                    </span>
                    <span
                        :style="{
                            fontSize: '9px',
                            fontWeight: '700',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            background: alignmentState.qualityBackground,
                            color: alignmentState.qualityColor,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                        }"
                    >
                        {{ alignmentState.qualityText }}
                    </span>
                </div>

                <div
                    v-if="alignmentState.aiStatusVisible"
                    style="font-size:10px;color:rgba(255,255,255,0.65);border:1px dashed rgba(255,255,255,0.25);border-radius:4px;padding:6px 8px;background:rgba(255,255,255,0.04)"
                >
                    {{ alignmentState.aiStatusText }}
                </div>
            </template>

            <div style="font-size:10px;font-weight:600;color:rgba(0, 188, 212, 0.75);text-transform:uppercase;letter-spacing:0.5px;margin-top:8px;display:flex;align-items:center;justify-content:space-between;gap:8px">
                <span :title="t('sidebar.generation.aiCaptionTooltip', 'AI caption generated by Florence-2')">
                    {{ sectionState.captionLabel }}
                </span>
                <div style="display:flex;align-items:center;gap:6px">
                    <MButton
                        type="button"
                        class="mjr-ai-control"
                        severity="secondary"
                        text
                        :disabled="!canGenerateCaption || generatingCaption"
                        style="border:1px solid rgba(0,188,212,0.45);background:rgba(0,188,212,0.12);color:#00BCD4;border-radius:4px;font-size:10px;font-weight:600;padding:2px 8px;cursor:pointer"
                        :style="{ opacity: !canGenerateCaption ? '0.6' : '1', cursor: !canGenerateCaption ? 'default' : 'pointer' }"
                        @click.stop="regenerateCaption"
                    >
                        {{ generateCaptionLabel }}
                    </MButton>
                    <MButton
                        type="button"
                        class="mjr-ai-control"
                        severity="secondary"
                        text
                        :disabled="!canCopyCaption"
                        style="border:1px solid rgba(0,188,212,0.45);background:rgba(0,188,212,0.12);color:#00BCD4;border-radius:4px;font-size:10px;font-weight:600;padding:2px 8px;cursor:pointer"
                        :style="{ opacity: !canCopyCaption ? '0.6' : '1', cursor: !canCopyCaption ? 'default' : 'pointer' }"
                        @click.stop="copyCaption"
                    >
                        {{ copyCaptionLabel }}
                    </MButton>
                </div>
            </div>

            <div
                :title="aiEnabled ? t('sidebar.generation.copyCaptionTooltip', 'Click to copy caption') : t('sidebar.generation.aiCaptionDisabled', 'AI caption controls are disabled')"
                :style="{
                    marginTop: '4px',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid rgba(0, 188, 212, 0.30)',
                    background: 'rgba(0, 188, 212, 0.08)',
                    color: 'rgba(230, 250, 255, 0.95)',
                    fontSize: '11px',
                    lineHeight: '1.45',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    cursor: canCopyCaption ? 'copy' : 'default',
                }"
                @click="copyCaption"
            >
                {{ displayedCaption }}
            </div>
        </div>

        <div
            v-if="modelBranches.length"
            :style="boxStyle('#9C27B0', { emphasis: true, startAlpha: 0.18, endAlpha: 0.10 })"
        >
            <div style="font-size:11px;font-weight:600;color:#9C27B0;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">
                {{ t("sidebar.generation.models", "Models") }}
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(190px, 1fr));gap:10px">
                <div
                    v-for="branch in modelBranches"
                    :key="`models-top-${branch.key}`"
                    :style="modelGroupStyle(modelBranchAccent(branch), true)"
                >
                    <div :style="{ fontSize: '10px', fontWeight: '800', color: modelBranchAccent(branch), letterSpacing: '0.6px', textTransform: 'uppercase' }">
                        {{ branch.label }}
                    </div>
                    <div
                        v-for="field in branch.modelFields"
                        :key="`model-top-${branch.key}-${field.label}`"
                        style="display:flex;flex-direction:column;gap:3px;min-width:0"
                    >
                        <span style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.58);text-transform:uppercase;letter-spacing:0.4px">{{ field.label }}</span>
                        <span style="font-size:12px;color:var(--fg-color, rgba(255,255,255,0.96));line-height:1.35;word-break:break-word;cursor:pointer" @click="copyText(field.value, $event.currentTarget)">
                            {{ field.value || '-' }}
                        </span>
                    </div>
                    <div v-if="branch.loras.length" style="display:flex;flex-direction:column;gap:5px">
                        <span style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.58);text-transform:uppercase;letter-spacing:0.4px">LoRA</span>
                        <span
                            v-for="(lora, index) in branch.loras"
                            :key="`model-top-${branch.key}-lora-${index}`"
                            style="font-size:12px;color:var(--fg-color, rgba(255,255,255,0.92));line-height:1.35;word-break:break-word;padding:6px 8px;border-radius:6px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);cursor:pointer"
                            @click="copyText(lora, $event.currentTarget)"
                        >
                            {{ lora }}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <div
            v-if="sectionState.lyrics"
            :style="boxStyle('#00BCD4', { emphasis: false })"
        >
            <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;font-weight:600;color:#00BCD4;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">
                <span>{{ t("sidebar.generation.lyrics", "Lyrics") }}</span>
            </div>
            <div style="font-size:12px;color:var(--fg-color, rgba(255,255,255,0.9));line-height:1.5;white-space:pre-wrap;word-break:break-word">
                {{ sectionState.lyrics }}
            </div>
        </div>

        <template v-if="sectionState.branchCards.length">
            <div
                v-if="false && modelBranches.length"
                :style="boxStyle('#9C27B0', { emphasis: true, startAlpha: 0.18, endAlpha: 0.10 })"
            >
                <div style="font-size:11px;font-weight:600;color:#9C27B0;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">
                    {{ t("sidebar.generation.models", "Models") }}
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(190px, 1fr));gap:10px">
                    <div
                        v-for="branch in modelBranches"
                        :key="`models-${branch.key}`"
                        :style="modelGroupStyle(branch.accent, true)"
                    >
                        <div :style="{ fontSize: '10px', fontWeight: '800', color: branch.accent, letterSpacing: '0.6px', textTransform: 'uppercase' }">
                            {{ branch.label }}
                        </div>
                        <div
                            v-for="field in branch.modelFields"
                            :key="`model-${branch.key}-${field.label}`"
                            style="display:flex;flex-direction:column;gap:3px;min-width:0"
                        >
                            <span style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.58);text-transform:uppercase;letter-spacing:0.4px">{{ field.label }}</span>
                            <span style="font-size:12px;color:var(--fg-color, rgba(255,255,255,0.96));line-height:1.35;word-break:break-word;cursor:pointer" @click="copyText(field.value, $event.currentTarget)">
                                {{ field.value || '-' }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div
                v-if="samplingBranches.length"
                :style="boxStyle('#FF9800', { emphasis: true, startAlpha: 0.16, endAlpha: 0.10 })"
            >
                <div style="font-size:11px;font-weight:600;color:#FF9800;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">
                    {{ t("sidebar.generation.sampling", "Sampling") }}
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:8px">
                    <div
                        v-for="branch in samplingBranches"
                        :key="`sampling-${branch.key}`"
                        :style="modelGroupStyle(samplingBranchAccent(branch), true)"
                    >
                        <div :style="{ fontSize: '10px', fontWeight: '800', color: samplingBranchAccent(branch), letterSpacing: '0.6px', textTransform: 'uppercase' }">
                            {{ branch.label }}
                        </div>
                        <div
                            v-for="field in branch.samplingFields"
                            :key="`sampling-row-${branch.key}-${field.label}`"
                            style="display:grid;grid-template-columns:minmax(48px,0.8fr) minmax(0,1fr);gap:8px;font-size:11px;color:rgba(255,255,255,0.72);align-items:start"
                        >
                            <span>{{ field.label }}</span>
                            <span style="color:var(--fg-color, #ddd);word-break:break-word;text-align:right;cursor:pointer" @click="copyText(field.value, $event.currentTarget)">{{ field.value }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div
                v-if="false && loraBranches.length"
                :style="boxStyle('#BA68C8', { emphasis: true, startAlpha: 0.16, endAlpha: 0.10 })"
            >
                <div style="font-size:11px;font-weight:600;color:#BA68C8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">
                    {{ t("sidebar.generation.loras", "LoRAs") }}
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(190px, 1fr));gap:10px">
                    <div
                        v-for="branch in loraBranches"
                        :key="`loras-${branch.key}`"
                        :style="modelGroupStyle(branch.accent, true)"
                    >
                        <div :style="{ fontSize: '10px', fontWeight: '800', color: branch.accent, letterSpacing: '0.6px', textTransform: 'uppercase' }">
                            {{ branch.label }}
                        </div>
                        <div style="display:flex;flex-direction:column;gap:5px">
                            <div
                                v-for="(lora, index) in branch.loras"
                                :key="`${branch.key}-lora-${index}`"
                                style="font-size:12px;color:var(--fg-color, rgba(255,255,255,0.92));line-height:1.35;word-break:break-word;padding:6px 8px;border-radius:6px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);cursor:pointer"
                                @click="copyText(lora, $event.currentTarget)"
                            >
                                {{ lora }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <div
            v-else-if="sectionState.modelGroups.length"
            :style="boxStyle('#9C27B0', { emphasis: true, startAlpha: 0.18, endAlpha: 0.10 })"
        >
            <div style="font-size:11px;font-weight:600;color:#9C27B0;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">
                {{ t("sidebar.generation.models", "Models") }}
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:10px">
                <div
                    v-for="group in sectionState.modelGroups"
                    :key="`model-group-${group.key}`"
                    :style="modelGroupStyle(modelGroupAccent(group.key), true)"
                >
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
                        <div
                            :style="{
                                fontSize: '10px',
                                fontWeight: '800',
                                color: modelGroupAccent(group.key),
                                letterSpacing: '0.6px',
                                textTransform: 'uppercase',
                            }"
                        >
                            {{ group.label }}
                        </div>
                        <span
                            :style="{
                                fontSize: '9px',
                                fontWeight: '700',
                                color: '#fff',
                                background: hexToRgba(modelGroupAccent(group.key), 0.22),
                                border: `1px solid ${hexToRgba(modelGroupAccent(group.key), 0.48)}`,
                                borderRadius: '999px',
                                padding: '2px 8px',
                                letterSpacing: '0.4px',
                                textTransform: 'uppercase',
                            }"
                        >
                            {{ group.loras?.length || 0 }} LoRA
                        </span>
                    </div>

                    <div style="display:flex;flex-direction:column;gap:4px">
                        <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.58);text-transform:uppercase;letter-spacing:0.4px">
                            UNet
                        </div>
                        <div
                            style="font-size:12px;color:var(--fg-color, rgba(255,255,255,0.96));line-height:1.45;word-break:break-word;cursor:pointer"
                            @click="copyText(group.model, $event.currentTarget)"
                        >
                            {{ group.model || '-' }}
                        </div>
                    </div>

                    <div v-if="group.loras?.length" style="display:flex;flex-direction:column;gap:6px">
                        <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.58);text-transform:uppercase;letter-spacing:0.4px">
                            {{ t("sidebar.generation.loraStack", "LoRA Stack") }}
                        </div>
                        <div style="display:flex;flex-direction:column;gap:5px">
                            <div
                                v-for="(lora, index) in group.loras"
                                :key="`${group.key}-lora-${index}`"
                                style="font-size:12px;color:var(--fg-color, rgba(255,255,255,0.92));line-height:1.4;word-break:break-word;padding:6px 8px;border-radius:6px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);cursor:pointer"
                                @click="copyText(lora, $event.currentTarget)"
                            >
                                {{ lora }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div
            v-for="section in parameterSections"
            :key="section.key"
            :style="boxStyle(section.accent, { emphasis: section.emphasis })"
        >
            <div
                :style="{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: section.accent,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '10px',
                }"
            >
                {{ section.title }}
            </div>
            <div style="display:grid;grid-template-columns:auto 1fr;gap:8px 12px;align-items:start">
                <template
                    v-for="field in section.fields"
                    :key="`${section.key}-${field.label}`"
                >
                    <div
                        :title="field.label"
                        style="font-size:11px;color:var(--mjr-muted, rgba(127,127,127,0.9));font-weight:500;display:flex;align-items:center;gap:6px"
                    >
                        <span>{{ field.label }}:</span>
                        <span
                            v-if="field.override"
                            :style="overridePillStyle()"
                            :title="t('sidebar.generation.overrideTooltip', 'This field was forced by Majoor Gen Info Override')"
                        >
                            {{ t("sidebar.generation.override", "override") }}
                        </span>
                    </div>
                    <div
                        :title="`${field.label}: ${field.value}`"
                        style="font-size:12px;color:var(--fg-color, rgba(255,255,255,0.95));word-break:break-word;white-space:pre-wrap;cursor:pointer"
                        @click="copyText(field.value, $event.currentTarget)"
                    >
                        {{ field.value }}
                    </div>
                </template>
            </div>
        </div>

        <div
            v-if="sectionState.notesFields.length"
            :style="boxStyle('#4CAF50', { emphasis: false })"
        >
            <div style="font-size:11px;font-weight:600;color:#4CAF50;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">
                {{ t("sidebar.generation.notes", "Notes") }}
            </div>
            <template
                v-for="field in sectionState.notesFields"
                :key="field.label"
            >
                <div
                    :title="`${field.label}: ${field.value}`"
                    style="font-size:12px;color:var(--fg-color, rgba(255,255,255,0.9));line-height:1.5;white-space:pre-wrap;word-break:break-word;cursor:pointer"
                    @click="copyText(field.value, $event.currentTarget)"
                >
                    {{ field.value }}
                </div>
            </template>
        </div>

        <div
            v-if="sectionState.moduleBlocks.length"
            :style="boxStyle('#26C6DA', { emphasis: true, startAlpha: 0.14, endAlpha: 0.08 })"
        >
            <div style="font-size:11px;font-weight:600;color:#26C6DA;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">
                {{ t("sidebar.generation.modules", "Modules") }}
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(190px, 1fr));gap:10px">
                <div
                    v-for="module in sectionState.moduleBlocks"
                    :key="`module-${module.key}-${module.title}`"
                    :style="modelGroupStyle(module.accent, false)"
                >
                    <div :style="{ fontSize: '10px', fontWeight: '800', color: module.accent, letterSpacing: '0.6px', textTransform: 'uppercase' }">
                        {{ module.title }}
                    </div>
                    <div
                        v-for="field in module.fields"
                        :key="`module-${module.key}-${field.label}`"
                        style="display:flex;flex-direction:column;gap:3px;min-width:0"
                    >
                        <span style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.58);text-transform:uppercase;letter-spacing:0.4px">{{ field.label }}</span>
                        <span
                            :title="`${field.label}: ${field.value}`"
                            style="font-size:12px;color:var(--fg-color, rgba(255,255,255,0.9));line-height:1.35;white-space:pre-wrap;word-break:break-word;cursor:pointer"
                            @click="copyText(field.value, $event.currentTarget)"
                        >
                            {{ field.value }}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <div
            v-if="sectionState.ttsInstruction"
            :style="boxStyle('#26A69A', { emphasis: false })"
        >
            <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;font-weight:600;color:#26A69A;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">
                <span>{{ t("sidebar.generation.ttsInstruction", "TTS Instruction") }}</span>
            </div>
            <div
                :title="t('action.clickToCopy', 'Click to copy')"
                style="font-size:12px;color:var(--fg-color, rgba(255,255,255,0.9));line-height:1.5;white-space:pre-wrap;word-break:break-word;cursor:pointer"
                @click="copyText(sectionState.ttsInstruction, $event.currentTarget)"
            >
                {{ sectionState.ttsInstruction }}
            </div>
        </div>

        <div
            v-if="sectionState.seed !== null && sectionState.seed !== undefined && sectionState.seed !== ''"
            :style="seedBoxStyle()"
        >
            <div style="font-size:11px;font-weight:700;color:#E91E63;text-transform:uppercase;letter-spacing:1px">
                {{ t("sidebar.generation.seed", "SEED") }}
            </div>
            <div
                :title="t('sidebar.generation.copySeedTooltip', 'Click to copy seed: {seed}', { seed: sectionState.seed })"
                style="font-size:18px;font-weight:700;color:#fff;font-family:'Consolas', 'Monaco', monospace;letter-spacing:1px;cursor:pointer;padding:4px 8px;border-radius:4px;transition:background 0.2s"
                @click="copyText(sectionState.seed, $event.currentTarget, 'rgba(76, 175, 80, 0.4)')"
            >
                {{ sectionState.seed }}
            </div>
        </div>

        <div
            v-if="sectionState.inputFiles.length"
            :style="boxStyle('#4CAF50', { emphasis: true, startAlpha: 0.16, endAlpha: 0.10 })"
        >
            <div
                :title="t('tooltip.generationInputs', 'Input files used in generation')"
                style="font-size:11px;font-weight:600;color:#4CAF50;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px"
            >
                {{ t("sidebar.generation.sourceFiles", "Source Files") }}
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
                <GenerationInputThumb
                    v-for="inputFile in sectionState.inputFiles"
                    :key="inputFile.id"
                    :input-file="inputFile"
                />
            </div>
        </div>
    </div>
</template>
