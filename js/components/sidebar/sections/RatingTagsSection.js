import { createRatingEditor } from "../../RatingEditor.js";
import { createTagsEditor } from "../../TagsEditor.js";
import { createSection } from "../utils/dom.js";
import { vectorGetAutoTags, vectorIndexAsset, updateAssetTags } from "../../../api/client.js";
import { loadMajoorSettings } from "../../../app/settings.js";

function _normalizeTag(raw) {
    const value = String(raw || "").trim().toLowerCase();
    return value || "";
}

function _coerceTags(raw) {
    if (Array.isArray(raw)) {
        return raw
            .map((tag) => String(tag || "").trim())
            .filter(Boolean);
    }
    if (typeof raw === "string") {
        const text = raw.trim();
        if (!text) return [];
        try {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed)) {
                return parsed
                    .map((tag) => String(tag || "").trim())
                    .filter(Boolean);
            }
        } catch (e) {
            console.debug?.(e);
        }
        return text
            .split(",")
            .map((part) => String(part || "").trim())
            .filter(Boolean);
    }
    return [];
}

function _coerceRating(raw) {
    const value = Number(raw);
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(5, Math.round(value)));
}

function _coercePositiveInt(raw) {
    const value = Number(raw);
    if (!Number.isFinite(value)) return 0;
    const intValue = Math.trunc(value);
    return intValue > 0 ? intValue : 0;
}

function _isVectorDisabledResponse(res) {
    return !res?.ok && (
        String(res?.code || "").toUpperCase() === "SERVICE_UNAVAILABLE"
        || /vector search is not enabled/i.test(String(res?.error || ""))
    );
}

function _isAiEnabled() {
    try {
        const settings = loadMajoorSettings();
        return !!(settings?.ai?.vectorSearchEnabled ?? true);
    } catch {
        return true;
    }
}

function _dedupeTags(tags) {
    const out = [];
    const seen = new Set();
    for (const raw of Array.isArray(tags) ? tags : []) {
        const tag = String(raw || "").trim();
        if (!tag) continue;
        const key = _normalizeTag(tag);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push(tag);
    }
    return out;
}

