/**
 * Majoor settings integration with ComfyUI settings panel.
 *
 * This module now has two separate responsibilities:
 * - initialize runtime settings side effects once
 * - build the static `settings:` extension payload used by ComfyUI_frontend
 */

import { safeDispatchCustomEvent } from "../../utils/events.js";
import { initI18n, setFollowComfyLanguage, startComfyLanguageSync } from "../i18n.js";
import { debounce } from "../../utils/debounce.js";
import { getWatcherStatus, toggleWatcher } from "../../api/client.js";

import {
    loadMajoorSettings,
    saveMajoorSettings,
    applySettingsToConfig,
    syncBackendSecuritySettings,
    syncBackendVectorSearchSettings,
} from "./settingsCore.js";
import { startRuntimeStatusDashboard } from "./settingsRuntime.js";
import { registerGridSettings } from "./settingsGrid.js";
import { registerViewerSettings } from "./settingsViewer.js";
import { registerScanningSettings } from "./settingsScanning.js";
import { registerFeedSettings } from "./settingsFeed.js";
import { registerSecuritySettings } from "./settingsSecurity.js";
import { registerAdvancedSettings } from "./settingsAdvanced.js";
import { registerSearchSettings } from "./settingsSearch.js";

import { SETTINGS_KEY } from "../settingsStore.js";

const SETTINGS_CATEGORY = "Majoor Assets Manager";
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

let _settingsStorageListenerBound = false;
let _settingsContext = null;
let _settingsDefinitions = null;
let _settingsRuntimeInitialized = false;

function normalizeSettingPayload(payload) {
    if (!payload || typeof payload !== "object") return null;
    const normalized = { ...payload };
    try {
        if (typeof normalized.name === "string") {
            normalized.name = normalized.name.replace(SETTINGS_NAME_PREFIX_RE, "").trim();
        }
    } catch (e) {
        console.debug?.(e);
    }
    try {
        const category = normalized.category;
        if (!Array.isArray(category) || String(category[0] || "") !== SETTINGS_CATEGORY) {
            normalized.category = [SETTINGS_CATEGORY];
        }
    } catch {
        normalized.category = [SETTINGS_CATEGORY];
    }
    return normalized;
}

function ensureMajoorSettingsContext(app, onApplied, { initRuntime = false } = {}) {
    if (_settingsContext) {
        if (typeof onApplied === "function") {
            _settingsContext.onAppliedListeners.add(onApplied);
        }
        if (app && !_settingsContext.app) {
            _settingsContext.app = app;
        }
    } else {
        const settings = loadMajoorSettings();
        settings.i18n = settings.i18n || {};
        if (typeof settings.i18n.followComfyLanguage !== "boolean") {
            settings.i18n.followComfyLanguage = true;
            setFollowComfyLanguage(true);
            saveMajoorSettings(settings);
        } else {
            setFollowComfyLanguage(!!settings.i18n.followComfyLanguage);
        }

        const onAppliedListeners = new Set();
        if (typeof onApplied === "function") {
            onAppliedListeners.add(onApplied);
        }

        const pendingKeys = new Set();
        const pendingColorKeys = new Set();
        const COLOR_NOTIFY_DEBOUNCE_MS = 450;

        const flushNotify = () => {
            if (!pendingKeys.size) return;
            const keys = Array.from(pendingKeys);
            pendingKeys.clear();
            for (const pendingKey of keys) {
                safeDispatchCustomEvent(
                    "mjr-settings-changed",
                    { key: pendingKey },
                    { warnPrefix: "[Majoor]" },
                );
            }
        };
        const flushColorNotify = () => {
            if (!pendingColorKeys.size) return;
            const keys = Array.from(pendingColorKeys);
            pendingColorKeys.clear();
            for (const pendingKey of keys) {
                safeDispatchCustomEvent(
                    "mjr-settings-changed",
                    { key: pendingKey },
                    { warnPrefix: "[Majoor]" },
                );
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

        if (!_settingsStorageListenerBound) {
            try {
                window.addEventListener("storage", storageListener);
                _settingsStorageListenerBound = true;
            } catch (e) {
                console.debug?.(e);
            }
        }

        const notifyApplied = (key) => {
            for (const listener of onAppliedListeners) {
                try {
                    listener(settings, key);
                } catch (e) {
                    console.debug?.(e);
                }
            }
            if (COLOR_SETTING_KEYS.has(String(key || ""))) {
                scheduleColorNotify(key);
            } else {
                scheduleNotify(key);
            }
        };

        _settingsContext = {
            app,
            notifyApplied,
            onAppliedListeners,
            refreshFromStorage,
            settings,
        };
    }
    if (initRuntime && !_settingsRuntimeInitialized) {
        const runtimeApp = app || _settingsContext.app;
        const settings = _settingsContext.settings;
        initI18n(runtimeApp);
        applySettingsToConfig(settings);
        startComfyLanguageSync(runtimeApp);
        void syncBackendSecuritySettings();
        void syncBackendVectorSearchSettings();
        startRuntimeStatusDashboard();
        try {
            const desired = !!settings?.watcher?.enabled;
            setTimeout(() => {
                toggleWatcher(desired).catch(() => {});
            }, 0);
        } catch (e) {
            console.debug?.(e);
        }
        _settingsRuntimeInitialized = true;
    }
    return _settingsContext;
}

export const registerMajoorSettings = (app, onApplied) => {
    const context = ensureMajoorSettingsContext(app, onApplied, { initRuntime: true });
    return context.settings;
};

export const buildMajoorSettings = (app, onApplied) => {
    const context = ensureMajoorSettingsContext(app, onApplied, { initRuntime: false });
    if (_settingsDefinitions) {
        return _settingsDefinitions;
    }

    const safeAddSetting = (payload) => {
        const normalized = normalizeSettingPayload(payload);
        if (normalized) {
            _settingsDefinitions.push(normalized);
        }
    };

    _settingsDefinitions = [];
    registerGridSettings(safeAddSetting, context.settings, context.notifyApplied);
    registerFeedSettings(safeAddSetting, context.settings, context.notifyApplied);
    registerViewerSettings(safeAddSetting, context.settings, context.notifyApplied);
    registerScanningSettings(safeAddSetting, context.settings, context.notifyApplied);
    registerSecuritySettings(safeAddSetting, context.settings, context.notifyApplied);
    registerAdvancedSettings(safeAddSetting, context.settings, context.notifyApplied, app);
    registerSearchSettings(safeAddSetting, context.settings, context.notifyApplied);
    return _settingsDefinitions;
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
                    safeDispatchCustomEvent(
                        "mjr-settings-changed",
                        { key: "watcher.enabled" },
                        { warnPrefix: "[Majoor]" },
                    );
                }
            })
            .catch(() => {});
    }
} catch (e) {
    console.debug?.(e);
}
