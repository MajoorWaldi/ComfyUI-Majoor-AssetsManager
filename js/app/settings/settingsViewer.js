/**
 * Settings section: Viewer (pan, WebGL, workflow minimap).
 */

import { t } from "../i18n.js";
import { APP_DEFAULTS } from "../config.js";
import { saveMajoorSettings, applySettingsToConfig } from "./settingsCore.js";
import { getLtxavRgbFallbackSettings, setLtxavRgbFallbackSettings } from "../../api/client.js";
import { comfyToast } from "../toast.js";

const SETTINGS_PREFIX = "Majoor";
const SETTINGS_CATEGORY = "Majoor Assets Manager";

/**
 * Register all Viewer-related settings.
 *
 * @param {Function} safeAddSetting - Wrapped addSetting function from the parent.
 * @param {object}   settings       - Live settings object (mutated on change).
 * @param {Function} notifyApplied  - Callback(key) to schedule change notifications.
 */
export function registerViewerSettings(safeAddSetting, settings, notifyApplied) {
    const cat = (section, label) => [SETTINGS_CATEGORY, section, label];

    // ──────────────────────────────────────────────
    // Section: Viewer
    // ──────────────────────────────────────────────

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Viewer.AllowPanAtZoom1`,
        category: cat(t("cat.viewer"), t("setting.viewer.pan.name").replace("Majoor: ", "")),
        name: t("setting.viewer.pan.name"),
        tooltip: t("setting.viewer.pan.desc"),
        type: "boolean",
        defaultValue: !!settings.viewer?.allowPanAtZoom1,
        onChange: (value) => {
            settings.viewer = settings.viewer || {};
            settings.viewer.allowPanAtZoom1 = !!value;
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("viewer.allowPanAtZoom1");
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Viewer.DisableWebGL`,
        category: cat(t("cat.viewer"), "Disable WebGL Video"),
        name: "Disable WebGL Video",
        tooltip:
            "Use CPU rendering (Canvas 2D) for video playback. Fixes 'black screen' issues on incompatible hardware/browsers.",
        type: "boolean",
        defaultValue: !!settings.viewer?.disableWebGL,
        onChange: (value) => {
            settings.viewer = settings.viewer || {};
            settings.viewer.disableWebGL = !!value;
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("viewer.disableWebGL");
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Viewer.PauseDuringExecution`,
        category: cat(t("cat.viewer"), t("setting.viewer.pauseExecution.name").replace("Majoor: ", "")),
        name: t("setting.viewer.pauseExecution.name"),
        tooltip: t("setting.viewer.pauseExecution.desc"),
        type: "boolean",
        defaultValue: !!settings.viewer?.pauseDuringExecution,
        onChange: (value) => {
            settings.viewer = settings.viewer || {};
            settings.viewer.pauseDuringExecution = !!value;
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("viewer.pauseDuringExecution");
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Viewer.FloatingPauseDuringExecution`,
        category: cat(
            t("cat.viewer"),
            t("setting.viewer.floatingPauseExecution.name").replace("Majoor: ", ""),
        ),
        name: t("setting.viewer.floatingPauseExecution.name"),
        tooltip: t("setting.viewer.floatingPauseExecution.desc"),
        type: "boolean",
        defaultValue: !!settings.viewer?.floatingPauseDuringExecution,
        onChange: (value) => {
            settings.viewer = settings.viewer || {};
            settings.viewer.floatingPauseDuringExecution = !!value;
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("viewer.floatingPauseDuringExecution");
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Viewer.MfvLiveDefault`,
        category: cat(t("cat.viewer"), t("setting.viewer.mfvLiveDefault.name").replace("Majoor: ", "")),
        name: t("setting.viewer.mfvLiveDefault.name"),
        tooltip: t("setting.viewer.mfvLiveDefault.desc"),
        type: "boolean",
        defaultValue: !!(settings.viewer?.mfvLiveDefault ?? APP_DEFAULTS.MFV_LIVE_DEFAULT),
        onChange: (value) => {
            settings.viewer = settings.viewer || {};
            settings.viewer.mfvLiveDefault = !!value;
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("viewer.mfvLiveDefault");
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Viewer.MfvPreviewDefault`,
        category: cat(
            t("cat.viewer"),
            t("setting.viewer.mfvPreviewDefault.name").replace("Majoor: ", ""),
        ),
        name: t("setting.viewer.mfvPreviewDefault.name"),
        tooltip: t("setting.viewer.mfvPreviewDefault.desc"),
        type: "boolean",
        defaultValue: !!(settings.viewer?.mfvPreviewDefault ?? APP_DEFAULTS.MFV_PREVIEW_DEFAULT),
        onChange: (value) => {
            settings.viewer = settings.viewer || {};
            settings.viewer.mfvPreviewDefault = !!value;
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("viewer.mfvPreviewDefault");
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Viewer.MfvSidebarPosition`,
        category: cat(t("cat.viewer"), "Node Parameters sidebar position"),
        name: "Node Parameters sidebar position",
        tooltip: "Position of the Node Parameters sidebar in the Floating Viewer (right, left, or bottom).",
        type: "combo",
        defaultValue: settings.viewer?.mfvSidebarPosition || "right",
        options: ["right", "left", "bottom"],
        onChange: (value) => {
            const pos = ["left", "right", "bottom"].includes(value) ? value : "right";
            settings.viewer = settings.viewer || {};
            settings.viewer.mfvSidebarPosition = pos;
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("viewer.mfvSidebarPosition");
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Viewer.MfvPreviewMethod`,
        category: cat(t("cat.viewer"), t("setting.viewer.mfvPreviewMethod.name").replace("Majoor: ", "")),
        name: t("setting.viewer.mfvPreviewMethod.name"),
        tooltip: t("setting.viewer.mfvPreviewMethod.desc"),
        type: "combo",
        defaultValue: settings.viewer?.mfvPreviewMethod || "taesd",
        options: ["taesd", "latent2rgb", "auto", "default", "none"],
        onChange: (value) => {
            const method = ["taesd", "latent2rgb", "auto", "default", "none"].includes(value)
                ? value
                : "taesd";
            settings.viewer = settings.viewer || {};
            settings.viewer.mfvPreviewMethod = method;
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("viewer.mfvPreviewMethod");
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Viewer.LtxavRgbFallback`,
        category: cat(t("cat.viewer"), "LTXAV preview fallback"),
        name: "Majoor: LTXAV RGB Preview Fallback (experimental)",
        tooltip:
            "Reuse LTXV RGB projection for LTXAV when native latent preview is unavailable. Experimental; quality may be approximate.",
        type: "boolean",
        defaultValue: !!settings.viewer?.ltxavRgbFallback,
        onChange: async (value) => {
            const next = !!value;
            const prev = !!settings.viewer?.ltxavRgbFallback;
            settings.viewer = settings.viewer || {};
            settings.viewer.ltxavRgbFallback = next;
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("viewer.ltxavRgbFallback");
            try {
                const res = await setLtxavRgbFallbackSettings(next);
                if (!res?.ok) {
                    throw new Error(
                        res?.error || "Failed to update LTXAV RGB preview fallback setting",
                    );
                }
            } catch (error) {
                settings.viewer.ltxavRgbFallback = prev;
                saveMajoorSettings(settings);
                applySettingsToConfig(settings);
                notifyApplied("viewer.ltxavRgbFallback");
                comfyToast(
                    error?.message || "Failed to update LTXAV RGB preview fallback setting",
                    "error",
                );
            }
        },
    });

    try {
        getLtxavRgbFallbackSettings()
            .then((res) => {
                if (!res?.ok) return;
                const enabled = !!res?.data?.prefs?.enabled;
                settings.viewer = settings.viewer || {};
                if (!!settings.viewer.ltxavRgbFallback !== enabled) {
                    settings.viewer.ltxavRgbFallback = enabled;
                    saveMajoorSettings(settings);
                    applySettingsToConfig(settings);
                    notifyApplied("viewer.ltxavRgbFallback");
                }
            })
            .catch(() => {});
    } catch (e) {
        console.debug?.(e);
    }

    const registerMinimapToggle = (idKey, stateKey, nameKey, descKey) => {
        safeAddSetting({
            id: `${SETTINGS_PREFIX}.WorkflowMinimap.${idKey}`,
            category: cat(t("cat.viewer"), t(nameKey).replace("Majoor: ", "")),
            name: t(nameKey),
            tooltip: t(descKey),
            type: "boolean",
            defaultValue: !!settings.workflowMinimap?.[stateKey],
            onChange: (value) => {
                settings.workflowMinimap = settings.workflowMinimap || {};
                settings.workflowMinimap[stateKey] = !!value;
                saveMajoorSettings(settings);
                notifyApplied(`workflowMinimap.${stateKey}`);
            },
        });
    };

    registerMinimapToggle(
        "Enabled",
        "enabled",
        "setting.minimap.enabled.name",
        "setting.minimap.enabled.desc",
    );
}
