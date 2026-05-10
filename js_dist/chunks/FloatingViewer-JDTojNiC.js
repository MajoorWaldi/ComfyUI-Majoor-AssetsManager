import { p as Ee, M as Qe, c as Xe, q as qe, t as Ke, u as Ze, v as Je, A as mt, x as ut, y as ht, z as $e, B as tn, C as en, D as re, F as Me, G as nn, H as V, I as Ct, J as sn, K as Ne, L as on, N as rn, O as St, E as lt, n as an, s as jt, Q as ln, R as cn, S as Lt, T as dn, U as Dt, V as Ut, d as kt, W as un, X as pn } from "./entry-B8lkgOPt.js";
import { ensureViewerMetadataAsset as Mt } from "./genInfo-C7xixB8L.js";
const P = Object.freeze({
  SIMPLE: "simple",
  AB: "ab",
  SIDE: "side",
  GRID: "grid",
  GRAPH: "graph"
}), Tt = 0.25, Ft = 8, mn = 8e-4, At = 8, hn = "C", Be = "L", Le = "K", Pe = "N", fn = "Esc", Pt = 30;
function vt(t) {
  const e = Number(t);
  if (!Number.isFinite(e) || e < 0) return "0:00";
  const n = Math.floor(e), s = Math.floor(n / 3600), o = Math.floor(n % 3600 / 60), i = n % 60;
  return s > 0 ? `${s}:${String(o).padStart(2, "0")}:${String(i).padStart(2, "0")}` : `${o}:${String(i).padStart(2, "0")}`;
}
function ae(t) {
  var e, n;
  try {
    const s = (e = t == null ? void 0 : t.play) == null ? void 0 : e.call(t);
    s && typeof s.catch == "function" && s.catch(() => {
    });
  } catch (s) {
    (n = console.debug) == null || n.call(console, s);
  }
}
function _n(t, e) {
  const n = Math.floor(Number(t) || 0), s = Math.max(0, Math.floor(Number(e) || 0));
  return n < 0 ? 0 : s > 0 && n > s ? s : n;
}
function le(t, e) {
  const n = Number((t == null ? void 0 : t.currentTime) || 0), s = Number(e) > 0 ? Number(e) : Pt;
  return Math.max(0, Math.floor(n * s));
}
function Ie(t, e) {
  const n = Number((t == null ? void 0 : t.duration) || 0), s = Number(e) > 0 ? Number(e) : Pt;
  return !Number.isFinite(n) || n <= 0 ? 0 : Math.max(0, Math.floor(n * s));
}
function gn(t, e, n) {
  var l;
  const s = Number(n) > 0 ? Number(n) : Pt, o = Ie(t, s), r = _n(e, o) / s;
  try {
    t.currentTime = Math.max(0, r);
  } catch (c) {
    (l = console.debug) == null || l.call(console, c);
  }
}
function bn(t) {
  return t instanceof HTMLMediaElement;
}
function yn(t, e) {
  return String(t || "").toLowerCase() === "video" ? !0 : e instanceof HTMLVideoElement;
}
function Cn(t, e) {
  return String(t || "").toLowerCase() === "audio" ? !0 : e instanceof HTMLAudioElement;
}
function An(t) {
  const e = String(t || "").toLowerCase();
  return e === "gif" || e === "animated-image";
}
function Sn(t) {
  var e;
  try {
    const n = Number((t == null ? void 0 : t.naturalWidth) || (t == null ? void 0 : t.width) || 0), s = Number((t == null ? void 0 : t.naturalHeight) || (t == null ? void 0 : t.height) || 0);
    if (!(n > 0 && s > 0)) return "";
    const o = document.createElement("canvas");
    o.width = n, o.height = s;
    const i = o.getContext("2d");
    return i ? (i.drawImage(t, 0, 0, n, s), o.toDataURL("image/png")) : "";
  } catch (n) {
    return (e = console.debug) == null || e.call(console, n), "";
  }
}
function En(t, e = null, { kind: n = "" } = {}) {
  var et;
  if (!t || t._mjrSimplePlayerMounted) return (t == null ? void 0 : t.parentElement) || null;
  t._mjrSimplePlayerMounted = !0;
  const s = Ee(e) || Pt, o = bn(t), i = yn(n, t), r = Cn(n, t), l = An(n), c = document.createElement("div");
  c.className = "mjr-mfv-simple-player", c.tabIndex = 0, c.setAttribute("role", "group"), c.setAttribute("aria-label", "Media player"), r && c.classList.add("is-audio"), l && c.classList.add("is-animated-image");
  const a = document.createElement("div");
  a.className = "mjr-mfv-simple-player-controls";
  const d = document.createElement("input");
  d.type = "range", d.className = "mjr-mfv-simple-player-seek", d.min = "0", d.max = "1000", d.step = "1", d.value = "0", d.setAttribute("aria-label", "Seek"), o || (d.disabled = !0, d.classList.add("is-disabled"));
  const u = document.createElement("div");
  u.className = "mjr-mfv-simple-player-row";
  const m = document.createElement("button");
  m.type = "button", m.className = "mjr-icon-btn mjr-mfv-simple-player-btn", m.setAttribute("aria-label", "Play/Pause");
  const h = document.createElement("i");
  h.className = "pi pi-pause", h.setAttribute("aria-hidden", "true"), m.appendChild(h);
  const f = document.createElement("button");
  f.type = "button", f.className = "mjr-icon-btn mjr-mfv-simple-player-btn", f.setAttribute("aria-label", "Step back");
  const p = document.createElement("i");
  p.className = "pi pi-step-backward", p.setAttribute("aria-hidden", "true"), f.appendChild(p);
  const _ = document.createElement("button");
  _.type = "button", _.className = "mjr-icon-btn mjr-mfv-simple-player-btn", _.setAttribute("aria-label", "Step forward");
  const y = document.createElement("i");
  y.className = "pi pi-step-forward", y.setAttribute("aria-hidden", "true"), _.appendChild(y);
  const g = document.createElement("div");
  g.className = "mjr-mfv-simple-player-time", g.textContent = "0:00 / 0:00";
  const b = document.createElement("div");
  b.className = "mjr-mfv-simple-player-frame", b.textContent = "F: 0", i || (b.style.display = "none");
  const A = document.createElement("button");
  A.type = "button", A.className = "mjr-icon-btn mjr-mfv-simple-player-btn", A.setAttribute("aria-label", "Mute/Unmute");
  const C = document.createElement("i");
  if (C.className = "pi pi-volume-up", C.setAttribute("aria-hidden", "true"), A.appendChild(C), i || (f.disabled = !0, _.disabled = !0, f.classList.add("is-disabled"), _.classList.add("is-disabled")), u.appendChild(f), u.appendChild(m), u.appendChild(_), u.appendChild(g), u.appendChild(b), u.appendChild(A), a.appendChild(d), a.appendChild(u), c.appendChild(t), r) {
    const N = document.createElement("div");
    N.className = "mjr-mfv-simple-player-audio-backdrop", N.textContent = String((e == null ? void 0 : e.filename) || "Audio"), c.appendChild(N);
  }
  c.appendChild(a);
  try {
    t instanceof HTMLMediaElement && (t.controls = !1, t.playsInline = !0, t.loop = !0, t.muted = !0, t.autoplay = !0);
  } catch (N) {
    (et = console.debug) == null || et.call(console, N);
  }
  const S = l ? String((t == null ? void 0 : t.src) || "") : "";
  let M = !1, x = "";
  const j = () => {
    if (o) {
      h.className = t.paused ? "pi pi-play" : "pi pi-pause";
      return;
    }
    if (l) {
      h.className = M ? "pi pi-play" : "pi pi-pause";
      return;
    }
    h.className = "pi pi-play";
  }, k = () => {
    if (t instanceof HTMLMediaElement) {
      C.className = t.muted ? "pi pi-volume-off" : "pi pi-volume-up";
      return;
    }
    C.className = "pi pi-volume-off", A.disabled = !0, A.classList.add("is-disabled");
  }, I = () => {
    if (!i || !(t instanceof HTMLVideoElement)) return;
    const N = le(t, s), T = Ie(t, s);
    b.textContent = T > 0 ? `F: ${N}/${T}` : `F: ${N}`;
  }, O = () => {
    const N = Math.max(0, Math.min(100, Number(d.value) / 1e3 * 100));
    d.style.setProperty("--mjr-seek-pct", `${N}%`);
  }, G = () => {
    if (!o) {
      g.textContent = l ? "Animated" : "Preview", d.value = "0", O();
      return;
    }
    const N = Number(t.currentTime || 0), T = Number(t.duration || 0);
    if (Number.isFinite(T) && T > 0) {
      const R = Math.max(0, Math.min(1, N / T));
      d.value = String(Math.round(R * 1e3)), g.textContent = `${vt(N)} / ${vt(T)}`;
    } else
      d.value = "0", g.textContent = `${vt(N)} / 0:00`;
    O();
  }, q = (N) => {
    var T;
    try {
      (T = N == null ? void 0 : N.stopPropagation) == null || T.call(N);
    } catch {
    }
  }, rt = (N) => {
    var T, R;
    q(N);
    try {
      if (o)
        t.paused ? ae(t) : (T = t.pause) == null || T.call(t);
      else if (l)
        if (!M)
          x || (x = Sn(t)), x && (t.src = x), M = !0;
        else {
          const H = S ? `${S}${S.includes("?") ? "&" : "?"}mjr_anim=${Date.now()}` : t.src;
          t.src = H, M = !1;
        }
    } catch (H) {
      (R = console.debug) == null || R.call(console, H);
    }
    j();
  }, Q = (N, T) => {
    var H, W;
    if (q(T), !i || !(t instanceof HTMLVideoElement)) return;
    try {
      (H = t.pause) == null || H.call(t);
    } catch (nt) {
      (W = console.debug) == null || W.call(console, nt);
    }
    const R = le(t, s);
    gn(t, R + N, s), j(), I(), G();
  }, ft = (N) => {
    var T;
    if (q(N), t instanceof HTMLMediaElement) {
      try {
        t.muted = !t.muted;
      } catch (R) {
        (T = console.debug) == null || T.call(console, R);
      }
      k();
    }
  }, K = (N) => {
    var H;
    if (q(N), !o) return;
    O();
    const T = Number(t.duration || 0);
    if (!Number.isFinite(T) || T <= 0) return;
    const R = Math.max(0, Math.min(1, Number(d.value) / 1e3));
    try {
      t.currentTime = T * R;
    } catch (W) {
      (H = console.debug) == null || H.call(console, W);
    }
    I(), G();
  }, Z = (N) => q(N), It = (N) => {
    var T, R, H, W;
    try {
      if ((R = (T = N == null ? void 0 : N.target) == null ? void 0 : T.closest) != null && R.call(T, "button, input, textarea, select")) return;
      (H = c.focus) == null || H.call(c, { preventScroll: !0 });
    } catch (nt) {
      (W = console.debug) == null || W.call(console, nt);
    }
  }, at = (N) => {
    var R, H, W;
    const T = String((N == null ? void 0 : N.key) || "");
    if (!(!T || N != null && N.altKey || N != null && N.ctrlKey || N != null && N.metaKey)) {
      if (T === " " || T === "Spacebar") {
        (R = N.preventDefault) == null || R.call(N), rt(N);
        return;
      }
      if (T === "ArrowLeft") {
        if (!i) return;
        (H = N.preventDefault) == null || H.call(N), Q(-1, N);
        return;
      }
      if (T === "ArrowRight") {
        if (!i) return;
        (W = N.preventDefault) == null || W.call(N), Q(1, N);
      }
    }
  };
  return m.addEventListener("click", rt), f.addEventListener("click", (N) => Q(-1, N)), _.addEventListener("click", (N) => Q(1, N)), A.addEventListener("click", ft), d.addEventListener("input", K), a.addEventListener("pointerdown", Z), a.addEventListener("click", Z), a.addEventListener("dblclick", Z), c.addEventListener("pointerdown", It), c.addEventListener("keydown", at), t instanceof HTMLMediaElement && (t.addEventListener("play", j, { passive: !0 }), t.addEventListener("pause", j, { passive: !0 }), t.addEventListener(
    "timeupdate",
    () => {
      I(), G();
    },
    { passive: !0 }
  ), t.addEventListener(
    "seeked",
    () => {
      I(), G();
    },
    { passive: !0 }
  ), t.addEventListener(
    "loadedmetadata",
    () => {
      I(), G();
    },
    { passive: !0 }
  )), ae(t), j(), k(), I(), G(), c;
}
const Mn = /* @__PURE__ */ new Set([".mp4", ".webm", ".mov", ".avi", ".mkv"]), Nn = /* @__PURE__ */ new Set([".mp3", ".wav", ".flac", ".ogg", ".m4a", ".aac", ".opus", ".wma"]);
function xe(t) {
  try {
    const e = String(t || "").trim(), n = e.lastIndexOf(".");
    return n >= 0 ? e.slice(n).toLowerCase() : "";
  } catch {
    return "";
  }
}
function X(t) {
  const e = String((t == null ? void 0 : t.kind) || "").toLowerCase();
  if (e === "video") return "video";
  if (e === "audio") return "audio";
  if (e === "model3d") return "model3d";
  const n = String((t == null ? void 0 : t.type) || "").toLowerCase(), s = String((t == null ? void 0 : t.asset_type) || (t == null ? void 0 : t.media_type) || n).toLowerCase();
  if (s === "video") return "video";
  if (s === "audio") return "audio";
  if (s === "model3d") return "model3d";
  const o = xe((t == null ? void 0 : t.filename) || "");
  return o === ".gif" ? "gif" : Mn.has(o) ? "video" : Nn.has(o) ? "audio" : Qe.has(o) ? "model3d" : "image";
}
function je(t) {
  return t ? t.url ? String(t.url) : t.filename && t.id == null ? qe(t.filename, t.subfolder || "", t.type || "output") : t.filename && Ke(t) || "" : "";
}
function w(t = "No media — select assets in the grid") {
  const e = document.createElement("div");
  return e.className = "mjr-mfv-empty", e.textContent = t, e;
}
function st(t, e) {
  const n = document.createElement("div");
  return n.className = `mjr-mfv-label label-${e}`, n.textContent = t, n;
}
function ce(t) {
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
function Bn(t, e) {
  var s, o;
  let n = t && t.nodeType === 1 ? t : (t == null ? void 0 : t.parentElement) || null;
  for (; n && n !== e; ) {
    try {
      const i = (s = window.getComputedStyle) == null ? void 0 : s.call(window, n), r = /(auto|scroll|overlay)/.test(String((i == null ? void 0 : i.overflowY) || "")), l = /(auto|scroll|overlay)/.test(String((i == null ? void 0 : i.overflowX) || ""));
      if (r || l)
        return n;
    } catch (i) {
      (o = console.debug) == null || o.call(console, i);
    }
    n = n.parentElement || null;
  }
  return null;
}
function Ln(t, e, n) {
  if (!t) return !1;
  if (Math.abs(Number(n) || 0) >= Math.abs(Number(e) || 0)) {
    const i = Number(t.scrollTop || 0), r = Math.max(
      0,
      Number(t.scrollHeight || 0) - Number(t.clientHeight || 0)
    );
    if (n < 0 && i > 0 || n > 0 && i < r) return !0;
  }
  const s = Number(t.scrollLeft || 0), o = Math.max(
    0,
    Number(t.scrollWidth || 0) - Number(t.clientWidth || 0)
  );
  return e < 0 && s > 0 || e > 0 && s < o;
}
function Pn(t) {
  var e, n, s, o;
  if (t)
    try {
      const i = (e = t.querySelectorAll) == null ? void 0 : e.call(t, "video, audio");
      if (!i || !i.length) return;
      for (const r of i)
        try {
          (n = r.pause) == null || n.call(r);
        } catch (l) {
          (s = console.debug) == null || s.call(console, l);
        }
    } catch (i) {
      (o = console.debug) == null || o.call(console, i);
    }
}
function $(t, { fill: e = !1 } = {}) {
  var a, d;
  const n = je(t);
  if (!n) return null;
  const s = X(t), o = `mjr-mfv-media mjr-mfv-media--fit-height${e ? " mjr-mfv-media--fill" : ""}`, r = xe((t == null ? void 0 : t.filename) || "") === ".webp" && Number((t == null ? void 0 : t.duration) ?? ((a = t == null ? void 0 : t.metadata_raw) == null ? void 0 : a.duration) ?? 0) > 0, l = (u, m) => {
    var p;
    const h = document.createElement("div");
    h.className = `mjr-mfv-player-host${e ? " mjr-mfv-player-host--fill" : ""}`, h.appendChild(u);
    const f = Ze(u, {
      variant: "viewer",
      hostEl: h,
      mediaKind: m,
      initialFps: Ee(t) || void 0,
      initialFrameCount: Je(t) || void 0
    });
    try {
      f && (h._mjrMediaControlsHandle = f);
    } catch (_) {
      (p = console.debug) == null || p.call(console, _);
    }
    return h;
  };
  if (s === "audio") {
    const u = document.createElement("audio");
    u.className = o, u.src = n, u.controls = !1, u.autoplay = !0, u.preload = "metadata", u.loop = !0, u.muted = !0;
    try {
      u.addEventListener("loadedmetadata", () => ce(u), {
        once: !0
      });
    } catch (m) {
      (d = console.debug) == null || d.call(console, m);
    }
    return ce(u), l(u, "audio");
  }
  if (s === "video") {
    const u = document.createElement("video");
    return u.className = o, u.src = n, u.controls = !1, u.loop = !0, u.muted = !0, u.autoplay = !0, u.playsInline = !0, l(u, "video");
  }
  if (s === "model3d")
    return Xe(t, n, {
      hostClassName: `mjr-model3d-host mjr-mfv-model3d-host${e ? " mjr-mfv-model3d-host--fill" : ""}`,
      canvasClassName: `mjr-mfv-media mjr-model3d-render-canvas${e ? " mjr-mfv-media--fill" : ""}`,
      hintText: "Rotate: left drag  Pan: right drag  Zoom: wheel or middle drag",
      disableViewerTransform: !0,
      pauseDuringExecution: !!mt.FLOATING_VIEWER_PAUSE_DURING_EXECUTION
    });
  const c = document.createElement("img");
  return c.className = o, c.src = n, c.alt = String((t == null ? void 0 : t.filename) || ""), c.draggable = !1, (s === "gif" || r) && En(c, t, {
    kind: s === "gif" ? "gif" : "animated-image"
  }) || c;
}
function ke(t, e, n, s, o, i) {
  t.beginPath(), typeof t.roundRect == "function" ? t.roundRect(e, n, s, o, i) : (t.moveTo(e + i, n), t.lineTo(e + s - i, n), t.quadraticCurveTo(e + s, n, e + s, n + i), t.lineTo(e + s, n + o - i), t.quadraticCurveTo(e + s, n + o, e + s - i, n + o), t.lineTo(e + i, n + o), t.quadraticCurveTo(e, n + o, e, n + o - i), t.lineTo(e, n + i), t.quadraticCurveTo(e, n, e + i, n), t.closePath());
}
function ct(t, e, n, s) {
  t.save(), t.font = "bold 10px system-ui, sans-serif";
  const o = 5, i = t.measureText(e).width;
  t.fillStyle = "rgba(0,0,0,0.58)", ke(t, n, s, i + o * 2, 18, 4), t.fill(), t.fillStyle = "#fff", t.fillText(e, n + o, s + 13), t.restore();
}
function In(t, e, n = null) {
  switch (String((t == null ? void 0 : t.type) || "").toLowerCase()) {
    case "number":
    case "int":
    case "float":
      return jn(t, e, n);
    case "combo":
      return kn(t, e, n);
    case "text":
    case "string":
    case "customtext":
      return Tn(t, e, n);
    case "toggle":
    case "boolean":
      return Fn(t, e, n);
    default:
      return vn(t);
  }
}
function tt(t, e, n = null) {
  var o, i, r, l, c, a, d, u, m, h;
  if (!t) return !1;
  const s = String(t.type || "").toLowerCase();
  if (s === "number" || s === "int" || s === "float") {
    const f = Number(e);
    if (Number.isNaN(f)) return !1;
    const p = t.options ?? {}, _ = p.min ?? -1 / 0, y = p.max ?? 1 / 0;
    let g = Math.min(y, Math.max(_, f));
    (s === "int" || p.precision === 0 || p.round === 1) && (g = Math.round(g)), t.value = g;
  } else s === "toggle" || s === "boolean" ? t.value = !!e : t.value = e;
  try {
    const f = ut(), p = (f == null ? void 0 : f.canvas) ?? null, _ = n ?? (t == null ? void 0 : t.parent) ?? null, y = t.value;
    (o = t.callback) == null || o.call(t, t.value, p, _, null, t), (s === "number" || s === "int" || s === "float") && (t.value = y), xn(t), (i = p == null ? void 0 : p.setDirty) == null || i.call(p, !0, !0), (r = p == null ? void 0 : p.draw) == null || r.call(p, !0, !0);
    const g = (_ == null ? void 0 : _.graph) ?? null;
    g && g !== (f == null ? void 0 : f.graph) && ((l = g.setDirtyCanvas) == null || l.call(g, !0, !0), (c = g.change) == null || c.call(g)), (d = (a = f == null ? void 0 : f.graph) == null ? void 0 : a.setDirtyCanvas) == null || d.call(a, !0, !0), (m = (u = f == null ? void 0 : f.graph) == null ? void 0 : u.change) == null || m.call(u);
  } catch (f) {
    (h = console.debug) == null || h.call(console, "[MFV] writeWidgetValue", f);
  }
  return !0;
}
function xn(t) {
  var s, o, i, r, l, c;
  const e = String(t.value ?? ""), n = (t == null ? void 0 : t.inputEl) ?? (t == null ? void 0 : t.element) ?? (t == null ? void 0 : t.el) ?? ((o = (s = t == null ? void 0 : t.cachedDeepestByFrame) == null ? void 0 : s.widget) == null ? void 0 : o.inputEl) ?? ((r = (i = t == null ? void 0 : t.cachedDeepestByFrame) == null ? void 0 : i.widget) == null ? void 0 : r.element) ?? ((c = (l = t == null ? void 0 : t.cachedDeepestByFrame) == null ? void 0 : l.widget) == null ? void 0 : c.el) ?? null;
  n != null && "value" in n && n.value !== e && (n.value = e);
}
function jn(t, e, n) {
  const s = document.createElement("input");
  s.type = "number", s.className = "mjr-ws-input", s.value = t.value ?? "";
  const o = t.options ?? {}, r = String((t == null ? void 0 : t.type) || "").toLowerCase() === "int" || o.precision === 0 || o.round === 1;
  if (o.min != null && (s.min = String(o.min)), o.max != null && (s.max = String(o.max)), r)
    s.step = "1";
  else {
    const l = o.precision;
    s.step = l != null ? String(Math.pow(10, -l)) : "any";
  }
  return s.addEventListener("input", () => {
    const l = s.value;
    l === "" || l === "-" || l === "." || l.endsWith(".") || (tt(t, l, n), e == null || e(t.value));
  }), s.addEventListener("change", () => {
    tt(t, s.value, n) && (s.value = String(t.value), e == null || e(t.value));
  }), s;
}
function kn(t, e, n) {
  var i;
  const s = document.createElement("select");
  s.className = "mjr-ws-input";
  let o = ((i = t.options) == null ? void 0 : i.values) ?? [];
  if (typeof o == "function")
    try {
      o = o() ?? [];
    } catch {
      o = [];
    }
  Array.isArray(o) || (o = []);
  for (const r of o) {
    const l = document.createElement("option"), c = typeof r == "string" ? r : (r == null ? void 0 : r.content) ?? (r == null ? void 0 : r.value) ?? (r == null ? void 0 : r.text) ?? String(r);
    l.value = c, l.textContent = c, c === String(t.value) && (l.selected = !0), s.appendChild(l);
  }
  return s.addEventListener("change", () => {
    tt(t, s.value, n) && (e == null || e(t.value));
  }), s;
}
function Tn(t, e, n) {
  const s = document.createElement("div");
  s.className = "mjr-ws-text-wrapper";
  const o = document.createElement("textarea");
  o.className = "mjr-ws-input mjr-ws-textarea", o.value = t.value ?? "", o.rows = 2;
  const i = () => {
    o.style.height = "auto", o.style.height = o.scrollHeight + "px";
  };
  return o.addEventListener("change", () => {
    tt(t, o.value, n) && (e == null || e(t.value));
  }), o.addEventListener("input", () => {
    tt(t, o.value, n), e == null || e(t.value), i();
  }), s.appendChild(o), s._mjrAutoFit = i, o._mjrAutoFit = i, requestAnimationFrame(i), s;
}
function Fn(t, e, n) {
  const s = document.createElement("label");
  s.className = "mjr-ws-toggle-label";
  const o = document.createElement("input");
  return o.type = "checkbox", o.className = "mjr-ws-checkbox", o.checked = !!t.value, o.addEventListener("change", () => {
    tt(t, o.checked, n) && (e == null || e(t.value));
  }), s.appendChild(o), s;
}
function vn(t) {
  const e = document.createElement("input");
  return e.type = "text", e.className = "mjr-ws-input mjr-ws-readonly", e.value = t.value != null ? String(t.value) : "", e.readOnly = !0, e.tabIndex = -1, e;
}
const On = /* @__PURE__ */ new Set(["imageupload", "button", "hidden"]), Gn = /\bnote\b|markdown/i;
function Vn(t) {
  return Gn.test(String((t == null ? void 0 : t.type) || ""));
}
function de(t) {
  var s;
  const e = (t == null ? void 0 : t.properties) ?? {};
  if (typeof e.text == "string") return e.text;
  if (typeof e.value == "string") return e.value;
  if (typeof e.markdown == "string") return e.markdown;
  const n = (s = t == null ? void 0 : t.widgets) == null ? void 0 : s[0];
  return n != null && n.value != null ? String(n.value) : "";
}
function Rn(t, e) {
  var o;
  const n = t == null ? void 0 : t.properties;
  n && ("text" in n ? n.text = e : "value" in n ? n.value = e : "markdown" in n ? n.markdown = e : n.text = e);
  const s = (o = t == null ? void 0 : t.widgets) == null ? void 0 : o[0];
  s && (s.value = e);
}
const Hn = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, Dn = /^[0-9a-f]{20,}$/i;
function Un(...t) {
  for (const e of t) {
    const n = String(e || "").trim();
    if (n) return n;
  }
  return "";
}
function Gt(t) {
  return Hn.test(t) || Dn.test(t);
}
function Te(t) {
  var e, n, s;
  return Un(
    t == null ? void 0 : t.title,
    (e = t == null ? void 0 : t.properties) == null ? void 0 : e.title,
    (n = t == null ? void 0 : t.properties) == null ? void 0 : n.name,
    (s = t == null ? void 0 : t.properties) == null ? void 0 : s.label,
    t == null ? void 0 : t.name
  );
}
function Wn(t, { isSubgraph: e = !1 } = {}) {
  const n = String((t == null ? void 0 : t.type) || "").trim(), s = Te(t);
  return (e || Gt(n)) && s ? s : Gt(n) ? "Subgraph" : n || s || `Node #${t == null ? void 0 : t.id}`;
}
function zn(t, e, { isSubgraph: n = !1 } = {}) {
  const s = String((t == null ? void 0 : t.type) || "").trim(), o = Te(t);
  return n && s && !Gt(s) && s !== e ? s : o && o !== s && o !== e ? o : "";
}
class Yn {
  /**
   * @param {object} node
   * @param {object} [opts]
   * @param {() => void} [opts.onLocate]
   * @param {boolean} [opts.collapsible]
   * @param {boolean} [opts.expanded]
   * @param {(expanded: boolean) => void} [opts.onToggle]
   * @param {number} [opts.depth]          — 0 = top-level, >0 = inside a subgraph
   */
  constructor(e, n = {}) {
    this._node = e, this._onLocate = n.onLocate ?? null, this._onToggle = typeof n.onToggle == "function" ? n.onToggle : null, this._collapsible = !!n.collapsible, this._expanded = n.expanded !== !1, this._depth = n.depth ?? 0, this._isSubgraph = !!n.isSubgraph, this._childCount = Math.max(0, Number(n.childCount) || 0), this._el = null, this._body = null, this._toggleBtn = null, this._inputMap = /* @__PURE__ */ new Map(), this._autoFits = [], this._noteTextarea = null, this._subgraphHeaderTitle = "";
  }
  get el() {
    return this._el || (this._el = this._render()), this._el;
  }
  syncFromGraph() {
    var s, o, i, r, l, c, a;
    if (this._noteTextarea) {
      const d = ((s = this._el) == null ? void 0 : s.ownerDocument) || document;
      if ((d == null ? void 0 : d.activeElement) !== this._noteTextarea) {
        const u = de(this._node);
        this._noteTextarea.value !== u && (this._noteTextarea.value = u, (i = (o = this._noteTextarea)._mjrAutoFit) == null || i.call(o));
      }
      return;
    }
    if (!((r = this._node) != null && r.widgets)) return;
    const e = ((l = this._el) == null ? void 0 : l.ownerDocument) || document, n = (e == null ? void 0 : e.activeElement) || null;
    for (const d of this._node.widgets) {
      const u = this._inputMap.get(d.name), m = wn(u);
      if (!m) continue;
      if (m.type === "checkbox") {
        const f = !!d.value;
        m.checked !== f && (m.checked = f);
        continue;
      }
      const h = d.value != null ? String(d.value) : "";
      String(m.value ?? "") !== h && (n && m === n || (m.value = h, (c = u == null ? void 0 : u._mjrAutoFit) == null || c.call(u), (a = m == null ? void 0 : m._mjrAutoFit) == null || a.call(m)));
    }
  }
  dispose() {
    var e;
    (e = this._el) == null || e.remove(), this._el = null, this._autoFits = [], this._inputMap.clear();
  }
  setExpanded(e) {
    var n, s;
    this._expanded = !!e, this._applyExpandedState(), this._expanded && ((n = this._autoFits) != null && n.length) && requestAnimationFrame(() => {
      for (const o of this._autoFits) o();
    }), (s = this._onToggle) == null || s.call(this, this._expanded);
  }
  _render() {
    var m, h, f;
    const e = this._node, n = document.createElement("section");
    n.className = "mjr-ws-node", n.dataset.nodeId = String(e.id ?? ""), this._isSubgraph && (n.classList.add("mjr-ws-node--subgraph"), n.dataset.subgraph = "true", n.dataset.childCount = String(this._childCount)), this._depth > 0 && (n.dataset.depth = String(this._depth), n.classList.add("mjr-ws-node--nested"));
    const s = document.createElement("div");
    if (s.className = "mjr-ws-node-header", this._collapsible) {
      this._header = s;
      const p = document.createElement("button");
      p.type = "button", p.className = "mjr-icon-btn mjr-ws-node-toggle", p.title = this._expanded ? "Collapse node" : "Expand node", p.addEventListener("click", (_) => {
        _.stopPropagation(), this.setExpanded(!this._expanded);
      }), s.appendChild(p), this._toggleBtn = p, s.addEventListener("click", (_) => {
        _.target.closest("button") || this.setExpanded(!this._expanded);
      }), s.title = this._expanded ? "Collapse node" : "Expand node";
    }
    const o = document.createElement("div");
    o.className = "mjr-ws-node-title-wrap";
    const i = document.createElement("span");
    i.className = "mjr-ws-node-type";
    const r = Wn(e, { isSubgraph: this._isSubgraph });
    i.textContent = r, o.appendChild(i);
    const l = zn(e, r, {
      isSubgraph: this._isSubgraph
    });
    if (l) {
      const p = document.createElement("span");
      p.className = "mjr-ws-node-title", p.textContent = l, o.appendChild(p);
    }
    if (s.appendChild(o), this._isSubgraph) {
      const p = document.createElement("span");
      p.className = "mjr-ws-node-kind", p.title = `${this._childCount} inner node${this._childCount !== 1 ? "s" : ""}`;
      const _ = document.createElement("i");
      _.className = "pi pi-sitemap", _.setAttribute("aria-hidden", "true"), p.appendChild(_);
      const y = document.createElement("span");
      y.textContent = "Subgraph", p.appendChild(y);
      const g = document.createElement("span");
      g.className = "mjr-ws-node-kind-count", g.textContent = String(this._childCount), p.appendChild(g), s.appendChild(p), this._subgraphHeaderTitle = `${r} · Subgraph · ${this._childCount} inner node${this._childCount !== 1 ? "s" : ""}`, s.title = this._subgraphHeaderTitle;
    }
    const c = document.createElement("button");
    c.type = "button", c.className = "mjr-icon-btn mjr-ws-locate", c.title = "Locate on canvas", c.innerHTML = '<i class="pi pi-map-marker" aria-hidden="true"></i>', c.addEventListener("click", (p) => {
      p.stopPropagation(), this._locateNode();
    }), s.appendChild(c), n.appendChild(s);
    const a = document.createElement("div");
    if (a.className = "mjr-ws-node-body", Vn(e)) {
      const p = document.createElement("textarea");
      p.className = "mjr-ws-input mjr-ws-textarea mjr-ws-note-textarea", p.value = de(e), p.rows = 4;
      const _ = () => {
        p.style.height = "auto", p.style.height = p.scrollHeight + "px";
      };
      return p.addEventListener("input", () => {
        var b, A, C, S, M, x, j;
        Rn(e, p.value);
        const y = (b = e == null ? void 0 : e.widgets) == null ? void 0 : b[0], g = (y == null ? void 0 : y.inputEl) ?? (y == null ? void 0 : y.element) ?? (y == null ? void 0 : y.el) ?? null;
        g != null && "value" in g && g.value !== p.value && (g.value = p.value), _();
        try {
          const k = ut(), I = (k == null ? void 0 : k.canvas) ?? null;
          (A = I == null ? void 0 : I.setDirty) == null || A.call(I, !0, !0), (C = I == null ? void 0 : I.draw) == null || C.call(I, !0, !0);
          const O = (e == null ? void 0 : e.graph) ?? null;
          O && O !== (k == null ? void 0 : k.graph) && ((S = O.setDirtyCanvas) == null || S.call(O, !0, !0), (M = O.change) == null || M.call(O)), (j = (x = k == null ? void 0 : k.graph) == null ? void 0 : x.change) == null || j.call(x);
        } catch {
        }
      }), p._mjrAutoFit = _, this._noteTextarea = p, this._autoFits.push(_), a.appendChild(p), this._body = a, n.appendChild(a), this._el = n, this._applyExpandedState(), requestAnimationFrame(_), n;
    }
    const d = e.widgets ?? [];
    let u = !1;
    for (const p of d) {
      const _ = String(p.type || "").toLowerCase();
      if (On.has(_) || p.hidden || (m = p.options) != null && m.hidden) continue;
      u = !0;
      const y = _ === "text" || _ === "string" || _ === "customtext", g = document.createElement("div");
      g.className = y ? "mjr-ws-widget-row mjr-ws-widget-row--block" : "mjr-ws-widget-row";
      const b = document.createElement("label");
      b.className = "mjr-ws-widget-label", b.textContent = p.name || "";
      const A = document.createElement("div");
      A.className = "mjr-ws-widget-input";
      const C = In(p, () => {
      }, e);
      A.appendChild(C), this._inputMap.set(p.name, C);
      const S = C._mjrAutoFit ?? ((f = (h = C.querySelector) == null ? void 0 : h.call(C, "textarea")) == null ? void 0 : f._mjrAutoFit);
      S && this._autoFits.push(S), g.appendChild(b), g.appendChild(A), a.appendChild(g);
    }
    if (!u) {
      const p = document.createElement("div");
      p.className = "mjr-ws-node-empty", p.textContent = "No editable parameters", a.appendChild(p);
    }
    return this._body = a, n.appendChild(a), this._el = n, this._applyExpandedState(), n;
  }
  _applyExpandedState() {
    if (!(!this._el || !this._body)) {
      if (this._el.classList.toggle("is-collapsible", this._collapsible), this._el.classList.toggle("is-collapsed", this._collapsible && !this._expanded), this._toggleBtn) {
        const e = this._expanded ? "pi pi-chevron-down" : "pi pi-chevron-right";
        this._toggleBtn.textContent = "";
        const n = document.createElement("i");
        n.className = e, n.setAttribute("aria-hidden", "true"), this._toggleBtn.appendChild(n), this._toggleBtn.title = this._expanded ? "Collapse node" : "Expand node", this._toggleBtn.setAttribute("aria-expanded", String(this._expanded));
      }
      if (this._header) {
        const e = this._expanded ? "Collapse node" : "Expand node";
        this._header.title = this._subgraphHeaderTitle ? `${this._subgraphHeaderTitle} · ${e}` : e;
      }
    }
  }
  _locateNode() {
    var n, s, o, i, r, l, c, a;
    if (this._onLocate) {
      this._onLocate();
      return;
    }
    const e = this._node;
    if (e)
      try {
        const d = ut(), u = d == null ? void 0 : d.canvas;
        if (!u) return;
        if (typeof u.centerOnNode == "function")
          u.centerOnNode(e);
        else if (u.ds && e.pos) {
          const m = ((n = u.canvas) == null ? void 0 : n.width) || ((s = u.element) == null ? void 0 : s.width) || 800, h = ((o = u.canvas) == null ? void 0 : o.height) || ((i = u.element) == null ? void 0 : i.height) || 600;
          u.ds.offset[0] = -e.pos[0] - (((r = e.size) == null ? void 0 : r[0]) || 0) / 2 + m / 2, u.ds.offset[1] = -e.pos[1] - (((l = e.size) == null ? void 0 : l[1]) || 0) / 2 + h / 2, (c = u.setDirty) == null || c.call(u, !0, !0);
        }
      } catch (d) {
        (a = console.debug) == null || a.call(console, "[MFV sidebar] locateNode error", d);
      }
  }
}
function wn(t) {
  var e, n, s;
  return t ? (n = (e = t.classList) == null ? void 0 : e.contains) != null && n.call(e, "mjr-ws-text-wrapper") ? ((s = t.querySelector) == null ? void 0 : s.call(t, "textarea")) ?? t : t : null;
}
const Wt = () => ht();
class Qn {
  constructor() {
    this._searchQuery = "", this._expandedNodeIds = /* @__PURE__ */ new Set(), this._expandedChildrenIds = /* @__PURE__ */ new Set(), this._renderers = [], this._el = this._build(), this._lastNodeSig = "", this._lastSelectedId = "";
  }
  get el() {
    return this._el;
  }
  refresh() {
    this._maybeRebuildList();
    for (const e of this._renderers) e.syncFromGraph();
  }
  forceRebuild() {
    this._lastNodeSig = "", this._maybeRebuildList();
  }
  dispose() {
    var e, n;
    for (const s of this._renderers) s.dispose();
    this._renderers = [], (n = (e = this._el) == null ? void 0 : e.remove) == null || n.call(e);
  }
  _build() {
    const e = document.createElement("div");
    e.className = "mjr-ws-nodes-tab";
    const n = document.createElement("div");
    n.className = "mjr-ws-search-wrap";
    const s = document.createElement("i");
    s.className = "pi pi-search mjr-ws-search-icon", s.setAttribute("aria-hidden", "true"), n.appendChild(s), this._searchInput = document.createElement("input"), this._searchInput.type = "text", this._searchInput.className = "mjr-ws-search", this._searchInput.placeholder = "Search nodes...", this._searchInput.addEventListener("input", () => {
      this._searchQuery = this._searchInput.value, this.forceRebuild();
    }), n.appendChild(this._searchInput);
    const o = document.createElement("button");
    return o.type = "button", o.className = "mjr-ws-search-clear", o.title = "Clear search", o.innerHTML = '<i class="pi pi-times" aria-hidden="true"></i>', o.addEventListener("click", () => {
      this._searchInput.value = "", this._searchQuery = "", this.forceRebuild();
    }), n.appendChild(o), e.appendChild(n), this._list = document.createElement("div"), this._list.className = "mjr-ws-nodes-list", e.appendChild(this._list), e;
  }
  _syncCanvasSelection() {
    var o, i, r, l, c;
    const n = Jn()[0] || "";
    let s = null;
    for (const a of this._renderers) {
      const d = String(((o = a._node) == null ? void 0 : o.id) ?? "") === n;
      (r = (i = a.el) == null ? void 0 : i.classList) == null || r.toggle("is-selected-from-graph", d), d && (s = a);
    }
    if (!n) {
      this._lastSelectedId = "";
      return;
    }
    if (n !== this._lastSelectedId && (this._lastSelectedId = n, !!s)) {
      s._expanded || s.setExpanded(!0);
      try {
        const a = s._mjrTreeItemEl || s.el;
        this._openTreeBranch(a);
        const d = a == null ? void 0 : a.parentElement;
        d && d.firstElementChild !== a && d.insertBefore(a, d.firstElementChild), (l = s.el) == null || l.scrollIntoView({ block: "start", inline: "nearest" });
      } catch (a) {
        (c = console.debug) == null || c.call(console, "[MFV] promote selected node failed", a);
      }
    }
  }
  _maybeRebuildList() {
    const e = Fe(Xn()), n = (this._searchQuery || "").toLowerCase().trim(), s = n ? Oe(e, n) : e, o = Kn(s);
    if (o === this._lastNodeSig) {
      this._syncCanvasSelection();
      return;
    }
    this._lastNodeSig = o;
    for (const i of this._renderers) i.dispose();
    if (this._renderers = [], this._list.innerHTML = "", !s.length) {
      const i = document.createElement("div");
      i.className = "mjr-ws-sidebar-empty", i.textContent = e.length ? "No nodes match your search" : "No nodes in workflow", this._list.appendChild(i);
      return;
    }
    this._renderItems(s, this._list, 0, null), this._syncCanvasSelection();
  }
  /**
   * Recursively render tree items into a container.
   * @param {{node: object, children: object[]}[]} items
   * @param {HTMLElement} container
   * @param {number} depth
   */
  _renderItems(e, n, s, o) {
    for (const { node: i, children: r } of e) {
      const l = String((i == null ? void 0 : i.id) ?? ""), c = r.length, a = document.createElement("div");
      a.className = "mjr-ws-tree-item", a.dataset.nodeId = l, a._mjrNodeId = l, a._mjrParentTreeItem = o || null, c > 0 && a.classList.add("mjr-ws-tree-item--subgraph"), s > 0 && a.classList.add("mjr-ws-tree-item--nested");
      const d = new Yn(i, {
        collapsible: !0,
        expanded: this._expandedNodeIds.has(l),
        depth: s,
        isSubgraph: c > 0,
        childCount: c,
        onLocate: () => Zn(i),
        onToggle: (u) => {
          if (u) {
            this._expandedNodeIds = /* @__PURE__ */ new Set([l]);
            for (const m of this._renderers)
              m !== d && m.setExpanded(!1);
          } else
            this._expandedNodeIds.delete(l);
        }
      });
      if (d._mjrTreeItemEl = a, this._renderers.push(d), a.appendChild(d.el), c > 0) {
        const u = this._expandedChildrenIds.has(l), m = document.createElement("button");
        m.type = "button", m.className = "mjr-ws-children-toggle", s > 0 && m.classList.add("mjr-ws-children-toggle--nested"), ue(m, c, u);
        const h = document.createElement("div");
        h.className = "mjr-ws-children", h.hidden = !u, a._mjrChildrenToggle = m, a._mjrChildrenEl = h, a._mjrChildCount = c, this._renderItems(r, h, s + 1, a), m.addEventListener("click", () => {
          this._setTreeItemChildrenOpen(a, h.hidden);
        }), a.appendChild(m), a.appendChild(h);
      }
      n.appendChild(a);
    }
  }
  _setTreeItemChildrenOpen(e, n) {
    if (!(e != null && e._mjrChildrenEl) || !(e != null && e._mjrChildrenToggle)) return;
    const s = String(e._mjrNodeId || "");
    e._mjrChildrenEl.hidden = !n, s && (n ? this._expandedChildrenIds.add(s) : this._expandedChildrenIds.delete(s)), ue(
      e._mjrChildrenToggle,
      Number(e._mjrChildCount) || 0,
      n
    );
  }
  _openTreeBranch(e) {
    let n = e || null;
    for (; n; ) {
      const s = n._mjrParentTreeItem || null;
      s && this._setTreeItemChildrenOpen(s, !0), n = s;
    }
    this._setTreeItemChildrenOpen(e, !0);
  }
}
function Xn() {
  var t;
  try {
    const e = Wt();
    return (e == null ? void 0 : e.graph) ?? ((t = e == null ? void 0 : e.canvas) == null ? void 0 : t.graph) ?? null;
  } catch {
    return null;
  }
}
function qn(t) {
  var n, s, o, i, r;
  const e = [
    t == null ? void 0 : t.subgraph,
    t == null ? void 0 : t._subgraph,
    (n = t == null ? void 0 : t.subgraph) == null ? void 0 : n.graph,
    (s = t == null ? void 0 : t.subgraph) == null ? void 0 : s.lgraph,
    (o = t == null ? void 0 : t.properties) == null ? void 0 : o.subgraph,
    t == null ? void 0 : t.subgraph_instance,
    (i = t == null ? void 0 : t.subgraph_instance) == null ? void 0 : i.graph,
    t == null ? void 0 : t.inner_graph,
    t == null ? void 0 : t.subgraph_graph
  ].filter((l) => l && typeof l == "object" && ve(l).length > 0);
  return Array.isArray(t == null ? void 0 : t.nodes) && t.nodes.length > 0 && t.nodes !== ((r = t == null ? void 0 : t.graph) == null ? void 0 : r.nodes) && e.push({ nodes: t.nodes }), e;
}
function Fe(t, e = /* @__PURE__ */ new Set()) {
  if (!t || e.has(t)) return [];
  e.add(t);
  const n = ve(t), s = [];
  for (const o of n) {
    if (!o) continue;
    const r = qn(o).flatMap((l) => Fe(l, e));
    s.push({ node: o, children: r });
  }
  return s;
}
function ve(t) {
  if (!t || typeof t != "object") return [];
  if (Array.isArray(t.nodes)) return t.nodes.filter(Boolean);
  if (Array.isArray(t._nodes)) return t._nodes.filter(Boolean);
  const e = t._nodes_by_id ?? t.nodes_by_id ?? null;
  return e instanceof Map ? Array.from(e.values()).filter(Boolean) : e && typeof e == "object" ? Object.values(e).filter(Boolean) : [];
}
function Oe(t, e) {
  const n = [];
  for (const { node: s, children: o } of t) {
    const i = (s.type || "").toLowerCase().includes(e) || (s.title || "").toLowerCase().includes(e), r = Oe(o, e);
    (i || r.length > 0) && n.push({ node: s, children: r });
  }
  return n;
}
function Kn(t) {
  const e = [];
  function n(s) {
    for (const { node: o, children: i } of s)
      e.push(o.id), e.push("["), n(i), e.push("]");
  }
  return n(t), e.join(",");
}
function ue(t, e, n) {
  const s = n ? "pi-chevron-down" : "pi-chevron-right";
  t.textContent = "";
  const o = document.createElement("i");
  o.className = `pi ${s}`, o.setAttribute("aria-hidden", "true"), t.appendChild(o);
  const i = document.createElement("span");
  i.textContent = `${e} inner node${e !== 1 ? "s" : ""}`, t.appendChild(i), t.setAttribute("aria-expanded", String(n));
}
function Zn(t) {
  var e, n, s, o, i, r, l;
  try {
    const c = Wt(), a = c == null ? void 0 : c.canvas;
    if (!a) return;
    if ((e = a.selectNode) == null || e.call(a, t, !1), typeof a.centerOnNode == "function")
      a.centerOnNode(t);
    else if (t.pos && a.ds) {
      const d = a.canvas, u = (d == null ? void 0 : d.width) ?? 800, m = (d == null ? void 0 : d.height) ?? 600, h = a.ds.scale ?? 1;
      a.ds.offset = [
        -t.pos[0] + u / (2 * h) - (((n = t.size) == null ? void 0 : n[0]) ?? 100) / 2,
        -t.pos[1] + m / (2 * h) - (((s = t.size) == null ? void 0 : s[1]) ?? 80) / 2
      ], (o = a.setDirty) == null || o.call(a, !0, !0);
    }
    (r = (i = a.canvas) == null ? void 0 : i.focus) == null || r.call(i);
  } catch (c) {
    (l = console.debug) == null || l.call(console, "[MFV] _focusNode", c);
  }
}
function Jn() {
  var t, e, n;
  try {
    const s = Wt(), o = ((t = s == null ? void 0 : s.canvas) == null ? void 0 : t.selected_nodes) ?? ((e = s == null ? void 0 : s.canvas) == null ? void 0 : e.selectedNodes) ?? null;
    if (!o) return [];
    if (Array.isArray(o))
      return o.map((i) => String((i == null ? void 0 : i.id) ?? "")).filter(Boolean);
    if (o instanceof Map)
      return Array.from(o.values()).map((i) => String((i == null ? void 0 : i.id) ?? "")).filter(Boolean);
    if (typeof o == "object")
      return Object.values(o).map((i) => String((i == null ? void 0 : i.id) ?? "")).filter(Boolean);
  } catch (s) {
    (n = console.debug) == null || n.call(console, "[MFV] _getSelectedNodeIds", s);
  }
  return [];
}
const Vt = /* @__PURE__ */ new Map();
let Ot = null;
async function $n(t) {
  const e = Array.from(
    new Set(
      zt(t).map((s) => it(s)).filter(Boolean)
    )
  );
  if (!(!e.length || !e.filter((s) => !Vt.has(s)).length))
    try {
      Ot || (Ot = fetch("/object_info").then((s) => s != null && s.ok ? s.json() : null).then((s) => {
        if (s && typeof s == "object")
          for (const [o, i] of Object.entries(s))
            Vt.set(String(o), i);
        return s;
      }).catch(() => null)), await Ot;
    } catch {
    }
}
function ts(t) {
  const e = ds(t);
  for (const n of e) {
    const s = Rt(n), o = us(s);
    if (o)
      return He(o), o;
  }
  return null;
}
function zt(t) {
  const e = Array.isArray(t == null ? void 0 : t.nodes) ? t.nodes.filter(Boolean) : [], n = [...e], s = pt(t);
  for (const o of e) {
    const i = Nt(t, o, s);
    i && n.push(...zt(i));
  }
  return n;
}
function Et(t, e) {
  const n = String(e ?? "");
  if (!n) return null;
  if (n.includes("::")) {
    const [o, ...i] = n.split("::"), r = i.join("::"), l = Et(t, o), c = l ? Nt(t, l, pt(t)) : null;
    return c ? Et(c, r) : null;
  }
  const s = (Array.isArray(t == null ? void 0 : t.nodes) ? t.nodes : []).find(
    (o) => String((o == null ? void 0 : o.id) ?? (o == null ? void 0 : o.ID) ?? "") === n
  ) || null;
  if (s) return s;
  for (const o of Array.isArray(t == null ? void 0 : t.nodes) ? t.nodes : []) {
    const i = Nt(t, o, pt(t)), r = i ? Et(i, n) : null;
    if (r) return r;
  }
  return null;
}
function Ge(t) {
  return $e(t);
}
function it(t) {
  return en(t);
}
function es(t) {
  return tn(t);
}
function ns(t) {
  const e = [], n = t != null && t.properties && typeof t.properties == "object" ? t.properties : null, s = t != null && t.inputs && typeof t.inputs == "object" ? t.inputs : null;
  if (s && !Array.isArray(s))
    for (const [o, i] of Object.entries(s))
      Array.isArray(i) || i != null && typeof i == "object" || e.push([o, i]);
  for (const { label: o, value: i } of Ve(t))
    e.some(([r]) => String(r) === String(o)) || e.push([o, i]);
  if (n)
    for (const [o, i] of Object.entries(n))
      i == null || typeof i == "object" || e.push([o, i]);
  return e.slice(0, 80);
}
function Ve(t) {
  const e = t == null ? void 0 : t.widgets_values;
  if (e && typeof e == "object" && !Array.isArray(e))
    return Object.entries(e).map(([l, c], a) => ({ label: l, value: c, index: a }));
  const n = Array.isArray(e) ? e : [], s = Array.isArray(t == null ? void 0 : t.widgets) ? t.widgets : [], o = os(t), i = is(o), r = ss(t);
  return n.map((l, c) => {
    var d, u;
    return { label: ((d = s[c]) == null ? void 0 : d.name) || ((u = s[c]) == null ? void 0 : u.label) || r[c] || i[c] || cs(t, c, l) || `param ${c + 1}`, value: l, index: c };
  });
}
function ss(t) {
  const e = Array.isArray(t == null ? void 0 : t.inputs) ? t.inputs : [], n = e.filter(rs), s = e.filter(
    (i) => !as(i) && Re(i == null ? void 0 : i.type)
  );
  return (n.length ? n : s.length ? s : e).map(
    (i) => {
      var r, l;
      return String(
        (i == null ? void 0 : i.label) || (i == null ? void 0 : i.localized_name) || (i == null ? void 0 : i.name) || ((r = i == null ? void 0 : i.widget) == null ? void 0 : r.name) || ((l = i == null ? void 0 : i.widget) == null ? void 0 : l.label) || ""
      ).trim();
    }
  );
}
function os(t) {
  const e = it(t);
  return e && Vt.get(e) || null;
}
function pe(t) {
  const e = t == null ? void 0 : t.input_order;
  if (e && typeof e == "object")
    return [
      ...Array.isArray(e.required) ? e.required : [],
      ...Array.isArray(e.optional) ? e.optional : []
    ].filter(Boolean);
  const n = t == null ? void 0 : t.input;
  return n && typeof n == "object" ? ["required", "optional"].flatMap(
    (s) => n[s] && typeof n[s] == "object" ? Object.keys(n[s]) : []
  ).filter(Boolean) : [];
}
function is(t) {
  const e = t == null ? void 0 : t.input;
  if (!e || typeof e != "object") return pe(t);
  const n = [];
  for (const s of ["required", "optional"]) {
    const o = e[s];
    if (!(!o || typeof o != "object"))
      for (const [i, r] of Object.entries(o))
        ls(r) && n.push(i);
  }
  return n.length ? n : pe(t);
}
function rs(t) {
  return !t || typeof t != "object" ? !1 : !!(t.widget === !0 || t.widget && typeof t.widget == "object" || typeof t.widget == "string" && t.widget.trim());
}
function as(t) {
  return !t || typeof t != "object" ? !1 : !!(t.link != null || Array.isArray(t.links) && t.links.length);
}
function ls(t) {
  const e = Array.isArray(t) ? t : [], n = e[0], s = e[1] && typeof e[1] == "object" && !Array.isArray(e[1]) ? e[1] : null;
  return (s == null ? void 0 : s.forceInput) === !0 || (s == null ? void 0 : s.rawLink) === !0 ? !1 : s != null && s.widgetType && String(s.widgetType).trim() ? !0 : Re(n);
}
function Re(t) {
  if (Array.isArray(t)) return !0;
  const e = String(t || "").trim().toUpperCase();
  return e ? e === "INT" || e === "FLOAT" || e === "STRING" || e === "BOOLEAN" || e === "BOOL" || e === "COMBO" || e === "ENUM" : !1;
}
function cs(t, e, n) {
  const s = it(t), o = Ge(t), i = `${s} ${o}`.toLowerCase(), r = String(n ?? "").toLowerCase();
  if (i.includes("cliptext") || i.includes("prompt")) return e === 0 ? "text" : null;
  if (r.includes(".safetensors") || r.includes(".ckpt")) return "model";
  if (typeof n == "number") {
    if (i.includes("sampler") && e === 0) return "seed";
    if (i.includes("sampler") && e === 1) return "steps";
    if (i.includes("latent") && e === 0) return "width";
    if (i.includes("latent") && e === 1) return "height";
  }
  return null;
}
function ds(t) {
  const e = Rt(t == null ? void 0 : t.metadata_raw), n = Rt(t == null ? void 0 : t.metadata);
  return [
    t == null ? void 0 : t.workflow,
    t == null ? void 0 : t.Workflow,
    t == null ? void 0 : t.comfy_workflow,
    e == null ? void 0 : e.workflow,
    e == null ? void 0 : e.Workflow,
    e == null ? void 0 : e.comfy_workflow,
    e == null ? void 0 : e.comfyui,
    e == null ? void 0 : e.ComfyUI,
    n == null ? void 0 : n.workflow,
    n == null ? void 0 : n.Workflow,
    n == null ? void 0 : n.comfy_workflow,
    t == null ? void 0 : t.prompt,
    e == null ? void 0 : e.prompt,
    e == null ? void 0 : e.Prompt,
    n == null ? void 0 : n.prompt,
    n == null ? void 0 : n.Prompt
  ].filter((s) => s != null);
}
function Rt(t) {
  if (!t) return null;
  if (typeof t == "object") return t;
  if (typeof t != "string") return null;
  const e = t.trim();
  if (!e || !/^[{[]/.test(e)) return null;
  try {
    return JSON.parse(e);
  } catch {
    return null;
  }
}
function us(t) {
  if (!t || typeof t != "object") return null;
  if (Array.isArray(t.nodes)) return t;
  if (t.workflow && typeof t.workflow == "object" && Array.isArray(t.workflow.nodes))
    return t.workflow;
  if (t.prompt && typeof t.prompt == "object")
    return re(t.prompt);
  const e = re(t);
  return e && Array.isArray(e.nodes) ? e : null;
}
function He(t, e = /* @__PURE__ */ new WeakSet()) {
  if (!t || typeof t != "object" || e.has(t)) return;
  e.add(t);
  const n = pt(t);
  for (const s of Array.isArray(t == null ? void 0 : t.nodes) ? t.nodes : []) {
    ps(s, n);
    const o = Nt(t, s, n);
    o && He(o, e);
  }
}
function ps(t, e) {
  var r, l;
  if (!t || typeof t != "object") return;
  const n = it(t);
  if (!n) return;
  const s = e.get(String(n)), o = String(
    (s == null ? void 0 : s.name) || (s == null ? void 0 : s.title) || ((r = t == null ? void 0 : t.subgraph) == null ? void 0 : r.name) || ((l = t == null ? void 0 : t.subgraph_instance) == null ? void 0 : l.name) || ""
  ).trim();
  if (!o) return;
  const i = t != null && t.properties && typeof t.properties == "object" ? t.properties : t.properties = {};
  String(i.subgraph_name || "").trim() || (i.subgraph_name = o), String(i.subgraph_id || "").trim() || (i.subgraph_id = n);
}
function pt(t) {
  var s;
  const e = Array.isArray((s = t == null ? void 0 : t.definitions) == null ? void 0 : s.subgraphs) && t.definitions.subgraphs || Array.isArray(t == null ? void 0 : t.subgraphs) && t.subgraphs || [], n = /* @__PURE__ */ new Map();
  for (const o of e) {
    const i = (o == null ? void 0 : o.id) ?? (o == null ? void 0 : o.name) ?? null;
    i != null && n.set(String(i), o);
  }
  return n;
}
function Nt(t, e, n = pt(t)) {
  var o, i, r, l;
  const s = [
    e == null ? void 0 : e.subgraph,
    e == null ? void 0 : e._subgraph,
    (o = e == null ? void 0 : e.subgraph) == null ? void 0 : o.graph,
    (i = e == null ? void 0 : e.subgraph) == null ? void 0 : i.lgraph,
    (r = e == null ? void 0 : e.properties) == null ? void 0 : r.subgraph,
    e == null ? void 0 : e.subgraph_instance,
    (l = e == null ? void 0 : e.subgraph_instance) == null ? void 0 : l.graph,
    e == null ? void 0 : e.inner_graph,
    e == null ? void 0 : e.subgraph_graph,
    n.get(String((e == null ? void 0 : e.type) ?? ""))
  ];
  for (const c of s)
    if (c && typeof c == "object" && Array.isArray(c.nodes)) return c;
  return Array.isArray(e == null ? void 0 : e.nodes) ? { nodes: e.nodes } : null;
}
async function ms(t) {
  if (!t) return !1;
  const e = JSON.stringify(t, null, 2);
  return Me(e);
}
async function hs(t) {
  return Me(fs(t));
}
function fs(t) {
  if (t == null) return "";
  if (typeof t == "string") return t;
  if (typeof t == "number" || typeof t == "boolean") return String(t);
  try {
    return JSON.stringify(t, null, 2);
  } catch {
    return String(t);
  }
}
function _s(t) {
  var n, s, o, i, r, l, c;
  const e = ht();
  return !t || typeof t != "object" ? !1 : typeof (e == null ? void 0 : e.loadGraphData) == "function" ? (e.loadGraphData(t), !0) : typeof ((s = (n = e == null ? void 0 : e.canvas) == null ? void 0 : n.graph) == null ? void 0 : s.configure) == "function" ? (e.canvas.graph.configure(t), (i = (o = e.canvas.graph).setDirtyCanvas) == null || i.call(o, !0, !0), !0) : typeof ((r = e == null ? void 0 : e.graph) == null ? void 0 : r.configure) == "function" ? (e.graph.configure(t), (c = (l = e.graph).setDirtyCanvas) == null || c.call(l, !0, !0), !0) : !1;
}
function gs(t) {
  var r, l, c, a, d, u, m;
  const e = ht(), n = (e == null ? void 0 : e.graph) ?? ((r = e == null ? void 0 : e.canvas) == null ? void 0 : r.graph) ?? null;
  if (!t || !n || typeof n.add != "function") return !1;
  const s = String((t == null ? void 0 : t.type) || (t == null ? void 0 : t.class_type) || (t == null ? void 0 : t.comfyClass) || "").trim(), o = (globalThis == null ? void 0 : globalThis.LiteGraph) || ((l = globalThis == null ? void 0 : globalThis.window) == null ? void 0 : l.LiteGraph) || null;
  let i = null;
  try {
    o && typeof o.createNode == "function" && s && (i = o.createNode(s));
  } catch (h) {
    (c = console.debug) == null || c.call(console, "[MFV Graph Map] createNode failed", h);
  }
  if (!i) return !1;
  try {
    const h = typeof structuredClone == "function" ? structuredClone(t) : JSON.parse(JSON.stringify(t));
    return delete h.id, Array.isArray(h.pos) && (h.pos = [Number(h.pos[0] || 0) + 32, Number(h.pos[1] || 0) + 32]), typeof i.configure == "function" ? i.configure(h) : Object.assign(i, h), n.add(i), (a = n.setDirtyCanvas) == null || a.call(n, !0, !0), (u = (d = e == null ? void 0 : e.canvas) == null ? void 0 : d.setDirty) == null || u.call(d, !0, !0), !0;
  } catch (h) {
    return (m = console.debug) == null || m.call(console, "[MFV Graph Map] import node failed", h), !1;
  }
}
function bs(t) {
  var u, m, h, f, p, _, y, g;
  const e = ht(), n = ys(e);
  if (!t || !n) return { ok: !1, count: 0, reason: "no-target" };
  const s = Ve(t), o = Array.isArray(n.widgets) ? n.widgets : [];
  if (!s.length || !o.length)
    return { ok: !1, count: 0, reason: "no-widgets" };
  const i = /* @__PURE__ */ new Map();
  o.forEach((b, A) => {
    for (const C of Cs(b))
      i.has(C) || i.set(C, { widget: b, index: A });
  });
  const r = me(it(t)), l = me((n == null ? void 0 : n.type) || (n == null ? void 0 : n.comfyClass) || (n == null ? void 0 : n.class_type)), c = !!(r && l && r === l), a = /* @__PURE__ */ new Set();
  let d = 0;
  for (const b of s) {
    const A = De(b.label);
    let C = A ? i.get(A) : null;
    if ((!C || a.has(C.index)) && c) {
      const S = o[b.index];
      S && (C = { widget: S, index: b.index });
    }
    !C || a.has(C.index) || tt(C.widget, As(b.value), n) && (a.add(C.index), d += 1);
  }
  return (m = (u = e == null ? void 0 : e.canvas) == null ? void 0 : u.setDirty) == null || m.call(u, !0, !0), (f = (h = e == null ? void 0 : e.canvas) == null ? void 0 : h.draw) == null || f.call(h, !0, !0), (_ = (p = e == null ? void 0 : e.graph) == null ? void 0 : p.setDirtyCanvas) == null || _.call(p, !0, !0), (g = (y = e == null ? void 0 : e.graph) == null ? void 0 : y.change) == null || g.call(y), {
    ok: d > 0,
    count: d,
    reason: d > 0 ? "ok" : "no-match",
    targetNode: n
  };
}
function ys(t = ht()) {
  var n, s;
  const e = ((n = t == null ? void 0 : t.canvas) == null ? void 0 : n.selected_nodes) ?? ((s = t == null ? void 0 : t.canvas) == null ? void 0 : s.selectedNodes) ?? null;
  return e ? Array.isArray(e) ? e.filter(Boolean)[0] || null : e instanceof Map ? Array.from(e.values()).filter(Boolean)[0] || null : typeof e == "object" && Object.values(e).filter(Boolean)[0] || null : null;
}
function Cs(t) {
  var e, n;
  return [t == null ? void 0 : t.name, t == null ? void 0 : t.label, (e = t == null ? void 0 : t.options) == null ? void 0 : e.name, (n = t == null ? void 0 : t.options) == null ? void 0 : n.label].map(De).filter(Boolean);
}
function De(t) {
  return String(t ?? "").trim().toLowerCase().replace(/\s+/g, "_");
}
function me(t) {
  return String(t ?? "").trim().toLowerCase();
}
function As(t) {
  if (t == null || typeof t != "object") return t;
  try {
    return typeof structuredClone == "function" ? structuredClone(t) : JSON.parse(JSON.stringify(t));
  } catch {
    return t;
  }
}
class Ue {
  constructor({ large: e = !1 } = {}) {
    this._asset = null, this._workflow = null, this._selectedNodeId = "", this._renderInfo = null, this._resizeObserver = null, this._large = !!e, this._view = { zoom: 1, centerX: null, centerY: null }, this._drag = null, this._previewMedia = null, this._previewKey = "", this._el = this._build();
  }
  get el() {
    return this._el;
  }
  setAsset(e) {
    this._asset !== e && (this._asset = e || null, this._workflow = ts(this._asset), this._selectedNodeId = "", this._view = { zoom: 1, centerX: null, centerY: null }, this.refresh(), $n(this._workflow).then(() => this.refresh()).catch(() => {
    }));
  }
  refresh() {
    var e;
    (e = this._el) != null && e.isConnected && (this._renderCanvas(), this._renderDetails());
  }
  dispose() {
    var e, n, s, o;
    this._disposePreviewMedia(), (n = (e = this._resizeObserver) == null ? void 0 : e.disconnect) == null || n.call(e), this._resizeObserver = null, (o = (s = this._el) == null ? void 0 : s.remove) == null || o.call(s);
  }
  _build() {
    var s, o, i, r, l, c;
    const e = document.createElement("div");
    e.className = "mjr-wgm", this._large && (e.className += " mjr-wgm--large");
    const n = document.createElement("div");
    return n.className = "mjr-wgm-map-wrap", this._large ? (this._canvas = document.createElement("canvas"), this._canvas.className = "mjr-wgm-canvas", (o = (s = this._canvas).addEventListener) == null || o.call(s, "click", (a) => this._handleCanvasClick(a)), (r = (i = this._canvas).addEventListener) == null || r.call(i, "wheel", (a) => this._handleWheel(a), {
      passive: !1
    }), (c = (l = this._canvas).addEventListener) == null || c.call(l, "pointerdown", (a) => this._handlePointerDown(a)), n.appendChild(this._canvas)) : (this._preview = document.createElement("div"), this._preview.className = "mjr-wgm-preview", n.appendChild(this._preview)), e.appendChild(n), this._status = document.createElement("div"), this._status.className = "mjr-wgm-status", e.appendChild(this._status), this._details = document.createElement("div"), this._details.className = "mjr-wgm-details", e.appendChild(this._details), typeof ResizeObserver == "function" && (this._resizeObserver = new ResizeObserver(() => this.refresh()), this._resizeObserver.observe(n)), e;
  }
  _renderCanvas() {
    var a, d, u;
    if (!this._large) {
      this._renderPreview();
      return;
    }
    const e = this._canvas;
    if (!e) return;
    const n = e.getBoundingClientRect(), s = Math.max(1, Math.floor(n.width || e.clientWidth || 1)), o = Math.max(1, Math.floor(n.height || e.clientHeight || 1)), i = Math.max(1, Math.min(2, Number(window.devicePixelRatio) || 1)), r = Math.floor(s * i), l = Math.floor(o * i);
    (e.width !== r || e.height !== l) && (e.width = r, e.height = l);
    const c = (a = e.getContext) == null ? void 0 : a.call(e, "2d");
    if (c && c.setTransform(i, 0, 0, i, 0, 0), !this._workflow) {
      (d = c == null ? void 0 : c.clearRect) == null || d.call(c, 0, 0, s, o), this._renderInfo = null;
      return;
    }
    this._renderInfo = nn(e, this._workflow, {
      showNodeLabels: !0,
      showViewport: !1,
      view: {
        hoveredNodeId: this._selectedNodeId || null,
        zoom: this._view.zoom,
        centerX: this._view.centerX,
        centerY: this._view.centerY
      }
    }), (u = this._renderInfo) != null && u.resolvedView && (this._view.centerX = this._renderInfo.resolvedView.centerX, this._view.centerY = this._renderInfo.resolvedView.centerY, this._view.zoom = this._renderInfo.resolvedView.zoom);
  }
  _renderDetails() {
    const e = zt(this._workflow).length;
    if (!this._workflow) {
      this._status.textContent = this._large ? "No workflow graph in selected image" : "Selected asset - no workflow graph", dt(this._details);
      return;
    }
    this._status.textContent = this._large ? this._selectedNodeId ? `${e} nodes - selected #${this._selectedNodeId}` : `${e} nodes - select a node` : `${e} nodes - graph opened in viewer`;
    const n = Et(this._workflow, this._selectedNodeId);
    if (!n) {
      const l = document.createElement("div");
      l.className = "mjr-ws-sidebar-empty", l.textContent = this._large ? "Click a node in the graph map" : "Use the large Graph Map in the viewer to select nodes", dt(this._details, l);
      return;
    }
    const s = document.createElement("div");
    s.className = "mjr-wgm-node-title", s.textContent = Ge(n);
    const o = document.createElement("div");
    o.className = "mjr-wgm-node-meta", o.textContent = `#${this._selectedNodeId} ${es(n) || it(n) || "Node"}`;
    const i = document.createElement("div");
    i.className = "mjr-wgm-actions", i.appendChild(this._makeAction("Copy node", "pi pi-copy", () => ms(n))), i.appendChild(
      this._makeAction("Import node", "pi pi-plus-circle", () => gs(n))
    ), i.appendChild(
      this._makeAction(
        "Import workflow",
        "pi pi-download",
        () => _s(this._workflow)
      )
    ), i.appendChild(
      this._makeAction("Transfer params to selected canvas node", "pi pi-arrow-right-arrow-left", () => {
        const l = bs(n);
        return l == null ? void 0 : l.ok;
      })
    );
    const r = document.createElement("div");
    r.className = "mjr-wgm-params";
    for (const [l, c] of ns(n)) {
      const a = document.createElement("div");
      a.className = "mjr-wgm-param", a.tabIndex = 0, a.role = "button", a.title = `Copy ${String(l)}`;
      const d = document.createElement("span");
      d.className = "mjr-wgm-param-key", d.textContent = String(l);
      const u = document.createElement("span");
      u.className = "mjr-wgm-param-value", u.textContent = Ss(c), a.appendChild(d), a.appendChild(u), a.addEventListener("click", () => this._copyParam(a, c)), a.addEventListener("keydown", (m) => {
        var h;
        m.key !== "Enter" && m.key !== " " || ((h = m.preventDefault) == null || h.call(m), this._copyParam(a, c));
      }), r.appendChild(a);
    }
    if (!r.childElementCount) {
      const l = document.createElement("div");
      l.className = "mjr-ws-node-empty", l.textContent = "No simple parameters found", r.appendChild(l);
    }
    dt(this._details, s, o, i, r);
  }
  _makeAction(e, n, s) {
    const o = document.createElement("button");
    return o.type = "button", o.className = "mjr-wgm-action", o.title = e, o.innerHTML = `<i class="${n}" aria-hidden="true"></i><span>${e}</span>`, o.addEventListener("click", async () => {
      var i;
      try {
        const r = await s();
        o.classList.toggle("is-ok", !!r), window.setTimeout(() => o.classList.remove("is-ok"), 700);
      } catch (r) {
        (i = console.debug) == null || i.call(console, "[MFV Graph Map] action failed", r);
      }
    }), o;
  }
  async _copyParam(e, n) {
    var s;
    try {
      const o = await hs(n);
      e.classList.toggle("is-ok", !!o), e.classList.toggle("is-error", !o), window.setTimeout(() => {
        e.classList.remove("is-ok"), e.classList.remove("is-error");
      }, 750);
    } catch (o) {
      e.classList.add("is-error"), window.setTimeout(() => e.classList.remove("is-error"), 750), (s = console.debug) == null || s.call(console, "[MFV Graph Map] param copy failed", o);
    }
  }
  _renderPreview() {
    var i, r;
    if (!this._preview) return;
    const e = Es(this._asset), n = Ms(e);
    if (this._previewMedia && n && n === this._previewKey) {
      (this._preview.firstChild !== this._previewMedia || this._preview.childNodes.length !== 1) && dt(this._preview, this._previewMedia);
      return;
    }
    this._disposePreviewMedia();
    const s = $(e, { fill: !0 });
    if (s) {
      (r = (i = s.classList) == null ? void 0 : i.add) == null || r.call(i, "mjr-wgm-preview-media"), this._previewMedia = s, this._previewKey = n, this._preview.appendChild(s);
      return;
    }
    const o = document.createElement("div");
    o.className = "mjr-wgm-preview-empty", o.textContent = "No preview", dt(this._preview, o);
  }
  _disposePreviewMedia() {
    var n, s, o, i, r, l, c;
    const e = this._previewMedia;
    if (this._previewMedia = null, this._previewKey = "", !!e) {
      try {
        (s = (n = e._mjrMediaControlsHandle) == null ? void 0 : n.destroy) == null || s.call(n);
      } catch (a) {
        (o = console.debug) == null || o.call(console, "[MFV Graph Map] preview cleanup failed", a);
      }
      try {
        const a = ((i = e.querySelectorAll) == null ? void 0 : i.call(e, "video, audio")) || [];
        for (const d of a) (r = d.pause) == null || r.call(d);
      } catch (a) {
        (l = console.debug) == null || l.call(console, "[MFV Graph Map] preview pause failed", a);
      }
      (c = e.remove) == null || c.call(e);
    }
  }
  _handleCanvasClick(e) {
    var o, i, r;
    if ((o = this._drag) != null && o.moved) return;
    const n = this._canvas.getBoundingClientRect(), s = (r = (i = this._renderInfo) == null ? void 0 : i.hitTestNode) == null ? void 0 : r.call(i, e.clientX - n.left, e.clientY - n.top);
    s != null && s.id && (this._selectedNodeId = String(s.id), this.refresh());
  }
  _handleWheel(e) {
    var o;
    if (!this._workflow) return;
    (o = e.preventDefault) == null || o.call(e);
    const s = (Number(e.deltaY) > 0 ? -1 : 1) > 0 ? 1.18 : 1 / 1.18;
    this._view.zoom = Math.max(1, Math.min(8, Number(this._view.zoom || 1) * s)), this.refresh();
  }
  _handlePointerDown(e) {
    var i, r, l, c;
    if (!this._workflow || e.button !== 0) return;
    const n = (i = this._renderInfo) == null ? void 0 : i.resolvedView;
    if (!(n != null && n.renderScale)) return;
    (r = e.preventDefault) == null || r.call(e), (c = (l = this._canvas).setPointerCapture) == null || c.call(l, e.pointerId), this._drag = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      centerX: Number(this._view.centerX ?? n.centerX),
      centerY: Number(this._view.centerY ?? n.centerY),
      scale: Number(n.renderScale) || 1,
      moved: !1
    };
    const s = (a) => {
      if (!this._drag || a.pointerId !== this._drag.pointerId) return;
      const d = a.clientX - this._drag.startX, u = a.clientY - this._drag.startY;
      Math.abs(d) + Math.abs(u) > 3 && (this._drag.moved = !0), this._view.centerX = this._drag.centerX - d / this._drag.scale, this._view.centerY = this._drag.centerY - u / this._drag.scale, this._renderCanvas(), this._renderDetails();
    }, o = (a) => {
      var d, u;
      !this._drag || a.pointerId !== this._drag.pointerId || ((u = (d = this._canvas).releasePointerCapture) == null || u.call(d, a.pointerId), this._canvas.removeEventListener("pointermove", s), this._canvas.removeEventListener("pointerup", o), this._canvas.removeEventListener("pointercancel", o), window.setTimeout(() => {
        this._drag = null;
      }, 0));
    };
    this._canvas.addEventListener("pointermove", s), this._canvas.addEventListener("pointerup", o), this._canvas.addEventListener("pointercancel", o);
  }
}
function dt(t, ...e) {
  if (t) {
    for (; t.firstChild; ) t.removeChild(t.firstChild);
    for (const n of e) t.appendChild(n);
  }
}
function Ss(t) {
  if (t == null) return "";
  if (typeof t == "string") return t.replace(/\s+/g, " ").trim();
  if (typeof t == "number" || typeof t == "boolean") return String(t);
  try {
    return JSON.stringify(t);
  } catch {
    return String(t);
  }
}
function Es(t) {
  if (!t || typeof t != "object") return t;
  const n = (Array.isArray(t.previewCandidates) ? t.previewCandidates : []).find((l) => String(l || "").trim()) || t.url || "", s = String(t.type || "").toLowerCase(), o = String(t.kind || "").toLowerCase(), i = String(t.filename || t.name || ""), r = o || (t.isVideo || s === "video" || /\.(mp4|mov|webm|mkv|avi)$/i.test(i) ? "video" : t.isAudio || s === "audio" || /\.(mp3|wav|flac|ogg|m4a|aac|opus|wma)$/i.test(i) ? "audio" : t.isModel3d || s === "model3d" ? "model3d" : "");
  return {
    ...t,
    ...n ? { url: n } : null,
    ...r ? { kind: r, asset_type: r } : null
  };
}
function Ms(t) {
  return !t || typeof t != "object" ? "" : JSON.stringify({
    url: String(t.url || ""),
    filename: String(t.filename || t.name || ""),
    kind: String(t.kind || t.asset_type || t.type || ""),
    subfolder: String(t.subfolder || ""),
    id: t.id ?? ""
  });
}
const Ns = 16, Bs = 250;
class Ls {
  constructor({ hostEl: e, onClose: n, onOpenGraphMap: s, onCloseGraphMap: o } = {}) {
    this._hostEl = e, this._onClose = n ?? null, this._onOpenGraphMap = s ?? null, this._onCloseGraphMap = o ?? null, this._visible = !1, this._liveSyncHandle = null, this._liveSyncMode = "", this._lastLiveSyncAt = 0, this._resizeCleanup = null, this._nodesTab = new Qn(), this._graphMapPanel = new Ue(), this._activeMode = "nodes", this._asset = null, this._el = this._build();
  }
  get el() {
    return this._el;
  }
  get isVisible() {
    return this._visible;
  }
  show() {
    this._visible = !0, this._el.classList.add("open"), this.refresh(), this._lastLiveSyncAt = he(this._el), this._startLiveSync();
  }
  hide() {
    this._visible = !1, this._el.classList.remove("open"), this._stopLiveSync();
  }
  toggle() {
    var e, n;
    if (this._visible) {
      const s = this._activeMode === "graph";
      this.hide(), s && ((e = this._onCloseGraphMap) == null || e.call(this)), (n = this._onClose) == null || n.call(this);
    } else
      this.show();
  }
  refresh() {
    this._visible && (this._activeMode === "graph" ? this._graphMapPanel.refresh() : this._nodesTab.refresh());
  }
  syncFromGraph() {
    this._visible && (this._activeMode === "graph" ? this._graphMapPanel.refresh() : this._nodesTab.refresh());
  }
  setAsset(e) {
    var n, s;
    this._asset = e || null, (s = (n = this._graphMapPanel) == null ? void 0 : n.setAsset) == null || s.call(n, this._asset);
  }
  dispose() {
    var e, n, s, o, i;
    this._stopLiveSync(), this._disposeResize(), (n = (e = this._nodesTab) == null ? void 0 : e.dispose) == null || n.call(e), (o = (s = this._graphMapPanel) == null ? void 0 : s.dispose) == null || o.call(s), this._nodesTab = null, this._graphMapPanel = null, (i = this._el) == null || i.remove();
  }
  _build() {
    const e = document.createElement("div");
    e.className = "mjr-ws-sidebar";
    const n = document.createElement("div");
    n.className = "mjr-ws-sidebar-header";
    const s = document.createElement("span");
    s.className = "mjr-ws-sidebar-title", s.textContent = "Nodes", n.appendChild(s);
    const o = document.createElement("button");
    o.type = "button", o.className = "mjr-icon-btn", o.title = "Close sidebar", o.innerHTML = '<i class="pi pi-times" aria-hidden="true"></i>', o.addEventListener("click", () => {
      var c, a;
      const l = this._activeMode === "graph";
      this.hide(), l && ((c = this._onCloseGraphMap) == null || c.call(this)), (a = this._onClose) == null || a.call(this);
    }), n.appendChild(o), e.appendChild(n);
    const i = document.createElement("div");
    i.className = "mjr-ws-tab-bar", this._nodesModeBtn = this._makeModeButton("Nodes", "pi pi-sliders-h", "nodes"), this._graphModeBtn = this._makeModeButton("Graph Map", "pi pi-sitemap", "graph"), i.appendChild(this._nodesModeBtn), i.appendChild(this._graphModeBtn), e.appendChild(i);
    const r = document.createElement("div");
    return r.className = "mjr-ws-sidebar-resizer", r.setAttribute("role", "separator"), r.setAttribute("aria-orientation", "vertical"), r.setAttribute("aria-hidden", "true"), e.appendChild(r), this._bindResize(r), this._body = document.createElement("div"), this._body.className = "mjr-ws-sidebar-body", e.appendChild(this._body), this._renderActiveMode(), e;
  }
  _makeModeButton(e, n, s) {
    const o = document.createElement("button");
    return o.type = "button", o.className = "mjr-ws-tab", o.dataset.mode = s, o.innerHTML = `<i class="${n}" aria-hidden="true"></i><span>${e}</span>`, o.addEventListener("click", () => this._setMode(s)), o;
  }
  _setMode(e) {
    var s, o, i;
    const n = e === "graph" ? "graph" : "nodes";
    this._activeMode === n && ((s = this._body) != null && s.firstElementChild) || (this._activeMode = n, this._renderActiveMode(), n === "graph" ? (o = this._onOpenGraphMap) == null || o.call(this) : (i = this._onCloseGraphMap) == null || i.call(this), this.refresh());
  }
  _renderActiveMode() {
    var n, s, o, i, r, l, c, a;
    if (!this._body) return;
    (s = (n = this._nodesModeBtn) == null ? void 0 : n.classList) == null || s.toggle("is-active", this._activeMode === "nodes"), (i = (o = this._graphModeBtn) == null ? void 0 : o.classList) == null || i.toggle("is-active", this._activeMode === "graph"), (r = this._nodesModeBtn) == null || r.setAttribute("aria-pressed", String(this._activeMode === "nodes")), (l = this._graphModeBtn) == null || l.setAttribute("aria-pressed", String(this._activeMode === "graph"));
    const e = this._activeMode === "graph" ? (c = this._graphMapPanel) == null ? void 0 : c.el : (a = this._nodesTab) == null ? void 0 : a.el;
    if (e && this._body.firstElementChild !== e) {
      for (; this._body.firstChild; ) this._body.removeChild(this._body.firstChild);
      this._body.appendChild(e);
    }
  }
  _startLiveSync() {
    if (this._liveSyncHandle != null) return;
    const e = Ht(this._el), n = (s) => {
      if (this._liveSyncHandle = null, this._liveSyncMode = "", !this._visible) return;
      const o = Number.isFinite(Number(s)) ? Number(s) : he(this._el);
      o - this._lastLiveSyncAt >= Bs && (this._lastLiveSyncAt = o, this.syncFromGraph()), this._startLiveSync();
    };
    if (typeof e.requestAnimationFrame == "function") {
      this._liveSyncMode = "raf", this._liveSyncHandle = e.requestAnimationFrame(n);
      return;
    }
    this._liveSyncMode = "timeout", this._liveSyncHandle = e.setTimeout(n, Ns);
  }
  _stopLiveSync() {
    var n;
    if (this._liveSyncHandle == null) return;
    const e = Ht(this._el);
    try {
      this._liveSyncMode === "raf" && typeof e.cancelAnimationFrame == "function" ? e.cancelAnimationFrame(this._liveSyncHandle) : typeof e.clearTimeout == "function" && e.clearTimeout(this._liveSyncHandle);
    } catch (s) {
      (n = console.debug) == null || n.call(console, s);
    }
    this._liveSyncHandle = null, this._liveSyncMode = "";
  }
  _bindResize(e) {
    if (!e) return;
    const s = (e.ownerDocument || document).defaultView || window, o = 180, i = (r) => {
      var _;
      if (r.button !== 0 || !((_ = this._el) != null && _.classList.contains("open"))) return;
      const l = this._el.parentElement;
      if (!l) return;
      const c = this._el.getBoundingClientRect(), a = l.getBoundingClientRect(), d = l.getAttribute("data-sidebar-pos") || "right", u = Math.max(
        o,
        Math.floor(a.width * (d === "bottom" ? 1 : 0.65))
      );
      if (d === "bottom") return;
      r.preventDefault(), r.stopPropagation(), e.classList.add("is-dragging"), this._el.classList.add("is-resizing");
      const m = r.clientX, h = c.width, f = (y) => {
        const g = y.clientX - m, b = d === "left" ? h - g : h + g, A = Math.max(o, Math.min(u, b));
        this._el.style.width = `${Math.round(A)}px`;
      }, p = () => {
        e.classList.remove("is-dragging"), this._el.classList.remove("is-resizing"), s.removeEventListener("pointermove", f), s.removeEventListener("pointerup", p), s.removeEventListener("pointercancel", p);
      };
      s.addEventListener("pointermove", f), s.addEventListener("pointerup", p), s.addEventListener("pointercancel", p);
    };
    e.addEventListener("pointerdown", i), this._resizeCleanup = () => e.removeEventListener("pointerdown", i);
  }
  _disposeResize() {
    var e, n;
    try {
      (e = this._resizeCleanup) == null || e.call(this);
    } catch (s) {
      (n = console.debug) == null || n.call(console, s);
    }
    this._resizeCleanup = null;
  }
}
function Ht(t) {
  var n;
  const e = ((n = t == null ? void 0 : t.ownerDocument) == null ? void 0 : n.defaultView) || null;
  return e || (typeof window < "u" ? window : globalThis);
}
function he(t) {
  var s;
  const e = Ht(t), n = (s = e == null ? void 0 : e.performance) == null ? void 0 : s.now;
  if (typeof n == "function")
    try {
      return Number(n.call(e.performance)) || Date.now();
    } catch {
      return Date.now();
    }
  return Date.now();
}
const D = Object.freeze({
  IDLE: "idle",
  RUNNING: "running",
  STOPPING: "stopping",
  ERROR: "error"
}), Ps = /* @__PURE__ */ new Set(["default", "auto", "latent2rgb", "taesd", "none"]), fe = "progress-update";
function Is() {
  const t = document.createElement("div");
  t.className = "mjr-mfv-run-controls";
  const e = document.createElement("button");
  e.type = "button", e.className = "mjr-icon-btn mjr-mfv-run-btn";
  const n = V("tooltip.queuePrompt", "Queue Prompt (Run)");
  e.title = n, e.setAttribute("aria-label", n);
  const s = document.createElement("i");
  s.className = "pi pi-play", s.setAttribute("aria-hidden", "true"), e.appendChild(s);
  const o = document.createElement("button");
  o.type = "button", o.className = "mjr-icon-btn mjr-mfv-stop-btn";
  const i = document.createElement("i");
  i.className = "pi pi-stop", i.setAttribute("aria-hidden", "true"), o.appendChild(i), t.appendChild(e), t.appendChild(o);
  let r = D.IDLE, l = !1, c = !1, a = null;
  function d() {
    a != null && (clearTimeout(a), a = null);
  }
  function u(b, { canStop: A = !1 } = {}) {
    r = b, e.classList.toggle("running", r === D.RUNNING), e.classList.toggle("stopping", r === D.STOPPING), e.classList.toggle("error", r === D.ERROR), e.disabled = r === D.RUNNING || r === D.STOPPING, o.disabled = !A || r === D.STOPPING, o.classList.toggle("active", A && r !== D.STOPPING), o.classList.toggle("stopping", r === D.STOPPING), r === D.RUNNING || r === D.STOPPING ? s.className = "pi pi-spin pi-spinner" : s.className = "pi pi-play";
  }
  function m() {
    const b = V("tooltip.queueStop", "Stop Generation");
    o.title = b, o.setAttribute("aria-label", b);
  }
  function h(b = Ct.getSnapshot(), { authoritative: A = !1 } = {}) {
    const C = Math.max(0, Number(b == null ? void 0 : b.queue) || 0), S = (b == null ? void 0 : b.prompt) || null, M = !!(S != null && S.currentlyExecuting), x = !!(S && (S.currentlyExecuting || S.errorDetails)), j = C > 0 || x, k = !!(S != null && S.errorDetails);
    A && C === 0 && !S && (l = !1, c = !1);
    const I = l || c || M || C > 0;
    if ((M || j || C > 0) && (l = !1), k) {
      c = !1, d(), u(D.ERROR, { canStop: !1 });
      return;
    }
    if (c) {
      if (!I) {
        c = !1, h(b);
        return;
      }
      u(D.STOPPING, { canStop: !1 });
      return;
    }
    if (l || M || j || C > 0) {
      d(), u(D.RUNNING, { canStop: !0 });
      return;
    }
    d(), u(D.IDLE, { canStop: !1 });
  }
  function f() {
    l = !1, c = !1, d(), u(D.ERROR, { canStop: !1 }), a = setTimeout(() => {
      a = null, h();
    }, 1500);
  }
  async function p() {
    const b = ut(), C = (b != null && b.api && typeof b.api.interrupt == "function" ? b.api : null) ?? Ne(b);
    if (C && typeof C.interrupt == "function")
      return await C.interrupt(), { tracked: !0 };
    if (C && typeof C.fetchApi == "function") {
      const M = await C.fetchApi("/interrupt", { method: "POST" });
      if (!(M != null && M.ok)) throw new Error(`POST /interrupt failed (${M == null ? void 0 : M.status})`);
      return { tracked: !0 };
    }
    const S = await fetch("/interrupt", { method: "POST", credentials: "include" });
    if (!S.ok) throw new Error(`POST /interrupt failed (${S.status})`);
    return { tracked: !1 };
  }
  async function _() {
    var b;
    if (!(r === D.RUNNING || r === D.STOPPING)) {
      l = !0, c = !1, h();
      try {
        const A = await Fs();
        A != null && A.tracked || (l = !1), h();
      } catch (A) {
        (b = console.error) == null || b.call(console, "[MFV Run]", A), f();
      }
    }
  }
  async function y() {
    var b;
    if (r === D.RUNNING) {
      c = !0, h();
      try {
        const A = await p();
        A != null && A.tracked || (c = !1, l = !1), h();
      } catch (A) {
        (b = console.error) == null || b.call(console, "[MFV Stop]", A), c = !1, h();
      } finally {
      }
    }
  }
  m(), o.disabled = !0, e.addEventListener("click", _), o.addEventListener("click", y);
  const g = (b) => {
    h((b == null ? void 0 : b.detail) || Ct.getSnapshot(), {
      authoritative: !0
    });
  };
  return Ct.addEventListener(fe, g), sn({ timeoutMs: 4e3 }).catch((b) => {
    var A;
    (A = console.debug) == null || A.call(console, b);
  }), h(), {
    el: t,
    dispose() {
      d(), e.removeEventListener("click", _), o.removeEventListener("click", y), Ct.removeEventListener(
        fe,
        g
      );
    }
  };
}
function xs(t = mt.MFV_PREVIEW_METHOD) {
  const e = String(t || "").trim().toLowerCase();
  return Ps.has(e) ? e : "taesd";
}
function We(t, e = mt.MFV_PREVIEW_METHOD) {
  var o;
  const n = xs(e), s = {
    ...(t == null ? void 0 : t.extra_data) || {},
    extra_pnginfo: {
      ...((o = t == null ? void 0 : t.extra_data) == null ? void 0 : o.extra_pnginfo) || {}
    }
  };
  return (t == null ? void 0 : t.workflow) != null && (s.extra_pnginfo.workflow = t.workflow), n !== "default" ? s.preview_method = n : delete s.preview_method, {
    ...t,
    extra_data: s
  };
}
function _e(t, { previewMethod: e = mt.MFV_PREVIEW_METHOD, clientId: n = null } = {}) {
  const s = We(t, e), o = {
    prompt: s == null ? void 0 : s.output,
    extra_data: (s == null ? void 0 : s.extra_data) || {}
  }, i = String(n || "").trim();
  return i && (o.client_id = i), o;
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
  for (const s of n) {
    const o = String(s || "").trim();
    if (o) return o;
  }
  return "";
}
function ze(t) {
  if (!t || typeof t != "object") return [];
  if (Array.isArray(t.nodes)) return t.nodes.filter(Boolean);
  if (Array.isArray(t._nodes)) return t._nodes.filter(Boolean);
  const e = t._nodes_by_id ?? t.nodes_by_id ?? null;
  return e instanceof Map ? Array.from(e.values()).filter(Boolean) : e && typeof e == "object" ? Object.values(e).filter(Boolean) : [];
}
function js(t) {
  var n, s, o, i;
  const e = [
    t == null ? void 0 : t.subgraph,
    t == null ? void 0 : t._subgraph,
    (n = t == null ? void 0 : t.subgraph) == null ? void 0 : n.graph,
    (s = t == null ? void 0 : t.subgraph) == null ? void 0 : s.lgraph,
    (o = t == null ? void 0 : t.properties) == null ? void 0 : o.subgraph,
    t == null ? void 0 : t.subgraph_instance,
    (i = t == null ? void 0 : t.subgraph_instance) == null ? void 0 : i.graph,
    t == null ? void 0 : t.inner_graph,
    t == null ? void 0 : t.subgraph_graph
  ].filter((r) => r && ze(r).length > 0);
  return Array.isArray(t == null ? void 0 : t.nodes) && t.nodes.length > 0 && e.push({ nodes: t.nodes }), e;
}
function Bt(t, e, n = /* @__PURE__ */ new Set()) {
  if (!(!t || n.has(t))) {
    n.add(t);
    for (const s of ze(t)) {
      e(s);
      for (const o of js(s))
        Bt(o, e, n);
    }
  }
}
function ks(t) {
  var n;
  return [t == null ? void 0 : t.type, t == null ? void 0 : t.comfyClass, t == null ? void 0 : t.class_type, (n = t == null ? void 0 : t.constructor) == null ? void 0 : n.type].some((s) => /Api$/i.test(String(s || "").trim()));
}
function Ts(t) {
  let e = !1;
  return Bt(t, (n) => {
    e || (e = ks(n));
  }), e;
}
async function Fs() {
  var c, a;
  const t = ut();
  if (!t) throw new Error("ComfyUI app not available");
  const n = (t != null && t.api && typeof t.api.queuePrompt == "function" ? t.api : null) ?? Ne(t), s = !!(n && typeof n.queuePrompt == "function" || n && typeof n.fetchApi == "function"), o = t.rootGraph ?? t.graph;
  if ((Ts(o) || !s) && typeof t.queuePrompt == "function")
    return await t.queuePrompt(0), { tracked: !0 };
  Bt(o, (d) => {
    var u;
    for (const m of d.widgets ?? [])
      (u = m.beforeQueued) == null || u.call(m, { isPartialExecution: !1 });
  });
  const r = typeof t.graphToPrompt == "function" ? await t.graphToPrompt() : null;
  if (!(r != null && r.output)) throw new Error("graphToPrompt returned empty output");
  let l;
  if (n && typeof n.queuePrompt == "function")
    await n.queuePrompt(0, We(r)), l = { tracked: !0 };
  else if (n && typeof n.fetchApi == "function") {
    const d = await n.fetchApi("/prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        _e(r, {
          clientId: ge(n, t)
        })
      )
    });
    if (!(d != null && d.ok)) throw new Error(`POST /prompt failed (${d == null ? void 0 : d.status})`);
    l = { tracked: !0 };
  } else {
    const d = await fetch("/prompt", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        _e(r, {
          clientId: ge(null, t)
        })
      )
    });
    if (!d.ok) throw new Error(`POST /prompt failed (${d.status})`);
    l = { tracked: !1 };
  }
  return Bt(o, (d) => {
    var u;
    for (const m of d.widgets ?? [])
      (u = m.afterQueued) == null || u.call(m, { isPartialExecution: !1 });
  }), (a = (c = t.canvas) == null ? void 0 : c.draw) == null || a.call(c, !0, !0), l;
}
function vs(t) {
  const e = t == null ? void 0 : t.models;
  if (!e || typeof e != "object") return "";
  const n = [
    ["HN", e.unet_high_noise],
    ["LN", e.unet_low_noise],
    ["UNet", e.unet],
    ["Diff", e.diffusion],
    ["Upsc", e.upscaler],
    ["CLIP", e.clip],
    ["VAE", e.vae]
  ], s = /* @__PURE__ */ new Set(), o = [];
  for (const [i, r] of n) {
    const l = cn((r == null ? void 0 : r.name) || (r == null ? void 0 : r.value) || r || "");
    if (!(!l || s.has(l)) && (s.add(l), o.push(`${i}: ${l}`), o.length >= 3))
      break;
  }
  return o.join(" | ");
}
function Os(t) {
  const e = ln(t);
  return e.workflowLabel ? e.workflowBadge ? `${e.workflowLabel} • ${e.workflowBadge}` : e.workflowLabel : "";
}
function Gs(t, e, n, s) {
  const o = document.createElement("div");
  o.className = "mjr-mfv-idrop";
  const i = document.createElement("button");
  i.type = "button", i.className = "mjr-icon-btn mjr-mfv-idrop-trigger", i.title = e, i.innerHTML = t, i.setAttribute("aria-haspopup", "listbox"), i.setAttribute("aria-expanded", "false"), o.appendChild(i);
  const r = document.createElement("div");
  r.className = "mjr-mfv-idrop-menu", r.setAttribute("role", "listbox");
  const l = (s == null ? void 0 : s.element) || o;
  l.appendChild(r);
  const c = document.createElement("select");
  c.style.cssText = "position:absolute;opacity:0;pointer-events:none;width:0;height:0;overflow:hidden;", o.appendChild(c);
  const a = [];
  for (const m of n) {
    const h = document.createElement("option");
    h.value = String(m.value), c.appendChild(h);
    const f = document.createElement("button");
    f.type = "button", f.className = "mjr-mfv-idrop-item", f.setAttribute("role", "option"), f.dataset.value = String(m.value), f.innerHTML = m.html ?? String(m.label ?? m.value), r.appendChild(f), a.push(f);
  }
  const d = () => {
    r.classList.remove("is-open"), i.setAttribute("aria-expanded", "false");
  };
  return i.addEventListener("click", (m) => {
    var f, p, _;
    m.stopPropagation();
    const h = r.classList.contains("is-open");
    if ((p = (f = s == null ? void 0 : s.element) == null ? void 0 : f.querySelectorAll) == null || p.call(f, ".mjr-mfv-idrop-menu.is-open").forEach((y) => y.classList.remove("is-open")), !h) {
      const y = i.getBoundingClientRect(), g = ((_ = l.getBoundingClientRect) == null ? void 0 : _.call(l)) || { left: 0, top: 0 };
      r.style.left = `${y.left - g.left}px`, r.style.top = `${y.bottom - g.top + 4}px`, r.classList.add("is-open"), i.setAttribute("aria-expanded", "true");
    }
  }), r.addEventListener("click", (m) => {
    const h = m.target.closest(".mjr-mfv-idrop-item");
    h && (c.value = h.dataset.value, c.dispatchEvent(new Event("change", { bubbles: !0 })), a.forEach((f) => {
      f.classList.toggle("is-selected", f === h), f.setAttribute("aria-selected", String(f === h));
    }), d());
  }), { wrap: o, trigger: i, menu: r, select: c, selectItem: (m) => {
    c.value = String(m), a.forEach((h) => {
      h.classList.toggle("is-selected", h.dataset.value === String(m)), h.setAttribute("aria-selected", String(h.dataset.value === String(m)));
    });
  } };
}
const Vs = {
  rgb: "#e0e0e0",
  r: "#ff5555",
  g: "#44dd66",
  b: "#5599ff",
  a: "#ffffff",
  l: "#bbbbbb"
}, Rs = { rgb: "RGB", r: "R", g: "G", b: "B", a: "A", l: "L" }, Hs = { rgb: "500", r: "700", g: "700", b: "700", a: "700", l: "400" };
function Ds(t) {
  var n;
  const e = document.createElement("div");
  return e.className = "mjr-mfv", e.setAttribute("role", "dialog"), e.setAttribute("aria-modal", "false"), e.setAttribute("aria-hidden", "true"), t.element = e, e.appendChild(t._buildHeader()), e.setAttribute("aria-labelledby", t._titleId), e.appendChild(t._buildToolbar()), e.appendChild(on(t)), t._contentWrapper = document.createElement("div"), t._contentWrapper.className = "mjr-mfv-content-wrapper", t._applySidebarPosition(), t._contentEl = document.createElement("div"), t._contentEl.className = "mjr-mfv-content", t._contentWrapper.appendChild(t._contentEl), t._overlayCanvas = document.createElement("canvas"), t._overlayCanvas.className = "mjr-mfv-overlay-canvas", t._contentEl.appendChild(t._overlayCanvas), t._contentEl.appendChild(rn(t)), t._sidebar = new Ls({
    hostEl: e,
    onClose: () => t._updateSettingsBtnState(!1),
    onOpenGraphMap: () => {
      var s;
      return (s = t.setMode) == null ? void 0 : s.call(t, P.GRAPH);
    },
    onCloseGraphMap: () => {
      var s;
      t._mode === P.GRAPH && ((s = t.setMode) == null || s.call(t, P.SIMPLE));
    }
  }), t._contentWrapper.appendChild(t._sidebar.el), e.appendChild(t._contentWrapper), t._rebindControlHandlers(), t._bindPanelInteractions(), t._bindDocumentUiHandlers(), (n = t._bindLayoutObserver) == null || n.call(t), t._onSidebarPosChanged = (s) => {
    var o;
    ((o = s == null ? void 0 : s.detail) == null ? void 0 : o.key) === "viewer.mfvSidebarPosition" && t._applySidebarPosition();
  }, window.addEventListener("mjr-settings-changed", t._onSidebarPosChanged), t._refresh(), e;
}
function Us(t) {
  const e = document.createElement("div");
  e.className = "mjr-mfv-header";
  const n = document.createElement("span");
  n.className = "mjr-mfv-header-title", n.id = t._titleId, n.textContent = "〽️ Majoor Floating Viewer";
  const s = document.createElement("button");
  t._closeBtn = s, s.type = "button", s.className = "mjr-icon-btn mjr-mfv-close-btn", St(s, V("tooltip.closeViewer", "Close viewer"), fn);
  const o = document.createElement("i");
  return o.className = "pi pi-times", o.setAttribute("aria-hidden", "true"), s.appendChild(o), e.appendChild(n), e.appendChild(s), e;
}
function Ws(t) {
  const e = (B, { min: E, max: L, step: F, value: v } = {}) => {
    const Y = document.createElement("div");
    Y.className = "mjr-mfv-toolbar-range";
    const z = document.createElement("input");
    z.type = "range", z.min = String(E), z.max = String(L), z.step = String(F), z.value = String(v), z.title = B || "";
    const J = document.createElement("span");
    return J.className = "mjr-mfv-toolbar-range-out", J.textContent = Number(v).toFixed(2), Y.appendChild(z), Y.appendChild(J), { wrap: Y, input: z, out: J };
  }, n = document.createElement("div");
  n.className = "mjr-mfv-toolbar";
  const s = Gs(
    '<i class="pi pi-image" aria-hidden="true"></i>',
    "Viewer mode",
    [
      {
        value: P.SIMPLE,
        html: '<i class="pi pi-image" aria-hidden="true"></i><span>Simple</span>'
      },
      {
        value: P.AB,
        html: '<i class="pi pi-clone" aria-hidden="true"></i><span>A/B Compare</span>'
      },
      {
        value: P.SIDE,
        html: '<i class="pi pi-table" aria-hidden="true"></i><span>Side-by-side</span>'
      },
      {
        value: P.GRID,
        html: '<i class="pi pi-th-large" aria-hidden="true"></i><span>Grid</span>'
      },
      {
        value: P.GRAPH,
        html: '<i class="pi pi-sitemap" aria-hidden="true"></i><span>Graph Map</span>'
      }
    ],
    t
  );
  t._modeDrop = s, t._modeBtn = s.trigger, t._modeSelect = s.select, t._updateModeBtnUI(), n.appendChild(s.wrap);
  const o = document.createElement("button");
  o.type = "button", o.className = "mjr-icon-btn mjr-mfv-pin-trigger", o.title = "Pin slots A/B/C/D", o.setAttribute("aria-haspopup", "dialog"), o.setAttribute("aria-expanded", "false"), o.innerHTML = '<i class="pi pi-map-marker" aria-hidden="true"></i>', n.appendChild(o);
  const i = document.createElement("div");
  i.className = "mjr-mfv-pin-popover", t.element.appendChild(i);
  const r = document.createElement("div");
  r.className = "mjr-menu", r.style.cssText = "display:grid;gap:4px;", r.setAttribute("role", "group"), r.setAttribute("aria-label", "Pin References"), i.appendChild(r), t._pinGroup = r, t._pinBtns = {};
  for (const B of ["A", "B", "C", "D"]) {
    const E = document.createElement("button");
    E.type = "button", E.className = "mjr-menu-item mjr-mfv-pin-btn", E.dataset.slot = B, E.title = `Pin Asset ${B}`, E.setAttribute("aria-pressed", "false");
    const L = document.createElement("span");
    L.className = "mjr-menu-item-label", L.textContent = `Asset ${B}`;
    const F = document.createElement("i");
    F.className = "pi pi-map-marker mjr-menu-item-check", F.style.opacity = "0", E.appendChild(L), E.appendChild(F), r.appendChild(E), t._pinBtns[B] = E;
  }
  t._updatePinUI(), t._pinBtn = o, t._pinPopover = i;
  const l = () => {
    const B = o.getBoundingClientRect(), E = t.element.getBoundingClientRect();
    i.style.left = `${B.left - E.left}px`, i.style.top = `${B.bottom - E.top + 4}px`, i.classList.add("is-open"), o.setAttribute("aria-expanded", "true");
  };
  t._closePinPopover = () => {
    i.classList.remove("is-open"), o.setAttribute("aria-expanded", "false");
  }, o.addEventListener("click", (B) => {
    var E;
    B.stopPropagation(), i.classList.contains("is-open") ? t._closePinPopover() : ((E = t._closeAllToolbarPopovers) == null || E.call(t), l());
  });
  const c = document.createElement("button");
  c.type = "button", c.className = "mjr-icon-btn mjr-mfv-guides-trigger", c.title = "Guides", c.setAttribute("aria-haspopup", "listbox"), c.setAttribute("aria-expanded", "false");
  const a = document.createElement("img");
  a.src = new URL("data:image/png;base64,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", import.meta.url).href, a.className = "mjr-mfv-guides-icon", a.alt = "", a.setAttribute("aria-hidden", "true"), c.appendChild(a), n.appendChild(c);
  const d = document.createElement("div");
  d.className = "mjr-mfv-guides-popover", t.element.appendChild(d);
  const u = document.createElement("div");
  u.className = "mjr-menu", u.style.cssText = "display:grid;gap:4px;", d.appendChild(u);
  const m = document.createElement("select");
  m.style.cssText = "position:absolute;opacity:0;pointer-events:none;width:0;height:0;overflow:hidden;", d.appendChild(m);
  const h = [
    { value: "0", label: "Off" },
    { value: "1", label: "Thirds" },
    { value: "2", label: "Center" },
    { value: "3", label: "Safe" }
  ], f = String(t._gridMode || 0), p = [];
  for (const B of h) {
    const E = document.createElement("option");
    E.value = B.value, m.appendChild(E);
    const L = document.createElement("button");
    L.type = "button", L.className = "mjr-menu-item", L.dataset.value = B.value;
    const F = document.createElement("span");
    F.className = "mjr-menu-item-label", F.textContent = B.label;
    const v = document.createElement("i");
    v.className = "pi pi-check mjr-menu-item-check", v.style.opacity = B.value === f ? "1" : "0", L.appendChild(F), L.appendChild(v), u.appendChild(L), p.push(L), B.value === f && L.classList.add("is-active");
  }
  m.value = f, c.classList.toggle("is-on", f !== "0"), t._guidesSelect = m, t._guideBtn = c, t._guidePopover = d;
  const _ = () => {
    const B = c.getBoundingClientRect(), E = t.element.getBoundingClientRect();
    d.style.left = `${B.left - E.left}px`, d.style.top = `${B.bottom - E.top + 4}px`, d.classList.add("is-open"), c.setAttribute("aria-expanded", "true");
  };
  t._closeGuidePopover = () => {
    d.classList.remove("is-open"), c.setAttribute("aria-expanded", "false");
  }, c.addEventListener("click", (B) => {
    var E;
    B.stopPropagation(), d.classList.contains("is-open") ? t._closeGuidePopover() : ((E = t._closeAllToolbarPopovers) == null || E.call(t), _());
  }), u.addEventListener("click", (B) => {
    const E = B.target.closest(".mjr-menu-item");
    if (!E) return;
    const L = E.dataset.value;
    m.value = L, m.dispatchEvent(new Event("change", { bubbles: !0 })), p.forEach((F) => {
      const v = F.dataset.value === L;
      F.classList.toggle("is-active", v), F.querySelector(".mjr-menu-item-check").style.opacity = v ? "1" : "0";
    }), c.classList.toggle("is-on", L !== "0"), t._closeGuidePopover();
  });
  const y = String(t._channel || "rgb"), g = document.createElement("button");
  g.type = "button", g.className = "mjr-icon-btn mjr-mfv-ch-trigger", g.title = "Channel", g.setAttribute("aria-haspopup", "listbox"), g.setAttribute("aria-expanded", "false");
  const b = document.createElement("img");
  b.src = new URL("data:image/png;base64,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", import.meta.url).href, b.className = "mjr-mfv-ch-icon", b.alt = "", b.setAttribute("aria-hidden", "true"), g.appendChild(b), n.appendChild(g);
  const A = (B) => {
    if (!B || B === "rgb")
      g.replaceChildren(b);
    else {
      const E = Vs[B] || "#e0e0e0", L = Hs[B] || "500", F = Rs[B] || B.toUpperCase(), v = document.createElement("span");
      v.className = "mjr-mfv-ch-label", v.style.color = E, v.style.fontWeight = L, v.textContent = F, g.replaceChildren(v);
    }
  }, C = document.createElement("div");
  C.className = "mjr-mfv-ch-popover", t.element.appendChild(C);
  const S = document.createElement("div");
  S.className = "mjr-menu", S.style.cssText = "display:grid;gap:4px;", C.appendChild(S);
  const M = document.createElement("select");
  M.style.cssText = "position:absolute;opacity:0;pointer-events:none;width:0;height:0;overflow:hidden;", C.appendChild(M);
  const x = [
    { value: "rgb", color: "#e0e0e0", weight: "500", label: "RGB" },
    { value: "r", color: "#ff5555", weight: "700", label: "R" },
    { value: "g", color: "#44dd66", weight: "700", label: "G" },
    { value: "b", color: "#5599ff", weight: "700", label: "B" },
    { value: "a", color: "#ffffff", weight: "700", label: "A" },
    { value: "l", color: "#bbbbbb", weight: "400", label: "L" }
  ], j = [];
  for (const B of x) {
    const E = document.createElement("option");
    E.value = B.value, M.appendChild(E);
    const L = document.createElement("button");
    L.type = "button", L.className = "mjr-menu-item", L.dataset.value = B.value;
    const F = document.createElement("span");
    F.className = "mjr-menu-item-label";
    const v = document.createElement("span");
    v.textContent = B.label, v.style.color = B.color, v.style.fontWeight = B.weight, F.appendChild(v);
    const Y = document.createElement("i");
    Y.className = "pi pi-check mjr-menu-item-check", Y.style.opacity = B.value === y ? "1" : "0", L.appendChild(F), L.appendChild(Y), S.appendChild(L), j.push(L), B.value === y && L.classList.add("is-active");
  }
  M.value = y, A(y), g.classList.toggle("is-on", y !== "rgb"), t._channelSelect = M, t._chBtn = g, t._chPopover = C;
  const k = () => {
    const B = g.getBoundingClientRect(), E = t.element.getBoundingClientRect();
    C.style.left = `${B.left - E.left}px`, C.style.top = `${B.bottom - E.top + 4}px`, C.classList.add("is-open"), g.setAttribute("aria-expanded", "true");
  };
  t._closeChPopover = () => {
    C.classList.remove("is-open"), g.setAttribute("aria-expanded", "false");
  }, g.addEventListener("click", (B) => {
    var E;
    B.stopPropagation(), C.classList.contains("is-open") ? t._closeChPopover() : ((E = t._closeAllToolbarPopovers) == null || E.call(t), k());
  }), S.addEventListener("click", (B) => {
    const E = B.target.closest(".mjr-menu-item");
    if (!E) return;
    const L = E.dataset.value;
    M.value = L, M.dispatchEvent(new Event("change", { bubbles: !0 })), j.forEach((F) => {
      const v = F.dataset.value === L;
      F.classList.toggle("is-active", v), F.querySelector(".mjr-menu-item-check").style.opacity = v ? "1" : "0";
    }), A(L), g.classList.toggle("is-on", L !== "rgb"), t._closeChPopover();
  }), t._closeAllToolbarPopovers = () => {
    var B, E, L, F, v;
    (B = t._closeChPopover) == null || B.call(t), (E = t._closeGuidePopover) == null || E.call(t), (L = t._closePinPopover) == null || L.call(t), (F = t._closeFormatPopover) == null || F.call(t), (v = t._closeGenDropdown) == null || v.call(t);
  }, t._exposureCtl = e("Exposure (EV)", {
    min: -10,
    max: 10,
    step: 0.1,
    value: Number(t._exposureEV || 0)
  }), t._exposureCtl.out.textContent = `${Number(t._exposureEV || 0).toFixed(1)}EV`, t._exposureCtl.out.title = "Click to reset to 0 EV", t._exposureCtl.out.style.cursor = "pointer", t._exposureCtl.wrap.classList.toggle("is-active", (t._exposureEV || 0) !== 0), n.appendChild(t._exposureCtl.wrap), t._formatToggle = document.createElement("button"), t._formatToggle.type = "button", t._formatToggle.className = "mjr-icon-btn mjr-mfv-format-trigger", t._formatToggle.setAttribute("aria-haspopup", "dialog"), t._formatToggle.setAttribute("aria-expanded", "false"), t._formatToggle.setAttribute("aria-pressed", "false"), t._formatToggle.title = "Format mask", t._formatToggle.innerHTML = '<i class="pi pi-stop" aria-hidden="true"></i>', n.appendChild(t._formatToggle);
  const I = document.createElement("div");
  I.className = "mjr-mfv-format-popover", t.element.appendChild(I);
  const O = document.createElement("div");
  O.className = "mjr-menu", O.style.cssText = "display:grid;gap:4px;", I.appendChild(O);
  const G = document.createElement("select");
  G.style.cssText = "position:absolute;opacity:0;pointer-events:none;width:0;height:0;overflow:hidden;", I.appendChild(G);
  const q = [
    { value: "off", label: "Off" },
    { value: "image", label: "Image" },
    { value: "16:9", label: "16:9" },
    { value: "1:1", label: "1:1" },
    { value: "4:3", label: "4:3" },
    { value: "9:16", label: "9:16" },
    { value: "2.39", label: "2.39" }
  ], rt = [], Q = t._overlayMaskEnabled ? String(t._overlayFormat || "image") : "off";
  for (const B of q) {
    const E = document.createElement("option");
    E.value = B.value, G.appendChild(E);
    const L = document.createElement("button");
    L.type = "button", L.className = "mjr-menu-item", L.dataset.value = B.value;
    const F = document.createElement("span");
    F.className = "mjr-menu-item-label", F.textContent = B.label;
    const v = document.createElement("i");
    v.className = "pi pi-check mjr-menu-item-check", v.style.opacity = B.value === Q ? "1" : "0", L.appendChild(F), L.appendChild(v), O.appendChild(L), rt.push(L), B.value === Q && L.classList.add("is-active");
  }
  G.value = Q;
  const ft = document.createElement("div");
  ft.className = "mjr-mfv-format-sep", I.appendChild(ft);
  const K = document.createElement("div");
  K.className = "mjr-mfv-format-slider-row", I.appendChild(K);
  const Z = document.createElement("span");
  Z.className = "mjr-mfv-format-slider-label", Z.textContent = "Opacity", K.appendChild(Z), t._maskOpacityCtl = e("Mask opacity", {
    min: 0,
    max: 0.9,
    step: 0.01,
    value: Number(t._overlayMaskOpacity ?? 0.65)
  }), K.appendChild(t._maskOpacityCtl.input), K.appendChild(t._maskOpacityCtl.out), t._formatSelect = G, t._formatPopover = I;
  const It = () => {
    const B = t._formatToggle.getBoundingClientRect(), E = t.element.getBoundingClientRect();
    I.style.left = `${B.left - E.left}px`, I.style.top = `${B.bottom - E.top + 4}px`, I.classList.add("is-open"), t._formatToggle.setAttribute("aria-expanded", "true");
  };
  t._closeFormatPopover = () => {
    I.classList.remove("is-open"), t._formatToggle.setAttribute("aria-expanded", "false");
  }, t._formatToggle.addEventListener("click", (B) => {
    var E;
    B.stopPropagation(), I.classList.contains("is-open") ? t._closeFormatPopover() : ((E = t._closeAllToolbarPopovers) == null || E.call(t), It());
  }), O.addEventListener("click", (B) => {
    const E = B.target.closest(".mjr-menu-item");
    if (!E) return;
    const L = E.dataset.value;
    G.value = L, G.dispatchEvent(new Event("change", { bubbles: !0 })), rt.forEach((F) => {
      const v = F.dataset.value === L;
      F.classList.toggle("is-active", v), F.querySelector(".mjr-menu-item-check").style.opacity = v ? "1" : "0";
    }), t._closeFormatPopover();
  });
  const at = document.createElement("div");
  at.className = "mjr-mfv-toolbar-sep", at.setAttribute("aria-hidden", "true"), n.appendChild(at), t._liveBtn = document.createElement("button"), t._liveBtn.type = "button", t._liveBtn.className = "mjr-icon-btn", t._liveBtn.innerHTML = '<i class="pi pi-circle" aria-hidden="true"></i>', t._liveBtn.setAttribute("aria-pressed", "false"), St(
    t._liveBtn,
    V("tooltip.liveStreamOff", "Live Stream: OFF - click to follow final generation outputs"),
    Be
  ), n.appendChild(t._liveBtn), t._previewBtn = document.createElement("button"), t._previewBtn.type = "button", t._previewBtn.className = "mjr-icon-btn", t._previewBtn.innerHTML = '<i class="pi pi-eye" aria-hidden="true"></i>', t._previewBtn.setAttribute("aria-pressed", "false"), St(
    t._previewBtn,
    V(
      "tooltip.previewStreamOff",
      "KSampler Preview: OFF - click to stream sampler denoising frames"
    ),
    Le
  ), n.appendChild(t._previewBtn), t._nodeStreamBtn = document.createElement("button"), t._nodeStreamBtn.type = "button", t._nodeStreamBtn.className = "mjr-icon-btn", t._nodeStreamBtn.innerHTML = '<i class="pi pi-sitemap" aria-hidden="true"></i>', t._nodeStreamBtn.setAttribute("aria-pressed", "false"), St(
    t._nodeStreamBtn,
    V(
      "tooltip.nodeStreamOff",
      "Node Stream: OFF - click to follow selected node previews, including ImageOps live canvases"
    ),
    Pe
  ), n.appendChild(t._nodeStreamBtn), t._genBtn = document.createElement("button"), t._genBtn.type = "button", t._genBtn.className = "mjr-icon-btn", t._genBtn.setAttribute("aria-haspopup", "dialog"), t._genBtn.setAttribute("aria-expanded", "false");
  const et = document.createElement("i");
  et.className = "pi pi-info-circle", et.setAttribute("aria-hidden", "true"), t._genBtn.appendChild(et), n.appendChild(t._genBtn), t._updateGenBtnUI(), t._popoutBtn = document.createElement("button"), t._popoutBtn.type = "button", t._popoutBtn.className = "mjr-icon-btn";
  const N = V("tooltip.popOutViewer", "Pop out viewer to separate window");
  t._popoutBtn.title = N, t._popoutBtn.setAttribute("aria-label", N), t._popoutBtn.setAttribute("aria-pressed", "false");
  const T = document.createElement("i");
  T.className = "pi pi-external-link", T.setAttribute("aria-hidden", "true"), t._popoutBtn.appendChild(T), n.appendChild(t._popoutBtn), t._captureBtn = document.createElement("button"), t._captureBtn.type = "button", t._captureBtn.className = "mjr-icon-btn";
  const R = V("tooltip.captureView", "Save view as image");
  t._captureBtn.title = R, t._captureBtn.setAttribute("aria-label", R);
  const H = document.createElement("i");
  H.className = "pi pi-download", H.setAttribute("aria-hidden", "true"), t._captureBtn.appendChild(H), n.appendChild(t._captureBtn);
  const W = document.createElement("div");
  W.className = "mjr-mfv-toolbar-sep", W.style.marginLeft = "auto", W.setAttribute("aria-hidden", "true"), n.appendChild(W), t._settingsBtn = document.createElement("button"), t._settingsBtn.type = "button", t._settingsBtn.className = "mjr-icon-btn mjr-mfv-settings-btn";
  const nt = V("tooltip.nodeParams", "Node Parameters");
  t._settingsBtn.title = nt, t._settingsBtn.setAttribute("aria-label", nt), t._settingsBtn.setAttribute("aria-pressed", "false");
  const xt = document.createElement("i");
  return xt.className = "pi pi-sliders-h", xt.setAttribute("aria-hidden", "true"), t._settingsBtn.appendChild(xt), n.appendChild(t._settingsBtn), t._runHandle = Is(), n.appendChild(t._runHandle.el), t._handleDocClick = (B) => {
    var L, F, v, Y, z, J, Yt, wt, Qt, _t, Xt, qt, Kt, Zt, gt, Jt, $t, te, ee, bt, ne, se, oe, yt, ie;
    const E = B == null ? void 0 : B.target;
    t._genDropdown && !((F = (L = t._genBtn) == null ? void 0 : L.contains) != null && F.call(L, E)) && !t._genDropdown.contains(E) && t._closeGenDropdown(), (Y = (v = t._chPopover) == null ? void 0 : v.classList) != null && Y.contains("is-open") && !((J = (z = t._chBtn) == null ? void 0 : z.contains) != null && J.call(z, E)) && !t._chPopover.contains(E) && ((Yt = t._closeChPopover) == null || Yt.call(t)), (Qt = (wt = t._guidePopover) == null ? void 0 : wt.classList) != null && Qt.contains("is-open") && !((Xt = (_t = t._guideBtn) == null ? void 0 : _t.contains) != null && Xt.call(_t, E)) && !t._guidePopover.contains(E) && ((qt = t._closeGuidePopover) == null || qt.call(t)), (Zt = (Kt = t._pinPopover) == null ? void 0 : Kt.classList) != null && Zt.contains("is-open") && !((Jt = (gt = t._pinBtn) == null ? void 0 : gt.contains) != null && Jt.call(gt, E)) && !t._pinPopover.contains(E) && (($t = t._closePinPopover) == null || $t.call(t)), (ee = (te = t._formatPopover) == null ? void 0 : te.classList) != null && ee.contains("is-open") && !((ne = (bt = t._formatToggle) == null ? void 0 : bt.contains) != null && ne.call(bt, E)) && !t._formatPopover.contains(E) && ((se = t._closeFormatPopover) == null || se.call(t)), (oe = E == null ? void 0 : E.closest) != null && oe.call(E, ".mjr-mfv-idrop") || (ie = (yt = t.element) == null ? void 0 : yt.querySelectorAll) == null || ie.call(yt, ".mjr-mfv-idrop-menu.is-open").forEach((we) => we.classList.remove("is-open"));
  }, t._bindDocumentUiHandlers(), n;
}
function zs(t) {
  var n, s, o, i, r, l, c, a, d, u, m, h, f, p, _, y, g, b, A, C, S;
  try {
    (n = t._btnAC) == null || n.abort();
  } catch (M) {
    (s = console.debug) == null || s.call(console, M);
  }
  t._btnAC = new AbortController();
  const e = t._btnAC.signal;
  (o = t._closeBtn) == null || o.addEventListener(
    "click",
    () => {
      t._dispatchControllerAction("close", lt.MFV_CLOSE);
    },
    { signal: e }
  ), (i = t._modeSelect) == null || i.addEventListener(
    "change",
    () => {
      var x;
      const M = (x = t._modeSelect) == null ? void 0 : x.value;
      M && t.setMode(M);
    },
    { signal: e }
  ), (r = t._pinGroup) == null || r.addEventListener(
    "click",
    (M) => {
      var k, I;
      const x = (I = (k = M.target) == null ? void 0 : k.closest) == null ? void 0 : I.call(k, ".mjr-mfv-pin-btn");
      if (!x) return;
      const j = x.dataset.slot;
      j && (t._pinnedSlots.has(j) ? t._pinnedSlots.delete(j) : t._pinnedSlots.add(j), t._pinnedSlots.has("C") || t._pinnedSlots.has("D") ? t._mode !== P.GRID && t.setMode(P.GRID) : t._pinnedSlots.size > 0 && t._mode === P.SIMPLE && t.setMode(P.AB), t._updatePinUI());
    },
    { signal: e }
  ), (l = t._liveBtn) == null || l.addEventListener(
    "click",
    () => {
      t._dispatchControllerAction("toggleLive", lt.MFV_LIVE_TOGGLE);
    },
    { signal: e }
  ), (c = t._previewBtn) == null || c.addEventListener(
    "click",
    () => {
      t._dispatchControllerAction("togglePreview", lt.MFV_PREVIEW_TOGGLE);
    },
    { signal: e }
  ), (a = t._nodeStreamBtn) == null || a.addEventListener(
    "click",
    () => {
      t._dispatchControllerAction("toggleNodeStream", lt.MFV_NODESTREAM_TOGGLE);
    },
    { signal: e }
  ), (d = t._genBtn) == null || d.addEventListener(
    "click",
    (M) => {
      var x, j, k;
      M.stopPropagation(), (j = (x = t._genDropdown) == null ? void 0 : x.classList) != null && j.contains("is-visible") ? t._closeGenDropdown() : ((k = t._closeAllToolbarPopovers) == null || k.call(t), t._openGenDropdown());
    },
    { signal: e }
  ), (u = t._popoutBtn) == null || u.addEventListener(
    "click",
    () => {
      t._dispatchControllerAction("popOut", lt.MFV_POPOUT);
    },
    { signal: e }
  ), (m = t._captureBtn) == null || m.addEventListener("click", () => t._captureView(), { signal: e }), (h = t._settingsBtn) == null || h.addEventListener(
    "click",
    () => {
      var M, x;
      (M = t._sidebar) == null || M.toggle(), t._updateSettingsBtnState(((x = t._sidebar) == null ? void 0 : x.isVisible) ?? !1);
    },
    { signal: e }
  ), (f = t._guidesSelect) == null || f.addEventListener(
    "change",
    () => {
      var M, x;
      t._gridMode = Number(t._guidesSelect.value) || 0, (M = t._guideBtn) == null || M.classList.toggle("is-on", t._gridMode !== 0), (x = t._redrawOverlayGuides) == null || x.call(t);
    },
    { signal: e }
  ), (p = t._channelSelect) == null || p.addEventListener(
    "change",
    () => {
      var M, x;
      t._channel = String(t._channelSelect.value || "rgb"), (M = t._chBtn) == null || M.classList.toggle("is-on", t._channel !== "rgb"), (x = t._applyMediaToneControls) == null || x.call(t);
    },
    { signal: e }
  ), (y = (_ = t._exposureCtl) == null ? void 0 : _.input) == null || y.addEventListener(
    "input",
    () => {
      var x;
      const M = Math.max(-10, Math.min(10, Number(t._exposureCtl.input.value) || 0));
      t._exposureEV = Math.round(M * 10) / 10, t._exposureCtl.out.textContent = `${t._exposureEV.toFixed(1)}EV`, t._exposureCtl.wrap.classList.toggle("is-active", t._exposureEV !== 0), (x = t._applyMediaToneControls) == null || x.call(t);
    },
    { signal: e }
  ), (b = (g = t._exposureCtl) == null ? void 0 : g.out) == null || b.addEventListener(
    "click",
    () => {
      var M;
      t._exposureEV = 0, t._exposureCtl.input.value = "0", t._exposureCtl.out.textContent = "0.0EV", t._exposureCtl.wrap.classList.remove("is-active"), (M = t._applyMediaToneControls) == null || M.call(t);
    },
    { signal: e }
  ), (A = t._formatSelect) == null || A.addEventListener(
    "change",
    () => {
      var x, j, k;
      const M = String(t._formatSelect.value || "image");
      M === "off" ? t._overlayMaskEnabled = !1 : (t._overlayMaskEnabled = !0, t._overlayFormat = M), (x = t._formatToggle) == null || x.classList.toggle("is-on", !!t._overlayMaskEnabled), (j = t._formatToggle) == null || j.setAttribute(
        "aria-pressed",
        String(!!t._overlayMaskEnabled)
      ), (k = t._redrawOverlayGuides) == null || k.call(t);
    },
    { signal: e }
  ), (S = (C = t._maskOpacityCtl) == null ? void 0 : C.input) == null || S.addEventListener(
    "input",
    () => {
      var j;
      const M = Number(t._maskOpacityCtl.input.value), x = Math.max(0, Math.min(0.9, Number.isFinite(M) ? M : 0.65));
      t._overlayMaskOpacity = Math.round(x * 100) / 100, t._maskOpacityCtl.out.textContent = t._overlayMaskOpacity.toFixed(2), (j = t._redrawOverlayGuides) == null || j.call(t);
    },
    { signal: e }
  );
}
function Ys(t, e) {
  t._settingsBtn && (t._settingsBtn.classList.toggle("active", !!e), t._settingsBtn.setAttribute("aria-pressed", String(!!e)));
}
function ws(t) {
  var n;
  if (!t._contentWrapper) return;
  const e = mt.MFV_SIDEBAR_POSITION || "right";
  t._contentWrapper.setAttribute("data-sidebar-pos", e), (n = t._sidebar) != null && n.el && t._contentEl && (e === "left" ? t._contentWrapper.insertBefore(t._sidebar.el, t._contentEl) : t._contentWrapper.appendChild(t._sidebar.el));
}
function Qs(t) {
  var e, n, s;
  t._closeGenDropdown();
  try {
    (n = (e = t._genDropdown) == null ? void 0 : e.remove) == null || n.call(e);
  } catch (o) {
    (s = console.debug) == null || s.call(console, o);
  }
  t._genDropdown = null, t._updateGenBtnUI();
}
function Xs(t) {
  var n, s, o;
  if (!t._handleDocClick) return;
  const e = ((n = t.element) == null ? void 0 : n.ownerDocument) || document;
  if (t._docClickHost !== e) {
    t._unbindDocumentUiHandlers();
    try {
      (s = t._docAC) == null || s.abort();
    } catch (i) {
      (o = console.debug) == null || o.call(console, i);
    }
    t._docAC = new AbortController(), e.addEventListener("click", t._handleDocClick, { signal: t._docAC.signal }), t._docClickHost = e;
  }
}
function qs(t) {
  var e, n;
  try {
    (e = t._docAC) == null || e.abort();
  } catch (s) {
    (n = console.debug) == null || n.call(console, s);
  }
  t._docAC = new AbortController(), t._docClickHost = null;
}
function Ks(t) {
  var e, n;
  return !!((n = (e = t._genDropdown) == null ? void 0 : e.classList) != null && n.contains("is-visible"));
}
function Zs(t) {
  if (!t.element) return;
  t._genDropdown || (t._genDropdown = t._buildGenDropdown(), t.element.appendChild(t._genDropdown)), t._bindDocumentUiHandlers();
  const e = t._genBtn.getBoundingClientRect(), n = t.element.getBoundingClientRect(), s = e.left - n.left, o = e.bottom - n.top + 6;
  t._genDropdown.style.left = `${s}px`, t._genDropdown.style.top = `${o}px`, t._genDropdown.classList.add("is-visible"), t._updateGenBtnUI();
}
function Js(t) {
  t._genDropdown && (t._genDropdown.classList.remove("is-visible"), t._updateGenBtnUI());
}
function $s(t) {
  if (!t._genBtn) return;
  const e = t._genInfoSelections.size, n = e > 0, s = t._isGenDropdownOpen();
  t._genBtn.classList.toggle("is-on", n), t._genBtn.classList.toggle("is-open", s);
  const o = n ? `Gen Info (${e} field${e > 1 ? "s" : ""} shown)${s ? " — open" : " — click to configure"}` : `Gen Info${s ? " — open" : " — click to show overlay"}`;
  t._genBtn.title = o, t._genBtn.setAttribute("aria-label", o), t._genBtn.setAttribute("aria-expanded", String(s)), t._genDropdown ? t._genBtn.setAttribute("aria-controls", t._genDropdownId) : t._genBtn.removeAttribute("aria-controls");
}
function to(t) {
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
  for (const [s, o] of n) {
    const i = document.createElement("label");
    i.className = "mjr-mfv-gen-dropdown-row";
    const r = document.createElement("input");
    r.type = "checkbox", r.checked = t._genInfoSelections.has(s), r.addEventListener("change", () => {
      r.checked ? t._genInfoSelections.add(s) : t._genInfoSelections.delete(s), t._updateGenBtnUI(), t._refresh();
    });
    const l = document.createElement("span");
    l.textContent = o, i.appendChild(r), i.appendChild(l), e.appendChild(i);
  }
  return e;
}
function be(t) {
  const e = Number(t);
  return !Number.isFinite(e) || e <= 0 ? "" : e >= 60 ? `${(e / 60).toFixed(1)}m` : `${e.toFixed(1)}s`;
}
function eo(t) {
  const e = String(t || "").trim().toLowerCase();
  if (!e) return 0;
  if (e.endsWith("m")) {
    const s = Number.parseFloat(e.slice(0, -1));
    return Number.isFinite(s) ? s * 60 : 0;
  }
  if (e.endsWith("s")) {
    const s = Number.parseFloat(e.slice(0, -1));
    return Number.isFinite(s) ? s : 0;
  }
  const n = Number.parseFloat(e);
  return Number.isFinite(n) ? n : 0;
}
function no(t, e) {
  var i, r, l, c;
  if (!e) return {};
  try {
    const a = e.geninfo ? { geninfo: e.geninfo } : e.metadata || e.metadata_raw || e, d = an(a) || null, u = {
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
    if (d && typeof d == "object") {
      d.prompt && (u.prompt = jt(String(d.prompt))), d.seed != null && (u.seed = String(d.seed)), d.model && (u.model = Array.isArray(d.model) ? d.model.join(", ") : String(d.model));
      const m = Os(d), h = vs(d);
      h && (u.model = h), m && (u.model = [m, u.model].filter(Boolean).join(" | ")), Array.isArray(d.loras) && (u.lora = d.loras.map(
        (p) => typeof p == "string" ? p : (p == null ? void 0 : p.name) || (p == null ? void 0 : p.lora_name) || (p == null ? void 0 : p.model_name) || ""
      ).filter(Boolean).join(", ")), d.sampler && (u.sampler = String(d.sampler)), d.scheduler && (u.scheduler = String(d.scheduler)), d.cfg != null && (u.cfg = String(d.cfg)), d.steps != null && (u.step = String(d.steps)), !u.prompt && (a != null && a.prompt) && (u.prompt = jt(String(a.prompt || "")));
      const f = e.generation_time_ms ?? ((i = e.metadata_raw) == null ? void 0 : i.generation_time_ms) ?? (a == null ? void 0 : a.generation_time_ms) ?? ((r = a == null ? void 0 : a.geninfo) == null ? void 0 : r.generation_time_ms) ?? 0;
      return f && Number.isFinite(Number(f)) && f > 0 && f < 864e5 && (u.genTime = be(Number(f) / 1e3)), u;
    }
  } catch (a) {
    (l = console.debug) == null || l.call(console, "[MFV] geninfo normalize failed", a);
  }
  const n = (e == null ? void 0 : e.metadata) || (e == null ? void 0 : e.metadata_raw) || e || {}, s = {
    prompt: jt(String((n == null ? void 0 : n.prompt) || (n == null ? void 0 : n.positive) || "")),
    seed: (n == null ? void 0 : n.seed) != null ? String(n.seed) : "",
    model: (n == null ? void 0 : n.checkpoint) || (n == null ? void 0 : n.ckpt_name) || (n == null ? void 0 : n.model) || "",
    lora: Array.isArray(n == null ? void 0 : n.loras) ? n.loras.join(", ") : (n == null ? void 0 : n.lora) || "",
    sampler: (n == null ? void 0 : n.sampler_name) || (n == null ? void 0 : n.sampler) || "",
    scheduler: (n == null ? void 0 : n.scheduler) || "",
    cfg: (n == null ? void 0 : n.cfg) != null ? String(n.cfg) : (n == null ? void 0 : n.cfg_scale) != null ? String(n.cfg_scale) : "",
    step: (n == null ? void 0 : n.steps) != null ? String(n.steps) : "",
    genTime: ""
  }, o = e.generation_time_ms ?? ((c = e.metadata_raw) == null ? void 0 : c.generation_time_ms) ?? (n == null ? void 0 : n.generation_time_ms) ?? 0;
  return o && Number.isFinite(Number(o)) && o > 0 && o < 864e5 && (s.genTime = be(Number(o) / 1e3)), s;
}
function so(t, e) {
  const n = t._getGenFields(e);
  if (!n) return null;
  const s = document.createDocumentFragment(), o = [
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
    if (!t._genInfoSelections.has(i)) continue;
    const r = n[i] != null ? String(n[i]) : "";
    if (!r) continue;
    let l = i.charAt(0).toUpperCase() + i.slice(1);
    i === "lora" ? l = "LoRA" : i === "cfg" ? l = "CFG" : i === "genTime" && (l = "Gen Time");
    const c = document.createElement("div");
    c.dataset.field = i;
    const a = document.createElement("strong");
    if (a.textContent = `${l}: `, c.appendChild(a), i === "prompt")
      c.appendChild(document.createTextNode(r));
    else if (i === "genTime") {
      const d = eo(r);
      let u = "#4CAF50";
      d >= 60 ? u = "#FF9800" : d >= 30 ? u = "#FFC107" : d >= 10 && (u = "#8BC34A");
      const m = document.createElement("span");
      m.style.color = u, m.style.fontWeight = "600", m.textContent = r, c.appendChild(m);
    } else
      c.appendChild(document.createTextNode(r));
    s.appendChild(c);
  }
  return s.childNodes.length > 0 ? s : null;
}
function oo(t) {
  var e, n, s;
  try {
    (n = (e = t._controller) == null ? void 0 : e.onModeChanged) == null || n.call(e, t._mode);
  } catch (o) {
    (s = console.debug) == null || s.call(console, o);
  }
}
function io(t) {
  const e = [P.SIMPLE, P.AB, P.SIDE, P.GRID, P.GRAPH];
  t._mode = e[(e.indexOf(t._mode) + 1) % e.length], t._updateModeBtnUI(), t._refresh(), t._notifyModeChanged();
}
function ro(t, e) {
  Object.values(P).includes(e) && (t._mode = e, t._updateModeBtnUI(), t._refresh(), t._notifyModeChanged());
}
function ao(t) {
  return t._pinnedSlots;
}
function lo(t) {
  var e, n;
  if (t._pinBtns) {
    for (const s of ["A", "B", "C", "D"]) {
      const o = t._pinBtns[s];
      if (!o) continue;
      const i = t._pinnedSlots.has(s);
      o.classList.toggle("is-pinned", i), o.setAttribute("aria-pressed", String(i)), o.title = i ? `Unpin Asset ${s}` : `Pin Asset ${s}`;
    }
    (n = t._pinBtn) == null || n.classList.toggle("is-on", (((e = t._pinnedSlots) == null ? void 0 : e.size) ?? 0) > 0);
  }
}
function co(t) {
  var r, l;
  if (!t._modeBtn) return;
  const e = {
    [P.SIMPLE]: { icon: "pi-image", label: "Mode: Simple - click to switch" },
    [P.AB]: { icon: "pi-clone", label: "Mode: A/B Compare - click to switch" },
    [P.SIDE]: { icon: "pi-table", label: "Mode: Side-by-Side - click to switch" },
    [P.GRID]: {
      icon: "pi-th-large",
      label: "Mode: Grid Compare (up to 4) - click to switch"
    },
    [P.GRAPH]: {
      icon: "pi-sitemap",
      label: "Mode: Graph Map - click to switch"
    }
  }, { icon: n = "pi-image", label: s = "" } = e[t._mode] || {}, o = Lt(s, hn), i = document.createElement("i");
  i.className = `pi ${n}`, i.setAttribute("aria-hidden", "true"), t._modeBtn.replaceChildren(i), t._modeBtn.title = o, t._modeBtn.setAttribute("aria-label", o), t._modeBtn.removeAttribute("aria-pressed"), t._modeBtn.classList.toggle("is-on", t._mode !== P.SIMPLE), (l = (r = t._modeDrop) == null ? void 0 : r.selectItem) == null || l.call(r, t._mode);
}
function uo(t, e) {
  if (!t._liveBtn) return;
  const n = !!e;
  t._liveBtn.classList.toggle("mjr-live-active", n);
  const s = n ? V(
    "tooltip.liveStreamOn",
    "Live Stream: ON - follows final generation outputs after execution"
  ) : V("tooltip.liveStreamOff", "Live Stream: OFF - click to follow final generation outputs"), o = Lt(s, Be);
  t._liveBtn.setAttribute("aria-pressed", String(n)), t._liveBtn.setAttribute("aria-label", o);
  const i = document.createElement("i");
  i.className = n ? "pi pi-circle-fill" : "pi pi-circle", i.setAttribute("aria-hidden", "true"), t._liveBtn.replaceChildren(i), t._liveBtn.title = o;
}
function po(t, e) {
  if (t._previewActive = !!e, !t._previewBtn) return;
  t._previewBtn.classList.toggle("mjr-preview-active", t._previewActive);
  const n = t._previewActive ? V(
    "tooltip.previewStreamOn",
    "KSampler Preview: ON - streams sampler denoising frames during execution"
  ) : V(
    "tooltip.previewStreamOff",
    "KSampler Preview: OFF - click to stream sampler denoising frames"
  ), s = Lt(n, Le);
  t._previewBtn.setAttribute("aria-pressed", String(t._previewActive)), t._previewBtn.setAttribute("aria-label", s);
  const o = document.createElement("i");
  o.className = t._previewActive ? "pi pi-eye" : "pi pi-eye-slash", o.setAttribute("aria-hidden", "true"), t._previewBtn.replaceChildren(o), t._previewBtn.title = s, t._previewActive || t._revokePreviewBlob();
}
function mo(t, e, n = {}) {
  if (!e || !(e instanceof Blob)) return;
  t._revokePreviewBlob();
  const s = URL.createObjectURL(e);
  t._previewBlobUrl = s;
  const o = {
    url: s,
    filename: "preview.jpg",
    kind: "image",
    _isPreview: !0,
    _sourceLabel: (n == null ? void 0 : n.sourceLabel) || null
  };
  if (t._mode === P.AB || t._mode === P.SIDE || t._mode === P.GRID) {
    const r = t.getPinnedSlots();
    if (t._mode === P.GRID) {
      const l = ["A", "B", "C", "D"].find((c) => !r.has(c)) || "A";
      t[`_media${l}`] = o;
    } else r.has("B") ? t._mediaA = o : t._mediaB = o;
  } else
    t._mediaA = o, t._resetMfvZoom(), t._mode !== P.SIMPLE && (t._mode = P.SIMPLE, t._updateModeBtnUI());
  ++t._refreshGen, t._refresh();
}
function ho(t) {
  if (t._previewBlobUrl) {
    try {
      URL.revokeObjectURL(t._previewBlobUrl);
    } catch {
    }
    t._previewBlobUrl = null;
  }
}
function fo(t, e) {
  var i;
  if (t._nodeStreamActive = !!e, t._nodeStreamActive || (i = t.setNodeStreamSelection) == null || i.call(t, null), !t._nodeStreamBtn) return;
  t._nodeStreamBtn.classList.toggle("mjr-nodestream-active", t._nodeStreamActive);
  const n = t._nodeStreamActive ? V(
    "tooltip.nodeStreamOn",
    "Node Stream: ON - follows the selected node preview when frontend media exists"
  ) : V(
    "tooltip.nodeStreamOff",
    "Node Stream: OFF - click to follow selected node previews, including ImageOps live canvases"
  ), s = Lt(n, Pe);
  t._nodeStreamBtn.setAttribute("aria-pressed", String(t._nodeStreamActive)), t._nodeStreamBtn.setAttribute("aria-label", s);
  const o = document.createElement("i");
  o.className = "pi pi-sitemap", o.setAttribute("aria-hidden", "true"), t._nodeStreamBtn.replaceChildren(o), t._nodeStreamBtn.title = s;
}
const _o = [
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
function go() {
  var t, e, n, s, o;
  try {
    const i = typeof window < "u" ? window : globalThis, r = (e = (t = i == null ? void 0 : i.process) == null ? void 0 : t.versions) == null ? void 0 : e.electron;
    if (typeof r == "string" && r.trim() || i != null && i.electron || i != null && i.ipcRenderer || i != null && i.electronAPI)
      return !0;
    const l = String(
      ((n = i == null ? void 0 : i.navigator) == null ? void 0 : n.userAgent) || ((s = globalThis == null ? void 0 : globalThis.navigator) == null ? void 0 : s.userAgent) || ""
    ), c = /\bElectron\//i.test(l), a = /\bCode\//i.test(l);
    if (c && !a)
      return !0;
  } catch (i) {
    (o = console.debug) == null || o.call(console, i);
  }
  return !1;
}
function U(t, e = null, n = "info") {
  var o, i;
  const s = {
    stage: String(t || "unknown"),
    detail: e,
    ts: Date.now()
  };
  try {
    const r = typeof window < "u" ? window : globalThis, l = "__MJR_MFV_POPOUT_TRACE__", c = Array.isArray(r[l]) ? r[l] : [];
    c.push(s), r[l] = c.slice(-20), r.__MJR_MFV_POPOUT_LAST__ = s;
  } catch (r) {
    (o = console.debug) == null || o.call(console, r);
  }
  try {
    const r = n === "error" ? console.error : n === "warn" ? console.warn : console.info;
    r == null || r("[MFV popout]", s);
  } catch (r) {
    (i = console.debug) == null || i.call(console, r);
  }
}
function ye(t, ...e) {
  return Array.from(
    new Set(
      [String(t || ""), ...e].join(" ").split(/\s+/).filter(Boolean)
    )
  ).join(" ");
}
function Ce(t, e) {
  var n;
  if (!(!t || !e))
    for (const s of Array.from(t.attributes || [])) {
      const o = String((s == null ? void 0 : s.name) || "");
      if (!(!o || o === "class" || o === "style"))
        try {
          e.setAttribute(o, s.value);
        } catch (i) {
          (n = console.debug) == null || n.call(console, i);
        }
    }
}
function Ae(t, e) {
  var o, i, r, l, c;
  if (!t || !(e != null && e.style)) return;
  const n = typeof window < "u" && (window == null ? void 0 : window.getComputedStyle) || (globalThis == null ? void 0 : globalThis.getComputedStyle);
  if (typeof n != "function") return;
  let s = null;
  try {
    s = n(t);
  } catch (a) {
    (o = console.debug) == null || o.call(console, a);
  }
  if (s) {
    for (const a of _o)
      try {
        const d = String(((i = s.getPropertyValue) == null ? void 0 : i.call(s, a)) || "").trim();
        d && e.style.setProperty(a, d);
      } catch (d) {
        (r = console.debug) == null || r.call(console, d);
      }
    try {
      const a = String(((l = s.getPropertyValue) == null ? void 0 : l.call(s, "color-scheme")) || "").trim();
      a && (e.style.colorScheme = a);
    } catch (a) {
      (c = console.debug) == null || c.call(console, a);
    }
  }
}
function bo(t) {
  if (!(t != null && t.documentElement) || !(t != null && t.body) || !(document != null && document.documentElement)) return;
  const e = document.documentElement, n = document.body, s = t.documentElement, o = t.body;
  s.className = ye(
    e.className,
    "mjr-mfv-popout-document"
  ), o.className = ye(
    n == null ? void 0 : n.className,
    "mjr-mfv-popout-body"
  ), Ce(e, s), Ce(n, o), Ae(e, s), Ae(n, o), e != null && e.lang && (s.lang = e.lang), e != null && e.dir && (s.dir = e.dir);
}
function Ye(t) {
  var n, s, o;
  if (!(t != null && t.body)) return null;
  try {
    const i = (n = t.getElementById) == null ? void 0 : n.call(t, "mjr-mfv-popout-root");
    (s = i == null ? void 0 : i.remove) == null || s.call(i);
  } catch (i) {
    (o = console.debug) == null || o.call(console, i);
  }
  const e = t.createElement("div");
  return e.id = "mjr-mfv-popout-root", e.className = "mjr-mfv-popout-root", t.body.appendChild(e), e;
}
function yo(t, e) {
  if (!t.element) return;
  const n = !!e;
  if (t._desktopExpanded === n) return;
  const s = t.element;
  if (n) {
    t._desktopExpandRestore = {
      parent: s.parentNode || null,
      nextSibling: s.nextSibling || null,
      styleAttr: s.getAttribute("style")
    }, s.parentNode !== document.body && document.body.appendChild(s), s.classList.add("mjr-mfv--desktop-expanded", "is-visible"), s.setAttribute("aria-hidden", "false"), s.style.position = "fixed", s.style.top = "12px", s.style.left = "12px", s.style.right = "12px", s.style.bottom = "12px", s.style.width = "auto", s.style.height = "auto", s.style.maxWidth = "none", s.style.maxHeight = "none", s.style.minWidth = "320px", s.style.minHeight = "240px", s.style.resize = "none", s.style.margin = "0", s.style.zIndex = "2147483000", t._desktopExpanded = !0, t.isVisible = !0, t._resetGenDropdownForCurrentDocument(), t._rebindControlHandlers(), t._bindPanelInteractions(), t._bindDocumentUiHandlers(), t._updatePopoutBtnUI(), U("electron-in-app-expanded", { isVisible: t.isVisible });
    return;
  }
  const o = t._desktopExpandRestore;
  t._desktopExpanded = !1, s.classList.remove("mjr-mfv--desktop-expanded"), (o == null ? void 0 : o.styleAttr) == null || o.styleAttr === "" ? s.removeAttribute("style") : s.setAttribute("style", o.styleAttr), o != null && o.parent && o.parent.isConnected && (o.nextSibling && o.nextSibling.parentNode === o.parent ? o.parent.insertBefore(s, o.nextSibling) : o.parent.appendChild(s)), t._desktopExpandRestore = null, t._resetGenDropdownForCurrentDocument(), t._rebindControlHandlers(), t._bindPanelInteractions(), t._bindDocumentUiHandlers(), t._updatePopoutBtnUI(), U("electron-in-app-restored", null);
}
function Co(t, e) {
  var n;
  t._desktopPopoutUnsupported = !0, U(
    "electron-in-app-fallback",
    { message: (e == null ? void 0 : e.message) || String(e || "unknown error") },
    "warn"
  ), t._setDesktopExpanded(!0);
  try {
    dn(
      V(
        "toast.popoutElectronInAppFallback",
        "Desktop PiP is unavailable here. Viewer expanded inside the app instead."
      ),
      "warning",
      4500
    );
  } catch (s) {
    (n = console.debug) == null || n.call(console, s);
  }
}
function Ao(t, e, n, s, o) {
  return U(
    "electron-popup-fallback-attempt",
    { reason: (o == null ? void 0 : o.message) || String(o || "unknown") },
    "warn"
  ), t._fallbackPopout(e, n, s), t._popoutWindow ? (t._desktopPopoutUnsupported = !1, U("electron-popup-fallback-opened", null), !0) : !1;
}
function So(t) {
  var l, c;
  if (t._isPopped || !t.element) return;
  const e = t.element;
  t._stopEdgeResize();
  const n = go(), s = typeof window < "u" && "documentPictureInPicture" in window, o = String(
    ((l = window == null ? void 0 : window.navigator) == null ? void 0 : l.userAgent) || ((c = globalThis == null ? void 0 : globalThis.navigator) == null ? void 0 : c.userAgent) || ""
  ), i = Math.max(e.offsetWidth || 520, 400), r = Math.max(e.offsetHeight || 420, 300);
  if (U("start", {
    isElectronHost: n,
    hasDocumentPiP: s,
    userAgent: o,
    width: i,
    height: r,
    desktopPopoutUnsupported: t._desktopPopoutUnsupported
  }), n && t._desktopPopoutUnsupported) {
    U("electron-in-app-fallback-reuse", null), t._setDesktopExpanded(!0);
    return;
  }
  if (!(n && (U("electron-popup-request", { width: i, height: r }), t._tryElectronPopupFallback(e, i, r, new Error("Desktop popup requested"))))) {
    if (n && "documentPictureInPicture" in window) {
      U("electron-pip-request", { width: i, height: r }), window.documentPictureInPicture.requestWindow({ width: i, height: r }).then((a) => {
        var f, p, _;
        U("electron-pip-opened", {
          hasDocument: !!(a != null && a.document)
        }), t._popoutWindow = a, t._isPopped = !0, t._popoutRestoreGuard = !1;
        try {
          (f = t._popoutAC) == null || f.abort();
        } catch (y) {
          (p = console.debug) == null || p.call(console, y);
        }
        t._popoutAC = new AbortController();
        const d = t._popoutAC.signal, u = () => t._schedulePopInFromPopupClose();
        t._popoutCloseHandler = u;
        const m = a.document;
        m.title = "Majoor Viewer", t._installPopoutStyles(m);
        const h = Ye(m);
        if (!h) {
          t._activateDesktopExpandedFallback(
            new Error("Popup root creation failed")
          );
          return;
        }
        try {
          const y = typeof m.adoptNode == "function" ? m.adoptNode(e) : e;
          h.appendChild(y), U("electron-pip-adopted", {
            usedAdoptNode: typeof m.adoptNode == "function"
          });
        } catch (y) {
          U(
            "electron-pip-adopt-failed",
            { message: (y == null ? void 0 : y.message) || String(y) },
            "warn"
          ), console.warn("[MFV] PiP adoptNode failed", y), t._isPopped = !1, t._popoutWindow = null;
          try {
            a.close();
          } catch (g) {
            (_ = console.debug) == null || _.call(console, g);
          }
          t._activateDesktopExpandedFallback(y);
          return;
        }
        e.classList.add("is-visible"), t.isVisible = !0, t._resetGenDropdownForCurrentDocument(), t._rebindControlHandlers(), t._bindDocumentUiHandlers(), t._updatePopoutBtnUI(), U("electron-pip-ready", { isPopped: t._isPopped }), a.addEventListener("pagehide", u, {
          signal: d
        }), t._startPopoutCloseWatch(), t._popoutKeydownHandler = (y) => {
          var b, A;
          const g = String(((b = y == null ? void 0 : y.target) == null ? void 0 : b.tagName) || "").toLowerCase();
          y != null && y.defaultPrevented || (A = y == null ? void 0 : y.target) != null && A.isContentEditable || g === "input" || g === "textarea" || g === "select" || t._forwardKeydownToController(y);
        }, a.addEventListener("keydown", t._popoutKeydownHandler, {
          signal: d
        });
      }).catch((a) => {
        U(
          "electron-pip-request-failed",
          { message: (a == null ? void 0 : a.message) || String(a) },
          "warn"
        ), t._activateDesktopExpandedFallback(a);
      });
      return;
    }
    if (n) {
      U("electron-no-pip-api", { hasDocumentPiP: s }), t._activateDesktopExpandedFallback(
        new Error("Document Picture-in-Picture unavailable after popup failure")
      );
      return;
    }
    U("browser-fallback-popup", { width: i, height: r }), t._fallbackPopout(e, i, r);
  }
}
function Eo(t, e, n, s) {
  var u, m, h, f;
  U("browser-popup-open", { width: n, height: s });
  const o = (window.screenX || window.screenLeft) + Math.round((window.outerWidth - n) / 2), i = (window.screenY || window.screenTop) + Math.round((window.outerHeight - s) / 2), r = `width=${n},height=${s},left=${o},top=${i},resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,status=no`, l = window.open("about:blank", "_mjr_viewer", r);
  if (!l) {
    U("browser-popup-blocked", null, "warn"), console.warn("[MFV] Pop-out blocked — allow popups for this site.");
    return;
  }
  U("browser-popup-opened", { hasDocument: !!(l != null && l.document) }), t._popoutWindow = l, t._isPopped = !0, t._popoutRestoreGuard = !1;
  try {
    (u = t._popoutAC) == null || u.abort();
  } catch (p) {
    (m = console.debug) == null || m.call(console, p);
  }
  t._popoutAC = new AbortController();
  const c = t._popoutAC.signal, a = () => t._schedulePopInFromPopupClose();
  t._popoutCloseHandler = a;
  const d = () => {
    let p;
    try {
      p = l.document;
    } catch {
      return;
    }
    if (!p) return;
    p.title = "Majoor Viewer", t._installPopoutStyles(p);
    const _ = Ye(p);
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
    d();
  } catch (p) {
    (h = console.debug) == null || h.call(console, "[MFV] immediate mount failed, retrying on load", p);
    try {
      l.addEventListener("load", d, { signal: c });
    } catch (_) {
      (f = console.debug) == null || f.call(console, "[MFV] pop-out page load listener failed", _);
    }
  }
  l.addEventListener("beforeunload", a, { signal: c }), l.addEventListener("pagehide", a, { signal: c }), l.addEventListener("unload", a, { signal: c }), t._startPopoutCloseWatch(), t._popoutKeydownHandler = (p) => {
    var y, g;
    const _ = String(((y = p == null ? void 0 : p.target) == null ? void 0 : y.tagName) || "").toLowerCase();
    p != null && p.defaultPrevented || (g = p == null ? void 0 : p.target) != null && g.isContentEditable || _ === "input" || _ === "textarea" || _ === "select" || t._forwardKeydownToController(p);
  }, l.addEventListener("keydown", t._popoutKeydownHandler, { signal: c });
}
function Mo(t) {
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
function No(t) {
  t._clearPopoutCloseWatch(), t._popoutCloseTimer = window.setInterval(() => {
    if (!t._isPopped) {
      t._clearPopoutCloseWatch();
      return;
    }
    const e = t._popoutWindow;
    (!e || e.closed) && (t._clearPopoutCloseWatch(), t._schedulePopInFromPopupClose());
  }, 250);
}
function Bo(t) {
  !t._isPopped || t._popoutRestoreGuard || (t._popoutRestoreGuard = !0, window.setTimeout(() => {
    try {
      t.popIn({ closePopupWindow: !1 });
    } finally {
      t._popoutRestoreGuard = !1;
    }
  }, 0));
}
function Lo(t, e) {
  var s, o, i;
  if (!(e != null && e.head)) return;
  try {
    for (const r of e.head.querySelectorAll("[data-mjr-popout-cloned-style='1']"))
      r.remove();
  } catch (r) {
    (s = console.debug) == null || s.call(console, r);
  }
  bo(e);
  try {
    const r = document.documentElement.style.cssText;
    if (r) {
      const l = e.createElement("style");
      l.setAttribute("data-mjr-popout-cloned-style", "1"), l.textContent = `:root { ${r} }`, e.head.appendChild(l);
    }
  } catch (r) {
    (o = console.debug) == null || o.call(console, r);
  }
  for (const r of document.querySelectorAll('link[rel="stylesheet"], style'))
    try {
      let l = null;
      if (r.tagName === "LINK") {
        l = e.createElement("link");
        for (const c of Array.from(r.attributes || []))
          (c == null ? void 0 : c.name) !== "href" && l.setAttribute(c.name, c.value);
        l.setAttribute("href", r.href || r.getAttribute("href") || "");
      } else
        l = e.importNode(r, !0);
      l.setAttribute("data-mjr-popout-cloned-style", "1"), e.head.appendChild(l);
    } catch (l) {
      (i = console.debug) == null || i.call(console, l);
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
function Po(t, { closePopupWindow: e = !0 } = {}) {
  var o, i, r, l;
  if (t._desktopExpanded) {
    t._setDesktopExpanded(!1);
    return;
  }
  if (!t._isPopped || !t.element) return;
  const n = t._popoutWindow;
  t._clearPopoutCloseWatch();
  try {
    (o = t._popoutAC) == null || o.abort();
  } catch (c) {
    (i = console.debug) == null || i.call(console, c);
  }
  t._popoutAC = null, t._popoutCloseHandler = null, t._popoutKeydownHandler = null, t._isPopped = !1;
  let s = t.element;
  try {
    s = (s == null ? void 0 : s.ownerDocument) === document ? s : document.adoptNode(s);
  } catch (c) {
    (r = console.debug) == null || r.call(console, "[MFV] pop-in adopt failed", c);
  }
  if (document.body.appendChild(s), t._resetGenDropdownForCurrentDocument(), t._rebindControlHandlers(), t._bindPanelInteractions(), t._bindDocumentUiHandlers(), s.classList.add("is-visible"), s.setAttribute("aria-hidden", "false"), t.isVisible = !0, t._updatePopoutBtnUI(), e)
    try {
      n == null || n.close();
    } catch (c) {
      (l = console.debug) == null || l.call(console, c);
    }
  t._popoutWindow = null;
}
function Io(t) {
  if (!t._popoutBtn) return;
  const e = t._isPopped || t._desktopExpanded;
  t.element && t.element.classList.toggle("mjr-mfv--popped", e), t._popoutBtn.classList.toggle("mjr-popin-active", e);
  const n = t._popoutBtn.querySelector("i") || document.createElement("i"), s = e ? V("tooltip.popInViewer", "Return to floating panel") : V("tooltip.popOutViewer", "Pop out viewer to separate window");
  n.className = e ? "pi pi-sign-in" : "pi pi-external-link", t._popoutBtn.title = s, t._popoutBtn.setAttribute("aria-label", s), t._popoutBtn.setAttribute("aria-pressed", String(e)), t._popoutBtn.contains(n) || t._popoutBtn.replaceChildren(n);
}
function xo(t) {
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
function jo(t, e, n) {
  if (!n) return "";
  const s = t <= n.left + At, o = t >= n.right - At, i = e <= n.top + At, r = e >= n.bottom - At;
  return i && s ? "nw" : i && o ? "ne" : r && s ? "sw" : r && o ? "se" : i ? "n" : r ? "s" : s ? "w" : o ? "e" : "";
}
function ko(t) {
  var e, n;
  if (t.element) {
    if (((e = t._resizeState) == null ? void 0 : e.pointerId) != null)
      try {
        t.element.releasePointerCapture(t._resizeState.pointerId);
      } catch (s) {
        (n = console.debug) == null || n.call(console, s);
      }
    t._resizeState = null, t.element.classList.remove("mjr-mfv--resizing"), t.element.style.cursor = "";
  }
}
function To(t) {
  var e, n;
  if (t.element) {
    t._stopEdgeResize();
    try {
      (e = t._panelAC) == null || e.abort();
    } catch (s) {
      (n = console.debug) == null || n.call(console, s);
    }
    t._panelAC = new AbortController(), t._initEdgeResize(t.element), t._initDrag(t.element.querySelector(".mjr-mfv-header"));
  }
}
function Fo(t, e) {
  var l;
  if (!e) return;
  const n = (c) => {
    if (!t.element || t._isPopped) return "";
    const a = t.element.getBoundingClientRect();
    return t._getResizeDirectionFromPoint(c.clientX, c.clientY, a);
  }, s = (l = t._panelAC) == null ? void 0 : l.signal, o = (c) => {
    var f;
    if (c.button !== 0 || !t.element || t._isPopped) return;
    const a = n(c);
    if (!a) return;
    c.preventDefault(), c.stopPropagation();
    const d = t.element.getBoundingClientRect(), u = window.getComputedStyle(t.element), m = Math.max(120, Number.parseFloat(u.minWidth) || 0), h = Math.max(100, Number.parseFloat(u.minHeight) || 0);
    t._resizeState = {
      pointerId: c.pointerId,
      dir: a,
      startX: c.clientX,
      startY: c.clientY,
      startLeft: d.left,
      startTop: d.top,
      startWidth: d.width,
      startHeight: d.height,
      minWidth: m,
      minHeight: h
    }, t.element.style.left = `${Math.round(d.left)}px`, t.element.style.top = `${Math.round(d.top)}px`, t.element.style.right = "auto", t.element.style.bottom = "auto", t.element.classList.add("mjr-mfv--resizing"), t.element.style.cursor = t._resizeCursorForDirection(a);
    try {
      t.element.setPointerCapture(c.pointerId);
    } catch (p) {
      (f = console.debug) == null || f.call(console, p);
    }
  }, i = (c) => {
    if (!t.element || t._isPopped) return;
    const a = t._resizeState;
    if (!a) {
      const _ = n(c);
      t.element.style.cursor = _ ? t._resizeCursorForDirection(_) : "";
      return;
    }
    if (a.pointerId !== c.pointerId) return;
    const d = c.clientX - a.startX, u = c.clientY - a.startY;
    let m = a.startWidth, h = a.startHeight, f = a.startLeft, p = a.startTop;
    a.dir.includes("e") && (m = a.startWidth + d), a.dir.includes("s") && (h = a.startHeight + u), a.dir.includes("w") && (m = a.startWidth - d, f = a.startLeft + d), a.dir.includes("n") && (h = a.startHeight - u, p = a.startTop + u), m < a.minWidth && (a.dir.includes("w") && (f -= a.minWidth - m), m = a.minWidth), h < a.minHeight && (a.dir.includes("n") && (p -= a.minHeight - h), h = a.minHeight), m = Math.min(m, Math.max(a.minWidth, window.innerWidth)), h = Math.min(h, Math.max(a.minHeight, window.innerHeight)), f = Math.min(Math.max(0, f), Math.max(0, window.innerWidth - m)), p = Math.min(Math.max(0, p), Math.max(0, window.innerHeight - h)), t.element.style.width = `${Math.round(m)}px`, t.element.style.height = `${Math.round(h)}px`, t.element.style.left = `${Math.round(f)}px`, t.element.style.top = `${Math.round(p)}px`, t.element.style.right = "auto", t.element.style.bottom = "auto";
  }, r = (c) => {
    if (!t.element || !t._resizeState || t._resizeState.pointerId !== c.pointerId) return;
    const a = n(c);
    t._stopEdgeResize(), a && (t.element.style.cursor = t._resizeCursorForDirection(a));
  };
  e.addEventListener("pointerdown", o, { capture: !0, signal: s }), e.addEventListener("pointermove", i, { signal: s }), e.addEventListener("pointerup", r, { signal: s }), e.addEventListener("pointercancel", r, { signal: s }), e.addEventListener(
    "pointerleave",
    () => {
      !t._resizeState && t.element && (t.element.style.cursor = "");
    },
    { signal: s }
  );
}
function vo(t, e) {
  var o;
  if (!e) return;
  const n = (o = t._panelAC) == null ? void 0 : o.signal;
  let s = null;
  e.addEventListener(
    "pointerdown",
    (i) => {
      if (i.button !== 0 || i.target.closest("button") || i.target.closest("select") || t._isPopped || !t.element || t._getResizeDirectionFromPoint(
        i.clientX,
        i.clientY,
        t.element.getBoundingClientRect()
      )) return;
      i.preventDefault(), e.setPointerCapture(i.pointerId);
      try {
        s == null || s.abort();
      } catch {
      }
      s = new AbortController();
      const l = s.signal, c = t.element, a = c.getBoundingClientRect(), d = i.clientX - a.left, u = i.clientY - a.top, m = (f) => {
        const p = Math.min(
          window.innerWidth - c.offsetWidth,
          Math.max(0, f.clientX - d)
        ), _ = Math.min(
          window.innerHeight - c.offsetHeight,
          Math.max(0, f.clientY - u)
        );
        c.style.left = `${p}px`, c.style.top = `${_}px`, c.style.right = "auto", c.style.bottom = "auto";
      }, h = () => {
        try {
          s == null || s.abort();
        } catch {
        }
      };
      e.addEventListener("pointermove", m, { signal: l }), e.addEventListener("pointerup", h, { signal: l });
    },
    n ? { signal: n } : void 0
  );
}
async function Oo(t, e, n, s, o, i, r, l) {
  var h, f, p, _, y;
  if (!n) return;
  const c = X(n);
  let a = null;
  if (c === "video" && (a = l instanceof HTMLVideoElement ? l : ((h = t._contentEl) == null ? void 0 : h.querySelector("video")) || null), !a && c === "model3d") {
    const g = (n == null ? void 0 : n.id) != null ? String(n.id) : "";
    g && (a = ((p = (f = t._contentEl) == null ? void 0 : f.querySelector) == null ? void 0 : p.call(
      f,
      `.mjr-model3d-render-canvas[data-mjr-asset-id="${g}"]`
    )) || null), a || (a = ((y = (_ = t._contentEl) == null ? void 0 : _.querySelector) == null ? void 0 : y.call(_, ".mjr-model3d-render-canvas")) || null);
  }
  if (!a) {
    const g = je(n);
    if (!g) return;
    a = await new Promise((b) => {
      const A = new Image();
      A.crossOrigin = "anonymous", A.onload = () => b(A), A.onerror = () => b(null), A.src = g;
    });
  }
  if (!a) return;
  const d = a.videoWidth || a.naturalWidth || i, u = a.videoHeight || a.naturalHeight || r;
  if (!d || !u) return;
  const m = Math.min(i / d, r / u);
  e.drawImage(
    a,
    s + (i - d * m) / 2,
    o + (r - u * m) / 2,
    d * m,
    u * m
  );
}
function Go(t, e, n, s) {
  if (!e || !n || !t._genInfoSelections.size) return 0;
  const o = t._getGenFields(n), i = [
    "prompt",
    "seed",
    "model",
    "lora",
    "sampler",
    "scheduler",
    "cfg",
    "step",
    "genTime"
  ], r = 11, l = 16, c = 8, a = Math.max(100, Number(s || 0) - c * 2);
  let d = 0;
  for (const u of i) {
    if (!t._genInfoSelections.has(u)) continue;
    const m = o[u] != null ? String(o[u]) : "";
    if (!m) continue;
    let h = u.charAt(0).toUpperCase() + u.slice(1);
    u === "lora" ? h = "LoRA" : u === "cfg" ? h = "CFG" : u === "genTime" && (h = "Gen Time");
    const f = `${h}: `;
    e.font = `bold ${r}px system-ui, sans-serif`;
    const p = e.measureText(f).width;
    e.font = `${r}px system-ui, sans-serif`;
    const _ = Math.max(32, a - c * 2 - p);
    let y = 0, g = "";
    for (const b of m.split(" ")) {
      const A = g ? g + " " + b : b;
      e.measureText(A).width > _ && g ? (y += 1, g = b) : g = A;
    }
    g && (y += 1), d += y;
  }
  return d > 0 ? d * l + c * 2 : 0;
}
function Vo(t, e, n, s, o, i, r) {
  if (!n || !t._genInfoSelections.size) return;
  const l = t._getGenFields(n), c = {
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
  ], d = [];
  for (const C of a) {
    if (!t._genInfoSelections.has(C)) continue;
    const S = l[C] != null ? String(l[C]) : "";
    if (!S) continue;
    let M = C.charAt(0).toUpperCase() + C.slice(1);
    C === "lora" ? M = "LoRA" : C === "cfg" ? M = "CFG" : C === "genTime" && (M = "Gen Time"), d.push({
      label: `${M}: `,
      value: S,
      color: c[C] || "#ffffff"
    });
  }
  if (!d.length) return;
  const u = 11, m = 16, h = 8, f = Math.max(100, i - h * 2);
  e.save();
  const p = [];
  for (const { label: C, value: S, color: M } of d) {
    e.font = `bold ${u}px system-ui, sans-serif`;
    const x = e.measureText(C).width;
    e.font = `${u}px system-ui, sans-serif`;
    const j = f - h * 2 - x, k = [];
    let I = "";
    for (const O of S.split(" ")) {
      const G = I ? I + " " + O : O;
      e.measureText(G).width > j && I ? (k.push(I), I = O) : I = G;
    }
    I && k.push(I), p.push({ label: C, labelW: x, lines: k, color: M });
  }
  const y = p.reduce((C, S) => C + S.lines.length, 0) * m + h * 2, g = s + h, b = o + r - y - h;
  e.globalAlpha = 0.72, e.fillStyle = "#000", ke(e, g, b, f, y, 6), e.fill(), e.globalAlpha = 1;
  let A = b + h + u;
  for (const { label: C, labelW: S, lines: M, color: x } of p)
    for (let j = 0; j < M.length; j++)
      j === 0 ? (e.font = `bold ${u}px system-ui, sans-serif`, e.fillStyle = x, e.fillText(C, g + h, A), e.font = `${u}px system-ui, sans-serif`, e.fillStyle = "rgba(255,255,255,0.88)", e.fillText(M[j], g + h + S, A)) : (e.font = `${u}px system-ui, sans-serif`, e.fillStyle = "rgba(255,255,255,0.88)", e.fillText(M[j], g + h + S, A)), A += m;
  e.restore();
}
async function Ro(t) {
  var c;
  if (!t._contentEl) return;
  t._captureBtn && (t._captureBtn.disabled = !0, t._captureBtn.setAttribute("aria-label", V("tooltip.capturingView", "Capturing…")));
  const e = t._contentEl.clientWidth || 480, n = t._contentEl.clientHeight || 360;
  let s = n;
  if (t._mode === P.SIMPLE && t._mediaA && t._genInfoSelections.size) {
    const a = document.createElement("canvas");
    a.width = e, a.height = n;
    const d = a.getContext("2d"), u = t._estimateGenInfoOverlayHeight(d, t._mediaA, e);
    if (u > 0) {
      const m = Math.max(n, u + 24);
      s = Math.min(m, n * 4);
    }
  }
  const o = document.createElement("canvas");
  o.width = e, o.height = s;
  const i = o.getContext("2d");
  i.fillStyle = "#0d0d0d", i.fillRect(0, 0, e, s);
  try {
    if (t._mode === P.SIMPLE)
      t._mediaA && (await t._drawMediaFit(i, t._mediaA, 0, 0, e, n), t._drawGenInfoOverlay(i, t._mediaA, 0, 0, e, s));
    else if (t._mode === P.AB) {
      const a = Math.round(t._abDividerX * e), d = t._contentEl.querySelector(
        ".mjr-mfv-ab-layer:not(.mjr-mfv-ab-layer--b) video"
      ), u = t._contentEl.querySelector(".mjr-mfv-ab-layer--b video");
      t._mediaA && await t._drawMediaFit(i, t._mediaA, 0, 0, e, s, d), t._mediaB && (i.save(), i.beginPath(), i.rect(a, 0, e - a, s), i.clip(), await t._drawMediaFit(i, t._mediaB, 0, 0, e, s, u), i.restore()), i.save(), i.strokeStyle = "rgba(255,255,255,0.88)", i.lineWidth = 2, i.beginPath(), i.moveTo(a, 0), i.lineTo(a, s), i.stroke(), i.restore(), ct(i, "A", 8, 8), ct(i, "B", a + 8, 8), t._mediaA && t._drawGenInfoOverlay(i, t._mediaA, 0, 0, a, s), t._mediaB && t._drawGenInfoOverlay(i, t._mediaB, a, 0, e - a, s);
    } else if (t._mode === P.SIDE) {
      const a = Math.floor(e / 2), d = t._contentEl.querySelector(".mjr-mfv-side-panel:first-child video"), u = t._contentEl.querySelector(".mjr-mfv-side-panel:last-child video");
      t._mediaA && (await t._drawMediaFit(i, t._mediaA, 0, 0, a, s, d), t._drawGenInfoOverlay(i, t._mediaA, 0, 0, a, s)), i.fillStyle = "#111", i.fillRect(a, 0, 2, s), t._mediaB && (await t._drawMediaFit(i, t._mediaB, a, 0, a, s, u), t._drawGenInfoOverlay(i, t._mediaB, a, 0, a, s)), ct(i, "A", 8, 8), ct(i, "B", a + 8, 8);
    } else if (t._mode === P.GRID) {
      const a = Math.floor(e / 2), d = Math.floor(s / 2), u = 1, m = [
        { media: t._mediaA, label: "A", x: 0, y: 0, w: a - u, h: d - u },
        {
          media: t._mediaB,
          label: "B",
          x: a + u,
          y: 0,
          w: a - u,
          h: d - u
        },
        {
          media: t._mediaC,
          label: "C",
          x: 0,
          y: d + u,
          w: a - u,
          h: d - u
        },
        {
          media: t._mediaD,
          label: "D",
          x: a + u,
          y: d + u,
          w: a - u,
          h: d - u
        }
      ], h = t._contentEl.querySelectorAll(".mjr-mfv-grid-cell");
      for (let f = 0; f < m.length; f++) {
        const p = m[f], _ = ((c = h[f]) == null ? void 0 : c.querySelector("video")) || null;
        p.media && (await t._drawMediaFit(i, p.media, p.x, p.y, p.w, p.h, _), t._drawGenInfoOverlay(i, p.media, p.x, p.y, p.w, p.h)), ct(i, p.label, p.x + 8, p.y + 8);
      }
      i.save(), i.fillStyle = "#111", i.fillRect(a - u, 0, u * 2, s), i.fillRect(0, d - u, e, u * 2), i.restore();
    }
  } catch (a) {
    console.debug("[MFV] capture error:", a);
  }
  const l = `${{
    [P.AB]: "mfv-ab",
    [P.SIDE]: "mfv-side",
    [P.GRID]: "mfv-grid"
  }[t._mode] ?? "mfv"}-${Date.now()}.png`;
  try {
    const a = o.toDataURL("image/png"), d = document.createElement("a");
    d.href = a, d.download = l, document.body.appendChild(d), d.click(), setTimeout(() => document.body.removeChild(d), 100);
  } catch (a) {
    console.warn("[MFV] download failed:", a);
  } finally {
    t._captureBtn && (t._captureBtn.disabled = !1, t._captureBtn.setAttribute(
      "aria-label",
      V("tooltip.captureView", "Save view as image")
    ));
  }
}
const Ho = "imageops-live-preview";
function Se(t) {
  return String((t == null ? void 0 : t._source) || "") === Ho;
}
function Do(t, e, { autoMode: n = !1 } = {}) {
  const s = t._mediaA || null, o = Se(e), i = o && Se(s) && String((s == null ? void 0 : s._nodeId) || "") === String((e == null ? void 0 : e._nodeId) || "");
  if (t._mediaA = e || null, i || t._resetMfvZoom(), n && t._mode !== P.SIMPLE && t._mode !== P.GRAPH && (t._mode = P.SIMPLE, t._updateModeBtnUI()), t._mediaA && !o && typeof Mt == "function") {
    const r = ++t._refreshGen;
    (async () => {
      var l;
      try {
        const c = await Mt(t._mediaA, {
          getAssetMetadata: Ut,
          getFileMetadataScoped: Dt
        });
        if (t._refreshGen !== r) return;
        c && typeof c == "object" && (t._mediaA = c, t._refresh());
      } catch (c) {
        (l = console.debug) == null || l.call(console, "[MFV] metadata enrich error", c);
      }
    })();
  } else
    t._refresh();
}
function Uo(t, e, n) {
  t._mediaA = e || null, t._mediaB = n || null, t._resetMfvZoom(), t._mode === P.SIMPLE && (t._mode = P.AB, t._updateModeBtnUI());
  const s = ++t._refreshGen, o = async (i) => {
    if (!i) return i;
    try {
      return await Mt(i, {
        getAssetMetadata: Ut,
        getFileMetadataScoped: Dt
      }) || i;
    } catch {
      return i;
    }
  };
  (async () => {
    const [i, r] = await Promise.all([o(t._mediaA), o(t._mediaB)]);
    t._refreshGen === s && (t._mediaA = i || null, t._mediaB = r || null, t._refresh());
  })();
}
function Wo(t, e, n, s, o) {
  t._mediaA = e || null, t._mediaB = n || null, t._mediaC = s || null, t._mediaD = o || null, t._resetMfvZoom(), t._mode !== P.GRID && (t._mode = P.GRID, t._updateModeBtnUI());
  const i = ++t._refreshGen, r = async (l) => {
    if (!l) return l;
    try {
      return await Mt(l, {
        getAssetMetadata: Ut,
        getFileMetadataScoped: Dt
      }) || l;
    } catch {
      return l;
    }
  };
  (async () => {
    const [l, c, a, d] = await Promise.all([
      r(t._mediaA),
      r(t._mediaB),
      r(t._mediaC),
      r(t._mediaD)
    ]);
    t._refreshGen === i && (t._mediaA = l || null, t._mediaB = c || null, t._mediaC = a || null, t._mediaD = d || null, t._refresh());
  })();
}
function ot(t) {
  var e, n, s, o;
  try {
    return !!((e = t == null ? void 0 : t.classList) != null && e.contains("mjr-mfv-simple-player")) || !!((n = t == null ? void 0 : t.classList) != null && n.contains("mjr-mfv-player-host")) || !!((s = t == null ? void 0 : t.querySelector) != null && s.call(t, ".mjr-video-controls, .mjr-mfv-simple-player-controls"));
  } catch (i) {
    return (o = console.debug) == null || o.call(console, i), !1;
  }
}
let zo = 0;
class Qo {
  constructor({ controller: e = null } = {}) {
    this._instanceId = ++zo, this._controller = e && typeof e == "object" ? { ...e } : null, this.element = null, this.isVisible = !1, this._contentEl = null, this._closeBtn = null, this._modeBtn = null, this._pinGroup = null, this._pinBtns = null, this._liveBtn = null, this._genBtn = null, this._genDropdown = null, this._captureBtn = null, this._genInfoSelections = /* @__PURE__ */ new Set(["genTime"]), this._mode = P.SIMPLE, this._mediaA = null, this._mediaB = null, this._mediaC = null, this._mediaD = null, this._pinnedSlots = /* @__PURE__ */ new Set(), this._abDividerX = 0.5, this._zoom = 1, this._panX = 0, this._panY = 0, this._panzoomAC = null, this._dragging = !1, this._compareSyncAC = null, this._btnAC = null, this._refreshGen = 0, this._popoutWindow = null, this._popoutBtn = null, this._isPopped = !1, this._desktopExpanded = !1, this._desktopExpandRestore = null, this._desktopPopoutUnsupported = !1, this._popoutCloseHandler = null, this._popoutKeydownHandler = null, this._popoutCloseTimer = null, this._popoutRestoreGuard = !1, this._previewBtn = null, this._previewBlobUrl = null, this._previewActive = !1, this._nodeStreamBtn = null, this._nodeStreamActive = !1, this._nodeStreamSelection = null, this._nodeStreamOverlayEl = null, this._docAC = new AbortController(), this._popoutAC = null, this._panelAC = new AbortController(), this._resizeState = null, this._titleId = `mjr-mfv-title-${this._instanceId}`, this._genDropdownId = `mjr-mfv-gen-dropdown-${this._instanceId}`, this._progressEl = null, this._progressNodesEl = null, this._progressStepsEl = null, this._progressTextEl = null, this._mediaProgressEl = null, this._mediaProgressTextEl = null, this._progressUpdateHandler = null, this._progressCurrentNodeId = null, this._docClickHost = null, this._handleDocClick = null, this._mediaControlHandles = [], this._layoutObserver = null, this._channel = "rgb", this._exposureEV = 0, this._gridMode = 0, this._overlayMaskEnabled = !1, this._overlayMaskOpacity = 0.65, this._overlayFormat = "image", this._graphMapPanel = new Ue({ large: !0 });
  }
  _dispatchControllerAction(e, n) {
    var s, o, i;
    try {
      const r = (s = this._controller) == null ? void 0 : s[e];
      if (typeof r == "function")
        return r();
    } catch (r) {
      (o = console.debug) == null || o.call(console, r);
    }
    if (n)
      try {
        window.dispatchEvent(new Event(n));
      } catch (r) {
        (i = console.debug) == null || i.call(console, r);
      }
  }
  _forwardKeydownToController(e) {
    var n, s, o;
    try {
      const i = (n = this._controller) == null ? void 0 : n.handleForwardedKeydown;
      if (typeof i == "function") {
        i(e);
        return;
      }
    } catch (i) {
      (s = console.debug) == null || s.call(console, i);
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
    return Ds(this);
  }
  _buildHeader() {
    return Us(this);
  }
  _buildToolbar() {
    return Ws(this);
  }
  _rebindControlHandlers() {
    return zs(this);
  }
  _updateSettingsBtnState(e) {
    return Ys(this, e);
  }
  _applySidebarPosition() {
    return ws(this);
  }
  refreshSidebar() {
    var e;
    (e = this._sidebar) == null || e.refresh();
  }
  _resetGenDropdownForCurrentDocument() {
    return Qs(this);
  }
  _bindDocumentUiHandlers() {
    return Xs(this);
  }
  _unbindDocumentUiHandlers() {
    return qs(this);
  }
  _isGenDropdownOpen() {
    return Ks(this);
  }
  _openGenDropdown() {
    return Zs(this);
  }
  _closeGenDropdown() {
    return Js(this);
  }
  _updateGenBtnUI() {
    return $s(this);
  }
  _buildGenDropdown() {
    return to(this);
  }
  _getGenFields(e) {
    return no(this, e);
  }
  _buildGenInfoDOM(e) {
    return so(this, e);
  }
  _notifyModeChanged() {
    return oo(this);
  }
  _cycleMode() {
    return io(this);
  }
  setMode(e) {
    return ro(this, e);
  }
  getPinnedSlots() {
    return ao(this);
  }
  _updatePinUI() {
    return lo(this);
  }
  _updateModeBtnUI() {
    return co(this);
  }
  setLiveActive(e) {
    return uo(this, e);
  }
  setPreviewActive(e) {
    return po(this, e);
  }
  loadPreviewBlob(e, n = {}) {
    return mo(this, e, n);
  }
  _revokePreviewBlob() {
    return ho(this);
  }
  setNodeStreamActive(e) {
    return fo(this, e);
  }
  /**
   * Update the "currently streamed node" overlay.
   * Pass `null` to hide the overlay (no node selected).
   * The overlay is purely informational and independent of media rendering:
   * if the selected node has no streamable preview, the existing media stays
   * but the overlay is still shown.
   * @param {{ nodeId: string|number, classType?: string, title?: string } | null} selection
   */
  setNodeStreamSelection(e) {
    e && (e.nodeId != null || e.classType) ? this._nodeStreamSelection = {
      nodeId: String(e.nodeId ?? ""),
      classType: String(e.classType || ""),
      title: e.title ? String(e.title) : ""
    } : this._nodeStreamSelection = null, this._updateNodeStreamOverlay();
  }
  _updateNodeStreamOverlay() {
    const e = this._contentEl;
    if (!e) return;
    const n = this._nodeStreamSelection;
    if (!n) {
      this._nodeStreamOverlayEl && (this._nodeStreamOverlayEl.remove(), this._nodeStreamOverlayEl = null);
      return;
    }
    if (!this._nodeStreamOverlayEl || !this._nodeStreamOverlayEl.isConnected) {
      const r = document.createElement("div");
      r.className = "mjr-mfv-node-overlay", r.setAttribute("aria-live", "polite"), this._nodeStreamOverlayEl = r;
    }
    this._nodeStreamOverlayEl.parentNode !== e && e.appendChild(this._nodeStreamOverlayEl);
    const s = n.nodeId ? `#${n.nodeId}` : "", o = n.classType || "Node", i = n.title && n.title !== n.classType ? ` — ${n.title}` : "";
    this._nodeStreamOverlayEl.textContent = `${s} · ${o}${i}`.trim();
  }
  loadMediaA(e, { autoMode: n = !1 } = {}) {
    return Do(this, e, { autoMode: n });
  }
  /**
   * Load two assets for compare modes.
   * Auto-switches from SIMPLE → AB on first call.
   */
  loadMediaPair(e, n) {
    return Uo(this, e, n);
  }
  /**
   * Load up to 4 assets for grid compare mode.
   * Auto-switches to GRID mode if not already.
   */
  loadMediaQuad(e, n, s, o) {
    return Wo(this, e, n, s, o);
  }
  /** Apply current zoom+pan state to all media elements (img/video only — divider/overlays unaffected). */
  _applyTransform() {
    if (!this._contentEl) return;
    const e = Math.max(Tt, Math.min(Ft, this._zoom)), n = this._contentEl.clientWidth || 0, s = this._contentEl.clientHeight || 0, o = Math.max(0, (e - 1) * n / 2), i = Math.max(0, (e - 1) * s / 2);
    this._panX = Math.max(-o, Math.min(o, this._panX)), this._panY = Math.max(-i, Math.min(i, this._panY));
    const r = `translate(${this._panX}px,${this._panY}px) scale(${e})`;
    for (const l of this._contentEl.querySelectorAll(".mjr-mfv-media"))
      l != null && l._mjrDisableViewerTransform || (l.style.transform = r, l.style.transformOrigin = "center");
    this._contentEl.classList.remove("mjr-mfv-content--grab", "mjr-mfv-content--grabbing"), e > 1.01 && this._contentEl.classList.add(
      this._dragging ? "mjr-mfv-content--grabbing" : "mjr-mfv-content--grab"
    ), this._applyMediaToneControls(), this._redrawOverlayGuides();
  }
  _ensureToneFilterDefs() {
    var i, r;
    if ((i = this._toneFilterDefsEl) != null && i.isConnected) return this._toneFilterDefsEl;
    const e = "http://www.w3.org/2000/svg", n = document.createElementNS(e, "svg");
    n.setAttribute("aria-hidden", "true"), n.style.position = "absolute", n.style.width = "0", n.style.height = "0", n.style.pointerEvents = "none";
    const s = document.createElementNS(e, "defs"), o = [
      ["mjr-mfv-ch-r", "1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 1 0"],
      ["mjr-mfv-ch-g", "0 1 0 0 0  0 1 0 0 0  0 1 0 0 0  0 0 0 1 0"],
      ["mjr-mfv-ch-b", "0 0 1 0 0  0 0 1 0 0  0 0 1 0 0  0 0 0 1 0"],
      ["mjr-mfv-ch-a", "0 0 0 1 0  0 0 0 1 0  0 0 0 1 0  0 0 0 1 0"],
      [
        "mjr-mfv-ch-l",
        "0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0"
      ]
    ];
    for (const [l, c] of o) {
      const a = document.createElementNS(e, "filter");
      a.setAttribute("id", l);
      const d = document.createElementNS(e, "feColorMatrix");
      d.setAttribute("type", "matrix"), d.setAttribute("values", c), a.appendChild(d), s.appendChild(a);
    }
    return n.appendChild(s), (r = this.element) == null || r.appendChild(n), this._toneFilterDefsEl = n, n;
  }
  _applyMediaToneControls() {
    var l, c, a;
    if (this._ensureToneFilterDefs(), !this._contentEl) return;
    const e = String(this._channel || "rgb"), n = Math.pow(2, Number(this._exposureEV) || 0), s = e === "rgb" ? "" : `url(#mjr-mfv-ch-${e})`, o = Math.abs(n - 1) < 1e-4 ? "" : `brightness(${n})`, i = [s, o].filter(Boolean).join(" ").trim(), r = ((c = (l = this._contentEl).querySelectorAll) == null ? void 0 : c.call(l, ".mjr-mfv-media")) || [];
    for (const d of r)
      try {
        d.style.filter = i || "";
      } catch (u) {
        (a = console.debug) == null || a.call(console, u);
      }
  }
  _getOverlayAspect(e, n, s) {
    var o;
    try {
      const i = String(e || "image");
      if (i === "image") {
        const r = Number(n == null ? void 0 : n.videoWidth) || Number(n == null ? void 0 : n.naturalWidth) || Number(s == null ? void 0 : s.width) || 1, l = Number(n == null ? void 0 : n.videoHeight) || Number(n == null ? void 0 : n.naturalHeight) || Number(s == null ? void 0 : s.height) || 1, c = r / l;
        return Number.isFinite(c) && c > 0 ? c : 1;
      }
      if (i === "16:9") return 16 / 9;
      if (i === "9:16") return 9 / 16;
      if (i === "1:1") return 1;
      if (i === "4:3") return 4 / 3;
      if (i === "2.39") return 2.39;
    } catch (i) {
      (o = console.debug) == null || o.call(console, i);
    }
    return 1;
  }
  _fitAspectInBox(e, n, s) {
    var o;
    try {
      const i = Number(e) || 0, r = Number(n) || 0, l = Number(s) || 1;
      if (!(i > 0 && r > 0 && l > 0)) return { x: 0, y: 0, w: i, h: r };
      const c = i / r;
      let a = i, d = r;
      return l >= c ? d = i / l : a = r * l, { x: (i - a) / 2, y: (r - d) / 2, w: a, h: d };
    } catch (i) {
      return (o = console.debug) == null || o.call(console, i), { x: 0, y: 0, w: Number(e) || 0, h: Number(n) || 0 };
    }
  }
  _drawMaskOutside(e, n, s, o) {
    var i;
    try {
      const r = Math.max(0, Math.min(0.92, Number(o) || 0));
      if (!(r > 0)) return;
      e.save(), e.fillStyle = `rgba(0,0,0,${r})`, e.fillRect(0, 0, n.width, n.height), e.globalCompositeOperation = "destination-out";
      for (const l of s)
        !l || !(l.w > 1 && l.h > 1) || e.fillRect(l.x, l.y, l.w, l.h);
      e.restore();
    } catch (r) {
      (i = console.debug) == null || i.call(console, r);
    }
  }
  _redrawOverlayGuides() {
    var h, f, p, _, y, g;
    const e = this._overlayCanvas, n = this._contentEl;
    if (!e || !n) return;
    const s = (h = e.getContext) == null ? void 0 : h.call(e, "2d");
    if (!s) return;
    const o = Math.max(1, Math.min(3, Number(window.devicePixelRatio) || 1)), i = n.clientWidth || 0, r = n.clientHeight || 0;
    if (e.width = Math.max(1, Math.floor(i * o)), e.height = Math.max(1, Math.floor(r * o)), e.style.width = `${i}px`, e.style.height = `${r}px`, s.clearRect(0, 0, e.width, e.height), !(this._gridMode || this._overlayMaskEnabled)) return;
    const l = (f = n.getBoundingClientRect) == null ? void 0 : f.call(n);
    if (!l) return;
    const c = Array.from(
      ((p = n.querySelectorAll) == null ? void 0 : p.call(
        n,
        ".mjr-mfv-simple-container, .mjr-mfv-side-panel, .mjr-mfv-grid-cell, .mjr-mfv-ab-layer"
      )) || []
    ), a = c.length ? c : [n], d = [];
    for (const b of a) {
      const A = (_ = b.querySelector) == null ? void 0 : _.call(b, ".mjr-mfv-media");
      if (!A) continue;
      const C = (y = b.getBoundingClientRect) == null ? void 0 : y.call(b);
      if (!(C != null && C.width) || !(C != null && C.height)) continue;
      const S = Number(C.width) || 0, M = Number(C.height) || 0, x = this._getOverlayAspect(this._overlayFormat, A, C), j = this._fitAspectInBox(S, M, x), k = C.left - l.left + S / 2, I = C.top - l.top + M / 2, O = Math.max(0.1, Math.min(16, Number(this._zoom) || 1)), G = {
        x: k + j.x * O - S * O / 2 + (Number(this._panX) || 0),
        y: I + j.y * O - M * O / 2 + (Number(this._panY) || 0),
        w: j.w * O,
        h: j.h * O
      };
      d.push({
        x: G.x * o,
        y: G.y * o,
        w: G.w * o,
        h: G.h * o
      });
    }
    if (!d.length) return;
    if (this._overlayMaskEnabled) {
      this._drawMaskOutside(s, e, d, this._overlayMaskOpacity), s.save(), (g = s.setLineDash) == null || g.call(s, [Math.max(2, 4 * o), Math.max(2, 3 * o)]), s.strokeStyle = "rgba(255,255,255,0.22)", s.lineWidth = Math.max(1, Math.floor(o));
      for (const b of d)
        s.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
      s.restore();
    }
    if (this._mode !== P.SIMPLE || !this._gridMode) return;
    const u = d[0];
    if (!u) return;
    s.save(), s.translate(u.x, u.y), s.strokeStyle = "rgba(255,255,255,0.22)", s.lineWidth = Math.max(2, Math.round(1.25 * o));
    const m = (b, A, C, S) => {
      s.beginPath(), s.moveTo(Math.round(b) + 0.5, Math.round(A) + 0.5), s.lineTo(Math.round(C) + 0.5, Math.round(S) + 0.5), s.stroke();
    };
    this._gridMode === 1 ? (m(u.w / 3, 0, u.w / 3, u.h), m(2 * u.w / 3, 0, 2 * u.w / 3, u.h), m(0, u.h / 3, u.w, u.h / 3), m(0, 2 * u.h / 3, u.w, 2 * u.h / 3)) : this._gridMode === 2 ? (m(u.w / 2, 0, u.w / 2, u.h), m(0, u.h / 2, u.w, u.h / 2)) : this._gridMode === 3 && (s.strokeRect(
      u.w * 0.1 + 0.5,
      u.h * 0.1 + 0.5,
      u.w * 0.8 - 1,
      u.h * 0.8 - 1
    ), s.strokeRect(
      u.w * 0.05 + 0.5,
      u.h * 0.05 + 0.5,
      u.w * 0.9 - 1,
      u.h * 0.9 - 1
    )), s.restore();
  }
  /**
   * Set zoom, optionally centered at (clientX, clientY).
   * Keeps the image point under the cursor stationary.
   */
  _setMfvZoom(e, n, s) {
    const o = Math.max(Tt, Math.min(Ft, this._zoom)), i = Math.max(Tt, Math.min(Ft, Number(e) || 1));
    if (n != null && s != null && this._contentEl) {
      const r = i / o, l = this._contentEl.getBoundingClientRect(), c = n - (l.left + l.width / 2), a = s - (l.top + l.height / 2);
      this._panX = this._panX * r + (1 - r) * c, this._panY = this._panY * r + (1 - r) * a;
    }
    this._zoom = i, Math.abs(i - 1) < 1e-3 && (this._zoom = 1, this._panX = 0, this._panY = 0), this._applyTransform();
  }
  /** Reset zoom and pan to the default 1:1 fit. Called when new media is loaded. */
  _resetMfvZoom() {
    this._zoom = 1, this._panX = 0, this._panY = 0, this._applyTransform();
  }
  _bindLayoutObserver() {
    var n;
    this._unbindLayoutObserver();
    const e = this._contentEl;
    if (!(!e || typeof ResizeObserver > "u"))
      try {
        this._layoutObserver = new ResizeObserver(() => {
          this._applyTransform();
        }), this._layoutObserver.observe(e);
      } catch (s) {
        (n = console.debug) == null || n.call(console, s), this._layoutObserver = null;
      }
  }
  _unbindLayoutObserver() {
    var e, n, s;
    try {
      (n = (e = this._layoutObserver) == null ? void 0 : e.disconnect) == null || n.call(e);
    } catch (o) {
      (s = console.debug) == null || s.call(console, o);
    }
    this._layoutObserver = null;
  }
  /** Bind wheel + pointer events to the clip viewport element. */
  _initPanZoom(e) {
    if (this._destroyPanZoom(), !e) return;
    this._panzoomAC = new AbortController();
    const n = { signal: this._panzoomAC.signal };
    e.addEventListener(
      "wheel",
      (a) => {
        var h, f, p, _;
        if ((f = (h = a.target) == null ? void 0 : h.closest) != null && f.call(h, "audio") || (_ = (p = a.target) == null ? void 0 : p.closest) != null && _.call(p, ".mjr-video-controls, .mjr-mfv-simple-player-controls") || kt(a.target)) return;
        const d = Bn(a.target, e);
        if (d && Ln(
          d,
          Number(a.deltaX || 0),
          Number(a.deltaY || 0)
        ))
          return;
        a.preventDefault();
        const m = 1 - (a.deltaY || a.deltaX || 0) * mn;
        this._setMfvZoom(this._zoom * m, a.clientX, a.clientY);
      },
      { ...n, passive: !1 }
    );
    let s = !1, o = 0, i = 0, r = 0, l = 0;
    e.addEventListener(
      "pointerdown",
      (a) => {
        var d, u, m, h, f, p, _, y, g;
        if (!(a.button !== 0 && a.button !== 1) && !(this._zoom <= 1.01) && !((u = (d = a.target) == null ? void 0 : d.closest) != null && u.call(d, "video")) && !((h = (m = a.target) == null ? void 0 : m.closest) != null && h.call(m, "audio")) && !((p = (f = a.target) == null ? void 0 : f.closest) != null && p.call(f, ".mjr-video-controls, .mjr-mfv-simple-player-controls")) && !((y = (_ = a.target) == null ? void 0 : _.closest) != null && y.call(_, ".mjr-mfv-ab-divider")) && !kt(a.target)) {
          a.preventDefault(), s = !0, this._dragging = !0, o = a.clientX, i = a.clientY, r = this._panX, l = this._panY;
          try {
            e.setPointerCapture(a.pointerId);
          } catch (b) {
            (g = console.debug) == null || g.call(console, b);
          }
          this._applyTransform();
        }
      },
      n
    ), e.addEventListener(
      "pointermove",
      (a) => {
        s && (this._panX = r + (a.clientX - o), this._panY = l + (a.clientY - i), this._applyTransform());
      },
      n
    );
    const c = (a) => {
      var d;
      if (s) {
        s = !1, this._dragging = !1;
        try {
          e.releasePointerCapture(a.pointerId);
        } catch (u) {
          (d = console.debug) == null || d.call(console, u);
        }
        this._applyTransform();
      }
    };
    e.addEventListener("pointerup", c, n), e.addEventListener("pointercancel", c, n), e.addEventListener(
      "dblclick",
      (a) => {
        var u, m, h, f, p, _;
        if ((m = (u = a.target) == null ? void 0 : u.closest) != null && m.call(u, "video") || (f = (h = a.target) == null ? void 0 : h.closest) != null && f.call(h, "audio") || (_ = (p = a.target) == null ? void 0 : p.closest) != null && _.call(p, ".mjr-video-controls, .mjr-mfv-simple-player-controls") || kt(a.target)) return;
        const d = Math.abs(this._zoom - 1) < 0.05;
        this._setMfvZoom(d ? Math.min(4, this._zoom * 4) : 1, a.clientX, a.clientY);
      },
      n
    );
  }
  /** Remove all pan/zoom event listeners. */
  _destroyPanZoom() {
    var e, n;
    try {
      (e = this._panzoomAC) == null || e.abort();
    } catch (s) {
      (n = console.debug) == null || n.call(console, s);
    }
    this._panzoomAC = null, this._dragging = !1;
  }
  _destroyCompareSync() {
    var e, n, s;
    try {
      (n = (e = this._compareSyncAC) == null ? void 0 : e.abort) == null || n.call(e);
    } catch (o) {
      (s = console.debug) == null || s.call(console, o);
    }
    this._compareSyncAC = null;
  }
  _destroyMediaControls() {
    var n, s;
    const e = Array.isArray(this._mediaControlHandles) ? this._mediaControlHandles : [];
    for (const o of e)
      try {
        (n = o == null ? void 0 : o.destroy) == null || n.call(o);
      } catch (i) {
        (s = console.debug) == null || s.call(console, i);
      }
    this._mediaControlHandles = [];
  }
  _trackMediaControls(e) {
    var n;
    try {
      const s = (e == null ? void 0 : e._mjrMediaControlsHandle) || null;
      s != null && s.destroy && this._mediaControlHandles.push(s);
    } catch (s) {
      (n = console.debug) == null || n.call(console, s);
    }
    return e;
  }
  _initCompareSync() {
    var e;
    if (this._destroyCompareSync(), !!this._contentEl && this._mode !== P.SIMPLE)
      try {
        const n = Array.from(this._contentEl.querySelectorAll("video, audio"));
        if (n.length < 2) return;
        const s = n[0] || null, o = n.slice(1);
        if (!s || !o.length) return;
        this._compareSyncAC = un(s, o, { threshold: 0.08 });
      } catch (n) {
        (e = console.debug) == null || e.call(console, n);
      }
  }
  // ── Render ────────────────────────────────────────────────────────────────
  _refresh() {
    var n, s;
    if (!this._contentEl) return;
    (s = (n = this._sidebar) == null ? void 0 : n.setAsset) == null || s.call(n, this._mediaA || null), this._destroyPanZoom(), this._destroyCompareSync(), this._destroyMediaControls();
    const e = this._overlayCanvas || null;
    switch (this._contentEl.replaceChildren(), this._contentEl.style.overflow = "hidden", this._mode) {
      case P.SIMPLE:
        this._renderSimple();
        break;
      case P.AB:
        this._renderAB();
        break;
      case P.SIDE:
        this._renderSide();
        break;
      case P.GRID:
        this._renderGrid();
        break;
      case P.GRAPH:
        this._renderGraphMap();
        break;
    }
    e && this._contentEl.appendChild(e), this._nodeStreamSelection && this._updateNodeStreamOverlay(), this._mediaProgressEl && this._contentEl.appendChild(this._mediaProgressEl), this._applyMediaToneControls(), this._applyTransform(), this._mode !== P.GRAPH && this._initPanZoom(this._contentEl), this._initCompareSync();
  }
  _renderGraphMap() {
    this._contentEl.style.overflow = "hidden", this._graphMapPanel.setAsset(this._mediaA || null), this._contentEl.appendChild(this._graphMapPanel.el), this._graphMapPanel.refresh();
  }
  _renderSimple() {
    var i;
    if (!this._mediaA) {
      this._contentEl.appendChild(w());
      return;
    }
    const e = X(this._mediaA), n = $(this._mediaA), s = ((i = this._trackMediaControls) == null ? void 0 : i.call(this, n)) || n;
    if (!s) {
      this._contentEl.appendChild(w("Could not load media"));
      return;
    }
    const o = document.createElement("div");
    if (o.className = "mjr-mfv-simple-container", o.appendChild(s), e !== "audio") {
      const r = this._buildGenInfoDOM(this._mediaA);
      if (r) {
        const l = document.createElement("div");
        l.className = "mjr-mfv-geninfo", ot(s) && l.classList.add("mjr-mfv-geninfo--above-player"), l.appendChild(r), o.appendChild(l);
      }
    }
    this._contentEl.appendChild(o);
  }
  _renderAB() {
    var y, g, b;
    const e = this._mediaA ? $(this._mediaA, { fill: !0 }) : null, n = this._mediaB ? $(this._mediaB, { fill: !0 }) : null, s = ((y = this._trackMediaControls) == null ? void 0 : y.call(this, e)) || e, o = ((g = this._trackMediaControls) == null ? void 0 : g.call(this, n)) || n, i = this._mediaA ? X(this._mediaA) : "", r = this._mediaB ? X(this._mediaB) : "";
    if (!s && !o) {
      this._contentEl.appendChild(w("Select 2 assets for A/B compare"));
      return;
    }
    if (!o) {
      this._renderSimple();
      return;
    }
    if (i === "audio" || r === "audio" || i === "model3d" || r === "model3d") {
      this._renderSide();
      return;
    }
    const l = document.createElement("div");
    l.className = "mjr-mfv-ab-container";
    const c = document.createElement("div");
    c.className = "mjr-mfv-ab-layer", s && c.appendChild(s);
    const a = document.createElement("div");
    a.className = "mjr-mfv-ab-layer mjr-mfv-ab-layer--b";
    const d = Math.round(this._abDividerX * 100);
    a.style.clipPath = `inset(0 0 0 ${d}%)`, a.appendChild(o);
    const u = document.createElement("div");
    u.className = "mjr-mfv-ab-divider", u.style.left = `${d}%`;
    const m = this._buildGenInfoDOM(this._mediaA);
    let h = null;
    m && (h = document.createElement("div"), h.className = "mjr-mfv-geninfo-a", ot(s) && h.classList.add("mjr-mfv-geninfo--above-player"), h.appendChild(m), h.style.right = `calc(${100 - d}% + 8px)`);
    const f = this._buildGenInfoDOM(this._mediaB);
    let p = null;
    f && (p = document.createElement("div"), p.className = "mjr-mfv-geninfo-b", ot(o) && p.classList.add("mjr-mfv-geninfo--above-player"), p.appendChild(f), p.style.left = `calc(${d}% + 8px)`);
    let _ = null;
    u.addEventListener(
      "pointerdown",
      (A) => {
        A.preventDefault(), u.setPointerCapture(A.pointerId);
        try {
          _ == null || _.abort();
        } catch {
        }
        _ = new AbortController();
        const C = _.signal, S = l.getBoundingClientRect(), M = (j) => {
          const k = Math.max(0.02, Math.min(0.98, (j.clientX - S.left) / S.width));
          this._abDividerX = k;
          const I = Math.round(k * 100);
          a.style.clipPath = `inset(0 0 0 ${I}%)`, u.style.left = `${I}%`, h && (h.style.right = `calc(${100 - I}% + 8px)`), p && (p.style.left = `calc(${I}% + 8px)`);
        }, x = () => {
          try {
            _ == null || _.abort();
          } catch {
          }
        };
        u.addEventListener("pointermove", M, { signal: C }), u.addEventListener("pointerup", x, { signal: C });
      },
      (b = this._panelAC) != null && b.signal ? { signal: this._panelAC.signal } : void 0
    ), l.appendChild(c), l.appendChild(a), l.appendChild(u), h && l.appendChild(h), p && l.appendChild(p), l.appendChild(st("A", "left")), l.appendChild(st("B", "right")), this._contentEl.appendChild(l);
  }
  _renderSide() {
    var m, h;
    const e = this._mediaA ? $(this._mediaA) : null, n = this._mediaB ? $(this._mediaB) : null, s = ((m = this._trackMediaControls) == null ? void 0 : m.call(this, e)) || e, o = ((h = this._trackMediaControls) == null ? void 0 : h.call(this, n)) || n, i = this._mediaA ? X(this._mediaA) : "", r = this._mediaB ? X(this._mediaB) : "";
    if (!s && !o) {
      this._contentEl.appendChild(w("Select 2 assets for Side-by-Side"));
      return;
    }
    const l = document.createElement("div");
    l.className = "mjr-mfv-side-container";
    const c = document.createElement("div");
    c.className = "mjr-mfv-side-panel", s ? c.appendChild(s) : c.appendChild(w("—")), c.appendChild(st("A", "left"));
    const a = i === "audio" ? null : this._buildGenInfoDOM(this._mediaA);
    if (a) {
      const f = document.createElement("div");
      f.className = "mjr-mfv-geninfo-a", ot(s) && f.classList.add("mjr-mfv-geninfo--above-player"), f.appendChild(a), c.appendChild(f);
    }
    const d = document.createElement("div");
    d.className = "mjr-mfv-side-panel", o ? d.appendChild(o) : d.appendChild(w("—")), d.appendChild(st("B", "right"));
    const u = r === "audio" ? null : this._buildGenInfoDOM(this._mediaB);
    if (u) {
      const f = document.createElement("div");
      f.className = "mjr-mfv-geninfo-b", ot(o) && f.classList.add("mjr-mfv-geninfo--above-player"), f.appendChild(u), d.appendChild(f);
    }
    l.appendChild(c), l.appendChild(d), this._contentEl.appendChild(l);
  }
  _renderGrid() {
    var o;
    const e = [
      { media: this._mediaA, label: "A" },
      { media: this._mediaB, label: "B" },
      { media: this._mediaC, label: "C" },
      { media: this._mediaD, label: "D" }
    ];
    if (!e.filter((i) => i.media).length) {
      this._contentEl.appendChild(w("Select up to 4 assets for Grid Compare"));
      return;
    }
    const s = document.createElement("div");
    s.className = "mjr-mfv-grid-container";
    for (const { media: i, label: r } of e) {
      const l = document.createElement("div");
      if (l.className = "mjr-mfv-grid-cell", i) {
        const c = X(i), a = $(i), d = ((o = this._trackMediaControls) == null ? void 0 : o.call(this, a)) || a;
        if (d ? l.appendChild(d) : l.appendChild(w("—")), l.appendChild(
          st(r, r === "A" || r === "C" ? "left" : "right")
        ), c !== "audio") {
          const u = this._buildGenInfoDOM(i);
          if (u) {
            const m = document.createElement("div");
            m.className = `mjr-mfv-geninfo-${r.toLowerCase()}`, ot(d) && m.classList.add("mjr-mfv-geninfo--above-player"), m.appendChild(u), l.appendChild(m);
          }
        }
      } else
        l.appendChild(w("—")), l.appendChild(
          st(r, r === "A" || r === "C" ? "left" : "right")
        );
      s.appendChild(l);
    }
    this._contentEl.appendChild(s);
  }
  // ── Visibility ────────────────────────────────────────────────────────────
  show() {
    this.element && (this._bindDocumentUiHandlers(), this.element.classList.add("is-visible"), this.element.setAttribute("aria-hidden", "false"), this.isVisible = !0);
  }
  hide() {
    this.element && (this._destroyPanZoom(), this._destroyCompareSync(), this._stopEdgeResize(), this._closeGenDropdown(), Pn(this.element), this.element.classList.remove("is-visible"), this.element.setAttribute("aria-hidden", "true"), this.isVisible = !1);
  }
  // ── Pop-out / Pop-in (separate OS window for second monitor) ────────────
  _setDesktopExpanded(e) {
    return yo(this, e);
  }
  _activateDesktopExpandedFallback(e) {
    return Co(this, e);
  }
  _tryElectronPopupFallback(e, n, s, o) {
    return Ao(this, e, n, s, o);
  }
  popOut() {
    return So(this);
  }
  _fallbackPopout(e, n, s) {
    return Eo(this, e, n, s);
  }
  _clearPopoutCloseWatch() {
    return Mo(this);
  }
  _startPopoutCloseWatch() {
    return No(this);
  }
  _schedulePopInFromPopupClose() {
    return Bo(this);
  }
  _installPopoutStyles(e) {
    return Lo(this, e);
  }
  popIn(e) {
    return Po(this, e);
  }
  _updatePopoutBtnUI() {
    return Io(this);
  }
  get isPopped() {
    return this._isPopped || this._desktopExpanded;
  }
  _resizeCursorForDirection(e) {
    return xo(e);
  }
  _getResizeDirectionFromPoint(e, n, s) {
    return jo(e, n, s);
  }
  _stopEdgeResize() {
    return ko(this);
  }
  _bindPanelInteractions() {
    return To(this);
  }
  _initEdgeResize(e) {
    return Fo(this, e);
  }
  _initDrag(e) {
    return vo(this, e);
  }
  async _drawMediaFit(e, n, s, o, i, r, l) {
    return Oo(this, e, n, s, o, i, r, l);
  }
  _estimateGenInfoOverlayHeight(e, n, s) {
    return Go(this, e, n, s);
  }
  _drawGenInfoOverlay(e, n, s, o, i, r) {
    return Vo(this, e, n, s, o, i, r);
  }
  async _captureView() {
    return Ro(this);
  }
  dispose() {
    var e, n, s, o, i, r, l, c, a, d, u, m, h, f, p, _, y, g, b, A, C;
    pn(this), this._destroyPanZoom(), this._destroyCompareSync(), this._destroyMediaControls(), this._unbindLayoutObserver(), this._stopEdgeResize(), this._clearPopoutCloseWatch();
    try {
      (e = this._panelAC) == null || e.abort(), this._panelAC = null;
    } catch (S) {
      (n = console.debug) == null || n.call(console, S);
    }
    try {
      (s = this._btnAC) == null || s.abort(), this._btnAC = null;
    } catch (S) {
      (o = console.debug) == null || o.call(console, S);
    }
    try {
      (i = this._docAC) == null || i.abort(), this._docAC = null;
    } catch (S) {
      (r = console.debug) == null || r.call(console, S);
    }
    try {
      (l = this._popoutAC) == null || l.abort(), this._popoutAC = null;
    } catch (S) {
      (c = console.debug) == null || c.call(console, S);
    }
    try {
      (a = this._panzoomAC) == null || a.abort(), this._panzoomAC = null;
    } catch (S) {
      (d = console.debug) == null || d.call(console, S);
    }
    try {
      (m = (u = this._compareSyncAC) == null ? void 0 : u.abort) == null || m.call(u), this._compareSyncAC = null;
    } catch (S) {
      (h = console.debug) == null || h.call(console, S);
    }
    try {
      this._isPopped && this.popIn();
    } catch (S) {
      (f = console.debug) == null || f.call(console, S);
    }
    this._revokePreviewBlob(), this._onSidebarPosChanged && (window.removeEventListener("mjr-settings-changed", this._onSidebarPosChanged), this._onSidebarPosChanged = null);
    try {
      (p = this.element) == null || p.remove();
    } catch (S) {
      (_ = console.debug) == null || _.call(console, S);
    }
    try {
      (g = (y = this._graphMapPanel) == null ? void 0 : y.dispose) == null || g.call(y);
    } catch (S) {
      (b = console.debug) == null || b.call(console, S);
    }
    this._graphMapPanel = null, this.element = null, this._contentEl = null, this._closeBtn = null, this._modeBtn = null, this._pinGroup = null, this._pinBtns = null, this._liveBtn = null, this._nodeStreamBtn = null, this._popoutBtn = null, this._captureBtn = null, this._unbindDocumentUiHandlers();
    try {
      (A = this._genDropdown) == null || A.remove();
    } catch (S) {
      (C = console.debug) == null || C.call(console, S);
    }
    this._mediaA = null, this._mediaB = null, this._mediaC = null, this._mediaD = null, this.isVisible = !1;
  }
}
export {
  Qo as FloatingViewer,
  P as MFV_MODES
};
