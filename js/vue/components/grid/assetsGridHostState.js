import { getOptionalPanelStore } from "../../../stores/getOptionalPanelStore.js";
import { findAssetCardById } from "./gridDomBridge.js";

function noop() {}

function nextFrame() {
    return new Promise((resolve) => {
        try {
            if (typeof requestAnimationFrame === "function") {
                requestAnimationFrame(() => resolve());
                return;
            }
        } catch (e) {
            console.debug?.(e);
        }
        resolve();
    });
}

function safeCall(fn, ...args) {
    try {
        return typeof fn === "function" ? fn(...args) : undefined;
    } catch (e) {
        console.debug?.(e);
        return undefined;
    }
}

function readSelectionDetail(detail = {}) {
    const ids = Array.isArray(detail.selectedIds) ? detail.selectedIds.map(String).filter(Boolean) : [];
    const activeId = String(detail.activeId || ids[0] || "").trim();
    return { ids, activeId };
}

function readGridStats(gridContainer, detail = {}, panelStore = null) {
    const count =
        Number(
            detail.count ?? detail.shown ?? gridContainer?.dataset?.mjrShown ?? panelStore?.lastGridCount ?? 0,
        ) || 0;
    const total =
        Number(detail.total ?? gridContainer?.dataset?.mjrTotal ?? panelStore?.lastGridTotal ?? 0) || 0;
    return { count, total };
}

export function installGridScrollSync(gridWrapper, panelStore = getOptionalPanelStore()) {
    if (!gridWrapper || !panelStore) return noop;

    let scrollRaf = 0;
    const onScroll = () => {
        if (scrollRaf) return;
        try {
            scrollRaf = requestAnimationFrame(() => {
                scrollRaf = 0;
                panelStore.scrollTop = Math.max(0, Math.floor(Number(gridWrapper?.scrollTop || 0) || 0));
            });
        } catch (e) {
            console.debug?.(e);
            panelStore.scrollTop = Math.max(0, Math.floor(Number(gridWrapper?.scrollTop || 0) || 0));
        }
    };

    gridWrapper.addEventListener("scroll", onScroll, { passive: true });

    return () => {
        try {
            gridWrapper.removeEventListener("scroll", onScroll);
        } catch (e) {
            console.debug?.(e);
        }
        if (scrollRaf) {
            try {
                cancelAnimationFrame(scrollRaf);
            } catch (e) {
                console.debug?.(e);
            }
            scrollRaf = 0;
        }
    };
}

export function bindGridHostState(
    gridContainer,
    {
        panelStore = getOptionalPanelStore(),
        onContextChanged = null,
        markUserInteraction = null,
    } = {},
) {
    if (!gridContainer) return noop;

    let mutationRaf = 0;
    const scheduleContextChanged = () => {
        if (mutationRaf) {
            try {
                cancelAnimationFrame(mutationRaf);
            } catch (e) {
                console.debug?.(e);
            }
        }
        try {
            mutationRaf = requestAnimationFrame(() => {
                mutationRaf = 0;
                safeCall(onContextChanged);
            });
        } catch (e) {
            console.debug?.(e);
            mutationRaf = 0;
            safeCall(onContextChanged);
        }
    };

    const onStats = (event) => {
        const detail = event?.detail || {};
        if (panelStore) {
            const { count, total } = readGridStats(gridContainer, detail, panelStore);
            panelStore.lastGridCount = count;
            panelStore.lastGridTotal = total;
        }
        safeCall(onContextChanged);
    };

    const onSelectionChanged = (event) => {
        safeCall(markUserInteraction);
        if (panelStore) {
            const { ids, activeId } = readSelectionDetail(event?.detail || {});
            panelStore.selectedAssetIds = ids;
            panelStore.activeAssetId = activeId;
        }
        safeCall(onContextChanged);
    };

    gridContainer.addEventListener("mjr:grid-stats", onStats);
    gridContainer.addEventListener("mjr:selection-changed", onSelectionChanged);

    try {
        globalThis?.window?.addEventListener?.("mjr-settings-changed", onStats);
    } catch (e) {
        console.debug?.(e);
    }

    let observer = null;
    try {
        if (typeof MutationObserver === "function") {
            observer = new MutationObserver(() => scheduleContextChanged());
            observer.observe(gridContainer, {
                childList: true,
                subtree: true,
            });
        }
    } catch (e) {
        console.debug?.(e);
    }

    return () => {
        try {
            gridContainer.removeEventListener("mjr:grid-stats", onStats);
        } catch (e) {
            console.debug?.(e);
        }
        try {
            gridContainer.removeEventListener("mjr:selection-changed", onSelectionChanged);
        } catch (e) {
            console.debug?.(e);
        }
        try {
            globalThis?.window?.removeEventListener?.("mjr-settings-changed", onStats);
        } catch (e) {
            console.debug?.(e);
        }
        try {
            observer?.disconnect?.();
        } catch (e) {
            console.debug?.(e);
        }
        if (mutationRaf) {
            try {
                cancelAnimationFrame(mutationRaf);
            } catch (e) {
                console.debug?.(e);
            }
            mutationRaf = 0;
        }
    };
}

export async function restoreGridUiState({
    initialLoadPromise,
    gridWrapper,
    gridContainer,
    panelStore = getOptionalPanelStore(),
    onRestoreSidebar = null,
} = {}) {
    if (!gridWrapper || !gridContainer || !panelStore) return;

    try {
        await initialLoadPromise;
    } catch (e) {
        console.debug?.(e);
    }

    await nextFrame();

    const scrollTop = Number(panelStore.scrollTop || 0) || 0;
    if (scrollTop > 0) {
        try {
            gridWrapper.scrollTop = scrollTop;
        } catch (e) {
            console.debug?.(e);
        }
    }

    const selected = Array.isArray(panelStore.selectedAssetIds)
        ? panelStore.selectedAssetIds.map(String).filter(Boolean)
        : [];
    const activeId = String(panelStore.activeAssetId || selected[0] || "").trim();

    if (selected.length || activeId) {
        try {
            if (typeof gridContainer?._mjrSetSelection === "function") {
                gridContainer._mjrSetSelection(selected, activeId);
            }
        } catch (e) {
            console.debug?.(e);
        }

        // Always scroll to the active card so the selection is visible regardless of
        // the saved scroll position. Using align:"auto" (default) means the virtualizer
        // will not move if the card is already in view, so this is side-effect-free
        // when the saved scrollTop already shows the right area.
        if (activeId) {
            const scrollToSelection = () => {
                try {
                    if (typeof gridContainer?._mjrScrollToAssetId === "function") {
                        gridContainer._mjrScrollToAssetId(activeId);
                    } else {
                        const activeCard = findAssetCardById(gridContainer, activeId);
                        activeCard?.scrollIntoView?.({
                            block: "nearest",
                            behavior: "instant",
                        });
                    }
                } catch (e) {
                    console.debug?.(e);
                }
            };
            scrollToSelection();
            // Second pass: handles fresh loads where Vue needs extra time to render items
            // into the virtualizer before scrollToIndex can locate the correct row.
            setTimeout(scrollToSelection, 160);
        }
    }

    if (panelStore.sidebarOpen && activeId) {
        safeCall(onRestoreSidebar);
    }
}
