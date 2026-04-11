import { M as it, c as lt, p as at, q as rt, A as D, t as z, u as B, v as dt, x as ct, y as ut, z as H, E as j, n as pt, s as X, B as Z, C as mt, D as J, F as Q, d as q, G as ht, H as _t } from "./entry-DIM8t5W4.js";
import { ensureViewerMetadataAsset as U } from "./genInfo-B_4Ly5zZ.js";
const b = Object.freeze({
  SIMPLE: "simple",
  AB: "ab",
  SIDE: "side",
  GRID: "grid"
}), K = 0.25, Y = 8, ft = 8e-4, O = 8, gt = "C", tt = "L", et = "K", bt = "N", yt = "Esc", Ct = /* @__PURE__ */ new Set([".mp4", ".webm", ".mov", ".avi", ".mkv"]), Et = /* @__PURE__ */ new Set([".mp3", ".wav", ".flac", ".ogg", ".m4a", ".aac", ".opus", ".wma"]);
function At(t) {
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
  const n = At((t == null ? void 0 : t.filename) || "");
  return n === ".gif" ? "gif" : Ct.has(n) ? "video" : Et.has(n) ? "audio" : it.has(n) ? "model3d" : "image";
}
function nt(t) {
  return t ? t.url ? String(t.url) : t.filename && t.id == null ? at(t.filename, t.subfolder || "", t.type || "output") : t.filename && rt(t) || "" : "";
}
function F(t = "No media — select assets in the grid") {
  const e = document.createElement("div");
  return e.className = "mjr-mfv-empty", e.textContent = t, e;
}
function k(t, e) {
  const n = document.createElement("div");
  return n.className = `mjr-mfv-label label-${e}`, n.textContent = t, n;
}
function v(t) {
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
function St(t, e) {
  var o, i;
  let n = t && t.nodeType === 1 ? t : (t == null ? void 0 : t.parentElement) || null;
  for (; n && n !== e; ) {
    try {
      const s = (o = window.getComputedStyle) == null ? void 0 : o.call(window, n), a = /(auto|scroll|overlay)/.test(String((s == null ? void 0 : s.overflowY) || "")), r = /(auto|scroll|overlay)/.test(String((s == null ? void 0 : s.overflowX) || ""));
      if (a || r)
        return n;
    } catch (s) {
      (i = console.debug) == null || i.call(console, s);
    }
    n = n.parentElement || null;
  }
  return null;
}
function Bt(t, e, n) {
  if (!t) return !1;
  if (Math.abs(Number(n) || 0) >= Math.abs(Number(e) || 0)) {
    const s = Number(t.scrollTop || 0), a = Math.max(0, Number(t.scrollHeight || 0) - Number(t.clientHeight || 0));
    if (n < 0 && s > 0 || n > 0 && s < a) return !0;
  }
  const o = Number(t.scrollLeft || 0), i = Math.max(0, Number(t.scrollWidth || 0) - Number(t.clientWidth || 0));
  return e < 0 && o > 0 || e > 0 && o < i;
}
function Pt(t) {
  var e, n, o, i;
  if (t)
    try {
      const s = (e = t.querySelectorAll) == null ? void 0 : e.call(t, "video, audio");
      if (!s || !s.length) return;
      for (const a of s)
        try {
          (n = a.pause) == null || n.call(a);
        } catch (r) {
          (o = console.debug) == null || o.call(console, r);
        }
    } catch (s) {
      (i = console.debug) == null || i.call(console, s);
    }
}
function V(t, { fill: e = !1 } = {}) {
  var a;
  const n = nt(t);
  if (!n) return null;
  const o = L(t), i = `mjr-mfv-media mjr-mfv-media--fit-height${e ? " mjr-mfv-media--fill" : ""}`;
  if (o === "audio") {
    const r = document.createElement("div");
    r.className = `mjr-mfv-audio-card${e ? " mjr-mfv-audio-card--fill" : ""}`;
    const u = document.createElement("div");
    u.className = "mjr-mfv-audio-head";
    const l = document.createElement("i");
    l.className = "pi pi-volume-up mjr-mfv-audio-icon", l.setAttribute("aria-hidden", "true");
    const c = document.createElement("div");
    c.className = "mjr-mfv-audio-title", c.textContent = String((t == null ? void 0 : t.filename) || "Audio"), u.appendChild(l), u.appendChild(c);
    const d = document.createElement("audio");
    d.className = "mjr-mfv-audio-player", d.src = n, d.controls = !0, d.autoplay = !0, d.preload = "metadata";
    try {
      d.addEventListener("loadedmetadata", () => v(d), { once: !0 });
    } catch (h) {
      (a = console.debug) == null || a.call(console, h);
    }
    return v(d), r.appendChild(u), r.appendChild(d), r;
  }
  if (o === "video") {
    const r = document.createElement("video");
    return r.className = i, r.src = n, r.controls = !0, r.loop = !0, r.muted = !0, r.autoplay = !0, r.playsInline = !0, r;
  }
  if (o === "model3d")
    return lt(t, n, {
      hostClassName: `mjr-model3d-host mjr-mfv-model3d-host${e ? " mjr-mfv-model3d-host--fill" : ""}`,
      canvasClassName: `mjr-mfv-media mjr-model3d-render-canvas${e ? " mjr-mfv-media--fill" : ""}`,
      hintText: "Rotate: left drag  Pan: right drag  Zoom: wheel or middle drag",
      disableViewerTransform: !0,
      pauseDuringExecution: !!D.FLOATING_VIEWER_PAUSE_DURING_EXECUTION
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
function Mt(t, e) {
  switch (String((t == null ? void 0 : t.type) || "").toLowerCase()) {
    case "number":
      return It(t, e);
    case "combo":
      return Ft(t, e);
    case "text":
    case "string":
    case "customtext":
      return Nt(t, e);
    case "toggle":
      return Lt(t, e);
    default:
      return xt(t);
  }
}
function T(t, e) {
  var o, i, s, a, r, u, l;
  if (!t) return !1;
  const n = String(t.type || "").toLowerCase();
  if (n === "number") {
    const c = Number(e);
    if (Number.isNaN(c)) return !1;
    const d = t.options ?? {}, h = d.min ?? -1 / 0, m = d.max ?? 1 / 0;
    t.value = Math.min(m, Math.max(h, c));
  } else n === "toggle" ? t.value = !!e : t.value = e;
  try {
    (o = t.callback) == null || o.call(t, t.value);
  } catch (c) {
    (i = console.debug) == null || i.call(console, c);
  }
  try {
    const c = z();
    (a = (s = c == null ? void 0 : c.canvas) == null ? void 0 : s.setDirty) == null || a.call(s, !0, !0), (u = (r = c == null ? void 0 : c.graph) == null ? void 0 : r.setDirtyCanvas) == null || u.call(r, !0, !0);
  } catch (c) {
    (l = console.debug) == null || l.call(console, c);
  }
  return !0;
}
function It(t, e) {
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
function Ft(t, e) {
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
    const a = document.createElement("option"), r = typeof s == "string" ? s : (s == null ? void 0 : s.content) ?? (s == null ? void 0 : s.value) ?? (s == null ? void 0 : s.text) ?? String(s);
    a.value = r, a.textContent = r, r === String(t.value) && (a.selected = !0), n.appendChild(a);
  }
  return n.addEventListener("change", () => {
    T(t, n.value) && (e == null || e(t.value));
  }), n;
}
function Nt(t, e) {
  const o = document.createElement("div");
  o.className = "mjr-ws-text-wrapper";
  const i = document.createElement("textarea");
  i.className = "mjr-ws-input mjr-ws-textarea", i.value = t.value ?? "", i.rows = 2;
  const s = document.createElement("button");
  s.type = "button", s.className = "mjr-ws-expand-btn", s.textContent = "Expand", s.style.display = "none";
  let a = !1;
  const r = () => {
    i.style.height = "auto";
    const u = i.scrollHeight;
    a ? (i.style.height = u + "px", i.style.maxHeight = "none", s.textContent = "Collapse") : (i.style.height = Math.min(u, 80) + "px", i.style.maxHeight = "80px", s.textContent = "Expand"), s.style.display = u > 80 ? "" : "none";
  };
  return i.addEventListener("change", () => {
    T(t, i.value) && (e == null || e(t.value));
  }), i.addEventListener("input", () => {
    T(t, i.value), r();
  }), s.addEventListener("click", () => {
    a = !a, r();
  }), o.appendChild(i), o.appendChild(s), requestAnimationFrame(r), o;
}
function Lt(t, e) {
  const n = document.createElement("label");
  n.className = "mjr-ws-toggle-label";
  const o = document.createElement("input");
  return o.type = "checkbox", o.className = "mjr-ws-checkbox", o.checked = !!t.value, o.addEventListener("change", () => {
    T(t, o.checked) && (e == null || e(t.value));
  }), n.appendChild(o), n;
}
function xt(t) {
  const e = document.createElement("input");
  return e.type = "text", e.className = "mjr-ws-input mjr-ws-readonly", e.value = t.value != null ? String(t.value) : "", e.readOnly = !0, e.tabIndex = -1, e;
}
const kt = /* @__PURE__ */ new Set(["imageupload", "button", "hidden"]);
class Vt {
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
    const a = document.createElement("i");
    a.className = "pi pi-map-marker", a.setAttribute("aria-hidden", "true"), s.appendChild(a), s.addEventListener("click", () => this._locateNode()), o.appendChild(s), n.appendChild(o);
    const r = document.createElement("div");
    r.className = "mjr-ws-node-body";
    const u = e.widgets ?? [];
    let l = !1;
    for (const d of u) {
      const h = String(d.type || "").toLowerCase();
      if (kt.has(h) || d.hidden || (c = d.options) != null && c.hidden) continue;
      l = !0;
      const m = h === "text" || h === "string" || h === "customtext", _ = document.createElement("div");
      _.className = m ? "mjr-ws-widget-row mjr-ws-widget-row--block" : "mjr-ws-widget-row";
      const p = document.createElement("label");
      p.className = "mjr-ws-widget-label", p.textContent = d.name || "";
      const f = document.createElement("div");
      f.className = "mjr-ws-widget-input";
      const g = Mt(d, () => {
      });
      f.appendChild(g), this._inputMap.set(d.name, g), _.appendChild(p), _.appendChild(f), r.appendChild(_);
    }
    if (!l) {
      const d = document.createElement("div");
      d.className = "mjr-ws-node-empty", d.textContent = "No editable parameters", r.appendChild(d);
    }
    return n.appendChild(r), n;
  }
  _locateNode() {
    var n, o, i, s, a, r, u, l;
    if (this._onLocate) {
      this._onLocate();
      return;
    }
    const e = this._node;
    if (e)
      try {
        const c = z(), d = c == null ? void 0 : c.canvas;
        if (!d) return;
        if (typeof d.centerOnNode == "function")
          d.centerOnNode(e);
        else if (d.ds && e.pos) {
          const h = ((n = d.canvas) == null ? void 0 : n.width) || ((o = d.element) == null ? void 0 : o.width) || 800, m = ((i = d.canvas) == null ? void 0 : i.height) || ((s = d.element) == null ? void 0 : s.height) || 600;
          d.ds.offset[0] = -e.pos[0] - (((a = e.size) == null ? void 0 : a[0]) || 0) / 2 + h / 2, d.ds.offset[1] = -e.pos[1] - (((r = e.size) == null ? void 0 : r[1]) || 0) / 2 + m / 2, (u = d.setDirty) == null || u.call(d, !0, !0);
        }
      } catch (c) {
        (l = console.debug) == null || l.call(console, "[MFV sidebar] locateNode error", c);
      }
  }
}
class jt {
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
    const e = Tt();
    if (!e.length) {
      this._showEmpty();
      return;
    }
    for (const n of e) {
      const o = new Vt(n);
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
      var a;
      this.hide(), (a = this._onClose) == null || a.call(this);
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
function Tt() {
  var t, e, n;
  try {
    const o = z(), i = ((t = o == null ? void 0 : o.canvas) == null ? void 0 : t.selected_nodes) ?? ((e = o == null ? void 0 : o.canvas) == null ? void 0 : e.selectedNodes) ?? null;
    if (!i) return [];
    if (Array.isArray(i)) return i.filter(Boolean);
    if (i instanceof Map) return Array.from(i.values()).filter(Boolean);
    if (typeof i == "object") return Object.values(i).filter(Boolean);
  } catch (o) {
    (n = console.debug) == null || n.call(console, "[MFV sidebar] _getSelectedNodes error", o);
  }
  return [];
}
const I = Object.freeze({ IDLE: "idle", RUNNING: "running", ERROR: "error" }), Gt = /* @__PURE__ */ new Set(["default", "auto", "latent2rgb", "taesd", "none"]);
function Dt() {
  const t = document.createElement("button");
  t.type = "button", t.className = "mjr-icon-btn mjr-mfv-run-btn";
  const e = B("tooltip.queuePrompt", "Queue Prompt (Run)");
  t.title = e, t.setAttribute("aria-label", e);
  const n = document.createElement("i");
  n.className = "pi pi-play", n.setAttribute("aria-hidden", "true"), t.appendChild(n);
  let o = I.IDLE;
  function i(a) {
    o = a, t.classList.toggle("running", o === I.RUNNING), t.classList.toggle("error", o === I.ERROR), t.disabled = o === I.RUNNING, o === I.RUNNING ? n.className = "pi pi-spin pi-spinner" : n.className = "pi pi-play";
  }
  async function s() {
    var a;
    if (o !== I.RUNNING) {
      i(I.RUNNING);
      try {
        await Ut(), i(I.IDLE);
      } catch (r) {
        (a = console.error) == null || a.call(console, "[MFV Run]", r), i(I.ERROR), setTimeout(() => {
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
function Rt(t = D.MFV_PREVIEW_METHOD) {
  const e = String(t || "").trim().toLowerCase();
  return Gt.has(e) ? e : "taesd";
}
function st(t, e = D.MFV_PREVIEW_METHOD) {
  var i;
  const n = Rt(e), o = {
    ...(t == null ? void 0 : t.extra_data) || {},
    extra_pnginfo: {
      ...((i = t == null ? void 0 : t.extra_data) == null ? void 0 : i.extra_pnginfo) || {}
    }
  };
  return (t == null ? void 0 : t.workflow) != null && (o.extra_pnginfo.workflow = t.workflow), n !== "default" ? o.preview_method = n : delete o.preview_method, {
    ...t,
    extra_data: o
  };
}
function Ot(t, { previewMethod: e = D.MFV_PREVIEW_METHOD, clientId: n = null } = {}) {
  const o = st(t, e), i = {
    prompt: o == null ? void 0 : o.output,
    extra_data: (o == null ? void 0 : o.extra_data) || {}
  }, s = String(n || "").trim();
  return s && (i.client_id = s), i;
}
function Ht(t, e) {
  const n = [
    t == null ? void 0 : t.clientId,
    t == null ? void 0 : t.clientID,
    t == null ? void 0 : t.client_id,
    e == null ? void 0 : e.clientId,
    e == null ? void 0 : e.clientID,
    e == null ? void 0 : e.client_id
  ];
  for (const o of n) {
    const i = String(o || "").trim();
    if (i) return i;
  }
  return "";
}
async function Ut() {
  const t = z();
  if (!t) throw new Error("ComfyUI app not available");
  const e = typeof t.graphToPrompt == "function" ? await t.graphToPrompt() : null;
  if (!(e != null && e.output)) throw new Error("graphToPrompt returned empty output");
  const n = dt(t);
  if (n && typeof n.queuePrompt == "function") {
    await n.queuePrompt(0, st(e));
    return;
  }
  const o = await fetch("/prompt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      Ot(e, {
        clientId: Ht(n, t)
      })
    )
  });
  if (!o.ok) throw new Error(`POST /prompt failed (${o.status})`);
}
function zt(t) {
  const e = document.createElement("div");
  return e.className = "mjr-mfv", e.setAttribute("role", "dialog"), e.setAttribute("aria-modal", "false"), e.setAttribute("aria-hidden", "true"), t.element = e, e.appendChild(t._buildHeader()), e.setAttribute("aria-labelledby", t._titleId), e.appendChild(t._buildToolbar()), e.appendChild(ct(t)), t._contentWrapper = document.createElement("div"), t._contentWrapper.className = "mjr-mfv-content-wrapper", t._applySidebarPosition(), t._contentEl = document.createElement("div"), t._contentEl.className = "mjr-mfv-content", t._contentWrapper.appendChild(t._contentEl), t._contentEl.appendChild(ut(t)), t._sidebar = new jt({
    hostEl: e,
    onClose: () => t._updateSettingsBtnState(!1)
  }), t._contentWrapper.appendChild(t._sidebar.el), e.appendChild(t._contentWrapper), t._rebindControlHandlers(), t._bindPanelInteractions(), t._bindDocumentUiHandlers(), t._onSidebarPosChanged = (n) => {
    var o;
    ((o = n == null ? void 0 : n.detail) == null ? void 0 : o.key) === "viewer.mfvSidebarPosition" && t._applySidebarPosition();
  }, window.addEventListener("mjr-settings-changed", t._onSidebarPosChanged), t._refresh(), e;
}
function Wt(t) {
  const e = document.createElement("div");
  e.className = "mjr-mfv-header";
  const n = document.createElement("span");
  n.className = "mjr-mfv-header-title", n.id = t._titleId, n.textContent = "Majoor Viewer Lite";
  const o = document.createElement("button");
  t._closeBtn = o, o.type = "button", o.className = "mjr-icon-btn mjr-mfv-close-btn", H(o, B("tooltip.closeViewer", "Close viewer"), yt);
  const i = document.createElement("i");
  return i.className = "pi pi-times", i.setAttribute("aria-hidden", "true"), o.appendChild(i), e.appendChild(n), e.appendChild(o), e;
}
function $t(t) {
  var d, h;
  const e = document.createElement("div");
  e.className = "mjr-mfv-toolbar", t._modeBtn = document.createElement("button"), t._modeBtn.type = "button", t._modeBtn.className = "mjr-icon-btn", t._updateModeBtnUI(), e.appendChild(t._modeBtn), t._pinGroup = document.createElement("div"), t._pinGroup.className = "mjr-mfv-pin-group", t._pinGroup.setAttribute("role", "group"), t._pinGroup.setAttribute("aria-label", "Pin References"), t._pinBtns = {};
  for (const m of ["A", "B", "C", "D"]) {
    const _ = document.createElement("button");
    _.type = "button", _.className = "mjr-mfv-pin-btn", _.textContent = m, _.dataset.slot = m, _.title = `Pin ${m}`, _.setAttribute("aria-pressed", "false"), t._pinBtns[m] = _, t._pinGroup.appendChild(_);
  }
  t._updatePinUI(), e.appendChild(t._pinGroup);
  const n = document.createElement("div");
  n.className = "mjr-mfv-toolbar-sep", n.setAttribute("aria-hidden", "true"), e.appendChild(n), t._liveBtn = document.createElement("button"), t._liveBtn.type = "button", t._liveBtn.className = "mjr-icon-btn", t._liveBtn.innerHTML = '<i class="pi pi-circle" aria-hidden="true"></i>', t._liveBtn.setAttribute("aria-pressed", "false"), H(
    t._liveBtn,
    B("tooltip.liveStreamOff", "Live Stream: OFF — click to follow"),
    tt
  ), e.appendChild(t._liveBtn), t._previewBtn = document.createElement("button"), t._previewBtn.type = "button", t._previewBtn.className = "mjr-icon-btn", t._previewBtn.innerHTML = '<i class="pi pi-eye" aria-hidden="true"></i>', t._previewBtn.setAttribute("aria-pressed", "false"), H(
    t._previewBtn,
    B(
      "tooltip.previewStreamOff",
      "KSampler Preview: OFF — click to stream denoising steps"
    ),
    et
  ), e.appendChild(t._previewBtn), t._nodeStreamBtn = document.createElement("button"), t._nodeStreamBtn.type = "button", t._nodeStreamBtn.className = "mjr-icon-btn", t._nodeStreamBtn.innerHTML = '<i class="pi pi-sitemap" aria-hidden="true"></i>', t._nodeStreamBtn.setAttribute("aria-pressed", "false"), H(
    t._nodeStreamBtn,
    B("tooltip.nodeStreamOff", "Node Stream: OFF — click to stream selected node output"),
    bt
  ), e.appendChild(t._nodeStreamBtn), (h = (d = t._nodeStreamBtn).remove) == null || h.call(d), t._nodeStreamBtn = null, t._genBtn = document.createElement("button"), t._genBtn.type = "button", t._genBtn.className = "mjr-icon-btn", t._genBtn.setAttribute("aria-haspopup", "dialog"), t._genBtn.setAttribute("aria-expanded", "false");
  const o = document.createElement("i");
  o.className = "pi pi-info-circle", o.setAttribute("aria-hidden", "true"), t._genBtn.appendChild(o), e.appendChild(t._genBtn), t._updateGenBtnUI(), t._popoutBtn = document.createElement("button"), t._popoutBtn.type = "button", t._popoutBtn.className = "mjr-icon-btn";
  const i = B("tooltip.popOutViewer", "Pop out viewer to separate window");
  t._popoutBtn.title = i, t._popoutBtn.setAttribute("aria-label", i), t._popoutBtn.setAttribute("aria-pressed", "false");
  const s = document.createElement("i");
  s.className = "pi pi-external-link", s.setAttribute("aria-hidden", "true"), t._popoutBtn.appendChild(s), e.appendChild(t._popoutBtn), t._captureBtn = document.createElement("button"), t._captureBtn.type = "button", t._captureBtn.className = "mjr-icon-btn";
  const a = B("tooltip.captureView", "Save view as image");
  t._captureBtn.title = a, t._captureBtn.setAttribute("aria-label", a);
  const r = document.createElement("i");
  r.className = "pi pi-download", r.setAttribute("aria-hidden", "true"), t._captureBtn.appendChild(r), e.appendChild(t._captureBtn);
  const u = document.createElement("div");
  u.className = "mjr-mfv-toolbar-sep", u.style.marginLeft = "auto", u.setAttribute("aria-hidden", "true"), e.appendChild(u), t._settingsBtn = document.createElement("button"), t._settingsBtn.type = "button", t._settingsBtn.className = "mjr-icon-btn mjr-mfv-settings-btn";
  const l = B("tooltip.nodeParams", "Node Parameters");
  t._settingsBtn.title = l, t._settingsBtn.setAttribute("aria-label", l), t._settingsBtn.setAttribute("aria-pressed", "false");
  const c = document.createElement("i");
  return c.className = "pi pi-sliders-h", c.setAttribute("aria-hidden", "true"), t._settingsBtn.appendChild(c), e.appendChild(t._settingsBtn), t._runHandle = Dt(), e.appendChild(t._runHandle.el), t._handleDocClick = (m) => {
    var p, f;
    if (!t._genDropdown) return;
    const _ = m == null ? void 0 : m.target;
    (f = (p = t._genBtn) == null ? void 0 : p.contains) != null && f.call(p, _) || t._genDropdown.contains(_) || t._closeGenDropdown();
  }, t._bindDocumentUiHandlers(), e;
}
function Xt(t) {
  var n, o, i, s, a, r, u, l, c, d, h, m;
  try {
    (n = t._btnAC) == null || n.abort();
  } catch (_) {
    (o = console.debug) == null || o.call(console, _);
  }
  t._btnAC = new AbortController();
  const e = t._btnAC.signal;
  (i = t._closeBtn) == null || i.addEventListener(
    "click",
    () => {
      t._dispatchControllerAction("close", j.MFV_CLOSE);
    },
    { signal: e }
  ), (s = t._modeBtn) == null || s.addEventListener("click", () => t._cycleMode(), { signal: e }), (a = t._pinGroup) == null || a.addEventListener(
    "click",
    (_) => {
      var g, y;
      const p = (y = (g = _.target) == null ? void 0 : g.closest) == null ? void 0 : y.call(g, ".mjr-mfv-pin-btn");
      if (!p) return;
      const f = p.dataset.slot;
      f && (t._pinnedSlots.has(f) ? t._pinnedSlots.delete(f) : t._pinnedSlots.add(f), t._pinnedSlots.has("C") || t._pinnedSlots.has("D") ? t._mode !== b.GRID && t.setMode(b.GRID) : t._pinnedSlots.size > 0 && t._mode === b.SIMPLE && t.setMode(b.AB), t._updatePinUI());
    },
    { signal: e }
  ), (r = t._liveBtn) == null || r.addEventListener(
    "click",
    () => {
      t._dispatchControllerAction("toggleLive", j.MFV_LIVE_TOGGLE);
    },
    { signal: e }
  ), (u = t._previewBtn) == null || u.addEventListener(
    "click",
    () => {
      t._dispatchControllerAction("togglePreview", j.MFV_PREVIEW_TOGGLE);
    },
    { signal: e }
  ), (l = t._nodeStreamBtn) == null || l.addEventListener(
    "click",
    () => {
      t._dispatchControllerAction("toggleNodeStream", j.MFV_NODESTREAM_TOGGLE);
    },
    { signal: e }
  ), (c = t._genBtn) == null || c.addEventListener(
    "click",
    (_) => {
      var p, f;
      _.stopPropagation(), (f = (p = t._genDropdown) == null ? void 0 : p.classList) != null && f.contains("is-visible") ? t._closeGenDropdown() : t._openGenDropdown();
    },
    { signal: e }
  ), (d = t._popoutBtn) == null || d.addEventListener(
    "click",
    () => {
      t._dispatchControllerAction("popOut", j.MFV_POPOUT);
    },
    { signal: e }
  ), (h = t._captureBtn) == null || h.addEventListener("click", () => t._captureView(), { signal: e }), (m = t._settingsBtn) == null || m.addEventListener(
    "click",
    () => {
      var _, p;
      (_ = t._sidebar) == null || _.toggle(), t._updateSettingsBtnState(((p = t._sidebar) == null ? void 0 : p.isVisible) ?? !1);
    },
    { signal: e }
  );
}
function qt(t, e) {
  t._settingsBtn && (t._settingsBtn.classList.toggle("active", !!e), t._settingsBtn.setAttribute("aria-pressed", String(!!e)));
}
function Kt(t) {
  var n;
  if (!t._contentWrapper) return;
  const e = D.MFV_SIDEBAR_POSITION || "right";
  t._contentWrapper.setAttribute("data-sidebar-pos", e), (n = t._sidebar) != null && n.el && t._contentEl && (e === "left" ? t._contentWrapper.insertBefore(t._sidebar.el, t._contentEl) : t._contentWrapper.appendChild(t._sidebar.el));
}
function Yt(t) {
  var e, n, o;
  t._closeGenDropdown();
  try {
    (n = (e = t._genDropdown) == null ? void 0 : e.remove) == null || n.call(e);
  } catch (i) {
    (o = console.debug) == null || o.call(console, i);
  }
  t._genDropdown = null, t._updateGenBtnUI();
}
function Zt(t) {
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
function Jt(t) {
  var e, n;
  try {
    (e = t._docAC) == null || e.abort();
  } catch (o) {
    (n = console.debug) == null || n.call(console, o);
  }
  t._docAC = new AbortController(), t._docClickHost = null;
}
function Qt(t) {
  var e, n;
  return !!((n = (e = t._genDropdown) == null ? void 0 : e.classList) != null && n.contains("is-visible"));
}
function wt(t) {
  if (!t.element) return;
  t._genDropdown || (t._genDropdown = t._buildGenDropdown(), t.element.appendChild(t._genDropdown)), t._bindDocumentUiHandlers();
  const e = t._genBtn.getBoundingClientRect(), n = t.element.getBoundingClientRect(), o = e.left - n.left, i = e.bottom - n.top + 6;
  t._genDropdown.style.left = `${o}px`, t._genDropdown.style.top = `${i}px`, t._genDropdown.classList.add("is-visible"), t._updateGenBtnUI();
}
function vt(t) {
  t._genDropdown && (t._genDropdown.classList.remove("is-visible"), t._updateGenBtnUI());
}
function te(t) {
  if (!t._genBtn) return;
  const e = t._genInfoSelections.size, n = e > 0, o = t._isGenDropdownOpen();
  t._genBtn.classList.toggle("is-on", n), t._genBtn.classList.toggle("is-open", o);
  const i = n ? `Gen Info (${e} field${e > 1 ? "s" : ""} shown)${o ? " — open" : " — click to configure"}` : `Gen Info${o ? " — open" : " — click to show overlay"}`;
  t._genBtn.title = i, t._genBtn.setAttribute("aria-label", i), t._genBtn.setAttribute("aria-expanded", String(o)), t._genDropdown ? t._genBtn.setAttribute("aria-controls", t._genDropdownId) : t._genBtn.removeAttribute("aria-controls");
}
function ee(t) {
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
    const a = document.createElement("input");
    a.type = "checkbox", a.checked = t._genInfoSelections.has(o), a.addEventListener("change", () => {
      a.checked ? t._genInfoSelections.add(o) : t._genInfoSelections.delete(o), t._updateGenBtnUI(), t._refresh();
    });
    const r = document.createElement("span");
    r.textContent = i, s.appendChild(a), s.appendChild(r), e.appendChild(s);
  }
  return e;
}
function ne(t, e) {
  var s, a, r, u;
  if (!e) return {};
  try {
    const l = e.geninfo ? { geninfo: e.geninfo } : e.metadata || e.metadata_raw || e, c = pt(l) || null, d = {
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
      c.prompt && (d.prompt = X(String(c.prompt))), c.seed != null && (d.seed = String(c.seed)), c.model && (d.model = Array.isArray(c.model) ? c.model.join(", ") : String(c.model)), Array.isArray(c.loras) && (d.lora = c.loras.map(
        (m) => typeof m == "string" ? m : (m == null ? void 0 : m.name) || (m == null ? void 0 : m.lora_name) || (m == null ? void 0 : m.model_name) || ""
      ).filter(Boolean).join(", ")), c.sampler && (d.sampler = String(c.sampler)), c.scheduler && (d.scheduler = String(c.scheduler)), c.cfg != null && (d.cfg = String(c.cfg)), c.steps != null && (d.step = String(c.steps)), !d.prompt && (l != null && l.prompt) && (d.prompt = X(String(l.prompt || "")));
      const h = e.generation_time_ms ?? ((s = e.metadata_raw) == null ? void 0 : s.generation_time_ms) ?? (l == null ? void 0 : l.generation_time_ms) ?? ((a = l == null ? void 0 : l.geninfo) == null ? void 0 : a.generation_time_ms) ?? 0;
      return h && Number.isFinite(Number(h)) && h > 0 && h < 864e5 && (d.genTime = (Number(h) / 1e3).toFixed(1) + "s"), d;
    }
  } catch (l) {
    (r = console.debug) == null || r.call(console, "[MFV] geninfo normalize failed", l);
  }
  const n = (e == null ? void 0 : e.metadata) || (e == null ? void 0 : e.metadata_raw) || e || {}, o = {
    prompt: X(String((n == null ? void 0 : n.prompt) || (n == null ? void 0 : n.positive) || "")),
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
function oe(t, e) {
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
    const a = n[s] != null ? String(n[s]) : "";
    if (!a) continue;
    let r = s.charAt(0).toUpperCase() + s.slice(1);
    s === "lora" ? r = "LoRA" : s === "cfg" ? r = "CFG" : s === "genTime" && (r = "Gen Time");
    const u = document.createElement("div");
    u.dataset.field = s;
    const l = document.createElement("strong");
    if (l.textContent = `${r}: `, u.appendChild(l), s === "prompt")
      u.appendChild(document.createTextNode(a));
    else if (s === "genTime") {
      const c = parseFloat(a);
      let d = "#4CAF50";
      c >= 60 ? d = "#FF9800" : c >= 30 ? d = "#FFC107" : c >= 10 && (d = "#8BC34A");
      const h = document.createElement("span");
      h.style.color = d, h.style.fontWeight = "600", h.textContent = a, u.appendChild(h);
    } else
      u.appendChild(document.createTextNode(a));
    o.appendChild(u);
  }
  return o.childNodes.length > 0 ? o : null;
}
function se(t) {
  var e, n, o;
  try {
    (n = (e = t._controller) == null ? void 0 : e.onModeChanged) == null || n.call(e, t._mode);
  } catch (i) {
    (o = console.debug) == null || o.call(console, i);
  }
}
function ie(t) {
  const e = [b.SIMPLE, b.AB, b.SIDE, b.GRID];
  t._mode = e[(e.indexOf(t._mode) + 1) % e.length], t._updateModeBtnUI(), t._refresh(), t._notifyModeChanged();
}
function le(t, e) {
  Object.values(b).includes(e) && (t._mode = e, t._updateModeBtnUI(), t._refresh(), t._notifyModeChanged());
}
function ae(t) {
  return t._pinnedSlots;
}
function re(t) {
  if (t._pinBtns)
    for (const e of ["A", "B", "C", "D"]) {
      const n = t._pinBtns[e];
      if (!n) continue;
      const o = t._pinnedSlots.has(e);
      n.classList.toggle("is-pinned", o), n.setAttribute("aria-pressed", String(o)), n.title = o ? `Unpin ${e}` : `Pin ${e}`;
    }
}
function de(t) {
  if (!t._modeBtn) return;
  const e = {
    [b.SIMPLE]: { icon: "pi-image", label: "Mode: Simple - click to switch" },
    [b.AB]: { icon: "pi-clone", label: "Mode: A/B Compare - click to switch" },
    [b.SIDE]: { icon: "pi-table", label: "Mode: Side-by-Side - click to switch" },
    [b.GRID]: {
      icon: "pi-th-large",
      label: "Mode: Grid Compare (up to 4) - click to switch"
    }
  }, { icon: n = "pi-image", label: o = "" } = e[t._mode] || {}, i = Z(o, gt), s = document.createElement("i");
  s.className = `pi ${n}`, s.setAttribute("aria-hidden", "true"), t._modeBtn.replaceChildren(s), t._modeBtn.title = i, t._modeBtn.setAttribute("aria-label", i), t._modeBtn.removeAttribute("aria-pressed");
}
function ce(t, e) {
  if (!t._liveBtn) return;
  const n = !!e;
  t._liveBtn.classList.toggle("mjr-live-active", n);
  const o = n ? B("tooltip.liveStreamOn", "Live Stream: ON — click to disable") : B("tooltip.liveStreamOff", "Live Stream: OFF — click to follow"), i = Z(o, tt);
  t._liveBtn.setAttribute("aria-pressed", String(n)), t._liveBtn.setAttribute("aria-label", i);
  const s = document.createElement("i");
  s.className = n ? "pi pi-circle-fill" : "pi pi-circle", s.setAttribute("aria-hidden", "true"), t._liveBtn.replaceChildren(s), t._liveBtn.title = i;
}
function ue(t, e) {
  if (t._previewActive = !!e, !t._previewBtn) return;
  t._previewBtn.classList.toggle("mjr-preview-active", t._previewActive);
  const n = t._previewActive ? B("tooltip.previewStreamOn", "KSampler Preview: ON — streaming denoising steps") : B(
    "tooltip.previewStreamOff",
    "KSampler Preview: OFF — click to stream denoising steps"
  ), o = Z(n, et);
  t._previewBtn.setAttribute("aria-pressed", String(t._previewActive)), t._previewBtn.setAttribute("aria-label", o);
  const i = document.createElement("i");
  i.className = t._previewActive ? "pi pi-eye" : "pi pi-eye-slash", i.setAttribute("aria-hidden", "true"), t._previewBtn.replaceChildren(i), t._previewBtn.title = o, t._previewActive || t._revokePreviewBlob();
}
function pe(t, e) {
  if (!e || !(e instanceof Blob)) return;
  t._revokePreviewBlob();
  const n = URL.createObjectURL(e);
  t._previewBlobUrl = n;
  const o = { url: n, filename: "preview.jpg", kind: "image", _isPreview: !0 };
  if (t._mode === b.AB || t._mode === b.SIDE || t._mode === b.GRID) {
    const s = t.getPinnedSlots();
    if (t._mode === b.GRID) {
      const a = ["A", "B", "C", "D"].find((r) => !s.has(r)) || "A";
      t[`_media${a}`] = o;
    } else s.has("B") ? t._mediaA = o : t._mediaB = o;
  } else
    t._mediaA = o, t._resetMfvZoom(), t._mode !== b.SIMPLE && (t._mode = b.SIMPLE, t._updateModeBtnUI());
  ++t._refreshGen, t._refresh();
}
function me(t) {
  if (t._previewBlobUrl) {
    try {
      URL.revokeObjectURL(t._previewBlobUrl);
    } catch {
    }
    t._previewBlobUrl = null;
  }
}
function he(t, e) {
  {
    t._nodeStreamActive = !1;
    return;
  }
}
function _e() {
  var t, e, n, o, i;
  try {
    const s = typeof window < "u" ? window : globalThis, a = (e = (t = s == null ? void 0 : s.process) == null ? void 0 : t.versions) == null ? void 0 : e.electron;
    if (typeof a == "string" && a.trim() || s != null && s.electron || s != null && s.ipcRenderer || s != null && s.electronAPI)
      return !0;
    const r = String(((n = s == null ? void 0 : s.navigator) == null ? void 0 : n.userAgent) || ((o = globalThis == null ? void 0 : globalThis.navigator) == null ? void 0 : o.userAgent) || ""), u = /\bElectron\//i.test(r), l = /\bCode\//i.test(r);
    if (u && !l)
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
    const a = typeof window < "u" ? window : globalThis, r = "__MJR_MFV_POPOUT_TRACE__", u = Array.isArray(a[r]) ? a[r] : [];
    u.push(o), a[r] = u.slice(-20), a.__MJR_MFV_POPOUT_LAST__ = o;
  } catch (a) {
    (i = console.debug) == null || i.call(console, a);
  }
  try {
    const a = n === "error" ? console.error : n === "warn" ? console.warn : console.info;
    a == null || a("[MFV popout]", o);
  } catch (a) {
    (s = console.debug) == null || s.call(console, a);
  }
}
function fe(t, e) {
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
function ge(t, e) {
  var n;
  t._desktopPopoutUnsupported = !0, S(
    "electron-in-app-fallback",
    { message: (e == null ? void 0 : e.message) || String(e || "unknown error") },
    "warn"
  ), t._setDesktopExpanded(!0);
  try {
    mt(
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
function be(t, e, n, o, i) {
  return S(
    "electron-popup-fallback-attempt",
    { reason: (i == null ? void 0 : i.message) || String(i || "unknown") },
    "warn"
  ), t._fallbackPopout(e, n, o), t._popoutWindow ? (t._desktopPopoutUnsupported = !1, S("electron-popup-fallback-opened", null), !0) : !1;
}
function ye(t) {
  var r, u;
  if (t._isPopped || !t.element) return;
  const e = t.element;
  t._stopEdgeResize();
  const n = _e(), o = typeof window < "u" && "documentPictureInPicture" in window, i = String(((r = window == null ? void 0 : window.navigator) == null ? void 0 : r.userAgent) || ((u = globalThis == null ? void 0 : globalThis.navigator) == null ? void 0 : u.userAgent) || ""), s = Math.max(e.offsetWidth || 520, 400), a = Math.max(e.offsetHeight || 420, 300);
  if (S("start", {
    isElectronHost: n,
    hasDocumentPiP: o,
    userAgent: i,
    width: s,
    height: a,
    desktopPopoutUnsupported: t._desktopPopoutUnsupported
  }), n && t._desktopPopoutUnsupported) {
    S("electron-in-app-fallback-reuse", null), t._setDesktopExpanded(!0);
    return;
  }
  if (!(n && (S("electron-popup-request", { width: s, height: a }), t._tryElectronPopupFallback(e, s, a, new Error("Desktop popup requested"))))) {
    if (n && "documentPictureInPicture" in window) {
      S("electron-pip-request", { width: s, height: a }), window.documentPictureInPicture.requestWindow({ width: s, height: a }).then((l) => {
        var _, p, f;
        S("electron-pip-opened", {
          hasDocument: !!(l != null && l.document)
        }), t._popoutWindow = l, t._isPopped = !0, t._popoutRestoreGuard = !1;
        try {
          (_ = t._popoutAC) == null || _.abort();
        } catch (g) {
          (p = console.debug) == null || p.call(console, g);
        }
        t._popoutAC = new AbortController();
        const c = t._popoutAC.signal, d = () => t._schedulePopInFromPopupClose();
        t._popoutCloseHandler = d;
        const h = l.document;
        h.title = "Majoor Viewer", t._installPopoutStyles(h), h.body.style.cssText = "margin:0;display:flex;min-height:100vh;background:#0d0d0d;overflow:hidden;";
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
            l.close();
          } catch (y) {
            (f = console.debug) == null || f.call(console, y);
          }
          t._activateDesktopExpandedFallback(g);
          return;
        }
        e.classList.add("is-visible"), t.isVisible = !0, t._resetGenDropdownForCurrentDocument(), t._rebindControlHandlers(), t._bindDocumentUiHandlers(), t._updatePopoutBtnUI(), S("electron-pip-ready", { isPopped: t._isPopped }), l.addEventListener("pagehide", d, {
          signal: c
        }), t._startPopoutCloseWatch(), t._popoutKeydownHandler = (g) => {
          var C, E;
          const y = String(((C = g == null ? void 0 : g.target) == null ? void 0 : C.tagName) || "").toLowerCase();
          g != null && g.defaultPrevented || (E = g == null ? void 0 : g.target) != null && E.isContentEditable || y === "input" || y === "textarea" || y === "select" || t._forwardKeydownToController(g);
        }, l.addEventListener("keydown", t._popoutKeydownHandler, {
          signal: c
        });
      }).catch((l) => {
        S(
          "electron-pip-request-failed",
          { message: (l == null ? void 0 : l.message) || String(l) },
          "warn"
        ), t._activateDesktopExpandedFallback(l);
      });
      return;
    }
    if (n) {
      S("electron-no-pip-api", { hasDocumentPiP: o }), t._activateDesktopExpandedFallback(
        new Error("Document Picture-in-Picture unavailable after popup failure")
      );
      return;
    }
    S("browser-fallback-popup", { width: s, height: a }), t._fallbackPopout(e, s, a);
  }
}
function Ce(t, e, n, o) {
  var d, h, m, _;
  S("browser-popup-open", { width: n, height: o });
  const i = (window.screenX || window.screenLeft) + Math.round((window.outerWidth - n) / 2), s = (window.screenY || window.screenTop) + Math.round((window.outerHeight - o) / 2), a = `width=${n},height=${o},left=${i},top=${s},resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,status=no`, r = window.open("about:blank", "_mjr_viewer", a);
  if (!r) {
    S("browser-popup-blocked", null, "warn"), console.warn("[MFV] Pop-out blocked — allow popups for this site.");
    return;
  }
  S("browser-popup-opened", { hasDocument: !!(r != null && r.document) }), t._popoutWindow = r, t._isPopped = !0, t._popoutRestoreGuard = !1;
  try {
    (d = t._popoutAC) == null || d.abort();
  } catch (p) {
    (h = console.debug) == null || h.call(console, p);
  }
  t._popoutAC = new AbortController();
  const u = t._popoutAC.signal, l = () => t._schedulePopInFromPopupClose();
  t._popoutCloseHandler = l;
  const c = () => {
    let p;
    try {
      p = r.document;
    } catch {
      return;
    }
    if (!p) return;
    p.title = "Majoor Viewer", t._installPopoutStyles(p), p.body.style.cssText = "margin:0;display:flex;min-height:100vh;background:#0d0d0d;overflow:hidden;";
    const f = p.createElement("div");
    f.id = "mjr-mfv-popout-root", f.style.cssText = "flex:1;min-width:0;min-height:0;display:flex;", p.body.appendChild(f);
    try {
      f.appendChild(p.adoptNode(e));
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
      r.addEventListener("load", c, { signal: u });
    } catch (f) {
      (_ = console.debug) == null || _.call(console, "[MFV] pop-out page load listener failed", f);
    }
  }
  r.addEventListener("beforeunload", l, { signal: u }), r.addEventListener("pagehide", l, { signal: u }), r.addEventListener("unload", l, { signal: u }), t._startPopoutCloseWatch(), t._popoutKeydownHandler = (p) => {
    var y, C, E, A;
    const f = String(((y = p == null ? void 0 : p.target) == null ? void 0 : y.tagName) || "").toLowerCase();
    if (p != null && p.defaultPrevented || (C = p == null ? void 0 : p.target) != null && C.isContentEditable || f === "input" || f === "textarea" || f === "select")
      return;
    if (String((p == null ? void 0 : p.key) || "").toLowerCase() === "v" && (p != null && p.ctrlKey || p != null && p.metaKey) && !(p != null && p.altKey) && !(p != null && p.shiftKey)) {
      p.preventDefault(), (E = p.stopPropagation) == null || E.call(p), (A = p.stopImmediatePropagation) == null || A.call(p), t._dispatchControllerAction("toggle", j.MFV_TOGGLE);
      return;
    }
    t._forwardKeydownToController(p);
  }, r.addEventListener("keydown", t._popoutKeydownHandler, { signal: u });
}
function Ee(t) {
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
function Ae(t) {
  t._clearPopoutCloseWatch(), t._popoutCloseTimer = window.setInterval(() => {
    if (!t._isPopped) {
      t._clearPopoutCloseWatch();
      return;
    }
    const e = t._popoutWindow;
    (!e || e.closed) && (t._clearPopoutCloseWatch(), t._schedulePopInFromPopupClose());
  }, 250);
}
function Se(t) {
  !t._isPopped || t._popoutRestoreGuard || (t._popoutRestoreGuard = !0, window.setTimeout(() => {
    try {
      t.popIn({ closePopupWindow: !1 });
    } finally {
      t._popoutRestoreGuard = !1;
    }
  }, 0));
}
function Be(t, e) {
  var o, i, s;
  if (!(e != null && e.head)) return;
  try {
    for (const a of e.head.querySelectorAll("[data-mjr-popout-cloned-style='1']"))
      a.remove();
  } catch (a) {
    (o = console.debug) == null || o.call(console, a);
  }
  try {
    const a = document.documentElement.style.cssText;
    if (a) {
      const r = e.createElement("style");
      r.setAttribute("data-mjr-popout-cloned-style", "1"), r.textContent = `:root { ${a} }`, e.head.appendChild(r);
    }
  } catch (a) {
    (i = console.debug) == null || i.call(console, a);
  }
  for (const a of document.querySelectorAll('link[rel="stylesheet"], style'))
    try {
      let r = null;
      if (a.tagName === "LINK") {
        r = e.createElement("link");
        for (const u of Array.from(a.attributes || []))
          (u == null ? void 0 : u.name) !== "href" && r.setAttribute(u.name, u.value);
        r.setAttribute("href", a.href || a.getAttribute("href") || "");
      } else
        r = e.importNode(a, !0);
      r.setAttribute("data-mjr-popout-cloned-style", "1"), e.head.appendChild(r);
    } catch (r) {
      (s = console.debug) == null || s.call(console, r);
    }
  const n = e.createElement("style");
  n.setAttribute("data-mjr-popout-cloned-style", "1"), n.textContent = `
        html, body { background: #0d0d0d !important; }
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
function Pe(t, { closePopupWindow: e = !0 } = {}) {
  var i, s, a, r;
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
    (a = console.debug) == null || a.call(console, "[MFV] pop-in adopt failed", u);
  }
  if (document.body.appendChild(o), t._resetGenDropdownForCurrentDocument(), t._rebindControlHandlers(), t._bindPanelInteractions(), t._bindDocumentUiHandlers(), o.classList.add("is-visible"), o.setAttribute("aria-hidden", "false"), t.isVisible = !0, t._updatePopoutBtnUI(), e)
    try {
      n == null || n.close();
    } catch (u) {
      (r = console.debug) == null || r.call(console, u);
    }
  t._popoutWindow = null;
}
function Me(t) {
  if (!t._popoutBtn) return;
  const e = t._isPopped || t._desktopExpanded;
  t.element && t.element.classList.toggle("mjr-mfv--popped", e), t._popoutBtn.classList.toggle("mjr-popin-active", e);
  const n = t._popoutBtn.querySelector("i") || document.createElement("i"), o = e ? B("tooltip.popInViewer", "Return to floating panel") : B("tooltip.popOutViewer", "Pop out viewer to separate window");
  n.className = e ? "pi pi-sign-in" : "pi pi-external-link", t._popoutBtn.title = o, t._popoutBtn.setAttribute("aria-label", o), t._popoutBtn.setAttribute("aria-pressed", String(e)), t._popoutBtn.contains(n) || t._popoutBtn.replaceChildren(n);
}
function Ie(t) {
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
function Fe(t, e, n) {
  if (!n) return "";
  const o = t <= n.left + O, i = t >= n.right - O, s = e <= n.top + O, a = e >= n.bottom - O;
  return s && o ? "nw" : s && i ? "ne" : a && o ? "sw" : a && i ? "se" : s ? "n" : a ? "s" : o ? "w" : i ? "e" : "";
}
function Ne(t) {
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
function Le(t) {
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
function xe(t, e) {
  var r;
  if (!e) return;
  const n = (u) => {
    if (!t.element || t._isPopped) return "";
    const l = t.element.getBoundingClientRect();
    return t._getResizeDirectionFromPoint(u.clientX, u.clientY, l);
  }, o = (r = t._panelAC) == null ? void 0 : r.signal, i = (u) => {
    var _;
    if (u.button !== 0 || !t.element || t._isPopped) return;
    const l = n(u);
    if (!l) return;
    u.preventDefault(), u.stopPropagation();
    const c = t.element.getBoundingClientRect(), d = window.getComputedStyle(t.element), h = Math.max(120, Number.parseFloat(d.minWidth) || 0), m = Math.max(100, Number.parseFloat(d.minHeight) || 0);
    t._resizeState = {
      pointerId: u.pointerId,
      dir: l,
      startX: u.clientX,
      startY: u.clientY,
      startLeft: c.left,
      startTop: c.top,
      startWidth: c.width,
      startHeight: c.height,
      minWidth: h,
      minHeight: m
    }, t.element.style.left = `${Math.round(c.left)}px`, t.element.style.top = `${Math.round(c.top)}px`, t.element.style.right = "auto", t.element.style.bottom = "auto", t.element.classList.add("mjr-mfv--resizing"), t.element.style.cursor = t._resizeCursorForDirection(l);
    try {
      t.element.setPointerCapture(u.pointerId);
    } catch (p) {
      (_ = console.debug) == null || _.call(console, p);
    }
  }, s = (u) => {
    if (!t.element || t._isPopped) return;
    const l = t._resizeState;
    if (!l) {
      const f = n(u);
      t.element.style.cursor = f ? t._resizeCursorForDirection(f) : "";
      return;
    }
    if (l.pointerId !== u.pointerId) return;
    const c = u.clientX - l.startX, d = u.clientY - l.startY;
    let h = l.startWidth, m = l.startHeight, _ = l.startLeft, p = l.startTop;
    l.dir.includes("e") && (h = l.startWidth + c), l.dir.includes("s") && (m = l.startHeight + d), l.dir.includes("w") && (h = l.startWidth - c, _ = l.startLeft + c), l.dir.includes("n") && (m = l.startHeight - d, p = l.startTop + d), h < l.minWidth && (l.dir.includes("w") && (_ -= l.minWidth - h), h = l.minWidth), m < l.minHeight && (l.dir.includes("n") && (p -= l.minHeight - m), m = l.minHeight), h = Math.min(h, Math.max(l.minWidth, window.innerWidth)), m = Math.min(m, Math.max(l.minHeight, window.innerHeight)), _ = Math.min(Math.max(0, _), Math.max(0, window.innerWidth - h)), p = Math.min(Math.max(0, p), Math.max(0, window.innerHeight - m)), t.element.style.width = `${Math.round(h)}px`, t.element.style.height = `${Math.round(m)}px`, t.element.style.left = `${Math.round(_)}px`, t.element.style.top = `${Math.round(p)}px`, t.element.style.right = "auto", t.element.style.bottom = "auto";
  }, a = (u) => {
    if (!t.element || !t._resizeState || t._resizeState.pointerId !== u.pointerId) return;
    const l = n(u);
    t._stopEdgeResize(), l && (t.element.style.cursor = t._resizeCursorForDirection(l));
  };
  e.addEventListener("pointerdown", i, { capture: !0, signal: o }), e.addEventListener("pointermove", s, { signal: o }), e.addEventListener("pointerup", a, { signal: o }), e.addEventListener("pointercancel", a, { signal: o }), e.addEventListener(
    "pointerleave",
    () => {
      !t._resizeState && t.element && (t.element.style.cursor = "");
    },
    { signal: o }
  );
}
function ke(t, e) {
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
      const r = o.signal, u = t.element, l = u.getBoundingClientRect(), c = s.clientX - l.left, d = s.clientY - l.top, h = (_) => {
        const p = Math.min(
          window.innerWidth - u.offsetWidth,
          Math.max(0, _.clientX - c)
        ), f = Math.min(
          window.innerHeight - u.offsetHeight,
          Math.max(0, _.clientY - d)
        );
        u.style.left = `${p}px`, u.style.top = `${f}px`, u.style.right = "auto", u.style.bottom = "auto";
      }, m = () => {
        try {
          o == null || o.abort();
        } catch {
        }
      };
      e.addEventListener("pointermove", h, { signal: r }), e.addEventListener("pointerup", m, { signal: r });
    },
    n ? { signal: n } : void 0
  );
}
async function Ve(t, e, n, o, i, s, a, r) {
  var m, _, p, f, g;
  if (!n) return;
  const u = L(n);
  let l = null;
  if (u === "video" && (l = r instanceof HTMLVideoElement ? r : ((m = t._contentEl) == null ? void 0 : m.querySelector("video")) || null), !l && u === "model3d") {
    const y = (n == null ? void 0 : n.id) != null ? String(n.id) : "";
    y && (l = ((p = (_ = t._contentEl) == null ? void 0 : _.querySelector) == null ? void 0 : p.call(
      _,
      `.mjr-model3d-render-canvas[data-mjr-asset-id="${y}"]`
    )) || null), l || (l = ((g = (f = t._contentEl) == null ? void 0 : f.querySelector) == null ? void 0 : g.call(f, ".mjr-model3d-render-canvas")) || null);
  }
  if (!l) {
    const y = nt(n);
    if (!y) return;
    l = await new Promise((C) => {
      const E = new Image();
      E.crossOrigin = "anonymous", E.onload = () => C(E), E.onerror = () => C(null), E.src = y;
    });
  }
  if (!l) return;
  const c = l.videoWidth || l.naturalWidth || s, d = l.videoHeight || l.naturalHeight || a;
  if (!c || !d) return;
  const h = Math.min(s / c, a / d);
  e.drawImage(
    l,
    o + (s - c * h) / 2,
    i + (a - d * h) / 2,
    c * h,
    d * h
  );
}
function je(t, e, n, o) {
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
  ], a = 11, r = 16, u = 8, l = Math.max(100, Number(o || 0) - u * 2);
  let c = 0;
  for (const d of s) {
    if (!t._genInfoSelections.has(d)) continue;
    const h = i[d] != null ? String(i[d]) : "";
    if (!h) continue;
    let m = d.charAt(0).toUpperCase() + d.slice(1);
    d === "lora" ? m = "LoRA" : d === "cfg" ? m = "CFG" : d === "genTime" && (m = "Gen Time");
    const _ = `${m}: `;
    e.font = `bold ${a}px system-ui, sans-serif`;
    const p = e.measureText(_).width;
    e.font = `${a}px system-ui, sans-serif`;
    const f = Math.max(32, l - u * 2 - p);
    let g = 0, y = "";
    for (const C of h.split(" ")) {
      const E = y ? y + " " + C : C;
      e.measureText(E).width > f && y ? (g += 1, y = C) : y = E;
    }
    y && (g += 1), c += g;
  }
  return c > 0 ? c * r + u * 2 : 0;
}
function Te(t, e, n, o, i, s, a) {
  if (!n || !t._genInfoSelections.size) return;
  const r = t._getGenFields(n), u = {
    prompt: "#7ec8ff",
    seed: "#ffd47a",
    model: "#7dda8a",
    lora: "#d48cff",
    sampler: "#ff9f7a",
    scheduler: "#ff7a9f",
    cfg: "#7a9fff",
    step: "#7affd4",
    genTime: "#e0ff7a"
  }, l = [
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
  for (const A of l) {
    if (!t._genInfoSelections.has(A)) continue;
    const M = r[A] != null ? String(r[A]) : "";
    if (!M) continue;
    let P = A.charAt(0).toUpperCase() + A.slice(1);
    A === "lora" ? P = "LoRA" : A === "cfg" ? P = "CFG" : A === "genTime" && (P = "Gen Time"), c.push({
      label: `${P}: `,
      value: M,
      color: u[A] || "#ffffff"
    });
  }
  if (!c.length) return;
  const d = 11, h = 16, m = 8, _ = Math.max(100, s - m * 2);
  e.save();
  const p = [];
  for (const { label: A, value: M, color: P } of c) {
    e.font = `bold ${d}px system-ui, sans-serif`;
    const R = e.measureText(A).width;
    e.font = `${d}px system-ui, sans-serif`;
    const x = _ - m * 2 - R, W = [];
    let N = "";
    for (const $ of M.split(" ")) {
      const w = N ? N + " " + $ : $;
      e.measureText(w).width > x && N ? (W.push(N), N = $) : N = w;
    }
    N && W.push(N), p.push({ label: A, labelW: R, lines: W, color: P });
  }
  const g = p.reduce((A, M) => A + M.lines.length, 0) * h + m * 2, y = o + m, C = i + a - g - m;
  e.globalAlpha = 0.72, e.fillStyle = "#000", ot(e, y, C, _, g, 6), e.fill(), e.globalAlpha = 1;
  let E = C + m + d;
  for (const { label: A, labelW: M, lines: P, color: R } of p)
    for (let x = 0; x < P.length; x++)
      x === 0 ? (e.font = `bold ${d}px system-ui, sans-serif`, e.fillStyle = R, e.fillText(A, y + m, E), e.font = `${d}px system-ui, sans-serif`, e.fillStyle = "rgba(255,255,255,0.88)", e.fillText(P[x], y + m + M, E)) : (e.font = `${d}px system-ui, sans-serif`, e.fillStyle = "rgba(255,255,255,0.88)", e.fillText(P[x], y + m + M, E)), E += h;
  e.restore();
}
async function Ge(t) {
  var u;
  if (!t._contentEl) return;
  t._captureBtn && (t._captureBtn.disabled = !0, t._captureBtn.setAttribute("aria-label", B("tooltip.capturingView", "Capturing…")));
  const e = t._contentEl.clientWidth || 480, n = t._contentEl.clientHeight || 360;
  let o = n;
  if (t._mode === b.SIMPLE && t._mediaA && t._genInfoSelections.size) {
    const l = document.createElement("canvas");
    l.width = e, l.height = n;
    const c = l.getContext("2d"), d = t._estimateGenInfoOverlayHeight(c, t._mediaA, e);
    if (d > 0) {
      const h = Math.max(n, d + 24);
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
      const l = Math.round(t._abDividerX * e), c = t._contentEl.querySelector(
        ".mjr-mfv-ab-layer:not(.mjr-mfv-ab-layer--b) video"
      ), d = t._contentEl.querySelector(".mjr-mfv-ab-layer--b video");
      t._mediaA && await t._drawMediaFit(s, t._mediaA, 0, 0, e, o, c), t._mediaB && (s.save(), s.beginPath(), s.rect(l, 0, e - l, o), s.clip(), await t._drawMediaFit(s, t._mediaB, 0, 0, e, o, d), s.restore()), s.save(), s.strokeStyle = "rgba(255,255,255,0.88)", s.lineWidth = 2, s.beginPath(), s.moveTo(l, 0), s.lineTo(l, o), s.stroke(), s.restore(), G(s, "A", 8, 8), G(s, "B", l + 8, 8), t._mediaA && t._drawGenInfoOverlay(s, t._mediaA, 0, 0, l, o), t._mediaB && t._drawGenInfoOverlay(s, t._mediaB, l, 0, e - l, o);
    } else if (t._mode === b.SIDE) {
      const l = Math.floor(e / 2), c = t._contentEl.querySelector(".mjr-mfv-side-panel:first-child video"), d = t._contentEl.querySelector(".mjr-mfv-side-panel:last-child video");
      t._mediaA && (await t._drawMediaFit(s, t._mediaA, 0, 0, l, o, c), t._drawGenInfoOverlay(s, t._mediaA, 0, 0, l, o)), s.fillStyle = "#111", s.fillRect(l, 0, 2, o), t._mediaB && (await t._drawMediaFit(s, t._mediaB, l, 0, l, o, d), t._drawGenInfoOverlay(s, t._mediaB, l, 0, l, o)), G(s, "A", 8, 8), G(s, "B", l + 8, 8);
    } else if (t._mode === b.GRID) {
      const l = Math.floor(e / 2), c = Math.floor(o / 2), d = 1, h = [
        { media: t._mediaA, label: "A", x: 0, y: 0, w: l - d, h: c - d },
        {
          media: t._mediaB,
          label: "B",
          x: l + d,
          y: 0,
          w: l - d,
          h: c - d
        },
        {
          media: t._mediaC,
          label: "C",
          x: 0,
          y: c + d,
          w: l - d,
          h: c - d
        },
        {
          media: t._mediaD,
          label: "D",
          x: l + d,
          y: c + d,
          w: l - d,
          h: c - d
        }
      ], m = t._contentEl.querySelectorAll(".mjr-mfv-grid-cell");
      for (let _ = 0; _ < h.length; _++) {
        const p = h[_], f = ((u = m[_]) == null ? void 0 : u.querySelector("video")) || null;
        p.media && (await t._drawMediaFit(s, p.media, p.x, p.y, p.w, p.h, f), t._drawGenInfoOverlay(s, p.media, p.x, p.y, p.w, p.h)), G(s, p.label, p.x + 8, p.y + 8);
      }
      s.save(), s.fillStyle = "#111", s.fillRect(l - d, 0, d * 2, o), s.fillRect(0, c - d, e, d * 2), s.restore();
    }
  } catch (l) {
    console.debug("[MFV] capture error:", l);
  }
  const r = `${{
    [b.AB]: "mfv-ab",
    [b.SIDE]: "mfv-side",
    [b.GRID]: "mfv-grid"
  }[t._mode] ?? "mfv"}-${Date.now()}.png`;
  try {
    const l = i.toDataURL("image/png"), c = document.createElement("a");
    c.href = l, c.download = r, document.body.appendChild(c), c.click(), setTimeout(() => document.body.removeChild(c), 100);
  } catch (l) {
    console.warn("[MFV] download failed:", l);
  } finally {
    t._captureBtn && (t._captureBtn.disabled = !1, t._captureBtn.setAttribute("aria-label", B("tooltip.captureView", "Save view as image")));
  }
}
function De(t, e, { autoMode: n = !1 } = {}) {
  if (t._mediaA = e || null, t._resetMfvZoom(), n && t._mode !== b.SIMPLE && (t._mode = b.SIMPLE, t._updateModeBtnUI()), t._mediaA && typeof U == "function") {
    const o = ++t._refreshGen;
    (async () => {
      var i;
      try {
        const s = await U(t._mediaA, {
          getAssetMetadata: Q,
          getFileMetadataScoped: J
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
function Re(t, e, n) {
  t._mediaA = e || null, t._mediaB = n || null, t._resetMfvZoom(), t._mode === b.SIMPLE && (t._mode = b.AB, t._updateModeBtnUI());
  const o = ++t._refreshGen, i = async (s) => {
    if (!s) return s;
    try {
      return await U(s, {
        getAssetMetadata: Q,
        getFileMetadataScoped: J
      }) || s;
    } catch {
      return s;
    }
  };
  (async () => {
    const [s, a] = await Promise.all([i(t._mediaA), i(t._mediaB)]);
    t._refreshGen === o && (t._mediaA = s || null, t._mediaB = a || null, t._refresh());
  })();
}
function Oe(t, e, n, o, i) {
  t._mediaA = e || null, t._mediaB = n || null, t._mediaC = o || null, t._mediaD = i || null, t._resetMfvZoom(), t._mode !== b.GRID && (t._mode = b.GRID, t._updateModeBtnUI());
  const s = ++t._refreshGen, a = async (r) => {
    if (!r) return r;
    try {
      return await U(r, {
        getAssetMetadata: Q,
        getFileMetadataScoped: J
      }) || r;
    } catch {
      return r;
    }
  };
  (async () => {
    const [r, u, l, c] = await Promise.all([
      a(t._mediaA),
      a(t._mediaB),
      a(t._mediaC),
      a(t._mediaD)
    ]);
    t._refreshGen === s && (t._mediaA = r || null, t._mediaB = u || null, t._mediaC = l || null, t._mediaD = c || null, t._refresh());
  })();
}
let He = 0;
class We {
  constructor({ controller: e = null } = {}) {
    this._instanceId = ++He, this._controller = e && typeof e == "object" ? { ...e } : null, this.element = null, this.isVisible = !1, this._contentEl = null, this._closeBtn = null, this._modeBtn = null, this._pinGroup = null, this._pinBtns = null, this._liveBtn = null, this._genBtn = null, this._genDropdown = null, this._captureBtn = null, this._genInfoSelections = /* @__PURE__ */ new Set(["genTime"]), this._mode = b.SIMPLE, this._mediaA = null, this._mediaB = null, this._mediaC = null, this._mediaD = null, this._pinnedSlots = /* @__PURE__ */ new Set(), this._abDividerX = 0.5, this._zoom = 1, this._panX = 0, this._panY = 0, this._panzoomAC = null, this._dragging = !1, this._compareSyncAC = null, this._btnAC = null, this._refreshGen = 0, this._popoutWindow = null, this._popoutBtn = null, this._isPopped = !1, this._desktopExpanded = !1, this._desktopExpandRestore = null, this._desktopPopoutUnsupported = !1, this._popoutCloseHandler = null, this._popoutKeydownHandler = null, this._popoutCloseTimer = null, this._popoutRestoreGuard = !1, this._previewBtn = null, this._previewBlobUrl = null, this._previewActive = !1, this._nodeStreamBtn = null, this._nodeStreamActive = !1, this._docAC = new AbortController(), this._popoutAC = null, this._panelAC = new AbortController(), this._resizeState = null, this._titleId = `mjr-mfv-title-${this._instanceId}`, this._genDropdownId = `mjr-mfv-gen-dropdown-${this._instanceId}`, this._progressEl = null, this._progressNodesEl = null, this._progressStepsEl = null, this._progressTextEl = null, this._mediaProgressEl = null, this._mediaProgressTextEl = null, this._progressUpdateHandler = null, this._progressCurrentNodeId = null, this._docClickHost = null, this._handleDocClick = null;
  }
  _dispatchControllerAction(e, n) {
    var o, i, s;
    try {
      const a = (o = this._controller) == null ? void 0 : o[e];
      if (typeof a == "function")
        return a();
    } catch (a) {
      (i = console.debug) == null || i.call(console, a);
    }
    if (n)
      try {
        window.dispatchEvent(new Event(n));
      } catch (a) {
        (s = console.debug) == null || s.call(console, a);
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
    return zt(this);
  }
  _buildHeader() {
    return Wt(this);
  }
  _buildToolbar() {
    return $t(this);
  }
  _rebindControlHandlers() {
    return Xt(this);
  }
  _updateSettingsBtnState(e) {
    return qt(this, e);
  }
  _applySidebarPosition() {
    return Kt(this);
  }
  refreshSidebar() {
    var e;
    (e = this._sidebar) == null || e.refresh();
  }
  _resetGenDropdownForCurrentDocument() {
    return Yt(this);
  }
  _bindDocumentUiHandlers() {
    return Zt(this);
  }
  _unbindDocumentUiHandlers() {
    return Jt(this);
  }
  _isGenDropdownOpen() {
    return Qt(this);
  }
  _openGenDropdown() {
    return wt(this);
  }
  _closeGenDropdown() {
    return vt(this);
  }
  _updateGenBtnUI() {
    return te(this);
  }
  _buildGenDropdown() {
    return ee(this);
  }
  _getGenFields(e) {
    return ne(this, e);
  }
  _buildGenInfoDOM(e) {
    return oe(this, e);
  }
  _notifyModeChanged() {
    return se(this);
  }
  _cycleMode() {
    return ie(this);
  }
  setMode(e) {
    return le(this, e);
  }
  getPinnedSlots() {
    return ae(this);
  }
  _updatePinUI() {
    return re(this);
  }
  _updateModeBtnUI() {
    return de(this);
  }
  setLiveActive(e) {
    return ce(this, e);
  }
  setPreviewActive(e) {
    return ue(this, e);
  }
  loadPreviewBlob(e) {
    return pe(this, e);
  }
  _revokePreviewBlob() {
    return me(this);
  }
  setNodeStreamActive(e) {
    return he(this);
  }
  loadMediaA(e, { autoMode: n = !1 } = {}) {
    return De(this, e, { autoMode: n });
  }
  /**
   * Load two assets for compare modes.
   * Auto-switches from SIMPLE → AB on first call.
   */
  loadMediaPair(e, n) {
    return Re(this, e, n);
  }
  /**
   * Load up to 4 assets for grid compare mode.
   * Auto-switches to GRID mode if not already.
   */
  loadMediaQuad(e, n, o, i) {
    return Oe(this, e, n, o, i);
  }
  /** Apply current zoom+pan state to all media elements (img/video only — divider/overlays unaffected). */
  _applyTransform() {
    if (!this._contentEl) return;
    const e = Math.max(K, Math.min(Y, this._zoom)), n = this._contentEl.clientWidth || 0, o = this._contentEl.clientHeight || 0, i = Math.max(0, (e - 1) * n / 2), s = Math.max(0, (e - 1) * o / 2);
    this._panX = Math.max(-i, Math.min(i, this._panX)), this._panY = Math.max(-s, Math.min(s, this._panY));
    const a = `translate(${this._panX}px,${this._panY}px) scale(${e})`;
    for (const r of this._contentEl.querySelectorAll(".mjr-mfv-media"))
      r != null && r._mjrDisableViewerTransform || (r.style.transform = a, r.style.transformOrigin = "center");
    this._contentEl.classList.remove("mjr-mfv-content--grab", "mjr-mfv-content--grabbing"), e > 1.01 && this._contentEl.classList.add(
      this._dragging ? "mjr-mfv-content--grabbing" : "mjr-mfv-content--grab"
    );
  }
  /**
   * Set zoom, optionally centered at (clientX, clientY).
   * Keeps the image point under the cursor stationary.
   */
  _setMfvZoom(e, n, o) {
    const i = Math.max(K, Math.min(Y, this._zoom)), s = Math.max(K, Math.min(Y, Number(e) || 1));
    if (n != null && o != null && this._contentEl) {
      const a = s / i, r = this._contentEl.getBoundingClientRect(), u = n - (r.left + r.width / 2), l = o - (r.top + r.height / 2);
      this._panX = this._panX * a + (1 - a) * u, this._panY = this._panY * a + (1 - a) * l;
    }
    this._zoom = s, Math.abs(s - 1) < 1e-3 && (this._zoom = 1, this._panX = 0, this._panY = 0), this._applyTransform();
  }
  /** Reset zoom and pan to the default 1:1 fit. Called when new media is loaded. */
  _resetMfvZoom() {
    this._zoom = 1, this._panX = 0, this._panY = 0, this._applyTransform();
  }
  /** Bind wheel + pointer events to the clip viewport element. */
  _initPanZoom(e) {
    if (this._destroyPanZoom(), !e) return;
    this._panzoomAC = new AbortController();
    const n = { signal: this._panzoomAC.signal };
    e.addEventListener(
      "wheel",
      (l) => {
        var m, _;
        if ((_ = (m = l.target) == null ? void 0 : m.closest) != null && _.call(m, "audio") || q(l.target)) return;
        const c = St(l.target, e);
        if (c && Bt(
          c,
          Number(l.deltaX || 0),
          Number(l.deltaY || 0)
        ))
          return;
        l.preventDefault();
        const h = 1 - (l.deltaY || l.deltaX || 0) * ft;
        this._setMfvZoom(this._zoom * h, l.clientX, l.clientY);
      },
      { ...n, passive: !1 }
    );
    let o = !1, i = 0, s = 0, a = 0, r = 0;
    e.addEventListener(
      "pointerdown",
      (l) => {
        var c, d, h, m, _, p, f;
        if (!(l.button !== 0 && l.button !== 1) && !(this._zoom <= 1.01) && !((d = (c = l.target) == null ? void 0 : c.closest) != null && d.call(c, "video")) && !((m = (h = l.target) == null ? void 0 : h.closest) != null && m.call(h, "audio")) && !((p = (_ = l.target) == null ? void 0 : _.closest) != null && p.call(_, ".mjr-mfv-ab-divider")) && !q(l.target)) {
          l.preventDefault(), o = !0, this._dragging = !0, i = l.clientX, s = l.clientY, a = this._panX, r = this._panY;
          try {
            e.setPointerCapture(l.pointerId);
          } catch (g) {
            (f = console.debug) == null || f.call(console, g);
          }
          this._applyTransform();
        }
      },
      n
    ), e.addEventListener(
      "pointermove",
      (l) => {
        o && (this._panX = a + (l.clientX - i), this._panY = r + (l.clientY - s), this._applyTransform());
      },
      n
    );
    const u = (l) => {
      var c;
      if (o) {
        o = !1, this._dragging = !1;
        try {
          e.releasePointerCapture(l.pointerId);
        } catch (d) {
          (c = console.debug) == null || c.call(console, d);
        }
        this._applyTransform();
      }
    };
    e.addEventListener("pointerup", u, n), e.addEventListener("pointercancel", u, n), e.addEventListener(
      "dblclick",
      (l) => {
        var d, h, m, _;
        if ((h = (d = l.target) == null ? void 0 : d.closest) != null && h.call(d, "video") || (_ = (m = l.target) == null ? void 0 : m.closest) != null && _.call(m, "audio") || q(l.target)) return;
        const c = Math.abs(this._zoom - 1) < 0.05;
        this._setMfvZoom(c ? Math.min(4, this._zoom * 4) : 1, l.clientX, l.clientY);
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
        this._compareSyncAC = ht(o, i, { threshold: 0.08 });
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
      this._mediaProgressEl && this._contentEl.appendChild(this._mediaProgressEl), this._applyTransform(), this._initPanZoom(this._contentEl), this._initCompareSync();
    }
  }
  _renderSimple() {
    if (!this._mediaA) {
      this._contentEl.appendChild(F());
      return;
    }
    const e = L(this._mediaA), n = V(this._mediaA);
    if (!n) {
      this._contentEl.appendChild(F("Could not load media"));
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
    const e = this._mediaA ? V(this._mediaA, { fill: !0 }) : null, n = this._mediaB ? V(this._mediaB, { fill: !0 }) : null, o = this._mediaA ? L(this._mediaA) : "", i = this._mediaB ? L(this._mediaB) : "";
    if (!e && !n) {
      this._contentEl.appendChild(F("Select 2 assets for A/B compare"));
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
    const a = document.createElement("div");
    a.className = "mjr-mfv-ab-layer", e && a.appendChild(e);
    const r = document.createElement("div");
    r.className = "mjr-mfv-ab-layer mjr-mfv-ab-layer--b";
    const u = Math.round(this._abDividerX * 100);
    r.style.clipPath = `inset(0 0 0 ${u}%)`, r.appendChild(n);
    const l = document.createElement("div");
    l.className = "mjr-mfv-ab-divider", l.style.left = `${u}%`;
    const c = this._buildGenInfoDOM(this._mediaA);
    let d = null;
    c && (d = document.createElement("div"), d.className = "mjr-mfv-geninfo-a", d.appendChild(c), d.style.right = `calc(${100 - u}% + 8px)`);
    const h = this._buildGenInfoDOM(this._mediaB);
    let m = null;
    h && (m = document.createElement("div"), m.className = "mjr-mfv-geninfo-b", m.appendChild(h), m.style.left = `calc(${u}% + 8px)`);
    let _ = null;
    l.addEventListener(
      "pointerdown",
      (f) => {
        f.preventDefault(), l.setPointerCapture(f.pointerId);
        try {
          _ == null || _.abort();
        } catch {
        }
        _ = new AbortController();
        const g = _.signal, y = s.getBoundingClientRect(), C = (A) => {
          const M = Math.max(0.02, Math.min(0.98, (A.clientX - y.left) / y.width));
          this._abDividerX = M;
          const P = Math.round(M * 100);
          r.style.clipPath = `inset(0 0 0 ${P}%)`, l.style.left = `${P}%`, d && (d.style.right = `calc(${100 - P}% + 8px)`), m && (m.style.left = `calc(${P}% + 8px)`);
        }, E = () => {
          try {
            _ == null || _.abort();
          } catch {
          }
        };
        l.addEventListener("pointermove", C, { signal: g }), l.addEventListener("pointerup", E, { signal: g });
      },
      (p = this._panelAC) != null && p.signal ? { signal: this._panelAC.signal } : void 0
    ), s.appendChild(a), s.appendChild(r), s.appendChild(l), d && s.appendChild(d), m && s.appendChild(m), s.appendChild(k("A", "left")), s.appendChild(k("B", "right")), this._contentEl.appendChild(s);
  }
  _renderSide() {
    const e = this._mediaA ? V(this._mediaA) : null, n = this._mediaB ? V(this._mediaB) : null, o = this._mediaA ? L(this._mediaA) : "", i = this._mediaB ? L(this._mediaB) : "";
    if (!e && !n) {
      this._contentEl.appendChild(F("Select 2 assets for Side-by-Side"));
      return;
    }
    const s = document.createElement("div");
    s.className = "mjr-mfv-side-container";
    const a = document.createElement("div");
    a.className = "mjr-mfv-side-panel", e ? a.appendChild(e) : a.appendChild(F("—")), a.appendChild(k("A", "left"));
    const r = o === "audio" ? null : this._buildGenInfoDOM(this._mediaA);
    if (r) {
      const c = document.createElement("div");
      c.className = "mjr-mfv-geninfo-a", c.appendChild(r), a.appendChild(c);
    }
    const u = document.createElement("div");
    u.className = "mjr-mfv-side-panel", n ? u.appendChild(n) : u.appendChild(F("—")), u.appendChild(k("B", "right"));
    const l = i === "audio" ? null : this._buildGenInfoDOM(this._mediaB);
    if (l) {
      const c = document.createElement("div");
      c.className = "mjr-mfv-geninfo-b", c.appendChild(l), u.appendChild(c);
    }
    s.appendChild(a), s.appendChild(u), this._contentEl.appendChild(s);
  }
  _renderGrid() {
    const e = [
      { media: this._mediaA, label: "A" },
      { media: this._mediaB, label: "B" },
      { media: this._mediaC, label: "C" },
      { media: this._mediaD, label: "D" }
    ];
    if (!e.filter((i) => i.media).length) {
      this._contentEl.appendChild(F("Select up to 4 assets for Grid Compare"));
      return;
    }
    const o = document.createElement("div");
    o.className = "mjr-mfv-grid-container";
    for (const { media: i, label: s } of e) {
      const a = document.createElement("div");
      if (a.className = "mjr-mfv-grid-cell", i) {
        const r = L(i), u = V(i);
        if (u ? a.appendChild(u) : a.appendChild(F("—")), a.appendChild(
          k(s, s === "A" || s === "C" ? "left" : "right")
        ), r !== "audio") {
          const l = this._buildGenInfoDOM(i);
          if (l) {
            const c = document.createElement("div");
            c.className = `mjr-mfv-geninfo-${s.toLowerCase()}`, c.appendChild(l), a.appendChild(c);
          }
        }
      } else
        a.appendChild(F("—")), a.appendChild(
          k(s, s === "A" || s === "C" ? "left" : "right")
        );
      o.appendChild(a);
    }
    this._contentEl.appendChild(o);
  }
  // ── Visibility ────────────────────────────────────────────────────────────
  show() {
    this.element && (this._bindDocumentUiHandlers(), this.element.classList.add("is-visible"), this.element.setAttribute("aria-hidden", "false"), this.isVisible = !0);
  }
  hide() {
    this.element && (this._destroyPanZoom(), this._destroyCompareSync(), this._stopEdgeResize(), this._closeGenDropdown(), Pt(this.element), this.element.classList.remove("is-visible"), this.element.setAttribute("aria-hidden", "true"), this.isVisible = !1);
  }
  // ── Pop-out / Pop-in (separate OS window for second monitor) ────────────
  _setDesktopExpanded(e) {
    return fe(this, e);
  }
  _activateDesktopExpandedFallback(e) {
    return ge(this, e);
  }
  _tryElectronPopupFallback(e, n, o, i) {
    return be(this, e, n, o, i);
  }
  popOut() {
    return ye(this);
  }
  _fallbackPopout(e, n, o) {
    return Ce(this, e, n, o);
  }
  _clearPopoutCloseWatch() {
    return Ee(this);
  }
  _startPopoutCloseWatch() {
    return Ae(this);
  }
  _schedulePopInFromPopupClose() {
    return Se(this);
  }
  _installPopoutStyles(e) {
    return Be(this, e);
  }
  popIn(e) {
    return Pe(this, e);
  }
  _updatePopoutBtnUI() {
    return Me(this);
  }
  get isPopped() {
    return this._isPopped || this._desktopExpanded;
  }
  _resizeCursorForDirection(e) {
    return Ie(e);
  }
  _getResizeDirectionFromPoint(e, n, o) {
    return Fe(e, n, o);
  }
  _stopEdgeResize() {
    return Ne(this);
  }
  _bindPanelInteractions() {
    return Le(this);
  }
  _initEdgeResize(e) {
    return xe(this, e);
  }
  _initDrag(e) {
    return ke(this, e);
  }
  async _drawMediaFit(e, n, o, i, s, a, r) {
    return Ve(this, e, n, o, i, s, a, r);
  }
  _estimateGenInfoOverlayHeight(e, n, o) {
    return je(this, e, n, o);
  }
  _drawGenInfoOverlay(e, n, o, i, s, a) {
    return Te(this, e, n, o, i, s, a);
  }
  async _captureView() {
    return Ge(this);
  }
  dispose() {
    var e, n, o, i, s, a, r, u, l, c, d, h, m, _, p, f, g, y;
    _t(this), this._destroyPanZoom(), this._destroyCompareSync(), this._stopEdgeResize(), this._clearPopoutCloseWatch();
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
      (a = console.debug) == null || a.call(console, C);
    }
    try {
      (r = this._popoutAC) == null || r.abort(), this._popoutAC = null;
    } catch (C) {
      (u = console.debug) == null || u.call(console, C);
    }
    try {
      (l = this._panzoomAC) == null || l.abort(), this._panzoomAC = null;
    } catch (C) {
      (c = console.debug) == null || c.call(console, C);
    }
    try {
      (h = (d = this._compareSyncAC) == null ? void 0 : d.abort) == null || h.call(d), this._compareSyncAC = null;
    } catch (C) {
      (m = console.debug) == null || m.call(console, C);
    }
    try {
      this._isPopped && this.popIn();
    } catch (C) {
      (_ = console.debug) == null || _.call(console, C);
    }
    this._revokePreviewBlob(), this._onSidebarPosChanged && (window.removeEventListener("mjr-settings-changed", this._onSidebarPosChanged), this._onSidebarPosChanged = null);
    try {
      (p = this.element) == null || p.remove();
    } catch (C) {
      (f = console.debug) == null || f.call(console, C);
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
  We as FloatingViewer,
  b as MFV_MODES
};
