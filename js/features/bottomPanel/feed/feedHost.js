import { disposeGrid, loadAssetsFromList } from "../../grid/gridApi.js";
import {
    loadMajoorSettings,
    saveMajoorSettings,
    applySettingsToConfig,
} from "../../../app/settings/settingsCore.js";
import { EVENTS } from "../../../app/events.js";
import { t } from "../../../app/i18n.js";
import { floatingViewerManager } from "../../viewer/floatingViewerManager.js";
import { setSelectionIds, getSelectedIdSet } from "../../grid/GridSelectionManager.js";
import { createRatingBadge } from "../../../components/Badges.js";
import { requestViewerOpen } from "../../viewer/viewerOpenRequest.js";
import { get } from "../../../api/client.js";
import { buildListURL } from "../../../api/endpoints.js";
import { createPopoverManager } from "../../panel/views/popoverManager.js";
import { APP_CONFIG } from "../../../app/config.js";
import { bindGridContextMenu, showTagsPopover } from "../../contextmenu/GridContextMenu.js";
import { createRatingHotkeysController } from "../../panel/controllers/ratingHotkeysController.js";
import { installGridKeyboard } from "../../grid/GridKeyboard.js";
import { bindCardOverlayButton } from "../../grid/StackGroupCards.js";
import { createMjrApp } from "../../../vue/createVueApp.js";
import VirtualAssetGridHost from "../../../vue/components/grid/VirtualAssetGridHost.vue";

const FEED_FETCH_LIMIT = 240;
const FEED_PAGE_SIZE = 120;
const FEED_PUSH_RENDER_DEBOUNCE_MS = 80;

function _createFeedMemberCard(asset) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "mjr-asset-card mjr-card mjr-feed-group-member-card";
    card.style.cssText =
        "display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-end;min-height:110px;padding:8px;border:1px solid var(--mjr-border,#444);border-radius:8px;background:var(--mjr-surface,#202020);color:inherit;text-align:left;overflow:hidden;";
    try {
        card.dataset.mjrAssetId = String(asset?.id || "");
    } catch (e) {
        console.debug?.(e);
    }
    const name = document.createElement("div");
    name.className = "mjr-feed-group-member-name";
    name.style.cssText = "font-size:11px;font-weight:600;line-height:1.3;word-break:break-word;";
    name.textContent = String(asset?.filename || "Asset");
    card.appendChild(name);
    return card;
}

function _getRenderedCards(grid) {
    try {
        if (typeof grid?._mjrGetRenderedCards === "function") {
            const cards = grid._mjrGetRenderedCards();
            if (Array.isArray(cards)) return cards;
        }
    } catch (e) {
        console.debug?.(e);
    }
    try {
        return Array.from(grid?.querySelectorAll?.(".mjr-asset-card") || []);
    } catch (e) {
        console.debug?.(e);
        return [];
    }
}

function _applyFeedSelection(grid, ids, activeId = "") {
    const nextIds = Array.isArray(ids) ? ids.map(String).filter(Boolean) : [];
    return setSelectionIds(
        grid,
        nextIds,
        { activeId: activeId || nextIds[0] || "" },
        _getRenderedCards,
    );
}

