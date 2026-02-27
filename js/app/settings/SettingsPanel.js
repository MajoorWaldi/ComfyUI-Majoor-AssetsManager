/**
 * Majoor settings integration with ComfyUI settings panel.
 *
 * This file is the orchestrator. It initialises i18n, applies settings to
 * APP_CONFIG, registers all ComfyUI setting entries via sub-modules, and
 * starts the runtime status dashboard.
 *
 * Sub-modules:
 *   settingsUtils.js    – pure helpers (_safeBool, deepMerge, grid presets…)
 *   settingsCore.js     – load/save/apply + DEFAULT_SETTINGS + backend sync
 *   settingsRuntime.js  – floating runtime metrics dashboard widget
 *   settingsGrid.js     – Cards + Badges + Grid + Sidebar settings
 *   settingsViewer.js   – Viewer + WorkflowMinimap settings
 *   settingsScanning.js – AutoScan + Watcher + RtHydrate + RatingTagsSync
 *   settingsSecurity.js – Safety + Security + Remote settings
 *   settingsAdvanced.js – Language + ProbeBackend + Metadata + DB + Observability
 *   settingsSearch.js   – Search + EnvVars reference
 */

import { getSettingsApi } from "../comfyApiBridge.js";
import { safeDispatchCustomEvent } from "../../utils/events.js";
import { initI18n, setFollowComfyLanguage, startComfyLanguageSync } from "../i18n.js";
import { debounce } from "../../utils/debounce.js";
import { getWatcherStatus, toggleWatcher } from "../../api/client.js";

import { loadMajoorSettings, saveMajoorSettings, applySettingsToConfig, syncBackendSecuritySettings } from "./settingsCore.js";
import { startRuntimeStatusDashboard } from "./settingsRuntime.js";
import { registerGridSettings } from "./settingsGrid.js";
import { registerViewerSettings } from "./settingsViewer.js";
import { registerScanningSettings } from "./settingsScanning.js";
import { registerSecuritySettings } from "./settingsSecurity.js";
import { registerAdvancedSettings } from "./settingsAdvanced.js";
import { registerSearchSettings } from "./settingsSearch.js";

import { SETTINGS_KEY } from "../settingsStore.js";

const SETTINGS_PREFIX = "Majoor";
const SETTINGS_CATEGORY = "Majoor Assets Manager";
const SETTINGS_REG_FLAG = "__mjrSettingsRegistered";
const SETTINGS_DEBUG_KEY = "__mjrSettingsDebug";
const SETTINGS_NAME_PREFIX_RE = /^\s*Majoor:\s*/i;

const COLOR_SETTING_KEYS = new Set([
    "grid.starColor",
    "grid.badgeImageColor",
    "grid.badgeVideoColor",
    "grid.badgeAudioColor",
    "grid.badgeModel3dColor",
    "grid.badgeDuplicateAlertColor",
    "ui.cardHoverColor",
    "ui.cardSelectionColor",
    "ui.ratingColor",
    "ui.tagColor",
]);

// Guard to prevent multiple registrations
let _settingsStorageListenerBound = false;

