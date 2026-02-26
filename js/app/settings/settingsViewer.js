/**
 * Settings section: Viewer (pan, WebGL, workflow minimap).
 */

import { t } from "../i18n.js";
import { saveMajoorSettings, applySettingsToConfig } from "./settingsCore.js";

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
        tooltip: "Use CPU rendering (Canvas 2D) for video playback. Fixes 'black screen' issues on incompatible hardware/browsers.",
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

    registerMinimapToggle("Enabled", "enabled", "setting.minimap.enabled.name", "setting.minimap.enabled.desc");
}
