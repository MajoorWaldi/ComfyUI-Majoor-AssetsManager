/**
 * Core settings persistence and config application.
 * Handles load/save from SettingsStore and application to APP_CONFIG.
 */

import { APP_CONFIG, APP_DEFAULTS } from "../config.js";
import { getSecuritySettings, setSecuritySettings, bootstrapSecurityToken } from "../../api/client.js";
import { safeDispatchCustomEvent } from "../../utils/events.js";
import { SettingsStore } from "./SettingsStore.js";
import { SETTINGS_KEY, SETTINGS_SCHEMA_VERSION } from "../settingsStore.js";
import { _safeBool, _safeNum, deepMerge, resolveGridMinSize } from "./settingsUtils.js";

// ─── Default settings ─────────────────────────────────────────────────────

export const DEFAULT_SETTINGS = {
    debug: {
        safeCall: APP_DEFAULTS.DEBUG_SAFE_CALL,
        safeListeners: APP_DEFAULTS.DEBUG_SAFE_LISTENERS,
        viewer: APP_DEFAULTS.DEBUG_VIEWER,
    },
    grid: {
        pageSize: APP_DEFAULTS.DEFAULT_PAGE_SIZE,
        minSize: APP_DEFAULTS.GRID_MIN_SIZE,
        minSizePreset: "medium",
        gap: APP_DEFAULTS.GRID_GAP,
        showExtBadge: APP_DEFAULTS.GRID_SHOW_BADGES_EXTENSION,
        showRatingBadge: APP_DEFAULTS.GRID_SHOW_BADGES_RATING,
        showTagsBadge: APP_DEFAULTS.GRID_SHOW_BADGES_TAGS,
        showDetails: APP_DEFAULTS.GRID_SHOW_DETAILS,
        showFilename: APP_DEFAULTS.GRID_SHOW_DETAILS_FILENAME,
        showDate: APP_DEFAULTS.GRID_SHOW_DETAILS_DATE,
        showDimensions: APP_DEFAULTS.GRID_SHOW_DETAILS_DIMENSIONS,
        showGenTime: APP_DEFAULTS.GRID_SHOW_DETAILS_GENTIME,
        showWorkflowDot: APP_DEFAULTS.GRID_SHOW_WORKFLOW_DOT,
        videoAutoplayMode: APP_DEFAULTS.GRID_VIDEO_AUTOPLAY_MODE,
        starColor: APP_DEFAULTS.BADGE_STAR_COLOR,
        badgeImageColor: APP_DEFAULTS.BADGE_IMAGE_COLOR,
        badgeVideoColor: APP_DEFAULTS.BADGE_VIDEO_COLOR,
        badgeAudioColor: APP_DEFAULTS.BADGE_AUDIO_COLOR,
        badgeModel3dColor: APP_DEFAULTS.BADGE_MODEL3D_COLOR,
        badgeDuplicateAlertColor: APP_DEFAULTS.BADGE_DUPLICATE_ALERT_COLOR,
    },
    infiniteScroll: {
        enabled: APP_DEFAULTS.INFINITE_SCROLL_ENABLED,
        rootMargin: APP_DEFAULTS.INFINITE_SCROLL_ROOT_MARGIN,
        threshold: APP_DEFAULTS.INFINITE_SCROLL_THRESHOLD,
        bottomGapPx: APP_DEFAULTS.BOTTOM_GAP_PX,
    },
    siblings: {
        hidePngSiblings: true,
    },
    autoScan: {
        onStartup: APP_DEFAULTS.AUTO_SCAN_ON_STARTUP,
    },
    watcher: {
        enabled: true,
        debounceMs: APP_DEFAULTS.WATCHER_DEBOUNCE_MS,
        dedupeTtlMs: APP_DEFAULTS.WATCHER_DEDUPE_TTL_MS,
        maxPending: 500,
        minSize: 100,
        maxSize: 4294967296,
    },
    safety: {
        confirmDeletion: true,
    },
    status: {
        pollInterval: APP_DEFAULTS.STATUS_POLL_INTERVAL,
    },
    viewer: {
        allowPanAtZoom1: APP_DEFAULTS.VIEWER_ALLOW_PAN_AT_ZOOM_1,
        disableWebGL: APP_DEFAULTS.VIEWER_DISABLE_WEBGL_VIDEO,
        videoGradeThrottleFps: APP_DEFAULTS.VIEWER_VIDEO_GRADE_THROTTLE_FPS,
        scopesFps: APP_DEFAULTS.VIEWER_SCOPES_FPS,
        metaTtlMs: APP_DEFAULTS.VIEWER_META_TTL_MS,
        metaMaxEntries: APP_DEFAULTS.VIEWER_META_MAX_ENTRIES,
    },
    rtHydrate: {
        concurrency: APP_DEFAULTS.RT_HYDRATE_CONCURRENCY,
        queueMax: APP_DEFAULTS.RT_HYDRATE_QUEUE_MAX,
        seenMax: APP_DEFAULTS.RT_HYDRATE_SEEN_MAX,
        pruneBudget: APP_DEFAULTS.RT_HYDRATE_PRUNE_BUDGET,
        seenTtlMs: APP_DEFAULTS.RT_HYDRATE_SEEN_TTL_MS,
    },
    observability: {
        enabled: false,
        verboseErrors: false,
    },
    sidebar: {
        position: "right",
        showPreviewThumb: true,
        widthPx: 360,
    },
    probeBackend: {
        mode: "auto",
    },
    i18n: {
        followComfyLanguage: true,
    },
    metadataFallback: {
        image: true,
        media: true,
    },
    paths: {
        outputDirectory: "",
    },
    db: {
        timeoutMs: 5000,
        maxConnections: 10,
        queryTimeoutMs: 1000,
    },
    ratingTagsSync: {
        enabled: true,
    },
    cache: {
        tagsTTLms: 30_000,
    },
    search: {
        maxResults: APP_DEFAULTS.SEARCH_DEFAULT_LIMIT,
    },
    workflowMinimap: {
        enabled: false,
        nodeColors: true,
        showLinks: true,
        showGroups: true,
        renderBypassState: true,
        renderErrorState: true,
        showViewport: true,
    },
    ui: {
        cardHoverColor: APP_DEFAULTS.UI_CARD_HOVER_COLOR,
        cardSelectionColor: APP_DEFAULTS.UI_CARD_SELECTION_COLOR,
        ratingColor: APP_DEFAULTS.UI_RATING_COLOR,
        tagColor: APP_DEFAULTS.UI_TAG_COLOR,
    },
    security: {
        safeMode: false,
        allowWrite: true,
        allowRemoteWrite: false,
        allowDelete: true,
        allowRename: true,
        allowOpenInFolder: true,
        allowResetIndex: true,
        apiToken: "",
    },
};

