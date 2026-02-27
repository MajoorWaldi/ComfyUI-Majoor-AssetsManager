import { createRatingEditor } from "../../RatingEditor.js";
import { createTagsEditor } from "../../TagsEditor.js";
import { createSection } from "../utils/dom.js";

export function createRatingTagsSection(asset, onUpdate) {
    const section = createSection("Rating & Tags");

    const ratingContainer = document.createElement("div");
    ratingContainer.style.marginBottom = "16px";

    const ratingLabel = document.createElement("div");
    ratingLabel.textContent = "Rating";
    ratingLabel.style.cssText = `
        font-size: 12px;
        color: var(--mjr-muted, rgba(255,255,255,0.65));
        margin-bottom: 8px;
    `;

    const ratingEditor = createRatingEditor(asset, (newRating) => {
        asset.rating = newRating;
        if (onUpdate) onUpdate(asset);
    });
    ratingEditor.style.cssText = `
        background: rgba(0,0,0,0.3);
        border-radius: 6px;
        padding: 8px;
        display: flex;
        width: 100%;
        box-sizing: border-box;
        justify-content: space-between;
        gap: 6px;
    `;
    try {
        const stars = ratingEditor.querySelectorAll(".mjr-rating-star");
        stars.forEach((star) => {
            star.style.flex = "1 1 0";
            star.style.display = "flex";
            star.style.alignItems = "center";
            star.style.justifyContent = "center";
            star.style.fontSize = "24px";
            star.style.padding = "8px 0";
        });
    } catch (e) { console.debug?.(e); }

    ratingContainer.appendChild(ratingLabel);
    ratingContainer.appendChild(ratingEditor);

    const tagsContainer = document.createElement("div");

    const tagsLabel = document.createElement("div");
    tagsLabel.textContent = "Tags";
    tagsLabel.style.cssText = `
        font-size: 12px;
        color: var(--mjr-muted, rgba(255,255,255,0.65));
        margin-bottom: 8px;
    `;

    const tagsEditor = createTagsEditor(asset, (newTags) => {
        asset.tags = newTags;
        if (onUpdate) onUpdate(asset);
    });
    tagsEditor.style.cssText = `
        background: rgba(0,0,0,0.3);
        border-radius: 6px;
        padding: 12px;
    `;

    tagsContainer.appendChild(tagsLabel);
    tagsContainer.appendChild(tagsEditor);

    section.appendChild(ratingContainer);
    section.appendChild(tagsContainer);

    // Expose minimal imperative API so the sidebar can update when rating/tags are changed externally
    // (hotkeys, viewer shortcuts, etc.) without re-mounting the whole sidebar.
    try {
        section._mjrSetRating = (rating) => ratingEditor?._mjrSetRating?.(rating);
    } catch (e) { console.debug?.(e); }
    try {
        section._mjrSetTags = (tags) => tagsEditor?._mjrSetTags?.(tags);
    } catch (e) { console.debug?.(e); }

    return section;
}
