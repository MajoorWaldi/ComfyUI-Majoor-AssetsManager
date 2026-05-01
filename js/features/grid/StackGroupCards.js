import { get } from "../../api/client.js";
import { buildStackMembersURL } from "../../api/endpoints.js";
import { EVENTS } from "../../app/events.js";

export function bindCardOverlayButton(button) {
    if (!button || button.dataset?.mjrOverlayButtonBound === "1") return button;

    try {
        button.dataset.mjrOverlayButtonBound = "1";
    } catch (e) {
        console.debug?.(e);
    }
    try {
        button.draggable = false;
    } catch (e) {
        console.debug?.(e);
    }

    const stopOnly = (event) => {
        event.stopPropagation();
    };
    const stopAndPrevent = (event) => {
        event.stopPropagation();
        event.preventDefault();
    };

    button.addEventListener("pointerdown", stopOnly);
    button.addEventListener("mousedown", stopAndPrevent);
    button.addEventListener("touchstart", stopOnly, { passive: true });
    button.addEventListener("dblclick", stopOnly);
    button.addEventListener("keydown", stopOnly);
    button.addEventListener("dragstart", stopAndPrevent);

    return button;
}

function _setIconCount(button, iconClass, count = null, countClass = "mjr-stack-group-button-count") {
    button.textContent = "";
    const icon = document.createElement("span");
    icon.className = iconClass;
    button.appendChild(icon);
    if (count != null) {
        const countEl = document.createElement("span");
        countEl.className = countClass;
        countEl.textContent = String(count);
        button.appendChild(countEl);
    }
}

function _isGroupEnabled(gridContainer) {
    return String(gridContainer?.dataset?.mjrGroupStacks || "") === "1";
}

function _getGroupKey(asset) {
    const stackId = String(asset?.stack_id || "").trim();
    if (stackId) return `stack:${stackId}`;
    return "";
}

