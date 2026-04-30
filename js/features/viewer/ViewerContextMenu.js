import { buildAssetViewURL, buildDownloadURL } from "../../api/endpoints.js";
import { comfyPrompt } from "../../app/dialogs.js";
import { comfyToast } from "../../app/toast.js";
import { t } from "../../app/i18n.js";
import {
    openInFolder,
    deleteAsset,
    renameAsset,
    updateAssetRating,
    getViewerInfo,
} from "../../api/client.js";
import {
    ASSET_RATING_CHANGED_EVENT,
    ASSET_TAGS_CHANGED_EVENT,
    VIEWER_INFO_REFRESHED_EVENT,
} from "../../app/events.js";
import { safeDispatchCustomEvent } from "../../utils/events.js";
import { showAddToCollectionMenu } from "../collections/contextmenu/addToCollectionMenu.js";
import { confirmDeletion } from "../../utils/deleteGuard.js";
import { normalizeRenameFilename, validateFilename } from "../../utils/filenames.js";
import { reportError } from "../../utils/logging.js";
import { scheduleRatingUpdate, cancelAllRatingUpdates } from "../contextmenu/ratingUpdater.js";
import {
    closeAllViewerContextMenus,
    openViewerContextMenu,
    openViewerTagsPopover,
} from "../contextmenu/viewerContextMenuState.js";

/**
 * Viewer-specific shortcut displays
 * These match the shortcuts defined in keyboard.js for the viewer
 */
const VIEWER_SHORTCUTS = {
    COPY_PATH: "Ctrl+Shift+C",
    DOWNLOAD: "Ctrl+S",
    OPEN_IN_FOLDER: "Ctrl+Shift+E",
    ADD_TO_COLLECTION: "B",
    EDIT_TAGS: "T",
    RATING_SUBMENU: "1-5",
    RENAME: "F2",
    DELETE: "Del",
};

const SIZE_UNITS = ["B", "KB", "MB", "GB", "TB"];
const viewerContextMenuBindings = new WeakMap();

let _nextMenuItemId = 1;

function _menuItemId(prefix = "viewer-menu-item") {
    return `${prefix}-${_nextMenuItemId++}`;
}

function createItem(label, iconClass, rightHint, action, options = {}) {
    return {
        id: _menuItemId(),
        type: "item",
        label: String(label || ""),
        iconClass: iconClass ? String(iconClass) : "",
        rightHint: rightHint ? String(rightHint) : "",
        action: typeof action === "function" ? action : null,
        disabled: Boolean(options.disabled),
        closeOnSelect: options.closeOnSelect !== false,
        submenu: Array.isArray(options.submenu) ? options.submenu.filter(Boolean) : null,
    };
}

function createSeparator() {
    return {
        id: _menuItemId("viewer-menu-separator"),
        type: "separator",
    };
}

function _isSafeUrl(url) {
    const value = String(url || "").trim();
    if (!value) return false;
    if (value.startsWith("/")) return true;
    try {
        const parsed = new URL(value);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        return false;
    }
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
            warnPrefix: "[ViewerContextMenu]",
            onSuccess: () => {
                safeDispatchCustomEvent(
                    ASSET_RATING_CHANGED_EVENT,
                    { assetId: String(assetId), rating },
                    { warnPrefix: "[ViewerContextMenu]" },
                );
            },
            onFailure: (error) => {
                reportError(error, "[ViewerContextMenu] Rating update", { showToast: true });
            },
        });
        return;
    }

    updateAssetRating(asset, rating).catch((error) => {
        reportError(error, "[ViewerContextMenu] Rating update", { showToast: true });
    });
}

function formatReadableSize(value) {
    let bytes = Number(value);
    if (!Number.isFinite(bytes) || bytes < 0) return "";
    let unitIndex = 0;
    while (bytes >= 1024 && unitIndex < SIZE_UNITS.length - 1) {
        bytes /= 1024;
        unitIndex += 1;
    }
    const formatted = unitIndex === 0 ? `${Math.round(bytes)}` : bytes.toFixed(2);
    return `${formatted} ${SIZE_UNITS[unitIndex]}`;
}

function createRatingSubmenu(asset, onAssetChanged, canRate) {
    const items = [5, 4, 3, 2, 1].map((rating) =>
        createItem(
            `${rating} Stars`,
            "pi pi-star",
            null,
            async () => {
                setRating(asset, rating, onAssetChanged);
            },
            { disabled: !canRate },
        ),
    );
    items.push(createSeparator());
    items.push(
        createItem(
            t("ctx.resetRating", "Reset rating"),
            "pi pi-star",
            "0",
            async () => {
                setRating(asset, 0, onAssetChanged);
            },
            { disabled: !canRate },
        ),
    );
    return items;
}

