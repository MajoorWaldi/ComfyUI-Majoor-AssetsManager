import { p as Be, M as Je, c as $e, q as tn, t as en, u as nn, v as sn, A as gt, x as Q, y as on, z as rn, B as an, C as ce, D as Le, F as ln, G as R, H as Et, I as cn, J as Ie, K as dn, L as un, N as Nt, E as dt, O as pn, n as mn, s as kt, Q as hn, R as fn, S as Pt, T as _n, U as Ut, V as Yt, d as Ft, W as gn, l as bn, X as yn } from "./entry-GhzfvnC5.js";
import { ensureViewerMetadataAsset as Lt } from "./genInfo-BgI38YPf.js";
const L = Object.freeze({
  SIMPLE: "simple",
  AB: "ab",
  SIDE: "side",
  GRID: "grid",
  GRAPH: "graph"
}), Ot = 0.25, Gt = 8, Cn = 8e-4, Mt = 8, An = "C", Pe = "L", je = "K", xe = "N", Sn = "Esc", jt = 30;
function Rt(t) {
  const e = Number(t);
  if (!Number.isFinite(e) || e < 0) return "0:00";
  const n = Math.floor(e), s = Math.floor(n / 3600), o = Math.floor(n % 3600 / 60), r = n % 60;
  return s > 0 ? `${s}:${String(o).padStart(2, "0")}:${String(r).padStart(2, "0")}` : `${o}:${String(r).padStart(2, "0")}`;
}
function de(t) {
  var e, n;
  try {
    const s = (e = t == null ? void 0 : t.play) == null ? void 0 : e.call(t);
    s && typeof s.catch == "function" && s.catch(() => {
    });
  } catch (s) {
    (n = console.debug) == null || n.call(console, s);
  }
}
function En(t, e) {
  const n = Math.floor(Number(t) || 0), s = Math.max(0, Math.floor(Number(e) || 0));
  return n < 0 ? 0 : s > 0 && n > s ? s : n;
}
function ue(t, e) {
  const n = Number((t == null ? void 0 : t.currentTime) || 0), s = Number(e) > 0 ? Number(e) : jt;
  return Math.max(0, Math.floor(n * s));
}
function Te(t, e) {
  const n = Number((t == null ? void 0 : t.duration) || 0), s = Number(e) > 0 ? Number(e) : jt;
  return !Number.isFinite(n) || n <= 0 ? 0 : Math.max(0, Math.floor(n * s));
}
function Mn(t, e, n) {
  var l;
  const s = Number(n) > 0 ? Number(n) : jt, o = Te(t, s), a = En(e, o) / s;
  try {
    t.currentTime = Math.max(0, a);
  } catch (d) {
    (l = console.debug) == null || l.call(console, d);
  }
}
function Nn(t) {
  return t instanceof HTMLMediaElement;
}
function Bn(t, e) {
  return String(t || "").toLowerCase() === "video" ? !0 : e instanceof HTMLVideoElement;
}
function Ln(t, e) {
  return String(t || "").toLowerCase() === "audio" ? !0 : e instanceof HTMLAudioElement;
}
function In(t) {
  const e = String(t || "").toLowerCase();
  return e === "gif" || e === "animated-image";
}
function Pn(t) {
  var e;
  try {
    const n = Number((t == null ? void 0 : t.naturalWidth) || (t == null ? void 0 : t.width) || 0), s = Number((t == null ? void 0 : t.naturalHeight) || (t == null ? void 0 : t.height) || 0);
    if (!(n > 0 && s > 0)) return "";
    const o = document.createElement("canvas");
    o.width = n, o.height = s;
    const r = o.getContext("2d");
    return r ? (r.drawImage(t, 0, 0, n, s), o.toDataURL("image/png")) : "";
  } catch (n) {
    return (e = console.debug) == null || e.call(console, n), "";
  }
}
function jn(t, e = null, { kind: n = "" } = {}) {
  var ot;
  if (!t || t._mjrSimplePlayerMounted) return (t == null ? void 0 : t.parentElement) || null;
  t._mjrSimplePlayerMounted = !0;
  const s = Be(e) || jt, o = Nn(t), r = Bn(n, t), a = Ln(n, t), l = In(n), d = document.createElement("div");
  d.className = "mjr-mfv-simple-player", d.tabIndex = 0, d.setAttribute("role", "group"), d.setAttribute("aria-label", "Media player"), a && d.classList.add("is-audio"), l && d.classList.add("is-animated-image");
  const i = document.createElement("div");
  i.className = "mjr-mfv-simple-player-controls";
  const u = document.createElement("input");
  u.type = "range", u.className = "mjr-mfv-simple-player-seek", u.min = "0", u.max = "1000", u.step = "1", u.value = "0", u.setAttribute("aria-label", "Seek"), o || (u.disabled = !0, u.classList.add("is-disabled"));
  const c = document.createElement("div");
  c.className = "mjr-mfv-simple-player-row";
  const p = document.createElement("button");
  p.type = "button", p.className = "mjr-icon-btn mjr-mfv-simple-player-btn", p.setAttribute("aria-label", "Play/Pause");
  const h = document.createElement("i");
  h.className = "pi pi-pause", h.setAttribute("aria-hidden", "true"), p.appendChild(h);
  const f = document.createElement("button");
  f.type = "button", f.className = "mjr-icon-btn mjr-mfv-simple-player-btn", f.setAttribute("aria-label", "Step back");
  const m = document.createElement("i");
  m.className = "pi pi-step-backward", m.setAttribute("aria-hidden", "true"), f.appendChild(m);
  const _ = document.createElement("button");
  _.type = "button", _.className = "mjr-icon-btn mjr-mfv-simple-player-btn", _.setAttribute("aria-label", "Step forward");
  const g = document.createElement("i");
  g.className = "pi pi-step-forward", g.setAttribute("aria-hidden", "true"), _.appendChild(g);
  const b = document.createElement("div");
  b.className = "mjr-mfv-simple-player-time", b.textContent = "0:00 / 0:00";
  const y = document.createElement("div");
  y.className = "mjr-mfv-simple-player-frame", y.textContent = "F: 0", r || (y.style.display = "none");
  const A = document.createElement("button");
  A.type = "button", A.className = "mjr-icon-btn mjr-mfv-simple-player-btn", A.setAttribute("aria-label", "Mute/Unmute");
  const C = document.createElement("i");
  if (C.className = "pi pi-volume-up", C.setAttribute("aria-hidden", "true"), A.appendChild(C), r || (f.disabled = !0, _.disabled = !0, f.classList.add("is-disabled"), _.classList.add("is-disabled")), c.appendChild(f), c.appendChild(p), c.appendChild(_), c.appendChild(b), c.appendChild(y), c.appendChild(A), i.appendChild(u), i.appendChild(c), d.appendChild(t), a) {
    const M = document.createElement("div");
    M.className = "mjr-mfv-simple-player-audio-backdrop", M.textContent = String((e == null ? void 0 : e.filename) || "Audio"), d.appendChild(M);
  }
  d.appendChild(i);
  try {
    t instanceof HTMLMediaElement && (t.controls = !1, t.playsInline = !0, t.loop = !0, t.muted = !0, t.autoplay = !0);
  } catch (M) {
    (ot = console.debug) == null || ot.call(console, M);
  }
  const S = l ? String((t == null ? void 0 : t.src) || "") : "";
  let x = !1, P = "";
  const B = () => {
    if (o) {
      h.className = t.paused ? "pi pi-play" : "pi pi-pause";
      return;
    }
    if (l) {
      h.className = x ? "pi pi-play" : "pi pi-pause";
      return;
    }
    h.className = "pi pi-play";
  }, v = () => {
    if (t instanceof HTMLMediaElement) {
      C.className = t.muted ? "pi pi-volume-off" : "pi pi-volume-up";
      return;
    }
    C.className = "pi pi-volume-off", A.disabled = !0, A.classList.add("is-disabled");
  }, I = () => {
    if (!r || !(t instanceof HTMLVideoElement)) return;
    const M = ue(t, s), k = Te(t, s);
    y.textContent = k > 0 ? `F: ${M}/${k}` : `F: ${M}`;
  }, O = () => {
    const M = Math.max(0, Math.min(100, Number(u.value) / 1e3 * 100));
    u.style.setProperty("--mjr-seek-pct", `${M}%`);
  }, G = () => {
    if (!o) {
      b.textContent = l ? "Animated" : "Preview", u.value = "0", O();
      return;
    }
    const M = Number(t.currentTime || 0), k = Number(t.duration || 0);
    if (Number.isFinite(k) && k > 0) {
      const V = Math.max(0, Math.min(1, M / k));
      u.value = String(Math.round(V * 1e3)), b.textContent = `${Rt(M)} / ${Rt(k)}`;
    } else
      u.value = "0", b.textContent = `${Rt(M)} / 0:00`;
    O();
  }, Z = (M) => {
    var k;
    try {
      (k = M == null ? void 0 : M.stopPropagation) == null || k.call(M);
    } catch {
    }
  }, lt = (M) => {
    var k, V;
    Z(M);
    try {
      if (o)
        t.paused ? de(t) : (k = t.pause) == null || k.call(t);
      else if (l)
        if (!x)
          P || (P = Pn(t)), P && (t.src = P), x = !0;
        else {
          const H = S ? `${S}${S.includes("?") ? "&" : "?"}mjr_anim=${Date.now()}` : t.src;
          t.src = H, x = !1;
        }
    } catch (H) {
      (V = console.debug) == null || V.call(console, H);
    }
    B();
  }, q = (M, k) => {
    var H, D;
    if (Z(k), !r || !(t instanceof HTMLVideoElement)) return;
    try {
      (H = t.pause) == null || H.call(t);
    } catch (rt) {
      (D = console.debug) == null || D.call(console, rt);
    }
    const V = ue(t, s);
    Mn(t, V + M, s), B(), I(), G();
  }, bt = (M) => {
    var k;
    if (Z(M), t instanceof HTMLMediaElement) {
      try {
        t.muted = !t.muted;
      } catch (V) {
        (k = console.debug) == null || k.call(console, V);
      }
      v();
    }
  }, J = (M) => {
    var H;
    if (Z(M), !o) return;
    O();
    const k = Number(t.duration || 0);
    if (!Number.isFinite(k) || k <= 0) return;
    const V = Math.max(0, Math.min(1, Number(u.value) / 1e3));
    try {
      t.currentTime = k * V;
    } catch (D) {
      (H = console.debug) == null || H.call(console, D);
    }
    I(), G();
  }, $ = (M) => Z(M), xt = (M) => {
    var k, V, H, D;
    try {
      if ((V = (k = M == null ? void 0 : M.target) == null ? void 0 : k.closest) != null && V.call(k, "button, input, textarea, select")) return;
      (H = d.focus) == null || H.call(d, { preventScroll: !0 });
    } catch (rt) {
      (D = console.debug) == null || D.call(console, rt);
    }
  }, ct = (M) => {
    var V, H, D;
    const k = String((M == null ? void 0 : M.key) || "");
    if (!(!k || M != null && M.altKey || M != null && M.ctrlKey || M != null && M.metaKey)) {
      if (k === " " || k === "Spacebar") {
        (V = M.preventDefault) == null || V.call(M), lt(M);
        return;
      }
      if (k === "ArrowLeft") {
        if (!r) return;
        (H = M.preventDefault) == null || H.call(M), q(-1, M);
        return;
      }
      if (k === "ArrowRight") {
        if (!r) return;
        (D = M.preventDefault) == null || D.call(M), q(1, M);
      }
    }
  };
  return p.addEventListener("click", lt), f.addEventListener("click", (M) => q(-1, M)), _.addEventListener("click", (M) => q(1, M)), A.addEventListener("click", bt), u.addEventListener("input", J), i.addEventListener("pointerdown", $), i.addEventListener("click", $), i.addEventListener("dblclick", $), d.addEventListener("pointerdown", xt), d.addEventListener("keydown", ct), t instanceof HTMLMediaElement && (t.addEventListener("play", B, { passive: !0 }), t.addEventListener("pause", B, { passive: !0 }), t.addEventListener(
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
  )), de(t), B(), v(), I(), G(), d;
}
const xn = /* @__PURE__ */ new Set([".mp4", ".webm", ".mov", ".avi", ".mkv"]), Tn = /* @__PURE__ */ new Set([".mp3", ".wav", ".flac", ".ogg", ".m4a", ".aac", ".opus", ".wma"]);
function ve(t) {
  try {
    const e = String(t || "").trim(), n = e.lastIndexOf(".");
    return n >= 0 ? e.slice(n).toLowerCase() : "";
  } catch {
    return "";
  }
}
function K(t) {
  const e = String((t == null ? void 0 : t.kind) || "").toLowerCase();
  if (e === "video") return "video";
  if (e === "audio") return "audio";
  if (e === "model3d") return "model3d";
  const n = String((t == null ? void 0 : t.type) || "").toLowerCase(), s = String((t == null ? void 0 : t.asset_type) || (t == null ? void 0 : t.media_type) || n).toLowerCase();
  if (s === "video") return "video";
  if (s === "audio") return "audio";
  if (s === "model3d") return "model3d";
  const o = ve((t == null ? void 0 : t.filename) || "");
  return o === ".gif" ? "gif" : xn.has(o) ? "video" : Tn.has(o) ? "audio" : Je.has(o) ? "model3d" : "image";
}
function ke(t) {
  return t ? t.url ? String(t.url) : t.filename && t.id == null ? tn(t.filename, t.subfolder || "", t.type || "output") : t.filename && en(t) || "" : "";
}
function X(t = "No media — select assets in the grid") {
  const e = document.createElement("div");
  return e.className = "mjr-mfv-empty", e.textContent = t, e;
}
function it(t, e) {
  const n = document.createElement("div");
  return n.className = `mjr-mfv-label label-${e}`, n.textContent = t, n;
}
function pe(t) {
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
function vn(t, e) {
  var s, o;
  let n = t && t.nodeType === 1 ? t : (t == null ? void 0 : t.parentElement) || null;
  for (; n && n !== e; ) {
    try {
      const r = (s = window.getComputedStyle) == null ? void 0 : s.call(window, n), a = /(auto|scroll|overlay)/.test(String((r == null ? void 0 : r.overflowY) || "")), l = /(auto|scroll|overlay)/.test(String((r == null ? void 0 : r.overflowX) || ""));
      if (a || l)
        return n;
    } catch (r) {
      (o = console.debug) == null || o.call(console, r);
    }
    n = n.parentElement || null;
  }
  return null;
}
function kn(t, e, n) {
  if (!t) return !1;
  if (Math.abs(Number(n) || 0) >= Math.abs(Number(e) || 0)) {
    const r = Number(t.scrollTop || 0), a = Math.max(
      0,
      Number(t.scrollHeight || 0) - Number(t.clientHeight || 0)
    );
    if (n < 0 && r > 0 || n > 0 && r < a) return !0;
  }
  const s = Number(t.scrollLeft || 0), o = Math.max(
    0,
    Number(t.scrollWidth || 0) - Number(t.clientWidth || 0)
  );
  return e < 0 && s > 0 || e > 0 && s < o;
}
function Fn(t) {
  var e, n, s, o;
  if (t)
    try {
      const r = (e = t.querySelectorAll) == null ? void 0 : e.call(t, "video, audio");
      if (!r || !r.length) return;
      for (const a of r)
        try {
          (n = a.pause) == null || n.call(a);
        } catch (l) {
          (s = console.debug) == null || s.call(console, l);
        }
    } catch (r) {
      (o = console.debug) == null || o.call(console, r);
    }
}
function nt(t, { fill: e = !1, controls: n = !0 } = {}) {
  var u, c;
  const s = ke(t);
  if (!s) return null;
  const o = K(t), r = `mjr-mfv-media mjr-mfv-media--fit-height${e ? " mjr-mfv-media--fill" : ""}`, l = ve((t == null ? void 0 : t.filename) || "") === ".webp" && Number((t == null ? void 0 : t.duration) ?? ((u = t == null ? void 0 : t.metadata_raw) == null ? void 0 : u.duration) ?? 0) > 0, d = (p, h) => {
    var _;
    if (!n) return p;
    const f = document.createElement("div");
    f.className = `mjr-mfv-player-host${e ? " mjr-mfv-player-host--fill" : ""}`, f.appendChild(p);
    const m = nn(p, {
      variant: "viewer",
      hostEl: f,
      mediaKind: h,
      initialFps: Be(t) || void 0,
      initialFrameCount: sn(t) || void 0
    });
    try {
      m && (f._mjrMediaControlsHandle = m);
    } catch (g) {
      (_ = console.debug) == null || _.call(console, g);
    }
    return f;
  };
  if (o === "audio") {
    const p = document.createElement("audio");
    p.className = r, p.src = s, p.controls = !1, p.autoplay = !0, p.preload = "metadata", p.loop = !0, p.muted = !0;
    try {
      p.addEventListener("loadedmetadata", () => pe(p), {
        once: !0
      });
    } catch (h) {
      (c = console.debug) == null || c.call(console, h);
    }
    return pe(p), d(p, "audio");
  }
  if (o === "video") {
    const p = document.createElement("video");
    return p.className = r, p.src = s, p.controls = !1, p.loop = !0, p.muted = !0, p.autoplay = !0, p.playsInline = !0, d(p, "video");
  }
  if (o === "model3d")
    return $e(t, s, {
      hostClassName: `mjr-model3d-host mjr-mfv-model3d-host${e ? " mjr-mfv-model3d-host--fill" : ""}`,
      canvasClassName: `mjr-mfv-media mjr-model3d-render-canvas${e ? " mjr-mfv-media--fill" : ""}`,
      hintText: "Rotate: left drag  Pan: right drag  Zoom: wheel or middle drag",
      disableViewerTransform: !0,
      pauseDuringExecution: !!gt.FLOATING_VIEWER_PAUSE_DURING_EXECUTION
    });
  const i = document.createElement("img");
  return i.className = r, i.src = s, i.alt = String((t == null ? void 0 : t.filename) || ""), i.draggable = !1, (o === "gif" || l) && jn(i, t, {
    kind: o === "gif" ? "gif" : "animated-image"
  }) || i;
}
function Fe(t, e, n, s, o, r) {
  t.beginPath(), typeof t.roundRect == "function" ? t.roundRect(e, n, s, o, r) : (t.moveTo(e + r, n), t.lineTo(e + s - r, n), t.quadraticCurveTo(e + s, n, e + s, n + r), t.lineTo(e + s, n + o - r), t.quadraticCurveTo(e + s, n + o, e + s - r, n + o), t.lineTo(e + r, n + o), t.quadraticCurveTo(e, n + o, e, n + o - r), t.lineTo(e, n + r), t.quadraticCurveTo(e, n, e + r, n), t.closePath());
}
function ut(t, e, n, s) {
  t.save(), t.font = "bold 10px system-ui, sans-serif";
  const o = 5, r = t.measureText(e).width;
  t.fillStyle = "rgba(0,0,0,0.58)", Fe(t, n, s, r + o * 2, 18, 4), t.fill(), t.fillStyle = "#fff", t.fillText(e, n + o, s + 13), t.restore();
}
function On(t, e, n = null) {
  switch (String((t == null ? void 0 : t.type) || "").toLowerCase()) {
    case "number":
    case "int":
    case "float":
      return Rn(t, e, n);
    case "combo":
      return Vn(t, e, n);
    case "text":
    case "string":
    case "customtext":
      return Hn(t, e, n);
    case "toggle":
    case "boolean":
      return Wn(t, e, n);
    default:
      return zn(t);
  }
}
function st(t, e, n = null) {
  var o, r, a, l, d, i, u, c, p, h;
  if (!t) return !1;
  const s = String(t.type || "").toLowerCase();
  if (s === "number" || s === "int" || s === "float") {
    const f = Number(e);
    if (Number.isNaN(f)) return !1;
    const m = t.options ?? {}, _ = m.min ?? -1 / 0, g = m.max ?? 1 / 0;
    let b = Math.min(g, Math.max(_, f));
    (s === "int" || m.precision === 0 || m.round === 1) && (b = Math.round(b)), t.value = b;
  } else s === "toggle" || s === "boolean" ? t.value = !!e : t.value = e;
  try {
    const f = Q(), m = (f == null ? void 0 : f.canvas) ?? null, _ = n ?? (t == null ? void 0 : t.parent) ?? null, g = t.value;
    (o = t.callback) == null || o.call(t, t.value, m, _, null, t), (s === "number" || s === "int" || s === "float") && (t.value = g), Gn(t), (r = m == null ? void 0 : m.setDirty) == null || r.call(m, !0, !0), (a = m == null ? void 0 : m.draw) == null || a.call(m, !0, !0);
    const b = (_ == null ? void 0 : _.graph) ?? null;
    b && b !== (f == null ? void 0 : f.graph) && ((l = b.setDirtyCanvas) == null || l.call(b, !0, !0), (d = b.change) == null || d.call(b)), (u = (i = f == null ? void 0 : f.graph) == null ? void 0 : i.setDirtyCanvas) == null || u.call(i, !0, !0), (p = (c = f == null ? void 0 : f.graph) == null ? void 0 : c.change) == null || p.call(c);
  } catch (f) {
    (h = console.debug) == null || h.call(console, "[MFV] writeWidgetValue", f);
  }
  return !0;
}
function Gn(t) {
  var s, o, r, a, l, d;
  const e = String(t.value ?? ""), n = (t == null ? void 0 : t.inputEl) ?? (t == null ? void 0 : t.element) ?? (t == null ? void 0 : t.el) ?? ((o = (s = t == null ? void 0 : t.cachedDeepestByFrame) == null ? void 0 : s.widget) == null ? void 0 : o.inputEl) ?? ((a = (r = t == null ? void 0 : t.cachedDeepestByFrame) == null ? void 0 : r.widget) == null ? void 0 : a.element) ?? ((d = (l = t == null ? void 0 : t.cachedDeepestByFrame) == null ? void 0 : l.widget) == null ? void 0 : d.el) ?? null;
  n != null && "value" in n && n.value !== e && (n.value = e);
}
function Rn(t, e, n) {
  const s = document.createElement("input");
  s.type = "number", s.className = "mjr-ws-input", s.value = t.value ?? "";
  const o = t.options ?? {}, a = String((t == null ? void 0 : t.type) || "").toLowerCase() === "int" || o.precision === 0 || o.round === 1;
  if (o.min != null && (s.min = String(o.min)), o.max != null && (s.max = String(o.max)), a)
    s.step = "1";
  else {
    const l = o.precision;
    s.step = l != null ? String(Math.pow(10, -l)) : "any";
  }
  return s.addEventListener("input", () => {
    const l = s.value;
    l === "" || l === "-" || l === "." || l.endsWith(".") || (st(t, l, n), e == null || e(t.value));
  }), s.addEventListener("change", () => {
    st(t, s.value, n) && (s.value = String(t.value), e == null || e(t.value));
  }), s;
}
function Vn(t, e, n) {
  var r;
  const s = document.createElement("select");
  s.className = "mjr-ws-input";
  let o = ((r = t.options) == null ? void 0 : r.values) ?? [];
  if (typeof o == "function")
    try {
      o = o() ?? [];
    } catch {
      o = [];
    }
  Array.isArray(o) || (o = []);
  for (const a of o) {
    const l = document.createElement("option"), d = typeof a == "string" ? a : (a == null ? void 0 : a.content) ?? (a == null ? void 0 : a.value) ?? (a == null ? void 0 : a.text) ?? String(a);
    l.value = d, l.textContent = d, d === String(t.value) && (l.selected = !0), s.appendChild(l);
  }
  return s.addEventListener("change", () => {
    st(t, s.value, n) && (e == null || e(t.value));
  }), s;
}
function Hn(t, e, n) {
  const s = document.createElement("div");
  s.className = "mjr-ws-text-wrapper";
  const o = document.createElement("textarea");
  o.className = "mjr-ws-input mjr-ws-textarea", o.value = t.value ?? "", o.rows = 2;
  const r = () => {
    o.style.height = "auto", o.style.height = o.scrollHeight + "px";
  };
  return o.addEventListener("change", () => {
    st(t, o.value, n) && (e == null || e(t.value));
  }), o.addEventListener("input", () => {
    st(t, o.value, n), e == null || e(t.value), r();
  }), s.appendChild(o), s._mjrAutoFit = r, o._mjrAutoFit = r, requestAnimationFrame(r), s;
}
function Wn(t, e, n) {
  const s = document.createElement("label");
  s.className = "mjr-ws-toggle-label";
  const o = document.createElement("input");
  return o.type = "checkbox", o.className = "mjr-ws-checkbox", o.checked = !!t.value, o.addEventListener("change", () => {
    st(t, o.checked, n) && (e == null || e(t.value));
  }), s.appendChild(o), s;
}
function zn(t) {
  const e = document.createElement("input");
  return e.type = "text", e.className = "mjr-ws-input mjr-ws-readonly", e.value = t.value != null ? String(t.value) : "", e.readOnly = !0, e.tabIndex = -1, e;
}
const Dn = /* @__PURE__ */ new Set(["imageupload", "button", "hidden"]), Un = /\bnote\b|markdown/i;
function Yn(t) {
  return Un.test(String((t == null ? void 0 : t.type) || ""));
}
function me(t) {
  var s;
  const e = (t == null ? void 0 : t.properties) ?? {};
  if (typeof e.text == "string") return e.text;
  if (typeof e.value == "string") return e.value;
  if (typeof e.markdown == "string") return e.markdown;
  const n = (s = t == null ? void 0 : t.widgets) == null ? void 0 : s[0];
  return n != null && n.value != null ? String(n.value) : "";
}
function wn(t, e) {
  var o;
  const n = t == null ? void 0 : t.properties;
  n && ("text" in n ? n.text = e : "value" in n ? n.value = e : "markdown" in n ? n.markdown = e : n.text = e);
  const s = (o = t == null ? void 0 : t.widgets) == null ? void 0 : o[0];
  s && (s.value = e);
}
const Qn = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, Xn = /^[0-9a-f]{20,}$/i;
function qn(...t) {
  for (const e of t) {
    const n = String(e || "").trim();
    if (n) return n;
  }
  return "";
}
function Ht(t) {
  return Qn.test(t) || Xn.test(t);
}
function Oe(t) {
  var e, n, s;
  return qn(
    t == null ? void 0 : t.title,
    (e = t == null ? void 0 : t.properties) == null ? void 0 : e.title,
    (n = t == null ? void 0 : t.properties) == null ? void 0 : n.name,
    (s = t == null ? void 0 : t.properties) == null ? void 0 : s.label,
    t == null ? void 0 : t.name
  );
}
function Kn(t, { isSubgraph: e = !1 } = {}) {
  const n = String((t == null ? void 0 : t.type) || "").trim(), s = Oe(t);
  return (e || Ht(n)) && s ? s : Ht(n) ? "Subgraph" : n || s || `Node #${t == null ? void 0 : t.id}`;
}
function Zn(t, e, { isSubgraph: n = !1 } = {}) {
  const s = String((t == null ? void 0 : t.type) || "").trim(), o = Oe(t);
  return n && s && !Ht(s) && s !== e ? s : o && o !== s && o !== e ? o : "";
}
class Jn {
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
    var s, o, r, a, l, d, i;
    if (this._noteTextarea) {
      const u = ((s = this._el) == null ? void 0 : s.ownerDocument) || document;
      if ((u == null ? void 0 : u.activeElement) !== this._noteTextarea) {
        const c = me(this._node);
        this._noteTextarea.value !== c && (this._noteTextarea.value = c, (r = (o = this._noteTextarea)._mjrAutoFit) == null || r.call(o));
      }
      return;
    }
    if (!((a = this._node) != null && a.widgets)) return;
    const e = ((l = this._el) == null ? void 0 : l.ownerDocument) || document, n = (e == null ? void 0 : e.activeElement) || null;
    for (const u of this._node.widgets) {
      const c = this._inputMap.get(u.name), p = $n(c);
      if (!p) continue;
      if (p.type === "checkbox") {
        const f = !!u.value;
        p.checked !== f && (p.checked = f);
        continue;
      }
      const h = u.value != null ? String(u.value) : "";
      String(p.value ?? "") !== h && (n && p === n || (p.value = h, (d = c == null ? void 0 : c._mjrAutoFit) == null || d.call(c), (i = p == null ? void 0 : p._mjrAutoFit) == null || i.call(p)));
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
    var p, h, f;
    const e = this._node, n = document.createElement("section");
    n.className = "mjr-ws-node", n.dataset.nodeId = String(e.id ?? ""), this._isSubgraph && (n.classList.add("mjr-ws-node--subgraph"), n.dataset.subgraph = "true", n.dataset.childCount = String(this._childCount)), this._depth > 0 && (n.dataset.depth = String(this._depth), n.classList.add("mjr-ws-node--nested"));
    const s = document.createElement("div");
    if (s.className = "mjr-ws-node-header", this._collapsible) {
      this._header = s;
      const m = document.createElement("button");
      m.type = "button", m.className = "mjr-icon-btn mjr-ws-node-toggle", m.title = this._expanded ? "Collapse node" : "Expand node", m.addEventListener("click", (_) => {
        _.stopPropagation(), this.setExpanded(!this._expanded);
      }), s.appendChild(m), this._toggleBtn = m, s.addEventListener("click", (_) => {
        _.target.closest("button") || this.setExpanded(!this._expanded);
      }), s.title = this._expanded ? "Collapse node" : "Expand node";
    }
    const o = document.createElement("div");
    o.className = "mjr-ws-node-title-wrap";
    const r = document.createElement("span");
    r.className = "mjr-ws-node-type";
    const a = Kn(e, { isSubgraph: this._isSubgraph });
    r.textContent = a, o.appendChild(r);
    const l = Zn(e, a, {
      isSubgraph: this._isSubgraph
    });
    if (l) {
      const m = document.createElement("span");
      m.className = "mjr-ws-node-title", m.textContent = l, o.appendChild(m);
    }
    if (s.appendChild(o), this._isSubgraph) {
      const m = document.createElement("span");
      m.className = "mjr-ws-node-kind", m.title = `${this._childCount} inner node${this._childCount !== 1 ? "s" : ""}`;
      const _ = document.createElement("i");
      _.className = "pi pi-sitemap", _.setAttribute("aria-hidden", "true"), m.appendChild(_);
      const g = document.createElement("span");
      g.textContent = "Subgraph", m.appendChild(g);
      const b = document.createElement("span");
      b.className = "mjr-ws-node-kind-count", b.textContent = String(this._childCount), m.appendChild(b), s.appendChild(m), this._subgraphHeaderTitle = `${a} · Subgraph · ${this._childCount} inner node${this._childCount !== 1 ? "s" : ""}`, s.title = this._subgraphHeaderTitle;
    }
    const d = document.createElement("button");
    d.type = "button", d.className = "mjr-icon-btn mjr-ws-locate", d.title = "Locate on canvas", d.innerHTML = '<i class="pi pi-map-marker" aria-hidden="true"></i>', d.addEventListener("click", (m) => {
      m.stopPropagation(), this._locateNode();
    }), s.appendChild(d), n.appendChild(s);
    const i = document.createElement("div");
    if (i.className = "mjr-ws-node-body", Yn(e)) {
      const m = document.createElement("textarea");
      m.className = "mjr-ws-input mjr-ws-textarea mjr-ws-note-textarea", m.value = me(e), m.rows = 4;
      const _ = () => {
        m.style.height = "auto", m.style.height = m.scrollHeight + "px";
      };
      return m.addEventListener("input", () => {
        var y, A, C, S, x, P, B;
        wn(e, m.value);
        const g = (y = e == null ? void 0 : e.widgets) == null ? void 0 : y[0], b = (g == null ? void 0 : g.inputEl) ?? (g == null ? void 0 : g.element) ?? (g == null ? void 0 : g.el) ?? null;
        b != null && "value" in b && b.value !== m.value && (b.value = m.value), _();
        try {
          const v = Q(), I = (v == null ? void 0 : v.canvas) ?? null;
          (A = I == null ? void 0 : I.setDirty) == null || A.call(I, !0, !0), (C = I == null ? void 0 : I.draw) == null || C.call(I, !0, !0);
          const O = (e == null ? void 0 : e.graph) ?? null;
          O && O !== (v == null ? void 0 : v.graph) && ((S = O.setDirtyCanvas) == null || S.call(O, !0, !0), (x = O.change) == null || x.call(O)), (B = (P = v == null ? void 0 : v.graph) == null ? void 0 : P.change) == null || B.call(P);
        } catch {
        }
      }), m._mjrAutoFit = _, this._noteTextarea = m, this._autoFits.push(_), i.appendChild(m), this._body = i, n.appendChild(i), this._el = n, this._applyExpandedState(), requestAnimationFrame(_), n;
    }
    const u = e.widgets ?? [];
    let c = !1;
    for (const m of u) {
      const _ = String(m.type || "").toLowerCase();
      if (Dn.has(_) || m.hidden || (p = m.options) != null && p.hidden) continue;
      c = !0;
      const g = _ === "text" || _ === "string" || _ === "customtext", b = document.createElement("div");
      b.className = g ? "mjr-ws-widget-row mjr-ws-widget-row--block" : "mjr-ws-widget-row";
      const y = document.createElement("label");
      y.className = "mjr-ws-widget-label", y.textContent = m.name || "";
      const A = document.createElement("div");
      A.className = "mjr-ws-widget-input";
      const C = On(m, () => {
      }, e);
      A.appendChild(C), this._inputMap.set(m.name, C);
      const S = C._mjrAutoFit ?? ((f = (h = C.querySelector) == null ? void 0 : h.call(C, "textarea")) == null ? void 0 : f._mjrAutoFit);
      S && this._autoFits.push(S), b.appendChild(y), b.appendChild(A), i.appendChild(b);
    }
    if (!c) {
      const m = document.createElement("div");
      m.className = "mjr-ws-node-empty", m.textContent = "No editable parameters", i.appendChild(m);
    }
    return this._body = i, n.appendChild(i), this._el = n, this._applyExpandedState(), n;
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
    var n, s, o, r, a, l, d, i;
    if (this._onLocate) {
      this._onLocate();
      return;
    }
    const e = this._node;
    if (e)
      try {
        const u = Q(), c = u == null ? void 0 : u.canvas;
        if (!c) return;
        if (typeof c.centerOnNode == "function")
          c.centerOnNode(e);
        else if (c.ds && e.pos) {
          const p = ((n = c.canvas) == null ? void 0 : n.width) || ((s = c.element) == null ? void 0 : s.width) || 800, h = ((o = c.canvas) == null ? void 0 : o.height) || ((r = c.element) == null ? void 0 : r.height) || 600;
          c.ds.offset[0] = -e.pos[0] - (((a = e.size) == null ? void 0 : a[0]) || 0) / 2 + p / 2, c.ds.offset[1] = -e.pos[1] - (((l = e.size) == null ? void 0 : l[1]) || 0) / 2 + h / 2, (d = c.setDirty) == null || d.call(c, !0, !0);
        }
      } catch (u) {
        (i = console.debug) == null || i.call(console, "[MFV sidebar] locateNode error", u);
      }
  }
}
function $n(t) {
  var e, n, s;
  return t ? (n = (e = t.classList) == null ? void 0 : e.contains) != null && n.call(e, "mjr-ws-text-wrapper") ? ((s = t.querySelector) == null ? void 0 : s.call(t, "textarea")) ?? t : t : null;
}
const wt = () => Q();
class ts {
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
    var o, r, a, l, d;
    const n = rs()[0] || "";
    let s = null;
    for (const i of this._renderers) {
      const u = String(((o = i._node) == null ? void 0 : o.id) ?? "") === n;
      (a = (r = i.el) == null ? void 0 : r.classList) == null || a.toggle("is-selected-from-graph", u), u && (s = i);
    }
    if (!n) {
      this._lastSelectedId = "";
      return;
    }
    if (n !== this._lastSelectedId && (this._lastSelectedId = n, !!s)) {
      s._expanded || s.setExpanded(!0);
      try {
        const i = s._mjrTreeItemEl || s.el;
        this._openTreeBranch(i);
        const u = i == null ? void 0 : i.parentElement;
        u && u.firstElementChild !== i && u.insertBefore(i, u.firstElementChild), (l = s.el) == null || l.scrollIntoView({ block: "start", inline: "nearest" });
      } catch (i) {
        (d = console.debug) == null || d.call(console, "[MFV] promote selected node failed", i);
      }
    }
  }
  _maybeRebuildList() {
    const e = Ge(es()), n = (this._searchQuery || "").toLowerCase().trim(), s = n ? Ve(e, n) : e, o = ss(s);
    if (o === this._lastNodeSig) {
      this._syncCanvasSelection();
      return;
    }
    this._lastNodeSig = o;
    for (const r of this._renderers) r.dispose();
    if (this._renderers = [], this._list.innerHTML = "", !s.length) {
      const r = document.createElement("div");
      r.className = "mjr-ws-sidebar-empty", r.textContent = e.length ? "No nodes match your search" : "No nodes in workflow", this._list.appendChild(r);
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
    for (const { node: r, children: a } of e) {
      const l = String((r == null ? void 0 : r.id) ?? ""), d = a.length, i = document.createElement("div");
      i.className = "mjr-ws-tree-item", i.dataset.nodeId = l, i._mjrNodeId = l, i._mjrParentTreeItem = o || null, d > 0 && i.classList.add("mjr-ws-tree-item--subgraph"), s > 0 && i.classList.add("mjr-ws-tree-item--nested");
      const u = new Jn(r, {
        collapsible: !0,
        expanded: this._expandedNodeIds.has(l),
        depth: s,
        isSubgraph: d > 0,
        childCount: d,
        onLocate: () => os(r),
        onToggle: (c) => {
          if (c) {
            this._expandedNodeIds = /* @__PURE__ */ new Set([l]);
            for (const p of this._renderers)
              p !== u && p.setExpanded(!1);
          } else
            this._expandedNodeIds.delete(l);
        }
      });
      if (u._mjrTreeItemEl = i, this._renderers.push(u), i.appendChild(u.el), d > 0) {
        const c = this._expandedChildrenIds.has(l), p = document.createElement("button");
        p.type = "button", p.className = "mjr-ws-children-toggle", s > 0 && p.classList.add("mjr-ws-children-toggle--nested"), he(p, d, c);
        const h = document.createElement("div");
        h.className = "mjr-ws-children", h.hidden = !c, i._mjrChildrenToggle = p, i._mjrChildrenEl = h, i._mjrChildCount = d, this._renderItems(a, h, s + 1, i), p.addEventListener("click", () => {
          this._setTreeItemChildrenOpen(i, h.hidden);
        }), i.appendChild(p), i.appendChild(h);
      }
      n.appendChild(i);
    }
  }
  _setTreeItemChildrenOpen(e, n) {
    if (!(e != null && e._mjrChildrenEl) || !(e != null && e._mjrChildrenToggle)) return;
    const s = String(e._mjrNodeId || "");
    e._mjrChildrenEl.hidden = !n, s && (n ? this._expandedChildrenIds.add(s) : this._expandedChildrenIds.delete(s)), he(
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
function es() {
  var t;
  try {
    const e = wt();
    return (e == null ? void 0 : e.graph) ?? ((t = e == null ? void 0 : e.canvas) == null ? void 0 : t.graph) ?? null;
  } catch {
    return null;
  }
}
function ns(t) {
  var n, s, o, r, a;
  const e = [
    t == null ? void 0 : t.subgraph,
    t == null ? void 0 : t._subgraph,
    (n = t == null ? void 0 : t.subgraph) == null ? void 0 : n.graph,
    (s = t == null ? void 0 : t.subgraph) == null ? void 0 : s.lgraph,
    (o = t == null ? void 0 : t.properties) == null ? void 0 : o.subgraph,
    t == null ? void 0 : t.subgraph_instance,
    (r = t == null ? void 0 : t.subgraph_instance) == null ? void 0 : r.graph,
    t == null ? void 0 : t.inner_graph,
    t == null ? void 0 : t.subgraph_graph
  ].filter((l) => l && typeof l == "object" && Re(l).length > 0);
  return Array.isArray(t == null ? void 0 : t.nodes) && t.nodes.length > 0 && t.nodes !== ((a = t == null ? void 0 : t.graph) == null ? void 0 : a.nodes) && e.push({ nodes: t.nodes }), e;
}
function Ge(t, e = /* @__PURE__ */ new Set()) {
  if (!t || e.has(t)) return [];
  e.add(t);
  const n = Re(t), s = [];
  for (const o of n) {
    if (!o) continue;
    const a = ns(o).flatMap((l) => Ge(l, e));
    s.push({ node: o, children: a });
  }
  return s;
}
function Re(t) {
  if (!t || typeof t != "object") return [];
  if (Array.isArray(t.nodes)) return t.nodes.filter(Boolean);
  if (Array.isArray(t._nodes)) return t._nodes.filter(Boolean);
  const e = t._nodes_by_id ?? t.nodes_by_id ?? null;
  return e instanceof Map ? Array.from(e.values()).filter(Boolean) : e && typeof e == "object" ? Object.values(e).filter(Boolean) : [];
}
function Ve(t, e) {
  const n = [];
  for (const { node: s, children: o } of t) {
    const r = (s.type || "").toLowerCase().includes(e) || (s.title || "").toLowerCase().includes(e), a = Ve(o, e);
    (r || a.length > 0) && n.push({ node: s, children: a });
  }
  return n;
}
function ss(t) {
  const e = [];
  function n(s) {
    for (const { node: o, children: r } of s)
      e.push(o.id), e.push("["), n(r), e.push("]");
  }
  return n(t), e.join(",");
}
function he(t, e, n) {
  const s = n ? "pi-chevron-down" : "pi-chevron-right";
  t.textContent = "";
  const o = document.createElement("i");
  o.className = `pi ${s}`, o.setAttribute("aria-hidden", "true"), t.appendChild(o);
  const r = document.createElement("span");
  r.textContent = `${e} inner node${e !== 1 ? "s" : ""}`, t.appendChild(r), t.setAttribute("aria-expanded", String(n));
}
function os(t) {
  var e, n, s, o, r, a, l;
  try {
    const d = wt(), i = d == null ? void 0 : d.canvas;
    if (!i) return;
    if ((e = i.selectNode) == null || e.call(i, t, !1), typeof i.centerOnNode == "function")
      i.centerOnNode(t);
    else if (t.pos && i.ds) {
      const u = i.canvas, c = (u == null ? void 0 : u.width) ?? 800, p = (u == null ? void 0 : u.height) ?? 600, h = i.ds.scale ?? 1;
      i.ds.offset = [
        -t.pos[0] + c / (2 * h) - (((n = t.size) == null ? void 0 : n[0]) ?? 100) / 2,
        -t.pos[1] + p / (2 * h) - (((s = t.size) == null ? void 0 : s[1]) ?? 80) / 2
      ], (o = i.setDirty) == null || o.call(i, !0, !0);
    }
    (a = (r = i.canvas) == null ? void 0 : r.focus) == null || a.call(r);
  } catch (d) {
    (l = console.debug) == null || l.call(console, "[MFV] _focusNode", d);
  }
}
function rs() {
  var t, e, n;
  try {
    const s = wt(), o = ((t = s == null ? void 0 : s.canvas) == null ? void 0 : t.selected_nodes) ?? ((e = s == null ? void 0 : s.canvas) == null ? void 0 : e.selectedNodes) ?? null;
    if (!o) return [];
    if (Array.isArray(o))
      return o.map((r) => String((r == null ? void 0 : r.id) ?? "")).filter(Boolean);
    if (o instanceof Map)
      return Array.from(o.values()).map((r) => String((r == null ? void 0 : r.id) ?? "")).filter(Boolean);
    if (typeof o == "object")
      return Object.values(o).map((r) => String((r == null ? void 0 : r.id) ?? "")).filter(Boolean);
  } catch (s) {
    (n = console.debug) == null || n.call(console, "[MFV] _getSelectedNodeIds", s);
  }
  return [];
}
const Wt = /* @__PURE__ */ new Map();
let Vt = null;
async function is(t) {
  const e = Array.from(
    new Set(
      Qt(t).map((s) => at(s)).filter(Boolean)
    )
  );
  if (!(!e.length || !e.filter((s) => !Wt.has(s)).length))
    try {
      Vt || (Vt = fetch("/object_info").then((s) => s != null && s.ok ? s.json() : null).then((s) => {
        if (s && typeof s == "object")
          for (const [o, r] of Object.entries(s))
            Wt.set(String(o), r);
        return s;
      }).catch(() => null)), await Vt;
    } catch {
    }
}
function as(t) {
  const e = bs(t);
  for (const n of e) {
    const s = zt(n), o = ys(s);
    if (o)
      return Ue(o), o;
  }
  return null;
}
function Qt(t) {
  const e = Array.isArray(t == null ? void 0 : t.nodes) ? t.nodes.filter(Boolean) : [], n = [...e], s = ht(t);
  for (const o of e) {
    const r = It(t, o, s);
    r && n.push(...Qt(r));
  }
  return n;
}
function Bt(t, e) {
  const n = String(e ?? "");
  if (!n) return null;
  if (n.includes("::")) {
    const [o, ...r] = n.split("::"), a = r.join("::"), l = Bt(t, o), d = l ? It(t, l, ht(t)) : null;
    return d ? Bt(d, a) : null;
  }
  const s = (Array.isArray(t == null ? void 0 : t.nodes) ? t.nodes : []).find(
    (o) => String((o == null ? void 0 : o.id) ?? (o == null ? void 0 : o.ID) ?? "") === n
  ) || null;
  if (s) return s;
  for (const o of Array.isArray(t == null ? void 0 : t.nodes) ? t.nodes : []) {
    const r = It(t, o, ht(t)), a = r ? Bt(r, n) : null;
    if (a) return a;
  }
  return null;
}
function Xt(t) {
  return on(t);
}
function at(t) {
  return an(t);
}
function ls(t) {
  return rn(t);
}
function He(t) {
  const e = cs(t), n = t != null && t.properties && typeof t.properties == "object" ? t.properties : null;
  if (Array.isArray(t == null ? void 0 : t._mjrSubgraphProxyParams))
    for (const s of t._mjrSubgraphProxyParams) {
      const o = String((s == null ? void 0 : s.label) || (s == null ? void 0 : s.key) || "").trim();
      !o || e.some(([r]) => String(r) === o) || e.push([o, s == null ? void 0 : s.value]);
    }
  if (n)
    for (const [s, o] of Object.entries(n))
      ps(s) || o == null || typeof o == "object" || e.push([s, o]);
  return e.slice(0, 160);
}
function cs(t) {
  const e = [], n = t != null && t.inputs && typeof t.inputs == "object" ? t.inputs : null;
  if (n && !Array.isArray(n))
    for (const [s, o] of Object.entries(n))
      us(o) || e.push([s, o]);
  for (const { label: s, value: o } of We(t))
    e.some(([r]) => String(r) === String(s)) || e.push([s, o]);
  return e;
}
function We(t) {
  const e = t == null ? void 0 : t.widgets_values;
  if (e && typeof e == "object" && !Array.isArray(e))
    return Object.entries(e).map(([l, d], i) => ({ label: l, value: d, index: i }));
  const n = Array.isArray(e) ? e : [], s = Array.isArray(t == null ? void 0 : t.widgets) ? t.widgets : [], o = ms(t), r = hs(o), a = ds(t);
  return n.map((l, d) => {
    var c, p;
    const i = gs(t, d, l);
    return { label: ((c = s[d]) == null ? void 0 : c.name) || ((p = s[d]) == null ? void 0 : p.label) || r[d] || a[d] || i || `param ${d + 1}`, value: l, index: d };
  });
}
function ds(t) {
  const e = Array.isArray(t == null ? void 0 : t.inputs) ? t.inputs : [], n = e.filter(ze), s = e.filter(
    (l) => !fs(l) && De(l == null ? void 0 : l.type)
  ), o = [], r = /* @__PURE__ */ new Set(), a = (l) => {
    const d = `${String((l == null ? void 0 : l.name) || "")}\0${String((l == null ? void 0 : l.label) || "")}\0${String((l == null ? void 0 : l.link) ?? "")}`;
    r.has(d) || (r.add(d), o.push(l));
  };
  for (const l of n) a(l);
  for (const l of s) a(l);
  return o.map(
    (l) => {
      var d, i;
      return String(
        (l == null ? void 0 : l.label) || (l == null ? void 0 : l.localized_name) || (l == null ? void 0 : l.name) || ((d = l == null ? void 0 : l.widget) == null ? void 0 : d.name) || ((i = l == null ? void 0 : l.widget) == null ? void 0 : i.label) || ""
      ).trim();
    }
  );
}
function us(t) {
  return Array.isArray(t) && t.length === 2 && String(t[0] ?? "").trim() !== "" && Number.isFinite(Number(t[1]));
}
function ps(t) {
  const e = String(t ?? "").trim(), n = w(e);
  return n ? n === "cnr_id" || n === "ver" || n === "node_name_for_s&r" || n === "subgraph_name" || n === "subgraph_id" || n === "enabletabs" || n === "tabwidth" || n === "tabxoffset" || n === "hassecondtab" || n === "secondtabtext" || n === "secondtaboffset" || n === "secondtabwidth" || n.startsWith("ue_") : !0;
}
function ms(t) {
  const e = at(t);
  return e && Wt.get(e) || null;
}
function fe(t) {
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
function hs(t) {
  const e = t == null ? void 0 : t.input;
  if (!e || typeof e != "object") return fe(t);
  const n = [];
  for (const s of ["required", "optional"]) {
    const o = e[s];
    if (!(!o || typeof o != "object"))
      for (const [r, a] of Object.entries(o))
        _s(a) && n.push(r);
  }
  return n.length ? n : fe(t);
}
function ze(t) {
  return !t || typeof t != "object" ? !1 : !!(t.widget === !0 || t.widget && typeof t.widget == "object" || typeof t.widget == "string" && t.widget.trim());
}
function fs(t) {
  return !t || typeof t != "object" ? !1 : !!(t.link != null || Array.isArray(t.links) && t.links.length);
}
function _s(t) {
  const e = Array.isArray(t) ? t : [], n = e[0], s = e[1] && typeof e[1] == "object" && !Array.isArray(e[1]) ? e[1] : null;
  return (s == null ? void 0 : s.forceInput) === !0 || (s == null ? void 0 : s.rawLink) === !0 ? !1 : s != null && s.widgetType && String(s.widgetType).trim() ? !0 : De(n);
}
function De(t) {
  if (Array.isArray(t)) return !0;
  const e = String(t || "").trim().toUpperCase();
  return e ? e === "INT" || e === "FLOAT" || e === "STRING" || e === "BOOLEAN" || e === "BOOL" || e === "COMBO" || e === "ENUM" : !1;
}
function gs(t, e, n) {
  const s = at(t), o = Xt(t), r = `${s} ${o}`.toLowerCase(), a = String(n ?? "").toLowerCase();
  if (r.includes("ksamplerselect")) return "sampler_name";
  if (r.includes("manualsigmas")) return "sigmas";
  if (r.includes("randomnoise")) return e === 0 ? "noise_seed" : e === 1 ? "control_after_generate" : null;
  if (r.includes("cfgguider")) return "cfg";
  if (r.includes("loraloadermodelonly")) return e === 0 ? "lora_name" : e === 1 ? "strength_model" : null;
  if (r.includes("resizeimagesbylongeredge")) return "longer_edge";
  if (r.includes("vaedecodetiled"))
    return ["tile_size", "overlap", "temporal_size", "temporal_overlap"][e] || null;
  if (r.includes("textencoderloader") || r.includes("text encoder loader")) {
    if (e === 0) return "text_encoder";
    if (e === 1) return "ckpt_name";
    if (e === 2) return "device";
  }
  if (/primitive(?:int|float|string|boolean)|constant/.test(r) && e === 0) {
    const l = w(o);
    return l && l !== w(s) ? l : "value";
  }
  if (r.includes("cliptext") || r.includes("prompt")) return e === 0 ? "text" : null;
  if (a.includes(".safetensors") || a.includes(".ckpt")) return "model";
  if (typeof n == "number") {
    if (r.includes("sampler") && e === 0) return "seed";
    if (r.includes("sampler") && e === 1) return "steps";
    if (r.includes("latent") && e === 0) return "width";
    if (r.includes("latent") && e === 1) return "height";
  }
  return null;
}
function bs(t) {
  const e = zt(t == null ? void 0 : t.metadata_raw), n = zt(t == null ? void 0 : t.metadata);
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
function zt(t) {
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
function ys(t) {
  if (!t || typeof t != "object") return null;
  if (Array.isArray(t.nodes)) return t;
  if (t.workflow && typeof t.workflow == "object" && Array.isArray(t.workflow.nodes))
    return t.workflow;
  if (t.prompt && typeof t.prompt == "object")
    return ce(t.prompt);
  const e = ce(t);
  return e && Array.isArray(e.nodes) ? e : null;
}
function Ue(t, e = /* @__PURE__ */ new WeakSet()) {
  if (!t || typeof t != "object" || e.has(t)) return;
  e.add(t);
  const n = ht(t);
  for (const s of Array.isArray(t == null ? void 0 : t.nodes) ? t.nodes : []) {
    Cs(s, n);
    const o = It(t, s, n);
    o && (As(s, o), Ue(o, e));
  }
}
function Cs(t, e) {
  var a, l;
  if (!t || typeof t != "object") return;
  const n = at(t);
  if (!n) return;
  const s = e.get(String(n)), o = String(
    (s == null ? void 0 : s.name) || (s == null ? void 0 : s.title) || ((a = t == null ? void 0 : t.subgraph) == null ? void 0 : a.name) || ((l = t == null ? void 0 : t.subgraph_instance) == null ? void 0 : l.name) || ""
  ).trim();
  if (!o) return;
  const r = t != null && t.properties && typeof t.properties == "object" ? t.properties : t.properties = {};
  String(r.subgraph_name || "").trim() || (r.subgraph_name = o), String(r.subgraph_id || "").trim() || (r.subgraph_id = n);
}
function As(t, e) {
  var l;
  const n = Array.isArray((l = t == null ? void 0 : t.properties) == null ? void 0 : l.proxyWidgets) ? t.properties.proxyWidgets : [];
  if (!n.length || !Array.isArray(e == null ? void 0 : e.nodes)) return;
  const s = new Map(
    e.nodes.filter(Boolean).map((d) => [String((d == null ? void 0 : d.id) ?? (d == null ? void 0 : d.ID) ?? ""), d])
  ), o = Ss(t), r = Es(e), a = [];
  for (let d = 0; d < n.length; d += 1) {
    const i = n[d], u = Array.isArray(i) ? i[0] : (i == null ? void 0 : i.nodeId) ?? (i == null ? void 0 : i.node_id) ?? (i == null ? void 0 : i.id), c = Array.isArray(i) ? i[1] : (i == null ? void 0 : i.widget) ?? (i == null ? void 0 : i.name) ?? (i == null ? void 0 : i.widgetName), p = s.get(String(u ?? ""));
    if (!p) continue;
    const h = He(p);
    if (!h.length) continue;
    const f = h.find(([g]) => w(g) === w(c)) || h.find(([g]) => w(g) === "value") || (h.length === 1 ? h[0] : null);
    if (!f) continue;
    const m = `${String(u)}:${Ms(i, c, f[0])}`, _ = r.get(m) || r.get(String(u)) || Ns(p, f[0], c);
    o.size && !o.has(w(_)) || a.push({ label: _, value: f[1], innerNodeId: u, widgetName: c });
  }
  a.length && (t._mjrSubgraphProxyParams = a);
}
function Ss(t) {
  const e = Array.isArray(t == null ? void 0 : t.inputs) ? t.inputs : [], n = /* @__PURE__ */ new Set();
  for (const s of e) {
    if (!ze(s)) continue;
    const o = String((s == null ? void 0 : s.label) || (s == null ? void 0 : s.localized_name) || (s == null ? void 0 : s.name) || "").trim();
    o && n.add(w(o));
  }
  return n;
}
function Es(t) {
  const e = Array.isArray(t == null ? void 0 : t.inputs) ? t.inputs : [], n = Array.isArray(t == null ? void 0 : t.links) ? t.links : [], s = /* @__PURE__ */ new Map();
  for (const o of n) {
    const r = Array.isArray(o) ? o[1] : (o == null ? void 0 : o.origin_id) ?? (o == null ? void 0 : o.originId) ?? (o == null ? void 0 : o.from);
    if (String(r) !== "-10") continue;
    const a = Number(Array.isArray(o) ? o[2] : (o == null ? void 0 : o.origin_slot) ?? (o == null ? void 0 : o.originSlot) ?? (o == null ? void 0 : o.fromSlot)), l = Array.isArray(o) ? o[3] : (o == null ? void 0 : o.target_id) ?? (o == null ? void 0 : o.targetId) ?? (o == null ? void 0 : o.to), d = Number(Array.isArray(o) ? o[4] : (o == null ? void 0 : o.target_slot) ?? (o == null ? void 0 : o.targetSlot) ?? (o == null ? void 0 : o.toSlot)), i = Number.isFinite(a) ? e[a] : null, u = String((i == null ? void 0 : i.label) || (i == null ? void 0 : i.localized_name) || (i == null ? void 0 : i.name) || "").trim();
    !u || l == null || w(u) !== "value" && (s.set(String(l), u), Number.isFinite(d) && s.set(`${String(l)}:${d}`, u));
  }
  return s;
}
function Ms(t, e, n) {
  if (t && typeof t == "object" && !Array.isArray(t)) {
    const s = t.target_slot ?? t.targetSlot ?? t.slot;
    if (Number.isFinite(Number(s))) return Number(s);
  }
  return 0;
}
function Ns(t, e, n) {
  const s = String(Xt(t) || "").trim(), o = String(e || n || "").trim();
  return s && o && w(o) !== "value" ? `${s} ${o}` : s || o || "param";
}
function w(t) {
  return String(t ?? "").trim().toLowerCase().replace(/\s+/g, "_");
}
function ht(t) {
  var s;
  const e = Array.isArray((s = t == null ? void 0 : t.definitions) == null ? void 0 : s.subgraphs) && t.definitions.subgraphs || Array.isArray(t == null ? void 0 : t.subgraphs) && t.subgraphs || [], n = /* @__PURE__ */ new Map();
  for (const o of e) {
    const r = (o == null ? void 0 : o.id) ?? (o == null ? void 0 : o.name) ?? null;
    r != null && n.set(String(r), o);
  }
  return n;
}
function It(t, e, n = ht(t)) {
  var o, r, a, l;
  const s = [
    e == null ? void 0 : e.subgraph,
    e == null ? void 0 : e._subgraph,
    (o = e == null ? void 0 : e.subgraph) == null ? void 0 : o.graph,
    (r = e == null ? void 0 : e.subgraph) == null ? void 0 : r.lgraph,
    (a = e == null ? void 0 : e.properties) == null ? void 0 : a.subgraph,
    e == null ? void 0 : e.subgraph_instance,
    (l = e == null ? void 0 : e.subgraph_instance) == null ? void 0 : l.graph,
    e == null ? void 0 : e.inner_graph,
    e == null ? void 0 : e.subgraph_graph,
    n.get(String((e == null ? void 0 : e.type) ?? ""))
  ];
  for (const d of s)
    if (d && typeof d == "object" && Array.isArray(d.nodes)) return d;
  return Array.isArray(e == null ? void 0 : e.nodes) ? { nodes: e.nodes } : null;
}
async function Bs(t) {
  if (!t) return !1;
  const e = JSON.stringify(t, null, 2);
  return Le(e);
}
async function Ls(t) {
  return Le(Is(t));
}
function Is(t) {
  if (t == null) return "";
  if (typeof t == "string") return t;
  if (typeof t == "number" || typeof t == "boolean") return String(t);
  try {
    return JSON.stringify(t, null, 2);
  } catch {
    return String(t);
  }
}
function Ps(t) {
  var n, s, o, r, a, l, d;
  const e = Q();
  return !t || typeof t != "object" ? !1 : typeof (e == null ? void 0 : e.loadGraphData) == "function" ? (e.loadGraphData(t), !0) : typeof ((s = (n = e == null ? void 0 : e.canvas) == null ? void 0 : n.graph) == null ? void 0 : s.configure) == "function" ? (e.canvas.graph.configure(t), (r = (o = e.canvas.graph).setDirtyCanvas) == null || r.call(o, !0, !0), !0) : typeof ((a = e == null ? void 0 : e.graph) == null ? void 0 : a.configure) == "function" ? (e.graph.configure(t), (d = (l = e.graph).setDirtyCanvas) == null || d.call(l, !0, !0), !0) : !1;
}
function js(t) {
  var a, l, d, i, u, c, p;
  const e = Q(), n = (e == null ? void 0 : e.graph) ?? ((a = e == null ? void 0 : e.canvas) == null ? void 0 : a.graph) ?? null;
  if (!t || !n || typeof n.add != "function") return !1;
  const s = String((t == null ? void 0 : t.type) || (t == null ? void 0 : t.class_type) || (t == null ? void 0 : t.comfyClass) || "").trim(), o = (globalThis == null ? void 0 : globalThis.LiteGraph) || ((l = globalThis == null ? void 0 : globalThis.window) == null ? void 0 : l.LiteGraph) || null;
  let r = null;
  try {
    o && typeof o.createNode == "function" && s && (r = o.createNode(s));
  } catch (h) {
    (d = console.debug) == null || d.call(console, "[MFV Graph Map] createNode failed", h);
  }
  if (!r) return !1;
  try {
    const h = typeof structuredClone == "function" ? structuredClone(t) : JSON.parse(JSON.stringify(t));
    return delete h.id, Array.isArray(h.pos) && (h.pos = [Number(h.pos[0] || 0) + 32, Number(h.pos[1] || 0) + 32]), typeof r.configure == "function" ? r.configure(h) : Object.assign(r, h), n.add(r), (i = n.setDirtyCanvas) == null || i.call(n, !0, !0), (c = (u = e == null ? void 0 : e.canvas) == null ? void 0 : u.setDirty) == null || c.call(u, !0, !0), !0;
  } catch (h) {
    return (p = console.debug) == null || p.call(console, "[MFV Graph Map] import node failed", h), !1;
  }
}
function xs(t) {
  var c, p, h, f, m, _, g, b;
  const e = Q(), n = Ts(e);
  if (!t || !n) return { ok: !1, count: 0, reason: "no-target" };
  const s = We(t), o = Array.isArray(n.widgets) ? n.widgets : [];
  if (!s.length || !o.length)
    return { ok: !1, count: 0, reason: "no-widgets" };
  const r = /* @__PURE__ */ new Map();
  o.forEach((y, A) => {
    for (const C of vs(y))
      r.has(C) || r.set(C, { widget: y, index: A });
  });
  const a = _e(at(t)), l = _e((n == null ? void 0 : n.type) || (n == null ? void 0 : n.comfyClass) || (n == null ? void 0 : n.class_type)), d = !!(a && l && a === l), i = /* @__PURE__ */ new Set();
  let u = 0;
  for (const y of s) {
    const A = Ye(y.label);
    let C = A ? r.get(A) : null;
    if ((!C || i.has(C.index)) && d) {
      const S = o[y.index];
      S && (C = { widget: S, index: y.index });
    }
    !C || i.has(C.index) || st(C.widget, ks(y.value), n) && (i.add(C.index), u += 1);
  }
  return (p = (c = e == null ? void 0 : e.canvas) == null ? void 0 : c.setDirty) == null || p.call(c, !0, !0), (f = (h = e == null ? void 0 : e.canvas) == null ? void 0 : h.draw) == null || f.call(h, !0, !0), (_ = (m = e == null ? void 0 : e.graph) == null ? void 0 : m.setDirtyCanvas) == null || _.call(m, !0, !0), (b = (g = e == null ? void 0 : e.graph) == null ? void 0 : g.change) == null || b.call(g), {
    ok: u > 0,
    count: u,
    reason: u > 0 ? "ok" : "no-match",
    targetNode: n
  };
}
function Ts(t = Q()) {
  var n, s;
  const e = ((n = t == null ? void 0 : t.canvas) == null ? void 0 : n.selected_nodes) ?? ((s = t == null ? void 0 : t.canvas) == null ? void 0 : s.selectedNodes) ?? null;
  return e ? Array.isArray(e) ? e.filter(Boolean)[0] || null : e instanceof Map ? Array.from(e.values()).filter(Boolean)[0] || null : typeof e == "object" && Object.values(e).filter(Boolean)[0] || null : null;
}
function vs(t) {
  var e, n;
  return [t == null ? void 0 : t.name, t == null ? void 0 : t.label, (e = t == null ? void 0 : t.options) == null ? void 0 : e.name, (n = t == null ? void 0 : t.options) == null ? void 0 : n.label].map(Ye).filter(Boolean);
}
function Ye(t) {
  return String(t ?? "").trim().toLowerCase().replace(/\s+/g, "_");
}
function _e(t) {
  return String(t ?? "").trim().toLowerCase();
}
function ks(t) {
  if (t == null || typeof t != "object") return t;
  try {
    return typeof structuredClone == "function" ? structuredClone(t) : JSON.parse(JSON.stringify(t));
  } catch {
    return t;
  }
}
class we {
  constructor({ large: e = !1 } = {}) {
    this._asset = null, this._workflow = null, this._selectedNodeId = "", this._renderInfo = null, this._resizeObserver = null, this._resizeObservedTarget = null, this._resizeObserverWindow = null, this._large = !!e, this._view = { zoom: 1, centerX: null, centerY: null }, this._drag = null, this._previewMedia = null, this._previewKey = "", this._el = this._build();
  }
  get el() {
    return this._el;
  }
  setAsset(e) {
    this._asset !== e && (this._asset = e || null, this._workflow = as(this._asset), this._selectedNodeId = "", this._view = { zoom: 1, centerX: null, centerY: null }, this.refresh(), is(this._workflow).then(() => this.refresh()).catch(() => {
    }));
  }
  refresh() {
    var e;
    this._ensureResizeObserver(), (e = this._el) != null && e.isConnected && (this._renderCanvas(), this._renderDetails());
  }
  dispose() {
    var e, n, s, o;
    this._disposePreviewMedia(), (n = (e = this._resizeObserver) == null ? void 0 : e.disconnect) == null || n.call(e), this._resizeObserver = null, (o = (s = this._el) == null ? void 0 : s.remove) == null || o.call(s);
  }
  _build() {
    var s, o, r, a, l, d;
    const e = document.createElement("div");
    e.className = "mjr-wgm", this._large && (e.className += " mjr-wgm--large");
    const n = document.createElement("div");
    return n.className = "mjr-wgm-map-wrap", this._mapWrap = n, this._large ? (this._canvas = document.createElement("canvas"), this._canvas.className = "mjr-wgm-canvas", (o = (s = this._canvas).addEventListener) == null || o.call(s, "click", (i) => this._handleCanvasClick(i)), (a = (r = this._canvas).addEventListener) == null || a.call(r, "wheel", (i) => this._handleWheel(i), {
      passive: !1
    }), (d = (l = this._canvas).addEventListener) == null || d.call(l, "pointerdown", (i) => this._handlePointerDown(i)), n.appendChild(this._canvas)) : (this._preview = document.createElement("div"), this._preview.className = "mjr-wgm-preview", n.appendChild(this._preview)), e.appendChild(n), this._status = document.createElement("div"), this._status.className = "mjr-wgm-status", e.appendChild(this._status), this._details = document.createElement("div"), this._details.className = "mjr-wgm-details", e.appendChild(this._details), this._ensureResizeObserver(), e;
  }
  _ensureResizeObserver() {
    var o, r, a, l;
    const e = this._mapWrap;
    if (!e) return;
    const n = et(e), s = (n == null ? void 0 : n.ResizeObserver) || globalThis.ResizeObserver;
    if (typeof s == "function" && !(this._resizeObserver && this._resizeObservedTarget === e && this._resizeObserverWindow === n)) {
      try {
        (r = (o = this._resizeObserver) == null ? void 0 : o.disconnect) == null || r.call(o);
      } catch (d) {
        (a = console.debug) == null || a.call(console, d);
      }
      try {
        this._resizeObserver = new s(() => this.refresh()), this._resizeObserver.observe(e), this._resizeObservedTarget = e, this._resizeObserverWindow = n;
      } catch (d) {
        (l = console.debug) == null || l.call(console, d), this._resizeObserver = null, this._resizeObservedTarget = null, this._resizeObserverWindow = null;
      }
    }
  }
  _renderCanvas() {
    var u, c, p;
    if (!this._large) {
      this._renderPreview();
      return;
    }
    const e = this._canvas;
    if (!e) return;
    const n = e.getBoundingClientRect(), s = Math.max(1, Math.floor(n.width || e.clientWidth || 1)), o = Math.max(1, Math.floor(n.height || e.clientHeight || 1)), r = et(e), a = Math.max(1, Math.min(2, Number(r == null ? void 0 : r.devicePixelRatio) || 1)), l = Math.floor(s * a), d = Math.floor(o * a);
    (e.width !== l || e.height !== d) && (e.width = l, e.height = d);
    const i = (u = e.getContext) == null ? void 0 : u.call(e, "2d");
    if (i && i.setTransform(a, 0, 0, a, 0, 0), !this._workflow) {
      (c = i == null ? void 0 : i.clearRect) == null || c.call(i, 0, 0, s, o), this._renderInfo = null;
      return;
    }
    this._renderInfo = ln(e, this._workflow, {
      showNodeLabels: !0,
      showViewport: !1,
      view: {
        hoveredNodeId: this._selectedNodeId || null,
        zoom: this._view.zoom,
        centerX: this._view.centerX,
        centerY: this._view.centerY
      }
    }), (p = this._renderInfo) != null && p.resolvedView && (this._view.centerX = this._renderInfo.resolvedView.centerX, this._view.centerY = this._renderInfo.resolvedView.centerY, this._view.zoom = this._renderInfo.resolvedView.zoom);
  }
  _renderDetails() {
    const e = Qt(this._workflow).length;
    if (!this._workflow) {
      this._status.textContent = this._large ? "No workflow graph in selected image" : "Selected asset - no workflow graph", pt(this._details);
      return;
    }
    this._status.textContent = this._large ? this._selectedNodeId ? `${e} nodes - selected #${this._selectedNodeId}` : `${e} nodes - select a node` : `${e} nodes - graph opened in viewer`;
    const n = Bt(this._workflow, this._selectedNodeId);
    if (!n) {
      const l = document.createElement("div");
      l.className = "mjr-ws-sidebar-empty", l.textContent = this._large ? "Click a node in the graph map" : "Use the large Graph Map in the viewer to select nodes", pt(this._details, l);
      return;
    }
    const s = document.createElement("div");
    s.className = "mjr-wgm-node-title", s.textContent = Xt(n);
    const o = document.createElement("div");
    o.className = "mjr-wgm-node-meta", o.textContent = `#${this._selectedNodeId} ${ls(n) || at(n) || "Node"}`;
    const r = document.createElement("div");
    r.className = "mjr-wgm-actions", r.appendChild(this._makeAction("Copy node", "pi pi-copy", () => Bs(n))), r.appendChild(
      this._makeAction("Import node", "pi pi-plus-circle", () => js(n))
    ), r.appendChild(
      this._makeAction(
        "Import workflow",
        "pi pi-download",
        () => Ps(this._workflow)
      )
    ), r.appendChild(
      this._makeAction("Transfer params to selected canvas node", "pi pi-arrow-right-arrow-left", () => {
        const l = xs(n);
        return l == null ? void 0 : l.ok;
      })
    );
    const a = document.createElement("div");
    a.className = "mjr-wgm-params";
    for (const [l, d] of He(n)) {
      const i = document.createElement("div");
      i.className = "mjr-wgm-param", i.tabIndex = 0, i.role = "button", i.title = `Copy ${String(l)}`;
      const u = document.createElement("span");
      u.className = "mjr-wgm-param-key", u.textContent = String(l);
      const c = document.createElement("span");
      c.className = "mjr-wgm-param-value", c.textContent = Fs(d), i.appendChild(u), i.appendChild(c), i.addEventListener("click", () => this._copyParam(i, d)), i.addEventListener("keydown", (p) => {
        var h;
        p.key !== "Enter" && p.key !== " " || ((h = p.preventDefault) == null || h.call(p), this._copyParam(i, d));
      }), a.appendChild(i);
    }
    if (!a.childElementCount) {
      const l = document.createElement("div");
      l.className = "mjr-ws-node-empty", l.textContent = "No simple parameters found", a.appendChild(l);
    }
    pt(this._details, s, o, r, a);
  }
  _makeAction(e, n, s) {
    const o = document.createElement("button");
    return o.type = "button", o.className = "mjr-wgm-action", o.title = e, o.innerHTML = `<i class="${n}" aria-hidden="true"></i><span>${e}</span>`, o.addEventListener("click", async () => {
      var r;
      try {
        const a = await s();
        o.classList.toggle("is-ok", !!a), et(o).setTimeout(() => o.classList.remove("is-ok"), 700);
      } catch (a) {
        (r = console.debug) == null || r.call(console, "[MFV Graph Map] action failed", a);
      }
    }), o;
  }
  async _copyParam(e, n) {
    var s;
    try {
      const o = await Ls(n);
      e.classList.toggle("is-ok", !!o), e.classList.toggle("is-error", !o), et(e).setTimeout(() => {
        e.classList.remove("is-ok"), e.classList.remove("is-error");
      }, 750);
    } catch (o) {
      e.classList.add("is-error"), et(e).setTimeout(() => e.classList.remove("is-error"), 750), (s = console.debug) == null || s.call(console, "[MFV Graph Map] param copy failed", o);
    }
  }
  _renderPreview() {
    var r, a;
    if (!this._preview) return;
    const e = Os(this._asset), n = Gs(e);
    if (this._previewMedia && n && n === this._previewKey) {
      (this._preview.firstChild !== this._previewMedia || this._preview.childNodes.length !== 1) && pt(this._preview, this._previewMedia);
      return;
    }
    this._disposePreviewMedia();
    const s = nt(e, { fill: !0 });
    if (s) {
      (a = (r = s.classList) == null ? void 0 : r.add) == null || a.call(r, "mjr-wgm-preview-media"), this._previewMedia = s, this._previewKey = n, this._preview.appendChild(s);
      return;
    }
    const o = document.createElement("div");
    o.className = "mjr-wgm-preview-empty", o.textContent = "No preview", pt(this._preview, o);
  }
  _disposePreviewMedia() {
    var n, s, o, r, a, l, d;
    const e = this._previewMedia;
    if (this._previewMedia = null, this._previewKey = "", !!e) {
      try {
        (s = (n = e._mjrMediaControlsHandle) == null ? void 0 : n.destroy) == null || s.call(n);
      } catch (i) {
        (o = console.debug) == null || o.call(console, "[MFV Graph Map] preview cleanup failed", i);
      }
      try {
        const i = ((r = e.querySelectorAll) == null ? void 0 : r.call(e, "video, audio")) || [];
        for (const u of i) (a = u.pause) == null || a.call(u);
      } catch (i) {
        (l = console.debug) == null || l.call(console, "[MFV Graph Map] preview pause failed", i);
      }
      (d = e.remove) == null || d.call(e);
    }
  }
  _handleCanvasClick(e) {
    var o, r, a;
    if ((o = this._drag) != null && o.moved) return;
    const n = this._canvas.getBoundingClientRect(), s = (a = (r = this._renderInfo) == null ? void 0 : r.hitTestNode) == null ? void 0 : a.call(r, e.clientX - n.left, e.clientY - n.top);
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
    var a, l, d, i;
    if (!this._workflow || e.button !== 0) return;
    const n = (a = this._renderInfo) == null ? void 0 : a.resolvedView;
    if (!(n != null && n.renderScale)) return;
    (l = e.preventDefault) == null || l.call(e), (i = (d = this._canvas).setPointerCapture) == null || i.call(d, e.pointerId), this._drag = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      centerX: Number(this._view.centerX ?? n.centerX),
      centerY: Number(this._view.centerY ?? n.centerY),
      scale: Number(n.renderScale) || 1,
      moved: !1
    };
    const s = (u) => {
      if (!this._drag || u.pointerId !== this._drag.pointerId) return;
      const c = u.clientX - this._drag.startX, p = u.clientY - this._drag.startY;
      Math.abs(c) + Math.abs(p) > 3 && (this._drag.moved = !0), this._view.centerX = this._drag.centerX - c / this._drag.scale, this._view.centerY = this._drag.centerY - p / this._drag.scale, this._renderCanvas(), this._renderDetails();
    }, o = (u) => {
      var p, h;
      if (!this._drag || u.pointerId !== this._drag.pointerId) return;
      (h = (p = this._canvas).releasePointerCapture) == null || h.call(p, u.pointerId);
      const c = et(this._canvas);
      c.removeEventListener("pointermove", s), c.removeEventListener("pointerup", o), c.removeEventListener("pointercancel", o), c.setTimeout(() => {
        this._drag = null;
      }, 0);
    }, r = et(this._canvas);
    r.addEventListener("pointermove", s), r.addEventListener("pointerup", o), r.addEventListener("pointercancel", o);
  }
}
function et(t) {
  var e;
  return ((e = t == null ? void 0 : t.ownerDocument) == null ? void 0 : e.defaultView) || window;
}
function pt(t, ...e) {
  if (t) {
    for (; t.firstChild; ) t.removeChild(t.firstChild);
    for (const n of e) t.appendChild(n);
  }
}
function Fs(t) {
  if (t == null) return "";
  if (typeof t == "string") return t.replace(/\s+/g, " ").trim();
  if (typeof t == "number" || typeof t == "boolean") return String(t);
  try {
    return JSON.stringify(t);
  } catch {
    return String(t);
  }
}
function Os(t) {
  if (!t || typeof t != "object") return t;
  const n = (Array.isArray(t.previewCandidates) ? t.previewCandidates : []).find((l) => String(l || "").trim()) || t.url || "", s = String(t.type || "").toLowerCase(), o = String(t.kind || "").toLowerCase(), r = String(t.filename || t.name || ""), a = o || (t.isVideo || s === "video" || /\.(mp4|mov|webm|mkv|avi)$/i.test(r) ? "video" : t.isAudio || s === "audio" || /\.(mp3|wav|flac|ogg|m4a|aac|opus|wma)$/i.test(r) ? "audio" : t.isModel3d || s === "model3d" ? "model3d" : "");
  return {
    ...t,
    ...n ? { url: n } : null,
    ...a ? { kind: a, asset_type: a } : null
  };
}
function Gs(t) {
  return !t || typeof t != "object" ? "" : JSON.stringify({
    url: String(t.url || ""),
    filename: String(t.filename || t.name || ""),
    kind: String(t.kind || t.asset_type || t.type || ""),
    subfolder: String(t.subfolder || ""),
    id: t.id ?? ""
  });
}
const Rs = 16, Vs = 250;
class Hs {
  constructor({ hostEl: e, onClose: n, onOpenGraphMap: s, onCloseGraphMap: o } = {}) {
    this._hostEl = e, this._onClose = n ?? null, this._onOpenGraphMap = s ?? null, this._onCloseGraphMap = o ?? null, this._visible = !1, this._liveSyncHandle = null, this._liveSyncMode = "", this._lastLiveSyncAt = 0, this._resizeCleanup = null, this._nodesTab = new ts(), this._graphMapPanel = new we(), this._activeMode = "nodes", this._asset = null, this._el = this._build();
  }
  get el() {
    return this._el;
  }
  get isVisible() {
    return this._visible;
  }
  show() {
    this._visible = !0, this._el.classList.add("open"), this.refresh(), this._lastLiveSyncAt = ge(this._el), this._startLiveSync();
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
    var e, n, s, o, r;
    this._stopLiveSync(), this._disposeResize(), (n = (e = this._nodesTab) == null ? void 0 : e.dispose) == null || n.call(e), (o = (s = this._graphMapPanel) == null ? void 0 : s.dispose) == null || o.call(s), this._nodesTab = null, this._graphMapPanel = null, (r = this._el) == null || r.remove();
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
      var d, i;
      const l = this._activeMode === "graph";
      this.hide(), l && ((d = this._onCloseGraphMap) == null || d.call(this)), (i = this._onClose) == null || i.call(this);
    }), n.appendChild(o), e.appendChild(n);
    const r = document.createElement("div");
    r.className = "mjr-ws-tab-bar", this._nodesModeBtn = this._makeModeButton("Nodes", "pi pi-sliders-h", "nodes"), this._graphModeBtn = this._makeModeButton("Graph Map", "pi pi-sitemap", "graph"), r.appendChild(this._nodesModeBtn), r.appendChild(this._graphModeBtn), e.appendChild(r);
    const a = document.createElement("div");
    return a.className = "mjr-ws-sidebar-resizer", a.setAttribute("role", "separator"), a.setAttribute("aria-orientation", "vertical"), a.setAttribute("aria-hidden", "true"), e.appendChild(a), this._bindResize(a), this._body = document.createElement("div"), this._body.className = "mjr-ws-sidebar-body", e.appendChild(this._body), this._renderActiveMode(), e;
  }
  _makeModeButton(e, n, s) {
    const o = document.createElement("button");
    return o.type = "button", o.className = "mjr-ws-tab", o.dataset.mode = s, o.innerHTML = `<i class="${n}" aria-hidden="true"></i><span>${e}</span>`, o.addEventListener("click", () => this._setMode(s)), o;
  }
  _setMode(e) {
    var s, o, r;
    const n = e === "graph" ? "graph" : "nodes";
    this._activeMode === n && ((s = this._body) != null && s.firstElementChild) || (this._activeMode = n, this._renderActiveMode(), n === "graph" ? (o = this._onOpenGraphMap) == null || o.call(this) : (r = this._onCloseGraphMap) == null || r.call(this), this.refresh());
  }
  _renderActiveMode() {
    var n, s, o, r, a, l, d, i;
    if (!this._body) return;
    (s = (n = this._nodesModeBtn) == null ? void 0 : n.classList) == null || s.toggle("is-active", this._activeMode === "nodes"), (r = (o = this._graphModeBtn) == null ? void 0 : o.classList) == null || r.toggle("is-active", this._activeMode === "graph"), (a = this._nodesModeBtn) == null || a.setAttribute("aria-pressed", String(this._activeMode === "nodes")), (l = this._graphModeBtn) == null || l.setAttribute("aria-pressed", String(this._activeMode === "graph"));
    const e = this._activeMode === "graph" ? (d = this._graphMapPanel) == null ? void 0 : d.el : (i = this._nodesTab) == null ? void 0 : i.el;
    if (e && this._body.firstElementChild !== e) {
      for (; this._body.firstChild; ) this._body.removeChild(this._body.firstChild);
      this._body.appendChild(e);
    }
  }
  _startLiveSync() {
    if (this._liveSyncHandle != null) return;
    const e = Dt(this._el), n = (s) => {
      if (this._liveSyncHandle = null, this._liveSyncMode = "", !this._visible) return;
      const o = Number.isFinite(Number(s)) ? Number(s) : ge(this._el);
      o - this._lastLiveSyncAt >= Vs && (this._lastLiveSyncAt = o, this.syncFromGraph()), this._startLiveSync();
    };
    if (typeof e.requestAnimationFrame == "function") {
      this._liveSyncMode = "raf", this._liveSyncHandle = e.requestAnimationFrame(n);
      return;
    }
    this._liveSyncMode = "timeout", this._liveSyncHandle = e.setTimeout(n, Rs);
  }
  _stopLiveSync() {
    var n;
    if (this._liveSyncHandle == null) return;
    const e = Dt(this._el);
    try {
      this._liveSyncMode === "raf" && typeof e.cancelAnimationFrame == "function" ? e.cancelAnimationFrame(this._liveSyncHandle) : typeof e.clearTimeout == "function" && e.clearTimeout(this._liveSyncHandle);
    } catch (s) {
      (n = console.debug) == null || n.call(console, s);
    }
    this._liveSyncHandle = null, this._liveSyncMode = "";
  }
  _bindResize(e) {
    if (!e) return;
    const s = (e.ownerDocument || document).defaultView || window, o = 180, r = (a) => {
      var _;
      if (a.button !== 0 || !((_ = this._el) != null && _.classList.contains("open"))) return;
      const l = this._el.parentElement;
      if (!l) return;
      const d = this._el.getBoundingClientRect(), i = l.getBoundingClientRect(), u = l.getAttribute("data-sidebar-pos") || "right", c = Math.max(
        o,
        Math.floor(i.width * (u === "bottom" ? 1 : 0.65))
      );
      if (u === "bottom") return;
      a.preventDefault(), a.stopPropagation(), e.classList.add("is-dragging"), this._el.classList.add("is-resizing");
      const p = a.clientX, h = d.width, f = (g) => {
        const b = g.clientX - p, y = u === "left" ? h - b : h + b, A = Math.max(o, Math.min(c, y));
        this._el.style.width = `${Math.round(A)}px`;
      }, m = () => {
        e.classList.remove("is-dragging"), this._el.classList.remove("is-resizing"), s.removeEventListener("pointermove", f), s.removeEventListener("pointerup", m), s.removeEventListener("pointercancel", m);
      };
      s.addEventListener("pointermove", f), s.addEventListener("pointerup", m), s.addEventListener("pointercancel", m);
    };
    e.addEventListener("pointerdown", r), this._resizeCleanup = () => e.removeEventListener("pointerdown", r);
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
function Dt(t) {
  var n;
  const e = ((n = t == null ? void 0 : t.ownerDocument) == null ? void 0 : n.defaultView) || null;
  return e || (typeof window < "u" ? window : globalThis);
}
function ge(t) {
  var s;
  const e = Dt(t), n = (s = e == null ? void 0 : e.performance) == null ? void 0 : s.now;
  if (typeof n == "function")
    try {
      return Number(n.call(e.performance)) || Date.now();
    } catch {
      return Date.now();
    }
  return Date.now();
}
const W = Object.freeze({
  IDLE: "idle",
  RUNNING: "running",
  STOPPING: "stopping",
  ERROR: "error"
}), Ws = /* @__PURE__ */ new Set(["default", "auto", "latent2rgb", "taesd", "none"]), be = "progress-update";
function zs() {
  const t = document.createElement("div");
  t.className = "mjr-mfv-run-controls";
  const e = document.createElement("button");
  e.type = "button", e.className = "mjr-icon-btn mjr-mfv-run-btn";
  const n = R("tooltip.queuePrompt", "Queue Prompt (Run)");
  e.title = n, e.setAttribute("aria-label", n);
  const s = document.createElement("i");
  s.className = "pi pi-play", s.setAttribute("aria-hidden", "true"), e.appendChild(s);
  const o = document.createElement("button");
  o.type = "button", o.className = "mjr-icon-btn mjr-mfv-stop-btn";
  const r = document.createElement("i");
  r.className = "pi pi-stop", r.setAttribute("aria-hidden", "true"), o.appendChild(r), t.appendChild(e), t.appendChild(o);
  let a = W.IDLE, l = !1, d = !1, i = null;
  function u() {
    i != null && (clearTimeout(i), i = null);
  }
  function c(y, { canStop: A = !1 } = {}) {
    a = y, e.classList.toggle("running", a === W.RUNNING), e.classList.toggle("stopping", a === W.STOPPING), e.classList.toggle("error", a === W.ERROR), e.disabled = a === W.RUNNING || a === W.STOPPING, o.disabled = !A || a === W.STOPPING, o.classList.toggle("active", A && a !== W.STOPPING), o.classList.toggle("stopping", a === W.STOPPING), a === W.RUNNING || a === W.STOPPING ? s.className = "pi pi-spin pi-spinner" : s.className = "pi pi-play";
  }
  function p() {
    const y = R("tooltip.queueStop", "Stop Generation");
    o.title = y, o.setAttribute("aria-label", y);
  }
  function h(y = Et.getSnapshot(), { authoritative: A = !1 } = {}) {
    const C = Math.max(0, Number(y == null ? void 0 : y.queue) || 0), S = (y == null ? void 0 : y.prompt) || null, x = !!(S != null && S.currentlyExecuting), P = !!(S && (S.currentlyExecuting || S.errorDetails)), B = C > 0 || P, v = !!(S != null && S.errorDetails);
    A && C === 0 && !S && (l = !1, d = !1);
    const I = l || d || x || C > 0;
    if ((x || B || C > 0) && (l = !1), v) {
      d = !1, u(), c(W.ERROR, { canStop: !1 });
      return;
    }
    if (d) {
      if (!I) {
        d = !1, h(y);
        return;
      }
      c(W.STOPPING, { canStop: !1 });
      return;
    }
    if (l || x || B || C > 0) {
      u(), c(W.RUNNING, { canStop: !0 });
      return;
    }
    u(), c(W.IDLE, { canStop: !1 });
  }
  function f() {
    l = !1, d = !1, u(), c(W.ERROR, { canStop: !1 }), i = setTimeout(() => {
      i = null, h();
    }, 1500);
  }
  async function m() {
    const y = Q(), C = (y != null && y.api && typeof y.api.interrupt == "function" ? y.api : null) ?? Ie(y);
    if (C && typeof C.interrupt == "function")
      return await C.interrupt(), { tracked: !0 };
    if (C && typeof C.fetchApi == "function") {
      const x = await C.fetchApi("/interrupt", { method: "POST" });
      if (!(x != null && x.ok)) throw new Error(`POST /interrupt failed (${x == null ? void 0 : x.status})`);
      return { tracked: !0 };
    }
    const S = await fetch("/interrupt", { method: "POST", credentials: "include" });
    if (!S.ok) throw new Error(`POST /interrupt failed (${S.status})`);
    return { tracked: !1 };
  }
  async function _() {
    var y;
    if (!(a === W.RUNNING || a === W.STOPPING)) {
      l = !0, d = !1, h();
      try {
        const A = await qs();
        A != null && A.tracked || (l = !1), h();
      } catch (A) {
        (y = console.error) == null || y.call(console, "[MFV Run]", A), f();
      }
    }
  }
  async function g() {
    var y;
    if (a === W.RUNNING) {
      d = !0, h();
      try {
        const A = await m();
        A != null && A.tracked || (d = !1, l = !1), h();
      } catch (A) {
        (y = console.error) == null || y.call(console, "[MFV Stop]", A), d = !1, h();
      } finally {
      }
    }
  }
  p(), o.disabled = !0, e.addEventListener("click", _), o.addEventListener("click", g);
  const b = (y) => {
    h((y == null ? void 0 : y.detail) || Et.getSnapshot(), {
      authoritative: !0
    });
  };
  return Et.addEventListener(be, b), cn({ timeoutMs: 4e3 }).catch((y) => {
    var A;
    (A = console.debug) == null || A.call(console, y);
  }), h(), {
    el: t,
    dispose() {
      u(), e.removeEventListener("click", _), o.removeEventListener("click", g), Et.removeEventListener(
        be,
        b
      );
    }
  };
}
function Ds(t = gt.MFV_PREVIEW_METHOD) {
  const e = String(t || "").trim().toLowerCase();
  return Ws.has(e) ? e : "taesd";
}
function Qe(t, e = gt.MFV_PREVIEW_METHOD) {
  var o;
  const n = Ds(e), s = {
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
function ye(t, { previewMethod: e = gt.MFV_PREVIEW_METHOD, clientId: n = null } = {}) {
  const s = Qe(t, e), o = {
    prompt: s == null ? void 0 : s.output,
    extra_data: (s == null ? void 0 : s.extra_data) || {}
  }, r = String(n || "").trim();
  return r && (o.client_id = r), o;
}
function Ce(t, e) {
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
function Xe(t) {
  if (!t || typeof t != "object") return [];
  if (Array.isArray(t.nodes)) return t.nodes.filter(Boolean);
  if (Array.isArray(t._nodes)) return t._nodes.filter(Boolean);
  const e = t._nodes_by_id ?? t.nodes_by_id ?? null;
  return e instanceof Map ? Array.from(e.values()).filter(Boolean) : e && typeof e == "object" ? Object.values(e).filter(Boolean) : [];
}
function Us(t) {
  var n, s, o, r;
  const e = [
    t == null ? void 0 : t.subgraph,
    t == null ? void 0 : t._subgraph,
    (n = t == null ? void 0 : t.subgraph) == null ? void 0 : n.graph,
    (s = t == null ? void 0 : t.subgraph) == null ? void 0 : s.lgraph,
    (o = t == null ? void 0 : t.properties) == null ? void 0 : o.subgraph,
    t == null ? void 0 : t.subgraph_instance,
    (r = t == null ? void 0 : t.subgraph_instance) == null ? void 0 : r.graph,
    t == null ? void 0 : t.inner_graph,
    t == null ? void 0 : t.subgraph_graph
  ].filter((a) => a && Xe(a).length > 0);
  return Array.isArray(t == null ? void 0 : t.nodes) && t.nodes.length > 0 && e.push({ nodes: t.nodes }), e;
}
function ft(t, e, n = /* @__PURE__ */ new Set()) {
  if (!(!t || n.has(t))) {
    n.add(t);
    for (const s of Xe(t)) {
      e(s);
      for (const o of Us(s))
        ft(o, e, n);
    }
  }
}
function qe(t) {
  if (t == null || typeof t != "object") return t;
  try {
    return typeof structuredClone == "function" ? structuredClone(t) : JSON.parse(JSON.stringify(t));
  } catch {
    return t;
  }
}
function Ys(t) {
  const e = [];
  return ft(t, (n) => {
    for (const s of n.widgets ?? [])
      e.push({
        widget: s,
        value: qe(s == null ? void 0 : s.value)
      });
  }), e;
}
function ws(t, e) {
  var n, s, o, r, a, l;
  for (const d of Array.isArray(e) ? e : []) {
    const i = d == null ? void 0 : d.widget;
    if (!i || typeof i != "object") continue;
    const u = qe(d == null ? void 0 : d.value);
    try {
      i.value = u;
    } catch (c) {
      (n = console.debug) == null || n.call(console, c);
      continue;
    }
    try {
      (s = i.callback) == null || s.call(i, u);
    } catch (c) {
      (o = console.debug) == null || o.call(console, c);
    }
  }
  try {
    (a = (r = t == null ? void 0 : t.canvas) == null ? void 0 : r.draw) == null || a.call(r, !0, !0);
  } catch (d) {
    (l = console.debug) == null || l.call(console, d);
  }
}
function Qs(t) {
  var n;
  return [t == null ? void 0 : t.type, t == null ? void 0 : t.comfyClass, t == null ? void 0 : t.class_type, (n = t == null ? void 0 : t.constructor) == null ? void 0 : n.type].some((s) => /Api$/i.test(String(s || "").trim()));
}
function Xs(t) {
  let e = !1;
  return ft(t, (n) => {
    e || (e = Qs(n));
  }), e;
}
async function qs() {
  var l, d;
  const t = Q();
  if (!t) throw new Error("ComfyUI app not available");
  const n = (t != null && t.api && typeof t.api.queuePrompt == "function" ? t.api : null) ?? Ie(t), s = !!(n && typeof n.queuePrompt == "function" || n && typeof n.fetchApi == "function"), o = t.rootGraph ?? t.graph;
  if ((Xs(o) || !s) && typeof t.queuePrompt == "function")
    return await t.queuePrompt(0), { tracked: !0 };
  let a = null;
  try {
    a = Ys(o), ft(o, (c) => {
      var p;
      for (const h of c.widgets ?? [])
        (p = h.beforeQueued) == null || p.call(h, { isPartialExecution: !1 });
    });
    const i = typeof t.graphToPrompt == "function" ? await t.graphToPrompt() : null;
    if (!(i != null && i.output)) throw new Error("graphToPrompt returned empty output");
    let u;
    if (n && typeof n.queuePrompt == "function")
      await n.queuePrompt(0, Qe(i)), u = { tracked: !0 };
    else if (n && typeof n.fetchApi == "function") {
      const c = await n.fetchApi("/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          ye(i, {
            clientId: Ce(n, t)
          })
        )
      });
      if (!(c != null && c.ok)) throw new Error(`POST /prompt failed (${c == null ? void 0 : c.status})`);
      u = { tracked: !0 };
    } else {
      const c = await fetch("/prompt", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          ye(i, {
            clientId: Ce(null, t)
          })
        )
      });
      if (!c.ok) throw new Error(`POST /prompt failed (${c.status})`);
      u = { tracked: !1 };
    }
    return ft(o, (c) => {
      var p;
      for (const h of c.widgets ?? [])
        (p = h.afterQueued) == null || p.call(h, { isPartialExecution: !1 });
    }), (d = (l = t.canvas) == null ? void 0 : l.draw) == null || d.call(l, !0, !0), u;
  } catch (i) {
    throw ws(t, a), i;
  }
}
function Ks(t) {
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
  for (const [r, a] of n) {
    const l = fn((a == null ? void 0 : a.name) || (a == null ? void 0 : a.value) || a || "");
    if (!(!l || s.has(l)) && (s.add(l), o.push(`${r}: ${l}`), o.length >= 3))
      break;
  }
  return o.join(" | ");
}
function Zs(t) {
  const e = hn(t);
  return e.workflowLabel ? e.workflowBadge ? `${e.workflowLabel} • ${e.workflowBadge}` : e.workflowLabel : "";
}
function Js(t, e, n, s) {
  const o = document.createElement("div");
  o.className = "mjr-mfv-idrop";
  const r = document.createElement("button");
  r.type = "button", r.className = "mjr-icon-btn mjr-mfv-idrop-trigger", r.title = e, r.innerHTML = t, r.setAttribute("aria-haspopup", "listbox"), r.setAttribute("aria-expanded", "false"), o.appendChild(r);
  const a = document.createElement("div");
  a.className = "mjr-mfv-idrop-menu", a.setAttribute("role", "listbox");
  const l = (s == null ? void 0 : s.element) || o;
  l.appendChild(a);
  const d = document.createElement("select");
  d.style.cssText = "position:absolute;opacity:0;pointer-events:none;width:0;height:0;overflow:hidden;", o.appendChild(d);
  const i = [];
  for (const p of n) {
    const h = document.createElement("option");
    h.value = String(p.value), d.appendChild(h);
    const f = document.createElement("button");
    f.type = "button", f.className = "mjr-mfv-idrop-item", f.setAttribute("role", "option"), f.dataset.value = String(p.value), f.innerHTML = p.html ?? String(p.label ?? p.value), a.appendChild(f), i.push(f);
  }
  const u = () => {
    a.classList.remove("is-open"), r.setAttribute("aria-expanded", "false");
  };
  return r.addEventListener("click", (p) => {
    var f, m, _;
    p.stopPropagation();
    const h = a.classList.contains("is-open");
    if ((m = (f = s == null ? void 0 : s.element) == null ? void 0 : f.querySelectorAll) == null || m.call(f, ".mjr-mfv-idrop-menu.is-open").forEach((g) => g.classList.remove("is-open")), !h) {
      const g = r.getBoundingClientRect(), b = ((_ = l.getBoundingClientRect) == null ? void 0 : _.call(l)) || { left: 0, top: 0 };
      a.style.left = `${g.left - b.left}px`, a.style.top = `${g.bottom - b.top + 4}px`, a.classList.add("is-open"), r.setAttribute("aria-expanded", "true");
    }
  }), a.addEventListener("click", (p) => {
    const h = p.target.closest(".mjr-mfv-idrop-item");
    h && (d.value = h.dataset.value, d.dispatchEvent(new Event("change", { bubbles: !0 })), i.forEach((f) => {
      f.classList.toggle("is-selected", f === h), f.setAttribute("aria-selected", String(f === h));
    }), u());
  }), { wrap: o, trigger: r, menu: a, select: d, selectItem: (p) => {
    d.value = String(p), i.forEach((h) => {
      h.classList.toggle("is-selected", h.dataset.value === String(p)), h.setAttribute("aria-selected", String(h.dataset.value === String(p)));
    });
  } };
}
const $s = {
  rgb: "#e0e0e0",
  r: "#ff5555",
  g: "#44dd66",
  b: "#5599ff",
  a: "#ffffff",
  l: "#bbbbbb"
}, to = { rgb: "RGB", r: "R", g: "G", b: "B", a: "A", l: "L" }, eo = { rgb: "500", r: "700", g: "700", b: "700", a: "700", l: "400" };
function no(t) {
  var n;
  const e = document.createElement("div");
  return e.className = "mjr-mfv", e.setAttribute("role", "dialog"), e.setAttribute("aria-modal", "false"), e.setAttribute("aria-hidden", "true"), t.element = e, e.appendChild(t._buildHeader()), e.setAttribute("aria-labelledby", t._titleId), e.appendChild(t._buildToolbar()), e.appendChild(dn(t)), t._contentWrapper = document.createElement("div"), t._contentWrapper.className = "mjr-mfv-content-wrapper", t._applySidebarPosition(), t._contentEl = document.createElement("div"), t._contentEl.className = "mjr-mfv-content", t._contentWrapper.appendChild(t._contentEl), t._overlayCanvas = document.createElement("canvas"), t._overlayCanvas.className = "mjr-mfv-overlay-canvas", t._contentEl.appendChild(t._overlayCanvas), t._contentEl.appendChild(un(t)), t._genSidebarEl = document.createElement("aside"), t._genSidebarEl.className = "mjr-mfv-gen-sidebar", t._genSidebarEl.setAttribute("aria-label", "Generation info"), t._genSidebarEl.setAttribute("hidden", ""), t._sidebar = new Hs({
    hostEl: e,
    onClose: () => t._updateSettingsBtnState(!1),
    onOpenGraphMap: () => {
      var s;
      return (s = t.setMode) == null ? void 0 : s.call(t, L.GRAPH);
    },
    onCloseGraphMap: () => {
      var s;
      t._mode === L.GRAPH && ((s = t.setMode) == null || s.call(t, L.SIMPLE));
    }
  }), t._contentWrapper.appendChild(t._genSidebarEl), t._contentWrapper.appendChild(t._sidebar.el), e.appendChild(t._contentWrapper), t._rebindControlHandlers(), t._bindPanelInteractions(), t._bindDocumentUiHandlers(), (n = t._bindLayoutObserver) == null || n.call(t), t._onSidebarPosChanged = (s) => {
    var o;
    ((o = s == null ? void 0 : s.detail) == null ? void 0 : o.key) === "viewer.mfvSidebarPosition" && t._applySidebarPosition();
  }, window.addEventListener("mjr-settings-changed", t._onSidebarPosChanged), t._refresh(), e;
}
function so(t) {
  const e = document.createElement("div");
  e.className = "mjr-mfv-header";
  const n = document.createElement("span");
  n.className = "mjr-mfv-header-title", n.id = t._titleId;
  const s = document.createElement("i");
  s.className = "mjr-mfv-header-title-icon pi pi-eye", s.setAttribute("aria-hidden", "true");
  const o = document.createElement("span");
  o.textContent = "Majoor Floating Viewer", n.append(s, o);
  const r = document.createElement("button");
  t._closeBtn = r, r.type = "button", r.className = "mjr-icon-btn mjr-mfv-close-btn", Nt(r, R("tooltip.closeViewer", "Close viewer"), Sn);
  const a = document.createElement("i");
  return a.className = "pi pi-times", a.setAttribute("aria-hidden", "true"), r.appendChild(a), e.appendChild(n), e.appendChild(r), e;
}
function oo(t) {
  const e = (N, { min: E, max: j, step: F, value: T } = {}) => {
    const U = document.createElement("div");
    U.className = "mjr-mfv-toolbar-range";
    const Y = document.createElement("input");
    Y.type = "range", Y.min = String(E), Y.max = String(j), Y.step = String(F), Y.value = String(T), Y.title = N || "";
    const tt = document.createElement("span");
    return tt.className = "mjr-mfv-toolbar-range-out", tt.textContent = Number(T).toFixed(2), U.appendChild(Y), U.appendChild(tt), { wrap: U, input: Y, out: tt };
  }, n = document.createElement("div");
  n.className = "mjr-mfv-toolbar";
  const s = Js(
    '<i class="pi pi-image" aria-hidden="true"></i>',
    "Viewer mode",
    [
      {
        value: L.SIMPLE,
        html: '<i class="pi pi-image" aria-hidden="true"></i><span>Simple</span>'
      },
      {
        value: L.AB,
        html: '<i class="pi pi-clone" aria-hidden="true"></i><span>A/B Compare</span>'
      },
      {
        value: L.SIDE,
        html: '<i class="pi pi-table" aria-hidden="true"></i><span>Side-by-side</span>'
      },
      {
        value: L.GRID,
        html: '<i class="pi pi-th-large" aria-hidden="true"></i><span>Grid</span>'
      },
      {
        value: L.GRAPH,
        html: '<i class="pi pi-sitemap" aria-hidden="true"></i><span>Graph Map</span>'
      }
    ],
    t
  );
  t._modeDrop = s, t._modeBtn = s.trigger, t._modeSelect = s.select, t._updateModeBtnUI(), n.appendChild(s.wrap);
  const o = document.createElement("button");
  o.type = "button", o.className = "mjr-icon-btn mjr-mfv-pin-trigger", o.title = "Pin slots A/B/C/D", o.setAttribute("aria-haspopup", "dialog"), o.setAttribute("aria-expanded", "false"), o.innerHTML = '<i class="pi pi-map-marker" aria-hidden="true"></i>', n.appendChild(o);
  const r = document.createElement("div");
  r.className = "mjr-mfv-pin-popover", t.element.appendChild(r);
  const a = document.createElement("div");
  a.className = "mjr-menu", a.style.cssText = "display:grid;gap:4px;", a.setAttribute("role", "group"), a.setAttribute("aria-label", "Pin References"), r.appendChild(a), t._pinGroup = a, t._pinBtns = {};
  for (const N of ["A", "B", "C", "D"]) {
    const E = document.createElement("button");
    E.type = "button", E.className = "mjr-menu-item mjr-mfv-pin-btn", E.dataset.slot = N, E.title = `Pin Asset ${N}`, E.setAttribute("aria-pressed", "false");
    const j = document.createElement("span");
    j.className = "mjr-menu-item-label", j.textContent = `Asset ${N}`;
    const F = document.createElement("i");
    F.className = "pi pi-map-marker mjr-menu-item-check", F.style.opacity = "0", E.appendChild(j), E.appendChild(F), a.appendChild(E), t._pinBtns[N] = E;
  }
  t._updatePinUI(), t._pinBtn = o, t._pinPopover = r;
  const l = () => {
    const N = o.getBoundingClientRect(), E = t.element.getBoundingClientRect();
    r.style.left = `${N.left - E.left}px`, r.style.top = `${N.bottom - E.top + 4}px`, r.classList.add("is-open"), o.setAttribute("aria-expanded", "true");
  };
  t._closePinPopover = () => {
    r.classList.remove("is-open"), o.setAttribute("aria-expanded", "false");
  }, o.addEventListener("click", (N) => {
    var E;
    N.stopPropagation(), r.classList.contains("is-open") ? t._closePinPopover() : ((E = t._closeAllToolbarPopovers) == null || E.call(t), l());
  });
  const d = document.createElement("button");
  d.type = "button", d.className = "mjr-icon-btn mjr-mfv-guides-trigger", d.title = "Guides", d.setAttribute("aria-haspopup", "listbox"), d.setAttribute("aria-expanded", "false");
  const i = document.createElement("img");
  i.src = new URL("data:image/png;base64,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", import.meta.url).href, i.className = "mjr-mfv-guides-icon", i.alt = "", i.setAttribute("aria-hidden", "true"), d.appendChild(i), n.appendChild(d);
  const u = document.createElement("div");
  u.className = "mjr-mfv-guides-popover", t.element.appendChild(u);
  const c = document.createElement("div");
  c.className = "mjr-menu", c.style.cssText = "display:grid;gap:4px;", u.appendChild(c);
  const p = document.createElement("select");
  p.style.cssText = "position:absolute;opacity:0;pointer-events:none;width:0;height:0;overflow:hidden;", u.appendChild(p);
  const h = [
    { value: "0", label: "Off" },
    { value: "1", label: "Thirds" },
    { value: "2", label: "Center" },
    { value: "3", label: "Safe" }
  ], f = String(t._gridMode || 0), m = [];
  for (const N of h) {
    const E = document.createElement("option");
    E.value = N.value, p.appendChild(E);
    const j = document.createElement("button");
    j.type = "button", j.className = "mjr-menu-item", j.dataset.value = N.value;
    const F = document.createElement("span");
    F.className = "mjr-menu-item-label", F.textContent = N.label;
    const T = document.createElement("i");
    T.className = "pi pi-check mjr-menu-item-check", T.style.opacity = N.value === f ? "1" : "0", j.appendChild(F), j.appendChild(T), c.appendChild(j), m.push(j), N.value === f && j.classList.add("is-active");
  }
  p.value = f, d.classList.toggle("is-on", f !== "0"), t._guidesSelect = p, t._guideBtn = d, t._guidePopover = u;
  const _ = () => {
    const N = d.getBoundingClientRect(), E = t.element.getBoundingClientRect();
    u.style.left = `${N.left - E.left}px`, u.style.top = `${N.bottom - E.top + 4}px`, u.classList.add("is-open"), d.setAttribute("aria-expanded", "true");
  };
  t._closeGuidePopover = () => {
    u.classList.remove("is-open"), d.setAttribute("aria-expanded", "false");
  }, d.addEventListener("click", (N) => {
    var E;
    N.stopPropagation(), u.classList.contains("is-open") ? t._closeGuidePopover() : ((E = t._closeAllToolbarPopovers) == null || E.call(t), _());
  }), c.addEventListener("click", (N) => {
    const E = N.target.closest(".mjr-menu-item");
    if (!E) return;
    const j = E.dataset.value;
    p.value = j, p.dispatchEvent(new Event("change", { bubbles: !0 })), m.forEach((F) => {
      const T = F.dataset.value === j;
      F.classList.toggle("is-active", T), F.querySelector(".mjr-menu-item-check").style.opacity = T ? "1" : "0";
    }), d.classList.toggle("is-on", j !== "0"), t._closeGuidePopover();
  });
  const g = String(t._channel || "rgb"), b = document.createElement("button");
  b.type = "button", b.className = "mjr-icon-btn mjr-mfv-ch-trigger", b.title = "Channel", b.setAttribute("aria-haspopup", "listbox"), b.setAttribute("aria-expanded", "false");
  const y = document.createElement("img");
  y.src = new URL("data:image/png;base64,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", import.meta.url).href, y.className = "mjr-mfv-ch-icon", y.alt = "", y.setAttribute("aria-hidden", "true"), b.appendChild(y), n.appendChild(b);
  const A = (N) => {
    if (!N || N === "rgb")
      b.replaceChildren(y);
    else {
      const E = $s[N] || "#e0e0e0", j = eo[N] || "500", F = to[N] || N.toUpperCase(), T = document.createElement("span");
      T.className = "mjr-mfv-ch-label", T.style.color = E, T.style.fontWeight = j, T.textContent = F, b.replaceChildren(T);
    }
  }, C = document.createElement("div");
  C.className = "mjr-mfv-ch-popover", t.element.appendChild(C);
  const S = document.createElement("div");
  S.className = "mjr-menu", S.style.cssText = "display:grid;gap:4px;", C.appendChild(S);
  const x = document.createElement("select");
  x.style.cssText = "position:absolute;opacity:0;pointer-events:none;width:0;height:0;overflow:hidden;", C.appendChild(x);
  const P = [
    { value: "rgb", color: "#e0e0e0", weight: "500", label: "RGB" },
    { value: "r", color: "#ff5555", weight: "700", label: "R" },
    { value: "g", color: "#44dd66", weight: "700", label: "G" },
    { value: "b", color: "#5599ff", weight: "700", label: "B" },
    { value: "a", color: "#ffffff", weight: "700", label: "A" },
    { value: "l", color: "#bbbbbb", weight: "400", label: "L" }
  ], B = [];
  for (const N of P) {
    const E = document.createElement("option");
    E.value = N.value, x.appendChild(E);
    const j = document.createElement("button");
    j.type = "button", j.className = "mjr-menu-item", j.dataset.value = N.value;
    const F = document.createElement("span");
    F.className = "mjr-menu-item-label";
    const T = document.createElement("span");
    T.textContent = N.label, T.style.color = N.color, T.style.fontWeight = N.weight, F.appendChild(T);
    const U = document.createElement("i");
    U.className = "pi pi-check mjr-menu-item-check", U.style.opacity = N.value === g ? "1" : "0", j.appendChild(F), j.appendChild(U), S.appendChild(j), B.push(j), N.value === g && j.classList.add("is-active");
  }
  x.value = g, A(g), b.classList.toggle("is-on", g !== "rgb"), t._channelSelect = x, t._chBtn = b, t._chPopover = C;
  const v = () => {
    const N = b.getBoundingClientRect(), E = t.element.getBoundingClientRect();
    C.style.left = `${N.left - E.left}px`, C.style.top = `${N.bottom - E.top + 4}px`, C.classList.add("is-open"), b.setAttribute("aria-expanded", "true");
  };
  t._closeChPopover = () => {
    C.classList.remove("is-open"), b.setAttribute("aria-expanded", "false");
  }, b.addEventListener("click", (N) => {
    var E;
    N.stopPropagation(), C.classList.contains("is-open") ? t._closeChPopover() : ((E = t._closeAllToolbarPopovers) == null || E.call(t), v());
  }), S.addEventListener("click", (N) => {
    const E = N.target.closest(".mjr-menu-item");
    if (!E) return;
    const j = E.dataset.value;
    x.value = j, x.dispatchEvent(new Event("change", { bubbles: !0 })), B.forEach((F) => {
      const T = F.dataset.value === j;
      F.classList.toggle("is-active", T), F.querySelector(".mjr-menu-item-check").style.opacity = T ? "1" : "0";
    }), A(j), b.classList.toggle("is-on", j !== "rgb"), t._closeChPopover();
  }), t._closeAllToolbarPopovers = () => {
    var N, E, j, F, T;
    (N = t._closeChPopover) == null || N.call(t), (E = t._closeGuidePopover) == null || E.call(t), (j = t._closePinPopover) == null || j.call(t), (F = t._closeFormatPopover) == null || F.call(t), (T = t._closeGenDropdown) == null || T.call(t);
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
  const Z = [
    { value: "off", label: "Off" },
    { value: "image", label: "Image" },
    { value: "16:9", label: "16:9" },
    { value: "1:1", label: "1:1" },
    { value: "4:3", label: "4:3" },
    { value: "9:16", label: "9:16" },
    { value: "2.39", label: "2.39" }
  ], lt = [], q = t._overlayMaskEnabled ? String(t._overlayFormat || "image") : "off";
  for (const N of Z) {
    const E = document.createElement("option");
    E.value = N.value, G.appendChild(E);
    const j = document.createElement("button");
    j.type = "button", j.className = "mjr-menu-item", j.dataset.value = N.value;
    const F = document.createElement("span");
    F.className = "mjr-menu-item-label", F.textContent = N.label;
    const T = document.createElement("i");
    T.className = "pi pi-check mjr-menu-item-check", T.style.opacity = N.value === q ? "1" : "0", j.appendChild(F), j.appendChild(T), O.appendChild(j), lt.push(j), N.value === q && j.classList.add("is-active");
  }
  G.value = q;
  const bt = document.createElement("div");
  bt.className = "mjr-mfv-format-sep", I.appendChild(bt);
  const J = document.createElement("div");
  J.className = "mjr-mfv-format-slider-row", I.appendChild(J);
  const $ = document.createElement("span");
  $.className = "mjr-mfv-format-slider-label", $.textContent = "Opacity", J.appendChild($), t._maskOpacityCtl = e("Mask opacity", {
    min: 0,
    max: 0.9,
    step: 0.01,
    value: Number(t._overlayMaskOpacity ?? 0.65)
  }), J.appendChild(t._maskOpacityCtl.input), J.appendChild(t._maskOpacityCtl.out), t._formatSelect = G, t._formatPopover = I;
  const xt = () => {
    const N = t._formatToggle.getBoundingClientRect(), E = t.element.getBoundingClientRect();
    I.style.left = `${N.left - E.left}px`, I.style.top = `${N.bottom - E.top + 4}px`, I.classList.add("is-open"), t._formatToggle.setAttribute("aria-expanded", "true");
  };
  t._closeFormatPopover = () => {
    I.classList.remove("is-open"), t._formatToggle.setAttribute("aria-expanded", "false");
  }, t._formatToggle.addEventListener("click", (N) => {
    var E;
    N.stopPropagation(), I.classList.contains("is-open") ? t._closeFormatPopover() : ((E = t._closeAllToolbarPopovers) == null || E.call(t), xt());
  }), O.addEventListener("click", (N) => {
    const E = N.target.closest(".mjr-menu-item");
    if (!E) return;
    const j = E.dataset.value;
    G.value = j, G.dispatchEvent(new Event("change", { bubbles: !0 })), lt.forEach((F) => {
      const T = F.dataset.value === j;
      F.classList.toggle("is-active", T), F.querySelector(".mjr-menu-item-check").style.opacity = T ? "1" : "0";
    }), t._closeFormatPopover();
  });
  const ct = document.createElement("div");
  ct.className = "mjr-mfv-toolbar-sep", ct.setAttribute("aria-hidden", "true"), n.appendChild(ct), t._liveBtn = document.createElement("button"), t._liveBtn.type = "button", t._liveBtn.className = "mjr-icon-btn", t._liveBtn.innerHTML = '<i class="pi pi-circle" aria-hidden="true"></i>', t._liveBtn.setAttribute("aria-pressed", "false"), Nt(
    t._liveBtn,
    R("tooltip.liveStreamOff", "Live Stream: OFF - click to follow final generation outputs"),
    Pe
  ), n.appendChild(t._liveBtn), t._previewBtn = document.createElement("button"), t._previewBtn.type = "button", t._previewBtn.className = "mjr-icon-btn", t._previewBtn.innerHTML = '<i class="pi pi-eye" aria-hidden="true"></i>', t._previewBtn.setAttribute("aria-pressed", "false"), Nt(
    t._previewBtn,
    R(
      "tooltip.previewStreamOff",
      "KSampler Preview: OFF - click to stream sampler denoising frames"
    ),
    je
  ), n.appendChild(t._previewBtn), t._nodeStreamBtn = document.createElement("button"), t._nodeStreamBtn.type = "button", t._nodeStreamBtn.className = "mjr-icon-btn", t._nodeStreamBtn.innerHTML = '<i class="pi pi-sitemap" aria-hidden="true"></i>', t._nodeStreamBtn.setAttribute("aria-pressed", "false"), Nt(
    t._nodeStreamBtn,
    R(
      "tooltip.nodeStreamOff",
      "Node Stream: OFF - click to follow selected node previews, including ImageOps live canvases"
    ),
    xe
  ), n.appendChild(t._nodeStreamBtn), t._genBtn = document.createElement("button"), t._genBtn.type = "button", t._genBtn.className = "mjr-icon-btn", t._genBtn.setAttribute("aria-pressed", String(!!t._genSidebarEnabled));
  const ot = document.createElement("i");
  ot.className = "pi pi-info-circle", ot.setAttribute("aria-hidden", "true"), t._genBtn.appendChild(ot), n.appendChild(t._genBtn), t._updateGenBtnUI(), t._popoutBtn = document.createElement("button"), t._popoutBtn.type = "button", t._popoutBtn.className = "mjr-icon-btn";
  const M = R("tooltip.popOutViewer", "Pop out viewer to separate window");
  t._popoutBtn.title = M, t._popoutBtn.setAttribute("aria-label", M), t._popoutBtn.setAttribute("aria-pressed", "false");
  const k = document.createElement("i");
  k.className = "pi pi-external-link", k.setAttribute("aria-hidden", "true"), t._popoutBtn.appendChild(k), n.appendChild(t._popoutBtn), t._captureBtn = document.createElement("button"), t._captureBtn.type = "button", t._captureBtn.className = "mjr-icon-btn";
  const V = R("tooltip.captureView", "Save view as image");
  t._captureBtn.title = V, t._captureBtn.setAttribute("aria-label", V);
  const H = document.createElement("i");
  H.className = "pi pi-download", H.setAttribute("aria-hidden", "true"), t._captureBtn.appendChild(H), n.appendChild(t._captureBtn);
  const D = document.createElement("div");
  D.className = "mjr-mfv-toolbar-sep", D.style.marginLeft = "auto", D.setAttribute("aria-hidden", "true"), n.appendChild(D), t._settingsBtn = document.createElement("button"), t._settingsBtn.type = "button", t._settingsBtn.className = "mjr-icon-btn mjr-mfv-settings-btn";
  const rt = R("tooltip.nodeParams", "Node Parameters");
  t._settingsBtn.title = rt, t._settingsBtn.setAttribute("aria-label", rt), t._settingsBtn.setAttribute("aria-pressed", "false");
  const Tt = document.createElement("i");
  Tt.className = "pi pi-sliders-h", Tt.setAttribute("aria-hidden", "true"), t._settingsBtn.appendChild(Tt), n.appendChild(t._settingsBtn), t._runHandle = zs(), n.appendChild(t._runHandle.el), t._majoorSettingsBtn = document.createElement("button"), t._majoorSettingsBtn.type = "button", t._majoorSettingsBtn.className = "mjr-icon-btn mjr-mfv-majoor-settings-btn";
  const qt = R(
    "tooltip.openMajoorSettings",
    "Open Majoor Assets Manager settings"
  );
  t._majoorSettingsBtn.title = qt, t._majoorSettingsBtn.setAttribute("aria-label", qt);
  const vt = document.createElement("i");
  return vt.className = "pi pi-cog", vt.setAttribute("aria-hidden", "true"), t._majoorSettingsBtn.appendChild(vt), n.appendChild(t._majoorSettingsBtn), t._handleDocClick = (N) => {
    var j, F, T, U, Y, tt, Kt, yt, Zt, Jt, $t, te, Ct, ee, ne, se, oe, At, re, ie, ae, St, le;
    const E = N == null ? void 0 : N.target;
    (F = (j = t._chPopover) == null ? void 0 : j.classList) != null && F.contains("is-open") && !((U = (T = t._chBtn) == null ? void 0 : T.contains) != null && U.call(T, E)) && !t._chPopover.contains(E) && ((Y = t._closeChPopover) == null || Y.call(t)), (Kt = (tt = t._guidePopover) == null ? void 0 : tt.classList) != null && Kt.contains("is-open") && !((Zt = (yt = t._guideBtn) == null ? void 0 : yt.contains) != null && Zt.call(yt, E)) && !t._guidePopover.contains(E) && ((Jt = t._closeGuidePopover) == null || Jt.call(t)), (te = ($t = t._pinPopover) == null ? void 0 : $t.classList) != null && te.contains("is-open") && !((ee = (Ct = t._pinBtn) == null ? void 0 : Ct.contains) != null && ee.call(Ct, E)) && !t._pinPopover.contains(E) && ((ne = t._closePinPopover) == null || ne.call(t)), (oe = (se = t._formatPopover) == null ? void 0 : se.classList) != null && oe.contains("is-open") && !((re = (At = t._formatToggle) == null ? void 0 : At.contains) != null && re.call(At, E)) && !t._formatPopover.contains(E) && ((ie = t._closeFormatPopover) == null || ie.call(t)), (ae = E == null ? void 0 : E.closest) != null && ae.call(E, ".mjr-mfv-idrop") || (le = (St = t.element) == null ? void 0 : St.querySelectorAll) == null || le.call(St, ".mjr-mfv-idrop-menu.is-open").forEach((Ze) => Ze.classList.remove("is-open"));
  }, t._bindDocumentUiHandlers(), n;
}
function ro(t) {
  var n, s, o, r, a, l, d, i, u, c, p, h, f, m, _, g, b, y, A, C, S, x;
  try {
    (n = t._btnAC) == null || n.abort();
  } catch (P) {
    (s = console.debug) == null || s.call(console, P);
  }
  t._btnAC = new AbortController();
  const e = t._btnAC.signal;
  (o = t._closeBtn) == null || o.addEventListener(
    "click",
    () => {
      t._dispatchControllerAction("close", dt.MFV_CLOSE);
    },
    { signal: e }
  ), (r = t._modeSelect) == null || r.addEventListener(
    "change",
    () => {
      var B;
      const P = (B = t._modeSelect) == null ? void 0 : B.value;
      P && t.setMode(P);
    },
    { signal: e }
  ), (a = t._pinGroup) == null || a.addEventListener(
    "click",
    (P) => {
      var I, O;
      const B = (O = (I = P.target) == null ? void 0 : I.closest) == null ? void 0 : O.call(I, ".mjr-mfv-pin-btn");
      if (!B) return;
      const v = B.dataset.slot;
      v && (t._pinnedSlots.has(v) ? t._pinnedSlots.delete(v) : t._pinnedSlots.add(v), t._pinnedSlots.has("C") || t._pinnedSlots.has("D") ? t._mode !== L.GRID && t.setMode(L.GRID) : t._pinnedSlots.size > 0 && t._mode === L.SIMPLE && t.setMode(L.AB), t._updatePinUI());
    },
    { signal: e }
  ), (l = t._liveBtn) == null || l.addEventListener(
    "click",
    () => {
      t._dispatchControllerAction("toggleLive", dt.MFV_LIVE_TOGGLE);
    },
    { signal: e }
  ), (d = t._previewBtn) == null || d.addEventListener(
    "click",
    () => {
      t._dispatchControllerAction("togglePreview", dt.MFV_PREVIEW_TOGGLE);
    },
    { signal: e }
  ), (i = t._nodeStreamBtn) == null || i.addEventListener(
    "click",
    () => {
      t._dispatchControllerAction("toggleNodeStream", dt.MFV_NODESTREAM_TOGGLE);
    },
    { signal: e }
  ), (u = t._genBtn) == null || u.addEventListener(
    "click",
    (P) => {
      var B;
      P.stopPropagation(), (B = t._closeAllToolbarPopovers) == null || B.call(t), t._genSidebarEnabled = !t._genSidebarEnabled, t._updateGenBtnUI(), t._refresh();
    },
    { signal: e }
  ), (c = t._popoutBtn) == null || c.addEventListener(
    "click",
    () => {
      t._dispatchControllerAction("popOut", dt.MFV_POPOUT);
    },
    { signal: e }
  ), (p = t._captureBtn) == null || p.addEventListener("click", () => t._captureView(), { signal: e }), (h = t._settingsBtn) == null || h.addEventListener(
    "click",
    () => {
      var P, B;
      (P = t._sidebar) == null || P.toggle(), t._updateSettingsBtnState(((B = t._sidebar) == null ? void 0 : B.isVisible) ?? !1);
    },
    { signal: e }
  ), (f = t._majoorSettingsBtn) == null || f.addEventListener(
    "click",
    (P) => {
      var B;
      P.stopPropagation(), (B = t._closeAllToolbarPopovers) == null || B.call(t), pn();
    },
    { signal: e }
  ), (m = t._guidesSelect) == null || m.addEventListener(
    "change",
    () => {
      var P, B;
      t._gridMode = Number(t._guidesSelect.value) || 0, (P = t._guideBtn) == null || P.classList.toggle("is-on", t._gridMode !== 0), (B = t._redrawOverlayGuides) == null || B.call(t);
    },
    { signal: e }
  ), (_ = t._channelSelect) == null || _.addEventListener(
    "change",
    () => {
      var P, B;
      t._channel = String(t._channelSelect.value || "rgb"), (P = t._chBtn) == null || P.classList.toggle("is-on", t._channel !== "rgb"), (B = t._applyMediaToneControls) == null || B.call(t);
    },
    { signal: e }
  ), (b = (g = t._exposureCtl) == null ? void 0 : g.input) == null || b.addEventListener(
    "input",
    () => {
      var B;
      const P = Math.max(-10, Math.min(10, Number(t._exposureCtl.input.value) || 0));
      t._exposureEV = Math.round(P * 10) / 10, t._exposureCtl.out.textContent = `${t._exposureEV.toFixed(1)}EV`, t._exposureCtl.wrap.classList.toggle("is-active", t._exposureEV !== 0), (B = t._applyMediaToneControls) == null || B.call(t);
    },
    { signal: e }
  ), (A = (y = t._exposureCtl) == null ? void 0 : y.out) == null || A.addEventListener(
    "click",
    () => {
      var P;
      t._exposureEV = 0, t._exposureCtl.input.value = "0", t._exposureCtl.out.textContent = "0.0EV", t._exposureCtl.wrap.classList.remove("is-active"), (P = t._applyMediaToneControls) == null || P.call(t);
    },
    { signal: e }
  ), (C = t._formatSelect) == null || C.addEventListener(
    "change",
    () => {
      var B, v, I;
      const P = String(t._formatSelect.value || "image");
      P === "off" ? t._overlayMaskEnabled = !1 : (t._overlayMaskEnabled = !0, t._overlayFormat = P), (B = t._formatToggle) == null || B.classList.toggle("is-on", !!t._overlayMaskEnabled), (v = t._formatToggle) == null || v.setAttribute(
        "aria-pressed",
        String(!!t._overlayMaskEnabled)
      ), (I = t._redrawOverlayGuides) == null || I.call(t);
    },
    { signal: e }
  ), (x = (S = t._maskOpacityCtl) == null ? void 0 : S.input) == null || x.addEventListener(
    "input",
    () => {
      var v;
      const P = Number(t._maskOpacityCtl.input.value), B = Math.max(0, Math.min(0.9, Number.isFinite(P) ? P : 0.65));
      t._overlayMaskOpacity = Math.round(B * 100) / 100, t._maskOpacityCtl.out.textContent = t._overlayMaskOpacity.toFixed(2), (v = t._redrawOverlayGuides) == null || v.call(t);
    },
    { signal: e }
  );
}
function io(t, e) {
  t._settingsBtn && (t._settingsBtn.classList.toggle("active", !!e), t._settingsBtn.setAttribute("aria-pressed", String(!!e)));
}
function ao(t) {
  var n;
  if (!t._contentWrapper) return;
  const e = gt.MFV_SIDEBAR_POSITION || "right";
  t._contentWrapper.setAttribute("data-sidebar-pos", e), (n = t._sidebar) != null && n.el && t._contentEl && (e === "left" ? t._contentWrapper.insertBefore(t._sidebar.el, t._contentEl) : t._contentWrapper.appendChild(t._sidebar.el));
}
function lo(t) {
  var n, s, o;
  if (!t._handleDocClick) return;
  const e = ((n = t.element) == null ? void 0 : n.ownerDocument) || document;
  if (t._docClickHost !== e) {
    t._unbindDocumentUiHandlers();
    try {
      (s = t._docAC) == null || s.abort();
    } catch (r) {
      (o = console.debug) == null || o.call(console, r);
    }
    t._docAC = new AbortController(), e.addEventListener("click", t._handleDocClick, { signal: t._docAC.signal }), t._docClickHost = e;
  }
}
function co(t) {
  var e, n;
  try {
    (e = t._docAC) == null || e.abort();
  } catch (s) {
    (n = console.debug) == null || n.call(console, s);
  }
  t._docAC = new AbortController(), t._docClickHost = null;
}
function uo(t) {
  if (!t._genBtn) return;
  const e = !!t._genSidebarEnabled;
  t._genBtn.classList.toggle("is-on", e), t._genBtn.classList.toggle("is-open", e);
  const n = e ? "Gen Info sidebar: ON" : "Gen Info sidebar: OFF";
  t._genBtn.title = n, t._genBtn.setAttribute("aria-label", n), t._genBtn.setAttribute("aria-pressed", String(e)), t._genBtn.removeAttribute("aria-expanded"), t._genBtn.removeAttribute("aria-haspopup"), t._genBtn.removeAttribute("aria-controls");
}
function Ae(t) {
  const e = Number(t);
  return !Number.isFinite(e) || e <= 0 ? "" : e >= 60 ? `${(e / 60).toFixed(1)}m` : `${e.toFixed(1)}s`;
}
function po(t) {
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
function mo(t, e) {
  var r, a, l, d;
  if (!e) return {};
  try {
    const i = e.geninfo ? { geninfo: e.geninfo } : e.metadata || e.metadata_raw || e, u = mn(i) || null, c = {
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
    if (u && typeof u == "object") {
      u.prompt && (c.prompt = kt(String(u.prompt))), u.seed != null && (c.seed = String(u.seed)), u.model && (c.model = Array.isArray(u.model) ? u.model.join(", ") : String(u.model));
      const p = Zs(u), h = Ks(u);
      h && (c.model = h), p && (c.model = [p, c.model].filter(Boolean).join(" | ")), Array.isArray(u.loras) && (c.lora = u.loras.map(
        (m) => typeof m == "string" ? m : (m == null ? void 0 : m.name) || (m == null ? void 0 : m.lora_name) || (m == null ? void 0 : m.model_name) || ""
      ).filter(Boolean).join(", ")), u.sampler && (c.sampler = String(u.sampler)), u.scheduler && (c.scheduler = String(u.scheduler)), u.cfg != null && (c.cfg = String(u.cfg)), u.steps != null && (c.step = String(u.steps)), !c.prompt && (i != null && i.prompt) && (c.prompt = kt(String(i.prompt || "")));
      const f = e.generation_time_ms ?? ((r = e.metadata_raw) == null ? void 0 : r.generation_time_ms) ?? (i == null ? void 0 : i.generation_time_ms) ?? ((a = i == null ? void 0 : i.geninfo) == null ? void 0 : a.generation_time_ms) ?? 0;
      return f && Number.isFinite(Number(f)) && f > 0 && f < 864e5 && (c.genTime = Ae(Number(f) / 1e3)), c;
    }
  } catch (i) {
    (l = console.debug) == null || l.call(console, "[MFV] geninfo normalize failed", i);
  }
  const n = (e == null ? void 0 : e.metadata) || (e == null ? void 0 : e.metadata_raw) || e || {}, s = {
    prompt: kt(String((n == null ? void 0 : n.prompt) || (n == null ? void 0 : n.positive) || "")),
    seed: (n == null ? void 0 : n.seed) != null ? String(n.seed) : "",
    model: (n == null ? void 0 : n.checkpoint) || (n == null ? void 0 : n.ckpt_name) || (n == null ? void 0 : n.model) || "",
    lora: Array.isArray(n == null ? void 0 : n.loras) ? n.loras.join(", ") : (n == null ? void 0 : n.lora) || "",
    sampler: (n == null ? void 0 : n.sampler_name) || (n == null ? void 0 : n.sampler) || "",
    scheduler: (n == null ? void 0 : n.scheduler) || "",
    cfg: (n == null ? void 0 : n.cfg) != null ? String(n.cfg) : (n == null ? void 0 : n.cfg_scale) != null ? String(n.cfg_scale) : "",
    step: (n == null ? void 0 : n.steps) != null ? String(n.steps) : "",
    genTime: ""
  }, o = e.generation_time_ms ?? ((d = e.metadata_raw) == null ? void 0 : d.generation_time_ms) ?? (n == null ? void 0 : n.generation_time_ms) ?? 0;
  return o && Number.isFinite(Number(o)) && o > 0 && o < 864e5 && (s.genTime = Ae(Number(o) / 1e3)), s;
}
function ho(t, e) {
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
  for (const r of o) {
    if (!t._genInfoSelections.has(r)) continue;
    const a = n[r] != null ? String(n[r]) : "";
    if (!a) continue;
    let l = r.charAt(0).toUpperCase() + r.slice(1);
    r === "lora" ? l = "LoRA" : r === "cfg" ? l = "CFG" : r === "genTime" && (l = "Gen Time");
    const d = document.createElement("div");
    d.dataset.field = r;
    const i = document.createElement("strong");
    if (i.textContent = `${l}: `, d.appendChild(i), r === "prompt")
      d.appendChild(document.createTextNode(a));
    else if (r === "genTime") {
      const u = po(a);
      let c = "#4CAF50";
      u >= 60 ? c = "#FF9800" : u >= 30 ? c = "#FFC107" : u >= 10 && (c = "#8BC34A");
      const p = document.createElement("span");
      p.style.color = c, p.style.fontWeight = "600", p.textContent = a, d.appendChild(p);
    } else
      d.appendChild(document.createTextNode(a));
    s.appendChild(d);
  }
  return s.childNodes.length > 0 ? s : null;
}
function fo(t) {
  var e, n, s;
  try {
    (n = (e = t._controller) == null ? void 0 : e.onModeChanged) == null || n.call(e, t._mode);
  } catch (o) {
    (s = console.debug) == null || s.call(console, o);
  }
}
function _o(t) {
  const e = [L.SIMPLE, L.AB, L.SIDE, L.GRID, L.GRAPH];
  t._mode = e[(e.indexOf(t._mode) + 1) % e.length], t._updateModeBtnUI(), t._refresh(), t._notifyModeChanged();
}
function go(t, e) {
  Object.values(L).includes(e) && (t._mode = e, t._updateModeBtnUI(), t._refresh(), t._notifyModeChanged());
}
function bo(t) {
  return t._pinnedSlots;
}
function yo(t) {
  var e, n;
  if (t._pinBtns) {
    for (const s of ["A", "B", "C", "D"]) {
      const o = t._pinBtns[s];
      if (!o) continue;
      const r = t._pinnedSlots.has(s);
      o.classList.toggle("is-pinned", r), o.setAttribute("aria-pressed", String(r)), o.title = r ? `Unpin Asset ${s}` : `Pin Asset ${s}`;
    }
    (n = t._pinBtn) == null || n.classList.toggle("is-on", (((e = t._pinnedSlots) == null ? void 0 : e.size) ?? 0) > 0);
  }
}
function Co(t) {
  var a, l;
  if (!t._modeBtn) return;
  const e = {
    [L.SIMPLE]: { icon: "pi-image", label: "Mode: Simple - click to switch" },
    [L.AB]: { icon: "pi-clone", label: "Mode: A/B Compare - click to switch" },
    [L.SIDE]: { icon: "pi-table", label: "Mode: Side-by-Side - click to switch" },
    [L.GRID]: {
      icon: "pi-th-large",
      label: "Mode: Grid Compare (up to 4) - click to switch"
    },
    [L.GRAPH]: {
      icon: "pi-sitemap",
      label: "Mode: Graph Map - click to switch"
    }
  }, { icon: n = "pi-image", label: s = "" } = e[t._mode] || {}, o = Pt(s, An), r = document.createElement("i");
  r.className = `pi ${n}`, r.setAttribute("aria-hidden", "true"), t._modeBtn.replaceChildren(r), t._modeBtn.title = o, t._modeBtn.setAttribute("aria-label", o), t._modeBtn.removeAttribute("aria-pressed"), t._modeBtn.classList.toggle("is-on", t._mode !== L.SIMPLE), (l = (a = t._modeDrop) == null ? void 0 : a.selectItem) == null || l.call(a, t._mode);
}
function Ao(t, e) {
  if (!t._liveBtn) return;
  const n = !!e;
  t._liveBtn.classList.toggle("mjr-live-active", n);
  const s = n ? R(
    "tooltip.liveStreamOn",
    "Live Stream: ON - follows final generation outputs after execution"
  ) : R("tooltip.liveStreamOff", "Live Stream: OFF - click to follow final generation outputs"), o = Pt(s, Pe);
  t._liveBtn.setAttribute("aria-pressed", String(n)), t._liveBtn.setAttribute("aria-label", o);
  const r = document.createElement("i");
  r.className = n ? "pi pi-circle-fill" : "pi pi-circle", r.setAttribute("aria-hidden", "true"), t._liveBtn.replaceChildren(r), t._liveBtn.title = o;
}
function So(t, e) {
  if (t._previewActive = !!e, !t._previewBtn) return;
  t._previewBtn.classList.toggle("mjr-preview-active", t._previewActive);
  const n = t._previewActive ? R(
    "tooltip.previewStreamOn",
    "KSampler Preview: ON - streams sampler denoising frames during execution"
  ) : R(
    "tooltip.previewStreamOff",
    "KSampler Preview: OFF - click to stream sampler denoising frames"
  ), s = Pt(n, je);
  t._previewBtn.setAttribute("aria-pressed", String(t._previewActive)), t._previewBtn.setAttribute("aria-label", s);
  const o = document.createElement("i");
  o.className = t._previewActive ? "pi pi-eye" : "pi pi-eye-slash", o.setAttribute("aria-hidden", "true"), t._previewBtn.replaceChildren(o), t._previewBtn.title = s, t._previewActive || t._revokePreviewBlob();
}
function Eo(t, e, n = {}) {
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
  if (t._mode === L.AB || t._mode === L.SIDE || t._mode === L.GRID) {
    const a = t.getPinnedSlots();
    if (t._mode === L.GRID) {
      const l = ["A", "B", "C", "D"].find((d) => !a.has(d)) || "A";
      t[`_media${l}`] = o;
    } else a.has("B") ? t._mediaA = o : t._mediaB = o;
  } else
    t._mediaA = o, t._resetMfvZoom(), t._mode !== L.SIMPLE && (t._mode = L.SIMPLE, t._updateModeBtnUI());
  ++t._refreshGen, t._refresh();
}
function Mo(t) {
  if (t._previewBlobUrl) {
    try {
      URL.revokeObjectURL(t._previewBlobUrl);
    } catch {
    }
    t._previewBlobUrl = null;
  }
}
function No(t, e) {
  var r;
  if (t._nodeStreamActive = !!e, t._nodeStreamActive || (r = t.setNodeStreamSelection) == null || r.call(t, null), !t._nodeStreamBtn) return;
  t._nodeStreamBtn.classList.toggle("mjr-nodestream-active", t._nodeStreamActive);
  const n = t._nodeStreamActive ? R(
    "tooltip.nodeStreamOn",
    "Node Stream: ON - follows the selected node preview when frontend media exists"
  ) : R(
    "tooltip.nodeStreamOff",
    "Node Stream: OFF - click to follow selected node previews, including ImageOps live canvases"
  ), s = Pt(n, xe);
  t._nodeStreamBtn.setAttribute("aria-pressed", String(t._nodeStreamActive)), t._nodeStreamBtn.setAttribute("aria-label", s);
  const o = document.createElement("i");
  o.className = "pi pi-sitemap", o.setAttribute("aria-hidden", "true"), t._nodeStreamBtn.replaceChildren(o), t._nodeStreamBtn.title = s;
}
const Bo = [
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
function Lo() {
  var t, e, n, s, o;
  try {
    const r = typeof window < "u" ? window : globalThis, a = (e = (t = r == null ? void 0 : r.process) == null ? void 0 : t.versions) == null ? void 0 : e.electron;
    if (typeof a == "string" && a.trim() || r != null && r.electron || r != null && r.ipcRenderer || r != null && r.electronAPI)
      return !0;
    const l = String(
      ((n = r == null ? void 0 : r.navigator) == null ? void 0 : n.userAgent) || ((s = globalThis == null ? void 0 : globalThis.navigator) == null ? void 0 : s.userAgent) || ""
    ), d = /\bElectron\//i.test(l), i = /\bCode\//i.test(l);
    if (d && !i)
      return !0;
  } catch (r) {
    (o = console.debug) == null || o.call(console, r);
  }
  return !1;
}
function z(t, e = null, n = "info") {
  var o, r;
  const s = {
    stage: String(t || "unknown"),
    detail: e,
    ts: Date.now()
  };
  try {
    const a = typeof window < "u" ? window : globalThis, l = "__MJR_MFV_POPOUT_TRACE__", d = Array.isArray(a[l]) ? a[l] : [];
    d.push(s), a[l] = d.slice(-20), a.__MJR_MFV_POPOUT_LAST__ = s;
  } catch (a) {
    (o = console.debug) == null || o.call(console, a);
  }
  try {
    const a = n === "error" ? console.error : n === "warn" ? console.warn : console.info;
    a == null || a("[MFV popout]", s);
  } catch (a) {
    (r = console.debug) == null || r.call(console, a);
  }
}
function Se(t, ...e) {
  return Array.from(
    new Set(
      [String(t || ""), ...e].join(" ").split(/\s+/).filter(Boolean)
    )
  ).join(" ");
}
function Ee(t, e) {
  var n;
  if (!(!t || !e))
    for (const s of Array.from(t.attributes || [])) {
      const o = String((s == null ? void 0 : s.name) || "");
      if (!(!o || o === "class" || o === "style"))
        try {
          e.setAttribute(o, s.value);
        } catch (r) {
          (n = console.debug) == null || n.call(console, r);
        }
    }
}
function Me(t, e) {
  var o, r, a, l, d;
  if (!t || !(e != null && e.style)) return;
  const n = typeof window < "u" && (window == null ? void 0 : window.getComputedStyle) || (globalThis == null ? void 0 : globalThis.getComputedStyle);
  if (typeof n != "function") return;
  let s = null;
  try {
    s = n(t);
  } catch (i) {
    (o = console.debug) == null || o.call(console, i);
  }
  if (s) {
    for (const i of Bo)
      try {
        const u = String(((r = s.getPropertyValue) == null ? void 0 : r.call(s, i)) || "").trim();
        u && e.style.setProperty(i, u);
      } catch (u) {
        (a = console.debug) == null || a.call(console, u);
      }
    try {
      const i = String(((l = s.getPropertyValue) == null ? void 0 : l.call(s, "color-scheme")) || "").trim();
      i && (e.style.colorScheme = i);
    } catch (i) {
      (d = console.debug) == null || d.call(console, i);
    }
  }
}
function Io(t) {
  if (!(t != null && t.documentElement) || !(t != null && t.body) || !(document != null && document.documentElement)) return;
  const e = document.documentElement, n = document.body, s = t.documentElement, o = t.body;
  s.className = Se(
    e.className,
    "mjr-mfv-popout-document"
  ), o.className = Se(
    n == null ? void 0 : n.className,
    "mjr-mfv-popout-body"
  ), Ee(e, s), Ee(n, o), Me(e, s), Me(n, o), e != null && e.lang && (s.lang = e.lang), e != null && e.dir && (s.dir = e.dir);
}
function Ke(t) {
  var n, s, o;
  if (!(t != null && t.body)) return null;
  try {
    const r = (n = t.getElementById) == null ? void 0 : n.call(t, "mjr-mfv-popout-root");
    (s = r == null ? void 0 : r.remove) == null || s.call(r);
  } catch (r) {
    (o = console.debug) == null || o.call(console, r);
  }
  const e = t.createElement("div");
  return e.id = "mjr-mfv-popout-root", e.className = "mjr-mfv-popout-root", t.body.appendChild(e), e;
}
function _t(t) {
  var e, n, s;
  t._resetGenDropdownForCurrentDocument(), t._rebindControlHandlers(), t._bindPanelInteractions(), t._bindDocumentUiHandlers(), (e = t._unbindLayoutObserver) == null || e.call(t), (n = t._bindLayoutObserver) == null || n.call(t), (s = t._refresh) == null || s.call(t), t._updatePopoutBtnUI();
}
function Po(t, e) {
  if (!t.element) return;
  const n = !!e;
  if (t._desktopExpanded === n) return;
  const s = t.element;
  if (n) {
    t._desktopExpandRestore = {
      parent: s.parentNode || null,
      nextSibling: s.nextSibling || null,
      styleAttr: s.getAttribute("style")
    }, s.parentNode !== document.body && document.body.appendChild(s), s.classList.add("mjr-mfv--desktop-expanded", "is-visible"), s.setAttribute("aria-hidden", "false"), s.style.position = "fixed", s.style.top = "12px", s.style.left = "12px", s.style.right = "12px", s.style.bottom = "12px", s.style.width = "auto", s.style.height = "auto", s.style.maxWidth = "none", s.style.maxHeight = "none", s.style.minWidth = "320px", s.style.minHeight = "240px", s.style.resize = "none", s.style.margin = "0", s.style.zIndex = "2147483000", t._desktopExpanded = !0, t.isVisible = !0, _t(t), z("electron-in-app-expanded", { isVisible: t.isVisible });
    return;
  }
  const o = t._desktopExpandRestore;
  t._desktopExpanded = !1, s.classList.remove("mjr-mfv--desktop-expanded"), (o == null ? void 0 : o.styleAttr) == null || o.styleAttr === "" ? s.removeAttribute("style") : s.setAttribute("style", o.styleAttr), o != null && o.parent && o.parent.isConnected && (o.nextSibling && o.nextSibling.parentNode === o.parent ? o.parent.insertBefore(s, o.nextSibling) : o.parent.appendChild(s)), t._desktopExpandRestore = null, _t(t), z("electron-in-app-restored", null);
}
function jo(t, e) {
  var n;
  t._desktopPopoutUnsupported = !0, z(
    "electron-in-app-fallback",
    { message: (e == null ? void 0 : e.message) || String(e || "unknown error") },
    "warn"
  ), t._setDesktopExpanded(!0);
  try {
    _n(
      R(
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
function xo(t, e, n, s, o) {
  return z(
    "electron-popup-fallback-attempt",
    { reason: (o == null ? void 0 : o.message) || String(o || "unknown") },
    "warn"
  ), t._fallbackPopout(e, n, s), t._popoutWindow ? (t._desktopPopoutUnsupported = !1, z("electron-popup-fallback-opened", null), !0) : !1;
}
function To(t) {
  var l, d;
  if (t._isPopped || !t.element) return;
  const e = t.element;
  t._stopEdgeResize();
  const n = Lo(), s = typeof window < "u" && "documentPictureInPicture" in window, o = String(
    ((l = window == null ? void 0 : window.navigator) == null ? void 0 : l.userAgent) || ((d = globalThis == null ? void 0 : globalThis.navigator) == null ? void 0 : d.userAgent) || ""
  ), r = Math.max(e.offsetWidth || 520, 400), a = Math.max(e.offsetHeight || 420, 300);
  if (z("start", {
    isElectronHost: n,
    hasDocumentPiP: s,
    userAgent: o,
    width: r,
    height: a,
    desktopPopoutUnsupported: t._desktopPopoutUnsupported
  }), n && t._desktopPopoutUnsupported) {
    z("electron-in-app-fallback-reuse", null), t._setDesktopExpanded(!0);
    return;
  }
  if (!(n && (z("electron-popup-request", { width: r, height: a }), t._tryElectronPopupFallback(e, r, a, new Error("Desktop popup requested"))))) {
    if (n && "documentPictureInPicture" in window) {
      z("electron-pip-request", { width: r, height: a }), window.documentPictureInPicture.requestWindow({ width: r, height: a }).then((i) => {
        var f, m, _;
        z("electron-pip-opened", {
          hasDocument: !!(i != null && i.document)
        }), t._popoutWindow = i, t._isPopped = !0, t._popoutRestoreGuard = !1;
        try {
          (f = t._popoutAC) == null || f.abort();
        } catch (g) {
          (m = console.debug) == null || m.call(console, g);
        }
        t._popoutAC = new AbortController();
        const u = t._popoutAC.signal, c = () => t._schedulePopInFromPopupClose();
        t._popoutCloseHandler = c;
        const p = i.document;
        p.title = "Majoor Viewer", t._installPopoutStyles(p);
        const h = Ke(p);
        if (!h) {
          t._activateDesktopExpandedFallback(
            new Error("Popup root creation failed")
          );
          return;
        }
        try {
          const g = typeof p.adoptNode == "function" ? p.adoptNode(e) : e;
          h.appendChild(g), z("electron-pip-adopted", {
            usedAdoptNode: typeof p.adoptNode == "function"
          });
        } catch (g) {
          z(
            "electron-pip-adopt-failed",
            { message: (g == null ? void 0 : g.message) || String(g) },
            "warn"
          ), console.warn("[MFV] PiP adoptNode failed", g), t._isPopped = !1, t._popoutWindow = null;
          try {
            i.close();
          } catch (b) {
            (_ = console.debug) == null || _.call(console, b);
          }
          t._activateDesktopExpandedFallback(g);
          return;
        }
        e.classList.add("is-visible"), t.isVisible = !0, _t(t), z("electron-pip-ready", { isPopped: t._isPopped }), i.addEventListener("pagehide", c, {
          signal: u
        }), t._startPopoutCloseWatch(), t._popoutKeydownHandler = (g) => {
          var y, A;
          const b = String(((y = g == null ? void 0 : g.target) == null ? void 0 : y.tagName) || "").toLowerCase();
          g != null && g.defaultPrevented || (A = g == null ? void 0 : g.target) != null && A.isContentEditable || b === "input" || b === "textarea" || b === "select" || t._forwardKeydownToController(g);
        }, i.addEventListener("keydown", t._popoutKeydownHandler, {
          signal: u
        });
      }).catch((i) => {
        z(
          "electron-pip-request-failed",
          { message: (i == null ? void 0 : i.message) || String(i) },
          "warn"
        ), t._activateDesktopExpandedFallback(i);
      });
      return;
    }
    if (n) {
      z("electron-no-pip-api", { hasDocumentPiP: s }), t._activateDesktopExpandedFallback(
        new Error("Document Picture-in-Picture unavailable after popup failure")
      );
      return;
    }
    z("browser-fallback-popup", { width: r, height: a }), t._fallbackPopout(e, r, a);
  }
}
function vo(t, e, n, s) {
  var c, p, h, f;
  z("browser-popup-open", { width: n, height: s });
  const o = (window.screenX || window.screenLeft) + Math.round((window.outerWidth - n) / 2), r = (window.screenY || window.screenTop) + Math.round((window.outerHeight - s) / 2), a = `width=${n},height=${s},left=${o},top=${r},resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,status=no`, l = window.open("about:blank", "_mjr_viewer", a);
  if (!l) {
    z("browser-popup-blocked", null, "warn"), console.warn("[MFV] Pop-out blocked — allow popups for this site.");
    return;
  }
  z("browser-popup-opened", { hasDocument: !!(l != null && l.document) }), t._popoutWindow = l, t._isPopped = !0, t._popoutRestoreGuard = !1;
  try {
    (c = t._popoutAC) == null || c.abort();
  } catch (m) {
    (p = console.debug) == null || p.call(console, m);
  }
  t._popoutAC = new AbortController();
  const d = t._popoutAC.signal, i = () => t._schedulePopInFromPopupClose();
  t._popoutCloseHandler = i;
  const u = () => {
    let m;
    try {
      m = l.document;
    } catch {
      return;
    }
    if (!m) return;
    m.title = "Majoor Viewer", t._installPopoutStyles(m);
    const _ = Ke(m);
    if (_) {
      try {
        _.appendChild(m.adoptNode(e));
      } catch (g) {
        console.warn("[MFV] adoptNode failed", g);
        return;
      }
      e.classList.add("is-visible"), t.isVisible = !0, _t(t);
    }
  };
  try {
    u();
  } catch (m) {
    (h = console.debug) == null || h.call(console, "[MFV] immediate mount failed, retrying on load", m);
    try {
      l.addEventListener("load", u, { signal: d });
    } catch (_) {
      (f = console.debug) == null || f.call(console, "[MFV] pop-out page load listener failed", _);
    }
  }
  l.addEventListener("beforeunload", i, { signal: d }), l.addEventListener("pagehide", i, { signal: d }), l.addEventListener("unload", i, { signal: d }), t._startPopoutCloseWatch(), t._popoutKeydownHandler = (m) => {
    var g, b;
    const _ = String(((g = m == null ? void 0 : m.target) == null ? void 0 : g.tagName) || "").toLowerCase();
    m != null && m.defaultPrevented || (b = m == null ? void 0 : m.target) != null && b.isContentEditable || _ === "input" || _ === "textarea" || _ === "select" || t._forwardKeydownToController(m);
  }, l.addEventListener("keydown", t._popoutKeydownHandler, { signal: d });
}
function ko(t) {
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
function Fo(t) {
  t._clearPopoutCloseWatch(), t._popoutCloseTimer = window.setInterval(() => {
    if (!t._isPopped) {
      t._clearPopoutCloseWatch();
      return;
    }
    const e = t._popoutWindow;
    (!e || e.closed) && (t._clearPopoutCloseWatch(), t._schedulePopInFromPopupClose());
  }, 250);
}
function Oo(t) {
  !t._isPopped || t._popoutRestoreGuard || (t._popoutRestoreGuard = !0, window.setTimeout(() => {
    try {
      t.popIn({ closePopupWindow: !1 });
    } finally {
      t._popoutRestoreGuard = !1;
    }
  }, 0));
}
function Go(t, e) {
  var s, o, r;
  if (!(e != null && e.head)) return;
  try {
    for (const a of e.head.querySelectorAll("[data-mjr-popout-cloned-style='1']"))
      a.remove();
  } catch (a) {
    (s = console.debug) == null || s.call(console, a);
  }
  Io(e);
  try {
    const a = document.documentElement.style.cssText;
    if (a) {
      const l = e.createElement("style");
      l.setAttribute("data-mjr-popout-cloned-style", "1"), l.textContent = `:root { ${a} }`, e.head.appendChild(l);
    }
  } catch (a) {
    (o = console.debug) == null || o.call(console, a);
  }
  for (const a of document.querySelectorAll('link[rel="stylesheet"], style'))
    try {
      let l = null;
      if (a.tagName === "LINK") {
        l = e.createElement("link");
        for (const d of Array.from(a.attributes || []))
          (d == null ? void 0 : d.name) !== "href" && l.setAttribute(d.name, d.value);
        l.setAttribute("href", a.href || a.getAttribute("href") || "");
      } else
        l = e.importNode(a, !0);
      l.setAttribute("data-mjr-popout-cloned-style", "1"), e.head.appendChild(l);
    } catch (l) {
      (r = console.debug) == null || r.call(console, l);
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
function Ro(t, { closePopupWindow: e = !0 } = {}) {
  var o, r, a, l;
  if (t._desktopExpanded) {
    t._setDesktopExpanded(!1);
    return;
  }
  if (!t._isPopped || !t.element) return;
  const n = t._popoutWindow;
  t._clearPopoutCloseWatch();
  try {
    (o = t._popoutAC) == null || o.abort();
  } catch (d) {
    (r = console.debug) == null || r.call(console, d);
  }
  t._popoutAC = null, t._popoutCloseHandler = null, t._popoutKeydownHandler = null, t._isPopped = !1;
  let s = t.element;
  try {
    s = (s == null ? void 0 : s.ownerDocument) === document ? s : document.adoptNode(s);
  } catch (d) {
    (a = console.debug) == null || a.call(console, "[MFV] pop-in adopt failed", d);
  }
  if (document.body.appendChild(s), s.classList.add("is-visible"), s.setAttribute("aria-hidden", "false"), t.isVisible = !0, _t(t), e)
    try {
      n == null || n.close();
    } catch (d) {
      (l = console.debug) == null || l.call(console, d);
    }
  t._popoutWindow = null;
}
function Vo(t) {
  if (!t._popoutBtn) return;
  const e = t._isPopped || t._desktopExpanded;
  t.element && t.element.classList.toggle("mjr-mfv--popped", e), t._popoutBtn.classList.toggle("mjr-popin-active", e);
  const n = t._popoutBtn.querySelector("i") || document.createElement("i"), s = e ? R("tooltip.popInViewer", "Return to floating panel") : R("tooltip.popOutViewer", "Pop out viewer to separate window");
  n.className = e ? "pi pi-sign-in" : "pi pi-external-link", t._popoutBtn.title = s, t._popoutBtn.setAttribute("aria-label", s), t._popoutBtn.setAttribute("aria-pressed", String(e)), t._popoutBtn.contains(n) || t._popoutBtn.replaceChildren(n);
}
function Ho(t) {
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
function Wo(t, e, n) {
  if (!n) return "";
  const s = t <= n.left + Mt, o = t >= n.right - Mt, r = e <= n.top + Mt, a = e >= n.bottom - Mt;
  return r && s ? "nw" : r && o ? "ne" : a && s ? "sw" : a && o ? "se" : r ? "n" : a ? "s" : s ? "w" : o ? "e" : "";
}
function zo(t) {
  var e, n, s, o;
  if (t.element) {
    try {
      (e = t._resizeWindowCleanup) == null || e.call(t);
    } catch (r) {
      (n = console.debug) == null || n.call(console, r);
    }
    if (t._resizeWindowCleanup = null, ((s = t._resizeState) == null ? void 0 : s.pointerId) != null)
      try {
        t.element.releasePointerCapture(t._resizeState.pointerId);
      } catch (r) {
        (o = console.debug) == null || o.call(console, r);
      }
    t._resizeState = null, t.element.classList.remove("mjr-mfv--resizing"), t.element.style.cursor = "";
  }
}
function Do(t) {
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
function Uo(t, e) {
  var i;
  if (!e) return;
  const n = (u) => {
    if (!t.element || t._isPopped) return "";
    const c = t.element.getBoundingClientRect();
    return t._getResizeDirectionFromPoint(u.clientX, u.clientY, c);
  }, s = (i = t._panelAC) == null ? void 0 : i.signal;
  let o = null;
  const r = () => {
    var u;
    try {
      o == null || o.abort();
    } catch (c) {
      (u = console.debug) == null || u.call(console, c);
    }
    o = null, t._resizeWindowCleanup = null;
  }, a = (u) => {
    var _, g, b, y;
    if (u.button !== 0 || !t.element || t._isPopped) return;
    const c = n(u);
    if (!c) return;
    u.preventDefault(), u.stopPropagation();
    const p = t.element.getBoundingClientRect(), h = window.getComputedStyle(t.element), f = Math.max(120, Number.parseFloat(h.minWidth) || 0), m = Math.max(100, Number.parseFloat(h.minHeight) || 0);
    t._resizeState = {
      pointerId: u.pointerId,
      dir: c,
      startX: u.clientX,
      startY: u.clientY,
      startLeft: p.left,
      startTop: p.top,
      startWidth: p.width,
      startHeight: p.height,
      minWidth: f,
      minHeight: m
    }, t.element.style.left = `${Math.round(p.left)}px`, t.element.style.top = `${Math.round(p.top)}px`, t.element.style.right = "auto", t.element.style.bottom = "auto", t.element.classList.add("mjr-mfv--resizing"), t.element.style.cursor = t._resizeCursorForDirection(c);
    try {
      t.element.setPointerCapture(u.pointerId);
    } catch (A) {
      (_ = console.debug) == null || _.call(console, A);
    }
    try {
      r(), o = new AbortController(), t._resizeWindowCleanup = r;
      const A = ((b = (g = t.element) == null ? void 0 : g.ownerDocument) == null ? void 0 : b.defaultView) || window;
      A.addEventListener("pointermove", l, { signal: o.signal }), A.addEventListener("pointerup", d, { signal: o.signal }), A.addEventListener("pointercancel", d, { signal: o.signal });
    } catch (A) {
      (y = console.debug) == null || y.call(console, A);
    }
  }, l = (u) => {
    if (!t.element || t._isPopped) return;
    const c = t._resizeState;
    if (!c) {
      const b = n(u);
      t.element.style.cursor = b ? t._resizeCursorForDirection(b) : "";
      return;
    }
    if (c.pointerId !== u.pointerId) return;
    const p = u.clientX - c.startX, h = u.clientY - c.startY;
    let f = c.startWidth, m = c.startHeight, _ = c.startLeft, g = c.startTop;
    c.dir.includes("e") && (f = c.startWidth + p), c.dir.includes("s") && (m = c.startHeight + h), c.dir.includes("w") && (f = c.startWidth - p, _ = c.startLeft + p), c.dir.includes("n") && (m = c.startHeight - h, g = c.startTop + h), f < c.minWidth && (c.dir.includes("w") && (_ -= c.minWidth - f), f = c.minWidth), m < c.minHeight && (c.dir.includes("n") && (g -= c.minHeight - m), m = c.minHeight), f = Math.min(f, Math.max(c.minWidth, window.innerWidth)), m = Math.min(m, Math.max(c.minHeight, window.innerHeight)), _ = Math.min(Math.max(0, _), Math.max(0, window.innerWidth - f)), g = Math.min(Math.max(0, g), Math.max(0, window.innerHeight - m)), t.element.style.width = `${Math.round(f)}px`, t.element.style.height = `${Math.round(m)}px`, t.element.style.left = `${Math.round(_)}px`, t.element.style.top = `${Math.round(g)}px`, t.element.style.right = "auto", t.element.style.bottom = "auto";
  }, d = (u) => {
    if (!t.element || !t._resizeState || t._resizeState.pointerId !== u.pointerId) return;
    const c = n(u);
    r(), t._stopEdgeResize(), c && (t.element.style.cursor = t._resizeCursorForDirection(c));
  };
  e.addEventListener("pointerdown", a, { capture: !0, signal: s }), e.addEventListener("pointermove", l, { signal: s }), e.addEventListener("pointerup", d, { signal: s }), e.addEventListener("pointercancel", d, { signal: s }), e.addEventListener(
    "pointerleave",
    () => {
      !t._resizeState && t.element && (t.element.style.cursor = "");
    },
    { signal: s }
  );
}
function Yo(t, e) {
  var o;
  if (!e) return;
  const n = (o = t._panelAC) == null ? void 0 : o.signal;
  let s = null;
  e.addEventListener(
    "pointerdown",
    (r) => {
      var m;
      if (r.button !== 0 || r.target.closest("button") || r.target.closest("select") || t._isPopped || !t.element || t._getResizeDirectionFromPoint(
        r.clientX,
        r.clientY,
        t.element.getBoundingClientRect()
      )) return;
      r.preventDefault(), e.setPointerCapture(r.pointerId);
      try {
        s == null || s.abort();
      } catch {
      }
      s = new AbortController();
      const l = s.signal, d = t.element, i = d.getBoundingClientRect(), u = r.clientX - i.left, c = r.clientY - i.top, p = (_) => {
        const g = Math.min(
          window.innerWidth - d.offsetWidth,
          Math.max(0, _.clientX - u)
        ), b = Math.min(
          window.innerHeight - d.offsetHeight,
          Math.max(0, _.clientY - c)
        );
        d.style.left = `${g}px`, d.style.top = `${b}px`, d.style.right = "auto", d.style.bottom = "auto";
      }, h = () => {
        var _, g;
        try {
          (_ = e.releasePointerCapture) == null || _.call(e, r.pointerId);
        } catch (b) {
          (g = console.debug) == null || g.call(console, b);
        }
        try {
          s == null || s.abort();
        } catch {
        }
      }, f = ((m = e.ownerDocument) == null ? void 0 : m.defaultView) || window;
      f.addEventListener("pointermove", p, { signal: l }), f.addEventListener("pointerup", h, { signal: l }), f.addEventListener("pointercancel", h, { signal: l });
    },
    n ? { signal: n } : void 0
  );
}
async function wo(t, e, n, s, o, r, a, l) {
  var h, f, m, _, g;
  if (!n) return;
  const d = K(n);
  let i = null;
  if (d === "video" && (i = l instanceof HTMLVideoElement ? l : ((h = t._contentEl) == null ? void 0 : h.querySelector("video")) || null), !i && d === "model3d") {
    const b = (n == null ? void 0 : n.id) != null ? String(n.id) : "";
    b && (i = ((m = (f = t._contentEl) == null ? void 0 : f.querySelector) == null ? void 0 : m.call(
      f,
      `.mjr-model3d-render-canvas[data-mjr-asset-id="${b}"]`
    )) || null), i || (i = ((g = (_ = t._contentEl) == null ? void 0 : _.querySelector) == null ? void 0 : g.call(_, ".mjr-model3d-render-canvas")) || null);
  }
  if (!i) {
    const b = ke(n);
    if (!b) return;
    i = await new Promise((y) => {
      const A = new Image();
      A.crossOrigin = "anonymous", A.onload = () => y(A), A.onerror = () => y(null), A.src = b;
    });
  }
  if (!i) return;
  const u = i.videoWidth || i.naturalWidth || r, c = i.videoHeight || i.naturalHeight || a;
  if (!u || !c) return;
  const p = Math.min(r / u, a / c);
  e.drawImage(
    i,
    s + (r - u * p) / 2,
    o + (a - c * p) / 2,
    u * p,
    c * p
  );
}
function Qo(t, e, n, s) {
  if (!e || !n || !t._genInfoSelections.size) return 0;
  const o = t._getGenFields(n), r = [
    "prompt",
    "seed",
    "model",
    "lora",
    "sampler",
    "scheduler",
    "cfg",
    "step",
    "genTime"
  ], a = 11, l = 16, d = 8, i = Math.max(100, Number(s || 0) - d * 2);
  let u = 0;
  for (const c of r) {
    if (!t._genInfoSelections.has(c)) continue;
    const p = o[c] != null ? String(o[c]) : "";
    if (!p) continue;
    let h = c.charAt(0).toUpperCase() + c.slice(1);
    c === "lora" ? h = "LoRA" : c === "cfg" ? h = "CFG" : c === "genTime" && (h = "Gen Time");
    const f = `${h}: `;
    e.font = `bold ${a}px system-ui, sans-serif`;
    const m = e.measureText(f).width;
    e.font = `${a}px system-ui, sans-serif`;
    const _ = Math.max(32, i - d * 2 - m);
    let g = 0, b = "";
    for (const y of p.split(" ")) {
      const A = b ? b + " " + y : y;
      e.measureText(A).width > _ && b ? (g += 1, b = y) : b = A;
    }
    b && (g += 1), u += g;
  }
  return u > 0 ? u * l + d * 2 : 0;
}
function Xo(t, e, n, s, o, r, a) {
  if (!n || !t._genInfoSelections.size) return;
  const l = t._getGenFields(n), d = {
    prompt: "#7ec8ff",
    seed: "#ffd47a",
    model: "#7dda8a",
    lora: "#d48cff",
    sampler: "#ff9f7a",
    scheduler: "#ff7a9f",
    cfg: "#7a9fff",
    step: "#7affd4",
    genTime: "#e0ff7a"
  }, i = [
    "prompt",
    "seed",
    "model",
    "lora",
    "sampler",
    "scheduler",
    "cfg",
    "step",
    "genTime"
  ], u = [];
  for (const C of i) {
    if (!t._genInfoSelections.has(C)) continue;
    const S = l[C] != null ? String(l[C]) : "";
    if (!S) continue;
    let x = C.charAt(0).toUpperCase() + C.slice(1);
    C === "lora" ? x = "LoRA" : C === "cfg" ? x = "CFG" : C === "genTime" && (x = "Gen Time"), u.push({
      label: `${x}: `,
      value: S,
      color: d[C] || "#ffffff"
    });
  }
  if (!u.length) return;
  const c = 11, p = 16, h = 8, f = Math.max(100, r - h * 2);
  e.save();
  const m = [];
  for (const { label: C, value: S, color: x } of u) {
    e.font = `bold ${c}px system-ui, sans-serif`;
    const P = e.measureText(C).width;
    e.font = `${c}px system-ui, sans-serif`;
    const B = f - h * 2 - P, v = [];
    let I = "";
    for (const O of S.split(" ")) {
      const G = I ? I + " " + O : O;
      e.measureText(G).width > B && I ? (v.push(I), I = O) : I = G;
    }
    I && v.push(I), m.push({ label: C, labelW: P, lines: v, color: x });
  }
  const g = m.reduce((C, S) => C + S.lines.length, 0) * p + h * 2, b = s + h, y = o + a - g - h;
  e.globalAlpha = 0.72, e.fillStyle = "#000", Fe(e, b, y, f, g, 6), e.fill(), e.globalAlpha = 1;
  let A = y + h + c;
  for (const { label: C, labelW: S, lines: x, color: P } of m)
    for (let B = 0; B < x.length; B++)
      B === 0 ? (e.font = `bold ${c}px system-ui, sans-serif`, e.fillStyle = P, e.fillText(C, b + h, A), e.font = `${c}px system-ui, sans-serif`, e.fillStyle = "rgba(255,255,255,0.88)", e.fillText(x[B], b + h + S, A)) : (e.font = `${c}px system-ui, sans-serif`, e.fillStyle = "rgba(255,255,255,0.88)", e.fillText(x[B], b + h + S, A)), A += p;
  e.restore();
}
async function qo(t) {
  var d;
  if (!t._contentEl) return;
  t._captureBtn && (t._captureBtn.disabled = !0, t._captureBtn.setAttribute("aria-label", R("tooltip.capturingView", "Capturing…")));
  const e = t._contentEl.clientWidth || 480, n = t._contentEl.clientHeight || 360;
  let s = n;
  if (t._mode === L.SIMPLE && t._mediaA && t._genInfoSelections.size) {
    const i = document.createElement("canvas");
    i.width = e, i.height = n;
    const u = i.getContext("2d"), c = t._estimateGenInfoOverlayHeight(u, t._mediaA, e);
    if (c > 0) {
      const p = Math.max(n, c + 24);
      s = Math.min(p, n * 4);
    }
  }
  const o = document.createElement("canvas");
  o.width = e, o.height = s;
  const r = o.getContext("2d");
  r.fillStyle = "#0d0d0d", r.fillRect(0, 0, e, s);
  try {
    if (t._mode === L.SIMPLE)
      t._mediaA && (await t._drawMediaFit(r, t._mediaA, 0, 0, e, n), t._drawGenInfoOverlay(r, t._mediaA, 0, 0, e, s));
    else if (t._mode === L.AB) {
      const i = Math.round(t._abDividerX * e), u = t._contentEl.querySelector(
        ".mjr-mfv-ab-layer:not(.mjr-mfv-ab-layer--b) video"
      ), c = t._contentEl.querySelector(".mjr-mfv-ab-layer--b video");
      t._mediaA && await t._drawMediaFit(r, t._mediaA, 0, 0, e, s, u), t._mediaB && (r.save(), r.beginPath(), r.rect(i, 0, e - i, s), r.clip(), await t._drawMediaFit(r, t._mediaB, 0, 0, e, s, c), r.restore()), r.save(), r.strokeStyle = "rgba(255,255,255,0.88)", r.lineWidth = 2, r.beginPath(), r.moveTo(i, 0), r.lineTo(i, s), r.stroke(), r.restore(), ut(r, "A", 8, 8), ut(r, "B", i + 8, 8), t._mediaA && t._drawGenInfoOverlay(r, t._mediaA, 0, 0, i, s), t._mediaB && t._drawGenInfoOverlay(r, t._mediaB, i, 0, e - i, s);
    } else if (t._mode === L.SIDE) {
      const i = Math.floor(e / 2), u = t._contentEl.querySelector(".mjr-mfv-side-panel:first-child video"), c = t._contentEl.querySelector(".mjr-mfv-side-panel:last-child video");
      t._mediaA && (await t._drawMediaFit(r, t._mediaA, 0, 0, i, s, u), t._drawGenInfoOverlay(r, t._mediaA, 0, 0, i, s)), r.fillStyle = "#111", r.fillRect(i, 0, 2, s), t._mediaB && (await t._drawMediaFit(r, t._mediaB, i, 0, i, s, c), t._drawGenInfoOverlay(r, t._mediaB, i, 0, i, s)), ut(r, "A", 8, 8), ut(r, "B", i + 8, 8);
    } else if (t._mode === L.GRID) {
      const i = Math.floor(e / 2), u = Math.floor(s / 2), c = 1, p = [
        { media: t._mediaA, label: "A", x: 0, y: 0, w: i - c, h: u - c },
        {
          media: t._mediaB,
          label: "B",
          x: i + c,
          y: 0,
          w: i - c,
          h: u - c
        },
        {
          media: t._mediaC,
          label: "C",
          x: 0,
          y: u + c,
          w: i - c,
          h: u - c
        },
        {
          media: t._mediaD,
          label: "D",
          x: i + c,
          y: u + c,
          w: i - c,
          h: u - c
        }
      ], h = t._contentEl.querySelectorAll(".mjr-mfv-grid-cell");
      for (let f = 0; f < p.length; f++) {
        const m = p[f], _ = ((d = h[f]) == null ? void 0 : d.querySelector("video")) || null;
        m.media && (await t._drawMediaFit(r, m.media, m.x, m.y, m.w, m.h, _), t._drawGenInfoOverlay(r, m.media, m.x, m.y, m.w, m.h)), ut(r, m.label, m.x + 8, m.y + 8);
      }
      r.save(), r.fillStyle = "#111", r.fillRect(i - c, 0, c * 2, s), r.fillRect(0, u - c, e, c * 2), r.restore();
    }
  } catch (i) {
    console.debug("[MFV] capture error:", i);
  }
  const l = `${{
    [L.AB]: "mfv-ab",
    [L.SIDE]: "mfv-side",
    [L.GRID]: "mfv-grid"
  }[t._mode] ?? "mfv"}-${Date.now()}.png`;
  try {
    const i = o.toDataURL("image/png"), u = document.createElement("a");
    u.href = i, u.download = l, document.body.appendChild(u), u.click(), setTimeout(() => document.body.removeChild(u), 100);
  } catch (i) {
    console.warn("[MFV] download failed:", i);
  } finally {
    t._captureBtn && (t._captureBtn.disabled = !1, t._captureBtn.setAttribute(
      "aria-label",
      R("tooltip.captureView", "Save view as image")
    ));
  }
}
const Ko = "imageops-live-preview";
function Ne(t) {
  return String((t == null ? void 0 : t._source) || "") === Ko;
}
function Zo(t, e, { autoMode: n = !1 } = {}) {
  const s = t._mediaA || null, o = Ne(e), r = o && Ne(s) && String((s == null ? void 0 : s._nodeId) || "") === String((e == null ? void 0 : e._nodeId) || "");
  if (t._mediaA = e || null, r || t._resetMfvZoom(), n && t._mode !== L.SIMPLE && t._mode !== L.GRAPH && (t._mode = L.SIMPLE, t._updateModeBtnUI()), t._mediaA && !o && typeof Lt == "function") {
    const a = ++t._refreshGen;
    (async () => {
      var l;
      try {
        const d = await Lt(t._mediaA, {
          getAssetMetadata: Yt,
          getFileMetadataScoped: Ut
        });
        if (t._refreshGen !== a) return;
        d && typeof d == "object" && (t._mediaA = d, t._refresh());
      } catch (d) {
        (l = console.debug) == null || l.call(console, "[MFV] metadata enrich error", d);
      }
    })();
  } else
    t._refresh();
}
function Jo(t, e, n) {
  t._mediaA = e || null, t._mediaB = n || null, t._resetMfvZoom(), t._mode === L.SIMPLE && (t._mode = L.AB, t._updateModeBtnUI());
  const s = ++t._refreshGen, o = async (r) => {
    if (!r) return r;
    try {
      return await Lt(r, {
        getAssetMetadata: Yt,
        getFileMetadataScoped: Ut
      }) || r;
    } catch {
      return r;
    }
  };
  (async () => {
    const [r, a] = await Promise.all([o(t._mediaA), o(t._mediaB)]);
    t._refreshGen === s && (t._mediaA = r || null, t._mediaB = a || null, t._refresh());
  })();
}
function $o(t, e, n, s, o) {
  t._mediaA = e || null, t._mediaB = n || null, t._mediaC = s || null, t._mediaD = o || null, t._resetMfvZoom(), t._mode !== L.GRID && (t._mode = L.GRID, t._updateModeBtnUI());
  const r = ++t._refreshGen, a = async (l) => {
    if (!l) return l;
    try {
      return await Lt(l, {
        getAssetMetadata: Yt,
        getFileMetadataScoped: Ut
      }) || l;
    } catch {
      return l;
    }
  };
  (async () => {
    const [l, d, i, u] = await Promise.all([
      a(t._mediaA),
      a(t._mediaB),
      a(t._mediaC),
      a(t._mediaD)
    ]);
    t._refreshGen === r && (t._mediaA = l || null, t._mediaB = d || null, t._mediaC = i || null, t._mediaD = u || null, t._refresh());
  })();
}
function mt(t) {
  var e, n, s, o;
  try {
    return !!((e = t == null ? void 0 : t.classList) != null && e.contains("mjr-mfv-simple-player")) || !!((n = t == null ? void 0 : t.classList) != null && n.contains("mjr-mfv-player-host")) || !!((s = t == null ? void 0 : t.querySelector) != null && s.call(t, ".mjr-video-controls, .mjr-mfv-simple-player-controls"));
  } catch (r) {
    return (o = console.debug) == null || o.call(console, r), !1;
  }
}
let tr = 0;
class sr {
  constructor({ controller: e = null } = {}) {
    this._instanceId = ++tr, this._controller = e && typeof e == "object" ? { ...e } : null, this.element = null, this.isVisible = !1, this._contentEl = null, this._genSidebarEl = null, this._closeBtn = null, this._modeBtn = null, this._pinGroup = null, this._pinBtns = null, this._liveBtn = null, this._genBtn = null, this._genDropdown = null, this._genSidebarEnabled = !0, this._captureBtn = null, this._genInfoSelections = /* @__PURE__ */ new Set([
      "prompt",
      "seed",
      "model",
      "lora",
      "sampler",
      "scheduler",
      "cfg",
      "step",
      "genTime"
    ]), this._mode = L.SIMPLE, this._mediaA = null, this._mediaB = null, this._mediaC = null, this._mediaD = null, this._pinnedSlots = /* @__PURE__ */ new Set(), this._abDividerX = 0.5, this._zoom = 1, this._panX = 0, this._panY = 0, this._panzoomAC = null, this._dragging = !1, this._compareSyncAC = null, this._btnAC = null, this._refreshGen = 0, this._popoutWindow = null, this._popoutBtn = null, this._isPopped = !1, this._desktopExpanded = !1, this._desktopExpandRestore = null, this._desktopPopoutUnsupported = !1, this._popoutCloseHandler = null, this._popoutKeydownHandler = null, this._popoutCloseTimer = null, this._popoutRestoreGuard = !1, this._previewBtn = null, this._previewBlobUrl = null, this._previewActive = !1, this._nodeStreamBtn = null, this._nodeStreamActive = !1, this._nodeStreamSelection = null, this._nodeStreamOverlayEl = null, this._docAC = new AbortController(), this._popoutAC = null, this._panelAC = new AbortController(), this._resizeState = null, this._titleId = `mjr-mfv-title-${this._instanceId}`, this._genDropdownId = `mjr-mfv-gen-dropdown-${this._instanceId}`, this._progressEl = null, this._progressNodesEl = null, this._progressStepsEl = null, this._progressTextEl = null, this._mediaProgressEl = null, this._mediaProgressTextEl = null, this._progressUpdateHandler = null, this._progressCurrentNodeId = null, this._docClickHost = null, this._handleDocClick = null, this._mediaControlHandles = [], this._layoutObserver = null, this._channel = "rgb", this._exposureEV = 0, this._gridMode = 0, this._overlayMaskEnabled = !1, this._overlayMaskOpacity = 0.65, this._overlayFormat = "image", this._graphMapPanel = new we({ large: !0 });
  }
  _dispatchControllerAction(e, n) {
    var s, o, r;
    try {
      const a = (s = this._controller) == null ? void 0 : s[e];
      if (typeof a == "function")
        return a();
    } catch (a) {
      (o = console.debug) == null || o.call(console, a);
    }
    if (n)
      try {
        window.dispatchEvent(new Event(n));
      } catch (a) {
        (r = console.debug) == null || r.call(console, a);
      }
  }
  _forwardKeydownToController(e) {
    var n, s, o;
    try {
      const r = (n = this._controller) == null ? void 0 : n.handleForwardedKeydown;
      if (typeof r == "function") {
        r(e);
        return;
      }
    } catch (r) {
      (s = console.debug) == null || s.call(console, r);
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
    } catch (r) {
      (o = console.debug) == null || o.call(console, r);
    }
  }
  // ── Build DOM ─────────────────────────────────────────────────────────────
  render() {
    return no(this);
  }
  _buildHeader() {
    return so(this);
  }
  _buildToolbar() {
    return oo(this);
  }
  _rebindControlHandlers() {
    return ro(this);
  }
  _updateSettingsBtnState(e) {
    return io(this, e);
  }
  _applySidebarPosition() {
    return ao(this);
  }
  refreshSidebar() {
    var e;
    (e = this._sidebar) == null || e.refresh();
  }
  _resetGenDropdownForCurrentDocument() {
  }
  _bindDocumentUiHandlers() {
    return lo(this);
  }
  _unbindDocumentUiHandlers() {
    return co(this);
  }
  _isGenDropdownOpen() {
    return !1;
  }
  _openGenDropdown() {
  }
  _closeGenDropdown() {
  }
  _updateGenBtnUI() {
    return uo(this);
  }
  _buildGenDropdown() {
    return null;
  }
  _getGenFields(e) {
    return mo(this, e);
  }
  _buildGenInfoDOM(e) {
    return ho(this, e);
  }
  _notifyModeChanged() {
    return fo(this);
  }
  _cycleMode() {
    return _o(this);
  }
  setMode(e) {
    return go(this, e);
  }
  getPinnedSlots() {
    return bo(this);
  }
  _updatePinUI() {
    return yo(this);
  }
  _updateModeBtnUI() {
    return Co(this);
  }
  setLiveActive(e) {
    return Ao(this, e);
  }
  setPreviewActive(e) {
    return So(this, e);
  }
  loadPreviewBlob(e, n = {}) {
    return Eo(this, e, n);
  }
  _revokePreviewBlob() {
    return Mo(this);
  }
  setNodeStreamActive(e) {
    return No(this, e);
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
      const a = document.createElement("div");
      a.className = "mjr-mfv-node-overlay", a.setAttribute("aria-live", "polite"), this._nodeStreamOverlayEl = a;
    }
    this._nodeStreamOverlayEl.parentNode !== e && e.appendChild(this._nodeStreamOverlayEl);
    const s = n.nodeId ? `#${n.nodeId}` : "", o = n.classType || "Node", r = n.title && n.title !== n.classType ? ` — ${n.title}` : "";
    this._nodeStreamOverlayEl.textContent = `${s} · ${o}${r}`.trim();
  }
  loadMediaA(e, { autoMode: n = !1 } = {}) {
    return Zo(this, e, { autoMode: n });
  }
  /**
   * Load two assets for compare modes.
   * Auto-switches from SIMPLE → AB on first call.
   */
  loadMediaPair(e, n) {
    return Jo(this, e, n);
  }
  /**
   * Load up to 4 assets for grid compare mode.
   * Auto-switches to GRID mode if not already.
   */
  loadMediaQuad(e, n, s, o) {
    return $o(this, e, n, s, o);
  }
  /** Apply current zoom+pan state to all media elements (img/video only — divider/overlays unaffected). */
  _applyTransform() {
    if (!this._contentEl) return;
    const e = Math.max(Ot, Math.min(Gt, this._zoom)), n = this._contentEl.clientWidth || 0, s = this._contentEl.clientHeight || 0, o = Math.max(0, (e - 1) * n / 2), r = Math.max(0, (e - 1) * s / 2);
    this._panX = Math.max(-o, Math.min(o, this._panX)), this._panY = Math.max(-r, Math.min(r, this._panY));
    const a = `translate(${this._panX}px,${this._panY}px) scale(${e})`;
    for (const l of this._contentEl.querySelectorAll(".mjr-mfv-media"))
      l != null && l._mjrDisableViewerTransform || (l.style.transform = a, l.style.transformOrigin = "center");
    this._contentEl.classList.remove("mjr-mfv-content--grab", "mjr-mfv-content--grabbing"), e > 1.01 && this._contentEl.classList.add(
      this._dragging ? "mjr-mfv-content--grabbing" : "mjr-mfv-content--grab"
    ), this._applyMediaToneControls(), this._redrawOverlayGuides();
  }
  _ensureToneFilterDefs() {
    var r, a;
    if ((r = this._toneFilterDefsEl) != null && r.isConnected) return this._toneFilterDefsEl;
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
    for (const [l, d] of o) {
      const i = document.createElementNS(e, "filter");
      i.setAttribute("id", l);
      const u = document.createElementNS(e, "feColorMatrix");
      u.setAttribute("type", "matrix"), u.setAttribute("values", d), i.appendChild(u), s.appendChild(i);
    }
    return n.appendChild(s), (a = this.element) == null || a.appendChild(n), this._toneFilterDefsEl = n, n;
  }
  _applyMediaToneControls() {
    var l, d, i;
    if (this._ensureToneFilterDefs(), !this._contentEl) return;
    const e = String(this._channel || "rgb"), n = Math.pow(2, Number(this._exposureEV) || 0), s = e === "rgb" ? "" : `url(#mjr-mfv-ch-${e})`, o = Math.abs(n - 1) < 1e-4 ? "" : `brightness(${n})`, r = [s, o].filter(Boolean).join(" ").trim(), a = ((d = (l = this._contentEl).querySelectorAll) == null ? void 0 : d.call(l, ".mjr-mfv-media")) || [];
    for (const u of a)
      try {
        u.style.filter = r || "";
      } catch (c) {
        (i = console.debug) == null || i.call(console, c);
      }
  }
  _getOverlayAspect(e, n, s) {
    var o;
    try {
      const r = String(e || "image");
      if (r === "image") {
        const a = Number(n == null ? void 0 : n.videoWidth) || Number(n == null ? void 0 : n.naturalWidth) || Number(s == null ? void 0 : s.width) || 1, l = Number(n == null ? void 0 : n.videoHeight) || Number(n == null ? void 0 : n.naturalHeight) || Number(s == null ? void 0 : s.height) || 1, d = a / l;
        return Number.isFinite(d) && d > 0 ? d : 1;
      }
      if (r === "16:9") return 16 / 9;
      if (r === "9:16") return 9 / 16;
      if (r === "1:1") return 1;
      if (r === "4:3") return 4 / 3;
      if (r === "2.39") return 2.39;
    } catch (r) {
      (o = console.debug) == null || o.call(console, r);
    }
    return 1;
  }
  _fitAspectInBox(e, n, s) {
    var o;
    try {
      const r = Number(e) || 0, a = Number(n) || 0, l = Number(s) || 1;
      if (!(r > 0 && a > 0 && l > 0)) return { x: 0, y: 0, w: r, h: a };
      const d = r / a;
      let i = r, u = a;
      return l >= d ? u = r / l : i = a * l, { x: (r - i) / 2, y: (a - u) / 2, w: i, h: u };
    } catch (r) {
      return (o = console.debug) == null || o.call(console, r), { x: 0, y: 0, w: Number(e) || 0, h: Number(n) || 0 };
    }
  }
  _drawMaskOutside(e, n, s, o) {
    var r;
    try {
      const a = Math.max(0, Math.min(0.92, Number(o) || 0));
      if (!(a > 0)) return;
      e.save(), e.fillStyle = `rgba(0,0,0,${a})`, e.fillRect(0, 0, n.width, n.height), e.globalCompositeOperation = "destination-out";
      for (const l of s)
        !l || !(l.w > 1 && l.h > 1) || e.fillRect(l.x, l.y, l.w, l.h);
      e.restore();
    } catch (a) {
      (r = console.debug) == null || r.call(console, a);
    }
  }
  _redrawOverlayGuides() {
    var h, f, m, _, g, b;
    const e = this._overlayCanvas, n = this._contentEl;
    if (!e || !n) return;
    const s = (h = e.getContext) == null ? void 0 : h.call(e, "2d");
    if (!s) return;
    const o = Math.max(1, Math.min(3, Number(window.devicePixelRatio) || 1)), r = n.clientWidth || 0, a = n.clientHeight || 0;
    if (e.width = Math.max(1, Math.floor(r * o)), e.height = Math.max(1, Math.floor(a * o)), e.style.width = `${r}px`, e.style.height = `${a}px`, s.clearRect(0, 0, e.width, e.height), !(this._gridMode || this._overlayMaskEnabled)) return;
    const l = (f = n.getBoundingClientRect) == null ? void 0 : f.call(n);
    if (!l) return;
    const d = Array.from(
      ((m = n.querySelectorAll) == null ? void 0 : m.call(
        n,
        ".mjr-mfv-simple-container, .mjr-mfv-side-panel, .mjr-mfv-grid-cell, .mjr-mfv-ab-layer"
      )) || []
    ), i = d.length ? d : [n], u = [];
    for (const y of i) {
      const A = (_ = y.querySelector) == null ? void 0 : _.call(y, ".mjr-mfv-media");
      if (!A) continue;
      const C = (g = y.getBoundingClientRect) == null ? void 0 : g.call(y);
      if (!(C != null && C.width) || !(C != null && C.height)) continue;
      const S = Number(C.width) || 0, x = Number(C.height) || 0, P = this._getOverlayAspect(this._overlayFormat, A, C), B = this._fitAspectInBox(S, x, P), v = C.left - l.left + S / 2, I = C.top - l.top + x / 2, O = Math.max(0.1, Math.min(16, Number(this._zoom) || 1)), G = {
        x: v + B.x * O - S * O / 2 + (Number(this._panX) || 0),
        y: I + B.y * O - x * O / 2 + (Number(this._panY) || 0),
        w: B.w * O,
        h: B.h * O
      };
      u.push({
        x: G.x * o,
        y: G.y * o,
        w: G.w * o,
        h: G.h * o
      });
    }
    if (!u.length) return;
    if (this._overlayMaskEnabled) {
      this._drawMaskOutside(s, e, u, this._overlayMaskOpacity), s.save(), (b = s.setLineDash) == null || b.call(s, [Math.max(2, 4 * o), Math.max(2, 3 * o)]), s.strokeStyle = "rgba(255,255,255,0.22)", s.lineWidth = Math.max(1, Math.floor(o));
      for (const y of u)
        s.strokeRect(y.x + 0.5, y.y + 0.5, y.w - 1, y.h - 1);
      s.restore();
    }
    if (this._mode !== L.SIMPLE || !this._gridMode) return;
    const c = u[0];
    if (!c) return;
    s.save(), s.translate(c.x, c.y), s.strokeStyle = "rgba(255,255,255,0.22)", s.lineWidth = Math.max(2, Math.round(1.25 * o));
    const p = (y, A, C, S) => {
      s.beginPath(), s.moveTo(Math.round(y) + 0.5, Math.round(A) + 0.5), s.lineTo(Math.round(C) + 0.5, Math.round(S) + 0.5), s.stroke();
    };
    this._gridMode === 1 ? (p(c.w / 3, 0, c.w / 3, c.h), p(2 * c.w / 3, 0, 2 * c.w / 3, c.h), p(0, c.h / 3, c.w, c.h / 3), p(0, 2 * c.h / 3, c.w, 2 * c.h / 3)) : this._gridMode === 2 ? (p(c.w / 2, 0, c.w / 2, c.h), p(0, c.h / 2, c.w, c.h / 2)) : this._gridMode === 3 && (s.strokeRect(
      c.w * 0.1 + 0.5,
      c.h * 0.1 + 0.5,
      c.w * 0.8 - 1,
      c.h * 0.8 - 1
    ), s.strokeRect(
      c.w * 0.05 + 0.5,
      c.h * 0.05 + 0.5,
      c.w * 0.9 - 1,
      c.h * 0.9 - 1
    )), s.restore();
  }
  /**
   * Set zoom, optionally centered at (clientX, clientY).
   * Keeps the image point under the cursor stationary.
   */
  _setMfvZoom(e, n, s) {
    const o = Math.max(Ot, Math.min(Gt, this._zoom)), r = Math.max(Ot, Math.min(Gt, Number(e) || 1));
    if (n != null && s != null && this._contentEl) {
      const a = r / o, l = this._contentEl.getBoundingClientRect(), d = n - (l.left + l.width / 2), i = s - (l.top + l.height / 2);
      this._panX = this._panX * a + (1 - a) * d, this._panY = this._panY * a + (1 - a) * i;
    }
    this._zoom = r, Math.abs(r - 1) < 1e-3 && (this._zoom = 1, this._panX = 0, this._panY = 0), this._applyTransform();
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
      (i) => {
        var h, f, m, _;
        if ((f = (h = i.target) == null ? void 0 : h.closest) != null && f.call(h, "audio") || (_ = (m = i.target) == null ? void 0 : m.closest) != null && _.call(m, ".mjr-video-controls, .mjr-mfv-simple-player-controls") || Ft(i.target)) return;
        const u = vn(i.target, e);
        if (u && kn(
          u,
          Number(i.deltaX || 0),
          Number(i.deltaY || 0)
        ))
          return;
        i.preventDefault();
        const p = 1 - (i.deltaY || i.deltaX || 0) * Cn;
        this._setMfvZoom(this._zoom * p, i.clientX, i.clientY);
      },
      { ...n, passive: !1 }
    );
    let s = !1, o = 0, r = 0, a = 0, l = 0;
    e.addEventListener(
      "pointerdown",
      (i) => {
        var u, c, p, h, f, m, _, g, b;
        if (!(i.button !== 0 && i.button !== 1) && !(this._zoom <= 1.01) && !((c = (u = i.target) == null ? void 0 : u.closest) != null && c.call(u, "video")) && !((h = (p = i.target) == null ? void 0 : p.closest) != null && h.call(p, "audio")) && !((m = (f = i.target) == null ? void 0 : f.closest) != null && m.call(f, ".mjr-video-controls, .mjr-mfv-simple-player-controls")) && !((g = (_ = i.target) == null ? void 0 : _.closest) != null && g.call(_, ".mjr-mfv-ab-divider")) && !Ft(i.target)) {
          i.preventDefault(), s = !0, this._dragging = !0, o = i.clientX, r = i.clientY, a = this._panX, l = this._panY;
          try {
            e.setPointerCapture(i.pointerId);
          } catch (y) {
            (b = console.debug) == null || b.call(console, y);
          }
          this._applyTransform();
        }
      },
      n
    ), e.addEventListener(
      "pointermove",
      (i) => {
        s && (this._panX = a + (i.clientX - o), this._panY = l + (i.clientY - r), this._applyTransform());
      },
      n
    );
    const d = (i) => {
      var u;
      if (s) {
        s = !1, this._dragging = !1;
        try {
          e.releasePointerCapture(i.pointerId);
        } catch (c) {
          (u = console.debug) == null || u.call(console, c);
        }
        this._applyTransform();
      }
    };
    e.addEventListener("pointerup", d, n), e.addEventListener("pointercancel", d, n), e.addEventListener(
      "dblclick",
      (i) => {
        var c, p, h, f, m, _;
        if ((p = (c = i.target) == null ? void 0 : c.closest) != null && p.call(c, "video") || (f = (h = i.target) == null ? void 0 : h.closest) != null && f.call(h, "audio") || (_ = (m = i.target) == null ? void 0 : m.closest) != null && _.call(m, ".mjr-video-controls, .mjr-mfv-simple-player-controls") || Ft(i.target)) return;
        const u = Math.abs(this._zoom - 1) < 0.05;
        this._setMfvZoom(u ? Math.min(4, this._zoom * 4) : 1, i.clientX, i.clientY);
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
      } catch (r) {
        (s = console.debug) == null || s.call(console, r);
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
    if (this._destroyCompareSync(), !!this._contentEl && this._mode !== L.SIMPLE)
      try {
        const n = Array.from(this._contentEl.querySelectorAll("video"));
        if (n.length < 2) return;
        const s = n[0] || null, o = n.slice(1);
        if (!s || !o.length) return;
        this._compareSyncAC = gn(s, o, { threshold: 0.08 });
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
      case L.SIMPLE:
        this._renderSimple();
        break;
      case L.AB:
        this._renderAB();
        break;
      case L.SIDE:
        this._renderSide();
        break;
      case L.GRID:
        this._renderGrid();
        break;
      case L.GRAPH:
        this._renderGraphMap();
        break;
    }
    e && this._contentEl.appendChild(e), this._nodeStreamSelection && this._updateNodeStreamOverlay(), this._mediaProgressEl && this._contentEl.appendChild(this._mediaProgressEl), this._applyMediaToneControls(), this._applyTransform(), this._mode !== L.GRAPH && this._initPanZoom(this._contentEl), this._initCompareSync(), this._renderGenInfoSidebar();
  }
  _renderGenInfoSidebar() {
    var r, a;
    const e = this._genSidebarEl;
    if (!e) return;
    e.replaceChildren();
    const n = this._getGenInfoSidebarSlots();
    if (this._mode === L.GRAPH || !this._genSidebarEnabled || n.length === 0) {
      e.classList.remove("open"), e.setAttribute("hidden", ""), (r = this._updateGenBtnUI) == null || r.call(this);
      return;
    }
    const s = document.createElement("div");
    s.className = "mjr-mfv-gen-sidebar-title", s.textContent = "Gen Info", e.appendChild(s);
    let o = 0;
    for (const l of n) {
      if (K(l.media) === "audio") continue;
      const d = this._buildGenInfoSidebarContent(l.media);
      if (!d) continue;
      const i = document.createElement("section");
      i.className = "mjr-mfv-gen-sidebar-section";
      const u = document.createElement("div");
      u.className = "mjr-mfv-gen-sidebar-heading", u.textContent = n.length > 1 ? `Asset ${l.label}` : "Current Asset";
      const c = document.createElement("div");
      c.className = "mjr-mfv-gen-sidebar-body", c.appendChild(d), i.appendChild(u), i.appendChild(c), e.appendChild(i), o += 1;
    }
    if (!o) {
      e.classList.remove("open"), e.setAttribute("hidden", "");
      return;
    }
    e.removeAttribute("hidden"), e.classList.add("open"), (a = this._updateGenBtnUI) == null || a.call(this);
  }
  _getGenInfoSidebarSlots() {
    const e = { media: this._mediaA, label: "A" }, n = { media: this._mediaB, label: "B" }, s = { media: this._mediaC, label: "C" }, o = { media: this._mediaD, label: "D" };
    return (this._mode === L.GRID ? [e, n, s, o] : this._mode === L.AB || this._mode === L.SIDE ? [e, n] : [e]).filter((a) => a.media);
  }
  _buildGenInfoSidebarContent(e) {
    var a, l, d, i, u;
    const n = ((a = this._getGenFields(e)) == null ? void 0 : a.genTime) || "";
    let s = null;
    try {
      s = bn(e);
    } catch (c) {
      (l = console.debug) == null || l.call(console, c);
    }
    if (s && s.kind !== "empty") {
      const c = document.createDocumentFragment();
      n && c.appendChild(this._buildGenTimeBadge(n)), s.workflowType && c.appendChild(
        this._buildGenInfoCard({
          title: "Workflow",
          accent: "#2196F3",
          value: [s.workflowLabel || s.workflowType, s.workflowBadge].filter(Boolean).join("  |  "),
          compact: !0
        })
      ), s.positivePrompt && c.appendChild(
        this._buildGenInfoCard({
          title: "Positive Prompt",
          accent: "#4CAF50",
          value: s.positivePrompt,
          multiline: !0
        })
      ), s.negativePrompt && c.appendChild(
        this._buildGenInfoCard({
          title: "Negative Prompt",
          accent: "#F44336",
          value: s.negativePrompt,
          multiline: !0
        })
      );
      for (const p of s.promptTabs || []) {
        const h = [p.positive, p.negative ? `Negative:
${p.negative}` : ""].filter(Boolean).join(`

`);
        c.appendChild(
          this._buildGenInfoCard({
            title: p.label || "Prompt",
            accent: "#4CAF50",
            value: h,
            multiline: !0
          })
        );
      }
      if ((d = s.modelFields) != null && d.length) {
        const p = this._buildGenInfoFieldsCard(
          "Model & LoRA",
          "#9C27B0",
          s.modelFields
        );
        p && c.appendChild(p);
      }
      for (const p of s.modelGroups || []) {
        const h = [
          { label: "UNet", value: p.model || "-" },
          ...(p.loras || []).map((m, _) => ({
            label: _ === 0 ? "LoRA" : `LoRA ${_ + 1}`,
            value: m
          }))
        ], f = this._buildGenInfoFieldsCard(
          p.label || "Model Branch",
          "#AB47BC",
          h
        );
        f && c.appendChild(f);
      }
      if ((i = s.pipelineTabs) != null && i.length)
        for (const p of s.pipelineTabs) {
          const h = this._buildGenInfoFieldsCard(
            p.label || "Generation Pipeline",
            "#FF9800",
            p.fields || []
          );
          h && c.appendChild(h);
        }
      else if ((u = s.samplingFields) != null && u.length) {
        const p = this._buildGenInfoFieldsCard("Sampling", "#FF9800", s.samplingFields);
        p && c.appendChild(p);
      }
      if (s.seed !== null && s.seed !== void 0 && s.seed !== "" && c.appendChild(
        this._buildGenInfoCard({
          title: "Seed",
          accent: "#E91E63",
          value: String(s.seed),
          seed: !0
        })
      ), s.mediaOnlyMessage && c.appendChild(
        this._buildGenInfoCard({
          title: "Generation Data",
          accent: "#9E9E9E",
          value: s.mediaOnlyMessage,
          multiline: !0
        })
      ), c.childNodes.length) return c;
    }
    const o = this._buildGenInfoDOM(e);
    if (!n) return o;
    const r = document.createDocumentFragment();
    return r.appendChild(this._buildGenTimeBadge(n)), o && r.appendChild(o), r;
  }
  _buildGenTimeBadge(e) {
    const n = document.createElement("div");
    n.className = "mjr-mfv-gen-time-badge", this._bindGenInfoCopy(n, () => String(e || ""));
    const s = document.createElement("span");
    s.className = "mjr-mfv-gen-time-label", s.textContent = "Generation Time";
    const o = document.createElement("span");
    return o.className = "mjr-mfv-gen-time-value", o.textContent = String(e || ""), n.appendChild(s), n.appendChild(o), n;
  }
  _buildGenInfoCard({ title: e, accent: n, value: s, multiline: o = !1, compact: r = !1, seed: a = !1 }) {
    const l = document.createElement("div");
    l.className = `mjr-mfv-gen-card${a ? " mjr-mfv-gen-card--seed" : ""}${r ? " mjr-mfv-gen-card--compact" : ""}`, l.style.setProperty("--mjr-mfv-gen-accent", n || "#2196F3"), this._bindGenInfoCopy(l, () => String(s ?? ""));
    const d = document.createElement("div");
    d.className = "mjr-mfv-gen-card-title", d.textContent = e || "";
    const i = document.createElement("div");
    return i.className = `mjr-mfv-gen-card-value${o ? " is-multiline" : ""}${r ? " is-compact" : ""}`, i.textContent = String(s ?? ""), l.appendChild(d), l.appendChild(i), l;
  }
  _buildGenInfoFieldsCard(e, n, s) {
    const o = this._buildGenInfoCard({ title: e, accent: n, value: "" });
    this._bindGenInfoCopy(
      o,
      () => (s || []).map((a) => {
        const l = String((a == null ? void 0 : a.label) || "").trim(), d = String((a == null ? void 0 : a.value) ?? "").trim();
        return l && d && d !== "-" ? `${l}: ${d}` : "";
      }).filter(Boolean).join(`
`)
    );
    const r = o.querySelector(".mjr-mfv-gen-card-value");
    r.replaceChildren(), r.classList.add("is-fields");
    for (const a of s || []) {
      const l = String((a == null ? void 0 : a.label) || "").trim(), d = String((a == null ? void 0 : a.value) ?? "").trim();
      if (!l || !d || d === "-") continue;
      const i = document.createElement("div");
      i.className = "mjr-mfv-gen-field";
      const u = document.createElement("span");
      u.className = "mjr-mfv-gen-field-label", u.textContent = l;
      const c = document.createElement("span");
      c.className = "mjr-mfv-gen-field-value", c.textContent = d, i.appendChild(u), i.appendChild(c), r.appendChild(i);
    }
    return r.childNodes.length ? o : null;
  }
  _bindGenInfoCopy(e, n) {
    !e || typeof n != "function" || (e.title = "Click to copy", e.addEventListener("click", async (s) => {
      var r, a, l;
      s.stopPropagation();
      const o = String(n() || "").trim();
      if (o)
        try {
          await ((a = (r = navigator.clipboard) == null ? void 0 : r.writeText) == null ? void 0 : a.call(r, o)), e.classList.add("mjr-mfv-gen-copy-flash"), setTimeout(() => e.classList.remove("mjr-mfv-gen-copy-flash"), 450);
        } catch (d) {
          (l = console.debug) == null || l.call(console, d);
        }
    }));
  }
  _renderGraphMap() {
    this._contentEl.style.overflow = "hidden", this._graphMapPanel.setAsset(this._mediaA || null), this._contentEl.appendChild(this._graphMapPanel.el), this._graphMapPanel.refresh();
  }
  _renderSimple() {
    var o;
    if (!this._mediaA) {
      this._contentEl.appendChild(X());
      return;
    }
    const e = nt(this._mediaA), n = ((o = this._trackMediaControls) == null ? void 0 : o.call(this, e)) || e;
    if (!n) {
      this._contentEl.appendChild(X("Could not load media"));
      return;
    }
    const s = document.createElement("div");
    s.className = "mjr-mfv-simple-container", s.appendChild(n), this._contentEl.appendChild(s);
  }
  _renderAB() {
    var g, b, y;
    const e = this._mediaA ? nt(this._mediaA, { fill: !0 }) : null, n = this._mediaB ? nt(this._mediaB, { fill: !0, controls: !1 }) : null, s = ((g = this._trackMediaControls) == null ? void 0 : g.call(this, e)) || e, o = ((b = this._trackMediaControls) == null ? void 0 : b.call(this, n)) || n, r = this._mediaA ? K(this._mediaA) : "", a = this._mediaB ? K(this._mediaB) : "";
    if (!s && !o) {
      this._contentEl.appendChild(X("Select 2 assets for A/B compare"));
      return;
    }
    if (!o) {
      this._renderSimple();
      return;
    }
    if (r === "audio" || a === "audio" || r === "model3d" || a === "model3d") {
      this._renderSide();
      return;
    }
    const l = document.createElement("div");
    l.className = "mjr-mfv-ab-container";
    const d = document.createElement("div");
    d.className = "mjr-mfv-ab-layer", s && d.appendChild(s);
    const i = document.createElement("div");
    i.className = "mjr-mfv-ab-layer mjr-mfv-ab-layer--b";
    const u = Math.round(this._abDividerX * 100);
    i.style.clipPath = `inset(0 0 0 ${u}%)`, i.appendChild(o);
    const c = document.createElement("div");
    c.className = "mjr-mfv-ab-divider", c.style.left = `${u}%`;
    const p = this._buildGenInfoDOM(this._mediaA);
    let h = null;
    p && (h = document.createElement("div"), h.className = "mjr-mfv-geninfo-a", mt(s) && h.classList.add("mjr-mfv-geninfo--above-player"), h.appendChild(p), h.style.right = `calc(${100 - u}% + 8px)`);
    const f = this._buildGenInfoDOM(this._mediaB);
    let m = null;
    f && (m = document.createElement("div"), m.className = "mjr-mfv-geninfo-b", mt(o) && m.classList.add("mjr-mfv-geninfo--above-player"), m.appendChild(f), m.style.left = `calc(${u}% + 8px)`);
    let _ = null;
    c.addEventListener(
      "pointerdown",
      (A) => {
        A.preventDefault(), c.setPointerCapture(A.pointerId);
        try {
          _ == null || _.abort();
        } catch {
        }
        _ = new AbortController();
        const C = _.signal, S = l.getBoundingClientRect(), x = (B) => {
          const v = Math.max(0.02, Math.min(0.98, (B.clientX - S.left) / S.width));
          this._abDividerX = v;
          const I = Math.round(v * 100);
          i.style.clipPath = `inset(0 0 0 ${I}%)`, c.style.left = `${I}%`, h && (h.style.right = `calc(${100 - I}% + 8px)`), m && (m.style.left = `calc(${I}% + 8px)`);
        }, P = () => {
          try {
            _ == null || _.abort();
          } catch {
          }
        };
        c.addEventListener("pointermove", x, { signal: C }), c.addEventListener("pointerup", P, { signal: C });
      },
      (y = this._panelAC) != null && y.signal ? { signal: this._panelAC.signal } : void 0
    ), l.appendChild(d), l.appendChild(i), l.appendChild(c), h && l.appendChild(h), m && l.appendChild(m), l.appendChild(it("A", "left")), l.appendChild(it("B", "right")), this._contentEl.appendChild(l);
  }
  _renderSide() {
    var p, h;
    const e = this._mediaA ? nt(this._mediaA) : null, n = this._mediaB ? nt(this._mediaB, { controls: !1 }) : null, s = ((p = this._trackMediaControls) == null ? void 0 : p.call(this, e)) || e, o = ((h = this._trackMediaControls) == null ? void 0 : h.call(this, n)) || n, r = this._mediaA ? K(this._mediaA) : "", a = this._mediaB ? K(this._mediaB) : "";
    if (!s && !o) {
      this._contentEl.appendChild(X("Select 2 assets for Side-by-Side"));
      return;
    }
    const l = document.createElement("div");
    l.className = "mjr-mfv-side-container";
    const d = document.createElement("div");
    d.className = "mjr-mfv-side-panel", s ? d.appendChild(s) : d.appendChild(X("—")), d.appendChild(it("A", "left"));
    const i = r === "audio" ? null : this._buildGenInfoDOM(this._mediaA);
    if (i) {
      const f = document.createElement("div");
      f.className = "mjr-mfv-geninfo-a", mt(s) && f.classList.add("mjr-mfv-geninfo--above-player"), f.appendChild(i), d.appendChild(f);
    }
    const u = document.createElement("div");
    u.className = "mjr-mfv-side-panel", o ? u.appendChild(o) : u.appendChild(X("—")), u.appendChild(it("B", "right"));
    const c = a === "audio" ? null : this._buildGenInfoDOM(this._mediaB);
    if (c) {
      const f = document.createElement("div");
      f.className = "mjr-mfv-geninfo-b", mt(o) && f.classList.add("mjr-mfv-geninfo--above-player"), f.appendChild(c), u.appendChild(f);
    }
    l.appendChild(d), l.appendChild(u), this._contentEl.appendChild(l);
  }
  _renderGrid() {
    var o;
    const e = [
      { media: this._mediaA, label: "A" },
      { media: this._mediaB, label: "B" },
      { media: this._mediaC, label: "C" },
      { media: this._mediaD, label: "D" }
    ];
    if (!e.filter((r) => r.media).length) {
      this._contentEl.appendChild(X("Select up to 4 assets for Grid Compare"));
      return;
    }
    const s = document.createElement("div");
    s.className = "mjr-mfv-grid-container";
    for (const { media: r, label: a } of e) {
      const l = document.createElement("div");
      if (l.className = "mjr-mfv-grid-cell", r) {
        const d = K(r), i = nt(r, { controls: a === "A" }), u = ((o = this._trackMediaControls) == null ? void 0 : o.call(this, i)) || i;
        if (u ? l.appendChild(u) : l.appendChild(X("—")), l.appendChild(
          it(a, a === "A" || a === "C" ? "left" : "right")
        ), d !== "audio") {
          const c = this._buildGenInfoDOM(r);
          if (c) {
            const p = document.createElement("div");
            p.className = `mjr-mfv-geninfo-${a.toLowerCase()}`, mt(u) && p.classList.add("mjr-mfv-geninfo--above-player"), p.appendChild(c), l.appendChild(p);
          }
        }
      } else
        l.appendChild(X("—")), l.appendChild(
          it(a, a === "A" || a === "C" ? "left" : "right")
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
    this.element && (this._destroyPanZoom(), this._destroyCompareSync(), this._stopEdgeResize(), this._closeGenDropdown(), Fn(this.element), this.element.classList.remove("is-visible"), this.element.setAttribute("aria-hidden", "true"), this.isVisible = !1);
  }
  // ── Pop-out / Pop-in (separate OS window for second monitor) ────────────
  _setDesktopExpanded(e) {
    return Po(this, e);
  }
  _activateDesktopExpandedFallback(e) {
    return jo(this, e);
  }
  _tryElectronPopupFallback(e, n, s, o) {
    return xo(this, e, n, s, o);
  }
  popOut() {
    return To(this);
  }
  _fallbackPopout(e, n, s) {
    return vo(this, e, n, s);
  }
  _clearPopoutCloseWatch() {
    return ko(this);
  }
  _startPopoutCloseWatch() {
    return Fo(this);
  }
  _schedulePopInFromPopupClose() {
    return Oo(this);
  }
  _installPopoutStyles(e) {
    return Go(this, e);
  }
  popIn(e) {
    return Ro(this, e);
  }
  _updatePopoutBtnUI() {
    return Vo(this);
  }
  get isPopped() {
    return this._isPopped || this._desktopExpanded;
  }
  _resizeCursorForDirection(e) {
    return Ho(e);
  }
  _getResizeDirectionFromPoint(e, n, s) {
    return Wo(e, n, s);
  }
  _stopEdgeResize() {
    return zo(this);
  }
  _bindPanelInteractions() {
    return Do(this);
  }
  _initEdgeResize(e) {
    return Uo(this, e);
  }
  _initDrag(e) {
    return Yo(this, e);
  }
  async _drawMediaFit(e, n, s, o, r, a, l) {
    return wo(this, e, n, s, o, r, a, l);
  }
  _estimateGenInfoOverlayHeight(e, n, s) {
    return Qo(this, e, n, s);
  }
  _drawGenInfoOverlay(e, n, s, o, r, a) {
    return Xo(this, e, n, s, o, r, a);
  }
  async _captureView() {
    return qo(this);
  }
  dispose() {
    var e, n, s, o, r, a, l, d, i, u, c, p, h, f, m, _, g, b, y, A, C;
    yn(this), this._destroyPanZoom(), this._destroyCompareSync(), this._destroyMediaControls(), this._unbindLayoutObserver(), this._stopEdgeResize(), this._clearPopoutCloseWatch();
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
      (r = this._docAC) == null || r.abort(), this._docAC = null;
    } catch (S) {
      (a = console.debug) == null || a.call(console, S);
    }
    try {
      (l = this._popoutAC) == null || l.abort(), this._popoutAC = null;
    } catch (S) {
      (d = console.debug) == null || d.call(console, S);
    }
    try {
      (i = this._panzoomAC) == null || i.abort(), this._panzoomAC = null;
    } catch (S) {
      (u = console.debug) == null || u.call(console, S);
    }
    try {
      (p = (c = this._compareSyncAC) == null ? void 0 : c.abort) == null || p.call(c), this._compareSyncAC = null;
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
      (m = this.element) == null || m.remove();
    } catch (S) {
      (_ = console.debug) == null || _.call(console, S);
    }
    try {
      (b = (g = this._graphMapPanel) == null ? void 0 : g.dispose) == null || b.call(g);
    } catch (S) {
      (y = console.debug) == null || y.call(console, S);
    }
    this._graphMapPanel = null, this.element = null, this._contentEl = null, this._genSidebarEl = null, this._closeBtn = null, this._modeBtn = null, this._pinGroup = null, this._pinBtns = null, this._liveBtn = null, this._nodeStreamBtn = null, this._popoutBtn = null, this._captureBtn = null, this._unbindDocumentUiHandlers();
    try {
      (A = this._genDropdown) == null || A.remove();
    } catch (S) {
      (C = console.debug) == null || C.call(console, S);
    }
    this._mediaA = null, this._mediaB = null, this._mediaC = null, this._mediaD = null, this.isVisible = !1;
  }
}
export {
  sr as FloatingViewer,
  L as MFV_MODES
};
