<script setup>
import { computed } from "vue";
import { formatDate, formatTime } from "../../../../utils/format.js";

const props = defineProps({
    asset: { type: Object, required: true },
});

function formatBytes(bytes) {
    const n = Number(bytes || 0);
    if (!Number.isFinite(n) || n <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let size = n;
    let i = 0;
    while (size >= 1024 && i < units.length - 1) {
        size /= 1024;
        i += 1;
    }
    return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

const rows = computed(() => {
    const asset = props.asset || {};
    const data = asset.folder_info || asset.folderInfo || {};
    const path = String(data.path || asset.filepath || asset.subfolder || "");
    const name = String(data.name || asset.filename || "").trim();
    const files = Number(data.files ?? 0);
    const folders = Number(data.folders ?? 0);
    const size = Number(data.size ?? 0);
    const mtime = Number(data.mtime ?? asset.mtime ?? 0);
    const ctime = Number(data.ctime ?? 0);
    const truncated = !!data.truncated;
    const result = [
        { label: "Name", value: name || "-" },
        { label: "Path", value: path || "-" },
        { label: "Folders", value: Number.isFinite(folders) ? String(folders) : "-" },
        { label: "Files", value: Number.isFinite(files) ? String(files) : "-" },
        { label: "Size", value: formatBytes(size) },
    ];
    if (ctime > 0) {
        result.push({ label: "Created", value: `${formatDate(ctime) || "-"} ${formatTime(ctime) || ""}`.trim() });
    }
    if (mtime > 0) {
        result.push({ label: "Modified", value: `${formatDate(mtime) || "-"} ${formatTime(mtime) || ""}`.trim() });
    }
    if (truncated) {
        result.push({ label: "Note", value: "Scan was truncated for performance", valueStyle: "color:#FFB74D;font-weight:600;" });
    }
    return result;
});
</script>

<template>
    <div
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
                color: #26a69a;
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 0.4px;
            "
        >
            Folder Details
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px">
            <div
                v-for="row in rows"
                :key="row.label"
                style="display: flex; gap: 10px; align-items: flex-start; justify-content: space-between"
            >
                <div style="font-size: 12px; opacity: 0.68; min-width: 92px">
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
