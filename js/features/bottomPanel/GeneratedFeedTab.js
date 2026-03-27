import { createGridContainer, disposeGrid, loadAssets, upsertAsset } from "../grid/GridView.js";
import { EVENTS } from "../../app/events.js";
import { t } from "../../app/i18n.js";
import { floatingViewerManager } from "../viewer/floatingViewerManager.js";
import { setSelectionIds, getSelectedIdSet } from "../grid/GridSelectionManager.js";

function _getRenderedCards(grid) {
    try {
        if (typeof grid?._mjrGetRenderedCards === "function") {
            const cards = grid._mjrGetRenderedCards();
            if (Array.isArray(cards)) return cards;
        }
    } catch (e) { console.debug?.(e); }
    try {
        return Array.from(grid?.querySelectorAll?.(".mjr-asset-card") || []);
    } catch (e) {
        console.debug?.(e);
        return [];
    }
}

function _applyFeedSelection(grid, ids, activeId = "") {
    const nextIds = Array.isArray(ids) ? ids.map(String).filter(Boolean) : [];
    return setSelectionIds(grid, nextIds, { activeId: activeId || nextIds[0] || "" }, _getRenderedCards);
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
        } catch (e) { console.debug?.(e); }

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
            _applyFeedSelection(grid, nextIds, existing.has(clickedId) ? clickedId : (nextIds[0] || ""));
            if (clickedIndex >= 0) grid._mjrLastSelectedIndex = clickedIndex;
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        _applyFeedSelection(grid, [clickedId], clickedId);
        if (clickedIndex >= 0) grid._mjrLastSelectedIndex = clickedIndex;
        try {
            card.focus?.({ preventScroll: true });
        } catch (e) { console.debug?.(e); }
        event.preventDefault();
        event.stopPropagation();
    };

    grid.addEventListener("click", onClick, true);
    host._disposeSelection = () => {
        try {
            grid.removeEventListener("click", onClick, true);
        } catch (e) { console.debug?.(e); }
    };
}

const FEED_TAB_ID = "majoor-generated-feed";
const FEED_STATE = {
    hosts: new Set(),
    pendingAssets: new Map(),
};

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
        try {
            upsertAsset(host.grid, asset);
        } catch (e) { console.debug?.(e); }
    }
}

async function _loadHistory(host) {
    if (!host?.grid) return;
    host.empty.style.display = "none";
    host.empty.textContent = t("bottomFeed.loading", "Loading recent assets...");
    try {
        const res = await loadAssets(host.grid, "*", { reset: true });
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
        } catch (e) { console.debug?.(e); }
    }
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
        } catch (e) { console.debug?.(e); }
    }
    try {
        container.style.height = "100%";
        container.style.minHeight = "0";
        container.style.overflow = "hidden";
        container.style.display = "flex";
        container.style.flexDirection = "column";
    } catch (e) { console.debug?.(e); }
}

function _buildGrid(host) {
    const wrapper = document.createElement("div");
    wrapper.style.cssText = "position:relative; flex:1 1 auto; min-height:0; overflow:auto; overscroll-behavior:contain; -webkit-overflow-scrolling:touch;";
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
        } catch (e) { console.debug?.(e); }
    };
    const openMfv = () => {
        markActive();
        try {
            window.dispatchEvent(new Event(EVENTS.MFV_OPEN));
        } catch (e) { console.debug?.(e); }
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
                void floatingViewerManager.open().then(() => floatingViewerManager.toggleCompareAB());
            } catch (e) { console.debug?.(e); }
        }
    });
    wrapper.appendChild(grid);
    host.root.appendChild(wrapper);
    host.grid = grid;
}

function _makeHost(container) {
    const root = document.createElement("div");
    root.className = "mjr-assets-manager mjr-bottom-feed";
    root.style.cssText = "padding:6px; height:100%; min-height:0; box-sizing:border-box; display:flex; flex-direction:column;";
    container.replaceChildren(root);

    const host = { container, root, grid: null, empty: null, loaded: false };
    _buildEmpty(host);
    _buildGrid(host);
    _bindFeedSelection(host);
    return host;
}

export function pushGeneratedAsset(asset) {
    const normalized = _rememberPendingAsset(asset);
    if (!normalized) return;
    for (const host of Array.from(FEED_STATE.hosts)) {
        try {
            if (!host?.grid) continue;
            if (!host.loaded) continue;
            host.empty.style.display = "none";
            upsertAsset(host.grid, normalized);
        } catch (e) { console.debug?.(e); }
    }
}

export function renderGeneratedFeedTab(container) {
    _prepareBottomPanelContainer(container);
    const host = _makeHost(container);
    try {
        container._mjrGeneratedFeedHost = host;
    } catch (e) { console.debug?.(e); }
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
            try { container._mjrGeneratedFeedHost = null; } catch (err) { console.debug?.(err); }
            console.debug?.(e);
        }
    }
    FEED_STATE.hosts.delete(resolvedHost);
    try {
        resolvedHost._disposeSelection?.();
    } catch (e) { console.debug?.(e); }
    try {
        disposeGrid(resolvedHost.grid);
    } catch (e) { console.debug?.(e); }
    try {
        resolvedHost.container?.replaceChildren?.();
    } catch (e) { console.debug?.(e); }
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
