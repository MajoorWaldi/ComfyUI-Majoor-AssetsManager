import { createGridContainer, disposeGrid, loadAssetsFromList } from "../grid/GridView.js";
import { EVENTS } from "../../app/events.js";
import { t } from "../../app/i18n.js";
import { floatingViewerManager } from "../viewer/floatingViewerManager.js";
import { setSelectionIds, getSelectedIdSet } from "../grid/GridSelectionManager.js";
import { createAssetCard } from "../../components/Card.js";
import { getViewerInstance } from "../../components/Viewer.js";
import { get } from "../../api/client.js";
import { buildListURL } from "../../api/endpoints.js";
import { createPopoverManager } from "../panel/views/popoverManager.js";
import { APP_CONFIG } from "../../app/config.js";

const FEED_FETCH_LIMIT = 240;
const FEED_PAGE_SIZE = 120;

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
        if (interactive && card.contains(interactive)) return;
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
    const stackId = String(asset?.stack_id || "").trim();
    if (stackId) return `stack:${stackId}`;
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

function _openGroupViewer(groupedAsset, startIndex = 0) {
    const assets = Array.isArray(groupedAsset?._mjrFeedGroupAssets)
        ? groupedAsset._mjrFeedGroupAssets.filter(Boolean)
        : [groupedAsset].filter(Boolean);
    if (!assets.length) return;
    const viewer = getViewerInstance();
    viewer.open(assets, Math.max(0, Math.min(startIndex, assets.length - 1)));
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
        "display:grid; grid-template-columns:repeat(auto-fill, minmax(110px, 1fr)); gap:8px;";

    const assets = Array.isArray(groupedAsset?._mjrFeedGroupAssets)
        ? groupedAsset._mjrFeedGroupAssets
        : [];
    for (let index = 0; index < assets.length; index += 1) {
        const member = assets[index];
        const card = createAssetCard(member);
        card.classList.add("mjr-feed-group-member-card");
        if (index === 0) card.classList.add("mjr-feed-group-member-card--cover");
        card.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            host.popoverManager?.close?.(popover);
            _openGroupViewer(groupedAsset, index);
        });
        grid.appendChild(card);
    }

    popover.appendChild(grid);
    host.root.appendChild(popover);
    return popover;
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
        const count = Number(groupedAsset?._mjrFeedGroupCount || 0) || 0;
        if (count <= 1) continue;

        card.dataset.mjrFeedGrouped = "true";
        card.dataset.mjrFeedGroupCount = String(count);
        card.dataset.mjrStacked = "true";
        card.dataset.mjrStackCount = String(count);

        if (card.querySelector(".mjr-feed-group-button")) continue;

        const badge = document.createElement("button");
        badge.type = "button";
        badge.className = "mjr-feed-group-button";
        badge.title = t("bottomFeed.groupOpen", "Show other assets from this generation");
        badge.setAttribute("aria-label", `${count} assets`);
        badge.innerHTML = `<span class="mjr-feed-group-button-icon pi pi-clone"></span><span class="mjr-feed-group-button-count">${count}</span>`;
        badge.style.cssText = "position:absolute; top:6px; right:6px; z-index:3;";

        const popover = _buildGroupPopover(host, groupedAsset);
        badge.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            host.popoverManager?.toggle?.(popover, badge);
        });

        card.appendChild(badge);
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

function _normalizeAsset(asset) {
    if (!asset || typeof asset !== "object") return null;
    const normalized = { ...asset };
    if (!normalized.type && normalized.source) normalized.type = normalized.source;
    if (!normalized.source && normalized.type) normalized.source = normalized.type;
    if (!normalized.kind) {
        const ext = String(normalized.ext || normalized.filename || "").toLowerCase();
        normalized.kind = /\.(mp4|mov|webm|mkv|avi)$/.test(ext) ? "video" : "image";
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
        const res = await loadAssetsFromList(host.grid, _groupFeedAssets(assets), {
            title: t("bottomFeed.title", "Generated Feed"),
            reset: true,
        });
        _enhanceGroupedCards(host, _groupFeedAssets(_getHostAssets(host)));
        await _applyPendingAssets(host);
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
    toggle("mjr-feed-show-dot", APP_CONFIG.FEED_SHOW_WORKFLOW_DOT);
    toggle("mjr-feed-show-badges-ext", APP_CONFIG.FEED_SHOW_BADGES_EXTENSION);
    toggle("mjr-feed-show-badges-rating", APP_CONFIG.FEED_SHOW_BADGES_RATING);
    toggle("mjr-feed-show-badges-tags", APP_CONFIG.FEED_SHOW_BADGES_TAGS);
}

function _buildGrid(host) {
    const wrapper = document.createElement("div");
    wrapper.style.cssText =
        "position:relative; flex:1 1 auto; min-height:0; overflow:auto; overscroll-behavior:contain; -webkit-overflow-scrolling:touch;";
    const grid = createGridContainer();
    grid.style.minHeight = "100%";
    grid.style.height = "auto";
    grid.dataset.mjrScope = "output";
    grid.dataset.mjrQuery = "*";
    grid.dataset.mjrSort = "mtime_desc";
    grid.dataset.mjrBottomFeed = "true";
    const markActive = () => {
        try {
            window.__MJR_LAST_SELECTION_GRID__ = grid;
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
    grid.addEventListener("pointerdown", markActive, true);
    grid.addEventListener("focusin", markActive, true);
    grid.addEventListener("dblclick", openMfv, true);
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
    wrapper.appendChild(grid);
    host.root.appendChild(wrapper);
    host.grid = grid;
}

function _makeHost(container) {
    const root = document.createElement("div");
    root.className = "mjr-assets-manager mjr-bottom-feed";
    root.style.cssText =
        "padding:6px; height:100%; min-height:0; box-sizing:border-box; display:flex; flex-direction:column;";
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
    _buildEmpty(host);
    _buildGrid(host);
    _bindFeedSelection(host);
    host.popoverManager = createPopoverManager(root);

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
            void _renderHostAssets(host);
        } catch (e) {
            console.debug?.(e);
        }
    }
}

export function renderGeneratedFeedTab(container) {
    _prepareBottomPanelContainer(container);
    const host = _makeHost(container);
    try {
        container._mjrGeneratedFeedHost = host;
    } catch (e) {
        console.debug?.(e);
    }
    FEED_STATE.hosts.add(host);
    void _loadHistory(host);
    return host;
}

export function disposeGeneratedFeedTab(host) {
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
        resolvedHost._disposeFeedSettings?.();
    } catch (e) {
        console.debug?.(e);
    }
    try {
        resolvedHost.popoverManager?.dispose?.();
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
        render: (el) => renderGeneratedFeedTab(el),
        destroy: (hostOrEl) => disposeGeneratedFeedTab(hostOrEl),
    };
}
