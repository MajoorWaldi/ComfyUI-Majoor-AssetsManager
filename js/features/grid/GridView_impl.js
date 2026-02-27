/**
 * Grid View Feature - Asset grid display
 */

import { get, hydrateAssetRatingTags } from "../../api/client.js";
import { buildListURL } from "../../api/endpoints.js";
import { createAssetCard, cleanupVideoThumbsIn, cleanupCardMediaHandlers } from "../../components/Card.js";
import { createFolderCard } from "../../components/FolderCard.js";
import { createRatingBadge, createTagsBadge, setFileBadgeCollision } from "../../components/Badges.js";
import { APP_CONFIG } from "../../app/config.js";
import { getViewerInstance } from "../../components/Viewer.js";
// Context menus are bound by the panel (GridContextMenu) to avoid duplicate handlers.
import { ASSET_RATING_CHANGED_EVENT, ASSET_TAGS_CHANGED_EVENT } from "../../app/events.js";
import { safeDispatchCustomEvent } from "../../utils/events.js";
import { debounce } from "../../utils/debounce.js";
import { pickRootId } from "../../utils/ids.js";
import { bindAssetDragStart } from "../dnd/DragDrop.js";
import { loadMajoorSettings } from "../../app/settings.js";
import { VirtualGrid } from "./VirtualGrid.js";
import { installGridKeyboard } from "./GridKeyboard.js";
import {
    enqueueRatingTagsHydration as rtEnqueueRatingTagsHydration,
    getRtHydrateState as rtGetRtHydrateState,
    pruneRatingTagsHydrateSeen as rtPruneRatingTagsHydrateSeen,
    pumpRatingTagsHydration as rtPumpRatingTagsHydration,
    updateCardRatingTagsBadges as rtUpdateCardRatingTagsBadges,
} from "./RatingTagsHydrator.js";
import {
    getSelectedIdSet as selectionGetSelectedIdSet,
    safeEscapeId as selectionSafeEscapeId,
    setSelectedIdsDataset as selectionSetSelectedIdsDataset,
    setSelectionIds as selectionSetSelectionIds,
    syncSelectionClasses as selectionSyncSelectionClasses,
} from "./GridSelectionManager.js";
import {
    captureScrollMetrics as vsCaptureScrollMetrics,
    ensureSentinel as vsEnsureSentinel,
    ensureVirtualGrid as vsEnsureVirtualGrid,
    getScrollContainer as vsGetScrollContainer,
    isPotentialScrollContainer as vsIsPotentialScrollContainer,
    maybeKeepPinnedToBottom as vsMaybeKeepPinnedToBottom,
    startInfiniteScroll as vsStartInfiniteScroll,
    stopObserver as vsStopObserver,
    detectScrollRoot as vsDetectScrollRoot,
} from "./VirtualScroller.js";
import {
    appendAssets as cardAppendAssets,
    buildCollisionPaths as cardBuildCollisionPaths,
    detectKind as cardDetectKind,
    getExtUpper as cardGetExtUpper,
    getFilenameKey as cardGetFilenameKey,
    getStemLower as cardGetStemLower,
    isHidePngSiblingsEnabled as cardIsHidePngSiblingsEnabled,
    setCollisionTooltip as cardSetCollisionTooltip,
} from "./AssetCardRenderer.js";
import {
    compareAssets as infCompareAssets,
    fetchPage as infFetchPage,
    findAssetElement as infFindAssetElement,
    findInsertPosition as infFindInsertPosition,
    flushUpsertBatch as infFlushUpsertBatch,
    getSortValue as infGetSortValue,
    loadNextPage as infLoadNextPage,
    shouldInsertBefore as infShouldInsertBefore,
    upsertAsset as infUpsertAsset,
} from "./InfiniteScroll.js";

/**
 * Strict typing for State management
 * @typedef {Object} GridState
 * @property {string} query Current search string
 * @property {number} offset Pagination offset
 * @property {number|null} total Total items on server
 * @property {boolean} loading Is fetch in progress
 * @property {boolean} done Is pagination exhausted
 * @property {Set<string>} seenKeys Identifiers to prevent duplicates
 * @property {Array<Object>} assets Array of Asset objects (Data Store)
 * @property {Map<string, number>} filenameCounts Collision detection map
 * @property {Set<string>} nonImageStems Logic for hiding PNG siblings
 * @property {Map<string, Array<Object>>} stemMap Logic for hiding PNG siblings
 * @property {Map<string, Array<HTMLElement>>} renderedFilenameMap Live DOM references
 * @property {VirtualGrid|null} virtualGrid The virtual renderer instance
 * @property {HTMLElement|null} sentinel Infinite scroll trigger
 * @property {IntersectionObserver|null} observer Infinite scroll observer
 */
/** @type {WeakMap<HTMLElement, GridState>} */
const GRID_STATE = new WeakMap();

const RT_HYDRATE_CONCURRENCY = APP_CONFIG.RT_HYDRATE_CONCURRENCY ?? 2;
const RT_HYDRATE_QUEUE_MAX = APP_CONFIG.RT_HYDRATE_QUEUE_MAX ?? 100;
const RT_HYDRATE_SEEN_MAX = APP_CONFIG.RT_HYDRATE_SEEN_MAX ?? 20000;
const RT_HYDRATE_SEEN_TTL_MS = APP_CONFIG.RT_HYDRATE_SEEN_TTL_MS ?? (10 * 60 * 1000);
// RT_HYDRATE_STATE remains as the per-grid state map
const RT_HYDRATE_STATE = new WeakMap(); // gridContainer -> { queue, inflight, seen, active, lastPruneAt }

// ─────────────────────────────────────────────────────────────────────────────
// Upsert Batching - Accumulate upserts and flush once for performance
// ─────────────────────────────────────────────────────────────────────────────
const UPSERT_BATCH_DEBOUNCE_MS = 200;    // Debounce window for batch flush
const UPSERT_BATCH_MAX_SIZE = 50;        // Max items before forced flush
const UPSERT_BATCH_STATE = new WeakMap(); // gridContainer -> { pending: Map<id, asset>, timer: number|null }

// Temporary debug logging for grid + infinite scroll.
// Enable at runtime from the browser console:
//   globalThis._mjrDebugGrid = true
const _gridDebugEnabled = () => {
    try {
        return !!globalThis?._mjrDebugGrid;
    } catch {
        return false;
    }
};

const gridDebug = (...args) => {
    try {
        if (!_gridDebugEnabled()) return;
        console.log("[Majoor][Grid]", ...args);
    } catch (e) { console.debug?.(e); }
};

function _getRenderedCards(gridContainer) {
    if (!gridContainer) return [];
    try {
        if (typeof gridContainer._mjrGetRenderedCards === "function") {
            const cards = gridContainer._mjrGetRenderedCards();
            if (Array.isArray(cards)) return cards;
        }
    } catch (e) { console.debug?.(e); }
    try {
        return Array.from(gridContainer.querySelectorAll(".mjr-asset-card"));
    } catch {
        return [];
    }
}

/**
 * Get hydration state for a grid.
 * @param {HTMLElement} gridContainer
 * @returns {{queue: any[], inflight: number, seen: Set<string>, active: Set<string>, lastPruneAt: number}|null}
 */
