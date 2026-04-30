/**
 * Badges Component - File type, rating, tags badges
 */
import { resolveAssetStatusDotColor } from "../features/status/AssetStatusDotTheme.js";
import { getRuntimeEnrichmentState } from "../stores/runtimeEnrichmentState.js";
import { detectKind } from "../features/grid/AssetCardRenderer.js";

/**
 * Create file type badge (overlaid on thumbnail)
 */
function _buildCollisionTitle({ ext = "", filename = "", count = 0, paths = [] } = {}) {
    const safeExt = String(ext || "").trim();
    const safeName = String(filename || "").trim();
    const n = Math.max(0, Number(count) || 0);
    const list = Array.isArray(paths)
        ? paths.map((p) => String(p || "").trim()).filter(Boolean)
        : [];
    if (n < 2) return `${safeExt} file`;
    const lines = [`${safeExt}+ name collision in current view (${n})`];
    if (safeName) lines.push(`Name: ${safeName}`);
    if (list.length) {
        lines.push("Paths:");
        for (const p of list.slice(0, 4)) lines.push(`- ${p}`);
        if (list.length > 4) lines.push(`- ... +${list.length - 4} more`);
    }
    lines.push("Click to select collisions in current view");
    return lines.join("\n");
}

export function createFileBadge(filename, kind, nameCollision = false, collisionMeta = null) {
    const badge = document.createElement("div");
    badge.className = "mjr-file-badge";

    const ext =
        String(filename || "")
            .split(".")
            .pop()
            ?.toUpperCase?.() || "";
    try {
        badge.dataset.mjrExt = ext;
    } catch (e) {
        console.debug?.(e);
    }

    const category = detectKind({ kind }, ext);

    const cssVarMap = {
        image: "--mjr-badge-image",
        video: "--mjr-badge-video",
        audio: "--mjr-badge-audio",
        model3d: "--mjr-badge-model3d",
    };
    const cssVar = cssVarMap[category];
    const bgColor = cssVar ? `var(${cssVar}, #607D8B)` : "#607D8B";

    const alertBg = "var(--mjr-badge-duplicate-alert, #ff1744)";
    const normalBg = bgColor;
    const currentBg = nameCollision ? alertBg : normalBg;
    badge.textContent = ext + (nameCollision ? "+" : "");
    badge.title = nameCollision
        ? _buildCollisionTitle({
              ext,
              filename,
              count: collisionMeta?.count,
              paths: collisionMeta?.paths,
          })
        : `${ext} file`;
    badge.style.cssText = `
        position: absolute;
        top: 6px;
        left: 6px;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 700;
        background: ${currentBg};
        opacity: 0.85;
        color: white;
        text-transform: uppercase;
        pointer-events: auto;
        z-index: 10;
        letter-spacing: 0.5px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        cursor: ${nameCollision ? "pointer" : "default"};
    `;
    try {
        badge.dataset.mjrBadgeBg = normalBg;
    } catch (e) {
        console.debug?.(e);
    }

    return badge;
}

export function setFileBadgeCollision(badgeEl, nameCollision, collisionMeta = null) {
    if (!badgeEl) return;
    try {
        const ext = badgeEl.dataset?.mjrExt || "";
        const normalBg = badgeEl.dataset?.mjrBadgeBg || "var(--mjr-badge-image, #607D8B)";
        const alertBg = "var(--mjr-badge-duplicate-alert, #ff1744)";
        badgeEl.textContent = String(ext || "") + (nameCollision ? "+" : "");
        badgeEl.title = nameCollision
            ? _buildCollisionTitle({
                  ext,
                  filename: collisionMeta?.filename || "",
                  count: collisionMeta?.count,
                  paths: collisionMeta?.paths,
              })
            : `${ext} file`;
        badgeEl.style.background = nameCollision ? alertBg : normalBg;
        badgeEl.style.cursor = nameCollision ? "pointer" : "default";
    } catch (e) {
        console.debug?.(e);
    }
}

function toBoolish(value) {
    if (value === true) return true;
    if (value === false) return false;
    if (value === 1 || value === "1") return true;
    if (value === 0 || value === "0") return false;
    return null;
}

