<script setup>
import { computed } from "vue";
import { t } from "../../../../app/i18n.js";
import { usePanelStore } from "../../../../stores/usePanelStore.js";
import { formatDate, formatTime, formatDuration } from "../../../../utils/format.js";
import { formatFps, readAssetFps, readAssetFrameCount } from "../../../../utils/mediaFps.js";
import { genTimeColor, normalizeGenerationTimeMs } from "../../../../components/Badges.js";

const props = defineProps({
    asset: { type: Object, required: true },
});

function applySameWorkflowFilter(workflowId) {
    const id = String(workflowId || "").trim();
    if (!id) return;
    try {
        const panelStore = usePanelStore();
        panelStore.workflowId = id;
    } catch (e) {
        console.debug?.(e);
    }
    try {
        window.dispatchEvent(new CustomEvent("mjr:filters-changed"));
    } catch (e) {
        console.debug?.(e);
    }
}

function formatFileSize(bytes) {
    if (!bytes || bytes <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let unitIndex = 0;
    let size = bytes;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex += 1;
    }
    return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
}

function isAnimatedMedia(asset) {
    try {
        const kind = String(asset?.kind || "").toLowerCase();
        if (kind === "video") return true;
        const name = String(asset?.filename || asset?.filepath || asset?.path || "").toLowerCase();
        return /\.(gif|webp|webm)$/.test(name);
    } catch {
        return false;
    }
}

function readAssetField(asset, key) {
    const direct = asset?.[key] ?? asset?.file_info?.[key];
    if (direct !== undefined && direct !== null && direct !== "") return direct;
    if (key === "workflow_id") {
        return asset?.user_metadata?.workflow?.id ?? asset?.metadata?.workflow_id ?? "";
    }
    return "";
}