function createViewerMenuItems({ asset, event, getCurrentViewUrl, onAssetChanged }) {
    const viewUrl =
        typeof getCurrentViewUrl === "function"
            ? getCurrentViewUrl(asset)
            : buildAssetViewURL(asset);
    const canRate = !!(asset?.id || asset?.filepath);

    const items = [
        createItem(
            t("ctx.openInNewTab", "Open in New Tab"),
            "pi pi-external-link",
            null,
            async () => {
                if (!_isSafeUrl(viewUrl)) return;
                window.open(viewUrl, "_blank", "noopener,noreferrer");
            },
        ),
        createItem(
            t("ctx.copyPath", "Copy path"),
            "pi pi-copy",
            VIEWER_SHORTCUTS.COPY_PATH,
            async () => {
                const path = asset?.filepath ? String(asset.filepath) : "";
                if (!path) {
                    comfyToast(t("toast.noFilePath"), "error");
                    return;
                }
                try {
                    await navigator.clipboard.writeText(path);
                    comfyToast(t("toast.pathCopied"), "success", 2000);
                } catch (error) {
                    console.error("[ViewerContextMenu] Copy failed:", error);
                    comfyToast(t("toast.pathCopyFailed"), "error");
                }
            },
        ),
        createItem(
            t("ctx.downloadOriginal", "Download Original"),
            "pi pi-download",
            VIEWER_SHORTCUTS.DOWNLOAD,
            async () => {
                if (!asset || !asset.filepath) return;
                const url = buildDownloadURL(asset.filepath);
                const link = document.createElement("a");
                link.href = url;
                link.download = asset.filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                comfyToast(
                    t("toast.downloadingFile", "Downloading {filename}...", {
                        filename: asset.filename,
                    }),
                    "info",
                    3000,
                );
            },
            { disabled: !asset?.filepath },
        ),
        createItem(
            t("ctx.openInFolder", "Open in folder"),
            "pi pi-folder-open",
            VIEWER_SHORTCUTS.OPEN_IN_FOLDER,
            async () => {
                const res = await openInFolder(asset);
                if (!res?.ok) {
                    comfyToast(res?.error || t("toast.openFolderFailed"), "error");
                } else {
                    comfyToast(t("toast.openedInFolder"), "info", 2000);
                }
            },
            { disabled: !(asset?.id || asset?.filepath) },
        ),
        createItem(
            t("ctx.addToCollection", "Add to collection"),
            "pi pi-bookmark",
            VIEWER_SHORTCUTS.ADD_TO_COLLECTION,
            async () => {
                try {
                    await showAddToCollectionMenu({
                        x: event?.clientX,
                        y: event?.clientY,
                        assets: [asset],
                    });
                } catch (error) {
                    console.error("[ViewerContextMenu] Add to collection failed:", error);
                }
            },
        ),
        createSeparator(),
        createItem(
            t("ctx.editTags", "Edit tags"),
            "pi pi-tags",
            VIEWER_SHORTCUTS.EDIT_TAGS,
            async () => {
                openViewerTagsPopover({
                    x: (Number(event?.clientX) || 0) + 6,
                    y: (Number(event?.clientY) || 0) + 6,
                    asset,
                    onChanged: (tags) => {
                        asset.tags = tags;
                        safeDispatchCustomEvent(
                            ASSET_TAGS_CHANGED_EVENT,
                            { assetId: String(asset.id), tags },
                            { warnPrefix: "[ViewerContextMenu]" },
                        );
                        try {
                            onAssetChanged?.();
                        } catch (e) {
                            console.debug?.(e);
                        }
                    },
                });
            },
            { closeOnSelect: false },
        ),
        createSeparator(),
        createItem(
            t("ctx.setRating", "Set rating"),
            "pi pi-star",
            `${VIEWER_SHORTCUTS.RATING_SUBMENU} >`,
            null,
            {
                disabled: !canRate,
                closeOnSelect: false,
                submenu: createRatingSubmenu(asset, onAssetChanged, canRate),
            },
        ),
        createItem(
            t("ctx.refreshMetadata", "Refresh metadata"),
            "pi pi-sync",
            "R",
            async () => {
                if (!asset?.id) return;
                try {
                    const res = await getViewerInfo(asset.id, { refresh: true });
                    if (!res?.ok || !res?.data) {
                        comfyToast(
                            res?.error ||
                                t("toast.metadataRefreshFailed", "Failed to refresh metadata."),
                            "error",
                        );
                        return;
                    }
                    const info = res.data;
                    try {
                        safeDispatchCustomEvent(
                            VIEWER_INFO_REFRESHED_EVENT,
                            { assetId: String(asset.id), info },
                            { warnPrefix: "[ViewerContextMenu]" },
                        );
                    } catch (e) {
                        console.debug?.(e);
                    }
                    const parts = [];
                    const sizeLabel = formatReadableSize(info?.size_bytes);
                    if (sizeLabel) parts.push(sizeLabel);
                    if (info?.mime) parts.push(info.mime);
                    const suffix = parts.length ? ` (${parts.join(", ")})` : "";
                    comfyToast(
                        t("toast.metadataRefreshed", "Metadata refreshed{suffix}", { suffix }),
                        "success",
                        3000,
                    );
                } catch (error) {
                    reportError(error, "[ViewerContextMenu] Metadata refresh", {
                        showToast: true,
                    });
                }
            },
            { disabled: !asset?.id },
        ),
        createSeparator(),
        createItem(
            t("ctx.rename", "Rename"),
            "pi pi-pencil",
            VIEWER_SHORTCUTS.RENAME,
            async () => {
                if (!(asset?.id || asset?.filepath)) return;
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
                    const renameResult = await renameAsset(asset, newName);
                    if (renameResult?.ok) {
                        const fresh = renameResult?.data?.asset;
                        if (fresh && typeof fresh === "object") {
                            Object.assign(asset, fresh);
                        } else {
                            asset.filename = newName;
                            asset.filepath = asset.filepath.replace(/[^\\/]+$/, newName);
                            if (asset.path) {
                                asset.path = String(asset.path).replace(/[^\\/]+$/, newName);
                            }
                            if (asset.file_info && typeof asset.file_info === "object") {
                                asset.file_info.filename = newName;
                                if (asset.file_info.filepath) {
                                    asset.file_info.filepath = String(
                                        asset.file_info.filepath,
                                    ).replace(/[^\\/]+$/, newName);
                                }
                                if (asset.file_info.path) {
                                    asset.file_info.path = String(asset.file_info.path).replace(
                                        /[^\\/]+$/,
                                        newName,
                                    );
                                }
                            }
                        }

                        comfyToast(t("toast.fileRenamedSuccess"), "success");
                        try {
                            window.dispatchEvent(
                                new CustomEvent("mjr:reload-grid", {
                                    detail: { reason: "viewer-rename" },
                                }),
                            );
                        } catch (e) {
                            console.debug?.(e);
                        }
                        onAssetChanged?.();
                    } else {
                        comfyToast(renameResult?.error || t("toast.fileRenameFailed"), "error");
                    }
                } catch (error) {
                    comfyToast(
                        t("toast.errorRenaming", "Error renaming file: {error}", {
                            error: error?.message || String(error || ""),
                        }),
                        "error",
                    );
                }
            },
            { disabled: !(asset?.id || asset?.filepath) },
        ),
        createItem(
            t("ctx.delete", "Delete"),
            "pi pi-trash",
            VIEWER_SHORTCUTS.DELETE,
            async () => {
                if (!(asset?.id || asset?.filepath)) return;
                const ok = await confirmDeletion(1, asset?.filename);
                if (!ok) return;

                try {
                    const deleteResult = await deleteAsset(asset);
                    if (deleteResult?.ok) {
                        comfyToast(t("toast.fileDeletedSuccess"), "success");
                        onAssetChanged?.();
                    } else {
                        comfyToast(deleteResult?.error || t("toast.fileDeleteFailed"), "error");
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
            { disabled: !(asset?.id || asset?.filepath) },
        ),
    ];

    return items;
}

export function bindViewerContextMenu({
    overlayEl,
    getCurrentAsset,
    getCurrentViewUrl,
    onAssetChanged,
} = {}) {
    if (!overlayEl || typeof getCurrentAsset !== "function") return;
    const existingBinding = viewerContextMenuBindings.get(overlayEl);
    if (typeof existingBinding?.unbind === "function") {
        return existingBinding.unbind;
    }

    const handler = async (event) => {
        if (!overlayEl.contains(event.target)) return;
        event.preventDefault();
        event.stopPropagation();

        const asset = getCurrentAsset();
        if (!asset) return;

        openViewerContextMenu({
            x: event.clientX,
            y: event.clientY,
            items: createViewerMenuItems({
                asset,
                event,
                getCurrentViewUrl,
                onAssetChanged,
            }),
        });
    };

    try {
        overlayEl.addEventListener("contextmenu", handler);
    } catch (error) {
        console.error("[ViewerContextMenu] Failed to bind:", error);
    }

    const unbind = () => {
        try {
            overlayEl.removeEventListener("contextmenu", handler);
        } catch (e) {
            console.debug?.(e);
        }
        try {
            cancelAllRatingUpdates();
            const ratingDebounceTimers = globalThis?._ratingDebounceTimers;
            if (ratingDebounceTimers && typeof ratingDebounceTimers.clear === "function") {
                ratingDebounceTimers.clear();
            }
        } catch (e) {
            console.debug?.(e);
        }
        try {
            closeAllViewerContextMenus();
        } catch (e) {
            console.debug?.(e);
        }
        viewerContextMenuBindings.delete(overlayEl);
    };

    viewerContextMenuBindings.set(overlayEl, { unbind });
    return unbind;
}

export function unbindViewerContextMenu(overlayEl) {
    const binding = overlayEl ? viewerContextMenuBindings.get(overlayEl) : null;
    try {
        binding?.unbind?.();
    } catch (e) {
        console.debug?.(e);
    }
}