function _bindFeedSelection(host) {
    const grid = host?.grid;
    if (!grid) return;
    const onClick = (event) => {
        if (event.defaultPrevented) return;
        const card = event.target?.closest?.(".mjr-asset-card");
        if (!card || !grid.contains(card)) return;
        const interactive = event.target?.closest?.("a, button, input, textarea, select, label");
        if (interactive && interactive !== card && card.contains(interactive)) return;
        const clickedId = String(card.dataset?.mjrAssetId || "").trim();
        if (!clickedId) return;

        try {
            window.__MJR_LAST_SELECTION_GRID__ = grid;
        } catch (e) {
            console.debug?.(e);
        }

        const cards = _getRenderedCards(grid);
        const clickedIndex = cards.indexOf(card);
        const existing = getSelectedIdSet(grid);

        if (event.shiftKey && clickedIndex >= 0) {
            const anchorIndex = Number.isFinite(Number(grid._mjrLastSelectedIndex))
                ? Number(grid._mjrLastSelectedIndex)
                : clickedIndex;
            const start = Math.min(anchorIndex, clickedIndex);
            const end = Math.max(anchorIndex, clickedIndex);
            const rangeIds = cards
                .slice(start, end + 1)
                .map((el) => String(el?.dataset?.mjrAssetId || "").trim())
                .filter(Boolean);
            _applyFeedSelection(grid, rangeIds, clickedId);
            grid._mjrLastSelectedIndex = clickedIndex;
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        if (event.ctrlKey || event.metaKey) {
            if (existing.has(clickedId)) existing.delete(clickedId);
            else existing.add(clickedId);
            const nextIds = Array.from(existing);
            _applyFeedSelection(
                grid,
                nextIds,
                existing.has(clickedId) ? clickedId : nextIds[0] || "",
            );
            if (clickedIndex >= 0) grid._mjrLastSelectedIndex = clickedIndex;
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        _applyFeedSelection(grid, [clickedId], clickedId);
        if (clickedIndex >= 0) grid._mjrLastSelectedIndex = clickedIndex;
        try {
            card.focus?.({ preventScroll: true });
        } catch (e) {
            console.debug?.(e);
        }
        event.preventDefault();
        event.stopPropagation();
    };

    grid.addEventListener("click", onClick, true);
    host._disposeSelection = () => {
        try {
            grid.removeEventListener("click", onClick, true);
        } catch (e) {
            console.debug?.(e);
        }
    };
}

const FEED_TAB_ID = "majoor-generated-feed";
const FEED_STATE = {
    hosts: new Set(),
    pendingAssets: new Map(),
};

function _getAssetGroupKey(asset) {
    if (!APP_CONFIG.EXECUTION_GROUPING_ENABLED) {
        return _assetKey(asset);
    }
    const stackId = String(asset?.stack_id || "").trim();
    if (stackId) return `stack:${stackId}`;
    const jobId = String(asset?.job_id || "").trim();
    if (jobId) return `job:${jobId}`;
    return _assetKey(asset);
}

function _groupFeedAssets(assets) {
    const groups = new Map();
    for (const raw of Array.isArray(assets) ? assets : []) {
        const asset = _normalizeAsset(raw);
        if (!asset) continue;
        const groupKey = _getAssetGroupKey(asset);
        let entry = groups.get(groupKey);
        if (!entry) {
            entry = { key: groupKey, members: [] };
            groups.set(groupKey, entry);
        }
        entry.members.push(asset);
    }

    const items = [];
    for (const entry of groups.values()) {
        entry.members.sort((a, b) => {
            const am = Number(a?.mtime || a?.created_at || 0) || 0;
            const bm = Number(b?.mtime || b?.created_at || 0) || 0;
            return bm - am;
        });
        const cover = entry.members[0];
        items.push({
            ...cover,
            _mjrFeedGroupKey: entry.key,
            _mjrFeedGroupCount: entry.members.length,
            _mjrFeedGroupAssets: entry.members.slice(),
        });
    }

    items.sort((a, b) => {
        const am = Number(a?.mtime || a?.created_at || 0) || 0;
        const bm = Number(b?.mtime || b?.created_at || 0) || 0;
        return bm - am;
    });
    return items;
}

function _getHostAssets(host) {
    return Array.from(host?.assetsByKey?.values?.() || []);
}

function _storeHostAsset(host, asset) {
    const normalized = _normalizeAsset(asset);
    if (!host || !normalized) return null;
    if (!host.assetsByKey) host.assetsByKey = new Map();
    host.assetsByKey.set(_assetKey(normalized), normalized);
    return normalized;
}

function _scheduleHostRender(host) {
    if (!host?.grid || !host.loaded) return;
    if (host._renderTimer) return;
    host._renderTimer = setTimeout(() => {
        host._renderTimer = null;
        void _renderHostAssets(host);
    }, FEED_PUSH_RENDER_DEBOUNCE_MS);
}

function _openGroupViewer(host, groupedAsset, startIndex = 0) {
    const assets = Array.isArray(groupedAsset?._mjrFeedGroupAssets)
        ? groupedAsset._mjrFeedGroupAssets.filter(Boolean)
        : [groupedAsset].filter(Boolean);
    if (!assets.length) return;
    const safeIndex = Math.max(0, Math.min(startIndex, assets.length - 1));
    const activeAsset = assets[safeIndex] || null;
    const activeId = String(activeAsset?.id || "").trim();
    if (host?.grid && activeId) {
        try {
            window.__MJR_LAST_SELECTION_GRID__ = host.grid;
        } catch (e) {
            console.debug?.(e);
        }
        _applyFeedSelection(host.grid, [activeId], activeId);
    }
    requestViewerOpen({ assets, index: safeIndex });
}

function _buildGroupPopover(host, groupedAsset) {
    const popover = document.createElement("div");
    popover.className = "mjr-popover mjr-feed-group-popover";
    popover.style.cssText = "display:none; width:min(440px, 92vw); padding:10px;";

    const title = document.createElement("div");
    title.className = "mjr-feed-group-popover-title";
    title.textContent = t("bottomFeed.groupTitle", "Generation group");
    title.style.cssText = "font-size:12px; font-weight:700; opacity:0.92; margin-bottom:8px;";
    popover.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "mjr-feed-group-popover-grid";
    grid.style.cssText =
        "display:grid; grid-template-columns:repeat(auto-fill, minmax(110px, 1fr)); gap:8px; max-height:360px; overflow-y:auto; overscroll-behavior:contain;";

    const assets = Array.isArray(groupedAsset?._mjrFeedGroupAssets)
        ? groupedAsset._mjrFeedGroupAssets
        : [];
    for (let index = 0; index < assets.length; index += 1) {
        const member = assets[index];
        const card = _createFeedMemberCard(member);
        card.classList.add("mjr-feed-group-member-card");
        if (index === 0) card.classList.add("mjr-feed-group-member-card--cover");
        card.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            host.popoverManager?.close?.(popover);
            _openGroupViewer(host, groupedAsset, index);
        });
        grid.appendChild(card);
    }

    popover.appendChild(grid);
    host.root.appendChild(popover);
    return popover;
}

