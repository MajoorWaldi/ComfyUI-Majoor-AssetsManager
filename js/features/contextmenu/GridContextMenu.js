/**
 * GridContextMenu.js
 *
 * Vue now renders the menu DOM. This module only:
 * - detects right-click context
 * - computes the menu model
 * - executes menu actions
 */

import {
    browserFolderOp,
    deleteAsset,
    getAssetMetadata,
    openInFolder,
    post,
    removeFilepathsFromCollection,
    renameAsset,
    updateAssetRating,
} from "../../api/client.js";
import { ENDPOINTS, buildDownloadURL } from "../../api/endpoints.js";
import { ASSET_RATING_CHANGED_EVENT } from "../../app/events.js";
import { t } from "../../app/i18n.js";
import { comfyConfirm, comfyPrompt } from "../../app/dialogs.js";
import { comfyToast } from "../../app/toast.js";
import { APP_CONFIG } from "../../app/config.js";
import { createWorkflowDot } from "../../components/Badges.js";
import { normalizeRenameFilename, validateFilename } from "../../utils/filenames.js";
import { reportError } from "../../utils/logging.js";
import { safeClosest, safeEscapeSelector } from "../../utils/dom.js";
import { safeDispatchCustomEvent } from "../../utils/events.js";
import { confirmDeletion } from "../../utils/deleteGuard.js";
import { showAddToCollectionMenu } from "../collections/contextmenu/addToCollectionMenu.js";
import { removeAssetsFromGrid } from "../grid/gridApi.js";
import { getShortcutDisplay } from "../grid/GridKeyboard.js";
import { floatingViewerManager } from "../viewer/floatingViewerManager.js";
import {
    closeAllGridContextMenus,
    openGridContextMenu,
    openGridTagsPopover,
} from "./gridContextMenuState.js";
import { cancelAllRatingUpdates, scheduleRatingUpdate } from "./ratingUpdater.js";
import { requestViewerOpen } from "../viewer/viewerOpenRequest.js";

let _nextMenuItemId = 1;

function createItem(
    label,
    iconClass,
    rightHint,
    action,
    { disabled = false, closeOnSelect = true, submenu = null } = {},
) {
    return {
        id: `mjr-grid-menu-item-${_nextMenuItemId++}`,
        type: "item",
        label: String(label || ""),
        iconClass: iconClass ? String(iconClass) : "",
        rightHint: rightHint ? String(rightHint) : "",
        disabled: !!disabled,
        closeOnSelect,
        submenu: Array.isArray(submenu) && submenu.length ? submenu : null,
        action: typeof action === "function" ? action : null,
    };
}

function createSeparator() {
    return {
        id: `mjr-grid-menu-separator-${_nextMenuItemId++}`,
        type: "separator",
    };
}

const getSelectedAssetIds = (gridContainer) => {
    const selected = new Set();
    if (!gridContainer) return selected;
    try {
        const raw = gridContainer.dataset?.mjrSelectedAssetIds;
        if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
                list.forEach((id) => selected.add(String(id)));
                return selected;
            }
        }
    } catch (e) {
        console.debug?.(e);
    }
    try {
        const cards = gridContainer.querySelectorAll(".mjr-asset-card.is-selected");
        for (const card of cards) {
            const id = card.dataset?.mjrAssetId;
            if (id) selected.add(String(id));
        }
    } catch (e) {
        console.debug?.(e);
    }
    return selected;
};

const getSelectedAssets = (gridContainer) => {
    const assets = [];
    if (!gridContainer) return assets;
    try {
        const raw = gridContainer.dataset?.mjrSelectedAssetIds;
        if (raw) {
            const ids = JSON.parse(raw);
            if (Array.isArray(ids) && ids.length) {
                const all =
                    typeof gridContainer?._mjrGetAssets === "function"
                        ? gridContainer._mjrGetAssets()
                        : [];
                const idSet = new Set(ids.map(String));
                for (const asset of all || []) {
                    const id = String(asset?.id || "");
                    if (id && idSet.has(id)) assets.push(asset);
                }
                if (assets.length) return assets;
            }
        }
    } catch (e) {
        console.debug?.(e);
    }
    try {
        const cards = gridContainer.querySelectorAll(".mjr-asset-card.is-selected");
        for (const card of cards) {
            const asset = card?._mjrAsset;
            if (asset) assets.push(asset);
        }
    } catch (e) {
        console.debug?.(e);
    }
    return assets;
};

const getAssetFilepath = (asset) => {
    try {
        const filepath = asset?.filepath || asset?.path || asset?.file_info?.filepath || "";
        return filepath ? String(filepath) : "";
    } catch {
        return "";
    }
};

