<script setup>
import { computed } from "vue";
import { APP_CONFIG } from "../../../app/config.js";
import SidebarFileInfoSection from "../panel/sidebar/SidebarFileInfoSection.vue";
import SidebarGenerationSection from "../panel/sidebar/SidebarGenerationSection.vue";
import SidebarWorkflowSection from "../panel/sidebar/SidebarWorkflowSection.vue";
import { buildGenerationSectionState } from "../panel/sidebar/generationSectionState.js";

const props = defineProps({
    title: { type: String, default: "" },
    asset: { type: Object, default: null },
    loading: { type: Boolean, default: false },
    onRetry: { type: Function, default: null },
});

function getGenInfoStatus(asset) {
    try {
        if (!asset || typeof asset !== "object") return null;
        const raw = asset?.metadata_raw;
        if (
            raw &&
            typeof raw === "object" &&
            raw.geninfo_status &&
            typeof raw.geninfo_status === "object"
        ) {
            return raw.geninfo_status;
        }
        if (asset?.geninfo_status && typeof asset.geninfo_status === "object") {
            return asset.geninfo_status;
        }
        return null;
    } catch {
        return null;
    }
}

function coerceMetadataRawObject(asset) {
    const raw = asset?.metadata_raw ?? null;
    if (!raw) return null;
    if (typeof raw === "object") return raw;
    if (typeof raw !== "string") return null;
    const text = raw.trim();
    if (!text) return null;
    try {
        const parsed = JSON.parse(text);
        return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
        return null;
    }
}

function looksLikePromptGraph(obj) {
    try {
        const entries = Object.entries(obj || {});
        if (!entries.length) return false;
        let hits = 0;
        for (const [, value] of entries.slice(0, 50)) {
            if (!value || typeof value !== "object") continue;
            if (value.inputs && typeof value.inputs === "object") hits += 1;
            if (hits >= 2) return true;
        }
    } catch {
        return false;
    }
    return false;
}

function coerceWorkflow(asset) {
    const metadataRaw = coerceMetadataRawObject(asset);
    const value =
        asset?.workflow ||
        asset?.Workflow ||
        asset?.comfy_workflow ||
        metadataRaw?.workflow ||
        metadataRaw?.Workflow ||
        metadataRaw?.comfy_workflow ||
        null;
    if (!value) return null;
    if (typeof value === "object") return value;
    if (typeof value !== "string") return null;
    const text = value.trim();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

function coercePromptGraph(asset) {
    const metadataRaw = coerceMetadataRawObject(asset);
    const value =
        asset?.prompt || asset?.Prompt || metadataRaw?.prompt || metadataRaw?.Prompt || null;
    if (!value) return null;
    if (typeof value === "object") return looksLikePromptGraph(value) ? value : null;
    if (typeof value !== "string") return null;
    const text = value.trim();
    if (!text) return null;
    try {
        const parsed = JSON.parse(text);
        return looksLikePromptGraph(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

function hasWorkflowData(asset) {
    return !!(coerceWorkflow(asset) || coercePromptGraph(asset));
}

function hasFileInfoData(asset) {
    const target = asset || {};
    const timestamp =
        target.generation_time ||
        target.file_creation_time ||
        target.mtime ||
        target.created_at;
    return Boolean(
        (target.width && target.height) ||
            (target.duration && target.duration > 0) ||
            timestamp ||
            (target.size && target.size > 0) ||
            target.id != null ||
            target.job_id ||
            target.file_info?.job_id ||
            target.source_node_id ||
            target.file_info?.source_node_id ||
            target.source_node_type ||
            target.file_info?.source_node_type ||
            target.workflow_id ||
            target.file_info?.workflow_id,
    );
}

function formatRawMetadata(raw) {
    if (raw == null) return "";
    const text = typeof raw === "string" ? raw : JSON.stringify(raw, null, 2);
    if (!text) return "";
    return text.length > 40_000 ? `${text.slice(0, 40_000)}\n...(truncated)` : text;
}

function handleRetry() {
    if (typeof props.onRetry === "function") props.onRetry();
}

const status = computed(() => getGenInfoStatus(props.asset));
const generationState = computed(() => buildGenerationSectionState(props.asset));
const generationVisible = computed(() => generationState.value.kind !== "empty");
const fileInfoVisible = computed(() => hasFileInfoData(props.asset));
const workflowVisible = computed(
    () => APP_CONFIG.WORKFLOW_MINIMAP_ENABLED !== false && hasWorkflowData(props.asset),
);
const showError = computed(
    () => status.value && typeof status.value === "object" && status.value.kind === "fetch_error",
);
const rawMetadataText = computed(() => formatRawMetadata(props.asset?.metadata_raw));
const showEmptyState = computed(
    () =>
        !props.loading &&
        !showError.value &&
        !fileInfoVisible.value &&
        !generationVisible.value &&
        !workflowVisible.value,
);
const errorContent = computed(() => {
    if (!showError.value) return "";
    const msg = String(
        status.value?.message || status.value?.error || "Failed to load generation data.",
    );
    const code = String(status.value?.code || status.value?.stage || "").trim();
    return code ? `${msg}\n\nCode: ${code}\nClick to retry.` : `${msg}\n\nClick to retry.`;
});
</script>

<template>
    <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px">
        <div
            v-if="props.title"
            style="font-size:12px;font-weight:600;letter-spacing:0.02em;color:rgba(255,255,255,0.86)"
        >
            {{ props.title }}
        </div>

        <div
            v-if="props.loading"
            style="padding:10px 12px;border-radius:10px;border:1px solid rgba(33,150,243,0.35);background:rgba(33,150,243,0.08);color:rgba(255,255,255,0.86);white-space:pre-wrap"
        >
            <div style="font-size:12px;font-weight:700;margin-bottom:6px">Loading</div>
            <div style="font-size:12px;opacity:0.88">Loading generation data...</div>
        </div>

        <div
            v-if="showError"
            style="padding:10px 12px;border-radius:10px;border:1px solid rgba(244,67,54,0.35);background:rgba(244,67,54,0.08);color:rgba(255,255,255,0.9);white-space:pre-wrap"
            :style="{ cursor: props.onRetry ? 'pointer' : 'default' }"
            @click="handleRetry"
        >
            <div style="font-size:12px;font-weight:700;margin-bottom:6px">Error Loading Metadata</div>
            <div style="font-size:12px;opacity:0.9">{{ errorContent }}</div>
        </div>

        <SidebarFileInfoSection
            v-if="fileInfoVisible"
            :asset="props.asset"
        />
        <SidebarGenerationSection
            v-if="generationVisible"
            :asset="props.asset"
        />
        <SidebarWorkflowSection
            v-if="workflowVisible"
            :asset="props.asset"
        />

        <div
            v-if="showEmptyState"
            style="padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.72)"
        >
            No generation data found for this file.
        </div>

        <details
            v-if="rawMetadataText"
            style="border:1px solid rgba(255,255,255,0.10);border-radius:10px;background:rgba(255,255,255,0.04);overflow:hidden"
        >
            <summary
                style="cursor:pointer;padding:10px 12px;color:rgba(255,255,255,0.78);user-select:none"
            >
                Raw metadata
            </summary>
            <pre
                style="margin:0;padding:10px 12px;max-height:280px;overflow:auto;font-size:11px;line-height:1.35;color:rgba(255,255,255,0.86)"
            >{{ rawMetadataText }}</pre>
        </details>
    </div>
</template>
