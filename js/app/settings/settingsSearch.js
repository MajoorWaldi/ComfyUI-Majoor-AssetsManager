/**
 * Settings section: Search + Environment Variables reference.
 */

import { APP_DEFAULTS } from "../config.js";
import { t } from "../i18n.js";
import { comfyToast } from "../toast.js";
import { setVectorSearchSettings } from "../../api/client.js";
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

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.AI.VectorSearchEnabled`,
        category: cat(t("cat.search", "Search"), "AI"),
        name: t("setting.ai.vector.enabled.name", "Enable AI semantic search"),
        tooltip: t(
            "setting.ai.vector.enabled.desc",
            "Enable/disable AI vector search features (SigLIP2/X-CLIP: description search, prompt alignment, AI tag suggestions, smart collections).",
        ),
        type: "boolean",
        defaultValue: !!(settings.ai?.vectorSearchEnabled ?? true),
        onChange: async (value) => {
            settings.ai = settings.ai || {};
            const previous = !!(settings.ai.vectorSearchEnabled ?? true);
            const next = !!value;
            settings.ai.vectorSearchEnabled = next;
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("ai.vectorSearchEnabled");
            try {
                const res = await setVectorSearchSettings(next);
                if (!res?.ok) {
                    settings.ai.vectorSearchEnabled = previous;
                    saveMajoorSettings(settings);
                    applySettingsToConfig(settings);
                    notifyApplied("ai.vectorSearchEnabled");
                    comfyToast(res?.error || "Failed to update AI vector search setting", "error");
                    return;
                }
                comfyToast(
                    next ? "AI semantic search enabled" : "AI semantic search disabled",
                    "info",
                    2200,
                );
            } catch (error) {
                settings.ai.vectorSearchEnabled = previous;
                saveMajoorSettings(settings);
                applySettingsToConfig(settings);
                notifyApplied("ai.vectorSearchEnabled");
                comfyToast(error?.message || "Failed to update AI vector search setting", "error");
            }
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.AI.VectorCaptionOnIndex`,
        category: cat(t("cat.search", "Search"), "AI"),
        name: t("setting.ai.vector.captionOnIndex.name", "Generate AI captions during indexing"),
        tooltip: t(
            "setting.ai.vector.captionOnIndex.desc",
            "Allow automatic vector indexing and backfill to run Florence-2 captions for image assets. This is slower and can use significant VRAM/CPU; leave it off for faster grid startup.",
        ),
        type: "boolean",
        defaultValue: !!(settings.ai?.vectorCaptionOnIndex ?? false),
        onChange: async (value) => {
            settings.ai = settings.ai || {};
            const previous = !!(settings.ai.vectorCaptionOnIndex ?? false);
            const next = !!value;
            settings.ai.vectorCaptionOnIndex = next;
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("ai.vectorCaptionOnIndex");
            try {
                const res = await setVectorSearchSettings({ caption_on_index: next });
                if (!res?.ok) {
                    settings.ai.vectorCaptionOnIndex = previous;
                    saveMajoorSettings(settings);
                    applySettingsToConfig(settings);
                    notifyApplied("ai.vectorCaptionOnIndex");
                    comfyToast(res?.error || "Failed to update AI caption indexing setting", "error");
                    return;
                }
                comfyToast(
                    next
                        ? "AI captions during indexing enabled"
                        : "AI captions during indexing disabled",
                    "info",
                    2600,
                );
            } catch (error) {
                settings.ai.vectorCaptionOnIndex = previous;
                saveMajoorSettings(settings);
                applySettingsToConfig(settings);
                notifyApplied("ai.vectorCaptionOnIndex");
                comfyToast(error?.message || "Failed to update AI caption indexing setting", "error");
            }
        },
    });

    // ------------------------
    // Search UI setting
    // ------------------------
    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Search.MaxResults`,
        category: cat(t("cat.search", "Search")),
        name: t("setting.search.maxResults.name", "Max search results (client)"),
        tooltip: t(
            "setting.search.maxResults.desc",
            "Maximum number of results requested per search. The backend still enforces MAJOOR_SEARCH_MAX_LIMIT; increase that env var if you need a higher hard cap.",
        ),
        type: "number",
        defaultValue: Number(settings.search?.maxResults || APP_DEFAULTS.SEARCH_DEFAULT_LIMIT),
        attrs: { min: 10, max: APP_DEFAULTS.MAX_PAGE_SIZE || 2000, step: 1 },
        onChange: (value) => {
            settings.search = settings.search || {};
            settings.search.maxResults = Math.max(
                10,
                Math.min(
                    APP_DEFAULTS.MAX_PAGE_SIZE || 2000,
                    Number(value) || APP_DEFAULTS.SEARCH_DEFAULT_LIMIT,
                ),
            );
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
            "MJR_AM_ENABLE_VECTOR_SEARCH — Enable AI vector/semantic search: 1|0 (default: 1)",
            "MJR_AM_VECTOR_CAPTION_ON_INDEX — Generate Florence captions during vector indexing: 1|0 (default: 0)",
            "MAJOOR_SEARCH_MAX_LIMIT — Max search results (default: 500)",
            "MAJOOR_BG_SCAN_ON_LIST — Scan on directory list: 0|1 (default: 0)",
        ].join("\n"),
        type: "text",
        defaultValue: "Hover for full list of environment variables",
    });
}