function _decorateFeedCard(host, card, groupedAsset) {
    if (!card || !groupedAsset) return;
    const count = Number(groupedAsset?._mjrFeedGroupCount || 0) || 0;
    if (count <= 1) return;

    card.dataset.mjrFeedGrouped = "true";
    card.dataset.mjrFeedGroupCount = String(count);
    card.dataset.mjrStacked = "true";
    card.dataset.mjrStackCount = String(count);

    if (card.querySelector(".mjr-feed-group-button")) return;

    const badge = document.createElement("button");
    badge.type = "button";
    badge.className = "mjr-feed-group-button";
    badge.title = t("bottomFeed.groupOpen", "Show other assets from this generation");
    badge.setAttribute("aria-label", `${count} assets`);
    const icon = document.createElement("span");
    icon.className = "mjr-feed-group-button-icon pi pi-clone";
    badge.appendChild(icon);
    const countEl = document.createElement("span");
    countEl.className = "mjr-feed-group-button-count";
    countEl.textContent = String(count);
    badge.appendChild(countEl);
    badge.style.cssText = "position:absolute; top:34px; right:6px; z-index:11;";
    bindCardOverlayButton(badge);

    const popover = _buildGroupPopover(host, groupedAsset);
    badge.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        host.popoverManager?.toggle?.(popover, badge);
    });

    card.appendChild(badge);
}

function _enhanceGroupedCards(host, groupedAssets) {
    const groupedById = new Map(
        (Array.isArray(groupedAssets) ? groupedAssets : [])
            .map((asset) => [String(asset?.id || "").trim(), asset])
            .filter(([id]) => !!id),
    );

    for (const card of _getRenderedCards(host?.grid)) {
        const assetId = String(card?.dataset?.mjrAssetId || "").trim();
        const groupedAsset = groupedById.get(assetId);
        if (!groupedAsset) continue;
        _decorateFeedCard(host, card, groupedAsset);
    }
}

async function _renderHostAssets(host) {
    if (!host?.grid) return;
    try {
        host.popoverManager?.closeAll?.();
    } catch (e) {
        console.debug?.(e);
    }
    try {
        const stale = host.root?.querySelectorAll?.(".mjr-feed-group-popover") || [];
        for (const el of stale) el.remove?.();
    } catch (e) {
        console.debug?.(e);
    }
    const groupedAssets = _groupFeedAssets(_getHostAssets(host));
    const res = await loadAssetsFromList(host.grid, groupedAssets, {
        title: t("bottomFeed.title", "Generated Feed"),
        reset: true,
    });
    _enhanceGroupedCards(host, groupedAssets);
    const count = Number(res?.count || 0);
    if (count <= 0) {
        host.empty.textContent = t("bottomFeed.empty", "No generated assets yet.");
        host.empty.style.display = "";
    } else {
        host.empty.style.display = "none";
    }
}

function _assetKey(asset) {
    const id = String(asset?.id || "").trim();
    if (id) return `id:${id}`;
    const filename = String(asset?.filename || "").trim();
    const subfolder = String(asset?.subfolder || "").trim();
    const type = String(asset?.source || asset?.type || "").trim();
    return `file:${type}:${subfolder}:${filename}`;
}

