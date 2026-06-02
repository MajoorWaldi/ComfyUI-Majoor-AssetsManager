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
import { setSettingValue } from "../comfyApiBridge.js";

import {
    loadMajoorSettings,
    saveMajoorSettings,
    applySettingsToConfig,
    syncBackendSecuritySettings,
    syncBackendVectorSearchSettings,
    syncBackendExecutionGroupingSettings,
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

const SETTINGS_NATIVE_SECTIONS = Object.freeze({
    ASSETS_PANEL: "Assets Panel",
    GENERATED_FEED: "Generated Feed",
    VIEWER: "Viewer & Floating Viewer",
    INDEXING: "Indexing & Watcher",
    SEARCH_AI: "Search & AI",
    GENERAL: "General",
    ADVANCED: "Advanced",
    SECURITY: "Security",
});

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

function settingSectionForId(id: any): string {
    const safeId = String(id || "").trim();
    if (!safeId) return SETTINGS_NATIVE_SECTIONS.GENERAL;
    if (/^Majoor\.(Safety|Security)\./.test(safeId)) {
        return SETTINGS_NATIVE_SECTIONS.SECURITY;
    }
    if (
        /^Majoor\.(Paths|ProbeBackend|MetadataFallback|Db|Observability)\./.test(safeId) ||
        safeId === "Majoor.EnvVars.Reference" ||
        safeId === "Majoor.AI.HuggingFaceTokenVisible" ||
        safeId === "Majoor.AI.HuggingFaceToken" ||
        safeId === "Majoor.AI.VerboseLogs" ||
        safeId === "Majoor.AI.VectorStats" ||
        safeId === "Majoor.AI.VectorBackfillAction"
    ) {
        return SETTINGS_NATIVE_SECTIONS.ADVANCED;
    }
    if (/^Majoor\.(Viewer|WorkflowMinimap)\./.test(safeId)) {
        return SETTINGS_NATIVE_SECTIONS.VIEWER;
    }
    if (/^Majoor\.Feed\./.test(safeId)) {
        return SETTINGS_NATIVE_SECTIONS.GENERATED_FEED;
    }
    if (/^Majoor\.(AutoScan|Scan|Watcher|ExecutionGrouping|RatingTagsSync)\./.test(safeId)) {
        return SETTINGS_NATIVE_SECTIONS.INDEXING;
    }
    if (safeId === "Majoor.RtHydrate.Concurrency") {
        return SETTINGS_NATIVE_SECTIONS.ADVANCED;
    }
    if (
        safeId === "Majoor.AI.VectorSearchEnabled" ||
        safeId === "Majoor.AI.VectorCaptionOnIndex" ||
        /^Majoor\.Search\./.test(safeId)
    ) {
        return SETTINGS_NATIVE_SECTIONS.SEARCH_AI;
    }
    if (
        /^Majoor\.(Grid|Cards|Badges|Sidebar|InfiniteScroll|General)\./.test(safeId)
    ) {
        return SETTINGS_NATIVE_SECTIONS.ASSETS_PANEL;
    }
    if (safeId === "Majoor.Language") {
        return SETTINGS_NATIVE_SECTIONS.GENERAL;
    }
    return SETTINGS_NATIVE_SECTIONS.GENERAL;
}

function normalizeComfyCategory(payload: any): string[] {
    const raw = Array.isArray(payload?.category) ? payload.category.filter(Boolean) : [];
    const section = settingSectionForId(payload?.id);
    const priorSection = String(raw[1] || raw[0] || "").trim();
    const priorLabel = String(raw[2] || "").trim();
    const name = String(payload?.name || "").replace(SETTINGS_NAME_PREFIX_RE, "").trim();
    const label = priorLabel || priorSection || name || section;
    return [SETTINGS_CATEGORY, section, label];
}

let _settingsStorageListenerBound = false;
let _settingsStorageListenerRef: any = null;
let _settingsContext: any = null;
let _settingsRuntimeInitialized = false;
const _syncingComfySettingIds = new Set();

function normalizeSettingPayload(payload: any) {
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
        normalized.category = normalizeComfyCategory(normalized);
    } catch {
        normalized.category = [SETTINGS_CATEGORY, SETTINGS_NATIVE_SECTIONS.GENERAL];
    }
    if (!normalized.tooltip && typeof normalized.name === "string" && normalized.name.trim()) {
        normalized.tooltip = normalized.name.trim();
    }
    return normalized;
}

