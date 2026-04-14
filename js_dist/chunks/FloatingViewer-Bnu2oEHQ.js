import { p as Ft, M as xt, c as kt, q as jt, t as Tt, A as Y, u as Z, v as N, x as bt, y as Vt, z as Gt, B as J, E as W, n as Rt, s as ot, C as dt, D as Ht, F as ct, G as ut, d as st, H as Ot, I as Dt } from "./entry-Dxlb7qvr.js";
import { ensureViewerMetadataAsset as Q } from "./genInfo-BTvYooH_.js";
const S = Object.freeze({
  SIMPLE: "simple",
  AB: "ab",
  SIDE: "side",
  GRID: "grid"
}), it = 0.25, rt = 8, Ut = 8e-4, w = 8, zt = "C", yt = "L", Ct = "K", $t = "N", Wt = "Esc", tt = 30;
function at(t) {
  const e = Number(t);
  if (!Number.isFinite(e) || e < 0) return "0:00";
  const n = Math.floor(e), o = Math.floor(n / 3600), i = Math.floor(n % 3600 / 60), s = n % 60;
  return o > 0 ? `${o}:${String(i).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${i}:${String(s).padStart(2, "0")}`;
}
function ft(t) {
  var e, n;
  try {
    const o = (e = t == null ? void 0 : t.play) == null ? void 0 : e.call(t);
    o && typeof o.catch == "function" && o.catch(() => {
    });
  } catch (o) {
    (n = console.debug) == null || n.call(console, o);
  }
}
function Xt(t, e) {
  const n = Math.floor(Number(t) || 0), o = Math.max(0, Math.floor(Number(e) || 0));
  return n < 0 ? 0 : o > 0 && n > o ? o : n;
}
function ht(t, e) {
  const n = Number((t == null ? void 0 : t.currentTime) || 0), o = Number(e) > 0 ? Number(e) : tt;
  return Math.max(0, Math.floor(n * o));
}
function St(t, e) {
  const n = Number((t == null ? void 0 : t.duration) || 0), o = Number(e) > 0 ? Number(e) : tt;
  return !Number.isFinite(n) || n <= 0 ? 0 : Math.max(0, Math.floor(n * o));
}
function Kt(t, e, n) {
  var d;
  const o = Number(n) > 0 ? Number(n) : tt, i = St(t, o), l = Xt(e, i) / o;
  try {
    t.currentTime = Math.max(0, l);
  } catch (u) {
    (d = console.debug) == null || d.call(console, u);
  }
}
function qt(t) {
  return t instanceof HTMLMediaElement;
}
function Yt(t, e) {
  return String(t || "").toLowerCase() === "video" ? !0 : e instanceof HTMLVideoElement;
}
function Zt(t, e) {
  return String(t || "").toLowerCase() === "audio" ? !0 : e instanceof HTMLAudioElement;
}
function vt(t) {
  const e = String(t || "").toLowerCase();
  return e === "gif" || e === "animated-image";
}
function wt(t) {
  var e;
  try {
    const n = Number((t == null ? void 0 : t.naturalWidth) || (t == null ? void 0 : t.width) || 0), o = Number((t == null ? void 0 : t.naturalHeight) || (t == null ? void 0 : t.height) || 0);
    if (!(n > 0 && o > 0)) return "";
    const i = document.createElement("canvas");
    i.width = n, i.height = o;
    const s = i.getContext("2d");
    return s ? (s.drawImage(t, 0, 0, n, o), i.toDataURL("image/png")) : "";
  } catch (n) {
    return (e = console.debug) == null || e.call(console, n), "";
  }
}
function lt(t, e = null, { kind: n = "" } = {}) {
  var mt;
  if (!t || t._mjrSimplePlayerMounted) return (t == null ? void 0 : t.parentElement) || null;
  t._mjrSimplePlayerMounted = !0;
  const o = Ft(e) || tt, i = qt(t), s = Yt(n, t), l = Zt(n, t), d = vt(n), u = document.createElement("div");
  u.className = "mjr-mfv-simple-player", u.tabIndex = 0, u.setAttribute("role", "group"), u.setAttribute("aria-label", "Media player"), l && u.classList.add("is-audio"), d && u.classList.add("is-animated-image");
  const r = document.createElement("div");
  r.className = "mjr-mfv-simple-player-controls";
  const a = document.createElement("input");
  a.type = "range", a.className = "mjr-mfv-simple-player-seek", a.min = "0", a.max = "1000", a.step = "1", a.value = "0", a.setAttribute("aria-label", "Seek"), i || (a.disabled = !0, a.classList.add("is-disabled"));
  const c = document.createElement("div");
  c.className = "mjr-mfv-simple-player-row";
  const f = document.createElement("button");
  f.type = "button", f.className = "mjr-icon-btn mjr-mfv-simple-player-btn", f.setAttribute("aria-label", "Play/Pause");
  const m = document.createElement("i");
  m.className = "pi pi-pause", m.setAttribute("aria-hidden", "true"), f.appendChild(m);
  const h = document.createElement("button");
  h.type = "button", h.className = "mjr-icon-btn mjr-mfv-simple-player-btn", h.setAttribute("aria-label", "Step back");
  const p = document.createElement("i");
  p.className = "pi pi-step-backward", p.setAttribute("aria-hidden", "true"), h.appendChild(p);
  const _ = document.createElement("button");
  _.type = "button", _.className = "mjr-icon-btn mjr-mfv-simple-player-btn", _.setAttribute("aria-label", "Step forward");
  const b = document.createElement("i");
  b.className = "pi pi-step-forward", b.setAttribute("aria-hidden", "true"), _.appendChild(b);
  const y = document.createElement("div");
  y.className = "mjr-mfv-simple-player-time", y.textContent = "0:00 / 0:00";
  const C = document.createElement("div");
  C.className = "mjr-mfv-simple-player-frame", C.textContent = "F: 0", s || (C.style.display = "none");
  const E = document.createElement("button");
  E.type = "button", E.className = "mjr-icon-btn mjr-mfv-simple-player-btn", E.setAttribute("aria-label", "Mute/Unmute");
  const B = document.createElement("i");
  if (B.className = "pi pi-volume-up", B.setAttribute("aria-hidden", "true"), E.appendChild(B), s || (h.disabled = !0, _.disabled = !0, h.classList.add("is-disabled"), _.classList.add("is-disabled")), c.appendChild(h), c.appendChild(f), c.appendChild(_), c.appendChild(y), c.appendChild(C), c.appendChild(E), r.appendChild(a), r.appendChild(c), u.appendChild(t), l) {
    const g = document.createElement("div");
    g.className = "mjr-mfv-simple-player-audio-backdrop", g.textContent = String((e == null ? void 0 : e.filename) || "Audio"), u.appendChild(g);
  }
  u.appendChild(r);
  try {
    t instanceof HTMLMediaElement && (t.controls = !1, t.playsInline = !0, t.loop = !0, t.muted = !0, t.autoplay = !0);
  } catch (g) {
    (mt = console.debug) == null || mt.call(console, g);
  }
  const I = d ? String((t == null ? void 0 : t.src) || "") : "";
  let M = !1, V = "";
  const k = () => {
    if (i) {
      m.className = t.paused ? "pi pi-play" : "pi pi-pause";
      return;
    }
    if (d) {
      m.className = M ? "pi pi-play" : "pi pi-pause";
      return;
    }
    m.className = "pi pi-play";
  }, D = () => {
    if (t instanceof HTMLMediaElement) {
      B.className = t.muted ? "pi pi-volume-off" : "pi pi-volume-up";
      return;
    }
    B.className = "pi pi-volume-off", E.disabled = !0, E.classList.add("is-disabled");
  }, F = () => {
    if (!s || !(t instanceof HTMLVideoElement)) return;
    const g = ht(t, o), A = St(t, o);
    C.textContent = A > 0 ? `F: ${g}/${A}` : `F: ${g}`;
  }, O = () => {
    const g = Math.max(0, Math.min(100, Number(a.value) / 1e3 * 100));
    a.style.setProperty("--mjr-seek-pct", `${g}%`);
  }, G = () => {
    if (!i) {
      y.textContent = d ? "Animated" : "Preview", a.value = "0", O();
      return;
    }
    const g = Number(t.currentTime || 0), A = Number(t.duration || 0);
    if (Number.isFinite(A) && A > 0) {
      const L = Math.max(0, Math.min(1, g / A));
      a.value = String(Math.round(L * 1e3)), y.textContent = `${at(g)} / ${at(A)}`;
    } else
      a.value = "0", y.textContent = `${at(g)} / 0:00`;
    O();
  }, K = (g) => {
    var A;
    try {
      (A = g == null ? void 0 : g.stopPropagation) == null || A.call(g);
    } catch {
    }
  }, pt = (g) => {
    var A, L;
    K(g);
    try {
      if (i)
        t.paused ? ft(t) : (A = t.pause) == null || A.call(t);
      else if (d)
        if (!M)
          V || (V = wt(t)), V && (t.src = V), M = !0;
        else {
          const x = I ? `${I}${I.includes("?") ? "&" : "?"}mjr_anim=${Date.now()}` : t.src;
          t.src = x, M = !1;
        }
    } catch (x) {
      (L = console.debug) == null || L.call(console, x);
    }
    k();
  }, v = (g, A) => {
    var x, T;
    if (K(A), !s || !(t instanceof HTMLVideoElement)) return;
    try {
      (x = t.pause) == null || x.call(t);
    } catch (nt) {
      (T = console.debug) == null || T.call(console, nt);
    }
    const L = ht(t, o);
    Kt(t, L + g, o), k(), F(), G();
  }, Pt = (g) => {
    var A;
    if (K(g), t instanceof HTMLMediaElement) {
      try {
        t.muted = !t.muted;
      } catch (L) {
        (A = console.debug) == null || A.call(console, L);
      }
      D();
    }
  }, Nt = (g) => {
    var x;
    if (K(g), !i) return;
    O();
    const A = Number(t.duration || 0);
    if (!Number.isFinite(A) || A <= 0) return;
    const L = Math.max(0, Math.min(1, Number(a.value) / 1e3));
    try {
      t.currentTime = A * L;
    } catch (T) {
      (x = console.debug) == null || x.call(console, T);
    }
    F(), G();
  }, et = (g) => K(g), It = (g) => {
    var A, L, x, T;
    try {
      if ((L = (A = g == null ? void 0 : g.target) == null ? void 0 : A.closest) != null && L.call(A, "button, input, textarea, select")) return;
      (x = u.focus) == null || x.call(u, { preventScroll: !0 });
    } catch (nt) {
      (T = console.debug) == null || T.call(console, nt);
    }
  }, Lt = (g) => {
    var L, x, T;
    const A = String((g == null ? void 0 : g.key) || "");
    if (!(!A || g != null && g.altKey || g != null && g.ctrlKey || g != null && g.metaKey)) {
      if (A === " " || A === "Spacebar") {
        (L = g.preventDefault) == null || L.call(g), pt(g);
        return;
      }
      if (A === "ArrowLeft") {
        if (!s) return;
        (x = g.preventDefault) == null || x.call(g), v(-1, g);
        return;
      }
      if (A === "ArrowRight") {
        if (!s) return;
        (T = g.preventDefault) == null || T.call(g), v(1, g);
      }
    }
  };
  return f.addEventListener("click", pt), h.addEventListener("click", (g) => v(-1, g)), _.addEventListener("click", (g) => v(1, g)), E.addEventListener("click", Pt), a.addEventListener("input", Nt), r.addEventListener("pointerdown", et), r.addEventListener("click", et), r.addEventListener("dblclick", et), u.addEventListener("pointerdown", It), u.addEventListener("keydown", Lt), t instanceof HTMLMediaElement && (t.addEventListener("play", k, { passive: !0 }), t.addEventListener("pause", k, { passive: !0 }), t.addEventListener(
    "timeupdate",
    () => {
      F(), G();
    },
    { passive: !0 }
  ), t.addEventListener(
    "seeked",
    () => {
      F(), G();
    },
    { passive: !0 }
  ), t.addEventListener(
    "loadedmetadata",
    () => {
      F(), G();
    },
    { passive: !0 }
  )), ft(t), k(), D(), F(), G(), u;
}
const Jt = /* @__PURE__ */ new Set([".mp4", ".webm", ".mov", ".avi", ".mkv"]), Qt = /* @__PURE__ */ new Set([".mp3", ".wav", ".flac", ".ogg", ".m4a", ".aac", ".opus", ".wma"]);
function At(t) {
  try {
    const e = String(t || "").trim(), n = e.lastIndexOf(".");
    return n >= 0 ? e.slice(n).toLowerCase() : "";
  } catch {
    return "";
  }
}
function H(t) {
  const e = String((t == null ? void 0 : t.kind) || "").toLowerCase();
  if (e === "video") return "video";
  if (e === "audio") return "audio";
  if (e === "model3d") return "model3d";
  const n = At((t == null ? void 0 : t.filename) || "");
  return n === ".gif" ? "gif" : Jt.has(n) ? "video" : Qt.has(n) ? "audio" : xt.has(n) ? "model3d" : "image";
}
function Et(t) {
  return t ? t.url ? String(t.url) : t.filename && t.id == null ? jt(t.filename, t.subfolder || "", t.type || "output") : t.filename && Tt(t) || "" : "";
}
function R(t = "No media — select assets in the grid") {
  const e = document.createElement("div");
  return e.className = "mjr-mfv-empty", e.textContent = t, e;
}
function U(t, e) {
  const n = document.createElement("div");
  return n.className = `mjr-mfv-label label-${e}`, n.textContent = t, n;
}
function _t(t) {
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
function te(t, e) {
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
function ee(t, e, n) {
  if (!t) return !1;
  if (Math.abs(Number(n) || 0) >= Math.abs(Number(e) || 0)) {
    const s = Number(t.scrollTop || 0), l = Math.max(0, Number(t.scrollHeight || 0) - Number(t.clientHeight || 0));
    if (n < 0 && s > 0 || n > 0 && s < l) return !0;
  }
  const o = Number(t.scrollLeft || 0), i = Math.max(0, Number(t.scrollWidth || 0) - Number(t.clientWidth || 0));
  return e < 0 && o > 0 || e > 0 && o < i;
}
function ne(t) {
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
function z(t, { fill: e = !1 } = {}) {
  var u, r;
  const n = Et(t);
  if (!n) return null;
  const o = H(t), i = `mjr-mfv-media mjr-mfv-media--fit-height${e ? " mjr-mfv-media--fill" : ""}`, l = At((t == null ? void 0 : t.filename) || "") === ".webp" && Number((t == null ? void 0 : t.duration) ?? ((u = t == null ? void 0 : t.metadata_raw) == null ? void 0 : u.duration) ?? 0) > 0;
  if (o === "audio") {
    const a = document.createElement("audio");
    a.className = i, a.src = n, a.controls = !1, a.autoplay = !0, a.preload = "metadata", a.loop = !0, a.muted = !0;
    try {
      a.addEventListener("loadedmetadata", () => _t(a), { once: !0 });
    } catch (f) {
      (r = console.debug) == null || r.call(console, f);
    }
    return _t(a), lt(a, t, { kind: "audio" }) || a;
  }
  if (o === "video") {
    const a = document.createElement("video");
    return a.className = i, a.src = n, a.controls = !1, a.loop = !0, a.muted = !0, a.autoplay = !0, a.playsInline = !0, lt(a, t, { kind: "video" }) || a;
  }
  if (o === "model3d")
    return kt(t, n, {
      hostClassName: `mjr-model3d-host mjr-mfv-model3d-host${e ? " mjr-mfv-model3d-host--fill" : ""}`,
      canvasClassName: `mjr-mfv-media mjr-model3d-render-canvas${e ? " mjr-mfv-media--fill" : ""}`,
      hintText: "Rotate: left drag  Pan: right drag  Zoom: wheel or middle drag",
      disableViewerTransform: !0,
      pauseDuringExecution: !!Y.FLOATING_VIEWER_PAUSE_DURING_EXECUTION
    });
  const d = document.createElement("img");
  return d.className = i, d.src = n, d.alt = String((t == null ? void 0 : t.filename) || ""), d.draggable = !1, (o === "gif" || l) && lt(d, t, {
    kind: o === "gif" ? "gif" : "animated-image"
  }) || d;
}
function Bt(t, e, n, o, i, s) {
  t.beginPath(), typeof t.roundRect == "function" ? t.roundRect(e, n, o, i, s) : (t.moveTo(e + s, n), t.lineTo(e + o - s, n), t.quadraticCurveTo(e + o, n, e + o, n + s), t.lineTo(e + o, n + i - s), t.quadraticCurveTo(e + o, n + i, e + o - s, n + i), t.lineTo(e + s, n + i), t.quadraticCurveTo(e, n + i, e, n + i - s), t.lineTo(e, n + s), t.quadraticCurveTo(e, n, e + s, n), t.closePath());
}
function q(t, e, n, o) {
  t.save(), t.font = "bold 10px system-ui, sans-serif";
  const i = 5, s = t.measureText(e).width;
  t.fillStyle = "rgba(0,0,0,0.58)", Bt(t, n, o, s + i * 2, 18, 4), t.fill(), t.fillStyle = "#fff", t.fillText(e, n + i, o + 13), t.restore();
}
function oe(t, e) {
  switch (String((t == null ? void 0 : t.type) || "").toLowerCase()) {
    case "number":
      return se(t, e);
    case "combo":
      return ie(t, e);
    case "text":
    case "string":
    case "customtext":
      return re(t, e);
    case "toggle":
      return ae(t, e);
    default:
      return le(t);
  }
}
function X(t, e) {
  var o, i, s, l, d, u, r;
  if (!t) return !1;
  const n = String(t.type || "").toLowerCase();
  if (n === "number") {
    const a = Number(e);
    if (Number.isNaN(a)) return !1;
    const c = t.options ?? {}, f = c.min ?? -1 / 0, m = c.max ?? 1 / 0;
    t.value = Math.min(m, Math.max(f, a));
  } else n === "toggle" ? t.value = !!e : t.value = e;
  try {
    (o = t.callback) == null || o.call(t, t.value);
  } catch (a) {
    (i = console.debug) == null || i.call(console, a);
  }
  try {
    const a = Z();
    (l = (s = a == null ? void 0 : a.canvas) == null ? void 0 : s.setDirty) == null || l.call(s, !0, !0), (u = (d = a == null ? void 0 : a.graph) == null ? void 0 : d.setDirtyCanvas) == null || u.call(d, !0, !0);
  } catch (a) {
    (r = console.debug) == null || r.call(console, a);
  }
  return !0;
}
function se(t, e) {
  const n = document.createElement("input");
  n.type = "number", n.className = "mjr-ws-input", n.value = t.value ?? "";
  const o = t.options ?? {};
  return o.min != null && (n.min = String(o.min)), o.max != null && (n.max = String(o.max)), o.step != null && (n.step = String(o.step)), n.addEventListener("input", () => {
    const i = n.value;
    i === "" || i === "-" || i === "." || i.endsWith(".") || (X(t, i), e == null || e(t.value));
  }), n.addEventListener("change", () => {
    X(t, n.value) && (n.value = t.value, e == null || e(t.value));
  }), n;
}
function ie(t, e) {
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
    X(t, n.value) && (e == null || e(t.value));
  }), n;
}
function re(t, e) {
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
    X(t, i.value) && (e == null || e(t.value));
  }), i.addEventListener("input", () => {
    X(t, i.value), d();
  }), s.addEventListener("click", () => {
    l = !l, d();
  }), o.appendChild(i), o.appendChild(s), requestAnimationFrame(d), o;
}
function ae(t, e) {
  const n = document.createElement("label");
  n.className = "mjr-ws-toggle-label";
  const o = document.createElement("input");
  return o.type = "checkbox", o.className = "mjr-ws-checkbox", o.checked = !!t.value, o.addEventListener("change", () => {
    X(t, o.checked) && (e == null || e(t.value));
  }), n.appendChild(o), n;
}
function le(t) {
  const e = document.createElement("input");
  return e.type = "text", e.className = "mjr-ws-input mjr-ws-readonly", e.value = t.value != null ? String(t.value) : "", e.readOnly = !0, e.tabIndex = -1, e;
}
const de = /* @__PURE__ */ new Set(["imageupload", "button", "hidden"]);
class ce {
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
    var a;
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
    let r = !1;
    for (const c of u) {
      const f = String(c.type || "").toLowerCase();
      if (de.has(f) || c.hidden || (a = c.options) != null && a.hidden) continue;
      r = !0;
      const m = f === "text" || f === "string" || f === "customtext", h = document.createElement("div");
      h.className = m ? "mjr-ws-widget-row mjr-ws-widget-row--block" : "mjr-ws-widget-row";
      const p = document.createElement("label");
      p.className = "mjr-ws-widget-label", p.textContent = c.name || "";
      const _ = document.createElement("div");
      _.className = "mjr-ws-widget-input";
      const b = oe(c, () => {
      });
      _.appendChild(b), this._inputMap.set(c.name, b), h.appendChild(p), h.appendChild(_), d.appendChild(h);
    }
    if (!r) {
      const c = document.createElement("div");
      c.className = "mjr-ws-node-empty", c.textContent = "No editable parameters", d.appendChild(c);
    }
    return n.appendChild(d), n;
  }
  _locateNode() {
    var n, o, i, s, l, d, u, r;
    if (this._onLocate) {
      this._onLocate();
      return;
    }
    const e = this._node;
    if (e)
      try {
        const a = Z(), c = a == null ? void 0 : a.canvas;
        if (!c) return;
        if (typeof c.centerOnNode == "function")
          c.centerOnNode(e);
        else if (c.ds && e.pos) {
          const f = ((n = c.canvas) == null ? void 0 : n.width) || ((o = c.element) == null ? void 0 : o.width) || 800, m = ((i = c.canvas) == null ? void 0 : i.height) || ((s = c.element) == null ? void 0 : s.height) || 600;
          c.ds.offset[0] = -e.pos[0] - (((l = e.size) == null ? void 0 : l[0]) || 0) / 2 + f / 2, c.ds.offset[1] = -e.pos[1] - (((d = e.size) == null ? void 0 : d[1]) || 0) / 2 + m / 2, (u = c.setDirty) == null || u.call(c, !0, !0);
        }
      } catch (a) {
        (r = console.debug) == null || r.call(console, "[MFV sidebar] locateNode error", a);
      }
  }
}
class ue {
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
    const e = pe();
    if (!e.length) {
      this._showEmpty();
      return;
    }
    for (const n of e) {
      const o = new ce(n);
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
function pe() {
  var t, e, n;
  try {
    const o = Z(), i = ((t = o == null ? void 0 : o.canvas) == null ? void 0 : t.selected_nodes) ?? ((e = o == null ? void 0 : o.canvas) == null ? void 0 : e.selectedNodes) ?? null;
    if (!i) return [];
    if (Array.isArray(i)) return i.filter(Boolean);
    if (i instanceof Map) return Array.from(i.values()).filter(Boolean);
    if (typeof i == "object") return Object.values(i).filter(Boolean);
  } catch (o) {
    (n = console.debug) == null || n.call(console, "[MFV sidebar] _getSelectedNodes error", o);
  }
  return [];
}
const j = Object.freeze({ IDLE: "idle", RUNNING: "running", ERROR: "error" }), me = /* @__PURE__ */ new Set(["default", "auto", "latent2rgb", "taesd", "none"]);
function fe() {
  const t = document.createElement("div");
  t.className = "mjr-mfv-run-controls";
  const e = document.createElement("button");
  e.type = "button", e.className = "mjr-icon-btn mjr-mfv-run-btn";
  const n = N("tooltip.queuePrompt", "Queue Prompt (Run)");
  e.title = n, e.setAttribute("aria-label", n);
  const o = document.createElement("i");
  o.className = "pi pi-play", o.setAttribute("aria-hidden", "true"), e.appendChild(o);
  const i = document.createElement("button");
  i.type = "button", i.className = "mjr-icon-btn mjr-mfv-stop-btn";
  const s = document.createElement("i");
  s.className = "pi pi-stop", s.setAttribute("aria-hidden", "true"), i.appendChild(s), t.appendChild(e), t.appendChild(i);
  let l = j.IDLE;
  function d(f) {
    l = f, e.classList.toggle("running", l === j.RUNNING), e.classList.toggle("error", l === j.ERROR), e.disabled = l === j.RUNNING, l === j.RUNNING ? o.className = "pi pi-spin pi-spinner" : o.className = "pi pi-play";
  }
  function u() {
    const f = N("tooltip.queueStop", "Stop Generation");
    i.title = f, i.setAttribute("aria-label", f);
  }
  async function r() {
    const f = Z(), m = bt(f);
    if (m && typeof m.interrupt == "function") {
      await m.interrupt();
      return;
    }
    const h = await fetch("/interrupt", { method: "POST" });
    if (!h.ok) throw new Error(`POST /interrupt failed (${h.status})`);
  }
  async function a() {
    var f;
    if (l !== j.RUNNING) {
      d(j.RUNNING);
      try {
        await be(), d(j.IDLE);
      } catch (m) {
        (f = console.error) == null || f.call(console, "[MFV Run]", m), d(j.ERROR), setTimeout(() => {
          l === j.ERROR && d(j.IDLE);
        }, 1500);
      }
    }
  }
  async function c() {
    var f;
    if (l !== j.RUNNING) {
      i.disabled = !0;
      try {
        await r();
      } catch (m) {
        (f = console.error) == null || f.call(console, "[MFV Stop]", m);
      } finally {
        i.disabled = !1;
      }
    }
  }
  return u(), e.addEventListener("click", a), i.addEventListener("click", c), {
    el: t,
    dispose() {
      e.removeEventListener("click", a), i.removeEventListener("click", c);
    }
  };
}
function he(t = Y.MFV_PREVIEW_METHOD) {
  const e = String(t || "").trim().toLowerCase();
  return me.has(e) ? e : "taesd";
}
function Mt(t, e = Y.MFV_PREVIEW_METHOD) {
  var i;
  const n = he(e), o = {
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
function _e(t, { previewMethod: e = Y.MFV_PREVIEW_METHOD, clientId: n = null } = {}) {
  const o = Mt(t, e), i = {
    prompt: o == null ? void 0 : o.output,
    extra_data: (o == null ? void 0 : o.extra_data) || {}
  }, s = String(n || "").trim();
  return s && (i.client_id = s), i;
}
function ge(t, e) {
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
async function be() {
  const t = Z();
  if (!t) throw new Error("ComfyUI app not available");
  const e = typeof t.graphToPrompt == "function" ? await t.graphToPrompt() : null;
  if (!(e != null && e.output)) throw new Error("graphToPrompt returned empty output");
  const n = bt(t);
  if (n && typeof n.queuePrompt == "function") {
    await n.queuePrompt(0, Mt(e));
    return;
  }
  const o = await fetch("/prompt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      _e(e, {
        clientId: ge(n, t)
      })
    )
  });
  if (!o.ok) throw new Error(`POST /prompt failed (${o.status})`);
}
function ye(t) {
  const e = document.createElement("div");
  return e.className = "mjr-mfv", e.setAttribute("role", "dialog"), e.setAttribute("aria-modal", "false"), e.setAttribute("aria-hidden", "true"), t.element = e, e.appendChild(t._buildHeader()), e.setAttribute("aria-labelledby", t._titleId), e.appendChild(t._buildToolbar()), e.appendChild(Vt(t)), t._contentWrapper = document.createElement("div"), t._contentWrapper.className = "mjr-mfv-content-wrapper", t._applySidebarPosition(), t._contentEl = document.createElement("div"), t._contentEl.className = "mjr-mfv-content", t._contentWrapper.appendChild(t._contentEl), t._contentEl.appendChild(Gt(t)), t._sidebar = new ue({
    hostEl: e,
    onClose: () => t._updateSettingsBtnState(!1)
  }), t._contentWrapper.appendChild(t._sidebar.el), e.appendChild(t._contentWrapper), t._rebindControlHandlers(), t._bindPanelInteractions(), t._bindDocumentUiHandlers(), t._onSidebarPosChanged = (n) => {
    var o;
    ((o = n == null ? void 0 : n.detail) == null ? void 0 : o.key) === "viewer.mfvSidebarPosition" && t._applySidebarPosition();
  }, window.addEventListener("mjr-settings-changed", t._onSidebarPosChanged), t._refresh(), e;
}
function Ce(t) {
  const e = document.createElement("div");
  e.className = "mjr-mfv-header";
  const n = document.createElement("span");
  n.className = "mjr-mfv-header-title", n.id = t._titleId, n.textContent = "Majoor Viewer Lite";
  const o = document.createElement("button");
  t._closeBtn = o, o.type = "button", o.className = "mjr-icon-btn mjr-mfv-close-btn", J(o, N("tooltip.closeViewer", "Close viewer"), Wt);
  const i = document.createElement("i");
  return i.className = "pi pi-times", i.setAttribute("aria-hidden", "true"), o.appendChild(i), e.appendChild(n), e.appendChild(o), e;
}
function Se(t) {
  var c, f;
  const e = document.createElement("div");
  e.className = "mjr-mfv-toolbar", t._modeBtn = document.createElement("button"), t._modeBtn.type = "button", t._modeBtn.className = "mjr-icon-btn", t._updateModeBtnUI(), e.appendChild(t._modeBtn), t._pinGroup = document.createElement("div"), t._pinGroup.className = "mjr-mfv-pin-group", t._pinGroup.setAttribute("role", "group"), t._pinGroup.setAttribute("aria-label", "Pin References"), t._pinBtns = {};
  for (const m of ["A", "B", "C", "D"]) {
    const h = document.createElement("button");
    h.type = "button", h.className = "mjr-mfv-pin-btn", h.textContent = m, h.dataset.slot = m, h.title = `Pin ${m}`, h.setAttribute("aria-pressed", "false"), t._pinBtns[m] = h, t._pinGroup.appendChild(h);
  }
  t._updatePinUI(), e.appendChild(t._pinGroup);
  const n = document.createElement("div");
  n.className = "mjr-mfv-toolbar-sep", n.setAttribute("aria-hidden", "true"), e.appendChild(n), t._liveBtn = document.createElement("button"), t._liveBtn.type = "button", t._liveBtn.className = "mjr-icon-btn", t._liveBtn.innerHTML = '<i class="pi pi-circle" aria-hidden="true"></i>', t._liveBtn.setAttribute("aria-pressed", "false"), J(
    t._liveBtn,
    N("tooltip.liveStreamOff", "Live Stream: OFF — click to follow"),
    yt
  ), e.appendChild(t._liveBtn), t._previewBtn = document.createElement("button"), t._previewBtn.type = "button", t._previewBtn.className = "mjr-icon-btn", t._previewBtn.innerHTML = '<i class="pi pi-eye" aria-hidden="true"></i>', t._previewBtn.setAttribute("aria-pressed", "false"), J(
    t._previewBtn,
    N(
      "tooltip.previewStreamOff",
      "KSampler Preview: OFF — click to stream denoising steps"
    ),
    Ct
  ), e.appendChild(t._previewBtn), t._nodeStreamBtn = document.createElement("button"), t._nodeStreamBtn.type = "button", t._nodeStreamBtn.className = "mjr-icon-btn", t._nodeStreamBtn.innerHTML = '<i class="pi pi-sitemap" aria-hidden="true"></i>', t._nodeStreamBtn.setAttribute("aria-pressed", "false"), J(
    t._nodeStreamBtn,
    N("tooltip.nodeStreamOff", "Node Stream: OFF — click to stream selected node output"),
    $t
  ), e.appendChild(t._nodeStreamBtn), (f = (c = t._nodeStreamBtn).remove) == null || f.call(c), t._nodeStreamBtn = null, t._genBtn = document.createElement("button"), t._genBtn.type = "button", t._genBtn.className = "mjr-icon-btn", t._genBtn.setAttribute("aria-haspopup", "dialog"), t._genBtn.setAttribute("aria-expanded", "false");
  const o = document.createElement("i");
  o.className = "pi pi-info-circle", o.setAttribute("aria-hidden", "true"), t._genBtn.appendChild(o), e.appendChild(t._genBtn), t._updateGenBtnUI(), t._popoutBtn = document.createElement("button"), t._popoutBtn.type = "button", t._popoutBtn.className = "mjr-icon-btn";
  const i = N("tooltip.popOutViewer", "Pop out viewer to separate window");
  t._popoutBtn.title = i, t._popoutBtn.setAttribute("aria-label", i), t._popoutBtn.setAttribute("aria-pressed", "false");
  const s = document.createElement("i");
  s.className = "pi pi-external-link", s.setAttribute("aria-hidden", "true"), t._popoutBtn.appendChild(s), e.appendChild(t._popoutBtn), t._captureBtn = document.createElement("button"), t._captureBtn.type = "button", t._captureBtn.className = "mjr-icon-btn";
  const l = N("tooltip.captureView", "Save view as image");
  t._captureBtn.title = l, t._captureBtn.setAttribute("aria-label", l);
  const d = document.createElement("i");
  d.className = "pi pi-download", d.setAttribute("aria-hidden", "true"), t._captureBtn.appendChild(d), e.appendChild(t._captureBtn);
  const u = document.createElement("div");
  u.className = "mjr-mfv-toolbar-sep", u.style.marginLeft = "auto", u.setAttribute("aria-hidden", "true"), e.appendChild(u), t._settingsBtn = document.createElement("button"), t._settingsBtn.type = "button", t._settingsBtn.className = "mjr-icon-btn mjr-mfv-settings-btn";
  const r = N("tooltip.nodeParams", "Node Parameters");
  t._settingsBtn.title = r, t._settingsBtn.setAttribute("aria-label", r), t._settingsBtn.setAttribute("aria-pressed", "false");
  const a = document.createElement("i");
  return a.className = "pi pi-sliders-h", a.setAttribute("aria-hidden", "true"), t._settingsBtn.appendChild(a), e.appendChild(t._settingsBtn), t._runHandle = fe(), e.appendChild(t._runHandle.el), t._handleDocClick = (m) => {
    var p, _;
    if (!t._genDropdown) return;
    const h = m == null ? void 0 : m.target;
    (_ = (p = t._genBtn) == null ? void 0 : p.contains) != null && _.call(p, h) || t._genDropdown.contains(h) || t._closeGenDropdown();
  }, t._bindDocumentUiHandlers(), e;
}
function Ae(t) {
  var n, o, i, s, l, d, u, r, a, c, f, m;
  try {
    (n = t._btnAC) == null || n.abort();
  } catch (h) {
    (o = console.debug) == null || o.call(console, h);
  }
  t._btnAC = new AbortController();
  const e = t._btnAC.signal;
  (i = t._closeBtn) == null || i.addEventListener(
    "click",
    () => {
      t._dispatchControllerAction("close", W.MFV_CLOSE);
    },
    { signal: e }
  ), (s = t._modeBtn) == null || s.addEventListener("click", () => t._cycleMode(), { signal: e }), (l = t._pinGroup) == null || l.addEventListener(
    "click",
    (h) => {
      var b, y;
      const p = (y = (b = h.target) == null ? void 0 : b.closest) == null ? void 0 : y.call(b, ".mjr-mfv-pin-btn");
      if (!p) return;
      const _ = p.dataset.slot;
      _ && (t._pinnedSlots.has(_) ? t._pinnedSlots.delete(_) : t._pinnedSlots.add(_), t._pinnedSlots.has("C") || t._pinnedSlots.has("D") ? t._mode !== S.GRID && t.setMode(S.GRID) : t._pinnedSlots.size > 0 && t._mode === S.SIMPLE && t.setMode(S.AB), t._updatePinUI());
    },
    { signal: e }
  ), (d = t._liveBtn) == null || d.addEventListener(
    "click",
    () => {
      t._dispatchControllerAction("toggleLive", W.MFV_LIVE_TOGGLE);
    },
    { signal: e }
  ), (u = t._previewBtn) == null || u.addEventListener(
    "click",
    () => {
      t._dispatchControllerAction("togglePreview", W.MFV_PREVIEW_TOGGLE);
    },
    { signal: e }
  ), (r = t._nodeStreamBtn) == null || r.addEventListener(
    "click",
    () => {
      t._dispatchControllerAction("toggleNodeStream", W.MFV_NODESTREAM_TOGGLE);
    },
    { signal: e }
  ), (a = t._genBtn) == null || a.addEventListener(
    "click",
    (h) => {
      var p, _;
      h.stopPropagation(), (_ = (p = t._genDropdown) == null ? void 0 : p.classList) != null && _.contains("is-visible") ? t._closeGenDropdown() : t._openGenDropdown();
    },
    { signal: e }
  ), (c = t._popoutBtn) == null || c.addEventListener(
    "click",
    () => {
      t._dispatchControllerAction("popOut", W.MFV_POPOUT);
    },
    { signal: e }
  ), (f = t._captureBtn) == null || f.addEventListener("click", () => t._captureView(), { signal: e }), (m = t._settingsBtn) == null || m.addEventListener(
    "click",
    () => {
      var h, p;
      (h = t._sidebar) == null || h.toggle(), t._updateSettingsBtnState(((p = t._sidebar) == null ? void 0 : p.isVisible) ?? !1);
    },
    { signal: e }
  );
}
function Ee(t, e) {
  t._settingsBtn && (t._settingsBtn.classList.toggle("active", !!e), t._settingsBtn.setAttribute("aria-pressed", String(!!e)));
}
function Be(t) {
  var n;
  if (!t._contentWrapper) return;
  const e = Y.MFV_SIDEBAR_POSITION || "right";
  t._contentWrapper.setAttribute("data-sidebar-pos", e), (n = t._sidebar) != null && n.el && t._contentEl && (e === "left" ? t._contentWrapper.insertBefore(t._sidebar.el, t._contentEl) : t._contentWrapper.appendChild(t._sidebar.el));
}
function Me(t) {
  var e, n, o;
  t._closeGenDropdown();
  try {
    (n = (e = t._genDropdown) == null ? void 0 : e.remove) == null || n.call(e);
  } catch (i) {
    (o = console.debug) == null || o.call(console, i);
  }
  t._genDropdown = null, t._updateGenBtnUI();
}
function Pe(t) {
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
function Ne(t) {
  var e, n;
  try {
    (e = t._docAC) == null || e.abort();
  } catch (o) {
    (n = console.debug) == null || n.call(console, o);
  }
  t._docAC = new AbortController(), t._docClickHost = null;
}
function Ie(t) {
  var e, n;
  return !!((n = (e = t._genDropdown) == null ? void 0 : e.classList) != null && n.contains("is-visible"));
}
function Le(t) {
  if (!t.element) return;
  t._genDropdown || (t._genDropdown = t._buildGenDropdown(), t.element.appendChild(t._genDropdown)), t._bindDocumentUiHandlers();
  const e = t._genBtn.getBoundingClientRect(), n = t.element.getBoundingClientRect(), o = e.left - n.left, i = e.bottom - n.top + 6;
  t._genDropdown.style.left = `${o}px`, t._genDropdown.style.top = `${i}px`, t._genDropdown.classList.add("is-visible"), t._updateGenBtnUI();
}
function Fe(t) {
  t._genDropdown && (t._genDropdown.classList.remove("is-visible"), t._updateGenBtnUI());
}
function xe(t) {
  if (!t._genBtn) return;
  const e = t._genInfoSelections.size, n = e > 0, o = t._isGenDropdownOpen();
  t._genBtn.classList.toggle("is-on", n), t._genBtn.classList.toggle("is-open", o);
  const i = n ? `Gen Info (${e} field${e > 1 ? "s" : ""} shown)${o ? " — open" : " — click to configure"}` : `Gen Info${o ? " — open" : " — click to show overlay"}`;
  t._genBtn.title = i, t._genBtn.setAttribute("aria-label", i), t._genBtn.setAttribute("aria-expanded", String(o)), t._genDropdown ? t._genBtn.setAttribute("aria-controls", t._genDropdownId) : t._genBtn.removeAttribute("aria-controls");
}
function ke(t) {
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
function gt(t) {
  const e = Number(t);
  return !Number.isFinite(e) || e <= 0 ? "" : e >= 60 ? `${(e / 60).toFixed(1)}m` : `${e.toFixed(1)}s`;
}
function je(t) {
  const e = String(t || "").trim().toLowerCase();
  if (!e) return 0;
  if (e.endsWith("m")) {
    const o = Number.parseFloat(e.slice(0, -1));
    return Number.isFinite(o) ? o * 60 : 0;
  }
  if (e.endsWith("s")) {
    const o = Number.parseFloat(e.slice(0, -1));
    return Number.isFinite(o) ? o : 0;
  }
  const n = Number.parseFloat(e);
  return Number.isFinite(n) ? n : 0;
}
function Te(t, e) {
  var s, l, d, u;
  if (!e) return {};
  try {
    const r = e.geninfo ? { geninfo: e.geninfo } : e.metadata || e.metadata_raw || e, a = Rt(r) || null, c = {
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
      a.prompt && (c.prompt = ot(String(a.prompt))), a.seed != null && (c.seed = String(a.seed)), a.model && (c.model = Array.isArray(a.model) ? a.model.join(", ") : String(a.model)), Array.isArray(a.loras) && (c.lora = a.loras.map(
        (m) => typeof m == "string" ? m : (m == null ? void 0 : m.name) || (m == null ? void 0 : m.lora_name) || (m == null ? void 0 : m.model_name) || ""
      ).filter(Boolean).join(", ")), a.sampler && (c.sampler = String(a.sampler)), a.scheduler && (c.scheduler = String(a.scheduler)), a.cfg != null && (c.cfg = String(a.cfg)), a.steps != null && (c.step = String(a.steps)), !c.prompt && (r != null && r.prompt) && (c.prompt = ot(String(r.prompt || "")));
      const f = e.generation_time_ms ?? ((s = e.metadata_raw) == null ? void 0 : s.generation_time_ms) ?? (r == null ? void 0 : r.generation_time_ms) ?? ((l = r == null ? void 0 : r.geninfo) == null ? void 0 : l.generation_time_ms) ?? 0;
      return f && Number.isFinite(Number(f)) && f > 0 && f < 864e5 && (c.genTime = gt(Number(f) / 1e3)), c;
    }
  } catch (r) {
    (d = console.debug) == null || d.call(console, "[MFV] geninfo normalize failed", r);
  }
  const n = (e == null ? void 0 : e.metadata) || (e == null ? void 0 : e.metadata_raw) || e || {}, o = {
    prompt: ot(String((n == null ? void 0 : n.prompt) || (n == null ? void 0 : n.positive) || "")),
    seed: (n == null ? void 0 : n.seed) != null ? String(n.seed) : "",
    model: (n == null ? void 0 : n.checkpoint) || (n == null ? void 0 : n.ckpt_name) || (n == null ? void 0 : n.model) || "",
    lora: Array.isArray(n == null ? void 0 : n.loras) ? n.loras.join(", ") : (n == null ? void 0 : n.lora) || "",
    sampler: (n == null ? void 0 : n.sampler_name) || (n == null ? void 0 : n.sampler) || "",
    scheduler: (n == null ? void 0 : n.scheduler) || "",
    cfg: (n == null ? void 0 : n.cfg) != null ? String(n.cfg) : (n == null ? void 0 : n.cfg_scale) != null ? String(n.cfg_scale) : "",
    step: (n == null ? void 0 : n.steps) != null ? String(n.steps) : "",
    genTime: ""
  }, i = e.generation_time_ms ?? ((u = e.metadata_raw) == null ? void 0 : u.generation_time_ms) ?? (n == null ? void 0 : n.generation_time_ms) ?? 0;
  return i && Number.isFinite(Number(i)) && i > 0 && i < 864e5 && (o.genTime = gt(Number(i) / 1e3)), o;
}
function Ve(t, e) {
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
    const r = document.createElement("strong");
    if (r.textContent = `${d}: `, u.appendChild(r), s === "prompt")
      u.appendChild(document.createTextNode(l));
    else if (s === "genTime") {
      const a = je(l);
      let c = "#4CAF50";
      a >= 60 ? c = "#FF9800" : a >= 30 ? c = "#FFC107" : a >= 10 && (c = "#8BC34A");
      const f = document.createElement("span");
      f.style.color = c, f.style.fontWeight = "600", f.textContent = l, u.appendChild(f);
    } else
      u.appendChild(document.createTextNode(l));
    o.appendChild(u);
  }
  return o.childNodes.length > 0 ? o : null;
}
function Ge(t) {
  var e, n, o;
  try {
    (n = (e = t._controller) == null ? void 0 : e.onModeChanged) == null || n.call(e, t._mode);
  } catch (i) {
    (o = console.debug) == null || o.call(console, i);
  }
}
function Re(t) {
  const e = [S.SIMPLE, S.AB, S.SIDE, S.GRID];
  t._mode = e[(e.indexOf(t._mode) + 1) % e.length], t._updateModeBtnUI(), t._refresh(), t._notifyModeChanged();
}
function He(t, e) {
  Object.values(S).includes(e) && (t._mode = e, t._updateModeBtnUI(), t._refresh(), t._notifyModeChanged());
}
function Oe(t) {
  return t._pinnedSlots;
}
function De(t) {
  if (t._pinBtns)
    for (const e of ["A", "B", "C", "D"]) {
      const n = t._pinBtns[e];
      if (!n) continue;
      const o = t._pinnedSlots.has(e);
      n.classList.toggle("is-pinned", o), n.setAttribute("aria-pressed", String(o)), n.title = o ? `Unpin ${e}` : `Pin ${e}`;
    }
}
function Ue(t) {
  if (!t._modeBtn) return;
  const e = {
    [S.SIMPLE]: { icon: "pi-image", label: "Mode: Simple - click to switch" },
    [S.AB]: { icon: "pi-clone", label: "Mode: A/B Compare - click to switch" },
    [S.SIDE]: { icon: "pi-table", label: "Mode: Side-by-Side - click to switch" },
    [S.GRID]: {
      icon: "pi-th-large",
      label: "Mode: Grid Compare (up to 4) - click to switch"
    }
  }, { icon: n = "pi-image", label: o = "" } = e[t._mode] || {}, i = dt(o, zt), s = document.createElement("i");
  s.className = `pi ${n}`, s.setAttribute("aria-hidden", "true"), t._modeBtn.replaceChildren(s), t._modeBtn.title = i, t._modeBtn.setAttribute("aria-label", i), t._modeBtn.removeAttribute("aria-pressed");
}
function ze(t, e) {
  if (!t._liveBtn) return;
  const n = !!e;
  t._liveBtn.classList.toggle("mjr-live-active", n);
  const o = n ? N("tooltip.liveStreamOn", "Live Stream: ON — click to disable") : N("tooltip.liveStreamOff", "Live Stream: OFF — click to follow"), i = dt(o, yt);
  t._liveBtn.setAttribute("aria-pressed", String(n)), t._liveBtn.setAttribute("aria-label", i);
  const s = document.createElement("i");
  s.className = n ? "pi pi-circle-fill" : "pi pi-circle", s.setAttribute("aria-hidden", "true"), t._liveBtn.replaceChildren(s), t._liveBtn.title = i;
}
function $e(t, e) {
  if (t._previewActive = !!e, !t._previewBtn) return;
  t._previewBtn.classList.toggle("mjr-preview-active", t._previewActive);
  const n = t._previewActive ? N("tooltip.previewStreamOn", "KSampler Preview: ON — streaming denoising steps") : N(
    "tooltip.previewStreamOff",
    "KSampler Preview: OFF — click to stream denoising steps"
  ), o = dt(n, Ct);
  t._previewBtn.setAttribute("aria-pressed", String(t._previewActive)), t._previewBtn.setAttribute("aria-label", o);
  const i = document.createElement("i");
  i.className = t._previewActive ? "pi pi-eye" : "pi pi-eye-slash", i.setAttribute("aria-hidden", "true"), t._previewBtn.replaceChildren(i), t._previewBtn.title = o, t._previewActive || t._revokePreviewBlob();
}
function We(t, e, n = {}) {
  if (!e || !(e instanceof Blob)) return;
  t._revokePreviewBlob();
  const o = URL.createObjectURL(e);
  t._previewBlobUrl = o;
  const i = {
    url: o,
    filename: "preview.jpg",
    kind: "image",
    _isPreview: !0,
    _sourceLabel: (n == null ? void 0 : n.sourceLabel) || null
  };
  if (t._mode === S.AB || t._mode === S.SIDE || t._mode === S.GRID) {
    const l = t.getPinnedSlots();
    if (t._mode === S.GRID) {
      const d = ["A", "B", "C", "D"].find((u) => !l.has(u)) || "A";
      t[`_media${d}`] = i;
    } else l.has("B") ? t._mediaA = i : t._mediaB = i;
  } else
    t._mediaA = i, t._resetMfvZoom(), t._mode !== S.SIMPLE && (t._mode = S.SIMPLE, t._updateModeBtnUI());
  ++t._refreshGen, t._refresh();
}
function Xe(t) {
  if (t._previewBlobUrl) {
    try {
      URL.revokeObjectURL(t._previewBlobUrl);
    } catch {
    }
    t._previewBlobUrl = null;
  }
}
function Ke(t, e) {
  {
    t._nodeStreamActive = !1;
    return;
  }
}
function qe() {
  var t, e, n, o, i;
  try {
    const s = typeof window < "u" ? window : globalThis, l = (e = (t = s == null ? void 0 : s.process) == null ? void 0 : t.versions) == null ? void 0 : e.electron;
    if (typeof l == "string" && l.trim() || s != null && s.electron || s != null && s.ipcRenderer || s != null && s.electronAPI)
      return !0;
    const d = String(((n = s == null ? void 0 : s.navigator) == null ? void 0 : n.userAgent) || ((o = globalThis == null ? void 0 : globalThis.navigator) == null ? void 0 : o.userAgent) || ""), u = /\bElectron\//i.test(d), r = /\bCode\//i.test(d);
    if (u && !r)
      return !0;
  } catch (s) {
    (i = console.debug) == null || i.call(console, s);
  }
  return !1;
}
function P(t, e = null, n = "info") {
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
function Ye(t, e) {
  if (!t.element) return;
  const n = !!e;
  if (t._desktopExpanded === n) return;
  const o = t.element;
  if (n) {
    t._desktopExpandRestore = {
      parent: o.parentNode || null,
      nextSibling: o.nextSibling || null,
      styleAttr: o.getAttribute("style")
    }, o.parentNode !== document.body && document.body.appendChild(o), o.classList.add("mjr-mfv--desktop-expanded", "is-visible"), o.setAttribute("aria-hidden", "false"), o.style.position = "fixed", o.style.top = "12px", o.style.left = "12px", o.style.right = "12px", o.style.bottom = "12px", o.style.width = "auto", o.style.height = "auto", o.style.maxWidth = "none", o.style.maxHeight = "none", o.style.minWidth = "320px", o.style.minHeight = "240px", o.style.resize = "none", o.style.margin = "0", o.style.zIndex = "2147483000", t._desktopExpanded = !0, t.isVisible = !0, t._resetGenDropdownForCurrentDocument(), t._rebindControlHandlers(), t._bindPanelInteractions(), t._bindDocumentUiHandlers(), t._updatePopoutBtnUI(), P("electron-in-app-expanded", { isVisible: t.isVisible });
    return;
  }
  const i = t._desktopExpandRestore;
  t._desktopExpanded = !1, o.classList.remove("mjr-mfv--desktop-expanded"), (i == null ? void 0 : i.styleAttr) == null || i.styleAttr === "" ? o.removeAttribute("style") : o.setAttribute("style", i.styleAttr), i != null && i.parent && i.parent.isConnected && (i.nextSibling && i.nextSibling.parentNode === i.parent ? i.parent.insertBefore(o, i.nextSibling) : i.parent.appendChild(o)), t._desktopExpandRestore = null, t._resetGenDropdownForCurrentDocument(), t._rebindControlHandlers(), t._bindPanelInteractions(), t._bindDocumentUiHandlers(), t._updatePopoutBtnUI(), P("electron-in-app-restored", null);
}
function Ze(t, e) {
  var n;
  t._desktopPopoutUnsupported = !0, P(
    "electron-in-app-fallback",
    { message: (e == null ? void 0 : e.message) || String(e || "unknown error") },
    "warn"
  ), t._setDesktopExpanded(!0);
  try {
    Ht(
      N(
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
function ve(t, e, n, o, i) {
  return P(
    "electron-popup-fallback-attempt",
    { reason: (i == null ? void 0 : i.message) || String(i || "unknown") },
    "warn"
  ), t._fallbackPopout(e, n, o), t._popoutWindow ? (t._desktopPopoutUnsupported = !1, P("electron-popup-fallback-opened", null), !0) : !1;
}
function we(t) {
  var d, u;
  if (t._isPopped || !t.element) return;
  const e = t.element;
  t._stopEdgeResize();
  const n = qe(), o = typeof window < "u" && "documentPictureInPicture" in window, i = String(((d = window == null ? void 0 : window.navigator) == null ? void 0 : d.userAgent) || ((u = globalThis == null ? void 0 : globalThis.navigator) == null ? void 0 : u.userAgent) || ""), s = Math.max(e.offsetWidth || 520, 400), l = Math.max(e.offsetHeight || 420, 300);
  if (P("start", {
    isElectronHost: n,
    hasDocumentPiP: o,
    userAgent: i,
    width: s,
    height: l,
    desktopPopoutUnsupported: t._desktopPopoutUnsupported
  }), n && t._desktopPopoutUnsupported) {
    P("electron-in-app-fallback-reuse", null), t._setDesktopExpanded(!0);
    return;
  }
  if (!(n && (P("electron-popup-request", { width: s, height: l }), t._tryElectronPopupFallback(e, s, l, new Error("Desktop popup requested"))))) {
    if (n && "documentPictureInPicture" in window) {
      P("electron-pip-request", { width: s, height: l }), window.documentPictureInPicture.requestWindow({ width: s, height: l }).then((r) => {
        var h, p, _;
        P("electron-pip-opened", {
          hasDocument: !!(r != null && r.document)
        }), t._popoutWindow = r, t._isPopped = !0, t._popoutRestoreGuard = !1;
        try {
          (h = t._popoutAC) == null || h.abort();
        } catch (b) {
          (p = console.debug) == null || p.call(console, b);
        }
        t._popoutAC = new AbortController();
        const a = t._popoutAC.signal, c = () => t._schedulePopInFromPopupClose();
        t._popoutCloseHandler = c;
        const f = r.document;
        f.title = "Majoor Viewer", t._installPopoutStyles(f), f.body.style.cssText = "margin:0;display:flex;min-height:100vh;background:#0d0d0d;overflow:hidden;";
        const m = f.createElement("div");
        m.id = "mjr-mfv-popout-root", m.style.cssText = "flex:1;min-width:0;min-height:0;display:flex;", f.body.appendChild(m);
        try {
          const b = typeof f.adoptNode == "function" ? f.adoptNode(e) : e;
          m.appendChild(b), P("electron-pip-adopted", {
            usedAdoptNode: typeof f.adoptNode == "function"
          });
        } catch (b) {
          P(
            "electron-pip-adopt-failed",
            { message: (b == null ? void 0 : b.message) || String(b) },
            "warn"
          ), console.warn("[MFV] PiP adoptNode failed", b), t._isPopped = !1, t._popoutWindow = null;
          try {
            r.close();
          } catch (y) {
            (_ = console.debug) == null || _.call(console, y);
          }
          t._activateDesktopExpandedFallback(b);
          return;
        }
        e.classList.add("is-visible"), t.isVisible = !0, t._resetGenDropdownForCurrentDocument(), t._rebindControlHandlers(), t._bindDocumentUiHandlers(), t._updatePopoutBtnUI(), P("electron-pip-ready", { isPopped: t._isPopped }), r.addEventListener("pagehide", c, {
          signal: a
        }), t._startPopoutCloseWatch(), t._popoutKeydownHandler = (b) => {
          var C, E;
          const y = String(((C = b == null ? void 0 : b.target) == null ? void 0 : C.tagName) || "").toLowerCase();
          b != null && b.defaultPrevented || (E = b == null ? void 0 : b.target) != null && E.isContentEditable || y === "input" || y === "textarea" || y === "select" || t._forwardKeydownToController(b);
        }, r.addEventListener("keydown", t._popoutKeydownHandler, {
          signal: a
        });
      }).catch((r) => {
        P(
          "electron-pip-request-failed",
          { message: (r == null ? void 0 : r.message) || String(r) },
          "warn"
        ), t._activateDesktopExpandedFallback(r);
      });
      return;
    }
    if (n) {
      P("electron-no-pip-api", { hasDocumentPiP: o }), t._activateDesktopExpandedFallback(
        new Error("Document Picture-in-Picture unavailable after popup failure")
      );
      return;
    }
    P("browser-fallback-popup", { width: s, height: l }), t._fallbackPopout(e, s, l);
  }
}
function Je(t, e, n, o) {
  var c, f, m, h;
  P("browser-popup-open", { width: n, height: o });
  const i = (window.screenX || window.screenLeft) + Math.round((window.outerWidth - n) / 2), s = (window.screenY || window.screenTop) + Math.round((window.outerHeight - o) / 2), l = `width=${n},height=${o},left=${i},top=${s},resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,status=no`, d = window.open("about:blank", "_mjr_viewer", l);
  if (!d) {
    P("browser-popup-blocked", null, "warn"), console.warn("[MFV] Pop-out blocked — allow popups for this site.");
    return;
  }
  P("browser-popup-opened", { hasDocument: !!(d != null && d.document) }), t._popoutWindow = d, t._isPopped = !0, t._popoutRestoreGuard = !1;
  try {
    (c = t._popoutAC) == null || c.abort();
  } catch (p) {
    (f = console.debug) == null || f.call(console, p);
  }
  t._popoutAC = new AbortController();
  const u = t._popoutAC.signal, r = () => t._schedulePopInFromPopupClose();
  t._popoutCloseHandler = r;
  const a = () => {
    let p;
    try {
      p = d.document;
    } catch {
      return;
    }
    if (!p) return;
    p.title = "Majoor Viewer", t._installPopoutStyles(p), p.body.style.cssText = "margin:0;display:flex;min-height:100vh;background:#0d0d0d;overflow:hidden;";
    const _ = p.createElement("div");
    _.id = "mjr-mfv-popout-root", _.style.cssText = "flex:1;min-width:0;min-height:0;display:flex;", p.body.appendChild(_);
    try {
      _.appendChild(p.adoptNode(e));
    } catch (b) {
      console.warn("[MFV] adoptNode failed", b);
      return;
    }
    e.classList.add("is-visible"), t.isVisible = !0, t._resetGenDropdownForCurrentDocument(), t._rebindControlHandlers(), t._bindDocumentUiHandlers(), t._updatePopoutBtnUI();
  };
  try {
    a();
  } catch (p) {
    (m = console.debug) == null || m.call(console, "[MFV] immediate mount failed, retrying on load", p);
    try {
      d.addEventListener("load", a, { signal: u });
    } catch (_) {
      (h = console.debug) == null || h.call(console, "[MFV] pop-out page load listener failed", _);
    }
  }
  d.addEventListener("beforeunload", r, { signal: u }), d.addEventListener("pagehide", r, { signal: u }), d.addEventListener("unload", r, { signal: u }), t._startPopoutCloseWatch(), t._popoutKeydownHandler = (p) => {
    var y, C, E, B;
    const _ = String(((y = p == null ? void 0 : p.target) == null ? void 0 : y.tagName) || "").toLowerCase();
    if (p != null && p.defaultPrevented || (C = p == null ? void 0 : p.target) != null && C.isContentEditable || _ === "input" || _ === "textarea" || _ === "select")
      return;
    if (String((p == null ? void 0 : p.key) || "").toLowerCase() === "v" && (p != null && p.ctrlKey || p != null && p.metaKey) && !(p != null && p.altKey) && !(p != null && p.shiftKey)) {
      p.preventDefault(), (E = p.stopPropagation) == null || E.call(p), (B = p.stopImmediatePropagation) == null || B.call(p), t._dispatchControllerAction("toggle", W.MFV_TOGGLE);
      return;
    }
    t._forwardKeydownToController(p);
  }, d.addEventListener("keydown", t._popoutKeydownHandler, { signal: u });
}
function Qe(t) {
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
function tn(t) {
  t._clearPopoutCloseWatch(), t._popoutCloseTimer = window.setInterval(() => {
    if (!t._isPopped) {
      t._clearPopoutCloseWatch();
      return;
    }
    const e = t._popoutWindow;
    (!e || e.closed) && (t._clearPopoutCloseWatch(), t._schedulePopInFromPopupClose());
  }, 250);
}
function en(t) {
  !t._isPopped || t._popoutRestoreGuard || (t._popoutRestoreGuard = !0, window.setTimeout(() => {
    try {
      t.popIn({ closePopupWindow: !1 });
    } finally {
      t._popoutRestoreGuard = !1;
    }
  }, 0));
}
function nn(t, e) {
  var o, i, s;
  if (!(e != null && e.head)) return;
  try {
    for (const l of e.head.querySelectorAll("[data-mjr-popout-cloned-style='1']"))
      l.remove();
  } catch (l) {
    (o = console.debug) == null || o.call(console, l);
  }
  try {
    const l = document.documentElement.style.cssText;
    if (l) {
      const d = e.createElement("style");
      d.setAttribute("data-mjr-popout-cloned-style", "1"), d.textContent = `:root { ${l} }`, e.head.appendChild(d);
    }
  } catch (l) {
    (i = console.debug) == null || i.call(console, l);
  }
  for (const l of document.querySelectorAll('link[rel="stylesheet"], style'))
    try {
      let d = null;
      if (l.tagName === "LINK") {
        d = e.createElement("link");
        for (const u of Array.from(l.attributes || []))
          (u == null ? void 0 : u.name) !== "href" && d.setAttribute(u.name, u.value);
        d.setAttribute("href", l.href || l.getAttribute("href") || "");
      } else
        d = e.importNode(l, !0);
      d.setAttribute("data-mjr-popout-cloned-style", "1"), e.head.appendChild(d);
    } catch (d) {
      (s = console.debug) == null || s.call(console, d);
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
function on(t, { closePopupWindow: e = !0 } = {}) {
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
function sn(t) {
  if (!t._popoutBtn) return;
  const e = t._isPopped || t._desktopExpanded;
  t.element && t.element.classList.toggle("mjr-mfv--popped", e), t._popoutBtn.classList.toggle("mjr-popin-active", e);
  const n = t._popoutBtn.querySelector("i") || document.createElement("i"), o = e ? N("tooltip.popInViewer", "Return to floating panel") : N("tooltip.popOutViewer", "Pop out viewer to separate window");
  n.className = e ? "pi pi-sign-in" : "pi pi-external-link", t._popoutBtn.title = o, t._popoutBtn.setAttribute("aria-label", o), t._popoutBtn.setAttribute("aria-pressed", String(e)), t._popoutBtn.contains(n) || t._popoutBtn.replaceChildren(n);
}
function rn(t) {
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
function an(t, e, n) {
  if (!n) return "";
  const o = t <= n.left + w, i = t >= n.right - w, s = e <= n.top + w, l = e >= n.bottom - w;
  return s && o ? "nw" : s && i ? "ne" : l && o ? "sw" : l && i ? "se" : s ? "n" : l ? "s" : o ? "w" : i ? "e" : "";
}
function ln(t) {
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
function dn(t) {
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
function cn(t, e) {
  var d;
  if (!e) return;
  const n = (u) => {
    if (!t.element || t._isPopped) return "";
    const r = t.element.getBoundingClientRect();
    return t._getResizeDirectionFromPoint(u.clientX, u.clientY, r);
  }, o = (d = t._panelAC) == null ? void 0 : d.signal, i = (u) => {
    var h;
    if (u.button !== 0 || !t.element || t._isPopped) return;
    const r = n(u);
    if (!r) return;
    u.preventDefault(), u.stopPropagation();
    const a = t.element.getBoundingClientRect(), c = window.getComputedStyle(t.element), f = Math.max(120, Number.parseFloat(c.minWidth) || 0), m = Math.max(100, Number.parseFloat(c.minHeight) || 0);
    t._resizeState = {
      pointerId: u.pointerId,
      dir: r,
      startX: u.clientX,
      startY: u.clientY,
      startLeft: a.left,
      startTop: a.top,
      startWidth: a.width,
      startHeight: a.height,
      minWidth: f,
      minHeight: m
    }, t.element.style.left = `${Math.round(a.left)}px`, t.element.style.top = `${Math.round(a.top)}px`, t.element.style.right = "auto", t.element.style.bottom = "auto", t.element.classList.add("mjr-mfv--resizing"), t.element.style.cursor = t._resizeCursorForDirection(r);
    try {
      t.element.setPointerCapture(u.pointerId);
    } catch (p) {
      (h = console.debug) == null || h.call(console, p);
    }
  }, s = (u) => {
    if (!t.element || t._isPopped) return;
    const r = t._resizeState;
    if (!r) {
      const _ = n(u);
      t.element.style.cursor = _ ? t._resizeCursorForDirection(_) : "";
      return;
    }
    if (r.pointerId !== u.pointerId) return;
    const a = u.clientX - r.startX, c = u.clientY - r.startY;
    let f = r.startWidth, m = r.startHeight, h = r.startLeft, p = r.startTop;
    r.dir.includes("e") && (f = r.startWidth + a), r.dir.includes("s") && (m = r.startHeight + c), r.dir.includes("w") && (f = r.startWidth - a, h = r.startLeft + a), r.dir.includes("n") && (m = r.startHeight - c, p = r.startTop + c), f < r.minWidth && (r.dir.includes("w") && (h -= r.minWidth - f), f = r.minWidth), m < r.minHeight && (r.dir.includes("n") && (p -= r.minHeight - m), m = r.minHeight), f = Math.min(f, Math.max(r.minWidth, window.innerWidth)), m = Math.min(m, Math.max(r.minHeight, window.innerHeight)), h = Math.min(Math.max(0, h), Math.max(0, window.innerWidth - f)), p = Math.min(Math.max(0, p), Math.max(0, window.innerHeight - m)), t.element.style.width = `${Math.round(f)}px`, t.element.style.height = `${Math.round(m)}px`, t.element.style.left = `${Math.round(h)}px`, t.element.style.top = `${Math.round(p)}px`, t.element.style.right = "auto", t.element.style.bottom = "auto";
  }, l = (u) => {
    if (!t.element || !t._resizeState || t._resizeState.pointerId !== u.pointerId) return;
    const r = n(u);
    t._stopEdgeResize(), r && (t.element.style.cursor = t._resizeCursorForDirection(r));
  };
  e.addEventListener("pointerdown", i, { capture: !0, signal: o }), e.addEventListener("pointermove", s, { signal: o }), e.addEventListener("pointerup", l, { signal: o }), e.addEventListener("pointercancel", l, { signal: o }), e.addEventListener(
    "pointerleave",
    () => {
      !t._resizeState && t.element && (t.element.style.cursor = "");
    },
    { signal: o }
  );
}
function un(t, e) {
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
      const d = o.signal, u = t.element, r = u.getBoundingClientRect(), a = s.clientX - r.left, c = s.clientY - r.top, f = (h) => {
        const p = Math.min(
          window.innerWidth - u.offsetWidth,
          Math.max(0, h.clientX - a)
        ), _ = Math.min(
          window.innerHeight - u.offsetHeight,
          Math.max(0, h.clientY - c)
        );
        u.style.left = `${p}px`, u.style.top = `${_}px`, u.style.right = "auto", u.style.bottom = "auto";
      }, m = () => {
        try {
          o == null || o.abort();
        } catch {
        }
      };
      e.addEventListener("pointermove", f, { signal: d }), e.addEventListener("pointerup", m, { signal: d });
    },
    n ? { signal: n } : void 0
  );
}
async function pn(t, e, n, o, i, s, l, d) {
  var m, h, p, _, b;
  if (!n) return;
  const u = H(n);
  let r = null;
  if (u === "video" && (r = d instanceof HTMLVideoElement ? d : ((m = t._contentEl) == null ? void 0 : m.querySelector("video")) || null), !r && u === "model3d") {
    const y = (n == null ? void 0 : n.id) != null ? String(n.id) : "";
    y && (r = ((p = (h = t._contentEl) == null ? void 0 : h.querySelector) == null ? void 0 : p.call(
      h,
      `.mjr-model3d-render-canvas[data-mjr-asset-id="${y}"]`
    )) || null), r || (r = ((b = (_ = t._contentEl) == null ? void 0 : _.querySelector) == null ? void 0 : b.call(_, ".mjr-model3d-render-canvas")) || null);
  }
  if (!r) {
    const y = Et(n);
    if (!y) return;
    r = await new Promise((C) => {
      const E = new Image();
      E.crossOrigin = "anonymous", E.onload = () => C(E), E.onerror = () => C(null), E.src = y;
    });
  }
  if (!r) return;
  const a = r.videoWidth || r.naturalWidth || s, c = r.videoHeight || r.naturalHeight || l;
  if (!a || !c) return;
  const f = Math.min(s / a, l / c);
  e.drawImage(
    r,
    o + (s - a * f) / 2,
    i + (l - c * f) / 2,
    a * f,
    c * f
  );
}
function mn(t, e, n, o) {
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
  ], l = 11, d = 16, u = 8, r = Math.max(100, Number(o || 0) - u * 2);
  let a = 0;
  for (const c of s) {
    if (!t._genInfoSelections.has(c)) continue;
    const f = i[c] != null ? String(i[c]) : "";
    if (!f) continue;
    let m = c.charAt(0).toUpperCase() + c.slice(1);
    c === "lora" ? m = "LoRA" : c === "cfg" ? m = "CFG" : c === "genTime" && (m = "Gen Time");
    const h = `${m}: `;
    e.font = `bold ${l}px system-ui, sans-serif`;
    const p = e.measureText(h).width;
    e.font = `${l}px system-ui, sans-serif`;
    const _ = Math.max(32, r - u * 2 - p);
    let b = 0, y = "";
    for (const C of f.split(" ")) {
      const E = y ? y + " " + C : C;
      e.measureText(E).width > _ && y ? (b += 1, y = C) : y = E;
    }
    y && (b += 1), a += b;
  }
  return a > 0 ? a * d + u * 2 : 0;
}
function fn(t, e, n, o, i, s, l) {
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
  }, r = [
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
  for (const B of r) {
    if (!t._genInfoSelections.has(B)) continue;
    const I = d[B] != null ? String(d[B]) : "";
    if (!I) continue;
    let M = B.charAt(0).toUpperCase() + B.slice(1);
    B === "lora" ? M = "LoRA" : B === "cfg" ? M = "CFG" : B === "genTime" && (M = "Gen Time"), a.push({
      label: `${M}: `,
      value: I,
      color: u[B] || "#ffffff"
    });
  }
  if (!a.length) return;
  const c = 11, f = 16, m = 8, h = Math.max(100, s - m * 2);
  e.save();
  const p = [];
  for (const { label: B, value: I, color: M } of a) {
    e.font = `bold ${c}px system-ui, sans-serif`;
    const V = e.measureText(B).width;
    e.font = `${c}px system-ui, sans-serif`;
    const k = h - m * 2 - V, D = [];
    let F = "";
    for (const O of I.split(" ")) {
      const G = F ? F + " " + O : O;
      e.measureText(G).width > k && F ? (D.push(F), F = O) : F = G;
    }
    F && D.push(F), p.push({ label: B, labelW: V, lines: D, color: M });
  }
  const b = p.reduce((B, I) => B + I.lines.length, 0) * f + m * 2, y = o + m, C = i + l - b - m;
  e.globalAlpha = 0.72, e.fillStyle = "#000", Bt(e, y, C, h, b, 6), e.fill(), e.globalAlpha = 1;
  let E = C + m + c;
  for (const { label: B, labelW: I, lines: M, color: V } of p)
    for (let k = 0; k < M.length; k++)
      k === 0 ? (e.font = `bold ${c}px system-ui, sans-serif`, e.fillStyle = V, e.fillText(B, y + m, E), e.font = `${c}px system-ui, sans-serif`, e.fillStyle = "rgba(255,255,255,0.88)", e.fillText(M[k], y + m + I, E)) : (e.font = `${c}px system-ui, sans-serif`, e.fillStyle = "rgba(255,255,255,0.88)", e.fillText(M[k], y + m + I, E)), E += f;
  e.restore();
}
async function hn(t) {
  var u;
  if (!t._contentEl) return;
  t._captureBtn && (t._captureBtn.disabled = !0, t._captureBtn.setAttribute("aria-label", N("tooltip.capturingView", "Capturing…")));
  const e = t._contentEl.clientWidth || 480, n = t._contentEl.clientHeight || 360;
  let o = n;
  if (t._mode === S.SIMPLE && t._mediaA && t._genInfoSelections.size) {
    const r = document.createElement("canvas");
    r.width = e, r.height = n;
    const a = r.getContext("2d"), c = t._estimateGenInfoOverlayHeight(a, t._mediaA, e);
    if (c > 0) {
      const f = Math.max(n, c + 24);
      o = Math.min(f, n * 4);
    }
  }
  const i = document.createElement("canvas");
  i.width = e, i.height = o;
  const s = i.getContext("2d");
  s.fillStyle = "#0d0d0d", s.fillRect(0, 0, e, o);
  try {
    if (t._mode === S.SIMPLE)
      t._mediaA && (await t._drawMediaFit(s, t._mediaA, 0, 0, e, n), t._drawGenInfoOverlay(s, t._mediaA, 0, 0, e, o));
    else if (t._mode === S.AB) {
      const r = Math.round(t._abDividerX * e), a = t._contentEl.querySelector(
        ".mjr-mfv-ab-layer:not(.mjr-mfv-ab-layer--b) video"
      ), c = t._contentEl.querySelector(".mjr-mfv-ab-layer--b video");
      t._mediaA && await t._drawMediaFit(s, t._mediaA, 0, 0, e, o, a), t._mediaB && (s.save(), s.beginPath(), s.rect(r, 0, e - r, o), s.clip(), await t._drawMediaFit(s, t._mediaB, 0, 0, e, o, c), s.restore()), s.save(), s.strokeStyle = "rgba(255,255,255,0.88)", s.lineWidth = 2, s.beginPath(), s.moveTo(r, 0), s.lineTo(r, o), s.stroke(), s.restore(), q(s, "A", 8, 8), q(s, "B", r + 8, 8), t._mediaA && t._drawGenInfoOverlay(s, t._mediaA, 0, 0, r, o), t._mediaB && t._drawGenInfoOverlay(s, t._mediaB, r, 0, e - r, o);
    } else if (t._mode === S.SIDE) {
      const r = Math.floor(e / 2), a = t._contentEl.querySelector(".mjr-mfv-side-panel:first-child video"), c = t._contentEl.querySelector(".mjr-mfv-side-panel:last-child video");
      t._mediaA && (await t._drawMediaFit(s, t._mediaA, 0, 0, r, o, a), t._drawGenInfoOverlay(s, t._mediaA, 0, 0, r, o)), s.fillStyle = "#111", s.fillRect(r, 0, 2, o), t._mediaB && (await t._drawMediaFit(s, t._mediaB, r, 0, r, o, c), t._drawGenInfoOverlay(s, t._mediaB, r, 0, r, o)), q(s, "A", 8, 8), q(s, "B", r + 8, 8);
    } else if (t._mode === S.GRID) {
      const r = Math.floor(e / 2), a = Math.floor(o / 2), c = 1, f = [
        { media: t._mediaA, label: "A", x: 0, y: 0, w: r - c, h: a - c },
        {
          media: t._mediaB,
          label: "B",
          x: r + c,
          y: 0,
          w: r - c,
          h: a - c
        },
        {
          media: t._mediaC,
          label: "C",
          x: 0,
          y: a + c,
          w: r - c,
          h: a - c
        },
        {
          media: t._mediaD,
          label: "D",
          x: r + c,
          y: a + c,
          w: r - c,
          h: a - c
        }
      ], m = t._contentEl.querySelectorAll(".mjr-mfv-grid-cell");
      for (let h = 0; h < f.length; h++) {
        const p = f[h], _ = ((u = m[h]) == null ? void 0 : u.querySelector("video")) || null;
        p.media && (await t._drawMediaFit(s, p.media, p.x, p.y, p.w, p.h, _), t._drawGenInfoOverlay(s, p.media, p.x, p.y, p.w, p.h)), q(s, p.label, p.x + 8, p.y + 8);
      }
      s.save(), s.fillStyle = "#111", s.fillRect(r - c, 0, c * 2, o), s.fillRect(0, a - c, e, c * 2), s.restore();
    }
  } catch (r) {
    console.debug("[MFV] capture error:", r);
  }
  const d = `${{
    [S.AB]: "mfv-ab",
    [S.SIDE]: "mfv-side",
    [S.GRID]: "mfv-grid"
  }[t._mode] ?? "mfv"}-${Date.now()}.png`;
  try {
    const r = i.toDataURL("image/png"), a = document.createElement("a");
    a.href = r, a.download = d, document.body.appendChild(a), a.click(), setTimeout(() => document.body.removeChild(a), 100);
  } catch (r) {
    console.warn("[MFV] download failed:", r);
  } finally {
    t._captureBtn && (t._captureBtn.disabled = !1, t._captureBtn.setAttribute("aria-label", N("tooltip.captureView", "Save view as image")));
  }
}
function _n(t, e, { autoMode: n = !1 } = {}) {
  if (t._mediaA = e || null, t._resetMfvZoom(), n && t._mode !== S.SIMPLE && (t._mode = S.SIMPLE, t._updateModeBtnUI()), t._mediaA && typeof Q == "function") {
    const o = ++t._refreshGen;
    (async () => {
      var i;
      try {
        const s = await Q(t._mediaA, {
          getAssetMetadata: ut,
          getFileMetadataScoped: ct
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
function gn(t, e, n) {
  t._mediaA = e || null, t._mediaB = n || null, t._resetMfvZoom(), t._mode === S.SIMPLE && (t._mode = S.AB, t._updateModeBtnUI());
  const o = ++t._refreshGen, i = async (s) => {
    if (!s) return s;
    try {
      return await Q(s, {
        getAssetMetadata: ut,
        getFileMetadataScoped: ct
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
function bn(t, e, n, o, i) {
  t._mediaA = e || null, t._mediaB = n || null, t._mediaC = o || null, t._mediaD = i || null, t._resetMfvZoom(), t._mode !== S.GRID && (t._mode = S.GRID, t._updateModeBtnUI());
  const s = ++t._refreshGen, l = async (d) => {
    if (!d) return d;
    try {
      return await Q(d, {
        getAssetMetadata: ut,
        getFileMetadataScoped: ct
      }) || d;
    } catch {
      return d;
    }
  };
  (async () => {
    const [d, u, r, a] = await Promise.all([
      l(t._mediaA),
      l(t._mediaB),
      l(t._mediaC),
      l(t._mediaD)
    ]);
    t._refreshGen === s && (t._mediaA = d || null, t._mediaB = u || null, t._mediaC = r || null, t._mediaD = a || null, t._refresh());
  })();
}
function $(t) {
  var e, n;
  try {
    return !!((e = t == null ? void 0 : t.classList) != null && e.contains("mjr-mfv-simple-player"));
  } catch (o) {
    return (n = console.debug) == null || n.call(console, o), !1;
  }
}
let yn = 0;
class An {
  constructor({ controller: e = null } = {}) {
    this._instanceId = ++yn, this._controller = e && typeof e == "object" ? { ...e } : null, this.element = null, this.isVisible = !1, this._contentEl = null, this._closeBtn = null, this._modeBtn = null, this._pinGroup = null, this._pinBtns = null, this._liveBtn = null, this._genBtn = null, this._genDropdown = null, this._captureBtn = null, this._genInfoSelections = /* @__PURE__ */ new Set(["genTime"]), this._mode = S.SIMPLE, this._mediaA = null, this._mediaB = null, this._mediaC = null, this._mediaD = null, this._pinnedSlots = /* @__PURE__ */ new Set(), this._abDividerX = 0.5, this._zoom = 1, this._panX = 0, this._panY = 0, this._panzoomAC = null, this._dragging = !1, this._compareSyncAC = null, this._btnAC = null, this._refreshGen = 0, this._popoutWindow = null, this._popoutBtn = null, this._isPopped = !1, this._desktopExpanded = !1, this._desktopExpandRestore = null, this._desktopPopoutUnsupported = !1, this._popoutCloseHandler = null, this._popoutKeydownHandler = null, this._popoutCloseTimer = null, this._popoutRestoreGuard = !1, this._previewBtn = null, this._previewBlobUrl = null, this._previewActive = !1, this._nodeStreamBtn = null, this._nodeStreamActive = !1, this._docAC = new AbortController(), this._popoutAC = null, this._panelAC = new AbortController(), this._resizeState = null, this._titleId = `mjr-mfv-title-${this._instanceId}`, this._genDropdownId = `mjr-mfv-gen-dropdown-${this._instanceId}`, this._progressEl = null, this._progressNodesEl = null, this._progressStepsEl = null, this._progressTextEl = null, this._mediaProgressEl = null, this._mediaProgressTextEl = null, this._progressUpdateHandler = null, this._progressCurrentNodeId = null, this._docClickHost = null, this._handleDocClick = null;
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
    return ye(this);
  }
  _buildHeader() {
    return Ce(this);
  }
  _buildToolbar() {
    return Se(this);
  }
  _rebindControlHandlers() {
    return Ae(this);
  }
  _updateSettingsBtnState(e) {
    return Ee(this, e);
  }
  _applySidebarPosition() {
    return Be(this);
  }
  refreshSidebar() {
    var e;
    (e = this._sidebar) == null || e.refresh();
  }
  _resetGenDropdownForCurrentDocument() {
    return Me(this);
  }
  _bindDocumentUiHandlers() {
    return Pe(this);
  }
  _unbindDocumentUiHandlers() {
    return Ne(this);
  }
  _isGenDropdownOpen() {
    return Ie(this);
  }
  _openGenDropdown() {
    return Le(this);
  }
  _closeGenDropdown() {
    return Fe(this);
  }
  _updateGenBtnUI() {
    return xe(this);
  }
  _buildGenDropdown() {
    return ke(this);
  }
  _getGenFields(e) {
    return Te(this, e);
  }
  _buildGenInfoDOM(e) {
    return Ve(this, e);
  }
  _notifyModeChanged() {
    return Ge(this);
  }
  _cycleMode() {
    return Re(this);
  }
  setMode(e) {
    return He(this, e);
  }
  getPinnedSlots() {
    return Oe(this);
  }
  _updatePinUI() {
    return De(this);
  }
  _updateModeBtnUI() {
    return Ue(this);
  }
  setLiveActive(e) {
    return ze(this, e);
  }
  setPreviewActive(e) {
    return $e(this, e);
  }
  loadPreviewBlob(e, n = {}) {
    return We(this, e, n);
  }
  _revokePreviewBlob() {
    return Xe(this);
  }
  setNodeStreamActive(e) {
    return Ke(this);
  }
  loadMediaA(e, { autoMode: n = !1 } = {}) {
    return _n(this, e, { autoMode: n });
  }
  /**
   * Load two assets for compare modes.
   * Auto-switches from SIMPLE → AB on first call.
   */
  loadMediaPair(e, n) {
    return gn(this, e, n);
  }
  /**
   * Load up to 4 assets for grid compare mode.
   * Auto-switches to GRID mode if not already.
   */
  loadMediaQuad(e, n, o, i) {
    return bn(this, e, n, o, i);
  }
  /** Apply current zoom+pan state to all media elements (img/video only — divider/overlays unaffected). */
  _applyTransform() {
    if (!this._contentEl) return;
    const e = Math.max(it, Math.min(rt, this._zoom)), n = this._contentEl.clientWidth || 0, o = this._contentEl.clientHeight || 0, i = Math.max(0, (e - 1) * n / 2), s = Math.max(0, (e - 1) * o / 2);
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
    const i = Math.max(it, Math.min(rt, this._zoom)), s = Math.max(it, Math.min(rt, Number(e) || 1));
    if (n != null && o != null && this._contentEl) {
      const l = s / i, d = this._contentEl.getBoundingClientRect(), u = n - (d.left + d.width / 2), r = o - (d.top + d.height / 2);
      this._panX = this._panX * l + (1 - l) * u, this._panY = this._panY * l + (1 - l) * r;
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
      (r) => {
        var m, h, p, _;
        if ((h = (m = r.target) == null ? void 0 : m.closest) != null && h.call(m, "audio") || (_ = (p = r.target) == null ? void 0 : p.closest) != null && _.call(p, ".mjr-mfv-simple-player-controls") || st(r.target)) return;
        const a = te(r.target, e);
        if (a && ee(
          a,
          Number(r.deltaX || 0),
          Number(r.deltaY || 0)
        ))
          return;
        r.preventDefault();
        const f = 1 - (r.deltaY || r.deltaX || 0) * Ut;
        this._setMfvZoom(this._zoom * f, r.clientX, r.clientY);
      },
      { ...n, passive: !1 }
    );
    let o = !1, i = 0, s = 0, l = 0, d = 0;
    e.addEventListener(
      "pointerdown",
      (r) => {
        var a, c, f, m, h, p, _, b, y;
        if (!(r.button !== 0 && r.button !== 1) && !(this._zoom <= 1.01) && !((c = (a = r.target) == null ? void 0 : a.closest) != null && c.call(a, "video")) && !((m = (f = r.target) == null ? void 0 : f.closest) != null && m.call(f, "audio")) && !((p = (h = r.target) == null ? void 0 : h.closest) != null && p.call(h, ".mjr-mfv-simple-player-controls")) && !((b = (_ = r.target) == null ? void 0 : _.closest) != null && b.call(_, ".mjr-mfv-ab-divider")) && !st(r.target)) {
          r.preventDefault(), o = !0, this._dragging = !0, i = r.clientX, s = r.clientY, l = this._panX, d = this._panY;
          try {
            e.setPointerCapture(r.pointerId);
          } catch (C) {
            (y = console.debug) == null || y.call(console, C);
          }
          this._applyTransform();
        }
      },
      n
    ), e.addEventListener(
      "pointermove",
      (r) => {
        o && (this._panX = l + (r.clientX - i), this._panY = d + (r.clientY - s), this._applyTransform());
      },
      n
    );
    const u = (r) => {
      var a;
      if (o) {
        o = !1, this._dragging = !1;
        try {
          e.releasePointerCapture(r.pointerId);
        } catch (c) {
          (a = console.debug) == null || a.call(console, c);
        }
        this._applyTransform();
      }
    };
    e.addEventListener("pointerup", u, n), e.addEventListener("pointercancel", u, n), e.addEventListener(
      "dblclick",
      (r) => {
        var c, f, m, h, p, _;
        if ((f = (c = r.target) == null ? void 0 : c.closest) != null && f.call(c, "video") || (h = (m = r.target) == null ? void 0 : m.closest) != null && h.call(m, "audio") || (_ = (p = r.target) == null ? void 0 : p.closest) != null && _.call(p, ".mjr-mfv-simple-player-controls") || st(r.target)) return;
        const a = Math.abs(this._zoom - 1) < 0.05;
        this._setMfvZoom(a ? Math.min(4, this._zoom * 4) : 1, r.clientX, r.clientY);
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
    if (this._destroyCompareSync(), !!this._contentEl && this._mode !== S.SIMPLE)
      try {
        const n = Array.from(this._contentEl.querySelectorAll("video, audio"));
        if (n.length < 2) return;
        const o = n[0] || null, i = n.slice(1);
        if (!o || !i.length) return;
        this._compareSyncAC = Ot(o, i, { threshold: 0.08 });
      } catch (n) {
        (e = console.debug) == null || e.call(console, n);
      }
  }
  // ── Render ────────────────────────────────────────────────────────────────
  _refresh() {
    if (this._contentEl) {
      switch (this._destroyPanZoom(), this._destroyCompareSync(), this._contentEl.replaceChildren(), this._contentEl.style.overflow = "hidden", this._mode) {
        case S.SIMPLE:
          this._renderSimple();
          break;
        case S.AB:
          this._renderAB();
          break;
        case S.SIDE:
          this._renderSide();
          break;
        case S.GRID:
          this._renderGrid();
          break;
      }
      this._mediaProgressEl && this._contentEl.appendChild(this._mediaProgressEl), this._applyTransform(), this._initPanZoom(this._contentEl), this._initCompareSync();
    }
  }
  _renderSimple() {
    if (!this._mediaA) {
      this._contentEl.appendChild(R());
      return;
    }
    const e = H(this._mediaA), n = z(this._mediaA);
    if (!n) {
      this._contentEl.appendChild(R("Could not load media"));
      return;
    }
    const o = document.createElement("div");
    if (o.className = "mjr-mfv-simple-container", o.appendChild(n), e !== "audio") {
      const i = this._buildGenInfoDOM(this._mediaA);
      if (i) {
        const s = document.createElement("div");
        s.className = "mjr-mfv-geninfo", $(n) && s.classList.add("mjr-mfv-geninfo--above-player"), s.appendChild(i), o.appendChild(s);
      }
    }
    this._contentEl.appendChild(o);
  }
  _renderAB() {
    var p;
    const e = this._mediaA ? z(this._mediaA, { fill: !0 }) : null, n = this._mediaB ? z(this._mediaB, { fill: !0 }) : null, o = this._mediaA ? H(this._mediaA) : "", i = this._mediaB ? H(this._mediaB) : "";
    if (!e && !n) {
      this._contentEl.appendChild(R("Select 2 assets for A/B compare"));
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
    const r = document.createElement("div");
    r.className = "mjr-mfv-ab-divider", r.style.left = `${u}%`;
    const a = this._buildGenInfoDOM(this._mediaA);
    let c = null;
    a && (c = document.createElement("div"), c.className = "mjr-mfv-geninfo-a", $(e) && c.classList.add("mjr-mfv-geninfo--above-player"), c.appendChild(a), c.style.right = `calc(${100 - u}% + 8px)`);
    const f = this._buildGenInfoDOM(this._mediaB);
    let m = null;
    f && (m = document.createElement("div"), m.className = "mjr-mfv-geninfo-b", $(n) && m.classList.add("mjr-mfv-geninfo--above-player"), m.appendChild(f), m.style.left = `calc(${u}% + 8px)`);
    let h = null;
    r.addEventListener(
      "pointerdown",
      (_) => {
        _.preventDefault(), r.setPointerCapture(_.pointerId);
        try {
          h == null || h.abort();
        } catch {
        }
        h = new AbortController();
        const b = h.signal, y = s.getBoundingClientRect(), C = (B) => {
          const I = Math.max(0.02, Math.min(0.98, (B.clientX - y.left) / y.width));
          this._abDividerX = I;
          const M = Math.round(I * 100);
          d.style.clipPath = `inset(0 0 0 ${M}%)`, r.style.left = `${M}%`, c && (c.style.right = `calc(${100 - M}% + 8px)`), m && (m.style.left = `calc(${M}% + 8px)`);
        }, E = () => {
          try {
            h == null || h.abort();
          } catch {
          }
        };
        r.addEventListener("pointermove", C, { signal: b }), r.addEventListener("pointerup", E, { signal: b });
      },
      (p = this._panelAC) != null && p.signal ? { signal: this._panelAC.signal } : void 0
    ), s.appendChild(l), s.appendChild(d), s.appendChild(r), c && s.appendChild(c), m && s.appendChild(m), s.appendChild(U("A", "left")), s.appendChild(U("B", "right")), this._contentEl.appendChild(s);
  }
  _renderSide() {
    const e = this._mediaA ? z(this._mediaA) : null, n = this._mediaB ? z(this._mediaB) : null, o = this._mediaA ? H(this._mediaA) : "", i = this._mediaB ? H(this._mediaB) : "";
    if (!e && !n) {
      this._contentEl.appendChild(R("Select 2 assets for Side-by-Side"));
      return;
    }
    const s = document.createElement("div");
    s.className = "mjr-mfv-side-container";
    const l = document.createElement("div");
    l.className = "mjr-mfv-side-panel", e ? l.appendChild(e) : l.appendChild(R("—")), l.appendChild(U("A", "left"));
    const d = o === "audio" ? null : this._buildGenInfoDOM(this._mediaA);
    if (d) {
      const a = document.createElement("div");
      a.className = "mjr-mfv-geninfo-a", $(e) && a.classList.add("mjr-mfv-geninfo--above-player"), a.appendChild(d), l.appendChild(a);
    }
    const u = document.createElement("div");
    u.className = "mjr-mfv-side-panel", n ? u.appendChild(n) : u.appendChild(R("—")), u.appendChild(U("B", "right"));
    const r = i === "audio" ? null : this._buildGenInfoDOM(this._mediaB);
    if (r) {
      const a = document.createElement("div");
      a.className = "mjr-mfv-geninfo-b", $(n) && a.classList.add("mjr-mfv-geninfo--above-player"), a.appendChild(r), u.appendChild(a);
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
      this._contentEl.appendChild(R("Select up to 4 assets for Grid Compare"));
      return;
    }
    const o = document.createElement("div");
    o.className = "mjr-mfv-grid-container";
    for (const { media: i, label: s } of e) {
      const l = document.createElement("div");
      if (l.className = "mjr-mfv-grid-cell", i) {
        const d = H(i), u = z(i);
        if (u ? l.appendChild(u) : l.appendChild(R("—")), l.appendChild(
          U(s, s === "A" || s === "C" ? "left" : "right")
        ), d !== "audio") {
          const r = this._buildGenInfoDOM(i);
          if (r) {
            const a = document.createElement("div");
            a.className = `mjr-mfv-geninfo-${s.toLowerCase()}`, $(u) && a.classList.add("mjr-mfv-geninfo--above-player"), a.appendChild(r), l.appendChild(a);
          }
        }
      } else
        l.appendChild(R("—")), l.appendChild(
          U(s, s === "A" || s === "C" ? "left" : "right")
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
    this.element && (this._destroyPanZoom(), this._destroyCompareSync(), this._stopEdgeResize(), this._closeGenDropdown(), ne(this.element), this.element.classList.remove("is-visible"), this.element.setAttribute("aria-hidden", "true"), this.isVisible = !1);
  }
  // ── Pop-out / Pop-in (separate OS window for second monitor) ────────────
  _setDesktopExpanded(e) {
    return Ye(this, e);
  }
  _activateDesktopExpandedFallback(e) {
    return Ze(this, e);
  }
  _tryElectronPopupFallback(e, n, o, i) {
    return ve(this, e, n, o, i);
  }
  popOut() {
    return we(this);
  }
  _fallbackPopout(e, n, o) {
    return Je(this, e, n, o);
  }
  _clearPopoutCloseWatch() {
    return Qe(this);
  }
  _startPopoutCloseWatch() {
    return tn(this);
  }
  _schedulePopInFromPopupClose() {
    return en(this);
  }
  _installPopoutStyles(e) {
    return nn(this, e);
  }
  popIn(e) {
    return on(this, e);
  }
  _updatePopoutBtnUI() {
    return sn(this);
  }
  get isPopped() {
    return this._isPopped || this._desktopExpanded;
  }
  _resizeCursorForDirection(e) {
    return rn(e);
  }
  _getResizeDirectionFromPoint(e, n, o) {
    return an(e, n, o);
  }
  _stopEdgeResize() {
    return ln(this);
  }
  _bindPanelInteractions() {
    return dn(this);
  }
  _initEdgeResize(e) {
    return cn(this, e);
  }
  _initDrag(e) {
    return un(this, e);
  }
  async _drawMediaFit(e, n, o, i, s, l, d) {
    return pn(this, e, n, o, i, s, l, d);
  }
  _estimateGenInfoOverlayHeight(e, n, o) {
    return mn(this, e, n, o);
  }
  _drawGenInfoOverlay(e, n, o, i, s, l) {
    return fn(this, e, n, o, i, s, l);
  }
  async _captureView() {
    return hn(this);
  }
  dispose() {
    var e, n, o, i, s, l, d, u, r, a, c, f, m, h, p, _, b, y;
    Dt(this), this._destroyPanZoom(), this._destroyCompareSync(), this._stopEdgeResize(), this._clearPopoutCloseWatch();
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
      (r = this._panzoomAC) == null || r.abort(), this._panzoomAC = null;
    } catch (C) {
      (a = console.debug) == null || a.call(console, C);
    }
    try {
      (f = (c = this._compareSyncAC) == null ? void 0 : c.abort) == null || f.call(c), this._compareSyncAC = null;
    } catch (C) {
      (m = console.debug) == null || m.call(console, C);
    }
    try {
      this._isPopped && this.popIn();
    } catch (C) {
      (h = console.debug) == null || h.call(console, C);
    }
    this._revokePreviewBlob(), this._onSidebarPosChanged && (window.removeEventListener("mjr-settings-changed", this._onSidebarPosChanged), this._onSidebarPosChanged = null);
    try {
      (p = this.element) == null || p.remove();
    } catch (C) {
      (_ = console.debug) == null || _.call(console, C);
    }
    this.element = null, this._contentEl = null, this._closeBtn = null, this._modeBtn = null, this._pinGroup = null, this._pinBtns = null, this._liveBtn = null, this._nodeStreamBtn = null, this._popoutBtn = null, this._captureBtn = null, this._unbindDocumentUiHandlers();
    try {
      (b = this._genDropdown) == null || b.remove();
    } catch (C) {
      (y = console.debug) == null || y.call(console, C);
    }
    this._mediaA = null, this._mediaB = null, this._mediaC = null, this._mediaD = null, this.isVisible = !1;
  }
}
export {
  An as FloatingViewer,
  S as MFV_MODES
};
