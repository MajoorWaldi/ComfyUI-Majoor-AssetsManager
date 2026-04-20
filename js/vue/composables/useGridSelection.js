import { safeEscapeId } from "../../features/grid/GridSelectionManager.js";

function normalizeSelectionIds(value) {
    return Array.isArray(value) ? value.map((id) => String(id || "").trim()).filter(Boolean) : [];
}

export function bindGridSelectionState({
    gridContainer,
    readSelectedAssetIds = () => [],
    readActiveAssetId = () => "",
    writeSelectedAssetIds = () => {},
    writeActiveAssetId = () => {},
    onSelectionChanged = () => {},
    lifecycleSignal = null,
} = {}) {
    if (!gridContainer) {
        return {
            restoreSelectionState() {},
            dispose() {},
        };
    }

    const handleSelectionChanged = (event) => {
        try {
            const detail = event?.detail || {};
            const ids = normalizeSelectionIds(detail.selectedIds);
            writeSelectedAssetIds(ids);
            writeActiveAssetId(String(detail.activeId || ids[0] || "").trim());
        } catch (e) {
            console.debug?.(e);
        }
        try {
            onSelectionChanged(event?.detail || {});
        } catch (e) {
            console.debug?.(e);
        }
    };

    try {
        gridContainer.addEventListener("mjr:selection-changed", handleSelectionChanged, {
            signal: lifecycleSignal || undefined,
        });
    } catch (e) {
        console.debug?.(e);
    }

    const restoreSelectionState = ({ scrollTop = 0 } = {}) => {
        const selected = normalizeSelectionIds(readSelectedAssetIds());
        const activeId = String(readActiveAssetId() || selected[0] || "").trim();
        if (!selected.length && !activeId) return;

        try {
            if (typeof gridContainer?._mjrSetSelection === "function") {
                gridContainer._mjrSetSelection(selected, activeId);
            }
        } catch (e) {
            console.debug?.(e);
        }

        if (!activeId) return;

        // Always scroll to the active card. align:"auto" (default) ensures the
        // virtualizer won't move if the card is already in the viewport, so
        // this is side-effect-free when the saved scroll position is still valid.
        try {
            if (typeof gridContainer?._mjrScrollToAssetId === "function") {
                gridContainer._mjrScrollToAssetId(activeId);
                return;
            }
        } catch (e) {
            console.debug?.(e);
        }

        try {
            const activeCard = gridContainer.querySelector(
                `.mjr-asset-card[data-mjr-asset-id="${safeEscapeId(activeId)}"]`,
            );
            activeCard?.scrollIntoView?.({
                block: "nearest",
                behavior: "instant",
            });
        } catch (e) {
            console.debug?.(e);
        }
    };

    return {
        restoreSelectionState,
        dispose() {
            try {
                gridContainer.removeEventListener("mjr:selection-changed", handleSelectionChanged);
            } catch (e) {
                console.debug?.(e);
            }
        },
    };
}
