/**
 * Settings sections extracted from SettingsPanel.
 */

export function registerSettingsSections(ctx) {
    const {
        safeAddSetting,
        settings,
        saveMajoorSettings,
        applySettingsToConfig,
        notifyApplied,
        SETTINGS_PREFIX,
        SETTINGS_CATEGORY,
        APP_DEFAULTS,
        DEFAULT_SETTINGS,
        _safeNum,
        _safeOneOf,
        GRID_SIZE_PRESET_OPTIONS,
        GRID_SIZE_PRESETS,
        detectGridSizePreset,
        setSecuritySettings,
        setProbeBackendMode,
        getMetadataFallbackSettings,
        setMetadataFallbackSettings,
        getOutputDirectorySetting,
        setOutputDirectorySetting,
        toggleWatcher,
        getWatcherSettings,
        updateWatcherSettings,
        comfyToast,
        t,
        cat,
        cardCat,
        badgeCat,
        colorCat,
        normalizeHexColor,
    } = ctx || {};

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
                settings.grid.pageSize = Math.max(50, Math.min(maxPage, Number(value) || DEFAULT_SETTINGS.grid.pageSize));
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

        // ──────────────────────────────────────────────
        // Section: Scanning
        // ──────────────────────────────────────────────

        safeAddSetting({
            id: `${SETTINGS_PREFIX}.AutoScan.OnStartup`,
            category: cat(t("cat.scanning"), t("setting.scan.startup.name").replace("Majoor: ", "")),
            name: t("setting.scan.startup.name"),
            tooltip: t("setting.scan.startup.desc"),
            type: "boolean",
            defaultValue: !!settings.autoScan?.onStartup,
            onChange: (value) => {
                settings.autoScan = settings.autoScan || {};
                settings.autoScan.onStartup = !!value;
                saveMajoorSettings(settings);
                applySettingsToConfig(settings);
                notifyApplied("autoScan.onStartup");
            },
        });

        safeAddSetting({
            id: `${SETTINGS_PREFIX}.RtHydrate.Concurrency`,
            category: cat(t("cat.scanning"), "Hydration"),
            name: "Hydrate Concurrency",
            tooltip: "Maximum concurrent hydration requests for rating/tags.",
            type: "number",
            defaultValue: Number(settings.rtHydrate?.concurrency || APP_DEFAULTS.RT_HYDRATE_CONCURRENCY || 5),
            attrs: { min: 1, max: 20, step: 1 },
            onChange: (value) => {
                settings.rtHydrate = settings.rtHydrate || {};
                settings.rtHydrate.concurrency = Math.max(
                    1,
                    Math.min(20, Math.round(_safeNum(value, APP_DEFAULTS.RT_HYDRATE_CONCURRENCY || 5)))
                );
                saveMajoorSettings(settings);
                applySettingsToConfig(settings);
                notifyApplied("rtHydrate.concurrency");
            },
        });

        const _clampWatcherValue = (raw, fallback, min, max) => {
            const parsed = Math.round(_safeNum(raw, fallback));
            return Math.max(min, Math.min(max, parsed));
        };

        const applyWatcherSettingsFromBackend = (payload = {}) => {
            const changed = [];
            settings.watcher = settings.watcher || {};
            if (typeof payload.debounce_ms === "number") {
                const normalized = Math.max(50, Math.min(5000, Math.round(payload.debounce_ms)));
                if (settings.watcher.debounceMs !== normalized) {
                    settings.watcher.debounceMs = normalized;
                    changed.push("watcher.debounceMs");
                }
            }
            if (typeof payload.dedupe_ttl_ms === "number") {
                const normalized = Math.max(100, Math.min(30000, Math.round(payload.dedupe_ttl_ms)));
                if (settings.watcher.dedupeTtlMs !== normalized) {
                    settings.watcher.dedupeTtlMs = normalized;
                    changed.push("watcher.dedupeTtlMs");
                }
            }
            if (!changed.length) {
                return;
            }
            saveMajoorSettings(settings);
            changed.forEach((key) => notifyApplied(key));
        };

        const syncWatcherRuntimeSettings = async () => {
            try {
                const res = await getWatcherSettings();
                if (!res?.ok) {
                    return;
                }
                applyWatcherSettingsFromBackend(res.data || {});
            } catch (e) { console.debug?.(e); }
        };

        safeAddSetting({
            id: `${SETTINGS_PREFIX}.Watcher.Enabled`,
            category: cat(t("cat.scanning"), t("setting.watcher.enabled.label", "Enable watcher")),
            name: t("setting.watcher.name"),
            tooltip: t("setting.watcher.desc") + " (env: MJR_ENABLE_WATCHER)",
            type: "boolean",
            defaultValue: !!settings.watcher?.enabled,
            onChange: async (value) => {
                settings.watcher = settings.watcher || {};
                settings.watcher.enabled = !!value;
                saveMajoorSettings(settings);
                notifyApplied("watcher.enabled");
                try {
                    const res = await toggleWatcher(!!value);
                    if (!res?.ok) {
                        settings.watcher.enabled = !value;
                        saveMajoorSettings(settings);
                        notifyApplied("watcher.enabled");
                        comfyToast(res?.error || t("toast.failedToggleWatcher", "Failed to toggle watcher"), "error");
                    }
                } catch {
                    settings.watcher.enabled = !value;
                    saveMajoorSettings(settings);
                    notifyApplied("watcher.enabled");
                }
            },
        });

        safeAddSetting({
            id: `${SETTINGS_PREFIX}.Watcher.DebounceDelay`,
            category: cat(t("cat.scanning"), t("setting.watcher.debounce.label", "Watcher debounce delay")),
            name: t("setting.watcher.debounce.name"),
            tooltip: t("setting.watcher.debounce.desc") + " (env: MJR_WATCHER_DEBOUNCE_MS)",
            type: "number",
            defaultValue: settings.watcher?.debounceMs ?? APP_DEFAULTS.WATCHER_DEBOUNCE_MS,
            attrs: { min: 50, max: 5000, step: 50 },
            onChange: async (value) => {
                const fallback = APP_DEFAULTS.WATCHER_DEBOUNCE_MS;
                const clamped = _clampWatcherValue(value, fallback, 50, 5000);
                const previous = settings.watcher?.debounceMs ?? fallback;
                if (clamped === previous) return;
                settings.watcher = settings.watcher || {};
                settings.watcher.debounceMs = clamped;
                saveMajoorSettings(settings);
                try {
                    const res = await updateWatcherSettings({ debounce_ms: clamped });
                    if (!res?.ok) {
                        throw new Error(res?.error || t("setting.watcher.debounce.error"));
                    }
                    const backendValue = Math.round(Number(res?.data?.debounce_ms ?? clamped));
                    settings.watcher.debounceMs = backendValue;
                    saveMajoorSettings(settings);
                    notifyApplied("watcher.debounceMs");
                } catch (error) {
                    settings.watcher.debounceMs = previous;
                    saveMajoorSettings(settings);
                    notifyApplied("watcher.debounceMs");
                    comfyToast(error?.message || t("setting.watcher.debounce.error"), "error");
                }
            },
        });

        safeAddSetting({
            id: `${SETTINGS_PREFIX}.Watcher.DedupeWindow`,
            category: cat(t("cat.scanning"), t("setting.watcher.dedupe.label", "Watcher dedupe window")),
            name: t("setting.watcher.dedupe.name"),
            tooltip: t("setting.watcher.dedupe.desc") + " (env: MJR_WATCHER_DEDUPE_TTL_MS)",
            type: "number",
            defaultValue: settings.watcher?.dedupeTtlMs ?? APP_DEFAULTS.WATCHER_DEDUPE_TTL_MS,
            attrs: { min: 100, max: 30000, step: 100 },
            onChange: async (value) => {
                const fallback = APP_DEFAULTS.WATCHER_DEDUPE_TTL_MS;
                const clamped = _clampWatcherValue(value, fallback, 100, 30000);
                const previous = settings.watcher?.dedupeTtlMs ?? fallback;
                if (clamped === previous) return;
                settings.watcher = settings.watcher || {};
                settings.watcher.dedupeTtlMs = clamped;
                saveMajoorSettings(settings);
                try {
                    const res = await updateWatcherSettings({ dedupe_ttl_ms: clamped });
                    if (!res?.ok) {
                        throw new Error(res?.error || t("setting.watcher.dedupe.error"));
                    }
                    const backendValue = Math.round(Number(res?.data?.dedupe_ttl_ms ?? clamped));
                    settings.watcher.dedupeTtlMs = backendValue;
                    saveMajoorSettings(settings);
                    notifyApplied("watcher.dedupeTtlMs");
                } catch (error) {
                    settings.watcher.dedupeTtlMs = previous;
                    saveMajoorSettings(settings);
                    notifyApplied("watcher.dedupeTtlMs");
                    comfyToast(error?.message || t("setting.watcher.dedupe.error"), "error");
                }
            },
        });

        safeAddSetting({
            id: `${SETTINGS_PREFIX}.Watcher.MaxPending`,
            category: cat(t("cat.scanning"), "Watcher queue"),
            name: "Watcher: max pending files",
            tooltip: "Maximum number of pending watcher files kept in memory.",
            type: "number",
            defaultValue: Number(settings.watcher?.maxPending ?? 500),
            attrs: { min: 10, max: 5000, step: 10 },
            onChange: (value) => {
                settings.watcher = settings.watcher || {};
                settings.watcher.maxPending = Math.max(10, Math.min(5000, Math.round(_safeNum(value, 500))));
                saveMajoorSettings(settings);
                applySettingsToConfig(settings);
                notifyApplied("watcher.maxPending");
            },
        });

        safeAddSetting({
            id: `${SETTINGS_PREFIX}.Watcher.MinSize`,
            category: cat(t("cat.scanning"), "Watcher file size"),
            name: "Watcher: min size (bytes)",
            tooltip: "Minimum file size indexed by watcher.",
            type: "number",
            defaultValue: Number(settings.watcher?.minSize ?? 100),
            attrs: { min: 0, max: 1000000, step: 100 },
            onChange: (value) => {
                settings.watcher = settings.watcher || {};
                settings.watcher.minSize = Math.max(0, Math.min(1000000, Math.round(_safeNum(value, 100))));
                saveMajoorSettings(settings);
                applySettingsToConfig(settings);
                notifyApplied("watcher.minSize");
            },
        });

        safeAddSetting({
            id: `${SETTINGS_PREFIX}.Watcher.MaxSize`,
            category: cat(t("cat.scanning"), "Watcher file size"),
            name: "Watcher: max size (bytes)",
            tooltip: "Maximum file size indexed by watcher.",
            type: "number",
            defaultValue: Number(settings.watcher?.maxSize ?? 4294967296),
            attrs: { min: 100000, max: 17179869184, step: 100000 },
            onChange: (value) => {
                settings.watcher = settings.watcher || {};
                settings.watcher.maxSize = Math.max(100000, Math.min(17179869184, Math.round(_safeNum(value, 4294967296))));
                saveMajoorSettings(settings);
                applySettingsToConfig(settings);
                notifyApplied("watcher.maxSize");
            },
        });

        try {
            syncWatcherRuntimeSettings().catch(() => {});
        } catch (e) { console.debug?.(e); }

        safeAddSetting({
            id: `${SETTINGS_PREFIX}.RatingTagsSync.Enabled`,
            category: cat(t("cat.scanning"), t("setting.sync.rating.name").replace("Majoor: ", "")),
            name: t("setting.sync.rating.name"),
            tooltip: t("setting.sync.rating.desc"),
            type: "boolean",
            defaultValue: !!settings.ratingTagsSync?.enabled,
            onChange: (value) => {
                settings.ratingTagsSync = settings.ratingTagsSync || {};
                settings.ratingTagsSync.enabled = !!value;
                saveMajoorSettings(settings);
                notifyApplied("ratingTagsSync.enabled");
            },
        });

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
                    } catch (e) { console.debug?.(e); }
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
                } catch (e) { console.debug?.(e); }
            },
        });

        registerSecurityToggle(
            "allowRemoteWrite",
            "setting.sec.remote.name",
            "setting.sec.remote.desc",
            "cat.remote"
        );

        // ──────────────────────────────────────────────
        // Section: Advanced
        // ──────────────────────────────────────────────

        const languages = getSupportedLanguages();
        const langOptions = languages.map(l => l.code);
        const languageModeOptions = ["auto", ...langOptions];
        safeAddSetting({
            id: `${SETTINGS_PREFIX}.Language`,
            category: cat(t("cat.advanced"), t("setting.language.name", "Language")),
            name: t("setting.language.name", "Majoor: Language"),
            tooltip: "Use auto to detect and follow ComfyUI language. Or choose a fixed language for Majoor only.",
            type: "combo",
            defaultValue: settings.i18n?.followComfyLanguage ? "auto" : getCurrentLang(),
            options: languageModeOptions,
            onChange: (value) => {
                settings.i18n = settings.i18n || {};
                if (value === "auto") {
                    settings.i18n.followComfyLanguage = true;
                    setFollowComfyLanguage(true);
                    initI18n(app);
                    saveMajoorSettings(settings);
                    notifyApplied("language");
                    return;
                }
                if (!langOptions.includes(value)) return;
                settings.i18n.followComfyLanguage = false;
                setFollowComfyLanguage(false);
                setLang(value);
                saveMajoorSettings(settings);
                notifyApplied("language");
            },
        });

        safeAddSetting({
            id: `${SETTINGS_PREFIX}.ProbeBackend.Mode`,
            category: cat(t("cat.advanced"), t("setting.probe.mode.name").replace("Majoor: ", "")),
            name: t("setting.probe.mode.name"),
            tooltip: t("setting.probe.mode.desc") + " (env: MAJOOR_MEDIA_PROBE_BACKEND)",
            type: "combo",
            defaultValue: settings.probeBackend?.mode || DEFAULT_SETTINGS.probeBackend.mode,
            options: ["auto", "exiftool", "ffprobe", "both"],
            onChange: (value) => {
                const mode = _safeOneOf(value, ["auto", "exiftool", "ffprobe", "both"], DEFAULT_SETTINGS.probeBackend.mode);
                settings.probeBackend = settings.probeBackend || {};
                settings.probeBackend.mode = mode;
                saveMajoorSettings(settings);
                applySettingsToConfig(settings);
                notifyApplied("probeBackend.mode");
                setProbeBackendMode(mode).catch(() => {});
            },
        });

        safeAddSetting({
            id: `${SETTINGS_PREFIX}.MetadataFallback.Image`,
            category: cat(t("cat.advanced"), "Metadata"),
            name: "Majoor: Metadata Fallback (Images)",
            tooltip: "Enable Pillow fallback when ExifTool is missing or fails.",
            type: "boolean",
            defaultValue: settings.metadataFallback?.image ?? DEFAULT_SETTINGS.metadataFallback.image,
            onChange: async (value) => {
                const next = !!value;
                const previous = !!(settings.metadataFallback?.image ?? DEFAULT_SETTINGS.metadataFallback.image);
                settings.metadataFallback = settings.metadataFallback || {};
                settings.metadataFallback.image = next;
                saveMajoorSettings(settings);
                notifyApplied("metadataFallback.image");
                try {
                    const res = await setMetadataFallbackSettings({
                        image: next,
                        media: settings.metadataFallback?.media ?? DEFAULT_SETTINGS.metadataFallback.media,
                    });
                    if (!res?.ok) throw new Error(res?.error || t("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"));
                } catch (error) {
                    settings.metadataFallback.image = previous;
                    saveMajoorSettings(settings);
                    notifyApplied("metadataFallback.image");
                    comfyToast(error?.message || t("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"), "error");
                }
            },
        });

        safeAddSetting({
            id: `${SETTINGS_PREFIX}.MetadataFallback.Media`,
            category: cat(t("cat.advanced"), "Metadata"),
            name: "Majoor: Metadata Fallback (Audio/Video)",
            tooltip: "Enable hachoir fallback when ffprobe is missing or fails.",
            type: "boolean",
            defaultValue: settings.metadataFallback?.media ?? DEFAULT_SETTINGS.metadataFallback.media,
            onChange: async (value) => {
                const next = !!value;
                const previous = !!(settings.metadataFallback?.media ?? DEFAULT_SETTINGS.metadataFallback.media);
                settings.metadataFallback = settings.metadataFallback || {};
                settings.metadataFallback.media = next;
                saveMajoorSettings(settings);
                notifyApplied("metadataFallback.media");
                try {
                    const res = await setMetadataFallbackSettings({
                        image: settings.metadataFallback?.image ?? DEFAULT_SETTINGS.metadataFallback.image,
                        media: next,
                    });
                    if (!res?.ok) throw new Error(res?.error || t("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"));
                } catch (error) {
                    settings.metadataFallback.media = previous;
                    saveMajoorSettings(settings);
                    notifyApplied("metadataFallback.media");
                    comfyToast(error?.message || t("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"), "error");
                }
            },
        });

        try {
            getMetadataFallbackSettings()
                .then((res) => {
                    if (!res?.ok || !res?.data?.prefs) return;
                    const prefs = res.data.prefs || {};
                    const image = !!(prefs.image ?? DEFAULT_SETTINGS.metadataFallback.image);
                    const media = !!(prefs.media ?? DEFAULT_SETTINGS.metadataFallback.media);
                    settings.metadataFallback = settings.metadataFallback || {};
                    let changed = false;
                    if (settings.metadataFallback.image !== image) {
                        settings.metadataFallback.image = image;
                        changed = true;
                    }
                    if (settings.metadataFallback.media !== media) {
                        settings.metadataFallback.media = media;
                        changed = true;
                    }
                    if (changed) {
                        saveMajoorSettings(settings);
                        notifyApplied("metadataFallback");
                    }
                })
                .catch(() => {});
        } catch (e) { console.debug?.(e); }

        let _outputDirCommittedValue = String(settings.paths?.outputDirectory || "");
        let _outputDirSaveTimer = null;
        let _outputDirSaveSeq = 0;
        let _outputDirSaveAbort = null;

        safeAddSetting({
            id: `${SETTINGS_PREFIX}.Paths.OutputDirectory`,
            category: cat(t("cat.advanced"), "Paths"),
            name: "Majoor: Output Directory Override",
            tooltip: "Override ComfyUI output directory used by Majoor (equivalent to --output-directory). Leave empty to keep current backend default.",
            type: "text",
            defaultValue: String(settings.paths?.outputDirectory || ""),
            attrs: {
                placeholder: "D:\\\\____COMFY_OUTPUTS",
            },
            onChange: async (value) => {
                const next = String(value || "").trim();
                settings.paths = settings.paths || {};
                settings.paths.outputDirectory = next;
                saveMajoorSettings(settings);

                // The Comfy settings text input can fire on each keystroke.
                // Debounce + cancel in-flight requests to prevent backend/UI stalls.
                try {
                    if (_outputDirSaveTimer) {
                        clearTimeout(_outputDirSaveTimer);
                        _outputDirSaveTimer = null;
                    }
                } catch (e) { console.debug?.(e); }
                _outputDirSaveTimer = setTimeout(async () => {
                    _outputDirSaveTimer = null;
                    const seq = ++_outputDirSaveSeq;
                    try {
                        _outputDirSaveAbort?.abort?.();
                    } catch (e) { console.debug?.(e); }
                    _outputDirSaveAbort = typeof AbortController !== "undefined" ? new AbortController() : null;
                    try {
                        const res = await setOutputDirectorySetting(
                            next,
                            _outputDirSaveAbort ? { signal: _outputDirSaveAbort.signal } : {}
                        );
                        if (seq !== _outputDirSaveSeq) return;
                        if (!res?.ok) {
                            throw new Error(res?.error || t("toast.failedSetOutputDirectory", "Failed to set output directory"));
                        }
                        const serverValue = String(res?.data?.output_directory || next).trim();
                        settings.paths.outputDirectory = serverValue;
                        _outputDirCommittedValue = serverValue;
                        saveMajoorSettings(settings);
                        notifyApplied("paths.outputDirectory");
                    } catch (error) {
                        if (seq !== _outputDirSaveSeq) return;
                        const aborted = String(error?.name || "") === "AbortError" || String(error?.code || "") === "ABORTED";
                        if (aborted) return;
                        settings.paths.outputDirectory = _outputDirCommittedValue;
                        saveMajoorSettings(settings);
                        notifyApplied("paths.outputDirectory");
                        comfyToast(error?.message || t("toast.failedSetOutputDirectory", "Failed to set output directory"), "error");
                    }
                }, 700);
            },
        });

        try {
            getOutputDirectorySetting()
                .then((res) => {
                    if (!res?.ok) return;
                    const serverValue = String(res?.data?.output_directory || "").trim();
                    settings.paths = settings.paths || {};
                    if (settings.paths.outputDirectory !== serverValue) {
                        settings.paths.outputDirectory = serverValue;
                        _outputDirCommittedValue = serverValue;
                        saveMajoorSettings(settings);
                        notifyApplied("paths.outputDirectory");
                    }
                })
                .catch(() => {});
        } catch (e) { console.debug?.(e); }

        safeAddSetting({
            id: `${SETTINGS_PREFIX}.Db.Timeout`,
            category: cat(t("cat.advanced"), "Database"),
            name: "DB Timeout (ms)",
            tooltip: "Client-side DB timeout preference (stored locally).",
            type: "number",
            defaultValue: Number(settings.db?.timeoutMs || 5000),
            attrs: { min: 1000, max: 30000, step: 1000 },
            onChange: (value) => {
                settings.db = settings.db || {};
                settings.db.timeoutMs = Math.max(1000, Math.min(30000, Math.round(_safeNum(value, 5000))));
                saveMajoorSettings(settings);
                applySettingsToConfig(settings);
                notifyApplied("db.timeoutMs");
            },
        });

        safeAddSetting({
            id: `${SETTINGS_PREFIX}.Db.MaxConnections`,
            category: cat(t("cat.advanced"), "Database"),
            name: "DB Max Connections",
            tooltip: "Client-side DB max connections preference (stored locally).",
            type: "number",
            defaultValue: Number(settings.db?.maxConnections || 10),
            attrs: { min: 1, max: 100, step: 1 },
            onChange: (value) => {
                settings.db = settings.db || {};
                settings.db.maxConnections = Math.max(1, Math.min(100, Math.round(_safeNum(value, 10))));
                saveMajoorSettings(settings);
                applySettingsToConfig(settings);
                notifyApplied("db.maxConnections");
            },
        });

        safeAddSetting({
            id: `${SETTINGS_PREFIX}.Db.QueryTimeout`,
            category: cat(t("cat.advanced"), "Database"),
            name: "DB Query Timeout (ms)",
            tooltip: "Client-side DB query timeout preference (stored locally).",
            type: "number",
            defaultValue: Number(settings.db?.queryTimeoutMs || 1000),
            attrs: { min: 500, max: 10000, step: 500 },
            onChange: (value) => {
                settings.db = settings.db || {};
                settings.db.queryTimeoutMs = Math.max(500, Math.min(10000, Math.round(_safeNum(value, 1000))));
                saveMajoorSettings(settings);
                applySettingsToConfig(settings);
                notifyApplied("db.queryTimeoutMs");
            },
        });

        safeAddSetting({
            id: `${SETTINGS_PREFIX}.Observability.Enabled`,
            category: cat(t("cat.advanced"), t("setting.obs.enabled.name").replace("Majoor: ", "")),
            name: t("setting.obs.enabled.name"),
            tooltip: t("setting.obs.enabled.desc"),
            type: "boolean",
            defaultValue: !!settings.observability?.enabled,
            onChange: (value) => {
                settings.observability = settings.observability || {};
                settings.observability.enabled = !!value;
                saveMajoorSettings(settings);
                applySettingsToConfig(settings);
                notifyApplied("observability.enabled");
            },
        });

        safeAddSetting({
            id: `${SETTINGS_PREFIX}.Observability.VerboseErrors`,
            category: cat(t("cat.advanced"), "Verbose error logging"),
            name: "Verbose error logging",
            tooltip: "Show detailed error messages in toasts and console. Useful for debugging.",
            type: "boolean",
            defaultValue: !!settings.observability?.verboseErrors,
            onChange: (value) => {
                settings.observability = settings.observability || {};
                settings.observability.verboseErrors = !!value;
                saveMajoorSettings(settings);
                applySettingsToConfig(settings);
                notifyApplied("observability.verboseErrors");
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

