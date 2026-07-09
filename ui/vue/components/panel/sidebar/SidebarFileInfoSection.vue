<script setup>
import { computed } from "vue";
import { formatDate, formatTime, formatDuration } from "../../../../utils/format.js";
import { formatFps, readAssetFps, readAssetFrameCount } from "../../../../utils/mediaFps.js";
import { genTimeColor, normalizeGenerationTimeMs } from "../../../../components/Badges.js";

const props = defineProps({
    asset: { type: Object, required: true },
});

function formatFileSize(bytes) {
    const byteCount = Number(bytes);
    if (!Number.isFinite(byteCount) || byteCount < 0) return "N/A";
    if (byteCount === 0) return "0 bytes";
    const units = ["B", "KB", "MB", "GB"];
    let unitIndex = 0;
    let size = byteCount;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex += 1;
    }
    if (unitIndex === 0) return `${Math.round(size)} bytes`;
    return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function readRawMetadata(asset) {
    const raw = asset?.metadata_raw;
    if (raw && typeof raw === "object") return raw;
    if (typeof raw !== "string" || !raw.trim()) return {};
    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

function firstValue(...values) {
    return values.find((value) => value !== undefined && value !== null && value !== "");
}

function formatBitDepth(stream, raw) {
    const bits = firstValue(
        stream.bits_per_raw_sample,
        stream.bits_per_sample,
        raw.bits_per_channel,
        raw.bitsperchannel,
        raw.bit_depth,
    );
    const pixelFormat = String(firstValue(stream.pix_fmt, raw.pixel_format, raw.pix_fmt) || "");
    const explicitFormatBits = Number(pixelFormat.match(/(?:p|gray|gbrp)(\d+)(?:le|be)?$/i)?.[1]);
    const numericBits = Number(bits) || (explicitFormatBits >= 8 ? explicitFormatBits : 0);
    const sampleFormat = String(firstValue(stream.sample_fmt, raw.sample_format) || "").toLowerCase();
    const isFloat = sampleFormat.includes("flt") || sampleFormat.includes("dbl") || /(?:16|32)f\b/i.test(pixelFormat);
    if (numericBits > 0) return `${numericBits}-bit ${isFloat ? "float" : "fixed"}`;
    if (pixelFormat) return `8-bit ${isFloat ? "float" : "fixed"}`;
    return isFloat ? "float" : "N/A";
}

function readAssetField(asset, key) {
    const direct = asset?.[key] ?? asset?.file_info?.[key];
    if (direct !== undefined && direct !== null && direct !== "") return direct;
    // Fallback for fields nested under user_metadata (the backend may surface
    // workflow.id only inside the raw metadata payload). Keep this fallback
    // narrow to known keys to avoid surprising consumers.
    if (key === "workflow_id") {
        return (
            asset?.user_metadata?.workflow?.id
            ?? asset?.metadata?.workflow_id
            ?? ""
        );
    }
    return "";
}

const rows = computed(() => {
    const asset = props.asset || {};
    const raw = readRawMetadata(asset);
    const ffprobe = raw?.raw_ffprobe && typeof raw.raw_ffprobe === "object" ? raw.raw_ffprobe : {};
    const videoStream = ffprobe?.video_stream && typeof ffprobe.video_stream === "object"
        ? ffprobe.video_stream
        : {};
    const format = ffprobe?.format && typeof ffprobe.format === "object" ? ffprobe.format : {};
    const fileData = [];
    if (asset.width && asset.height) {
        fileData.push({
            label: "Dimensions",
            value: `${asset.width} x ${asset.height}`,
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
    const fps = readAssetFps(asset);
    if (fps != null) fileData.push({ label: "FPS", value: formatFps(fps), tooltip: "Native frame rate" });
    const frameCount = readAssetFrameCount(asset, fps);
    fileData.push({
        label: "Frames",
        value: frameCount != null ? String(Math.max(0, Math.floor(frameCount))) : "N/A",
        tooltip: "Total frame count",
    });
    fileData.push({ label: "Bits / Channel", value: formatBitDepth(videoStream, raw), tooltip: "Channel precision and numeric representation" });
    fileData.push({
        label: "Pixel Aspect",
        value: String(firstValue(videoStream.sample_aspect_ratio, raw.pixel_aspect_ratio) || "N/A"),
        tooltip: "Pixel sample aspect ratio",
    });
    fileData.push({
        label: "Codec ID",
        value: String(firstValue(videoStream.codec_tag_string, videoStream.codec_tag, raw.codec_id) || "N/A"),
        tooltip: "Container codec identifier",
    });
    fileData.push({
        label: "Codec Name",
        value: String(firstValue(videoStream.codec_long_name, videoStream.codec_name, raw.codec_name) || "N/A"),
        tooltip: "Video codec name",
    });
    fileData.push({
        label: "Encoder",
        value: String(firstValue(videoStream.tags?.encoder, format.tags?.encoder, raw.encoder) || "N/A"),
        tooltip: "Encoder recorded in file metadata",
    });
    fileData.push({
        label: "Pixel Format",
        value: String(firstValue(videoStream.pix_fmt, raw.pixel_format, raw.pix_fmt) || "N/A"),
        tooltip: "Stored pixel format",
    });
    fileData.push({
        label: "Color Space",
        value: String(firstValue(videoStream.color_space, raw.color_space, raw.colorspace) || "N/A"),
        tooltip: "Encoded color space",
    });
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
    fileData.push({
        label: "File Size",
        value: formatFileSize(firstValue(asset.size_bytes, asset.size, asset.file_info?.size_bytes, asset.file_info?.size)),
        tooltip: "File size on disk",
    });
    if (asset.id != null) {
        fileData.push({ label: "Asset ID", value: String(asset.id), tooltip: "Internal database asset identifier" });
    }
    const jobId = String(readAssetField(asset, "job_id") || "").trim();
    if (jobId) {
        fileData.push({ label: "Job ID", value: jobId, tooltip: "Workflow execution job identifier (prompt_id)" });
    }
    const sourceNodeId = String(readAssetField(asset, "source_node_id") || "").trim();
    if (sourceNodeId) {
        fileData.push({ label: "Source Node", value: sourceNodeId, tooltip: "ComfyUI node id that produced this file" });
    }
    const sourceNodeType = String(readAssetField(asset, "source_node_type") || "").trim();
    if (sourceNodeType) {
        fileData.push({ label: "Node Type", value: sourceNodeType, tooltip: "ComfyUI node class that produced this file" });
    }
    const workflowId = String(readAssetField(asset, "workflow_id") || "").trim();
    if (workflowId) {
        fileData.push({ label: "Workflow ID", value: workflowId, tooltip: "ComfyUI workflow identifier (from workflow.id in extra_data)" });
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
