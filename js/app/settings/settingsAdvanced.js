/**
 * Settings section: Advanced (Language, ProbeBackend, MetadataFallback,
 * OutputDirectory, Database, Observability).
 */

import { APP_DEFAULTS } from "../config.js";
import {
    setProbeBackendMode,
    getMetadataFallbackSettings,
    setMetadataFallbackSettings,
    getOutputDirectorySetting,
    setOutputDirectorySetting,
} from "../../api/client.js";
import { comfyToast } from "../toast.js";
import { t, initI18n, setLang, getCurrentLang, getSupportedLanguages, setFollowComfyLanguage } from "../i18n.js";
import { _safeNum, _safeOneOf } from "./settingsUtils.js";
import { DEFAULT_SETTINGS, saveMajoorSettings, applySettingsToConfig } from "./settingsCore.js";

const SETTINGS_PREFIX = "Majoor";
const SETTINGS_CATEGORY = "Majoor Assets Manager";

/**
 * Register all Advanced settings.
 *
 * @param {Function} safeAddSetting - Wrapped addSetting function from the parent.
 * @param {object}   settings       - Live settings object (mutated on change).
 * @param {Function} notifyApplied  - Callback(key) to schedule change notifications.
 * @param {object}   app            - ComfyUI app reference (needed for initI18n).
 */
