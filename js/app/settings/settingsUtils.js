/**
 * Shared utility helpers for Majoor settings.
 * Pure functions – no side effects, no imports beyond APP_DEFAULTS.
 */

import { APP_DEFAULTS } from "../config.js";

// ─── Primitive coercers ────────────────────────────────────────────────────

export const _safeBool = (value, fallback) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (["1", "true", "yes", "on"].includes(normalized)) return true;
        if (["0", "false", "no", "off"].includes(normalized)) return false;
    }
    return !!fallback;
};

export const _safeNum = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : Number(fallback);
};

export const _safeOneOf = (value, allowed, fallback) => {
    const candidate = typeof value === "string" ? value.trim() : String(value ?? "");
    return allowed.includes(candidate) ? candidate : fallback;
};

// ─── Deep merge (prototype-pollution safe) ────────────────────────────────

const _isUnsafeMergeKey = (key) =>
    key === "__proto__" || key === "prototype" || key === "constructor";

export const deepMerge = (base, next) => {
    const output = { ...base };
    if (!next || typeof next !== "object") {
        return output;
    }
    Object.keys(next).forEach((key) => {
        if (_isUnsafeMergeKey(key)) return;
        const value = next[key];
        if (value && typeof value === "object" && !Array.isArray(value)) {
            output[key] = deepMerge(base[key] || {}, value);
        } else if (value !== undefined) {
            output[key] = value;
        }
    });
    return output;
};

// ─── Grid size presets ────────────────────────────────────────────────────

export const GRID_SIZE_PRESETS = Object.freeze({
    small: 80,
    medium: 120,
    large: 180,
});

export const GRID_SIZE_PRESET_OPTIONS = Object.freeze(["small", "medium", "large"]);

export const resolveGridMinSize = (grid = {}) => {
    const preset = _safeOneOf(String(grid?.minSizePreset || "").toLowerCase(), GRID_SIZE_PRESET_OPTIONS, "");
    if (preset) return GRID_SIZE_PRESETS[preset];
    return Math.max(60, Math.min(600, Math.round(_safeNum(grid?.minSize, APP_DEFAULTS.GRID_MIN_SIZE))));
};

export const detectGridSizePreset = (minSize) => {
    const val = Math.round(_safeNum(minSize, APP_DEFAULTS.GRID_MIN_SIZE));
    if (val <= 100) return "small";
    if (val >= 150) return "large";
    return "medium";
};