const clearSelection = (gridContainer) => {
    if (!gridContainer) return;
    try {
        if (typeof gridContainer?._mjrSetSelection === "function") {
            gridContainer._mjrSetSelection([], "");
        } else {
            const cards = gridContainer.querySelectorAll(".mjr-asset-card.is-selected");
            for (const card of cards) {
                card.classList.remove("is-selected");
                card.setAttribute("aria-selected", "false");
            }
            delete gridContainer.dataset.mjrSelectedAssetIds;
            delete gridContainer.dataset.mjrSelectedAssetId;
        }
    } catch (e) {
        console.debug?.(e);
    }
    safeDispatchCustomEvent(
        "mjr:selection-changed",
        { selectedIds: [] },
        { target: gridContainer, warnPrefix: "[GridContextMenu]" },
    );
};

const selectCardForDetails = (gridContainer, card, asset, state) => {
    if (!gridContainer) return;
    try {
        clearSelection(gridContainer);
    } catch (e) {
        console.debug?.(e);
    }

    try {
        card?.classList?.add?.("is-selected");
        card?.setAttribute?.("aria-selected", "true");
    } catch (e) {
        console.debug?.(e);
    }

    const id = asset?.id != null ? String(asset.id) : "";
    if (id) {
        try {
            if (typeof gridContainer?._mjrSetSelection === "function") {
                gridContainer._mjrSetSelection([id], id);
            } else {
                gridContainer.dataset.mjrSelectedAssetIds = JSON.stringify([id]);
                gridContainer.dataset.mjrSelectedAssetId = id;
            }
        } catch (e) {
            console.debug?.(e);
        }
    }

    if (state && typeof state === "object") {
        try {
            state.selectedAssetIds = id ? [id] : [];
            state.activeAssetId = id;
        } catch (e) {
            console.debug?.(e);
        }
    }
};

const getAllAssetsInGrid = (gridContainer) => {
    const assets = [];
    if (!gridContainer) return assets;
    try {
        const getter = gridContainer._mjrGetAssets;
        if (typeof getter === "function") {
            const list = getter();
            if (Array.isArray(list) && list.length) return list;
        }
    } catch (e) {
        console.debug?.(e);
    }
    try {
        const cards = gridContainer.querySelectorAll(".mjr-asset-card");
        for (const card of cards) {
            const asset = card?._mjrAsset;
            if (asset) assets.push(asset);
        }
    } catch (e) {
        console.debug?.(e);
    }
    return assets;
};

const findIndexById = (assets, assetId) => {
    try {
        const id = String(assetId ?? "");
        return (assets || []).findIndex((asset) => String(asset?.id ?? "") === id);
    } catch {
        return -1;
    }
};

function findRenderedCard(assetId) {
    if (assetId == null) return null;
    try {
        return document.querySelector(`[data-mjr-asset-id="${safeEscapeSelector(assetId)}"]`);
    } catch (e) {
        console.debug?.(e);
        return null;
    }
}

function syncRenderedCardAsset(asset, patch = null) {
    const card = findRenderedCard(asset?.id);
    if (!card || !card._mjrAsset || typeof card._mjrAsset !== "object") return card;
    try {
        if (patch && typeof patch === "object") Object.assign(card._mjrAsset, patch);
        else if (asset && typeof asset === "object") Object.assign(card._mjrAsset, asset);
    } catch (e) {
        console.debug?.(e);
    }
    return card;
}

const triggerBrowserGridReload = (gridContainer) => {
    try {
        const reason = gridContainer ? "grid-contextmenu" : "grid-contextmenu-global";
        window?.dispatchEvent?.(new CustomEvent("mjr:reload-grid", { detail: { reason } }));
    } catch (e) {
        console.debug?.(e);
    }
};

async function resetIndexForSingleAsset(asset, gridContainer) {
    if (!asset) return { ok: false, error: "Missing asset" };

    const fileEntry = {
        filename: String(asset.filename || "").trim(),
        subfolder: String(asset.subfolder || "").trim(),
        type:
            String(asset.type || asset.source || "output")
                .trim()
                .toLowerCase() || "output",
        root_id:
            String(asset.root_id || asset.rootId || asset?.file_info?.root_id || "").trim() ||
            undefined,
    };
    if (!fileEntry.filename) return { ok: false, error: "Missing filename" };

    const indexRes = await post(ENDPOINTS.INDEX_FILES, { files: [fileEntry], incremental: false });
    if (!indexRes?.ok) return indexRes || { ok: false, error: "Index refresh failed" };

    if (asset?.id != null) {
        try {
            const fresh = await getAssetMetadata(asset.id);
            if (fresh?.ok && fresh?.data && typeof fresh.data === "object") {
                Object.assign(asset, fresh.data);
                const card = syncRenderedCardAsset(asset, fresh.data);
                const oldDot = card?.querySelector?.(".mjr-workflow-dot");
                if (oldDot) {
                    const nextDot = createWorkflowDot(card._mjrAsset);
                    if (nextDot) oldDot.replaceWith(nextDot);
                }
            }
        } catch (e) {
            console.debug?.(e);
        }
    }

    triggerBrowserGridReload(gridContainer);
    return { ok: true, data: { refreshed: true } };
}