function _detectKindFromExt(filename) {
    const ext = String(filename || "")
        .split(".")
        .pop()
        .toUpperCase();
    const videos = new Set(["MP4", "WEBM", "MOV", "AVI", "MKV"]);
    const audio = new Set(["MP3", "WAV", "OGG", "FLAC", "AAC", "M4A"]);
    const model3d = new Set(["OBJ", "FBX", "GLB", "GLTF", "STL", "PLY", "SPLAT", "KSPLAT", "SPZ"]);
    if (videos.has(ext)) return "video";
    if (audio.has(ext)) return "audio";
    if (model3d.has(ext)) return "model3d";
    return "image";
}

function _normalizeAsset(asset) {
    if (!asset || typeof asset !== "object") return null;
    const normalized = { ...asset };
    if (!normalized.type && normalized.source) normalized.type = normalized.source;
    if (!normalized.source && normalized.type) normalized.source = normalized.type;
    if (!normalized.kind) {
        normalized.kind = _detectKindFromExt(normalized.ext || normalized.filename || "");
    }
    return normalized;
}

function _rememberPendingAsset(asset) {
    const normalized = _normalizeAsset(asset);
    if (!normalized) return null;
    const key = _assetKey(normalized);
    if (!key) return null;
    FEED_STATE.pendingAssets.set(key, normalized);
    if (FEED_STATE.pendingAssets.size > 64) {
        const oldest = FEED_STATE.pendingAssets.keys().next().value;
        if (oldest) FEED_STATE.pendingAssets.delete(oldest);
    }
    return normalized;
}

function _getPendingAssets() {
    return Array.from(FEED_STATE.pendingAssets.values());
}

async function _applyPendingAssets(host) {
    if (!host?.grid) return;
    for (const asset of _getPendingAssets()) {
        _storeHostAsset(host, asset);
    }
    await _renderHostAssets(host);
}

async function _loadHistory(host) {
    if (!host?.grid) return;
    host.empty.style.display = "none";
    host.empty.textContent = t("bottomFeed.loading", "Loading recent assets...");
    try {
        host.assetsByKey = new Map();
        const assets = [];
        let offset = 0;
        while (offset < FEED_FETCH_LIMIT) {
            const url = buildListURL({
                q: "*",
                limit: Math.min(FEED_PAGE_SIZE, FEED_FETCH_LIMIT - offset),
                offset,
                scope: "output",
                sort: "mtime_desc",
                includeTotal: offset === 0,
            });
            const page = await get(url, { timeoutMs: 30_000 });
            if (!page?.ok) {
                throw new Error(String(page?.error || "Failed to load feed assets"));
            }
            const rows = Array.isArray(page?.data?.assets) ? page.data.assets : [];
            if (!rows.length) break;
            for (const row of rows) {
                const normalized = _storeHostAsset(host, row);
                if (normalized) assets.push(normalized);
            }
            if (rows.length < FEED_PAGE_SIZE) break;
            offset += rows.length;
        }

        // Merge pending assets into the host store before the single render pass.
        // This avoids the double-reset that happened when _applyPendingAssets called
        // _renderHostAssets (reset:true) after loadAssetsFromList had already done so,
        // which discarded the _enhanceGroupedCards work done between the two calls.
        for (const asset of _getPendingAssets()) {
            _storeHostAsset(host, asset);
        }
        // Pending assets are now absorbed into host.assetsByKey — clear the global buffer
        // so future hosts don't replay the same entries (would cause duplicates).
        FEED_STATE.pendingAssets.clear();

        const allAssets = _getHostAssets(host);
        const grouped = _groupFeedAssets(allAssets);
        const res = await loadAssetsFromList(host.grid, grouped, {
            title: t("bottomFeed.title", "Generated Feed"),
            reset: true,
        });
        _enhanceGroupedCards(host, grouped);

        const count = Number(res?.count || 0);
        if (count <= 0) {
            host.empty.textContent = t("bottomFeed.empty", "No generated assets yet.");
            host.empty.style.display = "";
        } else {
            host.empty.style.display = "none";
        }
    } catch (e) {
        console.debug?.(e);
        host.empty.textContent = t("bottomFeed.loadFailed", "Failed to load generated assets.");
        host.empty.style.display = "";
    } finally {
        host.loaded = true;
    }
}

async function _refreshAllHosts() {
    for (const host of Array.from(FEED_STATE.hosts)) {
        try {
            await _loadHistory(host);
        } catch (e) {
            console.debug?.(e);
        }
    }
}

