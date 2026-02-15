
import { comfyConfirm } from "../../app/dialogs.js";
import { comfyToast } from "../../app/toast.js";
import { createStatusIndicator, setupStatusPolling, triggerScan, updateStatus } from "../status/StatusDot.js";
import {
    createGridContainer,
    loadAssets,
    loadAssetsFromList,
    prepareGridForScopeSwitch,
    disposeGrid,
    refreshGrid,
    captureAnchor,
    restoreAnchor,
    bindGridScanListeners,
    disposeGridScanListeners,
} from "../grid/GridView.js";
import {
    get,
    post,
    getCollectionAssets,
    toggleWatcher,
    setWatcherScope,
    getDuplicateAlerts,
    startDuplicatesAnalysis,
    mergeDuplicateTags,
    deleteAssets
} from "../../api/client.js";
import { ENDPOINTS } from "../../api/endpoints.js";
import { createSidebar, showAssetInSidebar, closeSidebar } from "../../components/SidebarView.js";
import { createRatingBadge, createTagsBadge } from "../../components/Badges.js";
import { loadMajoorSettings } from "../../app/settings.js";
import { createPopoverManager } from "./views/popoverManager.js";
import { createCollectionsPopoverView } from "../collections/views/collectionsPopoverView.js";
import { createCollectionsController } from "../collections/controllers/collectionsController.js";

import { createPanelState } from "./state/panelState.js";
import { createHeaderView } from "./views/headerView.js";
import { createCustomPopoverView } from "./views/customPopoverView.js";
import { createFilterPopoverView } from "./views/filterPopoverView.js";
import { createSortPopoverView } from "./views/sortPopoverView.js";
import { createSearchView } from "./views/searchView.js";
import { createPinnedFoldersPopoverView } from "./views/pinnedFoldersPopoverView.js";
import { createSummaryBarView } from "./views/summaryBarView.js";
import { createAgendaCalendar } from "../filters/calendar/AgendaCalendar.js";

import { normalizeQuery } from "./controllers/query.js";
import { createGridController } from "./controllers/gridController.js";
import { createScopeController } from "./controllers/scopeController.js";
import { createContextController } from "./controllers/contextController.js";
import { createCustomRootsController } from "./controllers/customRootsController.js";
import { bindFilters } from "./controllers/filtersController.js";
import { createSortController } from "./controllers/sortController.js";
import { bindSidebarOpen } from "./controllers/sidebarController.js";
import { createPanelHotkeysController } from "./controllers/panelHotkeysController.js";
import { createRatingHotkeysController } from "./controllers/ratingHotkeysController.js";
import { bindGridContextMenu } from "../contextmenu/GridContextMenu.js";

let _activeGridContainer = null;

export function getActiveGridContainer() {
    // First try the cached reference
    if (_activeGridContainer && _activeGridContainer.isConnected) {
        return _activeGridContainer;
    }
    // Fallback: try to find it in the DOM by ID or class
    try {
        const grid = document.getElementById("mjr-assets-grid") || document.querySelector(".mjr-grid");
        if (grid && grid.isConnected) {
            return grid;
        }
    } catch {}
    return null;
}

