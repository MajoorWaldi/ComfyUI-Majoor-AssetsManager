import { createRatingEditor } from "../../RatingEditor.js";
import { createTagsEditor } from "../../TagsEditor.js";
import { createSection } from "../utils/dom.js";
import { vectorGetAutoTags, updateAssetTags } from "../../../api/client.js";

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

    // ── AI Suggested Tags (auto-tags from CLIP) ────────────────────
    const assetId = asset?.id;
    if (assetId) {
        const aiTagsContainer = document.createElement("div");
        aiTagsContainer.style.marginTop = "12px";

        const aiTagsLabel = document.createElement("div");
        aiTagsLabel.style.cssText = `
            font-size: 11px;
            font-weight: 700;
            color: rgba(0, 188, 212, 0.75);
            text-transform: uppercase;
            letter-spacing: 0.7px;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 5px;
        `;
        aiTagsLabel.textContent = "✨ AI Suggested Tags";
        aiTagsLabel.title = "Tags suggested by CLIP image analysis — click + to accept";

        const aiTagsChips = document.createElement("div");
        aiTagsChips.style.cssText = "display: flex; flex-wrap: wrap; gap: 5px;";

        const aiDisabledHint = document.createElement("div");
        aiDisabledHint.style.cssText = `
            display: none;
            font-size: 10px;
            color: rgba(255,255,255,0.65);
            border: 1px dashed rgba(255,255,255,0.25);
            border-radius: 4px;
            padding: 6px 8px;
            background: rgba(255,255,255,0.04);
            margin-top: 4px;
        `;
        aiDisabledHint.textContent = "AI tag suggestions are disabled (enable vector search env var).";

        const loadingHint = document.createElement("span");
        loadingHint.style.cssText = "font-size: 11px; color: rgba(255,255,255,0.35); font-style: italic;";
        loadingHint.textContent = "Loading…";
        aiTagsChips.appendChild(loadingHint);

        aiTagsContainer.appendChild(aiTagsLabel);
        aiTagsContainer.appendChild(aiTagsChips);
        aiTagsContainer.appendChild(aiDisabledHint);

        // Async: fetch and render suggestion chips
        (async () => {
            try {
                const res = await vectorGetAutoTags(assetId);
                const serviceUnavailable = !res?.ok && (
                    String(res?.code || "").toUpperCase() === "SERVICE_UNAVAILABLE"
                    || /vector search is not enabled/i.test(String(res?.error || ""))
                );
                if (serviceUnavailable) {
                    aiTagsChips.replaceChildren();
                    aiDisabledHint.style.display = "block";
                    return;
                }
                const suggestions = Array.isArray(res?.data) ? res.data : [];

                // Filter out tags user already has
                const existingTags = new Set(Array.isArray(asset?.tags) ? asset.tags.map(t => String(t).toLowerCase()) : []);
                const pending = suggestions.filter(t => !existingTags.has(String(t).toLowerCase()));

                aiTagsChips.replaceChildren();
                if (!pending.length) {
                    aiTagsContainer.style.display = "none";
                    return;
                }

                for (const tag of pending) {
                    const chip = document.createElement("button");
                    chip.type = "button";
                    chip.style.cssText = `
                        display: inline-flex;
                        align-items: center;
                        gap: 4px;
                        padding: 3px 8px;
                        border-radius: 12px;
                        border: 1px solid rgba(0, 188, 212, 0.3);
                        background: rgba(0, 188, 212, 0.08);
                        color: rgba(0, 188, 212, 0.85);
                        font-size: 11px;
                        cursor: pointer;
                        transition: all 0.12s ease;
                    `;
                    chip.title = `Accept AI suggestion: ${tag}`;

                    const labelSpan = document.createElement("span");
                    labelSpan.textContent = tag;
                    const plusSpan = document.createElement("span");
                    plusSpan.textContent = "+";
                    plusSpan.style.cssText = "font-weight: 700; font-size: 12px; opacity: 0.8;";
                    chip.appendChild(labelSpan);
                    chip.appendChild(plusSpan);

                    chip.addEventListener("mouseenter", () => {
                        chip.style.background = "rgba(0, 188, 212, 0.2)";
                        chip.style.borderColor = "rgba(0, 188, 212, 0.6)";
                    });
                    chip.addEventListener("mouseleave", () => {
                        chip.style.background = "rgba(0, 188, 212, 0.08)";
                        chip.style.borderColor = "rgba(0, 188, 212, 0.3)";
                    });

                    chip.addEventListener("click", async () => {
                        try {
                            const newTags = Array.isArray(asset.tags) ? [...asset.tags, tag] : [tag];
                            asset.tags = newTags;
                            tagsEditor?._mjrSetTags?.(newTags);
                            if (onUpdate) onUpdate(asset);
                            await updateAssetTags(assetId, newTags);
                            chip.remove();
                            if (!aiTagsChips.children.length) aiTagsContainer.style.display = "none";
                        } catch (e) { console.debug?.(e); }
                    });

                    aiTagsChips.appendChild(chip);
                }
            } catch (e) {
                aiTagsContainer.style.display = "none";
            }
        })();

        section.appendChild(aiTagsContainer);
    }

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