export const registerMajoorSettings = (app, onApplied) => {
    const settings = loadMajoorSettings();
    settings.i18n = settings.i18n || {};
    if (typeof settings.i18n.followComfyLanguage !== "boolean") {
        settings.i18n.followComfyLanguage = true;
        setFollowComfyLanguage(true);
        saveMajoorSettings(settings);
    } else {
        setFollowComfyLanguage(!!settings.i18n.followComfyLanguage);
    }
    initI18n(app);
    applySettingsToConfig(settings);
    startComfyLanguageSync(app);
    void syncBackendSecuritySettings();

    const pendingKeys = new Set();
    const pendingColorKeys = new Set();
    const COLOR_NOTIFY_DEBOUNCE_MS = 450;

    const flushNotify = () => {
        if (!pendingKeys.size) return;
        const keys = Array.from(pendingKeys);
        pendingKeys.clear();
        for (const pendingKey of keys) {
            safeDispatchCustomEvent("mjr-settings-changed", { key: pendingKey }, { warnPrefix: "[Majoor]" });
        }
    };
    const flushColorNotify = () => {
        if (!pendingColorKeys.size) return;
        const keys = Array.from(pendingColorKeys);
        pendingColorKeys.clear();
        for (const pendingKey of keys) {
            safeDispatchCustomEvent("mjr-settings-changed", { key: pendingKey }, { warnPrefix: "[Majoor]" });
        }
    };
    const scheduleNotifyFlush = debounce(flushNotify, 120);
    const scheduleColorNotifyFlush = debounce(flushColorNotify, COLOR_NOTIFY_DEBOUNCE_MS);
    const scheduleNotify = (key) => {
        if (typeof key === "string") pendingKeys.add(key);
        scheduleNotifyFlush();
    };
    const scheduleColorNotify = (key) => {
        if (typeof key === "string") pendingColorKeys.add(key);
        scheduleColorNotifyFlush();
    };

    const refreshFromStorage = () => {
        const latest = loadMajoorSettings();
        Object.assign(settings, latest);
        applySettingsToConfig(settings);
        scheduleNotify("storage");
    };

    const storageListener = (event) => {
        if (!event || event.key !== SETTINGS_KEY) return;
        if (event.newValue === event.oldValue) return;
        refreshFromStorage();
    };

    // Only add storage listener once to prevent leaks
    if (!_settingsStorageListenerBound) {
        try {
            window.addEventListener("storage", storageListener);
            _settingsStorageListenerBound = true;
        } catch (e) { console.debug?.(e); }
    }

    const tryRegister = () => {
        const settingsApi = getSettingsApi(app);
        const addSetting = settingsApi?.addSetting;
        if (typeof addSetting !== "function") {
            try {
                if (!window?.[SETTINGS_DEBUG_KEY]?.waitingLogged) {
                    console.info("[Majoor] Waiting for ComfyUI settings API...");
                    window[SETTINGS_DEBUG_KEY] = { ...(window?.[SETTINGS_DEBUG_KEY] || {}), waitingLogged: true };
                }
            } catch (e) { console.debug?.(e); }
            return false;
        }

        try {
            if (settingsApi[SETTINGS_REG_FLAG]) {
                return true;
            }
        } catch (e) { console.debug?.(e); }

        const safeAddSetting = (payload) => {
            if (!payload || typeof payload !== "object") return;
            // Normalize setting label: remove "Majoor:" prefix from all UI names.
            try {
                if (typeof payload.name === "string") {
                    payload.name = payload.name.replace(SETTINGS_NAME_PREFIX_RE, "").trim();
                }
            } catch (e) { console.debug?.(e); }
            // Enforce Majoor namespace for every setting category.
            try {
                const cat = payload.category;
                if (!Array.isArray(cat) || String(cat[0] || "") !== SETTINGS_CATEGORY) {
                    payload.category = [SETTINGS_CATEGORY];
                }
            } catch {
                payload.category = [SETTINGS_CATEGORY];
            }
            try {
                addSetting(payload);
                return;
            } catch (err1) {
                // Some ComfyUI builds reject optional attrs payloads.
                // Retry gracefully so settings remain visible.
                try {
                    const noAttrs = { ...payload };
                    delete noAttrs.attrs;
                    addSetting(noAttrs);
                    return;
                } catch (err2) {
                    try {
                        const { attrs: _attrs, ...rest } = payload;
                        if (!Array.isArray(rest.category) || String(rest.category[0] || "") !== SETTINGS_CATEGORY) {
                            rest.category = [SETTINGS_CATEGORY];
                        }
                        addSetting(rest);
                        return;
                    } catch (err3) {
                        try {
                            console.warn("[Majoor] addSetting failed", {
                                id: payload?.id,
                                name: payload?.name,
                                err1: String(err1?.message || err1 || ""),
                                err2: String(err2?.message || err2 || ""),
                                err3: String(err3?.message || err3 || ""),
                            });
                        } catch (e) { console.debug?.(e); }
                    }
                }
            }
        };

        const notifyApplied = (key) => {
            if (typeof onApplied === "function") {
                onApplied(settings, key);
            }
            if (COLOR_SETTING_KEYS.has(String(key || ""))) {
                scheduleColorNotify(key);
            } else {
                scheduleNotify(key);
            }
        };

        // ── Register all sections ──────────────────────────────────────────

        registerGridSettings(safeAddSetting, settings, notifyApplied);
        registerViewerSettings(safeAddSetting, settings, notifyApplied);
        registerScanningSettings(safeAddSetting, settings, notifyApplied);
        registerSecuritySettings(safeAddSetting, settings, notifyApplied);
        registerAdvancedSettings(safeAddSetting, settings, notifyApplied, app);
        registerSearchSettings(safeAddSetting, settings, notifyApplied);

        // ── Finalization ───────────────────────────────────────────────────

        try {
            settingsApi[SETTINGS_REG_FLAG] = true;
        } catch (e) { console.debug?.(e); }
        try {
            console.info("[Majoor] Settings registered successfully.");
            window[SETTINGS_DEBUG_KEY] = { ...(window?.[SETTINGS_DEBUG_KEY] || {}), registered: true };
        } catch (e) { console.debug?.(e); }

        return true;
    };

    if (!tryRegister()) {
        try {
            const maxAttempts = 30;
            const delayMs = 250;
            let attempts = 0;
            const tick = () => {
                attempts += 1;
                if (tryRegister()) return;
                if (attempts >= maxAttempts) {
                    try {
                        const debug = window?.[SETTINGS_DEBUG_KEY] || {};
                        if (!debug.failedLogged) {
                            console.warn(
                                "[Majoor] Failed to register settings after retries. ComfyUI settings API may be unavailable in this build."
                            );
                            window[SETTINGS_DEBUG_KEY] = { ...debug, failedLogged: true };
                        }
                    } catch (e) { console.debug?.(e); }
                    return;
                }
                setTimeout(tick, delayMs);
            };
            setTimeout(tick, delayMs);
        } catch (e) { console.debug?.(e); }
    }

    startRuntimeStatusDashboard();

    // Best-effort: apply watcher state to backend to match saved settings.
    try {
        const desired = !!settings?.watcher?.enabled;
        setTimeout(() => {
            toggleWatcher(desired).catch(() => {});
        }, 0);
    } catch (e) { console.debug?.(e); }

    return settings;
};

// Best-effort backend sync (watcher status) at startup.
try {
    const settings = loadMajoorSettings();
    if (settings?.watcher && typeof settings.watcher.enabled === "boolean") {
        getWatcherStatus()
            .then((res) => {
                const enabled = !!res?.ok && !!res?.data?.enabled;
                if (typeof enabled === "boolean" && enabled !== !!settings.watcher.enabled) {
                    settings.watcher.enabled = enabled;
                    saveMajoorSettings(settings);
                    safeDispatchCustomEvent("mjr-settings-changed", { key: "watcher.enabled" }, { warnPrefix: "[Majoor]" });
                }
            })
            .catch(() => {});
    }
} catch (e) { console.debug?.(e); }
