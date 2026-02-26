/**
 * Settings section: Search + Environment Variables reference.
 */

import { APP_DEFAULTS } from "../config.js";
import { t } from "../i18n.js";
import { saveMajoorSettings, applySettingsToConfig } from "./settingsCore.js";

const SETTINGS_PREFIX = "Majoor";
const SETTINGS_CATEGORY = "Majoor Assets Manager";

/**
 * Register Search settings and the Environment Variables reference entry.
 *
 * @param {Function} safeAddSetting - Wrapped addSetting function from the parent.
 * @param {object}   settings       - Live settings object (mutated on change).
 * @param {Function} notifyApplied  - Callback(key) to schedule change notifications.
 */
export function registerSearchSettings(safeAddSetting, settings, notifyApplied) {
    const cat = (section, label) => [SETTINGS_CATEGORY, section, label];

    // ------------------------
    // Search UI setting
    // ------------------------
    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Search.MaxResults`,
        category: cat(t("cat.search", "Search")),
        name: t("setting.search.maxResults.name", "Max search results (client)"),
        tooltip: t(
            "setting.search.maxResults.desc",
            "Maximum number of results requested per search. The backend still enforces MAJOOR_SEARCH_MAX_LIMIT; increase that env var if you need a higher hard cap."
        ),
        type: "number",
        defaultValue: Number(settings.search?.maxResults || APP_DEFAULTS.SEARCH_DEFAULT_LIMIT),
        attrs: { min: 10, max: APP_DEFAULTS.MAX_PAGE_SIZE || 2000, step: 1 },
        onChange: (value) => {
            settings.search = settings.search || {};
            settings.search.maxResults = Math.max(10, Math.min(APP_DEFAULTS.MAX_PAGE_SIZE || 2000, Number(value) || APP_DEFAULTS.SEARCH_DEFAULT_LIMIT));
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("search.maxResults");
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.EnvVars.Reference`,
        category: cat(t("cat.advanced"), "Environment variables"),
        name: "Environment variables reference",
        tooltip: [
            "Set these env vars before starting ComfyUI to override defaults:",
            "",
            "MAJOOR_OUTPUT_DIRECTORY — Override output root directory",
            "MAJOOR_EXIFTOOL_PATH — Path to exiftool binary",
            "MAJOOR_FFPROBE_PATH — Path to ffprobe binary",
            "MAJOOR_MEDIA_PROBE_BACKEND — Probe mode: auto|exiftool|ffprobe|both",
            "MAJOOR_EXIFTOOL_TIMEOUT — ExifTool timeout in seconds (default: 15)",
            "MAJOOR_FFPROBE_TIMEOUT — FFprobe timeout in seconds (default: 10)",
            "MAJOOR_DB_TIMEOUT — Database timeout in seconds (default: 30)",
            "MAJOOR_DB_MAX_CONNECTIONS — Max DB connections (default: 8)",
            "MAJOOR_METADATA_CACHE_MAX — Metadata cache max entries (default: 100000)",
            "MAJOOR_METADATA_EXTRACT_CONCURRENCY — Parallel metadata workers (default: 1)",
            "MJR_ENABLE_WATCHER — Enable file watcher: 1|0 (default: 1)",
            "MJR_WATCHER_DEBOUNCE_MS — Watcher debounce delay in ms (default: 3000)",
            "MJR_WATCHER_DEDUPE_TTL_MS — Watcher dedupe window in ms (default: 3000)",
            "MJR_WATCHER_MAX_FILE_SIZE_BYTES — Max file size to index (default: 512MB)",
            "MJR_WATCHER_FLUSH_MAX_FILES — Max files per flush batch (default: 256)",
            "MJR_WATCHER_PENDING_MAX — Max pending watcher queue (default: 5000)",
            "MAJOOR_SEARCH_MAX_LIMIT — Max search results (default: 500)",
            "MAJOOR_BG_SCAN_ON_LIST — Scan on directory list: 0|1 (default: 0)",
        ].join("\n"),
        type: "text",
        defaultValue: "Hover for full list of environment variables",
    });
}
