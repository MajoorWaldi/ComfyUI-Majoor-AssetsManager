/**
 * Tags Editor Component - Add/remove tags with autocomplete
 */

import { updateAssetTags, getAvailableTags } from "../api/client.js";
import { ASSET_TAGS_CHANGED_EVENT } from "../app/events.js";
import { getPopoverManagerForElement } from "../features/panel/views/popoverManager.js";
import { safeDispatchCustomEvent } from "../utils/events.js";

/**
 * Create interactive tags editor
 * @param {Object} asset - Asset object with id and current tags
 * @param {Function} onUpdate - Callback when tags change
 * @returns {HTMLElement}
 */
export function createTagsEditor(asset, onUpdate) {
    const container = document.createElement("div");
    container.className = "mjr-tags-editor";
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 12px;
        background: rgba(0,0,0,0.95);
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        min-width: 250px;
        max-width: 350px;
    `;

    const currentTags = Array.isArray(asset.tags) ? [...asset.tags] : [];

    // Current tags display
    const tagsDisplay = document.createElement("div");
    tagsDisplay.className = "mjr-tags-display";
    tagsDisplay.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        min-height: 32px;
    `;

    const renderTags = () => {
        tagsDisplay.innerHTML = "";
        if (currentTags.length === 0) {
            const placeholder = document.createElement("span");
            placeholder.textContent = "No tags yet...";
            placeholder.style.cssText = "color: #666; font-size: 12px; font-style: italic;";
            tagsDisplay.appendChild(placeholder);
            return;
        }

        currentTags.forEach(tag => {
            const tagChip = createTagChip(tag, () => {
                const index = currentTags.indexOf(tag);
                if (index > -1) {
                    currentTags.splice(index, 1);
                    renderTags();
                    saveTags();
                }
            });
            tagsDisplay.appendChild(tagChip);
        });
    };

    renderTags();

    // Input for new tags
    const inputWrapper = document.createElement("div");
    inputWrapper.style.cssText = "position: relative;";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Add tag...";
    input.className = "mjr-tag-input";
    input.style.cssText = `
        width: 100%;
        padding: 6px 8px;
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 4px;
        color: white;
        font-size: 13px;
        outline: none;
    `;

    // Autocomplete dropdown
    const dropdown = document.createElement("div");
    dropdown.className = "mjr-tags-dropdown";
    dropdown.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        margin-top: 4px;
        background: rgba(0,0,0,0.95);
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 4px;
        max-height: 150px;
        overflow-y: auto;
        display: none;
        z-index: 1000;
    `;

    let availableTags = [];
    let selectedIndex = -1;

    // Load available tags from server
    const loadAvailableTags = async () => {
        try {
            const result = await getAvailableTags();
            if (result.ok && Array.isArray(result.data)) {
                availableTags = result.data;
            }
        } catch (err) {
            console.warn("Failed to load available tags:", err);
        }
    };
    loadAvailableTags();

    // Filter and show suggestions
    const showSuggestions = (query) => {
        const normalizedQuery = query.toLowerCase().trim();
        if (!normalizedQuery) {
            dropdown.style.display = "none";
            return;
        }

        const suggestions = availableTags
            .filter(tag => {
                const normalized = tag.toLowerCase();
                return normalized.includes(normalizedQuery) && !currentTags.includes(tag);
            })
            .slice(0, 10);

        if (suggestions.length === 0) {
            dropdown.style.display = "none";
            return;
        }

        dropdown.innerHTML = "";
        suggestions.forEach((tag, index) => {
            const item = document.createElement("div");
            item.className = "mjr-tag-suggestion";
            item.textContent = tag;
            item.style.cssText = `
                padding: 6px 8px;
                cursor: pointer;
                font-size: 13px;
                color: white;
                background: ${index === selectedIndex ? "rgba(144, 202, 249, 0.2)" : "transparent"};
            `;

            item.addEventListener("mouseenter", () => {
                selectedIndex = index;
                showSuggestions(query);
            });

            item.addEventListener("click", () => {
                addTag(tag);
                input.value = "";
                dropdown.style.display = "none";
            });

            dropdown.appendChild(item);
        });

        dropdown.style.display = "block";
    };

    // Add tag function
    const addTag = (tag) => {
        const normalized = tag.trim();
        if (!normalized || currentTags.includes(normalized)) {
            return;
        }
        currentTags.push(normalized);
        renderTags();
        saveTags();
    };

    // Save tags to backend
    const saveTags = async () => {
        const prev = Array.isArray(asset.tags) ? [...asset.tags] : [];
        let result = null;
        try {
            // Supports both `asset_id` and `{filepath,type,root_id}` payloads.
            result = await updateAssetTags(asset, currentTags);
        } catch (err) {
            console.error("Failed to update tags:", err);
        }

        if (!result?.ok) {
            // Revert if backend rejected the change.
            currentTags.splice(0, currentTags.length, ...prev);
            asset.tags = [...prev];
            renderTags();
            return;
        }

        // If we tagged an unindexed file, the backend may have created an asset row.
        try {
            const newId = result?.data?.asset_id ?? null;
            if (asset.id == null && newId != null) asset.id = newId;
        } catch {}

        asset.tags = [...currentTags];
        if (onUpdate) onUpdate(currentTags);
        safeDispatchCustomEvent(
            ASSET_TAGS_CHANGED_EVENT,
            { assetId: String(asset.id), tags: [...currentTags] },
            { warnPrefix: "[TagsEditor]" }
        );
    };

    // Input event handlers
    input.addEventListener("input", (e) => {
        showSuggestions(e.target.value);
        selectedIndex = -1;
    });

    input.addEventListener("keydown", (e) => {
        const suggestions = dropdown.querySelectorAll(".mjr-tag-suggestion");

        if (e.key === "ArrowDown") {
            e.preventDefault();
            if (suggestions.length > 0) {
                selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
                showSuggestions(input.value);
            }
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (suggestions.length > 0) {
                selectedIndex = Math.max(selectedIndex - 1, -1);
                showSuggestions(input.value);
            }
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                suggestions[selectedIndex].click();
            } else {
                addTag(input.value);
                input.value = "";
                dropdown.style.display = "none";
            }
        } else if (e.key === "Escape") {
            dropdown.style.display = "none";
            selectedIndex = -1;
        } else if (e.key === "," || e.key === ";") {
            e.preventDefault();
            addTag(input.value);
            input.value = "";
            dropdown.style.display = "none";
        }
    });

    input.addEventListener("blur", () => {
        // Delay to allow click on dropdown
        setTimeout(() => {
            dropdown.style.display = "none";
        }, 200);
    });

    inputWrapper.appendChild(input);
    inputWrapper.appendChild(dropdown);

    // Allow external updates (e.g. hotkeys) to refresh the editor UI.
    try {
        container._mjrSetTags = (tags) => {
            const next = Array.isArray(tags) ? tags.filter(Boolean).map(String) : [];
            currentTags.splice(0, currentTags.length, ...next);
            renderTags();
        };
    } catch {}

    container.appendChild(tagsDisplay);
    container.appendChild(inputWrapper);

    return container;
}

/**
 * Create a tag chip with remove button
 */
function createTagChip(tag, onRemove) {
    const chip = document.createElement("span");
    chip.className = "mjr-tag-chip";
    chip.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        background: rgba(144, 202, 249, 0.2);
        border: 1px solid rgba(144, 202, 249, 0.4);
        border-radius: 12px;
        font-size: 11px;
        color: #90CAF9;
    `;

    const text = document.createElement("span");
    text.textContent = tag;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.textContent = "×";
    removeBtn.style.cssText = `
        background: none;
        border: none;
        color: #90CAF9;
        cursor: pointer;
        font-size: 14px;
        padding: 0;
        margin: 0;
        line-height: 1;
        opacity: 0.7;
        transition: opacity 0.2s;
    `;

    removeBtn.addEventListener("mouseenter", () => {
        removeBtn.style.opacity = "1";
    });

    removeBtn.addEventListener("mouseleave", () => {
        removeBtn.style.opacity = "0.7";
    });

    removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (onRemove) {
            onRemove();
        }
    });

    chip.appendChild(text);
    chip.appendChild(removeBtn);

    return chip;
}

