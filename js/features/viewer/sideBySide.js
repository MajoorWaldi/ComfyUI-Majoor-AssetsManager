import { normalizeGenerationMetadata } from "../../components/sidebar/parsers/geninfoParser.js";

// ── Compact grid gen-info helpers ─────────────────────────────────────────────

function _escHtml(s) {
    return String(s ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function _extractGridGenInfo(asset) {
    if (!asset) return null;
    try {
        const candidate = asset.geninfo
            ? { geninfo: asset.geninfo }
            : (asset.metadata || asset.metadata_raw || asset);
        const norm = normalizeGenerationMetadata(candidate) || null;
        if (norm && typeof norm === "object") {
            const out = {
                prompt:    norm.prompt || (candidate?.prompt ? String(candidate.prompt) : "") || "",
                seed:      norm.seed != null ? String(norm.seed) : "",
                sampler:   norm.sampler ? String(norm.sampler) : "",
                scheduler: norm.scheduler ? String(norm.scheduler) : "",
                cfg:       norm.cfg != null ? String(norm.cfg) : "",
                step:      norm.steps != null ? String(norm.steps) : "",
                genTime:   "",
            };
            const ms = asset.generation_time_ms
                ?? candidate?.generation_time_ms
                ?? candidate?.geninfo?.generation_time_ms
                ?? 0;
            if (ms && Number.isFinite(Number(ms)) && ms > 0 && ms < 86400000) {
                out.genTime = (Number(ms) / 1000).toFixed(1) + "s";
            }
            return out;
        }
    } catch { /* fall through */ }
    // Fallback: read common flat fields
    const meta = asset.meta || asset.metadata || asset.parsed_meta || asset;
    const ms = asset.generation_time_ms ?? meta?.generation_time_ms ?? 0;
    return {
        prompt:    meta?.prompt || meta?.text || "",
        seed:      meta?.seed != null ? String(meta.seed) : (meta?.noise_seed != null ? String(meta.noise_seed) : ""),
        sampler:   meta?.sampler || meta?.sampler_name || "",
        scheduler: meta?.scheduler || "",
        cfg:       meta?.cfg != null ? String(meta.cfg) : (meta?.cfg_scale != null ? String(meta.cfg_scale) : ""),
        step:      meta?.steps != null ? String(meta.steps) : "",
        genTime:   (ms && Number.isFinite(Number(ms)) && ms > 0 && ms < 86400000)
            ? (Number(ms) / 1000).toFixed(1) + "s"
            : "",
    };
}

/**
 * Build a compact gen-info overlay for one cell of the 2×2 / 2×1 grid.
 * The overlay is absolutely positioned at the bottom of the cell and
 * is non-interactive (pointer-events:none) so clicks pass through to the media.
 */
function _buildGridCompactOverlay(asset, label) {
    const info = _extractGridGenInfo(asset);
    if (!info) return null;

    const { prompt, seed, sampler, scheduler, cfg, step, genTime } = info;

    // Build compact second line: seed · cfg · sampler · scheduler · steps · gentime
    const detail = [
        seed      ? `Seed: ${seed}` : "",
        cfg       ? `CFG: ${cfg}` : "",
        sampler   ? `Sampler: ${sampler}` : "",
        scheduler ? `Sched: ${scheduler}` : "",
        step      ? `Steps: ${step}` : "",
        genTime   ? `Gen: ${genTime}` : "",
    ].filter(Boolean).join(" · ");

    if (!prompt && !detail) return null;

    const overlay = document.createElement("div");
    overlay.style.cssText = [
        "position:absolute",
        "left:6px",
        "right:6px",
        "bottom:6px",
        "background:rgba(0,0,0,0.68)",
        "color:#fff",
        "padding:5px 8px",
        "border-radius:6px",
        "font-size:10px",
        "line-height:1.4",
        "max-height:38%",
        "overflow:hidden",
        "word-break:break-word",
        "backdrop-filter:blur(4px)",
        "-webkit-backdrop-filter:blur(4px)",
        "border:1px solid rgba(255,255,255,0.12)",
        "box-shadow:0 2px 6px rgba(0,0,0,0.45)",
        "pointer-events:none",
        "z-index:2",
        "box-sizing:border-box",
    ].join(";");

    const shortPrompt = prompt.length > 160 ? prompt.slice(0, 160) + "…" : prompt;
    let html = `<div style="display:flex;align-items:baseline;gap:5px;flex-wrap:wrap;margin-bottom:${detail ? "3" : "0"}px;">`;
    html += `<span style="background:rgba(255,255,255,0.2);border-radius:3px;padding:0 4px;font-weight:700;font-size:9px;letter-spacing:0.06em;flex-shrink:0;">${_escHtml(label)}</span>`;
    if (prompt) {
        html += `<span><span style="color:#7ec8ff;font-weight:600;">Prompt:</span> ${_escHtml(shortPrompt)}</span>`;
    }
    html += `</div>`;
    if (detail) {
        html += `<div style="color:rgba(255,255,255,0.65);font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${_escHtml(detail)}</div>`;
    }
    overlay.innerHTML = html;
    return overlay;
}

// ── Main render function ───────────────────────────────────────────────────────

export function renderSideBySideView({
    sideView,
    state,
    currentAsset,
    viewUrl,
    buildAssetViewURL,
    createMediaElement,
    destroyMediaProcessorsIn,
} = {}) {
    try {
        destroyMediaProcessorsIn?.(sideView);
    } catch (e) { console.debug?.(e); }
    try {
        if (sideView) sideView.innerHTML = "";
    } catch (e) { console.debug?.(e); }

    if (!sideView || !state || !currentAsset) return;

    const items = Array.isArray(state.assets) ? state.assets.slice(0, 4) : [];
    const count = items.length;
    const hasFilmstripCompare = !!state.compareAsset;

    if (count > 2 && !hasFilmstripCompare) {
        // 2x2 grid (3 or 4 items). Do not wrap in another container: theme CSS targets direct children.
        try {
            sideView.style.display = "grid";
            sideView.style.gridTemplateColumns = "1fr 1fr";
            sideView.style.gridTemplateRows = "1fr 1fr";
            sideView.style.gap = "2px";
            sideView.style.padding = "2px";
        } catch (e) { console.debug?.(e); }

        const LABELS = ["A", "B", "C", "D"];
        for (let i = 0; i < 4; i++) {
            const cell = document.createElement("div");
            cell.style.cssText = `
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(255,255,255,0.05);
                overflow: hidden;
            `;
            const a = items[i];
            if (a) {
                let u = "";
                try {
                    u = buildAssetViewURL?.(a) || "";
                } catch (e) { console.debug?.(e); }
                try {
                    const media = createMediaElement?.(a, u);
                    if (media) cell.appendChild(media);
                } catch (e) { console.debug?.(e); }
                try {
                    const overlay = _buildGridCompactOverlay(a, LABELS[i]);
                    if (overlay) cell.appendChild(overlay);
                } catch (e) { console.debug?.(e); }
            } else {
                // Empty slot — show label badge so slot position is clear
                const badge = document.createElement("div");
                badge.style.cssText = "position:absolute;top:6px;left:6px;background:rgba(255,255,255,0.12);border-radius:3px;padding:1px 6px;font-size:9px;font-weight:700;color:rgba(255,255,255,0.4);letter-spacing:0.06em;";
                badge.textContent = LABELS[i];
                cell.appendChild(badge);
            }
            try {
                sideView.appendChild(cell);
            } catch (e) { console.debug?.(e); }
        }
        return;
    }

    const other =
        state.compareAsset ||
        (Array.isArray(state.assets) && state.assets.length === 2 ? state.assets[1 - (state.currentIndex || 0)] : null) ||
        currentAsset;
    const compareUrl = (() => {
        try {
            return buildAssetViewURL?.(other);
        } catch {
            return "";
        }
    })();

    const leftPanel = document.createElement("div");
    leftPanel.style.cssText = `
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255,255,255,0.05);
        overflow: hidden;
    `;
    const leftMedia = createMediaElement?.(currentAsset, viewUrl);
    if (leftMedia) leftPanel.appendChild(leftMedia);

    const rightPanel = document.createElement("div");
    rightPanel.style.cssText = `
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255,255,255,0.05);
        overflow: hidden;
    `;
    const rightMedia = createMediaElement?.(other, compareUrl);
    if (rightMedia) rightPanel.appendChild(rightMedia);

    try {
        sideView.style.display = "flex";
        sideView.style.flexDirection = "row";
        sideView.style.gap = "2px";
        sideView.style.padding = "0";
    } catch (e) { console.debug?.(e); }
    try {
        sideView.appendChild(leftPanel);
        sideView.appendChild(rightPanel);
    } catch (e) { console.debug?.(e); }

    // Tag roles for the global viewer bar (so it controls the "A" side by default).
    try {
        const leftVideo = leftMedia?.querySelector?.(".mjr-viewer-video-src") || leftMedia?.querySelector?.("video");
        const rightVideo = rightMedia?.querySelector?.(".mjr-viewer-video-src") || rightMedia?.querySelector?.("video");
        const leftAudio = leftMedia?.querySelector?.(".mjr-viewer-audio-src") || leftMedia?.querySelector?.("audio");
        const rightAudio = rightMedia?.querySelector?.(".mjr-viewer-audio-src") || rightMedia?.querySelector?.("audio");
        if (leftVideo?.dataset) leftVideo.dataset.mjrCompareRole = "A";
        if (rightVideo?.dataset) rightVideo.dataset.mjrCompareRole = "B";
        if (leftAudio?.dataset) leftAudio.dataset.mjrCompareRole = "A";
        if (rightAudio?.dataset) rightAudio.dataset.mjrCompareRole = "B";
    } catch (e) { console.debug?.(e); }

    // Video sync is handled centrally by the viewer bar (Viewer.js) so we avoid double-sync here.
}
