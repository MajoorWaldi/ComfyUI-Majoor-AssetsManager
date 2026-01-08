/**
 * Grid Context Menu - Right-click menu for asset cards
 */

import { buildAssetViewURL } from "../../api/endpoints.js";
import { comfyAlert, comfyConfirm, comfyPrompt } from "../../app/dialogs.js";
import { openInFolder, updateAssetRating, deleteAsset, renameAsset } from "../../api/client.js";
import { ASSET_RATING_CHANGED_EVENT, ASSET_TAGS_CHANGED_EVENT } from "../../app/events.js";
import { createTagsEditor } from "../../components/TagsEditor.js";
import { safeDispatchCustomEvent } from "../../utils/events.js";
// Bulk operations removed - using local helpers
const getSelectedAssetIds = (gridContainer) => {
    const selected = new Set();
    if (!gridContainer) return selected;
    try {
        const cards = gridContainer.querySelectorAll('.mjr-asset-card.is-selected');
        for (const card of cards) {
            const id = card.dataset?.mjrAssetId;
            if (id) selected.add(String(id));
        }
    } catch {}
    return selected;
};

const clearSelection = (gridContainer) => {
    if (!gridContainer) return;
    try {
        const cards = gridContainer.querySelectorAll('.mjr-asset-card.is-selected');
        for (const card of cards) {
            card.classList.remove('is-selected');
            card.setAttribute('aria-selected', 'false');
        }
    } catch {}
};

const MENU_SELECTOR = ".mjr-grid-context-menu";
const POPOVER_SELECTOR = ".mjr-grid-popover";

function createMenu() {
    const existing = document.querySelector(MENU_SELECTOR);
    if (existing) return existing;

    const menu = document.createElement("div");
    menu.className = "mjr-grid-context-menu mjr-context-menu";
    menu.style.cssText = `
        position: fixed;
        background: var(--comfy-menu-bg);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
        min-width: 220px;
        z-index: 10001;
        display: none;
        padding: 4px 0;
    `;

    const ac = new AbortController();
    menu._mjrAbortController = ac;

    const hide = () => {
        menu.style.display = "none";
        try {
            const pop = document.querySelector(POPOVER_SELECTOR);
            pop?.remove?.();
        } catch {}
    };

    document.addEventListener(
        "click",
        (e) => {
            if (!menu.contains(e.target)) hide();
        },
        { signal: ac.signal, capture: true }
    );
    document.addEventListener(
        "keydown",
        (e) => {
            if (e.key === "Escape") hide();
        },
        { signal: ac.signal, capture: true }
    );
    document.addEventListener("scroll", hide, { capture: true, signal: ac.signal });

    document.body.appendChild(menu);
    return menu;
}

function createItem(label, iconClass, rightHint, onClick, { disabled = false } = {}) {
    const item = document.createElement("div");
    item.className = "mjr-context-menu-item";
    item.style.cssText = `
        padding: 8px 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: ${disabled ? "default" : "pointer"};
        color: var(--fg-color);
        font-size: 13px;
        opacity: ${disabled ? "0.45" : "1"};
        transition: background 0.15s;
        user-select: none;
    `;

    const left = document.createElement("div");
    left.style.cssText = "display:flex; align-items:center; gap:10px;";
    if (iconClass) {
        const iconEl = document.createElement("i");
        iconEl.className = iconClass;
        iconEl.style.cssText = "width:16px; text-align:center; opacity:0.8;";
        left.appendChild(iconEl);
    }
    const labelEl = document.createElement("span");
    labelEl.textContent = label;
    left.appendChild(labelEl);
    item.appendChild(left);

    if (rightHint) {
        const hint = document.createElement("span");
        hint.textContent = rightHint;
        hint.style.cssText = "font-size: 11px; opacity: 0.55; margin-left: 16px;";
        item.appendChild(hint);
    }

    item.addEventListener("mouseenter", () => {
        if (!disabled) item.style.background = "var(--comfy-input-bg)";
    });
    item.addEventListener("mouseleave", () => {
        item.style.background = "transparent";
    });

    item.addEventListener("click", async (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (disabled) return;
        try {
            await onClick?.();
        } catch {}
    });

    return item;
}

