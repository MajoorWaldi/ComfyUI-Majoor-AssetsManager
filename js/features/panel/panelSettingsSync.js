import { loadMajoorSettings } from "../../app/settings.js";
import { toggleWatcher, setWatcherScope } from "../../api/client.js";
import { getActiveGridContainer } from "./panelRuntimeRefs.js";

/**
 * Creates the settings-change sync layer for the panel.
 *
 * Manages:
 *  - AI feature UI state (disabled CSS class, similar-btn tooltip)
 *  - Sidebar panel position (left / right DOM reorder)
 *  - File-system watcher enable/disable per scope
 *  - CSS custom-property updates (card colors, rating/tag colors)
 *  - Grid / sidebar refresh when relevant settings keys change
 *
 * Fires an initial sync immediately and registers the `mjr-settings-changed`
 * window listener for live updates. The listener is removed automatically when
 * `panelLifecycleAC` is aborted.
 *
 * @returns {{ applyWatcherForScope, isAiEnabled, applyAiUiState, applySidebarPosition }}
 */
export function createSettingsSync({
    container,
    state,
    sidebar,
    browseSection,
    gridWrapper,
    similarBtn,
    setSemanticEnabled,
    similarEnabledTitle,
    similarDisabledTitle,
    refreshGridFn,
    isSidebarOpen,
    readActiveAssetId,
    getSidebarController,
    panelLifecycleAC,
}) {
    let _sidebarPosition = "";

    // ── AI UI state ────────────────────────────────────────────────────────

    const isAiEnabled = () => {
        try {
            const s = loadMajoorSettings();
            return !!(s?.ai?.vectorSearchEnabled ?? true);
        } catch {
            return true;
        }
    };

    const applyAiUiState = (enabled) => {
        const aiEnabled = !!enabled;
        try {
            container.classList.toggle("mjr-ai-disabled", !aiEnabled);
        } catch (e) {
            console.debug?.(e);
        }
        try {
            similarBtn.disabled = !aiEnabled;
            similarBtn.title = aiEnabled ? similarEnabledTitle : similarDisabledTitle;
        } catch (e) {
            console.debug?.(e);
        }
        try {
            setSemanticEnabled?.(aiEnabled);
        } catch (e) {
            console.debug?.(e);
        }
    };

    // ── Sidebar position ───────────────────────────────────────────────────

    const applySidebarPosition = (nextPosition) => {
        const pos = String(nextPosition || "right").toLowerCase() === "left" ? "left" : "right";
        if (_sidebarPosition === pos) return;
        _sidebarPosition = pos;

        let scrollTop = 0;
        let scrollLeft = 0;
        try {
            scrollTop = Number(gridWrapper?.scrollTop || 0) || 0;
            scrollLeft = Number(gridWrapper?.scrollLeft || 0) || 0;
        } catch (e) {
            console.debug?.(e);
        }

        try {
            sidebar.dataset.position = pos;
            const isOpen = sidebar.classList?.contains?.("is-open");
            const borderColor = "var(--mjr-border, rgba(255,255,255,0.12))";
            sidebar.style.borderLeft =
                pos === "left" ? "none" : isOpen ? `1px solid ${borderColor}` : "none";
            sidebar.style.borderRight =
                pos === "left" ? (isOpen ? `1px solid ${borderColor}` : "none") : "none";
        } catch (e) {
            console.debug?.(e);
        }

        try {
            if (pos === "left") {
                browseSection.appendChild(sidebar);
                browseSection.appendChild(gridWrapper);
                browseSection.insertBefore(sidebar, browseSection.firstChild);
            } else {
                browseSection.appendChild(gridWrapper);
                browseSection.appendChild(sidebar);
            }
        } catch (e) {
            console.debug?.(e);
        }

        try {
            requestAnimationFrame(() => {
                try {
                    gridWrapper.scrollTop = scrollTop;
                    gridWrapper.scrollLeft = scrollLeft;
                } catch (e) {
                    console.debug?.(e);
                }
            });
        } catch {
            try {
                gridWrapper.scrollTop = scrollTop;
                gridWrapper.scrollLeft = scrollLeft;
            } catch (e) {
                console.debug?.(e);
            }
        }
    };

    // ── Watcher ────────────────────────────────────────────────────────────

    const applyWatcherForScope = async (nextScope) => {
        const scope = String(nextScope || state.scope || "output").toLowerCase();
        const settings = loadMajoorSettings();
        const wantsEnabled = !!settings?.watcher?.enabled;
        // Custom scope is a live filesystem browser; watcher must stay disabled there.
        if (scope === "custom") {
            try {
                await toggleWatcher(false);
            } catch (e) {
                console.debug?.(e);
            }
            return;
        }
        try {
            await toggleWatcher(wantsEnabled);
        } catch (e) {
            console.debug?.(e);
        }
        if (!wantsEnabled) return;
        try {
            await setWatcherScope({ scope, customRootId: "" });
        } catch (e) {
            console.debug?.(e);
        }
    };

    // ── Settings-changed handler ───────────────────────────────────────────

    const onSettingsChanged = (_e) => {
        const changedKey = String(_e?.detail?.key || "").trim();
        const isInitialSync = changedKey === "__init__";
        const shouldRefreshGrid =
            isInitialSync ||
            changedKey.startsWith("grid.") ||
            changedKey.startsWith("infiniteScroll.") ||
            changedKey.startsWith("siblings.") ||
            changedKey.startsWith("search.") ||
            changedKey.startsWith("rtHydrate.") ||
            changedKey.startsWith("workflowMinimap.");
        const shouldRefreshSidebar =
            isInitialSync || changedKey.startsWith("sidebar.") || changedKey.startsWith("ai.");
        const shouldApplyWatcher = isInitialSync || changedKey.startsWith("watcher.");

        try {
            const s = loadMajoorSettings();
            const aiEnabled = !!(s?.ai?.vectorSearchEnabled ?? true);
            const hover = String(s?.ui?.cardHoverColor || "").trim();
            const selected = String(s?.ui?.cardSelectionColor || "").trim();
            const ratingColor = String(s?.ui?.ratingColor || "").trim();
            const tagColor = String(s?.ui?.tagColor || "").trim();
            if (/^#[0-9a-fA-F]{3,8}$/.test(hover))
                document.documentElement.style.setProperty("--mjr-card-hover-color", hover);
            if (/^#[0-9a-fA-F]{3,8}$/.test(selected))
                document.documentElement.style.setProperty("--mjr-card-selection-color", selected);
            if (/^#[0-9a-fA-F]{3,8}$/.test(ratingColor))
                document.documentElement.style.setProperty("--mjr-rating-color", ratingColor);
            if (/^#[0-9a-fA-F]{3,8}$/.test(tagColor))
                document.documentElement.style.setProperty("--mjr-tag-color", tagColor);

            applySidebarPosition(s.sidebar?.position || "right");
            applyAiUiState(aiEnabled);

            if (shouldRefreshGrid) {
                // Use getActiveGridContainer() to avoid stale closure reference.
                const currentGrid = getActiveGridContainer() || null;
                // Siblings toggle requires a full data reload: PNG siblings are filtered
                // during appendAssets (state.assets), so refreshGrid alone can't add them
                // back or remove them — a re-fetch is needed.
                if (!isInitialSync && changedKey.startsWith("siblings.")) {
                    try {
                        currentGrid?.dispatchEvent(new CustomEvent("mjr:reload-grid"));
                    } catch {
                        if (currentGrid) refreshGridFn(currentGrid);
                    }
                } else if (
                    changedKey.startsWith("grid.") ||
                    changedKey.startsWith("workflowMinimap.")
                ) {
                    if (currentGrid) refreshGridFn(currentGrid);
                }
            }
            if (shouldRefreshSidebar && isSidebarOpen() && readActiveAssetId()) {
                getSidebarController()?.refreshActiveAsset?.();
            }
        } catch (e) {
            console.debug?.(e);
        }

        try {
            if (!shouldApplyWatcher) return;
            applyWatcherForScope(state.scope);
        } catch (e) {
            console.debug?.(e);
        }
    };

    // Fire initial sync (applies sidebar position, AI state, CSS props).
    try {
        onSettingsChanged({ detail: { key: "__init__" } });
    } catch (e) {
        console.debug?.(e);
    }

    // Register live-update listener — removed automatically when AC aborts.
    try {
        window.addEventListener?.("mjr-settings-changed", onSettingsChanged, {
            signal: panelLifecycleAC?.signal,
        });
    } catch (e) {
        console.debug?.(e);
    }

    return { applyWatcherForScope, isAiEnabled, applyAiUiState, applySidebarPosition };
}