function getFirstPresent(asset, keys = []) {
    if (!asset || typeof asset !== "object") return null;
    for (const key of keys) {
        if (asset[key] != null) return asset[key];
    }
    return null;
}

function hasNonEmptyText(value) {
    return typeof value === "string" && value.trim().length > 0;
}

function hasStructuredData(value) {
    if (Array.isArray(value)) return value.some((item) => String(item ?? "").trim().length > 0);
    if (value && typeof value === "object") return Object.keys(value).length > 0;
    if (typeof value !== "string") return false;

    const text = value.trim();
    if (!text || text === "[]" || text === "[ ]") return false;
    if (/^(null|none)$/i.test(text)) return false;

    if (
        (text.startsWith("[") && text.endsWith("]")) ||
        (text.startsWith("{") && text.endsWith("}"))
    ) {
        try {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed)) {
                return parsed.some((item) => String(item ?? "").trim().length > 0);
            }
            if (parsed && typeof parsed === "object") {
                return Object.keys(parsed).length > 0;
            }
            return Boolean(parsed);
        } catch (e) {
            console.debug?.(e);
        }
    }
    return true;
}

function detectAiInfo(asset) {
    const autoTagsValue = getFirstPresent(asset, [
        "auto_tags",
        "autoTags",
        "ai_auto_tags",
        "aiAutoTags",
        "suggested_tags",
        "suggestedTags",
    ]);
    const enhancedPromptValue = getFirstPresent(asset, [
        "enhanced_caption",
        "enhancedCaption",
        "enhanced_prompt",
        "enhancedPrompt",
        "ai_enhanced_prompt",
        "aiEnhancedPrompt",
    ]);

    const hasAutoTagsFlag = toBoolish(
        getFirstPresent(asset, [
            "has_ai_auto_tags",
            "hasAiAutoTags",
            "ai_has_auto_tags",
            "aiHasAutoTags",
        ]),
    );
    const hasEnhancedPromptFlag = toBoolish(
        getFirstPresent(asset, [
            "has_ai_enhanced_caption",
            "hasAiEnhancedCaption",
            "ai_has_enhanced_caption",
            "aiHasEnhancedCaption",
        ]),
    );
    const hasVectorFlag = toBoolish(
        getFirstPresent(asset, [
            "has_ai_vector",
            "hasAiVector",
            "has_vector_embedding",
            "hasVectorEmbedding",
            "vector_indexed",
            "vectorIndexed",
        ]),
    );
    const hasAiInfoFlag = toBoolish(
        getFirstPresent(asset, ["has_ai_info", "hasAiInfo", "ai_indexed", "aiIndexed"]),
    );

    const hasAutoTags =
        hasAutoTagsFlag === true || (hasAutoTagsFlag === null && hasStructuredData(autoTagsValue));
    const hasEnhancedPrompt =
        hasEnhancedPromptFlag === true ||
        (hasEnhancedPromptFlag === null && hasNonEmptyText(enhancedPromptValue));
    const hasVectorIndexed = hasVectorFlag === true || hasAiInfoFlag === true;
    const hasAiInfo =
        hasAiInfoFlag === true || hasAutoTags || hasEnhancedPrompt || hasVectorIndexed;

    return { hasAiInfo, hasAutoTags, hasEnhancedPrompt, hasVectorIndexed };
}

/**
 * Create workflow status dot (inline with filename)
 * States:
 * - success: complete metadata
 * - warning: partial metadata
 * - error: no metadata
 * - pending/info: enrichment in progress or not parsed yet
 */
