/**
 * Rating Editor Component - Interactive star rating
 */

import { updateAssetRating } from "../api/client.js";
import { ASSET_RATING_CHANGED_EVENT } from "../app/events.js";
import { comfyToast } from "../app/toast.js";
import { t } from "../app/i18n.js";
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
    let savedRating = currentRating;
    let desiredRating = currentRating;
    let saving = false;
    let saveAC = null;

    try {
        container.setAttribute("role", "slider");
        container.setAttribute("aria-label", "Rating");
        container.setAttribute("aria-valuemin", "0");
        container.setAttribute("aria-valuemax", "5");
        container.setAttribute("aria-valuenow", String(currentRating));
        container.setAttribute("tabindex", "0");
    } catch (e) { console.debug?.(e); }

    const setDisabled = (disabled) => {
        try {
            for (const btn of container.querySelectorAll?.("button.mjr-rating-star") || []) {
                try {
                    btn.disabled = Boolean(disabled);
                } catch (e) { console.debug?.(e); }
            }
        } catch (e) { console.debug?.(e); }
    };

    const retryDelay = (attemptIndex) => Math.min(100 * (2 ** Math.max(0, attemptIndex - 1)), 2000);
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const flushSaves = async () => {
        if (saving) return;
        saving = true;
        setDisabled(true);
        try {
            let attempts = 0;
            while (attempts < 10) {
                if (attempts > 0) {
                    await wait(retryDelay(attempts));
                }
                attempts += 1;
                const toSave = Math.max(0, Math.min(5, Number(desiredRating) || 0));
                const ac = typeof AbortController !== "undefined" ? new AbortController() : null;
                saveAC = ac;

                let result = null;
                try {
                    result = await updateAssetRating(asset, toSave, ac ? { signal: ac.signal } : {});
                } catch (err) {
                    console.error("Failed to update rating:", err);
                }

                if (!result?.ok) {
                    if (result?.code === "ABORTED" && desiredRating !== toSave) {
                        continue;
                    }
                    asset.rating = savedRating;
                    currentRating = savedRating;
                    desiredRating = savedRating;
                    updateStarColors(container, savedRating);
                    comfyToast(result?.error || t("toast.ratingUpdateFailed"), "error");
                    break;
                }

                try {
                    const newId = result?.data?.asset_id ?? null;
                    if (asset.id == null && newId != null) asset.id = newId;
                } catch (e) { console.debug?.(e); }

                savedRating = toSave;
                currentRating = toSave;
                asset.rating = toSave;

                try {
                    onUpdate?.(toSave);
                } catch (e) { console.debug?.(e); }
                safeDispatchCustomEvent(
                    ASSET_RATING_CHANGED_EVENT,
                    { assetId: String(asset.id), rating: toSave },
                    { warnPrefix: "[RatingEditor]" }
                );

                if (desiredRating === toSave) {
                    comfyToast(t("toast.ratingSetN", { n: toSave }), "success", 1000);
                    break;
                }
            }
            if (attempts >= 10) {
                asset.rating = savedRating;
                currentRating = savedRating;
                desiredRating = savedRating;
                updateStarColors(container, savedRating);
                comfyToast(t("toast.ratingUpdateFailed"), "error");
            }
        } catch (e) { console.debug?.(e); }

        try {
            saveAC = null;
        } catch (e) { console.debug?.(e); }
        saving = false;
        setDisabled(false);
    };

    // Create 5 stars
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement("button");
        star.type = "button";
        star.className = "mjr-rating-star";
        star.textContent = "★";
        star.dataset.rating = String(i);
        try {
            star.setAttribute("aria-label", `Set rating ${i}`);
        } catch (e) { console.debug?.(e); }
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

        // Click to set rating (coalesced + abortable)
        star.addEventListener("click", (e) => {
            e.stopPropagation();
            e.preventDefault();

            desiredRating = i;

            // Optimistic UI update.
            asset.rating = i;
            currentRating = i;
            updateStarColors(container, i);

            // Cancel in-flight request (best-effort) and save latest.
            try {
                saveAC?.abort?.();
            } catch (e) { console.debug?.(e); }
            flushSaves();
        });

        container.appendChild(star);
    }

    // Keyboard navigation for accessibility
    container.addEventListener("keydown", (e) => {
        if (saving) return;
        let newRating = currentRating;

        if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            e.preventDefault();
            newRating = Math.min(5, currentRating + 1);
        } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            e.preventDefault();
            newRating = Math.max(0, currentRating - 1);
        } else if (e.key === "Home") {
            e.preventDefault();
            newRating = 0;
        } else if (e.key === "End") {
            e.preventDefault();
            newRating = 5;
        } else if (e.key >= "0" && e.key <= "5") {
            e.preventDefault();
            newRating = parseInt(e.key, 10);
        } else {
            return;
        }

        if (newRating !== currentRating) {
            desiredRating = newRating;
            asset.rating = newRating;
            currentRating = newRating;
            updateStarColors(container, newRating);
            try {
                container.setAttribute("aria-valuenow", String(newRating));
            } catch (e) { console.debug?.(e); }
            try {
                saveAC?.abort?.();
            } catch (e) { console.debug?.(e); }
            flushSaves();
        }
    });

    // Allow external updates (e.g. hotkeys) to refresh the editor UI while keeping behavior consistent.
    try {
        container._mjrSetRating = (rating) => {
            const next = Math.max(0, Math.min(5, Number(rating) || 0));
            asset.rating = next;
            currentRating = next;
            updateStarColors(container, next);
            try {
                container.setAttribute("aria-valuenow", String(next));
            } catch (e) { console.debug?.(e); }
        };
    } catch (e) { console.debug?.(e); }

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
        try {
            star.setAttribute("aria-pressed", starValue <= rating ? "true" : "false");
        } catch (e) { console.debug?.(e); }
    });
}

