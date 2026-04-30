import { comfyConfirm, comfyPrompt } from "../../app/dialogs.js";
import { comfyToast } from "../../app/toast.js";
import { EVENTS } from "../../app/events.js";
import { t } from "../../app/i18n.js";
import { startTimer, endTimer, trackGridRender, mark } from "../../app/metrics.js";
import { setupStatusPolling, triggerScan, updateStatus } from "../status/StatusDot.js";
import {
    hydrateGridFromSnapshot,
    loadAssets,
    loadAssetsFromList,
    prepareGridForScopeSwitch,
    disposeGrid,
    refreshGrid,
    captureAnchor,
    restoreAnchor,
    bindGridScanListeners,
    disposeGridScanListeners,
} from "../grid/gridApi.js";
import { get, post, getCollectionAssets, getDuplicateAlerts } from "../../api/client.js";
import { ENDPOINTS } from "../../api/endpoints.js";
import { showAssetInSidebar, closeSidebar } from "../../components/sidebar/SidebarView.js";
import { createRatingBadge, createTagsBadge } from "../../components/Badges.js";
import { loadMajoorSettings } from "../../app/settings.js";
import { createPopoverManager } from "./views/popoverManager.js";

import { createPanelStateBridge } from "../../stores/panelStateBridge.js";
import { getOptionalPanelStore } from "../../stores/getOptionalPanelStore.js";
import { bindMessagePopoverController } from "./messages/messagePopoverController.js";

import { normalizeQuery } from "./controllers/query.js";
import { createGridController } from "./controllers/gridController.js";
import { createBrowserNavigationController } from "./controllers/browserNavigationController.js";
import { createScopeController } from "./controllers/scopeController.js";
import { createContextController } from "./controllers/contextController.js";
import { createCustomRootsController } from "./controllers/customRootsController.js";
import { createSortController } from "./controllers/sortController.js";
import { bindSidebarOpen } from "./controllers/sidebarController.js";
import { createPanelHotkeysController } from "./controllers/panelHotkeysController.js";
import { createRatingHotkeysController } from "./controllers/ratingHotkeysController.js";
import { getHotkeysState, setHotkeysScope } from "./controllers/hotkeysState.js";
import { bindGridContextMenu } from "../contextmenu/GridContextMenu.js";
import { bindGridSelectionState } from "../../vue/composables/useGridSelection.js";
import { createAssetsQueryController } from "../../vue/composables/useAssetsQuery.js";
import { clearActiveGridContainer, setActiveGridContainer } from "./panelRuntimeRefs.js";

import { bootstrapPanelContainer } from "./panelBootstrap.js";
import { createSettingsSync } from "./panelSettingsSync.js";
import { bindGridEvents } from "./panelGridEventBindings.js";
import { bindSimilarSearch } from "./panelSimilarSearch.js";
import { bindPinnedFolders } from "./panelPinnedFolders.js";
import { setupFiltersInit } from "./panelFiltersInit.js";
import { buildContextMenuExtraActions } from "./panelContextMenuExtraActions.js";

/**
 * Wires controller/service orchestration against Vue-owned panel surfaces.
 *
 * `external` allows Vue components to provide pre-created DOM elements.
 * Required external keys: statusSection, statusDot, statusText,
 * capabilitiesSection, headerSection, summaryBar, updateSummaryBar,
 * folderBreadcrumb, browseSection, gridWrapper, gridContainer, sidebar.
 */
export async function mountAssetsManagerPanelRuntime(
    container,
    { useComfyThemeUI = true, external = {} } = {},
) {
    return _mountPanelRuntimeImpl(container, { useComfyThemeUI, external });
}