function setRating(asset, rating, onChanged) {
    const assetId = asset?.id;
    try {
        asset.rating = rating;
    } catch (e) {
        console.debug?.(e);
    }
    try {
        onChanged?.();
    } catch (e) {
        console.debug?.(e);
    }

    if (assetId) {
        scheduleRatingUpdate(String(assetId), rating, {
            successMessage: rating > 0 ? `Rating set to ${rating} stars` : "Rating cleared",
            errorMessage: "Failed to update rating",
            warnPrefix: "[GridContextMenu]",
            onSuccess: () => {
                safeDispatchCustomEvent(
                    ASSET_RATING_CHANGED_EVENT,
                    { assetId: String(assetId), rating },
                    { warnPrefix: "[GridContextMenu]" },
                );
            },
            onFailure: (error) => {
                reportError(error, "[GridContextMenu] Rating update", {
                    showToast: APP_CONFIG.DEBUG_VERBOSE_ERRORS,
                });
            },
        });
        return;
    }

    updateAssetRating(asset, rating).catch((error) => {
        reportError(error, "[GridContextMenu] Rating update", {
            showToast: APP_CONFIG.DEBUG_VERBOSE_ERRORS,
        });
    });
}

function _isBrowserScope(panelState) {
    return String(panelState?.scope || "").toLowerCase() === "custom";
}

function _isFolderAsset(asset) {
    return String(asset?.kind || "").toLowerCase() === "folder";
}

function _getSelectionSnapshot(gridContainer) {
    const selectedIds = getSelectedAssetIds(gridContainer);
    const selectedAssetsNow = getSelectedAssets(gridContainer);
    const effectiveSelectionCount = selectedAssetsNow.length || selectedIds.size;
    return {
        selectedIds,
        selectedAssetsNow,
        effectiveSelectionCount,
        isMultiSelected: effectiveSelectionCount > 1,
        hasSelection: effectiveSelectionCount > 0,
    };
}

function _ensureRightClickSelection({ asset, card, gridContainer }) {
    let selectedIds = getSelectedAssetIds(gridContainer);
    const cardSelected = !!card?.classList?.contains?.("is-selected");
    if (!asset || cardSelected) return selectedIds;

    const nextId = asset?.id != null ? String(asset.id) : "";
    const newSelection = nextId ? [nextId] : [];
    try {
        if (nextId && typeof gridContainer?._mjrSetSelection === "function") {
            gridContainer._mjrSetSelection(newSelection, newSelection[0]);
        } else if (nextId) {
            gridContainer.dataset.mjrSelectedAssetIds = JSON.stringify(newSelection);
            gridContainer.dataset.mjrSelectedAssetId = newSelection[0];
        } else {
            delete gridContainer.dataset.mjrSelectedAssetIds;
            delete gridContainer.dataset.mjrSelectedAssetId;
        }
    } catch (e) {
        console.debug?.(e);
    }

    safeDispatchCustomEvent(
        "mjr:selection-changed",
        {
            selectedIds: newSelection,
            selectedAssets: [asset],
            activeId: nextId,
        },
        { target: gridContainer, warnPrefix: "[GridContextMenu]" },
    );

    selectedIds = new Set(newSelection);
    try {
        gridContainer.querySelectorAll(".mjr-asset-card.is-selected").forEach((el) => {
            el.classList.remove("is-selected");
            el.setAttribute?.("aria-selected", "false");
        });
        card?.classList?.add?.("is-selected");
        card?.setAttribute?.("aria-selected", "true");
    } catch (e) {
        console.debug?.(e);
    }
    return selectedIds;
}