function _getRtHydrateState(gridContainer) {
    return rtGetRtHydrateState(gridContainer, RT_HYDRATE_STATE);
}

function _rtPruneBudgetRef(st) {
    return {
        get value() {
            return Number(st?.pruneBudget || 0) || 0;
        },
        set value(v) {
            try {
                st.pruneBudget = Number(v) || 0;
            } catch (e) { console.debug?.(e); }
        },
    };
}

function pruneRatingTagsHydrateSeen(st) {
    return rtPruneRatingTagsHydrateSeen(st, RT_HYDRATE_SEEN_MAX, RT_HYDRATE_SEEN_TTL_MS, _rtPruneBudgetRef(st));
}

function _updateCardRatingTagsBadges(card, rating, tags) {
    return rtUpdateCardRatingTagsBadges(card, rating, tags, { createRatingBadge, createTagsBadge });
}

function _pumpRatingTagsHydration(gridContainer) {
    return rtPumpRatingTagsHydration(gridContainer, {
        stateMap: RT_HYDRATE_STATE,
        concurrency: RT_HYDRATE_CONCURRENCY,
        hydrateAssetRatingTags,
        createRatingBadge,
        createTagsBadge,
        safeDispatchCustomEvent,
        events: { rating: ASSET_RATING_CHANGED_EVENT, tags: ASSET_TAGS_CHANGED_EVENT },
    });
}

function enqueueRatingTagsHydration(gridContainer, card, asset) {
    const st = _getRtHydrateState(gridContainer);
    return rtEnqueueRatingTagsHydration(gridContainer, card, asset, {
        stateMap: RT_HYDRATE_STATE,
        queueMax: RT_HYDRATE_QUEUE_MAX,
        seenMax: RT_HYDRATE_SEEN_MAX,
        seenTtlMs: RT_HYDRATE_SEEN_TTL_MS,
        pruneBudgetRef: _rtPruneBudgetRef(st),
        concurrency: RT_HYDRATE_CONCURRENCY,
        hydrateAssetRatingTags,
        createRatingBadge,
        createTagsBadge,
        safeDispatchCustomEvent,
        events: { rating: ASSET_RATING_CHANGED_EVENT, tags: ASSET_TAGS_CHANGED_EVENT },
    });
}

/**
 * Update grid CSS classes based on current settings.
 * Allows instant toggling of card elements (Filename, Dimensions, etc.) via CSS
 * without rebuilding the DOM.
 */
