import { normalizeQuery } from "./query.js";
import { APP_CONFIG } from "../../../app/config.js";
import { createPanelStateBridge } from "../../../stores/panelStateBridge.js";

const _safeSetValue = (el, value) => {
    if (!el) return;
    try {
        el.value = value;
    } catch (e) {
        console.debug?.(e);
    }
};

const _safeSetChecked = (el, checked) => {
    if (!el) return;
    try {
        el.checked = !!checked;
    } catch (e) {
        console.debug?.(e);
    }
};

export function createContextController({
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
    reloadGrid,
    extraActions = null,
    getExtraContext = null,
} = {}) {
    const legacyState = state && typeof state === "object" ? state : {};
    const { read, write, controllerState } = createPanelStateBridge(state, [
        "searchQuery",
        "scope",
        "collectionId",
        "collectionName",
        "customRootId",
        "customRootLabel",
        "currentFolderRelativePath",
        "kindFilter",
        "workflowOnly",
        "minRating",
        "minSizeMB",
        "maxSizeMB",
        "minWidth",
        "minHeight",
        "maxWidth",
        "maxHeight",
        "resolutionCompare",
        "workflowType",
        "dateRangeFilter",
        "dateExactFilter",
        "sort",
        "viewScope",
        "similarResults",
        "similarTitle",
        "similarSourceAssetId",
    ]);

    const setStateValue = (key, value) => {
        write(key, value);
    };

    const getStateValue = (key, fallback = "") => {
        return read(key, fallback);
    };

    const getContextState = () => ({
        ...(legacyState || {}),
        ...(controllerState?.() || {}),
        customRootLabel: getStateValue("customRootLabel", ""),
    });

    const resetBrowserHistory = () => {
        try {
            extraActions?.resetBrowserHistory?.();
        } catch (e) {
            console.debug?.(e);
        }
    };

    const applyBadgeCssVars = () => {
        try {
            const root =
                gridContainer?.closest?.(".mjr-assets-manager") ||
                document.querySelector?.(".mjr-assets-manager") ||
                document.documentElement;
            if (!root?.style?.setProperty) return;
            root.style.setProperty(
                "--mjr-star-active",
                String(APP_CONFIG.BADGE_STAR_COLOR || "#FFD45A"),
            );
            root.style.setProperty(
                "--mjr-badge-image",
                String(APP_CONFIG.BADGE_IMAGE_COLOR || "#2196F3"),
            );
            root.style.setProperty(
                "--mjr-badge-video",
                String(APP_CONFIG.BADGE_VIDEO_COLOR || "#9C27B0"),
            );
            root.style.setProperty(
                "--mjr-badge-audio",
                String(APP_CONFIG.BADGE_AUDIO_COLOR || "#FF9800"),
            );
            root.style.setProperty(
                "--mjr-badge-model3d",
                String(APP_CONFIG.BADGE_MODEL3D_COLOR || "#4CAF50"),
            );
            root.style.setProperty(
                "--mjr-badge-duplicate-alert",
                String(APP_CONFIG.BADGE_DUPLICATE_ALERT_COLOR || "#FF1744"),
            );
        } catch (e) {
            console.debug?.(e);
        }
    };

    const actions = {
        clearQuery: async () => {
            try {
                _safeSetValue(searchInputEl, "");
                setStateValue("searchQuery", "");
            } catch (e) {
                console.debug?.(e);
            }
            try {
                await reloadGrid?.();
            } catch (e) {
                console.debug?.(e);
            }
        },
        clearCollection: async () => {
            try {
                setStateValue("collectionId", "");
                setStateValue("collectionName", "");
            } catch (e) {
                console.debug?.(e);
            }
            try {
                await reloadGrid?.();
            } catch (e) {
                console.debug?.(e);
            }
        },
        clearScope: async () => {
            try {
                if (
                    String(state?.viewScope || "")
                        .trim()
                        .toLowerCase() === "similar" &&
                    typeof extraActions?.clearSimilarScope === "function"
                ) {
                    await extraActions.clearSimilarScope();
                    return;
                }
            } catch (e) {
                console.debug?.(e);
            }
            let didSetScope = false;
            try {
                setStateValue("customRootId", "");
                setStateValue("customRootLabel", "");
                setStateValue("currentFolderRelativePath", "");
                delete gridContainer?.dataset?.mjrSubfolder;
                resetBrowserHistory();
                if (typeof scopeController?.setScope === "function") {
                    await scopeController.setScope("output");
                    didSetScope = true;
                } else {
                    setStateValue("scope", "output");
                    scopeController?.setActiveTabStyles?.();
                }
            } catch (e) {
                console.debug?.(e);
            }
            try {
                if (!didSetScope) await reloadGrid?.();
            } catch (e) {
                console.debug?.(e);
            }
        },
        clearCustomRoot: async () => {
            try {
                setStateValue("customRootId", "");
                setStateValue("customRootLabel", "");
                setStateValue("currentFolderRelativePath", "");
                delete gridContainer?.dataset?.mjrSubfolder;
                resetBrowserHistory();
            } catch (e) {
                console.debug?.(e);
            }
            try {
                await reloadGrid?.();
            } catch (e) {
                console.debug?.(e);
            }
        },
        clearFolder: async () => {
            try {
                // Ensure state is cleared so it doesn't get restored
                setStateValue("currentFolderRelativePath", "");
                delete gridContainer?.dataset?.mjrSubfolder;
                resetBrowserHistory();
            } catch (e) {
                console.debug?.(e);
            }
            try {
                await reloadGrid?.();
            } catch (e) {
                console.debug?.(e);
            }
        },
        clearKind: async () => {
            try {
                setStateValue("kindFilter", "");
                _safeSetValue(kindSelect, "");
            } catch (e) {
                console.debug?.(e);
            }
            try {
                await reloadGrid?.();
            } catch (e) {
                console.debug?.(e);
            }
        },
        clearMinRating: async () => {
            try {
                setStateValue("minRating", 0);
                _safeSetValue(ratingSelect, "0");
            } catch (e) {
                console.debug?.(e);
            }
            try {
                await reloadGrid?.();
            } catch (e) {
                console.debug?.(e);
            }
        },
        clearWorkflowOnly: async () => {
            try {
                setStateValue("workflowOnly", false);
                _safeSetChecked(wfCheckbox, false);
            } catch (e) {
                console.debug?.(e);
            }
            try {
                await reloadGrid?.();
            } catch (e) {
                console.debug?.(e);
            }
        },
        clearWorkflowType: async () => {
            try {
                setStateValue("workflowType", "");
                _safeSetValue(workflowTypeSelect, "");
            } catch (e) {
                console.debug?.(e);
            }
            try {
                await reloadGrid?.();
            } catch (e) {
                console.debug?.(e);
            }
        },
        clearSize: async () => {
            try {
                setStateValue("minSizeMB", 0);
                setStateValue("maxSizeMB", 0);
                _safeSetValue(minSizeInput, "");
                _safeSetValue(maxSizeInput, "");
            } catch (e) {
                console.debug?.(e);
            }
            try {
                await reloadGrid?.();
            } catch (e) {
                console.debug?.(e);
            }
        },
        clearResolution: async () => {
            try {
                setStateValue("minWidth", 0);
                setStateValue("minHeight", 0);
                setStateValue("maxWidth", 0);
                setStateValue("maxHeight", 0);
                _safeSetValue(minWidthInput, "");
                _safeSetValue(minHeightInput, "");
                _safeSetValue(maxWidthInput, "");
                _safeSetValue(maxHeightInput, "");
                _safeSetValue(resolutionPresetSelect, "");
            } catch (e) {
                console.debug?.(e);
            }
            try {
                await reloadGrid?.();
            } catch (e) {
                console.debug?.(e);
            }
        },
        clearDateRange: async () => {
            try {
                setStateValue("dateRangeFilter", "");
                _safeSetValue(dateRangeSelect, "");
            } catch (e) {
                console.debug?.(e);
            }
            try {
                await reloadGrid?.();
            } catch (e) {
                console.debug?.(e);
            }
        },
        clearDateExact: async () => {
            try {
                setStateValue("dateExactFilter", "");
                _safeSetValue(dateExactInput, "");
            } catch (e) {
                console.debug?.(e);
            }
            try {
                await reloadGrid?.();
            } catch (e) {
                console.debug?.(e);
            }
        },
        clearSort: async () => {
            try {
                setStateValue("sort", "mtime_desc");
                sortController?.setSortIcon?.(getStateValue("sort", "mtime_desc"));
                sortController?.renderSortMenu?.();
            } catch (e) {
                console.debug?.(e);
            }
            try {
                await reloadGrid?.();
            } catch (e) {
                console.debug?.(e);
            }
        },
        clearAll: async () => {
            let didSetScope = false;
            try {
                _safeSetValue(searchInputEl, "");
            } catch (e) {
                console.debug?.(e);
            }
            try {
                setStateValue("collectionId", "");
                setStateValue("collectionName", "");
                setStateValue("kindFilter", "");
                setStateValue("workflowOnly", false);
                setStateValue("minRating", 0);
                setStateValue("minSizeMB", 0);
                setStateValue("maxSizeMB", 0);
                setStateValue("minWidth", 0);
                setStateValue("minHeight", 0);
                setStateValue("maxWidth", 0);
                setStateValue("maxHeight", 0);
                setStateValue("resolutionCompare", "gte");
                setStateValue("workflowType", "");
                setStateValue("dateRangeFilter", "");
                setStateValue("dateExactFilter", "");
                setStateValue("sort", "mtime_desc");
                setStateValue("customRootId", "");
                setStateValue("customRootLabel", "");
                setStateValue("currentFolderRelativePath", "");
                delete gridContainer?.dataset?.mjrSubfolder;
                resetBrowserHistory();
                try {
                    await extraActions?.clearTransientContext?.();
                } catch (e) {
                    console.debug?.(e);
                }
                if (typeof scopeController?.setScope === "function") {
                    await scopeController.setScope("output");
                    didSetScope = true;
                } else {
                    setStateValue("scope", "output");
                    scopeController?.setActiveTabStyles?.();
                }
            } catch (e) {
                console.debug?.(e);
            }
            try {
                _safeSetValue(kindSelect, "");
                _safeSetChecked(wfCheckbox, false);
                _safeSetValue(workflowTypeSelect, "");
                _safeSetValue(ratingSelect, "0");
                _safeSetValue(minSizeInput, "");
                _safeSetValue(maxSizeInput, "");
                _safeSetValue(minWidthInput, "");
                _safeSetValue(minHeightInput, "");
                _safeSetValue(maxWidthInput, "");
                _safeSetValue(maxHeightInput, "");
                _safeSetValue(resolutionPresetSelect, "");
                _safeSetValue(dateRangeSelect, "");
                _safeSetValue(dateExactInput, "");
            } catch (e) {
                console.debug?.(e);
            }
            try {
                sortController?.setSortIcon?.(getStateValue("sort", "mtime_desc"));
                sortController?.renderSortMenu?.();
            } catch (e) {
                console.debug?.(e);
            }
            try {
                if (!didSetScope) await reloadGrid?.();
            } catch (e) {
                console.debug?.(e);
            }
        },
    };
    if (extraActions && typeof extraActions === "object") {
        const blocked = new Set(["__proto__", "constructor", "prototype"]);
        for (const [key, value] of Object.entries(extraActions)) {
            if (blocked.has(String(key))) continue;
            actions[key] = value;
        }
    }

    const update = () => {
        const rawQuery = String(searchInputEl?.value || "").trim();
        const normalizedQuery = normalizeQuery(searchInputEl);
        const currentState = getContextState();

        const filterActive = !!(
            getStateValue("kindFilter", "") ||
            "" ||
            getStateValue("workflowOnly", false) ||
            (Number(getStateValue("minRating", 0) || 0) || 0) > 0 ||
            (Number(getStateValue("minSizeMB", 0) || 0) || 0) > 0 ||
            (Number(getStateValue("maxSizeMB", 0) || 0) || 0) > 0 ||
            (Number(getStateValue("minWidth", 0) || 0) || 0) > 0 ||
            (Number(getStateValue("minHeight", 0) || 0) || 0) > 0 ||
            (Number(getStateValue("maxWidth", 0) || 0) || 0) > 0 ||
            (Number(getStateValue("maxHeight", 0) || 0) || 0) > 0 ||
            String(getStateValue("workflowType", "") || "").trim().length > 0 ||
            getStateValue("dateRangeFilter", "") ||
            "" ||
            getStateValue("dateExactFilter", "") ||
            ""
        );
        const sortActive =
            String(getStateValue("sort", "mtime_desc") || "mtime_desc") !== "mtime_desc";
        const collectionsActive = !!(getStateValue("collectionId", "") || "");

        try {
            filterBtn?.classList?.toggle?.("mjr-context-active", filterActive);
            sortBtn?.classList?.toggle?.("mjr-context-active", sortActive);
            collectionsBtn?.classList?.toggle?.("mjr-context-active", collectionsActive);
        } catch (e) {
            console.debug?.(e);
        }

        try {
            const extraContext =
                (typeof getExtraContext === "function" ? getExtraContext() || {} : {}) || {};
            updateSummaryBar?.({
                state: currentState,
                gridContainer,
                context: { rawQuery: rawQuery || normalizedQuery, ...extraContext },
                actions,
            });
        } catch (e) {
            console.debug?.(e);
        }

        // Keep badge CSS vars aligned with live settings/theme changes.
        applyBadgeCssVars();
    };

    return { update, actions };
}