export function refreshGeneratedFeedHosts() {
    void _refreshAllHosts();
}

function _buildEmpty(host) {
    const empty = document.createElement("div");
    empty.textContent = t("bottomFeed.loading", "Loading recent assets...");
    empty.style.cssText = "font-size:11px; opacity:0.65; padding:4px 2px 8px 2px;";
    host.root.appendChild(empty);
    host.empty = empty;
}

function _prepareBottomPanelContainer(container) {
    if (!container) return;
    const targets = [container, container.parentElement, container.parentElement?.parentElement];
    for (const el of targets) {
        if (!el || !(el instanceof HTMLElement)) continue;
        try {
            el.style.minHeight = "0";
        } catch (e) {
            console.debug?.(e);
        }
    }
    try {
        container.style.height = "100%";
        container.style.minHeight = "0";
        container.style.overflow = "hidden";
        container.style.display = "flex";
        container.style.flexDirection = "column";
    } catch (e) {
        console.debug?.(e);
    }
}

function _applyFeedSettingsClasses(grid) {
    if (!grid) return;
    const toggle = (cls, enabled) => {
        if (enabled) grid.classList.add(cls);
        else grid.classList.remove(cls);
    };
    toggle("mjr-feed-show-info", APP_CONFIG.FEED_SHOW_INFO);
    toggle("mjr-feed-show-filename", APP_CONFIG.FEED_SHOW_FILENAME);
    toggle("mjr-feed-show-dimensions", APP_CONFIG.FEED_SHOW_DIMENSIONS);
    toggle("mjr-feed-show-date", APP_CONFIG.FEED_SHOW_DATE);
    toggle("mjr-feed-show-gentime", APP_CONFIG.FEED_SHOW_GENTIME);
    toggle("mjr-show-hover-info", APP_CONFIG.GRID_SHOW_HOVER_INFO);
    toggle("mjr-feed-show-dot", APP_CONFIG.FEED_SHOW_WORKFLOW_DOT);
    toggle("mjr-feed-show-badges-ext", APP_CONFIG.FEED_SHOW_BADGES_EXTENSION);
    toggle("mjr-feed-show-badges-rating", APP_CONFIG.FEED_SHOW_BADGES_RATING);
    toggle("mjr-feed-show-badges-tags", APP_CONFIG.FEED_SHOW_BADGES_TAGS);
}

function _buildGrid(host, externalGridWrapper = null) {
    const wrapper =
        externalGridWrapper ??
        (() => {
            const el = document.createElement("div");
            return el;
        })();
    wrapper.classList.add("mjr-am-grid-scroll");
    wrapper.style.position = "relative";
    wrapper.style.flex = "1 1 auto";
    wrapper.style.minHeight = "0";
    wrapper.style.height = "100%";
    wrapper.style.overflow = "auto";
    wrapper.style.scrollbarGutter = "stable";
    wrapper.style.overscrollBehavior = "contain";
    wrapper.style.webkitOverflowScrolling = "touch";
    const markActive = () => {
        try {
            window.__MJR_LAST_SELECTION_GRID__ = host.grid;
        } catch (e) {
            console.debug?.(e);
        }
    };
    const openMfv = () => {
        markActive();
        try {
            window.dispatchEvent(new Event(EVENTS.MFV_OPEN));
        } catch (e) {
            console.debug?.(e);
        }
    };
    const mountTarget = document.createElement("div");
    wrapper.appendChild(mountTarget);
    host.root.appendChild(wrapper);

    const { app } = createMjrApp(VirtualAssetGridHost, {
        scrollElement: wrapper,
        virtualize: false,
        applyDefaultSettingsClasses: false,
        // MFV listens on window selection events; feed selection changes must be forwarded too.
        emitWindowSelectionEvents: true,
        onCardRendered: (card, asset) => {
            try {
                _decorateFeedCard(host, card, asset);
            } catch (e) {
                console.debug?.(e);
            }
        },
        onCardDblclick: () => {
            openMfv();
        },
    });
    const vm = app.mount(mountTarget);
    const grid = vm?.gridContainer || mountTarget.querySelector?.(".mjr-grid") || null;
    host.gridApp = app;
    host.gridVm = vm;
    host.grid = grid;
    if (!grid) return;

    grid.style.minHeight = "100%";
    grid.style.height = "auto";
    grid.dataset.mjrScope = "output";
    grid.dataset.mjrQuery = "*";
    grid.dataset.mjrSort = "mtime_desc";
    grid.dataset.mjrBottomFeed = "true";
    const feedMinSize = Number(APP_CONFIG.FEED_GRID_MIN_SIZE || APP_CONFIG.GRID_MIN_SIZE || 120);
    grid.dataset.mjrFeedMinItemWidth = String(feedMinSize);
    grid.style.setProperty("--mjr-grid-min-size", `${feedMinSize}px`);
    grid.addEventListener("keydown", (event) => {
        const lower = event?.key?.toLowerCase?.() || "";
        if (event?.ctrlKey || event?.metaKey || event?.altKey) return;
        if (lower === "v") {
            event.preventDefault?.();
            event.stopPropagation?.();
            openMfv();
            return;
        }
        if (lower === "c") {
            event.preventDefault?.();
            event.stopPropagation?.();
            markActive();
            try {
                void floatingViewerManager
                    .open()
                    .then(() => floatingViewerManager.toggleCompareAB());
            } catch (e) {
                console.debug?.(e);
            }
        }
    });
    grid.addEventListener("pointerdown", markActive, true);
    grid.addEventListener("focusin", markActive, true);
    host._disposeFeedFocus = () => {
        try {
            grid.removeEventListener("pointerdown", markActive, true);
        } catch (e) {
            console.debug?.(e);
        }
        try {
            grid.removeEventListener("focusin", markActive, true);
        } catch (e) {
            console.debug?.(e);
        }
    };
}

