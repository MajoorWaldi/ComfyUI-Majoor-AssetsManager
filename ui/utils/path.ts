/**
 * Shared path utilities for frontend modules.
 */

export function toPosixPath(value: unknown): string {
    return String(value || "").replace(/\\/g, "/");
}

export function splitFilenameAndSubfolder(value: unknown): { filename: string; subfolder: string } {
    const normalized = toPosixPath(value).trim();
    if (!normalized) return { filename: "", subfolder: "" };
    const idx = normalized.lastIndexOf("/");
    if (idx < 0) return { filename: normalized, subfolder: "" };
    return {
        filename: normalized.slice(idx + 1),
        subfolder: normalized.slice(0, idx),
    };
}

export function hasWindowsDrivePrefix(value: unknown): boolean {
    return /^[a-zA-Z]:\//.test(String(value || ""));
}
