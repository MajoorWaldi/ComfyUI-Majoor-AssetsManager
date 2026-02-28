/**
 * FloatingViewer (MFV) — Majoor Viewer Lite
 *
 * Lightweight floating panel: drag, CSS resize, 3 modes (Simple / A/B / Side-by-Side),
 * Live Stream toggle, and mouse-wheel zoom + click-drag pan.
 * Styled via theme-comfy.css (.mjr-mfv scope).
 */

import { EVENTS } from "../../app/events.js";
import { buildViewURL, buildAssetViewURL } from "../../api/endpoints.js";
import { ensureViewerMetadataAsset } from "./genInfo.js";
import { getAssetMetadata, getFileMetadataScoped } from "../../api/client.js";
import { normalizeGenerationMetadata } from "../../components/sidebar/parsers/geninfoParser.js";

export const MFV_MODES = Object.freeze({
    SIMPLE: "simple",
    AB:     "ab",
    SIDE:   "side",
});

// Zoom bounds and wheel sensitivity for the MFV pan/zoom.
const MFV_ZOOM_MIN    = 0.25;
const MFV_ZOOM_MAX    = 8;
const MFV_ZOOM_FACTOR = 0.0008; // multiplied by deltaY per wheel tick

// Extensions rendered as <video>
const VIDEO_EXTS = new Set([".mp4", ".webm", ".mov", ".avi", ".mkv"]);

function _extOf(filename) {
    try {
        const name = String(filename || "").trim();
        const idx = name.lastIndexOf(".");
        return idx >= 0 ? name.slice(idx).toLowerCase() : "";
    } catch { return ""; }
}

/** Detect media kind from asset data (video / gif / image). */
function _mediaKind(fileData) {
    const kind = String(fileData?.kind || "").toLowerCase();
    if (kind === "video") return "video";
    if (kind === "audio") return "audio";
    const ext = _extOf(fileData?.filename || "");
    if (ext === ".gif") return "gif";
    if (VIDEO_EXTS.has(ext)) return "video";
    return "image";
}

/** Build the ComfyUI /view URL (or download URL for full asset objects). */
function _resolveUrl(fileData) {
    if (!fileData) return "";
    if (fileData.url) return String(fileData.url);
    // Raw ComfyUI output file: { filename, subfolder, type } — no id
    if (fileData.filename && fileData.id == null) {
        return buildViewURL(
            fileData.filename,
            fileData.subfolder || "",
            fileData.type || "output"
        );
    }
    // Full asset object from backend (has id + filepath)
    if (fileData.filename) return buildAssetViewURL(fileData) || "";
    return "";
}

// ── DOM helpers ───────────────────────────────────────────────────────────────

function _makeEmptyState(msg = "No media — select assets in the grid") {
    const div = document.createElement("div");
    div.className = "mjr-mfv-empty";
    div.textContent = msg;
    return div;
}

