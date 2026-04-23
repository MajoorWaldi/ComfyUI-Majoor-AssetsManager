import { p as re, M as Ce, c as Ae, q as Se, t as Ee, u as Me, v as Be, A as pt, x as Z, y as v, z as gt, B as Ne, C as le, D as xe, F as Pe, G as yt, E as st, n as Le, s as St, H as Pt, I as Fe, J as Lt, K as Ft, d as Et, L as Ie, N as Te } from "./entry-B3PFjwVp.js";
import { ensureViewerMetadataAsset as Ct } from "./genInfo-BcHisLug.js";
const T = Object.freeze({
  SIMPLE: "simple",
  AB: "ab",
  SIDE: "side",
  GRID: "grid"
}), Mt = 0.25, Bt = 8, ke = 8e-4, bt = 8, je = "C", ce = "L", de = "K", Ge = "N", Ve = "Esc", At = 30;
function Nt(t) {
  const e = Number(t);
  if (!Number.isFinite(e) || e < 0) return "0:00";
  const n = Math.floor(e), o = Math.floor(n / 3600), s = Math.floor(n % 3600 / 60), i = n % 60;
  return o > 0 ? `${o}:${String(s).padStart(2, "0")}:${String(i).padStart(2, "0")}` : `${s}:${String(i).padStart(2, "0")}`;
}
function Xt(t) {
  var e, n;
  try {
    const o = (e = t == null ? void 0 : t.play) == null ? void 0 : e.call(t);
    o && typeof o.catch == "function" && o.catch(() => {
    });
  } catch (o) {
    (n = console.debug) == null || n.call(console, o);
  }
}
function Re(t, e) {
  const n = Math.floor(Number(t) || 0), o = Math.max(0, Math.floor(Number(e) || 0));
  return n < 0 ? 0 : o > 0 && n > o ? o : n;
}
function Zt(t, e) {
  const n = Number((t == null ? void 0 : t.currentTime) || 0), o = Number(e) > 0 ? Number(e) : At;
  return Math.max(0, Math.floor(n * o));
}
function ue(t, e) {
  const n = Number((t == null ? void 0 : t.duration) || 0), o = Number(e) > 0 ? Number(e) : At;
  return !Number.isFinite(n) || n <= 0 ? 0 : Math.max(0, Math.floor(n * o));
}
function Oe(t, e, n) {
  var l;
  const o = Number(n) > 0 ? Number(n) : At, s = ue(t, o), r = Re(e, s) / o;
  try {
    t.currentTime = Math.max(0, r);
  } catch (u) {
    (l = console.debug) == null || l.call(console, u);
  }
}
function He(t) {
  return t instanceof HTMLMediaElement;
}
function De(t, e) {
  return String(t || "").toLowerCase() === "video" ? !0 : e instanceof HTMLVideoElement;
}
function ve(t, e) {
  return String(t || "").toLowerCase() === "audio" ? !0 : e instanceof HTMLAudioElement;
}
function Ue(t) {
  const e = String(t || "").toLowerCase();
  return e === "gif" || e === "animated-image";
}
function ze(t) {
  var e;
  try {
    const n = Number((t == null ? void 0 : t.naturalWidth) || (t == null ? void 0 : t.width) || 0), o = Number((t == null ? void 0 : t.naturalHeight) || (t == null ? void 0 : t.height) || 0);
    if (!(n > 0 && o > 0)) return "";
    const s = document.createElement("canvas");
    s.width = n, s.height = o;
    const i = s.getContext("2d");
    return i ? (i.drawImage(t, 0, 0, n, o), s.toDataURL("image/png")) : "";
  } catch (n) {
    return (e = console.debug) == null || e.call(console, n), "";
  }
}
function We(t, e = null, { kind: n = "" } = {}) {
  var dt;
  if (!t || t._mjrSimplePlayerMounted) return (t == null ? void 0 : t.parentElement) || null;
  t._mjrSimplePlayerMounted = !0;
  const o = re(e) || At, s = He(t), i = De(n, t), r = ve(n, t), l = Ue(n), u = document.createElement("div");
  u.className = "mjr-mfv-simple-player", u.tabIndex = 0, u.setAttribute("role", "group"), u.setAttribute("aria-label", "Media player"), r && u.classList.add("is-audio"), l && u.classList.add("is-animated-image");
  const a = document.createElement("div");
  a.className = "mjr-mfv-simple-player-controls";
  const d = document.createElement("input");
  d.type = "range", d.className = "mjr-mfv-simple-player-seek", d.min = "0", d.max = "1000", d.step = "1", d.value = "0", d.setAttribute("aria-label", "Seek"), s || (d.disabled = !0, d.classList.add("is-disabled"));
  const c = document.createElement("div");
  c.className = "mjr-mfv-simple-player-row";
  const f = document.createElement("button");
  f.type = "button", f.className = "mjr-icon-btn mjr-mfv-simple-player-btn", f.setAttribute("aria-label", "Play/Pause");
  const h = document.createElement("i");
  h.className = "pi pi-pause", h.setAttribute("aria-hidden", "true"), f.appendChild(h);
  const m = document.createElement("button");
  m.type = "button", m.className = "mjr-icon-btn mjr-mfv-simple-player-btn", m.setAttribute("aria-label", "Step back");
  const p = document.createElement("i");
  p.className = "pi pi-step-backward", p.setAttribute("aria-hidden", "true"), m.appendChild(p);
  const g = document.createElement("button");
  g.type = "button", g.className = "mjr-icon-btn mjr-mfv-simple-player-btn", g.setAttribute("aria-label", "Step forward");
  const b = document.createElement("i");
  b.className = "pi pi-step-forward", b.setAttribute("aria-hidden", "true"), g.appendChild(b);
  const C = document.createElement("div");
  C.className = "mjr-mfv-simple-player-time", C.textContent = "0:00 / 0:00";
  const _ = document.createElement("div");
  _.className = "mjr-mfv-simple-player-frame", _.textContent = "F: 0", i || (_.style.display = "none");
  const y = document.createElement("button");
  y.type = "button", y.className = "mjr-icon-btn mjr-mfv-simple-player-btn", y.setAttribute("aria-label", "Mute/Unmute");
  const S = document.createElement("i");
  if (S.className = "pi pi-volume-up", S.setAttribute("aria-hidden", "true"), y.appendChild(S), i || (m.disabled = !0, g.disabled = !0, m.classList.add("is-disabled"), g.classList.add("is-disabled")), c.appendChild(m), c.appendChild(f), c.appendChild(g), c.appendChild(C), c.appendChild(_), c.appendChild(y), a.appendChild(d), a.appendChild(c), u.appendChild(t), r) {
    const E = document.createElement("div");
    E.className = "mjr-mfv-simple-player-audio-backdrop", E.textContent = String((e == null ? void 0 : e.filename) || "Audio"), u.appendChild(E);
  }
  u.appendChild(a);
  try {
    t instanceof HTMLMediaElement && (t.controls = !1, t.playsInline = !0, t.loop = !0, t.muted = !0, t.autoplay = !0);
  } catch (E) {
    (dt = console.debug) == null || dt.call(console, E);
  }
  const x = l ? String((t == null ? void 0 : t.src) || "") : "";
  let B = !1, F = "";
  const P = () => {
    if (s) {
      h.className = t.paused ? "pi pi-play" : "pi pi-pause";
      return;
    }
    if (l) {
      h.className = B ? "pi pi-play" : "pi pi-pause";
      return;
    }
    h.className = "pi pi-play";
  }, L = () => {
    if (t instanceof HTMLMediaElement) {
      S.className = t.muted ? "pi pi-volume-off" : "pi pi-volume-up";
      return;
    }
    S.className = "pi pi-volume-off", y.disabled = !0, y.classList.add("is-disabled");
  }, I = () => {
    if (!i || !(t instanceof HTMLVideoElement)) return;
    const E = Zt(t, o), j = ue(t, o);
    _.textContent = j > 0 ? `F: ${E}/${j}` : `F: ${E}`;
  }, V = () => {
    const E = Math.max(0, Math.min(100, Number(d.value) / 1e3 * 100));
    d.style.setProperty("--mjr-seek-pct", `${E}%`);
  }, U = () => {
    if (!s) {
      C.textContent = l ? "Animated" : "Preview", d.value = "0", V();
      return;
    }
    const E = Number(t.currentTime || 0), j = Number(t.duration || 0);
    if (Number.isFinite(j) && j > 0) {
      const R = Math.max(0, Math.min(1, E / j));
      d.value = String(Math.round(R * 1e3)), C.textContent = `${Nt(E)} / ${Nt(j)}`;
    } else
      d.value = "0", C.textContent = `${Nt(E)} / 0:00`;
    V();
  }, q = (E) => {
    var j;
    try {
      (j = E == null ? void 0 : E.stopPropagation) == null || j.call(E);
    } catch {
    }
  }, tt = (E) => {
    var j, R;
    q(E);
    try {
      if (s)
        t.paused ? Xt(t) : (j = t.pause) == null || j.call(t);
      else if (l)
        if (!B)
          F || (F = ze(t)), F && (t.src = F), B = !0;
        else {
          const O = x ? `${x}${x.includes("?") ? "&" : "?"}mjr_anim=${Date.now()}` : t.src;
          t.src = O, B = !1;
        }
    } catch (O) {
      (R = console.debug) == null || R.call(console, O);
    }
    P();
  }, K = (E, j) => {
    var O, z;
    if (q(j), !i || !(t instanceof HTMLVideoElement)) return;
    try {
      (O = t.pause) == null || O.call(t);
    } catch (w) {
      (z = console.debug) == null || z.call(console, w);
    }
    const R = Zt(t, o);
    Oe(t, R + E, o), P(), I(), U();
  }, J = (E) => {
    var j;
    if (q(E), t instanceof HTMLMediaElement) {
      try {
        t.muted = !t.muted;
      } catch (R) {
        (j = console.debug) == null || j.call(console, R);
      }
      L();
    }
  }, at = (E) => {
    var O;
    if (q(E), !s) return;
    V();
    const j = Number(t.duration || 0);
    if (!Number.isFinite(j) || j <= 0) return;
    const R = Math.max(0, Math.min(1, Number(d.value) / 1e3));
    try {
      t.currentTime = j * R;
    } catch (z) {
      (O = console.debug) == null || O.call(console, z);
    }
    I(), U();
  }, rt = (E) => q(E), lt = (E) => {
    var j, R, O, z;
    try {
      if ((R = (j = E == null ? void 0 : E.target) == null ? void 0 : j.closest) != null && R.call(j, "button, input, textarea, select")) return;
      (O = u.focus) == null || O.call(u, { preventScroll: !0 });
    } catch (w) {
      (z = console.debug) == null || z.call(console, w);
    }
  }, ct = (E) => {
    var R, O, z;
    const j = String((E == null ? void 0 : E.key) || "");
    if (!(!j || E != null && E.altKey || E != null && E.ctrlKey || E != null && E.metaKey)) {
      if (j === " " || j === "Spacebar") {
        (R = E.preventDefault) == null || R.call(E), tt(E);
        return;
      }
      if (j === "ArrowLeft") {
        if (!i) return;
        (O = E.preventDefault) == null || O.call(E), K(-1, E);
        return;
      }
      if (j === "ArrowRight") {
        if (!i) return;
        (z = E.preventDefault) == null || z.call(E), K(1, E);
      }
    }
  };
  return f.addEventListener("click", tt), m.addEventListener("click", (E) => K(-1, E)), g.addEventListener("click", (E) => K(1, E)), y.addEventListener("click", J), d.addEventListener("input", at), a.addEventListener("pointerdown", rt), a.addEventListener("click", rt), a.addEventListener("dblclick", rt), u.addEventListener("pointerdown", lt), u.addEventListener("keydown", ct), t instanceof HTMLMediaElement && (t.addEventListener("play", P, { passive: !0 }), t.addEventListener("pause", P, { passive: !0 }), t.addEventListener(
    "timeupdate",
    () => {
      I(), U();
    },
    { passive: !0 }
  ), t.addEventListener(
    "seeked",
    () => {
      I(), U();
    },
    { passive: !0 }
  ), t.addEventListener(
    "loadedmetadata",
    () => {
      I(), U();
    },
    { passive: !0 }
  )), Xt(t), P(), L(), I(), U(), u;
}
const Ye = /* @__PURE__ */ new Set([".mp4", ".webm", ".mov", ".avi", ".mkv"]), Qe = /* @__PURE__ */ new Set([".mp3", ".wav", ".flac", ".ogg", ".m4a", ".aac", ".opus", ".wma"]);
function pe(t) {
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
  const n = pe((t == null ? void 0 : t.filename) || "");
  return n === ".gif" ? "gif" : Ye.has(n) ? "video" : Qe.has(n) ? "audio" : Ce.has(n) ? "model3d" : "image";
}
function me(t) {
  return t ? t.url ? String(t.url) : t.filename && t.id == null ? Se(t.filename, t.subfolder || "", t.type || "output") : t.filename && Ee(t) || "" : "";
}
function Q(t = "No media — select assets in the grid") {
  const e = document.createElement("div");
  return e.className = "mjr-mfv-empty", e.textContent = t, e;
}
function et(t, e) {
  const n = document.createElement("div");
  return n.className = `mjr-mfv-label label-${e}`, n.textContent = t, n;
}
function Kt(t) {
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
function qe(t, e) {
  var o, s;
  let n = t && t.nodeType === 1 ? t : (t == null ? void 0 : t.parentElement) || null;
  for (; n && n !== e; ) {
    try {
      const i = (o = window.getComputedStyle) == null ? void 0 : o.call(window, n), r = /(auto|scroll|overlay)/.test(String((i == null ? void 0 : i.overflowY) || "")), l = /(auto|scroll|overlay)/.test(String((i == null ? void 0 : i.overflowX) || ""));
      if (r || l)
        return n;
    } catch (i) {
      (s = console.debug) == null || s.call(console, i);
    }
    n = n.parentElement || null;
  }
  return null;
}
function Xe(t, e, n) {
  if (!t) return !1;
  if (Math.abs(Number(n) || 0) >= Math.abs(Number(e) || 0)) {
    const i = Number(t.scrollTop || 0), r = Math.max(0, Number(t.scrollHeight || 0) - Number(t.clientHeight || 0));
    if (n < 0 && i > 0 || n > 0 && i < r) return !0;
  }
  const o = Number(t.scrollLeft || 0), s = Math.max(0, Number(t.scrollWidth || 0) - Number(t.clientWidth || 0));
  return e < 0 && o > 0 || e > 0 && o < s;
}
function Ze(t) {
  var e, n, o, s;
  if (t)
    try {
      const i = (e = t.querySelectorAll) == null ? void 0 : e.call(t, "video, audio");
      if (!i || !i.length) return;
      for (const r of i)
        try {
          (n = r.pause) == null || n.call(r);
        } catch (l) {
          (o = console.debug) == null || o.call(console, l);
        }
    } catch (i) {
      (s = console.debug) == null || s.call(console, i);
    }
}
function nt(t, { fill: e = !1 } = {}) {
  var a, d;
  const n = me(t);
  if (!n) return null;
  const o = X(t), s = `mjr-mfv-media mjr-mfv-media--fit-height${e ? " mjr-mfv-media--fill" : ""}`, r = pe((t == null ? void 0 : t.filename) || "") === ".webp" && Number((t == null ? void 0 : t.duration) ?? ((a = t == null ? void 0 : t.metadata_raw) == null ? void 0 : a.duration) ?? 0) > 0, l = (c, f) => {
    var p;
    const h = document.createElement("div");
    h.className = `mjr-mfv-player-host${e ? " mjr-mfv-player-host--fill" : ""}`, h.appendChild(c);
    const m = Me(c, {
      variant: "viewer",
      hostEl: h,
      mediaKind: f,
      initialFps: re(t) || void 0,
      initialFrameCount: Be(t) || void 0
    });
    try {
      m && (h._mjrMediaControlsHandle = m);
    } catch (g) {
      (p = console.debug) == null || p.call(console, g);
    }
    return h;
  };
  if (o === "audio") {
    const c = document.createElement("audio");
    c.className = s, c.src = n, c.controls = !1, c.autoplay = !0, c.preload = "metadata", c.loop = !0, c.muted = !0;
    try {
      c.addEventListener("loadedmetadata", () => Kt(c), { once: !0 });
    } catch (f) {
      (d = console.debug) == null || d.call(console, f);
    }
    return Kt(c), l(c, "audio");
  }
  if (o === "video") {
    const c = document.createElement("video");
    return c.className = s, c.src = n, c.controls = !1, c.loop = !0, c.muted = !0, c.autoplay = !0, c.playsInline = !0, l(c, "video");
  }
  if (o === "model3d")
    return Ae(t, n, {
      hostClassName: `mjr-model3d-host mjr-mfv-model3d-host${e ? " mjr-mfv-model3d-host--fill" : ""}`,
      canvasClassName: `mjr-mfv-media mjr-model3d-render-canvas${e ? " mjr-mfv-media--fill" : ""}`,
      hintText: "Rotate: left drag  Pan: right drag  Zoom: wheel or middle drag",
      disableViewerTransform: !0,
      pauseDuringExecution: !!pt.FLOATING_VIEWER_PAUSE_DURING_EXECUTION
    });
  const u = document.createElement("img");
  return u.className = s, u.src = n, u.alt = String((t == null ? void 0 : t.filename) || ""), u.draggable = !1, (o === "gif" || r) && We(u, t, {
    kind: o === "gif" ? "gif" : "animated-image"
  }) || u;
}
function he(t, e, n, o, s, i) {
  t.beginPath(), typeof t.roundRect == "function" ? t.roundRect(e, n, o, s, i) : (t.moveTo(e + i, n), t.lineTo(e + o - i, n), t.quadraticCurveTo(e + o, n, e + o, n + i), t.lineTo(e + o, n + s - i), t.quadraticCurveTo(e + o, n + s, e + o - i, n + s), t.lineTo(e + i, n + s), t.quadraticCurveTo(e, n + s, e, n + s - i), t.lineTo(e, n + i), t.quadraticCurveTo(e, n, e + i, n), t.closePath());
}
function ut(t, e, n, o) {
  t.save(), t.font = "bold 10px system-ui, sans-serif";
  const s = 5, i = t.measureText(e).width;
  t.fillStyle = "rgba(0,0,0,0.58)", he(t, n, o, i + s * 2, 18, 4), t.fill(), t.fillStyle = "#fff", t.fillText(e, n + s, o + 13), t.restore();
}
function Ke(t, e, n = null) {
  switch (String((t == null ? void 0 : t.type) || "").toLowerCase()) {
    case "number":
    case "int":
    case "float":
      return we(t, e, n);
    case "combo":
      return $e(t, e, n);
    case "text":
    case "string":
    case "customtext":
      return tn(t, e, n);
    case "toggle":
    case "boolean":
      return en(t, e, n);
    default:
      return nn(t);
  }
}
function it(t, e, n = null) {
  var s, i, r, l, u, a, d, c, f, h;
  if (!t) return !1;
  const o = String(t.type || "").toLowerCase();
  if (o === "number" || o === "int" || o === "float") {
    const m = Number(e);
    if (Number.isNaN(m)) return !1;
    const p = t.options ?? {}, g = p.min ?? -1 / 0, b = p.max ?? 1 / 0;
    let C = Math.min(b, Math.max(g, m));
    (o === "int" || p.precision === 0 || p.round === 1) && (C = Math.round(C)), t.value = C;
  } else o === "toggle" || o === "boolean" ? t.value = !!e : t.value = e;
  try {
    const m = Z(), p = (m == null ? void 0 : m.canvas) ?? null, g = n ?? (t == null ? void 0 : t.parent) ?? null, b = t.value;
    (s = t.callback) == null || s.call(t, t.value, p, g, null, t), (o === "number" || o === "int" || o === "float") && (t.value = b), Je(t), (i = p == null ? void 0 : p.setDirty) == null || i.call(p, !0, !0), (r = p == null ? void 0 : p.draw) == null || r.call(p, !0, !0);
    const C = (g == null ? void 0 : g.graph) ?? null;
    C && C !== (m == null ? void 0 : m.graph) && ((l = C.setDirtyCanvas) == null || l.call(C, !0, !0), (u = C.change) == null || u.call(C)), (d = (a = m == null ? void 0 : m.graph) == null ? void 0 : a.setDirtyCanvas) == null || d.call(a, !0, !0), (f = (c = m == null ? void 0 : m.graph) == null ? void 0 : c.change) == null || f.call(c);
  } catch (m) {
    (h = console.debug) == null || h.call(console, "[MFV] writeWidgetValue", m);
  }
  return !0;
}
function Je(t) {
  var o, s, i, r, l, u;
  const e = String(t.value ?? ""), n = (t == null ? void 0 : t.inputEl) ?? (t == null ? void 0 : t.element) ?? (t == null ? void 0 : t.el) ?? ((s = (o = t == null ? void 0 : t.cachedDeepestByFrame) == null ? void 0 : o.widget) == null ? void 0 : s.inputEl) ?? ((r = (i = t == null ? void 0 : t.cachedDeepestByFrame) == null ? void 0 : i.widget) == null ? void 0 : r.element) ?? ((u = (l = t == null ? void 0 : t.cachedDeepestByFrame) == null ? void 0 : l.widget) == null ? void 0 : u.el) ?? null;
  n != null && "value" in n && n.value !== e && (n.value = e);
}
function we(t, e, n) {
  const o = document.createElement("input");
  o.type = "number", o.className = "mjr-ws-input", o.value = t.value ?? "";
  const s = t.options ?? {}, r = String((t == null ? void 0 : t.type) || "").toLowerCase() === "int" || s.precision === 0 || s.round === 1;
  if (s.min != null && (o.min = String(s.min)), s.max != null && (o.max = String(s.max)), r)
    o.step = "1";
  else {
    const l = s.precision;
    o.step = l != null ? String(Math.pow(10, -l)) : "any";
  }
  return o.addEventListener("input", () => {
    const l = o.value;
    l === "" || l === "-" || l === "." || l.endsWith(".") || (it(t, l, n), e == null || e(t.value));
  }), o.addEventListener("change", () => {
    it(t, o.value, n) && (o.value = String(t.value), e == null || e(t.value));
  }), o;
}
function $e(t, e, n) {
  var i;
  const o = document.createElement("select");
  o.className = "mjr-ws-input";
  let s = ((i = t.options) == null ? void 0 : i.values) ?? [];
  if (typeof s == "function")
    try {
      s = s() ?? [];
    } catch {
      s = [];
    }
  Array.isArray(s) || (s = []);
  for (const r of s) {
    const l = document.createElement("option"), u = typeof r == "string" ? r : (r == null ? void 0 : r.content) ?? (r == null ? void 0 : r.value) ?? (r == null ? void 0 : r.text) ?? String(r);
    l.value = u, l.textContent = u, u === String(t.value) && (l.selected = !0), o.appendChild(l);
  }
  return o.addEventListener("change", () => {
    it(t, o.value, n) && (e == null || e(t.value));
  }), o;
}
function tn(t, e, n) {
  const o = document.createElement("div");
  o.className = "mjr-ws-text-wrapper";
  const s = document.createElement("textarea");
  s.className = "mjr-ws-input mjr-ws-textarea", s.value = t.value ?? "", s.rows = 2;
  const i = () => {
    s.style.height = "auto", s.style.height = s.scrollHeight + "px";
  };
  return s.addEventListener("change", () => {
    it(t, s.value, n) && (e == null || e(t.value));
  }), s.addEventListener("input", () => {
    it(t, s.value, n), e == null || e(t.value), i();
  }), o.appendChild(s), o._mjrAutoFit = i, s._mjrAutoFit = i, requestAnimationFrame(i), o;
}
function en(t, e, n) {
  const o = document.createElement("label");
  o.className = "mjr-ws-toggle-label";
  const s = document.createElement("input");
  return s.type = "checkbox", s.className = "mjr-ws-checkbox", s.checked = !!t.value, s.addEventListener("change", () => {
    it(t, s.checked, n) && (e == null || e(t.value));
  }), o.appendChild(s), o;
}
function nn(t) {
  const e = document.createElement("input");
  return e.type = "text", e.className = "mjr-ws-input mjr-ws-readonly", e.value = t.value != null ? String(t.value) : "", e.readOnly = !0, e.tabIndex = -1, e;
}
const on = /* @__PURE__ */ new Set(["imageupload", "button", "hidden"]), sn = /\bnote\b|markdown/i;
function an(t) {
  return sn.test(String((t == null ? void 0 : t.type) || ""));
}
function Jt(t) {
  var o;
  const e = (t == null ? void 0 : t.properties) ?? {};
  if (typeof e.text == "string") return e.text;
  if (typeof e.value == "string") return e.value;
  if (typeof e.markdown == "string") return e.markdown;
  const n = (o = t == null ? void 0 : t.widgets) == null ? void 0 : o[0];
  return n != null && n.value != null ? String(n.value) : "";
}
function rn(t, e) {
  var s;
  const n = t == null ? void 0 : t.properties;
  n && ("text" in n ? n.text = e : "value" in n ? n.value = e : "markdown" in n ? n.markdown = e : n.text = e);
  const o = (s = t == null ? void 0 : t.widgets) == null ? void 0 : s[0];
  o && (o.value = e);
}
const ln = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, cn = /^[0-9a-f]{20,}$/i;
function dn(t) {
  const e = String((t == null ? void 0 : t.type) || "");
  return ln.test(e) || cn.test(e) ? String((t == null ? void 0 : t.title) || "Subgraph").trim() || "Subgraph" : e || `Node #${t == null ? void 0 : t.id}`;
}
class un {
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
    this._node = e, this._onLocate = n.onLocate ?? null, this._onToggle = typeof n.onToggle == "function" ? n.onToggle : null, this._collapsible = !!n.collapsible, this._expanded = n.expanded !== !1, this._depth = n.depth ?? 0, this._el = null, this._body = null, this._toggleBtn = null, this._inputMap = /* @__PURE__ */ new Map(), this._autoFits = [], this._noteTextarea = null;
  }
  get el() {
    return this._el || (this._el = this._render()), this._el;
  }
  syncFromGraph() {
    var o, s, i, r, l, u, a;
    if (this._noteTextarea) {
      const d = ((o = this._el) == null ? void 0 : o.ownerDocument) || document;
      if ((d == null ? void 0 : d.activeElement) !== this._noteTextarea) {
        const c = Jt(this._node);
        this._noteTextarea.value !== c && (this._noteTextarea.value = c, (i = (s = this._noteTextarea)._mjrAutoFit) == null || i.call(s));
      }
      return;
    }
    if (!((r = this._node) != null && r.widgets)) return;
    const e = ((l = this._el) == null ? void 0 : l.ownerDocument) || document, n = (e == null ? void 0 : e.activeElement) || null;
    for (const d of this._node.widgets) {
      const c = this._inputMap.get(d.name), f = pn(c);
      if (!f) continue;
      if (f.type === "checkbox") {
        const m = !!d.value;
        f.checked !== m && (f.checked = m);
        continue;
      }
      const h = d.value != null ? String(d.value) : "";
      String(f.value ?? "") !== h && (n && f === n || (f.value = h, (u = c == null ? void 0 : c._mjrAutoFit) == null || u.call(c), (a = f == null ? void 0 : f._mjrAutoFit) == null || a.call(f)));
    }
  }
  dispose() {
    var e;
    (e = this._el) == null || e.remove(), this._el = null, this._autoFits = [], this._inputMap.clear();
  }
  setExpanded(e) {
    var n, o;
    this._expanded = !!e, this._applyExpandedState(), this._expanded && ((n = this._autoFits) != null && n.length) && requestAnimationFrame(() => {
      for (const s of this._autoFits) s();
    }), (o = this._onToggle) == null || o.call(this, this._expanded);
  }
  _render() {
    var c, f, h;
    const e = this._node, n = document.createElement("section");
    n.className = "mjr-ws-node", n.dataset.nodeId = String(e.id ?? ""), this._depth > 0 && (n.dataset.depth = String(this._depth), n.classList.add("mjr-ws-node--nested"));
    const o = document.createElement("div");
    if (o.className = "mjr-ws-node-header", this._collapsible) {
      this._header = o;
      const m = document.createElement("button");
      m.type = "button", m.className = "mjr-icon-btn mjr-ws-node-toggle", m.title = this._expanded ? "Collapse node" : "Expand node", m.addEventListener("click", (p) => {
        p.stopPropagation(), this.setExpanded(!this._expanded);
      }), o.appendChild(m), this._toggleBtn = m, o.addEventListener("click", (p) => {
        p.target.closest("button") || this.setExpanded(!this._expanded);
      }), o.title = this._expanded ? "Collapse node" : "Expand node";
    }
    const s = document.createElement("div");
    s.className = "mjr-ws-node-title-wrap";
    const i = document.createElement("span");
    i.className = "mjr-ws-node-type", i.textContent = dn(e), s.appendChild(i);
    const r = String(e.title || "").trim();
    if (r && r !== e.type) {
      const m = document.createElement("span");
      m.className = "mjr-ws-node-title", m.textContent = r, s.appendChild(m);
    }
    o.appendChild(s);
    const l = document.createElement("button");
    l.type = "button", l.className = "mjr-icon-btn mjr-ws-locate", l.title = "Locate on canvas", l.innerHTML = '<i class="pi pi-map-marker" aria-hidden="true"></i>', l.addEventListener("click", (m) => {
      m.stopPropagation(), this._locateNode();
    }), o.appendChild(l), n.appendChild(o);
    const u = document.createElement("div");
    if (u.className = "mjr-ws-node-body", an(e)) {
      const m = document.createElement("textarea");
      m.className = "mjr-ws-input mjr-ws-textarea mjr-ws-note-textarea", m.value = Jt(e), m.rows = 4;
      const p = () => {
        m.style.height = "auto", m.style.height = m.scrollHeight + "px";
      };
      return m.addEventListener("input", () => {
        var C, _, y, S, x, B, F;
        rn(e, m.value);
        const g = (C = e == null ? void 0 : e.widgets) == null ? void 0 : C[0], b = (g == null ? void 0 : g.inputEl) ?? (g == null ? void 0 : g.element) ?? (g == null ? void 0 : g.el) ?? null;
        b != null && "value" in b && b.value !== m.value && (b.value = m.value), p();
        try {
          const P = Z(), L = (P == null ? void 0 : P.canvas) ?? null;
          (_ = L == null ? void 0 : L.setDirty) == null || _.call(L, !0, !0), (y = L == null ? void 0 : L.draw) == null || y.call(L, !0, !0);
          const I = (e == null ? void 0 : e.graph) ?? null;
          I && I !== (P == null ? void 0 : P.graph) && ((S = I.setDirtyCanvas) == null || S.call(I, !0, !0), (x = I.change) == null || x.call(I)), (F = (B = P == null ? void 0 : P.graph) == null ? void 0 : B.change) == null || F.call(B);
        } catch {
        }
      }), m._mjrAutoFit = p, this._noteTextarea = m, this._autoFits.push(p), u.appendChild(m), this._body = u, n.appendChild(u), this._el = n, this._applyExpandedState(), requestAnimationFrame(p), n;
    }
    const a = e.widgets ?? [];
    let d = !1;
    for (const m of a) {
      const p = String(m.type || "").toLowerCase();
      if (on.has(p) || m.hidden || (c = m.options) != null && c.hidden) continue;
      d = !0;
      const g = p === "text" || p === "string" || p === "customtext", b = document.createElement("div");
      b.className = g ? "mjr-ws-widget-row mjr-ws-widget-row--block" : "mjr-ws-widget-row";
      const C = document.createElement("label");
      C.className = "mjr-ws-widget-label", C.textContent = m.name || "";
      const _ = document.createElement("div");
      _.className = "mjr-ws-widget-input";
      const y = Ke(m, () => {
      }, e);
      _.appendChild(y), this._inputMap.set(m.name, y);
      const S = y._mjrAutoFit ?? ((h = (f = y.querySelector) == null ? void 0 : f.call(y, "textarea")) == null ? void 0 : h._mjrAutoFit);
      S && this._autoFits.push(S), b.appendChild(C), b.appendChild(_), u.appendChild(b);
    }
    if (!d) {
      const m = document.createElement("div");
      m.className = "mjr-ws-node-empty", m.textContent = "No editable parameters", u.appendChild(m);
    }
    return this._body = u, n.appendChild(u), this._el = n, this._applyExpandedState(), n;
  }
  _applyExpandedState() {
    if (!(!this._el || !this._body)) {
      if (this._el.classList.toggle("is-collapsible", this._collapsible), this._el.classList.toggle("is-collapsed", this._collapsible && !this._expanded), this._toggleBtn) {
        const e = this._expanded ? "pi pi-chevron-down" : "pi pi-chevron-right";
        this._toggleBtn.innerHTML = `<i class="${e}" aria-hidden="true"></i>`, this._toggleBtn.title = this._expanded ? "Collapse node" : "Expand node", this._toggleBtn.setAttribute("aria-expanded", String(this._expanded));
      }
      this._header && (this._header.title = this._expanded ? "Collapse node" : "Expand node");
    }
  }
  _locateNode() {
    var n, o, s, i, r, l, u, a;
    if (this._onLocate) {
      this._onLocate();
      return;
    }
    const e = this._node;
    if (e)
      try {
        const d = Z(), c = d == null ? void 0 : d.canvas;
        if (!c) return;
        if (typeof c.centerOnNode == "function")
          c.centerOnNode(e);
        else if (c.ds && e.pos) {
          const f = ((n = c.canvas) == null ? void 0 : n.width) || ((o = c.element) == null ? void 0 : o.width) || 800, h = ((s = c.canvas) == null ? void 0 : s.height) || ((i = c.element) == null ? void 0 : i.height) || 600;
          c.ds.offset[0] = -e.pos[0] - (((r = e.size) == null ? void 0 : r[0]) || 0) / 2 + f / 2, c.ds.offset[1] = -e.pos[1] - (((l = e.size) == null ? void 0 : l[1]) || 0) / 2 + h / 2, (u = c.setDirty) == null || u.call(c, !0, !0);
        }
      } catch (d) {
        (a = console.debug) == null || a.call(console, "[MFV sidebar] locateNode error", d);
      }
  }
}
function pn(t) {
  var e, n, o;
  return t ? (n = (e = t.classList) == null ? void 0 : e.contains) != null && n.call(e, "mjr-ws-text-wrapper") ? ((o = t.querySelector) == null ? void 0 : o.call(t, "textarea")) ?? t : t : null;
}
class mn {
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
    for (const o of this._renderers) o.dispose();
    this._renderers = [], (n = (e = this._el) == null ? void 0 : e.remove) == null || n.call(e);
  }
  _build() {
    const e = document.createElement("div");
    e.className = "mjr-ws-nodes-tab";
    const n = document.createElement("div");
    n.className = "mjr-ws-search-wrap";
    const o = document.createElement("i");
    o.className = "pi pi-search mjr-ws-search-icon", o.setAttribute("aria-hidden", "true"), n.appendChild(o), this._searchInput = document.createElement("input"), this._searchInput.type = "text", this._searchInput.className = "mjr-ws-search", this._searchInput.placeholder = "Search nodes...", this._searchInput.addEventListener("input", () => {
      this._searchQuery = this._searchInput.value, this.forceRebuild();
    }), n.appendChild(this._searchInput);
    const s = document.createElement("button");
    return s.type = "button", s.className = "mjr-ws-search-clear", s.title = "Clear search", s.innerHTML = '<i class="pi pi-times" aria-hidden="true"></i>', s.addEventListener("click", () => {
      this._searchInput.value = "", this._searchQuery = "", this.forceRebuild();
    }), n.appendChild(s), e.appendChild(n), this._list = document.createElement("div"), this._list.className = "mjr-ws-nodes-list", e.appendChild(this._list), e;
  }
  _syncCanvasSelection() {
    var o;
    const n = bn()[0] || "";
    if (!(!n || n === this._lastSelectedId)) {
      this._lastSelectedId = n;
      for (const s of this._renderers)
        if (String(((o = s._node) == null ? void 0 : o.id) ?? "") === n && !s._expanded) {
          s.setExpanded(!0);
          break;
        }
    }
  }
  _maybeRebuildList() {
    const e = hn(), n = e ? fe(e) : [], o = (this._searchQuery || "").toLowerCase().trim(), s = o ? _e(n, o) : n, i = _n(s);
    if (this._syncCanvasSelection(), i !== this._lastNodeSig) {
      this._lastNodeSig = i;
      for (const r of this._renderers) r.dispose();
      if (this._renderers = [], this._list.innerHTML = "", !s.length) {
        const r = document.createElement("div");
        r.className = "mjr-ws-sidebar-empty", r.textContent = n.length ? "No nodes match your search" : "No nodes in workflow", this._list.appendChild(r);
        return;
      }
      this._renderItems(s, this._list, 0);
    }
  }
  /**
   * Recursively render tree items into a container.
   * @param {{node: object, children: object[]}[]} items
   * @param {HTMLElement} container
   * @param {number} depth
   */
  _renderItems(e, n, o) {
    for (const { node: s, children: i } of e) {
      const r = String((s == null ? void 0 : s.id) ?? ""), l = new un(s, {
        collapsible: !0,
        expanded: this._expandedNodeIds.has(r),
        depth: o,
        onLocate: () => gn(s),
        onToggle: (u) => {
          if (u) {
            this._expandedNodeIds = /* @__PURE__ */ new Set([r]);
            for (const a of this._renderers)
              a !== l && a.setExpanded(!1);
          } else
            this._expandedNodeIds.delete(r);
        }
      });
      if (this._renderers.push(l), n.appendChild(l.el), i.length > 0) {
        const u = this._expandedChildrenIds.has(r), a = document.createElement("button");
        a.type = "button", a.className = "mjr-ws-children-toggle", o > 0 && a.classList.add("mjr-ws-children-toggle--nested"), wt(a, i.length, u);
        const d = document.createElement("div");
        d.className = "mjr-ws-children", d.hidden = !u, this._renderItems(i, d, o + 1), a.addEventListener("click", () => {
          const c = d.hidden;
          d.hidden = !c, c ? this._expandedChildrenIds.add(r) : this._expandedChildrenIds.delete(r), wt(a, i.length, c);
        }), n.appendChild(a), n.appendChild(d);
      }
    }
  }
}
function hn() {
  var t;
  try {
    const e = Z();
    return (e == null ? void 0 : e.graph) ?? ((t = e == null ? void 0 : e.canvas) == null ? void 0 : t.graph) ?? null;
  } catch {
    return null;
  }
}
function fn(t) {
  var n, o, s, i, r;
  const e = [
    t == null ? void 0 : t.subgraph,
    t == null ? void 0 : t._subgraph,
    (n = t == null ? void 0 : t.subgraph) == null ? void 0 : n.graph,
    (o = t == null ? void 0 : t.subgraph) == null ? void 0 : o.lgraph,
    (s = t == null ? void 0 : t.properties) == null ? void 0 : s.subgraph,
    t == null ? void 0 : t.subgraph_instance,
    (i = t == null ? void 0 : t.subgraph_instance) == null ? void 0 : i.graph,
    t == null ? void 0 : t.inner_graph,
    t == null ? void 0 : t.subgraph_graph
  ].filter((l) => l && typeof l == "object" && Array.isArray(l.nodes));
  return Array.isArray(t == null ? void 0 : t.nodes) && t.nodes.length > 0 && t.nodes !== ((r = t == null ? void 0 : t.graph) == null ? void 0 : r.nodes) && e.push({ nodes: t.nodes }), e;
}
function fe(t, e = /* @__PURE__ */ new Set()) {
  if (!t || e.has(t)) return [];
  e.add(t);
  const n = Array.isArray(t.nodes) ? t.nodes : [], o = [];
  for (const s of n) {
    if (!s) continue;
    const r = fn(s).flatMap((l) => fe(l, e));
    o.push({ node: s, children: r });
  }
  return o;
}
function _e(t, e) {
  const n = [];
  for (const { node: o, children: s } of t) {
    const i = (o.type || "").toLowerCase().includes(e) || (o.title || "").toLowerCase().includes(e), r = _e(s, e);
    (i || r.length > 0) && n.push({ node: o, children: r });
  }
  return n;
}
function _n(t) {
  const e = [];
  function n(o) {
    for (const { node: s, children: i } of o)
      e.push(s.id), n(i);
  }
  return n(t), e.join(",");
}
function wt(t, e, n) {
  const o = n ? "pi-chevron-down" : "pi-chevron-right";
  t.innerHTML = `<i class="pi ${o}" aria-hidden="true"></i><span>${e} inner node${e !== 1 ? "s" : ""}</span>`, t.setAttribute("aria-expanded", String(n));
}
function gn(t) {
  var e, n, o, s, i, r, l;
  try {
    const u = Z(), a = u == null ? void 0 : u.canvas;
    if (!a) return;
    if ((e = a.selectNode) == null || e.call(a, t, !1), typeof a.centerOnNode == "function")
      a.centerOnNode(t);
    else if (t.pos && a.ds) {
      const d = a.canvas, c = (d == null ? void 0 : d.width) ?? 800, f = (d == null ? void 0 : d.height) ?? 600, h = a.ds.scale ?? 1;
      a.ds.offset = [
        -t.pos[0] + c / (2 * h) - (((n = t.size) == null ? void 0 : n[0]) ?? 100) / 2,
        -t.pos[1] + f / (2 * h) - (((o = t.size) == null ? void 0 : o[1]) ?? 80) / 2
      ], (s = a.setDirty) == null || s.call(a, !0, !0);
    }
    (r = (i = a.canvas) == null ? void 0 : i.focus) == null || r.call(i);
  } catch (u) {
    (l = console.debug) == null || l.call(console, "[MFV] _focusNode", u);
  }
}
function bn() {
  var t, e, n;
  try {
    const o = Z(), s = ((t = o == null ? void 0 : o.canvas) == null ? void 0 : t.selected_nodes) ?? ((e = o == null ? void 0 : o.canvas) == null ? void 0 : e.selectedNodes) ?? null;
    if (!s) return [];
    if (Array.isArray(s)) return s.map((i) => String((i == null ? void 0 : i.id) ?? "")).filter(Boolean);
    if (s instanceof Map)
      return Array.from(s.values()).map((i) => String((i == null ? void 0 : i.id) ?? "")).filter(Boolean);
    if (typeof s == "object")
      return Object.values(s).map((i) => String((i == null ? void 0 : i.id) ?? "")).filter(Boolean);
  } catch (o) {
    (n = console.debug) == null || n.call(console, "[MFV] _getSelectedNodeIds", o);
  }
  return [];
}
const yn = 16;
class Cn {
  constructor({ hostEl: e, onClose: n } = {}) {
    this._hostEl = e, this._onClose = n ?? null, this._visible = !1, this._liveSyncHandle = null, this._liveSyncMode = "", this._resizeCleanup = null, this._nodesTab = new mn(), this._el = this._build();
  }
  get el() {
    return this._el;
  }
  get isVisible() {
    return this._visible;
  }
  show() {
    this._visible = !0, this._el.classList.add("open"), this._nodesTab.refresh(), this._startLiveSync();
  }
  hide() {
    this._visible = !1, this._el.classList.remove("open"), this._stopLiveSync();
  }
  toggle() {
    var e;
    this._visible ? (this.hide(), (e = this._onClose) == null || e.call(this)) : this.show();
  }
  refresh() {
    this._visible && this._nodesTab.refresh();
  }
  syncFromGraph() {
    this._visible && this._nodesTab.refresh();
  }
  dispose() {
    var e, n, o;
    this._stopLiveSync(), this._disposeResize(), (n = (e = this._nodesTab) == null ? void 0 : e.dispose) == null || n.call(e), this._nodesTab = null, (o = this._el) == null || o.remove();
  }
  _build() {
    const e = document.createElement("div");
    e.className = "mjr-ws-sidebar";
    const n = document.createElement("div");
    n.className = "mjr-ws-sidebar-header";
    const o = document.createElement("span");
    o.className = "mjr-ws-sidebar-title", o.textContent = "Nodes", n.appendChild(o);
    const s = document.createElement("button");
    s.type = "button", s.className = "mjr-icon-btn", s.title = "Close sidebar", s.innerHTML = '<i class="pi pi-times" aria-hidden="true"></i>', s.addEventListener("click", () => {
      var r;
      this.hide(), (r = this._onClose) == null || r.call(this);
    }), n.appendChild(s), e.appendChild(n);
    const i = document.createElement("div");
    return i.className = "mjr-ws-sidebar-resizer", i.setAttribute("role", "separator"), i.setAttribute("aria-orientation", "vertical"), i.setAttribute("aria-hidden", "true"), e.appendChild(i), this._bindResize(i), this._body = this._nodesTab.el, this._body.classList.add("mjr-ws-sidebar-body"), e.appendChild(this._body), e;
  }
  _startLiveSync() {
    if (this._liveSyncHandle != null) return;
    const e = $t(this._el), n = () => {
      this._liveSyncHandle = null, this._liveSyncMode = "", this._visible && (this.syncFromGraph(), this._startLiveSync());
    };
    if (typeof e.requestAnimationFrame == "function") {
      this._liveSyncMode = "raf", this._liveSyncHandle = e.requestAnimationFrame(n);
      return;
    }
    this._liveSyncMode = "timeout", this._liveSyncHandle = e.setTimeout(n, yn);
  }
  _stopLiveSync() {
    var n;
    if (this._liveSyncHandle == null) return;
    const e = $t(this._el);
    try {
      this._liveSyncMode === "raf" && typeof e.cancelAnimationFrame == "function" ? e.cancelAnimationFrame(this._liveSyncHandle) : typeof e.clearTimeout == "function" && e.clearTimeout(this._liveSyncHandle);
    } catch (o) {
      (n = console.debug) == null || n.call(console, o);
    }
    this._liveSyncHandle = null, this._liveSyncMode = "";
  }
  _bindResize(e) {
    if (!e) return;
    const o = (e.ownerDocument || document).defaultView || window, s = 180, i = (r) => {
      var g;
      if (r.button !== 0 || !((g = this._el) != null && g.classList.contains("open"))) return;
      const l = this._el.parentElement;
      if (!l) return;
      const u = this._el.getBoundingClientRect(), a = l.getBoundingClientRect(), d = l.getAttribute("data-sidebar-pos") || "right", c = Math.max(
        s,
        Math.floor(a.width * (d === "bottom" ? 1 : 0.65))
      );
      if (d === "bottom") return;
      r.preventDefault(), r.stopPropagation(), e.classList.add("is-dragging"), this._el.classList.add("is-resizing");
      const f = r.clientX, h = u.width, m = (b) => {
        const C = b.clientX - f, _ = d === "left" ? h - C : h + C, y = Math.max(s, Math.min(c, _));
        this._el.style.width = `${Math.round(y)}px`;
      }, p = () => {
        e.classList.remove("is-dragging"), this._el.classList.remove("is-resizing"), o.removeEventListener("pointermove", m), o.removeEventListener("pointerup", p), o.removeEventListener("pointercancel", p);
      };
      o.addEventListener("pointermove", m), o.addEventListener("pointerup", p), o.addEventListener("pointercancel", p);
    };
    e.addEventListener("pointerdown", i), this._resizeCleanup = () => e.removeEventListener("pointerdown", i);
  }
  _disposeResize() {
    var e, n;
    try {
      (e = this._resizeCleanup) == null || e.call(this);
    } catch (o) {
      (n = console.debug) == null || n.call(console, o);
    }
    this._resizeCleanup = null;
  }
}
function $t(t) {
  var n;
  const e = ((n = t == null ? void 0 : t.ownerDocument) == null ? void 0 : n.defaultView) || null;
  return e || (typeof window < "u" ? window : globalThis);
}
const H = Object.freeze({
  IDLE: "idle",
  RUNNING: "running",
  STOPPING: "stopping",
  ERROR: "error"
}), An = /* @__PURE__ */ new Set(["default", "auto", "latent2rgb", "taesd", "none"]), te = "progress-update";
function Sn() {
  const t = document.createElement("div");
  t.className = "mjr-mfv-run-controls";
  const e = document.createElement("button");
  e.type = "button", e.className = "mjr-icon-btn mjr-mfv-run-btn";
  const n = v("tooltip.queuePrompt", "Queue Prompt (Run)");
  e.title = n, e.setAttribute("aria-label", n);
  const o = document.createElement("i");
  o.className = "pi pi-play", o.setAttribute("aria-hidden", "true"), e.appendChild(o);
  const s = document.createElement("button");
  s.type = "button", s.className = "mjr-icon-btn mjr-mfv-stop-btn";
  const i = document.createElement("i");
  i.className = "pi pi-stop", i.setAttribute("aria-hidden", "true"), s.appendChild(i), t.appendChild(e), t.appendChild(s);
  let r = H.IDLE, l = !1, u = !1, a = null;
  function d() {
    a != null && (clearTimeout(a), a = null);
  }
  function c(_, { canStop: y = !1 } = {}) {
    r = _, e.classList.toggle("running", r === H.RUNNING), e.classList.toggle("stopping", r === H.STOPPING), e.classList.toggle("error", r === H.ERROR), e.disabled = r === H.RUNNING || r === H.STOPPING, s.disabled = !y || r === H.STOPPING, s.classList.toggle("active", y && r !== H.STOPPING), s.classList.toggle("stopping", r === H.STOPPING), r === H.RUNNING || r === H.STOPPING ? o.className = "pi pi-spin pi-spinner" : o.className = "pi pi-play";
  }
  function f() {
    const _ = v("tooltip.queueStop", "Stop Generation");
    s.title = _, s.setAttribute("aria-label", _);
  }
  function h(_ = gt.getSnapshot(), { authoritative: y = !1 } = {}) {
    const S = Math.max(0, Number(_ == null ? void 0 : _.queue) || 0), x = (_ == null ? void 0 : _.prompt) || null, B = !!(x != null && x.currentlyExecuting), F = !!(x && (x.currentlyExecuting || x.errorDetails)), P = S > 0 || F, L = !!(x != null && x.errorDetails);
    y && S === 0 && !x && (l = !1, u = !1);
    const I = l || u || B || S > 0;
    if ((B || P || S > 0) && (l = !1), L) {
      u = !1, d(), c(H.ERROR, { canStop: !1 });
      return;
    }
    if (u) {
      if (!I) {
        u = !1, h(_);
        return;
      }
      c(H.STOPPING, { canStop: !1 });
      return;
    }
    if (l || B || P || S > 0) {
      d(), c(H.RUNNING, { canStop: !0 });
      return;
    }
    d(), c(H.IDLE, { canStop: !1 });
  }
  function m() {
    l = !1, u = !1, d(), c(H.ERROR, { canStop: !1 }), a = setTimeout(() => {
      a = null, h();
    }, 1500);
  }
  async function p() {
    const _ = Z(), S = (_ != null && _.api && typeof _.api.interrupt == "function" ? _.api : null) ?? le(_);
    if (S && typeof S.interrupt == "function")
      return await S.interrupt(), { tracked: !0 };
    if (S && typeof S.fetchApi == "function") {
      const B = await S.fetchApi("/interrupt", { method: "POST" });
      if (!(B != null && B.ok)) throw new Error(`POST /interrupt failed (${B == null ? void 0 : B.status})`);
      return { tracked: !0 };
    }
    const x = await fetch("/interrupt", { method: "POST", credentials: "include" });
    if (!x.ok) throw new Error(`POST /interrupt failed (${x.status})`);
    return { tracked: !1 };
  }
  async function g() {
    var _;
    if (!(r === H.RUNNING || r === H.STOPPING)) {
      l = !0, u = !1, h();
      try {
        const y = await Mn();
        y != null && y.tracked || (l = !1), h();
      } catch (y) {
        (_ = console.error) == null || _.call(console, "[MFV Run]", y), m();
      }
    }
  }
  async function b() {
    var _;
    if (r === H.RUNNING) {
      u = !0, h();
      try {
        const y = await p();
        y != null && y.tracked || (u = !1, l = !1), h();
      } catch (y) {
        (_ = console.error) == null || _.call(console, "[MFV Stop]", y), u = !1, h();
      } finally {
      }
    }
  }
  f(), s.disabled = !0, e.addEventListener("click", g), s.addEventListener("click", b);
  const C = (_) => {
    h((_ == null ? void 0 : _.detail) || gt.getSnapshot(), {
      authoritative: !0
    });
  };
  return gt.addEventListener(te, C), Ne({ timeoutMs: 4e3 }).catch((_) => {
    var y;
    (y = console.debug) == null || y.call(console, _);
  }), h(), {
    el: t,
    dispose() {
      d(), e.removeEventListener("click", g), s.removeEventListener("click", b), gt.removeEventListener(
        te,
        C
      );
    }
  };
}
function En(t = pt.MFV_PREVIEW_METHOD) {
  const e = String(t || "").trim().toLowerCase();
  return An.has(e) ? e : "taesd";
}
function ge(t, e = pt.MFV_PREVIEW_METHOD) {
  var s;
  const n = En(e), o = {
    ...(t == null ? void 0 : t.extra_data) || {},
    extra_pnginfo: {
      ...((s = t == null ? void 0 : t.extra_data) == null ? void 0 : s.extra_pnginfo) || {}
    }
  };
  return (t == null ? void 0 : t.workflow) != null && (o.extra_pnginfo.workflow = t.workflow), n !== "default" ? o.preview_method = n : delete o.preview_method, {
    ...t,
    extra_data: o
  };
}
function ee(t, { previewMethod: e = pt.MFV_PREVIEW_METHOD, clientId: n = null } = {}) {
  const o = ge(t, e), s = {
    prompt: o == null ? void 0 : o.output,
    extra_data: (o == null ? void 0 : o.extra_data) || {}
  }, i = String(n || "").trim();
  return i && (s.client_id = i), s;
}
function ne(t, e) {
  const n = [
    t == null ? void 0 : t.clientId,
    t == null ? void 0 : t.clientID,
    t == null ? void 0 : t.client_id,
    e == null ? void 0 : e.clientId,
    e == null ? void 0 : e.clientID,
    e == null ? void 0 : e.client_id
  ];
  for (const o of n) {
    const s = String(o || "").trim();
    if (s) return s;
  }
  return "";
}
function xt(t, e) {
  var n;
  for (const o of (t == null ? void 0 : t.nodes) ?? [])
    e(o), (n = o.subgraph) != null && n.nodes && xt(o.subgraph, e);
}
async function Mn() {
  var l, u;
  const t = Z();
  if (!t) throw new Error("ComfyUI app not available");
  const n = (t != null && t.api && typeof t.api.queuePrompt == "function" ? t.api : null) ?? le(t);
  if (!!!(n && typeof n.queuePrompt == "function" || n && typeof n.fetchApi == "function") && typeof t.queuePrompt == "function")
    return await t.queuePrompt(0), { tracked: !0 };
  const s = t.rootGraph ?? t.graph;
  xt(s, (a) => {
    var d;
    for (const c of a.widgets ?? [])
      (d = c.beforeQueued) == null || d.call(c, { isPartialExecution: !1 });
  });
  const i = typeof t.graphToPrompt == "function" ? await t.graphToPrompt() : null;
  if (!(i != null && i.output)) throw new Error("graphToPrompt returned empty output");
  let r;
  if (n && typeof n.queuePrompt == "function")
    await n.queuePrompt(0, ge(i)), r = { tracked: !0 };
  else if (n && typeof n.fetchApi == "function") {
    const a = await n.fetchApi("/prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        ee(i, {
          clientId: ne(n, t)
        })
      )
    });
    if (!(a != null && a.ok)) throw new Error(`POST /prompt failed (${a == null ? void 0 : a.status})`);
    r = { tracked: !0 };
  } else {
    const a = await fetch("/prompt", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        ee(i, {
          clientId: ne(null, t)
        })
      )
    });
    if (!a.ok) throw new Error(`POST /prompt failed (${a.status})`);
    r = { tracked: !1 };
  }
  return xt(s, (a) => {
    var d;
    for (const c of a.widgets ?? [])
      (d = c.afterQueued) == null || d.call(c, { isPartialExecution: !1 });
  }), (u = (l = t.canvas) == null ? void 0 : l.draw) == null || u.call(l, !0, !0), r;
}
const Bn = { rgb: "#e0e0e0", r: "#ff5555", g: "#44dd66", b: "#5599ff", a: "#ffffff", l: "#bbbbbb" }, Nn = { rgb: "RGB", r: "R", g: "G", b: "B", a: "A", l: "L" }, xn = { rgb: "500", r: "700", g: "700", b: "700", a: "700", l: "400" };
function Pn(t) {
  var n;
  const e = document.createElement("div");
  return e.className = "mjr-mfv", e.setAttribute("role", "dialog"), e.setAttribute("aria-modal", "false"), e.setAttribute("aria-hidden", "true"), t.element = e, e.appendChild(t._buildHeader()), e.setAttribute("aria-labelledby", t._titleId), e.appendChild(t._buildToolbar()), e.appendChild(xe(t)), t._contentWrapper = document.createElement("div"), t._contentWrapper.className = "mjr-mfv-content-wrapper", t._applySidebarPosition(), t._contentEl = document.createElement("div"), t._contentEl.className = "mjr-mfv-content", t._contentWrapper.appendChild(t._contentEl), t._overlayCanvas = document.createElement("canvas"), t._overlayCanvas.className = "mjr-mfv-overlay-canvas", t._contentEl.appendChild(t._overlayCanvas), t._contentEl.appendChild(Pe(t)), t._sidebar = new Cn({
    hostEl: e,
    onClose: () => t._updateSettingsBtnState(!1)
  }), t._contentWrapper.appendChild(t._sidebar.el), e.appendChild(t._contentWrapper), t._rebindControlHandlers(), t._bindPanelInteractions(), t._bindDocumentUiHandlers(), (n = t._bindLayoutObserver) == null || n.call(t), t._onSidebarPosChanged = (o) => {
    var s;
    ((s = o == null ? void 0 : o.detail) == null ? void 0 : s.key) === "viewer.mfvSidebarPosition" && t._applySidebarPosition();
  }, window.addEventListener("mjr-settings-changed", t._onSidebarPosChanged), t._refresh(), e;
}
function Ln(t) {
  const e = document.createElement("div");
  e.className = "mjr-mfv-header";
  const n = document.createElement("span");
  n.className = "mjr-mfv-header-title", n.id = t._titleId, n.textContent = "〽️ Majoor Floating Viewer";
  const o = document.createElement("button");
  t._closeBtn = o, o.type = "button", o.className = "mjr-icon-btn mjr-mfv-close-btn", yt(o, v("tooltip.closeViewer", "Close viewer"), Ve);
  const s = document.createElement("i");
  return s.className = "pi pi-times", s.setAttribute("aria-hidden", "true"), o.appendChild(s), e.appendChild(n), e.appendChild(o), e;
}
function Fn(t) {
  var It, Tt;
  const e = (M, { min: A, max: N, step: k, value: G } = {}) => {
    const Y = document.createElement("div");
    Y.className = "mjr-mfv-toolbar-range";
    const W = document.createElement("input");
    W.type = "range", W.min = String(A), W.max = String(N), W.step = String(k), W.value = String(G), W.title = M || "";
    const $ = document.createElement("span");
    return $.className = "mjr-mfv-toolbar-range-out", $.textContent = Number(G).toFixed(2), Y.appendChild(W), Y.appendChild($), { wrap: Y, input: W, out: $ };
  }, n = document.createElement("div");
  n.className = "mjr-mfv-toolbar", t._modeBtn = document.createElement("button"), t._modeBtn.type = "button", t._modeBtn.className = "mjr-icon-btn", t._updateModeBtnUI(), n.appendChild(t._modeBtn);
  const o = document.createElement("button");
  o.type = "button", o.className = "mjr-icon-btn mjr-mfv-pin-trigger", o.title = "Pin slots A/B/C/D", o.setAttribute("aria-haspopup", "dialog"), o.setAttribute("aria-expanded", "false"), o.innerHTML = '<i class="pi pi-map-marker" aria-hidden="true"></i>', n.appendChild(o);
  const s = document.createElement("div");
  s.className = "mjr-mfv-pin-popover", t.element.appendChild(s);
  const i = document.createElement("div");
  i.className = "mjr-menu", i.style.cssText = "display:grid;gap:4px;", i.setAttribute("role", "group"), i.setAttribute("aria-label", "Pin References"), s.appendChild(i), t._pinGroup = i, t._pinBtns = {};
  for (const M of ["A", "B", "C", "D"]) {
    const A = document.createElement("button");
    A.type = "button", A.className = "mjr-menu-item mjr-mfv-pin-btn", A.dataset.slot = M, A.title = `Pin Asset ${M}`, A.setAttribute("aria-pressed", "false");
    const N = document.createElement("span");
    N.className = "mjr-menu-item-label", N.textContent = `Asset ${M}`;
    const k = document.createElement("i");
    k.className = "pi pi-map-marker mjr-menu-item-check", k.style.opacity = "0", A.appendChild(N), A.appendChild(k), i.appendChild(A), t._pinBtns[M] = A;
  }
  t._updatePinUI(), t._pinBtn = o, t._pinPopover = s;
  const r = () => {
    const M = o.getBoundingClientRect(), A = t.element.getBoundingClientRect();
    s.style.left = `${M.left - A.left}px`, s.style.top = `${M.bottom - A.top + 4}px`, s.classList.add("is-open"), o.setAttribute("aria-expanded", "true");
  };
  t._closePinPopover = () => {
    s.classList.remove("is-open"), o.setAttribute("aria-expanded", "false");
  }, o.addEventListener("click", (M) => {
    var A;
    M.stopPropagation(), s.classList.contains("is-open") ? t._closePinPopover() : ((A = t._closeAllToolbarPopovers) == null || A.call(t), r());
  });
  const l = document.createElement("button");
  l.type = "button", l.className = "mjr-icon-btn mjr-mfv-guides-trigger", l.title = "Guides", l.setAttribute("aria-haspopup", "listbox"), l.setAttribute("aria-expanded", "false");
  const u = document.createElement("img");
  u.src = new URL("data:image/png;base64,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", import.meta.url).href, u.className = "mjr-mfv-guides-icon", u.alt = "", u.setAttribute("aria-hidden", "true"), l.appendChild(u), n.appendChild(l);
  const a = document.createElement("div");
  a.className = "mjr-mfv-guides-popover", t.element.appendChild(a);
  const d = document.createElement("div");
  d.className = "mjr-menu", d.style.cssText = "display:grid;gap:4px;", a.appendChild(d);
  const c = document.createElement("select");
  c.style.cssText = "position:absolute;opacity:0;pointer-events:none;width:0;height:0;overflow:hidden;", a.appendChild(c);
  const f = [
    { value: "0", label: "Off" },
    { value: "1", label: "Thirds" },
    { value: "2", label: "Center" },
    { value: "3", label: "Safe" }
  ], h = String(t._gridMode || 0), m = [];
  for (const M of f) {
    const A = document.createElement("option");
    A.value = M.value, c.appendChild(A);
    const N = document.createElement("button");
    N.type = "button", N.className = "mjr-menu-item", N.dataset.value = M.value;
    const k = document.createElement("span");
    k.className = "mjr-menu-item-label", k.textContent = M.label;
    const G = document.createElement("i");
    G.className = "pi pi-check mjr-menu-item-check", G.style.opacity = M.value === h ? "1" : "0", N.appendChild(k), N.appendChild(G), d.appendChild(N), m.push(N), M.value === h && N.classList.add("is-active");
  }
  c.value = h, l.classList.toggle("is-on", h !== "0"), t._guidesSelect = c, t._guideBtn = l, t._guidePopover = a;
  const p = () => {
    const M = l.getBoundingClientRect(), A = t.element.getBoundingClientRect();
    a.style.left = `${M.left - A.left}px`, a.style.top = `${M.bottom - A.top + 4}px`, a.classList.add("is-open"), l.setAttribute("aria-expanded", "true");
  };
  t._closeGuidePopover = () => {
    a.classList.remove("is-open"), l.setAttribute("aria-expanded", "false");
  }, l.addEventListener("click", (M) => {
    var A;
    M.stopPropagation(), a.classList.contains("is-open") ? t._closeGuidePopover() : ((A = t._closeAllToolbarPopovers) == null || A.call(t), p());
  }), d.addEventListener("click", (M) => {
    const A = M.target.closest(".mjr-menu-item");
    if (!A) return;
    const N = A.dataset.value;
    c.value = N, c.dispatchEvent(new Event("change", { bubbles: !0 })), m.forEach((k) => {
      const G = k.dataset.value === N;
      k.classList.toggle("is-active", G), k.querySelector(".mjr-menu-item-check").style.opacity = G ? "1" : "0";
    }), l.classList.toggle("is-on", N !== "0"), t._closeGuidePopover();
  });
  const g = String(t._channel || "rgb"), b = document.createElement("button");
  b.type = "button", b.className = "mjr-icon-btn mjr-mfv-ch-trigger", b.title = "Channel", b.setAttribute("aria-haspopup", "listbox"), b.setAttribute("aria-expanded", "false");
  const C = document.createElement("img");
  C.src = new URL("data:image/png;base64,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", import.meta.url).href, C.className = "mjr-mfv-ch-icon", C.alt = "", C.setAttribute("aria-hidden", "true"), b.appendChild(C), n.appendChild(b);
  const _ = (M) => {
    if (!M || M === "rgb")
      b.replaceChildren(C);
    else {
      const A = Bn[M] || "#e0e0e0", N = xn[M] || "500", k = Nn[M] || M.toUpperCase(), G = document.createElement("span");
      G.className = "mjr-mfv-ch-label", G.style.color = A, G.style.fontWeight = N, G.textContent = k, b.replaceChildren(G);
    }
  }, y = document.createElement("div");
  y.className = "mjr-mfv-ch-popover", t.element.appendChild(y);
  const S = document.createElement("div");
  S.className = "mjr-menu", S.style.cssText = "display:grid;gap:4px;", y.appendChild(S);
  const x = document.createElement("select");
  x.style.cssText = "position:absolute;opacity:0;pointer-events:none;width:0;height:0;overflow:hidden;", y.appendChild(x);
  const B = [
    { value: "rgb", color: "#e0e0e0", weight: "500", label: "RGB" },
    { value: "r", color: "#ff5555", weight: "700", label: "R" },
    { value: "g", color: "#44dd66", weight: "700", label: "G" },
    { value: "b", color: "#5599ff", weight: "700", label: "B" },
    { value: "a", color: "#ffffff", weight: "700", label: "A" },
    { value: "l", color: "#bbbbbb", weight: "400", label: "L" }
  ], F = [];
  for (const M of B) {
    const A = document.createElement("option");
    A.value = M.value, x.appendChild(A);
    const N = document.createElement("button");
    N.type = "button", N.className = "mjr-menu-item", N.dataset.value = M.value;
    const k = document.createElement("span");
    k.className = "mjr-menu-item-label";
    const G = document.createElement("span");
    G.textContent = M.label, G.style.color = M.color, G.style.fontWeight = M.weight, k.appendChild(G);
    const Y = document.createElement("i");
    Y.className = "pi pi-check mjr-menu-item-check", Y.style.opacity = M.value === g ? "1" : "0", N.appendChild(k), N.appendChild(Y), S.appendChild(N), F.push(N), M.value === g && N.classList.add("is-active");
  }
  x.value = g, _(g), b.classList.toggle("is-on", g !== "rgb"), t._channelSelect = x, t._chBtn = b, t._chPopover = y;
  const P = () => {
    const M = b.getBoundingClientRect(), A = t.element.getBoundingClientRect();
    y.style.left = `${M.left - A.left}px`, y.style.top = `${M.bottom - A.top + 4}px`, y.classList.add("is-open"), b.setAttribute("aria-expanded", "true");
  };
  t._closeChPopover = () => {
    y.classList.remove("is-open"), b.setAttribute("aria-expanded", "false");
  }, b.addEventListener("click", (M) => {
    var A;
    M.stopPropagation(), y.classList.contains("is-open") ? t._closeChPopover() : ((A = t._closeAllToolbarPopovers) == null || A.call(t), P());
  }), S.addEventListener("click", (M) => {
    const A = M.target.closest(".mjr-menu-item");
    if (!A) return;
    const N = A.dataset.value;
    x.value = N, x.dispatchEvent(new Event("change", { bubbles: !0 })), F.forEach((k) => {
      const G = k.dataset.value === N;
      k.classList.toggle("is-active", G), k.querySelector(".mjr-menu-item-check").style.opacity = G ? "1" : "0";
    }), _(N), b.classList.toggle("is-on", N !== "rgb"), t._closeChPopover();
  }), t._closeAllToolbarPopovers = () => {
    var M, A, N, k, G;
    (M = t._closeChPopover) == null || M.call(t), (A = t._closeGuidePopover) == null || A.call(t), (N = t._closePinPopover) == null || N.call(t), (k = t._closeFormatPopover) == null || k.call(t), (G = t._closeGenDropdown) == null || G.call(t);
  }, t._exposureCtl = e("Exposure (EV)", {
    min: -10,
    max: 10,
    step: 0.1,
    value: Number(t._exposureEV || 0)
  }), t._exposureCtl.out.textContent = `${Number(t._exposureEV || 0).toFixed(1)}EV`, t._exposureCtl.out.title = "Click to reset to 0 EV", t._exposureCtl.out.style.cursor = "pointer", t._exposureCtl.wrap.classList.toggle("is-active", (t._exposureEV || 0) !== 0), n.appendChild(t._exposureCtl.wrap), t._formatToggle = document.createElement("button"), t._formatToggle.type = "button", t._formatToggle.className = "mjr-icon-btn mjr-mfv-format-trigger", t._formatToggle.setAttribute("aria-haspopup", "dialog"), t._formatToggle.setAttribute("aria-expanded", "false"), t._formatToggle.setAttribute("aria-pressed", "false"), t._formatToggle.title = "Format mask", t._formatToggle.innerHTML = '<i class="pi pi-stop" aria-hidden="true"></i>', n.appendChild(t._formatToggle);
  const L = document.createElement("div");
  L.className = "mjr-mfv-format-popover", t.element.appendChild(L);
  const I = document.createElement("div");
  I.className = "mjr-menu", I.style.cssText = "display:grid;gap:4px;", L.appendChild(I);
  const V = document.createElement("select");
  V.style.cssText = "position:absolute;opacity:0;pointer-events:none;width:0;height:0;overflow:hidden;", L.appendChild(V);
  const U = [
    { value: "off", label: "Off" },
    { value: "image", label: "Image" },
    { value: "16:9", label: "16:9" },
    { value: "1:1", label: "1:1" },
    { value: "4:3", label: "4:3" },
    { value: "9:16", label: "9:16" },
    { value: "2.39", label: "2.39" }
  ], q = [], tt = t._overlayMaskEnabled ? String(t._overlayFormat || "image") : "off";
  for (const M of U) {
    const A = document.createElement("option");
    A.value = M.value, V.appendChild(A);
    const N = document.createElement("button");
    N.type = "button", N.className = "mjr-menu-item", N.dataset.value = M.value;
    const k = document.createElement("span");
    k.className = "mjr-menu-item-label", k.textContent = M.label;
    const G = document.createElement("i");
    G.className = "pi pi-check mjr-menu-item-check", G.style.opacity = M.value === tt ? "1" : "0", N.appendChild(k), N.appendChild(G), I.appendChild(N), q.push(N), M.value === tt && N.classList.add("is-active");
  }
  V.value = tt;
  const K = document.createElement("div");
  K.className = "mjr-mfv-format-sep", L.appendChild(K);
  const J = document.createElement("div");
  J.className = "mjr-mfv-format-slider-row", L.appendChild(J);
  const at = document.createElement("span");
  at.className = "mjr-mfv-format-slider-label", at.textContent = "Opacity", J.appendChild(at), t._maskOpacityCtl = e("Mask opacity", {
    min: 0,
    max: 0.9,
    step: 0.01,
    value: Number(t._overlayMaskOpacity ?? 0.65)
  }), J.appendChild(t._maskOpacityCtl.input), J.appendChild(t._maskOpacityCtl.out), t._formatSelect = V, t._formatPopover = L;
  const rt = () => {
    const M = t._formatToggle.getBoundingClientRect(), A = t.element.getBoundingClientRect();
    L.style.left = `${M.left - A.left}px`, L.style.top = `${M.bottom - A.top + 4}px`, L.classList.add("is-open"), t._formatToggle.setAttribute("aria-expanded", "true");
  };
  t._closeFormatPopover = () => {
    L.classList.remove("is-open"), t._formatToggle.setAttribute("aria-expanded", "false");
  }, t._formatToggle.addEventListener("click", (M) => {
    var A;
    M.stopPropagation(), L.classList.contains("is-open") ? t._closeFormatPopover() : ((A = t._closeAllToolbarPopovers) == null || A.call(t), rt());
  }), I.addEventListener("click", (M) => {
    const A = M.target.closest(".mjr-menu-item");
    if (!A) return;
    const N = A.dataset.value;
    V.value = N, V.dispatchEvent(new Event("change", { bubbles: !0 })), q.forEach((k) => {
      const G = k.dataset.value === N;
      k.classList.toggle("is-active", G), k.querySelector(".mjr-menu-item-check").style.opacity = G ? "1" : "0";
    }), t._closeFormatPopover();
  });
  const lt = document.createElement("div");
  lt.className = "mjr-mfv-toolbar-sep", lt.setAttribute("aria-hidden", "true"), n.appendChild(lt), t._liveBtn = document.createElement("button"), t._liveBtn.type = "button", t._liveBtn.className = "mjr-icon-btn", t._liveBtn.innerHTML = '<i class="pi pi-circle" aria-hidden="true"></i>', t._liveBtn.setAttribute("aria-pressed", "false"), yt(
    t._liveBtn,
    v("tooltip.liveStreamOff", "Live Stream: OFF — click to follow"),
    ce
  ), n.appendChild(t._liveBtn), t._previewBtn = document.createElement("button"), t._previewBtn.type = "button", t._previewBtn.className = "mjr-icon-btn", t._previewBtn.innerHTML = '<i class="pi pi-eye" aria-hidden="true"></i>', t._previewBtn.setAttribute("aria-pressed", "false"), yt(
    t._previewBtn,
    v(
      "tooltip.previewStreamOff",
      "KSampler Preview: OFF — click to stream denoising steps"
    ),
    de
  ), n.appendChild(t._previewBtn), t._nodeStreamBtn = document.createElement("button"), t._nodeStreamBtn.type = "button", t._nodeStreamBtn.className = "mjr-icon-btn", t._nodeStreamBtn.innerHTML = '<i class="pi pi-sitemap" aria-hidden="true"></i>', t._nodeStreamBtn.setAttribute("aria-pressed", "false"), yt(
    t._nodeStreamBtn,
    v("tooltip.nodeStreamOff", "Node Stream: OFF — click to stream selected node output"),
    Ge
  ), n.appendChild(t._nodeStreamBtn), (Tt = (It = t._nodeStreamBtn).remove) == null || Tt.call(It), t._nodeStreamBtn = null, t._genBtn = document.createElement("button"), t._genBtn.type = "button", t._genBtn.className = "mjr-icon-btn", t._genBtn.setAttribute("aria-haspopup", "dialog"), t._genBtn.setAttribute("aria-expanded", "false");
  const ct = document.createElement("i");
  ct.className = "pi pi-info-circle", ct.setAttribute("aria-hidden", "true"), t._genBtn.appendChild(ct), n.appendChild(t._genBtn), t._updateGenBtnUI(), t._popoutBtn = document.createElement("button"), t._popoutBtn.type = "button", t._popoutBtn.className = "mjr-icon-btn";
  const dt = v("tooltip.popOutViewer", "Pop out viewer to separate window");
  t._popoutBtn.title = dt, t._popoutBtn.setAttribute("aria-label", dt), t._popoutBtn.setAttribute("aria-pressed", "false");
  const E = document.createElement("i");
  E.className = "pi pi-external-link", E.setAttribute("aria-hidden", "true"), t._popoutBtn.appendChild(E), n.appendChild(t._popoutBtn), t._captureBtn = document.createElement("button"), t._captureBtn.type = "button", t._captureBtn.className = "mjr-icon-btn";
  const j = v("tooltip.captureView", "Save view as image");
  t._captureBtn.title = j, t._captureBtn.setAttribute("aria-label", j);
  const R = document.createElement("i");
  R.className = "pi pi-download", R.setAttribute("aria-hidden", "true"), t._captureBtn.appendChild(R), n.appendChild(t._captureBtn);
  const O = document.createElement("div");
  O.className = "mjr-mfv-toolbar-sep", O.style.marginLeft = "auto", O.setAttribute("aria-hidden", "true"), n.appendChild(O), t._settingsBtn = document.createElement("button"), t._settingsBtn.type = "button", t._settingsBtn.className = "mjr-icon-btn mjr-mfv-settings-btn";
  const z = v("tooltip.nodeParams", "Node Parameters");
  t._settingsBtn.title = z, t._settingsBtn.setAttribute("aria-label", z), t._settingsBtn.setAttribute("aria-pressed", "false");
  const w = document.createElement("i");
  return w.className = "pi pi-sliders-h", w.setAttribute("aria-hidden", "true"), t._settingsBtn.appendChild(w), n.appendChild(t._settingsBtn), t._runHandle = Sn(), n.appendChild(t._runHandle.el), t._handleDocClick = (M) => {
    var N, k, G, Y, W, $, kt, jt, Gt, mt, Vt, Rt, Ot, Ht, ht, Dt, vt, Ut, zt, ft, Wt, Yt, Qt, _t, qt;
    const A = M == null ? void 0 : M.target;
    t._genDropdown && !((k = (N = t._genBtn) == null ? void 0 : N.contains) != null && k.call(N, A)) && !t._genDropdown.contains(A) && t._closeGenDropdown(), (Y = (G = t._chPopover) == null ? void 0 : G.classList) != null && Y.contains("is-open") && !(($ = (W = t._chBtn) == null ? void 0 : W.contains) != null && $.call(W, A)) && !t._chPopover.contains(A) && ((kt = t._closeChPopover) == null || kt.call(t)), (Gt = (jt = t._guidePopover) == null ? void 0 : jt.classList) != null && Gt.contains("is-open") && !((Vt = (mt = t._guideBtn) == null ? void 0 : mt.contains) != null && Vt.call(mt, A)) && !t._guidePopover.contains(A) && ((Rt = t._closeGuidePopover) == null || Rt.call(t)), (Ht = (Ot = t._pinPopover) == null ? void 0 : Ot.classList) != null && Ht.contains("is-open") && !((Dt = (ht = t._pinBtn) == null ? void 0 : ht.contains) != null && Dt.call(ht, A)) && !t._pinPopover.contains(A) && ((vt = t._closePinPopover) == null || vt.call(t)), (zt = (Ut = t._formatPopover) == null ? void 0 : Ut.classList) != null && zt.contains("is-open") && !((Wt = (ft = t._formatToggle) == null ? void 0 : ft.contains) != null && Wt.call(ft, A)) && !t._formatPopover.contains(A) && ((Yt = t._closeFormatPopover) == null || Yt.call(t)), (Qt = A == null ? void 0 : A.closest) != null && Qt.call(A, ".mjr-mfv-idrop") || (qt = (_t = t.element) == null ? void 0 : _t.querySelectorAll) == null || qt.call(_t, ".mjr-mfv-idrop-menu.is-open").forEach((ye) => ye.classList.remove("is-open"));
  }, t._bindDocumentUiHandlers(), n;
}
function In(t) {
  var n, o, s, i, r, l, u, a, d, c, f, h, m, p, g, b, C, _, y, S, x;
  try {
    (n = t._btnAC) == null || n.abort();
  } catch (B) {
    (o = console.debug) == null || o.call(console, B);
  }
  t._btnAC = new AbortController();
  const e = t._btnAC.signal;
  (s = t._closeBtn) == null || s.addEventListener(
    "click",
    () => {
      t._dispatchControllerAction("close", st.MFV_CLOSE);
    },
    { signal: e }
  ), (i = t._modeBtn) == null || i.addEventListener("click", () => t._cycleMode(), { signal: e }), (r = t._pinGroup) == null || r.addEventListener(
    "click",
    (B) => {
      var L, I;
      const F = (I = (L = B.target) == null ? void 0 : L.closest) == null ? void 0 : I.call(L, ".mjr-mfv-pin-btn");
      if (!F) return;
      const P = F.dataset.slot;
      P && (t._pinnedSlots.has(P) ? t._pinnedSlots.delete(P) : t._pinnedSlots.add(P), t._pinnedSlots.has("C") || t._pinnedSlots.has("D") ? t._mode !== T.GRID && t.setMode(T.GRID) : t._pinnedSlots.size > 0 && t._mode === T.SIMPLE && t.setMode(T.AB), t._updatePinUI());
    },
    { signal: e }
  ), (l = t._liveBtn) == null || l.addEventListener(
    "click",
    () => {
      t._dispatchControllerAction("toggleLive", st.MFV_LIVE_TOGGLE);
    },
    { signal: e }
  ), (u = t._previewBtn) == null || u.addEventListener(
    "click",
    () => {
      t._dispatchControllerAction("togglePreview", st.MFV_PREVIEW_TOGGLE);
    },
    { signal: e }
  ), (a = t._nodeStreamBtn) == null || a.addEventListener(
    "click",
    () => {
      t._dispatchControllerAction("toggleNodeStream", st.MFV_NODESTREAM_TOGGLE);
    },
    { signal: e }
  ), (d = t._genBtn) == null || d.addEventListener(
    "click",
    (B) => {
      var F, P, L;
      B.stopPropagation(), (P = (F = t._genDropdown) == null ? void 0 : F.classList) != null && P.contains("is-visible") ? t._closeGenDropdown() : ((L = t._closeAllToolbarPopovers) == null || L.call(t), t._openGenDropdown());
    },
    { signal: e }
  ), (c = t._popoutBtn) == null || c.addEventListener(
    "click",
    () => {
      t._dispatchControllerAction("popOut", st.MFV_POPOUT);
    },
    { signal: e }
  ), (f = t._captureBtn) == null || f.addEventListener("click", () => t._captureView(), { signal: e }), (h = t._settingsBtn) == null || h.addEventListener(
    "click",
    () => {
      var B, F;
      (B = t._sidebar) == null || B.toggle(), t._updateSettingsBtnState(((F = t._sidebar) == null ? void 0 : F.isVisible) ?? !1);
    },
    { signal: e }
  ), (m = t._guidesSelect) == null || m.addEventListener(
    "change",
    () => {
      var B, F;
      t._gridMode = Number(t._guidesSelect.value) || 0, (B = t._guideBtn) == null || B.classList.toggle("is-on", t._gridMode !== 0), (F = t._redrawOverlayGuides) == null || F.call(t);
    },
    { signal: e }
  ), (p = t._channelSelect) == null || p.addEventListener(
    "change",
    () => {
      var B, F;
      t._channel = String(t._channelSelect.value || "rgb"), (B = t._chBtn) == null || B.classList.toggle("is-on", t._channel !== "rgb"), (F = t._applyMediaToneControls) == null || F.call(t);
    },
    { signal: e }
  ), (b = (g = t._exposureCtl) == null ? void 0 : g.input) == null || b.addEventListener(
    "input",
    () => {
      var F;
      const B = Math.max(-10, Math.min(10, Number(t._exposureCtl.input.value) || 0));
      t._exposureEV = Math.round(B * 10) / 10, t._exposureCtl.out.textContent = `${t._exposureEV.toFixed(1)}EV`, t._exposureCtl.wrap.classList.toggle("is-active", t._exposureEV !== 0), (F = t._applyMediaToneControls) == null || F.call(t);
    },
    { signal: e }
  ), (_ = (C = t._exposureCtl) == null ? void 0 : C.out) == null || _.addEventListener(
    "click",
    () => {
      var B;
      t._exposureEV = 0, t._exposureCtl.input.value = "0", t._exposureCtl.out.textContent = "0.0EV", t._exposureCtl.wrap.classList.remove("is-active"), (B = t._applyMediaToneControls) == null || B.call(t);
    },
    { signal: e }
  ), (y = t._formatSelect) == null || y.addEventListener(
    "change",
    () => {
      var F, P, L;
      const B = String(t._formatSelect.value || "image");
      B === "off" ? t._overlayMaskEnabled = !1 : (t._overlayMaskEnabled = !0, t._overlayFormat = B), (F = t._formatToggle) == null || F.classList.toggle("is-on", !!t._overlayMaskEnabled), (P = t._formatToggle) == null || P.setAttribute("aria-pressed", String(!!t._overlayMaskEnabled)), (L = t._redrawOverlayGuides) == null || L.call(t);
    },
    { signal: e }
  ), (x = (S = t._maskOpacityCtl) == null ? void 0 : S.input) == null || x.addEventListener(
    "input",
    () => {
      var P;
      const B = Number(t._maskOpacityCtl.input.value), F = Math.max(0, Math.min(0.9, Number.isFinite(B) ? B : 0.65));
      t._overlayMaskOpacity = Math.round(F * 100) / 100, t._maskOpacityCtl.out.textContent = t._overlayMaskOpacity.toFixed(2), (P = t._redrawOverlayGuides) == null || P.call(t);
    },
    { signal: e }
  );
}
function Tn(t, e) {
  t._settingsBtn && (t._settingsBtn.classList.toggle("active", !!e), t._settingsBtn.setAttribute("aria-pressed", String(!!e)));
}
function kn(t) {
  var n;
  if (!t._contentWrapper) return;
  const e = pt.MFV_SIDEBAR_POSITION || "right";
  t._contentWrapper.setAttribute("data-sidebar-pos", e), (n = t._sidebar) != null && n.el && t._contentEl && (e === "left" ? t._contentWrapper.insertBefore(t._sidebar.el, t._contentEl) : t._contentWrapper.appendChild(t._sidebar.el));
}
function jn(t) {
  var e, n, o;
  t._closeGenDropdown();
  try {
    (n = (e = t._genDropdown) == null ? void 0 : e.remove) == null || n.call(e);
  } catch (s) {
    (o = console.debug) == null || o.call(console, s);
  }
  t._genDropdown = null, t._updateGenBtnUI();
}
function Gn(t) {
  var n, o, s;
  if (!t._handleDocClick) return;
  const e = ((n = t.element) == null ? void 0 : n.ownerDocument) || document;
  if (t._docClickHost !== e) {
    t._unbindDocumentUiHandlers();
    try {
      (o = t._docAC) == null || o.abort();
    } catch (i) {
      (s = console.debug) == null || s.call(console, i);
    }
    t._docAC = new AbortController(), e.addEventListener("click", t._handleDocClick, { signal: t._docAC.signal }), t._docClickHost = e;
  }
}
function Vn(t) {
  var e, n;
  try {
    (e = t._docAC) == null || e.abort();
  } catch (o) {
    (n = console.debug) == null || n.call(console, o);
  }
  t._docAC = new AbortController(), t._docClickHost = null;
}
function Rn(t) {
  var e, n;
  return !!((n = (e = t._genDropdown) == null ? void 0 : e.classList) != null && n.contains("is-visible"));
}
function On(t) {
  if (!t.element) return;
  t._genDropdown || (t._genDropdown = t._buildGenDropdown(), t.element.appendChild(t._genDropdown)), t._bindDocumentUiHandlers();
  const e = t._genBtn.getBoundingClientRect(), n = t.element.getBoundingClientRect(), o = e.left - n.left, s = e.bottom - n.top + 6;
  t._genDropdown.style.left = `${o}px`, t._genDropdown.style.top = `${s}px`, t._genDropdown.classList.add("is-visible"), t._updateGenBtnUI();
}
function Hn(t) {
  t._genDropdown && (t._genDropdown.classList.remove("is-visible"), t._updateGenBtnUI());
}
function Dn(t) {
  if (!t._genBtn) return;
  const e = t._genInfoSelections.size, n = e > 0, o = t._isGenDropdownOpen();
  t._genBtn.classList.toggle("is-on", n), t._genBtn.classList.toggle("is-open", o);
  const s = n ? `Gen Info (${e} field${e > 1 ? "s" : ""} shown)${o ? " — open" : " — click to configure"}` : `Gen Info${o ? " — open" : " — click to show overlay"}`;
  t._genBtn.title = s, t._genBtn.setAttribute("aria-label", s), t._genBtn.setAttribute("aria-expanded", String(o)), t._genDropdown ? t._genBtn.setAttribute("aria-controls", t._genDropdownId) : t._genBtn.removeAttribute("aria-controls");
}
function vn(t) {
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
  for (const [o, s] of n) {
    const i = document.createElement("label");
    i.className = "mjr-mfv-gen-dropdown-row";
    const r = document.createElement("input");
    r.type = "checkbox", r.checked = t._genInfoSelections.has(o), r.addEventListener("change", () => {
      r.checked ? t._genInfoSelections.add(o) : t._genInfoSelections.delete(o), t._updateGenBtnUI(), t._refresh();
    });
    const l = document.createElement("span");
    l.textContent = s, i.appendChild(r), i.appendChild(l), e.appendChild(i);
  }
  return e;
}
function oe(t) {
  const e = Number(t);
  return !Number.isFinite(e) || e <= 0 ? "" : e >= 60 ? `${(e / 60).toFixed(1)}m` : `${e.toFixed(1)}s`;
}
function Un(t) {
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
function zn(t, e) {
  var i, r, l, u;
  if (!e) return {};
  try {
    const a = e.geninfo ? { geninfo: e.geninfo } : e.metadata || e.metadata_raw || e, d = Le(a) || null, c = {
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
      d.prompt && (c.prompt = St(String(d.prompt))), d.seed != null && (c.seed = String(d.seed)), d.model && (c.model = Array.isArray(d.model) ? d.model.join(", ") : String(d.model)), Array.isArray(d.loras) && (c.lora = d.loras.map(
        (h) => typeof h == "string" ? h : (h == null ? void 0 : h.name) || (h == null ? void 0 : h.lora_name) || (h == null ? void 0 : h.model_name) || ""
      ).filter(Boolean).join(", ")), d.sampler && (c.sampler = String(d.sampler)), d.scheduler && (c.scheduler = String(d.scheduler)), d.cfg != null && (c.cfg = String(d.cfg)), d.steps != null && (c.step = String(d.steps)), !c.prompt && (a != null && a.prompt) && (c.prompt = St(String(a.prompt || "")));
      const f = e.generation_time_ms ?? ((i = e.metadata_raw) == null ? void 0 : i.generation_time_ms) ?? (a == null ? void 0 : a.generation_time_ms) ?? ((r = a == null ? void 0 : a.geninfo) == null ? void 0 : r.generation_time_ms) ?? 0;
      return f && Number.isFinite(Number(f)) && f > 0 && f < 864e5 && (c.genTime = oe(Number(f) / 1e3)), c;
    }
  } catch (a) {
    (l = console.debug) == null || l.call(console, "[MFV] geninfo normalize failed", a);
  }
  const n = (e == null ? void 0 : e.metadata) || (e == null ? void 0 : e.metadata_raw) || e || {}, o = {
    prompt: St(String((n == null ? void 0 : n.prompt) || (n == null ? void 0 : n.positive) || "")),
    seed: (n == null ? void 0 : n.seed) != null ? String(n.seed) : "",
    model: (n == null ? void 0 : n.checkpoint) || (n == null ? void 0 : n.ckpt_name) || (n == null ? void 0 : n.model) || "",
    lora: Array.isArray(n == null ? void 0 : n.loras) ? n.loras.join(", ") : (n == null ? void 0 : n.lora) || "",
    sampler: (n == null ? void 0 : n.sampler_name) || (n == null ? void 0 : n.sampler) || "",
    scheduler: (n == null ? void 0 : n.scheduler) || "",
    cfg: (n == null ? void 0 : n.cfg) != null ? String(n.cfg) : (n == null ? void 0 : n.cfg_scale) != null ? String(n.cfg_scale) : "",
    step: (n == null ? void 0 : n.steps) != null ? String(n.steps) : "",
    genTime: ""
  }, s = e.generation_time_ms ?? ((u = e.metadata_raw) == null ? void 0 : u.generation_time_ms) ?? (n == null ? void 0 : n.generation_time_ms) ?? 0;
  return s && Number.isFinite(Number(s)) && s > 0 && s < 864e5 && (o.genTime = oe(Number(s) / 1e3)), o;
}
function Wn(t, e) {
  const n = t._getGenFields(e);
  if (!n) return null;
  const o = document.createDocumentFragment(), s = [
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
    if (!t._genInfoSelections.has(i)) continue;
    const r = n[i] != null ? String(n[i]) : "";
    if (!r) continue;
    let l = i.charAt(0).toUpperCase() + i.slice(1);
    i === "lora" ? l = "LoRA" : i === "cfg" ? l = "CFG" : i === "genTime" && (l = "Gen Time");
    const u = document.createElement("div");
    u.dataset.field = i;
    const a = document.createElement("strong");
    if (a.textContent = `${l}: `, u.appendChild(a), i === "prompt")
      u.appendChild(document.createTextNode(r));
    else if (i === "genTime") {
      const d = Un(r);
      let c = "#4CAF50";
      d >= 60 ? c = "#FF9800" : d >= 30 ? c = "#FFC107" : d >= 10 && (c = "#8BC34A");
      const f = document.createElement("span");
      f.style.color = c, f.style.fontWeight = "600", f.textContent = r, u.appendChild(f);
    } else
      u.appendChild(document.createTextNode(r));
    o.appendChild(u);
  }
  return o.childNodes.length > 0 ? o : null;
}
function Yn(t) {
  var e, n, o;
  try {
    (n = (e = t._controller) == null ? void 0 : e.onModeChanged) == null || n.call(e, t._mode);
  } catch (s) {
    (o = console.debug) == null || o.call(console, s);
  }
}
function Qn(t) {
  const e = [T.SIMPLE, T.AB, T.SIDE, T.GRID];
  t._mode = e[(e.indexOf(t._mode) + 1) % e.length], t._updateModeBtnUI(), t._refresh(), t._notifyModeChanged();
}
function qn(t, e) {
  Object.values(T).includes(e) && (t._mode = e, t._updateModeBtnUI(), t._refresh(), t._notifyModeChanged());
}
function Xn(t) {
  return t._pinnedSlots;
}
function Zn(t) {
  var e, n;
  if (t._pinBtns) {
    for (const o of ["A", "B", "C", "D"]) {
      const s = t._pinBtns[o];
      if (!s) continue;
      const i = t._pinnedSlots.has(o);
      s.classList.toggle("is-pinned", i), s.setAttribute("aria-pressed", String(i)), s.title = i ? `Unpin Asset ${o}` : `Pin Asset ${o}`;
    }
    (n = t._pinBtn) == null || n.classList.toggle("is-on", (((e = t._pinnedSlots) == null ? void 0 : e.size) ?? 0) > 0);
  }
}
function Kn(t) {
  if (!t._modeBtn) return;
  const e = {
    [T.SIMPLE]: { icon: "pi-image", label: "Mode: Simple - click to switch" },
    [T.AB]: { icon: "pi-clone", label: "Mode: A/B Compare - click to switch" },
    [T.SIDE]: { icon: "pi-table", label: "Mode: Side-by-Side - click to switch" },
    [T.GRID]: {
      icon: "pi-th-large",
      label: "Mode: Grid Compare (up to 4) - click to switch"
    }
  }, { icon: n = "pi-image", label: o = "" } = e[t._mode] || {}, s = Pt(o, je), i = document.createElement("i");
  i.className = `pi ${n}`, i.setAttribute("aria-hidden", "true"), t._modeBtn.replaceChildren(i), t._modeBtn.title = s, t._modeBtn.setAttribute("aria-label", s), t._modeBtn.removeAttribute("aria-pressed"), t._modeBtn.classList.toggle("is-on", t._mode !== T.SIMPLE);
}
function Jn(t, e) {
  if (!t._liveBtn) return;
  const n = !!e;
  t._liveBtn.classList.toggle("mjr-live-active", n);
  const o = n ? v("tooltip.liveStreamOn", "Live Stream: ON — click to disable") : v("tooltip.liveStreamOff", "Live Stream: OFF — click to follow"), s = Pt(o, ce);
  t._liveBtn.setAttribute("aria-pressed", String(n)), t._liveBtn.setAttribute("aria-label", s);
  const i = document.createElement("i");
  i.className = n ? "pi pi-circle-fill" : "pi pi-circle", i.setAttribute("aria-hidden", "true"), t._liveBtn.replaceChildren(i), t._liveBtn.title = s;
}
function wn(t, e) {
  if (t._previewActive = !!e, !t._previewBtn) return;
  t._previewBtn.classList.toggle("mjr-preview-active", t._previewActive);
  const n = t._previewActive ? v("tooltip.previewStreamOn", "KSampler Preview: ON — streaming denoising steps") : v(
    "tooltip.previewStreamOff",
    "KSampler Preview: OFF — click to stream denoising steps"
  ), o = Pt(n, de);
  t._previewBtn.setAttribute("aria-pressed", String(t._previewActive)), t._previewBtn.setAttribute("aria-label", o);
  const s = document.createElement("i");
  s.className = t._previewActive ? "pi pi-eye" : "pi pi-eye-slash", s.setAttribute("aria-hidden", "true"), t._previewBtn.replaceChildren(s), t._previewBtn.title = o, t._previewActive || t._revokePreviewBlob();
}
function $n(t, e, n = {}) {
  if (!e || !(e instanceof Blob)) return;
  t._revokePreviewBlob();
  const o = URL.createObjectURL(e);
  t._previewBlobUrl = o;
  const s = {
    url: o,
    filename: "preview.jpg",
    kind: "image",
    _isPreview: !0,
    _sourceLabel: (n == null ? void 0 : n.sourceLabel) || null
  };
  if (t._mode === T.AB || t._mode === T.SIDE || t._mode === T.GRID) {
    const r = t.getPinnedSlots();
    if (t._mode === T.GRID) {
      const l = ["A", "B", "C", "D"].find((u) => !r.has(u)) || "A";
      t[`_media${l}`] = s;
    } else r.has("B") ? t._mediaA = s : t._mediaB = s;
  } else
    t._mediaA = s, t._resetMfvZoom(), t._mode !== T.SIMPLE && (t._mode = T.SIMPLE, t._updateModeBtnUI());
  ++t._refreshGen, t._refresh();
}
function to(t) {
  if (t._previewBlobUrl) {
    try {
      URL.revokeObjectURL(t._previewBlobUrl);
    } catch {
    }
    t._previewBlobUrl = null;
  }
}
function eo(t, e) {
  {
    t._nodeStreamActive = !1;
    return;
  }
}
const no = [
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
function oo() {
  var t, e, n, o, s;
  try {
    const i = typeof window < "u" ? window : globalThis, r = (e = (t = i == null ? void 0 : i.process) == null ? void 0 : t.versions) == null ? void 0 : e.electron;
    if (typeof r == "string" && r.trim() || i != null && i.electron || i != null && i.ipcRenderer || i != null && i.electronAPI)
      return !0;
    const l = String(((n = i == null ? void 0 : i.navigator) == null ? void 0 : n.userAgent) || ((o = globalThis == null ? void 0 : globalThis.navigator) == null ? void 0 : o.userAgent) || ""), u = /\bElectron\//i.test(l), a = /\bCode\//i.test(l);
    if (u && !a)
      return !0;
  } catch (i) {
    (s = console.debug) == null || s.call(console, i);
  }
  return !1;
}
function D(t, e = null, n = "info") {
  var s, i;
  const o = {
    stage: String(t || "unknown"),
    detail: e,
    ts: Date.now()
  };
  try {
    const r = typeof window < "u" ? window : globalThis, l = "__MJR_MFV_POPOUT_TRACE__", u = Array.isArray(r[l]) ? r[l] : [];
    u.push(o), r[l] = u.slice(-20), r.__MJR_MFV_POPOUT_LAST__ = o;
  } catch (r) {
    (s = console.debug) == null || s.call(console, r);
  }
  try {
    const r = n === "error" ? console.error : n === "warn" ? console.warn : console.info;
    r == null || r("[MFV popout]", o);
  } catch (r) {
    (i = console.debug) == null || i.call(console, r);
  }
}
function se(t, ...e) {
  return Array.from(
    new Set(
      [String(t || ""), ...e].join(" ").split(/\s+/).filter(Boolean)
    )
  ).join(" ");
}
function ie(t, e) {
  var n;
  if (!(!t || !e))
    for (const o of Array.from(t.attributes || [])) {
      const s = String((o == null ? void 0 : o.name) || "");
      if (!(!s || s === "class" || s === "style"))
        try {
          e.setAttribute(s, o.value);
        } catch (i) {
          (n = console.debug) == null || n.call(console, i);
        }
    }
}
function ae(t, e) {
  var s, i, r, l, u;
  if (!t || !(e != null && e.style)) return;
  const n = typeof window < "u" && (window == null ? void 0 : window.getComputedStyle) || (globalThis == null ? void 0 : globalThis.getComputedStyle);
  if (typeof n != "function") return;
  let o = null;
  try {
    o = n(t);
  } catch (a) {
    (s = console.debug) == null || s.call(console, a);
  }
  if (o) {
    for (const a of no)
      try {
        const d = String(((i = o.getPropertyValue) == null ? void 0 : i.call(o, a)) || "").trim();
        d && e.style.setProperty(a, d);
      } catch (d) {
        (r = console.debug) == null || r.call(console, d);
      }
    try {
      const a = String(((l = o.getPropertyValue) == null ? void 0 : l.call(o, "color-scheme")) || "").trim();
      a && (e.style.colorScheme = a);
    } catch (a) {
      (u = console.debug) == null || u.call(console, a);
    }
  }
}
function so(t) {
  if (!(t != null && t.documentElement) || !(t != null && t.body) || !(document != null && document.documentElement)) return;
  const e = document.documentElement, n = document.body, o = t.documentElement, s = t.body;
  o.className = se(
    e.className,
    "mjr-mfv-popout-document"
  ), s.className = se(
    n == null ? void 0 : n.className,
    "mjr-mfv-popout-body"
  ), ie(e, o), ie(n, s), ae(e, o), ae(n, s), e != null && e.lang && (o.lang = e.lang), e != null && e.dir && (o.dir = e.dir);
}
function be(t) {
  var n, o, s;
  if (!(t != null && t.body)) return null;
  try {
    const i = (n = t.getElementById) == null ? void 0 : n.call(t, "mjr-mfv-popout-root");
    (o = i == null ? void 0 : i.remove) == null || o.call(i);
  } catch (i) {
    (s = console.debug) == null || s.call(console, i);
  }
  const e = t.createElement("div");
  return e.id = "mjr-mfv-popout-root", e.className = "mjr-mfv-popout-root", t.body.appendChild(e), e;
}
function io(t, e) {
  if (!t.element) return;
  const n = !!e;
  if (t._desktopExpanded === n) return;
  const o = t.element;
  if (n) {
    t._desktopExpandRestore = {
      parent: o.parentNode || null,
      nextSibling: o.nextSibling || null,
      styleAttr: o.getAttribute("style")
    }, o.parentNode !== document.body && document.body.appendChild(o), o.classList.add("mjr-mfv--desktop-expanded", "is-visible"), o.setAttribute("aria-hidden", "false"), o.style.position = "fixed", o.style.top = "12px", o.style.left = "12px", o.style.right = "12px", o.style.bottom = "12px", o.style.width = "auto", o.style.height = "auto", o.style.maxWidth = "none", o.style.maxHeight = "none", o.style.minWidth = "320px", o.style.minHeight = "240px", o.style.resize = "none", o.style.margin = "0", o.style.zIndex = "2147483000", t._desktopExpanded = !0, t.isVisible = !0, t._resetGenDropdownForCurrentDocument(), t._rebindControlHandlers(), t._bindPanelInteractions(), t._bindDocumentUiHandlers(), t._updatePopoutBtnUI(), D("electron-in-app-expanded", { isVisible: t.isVisible });
    return;
  }
  const s = t._desktopExpandRestore;
  t._desktopExpanded = !1, o.classList.remove("mjr-mfv--desktop-expanded"), (s == null ? void 0 : s.styleAttr) == null || s.styleAttr === "" ? o.removeAttribute("style") : o.setAttribute("style", s.styleAttr), s != null && s.parent && s.parent.isConnected && (s.nextSibling && s.nextSibling.parentNode === s.parent ? s.parent.insertBefore(o, s.nextSibling) : s.parent.appendChild(o)), t._desktopExpandRestore = null, t._resetGenDropdownForCurrentDocument(), t._rebindControlHandlers(), t._bindPanelInteractions(), t._bindDocumentUiHandlers(), t._updatePopoutBtnUI(), D("electron-in-app-restored", null);
}
function ao(t, e) {
  var n;
  t._desktopPopoutUnsupported = !0, D(
    "electron-in-app-fallback",
    { message: (e == null ? void 0 : e.message) || String(e || "unknown error") },
    "warn"
  ), t._setDesktopExpanded(!0);
  try {
    Fe(
      v(
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
function ro(t, e, n, o, s) {
  return D(
    "electron-popup-fallback-attempt",
    { reason: (s == null ? void 0 : s.message) || String(s || "unknown") },
    "warn"
  ), t._fallbackPopout(e, n, o), t._popoutWindow ? (t._desktopPopoutUnsupported = !1, D("electron-popup-fallback-opened", null), !0) : !1;
}
function lo(t) {
  var l, u;
  if (t._isPopped || !t.element) return;
  const e = t.element;
  t._stopEdgeResize();
  const n = oo(), o = typeof window < "u" && "documentPictureInPicture" in window, s = String(((l = window == null ? void 0 : window.navigator) == null ? void 0 : l.userAgent) || ((u = globalThis == null ? void 0 : globalThis.navigator) == null ? void 0 : u.userAgent) || ""), i = Math.max(e.offsetWidth || 520, 400), r = Math.max(e.offsetHeight || 420, 300);
  if (D("start", {
    isElectronHost: n,
    hasDocumentPiP: o,
    userAgent: s,
    width: i,
    height: r,
    desktopPopoutUnsupported: t._desktopPopoutUnsupported
  }), n && t._desktopPopoutUnsupported) {
    D("electron-in-app-fallback-reuse", null), t._setDesktopExpanded(!0);
    return;
  }
  if (!(n && (D("electron-popup-request", { width: i, height: r }), t._tryElectronPopupFallback(e, i, r, new Error("Desktop popup requested"))))) {
    if (n && "documentPictureInPicture" in window) {
      D("electron-pip-request", { width: i, height: r }), window.documentPictureInPicture.requestWindow({ width: i, height: r }).then((a) => {
        var m, p, g;
        D("electron-pip-opened", {
          hasDocument: !!(a != null && a.document)
        }), t._popoutWindow = a, t._isPopped = !0, t._popoutRestoreGuard = !1;
        try {
          (m = t._popoutAC) == null || m.abort();
        } catch (b) {
          (p = console.debug) == null || p.call(console, b);
        }
        t._popoutAC = new AbortController();
        const d = t._popoutAC.signal, c = () => t._schedulePopInFromPopupClose();
        t._popoutCloseHandler = c;
        const f = a.document;
        f.title = "Majoor Viewer", t._installPopoutStyles(f);
        const h = be(f);
        if (!h) {
          t._activateDesktopExpandedFallback(new Error("Popup root creation failed"));
          return;
        }
        try {
          const b = typeof f.adoptNode == "function" ? f.adoptNode(e) : e;
          h.appendChild(b), D("electron-pip-adopted", {
            usedAdoptNode: typeof f.adoptNode == "function"
          });
        } catch (b) {
          D(
            "electron-pip-adopt-failed",
            { message: (b == null ? void 0 : b.message) || String(b) },
            "warn"
          ), console.warn("[MFV] PiP adoptNode failed", b), t._isPopped = !1, t._popoutWindow = null;
          try {
            a.close();
          } catch (C) {
            (g = console.debug) == null || g.call(console, C);
          }
          t._activateDesktopExpandedFallback(b);
          return;
        }
        e.classList.add("is-visible"), t.isVisible = !0, t._resetGenDropdownForCurrentDocument(), t._rebindControlHandlers(), t._bindDocumentUiHandlers(), t._updatePopoutBtnUI(), D("electron-pip-ready", { isPopped: t._isPopped }), a.addEventListener("pagehide", c, {
          signal: d
        }), t._startPopoutCloseWatch(), t._popoutKeydownHandler = (b) => {
          var _, y;
          const C = String(((_ = b == null ? void 0 : b.target) == null ? void 0 : _.tagName) || "").toLowerCase();
          b != null && b.defaultPrevented || (y = b == null ? void 0 : b.target) != null && y.isContentEditable || C === "input" || C === "textarea" || C === "select" || t._forwardKeydownToController(b);
        }, a.addEventListener("keydown", t._popoutKeydownHandler, {
          signal: d
        });
      }).catch((a) => {
        D(
          "electron-pip-request-failed",
          { message: (a == null ? void 0 : a.message) || String(a) },
          "warn"
        ), t._activateDesktopExpandedFallback(a);
      });
      return;
    }
    if (n) {
      D("electron-no-pip-api", { hasDocumentPiP: o }), t._activateDesktopExpandedFallback(
        new Error("Document Picture-in-Picture unavailable after popup failure")
      );
      return;
    }
    D("browser-fallback-popup", { width: i, height: r }), t._fallbackPopout(e, i, r);
  }
}
function co(t, e, n, o) {
  var c, f, h, m;
  D("browser-popup-open", { width: n, height: o });
  const s = (window.screenX || window.screenLeft) + Math.round((window.outerWidth - n) / 2), i = (window.screenY || window.screenTop) + Math.round((window.outerHeight - o) / 2), r = `width=${n},height=${o},left=${s},top=${i},resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,status=no`, l = window.open("about:blank", "_mjr_viewer", r);
  if (!l) {
    D("browser-popup-blocked", null, "warn"), console.warn("[MFV] Pop-out blocked — allow popups for this site.");
    return;
  }
  D("browser-popup-opened", { hasDocument: !!(l != null && l.document) }), t._popoutWindow = l, t._isPopped = !0, t._popoutRestoreGuard = !1;
  try {
    (c = t._popoutAC) == null || c.abort();
  } catch (p) {
    (f = console.debug) == null || f.call(console, p);
  }
  t._popoutAC = new AbortController();
  const u = t._popoutAC.signal, a = () => t._schedulePopInFromPopupClose();
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
    const g = be(p);
    if (g) {
      try {
        g.appendChild(p.adoptNode(e));
      } catch (b) {
        console.warn("[MFV] adoptNode failed", b);
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
      l.addEventListener("load", d, { signal: u });
    } catch (g) {
      (m = console.debug) == null || m.call(console, "[MFV] pop-out page load listener failed", g);
    }
  }
  l.addEventListener("beforeunload", a, { signal: u }), l.addEventListener("pagehide", a, { signal: u }), l.addEventListener("unload", a, { signal: u }), t._startPopoutCloseWatch(), t._popoutKeydownHandler = (p) => {
    var C, _, y, S;
    const g = String(((C = p == null ? void 0 : p.target) == null ? void 0 : C.tagName) || "").toLowerCase();
    if (p != null && p.defaultPrevented || (_ = p == null ? void 0 : p.target) != null && _.isContentEditable || g === "input" || g === "textarea" || g === "select")
      return;
    if (String((p == null ? void 0 : p.key) || "").toLowerCase() === "v" && (p != null && p.ctrlKey || p != null && p.metaKey) && !(p != null && p.altKey) && !(p != null && p.shiftKey)) {
      p.preventDefault(), (y = p.stopPropagation) == null || y.call(p), (S = p.stopImmediatePropagation) == null || S.call(p), t._dispatchControllerAction("toggle", st.MFV_TOGGLE);
      return;
    }
    t._forwardKeydownToController(p);
  }, l.addEventListener("keydown", t._popoutKeydownHandler, { signal: u });
}
function uo(t) {
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
function po(t) {
  t._clearPopoutCloseWatch(), t._popoutCloseTimer = window.setInterval(() => {
    if (!t._isPopped) {
      t._clearPopoutCloseWatch();
      return;
    }
    const e = t._popoutWindow;
    (!e || e.closed) && (t._clearPopoutCloseWatch(), t._schedulePopInFromPopupClose());
  }, 250);
}
function mo(t) {
  !t._isPopped || t._popoutRestoreGuard || (t._popoutRestoreGuard = !0, window.setTimeout(() => {
    try {
      t.popIn({ closePopupWindow: !1 });
    } finally {
      t._popoutRestoreGuard = !1;
    }
  }, 0));
}
function ho(t, e) {
  var o, s, i;
  if (!(e != null && e.head)) return;
  try {
    for (const r of e.head.querySelectorAll("[data-mjr-popout-cloned-style='1']"))
      r.remove();
  } catch (r) {
    (o = console.debug) == null || o.call(console, r);
  }
  so(e);
  try {
    const r = document.documentElement.style.cssText;
    if (r) {
      const l = e.createElement("style");
      l.setAttribute("data-mjr-popout-cloned-style", "1"), l.textContent = `:root { ${r} }`, e.head.appendChild(l);
    }
  } catch (r) {
    (s = console.debug) == null || s.call(console, r);
  }
  for (const r of document.querySelectorAll('link[rel="stylesheet"], style'))
    try {
      let l = null;
      if (r.tagName === "LINK") {
        l = e.createElement("link");
        for (const u of Array.from(r.attributes || []))
          (u == null ? void 0 : u.name) !== "href" && l.setAttribute(u.name, u.value);
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
function fo(t, { closePopupWindow: e = !0 } = {}) {
  var s, i, r, l;
  if (t._desktopExpanded) {
    t._setDesktopExpanded(!1);
    return;
  }
  if (!t._isPopped || !t.element) return;
  const n = t._popoutWindow;
  t._clearPopoutCloseWatch();
  try {
    (s = t._popoutAC) == null || s.abort();
  } catch (u) {
    (i = console.debug) == null || i.call(console, u);
  }
  t._popoutAC = null, t._popoutCloseHandler = null, t._popoutKeydownHandler = null, t._isPopped = !1;
  let o = t.element;
  try {
    o = (o == null ? void 0 : o.ownerDocument) === document ? o : document.adoptNode(o);
  } catch (u) {
    (r = console.debug) == null || r.call(console, "[MFV] pop-in adopt failed", u);
  }
  if (document.body.appendChild(o), t._resetGenDropdownForCurrentDocument(), t._rebindControlHandlers(), t._bindPanelInteractions(), t._bindDocumentUiHandlers(), o.classList.add("is-visible"), o.setAttribute("aria-hidden", "false"), t.isVisible = !0, t._updatePopoutBtnUI(), e)
    try {
      n == null || n.close();
    } catch (u) {
      (l = console.debug) == null || l.call(console, u);
    }
  t._popoutWindow = null;
}
function _o(t) {
  if (!t._popoutBtn) return;
  const e = t._isPopped || t._desktopExpanded;
  t.element && t.element.classList.toggle("mjr-mfv--popped", e), t._popoutBtn.classList.toggle("mjr-popin-active", e);
  const n = t._popoutBtn.querySelector("i") || document.createElement("i"), o = e ? v("tooltip.popInViewer", "Return to floating panel") : v("tooltip.popOutViewer", "Pop out viewer to separate window");
  n.className = e ? "pi pi-sign-in" : "pi pi-external-link", t._popoutBtn.title = o, t._popoutBtn.setAttribute("aria-label", o), t._popoutBtn.setAttribute("aria-pressed", String(e)), t._popoutBtn.contains(n) || t._popoutBtn.replaceChildren(n);
}
function go(t) {
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
function bo(t, e, n) {
  if (!n) return "";
  const o = t <= n.left + bt, s = t >= n.right - bt, i = e <= n.top + bt, r = e >= n.bottom - bt;
  return i && o ? "nw" : i && s ? "ne" : r && o ? "sw" : r && s ? "se" : i ? "n" : r ? "s" : o ? "w" : s ? "e" : "";
}
function yo(t) {
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
function Co(t) {
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
function Ao(t, e) {
  var l;
  if (!e) return;
  const n = (u) => {
    if (!t.element || t._isPopped) return "";
    const a = t.element.getBoundingClientRect();
    return t._getResizeDirectionFromPoint(u.clientX, u.clientY, a);
  }, o = (l = t._panelAC) == null ? void 0 : l.signal, s = (u) => {
    var m;
    if (u.button !== 0 || !t.element || t._isPopped) return;
    const a = n(u);
    if (!a) return;
    u.preventDefault(), u.stopPropagation();
    const d = t.element.getBoundingClientRect(), c = window.getComputedStyle(t.element), f = Math.max(120, Number.parseFloat(c.minWidth) || 0), h = Math.max(100, Number.parseFloat(c.minHeight) || 0);
    t._resizeState = {
      pointerId: u.pointerId,
      dir: a,
      startX: u.clientX,
      startY: u.clientY,
      startLeft: d.left,
      startTop: d.top,
      startWidth: d.width,
      startHeight: d.height,
      minWidth: f,
      minHeight: h
    }, t.element.style.left = `${Math.round(d.left)}px`, t.element.style.top = `${Math.round(d.top)}px`, t.element.style.right = "auto", t.element.style.bottom = "auto", t.element.classList.add("mjr-mfv--resizing"), t.element.style.cursor = t._resizeCursorForDirection(a);
    try {
      t.element.setPointerCapture(u.pointerId);
    } catch (p) {
      (m = console.debug) == null || m.call(console, p);
    }
  }, i = (u) => {
    if (!t.element || t._isPopped) return;
    const a = t._resizeState;
    if (!a) {
      const g = n(u);
      t.element.style.cursor = g ? t._resizeCursorForDirection(g) : "";
      return;
    }
    if (a.pointerId !== u.pointerId) return;
    const d = u.clientX - a.startX, c = u.clientY - a.startY;
    let f = a.startWidth, h = a.startHeight, m = a.startLeft, p = a.startTop;
    a.dir.includes("e") && (f = a.startWidth + d), a.dir.includes("s") && (h = a.startHeight + c), a.dir.includes("w") && (f = a.startWidth - d, m = a.startLeft + d), a.dir.includes("n") && (h = a.startHeight - c, p = a.startTop + c), f < a.minWidth && (a.dir.includes("w") && (m -= a.minWidth - f), f = a.minWidth), h < a.minHeight && (a.dir.includes("n") && (p -= a.minHeight - h), h = a.minHeight), f = Math.min(f, Math.max(a.minWidth, window.innerWidth)), h = Math.min(h, Math.max(a.minHeight, window.innerHeight)), m = Math.min(Math.max(0, m), Math.max(0, window.innerWidth - f)), p = Math.min(Math.max(0, p), Math.max(0, window.innerHeight - h)), t.element.style.width = `${Math.round(f)}px`, t.element.style.height = `${Math.round(h)}px`, t.element.style.left = `${Math.round(m)}px`, t.element.style.top = `${Math.round(p)}px`, t.element.style.right = "auto", t.element.style.bottom = "auto";
  }, r = (u) => {
    if (!t.element || !t._resizeState || t._resizeState.pointerId !== u.pointerId) return;
    const a = n(u);
    t._stopEdgeResize(), a && (t.element.style.cursor = t._resizeCursorForDirection(a));
  };
  e.addEventListener("pointerdown", s, { capture: !0, signal: o }), e.addEventListener("pointermove", i, { signal: o }), e.addEventListener("pointerup", r, { signal: o }), e.addEventListener("pointercancel", r, { signal: o }), e.addEventListener(
    "pointerleave",
    () => {
      !t._resizeState && t.element && (t.element.style.cursor = "");
    },
    { signal: o }
  );
}
function So(t, e) {
  var s;
  if (!e) return;
  const n = (s = t._panelAC) == null ? void 0 : s.signal;
  let o = null;
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
        o == null || o.abort();
      } catch {
      }
      o = new AbortController();
      const l = o.signal, u = t.element, a = u.getBoundingClientRect(), d = i.clientX - a.left, c = i.clientY - a.top, f = (m) => {
        const p = Math.min(
          window.innerWidth - u.offsetWidth,
          Math.max(0, m.clientX - d)
        ), g = Math.min(
          window.innerHeight - u.offsetHeight,
          Math.max(0, m.clientY - c)
        );
        u.style.left = `${p}px`, u.style.top = `${g}px`, u.style.right = "auto", u.style.bottom = "auto";
      }, h = () => {
        try {
          o == null || o.abort();
        } catch {
        }
      };
      e.addEventListener("pointermove", f, { signal: l }), e.addEventListener("pointerup", h, { signal: l });
    },
    n ? { signal: n } : void 0
  );
}
async function Eo(t, e, n, o, s, i, r, l) {
  var h, m, p, g, b;
  if (!n) return;
  const u = X(n);
  let a = null;
  if (u === "video" && (a = l instanceof HTMLVideoElement ? l : ((h = t._contentEl) == null ? void 0 : h.querySelector("video")) || null), !a && u === "model3d") {
    const C = (n == null ? void 0 : n.id) != null ? String(n.id) : "";
    C && (a = ((p = (m = t._contentEl) == null ? void 0 : m.querySelector) == null ? void 0 : p.call(
      m,
      `.mjr-model3d-render-canvas[data-mjr-asset-id="${C}"]`
    )) || null), a || (a = ((b = (g = t._contentEl) == null ? void 0 : g.querySelector) == null ? void 0 : b.call(g, ".mjr-model3d-render-canvas")) || null);
  }
  if (!a) {
    const C = me(n);
    if (!C) return;
    a = await new Promise((_) => {
      const y = new Image();
      y.crossOrigin = "anonymous", y.onload = () => _(y), y.onerror = () => _(null), y.src = C;
    });
  }
  if (!a) return;
  const d = a.videoWidth || a.naturalWidth || i, c = a.videoHeight || a.naturalHeight || r;
  if (!d || !c) return;
  const f = Math.min(i / d, r / c);
  e.drawImage(
    a,
    o + (i - d * f) / 2,
    s + (r - c * f) / 2,
    d * f,
    c * f
  );
}
function Mo(t, e, n, o) {
  if (!e || !n || !t._genInfoSelections.size) return 0;
  const s = t._getGenFields(n), i = [
    "prompt",
    "seed",
    "model",
    "lora",
    "sampler",
    "scheduler",
    "cfg",
    "step",
    "genTime"
  ], r = 11, l = 16, u = 8, a = Math.max(100, Number(o || 0) - u * 2);
  let d = 0;
  for (const c of i) {
    if (!t._genInfoSelections.has(c)) continue;
    const f = s[c] != null ? String(s[c]) : "";
    if (!f) continue;
    let h = c.charAt(0).toUpperCase() + c.slice(1);
    c === "lora" ? h = "LoRA" : c === "cfg" ? h = "CFG" : c === "genTime" && (h = "Gen Time");
    const m = `${h}: `;
    e.font = `bold ${r}px system-ui, sans-serif`;
    const p = e.measureText(m).width;
    e.font = `${r}px system-ui, sans-serif`;
    const g = Math.max(32, a - u * 2 - p);
    let b = 0, C = "";
    for (const _ of f.split(" ")) {
      const y = C ? C + " " + _ : _;
      e.measureText(y).width > g && C ? (b += 1, C = _) : C = y;
    }
    C && (b += 1), d += b;
  }
  return d > 0 ? d * l + u * 2 : 0;
}
function Bo(t, e, n, o, s, i, r) {
  if (!n || !t._genInfoSelections.size) return;
  const l = t._getGenFields(n), u = {
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
  for (const S of a) {
    if (!t._genInfoSelections.has(S)) continue;
    const x = l[S] != null ? String(l[S]) : "";
    if (!x) continue;
    let B = S.charAt(0).toUpperCase() + S.slice(1);
    S === "lora" ? B = "LoRA" : S === "cfg" ? B = "CFG" : S === "genTime" && (B = "Gen Time"), d.push({
      label: `${B}: `,
      value: x,
      color: u[S] || "#ffffff"
    });
  }
  if (!d.length) return;
  const c = 11, f = 16, h = 8, m = Math.max(100, i - h * 2);
  e.save();
  const p = [];
  for (const { label: S, value: x, color: B } of d) {
    e.font = `bold ${c}px system-ui, sans-serif`;
    const F = e.measureText(S).width;
    e.font = `${c}px system-ui, sans-serif`;
    const P = m - h * 2 - F, L = [];
    let I = "";
    for (const V of x.split(" ")) {
      const U = I ? I + " " + V : V;
      e.measureText(U).width > P && I ? (L.push(I), I = V) : I = U;
    }
    I && L.push(I), p.push({ label: S, labelW: F, lines: L, color: B });
  }
  const b = p.reduce((S, x) => S + x.lines.length, 0) * f + h * 2, C = o + h, _ = s + r - b - h;
  e.globalAlpha = 0.72, e.fillStyle = "#000", he(e, C, _, m, b, 6), e.fill(), e.globalAlpha = 1;
  let y = _ + h + c;
  for (const { label: S, labelW: x, lines: B, color: F } of p)
    for (let P = 0; P < B.length; P++)
      P === 0 ? (e.font = `bold ${c}px system-ui, sans-serif`, e.fillStyle = F, e.fillText(S, C + h, y), e.font = `${c}px system-ui, sans-serif`, e.fillStyle = "rgba(255,255,255,0.88)", e.fillText(B[P], C + h + x, y)) : (e.font = `${c}px system-ui, sans-serif`, e.fillStyle = "rgba(255,255,255,0.88)", e.fillText(B[P], C + h + x, y)), y += f;
  e.restore();
}
async function No(t) {
  var u;
  if (!t._contentEl) return;
  t._captureBtn && (t._captureBtn.disabled = !0, t._captureBtn.setAttribute("aria-label", v("tooltip.capturingView", "Capturing…")));
  const e = t._contentEl.clientWidth || 480, n = t._contentEl.clientHeight || 360;
  let o = n;
  if (t._mode === T.SIMPLE && t._mediaA && t._genInfoSelections.size) {
    const a = document.createElement("canvas");
    a.width = e, a.height = n;
    const d = a.getContext("2d"), c = t._estimateGenInfoOverlayHeight(d, t._mediaA, e);
    if (c > 0) {
      const f = Math.max(n, c + 24);
      o = Math.min(f, n * 4);
    }
  }
  const s = document.createElement("canvas");
  s.width = e, s.height = o;
  const i = s.getContext("2d");
  i.fillStyle = "#0d0d0d", i.fillRect(0, 0, e, o);
  try {
    if (t._mode === T.SIMPLE)
      t._mediaA && (await t._drawMediaFit(i, t._mediaA, 0, 0, e, n), t._drawGenInfoOverlay(i, t._mediaA, 0, 0, e, o));
    else if (t._mode === T.AB) {
      const a = Math.round(t._abDividerX * e), d = t._contentEl.querySelector(
        ".mjr-mfv-ab-layer:not(.mjr-mfv-ab-layer--b) video"
      ), c = t._contentEl.querySelector(".mjr-mfv-ab-layer--b video");
      t._mediaA && await t._drawMediaFit(i, t._mediaA, 0, 0, e, o, d), t._mediaB && (i.save(), i.beginPath(), i.rect(a, 0, e - a, o), i.clip(), await t._drawMediaFit(i, t._mediaB, 0, 0, e, o, c), i.restore()), i.save(), i.strokeStyle = "rgba(255,255,255,0.88)", i.lineWidth = 2, i.beginPath(), i.moveTo(a, 0), i.lineTo(a, o), i.stroke(), i.restore(), ut(i, "A", 8, 8), ut(i, "B", a + 8, 8), t._mediaA && t._drawGenInfoOverlay(i, t._mediaA, 0, 0, a, o), t._mediaB && t._drawGenInfoOverlay(i, t._mediaB, a, 0, e - a, o);
    } else if (t._mode === T.SIDE) {
      const a = Math.floor(e / 2), d = t._contentEl.querySelector(".mjr-mfv-side-panel:first-child video"), c = t._contentEl.querySelector(".mjr-mfv-side-panel:last-child video");
      t._mediaA && (await t._drawMediaFit(i, t._mediaA, 0, 0, a, o, d), t._drawGenInfoOverlay(i, t._mediaA, 0, 0, a, o)), i.fillStyle = "#111", i.fillRect(a, 0, 2, o), t._mediaB && (await t._drawMediaFit(i, t._mediaB, a, 0, a, o, c), t._drawGenInfoOverlay(i, t._mediaB, a, 0, a, o)), ut(i, "A", 8, 8), ut(i, "B", a + 8, 8);
    } else if (t._mode === T.GRID) {
      const a = Math.floor(e / 2), d = Math.floor(o / 2), c = 1, f = [
        { media: t._mediaA, label: "A", x: 0, y: 0, w: a - c, h: d - c },
        {
          media: t._mediaB,
          label: "B",
          x: a + c,
          y: 0,
          w: a - c,
          h: d - c
        },
        {
          media: t._mediaC,
          label: "C",
          x: 0,
          y: d + c,
          w: a - c,
          h: d - c
        },
        {
          media: t._mediaD,
          label: "D",
          x: a + c,
          y: d + c,
          w: a - c,
          h: d - c
        }
      ], h = t._contentEl.querySelectorAll(".mjr-mfv-grid-cell");
      for (let m = 0; m < f.length; m++) {
        const p = f[m], g = ((u = h[m]) == null ? void 0 : u.querySelector("video")) || null;
        p.media && (await t._drawMediaFit(i, p.media, p.x, p.y, p.w, p.h, g), t._drawGenInfoOverlay(i, p.media, p.x, p.y, p.w, p.h)), ut(i, p.label, p.x + 8, p.y + 8);
      }
      i.save(), i.fillStyle = "#111", i.fillRect(a - c, 0, c * 2, o), i.fillRect(0, d - c, e, c * 2), i.restore();
    }
  } catch (a) {
    console.debug("[MFV] capture error:", a);
  }
  const l = `${{
    [T.AB]: "mfv-ab",
    [T.SIDE]: "mfv-side",
    [T.GRID]: "mfv-grid"
  }[t._mode] ?? "mfv"}-${Date.now()}.png`;
  try {
    const a = s.toDataURL("image/png"), d = document.createElement("a");
    d.href = a, d.download = l, document.body.appendChild(d), d.click(), setTimeout(() => document.body.removeChild(d), 100);
  } catch (a) {
    console.warn("[MFV] download failed:", a);
  } finally {
    t._captureBtn && (t._captureBtn.disabled = !1, t._captureBtn.setAttribute("aria-label", v("tooltip.captureView", "Save view as image")));
  }
}
function xo(t, e, { autoMode: n = !1 } = {}) {
  if (t._mediaA = e || null, t._resetMfvZoom(), n && t._mode !== T.SIMPLE && (t._mode = T.SIMPLE, t._updateModeBtnUI()), t._mediaA && typeof Ct == "function") {
    const o = ++t._refreshGen;
    (async () => {
      var s;
      try {
        const i = await Ct(t._mediaA, {
          getAssetMetadata: Ft,
          getFileMetadataScoped: Lt
        });
        if (t._refreshGen !== o) return;
        i && typeof i == "object" && (t._mediaA = i, t._refresh());
      } catch (i) {
        (s = console.debug) == null || s.call(console, "[MFV] metadata enrich error", i);
      }
    })();
  } else
    t._refresh();
}
function Po(t, e, n) {
  t._mediaA = e || null, t._mediaB = n || null, t._resetMfvZoom(), t._mode === T.SIMPLE && (t._mode = T.AB, t._updateModeBtnUI());
  const o = ++t._refreshGen, s = async (i) => {
    if (!i) return i;
    try {
      return await Ct(i, {
        getAssetMetadata: Ft,
        getFileMetadataScoped: Lt
      }) || i;
    } catch {
      return i;
    }
  };
  (async () => {
    const [i, r] = await Promise.all([s(t._mediaA), s(t._mediaB)]);
    t._refreshGen === o && (t._mediaA = i || null, t._mediaB = r || null, t._refresh());
  })();
}
function Lo(t, e, n, o, s) {
  t._mediaA = e || null, t._mediaB = n || null, t._mediaC = o || null, t._mediaD = s || null, t._resetMfvZoom(), t._mode !== T.GRID && (t._mode = T.GRID, t._updateModeBtnUI());
  const i = ++t._refreshGen, r = async (l) => {
    if (!l) return l;
    try {
      return await Ct(l, {
        getAssetMetadata: Ft,
        getFileMetadataScoped: Lt
      }) || l;
    } catch {
      return l;
    }
  };
  (async () => {
    const [l, u, a, d] = await Promise.all([
      r(t._mediaA),
      r(t._mediaB),
      r(t._mediaC),
      r(t._mediaD)
    ]);
    t._refreshGen === i && (t._mediaA = l || null, t._mediaB = u || null, t._mediaC = a || null, t._mediaD = d || null, t._refresh());
  })();
}
function ot(t) {
  var e, n, o, s;
  try {
    return !!((e = t == null ? void 0 : t.classList) != null && e.contains("mjr-mfv-simple-player")) || !!((n = t == null ? void 0 : t.classList) != null && n.contains("mjr-mfv-player-host")) || !!((o = t == null ? void 0 : t.querySelector) != null && o.call(t, ".mjr-video-controls, .mjr-mfv-simple-player-controls"));
  } catch (i) {
    return (s = console.debug) == null || s.call(console, i), !1;
  }
}
let Fo = 0;
class ko {
  constructor({ controller: e = null } = {}) {
    this._instanceId = ++Fo, this._controller = e && typeof e == "object" ? { ...e } : null, this.element = null, this.isVisible = !1, this._contentEl = null, this._closeBtn = null, this._modeBtn = null, this._pinGroup = null, this._pinBtns = null, this._liveBtn = null, this._genBtn = null, this._genDropdown = null, this._captureBtn = null, this._genInfoSelections = /* @__PURE__ */ new Set(["genTime"]), this._mode = T.SIMPLE, this._mediaA = null, this._mediaB = null, this._mediaC = null, this._mediaD = null, this._pinnedSlots = /* @__PURE__ */ new Set(), this._abDividerX = 0.5, this._zoom = 1, this._panX = 0, this._panY = 0, this._panzoomAC = null, this._dragging = !1, this._compareSyncAC = null, this._btnAC = null, this._refreshGen = 0, this._popoutWindow = null, this._popoutBtn = null, this._isPopped = !1, this._desktopExpanded = !1, this._desktopExpandRestore = null, this._desktopPopoutUnsupported = !1, this._popoutCloseHandler = null, this._popoutKeydownHandler = null, this._popoutCloseTimer = null, this._popoutRestoreGuard = !1, this._previewBtn = null, this._previewBlobUrl = null, this._previewActive = !1, this._nodeStreamBtn = null, this._nodeStreamActive = !1, this._docAC = new AbortController(), this._popoutAC = null, this._panelAC = new AbortController(), this._resizeState = null, this._titleId = `mjr-mfv-title-${this._instanceId}`, this._genDropdownId = `mjr-mfv-gen-dropdown-${this._instanceId}`, this._progressEl = null, this._progressNodesEl = null, this._progressStepsEl = null, this._progressTextEl = null, this._mediaProgressEl = null, this._mediaProgressTextEl = null, this._progressUpdateHandler = null, this._progressCurrentNodeId = null, this._docClickHost = null, this._handleDocClick = null, this._mediaControlHandles = [], this._layoutObserver = null, this._channel = "rgb", this._exposureEV = 0, this._gridMode = 0, this._overlayMaskEnabled = !1, this._overlayMaskOpacity = 0.65, this._overlayFormat = "image";
  }
  _dispatchControllerAction(e, n) {
    var o, s, i;
    try {
      const r = (o = this._controller) == null ? void 0 : o[e];
      if (typeof r == "function")
        return r();
    } catch (r) {
      (s = console.debug) == null || s.call(console, r);
    }
    if (n)
      try {
        window.dispatchEvent(new Event(n));
      } catch (r) {
        (i = console.debug) == null || i.call(console, r);
      }
  }
  _forwardKeydownToController(e) {
    var n, o, s;
    try {
      const i = (n = this._controller) == null ? void 0 : n.handleForwardedKeydown;
      if (typeof i == "function") {
        i(e);
        return;
      }
    } catch (i) {
      (o = console.debug) == null || o.call(console, i);
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
    return Pn(this);
  }
  _buildHeader() {
    return Ln(this);
  }
  _buildToolbar() {
    return Fn(this);
  }
  _rebindControlHandlers() {
    return In(this);
  }
  _updateSettingsBtnState(e) {
    return Tn(this, e);
  }
  _applySidebarPosition() {
    return kn(this);
  }
  refreshSidebar() {
    var e;
    (e = this._sidebar) == null || e.refresh();
  }
  _resetGenDropdownForCurrentDocument() {
    return jn(this);
  }
  _bindDocumentUiHandlers() {
    return Gn(this);
  }
  _unbindDocumentUiHandlers() {
    return Vn(this);
  }
  _isGenDropdownOpen() {
    return Rn(this);
  }
  _openGenDropdown() {
    return On(this);
  }
  _closeGenDropdown() {
    return Hn(this);
  }
  _updateGenBtnUI() {
    return Dn(this);
  }
  _buildGenDropdown() {
    return vn(this);
  }
  _getGenFields(e) {
    return zn(this, e);
  }
  _buildGenInfoDOM(e) {
    return Wn(this, e);
  }
  _notifyModeChanged() {
    return Yn(this);
  }
  _cycleMode() {
    return Qn(this);
  }
  setMode(e) {
    return qn(this, e);
  }
  getPinnedSlots() {
    return Xn(this);
  }
  _updatePinUI() {
    return Zn(this);
  }
  _updateModeBtnUI() {
    return Kn(this);
  }
  setLiveActive(e) {
    return Jn(this, e);
  }
  setPreviewActive(e) {
    return wn(this, e);
  }
  loadPreviewBlob(e, n = {}) {
    return $n(this, e, n);
  }
  _revokePreviewBlob() {
    return to(this);
  }
  setNodeStreamActive(e) {
    return eo(this);
  }
  loadMediaA(e, { autoMode: n = !1 } = {}) {
    return xo(this, e, { autoMode: n });
  }
  /**
   * Load two assets for compare modes.
   * Auto-switches from SIMPLE → AB on first call.
   */
  loadMediaPair(e, n) {
    return Po(this, e, n);
  }
  /**
   * Load up to 4 assets for grid compare mode.
   * Auto-switches to GRID mode if not already.
   */
  loadMediaQuad(e, n, o, s) {
    return Lo(this, e, n, o, s);
  }
  /** Apply current zoom+pan state to all media elements (img/video only — divider/overlays unaffected). */
  _applyTransform() {
    if (!this._contentEl) return;
    const e = Math.max(Mt, Math.min(Bt, this._zoom)), n = this._contentEl.clientWidth || 0, o = this._contentEl.clientHeight || 0, s = Math.max(0, (e - 1) * n / 2), i = Math.max(0, (e - 1) * o / 2);
    this._panX = Math.max(-s, Math.min(s, this._panX)), this._panY = Math.max(-i, Math.min(i, this._panY));
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
    const o = document.createElementNS(e, "defs"), s = [
      ["mjr-mfv-ch-r", "1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 1 0"],
      ["mjr-mfv-ch-g", "0 1 0 0 0  0 1 0 0 0  0 1 0 0 0  0 0 0 1 0"],
      ["mjr-mfv-ch-b", "0 0 1 0 0  0 0 1 0 0  0 0 1 0 0  0 0 0 1 0"],
      ["mjr-mfv-ch-a", "0 0 0 1 0  0 0 0 1 0  0 0 0 1 0  0 0 0 1 0"],
      ["mjr-mfv-ch-l", "0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0"]
    ];
    for (const [l, u] of s) {
      const a = document.createElementNS(e, "filter");
      a.setAttribute("id", l);
      const d = document.createElementNS(e, "feColorMatrix");
      d.setAttribute("type", "matrix"), d.setAttribute("values", u), a.appendChild(d), o.appendChild(a);
    }
    return n.appendChild(o), (r = this.element) == null || r.appendChild(n), this._toneFilterDefsEl = n, n;
  }
  _applyMediaToneControls() {
    var l, u, a;
    if (this._ensureToneFilterDefs(), !this._contentEl) return;
    const e = String(this._channel || "rgb"), n = Math.pow(2, Number(this._exposureEV) || 0), o = e === "rgb" ? "" : `url(#mjr-mfv-ch-${e})`, s = Math.abs(n - 1) < 1e-4 ? "" : `brightness(${n})`, i = [o, s].filter(Boolean).join(" ").trim(), r = ((u = (l = this._contentEl).querySelectorAll) == null ? void 0 : u.call(l, ".mjr-mfv-media")) || [];
    for (const d of r)
      try {
        d.style.filter = i || "";
      } catch (c) {
        (a = console.debug) == null || a.call(console, c);
      }
  }
  _getOverlayAspect(e, n, o) {
    var s;
    try {
      const i = String(e || "image");
      if (i === "image") {
        const r = Number(n == null ? void 0 : n.videoWidth) || Number(n == null ? void 0 : n.naturalWidth) || Number(o == null ? void 0 : o.width) || 1, l = Number(n == null ? void 0 : n.videoHeight) || Number(n == null ? void 0 : n.naturalHeight) || Number(o == null ? void 0 : o.height) || 1, u = r / l;
        return Number.isFinite(u) && u > 0 ? u : 1;
      }
      if (i === "16:9") return 16 / 9;
      if (i === "9:16") return 9 / 16;
      if (i === "1:1") return 1;
      if (i === "4:3") return 4 / 3;
      if (i === "2.39") return 2.39;
    } catch (i) {
      (s = console.debug) == null || s.call(console, i);
    }
    return 1;
  }
  _fitAspectInBox(e, n, o) {
    var s;
    try {
      const i = Number(e) || 0, r = Number(n) || 0, l = Number(o) || 1;
      if (!(i > 0 && r > 0 && l > 0)) return { x: 0, y: 0, w: i, h: r };
      const u = i / r;
      let a = i, d = r;
      return l >= u ? d = i / l : a = r * l, { x: (i - a) / 2, y: (r - d) / 2, w: a, h: d };
    } catch (i) {
      return (s = console.debug) == null || s.call(console, i), { x: 0, y: 0, w: Number(e) || 0, h: Number(n) || 0 };
    }
  }
  _drawMaskOutside(e, n, o, s) {
    var i;
    try {
      const r = Math.max(0, Math.min(0.92, Number(s) || 0));
      if (!(r > 0)) return;
      e.save(), e.fillStyle = `rgba(0,0,0,${r})`, e.fillRect(0, 0, n.width, n.height), e.globalCompositeOperation = "destination-out";
      for (const l of o)
        !l || !(l.w > 1 && l.h > 1) || e.fillRect(l.x, l.y, l.w, l.h);
      e.restore();
    } catch (r) {
      (i = console.debug) == null || i.call(console, r);
    }
  }
  _redrawOverlayGuides() {
    var h, m, p, g, b, C;
    const e = this._overlayCanvas, n = this._contentEl;
    if (!e || !n) return;
    const o = (h = e.getContext) == null ? void 0 : h.call(e, "2d");
    if (!o) return;
    const s = Math.max(1, Math.min(3, Number(window.devicePixelRatio) || 1)), i = n.clientWidth || 0, r = n.clientHeight || 0;
    if (e.width = Math.max(1, Math.floor(i * s)), e.height = Math.max(1, Math.floor(r * s)), e.style.width = `${i}px`, e.style.height = `${r}px`, o.clearRect(0, 0, e.width, e.height), !(this._gridMode || this._overlayMaskEnabled)) return;
    const l = (m = n.getBoundingClientRect) == null ? void 0 : m.call(n);
    if (!l) return;
    const u = Array.from(
      ((p = n.querySelectorAll) == null ? void 0 : p.call(
        n,
        ".mjr-mfv-simple-container, .mjr-mfv-side-panel, .mjr-mfv-grid-cell, .mjr-mfv-ab-layer"
      )) || []
    ), a = u.length ? u : [n], d = [];
    for (const _ of a) {
      const y = (g = _.querySelector) == null ? void 0 : g.call(_, ".mjr-mfv-media");
      if (!y) continue;
      const S = (b = _.getBoundingClientRect) == null ? void 0 : b.call(_);
      if (!(S != null && S.width) || !(S != null && S.height)) continue;
      const x = Number(S.width) || 0, B = Number(S.height) || 0, F = this._getOverlayAspect(this._overlayFormat, y, S), P = this._fitAspectInBox(x, B, F), L = S.left - l.left + x / 2, I = S.top - l.top + B / 2, V = Math.max(0.1, Math.min(16, Number(this._zoom) || 1)), U = {
        x: L + P.x * V - x * V / 2 + (Number(this._panX) || 0),
        y: I + P.y * V - B * V / 2 + (Number(this._panY) || 0),
        w: P.w * V,
        h: P.h * V
      };
      d.push({
        x: U.x * s,
        y: U.y * s,
        w: U.w * s,
        h: U.h * s
      });
    }
    if (!d.length) return;
    if (this._overlayMaskEnabled) {
      this._drawMaskOutside(o, e, d, this._overlayMaskOpacity), o.save(), (C = o.setLineDash) == null || C.call(o, [Math.max(2, 4 * s), Math.max(2, 3 * s)]), o.strokeStyle = "rgba(255,255,255,0.22)", o.lineWidth = Math.max(1, Math.floor(s));
      for (const _ of d)
        o.strokeRect(_.x + 0.5, _.y + 0.5, _.w - 1, _.h - 1);
      o.restore();
    }
    if (this._mode !== T.SIMPLE || !this._gridMode) return;
    const c = d[0];
    if (!c) return;
    o.save(), o.translate(c.x, c.y), o.strokeStyle = "rgba(255,255,255,0.22)", o.lineWidth = Math.max(2, Math.round(1.25 * s));
    const f = (_, y, S, x) => {
      o.beginPath(), o.moveTo(Math.round(_) + 0.5, Math.round(y) + 0.5), o.lineTo(Math.round(S) + 0.5, Math.round(x) + 0.5), o.stroke();
    };
    this._gridMode === 1 ? (f(c.w / 3, 0, c.w / 3, c.h), f(2 * c.w / 3, 0, 2 * c.w / 3, c.h), f(0, c.h / 3, c.w, c.h / 3), f(0, 2 * c.h / 3, c.w, 2 * c.h / 3)) : this._gridMode === 2 ? (f(c.w / 2, 0, c.w / 2, c.h), f(0, c.h / 2, c.w, c.h / 2)) : this._gridMode === 3 && (o.strokeRect(c.w * 0.1 + 0.5, c.h * 0.1 + 0.5, c.w * 0.8 - 1, c.h * 0.8 - 1), o.strokeRect(c.w * 0.05 + 0.5, c.h * 0.05 + 0.5, c.w * 0.9 - 1, c.h * 0.9 - 1)), o.restore();
  }
  /**
   * Set zoom, optionally centered at (clientX, clientY).
   * Keeps the image point under the cursor stationary.
   */
  _setMfvZoom(e, n, o) {
    const s = Math.max(Mt, Math.min(Bt, this._zoom)), i = Math.max(Mt, Math.min(Bt, Number(e) || 1));
    if (n != null && o != null && this._contentEl) {
      const r = i / s, l = this._contentEl.getBoundingClientRect(), u = n - (l.left + l.width / 2), a = o - (l.top + l.height / 2);
      this._panX = this._panX * r + (1 - r) * u, this._panY = this._panY * r + (1 - r) * a;
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
      } catch (o) {
        (n = console.debug) == null || n.call(console, o), this._layoutObserver = null;
      }
  }
  _unbindLayoutObserver() {
    var e, n, o;
    try {
      (n = (e = this._layoutObserver) == null ? void 0 : e.disconnect) == null || n.call(e);
    } catch (s) {
      (o = console.debug) == null || o.call(console, s);
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
        var h, m, p, g;
        if ((m = (h = a.target) == null ? void 0 : h.closest) != null && m.call(h, "audio") || (g = (p = a.target) == null ? void 0 : p.closest) != null && g.call(p, ".mjr-video-controls, .mjr-mfv-simple-player-controls") || Et(a.target)) return;
        const d = qe(a.target, e);
        if (d && Xe(
          d,
          Number(a.deltaX || 0),
          Number(a.deltaY || 0)
        ))
          return;
        a.preventDefault();
        const f = 1 - (a.deltaY || a.deltaX || 0) * ke;
        this._setMfvZoom(this._zoom * f, a.clientX, a.clientY);
      },
      { ...n, passive: !1 }
    );
    let o = !1, s = 0, i = 0, r = 0, l = 0;
    e.addEventListener(
      "pointerdown",
      (a) => {
        var d, c, f, h, m, p, g, b, C;
        if (!(a.button !== 0 && a.button !== 1) && !(this._zoom <= 1.01) && !((c = (d = a.target) == null ? void 0 : d.closest) != null && c.call(d, "video")) && !((h = (f = a.target) == null ? void 0 : f.closest) != null && h.call(f, "audio")) && !((p = (m = a.target) == null ? void 0 : m.closest) != null && p.call(m, ".mjr-video-controls, .mjr-mfv-simple-player-controls")) && !((b = (g = a.target) == null ? void 0 : g.closest) != null && b.call(g, ".mjr-mfv-ab-divider")) && !Et(a.target)) {
          a.preventDefault(), o = !0, this._dragging = !0, s = a.clientX, i = a.clientY, r = this._panX, l = this._panY;
          try {
            e.setPointerCapture(a.pointerId);
          } catch (_) {
            (C = console.debug) == null || C.call(console, _);
          }
          this._applyTransform();
        }
      },
      n
    ), e.addEventListener(
      "pointermove",
      (a) => {
        o && (this._panX = r + (a.clientX - s), this._panY = l + (a.clientY - i), this._applyTransform());
      },
      n
    );
    const u = (a) => {
      var d;
      if (o) {
        o = !1, this._dragging = !1;
        try {
          e.releasePointerCapture(a.pointerId);
        } catch (c) {
          (d = console.debug) == null || d.call(console, c);
        }
        this._applyTransform();
      }
    };
    e.addEventListener("pointerup", u, n), e.addEventListener("pointercancel", u, n), e.addEventListener(
      "dblclick",
      (a) => {
        var c, f, h, m, p, g;
        if ((f = (c = a.target) == null ? void 0 : c.closest) != null && f.call(c, "video") || (m = (h = a.target) == null ? void 0 : h.closest) != null && m.call(h, "audio") || (g = (p = a.target) == null ? void 0 : p.closest) != null && g.call(p, ".mjr-video-controls, .mjr-mfv-simple-player-controls") || Et(a.target)) return;
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
    } catch (o) {
      (n = console.debug) == null || n.call(console, o);
    }
    this._panzoomAC = null, this._dragging = !1;
  }
  _destroyCompareSync() {
    var e, n, o;
    try {
      (n = (e = this._compareSyncAC) == null ? void 0 : e.abort) == null || n.call(e);
    } catch (s) {
      (o = console.debug) == null || o.call(console, s);
    }
    this._compareSyncAC = null;
  }
  _destroyMediaControls() {
    var n, o;
    const e = Array.isArray(this._mediaControlHandles) ? this._mediaControlHandles : [];
    for (const s of e)
      try {
        (n = s == null ? void 0 : s.destroy) == null || n.call(s);
      } catch (i) {
        (o = console.debug) == null || o.call(console, i);
      }
    this._mediaControlHandles = [];
  }
  _trackMediaControls(e) {
    var n;
    try {
      const o = (e == null ? void 0 : e._mjrMediaControlsHandle) || null;
      o != null && o.destroy && this._mediaControlHandles.push(o);
    } catch (o) {
      (n = console.debug) == null || n.call(console, o);
    }
    return e;
  }
  _initCompareSync() {
    var e;
    if (this._destroyCompareSync(), !!this._contentEl && this._mode !== T.SIMPLE)
      try {
        const n = Array.from(this._contentEl.querySelectorAll("video, audio"));
        if (n.length < 2) return;
        const o = n[0] || null, s = n.slice(1);
        if (!o || !s.length) return;
        this._compareSyncAC = Ie(o, s, { threshold: 0.08 });
      } catch (n) {
        (e = console.debug) == null || e.call(console, n);
      }
  }
  // ── Render ────────────────────────────────────────────────────────────────
  _refresh() {
    if (!this._contentEl) return;
    this._destroyPanZoom(), this._destroyCompareSync(), this._destroyMediaControls();
    const e = this._overlayCanvas || null;
    switch (this._contentEl.replaceChildren(), this._contentEl.style.overflow = "hidden", this._mode) {
      case T.SIMPLE:
        this._renderSimple();
        break;
      case T.AB:
        this._renderAB();
        break;
      case T.SIDE:
        this._renderSide();
        break;
      case T.GRID:
        this._renderGrid();
        break;
    }
    e && this._contentEl.appendChild(e), this._mediaProgressEl && this._contentEl.appendChild(this._mediaProgressEl), this._applyMediaToneControls(), this._applyTransform(), this._initPanZoom(this._contentEl), this._initCompareSync();
  }
  _renderSimple() {
    var i;
    if (!this._mediaA) {
      this._contentEl.appendChild(Q());
      return;
    }
    const e = X(this._mediaA), n = nt(this._mediaA), o = ((i = this._trackMediaControls) == null ? void 0 : i.call(this, n)) || n;
    if (!o) {
      this._contentEl.appendChild(Q("Could not load media"));
      return;
    }
    const s = document.createElement("div");
    if (s.className = "mjr-mfv-simple-container", s.appendChild(o), e !== "audio") {
      const r = this._buildGenInfoDOM(this._mediaA);
      if (r) {
        const l = document.createElement("div");
        l.className = "mjr-mfv-geninfo", ot(o) && l.classList.add("mjr-mfv-geninfo--above-player"), l.appendChild(r), s.appendChild(l);
      }
    }
    this._contentEl.appendChild(s);
  }
  _renderAB() {
    var b, C, _;
    const e = this._mediaA ? nt(this._mediaA, { fill: !0 }) : null, n = this._mediaB ? nt(this._mediaB, { fill: !0 }) : null, o = ((b = this._trackMediaControls) == null ? void 0 : b.call(this, e)) || e, s = ((C = this._trackMediaControls) == null ? void 0 : C.call(this, n)) || n, i = this._mediaA ? X(this._mediaA) : "", r = this._mediaB ? X(this._mediaB) : "";
    if (!o && !s) {
      this._contentEl.appendChild(Q("Select 2 assets for A/B compare"));
      return;
    }
    if (!s) {
      this._renderSimple();
      return;
    }
    if (i === "audio" || r === "audio" || i === "model3d" || r === "model3d") {
      this._renderSide();
      return;
    }
    const l = document.createElement("div");
    l.className = "mjr-mfv-ab-container";
    const u = document.createElement("div");
    u.className = "mjr-mfv-ab-layer", o && u.appendChild(o);
    const a = document.createElement("div");
    a.className = "mjr-mfv-ab-layer mjr-mfv-ab-layer--b";
    const d = Math.round(this._abDividerX * 100);
    a.style.clipPath = `inset(0 0 0 ${d}%)`, a.appendChild(s);
    const c = document.createElement("div");
    c.className = "mjr-mfv-ab-divider", c.style.left = `${d}%`;
    const f = this._buildGenInfoDOM(this._mediaA);
    let h = null;
    f && (h = document.createElement("div"), h.className = "mjr-mfv-geninfo-a", ot(o) && h.classList.add("mjr-mfv-geninfo--above-player"), h.appendChild(f), h.style.right = `calc(${100 - d}% + 8px)`);
    const m = this._buildGenInfoDOM(this._mediaB);
    let p = null;
    m && (p = document.createElement("div"), p.className = "mjr-mfv-geninfo-b", ot(s) && p.classList.add("mjr-mfv-geninfo--above-player"), p.appendChild(m), p.style.left = `calc(${d}% + 8px)`);
    let g = null;
    c.addEventListener(
      "pointerdown",
      (y) => {
        y.preventDefault(), c.setPointerCapture(y.pointerId);
        try {
          g == null || g.abort();
        } catch {
        }
        g = new AbortController();
        const S = g.signal, x = l.getBoundingClientRect(), B = (P) => {
          const L = Math.max(0.02, Math.min(0.98, (P.clientX - x.left) / x.width));
          this._abDividerX = L;
          const I = Math.round(L * 100);
          a.style.clipPath = `inset(0 0 0 ${I}%)`, c.style.left = `${I}%`, h && (h.style.right = `calc(${100 - I}% + 8px)`), p && (p.style.left = `calc(${I}% + 8px)`);
        }, F = () => {
          try {
            g == null || g.abort();
          } catch {
          }
        };
        c.addEventListener("pointermove", B, { signal: S }), c.addEventListener("pointerup", F, { signal: S });
      },
      (_ = this._panelAC) != null && _.signal ? { signal: this._panelAC.signal } : void 0
    ), l.appendChild(u), l.appendChild(a), l.appendChild(c), h && l.appendChild(h), p && l.appendChild(p), l.appendChild(et("A", "left")), l.appendChild(et("B", "right")), this._contentEl.appendChild(l);
  }
  _renderSide() {
    var f, h;
    const e = this._mediaA ? nt(this._mediaA) : null, n = this._mediaB ? nt(this._mediaB) : null, o = ((f = this._trackMediaControls) == null ? void 0 : f.call(this, e)) || e, s = ((h = this._trackMediaControls) == null ? void 0 : h.call(this, n)) || n, i = this._mediaA ? X(this._mediaA) : "", r = this._mediaB ? X(this._mediaB) : "";
    if (!o && !s) {
      this._contentEl.appendChild(Q("Select 2 assets for Side-by-Side"));
      return;
    }
    const l = document.createElement("div");
    l.className = "mjr-mfv-side-container";
    const u = document.createElement("div");
    u.className = "mjr-mfv-side-panel", o ? u.appendChild(o) : u.appendChild(Q("—")), u.appendChild(et("A", "left"));
    const a = i === "audio" ? null : this._buildGenInfoDOM(this._mediaA);
    if (a) {
      const m = document.createElement("div");
      m.className = "mjr-mfv-geninfo-a", ot(o) && m.classList.add("mjr-mfv-geninfo--above-player"), m.appendChild(a), u.appendChild(m);
    }
    const d = document.createElement("div");
    d.className = "mjr-mfv-side-panel", s ? d.appendChild(s) : d.appendChild(Q("—")), d.appendChild(et("B", "right"));
    const c = r === "audio" ? null : this._buildGenInfoDOM(this._mediaB);
    if (c) {
      const m = document.createElement("div");
      m.className = "mjr-mfv-geninfo-b", ot(s) && m.classList.add("mjr-mfv-geninfo--above-player"), m.appendChild(c), d.appendChild(m);
    }
    l.appendChild(u), l.appendChild(d), this._contentEl.appendChild(l);
  }
  _renderGrid() {
    var s;
    const e = [
      { media: this._mediaA, label: "A" },
      { media: this._mediaB, label: "B" },
      { media: this._mediaC, label: "C" },
      { media: this._mediaD, label: "D" }
    ];
    if (!e.filter((i) => i.media).length) {
      this._contentEl.appendChild(Q("Select up to 4 assets for Grid Compare"));
      return;
    }
    const o = document.createElement("div");
    o.className = "mjr-mfv-grid-container";
    for (const { media: i, label: r } of e) {
      const l = document.createElement("div");
      if (l.className = "mjr-mfv-grid-cell", i) {
        const u = X(i), a = nt(i), d = ((s = this._trackMediaControls) == null ? void 0 : s.call(this, a)) || a;
        if (d ? l.appendChild(d) : l.appendChild(Q("—")), l.appendChild(
          et(r, r === "A" || r === "C" ? "left" : "right")
        ), u !== "audio") {
          const c = this._buildGenInfoDOM(i);
          if (c) {
            const f = document.createElement("div");
            f.className = `mjr-mfv-geninfo-${r.toLowerCase()}`, ot(d) && f.classList.add("mjr-mfv-geninfo--above-player"), f.appendChild(c), l.appendChild(f);
          }
        }
      } else
        l.appendChild(Q("—")), l.appendChild(
          et(r, r === "A" || r === "C" ? "left" : "right")
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
    this.element && (this._destroyPanZoom(), this._destroyCompareSync(), this._stopEdgeResize(), this._closeGenDropdown(), Ze(this.element), this.element.classList.remove("is-visible"), this.element.setAttribute("aria-hidden", "true"), this.isVisible = !1);
  }
  // ── Pop-out / Pop-in (separate OS window for second monitor) ────────────
  _setDesktopExpanded(e) {
    return io(this, e);
  }
  _activateDesktopExpandedFallback(e) {
    return ao(this, e);
  }
  _tryElectronPopupFallback(e, n, o, s) {
    return ro(this, e, n, o, s);
  }
  popOut() {
    return lo(this);
  }
  _fallbackPopout(e, n, o) {
    return co(this, e, n, o);
  }
  _clearPopoutCloseWatch() {
    return uo(this);
  }
  _startPopoutCloseWatch() {
    return po(this);
  }
  _schedulePopInFromPopupClose() {
    return mo(this);
  }
  _installPopoutStyles(e) {
    return ho(this, e);
  }
  popIn(e) {
    return fo(this, e);
  }
  _updatePopoutBtnUI() {
    return _o(this);
  }
  get isPopped() {
    return this._isPopped || this._desktopExpanded;
  }
  _resizeCursorForDirection(e) {
    return go(e);
  }
  _getResizeDirectionFromPoint(e, n, o) {
    return bo(e, n, o);
  }
  _stopEdgeResize() {
    return yo(this);
  }
  _bindPanelInteractions() {
    return Co(this);
  }
  _initEdgeResize(e) {
    return Ao(this, e);
  }
  _initDrag(e) {
    return So(this, e);
  }
  async _drawMediaFit(e, n, o, s, i, r, l) {
    return Eo(this, e, n, o, s, i, r, l);
  }
  _estimateGenInfoOverlayHeight(e, n, o) {
    return Mo(this, e, n, o);
  }
  _drawGenInfoOverlay(e, n, o, s, i, r) {
    return Bo(this, e, n, o, s, i, r);
  }
  async _captureView() {
    return No(this);
  }
  dispose() {
    var e, n, o, s, i, r, l, u, a, d, c, f, h, m, p, g, b, C;
    Te(this), this._destroyPanZoom(), this._destroyCompareSync(), this._destroyMediaControls(), this._unbindLayoutObserver(), this._stopEdgeResize(), this._clearPopoutCloseWatch();
    try {
      (e = this._panelAC) == null || e.abort(), this._panelAC = null;
    } catch (_) {
      (n = console.debug) == null || n.call(console, _);
    }
    try {
      (o = this._btnAC) == null || o.abort(), this._btnAC = null;
    } catch (_) {
      (s = console.debug) == null || s.call(console, _);
    }
    try {
      (i = this._docAC) == null || i.abort(), this._docAC = null;
    } catch (_) {
      (r = console.debug) == null || r.call(console, _);
    }
    try {
      (l = this._popoutAC) == null || l.abort(), this._popoutAC = null;
    } catch (_) {
      (u = console.debug) == null || u.call(console, _);
    }
    try {
      (a = this._panzoomAC) == null || a.abort(), this._panzoomAC = null;
    } catch (_) {
      (d = console.debug) == null || d.call(console, _);
    }
    try {
      (f = (c = this._compareSyncAC) == null ? void 0 : c.abort) == null || f.call(c), this._compareSyncAC = null;
    } catch (_) {
      (h = console.debug) == null || h.call(console, _);
    }
    try {
      this._isPopped && this.popIn();
    } catch (_) {
      (m = console.debug) == null || m.call(console, _);
    }
    this._revokePreviewBlob(), this._onSidebarPosChanged && (window.removeEventListener("mjr-settings-changed", this._onSidebarPosChanged), this._onSidebarPosChanged = null);
    try {
      (p = this.element) == null || p.remove();
    } catch (_) {
      (g = console.debug) == null || g.call(console, _);
    }
    this.element = null, this._contentEl = null, this._closeBtn = null, this._modeBtn = null, this._pinGroup = null, this._pinBtns = null, this._liveBtn = null, this._nodeStreamBtn = null, this._popoutBtn = null, this._captureBtn = null, this._unbindDocumentUiHandlers();
    try {
      (b = this._genDropdown) == null || b.remove();
    } catch (_) {
      (C = console.debug) == null || C.call(console, _);
    }
    this._mediaA = null, this._mediaB = null, this._mediaC = null, this._mediaD = null, this.isVisible = !1;
  }
}
export {
  ko as FloatingViewer,
  T as MFV_MODES
};
