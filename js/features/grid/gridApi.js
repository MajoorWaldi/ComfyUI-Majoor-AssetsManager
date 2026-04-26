import { APP_CONFIG } from "../../app/config.js";

function ensureGridSettingsStyles() {
    const styleId = "mjr-grid-settings-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
        .mjr-grid .mjr-asset-card,
        .mjr-grid .mjr-card {
            display: flex;
            flex-direction: column;
        }
        .mjr-grid .mjr-thumb {
            flex: 1;
            min-height: 0;
            position: relative;
            overflow: hidden;
        }
        .mjr-grid .mjr-thumb-media {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }

        .mjr-grid .mjr-asset-card:hover {
            background-color: var(--mjr-card-hover-color) !important;
        }

        .mjr-grid .mjr-asset-card.is-selected {
            outline: 2px solid var(--mjr-card-selection-color) !important;
            box-shadow: 0 0 0 2px var(--mjr-card-selection-color) !important;
        }

        .mjr-grid .mjr-card-filename { display: none; }
        .mjr-grid.mjr-show-filename .mjr-card-filename { display: block; }

        .mjr-grid .mjr-card-dot-wrapper { display: none; }
        .mjr-grid.mjr-show-dot .mjr-card-dot-wrapper { display: inline-flex; }
        .mjr-grid .mjr-asset-status-dot {
            transition: color 0.3s ease, opacity 0.3s ease;
        }
        .mjr-grid .mjr-asset-status-dot.mjr-pulse-animation {
            animation: mjr-pulse 1.5s infinite;
        }
        @keyframes mjr-pulse {
            0% { opacity: 1; }
            50% { opacity: 0.4; }
            100% { opacity: 1; }
        }

        .mjr-grid .mjr-meta-res { display: none; }
        .mjr-grid.mjr-show-dimensions .mjr-meta-res { display: inline; }

        .mjr-grid .mjr-meta-duration { display: none; }
        .mjr-grid.mjr-show-dimensions .mjr-meta-duration { display: inline; }

        .mjr-grid .mjr-meta-date { display: none; }
        .mjr-grid.mjr-show-date .mjr-meta-date { display: inline; }

        .mjr-grid .mjr-meta-gentime { display: none; }
        .mjr-grid.mjr-show-gentime .mjr-meta-gentime { display: inline; }

        .mjr-grid .mjr-badge-ext { display: none !important; }
        .mjr-grid.mjr-show-badges-ext .mjr-badge-ext { display: flex !important; }

        .mjr-grid .mjr-badge-rating { display: none !important; }
        .mjr-grid.mjr-show-badges-rating .mjr-badge-rating { display: flex !important; }

        .mjr-grid .mjr-badge-tags { display: none !important; }
        .mjr-grid.mjr-show-badges-tags .mjr-badge-tags { display: flex !important; }

        .mjr-grid .mjr-card-info { display: none !important; }
        .mjr-grid.mjr-show-details .mjr-card-info { display: block !important; }

        .mjr-card-meta-row > span + span::before {
            content: " • ";
            opacity: 0.5;
            margin: 0 4px;
        }
        .mjr-card-meta-row > span[style*="display: none"] + span::before {
            display: none;
        }
    `;
    document.head.appendChild(style);
}

export function applyGridSettingsClasses(container) {
    if (!container) return;

    ensureGridSettingsStyles();

    const toggle = (cls, enabled) => {
        if (enabled) container.classList.add(cls);
        else container.classList.remove(cls);
    };

    toggle("mjr-show-filename", APP_CONFIG.GRID_SHOW_DETAILS_FILENAME);
    toggle("mjr-show-dimensions", APP_CONFIG.GRID_SHOW_DETAILS_DIMENSIONS);
    toggle("mjr-show-date", APP_CONFIG.GRID_SHOW_DETAILS_DATE);
    toggle("mjr-show-gentime", APP_CONFIG.GRID_SHOW_DETAILS_GENTIME);
    toggle("mjr-show-hover-info", APP_CONFIG.GRID_SHOW_HOVER_INFO);
    toggle("mjr-show-dot", APP_CONFIG.GRID_SHOW_WORKFLOW_DOT);

    toggle("mjr-show-badges-ext", APP_CONFIG.GRID_SHOW_BADGES_EXTENSION);
    toggle("mjr-show-badges-rating", APP_CONFIG.GRID_SHOW_BADGES_RATING);
    toggle("mjr-show-badges-tags", APP_CONFIG.GRID_SHOW_BADGES_TAGS);
    toggle("mjr-show-details", APP_CONFIG.GRID_SHOW_DETAILS);

    container.style.setProperty("--mjr-grid-min-size", `${APP_CONFIG.GRID_MIN_SIZE}px`);
    container.style.setProperty("--mjr-grid-gap", `${APP_CONFIG.GRID_GAP}px`);
    container.style.setProperty("--mjr-star-active", APP_CONFIG.BADGE_STAR_COLOR);
    container.style.setProperty("--mjr-badge-image", APP_CONFIG.BADGE_IMAGE_COLOR);
    container.style.setProperty("--mjr-badge-video", APP_CONFIG.BADGE_VIDEO_COLOR);
    container.style.setProperty("--mjr-badge-audio", APP_CONFIG.BADGE_AUDIO_COLOR);
    container.style.setProperty("--mjr-badge-model3d", APP_CONFIG.BADGE_MODEL3D_COLOR);
    container.style.setProperty(
        "--mjr-badge-duplicate-alert",
        APP_CONFIG.BADGE_DUPLICATE_ALERT_COLOR,
    );
    container.style.setProperty("--mjr-card-hover-color", APP_CONFIG.UI_CARD_HOVER_COLOR);
    container.style.setProperty(
        "--mjr-card-selection-color",
        APP_CONFIG.UI_CARD_SELECTION_COLOR,
    );
    container.style.setProperty("--mjr-rating-color", APP_CONFIG.UI_RATING_COLOR);
    container.style.setProperty("--mjr-tag-color", APP_CONFIG.UI_TAG_COLOR);
}

export function configureGridContainer(
    container,
    { applySettingsClasses = true } = {},
) {
    if (!container) return null;

    container.id = "mjr-assets-grid";
    container.classList.add("mjr-grid");
    container.tabIndex = 0;
    container.setAttribute("role", "grid");

    if (applySettingsClasses) {
        applyGridSettingsClasses(container);

        const onSettingsChanged = () => {
            requestAnimationFrame(() => {
                applyGridSettingsClasses(container);
            });
        };

        try {
            container._mjrSettingsChangedCleanup?.();
        } catch (e) {
            console.debug?.(e);
        }
        window.addEventListener("mjr-settings-changed", onSettingsChanged);
        container._mjrSettingsChangedCleanup = () => {
            try {
                window.removeEventListener("mjr-settings-changed", onSettingsChanged);
            } catch (e) {
                console.debug?.(e);
            }
        };
    }

    return container;
}

export function createGridContainer(options = {}) {
    const container = document.createElement("div");
    return configureGridContainer(container, options);
}

function callGrid(container, method, ...args) {
    const apiMethodByLegacy = {
        _mjrCaptureAnchor: "captureAnchor",
        _mjrDispose: "dispose",
        _mjrHydrateFromSnapshot: "hydrateFromSnapshot",
        _mjrLoadAssets: "reload",
        _mjrLoadAssetsFromList: "loadAssetsFromList",
        _mjrPrepareForScopeSwitch: "prepareForScopeSwitch",
        _mjrRefreshGrid: "refreshGrid",
        _mjrRemoveAssets: "removeAssets",
        _mjrRestoreAnchor: "restoreAnchor",
        _mjrUpsertAsset: "upsertRealtime",
        _mjrUpsertAssetNow: "upsertRealtimeNow",
    };
    try {
        const apiMethod = apiMethodByLegacy[method];
        const apiFn = apiMethod ? container?._mjrGridApi?.[apiMethod] : null;
        if (typeof apiFn === "function") {
            return apiFn(...args);
        }
        const fn = container?.[method];
        if (typeof fn === "function") {
            return fn(...args);
        }
    } catch (e) {
        console.debug?.(e);
    }
    return undefined;
}

export function hydrateGridFromSnapshot(gridContainer, parts = {}, options = {}) {
    return callGrid(gridContainer, "_mjrHydrateFromSnapshot", parts, options) ?? false;
}

export function loadAssets(gridContainer, query = "*", options = {}) {
    return (
        callGrid(gridContainer, "_mjrLoadAssets", query, options) ??
        Promise.resolve({ ok: false, error: "Grid API unavailable" })
    );
}

export function loadAssetsFromList(gridContainer, assets, options = {}) {
    return (
        callGrid(gridContainer, "_mjrLoadAssetsFromList", assets, options) ??
        Promise.resolve({ ok: false, error: "Grid API unavailable" })
    );
}

export function prepareGridForScopeSwitch(gridContainer) {
    return callGrid(gridContainer, "_mjrPrepareForScopeSwitch");
}

export function disposeGrid(gridContainer) {
    try {
        gridContainer?._mjrSettingsChangedCleanup?.();
    } catch (e) {
        console.debug?.(e);
    }
    return callGrid(gridContainer, "_mjrDispose");
}

export function refreshGrid(gridContainer) {
    return callGrid(gridContainer, "_mjrRefreshGrid");
}

export function captureAnchor(gridContainer) {
    return callGrid(gridContainer, "_mjrCaptureAnchor") ?? null;
}

export function restoreAnchor(gridContainer, anchor) {
    return callGrid(gridContainer, "_mjrRestoreAnchor", anchor);
}

export function removeAssetsFromGrid(gridContainer, assetIds, options = {}) {
    return (
        callGrid(gridContainer, "_mjrRemoveAssets", assetIds, options) ?? {
            ok: false,
            removed: 0,
            selectedIds: [],
        }
    );
}

export function upsertAsset(gridContainer, asset) {
    return !!callGrid(gridContainer, "_mjrUpsertAsset", asset);
}

export function upsertAssetNow(gridContainer, asset) {
    return !!callGrid(gridContainer, "_mjrUpsertAssetNow", asset);
}

export function bindGridScanListeners() {}
export function disposeGridScanListeners() {}