function _getFeedSelectedAssets(host) {
    const grid = host?.grid;
    if (!grid) return [];
    const selectedIds = getSelectedIdSet(grid);
    if (!selectedIds.size) return [];
    const assets = _getHostAssets(host);
    return assets.filter((asset) => selectedIds.has(String(asset?.id || "")));
}

function _getFeedActiveAsset(host) {
    const grid = host?.grid;
    if (!grid) return null;
    const activeId = String(grid.dataset?.mjrSelectedAssetId || "").trim();
    if (!activeId) return _getFeedSelectedAssets(host)[0] || null;
    return _getHostAssets(host).find((asset) => String(asset?.id || "") === activeId) || null;
}

function _safeCssEscapeAttr(value) {
    const str = String(value ?? "");
    try {
        if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
            return CSS.escape(str);
        }
    } catch (e) {
        console.debug?.(e);
    }
    return str.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, "\\$1");
}

function _bindFeedKeyboard(host) {
    const grid = host?.grid;
    if (!grid) return;

    const onAssetChanged = () => {
        try {
            _scheduleHostRender(host);
        } catch (e) {
            console.debug?.(e);
        }
    };

    host.keyboard = installGridKeyboard({
        gridContainer: grid,
        getState: () => ({ assets: _groupFeedAssets(_getHostAssets(host)) }),
        getSelectedAssets: () => _getFeedSelectedAssets(host),
        getActiveAsset: () => _getFeedActiveAsset(host),
        onOpenTagsEditor: (asset) => {
            const activeCard =
                grid.querySelector?.(
                    `.mjr-asset-card[data-mjr-asset-id="${_safeCssEscapeAttr(asset?.id || "")}"]`,
                ) || null;
            let rect = null;
            try {
                rect = activeCard?.getBoundingClientRect?.() || grid.getBoundingClientRect();
            } catch (e) {
                console.debug?.(e);
            }
            const x = Math.round((rect?.left || 0) + Math.min((rect?.width || 0) * 0.5, 160));
            const y = Math.round((rect?.top || 0) + Math.min((rect?.height || 0) * 0.5, 120));
            showTagsPopover(x, y, asset, onAssetChanged);
        },
        onAssetChanged,
    });
    host.keyboard.bind();

    host.ratingHotkeys = createRatingHotkeysController({
        gridContainer: grid,
        createRatingBadge,
    });
    host.ratingHotkeys.bind();
}

const FEED_SIZE_MIN = 60;
const FEED_SIZE_MAX = 600;
const FEED_SIZE_STEP = 10;