// ─── Load / Save ──────────────────────────────────────────────────────────

export const loadMajoorSettings = () => {
    try {
        const raw = SettingsStore.get(SETTINGS_KEY);
        if (!raw) return { ...DEFAULT_SETTINGS };
        const parsed = JSON.parse(raw);
        const isWrapped =
            parsed
            && typeof parsed === "object"
            && Number.isInteger(parsed.version)
            && parsed.data
            && typeof parsed.data === "object";
        const isLegacyObject = parsed && typeof parsed === "object" && !Array.isArray(parsed);
        if (!isWrapped && !isLegacyObject) return { ...DEFAULT_SETTINGS };
        if (isWrapped && Number(parsed.version) > Number(SETTINGS_SCHEMA_VERSION)) {
            console.warn("[Majoor] settings schema version is newer than this build, using defaults");
            return { ...DEFAULT_SETTINGS };
        }
        const payload = isWrapped ? parsed.data : parsed;
        const allowed = new Set([
            "debug",
            "grid",
            "infiniteScroll",
            "siblings",
            "autoScan",
            "watcher",
            "status",
            "viewer",
            "rtHydrate",
            "observability",
            "sidebar",
            "probeBackend",
            "i18n",
            "paths",
            "db",
            "ratingTagsSync",
            "cache",
            "search",
            "workflowMinimap",
            "ui",
            "security",
            "safety",
        ]);
        const sanitized = {};
        if (payload && typeof payload === "object") {
            for (const [key, value] of Object.entries(payload)) {
                if (allowed.has(key)) sanitized[key] = value;
            }
        }
        const merged = deepMerge(DEFAULT_SETTINGS, sanitized);
        // Auto-migrate legacy format to wrapped versioned format.
        if (!isWrapped) {
            try {
                saveMajoorSettings(merged);
            } catch (e) { console.debug?.(e); }
        }
        return merged;
    } catch (error) {
        console.warn("[Majoor] settings load failed, using defaults", error);
        return { ...DEFAULT_SETTINGS };
    }
};

