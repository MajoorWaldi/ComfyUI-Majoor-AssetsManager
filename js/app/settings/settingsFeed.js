/**
 * Settings section: Generated Feed (bottom panel) card display.
 */

import { APP_DEFAULTS } from "../config.js";
import { t } from "../i18n.js";
import { saveMajoorSettings, applySettingsToConfig } from "./settingsCore.js";

const SETTINGS_PREFIX = "Majoor";
const SETTINGS_CATEGORY = "Majoor Assets Manager";

/**
 * Register Generated Feed display settings.
 *
 * @param {Function} safeAddSetting - Wrapped addSetting function from the parent.
 * @param {object}   settings       - Live settings object (mutated on change).
 * @param {Function} notifyApplied  - Callback(key) to schedule change notifications.
 */
export function registerFeedSettings(safeAddSetting, settings, notifyApplied) {
    const feedCat = (label) => [SETTINGS_CATEGORY, t("cat.feed", "Generated Feed"), label];

    const ensureFeed = () => {
        settings.feed = settings.feed || {};
    };

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Feed.CardSize`,
        category: feedCat("Card size"),
        name: "Feed card size (px)",
        tooltip: "Set the minimum card width used by the Generated Feed layout (60-600 px).",
        type: "number",
        defaultValue: Math.max(60, Math.min(600, Number(settings.feed?.minSize) || 120)),
        attrs: { min: 60, max: 600, step: 10 },
        onChange: (value) => {
            ensureFeed();
            settings.feed.minSize = Math.max(60, Math.min(600, Math.round(Number(value) || 120)));
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("feed.minSize");
        },
    });

    // ── Master toggle: show info section ──
    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Feed.ShowInfo`,
        category: feedCat("Show info section"),
        name: "Show card info section",
        tooltip:
            "Show or hide the entire info section (filename, metadata, dots) below thumbnails in the Generated Feed.",
        type: "boolean",
        defaultValue: !!(settings.feed?.showInfo ?? APP_DEFAULTS.FEED_SHOW_INFO),
        onChange: (value) => {
            ensureFeed();
            settings.feed.showInfo = !!value;
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("feed.showInfo");
        },
    });

    // ── Filename ──
    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Feed.ShowFilename`,
        category: feedCat("Show filename"),
        name: "Show filename",
        tooltip: "Display the filename on feed cards.",
        type: "boolean",
        defaultValue: !!(settings.feed?.showFilename ?? APP_DEFAULTS.FEED_SHOW_FILENAME),
        onChange: (value) => {
            ensureFeed();
            settings.feed.showFilename = !!value;
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("feed.showFilename");
        },
    });

    // ── Dimensions ──
    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Feed.ShowDimensions`,
        category: feedCat("Show dimensions"),
        name: "Show dimensions",
        tooltip: "Display resolution (WxH) and duration on feed cards.",
        type: "boolean",
        defaultValue: !!(settings.feed?.showDimensions ?? APP_DEFAULTS.FEED_SHOW_DIMENSIONS),
        onChange: (value) => {
            ensureFeed();
            settings.feed.showDimensions = !!value;
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("feed.showDimensions");
        },
    });

    // ── Date/time ──
    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Feed.ShowDate`,
        category: feedCat("Show date/time"),
        name: "Show date/time",
        tooltip: "Display date and time on feed cards.",
        type: "boolean",
        defaultValue: !!(settings.feed?.showDate ?? APP_DEFAULTS.FEED_SHOW_DATE),
        onChange: (value) => {
            ensureFeed();
            settings.feed.showDate = !!value;
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("feed.showDate");
        },
    });

    // ── Generation time badge ──
    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Feed.ShowGenTime`,
        category: feedCat("Show generation time"),
        name: "Show generation time",
        tooltip: "Display the generation time badge on feed cards.",
        type: "boolean",
        defaultValue: !!(settings.feed?.showGenTime ?? APP_DEFAULTS.FEED_SHOW_GENTIME),
        onChange: (value) => {
            ensureFeed();
            settings.feed.showGenTime = !!value;
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("feed.showGenTime");
        },
    });

    // ── Workflow dot ──
    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Feed.ShowWorkflowDot`,
        category: feedCat("Show workflow dot"),
        name: "Show workflow indicator",
        tooltip: "Display the workflow availability dot on feed cards.",
        type: "boolean",
        defaultValue: !!(settings.feed?.showWorkflowDot ?? APP_DEFAULTS.FEED_SHOW_WORKFLOW_DOT),
        onChange: (value) => {
            ensureFeed();
            settings.feed.showWorkflowDot = !!value;
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("feed.showWorkflowDot");
        },
    });

    // ── Format badge ──
    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Feed.ShowExtBadge`,
        category: feedCat("Show format badges"),
        name: "Show format badges",
        tooltip: "Display format badges (e.g. JPG, MP4) on feed card thumbnails.",
        type: "boolean",
        defaultValue: !!(settings.feed?.showExtBadge ?? APP_DEFAULTS.FEED_SHOW_BADGES_EXTENSION),
        onChange: (value) => {
            ensureFeed();
            settings.feed.showExtBadge = !!value;
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("feed.showExtBadge");
        },
    });

    // ── Rating badge ──
    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Feed.ShowRatingBadge`,
        category: feedCat("Show rating badges"),
        name: "Show ratings",
        tooltip: "Display star ratings on feed card thumbnails.",
        type: "boolean",
        defaultValue: !!(settings.feed?.showRatingBadge ?? APP_DEFAULTS.FEED_SHOW_BADGES_RATING),
        onChange: (value) => {
            ensureFeed();
            settings.feed.showRatingBadge = !!value;
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("feed.showRatingBadge");
        },
    });

    // ── Tags badge ──
    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Feed.ShowTagsBadge`,
        category: feedCat("Show tags badges"),
        name: "Show tags",
        tooltip: "Display tag indicators on feed card thumbnails.",
        type: "boolean",
        defaultValue: !!(settings.feed?.showTagsBadge ?? APP_DEFAULTS.FEED_SHOW_BADGES_TAGS),
        onChange: (value) => {
            ensureFeed();
            settings.feed.showTagsBadge = !!value;
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("feed.showTagsBadge");
        },
    });
}
