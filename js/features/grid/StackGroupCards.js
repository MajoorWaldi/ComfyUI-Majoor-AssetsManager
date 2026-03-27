import { createAssetCard } from "../../components/Card.js";
import { getViewerInstance } from "../../components/Viewer.js";
import { get } from "../../api/client.js";
import { buildStackByJobURL, buildStackMembersURL } from "../../api/endpoints.js";
import { createPopoverManager } from "../panel/views/popoverManager.js";

function _isGroupEnabled(gridContainer) {
    return String(gridContainer?.dataset?.mjrGroupStacks || "") === "1";
}

function _getGroupKey(asset) {
    const stackId = String(asset?.stack_id || "").trim();
    if (stackId) return `stack:${stackId}`;
    const jobId = String(asset?.job_id || "").trim();
    if (jobId) return `job:${jobId}`;
    return "";
}

function _getPopoverManager(gridContainer) {
    try {
        const panel = gridContainer?.closest?.(".mjr-am-container");
        const mgr = panel?._mjrPopoverManager;
        if (mgr) return mgr;
    } catch (e) { console.debug?.(e); }
    try {
        if (!gridContainer._mjrLocalPopoverManager) {
            gridContainer._mjrLocalPopoverManager = createPopoverManager(gridContainer.parentElement || gridContainer);
        }
        return gridContainer._mjrLocalPopoverManager;
    } catch (e) {
        console.debug?.(e);
        return null;
    }
}

async function _fetchGroupMembers(asset) {
    const stackId = String(asset?.stack_id || "").trim();
    if (stackId) {
        const res = await get(buildStackMembersURL(stackId), { timeoutMs: 30_000 });
        if (res?.ok && Array.isArray(res?.data)) return res.data;
        throw new Error(String(res?.error || "Failed to load stack members"));
    }

    const jobId = String(asset?.job_id || "").trim();
    if (!jobId) return [asset].filter(Boolean);

    const stackRes = await get(buildStackByJobURL(jobId), { timeoutMs: 30_000 });
    if (stackRes?.ok && stackRes?.data?.id != null) {
        const membersRes = await get(buildStackMembersURL(stackRes.data.id), { timeoutMs: 30_000 });
        if (membersRes?.ok && Array.isArray(membersRes?.data)) return membersRes.data;
    }
    return [asset].filter(Boolean);
}

function _sortMembers(items) {
    return (Array.isArray(items) ? items : []).slice().sort((a, b) => {
        const am = Number(a?.mtime || a?.created_at || 0) || 0;
        const bm = Number(b?.mtime || b?.created_at || 0) || 0;
        return bm - am;
    });
}

function _renderPopoverBody(popover, members, asset) {
    popover.replaceChildren();

    const title = document.createElement("div");
    title.className = "mjr-stack-group-popover-title";
    title.textContent = "Generation group";
    title.style.cssText = "font-size:12px; font-weight:700; opacity:0.92; margin-bottom:8px;";
    popover.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "mjr-stack-group-popover-grid";
    grid.style.cssText = "display:grid; grid-template-columns:repeat(auto-fill, minmax(110px, 1fr)); gap:8px;";

    const ordered = _sortMembers(members);
    ordered.forEach((member, index) => {
        const memberCard = createAssetCard(member);
        memberCard.classList.add("mjr-stack-group-member-card");
        memberCard.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            const viewer = getViewerInstance();
            viewer.open(ordered, index);
        });
        grid.appendChild(memberCard);
    });

    popover.appendChild(grid);
    return ordered.length;
}

export function getStackAwareAssetKey(gridContainer, asset, fallbackKey) {
    if (!_isGroupEnabled(gridContainer)) return fallbackKey;
    const groupKey = _getGroupKey(asset);
    return groupKey || fallbackKey;
}

export function ensureStackGroupCard(gridContainer, card, asset) {
    if (!_isGroupEnabled(gridContainer) || !card || !asset) return;
    const groupKey = _getGroupKey(asset);
    if (!groupKey) return;
    card.dataset.mjrStackGroupKey = groupKey;

    const cachedMembers = gridContainer?._mjrStackMembersCache?.get?.(groupKey);
    const knownCount = Array.isArray(cachedMembers)
        ? cachedMembers.length
        : Math.max(2, Number(asset?.stack_asset_count || asset?._mjrFeedGroupCount || 0) || 0);
    if (knownCount > 1) {
        card.dataset.mjrStacked = "true";
        card.dataset.mjrStackCount = String(knownCount);
    }

    if (card.querySelector(".mjr-stack-group-button")) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "mjr-stack-group-button";
    button.title = "Show other assets from this generation";
    button.setAttribute("aria-label", "Open generation group");
    button.innerHTML = `<span class="pi pi-clone"></span>`;

    const popover = document.createElement("div");
    popover.className = "mjr-popover mjr-stack-group-popover";
    popover.style.cssText = "display:none; width:min(440px, 92vw); padding:10px;";
    try {
        const panel = gridContainer?.closest?.(".mjr-am-container");
        (panel || gridContainer).appendChild(popover);
    } catch (e) { console.debug?.(e); }

    button.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();

        const manager = _getPopoverManager(gridContainer);
        if (!manager) return;

        try {
            if (!gridContainer._mjrStackMembersCache) gridContainer._mjrStackMembersCache = new Map();
            let members = gridContainer._mjrStackMembersCache.get(groupKey);
            if (!Array.isArray(members)) {
                popover.textContent = "Loading...";
                members = await _fetchGroupMembers(asset);
                gridContainer._mjrStackMembersCache.set(groupKey, members);
            }
            const count = _renderPopoverBody(popover, members, asset);
            if (count > 1) {
                card.dataset.mjrStacked = "true";
                card.dataset.mjrStackCount = String(count);
            }
            if (count > 1) {
                button.innerHTML = `<span class="pi pi-clone"></span><span class="mjr-stack-group-button-count">${count}</span>`;
            }
        } catch (err) {
            popover.textContent = String(err?.message || err || "Failed to load group");
        }

        manager.toggle(popover, button);
    });

    card.appendChild(button);
}

export function disposeStackGroupCards(gridContainer) {
    try {
        gridContainer?._mjrLocalPopoverManager?.dispose?.();
    } catch (e) { console.debug?.(e); }
    try {
        gridContainer._mjrLocalPopoverManager = null;
        gridContainer._mjrStackMembersCache?.clear?.();
    } catch (e) { console.debug?.(e); }
}