export const saveMajoorSettings = (settings) => {
    try {
        const sanitized = JSON.parse(JSON.stringify(settings || {}));
        if (sanitized?.security && typeof sanitized.security === "object") {
            sanitized.security.apiToken = "";
        }
        const wrapped = {
            version: SETTINGS_SCHEMA_VERSION,
            data: sanitized,
        };
        SettingsStore.set(SETTINGS_KEY, JSON.stringify(wrapped));
    } catch (error) {
        console.warn("[Majoor] settings save failed", error);
        try {
            const now = Date.now();
            const last = Number(window?._mjrSettingsSaveFailAt || 0) || 0;
            if (now - last > 30_000) {
                window._mjrSettingsSaveFailAt = now;
                import("./dialogs.js")
                    .then(({ comfyAlert }) => comfyAlert("Majoor: Failed to save settings (browser storage full or blocked)."))
                    .catch(() => {});
            }
        } catch (e) { console.debug?.(e); }
        try {
            safeDispatchCustomEvent("mjr-settings-save-failed", { error: String(error?.message || error || "") }, { warnPrefix: "[Majoor]" });
        } catch (e) { console.debug?.(e); }
    }
};

// ─── Apply settings to runtime APP_CONFIG ─────────────────────────────────

export const applySettingsToConfig = (settings) => {
    const maxPage = Number(APP_DEFAULTS.MAX_PAGE_SIZE) || 2000;
    const pageSize = Math.max(
        50,
        Math.min(maxPage, Number(settings.grid?.pageSize) || APP_DEFAULTS.DEFAULT_PAGE_SIZE)
    );
    APP_CONFIG.DEFAULT_PAGE_SIZE = pageSize;
    APP_CONFIG.AUTO_SCAN_ON_STARTUP = !!settings.autoScan?.onStartup;
    APP_CONFIG.STATUS_POLL_INTERVAL = Math.max(1000, Number(settings.status?.pollInterval) || APP_DEFAULTS.STATUS_POLL_INTERVAL);

    APP_CONFIG.DEBUG_SAFE_CALL = !!settings.debug?.safeCall;
    APP_CONFIG.DEBUG_SAFE_LISTENERS = !!settings.debug?.safeListeners;
    APP_CONFIG.DEBUG_VIEWER = !!settings.debug?.viewer;

    APP_CONFIG.GRID_MIN_SIZE = resolveGridMinSize(settings.grid);
    APP_CONFIG.GRID_GAP = Math.max(0, Math.min(40, Math.round(_safeNum(settings.grid?.gap, APP_DEFAULTS.GRID_GAP))));

    APP_CONFIG.GRID_SHOW_BADGES_EXTENSION = !!(settings.grid?.showExtBadge ?? APP_DEFAULTS.GRID_SHOW_BADGES_EXTENSION);
    APP_CONFIG.GRID_SHOW_BADGES_RATING = !!(settings.grid?.showRatingBadge ?? APP_DEFAULTS.GRID_SHOW_BADGES_RATING);
    APP_CONFIG.GRID_SHOW_BADGES_TAGS = !!(settings.grid?.showTagsBadge ?? APP_DEFAULTS.GRID_SHOW_BADGES_TAGS);
    APP_CONFIG.GRID_SHOW_DETAILS = !!(settings.grid?.showDetails ?? APP_DEFAULTS.GRID_SHOW_DETAILS);
    APP_CONFIG.GRID_SHOW_DETAILS_FILENAME = !!(settings.grid?.showFilename ?? APP_DEFAULTS.GRID_SHOW_DETAILS_FILENAME);
    APP_CONFIG.GRID_SHOW_DETAILS_DATE = !!(settings.grid?.showDate ?? APP_DEFAULTS.GRID_SHOW_DETAILS_DATE);
    APP_CONFIG.GRID_SHOW_DETAILS_DIMENSIONS = !!(settings.grid?.showDimensions ?? APP_DEFAULTS.GRID_SHOW_DETAILS_DIMENSIONS);
    APP_CONFIG.GRID_SHOW_DETAILS_GENTIME = !!(settings.grid?.showGenTime ?? APP_DEFAULTS.GRID_SHOW_DETAILS_GENTIME);
    APP_CONFIG.GRID_SHOW_WORKFLOW_DOT = !!(settings.grid?.showWorkflowDot ?? APP_DEFAULTS.GRID_SHOW_WORKFLOW_DOT);
    // Video autoplay mode: migrate old boolean → new tri-state
    {
        let mode = settings.grid?.videoAutoplayMode ?? APP_DEFAULTS.GRID_VIDEO_AUTOPLAY_MODE;
        // Backward compat: old boolean "videoHoverAutoplay" → "hover"
        if (mode === undefined || mode === null) {
            mode = settings.grid?.videoHoverAutoplay === false ? "off" : "hover";
        }
        if (mode === true) mode = "hover";
        if (mode === false) mode = "off";
        if (mode !== "hover" && mode !== "always" && mode !== "off") mode = "hover";
        APP_CONFIG.GRID_VIDEO_AUTOPLAY_MODE = mode;
    }

    const _safeColor = (v, fallback) => {
        let c = String(v || "").trim();
        if (/^[0-9a-fA-F]{6}$/.test(c)) c = `#${c}`;
        return /^#[0-9a-fA-F]{3,8}$/.test(c) ? c : fallback;
    };
    APP_CONFIG.BADGE_STAR_COLOR = _safeColor(settings.grid?.starColor, APP_DEFAULTS.BADGE_STAR_COLOR);
    APP_CONFIG.BADGE_IMAGE_COLOR = _safeColor(settings.grid?.badgeImageColor, APP_DEFAULTS.BADGE_IMAGE_COLOR);
    APP_CONFIG.BADGE_VIDEO_COLOR = _safeColor(settings.grid?.badgeVideoColor, APP_DEFAULTS.BADGE_VIDEO_COLOR);
    APP_CONFIG.BADGE_AUDIO_COLOR = _safeColor(settings.grid?.badgeAudioColor, APP_DEFAULTS.BADGE_AUDIO_COLOR);
    APP_CONFIG.BADGE_MODEL3D_COLOR = _safeColor(settings.grid?.badgeModel3dColor, APP_DEFAULTS.BADGE_MODEL3D_COLOR);
    APP_CONFIG.BADGE_DUPLICATE_ALERT_COLOR = _safeColor(settings.grid?.badgeDuplicateAlertColor, APP_DEFAULTS.BADGE_DUPLICATE_ALERT_COLOR);
    APP_CONFIG.UI_CARD_HOVER_COLOR = _safeColor(settings.ui?.cardHoverColor, APP_DEFAULTS.UI_CARD_HOVER_COLOR);
    APP_CONFIG.UI_CARD_SELECTION_COLOR = _safeColor(settings.ui?.cardSelectionColor, APP_DEFAULTS.UI_CARD_SELECTION_COLOR);
    APP_CONFIG.UI_RATING_COLOR = _safeColor(settings.ui?.ratingColor, APP_DEFAULTS.UI_RATING_COLOR);
    APP_CONFIG.UI_TAG_COLOR = _safeColor(settings.ui?.tagColor, APP_DEFAULTS.UI_TAG_COLOR);

    try {
        const roots = Array.from(document.querySelectorAll(".mjr-assets-manager"));
        for (const root of roots) {
            root.style.setProperty("--mjr-star-active", APP_CONFIG.BADGE_STAR_COLOR);
            root.style.setProperty("--mjr-badge-image", APP_CONFIG.BADGE_IMAGE_COLOR);
            root.style.setProperty("--mjr-badge-video", APP_CONFIG.BADGE_VIDEO_COLOR);
            root.style.setProperty("--mjr-badge-audio", APP_CONFIG.BADGE_AUDIO_COLOR);
            root.style.setProperty("--mjr-badge-model3d", APP_CONFIG.BADGE_MODEL3D_COLOR);
            root.style.setProperty("--mjr-badge-duplicate-alert", APP_CONFIG.BADGE_DUPLICATE_ALERT_COLOR);
            root.style.setProperty("--mjr-card-hover-color", APP_CONFIG.UI_CARD_HOVER_COLOR);
            root.style.setProperty("--mjr-card-selection-color", APP_CONFIG.UI_CARD_SELECTION_COLOR);
            root.style.setProperty("--mjr-rating-color", APP_CONFIG.UI_RATING_COLOR);
            root.style.setProperty("--mjr-tag-color", APP_CONFIG.UI_TAG_COLOR);
        }
    } catch (e) { console.debug?.(e); }

    APP_CONFIG.INFINITE_SCROLL_ENABLED = !!settings.infiniteScroll?.enabled;
    APP_CONFIG.INFINITE_SCROLL_ROOT_MARGIN = String(settings.infiniteScroll?.rootMargin || APP_DEFAULTS.INFINITE_SCROLL_ROOT_MARGIN);
    APP_CONFIG.INFINITE_SCROLL_THRESHOLD = Math.max(0, Math.min(1, _safeNum(settings.infiniteScroll?.threshold, APP_DEFAULTS.INFINITE_SCROLL_THRESHOLD)));
    APP_CONFIG.BOTTOM_GAP_PX = Math.max(0, Math.min(5000, Math.round(_safeNum(settings.infiniteScroll?.bottomGapPx, APP_DEFAULTS.BOTTOM_GAP_PX))));

    APP_CONFIG.VIEWER_ALLOW_PAN_AT_ZOOM_1 = !!settings.viewer?.allowPanAtZoom1;
    APP_CONFIG.VIEWER_DISABLE_WEBGL_VIDEO = !!settings.viewer?.disableWebGL;
    APP_CONFIG.VIEWER_VIDEO_GRADE_THROTTLE_FPS = Math.max(1, Math.min(60, Math.round(_safeNum(settings.viewer?.videoGradeThrottleFps, APP_DEFAULTS.VIEWER_VIDEO_GRADE_THROTTLE_FPS))));
    APP_CONFIG.VIEWER_SCOPES_FPS = Math.max(1, Math.min(60, Math.round(_safeNum(settings.viewer?.scopesFps, APP_DEFAULTS.VIEWER_SCOPES_FPS))));
    APP_CONFIG.VIEWER_META_TTL_MS = Math.max(1000, Math.min(10 * 60_000, Math.round(_safeNum(settings.viewer?.metaTtlMs, APP_DEFAULTS.VIEWER_META_TTL_MS))));
    APP_CONFIG.VIEWER_META_MAX_ENTRIES = Math.max(50, Math.min(5000, Math.round(_safeNum(settings.viewer?.metaMaxEntries, APP_DEFAULTS.VIEWER_META_MAX_ENTRIES))));

    APP_CONFIG.WORKFLOW_MINIMAP_ENABLED = !!(settings.workflowMinimap?.enabled ?? false);

    APP_CONFIG.RT_HYDRATE_CONCURRENCY = Math.max(1, Math.min(16, Math.round(_safeNum(settings.rtHydrate?.concurrency, APP_DEFAULTS.RT_HYDRATE_CONCURRENCY))));
    APP_CONFIG.RT_HYDRATE_QUEUE_MAX = Math.max(10, Math.min(5000, Math.round(_safeNum(settings.rtHydrate?.queueMax, APP_DEFAULTS.RT_HYDRATE_QUEUE_MAX))));
    APP_CONFIG.RT_HYDRATE_SEEN_MAX = Math.max(1000, Math.min(200_000, Math.round(_safeNum(settings.rtHydrate?.seenMax, APP_DEFAULTS.RT_HYDRATE_SEEN_MAX))));
    APP_CONFIG.RT_HYDRATE_PRUNE_BUDGET = Math.max(10, Math.min(10_000, Math.round(_safeNum(settings.rtHydrate?.pruneBudget, APP_DEFAULTS.RT_HYDRATE_PRUNE_BUDGET))));
    APP_CONFIG.RT_HYDRATE_SEEN_TTL_MS = Math.max(5_000, Math.min(6 * 60 * 60_000, Math.round(_safeNum(settings.rtHydrate?.seenTtlMs, APP_DEFAULTS.RT_HYDRATE_SEEN_TTL_MS))));

    APP_CONFIG.DELETE_CONFIRMATION = !!settings.safety?.confirmDeletion;
    APP_CONFIG.DEBUG_VERBOSE_ERRORS = !!settings.observability?.verboseErrors;
    APP_CONFIG.WATCHER_MAX_PENDING = Math.max(10, Math.min(5000, Math.round(_safeNum(settings.watcher?.maxPending, 500))));
    APP_CONFIG.WATCHER_MIN_SIZE = Math.max(0, Math.min(1000000, Math.round(_safeNum(settings.watcher?.minSize, 100))));
    APP_CONFIG.WATCHER_MAX_SIZE = Math.max(100000, Math.min(17179869184, Math.round(_safeNum(settings.watcher?.maxSize, 4294967296))));
    APP_CONFIG.DB_TIMEOUT_MS = Math.max(1000, Math.min(30000, Math.round(_safeNum(settings.db?.timeoutMs, 5000))));
    APP_CONFIG.DB_MAX_CONNECTIONS = Math.max(1, Math.min(100, Math.round(_safeNum(settings.db?.maxConnections, 10))));
    APP_CONFIG.DB_QUERY_TIMEOUT_MS = Math.max(500, Math.min(10000, Math.round(_safeNum(settings.db?.queryTimeoutMs, 1000))));
    // Search request limit (client-side); backend still enforces MAJOOR_SEARCH_MAX_LIMIT
    APP_CONFIG.SEARCH_REQUEST_LIMIT = Math.max(
        10,
        Math.min(APP_DEFAULTS.MAX_PAGE_SIZE || 2000, Math.round(_safeNum(settings.search?.maxResults, APP_DEFAULTS.SEARCH_DEFAULT_LIMIT)))
    );
};

