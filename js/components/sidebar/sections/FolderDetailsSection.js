import { createSection, createParametersBox } from "../utils/dom.js";
import { formatDate, formatTime } from "../../../utils/format.js";

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

export function createFolderDetailsSection(asset, folderInfo = null) {
    const section = createSection("Folder Details");
    const data = folderInfo || {};

    const path = String(
        data.path ||
            asset?.filepath ||
            asset?.subfolder ||
            ""
    );
    const name = String(data.name || asset?.filename || "").trim();
    const files = Number(data.files ?? 0);
    const folders = Number(data.folders ?? 0);
    const size = Number(data.size ?? 0);
    const mtime = Number(data.mtime ?? asset?.mtime ?? 0);
    const ctime = Number(data.ctime ?? 0);
    const truncated = !!data.truncated;

    const rows = [
        { label: "Name", value: name || "-" },
        { label: "Path", value: path || "-" },
        { label: "Folders", value: Number.isFinite(folders) ? String(folders) : "-" },
        { label: "Files", value: Number.isFinite(files) ? String(files) : "-" },
        { label: "Size", value: formatBytes(size) },
    ];
    if (ctime > 0) {
        rows.push({
            label: "Created",
            value: `${formatDate(ctime) || "-"} ${formatTime(ctime) || ""}`.trim(),
        });
    }
    if (mtime > 0) {
        rows.push({
            label: "Modified",
            value: `${formatDate(mtime) || "-"} ${formatTime(mtime) || ""}`.trim(),
        });
    }
    if (truncated) {
        rows.push({
            label: "Note",
            value: "Scan was truncated for performance",
            valueStyle: "color:#FFB74D;font-weight:600;",
        });
    }

    section.appendChild(createParametersBox("Folder", rows, "#26A69A", { emphasis: true }));
    return section;
}

