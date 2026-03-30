/**
 * FloatingViewer (MFV) — Majoor Viewer Lite
 *
 * Lightweight floating panel: drag, CSS resize, 3 modes (Simple / A/B / Side-by-Side),
 * Live Stream toggle, and mouse-wheel zoom + click-drag pan.
 * Styled via theme-comfy.css (.mjr-mfv scope).
 */

import { EVENTS } from "../../app/events.js";
import { t } from "../../app/i18n.js";
import { buildViewURL, buildAssetViewURL } from "../../api/endpoints.js";
import { ensureViewerMetadataAsset } from "./genInfo.js";
import { getAssetMetadata, getFileMetadataScoped } from "../../api/client.js";
import { normalizeGenerationMetadata } from "../../components/sidebar/parsers/geninfoParser.js";
import {
    createModel3DMediaElement,
    isModel3DInteractionTarget,
    MODEL3D_EXTS,
} from "./model3dRenderer.js";
import { installFollowerVideoSync } from "./videoSync.js";
import { appendTooltipHint, setTooltipHint } from "../../utils/tooltipShortcuts.js";
import { NODE_STREAM_FEATURE_ENABLED } from "./nodeStream/nodeStreamFeatureFlag.js";

export const MFV_MODES = Object.freeze({
    SIMPLE: "simple",
    AB: "ab",
    SIDE: "side",
    GRID: "grid",
});

// Zoom bounds and wheel sensitivity for the MFV pan/zoom.
const MFV_ZOOM_MIN = 0.25;
const MFV_ZOOM_MAX = 8;
const MFV_ZOOM_FACTOR = 0.0008; // multiplied by deltaY per wheel tick
const MFV_RESIZE_EDGE_HIT_PX = 8;
let _mfvInstanceSeq = 0;

// Media extensions for explicit kind detection.
const VIDEO_EXTS = new Set([".mp4", ".webm", ".mov", ".avi", ".mkv"]);
const AUDIO_EXTS = new Set([".mp3", ".wav", ".flac", ".ogg", ".m4a", ".aac", ".opus", ".wma"]);
const MFV_MODE_HINT = "C";
const MFV_LIVE_HINT = "L";
const MFV_PREVIEW_HINT = "K";
const MFV_NODESTREAM_HINT = "N";
const CLOSE_HINT = "Esc";

function _extOf(filename) {
    try {
        const name = String(filename || "").trim();
        const idx = name.lastIndexOf(".");
        return idx >= 0 ? name.slice(idx).toLowerCase() : "";
    } catch (_e) {
        /* extension extraction is best-effort */ return "";
    }
}

/** Detect media kind from asset data (video / audio / model3d / gif / image). */
function _mediaKind(fileData) {
    const kind = String(fileData?.kind || "").toLowerCase();
    if (kind === "video") return "video";
    if (kind === "audio") return "audio";
    if (kind === "model3d") return "model3d";
    const ext = _extOf(fileData?.filename || "");
    if (ext === ".gif") return "gif";
    if (VIDEO_EXTS.has(ext)) return "video";
    if (AUDIO_EXTS.has(ext)) return "audio";
    if (MODEL3D_EXTS.has(ext)) return "model3d";
    return "image";
}