function _buildRatingSubmenu(asset, canRate) {
    const stars = (n) => "*".repeat(n) + "o".repeat(Math.max(0, 5 - n));
    const updateRenderedRating = (value) => {
        syncRenderedCardAsset(asset, { rating: value });
    };

    return [
        createItem(
            stars(5),
            "pi pi-star",
            null,
            async () => {
                setRating(asset, 5, () => updateRenderedRating(5));
            },
            { disabled: !canRate },
        ),
        createItem(
            stars(4),
            "pi pi-star",
            null,
            async () => {
                setRating(asset, 4, () => updateRenderedRating(4));
            },
            { disabled: !canRate },
        ),
        createItem(
            stars(3),
            "pi pi-star",
            null,
            async () => {
                setRating(asset, 3, () => updateRenderedRating(3));
            },
            { disabled: !canRate },
        ),
        createItem(
            stars(2),
            "pi pi-star",
            null,
            async () => {
                setRating(asset, 2, () => updateRenderedRating(2));
            },
            { disabled: !canRate },
        ),
        createItem(
            stars(1),
            "pi pi-star",
            null,
            async () => {
                setRating(asset, 1, () => updateRenderedRating(1));
            },
            { disabled: !canRate },
        ),
        createSeparator(),
        createItem(
            t("ctx.resetRating", "Reset rating"),
            "pi pi-star",
            "0",
            async () => {
                setRating(asset, 0, () => updateRenderedRating(0));
            },
            { disabled: !canRate },
        ),
    ];
}

function _buildEmptyGridItems({ currentPath, gridContainer }) {
    return [
        createItem(
            t("ctx.createFolderHere", "Create folder here..."),
            "pi pi-plus",
            null,
            async () => {
                try {
                    const name = await comfyPrompt(
                        t("dialog.newFolderName", "New folder name"),
                        "",
                    );
                    const next = String(name || "").trim();
                    if (!next) return;
                    const res = await browserFolderOp({
                        op: "create",
                        path: currentPath,
                        name: next,
                    });
                    if (!res?.ok) {
                        comfyToast(res?.error || "Failed to create folder", "error");
                        return;
                    }
                    triggerBrowserGridReload(gridContainer);
                    comfyToast(
                        t("toast.folderCreated", "Folder created: {name}", { name: next }),
                        "success",
                    );
                } catch (error) {
                    comfyToast(
                        t("toast.createFolderFailedDetail", "Create folder failed: {error}", {
                            error: error?.message || String(error || ""),
                        }),
                        "error",
                    );
                }
            },
        ),
    ];
}

function _buildFolderItems({ asset, gridContainer, panelState }) {
    const folderPath = String(asset?.filepath || "").trim();
    const items = [
        createItem(t("ctx.openFolder", "Open folder"), "pi pi-folder-open", null, () => {
            try {
                gridContainer.dispatchEvent(
                    new CustomEvent("mjr:open-folder-asset", {
                        bubbles: true,
                        detail: { asset },
                    }),
                );
            } catch (e) {
                console.debug?.(e);
            }
        }),
        createItem(t("ctx.pinAsBrowserRoot"), "pi pi-bookmark", null, async () => {
            if (!folderPath) {
                comfyToast(t("toast.unableResolveFolderPath"), "error");
                return;
            }
            const label = await comfyPrompt(
                t("dialog.browserRootLabelOptional"),
                String(asset?.filename || ""),
            );
            const res = await post(ENDPOINTS.CUSTOM_ROOTS, {
                path: folderPath,
                label: String(label || "").trim() || undefined,
            });
            if (!res?.ok) {
                comfyToast(res?.error || t("toast.pinFolderFailed"), "error");
                return;
            }
            comfyToast(t("toast.folderPinnedAsBrowserRoot"), "success");
            try {
                window.dispatchEvent(
                    new CustomEvent("mjr:custom-roots-changed", {
                        detail: { preferredId: String(res?.data?.id || "") },
                    }),
                );
            } catch (e) {
                console.debug?.(e);
            }
        }),
    ];

    if (_isBrowserScope(panelState) && folderPath) {
        items.push(
            createSeparator(),
            createItem(t("ctx.createFolderHere"), "pi pi-plus", null, async () => {
                try {
                    const name = await comfyPrompt(t("dialog.newFolderName"), "");
                    const next = String(name || "").trim();
                    if (!next) return;
                    const res = await browserFolderOp({
                        op: "create",
                        path: folderPath,
                        name: next,
                    });
                    if (!res?.ok) {
                        comfyToast(res?.error || t("toast.createFolderFailed"), "error");
                        return;
                    }
                    triggerBrowserGridReload(gridContainer);
                    comfyToast(t("toast.folderCreated", { name: next }), "success");
                } catch (error) {
                    comfyToast(
                        t("toast.createFolderFailedDetail", {
                            error: error?.message || String(error || ""),
                        }),
                        "error",
                    );
                }
            }),
            createItem(t("ctx.renameFolder"), "pi pi-pencil", null, async () => {
                try {
                    const current = String(asset?.filename || "").trim();
                    const name = await comfyPrompt(t("dialog.renameFolder"), current);
                    const next = String(name || "").trim();
                    if (!next || next === current) return;
                    const res = await browserFolderOp({
                        op: "rename",
                        path: folderPath,
                        name: next,
                    });
                    if (!res?.ok) {
                        comfyToast(res?.error || t("toast.renameFolderFailed"), "error");
                        return;
                    }
                    triggerBrowserGridReload(gridContainer);
                    comfyToast(t("toast.folderRenamed"), "success");
                } catch (error) {
                    comfyToast(
                        t("toast.renameFolderFailedDetail", {
                            error: error?.message || String(error || ""),
                        }),
                        "error",
                    );
                }
            }),
            createItem(t("ctx.moveFolder"), "pi pi-arrow-right", null, async () => {
                try {
                    const destination = await comfyPrompt(t("dialog.destinationDirectoryPath"), "");
                    const dest = String(destination || "").trim();
                    if (!dest) return;
                    const res = await browserFolderOp({
                        op: "move",
                        path: folderPath,
                        destination: dest,
                    });
                    if (!res?.ok) {
                        comfyToast(res?.error || t("toast.moveFolderFailed"), "error");
                        return;
                    }
                    triggerBrowserGridReload(gridContainer);
                    comfyToast(t("toast.folderMoved"), "success");
                } catch (error) {
                    comfyToast(
                        t("toast.moveFolderFailedDetail", {
                            error: error?.message || String(error || ""),
                        }),
                        "error",
                    );
                }
            }),
            createItem(t("ctx.deleteFolder"), "pi pi-trash", null, async () => {
                try {
                    const folderName = String(
                        asset?.filename || t("label.thisFolder", "this folder"),
                    );
                    const ok = await comfyConfirm(
                        t("dialog.deleteFolderRecursive", { name: folderName }),
                    );
                    if (!ok) return;
                    const res = await browserFolderOp({
                        op: "delete",
                        path: folderPath,
                        recursive: true,
                    });
                    if (!res?.ok) {
                        comfyToast(res?.error || t("toast.deleteFolderFailed"), "error");
                        return;
                    }
                    triggerBrowserGridReload(gridContainer);
                    comfyToast(t("toast.folderDeleted"), "success");
                } catch (error) {
                    comfyToast(
                        t("toast.deleteFolderFailedDetail", {
                            error: error?.message || String(error || ""),
                        }),
                        "error",
                    );
                }
            }),
        );
    }

    return items;
}