function syncComfySettingValue(app: any, definition: any, value: any) {
    const id = String(definition?.id || "").trim();
    if (!id) return false;
    if (_syncingComfySettingIds.has(id)) return false;
    _syncingComfySettingIds.add(id);
    try {
        return setSettingValue(app, id, value);
    } finally {
        _syncingComfySettingIds.delete(id);
    }
}

function wrapSettingForComfySync(app: any, definition: any) {
    if (!definition || typeof definition !== "object") return definition;
    const wrapped = { ...definition };
    syncComfySettingValue(app, wrapped, wrapped.defaultValue);
    const originalOnChange = wrapped.onChange;
    wrapped.onChange = (value: any, ...args: any[]) => {
        syncComfySettingValue(app, wrapped, value);
        if (typeof originalOnChange === "function") {
            return originalOnChange(value, ...args);
        }
        wrapped.defaultValue = value;
        return undefined;
    };
    return wrapped;
}

function ensureMajoorSettingsContext(app: any, onApplied: any, { initRuntime = false } = {}) {
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

        const onAppliedListeners = new Set<(...args: any[]) => void>();
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

        const scheduleNotify = (key: any) => {
            if (typeof key === "string") pendingKeys.add(key);
            scheduleNotifyFlush();
        };
        const scheduleColorNotify = (key: any) => {
            if (typeof key === "string") pendingColorKeys.add(key);
            scheduleColorNotifyFlush();
        };

        const refreshFromStorage = () => {
            const latest = loadMajoorSettings();
            Object.assign(settings, latest);
            applySettingsToConfig(settings);
            scheduleNotify("storage");
        };

        const storageListener = (event: any) => {
            if (!event || event.key !== SETTINGS_KEY) return;
            if (event.newValue === event.oldValue) return;
            refreshFromStorage();
        };

        if (!_settingsStorageListenerBound) {
            // Remove stale listener from a previous init (hot-reload safety)
            if (_settingsStorageListenerRef && typeof window !== "undefined") {
                try {
                    window.removeEventListener("storage", _settingsStorageListenerRef);
                } catch (e) {
                    console.debug?.(e);
                }
            }
            try {
                window.addEventListener("storage", storageListener);
                _settingsStorageListenerBound = true;
                _settingsStorageListenerRef = storageListener;
            } catch (e) {
                console.debug?.(e);
            }
        }

        const notifyApplied = (key: any) => {
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
        void syncBackendExecutionGroupingSettings();
        if (settings?.watcher && typeof settings.watcher.enabled === "boolean") {
            void toggleWatcher(!!settings.watcher.enabled).catch(() => {});
        }
        startRuntimeStatusDashboard();
        _settingsRuntimeInitialized = true;
    }
    return _settingsContext;
}

export const registerMajoorSettings = (app: any | null | undefined, onApplied?: () => void): void => {
    const context = ensureMajoorSettingsContext(app, onApplied, { initRuntime: true });
    return context.settings;
};

export const buildMajoorSettings = (app: any | null | undefined, onApplied?: () => void): any[] => {
    const context = ensureMajoorSettingsContext(app, onApplied, { initRuntime: false });
    Object.assign(context.settings, loadMajoorSettings());

    const safeAddSetting = (payload: any) => {
        const normalized = normalizeSettingPayload(payload);
        if (normalized) {
            settingsDefinitions.push(wrapSettingForComfySync(app || context.app, normalized));
        }
    };

    const settingsDefinitions: any[] = [];
    registerGridSettings(safeAddSetting, context.settings, context.notifyApplied);
    registerFeedSettings(safeAddSetting, context.settings, context.notifyApplied);
    registerViewerSettings(safeAddSetting, context.settings, context.notifyApplied);
    registerScanningSettings(safeAddSetting, context.settings, context.notifyApplied);
    registerSecuritySettings(safeAddSetting, context.settings, context.notifyApplied);
    registerAdvancedSettings(safeAddSetting, context.settings, context.notifyApplied, app);
    registerSearchSettings(safeAddSetting, context.settings, context.notifyApplied);
    return settingsDefinitions;
};

// Best-effort backend sync (watcher status) at startup.
try {
    const settings = loadMajoorSettings();
    if (settings?.watcher && typeof settings.watcher.enabled === "boolean") {
        getWatcherStatus()
            .then((res) => {
                const enabled = !!res?.ok && !!res?.data?.enabled;
                const latest = loadMajoorSettings();
                latest.watcher = latest.watcher || {};
                if (typeof enabled === "boolean" && enabled !== !!latest.watcher.enabled) {
                    latest.watcher.enabled = enabled;
                    saveMajoorSettings(latest);
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