function _applyFeedMinSize(host, rawSize) {
    const clamped = Math.max(
        FEED_SIZE_MIN,
        Math.min(FEED_SIZE_MAX, Math.round(Number(rawSize) / FEED_SIZE_STEP) * FEED_SIZE_STEP),
    );
    // Apply CSS variable immediately on the grid element for live feedback.
    if (host?.grid) {
        try {
            host.grid.style.setProperty("--mjr-grid-min-size", `${clamped}px`);
        } catch (e) {
            console.debug?.(e);
        }
    }
    // Persist to settings and update APP_CONFIG.
    APP_CONFIG.FEED_GRID_MIN_SIZE = clamped;
    try {
        const settings = loadMajoorSettings();
        settings.feed.minSize = clamped;
        saveMajoorSettings(settings);
        applySettingsToConfig(settings);
    } catch (e) {
        console.debug?.(e);
    }
    // Notify Vue grid to recompute columnCount.
    try {
        window.dispatchEvent(
            new CustomEvent("mjr-settings-changed", { detail: { key: "feed.minSize" } }),
        );
    } catch (e) {
        console.debug?.(e);
    }
    // Update toolbar display.
    if (host?._sizeToolbar) {
        try {
            const slider = host._sizeToolbar.querySelector(".mjr-feed-size-slider");
            const display = host._sizeToolbar.querySelector(".mjr-feed-size-display");
            if (slider) slider.value = String(clamped);
            if (display) display.textContent = `${clamped}px`;
        } catch (e) {
            console.debug?.(e);
        }
    }
    return clamped;
}

function _buildSizeControl(host) {
    const currentSize = Math.max(
        FEED_SIZE_MIN,
        Number(APP_CONFIG.FEED_GRID_MIN_SIZE || 120) || 120,
    );

    const toolbar = document.createElement("div");
    toolbar.className = "mjr-feed-toolbar";
    toolbar.style.cssText =
        "display:flex; align-items:center; gap:5px; padding:0 2px 5px 2px; flex-shrink:0; user-select:none;";

    const label = document.createElement("span");
    label.textContent = t("bottomFeed.cardSize", "Cards:");
    label.style.cssText = "font-size:11px; opacity:0.65; white-space:nowrap; flex-shrink:0;";
    toolbar.appendChild(label);

    const btnMinus = document.createElement("button");
    btnMinus.type = "button";
    btnMinus.className = "mjr-feed-size-btn";
    btnMinus.textContent = "−";
    btnMinus.title = t("bottomFeed.cardSizeDecrease", "Decrease card size");
    btnMinus.style.cssText =
        "width:20px; height:20px; padding:0; border:1px solid var(--mjr-border,#555); border-radius:4px; background:var(--mjr-surface,#2a2a2a); color:inherit; cursor:pointer; font-size:14px; line-height:1; flex-shrink:0; display:flex; align-items:center; justify-content:center;";
    toolbar.appendChild(btnMinus);

    const slider = document.createElement("input");
    slider.type = "range";
    slider.className = "mjr-feed-size-slider";
    slider.min = String(FEED_SIZE_MIN);
    slider.max = String(FEED_SIZE_MAX);
    slider.step = String(FEED_SIZE_STEP);
    slider.value = String(currentSize);
    slider.title = t("bottomFeed.cardSizeSlider", "Card size");
    slider.style.cssText =
        "flex:1 1 auto; min-width:40px; max-width:180px; height:4px; cursor:pointer; accent-color:var(--mjr-accent,#64b5f6);";
    toolbar.appendChild(slider);

    const btnPlus = document.createElement("button");
    btnPlus.type = "button";
    btnPlus.className = "mjr-feed-size-btn";
    btnPlus.textContent = "+";
    btnPlus.title = t("bottomFeed.cardSizeIncrease", "Increase card size");
    btnPlus.style.cssText = btnMinus.style.cssText;
    toolbar.appendChild(btnPlus);

    const display = document.createElement("span");
    display.className = "mjr-feed-size-display";
    display.textContent = `${currentSize}px`;
    display.style.cssText =
        "font-size:11px; opacity:0.65; white-space:nowrap; min-width:36px; text-align:right; flex-shrink:0; font-variant-numeric:tabular-nums;";
    toolbar.appendChild(display);

    btnMinus.addEventListener("click", () => {
        _applyFeedMinSize(host, Number(slider.value) - FEED_SIZE_STEP);
    });
    btnPlus.addEventListener("click", () => {
        _applyFeedMinSize(host, Number(slider.value) + FEED_SIZE_STEP);
    });
    slider.addEventListener("input", () => {
        _applyFeedMinSize(host, Number(slider.value));
    });

    host.root.appendChild(toolbar);
    host._sizeToolbar = toolbar;
}