export function createWorkflowDot(asset) {
    const dot = document.createElement("span");
    dot.className = "mjr-workflow-dot mjr-asset-status-dot";

    const hasWorkflow = toBoolish(asset?.has_workflow ?? asset?.hasWorkflow);
    const hasGen = toBoolish(asset?.has_generation_data ?? asset?.hasGenerationData);
    const enrichment = getRuntimeEnrichmentState();
    const enrichmentQueue = enrichment.queueLength;
    const enrichmentActive = enrichment.active || enrichmentQueue > 0;

    let title = "Pending: parsing metadata\u2026";

    const anyTrue = hasWorkflow === true || hasGen === true;
    const anyFalse = hasWorkflow === false || hasGen === false;
    const anyUnknown = hasWorkflow === null || hasGen === null;

    if (hasWorkflow === true && hasGen === true) {
        title = "Complete: workflow + generation data detected";
    } else if (anyTrue) {
        title =
            hasWorkflow === true
                ? "Partial: workflow only (generation data missing)"
                : "Partial: generation data only (workflow missing)";
    } else if (anyFalse && !anyTrue && !anyUnknown) {
        title = "None: no workflow or generation data found";
    } else if (anyUnknown) {
        title = "Pending: metadata not parsed yet";
    }

    let status = anyUnknown
        ? "pending"
        : hasWorkflow === true && hasGen === true
          ? "success"
          : anyTrue
            ? "warning"
            : "error";
    if (enrichmentActive && status !== "success") {
        status = "pending";
        title =
            enrichmentQueue > 0
                ? `Pending: database metadata enrichment in progress (${enrichmentQueue} queued)`
                : "Pending: database metadata enrichment in progress";
    }
    applyAssetStatusDotState(dot, status, title, { asset });
    const ai = detectAiInfo(asset);
    if (ai.hasAiInfo) {
        const aiBits = [];
        if (ai.hasVectorIndexed) aiBits.push("vector indexed");
        if (ai.hasAutoTags) aiBits.push("AI tag suggestions");
        if (ai.hasEnhancedPrompt) aiBits.push("enhanced prompt");

        dot.textContent = "";
        const icon = document.createElement("i");
        icon.className = "pi pi-sparkles";
        icon.setAttribute("aria-hidden", "true");
        icon.style.fontSize = "11px";
        icon.style.lineHeight = "1";
        dot.appendChild(icon);

        try {
            dot.dataset.mjrAi = "1";
        } catch (e) {
            console.debug?.(e);
        }
        dot.title = `${title}\nAI: ${aiBits.length ? aiBits.join(", ") : "indexed"}\nClick to rescan this file`;
    } else {
        try {
            dot.dataset.mjrAi = "0";
        } catch (e) {
            console.debug?.(e);
        }
        dot.textContent = "\u25CF";
        dot.title = `${title}\nClick to rescan this file`;
    }

    return dot;
}

export function applyAssetStatusDotState(dot, state, title = "", context = {}) {
    if (!dot) return;
    const s = String(state || "").toLowerCase();
    const color = resolveAssetStatusDotColor(s, { dot, ...(context || {}) });

    try {
        dot.dataset.mjrStatus = s || "neutral";
    } catch (e) {
        console.debug?.(e);
    }
    dot.style.cssText = `
        color: ${color};
        margin-left: 4px;
        font-size: 12px;
        line-height: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: color 0.25s ease, opacity 0.25s ease;
    `;
    if (title) {
        try {
            dot.title = String(title);
        } catch (e) {
            console.debug?.(e);
        }
    }
}

/**
 * Create rating badge (stars) - Top right position
 */
export function createRatingBadge(rating) {
    const ratingValue = Math.max(0, Math.min(5, Number(rating) || 0));
    if (ratingValue <= 0) return null;

    const badge = document.createElement("div");
    badge.className = "mjr-rating-badge";
    badge.title = `Rating: ${ratingValue} star${ratingValue > 1 ? "s" : ""}`;
    badge.style.cssText = `
        position: absolute;
        top: 6px;
        right: 6px;
        background: rgba(0, 0, 0, 0.55);
        border: 1px solid rgba(255, 255, 255, 0.12);
        padding: 2px 6px;
        border-radius: 6px;
        font-size: 13px;
        letter-spacing: 1px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        z-index: 10;
        text-shadow: 0 2px 6px rgba(0,0,0,0.6);
        box-shadow: 0 6px 18px rgba(0,0,0,0.25);
    `;

    for (let i = 1; i <= ratingValue; i++) {
        const star = document.createElement("span");
        star.textContent = "\u2605";
        star.style.color = "var(--mjr-rating-color, var(--mjr-star-active, #FFD45A))";
        star.style.marginRight = i < ratingValue ? "2px" : "0";
        badge.appendChild(star);
    }

    return badge;
}

/**
 * Create tags badge - Bottom left position
 */