function _buildAssetItems({
    asset,
    card,
    gridContainer,
    panelState,
    pointerX,
    pointerY,
    selection,
}) {
    const { selectedAssetsNow, effectiveSelectionCount, isMultiSelected, hasSelection } = selection;
    const items = [];
    const openInViewer = ({ assets = [], index = 0, mode = "" } = {}) =>
        requestViewerOpen({ assets, index, mode });

    items.push(
        createItem("Open Viewer", "pi pi-image", getShortcutDisplay("OPEN_VIEWER"), () => {
            try {
                const selectedAssets = hasSelection ? getSelectedAssets(gridContainer) : [];
                const mediaSelectedAssets = selectedAssets.filter(
                    (entry) => !_isFolderAsset(entry),
                );
                const selectedCount = mediaSelectedAssets.length;
                if (selectedCount >= 2 && selectedCount <= 4) {
                    openInViewer({ assets: mediaSelectedAssets, index: 0 });
                    return;
                }

                const allAssets = getAllAssetsInGrid(gridContainer).filter(
                    (entry) => !_isFolderAsset(entry),
                );
                const index = findIndexById(allAssets, asset?.id);
                if (!allAssets.length || index < 0) return;
                openInViewer({ assets: allAssets, index: Math.max(0, index) });
            } catch (e) {
                console.debug?.(e);
            }
        }),
        createItem("Open Graph Map", "pi pi-sitemap", null, async () => {
            try {
                await floatingViewerManager.openAssets({
                    assets: [asset],
                    index: 0,
                    mode: "graph",
                });
            } catch (e) {
                console.debug?.(e);
            }
        }),
        createItem(
            t("ctx.showMetadataPanel", "Show metadata panel"),
            "pi pi-info-circle",
            getShortcutDisplay("METADATA_PANEL"),
            () => {
                try {
                    selectCardForDetails(gridContainer, card, asset, panelState);
                    const openDetails = gridContainer?._mjrOpenDetails;
                    if (typeof openDetails === "function") openDetails();
                } catch (e) {
                    console.debug?.(e);
                }
            },
        ),
    );

    const mediaSelectedAssets = (hasSelection ? selectedAssetsNow : []).filter(
        (entry) => !_isFolderAsset(entry),
    );
    const selectedCount = mediaSelectedAssets.length;

    if (selectedCount === 2) {
        items.push(
            createItem(
                "Compare A/B (2 selected)",
                "pi pi-clone",
                getShortcutDisplay("COMPARE_AB"),
                () => {
                    try {
                        openInViewer({ assets: mediaSelectedAssets, index: 0, mode: "ab" });
                    } catch (e) {
                        console.debug?.(e);
                    }
                },
            ),
        );
    }

    if (selectedCount >= 2 && selectedCount <= 4) {
        items.push(
            createItem(
                `Side-by-side (2x2) (${selectedCount} selected)`,
                "pi pi-table",
                getShortcutDisplay("SIDE_BY_SIDE"),
                () => {
                    try {
                        openInViewer({
                            assets: mediaSelectedAssets,
                            index: 0,
                            mode: "sidebyside",
                        });
                    } catch (e) {
                        console.debug?.(e);
                    }
                },
            ),
        );
    }

    items.push(
        createItem(
            t("ctx.openInFolder", "Open in folder"),
            "pi pi-folder-open",
            getShortcutDisplay("OPEN_IN_FOLDER"),
            async () => {
                const res = await openInFolder(asset);
                if (!res?.ok) {
                    comfyToast(res?.error || t("toast.openFolderFailed"), "error");
                } else {
                    comfyToast(t("toast.openedInFolder"), "info", 2000);
                }
            },
            { disabled: !(asset?.id || getAssetFilepath(asset)) },
        ),
        createItem(
            t("ctx.copyPath", "Copy path"),
            "pi pi-copy",
            getShortcutDisplay("COPY_PATH"),
            async () => {
                const filepath = asset?.filepath ? String(asset.filepath) : "";
                if (!filepath) {
                    comfyToast(t("toast.noFilePath"), "error");
                    return;
                }
                try {
                    await navigator.clipboard.writeText(filepath);
                    comfyToast(t("toast.pathCopied"), "success", 2000);
                } catch (err) {
                    console.warn(t("log.clipboardCopyFailed", "Clipboard copy failed"), err);
                    comfyToast(t("toast.pathCopyFailed"), "error");
                }
            },
        ),
        createItem(
            t("ctx.download", "Download"),
            "pi pi-download",
            getShortcutDisplay("DOWNLOAD"),
            () => {
                if (!asset?.filepath) return;
                const url = buildDownloadURL(asset.filepath);
                const filename = asset.filename || "download";
                const link = document.createElement("a");
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                comfyToast(
                    t("toast.downloadingFile", "Downloading {filename}...", { filename }),
                    "info",
                    3000,
                );
            },
            { disabled: !asset?.filepath },
        ),
        createItem(
            "Add to collection...",
            "pi pi-bookmark",
            getShortcutDisplay("ADD_TO_COLLECTION"),
            async () => {
                const selectedAssets = getSelectedAssets(gridContainer);
                const list = selectedAssets.length ? selectedAssets : [asset];
                await showAddToCollectionMenu({ x: pointerX, y: pointerY, assets: list });
            },
        ),
    );

    const collectionId = String(panelState?.collectionId || "").trim();
    if (collectionId) {
        const selectedAssets = getSelectedAssets(gridContainer);
        const list = selectedAssets.length ? selectedAssets : [asset];
        const filepaths = list.map(getAssetFilepath).filter(Boolean);
        const label =
            filepaths.length > 1
                ? `Remove from collection (${filepaths.length})`
                : "Remove from collection";
        items.push(
            createItem(label, "pi pi-bookmark", null, async () => {
                if (!filepaths.length) {
                    comfyToast(t("toast.noFilePath"), "error");
                    return;
                }
                const res = await removeFilepathsFromCollection(collectionId, filepaths);
                if (!res?.ok) {
                    comfyToast(res?.error || t("toast.removeFromCollectionFailed"), "error");
                    return;
                }
                triggerBrowserGridReload(gridContainer);
            }),
        );
    }

    const canRate = !!(asset?.id || getAssetFilepath(asset));
    items.push(
        createSeparator(),
        createItem(
            t("ctx.editTags", "Edit tags"),
            "pi pi-tags",
            getShortcutDisplay("EDIT_TAGS"),
            () => {
                showTagsPopover(pointerX + 6, pointerY + 6, asset, () => {
                    syncRenderedCardAsset(asset, {
                        tags: Array.isArray(asset?.tags) ? [...asset.tags] : [],
                    });
                });
            },
            { closeOnSelect: false },
        ),
        createSeparator(),
        createItem(t("ctx.setRating", "Set rating"), "pi pi-star", "1-5 >", null, {
            disabled: !canRate,
            closeOnSelect: false,
            submenu: _buildRatingSubmenu(asset, canRate),
        }),
        createSeparator(),
        createItem(
            t("ctx.resetIndexFile", "Reset index (this file)"),
            "pi pi-refresh",
            null,
            async () => {
                if (!(asset?.filename || asset?.id)) return;
                comfyToast(t("toast.rescanningFile", "Rescanning file..."), "info", 1600);
                try {
                    const res = await resetIndexForSingleAsset(asset, gridContainer);
                    if (res?.ok) {
                        comfyToast(
                            t("toast.metadataRefreshed", "Metadata refreshed{suffix}", {
                                suffix: "",
                            }),
                            "success",
                            1800,
                        );
                    } else {
                        comfyToast(
                            res?.error || t("toast.resetFailed", "Failed to reset index"),
                            "error",
                        );
                    }
                } catch (error) {
                    comfyToast(
                        `${t("toast.resetFailed", "Failed to reset index")}: ${error?.message || String(error || "")}`,
                        "error",
                    );
                }
            },
            { disabled: !(asset?.filename || asset?.id) },
        ),
        createItem(
            "Rename...",
            "pi pi-pencil",
            getShortcutDisplay("RENAME"),
            async () => {
                if (!(asset?.id || getAssetFilepath(asset))) return;
                const currentName = asset.filename || "";
                const rawInput = await comfyPrompt(
                    t("dialog.rename.title", "Rename file"),
                    currentName,
                );
                const newName = normalizeRenameFilename(rawInput, currentName);
                if (!newName || newName === currentName) return;
                const validation = validateFilename(newName);
                if (!validation.valid) {
                    comfyToast(validation.reason, "error");
                    return;
                }

                try {
                    const result = await renameAsset(asset, newName);
                    if (!result?.ok) {
                        comfyToast(result?.error || t("toast.fileRenameFailed"), "error");
                        return;
                    }

                    const fresh = result?.data?.asset;
                    if (fresh && typeof fresh === "object") {
                        Object.assign(asset, fresh);
                        syncRenderedCardAsset(asset, fresh);
                    } else {
                        asset.filename = newName;
                        if (asset.filepath) {
                            asset.filepath = String(asset.filepath).replace(/[^\\/]+$/, newName);
                        }
                        if (asset.path) {
                            asset.path = String(asset.path).replace(/[^\\/]+$/, newName);
                        }
                        if (asset.file_info && typeof asset.file_info === "object") {
                            asset.file_info.filename = newName;
                            if (asset.file_info.filepath) {
                                asset.file_info.filepath = String(asset.file_info.filepath).replace(
                                    /[^\\/]+$/,
                                    newName,
                                );
                            }
                            if (asset.file_info.path) {
                                asset.file_info.path = String(asset.file_info.path).replace(
                                    /[^\\/]+$/,
                                    newName,
                                );
                            }
                        }
                        syncRenderedCardAsset(asset, {
                            filename: asset.filename,
                            filepath: asset.filepath,
                            path: asset.path,
                            file_info: asset.file_info,
                        });
                    }

                    const rendered = findRenderedCard(asset.id);
                    const filenameEl = rendered?.querySelector?.(".mjr-filename");
                    if (filenameEl) filenameEl.textContent = asset.filename || newName;

                    comfyToast(t("toast.fileRenamedSuccess"), "success");
                    triggerBrowserGridReload(gridContainer);
                } catch (error) {
                    comfyToast(
                        t("toast.errorRenaming", "Error renaming file: {error}", {
                            error: error?.message || String(error || ""),
                        }),
                        "error",
                    );
                }
            },
            { disabled: !(asset?.id || getAssetFilepath(asset)) },
        ),
    );

    if (isMultiSelected) {
        items.push(
            createItem(
                `Delete ${effectiveSelectionCount} files...`,
                "pi pi-trash",
                getShortcutDisplay("DELETE"),
                async () => {
                    const ok = await confirmDeletion(Number(effectiveSelectionCount) || 0);
                    if (!ok) return;

                    try {
                        let successCount = 0;
                        let errorCount = 0;
                        const deletedIds = [];
                        let deletedByFilepath = 0;
                        const selectionList = selectedAssetsNow.length
                            ? selectedAssetsNow
                            : [asset];

                        for (const selectedAsset of selectionList) {
                            const result = await deleteAsset(selectedAsset);
                            if (result?.ok) {
                                successCount += 1;
                                if (selectedAsset?.id != null) {
                                    deletedIds.push(String(selectedAsset.id));
                                } else {
                                    deletedByFilepath += 1;
                                }
                            } else {
                                errorCount += 1;
                            }
                        }

                        if (deletedIds.length) {
                            const removal = removeAssetsFromGrid(gridContainer, deletedIds);
                            if (panelState && Array.isArray(removal?.selectedIds)) {
                                panelState.selectedAssetIds = removal.selectedIds;
                                panelState.activeAssetId = removal.selectedIds[0] || "";
                            }
                        }
                        if (deletedByFilepath > 0) {
                            triggerBrowserGridReload(gridContainer);
                        }

                        if (errorCount === 0) {
                            comfyToast(
                                t("toast.filesDeletedSuccessN", "{n} files deleted successfully!", {
                                    n: successCount,
                                }),
                                "success",
                            );
                        } else {
                            comfyToast(
                                t(
                                    "toast.filesDeletedPartial",
                                    "{success} files deleted, {failed} failed.",
                                    { success: successCount, failed: errorCount },
                                ),
                                "warning",
                            );
                        }
                    } catch (error) {
                        comfyToast(
                            t("toast.errorDeleting", "Error deleting file: {error}", {
                                error: error?.message || String(error || ""),
                            }),
                            "error",
                        );
                    }
                },
            ),
        );
    } else {
        items.push(
            createItem(
                t("ctx.delete", "Delete"),
                "pi pi-trash",
                getShortcutDisplay("DELETE"),
                async () => {
                    const ok = await confirmDeletion(1, asset?.filename);
                    if (!ok) return;
                    try {
                        const result = await deleteAsset(asset);
                        if (!result?.ok) {
                            comfyToast(result?.error || t("toast.fileDeleteFailed"), "error");
                            return;
                        }

                        if (asset?.id) {
                            const removal = removeAssetsFromGrid(gridContainer, [String(asset.id)]);
                            if (panelState && Array.isArray(removal?.selectedIds)) {
                                panelState.selectedAssetIds = removal.selectedIds;
                                panelState.activeAssetId = removal.selectedIds[0] || "";
                            }
                        } else {
                            triggerBrowserGridReload(gridContainer);
                        }
                        comfyToast(t("toast.fileDeletedSuccess"), "success");
                    } catch (error) {
                        comfyToast(
                            t("toast.errorDeleting", "Error deleting file: {error}", {
                                error: error?.message || String(error || ""),
                            }),
                            "error",
                        );
                    }
                },
                { disabled: !(asset?.id || getAssetFilepath(asset)) },
            ),
        );
    }

    return items;
}

