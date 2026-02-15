/**
 * Badges Component - File type, rating, tags badges
 */
import { resolveAssetStatusDotColor } from "../features/status/AssetStatusDotTheme.js";

/**
 * Create file type badge (overlaid on thumbnail)
 */
function _buildCollisionTitle({ ext = "", filename = "", count = 0, paths = [] } = {}) {
    const safeExt = String(ext || "").trim();
    const safeName = String(filename || "").trim();
    const n = Math.max(0, Number(count) || 0);
    const list = Array.isArray(paths) ? paths.map((p) => String(p || "").trim()).filter(Boolean) : [];
    if (n < 2) return `${safeExt} file`;
    const lines = [
        `${safeExt}+ name collision in current view (${n})`,
    ];
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

    const ext = String(filename || "").split(".").pop()?.toUpperCase?.() || "";
    try {
        badge.dataset.mjrExt = ext;
    } catch {}

    let category = "unknown";
    switch (ext) {
        case "PNG": case "JPG": case "JPEG": case "WEBP": case "GIF": case "BMP": case "TIF": case "TIFF":
            category = "image"; break;
        case "MP4": case "WEBM": case "MOV": case "AVI": case "MKV":
            category = "video"; break;
        case "MP3": case "WAV": case "OGG": case "FLAC":
            category = "audio"; break;
        case "OBJ": case "FBX": case "GLB": case "GLTF":
            category = "model3d"; break;
        default:
            category = kind || "unknown";
    }

    const cssVarMap = {
        image: "--mjr-badge-image",
        video: "--mjr-badge-video",
        audio: "--mjr-badge-audio",
        model3d: "--mjr-badge-model3d",
    };
    const cssVar = cssVarMap[category];
    const bgColor = cssVar
        ? `var(${cssVar}, #607D8B)`
        : "#607D8B";

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
    } catch {}

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
    } catch {}
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

    const toBoolish = (v) => {
        if (v === true) return true;
        if (v === false) return false;
        if (v === 1 || v === "1") return true;
        if (v === 0 || v === "0") return false;
        return null;
    };

    const hasWorkflow = toBoolish(asset?.has_workflow ?? asset?.hasWorkflow);
    const hasGen = toBoolish(asset?.has_generation_data ?? asset?.hasGenerationData);
    const enrichmentActive = !!globalThis?._mjrEnrichmentActive;

    let title = "Pending: parsing metadata\u2026";

    const anyTrue = hasWorkflow === true || hasGen === true;
    const anyFalse = hasWorkflow === false || hasGen === false;
    const anyUnknown = hasWorkflow === null || hasGen === null;

    if (hasWorkflow === true && hasGen === true) {
        title = "Complete: workflow + generation data detected";
    } else if (anyTrue) {
        title = hasWorkflow === true ? "Partial: workflow only (generation data missing)" : "Partial: generation data only (workflow missing)";
    } else if (anyFalse && !anyTrue && !anyUnknown) {
        title = "None: no workflow or generation data found";
    } else if (anyUnknown) {
        title = "Pending: metadata not parsed yet";
    }

    let status = anyUnknown ? "pending" : (hasWorkflow === true && hasGen === true ? "success" : anyTrue ? "warning" : "error");
    if (enrichmentActive && status !== "success") {
        status = "pending";
        title = "Pending: database metadata enrichment in progress";
    }
    applyAssetStatusDotState(dot, status, title, { asset });
    dot.textContent = "\u25CF";
    dot.title = `${title}\nClick to rescan this file`;

    return dot;
}

export function applyAssetStatusDotState(dot, state, title = "", context = {}) {
    if (!dot) return;
    const s = String(state || "").toLowerCase();
    const color = resolveAssetStatusDotColor(s, { dot, ...(context || {}) });

    try {
        dot.dataset.mjrStatus = s || "neutral";
    } catch {}
    dot.style.cssText = `
        color: ${color};
        margin-left: 4px;
        font-size: 12px;
        cursor: pointer;
        transition: color 0.25s ease, opacity 0.25s ease;
    `;
    if (title) {
        try {
            dot.title = String(title);
        } catch {}
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
export function createTagsBadge(tags) {
    const badge = document.createElement("div");
    badge.className = "mjr-tags-badge";

    if (!tags || tags.length === 0) {
        badge.style.display = "none";
        return badge;
    }

    badge.textContent = tags.join(", ");
    badge.title = `Tags: ${tags.join(", ")}`;
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
