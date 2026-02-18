/**
 * Grid Context Menu - Right-click menu for asset cards
 */

import { buildDownloadURL } from "../../api/endpoints.js";
import { comfyConfirm, comfyPrompt } from "../../app/dialogs.js";
import { comfyToast } from "../../app/toast.js";
import { t } from "../../app/i18n.js";
import { openInFolder, deleteAsset, renameAsset, updateAssetRating, removeFilepathsFromCollection, post, browserFolderOp } from "../../api/client.js";
import { ENDPOINTS } from "../../api/endpoints.js";
import { ASSET_RATING_CHANGED_EVENT, ASSET_TAGS_CHANGED_EVENT } from "../../app/events.js";
import { createTagsEditor } from "../../components/TagsEditor.js";
import { getViewerInstance } from "../../components/Viewer.js";
import { APP_CONFIG } from "../../app/config.js";
import { safeDispatchCustomEvent } from "../../utils/events.js";
import { sanitizeFilename, validateFilename } from "../../utils/filenames.js";
import { reportError } from "../../utils/logging.js";
import { safeClosest } from "../../utils/dom.js";
import { showAddToCollectionMenu } from "../collections/contextmenu/addToCollectionMenu.js";
import { removeAssetsFromGrid } from "../grid/GridView.js";
import { confirmDeletion } from "../../utils/deleteGuard.js";
import { scheduleRatingUpdate, cancelAllRatingUpdates } from "./ratingUpdater.js";
import {
    getOrCreateMenu,
    createMenuItem,
    createMenuSeparator,
    showMenuAt,
    MENU_Z_INDEX,
    safeEscapeSelector,
    setMenuSessionCleanup,
    cleanupMenu,
} from "../../components/contextmenu/MenuCore.js";
import { hideMenu, clearMenu } from "../../components/contextmenu/MenuCore.js";
import { getShortcutDisplay } from "../grid/GridKeyboard.js";
// Bulk operations removed - using local helpers
const getSelectedAssetIds = (gridContainer) => {
    const selected = new Set();
    if (!gridContainer) return selected;
    try {
        // Fix: Use authoritative source (dataset) instead of DOM query which misses off-screen items
        const raw = gridContainer.dataset?.mjrSelectedAssetIds;
        if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) list.forEach(id => selected.add(String(id)));
        } else {
             // Fallback for legacy or if dataset missing
             const cards = gridContainer.querySelectorAll('.mjr-asset-card.is-selected');
             for (const card of cards) {
                 const id = card.dataset?.mjrAssetId;
                 if (id) selected.add(String(id));
             }
        }
    } catch {}
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
                const all = typeof gridContainer?._mjrGetAssets === "function" ? gridContainer._mjrGetAssets() : [];
                const idSet = new Set(ids.map(String));
                for (const a of all || []) {
                    const id = String(a?.id || "");
                    if (id && idSet.has(id)) assets.push(a);
                }
                if (assets.length) return assets;
            }
        }
    } catch {}
    try {
        const cards = gridContainer.querySelectorAll(".mjr-asset-card.is-selected");
        for (const card of cards) {
            const a = card?._mjrAsset;
            if (a) assets.push(a);
        }
    } catch {}
    return assets;
};

const getAssetFilepath = (asset) => {
    try {
        const fp = asset?.filepath || asset?.path || asset?.file_info?.filepath || "";
        return fp ? String(fp) : "";
    } catch {
        return "";
    }
};

const clearSelection = (gridContainer) => {
    if (!gridContainer) return;
    try {
        if (typeof gridContainer?._mjrSetSelection === "function") {
            gridContainer._mjrSetSelection([], "");
            return;
        }
        const cards = gridContainer.querySelectorAll('.mjr-asset-card.is-selected');
        for (const card of cards) {
            card.classList.remove('is-selected');
            card.setAttribute('aria-selected', 'false');
        }
    } catch {}
    try {
        delete gridContainer.dataset.mjrSelectedAssetIds;
        delete gridContainer.dataset.mjrSelectedAssetId;
    } catch {}
    safeDispatchCustomEvent(
        "mjr:selection-changed",
        { selectedIds: [] },
        { target: gridContainer, warnPrefix: "[GridContextMenu]" }
    );
};