async function _fetchGroupMembers(asset) {
    const stackId = String(asset?.stack_id || "").trim();
    if (stackId) {
        const res = await get(buildStackMembersURL(stackId), { timeoutMs: 30_000 });
        if (res?.ok && Array.isArray(res?.data)) return res.data;
        throw new Error(String(res?.error || "Failed to load stack members"));
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

export function getStackAwareAssetKey(gridContainer, asset, fallbackKey) {
    if (!_isGroupEnabled(gridContainer)) return fallbackKey;
    const groupKey = _getGroupKey(asset);
    return groupKey || fallbackKey;
}

export function ensureStackGroupCard(gridContainer, card, asset) {
    if (!card || !asset || !_isGroupEnabled(gridContainer)) {
        card?.querySelector?.(".mjr-stack-group-button")?.remove?.();
        if (card?.dataset) {
            delete card.dataset.mjrStacked;
            delete card.dataset.mjrStackCount;
            delete card.dataset.mjrStackGroupKey;
        }
        return;
    }
    // Vue cards handle their own stack buttons reactively via AssetCardInner.vue
    if (card._mjrIsVue) return;
    const groupKey = _getGroupKey(asset);
    if (!groupKey) {
        card.querySelector?.(".mjr-stack-group-button")?.remove?.();
        delete card.dataset.mjrStacked;
        delete card.dataset.mjrStackCount;
        delete card.dataset.mjrStackGroupKey;
        return;
    }
    card.dataset.mjrStackGroupKey = groupKey;

    const cachedMembers = gridContainer?._mjrStackMembersCache?.get?.(groupKey);
    const knownCount = Array.isArray(cachedMembers)
        ? cachedMembers.length
        : Number(asset?.stack_asset_count || asset?._mjrFeedGroupCount || 0) || 0;
    if (knownCount > 1) {
        card.dataset.mjrStacked = "true";
        card.dataset.mjrStackCount = String(knownCount);
    } else {
        delete card.dataset.mjrStacked;
        delete card.dataset.mjrStackCount;
    }

    let button = card.querySelector(".mjr-stack-group-button");
    if (!button) {
        button = document.createElement("button");
        button.type = "button";
        button.className = "mjr-stack-group-button";
        button.setAttribute("aria-label", "Open generation group in grid");
        bindCardOverlayButton(button);
        button.addEventListener("click", async (event) => {
            event.preventDefault();
            event.stopPropagation();

            try {
                const activeGrid = button?._mjrGridContainer;
                const activeCard = button?._mjrCard;
                const activeAsset = button?._mjrAsset;
                const activeGroupKey = String(button?._mjrGroupKey || "").trim();
                if (!activeGrid || !activeCard || !activeAsset || !activeGroupKey) return;
                if (!activeGrid._mjrStackMembersCache) {
                    activeGrid._mjrStackMembersCache = new Map();
                }
                let members = activeGrid._mjrStackMembersCache.get(activeGroupKey);
                if (!Array.isArray(members)) {
                    members = await _fetchGroupMembers(activeAsset);
                    activeGrid._mjrStackMembersCache.set(activeGroupKey, members);
                }
                const ordered = _sortMembers(members);
                const count = ordered.length;
                if (count > 1) {
                    activeCard.dataset.mjrStacked = "true";
                    activeCard.dataset.mjrStackCount = String(count);
                    _setIconCount(button, "pi pi-clone", count);
                }
                activeGrid.dispatchEvent(
                    new CustomEvent(EVENTS.OPEN_STACK_GROUP, {
                        bubbles: true,
                        detail: {
                            asset: activeAsset,
                            members: ordered,
                            title: `Generation group (${count} assets)`,
                            stackId: String(activeAsset?.stack_id || "").trim(),
                        },
                    }),
                );
            } catch (err) {
                console.debug?.(err);
            }
        });
        card.appendChild(button);
    }

    button._mjrGridContainer = gridContainer;
    button._mjrCard = card;
    button._mjrAsset = asset;
    button._mjrGroupKey = groupKey;
    button.title =
        knownCount > 1
            ? `Open generation group in grid (${knownCount} assets)`
            : "Open generation group in grid";
    _setIconCount(button, "pi pi-clone", knownCount > 1 ? knownCount : null);
}

export function disposeStackGroupCards(gridContainer) {
    try {
        gridContainer._mjrStackMembersCache?.clear?.();
    } catch (e) {
        console.debug?.(e);
    }
}

/**
 * Attach or update a "duplicate stack" button on a card.
 * Called when a filename collision is detected (same filename, different paths).
 * The button opens all copies in the similar/stack-group panel.
 */
export function ensureDupStackCard(gridContainer, card, asset) {
    if (!card || !asset) return;
    // Vue cards handle their own dup-stack buttons reactively via AssetCardInner.vue
    if (card._mjrIsVue) return;
    const isDupStack = !!asset._mjrDupStack;
    const count = Number(asset._mjrDupCount || 0) || 0;

    // Remove the button if no longer a dup stack
    if (!isDupStack || count < 2) {
        const existing = card.querySelector(".mjr-dup-stack-button");
        if (existing) existing.remove();
        delete card.dataset.mjrDupStacked;
        delete card.dataset.mjrDupCount;
        return;
    }

    // Mark the card
    card.dataset.mjrDupStacked = "true";
    card.dataset.mjrDupCount = String(count);

    // Update existing button or create it
    let button = card.querySelector(".mjr-dup-stack-button");
    if (!button) {
        button = document.createElement("button");
        button.type = "button";
        button.className = "mjr-dup-stack-button";
        button.setAttribute("aria-label", "Show all duplicates");
        bindCardOverlayButton(button);

        button.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            try {
                const activeGrid = button?._mjrGridContainer;
                const activeAsset = button?._mjrAsset;
                if (!activeGrid || !activeAsset) return;
                const members = Array.isArray(activeAsset._mjrDupMembers)
                    ? activeAsset._mjrDupMembers
                    : [activeAsset];
                const n = members.length;
                activeGrid.dispatchEvent(
                    new CustomEvent(EVENTS.OPEN_STACK_GROUP, {
                        bubbles: true,
                        detail: {
                            asset: activeAsset,
                            members,
                            title: `Duplicates — ${n} copies`,
                            isDupGroup: true,
                        },
                    }),
                );
            } catch (err) {
                console.debug?.(err);
            }
        });
        card.appendChild(button);
    }

    button._mjrGridContainer = gridContainer;
    button._mjrAsset = asset;
    const label = `${count} duplicate${count > 1 ? "s" : ""}`;
    button.title = `${label} — click to compare all copies`;
    _setIconCount(button, "pi pi-copy", count, "mjr-dup-stack-count");
}
