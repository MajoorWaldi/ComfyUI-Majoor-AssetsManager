import { M as st, c as it, p as at, q as lt, A as v, t as U, u as B, v as rt, x as O, E as V, n as dt, s as $, y as Y, z as ct, B as Z, C as J, d as X, D as ut } from "./entry-DbbM33pI.js";
import { ensureViewerMetadataAsset as H } from "./genInfo-Dq4b7oGT.js";
const b = Object.freeze({
  SIMPLE: "simple",
  AB: "ab",
  SIDE: "side",
  GRID: "grid"
}), q = 0.25, K = 8, pt = 8e-4, R = 8, mt = "C", tt = "L", et = "K", ht = "N", ft = "Esc", _t = /* @__PURE__ */ new Set([".mp4", ".webm", ".mov", ".avi", ".mkv"]), gt = /* @__PURE__ */ new Set([".mp3", ".wav", ".flac", ".ogg", ".m4a", ".aac", ".opus", ".wma"]);
function bt(t) {
  try {
    const e = String(t || "").trim(), n = e.lastIndexOf(".");
    return n >= 0 ? e.slice(n).toLowerCase() : "";
  } catch {
    return "";
  }
}
function L(t) {
  const e = String((t == null ? void 0 : t.kind) || "").toLowerCase();
  if (e === "video") return "video";
  if (e === "audio") return "audio";
  if (e === "model3d") return "model3d";
  const n = bt((t == null ? void 0 : t.filename) || "");
  return n === ".gif" ? "gif" : _t.has(n) ? "video" : gt.has(n) ? "audio" : st.has(n) ? "model3d" : "image";
}
function nt(t) {
  return t ? t.url ? String(t.url) : t.filename && t.id == null ? at(t.filename, t.subfolder || "", t.type || "output") : t.filename && lt(t) || "" : "";
}
function N(t = "No media — select assets in the grid") {
  const e = document.createElement("div");
  return e.className = "mjr-mfv-empty", e.textContent = t, e;
}
function k(t, e) {
  const n = document.createElement("div");
  return n.className = `mjr-mfv-label label-${e}`, n.textContent = t, n;
}
function w(t) {
  var e;
  if (!(!t || typeof t.play != "function"))
    try {
      const n = t.play();
      n && typeof n.catch == "function" && n.catch(() => {
      });
    } catch (n) {
      (e = console.debug) == null || e.call(console, n);
    }
}
function yt(t, e) {
  var o, i;
  let n = t && t.nodeType === 1 ? t : (t == null ? void 0 : t.parentElement) || null;
  for (; n && n !== e; ) {
    try {
      const s = (o = window.getComputedStyle) == null ? void 0 : o.call(window, n), l = /(auto|scroll|overlay)/.test(String((s == null ? void 0 : s.overflowY) || "")), d = /(auto|scroll|overlay)/.test(String((s == null ? void 0 : s.overflowX) || ""));
      if (l || d)
        return n;
    } catch (s) {
      (i = console.debug) == null || i.call(console, s);
    }
    n = n.parentElement || null;
  }
  return null;
}
function Ct(t, e, n) {
  if (!t) return !1;
  if (Math.abs(Number(n) || 0) >= Math.abs(Number(e) || 0)) {
    const s = Number(t.scrollTop || 0), l = Math.max(0, Number(t.scrollHeight || 0) - Number(t.clientHeight || 0));
    if (n < 0 && s > 0 || n > 0 && s < l) return !0;
  }
  const o = Number(t.scrollLeft || 0), i = Math.max(0, Number(t.scrollWidth || 0) - Number(t.clientWidth || 0));
  return e < 0 && o > 0 || e > 0 && o < i;
}
function Et(t) {
  var e, n, o, i;
  if (t)
    try {
      const s = (e = t.querySelectorAll) == null ? void 0 : e.call(t, "video, audio");
      if (!s || !s.length) return;
      for (const l of s)
        try {
          (n = l.pause) == null || n.call(l);
        } catch (d) {
          (o = console.debug) == null || o.call(console, d);
        }
    } catch (s) {
      (i = console.debug) == null || i.call(console, s);
    }
}
function j(t, { fill: e = !1 } = {}) {
  var l;
  const n = nt(t);
  if (!n) return null;
  const o = L(t), i = `mjr-mfv-media mjr-mfv-media--fit-height${e ? " mjr-mfv-media--fill" : ""}`;
  if (o === "audio") {
    const d = document.createElement("div");
    d.className = `mjr-mfv-audio-card${e ? " mjr-mfv-audio-card--fill" : ""}`;
    const u = document.createElement("div");
    u.className = "mjr-mfv-audio-head";
    const a = document.createElement("i");
    a.className = "pi pi-volume-up mjr-mfv-audio-icon", a.setAttribute("aria-hidden", "true");
    const c = document.createElement("div");
    c.className = "mjr-mfv-audio-title", c.textContent = String((t == null ? void 0 : t.filename) || "Audio"), u.appendChild(a), u.appendChild(c);
    const r = document.createElement("audio");
    r.className = "mjr-mfv-audio-player", r.src = n, r.controls = !0, r.autoplay = !0, r.preload = "metadata";
    try {
      r.addEventListener("loadedmetadata", () => w(r), { once: !0 });
    } catch (h) {
      (l = console.debug) == null || l.call(console, h);
    }
    return w(r), d.appendChild(u), d.appendChild(r), d;
  }
  if (o === "video") {
    const d = document.createElement("video");
    return d.className = i, d.src = n, d.controls = !0, d.loop = !0, d.muted = !0, d.autoplay = !0, d.playsInline = !0, d;
  }
  if (o === "model3d")
    return it(t, n, {
      hostClassName: `mjr-model3d-host mjr-mfv-model3d-host${e ? " mjr-mfv-model3d-host--fill" : ""}`,
      canvasClassName: `mjr-mfv-media mjr-model3d-render-canvas${e ? " mjr-mfv-media--fill" : ""}`,
      hintText: "Rotate: left drag  Pan: right drag  Zoom: wheel or middle drag",
      disableViewerTransform: !0,
      pauseDuringExecution: !!v.FLOATING_VIEWER_PAUSE_DURING_EXECUTION
    });
  const s = document.createElement("img");
  return s.className = i, s.src = n, s.alt = String((t == null ? void 0 : t.filename) || ""), s.draggable = !1, s;
}
function ot(t, e, n, o, i, s) {
  t.beginPath(), typeof t.roundRect == "function" ? t.roundRect(e, n, o, i, s) : (t.moveTo(e + s, n), t.lineTo(e + o - s, n), t.quadraticCurveTo(e + o, n, e + o, n + s), t.lineTo(e + o, n + i - s), t.quadraticCurveTo(e + o, n + i, e + o - s, n + i), t.lineTo(e + s, n + i), t.quadraticCurveTo(e, n + i, e, n + i - s), t.lineTo(e, n + s), t.quadraticCurveTo(e, n, e + s, n), t.closePath());
}
function G(t, e, n, o) {
  t.save(), t.font = "bold 10px system-ui, sans-serif";
  const i = 5, s = t.measureText(e).width;
  t.fillStyle = "rgba(0,0,0,0.58)", ot(t, n, o, s + i * 2, 18, 4), t.fill(), t.fillStyle = "#fff", t.fillText(e, n + i, o + 13), t.restore();
}
function At(t, e) {
  switch (String((t == null ? void 0 : t.type) || "").toLowerCase()) {
    case "number":
      return St(t, e);
    case "combo":
      return Bt(t, e);
    case "text":
    case "string":
    case "customtext":
      return Pt(t, e);
    case "toggle":
      return Mt(t, e);
    default:
      return It(t);
  }
}
function T(t, e) {
  var o, i, s, l, d, u, a;
  if (!t) return !1;
  const n = String(t.type || "").toLowerCase();
  if (n === "number") {
    const c = Number(e);
    if (Number.isNaN(c)) return !1;
    const r = t.options ?? {}, h = r.min ?? -1 / 0, m = r.max ?? 1 / 0;
    t.value = Math.min(m, Math.max(h, c));
  } else n === "toggle" ? t.value = !!e : t.value = e;
  try {
    (o = t.callback) == null || o.call(t, t.value);
  } catch (c) {
    (i = console.debug) == null || i.call(console, c);
  }
  try {
    const c = U();
    (l = (s = c == null ? void 0 : c.canvas) == null ? void 0 : s.setDirty) == null || l.call(s, !0, !0), (u = (d = c == null ? void 0 : c.graph) == null ? void 0 : d.setDirtyCanvas) == null || u.call(d, !0, !0);
  } catch (c) {
    (a = console.debug) == null || a.call(console, c);
  }
  return !0;
}
function St(t, e) {
  const n = document.createElement("input");
  n.type = "number", n.className = "mjr-ws-input", n.value = t.value ?? "";
  const o = t.options ?? {};
  return o.min != null && (n.min = String(o.min)), o.max != null && (n.max = String(o.max)), o.step != null && (n.step = String(o.step)), n.addEventListener("input", () => {
    const i = n.value;
    i === "" || i === "-" || i === "." || i.endsWith(".") || (T(t, i), e == null || e(t.value));
  }), n.addEventListener("change", () => {
    T(t, n.value) && (n.value = t.value, e == null || e(t.value));
  }), n;
}
function Bt(t, e) {
  var i;
  const n = document.createElement("select");
  n.className = "mjr-ws-input";
  let o = ((i = t.options) == null ? void 0 : i.values) ?? [];
  if (typeof o == "function")
    try {
      o = o() ?? [];
    } catch {
      o = [];
    }
  Array.isArray(o) || (o = []);
  for (const s of o) {
    const l = document.createElement("option"), d = typeof s == "string" ? s : (s == null ? void 0 : s.content) ?? (s == null ? void 0 : s.value) ?? (s == null ? void 0 : s.text) ?? String(s);
    l.value = d, l.textContent = d, d === String(t.value) && (l.selected = !0), n.appendChild(l);
  }
  return n.addEventListener("change", () => {
    T(t, n.value) && (e == null || e(t.value));
  }), n;
}
function Pt(t, e) {
  const o = document.createElement("div");
  o.className = "mjr-ws-text-wrapper";
  const i = document.createElement("textarea");
  i.className = "mjr-ws-input mjr-ws-textarea", i.value = t.value ?? "", i.rows = 2;
  const s = document.createElement("button");
  s.type = "button", s.className = "mjr-ws-expand-btn", s.textContent = "Expand", s.style.display = "none";
  let l = !1;
  const d = () => {
    i.style.height = "auto";
    const u = i.scrollHeight;
    l ? (i.style.height = u + "px", i.style.maxHeight = "none", s.textContent = "Collapse") : (i.style.height = Math.min(u, 80) + "px", i.style.maxHeight = "80px", s.textContent = "Expand"), s.style.display = u > 80 ? "" : "none";
  };
  return i.addEventListener("change", () => {
    T(t, i.value) && (e == null || e(t.value));
  }), i.addEventListener("input", () => {
    T(t, i.value), d();
  }), s.addEventListener("click", () => {
    l = !l, d();
  }), o.appendChild(i), o.appendChild(s), requestAnimationFrame(d), o;
}
function Mt(t, e) {
  const n = document.createElement("label");
  n.className = "mjr-ws-toggle-label";
  const o = document.createElement("input");
  return o.type = "checkbox", o.className = "mjr-ws-checkbox", o.checked = !!t.value, o.addEventListener("change", () => {
    T(t, o.checked) && (e == null || e(t.value));
  }), n.appendChild(o), n;
}
function It(t) {
  const e = document.createElement("input");
  return e.type = "text", e.className = "mjr-ws-input mjr-ws-readonly", e.value = t.value != null ? String(t.value) : "", e.readOnly = !0, e.tabIndex = -1, e;
}
const Nt = /* @__PURE__ */ new Set(["imageupload", "button", "hidden"]);
class Ft {
  /**
   * @param {object} node  LGraphNode instance
   * @param {object} [opts]
   * @param {() => void} [opts.onLocate]  Custom locate handler (optional)
   */
  constructor(e, n = {}) {
    this._node = e, this._onLocate = n.onLocate ?? null, this._el = null, this._inputMap = /* @__PURE__ */ new Map();
  }
  get el() {
    return this._el || (this._el = this._render()), this._el;
  }
  /** Re-read widget values from the live graph and update inputs. */
  syncFromGraph() {
    var e, n;
    if ((e = this._node) != null && e.widgets)
      for (const o of this._node.widgets) {
        let i = this._inputMap.get(o.name);
        i && ((n = i.classList) != null && n.contains("mjr-ws-text-wrapper") && (i = i.querySelector("textarea") ?? i), i.type === "checkbox" ? i.checked = !!o.value : i.value = o.value != null ? String(o.value) : "");
      }
  }
  dispose() {
    var e;
    (e = this._el) == null || e.remove(), this._el = null, this._inputMap.clear();
  }
  // ── Private ───────────────────────────────────────────────────────────────
  _render() {
    var c;
    const e = this._node, n = document.createElement("section");
    n.className = "mjr-ws-node", n.dataset.nodeId = String(e.id ?? "");
    const o = document.createElement("div");
    o.className = "mjr-ws-node-header";
    const i = document.createElement("span");
    i.className = "mjr-ws-node-title", i.textContent = e.title || e.type || `Node #${e.id}`, o.appendChild(i);
    const s = document.createElement("button");
    s.type = "button", s.className = "mjr-icon-btn mjr-ws-locate", s.title = "Locate on canvas";
    const l = document.createElement("i");
    l.className = "pi pi-map-marker", l.setAttribute("aria-hidden", "true"), s.appendChild(l), s.addEventListener("click", () => this._locateNode()), o.appendChild(s), n.appendChild(o);
    const d = document.createElement("div");
    d.className = "mjr-ws-node-body";
    const u = e.widgets ?? [];
    let a = !1;
    for (const r of u) {
      const h = String(r.type || "").toLowerCase();
      if (Nt.has(h) || r.hidden || (c = r.options) != null && c.hidden) continue;
      a = !0;
      const m = h === "text" || h === "string" || h === "customtext", f = document.createElement("div");
      f.className = m ? "mjr-ws-widget-row mjr-ws-widget-row--block" : "mjr-ws-widget-row";
      const p = document.createElement("label");
      p.className = "mjr-ws-widget-label", p.textContent = r.name || "";
      const _ = document.createElement("div");
      _.className = "mjr-ws-widget-input";
      const g = At(r, () => {
      });
      _.appendChild(g), this._inputMap.set(r.name, g), f.appendChild(p), f.appendChild(_), d.appendChild(f);
    }
    if (!a) {
      const r = document.createElement("div");
      r.className = "mjr-ws-node-empty", r.textContent = "No editable parameters", d.appendChild(r);
    }
    return n.appendChild(d), n;
  }
  _locateNode() {
    var n, o, i, s, l, d, u, a;
    if (this._onLocate) {
      this._onLocate();
      return;
    }
    const e = this._node;
    if (e)
      try {
        const c = U(), r = c == null ? void 0 : c.canvas;
        if (!r) return;
        if (typeof r.centerOnNode == "function")
          r.centerOnNode(e);
        else if (r.ds && e.pos) {
          const h = ((n = r.canvas) == null ? void 0 : n.width) || ((o = r.element) == null ? void 0 : o.width) || 800, m = ((i = r.canvas) == null ? void 0 : i.height) || ((s = r.element) == null ? void 0 : s.height) || 600;
          r.ds.offset[0] = -e.pos[0] - (((l = e.size) == null ? void 0 : l[0]) || 0) / 2 + h / 2, r.ds.offset[1] = -e.pos[1] - (((d = e.size) == null ? void 0 : d[1]) || 0) / 2 + m / 2, (u = r.setDirty) == null || u.call(r, !0, !0);
        }
      } catch (c) {
        (a = console.debug) == null || a.call(console, "[MFV sidebar] locateNode error", c);
      }
  }
}
class Lt {
  /**
   * @param {object} opts
   * @param {HTMLElement} opts.hostEl  The MFV root element to append to
   * @param {() => void}  [opts.onClose]
   */
  constructor({ hostEl: e, onClose: n } = {}) {
    this._hostEl = e, this._onClose = n ?? null, this._renderers = [], this._visible = !1, this._el = this._build();
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
    const e = xt();
    if (!e.length) {
      this._showEmpty();
      return;
    }
    for (const n of e) {
      const o = new Ft(n);
      this._renderers.push(o), this._body.appendChild(o.el);
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
    const n = document.createElement("div");
    n.className = "mjr-ws-sidebar-header";
    const o = document.createElement("span");
    o.className = "mjr-ws-sidebar-title", o.textContent = "Node Parameters", n.appendChild(o);
    const i = document.createElement("button");
    i.type = "button", i.className = "mjr-icon-btn", i.title = "Close sidebar";
    const s = document.createElement("i");
    return s.className = "pi pi-times", s.setAttribute("aria-hidden", "true"), i.appendChild(s), i.addEventListener("click", () => {
      var l;
      this.hide(), (l = this._onClose) == null || l.call(this);
    }), n.appendChild(i), e.appendChild(n), this._body = document.createElement("div"), this._body.className = "mjr-ws-sidebar-body", e.appendChild(this._body), e;
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
function xt() {
  var t, e, n;
  try {
    const o = U(), i = ((t = o == null ? void 0 : o.canvas) == null ? void 0 : t.selected_nodes) ?? ((e = o == null ? void 0 : o.canvas) == null ? void 0 : e.selectedNodes) ?? null;
    if (!i) return [];
    if (Array.isArray(i)) return i.filter(Boolean);
    if (i instanceof Map) return Array.from(i.values()).filter(Boolean);
    if (typeof i == "object") return Object.values(i).filter(Boolean);
  } catch (o) {
    (n = console.debug) == null || n.call(console, "[MFV sidebar] _getSelectedNodes error", o);
  }
  return [];
}
const I = Object.freeze({ IDLE: "idle", RUNNING: "running", ERROR: "error" });
function kt() {
  const t = document.createElement("button");
  t.type = "button", t.className = "mjr-icon-btn mjr-mfv-run-btn";
  const e = B("tooltip.queuePrompt", "Queue Prompt (Run)");
  t.title = e, t.setAttribute("aria-label", e);
  const n = document.createElement("i");
  n.className = "pi pi-play", n.setAttribute("aria-hidden", "true"), t.appendChild(n);
  let o = I.IDLE;
  function i(l) {
    o = l, t.classList.toggle("running", o === I.RUNNING), t.classList.toggle("error", o === I.ERROR), t.disabled = o === I.RUNNING, o === I.RUNNING ? n.className = "pi pi-spin pi-spinner" : n.className = "pi pi-play";
  }
  async function s() {
    var l;
    if (o !== I.RUNNING) {
      i(I.RUNNING);
      try {
        await jt(), i(I.IDLE);
      } catch (d) {
        (l = console.error) == null || l.call(console, "[MFV Run]", d), i(I.ERROR), setTimeout(() => {
          o === I.ERROR && i(I.IDLE);
        }, 1500);
      }
    }
  }
  return t.addEventListener("click", s), {
    el: t,
    dispose() {
      t.removeEventListener("click", s);
    }
  };
}
async function jt() {
  const t = U();
  if (!t) throw new Error("ComfyUI app not available");
  if (typeof t.queuePrompt == "function") {
    await t.queuePrompt(0);
    return;
  }
  const e = typeof t.graphToPrompt == "function" ? await t.graphToPrompt() : null;
  if (!(e != null && e.output)) throw new Error("graphToPrompt returned empty output");
  const n = rt(t);
  if (n && typeof n.queuePrompt == "function") {
    await n.queuePrompt(0, e);
    return;
  }
  const o = await fetch("/prompt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: e.output,
      extra_data: { extra_pnginfo: { workflow: e.workflow } }
    })
  });
  if (!o.ok) throw new Error(`POST /prompt failed (${o.status})`);
}
function Vt(t) {
  const e = document.createElement("div");
  return e.className = "mjr-mfv", e.setAttribute("role", "dialog"), e.setAttribute("aria-modal", "false"), e.setAttribute("aria-hidden", "true"), t.element = e, e.appendChild(t._buildHeader()), e.setAttribute("aria-labelledby", t._titleId), e.appendChild(t._buildToolbar()), t._contentWrapper = document.createElement("div"), t._contentWrapper.className = "mjr-mfv-content-wrapper", t._applySidebarPosition(), t._contentEl = document.createElement("div"), t._contentEl.className = "mjr-mfv-content", t._contentWrapper.appendChild(t._contentEl), t._sidebar = new Lt({
    hostEl: e,
    onClose: () => t._updateSettingsBtnState(!1)
  }), t._contentWrapper.appendChild(t._sidebar.el), e.appendChild(t._contentWrapper), t._rebindControlHandlers(), t._bindPanelInteractions(), t._bindDocumentUiHandlers(), t._onSidebarPosChanged = (n) => {
    var o;
    ((o = n == null ? void 0 : n.detail) == null ? void 0 : o.key) === "viewer.mfvSidebarPosition" && t._applySidebarPosition();
  }, window.addEventListener("mjr-settings-changed", t._onSidebarPosChanged), t._refresh(), e;
}
function Tt(t) {
  const e = document.createElement("div");
  e.className = "mjr-mfv-header";
  const n = document.createElement("span");
  n.className = "mjr-mfv-header-title", n.id = t._titleId, n.textContent = "Majoor Viewer Lite";
  const o = document.createElement("button");
  t._closeBtn = o, o.type = "button", o.className = "mjr-icon-btn mjr-mfv-close-btn", O(o, B("tooltip.closeViewer", "Close viewer"), ft);
  const i = document.createElement("i");
  return i.className = "pi pi-times", i.setAttribute("aria-hidden", "true"), o.appendChild(i), e.appendChild(n), e.appendChild(o), e;
}
function Gt(t) {
  var r, h;
  const e = document.createElement("div");
  e.className = "mjr-mfv-toolbar", t._modeBtn = document.createElement("button"), t._modeBtn.type = "button", t._modeBtn.className = "mjr-icon-btn", t._updateModeBtnUI(), e.appendChild(t._modeBtn), t._pinGroup = document.createElement("div"), t._pinGroup.className = "mjr-mfv-pin-group", t._pinGroup.setAttribute("role", "group"), t._pinGroup.setAttribute("aria-label", "Pin References"), t._pinBtns = {};
  for (const m of ["A", "B", "C", "D"]) {
    const f = document.createElement("button");
    f.type = "button", f.className = "mjr-mfv-pin-btn", f.textContent = m, f.dataset.slot = m, f.title = `Pin ${m}`, f.setAttribute("aria-pressed", "false"), t._pinBtns[m] = f, t._pinGroup.appendChild(f);
  }
  t._updatePinUI(), e.appendChild(t._pinGroup);
  const n = document.createElement("div");
  n.className = "mjr-mfv-toolbar-sep", n.setAttribute("aria-hidden", "true"), e.appendChild(n), t._liveBtn = document.createElement("button"), t._liveBtn.type = "button", t._liveBtn.className = "mjr-icon-btn", t._liveBtn.innerHTML = '<i class="pi pi-circle" aria-hidden="true"></i>', t._liveBtn.setAttribute("aria-pressed", "false"), O(
    t._liveBtn,
    B("tooltip.liveStreamOff", "Live Stream: OFF — click to follow"),
    tt
  ), e.appendChild(t._liveBtn), t._previewBtn = document.createElement("button"), t._previewBtn.type = "button", t._previewBtn.className = "mjr-icon-btn", t._previewBtn.innerHTML = '<i class="pi pi-eye" aria-hidden="true"></i>', t._previewBtn.setAttribute("aria-pressed", "false"), O(
    t._previewBtn,
    B(
      "tooltip.previewStreamOff",
      "KSampler Preview: OFF — click to stream denoising steps"
    ),
    et
  ), e.appendChild(t._previewBtn), t._nodeStreamBtn = document.createElement("button"), t._nodeStreamBtn.type = "button", t._nodeStreamBtn.className = "mjr-icon-btn", t._nodeStreamBtn.innerHTML = '<i class="pi pi-sitemap" aria-hidden="true"></i>', t._nodeStreamBtn.setAttribute("aria-pressed", "false"), O(
    t._nodeStreamBtn,
    B("tooltip.nodeStreamOff", "Node Stream: OFF — click to stream selected node output"),
    ht
  ), e.appendChild(t._nodeStreamBtn), (h = (r = t._nodeStreamBtn).remove) == null || h.call(r), t._nodeStreamBtn = null, t._genBtn = document.createElement("button"), t._genBtn.type = "button", t._genBtn.className = "mjr-icon-btn", t._genBtn.setAttribute("aria-haspopup", "dialog"), t._genBtn.setAttribute("aria-expanded", "false");
  const o = document.createElement("i");
  o.className = "pi pi-info-circle", o.setAttribute("aria-hidden", "true"), t._genBtn.appendChild(o), e.appendChild(t._genBtn), t._updateGenBtnUI(), t._popoutBtn = document.createElement("button"), t._popoutBtn.type = "button", t._popoutBtn.className = "mjr-icon-btn";
  const i = B("tooltip.popOutViewer", "Pop out viewer to separate window");
  t._popoutBtn.title = i, t._popoutBtn.setAttribute("aria-label", i), t._popoutBtn.setAttribute("aria-pressed", "false");
  const s = document.createElement("i");
  s.className = "pi pi-external-link", s.setAttribute("aria-hidden", "true"), t._popoutBtn.appendChild(s), e.appendChild(t._popoutBtn), t._captureBtn = document.createElement("button"), t._captureBtn.type = "button", t._captureBtn.className = "mjr-icon-btn";
  const l = B("tooltip.captureView", "Save view as image");
  t._captureBtn.title = l, t._captureBtn.setAttribute("aria-label", l);
  const d = document.createElement("i");
  d.className = "pi pi-download", d.setAttribute("aria-hidden", "true"), t._captureBtn.appendChild(d), e.appendChild(t._captureBtn);
  const u = document.createElement("div");
  u.className = "mjr-mfv-toolbar-sep", u.style.marginLeft = "auto", u.setAttribute("aria-hidden", "true"), e.appendChild(u), t._settingsBtn = document.createElement("button"), t._settingsBtn.type = "button", t._settingsBtn.className = "mjr-icon-btn mjr-mfv-settings-btn";
  const a = B("tooltip.nodeParams", "Node Parameters");
  t._settingsBtn.title = a, t._settingsBtn.setAttribute("aria-label", a), t._settingsBtn.setAttribute("aria-pressed", "false");
  const c = document.createElement("i");
  return c.className = "pi pi-sliders-h", c.setAttribute("aria-hidden", "true"), t._settingsBtn.appendChild(c), e.appendChild(t._settingsBtn), t._runHandle = kt(), e.appendChild(t._runHandle.el), t._handleDocClick = (m) => {
    var p, _;
    if (!t._genDropdown) return;
    const f = m == null ? void 0 : m.target;
    (_ = (p = t._genBtn) == null ? void 0 : p.contains) != null && _.call(p, f) || t._genDropdown.contains(f) || t._closeGenDropdown();
  }, t._bindDocumentUiHandlers(), e;
}
function Dt(t) {
  var n, o, i, s, l, d, u, a, c, r, h, m;
  try {
    (n = t._btnAC) == null || n.abort();
  } catch (f) {
    (o = console.debug) == null || o.call(console, f);
  }
  t._btnAC = new AbortController();
  const e = t._btnAC.signal;
  (i = t._closeBtn) == null || i.addEventListener(
    "click",
    () => {
      t._dispatchControllerAction("close", V.MFV_CLOSE);
    },
    { signal: e }
  ), (s = t._modeBtn) == null || s.addEventListener("click", () => t._cycleMode(), { signal: e }), (l = t._pinGroup) == null || l.addEventListener(
    "click",
    (f) => {
      var g, y;
      const p = (y = (g = f.target) == null ? void 0 : g.closest) == null ? void 0 : y.call(g, ".mjr-mfv-pin-btn");
      if (!p) return;
      const _ = p.dataset.slot;
      _ && (t._pinnedSlots.has(_) ? t._pinnedSlots.delete(_) : t._pinnedSlots.add(_), t._pinnedSlots.has("C") || t._pinnedSlots.has("D") ? t._mode !== b.GRID && t.setMode(b.GRID) : t._pinnedSlots.size > 0 && t._mode === b.SIMPLE && t.setMode(b.AB), t._updatePinUI());
    },
    { signal: e }
  ), (d = t._liveBtn) == null || d.addEventListener(
    "click",
    () => {
      t._dispatchControllerAction("toggleLive", V.MFV_LIVE_TOGGLE);
    },
    { signal: e }
  ), (u = t._previewBtn) == null || u.addEventListener(
    "click",
    () => {
      t._dispatchControllerAction("togglePreview", V.MFV_PREVIEW_TOGGLE);
    },
    { signal: e }
  ), (a = t._nodeStreamBtn) == null || a.addEventListener(
    "click",
    () => {
      t._dispatchControllerAction("toggleNodeStream", V.MFV_NODESTREAM_TOGGLE);
    },
    { signal: e }
  ), (c = t._genBtn) == null || c.addEventListener(
    "click",
    (f) => {
      var p, _;
      f.stopPropagation(), (_ = (p = t._genDropdown) == null ? void 0 : p.classList) != null && _.contains("is-visible") ? t._closeGenDropdown() : t._openGenDropdown();
    },
    { signal: e }
  ), (r = t._popoutBtn) == null || r.addEventListener(
    "click",
    () => {
      t._dispatchControllerAction("popOut", V.MFV_POPOUT);
    },
    { signal: e }
  ), (h = t._captureBtn) == null || h.addEventListener("click", () => t._captureView(), { signal: e }), (m = t._settingsBtn) == null || m.addEventListener(
    "click",
    () => {
      var f, p;
      (f = t._sidebar) == null || f.toggle(), t._updateSettingsBtnState(((p = t._sidebar) == null ? void 0 : p.isVisible) ?? !1);
    },
    { signal: e }
  );
}
function Rt(t, e) {
  t._settingsBtn && (t._settingsBtn.classList.toggle("active", !!e), t._settingsBtn.setAttribute("aria-pressed", String(!!e)));
}
function Ot(t) {
  var n;
  if (!t._contentWrapper) return;
  const e = v.MFV_SIDEBAR_POSITION || "right";
  t._contentWrapper.setAttribute("data-sidebar-pos", e), (n = t._sidebar) != null && n.el && t._contentEl && (e === "left" ? t._contentWrapper.insertBefore(t._sidebar.el, t._contentEl) : t._contentWrapper.appendChild(t._sidebar.el));
}
function Ht(t) {
  var e, n, o;
  t._closeGenDropdown();
  try {
    (n = (e = t._genDropdown) == null ? void 0 : e.remove) == null || n.call(e);
  } catch (i) {
    (o = console.debug) == null || o.call(console, i);
  }
  t._genDropdown = null, t._updateGenBtnUI();
}
function Ut(t) {
  var n, o, i;
  if (!t._handleDocClick) return;
  const e = ((n = t.element) == null ? void 0 : n.ownerDocument) || document;
  if (t._docClickHost !== e) {
    t._unbindDocumentUiHandlers();
    try {
      (o = t._docAC) == null || o.abort();
    } catch (s) {
      (i = console.debug) == null || i.call(console, s);
    }
    t._docAC = new AbortController(), e.addEventListener("click", t._handleDocClick, { signal: t._docAC.signal }), t._docClickHost = e;
  }
}
function zt(t) {
  var e, n;
  try {
    (e = t._docAC) == null || e.abort();
  } catch (o) {
    (n = console.debug) == null || n.call(console, o);
  }
  t._docAC = new AbortController(), t._docClickHost = null;
}
function Wt(t) {
  var e, n;
  return !!((n = (e = t._genDropdown) == null ? void 0 : e.classList) != null && n.contains("is-visible"));
}
function $t(t) {
  if (!t.element) return;
  t._genDropdown || (t._genDropdown = t._buildGenDropdown(), t.element.appendChild(t._genDropdown)), t._bindDocumentUiHandlers();
  const e = t._genBtn.getBoundingClientRect(), n = t.element.getBoundingClientRect(), o = e.left - n.left, i = e.bottom - n.top + 6;
  t._genDropdown.style.left = `${o}px`, t._genDropdown.style.top = `${i}px`, t._genDropdown.classList.add("is-visible"), t._updateGenBtnUI();
}
function Xt(t) {
  t._genDropdown && (t._genDropdown.classList.remove("is-visible"), t._updateGenBtnUI());
}
function qt(t) {
  if (!t._genBtn) return;
  const e = t._genInfoSelections.size, n = e > 0, o = t._isGenDropdownOpen();
  t._genBtn.classList.toggle("is-on", n), t._genBtn.classList.toggle("is-open", o);
  const i = n ? `Gen Info (${e} field${e > 1 ? "s" : ""} shown)${o ? " — open" : " — click to configure"}` : `Gen Info${o ? " — open" : " — click to show overlay"}`;
  t._genBtn.title = i, t._genBtn.setAttribute("aria-label", i), t._genBtn.setAttribute("aria-expanded", String(o)), t._genDropdown ? t._genBtn.setAttribute("aria-controls", t._genDropdownId) : t._genBtn.removeAttribute("aria-controls");
}
function Kt(t) {
  const e = document.createElement("div");
  e.className = "mjr-mfv-gen-dropdown", e.id = t._genDropdownId, e.setAttribute("role", "group"), e.setAttribute("aria-label", "Generation info fields");
  const n = [
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
  for (const [o, i] of n) {
    const s = document.createElement("label");
    s.className = "mjr-mfv-gen-dropdown-row";
    const l = document.createElement("input");
    l.type = "checkbox", l.checked = t._genInfoSelections.has(o), l.addEventListener("change", () => {
      l.checked ? t._genInfoSelections.add(o) : t._genInfoSelections.delete(o), t._updateGenBtnUI(), t._refresh();
    });
    const d = document.createElement("span");
    d.textContent = i, s.appendChild(l), s.appendChild(d), e.appendChild(s);
  }
  return e;
}
function Yt(t, e) {
  var s, l, d, u;
  if (!e) return {};
  try {
    const a = e.geninfo ? { geninfo: e.geninfo } : e.metadata || e.metadata_raw || e, c = dt(a) || null, r = {
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
      c.prompt && (r.prompt = $(String(c.prompt))), c.seed != null && (r.seed = String(c.seed)), c.model && (r.model = Array.isArray(c.model) ? c.model.join(", ") : String(c.model)), Array.isArray(c.loras) && (r.lora = c.loras.map(
        (m) => typeof m == "string" ? m : (m == null ? void 0 : m.name) || (m == null ? void 0 : m.lora_name) || (m == null ? void 0 : m.model_name) || ""
      ).filter(Boolean).join(", ")), c.sampler && (r.sampler = String(c.sampler)), c.scheduler && (r.scheduler = String(c.scheduler)), c.cfg != null && (r.cfg = String(c.cfg)), c.steps != null && (r.step = String(c.steps)), !r.prompt && (a != null && a.prompt) && (r.prompt = $(String(a.prompt || "")));
      const h = e.generation_time_ms ?? ((s = e.metadata_raw) == null ? void 0 : s.generation_time_ms) ?? (a == null ? void 0 : a.generation_time_ms) ?? ((l = a == null ? void 0 : a.geninfo) == null ? void 0 : l.generation_time_ms) ?? 0;
      return h && Number.isFinite(Number(h)) && h > 0 && h < 864e5 && (r.genTime = (Number(h) / 1e3).toFixed(1) + "s"), r;
    }
  } catch (a) {
    (d = console.debug) == null || d.call(console, "[MFV] geninfo normalize failed", a);
  }
  const n = (e == null ? void 0 : e.metadata) || (e == null ? void 0 : e.metadata_raw) || e || {}, o = {
    prompt: $(String((n == null ? void 0 : n.prompt) || (n == null ? void 0 : n.positive) || "")),
    seed: (n == null ? void 0 : n.seed) != null ? String(n.seed) : "",
    model: (n == null ? void 0 : n.checkpoint) || (n == null ? void 0 : n.ckpt_name) || (n == null ? void 0 : n.model) || "",
    lora: Array.isArray(n == null ? void 0 : n.loras) ? n.loras.join(", ") : (n == null ? void 0 : n.lora) || "",
    sampler: (n == null ? void 0 : n.sampler_name) || (n == null ? void 0 : n.sampler) || "",
    scheduler: (n == null ? void 0 : n.scheduler) || "",
    cfg: (n == null ? void 0 : n.cfg) != null ? String(n.cfg) : (n == null ? void 0 : n.cfg_scale) != null ? String(n.cfg_scale) : "",
    step: (n == null ? void 0 : n.steps) != null ? String(n.steps) : "",
    genTime: ""
  }, i = e.generation_time_ms ?? ((u = e.metadata_raw) == null ? void 0 : u.generation_time_ms) ?? (n == null ? void 0 : n.generation_time_ms) ?? 0;
  return i && Number.isFinite(Number(i)) && i > 0 && i < 864e5 && (o.genTime = (Number(i) / 1e3).toFixed(1) + "s"), o;
}
function Zt(t, e) {
  const n = t._getGenFields(e);
  if (!n) return null;
  const o = document.createDocumentFragment(), i = [
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
  for (const s of i) {
    if (!t._genInfoSelections.has(s)) continue;
    const l = n[s] != null ? String(n[s]) : "";
    if (!l) continue;
    let d = s.charAt(0).toUpperCase() + s.slice(1);
    s === "lora" ? d = "LoRA" : s === "cfg" ? d = "CFG" : s === "genTime" && (d = "Gen Time");
    const u = document.createElement("div");
    u.dataset.field = s;
    const a = document.createElement("strong");
    if (a.textContent = `${d}: `, u.appendChild(a), s === "prompt")
      u.appendChild(document.createTextNode(l));
    else if (s === "genTime") {
      const c = parseFloat(l);
      let r = "#4CAF50";
      c >= 60 ? r = "#FF9800" : c >= 30 ? r = "#FFC107" : c >= 10 && (r = "#8BC34A");
      const h = document.createElement("span");
      h.style.color = r, h.style.fontWeight = "600", h.textContent = l, u.appendChild(h);
    } else
      u.appendChild(document.createTextNode(l));
    o.appendChild(u);
  }
  return o.childNodes.length > 0 ? o : null;
}
function Jt(t) {
  var e, n, o;
  try {
    (n = (e = t._controller) == null ? void 0 : e.onModeChanged) == null || n.call(e, t._mode);
  } catch (i) {
    (o = console.debug) == null || o.call(console, i);
  }
}
function Qt(t) {
  const e = [b.SIMPLE, b.AB, b.SIDE, b.GRID];
  t._mode = e[(e.indexOf(t._mode) + 1) % e.length], t._updateModeBtnUI(), t._refresh(), t._notifyModeChanged();
}
function wt(t, e) {
  Object.values(b).includes(e) && (t._mode = e, t._updateModeBtnUI(), t._refresh(), t._notifyModeChanged());
}
function vt(t) {
  return t._pinnedSlots;
}
function te(t) {
  if (t._pinBtns)
    for (const e of ["A", "B", "C", "D"]) {
      const n = t._pinBtns[e];
      if (!n) continue;
      const o = t._pinnedSlots.has(e);
      n.classList.toggle("is-pinned", o), n.setAttribute("aria-pressed", String(o)), n.title = o ? `Unpin ${e}` : `Pin ${e}`;
    }
}
function ee(t) {
  if (!t._modeBtn) return;
  const e = {
    [b.SIMPLE]: { icon: "pi-image", label: "Mode: Simple - click to switch" },
    [b.AB]: { icon: "pi-clone", label: "Mode: A/B Compare - click to switch" },
    [b.SIDE]: { icon: "pi-table", label: "Mode: Side-by-Side - click to switch" },
    [b.GRID]: {
      icon: "pi-th-large",
      label: "Mode: Grid Compare (up to 4) - click to switch"
    }
  }, { icon: n = "pi-image", label: o = "" } = e[t._mode] || {}, i = Y(o, mt), s = document.createElement("i");
  s.className = `pi ${n}`, s.setAttribute("aria-hidden", "true"), t._modeBtn.replaceChildren(s), t._modeBtn.title = i, t._modeBtn.setAttribute("aria-label", i), t._modeBtn.removeAttribute("aria-pressed");
}
function ne(t, e) {
  if (!t._liveBtn) return;
  const n = !!e;
  t._liveBtn.classList.toggle("mjr-live-active", n);
  const o = n ? B("tooltip.liveStreamOn", "Live Stream: ON — click to disable") : B("tooltip.liveStreamOff", "Live Stream: OFF — click to follow"), i = Y(o, tt);
  t._liveBtn.setAttribute("aria-pressed", String(n)), t._liveBtn.setAttribute("aria-label", i);
  const s = document.createElement("i");
  s.className = n ? "pi pi-circle-fill" : "pi pi-circle", s.setAttribute("aria-hidden", "true"), t._liveBtn.replaceChildren(s), t._liveBtn.title = i;
}
function oe(t, e) {
  if (t._previewActive = !!e, !t._previewBtn) return;
  t._previewBtn.classList.toggle("mjr-preview-active", t._previewActive);
  const n = t._previewActive ? B("tooltip.previewStreamOn", "KSampler Preview: ON — streaming denoising steps") : B(
    "tooltip.previewStreamOff",
    "KSampler Preview: OFF — click to stream denoising steps"
  ), o = Y(n, et);
  t._previewBtn.setAttribute("aria-pressed", String(t._previewActive)), t._previewBtn.setAttribute("aria-label", o);
  const i = document.createElement("i");
  i.className = t._previewActive ? "pi pi-eye" : "pi pi-eye-slash", i.setAttribute("aria-hidden", "true"), t._previewBtn.replaceChildren(i), t._previewBtn.title = o, t._previewActive || t._revokePreviewBlob();
}
function se(t, e) {
  if (!e || !(e instanceof Blob)) return;
  t._revokePreviewBlob();
  const n = URL.createObjectURL(e);
  t._previewBlobUrl = n;
  const o = { url: n, filename: "preview.jpg", kind: "image", _isPreview: !0 };
  if (t._mode === b.AB || t._mode === b.SIDE || t._mode === b.GRID) {
    const s = t.getPinnedSlots();
    if (t._mode === b.GRID) {
      const l = ["A", "B", "C", "D"].find((d) => !s.has(d)) || "A";
      t[`_media${l}`] = o;
    } else s.has("B") ? t._mediaA = o : t._mediaB = o;
  } else
    t._mediaA = o, t._resetMfvZoom(), t._mode !== b.SIMPLE && (t._mode = b.SIMPLE, t._updateModeBtnUI());
  ++t._refreshGen, t._refresh();
}
function ie(t) {
  if (t._previewBlobUrl) {
    try {
      URL.revokeObjectURL(t._previewBlobUrl);
    } catch {
    }
    t._previewBlobUrl = null;
  }
}
function ae(t, e) {
  {
    t._nodeStreamActive = !1;
    return;
  }
}
function le() {
  var t, e, n, o, i;
  try {
    const s = typeof window < "u" ? window : globalThis, l = (e = (t = s == null ? void 0 : s.process) == null ? void 0 : t.versions) == null ? void 0 : e.electron;
    if (typeof l == "string" && l.trim() || s != null && s.electron || s != null && s.ipcRenderer || s != null && s.electronAPI)
      return !0;
    const d = String(((n = s == null ? void 0 : s.navigator) == null ? void 0 : n.userAgent) || ((o = globalThis == null ? void 0 : globalThis.navigator) == null ? void 0 : o.userAgent) || ""), u = /\bElectron\//i.test(d), a = /\bCode\//i.test(d);
    if (u && !a)
      return !0;
  } catch (s) {
    (i = console.debug) == null || i.call(console, s);
  }
  return !1;
}
function S(t, e = null, n = "info") {
  var i, s;
  const o = {
    stage: String(t || "unknown"),
    detail: e,
    ts: Date.now()
  };
  try {
    const l = typeof window < "u" ? window : globalThis, d = "__MJR_MFV_POPOUT_TRACE__", u = Array.isArray(l[d]) ? l[d] : [];
    u.push(o), l[d] = u.slice(-20), l.__MJR_MFV_POPOUT_LAST__ = o;
  } catch (l) {
    (i = console.debug) == null || i.call(console, l);
  }
  try {
    const l = n === "error" ? console.error : n === "warn" ? console.warn : console.info;
    l == null || l("[MFV popout]", o);
  } catch (l) {
    (s = console.debug) == null || s.call(console, l);
  }
}
function re(t, e) {
  if (!t.element) return;
  const n = !!e;
  if (t._desktopExpanded === n) return;
  const o = t.element;
  if (n) {
    t._desktopExpandRestore = {
      parent: o.parentNode || null,
      nextSibling: o.nextSibling || null,
      styleAttr: o.getAttribute("style")
    }, o.parentNode !== document.body && document.body.appendChild(o), o.classList.add("mjr-mfv--desktop-expanded", "is-visible"), o.setAttribute("aria-hidden", "false"), o.style.position = "fixed", o.style.top = "12px", o.style.left = "12px", o.style.right = "12px", o.style.bottom = "12px", o.style.width = "auto", o.style.height = "auto", o.style.maxWidth = "none", o.style.maxHeight = "none", o.style.minWidth = "320px", o.style.minHeight = "240px", o.style.resize = "none", o.style.margin = "0", o.style.zIndex = "2147483000", t._desktopExpanded = !0, t.isVisible = !0, t._resetGenDropdownForCurrentDocument(), t._rebindControlHandlers(), t._bindPanelInteractions(), t._bindDocumentUiHandlers(), t._updatePopoutBtnUI(), S("electron-in-app-expanded", { isVisible: t.isVisible });
    return;
  }
  const i = t._desktopExpandRestore;
  t._desktopExpanded = !1, o.classList.remove("mjr-mfv--desktop-expanded"), (i == null ? void 0 : i.styleAttr) == null || i.styleAttr === "" ? o.removeAttribute("style") : o.setAttribute("style", i.styleAttr), i != null && i.parent && i.parent.isConnected && (i.nextSibling && i.nextSibling.parentNode === i.parent ? i.parent.insertBefore(o, i.nextSibling) : i.parent.appendChild(o)), t._desktopExpandRestore = null, t._resetGenDropdownForCurrentDocument(), t._rebindControlHandlers(), t._bindPanelInteractions(), t._bindDocumentUiHandlers(), t._updatePopoutBtnUI(), S("electron-in-app-restored", null);
}
function de(t, e) {
  var n;
  t._desktopPopoutUnsupported = !0, S(
    "electron-in-app-fallback",
    { message: (e == null ? void 0 : e.message) || String(e || "unknown error") },
    "warn"
  ), t._setDesktopExpanded(!0);
  try {
    ct(
      B(
        "toast.popoutElectronInAppFallback",
        "Desktop PiP is unavailable here. Viewer expanded inside the app instead."
      ),
      "warning",
      4500
    );
  } catch (o) {
    (n = console.debug) == null || n.call(console, o);
  }
}
function ce(t, e, n, o, i) {
  return S(
    "electron-popup-fallback-attempt",
    { reason: (i == null ? void 0 : i.message) || String(i || "unknown") },
    "warn"
  ), t._fallbackPopout(e, n, o), t._popoutWindow ? (t._desktopPopoutUnsupported = !1, S("electron-popup-fallback-opened", null), !0) : !1;
}
function ue(t) {
  var d, u;
  if (t._isPopped || !t.element) return;
  const e = t.element;
  t._stopEdgeResize();
  const n = le(), o = typeof window < "u" && "documentPictureInPicture" in window, i = String(((d = window == null ? void 0 : window.navigator) == null ? void 0 : d.userAgent) || ((u = globalThis == null ? void 0 : globalThis.navigator) == null ? void 0 : u.userAgent) || ""), s = Math.max(e.offsetWidth || 520, 400), l = Math.max(e.offsetHeight || 420, 300);
  if (S("start", {
    isElectronHost: n,
    hasDocumentPiP: o,
    userAgent: i,
    width: s,
    height: l,
    desktopPopoutUnsupported: t._desktopPopoutUnsupported
  }), n && t._desktopPopoutUnsupported) {
    S("electron-in-app-fallback-reuse", null), t._setDesktopExpanded(!0);
    return;
  }
  if (!(n && (S("electron-popup-request", { width: s, height: l }), t._tryElectronPopupFallback(e, s, l, new Error("Desktop popup requested"))))) {
    if (n && "documentPictureInPicture" in window) {
      S("electron-pip-request", { width: s, height: l }), window.documentPictureInPicture.requestWindow({ width: s, height: l }).then((a) => {
        var f, p, _;
        S("electron-pip-opened", {
          hasDocument: !!(a != null && a.document)
        }), t._popoutWindow = a, t._isPopped = !0, t._popoutRestoreGuard = !1;
        try {
          (f = t._popoutAC) == null || f.abort();
        } catch (g) {
          (p = console.debug) == null || p.call(console, g);
        }
        t._popoutAC = new AbortController();
        const c = t._popoutAC.signal, r = () => t._schedulePopInFromPopupClose();
        t._popoutCloseHandler = r;
        const h = a.document;
        h.title = "Majoor Viewer", t._installPopoutStyles(h), h.body.style.cssText = "margin:0;display:flex;min-height:100vh;background:#111;overflow:hidden;";
        const m = h.createElement("div");
        m.id = "mjr-mfv-popout-root", m.style.cssText = "flex:1;min-width:0;min-height:0;display:flex;", h.body.appendChild(m);
        try {
          const g = typeof h.adoptNode == "function" ? h.adoptNode(e) : e;
          m.appendChild(g), S("electron-pip-adopted", {
            usedAdoptNode: typeof h.adoptNode == "function"
          });
        } catch (g) {
          S(
            "electron-pip-adopt-failed",
            { message: (g == null ? void 0 : g.message) || String(g) },
            "warn"
          ), console.warn("[MFV] PiP adoptNode failed", g), t._isPopped = !1, t._popoutWindow = null;
          try {
            a.close();
          } catch (y) {
            (_ = console.debug) == null || _.call(console, y);
          }
          t._activateDesktopExpandedFallback(g);
          return;
        }
        e.classList.add("is-visible"), t.isVisible = !0, t._resetGenDropdownForCurrentDocument(), t._rebindControlHandlers(), t._bindDocumentUiHandlers(), t._updatePopoutBtnUI(), S("electron-pip-ready", { isPopped: t._isPopped }), a.addEventListener("pagehide", r, {
          signal: c
        }), t._startPopoutCloseWatch(), t._popoutKeydownHandler = (g) => {
          var C, E;
          const y = String(((C = g == null ? void 0 : g.target) == null ? void 0 : C.tagName) || "").toLowerCase();
          g != null && g.defaultPrevented || (E = g == null ? void 0 : g.target) != null && E.isContentEditable || y === "input" || y === "textarea" || y === "select" || t._forwardKeydownToController(g);
        }, a.addEventListener("keydown", t._popoutKeydownHandler, {
          signal: c
        });
      }).catch((a) => {
        S(
          "electron-pip-request-failed",
          { message: (a == null ? void 0 : a.message) || String(a) },
          "warn"
        ), t._activateDesktopExpandedFallback(a);
      });
      return;
    }
    if (n) {
      S("electron-no-pip-api", { hasDocumentPiP: o }), t._activateDesktopExpandedFallback(
        new Error("Document Picture-in-Picture unavailable after popup failure")
      );
      return;
    }
    S("browser-fallback-popup", { width: s, height: l }), t._fallbackPopout(e, s, l);
  }
}
function pe(t, e, n, o) {
  var r, h, m, f;
  S("browser-popup-open", { width: n, height: o });
  const i = (window.screenX || window.screenLeft) + Math.round((window.outerWidth - n) / 2), s = (window.screenY || window.screenTop) + Math.round((window.outerHeight - o) / 2), l = `width=${n},height=${o},left=${i},top=${s},resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,status=no`, d = window.open("about:blank", "_mjr_viewer", l);
  if (!d) {
    S("browser-popup-blocked", null, "warn"), console.warn("[MFV] Pop-out blocked — allow popups for this site.");
    return;
  }
  S("browser-popup-opened", { hasDocument: !!(d != null && d.document) }), t._popoutWindow = d, t._isPopped = !0, t._popoutRestoreGuard = !1;
  try {
    (r = t._popoutAC) == null || r.abort();
  } catch (p) {
    (h = console.debug) == null || h.call(console, p);
  }
  t._popoutAC = new AbortController();
  const u = t._popoutAC.signal, a = () => t._schedulePopInFromPopupClose();
  t._popoutCloseHandler = a;
  const c = () => {
    let p;
    try {
      p = d.document;
    } catch {
      return;
    }
    if (!p) return;
    p.title = "Majoor Viewer", t._installPopoutStyles(p), p.body.style.cssText = "margin:0;display:flex;min-height:100vh;background:#111;overflow:hidden;";
    const _ = p.createElement("div");
    _.id = "mjr-mfv-popout-root", _.style.cssText = "flex:1;min-width:0;min-height:0;display:flex;", p.body.appendChild(_);
    try {
      _.appendChild(p.adoptNode(e));
    } catch (g) {
      console.warn("[MFV] adoptNode failed", g);
      return;
    }
    e.classList.add("is-visible"), t.isVisible = !0, t._resetGenDropdownForCurrentDocument(), t._rebindControlHandlers(), t._bindDocumentUiHandlers(), t._updatePopoutBtnUI();
  };
  try {
    c();
  } catch (p) {
    (m = console.debug) == null || m.call(console, "[MFV] immediate mount failed, retrying on load", p);
    try {
      d.addEventListener("load", c, { signal: u });
    } catch (_) {
      (f = console.debug) == null || f.call(console, "[MFV] pop-out page load listener failed", _);
    }
  }
  d.addEventListener("beforeunload", a, { signal: u }), d.addEventListener("pagehide", a, { signal: u }), d.addEventListener("unload", a, { signal: u }), t._startPopoutCloseWatch(), t._popoutKeydownHandler = (p) => {
    var y, C, E, A;
    const _ = String(((y = p == null ? void 0 : p.target) == null ? void 0 : y.tagName) || "").toLowerCase();
    if (p != null && p.defaultPrevented || (C = p == null ? void 0 : p.target) != null && C.isContentEditable || _ === "input" || _ === "textarea" || _ === "select")
      return;
    if (String((p == null ? void 0 : p.key) || "").toLowerCase() === "v" && (p != null && p.ctrlKey || p != null && p.metaKey) && !(p != null && p.altKey) && !(p != null && p.shiftKey)) {
      p.preventDefault(), (E = p.stopPropagation) == null || E.call(p), (A = p.stopImmediatePropagation) == null || A.call(p), t._dispatchControllerAction("toggle", V.MFV_TOGGLE);
      return;
    }
    t._forwardKeydownToController(p);
  }, d.addEventListener("keydown", t._popoutKeydownHandler, { signal: u });
}
function me(t) {
  var e;
  if (t._popoutCloseTimer != null) {
    try {
      window.clearInterval(t._popoutCloseTimer);
    } catch (n) {
      (e = console.debug) == null || e.call(console, n);
    }
    t._popoutCloseTimer = null;
  }
}
function he(t) {
  t._clearPopoutCloseWatch(), t._popoutCloseTimer = window.setInterval(() => {
    if (!t._isPopped) {
      t._clearPopoutCloseWatch();
      return;
    }
    const e = t._popoutWindow;
    (!e || e.closed) && (t._clearPopoutCloseWatch(), t._schedulePopInFromPopupClose());
  }, 250);
}
function fe(t) {
  !t._isPopped || t._popoutRestoreGuard || (t._popoutRestoreGuard = !0, window.setTimeout(() => {
    try {
      t.popIn({ closePopupWindow: !1 });
    } finally {
      t._popoutRestoreGuard = !1;
    }
  }, 0));
}
function _e(t, e) {
  var o, i;
  if (!(e != null && e.head)) return;
  try {
    for (const s of e.head.querySelectorAll("[data-mjr-popout-cloned-style='1']"))
      s.remove();
  } catch (s) {
    (o = console.debug) == null || o.call(console, s);
  }
  for (const s of document.querySelectorAll('link[rel="stylesheet"], style'))
    try {
      let l = null;
      if (s.tagName === "LINK") {
        l = e.createElement("link");
        for (const d of Array.from(s.attributes || []))
          (d == null ? void 0 : d.name) !== "href" && l.setAttribute(d.name, d.value);
        l.setAttribute("href", s.href || s.getAttribute("href") || "");
      } else
        l = e.importNode(s, !0);
      l.setAttribute("data-mjr-popout-cloned-style", "1"), e.head.appendChild(l);
    } catch (l) {
      (i = console.debug) == null || i.call(console, l);
    }
  const n = e.createElement("style");
  n.setAttribute("data-mjr-popout-cloned-style", "1"), n.textContent = `
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
            display: flex !important;
            opacity: 1 !important;
            visibility: visible !important;
            pointer-events: auto !important;
            transform: none !important;
            transition: none !important;
        }
    `, e.head.appendChild(n);
}
function ge(t, { closePopupWindow: e = !0 } = {}) {
  var i, s, l, d;
  if (t._desktopExpanded) {
    t._setDesktopExpanded(!1);
    return;
  }
  if (!t._isPopped || !t.element) return;
  const n = t._popoutWindow;
  t._clearPopoutCloseWatch();
  try {
    (i = t._popoutAC) == null || i.abort();
  } catch (u) {
    (s = console.debug) == null || s.call(console, u);
  }
  t._popoutAC = null, t._popoutCloseHandler = null, t._popoutKeydownHandler = null, t._isPopped = !1;
  let o = t.element;
  try {
    o = (o == null ? void 0 : o.ownerDocument) === document ? o : document.adoptNode(o);
  } catch (u) {
    (l = console.debug) == null || l.call(console, "[MFV] pop-in adopt failed", u);
  }
  if (document.body.appendChild(o), t._resetGenDropdownForCurrentDocument(), t._rebindControlHandlers(), t._bindPanelInteractions(), t._bindDocumentUiHandlers(), o.classList.add("is-visible"), o.setAttribute("aria-hidden", "false"), t.isVisible = !0, t._updatePopoutBtnUI(), e)
    try {
      n == null || n.close();
    } catch (u) {
      (d = console.debug) == null || d.call(console, u);
    }
  t._popoutWindow = null;
}
function be(t) {
  if (!t._popoutBtn) return;
  const e = t._isPopped || t._desktopExpanded;
  t.element && t.element.classList.toggle("mjr-mfv--popped", e), t._popoutBtn.classList.toggle("mjr-popin-active", e);
  const n = t._popoutBtn.querySelector("i") || document.createElement("i"), o = e ? B("tooltip.popInViewer", "Return to floating panel") : B("tooltip.popOutViewer", "Pop out viewer to separate window");
  n.className = e ? "pi pi-sign-in" : "pi pi-external-link", t._popoutBtn.title = o, t._popoutBtn.setAttribute("aria-label", o), t._popoutBtn.setAttribute("aria-pressed", String(e)), t._popoutBtn.contains(n) || t._popoutBtn.replaceChildren(n);
}
function ye(t) {
  return {
    n: "ns-resize",
    s: "ns-resize",
    e: "ew-resize",
    w: "ew-resize",
    ne: "nesw-resize",
    nw: "nwse-resize",
    se: "nwse-resize",
    sw: "nesw-resize"
  }[t] || "";
}
function Ce(t, e, n) {
  if (!n) return "";
  const o = t <= n.left + R, i = t >= n.right - R, s = e <= n.top + R, l = e >= n.bottom - R;
  return s && o ? "nw" : s && i ? "ne" : l && o ? "sw" : l && i ? "se" : s ? "n" : l ? "s" : o ? "w" : i ? "e" : "";
}
function Ee(t) {
  var e, n;
  if (t.element) {
    if (((e = t._resizeState) == null ? void 0 : e.pointerId) != null)
      try {
        t.element.releasePointerCapture(t._resizeState.pointerId);
      } catch (o) {
        (n = console.debug) == null || n.call(console, o);
      }
    t._resizeState = null, t.element.classList.remove("mjr-mfv--resizing"), t.element.style.cursor = "";
  }
}
function Ae(t) {
  var e, n;
  if (t.element) {
    t._stopEdgeResize();
    try {
      (e = t._panelAC) == null || e.abort();
    } catch (o) {
      (n = console.debug) == null || n.call(console, o);
    }
    t._panelAC = new AbortController(), t._initEdgeResize(t.element), t._initDrag(t.element.querySelector(".mjr-mfv-header"));
  }
}
function Se(t, e) {
  var d;
  if (!e) return;
  const n = (u) => {
    if (!t.element || t._isPopped) return "";
    const a = t.element.getBoundingClientRect();
    return t._getResizeDirectionFromPoint(u.clientX, u.clientY, a);
  }, o = (d = t._panelAC) == null ? void 0 : d.signal, i = (u) => {
    var f;
    if (u.button !== 0 || !t.element || t._isPopped) return;
    const a = n(u);
    if (!a) return;
    u.preventDefault(), u.stopPropagation();
    const c = t.element.getBoundingClientRect(), r = window.getComputedStyle(t.element), h = Math.max(120, Number.parseFloat(r.minWidth) || 0), m = Math.max(100, Number.parseFloat(r.minHeight) || 0);
    t._resizeState = {
      pointerId: u.pointerId,
      dir: a,
      startX: u.clientX,
      startY: u.clientY,
      startLeft: c.left,
      startTop: c.top,
      startWidth: c.width,
      startHeight: c.height,
      minWidth: h,
      minHeight: m
    }, t.element.style.left = `${Math.round(c.left)}px`, t.element.style.top = `${Math.round(c.top)}px`, t.element.style.right = "auto", t.element.style.bottom = "auto", t.element.classList.add("mjr-mfv--resizing"), t.element.style.cursor = t._resizeCursorForDirection(a);
    try {
      t.element.setPointerCapture(u.pointerId);
    } catch (p) {
      (f = console.debug) == null || f.call(console, p);
    }
  }, s = (u) => {
    if (!t.element || t._isPopped) return;
    const a = t._resizeState;
    if (!a) {
      const _ = n(u);
      t.element.style.cursor = _ ? t._resizeCursorForDirection(_) : "";
      return;
    }
    if (a.pointerId !== u.pointerId) return;
    const c = u.clientX - a.startX, r = u.clientY - a.startY;
    let h = a.startWidth, m = a.startHeight, f = a.startLeft, p = a.startTop;
    a.dir.includes("e") && (h = a.startWidth + c), a.dir.includes("s") && (m = a.startHeight + r), a.dir.includes("w") && (h = a.startWidth - c, f = a.startLeft + c), a.dir.includes("n") && (m = a.startHeight - r, p = a.startTop + r), h < a.minWidth && (a.dir.includes("w") && (f -= a.minWidth - h), h = a.minWidth), m < a.minHeight && (a.dir.includes("n") && (p -= a.minHeight - m), m = a.minHeight), h = Math.min(h, Math.max(a.minWidth, window.innerWidth)), m = Math.min(m, Math.max(a.minHeight, window.innerHeight)), f = Math.min(Math.max(0, f), Math.max(0, window.innerWidth - h)), p = Math.min(Math.max(0, p), Math.max(0, window.innerHeight - m)), t.element.style.width = `${Math.round(h)}px`, t.element.style.height = `${Math.round(m)}px`, t.element.style.left = `${Math.round(f)}px`, t.element.style.top = `${Math.round(p)}px`, t.element.style.right = "auto", t.element.style.bottom = "auto";
  }, l = (u) => {
    if (!t.element || !t._resizeState || t._resizeState.pointerId !== u.pointerId) return;
    const a = n(u);
    t._stopEdgeResize(), a && (t.element.style.cursor = t._resizeCursorForDirection(a));
  };
  e.addEventListener("pointerdown", i, { capture: !0, signal: o }), e.addEventListener("pointermove", s, { signal: o }), e.addEventListener("pointerup", l, { signal: o }), e.addEventListener("pointercancel", l, { signal: o }), e.addEventListener(
    "pointerleave",
    () => {
      !t._resizeState && t.element && (t.element.style.cursor = "");
    },
    { signal: o }
  );
}
function Be(t, e) {
  var i;
  if (!e) return;
  const n = (i = t._panelAC) == null ? void 0 : i.signal;
  let o = null;
  e.addEventListener(
    "pointerdown",
    (s) => {
      if (s.button !== 0 || s.target.closest("button") || s.target.closest("select") || t._isPopped || !t.element || t._getResizeDirectionFromPoint(
        s.clientX,
        s.clientY,
        t.element.getBoundingClientRect()
      )) return;
      s.preventDefault(), e.setPointerCapture(s.pointerId);
      try {
        o == null || o.abort();
      } catch {
      }
      o = new AbortController();
      const d = o.signal, u = t.element, a = u.getBoundingClientRect(), c = s.clientX - a.left, r = s.clientY - a.top, h = (f) => {
        const p = Math.min(
          window.innerWidth - u.offsetWidth,
          Math.max(0, f.clientX - c)
        ), _ = Math.min(
          window.innerHeight - u.offsetHeight,
          Math.max(0, f.clientY - r)
        );
        u.style.left = `${p}px`, u.style.top = `${_}px`, u.style.right = "auto", u.style.bottom = "auto";
      }, m = () => {
        try {
          o == null || o.abort();
        } catch {
        }
      };
      e.addEventListener("pointermove", h, { signal: d }), e.addEventListener("pointerup", m, { signal: d });
    },
    n ? { signal: n } : void 0
  );
}
async function Pe(t, e, n, o, i, s, l, d) {
  var m, f, p, _, g;
  if (!n) return;
  const u = L(n);
  let a = null;
  if (u === "video" && (a = d instanceof HTMLVideoElement ? d : ((m = t._contentEl) == null ? void 0 : m.querySelector("video")) || null), !a && u === "model3d") {
    const y = (n == null ? void 0 : n.id) != null ? String(n.id) : "";
    y && (a = ((p = (f = t._contentEl) == null ? void 0 : f.querySelector) == null ? void 0 : p.call(
      f,
      `.mjr-model3d-render-canvas[data-mjr-asset-id="${y}"]`
    )) || null), a || (a = ((g = (_ = t._contentEl) == null ? void 0 : _.querySelector) == null ? void 0 : g.call(_, ".mjr-model3d-render-canvas")) || null);
  }
  if (!a) {
    const y = nt(n);
    if (!y) return;
    a = await new Promise((C) => {
      const E = new Image();
      E.crossOrigin = "anonymous", E.onload = () => C(E), E.onerror = () => C(null), E.src = y;
    });
  }
  if (!a) return;
  const c = a.videoWidth || a.naturalWidth || s, r = a.videoHeight || a.naturalHeight || l;
  if (!c || !r) return;
  const h = Math.min(s / c, l / r);
  e.drawImage(
    a,
    o + (s - c * h) / 2,
    i + (l - r * h) / 2,
    c * h,
    r * h
  );
}
function Me(t, e, n, o) {
  if (!e || !n || !t._genInfoSelections.size) return 0;
  const i = t._getGenFields(n), s = [
    "prompt",
    "seed",
    "model",
    "lora",
    "sampler",
    "scheduler",
    "cfg",
    "step",
    "genTime"
  ], l = 11, d = 16, u = 8, a = Math.max(100, Number(o || 0) - u * 2);
  let c = 0;
  for (const r of s) {
    if (!t._genInfoSelections.has(r)) continue;
    const h = i[r] != null ? String(i[r]) : "";
    if (!h) continue;
    let m = r.charAt(0).toUpperCase() + r.slice(1);
    r === "lora" ? m = "LoRA" : r === "cfg" ? m = "CFG" : r === "genTime" && (m = "Gen Time");
    const f = `${m}: `;
    e.font = `bold ${l}px system-ui, sans-serif`;
    const p = e.measureText(f).width;
    e.font = `${l}px system-ui, sans-serif`;
    const _ = Math.max(32, a - u * 2 - p);
    let g = 0, y = "";
    for (const C of h.split(" ")) {
      const E = y ? y + " " + C : C;
      e.measureText(E).width > _ && y ? (g += 1, y = C) : y = E;
    }
    y && (g += 1), c += g;
  }
  return c > 0 ? c * d + u * 2 : 0;
}
function Ie(t, e, n, o, i, s, l) {
  if (!n || !t._genInfoSelections.size) return;
  const d = t._getGenFields(n), u = {
    prompt: "#7ec8ff",
    seed: "#ffd47a",
    model: "#7dda8a",
    lora: "#d48cff",
    sampler: "#ff9f7a",
    scheduler: "#ff7a9f",
    cfg: "#7a9fff",
    step: "#7affd4",
    genTime: "#e0ff7a"
  }, a = [
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
  for (const A of a) {
    if (!t._genInfoSelections.has(A)) continue;
    const M = d[A] != null ? String(d[A]) : "";
    if (!M) continue;
    let P = A.charAt(0).toUpperCase() + A.slice(1);
    A === "lora" ? P = "LoRA" : A === "cfg" ? P = "CFG" : A === "genTime" && (P = "Gen Time"), c.push({
      label: `${P}: `,
      value: M,
      color: u[A] || "#ffffff"
    });
  }
  if (!c.length) return;
  const r = 11, h = 16, m = 8, f = Math.max(100, s - m * 2);
  e.save();
  const p = [];
  for (const { label: A, value: M, color: P } of c) {
    e.font = `bold ${r}px system-ui, sans-serif`;
    const D = e.measureText(A).width;
    e.font = `${r}px system-ui, sans-serif`;
    const x = f - m * 2 - D, z = [];
    let F = "";
    for (const W of M.split(" ")) {
      const Q = F ? F + " " + W : W;
      e.measureText(Q).width > x && F ? (z.push(F), F = W) : F = Q;
    }
    F && z.push(F), p.push({ label: A, labelW: D, lines: z, color: P });
  }
  const g = p.reduce((A, M) => A + M.lines.length, 0) * h + m * 2, y = o + m, C = i + l - g - m;
  e.globalAlpha = 0.72, e.fillStyle = "#000", ot(e, y, C, f, g, 6), e.fill(), e.globalAlpha = 1;
  let E = C + m + r;
  for (const { label: A, labelW: M, lines: P, color: D } of p)
    for (let x = 0; x < P.length; x++)
      x === 0 ? (e.font = `bold ${r}px system-ui, sans-serif`, e.fillStyle = D, e.fillText(A, y + m, E), e.font = `${r}px system-ui, sans-serif`, e.fillStyle = "rgba(255,255,255,0.88)", e.fillText(P[x], y + m + M, E)) : (e.font = `${r}px system-ui, sans-serif`, e.fillStyle = "rgba(255,255,255,0.88)", e.fillText(P[x], y + m + M, E)), E += h;
  e.restore();
}
async function Ne(t) {
  var u;
  if (!t._contentEl) return;
  t._captureBtn && (t._captureBtn.disabled = !0, t._captureBtn.setAttribute("aria-label", B("tooltip.capturingView", "Capturing…")));
  const e = t._contentEl.clientWidth || 480, n = t._contentEl.clientHeight || 360;
  let o = n;
  if (t._mode === b.SIMPLE && t._mediaA && t._genInfoSelections.size) {
    const a = document.createElement("canvas");
    a.width = e, a.height = n;
    const c = a.getContext("2d"), r = t._estimateGenInfoOverlayHeight(c, t._mediaA, e);
    if (r > 0) {
      const h = Math.max(n, r + 24);
      o = Math.min(h, n * 4);
    }
  }
  const i = document.createElement("canvas");
  i.width = e, i.height = o;
  const s = i.getContext("2d");
  s.fillStyle = "#0d0d0d", s.fillRect(0, 0, e, o);
  try {
    if (t._mode === b.SIMPLE)
      t._mediaA && (await t._drawMediaFit(s, t._mediaA, 0, 0, e, n), t._drawGenInfoOverlay(s, t._mediaA, 0, 0, e, o));
    else if (t._mode === b.AB) {
      const a = Math.round(t._abDividerX * e), c = t._contentEl.querySelector(
        ".mjr-mfv-ab-layer:not(.mjr-mfv-ab-layer--b) video"
      ), r = t._contentEl.querySelector(".mjr-mfv-ab-layer--b video");
      t._mediaA && await t._drawMediaFit(s, t._mediaA, 0, 0, e, o, c), t._mediaB && (s.save(), s.beginPath(), s.rect(a, 0, e - a, o), s.clip(), await t._drawMediaFit(s, t._mediaB, 0, 0, e, o, r), s.restore()), s.save(), s.strokeStyle = "rgba(255,255,255,0.88)", s.lineWidth = 2, s.beginPath(), s.moveTo(a, 0), s.lineTo(a, o), s.stroke(), s.restore(), G(s, "A", 8, 8), G(s, "B", a + 8, 8), t._mediaA && t._drawGenInfoOverlay(s, t._mediaA, 0, 0, a, o), t._mediaB && t._drawGenInfoOverlay(s, t._mediaB, a, 0, e - a, o);
    } else if (t._mode === b.SIDE) {
      const a = Math.floor(e / 2), c = t._contentEl.querySelector(".mjr-mfv-side-panel:first-child video"), r = t._contentEl.querySelector(".mjr-mfv-side-panel:last-child video");
      t._mediaA && (await t._drawMediaFit(s, t._mediaA, 0, 0, a, o, c), t._drawGenInfoOverlay(s, t._mediaA, 0, 0, a, o)), s.fillStyle = "#111", s.fillRect(a, 0, 2, o), t._mediaB && (await t._drawMediaFit(s, t._mediaB, a, 0, a, o, r), t._drawGenInfoOverlay(s, t._mediaB, a, 0, a, o)), G(s, "A", 8, 8), G(s, "B", a + 8, 8);
    } else if (t._mode === b.GRID) {
      const a = Math.floor(e / 2), c = Math.floor(o / 2), r = 1, h = [
        { media: t._mediaA, label: "A", x: 0, y: 0, w: a - r, h: c - r },
        {
          media: t._mediaB,
          label: "B",
          x: a + r,
          y: 0,
          w: a - r,
          h: c - r
        },
        {
          media: t._mediaC,
          label: "C",
          x: 0,
          y: c + r,
          w: a - r,
          h: c - r
        },
        {
          media: t._mediaD,
          label: "D",
          x: a + r,
          y: c + r,
          w: a - r,
          h: c - r
        }
      ], m = t._contentEl.querySelectorAll(".mjr-mfv-grid-cell");
      for (let f = 0; f < h.length; f++) {
        const p = h[f], _ = ((u = m[f]) == null ? void 0 : u.querySelector("video")) || null;
        p.media && (await t._drawMediaFit(s, p.media, p.x, p.y, p.w, p.h, _), t._drawGenInfoOverlay(s, p.media, p.x, p.y, p.w, p.h)), G(s, p.label, p.x + 8, p.y + 8);
      }
      s.save(), s.fillStyle = "#111", s.fillRect(a - r, 0, r * 2, o), s.fillRect(0, c - r, e, r * 2), s.restore();
    }
  } catch (a) {
    console.debug("[MFV] capture error:", a);
  }
  const d = `${{
    [b.AB]: "mfv-ab",
    [b.SIDE]: "mfv-side",
    [b.GRID]: "mfv-grid"
  }[t._mode] ?? "mfv"}-${Date.now()}.png`;
  try {
    const a = i.toDataURL("image/png"), c = document.createElement("a");
    c.href = a, c.download = d, document.body.appendChild(c), c.click(), setTimeout(() => document.body.removeChild(c), 100);
  } catch (a) {
    console.warn("[MFV] download failed:", a);
  } finally {
    t._captureBtn && (t._captureBtn.disabled = !1, t._captureBtn.setAttribute("aria-label", B("tooltip.captureView", "Save view as image")));
  }
}
function Fe(t, e, { autoMode: n = !1 } = {}) {
  if (t._mediaA = e || null, t._resetMfvZoom(), n && t._mode !== b.SIMPLE && (t._mode = b.SIMPLE, t._updateModeBtnUI()), t._mediaA && typeof H == "function") {
    const o = ++t._refreshGen;
    (async () => {
      var i;
      try {
        const s = await H(t._mediaA, {
          getAssetMetadata: J,
          getFileMetadataScoped: Z
        });
        if (t._refreshGen !== o) return;
        s && typeof s == "object" && (t._mediaA = s, t._refresh());
      } catch (s) {
        (i = console.debug) == null || i.call(console, "[MFV] metadata enrich error", s);
      }
    })();
  } else
    t._refresh();
}
function Le(t, e, n) {
  t._mediaA = e || null, t._mediaB = n || null, t._resetMfvZoom(), t._mode === b.SIMPLE && (t._mode = b.AB, t._updateModeBtnUI());
  const o = ++t._refreshGen, i = async (s) => {
    if (!s) return s;
    try {
      return await H(s, {
        getAssetMetadata: J,
        getFileMetadataScoped: Z
      }) || s;
    } catch {
      return s;
    }
  };
  (async () => {
    const [s, l] = await Promise.all([i(t._mediaA), i(t._mediaB)]);
    t._refreshGen === o && (t._mediaA = s || null, t._mediaB = l || null, t._refresh());
  })();
}
function xe(t, e, n, o, i) {
  t._mediaA = e || null, t._mediaB = n || null, t._mediaC = o || null, t._mediaD = i || null, t._resetMfvZoom(), t._mode !== b.GRID && (t._mode = b.GRID, t._updateModeBtnUI());
  const s = ++t._refreshGen, l = async (d) => {
    if (!d) return d;
    try {
      return await H(d, {
        getAssetMetadata: J,
        getFileMetadataScoped: Z
      }) || d;
    } catch {
      return d;
    }
  };
  (async () => {
    const [d, u, a, c] = await Promise.all([
      l(t._mediaA),
      l(t._mediaB),
      l(t._mediaC),
      l(t._mediaD)
    ]);
    t._refreshGen === s && (t._mediaA = d || null, t._mediaB = u || null, t._mediaC = a || null, t._mediaD = c || null, t._refresh());
  })();
}
let ke = 0;
class Te {
  constructor({ controller: e = null } = {}) {
    this._instanceId = ++ke, this._controller = e && typeof e == "object" ? { ...e } : null, this.element = null, this.isVisible = !1, this._contentEl = null, this._closeBtn = null, this._modeBtn = null, this._pinGroup = null, this._pinBtns = null, this._liveBtn = null, this._genBtn = null, this._genDropdown = null, this._captureBtn = null, this._genInfoSelections = /* @__PURE__ */ new Set(["genTime"]), this._mode = b.SIMPLE, this._mediaA = null, this._mediaB = null, this._mediaC = null, this._mediaD = null, this._pinnedSlots = /* @__PURE__ */ new Set(), this._abDividerX = 0.5, this._zoom = 1, this._panX = 0, this._panY = 0, this._panzoomAC = null, this._dragging = !1, this._compareSyncAC = null, this._btnAC = null, this._refreshGen = 0, this._popoutWindow = null, this._popoutBtn = null, this._isPopped = !1, this._desktopExpanded = !1, this._desktopExpandRestore = null, this._desktopPopoutUnsupported = !1, this._popoutCloseHandler = null, this._popoutKeydownHandler = null, this._popoutCloseTimer = null, this._popoutRestoreGuard = !1, this._previewBtn = null, this._previewBlobUrl = null, this._previewActive = !1, this._nodeStreamBtn = null, this._nodeStreamActive = !1, this._docAC = new AbortController(), this._popoutAC = null, this._panelAC = new AbortController(), this._resizeState = null, this._titleId = `mjr-mfv-title-${this._instanceId}`, this._genDropdownId = `mjr-mfv-gen-dropdown-${this._instanceId}`, this._docClickHost = null, this._handleDocClick = null;
  }
  _dispatchControllerAction(e, n) {
    var o, i, s;
    try {
      const l = (o = this._controller) == null ? void 0 : o[e];
      if (typeof l == "function")
        return l();
    } catch (l) {
      (i = console.debug) == null || i.call(console, l);
    }
    if (n)
      try {
        window.dispatchEvent(new Event(n));
      } catch (l) {
        (s = console.debug) == null || s.call(console, l);
      }
  }
  _forwardKeydownToController(e) {
    var n, o, i;
    try {
      const s = (n = this._controller) == null ? void 0 : n.handleForwardedKeydown;
      if (typeof s == "function") {
        s(e);
        return;
      }
    } catch (s) {
      (o = console.debug) == null || o.call(console, s);
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
    } catch (s) {
      (i = console.debug) == null || i.call(console, s);
    }
  }
  // ── Build DOM ─────────────────────────────────────────────────────────────
  render() {
    return Vt(this);
  }
  _buildHeader() {
    return Tt(this);
  }
  _buildToolbar() {
    return Gt(this);
  }
  _rebindControlHandlers() {
    return Dt(this);
  }
  _updateSettingsBtnState(e) {
    return Rt(this, e);
  }
  _applySidebarPosition() {
    return Ot(this);
  }
  refreshSidebar() {
    var e;
    (e = this._sidebar) == null || e.refresh();
  }
  _resetGenDropdownForCurrentDocument() {
    return Ht(this);
  }
  _bindDocumentUiHandlers() {
    return Ut(this);
  }
  _unbindDocumentUiHandlers() {
    return zt(this);
  }
  _isGenDropdownOpen() {
    return Wt(this);
  }
  _openGenDropdown() {
    return $t(this);
  }
  _closeGenDropdown() {
    return Xt(this);
  }
  _updateGenBtnUI() {
    return qt(this);
  }
  _buildGenDropdown() {
    return Kt(this);
  }
  _getGenFields(e) {
    return Yt(this, e);
  }
  _buildGenInfoDOM(e) {
    return Zt(this, e);
  }
  _notifyModeChanged() {
    return Jt(this);
  }
  _cycleMode() {
    return Qt(this);
  }
  setMode(e) {
    return wt(this, e);
  }
  getPinnedSlots() {
    return vt(this);
  }
  _updatePinUI() {
    return te(this);
  }
  _updateModeBtnUI() {
    return ee(this);
  }
  setLiveActive(e) {
    return ne(this, e);
  }
  setPreviewActive(e) {
    return oe(this, e);
  }
  loadPreviewBlob(e) {
    return se(this, e);
  }
  _revokePreviewBlob() {
    return ie(this);
  }
  setNodeStreamActive(e) {
    return ae(this);
  }
  loadMediaA(e, { autoMode: n = !1 } = {}) {
    return Fe(this, e, { autoMode: n });
  }
  /**
   * Load two assets for compare modes.
   * Auto-switches from SIMPLE → AB on first call.
   */
  loadMediaPair(e, n) {
    return Le(this, e, n);
  }
  /**
   * Load up to 4 assets for grid compare mode.
   * Auto-switches to GRID mode if not already.
   */
  loadMediaQuad(e, n, o, i) {
    return xe(this, e, n, o, i);
  }
  /** Apply current zoom+pan state to all media elements (img/video only — divider/overlays unaffected). */
  _applyTransform() {
    if (!this._contentEl) return;
    const e = Math.max(q, Math.min(K, this._zoom)), n = this._contentEl.clientWidth || 0, o = this._contentEl.clientHeight || 0, i = Math.max(0, (e - 1) * n / 2), s = Math.max(0, (e - 1) * o / 2);
    this._panX = Math.max(-i, Math.min(i, this._panX)), this._panY = Math.max(-s, Math.min(s, this._panY));
    const l = `translate(${this._panX}px,${this._panY}px) scale(${e})`;
    for (const d of this._contentEl.querySelectorAll(".mjr-mfv-media"))
      d != null && d._mjrDisableViewerTransform || (d.style.transform = l, d.style.transformOrigin = "center");
    this._contentEl.classList.remove("mjr-mfv-content--grab", "mjr-mfv-content--grabbing"), e > 1.01 && this._contentEl.classList.add(
      this._dragging ? "mjr-mfv-content--grabbing" : "mjr-mfv-content--grab"
    );
  }
  /**
   * Set zoom, optionally centered at (clientX, clientY).
   * Keeps the image point under the cursor stationary.
   */
  _setMfvZoom(e, n, o) {
    const i = Math.max(q, Math.min(K, this._zoom)), s = Math.max(q, Math.min(K, Number(e) || 1));
    if (n != null && o != null && this._contentEl) {
      const l = s / i, d = this._contentEl.getBoundingClientRect(), u = n - (d.left + d.width / 2), a = o - (d.top + d.height / 2);
      this._panX = this._panX * l + (1 - l) * u, this._panY = this._panY * l + (1 - l) * a;
    }
    this._zoom = s, Math.abs(s - 1) < 1e-3 && (this._zoom = 1, this._panX = 0, this._panY = 0), this._applyTransform();
  }
  /** Bind wheel + pointer events to the clip viewport element. */
  _initPanZoom(e) {
    if (this._destroyPanZoom(), !e) return;
    this._panzoomAC = new AbortController();
    const n = { signal: this._panzoomAC.signal };
    e.addEventListener(
      "wheel",
      (a) => {
        var m, f;
        if ((f = (m = a.target) == null ? void 0 : m.closest) != null && f.call(m, "audio") || X(a.target)) return;
        const c = yt(a.target, e);
        if (c && Ct(
          c,
          Number(a.deltaX || 0),
          Number(a.deltaY || 0)
        ))
          return;
        a.preventDefault();
        const h = 1 - (a.deltaY || a.deltaX || 0) * pt;
        this._setMfvZoom(this._zoom * h, a.clientX, a.clientY);
      },
      { ...n, passive: !1 }
    );
    let o = !1, i = 0, s = 0, l = 0, d = 0;
    e.addEventListener(
      "pointerdown",
      (a) => {
        var c, r, h, m, f, p, _;
        if (!(a.button !== 0 && a.button !== 1) && !(this._zoom <= 1.01) && !((r = (c = a.target) == null ? void 0 : c.closest) != null && r.call(c, "video")) && !((m = (h = a.target) == null ? void 0 : h.closest) != null && m.call(h, "audio")) && !((p = (f = a.target) == null ? void 0 : f.closest) != null && p.call(f, ".mjr-mfv-ab-divider")) && !X(a.target)) {
          a.preventDefault(), o = !0, this._dragging = !0, i = a.clientX, s = a.clientY, l = this._panX, d = this._panY;
          try {
            e.setPointerCapture(a.pointerId);
          } catch (g) {
            (_ = console.debug) == null || _.call(console, g);
          }
          this._applyTransform();
        }
      },
      n
    ), e.addEventListener(
      "pointermove",
      (a) => {
        o && (this._panX = l + (a.clientX - i), this._panY = d + (a.clientY - s), this._applyTransform());
      },
      n
    );
    const u = (a) => {
      var c;
      if (o) {
        o = !1, this._dragging = !1;
        try {
          e.releasePointerCapture(a.pointerId);
        } catch (r) {
          (c = console.debug) == null || c.call(console, r);
        }
        this._applyTransform();
      }
    };
    e.addEventListener("pointerup", u, n), e.addEventListener("pointercancel", u, n), e.addEventListener(
      "dblclick",
      (a) => {
        var r, h, m, f;
        if ((h = (r = a.target) == null ? void 0 : r.closest) != null && h.call(r, "video") || (f = (m = a.target) == null ? void 0 : m.closest) != null && f.call(m, "audio") || X(a.target)) return;
        const c = Math.abs(this._zoom - 1) < 0.05;
        this._setMfvZoom(c ? Math.min(4, this._zoom * 4) : 1, a.clientX, a.clientY);
      },
      n
    );
  }
  /** Remove all pan/zoom event listeners. */
  _destroyPanZoom() {
    var e, n;
    try {
      (e = this._panzoomAC) == null || e.abort();
    } catch (o) {
      (n = console.debug) == null || n.call(console, o);
    }
    this._panzoomAC = null, this._dragging = !1;
  }
  _destroyCompareSync() {
    var e, n, o;
    try {
      (n = (e = this._compareSyncAC) == null ? void 0 : e.abort) == null || n.call(e);
    } catch (i) {
      (o = console.debug) == null || o.call(console, i);
    }
    this._compareSyncAC = null;
  }
  _initCompareSync() {
    var e;
    if (this._destroyCompareSync(), !!this._contentEl && this._mode !== b.SIMPLE)
      try {
        const n = Array.from(this._contentEl.querySelectorAll("video, audio"));
        if (n.length < 2) return;
        const o = n[0] || null, i = n.slice(1);
        if (!o || !i.length) return;
        this._compareSyncAC = ut(o, i, { threshold: 0.08 });
      } catch (n) {
        (e = console.debug) == null || e.call(console, n);
      }
  }
  // ── Render ────────────────────────────────────────────────────────────────
  _refresh() {
    if (this._contentEl) {
      switch (this._destroyPanZoom(), this._destroyCompareSync(), this._contentEl.replaceChildren(), this._contentEl.style.overflow = "hidden", this._mode) {
        case b.SIMPLE:
          this._renderSimple();
          break;
        case b.AB:
          this._renderAB();
          break;
        case b.SIDE:
          this._renderSide();
          break;
        case b.GRID:
          this._renderGrid();
          break;
      }
      this._applyTransform(), this._initPanZoom(this._contentEl), this._initCompareSync();
    }
  }
  _renderSimple() {
    if (!this._mediaA) {
      this._contentEl.appendChild(N());
      return;
    }
    const e = L(this._mediaA), n = j(this._mediaA);
    if (!n) {
      this._contentEl.appendChild(N("Could not load media"));
      return;
    }
    const o = document.createElement("div");
    if (o.className = "mjr-mfv-simple-container", o.appendChild(n), e !== "audio") {
      const i = this._buildGenInfoDOM(this._mediaA);
      if (i) {
        const s = document.createElement("div");
        s.className = "mjr-mfv-geninfo", s.appendChild(i), o.appendChild(s);
      }
    }
    this._contentEl.appendChild(o);
  }
  _renderAB() {
    var p;
    const e = this._mediaA ? j(this._mediaA, { fill: !0 }) : null, n = this._mediaB ? j(this._mediaB, { fill: !0 }) : null, o = this._mediaA ? L(this._mediaA) : "", i = this._mediaB ? L(this._mediaB) : "";
    if (!e && !n) {
      this._contentEl.appendChild(N("Select 2 assets for A/B compare"));
      return;
    }
    if (!n) {
      this._renderSimple();
      return;
    }
    if (o === "audio" || i === "audio" || o === "model3d" || i === "model3d") {
      this._renderSide();
      return;
    }
    const s = document.createElement("div");
    s.className = "mjr-mfv-ab-container";
    const l = document.createElement("div");
    l.className = "mjr-mfv-ab-layer", e && l.appendChild(e);
    const d = document.createElement("div");
    d.className = "mjr-mfv-ab-layer mjr-mfv-ab-layer--b";
    const u = Math.round(this._abDividerX * 100);
    d.style.clipPath = `inset(0 0 0 ${u}%)`, d.appendChild(n);
    const a = document.createElement("div");
    a.className = "mjr-mfv-ab-divider", a.style.left = `${u}%`;
    const c = this._buildGenInfoDOM(this._mediaA);
    let r = null;
    c && (r = document.createElement("div"), r.className = "mjr-mfv-geninfo-a", r.appendChild(c), r.style.right = `calc(${100 - u}% + 8px)`);
    const h = this._buildGenInfoDOM(this._mediaB);
    let m = null;
    h && (m = document.createElement("div"), m.className = "mjr-mfv-geninfo-b", m.appendChild(h), m.style.left = `calc(${u}% + 8px)`);
    let f = null;
    a.addEventListener(
      "pointerdown",
      (_) => {
        _.preventDefault(), a.setPointerCapture(_.pointerId);
        try {
          f == null || f.abort();
        } catch {
        }
        f = new AbortController();
        const g = f.signal, y = s.getBoundingClientRect(), C = (A) => {
          const M = Math.max(0.02, Math.min(0.98, (A.clientX - y.left) / y.width));
          this._abDividerX = M;
          const P = Math.round(M * 100);
          d.style.clipPath = `inset(0 0 0 ${P}%)`, a.style.left = `${P}%`, r && (r.style.right = `calc(${100 - P}% + 8px)`), m && (m.style.left = `calc(${P}% + 8px)`);
        }, E = () => {
          try {
            f == null || f.abort();
          } catch {
          }
        };
        a.addEventListener("pointermove", C, { signal: g }), a.addEventListener("pointerup", E, { signal: g });
      },
      (p = this._panelAC) != null && p.signal ? { signal: this._panelAC.signal } : void 0
    ), s.appendChild(l), s.appendChild(d), s.appendChild(a), r && s.appendChild(r), m && s.appendChild(m), s.appendChild(k("A", "left")), s.appendChild(k("B", "right")), this._contentEl.appendChild(s);
  }
  _renderSide() {
    const e = this._mediaA ? j(this._mediaA) : null, n = this._mediaB ? j(this._mediaB) : null, o = this._mediaA ? L(this._mediaA) : "", i = this._mediaB ? L(this._mediaB) : "";
    if (!e && !n) {
      this._contentEl.appendChild(N("Select 2 assets for Side-by-Side"));
      return;
    }
    const s = document.createElement("div");
    s.className = "mjr-mfv-side-container";
    const l = document.createElement("div");
    l.className = "mjr-mfv-side-panel", e ? l.appendChild(e) : l.appendChild(N("—")), l.appendChild(k("A", "left"));
    const d = o === "audio" ? null : this._buildGenInfoDOM(this._mediaA);
    if (d) {
      const c = document.createElement("div");
      c.className = "mjr-mfv-geninfo-a", c.appendChild(d), l.appendChild(c);
    }
    const u = document.createElement("div");
    u.className = "mjr-mfv-side-panel", n ? u.appendChild(n) : u.appendChild(N("—")), u.appendChild(k("B", "right"));
    const a = i === "audio" ? null : this._buildGenInfoDOM(this._mediaB);
    if (a) {
      const c = document.createElement("div");
      c.className = "mjr-mfv-geninfo-b", c.appendChild(a), u.appendChild(c);
    }
    s.appendChild(l), s.appendChild(u), this._contentEl.appendChild(s);
  }
  _renderGrid() {
    const e = [
      { media: this._mediaA, label: "A" },
      { media: this._mediaB, label: "B" },
      { media: this._mediaC, label: "C" },
      { media: this._mediaD, label: "D" }
    ];
    if (!e.filter((i) => i.media).length) {
      this._contentEl.appendChild(N("Select up to 4 assets for Grid Compare"));
      return;
    }
    const o = document.createElement("div");
    o.className = "mjr-mfv-grid-container";
    for (const { media: i, label: s } of e) {
      const l = document.createElement("div");
      if (l.className = "mjr-mfv-grid-cell", i) {
        const d = L(i), u = j(i);
        if (u ? l.appendChild(u) : l.appendChild(N("—")), l.appendChild(
          k(s, s === "A" || s === "C" ? "left" : "right")
        ), d !== "audio") {
          const a = this._buildGenInfoDOM(i);
          if (a) {
            const c = document.createElement("div");
            c.className = `mjr-mfv-geninfo-${s.toLowerCase()}`, c.appendChild(a), l.appendChild(c);
          }
        }
      } else
        l.appendChild(N("—")), l.appendChild(
          k(s, s === "A" || s === "C" ? "left" : "right")
        );
      o.appendChild(l);
    }
    this._contentEl.appendChild(o);
  }
  // ── Visibility ────────────────────────────────────────────────────────────
  show() {
    this.element && (this._bindDocumentUiHandlers(), this.element.classList.add("is-visible"), this.element.setAttribute("aria-hidden", "false"), this.isVisible = !0);
  }
  hide() {
    this.element && (this._destroyPanZoom(), this._destroyCompareSync(), this._stopEdgeResize(), this._closeGenDropdown(), Et(this.element), this.element.classList.remove("is-visible"), this.element.setAttribute("aria-hidden", "true"), this.isVisible = !1);
  }
  // ── Pop-out / Pop-in (separate OS window for second monitor) ────────────
  _setDesktopExpanded(e) {
    return re(this, e);
  }
  _activateDesktopExpandedFallback(e) {
    return de(this, e);
  }
  _tryElectronPopupFallback(e, n, o, i) {
    return ce(this, e, n, o, i);
  }
  popOut() {
    return ue(this);
  }
  _fallbackPopout(e, n, o) {
    return pe(this, e, n, o);
  }
  _clearPopoutCloseWatch() {
    return me(this);
  }
  _startPopoutCloseWatch() {
    return he(this);
  }
  _schedulePopInFromPopupClose() {
    return fe(this);
  }
  _installPopoutStyles(e) {
    return _e(this, e);
  }
  popIn(e) {
    return ge(this, e);
  }
  _updatePopoutBtnUI() {
    return be(this);
  }
  get isPopped() {
    return this._isPopped || this._desktopExpanded;
  }
  _resizeCursorForDirection(e) {
    return ye(e);
  }
  _getResizeDirectionFromPoint(e, n, o) {
    return Ce(e, n, o);
  }
  _stopEdgeResize() {
    return Ee(this);
  }
  _bindPanelInteractions() {
    return Ae(this);
  }
  _initEdgeResize(e) {
    return Se(this, e);
  }
  _initDrag(e) {
    return Be(this, e);
  }
  async _drawMediaFit(e, n, o, i, s, l, d) {
    return Pe(this, e, n, o, i, s, l, d);
  }
  _estimateGenInfoOverlayHeight(e, n, o) {
    return Me(this, e, n, o);
  }
  _drawGenInfoOverlay(e, n, o, i, s, l) {
    return Ie(this, e, n, o, i, s, l);
  }
  async _captureView() {
    return Ne(this);
  }
  dispose() {
    var e, n, o, i, s, l, d, u, a, c, r, h, m, f, p, _, g, y;
    this._destroyPanZoom(), this._destroyCompareSync(), this._stopEdgeResize(), this._clearPopoutCloseWatch();
    try {
      (e = this._panelAC) == null || e.abort(), this._panelAC = null;
    } catch (C) {
      (n = console.debug) == null || n.call(console, C);
    }
    try {
      (o = this._btnAC) == null || o.abort(), this._btnAC = null;
    } catch (C) {
      (i = console.debug) == null || i.call(console, C);
    }
    try {
      (s = this._docAC) == null || s.abort(), this._docAC = null;
    } catch (C) {
      (l = console.debug) == null || l.call(console, C);
    }
    try {
      (d = this._popoutAC) == null || d.abort(), this._popoutAC = null;
    } catch (C) {
      (u = console.debug) == null || u.call(console, C);
    }
    try {
      (a = this._panzoomAC) == null || a.abort(), this._panzoomAC = null;
    } catch (C) {
      (c = console.debug) == null || c.call(console, C);
    }
    try {
      (h = (r = this._compareSyncAC) == null ? void 0 : r.abort) == null || h.call(r), this._compareSyncAC = null;
    } catch (C) {
      (m = console.debug) == null || m.call(console, C);
    }
    try {
      this._isPopped && this.popIn();
    } catch (C) {
      (f = console.debug) == null || f.call(console, C);
    }
    this._revokePreviewBlob(), this._onSidebarPosChanged && (window.removeEventListener("mjr-settings-changed", this._onSidebarPosChanged), this._onSidebarPosChanged = null);
    try {
      (p = this.element) == null || p.remove();
    } catch (C) {
      (_ = console.debug) == null || _.call(console, C);
    }
    this.element = null, this._contentEl = null, this._closeBtn = null, this._modeBtn = null, this._pinGroup = null, this._pinBtns = null, this._liveBtn = null, this._nodeStreamBtn = null, this._popoutBtn = null, this._captureBtn = null, this._unbindDocumentUiHandlers();
    try {
      (g = this._genDropdown) == null || g.remove();
    } catch (C) {
      (y = console.debug) == null || y.call(console, C);
    }
    this._mediaA = null, this._mediaB = null, this._mediaC = null, this._mediaD = null, this.isVisible = !1;
  }
}
export {
  Te as FloatingViewer,
  b as MFV_MODES
};