export function registerAdvancedSettings(safeAddSetting, settings, notifyApplied, app) {
    const cat = (section, label) => [SETTINGS_CATEGORY, section, label];

    // ── Language ──────────────────────────────────────────────────────────

    const languages = getSupportedLanguages();
    const langOptions = languages.map(l => l.code);
    const languageModeOptions = ["auto", ...langOptions];
    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Language`,
        category: cat(t("cat.advanced"), t("setting.language.name", "Language")),
        name: t("setting.language.name", "Majoor: Language"),
        tooltip: "Use auto to detect and follow ComfyUI language. Or choose a fixed language for Majoor only.",
        type: "combo",
        defaultValue: settings.i18n?.followComfyLanguage ? "auto" : getCurrentLang(),
        options: languageModeOptions,
        onChange: (value) => {
            settings.i18n = settings.i18n || {};
            if (value === "auto") {
                settings.i18n.followComfyLanguage = true;
                setFollowComfyLanguage(true);
                initI18n(app);
                saveMajoorSettings(settings);
                notifyApplied("language");
                return;
            }
            if (!langOptions.includes(value)) return;
            settings.i18n.followComfyLanguage = false;
            setFollowComfyLanguage(false);
            setLang(value);
            saveMajoorSettings(settings);
            notifyApplied("language");
        },
    });

    // ── ProbeBackend ──────────────────────────────────────────────────────

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.ProbeBackend.Mode`,
        category: cat(t("cat.advanced"), t("setting.probe.mode.name").replace("Majoor: ", "")),
        name: t("setting.probe.mode.name"),
        tooltip: t("setting.probe.mode.desc") + " (env: MAJOOR_MEDIA_PROBE_BACKEND)",
        type: "combo",
        defaultValue: settings.probeBackend?.mode || DEFAULT_SETTINGS.probeBackend.mode,
        options: ["auto", "exiftool", "ffprobe", "both"],
        onChange: (value) => {
            const mode = _safeOneOf(value, ["auto", "exiftool", "ffprobe", "both"], DEFAULT_SETTINGS.probeBackend.mode);
            settings.probeBackend = settings.probeBackend || {};
            settings.probeBackend.mode = mode;
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("probeBackend.mode");
            setProbeBackendMode(mode).catch(() => {});
        },
    });

    // ── MetadataFallback ──────────────────────────────────────────────────

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.MetadataFallback.Image`,
        category: cat(t("cat.advanced"), "Metadata"),
        name: "Majoor: Metadata Fallback (Images)",
        tooltip: "Enable Pillow fallback when ExifTool is missing or fails.",
        type: "boolean",
        defaultValue: settings.metadataFallback?.image ?? DEFAULT_SETTINGS.metadataFallback.image,
        onChange: async (value) => {
            const next = !!value;
            const previous = !!(settings.metadataFallback?.image ?? DEFAULT_SETTINGS.metadataFallback.image);
            settings.metadataFallback = settings.metadataFallback || {};
            settings.metadataFallback.image = next;
            saveMajoorSettings(settings);
            notifyApplied("metadataFallback.image");
            try {
                const res = await setMetadataFallbackSettings({
                    image: next,
                    media: settings.metadataFallback?.media ?? DEFAULT_SETTINGS.metadataFallback.media,
                });
                if (!res?.ok) throw new Error(res?.error || "Failed to update metadata fallback settings");
            } catch (error) {
                settings.metadataFallback.image = previous;
                saveMajoorSettings(settings);
                notifyApplied("metadataFallback.image");
                comfyToast(error?.message || "Failed to update metadata fallback settings", "error");
            }
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.MetadataFallback.Media`,
        category: cat(t("cat.advanced"), "Metadata"),
        name: "Majoor: Metadata Fallback (Audio/Video)",
        tooltip: "Enable hachoir fallback when ffprobe is missing or fails.",
        type: "boolean",
        defaultValue: settings.metadataFallback?.media ?? DEFAULT_SETTINGS.metadataFallback.media,
        onChange: async (value) => {
            const next = !!value;
            const previous = !!(settings.metadataFallback?.media ?? DEFAULT_SETTINGS.metadataFallback.media);
            settings.metadataFallback = settings.metadataFallback || {};
            settings.metadataFallback.media = next;
            saveMajoorSettings(settings);
            notifyApplied("metadataFallback.media");
            try {
                const res = await setMetadataFallbackSettings({
                    image: settings.metadataFallback?.image ?? DEFAULT_SETTINGS.metadataFallback.image,
                    media: next,
                });
                if (!res?.ok) throw new Error(res?.error || "Failed to update metadata fallback settings");
            } catch (error) {
                settings.metadataFallback.media = previous;
                saveMajoorSettings(settings);
                notifyApplied("metadataFallback.media");
                comfyToast(error?.message || "Failed to update metadata fallback settings", "error");
            }
        },
    });

    try {
        getMetadataFallbackSettings()
            .then((res) => {
                if (!res?.ok || !res?.data?.prefs) return;
                const prefs = res.data.prefs || {};
                const image = !!(prefs.image ?? DEFAULT_SETTINGS.metadataFallback.image);
                const media = !!(prefs.media ?? DEFAULT_SETTINGS.metadataFallback.media);
                settings.metadataFallback = settings.metadataFallback || {};
                let changed = false;
                if (settings.metadataFallback.image !== image) {
                    settings.metadataFallback.image = image;
                    changed = true;
                }
                if (settings.metadataFallback.media !== media) {
                    settings.metadataFallback.media = media;
                    changed = true;
                }
                if (changed) {
                    saveMajoorSettings(settings);
                    notifyApplied("metadataFallback");
                }
            })
            .catch(() => {});
    } catch (e) { console.debug?.(e); }

    // ── OutputDirectory ───────────────────────────────────────────────────

    let _outputDirCommittedValue = String(settings.paths?.outputDirectory || "");
    let _outputDirSaveTimer = null;
    let _outputDirSaveSeq = 0;
    let _outputDirSaveAbort = null;

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Paths.OutputDirectory`,
        category: cat(t("cat.advanced"), "Paths"),
        name: "Majoor: Output Directory Override",
        tooltip: "Override ComfyUI output directory used by Majoor (equivalent to --output-directory). Leave empty to keep current backend default.",
        type: "text",
        defaultValue: String(settings.paths?.outputDirectory || ""),
        attrs: {
            placeholder: "D:\\\\____COMFY_OUTPUTS",
        },
        onChange: async (value) => {
            const next = String(value || "").trim();
            settings.paths = settings.paths || {};
            settings.paths.outputDirectory = next;
            saveMajoorSettings(settings);

            // The Comfy settings text input can fire on each keystroke.
            // Debounce + cancel in-flight requests to prevent backend/UI stalls.
            try {
                if (_outputDirSaveTimer) {
                    clearTimeout(_outputDirSaveTimer);
                    _outputDirSaveTimer = null;
                }
            } catch (e) { console.debug?.(e); }
            _outputDirSaveTimer = setTimeout(async () => {
                _outputDirSaveTimer = null;
                const seq = ++_outputDirSaveSeq;
                try {
                    _outputDirSaveAbort?.abort?.();
                } catch (e) { console.debug?.(e); }
                _outputDirSaveAbort = typeof AbortController !== "undefined" ? new AbortController() : null;
                try {
                    const res = await setOutputDirectorySetting(
                        next,
                        _outputDirSaveAbort ? { signal: _outputDirSaveAbort.signal } : {}
                    );
                    if (seq !== _outputDirSaveSeq) return;
                    if (!res?.ok) {
                        throw new Error(res?.error || "Failed to set output directory");
                    }
                    const serverValue = String(res?.data?.output_directory || next).trim();
                    settings.paths.outputDirectory = serverValue;
                    _outputDirCommittedValue = serverValue;
                    saveMajoorSettings(settings);
                    notifyApplied("paths.outputDirectory");
                } catch (error) {
                    if (seq !== _outputDirSaveSeq) return;
                    const aborted = String(error?.name || "") === "AbortError" || String(error?.code || "") === "ABORTED";
                    if (aborted) return;
                    settings.paths.outputDirectory = _outputDirCommittedValue;
                    saveMajoorSettings(settings);
                    notifyApplied("paths.outputDirectory");
                    comfyToast(error?.message || "Failed to set output directory", "error");
                }
            }, 700);
        },
    });

    try {
        getOutputDirectorySetting()
            .then((res) => {
                if (!res?.ok) return;
                const serverValue = String(res?.data?.output_directory || "").trim();
                settings.paths = settings.paths || {};
                if (settings.paths.outputDirectory !== serverValue) {
                    settings.paths.outputDirectory = serverValue;
                    _outputDirCommittedValue = serverValue;
                    saveMajoorSettings(settings);
                    notifyApplied("paths.outputDirectory");
                }
            })
            .catch(() => {});
    } catch (e) { console.debug?.(e); }

    // ── Database ──────────────────────────────────────────────────────────

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Db.Timeout`,
        category: cat(t("cat.advanced"), "Database"),
        name: "DB Timeout (ms)",
        tooltip: "Client-side DB timeout preference (stored locally).",
        type: "number",
        defaultValue: Number(settings.db?.timeoutMs || 5000),
        attrs: { min: 1000, max: 30000, step: 1000 },
        onChange: (value) => {
            settings.db = settings.db || {};
            settings.db.timeoutMs = Math.max(1000, Math.min(30000, Math.round(_safeNum(value, 5000))));
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("db.timeoutMs");
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Db.MaxConnections`,
        category: cat(t("cat.advanced"), "Database"),
        name: "DB Max Connections",
        tooltip: "Client-side DB max connections preference (stored locally).",
        type: "number",
        defaultValue: Number(settings.db?.maxConnections || 10),
        attrs: { min: 1, max: 100, step: 1 },
        onChange: (value) => {
            settings.db = settings.db || {};
            settings.db.maxConnections = Math.max(1, Math.min(100, Math.round(_safeNum(value, 10))));
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("db.maxConnections");
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Db.QueryTimeout`,
        category: cat(t("cat.advanced"), "Database"),
        name: "DB Query Timeout (ms)",
        tooltip: "Client-side DB query timeout preference (stored locally).",
        type: "number",
        defaultValue: Number(settings.db?.queryTimeoutMs || 1000),
        attrs: { min: 500, max: 10000, step: 500 },
        onChange: (value) => {
            settings.db = settings.db || {};
            settings.db.queryTimeoutMs = Math.max(500, Math.min(10000, Math.round(_safeNum(value, 1000))));
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("db.queryTimeoutMs");
        },
    });

    // ── Observability ─────────────────────────────────────────────────────

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Observability.Enabled`,
        category: cat(t("cat.advanced"), t("setting.obs.enabled.name").replace("Majoor: ", "")),
        name: t("setting.obs.enabled.name"),
        tooltip: t("setting.obs.enabled.desc"),
        type: "boolean",
        defaultValue: !!settings.observability?.enabled,
        onChange: (value) => {
            settings.observability = settings.observability || {};
            settings.observability.enabled = !!value;
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("observability.enabled");
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Observability.VerboseErrors`,
        category: cat(t("cat.advanced"), "Verbose error logging"),
        name: "Verbose error logging",
        tooltip: "Show detailed error messages in toasts and console. Useful for debugging.",
        type: "boolean",
        defaultValue: !!settings.observability?.verboseErrors,
        onChange: (value) => {
            settings.observability = settings.observability || {};
            settings.observability.verboseErrors = !!value;
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("observability.verboseErrors");
        },
    });
}