export async function renderAssetsManager(container, { useComfyThemeUI = true } = {}) {
    const panelLifecycleAC = typeof AbortController !== "undefined" ? new AbortController() : null;
    if (useComfyThemeUI) {
        container.classList.add("mjr-assets-manager");
    } else {
        container.classList.remove("mjr-assets-manager");
    }

    // Cleanup previous instance before re-render to prevent listener leaks
    try {
        container._eventCleanup?.();
    } catch {}
    try {
        container._mjrPanelState?._mjrDispose?.();
    } catch {}
    try {
        container._mjrPopoverManager?.dispose?.();
    } catch {}
    try {
        container._mjrHotkeys?.dispose?.();
    } catch {}
    try {
        container._mjrRatingHotkeys?.dispose?.();
    } catch {}
    try {
        container._mjrSidebarController?.dispose?.();
    } catch {}
    try {
        container._mjrGridContextMenuUnbind?.();
    } catch {}

    container.replaceChildren();
    container.classList.add("mjr-am-container");

    const popovers = createPopoverManager(container);
    try {
        container._mjrPopoverManager = popovers;
    } catch {}
    const state = createPanelState();
    try {
        container._mjrPanelState = state;
    } catch {}

    const headerView = createHeaderView();
    const { header, headerActions, tabButtons, customMenuBtn, filterBtn, sortBtn, collectionsBtn, pinnedFoldersBtn } = headerView;

    const { customPopover, customSelect, customAddBtn, customRemoveBtn } = createCustomPopoverView();
    const {
        filterPopover,
        kindSelect,
        wfCheckbox,
        workflowTypeSelect,
        ratingSelect,
        minSizeInput,
        maxSizeInput,
        resolutionPresetSelect,
        minWidthInput,
        minHeightInput,
        dateRangeSelect,
        dateExactInput,
        agendaContainer
    } = createFilterPopoverView();
    const { sortPopover, sortMenu } = createSortPopoverView();
    const { collectionsPopover, collectionsMenu } = createCollectionsPopoverView();
    const { pinnedFoldersPopover, pinnedFoldersMenu } = createPinnedFoldersPopoverView();

    headerActions.appendChild(customPopover);

    const { searchSection, searchInputEl } = createSearchView({
        filterBtn,
        sortBtn,
        collectionsBtn,
        pinnedFoldersBtn,
        filterPopover,
        sortPopover,
        collectionsPopover,
        pinnedFoldersPopover
    });
    
    // Restore persistent search query
    if (state.searchQuery) {
        searchInputEl.value = state.searchQuery;
    }
    searchInputEl.addEventListener("input", (e) => {
        state.searchQuery = e.target.value;
    }, { signal: panelLifecycleAC?.signal });

    const { bar: summaryBar, update: updateSummaryBar } = createSummaryBarView();
    const folderBreadcrumb = document.createElement("div");
    folderBreadcrumb.className = "mjr-folder-breadcrumb";
    folderBreadcrumb.style.cssText = "display:none; align-items:center; gap:6px; padding:4px 8px; margin:2px 0 4px 0; font-size:12px; opacity:0.85; overflow:auto; white-space:nowrap;";

    const content = document.createElement("div");
    content.classList.add("mjr-am-content");
    let gridContainer = null;
    let sidebarController = null;

    container.tabIndex = -1;

    const statusSection = createStatusIndicator();
    const statusDot = statusSection.querySelector("#mjr-status-dot");
    const statusText = statusSection.querySelector("#mjr-status-text");
    const capabilitiesSection = statusSection.querySelector("#mjr-status-capabilities");

    const browseSection = document.createElement("div");
    browseSection.classList.add("mjr-am-browse");
    browseSection.style.cssText = `
        flex: 1;
        display: flex;
        flex-direction: row;
        overflow: hidden;
    `;

    const gridWrapper = document.createElement("div");
    gridWrapper.style.cssText = `
        flex: 1;
        overflow: auto;
        position: relative;
    `;

    // NOTE: Scroll restoration is done AFTER grid loads (see initialLoadPromise below).
    // Restoring scroll on an empty grid would be useless.
    
    let _scrollTimer = null;
    let _lastUserInteractionAt = 0;
    const markUserInteraction = () => {
        try {
            _lastUserInteractionAt = Date.now();
        } catch {
            _lastUserInteractionAt = 0;
        }
    };
    gridWrapper.addEventListener("scroll", () => {
        markUserInteraction();
        if (_scrollTimer) clearTimeout(_scrollTimer);
        _scrollTimer = setTimeout(() => {
            try {
                state.scrollTop = gridWrapper.scrollTop;
            } catch {}
        }, 100);
    }, { passive: true, signal: panelLifecycleAC?.signal });

    gridContainer = createGridContainer();
    gridWrapper.appendChild(gridContainer);
    _activeGridContainer = gridContainer;
    const summaryBarDisposers = [];
    const registerSummaryDispose = (fn) => {
        if (typeof fn === "function") summaryBarDisposers.push(fn);
    };
    gridContainer._mjrSummaryBarDispose = () => {
        for (const fn of summaryBarDisposers.splice(0)) {
            try {
                fn();
            } catch {}
        }
    };
    try {
        const handler = () => {
            try {
                updateSummaryBar?.({ state, gridContainer });
            } catch {}
        };
        gridContainer.addEventListener("mjr:grid-stats", handler);
        registerSummaryDispose(() => {
            try {
                gridContainer.removeEventListener("mjr:grid-stats", handler);
            } catch {}
        });
    } catch {}
    try {
        bindGridScanListeners();
    } catch {}

    // Bind grid context menu
    container._mjrGridContextMenuUnbind = bindGridContextMenu({
        gridContainer,
        getState: () => state,
        onRequestOpenViewer: (asset) => {
            gridContainer?.dispatchEvent?.(new CustomEvent("mjr:open-viewer", { detail: { asset } }));
        },
    });

    const settings = loadMajoorSettings();
    const sidebar = createSidebar(settings.sidebar?.position || "right");

    let _sidebarPosition = "right";
    const applySidebarPosition = (nextPosition) => {
        const pos = String(nextPosition || "right").toLowerCase() === "left" ? "left" : "right";
        if (_sidebarPosition === pos) return;
        _sidebarPosition = pos;

        // Preserve grid scroll where possible.
        let scrollTop = 0;
        let scrollLeft = 0;
        try {
            scrollTop = Number(gridWrapper?.scrollTop || 0) || 0;
            scrollLeft = Number(gridWrapper?.scrollLeft || 0) || 0;
        } catch {}

        try {
            sidebar.dataset.position = pos;
        } catch {}

        try {
            if (pos === "left") {
                browseSection.appendChild(sidebar);
                browseSection.appendChild(gridWrapper);
                browseSection.insertBefore(sidebar, browseSection.firstChild);
            } else {
                browseSection.appendChild(gridWrapper);
                browseSection.appendChild(sidebar);
            }
        } catch {}

        try {
            requestAnimationFrame(() => {
                try {
                    gridWrapper.scrollTop = scrollTop;
                    gridWrapper.scrollLeft = scrollLeft;
                } catch {}
            });
        } catch {
            try {
                gridWrapper.scrollTop = scrollTop;
                gridWrapper.scrollLeft = scrollLeft;
            } catch {}
        }
    };

    const applyWatcherForScope = async (nextScope) => {
        const scope = String(nextScope || state.scope || "output").toLowerCase();
        const settings = loadMajoorSettings();
        const wantsEnabled = !!settings?.watcher?.enabled;
        // Custom scope is a live filesystem browser; watcher must stay disabled there.
        if (scope === "custom") {
            try {
                await toggleWatcher(false);
            } catch {}
            return;
        }
        const shouldEnable = wantsEnabled;

        try {
            await toggleWatcher(shouldEnable);
        } catch {}
        if (!shouldEnable) return;

        try {
            await setWatcherScope({
                scope,
                customRootId: ""
            });
        } catch {}
    };

    // Initial position (no reload needed).
    try {
        _sidebarPosition = ""; // force apply
        applySidebarPosition(settings.sidebar?.position || "right");
    } catch {}

    // Live updates when ComfyUI settings change.
    const onSettingsChanged = (_e) => {
        const changedKey = String(_e?.detail?.key || "").trim();
        const isInitialSync = changedKey === "__init__";
        const shouldRefreshGrid =
            isInitialSync
            || changedKey === ""
            || changedKey.startsWith("grid.")
            || changedKey.startsWith("infiniteScroll.")
            || changedKey.startsWith("siblings.")
            || changedKey.startsWith("search.")
            || changedKey.startsWith("rtHydrate.")
            || changedKey.startsWith("workflowMinimap.");
        const shouldRefreshSidebar = isInitialSync || changedKey === "" || changedKey.startsWith("sidebar.");
        const shouldApplyWatcher = changedKey === "" || changedKey.startsWith("watcher.");
        try {
            const s = loadMajoorSettings();
            const hover = String(s?.ui?.cardHoverColor || "").trim();
            const selected = String(s?.ui?.cardSelectionColor || "").trim();
            const ratingColor = String(s?.ui?.ratingColor || "").trim();
            const tagColor = String(s?.ui?.tagColor || "").trim();
            if (/^#[0-9a-fA-F]{3,8}$/.test(hover)) {
                document.documentElement.style.setProperty("--mjr-card-hover-color", hover);
            }
            if (/^#[0-9a-fA-F]{3,8}$/.test(selected)) {
                document.documentElement.style.setProperty("--mjr-card-selection-color", selected);
            }
            if (/^#[0-9a-fA-F]{3,8}$/.test(ratingColor)) {
                document.documentElement.style.setProperty("--mjr-rating-color", ratingColor);
            }
            if (/^#[0-9a-fA-F]{3,8}$/.test(tagColor)) {
                document.documentElement.style.setProperty("--mjr-tag-color", tagColor);
            }
            
            // 1. Sidebar position
            applySidebarPosition(s.sidebar?.position || "right");
            
            // 2. Grid visuals (badges, details, sizes)
            // Refresh only when a relevant setting changed to avoid reload storms.
            if (shouldRefreshGrid) {
                refreshGrid(gridContainer);
            }
            if (shouldRefreshSidebar && state.sidebarOpen && state.activeAssetId) {
                sidebarController?.refreshActiveAsset?.();
            }
        } catch {}
        try {
            if (!shouldApplyWatcher) return;
            applyWatcherForScope(state.scope);
        } catch {}
    };
    try {
        onSettingsChanged({ detail: { key: "__init__" } });
    } catch {}
    try {
        window.addEventListener?.("mjr-settings-changed", onSettingsChanged, { signal: panelLifecycleAC?.signal });
    } catch {}
    try {
        const onEnrichmentStatus = (e) => {
            try {
                if (panelLifecycleAC?.signal?.aborted) return;
            } catch {}
            const detail = e?.detail || {};
            const active = !!detail?.active;
            // Ensure card workflow/status dots reflect final metadata once enrichment ends.
            if (!active) {
                gridController.reloadGrid().catch(() => {});
            }
        };
        window.addEventListener?.("mjr-enrichment-status", onEnrichmentStatus, { signal: panelLifecycleAC?.signal });
    } catch {}

    content.appendChild(statusSection);
    content.appendChild(searchSection);
    content.appendChild(folderBreadcrumb);
    content.appendChild(summaryBar);
    content.appendChild(browseSection);
    container.appendChild(header);
    try {
        container._mjrVersionUpdateCleanup?.();
    } catch {}
    container._mjrVersionUpdateCleanup = header._mjrVersionUpdateCleanup;
    container.appendChild(content);

    const getQuery = () => normalizeQuery(searchInputEl);
    const gridController = createGridController({
        gridContainer,
        loadAssets,
        loadAssetsFromList,
        getCollectionAssets,
        disposeGrid,
        getQuery,
        state
    });

    let scopeController = null;
    let sortController = null;
    let contextController = null;
    let _duplicatesAlert = null;
    let _dupPollTimer = null;
    let _autoLoadTimer = null;
    const folderBackStack = [];
    const folderForwardStack = [];
    const normPath = (value) => String(value || "").trim().replaceAll("\\", "/");
    const isWindowsDrive = (part) => /^[a-zA-Z]:$/.test(String(part || "").trim());
    const currentFolderPath = () => normPath(state.currentFolderRelativePath || state.subfolder || "");
    const setFolderPath = (next) => {
        const v = normPath(next);
        state.currentFolderRelativePath = v;
        state.subfolder = v;
        try {
            if (gridContainer?.dataset) gridContainer.dataset.mjrSubfolder = v;
        } catch {}
    };
    const resetToBrowserRoot = async () => {
        state.customRootId = "";
        setFolderPath("");
        folderForwardStack.length = 0;
        notifyContextChanged();
        await gridController.reloadGrid();
    };
    const navigateFolder = async (target, { pushHistory = true, clearForward = true } = {}) => {
        const prev = currentFolderPath();
        const next = normPath(target);
        if (prev === next) return;
        if (pushHistory) folderBackStack.push(prev);
        if (clearForward) folderForwardStack.length = 0;
        setFolderPath(next);
        notifyContextChanged();
        await gridController.reloadGrid();
    };
    const parentFolderPath = (pathValue) => {
        const cur = normPath(pathValue);
        if (!cur) return "";
        const parts = cur.split("/").filter(Boolean);
        if (!parts.length) return "";
        if (parts.length === 1) {
            return isWindowsDrive(parts[0]) ? `${parts[0]}/` : "";
        }
        parts.pop();
        if (parts.length === 1 && isWindowsDrive(parts[0])) return `${parts[0]}/`;
        return parts.join("/");
    };
    const renderFolderBreadcrumb = () => {
        const isCustom = String(state.scope || "") === "custom";
        const rel = String(state.currentFolderRelativePath || state.subfolder || "").trim().replaceAll("\\", "/");
        const selectedRootId = String(state.customRootId || "").trim();
        const selectedRootLabel = (() => {
            if (!selectedRootId) return "";
            try {
                const opt = customSelect?.selectedOptions?.[0] || null;
                return String(opt?.textContent || "").trim();
            } catch {
                return "";
            }
        })();
        if (!isCustom) {
            folderBackStack.length = 0;
            folderForwardStack.length = 0;
            folderBreadcrumb.style.display = "none";
            folderBreadcrumb.replaceChildren();
            return;
        }
        folderBreadcrumb.style.display = "flex";
        folderBreadcrumb.replaceChildren();

        const backBtn = document.createElement("button");
        backBtn.type = "button";
        backBtn.textContent = "Back";
        backBtn.className = "mjr-btn-link";
        const canBackToBrowserRoot = !!String(state.customRootId || "").trim() && !rel;
        backBtn.disabled = folderBackStack.length === 0 && !canBackToBrowserRoot;
        backBtn.style.cssText = "background:none;border:none;padding:0 4px 0 0;font:inherit;color:var(--mjr-accent, #7aa2ff);cursor:pointer;";
        backBtn.addEventListener("click", async () => {
            const prev = folderBackStack.pop();
            if (prev != null) {
                folderForwardStack.push(currentFolderPath());
                await navigateFolder(prev, { pushHistory: false, clearForward: false });
                return;
            }
            if (canBackToBrowserRoot) {
                await resetToBrowserRoot();
            }
        }, { signal: panelLifecycleAC?.signal });
        folderBreadcrumb.appendChild(backBtn);

        const upBtn = document.createElement("button");
        upBtn.type = "button";
        upBtn.textContent = "Up";
        upBtn.className = "mjr-btn-link";
        upBtn.disabled = !rel;
        upBtn.style.cssText = "background:none;border:none;padding:0 4px 0 0;font:inherit;color:var(--mjr-accent, #7aa2ff);cursor:pointer;";
        upBtn.addEventListener("click", async () => {
            const parent = parentFolderPath(currentFolderPath());
            await navigateFolder(parent);
        }, { signal: panelLifecycleAC?.signal });
        folderBreadcrumb.appendChild(upBtn);

        const sep0 = document.createElement("span");
        sep0.textContent = "|";
        sep0.style.opacity = "0.5";
        folderBreadcrumb.appendChild(sep0);

        const mk = (label, target, isCurrent = false) => {
            const el = document.createElement("button");
            el.type = "button";
            el.textContent = label;
            el.className = "mjr-btn-link";
            el.style.cssText = `background:none;border:none;padding:0;color:${isCurrent ? "var(--mjr-text, inherit)" : "var(--mjr-accent, #7aa2ff)"};cursor:${isCurrent ? "default" : "pointer"};font:inherit;`;
            if (!isCurrent) {
                el.addEventListener("click", async () => {
                    if (label === "Computer" && String(state.customRootId || "").trim()) {
                        await resetToBrowserRoot();
                        return;
                    }
                    await navigateFolder(target);
                }, { signal: panelLifecycleAC?.signal });
            } else {
                el.disabled = true;
            }
            return el;
        };

        folderBreadcrumb.appendChild(mk("Computer", "", !rel));
        if (selectedRootId) {
            const sepRoot = document.createElement("span");
            sepRoot.textContent = "/";
            sepRoot.style.opacity = "0.6";
            folderBreadcrumb.appendChild(sepRoot);
            // Root node: click returns to root of selected custom folder.
            folderBreadcrumb.appendChild(mk(selectedRootLabel || selectedRootId, "", !rel));
        }
        if (!rel) return;
        const parts = rel.split("/").filter(Boolean);
        let acc = "";
        for (let i = 0; i < parts.length; i++) {
            const sep = document.createElement("span");
            sep.textContent = "/";
            sep.style.opacity = "0.6";
            folderBreadcrumb.appendChild(sep);
            if (!acc) {
                acc = isWindowsDrive(parts[i]) ? `${parts[i]}/` : parts[i];
            } else {
                acc = `${acc}/${parts[i]}`.replace(/\/{2,}/g, "/");
            }
            folderBreadcrumb.appendChild(mk(parts[i], acc, i === parts.length - 1));
        }
    };

    const notifyContextChanged = () => {
        try {
            contextController?.update?.();
        } catch {}
        try {
            renderFolderBreadcrumb();
        } catch {}
    };

    const refreshDuplicateAlerts = async () => {
        const scope = String(state.scope || "output").toLowerCase();
        const customRootId = String(state.customRootId || "").trim();
        if (scope === "custom" && !customRootId) {
            _duplicatesAlert = null;
            notifyContextChanged();
            return;
        }

        try {
            const result = await getDuplicateAlerts({
                scope,
                customRootId,
                maxGroups: 4,
                maxPairs: 4
            }, { signal: panelLifecycleAC?.signal });
            if (!result?.ok) return;
            const data = result.data || {};
            _duplicatesAlert = {
                exactCount: Array.isArray(data.exact_groups) ? data.exact_groups.length : 0,
                similarCount: Array.isArray(data.similar_pairs) ? data.similar_pairs.length : 0,
                firstGroup: Array.isArray(data.exact_groups) ? data.exact_groups[0] : null,
                firstPair: Array.isArray(data.similar_pairs) ? data.similar_pairs[0] : null
            };
            notifyContextChanged();
        } catch {}
    };

    // Allow context menus to request a refresh (e.g. after "Remove from collection").
    let _reloadGridHandler = null;
    let _globalReloadGridHandler = null;
    try {
        _reloadGridHandler = () => {
            try {
                gridController.reloadGrid();
            } catch {}
        };
        gridContainer.addEventListener("mjr:reload-grid", _reloadGridHandler);
        const onCustomSubfolderChanged = async (e) => {
            const next = String(e?.detail?.subfolder || "").trim().replaceAll("\\", "/");
            const prev = currentFolderPath();
            if (next !== prev) {
                folderBackStack.push(prev);
                folderForwardStack.length = 0;
                setFolderPath(next);
                notifyContextChanged();
                try {
                    await gridController.reloadGrid();
                } catch {}
            }
        };
        gridContainer.addEventListener("mjr:custom-subfolder-changed", onCustomSubfolderChanged);
        try {
            gridContainer._mjrHasCustomSubfolderHandler = true;
        } catch {}
        const onDuplicateBadgeFocus = (e) => {
            try {
                const detail = e?.detail || {};
                const filenameKey = String(detail?.filenameKey || "").trim().toLowerCase();
                if (!filenameKey || !gridContainer) return;
                const cards = Array.from(gridContainer.querySelectorAll(".mjr-asset-card"))
                    .filter((card) => String(card?.dataset?.mjrFilenameKey || "").trim().toLowerCase() === filenameKey);
                if (!cards.length) return;
                const ids = cards
                    .map((card) => String(card?.dataset?.mjrAssetId || "").trim())
                    .filter(Boolean);
                const activeId = String(cards[0]?.dataset?.mjrAssetId || ids[0] || "").trim();
                if (ids.length && typeof gridContainer?._mjrSetSelection === "function") {
                    gridContainer._mjrSetSelection(ids, activeId);
                }
                cards[0]?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
                markUserInteraction();
                notifyContextChanged();
                const n = Number(detail?.count || ids.length || cards.length || 0);
                try {
                    comfyToast(`Name collision in view: ${n} item(s) selected`, "info", 1800);
                } catch {}
            } catch {}
        };
        gridContainer.addEventListener("mjr:badge-duplicates-focus", onDuplicateBadgeFocus);
        registerSummaryDispose(() => {
            try {
                if (_reloadGridHandler) gridContainer.removeEventListener("mjr:reload-grid", _reloadGridHandler);
            } catch {}
            try {
                gridContainer.removeEventListener("mjr:custom-subfolder-changed", onCustomSubfolderChanged);
            } catch {}
            try {
                gridContainer._mjrHasCustomSubfolderHandler = false;
            } catch {}
            try {
                gridContainer.removeEventListener("mjr:badge-duplicates-focus", onDuplicateBadgeFocus);
            } catch {}
            _reloadGridHandler = null;
        });
    } catch {}
    try {
        _globalReloadGridHandler = () => {
            try {
                if (panelLifecycleAC?.signal?.aborted) return;
            } catch {}
            try {
                if (globalThis?._mjrMaintenanceActive) return;
            } catch {}
            queuedReload().catch(() => {});
        };
        window.addEventListener("mjr:reload-grid", _globalReloadGridHandler, { signal: panelLifecycleAC?.signal });
    } catch {}

    const customRootsController = createCustomRootsController({
        state,
        customSelect,
        customRemoveBtn,
        comfyConfirm,
        comfyToast,
        get,
        post,
        ENDPOINTS,
        reloadGrid: gridController.reloadGrid,
        onRootChanged: async () => {
            try {
                folderBackStack.length = 0;
                folderForwardStack.length = 0;
            } catch {}
            try {
                await applyWatcherForScope(state.scope);
            } catch {}
            try {
                await refreshDuplicateAlerts();
            } catch {}
        }
    });
    customRootsController.bind({ customAddBtn, customRemoveBtn });
    try {
        window.addEventListener("mjr:custom-roots-changed", async (e) => {
            const preferredId = String(e?.detail?.preferredId || "").trim() || null;
            await customRootsController.refreshCustomRoots(preferredId);
        }, { signal: panelLifecycleAC?.signal });
    } catch {}

    scopeController = createScopeController({
        state,
        tabButtons,
        customMenuBtn,
        customPopover,
        popovers,
        refreshCustomRoots: customRootsController.refreshCustomRoots,
        reloadGrid: gridController.reloadGrid,
        onChanged: () => {
            state.currentFolderRelativePath = state.subfolder || "";
            notifyContextChanged();
        },
        onScopeChanged: async () => {
            try {
                await applyWatcherForScope(state.scope);
            } catch {}
            try {
                await refreshDuplicateAlerts();
            } catch {}
        },
        onBeforeReload: async () => {
            // Prevent stale cards overlap during fast scope switches.
            try {
                prepareGridForScopeSwitch(gridContainer);
            } catch {}
            // Force an immediate counters refresh for this scope instead of waiting polling tick.
            try {
                await updateStatus(
                    statusDot,
                    statusText,
                    capabilitiesSection,
                    { scope: state.scope, customRootId: state.customRootId },
                    null,
                    { signal: panelLifecycleAC?.signal || null }
                );
            } catch {}
        }
    });

    if (!header._mjrTabListenersBound) {
        Object.values(tabButtons).forEach((btn) => {
            btn.addEventListener("click", () => scopeController.setScope(btn.dataset.scope), { signal: panelLifecycleAC?.signal });
        });
        header._mjrTabListenersBound = true;
    }

    popovers.setDismissWhitelist([
        customPopover,
        filterPopover,
        sortPopover,
        collectionsPopover,
        pinnedFoldersPopover,
        customMenuBtn,
        filterBtn,
        sortBtn,
        collectionsBtn,
        pinnedFoldersBtn
    ]);

    customMenuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        popovers.close(filterPopover);
        popovers.close(sortPopover);
        popovers.toggle(customPopover, customMenuBtn);
    }, { signal: panelLifecycleAC?.signal });

    filterBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        popovers.close(customPopover);
        popovers.close(sortPopover);
        popovers.toggle(filterPopover, filterBtn);
    }, { signal: panelLifecycleAC?.signal });

    sortController = createSortController({
        state,
        sortBtn,
        sortMenu,
        sortPopover,
        popovers,
        reloadGrid: gridController.reloadGrid,
        onChanged: () => {
            notifyContextChanged();
        }
    });
    sortController.bind({
        onBeforeToggle: () => {
            popovers.close(customPopover);
            popovers.close(filterPopover);
        }
    });

    const collectionsController = createCollectionsController({
        state,
        collectionsBtn,
        collectionsMenu,
        collectionsPopover,
        popovers,
        reloadGrid: gridController.reloadGrid,
        onChanged: () => {
            notifyContextChanged();
        }
    });
    collectionsController.bind();

    const createPinnedMenuItem = (label, { right = null, danger = false } = {}) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "mjr-menu-item";
        if (danger) btn.style.color = "var(--error-text, #f44336)";
        btn.style.cssText = `
            display:flex;
            align-items:center;
            justify-content:space-between;
            width:100%;
            gap:10px;
            padding:9px 10px;
            border-radius:9px;
            border:1px solid rgba(120,190,255,0.18);
            background:linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
            transition: border-color 120ms ease, background 120ms ease;
        `;
        const left = document.createElement("span");
        left.textContent = String(label || "");
        left.style.cssText = "font-weight:600; color:var(--fg-color, #e6edf7);";
        const rightWrap = document.createElement("span");
        rightWrap.style.cssText = "display:flex; align-items:center; gap:8px;";
        if (right) {
            const hint = document.createElement("span");
            hint.textContent = String(right);
            hint.style.cssText = "opacity:0.68; font-size:11px;";
            rightWrap.appendChild(hint);
        }
        btn.appendChild(left);
        btn.appendChild(rightWrap);
        btn.addEventListener("mouseenter", () => {
            btn.style.borderColor = "rgba(145,205,255,0.4)";
            btn.style.background = "linear-gradient(135deg, rgba(80,140,255,0.18), rgba(32,100,200,0.14))";
        });
        btn.addEventListener("mouseleave", () => {
            btn.style.borderColor = "rgba(120,190,255,0.18)";
            btn.style.background = "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))";
        });
        return btn;
    };

    const renderPinnedFoldersMenu = async () => {
        try {
            pinnedFoldersMenu.replaceChildren();
        } catch {}

        let roots = [];
        try {
            const res = await get(ENDPOINTS.CUSTOM_ROOTS, panelLifecycleAC?.signal ? { signal: panelLifecycleAC.signal } : undefined);
            roots = res?.ok && Array.isArray(res.data) ? res.data : [];
        } catch {}

        if (!roots.length) {
            const empty = document.createElement("div");
            empty.className = "mjr-muted";
            empty.style.cssText = "padding:10px 12px; opacity:0.75;";
            empty.textContent = "No pinned folders";
            pinnedFoldersMenu.appendChild(empty);
            return;
        }

        for (const r of roots) {
            const id = String(r?.id || "").trim();
            if (!id) continue;
            const label = String(r?.name || r?.path || id).trim();
            const path = String(r?.path || "").trim();

            const row = document.createElement("div");
            row.style.cssText = "display:flex; align-items:stretch; width:100%;";

            const openBtn = createPinnedMenuItem(label, { right: path || null });
            openBtn.style.flex = "1";
            openBtn.addEventListener("click", async () => {
                state.scope = "custom";
                state.customRootId = id;
                state.customRootLabel = label;
                state.subfolder = "";
                state.currentFolderRelativePath = "";
                try {
                    if (customSelect) customSelect.value = id;
                } catch {}
                try {
                    scopeController?.setActiveTabStyles?.();
                } catch {}
                try {
                    await applyWatcherForScope(state.scope);
                } catch {}
                try {
                    await refreshDuplicateAlerts();
                } catch {}
                try {
                    notifyContextChanged();
                } catch {}
                popovers.close(pinnedFoldersPopover);
                await gridController.reloadGrid();
            });

            const unpinBtn = document.createElement("button");
            unpinBtn.type = "button";
            unpinBtn.className = "mjr-menu-item";
            unpinBtn.title = "Unpin folder";
            unpinBtn.style.cssText =
                "width:42px; justify-content:center; padding:0; border:1px solid rgba(255,95,95,0.35); border-radius:9px; margin-left:6px; background: linear-gradient(135deg, rgba(255,70,70,0.16), rgba(160,20,20,0.12));";
            const trash = document.createElement("i");
            trash.className = "pi pi-times";
            trash.style.cssText = "opacity:0.88; color: rgba(255,130,130,0.96);";
            unpinBtn.appendChild(trash);
            unpinBtn.addEventListener("click", async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const ok = await comfyConfirm(`Unpin folder "${label}"?`);
                if (!ok) return;
                const res = await post(ENDPOINTS.CUSTOM_ROOTS_REMOVE, { id });
                if (!res?.ok) {
                    comfyToast(res?.error || "Failed to unpin folder", "error");
                    return;
                }
                if (String(state.customRootId || "") === id) {
                    state.customRootId = "";
                    state.customRootLabel = "";
                    state.subfolder = "";
                    state.currentFolderRelativePath = "";
                }
                try {
                    await customRootsController.refreshCustomRoots();
                } catch {}
                await renderPinnedFoldersMenu();
                await gridController.reloadGrid();
            });

            row.appendChild(openBtn);
            row.appendChild(unpinBtn);
            pinnedFoldersMenu.appendChild(row);
        }
    };

    pinnedFoldersBtn?.addEventListener("click", async (e) => {
        e.stopPropagation();
        try {
            await renderPinnedFoldersMenu();
        } catch {}
        popovers.close(customPopover);
        popovers.close(filterPopover);
        popovers.close(sortPopover);
        popovers.close(collectionsPopover);
        popovers.toggle(pinnedFoldersPopover, pinnedFoldersBtn);
    }, { signal: panelLifecycleAC?.signal });

    // Calendar UI (separate module) for day indicators.
    let agendaCalendar = null;
    try {
        try {
            kindSelect.value = state.kindFilter || "";
            wfCheckbox.checked = !!state.workflowOnly;
            workflowTypeSelect.value = String(state.workflowType || "").trim().toUpperCase();
            ratingSelect.value = String(Number(state.minRating || 0) || 0);
            minSizeInput.value = Number(state.minSizeMB || 0) > 0 ? String(state.minSizeMB) : "";
            maxSizeInput.value = Number(state.maxSizeMB || 0) > 0 ? String(state.maxSizeMB) : "";
            minWidthInput.value = Number(state.minWidth || 0) > 0 ? String(state.minWidth) : "";
            minHeightInput.value = Number(state.minHeight || 0) > 0 ? String(state.minHeight) : "";
            const w = Number(state.minWidth || 0) || 0;
            const h = Number(state.minHeight || 0) || 0;
            if (w >= 3840 && h >= 2160) resolutionPresetSelect.value = "uhd";
            else if (w >= 2560 && h >= 1440) resolutionPresetSelect.value = "qhd";
            else if (w >= 1920 && h >= 1080) resolutionPresetSelect.value = "fhd";
            else if (w >= 1280 && h >= 720) resolutionPresetSelect.value = "hd";
            else resolutionPresetSelect.value = "";
            dateRangeSelect.value = state.dateRangeFilter || "";
        } catch {}
        agendaCalendar = createAgendaCalendar({
            container: agendaContainer,
            hiddenInput: dateExactInput,
            state,
            onRequestReloadGrid: () => gridController.reloadGrid()
        });
    } catch {}

    bindFilters({
        state,
        kindSelect,
        wfCheckbox,
        workflowTypeSelect,
        ratingSelect,
        minSizeInput,
        maxSizeInput,
        resolutionPresetSelect,
        minWidthInput,
        minHeightInput,
        dateRangeSelect,
        dateExactInput,
        reloadGrid: gridController.reloadGrid,
        onFiltersChanged: () => {
            try {
                agendaCalendar?.refresh?.();
            } catch {}
            notifyContextChanged();
        }
    });

    // Context controller: pills + button highlighting.
    try {
        contextController = createContextController({
            state,
            gridContainer,
            filterBtn,
            sortBtn,
            collectionsBtn,
            searchInputEl,
            kindSelect,
            wfCheckbox,
            workflowTypeSelect,
            ratingSelect,
            minSizeInput,
            maxSizeInput,
            minWidthInput,
            minHeightInput,
            resolutionPresetSelect,
            dateRangeSelect,
            dateExactInput,
            scopeController,
            sortController,
            updateSummaryBar,
            reloadGrid: () => gridController.reloadGrid(),
            getExtraContext: () => ({ duplicatesAlert: _duplicatesAlert }),
            extraActions: {
                resetBrowserHistory: () => {
                    try {
                        folderBackStack.length = 0;
                        folderForwardStack.length = 0;
                    } catch {}
                },
                onDuplicateAlertClick: async (alert) => {
                    const current = alert || _duplicatesAlert || {};
                    const grp = current.firstGroup;
                    if (grp && Array.isArray(grp.assets) && grp.assets.length >= 2) {
                        const keep = grp.assets[0] || {};
                        const dupIds = grp.assets.slice(1).map((x) => Number(x?.id || 0)).filter((x) => x > 0);
                        if (dupIds.length) {
                            const mergeOk = await comfyConfirm(`Exact duplicates detected (${grp.assets.length}). Merge tags into "${keep?.filename || keep?.id}"?`);
                            if (mergeOk) {
                                const mergeRes = await mergeDuplicateTags(Number(keep?.id || 0), dupIds);
                                if (mergeRes?.ok) comfyToast("Tags merged", "success", 2200);
                                else comfyToast(`Tag merge failed: ${mergeRes?.error || "error"}`, "warning", 3500);
                            }
                            const delOk = await comfyConfirm(`Delete ${dupIds.length} exact duplicate(s)?`);
                            if (delOk) {
                                const delRes = await deleteAssets(dupIds);
                                if (delRes?.ok) {
                                    comfyToast("Duplicates deleted", "success", 2200);
                                    await gridController.reloadGrid();
                                } else {
                                    comfyToast(`Delete failed: ${delRes?.error || "error"}`, "warning", 3500);
                                }
                            }
                            await refreshDuplicateAlerts();
                            return;
                        }
                    }
                    const startOk = await comfyConfirm("Start duplicate analysis in background?");
                    if (!startOk) return;
                    const runRes = await startDuplicatesAnalysis(500);
                    if (runRes?.ok) comfyToast("Duplicate analysis started", "info", 2200);
                    else comfyToast(`Analysis not started: ${runRes?.error || "error"}`, "warning", 3500);
                    await refreshDuplicateAlerts();
                }
            }
        });
    } catch {}

    // Summary bar updates: selection changes, load changes, scope/collection changes.
    try {
        notifyContextChanged();
        const onStats = () => notifyContextChanged();
        const onSelectionChanged = (e) => {
            markUserInteraction();
            try {
                const detail = e?.detail || {};
                const ids = Array.isArray(detail.selectedIds) ? detail.selectedIds.map(String).filter(Boolean) : [];
                state.selectedAssetIds = ids;
                state.activeAssetId = String(detail.activeId || ids[0] || "");
            } catch {}
            notifyContextChanged();
        };
        gridContainer.addEventListener("mjr:grid-stats", onStats);
        gridContainer.addEventListener("mjr:selection-changed", onSelectionChanged);
        document.addEventListener?.("mjr-settings-changed", onStats);

        // Observe DOM changes for card count / selection class changes.
        let raf = null;
        const schedule = () => {
            if (raf) cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                raf = null;
                notifyContextChanged();
            });
        };
        const mo = new MutationObserver(() => schedule());
        mo.observe(gridContainer, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
        gridContainer._mjrSummaryBarObserver = mo;
        registerSummaryDispose(() => {
            try {
                gridContainer.removeEventListener("mjr:grid-stats", onStats);
            } catch {}
            try {
                gridContainer.removeEventListener("mjr:selection-changed", onSelectionChanged);
            } catch {}
            try {
                document.removeEventListener?.("mjr-settings-changed", onStats);
            } catch {}
            try {
                mo.disconnect();
            } catch {}
        });
    } catch {}

    sidebarController = bindSidebarOpen({
        gridContainer,
        sidebar,
        createRatingBadge,
        createTagsBadge,
        showAssetInSidebar,
        closeSidebar,
        state
    });

    const hotkeys = createPanelHotkeysController({
        onTriggerScan: (ctx) => {
            triggerScan(statusDot, statusText, capabilitiesSection, ctx || {});
        },
        onToggleDetails: () => {
            sidebarController?.toggleDetails?.();
        },
        onFocusSearch: () => {
            try {
                searchInputEl?.focus?.();
                // Move cursor to end for immediate typing.
                const len = searchInputEl?.value?.length || 0;
                searchInputEl?.setSelectionRange?.(len, len);
            } catch {}
        },
        onClearSearch: () => {
            try {
                if (!searchInputEl) return;
                searchInputEl.value = "";
                searchInputEl.dispatchEvent?.(new Event("input", { bubbles: true }));
            } catch {}
        },
        getScanContext: () => ({
            scope: state.scope,
            customRootId: state.customRootId
        })
    });

    const ratingHotkeys = createRatingHotkeysController({
        gridContainer,
        createRatingBadge
    });

    let searchTimeout = null;
    let lastSearchValue = "";

    if (container._eventCleanup) {
        try {
            container._eventCleanup();
        } catch {}
    }

    hotkeys.bind(content);
    ratingHotkeys.bind();
    try {
        window._mjrHotkeysState = window._mjrHotkeysState || {};
        window._mjrHotkeysState.scope = "grid";
    } catch {}
    
    // Attach controllers to container for cleanup on re-render
    try {
        container._mjrHotkeys = hotkeys;
        container._mjrRatingHotkeys = ratingHotkeys;
        container._mjrSidebarController = sidebarController;
    } catch {}

    container._eventCleanup = () => {
        try {
            panelLifecycleAC?.abort?.();
        } catch {}
        try {
            statusSection?._mjrStatusPollDispose?.();
        } catch {}
        try {
            container._mjrVersionUpdateCleanup?.();
        } catch {}
        container._mjrVersionUpdateCleanup = null;
        try {
            if (_scrollTimer) clearTimeout(_scrollTimer);
            _scrollTimer = null;
        } catch {}
        try {
            hotkeys.dispose();
        } catch {}
        try {
            ratingHotkeys.dispose();
        } catch {}
        try {
            if (window._mjrHotkeysState?.scope === "grid") {
                window._mjrHotkeysState.scope = null;
            }
        } catch {}
        try {
            agendaCalendar?.dispose?.();
        } catch {}
        try {
            if (searchTimeout) clearTimeout(searchTimeout);
            searchTimeout = null;
        } catch {}
        try {
            sidebar?.dispose?.();
        } catch {}
        try {
            sidebarController?.dispose?.();
        } catch {}
        try {
            if (_dupPollTimer) clearInterval(_dupPollTimer);
            _dupPollTimer = null;
        } catch {}
        try {
            if (_autoLoadTimer) clearTimeout(_autoLoadTimer);
            _autoLoadTimer = null;
        } catch {}
        try {
            gridContainer?._mjrSummaryBarDispose?.();
        } catch {}
        try {
            gridContainer?._mjrGridContextMenuUnbind?.();
        } catch {}
        try {
            disposeGridScanListeners();
        } catch {}
        try {
            if (gridContainer) disposeGrid(gridContainer);
        } catch {}
        if (_activeGridContainer === gridContainer) {
            _activeGridContainer = null;
        }
        gridContainer = null;
        try {
            popovers.dispose();
        } catch {}
        try {
            if (container._mjrPopoverManager === popovers) {
                container._mjrPopoverManager = null;
            }
        } catch {}
    };

    let lastKnownScan = null;
    let lastKnownTotalAssets = null;
    let hasSeenFirstCounters = false;
    let pendingReloadCount = 0;
    let isReloading = false;
    let _lastAutoReloadAt = 0;

    const queuedReload = async () => {
        if (!gridContainer) return;
        pendingReloadCount++;
        if (isReloading) return;

        isReloading = true;
        try {
            while (pendingReloadCount > 0) {
                pendingReloadCount = 0;
                const anchor = captureAnchor(gridContainer);
                await gridController.reloadGrid();
                try {
                    await restoreAnchor(gridContainer, anchor);
                } catch {}
            }
        } finally {
            isReloading = false;
        }
    };

    const handleCountersUpdate = async (counters) => {
        if (!hasSeenFirstCounters) {
            hasSeenFirstCounters = true;
            lastKnownScan = counters.last_scan_end;
            lastKnownTotalAssets = Number(counters.total_assets ?? null);
            return;
        }

        const hasNewScan = counters.last_scan_end && counters.last_scan_end !== lastKnownScan;
        const totalAssets = Number(counters.total_assets ?? null);

        // Fallback for "new files appeared" without a full scan end update (e.g. incremental indexing).
        // Only auto-refresh when browsing output with default filters to avoid disrupting searches.
        const isDefaultBrowse =
            state.scope === "output" &&
            !state.collectionId &&
            String(getQuery?.() ?? "*").trim() === "*" &&
            !state.kindFilter &&
            !state.workflowOnly &&
            !(Number(state.minRating || 0) > 0) &&
            !(Number(state.minSizeMB || 0) > 0) &&
            !(Number(state.maxSizeMB || 0) > 0) &&
            !(Number(state.minWidth || 0) > 0) &&
            !(Number(state.minHeight || 0) > 0) &&
            !String(state.workflowType || "").trim() &&
            !state.dateRangeFilter &&
            !state.dateExactFilter;

        const totalDelta =
            Number.isFinite(totalAssets) && Number.isFinite(lastKnownTotalAssets)
                ? totalAssets - lastKnownTotalAssets
                : 0;
        const hasNewTotal = totalDelta >= 3;

        // Keep baseline current even if we skip auto-reload; avoids repeated trigger loops.
        if (Number.isFinite(totalAssets)) {
            lastKnownTotalAssets = totalAssets;
        }

        if (!hasNewScan && !(isDefaultBrowse && hasNewTotal)) return;

        // Global throttle against reload storms from frequent watcher/enrichment updates.
        try {
            const now = Date.now();
            if (now - Number(_lastAutoReloadAt || 0) < 8000) return;
        } catch {}

        // Avoid disruptive auto-reload while user is actively interacting.
        try {
            const recentInteraction = (Date.now() - Number(_lastUserInteractionAt || 0)) < 1500;
            if (recentInteraction) return;
        } catch {}

        lastKnownScan = counters.last_scan_end;
        await queuedReload();
        try {
            _lastAutoReloadAt = Date.now();
        } catch {
            _lastAutoReloadAt = 0;
        }
    };

    setupStatusPolling(
        statusDot,
        statusText,
        statusSection,
        capabilitiesSection,
        handleCountersUpdate,
        () => ({ scope: state.scope, customRootId: state.customRootId })
    );

    scopeController.setActiveTabStyles();
    renderFolderBreadcrumb();
    
    // Initial loading of custom roots (restores selection from state if applicable)
    customRootsController.refreshCustomRoots().catch(() => {});

    searchInputEl.addEventListener("input", (e) => {
        const value = e?.target?.value ?? "";
        if (value === lastSearchValue) return;
        lastSearchValue = value;
        notifyContextChanged();

        if (searchTimeout) clearTimeout(searchTimeout);

        // Immediate search for empty / browse-all queries.
        if (value.length === 0 || value === "*") {
            gridController.reloadGrid();
            return;
        }

        // Debounce for normal searches.
        searchTimeout = setTimeout(() => {
            searchTimeout = null;
            gridController.reloadGrid();
        }, 200);
    }, { signal: panelLifecycleAC?.signal });
    searchInputEl.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            gridController.reloadGrid();
            notifyContextChanged();
        }
    }, { signal: panelLifecycleAC?.signal });

    const initialLoadPromise = gridController.reloadGrid();
    try {
        await refreshDuplicateAlerts();
    } catch {}
    try {
        _dupPollTimer = setInterval(() => {
            try {
                if (panelLifecycleAC?.signal?.aborted) return;
            } catch {}
            refreshDuplicateAlerts().catch(() => {});
        }, 15000);
    } catch {}
    
    // Restore scroll, selection visuals, and sidebar AFTER grid loads.
    const restoreUIState = async () => {
        try {
            await initialLoadPromise;
        } catch {}

        // Wait one frame for DOM to settle before restoring.
        requestAnimationFrame(() => {
            // 1. Restore scroll position
            if (state.scrollTop > 0) {
                try {
                    gridWrapper.scrollTop = state.scrollTop;
                } catch {}
            }

            // 2. Restore selection visuals on cards
            if (state.selectedAssetIds?.length || state.activeAssetId) {
                try {
                    const selected = (state.selectedAssetIds || []).map(String);
                    const activeId = String(state.activeAssetId || selected[0] || "");

                    selected.forEach(id => {
                        const card = gridContainer.querySelector(`.mjr-asset-card[data-mjr-asset-id="${CSS?.escape ? CSS.escape(id) : id}"]`);
                        if (card) {
                            card.classList.add("is-selected");
                            card.setAttribute?.("aria-selected", "true");
                        }
                    });

                    if (activeId) {
                        const activeCard = gridContainer.querySelector(`.mjr-asset-card[data-mjr-asset-id="${CSS?.escape ? CSS.escape(activeId) : activeId}"]`);
                        if (activeCard) {
                            activeCard.classList.add("is-active");
                            activeCard.setAttribute?.("aria-selected", "true");
                            // Scroll selection into view if not visible after scroll restore
                            if (state.scrollTop === 0) {
                                activeCard.scrollIntoView?.({ block: "nearest", behavior: "instant" });
                            }
                        }
                    }
                } catch {}
            }

            // 3. Restore sidebar if it was open
            if (state.sidebarOpen && state.activeAssetId) {
                try {
                    sidebarController?.toggleDetails?.();
                } catch {}
            }
        });
    };
    restoreUIState();

    const checkAndAutoLoad = async () => {
        try {
            await initialLoadPromise;
        } catch {}

        const hasCards = gridContainer.querySelector(".mjr-card") != null;
        if (hasCards) return;
        if (state.scope !== "output") return;
        if (getQuery() !== "*") return;

        try {
            const statusData = await get(`${ENDPOINTS.HEALTH_COUNTERS}?scope=output`, { signal: panelLifecycleAC?.signal });
            if (statusData?.ok && (statusData.data?.total_assets || 0) > 0) {
                await loadAssets(gridContainer);
            }
        } catch {}
    };
    _autoLoadTimer = setTimeout(checkAndAutoLoad, 2000);

    return { gridContainer };
}