function _makeHost(container, external = {}) {
    const root = document.createElement("div");
    root.className = "mjr-assets-manager mjr-bottom-feed";
    root.style.cssText =
        "padding:6px; height:100%; min-height:0; box-sizing:border-box; display:flex; flex-direction:column; overflow:hidden;";
    container.replaceChildren(root);

    const host = {
        container,
        root,
        grid: null,
        empty: null,
        loaded: false,
        assetsByKey: new Map(),
        popoverManager: null,
    };
    _buildSizeControl(host);
    _buildEmpty(host);
    _buildGrid(host, external.gridWrapper ?? null);
    _bindFeedSelection(host);
    host.popoverManager = createPopoverManager(root);

    // Bind the same context menu as the main grid.
    // The feed is output-only so scope is always "output" — no browser/custom-root
    // items will appear. Delete, rename, rate, tag, find-similar all work normally.
    host._disposeContextMenu = bindGridContextMenu({
        gridContainer: host.grid,
        getState: () => ({ scope: "output" }),
    });
    _bindFeedKeyboard(host);

    // Apply feed display settings and listen for changes
    _applyFeedSettingsClasses(host.grid);
    const onSettingsChanged = () => {
        try {
            _applyFeedSettingsClasses(host.grid);
        } catch (e) {
            console.debug?.(e);
        }
    };
    window.addEventListener("mjr-settings-changed", onSettingsChanged);
    host._disposeFeedSettings = () => {
        try {
            window.removeEventListener("mjr-settings-changed", onSettingsChanged);
        } catch (e) {
            console.debug?.(e);
        }
    };

    return host;
}

export function pushGeneratedAsset(asset) {
    const normalized = _rememberPendingAsset(asset);
    if (!normalized) return;
    for (const host of Array.from(FEED_STATE.hosts)) {
        try {
            if (!host?.grid) continue;
            _storeHostAsset(host, normalized);
            if (!host.loaded) continue;
            host.empty.style.display = "none";
            _scheduleHostRender(host);
        } catch (e) {
            console.debug?.(e);
        }
    }
}

export function createGeneratedFeedHost(container, external = {}) {
    _prepareBottomPanelContainer(container);
    const host = _makeHost(container, external);
    try {
        container._mjrGeneratedFeedHost = host;
    } catch (e) {
        console.debug?.(e);
    }
    FEED_STATE.hosts.add(host);
    void _loadHistory(host);
    return host;
}

export function disposeGeneratedFeedHost(host) {
    const resolvedHost = host?._mjrGeneratedFeedHost || host || null;
    if (!resolvedHost) return;
    const container = resolvedHost.container || null;
    if (container) {
        try {
            delete container._mjrGeneratedFeedHost;
        } catch (e) {
            try {
                container._mjrGeneratedFeedHost = null;
            } catch (err) {
                console.debug?.(err);
            }
            console.debug?.(e);
        }
    }
    FEED_STATE.hosts.delete(resolvedHost);
    try {
        resolvedHost._disposeSelection?.();
    } catch (e) {
        console.debug?.(e);
    }
    try {
        resolvedHost._disposeFeedFocus?.();
    } catch (e) {
        console.debug?.(e);
    }
    try {
        resolvedHost._disposeFeedSettings?.();
    } catch (e) {
        console.debug?.(e);
    }
    try {
        resolvedHost._disposeContextMenu?.();
    } catch (e) {
        console.debug?.(e);
    }
    try {
        resolvedHost.keyboard?.dispose?.();
    } catch (e) {
        console.debug?.(e);
    }
    try {
        resolvedHost.ratingHotkeys?.dispose?.();
    } catch (e) {
        console.debug?.(e);
    }
    try {
        resolvedHost.popoverManager?.dispose?.();
    } catch (e) {
        console.debug?.(e);
    }
    try {
        resolvedHost.gridApp?.unmount?.();
    } catch (e) {
        console.debug?.(e);
    }
    try {
        if (resolvedHost._renderTimer) {
            clearTimeout(resolvedHost._renderTimer);
            resolvedHost._renderTimer = null;
        }
    } catch (e) {
        console.debug?.(e);
    }
    try {
        disposeGrid(resolvedHost.grid);
    } catch (e) {
        console.debug?.(e);
    }
    try {
        resolvedHost.container?.replaceChildren?.();
    } catch (e) {
        console.debug?.(e);
    }
}

export function getGeneratedFeedBottomPanelTab() {
    return {
        id: FEED_TAB_ID,
        title: t("bottomFeed.title", "Generated Feed"),
        icon: "pi pi-images",
        type: "custom",
        render: (el) => createGeneratedFeedHost(el),
        destroy: (hostOrEl) => disposeGeneratedFeedHost(hostOrEl),
    };
}
