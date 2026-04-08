import { s as F, t as S, E as x, n as te, a as V, b as z, e as G, g as U, c as $, i as W, d as ie, h as ne, M as se, j as oe, k as re, l as le } from "./entry-DfYxNHXl.js";
const g = Object.freeze({
  SIMPLE: "simple",
  AB: "ab",
  SIDE: "side",
  GRID: "grid"
}), X = 0.25, K = 8, ae = 8e-4, H = 8;
let de = 0;
const ce = /* @__PURE__ */ new Set([".mp4", ".webm", ".mov", ".avi", ".mkv"]), he = /* @__PURE__ */ new Set([".mp3", ".wav", ".flac", ".ogg", ".m4a", ".aac", ".opus", ".wma"]), pe = "C", q = "L", Z = "K", ue = "N", me = "Esc";
function _e() {
  var u, e, t, n, o;
  try {
    const i = typeof window < "u" ? window : globalThis, r = (e = (u = i == null ? void 0 : i.process) == null ? void 0 : u.versions) == null ? void 0 : e.electron;
    if (typeof r == "string" && r.trim() || i != null && i.electron || i != null && i.ipcRenderer || i != null && i.electronAPI)
      return !0;
    const l = String(((t = i == null ? void 0 : i.navigator) == null ? void 0 : t.userAgent) || ((n = globalThis == null ? void 0 : globalThis.navigator) == null ? void 0 : n.userAgent) || ""), c = /\bElectron\//i.test(l), s = /\bCode\//i.test(l);
    if (c && !s)
      return !0;
  } catch (i) {
    (o = console.debug) == null || o.call(console, i);
  }
  return !1;
}
function C(u, e = null, t = "info") {
  var o, i;
  const n = {
    stage: String(u || "unknown"),
    detail: e,
    ts: Date.now()
  };
  try {
    const r = typeof window < "u" ? window : globalThis, l = "__MJR_MFV_POPOUT_TRACE__", c = Array.isArray(r[l]) ? r[l] : [];
    c.push(n), r[l] = c.slice(-20), r.__MJR_MFV_POPOUT_LAST__ = n;
  } catch (r) {
    (o = console.debug) == null || o.call(console, r);
  }
  try {
    const r = t === "error" ? console.error : t === "warn" ? console.warn : console.info;
    r == null || r("[MFV popout]", n);
  } catch (r) {
    (i = console.debug) == null || i.call(console, r);
  }
}
function fe(u) {
  try {
    const e = String(u || "").trim(), t = e.lastIndexOf(".");
    return t >= 0 ? e.slice(t).toLowerCase() : "";
  } catch {
    return "";
  }
}
function k(u) {
  const e = String((u == null ? void 0 : u.kind) || "").toLowerCase();
  if (e === "video") return "video";
  if (e === "audio") return "audio";
  if (e === "model3d") return "model3d";
  const t = fe((u == null ? void 0 : u.filename) || "");
  return t === ".gif" ? "gif" : ce.has(t) ? "video" : he.has(t) ? "audio" : se.has(t) ? "model3d" : "image";
}
function Q(u) {
  return u ? u.url ? String(u.url) : u.filename && u.id == null ? re(u.filename, u.subfolder || "", u.type || "output") : u.filename && le(u) || "" : "";
}
function P(u = "No media — select assets in the grid") {
  const e = document.createElement("div");
  return e.className = "mjr-mfv-empty", e.textContent = u, e;
}
function T(u, e) {
  const t = document.createElement("div");
  return t.className = `mjr-mfv-label label-${e}`, t.textContent = u, t;
}
function J(u) {
  var e;
  if (!(!u || typeof u.play != "function"))
    try {
      const t = u.play();
      t && typeof t.catch == "function" && t.catch(() => {
      });
    } catch (t) {
      (e = console.debug) == null || e.call(console, t);
    }
}
function ge(u, e) {
  var n, o;
  let t = u && u.nodeType === 1 ? u : (u == null ? void 0 : u.parentElement) || null;
  for (; t && t !== e; ) {
    try {
      const i = (n = window.getComputedStyle) == null ? void 0 : n.call(window, t), r = /(auto|scroll|overlay)/.test(String((i == null ? void 0 : i.overflowY) || "")), l = /(auto|scroll|overlay)/.test(String((i == null ? void 0 : i.overflowX) || ""));
      if (r || l)
        return t;
    } catch (i) {
      (o = console.debug) == null || o.call(console, i);
    }
    t = t.parentElement || null;
  }
  return null;
}
function be(u, e, t) {
  if (!u) return !1;
  if (Math.abs(Number(t) || 0) >= Math.abs(Number(e) || 0)) {
    const i = Number(u.scrollTop || 0), r = Math.max(0, Number(u.scrollHeight || 0) - Number(u.clientHeight || 0));
    if (t < 0 && i > 0 || t > 0 && i < r) return !0;
  }
  const n = Number(u.scrollLeft || 0), o = Math.max(0, Number(u.scrollWidth || 0) - Number(u.clientWidth || 0));
  return e < 0 && n > 0 || e > 0 && n < o;
}
function ve(u) {
  var e, t, n, o;
  if (u)
    try {
      const i = (e = u.querySelectorAll) == null ? void 0 : e.call(u, "video, audio");
      if (!i || !i.length) return;
      for (const r of i)
        try {
          (t = r.pause) == null || t.call(r);
        } catch (l) {
          (n = console.debug) == null || n.call(console, l);
        }
    } catch (i) {
      (o = console.debug) == null || o.call(console, i);
    }
}
function j(u, { fill: e = !1 } = {}) {
  var r;
  const t = Q(u);
  if (!t) return null;
  const n = k(u), o = `mjr-mfv-media mjr-mfv-media--fit-height${e ? " mjr-mfv-media--fill" : ""}`;
  if (n === "audio") {
    const l = document.createElement("div");
    l.className = `mjr-mfv-audio-card${e ? " mjr-mfv-audio-card--fill" : ""}`;
    const c = document.createElement("div");
    c.className = "mjr-mfv-audio-head";
    const s = document.createElement("i");
    s.className = "pi pi-volume-up mjr-mfv-audio-icon", s.setAttribute("aria-hidden", "true");
    const a = document.createElement("div");
    a.className = "mjr-mfv-audio-title", a.textContent = String((u == null ? void 0 : u.filename) || "Audio"), c.appendChild(s), c.appendChild(a);
    const d = document.createElement("audio");
    d.className = "mjr-mfv-audio-player", d.src = t, d.controls = !0, d.autoplay = !0, d.preload = "metadata";
    try {
      d.addEventListener("loadedmetadata", () => J(d), { once: !0 });
    } catch (m) {
      (r = console.debug) == null || r.call(console, m);
    }
    return J(d), l.appendChild(c), l.appendChild(d), l;
  }
  if (n === "video") {
    const l = document.createElement("video");
    return l.className = o, l.src = t, l.controls = !0, l.loop = !0, l.muted = !0, l.autoplay = !0, l.playsInline = !0, l;
  }
  if (n === "model3d")
    return oe(u, t, {
      hostClassName: `mjr-model3d-host mjr-mfv-model3d-host${e ? " mjr-mfv-model3d-host--fill" : ""}`,
      canvasClassName: `mjr-mfv-media mjr-model3d-render-canvas${e ? " mjr-mfv-media--fill" : ""}`,
      hintText: "Rotate: left drag  Pan: right drag  Zoom: wheel or middle drag",
      disableViewerTransform: !0
    });
  const i = document.createElement("img");
  return i.className = o, i.src = t, i.alt = String((u == null ? void 0 : u.filename) || ""), i.draggable = !1, i;
}
function ee(u, e, t, n, o, i) {
  u.beginPath(), typeof u.roundRect == "function" ? u.roundRect(e, t, n, o, i) : (u.moveTo(e + i, t), u.lineTo(e + n - i, t), u.quadraticCurveTo(e + n, t, e + n, t + i), u.lineTo(e + n, t + o - i), u.quadraticCurveTo(e + n, t + o, e + n - i, t + o), u.lineTo(e + i, t + o), u.quadraticCurveTo(e, t + o, e, t + o - i), u.lineTo(e, t + i), u.quadraticCurveTo(e, t, e + i, t), u.closePath());
}
function D(u, e, t, n) {
  u.save(), u.font = "bold 10px system-ui, sans-serif";
  const o = 5, i = u.measureText(e).width;
  u.fillStyle = "rgba(0,0,0,0.58)", ee(u, t, n, i + o * 2, 18, 4), u.fill(), u.fillStyle = "#fff", u.fillText(e, t + o, n + 13), u.restore();
}
class ye {
  constructor({ controller: e = null } = {}) {
    this._instanceId = ++de, this._controller = e && typeof e == "object" ? { ...e } : null, this.element = null, this.isVisible = !1, this._contentEl = null, this._closeBtn = null, this._modeBtn = null, this._pinSelect = null, this._liveBtn = null, this._genBtn = null, this._genDropdown = null, this._captureBtn = null, this._genInfoSelections = /* @__PURE__ */ new Set(["genTime"]), this._mode = g.SIMPLE, this._mediaA = null, this._mediaB = null, this._mediaC = null, this._mediaD = null, this._pinnedSlot = null, this._abDividerX = 0.5, this._zoom = 1, this._panX = 0, this._panY = 0, this._panzoomAC = null, this._dragging = !1, this._compareSyncAC = null, this._btnAC = null, this._refreshGen = 0, this._popoutWindow = null, this._popoutBtn = null, this._isPopped = !1, this._desktopExpanded = !1, this._desktopExpandRestore = null, this._desktopPopoutUnsupported = !1, this._popoutCloseHandler = null, this._popoutKeydownHandler = null, this._popoutCloseTimer = null, this._popoutRestoreGuard = !1, this._previewBtn = null, this._previewBlobUrl = null, this._previewActive = !1, this._nodeStreamBtn = null, this._nodeStreamActive = !1, this._docAC = new AbortController(), this._popoutAC = null, this._panelAC = new AbortController(), this._resizeState = null, this._titleId = `mjr-mfv-title-${this._instanceId}`, this._genDropdownId = `mjr-mfv-gen-dropdown-${this._instanceId}`, this._docClickHost = null, this._handleDocClick = null;
  }
  _dispatchControllerAction(e, t) {
    var n, o, i;
    try {
      const r = (n = this._controller) == null ? void 0 : n[e];
      if (typeof r == "function")
        return r();
    } catch (r) {
      (o = console.debug) == null || o.call(console, r);
    }
    if (t)
      try {
        window.dispatchEvent(new Event(t));
      } catch (r) {
        (i = console.debug) == null || i.call(console, r);
      }
  }
  _forwardKeydownToController(e) {
    var t, n, o;
    try {
      const i = (t = this._controller) == null ? void 0 : t.handleForwardedKeydown;
      if (typeof i == "function") {
        i(e);
        return;
      }
    } catch (i) {
      (n = console.debug) == null || n.call(console, i);
    }
    try {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: e == null ? void 0 : e.key,
          code: e == null ? void 0 : e.code,
          keyCode: e == null ? void 0 : e.keyCode,
          ctrlKey: e == null ? void 0 : e.ctrlKey,
          shiftKey: e == null ? void 0 : e.shiftKey,
          altKey: e == null ? void 0 : e.altKey,
          metaKey: e == null ? void 0 : e.metaKey
        })
      );
    } catch (i) {
      (o = console.debug) == null || o.call(console, i);
    }
  }
  // ── Build DOM ─────────────────────────────────────────────────────────────
  render() {
    const e = document.createElement("div");
    return e.className = "mjr-mfv", e.setAttribute("role", "dialog"), e.setAttribute("aria-modal", "false"), e.setAttribute("aria-hidden", "true"), this.element = e, e.appendChild(this._buildHeader()), e.setAttribute("aria-labelledby", this._titleId), e.appendChild(this._buildToolbar()), this._contentEl = document.createElement("div"), this._contentEl.className = "mjr-mfv-content", e.appendChild(this._contentEl), this._rebindControlHandlers(), this._bindPanelInteractions(), this._bindDocumentUiHandlers(), this._refresh(), e;
  }
  _buildHeader() {
    const e = document.createElement("div");
    e.className = "mjr-mfv-header";
    const t = document.createElement("span");
    t.className = "mjr-mfv-header-title", t.id = this._titleId, t.textContent = "Majoor Viewer Lite";
    const n = document.createElement("button");
    this._closeBtn = n, n.type = "button", n.className = "mjr-icon-btn", F(n, S("tooltip.closeViewer", "Close viewer"), me);
    const o = document.createElement("i");
    return o.className = "pi pi-times", o.setAttribute("aria-hidden", "true"), n.appendChild(o), e.appendChild(t), e.appendChild(n), e;
  }
  _buildToolbar() {
    var c, s;
    const e = document.createElement("div");
    e.className = "mjr-mfv-toolbar", this._modeBtn = document.createElement("button"), this._modeBtn.type = "button", this._modeBtn.className = "mjr-icon-btn", this._updateModeBtnUI(), e.appendChild(this._modeBtn), this._pinSelect = document.createElement("select"), this._pinSelect.className = "mjr-mfv-pin-select", this._pinSelect.setAttribute("aria-label", "Pin Reference"), this._pinSelect.value = this._pinnedSlot || "";
    for (const { value: a, label: d } of [
      { value: "", label: "No Pin" },
      { value: "A", label: "Pin A" },
      { value: "B", label: "Pin B" },
      { value: "C", label: "Pin C" },
      { value: "D", label: "Pin D" }
    ]) {
      const m = document.createElement("option");
      m.value = a, m.textContent = d, this._pinSelect.appendChild(m);
    }
    this._updatePinSelectUI(), e.appendChild(this._pinSelect);
    const t = document.createElement("div");
    t.className = "mjr-mfv-toolbar-sep", t.setAttribute("aria-hidden", "true"), e.appendChild(t), this._liveBtn = document.createElement("button"), this._liveBtn.type = "button", this._liveBtn.className = "mjr-icon-btn", this._liveBtn.innerHTML = '<i class="pi pi-circle" aria-hidden="true"></i>', this._liveBtn.setAttribute("aria-pressed", "false"), F(
      this._liveBtn,
      S("tooltip.liveStreamOff", "Live Stream: OFF — click to follow"),
      q
    ), e.appendChild(this._liveBtn), this._previewBtn = document.createElement("button"), this._previewBtn.type = "button", this._previewBtn.className = "mjr-icon-btn", this._previewBtn.innerHTML = '<i class="pi pi-eye" aria-hidden="true"></i>', this._previewBtn.setAttribute("aria-pressed", "false"), F(
      this._previewBtn,
      S(
        "tooltip.previewStreamOff",
        "KSampler Preview: OFF — click to stream denoising steps"
      ),
      Z
    ), e.appendChild(this._previewBtn), this._nodeStreamBtn = document.createElement("button"), this._nodeStreamBtn.type = "button", this._nodeStreamBtn.className = "mjr-icon-btn", this._nodeStreamBtn.innerHTML = '<i class="pi pi-sitemap" aria-hidden="true"></i>', this._nodeStreamBtn.setAttribute("aria-pressed", "false"), F(
      this._nodeStreamBtn,
      S("tooltip.nodeStreamOff", "Node Stream: OFF — click to stream selected node output"),
      ue
    ), e.appendChild(this._nodeStreamBtn), (s = (c = this._nodeStreamBtn).remove) == null || s.call(c), this._nodeStreamBtn = null, this._genBtn = document.createElement("button"), this._genBtn.type = "button", this._genBtn.className = "mjr-icon-btn", this._genBtn.setAttribute("aria-haspopup", "dialog"), this._genBtn.setAttribute("aria-expanded", "false");
    const n = document.createElement("i");
    n.className = "pi pi-info-circle", n.setAttribute("aria-hidden", "true"), this._genBtn.appendChild(n), e.appendChild(this._genBtn), this._updateGenBtnUI(), this._popoutBtn = document.createElement("button"), this._popoutBtn.type = "button", this._popoutBtn.className = "mjr-icon-btn";
    const o = S(
      "tooltip.popOutViewer",
      "Pop out viewer to separate window"
    );
    this._popoutBtn.title = o, this._popoutBtn.setAttribute("aria-label", o), this._popoutBtn.setAttribute("aria-pressed", "false");
    const i = document.createElement("i");
    i.className = "pi pi-external-link", i.setAttribute("aria-hidden", "true"), this._popoutBtn.appendChild(i), e.appendChild(this._popoutBtn), this._captureBtn = document.createElement("button"), this._captureBtn.type = "button", this._captureBtn.className = "mjr-icon-btn";
    const r = S("tooltip.captureView", "Save view as image");
    this._captureBtn.title = r, this._captureBtn.setAttribute("aria-label", r);
    const l = document.createElement("i");
    return l.className = "pi pi-download", l.setAttribute("aria-hidden", "true"), this._captureBtn.appendChild(l), e.appendChild(this._captureBtn), this._handleDocClick = (a) => {
      var m, p;
      if (!this._genDropdown) return;
      const d = a == null ? void 0 : a.target;
      (p = (m = this._genBtn) == null ? void 0 : m.contains) != null && p.call(m, d) || this._genDropdown.contains(d) || this._closeGenDropdown();
    }, this._bindDocumentUiHandlers(), e;
  }
  _rebindControlHandlers() {
    var t, n, o, i, r, l, c, s, a, d, m;
    try {
      (t = this._btnAC) == null || t.abort();
    } catch (p) {
      (n = console.debug) == null || n.call(console, p);
    }
    this._btnAC = new AbortController();
    const e = this._btnAC.signal;
    (o = this._closeBtn) == null || o.addEventListener(
      "click",
      () => {
        this._dispatchControllerAction("close", x.MFV_CLOSE);
      },
      { signal: e }
    ), (i = this._modeBtn) == null || i.addEventListener("click", () => this._cycleMode(), { signal: e }), (r = this._pinSelect) == null || r.addEventListener(
      "change",
      (p) => {
        var _;
        this._pinnedSlot = ((_ = p == null ? void 0 : p.target) == null ? void 0 : _.value) || null, this._pinnedSlot === "C" || this._pinnedSlot === "D" ? this._mode !== g.GRID && this.setMode(g.GRID) : this._pinnedSlot && this._mode === g.SIMPLE && this.setMode(g.AB), this._updatePinSelectUI();
      },
      { signal: e }
    ), (l = this._liveBtn) == null || l.addEventListener(
      "click",
      () => {
        this._dispatchControllerAction("toggleLive", x.MFV_LIVE_TOGGLE);
      },
      { signal: e }
    ), (c = this._previewBtn) == null || c.addEventListener(
      "click",
      () => {
        this._dispatchControllerAction("togglePreview", x.MFV_PREVIEW_TOGGLE);
      },
      { signal: e }
    ), (s = this._nodeStreamBtn) == null || s.addEventListener(
      "click",
      () => {
        this._dispatchControllerAction(
          "toggleNodeStream",
          x.MFV_NODESTREAM_TOGGLE
        );
      },
      { signal: e }
    ), (a = this._genBtn) == null || a.addEventListener(
      "click",
      (p) => {
        var _, h;
        p.stopPropagation(), (h = (_ = this._genDropdown) == null ? void 0 : _.classList) != null && h.contains("is-visible") ? this._closeGenDropdown() : this._openGenDropdown();
      },
      { signal: e }
    ), (d = this._popoutBtn) == null || d.addEventListener(
      "click",
      () => {
        this._dispatchControllerAction("popOut", x.MFV_POPOUT);
      },
      { signal: e }
    ), (m = this._captureBtn) == null || m.addEventListener("click", () => this._captureView(), { signal: e });
  }
  _resetGenDropdownForCurrentDocument() {
    var e, t, n;
    this._closeGenDropdown();
    try {
      (t = (e = this._genDropdown) == null ? void 0 : e.remove) == null || t.call(e);
    } catch (o) {
      (n = console.debug) == null || n.call(console, o);
    }
    this._genDropdown = null, this._updateGenBtnUI();
  }
  _bindDocumentUiHandlers() {
    var t, n, o;
    if (!this._handleDocClick) return;
    const e = ((t = this.element) == null ? void 0 : t.ownerDocument) || document;
    if (this._docClickHost !== e) {
      this._unbindDocumentUiHandlers();
      try {
        (n = this._docAC) == null || n.abort();
      } catch (i) {
        (o = console.debug) == null || o.call(console, i);
      }
      this._docAC = new AbortController(), e.addEventListener("click", this._handleDocClick, { signal: this._docAC.signal }), this._docClickHost = e;
    }
  }
  _unbindDocumentUiHandlers() {
    var e, t;
    try {
      (e = this._docAC) == null || e.abort();
    } catch (n) {
      (t = console.debug) == null || t.call(console, n);
    }
    this._docAC = new AbortController(), this._docClickHost = null;
  }
  _isGenDropdownOpen() {
    var e, t;
    return !!((t = (e = this._genDropdown) == null ? void 0 : e.classList) != null && t.contains("is-visible"));
  }
  _openGenDropdown() {
    if (!this.element) return;
    this._genDropdown || (this._genDropdown = this._buildGenDropdown(), this.element.appendChild(this._genDropdown)), this._bindDocumentUiHandlers();
    const e = this._genBtn.getBoundingClientRect(), t = this.element.getBoundingClientRect(), n = e.left - t.left, o = e.bottom - t.top + 6;
    this._genDropdown.style.left = `${n}px`, this._genDropdown.style.top = `${o}px`, this._genDropdown.classList.add("is-visible"), this._updateGenBtnUI();
  }
  _closeGenDropdown() {
    this._genDropdown && (this._genDropdown.classList.remove("is-visible"), this._updateGenBtnUI());
  }
  /** Reflect how many fields are enabled on the gen info button. */
  _updateGenBtnUI() {
    if (!this._genBtn) return;
    const e = this._genInfoSelections.size, t = e > 0, n = this._isGenDropdownOpen();
    this._genBtn.classList.toggle("is-on", t), this._genBtn.classList.toggle("is-open", n);
    const o = t ? `Gen Info (${e} field${e > 1 ? "s" : ""} shown)${n ? " — open" : " — click to configure"}` : `Gen Info${n ? " — open" : " — click to show overlay"}`;
    this._genBtn.title = o, this._genBtn.setAttribute("aria-label", o), this._genBtn.setAttribute("aria-expanded", String(n)), this._genDropdown ? this._genBtn.setAttribute("aria-controls", this._genDropdownId) : this._genBtn.removeAttribute("aria-controls");
  }
  _buildGenDropdown() {
    const e = document.createElement("div");
    e.className = "mjr-mfv-gen-dropdown", e.id = this._genDropdownId, e.setAttribute("role", "group"), e.setAttribute("aria-label", "Generation info fields");
    const t = [
      ["prompt", "Prompt"],
      ["seed", "Seed"],
      ["model", "Model"],
      ["lora", "LoRA"],
      ["sampler", "Sampler"],
      ["scheduler", "Scheduler"],
      ["cfg", "CFG"],
      ["step", "Step"],
      ["genTime", "Gen Time"]
    ];
    for (const [n, o] of t) {
      const i = document.createElement("label");
      i.className = "mjr-mfv-gen-dropdown-row";
      const r = document.createElement("input");
      r.type = "checkbox", r.checked = this._genInfoSelections.has(n), r.addEventListener("change", () => {
        r.checked ? this._genInfoSelections.add(n) : this._genInfoSelections.delete(n), this._updateGenBtnUI(), this._refresh();
      });
      const l = document.createElement("span");
      l.textContent = o, i.appendChild(r), i.appendChild(l), e.appendChild(i);
    }
    return e;
  }
  _getGenFields(e) {
    var i, r, l, c;
    if (!e) return {};
    try {
      const s = e.geninfo ? { geninfo: e.geninfo } : e.metadata || e.metadata_raw || e, a = te(s) || null, d = {
        prompt: "",
        seed: "",
        model: "",
        lora: "",
        sampler: "",
        scheduler: "",
        cfg: "",
        step: "",
        genTime: ""
      };
      if (a && typeof a == "object") {
        a.prompt && (d.prompt = V(String(a.prompt))), a.seed != null && (d.seed = String(a.seed)), a.model && (d.model = Array.isArray(a.model) ? a.model.join(", ") : String(a.model)), Array.isArray(a.loras) && (d.lora = a.loras.map(
          (p) => typeof p == "string" ? p : (p == null ? void 0 : p.name) || (p == null ? void 0 : p.lora_name) || (p == null ? void 0 : p.model_name) || ""
        ).filter(Boolean).join(", ")), a.sampler && (d.sampler = String(a.sampler)), a.scheduler && (d.scheduler = String(a.scheduler)), a.cfg != null && (d.cfg = String(a.cfg)), a.steps != null && (d.step = String(a.steps)), !d.prompt && (s != null && s.prompt) && (d.prompt = V(String(s.prompt || "")));
        const m = e.generation_time_ms ?? ((i = e.metadata_raw) == null ? void 0 : i.generation_time_ms) ?? (s == null ? void 0 : s.generation_time_ms) ?? ((r = s == null ? void 0 : s.geninfo) == null ? void 0 : r.generation_time_ms) ?? 0;
        return m && Number.isFinite(Number(m)) && m > 0 && m < 864e5 && (d.genTime = (Number(m) / 1e3).toFixed(1) + "s"), d;
      }
    } catch (s) {
      (l = console.debug) == null || l.call(console, "[MFV] _getGenFields error:", s);
    }
    const t = e.meta || e.metadata || e.parsed || e.parsed_meta || e, n = {
      prompt: "",
      seed: "",
      model: "",
      lora: "",
      sampler: "",
      scheduler: "",
      cfg: "",
      step: "",
      genTime: ""
    };
    n.prompt = V((t == null ? void 0 : t.prompt) || (t == null ? void 0 : t.text) || ""), n.seed = (t == null ? void 0 : t.seed) != null ? String(t.seed) : (t == null ? void 0 : t.noise_seed) != null ? String(t.noise_seed) : "", t != null && t.model ? n.model = Array.isArray(t.model) ? t.model.join(", ") : String(t.model) : n.model = (t == null ? void 0 : t.model_name) || "", n.lora = (t == null ? void 0 : t.lora) || (t == null ? void 0 : t.loras) || "", Array.isArray(n.lora) && (n.lora = n.lora.join(", ")), n.sampler = (t == null ? void 0 : t.sampler) || (t == null ? void 0 : t.sampler_name) || "", n.scheduler = (t == null ? void 0 : t.scheduler) || "", n.cfg = (t == null ? void 0 : t.cfg) != null ? String(t.cfg) : (t == null ? void 0 : t.cfg_scale) != null ? String(t.cfg_scale) : "", n.step = (t == null ? void 0 : t.steps) != null ? String(t.steps) : "";
    const o = e.generation_time_ms ?? ((c = e.metadata_raw) == null ? void 0 : c.generation_time_ms) ?? (t == null ? void 0 : t.generation_time_ms) ?? 0;
    return o && Number.isFinite(Number(o)) && o > 0 && o < 864e5 && (n.genTime = (Number(o) / 1e3).toFixed(1) + "s"), n;
  }
  /**
   * Build a DocumentFragment of gen-info rows using the DOM API.
   * Returns null when no fields are selected or all are empty.
   * Using the DOM API instead of innerHTML string concatenation eliminates
   * any XSS risk from metadata values and avoids fragile HTML escaping.
   */
  _buildGenInfoDOM(e) {
    const t = this._getGenFields(e);
    if (!t) return null;
    const n = document.createDocumentFragment(), o = [
      "prompt",
      "seed",
      "model",
      "lora",
      "sampler",
      "scheduler",
      "cfg",
      "step",
      "genTime"
    ];
    for (const i of o) {
      if (!this._genInfoSelections.has(i)) continue;
      const r = t[i] != null ? String(t[i]) : "";
      if (!r) continue;
      let l = i.charAt(0).toUpperCase() + i.slice(1);
      i === "lora" ? l = "LoRA" : i === "cfg" ? l = "CFG" : i === "genTime" && (l = "Gen Time");
      const c = document.createElement("div");
      c.dataset.field = i;
      const s = document.createElement("strong");
      if (s.textContent = `${l}: `, c.appendChild(s), i === "prompt")
        c.appendChild(document.createTextNode(r));
      else if (i === "genTime") {
        const a = parseFloat(r);
        let d = "#4CAF50";
        a >= 60 ? d = "#FF9800" : a >= 30 ? d = "#FFC107" : a >= 10 && (d = "#8BC34A");
        const m = document.createElement("span");
        m.style.color = d, m.style.fontWeight = "600", m.textContent = r, c.appendChild(m);
      } else
        c.appendChild(document.createTextNode(r));
      n.appendChild(c);
    }
    return n.childNodes.length > 0 ? n : null;
  }
  // ── Mode ──────────────────────────────────────────────────────────────────
  _notifyModeChanged() {
    var e, t, n;
    try {
      (t = (e = this._controller) == null ? void 0 : e.onModeChanged) == null || t.call(e, this._mode);
    } catch (o) {
      (n = console.debug) == null || n.call(console, o);
    }
  }
  _cycleMode() {
    const e = [g.SIMPLE, g.AB, g.SIDE, g.GRID];
    this._mode = e[(e.indexOf(this._mode) + 1) % e.length], this._updateModeBtnUI(), this._refresh(), this._notifyModeChanged();
  }
  setMode(e) {
    Object.values(g).includes(e) && (this._mode = e, this._updateModeBtnUI(), this._refresh(), this._notifyModeChanged());
  }
  getPinnedSlot() {
    return this._pinnedSlot;
  }
  _updatePinSelectUI() {
    if (!this._pinSelect) return;
    const t = ["A", "B", "C", "D"].includes(this._pinnedSlot);
    this._pinSelect.value = this._pinnedSlot || "", this._pinSelect.classList.toggle("is-pinned", t);
    const n = t ? `Pin Reference: ${this._pinnedSlot}` : "Pin Reference: Off";
    this._pinSelect.title = n, this._pinSelect.setAttribute("aria-label", n);
  }
  _updateModeBtnUI() {
    if (!this._modeBtn) return;
    const e = {
      [g.SIMPLE]: { icon: "pi-image", label: "Mode: Simple - click to switch" },
      [g.AB]: { icon: "pi-clone", label: "Mode: A/B Compare - click to switch" },
      [g.SIDE]: { icon: "pi-table", label: "Mode: Side-by-Side - click to switch" },
      [g.GRID]: {
        icon: "pi-th-large",
        label: "Mode: Grid Compare (up to 4) - click to switch"
      }
    }, { icon: t = "pi-image", label: n = "" } = e[this._mode] || {}, o = z(n, pe), i = document.createElement("i");
    i.className = `pi ${t}`, i.setAttribute("aria-hidden", "true"), this._modeBtn.replaceChildren(i), this._modeBtn.title = o, this._modeBtn.setAttribute("aria-label", o), this._modeBtn.removeAttribute("aria-pressed");
  }
  // ── Live Stream UI ────────────────────────────────────────────────────────
  setLiveActive(e) {
    if (!this._liveBtn) return;
    const t = !!e;
    this._liveBtn.classList.toggle("mjr-live-active", t);
    const n = t ? S("tooltip.liveStreamOn", "Live Stream: ON — click to disable") : S("tooltip.liveStreamOff", "Live Stream: OFF — click to follow"), o = z(n, q);
    if (this._liveBtn.setAttribute("aria-pressed", String(t)), this._liveBtn.setAttribute("aria-label", o), t) {
      const i = document.createElement("i");
      i.className = "pi pi-circle-fill", i.setAttribute("aria-hidden", "true"), this._liveBtn.replaceChildren(i), this._liveBtn.title = o;
    } else {
      const i = document.createElement("i");
      i.className = "pi pi-circle", i.setAttribute("aria-hidden", "true"), this._liveBtn.replaceChildren(i), this._liveBtn.title = o;
    }
  }
  // ── KSampler Preview Stream UI ─────────────────────────────────────────────
  setPreviewActive(e) {
    if (this._previewActive = !!e, !this._previewBtn) return;
    this._previewBtn.classList.toggle("mjr-preview-active", this._previewActive);
    const t = this._previewActive ? S("tooltip.previewStreamOn", "KSampler Preview: ON — streaming denoising steps") : S(
      "tooltip.previewStreamOff",
      "KSampler Preview: OFF — click to stream denoising steps"
    ), n = z(t, Z);
    if (this._previewBtn.setAttribute("aria-pressed", String(this._previewActive)), this._previewBtn.setAttribute("aria-label", n), this._previewActive) {
      const o = document.createElement("i");
      o.className = "pi pi-eye", o.setAttribute("aria-hidden", "true"), this._previewBtn.replaceChildren(o), this._previewBtn.title = n;
    } else {
      const o = document.createElement("i");
      o.className = "pi pi-eye-slash", o.setAttribute("aria-hidden", "true"), this._previewBtn.replaceChildren(o), this._previewBtn.title = n, this._revokePreviewBlob();
    }
  }
  /**
   * Display a preview blob (JPEG/PNG from KSampler denoising steps).
   * Uses a blob: URL and shows it in Simple mode without metadata enrichment.
   * @param {Blob} blob  Image blob received from ComfyUI WebSocket.
   */
  loadPreviewBlob(e) {
    if (!e || !(e instanceof Blob)) return;
    this._revokePreviewBlob();
    const t = URL.createObjectURL(e);
    this._previewBlobUrl = t;
    const n = { url: t, filename: "preview.jpg", kind: "image", _isPreview: !0 };
    if (this._mode === g.AB || this._mode === g.SIDE || this._mode === g.GRID) {
      const i = this.getPinnedSlot();
      if (this._mode === g.GRID) {
        const r = ["A", "B", "C", "D"].find((l) => l !== i) || "A";
        this[`_media${r}`] = n;
      } else i === "B" ? this._mediaA = n : this._mediaB = n;
    } else
      this._mediaA = n, this._resetMfvZoom(), this._mode !== g.SIMPLE && (this._mode = g.SIMPLE, this._updateModeBtnUI());
    ++this._refreshGen, this._refresh();
  }
  _revokePreviewBlob() {
    if (this._previewBlobUrl) {
      try {
        URL.revokeObjectURL(this._previewBlobUrl);
      } catch {
      }
      this._previewBlobUrl = null;
    }
  }
  // ── Node Stream UI ───────────────────────────────────────────────────────
  setNodeStreamActive(e) {
    {
      this._nodeStreamActive = !1;
      return;
    }
  }
  // ── Media loading ─────────────────────────────────────────────────────────
  /**
   * Load one file/asset into slot A.
   * @param {object} fileData
   * @param {{ autoMode?: boolean }} opts  autoMode=true → force SIMPLE mode
   */
  loadMediaA(e, { autoMode: t = !1 } = {}) {
    if (this._mediaA = e || null, this._resetMfvZoom(), t && this._mode !== g.SIMPLE && (this._mode = g.SIMPLE, this._updateModeBtnUI()), this._mediaA && typeof G == "function") {
      const n = ++this._refreshGen;
      (async () => {
        var o;
        try {
          const i = await G(this._mediaA, {
            getAssetMetadata: $,
            getFileMetadataScoped: U
          });
          if (this._refreshGen !== n) return;
          i && typeof i == "object" && (this._mediaA = i, this._refresh());
        } catch (i) {
          (o = console.debug) == null || o.call(console, "[MFV] metadata enrich error", i);
        }
      })();
    } else
      this._refresh();
  }
  /**
   * Load two assets for compare modes.
   * Auto-switches from SIMPLE → AB on first call.
   */
  loadMediaPair(e, t) {
    this._mediaA = e || null, this._mediaB = t || null, this._resetMfvZoom(), this._mode === g.SIMPLE && (this._mode = g.AB, this._updateModeBtnUI());
    const n = ++this._refreshGen, o = async (i) => {
      if (!i) return i;
      try {
        return await G(i, {
          getAssetMetadata: $,
          getFileMetadataScoped: U
        }) || i;
      } catch {
        return i;
      }
    };
    (async () => {
      const [i, r] = await Promise.all([o(this._mediaA), o(this._mediaB)]);
      this._refreshGen === n && (this._mediaA = i || null, this._mediaB = r || null, this._refresh());
    })();
  }
  /**
   * Load up to 4 assets for grid compare mode.
   * Auto-switches to GRID mode if not already.
   */
  loadMediaQuad(e, t, n, o) {
    this._mediaA = e || null, this._mediaB = t || null, this._mediaC = n || null, this._mediaD = o || null, this._resetMfvZoom(), this._mode !== g.GRID && (this._mode = g.GRID, this._updateModeBtnUI());
    const i = ++this._refreshGen, r = async (l) => {
      if (!l) return l;
      try {
        return await G(l, {
          getAssetMetadata: $,
          getFileMetadataScoped: U
        }) || l;
      } catch {
        return l;
      }
    };
    (async () => {
      const [l, c, s, a] = await Promise.all([
        r(this._mediaA),
        r(this._mediaB),
        r(this._mediaC),
        r(this._mediaD)
      ]);
      this._refreshGen === i && (this._mediaA = l || null, this._mediaB = c || null, this._mediaC = s || null, this._mediaD = a || null, this._refresh());
    })();
  }
  // ── Pan/Zoom ──────────────────────────────────────────────────────────────
  _resetMfvZoom() {
    this._zoom = 1, this._panX = 0, this._panY = 0;
  }
  /** Apply current zoom+pan state to all media elements (img/video only — divider/overlays unaffected). */
  _applyTransform() {
    if (!this._contentEl) return;
    const e = Math.max(X, Math.min(K, this._zoom)), t = this._contentEl.clientWidth || 0, n = this._contentEl.clientHeight || 0, o = Math.max(0, (e - 1) * t / 2), i = Math.max(0, (e - 1) * n / 2);
    this._panX = Math.max(-o, Math.min(o, this._panX)), this._panY = Math.max(-i, Math.min(i, this._panY));
    const r = `translate(${this._panX}px,${this._panY}px) scale(${e})`;
    for (const l of this._contentEl.querySelectorAll(".mjr-mfv-media"))
      l != null && l._mjrDisableViewerTransform || (l.style.transform = r, l.style.transformOrigin = "center");
    this._contentEl.classList.remove("mjr-mfv-content--grab", "mjr-mfv-content--grabbing"), e > 1.01 && this._contentEl.classList.add(
      this._dragging ? "mjr-mfv-content--grabbing" : "mjr-mfv-content--grab"
    );
  }
  /**
   * Set zoom, optionally centered at (clientX, clientY).
   * Keeps the image point under the cursor stationary.
   */
  _setMfvZoom(e, t, n) {
    const o = Math.max(X, Math.min(K, this._zoom)), i = Math.max(X, Math.min(K, Number(e) || 1));
    if (t != null && n != null && this._contentEl) {
      const r = i / o, l = this._contentEl.getBoundingClientRect(), c = t - (l.left + l.width / 2), s = n - (l.top + l.height / 2);
      this._panX = this._panX * r + (1 - r) * c, this._panY = this._panY * r + (1 - r) * s;
    }
    this._zoom = i, Math.abs(i - 1) < 1e-3 && (this._zoom = 1, this._panX = 0, this._panY = 0), this._applyTransform();
  }
  /** Bind wheel + pointer events to the clip viewport element. */
  _initPanZoom(e) {
    if (this._destroyPanZoom(), !e) return;
    this._panzoomAC = new AbortController();
    const t = { signal: this._panzoomAC.signal };
    e.addEventListener(
      "wheel",
      (s) => {
        var p, _;
        if ((_ = (p = s.target) == null ? void 0 : p.closest) != null && _.call(p, "audio") || W(s.target)) return;
        const a = ge(s.target, e);
        if (a && be(
          a,
          Number(s.deltaX || 0),
          Number(s.deltaY || 0)
        ))
          return;
        s.preventDefault();
        const m = 1 - (s.deltaY || s.deltaX || 0) * ae;
        this._setMfvZoom(this._zoom * m, s.clientX, s.clientY);
      },
      { ...t, passive: !1 }
    );
    let n = !1, o = 0, i = 0, r = 0, l = 0;
    e.addEventListener(
      "pointerdown",
      (s) => {
        var a, d, m, p, _, h, f;
        if (!(s.button !== 0 && s.button !== 1) && !(this._zoom <= 1.01) && !((d = (a = s.target) == null ? void 0 : a.closest) != null && d.call(a, "video")) && !((p = (m = s.target) == null ? void 0 : m.closest) != null && p.call(m, "audio")) && !((h = (_ = s.target) == null ? void 0 : _.closest) != null && h.call(_, ".mjr-mfv-ab-divider")) && !W(s.target)) {
          s.preventDefault(), n = !0, this._dragging = !0, o = s.clientX, i = s.clientY, r = this._panX, l = this._panY;
          try {
            e.setPointerCapture(s.pointerId);
          } catch (w) {
            (f = console.debug) == null || f.call(console, w);
          }
          this._applyTransform();
        }
      },
      t
    ), e.addEventListener(
      "pointermove",
      (s) => {
        n && (this._panX = r + (s.clientX - o), this._panY = l + (s.clientY - i), this._applyTransform());
      },
      t
    );
    const c = (s) => {
      var a;
      if (n) {
        n = !1, this._dragging = !1;
        try {
          e.releasePointerCapture(s.pointerId);
        } catch (d) {
          (a = console.debug) == null || a.call(console, d);
        }
        this._applyTransform();
      }
    };
    e.addEventListener("pointerup", c, t), e.addEventListener("pointercancel", c, t), e.addEventListener(
      "dblclick",
      (s) => {
        var d, m, p, _;
        if ((m = (d = s.target) == null ? void 0 : d.closest) != null && m.call(d, "video") || (_ = (p = s.target) == null ? void 0 : p.closest) != null && _.call(p, "audio") || W(s.target)) return;
        const a = Math.abs(this._zoom - 1) < 0.05;
        this._setMfvZoom(a ? Math.min(4, this._zoom * 4) : 1, s.clientX, s.clientY);
      },
      t
    );
  }
  /** Remove all pan/zoom event listeners. */
  _destroyPanZoom() {
    var e, t;
    try {
      (e = this._panzoomAC) == null || e.abort();
    } catch (n) {
      (t = console.debug) == null || t.call(console, n);
    }
    this._panzoomAC = null, this._dragging = !1;
  }
  _destroyCompareSync() {
    var e, t, n;
    try {
      (t = (e = this._compareSyncAC) == null ? void 0 : e.abort) == null || t.call(e);
    } catch (o) {
      (n = console.debug) == null || n.call(console, o);
    }
    this._compareSyncAC = null;
  }
  _initCompareSync() {
    var e;
    if (this._destroyCompareSync(), !!this._contentEl && this._mode !== g.SIMPLE)
      try {
        const t = Array.from(this._contentEl.querySelectorAll("video, audio"));
        if (t.length < 2) return;
        const n = t[0] || null, o = t.slice(1);
        if (!n || !o.length) return;
        this._compareSyncAC = ie(n, o, { threshold: 0.08 });
      } catch (t) {
        (e = console.debug) == null || e.call(console, t);
      }
  }
  // ── Render ────────────────────────────────────────────────────────────────
  _refresh() {
    if (this._contentEl) {
      switch (this._destroyPanZoom(), this._destroyCompareSync(), this._contentEl.replaceChildren(), this._contentEl.style.overflow = "hidden", this._mode) {
        case g.SIMPLE:
          this._renderSimple();
          break;
        case g.AB:
          this._renderAB();
          break;
        case g.SIDE:
          this._renderSide();
          break;
        case g.GRID:
          this._renderGrid();
          break;
      }
      this._applyTransform(), this._initPanZoom(this._contentEl), this._initCompareSync();
    }
  }
  _renderSimple() {
    if (!this._mediaA) {
      this._contentEl.appendChild(P());
      return;
    }
    const e = k(this._mediaA), t = j(this._mediaA);
    if (!t) {
      this._contentEl.appendChild(P("Could not load media"));
      return;
    }
    const n = document.createElement("div");
    if (n.className = "mjr-mfv-simple-container", n.appendChild(t), e !== "audio") {
      const o = this._buildGenInfoDOM(this._mediaA);
      if (o) {
        const i = document.createElement("div");
        i.className = "mjr-mfv-geninfo", i.appendChild(o), n.appendChild(i);
      }
    }
    this._contentEl.appendChild(n);
  }
  _renderAB() {
    var h;
    const e = this._mediaA ? j(this._mediaA, { fill: !0 }) : null, t = this._mediaB ? j(this._mediaB, { fill: !0 }) : null, n = this._mediaA ? k(this._mediaA) : "", o = this._mediaB ? k(this._mediaB) : "";
    if (!e && !t) {
      this._contentEl.appendChild(P("Select 2 assets for A/B compare"));
      return;
    }
    if (!t) {
      this._renderSimple();
      return;
    }
    if (n === "audio" || o === "audio" || n === "model3d" || o === "model3d") {
      this._renderSide();
      return;
    }
    const i = document.createElement("div");
    i.className = "mjr-mfv-ab-container";
    const r = document.createElement("div");
    r.className = "mjr-mfv-ab-layer", e && r.appendChild(e);
    const l = document.createElement("div");
    l.className = "mjr-mfv-ab-layer mjr-mfv-ab-layer--b";
    const c = Math.round(this._abDividerX * 100);
    l.style.clipPath = `inset(0 0 0 ${c}%)`, l.appendChild(t);
    const s = document.createElement("div");
    s.className = "mjr-mfv-ab-divider", s.style.left = `${c}%`;
    const a = this._buildGenInfoDOM(this._mediaA);
    let d = null;
    a && (d = document.createElement("div"), d.className = "mjr-mfv-geninfo-a", d.appendChild(a), d.style.right = `calc(${100 - c}% + 8px)`);
    const m = this._buildGenInfoDOM(this._mediaB);
    let p = null;
    m && (p = document.createElement("div"), p.className = "mjr-mfv-geninfo-b", p.appendChild(m), p.style.left = `calc(${c}% + 8px)`);
    let _ = null;
    s.addEventListener(
      "pointerdown",
      (f) => {
        f.preventDefault(), s.setPointerCapture(f.pointerId);
        try {
          _ == null || _.abort();
        } catch {
        }
        _ = new AbortController();
        const w = _.signal, v = i.getBoundingClientRect(), b = (M) => {
          const y = Math.max(0.02, Math.min(0.98, (M.clientX - v.left) / v.width));
          this._abDividerX = y;
          const B = Math.round(y * 100);
          l.style.clipPath = `inset(0 0 0 ${B}%)`, s.style.left = `${B}%`, d && (d.style.right = `calc(${100 - B}% + 8px)`), p && (p.style.left = `calc(${B}% + 8px)`);
        }, A = () => {
          try {
            _ == null || _.abort();
          } catch {
          }
        };
        s.addEventListener("pointermove", b, { signal: w }), s.addEventListener("pointerup", A, { signal: w });
      },
      (h = this._panelAC) != null && h.signal ? { signal: this._panelAC.signal } : void 0
    ), i.appendChild(r), i.appendChild(l), i.appendChild(s), d && i.appendChild(d), p && i.appendChild(p), i.appendChild(T("A", "left")), i.appendChild(T("B", "right")), this._contentEl.appendChild(i);
  }
  _renderSide() {
    const e = this._mediaA ? j(this._mediaA) : null, t = this._mediaB ? j(this._mediaB) : null, n = this._mediaA ? k(this._mediaA) : "", o = this._mediaB ? k(this._mediaB) : "";
    if (!e && !t) {
      this._contentEl.appendChild(P("Select 2 assets for Side-by-Side"));
      return;
    }
    const i = document.createElement("div");
    i.className = "mjr-mfv-side-container";
    const r = document.createElement("div");
    r.className = "mjr-mfv-side-panel", e ? r.appendChild(e) : r.appendChild(P("—")), r.appendChild(T("A", "left"));
    const l = n === "audio" ? null : this._buildGenInfoDOM(this._mediaA);
    if (l) {
      const a = document.createElement("div");
      a.className = "mjr-mfv-geninfo-a", a.appendChild(l), r.appendChild(a);
    }
    const c = document.createElement("div");
    c.className = "mjr-mfv-side-panel", t ? c.appendChild(t) : c.appendChild(P("—")), c.appendChild(T("B", "right"));
    const s = o === "audio" ? null : this._buildGenInfoDOM(this._mediaB);
    if (s) {
      const a = document.createElement("div");
      a.className = "mjr-mfv-geninfo-b", a.appendChild(s), c.appendChild(a);
    }
    i.appendChild(r), i.appendChild(c), this._contentEl.appendChild(i);
  }
  _renderGrid() {
    const e = [
      { media: this._mediaA, label: "A" },
      { media: this._mediaB, label: "B" },
      { media: this._mediaC, label: "C" },
      { media: this._mediaD, label: "D" }
    ];
    if (!e.filter((o) => o.media).length) {
      this._contentEl.appendChild(P("Select up to 4 assets for Grid Compare"));
      return;
    }
    const n = document.createElement("div");
    n.className = "mjr-mfv-grid-container";
    for (const { media: o, label: i } of e) {
      const r = document.createElement("div");
      if (r.className = "mjr-mfv-grid-cell", o) {
        const l = k(o), c = j(o);
        if (c ? r.appendChild(c) : r.appendChild(P("—")), r.appendChild(
          T(i, i === "A" || i === "C" ? "left" : "right")
        ), l !== "audio") {
          const s = this._buildGenInfoDOM(o);
          if (s) {
            const a = document.createElement("div");
            a.className = `mjr-mfv-geninfo-${i.toLowerCase()}`, a.appendChild(s), r.appendChild(a);
          }
        }
      } else
        r.appendChild(P("—")), r.appendChild(
          T(i, i === "A" || i === "C" ? "left" : "right")
        );
      n.appendChild(r);
    }
    this._contentEl.appendChild(n);
  }
  // ── Visibility ────────────────────────────────────────────────────────────
  show() {
    this.element && (this._bindDocumentUiHandlers(), this.element.classList.add("is-visible"), this.element.setAttribute("aria-hidden", "false"), this.isVisible = !0);
  }
  hide() {
    this.element && (this._destroyPanZoom(), this._destroyCompareSync(), this._stopEdgeResize(), this._closeGenDropdown(), ve(this.element), this.element.classList.remove("is-visible"), this.element.setAttribute("aria-hidden", "true"), this.isVisible = !1);
  }
  // ── Pop-out / Pop-in (separate OS window for second monitor) ────────────
  _setDesktopExpanded(e) {
    if (!this.element) return;
    const t = !!e;
    if (this._desktopExpanded === t) return;
    const n = this.element;
    if (t) {
      this._desktopExpandRestore = {
        parent: n.parentNode || null,
        nextSibling: n.nextSibling || null,
        styleAttr: n.getAttribute("style")
      }, n.parentNode !== document.body && document.body.appendChild(n), n.classList.add("mjr-mfv--desktop-expanded", "is-visible"), n.setAttribute("aria-hidden", "false"), n.style.position = "fixed", n.style.top = "12px", n.style.left = "12px", n.style.right = "12px", n.style.bottom = "12px", n.style.width = "auto", n.style.height = "auto", n.style.maxWidth = "none", n.style.maxHeight = "none", n.style.minWidth = "320px", n.style.minHeight = "240px", n.style.resize = "none", n.style.margin = "0", n.style.zIndex = "2147483000", this._desktopExpanded = !0, this.isVisible = !0, this._resetGenDropdownForCurrentDocument(), this._rebindControlHandlers(), this._bindPanelInteractions(), this._bindDocumentUiHandlers(), this._updatePopoutBtnUI(), C("electron-in-app-expanded", { isVisible: this.isVisible });
      return;
    }
    const o = this._desktopExpandRestore;
    this._desktopExpanded = !1, n.classList.remove("mjr-mfv--desktop-expanded"), (o == null ? void 0 : o.styleAttr) == null || o.styleAttr === "" ? n.removeAttribute("style") : n.setAttribute("style", o.styleAttr), o != null && o.parent && o.parent.isConnected && (o.nextSibling && o.nextSibling.parentNode === o.parent ? o.parent.insertBefore(n, o.nextSibling) : o.parent.appendChild(n)), this._desktopExpandRestore = null, this._resetGenDropdownForCurrentDocument(), this._rebindControlHandlers(), this._bindPanelInteractions(), this._bindDocumentUiHandlers(), this._updatePopoutBtnUI(), C("electron-in-app-restored", null);
  }
  _activateDesktopExpandedFallback(e) {
    var t;
    this._desktopPopoutUnsupported = !0, C(
      "electron-in-app-fallback",
      { message: (e == null ? void 0 : e.message) || String(e || "unknown error") },
      "warn"
    ), this._setDesktopExpanded(!0);
    try {
      ne(
        S(
          "toast.popoutElectronInAppFallback",
          "Desktop PiP is unavailable here. Viewer expanded inside the app instead."
        ),
        "warning",
        4500
      );
    } catch (n) {
      (t = console.debug) == null || t.call(console, n);
    }
  }
  _tryElectronPopupFallback(e, t, n, o) {
    return C(
      "electron-popup-fallback-attempt",
      { reason: (o == null ? void 0 : o.message) || String(o || "unknown") },
      "warn"
    ), this._fallbackPopout(e, t, n), this._popoutWindow ? (this._desktopPopoutUnsupported = !1, C("electron-popup-fallback-opened", null), !0) : !1;
  }
  /**
   * Move the viewer into a separate browser window so it can be
   * dragged onto a second monitor. Opens a dedicated same-origin page,
   * then adopts the live DOM tree into that page so state/listeners persist.
   */
  popOut() {
    var l, c;
    if (this._isPopped || !this.element) return;
    const e = this.element;
    this._stopEdgeResize();
    const t = _e(), n = typeof window < "u" && "documentPictureInPicture" in window, o = String(((l = window == null ? void 0 : window.navigator) == null ? void 0 : l.userAgent) || ((c = globalThis == null ? void 0 : globalThis.navigator) == null ? void 0 : c.userAgent) || ""), i = Math.max(e.offsetWidth || 520, 400), r = Math.max(e.offsetHeight || 420, 300);
    if (C("start", {
      isElectronHost: t,
      hasDocumentPiP: n,
      userAgent: o,
      width: i,
      height: r,
      desktopPopoutUnsupported: this._desktopPopoutUnsupported
    }), t && this._desktopPopoutUnsupported) {
      C("electron-in-app-fallback-reuse", null), this._setDesktopExpanded(!0);
      return;
    }
    if (!(t && (C("electron-popup-request", { width: i, height: r }), this._tryElectronPopupFallback(e, i, r, new Error("Desktop popup requested"))))) {
      if (t && "documentPictureInPicture" in window) {
        C("electron-pip-request", { width: i, height: r }), window.documentPictureInPicture.requestWindow({ width: i, height: r }).then((s) => {
          var _, h;
          C("electron-pip-opened", {
            hasDocument: !!(s != null && s.document)
          }), this._popoutWindow = s, this._isPopped = !0, this._popoutRestoreGuard = !1;
          try {
            (_ = this._popoutAC) == null || _.abort();
          } catch (f) {
            (h = console.debug) == null || h.call(console, f);
          }
          this._popoutAC = new AbortController();
          const a = this._popoutAC.signal, d = () => this._schedulePopInFromPopupClose();
          this._popoutCloseHandler = d;
          const m = s.document;
          m.title = "Majoor Viewer", this._installPopoutStyles(m), m.body.style.cssText = "margin:0;display:flex;min-height:100vh;background:#111;overflow:hidden;";
          const p = m.createElement("div");
          p.id = "mjr-mfv-popout-root", p.style.cssText = "flex:1;min-width:0;min-height:0;display:flex;", m.body.appendChild(p);
          try {
            const f = typeof m.adoptNode == "function" ? m.adoptNode(e) : e;
            p.appendChild(f), C("electron-pip-adopted", {
              usedAdoptNode: typeof m.adoptNode == "function"
            });
          } catch (f) {
            C(
              "electron-pip-adopt-failed",
              { message: (f == null ? void 0 : f.message) || String(f) },
              "warn"
            ), console.warn("[MFV] PiP adoptNode failed", f), this._isPopped = !1, this._popoutWindow = null;
            try {
              s.close();
            } catch {
            }
            this._activateDesktopExpandedFallback(f);
            return;
          }
          e.classList.add("is-visible"), this.isVisible = !0, this._resetGenDropdownForCurrentDocument(), this._rebindControlHandlers(), this._bindDocumentUiHandlers(), this._updatePopoutBtnUI(), C("electron-pip-ready", { isPopped: this._isPopped }), s.addEventListener("pagehide", d, {
            signal: a
          }), this._startPopoutCloseWatch(), this._popoutKeydownHandler = (f) => {
            var v, b;
            const w = String(((v = f == null ? void 0 : f.target) == null ? void 0 : v.tagName) || "").toLowerCase();
            f != null && f.defaultPrevented || (b = f == null ? void 0 : f.target) != null && b.isContentEditable || w === "input" || w === "textarea" || w === "select" || this._forwardKeydownToController(f);
          }, s.addEventListener("keydown", this._popoutKeydownHandler, {
            signal: a
          });
        }).catch((s) => {
          C(
            "electron-pip-request-failed",
            { message: (s == null ? void 0 : s.message) || String(s) },
            "warn"
          ), this._activateDesktopExpandedFallback(s);
        });
        return;
      }
      if (t) {
        C("electron-no-pip-api", { hasDocumentPiP: n }), this._activateDesktopExpandedFallback(
          new Error("Document Picture-in-Picture unavailable after popup failure")
        );
        return;
      }
      C("browser-fallback-popup", { width: i, height: r }), this._fallbackPopout(e, i, r);
    }
  }
  /**
   * Classic popup fallback used when Document PiP is unavailable.
   * Opens about:blank and builds the shell directly in the popup document
   * to avoid Electron / Chrome App mode issues where navigating to a
   * backend URL results in a blank page.
   */
  _fallbackPopout(e, t, n) {
    var d, m, p, _;
    C("browser-popup-open", { width: t, height: n });
    const o = (window.screenX || window.screenLeft) + Math.round((window.outerWidth - t) / 2), i = (window.screenY || window.screenTop) + Math.round((window.outerHeight - n) / 2), r = `width=${t},height=${n},left=${o},top=${i},resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,status=no`, l = window.open("about:blank", "_mjr_viewer", r);
    if (!l) {
      C("browser-popup-blocked", null, "warn"), console.warn("[MFV] Pop-out blocked — allow popups for this site.");
      return;
    }
    C("browser-popup-opened", { hasDocument: !!(l != null && l.document) }), this._popoutWindow = l, this._isPopped = !0, this._popoutRestoreGuard = !1;
    try {
      (d = this._popoutAC) == null || d.abort();
    } catch (h) {
      (m = console.debug) == null || m.call(console, h);
    }
    this._popoutAC = new AbortController();
    const c = this._popoutAC.signal, s = () => this._schedulePopInFromPopupClose();
    this._popoutCloseHandler = s;
    const a = () => {
      let h;
      try {
        h = l.document;
      } catch {
        return;
      }
      if (!h) return;
      h.title = "Majoor Viewer", this._installPopoutStyles(h), h.body.style.cssText = "margin:0;display:flex;min-height:100vh;background:#111;overflow:hidden;";
      const f = h.createElement("div");
      f.id = "mjr-mfv-popout-root", f.style.cssText = "flex:1;min-width:0;min-height:0;display:flex;", h.body.appendChild(f);
      try {
        f.appendChild(h.adoptNode(e));
      } catch (w) {
        console.warn("[MFV] adoptNode failed", w);
        return;
      }
      e.classList.add("is-visible"), this.isVisible = !0, this._resetGenDropdownForCurrentDocument(), this._rebindControlHandlers(), this._bindDocumentUiHandlers(), this._updatePopoutBtnUI();
    };
    try {
      a();
    } catch (h) {
      (p = console.debug) == null || p.call(console, "[MFV] immediate mount failed, retrying on load", h);
      try {
        l.addEventListener("load", a, { signal: c });
      } catch (f) {
        (_ = console.debug) == null || _.call(console, "[MFV] pop-out page load listener failed", f);
      }
    }
    l.addEventListener("beforeunload", s, { signal: c }), l.addEventListener("pagehide", s, { signal: c }), l.addEventListener("unload", s, { signal: c }), this._startPopoutCloseWatch(), this._popoutKeydownHandler = (h) => {
      var v, b, A, M;
      const f = String(((v = h == null ? void 0 : h.target) == null ? void 0 : v.tagName) || "").toLowerCase();
      if (h != null && h.defaultPrevented || (b = h == null ? void 0 : h.target) != null && b.isContentEditable || f === "input" || f === "textarea" || f === "select")
        return;
      if (String((h == null ? void 0 : h.key) || "").toLowerCase() === "v" && (h != null && h.ctrlKey || h != null && h.metaKey) && !(h != null && h.altKey) && !(h != null && h.shiftKey)) {
        h.preventDefault(), (A = h.stopPropagation) == null || A.call(h), (M = h.stopImmediatePropagation) == null || M.call(h), this._dispatchControllerAction("toggle", x.MFV_TOGGLE);
        return;
      }
      this._forwardKeydownToController(h);
    }, l.addEventListener("keydown", this._popoutKeydownHandler, { signal: c });
  }
  _clearPopoutCloseWatch() {
    var e;
    if (this._popoutCloseTimer != null) {
      try {
        window.clearInterval(this._popoutCloseTimer);
      } catch (t) {
        (e = console.debug) == null || e.call(console, t);
      }
      this._popoutCloseTimer = null;
    }
  }
  _startPopoutCloseWatch() {
    this._clearPopoutCloseWatch(), this._popoutCloseTimer = window.setInterval(() => {
      if (!this._isPopped) {
        this._clearPopoutCloseWatch();
        return;
      }
      const e = this._popoutWindow;
      (!e || e.closed) && (this._clearPopoutCloseWatch(), this._schedulePopInFromPopupClose());
    }, 250);
  }
  _schedulePopInFromPopupClose() {
    !this._isPopped || this._popoutRestoreGuard || (this._popoutRestoreGuard = !0, window.setTimeout(() => {
      try {
        this.popIn({ closePopupWindow: !1 });
      } finally {
        this._popoutRestoreGuard = !1;
      }
    }, 0));
  }
  _installPopoutStyles(e) {
    var n, o;
    if (!(e != null && e.head)) return;
    try {
      for (const i of e.head.querySelectorAll(
        "[data-mjr-popout-cloned-style='1']"
      ))
        i.remove();
    } catch (i) {
      (n = console.debug) == null || n.call(console, i);
    }
    for (const i of document.querySelectorAll('link[rel="stylesheet"], style'))
      try {
        let r = null;
        if (i.tagName === "LINK") {
          r = e.createElement("link");
          for (const l of Array.from(i.attributes || []))
            (l == null ? void 0 : l.name) !== "href" && r.setAttribute(l.name, l.value);
          r.setAttribute("href", i.href || i.getAttribute("href") || "");
        } else
          r = e.importNode(i, !0);
        r.setAttribute("data-mjr-popout-cloned-style", "1"), e.head.appendChild(r);
      } catch (r) {
        (o = console.debug) == null || o.call(console, r);
      }
    const t = e.createElement("style");
    t.setAttribute("data-mjr-popout-cloned-style", "1"), t.textContent = `
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
        `, e.head.appendChild(t);
  }
  /**
   * Move the viewer back from the popup window into the main ComfyUI page.
   */
  popIn({ closePopupWindow: e = !0 } = {}) {
    var o, i, r, l;
    if (this._desktopExpanded) {
      this._setDesktopExpanded(!1);
      return;
    }
    if (!this._isPopped || !this.element) return;
    const t = this._popoutWindow;
    this._clearPopoutCloseWatch();
    try {
      (o = this._popoutAC) == null || o.abort();
    } catch (c) {
      (i = console.debug) == null || i.call(console, c);
    }
    this._popoutAC = null, this._popoutCloseHandler = null, this._popoutKeydownHandler = null, this._isPopped = !1;
    let n = this.element;
    try {
      n = (n == null ? void 0 : n.ownerDocument) === document ? n : document.adoptNode(n);
    } catch (c) {
      (r = console.debug) == null || r.call(console, "[MFV] pop-in adopt failed", c);
    }
    if (document.body.appendChild(n), this._resetGenDropdownForCurrentDocument(), this._rebindControlHandlers(), this._bindPanelInteractions(), this._bindDocumentUiHandlers(), n.classList.add("is-visible"), n.setAttribute("aria-hidden", "false"), this.isVisible = !0, this._updatePopoutBtnUI(), e)
      try {
        t == null || t.close();
      } catch (c) {
        (l = console.debug) == null || l.call(console, c);
      }
    this._popoutWindow = null;
  }
  /** Toggle pop-out button icon between external-link (pop out) and sign-in (pop in). */
  _updatePopoutBtnUI() {
    if (!this._popoutBtn) return;
    const e = this._isPopped || this._desktopExpanded;
    this.element && this.element.classList.toggle("mjr-mfv--popped", e), this._popoutBtn.classList.toggle("mjr-popin-active", e);
    const t = this._popoutBtn.querySelector("i") || document.createElement("i"), n = e ? S("tooltip.popInViewer", "Return to floating panel") : S("tooltip.popOutViewer", "Pop out viewer to separate window");
    e ? t.className = "pi pi-sign-in" : t.className = "pi pi-external-link", this._popoutBtn.title = n, this._popoutBtn.setAttribute("aria-label", n), this._popoutBtn.setAttribute("aria-pressed", String(e)), this._popoutBtn.contains(t) || this._popoutBtn.replaceChildren(t);
  }
  /** Whether the viewer is currently in a pop-out window. */
  get isPopped() {
    return this._isPopped || this._desktopExpanded;
  }
  _resizeCursorForDirection(e) {
    return {
      n: "ns-resize",
      s: "ns-resize",
      e: "ew-resize",
      w: "ew-resize",
      ne: "nesw-resize",
      nw: "nwse-resize",
      se: "nwse-resize",
      sw: "nesw-resize"
    }[e] || "";
  }
  _getResizeDirectionFromPoint(e, t, n) {
    if (!n) return "";
    const o = e <= n.left + H, i = e >= n.right - H, r = t <= n.top + H, l = t >= n.bottom - H;
    return r && o ? "nw" : r && i ? "ne" : l && o ? "sw" : l && i ? "se" : r ? "n" : l ? "s" : o ? "w" : i ? "e" : "";
  }
  _stopEdgeResize() {
    var e, t;
    if (this.element) {
      if (((e = this._resizeState) == null ? void 0 : e.pointerId) != null)
        try {
          this.element.releasePointerCapture(this._resizeState.pointerId);
        } catch (n) {
          (t = console.debug) == null || t.call(console, n);
        }
      this._resizeState = null, this.element.classList.remove("mjr-mfv--resizing"), this.element.style.cursor = "";
    }
  }
  _bindPanelInteractions() {
    var e, t;
    if (this.element) {
      this._stopEdgeResize();
      try {
        (e = this._panelAC) == null || e.abort();
      } catch (n) {
        (t = console.debug) == null || t.call(console, n);
      }
      this._panelAC = new AbortController(), this._initEdgeResize(this.element), this._initDrag(this.element.querySelector(".mjr-mfv-header"));
    }
  }
  _initEdgeResize(e) {
    var l;
    if (!e) return;
    const t = (c) => {
      if (!this.element || this._isPopped) return "";
      const s = this.element.getBoundingClientRect();
      return this._getResizeDirectionFromPoint(c.clientX, c.clientY, s);
    }, n = (l = this._panelAC) == null ? void 0 : l.signal, o = (c) => {
      var _;
      if (c.button !== 0 || !this.element || this._isPopped) return;
      const s = t(c);
      if (!s) return;
      c.preventDefault(), c.stopPropagation();
      const a = this.element.getBoundingClientRect(), d = window.getComputedStyle(this.element), m = Math.max(120, Number.parseFloat(d.minWidth) || 0), p = Math.max(100, Number.parseFloat(d.minHeight) || 0);
      this._resizeState = {
        pointerId: c.pointerId,
        dir: s,
        startX: c.clientX,
        startY: c.clientY,
        startLeft: a.left,
        startTop: a.top,
        startWidth: a.width,
        startHeight: a.height,
        minWidth: m,
        minHeight: p
      }, this.element.style.left = `${Math.round(a.left)}px`, this.element.style.top = `${Math.round(a.top)}px`, this.element.style.right = "auto", this.element.style.bottom = "auto", this.element.classList.add("mjr-mfv--resizing"), this.element.style.cursor = this._resizeCursorForDirection(s);
      try {
        this.element.setPointerCapture(c.pointerId);
      } catch (h) {
        (_ = console.debug) == null || _.call(console, h);
      }
    }, i = (c) => {
      if (!this.element || this._isPopped) return;
      const s = this._resizeState;
      if (!s) {
        const f = t(c);
        this.element.style.cursor = f ? this._resizeCursorForDirection(f) : "";
        return;
      }
      if (s.pointerId !== c.pointerId) return;
      const a = c.clientX - s.startX, d = c.clientY - s.startY;
      let m = s.startWidth, p = s.startHeight, _ = s.startLeft, h = s.startTop;
      s.dir.includes("e") && (m = s.startWidth + a), s.dir.includes("s") && (p = s.startHeight + d), s.dir.includes("w") && (m = s.startWidth - a, _ = s.startLeft + a), s.dir.includes("n") && (p = s.startHeight - d, h = s.startTop + d), m < s.minWidth && (s.dir.includes("w") && (_ -= s.minWidth - m), m = s.minWidth), p < s.minHeight && (s.dir.includes("n") && (h -= s.minHeight - p), p = s.minHeight), m = Math.min(m, Math.max(s.minWidth, window.innerWidth)), p = Math.min(p, Math.max(s.minHeight, window.innerHeight)), _ = Math.min(Math.max(0, _), Math.max(0, window.innerWidth - m)), h = Math.min(Math.max(0, h), Math.max(0, window.innerHeight - p)), this.element.style.width = `${Math.round(m)}px`, this.element.style.height = `${Math.round(p)}px`, this.element.style.left = `${Math.round(_)}px`, this.element.style.top = `${Math.round(h)}px`, this.element.style.right = "auto", this.element.style.bottom = "auto";
    }, r = (c) => {
      if (!this.element || !this._resizeState || this._resizeState.pointerId !== c.pointerId) return;
      const s = t(c);
      this._stopEdgeResize(), s && (this.element.style.cursor = this._resizeCursorForDirection(s));
    };
    e.addEventListener("pointerdown", o, { capture: !0, signal: n }), e.addEventListener("pointermove", i, { signal: n }), e.addEventListener("pointerup", r, { signal: n }), e.addEventListener("pointercancel", r, { signal: n }), e.addEventListener(
      "pointerleave",
      () => {
        !this._resizeState && this.element && (this.element.style.cursor = "");
      },
      { signal: n }
    );
  }
  // ── Drag ──────────────────────────────────────────────────────────────────
  _initDrag(e) {
    var o;
    if (!e) return;
    const t = (o = this._panelAC) == null ? void 0 : o.signal;
    let n = null;
    e.addEventListener(
      "pointerdown",
      (i) => {
        if (i.button !== 0 || i.target.closest("button") || i.target.closest("select") || this._isPopped || !this.element || this._getResizeDirectionFromPoint(
          i.clientX,
          i.clientY,
          this.element.getBoundingClientRect()
        )) return;
        i.preventDefault(), e.setPointerCapture(i.pointerId);
        try {
          n == null || n.abort();
        } catch {
        }
        n = new AbortController();
        const l = n.signal, c = this.element, s = c.getBoundingClientRect(), a = i.clientX - s.left, d = i.clientY - s.top, m = (_) => {
          const h = Math.min(
            window.innerWidth - c.offsetWidth,
            Math.max(0, _.clientX - a)
          ), f = Math.min(
            window.innerHeight - c.offsetHeight,
            Math.max(0, _.clientY - d)
          );
          c.style.left = `${h}px`, c.style.top = `${f}px`, c.style.right = "auto", c.style.bottom = "auto";
        }, p = () => {
          try {
            n == null || n.abort();
          } catch {
          }
        };
        e.addEventListener("pointermove", m, { signal: l }), e.addEventListener("pointerup", p, { signal: l });
      },
      t ? { signal: t } : void 0
    );
  }
  // ── Canvas capture ────────────────────────────────────────────────────────
  /**
   * Draw a media asset (image or current video frame) letterboxed into
   * the canvas region (ox, oy, w, h).  preferredVideo is used for multi-
   * video modes so we grab the right element.
   */
  async _drawMediaFit(e, t, n, o, i, r, l) {
    var p, _, h, f, w;
    if (!t) return;
    const c = k(t);
    let s = null;
    if (c === "video" && (s = l instanceof HTMLVideoElement ? l : ((p = this._contentEl) == null ? void 0 : p.querySelector("video")) || null), !s && c === "model3d") {
      const v = (t == null ? void 0 : t.id) != null ? String(t.id) : "";
      v && (s = ((h = (_ = this._contentEl) == null ? void 0 : _.querySelector) == null ? void 0 : h.call(
        _,
        `.mjr-model3d-render-canvas[data-mjr-asset-id="${v}"]`
      )) || null), s || (s = ((w = (f = this._contentEl) == null ? void 0 : f.querySelector) == null ? void 0 : w.call(f, ".mjr-model3d-render-canvas")) || null);
    }
    if (!s) {
      const v = Q(t);
      if (!v) return;
      s = await new Promise((b) => {
        const A = new Image();
        A.crossOrigin = "anonymous", A.onload = () => b(A), A.onerror = () => b(null), A.src = v;
      });
    }
    if (!s) return;
    const a = s.videoWidth || s.naturalWidth || i, d = s.videoHeight || s.naturalHeight || r;
    if (!a || !d) return;
    const m = Math.min(i / a, r / d);
    e.drawImage(
      s,
      n + (i - a * m) / 2,
      o + (r - d * m) / 2,
      a * m,
      d * m
    );
  }
  /** Render the gen-info overlay onto the canvas region (ox, oy, w, h). */
  _estimateGenInfoOverlayHeight(e, t, n) {
    if (!e || !t || !this._genInfoSelections.size) return 0;
    const o = this._getGenFields(t), i = [
      "prompt",
      "seed",
      "model",
      "lora",
      "sampler",
      "scheduler",
      "cfg",
      "step",
      "genTime"
    ], r = 11, l = 16, c = 8, s = Math.max(100, Number(n || 0) - c * 2);
    let a = 0;
    for (const d of i) {
      if (!this._genInfoSelections.has(d)) continue;
      const m = o[d] != null ? String(o[d]) : "";
      if (!m) continue;
      let p = d.charAt(0).toUpperCase() + d.slice(1);
      d === "lora" ? p = "LoRA" : d === "cfg" ? p = "CFG" : d === "genTime" && (p = "Gen Time");
      const _ = `${p}: `;
      e.font = `bold ${r}px system-ui, sans-serif`;
      const h = e.measureText(_).width;
      e.font = `${r}px system-ui, sans-serif`;
      const f = Math.max(32, s - c * 2 - h);
      let w = 0, v = "";
      for (const b of m.split(" ")) {
        const A = v ? v + " " + b : b;
        e.measureText(A).width > f && v ? (w += 1, v = b) : v = A;
      }
      v && (w += 1), a += w;
    }
    return a > 0 ? a * l + c * 2 : 0;
  }
  _drawGenInfoOverlay(e, t, n, o, i, r) {
    if (!t || !this._genInfoSelections.size) return;
    const l = this._getGenFields(t), c = {
      prompt: "#7ec8ff",
      seed: "#ffd47a",
      model: "#7dda8a",
      lora: "#d48cff",
      sampler: "#ff9f7a",
      scheduler: "#ff7a9f",
      cfg: "#7a9fff",
      step: "#7affd4",
      genTime: "#e0ff7a"
    }, s = [
      "prompt",
      "seed",
      "model",
      "lora",
      "sampler",
      "scheduler",
      "cfg",
      "step",
      "genTime"
    ], a = [];
    for (const y of s) {
      if (!this._genInfoSelections.has(y)) continue;
      const B = l[y] != null ? String(l[y]) : "";
      if (!B) continue;
      let E = y.charAt(0).toUpperCase() + y.slice(1);
      y === "lora" ? E = "LoRA" : y === "cfg" ? E = "CFG" : y === "genTime" && (E = "Gen Time");
      const N = B;
      a.push({
        label: `${E}: `,
        value: N,
        color: c[y] || "#ffffff"
      });
    }
    if (!a.length) return;
    const d = 11, m = 16, p = 8, _ = Math.max(100, i - p * 2);
    e.save();
    const h = [];
    for (const { label: y, value: B, color: E } of a) {
      e.font = `bold ${d}px system-ui, sans-serif`;
      const N = e.measureText(y).width;
      e.font = `${d}px system-ui, sans-serif`;
      const L = _ - p * 2 - N, R = [];
      let I = "";
      for (const O of B.split(" ")) {
        const Y = I ? I + " " + O : O;
        e.measureText(Y).width > L && I ? (R.push(I), I = O) : I = Y;
      }
      I && R.push(I), h.push({ label: y, labelW: N, lines: R, color: E });
    }
    const f = h, v = h.reduce((y, B) => y + B.lines.length, 0) * m + p * 2, b = n + p, A = o + r - v - p;
    e.globalAlpha = 0.72, e.fillStyle = "#000", ee(e, b, A, _, v, 6), e.fill(), e.globalAlpha = 1;
    let M = A + p + d;
    for (const { label: y, labelW: B, lines: E, color: N } of f)
      for (let L = 0; L < E.length; L++)
        L === 0 ? (e.font = `bold ${d}px system-ui, sans-serif`, e.fillStyle = N, e.fillText(y, b + p, M), e.font = `${d}px system-ui, sans-serif`, e.fillStyle = "rgba(255,255,255,0.88)", e.fillText(E[L], b + p + B, M)) : (e.font = `${d}px system-ui, sans-serif`, e.fillStyle = "rgba(255,255,255,0.88)", e.fillText(E[L], b + p + B, M)), M += m;
    e.restore();
  }
  /** Capture the current view to PNG and trigger a browser download. */
  async _captureView() {
    var c;
    if (!this._contentEl) return;
    this._captureBtn && (this._captureBtn.disabled = !0, this._captureBtn.setAttribute("aria-label", S("tooltip.capturingView", "Capturing…")));
    const e = this._contentEl.clientWidth || 480, t = this._contentEl.clientHeight || 360;
    let n = t;
    if (this._mode === g.SIMPLE && this._mediaA && this._genInfoSelections.size) {
      const s = document.createElement("canvas");
      s.width = e, s.height = t;
      const a = s.getContext("2d"), d = this._estimateGenInfoOverlayHeight(a, this._mediaA, e);
      if (d > 0) {
        const m = Math.max(t, d + 24);
        n = Math.min(m, t * 4);
      }
    }
    const o = document.createElement("canvas");
    o.width = e, o.height = n;
    const i = o.getContext("2d");
    i.fillStyle = "#0d0d0d", i.fillRect(0, 0, e, n);
    try {
      if (this._mode === g.SIMPLE)
        this._mediaA && (await this._drawMediaFit(i, this._mediaA, 0, 0, e, t), this._drawGenInfoOverlay(i, this._mediaA, 0, 0, e, n));
      else if (this._mode === g.AB) {
        const s = Math.round(this._abDividerX * e), a = this._contentEl.querySelector(
          ".mjr-mfv-ab-layer:not(.mjr-mfv-ab-layer--b) video"
        ), d = this._contentEl.querySelector(".mjr-mfv-ab-layer--b video");
        this._mediaA && await this._drawMediaFit(i, this._mediaA, 0, 0, e, n, a), this._mediaB && (i.save(), i.beginPath(), i.rect(s, 0, e - s, n), i.clip(), await this._drawMediaFit(i, this._mediaB, 0, 0, e, n, d), i.restore()), i.save(), i.strokeStyle = "rgba(255,255,255,0.88)", i.lineWidth = 2, i.beginPath(), i.moveTo(s, 0), i.lineTo(s, n), i.stroke(), i.restore(), D(i, "A", 8, 8), D(i, "B", s + 8, 8), this._mediaA && this._drawGenInfoOverlay(i, this._mediaA, 0, 0, s, n), this._mediaB && this._drawGenInfoOverlay(i, this._mediaB, s, 0, e - s, n);
      } else if (this._mode === g.SIDE) {
        const s = Math.floor(e / 2), a = this._contentEl.querySelector(".mjr-mfv-side-panel:first-child video"), d = this._contentEl.querySelector(".mjr-mfv-side-panel:last-child video");
        this._mediaA && (await this._drawMediaFit(i, this._mediaA, 0, 0, s, n, a), this._drawGenInfoOverlay(i, this._mediaA, 0, 0, s, n)), i.fillStyle = "#111", i.fillRect(s, 0, 2, n), this._mediaB && (await this._drawMediaFit(i, this._mediaB, s, 0, s, n, d), this._drawGenInfoOverlay(i, this._mediaB, s, 0, s, n)), D(i, "A", 8, 8), D(i, "B", s + 8, 8);
      } else if (this._mode === g.GRID) {
        const s = Math.floor(e / 2), a = Math.floor(n / 2), d = 1, m = [
          { media: this._mediaA, label: "A", x: 0, y: 0, w: s - d, h: a - d },
          {
            media: this._mediaB,
            label: "B",
            x: s + d,
            y: 0,
            w: s - d,
            h: a - d
          },
          {
            media: this._mediaC,
            label: "C",
            x: 0,
            y: a + d,
            w: s - d,
            h: a - d
          },
          {
            media: this._mediaD,
            label: "D",
            x: s + d,
            y: a + d,
            w: s - d,
            h: a - d
          }
        ], p = this._contentEl.querySelectorAll(".mjr-mfv-grid-cell");
        for (let _ = 0; _ < m.length; _++) {
          const h = m[_], f = ((c = p[_]) == null ? void 0 : c.querySelector("video")) || null;
          h.media && (await this._drawMediaFit(i, h.media, h.x, h.y, h.w, h.h, f), this._drawGenInfoOverlay(i, h.media, h.x, h.y, h.w, h.h)), D(i, h.label, h.x + 8, h.y + 8);
        }
        i.save(), i.fillStyle = "#111", i.fillRect(s - d, 0, d * 2, n), i.fillRect(0, a - d, e, d * 2), i.restore();
      }
    } catch (s) {
      console.debug("[MFV] capture error:", s);
    }
    const l = `${{
      [g.AB]: "mfv-ab",
      [g.SIDE]: "mfv-side",
      [g.GRID]: "mfv-grid"
    }[this._mode] ?? "mfv"}-${Date.now()}.png`;
    try {
      const s = o.toDataURL("image/png"), a = document.createElement("a");
      a.href = s, a.download = l, document.body.appendChild(a), a.click(), setTimeout(() => document.body.removeChild(a), 100);
    } catch (s) {
      console.warn("[MFV] download failed:", s);
    } finally {
      this._captureBtn && (this._captureBtn.disabled = !1, this._captureBtn.setAttribute(
        "aria-label",
        S("tooltip.captureView", "Save view as image")
      ));
    }
  }
  // ── Lifecycle ─────────────────────────────────────────────────────────────
  dispose() {
    var e, t, n, o, i, r, l, c, s, a, d, m, p, _, h, f, w, v;
    this._destroyPanZoom(), this._destroyCompareSync(), this._stopEdgeResize(), this._clearPopoutCloseWatch();
    try {
      (e = this._panelAC) == null || e.abort(), this._panelAC = null;
    } catch (b) {
      (t = console.debug) == null || t.call(console, b);
    }
    try {
      (n = this._btnAC) == null || n.abort(), this._btnAC = null;
    } catch (b) {
      (o = console.debug) == null || o.call(console, b);
    }
    try {
      (i = this._docAC) == null || i.abort(), this._docAC = null;
    } catch (b) {
      (r = console.debug) == null || r.call(console, b);
    }
    try {
      (l = this._popoutAC) == null || l.abort(), this._popoutAC = null;
    } catch (b) {
      (c = console.debug) == null || c.call(console, b);
    }
    try {
      (s = this._panzoomAC) == null || s.abort(), this._panzoomAC = null;
    } catch (b) {
      (a = console.debug) == null || a.call(console, b);
    }
    try {
      (m = (d = this._compareSyncAC) == null ? void 0 : d.abort) == null || m.call(d), this._compareSyncAC = null;
    } catch (b) {
      (p = console.debug) == null || p.call(console, b);
    }
    try {
      this._isPopped && this.popIn();
    } catch (b) {
      (_ = console.debug) == null || _.call(console, b);
    }
    this._revokePreviewBlob();
    try {
      (h = this.element) == null || h.remove();
    } catch (b) {
      (f = console.debug) == null || f.call(console, b);
    }
    this.element = null, this._contentEl = null, this._closeBtn = null, this._modeBtn = null, this._pinSelect = null, this._liveBtn = null, this._nodeStreamBtn = null, this._popoutBtn = null, this._captureBtn = null, this._unbindDocumentUiHandlers();
    try {
      (w = this._genDropdown) == null || w.remove();
    } catch (b) {
      (v = console.debug) == null || v.call(console, b);
    }
    this._mediaA = null, this._mediaB = null, this._mediaC = null, this._mediaD = null, this.isVisible = !1;
  }
}
export {
  ye as FloatingViewer,
  g as MFV_MODES
};
