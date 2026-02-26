/**
 * Settings section: Safety + Security + Remote.
 */

import { setSecuritySettings } from "../../api/client.js";
import { t } from "../i18n.js";
import { _safeBool } from "./settingsUtils.js";
import { saveMajoorSettings, applySettingsToConfig, syncBackendSecuritySettings } from "./settingsCore.js";

const SETTINGS_PREFIX = "Majoor";
const SETTINGS_CATEGORY = "Majoor Assets Manager";

/**
 * Register all Security-related settings (Safety, Security toggles, Remote, API token).
 *
 * @param {Function} safeAddSetting - Wrapped addSetting function from the parent.
 * @param {object}   settings       - Live settings object (mutated on change).
 * @param {Function} notifyApplied  - Callback(key) to schedule change notifications.
 */
export function registerSecuritySettings(safeAddSetting, settings, notifyApplied) {
    const cat = (section, label) => [SETTINGS_CATEGORY, section, label];

    // ──────────────────────────────────────────────
    // Section: Security
    // ──────────────────────────────────────────────

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Safety.ConfirmDeletion`,
        category: cat(t("cat.security"), "Confirm before deleting"),
        name: "Confirm before deleting",
        tooltip: "Show a confirmation dialog before deleting files. Disabling this allows instant deletion.",
        type: "boolean",
        defaultValue: settings.safety?.confirmDeletion !== false,
        onChange: (value) => {
            settings.safety = settings.safety || {};
            settings.safety.confirmDeletion = !!value;
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("safety.confirmDeletion");
        },
    });

    const registerSecurityToggle = (key, nameKey, descKey, sectionKey = "cat.security") => {
        safeAddSetting({
            id: `${SETTINGS_PREFIX}.Security.${key}`,
            category: cat(t(sectionKey), t(nameKey).replace("Majoor: ", "")),
            name: t(nameKey),
            tooltip: t(descKey),
            type: "boolean",
            defaultValue: !!settings.security?.[key],
            onChange: (value) => {
                settings.security = settings.security || {};
                settings.security[key] = !!value;
                saveMajoorSettings(settings);
                notifyApplied(`security.${key}`);
                try {
                    const sec = settings.security || {};
                    setSecuritySettings({
                        safe_mode: _safeBool(sec.safeMode, false),
                        allow_write: _safeBool(sec.allowWrite, true),
                        allow_remote_write: _safeBool(sec.allowRemoteWrite, false),
                        allow_delete: _safeBool(sec.allowDelete, true),
                        allow_rename: _safeBool(sec.allowRename, true),
                        allow_open_in_folder: _safeBool(sec.allowOpenInFolder, true),
                        allow_reset_index: _safeBool(sec.allowResetIndex, false),
                    })
                        .then((res) => {
                            if (res?.ok && res.data?.prefs) {
                                syncBackendSecuritySettings();
                            } else if (res && res.ok === false) {
                                console.warn("[Majoor] backend security settings update failed", res.error || res);
                            }
                        })
                        .catch(() => {});
                } catch {}
            },
        });
    };

    registerSecurityToggle("safeMode", "setting.sec.safe.name", "setting.sec.safe.desc");
    registerSecurityToggle("allowWrite", "setting.sec.write.name", "setting.sec.write.desc");
    registerSecurityToggle("allowDelete", "setting.sec.del.name", "setting.sec.del.desc");
    registerSecurityToggle("allowRename", "setting.sec.ren.name", "setting.sec.ren.desc");
    registerSecurityToggle("allowOpenInFolder", "setting.sec.open.name", "setting.sec.open.desc");
    registerSecurityToggle("allowResetIndex", "setting.sec.reset.name", "setting.sec.reset.desc");

    // ──────────────────────────────────────────────
    // Section: Remote
    // ──────────────────────────────────────────────

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Security.ApiToken`,
        category: cat(t("cat.remote"), t("setting.sec.token.name").replace("Majoor: ", "")),
        name: t("setting.sec.token.name", "Majoor: API Token"),
        tooltip: t(
            "setting.sec.token.desc",
            "Store the API token used for write operations. Majoor sends it via X-MJR-Token and Authorization headers."
        ),
        type: "text",
        defaultValue: settings.security?.apiToken || "",
        attrs: {
            placeholder: t("setting.sec.token.placeholder", "Auto-generated and synced."),
        },
        onChange: (value) => {
            settings.security = settings.security || {};
            settings.security.apiToken = typeof value === "string" ? value.trim() : "";
            saveMajoorSettings(settings);
            notifyApplied("security.apiToken");
            try {
                setSecuritySettings({ api_token: settings.security.apiToken })
                    .then((res) => {
                        if (res?.ok && res.data?.prefs) {
                            syncBackendSecuritySettings();
                        } else if (res && res.ok === false) {
                            console.warn("[Majoor] backend token update failed", res.error || res);
                        }
                    })
                    .catch(() => {});
            } catch {}
        },
    });

    registerSecurityToggle(
        "allowRemoteWrite",
        "setting.sec.remote.name",
        "setting.sec.remote.desc",
        "cat.remote"
    );
}