async function _mountPanelRuntimeImpl(container, { useComfyThemeUI = true, external = {} } = {}) {
    startTimer("panelRender");
    mark("panelRender");

    const panelLifecycleAC = typeof AbortController !== "undefined" ? new AbortController() : null;

    // ── 1. BOOTSTRAP ──────────────────────────────────────────────────────
    const { popovers, hostWrapper, hostWrapperPrevStyle } = bootstrapPanelContainer(container, {
        useComfyThemeUI,
    });

    // ── 2. VALIDATE STATE + EXTERNAL ELEMENTS ─────────────────────────────
    const state = getOptionalPanelStore();
    if (!state) {
        throw new Error(
            "[Majoor] mountAssetsManagerPanelRuntime requires an active Pinia panel store",
        );
    }
    for (const key of [
        "statusSection",
        "statusDot",
        "statusText",
        "capabilitiesSection",
        "headerSection",
        "summaryBar",
        "updateSummaryBar",
        "folderBreadcrumb",
        "browseSection",
        "gridWrapper",
        "gridContainer",
        "sidebar",
    ]) {
        if (!external?.[key]) {
            throw new Error(`[Majoor] mountAssetsManagerPanelRuntime now requires external.${key}`);
        }
    }

    // ── 3. STATE BRIDGE + READ/WRITE HELPERS ──────────────────────────────
    const panelStateBridge = createPanelStateBridge(null, [
        "searchQuery",
        "scrollTop",
        "scope",
        "customRootId",
        "customRootLabel",
        "currentFolderRelativePath",
        "sort",
        "lastGridCount",
        "lastGridTotal",
        "activeAssetId",
        "selectedAssetIds",
        "sidebarOpen",
        "collectionId",
        "collectionName",
        "viewScope",
        "similarResults",
        "similarTitle",
        "similarSourceAssetId",
    ]);
    state.viewScope =
        String(state.viewScope || "")
            .trim()
            .toLowerCase() === "similar"
            ? "similar"
            : "";
    state.similarResults = Array.isArray(state.similarResults) ? state.similarResults : [];
    state.similarTitle = String(state.similarTitle || "");
    state.similarSourceAssetId = String(state.similarSourceAssetId || "");

    const readPanelValue = (key, fallback = "") =>
        panelStateBridge.read(key, state?.[key] ?? fallback);
    const writePanelValue = (key, value) => panelStateBridge.write(key, value);
    const readSelectedAssetIds = () => {
        const selected = readPanelValue("selectedAssetIds", []);
        return Array.isArray(selected) ? selected.map(String).filter(Boolean) : [];
    };
    const readActiveAssetId = () => String(readPanelValue("activeAssetId", "") || "").trim();
    const isSidebarOpen = () => !!readPanelValue("sidebarOpen", false);

    // ── 4. DESTRUCTURE EXTERNAL ELEMENTS ──────────────────────────────────
    const {
        header,
        tabButtons,
        customMenuBtn,
        filterBtn,
        sortBtn,
        collectionsBtn,
        pinnedFoldersBtn,
        messageBtn,
        customPopover,
        customSelect,
        customAddBtn,
        customRemoveBtn,
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
        maxWidthInput,
        maxHeightInput,
        dateRangeSelect,
        dateExactInput,
        agendaContainer,
        sortPopover,
        sortMenu,
        collectionsPopover,
        pinnedFoldersPopover,
        pinnedFoldersMenu,
        messagePopoverTitle,
        messagePopover,
        messageTabBtn,
        messageTabBadge,
        historyTabBtn,
        historyTabBadge,
        historyTabCount,
        historyPanel,
        shortcutsTabBtn,
        messageList,
        shortcutsPanel,
        markReadBtn,
        searchSection,
        searchInputEl,
        similarBtn,
        setSemanticEnabled,
        _headerDispose,
    } = external.headerSection;
    const hasVueHeaderSection = !!external?.headerSection?.isVueHeader;

    // Restore persistent search query.
    if (panelStateBridge.read("searchQuery", "")) {
        searchInputEl.value = panelStateBridge.read("searchQuery", "");
    }
    searchInputEl.addEventListener(
        "input",
        (e) => {
            panelStateBridge.write("searchQuery", e.target.value);
        },
        { signal: panelLifecycleAC?.signal },
    );

    const summaryBar = external.summaryBar;
    const updateSummaryBar = external.updateSummaryBar;
    const folderBreadcrumb = external.folderBreadcrumb;
    const statusSection = external.statusSection;
    const statusDot = external.statusDot;
    const statusText = external.statusText;
    const capabilitiesSection = external.capabilitiesSection;
    const browseSection = external.browseSection;
    const gridWrapper = external.gridWrapper;
    const sidebar = external.sidebar;
    const settings = loadMajoorSettings();

    const content = document.createElement("div");
    content.classList.add("mjr-am-content");
    let gridContainer = null;
    let sidebarController = null;

    container.tabIndex = -1;

    // ── 5. SCROLL PERSISTENCE + GRID CONTAINER SETUP ──────────────────────
    let _scrollTimer = null;
    let _lastUserInteractionAt = 0;
    const markUserInteraction = () => {
        try {
            _lastUserInteractionAt = Date.now();
        } catch {
            _lastUserInteractionAt = 0;
        }
    };
    const hasVueGridHostState =
        typeof external?.bindGridHostState === "function" &&
        typeof external?.restoreGridUiState === "function";
    const shouldPersistScrollFromPanel = !hasVueGridHostState;
    gridWrapper.addEventListener(
        "scroll",
        () => {
            markUserInteraction();
            if (!shouldPersistScrollFromPanel) return;
            if (_scrollTimer) clearTimeout(_scrollTimer);
            _scrollTimer = setTimeout(() => {
                try {
                    panelStateBridge.write("scrollTop", gridWrapper.scrollTop);
                } catch (e) {
                    console.debug?.(e);
                }
            }, 100);
        },
        { passive: true, signal: panelLifecycleAC?.signal },
    );

    gridContainer = external.gridContainer;
    if (gridContainer.parentElement !== gridWrapper) {
        gridWrapper.appendChild(gridContainer);
    }
    setActiveGridContainer(gridContainer);
    try {
        gridContainer.dataset.mjrScope = String(
            readPanelValue("scope", state.scope || "output") || "output",
        );
    } catch (e) {
        console.debug?.(e);
    }

    const summaryBarDisposers = [];
    const registerSummaryDispose = (fn) => {
        if (typeof fn === "function") summaryBarDisposers.push(fn);
    };
    gridContainer._mjrSummaryBarDispose = () => {
        for (const fn of summaryBarDisposers.splice(0)) {
            try {
                fn();
            } catch (e) {
                console.debug?.(e);
            }
        }
    };
    try {
        const handler = () => {
            try {
                updateSummaryBar?.({ state, gridContainer });
            } catch (e) {
                console.debug?.(e);
            }
        };
        gridContainer.addEventListener("mjr:grid-stats", handler, {
            signal: panelLifecycleAC?.signal,
        });
        registerSummaryDispose(() => {
            try {
                gridContainer.removeEventListener("mjr:grid-stats", handler);
            } catch (e) {
                console.debug?.(e);
            }
        });
    } catch (e) {
        console.debug?.(e);
    }
    try {
        bindGridScanListeners();
    } catch (e) {
        console.debug?.(e);
    }

    // ── 6. GRID API FUNCTION RESOLUTION ───────────────────────────────────
    const loadAssetsFn = external.loadAssets ?? loadAssets;
    const loadAssetsFromListFn = external.loadAssetsFromList ?? loadAssetsFromList;
    const prepareGridForScopeSwitchFn =
        external.prepareGridForScopeSwitch ?? prepareGridForScopeSwitch;
    const disposeGridFn = external.disposeGrid ?? disposeGrid;
    const refreshGridFn = external.refreshGrid ?? refreshGrid;
    const captureAnchorFn = external.captureAnchor ?? captureAnchor;
    const restoreAnchorFn = external.restoreAnchor ?? restoreAnchor;
    const hydrateGridFromSnapshotFn = external.hydrateGridFromSnapshot ?? hydrateGridFromSnapshot;

    // ── 7. GRID CONTEXT MENU ──────────────────────────────────────────────
    if (typeof external?.onGridContainerReady === "function") {
        try {
            external.onGridContainerReady(gridContainer, { getState: () => state });
        } catch (e) {
            console.debug?.(e);
        }
    } else {
        container._mjrGridContextMenuUnbind = bindGridContextMenu({
            gridContainer,
            getState: () => state,
        });
    }

    // ── 8. SETTINGS SYNC ──────────────────────────────────────────────────
    const similarEnabledTitle = t("search.findSimilar", "Find Similar");
    const similarDisabledTitle = t(
        "search.similarDisabled",
        "AI features are disabled in settings",
    );
    const { applyWatcherForScope, isAiEnabled } = createSettingsSync({
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
        getSidebarController: () => sidebarController,
        panelLifecycleAC,
    });

    // ── 9. DOM ASSEMBLY ───────────────────────────────────────────────────
    content.appendChild(statusSection);
    content.appendChild(searchSection);
    content.appendChild(folderBreadcrumb);
    content.appendChild(summaryBar);
    content.appendChild(browseSection);
    container.appendChild(header);
    try {
        container._mjrVersionUpdateCleanup?.();
    } catch (e) {
        console.debug?.(e);
    }
    container._mjrVersionUpdateCleanup = _headerDispose || header._mjrVersionUpdateCleanup;
    container.appendChild(content);

    // ── 10. GRID CONTROLLER ───────────────────────────────────────────────
    const getQuery = () => normalizeQuery(searchInputEl);
    const gridController = createGridController({
        gridContainer,
        loadAssets: loadAssetsFn,
        loadAssetsFromList: loadAssetsFromListFn,
        getCollectionAssets,
        disposeGrid: disposeGridFn,
        getQuery,
        searchInputEl,
        state,
    });

    // ── 11. SHARED CONTROLLER VARIABLES ──────────────────────────────────
    let scopeController = null;
    let contextController = null;
    let _duplicatesAlert = null;
    let _dupPollTimer = null;
    let _autoLoadTimer = null;
    let browserNav = null;
    let _unbindBrowserFolderNav = null;
    let selectionState = null;
    let assetsQueryController = null;

    const notifyContextChanged = () => {
        try {
            contextController?.update?.();
        } catch (e) {
            console.debug?.(e);
        }
        try {
            browserNav?.renderBreadcrumb?.();
        } catch (e) {
            console.debug?.(e);
        }
    };

    // ── 12. SELECTION STATE + BROWSER NAV ────────────────────────────────
    if (!hasVueGridHostState) {
        selectionState = bindGridSelectionState({
            gridContainer,
            readSelectedAssetIds,
            readActiveAssetId,
            writeSelectedAssetIds: (ids) => writePanelValue("selectedAssetIds", ids),
            writeActiveAssetId: (id) => writePanelValue("activeAssetId", id),
            onSelectionChanged: () => {
                markUserInteraction();
                notifyContextChanged();
            },
            lifecycleSignal: panelLifecycleAC?.signal || null,
        });
    }
    browserNav = createBrowserNavigationController({
        state,
        gridContainer,
        folderBreadcrumb,
        customSelect,
        reloadGrid: () => gridController.reloadGrid(),
        onContextChanged: () => {
            try {
                contextController?.update?.();
            } catch (e) {
                console.debug?.(e);
            }
        },
        lifecycleSignal: panelLifecycleAC?.signal || null,
    });
    try {
        _unbindBrowserFolderNav = browserNav.bindGridFolderNavigation();
    } catch (e) {
        console.debug?.(e);
    }

    // ── 13. DUPLICATE ALERTS ─────────────────────────────────────────────
    const refreshDuplicateAlerts = async () => {
        const scope = String(
            readPanelValue("scope", state.scope || "output") || "output",
        ).toLowerCase();
        const customRootId = String(
            readPanelValue("customRootId", state.customRootId || "") || "",
        ).trim();
        if (scope === "custom" && !customRootId) {
            _duplicatesAlert = null;
            notifyContextChanged();
            return;
        }
        try {
            const result = await getDuplicateAlerts(
                { scope, customRootId, maxGroups: 4, maxPairs: 4 },
                { signal: panelLifecycleAC?.signal },
            );
            if (!result?.ok) return;
            const data = result.data || {};
            _duplicatesAlert = {
                exactCount: Array.isArray(data.exact_groups) ? data.exact_groups.length : 0,
                similarCount: Array.isArray(data.similar_pairs) ? data.similar_pairs.length : 0,
                firstGroup: Array.isArray(data.exact_groups) ? data.exact_groups[0] : null,
                firstPair: Array.isArray(data.similar_pairs) ? data.similar_pairs[0] : null,
            };
            notifyContextChanged();
        } catch (e) {
            console.debug?.(e);
        }
    };

    // ── 14. QUEUED RELOAD ─────────────────────────────────────────────────
    const REQUEST_QUEUED_RELOAD_DEBOUNCE_MS = 120;
    let _queuedReloadTimer = null;
    const requestQueuedReload = () => {
        try {
            if (_queuedReloadTimer) clearTimeout(_queuedReloadTimer);
        } catch (e) {
            console.debug?.(e);
        }
        _queuedReloadTimer = setTimeout(() => {
            _queuedReloadTimer = null;
            queuedReload().catch((err) => {
                try {
                    console.warn("[Majoor] queuedReload failed", err);
                } catch (e) {
                    console.debug?.(e);
                }
            });
        }, REQUEST_QUEUED_RELOAD_DEBOUNCE_MS);
    };

    // ── 15. GRID EVENT BINDINGS ───────────────────────────────────────────
    bindGridEvents({
        gridContainer,
        panelLifecycleAC,
        requestQueuedReload,
        notifyContextChanged,
        markUserInteraction,
        writePanelValue,
        popovers,
        collectionsPopover,
        gridController,
        registerSummaryDispose,
    });

    // ── 16. CUSTOM ROOTS CONTROLLER ───────────────────────────────────────
    const customRootsController = createCustomRootsController({
        state,
        customSelect,
        customRemoveBtn,
        comfyConfirm,
        comfyPrompt,
        comfyToast,
        get,
        post,
        ENDPOINTS,
        reloadGrid: gridController.reloadGrid,
        onRootChanged: async () => {
            try {
                browserNav?.resetHistory?.();
            } catch (e) {
                console.debug?.(e);
            }
            try {
                await applyWatcherForScope(state.scope);
            } catch (e) {
                console.debug?.(e);
            }
            try {
                await refreshDuplicateAlerts();
            } catch (e) {
                console.debug?.(e);
            }
        },
    });
    const disposeCustomRootsBindings = customRootsController.bind({
        customAddBtn,
        customRemoveBtn,
    });
    try {
        window.addEventListener(
            "mjr:custom-roots-changed",
            async (e) => {
                const preferredId = String(e?.detail?.preferredId || "").trim() || null;
                await customRootsController.refreshCustomRoots(preferredId);
            },
            { signal: panelLifecycleAC?.signal },
        );
    } catch (e) {
        console.debug?.(e);
    }

    // ── 17. RECONCILE VISIBLE SELECTION ──────────────────────────────────
    const reconcileVisibleSelection = () => {
        try {
            const getAssets = gridContainer?._mjrGetAssets;
            const setSelection = gridContainer?._mjrSetSelection;
            if (typeof getAssets !== "function" || typeof setSelection !== "function") return;
            const visibleIds = (Array.isArray(getAssets()) ? getAssets() : [])
                .map((asset) => String(asset?.id ?? "").trim())
                .filter(Boolean);
            const selectedIds = readSelectedAssetIds();
            const next = selectedIds.filter((id) => visibleIds.includes(id));
            const pruned = selectedIds.length - next.length;
            if (pruned <= 0) return;
            const currentActiveId = readActiveAssetId();
            const nextActiveId = next.includes(currentActiveId) ? currentActiveId : next[0] || "";
            setSelection(next, nextActiveId);
            comfyToast(
                t(
                    "toast.selectionPruned",
                    "{count} items deselected - not visible in current view",
                    { count: pruned },
                ),
                "info",
                2600,
                { noHistory: true },
            );
        } catch (e) {
            console.debug?.(e);
        }
    };

    // ── 18. SCOPE CONTROLLER ─────────────────────────────────────────────
    scopeController = createScopeController({
        state,
        tabButtons,
        customMenuBtn,
        customPopover,
        popovers,
        refreshCustomRoots: customRootsController.refreshCustomRoots,
        reloadGrid: gridController.reloadGrid,
        reconcileSelection: reconcileVisibleSelection,
        onChanged: () => {
            try {
                if (gridContainer) {
                    gridContainer.dataset.mjrScope = String(
                        readPanelValue("scope", state.scope || "output") || "output",
                    );
                }
            } catch (e) {
                console.debug?.(e);
            }
            notifyContextChanged();
        },
        onScopeChanged: async () => {
            try {
                await applyWatcherForScope(
                    String(readPanelValue("scope", state.scope || "output") || "output"),
                );
            } catch (e) {
                console.debug?.(e);
            }
            try {
                await refreshDuplicateAlerts();
            } catch (e) {
                console.debug?.(e);
            }
        },
        onBeforeReload: async () => {
            // Sync key dataset fields *before* prepareGridForScopeSwitch so that
            // snapshot-cache hydration uses the correct (new-scope) key.
            try {
                gridContainer.dataset.mjrScope = readPanelValue("scope", "output");
                gridContainer.dataset.mjrCustomRootId = readPanelValue("customRootId", "") || "";
                gridContainer.dataset.mjrSubfolder =
                    readPanelValue("currentFolderRelativePath", "") || "";
                gridContainer.dataset.mjrCollectionId = readPanelValue("collectionId", "") || "";
                gridContainer.dataset.mjrViewScope = readPanelValue("viewScope", "") || "";
            } catch (e) {
                console.debug?.(e);
            }
            try {
                prepareGridForScopeSwitchFn(gridContainer);
            } catch (e) {
                console.debug?.(e);
            }
            try {
                await updateStatus(
                    statusDot,
                    statusText,
                    capabilitiesSection,
                    {
                        scope: readPanelValue("scope", state.scope || "output"),
                        customRootId: readPanelValue("customRootId", state.customRootId || ""),
                    },
                    null,
                    { signal: panelLifecycleAC?.signal || null },
                );
            } catch (e) {
                console.debug?.(e);
            }
        },
    });

    const exitSimilarViewIfActive = async ({ reload = false } = {}) => {
        try {
            if (
                String(readPanelValue("viewScope", state.viewScope || "") || "")
                    .trim()
                    .toLowerCase() !== "similar"
            )
                return;
            await scopeController?.clearSimilarScope?.({ reload });
        } catch (e) {
            console.debug?.(e);
        }
    };

    Object.values(tabButtons).forEach((btn) => {
        btn.addEventListener("click", () => scopeController.setScope(btn.dataset.scope), {
            signal: panelLifecycleAC?.signal,
        });
    });

    // ── 19. MESSAGE POPOVER ───────────────────────────────────────────────
    bindMessagePopoverController({
        messageBtn,
        messagePopover,
        title: messagePopoverTitle,
        messageList,
        historyTabBtn,
        historyTabBadge,
        historyTabCount,
        historyPanel,
        shortcutsPanel,
        messageTabBtn,
        messageTabBadge,
        shortcutsTabBtn,
        markReadBtn,
        popovers,
        signal: panelLifecycleAC?.signal,
        onBeforeToggle: () => {
            popovers.close(customPopover);
            popovers.close(filterPopover);
            popovers.close(sortPopover);
            popovers.close(collectionsPopover);
            popovers.close(pinnedFoldersPopover);
        },
    });

    // ── 20. POPOVER BUTTONS ───────────────────────────────────────────────
    popovers.setDismissWhitelist([
        customPopover,
        filterPopover,
        sortPopover,
        collectionsPopover,
        pinnedFoldersPopover,
        messagePopover,
        customMenuBtn,
        filterBtn,
        sortBtn,
        collectionsBtn,
        pinnedFoldersBtn,
        messageBtn,
    ]);

    customMenuBtn.addEventListener(
        "click",
        (e) => {
            e.stopPropagation();
            popovers.close(filterPopover);
            popovers.close(sortPopover);
            popovers.close(collectionsPopover);
            popovers.close(messagePopover);
            popovers.toggle(customPopover, customMenuBtn);
        },
        { signal: panelLifecycleAC?.signal },
    );
    filterBtn.addEventListener(
        "click",
        (e) => {
            e.stopPropagation();
            popovers.close(customPopover);
            popovers.close(sortPopover);
            popovers.close(collectionsPopover);
            popovers.close(messagePopover);
            popovers.toggle(filterPopover, filterBtn);
        },
        { signal: panelLifecycleAC?.signal },
    );
    collectionsBtn.addEventListener(
        "click",
        (e) => {
            e.stopPropagation();
            popovers.close(customPopover);
            popovers.close(filterPopover);
            popovers.close(sortPopover);
            popovers.close(messagePopover);
            popovers.toggle(collectionsPopover, collectionsBtn);
        },
        { signal: panelLifecycleAC?.signal },
    );

    const sortController = hasVueHeaderSection
        ? null
        : createSortController({
              state,
              sortBtn,
              sortMenu,
              sortPopover,
              popovers,
              reloadGrid: gridController.reloadGrid,
              onChanged: () => notifyContextChanged(),
          });
    if (sortController) {
        sortController.bind({
            onBeforeToggle: () => {
                popovers.close(customPopover);
                popovers.close(filterPopover);
                popovers.close(collectionsPopover);
                popovers.close(messagePopover);
            },
        });
    } else {
        sortBtn.addEventListener(
            "click",
            (e) => {
                e.stopPropagation();
                popovers.close(customPopover);
                popovers.close(filterPopover);
                popovers.close(collectionsPopover);
                popovers.close(messagePopover);
                popovers.toggle(sortPopover, sortBtn);
            },
            { signal: panelLifecycleAC?.signal },
        );
    }

    // ── 21. SIMILAR SEARCH ────────────────────────────────────────────────
    bindSimilarSearch({
        similarBtn,
        gridContainer,
        state,
        panelLifecycleAC,
        isAiEnabled,
        similarDisabledTitle,
        readActiveAssetId,
        readSelectedAssetIds,
        readPanelValue,
        writePanelValue,
        scopeController,
        closePopovers: () => {
            popovers.close(customPopover);
            popovers.close(filterPopover);
            popovers.close(sortPopover);
            popovers.close(collectionsPopover);
            popovers.close(messagePopover);
        },
    });

    // ── 22. PINNED FOLDERS ────────────────────────────────────────────────
    bindPinnedFolders({
        pinnedFoldersBtn,
        pinnedFoldersMenu,
        pinnedFoldersPopover,
        popovers,
        closeOtherPopovers: () => {
            popovers.close(customPopover);
            popovers.close(filterPopover);
            popovers.close(sortPopover);
            popovers.close(collectionsPopover);
            popovers.close(messagePopover);
        },
        state,
        gridContainer,
        customSelect,
        scopeController,
        customRootsController,
        gridController,
        applyWatcherForScope,
        refreshDuplicateAlerts,
        notifyContextChanged,
        panelLifecycleAC,
    });

    // ── 23. FILTER INIT ───────────────────────────────────────────────────
    const { agendaCalendar, disposeFilters } = setupFiltersInit({
        state,
        hasVueHeaderSection,
        kindSelect,
        wfCheckbox,
        workflowTypeSelect,
        ratingSelect,
        minSizeInput,
        maxSizeInput,
        resolutionPresetSelect,
        minWidthInput,
        minHeightInput,
        maxWidthInput,
        maxHeightInput,
        dateRangeSelect,
        dateExactInput,
        agendaContainer,
        gridController,
        reconcileVisibleSelection,
        exitSimilarViewIfActive,
        notifyContextChanged,
        panelLifecycleAC,
    });

    // ── 24. CONTEXT CONTROLLER ────────────────────────────────────────────
    const extraActions = buildContextMenuExtraActions({
        state,
        scopeController,
        browserNav,
        gridController,
        getDuplicatesAlert: () => _duplicatesAlert,
        refreshDuplicateAlerts,
    });
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
            maxWidthInput,
            maxHeightInput,
            resolutionPresetSelect,
            dateRangeSelect,
            dateExactInput,
            scopeController,
            sortController,
            updateSummaryBar,
            reloadGrid: () => gridController.reloadGrid(),
            getExtraContext: () => ({ duplicatesAlert: _duplicatesAlert }),
            extraActions,
        });
    } catch (e) {
        console.debug?.(e);
    }

    // ── 25. SUMMARY BAR UPDATES ───────────────────────────────────────────
    try {
        notifyContextChanged();
        if (hasVueGridHostState) {
            const cleanup = external.bindGridHostState({
                onContextChanged: notifyContextChanged,
                markUserInteraction,
            });
            registerSummaryDispose(cleanup);
        } else {
            const onStats = () => notifyContextChanged();
            gridContainer.addEventListener("mjr:grid-stats", onStats, {
                signal: panelLifecycleAC?.signal,
            });
            window.addEventListener?.("mjr-settings-changed", onStats, {
                signal: panelLifecycleAC?.signal,
            });
            let raf = null;
            let debounceTimer = null;
            const schedule = () => {
                // Debounce MutationObserver callbacks during pagination bursts
                // (many cards inserted rapidly). Coalesce to a single update.
                if (debounceTimer) clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    debounceTimer = null;
                    if (raf) cancelAnimationFrame(raf);
                    raf = requestAnimationFrame(() => {
                        raf = null;
                        notifyContextChanged();
                    });
                }, 250);
            };
            const mo = new MutationObserver(() => schedule());
            mo.observe(gridContainer, { childList: true });
            gridContainer._mjrSummaryBarObserver = mo;
            registerSummaryDispose(() => {
                try {
                    gridContainer.removeEventListener("mjr:grid-stats", onStats);
                } catch (e) {
                    console.debug?.(e);
                }
                try {
                    window.removeEventListener?.("mjr-settings-changed", onStats);
                } catch (e) {
                    console.debug?.(e);
                }
                try {
                    if (debounceTimer) clearTimeout(debounceTimer);
                } catch (e) {
                    console.debug?.(e);
                }
                try {
                    mo.disconnect();
                } catch (e) {
                    console.debug?.(e);
                }
            });
        }
    } catch (e) {
        console.debug?.(e);
    }

    // ── 26. SIDEBAR CONTROLLER ────────────────────────────────────────────
    sidebarController = bindSidebarOpen({
        gridContainer,
        sidebar,
        createRatingBadge,
        createTagsBadge,
        showAssetInSidebar,
        closeSidebar,
        state,
    });

    // ── 27. ASSETS QUERY CONTROLLER ───────────────────────────────────────
    const assetsQueryOptions = {
        gridController,
        captureAnchor: captureAnchorFn,
        restoreAnchor: restoreAnchorFn,
        restoreGridUiState: hasVueGridHostState
            ? (initialLoadPromise) =>
                  external.restoreGridUiState(initialLoadPromise, {
                      onRestoreSidebar: () => {
                          try {
                              sidebarController?.toggleDetails?.();
                          } catch (e) {
                              console.debug?.(e);
                          }
                      },
                  })
            : null,
        readScrollTop: () => panelStateBridge.read("scrollTop", state.scrollTop || 0),
        restoreSelectionState: ({ scrollTop } = {}) => {
            selectionState?.restoreSelectionState?.({ scrollTop });
        },
        readActiveAssetId,
        isSidebarOpen,
        toggleSidebarDetails: () => {
            sidebarController?.toggleDetails?.();
        },
        getQuery,
        getScope: () => panelStateBridge.read("scope", state.scope),
        loadAssets: loadAssetsFn,
        lifecycleSignal: panelLifecycleAC?.signal || null,
    };
    if (typeof external?.initAssetsQueryController === "function") {
        assetsQueryController = external.initAssetsQueryController(assetsQueryOptions);
    } else {
        assetsQueryController = createAssetsQueryController({
            gridContainer,
            gridWrapper,
            ...assetsQueryOptions,
        });
    }

    // ── 28. HOTKEYS ───────────────────────────────────────────────────────
    const hotkeys = createPanelHotkeysController({
        onTriggerScan: (ctx) => {
            triggerScan(statusDot, statusText, capabilitiesSection, ctx || {});
        },
        onToggleDetails: () => {
            sidebarController?.toggleDetails?.();
        },
        onToggleFloatingViewer: () => {
            try {
                window.dispatchEvent(new Event(EVENTS.MFV_TOGGLE));
            } catch (e) {
                console.debug?.(e);
            }
        },
        onFocusSearch: () => {
            try {
                searchInputEl?.focus?.();
                const len = searchInputEl?.value?.length || 0;
                searchInputEl?.setSelectionRange?.(len, len);
            } catch (e) {
                console.debug?.(e);
            }
        },
        onClearSearch: () => {
            try {
                if (!searchInputEl) return;
                writePanelValue("searchQuery", "");
                searchInputEl.value = "";
                searchInputEl.dispatchEvent?.(new Event("input", { bubbles: true }));
            } catch (e) {
                console.debug?.(e);
            }
        },
        getScanContext: () => ({
            scope: panelStateBridge.read("scope", state.scope),
            customRootId: panelStateBridge.read("customRootId", state.customRootId),
        }),
    });
    const ratingHotkeys = createRatingHotkeysController({ gridContainer, createRatingBadge });

    let disposeSearchBinding = null;
    if (container._eventCleanup) {
        try {
            container._eventCleanup();
        } catch (e) {
            console.debug?.(e);
        }
    }
    hotkeys.bind(content);
    ratingHotkeys.bind();
    setHotkeysScope("grid");

    try {
        container._mjrHotkeys = hotkeys;
        container._mjrRatingHotkeys = ratingHotkeys;
        container._mjrSidebarController = sidebarController;
    } catch (e) {
        console.debug?.(e);
    }

    // ── 29. CLEANUP CLOSURE ───────────────────────────────────────────────
    container._eventCleanup = () => {
        try {
            panelLifecycleAC?.abort?.();
        } catch (e) {
            console.debug?.(e);
        }
        try {
            statusSection?._mjrStatusPollDispose?.();
        } catch (e) {
            console.debug?.(e);
        }
        try {
            container._mjrVersionUpdateCleanup?.();
        } catch (e) {
            console.debug?.(e);
        }
        container._mjrVersionUpdateCleanup = null;
        try {
            if (_scrollTimer) clearTimeout(_scrollTimer);
            _scrollTimer = null;
        } catch (e) {
            console.debug?.(e);
        }
        try {
            hotkeys.dispose();
        } catch (e) {
            console.debug?.(e);
        }
        try {
            ratingHotkeys.dispose();
        } catch (e) {
            console.debug?.(e);
        }
        if (getHotkeysState().scope === "grid") setHotkeysScope(null);
        try {
            agendaCalendar?.dispose?.();
        } catch (e) {
            console.debug?.(e);
        }
        try {
            disposeFilters?.();
        } catch (e) {
            console.debug?.(e);
        }
        try {
            disposeSearchBinding?.();
        } catch (e) {
            console.debug?.(e);
        }
        disposeSearchBinding = null;
        try {
            sidebar?.dispose?.();
        } catch (e) {
            console.debug?.(e);
        }
        try {
            sidebarController?.dispose?.();
        } catch (e) {
            console.debug?.(e);
        }
        try {
            if (_dupPollTimer) clearInterval(_dupPollTimer);
            _dupPollTimer = null;
        } catch (e) {
            console.debug?.(e);
        }
        try {
            if (_autoLoadTimer) clearTimeout(_autoLoadTimer);
            _autoLoadTimer = null;
        } catch (e) {
            console.debug?.(e);
        }
        try {
            assetsQueryController?.dispose?.();
        } catch (e) {
            console.debug?.(e);
        }
        assetsQueryController = null;
        try {
            selectionState?.dispose?.();
        } catch (e) {
            console.debug?.(e);
        }
        selectionState = null;
        try {
            gridContainer?._mjrSummaryBarDispose?.();
        } catch (e) {
            console.debug?.(e);
        }
        try {
            gridContainer?._mjrSummaryBarObserver?.disconnect?.();
        } catch (e) {
            console.debug?.(e);
        }
        try {
            gridContainer?._mjrGridContextMenuUnbind?.();
        } catch (e) {
            console.debug?.(e);
        }
        try {
            disposeCustomRootsBindings?.();
        } catch (e) {
            console.debug?.(e);
        }
        try {
            _unbindBrowserFolderNav?.();
        } catch (e) {
            console.debug?.(e);
        }
        try {
            disposeGridScanListeners();
        } catch (e) {
            console.debug?.(e);
        }
        try {
            if (gridContainer) disposeGridFn(gridContainer);
        } catch (e) {
            console.debug?.(e);
        }
        clearActiveGridContainer(gridContainer);
        gridContainer = null;
        try {
            popovers.dispose();
        } catch (e) {
            console.debug?.(e);
        }
        try {
            if (container._mjrPopoverManager === popovers) container._mjrPopoverManager = null;
        } catch (e) {
            console.debug?.(e);
        }
        try {
            if (hostWrapper && hostWrapperPrevStyle) {
                hostWrapper.style.height = hostWrapperPrevStyle.height;
                hostWrapper.style.minHeight = hostWrapperPrevStyle.minHeight;
                hostWrapper.style.width = hostWrapperPrevStyle.width;
            }
        } catch (e) {
            console.debug?.(e);
        }
    };

    // ── 30. INITIAL LOAD SEQUENCE ─────────────────────────────────────────
    const queuedReload = async () => {
        await assetsQueryController?.queuedReload?.();
    };
    const handleCountersUpdate =
        assetsQueryController?.createCountersUpdateHandler?.({
            state,
            getStableQuery: () => String(gridContainer?.dataset?.mjrQuery || "*").trim() || "*",
            getRecentUserInteractionAt: () => Number(_lastUserInteractionAt || 0),
        }) ??
        (async () => {
            await queuedReload();
        });

    setupStatusPolling(
        statusDot,
        statusText,
        statusSection,
        capabilitiesSection,
        handleCountersUpdate,
        () => ({
            scope: panelStateBridge.read("scope", state.scope),
            customRootId: panelStateBridge.read("customRootId", state.customRootId),
        }),
    );

    scopeController.setActiveTabStyles();
    browserNav?.renderBreadcrumb?.();
    customRootsController.refreshCustomRoots().catch(() => {});

    disposeSearchBinding = assetsQueryController?.bindSearchInput?.({
        searchInputEl,
        lifecycleSignal: panelLifecycleAC?.signal || null,
        debounceMs: 120,
        onQueryChanged: () => {
            void exitSimilarViewIfActive({ reload: false });
            notifyContextChanged();
        },
        onBeforeReload: () => {
            void exitSimilarViewIfActive({ reload: false });
            notifyContextChanged();
        },
        startSearchTimer: () => {
            startTimer("searchQuery");
        },
        reloadGrid: () => {
            gridController.reloadGrid();
        },
    });

    let didHydrateFromSnapshot = false;
    try {
        didHydrateFromSnapshot = await hydrateGridFromSnapshotFn(
            gridContainer,
            {
                scope: readPanelValue("scope", state.scope || "output") || "output",
                query: String(
                    normalizeQuery(
                        panelStateBridge.read("searchQuery", state.searchQuery || "*") || "*",
                    ) || "*",
                ),
                customRootId: readPanelValue("customRootId", state.customRootId || "") || "",
                subfolder:
                    readPanelValue(
                        "currentFolderRelativePath",
                        state.currentFolderRelativePath || "",
                    ) || "",
                collectionId: readPanelValue("collectionId", state.collectionId || "") || "",
                viewScope: readPanelValue("viewScope", state.viewScope || "") || "",
                kind: readPanelValue("kindFilter", state.kindFilter || "") || "",
                workflowOnly: !!readPanelValue("workflowOnly", state.workflowOnly),
                minRating: readPanelValue("minRating", state.minRating || "") || "",
                minSizeMB: readPanelValue("minSizeMB", state.minSizeMB || "") || "",
                maxSizeMB: readPanelValue("maxSizeMB", state.maxSizeMB || "") || "",
                resolutionCompare:
                    readPanelValue("resolutionCompare", state.resolutionCompare || "") || "",
                minWidth: readPanelValue("minWidth", state.minWidth || "") || "",
                minHeight: readPanelValue("minHeight", state.minHeight || "") || "",
                maxWidth: readPanelValue("maxWidth", state.maxWidth || "") || "",
                maxHeight: readPanelValue("maxHeight", state.maxHeight || "") || "",
                workflowType: readPanelValue("workflowType", state.workflowType || "") || "",
                dateRange: readPanelValue("dateRangeFilter", state.dateRangeFilter || "") || "",
                dateExact: readPanelValue("dateExactFilter", state.dateExactFilter || "") || "",
                sort: readPanelValue("sort", state.sort || "mtime_desc") || "mtime_desc",
            },
            {
                title:
                    readPanelValue("collectionName", state.collectionName || "") ||
                    panelStateBridge.read("searchQuery", state.searchQuery || "") ||
                    "Cached",
            },
        );
    } catch (e) {
        console.debug?.(e);
    }

    let hasExistingGridCards = false;
    try {
        hasExistingGridCards = !!gridContainer?.querySelector?.(".mjr-asset-card");
    } catch (e) {
        console.debug?.(e);
    }

    const initialLoadPromise =
        didHydrateFromSnapshot || hasExistingGridCards
            ? Promise.resolve({
                  ok: true,
                  hydrated: !!didHydrateFromSnapshot,
                  cached: !!hasExistingGridCards,
              })
            : gridController.reloadGrid();

    // When we showed cached snapshot data on first launch, schedule a silent
    // background refresh so the user always sees an up-to-date grid without
    // waiting for the API on cold open. The refresh reuses preserveVisibleUntilReady
    // so the cached cards remain visible until the fresh page arrives.
    if (didHydrateFromSnapshot) {
        try {
            setTimeout(() => {
                try {
                    if (panelLifecycleAC?.signal?.aborted) return;
                } catch (e) {
                    console.debug?.(e);
                }
                gridController.reloadGrid().catch(() => {});
            }, 200);
        } catch (e) {
            console.debug?.(e);
        }
    }

    // Fire-and-forget: do not block the panel mount on the duplicate alerts
    // request. It contended with the initial /list call on the single-threaded
    // backend and added perceptible latency before the first paint.
    refreshDuplicateAlerts().catch(() => {});
    try {
        _dupPollTimer = setInterval(() => {
            try {
                if (panelLifecycleAC?.signal?.aborted) return;
            } catch (e) {
                console.debug?.(e);
            }
            refreshDuplicateAlerts().catch(() => {});
        }, 15000);
    } catch (e) {
        console.debug?.(e);
    }

    assetsQueryController?.restoreUiState?.(initialLoadPromise);

    try {
        window.__mjrLastAssetUpsert = 0;
        window.__mjrLastAssetUpsertCount = 0;
    } catch (e) {
        console.debug?.(e);
    }

    _autoLoadTimer = assetsQueryController?.scheduleAutoLoad?.(initialLoadPromise, 300) ?? null;

    const renderDuration = endTimer("panelRender", "gridRender");
    trackGridRender(renderDuration);

    return { gridContainer };
}