function escapeHtml(s) {
    if (s == null) return "";
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function _makeLabel(text, side /* "left" | "right" */) {
    const el = document.createElement("div");
    el.className = `mjr-mfv-label label-${side}`;
    el.textContent = text;
    return el;
}

function _buildMediaEl(fileData, { fill = false } = {}) {
    const url = _resolveUrl(fileData);
    if (!url) return null;
    const kind = _mediaKind(fileData);
    const sizeStyle = fill
        ? "width:100%; height:100%; object-fit:contain; display:block;"
        : "max-width:100%; max-height:100%; object-fit:contain; display:block;";

    if (kind === "video") {
        const v = document.createElement("video");
        v.className = "mjr-mfv-media";
        v.src = url;
        v.controls = true;
        v.loop = true;
        v.muted = true;
        v.autoplay = true;
        v.playsInline = true;
        v.style.cssText = sizeStyle;
        return v;
    }

    // gif and image — use <img>
    const img = document.createElement("img");
    img.className = "mjr-mfv-media";
    img.src = url;
    img.alt = String(fileData?.filename || "");
    img.draggable = false;
    img.style.cssText = sizeStyle;
    return img;
}

// ── FloatingViewer class ──────────────────────────────────────────────────────

export class FloatingViewer {
    constructor() {
        this.element     = null;
        this.isVisible   = false;
        this._contentEl  = null;
        this._modeBtn    = null;
        this._liveBtn    = null;
        this._genBtn     = null;
        this._genDropdown = null;
        this._genInfoSelections = new Set(["prompt"]);
        this._mode       = MFV_MODES.SIMPLE;
        this._mediaA     = null;
        this._mediaB     = null;
        this._abDividerX = 0.5; // 0..1

        // Pan/zoom state
        this._zoom      = 1;
        this._panX      = 0;
        this._panY      = 0;
        this._panzoomAC = null; // AbortController for event cleanup
        this._dragging  = false;
    }

    // ── Build DOM ─────────────────────────────────────────────────────────────

    render() {
        const el = document.createElement("div");
        el.className = "mjr-mfv";
        // Only geometry + display lives in inline styles; everything else is CSS.
        Object.assign(el.style, {
            position:  "fixed",
            top:       "60px",
            right:     "20px",
            width:     "480px",
            height:    "380px",
            minWidth:  "220px",
            minHeight: "160px",
            display:   "none",       // shown via show()
            flexDirection: "column", // flex container
            resize:    "both",
            overflow:  "hidden",
            zIndex:    "10000",
        });

        this.element = el;
        el.appendChild(this._buildHeader());
        el.appendChild(this._buildToolbar());

        this._contentEl = document.createElement("div");
        this._contentEl.className = "mjr-mfv-content";
        el.appendChild(this._contentEl);

        this._initDrag(el.querySelector(".mjr-mfv-header"));
        this._refresh();
        return el;
    }

    _buildHeader() {
        const header = document.createElement("div");
        header.className = "mjr-mfv-header";

        const title = document.createElement("span");
        title.className = "mjr-mfv-header-title";
        title.textContent = "Majoor Viewer Lite";

        const closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.className = "mjr-icon-btn";
        closeBtn.title = "Close";
        closeBtn.innerHTML = '<i class="pi pi-times" aria-hidden="true"></i>';
        closeBtn.addEventListener("click", () => {
            window.dispatchEvent(new CustomEvent(EVENTS.MFV_CLOSE));
        });

        header.appendChild(title);
        header.appendChild(closeBtn);
        return header;
    }

    _buildToolbar() {
        const bar = document.createElement("div");
        bar.className = "mjr-mfv-toolbar";

        // Mode cycle button
        this._modeBtn = document.createElement("button");
        this._modeBtn.type = "button";
        this._modeBtn.className = "mjr-icon-btn";
        this._modeBtn.addEventListener("click", () => this._cycleMode());
        this._updateModeBtnUI();
        bar.appendChild(this._modeBtn);

        // Separator
        const sep = document.createElement("div");
        sep.className = "mjr-mfv-toolbar-sep";
        sep.setAttribute("aria-hidden", "true");
        bar.appendChild(sep);

        // Live Stream toggle
        this._liveBtn = document.createElement("button");
        this._liveBtn.type = "button";
        this._liveBtn.className = "mjr-icon-btn";
        this._liveBtn.title = "Live Stream: OFF — click to follow new generations";
        this._liveBtn.innerHTML = '<i class="pi pi-circle" aria-hidden="true"></i>';
        this._liveBtn.addEventListener("click", () => {
            window.dispatchEvent(new CustomEvent(EVENTS.MFV_LIVE_TOGGLE));
        });
        bar.appendChild(this._liveBtn);

        // Gen Info button (shows dropdown with checkboxes)
        this._genBtn = document.createElement("button");
        this._genBtn.type = "button";
        this._genBtn.className = "mjr-icon-btn";
        this._genBtn.title = "Gen Info";
        this._genBtn.innerHTML = '<i class="pi pi-info-circle" aria-hidden="true"></i>';
        this._genBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (this._genDropdown?.style?.display === "block") {
                this._closeGenDropdown();
            } else {
                this._openGenDropdown();
            }
        });
        bar.appendChild(this._genBtn);

        // Close dropdown when clicking outside
        this._handleDocClick = (ev) => {
            if (!this._genDropdown) return;
            if (ev.target === this._genBtn) return;
            if (this._genDropdown.contains(ev.target)) return;
            this._closeGenDropdown();
        };
        document.addEventListener("click", this._handleDocClick);

        return bar;
    }

    _openGenDropdown() {
        if (!this.element) return;
        if (!this._genDropdown) {
            this._genDropdown = this._buildGenDropdown();
            this._genDropdown.style.position = "absolute";
            this._genDropdown.style.zIndex = "10001";
            this.element.appendChild(this._genDropdown);
        }
        const rect = this._genBtn.getBoundingClientRect();
        const parentRect = this.element.getBoundingClientRect();
        const left = rect.left - parentRect.left;
        const top = rect.bottom - parentRect.top + 6;
        this._genDropdown.style.left = `${left}px`;
        this._genDropdown.style.top = `${top}px`;
        this._genDropdown.style.display = "block";
    }

    _closeGenDropdown() {
        if (!this._genDropdown) return;
        this._genDropdown.style.display = "none";
    }

    _buildGenDropdown() {
        const d = document.createElement("div");
        d.className = "mjr-mfv-gen-dropdown";
        d.style.cssText = "background:rgba(0,0,0,0.9); color:#fff; padding:8px; border-radius:6px; display:block; min-width:140px;";
        const opts = [
            ["prompt", "Prompt"],
            ["seed", "Seed"],
            ["model", "Model"],
            ["lora", "LoRA"],
        ];
        for (const [key, label] of opts) {
            const row = document.createElement("label");
            row.style.cssText = "display:flex; align-items:center; gap:8px; font-size:12px; margin:4px 0; cursor:pointer;";
            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.checked = this._genInfoSelections.has(key);
            cb.addEventListener("change", () => {
                if (cb.checked) this._genInfoSelections.add(key);
                else this._genInfoSelections.delete(key);
                this._refresh();
            });
            const span = document.createElement("span");
            span.textContent = label;
            row.appendChild(cb);
            row.appendChild(span);
            d.appendChild(row);
        }
        return d;
    }

    _getGenFields(fileData) {
        if (!fileData) return {};
        // Prefer normalized geninfo objects produced by backend pipeline
        try {
            const candidate = fileData.geninfo || fileData.metadata || fileData.metadata_raw || fileData;
            const norm = normalizeGenerationMetadata(candidate) || null;
            const out = { prompt: "", seed: "", model: "", lora: "" };
            if (norm && typeof norm === "object") {
                if (norm.prompt) out.prompt = String(norm.prompt);
                if (norm.seed != null) out.seed = String(norm.seed);
                if (norm.model) out.model = Array.isArray(norm.model) ? norm.model.join(", ") : String(norm.model);
                if (Array.isArray(norm.loras)) out.lora = norm.loras.map((l) => (typeof l === "string" ? l : (l?.name || l?.lora_name || ""))).filter(Boolean).join(", ");
                // Also accept flat keys
                if (!out.prompt && candidate?.prompt) out.prompt = String(candidate.prompt || "");
                return out;
            }
        } catch (e) { /* ignore and fall back */ }
        // Fallback: inspect common metadata fields
        const meta = fileData.meta || fileData.metadata || fileData.parsed || fileData.parsed_meta || fileData;
        const out = {};
        out.prompt = meta?.prompt || meta?.text || "";
        out.seed = (meta?.seed != null) ? String(meta.seed) : (meta?.noise_seed != null ? String(meta.noise_seed) : "");
        if (meta?.model) out.model = Array.isArray(meta.model) ? meta.model.join(", ") : String(meta.model);
        else out.model = meta?.model_name || "";
        out.lora = meta?.lora || meta?.loras || "";
        if (Array.isArray(out.lora)) out.lora = out.lora.join(", ");
        return out;
    }

    _formatGenInfoHTML(fileData) {
        const fields = this._getGenFields(fileData);
        if (!fields) return "";
        const parts = [];
        const order = ["prompt", "seed", "model", "lora"];
        for (const k of order) {
            if (!this._genInfoSelections.has(k)) continue;
            const v = (fields[k] != null) ? String(fields[k]) : "";
            if (!v) continue;
            const label = k === "lora" ? "LoRA" : k.charAt(0).toUpperCase() + k.slice(1);
            if (k === "prompt") {
                const short = v.length > 240 ? v.slice(0, 240) + "…" : v;
                parts.push(`<div style=\"margin-bottom:6px;line-height:1.2;\"><strong>${label}:</strong> ${escapeHtml(short)}</div>`);
            } else {
                parts.push(`<div style=\"margin-bottom:4px;line-height:1.2;\"><strong>${label}:</strong> ${escapeHtml(v)}</div>`);
            }
        }
        return parts.join("");
    }

    // ── Mode ──────────────────────────────────────────────────────────────────

    _cycleMode() {
        const order = [MFV_MODES.SIMPLE, MFV_MODES.AB, MFV_MODES.SIDE];
        this._mode = order[(order.indexOf(this._mode) + 1) % order.length];
        this._updateModeBtnUI();
        this._refresh();
    }

    setMode(mode) {
        if (!Object.values(MFV_MODES).includes(mode)) return;
        this._mode = mode;
        this._updateModeBtnUI();
        this._refresh();
    }

    _updateModeBtnUI() {
        if (!this._modeBtn) return;
        const cfg = {
            [MFV_MODES.SIMPLE]: { icon: "pi-image",  label: "Mode: Simple (click to switch)" },
            [MFV_MODES.AB]:     { icon: "pi-clone",   label: "Mode: A/B Compare (click to switch)" },
            [MFV_MODES.SIDE]:   { icon: "pi-table",   label: "Mode: Side-by-Side (click to switch)" },
        };
        const { icon = "pi-image", label = "" } = cfg[this._mode] || {};
        this._modeBtn.innerHTML = `<i class="pi ${icon}" aria-hidden="true"></i>`;
        this._modeBtn.title = label;
    }

    // ── Live Stream UI ────────────────────────────────────────────────────────

    setLiveActive(active) {
        if (!this._liveBtn) return;
        this._liveBtn.classList.toggle("mjr-live-active", Boolean(active));
        if (active) {
            this._liveBtn.innerHTML = '<i class="pi pi-circle-fill" aria-hidden="true"></i>';
            this._liveBtn.title = "Live Stream: ON — click to disable";
        } else {
            this._liveBtn.innerHTML = '<i class="pi pi-circle" aria-hidden="true"></i>';
            this._liveBtn.title = "Live Stream: OFF — click to follow new generations";
        }
    }

    // ── Media loading ─────────────────────────────────────────────────────────

    /**
     * Load one file/asset into slot A.
     * @param {object} fileData
     * @param {{ autoMode?: boolean }} opts  autoMode=true → force SIMPLE mode
     */
    loadMediaA(fileData, { autoMode = false } = {}) {
        this._mediaA = fileData || null;
        this._resetMfvZoom();
        if (autoMode && this._mode !== MFV_MODES.SIMPLE) {
            this._mode = MFV_MODES.SIMPLE;
            this._updateModeBtnUI();
        }
        // Hydrate geninfo metadata asynchronously using shared pipeline
        if (this._mediaA && typeof ensureViewerMetadataAsset === "function") {
            (async () => {
                try {
                    const enriched = await ensureViewerMetadataAsset(this._mediaA, { getAssetMetadata, getFileMetadataScoped });
                    if (enriched && typeof enriched === "object") {
                        this._mediaA = enriched;
                        this._refresh();
                    }
                } catch (e) { /* ignore */ }
            })();
        } else {
            this._refresh();
        }
    }

    /**
     * Load two assets for compare modes.
     * Auto-switches from SIMPLE → AB on first call.
     */
    loadMediaPair(a, b) {
        this._mediaA = a || null;
        this._mediaB = b || null;
        this._resetMfvZoom();
        if (this._mode === MFV_MODES.SIMPLE) {
            this._mode = MFV_MODES.AB;
            this._updateModeBtnUI();
        }
        // Hydrate both sides concurrently
        const hydrate = async (asset) => {
            if (!asset) return asset;
            try {
                const enriched = await ensureViewerMetadataAsset(asset, { getAssetMetadata, getFileMetadataScoped });
                return enriched || asset;
            } catch (e) { return asset; }
        };
        (async () => {
            const [A, B] = await Promise.all([hydrate(this._mediaA), hydrate(this._mediaB)]);
            this._mediaA = A || null;
            this._mediaB = B || null;
            this._refresh();
        })();
    }

    // ── Pan/Zoom ──────────────────────────────────────────────────────────────

    _resetMfvZoom() {
        this._zoom = 1;
        this._panX = 0;
        this._panY = 0;
    }

    /** Apply current zoom+pan state to all media elements (img/video only — divider/overlays unaffected). */
    _applyTransform() {
        if (!this._contentEl) return;
        const z  = Math.max(MFV_ZOOM_MIN, Math.min(MFV_ZOOM_MAX, this._zoom));
        const vw = this._contentEl.clientWidth  || 0;
        const vh = this._contentEl.clientHeight || 0;
        const maxX = Math.max(0, (z - 1) * vw / 2);
        const maxY = Math.max(0, (z - 1) * vh / 2);
        this._panX = Math.max(-maxX, Math.min(maxX, this._panX));
        this._panY = Math.max(-maxY, Math.min(maxY, this._panY));
        const t = `translate(${this._panX}px,${this._panY}px) scale(${z})`;
        for (const el of this._contentEl.querySelectorAll(".mjr-mfv-media")) {
            el.style.transform = t;
            el.style.transformOrigin = "center";
        }
        // Cursor feedback
        this._contentEl.style.cursor =
            z > 1.01 ? (this._dragging ? "grabbing" : "grab") : "";
    }

    /**
     * Set zoom, optionally centered at (clientX, clientY).
     * Keeps the image point under the cursor stationary.
     */
    _setMfvZoom(next, clientX, clientY) {
        const prev = Math.max(MFV_ZOOM_MIN, Math.min(MFV_ZOOM_MAX, this._zoom));
        const z    = Math.max(MFV_ZOOM_MIN, Math.min(MFV_ZOOM_MAX, Number(next) || 1));
        if (clientX != null && clientY != null && this._contentEl) {
            const r    = z / prev;
            const rect = this._contentEl.getBoundingClientRect();
            const ux   = clientX - (rect.left + rect.width  / 2);
            const uy   = clientY - (rect.top  + rect.height / 2);
            this._panX = this._panX * r + (1 - r) * ux;
            this._panY = this._panY * r + (1 - r) * uy;
        }
        this._zoom = z;
        // Snap back to exact fit to avoid drift.
        if (Math.abs(z - 1) < 0.001) { this._zoom = 1; this._panX = 0; this._panY = 0; }
        this._applyTransform();
    }

    /** Bind wheel + pointer events to the clip viewport element. */
    _initPanZoom(contentEl) {
        this._destroyPanZoom();
        if (!contentEl) return;
        this._panzoomAC = new AbortController();
        const sig = { signal: this._panzoomAC.signal };

        // Wheel → zoom centered at cursor
        contentEl.addEventListener("wheel", (e) => {
            e.preventDefault();
            const delta  = e.deltaY || e.deltaX || 0;
            const factor = 1 - delta * MFV_ZOOM_FACTOR;
            this._setMfvZoom(this._zoom * factor, e.clientX, e.clientY);
        }, { ...sig, passive: false });

        // Pointer drag → pan (left or middle button, when zoomed in)
        let panActive = false;
        let startX = 0, startY = 0, startPanX = 0, startPanY = 0;

        contentEl.addEventListener("pointerdown", (e) => {
            if (e.button !== 0 && e.button !== 1) return;
            if (this._zoom <= 1.01) return;
            // Let native video controls and the AB divider handle their own events.
            if (e.target?.closest?.("video")) return;
            if (e.target?.closest?.(".mjr-mfv-ab-divider")) return;
            e.preventDefault();
            panActive = true;
            this._dragging = true;
            startX = e.clientX; startY = e.clientY;
            startPanX = this._panX; startPanY = this._panY;
            try { contentEl.setPointerCapture(e.pointerId); } catch {}
            this._applyTransform();
        }, sig);

        contentEl.addEventListener("pointermove", (e) => {
            if (!panActive) return;
            this._panX = startPanX + (e.clientX - startX);
            this._panY = startPanY + (e.clientY - startY);
            this._applyTransform();
        }, sig);

        const endPan = (e) => {
            if (!panActive) return;
            panActive = false;
            this._dragging = false;
            try { contentEl.releasePointerCapture(e.pointerId); } catch {}
            this._applyTransform();
        };
        contentEl.addEventListener("pointerup",     endPan, sig);
        contentEl.addEventListener("pointercancel", endPan, sig);

        // Double-click → zoom to 4× at cursor, or reset to fit
        contentEl.addEventListener("dblclick", (e) => {
            if (e.target?.closest?.("video")) return;
            const isNearFit = Math.abs(this._zoom - 1) < 0.05;
            this._setMfvZoom(
                isNearFit ? Math.min(4, this._zoom * 4) : 1,
                e.clientX, e.clientY,
            );
        }, sig);
    }

    /** Remove all pan/zoom event listeners. */
    _destroyPanZoom() {
        try { this._panzoomAC?.abort(); } catch {}
        this._panzoomAC = null;
        this._dragging  = false;
    }

    // ── Render ────────────────────────────────────────────────────────────────

    _refresh() {
        if (!this._contentEl) return;
        // Tear down previous panzoom bindings before clearing DOM.
        this._destroyPanZoom();
        this._contentEl.replaceChildren();
        this._contentEl.style.overflow = "hidden";

        switch (this._mode) {
            case MFV_MODES.SIMPLE: this._renderSimple(); break;
            case MFV_MODES.AB:     this._renderAB();     break;
            case MFV_MODES.SIDE:   this._renderSide();   break;
        }

        this._applyTransform();
        this._initPanZoom(this._contentEl);
    }

    _renderSimple() {
        if (!this._mediaA) {
            this._contentEl.appendChild(_makeEmptyState());
            return;
        }
        const mediaEl = _buildMediaEl(this._mediaA);
        if (!mediaEl) {
            this._contentEl.appendChild(_makeEmptyState("Could not load media"));
            return;
        }
        const wrap = document.createElement("div");
        wrap.style.cssText =
            "width:100%; height:100%; display:flex; align-items:center; justify-content:center; overflow:hidden; position:relative;";
        wrap.appendChild(mediaEl);
        // Gen info overlay for SIMPLE mode
        const infoHtml = this._formatGenInfoHTML(this._mediaA);
        if (infoHtml) {
            const ol = document.createElement("div");
            ol.className = "mjr-mfv-geninfo";
            ol.style.cssText = "position:absolute; left:8px; right:8px; bottom:8px; background:rgba(0,0,0,0.6); color:#fff; padding:8px; border-radius:6px; font-size:12px; max-height:40%; overflow:auto;";
            ol.innerHTML = infoHtml;
            wrap.appendChild(ol);
        }
        this._contentEl.appendChild(wrap);
    }

    _renderAB() {
        const elA = this._mediaA ? _buildMediaEl(this._mediaA, { fill: true }) : null;
        const elB = this._mediaB ? _buildMediaEl(this._mediaB, { fill: true }) : null;

        if (!elA && !elB) {
            this._contentEl.appendChild(_makeEmptyState("Select 2 assets for A/B compare"));
            return;
        }
        if (!elB) {
            // Only one asset — render as simple
            this._renderSimple();
            return;
        }

        const container = document.createElement("div");
        container.style.cssText = "position:relative; width:100%; height:100%; overflow:hidden; background:#000;";

        // Layer A — full-size backdrop
        const layerA = document.createElement("div");
        layerA.style.cssText =
            "position:absolute; inset:0; display:flex; align-items:center; justify-content:center;";
        if (elA) layerA.appendChild(elA);

        // Layer B — clipped from the left edge to the divider
        const layerB = document.createElement("div");
        const pct = Math.round(this._abDividerX * 100);
        layerB.style.cssText =
            `position:absolute; inset:0; display:flex; align-items:center; justify-content:center;` +
            `clip-path:inset(0 0 0 ${pct}%);`;
        layerB.appendChild(elB);

        // Draggable divider bar
        const divider = document.createElement("div");
        divider.className = "mjr-mfv-ab-divider";
        divider.style.left = `${pct}%`;

        divider.addEventListener("pointerdown", (e) => {
            e.preventDefault();
            divider.setPointerCapture(e.pointerId);
            const rect = container.getBoundingClientRect();

            const onMove = (me) => {
                const x = Math.max(0.02, Math.min(0.98, (me.clientX - rect.left) / rect.width));
                this._abDividerX = x;
                const p = Math.round(x * 100);
                layerB.style.clipPath = `inset(0 0 0 ${p}%)`;
                divider.style.left = `${p}%`;
            };
            const onUp = () => {
                divider.removeEventListener("pointermove", onMove);
                divider.removeEventListener("pointerup", onUp);
            };
            divider.addEventListener("pointermove", onMove);
            divider.addEventListener("pointerup", onUp);
        });

        container.appendChild(layerA);
        container.appendChild(layerB);
        container.appendChild(divider);
        container.appendChild(_makeLabel("A", "left"));
        container.appendChild(_makeLabel("B", "right"));
        // Gen info overlays for AB (left/right)
        const infoA = this._formatGenInfoHTML(this._mediaA);
        if (infoA) {
            const oa = document.createElement("div");
            oa.className = "mjr-mfv-geninfo-a";
            oa.style.cssText = "position:absolute; left:8px; bottom:8px; background:rgba(0,0,0,0.6); color:#fff; padding:6px; border-radius:6px; font-size:12px; max-width:46%; max-height:40%; overflow:auto;";
            oa.innerHTML = infoA;
            container.appendChild(oa);
        }
        const infoB = this._formatGenInfoHTML(this._mediaB);
        if (infoB) {
            const ob = document.createElement("div");
            ob.className = "mjr-mfv-geninfo-b";
            ob.style.cssText = "position:absolute; right:8px; bottom:8px; background:rgba(0,0,0,0.6); color:#fff; padding:6px; border-radius:6px; font-size:12px; max-width:46%; max-height:40%; overflow:auto; text-align:left;";
            ob.innerHTML = infoB;
            container.appendChild(ob);
        }
        this._contentEl.appendChild(container);
    }

    _renderSide() {
        const elA = this._mediaA ? _buildMediaEl(this._mediaA) : null;
        const elB = this._mediaB ? _buildMediaEl(this._mediaB) : null;

        if (!elA && !elB) {
            this._contentEl.appendChild(_makeEmptyState("Select 2 assets for Side-by-Side"));
            return;
        }

        const container = document.createElement("div");
        container.style.cssText =
            "display:flex; width:100%; height:100%; gap:2px; background:#111; overflow:hidden;";

        const halfStyle =
            "flex:1; min-width:0; display:flex; align-items:center; justify-content:center;" +
            "overflow:hidden; position:relative; background:#0d0d0d;";

        const sideA = document.createElement("div");
        sideA.style.cssText = halfStyle;
        if (elA) sideA.appendChild(elA);
        else sideA.appendChild(_makeEmptyState("—"));
        sideA.appendChild(_makeLabel("A", "left"));

        // Gen info overlay for left
        const infoA = this._formatGenInfoHTML(this._mediaA);
        if (infoA) {
            const oa = document.createElement("div");
            oa.className = "mjr-mfv-geninfo-a";
            oa.style.cssText = "position:absolute; left:8px; bottom:8px; background:rgba(0,0,0,0.6); color:#fff; padding:6px; border-radius:6px; font-size:12px; max-width:46%; max-height:40%; overflow:auto;";
            oa.innerHTML = infoA;
            sideA.appendChild(oa);
        }

        const sideB = document.createElement("div");
        sideB.style.cssText = halfStyle;
        if (elB) sideB.appendChild(elB);
        else sideB.appendChild(_makeEmptyState("—"));
        sideB.appendChild(_makeLabel("B", "right"));

        // Gen info overlay for right
        const infoB = this._formatGenInfoHTML(this._mediaB);
        if (infoB) {
            const ob = document.createElement("div");
            ob.className = "mjr-mfv-geninfo-b";
            ob.style.cssText = "position:absolute; right:8px; bottom:8px; background:rgba(0,0,0,0.6); color:#fff; padding:6px; border-radius:6px; font-size:12px; max-width:46%; max-height:40%; overflow:auto;";
            ob.innerHTML = infoB;
            sideB.appendChild(ob);
        }

        container.appendChild(sideA);
        container.appendChild(sideB);
        this._contentEl.appendChild(container);
    }

    // ── Visibility ────────────────────────────────────────────────────────────

    show() {
        if (!this.element) return;
        this.element.style.display = "flex";
        this.isVisible = true;
    }

    hide() {
        if (!this.element) return;
        this.element.style.display = "none";
        this.isVisible = false;
    }

    // ── Drag ──────────────────────────────────────────────────────────────────

    _initDrag(handle) {
        if (!handle) return;
        handle.addEventListener("pointerdown", (e) => {
            if (e.button !== 0) return;
            if (e.target.closest("button")) return; // Don't drag when clicking buttons
            e.preventDefault();
            handle.setPointerCapture(e.pointerId);

            const el  = this.element;
            const rect = el.getBoundingClientRect();
            const offX = e.clientX - rect.left;
            const offY = e.clientY - rect.top;

            const onMove = (me) => {
                const x = Math.min(window.innerWidth  - el.offsetWidth,  Math.max(0, me.clientX - offX));
                const y = Math.min(window.innerHeight - el.offsetHeight, Math.max(0, me.clientY - offY));
                el.style.left   = `${x}px`;
                el.style.top    = `${y}px`;
                el.style.right  = "auto";
                el.style.bottom = "auto";
            };
            const onUp = () => {
                handle.removeEventListener("pointermove", onMove);
                handle.removeEventListener("pointerup", onUp);
            };
            handle.addEventListener("pointermove", onMove);
            handle.addEventListener("pointerup", onUp);
        });
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    dispose() {
        this._destroyPanZoom();
        try { this.element?.remove(); } catch (e) { console.debug?.(e); }
        this.element    = null;
        this._contentEl = null;
        this._modeBtn   = null;
        this._liveBtn     = null;
        try { document.removeEventListener("click", this._handleDocClick); } catch {}
        try { this._genDropdown?.remove(); } catch {}
        this._mediaA      = null;
        this._mediaB      = null;
        this.isVisible    = false;
    }
}
