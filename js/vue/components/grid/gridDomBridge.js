export function safeEscapeAttr(value) {
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

export function readRenderedAssetCards(gridContainer) {
    if (!gridContainer) return [];
    try {
        return Array.from(gridContainer.querySelectorAll?.(".mjr-asset-card") || []);
    } catch (e) {
        console.debug?.(e);
        return [];
    }
}

export function findSelectedAssetCard(gridContainer) {
    if (!gridContainer) return null;
    try {
        return gridContainer.querySelector?.(".mjr-asset-card.is-selected") || null;
    } catch (e) {
        console.debug?.(e);
        return null;
    }
}

export function findAssetCardById(gridContainer, assetId) {
    if (!gridContainer) return null;
    const id = String(assetId || "").trim();
    if (!id) return null;
    try {
        return (
            gridContainer.querySelector?.(
                `.mjr-asset-card[data-mjr-asset-id="${safeEscapeAttr(id)}"]`,
            ) || null
        );
    } catch (e) {
        console.debug?.(e);
        return null;
    }
}

export function readGridShownCount(gridContainer, fallback = 0) {
    const raw = gridContainer?.dataset?.mjrShown;
    const count = Number(raw);
    return Number.isFinite(count) ? Math.max(0, count) : Math.max(0, Number(fallback) || 0);
}