const rows = computed(() => {
    const asset = props.asset || {};
    const fileData = [];
    if (asset.width && asset.height) {
        fileData.push({
            label: t("sidebar.dimensions", "Dimensions"),
            value: `${asset.width} x ${asset.height}`,
            tooltip: t("sidebar.fileInfo.dimensionsTooltip", "Image/video resolution in pixels"),
        });
    }
    if (asset.duration && asset.duration > 0) {
        fileData.push({
            label: t("sidebar.fileInfo.duration", "Duration"),
            value: formatDuration(asset.duration),
            tooltip: t("sidebar.fileInfo.durationTooltip", "Video duration"),
        });
    }
    if (isAnimatedMedia(asset)) {
        const fps = readAssetFps(asset);
        if (fps != null) {
            fileData.push({
                label: "FPS",
                value: formatFps(fps),
                tooltip: t("sidebar.fileInfo.fpsTooltip", "Native frame rate"),
            });
        }
        const frameCount = readAssetFrameCount(asset, fps);
        if (frameCount != null) {
            const count = Math.max(0, Math.floor(frameCount));
            fileData.push({
                label: t("sidebar.fileInfo.length", "Length"),
                value: t("sidebar.fileInfo.frames", "{count} frames", { count }),
                tooltip: t("sidebar.fileInfo.lengthTooltip", "Total frame count"),
            });
        }
    }
    const genTimeMs = normalizeGenerationTimeMs(
        asset.generation_time_ms ?? asset.metadata?.generation_time_ms ?? 0,
    );
    if (genTimeMs > 0) {
        fileData.push({
            label: t("sidebar.fileInfo.generationTime", "Generation Time"),
            value: `${(Number(genTimeMs) / 1000).toFixed(1)}s`,
            tooltip: t("sidebar.fileInfo.generationTimeTooltip", "Time taken to generate this asset (workflow execution time)"),
            valueStyle: `color: ${genTimeColor(genTimeMs)}; font-weight: 600;`,
        });
    }
    const timestamp =
        asset.generation_time || asset.file_creation_time || asset.mtime || asset.created_at;
    if (timestamp) {
        const dateStr = formatDate(timestamp);
        const timeStr = formatTime(timestamp);
        if (dateStr) {
            fileData.push({
                label: t("sidebar.date", "Date"),
                value: dateStr,
                tooltip: t("sidebar.fileInfo.dateTooltip", "File creation/generation date"),
            });
        }
        if (timeStr) {
            fileData.push({
                label: t("sidebar.fileInfo.time", "Time"),
                value: timeStr,
                tooltip: t("sidebar.fileInfo.timeTooltip", "File creation/generation time"),
            });
        }
    }
    if (asset.size && asset.size > 0) {
        fileData.push({
            label: t("sidebar.fileInfo.fileSize", "File Size"),
            value: formatFileSize(asset.size),
            tooltip: t("sidebar.fileInfo.fileSizeTooltip", "File size on disk"),
        });
    }
    if (asset.id != null) {
        fileData.push({
            label: t("sidebar.fileInfo.assetId", "Asset ID"),
            value: String(asset.id),
            tooltip: t("sidebar.fileInfo.assetIdTooltip", "Internal database asset identifier"),
        });
    }
    const jobId = String(readAssetField(asset, "job_id") || "").trim();
    if (jobId) {
        fileData.push({
            label: t("sidebar.fileInfo.jobId", "Job ID"),
            value: jobId,
            tooltip: t("sidebar.fileInfo.jobIdTooltip", "Workflow execution job identifier (prompt_id)"),
        });
    }
    const sourceNodeId = String(readAssetField(asset, "source_node_id") || "").trim();
    if (sourceNodeId) {
        fileData.push({
            label: t("sidebar.fileInfo.sourceNode", "Source Node"),
            value: sourceNodeId,
            tooltip: t("sidebar.fileInfo.sourceNodeTooltip", "ComfyUI node id that produced this file"),
        });
    }
    const sourceNodeType = String(readAssetField(asset, "source_node_type") || "").trim();
    if (sourceNodeType) {
        fileData.push({
            label: t("sidebar.fileInfo.nodeType", "Node Type"),
            value: sourceNodeType,
            tooltip: t("sidebar.fileInfo.nodeTypeTooltip", "ComfyUI node class that produced this file"),
        });
    }
    const workflowId = String(readAssetField(asset, "workflow_id") || "").trim();
    if (workflowId) {
        fileData.push({
            label: t("sidebar.fileInfo.workflowId", "Workflow ID"),
            value: workflowId,
            tooltip: t("sidebar.fileInfo.workflowIdTooltip", "ComfyUI workflow identifier (from workflow.id in extra_data)"),
            action: "sameWorkflow",
        });
    }
    return fileData;
});
</script>

<template>
    <div
        v-if="rows.length"
        class="mjr-sidebar-section"
        style="
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--mjr-border, rgba(255, 255, 255, 0.12));
            border-radius: 8px;
            padding: 10px;
        "
    >
        <div
            style="
                font-size: 12px;
                font-weight: 700;
                color: #607d8b;
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 0.4px;
            "
        >
            {{ t("sidebar.fileInfo.title", "File Info") }}
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px">
            <div
                v-for="row in rows"
                :key="row.label"
                style="display: flex; gap: 10px; align-items: flex-start; justify-content: space-between"
            >
                <div :title="row.tooltip || ''" style="font-size: 12px; opacity: 0.68; min-width: 92px">
                    {{ row.label }}
                </div>
                <MButton
                    v-if="row.action === 'sameWorkflow'"
                    type="button"
                    :title="t('tooltip.filterWorkflowId', 'Filter assets generated from the same embedded workflow id')"
                    style="appearance:none;border:0;background:transparent;color:inherit;font:inherit;font-size:12px;text-align:right;word-break:break-word;cursor:pointer;padding:0;text-decoration:underline;text-decoration-color:rgba(255,255,255,0.25);text-underline-offset:3px"
                    @click="applySameWorkflowFilter(row.value)"
                >
                    {{ row.value }}
                </MButton>
                <div
                    v-else
                    :style="row.valueStyle || 'font-size: 12px; text-align: right; word-break: break-word'"
                    :title="String(row.value || '')"
                >
                    {{ row.value }}
                </div>
            </div>
        </div>
    </div>
</template>