/** Build the ComfyUI /view URL (or download URL for full asset objects). */
function _resolveUrl(fileData) {
    if (!fileData) return "";
    if (fileData.url) return String(fileData.url);
    // Raw ComfyUI output file: { filename, subfolder, type } — no id
    if (fileData.filename && fileData.id == null) {
        return buildViewURL(fileData.filename, fileData.subfolder || "", fileData.type || "output");
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

function _attemptAutoplay(mediaEl) {
    if (!mediaEl || typeof mediaEl.play !== "function") return;
    try {
        const p = mediaEl.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
    } catch (e) {
        console.debug?.(e);
    }
}

function _pauseMediaIn(rootEl) {
    if (!rootEl) return;
    try {
        const mediaEls = rootEl.querySelectorAll?.("video, audio");
        if (!mediaEls || !mediaEls.length) return;
        for (const el of mediaEls) {
            try {
                el.pause?.();
            } catch (e) {
                console.debug?.(e);
            }
        }
    } catch (e) {
        console.debug?.(e);
    }
}

function _buildMediaEl(fileData, { fill = false } = {}) {
    const url = _resolveUrl(fileData);
    if (!url) return null;
    const kind = _mediaKind(fileData);
    const mediaClass = `mjr-mfv-media mjr-mfv-media--fit-height${fill ? " mjr-mfv-media--fill" : ""}`;

    if (kind === "audio") {
        const wrap = document.createElement("div");
        wrap.className = `mjr-mfv-audio-card${fill ? " mjr-mfv-audio-card--fill" : ""}`;

        const head = document.createElement("div");
        head.className = "mjr-mfv-audio-head";
        const icon = document.createElement("i");
        icon.className = "pi pi-volume-up mjr-mfv-audio-icon";
        icon.setAttribute("aria-hidden", "true");
        const title = document.createElement("div");
        title.className = "mjr-mfv-audio-title";
        title.textContent = String(fileData?.filename || "Audio");
        head.appendChild(icon);
        head.appendChild(title);

        const audio = document.createElement("audio");
        audio.className = "mjr-mfv-audio-player";
        audio.src = url;
        audio.controls = true;
        audio.autoplay = true;
        audio.preload = "metadata";
        try {
            audio.addEventListener("loadedmetadata", () => _attemptAutoplay(audio), { once: true });
        } catch (e) {
            console.debug?.(e);
        }
        _attemptAutoplay(audio);

        wrap.appendChild(head);
        wrap.appendChild(audio);
        return wrap;
    }

    if (kind === "video") {
        const v = document.createElement("video");
        v.className = mediaClass;
        v.src = url;
        v.controls = true;
        v.loop = true;
        v.muted = true;
        v.autoplay = true;
        v.playsInline = true;
        return v;
    }

    if (kind === "model3d") {
        return createModel3DMediaElement(fileData, url, {
            hostClassName: `mjr-model3d-host mjr-mfv-model3d-host${fill ? " mjr-mfv-model3d-host--fill" : ""}`,
            canvasClassName: `mjr-mfv-media mjr-model3d-render-canvas${fill ? " mjr-mfv-media--fill" : ""}`,
            hintText: "Rotate: left drag  Pan: right drag  Zoom: wheel or middle drag",
            disableViewerTransform: true,
        });
    }

    // gif and image — use <img>
    const img = document.createElement("img");
    img.className = mediaClass;
    img.src = url;
    img.alt = String(fileData?.filename || "");
    img.draggable = false;
    return img;
}

// ── Canvas capture helpers ────────────────────────────────────────────────────

/** Draw a rounded rect path (uses native roundRect when available). */
function _canvasRoundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") {
        ctx.roundRect(x, y, w, h, r);
    } else {
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
}

/** Draw an A/B pill label at (x, y) on canvas. */
function _canvasLabel(ctx, text, x, y) {
    ctx.save();
    ctx.font = "bold 10px system-ui, sans-serif";
    const pad = 5;
    const tw = ctx.measureText(text).width;
    ctx.fillStyle = "rgba(0,0,0,0.58)";
    _canvasRoundRect(ctx, x, y, tw + pad * 2, 18, 4);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText(text, x + pad, y + 13);
    ctx.restore();
}

// ── FloatingViewer class ──────────────────────────────────────────────────────

export class FloatingViewer {
    constructor() {
        this._instanceId = ++_mfvInstanceSeq;
        this.element = null;
        this.isVisible = false;
        this._contentEl = null;
        this._closeBtn = null;
        this._modeBtn = null;
        this._pinSelect = null;
        this._liveBtn = null;
        this._genBtn = null;
        this._genDropdown = null;
        this._captureBtn = null;
        this._genInfoSelections = new Set(["genTime"]);
        this._mode = MFV_MODES.SIMPLE;
        this._mediaA = null;
        this._mediaB = null;
        this._mediaC = null;
        this._mediaD = null;
        this._pinnedSlot = null;
        this._abDividerX = 0.5; // 0..1

        // Pan/zoom state
        this._zoom = 1;
        this._panX = 0;
        this._panY = 0;
        this._panzoomAC = null; // AbortController for event cleanup
        this._dragging = false;
        this._compareSyncAC = null;

        // AbortController for toolbar/header button click listeners (NM-1).
        // Aborted in dispose() so listeners are cleaned up without needing named references.
        this._btnAC = null;
        // Generation counter: incremented on every loadMediaA/loadMediaPair call so
        // stale async metadata enrichment results can be discarded (NM-2).
        this._refreshGen = 0;

        // Pop-out state: external window reference and button.
        this._popoutWindow = null;
        this._popoutBtn = null;
        this._isPopped = false;
        this._popoutCloseHandler = null;
        this._popoutKeydownHandler = null;
        this._popoutCloseTimer = null;
        this._popoutRestoreGuard = false;

        // Preview stream state: button ref + last blob URL for cleanup.
        this._previewBtn = null;
        this._previewBlobUrl = null;
        this._previewActive = false;

        // Node stream state: button ref.
        this._nodeStreamBtn = null;
        this._nodeStreamActive = false;

        // Master AbortController for document-level UI handlers (e.g. click-outside).
        // Aborted in dispose() to guarantee all listeners are removed atomically.
        this._docAC = new AbortController();
        // AbortController for pop-out window listeners (beforeunload, keydown, etc.).
        this._popoutAC = null;

        // Panel-level listeners and edge-resize state.
        this._panelAC = new AbortController();
        this._resizeState = null;
        this._titleId = `mjr-mfv-title-${this._instanceId}`;
        this._genDropdownId = `mjr-mfv-gen-dropdown-${this._instanceId}`;
        this._docClickHost = null;
        this._handleDocClick = null;
    }

    // ── Build DOM ─────────────────────────────────────────────────────────────

    render() {
        const el = document.createElement("div");
        el.className = "mjr-mfv";
        el.setAttribute("role", "dialog");
        el.setAttribute("aria-modal", "false");
        el.setAttribute("aria-hidden", "true");

        this.element = el;
        el.appendChild(this._buildHeader());
        el.setAttribute("aria-labelledby", this._titleId);
        el.appendChild(this._buildToolbar());

        this._contentEl = document.createElement("div");
        this._contentEl.className = "mjr-mfv-content";
        el.appendChild(this._contentEl);

        this._rebindControlHandlers();
        this._bindPanelInteractions();
        this._bindDocumentUiHandlers();
        this._refresh();
        return el;
    }

    _buildHeader() {
        const header = document.createElement("div");
        header.className = "mjr-mfv-header";

        const title = document.createElement("span");
        title.className = "mjr-mfv-header-title";
        title.id = this._titleId;
        title.textContent = "Majoor Viewer Lite";

        const closeBtn = document.createElement("button");
        this._closeBtn = closeBtn;
        closeBtn.type = "button";
        closeBtn.className = "mjr-icon-btn";
        setTooltipHint(closeBtn, t("tooltip.closeViewer", "Close viewer"), CLOSE_HINT);
        const _closeBtnIcon = document.createElement("i");
        _closeBtnIcon.className = "pi pi-times";
        _closeBtnIcon.setAttribute("aria-hidden", "true");
        closeBtn.appendChild(_closeBtnIcon);

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
        this._updateModeBtnUI();
        bar.appendChild(this._modeBtn);

        this._pinSelect = document.createElement("select");
        this._pinSelect.className = "mjr-mfv-pin-select";
        this._pinSelect.setAttribute("aria-label", "Pin Reference");
        this._pinSelect.value = this._pinnedSlot || "";
        for (const { value, label } of [
            { value: "", label: "No Pin" },
            { value: "A", label: "Pin A" },
            { value: "B", label: "Pin B" },
            { value: "C", label: "Pin C" },
            { value: "D", label: "Pin D" },
        ]) {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = label;
            this._pinSelect.appendChild(option);
        }
        this._updatePinSelectUI();
        bar.appendChild(this._pinSelect);

        // Separator
        const sep = document.createElement("div");
        sep.className = "mjr-mfv-toolbar-sep";
        sep.setAttribute("aria-hidden", "true");
        bar.appendChild(sep);

        // Live Stream toggle
        this._liveBtn = document.createElement("button");
        this._liveBtn.type = "button";
        this._liveBtn.className = "mjr-icon-btn";
        this._liveBtn.innerHTML = '<i class="pi pi-circle" aria-hidden="true"></i>';
        this._liveBtn.setAttribute("aria-pressed", "false");
        setTooltipHint(
            this._liveBtn,
            t("tooltip.liveStreamOff", "Live Stream: OFF — click to follow"),
            MFV_LIVE_HINT,
        );
        bar.appendChild(this._liveBtn);

        // KSampler Preview Stream toggle
        this._previewBtn = document.createElement("button");
        this._previewBtn.type = "button";
        this._previewBtn.className = "mjr-icon-btn";
        this._previewBtn.innerHTML = '<i class="pi pi-eye" aria-hidden="true"></i>';
        this._previewBtn.setAttribute("aria-pressed", "false");
        setTooltipHint(
            this._previewBtn,
            t(
                "tooltip.previewStreamOff",
                "KSampler Preview: OFF — click to stream denoising steps",
            ),
            MFV_PREVIEW_HINT,
        );
        bar.appendChild(this._previewBtn);

        // Node Stream toggle (stream intermediate node outputs)
        this._nodeStreamBtn = document.createElement("button");
        this._nodeStreamBtn.type = "button";
        this._nodeStreamBtn.className = "mjr-icon-btn";
        this._nodeStreamBtn.innerHTML = '<i class="pi pi-sitemap" aria-hidden="true"></i>';
        this._nodeStreamBtn.setAttribute("aria-pressed", "false");
        setTooltipHint(
            this._nodeStreamBtn,
            t("tooltip.nodeStreamOff", "Node Stream: OFF — click to stream selected node output"),
            MFV_NODESTREAM_HINT,
        );
        bar.appendChild(this._nodeStreamBtn);
        if (!NODE_STREAM_FEATURE_ENABLED) {
            // Temporary shutdown: keep the code in place but remove the control
            // from the toolbar until Node Stream is re-enabled.
            this._nodeStreamBtn.remove?.();
            this._nodeStreamBtn = null;
        }

        // Gen Info button (shows dropdown with checkboxes)
        this._genBtn = document.createElement("button");
        this._genBtn.type = "button";
        this._genBtn.className = "mjr-icon-btn";
        this._genBtn.setAttribute("aria-haspopup", "dialog");
        this._genBtn.setAttribute("aria-expanded", "false");
        const _genBtnIcon = document.createElement("i");
        _genBtnIcon.className = "pi pi-info-circle";
        _genBtnIcon.setAttribute("aria-hidden", "true");
        this._genBtn.appendChild(_genBtnIcon);
        bar.appendChild(this._genBtn);
        this._updateGenBtnUI();

        // Pop-out to external window button
        this._popoutBtn = document.createElement("button");
        this._popoutBtn.type = "button";
        this._popoutBtn.className = "mjr-icon-btn";
        const popoutLabel = t(
            "tooltip.popOutViewer",
            "Expand to full screen (Esc or button to return)",
        );
        this._popoutBtn.title = popoutLabel;
        this._popoutBtn.setAttribute("aria-label", popoutLabel);
        this._popoutBtn.setAttribute("aria-pressed", "false");
        const _popoutIcon = document.createElement("i");
        _popoutIcon.className = "pi pi-external-link";
        _popoutIcon.setAttribute("aria-hidden", "true");
        this._popoutBtn.appendChild(_popoutIcon);
        bar.appendChild(this._popoutBtn);

        // Download / capture button
        this._captureBtn = document.createElement("button");
        this._captureBtn.type = "button";
        this._captureBtn.className = "mjr-icon-btn";
        const captureLabel = t("tooltip.captureView", "Save view as image");
        this._captureBtn.title = captureLabel;
        this._captureBtn.setAttribute("aria-label", captureLabel);
        const _captureBtnIcon = document.createElement("i");
        _captureBtnIcon.className = "pi pi-download";
        _captureBtnIcon.setAttribute("aria-hidden", "true");
        this._captureBtn.appendChild(_captureBtnIcon);
        bar.appendChild(this._captureBtn);

        this._handleDocClick = (ev) => {
            if (!this._genDropdown) return;
            const target = ev?.target;
            if (this._genBtn?.contains?.(target)) return;
            if (this._genDropdown.contains(target)) return;
            this._closeGenDropdown();
        };
        this._bindDocumentUiHandlers();

        return bar;
    }

    _rebindControlHandlers() {
        try {
            this._btnAC?.abort();
        } catch (e) {
            console.debug?.(e);
        }
        this._btnAC = new AbortController();
        const signal = this._btnAC.signal;

        this._closeBtn?.addEventListener(
            "click",
            () => {
                window.dispatchEvent(new CustomEvent(EVENTS.MFV_CLOSE));
            },
            { signal },
        );

        this._modeBtn?.addEventListener("click", () => this._cycleMode(), { signal });

        this._pinSelect?.addEventListener(
            "change",
            (e) => {
                this._pinnedSlot = e?.target?.value || null;
                if (this._pinnedSlot === "C" || this._pinnedSlot === "D") {
                    // C/D pins require grid mode — switch regardless of current mode
                    if (this._mode !== MFV_MODES.GRID) this.setMode(MFV_MODES.GRID);
                } else if (this._pinnedSlot && this._mode === MFV_MODES.SIMPLE) {
                    this.setMode(MFV_MODES.AB);
                }
                this._updatePinSelectUI();
            },
            { signal },
        );

        this._liveBtn?.addEventListener(
            "click",
            () => {
                window.dispatchEvent(new CustomEvent(EVENTS.MFV_LIVE_TOGGLE));
            },
            { signal },
        );

        this._previewBtn?.addEventListener(
            "click",
            () => {
                window.dispatchEvent(new CustomEvent(EVENTS.MFV_PREVIEW_TOGGLE));
            },
            { signal },
        );

        this._nodeStreamBtn?.addEventListener(
            "click",
            () => {
                window.dispatchEvent(new CustomEvent(EVENTS.MFV_NODESTREAM_TOGGLE));
            },
            { signal },
        );

        this._genBtn?.addEventListener(
            "click",
            (e) => {
                e.stopPropagation();
                if (this._genDropdown?.classList?.contains("is-visible")) {
                    this._closeGenDropdown();
                } else {
                    this._openGenDropdown();
                }
            },
            { signal },
        );

        this._popoutBtn?.addEventListener(
            "click",
            () => {
                window.dispatchEvent(new CustomEvent(EVENTS.MFV_POPOUT));
            },
            { signal },
        );

        this._captureBtn?.addEventListener("click", () => this._captureView(), { signal });
    }

    _resetGenDropdownForCurrentDocument() {
        this._closeGenDropdown();
        try {
            this._genDropdown?.remove?.();
        } catch (e) {
            console.debug?.(e);
        }
        this._genDropdown = null;
        this._updateGenBtnUI();
    }

    _bindDocumentUiHandlers() {
        if (!this._handleDocClick) return;
        const doc = this.element?.ownerDocument || document;
        if (this._docClickHost === doc) return;
        this._unbindDocumentUiHandlers();
        // Re-create the AbortController so previous listeners on a different
        // document (e.g. pop-out window) are cleaned up atomically.
        try {
            this._docAC?.abort();
        } catch (e) {
            console.debug?.(e);
        }
        this._docAC = new AbortController();
        doc.addEventListener("click", this._handleDocClick, { signal: this._docAC.signal });
        this._docClickHost = doc;
    }

    _unbindDocumentUiHandlers() {
        // Abort the controller instead of manual removeEventListener — guarantees
        // all document-level listeners attached via _docAC are removed.
        try {
            this._docAC?.abort();
        } catch (e) {
            console.debug?.(e);
        }
        this._docAC = new AbortController();
        this._docClickHost = null;
    }

    _isGenDropdownOpen() {
        return !!this._genDropdown?.classList?.contains("is-visible");
    }

    _openGenDropdown() {
        if (!this.element) return;
        if (!this._genDropdown) {
            this._genDropdown = this._buildGenDropdown();
            this.element.appendChild(this._genDropdown);
        }
        this._bindDocumentUiHandlers();
        const rect = this._genBtn.getBoundingClientRect();
        const parentRect = this.element.getBoundingClientRect();
        const left = rect.left - parentRect.left;
        const top = rect.bottom - parentRect.top + 6;
        this._genDropdown.style.left = `${left}px`;
        this._genDropdown.style.top = `${top}px`;
        this._genDropdown.classList.add("is-visible");
        this._updateGenBtnUI();
    }

    _closeGenDropdown() {
        if (!this._genDropdown) return;
        this._genDropdown.classList.remove("is-visible");
        this._updateGenBtnUI();
    }

    /** Reflect how many fields are enabled on the gen info button. */
    _updateGenBtnUI() {
        if (!this._genBtn) return;
        const count = this._genInfoSelections.size;
        const isOn = count > 0;
        const isOpen = this._isGenDropdownOpen();
        this._genBtn.classList.toggle("is-on", isOn);
        this._genBtn.classList.toggle("is-open", isOpen);
        const label = isOn
            ? `Gen Info (${count} field${count > 1 ? "s" : ""} shown)${isOpen ? " — open" : " — click to configure"}`
            : `Gen Info${isOpen ? " — open" : " — click to show overlay"}`;
        this._genBtn.title = label;
        this._genBtn.setAttribute("aria-label", label);
        this._genBtn.setAttribute("aria-expanded", String(isOpen));
        if (this._genDropdown) {
            this._genBtn.setAttribute("aria-controls", this._genDropdownId);
        } else {
            this._genBtn.removeAttribute("aria-controls");
        }
    }

    _buildGenDropdown() {
        const d = document.createElement("div");
        d.className = "mjr-mfv-gen-dropdown";
        d.id = this._genDropdownId;
        d.setAttribute("role", "group");
        d.setAttribute("aria-label", "Generation info fields");
        const opts = [
            ["prompt", "Prompt"],
            ["seed", "Seed"],
            ["model", "Model"],
            ["lora", "LoRA"],
            ["sampler", "Sampler"],
            ["scheduler", "Scheduler"],
            ["cfg", "CFG"],
            ["step", "Step"],
            ["genTime", "Gen Time"],
        ];
        for (const [key, label] of opts) {
            const row = document.createElement("label");
            row.className = "mjr-mfv-gen-dropdown-row";
            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.checked = this._genInfoSelections.has(key);
            cb.addEventListener("change", () => {
                if (cb.checked) this._genInfoSelections.add(key);
                else this._genInfoSelections.delete(key);
                this._updateGenBtnUI();
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
        // Prefer normalized geninfo objects produced by backend pipeline.
        // fileData.geninfo is the raw geninfo object ({positive:{value:...}, checkpoint:...}).
        // normalizeGenerationMetadata expects to find it under raw.geninfo, so we wrap it.
        try {
            const candidate = fileData.geninfo
                ? { geninfo: fileData.geninfo }
                : fileData.metadata || fileData.metadata_raw || fileData;
            const norm = normalizeGenerationMetadata(candidate) || null;
            const out = {
                prompt: "",
                seed: "",
                model: "",
                lora: "",
                sampler: "",
                scheduler: "",
                cfg: "",
                step: "",
                genTime: "",
            };
            if (norm && typeof norm === "object") {
                // Extract positive prompt (primary field)
                if (norm.prompt) out.prompt = String(norm.prompt);
                if (norm.seed != null) out.seed = String(norm.seed);
                if (norm.model)
                    out.model = Array.isArray(norm.model)
                        ? norm.model.join(", ")
                        : String(norm.model);
                if (Array.isArray(norm.loras))
                    out.lora = norm.loras
                        .map((l) =>
                            typeof l === "string"
                                ? l
                                : l?.name || l?.lora_name || l?.model_name || "",
                        )
                        .filter(Boolean)
                        .join(", ");
                if (norm.sampler) out.sampler = String(norm.sampler);
                if (norm.scheduler) out.scheduler = String(norm.scheduler);
                if (norm.cfg != null) out.cfg = String(norm.cfg);
                if (norm.steps != null) out.step = String(norm.steps);
                // Fallback to candidate prompt if norm.prompt is empty
                if (!out.prompt && candidate?.prompt) out.prompt = String(candidate.prompt || "");

                const genTimeMs =
                    fileData.generation_time_ms ??
                    fileData.metadata_raw?.generation_time_ms ??
                    candidate?.generation_time_ms ??
                    candidate?.geninfo?.generation_time_ms ??
                    0;
                if (
                    genTimeMs &&
                    Number.isFinite(Number(genTimeMs)) &&
                    genTimeMs > 0 &&
                    genTimeMs < 86400000
                ) {
                    out.genTime = (Number(genTimeMs) / 1000).toFixed(1) + "s";
                }

                return out;
            }
        } catch (e) {
            console.debug?.("[MFV] _getGenFields error:", e);
        }
        // Fallback: inspect common metadata fields
        const meta =
            fileData.meta ||
            fileData.metadata ||
            fileData.parsed ||
            fileData.parsed_meta ||
            fileData;
        const out = {
            prompt: "",
            seed: "",
            model: "",
            lora: "",
            sampler: "",
            scheduler: "",
            cfg: "",
            step: "",
            genTime: "",
        };
        out.prompt = meta?.prompt || meta?.text || "";
        out.seed =
            meta?.seed != null
                ? String(meta.seed)
                : meta?.noise_seed != null
                  ? String(meta.noise_seed)
                  : "";
        if (meta?.model)
            out.model = Array.isArray(meta.model) ? meta.model.join(", ") : String(meta.model);
        else out.model = meta?.model_name || "";
        out.lora = meta?.lora || meta?.loras || "";
        if (Array.isArray(out.lora)) out.lora = out.lora.join(", ");
        out.sampler = meta?.sampler || meta?.sampler_name || "";
        out.scheduler = meta?.scheduler || "";
        out.cfg =
            meta?.cfg != null
                ? String(meta.cfg)
                : meta?.cfg_scale != null
                  ? String(meta.cfg_scale)
                  : "";
        out.step = meta?.steps != null ? String(meta.steps) : "";

        const genTimeMsFallback =
            fileData.generation_time_ms ??
            fileData.metadata_raw?.generation_time_ms ??
            meta?.generation_time_ms ??
            0;
        if (
            genTimeMsFallback &&
            Number.isFinite(Number(genTimeMsFallback)) &&
            genTimeMsFallback > 0 &&
            genTimeMsFallback < 86400000
        ) {
            out.genTime = (Number(genTimeMsFallback) / 1000).toFixed(1) + "s";
        }
        return out;
    }

    /**
     * Build a DocumentFragment of gen-info rows using the DOM API.
     * Returns null when no fields are selected or all are empty.
     * Using the DOM API instead of innerHTML string concatenation eliminates
     * any XSS risk from metadata values and avoids fragile HTML escaping.
     */
    _buildGenInfoDOM(fileData) {
        const fields = this._getGenFields(fileData);
        if (!fields) return null;
        const frag = document.createDocumentFragment();
        const order = [
            "prompt",
            "seed",
            "model",
            "lora",
            "sampler",
            "scheduler",
            "cfg",
            "step",
            "genTime",
        ];
        for (const k of order) {
            if (!this._genInfoSelections.has(k)) continue;
            const v = fields[k] != null ? String(fields[k]) : "";
            if (!v) continue;
            let label = k.charAt(0).toUpperCase() + k.slice(1);
            if (k === "lora") label = "LoRA";
            else if (k === "cfg") label = "CFG";
            else if (k === "genTime") label = "Gen Time";
            const div = document.createElement("div");
            div.dataset.field = k;
            const strong = document.createElement("strong");
            strong.textContent = `${label}: `;
            div.appendChild(strong);
            if (k === "prompt") {
                // Show full prompt, no truncation
                div.appendChild(document.createTextNode(v));
            } else if (k === "genTime") {
                // Color-code gen time (matches FileInfoSection.js colour scheme)
                const secs = parseFloat(v);
                let gtColor = "#4CAF50"; // green  < 10s
                if (secs >= 60)
                    gtColor = "#FF9800"; // orange
                else if (secs >= 30)
                    gtColor = "#FFC107"; // yellow
                else if (secs >= 10) gtColor = "#8BC34A"; // light green
                const span = document.createElement("span");
                span.style.color = gtColor;
                span.style.fontWeight = "600";
                span.textContent = v;
                div.appendChild(span);
            } else {
                div.appendChild(document.createTextNode(v));
            }
            frag.appendChild(div);
        }
        return frag.childNodes.length > 0 ? frag : null;
    }

    // ── Mode ──────────────────────────────────────────────────────────────────

    _cycleMode() {
        const order = [MFV_MODES.SIMPLE, MFV_MODES.AB, MFV_MODES.SIDE, MFV_MODES.GRID];
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

    getPinnedSlot() {
        return this._pinnedSlot;
    }

    _updatePinSelectUI() {
        if (!this._pinSelect) return;
        const validPins = ["A", "B", "C", "D"];
        const pinned = validPins.includes(this._pinnedSlot);
        this._pinSelect.value = this._pinnedSlot || "";
        this._pinSelect.classList.toggle("is-pinned", pinned);
        const label = pinned ? `Pin Reference: ${this._pinnedSlot}` : "Pin Reference: Off";
        this._pinSelect.title = label;
        this._pinSelect.setAttribute("aria-label", label);
    }

    _updateModeBtnUI() {
        if (!this._modeBtn) return;
        const cfg = {
            [MFV_MODES.SIMPLE]: { icon: "pi-image", label: "Mode: Simple - click to switch" },
            [MFV_MODES.AB]: { icon: "pi-clone", label: "Mode: A/B Compare - click to switch" },
            [MFV_MODES.SIDE]: { icon: "pi-table", label: "Mode: Side-by-Side - click to switch" },
            [MFV_MODES.GRID]: {
                icon: "pi-th-large",
                label: "Mode: Grid Compare (up to 4) - click to switch",
            },
        };
        const { icon = "pi-image", label = "" } = cfg[this._mode] || {};
        const tooltip = appendTooltipHint(label, MFV_MODE_HINT);
        const _modeBtnIcon = document.createElement("i");
        _modeBtnIcon.className = `pi ${icon}`;
        _modeBtnIcon.setAttribute("aria-hidden", "true");
        this._modeBtn.replaceChildren(_modeBtnIcon);
        this._modeBtn.title = tooltip;
        this._modeBtn.setAttribute("aria-label", tooltip);
        this._modeBtn.removeAttribute("aria-pressed");
    }

    // ── Live Stream UI ────────────────────────────────────────────────────────

    setLiveActive(active) {
        if (!this._liveBtn) return;
        const isActive = Boolean(active);
        this._liveBtn.classList.toggle("mjr-live-active", isActive);
        const label = isActive
            ? t("tooltip.liveStreamOn", "Live Stream: ON — click to disable")
            : t("tooltip.liveStreamOff", "Live Stream: OFF — click to follow");
        const tooltip = appendTooltipHint(label, MFV_LIVE_HINT);
        this._liveBtn.setAttribute("aria-pressed", String(isActive));
        this._liveBtn.setAttribute("aria-label", tooltip);
        if (isActive) {
            const _liveIconActive = document.createElement("i");
            _liveIconActive.className = "pi pi-circle-fill";
            _liveIconActive.setAttribute("aria-hidden", "true");
            this._liveBtn.replaceChildren(_liveIconActive);
            this._liveBtn.title = tooltip;
        } else {
            const _liveIconInactive = document.createElement("i");
            _liveIconInactive.className = "pi pi-circle";
            _liveIconInactive.setAttribute("aria-hidden", "true");
            this._liveBtn.replaceChildren(_liveIconInactive);
            this._liveBtn.title = tooltip;
        }
    }

    // ── KSampler Preview Stream UI ─────────────────────────────────────────────

    setPreviewActive(active) {
        this._previewActive = Boolean(active);
        if (!this._previewBtn) return;
        this._previewBtn.classList.toggle("mjr-preview-active", this._previewActive);
        const label = this._previewActive
            ? t("tooltip.previewStreamOn", "KSampler Preview: ON — streaming denoising steps")
            : t(
                  "tooltip.previewStreamOff",
                  "KSampler Preview: OFF — click to stream denoising steps",
              );
        const tooltip = appendTooltipHint(label, MFV_PREVIEW_HINT);
        this._previewBtn.setAttribute("aria-pressed", String(this._previewActive));
        this._previewBtn.setAttribute("aria-label", tooltip);
        if (this._previewActive) {
            const icon = document.createElement("i");
            icon.className = "pi pi-eye";
            icon.setAttribute("aria-hidden", "true");
            this._previewBtn.replaceChildren(icon);
            this._previewBtn.title = tooltip;
        } else {
            const icon = document.createElement("i");
            icon.className = "pi pi-eye-slash";
            icon.setAttribute("aria-hidden", "true");
            this._previewBtn.replaceChildren(icon);
            this._previewBtn.title = tooltip;
            // Revoke last blob URL when turning off
            this._revokePreviewBlob();
        }
    }

    /**
     * Display a preview blob (JPEG/PNG from KSampler denoising steps).
     * Uses a blob: URL and shows it in Simple mode without metadata enrichment.
     * @param {Blob} blob  Image blob received from ComfyUI WebSocket.
     */
    loadPreviewBlob(blob) {
        if (!blob || !(blob instanceof Blob)) return;
        // Revoke previous blob URL to prevent memory leaks
        this._revokePreviewBlob();
        const url = URL.createObjectURL(blob);
        this._previewBlobUrl = url;
        // Build a minimal fileData that _resolveUrl can handle
        const fileData = { url, filename: "preview.jpg", kind: "image", _isPreview: true };

        const inCompare =
            this._mode === MFV_MODES.AB ||
            this._mode === MFV_MODES.SIDE ||
            this._mode === MFV_MODES.GRID;
        if (inCompare) {
            // Route preview to the first non-pinned slot. In GRID mode, cycle through
            // all free slots so existing content in other cells is preserved.
            const pin = this.getPinnedSlot();
            if (this._mode === MFV_MODES.GRID) {
                const target = ["A", "B", "C", "D"].find((s) => s !== pin) || "A";
                this[`_media${target}`] = fileData;
            } else if (pin === "B") {
                this._mediaA = fileData;
            } else {
                this._mediaB = fileData; // A pinned or no pin — stream to B
            }
            // Do NOT reset zoom (preview frames arrive rapidly; resetting each time
            // would make the reference slot unusable) and do NOT switch mode.
        } else {
            // Simple mode: preview takes slot A, keep it simple.
            this._mediaA = fileData;
            this._resetMfvZoom();
            if (this._mode !== MFV_MODES.SIMPLE) {
                this._mode = MFV_MODES.SIMPLE;
                this._updateModeBtnUI();
            }
        }
        ++this._refreshGen;
        this._refresh();
    }

    _revokePreviewBlob() {
        if (this._previewBlobUrl) {
            try {
                URL.revokeObjectURL(this._previewBlobUrl);
            } catch {
                /* noop */
            }
            this._previewBlobUrl = null;
        }
    }

    // ── Node Stream UI ───────────────────────────────────────────────────────

    setNodeStreamActive(active) {
        if (!NODE_STREAM_FEATURE_ENABLED) {
            void active;
            this._nodeStreamActive = false;
            return;
        }

        this._nodeStreamActive = Boolean(active);
        if (!this._nodeStreamBtn) return;
        this._nodeStreamBtn.classList.toggle("mjr-nodestream-active", this._nodeStreamActive);
        const label = this._nodeStreamActive
            ? t("tooltip.nodeStreamOn", "Node Stream: ON — streaming selected node output")
            : t("tooltip.nodeStreamOff", "Node Stream: OFF — click to stream selected node output");
        const tooltip = appendTooltipHint(label, MFV_NODESTREAM_HINT);
        this._nodeStreamBtn.setAttribute("aria-pressed", String(this._nodeStreamActive));
        this._nodeStreamBtn.setAttribute("aria-label", tooltip);
        if (this._nodeStreamActive) {
            const icon = document.createElement("i");
            icon.className = "pi pi-sitemap";
            icon.setAttribute("aria-hidden", "true");
            this._nodeStreamBtn.replaceChildren(icon);
            this._nodeStreamBtn.title = tooltip;
        } else {
            const icon = document.createElement("i");
            icon.className = "pi pi-sitemap";
            icon.setAttribute("aria-hidden", "true");
            this._nodeStreamBtn.replaceChildren(icon);
            this._nodeStreamBtn.title = tooltip;
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
        // Hydrate geninfo metadata asynchronously using shared pipeline.
        // Capture generation counter before the await so stale results from a previous
        // loadMediaA call are discarded if the user switches assets quickly (NM-2).
        if (this._mediaA && typeof ensureViewerMetadataAsset === "function") {
            const gen = ++this._refreshGen;
            (async () => {
                try {
                    const enriched = await ensureViewerMetadataAsset(this._mediaA, {
                        getAssetMetadata,
                        getFileMetadataScoped,
                    });
                    if (this._refreshGen !== gen) return; // stale — newer media loaded
                    if (enriched && typeof enriched === "object") {
                        this._mediaA = enriched;
                        this._refresh();
                    }
                } catch (e) {
                    console.debug?.("[MFV] metadata enrich error", e);
                }
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
        // Hydrate both sides concurrently. Capture generation counter so stale results
        // from a previous loadMediaPair call are discarded if the user switches quickly (NM-2).
        const gen = ++this._refreshGen;
        const hydrate = async (asset) => {
            if (!asset) return asset;
            try {
                const enriched = await ensureViewerMetadataAsset(asset, {
                    getAssetMetadata,
                    getFileMetadataScoped,
                });
                return enriched || asset;
            } catch {
                return asset;
            }
        };
        (async () => {
            const [A, B] = await Promise.all([hydrate(this._mediaA), hydrate(this._mediaB)]);
            if (this._refreshGen !== gen) return; // stale — newer media loaded
            this._mediaA = A || null;
            this._mediaB = B || null;
            this._refresh();
        })();
    }

    /**
     * Load up to 4 assets for grid compare mode.
     * Auto-switches to GRID mode if not already.
     */
    loadMediaQuad(a, b, c, d) {
        this._mediaA = a || null;
        this._mediaB = b || null;
        this._mediaC = c || null;
        this._mediaD = d || null;
        this._resetMfvZoom();
        if (this._mode !== MFV_MODES.GRID) {
            this._mode = MFV_MODES.GRID;
            this._updateModeBtnUI();
        }
        const gen = ++this._refreshGen;
        const hydrate = async (asset) => {
            if (!asset) return asset;
            try {
                const enriched = await ensureViewerMetadataAsset(asset, {
                    getAssetMetadata,
                    getFileMetadataScoped,
                });
                return enriched || asset;
            } catch {
                return asset;
            }
        };
        (async () => {
            const [A, B, C, D] = await Promise.all([
                hydrate(this._mediaA),
                hydrate(this._mediaB),
                hydrate(this._mediaC),
                hydrate(this._mediaD),
            ]);
            if (this._refreshGen !== gen) return;
            this._mediaA = A || null;
            this._mediaB = B || null;
            this._mediaC = C || null;
            this._mediaD = D || null;
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
        const z = Math.max(MFV_ZOOM_MIN, Math.min(MFV_ZOOM_MAX, this._zoom));
        const vw = this._contentEl.clientWidth || 0;
        const vh = this._contentEl.clientHeight || 0;
        const maxX = Math.max(0, ((z - 1) * vw) / 2);
        const maxY = Math.max(0, ((z - 1) * vh) / 2);
        this._panX = Math.max(-maxX, Math.min(maxX, this._panX));
        this._panY = Math.max(-maxY, Math.min(maxY, this._panY));
        const t = `translate(${this._panX}px,${this._panY}px) scale(${z})`;
        for (const el of this._contentEl.querySelectorAll(".mjr-mfv-media")) {
            if (el?._mjrDisableViewerTransform) continue;
            el.style.transform = t;
            el.style.transformOrigin = "center";
        }
        // Cursor feedback — use CSS classes
        this._contentEl.classList.remove("mjr-mfv-content--grab", "mjr-mfv-content--grabbing");
        if (z > 1.01) {
            this._contentEl.classList.add(
                this._dragging ? "mjr-mfv-content--grabbing" : "mjr-mfv-content--grab",
            );
        }
    }

    /**
     * Set zoom, optionally centered at (clientX, clientY).
     * Keeps the image point under the cursor stationary.
     */
    _setMfvZoom(next, clientX, clientY) {
        const prev = Math.max(MFV_ZOOM_MIN, Math.min(MFV_ZOOM_MAX, this._zoom));
        const z = Math.max(MFV_ZOOM_MIN, Math.min(MFV_ZOOM_MAX, Number(next) || 1));
        if (clientX != null && clientY != null && this._contentEl) {
            const r = z / prev;
            const rect = this._contentEl.getBoundingClientRect();
            const ux = clientX - (rect.left + rect.width / 2);
            const uy = clientY - (rect.top + rect.height / 2);
            this._panX = this._panX * r + (1 - r) * ux;
            this._panY = this._panY * r + (1 - r) * uy;
        }
        this._zoom = z;
        // Snap back to exact fit to avoid drift.
        if (Math.abs(z - 1) < 0.001) {
            this._zoom = 1;
            this._panX = 0;
            this._panY = 0;
        }
        this._applyTransform();
    }

    /** Bind wheel + pointer events to the clip viewport element. */
    _initPanZoom(contentEl) {
        this._destroyPanZoom();
        if (!contentEl) return;
        this._panzoomAC = new AbortController();
        const sig = { signal: this._panzoomAC.signal };

        // Wheel → zoom centered at cursor
        contentEl.addEventListener(
            "wheel",
            (e) => {
                if (e.target?.closest?.("audio")) return;
                if (isModel3DInteractionTarget(e.target)) return;
                e.preventDefault();
                const delta = e.deltaY || e.deltaX || 0;
                const factor = 1 - delta * MFV_ZOOM_FACTOR;
                this._setMfvZoom(this._zoom * factor, e.clientX, e.clientY);
            },
            { ...sig, passive: false },
        );

        // Pointer drag → pan (left or middle button, when zoomed in)
        let panActive = false;
        let startX = 0,
            startY = 0,
            startPanX = 0,
            startPanY = 0;

        contentEl.addEventListener(
            "pointerdown",
            (e) => {
                if (e.button !== 0 && e.button !== 1) return;
                if (this._zoom <= 1.01) return;
                // Let native video controls and the AB divider handle their own events.
                if (e.target?.closest?.("video")) return;
                if (e.target?.closest?.("audio")) return;
                if (e.target?.closest?.(".mjr-mfv-ab-divider")) return;
                if (isModel3DInteractionTarget(e.target)) return;
                e.preventDefault();
                panActive = true;
                this._dragging = true;
                startX = e.clientX;
                startY = e.clientY;
                startPanX = this._panX;
                startPanY = this._panY;
                try {
                    contentEl.setPointerCapture(e.pointerId);
                } catch (e) {
                    console.debug?.(e);
                }
                this._applyTransform();
            },
            sig,
        );

        contentEl.addEventListener(
            "pointermove",
            (e) => {
                if (!panActive) return;
                this._panX = startPanX + (e.clientX - startX);
                this._panY = startPanY + (e.clientY - startY);
                this._applyTransform();
            },
            sig,
        );

        const endPan = (e) => {
            if (!panActive) return;
            panActive = false;
            this._dragging = false;
            try {
                contentEl.releasePointerCapture(e.pointerId);
            } catch (e) {
                console.debug?.(e);
            }
            this._applyTransform();
        };
        contentEl.addEventListener("pointerup", endPan, sig);
        contentEl.addEventListener("pointercancel", endPan, sig);

        // Double-click → zoom to 4× at cursor, or reset to fit
        contentEl.addEventListener(
            "dblclick",
            (e) => {
                if (e.target?.closest?.("video")) return;
                if (e.target?.closest?.("audio")) return;
                if (isModel3DInteractionTarget(e.target)) return;
                const isNearFit = Math.abs(this._zoom - 1) < 0.05;
                this._setMfvZoom(isNearFit ? Math.min(4, this._zoom * 4) : 1, e.clientX, e.clientY);
            },
            sig,
        );
    }

    /** Remove all pan/zoom event listeners. */
    _destroyPanZoom() {
        try {
            this._panzoomAC?.abort();
        } catch (e) {
            console.debug?.(e);
        }
        this._panzoomAC = null;
        this._dragging = false;
    }

    _destroyCompareSync() {
        try {
            this._compareSyncAC?.abort?.();
        } catch (e) {
            console.debug?.(e);
        }
        this._compareSyncAC = null;
    }

    _initCompareSync() {
        this._destroyCompareSync();
        if (!this._contentEl) return;
        if (this._mode === MFV_MODES.SIMPLE) return;
        try {
            const playables = Array.from(this._contentEl.querySelectorAll("video, audio"));
            if (playables.length < 2) return;
            const leader = playables[0] || null;
            const followers = playables.slice(1);
            if (!leader || !followers.length) return;
            this._compareSyncAC = installFollowerVideoSync(leader, followers, { threshold: 0.08 });
        } catch (e) {
            console.debug?.(e);
        }
    }

    // ── Render ────────────────────────────────────────────────────────────────

    _refresh() {
        if (!this._contentEl) return;
        // Tear down previous panzoom bindings before clearing DOM.
        this._destroyPanZoom();
        this._destroyCompareSync();
        this._contentEl.replaceChildren();
        this._contentEl.style.overflow = "hidden";

        switch (this._mode) {
            case MFV_MODES.SIMPLE:
                this._renderSimple();
                break;
            case MFV_MODES.AB:
                this._renderAB();
                break;
            case MFV_MODES.SIDE:
                this._renderSide();
                break;
            case MFV_MODES.GRID:
                this._renderGrid();
                break;
        }

        this._applyTransform();
        this._initPanZoom(this._contentEl);
        this._initCompareSync();
    }

    _renderSimple() {
        if (!this._mediaA) {
            this._contentEl.appendChild(_makeEmptyState());
            return;
        }
        const mediaKind = _mediaKind(this._mediaA);
        const mediaEl = _buildMediaEl(this._mediaA);
        if (!mediaEl) {
            this._contentEl.appendChild(_makeEmptyState("Could not load media"));
            return;
        }
        const wrap = document.createElement("div");
        wrap.className = "mjr-mfv-simple-container";
        wrap.appendChild(mediaEl);
        // Keep native audio controls unobstructed.
        if (mediaKind !== "audio") {
            const infoFrag = this._buildGenInfoDOM(this._mediaA);
            if (infoFrag) {
                const ol = document.createElement("div");
                ol.className = "mjr-mfv-geninfo";
                ol.appendChild(infoFrag);
                wrap.appendChild(ol);
            }
        }
        this._contentEl.appendChild(wrap);
    }

    _renderAB() {
        const elA = this._mediaA ? _buildMediaEl(this._mediaA, { fill: true }) : null;
        const elB = this._mediaB ? _buildMediaEl(this._mediaB, { fill: true }) : null;
        const kindA = this._mediaA ? _mediaKind(this._mediaA) : "";
        const kindB = this._mediaB ? _mediaKind(this._mediaB) : "";

        if (!elA && !elB) {
            this._contentEl.appendChild(_makeEmptyState("Select 2 assets for A/B compare"));
            return;
        }
        if (!elB) {
            // Only one asset — render as simple
            this._renderSimple();
            return;
        }
        // Audio does not map well to clipped A/B mode; use side-by-side players instead.
        if (kindA === "audio" || kindB === "audio" || kindA === "model3d" || kindB === "model3d") {
            this._renderSide();
            return;
        }

        const container = document.createElement("div");
        container.className = "mjr-mfv-ab-container";

        // Layer A — full-size backdrop
        const layerA = document.createElement("div");
        layerA.className = "mjr-mfv-ab-layer";
        if (elA) layerA.appendChild(elA);

        // Layer B — clipped from the left edge to the divider
        const layerB = document.createElement("div");
        layerB.className = "mjr-mfv-ab-layer mjr-mfv-ab-layer--b";
        const pct = Math.round(this._abDividerX * 100);
        layerB.style.clipPath = `inset(0 0 0 ${pct}%)`;
        layerB.appendChild(elB);

        // Draggable divider bar
        const divider = document.createElement("div");
        divider.className = "mjr-mfv-ab-divider";
        divider.style.left = `${pct}%`;

        // Gen info overlays are placed at the container level (outside the clipped
        // layers) so they are never truncated by layerB's clip-path. Each overlay
        // is bounded to its own half, mirroring the canvas capture layout.
        const fragA = this._buildGenInfoDOM(this._mediaA);
        let genInfoAEl = null;
        if (fragA) {
            genInfoAEl = document.createElement("div");
            genInfoAEl.className = "mjr-mfv-geninfo-a";
            genInfoAEl.appendChild(fragA);
            // Limit right edge to divider so it doesn't bleed into B side.
            genInfoAEl.style.right = `calc(${100 - pct}% + 8px)`;
        }
        const fragB = this._buildGenInfoDOM(this._mediaB);
        let genInfoBEl = null;
        if (fragB) {
            genInfoBEl = document.createElement("div");
            genInfoBEl.className = "mjr-mfv-geninfo-b";
            genInfoBEl.appendChild(fragB);
            // Start at the divider — overrides CSS left:8px so it is never
            // clipped by layerB's clip-path.
            genInfoBEl.style.left = `calc(${pct}% + 8px)`;
        }

        let _abDivAC = null;
        divider.addEventListener(
            "pointerdown",
            (e) => {
                e.preventDefault();
                divider.setPointerCapture(e.pointerId);
                // Abort any previous drag listeners to prevent accumulation.
                try {
                    _abDivAC?.abort();
                } catch {}
                _abDivAC = new AbortController();
                const sig = _abDivAC.signal;
                const rect = container.getBoundingClientRect();

                const onMove = (me) => {
                    const x = Math.max(0.02, Math.min(0.98, (me.clientX - rect.left) / rect.width));
                    this._abDividerX = x;
                    const p = Math.round(x * 100);
                    layerB.style.clipPath = `inset(0 0 0 ${p}%)`;
                    divider.style.left = `${p}%`;
                    if (genInfoAEl) genInfoAEl.style.right = `calc(${100 - p}% + 8px)`;
                    if (genInfoBEl) genInfoBEl.style.left = `calc(${p}% + 8px)`;
                };
                const onUp = () => {
                    try {
                        _abDivAC?.abort();
                    } catch {}
                };
                divider.addEventListener("pointermove", onMove, { signal: sig });
                divider.addEventListener("pointerup", onUp, { signal: sig });
            },
            this._panelAC?.signal ? { signal: this._panelAC.signal } : undefined,
        );

        container.appendChild(layerA);
        container.appendChild(layerB);
        container.appendChild(divider);
        if (genInfoAEl) container.appendChild(genInfoAEl);
        if (genInfoBEl) container.appendChild(genInfoBEl);
        container.appendChild(_makeLabel("A", "left"));
        container.appendChild(_makeLabel("B", "right"));
        this._contentEl.appendChild(container);
    }

    _renderSide() {
        const elA = this._mediaA ? _buildMediaEl(this._mediaA) : null;
        const elB = this._mediaB ? _buildMediaEl(this._mediaB) : null;
        const kindA = this._mediaA ? _mediaKind(this._mediaA) : "";
        const kindB = this._mediaB ? _mediaKind(this._mediaB) : "";

        if (!elA && !elB) {
            this._contentEl.appendChild(_makeEmptyState("Select 2 assets for Side-by-Side"));
            return;
        }

        const container = document.createElement("div");
        container.className = "mjr-mfv-side-container";

        const sideA = document.createElement("div");
        sideA.className = "mjr-mfv-side-panel";
        if (elA) sideA.appendChild(elA);
        else sideA.appendChild(_makeEmptyState("—"));
        sideA.appendChild(_makeLabel("A", "left"));

        // Gen info overlay for left
        const fragSideA = kindA === "audio" ? null : this._buildGenInfoDOM(this._mediaA);
        if (fragSideA) {
            const oa = document.createElement("div");
            oa.className = "mjr-mfv-geninfo-a";
            oa.appendChild(fragSideA);
            sideA.appendChild(oa);
        }

        const sideB = document.createElement("div");
        sideB.className = "mjr-mfv-side-panel";
        if (elB) sideB.appendChild(elB);
        else sideB.appendChild(_makeEmptyState("—"));
        sideB.appendChild(_makeLabel("B", "right"));

        // Gen info overlay for right
        const fragSideB = kindB === "audio" ? null : this._buildGenInfoDOM(this._mediaB);
        if (fragSideB) {
            const ob = document.createElement("div");
            ob.className = "mjr-mfv-geninfo-b";
            ob.appendChild(fragSideB);
            sideB.appendChild(ob);
        }

        container.appendChild(sideA);
        container.appendChild(sideB);
        this._contentEl.appendChild(container);
    }

    _renderGrid() {
        const slots = [
            { media: this._mediaA, label: "A" },
            { media: this._mediaB, label: "B" },
            { media: this._mediaC, label: "C" },
            { media: this._mediaD, label: "D" },
        ];
        const filled = slots.filter((s) => s.media);
        if (!filled.length) {
            this._contentEl.appendChild(_makeEmptyState("Select up to 4 assets for Grid Compare"));
            return;
        }

        const container = document.createElement("div");
        container.className = "mjr-mfv-grid-container";

        for (const { media, label } of slots) {
            const cell = document.createElement("div");
            cell.className = "mjr-mfv-grid-cell";
            if (media) {
                const kind = _mediaKind(media);
                const el = _buildMediaEl(media);
                if (el) cell.appendChild(el);
                else cell.appendChild(_makeEmptyState("—"));
                cell.appendChild(
                    _makeLabel(label, label === "A" || label === "C" ? "left" : "right"),
                );
                if (kind !== "audio") {
                    const frag = this._buildGenInfoDOM(media);
                    if (frag) {
                        const overlay = document.createElement("div");
                        overlay.className = `mjr-mfv-geninfo-${label.toLowerCase()}`;
                        overlay.appendChild(frag);
                        cell.appendChild(overlay);
                    }
                }
            } else {
                cell.appendChild(_makeEmptyState("—"));
                cell.appendChild(
                    _makeLabel(label, label === "A" || label === "C" ? "left" : "right"),
                );
            }
            container.appendChild(cell);
        }

        this._contentEl.appendChild(container);
    }

    // ── Visibility ────────────────────────────────────────────────────────────

    show() {
        if (!this.element) return;
        this._bindDocumentUiHandlers();
        this.element.classList.add("is-visible");
        this.element.setAttribute("aria-hidden", "false");
        this.isVisible = true;
    }

    hide() {
        if (!this.element) return;
        // Destroy pan/zoom so _dragging and pointer-capture state are reset cleanly
        // even if hide() is called mid-drag (NM-5).
        this._destroyPanZoom();
        this._destroyCompareSync();
        this._stopEdgeResize();
        this._closeGenDropdown();
        _pauseMediaIn(this.element);
        this.element.classList.remove("is-visible");
        this.element.setAttribute("aria-hidden", "true");
        this.isVisible = false;
    }

    // ── Pop-out / Pop-in (separate OS window for second monitor) ────────────

    /**
     * Move the viewer into a separate browser window so it can be
     * dragged onto a second monitor. Opens a dedicated same-origin page,
     * then adopts the live DOM tree into that page so state/listeners persist.
     */
    popOut() {
        if (this._isPopped || !this.element) return;
        const el = this.element;
        this._stopEdgeResize();

        const w = Math.max(el.offsetWidth || 520, 400);
        const h = Math.max(el.offsetHeight || 420, 300);

        // 1. Document Picture-in-Picture (Chrome 116+) ─────────────────────────
        //    Creates a same-origin always-on-top window that shares the full JS
        //    context of the main page.  Bypasses the about:blank isolation that
        //    breaks window.open() in Chrome App mode and Electron-based hosts.
        if ("documentPictureInPicture" in window) {
            window.documentPictureInPicture
                .requestWindow({ width: w, height: h })
                .then((pipWindow) => {
                    this._popoutWindow = pipWindow;
                    this._isPopped = true;
                    this._popoutRestoreGuard = false;
                    try {
                        this._popoutAC?.abort();
                    } catch (e) {
                        console.debug?.(e);
                    }
                    this._popoutAC = new AbortController();
                    const popoutSignal = this._popoutAC.signal;

                    const handlePopupClosing = () => this._schedulePopInFromPopupClose();
                    this._popoutCloseHandler = handlePopupClosing;

                    const doc = pipWindow.document;
                    doc.title = "Majoor Viewer";
                    this._installPopoutStyles(doc);

                    // Build a minimal shell directly — no server round-trip needed.
                    doc.body.style.cssText =
                        "margin:0;display:flex;min-height:100vh;background:#111;overflow:hidden;";
                    const root = doc.createElement("div");
                    root.id = "mjr-mfv-popout-root";
                    root.style.cssText = "flex:1;min-width:0;min-height:0;display:flex;";
                    doc.body.appendChild(root);

                    try {
                        root.appendChild(doc.adoptNode(el));
                    } catch (e) {
                        console.warn("[MFV] PiP adoptNode failed, falling back to window.open", e);
                        this._isPopped = false;
                        this._popoutWindow = null;
                        try {
                            pipWindow.close();
                        } catch (_) {
                            /* noop */
                        }
                        this._fallbackPopout(el, w, h);
                        return;
                    }
                    el.classList.add("is-visible");
                    this.isVisible = true;

                    this._resetGenDropdownForCurrentDocument();
                    this._rebindControlHandlers();
                    this._bindDocumentUiHandlers();
                    this._updatePopoutBtnUI();

                    pipWindow.addEventListener("pagehide", handlePopupClosing, {
                        signal: popoutSignal,
                    });
                    this._startPopoutCloseWatch();

                    this._popoutKeydownHandler = (e) => {
                        const tag = String(e?.target?.tagName || "").toLowerCase();
                        if (
                            e?.defaultPrevented ||
                            e?.target?.isContentEditable ||
                            tag === "input" ||
                            tag === "textarea" ||
                            tag === "select"
                        )
                            return;
                        const _lower = String(e?.key || "").toLowerCase();
                        window.dispatchEvent(
                            new KeyboardEvent("keydown", {
                                key: e.key,
                                code: e.code,
                                keyCode: e.keyCode,
                                ctrlKey: e.ctrlKey,
                                shiftKey: e.shiftKey,
                                altKey: e.altKey,
                                metaKey: e.metaKey,
                            }),
                        );
                    };
                    pipWindow.addEventListener("keydown", this._popoutKeydownHandler, {
                        signal: popoutSignal,
                    });
                })
                .catch((err) => {
                    console.warn("[MFV] Document PiP failed, falling back to window.open", err);
                    this._fallbackPopout(el, w, h);
                });
            return;
        }

        // 2. Fallback: classic window.open() to the backend-served shell page.
        this._fallbackPopout(el, w, h);
    }

    /**
     * Classic popup fallback used when Document PiP is unavailable.
     * Opens about:blank and builds the shell directly in the popup document
     * to avoid Electron / Chrome App mode issues where navigating to a
     * backend URL results in a blank page.
     */
    _fallbackPopout(el, w, h) {
        const left =
            (window.screenX || window.screenLeft) + Math.round((window.outerWidth - w) / 2);
        const top = (window.screenY || window.screenTop) + Math.round((window.outerHeight - h) / 2);
        const features = `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,status=no`;
        const popup = window.open("about:blank", "_mjr_viewer", features);
        if (!popup) {
            console.warn("[MFV] Pop-out blocked — allow popups for this site.");
            return;
        }
        this._popoutWindow = popup;
        this._isPopped = true;
        this._popoutRestoreGuard = false;
        try {
            this._popoutAC?.abort();
        } catch (e) {
            console.debug?.(e);
        }
        this._popoutAC = new AbortController();
        const popoutSignal = this._popoutAC.signal;
        const handlePopupClosing = () => this._schedulePopInFromPopupClose();
        this._popoutCloseHandler = handlePopupClosing;

        const mountViewer = () => {
            let doc;
            try {
                doc = popup.document;
            } catch {
                return;
            }
            if (!doc) return;

            // Build the shell directly — no server round-trip needed.
            doc.title = "Majoor Viewer";
            this._installPopoutStyles(doc);
            doc.body.style.cssText =
                "margin:0;display:flex;min-height:100vh;background:#111;overflow:hidden;";
            const root = doc.createElement("div");
            root.id = "mjr-mfv-popout-root";
            root.style.cssText = "flex:1;min-width:0;min-height:0;display:flex;";
            doc.body.appendChild(root);

            try {
                root.appendChild(doc.adoptNode(el));
            } catch (e) {
                console.warn("[MFV] adoptNode failed", e);
                return;
            }
            el.classList.add("is-visible");
            this.isVisible = true;
            this._resetGenDropdownForCurrentDocument();
            this._rebindControlHandlers();
            this._bindDocumentUiHandlers();
            this._updatePopoutBtnUI();
        };

        // about:blank is synchronously available — mount immediately.
        try {
            mountViewer();
        } catch (e) {
            console.debug?.("[MFV] immediate mount failed, retrying on load", e);
            try {
                popup.addEventListener("load", mountViewer, { signal: popoutSignal });
            } catch (e2) {
                console.debug?.("[MFV] pop-out page load listener failed", e2);
            }
        }

        popup.addEventListener("beforeunload", handlePopupClosing, { signal: popoutSignal });
        popup.addEventListener("pagehide", handlePopupClosing, { signal: popoutSignal });
        popup.addEventListener("unload", handlePopupClosing, { signal: popoutSignal });
        this._startPopoutCloseWatch();

        this._popoutKeydownHandler = (e) => {
            const tag = String(e?.target?.tagName || "").toLowerCase();
            if (
                e?.defaultPrevented ||
                e?.target?.isContentEditable ||
                tag === "input" ||
                tag === "textarea" ||
                tag === "select"
            )
                return;
            const lower = String(e?.key || "").toLowerCase();
            if (lower === "v" && (e?.ctrlKey || e?.metaKey) && !e?.altKey && !e?.shiftKey) {
                e.preventDefault();
                e.stopPropagation?.();
                e.stopImmediatePropagation?.();
                window.dispatchEvent(new Event(EVENTS.MFV_TOGGLE));
                return;
            }
            window.dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: e.key,
                    code: e.code,
                    keyCode: e.keyCode,
                    ctrlKey: e.ctrlKey,
                    shiftKey: e.shiftKey,
                    altKey: e.altKey,
                    metaKey: e.metaKey,
                }),
            );
        };
        popup.addEventListener("keydown", this._popoutKeydownHandler, { signal: popoutSignal });
    }

    _clearPopoutCloseWatch() {
        if (this._popoutCloseTimer == null) return;
        try {
            window.clearInterval(this._popoutCloseTimer);
        } catch (e) {
            console.debug?.(e);
        }
        this._popoutCloseTimer = null;
    }

    _startPopoutCloseWatch() {
        this._clearPopoutCloseWatch();
        this._popoutCloseTimer = window.setInterval(() => {
            if (!this._isPopped) {
                this._clearPopoutCloseWatch();
                return;
            }
            const popup = this._popoutWindow;
            if (!popup || popup.closed) {
                this._clearPopoutCloseWatch();
                this._schedulePopInFromPopupClose();
            }
        }, 250);
    }

    _schedulePopInFromPopupClose() {
        if (!this._isPopped || this._popoutRestoreGuard) return;
        this._popoutRestoreGuard = true;
        window.setTimeout(() => {
            try {
                this.popIn({ closePopupWindow: false });
            } finally {
                this._popoutRestoreGuard = false;
            }
        }, 0);
    }

    _installPopoutStyles(doc) {
        if (!doc?.head) return;
        try {
            for (const existing of doc.head.querySelectorAll(
                "[data-mjr-popout-cloned-style='1']",
            )) {
                existing.remove();
            }
        } catch (e) {
            console.debug?.(e);
        }
        for (const ss of document.querySelectorAll('link[rel="stylesheet"], style')) {
            try {
                let clone = null;
                if (ss.tagName === "LINK") {
                    clone = doc.createElement("link");
                    for (const attr of Array.from(ss.attributes || [])) {
                        if (attr?.name === "href") continue;
                        clone.setAttribute(attr.name, attr.value);
                    }
                    clone.setAttribute("href", ss.href || ss.getAttribute("href") || "");
                } else {
                    clone = doc.importNode(ss, true);
                }
                clone.setAttribute("data-mjr-popout-cloned-style", "1");
                doc.head.appendChild(clone);
            } catch (e) {
                console.debug?.(e);
            }
        }
        const overrideStyle = doc.createElement("style");
        overrideStyle.setAttribute("data-mjr-popout-cloned-style", "1");
        overrideStyle.textContent = `
            .mjr-mfv {
                position: static !important;
                width: 100% !important;
                height: 100% !important;
                min-width: 0 !important;
                min-height: 0 !important;
                resize: none !important;
                border: none !important;
                border-radius: 0 !important;
                box-shadow: none !important;
                /* Override animated hidden state so it shows immediately in popup */
                display: flex !important;
                opacity: 1 !important;
                visibility: visible !important;
                pointer-events: auto !important;
                transform: none !important;
                transition: none !important;
            }
        `;
        doc.head.appendChild(overrideStyle);
    }

    /**
     * Move the viewer back from the popup window into the main ComfyUI page.
     */
    popIn({ closePopupWindow = true } = {}) {
        if (!this._isPopped || !this.element) return;
        const popup = this._popoutWindow;
        this._clearPopoutCloseWatch();
        // Abort all popup-window listeners atomically instead of manual removeEventListener.
        try {
            this._popoutAC?.abort();
        } catch (e) {
            console.debug?.(e);
        }
        this._popoutAC = null;
        this._popoutCloseHandler = null;
        this._popoutKeydownHandler = null;
        this._isPopped = false;

        // Re-adopt the element into the main document and append to body
        let adopted = this.element;
        try {
            adopted = adopted?.ownerDocument === document ? adopted : document.adoptNode(adopted);
        } catch (e) {
            console.debug?.("[MFV] pop-in adopt failed", e);
        }
        document.body.appendChild(adopted);
        this._resetGenDropdownForCurrentDocument();
        this._rebindControlHandlers();
        this._bindPanelInteractions();
        this._bindDocumentUiHandlers();
        adopted.classList.add("is-visible");
        adopted.setAttribute("aria-hidden", "false");
        this.isVisible = true;

        this._updatePopoutBtnUI();

        // Close the popup window if it's still open
        if (closePopupWindow) {
            try {
                popup?.close();
            } catch (e) {
                console.debug?.(e);
            }
        }
        this._popoutWindow = null;
    }
    /** Toggle pop-out button icon between external-link (pop out) and sign-in (pop in). */
    _updatePopoutBtnUI() {
        if (!this._popoutBtn) return;
        if (this.element) {
            this.element.classList.toggle("mjr-mfv--popped", this._isPopped);
        }
        this._popoutBtn.classList.toggle("mjr-popin-active", this._isPopped);
        const icon = this._popoutBtn.querySelector("i") || document.createElement("i");
        const label = this._isPopped
            ? t("tooltip.popInViewer", "Return to floating panel")
            : t("tooltip.popOutViewer", "Expand to full screen (Esc or button to return)");
        if (this._isPopped) {
            icon.className = "pi pi-sign-in";
        } else {
            icon.className = "pi pi-external-link";
        }
        this._popoutBtn.title = label;
        this._popoutBtn.setAttribute("aria-label", label);
        this._popoutBtn.setAttribute("aria-pressed", String(this._isPopped));
        if (!this._popoutBtn.contains(icon)) {
            this._popoutBtn.replaceChildren(icon);
        }
    }

    /** Whether the viewer is currently in a pop-out window. */
    get isPopped() {
        return this._isPopped;
    }

    _resizeCursorForDirection(dir) {
        const map = {
            n: "ns-resize",
            s: "ns-resize",
            e: "ew-resize",
            w: "ew-resize",
            ne: "nesw-resize",
            nw: "nwse-resize",
            se: "nwse-resize",
            sw: "nesw-resize",
        };
        return map[dir] || "";
    }

    _getResizeDirectionFromPoint(clientX, clientY, rect) {
        if (!rect) return "";
        const nearLeft = clientX <= rect.left + MFV_RESIZE_EDGE_HIT_PX;
        const nearRight = clientX >= rect.right - MFV_RESIZE_EDGE_HIT_PX;
        const nearTop = clientY <= rect.top + MFV_RESIZE_EDGE_HIT_PX;
        const nearBottom = clientY >= rect.bottom - MFV_RESIZE_EDGE_HIT_PX;
        if (nearTop && nearLeft) return "nw";
        if (nearTop && nearRight) return "ne";
        if (nearBottom && nearLeft) return "sw";
        if (nearBottom && nearRight) return "se";
        if (nearTop) return "n";
        if (nearBottom) return "s";
        if (nearLeft) return "w";
        if (nearRight) return "e";
        return "";
    }

    _stopEdgeResize() {
        if (!this.element) return;
        if (this._resizeState?.pointerId != null) {
            try {
                this.element.releasePointerCapture(this._resizeState.pointerId);
            } catch (e) {
                console.debug?.(e);
            }
        }
        this._resizeState = null;
        this.element.classList.remove("mjr-mfv--resizing");
        this.element.style.cursor = "";
    }

    _bindPanelInteractions() {
        if (!this.element) return;
        this._stopEdgeResize();
        try {
            this._panelAC?.abort();
        } catch (e) {
            console.debug?.(e);
        }
        this._panelAC = new AbortController();
        this._initEdgeResize(this.element);
        this._initDrag(this.element.querySelector(".mjr-mfv-header"));
    }

    _initEdgeResize(el) {
        if (!el) return;
        const resolveDir = (e) => {
            if (!this.element || this._isPopped) return "";
            const rect = this.element.getBoundingClientRect();
            return this._getResizeDirectionFromPoint(e.clientX, e.clientY, rect);
        };
        const signal = this._panelAC?.signal;

        const onPointerDown = (e) => {
            if (e.button !== 0 || !this.element || this._isPopped) return;
            const dir = resolveDir(e);
            if (!dir) return;
            // Edge resize takes priority over drag interactions.
            e.preventDefault();
            e.stopPropagation();
            const rect = this.element.getBoundingClientRect();
            const style = window.getComputedStyle(this.element);
            const minWidth = Math.max(120, Number.parseFloat(style.minWidth) || 0);
            const minHeight = Math.max(100, Number.parseFloat(style.minHeight) || 0);
            this._resizeState = {
                pointerId: e.pointerId,
                dir,
                startX: e.clientX,
                startY: e.clientY,
                startLeft: rect.left,
                startTop: rect.top,
                startWidth: rect.width,
                startHeight: rect.height,
                minWidth,
                minHeight,
            };
            this.element.style.left = `${Math.round(rect.left)}px`;
            this.element.style.top = `${Math.round(rect.top)}px`;
            this.element.style.right = "auto";
            this.element.style.bottom = "auto";
            this.element.classList.add("mjr-mfv--resizing");
            this.element.style.cursor = this._resizeCursorForDirection(dir);
            try {
                this.element.setPointerCapture(e.pointerId);
            } catch (err) {
                console.debug?.(err);
            }
        };

        const onPointerMove = (e) => {
            if (!this.element || this._isPopped) return;
            const state = this._resizeState;
            if (!state) {
                const dir = resolveDir(e);
                this.element.style.cursor = dir ? this._resizeCursorForDirection(dir) : "";
                return;
            }
            if (state.pointerId !== e.pointerId) return;

            const dx = e.clientX - state.startX;
            const dy = e.clientY - state.startY;
            let width = state.startWidth;
            let height = state.startHeight;
            let left = state.startLeft;
            let top = state.startTop;

            if (state.dir.includes("e")) width = state.startWidth + dx;
            if (state.dir.includes("s")) height = state.startHeight + dy;
            if (state.dir.includes("w")) {
                width = state.startWidth - dx;
                left = state.startLeft + dx;
            }
            if (state.dir.includes("n")) {
                height = state.startHeight - dy;
                top = state.startTop + dy;
            }

            if (width < state.minWidth) {
                if (state.dir.includes("w")) left -= state.minWidth - width;
                width = state.minWidth;
            }
            if (height < state.minHeight) {
                if (state.dir.includes("n")) top -= state.minHeight - height;
                height = state.minHeight;
            }

            width = Math.min(width, Math.max(state.minWidth, window.innerWidth));
            height = Math.min(height, Math.max(state.minHeight, window.innerHeight));
            left = Math.min(Math.max(0, left), Math.max(0, window.innerWidth - width));
            top = Math.min(Math.max(0, top), Math.max(0, window.innerHeight - height));

            this.element.style.width = `${Math.round(width)}px`;
            this.element.style.height = `${Math.round(height)}px`;
            this.element.style.left = `${Math.round(left)}px`;
            this.element.style.top = `${Math.round(top)}px`;
            this.element.style.right = "auto";
            this.element.style.bottom = "auto";
        };

        const onPointerEnd = (e) => {
            if (!this.element || !this._resizeState) return;
            if (this._resizeState.pointerId !== e.pointerId) return;
            const dir = resolveDir(e);
            this._stopEdgeResize();
            if (dir) this.element.style.cursor = this._resizeCursorForDirection(dir);
        };

        el.addEventListener("pointerdown", onPointerDown, { capture: true, signal });
        el.addEventListener("pointermove", onPointerMove, { signal });
        el.addEventListener("pointerup", onPointerEnd, { signal });
        el.addEventListener("pointercancel", onPointerEnd, { signal });
        el.addEventListener(
            "pointerleave",
            () => {
                if (!this._resizeState && this.element) this.element.style.cursor = "";
            },
            { signal },
        );
    }

    // ── Drag ──────────────────────────────────────────────────────────────────

    _initDrag(handle) {
        if (!handle) return;
        const signal = this._panelAC?.signal;
        let _dragAC = null;
        handle.addEventListener(
            "pointerdown",
            (e) => {
                if (e.button !== 0) return;
                if (e.target.closest("button")) return; // Don't drag when clicking buttons
                if (e.target.closest("select")) return;
                if (this._isPopped || !this.element) return;
                // Let edge-resize take precedence when pointer is near panel borders.
                const edgeDir = this._getResizeDirectionFromPoint(
                    e.clientX,
                    e.clientY,
                    this.element.getBoundingClientRect(),
                );
                if (edgeDir) return;
                e.preventDefault();
                handle.setPointerCapture(e.pointerId);
                // Abort any previous drag listeners to prevent accumulation.
                try {
                    _dragAC?.abort();
                } catch {}
                _dragAC = new AbortController();
                const dragSig = _dragAC.signal;

                const el = this.element;
                const rect = el.getBoundingClientRect();
                const offX = e.clientX - rect.left;
                const offY = e.clientY - rect.top;

                const onMove = (me) => {
                    const x = Math.min(
                        window.innerWidth - el.offsetWidth,
                        Math.max(0, me.clientX - offX),
                    );
                    const y = Math.min(
                        window.innerHeight - el.offsetHeight,
                        Math.max(0, me.clientY - offY),
                    );
                    el.style.left = `${x}px`;
                    el.style.top = `${y}px`;
                    el.style.right = "auto";
                    el.style.bottom = "auto";
                };
                const onUp = () => {
                    try {
                        _dragAC?.abort();
                    } catch {}
                };
                handle.addEventListener("pointermove", onMove, { signal: dragSig });
                handle.addEventListener("pointerup", onUp, { signal: dragSig });
            },
            signal ? { signal } : undefined,
        );
    }

    // ── Canvas capture ────────────────────────────────────────────────────────

    /**
     * Draw a media asset (image or current video frame) letterboxed into
     * the canvas region (ox, oy, w, h).  preferredVideo is used for multi-
     * video modes so we grab the right element.
     */
    async _drawMediaFit(ctx, fileData, ox, oy, w, h, preferredVideo) {
        if (!fileData) return;
        const kind = _mediaKind(fileData);
        let drawable = null;

        if (kind === "video") {
            drawable =
                preferredVideo instanceof HTMLVideoElement
                    ? preferredVideo
                    : this._contentEl?.querySelector("video") || null;
        }
        if (!drawable && kind === "model3d") {
            const assetId = fileData?.id != null ? String(fileData.id) : "";
            if (assetId) {
                drawable =
                    this._contentEl?.querySelector?.(
                        `.mjr-model3d-render-canvas[data-mjr-asset-id="${assetId}"]`,
                    ) || null;
            }
            if (!drawable) {
                drawable = this._contentEl?.querySelector?.(".mjr-model3d-render-canvas") || null;
            }
        }
        if (!drawable) {
            const url = _resolveUrl(fileData);
            if (!url) return;
            drawable = await new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => resolve(img);
                img.onerror = () => resolve(null);
                img.src = url;
            });
        }
        if (!drawable) return;

        const sw = drawable.videoWidth || drawable.naturalWidth || w;
        const sh = drawable.videoHeight || drawable.naturalHeight || h;
        if (!sw || !sh) return;
        const scale = Math.min(w / sw, h / sh);
        ctx.drawImage(
            drawable,
            ox + (w - sw * scale) / 2,
            oy + (h - sh * scale) / 2,
            sw * scale,
            sh * scale,
        );
    }

    /** Render the gen-info overlay onto the canvas region (ox, oy, w, h). */
    _drawGenInfoOverlay(ctx, fileData, ox, oy, w, h) {
        if (!fileData || !this._genInfoSelections.size) return;
        const fields = this._getGenFields(fileData);
        const LABEL_COLORS = {
            prompt: "#7ec8ff",
            seed: "#ffd47a",
            model: "#7dda8a",
            lora: "#d48cff",
            sampler: "#ff9f7a",
            scheduler: "#ff7a9f",
            cfg: "#7a9fff",
            step: "#7affd4",
            genTime: "#e0ff7a",
        };
        const order = [
            "prompt",
            "seed",
            "model",
            "lora",
            "sampler",
            "scheduler",
            "cfg",
            "step",
            "genTime",
        ];

        const entries = [];
        for (const k of order) {
            if (!this._genInfoSelections.has(k)) continue;
            const v = fields[k] != null ? String(fields[k]) : "";
            if (!v) continue;

            let labelText = k.charAt(0).toUpperCase() + k.slice(1);
            if (k === "lora") labelText = "LoRA";
            else if (k === "cfg") labelText = "CFG";
            else if (k === "genTime") labelText = "Gen Time";

            // Generous cap — word wrap handles display, not hard truncation
            const raw = k === "prompt" && v.length > 500 ? v.slice(0, 500) + "…" : v;
            entries.push({
                label: `${labelText}: `,
                value: raw,
                color: LABEL_COLORS[k] || "#ffffff",
            });
        }
        if (!entries.length) return;

        const fontSize = 11;
        const lh = 16;
        const pad = 8;
        // Box always spans the full region width so word-wrapped lines have room.
        const boxW = Math.max(100, w - pad * 2);

        ctx.save();

        // Build rows with word-wrapped lines (mirrors CSS word-break: break-word).
        const rows = [];
        for (const { label, value, color } of entries) {
            ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
            const labelW = ctx.measureText(label).width;
            ctx.font = `${fontSize}px system-ui, sans-serif`;
            const availW = boxW - pad * 2 - labelW;
            const lines = [];
            let line = "";
            for (const word of value.split(" ")) {
                const test = line ? line + " " + word : word;
                if (ctx.measureText(test).width > availW && line) {
                    lines.push(line);
                    line = word;
                } else {
                    line = test;
                }
            }
            if (line) lines.push(line);
            rows.push({ label, labelW, lines, color });
        }

        // Cap height at 40% of region (mirrors CSS max-height: 40%)
        const maxVisibleLines = Math.max(1, Math.floor((h * 0.4 - pad * 2) / lh));
        const visibleRows = [];
        let lineCount = 0;
        for (const row of rows) {
            if (lineCount >= maxVisibleLines) break;
            const kept = [];
            for (const ln of row.lines) {
                if (lineCount >= maxVisibleLines) break;
                kept.push(ln);
                lineCount++;
            }
            if (kept.length > 0) visibleRows.push({ ...row, lines: kept });
        }

        const boxH = lineCount * lh + pad * 2;
        const boxX = ox + pad;
        const boxY = oy + h - boxH - pad;

        // Background
        ctx.globalAlpha = 0.72;
        ctx.fillStyle = "#000";
        _canvasRoundRect(ctx, boxX, boxY, boxW, boxH, 6);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Draw word-wrapped text
        let ty = boxY + pad + fontSize;
        for (const { label, labelW, lines, color } of visibleRows) {
            for (let i = 0; i < lines.length; i++) {
                if (i === 0) {
                    // First line: colored bold label then value
                    ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
                    ctx.fillStyle = color;
                    ctx.fillText(label, boxX + pad, ty);
                    ctx.font = `${fontSize}px system-ui, sans-serif`;
                    ctx.fillStyle = "rgba(255,255,255,0.88)";
                    ctx.fillText(lines[i], boxX + pad + labelW, ty);
                } else {
                    // Continuation: indented to align under value start
                    ctx.font = `${fontSize}px system-ui, sans-serif`;
                    ctx.fillStyle = "rgba(255,255,255,0.88)";
                    ctx.fillText(lines[i], boxX + pad + labelW, ty);
                }
                ty += lh;
            }
        }
        ctx.restore();
    }

    /** Capture the current view to PNG and trigger a browser download. */
    async _captureView() {
        if (!this._contentEl) return;

        // Visual feedback: disable button and announce capturing state to screen readers (NL-6).
        if (this._captureBtn) {
            this._captureBtn.disabled = true;
            this._captureBtn.setAttribute("aria-label", t("tooltip.capturingView", "Capturing…"));
        }

        const w = this._contentEl.clientWidth || 480;
        const h = this._contentEl.clientHeight || 360;

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");

        ctx.fillStyle = "#0d0d0d";
        ctx.fillRect(0, 0, w, h);

        try {
            if (this._mode === MFV_MODES.SIMPLE) {
                if (this._mediaA) {
                    await this._drawMediaFit(ctx, this._mediaA, 0, 0, w, h);
                    this._drawGenInfoOverlay(ctx, this._mediaA, 0, 0, w, h);
                }
            } else if (this._mode === MFV_MODES.AB) {
                const divX = Math.round(this._abDividerX * w);
                const vidA = this._contentEl.querySelector(
                    ".mjr-mfv-ab-layer:not(.mjr-mfv-ab-layer--b) video",
                );
                const vidB = this._contentEl.querySelector(".mjr-mfv-ab-layer--b video");

                // Draw A full-width (background layer)
                if (this._mediaA) await this._drawMediaFit(ctx, this._mediaA, 0, 0, w, h, vidA);

                // Draw B clipped to the right of the divider
                if (this._mediaB) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(divX, 0, w - divX, h);
                    ctx.clip();
                    await this._drawMediaFit(ctx, this._mediaB, 0, 0, w, h, vidB);
                    ctx.restore();
                }

                // Divider line
                ctx.save();
                ctx.strokeStyle = "rgba(255,255,255,0.88)";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(divX, 0);
                ctx.lineTo(divX, h);
                ctx.stroke();
                ctx.restore();

                // A/B labels and overlays
                _canvasLabel(ctx, "A", 8, 8);
                _canvasLabel(ctx, "B", divX + 8, 8);
                if (this._mediaA) this._drawGenInfoOverlay(ctx, this._mediaA, 0, 0, divX, h);
                if (this._mediaB) this._drawGenInfoOverlay(ctx, this._mediaB, divX, 0, w - divX, h);
            } else if (this._mode === MFV_MODES.SIDE) {
                const half = Math.floor(w / 2);
                const vidA = this._contentEl.querySelector(".mjr-mfv-side-panel:first-child video");
                const vidB = this._contentEl.querySelector(".mjr-mfv-side-panel:last-child video");

                if (this._mediaA) {
                    await this._drawMediaFit(ctx, this._mediaA, 0, 0, half, h, vidA);
                    this._drawGenInfoOverlay(ctx, this._mediaA, 0, 0, half, h);
                }
                // Gap between panels
                ctx.fillStyle = "#111";
                ctx.fillRect(half, 0, 2, h);
                if (this._mediaB) {
                    await this._drawMediaFit(ctx, this._mediaB, half, 0, half, h, vidB);
                    this._drawGenInfoOverlay(ctx, this._mediaB, half, 0, half, h);
                }
                _canvasLabel(ctx, "A", 8, 8);
                _canvasLabel(ctx, "B", half + 8, 8);
            } else if (this._mode === MFV_MODES.GRID) {
                const halfW = Math.floor(w / 2);
                const halfH = Math.floor(h / 2);
                const gap = 1; // half of CSS gap:2px — each cell insets by 1px from center
                const cells = [
                    { media: this._mediaA, label: "A", x: 0, y: 0, w: halfW - gap, h: halfH - gap },
                    {
                        media: this._mediaB,
                        label: "B",
                        x: halfW + gap,
                        y: 0,
                        w: halfW - gap,
                        h: halfH - gap,
                    },
                    {
                        media: this._mediaC,
                        label: "C",
                        x: 0,
                        y: halfH + gap,
                        w: halfW - gap,
                        h: halfH - gap,
                    },
                    {
                        media: this._mediaD,
                        label: "D",
                        x: halfW + gap,
                        y: halfH + gap,
                        w: halfW - gap,
                        h: halfH - gap,
                    },
                ];
                const gridCells = this._contentEl.querySelectorAll(".mjr-mfv-grid-cell");
                for (let i = 0; i < cells.length; i++) {
                    const c = cells[i];
                    const vid = gridCells[i]?.querySelector("video") || null;
                    if (c.media) {
                        await this._drawMediaFit(ctx, c.media, c.x, c.y, c.w, c.h, vid);
                        this._drawGenInfoOverlay(ctx, c.media, c.x, c.y, c.w, c.h);
                    }
                    _canvasLabel(ctx, c.label, c.x + 8, c.y + 8);
                }
                // Grid lines
                ctx.save();
                ctx.fillStyle = "#111";
                ctx.fillRect(halfW - gap, 0, gap * 2, h);
                ctx.fillRect(0, halfH - gap, w, gap * 2);
                ctx.restore();
            }
        } catch (e) {
            console.debug("[MFV] capture error:", e);
        }

        // Trigger download — toDataURL is synchronous so the click stays within
        // the user-gesture chain and is never blocked by the browser.
        const prefix =
            {
                [MFV_MODES.AB]: "mfv-ab",
                [MFV_MODES.SIDE]: "mfv-side",
                [MFV_MODES.GRID]: "mfv-grid",
            }[this._mode] ?? "mfv";
        const filename = `${prefix}-${Date.now()}.png`;
        try {
            const dataUrl = canvas.toDataURL("image/png");
            const a = document.createElement("a");
            a.href = dataUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => document.body.removeChild(a), 100);
        } catch (e) {
            console.warn("[MFV] download failed:", e);
        } finally {
            if (this._captureBtn) {
                this._captureBtn.disabled = false;
                this._captureBtn.setAttribute(
                    "aria-label",
                    t("tooltip.captureView", "Save view as image"),
                );
            }
        }
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    dispose() {
        this._destroyPanZoom();
        this._destroyCompareSync();
        this._stopEdgeResize();
        this._clearPopoutCloseWatch();
        try {
            this._panelAC?.abort();
            this._panelAC = null;
        } catch (e) {
            console.debug?.(e);
        }
        // Abort all button click listeners in one call (NM-1).
        try {
            this._btnAC?.abort();
            this._btnAC = null;
        } catch (e) {
            console.debug?.(e);
        }
        // Abort document-level and pop-out window listeners atomically.
        try {
            this._docAC?.abort();
            this._docAC = null;
        } catch (e) {
            console.debug?.(e);
        }
        try {
            this._popoutAC?.abort();
            this._popoutAC = null;
        } catch (e) {
            console.debug?.(e);
        }
        // Abort panzoom and compare-sync AbortControllers (belt-and-suspenders).
        try {
            this._panzoomAC?.abort();
            this._panzoomAC = null;
        } catch (e) {
            console.debug?.(e);
        }
        try {
            this._compareSyncAC?.abort?.();
            this._compareSyncAC = null;
        } catch (e) {
            console.debug?.(e);
        }
        // Pop-in before disposing so the element returns to the main document.
        try {
            if (this._isPopped) this.popIn();
        } catch (e) {
            console.debug?.(e);
        }
        this._revokePreviewBlob();
        try {
            this.element?.remove();
        } catch (e) {
            console.debug?.(e);
        }
        this.element = null;
        this._contentEl = null;
        this._closeBtn = null;
        this._modeBtn = null;
        this._pinSelect = null;
        this._liveBtn = null;
        this._nodeStreamBtn = null;
        this._popoutBtn = null;
        this._captureBtn = null;
        this._unbindDocumentUiHandlers();
        try {
            this._genDropdown?.remove();
        } catch (e) {
            console.debug?.(e);
        }
        this._mediaA = null;
        this._mediaB = null;
        this._mediaC = null;
        this._mediaD = null;
        this.isVisible = false;
    }
}