function separator() {
    const s = document.createElement("div");
    s.style.cssText = "height:1px;background:var(--border-color);margin:4px 0;";
    return s;
}

function showAt(menu, x, y) {
    menu.style.display = "block";
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    const rect = menu.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let fx = x;
    let fy = y;
    if (x + rect.width > vw) fx = vw - rect.width - 10;
    if (y + rect.height > vh) fy = vh - rect.height - 10;

    menu.style.left = `${Math.max(8, fx)}px`;
    menu.style.top = `${Math.max(8, fy)}px`;
}

function showTagsPopover(x, y, asset, onChanged) {
    try {
        const existing = document.querySelector(POPOVER_SELECTOR);
        existing?.remove?.();
    } catch {}

    const pop = document.createElement("div");
    pop.className = "mjr-grid-popover";
    pop.style.cssText = `
        position: fixed;
        z-index: 10002;
        left: ${x}px;
        top: ${y}px;
    `;

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

async function setRating(asset, rating, onChanged) {
    const assetId = asset?.id;
    if (!assetId) return;
    try {
        const result = await updateAssetRating(assetId, rating);
        if (!result?.ok) return;
        asset.rating = rating;
        safeDispatchCustomEvent(
            ASSET_RATING_CHANGED_EVENT,
            { assetId: String(assetId), rating },
            { warnPrefix: "[GridContextMenu]" }
        );
        onChanged?.();
    } catch {}
}

export function bindGridContextMenu({
    gridContainer,
    getState = () => ({}),
    onRequestOpenViewer = () => {},
} = {}) {
    if (!gridContainer) return;
    if (gridContainer._mjrGridContextMenuBound) return;
    gridContainer._mjrGridContextMenuBound = true;

    const menu = createMenu();

    gridContainer.addEventListener("contextmenu", async (e) => {
        // Check if the contextmenu event is on an asset card
        const card = e.target.closest(".mjr-asset-card");
        if (!card) return;
        
        e.preventDefault();
        e.stopPropagation();

        const asset = card._mjrAsset;
        if (!asset) return;

        menu.innerHTML = "";

        // Get current selection state
        const selectedIds = getSelectedAssetIds(gridContainer);
        const isSingleSelected = selectedIds.size === 1 && selectedIds.has(String(asset.id));
        const isMultiSelected = selectedIds.size > 1;
        const hasSelection = selectedIds.size > 0;

        // Open Viewer
        menu.appendChild(
            createItem("Open Viewer", "pi pi-image", null, () => {
                onRequestOpenViewer(asset);
            })
        );

        // Open in Folder
        menu.appendChild(
            createItem("Open in Folder", "pi pi-folder-open", null, async () => {
                if (!asset?.id) return;
                const res = await openInFolder(asset.id);
                if (!res?.ok) {
                    await comfyAlert(res?.error || "Failed to open folder.");
                }
            }, { disabled: !asset?.id })
        );

        // Copy file path
        menu.appendChild(
            createItem("Copy file path", "pi pi-copy", null, async () => {
                const p = asset?.filepath ? String(asset.filepath) : "";
                if (!p) {
                    await comfyAlert("No file path available for this asset.");
                    return;
                }
                try {
                    await navigator.clipboard.writeText(p);
                } catch {}
            })
        );

        menu.appendChild(separator());

        // Edit Tags
        menu.appendChild(createItem("Edit Tags…", "pi pi-tags", null, () => {
            showTagsPopover(e.clientX + 6, e.clientY + 6, asset, () => {
                // Update card UI after tags change
                const card = document.querySelector(`[data-mjr-asset-id="${CSS.escape ? CSS.escape(String(asset.id)) : String(asset.id)}"]`);
                if (card && card._mjrAsset) {
                    card._mjrAsset.tags = [...asset.tags];
                }
            });
        }));

        // Rating submenu
        menu.appendChild(separator());
        const ratingLabel = (n) => (n === 0 ? "Reset rating" : `Set rating: ${"★".repeat(n)}`);
        for (const n of [5, 4, 3, 2, 1, 0]) {
            menu.appendChild(
                createItem(ratingLabel(n), "pi pi-star", n ? String(n) : "0", () => setRating(asset, n, () => {
                    // Update card UI after rating change
                    const card = document.querySelector(`[data-mjr-asset-id="${CSS.escape ? CSS.escape(String(asset.id)) : String(asset.id)}"]`);
                    if (card && card._mjrAsset) {
                        card._mjrAsset.rating = n;
                    }
                }), {
                    disabled: !asset?.id
                })
            );
        }

        menu.appendChild(separator());

        // Rename (single only)
        menu.appendChild(
            createItem("Rename…", "pi pi-pencil", null, async () => {
                if (!asset?.id) return;
                
                const currentName = asset.filename || "";
                const newName = await comfyPrompt("Rename file", currentName);
                if (!newName || newName === currentName) return;
                
                try {
                    const result = await renameAsset(asset.id, newName);
                    if (result?.ok) {
                        // Update the asset object and card UI
                        asset.filename = newName;
                        asset.filepath = asset.filepath.replace(/[^\\/]+$/, newName);
                        
                        // Update card UI
                        const card = document.querySelector(`[data-mjr-asset-id="${CSS.escape ? CSS.escape(String(asset.id)) : String(asset.id)}"]`);
                        if (card) {
                            // Update card display
                            const filenameEl = card.querySelector('.mjr-filename');
                            if (filenameEl) {
                                filenameEl.textContent = newName;
                            }
                        }
                        
                        await comfyAlert("File renamed successfully!");
                    } else {
                        await comfyAlert(result?.error || "Failed to rename file.");
                    }
                } catch (error) {
                    await comfyAlert(`Error renaming file: ${error.message}`);
                }
            }, { disabled: !asset?.id })
        );

        // Delete (single or multi)
        if (isMultiSelected) {
            menu.appendChild(
                createItem(`Delete ${selectedIds.size} files…`, "pi pi-trash", null, async () => {
                    const confirmed = await comfyConfirm(`Delete ${selectedIds.size} files? This cannot be undone.`);
                    if (!confirmed) return;

                    try {
                        // Delete each asset individually
                        let successCount = 0;
                        let errorCount = 0;

                        for (const assetId of selectedIds) {
                            const result = await deleteAsset(assetId);
                            if (result?.ok) {
                                successCount++;
                                // Remove card from DOM
                                const card = document.querySelector(`[data-mjr-asset-id="${CSS.escape ? CSS.escape(String(assetId)) : String(assetId)}"]`);
                                if (card) card.remove();
                            } else {
                                errorCount++;
                            }
                        }

                        // Clear selection
                        clearSelection(gridContainer);

                        if (errorCount === 0) {
                            await comfyAlert(`${successCount} files deleted successfully!`);
                        } else {
                            await comfyAlert(`${successCount} files deleted, ${errorCount} failed.`);
                        }
                    } catch (error) {
                        await comfyAlert(`Error deleting files: ${error.message}`);
                    }
                })
            );
        } else {
            menu.appendChild(
                createItem("Delete…", "pi pi-trash", null, async () => {
                    const confirmed = await comfyConfirm("Delete this file? This cannot be undone.");
                    if (!confirmed) return;
                    
                    try {
                        const result = await deleteAsset(asset.id);
                        if (result?.ok) {
                            // Remove the card from DOM
                            card.remove();
                            await comfyAlert("File deleted successfully!");
                        } else {
                            await comfyAlert(result?.error || "Failed to delete file.");
                        }
                    } catch (error) {
                        await comfyAlert(`Error deleting file: ${error.message}`);
                    }
                }, { disabled: !asset?.id })
            );
        }

        // Bulk operations menu removed

        showAt(menu, e.clientX, e.clientY);
    });
}