/**
 * Show tags editor in a popover
 * @param {HTMLElement} anchor - Element to anchor popover to
 * @param {Object} asset - Asset object
 * @param {Function} onUpdate - Callback when tags change
 */
export function showTagsPopover(anchor, asset, onUpdate) {
    const existing = document.querySelector(".mjr-tags-popover");
    if (existing) {
        try {
            existing.remove();
        } catch {}
    }

    const popover = document.createElement("div");
    popover.className = "mjr-popover mjr-tags-popover";

    const popovers = getPopoverManagerForElement(anchor);
    const host = anchor?.closest?.(".mjr-am-container") || null;

    const editor = createTagsEditor(asset, (tags) => {
        try {
            onUpdate?.(tags);
        } catch {}
        // Keep the editor open; caller can close explicitly if desired.
    });
    popover.appendChild(editor);
    (host || document.body).appendChild(popover);
    popover.style.display = "block";

    if (popovers) {
        popovers.open(popover, anchor);
        return popover;
    }

    // Fallback positioning when used outside the Assets Manager panel.
    const rect = anchor.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    let top = rect.bottom + 8;
    let left = rect.left;
    if (top + popoverRect.height > window.innerHeight) {
        top = rect.top - popoverRect.height - 8;
    }
    if (left + popoverRect.width > window.innerWidth) {
        left = window.innerWidth - popoverRect.width - 8;
    }
    popover.style.position = "fixed";
    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
    popover.style.zIndex = "2147483647";

    const closeOnClickOutside = (e) => {
        if (!popover.contains(e.target) && !anchor.contains(e.target)) {
            try {
                popover.remove();
            } catch {}
            document.removeEventListener("click", closeOnClickOutside);
        }
    };
    setTimeout(() => document.addEventListener("click", closeOnClickOutside), 100);
    return popover;
}
