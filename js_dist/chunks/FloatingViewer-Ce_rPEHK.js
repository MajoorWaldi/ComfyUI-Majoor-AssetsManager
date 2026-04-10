import { g as H, t as E, a as oe, s as F, E as j, A as ne, n as re, b as W, c as $, e as R, d as X, h as q, i as K, j as ae, k as le, M as de, l as ce, m as he, o as pe } from "./entry-DMUEpobK.js";
function ue(a, e) {
  switch (String((a == null ? void 0 : a.type) || "").toLowerCase()) {
    case "number":
      return me(a, e);
    case "combo":
      return _e(a, e);
    case "text":
    case "string":
    case "customtext":
      return fe(a, e);
    case "toggle":
      return ge(a, e);
    default:
      return be(a);
  }
}
function U(a, e) {
  var n, s, i, r, l, h, o;
  if (!a) return !1;
  const t = String(a.type || "").toLowerCase();
  if (t === "number") {
    const c = Number(e);
    if (Number.isNaN(c)) return !1;
    const d = a.options ?? {}, m = d.min ?? -1 / 0, u = d.max ?? 1 / 0;
    a.value = Math.min(u, Math.max(m, c));
  } else t === "toggle" ? a.value = !!e : a.value = e;
  try {
    (n = a.callback) == null || n.call(a, a.value);
  } catch (c) {
    (s = console.debug) == null || s.call(console, c);
  }
  try {
    const c = H();
    (r = (i = c == null ? void 0 : c.canvas) == null ? void 0 : i.setDirty) == null || r.call(i, !0, !0), (h = (l = c == null ? void 0 : c.graph) == null ? void 0 : l.setDirtyCanvas) == null || h.call(l, !0, !0);
  } catch (c) {
    (o = console.debug) == null || o.call(console, c);
  }
  return !0;
}
function me(a, e) {
  const t = document.createElement("input");
  t.type = "number", t.className = "mjr-ws-input", t.value = a.value ?? "";
  const n = a.options ?? {};
  return n.min != null && (t.min = String(n.min)), n.max != null && (t.max = String(n.max)), n.step != null && (t.step = String(n.step)), t.addEventListener("change", () => {
    U(a, t.value) && (t.value = a.value, e == null || e(a.value));
  }), t;
}
function _e(a, e) {
  var s;
  const t = document.createElement("select");
  t.className = "mjr-ws-input";
  let n = ((s = a.options) == null ? void 0 : s.values) ?? [];
  if (typeof n == "function")
    try {
      n = n() ?? [];
    } catch {
      n = [];
    }
  Array.isArray(n) || (n = []);
  for (const i of n) {
    const r = document.createElement("option"), l = typeof i == "string" ? i : (i == null ? void 0 : i.content) ?? (i == null ? void 0 : i.value) ?? (i == null ? void 0 : i.text) ?? String(i);
    r.value = l, r.textContent = l, l === String(a.value) && (r.selected = !0), t.appendChild(r);
  }
  return t.addEventListener("change", () => {
    U(a, t.value) && (e == null || e(a.value));
  }), t;
}
function fe(a, e) {
  const n = document.createElement("div");
  n.className = "mjr-ws-text-wrapper";
  const s = document.createElement("textarea");
  s.className = "mjr-ws-input mjr-ws-textarea", s.value = a.value ?? "", s.rows = 2;
  const i = document.createElement("button");
  i.type = "button", i.className = "mjr-ws-expand-btn", i.textContent = "Expand", i.style.display = "none";
  let r = !1;
  const l = () => {
    s.style.height = "auto";
    const h = s.scrollHeight;
    r ? (s.style.height = h + "px", s.style.maxHeight = "none", i.textContent = "Collapse") : (s.style.height = Math.min(h, 80) + "px", s.style.maxHeight = "80px", i.textContent = "Expand"), i.style.display = h > 80 ? "" : "none";
  };
  return s.addEventListener("change", () => {
    U(a, s.value) && (e == null || e(a.value));
  }), s.addEventListener("input", l), i.addEventListener("click", () => {
    r = !r, l();
  }), n.appendChild(s), n.appendChild(i), requestAnimationFrame(l), n;
}
function ge(a, e) {
  const t = document.createElement("label");
  t.className = "mjr-ws-toggle-label";
  const n = document.createElement("input");
  return n.type = "checkbox", n.className = "mjr-ws-checkbox", n.checked = !!a.value, n.addEventListener("change", () => {
    U(a, n.checked) && (e == null || e(a.value));
  }), t.appendChild(n), t;
}
function be(a) {
  const e = document.createElement("input");
  return e.type = "text", e.className = "mjr-ws-input mjr-ws-readonly", e.value = a.value != null ? String(a.value) : "", e.readOnly = !0, e.tabIndex = -1, e;
}
const ve = /* @__PURE__ */ new Set(["imageupload", "button", "hidden"]);
class ye {
  /**
   * @param {object} node  LGraphNode instance
   * @param {object} [opts]
   * @param {() => void} [opts.onLocate]  Custom locate handler (optional)
   */
  constructor(e, t = {}) {
    this._node = e, this._onLocate = t.onLocate ?? null, this._el = null, this._inputMap = /* @__PURE__ */ new Map();
  }
  get el() {
    return this._el || (this._el = this._render()), this._el;
  }
  /** Re-read widget values from the live graph and update inputs. */
  syncFromGraph() {
    var e, t;
    if ((e = this._node) != null && e.widgets)
      for (const n of this._node.widgets) {
        let s = this._inputMap.get(n.name);
        s && ((t = s.classList) != null && t.contains("mjr-ws-text-wrapper") && (s = s.querySelector("textarea") ?? s), s.type === "checkbox" ? s.checked = !!n.value : s.value = n.value != null ? String(n.value) : "");
      }
  }
  dispose() {
    var e;
    (e = this._el) == null || e.remove(), this._el = null, this._inputMap.clear();
  }
  // ── Private ───────────────────────────────────────────────────────────────
  _render() {
    var c;
    const e = this._node, t = document.createElement("section");
    t.className = "mjr-ws-node", t.dataset.nodeId = String(e.id ?? "");
    const n = document.createElement("div");
    n.className = "mjr-ws-node-header";
    const s = document.createElement("span");
    s.className = "mjr-ws-node-title", s.textContent = e.title || e.type || `Node #${e.id}`, n.appendChild(s);
    const i = document.createElement("button");
    i.type = "button", i.className = "mjr-icon-btn mjr-ws-locate", i.title = "Locate on canvas";
    const r = document.createElement("i");
    r.className = "pi pi-map-marker", r.setAttribute("aria-hidden", "true"), i.appendChild(r), i.addEventListener("click", () => this._locateNode()), n.appendChild(i), t.appendChild(n);
    const l = document.createElement("div");
    l.className = "mjr-ws-node-body";
    const h = e.widgets ?? [];
    let o = !1;
    for (const d of h) {
      const m = String(d.type || "").toLowerCase();
      if (ve.has(m) || d.hidden || (c = d.options) != null && c.hidden) continue;
      o = !0;
      const u = m === "text" || m === "string" || m === "customtext", _ = document.createElement("div");
      _.className = u ? "mjr-ws-widget-row mjr-ws-widget-row--block" : "mjr-ws-widget-row";
      const p = document.createElement("label");
      p.className = "mjr-ws-widget-label", p.textContent = d.name || "";
      const f = document.createElement("div");
      f.className = "mjr-ws-widget-input";
      const v = ue(d, () => {
      });
      f.appendChild(v), this._inputMap.set(d.name, v), _.appendChild(p), _.appendChild(f), l.appendChild(_);
    }
    if (!o) {
      const d = document.createElement("div");
      d.className = "mjr-ws-node-empty", d.textContent = "No editable parameters", l.appendChild(d);
    }
    return t.appendChild(l), t;
  }
  _locateNode() {
    var t, n, s, i, r, l, h, o;
    if (this._onLocate) {
      this._onLocate();
      return;
    }
    const e = this._node;
    if (e)
      try {
        const c = H(), d = c == null ? void 0 : c.canvas;
        if (!d) return;
        if (typeof d.centerOnNode == "function")
          d.centerOnNode(e);
        else if (d.ds && e.pos) {
          const m = ((t = d.canvas) == null ? void 0 : t.width) || ((n = d.element) == null ? void 0 : n.width) || 800, u = ((s = d.canvas) == null ? void 0 : s.height) || ((i = d.element) == null ? void 0 : i.height) || 600;
          d.ds.offset[0] = -e.pos[0] - (((r = e.size) == null ? void 0 : r[0]) || 0) / 2 + m / 2, d.ds.offset[1] = -e.pos[1] - (((l = e.size) == null ? void 0 : l[1]) || 0) / 2 + u / 2, (h = d.setDirty) == null || h.call(d, !0, !0);
        }
      } catch (c) {
        (o = console.debug) == null || o.call(console, "[MFV sidebar] locateNode error", c);
      }
  }
}
class we {
  /**
   * @param {object} opts
   * @param {HTMLElement} opts.hostEl  The MFV root element to append to
   * @param {() => void}  [opts.onClose]
   */
  constructor({ hostEl: e, onClose: t } = {}) {
    this._hostEl = e, this._onClose = t ?? null, this._renderers = [], this._visible = !1, this._el = this._build();
  }
  get el() {
    return this._el;
  }
  get isVisible() {
    return this._visible;
  }
  show() {
    this._visible = !0, this._el.classList.add("open"), this.refresh();
  }
  hide() {
    this._visible = !1, this._el.classList.remove("open");
  }
  toggle() {
    var e;
    this._visible ? (this.hide(), (e = this._onClose) == null || e.call(this)) : this.show();
  }
  /** Re-read selected nodes and rebuild widget sections. */
  refresh() {
    if (!this._visible) return;
    this._clear();
    const e = Ce();
    if (!e.length) {
      this._showEmpty();
      return;
    }
    for (const t of e) {
      const n = new ye(t);
      this._renderers.push(n), this._body.appendChild(n.el);
    }
  }
  /** Sync existing renderers from graph values without full rebuild. */
  syncFromGraph() {
    for (const e of this._renderers) e.syncFromGraph();
  }
  dispose() {
    var e;
    this._clear(), (e = this._el) == null || e.remove();
  }
  // ── Private ───────────────────────────────────────────────────────────────
  _build() {
    const e = document.createElement("div");
    e.className = "mjr-ws-sidebar";
    const t = document.createElement("div");
    t.className = "mjr-ws-sidebar-header";
    const n = document.createElement("span");
    n.className = "mjr-ws-sidebar-title", n.textContent = "Node Parameters", t.appendChild(n);
    const s = document.createElement("button");
    s.type = "button", s.className = "mjr-icon-btn", s.title = "Close sidebar";
    const i = document.createElement("i");
    return i.className = "pi pi-times", i.setAttribute("aria-hidden", "true"), s.appendChild(i), s.addEventListener("click", () => {
      var r;
      this.hide(), (r = this._onClose) == null || r.call(this);
    }), t.appendChild(s), e.appendChild(t), this._body = document.createElement("div"), this._body.className = "mjr-ws-sidebar-body", e.appendChild(this._body), e;
  }
  _clear() {
    for (const e of this._renderers) e.dispose();
    this._renderers = [], this._body && (this._body.innerHTML = "");
  }
  _showEmpty() {
    const e = document.createElement("div");
    e.className = "mjr-ws-sidebar-empty", e.textContent = "Select nodes on the canvas to edit their parameters", this._body.appendChild(e);
  }
}
function Ce() {
  var a, e, t;
  try {
    const n = H(), s = ((a = n == null ? void 0 : n.canvas) == null ? void 0 : a.selected_nodes) ?? ((e = n == null ? void 0 : n.canvas) == null ? void 0 : e.selectedNodes) ?? null;
    if (!s) return [];
    if (Array.isArray(s)) return s.filter(Boolean);
    if (s instanceof Map) return Array.from(s.values()).filter(Boolean);
    if (typeof s == "object") return Object.values(s).filter(Boolean);
  } catch (n) {
    (t = console.debug) == null || t.call(console, "[MFV sidebar] _getSelectedNodes error", n);
  }
  return [];
}
const B = Object.freeze({ IDLE: "idle", RUNNING: "running", ERROR: "error" });
function Ee() {
  const a = document.createElement("button");
  a.type = "button", a.className = "mjr-icon-btn mjr-mfv-run-btn";
  const e = E("tooltip.queuePrompt", "Queue Prompt (Run)");
  a.title = e, a.setAttribute("aria-label", e);
  const t = document.createElement("i");
  t.className = "pi pi-play", t.setAttribute("aria-hidden", "true"), a.appendChild(t);
  let n = B.IDLE;
  function s(r) {
    n = r, a.classList.toggle("running", n === B.RUNNING), a.classList.toggle("error", n === B.ERROR), a.disabled = n === B.RUNNING, n === B.RUNNING ? t.className = "pi pi-spin pi-spinner" : t.className = "pi pi-play";
  }
  async function i() {
    var r;
    if (n !== B.RUNNING) {
      s(B.RUNNING);
      try {
        await Ae(), s(B.IDLE);
      } catch (l) {
        (r = console.error) == null || r.call(console, "[MFV Run]", l), s(B.ERROR), setTimeout(() => {
          n === B.ERROR && s(B.IDLE);
        }, 1500);
      }
    }
  }
  return a.addEventListener("click", i), {
    el: a,
    dispose() {
      a.removeEventListener("click", i);
    }
  };
}
async function Ae() {
  const a = H();
  if (!a) throw new Error("ComfyUI app not available");
  if (typeof a.queuePrompt == "function") {
    await a.queuePrompt(0);
    return;
  }
  const e = typeof a.graphToPrompt == "function" ? await a.graphToPrompt() : null;
  if (!(e != null && e.output)) throw new Error("graphToPrompt returned empty output");
  const t = oe(a);
  if (t && typeof t.queuePrompt == "function") {
    await t.queuePrompt(0, e);
    return;
  }
  const n = await fetch("/prompt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: e.output,
      extra_data: { extra_pnginfo: { workflow: e.workflow } }
    })
  });
  if (!n.ok) throw new Error(`POST /prompt failed (${n.status})`);
}
const g = Object.freeze({
  SIMPLE: "simple",
  AB: "ab",
  SIDE: "side",
  GRID: "grid"
}), Y = 0.25, Z = 8, Se = 8e-4, O = 8;
let Be = 0;
const Pe = /* @__PURE__ */ new Set([".mp4", ".webm", ".mov", ".avi", ".mkv"]), Me = /* @__PURE__ */ new Set([".mp3", ".wav", ".flac", ".ogg", ".m4a", ".aac", ".opus", ".wma"]), Ie = "C", Q = "L", ee = "K", Ne = "N", Le = "Esc";
function xe() {
  var a, e, t, n, s;
  try {
    const i = typeof window < "u" ? window : globalThis, r = (e = (a = i == null ? void 0 : i.process) == null ? void 0 : a.versions) == null ? void 0 : e.electron;
    if (typeof r == "string" && r.trim() || i != null && i.electron || i != null && i.ipcRenderer || i != null && i.electronAPI)
      return !0;
    const l = String(((t = i == null ? void 0 : i.navigator) == null ? void 0 : t.userAgent) || ((n = globalThis == null ? void 0 : globalThis.navigator) == null ? void 0 : n.userAgent) || ""), h = /\bElectron\//i.test(l), o = /\bCode\//i.test(l);
    if (h && !o)
      return !0;
  } catch (i) {
    (s = console.debug) == null || s.call(console, i);
  }
  return !1;
}
function C(a, e = null, t = "info") {
  var s, i;
  const n = {
    stage: String(a || "unknown"),
    detail: e,
    ts: Date.now()
  };
  try {
    const r = typeof window < "u" ? window : globalThis, l = "__MJR_MFV_POPOUT_TRACE__", h = Array.isArray(r[l]) ? r[l] : [];
    h.push(n), r[l] = h.slice(-20), r.__MJR_MFV_POPOUT_LAST__ = n;
  } catch (r) {
    (s = console.debug) == null || s.call(console, r);
  }
  try {
    const r = t === "error" ? console.error : t === "warn" ? console.warn : console.info;
    r == null || r("[MFV popout]", n);
  } catch (r) {
    (i = console.debug) == null || i.call(console, r);
  }
}
function ke(a) {
  try {
    const e = String(a || "").trim(), t = e.lastIndexOf(".");
    return t >= 0 ? e.slice(t).toLowerCase() : "";
  } catch {
    return "";
  }
}
function L(a) {
  const e = String((a == null ? void 0 : a.kind) || "").toLowerCase();
  if (e === "video") return "video";
  if (e === "audio") return "audio";
  if (e === "model3d") return "model3d";
  const t = ke((a == null ? void 0 : a.filename) || "");
  return t === ".gif" ? "gif" : Pe.has(t) ? "video" : Me.has(t) ? "audio" : de.has(t) ? "model3d" : "image";
}
function ie(a) {
  return a ? a.url ? String(a.url) : a.filename && a.id == null ? he(a.filename, a.subfolder || "", a.type || "output") : a.filename && pe(a) || "" : "";
}
function I(a = "No media — select assets in the grid") {
  const e = document.createElement("div");
  return e.className = "mjr-mfv-empty", e.textContent = a, e;
}
function T(a, e) {
  const t = document.createElement("div");
  return t.className = `mjr-mfv-label label-${e}`, t.textContent = a, t;
}
function te(a) {
  var e;
  if (!(!a || typeof a.play != "function"))
    try {
      const t = a.play();
      t && typeof t.catch == "function" && t.catch(() => {
      });
    } catch (t) {
      (e = console.debug) == null || e.call(console, t);
    }
}
function je(a, e) {
  var n, s;
  let t = a && a.nodeType === 1 ? a : (a == null ? void 0 : a.parentElement) || null;
  for (; t && t !== e; ) {
    try {
      const i = (n = window.getComputedStyle) == null ? void 0 : n.call(window, t), r = /(auto|scroll|overlay)/.test(String((i == null ? void 0 : i.overflowY) || "")), l = /(auto|scroll|overlay)/.test(String((i == null ? void 0 : i.overflowX) || ""));
      if (r || l)
        return t;
    } catch (i) {
      (s = console.debug) == null || s.call(console, i);
    }
    t = t.parentElement || null;
  }
  return null;
}
function Te(a, e, t) {
  if (!a) return !1;
  if (Math.abs(Number(t) || 0) >= Math.abs(Number(e) || 0)) {
    const i = Number(a.scrollTop || 0), r = Math.max(0, Number(a.scrollHeight || 0) - Number(a.clientHeight || 0));
    if (t < 0 && i > 0 || t > 0 && i < r) return !0;
  }
  const n = Number(a.scrollLeft || 0), s = Math.max(0, Number(a.scrollWidth || 0) - Number(a.clientWidth || 0));
  return e < 0 && n > 0 || e > 0 && n < s;
}
function Ge(a) {
  var e, t, n, s;
  if (a)
    try {
      const i = (e = a.querySelectorAll) == null ? void 0 : e.call(a, "video, audio");
      if (!i || !i.length) return;
      for (const r of i)
        try {
          (t = r.pause) == null || t.call(r);
        } catch (l) {
          (n = console.debug) == null || n.call(console, l);
        }
    } catch (i) {
      (s = console.debug) == null || s.call(console, i);
    }
}
function G(a, { fill: e = !1 } = {}) {
  var r;
  const t = ie(a);
  if (!t) return null;
  const n = L(a), s = `mjr-mfv-media mjr-mfv-media--fit-height${e ? " mjr-mfv-media--fill" : ""}`;
  if (n === "audio") {
    const l = document.createElement("div");
    l.className = `mjr-mfv-audio-card${e ? " mjr-mfv-audio-card--fill" : ""}`;
    const h = document.createElement("div");
    h.className = "mjr-mfv-audio-head";
    const o = document.createElement("i");
    o.className = "pi pi-volume-up mjr-mfv-audio-icon", o.setAttribute("aria-hidden", "true");
    const c = document.createElement("div");
    c.className = "mjr-mfv-audio-title", c.textContent = String((a == null ? void 0 : a.filename) || "Audio"), h.appendChild(o), h.appendChild(c);
    const d = document.createElement("audio");
    d.className = "mjr-mfv-audio-player", d.src = t, d.controls = !0, d.autoplay = !0, d.preload = "metadata";
    try {
      d.addEventListener("loadedmetadata", () => te(d), { once: !0 });
    } catch (m) {
      (r = console.debug) == null || r.call(console, m);
    }
    return te(d), l.appendChild(h), l.appendChild(d), l;
  }
  if (n === "video") {
    const l = document.createElement("video");
    return l.className = s, l.src = t, l.controls = !0, l.loop = !0, l.muted = !0, l.autoplay = !0, l.playsInline = !0, l;
  }
  if (n === "model3d")
    return ce(a, t, {
      hostClassName: `mjr-model3d-host mjr-mfv-model3d-host${e ? " mjr-mfv-model3d-host--fill" : ""}`,
      canvasClassName: `mjr-mfv-media mjr-model3d-render-canvas${e ? " mjr-mfv-media--fill" : ""}`,
      hintText: "Rotate: left drag  Pan: right drag  Zoom: wheel or middle drag",
      disableViewerTransform: !0,
      pauseDuringExecution: !!ne.FLOATING_VIEWER_PAUSE_DURING_EXECUTION
    });
  const i = document.createElement("img");
  return i.className = s, i.src = t, i.alt = String((a == null ? void 0 : a.filename) || ""), i.draggable = !1, i;
}
function se(a, e, t, n, s, i) {
  a.beginPath(), typeof a.roundRect == "function" ? a.roundRect(e, t, n, s, i) : (a.moveTo(e + i, t), a.lineTo(e + n - i, t), a.quadraticCurveTo(e + n, t, e + n, t + i), a.lineTo(e + n, t + s - i), a.quadraticCurveTo(e + n, t + s, e + n - i, t + s), a.lineTo(e + i, t + s), a.quadraticCurveTo(e, t + s, e, t + s - i), a.lineTo(e, t + i), a.quadraticCurveTo(e, t, e + i, t), a.closePath());
}
function D(a, e, t, n) {
  a.save(), a.font = "bold 10px system-ui, sans-serif";
  const s = 5, i = a.measureText(e).width;
  a.fillStyle = "rgba(0,0,0,0.58)", se(a, t, n, i + s * 2, 18, 4), a.fill(), a.fillStyle = "#fff", a.fillText(e, t + s, n + 13), a.restore();
}
class Fe {
  constructor({ controller: e = null } = {}) {
    this._instanceId = ++Be, this._controller = e && typeof e == "object" ? { ...e } : null, this.element = null, this.isVisible = !1, this._contentEl = null, this._closeBtn = null, this._modeBtn = null, this._pinGroup = null, this._pinBtns = null, this._liveBtn = null, this._genBtn = null, this._genDropdown = null, this._captureBtn = null, this._genInfoSelections = /* @__PURE__ */ new Set(["genTime"]), this._mode = g.SIMPLE, this._mediaA = null, this._mediaB = null, this._mediaC = null, this._mediaD = null, this._pinnedSlots = /* @__PURE__ */ new Set(), this._abDividerX = 0.5, this._zoom = 1, this._panX = 0, this._panY = 0, this._panzoomAC = null, this._dragging = !1, this._compareSyncAC = null, this._btnAC = null, this._refreshGen = 0, this._popoutWindow = null, this._popoutBtn = null, this._isPopped = !1, this._desktopExpanded = !1, this._desktopExpandRestore = null, this._desktopPopoutUnsupported = !1, this._popoutCloseHandler = null, this._popoutKeydownHandler = null, this._popoutCloseTimer = null, this._popoutRestoreGuard = !1, this._previewBtn = null, this._previewBlobUrl = null, this._previewActive = !1, this._nodeStreamBtn = null, this._nodeStreamActive = !1, this._docAC = new AbortController(), this._popoutAC = null, this._panelAC = new AbortController(), this._resizeState = null, this._titleId = `mjr-mfv-title-${this._instanceId}`, this._genDropdownId = `mjr-mfv-gen-dropdown-${this._instanceId}`, this._docClickHost = null, this._handleDocClick = null;
  }
  _dispatchControllerAction(e, t) {
    var n, s, i;
    try {
      const r = (n = this._controller) == null ? void 0 : n[e];
      if (typeof r == "function")
        return r();
    } catch (r) {
      (s = console.debug) == null || s.call(console, r);
    }
    if (t)
      try {
        window.dispatchEvent(new Event(t));
      } catch (r) {
        (i = console.debug) == null || i.call(console, r);
      }
  }
  _forwardKeydownToController(e) {
    var t, n, s;
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
      (s = console.debug) == null || s.call(console, i);
    }
  }
  // ── Build DOM ─────────────────────────────────────────────────────────────
  render() {
    const e = document.createElement("div");
    return e.className = "mjr-mfv", e.setAttribute("role", "dialog"), e.setAttribute("aria-modal", "false"), e.setAttribute("aria-hidden", "true"), this.element = e, e.appendChild(this._buildHeader()), e.setAttribute("aria-labelledby", this._titleId), e.appendChild(this._buildToolbar()), this._contentWrapper = document.createElement("div"), this._contentWrapper.className = "mjr-mfv-content-wrapper", this._applySidebarPosition(), this._contentEl = document.createElement("div"), this._contentEl.className = "mjr-mfv-content", this._contentWrapper.appendChild(this._contentEl), this._sidebar = new we({
      hostEl: e,
      onClose: () => this._updateSettingsBtnState(!1)
    }), this._contentWrapper.appendChild(this._sidebar.el), e.appendChild(this._contentWrapper), this._rebindControlHandlers(), this._bindPanelInteractions(), this._bindDocumentUiHandlers(), this._onSidebarPosChanged = (t) => {
      var n;
      ((n = t == null ? void 0 : t.detail) == null ? void 0 : n.key) === "viewer.mfvSidebarPosition" && this._applySidebarPosition();
    }, window.addEventListener("mjr-settings-changed", this._onSidebarPosChanged), this._refresh(), e;
  }
  _buildHeader() {
    const e = document.createElement("div");
    e.className = "mjr-mfv-header";
    const t = document.createElement("span");
    t.className = "mjr-mfv-header-title", t.id = this._titleId, t.textContent = "Majoor Viewer Lite";
    const n = document.createElement("button");
    this._closeBtn = n, n.type = "button", n.className = "mjr-icon-btn mjr-mfv-close-btn", F(n, E("tooltip.closeViewer", "Close viewer"), Le);
    const s = document.createElement("i");
    return s.className = "pi pi-times", s.setAttribute("aria-hidden", "true"), n.appendChild(s), e.appendChild(t), e.appendChild(n), e;
  }
  _buildToolbar() {
    var d, m;
    const e = document.createElement("div");
    e.className = "mjr-mfv-toolbar", this._modeBtn = document.createElement("button"), this._modeBtn.type = "button", this._modeBtn.className = "mjr-icon-btn", this._updateModeBtnUI(), e.appendChild(this._modeBtn), this._pinGroup = document.createElement("div"), this._pinGroup.className = "mjr-mfv-pin-group", this._pinGroup.setAttribute("role", "group"), this._pinGroup.setAttribute("aria-label", "Pin References"), this._pinBtns = {};
    for (const u of ["A", "B", "C", "D"]) {
      const _ = document.createElement("button");
      _.type = "button", _.className = "mjr-mfv-pin-btn", _.textContent = u, _.dataset.slot = u, _.title = `Pin ${u}`, _.setAttribute("aria-pressed", "false"), this._pinBtns[u] = _, this._pinGroup.appendChild(_);
    }
    this._updatePinUI(), e.appendChild(this._pinGroup);
    const t = document.createElement("div");
    t.className = "mjr-mfv-toolbar-sep", t.setAttribute("aria-hidden", "true"), e.appendChild(t), this._liveBtn = document.createElement("button"), this._liveBtn.type = "button", this._liveBtn.className = "mjr-icon-btn", this._liveBtn.innerHTML = '<i class="pi pi-circle" aria-hidden="true"></i>', this._liveBtn.setAttribute("aria-pressed", "false"), F(
      this._liveBtn,
      E("tooltip.liveStreamOff", "Live Stream: OFF — click to follow"),
      Q
    ), e.appendChild(this._liveBtn), this._previewBtn = document.createElement("button"), this._previewBtn.type = "button", this._previewBtn.className = "mjr-icon-btn", this._previewBtn.innerHTML = '<i class="pi pi-eye" aria-hidden="true"></i>', this._previewBtn.setAttribute("aria-pressed", "false"), F(
      this._previewBtn,
      E(
        "tooltip.previewStreamOff",
        "KSampler Preview: OFF — click to stream denoising steps"
      ),
      ee
    ), e.appendChild(this._previewBtn), this._nodeStreamBtn = document.createElement("button"), this._nodeStreamBtn.type = "button", this._nodeStreamBtn.className = "mjr-icon-btn", this._nodeStreamBtn.innerHTML = '<i class="pi pi-sitemap" aria-hidden="true"></i>', this._nodeStreamBtn.setAttribute("aria-pressed", "false"), F(
      this._nodeStreamBtn,
      E("tooltip.nodeStreamOff", "Node Stream: OFF — click to stream selected node output"),
      Ne
    ), e.appendChild(this._nodeStreamBtn), (m = (d = this._nodeStreamBtn).remove) == null || m.call(d), this._nodeStreamBtn = null, this._genBtn = document.createElement("button"), this._genBtn.type = "button", this._genBtn.className = "mjr-icon-btn", this._genBtn.setAttribute("aria-haspopup", "dialog"), this._genBtn.setAttribute("aria-expanded", "false");
    const n = document.createElement("i");
    n.className = "pi pi-info-circle", n.setAttribute("aria-hidden", "true"), this._genBtn.appendChild(n), e.appendChild(this._genBtn), this._updateGenBtnUI(), this._popoutBtn = document.createElement("button"), this._popoutBtn.type = "button", this._popoutBtn.className = "mjr-icon-btn";
    const s = E(
      "tooltip.popOutViewer",
      "Pop out viewer to separate window"
    );
    this._popoutBtn.title = s, this._popoutBtn.setAttribute("aria-label", s), this._popoutBtn.setAttribute("aria-pressed", "false");
    const i = document.createElement("i");
    i.className = "pi pi-external-link", i.setAttribute("aria-hidden", "true"), this._popoutBtn.appendChild(i), e.appendChild(this._popoutBtn), this._captureBtn = document.createElement("button"), this._captureBtn.type = "button", this._captureBtn.className = "mjr-icon-btn";
    const r = E("tooltip.captureView", "Save view as image");
    this._captureBtn.title = r, this._captureBtn.setAttribute("aria-label", r);
    const l = document.createElement("i");
    l.className = "pi pi-download", l.setAttribute("aria-hidden", "true"), this._captureBtn.appendChild(l), e.appendChild(this._captureBtn);
    const h = document.createElement("div");
    h.className = "mjr-mfv-toolbar-sep", h.style.marginLeft = "auto", h.setAttribute("aria-hidden", "true"), e.appendChild(h), this._settingsBtn = document.createElement("button"), this._settingsBtn.type = "button", this._settingsBtn.className = "mjr-icon-btn mjr-mfv-settings-btn";
    const o = E("tooltip.nodeParams", "Node Parameters");
    this._settingsBtn.title = o, this._settingsBtn.setAttribute("aria-label", o), this._settingsBtn.setAttribute("aria-pressed", "false");
    const c = document.createElement("i");
    return c.className = "pi pi-sliders-h", c.setAttribute("aria-hidden", "true"), this._settingsBtn.appendChild(c), e.appendChild(this._settingsBtn), this._runHandle = Ee(), e.appendChild(this._runHandle.el), this._handleDocClick = (u) => {
      var p, f;
      if (!this._genDropdown) return;
      const _ = u == null ? void 0 : u.target;
      (f = (p = this._genBtn) == null ? void 0 : p.contains) != null && f.call(p, _) || this._genDropdown.contains(_) || this._closeGenDropdown();
    }, this._bindDocumentUiHandlers(), e;
  }
  _rebindControlHandlers() {
    var t, n, s, i, r, l, h, o, c, d, m, u;
    try {
      (t = this._btnAC) == null || t.abort();
    } catch (_) {
      (n = console.debug) == null || n.call(console, _);
    }
    this._btnAC = new AbortController();
    const e = this._btnAC.signal;
    (s = this._closeBtn) == null || s.addEventListener(
      "click",
      () => {
        this._dispatchControllerAction("close", j.MFV_CLOSE);
      },
      { signal: e }
    ), (i = this._modeBtn) == null || i.addEventListener("click", () => this._cycleMode(), { signal: e }), (r = this._pinGroup) == null || r.addEventListener(
      "click",
      (_) => {
        var v, y;
        const p = (y = (v = _.target) == null ? void 0 : v.closest) == null ? void 0 : y.call(v, ".mjr-mfv-pin-btn");
        if (!p) return;
        const f = p.dataset.slot;
        f && (this._pinnedSlots.has(f) ? this._pinnedSlots.delete(f) : this._pinnedSlots.add(f), this._pinnedSlots.has("C") || this._pinnedSlots.has("D") ? this._mode !== g.GRID && this.setMode(g.GRID) : this._pinnedSlots.size > 0 && this._mode === g.SIMPLE && this.setMode(g.AB), this._updatePinUI());
      },
      { signal: e }
    ), (l = this._liveBtn) == null || l.addEventListener(
      "click",
      () => {
        this._dispatchControllerAction("toggleLive", j.MFV_LIVE_TOGGLE);
      },
      { signal: e }
    ), (h = this._previewBtn) == null || h.addEventListener(
      "click",
      () => {
        this._dispatchControllerAction("togglePreview", j.MFV_PREVIEW_TOGGLE);
      },
      { signal: e }
    ), (o = this._nodeStreamBtn) == null || o.addEventListener(
      "click",
      () => {
        this._dispatchControllerAction(
          "toggleNodeStream",
          j.MFV_NODESTREAM_TOGGLE
        );
      },
      { signal: e }
    ), (c = this._genBtn) == null || c.addEventListener(
      "click",
      (_) => {
        var p, f;
        _.stopPropagation(), (f = (p = this._genDropdown) == null ? void 0 : p.classList) != null && f.contains("is-visible") ? this._closeGenDropdown() : this._openGenDropdown();
      },
      { signal: e }
    ), (d = this._popoutBtn) == null || d.addEventListener(
      "click",
      () => {
        this._dispatchControllerAction("popOut", j.MFV_POPOUT);
      },
      { signal: e }
    ), (m = this._captureBtn) == null || m.addEventListener("click", () => this._captureView(), { signal: e }), (u = this._settingsBtn) == null || u.addEventListener(
      "click",
      () => {
        var _, p;
        (_ = this._sidebar) == null || _.toggle(), this._updateSettingsBtnState(((p = this._sidebar) == null ? void 0 : p.isVisible) ?? !1);
      },
      { signal: e }
    );
  }
  _updateSettingsBtnState(e) {
    this._settingsBtn && (this._settingsBtn.classList.toggle("active", !!e), this._settingsBtn.setAttribute("aria-pressed", String(!!e)));
  }
  /**
   * Apply sidebar position (right / left / bottom) from APP_CONFIG.
   * Sets a data-attribute on _contentWrapper so CSS handles layout.
   * Also reorders DOM children when position is "left".
   */
  _applySidebarPosition() {
    var t;
    if (!this._contentWrapper) return;
    const e = ne.MFV_SIDEBAR_POSITION || "right";
    this._contentWrapper.setAttribute("data-sidebar-pos", e), (t = this._sidebar) != null && t.el && this._contentEl && (e === "left" ? this._contentWrapper.insertBefore(this._sidebar.el, this._contentEl) : this._contentWrapper.appendChild(this._sidebar.el));
  }
  /** Refresh the sidebar content (called by manager on node selection change). */
  refreshSidebar() {
    var e;
    (e = this._sidebar) == null || e.refresh();
  }
  _resetGenDropdownForCurrentDocument() {
    var e, t, n;
    this._closeGenDropdown();
    try {
      (t = (e = this._genDropdown) == null ? void 0 : e.remove) == null || t.call(e);
    } catch (s) {
      (n = console.debug) == null || n.call(console, s);
    }
    this._genDropdown = null, this._updateGenBtnUI();
  }
  _bindDocumentUiHandlers() {
    var t, n, s;
    if (!this._handleDocClick) return;
    const e = ((t = this.element) == null ? void 0 : t.ownerDocument) || document;
    if (this._docClickHost !== e) {
      this._unbindDocumentUiHandlers();
      try {
        (n = this._docAC) == null || n.abort();
      } catch (i) {
        (s = console.debug) == null || s.call(console, i);
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
    const e = this._genBtn.getBoundingClientRect(), t = this.element.getBoundingClientRect(), n = e.left - t.left, s = e.bottom - t.top + 6;
    this._genDropdown.style.left = `${n}px`, this._genDropdown.style.top = `${s}px`, this._genDropdown.classList.add("is-visible"), this._updateGenBtnUI();
  }
  _closeGenDropdown() {
    this._genDropdown && (this._genDropdown.classList.remove("is-visible"), this._updateGenBtnUI());
  }
  /** Reflect how many fields are enabled on the gen info button. */
  _updateGenBtnUI() {
    if (!this._genBtn) return;
    const e = this._genInfoSelections.size, t = e > 0, n = this._isGenDropdownOpen();
    this._genBtn.classList.toggle("is-on", t), this._genBtn.classList.toggle("is-open", n);
    const s = t ? `Gen Info (${e} field${e > 1 ? "s" : ""} shown)${n ? " — open" : " — click to configure"}` : `Gen Info${n ? " — open" : " — click to show overlay"}`;
    this._genBtn.title = s, this._genBtn.setAttribute("aria-label", s), this._genBtn.setAttribute("aria-expanded", String(n)), this._genDropdown ? this._genBtn.setAttribute("aria-controls", this._genDropdownId) : this._genBtn.removeAttribute("aria-controls");
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
    for (const [n, s] of t) {
      const i = document.createElement("label");
      i.className = "mjr-mfv-gen-dropdown-row";
      const r = document.createElement("input");
      r.type = "checkbox", r.checked = this._genInfoSelections.has(n), r.addEventListener("change", () => {
        r.checked ? this._genInfoSelections.add(n) : this._genInfoSelections.delete(n), this._updateGenBtnUI(), this._refresh();
      });
      const l = document.createElement("span");
      l.textContent = s, i.appendChild(r), i.appendChild(l), e.appendChild(i);
    }
    return e;
  }
  _getGenFields(e) {
    var i, r, l, h;
    if (!e) return {};
    try {
      const o = e.geninfo ? { geninfo: e.geninfo } : e.metadata || e.metadata_raw || e, c = re(o) || null, d = {
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
      if (c && typeof c == "object") {
        c.prompt && (d.prompt = W(String(c.prompt))), c.seed != null && (d.seed = String(c.seed)), c.model && (d.model = Array.isArray(c.model) ? c.model.join(", ") : String(c.model)), Array.isArray(c.loras) && (d.lora = c.loras.map(
          (u) => typeof u == "string" ? u : (u == null ? void 0 : u.name) || (u == null ? void 0 : u.lora_name) || (u == null ? void 0 : u.model_name) || ""
        ).filter(Boolean).join(", ")), c.sampler && (d.sampler = String(c.sampler)), c.scheduler && (d.scheduler = String(c.scheduler)), c.cfg != null && (d.cfg = String(c.cfg)), c.steps != null && (d.step = String(c.steps)), !d.prompt && (o != null && o.prompt) && (d.prompt = W(String(o.prompt || "")));
        const m = e.generation_time_ms ?? ((i = e.metadata_raw) == null ? void 0 : i.generation_time_ms) ?? (o == null ? void 0 : o.generation_time_ms) ?? ((r = o == null ? void 0 : o.geninfo) == null ? void 0 : r.generation_time_ms) ?? 0;
        return m && Number.isFinite(Number(m)) && m > 0 && m < 864e5 && (d.genTime = (Number(m) / 1e3).toFixed(1) + "s"), d;
      }
    } catch (o) {
      (l = console.debug) == null || l.call(console, "[MFV] _getGenFields error:", o);
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
    n.prompt = W((t == null ? void 0 : t.prompt) || (t == null ? void 0 : t.text) || ""), n.seed = (t == null ? void 0 : t.seed) != null ? String(t.seed) : (t == null ? void 0 : t.noise_seed) != null ? String(t.noise_seed) : "", t != null && t.model ? n.model = Array.isArray(t.model) ? t.model.join(", ") : String(t.model) : n.model = (t == null ? void 0 : t.model_name) || "", n.lora = (t == null ? void 0 : t.lora) || (t == null ? void 0 : t.loras) || "", Array.isArray(n.lora) && (n.lora = n.lora.join(", ")), n.sampler = (t == null ? void 0 : t.sampler) || (t == null ? void 0 : t.sampler_name) || "", n.scheduler = (t == null ? void 0 : t.scheduler) || "", n.cfg = (t == null ? void 0 : t.cfg) != null ? String(t.cfg) : (t == null ? void 0 : t.cfg_scale) != null ? String(t.cfg_scale) : "", n.step = (t == null ? void 0 : t.steps) != null ? String(t.steps) : "";
    const s = e.generation_time_ms ?? ((h = e.metadata_raw) == null ? void 0 : h.generation_time_ms) ?? (t == null ? void 0 : t.generation_time_ms) ?? 0;
    return s && Number.isFinite(Number(s)) && s > 0 && s < 864e5 && (n.genTime = (Number(s) / 1e3).toFixed(1) + "s"), n;
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
    const n = document.createDocumentFragment(), s = [
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
    for (const i of s) {
      if (!this._genInfoSelections.has(i)) continue;
      const r = t[i] != null ? String(t[i]) : "";
      if (!r) continue;
      let l = i.charAt(0).toUpperCase() + i.slice(1);
      i === "lora" ? l = "LoRA" : i === "cfg" ? l = "CFG" : i === "genTime" && (l = "Gen Time");
      const h = document.createElement("div");
      h.dataset.field = i;
      const o = document.createElement("strong");
      if (o.textContent = `${l}: `, h.appendChild(o), i === "prompt")
        h.appendChild(document.createTextNode(r));
      else if (i === "genTime") {
        const c = parseFloat(r);
        let d = "#4CAF50";
        c >= 60 ? d = "#FF9800" : c >= 30 ? d = "#FFC107" : c >= 10 && (d = "#8BC34A");
        const m = document.createElement("span");
        m.style.color = d, m.style.fontWeight = "600", m.textContent = r, h.appendChild(m);
      } else
        h.appendChild(document.createTextNode(r));
      n.appendChild(h);
    }
    return n.childNodes.length > 0 ? n : null;
  }
  // ── Mode ──────────────────────────────────────────────────────────────────
  _notifyModeChanged() {
    var e, t, n;
    try {
      (t = (e = this._controller) == null ? void 0 : e.onModeChanged) == null || t.call(e, this._mode);
    } catch (s) {
      (n = console.debug) == null || n.call(console, s);
    }
  }
  _cycleMode() {
    const e = [g.SIMPLE, g.AB, g.SIDE, g.GRID];
    this._mode = e[(e.indexOf(this._mode) + 1) % e.length], this._updateModeBtnUI(), this._refresh(), this._notifyModeChanged();
  }
  setMode(e) {
    Object.values(g).includes(e) && (this._mode = e, this._updateModeBtnUI(), this._refresh(), this._notifyModeChanged());
  }
  getPinnedSlots() {
    return this._pinnedSlots;
  }
  _updatePinUI() {
    if (this._pinBtns)
      for (const e of ["A", "B", "C", "D"]) {
        const t = this._pinBtns[e];
        if (!t) continue;
        const n = this._pinnedSlots.has(e);
        t.classList.toggle("is-pinned", n), t.setAttribute("aria-pressed", String(n)), t.title = n ? `Unpin ${e}` : `Pin ${e}`;
      }
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
    }, { icon: t = "pi-image", label: n = "" } = e[this._mode] || {}, s = $(n, Ie), i = document.createElement("i");
    i.className = `pi ${t}`, i.setAttribute("aria-hidden", "true"), this._modeBtn.replaceChildren(i), this._modeBtn.title = s, this._modeBtn.setAttribute("aria-label", s), this._modeBtn.removeAttribute("aria-pressed");
  }
  // ── Live Stream UI ────────────────────────────────────────────────────────
  setLiveActive(e) {
    if (!this._liveBtn) return;
    const t = !!e;
    this._liveBtn.classList.toggle("mjr-live-active", t);
    const n = t ? E("tooltip.liveStreamOn", "Live Stream: ON — click to disable") : E("tooltip.liveStreamOff", "Live Stream: OFF — click to follow"), s = $(n, Q);
    if (this._liveBtn.setAttribute("aria-pressed", String(t)), this._liveBtn.setAttribute("aria-label", s), t) {
      const i = document.createElement("i");
      i.className = "pi pi-circle-fill", i.setAttribute("aria-hidden", "true"), this._liveBtn.replaceChildren(i), this._liveBtn.title = s;
    } else {
      const i = document.createElement("i");
      i.className = "pi pi-circle", i.setAttribute("aria-hidden", "true"), this._liveBtn.replaceChildren(i), this._liveBtn.title = s;
    }
  }
  // ── KSampler Preview Stream UI ─────────────────────────────────────────────
  setPreviewActive(e) {
    if (this._previewActive = !!e, !this._previewBtn) return;
    this._previewBtn.classList.toggle("mjr-preview-active", this._previewActive);
    const t = this._previewActive ? E("tooltip.previewStreamOn", "KSampler Preview: ON — streaming denoising steps") : E(
      "tooltip.previewStreamOff",
      "KSampler Preview: OFF — click to stream denoising steps"
    ), n = $(t, ee);
    if (this._previewBtn.setAttribute("aria-pressed", String(this._previewActive)), this._previewBtn.setAttribute("aria-label", n), this._previewActive) {
      const s = document.createElement("i");
      s.className = "pi pi-eye", s.setAttribute("aria-hidden", "true"), this._previewBtn.replaceChildren(s), this._previewBtn.title = n;
    } else {
      const s = document.createElement("i");
      s.className = "pi pi-eye-slash", s.setAttribute("aria-hidden", "true"), this._previewBtn.replaceChildren(s), this._previewBtn.title = n, this._revokePreviewBlob();
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
      const i = this.getPinnedSlots();
      if (this._mode === g.GRID) {
        const r = ["A", "B", "C", "D"].find((l) => !i.has(l)) || "A";
        this[`_media${r}`] = n;
      } else i.has("B") ? this._mediaA = n : this._mediaB = n;
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
    if (this._mediaA = e || null, this._resetMfvZoom(), t && this._mode !== g.SIMPLE && (this._mode = g.SIMPLE, this._updateModeBtnUI()), this._mediaA && typeof R == "function") {
      const n = ++this._refreshGen;
      (async () => {
        var s;
        try {
          const i = await R(this._mediaA, {
            getAssetMetadata: q,
            getFileMetadataScoped: X
          });
          if (this._refreshGen !== n) return;
          i && typeof i == "object" && (this._mediaA = i, this._refresh());
        } catch (i) {
          (s = console.debug) == null || s.call(console, "[MFV] metadata enrich error", i);
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
    const n = ++this._refreshGen, s = async (i) => {
      if (!i) return i;
      try {
        return await R(i, {
          getAssetMetadata: q,
          getFileMetadataScoped: X
        }) || i;
      } catch {
        return i;
      }
    };
    (async () => {
      const [i, r] = await Promise.all([s(this._mediaA), s(this._mediaB)]);
      this._refreshGen === n && (this._mediaA = i || null, this._mediaB = r || null, this._refresh());
    })();
  }
  /**
   * Load up to 4 assets for grid compare mode.
   * Auto-switches to GRID mode if not already.
   */
  loadMediaQuad(e, t, n, s) {
    this._mediaA = e || null, this._mediaB = t || null, this._mediaC = n || null, this._mediaD = s || null, this._resetMfvZoom(), this._mode !== g.GRID && (this._mode = g.GRID, this._updateModeBtnUI());
    const i = ++this._refreshGen, r = async (l) => {
      if (!l) return l;
      try {
        return await R(l, {
          getAssetMetadata: q,
          getFileMetadataScoped: X
        }) || l;
      } catch {
        return l;
      }
    };
    (async () => {
      const [l, h, o, c] = await Promise.all([
        r(this._mediaA),
        r(this._mediaB),
        r(this._mediaC),
        r(this._mediaD)
      ]);
      this._refreshGen === i && (this._mediaA = l || null, this._mediaB = h || null, this._mediaC = o || null, this._mediaD = c || null, this._refresh());
    })();
  }
  // ── Pan/Zoom ──────────────────────────────────────────────────────────────
  _resetMfvZoom() {
    this._zoom = 1, this._panX = 0, this._panY = 0;
  }
  /** Apply current zoom+pan state to all media elements (img/video only — divider/overlays unaffected). */
  _applyTransform() {
    if (!this._contentEl) return;
    const e = Math.max(Y, Math.min(Z, this._zoom)), t = this._contentEl.clientWidth || 0, n = this._contentEl.clientHeight || 0, s = Math.max(0, (e - 1) * t / 2), i = Math.max(0, (e - 1) * n / 2);
    this._panX = Math.max(-s, Math.min(s, this._panX)), this._panY = Math.max(-i, Math.min(i, this._panY));
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
    const s = Math.max(Y, Math.min(Z, this._zoom)), i = Math.max(Y, Math.min(Z, Number(e) || 1));
    if (t != null && n != null && this._contentEl) {
      const r = i / s, l = this._contentEl.getBoundingClientRect(), h = t - (l.left + l.width / 2), o = n - (l.top + l.height / 2);
      this._panX = this._panX * r + (1 - r) * h, this._panY = this._panY * r + (1 - r) * o;
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
      (o) => {
        var u, _;
        if ((_ = (u = o.target) == null ? void 0 : u.closest) != null && _.call(u, "audio") || K(o.target)) return;
        const c = je(o.target, e);
        if (c && Te(
          c,
          Number(o.deltaX || 0),
          Number(o.deltaY || 0)
        ))
          return;
        o.preventDefault();
        const m = 1 - (o.deltaY || o.deltaX || 0) * Se;
        this._setMfvZoom(this._zoom * m, o.clientX, o.clientY);
      },
      { ...t, passive: !1 }
    );
    let n = !1, s = 0, i = 0, r = 0, l = 0;
    e.addEventListener(
      "pointerdown",
      (o) => {
        var c, d, m, u, _, p, f;
        if (!(o.button !== 0 && o.button !== 1) && !(this._zoom <= 1.01) && !((d = (c = o.target) == null ? void 0 : c.closest) != null && d.call(c, "video")) && !((u = (m = o.target) == null ? void 0 : m.closest) != null && u.call(m, "audio")) && !((p = (_ = o.target) == null ? void 0 : _.closest) != null && p.call(_, ".mjr-mfv-ab-divider")) && !K(o.target)) {
          o.preventDefault(), n = !0, this._dragging = !0, s = o.clientX, i = o.clientY, r = this._panX, l = this._panY;
          try {
            e.setPointerCapture(o.pointerId);
          } catch (v) {
            (f = console.debug) == null || f.call(console, v);
          }
          this._applyTransform();
        }
      },
      t
    ), e.addEventListener(
      "pointermove",
      (o) => {
        n && (this._panX = r + (o.clientX - s), this._panY = l + (o.clientY - i), this._applyTransform());
      },
      t
    );
    const h = (o) => {
      var c;
      if (n) {
        n = !1, this._dragging = !1;
        try {
          e.releasePointerCapture(o.pointerId);
        } catch (d) {
          (c = console.debug) == null || c.call(console, d);
        }
        this._applyTransform();
      }
    };
    e.addEventListener("pointerup", h, t), e.addEventListener("pointercancel", h, t), e.addEventListener(
      "dblclick",
      (o) => {
        var d, m, u, _;
        if ((m = (d = o.target) == null ? void 0 : d.closest) != null && m.call(d, "video") || (_ = (u = o.target) == null ? void 0 : u.closest) != null && _.call(u, "audio") || K(o.target)) return;
        const c = Math.abs(this._zoom - 1) < 0.05;
        this._setMfvZoom(c ? Math.min(4, this._zoom * 4) : 1, o.clientX, o.clientY);
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
    } catch (s) {
      (n = console.debug) == null || n.call(console, s);
    }
    this._compareSyncAC = null;
  }
  _initCompareSync() {
    var e;
    if (this._destroyCompareSync(), !!this._contentEl && this._mode !== g.SIMPLE)
      try {
        const t = Array.from(this._contentEl.querySelectorAll("video, audio"));
        if (t.length < 2) return;
        const n = t[0] || null, s = t.slice(1);
        if (!n || !s.length) return;
        this._compareSyncAC = ae(n, s, { threshold: 0.08 });
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
      this._contentEl.appendChild(I());
      return;
    }
    const e = L(this._mediaA), t = G(this._mediaA);
    if (!t) {
      this._contentEl.appendChild(I("Could not load media"));
      return;
    }
    const n = document.createElement("div");
    if (n.className = "mjr-mfv-simple-container", n.appendChild(t), e !== "audio") {
      const s = this._buildGenInfoDOM(this._mediaA);
      if (s) {
        const i = document.createElement("div");
        i.className = "mjr-mfv-geninfo", i.appendChild(s), n.appendChild(i);
      }
    }
    this._contentEl.appendChild(n);
  }
  _renderAB() {
    var p;
    const e = this._mediaA ? G(this._mediaA, { fill: !0 }) : null, t = this._mediaB ? G(this._mediaB, { fill: !0 }) : null, n = this._mediaA ? L(this._mediaA) : "", s = this._mediaB ? L(this._mediaB) : "";
    if (!e && !t) {
      this._contentEl.appendChild(I("Select 2 assets for A/B compare"));
      return;
    }
    if (!t) {
      this._renderSimple();
      return;
    }
    if (n === "audio" || s === "audio" || n === "model3d" || s === "model3d") {
      this._renderSide();
      return;
    }
    const i = document.createElement("div");
    i.className = "mjr-mfv-ab-container";
    const r = document.createElement("div");
    r.className = "mjr-mfv-ab-layer", e && r.appendChild(e);
    const l = document.createElement("div");
    l.className = "mjr-mfv-ab-layer mjr-mfv-ab-layer--b";
    const h = Math.round(this._abDividerX * 100);
    l.style.clipPath = `inset(0 0 0 ${h}%)`, l.appendChild(t);
    const o = document.createElement("div");
    o.className = "mjr-mfv-ab-divider", o.style.left = `${h}%`;
    const c = this._buildGenInfoDOM(this._mediaA);
    let d = null;
    c && (d = document.createElement("div"), d.className = "mjr-mfv-geninfo-a", d.appendChild(c), d.style.right = `calc(${100 - h}% + 8px)`);
    const m = this._buildGenInfoDOM(this._mediaB);
    let u = null;
    m && (u = document.createElement("div"), u.className = "mjr-mfv-geninfo-b", u.appendChild(m), u.style.left = `calc(${h}% + 8px)`);
    let _ = null;
    o.addEventListener(
      "pointerdown",
      (f) => {
        f.preventDefault(), o.setPointerCapture(f.pointerId);
        try {
          _ == null || _.abort();
        } catch {
        }
        _ = new AbortController();
        const v = _.signal, y = i.getBoundingClientRect(), b = (M) => {
          const w = Math.max(0.02, Math.min(0.98, (M.clientX - y.left) / y.width));
          this._abDividerX = w;
          const S = Math.round(w * 100);
          l.style.clipPath = `inset(0 0 0 ${S}%)`, o.style.left = `${S}%`, d && (d.style.right = `calc(${100 - S}% + 8px)`), u && (u.style.left = `calc(${S}% + 8px)`);
        }, A = () => {
          try {
            _ == null || _.abort();
          } catch {
          }
        };
        o.addEventListener("pointermove", b, { signal: v }), o.addEventListener("pointerup", A, { signal: v });
      },
      (p = this._panelAC) != null && p.signal ? { signal: this._panelAC.signal } : void 0
    ), i.appendChild(r), i.appendChild(l), i.appendChild(o), d && i.appendChild(d), u && i.appendChild(u), i.appendChild(T("A", "left")), i.appendChild(T("B", "right")), this._contentEl.appendChild(i);
  }
  _renderSide() {
    const e = this._mediaA ? G(this._mediaA) : null, t = this._mediaB ? G(this._mediaB) : null, n = this._mediaA ? L(this._mediaA) : "", s = this._mediaB ? L(this._mediaB) : "";
    if (!e && !t) {
      this._contentEl.appendChild(I("Select 2 assets for Side-by-Side"));
      return;
    }
    const i = document.createElement("div");
    i.className = "mjr-mfv-side-container";
    const r = document.createElement("div");
    r.className = "mjr-mfv-side-panel", e ? r.appendChild(e) : r.appendChild(I("—")), r.appendChild(T("A", "left"));
    const l = n === "audio" ? null : this._buildGenInfoDOM(this._mediaA);
    if (l) {
      const c = document.createElement("div");
      c.className = "mjr-mfv-geninfo-a", c.appendChild(l), r.appendChild(c);
    }
    const h = document.createElement("div");
    h.className = "mjr-mfv-side-panel", t ? h.appendChild(t) : h.appendChild(I("—")), h.appendChild(T("B", "right"));
    const o = s === "audio" ? null : this._buildGenInfoDOM(this._mediaB);
    if (o) {
      const c = document.createElement("div");
      c.className = "mjr-mfv-geninfo-b", c.appendChild(o), h.appendChild(c);
    }
    i.appendChild(r), i.appendChild(h), this._contentEl.appendChild(i);
  }
  _renderGrid() {
    const e = [
      { media: this._mediaA, label: "A" },
      { media: this._mediaB, label: "B" },
      { media: this._mediaC, label: "C" },
      { media: this._mediaD, label: "D" }
    ];
    if (!e.filter((s) => s.media).length) {
      this._contentEl.appendChild(I("Select up to 4 assets for Grid Compare"));
      return;
    }
    const n = document.createElement("div");
    n.className = "mjr-mfv-grid-container";
    for (const { media: s, label: i } of e) {
      const r = document.createElement("div");
      if (r.className = "mjr-mfv-grid-cell", s) {
        const l = L(s), h = G(s);
        if (h ? r.appendChild(h) : r.appendChild(I("—")), r.appendChild(
          T(i, i === "A" || i === "C" ? "left" : "right")
        ), l !== "audio") {
          const o = this._buildGenInfoDOM(s);
          if (o) {
            const c = document.createElement("div");
            c.className = `mjr-mfv-geninfo-${i.toLowerCase()}`, c.appendChild(o), r.appendChild(c);
          }
        }
      } else
        r.appendChild(I("—")), r.appendChild(
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
    this.element && (this._destroyPanZoom(), this._destroyCompareSync(), this._stopEdgeResize(), this._closeGenDropdown(), Ge(this.element), this.element.classList.remove("is-visible"), this.element.setAttribute("aria-hidden", "true"), this.isVisible = !1);
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
    const s = this._desktopExpandRestore;
    this._desktopExpanded = !1, n.classList.remove("mjr-mfv--desktop-expanded"), (s == null ? void 0 : s.styleAttr) == null || s.styleAttr === "" ? n.removeAttribute("style") : n.setAttribute("style", s.styleAttr), s != null && s.parent && s.parent.isConnected && (s.nextSibling && s.nextSibling.parentNode === s.parent ? s.parent.insertBefore(n, s.nextSibling) : s.parent.appendChild(n)), this._desktopExpandRestore = null, this._resetGenDropdownForCurrentDocument(), this._rebindControlHandlers(), this._bindPanelInteractions(), this._bindDocumentUiHandlers(), this._updatePopoutBtnUI(), C("electron-in-app-restored", null);
  }
  _activateDesktopExpandedFallback(e) {
    var t;
    this._desktopPopoutUnsupported = !0, C(
      "electron-in-app-fallback",
      { message: (e == null ? void 0 : e.message) || String(e || "unknown error") },
      "warn"
    ), this._setDesktopExpanded(!0);
    try {
      le(
        E(
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
  _tryElectronPopupFallback(e, t, n, s) {
    return C(
      "electron-popup-fallback-attempt",
      { reason: (s == null ? void 0 : s.message) || String(s || "unknown") },
      "warn"
    ), this._fallbackPopout(e, t, n), this._popoutWindow ? (this._desktopPopoutUnsupported = !1, C("electron-popup-fallback-opened", null), !0) : !1;
  }
  /**
   * Move the viewer into a separate browser window so it can be
   * dragged onto a second monitor. Opens a dedicated same-origin page,
   * then adopts the live DOM tree into that page so state/listeners persist.
   */
  popOut() {
    var l, h;
    if (this._isPopped || !this.element) return;
    const e = this.element;
    this._stopEdgeResize();
    const t = xe(), n = typeof window < "u" && "documentPictureInPicture" in window, s = String(((l = window == null ? void 0 : window.navigator) == null ? void 0 : l.userAgent) || ((h = globalThis == null ? void 0 : globalThis.navigator) == null ? void 0 : h.userAgent) || ""), i = Math.max(e.offsetWidth || 520, 400), r = Math.max(e.offsetHeight || 420, 300);
    if (C("start", {
      isElectronHost: t,
      hasDocumentPiP: n,
      userAgent: s,
      width: i,
      height: r,
      desktopPopoutUnsupported: this._desktopPopoutUnsupported
    }), t && this._desktopPopoutUnsupported) {
      C("electron-in-app-fallback-reuse", null), this._setDesktopExpanded(!0);
      return;
    }
    if (!(t && (C("electron-popup-request", { width: i, height: r }), this._tryElectronPopupFallback(e, i, r, new Error("Desktop popup requested"))))) {
      if (t && "documentPictureInPicture" in window) {
        C("electron-pip-request", { width: i, height: r }), window.documentPictureInPicture.requestWindow({ width: i, height: r }).then((o) => {
          var _, p;
          C("electron-pip-opened", {
            hasDocument: !!(o != null && o.document)
          }), this._popoutWindow = o, this._isPopped = !0, this._popoutRestoreGuard = !1;
          try {
            (_ = this._popoutAC) == null || _.abort();
          } catch (f) {
            (p = console.debug) == null || p.call(console, f);
          }
          this._popoutAC = new AbortController();
          const c = this._popoutAC.signal, d = () => this._schedulePopInFromPopupClose();
          this._popoutCloseHandler = d;
          const m = o.document;
          m.title = "Majoor Viewer", this._installPopoutStyles(m), m.body.style.cssText = "margin:0;display:flex;min-height:100vh;background:#111;overflow:hidden;";
          const u = m.createElement("div");
          u.id = "mjr-mfv-popout-root", u.style.cssText = "flex:1;min-width:0;min-height:0;display:flex;", m.body.appendChild(u);
          try {
            const f = typeof m.adoptNode == "function" ? m.adoptNode(e) : e;
            u.appendChild(f), C("electron-pip-adopted", {
              usedAdoptNode: typeof m.adoptNode == "function"
            });
          } catch (f) {
            C(
              "electron-pip-adopt-failed",
              { message: (f == null ? void 0 : f.message) || String(f) },
              "warn"
            ), console.warn("[MFV] PiP adoptNode failed", f), this._isPopped = !1, this._popoutWindow = null;
            try {
              o.close();
            } catch {
            }
            this._activateDesktopExpandedFallback(f);
            return;
          }
          e.classList.add("is-visible"), this.isVisible = !0, this._resetGenDropdownForCurrentDocument(), this._rebindControlHandlers(), this._bindDocumentUiHandlers(), this._updatePopoutBtnUI(), C("electron-pip-ready", { isPopped: this._isPopped }), o.addEventListener("pagehide", d, {
            signal: c
          }), this._startPopoutCloseWatch(), this._popoutKeydownHandler = (f) => {
            var y, b;
            const v = String(((y = f == null ? void 0 : f.target) == null ? void 0 : y.tagName) || "").toLowerCase();
            f != null && f.defaultPrevented || (b = f == null ? void 0 : f.target) != null && b.isContentEditable || v === "input" || v === "textarea" || v === "select" || this._forwardKeydownToController(f);
          }, o.addEventListener("keydown", this._popoutKeydownHandler, {
            signal: c
          });
        }).catch((o) => {
          C(
            "electron-pip-request-failed",
            { message: (o == null ? void 0 : o.message) || String(o) },
            "warn"
          ), this._activateDesktopExpandedFallback(o);
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
    var d, m, u, _;
    C("browser-popup-open", { width: t, height: n });
    const s = (window.screenX || window.screenLeft) + Math.round((window.outerWidth - t) / 2), i = (window.screenY || window.screenTop) + Math.round((window.outerHeight - n) / 2), r = `width=${t},height=${n},left=${s},top=${i},resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,status=no`, l = window.open("about:blank", "_mjr_viewer", r);
    if (!l) {
      C("browser-popup-blocked", null, "warn"), console.warn("[MFV] Pop-out blocked — allow popups for this site.");
      return;
    }
    C("browser-popup-opened", { hasDocument: !!(l != null && l.document) }), this._popoutWindow = l, this._isPopped = !0, this._popoutRestoreGuard = !1;
    try {
      (d = this._popoutAC) == null || d.abort();
    } catch (p) {
      (m = console.debug) == null || m.call(console, p);
    }
    this._popoutAC = new AbortController();
    const h = this._popoutAC.signal, o = () => this._schedulePopInFromPopupClose();
    this._popoutCloseHandler = o;
    const c = () => {
      let p;
      try {
        p = l.document;
      } catch {
        return;
      }
      if (!p) return;
      p.title = "Majoor Viewer", this._installPopoutStyles(p), p.body.style.cssText = "margin:0;display:flex;min-height:100vh;background:#111;overflow:hidden;";
      const f = p.createElement("div");
      f.id = "mjr-mfv-popout-root", f.style.cssText = "flex:1;min-width:0;min-height:0;display:flex;", p.body.appendChild(f);
      try {
        f.appendChild(p.adoptNode(e));
      } catch (v) {
        console.warn("[MFV] adoptNode failed", v);
        return;
      }
      e.classList.add("is-visible"), this.isVisible = !0, this._resetGenDropdownForCurrentDocument(), this._rebindControlHandlers(), this._bindDocumentUiHandlers(), this._updatePopoutBtnUI();
    };
    try {
      c();
    } catch (p) {
      (u = console.debug) == null || u.call(console, "[MFV] immediate mount failed, retrying on load", p);
      try {
        l.addEventListener("load", c, { signal: h });
      } catch (f) {
        (_ = console.debug) == null || _.call(console, "[MFV] pop-out page load listener failed", f);
      }
    }
    l.addEventListener("beforeunload", o, { signal: h }), l.addEventListener("pagehide", o, { signal: h }), l.addEventListener("unload", o, { signal: h }), this._startPopoutCloseWatch(), this._popoutKeydownHandler = (p) => {
      var y, b, A, M;
      const f = String(((y = p == null ? void 0 : p.target) == null ? void 0 : y.tagName) || "").toLowerCase();
      if (p != null && p.defaultPrevented || (b = p == null ? void 0 : p.target) != null && b.isContentEditable || f === "input" || f === "textarea" || f === "select")
        return;
      if (String((p == null ? void 0 : p.key) || "").toLowerCase() === "v" && (p != null && p.ctrlKey || p != null && p.metaKey) && !(p != null && p.altKey) && !(p != null && p.shiftKey)) {
        p.preventDefault(), (A = p.stopPropagation) == null || A.call(p), (M = p.stopImmediatePropagation) == null || M.call(p), this._dispatchControllerAction("toggle", j.MFV_TOGGLE);
        return;
      }
      this._forwardKeydownToController(p);
    }, l.addEventListener("keydown", this._popoutKeydownHandler, { signal: h });
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
    var n, s;
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
        (s = console.debug) == null || s.call(console, r);
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
    var s, i, r, l;
    if (this._desktopExpanded) {
      this._setDesktopExpanded(!1);
      return;
    }
    if (!this._isPopped || !this.element) return;
    const t = this._popoutWindow;
    this._clearPopoutCloseWatch();
    try {
      (s = this._popoutAC) == null || s.abort();
    } catch (h) {
      (i = console.debug) == null || i.call(console, h);
    }
    this._popoutAC = null, this._popoutCloseHandler = null, this._popoutKeydownHandler = null, this._isPopped = !1;
    let n = this.element;
    try {
      n = (n == null ? void 0 : n.ownerDocument) === document ? n : document.adoptNode(n);
    } catch (h) {
      (r = console.debug) == null || r.call(console, "[MFV] pop-in adopt failed", h);
    }
    if (document.body.appendChild(n), this._resetGenDropdownForCurrentDocument(), this._rebindControlHandlers(), this._bindPanelInteractions(), this._bindDocumentUiHandlers(), n.classList.add("is-visible"), n.setAttribute("aria-hidden", "false"), this.isVisible = !0, this._updatePopoutBtnUI(), e)
      try {
        t == null || t.close();
      } catch (h) {
        (l = console.debug) == null || l.call(console, h);
      }
    this._popoutWindow = null;
  }
  /** Toggle pop-out button icon between external-link (pop out) and sign-in (pop in). */
  _updatePopoutBtnUI() {
    if (!this._popoutBtn) return;
    const e = this._isPopped || this._desktopExpanded;
    this.element && this.element.classList.toggle("mjr-mfv--popped", e), this._popoutBtn.classList.toggle("mjr-popin-active", e);
    const t = this._popoutBtn.querySelector("i") || document.createElement("i"), n = e ? E("tooltip.popInViewer", "Return to floating panel") : E("tooltip.popOutViewer", "Pop out viewer to separate window");
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
    const s = e <= n.left + O, i = e >= n.right - O, r = t <= n.top + O, l = t >= n.bottom - O;
    return r && s ? "nw" : r && i ? "ne" : l && s ? "sw" : l && i ? "se" : r ? "n" : l ? "s" : s ? "w" : i ? "e" : "";
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
    const t = (h) => {
      if (!this.element || this._isPopped) return "";
      const o = this.element.getBoundingClientRect();
      return this._getResizeDirectionFromPoint(h.clientX, h.clientY, o);
    }, n = (l = this._panelAC) == null ? void 0 : l.signal, s = (h) => {
      var _;
      if (h.button !== 0 || !this.element || this._isPopped) return;
      const o = t(h);
      if (!o) return;
      h.preventDefault(), h.stopPropagation();
      const c = this.element.getBoundingClientRect(), d = window.getComputedStyle(this.element), m = Math.max(120, Number.parseFloat(d.minWidth) || 0), u = Math.max(100, Number.parseFloat(d.minHeight) || 0);
      this._resizeState = {
        pointerId: h.pointerId,
        dir: o,
        startX: h.clientX,
        startY: h.clientY,
        startLeft: c.left,
        startTop: c.top,
        startWidth: c.width,
        startHeight: c.height,
        minWidth: m,
        minHeight: u
      }, this.element.style.left = `${Math.round(c.left)}px`, this.element.style.top = `${Math.round(c.top)}px`, this.element.style.right = "auto", this.element.style.bottom = "auto", this.element.classList.add("mjr-mfv--resizing"), this.element.style.cursor = this._resizeCursorForDirection(o);
      try {
        this.element.setPointerCapture(h.pointerId);
      } catch (p) {
        (_ = console.debug) == null || _.call(console, p);
      }
    }, i = (h) => {
      if (!this.element || this._isPopped) return;
      const o = this._resizeState;
      if (!o) {
        const f = t(h);
        this.element.style.cursor = f ? this._resizeCursorForDirection(f) : "";
        return;
      }
      if (o.pointerId !== h.pointerId) return;
      const c = h.clientX - o.startX, d = h.clientY - o.startY;
      let m = o.startWidth, u = o.startHeight, _ = o.startLeft, p = o.startTop;
      o.dir.includes("e") && (m = o.startWidth + c), o.dir.includes("s") && (u = o.startHeight + d), o.dir.includes("w") && (m = o.startWidth - c, _ = o.startLeft + c), o.dir.includes("n") && (u = o.startHeight - d, p = o.startTop + d), m < o.minWidth && (o.dir.includes("w") && (_ -= o.minWidth - m), m = o.minWidth), u < o.minHeight && (o.dir.includes("n") && (p -= o.minHeight - u), u = o.minHeight), m = Math.min(m, Math.max(o.minWidth, window.innerWidth)), u = Math.min(u, Math.max(o.minHeight, window.innerHeight)), _ = Math.min(Math.max(0, _), Math.max(0, window.innerWidth - m)), p = Math.min(Math.max(0, p), Math.max(0, window.innerHeight - u)), this.element.style.width = `${Math.round(m)}px`, this.element.style.height = `${Math.round(u)}px`, this.element.style.left = `${Math.round(_)}px`, this.element.style.top = `${Math.round(p)}px`, this.element.style.right = "auto", this.element.style.bottom = "auto";
    }, r = (h) => {
      if (!this.element || !this._resizeState || this._resizeState.pointerId !== h.pointerId) return;
      const o = t(h);
      this._stopEdgeResize(), o && (this.element.style.cursor = this._resizeCursorForDirection(o));
    };
    e.addEventListener("pointerdown", s, { capture: !0, signal: n }), e.addEventListener("pointermove", i, { signal: n }), e.addEventListener("pointerup", r, { signal: n }), e.addEventListener("pointercancel", r, { signal: n }), e.addEventListener(
      "pointerleave",
      () => {
        !this._resizeState && this.element && (this.element.style.cursor = "");
      },
      { signal: n }
    );
  }
  // ── Drag ──────────────────────────────────────────────────────────────────
  _initDrag(e) {
    var s;
    if (!e) return;
    const t = (s = this._panelAC) == null ? void 0 : s.signal;
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
        const l = n.signal, h = this.element, o = h.getBoundingClientRect(), c = i.clientX - o.left, d = i.clientY - o.top, m = (_) => {
          const p = Math.min(
            window.innerWidth - h.offsetWidth,
            Math.max(0, _.clientX - c)
          ), f = Math.min(
            window.innerHeight - h.offsetHeight,
            Math.max(0, _.clientY - d)
          );
          h.style.left = `${p}px`, h.style.top = `${f}px`, h.style.right = "auto", h.style.bottom = "auto";
        }, u = () => {
          try {
            n == null || n.abort();
          } catch {
          }
        };
        e.addEventListener("pointermove", m, { signal: l }), e.addEventListener("pointerup", u, { signal: l });
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
  async _drawMediaFit(e, t, n, s, i, r, l) {
    var u, _, p, f, v;
    if (!t) return;
    const h = L(t);
    let o = null;
    if (h === "video" && (o = l instanceof HTMLVideoElement ? l : ((u = this._contentEl) == null ? void 0 : u.querySelector("video")) || null), !o && h === "model3d") {
      const y = (t == null ? void 0 : t.id) != null ? String(t.id) : "";
      y && (o = ((p = (_ = this._contentEl) == null ? void 0 : _.querySelector) == null ? void 0 : p.call(
        _,
        `.mjr-model3d-render-canvas[data-mjr-asset-id="${y}"]`
      )) || null), o || (o = ((v = (f = this._contentEl) == null ? void 0 : f.querySelector) == null ? void 0 : v.call(f, ".mjr-model3d-render-canvas")) || null);
    }
    if (!o) {
      const y = ie(t);
      if (!y) return;
      o = await new Promise((b) => {
        const A = new Image();
        A.crossOrigin = "anonymous", A.onload = () => b(A), A.onerror = () => b(null), A.src = y;
      });
    }
    if (!o) return;
    const c = o.videoWidth || o.naturalWidth || i, d = o.videoHeight || o.naturalHeight || r;
    if (!c || !d) return;
    const m = Math.min(i / c, r / d);
    e.drawImage(
      o,
      n + (i - c * m) / 2,
      s + (r - d * m) / 2,
      c * m,
      d * m
    );
  }
  /** Render the gen-info overlay onto the canvas region (ox, oy, w, h). */
  _estimateGenInfoOverlayHeight(e, t, n) {
    if (!e || !t || !this._genInfoSelections.size) return 0;
    const s = this._getGenFields(t), i = [
      "prompt",
      "seed",
      "model",
      "lora",
      "sampler",
      "scheduler",
      "cfg",
      "step",
      "genTime"
    ], r = 11, l = 16, h = 8, o = Math.max(100, Number(n || 0) - h * 2);
    let c = 0;
    for (const d of i) {
      if (!this._genInfoSelections.has(d)) continue;
      const m = s[d] != null ? String(s[d]) : "";
      if (!m) continue;
      let u = d.charAt(0).toUpperCase() + d.slice(1);
      d === "lora" ? u = "LoRA" : d === "cfg" ? u = "CFG" : d === "genTime" && (u = "Gen Time");
      const _ = `${u}: `;
      e.font = `bold ${r}px system-ui, sans-serif`;
      const p = e.measureText(_).width;
      e.font = `${r}px system-ui, sans-serif`;
      const f = Math.max(32, o - h * 2 - p);
      let v = 0, y = "";
      for (const b of m.split(" ")) {
        const A = y ? y + " " + b : b;
        e.measureText(A).width > f && y ? (v += 1, y = b) : y = A;
      }
      y && (v += 1), c += v;
    }
    return c > 0 ? c * l + h * 2 : 0;
  }
  _drawGenInfoOverlay(e, t, n, s, i, r) {
    if (!t || !this._genInfoSelections.size) return;
    const l = this._getGenFields(t), h = {
      prompt: "#7ec8ff",
      seed: "#ffd47a",
      model: "#7dda8a",
      lora: "#d48cff",
      sampler: "#ff9f7a",
      scheduler: "#ff7a9f",
      cfg: "#7a9fff",
      step: "#7affd4",
      genTime: "#e0ff7a"
    }, o = [
      "prompt",
      "seed",
      "model",
      "lora",
      "sampler",
      "scheduler",
      "cfg",
      "step",
      "genTime"
    ], c = [];
    for (const w of o) {
      if (!this._genInfoSelections.has(w)) continue;
      const S = l[w] != null ? String(l[w]) : "";
      if (!S) continue;
      let P = w.charAt(0).toUpperCase() + w.slice(1);
      w === "lora" ? P = "LoRA" : w === "cfg" ? P = "CFG" : w === "genTime" && (P = "Gen Time");
      const k = S;
      c.push({
        label: `${P}: `,
        value: k,
        color: h[w] || "#ffffff"
      });
    }
    if (!c.length) return;
    const d = 11, m = 16, u = 8, _ = Math.max(100, i - u * 2);
    e.save();
    const p = [];
    for (const { label: w, value: S, color: P } of c) {
      e.font = `bold ${d}px system-ui, sans-serif`;
      const k = e.measureText(w).width;
      e.font = `${d}px system-ui, sans-serif`;
      const x = _ - u * 2 - k, V = [];
      let N = "";
      for (const z of S.split(" ")) {
        const J = N ? N + " " + z : z;
        e.measureText(J).width > x && N ? (V.push(N), N = z) : N = J;
      }
      N && V.push(N), p.push({ label: w, labelW: k, lines: V, color: P });
    }
    const f = p, y = p.reduce((w, S) => w + S.lines.length, 0) * m + u * 2, b = n + u, A = s + r - y - u;
    e.globalAlpha = 0.72, e.fillStyle = "#000", se(e, b, A, _, y, 6), e.fill(), e.globalAlpha = 1;
    let M = A + u + d;
    for (const { label: w, labelW: S, lines: P, color: k } of f)
      for (let x = 0; x < P.length; x++)
        x === 0 ? (e.font = `bold ${d}px system-ui, sans-serif`, e.fillStyle = k, e.fillText(w, b + u, M), e.font = `${d}px system-ui, sans-serif`, e.fillStyle = "rgba(255,255,255,0.88)", e.fillText(P[x], b + u + S, M)) : (e.font = `${d}px system-ui, sans-serif`, e.fillStyle = "rgba(255,255,255,0.88)", e.fillText(P[x], b + u + S, M)), M += m;
    e.restore();
  }
  /** Capture the current view to PNG and trigger a browser download. */
  async _captureView() {
    var h;
    if (!this._contentEl) return;
    this._captureBtn && (this._captureBtn.disabled = !0, this._captureBtn.setAttribute("aria-label", E("tooltip.capturingView", "Capturing…")));
    const e = this._contentEl.clientWidth || 480, t = this._contentEl.clientHeight || 360;
    let n = t;
    if (this._mode === g.SIMPLE && this._mediaA && this._genInfoSelections.size) {
      const o = document.createElement("canvas");
      o.width = e, o.height = t;
      const c = o.getContext("2d"), d = this._estimateGenInfoOverlayHeight(c, this._mediaA, e);
      if (d > 0) {
        const m = Math.max(t, d + 24);
        n = Math.min(m, t * 4);
      }
    }
    const s = document.createElement("canvas");
    s.width = e, s.height = n;
    const i = s.getContext("2d");
    i.fillStyle = "#0d0d0d", i.fillRect(0, 0, e, n);
    try {
      if (this._mode === g.SIMPLE)
        this._mediaA && (await this._drawMediaFit(i, this._mediaA, 0, 0, e, t), this._drawGenInfoOverlay(i, this._mediaA, 0, 0, e, n));
      else if (this._mode === g.AB) {
        const o = Math.round(this._abDividerX * e), c = this._contentEl.querySelector(
          ".mjr-mfv-ab-layer:not(.mjr-mfv-ab-layer--b) video"
        ), d = this._contentEl.querySelector(".mjr-mfv-ab-layer--b video");
        this._mediaA && await this._drawMediaFit(i, this._mediaA, 0, 0, e, n, c), this._mediaB && (i.save(), i.beginPath(), i.rect(o, 0, e - o, n), i.clip(), await this._drawMediaFit(i, this._mediaB, 0, 0, e, n, d), i.restore()), i.save(), i.strokeStyle = "rgba(255,255,255,0.88)", i.lineWidth = 2, i.beginPath(), i.moveTo(o, 0), i.lineTo(o, n), i.stroke(), i.restore(), D(i, "A", 8, 8), D(i, "B", o + 8, 8), this._mediaA && this._drawGenInfoOverlay(i, this._mediaA, 0, 0, o, n), this._mediaB && this._drawGenInfoOverlay(i, this._mediaB, o, 0, e - o, n);
      } else if (this._mode === g.SIDE) {
        const o = Math.floor(e / 2), c = this._contentEl.querySelector(".mjr-mfv-side-panel:first-child video"), d = this._contentEl.querySelector(".mjr-mfv-side-panel:last-child video");
        this._mediaA && (await this._drawMediaFit(i, this._mediaA, 0, 0, o, n, c), this._drawGenInfoOverlay(i, this._mediaA, 0, 0, o, n)), i.fillStyle = "#111", i.fillRect(o, 0, 2, n), this._mediaB && (await this._drawMediaFit(i, this._mediaB, o, 0, o, n, d), this._drawGenInfoOverlay(i, this._mediaB, o, 0, o, n)), D(i, "A", 8, 8), D(i, "B", o + 8, 8);
      } else if (this._mode === g.GRID) {
        const o = Math.floor(e / 2), c = Math.floor(n / 2), d = 1, m = [
          { media: this._mediaA, label: "A", x: 0, y: 0, w: o - d, h: c - d },
          {
            media: this._mediaB,
            label: "B",
            x: o + d,
            y: 0,
            w: o - d,
            h: c - d
          },
          {
            media: this._mediaC,
            label: "C",
            x: 0,
            y: c + d,
            w: o - d,
            h: c - d
          },
          {
            media: this._mediaD,
            label: "D",
            x: o + d,
            y: c + d,
            w: o - d,
            h: c - d
          }
        ], u = this._contentEl.querySelectorAll(".mjr-mfv-grid-cell");
        for (let _ = 0; _ < m.length; _++) {
          const p = m[_], f = ((h = u[_]) == null ? void 0 : h.querySelector("video")) || null;
          p.media && (await this._drawMediaFit(i, p.media, p.x, p.y, p.w, p.h, f), this._drawGenInfoOverlay(i, p.media, p.x, p.y, p.w, p.h)), D(i, p.label, p.x + 8, p.y + 8);
        }
        i.save(), i.fillStyle = "#111", i.fillRect(o - d, 0, d * 2, n), i.fillRect(0, c - d, e, d * 2), i.restore();
      }
    } catch (o) {
      console.debug("[MFV] capture error:", o);
    }
    const l = `${{
      [g.AB]: "mfv-ab",
      [g.SIDE]: "mfv-side",
      [g.GRID]: "mfv-grid"
    }[this._mode] ?? "mfv"}-${Date.now()}.png`;
    try {
      const o = s.toDataURL("image/png"), c = document.createElement("a");
      c.href = o, c.download = l, document.body.appendChild(c), c.click(), setTimeout(() => document.body.removeChild(c), 100);
    } catch (o) {
      console.warn("[MFV] download failed:", o);
    } finally {
      this._captureBtn && (this._captureBtn.disabled = !1, this._captureBtn.setAttribute(
        "aria-label",
        E("tooltip.captureView", "Save view as image")
      ));
    }
  }
  // ── Lifecycle ─────────────────────────────────────────────────────────────
  dispose() {
    var e, t, n, s, i, r, l, h, o, c, d, m, u, _, p, f, v, y;
    this._destroyPanZoom(), this._destroyCompareSync(), this._stopEdgeResize(), this._clearPopoutCloseWatch();
    try {
      (e = this._panelAC) == null || e.abort(), this._panelAC = null;
    } catch (b) {
      (t = console.debug) == null || t.call(console, b);
    }
    try {
      (n = this._btnAC) == null || n.abort(), this._btnAC = null;
    } catch (b) {
      (s = console.debug) == null || s.call(console, b);
    }
    try {
      (i = this._docAC) == null || i.abort(), this._docAC = null;
    } catch (b) {
      (r = console.debug) == null || r.call(console, b);
    }
    try {
      (l = this._popoutAC) == null || l.abort(), this._popoutAC = null;
    } catch (b) {
      (h = console.debug) == null || h.call(console, b);
    }
    try {
      (o = this._panzoomAC) == null || o.abort(), this._panzoomAC = null;
    } catch (b) {
      (c = console.debug) == null || c.call(console, b);
    }
    try {
      (m = (d = this._compareSyncAC) == null ? void 0 : d.abort) == null || m.call(d), this._compareSyncAC = null;
    } catch (b) {
      (u = console.debug) == null || u.call(console, b);
    }
    try {
      this._isPopped && this.popIn();
    } catch (b) {
      (_ = console.debug) == null || _.call(console, b);
    }
    this._revokePreviewBlob(), this._onSidebarPosChanged && (window.removeEventListener("mjr-settings-changed", this._onSidebarPosChanged), this._onSidebarPosChanged = null);
    try {
      (p = this.element) == null || p.remove();
    } catch (b) {
      (f = console.debug) == null || f.call(console, b);
    }
    this.element = null, this._contentEl = null, this._closeBtn = null, this._modeBtn = null, this._pinGroup = null, this._pinBtns = null, this._liveBtn = null, this._nodeStreamBtn = null, this._popoutBtn = null, this._captureBtn = null, this._unbindDocumentUiHandlers();
    try {
      (v = this._genDropdown) == null || v.remove();
    } catch (b) {
      (y = console.debug) == null || y.call(console, b);
    }
    this._mediaA = null, this._mediaB = null, this._mediaC = null, this._mediaD = null, this.isVisible = !1;
  }
}
export {
  Fe as FloatingViewer,
  g as MFV_MODES
};