const selectCardForDetails = (gridContainer, card, asset, state) => {
    if (!gridContainer) return;
    try {
        clearSelection(gridContainer);
    } catch {}
    if (card) {
        try {
            card.classList.add('is-selected');
            card.setAttribute('aria-selected', 'true');
        } catch {}
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
        } catch {}
    } else {
        try {
            delete gridContainer.dataset.mjrSelectedAssetIds;
        } catch {}
        try {
            delete gridContainer.dataset.mjrSelectedAssetId;
        } catch {}
    }
    if (state && typeof state === 'object') {
        try {
            state.selectedAssetIds = id ? [id] : [];
        } catch {}
        try {
            state.activeAssetId = id;
        } catch {}
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
    } catch {}
    try {
        const cards = gridContainer.querySelectorAll(".mjr-asset-card");
        for (const card of cards) {
            const a = card?._mjrAsset;
            if (a) assets.push(a);
        }
    } catch {}
    return assets;
};

const findIndexById = (assets, assetId) => {
    try {
        const id = String(assetId ?? "");
        return (assets || []).findIndex((a) => String(a?.id ?? "") === id);
    } catch {
        return -1;
    }
};

const MENU_SELECTOR = ".mjr-grid-context-menu";
const POPOVER_SELECTOR = ".mjr-grid-popover";

function createMenu() {
    return getOrCreateMenu({
        selector: MENU_SELECTOR,
        className: "mjr-grid-context-menu",
        minWidth: 220,
        zIndex: MENU_Z_INDEX.MAIN,
        onHide: null,
    });
}

const createItem = createMenuItem;
const separator = createMenuSeparator;
const showAt = showMenuAt;

const triggerBrowserGridReload = (gridContainer) => {
    try {
        gridContainer?.dispatchEvent?.(new CustomEvent("mjr:reload-grid", { bubbles: true }));
    } catch {}
    try {
        window?.dispatchEvent?.(new CustomEvent("mjr:reload-grid"));
    } catch {}
    // Filesystem updates can be slightly delayed on some setups; refresh once more.
    try {
        setTimeout(() => {
            try {
                gridContainer?.dispatchEvent?.(new CustomEvent("mjr:reload-grid", { bubbles: true }));
            } catch {}
        }, 180);
    } catch {}
};

function getOrCreateRatingSubmenu() {
    return getOrCreateMenu({
        selector: ".mjr-grid-rating-submenu",
        className: "mjr-grid-rating-submenu",
        minWidth: 200,
        zIndex: MENU_Z_INDEX.SUBMENU,
        onHide: null,
    });
}

function showSubmenuNextTo(anchorEl, menuEl) {
    if (!anchorEl || !menuEl) return;
    const rect = anchorEl.getBoundingClientRect();
    const x = Math.round(rect.right + 6);
    const y = Math.round(rect.top - 4);
    showAt(menuEl, x, y);
}

function showTagsPopover(x, y, asset, onChanged) {
    try {
        const existing = document.querySelector(POPOVER_SELECTOR);
        try {
            existing?._mjrAbortController?.abort?.();
        } catch {}
        existing?.remove?.();
    } catch {}

    const pop = document.createElement("div");
    pop.className = "mjr-grid-popover";
    pop.style.cssText = `
        position: fixed;
        z-index: ${MENU_Z_INDEX.POPOVER};
        left: ${x}px;
        top: ${y}px;
    `;

    const ac = new AbortController();
    pop._mjrAbortController = ac;

    const editor = createTagsEditor(asset, (tags) => {
        asset.tags = tags;
        safeDispatchCustomEvent(
            ASSET_TAGS_CHANGED_EVENT,
            { assetId: String(asset.id), tags },
            { warnPrefix: "[GridContextMenu]" }
        );
        try {
            onChanged?.();
        } catch {}
    });
    pop.appendChild(editor);
    document.body.appendChild(pop);

    const hide = () => {
        try {
            pop._mjrAbortController?.abort?.();
        } catch {}
        try {
            pop.remove?.();
        } catch {}
    };

    // Dismiss when clicking outside (so clicking inside input doesn't close it).
    try {
        document.addEventListener(
            "mousedown",
            (e) => {
                if (!pop.contains(e.target)) hide();
            },
            { capture: true, signal: ac.signal }
        );
        document.addEventListener(
            "keydown",
            (e) => {
                if (e.key === "Escape") hide();
            },
            { capture: true, signal: ac.signal }
        );
        document.addEventListener("scroll", hide, { capture: true, passive: true, signal: ac.signal });
    } catch {}

    // Clamp into viewport
    const rect = pop.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let fx = x;
    let fy = y;
    if (x + rect.width > vw) fx = vw - rect.width - 10;
    if (y + rect.height > vh) fy = vh - rect.height - 10;
    pop.style.left = `${Math.max(8, fx)}px`;
    pop.style.top = `${Math.max(8, fy)}px`;
}

