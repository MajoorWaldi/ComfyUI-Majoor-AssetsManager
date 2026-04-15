import { p as Dt, M as Ut, c as zt, q as $t, t as Wt, A as q, u as w, v as I, x as Z, y as vt, z as Nt, B as Kt, C as Xt, D as Q, E as W, n as qt, s as st, F as dt, G as wt, H as ut, I as pt, d as it, J as Yt, K as Zt } from "./entry-XRgv6-CB.js";
import { ensureViewerMetadataAsset as tt } from "./genInfo-E9sgq1_x.js";
const A = Object.freeze({
  SIMPLE: "simple",
  AB: "ab",
  SIDE: "side",
  GRID: "grid"
}), rt = 0.25, at = 8, Jt = 8e-4, J = 8, Qt = "C", Ft = "L", It = "K", te = "N", ee = "Esc", et = 30;
function lt(t) {
  const e = Number(t);
  if (!Number.isFinite(e) || e < 0) return "0:00";
  const n = Math.floor(e), o = Math.floor(n / 3600), i = Math.floor(n % 3600 / 60), s = n % 60;
  return o > 0 ? `${o}:${String(i).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${i}:${String(s).padStart(2, "0")}`;
}
function ht(t) {
  var e, n;
  try {
    const o = (e = t == null ? void 0 : t.play) == null ? void 0 : e.call(t);
    o && typeof o.catch == "function" && o.catch(() => {
    });
  } catch (o) {
    (n = console.debug) == null || n.call(console, o);
  }
}
function ne(t, e) {
  const n = Math.floor(Number(t) || 0), o = Math.max(0, Math.floor(Number(e) || 0));
  return n < 0 ? 0 : o > 0 && n > o ? o : n;
}
function _t(t, e) {
  const n = Number((t == null ? void 0 : t.currentTime) || 0), o = Number(e) > 0 ? Number(e) : et;
  return Math.max(0, Math.floor(n * o));
}
function Lt(t, e) {
  const n = Number((t == null ? void 0 : t.duration) || 0), o = Number(e) > 0 ? Number(e) : et;
  return !Number.isFinite(n) || n <= 0 ? 0 : Math.max(0, Math.floor(n * o));
}
function oe(t, e, n) {
  var c;
  const o = Number(n) > 0 ? Number(n) : et, i = Lt(t, o), l = ne(e, i) / o;
  try {
    t.currentTime = Math.max(0, l);
  } catch (d) {
    (c = console.debug) == null || c.call(console, d);
  }
}
function se(t) {
  return t instanceof HTMLMediaElement;
}
function ie(t, e) {
  return String(t || "").toLowerCase() === "video" ? !0 : e instanceof HTMLVideoElement;
}
function re(t, e) {
  return String(t || "").toLowerCase() === "audio" ? !0 : e instanceof HTMLAudioElement;
}
function ae(t) {
  const e = String(t || "").toLowerCase();
  return e === "gif" || e === "animated-image";
}
function le(t) {
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
function ct(t, e = null, { kind: n = "" } = {}) {
  var ft;
  if (!t || t._mjrSimplePlayerMounted) return (t == null ? void 0 : t.parentElement) || null;
  t._mjrSimplePlayerMounted = !0;
  const o = Dt(e) || et, i = se(t), s = ie(n, t), l = re(n, t), c = ae(n), d = document.createElement("div");
  d.className = "mjr-mfv-simple-player", d.tabIndex = 0, d.setAttribute("role", "group"), d.setAttribute("aria-label", "Media player"), l && d.classList.add("is-audio"), c && d.classList.add("is-animated-image");
  const r = document.createElement("div");
  r.className = "mjr-mfv-simple-player-controls";
  const a = document.createElement("input");
  a.type = "range", a.className = "mjr-mfv-simple-player-seek", a.min = "0", a.max = "1000", a.step = "1", a.value = "0", a.setAttribute("aria-label", "Seek"), i || (a.disabled = !0, a.classList.add("is-disabled"));
  const u = document.createElement("div");
  u.className = "mjr-mfv-simple-player-row";
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
  const y = document.createElement("i");
  y.className = "pi pi-step-forward", y.setAttribute("aria-hidden", "true"), _.appendChild(y);
  const S = document.createElement("div");
  S.className = "mjr-mfv-simple-player-time", S.textContent = "0:00 / 0:00";
  const g = document.createElement("div");
  g.className = "mjr-mfv-simple-player-frame", g.textContent = "F: 0", s || (g.style.display = "none");
  const C = document.createElement("button");
  C.type = "button", C.className = "mjr-icon-btn mjr-mfv-simple-player-btn", C.setAttribute("aria-label", "Mute/Unmute");
  const E = document.createElement("i");
  if (E.className = "pi pi-volume-up", E.setAttribute("aria-hidden", "true"), C.appendChild(E), s || (h.disabled = !0, _.disabled = !0, h.classList.add("is-disabled"), _.classList.add("is-disabled")), u.appendChild(h), u.appendChild(f), u.appendChild(_), u.appendChild(S), u.appendChild(g), u.appendChild(C), r.appendChild(a), r.appendChild(u), d.appendChild(t), l) {
    const b = document.createElement("div");
    b.className = "mjr-mfv-simple-player-audio-backdrop", b.textContent = String((e == null ? void 0 : e.filename) || "Audio"), d.appendChild(b);
  }
  d.appendChild(r);
  try {
    t instanceof HTMLMediaElement && (t.controls = !1, t.playsInline = !0, t.loop = !0, t.muted = !0, t.autoplay = !0);
  } catch (b) {
    (ft = console.debug) == null || ft.call(console, b);
  }
  const P = c ? String((t == null ? void 0 : t.src) || "") : "";
  let M = !1, T = "";
  const k = () => {
    if (i) {
      m.className = t.paused ? "pi pi-play" : "pi pi-pause";
      return;
    }
    if (c) {
      m.className = M ? "pi pi-play" : "pi pi-pause";
      return;
    }
    m.className = "pi pi-play";
  }, R = () => {
    if (t instanceof HTMLMediaElement) {
      E.className = t.muted ? "pi pi-volume-off" : "pi pi-volume-up";
      return;
    }
    E.className = "pi pi-volume-off", C.disabled = !0, C.classList.add("is-disabled");
  }, L = () => {
    if (!s || !(t instanceof HTMLVideoElement)) return;
    const b = _t(t, o), B = Lt(t, o);
    g.textContent = B > 0 ? `F: ${b}/${B}` : `F: ${b}`;
  }, D = () => {
    const b = Math.max(0, Math.min(100, Number(a.value) / 1e3 * 100));
    a.style.setProperty("--mjr-seek-pct", `${b}%`);
  }, G = () => {
    if (!i) {
      S.textContent = c ? "Animated" : "Preview", a.value = "0", D();
      return;
    }
    const b = Number(t.currentTime || 0), B = Number(t.duration || 0);
    if (Number.isFinite(B) && B > 0) {
      const x = Math.max(0, Math.min(1, b / B));
      a.value = String(Math.round(x * 1e3)), S.textContent = `${lt(b)} / ${lt(B)}`;
    } else
      a.value = "0", S.textContent = `${lt(b)} / 0:00`;
    D();
  }, K = (b) => {
    var B;
    try {
      (B = b == null ? void 0 : b.stopPropagation) == null || B.call(b);
    } catch {
    }
  }, mt = (b) => {
    var B, x;
    K(b);
    try {
      if (i)
        t.paused ? ht(t) : (B = t.pause) == null || B.call(t);
      else if (c)
        if (!M)
          T || (T = le(t)), T && (t.src = T), M = !0;
        else {
          const j = P ? `${P}${P.includes("?") ? "&" : "?"}mjr_anim=${Date.now()}` : t.src;
          t.src = j, M = !1;
        }
    } catch (j) {
      (x = console.debug) == null || x.call(console, j);
    }
    k();
  }, Y = (b, B) => {
    var j, V;
    if (K(B), !s || !(t instanceof HTMLVideoElement)) return;
    try {
      (j = t.pause) == null || j.call(t);
    } catch (ot) {
      (V = console.debug) == null || V.call(console, ot);
    }
    const x = _t(t, o);
    oe(t, x + b, o), k(), L(), G();
  }, Gt = (b) => {
    var B;
    if (K(b), t instanceof HTMLMediaElement) {
      try {
        t.muted = !t.muted;
      } catch (x) {
        (B = console.debug) == null || B.call(console, x);
      }
      R();
    }
  }, Ot = (b) => {
    var j;
    if (K(b), !i) return;
    D();
    const B = Number(t.duration || 0);
    if (!Number.isFinite(B) || B <= 0) return;
    const x = Math.max(0, Math.min(1, Number(a.value) / 1e3));
    try {
      t.currentTime = B * x;
    } catch (V) {
      (j = console.debug) == null || j.call(console, V);
    }
    L(), G();
  }, nt = (b) => K(b), Rt = (b) => {
    var B, x, j, V;
    try {
      if ((x = (B = b == null ? void 0 : b.target) == null ? void 0 : B.closest) != null && x.call(B, "button, input, textarea, select")) return;
      (j = d.focus) == null || j.call(d, { preventScroll: !0 });
    } catch (ot) {
      (V = console.debug) == null || V.call(console, ot);
    }
  }, Ht = (b) => {
    var x, j, V;
    const B = String((b == null ? void 0 : b.key) || "");
    if (!(!B || b != null && b.altKey || b != null && b.ctrlKey || b != null && b.metaKey)) {
      if (B === " " || B === "Spacebar") {
        (x = b.preventDefault) == null || x.call(b), mt(b);
        return;
      }
      if (B === "ArrowLeft") {
        if (!s) return;
        (j = b.preventDefault) == null || j.call(b), Y(-1, b);
        return;
      }
      if (B === "ArrowRight") {
        if (!s) return;
        (V = b.preventDefault) == null || V.call(b), Y(1, b);
      }
    }
  };
  return f.addEventListener("click", mt), h.addEventListener("click", (b) => Y(-1, b)), _.addEventListener("click", (b) => Y(1, b)), C.addEventListener("click", Gt), a.addEventListener("input", Ot), r.addEventListener("pointerdown", nt), r.addEventListener("click", nt), r.addEventListener("dblclick", nt), d.addEventListener("pointerdown", Rt), d.addEventListener("keydown", Ht), t instanceof HTMLMediaElement && (t.addEventListener("play", k, { passive: !0 }), t.addEventListener("pause", k, { passive: !0 }), t.addEventListener(
    "timeupdate",
    () => {
      L(), G();
    },
    { passive: !0 }
  ), t.addEventListener(
    "seeked",
    () => {
      L(), G();
    },
    { passive: !0 }
  ), t.addEventListener(
    "loadedmetadata",
    () => {
      L(), G();
    },
    { passive: !0 }
  )), ht(t), k(), R(), L(), G(), d;
}
const ce = /* @__PURE__ */ new Set([".mp4", ".webm", ".mov", ".avi", ".mkv"]), de = /* @__PURE__ */ new Set([".mp3", ".wav", ".flac", ".ogg", ".m4a", ".aac", ".opus", ".wma"]);
function kt(t) {
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
  const n = kt((t == null ? void 0 : t.filename) || "");
  return n === ".gif" ? "gif" : ce.has(n) ? "video" : de.has(n) ? "audio" : Ut.has(n) ? "model3d" : "image";
}
function xt(t) {
  return t ? t.url ? String(t.url) : t.filename && t.id == null ? $t(t.filename, t.subfolder || "", t.type || "output") : t.filename && Wt(t) || "" : "";
}
function O(t = "No media — select assets in the grid") {
  const e = document.createElement("div");
  return e.className = "mjr-mfv-empty", e.textContent = t, e;
}
function U(t, e) {
  const n = document.createElement("div");
  return n.className = `mjr-mfv-label label-${e}`, n.textContent = t, n;
}
function gt(t) {
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
function ue(t, e) {
  var o, i;
  let n = t && t.nodeType === 1 ? t : (t == null ? void 0 : t.parentElement) || null;
  for (; n && n !== e; ) {
    try {
      const s = (o = window.getComputedStyle) == null ? void 0 : o.call(window, n), l = /(auto|scroll|overlay)/.test(String((s == null ? void 0 : s.overflowY) || "")), c = /(auto|scroll|overlay)/.test(String((s == null ? void 0 : s.overflowX) || ""));
      if (l || c)
        return n;
    } catch (s) {
      (i = console.debug) == null || i.call(console, s);
    }
    n = n.parentElement || null;
  }
  return null;
}
function pe(t, e, n) {
  if (!t) return !1;
  if (Math.abs(Number(n) || 0) >= Math.abs(Number(e) || 0)) {
    const s = Number(t.scrollTop || 0), l = Math.max(0, Number(t.scrollHeight || 0) - Number(t.clientHeight || 0));
    if (n < 0 && s > 0 || n > 0 && s < l) return !0;
  }
  const o = Number(t.scrollLeft || 0), i = Math.max(0, Number(t.scrollWidth || 0) - Number(t.clientWidth || 0));
  return e < 0 && o > 0 || e > 0 && o < i;
}
function me(t) {
  var e, n, o, i;
  if (t)
    try {
      const s = (e = t.querySelectorAll) == null ? void 0 : e.call(t, "video, audio");
      if (!s || !s.length) return;
      for (const l of s)
        try {
          (n = l.pause) == null || n.call(l);
        } catch (c) {
          (o = console.debug) == null || o.call(console, c);
        }
    } catch (s) {
      (i = console.debug) == null || i.call(console, s);
    }
}
function z(t, { fill: e = !1 } = {}) {
  var d, r;
  const n = xt(t);
  if (!n) return null;
  const o = H(t), i = `mjr-mfv-media mjr-mfv-media--fit-height${e ? " mjr-mfv-media--fill" : ""}`, l = kt((t == null ? void 0 : t.filename) || "") === ".webp" && Number((t == null ? void 0 : t.duration) ?? ((d = t == null ? void 0 : t.metadata_raw) == null ? void 0 : d.duration) ?? 0) > 0;
  if (o === "audio") {
    const a = document.createElement("audio");
    a.className = i, a.src = n, a.controls = !1, a.autoplay = !0, a.preload = "metadata", a.loop = !0, a.muted = !0;
    try {
      a.addEventListener("loadedmetadata", () => gt(a), { once: !0 });
    } catch (f) {
      (r = console.debug) == null || r.call(console, f);
    }
    return gt(a), ct(a, t, { kind: "audio" }) || a;
  }
  if (o === "video") {
    const a = document.createElement("video");
    return a.className = i, a.src = n, a.controls = !1, a.loop = !0, a.muted = !0, a.autoplay = !0, a.playsInline = !0, ct(a, t, { kind: "video" }) || a;
  }
  if (o === "model3d")
    return zt(t, n, {
      hostClassName: `mjr-model3d-host mjr-mfv-model3d-host${e ? " mjr-mfv-model3d-host--fill" : ""}`,
      canvasClassName: `mjr-mfv-media mjr-model3d-render-canvas${e ? " mjr-mfv-media--fill" : ""}`,
      hintText: "Rotate: left drag  Pan: right drag  Zoom: wheel or middle drag",
      disableViewerTransform: !0,
      pauseDuringExecution: !!q.FLOATING_VIEWER_PAUSE_DURING_EXECUTION
    });
  const c = document.createElement("img");
  return c.className = i, c.src = n, c.alt = String((t == null ? void 0 : t.filename) || ""), c.draggable = !1, (o === "gif" || l) && ct(c, t, {
    kind: o === "gif" ? "gif" : "animated-image"
  }) || c;
}
function jt(t, e, n, o, i, s) {
  t.beginPath(), typeof t.roundRect == "function" ? t.roundRect(e, n, o, i, s) : (t.moveTo(e + s, n), t.lineTo(e + o - s, n), t.quadraticCurveTo(e + o, n, e + o, n + s), t.lineTo(e + o, n + i - s), t.quadraticCurveTo(e + o, n + i, e + o - s, n + i), t.lineTo(e + s, n + i), t.quadraticCurveTo(e, n + i, e, n + i - s), t.lineTo(e, n + s), t.quadraticCurveTo(e, n, e + s, n), t.closePath());
}
function X(t, e, n, o) {
  t.save(), t.font = "bold 10px system-ui, sans-serif";
  const i = 5, s = t.measureText(e).width;
  t.fillStyle = "rgba(0,0,0,0.58)", jt(t, n, o, s + i * 2, 18, 4), t.fill(), t.fillStyle = "#fff", t.fillText(e, n + i, o + 13), t.restore();
}
function fe(t, e) {
  switch (String((t == null ? void 0 : t.type) || "").toLowerCase()) {
    case "number":
      return he(t, e);
    case "combo":
      return _e(t, e);
    case "text":
    case "string":
    case "customtext":
      return ge(t, e);
    case "toggle":
      return be(t, e);
    default:
      return ye(t);
  }
}
function v(t, e) {
  var o, i, s, l, c, d, r;
  if (!t) return !1;
  const n = String(t.type || "").toLowerCase();
  if (n === "number") {
    const a = Number(e);
    if (Number.isNaN(a)) return !1;
    const u = t.options ?? {}, f = u.min ?? -1 / 0, m = u.max ?? 1 / 0;
    t.value = Math.min(m, Math.max(f, a));
  } else n === "toggle" ? t.value = !!e : t.value = e;
  try {
    (o = t.callback) == null || o.call(t, t.value);
  } catch (a) {
    (i = console.debug) == null || i.call(console, a);
  }
  try {
    const a = w();
    (l = (s = a == null ? void 0 : a.canvas) == null ? void 0 : s.setDirty) == null || l.call(s, !0, !0), (d = (c = a == null ? void 0 : a.graph) == null ? void 0 : c.setDirtyCanvas) == null || d.call(c, !0, !0);
  } catch (a) {
    (r = console.debug) == null || r.call(console, a);
  }
  return !0;
}
function he(t, e) {
  const n = document.createElement("input");
  n.type = "number", n.className = "mjr-ws-input", n.value = t.value ?? "";
  const o = t.options ?? {};
  return o.min != null && (n.min = String(o.min)), o.max != null && (n.max = String(o.max)), o.step != null && (n.step = String(o.step)), n.addEventListener("input", () => {
    const i = n.value;
    i === "" || i === "-" || i === "." || i.endsWith(".") || (v(t, i), e == null || e(t.value));
  }), n.addEventListener("change", () => {
    v(t, n.value) && (n.value = t.value, e == null || e(t.value));
  }), n;
}
function _e(t, e) {
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
    const l = document.createElement("option"), c = typeof s == "string" ? s : (s == null ? void 0 : s.content) ?? (s == null ? void 0 : s.value) ?? (s == null ? void 0 : s.text) ?? String(s);
    l.value = c, l.textContent = c, c === String(t.value) && (l.selected = !0), n.appendChild(l);
  }
  return n.addEventListener("change", () => {
    v(t, n.value) && (e == null || e(t.value));
  }), n;
}
function ge(t, e) {
  const o = document.createElement("div");
  o.className = "mjr-ws-text-wrapper";
  const i = document.createElement("textarea");
  i.className = "mjr-ws-input mjr-ws-textarea", i.value = t.value ?? "", i.rows = 2;
  const s = document.createElement("button");
  s.type = "button", s.className = "mjr-ws-expand-btn", s.textContent = "Expand", s.style.display = "none";
  let l = !1;
  const c = () => {
    i.style.height = "auto";
    const d = i.scrollHeight;
    l ? (i.style.height = d + "px", i.style.maxHeight = "none", s.textContent = "Collapse") : (i.style.height = Math.min(d, 80) + "px", i.style.maxHeight = "80px", s.textContent = "Expand"), s.style.display = d > 80 ? "" : "none";
  };
  return i.addEventListener("change", () => {
    v(t, i.value) && (e == null || e(t.value));
  }), i.addEventListener("input", () => {
    v(t, i.value), e == null || e(t.value), c();
  }), s.addEventListener("click", () => {
    l = !l, c();
  }), o.appendChild(i), o.appendChild(s), o._mjrAutoFit = c, i._mjrAutoFit = c, requestAnimationFrame(c), o;
}
function be(t, e) {
  const n = document.createElement("label");
  n.className = "mjr-ws-toggle-label";
  const o = document.createElement("input");
  return o.type = "checkbox", o.className = "mjr-ws-checkbox", o.checked = !!t.value, o.addEventListener("change", () => {
    v(t, o.checked) && (e == null || e(t.value));
  }), n.appendChild(o), n;
}
function ye(t) {
  const e = document.createElement("input");
  return e.type = "text", e.className = "mjr-ws-input mjr-ws-readonly", e.value = t.value != null ? String(t.value) : "", e.readOnly = !0, e.tabIndex = -1, e;
}
const Ce = /* @__PURE__ */ new Set(["imageupload", "button", "hidden"]);
class Se {
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
    var o, i, s, l;
    if (!((o = this._node) != null && o.widgets)) return;
    const e = ((i = this._el) == null ? void 0 : i.ownerDocument) || document, n = (e == null ? void 0 : e.activeElement) || null;
    for (const c of this._node.widgets) {
      const d = this._inputMap.get(c.name);
      let r = Ae(d);
      if (r)
        if (r.type === "checkbox") {
          const a = !!c.value;
          r.checked !== a && (r.checked = a);
        } else {
          const a = c.value != null ? String(c.value) : "";
          if (String(r.value ?? "") === a || n && r === n) continue;
          r.value = a, (s = d == null ? void 0 : d._mjrAutoFit) == null || s.call(d), (l = r == null ? void 0 : r._mjrAutoFit) == null || l.call(r);
        }
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
    const c = document.createElement("div");
    c.className = "mjr-ws-node-body";
    const d = e.widgets ?? [];
    let r = !1;
    for (const u of d) {
      const f = String(u.type || "").toLowerCase();
      if (Ce.has(f) || u.hidden || (a = u.options) != null && a.hidden) continue;
      r = !0;
      const m = f === "text" || f === "string" || f === "customtext", h = document.createElement("div");
      h.className = m ? "mjr-ws-widget-row mjr-ws-widget-row--block" : "mjr-ws-widget-row";
      const p = document.createElement("label");
      p.className = "mjr-ws-widget-label", p.textContent = u.name || "";
      const _ = document.createElement("div");
      _.className = "mjr-ws-widget-input";
      const y = fe(u, () => {
      });
      _.appendChild(y), this._inputMap.set(u.name, y), h.appendChild(p), h.appendChild(_), c.appendChild(h);
    }
    if (!r) {
      const u = document.createElement("div");
      u.className = "mjr-ws-node-empty", u.textContent = "No editable parameters", c.appendChild(u);
    }
    return n.appendChild(c), n;
  }
  _locateNode() {
    var n, o, i, s, l, c, d, r;
    if (this._onLocate) {
      this._onLocate();
      return;
    }
    const e = this._node;
    if (e)
      try {
        const a = w(), u = a == null ? void 0 : a.canvas;
        if (!u) return;
        if (typeof u.centerOnNode == "function")
          u.centerOnNode(e);
        else if (u.ds && e.pos) {
          const f = ((n = u.canvas) == null ? void 0 : n.width) || ((o = u.element) == null ? void 0 : o.width) || 800, m = ((i = u.canvas) == null ? void 0 : i.height) || ((s = u.element) == null ? void 0 : s.height) || 600;
          u.ds.offset[0] = -e.pos[0] - (((l = e.size) == null ? void 0 : l[0]) || 0) / 2 + f / 2, u.ds.offset[1] = -e.pos[1] - (((c = e.size) == null ? void 0 : c[1]) || 0) / 2 + m / 2, (d = u.setDirty) == null || d.call(u, !0, !0);
        }
      } catch (a) {
        (r = console.debug) == null || r.call(console, "[MFV sidebar] locateNode error", a);
      }
  }
}
function Ae(t) {
  var e, n, o;
  return t ? (n = (e = t.classList) == null ? void 0 : e.contains) != null && n.call(e, "mjr-ws-text-wrapper") ? ((o = t.querySelector) == null ? void 0 : o.call(t, "textarea")) ?? t : t : null;
}
const Ee = 16;
class Pe {
  /**
   * @param {object} opts
   * @param {HTMLElement} opts.hostEl  The MFV root element to append to
   * @param {() => void}  [opts.onClose]
   */
  constructor({ hostEl: e, onClose: n } = {}) {
    this._hostEl = e, this._onClose = n ?? null, this._renderers = [], this._visible = !1, this._selectionKey = "", this._liveSyncHandle = null, this._liveSyncMode = "", this._el = this._build();
  }
  get el() {
    return this._el;
  }
  get isVisible() {
    return this._visible;
  }
  show() {
    this._visible = !0, this._el.classList.add("open"), this.refresh({ force: !0 }), this._startLiveSync();
  }
  hide() {
    this._visible = !1, this._el.classList.remove("open"), this._stopLiveSync();
  }
  toggle() {
    var e;
    this._visible ? (this.hide(), (e = this._onClose) == null || e.call(this)) : this.show();
  }
  /** Re-read selected nodes and rebuild widget sections. */
  refresh({ force: e = !1 } = {}) {
    if (!this._visible) return;
    const { key: n, nodes: o } = bt();
    if (!e && n === this._selectionKey && this._renderers.length === o.length) {
      this.syncFromGraph({ allowSelectionRefresh: !1 });
      return;
    }
    if (this._clear(), this._selectionKey = n, !o.length) {
      this._showEmpty();
      return;
    }
    for (const i of o) {
      const s = new Se(i);
      this._renderers.push(s), this._body.appendChild(s.el);
    }
    this.syncFromGraph({ allowSelectionRefresh: !1 });
  }
  /** Sync existing renderers from graph values without full rebuild. */
  syncFromGraph({ allowSelectionRefresh: e = !0 } = {}) {
    if (!this._visible) return;
    const { key: n } = bt();
    if (e && n !== this._selectionKey) {
      this.refresh({ force: !0 });
      return;
    }
    for (const o of this._renderers) o.syncFromGraph();
  }
  dispose() {
    var e;
    this._stopLiveSync(), this._clear(), (e = this._el) == null || e.remove();
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
  _startLiveSync() {
    if (this._liveSyncHandle != null) return;
    const e = yt(this._el), n = () => {
      this._liveSyncHandle = null, this._liveSyncMode = "", this._visible && (this.syncFromGraph(), this._startLiveSync());
    };
    if (typeof e.requestAnimationFrame == "function") {
      this._liveSyncMode = "raf", this._liveSyncHandle = e.requestAnimationFrame(n);
      return;
    }
    this._liveSyncMode = "timeout", this._liveSyncHandle = e.setTimeout(n, Ee);
  }
  _stopLiveSync() {
    var n;
    if (this._liveSyncHandle == null) return;
    const e = yt(this._el);
    try {
      this._liveSyncMode === "raf" && typeof e.cancelAnimationFrame == "function" ? e.cancelAnimationFrame(this._liveSyncHandle) : typeof e.clearTimeout == "function" && e.clearTimeout(this._liveSyncHandle);
    } catch (o) {
      (n = console.debug) == null || n.call(console, o);
    }
    this._liveSyncHandle = null, this._liveSyncMode = "";
  }
}
function Be() {
  var t, e, n;
  try {
    const o = w(), i = ((t = o == null ? void 0 : o.canvas) == null ? void 0 : t.selected_nodes) ?? ((e = o == null ? void 0 : o.canvas) == null ? void 0 : e.selectedNodes) ?? null;
    if (!i) return [];
    if (Array.isArray(i)) return i.filter(Boolean);
    if (i instanceof Map) return Array.from(i.values()).filter(Boolean);
    if (typeof i == "object") return Object.values(i).filter(Boolean);
  } catch (o) {
    (n = console.debug) == null || n.call(console, "[MFV sidebar] _getSelectedNodes error", o);
  }
  return [];
}
function bt() {
  const t = Be();
  return { key: t.map((n) => String((n == null ? void 0 : n.id) ?? "")).filter(Boolean).join("|"), nodes: t };
}
function yt(t) {
  var n;
  const e = ((n = t == null ? void 0 : t.ownerDocument) == null ? void 0 : n.defaultView) || null;
  return e || (typeof window < "u" ? window : globalThis);
}
const N = Object.freeze({
  IDLE: "idle",
  RUNNING: "running",
  STOPPING: "stopping",
  ERROR: "error"
}), Me = /* @__PURE__ */ new Set(["default", "auto", "latent2rgb", "taesd", "none"]), Ct = "progress-update";
function Ne() {
  const t = document.createElement("div");
  t.className = "mjr-mfv-run-controls";
  const e = document.createElement("button");
  e.type = "button", e.className = "mjr-icon-btn mjr-mfv-run-btn";
  const n = I("tooltip.queuePrompt", "Queue Prompt (Run)");
  e.title = n, e.setAttribute("aria-label", n);
  const o = document.createElement("i");
  o.className = "pi pi-play", o.setAttribute("aria-hidden", "true"), e.appendChild(o);
  const i = document.createElement("button");
  i.type = "button", i.className = "mjr-icon-btn mjr-mfv-stop-btn";
  const s = document.createElement("i");
  s.className = "pi pi-stop", s.setAttribute("aria-hidden", "true"), i.appendChild(s), t.appendChild(e), t.appendChild(i);
  let l = N.IDLE, c = !1, d = !1, r = null;
  function a() {
    r != null && (clearTimeout(r), r = null);
  }
  function u(g, { canStop: C = !1 } = {}) {
    l = g, e.classList.toggle("running", l === N.RUNNING), e.classList.toggle("stopping", l === N.STOPPING), e.classList.toggle("error", l === N.ERROR), e.disabled = l === N.RUNNING || l === N.STOPPING, i.disabled = !C || l === N.STOPPING, i.classList.toggle("active", C && l !== N.STOPPING), i.classList.toggle("stopping", l === N.STOPPING), l === N.RUNNING || l === N.STOPPING ? o.className = "pi pi-spin pi-spinner" : o.className = "pi pi-play";
  }
  function f() {
    const g = I("tooltip.queueStop", "Stop Generation");
    i.title = g, i.setAttribute("aria-label", g);
  }
  function m(g = Z.getSnapshot(), { authoritative: C = !1 } = {}) {
    const E = Math.max(0, Number(g == null ? void 0 : g.queue) || 0), P = (g == null ? void 0 : g.prompt) || null, M = !!(P != null && P.currentlyExecuting), T = !!(P && (P.currentlyExecuting || P.errorDetails)), k = E > 0 || T, R = !!(P != null && P.errorDetails);
    C && E === 0 && !P && (c = !1, d = !1);
    const L = c || d || M || E > 0;
    if ((M || k || E > 0) && (c = !1), R) {
      d = !1, a(), u(N.ERROR, { canStop: !1 });
      return;
    }
    if (d) {
      if (!L) {
        d = !1, m(g);
        return;
      }
      u(N.STOPPING, { canStop: !1 });
      return;
    }
    if (c || M || k || E > 0) {
      a(), u(N.RUNNING, { canStop: !0 });
      return;
    }
    a(), u(N.IDLE, { canStop: !1 });
  }
  function h() {
    c = !1, d = !1, a(), u(N.ERROR, { canStop: !1 }), r = setTimeout(() => {
      r = null, m();
    }, 1500);
  }
  async function p() {
    const g = w(), C = Nt(g);
    if (C && typeof C.interrupt == "function")
      return await C.interrupt(), { tracked: !0 };
    if (C && typeof C.fetchApi == "function") {
      const P = await C.fetchApi("/interrupt", { method: "POST" });
      if (!(P != null && P.ok)) throw new Error(`POST /interrupt failed (${P == null ? void 0 : P.status})`);
      return { tracked: !0 };
    }
    const E = await fetch("/interrupt", { method: "POST" });
    if (!E.ok) throw new Error(`POST /interrupt failed (${E.status})`);
    return { tracked: !1 };
  }
  async function _() {
    var g;
    if (!(l === N.RUNNING || l === N.STOPPING)) {
      c = !0, d = !1, m();
      try {
        const C = await Ie();
        C != null && C.tracked || (c = !1), m();
      } catch (C) {
        (g = console.error) == null || g.call(console, "[MFV Run]", C), h();
      }
    }
  }
  async function y() {
    var g;
    if (l === N.RUNNING) {
      d = !0, m();
      try {
        const C = await p();
        C != null && C.tracked || (d = !1, c = !1), m();
      } catch (C) {
        (g = console.error) == null || g.call(console, "[MFV Stop]", C), d = !1, m();
      } finally {
      }
    }
  }
  f(), i.disabled = !0, e.addEventListener("click", _), i.addEventListener("click", y);
  const S = (g) => {
    m((g == null ? void 0 : g.detail) || Z.getSnapshot(), {
      authoritative: !0
    });
  };
  return Z.addEventListener(Ct, S), vt({ timeoutMs: 4e3 }).catch((g) => {
    var C;
    (C = console.debug) == null || C.call(console, g);
  }), m(), {
    el: t,
    dispose() {
      a(), e.removeEventListener("click", _), i.removeEventListener("click", y), Z.removeEventListener(
        Ct,
        S
      );
    }
  };
}
function Fe(t = q.MFV_PREVIEW_METHOD) {
  const e = String(t || "").trim().toLowerCase();
  return Me.has(e) ? e : "taesd";
}
function Tt(t, e = q.MFV_PREVIEW_METHOD) {
  var i;
  const n = Fe(e), o = {
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
function St(t, { previewMethod: e = q.MFV_PREVIEW_METHOD, clientId: n = null } = {}) {
  const o = Tt(t, e), i = {
    prompt: o == null ? void 0 : o.output,
    extra_data: (o == null ? void 0 : o.extra_data) || {}
  }, s = String(n || "").trim();
  return s && (i.client_id = s), i;
}
function At(t, e) {
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
async function Ie() {
  const t = w();
  if (!t) throw new Error("ComfyUI app not available");
  const e = typeof t.graphToPrompt == "function" ? await t.graphToPrompt() : null;
  if (!(e != null && e.output)) throw new Error("graphToPrompt returned empty output");
  const n = Nt(t);
  if (n && typeof n.queuePrompt == "function")
    return await n.queuePrompt(0, Tt(e)), { tracked: !0 };
  if (n && typeof n.fetchApi == "function") {
    const i = await n.fetchApi("/prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        St(e, {
          clientId: At(n, t)
        })
      )
    });
    if (!(i != null && i.ok)) throw new Error(`POST /prompt failed (${i == null ? void 0 : i.status})`);
    return { tracked: !0 };
  }
  const o = await fetch("/prompt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      St(e, {
        clientId: At(n, t)
      })
    )
  });
  if (!o.ok) throw new Error(`POST /prompt failed (${o.status})`);
  return { tracked: !1 };
}
function Le(t) {
  const e = document.createElement("div");
  return e.className = "mjr-mfv", e.setAttribute("role", "dialog"), e.setAttribute("aria-modal", "false"), e.setAttribute("aria-hidden", "true"), t.element = e, e.appendChild(t._buildHeader()), e.setAttribute("aria-labelledby", t._titleId), e.appendChild(t._buildToolbar()), e.appendChild(Kt(t)), t._contentWrapper = document.createElement("div"), t._contentWrapper.className = "mjr-mfv-content-wrapper", t._applySidebarPosition(), t._contentEl = document.createElement("div"), t._contentEl.className = "mjr-mfv-content", t._contentWrapper.appendChild(t._contentEl), t._contentEl.appendChild(Xt(t)), t._sidebar = new Pe({
    hostEl: e,
    onClose: () => t._updateSettingsBtnState(!1)
  }), t._contentWrapper.appendChild(t._sidebar.el), e.appendChild(t._contentWrapper), t._rebindControlHandlers(), t._bindPanelInteractions(), t._bindDocumentUiHandlers(), t._onSidebarPosChanged = (n) => {
    var o;
    ((o = n == null ? void 0 : n.detail) == null ? void 0 : o.key) === "viewer.mfvSidebarPosition" && t._applySidebarPosition();
  }, window.addEventListener("mjr-settings-changed", t._onSidebarPosChanged), t._refresh(), e;
}
function ke(t) {
  const e = document.createElement("div");
  e.className = "mjr-mfv-header";
  const n = document.createElement("span");
  n.className = "mjr-mfv-header-title", n.id = t._titleId, n.textContent = "Majoor Viewer Lite";
  const o = document.createElement("button");
  t._closeBtn = o, o.type = "button", o.className = "mjr-icon-btn mjr-mfv-close-btn", Q(o, I("tooltip.closeViewer", "Close viewer"), ee);
  const i = document.createElement("i");
  return i.className = "pi pi-times", i.setAttribute("aria-hidden", "true"), o.appendChild(i), e.appendChild(n), e.appendChild(o), e;
}
function xe(t) {
  var u, f;
  const e = document.createElement("div");
  e.className = "mjr-mfv-toolbar", t._modeBtn = document.createElement("button"), t._modeBtn.type = "button", t._modeBtn.className = "mjr-icon-btn", t._updateModeBtnUI(), e.appendChild(t._modeBtn), t._pinGroup = document.createElement("div"), t._pinGroup.className = "mjr-mfv-pin-group", t._pinGroup.setAttribute("role", "group"), t._pinGroup.setAttribute("aria-label", "Pin References"), t._pinBtns = {};
  for (const m of ["A", "B", "C", "D"]) {
    const h = document.createElement("button");
    h.type = "button", h.className = "mjr-mfv-pin-btn", h.textContent = m, h.dataset.slot = m, h.title = `Pin ${m}`, h.setAttribute("aria-pressed", "false"), t._pinBtns[m] = h, t._pinGroup.appendChild(h);
  }
  t._updatePinUI(), e.appendChild(t._pinGroup);
  const n = document.createElement("div");
  n.className = "mjr-mfv-toolbar-sep", n.setAttribute("aria-hidden", "true"), e.appendChild(n), t._liveBtn = document.createElement("button"), t._liveBtn.type = "button", t._liveBtn.className = "mjr-icon-btn", t._liveBtn.innerHTML = '<i class="pi pi-circle" aria-hidden="true"></i>', t._liveBtn.setAttribute("aria-pressed", "false"), Q(
    t._liveBtn,
    I("tooltip.liveStreamOff", "Live Stream: OFF — click to follow"),
    Ft
  ), e.appendChild(t._liveBtn), t._previewBtn = document.createElement("button"), t._previewBtn.type = "button", t._previewBtn.className = "mjr-icon-btn", t._previewBtn.innerHTML = '<i class="pi pi-eye" aria-hidden="true"></i>', t._previewBtn.setAttribute("aria-pressed", "false"), Q(
    t._previewBtn,
    I(
      "tooltip.previewStreamOff",
      "KSampler Preview: OFF — click to stream denoising steps"
    ),
    It
  ), e.appendChild(t._previewBtn), t._nodeStreamBtn = document.createElement("button"), t._nodeStreamBtn.type = "button", t._nodeStreamBtn.className = "mjr-icon-btn", t._nodeStreamBtn.innerHTML = '<i class="pi pi-sitemap" aria-hidden="true"></i>', t._nodeStreamBtn.setAttribute("aria-pressed", "false"), Q(
    t._nodeStreamBtn,
    I("tooltip.nodeStreamOff", "Node Stream: OFF — click to stream selected node output"),
    te
  ), e.appendChild(t._nodeStreamBtn), (f = (u = t._nodeStreamBtn).remove) == null || f.call(u), t._nodeStreamBtn = null, t._genBtn = document.createElement("button"), t._genBtn.type = "button", t._genBtn.className = "mjr-icon-btn", t._genBtn.setAttribute("aria-haspopup", "dialog"), t._genBtn.setAttribute("aria-expanded", "false");
  const o = document.createElement("i");
  o.className = "pi pi-info-circle", o.setAttribute("aria-hidden", "true"), t._genBtn.appendChild(o), e.appendChild(t._genBtn), t._updateGenBtnUI(), t._popoutBtn = document.createElement("button"), t._popoutBtn.type = "button", t._popoutBtn.className = "mjr-icon-btn";
  const i = I("tooltip.popOutViewer", "Pop out viewer to separate window");
  t._popoutBtn.title = i, t._popoutBtn.setAttribute("aria-label", i), t._popoutBtn.setAttribute("aria-pressed", "false");
  const s = document.createElement("i");
  s.className = "pi pi-external-link", s.setAttribute("aria-hidden", "true"), t._popoutBtn.appendChild(s), e.appendChild(t._popoutBtn), t._captureBtn = document.createElement("button"), t._captureBtn.type = "button", t._captureBtn.className = "mjr-icon-btn";
  const l = I("tooltip.captureView", "Save view as image");
  t._captureBtn.title = l, t._captureBtn.setAttribute("aria-label", l);
  const c = document.createElement("i");
  c.className = "pi pi-download", c.setAttribute("aria-hidden", "true"), t._captureBtn.appendChild(c), e.appendChild(t._captureBtn);
  const d = document.createElement("div");
  d.className = "mjr-mfv-toolbar-sep", d.style.marginLeft = "auto", d.setAttribute("aria-hidden", "true"), e.appendChild(d), t._settingsBtn = document.createElement("button"), t._settingsBtn.type = "button", t._settingsBtn.className = "mjr-icon-btn mjr-mfv-settings-btn";
  const r = I("tooltip.nodeParams", "Node Parameters");
  t._settingsBtn.title = r, t._settingsBtn.setAttribute("aria-label", r), t._settingsBtn.setAttribute("aria-pressed", "false");
  const a = document.createElement("i");
  return a.className = "pi pi-sliders-h", a.setAttribute("aria-hidden", "true"), t._settingsBtn.appendChild(a), e.appendChild(t._settingsBtn), t._runHandle = Ne(), e.appendChild(t._runHandle.el), t._handleDocClick = (m) => {
    var p, _;
    if (!t._genDropdown) return;
    const h = m == null ? void 0 : m.target;
    (_ = (p = t._genBtn) == null ? void 0 : p.contains) != null && _.call(p, h) || t._genDropdown.contains(h) || t._closeGenDropdown();
  }, t._bindDocumentUiHandlers(), e;
}
function je(t) {
  var n, o, i, s, l, c, d, r, a, u, f, m;
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
      var y, S;
      const p = (S = (y = h.target) == null ? void 0 : y.closest) == null ? void 0 : S.call(y, ".mjr-mfv-pin-btn");
      if (!p) return;
      const _ = p.dataset.slot;
      _ && (t._pinnedSlots.has(_) ? t._pinnedSlots.delete(_) : t._pinnedSlots.add(_), t._pinnedSlots.has("C") || t._pinnedSlots.has("D") ? t._mode !== A.GRID && t.setMode(A.GRID) : t._pinnedSlots.size > 0 && t._mode === A.SIMPLE && t.setMode(A.AB), t._updatePinUI());
    },
    { signal: e }
  ), (c = t._liveBtn) == null || c.addEventListener(
    "click",
    () => {
      t._dispatchControllerAction("toggleLive", W.MFV_LIVE_TOGGLE);
    },
    { signal: e }
  ), (d = t._previewBtn) == null || d.addEventListener(
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
  ), (u = t._popoutBtn) == null || u.addEventListener(
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
function Te(t, e) {
  t._settingsBtn && (t._settingsBtn.classList.toggle("active", !!e), t._settingsBtn.setAttribute("aria-pressed", String(!!e)));
}
function Ve(t) {
  var n;
  if (!t._contentWrapper) return;
  const e = q.MFV_SIDEBAR_POSITION || "right";
  t._contentWrapper.setAttribute("data-sidebar-pos", e), (n = t._sidebar) != null && n.el && t._contentEl && (e === "left" ? t._contentWrapper.insertBefore(t._sidebar.el, t._contentEl) : t._contentWrapper.appendChild(t._sidebar.el));
}
function Ge(t) {
  var e, n, o;
  t._closeGenDropdown();
  try {
    (n = (e = t._genDropdown) == null ? void 0 : e.remove) == null || n.call(e);
  } catch (i) {
    (o = console.debug) == null || o.call(console, i);
  }
  t._genDropdown = null, t._updateGenBtnUI();
}
function Oe(t) {
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
function Re(t) {
  var e, n;
  try {
    (e = t._docAC) == null || e.abort();
  } catch (o) {
    (n = console.debug) == null || n.call(console, o);
  }
  t._docAC = new AbortController(), t._docClickHost = null;
}
function He(t) {
  var e, n;
  return !!((n = (e = t._genDropdown) == null ? void 0 : e.classList) != null && n.contains("is-visible"));
}
function De(t) {
  if (!t.element) return;
  t._genDropdown || (t._genDropdown = t._buildGenDropdown(), t.element.appendChild(t._genDropdown)), t._bindDocumentUiHandlers();
  const e = t._genBtn.getBoundingClientRect(), n = t.element.getBoundingClientRect(), o = e.left - n.left, i = e.bottom - n.top + 6;
  t._genDropdown.style.left = `${o}px`, t._genDropdown.style.top = `${i}px`, t._genDropdown.classList.add("is-visible"), t._updateGenBtnUI();
}
function Ue(t) {
  t._genDropdown && (t._genDropdown.classList.remove("is-visible"), t._updateGenBtnUI());
}
function ze(t) {
  if (!t._genBtn) return;
  const e = t._genInfoSelections.size, n = e > 0, o = t._isGenDropdownOpen();
  t._genBtn.classList.toggle("is-on", n), t._genBtn.classList.toggle("is-open", o);
  const i = n ? `Gen Info (${e} field${e > 1 ? "s" : ""} shown)${o ? " — open" : " — click to configure"}` : `Gen Info${o ? " — open" : " — click to show overlay"}`;
  t._genBtn.title = i, t._genBtn.setAttribute("aria-label", i), t._genBtn.setAttribute("aria-expanded", String(o)), t._genDropdown ? t._genBtn.setAttribute("aria-controls", t._genDropdownId) : t._genBtn.removeAttribute("aria-controls");
}
function $e(t) {
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
    const c = document.createElement("span");
    c.textContent = i, s.appendChild(l), s.appendChild(c), e.appendChild(s);
  }
  return e;
}
function Et(t) {
  const e = Number(t);
  return !Number.isFinite(e) || e <= 0 ? "" : e >= 60 ? `${(e / 60).toFixed(1)}m` : `${e.toFixed(1)}s`;
}
function We(t) {
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
function ve(t, e) {
  var s, l, c, d;
  if (!e) return {};
  try {
    const r = e.geninfo ? { geninfo: e.geninfo } : e.metadata || e.metadata_raw || e, a = qt(r) || null, u = {
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
      a.prompt && (u.prompt = st(String(a.prompt))), a.seed != null && (u.seed = String(a.seed)), a.model && (u.model = Array.isArray(a.model) ? a.model.join(", ") : String(a.model)), Array.isArray(a.loras) && (u.lora = a.loras.map(
        (m) => typeof m == "string" ? m : (m == null ? void 0 : m.name) || (m == null ? void 0 : m.lora_name) || (m == null ? void 0 : m.model_name) || ""
      ).filter(Boolean).join(", ")), a.sampler && (u.sampler = String(a.sampler)), a.scheduler && (u.scheduler = String(a.scheduler)), a.cfg != null && (u.cfg = String(a.cfg)), a.steps != null && (u.step = String(a.steps)), !u.prompt && (r != null && r.prompt) && (u.prompt = st(String(r.prompt || "")));
      const f = e.generation_time_ms ?? ((s = e.metadata_raw) == null ? void 0 : s.generation_time_ms) ?? (r == null ? void 0 : r.generation_time_ms) ?? ((l = r == null ? void 0 : r.geninfo) == null ? void 0 : l.generation_time_ms) ?? 0;
      return f && Number.isFinite(Number(f)) && f > 0 && f < 864e5 && (u.genTime = Et(Number(f) / 1e3)), u;
    }
  } catch (r) {
    (c = console.debug) == null || c.call(console, "[MFV] geninfo normalize failed", r);
  }
  const n = (e == null ? void 0 : e.metadata) || (e == null ? void 0 : e.metadata_raw) || e || {}, o = {
    prompt: st(String((n == null ? void 0 : n.prompt) || (n == null ? void 0 : n.positive) || "")),
    seed: (n == null ? void 0 : n.seed) != null ? String(n.seed) : "",
    model: (n == null ? void 0 : n.checkpoint) || (n == null ? void 0 : n.ckpt_name) || (n == null ? void 0 : n.model) || "",
    lora: Array.isArray(n == null ? void 0 : n.loras) ? n.loras.join(", ") : (n == null ? void 0 : n.lora) || "",
    sampler: (n == null ? void 0 : n.sampler_name) || (n == null ? void 0 : n.sampler) || "",
    scheduler: (n == null ? void 0 : n.scheduler) || "",
    cfg: (n == null ? void 0 : n.cfg) != null ? String(n.cfg) : (n == null ? void 0 : n.cfg_scale) != null ? String(n.cfg_scale) : "",
    step: (n == null ? void 0 : n.steps) != null ? String(n.steps) : "",
    genTime: ""
  }, i = e.generation_time_ms ?? ((d = e.metadata_raw) == null ? void 0 : d.generation_time_ms) ?? (n == null ? void 0 : n.generation_time_ms) ?? 0;
  return i && Number.isFinite(Number(i)) && i > 0 && i < 864e5 && (o.genTime = Et(Number(i) / 1e3)), o;
}
function Ke(t, e) {
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
    let c = s.charAt(0).toUpperCase() + s.slice(1);
    s === "lora" ? c = "LoRA" : s === "cfg" ? c = "CFG" : s === "genTime" && (c = "Gen Time");
    const d = document.createElement("div");
    d.dataset.field = s;
    const r = document.createElement("strong");
    if (r.textContent = `${c}: `, d.appendChild(r), s === "prompt")
      d.appendChild(document.createTextNode(l));
    else if (s === "genTime") {
      const a = We(l);
      let u = "#4CAF50";
      a >= 60 ? u = "#FF9800" : a >= 30 ? u = "#FFC107" : a >= 10 && (u = "#8BC34A");
      const f = document.createElement("span");
      f.style.color = u, f.style.fontWeight = "600", f.textContent = l, d.appendChild(f);
    } else
      d.appendChild(document.createTextNode(l));
    o.appendChild(d);
  }
  return o.childNodes.length > 0 ? o : null;
}
function Xe(t) {
  var e, n, o;
  try {
    (n = (e = t._controller) == null ? void 0 : e.onModeChanged) == null || n.call(e, t._mode);
  } catch (i) {
    (o = console.debug) == null || o.call(console, i);
  }
}
function qe(t) {
  const e = [A.SIMPLE, A.AB, A.SIDE, A.GRID];
  t._mode = e[(e.indexOf(t._mode) + 1) % e.length], t._updateModeBtnUI(), t._refresh(), t._notifyModeChanged();
}
function we(t, e) {
  Object.values(A).includes(e) && (t._mode = e, t._updateModeBtnUI(), t._refresh(), t._notifyModeChanged());
}
function Ye(t) {
  return t._pinnedSlots;
}
function Ze(t) {
  if (t._pinBtns)
    for (const e of ["A", "B", "C", "D"]) {
      const n = t._pinBtns[e];
      if (!n) continue;
      const o = t._pinnedSlots.has(e);
      n.classList.toggle("is-pinned", o), n.setAttribute("aria-pressed", String(o)), n.title = o ? `Unpin ${e}` : `Pin ${e}`;
    }
}
function Je(t) {
  if (!t._modeBtn) return;
  const e = {
    [A.SIMPLE]: { icon: "pi-image", label: "Mode: Simple - click to switch" },
    [A.AB]: { icon: "pi-clone", label: "Mode: A/B Compare - click to switch" },
    [A.SIDE]: { icon: "pi-table", label: "Mode: Side-by-Side - click to switch" },
    [A.GRID]: {
      icon: "pi-th-large",
      label: "Mode: Grid Compare (up to 4) - click to switch"
    }
  }, { icon: n = "pi-image", label: o = "" } = e[t._mode] || {}, i = dt(o, Qt), s = document.createElement("i");
  s.className = `pi ${n}`, s.setAttribute("aria-hidden", "true"), t._modeBtn.replaceChildren(s), t._modeBtn.title = i, t._modeBtn.setAttribute("aria-label", i), t._modeBtn.removeAttribute("aria-pressed");
}
function Qe(t, e) {
  if (!t._liveBtn) return;
  const n = !!e;
  t._liveBtn.classList.toggle("mjr-live-active", n);
  const o = n ? I("tooltip.liveStreamOn", "Live Stream: ON — click to disable") : I("tooltip.liveStreamOff", "Live Stream: OFF — click to follow"), i = dt(o, Ft);
  t._liveBtn.setAttribute("aria-pressed", String(n)), t._liveBtn.setAttribute("aria-label", i);
  const s = document.createElement("i");
  s.className = n ? "pi pi-circle-fill" : "pi pi-circle", s.setAttribute("aria-hidden", "true"), t._liveBtn.replaceChildren(s), t._liveBtn.title = i;
}
function tn(t, e) {
  if (t._previewActive = !!e, !t._previewBtn) return;
  t._previewBtn.classList.toggle("mjr-preview-active", t._previewActive);
  const n = t._previewActive ? I("tooltip.previewStreamOn", "KSampler Preview: ON — streaming denoising steps") : I(
    "tooltip.previewStreamOff",
    "KSampler Preview: OFF — click to stream denoising steps"
  ), o = dt(n, It);
  t._previewBtn.setAttribute("aria-pressed", String(t._previewActive)), t._previewBtn.setAttribute("aria-label", o);
  const i = document.createElement("i");
  i.className = t._previewActive ? "pi pi-eye" : "pi pi-eye-slash", i.setAttribute("aria-hidden", "true"), t._previewBtn.replaceChildren(i), t._previewBtn.title = o, t._previewActive || t._revokePreviewBlob();
}
function en(t, e, n = {}) {
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
  if (t._mode === A.AB || t._mode === A.SIDE || t._mode === A.GRID) {
    const l = t.getPinnedSlots();
    if (t._mode === A.GRID) {
      const c = ["A", "B", "C", "D"].find((d) => !l.has(d)) || "A";
      t[`_media${c}`] = i;
    } else l.has("B") ? t._mediaA = i : t._mediaB = i;
  } else
    t._mediaA = i, t._resetMfvZoom(), t._mode !== A.SIMPLE && (t._mode = A.SIMPLE, t._updateModeBtnUI());
  ++t._refreshGen, t._refresh();
}
function nn(t) {
  if (t._previewBlobUrl) {
    try {
      URL.revokeObjectURL(t._previewBlobUrl);
    } catch {
    }
    t._previewBlobUrl = null;
  }
}
function on(t, e) {
  {
    t._nodeStreamActive = !1;
    return;
  }
}
const sn = [
  "--border-color",
  "--border-default",
  "--button-hover-surface",
  "--button-surface",
  "--comfy-accent",
  "--comfy-font",
  "--comfy-input-bg",
  "--comfy-menu-bg",
  "--comfy-menu-secondary-bg",
  "--comfy-status-error",
  "--comfy-status-success",
  "--comfy-status-warning",
  "--content-bg",
  "--content-fg",
  "--descrip-text",
  "--destructive-background",
  "--font-inter",
  "--input-text",
  "--interface-menu-surface",
  "--interface-panel-hover-surface",
  "--interface-panel-selected-surface",
  "--interface-panel-surface",
  "--modal-card-background",
  "--muted-foreground",
  "--primary-background",
  "--primary-background-hover",
  "--radius-lg",
  "--radius-md",
  "--radius-sm",
  "--success-background",
  "--warning-background"
];
function rn() {
  var t, e, n, o, i;
  try {
    const s = typeof window < "u" ? window : globalThis, l = (e = (t = s == null ? void 0 : s.process) == null ? void 0 : t.versions) == null ? void 0 : e.electron;
    if (typeof l == "string" && l.trim() || s != null && s.electron || s != null && s.ipcRenderer || s != null && s.electronAPI)
      return !0;
    const c = String(((n = s == null ? void 0 : s.navigator) == null ? void 0 : n.userAgent) || ((o = globalThis == null ? void 0 : globalThis.navigator) == null ? void 0 : o.userAgent) || ""), d = /\bElectron\//i.test(c), r = /\bCode\//i.test(c);
    if (d && !r)
      return !0;
  } catch (s) {
    (i = console.debug) == null || i.call(console, s);
  }
  return !1;
}
function F(t, e = null, n = "info") {
  var i, s;
  const o = {
    stage: String(t || "unknown"),
    detail: e,
    ts: Date.now()
  };
  try {
    const l = typeof window < "u" ? window : globalThis, c = "__MJR_MFV_POPOUT_TRACE__", d = Array.isArray(l[c]) ? l[c] : [];
    d.push(o), l[c] = d.slice(-20), l.__MJR_MFV_POPOUT_LAST__ = o;
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
function Pt(t, ...e) {
  return Array.from(
    new Set(
      [String(t || ""), ...e].join(" ").split(/\s+/).filter(Boolean)
    )
  ).join(" ");
}
function Bt(t, e) {
  var n;
  if (!(!t || !e))
    for (const o of Array.from(t.attributes || [])) {
      const i = String((o == null ? void 0 : o.name) || "");
      if (!(!i || i === "class" || i === "style"))
        try {
          e.setAttribute(i, o.value);
        } catch (s) {
          (n = console.debug) == null || n.call(console, s);
        }
    }
}
function Mt(t, e) {
  var i, s, l, c, d;
  if (!t || !(e != null && e.style)) return;
  const n = typeof window < "u" && (window == null ? void 0 : window.getComputedStyle) || (globalThis == null ? void 0 : globalThis.getComputedStyle);
  if (typeof n != "function") return;
  let o = null;
  try {
    o = n(t);
  } catch (r) {
    (i = console.debug) == null || i.call(console, r);
  }
  if (o) {
    for (const r of sn)
      try {
        const a = String(((s = o.getPropertyValue) == null ? void 0 : s.call(o, r)) || "").trim();
        a && e.style.setProperty(r, a);
      } catch (a) {
        (l = console.debug) == null || l.call(console, a);
      }
    try {
      const r = String(((c = o.getPropertyValue) == null ? void 0 : c.call(o, "color-scheme")) || "").trim();
      r && (e.style.colorScheme = r);
    } catch (r) {
      (d = console.debug) == null || d.call(console, r);
    }
  }
}
function an(t) {
  if (!(t != null && t.documentElement) || !(t != null && t.body) || !(document != null && document.documentElement)) return;
  const e = document.documentElement, n = document.body, o = t.documentElement, i = t.body;
  o.className = Pt(
    e.className,
    "mjr-mfv-popout-document"
  ), i.className = Pt(
    n == null ? void 0 : n.className,
    "mjr-mfv-popout-body"
  ), Bt(e, o), Bt(n, i), Mt(e, o), Mt(n, i), e != null && e.lang && (o.lang = e.lang), e != null && e.dir && (o.dir = e.dir);
}
function Vt(t) {
  var n, o, i;
  if (!(t != null && t.body)) return null;
  try {
    const s = (n = t.getElementById) == null ? void 0 : n.call(t, "mjr-mfv-popout-root");
    (o = s == null ? void 0 : s.remove) == null || o.call(s);
  } catch (s) {
    (i = console.debug) == null || i.call(console, s);
  }
  const e = t.createElement("div");
  return e.id = "mjr-mfv-popout-root", e.className = "mjr-mfv-popout-root", t.body.appendChild(e), e;
}
function ln(t, e) {
  if (!t.element) return;
  const n = !!e;
  if (t._desktopExpanded === n) return;
  const o = t.element;
  if (n) {
    t._desktopExpandRestore = {
      parent: o.parentNode || null,
      nextSibling: o.nextSibling || null,
      styleAttr: o.getAttribute("style")
    }, o.parentNode !== document.body && document.body.appendChild(o), o.classList.add("mjr-mfv--desktop-expanded", "is-visible"), o.setAttribute("aria-hidden", "false"), o.style.position = "fixed", o.style.top = "12px", o.style.left = "12px", o.style.right = "12px", o.style.bottom = "12px", o.style.width = "auto", o.style.height = "auto", o.style.maxWidth = "none", o.style.maxHeight = "none", o.style.minWidth = "320px", o.style.minHeight = "240px", o.style.resize = "none", o.style.margin = "0", o.style.zIndex = "2147483000", t._desktopExpanded = !0, t.isVisible = !0, t._resetGenDropdownForCurrentDocument(), t._rebindControlHandlers(), t._bindPanelInteractions(), t._bindDocumentUiHandlers(), t._updatePopoutBtnUI(), F("electron-in-app-expanded", { isVisible: t.isVisible });
    return;
  }
  const i = t._desktopExpandRestore;
  t._desktopExpanded = !1, o.classList.remove("mjr-mfv--desktop-expanded"), (i == null ? void 0 : i.styleAttr) == null || i.styleAttr === "" ? o.removeAttribute("style") : o.setAttribute("style", i.styleAttr), i != null && i.parent && i.parent.isConnected && (i.nextSibling && i.nextSibling.parentNode === i.parent ? i.parent.insertBefore(o, i.nextSibling) : i.parent.appendChild(o)), t._desktopExpandRestore = null, t._resetGenDropdownForCurrentDocument(), t._rebindControlHandlers(), t._bindPanelInteractions(), t._bindDocumentUiHandlers(), t._updatePopoutBtnUI(), F("electron-in-app-restored", null);
}
function cn(t, e) {
  var n;
  t._desktopPopoutUnsupported = !0, F(
    "electron-in-app-fallback",
    { message: (e == null ? void 0 : e.message) || String(e || "unknown error") },
    "warn"
  ), t._setDesktopExpanded(!0);
  try {
    wt(
      I(
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
function dn(t, e, n, o, i) {
  return F(
    "electron-popup-fallback-attempt",
    { reason: (i == null ? void 0 : i.message) || String(i || "unknown") },
    "warn"
  ), t._fallbackPopout(e, n, o), t._popoutWindow ? (t._desktopPopoutUnsupported = !1, F("electron-popup-fallback-opened", null), !0) : !1;
}
function un(t) {
  var c, d;
  if (t._isPopped || !t.element) return;
  const e = t.element;
  t._stopEdgeResize();
  const n = rn(), o = typeof window < "u" && "documentPictureInPicture" in window, i = String(((c = window == null ? void 0 : window.navigator) == null ? void 0 : c.userAgent) || ((d = globalThis == null ? void 0 : globalThis.navigator) == null ? void 0 : d.userAgent) || ""), s = Math.max(e.offsetWidth || 520, 400), l = Math.max(e.offsetHeight || 420, 300);
  if (F("start", {
    isElectronHost: n,
    hasDocumentPiP: o,
    userAgent: i,
    width: s,
    height: l,
    desktopPopoutUnsupported: t._desktopPopoutUnsupported
  }), n && t._desktopPopoutUnsupported) {
    F("electron-in-app-fallback-reuse", null), t._setDesktopExpanded(!0);
    return;
  }
  if (!(n && (F("electron-popup-request", { width: s, height: l }), t._tryElectronPopupFallback(e, s, l, new Error("Desktop popup requested"))))) {
    if (n && "documentPictureInPicture" in window) {
      F("electron-pip-request", { width: s, height: l }), window.documentPictureInPicture.requestWindow({ width: s, height: l }).then((r) => {
        var h, p, _;
        F("electron-pip-opened", {
          hasDocument: !!(r != null && r.document)
        }), t._popoutWindow = r, t._isPopped = !0, t._popoutRestoreGuard = !1;
        try {
          (h = t._popoutAC) == null || h.abort();
        } catch (y) {
          (p = console.debug) == null || p.call(console, y);
        }
        t._popoutAC = new AbortController();
        const a = t._popoutAC.signal, u = () => t._schedulePopInFromPopupClose();
        t._popoutCloseHandler = u;
        const f = r.document;
        f.title = "Majoor Viewer", t._installPopoutStyles(f);
        const m = Vt(f);
        if (!m) {
          t._activateDesktopExpandedFallback(new Error("Popup root creation failed"));
          return;
        }
        try {
          const y = typeof f.adoptNode == "function" ? f.adoptNode(e) : e;
          m.appendChild(y), F("electron-pip-adopted", {
            usedAdoptNode: typeof f.adoptNode == "function"
          });
        } catch (y) {
          F(
            "electron-pip-adopt-failed",
            { message: (y == null ? void 0 : y.message) || String(y) },
            "warn"
          ), console.warn("[MFV] PiP adoptNode failed", y), t._isPopped = !1, t._popoutWindow = null;
          try {
            r.close();
          } catch (S) {
            (_ = console.debug) == null || _.call(console, S);
          }
          t._activateDesktopExpandedFallback(y);
          return;
        }
        e.classList.add("is-visible"), t.isVisible = !0, t._resetGenDropdownForCurrentDocument(), t._rebindControlHandlers(), t._bindDocumentUiHandlers(), t._updatePopoutBtnUI(), F("electron-pip-ready", { isPopped: t._isPopped }), r.addEventListener("pagehide", u, {
          signal: a
        }), t._startPopoutCloseWatch(), t._popoutKeydownHandler = (y) => {
          var g, C;
          const S = String(((g = y == null ? void 0 : y.target) == null ? void 0 : g.tagName) || "").toLowerCase();
          y != null && y.defaultPrevented || (C = y == null ? void 0 : y.target) != null && C.isContentEditable || S === "input" || S === "textarea" || S === "select" || t._forwardKeydownToController(y);
        }, r.addEventListener("keydown", t._popoutKeydownHandler, {
          signal: a
        });
      }).catch((r) => {
        F(
          "electron-pip-request-failed",
          { message: (r == null ? void 0 : r.message) || String(r) },
          "warn"
        ), t._activateDesktopExpandedFallback(r);
      });
      return;
    }
    if (n) {
      F("electron-no-pip-api", { hasDocumentPiP: o }), t._activateDesktopExpandedFallback(
        new Error("Document Picture-in-Picture unavailable after popup failure")
      );
      return;
    }
    F("browser-fallback-popup", { width: s, height: l }), t._fallbackPopout(e, s, l);
  }
}
function pn(t, e, n, o) {
  var u, f, m, h;
  F("browser-popup-open", { width: n, height: o });
  const i = (window.screenX || window.screenLeft) + Math.round((window.outerWidth - n) / 2), s = (window.screenY || window.screenTop) + Math.round((window.outerHeight - o) / 2), l = `width=${n},height=${o},left=${i},top=${s},resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,status=no`, c = window.open("about:blank", "_mjr_viewer", l);
  if (!c) {
    F("browser-popup-blocked", null, "warn"), console.warn("[MFV] Pop-out blocked — allow popups for this site.");
    return;
  }
  F("browser-popup-opened", { hasDocument: !!(c != null && c.document) }), t._popoutWindow = c, t._isPopped = !0, t._popoutRestoreGuard = !1;
  try {
    (u = t._popoutAC) == null || u.abort();
  } catch (p) {
    (f = console.debug) == null || f.call(console, p);
  }
  t._popoutAC = new AbortController();
  const d = t._popoutAC.signal, r = () => t._schedulePopInFromPopupClose();
  t._popoutCloseHandler = r;
  const a = () => {
    let p;
    try {
      p = c.document;
    } catch {
      return;
    }
    if (!p) return;
    p.title = "Majoor Viewer", t._installPopoutStyles(p);
    const _ = Vt(p);
    if (_) {
      try {
        _.appendChild(p.adoptNode(e));
      } catch (y) {
        console.warn("[MFV] adoptNode failed", y);
        return;
      }
      e.classList.add("is-visible"), t.isVisible = !0, t._resetGenDropdownForCurrentDocument(), t._rebindControlHandlers(), t._bindDocumentUiHandlers(), t._updatePopoutBtnUI();
    }
  };
  try {
    a();
  } catch (p) {
    (m = console.debug) == null || m.call(console, "[MFV] immediate mount failed, retrying on load", p);
    try {
      c.addEventListener("load", a, { signal: d });
    } catch (_) {
      (h = console.debug) == null || h.call(console, "[MFV] pop-out page load listener failed", _);
    }
  }
  c.addEventListener("beforeunload", r, { signal: d }), c.addEventListener("pagehide", r, { signal: d }), c.addEventListener("unload", r, { signal: d }), t._startPopoutCloseWatch(), t._popoutKeydownHandler = (p) => {
    var S, g, C, E;
    const _ = String(((S = p == null ? void 0 : p.target) == null ? void 0 : S.tagName) || "").toLowerCase();
    if (p != null && p.defaultPrevented || (g = p == null ? void 0 : p.target) != null && g.isContentEditable || _ === "input" || _ === "textarea" || _ === "select")
      return;
    if (String((p == null ? void 0 : p.key) || "").toLowerCase() === "v" && (p != null && p.ctrlKey || p != null && p.metaKey) && !(p != null && p.altKey) && !(p != null && p.shiftKey)) {
      p.preventDefault(), (C = p.stopPropagation) == null || C.call(p), (E = p.stopImmediatePropagation) == null || E.call(p), t._dispatchControllerAction("toggle", W.MFV_TOGGLE);
      return;
    }
    t._forwardKeydownToController(p);
  }, c.addEventListener("keydown", t._popoutKeydownHandler, { signal: d });
}
function mn(t) {
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
function fn(t) {
  t._clearPopoutCloseWatch(), t._popoutCloseTimer = window.setInterval(() => {
    if (!t._isPopped) {
      t._clearPopoutCloseWatch();
      return;
    }
    const e = t._popoutWindow;
    (!e || e.closed) && (t._clearPopoutCloseWatch(), t._schedulePopInFromPopupClose());
  }, 250);
}
function hn(t) {
  !t._isPopped || t._popoutRestoreGuard || (t._popoutRestoreGuard = !0, window.setTimeout(() => {
    try {
      t.popIn({ closePopupWindow: !1 });
    } finally {
      t._popoutRestoreGuard = !1;
    }
  }, 0));
}
function _n(t, e) {
  var o, i, s;
  if (!(e != null && e.head)) return;
  try {
    for (const l of e.head.querySelectorAll("[data-mjr-popout-cloned-style='1']"))
      l.remove();
  } catch (l) {
    (o = console.debug) == null || o.call(console, l);
  }
  an(e);
  try {
    const l = document.documentElement.style.cssText;
    if (l) {
      const c = e.createElement("style");
      c.setAttribute("data-mjr-popout-cloned-style", "1"), c.textContent = `:root { ${l} }`, e.head.appendChild(c);
    }
  } catch (l) {
    (i = console.debug) == null || i.call(console, l);
  }
  for (const l of document.querySelectorAll('link[rel="stylesheet"], style'))
    try {
      let c = null;
      if (l.tagName === "LINK") {
        c = e.createElement("link");
        for (const d of Array.from(l.attributes || []))
          (d == null ? void 0 : d.name) !== "href" && c.setAttribute(d.name, d.value);
        c.setAttribute("href", l.href || l.getAttribute("href") || "");
      } else
        c = e.importNode(l, !0);
      c.setAttribute("data-mjr-popout-cloned-style", "1"), e.head.appendChild(c);
    } catch (c) {
      (s = console.debug) == null || s.call(console, c);
    }
  const n = e.createElement("style");
  n.setAttribute("data-mjr-popout-cloned-style", "1"), n.textContent = `
        html.mjr-mfv-popout-document {
            min-height: 100%;
            background:
                radial-gradient(
                    1200px 420px at 50% 0%,
                    color-mix(in srgb, var(--primary-background, var(--comfy-accent, #5fb3ff)) 10%, transparent),
                    transparent 62%
                ),
                linear-gradient(
                    180deg,
                    color-mix(in srgb, var(--interface-panel-surface, var(--content-bg, #16191f)) 82%, #000 18%),
                    color-mix(in srgb, var(--interface-menu-surface, var(--comfy-menu-bg, #1f2227)) 84%, #000 16%)
                ) !important;
        }
        body.mjr-mfv-popout-body {
            margin: 0 !important;
            display: flex !important;
            min-height: 100vh !important;
            overflow: hidden !important;
            background: transparent !important;
        }
        #mjr-mfv-popout-root,
        .mjr-mfv-popout-root {
            flex: 1 !important;
            min-width: 0 !important;
            min-height: 0 !important;
            display: flex !important;
            isolation: isolate;
        }
        body.mjr-mfv-popout-body .mjr-mfv {
            position: static !important;
            width: 100% !important;
            height: 100% !important;
            min-width: 0 !important;
            min-height: 0 !important;
            resize: none !important;
            border-radius: 0 !important;
            display: flex !important;
            opacity: 1 !important;
            visibility: visible !important;
            pointer-events: auto !important;
            transform: none !important;
            max-width: none !important;
            max-height: none !important;
            overflow: hidden !important;
        }
    `, e.head.appendChild(n);
}
function gn(t, { closePopupWindow: e = !0 } = {}) {
  var i, s, l, c;
  if (t._desktopExpanded) {
    t._setDesktopExpanded(!1);
    return;
  }
  if (!t._isPopped || !t.element) return;
  const n = t._popoutWindow;
  t._clearPopoutCloseWatch();
  try {
    (i = t._popoutAC) == null || i.abort();
  } catch (d) {
    (s = console.debug) == null || s.call(console, d);
  }
  t._popoutAC = null, t._popoutCloseHandler = null, t._popoutKeydownHandler = null, t._isPopped = !1;
  let o = t.element;
  try {
    o = (o == null ? void 0 : o.ownerDocument) === document ? o : document.adoptNode(o);
  } catch (d) {
    (l = console.debug) == null || l.call(console, "[MFV] pop-in adopt failed", d);
  }
  if (document.body.appendChild(o), t._resetGenDropdownForCurrentDocument(), t._rebindControlHandlers(), t._bindPanelInteractions(), t._bindDocumentUiHandlers(), o.classList.add("is-visible"), o.setAttribute("aria-hidden", "false"), t.isVisible = !0, t._updatePopoutBtnUI(), e)
    try {
      n == null || n.close();
    } catch (d) {
      (c = console.debug) == null || c.call(console, d);
    }
  t._popoutWindow = null;
}
function bn(t) {
  if (!t._popoutBtn) return;
  const e = t._isPopped || t._desktopExpanded;
  t.element && t.element.classList.toggle("mjr-mfv--popped", e), t._popoutBtn.classList.toggle("mjr-popin-active", e);
  const n = t._popoutBtn.querySelector("i") || document.createElement("i"), o = e ? I("tooltip.popInViewer", "Return to floating panel") : I("tooltip.popOutViewer", "Pop out viewer to separate window");
  n.className = e ? "pi pi-sign-in" : "pi pi-external-link", t._popoutBtn.title = o, t._popoutBtn.setAttribute("aria-label", o), t._popoutBtn.setAttribute("aria-pressed", String(e)), t._popoutBtn.contains(n) || t._popoutBtn.replaceChildren(n);
}
function yn(t) {
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
function Cn(t, e, n) {
  if (!n) return "";
  const o = t <= n.left + J, i = t >= n.right - J, s = e <= n.top + J, l = e >= n.bottom - J;
  return s && o ? "nw" : s && i ? "ne" : l && o ? "sw" : l && i ? "se" : s ? "n" : l ? "s" : o ? "w" : i ? "e" : "";
}
function Sn(t) {
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
function An(t) {
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
function En(t, e) {
  var c;
  if (!e) return;
  const n = (d) => {
    if (!t.element || t._isPopped) return "";
    const r = t.element.getBoundingClientRect();
    return t._getResizeDirectionFromPoint(d.clientX, d.clientY, r);
  }, o = (c = t._panelAC) == null ? void 0 : c.signal, i = (d) => {
    var h;
    if (d.button !== 0 || !t.element || t._isPopped) return;
    const r = n(d);
    if (!r) return;
    d.preventDefault(), d.stopPropagation();
    const a = t.element.getBoundingClientRect(), u = window.getComputedStyle(t.element), f = Math.max(120, Number.parseFloat(u.minWidth) || 0), m = Math.max(100, Number.parseFloat(u.minHeight) || 0);
    t._resizeState = {
      pointerId: d.pointerId,
      dir: r,
      startX: d.clientX,
      startY: d.clientY,
      startLeft: a.left,
      startTop: a.top,
      startWidth: a.width,
      startHeight: a.height,
      minWidth: f,
      minHeight: m
    }, t.element.style.left = `${Math.round(a.left)}px`, t.element.style.top = `${Math.round(a.top)}px`, t.element.style.right = "auto", t.element.style.bottom = "auto", t.element.classList.add("mjr-mfv--resizing"), t.element.style.cursor = t._resizeCursorForDirection(r);
    try {
      t.element.setPointerCapture(d.pointerId);
    } catch (p) {
      (h = console.debug) == null || h.call(console, p);
    }
  }, s = (d) => {
    if (!t.element || t._isPopped) return;
    const r = t._resizeState;
    if (!r) {
      const _ = n(d);
      t.element.style.cursor = _ ? t._resizeCursorForDirection(_) : "";
      return;
    }
    if (r.pointerId !== d.pointerId) return;
    const a = d.clientX - r.startX, u = d.clientY - r.startY;
    let f = r.startWidth, m = r.startHeight, h = r.startLeft, p = r.startTop;
    r.dir.includes("e") && (f = r.startWidth + a), r.dir.includes("s") && (m = r.startHeight + u), r.dir.includes("w") && (f = r.startWidth - a, h = r.startLeft + a), r.dir.includes("n") && (m = r.startHeight - u, p = r.startTop + u), f < r.minWidth && (r.dir.includes("w") && (h -= r.minWidth - f), f = r.minWidth), m < r.minHeight && (r.dir.includes("n") && (p -= r.minHeight - m), m = r.minHeight), f = Math.min(f, Math.max(r.minWidth, window.innerWidth)), m = Math.min(m, Math.max(r.minHeight, window.innerHeight)), h = Math.min(Math.max(0, h), Math.max(0, window.innerWidth - f)), p = Math.min(Math.max(0, p), Math.max(0, window.innerHeight - m)), t.element.style.width = `${Math.round(f)}px`, t.element.style.height = `${Math.round(m)}px`, t.element.style.left = `${Math.round(h)}px`, t.element.style.top = `${Math.round(p)}px`, t.element.style.right = "auto", t.element.style.bottom = "auto";
  }, l = (d) => {
    if (!t.element || !t._resizeState || t._resizeState.pointerId !== d.pointerId) return;
    const r = n(d);
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
function Pn(t, e) {
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
      const c = o.signal, d = t.element, r = d.getBoundingClientRect(), a = s.clientX - r.left, u = s.clientY - r.top, f = (h) => {
        const p = Math.min(
          window.innerWidth - d.offsetWidth,
          Math.max(0, h.clientX - a)
        ), _ = Math.min(
          window.innerHeight - d.offsetHeight,
          Math.max(0, h.clientY - u)
        );
        d.style.left = `${p}px`, d.style.top = `${_}px`, d.style.right = "auto", d.style.bottom = "auto";
      }, m = () => {
        try {
          o == null || o.abort();
        } catch {
        }
      };
      e.addEventListener("pointermove", f, { signal: c }), e.addEventListener("pointerup", m, { signal: c });
    },
    n ? { signal: n } : void 0
  );
}
async function Bn(t, e, n, o, i, s, l, c) {
  var m, h, p, _, y;
  if (!n) return;
  const d = H(n);
  let r = null;
  if (d === "video" && (r = c instanceof HTMLVideoElement ? c : ((m = t._contentEl) == null ? void 0 : m.querySelector("video")) || null), !r && d === "model3d") {
    const S = (n == null ? void 0 : n.id) != null ? String(n.id) : "";
    S && (r = ((p = (h = t._contentEl) == null ? void 0 : h.querySelector) == null ? void 0 : p.call(
      h,
      `.mjr-model3d-render-canvas[data-mjr-asset-id="${S}"]`
    )) || null), r || (r = ((y = (_ = t._contentEl) == null ? void 0 : _.querySelector) == null ? void 0 : y.call(_, ".mjr-model3d-render-canvas")) || null);
  }
  if (!r) {
    const S = xt(n);
    if (!S) return;
    r = await new Promise((g) => {
      const C = new Image();
      C.crossOrigin = "anonymous", C.onload = () => g(C), C.onerror = () => g(null), C.src = S;
    });
  }
  if (!r) return;
  const a = r.videoWidth || r.naturalWidth || s, u = r.videoHeight || r.naturalHeight || l;
  if (!a || !u) return;
  const f = Math.min(s / a, l / u);
  e.drawImage(
    r,
    o + (s - a * f) / 2,
    i + (l - u * f) / 2,
    a * f,
    u * f
  );
}
function Mn(t, e, n, o) {
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
  ], l = 11, c = 16, d = 8, r = Math.max(100, Number(o || 0) - d * 2);
  let a = 0;
  for (const u of s) {
    if (!t._genInfoSelections.has(u)) continue;
    const f = i[u] != null ? String(i[u]) : "";
    if (!f) continue;
    let m = u.charAt(0).toUpperCase() + u.slice(1);
    u === "lora" ? m = "LoRA" : u === "cfg" ? m = "CFG" : u === "genTime" && (m = "Gen Time");
    const h = `${m}: `;
    e.font = `bold ${l}px system-ui, sans-serif`;
    const p = e.measureText(h).width;
    e.font = `${l}px system-ui, sans-serif`;
    const _ = Math.max(32, r - d * 2 - p);
    let y = 0, S = "";
    for (const g of f.split(" ")) {
      const C = S ? S + " " + g : g;
      e.measureText(C).width > _ && S ? (y += 1, S = g) : S = C;
    }
    S && (y += 1), a += y;
  }
  return a > 0 ? a * c + d * 2 : 0;
}
function Nn(t, e, n, o, i, s, l) {
  if (!n || !t._genInfoSelections.size) return;
  const c = t._getGenFields(n), d = {
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
  for (const E of r) {
    if (!t._genInfoSelections.has(E)) continue;
    const P = c[E] != null ? String(c[E]) : "";
    if (!P) continue;
    let M = E.charAt(0).toUpperCase() + E.slice(1);
    E === "lora" ? M = "LoRA" : E === "cfg" ? M = "CFG" : E === "genTime" && (M = "Gen Time"), a.push({
      label: `${M}: `,
      value: P,
      color: d[E] || "#ffffff"
    });
  }
  if (!a.length) return;
  const u = 11, f = 16, m = 8, h = Math.max(100, s - m * 2);
  e.save();
  const p = [];
  for (const { label: E, value: P, color: M } of a) {
    e.font = `bold ${u}px system-ui, sans-serif`;
    const T = e.measureText(E).width;
    e.font = `${u}px system-ui, sans-serif`;
    const k = h - m * 2 - T, R = [];
    let L = "";
    for (const D of P.split(" ")) {
      const G = L ? L + " " + D : D;
      e.measureText(G).width > k && L ? (R.push(L), L = D) : L = G;
    }
    L && R.push(L), p.push({ label: E, labelW: T, lines: R, color: M });
  }
  const y = p.reduce((E, P) => E + P.lines.length, 0) * f + m * 2, S = o + m, g = i + l - y - m;
  e.globalAlpha = 0.72, e.fillStyle = "#000", jt(e, S, g, h, y, 6), e.fill(), e.globalAlpha = 1;
  let C = g + m + u;
  for (const { label: E, labelW: P, lines: M, color: T } of p)
    for (let k = 0; k < M.length; k++)
      k === 0 ? (e.font = `bold ${u}px system-ui, sans-serif`, e.fillStyle = T, e.fillText(E, S + m, C), e.font = `${u}px system-ui, sans-serif`, e.fillStyle = "rgba(255,255,255,0.88)", e.fillText(M[k], S + m + P, C)) : (e.font = `${u}px system-ui, sans-serif`, e.fillStyle = "rgba(255,255,255,0.88)", e.fillText(M[k], S + m + P, C)), C += f;
  e.restore();
}
async function Fn(t) {
  var d;
  if (!t._contentEl) return;
  t._captureBtn && (t._captureBtn.disabled = !0, t._captureBtn.setAttribute("aria-label", I("tooltip.capturingView", "Capturing…")));
  const e = t._contentEl.clientWidth || 480, n = t._contentEl.clientHeight || 360;
  let o = n;
  if (t._mode === A.SIMPLE && t._mediaA && t._genInfoSelections.size) {
    const r = document.createElement("canvas");
    r.width = e, r.height = n;
    const a = r.getContext("2d"), u = t._estimateGenInfoOverlayHeight(a, t._mediaA, e);
    if (u > 0) {
      const f = Math.max(n, u + 24);
      o = Math.min(f, n * 4);
    }
  }
  const i = document.createElement("canvas");
  i.width = e, i.height = o;
  const s = i.getContext("2d");
  s.fillStyle = "#0d0d0d", s.fillRect(0, 0, e, o);
  try {
    if (t._mode === A.SIMPLE)
      t._mediaA && (await t._drawMediaFit(s, t._mediaA, 0, 0, e, n), t._drawGenInfoOverlay(s, t._mediaA, 0, 0, e, o));
    else if (t._mode === A.AB) {
      const r = Math.round(t._abDividerX * e), a = t._contentEl.querySelector(
        ".mjr-mfv-ab-layer:not(.mjr-mfv-ab-layer--b) video"
      ), u = t._contentEl.querySelector(".mjr-mfv-ab-layer--b video");
      t._mediaA && await t._drawMediaFit(s, t._mediaA, 0, 0, e, o, a), t._mediaB && (s.save(), s.beginPath(), s.rect(r, 0, e - r, o), s.clip(), await t._drawMediaFit(s, t._mediaB, 0, 0, e, o, u), s.restore()), s.save(), s.strokeStyle = "rgba(255,255,255,0.88)", s.lineWidth = 2, s.beginPath(), s.moveTo(r, 0), s.lineTo(r, o), s.stroke(), s.restore(), X(s, "A", 8, 8), X(s, "B", r + 8, 8), t._mediaA && t._drawGenInfoOverlay(s, t._mediaA, 0, 0, r, o), t._mediaB && t._drawGenInfoOverlay(s, t._mediaB, r, 0, e - r, o);
    } else if (t._mode === A.SIDE) {
      const r = Math.floor(e / 2), a = t._contentEl.querySelector(".mjr-mfv-side-panel:first-child video"), u = t._contentEl.querySelector(".mjr-mfv-side-panel:last-child video");
      t._mediaA && (await t._drawMediaFit(s, t._mediaA, 0, 0, r, o, a), t._drawGenInfoOverlay(s, t._mediaA, 0, 0, r, o)), s.fillStyle = "#111", s.fillRect(r, 0, 2, o), t._mediaB && (await t._drawMediaFit(s, t._mediaB, r, 0, r, o, u), t._drawGenInfoOverlay(s, t._mediaB, r, 0, r, o)), X(s, "A", 8, 8), X(s, "B", r + 8, 8);
    } else if (t._mode === A.GRID) {
      const r = Math.floor(e / 2), a = Math.floor(o / 2), u = 1, f = [
        { media: t._mediaA, label: "A", x: 0, y: 0, w: r - u, h: a - u },
        {
          media: t._mediaB,
          label: "B",
          x: r + u,
          y: 0,
          w: r - u,
          h: a - u
        },
        {
          media: t._mediaC,
          label: "C",
          x: 0,
          y: a + u,
          w: r - u,
          h: a - u
        },
        {
          media: t._mediaD,
          label: "D",
          x: r + u,
          y: a + u,
          w: r - u,
          h: a - u
        }
      ], m = t._contentEl.querySelectorAll(".mjr-mfv-grid-cell");
      for (let h = 0; h < f.length; h++) {
        const p = f[h], _ = ((d = m[h]) == null ? void 0 : d.querySelector("video")) || null;
        p.media && (await t._drawMediaFit(s, p.media, p.x, p.y, p.w, p.h, _), t._drawGenInfoOverlay(s, p.media, p.x, p.y, p.w, p.h)), X(s, p.label, p.x + 8, p.y + 8);
      }
      s.save(), s.fillStyle = "#111", s.fillRect(r - u, 0, u * 2, o), s.fillRect(0, a - u, e, u * 2), s.restore();
    }
  } catch (r) {
    console.debug("[MFV] capture error:", r);
  }
  const c = `${{
    [A.AB]: "mfv-ab",
    [A.SIDE]: "mfv-side",
    [A.GRID]: "mfv-grid"
  }[t._mode] ?? "mfv"}-${Date.now()}.png`;
  try {
    const r = i.toDataURL("image/png"), a = document.createElement("a");
    a.href = r, a.download = c, document.body.appendChild(a), a.click(), setTimeout(() => document.body.removeChild(a), 100);
  } catch (r) {
    console.warn("[MFV] download failed:", r);
  } finally {
    t._captureBtn && (t._captureBtn.disabled = !1, t._captureBtn.setAttribute("aria-label", I("tooltip.captureView", "Save view as image")));
  }
}
function In(t, e, { autoMode: n = !1 } = {}) {
  if (t._mediaA = e || null, t._resetMfvZoom(), n && t._mode !== A.SIMPLE && (t._mode = A.SIMPLE, t._updateModeBtnUI()), t._mediaA && typeof tt == "function") {
    const o = ++t._refreshGen;
    (async () => {
      var i;
      try {
        const s = await tt(t._mediaA, {
          getAssetMetadata: pt,
          getFileMetadataScoped: ut
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
function Ln(t, e, n) {
  t._mediaA = e || null, t._mediaB = n || null, t._resetMfvZoom(), t._mode === A.SIMPLE && (t._mode = A.AB, t._updateModeBtnUI());
  const o = ++t._refreshGen, i = async (s) => {
    if (!s) return s;
    try {
      return await tt(s, {
        getAssetMetadata: pt,
        getFileMetadataScoped: ut
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
function kn(t, e, n, o, i) {
  t._mediaA = e || null, t._mediaB = n || null, t._mediaC = o || null, t._mediaD = i || null, t._resetMfvZoom(), t._mode !== A.GRID && (t._mode = A.GRID, t._updateModeBtnUI());
  const s = ++t._refreshGen, l = async (c) => {
    if (!c) return c;
    try {
      return await tt(c, {
        getAssetMetadata: pt,
        getFileMetadataScoped: ut
      }) || c;
    } catch {
      return c;
    }
  };
  (async () => {
    const [c, d, r, a] = await Promise.all([
      l(t._mediaA),
      l(t._mediaB),
      l(t._mediaC),
      l(t._mediaD)
    ]);
    t._refreshGen === s && (t._mediaA = c || null, t._mediaB = d || null, t._mediaC = r || null, t._mediaD = a || null, t._refresh());
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
let xn = 0;
class Vn {
  constructor({ controller: e = null } = {}) {
    this._instanceId = ++xn, this._controller = e && typeof e == "object" ? { ...e } : null, this.element = null, this.isVisible = !1, this._contentEl = null, this._closeBtn = null, this._modeBtn = null, this._pinGroup = null, this._pinBtns = null, this._liveBtn = null, this._genBtn = null, this._genDropdown = null, this._captureBtn = null, this._genInfoSelections = /* @__PURE__ */ new Set(["genTime"]), this._mode = A.SIMPLE, this._mediaA = null, this._mediaB = null, this._mediaC = null, this._mediaD = null, this._pinnedSlots = /* @__PURE__ */ new Set(), this._abDividerX = 0.5, this._zoom = 1, this._panX = 0, this._panY = 0, this._panzoomAC = null, this._dragging = !1, this._compareSyncAC = null, this._btnAC = null, this._refreshGen = 0, this._popoutWindow = null, this._popoutBtn = null, this._isPopped = !1, this._desktopExpanded = !1, this._desktopExpandRestore = null, this._desktopPopoutUnsupported = !1, this._popoutCloseHandler = null, this._popoutKeydownHandler = null, this._popoutCloseTimer = null, this._popoutRestoreGuard = !1, this._previewBtn = null, this._previewBlobUrl = null, this._previewActive = !1, this._nodeStreamBtn = null, this._nodeStreamActive = !1, this._docAC = new AbortController(), this._popoutAC = null, this._panelAC = new AbortController(), this._resizeState = null, this._titleId = `mjr-mfv-title-${this._instanceId}`, this._genDropdownId = `mjr-mfv-gen-dropdown-${this._instanceId}`, this._progressEl = null, this._progressNodesEl = null, this._progressStepsEl = null, this._progressTextEl = null, this._mediaProgressEl = null, this._mediaProgressTextEl = null, this._progressUpdateHandler = null, this._progressCurrentNodeId = null, this._docClickHost = null, this._handleDocClick = null;
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
    return Le(this);
  }
  _buildHeader() {
    return ke(this);
  }
  _buildToolbar() {
    return xe(this);
  }
  _rebindControlHandlers() {
    return je(this);
  }
  _updateSettingsBtnState(e) {
    return Te(this, e);
  }
  _applySidebarPosition() {
    return Ve(this);
  }
  refreshSidebar() {
    var e;
    (e = this._sidebar) == null || e.refresh();
  }
  _resetGenDropdownForCurrentDocument() {
    return Ge(this);
  }
  _bindDocumentUiHandlers() {
    return Oe(this);
  }
  _unbindDocumentUiHandlers() {
    return Re(this);
  }
  _isGenDropdownOpen() {
    return He(this);
  }
  _openGenDropdown() {
    return De(this);
  }
  _closeGenDropdown() {
    return Ue(this);
  }
  _updateGenBtnUI() {
    return ze(this);
  }
  _buildGenDropdown() {
    return $e(this);
  }
  _getGenFields(e) {
    return ve(this, e);
  }
  _buildGenInfoDOM(e) {
    return Ke(this, e);
  }
  _notifyModeChanged() {
    return Xe(this);
  }
  _cycleMode() {
    return qe(this);
  }
  setMode(e) {
    return we(this, e);
  }
  getPinnedSlots() {
    return Ye(this);
  }
  _updatePinUI() {
    return Ze(this);
  }
  _updateModeBtnUI() {
    return Je(this);
  }
  setLiveActive(e) {
    return Qe(this, e);
  }
  setPreviewActive(e) {
    return tn(this, e);
  }
  loadPreviewBlob(e, n = {}) {
    return en(this, e, n);
  }
  _revokePreviewBlob() {
    return nn(this);
  }
  setNodeStreamActive(e) {
    return on(this);
  }
  loadMediaA(e, { autoMode: n = !1 } = {}) {
    return In(this, e, { autoMode: n });
  }
  /**
   * Load two assets for compare modes.
   * Auto-switches from SIMPLE → AB on first call.
   */
  loadMediaPair(e, n) {
    return Ln(this, e, n);
  }
  /**
   * Load up to 4 assets for grid compare mode.
   * Auto-switches to GRID mode if not already.
   */
  loadMediaQuad(e, n, o, i) {
    return kn(this, e, n, o, i);
  }
  /** Apply current zoom+pan state to all media elements (img/video only — divider/overlays unaffected). */
  _applyTransform() {
    if (!this._contentEl) return;
    const e = Math.max(rt, Math.min(at, this._zoom)), n = this._contentEl.clientWidth || 0, o = this._contentEl.clientHeight || 0, i = Math.max(0, (e - 1) * n / 2), s = Math.max(0, (e - 1) * o / 2);
    this._panX = Math.max(-i, Math.min(i, this._panX)), this._panY = Math.max(-s, Math.min(s, this._panY));
    const l = `translate(${this._panX}px,${this._panY}px) scale(${e})`;
    for (const c of this._contentEl.querySelectorAll(".mjr-mfv-media"))
      c != null && c._mjrDisableViewerTransform || (c.style.transform = l, c.style.transformOrigin = "center");
    this._contentEl.classList.remove("mjr-mfv-content--grab", "mjr-mfv-content--grabbing"), e > 1.01 && this._contentEl.classList.add(
      this._dragging ? "mjr-mfv-content--grabbing" : "mjr-mfv-content--grab"
    );
  }
  /**
   * Set zoom, optionally centered at (clientX, clientY).
   * Keeps the image point under the cursor stationary.
   */
  _setMfvZoom(e, n, o) {
    const i = Math.max(rt, Math.min(at, this._zoom)), s = Math.max(rt, Math.min(at, Number(e) || 1));
    if (n != null && o != null && this._contentEl) {
      const l = s / i, c = this._contentEl.getBoundingClientRect(), d = n - (c.left + c.width / 2), r = o - (c.top + c.height / 2);
      this._panX = this._panX * l + (1 - l) * d, this._panY = this._panY * l + (1 - l) * r;
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
        if ((h = (m = r.target) == null ? void 0 : m.closest) != null && h.call(m, "audio") || (_ = (p = r.target) == null ? void 0 : p.closest) != null && _.call(p, ".mjr-mfv-simple-player-controls") || it(r.target)) return;
        const a = ue(r.target, e);
        if (a && pe(
          a,
          Number(r.deltaX || 0),
          Number(r.deltaY || 0)
        ))
          return;
        r.preventDefault();
        const f = 1 - (r.deltaY || r.deltaX || 0) * Jt;
        this._setMfvZoom(this._zoom * f, r.clientX, r.clientY);
      },
      { ...n, passive: !1 }
    );
    let o = !1, i = 0, s = 0, l = 0, c = 0;
    e.addEventListener(
      "pointerdown",
      (r) => {
        var a, u, f, m, h, p, _, y, S;
        if (!(r.button !== 0 && r.button !== 1) && !(this._zoom <= 1.01) && !((u = (a = r.target) == null ? void 0 : a.closest) != null && u.call(a, "video")) && !((m = (f = r.target) == null ? void 0 : f.closest) != null && m.call(f, "audio")) && !((p = (h = r.target) == null ? void 0 : h.closest) != null && p.call(h, ".mjr-mfv-simple-player-controls")) && !((y = (_ = r.target) == null ? void 0 : _.closest) != null && y.call(_, ".mjr-mfv-ab-divider")) && !it(r.target)) {
          r.preventDefault(), o = !0, this._dragging = !0, i = r.clientX, s = r.clientY, l = this._panX, c = this._panY;
          try {
            e.setPointerCapture(r.pointerId);
          } catch (g) {
            (S = console.debug) == null || S.call(console, g);
          }
          this._applyTransform();
        }
      },
      n
    ), e.addEventListener(
      "pointermove",
      (r) => {
        o && (this._panX = l + (r.clientX - i), this._panY = c + (r.clientY - s), this._applyTransform());
      },
      n
    );
    const d = (r) => {
      var a;
      if (o) {
        o = !1, this._dragging = !1;
        try {
          e.releasePointerCapture(r.pointerId);
        } catch (u) {
          (a = console.debug) == null || a.call(console, u);
        }
        this._applyTransform();
      }
    };
    e.addEventListener("pointerup", d, n), e.addEventListener("pointercancel", d, n), e.addEventListener(
      "dblclick",
      (r) => {
        var u, f, m, h, p, _;
        if ((f = (u = r.target) == null ? void 0 : u.closest) != null && f.call(u, "video") || (h = (m = r.target) == null ? void 0 : m.closest) != null && h.call(m, "audio") || (_ = (p = r.target) == null ? void 0 : p.closest) != null && _.call(p, ".mjr-mfv-simple-player-controls") || it(r.target)) return;
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
    if (this._destroyCompareSync(), !!this._contentEl && this._mode !== A.SIMPLE)
      try {
        const n = Array.from(this._contentEl.querySelectorAll("video, audio"));
        if (n.length < 2) return;
        const o = n[0] || null, i = n.slice(1);
        if (!o || !i.length) return;
        this._compareSyncAC = Yt(o, i, { threshold: 0.08 });
      } catch (n) {
        (e = console.debug) == null || e.call(console, n);
      }
  }
  // ── Render ────────────────────────────────────────────────────────────────
  _refresh() {
    if (this._contentEl) {
      switch (this._destroyPanZoom(), this._destroyCompareSync(), this._contentEl.replaceChildren(), this._contentEl.style.overflow = "hidden", this._mode) {
        case A.SIMPLE:
          this._renderSimple();
          break;
        case A.AB:
          this._renderAB();
          break;
        case A.SIDE:
          this._renderSide();
          break;
        case A.GRID:
          this._renderGrid();
          break;
      }
      this._mediaProgressEl && this._contentEl.appendChild(this._mediaProgressEl), this._applyTransform(), this._initPanZoom(this._contentEl), this._initCompareSync();
    }
  }
  _renderSimple() {
    if (!this._mediaA) {
      this._contentEl.appendChild(O());
      return;
    }
    const e = H(this._mediaA), n = z(this._mediaA);
    if (!n) {
      this._contentEl.appendChild(O("Could not load media"));
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
      this._contentEl.appendChild(O("Select 2 assets for A/B compare"));
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
    const c = document.createElement("div");
    c.className = "mjr-mfv-ab-layer mjr-mfv-ab-layer--b";
    const d = Math.round(this._abDividerX * 100);
    c.style.clipPath = `inset(0 0 0 ${d}%)`, c.appendChild(n);
    const r = document.createElement("div");
    r.className = "mjr-mfv-ab-divider", r.style.left = `${d}%`;
    const a = this._buildGenInfoDOM(this._mediaA);
    let u = null;
    a && (u = document.createElement("div"), u.className = "mjr-mfv-geninfo-a", $(e) && u.classList.add("mjr-mfv-geninfo--above-player"), u.appendChild(a), u.style.right = `calc(${100 - d}% + 8px)`);
    const f = this._buildGenInfoDOM(this._mediaB);
    let m = null;
    f && (m = document.createElement("div"), m.className = "mjr-mfv-geninfo-b", $(n) && m.classList.add("mjr-mfv-geninfo--above-player"), m.appendChild(f), m.style.left = `calc(${d}% + 8px)`);
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
        const y = h.signal, S = s.getBoundingClientRect(), g = (E) => {
          const P = Math.max(0.02, Math.min(0.98, (E.clientX - S.left) / S.width));
          this._abDividerX = P;
          const M = Math.round(P * 100);
          c.style.clipPath = `inset(0 0 0 ${M}%)`, r.style.left = `${M}%`, u && (u.style.right = `calc(${100 - M}% + 8px)`), m && (m.style.left = `calc(${M}% + 8px)`);
        }, C = () => {
          try {
            h == null || h.abort();
          } catch {
          }
        };
        r.addEventListener("pointermove", g, { signal: y }), r.addEventListener("pointerup", C, { signal: y });
      },
      (p = this._panelAC) != null && p.signal ? { signal: this._panelAC.signal } : void 0
    ), s.appendChild(l), s.appendChild(c), s.appendChild(r), u && s.appendChild(u), m && s.appendChild(m), s.appendChild(U("A", "left")), s.appendChild(U("B", "right")), this._contentEl.appendChild(s);
  }
  _renderSide() {
    const e = this._mediaA ? z(this._mediaA) : null, n = this._mediaB ? z(this._mediaB) : null, o = this._mediaA ? H(this._mediaA) : "", i = this._mediaB ? H(this._mediaB) : "";
    if (!e && !n) {
      this._contentEl.appendChild(O("Select 2 assets for Side-by-Side"));
      return;
    }
    const s = document.createElement("div");
    s.className = "mjr-mfv-side-container";
    const l = document.createElement("div");
    l.className = "mjr-mfv-side-panel", e ? l.appendChild(e) : l.appendChild(O("—")), l.appendChild(U("A", "left"));
    const c = o === "audio" ? null : this._buildGenInfoDOM(this._mediaA);
    if (c) {
      const a = document.createElement("div");
      a.className = "mjr-mfv-geninfo-a", $(e) && a.classList.add("mjr-mfv-geninfo--above-player"), a.appendChild(c), l.appendChild(a);
    }
    const d = document.createElement("div");
    d.className = "mjr-mfv-side-panel", n ? d.appendChild(n) : d.appendChild(O("—")), d.appendChild(U("B", "right"));
    const r = i === "audio" ? null : this._buildGenInfoDOM(this._mediaB);
    if (r) {
      const a = document.createElement("div");
      a.className = "mjr-mfv-geninfo-b", $(n) && a.classList.add("mjr-mfv-geninfo--above-player"), a.appendChild(r), d.appendChild(a);
    }
    s.appendChild(l), s.appendChild(d), this._contentEl.appendChild(s);
  }
  _renderGrid() {
    const e = [
      { media: this._mediaA, label: "A" },
      { media: this._mediaB, label: "B" },
      { media: this._mediaC, label: "C" },
      { media: this._mediaD, label: "D" }
    ];
    if (!e.filter((i) => i.media).length) {
      this._contentEl.appendChild(O("Select up to 4 assets for Grid Compare"));
      return;
    }
    const o = document.createElement("div");
    o.className = "mjr-mfv-grid-container";
    for (const { media: i, label: s } of e) {
      const l = document.createElement("div");
      if (l.className = "mjr-mfv-grid-cell", i) {
        const c = H(i), d = z(i);
        if (d ? l.appendChild(d) : l.appendChild(O("—")), l.appendChild(
          U(s, s === "A" || s === "C" ? "left" : "right")
        ), c !== "audio") {
          const r = this._buildGenInfoDOM(i);
          if (r) {
            const a = document.createElement("div");
            a.className = `mjr-mfv-geninfo-${s.toLowerCase()}`, $(d) && a.classList.add("mjr-mfv-geninfo--above-player"), a.appendChild(r), l.appendChild(a);
          }
        }
      } else
        l.appendChild(O("—")), l.appendChild(
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
    this.element && (this._destroyPanZoom(), this._destroyCompareSync(), this._stopEdgeResize(), this._closeGenDropdown(), me(this.element), this.element.classList.remove("is-visible"), this.element.setAttribute("aria-hidden", "true"), this.isVisible = !1);
  }
  // ── Pop-out / Pop-in (separate OS window for second monitor) ────────────
  _setDesktopExpanded(e) {
    return ln(this, e);
  }
  _activateDesktopExpandedFallback(e) {
    return cn(this, e);
  }
  _tryElectronPopupFallback(e, n, o, i) {
    return dn(this, e, n, o, i);
  }
  popOut() {
    return un(this);
  }
  _fallbackPopout(e, n, o) {
    return pn(this, e, n, o);
  }
  _clearPopoutCloseWatch() {
    return mn(this);
  }
  _startPopoutCloseWatch() {
    return fn(this);
  }
  _schedulePopInFromPopupClose() {
    return hn(this);
  }
  _installPopoutStyles(e) {
    return _n(this, e);
  }
  popIn(e) {
    return gn(this, e);
  }
  _updatePopoutBtnUI() {
    return bn(this);
  }
  get isPopped() {
    return this._isPopped || this._desktopExpanded;
  }
  _resizeCursorForDirection(e) {
    return yn(e);
  }
  _getResizeDirectionFromPoint(e, n, o) {
    return Cn(e, n, o);
  }
  _stopEdgeResize() {
    return Sn(this);
  }
  _bindPanelInteractions() {
    return An(this);
  }
  _initEdgeResize(e) {
    return En(this, e);
  }
  _initDrag(e) {
    return Pn(this, e);
  }
  async _drawMediaFit(e, n, o, i, s, l, c) {
    return Bn(this, e, n, o, i, s, l, c);
  }
  _estimateGenInfoOverlayHeight(e, n, o) {
    return Mn(this, e, n, o);
  }
  _drawGenInfoOverlay(e, n, o, i, s, l) {
    return Nn(this, e, n, o, i, s, l);
  }
  async _captureView() {
    return Fn(this);
  }
  dispose() {
    var e, n, o, i, s, l, c, d, r, a, u, f, m, h, p, _, y, S;
    Zt(this), this._destroyPanZoom(), this._destroyCompareSync(), this._stopEdgeResize(), this._clearPopoutCloseWatch();
    try {
      (e = this._panelAC) == null || e.abort(), this._panelAC = null;
    } catch (g) {
      (n = console.debug) == null || n.call(console, g);
    }
    try {
      (o = this._btnAC) == null || o.abort(), this._btnAC = null;
    } catch (g) {
      (i = console.debug) == null || i.call(console, g);
    }
    try {
      (s = this._docAC) == null || s.abort(), this._docAC = null;
    } catch (g) {
      (l = console.debug) == null || l.call(console, g);
    }
    try {
      (c = this._popoutAC) == null || c.abort(), this._popoutAC = null;
    } catch (g) {
      (d = console.debug) == null || d.call(console, g);
    }
    try {
      (r = this._panzoomAC) == null || r.abort(), this._panzoomAC = null;
    } catch (g) {
      (a = console.debug) == null || a.call(console, g);
    }
    try {
      (f = (u = this._compareSyncAC) == null ? void 0 : u.abort) == null || f.call(u), this._compareSyncAC = null;
    } catch (g) {
      (m = console.debug) == null || m.call(console, g);
    }
    try {
      this._isPopped && this.popIn();
    } catch (g) {
      (h = console.debug) == null || h.call(console, g);
    }
    this._revokePreviewBlob(), this._onSidebarPosChanged && (window.removeEventListener("mjr-settings-changed", this._onSidebarPosChanged), this._onSidebarPosChanged = null);
    try {
      (p = this.element) == null || p.remove();
    } catch (g) {
      (_ = console.debug) == null || _.call(console, g);
    }
    this.element = null, this._contentEl = null, this._closeBtn = null, this._modeBtn = null, this._pinGroup = null, this._pinBtns = null, this._liveBtn = null, this._nodeStreamBtn = null, this._popoutBtn = null, this._captureBtn = null, this._unbindDocumentUiHandlers();
    try {
      (y = this._genDropdown) == null || y.remove();
    } catch (g) {
      (S = console.debug) == null || S.call(console, g);
    }
    this._mediaA = null, this._mediaB = null, this._mediaC = null, this._mediaD = null, this.isVisible = !1;
  }
}
export {
  Vn as FloatingViewer,
  A as MFV_MODES
};