export function showTagsPopover(x, y, asset, onChanged) {
    if (!asset) return;
    openGridTagsPopover({
        x,
        y,
        asset,
        onChanged,
    });
}

export function bindGridContextMenu({ gridContainer, getState = () => ({}) } = {}) {
    if (!gridContainer) return;
    if (
        gridContainer._mjrGridContextMenuBound &&
        typeof gridContainer._mjrGridContextMenuUnbind === "function"
    ) {
        return gridContainer._mjrGridContextMenuUnbind;
    }

    const handler = async (event) => {
        const panelState = (() => {
            try {
                return getState?.() || {};
            } catch {
                return {};
            }
        })();
        const card = safeClosest(event.target, ".mjr-asset-card");

        if (!card) {
            if (!_isBrowserScope(panelState)) return;
            const currentPath = String(gridContainer?.dataset?.mjrSubfolder || "").trim();
            if (!currentPath) return;

            event.preventDefault();
            event.stopPropagation();
            openGridContextMenu({
                x: event.clientX,
                y: event.clientY,
                items: _buildEmptyGridItems({ currentPath, gridContainer }),
            });
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        const asset = card._mjrAsset;
        if (!asset) return;

        const selection = _getSelectionSnapshot(gridContainer);

        const items = _isFolderAsset(asset)
            ? _buildFolderItems({ asset, gridContainer, panelState })
            : _buildAssetItems({
                  asset,
                  card,
                  gridContainer,
                  panelState,
                  pointerX: event.clientX,
                  pointerY: event.clientY,
                  selection,
              });

        openGridContextMenu({
            x: event.clientX,
            y: event.clientY,
            items,
        });
    };

    try {
        gridContainer.addEventListener("contextmenu", handler);
    } catch (err) {
        console.error("[GridContextMenu] Failed to bind:", err);
    }

    gridContainer._mjrGridContextMenuBound = true;
    const unbind = () => {
        try {
            gridContainer.removeEventListener("contextmenu", handler);
        } catch (e) {
            console.debug?.(e);
        }
        try {
            gridContainer._mjrGridContextMenuBound = false;
        } catch (e) {
            console.debug?.(e);
        }
        try {
            gridContainer._mjrGridContextMenuUnbind = null;
        } catch (e) {
            console.debug?.(e);
        }
        try {
            cancelAllRatingUpdates();
        } catch (e) {
            console.debug?.(e);
        }
        try {
            closeAllGridContextMenus();
        } catch (e) {
            console.debug?.(e);
        }
    };
    gridContainer._mjrGridContextMenuUnbind = unbind;
    return unbind;
}
