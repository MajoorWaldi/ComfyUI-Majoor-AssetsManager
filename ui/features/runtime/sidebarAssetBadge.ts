const BADGE_CLASS = "mjr-sidebar-asset-badge";
const BADGED_CLASS = "mjr-sidebar-tab-has-badge";
const STYLE_ID = "mjr-sidebar-asset-badge-style";
const MAX_DISPLAY_COUNT = 99;

let _count = 0;
let _sidebarTabId = "majoor-assets";
const _seenAssetIds = new Set();

function ensureBadgeStyles() {
    if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
        .${BADGED_CLASS} {
            position: relative !important;
        }
        .${BADGE_CLASS} {
            position: absolute;
            top: 3px;
            right: 3px;
            min-width: 14px;
            height: 14px;
            padding: 0 4px;
            border-radius: 999px;
            box-sizing: border-box;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: #ef4444;
            color: #fff;
            border: 1px solid rgba(0, 0, 0, 0.55);
            box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.18);
            font-size: 9px;
            line-height: 1;
            font-weight: 800;
            pointer-events: none;
            z-index: 3;
        }
    `;
    document.head?.appendChild(style);
}

function selectorForTabId(tabId: any) {
    const raw = String(tabId || "").trim();
    if (!raw) return [];
    const escaped = (() => {
        try {
            return CSS.escape(raw);
        } catch {
            return raw.replace(/(["\\])/g, "\\$1");
        }
    })();
    return [
        `#${escaped}`,
        `[data-tab-id="${escaped}"]`,
        `[data-sidebar-tab-id="${escaped}"]`,
        `[data-id="${escaped}"]`,
        `[aria-controls="${escaped}"]`,
        `[href="#${escaped}"]`,
    ];
}

function isLikelyAssetsTab(el: any) {
    const text = `${el?.textContent || ""} ${el?.title || ""} ${el?.getAttribute?.("aria-label") || ""}`;
    return /assets\s*manager|majoor/i.test(text);
}

function isElementLike(el: any) {
    if (!el || typeof el !== "object") return false;
    if (typeof HTMLElement !== "undefined") return el instanceof HTMLElement;
    return typeof el.querySelector === "function" && typeof el.appendChild === "function";
}

function findSidebarTabElement() {
    if (typeof document === "undefined") return null;
    for (const selector of selectorForTabId(_sidebarTabId)) {
        const direct = document.querySelector(selector);
        if (isElementLike(direct)) return direct;
    }
    const iconCandidates = Array.from(document.querySelectorAll(".pi-folder, .pi-folder-open"));
    for (const icon of iconCandidates) {
        const tab = icon.closest?.("button,[role='tab'],a,.p-button,.comfyui-button,.sidebar-tab");
        if (isElementLike(tab) && isLikelyAssetsTab(tab)) return tab;
    }
    const labelled = Array.from(
        document.querySelectorAll("button,[role='tab'],a,.p-button,.comfyui-button,.sidebar-tab"),
    );
    return labelled.find((el) => isElementLike(el) && isLikelyAssetsTab(el)) || null;
}

function updateBadge() {
    ensureBadgeStyles();
    const tab = findSidebarTabElement();
    if (!tab) return false;
    let badge = tab.querySelector(`:scope > .${BADGE_CLASS}`);
    if (_count <= 0) {
        badge?.remove();
        tab.classList.remove(BADGED_CLASS);
        return true;
    }
    if (!badge) {
        badge = document.createElement("span");
        badge.className = BADGE_CLASS;
        badge.setAttribute("aria-hidden", "true");
        tab.appendChild(badge);
    }
    tab.classList.add(BADGED_CLASS);
    badge.textContent = _count > MAX_DISPLAY_COUNT ? `${MAX_DISPLAY_COUNT}+` : String(_count);
    return true;
}

function scheduleBadgeUpdate() {
    updateBadge();
    if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(() => updateBadge());
    }
    setTimeout(() => updateBadge(), 250);
    setTimeout(() => updateBadge(), 1000);
}

export function configureSidebarAssetBadge({ sidebarTabId }: { sidebarTabId?: string } = {}): void {
    const nextId = String(sidebarTabId || "").trim();
    if (nextId) _sidebarTabId = nextId;
    scheduleBadgeUpdate();
}

export function incrementSidebarAssetBadge(asset: any = null): void {
    const assetId = String(asset?.id || asset?.asset_id || "").trim();
    if (assetId) {
        if (_seenAssetIds.has(assetId)) return;
        _seenAssetIds.add(assetId);
        if (_seenAssetIds.size > 1000) {
            const keep = Array.from(_seenAssetIds).slice(-500);
            _seenAssetIds.clear();
            for (const id of keep) _seenAssetIds.add(id);
        }
    }
    _count += 1;
    scheduleBadgeUpdate();
}

export function resetSidebarAssetBadge(): void {
    _count = 0;
    _seenAssetIds.clear();
    scheduleBadgeUpdate();
}

export function getSidebarAssetBadgeCount(): number {
    return _count;
}