// ─── Backend security sync ────────────────────────────────────────────────

export async function syncBackendSecuritySettings() {
    try {
        const res = await getSecuritySettings();
        if (!res?.ok) return;
        const prefs = res.data?.prefs;
        if (!prefs || typeof prefs !== "object") return;

        const settings = loadMajoorSettings();
        settings.security = settings.security || {};
        settings.security.safeMode = _safeBool(prefs.safe_mode, settings.security.safeMode);
        settings.security.allowWrite = _safeBool(prefs.allow_write, settings.security.allowWrite);
        settings.security.allowRemoteWrite = _safeBool(prefs.allow_remote_write, settings.security.allowRemoteWrite);
        settings.security.allowDelete = _safeBool(prefs.allow_delete, settings.security.allowDelete);
        settings.security.allowRename = _safeBool(prefs.allow_rename, settings.security.allowRename);
        settings.security.allowOpenInFolder = _safeBool(prefs.allow_open_in_folder, settings.security.allowOpenInFolder);
        settings.security.allowResetIndex = _safeBool(prefs.allow_reset_index, settings.security.allowResetIndex);
        // Security settings endpoint intentionally does not expose the token.
        // Bootstrap it once so write actions work without manual user input.
        if (!String(settings.security.apiToken || "").trim()) {
            try {
                const boot = await bootstrapSecurityToken();
                const bootToken = String(boot?.data?.token || "").trim();
                if (boot?.ok && bootToken) {
                    settings.security.apiToken = bootToken;
                }
            } catch (e) { console.debug?.(e); }
        }
        saveMajoorSettings(settings);
        applySettingsToConfig(settings);
        safeDispatchCustomEvent("mjr-settings-changed", { key: "security" }, { warnPrefix: "[Majoor]" });
    } catch (error) {
        console.warn("[Majoor] failed to sync backend security settings", error);
    }
}
