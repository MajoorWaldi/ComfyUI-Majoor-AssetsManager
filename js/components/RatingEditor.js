/**
 * Rating Editor Component - Interactive star rating
 */

import { updateAssetRating } from "../api/client.js";
import { ASSET_RATING_CHANGED_EVENT } from "../app/events.js";
import { getPopoverManagerForElement } from "../features/panel/views/popoverManager.js";
import { safeDispatchCustomEvent } from "../utils/events.js";

/**
 * Create interactive star rating editor
 * @param {Object} asset - Asset object with id and current rating
 * @param {Function} onUpdate - Callback when rating changes
 * @returns {HTMLElement}
 */
export function createRatingEditor(asset, onUpdate) {
    const container = document.createElement("div");
    container.className = "mjr-rating-editor";

    let currentRating = Math.max(0, Math.min(5, Number(asset.rating) || 0));
    let hoveredStar = 0;

    // Create 5 stars
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement("button");
        star.type = "button";
        star.className = "mjr-rating-star";
        star.textContent = "★";
        star.dataset.rating = String(i);
        star.style.color = i <= currentRating ? "#FFD45A" : "#555";

        // Hover effects
        star.addEventListener("mouseenter", () => {
            hoveredStar = i;
            updateStarColors(container, hoveredStar);
        });

        star.addEventListener("mouseleave", () => {
            hoveredStar = 0;
            updateStarColors(container, currentRating);
        });

        // Click to set rating
        star.addEventListener("click", async (e) => {
            e.stopPropagation();
            e.preventDefault();

            const newRating = i;
            const prevRating = currentRating;

            // Optimistic UI update
            asset.rating = newRating;
            currentRating = newRating;
            updateStarColors(container, newRating);

            // Save to backend
            let result = null;
            try {
                // Supports both `asset_id` and `{filepath,type,root_id}` payloads.
                result = await updateAssetRating(asset, newRating);
            } catch (err) {
                console.error("Failed to update rating:", err);
            }

            if (!result?.ok) {
                // Revert if backend rejected the change.
                asset.rating = prevRating;
                currentRating = prevRating;
                updateStarColors(container, prevRating);
                return;
            }

            // If we rated an unindexed file, the backend may have created an asset row.
            try {
                const newId = result?.data?.asset_id ?? null;
                if (asset.id == null && newId != null) asset.id = newId;
            } catch {}

            if (onUpdate) onUpdate(newRating);
            safeDispatchCustomEvent(
                ASSET_RATING_CHANGED_EVENT,
                { assetId: String(asset.id), rating: newRating },
                { warnPrefix: "[RatingEditor]" }
            );
        });

        container.appendChild(star);
    }

    // Allow external updates (e.g. hotkeys) to refresh the editor UI while keeping behavior consistent.
    try {
        container._mjrSetRating = (rating) => {
            const next = Math.max(0, Math.min(5, Number(rating) || 0));
            asset.rating = next;
            currentRating = next;
            updateStarColors(container, next);
        };
    } catch {}

    return container;
}

/**
 * Update star colors based on rating
 */
function updateStarColors(container, rating) {
    const stars = container.querySelectorAll(".mjr-rating-star");
    stars.forEach((star, index) => {
        const starValue = index + 1;
        star.style.color = starValue <= rating ? "#FFD45A" : "#555";
        star.style.transform = starValue <= rating ? "scale(1.1)" : "scale(1)";
    });
}

/**
 * Show rating editor in a popover
 * @param {HTMLElement} anchor - Element to anchor popover to
 * @param {Object} asset - Asset object
 * @param {Function} onUpdate - Callback when rating changes
 */
export function showRatingPopover(anchor, asset, onUpdate) {
    const existing = document.querySelector(".mjr-rating-popover");
    if (existing) {
        try {
            existing.remove();
        } catch {}
    }

    const popover = document.createElement("div");
    popover.className = "mjr-popover mjr-rating-popover";

    const popovers = getPopoverManagerForElement(anchor);
    const host = anchor?.closest?.(".mjr-am-container") || null;

    const editor = createRatingEditor(asset, (newRating) => {
        try {
            onUpdate?.(newRating);
        } catch {}
        setTimeout(() => {
            try {
                popovers?.close?.(popover);
            } catch {}
            try {
                popover.remove();
            } catch {}
        }, 150);
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
    popover.style.position = "fixed";
    popover.style.top = `${rect.bottom + 8}px`;
    popover.style.left = `${rect.left}px`;
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
