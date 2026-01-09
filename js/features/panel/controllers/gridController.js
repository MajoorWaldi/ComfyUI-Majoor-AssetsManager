export function createGridController({ gridContainer, loadAssets, disposeGrid, getQuery, state }) {
    const reloadGrid = async () => {
        gridContainer.dataset.mjrScope = state.scope;
        gridContainer.dataset.mjrCustomRootId = state.customRootId || "";
        gridContainer.dataset.mjrFilterKind = state.kindFilter || "";
        gridContainer.dataset.mjrFilterWorkflowOnly = state.workflowOnly ? "1" : "0";
        gridContainer.dataset.mjrFilterMinRating = String(state.minRating || 0);
        gridContainer.dataset.mjrFilterDateRange = state.dateRangeFilter || "";
        gridContainer.dataset.mjrFilterDateExact = state.dateExactFilter || "";
        gridContainer.dataset.mjrSort = state.sort || "mtime_desc";

        // Keep selection durable across re-renders by persisting it in the dataset
        // (GridView re-applies selection as cards are created).
        try {
            const selected = Array.isArray(state.selectedAssetIds) ? state.selectedAssetIds.filter(Boolean).map(String) : [];
            if (selected.length) {
                gridContainer.dataset.mjrSelectedAssetIds = JSON.stringify(selected);
                gridContainer.dataset.mjrSelectedAssetId = String(state.activeAssetId || selected[0] || "");
            } else {
                delete gridContainer.dataset.mjrSelectedAssetIds;
                delete gridContainer.dataset.mjrSelectedAssetId;
            }
        } catch {}

        if (state.scope === "custom" && !state.customRootId) {
            try {
                disposeGrid(gridContainer);
            } catch {}
            gridContainer.innerHTML = "";
            const p = document.createElement("p");
            p.className = "mjr-muted";
            p.textContent = "Add a custom folder to browse.";
            gridContainer.appendChild(p);
            return;
        }

        await loadAssets(gridContainer, getQuery());
    };

    return { reloadGrid };
}
