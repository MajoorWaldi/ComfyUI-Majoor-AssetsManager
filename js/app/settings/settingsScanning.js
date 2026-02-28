/**
 * Settings section: Scanning (AutoScan, Watcher, RtHydrate, RatingTagsSync).
 */

import { APP_DEFAULTS } from "../config.js";
import { toggleWatcher, getWatcherSettings, updateWatcherSettings } from "../../api/client.js";
import { comfyToast } from "../toast.js";
import { t } from "../i18n.js";
import { _safeNum } from "./settingsUtils.js";
import { saveMajoorSettings, applySettingsToConfig } from "./settingsCore.js";

const SETTINGS_PREFIX = "Majoor";
const SETTINGS_CATEGORY = "Majoor Assets Manager";

/**
 * Register all Scanning-related settings.
 *
 * @param {Function} safeAddSetting - Wrapped addSetting function from the parent.
 * @param {object}   settings       - Live settings object (mutated on change).
 * @param {Function} notifyApplied  - Callback(key) to schedule change notifications.
 */
export function registerScanningSettings(safeAddSetting, settings, notifyApplied) {
    const cat = (section, label) => [SETTINGS_CATEGORY, section, label];

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.AutoScan.OnStartup`,
        category: cat(t("cat.scanning"), t("setting.scan.startup.name").replace("Majoor: ", "")),
        name: t("setting.scan.startup.name"),
        tooltip: t("setting.scan.startup.desc"),
        type: "boolean",
        defaultValue: !!settings.autoScan?.onStartup,
        onChange: (value) => {
            settings.autoScan = settings.autoScan || {};
            settings.autoScan.onStartup = !!value;
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("autoScan.onStartup");
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.RtHydrate.Concurrency`,
        category: cat(t("cat.scanning"), "Hydration"),
        name: "Hydrate Concurrency",
        tooltip: "Maximum concurrent hydration requests for rating/tags.",
        type: "number",
        defaultValue: Number(settings.rtHydrate?.concurrency || APP_DEFAULTS.RT_HYDRATE_CONCURRENCY || 5),
        attrs: { min: 1, max: 20, step: 1 },
        onChange: (value) => {
            settings.rtHydrate = settings.rtHydrate || {};
            settings.rtHydrate.concurrency = Math.max(
                1,
                Math.min(20, Math.round(_safeNum(value, APP_DEFAULTS.RT_HYDRATE_CONCURRENCY || 5)))
            );
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("rtHydrate.concurrency");
        },
    });

    const _clampWatcherValue = (raw, fallback, min, max) => {
        const parsed = Math.round(_safeNum(raw, fallback));
        return Math.max(min, Math.min(max, parsed));
    };

    const applyWatcherSettingsFromBackend = (payload = {}) => {
        const changed = [];
        settings.watcher = settings.watcher || {};
        if (typeof payload.debounce_ms === "number") {
            const normalized = Math.max(50, Math.min(5000, Math.round(payload.debounce_ms)));
            if (settings.watcher.debounceMs !== normalized) {
                settings.watcher.debounceMs = normalized;
                changed.push("watcher.debounceMs");
            }
        }
        if (typeof payload.dedupe_ttl_ms === "number") {
            const normalized = Math.max(100, Math.min(30000, Math.round(payload.dedupe_ttl_ms)));
            if (settings.watcher.dedupeTtlMs !== normalized) {
                settings.watcher.dedupeTtlMs = normalized;
                changed.push("watcher.dedupeTtlMs");
            }
        }
        if (!changed.length) {
            return;
        }
        saveMajoorSettings(settings);
        changed.forEach((key) => notifyApplied(key));
    };

    const syncWatcherRuntimeSettings = async () => {
        try {
            const res = await getWatcherSettings();
            if (!res?.ok) {
                return;
            }
            applyWatcherSettingsFromBackend(res.data || {});
        } catch (e) { console.debug?.(e); }
    };

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Watcher.Enabled`,
        category: cat(t("cat.scanning"), t("setting.watcher.enabled.label", "Enable watcher")),
        name: t("setting.watcher.name"),
        tooltip: t("setting.watcher.desc") + " (env: MJR_ENABLE_WATCHER)",
        type: "boolean",
        defaultValue: !!settings.watcher?.enabled,
        onChange: async (value) => {
            settings.watcher = settings.watcher || {};
            settings.watcher.enabled = !!value;
            saveMajoorSettings(settings);
            notifyApplied("watcher.enabled");
            try {
                const res = await toggleWatcher(!!value);
                if (!res?.ok) {
                    settings.watcher.enabled = !value;
                    saveMajoorSettings(settings);
                    notifyApplied("watcher.enabled");
                    comfyToast(res?.error || t("toast.failedToggleWatcher", "Failed to toggle watcher"), "error");
                }
            } catch {
                settings.watcher.enabled = !value;
                saveMajoorSettings(settings);
                notifyApplied("watcher.enabled");
            }
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Watcher.DebounceDelay`,
        category: cat(t("cat.scanning"), t("setting.watcher.debounce.label", "Watcher debounce delay")),
        name: t("setting.watcher.debounce.name"),
        tooltip: t("setting.watcher.debounce.desc") + " (env: MJR_WATCHER_DEBOUNCE_MS)",
        type: "number",
        defaultValue: settings.watcher?.debounceMs ?? APP_DEFAULTS.WATCHER_DEBOUNCE_MS,
        attrs: { min: 50, max: 5000, step: 50 },
        onChange: async (value) => {
            const fallback = APP_DEFAULTS.WATCHER_DEBOUNCE_MS;
            const clamped = _clampWatcherValue(value, fallback, 50, 5000);
            const previous = settings.watcher?.debounceMs ?? fallback;
            if (clamped === previous) return;
            settings.watcher = settings.watcher || {};
            settings.watcher.debounceMs = clamped;
            saveMajoorSettings(settings);
            try {
                const res = await updateWatcherSettings({ debounce_ms: clamped });
                if (!res?.ok) {
                    throw new Error(res?.error || t("setting.watcher.debounce.error"));
                }
                const backendValue = Math.round(Number(res?.data?.debounce_ms ?? clamped));
                settings.watcher.debounceMs = backendValue;
                saveMajoorSettings(settings);
                notifyApplied("watcher.debounceMs");
            } catch (error) {
                settings.watcher.debounceMs = previous;
                saveMajoorSettings(settings);
                notifyApplied("watcher.debounceMs");
                comfyToast(error?.message || t("setting.watcher.debounce.error"), "error");
            }
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Watcher.DedupeWindow`,
        category: cat(t("cat.scanning"), t("setting.watcher.dedupe.label", "Watcher dedupe window")),
        name: t("setting.watcher.dedupe.name"),
        tooltip: t("setting.watcher.dedupe.desc") + " (env: MJR_WATCHER_DEDUPE_TTL_MS)",
        type: "number",
        defaultValue: settings.watcher?.dedupeTtlMs ?? APP_DEFAULTS.WATCHER_DEDUPE_TTL_MS,
        attrs: { min: 100, max: 30000, step: 100 },
        onChange: async (value) => {
            const fallback = APP_DEFAULTS.WATCHER_DEDUPE_TTL_MS;
            const clamped = _clampWatcherValue(value, fallback, 100, 30000);
            const previous = settings.watcher?.dedupeTtlMs ?? fallback;
            if (clamped === previous) return;
            settings.watcher = settings.watcher || {};
            settings.watcher.dedupeTtlMs = clamped;
            saveMajoorSettings(settings);
            try {
                const res = await updateWatcherSettings({ dedupe_ttl_ms: clamped });
                if (!res?.ok) {
                    throw new Error(res?.error || t("setting.watcher.dedupe.error"));
                }
                const backendValue = Math.round(Number(res?.data?.dedupe_ttl_ms ?? clamped));
                settings.watcher.dedupeTtlMs = backendValue;
                saveMajoorSettings(settings);
                notifyApplied("watcher.dedupeTtlMs");
            } catch (error) {
                settings.watcher.dedupeTtlMs = previous;
                saveMajoorSettings(settings);
                notifyApplied("watcher.dedupeTtlMs");
                comfyToast(error?.message || t("setting.watcher.dedupe.error"), "error");
            }
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Watcher.MaxPending`,
        category: cat(t("cat.scanning"), "Watcher queue"),
        name: "Watcher: max pending files",
        tooltip: "Maximum number of pending watcher files kept in memory.",
        type: "number",
        defaultValue: Number(settings.watcher?.maxPending ?? 500),
        attrs: { min: 10, max: 5000, step: 10 },
        onChange: (value) => {
            settings.watcher = settings.watcher || {};
            settings.watcher.maxPending = Math.max(10, Math.min(5000, Math.round(_safeNum(value, 500))));
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("watcher.maxPending");
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Watcher.MinSize`,
        category: cat(t("cat.scanning"), "Watcher file size"),
        name: "Watcher: min size (bytes)",
        tooltip: "Minimum file size indexed by watcher.",
        type: "number",
        defaultValue: Number(settings.watcher?.minSize ?? 100),
        attrs: { min: 0, max: 1000000, step: 100 },
        onChange: (value) => {
            settings.watcher = settings.watcher || {};
            settings.watcher.minSize = Math.max(0, Math.min(1000000, Math.round(_safeNum(value, 100))));
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("watcher.minSize");
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Watcher.MaxSize`,
        category: cat(t("cat.scanning"), "Watcher file size"),
        name: "Watcher: max size (bytes)",
        tooltip: "Maximum file size indexed by watcher.",
        type: "number",
        defaultValue: Number(settings.watcher?.maxSize ?? 4294967296),
        attrs: { min: 100000, max: 17179869184, step: 100000 },
        onChange: (value) => {
            settings.watcher = settings.watcher || {};
            settings.watcher.maxSize = Math.max(100000, Math.min(17179869184, Math.round(_safeNum(value, 4294967296))));
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("watcher.maxSize");
        },
    });

    try {
        syncWatcherRuntimeSettings().catch(() => {});
    } catch (e) { console.debug?.(e); }

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.RatingTagsSync.Enabled`,
        category: cat(t("cat.scanning"), t("setting.sync.rating.name").replace("Majoor: ", "")),
        name: t("setting.sync.rating.name"),
        tooltip: t("setting.sync.rating.desc"),
        type: "boolean",
        defaultValue: !!settings.ratingTagsSync?.enabled,
        onChange: (value) => {
            settings.ratingTagsSync = settings.ratingTagsSync || {};
            settings.ratingTagsSync.enabled = !!value;
            saveMajoorSettings(settings);
            notifyApplied("ratingTagsSync.enabled");
        },
    });
}
