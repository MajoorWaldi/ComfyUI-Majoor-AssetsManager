/**
 * Settings section: Advanced (Language, ProbeBackend, MetadataFallback,
 * OutputDirectory, Database, Observability).
 */

import {
    setProbeBackendMode,
    getMetadataFallbackSettings,
    setMetadataFallbackSettings,
    getIndexDirectorySetting,
    getOutputDirectorySetting,
    setIndexDirectorySetting,
    setOutputDirectorySetting,
    vectorStats,
    vectorBackfill,
    getHuggingFaceSettings,
    setHuggingFaceSettings,
    getAiLoggingSettings,
    setAiLoggingSettings,
    getRouteLoggingSettings,
    setRouteLoggingSettings,
    getStartupLoggingSettings,
    setStartupLoggingSettings,
} from "../../api/client.js";
import { comfyToast, recordToastHistory } from "../toast.js";
import {
    t,
    initI18n,
    setLang,
    getCurrentLang,
    getSupportedLanguages,
    setFollowComfyLanguage,
} from "../i18n.js";
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

    // ── OutputDirectory ───────────────────────────────────────────────────

    let _outputDirCommittedValue = String(settings.paths?.outputDirectory || "");
    let _outputDirSaveTimer = null;
    let _outputDirSaveSeq = 0;
    let _outputDirSaveAbort = null;

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Paths.OutputDirectory`,
        category: cat(t("cat.advanced"), "Paths / Output"),
        name: "Majoor: Generation Output Directory",
        tooltip:
            "Override the ComfyUI generation output directory used by Majoor (equivalent to --output-directory). Leave empty to keep the current backend default.",
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
            } catch (e) {
                console.debug?.(e);
            }
            _outputDirSaveTimer = setTimeout(async () => {
                _outputDirSaveTimer = null;
                const seq = ++_outputDirSaveSeq;
                try {
                    _outputDirSaveAbort?.abort?.();
                } catch (e) {
                    console.debug?.(e);
                }
                _outputDirSaveAbort =
                    typeof AbortController !== "undefined" ? new AbortController() : null;
                try {
                    const res = await setOutputDirectorySetting(
                        next,
                        _outputDirSaveAbort ? { signal: _outputDirSaveAbort.signal } : {},
                    );
                    if (seq !== _outputDirSaveSeq) return;
                    if (!res?.ok) {
                        throw new Error(
                            res?.error ||
                                t(
                                    "toast.failedSetOutputDirectory",
                                    "Failed to set output directory",
                                ),
                        );
                    }
                    const serverValue = String(res?.data?.output_directory || next).trim();
                    settings.paths.outputDirectory = serverValue;
                    _outputDirCommittedValue = serverValue;
                    saveMajoorSettings(settings);
                    notifyApplied("paths.outputDirectory");
                } catch (error) {
                    if (seq !== _outputDirSaveSeq) return;
                    const aborted =
                        String(error?.name || "") === "AbortError" ||
                        String(error?.code || "") === "ABORTED";
                    if (aborted) return;
                    settings.paths.outputDirectory = _outputDirCommittedValue;
                    saveMajoorSettings(settings);
                    notifyApplied("paths.outputDirectory");
                    comfyToast(
                        error?.message ||
                            t("toast.failedSetOutputDirectory", "Failed to set output directory"),
                        "error",
                    );
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
    } catch (e) {
        console.debug?.(e);
    }

    // ── IndexDirectory ────────────────────────────────────────────────────

    let _indexDirCommittedValue = String(settings.paths?.indexDirectory || "");
    let _indexDirSaveTimer = null;
    let _indexDirSaveSeq = 0;
    let _indexDirSaveAbort = null;

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Paths.IndexDirectory`,
        category: cat(t("cat.advanced"), "Paths / Index"),
        name: "Majoor: Index Database Directory",
        tooltip:
            "Override the Majoor index database directory. Use this to keep the SQLite index on a different local disk. Requires restart.",
        type: "text",
        defaultValue: String(settings.paths?.indexDirectory || ""),
        attrs: {
            placeholder: "D:\\MajoorIndex",
        },
        onChange: async (value) => {
            const next = String(value || "").trim();
            settings.paths = settings.paths || {};
            settings.paths.indexDirectory = next;
            saveMajoorSettings(settings);

            try {
                if (_indexDirSaveTimer) {
                    clearTimeout(_indexDirSaveTimer);
                    _indexDirSaveTimer = null;
                }
            } catch (e) {
                console.debug?.(e);
            }

            _indexDirSaveTimer = setTimeout(async () => {
                _indexDirSaveTimer = null;
                const seq = ++_indexDirSaveSeq;
                try {
                    _indexDirSaveAbort?.abort?.();
                } catch (e) {
                    console.debug?.(e);
                }
                _indexDirSaveAbort =
                    typeof AbortController !== "undefined" ? new AbortController() : null;
                try {
                    const res = await setIndexDirectorySetting(
                        next,
                        _indexDirSaveAbort ? { signal: _indexDirSaveAbort.signal } : {},
                    );
                    if (seq !== _indexDirSaveSeq) return;
                    if (!res?.ok) {
                        throw new Error(
                            res?.error ||
                                t("toast.failedSetIndexDirectory", "Failed to set index directory"),
                        );
                    }
                    const serverValue = String(res?.data?.index_directory || next).trim();
                    const changed = serverValue !== _indexDirCommittedValue;
                    settings.paths.indexDirectory = serverValue;
                    _indexDirCommittedValue = serverValue;
                    saveMajoorSettings(settings);
                    notifyApplied("paths.indexDirectory");
                    if (changed) {
                        comfyToast(
                            t(
                                "toast.indexDirectorySavedRestart",
                                "Index directory saved. Restart ComfyUI to apply.",
                            ),
                            "success",
                            undefined,
                            {
                                history: {
                                    trackId: "settings:index-directory-saved",
                                },
                            },
                        );
                    }
                } catch (error) {
                    if (seq !== _indexDirSaveSeq) return;
                    const aborted =
                        String(error?.name || "") === "AbortError" ||
                        String(error?.code || "") === "ABORTED";
                    if (aborted) return;
                    settings.paths.indexDirectory = _indexDirCommittedValue;
                    saveMajoorSettings(settings);
                    notifyApplied("paths.indexDirectory");
                    comfyToast(
                        error?.message ||
                            t("toast.failedSetIndexDirectory", "Failed to set index directory"),
                        "error",
                    );
                }
            }, 700);
        },
    });

    try {
        getIndexDirectorySetting()
            .then((res) => {
                if (!res?.ok) return;
                const serverValue = String(res?.data?.index_directory || "").trim();
                settings.paths = settings.paths || {};
                if (settings.paths.indexDirectory !== serverValue) {
                    settings.paths.indexDirectory = serverValue;
                    _indexDirCommittedValue = serverValue;
                    saveMajoorSettings(settings);
                    notifyApplied("paths.indexDirectory");
                }
            })
            .catch(() => {});
    } catch (e) {
        console.debug?.(e);
    }

    // ── Language ──────────────────────────────────────────────────────────

    const languages = getSupportedLanguages();
    const langOptions = languages.map((l) => l.code);
    const languageModeOptions = ["auto", ...langOptions];
    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Language`,
        category: cat(t("cat.advanced"), t("setting.language.name", "Language")),
        name: t("setting.language.name", "Majoor: Language"),
        tooltip:
            "Use auto to detect and follow ComfyUI language. Or choose a fixed language for Majoor only.",
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
            const mode = _safeOneOf(
                value,
                ["auto", "exiftool", "ffprobe", "both"],
                DEFAULT_SETTINGS.probeBackend.mode,
            );
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
            const previous = !!(
                settings.metadataFallback?.image ?? DEFAULT_SETTINGS.metadataFallback.image
            );
            settings.metadataFallback = settings.metadataFallback || {};
            settings.metadataFallback.image = next;
            saveMajoorSettings(settings);
            notifyApplied("metadataFallback.image");
            try {
                const res = await setMetadataFallbackSettings({
                    image: next,
                    media:
                        settings.metadataFallback?.media ?? DEFAULT_SETTINGS.metadataFallback.media,
                });
                if (!res?.ok)
                    throw new Error(
                        res?.error ||
                            t(
                                "toast.failedUpdateMetadataFallback",
                                "Failed to update metadata fallback settings",
                            ),
                    );
            } catch (error) {
                settings.metadataFallback.image = previous;
                saveMajoorSettings(settings);
                notifyApplied("metadataFallback.image");
                comfyToast(
                    error?.message ||
                        t(
                            "toast.failedUpdateMetadataFallback",
                            "Failed to update metadata fallback settings",
                        ),
                    "error",
                );
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
            const previous = !!(
                settings.metadataFallback?.media ?? DEFAULT_SETTINGS.metadataFallback.media
            );
            settings.metadataFallback = settings.metadataFallback || {};
            settings.metadataFallback.media = next;
            saveMajoorSettings(settings);
            notifyApplied("metadataFallback.media");
            try {
                const res = await setMetadataFallbackSettings({
                    image:
                        settings.metadataFallback?.image ?? DEFAULT_SETTINGS.metadataFallback.image,
                    media: next,
                });
                if (!res?.ok)
                    throw new Error(
                        res?.error ||
                            t(
                                "toast.failedUpdateMetadataFallback",
                                "Failed to update metadata fallback settings",
                            ),
                    );
            } catch (error) {
                settings.metadataFallback.media = previous;
                saveMajoorSettings(settings);
                notifyApplied("metadataFallback.media");
                comfyToast(
                    error?.message ||
                        t(
                            "toast.failedUpdateMetadataFallback",
                            "Failed to update metadata fallback settings",
                        ),
                    "error",
                );
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
    } catch (e) {
        console.debug?.(e);
    }

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
            settings.db.timeoutMs = Math.max(
                1000,
                Math.min(30000, Math.round(_safeNum(value, 5000))),
            );
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
            settings.db.maxConnections = Math.max(
                1,
                Math.min(100, Math.round(_safeNum(value, 10))),
            );
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
            settings.db.queryTimeoutMs = Math.max(
                500,
                Math.min(10000, Math.round(_safeNum(value, 1000))),
            );
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

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Observability.VerboseRouteRegistrationLogs`,
        category: cat(t("cat.advanced"), "Logs"),
        name: "Majoor: Verbose route registration logs",
        tooltip:
            "When disabled, Majoor prints a compact startup summary instead of listing every registered API route. Takes effect on the next backend restart.",
        type: "boolean",
        defaultValue: !!(
            settings.observability?.verboseRouteRegistrationLogs ??
            DEFAULT_SETTINGS.observability?.verboseRouteRegistrationLogs ??
            false
        ),
        onChange: async (value) => {
            const next = !!value;
            const previous = !!(
                settings.observability?.verboseRouteRegistrationLogs ??
                DEFAULT_SETTINGS.observability?.verboseRouteRegistrationLogs ??
                false
            );
            settings.observability = settings.observability || {};
            settings.observability.verboseRouteRegistrationLogs = next;
            saveMajoorSettings(settings);
            notifyApplied("observability.verboseRouteRegistrationLogs");
            try {
                const res = await setRouteLoggingSettings(next);
                if (!res?.ok) {
                    throw new Error(res?.error || "Failed to update route logging settings");
                }
            } catch (error) {
                settings.observability.verboseRouteRegistrationLogs = previous;
                saveMajoorSettings(settings);
                notifyApplied("observability.verboseRouteRegistrationLogs");
                comfyToast(error?.message || "Failed to update route logging settings", "error");
            }
        },
    });

    (async () => {
        try {
            const res = await getRouteLoggingSettings();
            const enabled = !!res?.data?.prefs?.enabled;
            settings.observability = settings.observability || {};
            if (settings.observability.verboseRouteRegistrationLogs !== enabled) {
                settings.observability.verboseRouteRegistrationLogs = enabled;
                saveMajoorSettings(settings);
                notifyApplied("observability.verboseRouteRegistrationLogs");
            }
        } catch (e) {
            console.debug?.(e);
        }
    })();

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Observability.VerboseStartupLogs`,
        category: cat(t("cat.advanced"), "Logs"),
        name: "Majoor: Verbose startup logs",
        tooltip:
            "When disabled, Majoor suppresses most informational bootstrap logs during backend startup while keeping warnings and errors. Takes effect on the next backend restart.",
        type: "boolean",
        defaultValue: !!(
            settings.observability?.verboseStartupLogs ??
            DEFAULT_SETTINGS.observability?.verboseStartupLogs ??
            false
        ),
        onChange: async (value) => {
            const next = !!value;
            const previous = !!(
                settings.observability?.verboseStartupLogs ??
                DEFAULT_SETTINGS.observability?.verboseStartupLogs ??
                false
            );
            settings.observability = settings.observability || {};
            settings.observability.verboseStartupLogs = next;
            saveMajoorSettings(settings);
            notifyApplied("observability.verboseStartupLogs");
            try {
                const res = await setStartupLoggingSettings(next);
                if (!res?.ok) {
                    throw new Error(res?.error || "Failed to update startup logging settings");
                }
            } catch (error) {
                settings.observability.verboseStartupLogs = previous;
                saveMajoorSettings(settings);
                notifyApplied("observability.verboseStartupLogs");
                comfyToast(error?.message || "Failed to update startup logging settings", "error");
            }
        },
    });

    (async () => {
        try {
            const res = await getStartupLoggingSettings();
            const enabled = !!res?.data?.prefs?.enabled;
            settings.observability = settings.observability || {};
            if (settings.observability.verboseStartupLogs !== enabled) {
                settings.observability.verboseStartupLogs = enabled;
                saveMajoorSettings(settings);
                notifyApplied("observability.verboseStartupLogs");
            }
        } catch (e) {
            console.debug?.(e);
        }
    })();

    // ── AI / Vector Search ────────────────────────────────────────────────

    {
        const hfCategoryLabel = "HuggingFace Token";
        let _hfTokenCommittedValue = "";
        let _hfTokenSaveTimer = null;
        let _hfTokenSaveSeq = 0;
        let _hfTokenVisible = !!settings.ai?.huggingFaceTokenVisible;

        const _applyHfTokenVisibility = () => {
            try {
                const inputs = Array.from(
                    document.querySelectorAll('input[data-mjr-hf-token="1"]'),
                );
                for (const el of inputs) {
                    try {
                        el.type = _hfTokenVisible ? "text" : "password";
                    } catch (e) {
                        console.debug?.(e);
                    }
                }
            } catch (e) {
                console.debug?.(e);
            }
        };

        const _applyHfTokenPlaceholder = (placeholderText) => {
            try {
                const value = String(placeholderText || "").trim();
                if (!value) return;
                const inputs = Array.from(
                    document.querySelectorAll('input[data-mjr-hf-token="1"]'),
                );
                for (const el of inputs) {
                    try {
                        el.placeholder = value;
                    } catch (e) {
                        console.debug?.(e);
                    }
                }
            } catch (e) {
                console.debug?.(e);
            }
        };

        safeAddSetting({
            id: `${SETTINGS_PREFIX}.AI.HuggingFaceTokenVisible`,
            category: cat(t("cat.advanced"), hfCategoryLabel),
            name: "Show HuggingFace token",
            tooltip: "Show or hide the HuggingFace token while editing.",
            type: "boolean",
            defaultValue: _hfTokenVisible,
            onChange: (value) => {
                const next = !!value;
                _hfTokenVisible = next;
                settings.ai = settings.ai || {};
                settings.ai.huggingFaceTokenVisible = next;
                saveMajoorSettings(settings);
                notifyApplied("ai.huggingFaceTokenVisible");
                setTimeout(_applyHfTokenVisibility, 0);
            },
        });

        safeAddSetting({
            id: `${SETTINGS_PREFIX}.AI.HuggingFaceToken`,
            category: cat(t("cat.advanced"), hfCategoryLabel),
            name: "HuggingFace Token",
            tooltip: [
                "Optional token for HuggingFace Hub downloads (higher rate limits).",
                "Saved server-side and used by CLIP model loading.",
                "Leave empty to clear the stored token.",
            ].join("\n"),
            type: "text",
            defaultValue: "",
            attrs: {
                placeholder: "Paste HuggingFace token (hf_...)",
                type: _hfTokenVisible ? "text" : "password",
                autocomplete: "new-password",
                name: "mjr_huggingface_token",
                "data-mjr-hf-token": "1",
            },
            onChange: (value) => {
                const next = String(value || "").trim();
                // Ignore no-op updates to avoid repeated API calls/toasts when settings UI rebinds.
                if (next === _hfTokenCommittedValue) return;
                try {
                    if (_hfTokenSaveTimer) {
                        clearTimeout(_hfTokenSaveTimer);
                        _hfTokenSaveTimer = null;
                    }
                } catch (e) {
                    console.debug?.(e);
                }

                _hfTokenSaveTimer = setTimeout(async () => {
                    _hfTokenSaveTimer = null;
                    const seq = ++_hfTokenSaveSeq;
                    try {
                        const res = await setHuggingFaceSettings(next);
                        if (seq !== _hfTokenSaveSeq) return;
                        if (!res?.ok) {
                            throw new Error(res?.error || "Failed to update HuggingFace token");
                        }
                        _hfTokenCommittedValue = next;
                        notifyApplied("ai.huggingFaceToken");
                        if (next) {
                            comfyToast("HuggingFace token saved", "success");
                        } else {
                            // Keep UX feedback but don't pollute Message Center history.
                            comfyToast("HuggingFace token cleared", "success", undefined, {
                                noHistory: true,
                            });
                        }
                    } catch (error) {
                        if (seq !== _hfTokenSaveSeq) return;
                        comfyToast(error?.message || "Failed to update HuggingFace token", "error");
                    }
                }, 900);
            },
        });

        setTimeout(_applyHfTokenVisibility, 0);

        (async () => {
            try {
                const res = await getHuggingFaceSettings();
                const prefs = res?.data?.prefs || {};
                const hasToken = !!prefs?.has_token;
                const tokenHint = String(prefs?.token_hint || "").trim();
                const placeholder = hasToken
                    ? `Configured ${tokenHint || "(saved)"}`
                    : "Paste HuggingFace token (hf_...)";
                _applyHfTokenPlaceholder(placeholder);
            } catch (e) {
                console.debug?.(e);
            }
        })();

        safeAddSetting({
            id: `${SETTINGS_PREFIX}.AI.VerboseLogs`,
            category: cat(t("cat.advanced"), hfCategoryLabel),
            name: "Majoor: Verbose AI logs",
            tooltip:
                "Enable detailed HuggingFace/SigLIP2/X-CLIP logs and progress bars during model download/loading.",
            type: "boolean",
            defaultValue: !!(
                settings.ai?.verboseAiLogs ??
                DEFAULT_SETTINGS.ai?.verboseAiLogs ??
                false
            ),
            onChange: async (value) => {
                const next = !!value;
                const previous = !!(
                    settings.ai?.verboseAiLogs ??
                    DEFAULT_SETTINGS.ai?.verboseAiLogs ??
                    false
                );
                settings.ai = settings.ai || {};
                settings.ai.verboseAiLogs = next;
                saveMajoorSettings(settings);
                notifyApplied("ai.verboseAiLogs");
                try {
                    const res = await setAiLoggingSettings(next);
                    if (!res?.ok)
                        throw new Error(res?.error || "Failed to update AI logging settings");
                } catch (error) {
                    settings.ai.verboseAiLogs = previous;
                    saveMajoorSettings(settings);
                    notifyApplied("ai.verboseAiLogs");
                    comfyToast(error?.message || "Failed to update AI logging settings", "error");
                }
            },
        });

        (async () => {
            try {
                const res = await getAiLoggingSettings();
                const enabled = !!res?.data?.prefs?.enabled;
                settings.ai = settings.ai || {};
                if (settings.ai.verboseAiLogs !== enabled) {
                    settings.ai.verboseAiLogs = enabled;
                    saveMajoorSettings(settings);
                    notifyApplied("ai.verboseAiLogs");
                }
            } catch (e) {
                console.debug?.(e);
            }
        })();
    }

    // Vector status field must be registered synchronously so it never disappears
    // when async calls fail or time out during startup.
    safeAddSetting({
        id: `${SETTINGS_PREFIX}.AI.VectorStats`,
        category: cat(t("cat.advanced"), "AI / Vector Search"),
        name: "Vector Index Status",
        tooltip: "Current status of the SigLIP2/X-CLIP vector index used for semantic search",
        type: "text",
        defaultValue: "Loading vector status...",
    });

    // Fetch status in the background (best effort).
    (async () => {
        try {
            const stats = await vectorStats();
            if (stats?.ok) {
                console.debug?.(
                    "[Majoor] Vector status:",
                    `${stats.data?.total || 0} assets indexed | Model: ${stats.data?.model || "N/A"}`,
                );
            } else {
                console.debug?.("[Majoor] Vector status unavailable");
            }
        } catch (err) {
            console.debug?.("[Majoor] Vector status fetch failed", err);
        }
    })();

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.AI.VectorBackfillAction`,
        category: cat(t("cat.advanced"), "AI / Vector Search"),
        name: "Vector Index Action",
        tooltip: [
            "Compute CLIP embeddings for all assets that don't have them yet.",
            "This is required for AI semantic search to work.",
            "",
            "Choose 'Run backfill now' to start indexing.",
            "This may take several minutes for large libraries.",
            "",
            "Note: New assets are indexed automatically during scanning.",
        ].join("\n"),
        type: "combo",
        defaultValue: "Idle",
        options: ["Idle", "Run backfill now"],
        onChange: async (value) => {
            if (String(value || "") !== "Run backfill now") return;

            const historyBase = {
                history: {
                    trackId: "vector-backfill:advanced-settings",
                    title: "Vector Backfill",
                    source: "all",
                    operation: "vector_backfill",
                    forceStore: true,
                },
            };

            try {
                comfyToast(
                    t(
                        "toast.vectorBackfillStarting",
                        "Starting vector backfill... This may take a while.",
                    ),
                    "info",
                    undefined,
                    {
                        history: {
                            ...historyBase.history,
                            status: "started",
                            detail: "Starting vector backfill... This may take a while.",
                        },
                    },
                );
                const result = await vectorBackfill(64, {
                    onProgress: (payload) => {
                        const status =
                            String(payload?.status || "running").toLowerCase() || "running";
                        const progress = payload?.progress || payload?.result || {};
                        const candidates = Number(progress?.candidates ?? progress?.processed ?? 0);
                        const indexed = Number(progress?.indexed ?? 0);
                        const skipped = Number(progress?.skipped ?? 0);
                        const errors = Number(progress?.errors ?? 0);
                        const total = Math.max(candidates, indexed + skipped + errors);
                        const percent =
                            total > 0
                                ? Math.round(((indexed + skipped + errors) / total) * 100)
                                : null;
                        const detail =
                            status === "queued"
                                ? "Vector backfill queued"
                                : `Candidates ${candidates}, indexed ${indexed}, skipped ${skipped}, errors ${errors}`;
                        recordToastHistory(
                            { summary: "Vector Backfill", detail },
                            status === "failed"
                                ? "error"
                                : status === "succeeded"
                                  ? "success"
                                  : "info",
                            0,
                            {
                                history: {
                                    ...historyBase.history,
                                    status,
                                    detail,
                                    progress: {
                                        current: indexed + skipped + errors,
                                        total,
                                        percent,
                                        indexed,
                                        skipped,
                                        errors,
                                        label: status,
                                    },
                                },
                            },
                        );
                    },
                });

                if (result?.ok) {
                    const data = result.data || {};
                    const state = String(data?.status || "").toLowerCase();
                    const pending =
                        !!data?.pending || ["queued", "running", "pending"].includes(state);
                    const progress = data?.progress || {};
                    const processed = Number(data?.processed ?? progress?.candidates ?? 0);
                    const indexed = Number(data?.indexed ?? progress?.indexed ?? 0);
                    const skipped = Number(data?.skipped ?? progress?.skipped ?? 0);
                    if (pending) {
                        const jobId = String(data?.job_id || "").trim();
                        comfyToast(
                            t(
                                "toast.vectorBackfillRunning",
                                "Vector backfill still running in background{job}.",
                                { job: jobId ? ` (job ${jobId.slice(0, 8)})` : "" },
                            ),
                            "info",
                            undefined,
                            {
                                history: {
                                    ...historyBase.history,
                                    status: "running",
                                    detail: `Vector backfill still running in background${jobId ? ` (${jobId.slice(0, 8)})` : ""}.`,
                                    progress: {
                                        current: indexed + skipped,
                                        total: Math.max(processed, indexed + skipped),
                                        percent:
                                            Math.max(processed, indexed + skipped) > 0
                                                ? Math.round(
                                                      ((indexed + skipped) /
                                                          Math.max(processed, indexed + skipped)) *
                                                          100,
                                                  )
                                                : null,
                                        indexed,
                                        skipped,
                                        label: "running",
                                    },
                                },
                            },
                        );
                    } else {
                        const msg = t(
                            "toast.vectorBackfillComplete",
                            "Vector backfill complete! Processed: {processed}, Indexed: {indexed}, Skipped: {skipped}",
                            { processed, indexed, skipped },
                        );
                        comfyToast(msg, "success", undefined, {
                            history: {
                                ...historyBase.history,
                                status: "succeeded",
                                detail: `Processed ${processed}, indexed ${indexed}, skipped ${skipped}`,
                                progress: {
                                    current: processed,
                                    total: processed,
                                    percent: processed > 0 ? 100 : null,
                                    indexed,
                                    skipped,
                                    label: "done",
                                },
                            },
                        });
                    }
                    try {
                        const stats = await vectorStats();
                        if (stats?.ok) {
                            console.debug?.("[Majoor] Vector stats after backfill:", stats.data);
                        }
                    } catch (statsErr) {
                        console.debug?.("[Majoor] Failed to refresh vector stats:", statsErr);
                    }
                } else {
                    throw new Error(
                        result?.error || t("toast.vectorBackfillFailedGeneric", "Backfill failed"),
                    );
                }
            } catch (error) {
                const errMsg = error?.message || String(error || t("status.unknown", "unknown"));
                comfyToast(
                    t("toast.vectorBackfillFailedDetail", "Vector backfill failed: {error}", {
                        error: errMsg,
                    }),
                    "error",
                    undefined,
                    {
                        history: {
                            ...historyBase.history,
                            status: "failed",
                            detail: errMsg,
                        },
                    },
                );
                console.error("[Majoor] Vector backfill error:", error);
            }
        },
    });
}