function _normalizeBadgeTags(tags) {
    if (Array.isArray(tags)) {
        return tags.map((tag) => String(tag ?? "").trim()).filter(Boolean);
    }
    if (typeof tags === "string") {
        const raw = tags.trim();
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return parsed.map((tag) => String(tag ?? "").trim()).filter(Boolean);
            }
        } catch {}
        return raw
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean);
    }
    return [];
}

/**
 * Returns a CSS color string for a given generation time in milliseconds.
 * Thresholds: green < 10s, light-green < 30s, yellow < 60s, orange >= 60s.
 */
export function genTimeColor(ms) {
    const secs = Number(ms) / 1000;
    if (secs >= 60) return "#FF9800";
    if (secs >= 30) return "#FFC107";
    if (secs >= 10) return "#8BC34A";
    return "#4CAF50";
}

/**
 * Format generation time for display.
 * Shows seconds (e.g. "45.2s") when < 60s, minutes (e.g. "3.6m") when >= 60s.
 * Returns { text, title } for badge display.
 */
export function formatGenTime(ms) {
    const totalSecs = ms / 1000;
    if (totalSecs >= 60) {
        const mins = (totalSecs / 60).toFixed(1);
        return {
            text: `${mins}m`,
            title: `Generation time: ${mins} minutes (${totalSecs.toFixed(1)}s)`,
        };
    }
    const secs = totalSecs.toFixed(1);
    return {
        text: `${secs}s`,
        title: `Generation time: ${secs} seconds`,
    };
}

/**
 * Normalize generation time into milliseconds.
 * Accepts plain numbers, numeric strings, and unit-suffixed strings like "8.2s" or "8200ms".
 * Returns 0 when invalid, non-positive, or outside sanity bounds.
 */
export function normalizeGenerationTimeMs(value, { maxMs = 86_400_000 } = {}) {
    let ms;
    if (value == null) return 0;
    if (typeof value === "string") {
        const raw = value.trim().toLowerCase();
        if (!raw) return 0;
        const secMatch = raw.match(/^(-?\d+(?:[.,]\d+)?)\s*(s|sec|secs|second|seconds)$/i);
        if (secMatch) {
            ms = Number(secMatch[1].replace(",", ".")) * 1000;
        } else {
            const msMatch = raw.match(
                /^(-?\d+(?:[.,]\d+)?)\s*(ms|msec|millisecond|milliseconds)$/i,
            );
            if (msMatch) {
                ms = Number(msMatch[1].replace(",", "."));
            } else {
                ms = Number(raw.replace(",", "."));
            }
        }
    } else {
        ms = Number(value);
    }

    if (!Number.isFinite(ms) || ms <= 0 || ms >= Number(maxMs)) return 0;
    return ms;
}

/**
 * Create generation-time badge (overlaid on thumbnail, bottom-right).
 * Returns null when genTimeMs is 0 or invalid (> 24h sanity limit).
 */
export function createGenTimeBadge(genTimeMs) {
    const ms = normalizeGenerationTimeMs(genTimeMs);
    if (!ms) return null;

    const badge = document.createElement("div");
    badge.className = "mjr-gentime-badge";
    const fmt = formatGenTime(ms);
    badge.textContent = fmt.text;
    badge.title = fmt.title;
    badge.style.cssText = `
        position: absolute;
        bottom: 6px;
        right: 6px;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 700;
        background: rgba(0,0,0,0.55);
        border: 1px solid rgba(255,255,255,0.12);
        color: ${genTimeColor(ms)};
        pointer-events: none;
        z-index: 10;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    `;
    return badge;
}

export function createTagsBadge(tags) {
    const badge = document.createElement("div");
    badge.className = "mjr-tags-badge";
    const normalizedTags = _normalizeBadgeTags(tags);

    if (normalizedTags.length === 0) {
        badge.style.display = "none";
        return badge;
    }

    badge.textContent = normalizedTags.join(", ");
    badge.title = `Tags: ${normalizedTags.join(", ")}`;
    badge.style.cssText = `
        position: absolute;
        bottom: 6px;
        left: 6px;
        padding: 3px 6px;
        border-radius: 4px;
        background: rgba(0,0,0,0.8);
        color: var(--mjr-tag-color, #90CAF9);
        font-size: 9px;
        max-width: 80%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        pointer-events: none;
        z-index: 10;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    `;

    return badge;
}
