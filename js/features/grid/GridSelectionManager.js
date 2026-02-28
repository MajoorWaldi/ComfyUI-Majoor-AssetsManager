/** Grid selection helpers extracted from GridView_impl.js (P3-B-03). */

export function getSelectedIdSet(gridContainer) {
    const selected = new Set();
    if (!gridContainer) return selected;
    try {
        const raw = gridContainer.dataset?.mjrSelectedAssetIds;
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                for (const id of parsed) {
                    if (id == null) continue;
                    selected.add(String(id));
                }
            }
            return selected;
        }
    } catch (e) { console.debug?.(e); }
    try {
        const id = gridContainer.dataset?.mjrSelectedAssetId;
        if (id) selected.add(String(id));
    } catch (e) { console.debug?.(e); }
    return selected;
}

export function setSelectedIdsDataset(gridContainer, selectedSet, activeId = "") {
    const list = Array.from(selectedSet || []);
    const active = activeId ? String(activeId) : (list[0] ? String(list[0]) : "");
    try {
        if (list.length) {
            gridContainer.dataset.mjrSelectedAssetIds = JSON.stringify(list);
            if (active) gridContainer.dataset.mjrSelectedAssetId = String(active);
            else delete gridContainer.dataset.mjrSelectedAssetId;
        } else {
            delete gridContainer.dataset.mjrSelectedAssetIds;
            delete gridContainer.dataset.mjrSelectedAssetId;
        }
    } catch (e) { console.debug?.(e); }
    return list;
}

export function syncSelectionClasses(gridContainer, selectedIds, getRenderedCards) {
    if (!gridContainer) return;
    const set = selectedIds instanceof Set ? selectedIds : new Set(Array.from(selectedIds || []).map(String));
    try {
        const cards = typeof getRenderedCards === "function" ? getRenderedCards(gridContainer) : [];
        for (const card of cards) {
            const id = card?.dataset?.mjrAssetId;
            if (id && set.has(String(id))) {
                card.classList.add("is-selected");
                card.setAttribute("aria-selected", "true");
            } else {
                card.classList.remove("is-selected");
                card.setAttribute("aria-selected", "false");
            }
        }
    } catch (e) { console.debug?.(e); }
}

export function setSelectionIds(gridContainer, selectedIds, { activeId = "" } = {}, getRenderedCards) {
    if (!gridContainer) return [];
    const set = new Set(Array.from(selectedIds || []).map(String).filter(Boolean));
    const list = setSelectedIdsDataset(gridContainer, set, activeId);
    syncSelectionClasses(gridContainer, set, getRenderedCards);
    const selectionDetail = { selectedIds: list, activeId: activeId || list[0] || "" };
    try {
        gridContainer.dispatchEvent?.(new CustomEvent("mjr:selection-changed", { detail: selectionDetail }));
    } catch (e) { console.debug?.(e); }
    // Also dispatch on window so floating overlays (MFV) can subscribe globally.
    try {
        window.dispatchEvent(new CustomEvent("mjr:selection-changed", { detail: selectionDetail }));
    } catch (e) { console.debug?.(e); }
    return list;
}

export function safeEscapeId(value) {
    try {
        return CSS?.escape ? CSS.escape(String(value)) : String(value).replace(/["\\]/g, "\\$&");
    } catch {
        return String(value).replace(/["\\]/g, "\\$&");
    }
}
