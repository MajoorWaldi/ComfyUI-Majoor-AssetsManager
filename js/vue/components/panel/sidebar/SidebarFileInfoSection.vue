<script setup>
import { computed } from "vue";
import { formatDate, formatTime, formatDuration } from "../../../../utils/format.js";
import { formatFps, readAssetFps, readAssetFrameCount } from "../../../../utils/mediaFps.js";
import { genTimeColor, normalizeGenerationTimeMs } from "../../../../components/Badges.js";

const props = defineProps({
    asset: { type: Object, required: true },
});

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

const rows = computed(() => {
    const asset = props.asset || {};
    const fileData = [];
    if (asset.width && asset.height) {
        fileData.push({
            label: "Dimensions",
            value: `${asset.width} × ${asset.height}`,
            tooltip: "Image/video resolution in pixels",
        });
    }
    if (asset.duration && asset.duration > 0) {
        fileData.push({
            label: "Duration",
            value: formatDuration(asset.duration),
            tooltip: "Video duration",
        });
    }
    if (isAnimatedMedia(asset)) {
        const fps = readAssetFps(asset);
        if (fps != null) {
            fileData.push({ label: "FPS", value: formatFps(fps), tooltip: "Native frame rate" });
        }
        const frameCount = readAssetFrameCount(asset, fps);
        if (frameCount != null) {
            fileData.push({
                label: "Length",
                value: `${Math.max(0, Math.floor(frameCount))} frames`,
                tooltip: "Total frame count",
            });
        }
    }
    const genTimeMs = normalizeGenerationTimeMs(
        asset.generation_time_ms ?? asset.metadata?.generation_time_ms ?? 0,
    );
    if (genTimeMs > 0) {
        fileData.push({
            label: "Generation Time",
            value: `${(Number(genTimeMs) / 1000).toFixed(1)}s`,
            tooltip: "Time taken to generate this asset (workflow execution time)",
            valueStyle: `color: ${genTimeColor(genTimeMs)}; font-weight: 600;`,
        });
    }
    const timestamp =
        asset.generation_time || asset.file_creation_time || asset.mtime || asset.created_at;
    if (timestamp) {
        const dateStr = formatDate(timestamp);
        const timeStr = formatTime(timestamp);
        if (dateStr) fileData.push({ label: "Date", value: dateStr, tooltip: "File creation/generation date" });
        if (timeStr) fileData.push({ label: "Time", value: timeStr, tooltip: "File creation/generation time" });
    }
    if (asset.size && asset.size > 0) {
        fileData.push({ label: "File Size", value: formatFileSize(asset.size), tooltip: "File size on disk" });
    }
    if (asset.id != null) {
        fileData.push({ label: "Asset ID", value: String(asset.id), tooltip: "Internal database asset identifier" });
    }
    if (asset.job_id) {
        fileData.push({ label: "Job ID", value: String(asset.job_id), tooltip: "Workflow execution job identifier (prompt_id)" });
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
            File Info
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
                <div
                    :style="row.valueStyle || 'font-size: 12px; text-align: right; word-break: break-word'"
                    :title="String(row.value || '')"
                >
                    {{ row.value }}
                </div>
            </div>
        </div>
    </div>
</template>
