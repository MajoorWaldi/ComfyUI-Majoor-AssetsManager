const WINDOWS_RESERVED_NAMES = new Set([
    "CON",
    "PRN",
    "AUX",
    "NUL",
    "COM1",
    "COM2",
    "COM3",
    "COM4",
    "COM5",
    "COM6",
    "COM7",
    "COM8",
    "COM9",
    "LPT1",
    "LPT2",
    "LPT3",
    "LPT4",
    "LPT5",
    "LPT6",
    "LPT7",
    "LPT8",
    "LPT9",
]);

const MAX_FILENAME_LENGTH = 255;

export function validateFilename(filename) {
    try {
        const name = String(filename ?? "").trim();
        if (!name) {
            return { valid: false, reason: "Filename cannot be empty" };
        }
        if (name.length > MAX_FILENAME_LENGTH) {
            return { valid: false, reason: `Filename is too long (max ${MAX_FILENAME_LENGTH} characters)` };
        }
        if (name.includes("/") || name.includes("\\")) {
            return { valid: false, reason: "Filename cannot contain path separators" };
        }
        if (name.includes("\x00")) {
            return { valid: false, reason: "Filename cannot contain null bytes" };
        }
        for (const char of name) {
            if (char.charCodeAt(0) < 32) {
                return { valid: false, reason: "Filename cannot contain control characters" };
            }
        }
        if (name.startsWith(".") || name.startsWith(" ")) {
            return { valid: false, reason: "Filename cannot start with a dot or space" };
        }
        if (name.endsWith(".") || name.endsWith(" ")) {
            return { valid: false, reason: "Filename cannot end with a dot or space" };
        }
        const base = name.split(".")[0].toUpperCase();
        if (WINDOWS_RESERVED_NAMES.has(base)) {
            return { valid: false, reason: "Filename uses a reserved Windows name" };
        }
        return { valid: true, reason: "" };
    } catch (error) {
        return { valid: false, reason: String(error || "Invalid filename") };
    }
}

function sanitizeFilename(filename) {
    try {
        return String(filename ?? "").trim();
    } catch {
        return "";
    }
}

function splitNameExt(filename) {
    const name = sanitizeFilename(filename);
    if (!name) return { stem: "", ext: "" };
    const idx = name.lastIndexOf(".");
    // Keep dotfiles (".env") as extension-less names.
    if (idx <= 0 || idx === name.length - 1) return { stem: name, ext: "" };
    return { stem: name.slice(0, idx), ext: name.slice(idx) };
}

export function normalizeRenameFilename(inputName, currentName) {
    const nextRaw = sanitizeFilename(inputName);
    if (!nextRaw) return "";
    const current = splitNameExt(currentName);
    const next = splitNameExt(nextRaw);
    // If user did not type an extension, preserve the current one.
    if (!next.ext && current.ext) return `${nextRaw}${current.ext}`;
    return nextRaw;
}
