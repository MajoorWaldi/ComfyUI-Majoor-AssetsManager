/**
 * Settings section: Cards + Badges + Grid + Sidebar.
 */

import { APP_CONFIG, APP_DEFAULTS } from "../config.js";
import { t } from "../i18n.js";
import { _safeOneOf, GRID_SIZE_PRESETS, GRID_SIZE_PRESET_OPTIONS, detectGridSizePreset } from "./settingsUtils.js";
import { saveMajoorSettings, applySettingsToConfig } from "./settingsCore.js";

const SETTINGS_PREFIX = "Majoor";
const SETTINGS_CATEGORY = "Majoor Assets Manager";

/**
 * Register all Cards, Badges, Grid layout and Sidebar settings.
 *
 * @param {Function} safeAddSetting - Wrapped addSetting function from the parent.
 * @param {object}   settings       - Live settings object (mutated on change).
 * @param {Function} notifyApplied  - Callback(key) to schedule change notifications.
 */
export function registerGridSettings(safeAddSetting, settings, notifyApplied) {
    const cat = (section, label) => [SETTINGS_CATEGORY, section, label];
    const cardCat = (label) => [SETTINGS_CATEGORY, t("cat.cards", "Cards"), label];
    const badgeCat = (label) => [SETTINGS_CATEGORY, t("cat.badges", "Badges"), label];
    const colorCat = (label) => [SETTINGS_CATEGORY, t("cat.badges", "Badges"), label];

    const normalizeHexColor = (value, fallback) => {
        let v = String(value || "").trim();
        // PrimeVue ColorPicker returns hex without '#' prefix
        if (/^[0-9a-fA-F]{6}$/.test(v)) v = `#${v}`;
        return /^#[0-9a-fA-F]{6}$/.test(v) ? v.toUpperCase() : fallback;
    };

    if (!settings.grid?.minSizePreset) {
        settings.grid = settings.grid || {};
        settings.grid.minSizePreset = detectGridSizePreset(settings.grid.minSize);
        saveMajoorSettings(settings);
    }

    // ──────────────────────────────────────────────
    // Section: Cards
    // ──────────────────────────────────────────────

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Cards.ThumbSize`,
        category: cardCat(t("setting.grid.cardSize.group", "Card size")),
        name: t("setting.grid.cardSize.name", "Majoor: Card Size"),
        tooltip: t("setting.grid.cardSize.desc", "Choose the card size preset used by the grid layout."),
        type: "combo",
        defaultValue: (() => {
            const preset = _safeOneOf(
                String(settings.grid?.minSizePreset || "").toLowerCase(),
                GRID_SIZE_PRESET_OPTIONS,
                detectGridSizePreset(settings.grid?.minSize)
            );
            const labels = {
                small: t("setting.grid.cardSize.small", "Small"),
                medium: t("setting.grid.cardSize.medium", "Medium"),
                large: t("setting.grid.cardSize.large", "Large"),
            };
            return labels[preset] || labels.medium;
        })(),
        options: [
            t("setting.grid.cardSize.small", "Small"),
            t("setting.grid.cardSize.medium", "Medium"),
            t("setting.grid.cardSize.large", "Large"),
        ],
        onChange: (value) => {
            const label = String(value || "").trim().toLowerCase();
            const smallLabel = t("setting.grid.cardSize.small", "Small").toLowerCase();
            const mediumLabel = t("setting.grid.cardSize.medium", "Medium").toLowerCase();
            const largeLabel = t("setting.grid.cardSize.large", "Large").toLowerCase();
            let preset = "medium";
            if (label === smallLabel || label === "small" || label === "petit") preset = "small";
            else if (label === largeLabel || label === "large" || label === "grand") preset = "large";
            else if (label === mediumLabel || label === "medium" || label === "moyen") preset = "medium";
            settings.grid.minSizePreset = preset;
            settings.grid.minSize = GRID_SIZE_PRESETS[preset];
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("grid.minSizePreset");
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Grid.ShowDetails`,
        category: cardCat("Show card details"),
        name: "Show metadata panel",
        tooltip: "Show the bottom details panel on asset cards (filename, date, etc.)",
        type: "boolean",
        defaultValue: !!settings.grid?.showDetails,
        onChange: (value) => {
            settings.grid.showDetails = !!value;
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("grid.showDetails");
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Grid.ShowFilename`,
        category: cardCat("Show filename"),
        name: "Show filename",
        tooltip: "Display filename in details panel",
        type: "boolean",
        defaultValue: !!settings.grid?.showFilename,
        onChange: (value) => {
            settings.grid.showFilename = !!value;
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("grid.showFilename");
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Grid.ShowDate`,
        category: cardCat("Show date/time"),
        name: "Show date/time",
        tooltip: "Display date and time in details panel",
        type: "boolean",
        defaultValue: !!settings.grid?.showDate,
        onChange: (value) => {
            settings.grid.showDate = !!value;
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("grid.showDate");
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Grid.ShowDimensions`,
        category: cardCat("Show dimensions"),
        name: "Show dimensions",
        tooltip: "Display resolution (WxH) in details panel",
        type: "boolean",
        defaultValue: !!settings.grid?.showDimensions,
        onChange: (value) => {
            settings.grid.showDimensions = !!value;
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("grid.showDimensions");
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Grid.ShowGenTime`,
        category: cardCat("Show generation time"),
        name: "Show generation time",
        tooltip: "Display seconds taken to generate the asset (if available)",
        type: "boolean",
        defaultValue: !!settings.grid?.showGenTime,
        onChange: (value) => {
            settings.grid.showGenTime = !!value;
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("grid.showGenTime");
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Grid.ShowWorkflowDot`,
        category: cardCat("Show workflow dot"),
        name: "Show workflow indicator",
        tooltip: "Display the green dot indicating workflow metadata availability (bottom right of card)",
        type: "boolean",
        defaultValue: !!settings.grid?.showWorkflowDot,
        onChange: (value) => {
            settings.grid.showWorkflowDot = !!value;
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("grid.showWorkflowDot");
        },
    });

    // ──────────────────────────────────────────────
    // Section: Badges
    // ──────────────────────────────────────────────

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Grid.ShowExtBadge`,
        category: badgeCat("Show format badges"),
        name: "Show format badges",
        tooltip: "Display format badges (e.g. JPG, MP4) on thumbnails",
        type: "boolean",
        defaultValue: !!settings.grid?.showExtBadge,
        onChange: (value) => {
            settings.grid.showExtBadge = !!value;
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("grid.showExtBadge");
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Grid.ShowRatingBadge`,
        category: badgeCat("Show rating badges"),
        name: "Show ratings",
        tooltip: "Display star ratings on thumbnails",
        type: "boolean",
        defaultValue: !!settings.grid?.showRatingBadge,
        onChange: (value) => {
            settings.grid.showRatingBadge = !!value;
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("grid.showRatingBadge");
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Grid.ShowTagsBadge`,
        category: badgeCat("Show tags badges"),
        name: "Show tags",
        tooltip: "Display a small indicator if an asset has tags",
        type: "boolean",
        defaultValue: !!settings.grid?.showTagsBadge,
        onChange: (value) => {
            settings.grid.showTagsBadge = !!value;
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("grid.showTagsBadge");
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Badges.StarColor`,
        category: colorCat(t("setting.starColor", "Star color")),
        name: t("setting.starColor", "Majoor: Star color"),
        tooltip: t("setting.starColor.tooltip", "Color of rating stars on thumbnails (hex, e.g. #FFD45A)"),
        type: "color",
        defaultValue: normalizeHexColor(settings.grid?.starColor, APP_DEFAULTS.BADGE_STAR_COLOR),
        onChange: (value) => {
            settings.grid.starColor = normalizeHexColor(value, APP_DEFAULTS.BADGE_STAR_COLOR);
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("grid.starColor");
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Badges.ImageColor`,
        category: colorCat(t("setting.badgeImageColor", "Image badge color")),
        name: t("setting.badgeImageColor", "Majoor: Image badge color"),
        tooltip: t("setting.badgeImageColor.tooltip", "Color for image badges: PNG, JPG, WEBP, GIF, BMP, TIF (hex)"),
        type: "color",
        defaultValue: normalizeHexColor(settings.grid?.badgeImageColor, APP_DEFAULTS.BADGE_IMAGE_COLOR),
        onChange: (value) => {
            settings.grid.badgeImageColor = normalizeHexColor(value, APP_DEFAULTS.BADGE_IMAGE_COLOR);
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("grid.badgeImageColor");
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Badges.VideoColor`,
        category: colorCat(t("setting.badgeVideoColor", "Video badge color")),
        name: t("setting.badgeVideoColor", "Majoor: Video badge color"),
        tooltip: t("setting.badgeVideoColor.tooltip", "Color for video badges: MP4, WEBM, MOV, AVI, MKV (hex)"),
        type: "color",
        defaultValue: normalizeHexColor(settings.grid?.badgeVideoColor, APP_DEFAULTS.BADGE_VIDEO_COLOR),
        onChange: (value) => {
            settings.grid.badgeVideoColor = normalizeHexColor(value, APP_DEFAULTS.BADGE_VIDEO_COLOR);
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("grid.badgeVideoColor");
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Badges.AudioColor`,
        category: colorCat(t("setting.badgeAudioColor", "Audio badge color")),
        name: t("setting.badgeAudioColor", "Majoor: Audio badge color"),
        tooltip: t("setting.badgeAudioColor.tooltip", "Color for audio badges: MP3, WAV, OGG, FLAC (hex)"),
        type: "color",
        defaultValue: normalizeHexColor(settings.grid?.badgeAudioColor, APP_DEFAULTS.BADGE_AUDIO_COLOR),
        onChange: (value) => {
            settings.grid.badgeAudioColor = normalizeHexColor(value, APP_DEFAULTS.BADGE_AUDIO_COLOR);
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("grid.badgeAudioColor");
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Badges.Model3dColor`,
        category: colorCat(t("setting.badgeModel3dColor", "3D model badge color")),
        name: t("setting.badgeModel3dColor", "Majoor: 3D model badge color"),
        tooltip: t("setting.badgeModel3dColor.tooltip", "Color for 3D model badges: OBJ, FBX, GLB, GLTF (hex)"),
        type: "color",
        defaultValue: normalizeHexColor(settings.grid?.badgeModel3dColor, APP_DEFAULTS.BADGE_MODEL3D_COLOR),
        onChange: (value) => {
            settings.grid.badgeModel3dColor = normalizeHexColor(value, APP_DEFAULTS.BADGE_MODEL3D_COLOR);
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("grid.badgeModel3dColor");
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Badges.DuplicateAlertColor`,
        category: colorCat(t("setting.badgeDuplicateAlertColor", "Duplicate alert badge color")),
        name: t("setting.badgeDuplicateAlertColor", "Majoor: Duplicate alert badge color"),
        tooltip: t("setting.badgeDuplicateAlertColor.tooltip", "Color for duplicate extension badges (PNG+, JPG+, etc)."),
        type: "color",
        defaultValue: normalizeHexColor(settings.grid?.badgeDuplicateAlertColor, APP_DEFAULTS.BADGE_DUPLICATE_ALERT_COLOR),
        onChange: (value) => {
            settings.grid.badgeDuplicateAlertColor = normalizeHexColor(value, APP_DEFAULTS.BADGE_DUPLICATE_ALERT_COLOR);
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("grid.badgeDuplicateAlertColor");
        },
    });

    // ──────────────────────────────────────────────
    // Section: Grid
    // ──────────────────────────────────────────────

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Grid.PageSize`,
        category: cat(t("cat.grid"), t("setting.grid.pagesize.name").replace("Majoor: ", "")),
        name: t("setting.grid.pagesize.name"),
        tooltip: t("setting.grid.pagesize.desc"),
        type: "number",
        defaultValue: settings.grid.pageSize,
        attrs: { min: 50, max: Number(APP_CONFIG.MAX_PAGE_SIZE) || 2000, step: 50 },
        onChange: (value) => {
            const maxPage = Number(APP_CONFIG.MAX_PAGE_SIZE) || 2000;
            settings.grid.pageSize = Math.max(50, Math.min(maxPage, Number(value) || APP_DEFAULTS.DEFAULT_PAGE_SIZE));
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("grid.pageSize");
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.InfiniteScroll.Enabled`,
        category: cat(t("cat.grid"), t("setting.nav.infinite.name").replace("Majoor: ", "")),
        name: t("setting.nav.infinite.name"),
        tooltip: t("setting.nav.infinite.desc"),
        type: "boolean",
        defaultValue: !!settings.infiniteScroll?.enabled,
        onChange: (value) => {
            settings.infiniteScroll = settings.infiniteScroll || {};
            settings.infiniteScroll.enabled = !!value;
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("infiniteScroll.enabled");
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Sidebar.Position`,
        category: cat(t("cat.grid"), t("setting.sidebar.pos.name").replace("Majoor: ", "")),
        name: t("setting.sidebar.pos.name"),
        tooltip: t("setting.sidebar.pos.desc"),
        type: "combo",
        defaultValue: settings.sidebar?.position || "right",
        options: ["left", "right"],
        onChange: (value) => {
            settings.sidebar = settings.sidebar || {};
            settings.sidebar.position = value === "left" ? "left" : "right";
            saveMajoorSettings(settings);
            notifyApplied("sidebar.position");
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Sidebar.ShowPreviewThumb`,
        category: cat(t("cat.grid"), "Sidebar preview"),
        name: "Show sidebar preview thumb",
        tooltip: "Show/hide the large media preview at the top of the sidebar metadata panel.",
        type: "boolean",
        defaultValue: !!(settings.sidebar?.showPreviewThumb ?? true),
        onChange: (value) => {
            settings.sidebar = settings.sidebar || {};
            settings.sidebar.showPreviewThumb = !!value;
            saveMajoorSettings(settings);
            notifyApplied("sidebar.showPreviewThumb");
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Sidebar.WidthPx`,
        category: cat(t("cat.grid"), "Sidebar width"),
        name: "Sidebar width (px)",
        tooltip: "Set the details sidebar width in pixels (240-640).",
        type: "number",
        defaultValue: Math.max(240, Math.min(640, Number(settings.sidebar?.widthPx) || 360)),
        attrs: {
            min: 240,
            max: 640,
            step: 10,
        },
        onChange: (value) => {
            settings.sidebar = settings.sidebar || {};
            settings.sidebar.widthPx = Math.max(240, Math.min(640, Math.round(Number(value) || 360)));
            saveMajoorSettings(settings);
            notifyApplied("sidebar.widthPx");
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.General.HideSiblings`,
        category: cat(t("cat.grid"), t("setting.siblings.hide.name").replace("Majoor: ", "")),
        name: t("setting.siblings.hide.name"),
        tooltip: t("setting.siblings.hide.desc"),
        type: "boolean",
        defaultValue: !!settings.siblings?.hidePngSiblings,
        onChange: (value) => {
            settings.siblings = settings.siblings || {};
            settings.siblings.hidePngSiblings = !!value;
            saveMajoorSettings(settings);
            notifyApplied("siblings.hidePngSiblings");
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Grid.VideoAutoplayMode`,
        category: cat(t("cat.grid"), t("setting.grid.videoAutoplayMode.name", "Video autoplay").replace("Majoor: ", "")),
        name: t("setting.grid.videoAutoplayMode.name", "Majoor: Video autoplay"),
        tooltip: t(
            "setting.grid.videoAutoplayMode.desc",
            "Controls video thumbnail playback in the grid. Off: static frame. Hover: play on mouse hover. Always: loop while visible."
        ),
        type: "combo",
        defaultValue: (() => {
            let mode = settings.grid?.videoAutoplayMode;
            // Backward compat from old boolean
            if (mode === undefined || mode === null) {
                mode = settings.grid?.videoHoverAutoplay === false ? "off" : "hover";
            }
            if (mode === true) mode = "hover";
            if (mode === false) mode = "off";
            if (mode !== "hover" && mode !== "always" && mode !== "off") mode = "hover";
            const labels = {
                off: t("setting.grid.videoAutoplayMode.off", "Off"),
                hover: t("setting.grid.videoAutoplayMode.hover", "Hover"),
                always: t("setting.grid.videoAutoplayMode.always", "Always"),
            };
            return labels[mode] || labels.off;
        })(),
        options: [
            t("setting.grid.videoAutoplayMode.off", "Off"),
            t("setting.grid.videoAutoplayMode.hover", "Hover"),
            t("setting.grid.videoAutoplayMode.always", "Always"),
        ],
        onChange: (value) => {
            const labelToMode = {
                [t("setting.grid.videoAutoplayMode.off", "Off")]: "off",
                [t("setting.grid.videoAutoplayMode.hover", "Hover")]: "hover",
                [t("setting.grid.videoAutoplayMode.always", "Always")]: "always",
            };
            const mode = labelToMode[value] || "off";
            settings.grid = settings.grid || {};
            settings.grid.videoAutoplayMode = mode;
            // Clean up legacy key
            delete settings.grid.videoHoverAutoplay;
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("grid.videoAutoplayMode");
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Cards.HoverColor`,
        category: cardCat("Hover color"),
        name: "Majoor: Card hover color",
        tooltip: "Background tint used when hovering a card (hex, e.g. #3D3D3D).",
        type: "color",
        defaultValue: normalizeHexColor(settings.ui?.cardHoverColor, APP_DEFAULTS.UI_CARD_HOVER_COLOR),
        onChange: (value) => {
            settings.ui = settings.ui || {};
            settings.ui.cardHoverColor = normalizeHexColor(value, APP_DEFAULTS.UI_CARD_HOVER_COLOR);
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("ui.cardHoverColor");
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Cards.SelectionColor`,
        category: cardCat("Selection color"),
        name: "Majoor: Card selection color",
        tooltip: "Outline/accent color used for selected cards (hex, e.g. #4A90E2).",
        type: "color",
        defaultValue: normalizeHexColor(settings.ui?.cardSelectionColor, APP_DEFAULTS.UI_CARD_SELECTION_COLOR),
        onChange: (value) => {
            settings.ui = settings.ui || {};
            settings.ui.cardSelectionColor = normalizeHexColor(value, APP_DEFAULTS.UI_CARD_SELECTION_COLOR);
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("ui.cardSelectionColor");
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Badges.RatingColor`,
        category: badgeCat("Rating color"),
        name: "Majoor: Rating badge color",
        tooltip: "Color used for rating badge text/accent (hex, e.g. #FF9500).",
        type: "color",
        defaultValue: normalizeHexColor(settings.ui?.ratingColor, APP_DEFAULTS.UI_RATING_COLOR),
        onChange: (value) => {
            settings.ui = settings.ui || {};
            settings.ui.ratingColor = normalizeHexColor(value, APP_DEFAULTS.UI_RATING_COLOR);
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("ui.ratingColor");
        },
    });

    safeAddSetting({
        id: `${SETTINGS_PREFIX}.Badges.TagColor`,
        category: badgeCat("Tag color"),
        name: "Majoor: Tags badge color",
        tooltip: "Color used for tags badge text/accent (hex, e.g. #4A90E2).",
        type: "color",
        defaultValue: normalizeHexColor(settings.ui?.tagColor, APP_DEFAULTS.UI_TAG_COLOR),
        onChange: (value) => {
            settings.ui = settings.ui || {};
            settings.ui.tagColor = normalizeHexColor(value, APP_DEFAULTS.UI_TAG_COLOR);
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            notifyApplied("ui.tagColor");
        },
    });
}