function setRating(asset, rating, onChanged) {
    const assetId = asset?.id;
    try {
        asset.rating = rating;
    } catch {}
    try {
        onChanged?.();
    } catch {}

    if (assetId) {
        scheduleRatingUpdate(String(assetId), rating, {
            successMessage: rating > 0 ? `Rating set to ${rating} stars` : "Rating cleared",
            errorMessage: "Failed to update rating",
            warnPrefix: "[GridContextMenu]",
            onSuccess: () => {
                safeDispatchCustomEvent(
                    ASSET_RATING_CHANGED_EVENT,
                    { assetId: String(assetId), rating },
                    { warnPrefix: "[GridContextMenu]" }
                );
            },
            onFailure: (error) => {
                reportError(error, "[GridContextMenu] Rating update", { showToast: APP_CONFIG.DEBUG_VERBOSE_ERRORS });
            },
        });
        return;
    }
    updateAssetRating(asset, rating).catch((error) => {
        reportError(error, "[GridContextMenu] Rating update", { showToast: APP_CONFIG.DEBUG_VERBOSE_ERRORS });
    });
}

export function bindGridContextMenu({
    gridContainer,
    getState = () => ({}),
    onRequestOpenViewer = () => {},
} = {}) {
    if (!gridContainer) return;
    if (gridContainer._mjrGridContextMenuBound && typeof gridContainer._mjrGridContextMenuUnbind === "function") {
        return gridContainer._mjrGridContextMenuUnbind;
    }

    const menu = createMenu();

    const handler = async (e) => {
        const panelState = (() => {
            try {
                return getState?.() || {};
            } catch {
                return {};
            }
        })();
        const isBrowserScope = String(panelState?.scope || "").toLowerCase() === "custom";

        // Check if the contextmenu event is on an asset card
        const card = safeClosest(e.target, ".mjr-asset-card");
        if (!card) {
            if (!isBrowserScope) return;
            e.preventDefault();
            e.stopPropagation();
            menu.innerHTML = "";
            const currentPath = String(gridContainer?.dataset?.mjrSubfolder || "").trim();
            if (!currentPath) return;
            menu.appendChild(
                createItem("Create folder here...", "pi pi-plus", null, async () => {
                    try {
                        const name = await comfyPrompt("New folder name", "");
                        const next = String(name || "").trim();
                        if (!next) return;
                        const res = await browserFolderOp({ op: "create", path: currentPath, name: next });
                        if (!res?.ok) {
                            comfyToast(res?.error || "Failed to create folder", "error");
                            return;
                        }
                        triggerBrowserGridReload(gridContainer);
                        comfyToast(t("toast.folderCreated", "Folder created: {name}", { name: next }), "success");
                    } catch (error) {
                        comfyToast(t("toast.createFolderFailedDetail", "Create folder failed: {error}", { error: error?.message || String(error || "") }), "error");
                    }
                })
            );
            showAt(menu, e.clientX, e.clientY);
            return;
        }
        
        e.preventDefault();
        e.stopPropagation();

        const asset = card._mjrAsset;
        if (!asset) return;
        const isFolder = String(asset?.kind || "").toLowerCase() === "folder";

        menu.innerHTML = "";

        // Get current selection state
        let selectedIds = getSelectedAssetIds(gridContainer);
        
        // Implicit selection: if Right-Click on unselected item, select it exclusively.
        const cardSelected = !!card?.classList?.contains?.("is-selected");
        if (asset && !cardSelected) {
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
            } catch {}
            try {
                safeDispatchCustomEvent("mjr:selection-changed", {
                    selectedIds: newSelection,
                    selectedAssets: [asset],
                    activeId: nextId
                }, { target: gridContainer, warnPrefix: "[GridContextMenu]" });
            } catch {}
            selectedIds = new Set(newSelection);
            try {
                gridContainer.querySelectorAll('.mjr-asset-card.is-selected').forEach(el => {
                    el.classList.remove('is-selected');
                    el.setAttribute?.('aria-selected', 'false');
                });
                if (card) {
                    card.classList.add('is-selected');
                    card.setAttribute('aria-selected', 'true');
                }
            } catch {}
        }
        const selectedAssetsNow = getSelectedAssets(gridContainer);
        const effectiveSelectionCount = selectedAssetsNow.length || selectedIds.size;
        const isMultiSelected = effectiveSelectionCount > 1;
        const hasSelection = effectiveSelectionCount > 0;

        if (isFolder) {
            const isBrowserScope = String(panelState?.scope || "").toLowerCase() === "custom";
            const folderPath = String(asset?.filepath || "").trim();
            menu.appendChild(
                createItem("Open folder", "pi pi-folder-open", null, () => {
                    try {
                        gridContainer.dispatchEvent(
                            new CustomEvent("mjr:open-folder-asset", {
                                bubbles: true,
                                detail: { asset },
                            })
                        );
                    } catch {}
                })
            );

            menu.appendChild(
                createItem(t("ctx.pinAsBrowserRoot"), "pi pi-bookmark", null, async () => {
                    if (!folderPath) {
                        comfyToast(t("toast.unableResolveFolderPath"), "error");
                        return;
                    }
                    const label = await comfyPrompt(
                        t("dialog.browserRootLabelOptional"),
                        String(asset?.filename || "")
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
                            })
                        );
                    } catch {}
                })
            );

            if (isBrowserScope && folderPath) {
                menu.appendChild(separator());
                menu.appendChild(
                    createItem(t("ctx.createFolderHere"), "pi pi-plus", null, async () => {
                        try {
                            const name = await comfyPrompt(t("dialog.newFolderName"), "");
                            const next = String(name || "").trim();
                            if (!next) return;
                            const res = await browserFolderOp({ op: "create", path: folderPath, name: next });
                            if (!res?.ok) {
                                comfyToast(res?.error || t("toast.createFolderFailed"), "error");
                                return;
                            }
                            triggerBrowserGridReload(gridContainer);
                            comfyToast(t("toast.folderCreated", { name: next }), "success");
                        } catch (error) {
                            comfyToast(t("toast.createFolderFailedDetail", { error: error?.message || String(error || "") }), "error");
                        }
                    })
                );
                menu.appendChild(
                    createItem(t("ctx.renameFolder"), "pi pi-pencil", null, async () => {
                        try {
                            const current = String(asset?.filename || "").trim();
                            const name = await comfyPrompt(t("dialog.renameFolder"), current);
                            const next = String(name || "").trim();
                            if (!next || next === current) return;
                            const res = await browserFolderOp({ op: "rename", path: folderPath, name: next });
                            if (!res?.ok) {
                                comfyToast(res?.error || t("toast.renameFolderFailed"), "error");
                                return;
                            }
                            triggerBrowserGridReload(gridContainer);
                            comfyToast(t("toast.folderRenamed"), "success");
                        } catch (error) {
                            comfyToast(t("toast.renameFolderFailedDetail", { error: error?.message || String(error || "") }), "error");
                        }
                    })
                );
                menu.appendChild(
                    createItem(t("ctx.moveFolder"), "pi pi-arrow-right", null, async () => {
                        try {
                            const destination = await comfyPrompt(t("dialog.destinationDirectoryPath"), "");
                            const dest = String(destination || "").trim();
                            if (!dest) return;
                            const res = await browserFolderOp({ op: "move", path: folderPath, destination: dest });
                            if (!res?.ok) {
                                comfyToast(res?.error || t("toast.moveFolderFailed"), "error");
                                return;
                            }
                            triggerBrowserGridReload(gridContainer);
                            comfyToast(t("toast.folderMoved"), "success");
                        } catch (error) {
                            comfyToast(t("toast.moveFolderFailedDetail", { error: error?.message || String(error || "") }), "error");
                        }
                    })
                );
                menu.appendChild(
                    createItem(t("ctx.deleteFolder"), "pi pi-trash", null, async () => {
                        try {
                            const folderName = String(asset?.filename || "this folder");
                            const ok = await comfyConfirm(
                                t("dialog.deleteFolderRecursive", { name: folderName })
                            );
                            if (!ok) return;
                            const res = await browserFolderOp({ op: "delete", path: folderPath, recursive: true });
                            if (!res?.ok) {
                                comfyToast(res?.error || t("toast.deleteFolderFailed"), "error");
                                return;
                            }
                            triggerBrowserGridReload(gridContainer);
                            comfyToast(t("toast.folderDeleted"), "success");
                        } catch (error) {
                            comfyToast(t("toast.deleteFolderFailedDetail", { error: error?.message || String(error || "") }), "error");
                        }
                    })
                );
            }

            showAt(menu, e.clientX, e.clientY);
            return;
        }

        // Open Viewer
        menu.appendChild(
            createItem("Open Viewer", "pi pi-image", getShortcutDisplay("OPEN_VIEWER"), () => {
                // For a small selection set, open the selection (useful for quick compare).
                // Otherwise open the whole grid so navigation works.
                try {
                    const viewer = getViewerInstance();
                    const selectedAssets = hasSelection ? getSelectedAssets(gridContainer) : [];
                    const mediaSelectedAssets = selectedAssets.filter((a) => String(a?.kind || "").toLowerCase() !== "folder");
                    const selectedCount = mediaSelectedAssets.length;
                    if (selectedCount >= 2 && selectedCount <= 4) {
                        viewer.open(mediaSelectedAssets, 0);
                        return;
                    }

                    const allAssets = getAllAssetsInGrid(gridContainer).filter((a) => String(a?.kind || "").toLowerCase() !== "folder");
                    const idx = findIndexById(allAssets, asset?.id);
                    if (!allAssets.length || idx < 0) return;
                    viewer.open(allAssets, Math.max(0, idx));
                } catch {
                    // Fallback to the caller hook (legacy/optional).
                    try {
                        onRequestOpenViewer(asset);
                    } catch {}
                }
            })
        );

        menu.appendChild(
            createItem(t("ctx.showMetadataPanel", "Show metadata panel"), "pi pi-info-circle", getShortcutDisplay("METADATA_PANEL"), () => {
                try {
                    hideMenu(menu);
                } catch {}
                try {
                    selectCardForDetails(gridContainer, card, asset, panelState);
                } catch {}
                try {
                    const toggleDetails = gridContainer?._mjrOpenDetails;
                    if (typeof toggleDetails === "function") {
                        toggleDetails();
                    }
                } catch {}
            })
        );

        // Compare options (selection-only)
        const selectedAssets = hasSelection ? selectedAssetsNow : [];
        const mediaSelectedAssets = selectedAssets.filter((a) => String(a?.kind || "").toLowerCase() !== "folder");
        const selectedCount = mediaSelectedAssets.length;
        if (selectedCount === 2) {
            menu.appendChild(
                createItem("Compare A/B (2 selected)", "pi pi-clone", getShortcutDisplay("COMPARE_AB"), () => {
                    try {
                        const viewer = getViewerInstance();
                        viewer.open(mediaSelectedAssets, 0);
                        viewer.setMode?.("ab");
                    } catch {}
                })
            );
        }
        if (selectedCount >= 2 && selectedCount <= 4) {
            menu.appendChild(
                createItem(`Side-by-side (2x2) (${selectedCount} selected)`, "pi pi-table", getShortcutDisplay("SIDE_BY_SIDE"), () => {
                    try {
                        const viewer = getViewerInstance();
                        viewer.open(mediaSelectedAssets, 0);
                        viewer.setMode?.("sidebyside");
                    } catch {}
                })
            );
        }

        // Open in Folder
        menu.appendChild(
            createItem(t("ctx.openInFolder", "Open in folder"), "pi pi-folder-open", getShortcutDisplay("OPEN_IN_FOLDER"), async () => {
                const res = await openInFolder(asset);
                if (!res?.ok) {
                    comfyToast(res?.error || t("toast.openFolderFailed"), "error");
                } else {
                    comfyToast(t("toast.openedInFolder"), "info", 2000);
                }
            }, { disabled: !(asset?.id || getAssetFilepath(asset)) })
        );

        // Copy file path
        menu.appendChild(
            createItem(t("ctx.copyPath", "Copy path"), "pi pi-copy", getShortcutDisplay("COPY_PATH"), async () => {
                const p = asset?.filepath ? String(asset.filepath) : "";
                if (!p) {
                    comfyToast(t("toast.noFilePath"), "error");
                    return;
                }
                try {
                    await navigator.clipboard.writeText(p);
                    comfyToast(t("toast.pathCopied"), "success", 2000);
                } catch (err) {
                    console.warn(t("log.clipboardCopyFailed", "Clipboard copy failed"), err);
                    comfyToast(t("toast.pathCopyFailed"), "error");
                }
            })
        );

        // Download
        menu.appendChild(
            createItem(t("ctx.download", "Download"), "pi pi-download", getShortcutDisplay("DOWNLOAD"), () => {
                if (!asset || !asset.filepath) {
                    console.error("No filepath for asset", asset);
                    return;
                }

                const url = buildDownloadURL(asset.filepath);
                const filename = asset.filename || "download";

                // Trigger download invisibly
                const link = document.createElement("a");
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                comfyToast(t("toast.downloadingFile", "Downloading {filename}...", { filename }), "info", 3000);
            }, { disabled: !asset?.filepath })
        );

        // Add to collection (single or multi)
        menu.appendChild(
                createItem("Add to collection...", "pi pi-bookmark", getShortcutDisplay("ADD_TO_COLLECTION"), async () => {
                    try {
                        hideMenu(menu);
                    } catch {}
                    const selectedAssets = getSelectedAssets(gridContainer);
                    const list = selectedAssets.length ? selectedAssets : [asset];
                    await showAddToCollectionMenu({ x: e.clientX, y: e.clientY, assets: list });
                })
        );

        // Remove from current collection (only when in collection view)
        const collectionId = String(panelState?.collectionId || "").trim();
        if (collectionId) {
            const selectedAssets = getSelectedAssets(gridContainer);
            const list = selectedAssets.length ? selectedAssets : [asset];
            const filepaths = list.map(getAssetFilepath).filter(Boolean);
            const label = filepaths.length > 1 ? `Remove from collection (${filepaths.length})` : "Remove from collection";
            menu.appendChild(
                createItem(label, "pi pi-bookmark", null, async () => {
                    try {
                        hideMenu(menu);
                    } catch {}
                    if (!filepaths.length) {
                        comfyToast(t("toast.noFilePath"), "error");
                        return;
                    }
                    
                    // Confirmation removed as per user request
                    const res = await removeFilepathsFromCollection(collectionId, filepaths);
                    if (!res?.ok) {
                        comfyToast(res?.error || t("toast.removeFromCollectionFailed"), "error");
                        return;
                    }

                    // Refresh the collection view (best effort).
                    try {
                        gridContainer?.dispatchEvent?.(new CustomEvent("mjr:reload-grid"));
                    } catch {}
                })
            );
        }

        menu.appendChild(separator());

        // Edit Tags
        menu.appendChild(createItem(t("ctx.editTags", "Edit tags"), "pi pi-tags", getShortcutDisplay("EDIT_TAGS"), () => {
            try {
                hideMenu(menu);
            } catch {}
            showTagsPopover(e.clientX + 6, e.clientY + 6, asset, () => {
                // Update card UI after tags change
                const card = document.querySelector(`[data-mjr-asset-id="${safeEscapeSelector(asset.id)}"]`);
                if (card && card._mjrAsset) {
                    card._mjrAsset.tags = [...asset.tags];
                }
            });
        }));

        // Rating submenu (hover)
        menu.appendChild(separator());
        const canRate = !!(asset?.id || getAssetFilepath(asset));
        const ratingRoot = createItem(t("ctx.setRating", "Set rating"), "pi pi-star", "1-5 ›", () => {}, { disabled: !canRate });
        ratingRoot.style.cursor = !canRate ? "default" : "pointer";
        menu.appendChild(ratingRoot);

        let hideTimer = null;
        const ratingSubmenu = getOrCreateRatingSubmenu();
        ratingRoot.dataset.mjrHasSubmenu = "true";
        ratingRoot._mjrSubmenuTarget = ratingSubmenu;
        // Prevent listener buildup across repeated opens (submenu is reused).
        try {
            ratingSubmenu._mjrAbortController?.abort?.();
        } catch {}
        try {
            ratingRoot._mjrAbortController?.abort?.();
        } catch {}
        const ratingAC = new AbortController();
        ratingSubmenu._mjrAbortController = ratingAC;
        ratingRoot._mjrAbortController = ratingAC;

        const closeRatingSubmenu = () => {
            try {
                hideMenu(ratingSubmenu);
                clearMenu(ratingSubmenu);
            } catch {}
        };

        const scheduleClose = () => {
            if (hideTimer) clearTimeout(hideTimer);
            hideTimer = setTimeout(closeRatingSubmenu, 350);
        };

        const cancelClose = () => {
            if (hideTimer) clearTimeout(hideTimer);
            hideTimer = null;
        };

        // Clear timers + submenu listeners when the main menu closes.
        try {
            setMenuSessionCleanup(menu, () => {
                try {
                    if (hideTimer) clearTimeout(hideTimer);
                } catch {}
                hideTimer = null;
                try {
                    ratingSubmenu?._mjrAbortController?.abort?.();
                } catch {}
                try {
                    closeRatingSubmenu();
                } catch {}
            });
        } catch {}

        const renderRatingSubmenu = () => {
            clearMenu(ratingSubmenu);
            const stars = (n) => "★".repeat(n) + "☆".repeat(Math.max(0, 5 - n));
            for (const n of [5, 4, 3, 2, 1]) {
                ratingSubmenu.appendChild(
                    createItem(stars(n), "pi pi-star", null, async () => {
                        setRating(asset, n, () => {
                            const card = document.querySelector(
                                `[data-mjr-asset-id="${safeEscapeSelector(asset.id)}"]`
                            );
                            if (card && card._mjrAsset) card._mjrAsset.rating = n;
                        });
                        closeRatingSubmenu();
                        try {
                            hideMenu(menu);
                        } catch {}
                    }, { disabled: !canRate })
                );
            }
            ratingSubmenu.appendChild(separator());
            ratingSubmenu.appendChild(
                createItem(t("ctx.resetRating", "Reset rating"), "pi pi-star", "0", async () => {
                    setRating(asset, 0, () => {
                        const card = document.querySelector(
                            `[data-mjr-asset-id="${safeEscapeSelector(asset.id)}"]`
                        );
                        if (card && card._mjrAsset) card._mjrAsset.rating = 0;
                    });
                    closeRatingSubmenu();
                    try {
                        hideMenu(menu);
                    } catch {}
                }, { disabled: !canRate })
            );
        };

        ratingRoot.addEventListener(
            "mouseenter",
            () => {
            if (!canRate) return;
            cancelClose();
            renderRatingSubmenu();
            showSubmenuNextTo(ratingRoot, ratingSubmenu);
            },
            { signal: ratingAC.signal }
        );
        ratingRoot.addEventListener(
            "mouseleave",
            () => {
            scheduleClose();
            },
            { signal: ratingAC.signal }
        );
        ratingSubmenu.addEventListener("mouseenter", () => cancelClose(), { signal: ratingAC.signal });
        ratingSubmenu.addEventListener("mouseleave", () => scheduleClose(), { signal: ratingAC.signal });

        menu.appendChild(separator());

        // Rename (single only)
        menu.appendChild(
            createItem("Rename…", "pi pi-pencil", getShortcutDisplay("RENAME"), async () => {
                if (!(asset?.id || getAssetFilepath(asset))) return;
                
                const currentName = asset.filename || "";
                const rawInput = await comfyPrompt(t("dialog.rename.title", "Rename file"), currentName);
                const newName = sanitizeFilename(rawInput);
                if (!newName || newName === currentName) return;
                const validation = validateFilename(newName);
                if (!validation.valid) {
                    comfyToast(validation.reason, "error");
                    return;
                }
                
                try {
                    const result = await renameAsset(asset, newName);
                    if (result?.ok) {
                        // Update the asset object and card UI
                        asset.filename = newName;
                        asset.filepath = asset.filepath.replace(/[^\\/]+$/, newName);
                        
                        // Update card UI
                        const card = document.querySelector(`[data-mjr-asset-id="${safeEscapeSelector(asset.id)}"]`);
                        if (card) {
                            // Update card display
                            const filenameEl = card.querySelector('.mjr-filename');
                            if (filenameEl) {
                                filenameEl.textContent = newName;
                            }
                        }
                        
                        comfyToast(t("toast.fileRenamedSuccess"), "success");
                    } else {
                        comfyToast(result?.error || t("toast.fileRenameFailed"), "error");
                    }
                } catch (error) {
                    comfyToast(t("toast.errorRenaming", "Error renaming file: {error}", { error: error?.message || String(error || "") }), "error");
                }
            }, { disabled: !(asset?.id || getAssetFilepath(asset)) })
        );

        // Delete (single or multi)
        if (isMultiSelected) {
            menu.appendChild(
                createItem(`Delete ${effectiveSelectionCount} files...`, "pi pi-trash", getShortcutDisplay("DELETE"), async () => {
                    const ok = await confirmDeletion(Number(effectiveSelectionCount) || 0);
                    if (!ok) return;
                    try {
                        // Delete each asset individually
                        let successCount = 0;
                        let errorCount = 0;
                        const deletedIds = [];
                        let deletedByFilepath = 0;
                        const selectionList = selectedAssetsNow.length ? selectedAssetsNow : [asset];

                        for (const selectedAsset of selectionList) {
                            const result = await deleteAsset(selectedAsset);
                            if (result?.ok) {
                                successCount++;
                                if (selectedAsset?.id != null) {
                                    deletedIds.push(String(selectedAsset.id));
                                } else {
                                    deletedByFilepath++;
                                }
                            } else {
                                errorCount++;
                            }
                        }

                        if (deletedIds.length) {
                            const removal = removeAssetsFromGrid(gridContainer, deletedIds);
                            try {
                                if (panelState && Array.isArray(removal?.selectedIds)) {
                                    panelState.selectedAssetIds = removal.selectedIds;
                                    panelState.activeAssetId = removal.selectedAssetIds[0] || "";
                                }
                            } catch {}
                        }
                        if (deletedByFilepath > 0) {
                            try {
                                gridContainer?.dispatchEvent?.(new CustomEvent("mjr:reload-grid"));
                            } catch {}
                        }

                        if (errorCount === 0) {
                            comfyToast(t("toast.filesDeletedSuccessN", "{n} files deleted successfully!", { n: successCount }), "success");
                        } else {
                            comfyToast(t("toast.filesDeletedPartial", "{success} files deleted, {failed} failed.", { success: successCount, failed: errorCount }), "warning");
                        }
                    } catch (error) {
                        comfyToast(t("toast.errorDeleting", "Error deleting file: {error}", { error: error?.message || String(error || "") }), "error");
                    }
                })
            );
        } else {
            menu.appendChild(
                createItem(t("ctx.delete", "Delete"), "pi pi-trash", getShortcutDisplay("DELETE"), async () => {
                    const ok = await confirmDeletion(1, asset?.filename);
                    if (!ok) return;
                    try {
                        const result = await deleteAsset(asset);
                        if (result?.ok) {
                            if (asset?.id) {
                                const removal = removeAssetsFromGrid(gridContainer, [String(asset.id)]);
                                try {
                                    if (panelState && Array.isArray(removal?.selectedIds)) {
                                        panelState.selectedAssetIds = removal.selectedIds;
                                        panelState.activeAssetId = removal.selectedAssetIds[0] || "";
                                    }
                                } catch {}
                            } else {
                                try {
                                    gridContainer?.dispatchEvent?.(new CustomEvent("mjr:reload-grid"));
                                } catch {}
                            }
                            comfyToast(t("toast.fileDeletedSuccess"), "success");
                        } else {
                            comfyToast(result?.error || t("toast.fileDeleteFailed"), "error");
                        }
                    } catch (error) {
                        comfyToast(t("toast.errorDeleting", "Error deleting file: {error}", { error: error?.message || String(error || "") }), "error");
                    }
                }, { disabled: !(asset?.id || getAssetFilepath(asset)) })
            );
        }

        // Bulk operations menu removed

        showAt(menu, e.clientX, e.clientY);
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
        } catch {}
        try {
            gridContainer._mjrGridContextMenuBound = false;
        } catch {}
        try {
            cancelAllRatingUpdates();
        } catch {}
        try {
            gridContainer._mjrGridContextMenuUnbind = null;
        } catch {}
        try {
            cleanupMenu(menu);
        } catch {}
    };
    gridContainer._mjrGridContextMenuUnbind = unbind;
    return unbind;
}


