/**
 * FloatingViewer (MFV) — Majoor Viewer Lite
 *
 * Lightweight floating panel: drag, CSS resize, 3 modes (Simple / A/B / Side-by-Side),
 * Live Stream toggle.  Styled via theme-comfy.css (.mjr-mfv scope).
 */

import { EVENTS } from "../../app/events.js";
import { buildViewURL, buildAssetViewURL } from "../../api/endpoints.js";

export const MFV_MODES = Object.freeze({
    SIMPLE: "simple",
    AB:     "ab",
    SIDE:   "side",
});

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
        this._mode       = MFV_MODES.SIMPLE;
        this._mediaA     = null;
        this._mediaB     = null;
        this._abDividerX = 0.5; // 0..1
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

        return bar;
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
        if (autoMode && this._mode !== MFV_MODES.SIMPLE) {
            this._mode = MFV_MODES.SIMPLE;
            this._updateModeBtnUI();
        }
        this._refresh();
    }

    /**
     * Load two assets for compare modes.
     * Auto-switches from SIMPLE → AB on first call.
     */
    loadMediaPair(a, b) {
        this._mediaA = a || null;
        this._mediaB = b || null;
        if (this._mode === MFV_MODES.SIMPLE) {
            this._mode = MFV_MODES.AB;
            this._updateModeBtnUI();
        }
        this._refresh();
    }

    // ── Render ────────────────────────────────────────────────────────────────

    _refresh() {
        if (!this._contentEl) return;
        this._contentEl.replaceChildren();
        switch (this._mode) {
            case MFV_MODES.SIMPLE: this._renderSimple(); break;
            case MFV_MODES.AB:     this._renderAB();     break;
            case MFV_MODES.SIDE:   this._renderSide();   break;
        }
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
            "width:100%; height:100%; display:flex; align-items:center; justify-content:center; overflow:hidden;";
        wrap.appendChild(mediaEl);
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

        const sideB = document.createElement("div");
        sideB.style.cssText = halfStyle;
        if (elB) sideB.appendChild(elB);
        else sideB.appendChild(_makeEmptyState("—"));
        sideB.appendChild(_makeLabel("B", "right"));

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
        try { this.element?.remove(); } catch (e) { console.debug?.(e); }
        this.element    = null;
        this._contentEl = null;
        this._modeBtn   = null;
        this._liveBtn   = null;
        this._mediaA    = null;
        this._mediaB    = null;
        this.isVisible  = false;
    }
}