export function createRatingTagsSection(asset, onUpdate) {
    const section = createSection("Rating & Tags");

    asset = asset && typeof asset === "object" ? asset : {};
    asset.rating = _coerceRating(asset.rating);
    asset.tags = _dedupeTags(_coerceTags(asset.tags));

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
        asset.rating = _coerceRating(newRating);
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
    } catch (e) {
        console.debug?.(e);
    }

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
        asset.tags = _coerceTags(newTags);
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

    const aiEnabled = _isAiEnabled();
    const assetId = _coercePositiveInt(asset?.id);
    if (assetId > 0) {
        const aiTagsContainer = document.createElement("div");
        aiTagsContainer.classList.add("mjr-ai-tags-box");
        if (!aiEnabled) {
            aiTagsContainer.classList.add("mjr-ai-disabled-block");
        }
        aiTagsContainer.style.marginTop = "12px";

        const aiHeader = document.createElement("div");
        aiHeader.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 6px;
        `;

        const aiTagsLabel = document.createElement("div");
        aiTagsLabel.style.cssText = `
            font-size: 11px;
            font-weight: 700;
            color: rgba(0, 188, 212, 0.75);
            text-transform: uppercase;
            letter-spacing: 0.7px;
            display: flex;
            align-items: center;
            gap: 5px;
        `;
        aiTagsLabel.textContent = "AI Suggested Tags";
        aiTagsLabel.title = "Tags suggested by SigLIP2 image analysis; click + to accept";

        const refreshBtn = document.createElement("button");
        refreshBtn.type = "button";
        refreshBtn.classList.add("mjr-ai-control");
        refreshBtn.textContent = "Refresh";
        refreshBtn.style.cssText = `
            border: 1px solid rgba(0,188,212,0.45);
            background: rgba(0,188,212,0.12);
            color: #00BCD4;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
            padding: 2px 8px;
            cursor: pointer;
        `;

        const aiTagsChips = document.createElement("div");
        aiTagsChips.style.cssText = "display: flex; flex-wrap: wrap; gap: 5px;";

        const statusHint = document.createElement("div");
        statusHint.style.cssText = `
            font-size: 10px;
            color: rgba(255,255,255,0.68);
            border: 1px dashed rgba(255,255,255,0.25);
            border-radius: 4px;
            padding: 6px 8px;
            background: rgba(255,255,255,0.04);
            margin-top: 6px;
        `;
        statusHint.textContent = "Loading AI tag suggestions...";

        const getExistingTagKeys = () => {
            const keys = new Set();
            for (const tag of _coerceTags(asset?.tags)) {
                const key = _normalizeTag(tag);
                if (key) keys.add(key);
            }
            return keys;
        };

        const createSuggestionChip = (tag) => {
            const chip = document.createElement("button");
            chip.type = "button";
            chip.classList.add("mjr-ai-control");
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
            if (!aiEnabled) {
                chip.disabled = true;
            }

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
                const existing = _coerceTags(asset.tags);
                const next = _dedupeTags([...existing, tag]);
                try {
                    const result = await updateAssetTags(assetId, next);
                    if (!result?.ok) return;
                    const persisted = _dedupeTags(_coerceTags(result?.data?.tags ?? next));
                    asset.tags = persisted;
                    tagsEditor?._mjrSetTags?.(persisted);
                    if (onUpdate) onUpdate(asset);
                    chip.remove();
                    if (!aiTagsChips.children.length) {
                        statusHint.textContent = "All AI suggestions are already applied.";
                        statusHint.style.display = "block";
                    }
                } catch (e) {
                    console.debug?.(e);
                }
            });

            return chip;
        };

        const renderSuggestions = (rawSuggestions) => {
            const suggestions = _dedupeTags(_coerceTags(rawSuggestions));
            const existingKeys = getExistingTagKeys();
            const pending = suggestions.filter((tag) => !existingKeys.has(_normalizeTag(tag)));

            aiTagsChips.replaceChildren();
            if (!pending.length) {
                statusHint.textContent = "No AI tag suggestions yet for this asset.";
                statusHint.style.display = "block";
                return;
            }

            statusHint.style.display = "none";
            for (const tag of pending) {
                aiTagsChips.appendChild(createSuggestionChip(tag));
            }
        };

        const setLoadingState = (loading) => {
            refreshBtn.disabled = !aiEnabled || !!loading;
            refreshBtn.style.opacity = !aiEnabled || loading ? "0.65" : "1";
            refreshBtn.style.cursor = !aiEnabled || loading ? "default" : "pointer";
        };

        let _autoTagBootstrapAttempted = false;

        const _tryGenerateAndReloadSuggestions = async () => {
            if (!aiEnabled || assetId <= 0) return null;
            try {
                statusHint.style.display = "block";
                statusHint.textContent = "Generating AI tag suggestions...";
                const indexRes = await vectorIndexAsset(assetId);
                if (_isVectorDisabledResponse(indexRes)) {
                    aiTagsChips.replaceChildren();
                    statusHint.textContent = "AI tag suggestions are disabled (vector search is off).";
                    statusHint.style.display = "block";
                    return [];
                }
                if (!indexRes?.ok) return null;
                const retryRes = await vectorGetAutoTags(assetId);
                if (_isVectorDisabledResponse(retryRes)) {
                    aiTagsChips.replaceChildren();
                    statusHint.textContent = "AI tag suggestions are disabled (vector search is off).";
                    statusHint.style.display = "block";
                    return [];
                }
                if (!retryRes?.ok) return null;
                return _coerceTags(retryRes?.data);
            } catch (e) {
                console.debug?.(e);
                return null;
            }
        };

        const loadSuggestions = async ({ forceNetwork = false } = {}) => {
            if (!aiEnabled) {
                setLoadingState(false);
                aiTagsChips.replaceChildren();
                statusHint.style.display = "block";
                statusHint.textContent = "AI tag suggestions are disabled in settings.";
                return;
            }
            setLoadingState(true);
            statusHint.style.display = "block";
            statusHint.textContent = "Loading AI tag suggestions...";

            const localSuggestions = forceNetwork ? [] : _coerceTags(asset?.auto_tags);
            if (localSuggestions.length) {
                renderSuggestions(localSuggestions);
            }

            try {
                const res = await vectorGetAutoTags(assetId);
                if (_isVectorDisabledResponse(res)) {
                    aiTagsChips.replaceChildren();
                    statusHint.textContent = "AI tag suggestions are disabled (vector search is off).";
                    statusHint.style.display = "block";
                    return;
                }
                if (!res?.ok) {
                    if (!localSuggestions.length) {
                        aiTagsChips.replaceChildren();
                        statusHint.textContent = "Unable to load AI suggestions right now.";
                        statusHint.style.display = "block";
                    }
                    return;
                }

                let suggestions = _coerceTags(res?.data);
                const shouldTryBootstrap =
                    !suggestions.length
                    && (forceNetwork || !_autoTagBootstrapAttempted);
                if (shouldTryBootstrap) {
                    _autoTagBootstrapAttempted = true;
                    const generated = await _tryGenerateAndReloadSuggestions();
                    if (Array.isArray(generated)) {
                        suggestions = _coerceTags(generated);
                    }
                }
                asset.auto_tags = suggestions;
                renderSuggestions(suggestions);
            } catch (e) {
                console.debug?.(e);
                if (!localSuggestions.length) {
                    aiTagsChips.replaceChildren();
                    statusHint.textContent = "Unable to load AI suggestions right now.";
                    statusHint.style.display = "block";
                }
            } finally {
                setLoadingState(false);
            }
        };

        refreshBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            void loadSuggestions({ forceNetwork: true });
        });

        aiHeader.appendChild(aiTagsLabel);
        aiHeader.appendChild(refreshBtn);
        aiTagsContainer.appendChild(aiHeader);
        aiTagsContainer.appendChild(aiTagsChips);
        aiTagsContainer.appendChild(statusHint);
        section.appendChild(aiTagsContainer);

        if (aiEnabled) {
            void loadSuggestions();
        } else {
            setLoadingState(false);
            statusHint.style.display = "block";
            statusHint.textContent = "AI tag suggestions are disabled in settings.";
        }
    }

    try {
        section._mjrSetRating = (rating) => ratingEditor?._mjrSetRating?.(_coerceRating(rating));
    } catch (e) {
        console.debug?.(e);
    }
    try {
        section._mjrSetTags = (tags) => {
            const next = _coerceTags(tags);
            asset.tags = next;
            tagsEditor?._mjrSetTags?.(next);
        };
    } catch (e) {
        console.debug?.(e);
    }

    return section;
}