function _updateGridSettingsClasses(container) {
    if (!container) return;

    // Inject dynamic styles if not present (ensures reactivity behaves correctly)
    const styleId = "mjr-grid-settings-styles";
    if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
            /* Reactive visibility toggles */
            /* Ensure card uses flex column to fill space when info is hidden */
            .mjr-grid .mjr-asset-card,
            .mjr-grid .mjr-card {
                display: flex;
                flex-direction: column;
            }
            /* Thumb grows to fill available space */
            .mjr-grid .mjr-thumb {
                flex: 1;
                min-height: 0;
                position: relative;
                overflow: hidden;
            }
            /* Ensure media fills the thumb container */
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

            /* Info container management */
            /* Default to hidden to prevent flash or "black box" if js is slow */
            .mjr-grid .mjr-card-info { display: none !important; }
            /* Only show when explicitly enabled */
            .mjr-grid.mjr-show-details .mjr-card-info { display: block !important; }

            /* Separator management (experimental) */
            /* If we want separators like " • ", we can use CSS pseudo-elements instead of text nodes */
            .mjr-card-meta-row > span + span::before {
                content: " • ";
                opacity: 0.5;
                margin: 0 4px;
            }
            /* Hide separator if previous element is hidden */
            .mjr-card-meta-row > span[style*="display: none"] + span::before {
                 display: none;
            }
        `;
        document.head.appendChild(style);
    }

    // Helper to toggle class based on config bool
    const toggle = (cls, enabled) => {
        if (enabled) container.classList.add(cls);
        else container.classList.remove(cls);
    };

    toggle("mjr-show-filename", APP_CONFIG.GRID_SHOW_DETAILS_FILENAME);
    toggle("mjr-show-dimensions", APP_CONFIG.GRID_SHOW_DETAILS_DIMENSIONS);
    toggle("mjr-show-date", APP_CONFIG.GRID_SHOW_DETAILS_DATE);
    toggle("mjr-show-gentime", APP_CONFIG.GRID_SHOW_DETAILS_GENTIME);
    // toggle("mjr-show-time", APP_CONFIG.GRID_SHOW_DETAILS_TIME); // If we add explicit time setting
    toggle("mjr-show-dot", APP_CONFIG.GRID_SHOW_WORKFLOW_DOT);

    toggle("mjr-show-badges-ext", APP_CONFIG.GRID_SHOW_BADGES_EXTENSION);
    toggle("mjr-show-badges-rating", APP_CONFIG.GRID_SHOW_BADGES_RATING);
    toggle("mjr-show-badges-tags", APP_CONFIG.GRID_SHOW_BADGES_TAGS);

    // Overall details vs generic show
    toggle("mjr-show-details", APP_CONFIG.GRID_SHOW_DETAILS);

    // Helper for CSS vars
    container.style.setProperty("--mjr-grid-min-size", `${APP_CONFIG.GRID_MIN_SIZE}px`);
    container.style.setProperty("--mjr-grid-gap", `${APP_CONFIG.GRID_GAP}px`);
    // Fallback color vars on grid root so cards/badges always inherit even if parent scope differs.
    container.style.setProperty("--mjr-star-active", APP_CONFIG.BADGE_STAR_COLOR);
    container.style.setProperty("--mjr-badge-image", APP_CONFIG.BADGE_IMAGE_COLOR);
    container.style.setProperty("--mjr-badge-video", APP_CONFIG.BADGE_VIDEO_COLOR);
    container.style.setProperty("--mjr-badge-audio", APP_CONFIG.BADGE_AUDIO_COLOR);
    container.style.setProperty("--mjr-badge-model3d", APP_CONFIG.BADGE_MODEL3D_COLOR);
    container.style.setProperty("--mjr-badge-duplicate-alert", APP_CONFIG.BADGE_DUPLICATE_ALERT_COLOR);
    container.style.setProperty("--mjr-card-hover-color", APP_CONFIG.UI_CARD_HOVER_COLOR);
    container.style.setProperty("--mjr-card-selection-color", APP_CONFIG.UI_CARD_SELECTION_COLOR);
    container.style.setProperty("--mjr-rating-color", APP_CONFIG.UI_RATING_COLOR);
    container.style.setProperty("--mjr-tag-color", APP_CONFIG.UI_TAG_COLOR);
}

/**
 * Create grid container
 * @returns {HTMLElement} The configured grid container
 */
export function createGridContainer() {
    const container = document.createElement("div");
    container.id = "mjr-assets-grid";
    container.classList.add("mjr-grid");
    container.tabIndex = 0;
    container.setAttribute("role", "grid");

    // Provide a stable accessor for full asset lists (VirtualGrid-safe).
    try {
        container._mjrGetAssets = () => {
            try {
                const state = GRID_STATE.get(container);
                return Array.isArray(state?.assets) ? state.assets : [];
            } catch {
                return [];
            }
        };
    } catch (e) { console.debug?.(e); }
    try {
        container._mjrSetSelection = (ids, activeId = "") => setSelectionIds(container, ids, { activeId });
        container._mjrRemoveAssets = (assetIds, options = {}) => removeAssetsFromGrid(container, assetIds, options);
        container._mjrSyncSelection = (ids) => syncSelectionClasses(container, ids);
        container._mjrGetRenderedCards = () => {
            try {
                const state = GRID_STATE.get(container);
                return state?.virtualGrid?.getRenderedCards?.() || [];
            } catch {
                return [];
            }
        };
        container._mjrScrollToAssetId = (assetId) => {
            const id = String(assetId || "").trim();
            if (!id) return;
            const state = GRID_STATE.get(container);
            if (!state?.virtualGrid || !Array.isArray(state.assets)) return;
            const idx = state.assets.findIndex(a => String(a?.id || "") === id);
            if (idx >= 0) state.virtualGrid.scrollToIndex(idx);
        };
    } catch (e) { console.debug?.(e); }

    // Initial class application
    _updateGridSettingsClasses(container);

    // Listen for settings changes to update CSS classes reactively
    const SETTINGS_REFRESH_DEBOUNCE_MS = 180;
    const scheduleSettingsRefresh = debounce(() => {
        refreshGrid(container);
    }, SETTINGS_REFRESH_DEBOUNCE_MS);
    const onSettingsChanged = () => {
        // Apply class/CSS var updates immediately (cheap) for responsive UI.
        requestAnimationFrame(() => {
            _updateGridSettingsClasses(container);
        });

        // Heavy virtual-grid redraw is debounced to avoid picker-drag freeze.
        scheduleSettingsRefresh();
    };

    // We bind to the custom event dispatched by settings.js
    // Note: The event is dispatched on `window` usually via safeDispatchCustomEvent
    try {
        window.addEventListener("mjr-settings-changed", onSettingsChanged);
        // Store cleanup function on container for disposeGrid
        container._mjrSettingsChangedCleanup = () => {
            try {
                window.removeEventListener("mjr-settings-changed", onSettingsChanged);
            } catch (e) { console.debug?.(e); }
        };
    } catch (e) { console.debug?.(e); }

    // Bind delegated dragstart once (avoid per-card listeners; improves load perf on large grids).
    try {
        bindAssetDragStart(container);
    } catch (e) { console.debug?.(e); }

    // Install grid keyboard shortcuts
    try {
        const kbd = installGridKeyboard({
            gridContainer: container,
            getState: () => GRID_STATE.get(container) || {},
            getSelectedAssets: () => {
                try {
                    const state = GRID_STATE.get(container);
                    if (state?.assets) {
                        const ids = getSelectedIdSet(container);
                        return state.assets.filter(a => ids.has(String(a.id)));
                    }
                    return _getRenderedCards(container)
                        .filter((c) => c?.classList?.contains?.("is-selected"))
                        .map(c => c?._mjrAsset)
                        .filter(Boolean);
                } catch { return []; }
            },
            getActiveAsset: () => {
                // @ts-ignore
                return document.activeElement?.closest?.('.mjr-asset-card')?._mjrAsset || null;
            },
            onAssetChanged: (asset) => {
                 if (!asset?.id) return;
                 const id = String(asset.id);
                 const cards = _getRenderedCards(container);
                 for (const card of cards) {
                     // @ts-ignore
                     if (String(card?._mjrAsset?.id) === id) {
                         // @ts-ignore
                         _updateCardRatingTagsBadges(card, asset.rating, asset.tags);
                     }
                 }
            },
            onOpenDetails: () => {
                 safeDispatchCustomEvent('mjr:open-sidebar', { tab: 'details' });
            },
            getViewer: getViewerInstance,
        });
        kbd.bind();
        // @ts-ignore
        container._mjrGridKeyboard = kbd;
    } catch (e) {
        gridDebug("keyboard:installFailed", e);
    }

    // Bind double-click to open viewer
    container.addEventListener('dblclick', (e) => {
        /** @type {HTMLElement} */
        // @ts-ignore
        const card = e.target.closest('.mjr-asset-card');
        if (!card) return;

        /** @type {Object} */
        // @ts-ignore
        const asset = card._mjrAsset;
        if (!asset) return;

        // Get all assets in current grid for navigation
        const state = GRID_STATE.get(container);
        const allAssets = Array.isArray(state?.assets) ? state.assets : [];

        const isFolder = String(asset?.kind || "").toLowerCase() === "folder";
        if (isFolder) {
            try {
                container.dispatchEvent?.(
                    new CustomEvent("mjr:open-folder-asset", {
                        bubbles: true,
                        detail: { asset },
                    })
                );
                // Fallback: if no panel-level handler is attached, reload from grid directly.
                if (!container?._mjrHasCustomSubfolderHandler) {
                    loadAssets(container, state?.query || "*", { reset: true }).catch(() => {});
                }
            } catch (e) { console.debug?.(e); }
            return;
        }

        // Open viewer with non-folder assets only
        const mediaAssets = (allAssets || []).filter((a) => String(a?.kind || "").toLowerCase() !== "folder");
        const mediaIndex = mediaAssets.findIndex((a) => a?.id === asset?.id);
        if (!mediaAssets.length || mediaIndex < 0) return;
        const viewer = getViewerInstance();
        viewer.open(mediaAssets, mediaIndex);
    });

    return container;
}

const OVERLAY_CLASS = "mjr-grid-loading-overlay";
const SENTINEL_CLASS = "mjr-grid-sentinel";
const LOAD_ASSETS_TIMEOUT_MS = 25000;

function showLoadingOverlay(gridContainer, message = "Loading assets...") {
    let overlay = gridContainer.querySelector(`.${OVERLAY_CLASS}`);
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.className = OVERLAY_CLASS;
    }
    overlay.style.cssText = `
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 16px;
        pointer-events: none;
        font-size: 14px;
        line-height: 1.4;
        color: var(--muted-text, #bdbdbd);
        background: rgba(0, 0, 0, 0.35);
        z-index: 4;
    `;
    overlay.textContent = message;
    try {
        const pos = String(getComputedStyle(gridContainer).position || "").toLowerCase();
        if (!pos || pos === "static") {
            gridContainer.style.position = "relative";
        }
    } catch (e) { console.debug?.(e); }
    if (!gridContainer.contains(overlay)) {
        gridContainer.appendChild(overlay);
    }
    overlay.style.display = "flex";
    // Ensure the overlay is visible even when the grid is empty/collapsed.
    if (!gridContainer.style.minHeight) {
        gridContainer.style.minHeight = "160px";
    }
}

function hideLoadingOverlay(gridContainer) {
    const overlay = gridContainer.querySelector(`.${OVERLAY_CLASS}`);
    if (overlay) {
        overlay.remove();
    }
    try {
        if (gridContainer.style.minHeight === "160px") {
            gridContainer.style.minHeight = "";
        }
    } catch (e) { console.debug?.(e); }
}

const GRID_MESSAGE_CLASS = "mjr-grid-message";

function clearGridMessage(gridContainer) {
    if (!gridContainer) return;
    try {
        const existing = gridContainer.querySelectorAll?.(`.${GRID_MESSAGE_CLASS}`) || [];
        for (const el of existing) {
            try {
                el.remove();
            } catch (e) { console.debug?.(e); }
        }
    } catch (e) { console.debug?.(e); }
}

function setGridMessage(gridContainer, text, { error = false, clear = false } = {}) {
    if (!gridContainer) return;
    // Remove previous message elements
    clearGridMessage(gridContainer);
    try {
        const msg = document.createElement("div");
        msg.className = GRID_MESSAGE_CLASS;
        msg.textContent = String(text || "");
        msg.style.cssText = `
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 16px;
            pointer-events: none;
            font-size: 14px;
            line-height: 1.4;
            color: ${error ? "var(--error-text, #f44336)" : "var(--muted-text, #bdbdbd)"};
            background: rgba(0, 0, 0, 0.35);
            z-index: 2;
        `;
        if (clear) {
            try {
                // Clear existing DOM content to avoid overlap with previous grid elements
                gridContainer.replaceChildren();
            } catch (e) { console.debug?.(e); }
            gridContainer.appendChild(msg);
        } else {
            gridContainer.appendChild(msg);
        }
    } catch (e) { console.debug?.(e); }
}

function sanitizeQuery(query) {
    if (!query || query.trim() === "") {
        return query;
    }

    if (query === "*") {
        return "*";
    }

    // Avoid expensive Unicode property regexes on large inputs; fallback for older engines.
    let cleaned = query;
    if (query.length > 256) {
        cleaned = query.replace(/[^a-z0-9\s-]/gi, " ");
    } else {
        try {
            cleaned = query.replace(/[^\p{L}\p{N}\s-]/gu, " ");
        } catch {
            cleaned = query.replace(/[^a-z0-9\s-]/gi, " ");
        }
    }
    return cleaned.trim() || query;
}

/**
 * Retrieve current grid state or initialize default.
 * @param {HTMLElement} gridContainer
 * @returns {GridState}
 */
function getOrCreateState(gridContainer) {
    let state = GRID_STATE.get(gridContainer);
    if (!state) {
        state = {
            query: "*",
            offset: 0,
            total: null,
            loading: false,
            done: false,
            seenKeys: new Set(),
            assets: [],
            assetIdSet: new Set(),
            filenameCounts: new Map(),
            nonImageStems: new Set(),
            // Virtual Grid mappings
            stemMap: new Map(), // stem -> [Asset]
            renderedFilenameMap: new Map(), // filenameKey -> [DOMElement] (only currently rendered)


            sentinel: null,
            observer: null,
            scrollRoot: null,
            scrollHandler: null,
            ignoreNextScroll: false,
            userScrolled: false,
            allowUntilFilled: true,
            requestId: 0,
            abortController: null,
            virtualGrid: null,
            metricsEl: null,
            metricsTimer: null,
        };
        GRID_STATE.set(gridContainer, state);
        _attachGridMetrics(state, gridContainer);
    }
    return state;
}

function _formatLoadErrorMessage(prefix, err) {
    let message = String(prefix || "Failed to load");
    try {
        const raw = String(err?.message || err || "").trim();
        const low = raw.toLowerCase();
        if (!raw) return message;
        if (low.includes("database is locked") || low.includes("database table is locked") || low.includes("database schema is locked")) {
            return `${message}: the database is temporarily locked. Please retry in a few seconds.`;
        }
        return `${message}: ${raw}`;
    } catch {
        return message;
    }
}

function _attachGridMetrics(state, gridContainer) {
    try {
        if (!_gridDebugEnabled()) return;
        if (!state || state.metricsEl) return;
        const el = document.createElement("div");
        el.id = "mjr-grid-metrics";
        el.style.position = "fixed";
        el.style.bottom = "10px";
        el.style.right = "10px";
        el.style.background = "rgba(0,0,0,0.6)";
        el.style.color = "#fff";
        el.style.padding = "5px";
        el.style.fontSize = "12px";
        el.style.zIndex = "9999";
        el.style.pointerEvents = "none";
        document.body.appendChild(el);
        state.metricsEl = el;
        _updateGridMetrics(state, gridContainer);
        state.metricsTimer = setInterval(() => _updateGridMetrics(state, gridContainer), 2000);
    } catch (e) { console.debug?.(e); }
}

function _updateGridMetrics(state, gridContainer) {
    try {
        if (!state?.metricsEl) return;
        const assetCount = Array.isArray(state.assets) ? state.assets.length : 0;
        const seenCount = state.seenKeys?.size || 0;
        const rt = _getRtHydrateState(gridContainer);
        const hydrateSeen = rt?.seen?.size || 0;
        let memoryMB = "n/a";
        try {
            const used = performance?.memory?.usedJSHeapSize;
            if (Number.isFinite(used)) memoryMB = (used / 1024 / 1024).toFixed(1);
        } catch (e) { console.debug?.(e); }
        state.metricsEl.textContent = `Assets: ${assetCount} / Seen: ${seenCount} / HydrateSeen: ${hydrateSeen} / Memory: ${memoryMB} MB`;
    } catch (e) { console.debug?.(e); }
}

function _isPotentialScrollContainer(el) {
    return vsIsPotentialScrollContainer(el);
}

function _detectScrollRoot(gridContainer) {
    return vsDetectScrollRoot(gridContainer);
}

function _getScrollContainer(gridContainer, state) {
    return vsGetScrollContainer(gridContainer, state);
}

/**
 * Initializes the VirtualGrid renderer for this container.
 * @param {HTMLElement} gridContainer
 * @param {GridState} state
 * @returns {VirtualGrid}
 */
function ensureVirtualGrid(gridContainer, state) {
    return vsEnsureVirtualGrid(gridContainer, state, {
        VirtualGrid,
        gridDebug,
        optionsFactory: () => ({
        minItemWidth: APP_CONFIG.GRID_MIN_SIZE || 120,
        gap: APP_CONFIG.GRID_GAP || 10,
        bufferRows: 3,
        createItem: (asset, _index) => {
            const card = String(asset?.kind || "").toLowerCase() === "folder"
                ? createFolderCard(asset)
                : createAssetCard(asset);
            const selectedIds = getSelectedIdSet(gridContainer);
            // Handle selection
            if (asset && asset.id != null && selectedIds.has(String(asset.id))) {
                card.classList.add("is-selected");
                card.setAttribute("aria-selected", "true");
            }
            // Handle collision badge if already known
            if (asset?._mjrNameCollision) {
                 const badge = card.querySelector?.(".mjr-file-badge");
                 setFileBadgeCollision(badge, true, {
                     filename: asset?.filename || "",
                     count: asset?._mjrNameCollisionCount || 2,
                     paths: asset?._mjrNameCollisionPaths || [],
                 });
                 _setCollisionTooltip(card, asset?.filename, asset?._mjrNameCollisionCount || 2);
            }
            return card;
        },
        onItemRendered: (asset, card) => {
            // Ensure selection classes are clean before applying any selection logic.
            try {
                card.classList.remove("is-selected");
                card.classList.remove("is-active");
                card.setAttribute("aria-selected", "false");
            } catch (e) { console.debug?.(e); }
            // Re-apply selection if this asset is selected.
            try {
                const selectedIds = getSelectedIdSet(gridContainer);
                if (asset?.id != null && selectedIds.has(String(asset.id))) {
                    card.classList.add("is-selected");
                    card.setAttribute("aria-selected", "true");
                }
            } catch (e) { console.debug?.(e); }

            // Hydrate ratings
            enqueueRatingTagsHydration(gridContainer, card, asset);
            try {
                state.virtualGrid?.scheduleRemeasure?.();
            } catch (e) { console.debug?.(e); }

            // Track rendered card for live updates (collisions)
            const fnKey = _getFilenameKey(asset?.filename);
            if (fnKey) {
                let list = state.renderedFilenameMap.get(fnKey);
                if (!list) {
                    list = [];
                    state.renderedFilenameMap.set(fnKey, list);
                }
                list.push(card);
            }
        },
        onItemUpdated: (asset, card) => {
            if (card) {
                const oldCard = card;
                const prevAsset = oldCard._mjrAsset || null;
                const prevFnKey = _getFilenameKey(prevAsset?.filename);

                // Rebuild full card so filename/thumb/meta/datasets stay in sync.
                const replacement = String(asset?.kind || "").toLowerCase() === "folder"
                    ? createFolderCard(asset)
                    : createAssetCard(asset);

                try {
                    if (oldCard.classList.contains("is-selected")) {
                        replacement.classList.add("is-selected");
                        replacement.setAttribute("aria-selected", "true");
                    }
                } catch (e) { console.debug?.(e); }

                try {
                    oldCard.parentElement?.replaceChild?.(replacement, oldCard);
                } catch (e) { console.debug?.(e); }
                card = replacement;

                const nextFnKey = _getFilenameKey(asset?.filename);
                try {
                    if (prevFnKey) {
                        const oldList = state.renderedFilenameMap.get(prevFnKey);
                        if (oldList) {
                            const idx = oldList.indexOf(oldCard);
                            if (idx > -1) oldList.splice(idx, 1);
                            if (!oldList.length) state.renderedFilenameMap.delete(prevFnKey);
                        }
                    }
                } catch (e) { console.debug?.(e); }
                try {
                    if (nextFnKey) {
                        let nextList = state.renderedFilenameMap.get(nextFnKey);
                        if (!nextList) {
                            nextList = [];
                            state.renderedFilenameMap.set(nextFnKey, nextList);
                        }
                        if (!nextList.includes(card)) nextList.push(card);
                    }
                } catch (e) { console.debug?.(e); }

                card._mjrAsset = asset;
                _updateCardRatingTagsBadges(card, asset.rating, asset.tags);
                enqueueRatingTagsHydration(gridContainer, card, asset);
                try {
                    state.virtualGrid?.scheduleRemeasure?.();
                } catch (e) { console.debug?.(e); }
                // Reset selection classes on reuse to avoid ghost selection
                try {
                    card.classList.remove("is-selected");
                    card.classList.remove("is-active");
                    card.setAttribute("aria-selected", "false");
                } catch (e) { console.debug?.(e); }

                const selectedIds = getSelectedIdSet(gridContainer);
                if (selectedIds && asset.id != null) {
                    if (selectedIds.has(String(asset.id))) {
                         card.classList.add("is-selected");
                         card.setAttribute("aria-selected", "true");
                    } else {
                         card.classList.remove("is-selected");
                         card.setAttribute("aria-selected", "false");
                    }
                }
            }
        },
        onItemRecycled: (card) => {
            // Cleanup map
            try {
                const asset = card._mjrAsset;
                const fnKey = _getFilenameKey(asset?.filename);
                if (fnKey) {
                    const list = state.renderedFilenameMap.get(fnKey);
                    if (list) {
                        const idx = list.indexOf(card);
                        if (idx > -1) list.splice(idx, 1);
                    }
                }
            } catch (e) { console.debug?.(e); }

              // Cleanup video thumbs
              try {
                   // Use the exported cleanup if available or implement inline
                   cleanupVideoThumbsIn(card);
              } catch (e) { console.debug?.(e); }
              try {
                   cleanupCardMediaHandlers(card);
              } catch (e) { console.debug?.(e); }
              try {
                   card.classList.remove("is-selected");
                   card.classList.remove("is-active");
                   card.setAttribute("aria-selected", "false");
              } catch (e) { console.debug?.(e); }
        }
        }),
    });
}

function assetKey(asset) {
    if (!asset || typeof asset !== "object") return "";
    if (asset.id != null) return `id:${asset.id}`;
    const fp = asset.filepath || "";
    const t = asset.type || "";
    const rid = pickRootId(asset);
    return `${t}|${rid}|${fp}|${asset.subfolder || ""}|${asset.filename || ""}`;
}

function getSelectedIdSet(gridContainer) {
    return selectionGetSelectedIdSet(gridContainer);
}

function _setSelectedIdsDataset(gridContainer, selectedSet, activeId = "") {
    return selectionSetSelectedIdsDataset(gridContainer, selectedSet, activeId);
}

function syncSelectionClasses(gridContainer, selectedIds) {
    return selectionSyncSelectionClasses(gridContainer, selectedIds, _getRenderedCards);
}

function setSelectionIds(gridContainer, selectedIds, { activeId = "" } = {}) {
    return selectionSetSelectionIds(gridContainer, selectedIds, { activeId }, _getRenderedCards);
}

function _safeEscapeId(value) {
    return selectionSafeEscapeId(value);
}

function _getFilenameKey(filename) {
    return cardGetFilenameKey(filename);
}

function _getExtUpper(filename) {
    return cardGetExtUpper(filename);
}

function _getStemLower(filename) {
    return cardGetStemLower(filename);
}

function _detectKind(asset, extUpper) {
    return cardDetectKind(asset, extUpper);
}

function _isHidePngSiblingsEnabled() {
    return cardIsHidePngSiblingsEnabled(loadMajoorSettings);
}

function _setCollisionTooltip(card, filename, count) {
    return cardSetCollisionTooltip(card, filename, count);
}

function appendAssets(gridContainer, assets, state) {
    return cardAppendAssets(gridContainer, assets, state, {
        loadMajoorSettings,
        clearGridMessage,
        ensureVirtualGrid,
        setFileBadgeCollision,
        assetKey,
    });
}

function ensureSentinel(gridContainer, state) {
    return vsEnsureSentinel(gridContainer, state, SENTINEL_CLASS);
}
function stopObserver(state) {
    return vsStopObserver(state);
}

function captureScrollMetrics(state) {
    return vsCaptureScrollMetrics(state);
}

function maybeKeepPinnedToBottom(_state, _before) {
    return vsMaybeKeepPinnedToBottom(_state, _before);
}

/**
 * Fetch a page of assets from the backend.
 * @param {HTMLElement} gridContainer
 * @param {string} query Search query
 * @param {number} limit Page size
 * @param {number} offset Offset
 * @param {Object} options
 * @param {number} [options.requestId]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<{ok: boolean, assets?: any[], total?: number, count?: number, error?: string, aborted?: boolean, stale?: boolean, sortKey?: string, safeQuery?: string}>}
 */
async function fetchPage(gridContainer, query, limit, offset, { requestId = 0, signal = null } = {}) {
    return infFetchPage(gridContainer, query, limit, offset, {
        sanitizeQuery,
        buildListURL,
        get,
        getGridState: (el) => GRID_STATE.get(el),
    }, { requestId, signal });
}

const emitAgendaStatus = (dateExact, hasResults) => {
    if (!dateExact) return;
    try {
        window?.dispatchEvent?.(
            new CustomEvent("MJR:AgendaStatus", {
                detail: { date: dateExact, hasResults: Boolean(hasResults) },
            })
        );
    } catch (e) { console.debug?.(e); }
};

async function loadNextPage(gridContainer, state) {
    return infLoadNextPage(gridContainer, state, {
        config: APP_CONFIG,
        captureScrollMetrics,
        gridDebug,
        stopObserver,
        appendAssets,
        maybeKeepPinnedToBottom,
        sanitizeQuery,
        buildListURL,
        get,
        getGridState: (el) => GRID_STATE.get(el),
    });
}

function startInfiniteScroll(gridContainer, state) {
    return vsStartInfiniteScroll(gridContainer, state, {
        config: APP_CONFIG,
        gridDebug,
        sentinelClass: SENTINEL_CLASS,
        loadNextPage,
    });
}

export async function loadAssets(gridContainer, query = "*", options = {}) {
    const { reset = true } = options || {};
    const state = getOrCreateState(gridContainer);

    const requestedQuery = query && query.trim() ? query : "*";
    state.query = sanitizeQuery(requestedQuery) || requestedQuery;

    if (reset) {
        try {
            state.abortController?.abort?.();
        } catch (e) { console.debug?.(e); }
        try {
            state.abortController = typeof AbortController !== "undefined" ? new AbortController() : null;
        } catch {
            state.abortController = null;
        }
        try {
            state.requestId = (Number(state.requestId) || 0) + 1;
        } catch {
            state.requestId = 1;
        }

        stopObserver(state);
        state.offset = 0;
        state.total = null;
        state.done = false;
        state.loading = false;
        state.allowUntilFilled = true; // Reset: Allow auto-filling the viewport on new search
        state.seenKeys = new Set();
        state.assets = [];
        state.assetIdSet = new Set();
        state.filenameCounts = new Map();
        state.stemMap = new Map();
        state.renderedFilenameMap = new Map();
        state.nonImageStems = new Set();
        state.hiddenPngSiblings = 0;
        try {
            gridContainer.dataset.mjrHiddenPngSiblings = "0";
        } catch (e) { console.debug?.(e); }

        // Discard any pending upsert batch to prevent stale partial assets
        // from racing with the fresh API response.
        try {
            const batchState = UPSERT_BATCH_STATE.get(gridContainer);
            if (batchState) {
                if (batchState.timer) {
                    clearTimeout(batchState.timer);
                    batchState.timer = null;
                }
                batchState.pending.clear();
                batchState.flushing = false;
            }
        } catch (e) { console.debug?.(e); }

        // Clear virtual grid items (but keep instance)
        const vg = ensureVirtualGrid(gridContainer, state);
        if (vg) vg.setItems([]);
        // We don't clear innerHTML directly if VirtualGrid is active, as it manages it.
        // But showLoadingOverlay expects to be appended.
        // VirtualGrid sets container to relative. Overlay is absolute inset 0. It works.

        showLoadingOverlay(gridContainer, state.query === "*" ? "Loading assets..." : `Searching for "${state.query}"...`);
    }

    try {
        if (reset) {
            let timeoutId = null;
            const timeoutPromise = new Promise((_, reject) => {
                timeoutId = setTimeout(() => {
                    const err = new Error(`Load assets timeout after ${LOAD_ASSETS_TIMEOUT_MS}ms`);
                    err.name = "LoadTimeoutError";
                    reject(err);
                }, LOAD_ASSETS_TIMEOUT_MS);
            });
            try {
                await Promise.race([loadNextPage(gridContainer, state), timeoutPromise]);
            } finally {
                if (timeoutId) clearTimeout(timeoutId);
            }
        } else {
            await loadNextPage(gridContainer, state);
        }

        if (reset) {
            hideLoadingOverlay(gridContainer);
            // Check if items present in state, not just DOM (logic shift)
            const hasItems = state.assets && state.assets.length > 0;
                  if (!hasItems && state.offset === 0) {
                  // Dispose VirtualGrid before setGridMessage clears the DOM via replaceChildren().
                  // Without this, state.virtualGrid keeps a stale (detached) instance and the next
                  // search renders assets into a detached container → blank grid.
                  if (state.virtualGrid) {
                      try { state.virtualGrid.dispose(); } catch (e) { console.debug?.(e); }
                      state.virtualGrid = null;
                  }
                  setGridMessage(gridContainer, "No assets found", { clear: true });
              } else {
                  startInfiniteScroll(gridContainer, state);
              }
        }
        return { ok: true, count: state.offset, total: state.total || 0 };
    } catch (err) {
        try {
            if (String(err?.name || "") === "LoadTimeoutError") {
                // Force-unblock state so future reloads are not stuck behind a stale in-flight request.
                try {
                    state.abortController?.abort?.();
                } catch (e) { console.debug?.(e); }
                try {
                    state.abortController = typeof AbortController !== "undefined" ? new AbortController() : null;
                } catch {
                    state.abortController = null;
                }
                try {
                    state.requestId = (Number(state.requestId) || 0) + 1;
                } catch {
                    state.requestId = 1;
                }
                state.loading = false;
            }
        } catch (e) { console.debug?.(e); }
        try {
            if (String(err?.name || "") === "AbortError") {
                return { ok: false, aborted: true, error: "Aborted" };
            }
        } catch (e) { console.debug?.(e); }
        stopObserver(state);
        if (reset) hideLoadingOverlay(gridContainer);
        clearGridMessage(gridContainer);
        setGridMessage(gridContainer, _formatLoadErrorMessage("Failed to load assets", err), { error: true });
        return { ok: false, error: err?.message || String(err) };
    } finally {
        if (reset) hideLoadingOverlay(gridContainer);
    }
}

/**
 * Prepare grid for a hard context/scope switch.
 * Aborts in-flight requests, invalidates stale responses, and clears visible DOM immediately.
 * @param {HTMLElement} gridContainer
 */
export function prepareGridForScopeSwitch(gridContainer) {
    if (!gridContainer) return;
    const state = getOrCreateState(gridContainer);
    try {
        state.abortController?.abort?.();
    } catch (e) { console.debug?.(e); }
    try {
        state.abortController = typeof AbortController !== "undefined" ? new AbortController() : null;
    } catch {
        state.abortController = null;
    }
    try {
        state.requestId = (Number(state.requestId) || 0) + 1;
    } catch {
        state.requestId = 1;
    }

    stopObserver(state);
    state.offset = 0;
    state.total = null;
    state.done = false;
    state.loading = false;
    state.assets = [];
    state.assetIdSet = new Set();
    state.seenKeys = new Set();
    state.filenameCounts = new Map();
    state.stemMap = new Map();
    state.renderedFilenameMap = new Map();
    state.nonImageStems = new Set();

    try {
        clearGridMessage(gridContainer);
        hideLoadingOverlay(gridContainer);
    } catch (e) { console.debug?.(e); }

    // Physical clear to prevent visual overlap during rapid scope switches.
    try {
        if (state.virtualGrid) {
            state.virtualGrid.setItems([], true);
        } else {
            gridContainer.replaceChildren();
        }
    } catch {
        try {
            gridContainer.replaceChildren();
        } catch (e) { console.debug?.(e); }
    }
}

/**
 * Load a pre-defined list of assets into the grid (no paging/infinite scroll).
 * Used for "Collections" views.
 */
export async function loadAssetsFromList(gridContainer, assets, options = {}) {
    const { title = "Collection", reset = true } = options || {};
    const state = getOrCreateState(gridContainer);

    const list = Array.isArray(assets) ? assets : [];

    if (reset) {
        try {
            state.abortController?.abort?.();
        } catch (e) { console.debug?.(e); }
        try {
            state.abortController = typeof AbortController !== "undefined" ? new AbortController() : null;
        } catch {
            state.abortController = null;
        }
        try {
            state.requestId = (Number(state.requestId) || 0) + 1;
        } catch {
            state.requestId = 1;
        }
        stopObserver(state);
        state.offset = 0;
        state.total = list.length;
        state.done = true;
        state.loading = false;
        state.query = String(title || "Collection");
        state.seenKeys = new Set();
        state.assets = [];
        state.assetIdSet = new Set();
        state.filenameCounts = new Map();
        state.stemMap = new Map();
        state.renderedFilenameMap = new Map();
        state.nonImageStems = new Set();
        state.hiddenPngSiblings = 0;
        try {
            gridContainer.dataset.mjrHiddenPngSiblings = "0";
        } catch (e) { console.debug?.(e); }

        const vg = ensureVirtualGrid(gridContainer, state);
        if (vg) vg.setItems([]);

        showLoadingOverlay(gridContainer, list.length ? `Loading ${title}...` : `${title} is empty`);
    }

    try {
        // Apply the current sort order for consistent UX.
        const sortKey = gridContainer.dataset.mjrSort || "mtime_desc";
        const sorted = list.slice().sort((a, b) => compareAssets(a, b, sortKey));

        appendAssets(gridContainer, sorted, state);

        if (reset) {
            hideLoadingOverlay(gridContainer);
            const hasItems = state.assets && state.assets.length > 0;
              if (!hasItems) {
                  if (state.virtualGrid) {
                      try { state.virtualGrid.dispose(); } catch (e) { console.debug?.(e); }
                      state.virtualGrid = null;
                  }
                  setGridMessage(gridContainer, "No assets found", { clear: true });
              }
        }

        return { ok: true, count: sorted.length, total: sorted.length };
    } catch (err) {
        stopObserver(state);
        if (reset) hideLoadingOverlay(gridContainer);
        clearGridMessage(gridContainer);
        setGridMessage(gridContainer, _formatLoadErrorMessage("Failed to load collection", err), { error: true });
        return { ok: false, error: err?.message || String(err) };
    } finally {
        if (reset) hideLoadingOverlay(gridContainer);
    }
}

/**
 * Remove assets from grid state + UI (used after delete).
 * Keeps selection dataset consistent and avoids UI re-appearance on scroll.
 * @param {HTMLElement} gridContainer
 * @param {Array<string|number|Object>} assetIds
 * @param {Object} [options]
 * @param {boolean} [options.updateSelection=true]
 * @returns {{ok: boolean, removed: number, selectedIds: string[]}}
 */
export function removeAssetsFromGrid(gridContainer, assetIds, { updateSelection = true } = {}) {
    if (!gridContainer) {
        return { ok: false, removed: 0, selectedIds: [] };
    }
    const ids = new Set();
    const list = Array.isArray(assetIds) ? assetIds : [assetIds];
    for (const raw of list) {
        if (raw == null) continue;
        if (typeof raw === "object" && raw?.id != null) {
            ids.add(String(raw.id));
        } else {
            ids.add(String(raw));
        }
    }
    if (!ids.size) {
        return { ok: false, removed: 0, selectedIds: Array.from(getSelectedIdSet(gridContainer)) };
    }

    let selectedIds = getSelectedIdSet(gridContainer);
    if (updateSelection) {
        for (const id of ids) selectedIds.delete(String(id));
        _setSelectedIdsDataset(gridContainer, selectedIds);
    }

    // Best-effort selection class sync for visible cards.
    try {
        for (const card of _getRenderedCards(gridContainer)) {
            if (!card?.classList?.contains?.("is-selected")) continue;
            const id = card?.dataset?.mjrAssetId;
            if (!id || !selectedIds.has(String(id))) {
                card.classList.remove("is-selected");
                card.setAttribute("aria-selected", "false");
            }
        }
    } catch (e) { console.debug?.(e); }

    const state = GRID_STATE.get(gridContainer);
    let removedCount = 0;
    if (state?.assets && state.assets.length) {
        const next = [];
        for (const asset of state.assets) {
            const id = asset?.id != null ? String(asset.id) : "";
            if (id && ids.has(id)) {
                removedCount += 1;
                try {
                    state.assetIdSet?.delete?.(id);
                } catch (e) { console.debug?.(e); }
            } else {
                next.push(asset);
            }
        }
        if (removedCount) {
            state.assets = next;
            try {
                if (Number.isFinite(state.total)) state.total = Math.max(0, Number(state.total) - removedCount);
            } catch (e) { console.debug?.(e); }
            if (state.virtualGrid) {
                state.virtualGrid.setItems(state.assets);
            } else {
                for (const id of ids) {
                    try {
                        const card = gridContainer.querySelector(`[data-mjr-asset-id="${_safeEscapeId(id)}"]`);
                        card?.remove?.();
                    } catch (e) { console.debug?.(e); }
                }
            }
        }
    } else {
        for (const id of ids) {
            try {
                const card = gridContainer.querySelector(`[data-mjr-asset-id="${_safeEscapeId(id)}"]`);
                if (card) {
                    card.remove?.();
                    removedCount += 1;
                }
            } catch (e) { console.debug?.(e); }
        }
    }

    const selectedList = Array.from(selectedIds);
    try {
        gridContainer?.dispatchEvent?.(new CustomEvent("mjr:selection-changed", { detail: { selectedIds: selectedList } }));
    } catch (e) { console.debug?.(e); }
    try {
        const count = Number(state?.assets?.length ?? null);
        const total = Number(state?.total ?? null);
        if (Number.isFinite(count) || Number.isFinite(total)) {
            gridContainer?.dispatchEvent?.(
                new CustomEvent("mjr:grid-stats", { detail: { count, total } })
            );
        }
    } catch (e) { console.debug?.(e); }

    return { ok: true, removed: removedCount, selectedIds: selectedList };
}

export function disposeGrid(gridContainer) {
    const state = GRID_STATE.get(gridContainer);
    if (!state) return;
    stopObserver(state);

    // Dispose virtual grid
    if (state.virtualGrid) {
        try {
            state.virtualGrid.dispose();
        } catch (e) { console.debug?.(e); }
        state.virtualGrid = null;
    }

    if (state._cardKeydownHandler) {
        try {
            gridContainer.removeEventListener("keydown", state._cardKeydownHandler, true);
        } catch (e) { console.debug?.(e); }
        state._cardKeydownHandler = null;
    }

    // Cleanup summary bar listeners
    try {
        gridContainer._mjrSummaryBarDispose?.();
    } catch (e) { console.debug?.(e); }

    // Cleanup grid keyboard
    try {
        gridContainer._mjrGridKeyboard?.dispose?.();
    } catch (e) { console.debug?.(e); }

    // Cleanup settings-changed listener
    try {
        gridContainer._mjrSettingsChangedCleanup?.();
    } catch (e) { console.debug?.(e); }
    try {
        cleanupVideoThumbsIn?.(gridContainer);
    } catch (e) { console.debug?.(e); }
    try {
        state.seenKeys?.clear?.();
        state.stemMap?.clear?.();
        state.renderedFilenameMap?.clear?.();
    } catch (e) { console.debug?.(e); }
    // Best-effort callback cleanup
    try {
        const st = _getRtHydrateState(gridContainer);
        if (st) {
             st.queue.length = 0;
             st.active?.clear?.();
             st.seen?.clear?.();
        }
    } catch (e) { console.debug?.(e); }
    try {
        RT_HYDRATE_STATE.delete(gridContainer);
    } catch (e) { console.debug?.(e); }
    try {
        if (state.metricsTimer) {
            clearInterval(state.metricsTimer);
            state.metricsTimer = null;
        }
        if (state.metricsEl?.parentNode) {
            state.metricsEl.parentNode.removeChild(state.metricsEl);
        }
        state.metricsEl = null;
    } catch (e) { console.debug?.(e); }
    GRID_STATE.delete(gridContainer);
}

/**
 * Get sort value for an asset based on sort key
 */
function getSortValue(asset, sortKey) {
    return infGetSortValue(asset, sortKey);
}

function compareAssets(a, b, sortKey) {
    return infCompareAssets(a, b, sortKey);
}

/**
 * Determine if an asset should be inserted before another based on sort order
 */
function shouldInsertBefore(assetValue, cardValue, sortKey) {
    return infShouldInsertBefore(assetValue, cardValue, sortKey);
}

/**
 * Find the correct insertion position in an array based on sort order
 */
function findInsertPosition(array, asset, sortKey) {
    return infFindInsertPosition(array, asset, sortKey);
}

/**
 * Find asset element by ID
 */
function findAssetElement(gridContainer, assetId) {
    return infFindAssetElement(gridContainer, assetId);
}

/**
 * Get or create upsert batch state for a grid
 */
function _getUpsertBatchState(gridContainer) {
    let s = UPSERT_BATCH_STATE.get(gridContainer);
    if (!s) {
        s = { pending: new Map(), timer: null, flushing: false };
        UPSERT_BATCH_STATE.set(gridContainer, s);
    }
    return s;
}

/**
 * Flush all pending upserts in one batch (single setItems call)
 */
function _flushUpsertBatch(gridContainer) {
    return infFlushUpsertBatch(gridContainer, {
        upsertState: UPSERT_BATCH_STATE,
        getOrCreateState,
        ensureVirtualGrid,
        assetKey,
    });
}

/**
 * Update or insert a single asset in the grid (Live Update).
 * Uses batching to avoid multiple setItems calls in rapid succession.
 * @param {HTMLElement} gridContainer
 * @param {Object} asset The new or updated asset data
 * @returns {boolean} True if asset was queued for update
 */
export function upsertAsset(gridContainer, asset) {
    return infUpsertAsset(gridContainer, asset, {
        getOrCreateState,
        ensureVirtualGrid,
        upsertState: UPSERT_BATCH_STATE,
        maxBatchSize: UPSERT_BATCH_MAX_SIZE,
        debounceMs: UPSERT_BATCH_DEBOUNCE_MS,
        assetKey,
    });
}

/**
 * Capture scroll anchor before making changes
 */
export function captureAnchor(gridContainer) {
    const state = getOrCreateState(gridContainer);
    const scrollContainer = _getScrollContainer(gridContainer, state);
    const selectedElement = gridContainer.querySelector('.mjr-asset-card.is-selected');
    const firstVisibleElement = getFirstVisibleAssetElement(gridContainer);

    const el = selectedElement || firstVisibleElement;
    if (!el) return null;

    const rect = el.getBoundingClientRect();
    const containerRect = gridContainer.getBoundingClientRect();

    return {
        id: el.dataset.mjrAssetId,
        top: rect.top - containerRect.top,
        scrollTop: scrollContainer?.scrollTop || 0
    };
}

/**
 * Get first visible asset element
 */
function getFirstVisibleAssetElement(gridContainer) {
    const cards = _getRenderedCards(gridContainer);
    const containerRect = gridContainer.getBoundingClientRect();
    const containerTop = containerRect.top;
    const containerBottom = containerRect.bottom;

    for (const card of cards) {
        const cardRect = card.getBoundingClientRect();
        if (cardRect.bottom >= containerTop && cardRect.top <= containerBottom) {
            return card;
        }
    }

    // If no card is visible, return the first one
    return cards[0] || null;
}

function _buildCollisionPaths(bucket) {
    return cardBuildCollisionPaths(bucket);
}

/**
 * Restore scroll position based on anchor
 */
export async function restoreAnchor(gridContainer, anchor) {
    if (!anchor) return;

    const state = getOrCreateState(gridContainer);
    const scrollContainer = _getScrollContainer(gridContainer, state);
    if (!scrollContainer) return;

    // Wait for layout to complete
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    const el = findAssetElement(gridContainer, anchor.id);
    if (!el) {
        // Element no longer in DOM (selection lost after reload); restore raw scroll position.
        scrollContainer.scrollTop = anchor.scrollTop || 0;
        return;
    }

    const rect = el.getBoundingClientRect();
    const containerRect = gridContainer.getBoundingClientRect();
    const delta = (rect.top - containerRect.top) - anchor.top;

    scrollContainer.scrollTop = (scrollContainer.scrollTop || 0) + delta;
}

/**
 * Force specific refresh of the grid visuals (e.g. after settings change).
 */
export function refreshGrid(gridContainer) {
    try {
        const state = GRID_STATE.get(gridContainer);
        if (state && state.virtualGrid && state.assets) {
            // Update VirtualGrid layout config from global settings
            if (state.virtualGrid.updateConfig) {
                 state.virtualGrid.updateConfig({
                     minItemWidth: APP_CONFIG.GRID_MIN_SIZE,
                     gap: APP_CONFIG.GRID_GAP
                 }, { relayout: false });
            }

            // Re-setting items triggers a re-render of the visible range.
            // Pass force=true to ensure Card.js re-reads APP_CONFIG for badges/details updates.
            state.virtualGrid.setItems(state.assets, true);
        }
    } catch (e) { console.debug?.(e); }
}

// Scan-complete auto-refresh removed: the panel's handleCountersUpdate (path B)
// is the sole auto-reload trigger for both watcher and manual scans.
// Manual scans also emit mjr:reload-grid via StatusDot → requestQueuedReload.
// Having a third path here (direct loadAssets bypass) caused duplicate reloads.
export function bindGridScanListeners() {}
export function disposeGridScanListeners() {}
