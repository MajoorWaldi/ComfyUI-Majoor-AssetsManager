/**
 * Shared utility helpers for Majoor settings.
 * Pure functions - no side effects, no imports beyond APP_DEFAULTS.
 */

import { APP_DEFAULTS } from "../config.js";

// --- Primitive coercers ----------------------------------------------------

export const _safeBool = (value: any, fallback: boolean): boolean => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (["1", "true", "yes", "on"].includes(normalized)) return true;
        if (["0", "false", "no", "off"].includes(normalized)) return false;
    }
    return !!fallback;
};

export const _safeNum = (value: any, fallback: number): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : Number(fallback);
};

export const _safeOneOf = (value: any, allowed: readonly string[], fallback: string): string => {
    const candidate = typeof value === "string" ? value.trim() : String(value ?? "");
    return allowed.includes(candidate) ? candidate : fallback;
};

// --- Deep merge (prototype-pollution safe) --------------------------------

const _isUnsafeMergeKey = (key: string): boolean =>
    key === "__proto__" || key === "prototype" || key === "constructor";

export const deepMerge = <T extends Record<string, any>>(base: T, next: Partial<T> | null | undefined): T => {
    const output: Record<string, any> = { ...base };
    if (!next || typeof next !== "object") {
        return output as T;
    }
    Object.keys(next).forEach((key) => {
        if (_isUnsafeMergeKey(key)) return;
        const value = (next as any)[key];
        if (value && typeof value === "object" && !Array.isArray(value)) {
            output[key] = deepMerge(base[key] || {}, value);
        } else if (value !== undefined) {
            output[key] = value;
        }
    });
    return output as T;
};

// --- Grid size presets ----------------------------------------------------

export const GRID_SIZE_PRESETS = Object.freeze({
    small: 80,
    medium: 120,
    large: 180,
});

export const GRID_SIZE_PRESET_OPTIONS = Object.freeze(["small", "medium", "large"]);

const clampCardMinSize = (value: any, fallback: number): number =>
    Math.max(60, Math.min(600, Math.round(_safeNum(value, fallback))));

export const resolveGridMinSize = (grid: Record<string, any> = {}): number => {
    const explicitMinSize = Number(grid?.minSize);
    if (Number.isFinite(explicitMinSize)) {
        return clampCardMinSize(explicitMinSize, APP_DEFAULTS.GRID_MIN_SIZE);
    }
    const preset = _safeOneOf(
        String(grid?.minSizePreset || "").toLowerCase(),
        GRID_SIZE_PRESET_OPTIONS,
        "",
    );
    if (preset) return (GRID_SIZE_PRESETS as Record<string, number>)[preset];
    return clampCardMinSize(grid?.minSize, APP_DEFAULTS.GRID_MIN_SIZE);
};

export const resolveFeedGridMinSize = (feed: Record<string, any> = {}): number =>
    clampCardMinSize(feed?.minSize, APP_DEFAULTS.FEED_GRID_MIN_SIZE);

export const detectGridSizePreset = (minSize: number): string => {
    const val = Math.round(_safeNum(minSize, APP_DEFAULTS.GRID_MIN_SIZE));
    if (val <= 100) return "small";
    if (val >= 150) return "large";
    return "medium";
};
