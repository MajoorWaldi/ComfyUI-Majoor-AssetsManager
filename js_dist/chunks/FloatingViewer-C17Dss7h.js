import { p as le, M as Me, c as Be, q as Ne, t as xe, u as Pe, v as Le, A as pt, x as ut, y as Ie, z as H, B as gt, C as Fe, D as ce, F as Te, G as je, H as yt, E as ct, n as ke, s as Mt, I as St, J as Oe, K as It, L as Ft, d as Bt, N as Ge, O as Ve } from "./entry-BloWapFX.js";
import { ensureViewerMetadataAsset as Ct } from "./genInfo-DrVx20E1.js";
const T = Object.freeze({
  SIMPLE: "simple",
  AB: "ab",
  SIDE: "side",
  GRID: "grid"
}), Nt = 0.25, xt = 8, Re = 8e-4, bt = 8, He = "C", de = "L", ue = "K", pe = "N", ve = "Esc", Et = 30;
function Pt(t) {
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
function De(t, e) {
  const n = Math.floor(Number(t) || 0), o = Math.max(0, Math.floor(Number(e) || 0));
  return n < 0 ? 0 : o > 0 && n > o ? o : n;
}
function Zt(t, e) {
  const n = Number((t == null ? void 0 : t.currentTime) || 0), o = Number(e) > 0 ? Number(e) : Et;
  return Math.max(0, Math.floor(n * o));
}
function me(t, e) {
  const n = Number((t == null ? void 0 : t.duration) || 0), o = Number(e) > 0 ? Number(e) : Et;
  return !Number.isFinite(n) || n <= 0 ? 0 : Math.max(0, Math.floor(n * o));
}
function Ue(t, e, n) {
  var l;
  const o = Number(n) > 0 ? Number(n) : Et, s = me(t, o), r = De(e, s) / o;
  try {
    t.currentTime = Math.max(0, r);
  } catch (u) {
    (l = console.debug) == null || l.call(console, u);
  }
}
function ze(t) {
  return t instanceof HTMLMediaElement;
}
function We(t, e) {
  return String(t || "").toLowerCase() === "video" ? !0 : e instanceof HTMLVideoElement;
}
function Ye(t, e) {
  return String(t || "").toLowerCase() === "audio" ? !0 : e instanceof HTMLAudioElement;
}
function Qe(t) {
  const e = String(t || "").toLowerCase();
  return e === "gif" || e === "animated-image";
}
function qe(t) {
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
function Xe(t, e = null, { kind: n = "" } = {}) {
  var lt;
  if (!t || t._mjrSimplePlayerMounted) return (t == null ? void 0 : t.parentElement) || null;
  t._mjrSimplePlayerMounted = !0;
  const o = le(e) || Et, s = ze(t), i = We(n, t), r = Ye(n, t), l = Qe(n), u = document.createElement("div");
  u.className = "mjr-mfv-simple-player", u.tabIndex = 0, u.setAttribute("role", "group"), u.setAttribute("aria-label", "Media player"), r && u.classList.add("is-audio"), l && u.classList.add("is-animated-image");
  const a = document.createElement("div");
  a.className = "mjr-mfv-simple-player-controls";
  const d = document.createElement("input");
  d.type = "range", d.className = "mjr-mfv-simple-player-seek", d.min = "0", d.max = "1000", d.step = "1", d.value = "0", d.setAttribute("aria-label", "Seek"), s || (d.disabled = !0, d.classList.add("is-disabled"));
  const c = document.createElement("div");
  c.className = "mjr-mfv-simple-player-row";
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
  const b = document.createElement("i");
  b.className = "pi pi-step-forward", b.setAttribute("aria-hidden", "true"), _.appendChild(b);
  const y = document.createElement("div");
  y.className = "mjr-mfv-simple-player-time", y.textContent = "0:00 / 0:00";
  const g = document.createElement("div");
  g.className = "mjr-mfv-simple-player-frame", g.textContent = "F: 0", i || (g.style.display = "none");
  const C = document.createElement("button");
  C.type = "button", C.className = "mjr-icon-btn mjr-mfv-simple-player-btn", C.setAttribute("aria-label", "Mute/Unmute");
  const S = document.createElement("i");
  if (S.className = "pi pi-volume-up", S.setAttribute("aria-hidden", "true"), C.appendChild(S), i || (f.disabled = !0, _.disabled = !0, f.classList.add("is-disabled"), _.classList.add("is-disabled")), c.appendChild(f), c.appendChild(m), c.appendChild(_), c.appendChild(y), c.appendChild(g), c.appendChild(C), a.appendChild(d), a.appendChild(c), u.appendChild(t), r) {
    const E = document.createElement("div");
    E.className = "mjr-mfv-simple-player-audio-backdrop", E.textContent = String((e == null ? void 0 : e.filename) || "Audio"), u.appendChild(E);
  }
  u.appendChild(a);
  try {
    t instanceof HTMLMediaElement && (t.controls = !1, t.playsInline = !0, t.loop = !0, t.muted = !0, t.autoplay = !0);
  } catch (E) {
    (lt = console.debug) == null || lt.call(console, E);
  }
  const x = l ? String((t == null ? void 0 : t.src) || "") : "";
  let B = !1, L = "";
  const F = () => {
    if (s) {
      h.className = t.paused ? "pi pi-play" : "pi pi-pause";
      return;
    }
    if (l) {
      h.className = B ? "pi pi-play" : "pi pi-pause";
      return;
    }
    h.className = "pi pi-play";
  }, P = () => {
    if (t instanceof HTMLMediaElement) {
      S.className = t.muted ? "pi pi-volume-off" : "pi pi-volume-up";
      return;
    }
    S.className = "pi pi-volume-off", C.disabled = !0, C.classList.add("is-disabled");
  }, I = () => {
    if (!i || !(t instanceof HTMLVideoElement)) return;
    const E = Zt(t, o), k = me(t, o);
    g.textContent = k > 0 ? `F: ${E}/${k}` : `F: ${E}`;
  }, G = () => {
    const E = Math.max(0, Math.min(100, Number(d.value) / 1e3 * 100));
    d.style.setProperty("--mjr-seek-pct", `${E}%`);
  }, U = () => {
    if (!s) {
      y.textContent = l ? "Animated" : "Preview", d.value = "0", G();
      return;
    }
    const E = Number(t.currentTime || 0), k = Number(t.duration || 0);
    if (Number.isFinite(k) && k > 0) {
      const V = Math.max(0, Math.min(1, E / k));
      d.value = String(Math.round(V * 1e3)), y.textContent = `${Pt(E)} / ${Pt(k)}`;
    } else
      d.value = "0", y.textContent = `${Pt(E)} / 0:00`;
    G();
  }, q = (E) => {
    var k;
    try {
      (k = E == null ? void 0 : E.stopPropagation) == null || k.call(E);
    } catch {
    }
  }, $ = (E) => {
    var k, V;
    q(E);
    try {
      if (s)
        t.paused ? Xt(t) : (k = t.pause) == null || k.call(t);
      else if (l)
        if (!B)
          L || (L = qe(t)), L && (t.src = L), B = !0;
        else {
          const R = x ? `${x}${x.includes("?") ? "&" : "?"}mjr_anim=${Date.now()}` : t.src;
          t.src = R, B = !1;
        }
    } catch (R) {
      (V = console.debug) == null || V.call(console, R);
    }
    F();
  }, Z = (E, k) => {
    var R, z;
    if (q(k), !i || !(t instanceof HTMLVideoElement)) return;
    try {
      (R = t.pause) == null || R.call(t);
    } catch (J) {
      (z = console.debug) == null || z.call(console, J);
    }
    const V = Zt(t, o);
    Ue(t, V + E, o), F(), I(), U();
  }, K = (E) => {
    var k;
    if (q(E), t instanceof HTMLMediaElement) {
      try {
        t.muted = !t.muted;
      } catch (V) {
        (k = console.debug) == null || k.call(console, V);
      }
      P();
    }
  }, st = (E) => {
    var R;
    if (q(E), !s) return;
    G();
    const k = Number(t.duration || 0);
    if (!Number.isFinite(k) || k <= 0) return;
    const V = Math.max(0, Math.min(1, Number(d.value) / 1e3));
    try {
      t.currentTime = k * V;
    } catch (z) {
      (R = console.debug) == null || R.call(console, z);
    }
    I(), U();
  }, it = (E) => q(E), at = (E) => {
    var k, V, R, z;
    try {
      if ((V = (k = E == null ? void 0 : E.target) == null ? void 0 : k.closest) != null && V.call(k, "button, input, textarea, select")) return;
      (R = u.focus) == null || R.call(u, { preventScroll: !0 });
    } catch (J) {
      (z = console.debug) == null || z.call(console, J);
    }
  }, rt = (E) => {
    var V, R, z;
    const k = String((E == null ? void 0 : E.key) || "");
    if (!(!k || E != null && E.altKey || E != null && E.ctrlKey || E != null && E.metaKey)) {
      if (k === " " || k === "Spacebar") {
        (V = E.preventDefault) == null || V.call(E), $(E);
        return;
      }
      if (k === "ArrowLeft") {
        if (!i) return;
        (R = E.preventDefault) == null || R.call(E), Z(-1, E);
        return;
      }
      if (k === "ArrowRight") {
        if (!i) return;
        (z = E.preventDefault) == null || z.call(E), Z(1, E);
      }
    }
  };
  return m.addEventListener("click", $), f.addEventListener("click", (E) => Z(-1, E)), _.addEventListener("click", (E) => Z(1, E)), C.addEventListener("click", K), d.addEventListener("input", st), a.addEventListener("pointerdown", it), a.addEventListener("click", it), a.addEventListener("dblclick", it), u.addEventListener("pointerdown", at), u.addEventListener("keydown", rt), t instanceof HTMLMediaElement && (t.addEventListener("play", F, { passive: !0 }), t.addEventListener("pause", F, { passive: !0 }), t.addEventListener(
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
  )), Xt(t), F(), P(), I(), U(), u;
}
const Ze = /* @__PURE__ */ new Set([".mp4", ".webm", ".mov", ".avi", ".mkv"]), Ke = /* @__PURE__ */ new Set([".mp3", ".wav", ".flac", ".ogg", ".m4a", ".aac", ".opus", ".wma"]);
function he(t) {
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
  const n = he((t == null ? void 0 : t.filename) || "");
  return n === ".gif" ? "gif" : Ze.has(n) ? "video" : Ke.has(n) ? "audio" : Me.has(n) ? "model3d" : "image";
}
function fe(t) {
  return t ? t.url ? String(t.url) : t.filename && t.id == null ? Ne(t.filename, t.subfolder || "", t.type || "output") : t.filename && xe(t) || "" : "";
}
function Q(t = "No media — select assets in the grid") {
  const e = document.createElement("div");
  return e.className = "mjr-mfv-empty", e.textContent = t, e;
}
function tt(t, e) {
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
function Je(t, e) {
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
function we(t, e, n) {
  if (!t) return !1;
  if (Math.abs(Number(n) || 0) >= Math.abs(Number(e) || 0)) {
    const i = Number(t.scrollTop || 0), r = Math.max(
      0,
      Number(t.scrollHeight || 0) - Number(t.clientHeight || 0)
    );
    if (n < 0 && i > 0 || n > 0 && i < r) return !0;
  }
  const o = Number(t.scrollLeft || 0), s = Math.max(
    0,
    Number(t.scrollWidth || 0) - Number(t.clientWidth || 0)
  );
  return e < 0 && o > 0 || e > 0 && o < s;
}
function $e(t) {
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
function et(t, { fill: e = !1 } = {}) {
  var a, d;
  const n = fe(t);
  if (!n) return null;
  const o = X(t), s = `mjr-mfv-media mjr-mfv-media--fit-height${e ? " mjr-mfv-media--fill" : ""}`, r = he((t == null ? void 0 : t.filename) || "") === ".webp" && Number((t == null ? void 0 : t.duration) ?? ((a = t == null ? void 0 : t.metadata_raw) == null ? void 0 : a.duration) ?? 0) > 0, l = (c, m) => {
    var p;
    const h = document.createElement("div");
    h.className = `mjr-mfv-player-host${e ? " mjr-mfv-player-host--fill" : ""}`, h.appendChild(c);
    const f = Pe(c, {
      variant: "viewer",
      hostEl: h,
      mediaKind: m,
      initialFps: le(t) || void 0,
      initialFrameCount: Le(t) || void 0
    });
    try {
      f && (h._mjrMediaControlsHandle = f);
    } catch (_) {
      (p = console.debug) == null || p.call(console, _);
    }
    return h;
  };
  if (o === "audio") {
    const c = document.createElement("audio");
    c.className = s, c.src = n, c.controls = !1, c.autoplay = !0, c.preload = "metadata", c.loop = !0, c.muted = !0;
    try {
      c.addEventListener("loadedmetadata", () => Kt(c), {
        once: !0
      });
    } catch (m) {
      (d = console.debug) == null || d.call(console, m);
    }
    return Kt(c), l(c, "audio");
  }
  if (o === "video") {
    const c = document.createElement("video");
    return c.className = s, c.src = n, c.controls = !1, c.loop = !0, c.muted = !0, c.autoplay = !0, c.playsInline = !0, l(c, "video");
  }
  if (o === "model3d")
    return Be(t, n, {
      hostClassName: `mjr-model3d-host mjr-mfv-model3d-host${e ? " mjr-mfv-model3d-host--fill" : ""}`,
      canvasClassName: `mjr-mfv-media mjr-model3d-render-canvas${e ? " mjr-mfv-media--fill" : ""}`,
      hintText: "Rotate: left drag  Pan: right drag  Zoom: wheel or middle drag",
      disableViewerTransform: !0,
      pauseDuringExecution: !!pt.FLOATING_VIEWER_PAUSE_DURING_EXECUTION
    });
  const u = document.createElement("img");
  return u.className = s, u.src = n, u.alt = String((t == null ? void 0 : t.filename) || ""), u.draggable = !1, (o === "gif" || r) && Xe(u, t, {
    kind: o === "gif" ? "gif" : "animated-image"
  }) || u;
}
function _e(t, e, n, o, s, i) {
  t.beginPath(), typeof t.roundRect == "function" ? t.roundRect(e, n, o, s, i) : (t.moveTo(e + i, n), t.lineTo(e + o - i, n), t.quadraticCurveTo(e + o, n, e + o, n + i), t.lineTo(e + o, n + s - i), t.quadraticCurveTo(e + o, n + s, e + o - i, n + s), t.lineTo(e + i, n + s), t.quadraticCurveTo(e, n + s, e, n + s - i), t.lineTo(e, n + i), t.quadraticCurveTo(e, n, e + i, n), t.closePath());
}
function dt(t, e, n, o) {
  t.save(), t.font = "bold 10px system-ui, sans-serif";
  const s = 5, i = t.measureText(e).width;
  t.fillStyle = "rgba(0,0,0,0.58)", _e(t, n, o, i + s * 2, 18, 4), t.fill(), t.fillStyle = "#fff", t.fillText(e, n + s, o + 13), t.restore();
}
function tn(t, e, n = null) {
  switch (String((t == null ? void 0 : t.type) || "").toLowerCase()) {
    case "number":
    case "int":
    case "float":
      return nn(t, e, n);
    case "combo":
      return on(t, e, n);
    case "text":
    case "string":
    case "customtext":
      return sn(t, e, n);
    case "toggle":
    case "boolean":
      return an(t, e, n);
    default:
      return rn(t);
  }
}
function ot(t, e, n = null) {
  var s, i, r, l, u, a, d, c, m, h;
  if (!t) return !1;
  const o = String(t.type || "").toLowerCase();
  if (o === "number" || o === "int" || o === "float") {
    const f = Number(e);
    if (Number.isNaN(f)) return !1;
    const p = t.options ?? {}, _ = p.min ?? -1 / 0, b = p.max ?? 1 / 0;
    let y = Math.min(b, Math.max(_, f));
    (o === "int" || p.precision === 0 || p.round === 1) && (y = Math.round(y)), t.value = y;
  } else o === "toggle" || o === "boolean" ? t.value = !!e : t.value = e;
  try {
    const f = ut(), p = (f == null ? void 0 : f.canvas) ?? null, _ = n ?? (t == null ? void 0 : t.parent) ?? null, b = t.value;
    (s = t.callback) == null || s.call(t, t.value, p, _, null, t), (o === "number" || o === "int" || o === "float") && (t.value = b), en(t), (i = p == null ? void 0 : p.setDirty) == null || i.call(p, !0, !0), (r = p == null ? void 0 : p.draw) == null || r.call(p, !0, !0);
    const y = (_ == null ? void 0 : _.graph) ?? null;
    y && y !== (f == null ? void 0 : f.graph) && ((l = y.setDirtyCanvas) == null || l.call(y, !0, !0), (u = y.change) == null || u.call(y)), (d = (a = f == null ? void 0 : f.graph) == null ? void 0 : a.setDirtyCanvas) == null || d.call(a, !0, !0), (m = (c = f == null ? void 0 : f.graph) == null ? void 0 : c.change) == null || m.call(c);
  } catch (f) {
    (h = console.debug) == null || h.call(console, "[MFV] writeWidgetValue", f);
  }
  return !0;
}
function en(t) {
  var o, s, i, r, l, u;
  const e = String(t.value ?? ""), n = (t == null ? void 0 : t.inputEl) ?? (t == null ? void 0 : t.element) ?? (t == null ? void 0 : t.el) ?? ((s = (o = t == null ? void 0 : t.cachedDeepestByFrame) == null ? void 0 : o.widget) == null ? void 0 : s.inputEl) ?? ((r = (i = t == null ? void 0 : t.cachedDeepestByFrame) == null ? void 0 : i.widget) == null ? void 0 : r.element) ?? ((u = (l = t == null ? void 0 : t.cachedDeepestByFrame) == null ? void 0 : l.widget) == null ? void 0 : u.el) ?? null;
  n != null && "value" in n && n.value !== e && (n.value = e);
}
function nn(t, e, n) {
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
    l === "" || l === "-" || l === "." || l.endsWith(".") || (ot(t, l, n), e == null || e(t.value));
  }), o.addEventListener("change", () => {
    ot(t, o.value, n) && (o.value = String(t.value), e == null || e(t.value));
  }), o;
}
function on(t, e, n) {
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
    ot(t, o.value, n) && (e == null || e(t.value));
  }), o;
}
function sn(t, e, n) {
  const o = document.createElement("div");
  o.className = "mjr-ws-text-wrapper";
  const s = document.createElement("textarea");
  s.className = "mjr-ws-input mjr-ws-textarea", s.value = t.value ?? "", s.rows = 2;
  const i = () => {
    s.style.height = "auto", s.style.height = s.scrollHeight + "px";
  };
  return s.addEventListener("change", () => {
    ot(t, s.value, n) && (e == null || e(t.value));
  }), s.addEventListener("input", () => {
    ot(t, s.value, n), e == null || e(t.value), i();
  }), o.appendChild(s), o._mjrAutoFit = i, s._mjrAutoFit = i, requestAnimationFrame(i), o;
}
function an(t, e, n) {
  const o = document.createElement("label");
  o.className = "mjr-ws-toggle-label";
  const s = document.createElement("input");
  return s.type = "checkbox", s.className = "mjr-ws-checkbox", s.checked = !!t.value, s.addEventListener("change", () => {
    ot(t, s.checked, n) && (e == null || e(t.value));
  }), o.appendChild(s), o;
}
function rn(t) {
  const e = document.createElement("input");
  return e.type = "text", e.className = "mjr-ws-input mjr-ws-readonly", e.value = t.value != null ? String(t.value) : "", e.readOnly = !0, e.tabIndex = -1, e;
}
const ln = /* @__PURE__ */ new Set(["imageupload", "button", "hidden"]), cn = /\bnote\b|markdown/i;
function dn(t) {
  return cn.test(String((t == null ? void 0 : t.type) || ""));
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
function un(t, e) {
  var s;
  const n = t == null ? void 0 : t.properties;
  n && ("text" in n ? n.text = e : "value" in n ? n.value = e : "markdown" in n ? n.markdown = e : n.text = e);
  const o = (s = t == null ? void 0 : t.widgets) == null ? void 0 : s[0];
  o && (o.value = e);
}
const pn = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, mn = /^[0-9a-f]{20,}$/i;
function hn(...t) {
  for (const e of t) {
    const n = String(e || "").trim();
    if (n) return n;
  }
  return "";
}
function Lt(t) {
  return pn.test(t) || mn.test(t);
}
function ge(t) {
  var e, n, o;
  return hn(
    t == null ? void 0 : t.title,
    (e = t == null ? void 0 : t.properties) == null ? void 0 : e.title,
    (n = t == null ? void 0 : t.properties) == null ? void 0 : n.name,
    (o = t == null ? void 0 : t.properties) == null ? void 0 : o.label,
    t == null ? void 0 : t.name
  );
}
function fn(t, { isSubgraph: e = !1 } = {}) {
  const n = String((t == null ? void 0 : t.type) || "").trim(), o = ge(t);
  return (e || Lt(n)) && o ? o : Lt(n) ? "Subgraph" : n || o || `Node #${t == null ? void 0 : t.id}`;
}
function _n(t, e, { isSubgraph: n = !1 } = {}) {
  const o = String((t == null ? void 0 : t.type) || "").trim(), s = ge(t);
  return n && o && !Lt(o) && o !== e ? o : s && s !== o && s !== e ? s : "";
}
class gn {
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
      const c = this._inputMap.get(d.name), m = bn(c);
      if (!m) continue;
      if (m.type === "checkbox") {
        const f = !!d.value;
        m.checked !== f && (m.checked = f);
        continue;
      }
      const h = d.value != null ? String(d.value) : "";
      String(m.value ?? "") !== h && (n && m === n || (m.value = h, (u = c == null ? void 0 : c._mjrAutoFit) == null || u.call(c), (a = m == null ? void 0 : m._mjrAutoFit) == null || a.call(m)));
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
    var m, h, f;
    const e = this._node, n = document.createElement("section");
    n.className = "mjr-ws-node", n.dataset.nodeId = String(e.id ?? ""), this._isSubgraph && (n.classList.add("mjr-ws-node--subgraph"), n.dataset.subgraph = "true", n.dataset.childCount = String(this._childCount)), this._depth > 0 && (n.dataset.depth = String(this._depth), n.classList.add("mjr-ws-node--nested"));
    const o = document.createElement("div");
    if (o.className = "mjr-ws-node-header", this._collapsible) {
      this._header = o;
      const p = document.createElement("button");
      p.type = "button", p.className = "mjr-icon-btn mjr-ws-node-toggle", p.title = this._expanded ? "Collapse node" : "Expand node", p.addEventListener("click", (_) => {
        _.stopPropagation(), this.setExpanded(!this._expanded);
      }), o.appendChild(p), this._toggleBtn = p, o.addEventListener("click", (_) => {
        _.target.closest("button") || this.setExpanded(!this._expanded);
      }), o.title = this._expanded ? "Collapse node" : "Expand node";
    }
    const s = document.createElement("div");
    s.className = "mjr-ws-node-title-wrap";
    const i = document.createElement("span");
    i.className = "mjr-ws-node-type";
    const r = fn(e, { isSubgraph: this._isSubgraph });
    i.textContent = r, s.appendChild(i);
    const l = _n(e, r, {
      isSubgraph: this._isSubgraph
    });
    if (l) {
      const p = document.createElement("span");
      p.className = "mjr-ws-node-title", p.textContent = l, s.appendChild(p);
    }
    if (o.appendChild(s), this._isSubgraph) {
      const p = document.createElement("span");
      p.className = "mjr-ws-node-kind", p.title = `${this._childCount} inner node${this._childCount !== 1 ? "s" : ""}`;
      const _ = document.createElement("i");
      _.className = "pi pi-sitemap", _.setAttribute("aria-hidden", "true"), p.appendChild(_);
      const b = document.createElement("span");
      b.textContent = "Subgraph", p.appendChild(b);
      const y = document.createElement("span");
      y.className = "mjr-ws-node-kind-count", y.textContent = String(this._childCount), p.appendChild(y), o.appendChild(p), this._subgraphHeaderTitle = `${r} · Subgraph · ${this._childCount} inner node${this._childCount !== 1 ? "s" : ""}`, o.title = this._subgraphHeaderTitle;
    }
    const u = document.createElement("button");
    u.type = "button", u.className = "mjr-icon-btn mjr-ws-locate", u.title = "Locate on canvas", u.innerHTML = '<i class="pi pi-map-marker" aria-hidden="true"></i>', u.addEventListener("click", (p) => {
      p.stopPropagation(), this._locateNode();
    }), o.appendChild(u), n.appendChild(o);
    const a = document.createElement("div");
    if (a.className = "mjr-ws-node-body", dn(e)) {
      const p = document.createElement("textarea");
      p.className = "mjr-ws-input mjr-ws-textarea mjr-ws-note-textarea", p.value = Jt(e), p.rows = 4;
      const _ = () => {
        p.style.height = "auto", p.style.height = p.scrollHeight + "px";
      };
      return p.addEventListener("input", () => {
        var g, C, S, x, B, L, F;
        un(e, p.value);
        const b = (g = e == null ? void 0 : e.widgets) == null ? void 0 : g[0], y = (b == null ? void 0 : b.inputEl) ?? (b == null ? void 0 : b.element) ?? (b == null ? void 0 : b.el) ?? null;
        y != null && "value" in y && y.value !== p.value && (y.value = p.value), _();
        try {
          const P = ut(), I = (P == null ? void 0 : P.canvas) ?? null;
          (C = I == null ? void 0 : I.setDirty) == null || C.call(I, !0, !0), (S = I == null ? void 0 : I.draw) == null || S.call(I, !0, !0);
          const G = (e == null ? void 0 : e.graph) ?? null;
          G && G !== (P == null ? void 0 : P.graph) && ((x = G.setDirtyCanvas) == null || x.call(G, !0, !0), (B = G.change) == null || B.call(G)), (F = (L = P == null ? void 0 : P.graph) == null ? void 0 : L.change) == null || F.call(L);
        } catch {
        }
      }), p._mjrAutoFit = _, this._noteTextarea = p, this._autoFits.push(_), a.appendChild(p), this._body = a, n.appendChild(a), this._el = n, this._applyExpandedState(), requestAnimationFrame(_), n;
    }
    const d = e.widgets ?? [];
    let c = !1;
    for (const p of d) {
      const _ = String(p.type || "").toLowerCase();
      if (ln.has(_) || p.hidden || (m = p.options) != null && m.hidden) continue;
      c = !0;
      const b = _ === "text" || _ === "string" || _ === "customtext", y = document.createElement("div");
      y.className = b ? "mjr-ws-widget-row mjr-ws-widget-row--block" : "mjr-ws-widget-row";
      const g = document.createElement("label");
      g.className = "mjr-ws-widget-label", g.textContent = p.name || "";
      const C = document.createElement("div");
      C.className = "mjr-ws-widget-input";
      const S = tn(p, () => {
      }, e);
      C.appendChild(S), this._inputMap.set(p.name, S);
      const x = S._mjrAutoFit ?? ((f = (h = S.querySelector) == null ? void 0 : h.call(S, "textarea")) == null ? void 0 : f._mjrAutoFit);
      x && this._autoFits.push(x), y.appendChild(g), y.appendChild(C), a.appendChild(y);
    }
    if (!c) {
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
    var n, o, s, i, r, l, u, a;
    if (this._onLocate) {
      this._onLocate();
      return;
    }
    const e = this._node;
    if (e)
      try {
        const d = ut(), c = d == null ? void 0 : d.canvas;
        if (!c) return;
        if (typeof c.centerOnNode == "function")
          c.centerOnNode(e);
        else if (c.ds && e.pos) {
          const m = ((n = c.canvas) == null ? void 0 : n.width) || ((o = c.element) == null ? void 0 : o.width) || 800, h = ((s = c.canvas) == null ? void 0 : s.height) || ((i = c.element) == null ? void 0 : i.height) || 600;
          c.ds.offset[0] = -e.pos[0] - (((r = e.size) == null ? void 0 : r[0]) || 0) / 2 + m / 2, c.ds.offset[1] = -e.pos[1] - (((l = e.size) == null ? void 0 : l[1]) || 0) / 2 + h / 2, (u = c.setDirty) == null || u.call(c, !0, !0);
        }
      } catch (d) {
        (a = console.debug) == null || a.call(console, "[MFV sidebar] locateNode error", d);
      }
  }
}
function bn(t) {
  var e, n, o;
  return t ? (n = (e = t.classList) == null ? void 0 : e.contains) != null && n.call(e, "mjr-ws-text-wrapper") ? ((o = t.querySelector) == null ? void 0 : o.call(t, "textarea")) ?? t : t : null;
}
const Tt = () => Ie();
class yn {
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
    var s, i, r, l, u;
    const n = Mn()[0] || "";
    let o = null;
    for (const a of this._renderers) {
      const d = String(((s = a._node) == null ? void 0 : s.id) ?? "") === n;
      (r = (i = a.el) == null ? void 0 : i.classList) == null || r.toggle("is-selected-from-graph", d), d && (o = a);
    }
    if (!n) {
      this._lastSelectedId = "";
      return;
    }
    if (n !== this._lastSelectedId && (this._lastSelectedId = n, !!o)) {
      o._expanded || o.setExpanded(!0);
      try {
        const a = o._mjrTreeItemEl || o.el;
        this._openTreeBranch(a);
        const d = a == null ? void 0 : a.parentElement;
        d && d.firstElementChild !== a && d.insertBefore(a, d.firstElementChild), (l = o.el) == null || l.scrollIntoView({ block: "start", inline: "nearest" });
      } catch (a) {
        (u = console.debug) == null || u.call(console, "[MFV] promote selected node failed", a);
      }
    }
  }
  _maybeRebuildList() {
    const e = be(Cn()), n = (this._searchQuery || "").toLowerCase().trim(), o = n ? Ce(e, n) : e, s = Sn(o);
    if (s === this._lastNodeSig) {
      this._syncCanvasSelection();
      return;
    }
    this._lastNodeSig = s;
    for (const i of this._renderers) i.dispose();
    if (this._renderers = [], this._list.innerHTML = "", !o.length) {
      const i = document.createElement("div");
      i.className = "mjr-ws-sidebar-empty", i.textContent = e.length ? "No nodes match your search" : "No nodes in workflow", this._list.appendChild(i);
      return;
    }
    this._renderItems(o, this._list, 0, null), this._syncCanvasSelection();
  }
  /**
   * Recursively render tree items into a container.
   * @param {{node: object, children: object[]}[]} items
   * @param {HTMLElement} container
   * @param {number} depth
   */
  _renderItems(e, n, o, s) {
    for (const { node: i, children: r } of e) {
      const l = String((i == null ? void 0 : i.id) ?? ""), u = r.length, a = document.createElement("div");
      a.className = "mjr-ws-tree-item", a.dataset.nodeId = l, a._mjrNodeId = l, a._mjrParentTreeItem = s || null, u > 0 && a.classList.add("mjr-ws-tree-item--subgraph"), o > 0 && a.classList.add("mjr-ws-tree-item--nested");
      const d = new gn(i, {
        collapsible: !0,
        expanded: this._expandedNodeIds.has(l),
        depth: o,
        isSubgraph: u > 0,
        childCount: u,
        onLocate: () => En(i),
        onToggle: (c) => {
          if (c) {
            this._expandedNodeIds = /* @__PURE__ */ new Set([l]);
            for (const m of this._renderers)
              m !== d && m.setExpanded(!1);
          } else
            this._expandedNodeIds.delete(l);
        }
      });
      if (d._mjrTreeItemEl = a, this._renderers.push(d), a.appendChild(d.el), u > 0) {
        const c = this._expandedChildrenIds.has(l), m = document.createElement("button");
        m.type = "button", m.className = "mjr-ws-children-toggle", o > 0 && m.classList.add("mjr-ws-children-toggle--nested"), wt(m, u, c);
        const h = document.createElement("div");
        h.className = "mjr-ws-children", h.hidden = !c, a._mjrChildrenToggle = m, a._mjrChildrenEl = h, a._mjrChildCount = u, this._renderItems(r, h, o + 1, a), m.addEventListener("click", () => {
          this._setTreeItemChildrenOpen(a, h.hidden);
        }), a.appendChild(m), a.appendChild(h);
      }
      n.appendChild(a);
    }
  }
  _setTreeItemChildrenOpen(e, n) {
    if (!(e != null && e._mjrChildrenEl) || !(e != null && e._mjrChildrenToggle)) return;
    const o = String(e._mjrNodeId || "");
    e._mjrChildrenEl.hidden = !n, o && (n ? this._expandedChildrenIds.add(o) : this._expandedChildrenIds.delete(o)), wt(
      e._mjrChildrenToggle,
      Number(e._mjrChildCount) || 0,
      n
    );
  }
  _openTreeBranch(e) {
    let n = e || null;
    for (; n; ) {
      const o = n._mjrParentTreeItem || null;
      o && this._setTreeItemChildrenOpen(o, !0), n = o;
    }
    this._setTreeItemChildrenOpen(e, !0);
  }
}
function Cn() {
  var t;
  try {
    const e = Tt();
    return (e == null ? void 0 : e.graph) ?? ((t = e == null ? void 0 : e.canvas) == null ? void 0 : t.graph) ?? null;
  } catch {
    return null;
  }
}
function An(t) {
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
  ].filter((l) => l && typeof l == "object" && ye(l).length > 0);
  return Array.isArray(t == null ? void 0 : t.nodes) && t.nodes.length > 0 && t.nodes !== ((r = t == null ? void 0 : t.graph) == null ? void 0 : r.nodes) && e.push({ nodes: t.nodes }), e;
}
function be(t, e = /* @__PURE__ */ new Set()) {
  if (!t || e.has(t)) return [];
  e.add(t);
  const n = ye(t), o = [];
  for (const s of n) {
    if (!s) continue;
    const r = An(s).flatMap((l) => be(l, e));
    o.push({ node: s, children: r });
  }
  return o;
}
function ye(t) {
  if (!t || typeof t != "object") return [];
  if (Array.isArray(t.nodes)) return t.nodes.filter(Boolean);
  if (Array.isArray(t._nodes)) return t._nodes.filter(Boolean);
  const e = t._nodes_by_id ?? t.nodes_by_id ?? null;
  return e instanceof Map ? Array.from(e.values()).filter(Boolean) : e && typeof e == "object" ? Object.values(e).filter(Boolean) : [];
}
function Ce(t, e) {
  const n = [];
  for (const { node: o, children: s } of t) {
    const i = (o.type || "").toLowerCase().includes(e) || (o.title || "").toLowerCase().includes(e), r = Ce(s, e);
    (i || r.length > 0) && n.push({ node: o, children: r });
  }
  return n;
}
function Sn(t) {
  const e = [];
  function n(o) {
    for (const { node: s, children: i } of o)
      e.push(s.id), e.push("["), n(i), e.push("]");
  }
  return n(t), e.join(",");
}
function wt(t, e, n) {
  const o = n ? "pi-chevron-down" : "pi-chevron-right";
  t.textContent = "";
  const s = document.createElement("i");
  s.className = `pi ${o}`, s.setAttribute("aria-hidden", "true"), t.appendChild(s);
  const i = document.createElement("span");
  i.textContent = `${e} inner node${e !== 1 ? "s" : ""}`, t.appendChild(i), t.setAttribute("aria-expanded", String(n));
}
function En(t) {
  var e, n, o, s, i, r, l;
  try {
    const u = Tt(), a = u == null ? void 0 : u.canvas;
    if (!a) return;
    if ((e = a.selectNode) == null || e.call(a, t, !1), typeof a.centerOnNode == "function")
      a.centerOnNode(t);
    else if (t.pos && a.ds) {
      const d = a.canvas, c = (d == null ? void 0 : d.width) ?? 800, m = (d == null ? void 0 : d.height) ?? 600, h = a.ds.scale ?? 1;
      a.ds.offset = [
        -t.pos[0] + c / (2 * h) - (((n = t.size) == null ? void 0 : n[0]) ?? 100) / 2,
        -t.pos[1] + m / (2 * h) - (((o = t.size) == null ? void 0 : o[1]) ?? 80) / 2
      ], (s = a.setDirty) == null || s.call(a, !0, !0);
    }
    (r = (i = a.canvas) == null ? void 0 : i.focus) == null || r.call(i);
  } catch (u) {
    (l = console.debug) == null || l.call(console, "[MFV] _focusNode", u);
  }
}
function Mn() {
  var t, e, n;
  try {
    const o = Tt(), s = ((t = o == null ? void 0 : o.canvas) == null ? void 0 : t.selected_nodes) ?? ((e = o == null ? void 0 : o.canvas) == null ? void 0 : e.selectedNodes) ?? null;
    if (!s) return [];
    if (Array.isArray(s))
      return s.map((i) => String((i == null ? void 0 : i.id) ?? "")).filter(Boolean);
    if (s instanceof Map)
      return Array.from(s.values()).map((i) => String((i == null ? void 0 : i.id) ?? "")).filter(Boolean);
    if (typeof s == "object")
      return Object.values(s).map((i) => String((i == null ? void 0 : i.id) ?? "")).filter(Boolean);
  } catch (o) {
    (n = console.debug) == null || n.call(console, "[MFV] _getSelectedNodeIds", o);
  }
  return [];
}
const Bn = 16;
class Nn {
  constructor({ hostEl: e, onClose: n } = {}) {
    this._hostEl = e, this._onClose = n ?? null, this._visible = !1, this._liveSyncHandle = null, this._liveSyncMode = "", this._resizeCleanup = null, this._nodesTab = new yn(), this._el = this._build();
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
    this._liveSyncMode = "timeout", this._liveSyncHandle = e.setTimeout(n, Bn);
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
      var _;
      if (r.button !== 0 || !((_ = this._el) != null && _.classList.contains("open"))) return;
      const l = this._el.parentElement;
      if (!l) return;
      const u = this._el.getBoundingClientRect(), a = l.getBoundingClientRect(), d = l.getAttribute("data-sidebar-pos") || "right", c = Math.max(
        s,
        Math.floor(a.width * (d === "bottom" ? 1 : 0.65))
      );
      if (d === "bottom") return;
      r.preventDefault(), r.stopPropagation(), e.classList.add("is-dragging"), this._el.classList.add("is-resizing");
      const m = r.clientX, h = u.width, f = (b) => {
        const y = b.clientX - m, g = d === "left" ? h - y : h + y, C = Math.max(s, Math.min(c, g));
        this._el.style.width = `${Math.round(C)}px`;
      }, p = () => {
        e.classList.remove("is-dragging"), this._el.classList.remove("is-resizing"), o.removeEventListener("pointermove", f), o.removeEventListener("pointerup", p), o.removeEventListener("pointercancel", p);
      };
      o.addEventListener("pointermove", f), o.addEventListener("pointerup", p), o.addEventListener("pointercancel", p);
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
const v = Object.freeze({
  IDLE: "idle",
  RUNNING: "running",
  STOPPING: "stopping",
  ERROR: "error"
}), xn = /* @__PURE__ */ new Set(["default", "auto", "latent2rgb", "taesd", "none"]), te = "progress-update";
function Pn() {
  const t = document.createElement("div");
  t.className = "mjr-mfv-run-controls";
  const e = document.createElement("button");
  e.type = "button", e.className = "mjr-icon-btn mjr-mfv-run-btn";
  const n = H("tooltip.queuePrompt", "Queue Prompt (Run)");
  e.title = n, e.setAttribute("aria-label", n);
  const o = document.createElement("i");
  o.className = "pi pi-play", o.setAttribute("aria-hidden", "true"), e.appendChild(o);
  const s = document.createElement("button");
  s.type = "button", s.className = "mjr-icon-btn mjr-mfv-stop-btn";
  const i = document.createElement("i");
  i.className = "pi pi-stop", i.setAttribute("aria-hidden", "true"), s.appendChild(i), t.appendChild(e), t.appendChild(s);
  let r = v.IDLE, l = !1, u = !1, a = null;
  function d() {
    a != null && (clearTimeout(a), a = null);
  }
  function c(g, { canStop: C = !1 } = {}) {
    r = g, e.classList.toggle("running", r === v.RUNNING), e.classList.toggle("stopping", r === v.STOPPING), e.classList.toggle("error", r === v.ERROR), e.disabled = r === v.RUNNING || r === v.STOPPING, s.disabled = !C || r === v.STOPPING, s.classList.toggle("active", C && r !== v.STOPPING), s.classList.toggle("stopping", r === v.STOPPING), r === v.RUNNING || r === v.STOPPING ? o.className = "pi pi-spin pi-spinner" : o.className = "pi pi-play";
  }
  function m() {
    const g = H("tooltip.queueStop", "Stop Generation");
    s.title = g, s.setAttribute("aria-label", g);
  }
  function h(g = gt.getSnapshot(), { authoritative: C = !1 } = {}) {
    const S = Math.max(0, Number(g == null ? void 0 : g.queue) || 0), x = (g == null ? void 0 : g.prompt) || null, B = !!(x != null && x.currentlyExecuting), L = !!(x && (x.currentlyExecuting || x.errorDetails)), F = S > 0 || L, P = !!(x != null && x.errorDetails);
    C && S === 0 && !x && (l = !1, u = !1);
    const I = l || u || B || S > 0;
    if ((B || F || S > 0) && (l = !1), P) {
      u = !1, d(), c(v.ERROR, { canStop: !1 });
      return;
    }
    if (u) {
      if (!I) {
        u = !1, h(g);
        return;
      }
      c(v.STOPPING, { canStop: !1 });
      return;
    }
    if (l || B || F || S > 0) {
      d(), c(v.RUNNING, { canStop: !0 });
      return;
    }
    d(), c(v.IDLE, { canStop: !1 });
  }
  function f() {
    l = !1, u = !1, d(), c(v.ERROR, { canStop: !1 }), a = setTimeout(() => {
      a = null, h();
    }, 1500);
  }
  async function p() {
    const g = ut(), S = (g != null && g.api && typeof g.api.interrupt == "function" ? g.api : null) ?? ce(g);
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
  async function _() {
    var g;
    if (!(r === v.RUNNING || r === v.STOPPING)) {
      l = !0, u = !1, h();
      try {
        const C = await Tn();
        C != null && C.tracked || (l = !1), h();
      } catch (C) {
        (g = console.error) == null || g.call(console, "[MFV Run]", C), f();
      }
    }
  }
  async function b() {
    var g;
    if (r === v.RUNNING) {
      u = !0, h();
      try {
        const C = await p();
        C != null && C.tracked || (u = !1, l = !1), h();
      } catch (C) {
        (g = console.error) == null || g.call(console, "[MFV Stop]", C), u = !1, h();
      } finally {
      }
    }
  }
  m(), s.disabled = !0, e.addEventListener("click", _), s.addEventListener("click", b);
  const y = (g) => {
    h((g == null ? void 0 : g.detail) || gt.getSnapshot(), {
      authoritative: !0
    });
  };
  return gt.addEventListener(te, y), Fe({ timeoutMs: 4e3 }).catch((g) => {
    var C;
    (C = console.debug) == null || C.call(console, g);
  }), h(), {
    el: t,
    dispose() {
      d(), e.removeEventListener("click", _), s.removeEventListener("click", b), gt.removeEventListener(
        te,
        y
      );
    }
  };
}
function Ln(t = pt.MFV_PREVIEW_METHOD) {
  const e = String(t || "").trim().toLowerCase();
  return xn.has(e) ? e : "taesd";
}
function Ae(t, e = pt.MFV_PREVIEW_METHOD) {
  var s;
  const n = Ln(e), o = {
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
  const o = Ae(t, e), s = {
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
function At(t, e) {
  var n;
  for (const o of (t == null ? void 0 : t.nodes) ?? [])
    e(o), (n = o.subgraph) != null && n.nodes && At(o.subgraph, e);
}
function In(t) {
  var n;
  return [t == null ? void 0 : t.type, t == null ? void 0 : t.comfyClass, t == null ? void 0 : t.class_type, (n = t == null ? void 0 : t.constructor) == null ? void 0 : n.type].some((o) => /Api$/i.test(String(o || "").trim()));
}
function Fn(t) {
  let e = !1;
  return At(t, (n) => {
    e || (e = In(n));
  }), e;
}
async function Tn() {
  var u, a;
  const t = ut();
  if (!t) throw new Error("ComfyUI app not available");
  const n = (t != null && t.api && typeof t.api.queuePrompt == "function" ? t.api : null) ?? ce(t), o = !!(n && typeof n.queuePrompt == "function" || n && typeof n.fetchApi == "function"), s = t.rootGraph ?? t.graph;
  if ((Fn(s) || !o) && typeof t.queuePrompt == "function")
    return await t.queuePrompt(0), { tracked: !0 };
  At(s, (d) => {
    var c;
    for (const m of d.widgets ?? [])
      (c = m.beforeQueued) == null || c.call(m, { isPartialExecution: !1 });
  });
  const r = typeof t.graphToPrompt == "function" ? await t.graphToPrompt() : null;
  if (!(r != null && r.output)) throw new Error("graphToPrompt returned empty output");
  let l;
  if (n && typeof n.queuePrompt == "function")
    await n.queuePrompt(0, Ae(r)), l = { tracked: !0 };
  else if (n && typeof n.fetchApi == "function") {
    const d = await n.fetchApi("/prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        ee(r, {
          clientId: ne(n, t)
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
        ee(r, {
          clientId: ne(null, t)
        })
      )
    });
    if (!d.ok) throw new Error(`POST /prompt failed (${d.status})`);
    l = { tracked: !1 };
  }
  return At(s, (d) => {
    var c;
    for (const m of d.widgets ?? [])
      (c = m.afterQueued) == null || c.call(m, { isPartialExecution: !1 });
  }), (a = (u = t.canvas) == null ? void 0 : u.draw) == null || a.call(u, !0, !0), l;
}
const jn = {
  rgb: "#e0e0e0",
  r: "#ff5555",
  g: "#44dd66",
  b: "#5599ff",
  a: "#ffffff",
  l: "#bbbbbb"
}, kn = { rgb: "RGB", r: "R", g: "G", b: "B", a: "A", l: "L" }, On = { rgb: "500", r: "700", g: "700", b: "700", a: "700", l: "400" };
function Gn(t) {
  var n;
  const e = document.createElement("div");
  return e.className = "mjr-mfv", e.setAttribute("role", "dialog"), e.setAttribute("aria-modal", "false"), e.setAttribute("aria-hidden", "true"), t.element = e, e.appendChild(t._buildHeader()), e.setAttribute("aria-labelledby", t._titleId), e.appendChild(t._buildToolbar()), e.appendChild(Te(t)), t._contentWrapper = document.createElement("div"), t._contentWrapper.className = "mjr-mfv-content-wrapper", t._applySidebarPosition(), t._contentEl = document.createElement("div"), t._contentEl.className = "mjr-mfv-content", t._contentWrapper.appendChild(t._contentEl), t._overlayCanvas = document.createElement("canvas"), t._overlayCanvas.className = "mjr-mfv-overlay-canvas", t._contentEl.appendChild(t._overlayCanvas), t._contentEl.appendChild(je(t)), t._sidebar = new Nn({
    hostEl: e,
    onClose: () => t._updateSettingsBtnState(!1)
  }), t._contentWrapper.appendChild(t._sidebar.el), e.appendChild(t._contentWrapper), t._rebindControlHandlers(), t._bindPanelInteractions(), t._bindDocumentUiHandlers(), (n = t._bindLayoutObserver) == null || n.call(t), t._onSidebarPosChanged = (o) => {
    var s;
    ((s = o == null ? void 0 : o.detail) == null ? void 0 : s.key) === "viewer.mfvSidebarPosition" && t._applySidebarPosition();
  }, window.addEventListener("mjr-settings-changed", t._onSidebarPosChanged), t._refresh(), e;
}
function Vn(t) {
  const e = document.createElement("div");
  e.className = "mjr-mfv-header";
  const n = document.createElement("span");
  n.className = "mjr-mfv-header-title", n.id = t._titleId, n.textContent = "〽️ Majoor Floating Viewer";
  const o = document.createElement("button");
  t._closeBtn = o, o.type = "button", o.className = "mjr-icon-btn mjr-mfv-close-btn", yt(o, H("tooltip.closeViewer", "Close viewer"), ve);
  const s = document.createElement("i");
  return s.className = "pi pi-times", s.setAttribute("aria-hidden", "true"), o.appendChild(s), e.appendChild(n), e.appendChild(o), e;
}
function Rn(t) {
  const e = (M, { min: A, max: N, step: j, value: O } = {}) => {
    const Y = document.createElement("div");
    Y.className = "mjr-mfv-toolbar-range";
    const W = document.createElement("input");
    W.type = "range", W.min = String(A), W.max = String(N), W.step = String(j), W.value = String(O), W.title = M || "";
    const w = document.createElement("span");
    return w.className = "mjr-mfv-toolbar-range-out", w.textContent = Number(O).toFixed(2), Y.appendChild(W), Y.appendChild(w), { wrap: Y, input: W, out: w };
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
    const j = document.createElement("i");
    j.className = "pi pi-map-marker mjr-menu-item-check", j.style.opacity = "0", A.appendChild(N), A.appendChild(j), i.appendChild(A), t._pinBtns[M] = A;
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
  const m = [
    { value: "0", label: "Off" },
    { value: "1", label: "Thirds" },
    { value: "2", label: "Center" },
    { value: "3", label: "Safe" }
  ], h = String(t._gridMode || 0), f = [];
  for (const M of m) {
    const A = document.createElement("option");
    A.value = M.value, c.appendChild(A);
    const N = document.createElement("button");
    N.type = "button", N.className = "mjr-menu-item", N.dataset.value = M.value;
    const j = document.createElement("span");
    j.className = "mjr-menu-item-label", j.textContent = M.label;
    const O = document.createElement("i");
    O.className = "pi pi-check mjr-menu-item-check", O.style.opacity = M.value === h ? "1" : "0", N.appendChild(j), N.appendChild(O), d.appendChild(N), f.push(N), M.value === h && N.classList.add("is-active");
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
    c.value = N, c.dispatchEvent(new Event("change", { bubbles: !0 })), f.forEach((j) => {
      const O = j.dataset.value === N;
      j.classList.toggle("is-active", O), j.querySelector(".mjr-menu-item-check").style.opacity = O ? "1" : "0";
    }), l.classList.toggle("is-on", N !== "0"), t._closeGuidePopover();
  });
  const _ = String(t._channel || "rgb"), b = document.createElement("button");
  b.type = "button", b.className = "mjr-icon-btn mjr-mfv-ch-trigger", b.title = "Channel", b.setAttribute("aria-haspopup", "listbox"), b.setAttribute("aria-expanded", "false");
  const y = document.createElement("img");
  y.src = new URL("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAQ4ElEQVR4nO2deVRTd97Gb52tM++c875dpkpxQ7QKCChYBUEjhC2QhAQEJCyO044zPfPO9NQuc+ZMfSNLgABhcWydtmpLXQapRTZBsS6Qm5vF3aq1rkfFahbXakWFfN9z700QkST3JvcSojznPCf/gp/zub/k4eaKICMZyUhGMpKRPAMxpSV5G9Li003pfKkhI3GDKSNptzGdpzFmJH5rSk88akzjqU3pCbsMabwNJnH8cr04eqFBHO/l7p/7qQkgyHPG1ASuMZO/1iQRnDJKhGaTRABEM/lkFyWRzbA0PZGoMZ1H1JCWYDakxp00imM+MaTFcNz9O3lkbqbFvWiUJMpMkuQLpqxkICoRWtoPiAMYxrQEsgvjyabGgTEl7pw+mbviRjLnf9z9e3oGiExBtTFL+KMpWwR2YdAFgsPoV4OYe8sgipGPgLERQwYvw5SdfNWUIwICBlUgdOzo35RYogYRV28URS3FL4/u/jcYFjFkxXuZsoR7TTlioA3DWSAWGEZxDFkRFwzJUe0/JET+DnmWY1okjjXmiPR9MHKG1o7+QAgooqjL10ULns2D/7qEL7mWk9JNwhgAJGto7SCaHE3UIIi6r+dzcpBnKdckye+ZclN6B4WRTRMIQ3ZYgRiTo8AgjOrR8+f9BXkWYswWLCVg5KaAXSCSobcDh0FUuAAMwgXma/x5byJPc/SZ/FRjrvihQxhZ9IAwaYcVCAGFz3lg4M/nIU9j9LkiX1Ou+CYBwx12pMbRgyGwNGnezatJkZOQpymQlvZLY7b4ECUYWU4CYdoOHAafQ9TIn7cfQkN/gTwtMWUJy64tTgV6QATM22EFQtUOCxADfz5uynLkaYg+WzDZlJtyrw8IG3ak85i3ow/IfLKJkT/pE+b6Ip4eY1ZyO307hOzZYQVCxw7SEDAkRmxFPDmmTNFs0+JU85NAPMUOziMYSfNAnxhp1idFBCOeGlO2qMVpOyQuTOyUgdCwgzAkEvSJEbWIJ8aUJR5rzBX3DIkdaQns2dF3uYokgfAiHhri53neXyGvZQlWuGxHJn9Y2UGUFwGG+LnLEE+LMVt8wiYQN03sRmftsALBYRBAwvchnhTjIuGr+GE+fO2Idt4OXgToEyJ6r8SGv4J4SkxZwj84vFx5qh0JlsaHpSOekmuS5C8YnUnSWbDDuurStMMK5Gp82EeIp+RaTorabSNiCgt2WIFY7UiYC/r4sF2Ip8SUk6L3mIldQN8OEkj4RcQTcn4x53lTborZrSOimAU7+oDMtQLpBQ7n54hH3EXiSRO7YAFtO4jGh8PFuLAXkeEeYyZ/msdO7HyKQOLDiV6JnzMRGe7RZycFe+zEnkTdDrymmDl+yHDPlTSBj0dP7EkUgcSFgSk62BvxhPtzPXliN1C0Awei5/j/FhnugTTkZ6Yc8QNPntgNFOzQx8zp9pj7gU2S5HO2YOglqXA8+y3oWPwh7FhcCM2/L4Wm35dBa24x7MzJA3X2+3A+Ixv06QLWJnZj6ny4vjQcbv0jFG4XzYA7FYFwp3I63FEEwG1ZENz6MBhuvBUKxpRw23bEhp1APCXGjKR2K5DzubnQ9kYRbP7D59CQtQl2pG+CHWkbH+/CDbA91dIUsq3i9bA5swa2ZK8EbNG7YFiY5LwdCzlwa/nr8NMGP3iI+oD59KtgPovXy9IxZM+MtvQVS38HPQe84F6tD9zOCwDToll9QK7EzGlAPCVd6Qurt78pg81LNsKOjE3QnmEBYQPGYEC2i9cTbbO0OWU9bJashgMZf6YGQxQNN98Lg3v1ftB7chyYz44F81lvS+0BeQSD7MuWvgTm0y9Bd5s33FruD5fTQhTIcI+/9Ngvgyq1b2Us/8bUvmgTEKUAxBGMNtGXZJPJ1qbVAJrxLhhSBvlknsKF23mz4aF6MpjPWkFQheEACNEXibY1z71XgvHLi7Sil5DhmMDKfZkzK7VdM6t0MKtSC01ZtZRgOAOkVVgDrYIa2LxwHRxNXdIH48Y7EfBQOQXMZ8dbYDgLxD6MniMvgwIVQKlaCKWY4Gapmr+sri7tZ8hwiFeJcnygQrszpFoHOAy8M6p0UPaXJnpA6MAQkkDwbhPUQNMbVXCnLhzMZydYYAwEwqwdxlYfKFUnE0DkagFZjH+wBOMFuhXGtDJN0oxKrRGHMRBIpnQPe3YIHwHZ9+Ea6LlzCuDBGTBfimHdDvOZF2BPUxhpx+NA8N4rxhLfcQuMwApNSUi11jwYDLwhFVrYkrOZHhAxPRinPq8B6L0Dfen9EcxXcm0AYcaOB/tfAYVK+DgQEgaUWFqsSlwtBemoIUIBzwVWaP8dWq0DvLaABFdq4Z33d7Bmx4WtXwKYH8ITMT8Es2GZi4e5bTu+qw+0ZUcfkBIsCYpVvEbpHs7z7MNQaGqpwMA7u0wDDZJaWkDaqMBo2Ijr8CSMR6qA2fDXQYC4Zgd+mH+8N8muHTgMAgiWCCWqxCZWD/uZFZqPZq3cB1SBBFVo4W/v7WDUjlNr1wGYH9iB0c+UK1kuXK6etONEfRAlO6xAiKp4GwBYmFj8ytVv4zCsQKjAwDuzXAMbcuvoARENDmP//60F6L3rGEb/M+XifEbs6MbGQIX1re4AIHZgEJVhvA8YhTFNjoWEVOnu0bUDb2CFFpKle2G7i3bszKyBnrungHbufwfmc75OArHYceoF2N4U6YwdRItUvIcyNH4eIzBCP9n/m9Aq3bn+doTSgEFUoYV/vL3NJTtundgOTufWGpfsONfo1/e5wzYQmzCIytD4C9I9HNfn+pAqjWIwGHSBBJVr4OMl9U7ZcaT8cwDocR4Ifsh3JToF5PY346Bi4NtcenZYmgAyNLbMJRgBlWq/16t19121A+90hQZmyzHYJNnsGEhyPztENdBz+yS4nO4DpCU0YHRrx8CnuxIo2MF3CIMEEv8gXxkf4DSQ0GpdPRN2WIEElGtgvgyF2kW1lO04t+lLYCrmKzmUgTzYPxrWfxNLGQYlIKp4KFTGf+UUjMBK3dRZ1boee0DowLACwcspUMJ/MmvtAmnF7UiugZ4fv2cMCHQfpgTjvm4M1O6IscCgCcQODKLK2F6ZKnY6bSAhlfvWMWmHFYi/pXNkKKzJ/squHcdXfQFMx3yZbxfIT0pvWLs7AcqcgUEFCBoHRWjcGlowOJ/vef71lbobVIDQtcMKxK9MA8ElGOQvbbAJ5O753YwDgVsbbcLQb5sC/0L5/WAwbAcaR1YZe0uBhf2aMpAZCk0um3bgMPBOK1MTzfqgHb5O3fj45w7JF/Q+BFJN7x1yeOwH5OGRMaBtfB3K1CICxkAgTNqBt5C0JIMykNAq7VY6QJyxoz+QqaVqCJWhsOKPDdAqIoGcxpdclmK+nEbCOPUyXG15DT7bk2gTBl0gVGCQjd1IHUi17irTdgTYgYH3NUvnreiA4iX1cPN4G3tArn8C11unwNetXCjXiC0wHABh0A68BWjsD5Q2rqAy3XRnLleu2NEfyBQ52b83aeH8iTbovX+ZMRC99y/B2RPN8H5jBwGCMgzaQBzaQVSq4kxzCGRGleYNtuywAnEEY7Icg7iWyxDX+gMktnbBJ7s74MyxVui+cQig50fqBHpuQ/f1g3DqWBOsbN8LCxq7ILKpCyIbL0GpeqHb7LACyVfFLnIIZGaVtszddvhXHyBg4I3dRjZm22WyLV3wwbYDUNfRDqhmGxw60ALfH22Fk0e3waFDzaDUNUPt3nZ4t00HUS0XYX7zZaLzmsgSQJq64J/K/2XJDh4lGAVoDOR3xkkdA6kgD3S27LACsWdH0OrDNoFwLY1uIRvVrwuayXIstQUD75/a5bSAMG0HDqSgM8bxwR5aret06nLFkB2T5RjM/PToY0CowKALJHfbatbs6ANiDwZuiDK6zTGQlfsOujoiUgUyGIzJcgxCPvuWth1WIFRg4E1v+tIJIAzaQRalcIbovnP2csWEHZPlGMxad/wJIEzagVe0dUsfEHfYUaDk4q9HHAOp1H7L1IjojB2+JRiErDnmlB0LKMKIaOyChU0bnbpcMWaHkgv5aIyWiiFqVyd2V+zwLSHPkMGAMGUHDiSz5TP27LAAsWsHDkQZvZOKITvZtmOqHRi+JRgEfnzY5cPcHgy8S1orWR8RHQEp6OR+7RBIcIV2DVsjIhU7fEsw8F95gFU78C7b/XdWJ3aZQzu4UIhyHf9JN1CheZ/Jid0RkIEwJuGvcg3EtLj+VtcWjLkNXVCkynCrHTiQ/I5ox0/ODlJoE9xpxyRLOVsvPAGEKTvCt5wekondCmRQGEou5HUuiHAIxH/Vnt/OrNLdZ2NitwVkIAyfYgzCNp1mx47GLojagg3VxG4TSEFn9N3q1oRfOQRCnCOVun1sTuyO7PApxiD406OMzSQDgWQ2rxnSEXFwO6J3IFQzXaGVDcWIaAuGTzEGvqUaiG7pYuQw7w8jvOESrOhcPGQTu+3LFZf6cxv9FdjkGVVaM9sTuz0gE4tUEFF3jnE7Ir86MvQj4gAY+Z1RvYVYNL2nQARVaHRsj4hWIIPBmFikgsB/H2XUDvJy9dmQTuwuX64eWaJewubE7siOiXjxd1sNl1waEfsDCas/D8Wq1KG1wzqT9DUa8pTRAtpAONI9Pw+u0J5j2w5fGzAmWDpjzTGXL1dWO4Rb69wzIj5ux2Gnvy/iV6b9M5sjoj07Jlg6sUQNnIaLjNhRqJIM/cT+GJBoyFdGpSBORyodNV2hOcjGxD4YkIkDYIyXkQ1YfcTlwzy9aY377VBGOR4THWW6XDsrUKHpcYcd4y1AxhWpIKz2LO2J3Qojou5bkKtFbpnY+9nRnY9GTUWYyLRSdSnTE7stIBMGwrB0UrkO5jdeoj+T1F+A93a97caJve+tLoPfX5dKRwWUazuZnNgp2yEjO7YQhan/OgScJuoTOz4iSpo/cvuIWKCMaWH8i59TFJi3f5n6ItMjIhU7xhaiRL0LUQhae5yyHXFft7l9Yi/o5B4rVka+gLCRiXJ0qn+5xsDExE7XjrEWIGNlKphR873DEZFTp4FStdi9I2Int0uqjBmPsJkphdhsv1K1kWk7JlKA4V2IwqsF+CsJxRaQ+XUakGNiN0/s0RcZO8QdZZL84BS/Muw8EyMiHTu8LUCIFqog+IuTT8CI/movyFVPwhhSO1DuiYKOuHHIUGZ8YYfX1FJ1J5N2TCiiBsPL0jH5Snht1SGY23AJIhougXjrRrfdp9sHo5PbyNqZ4TBS6ajJclXRVLm6x5URka4dXv2AjM5XwkQF9sOf2vJM7rqLnbSD213QyV3GymM06Ma3WBk6Ra7WMfZBUEYZxr3R+R0y5K+tvyo7nP1fpWqRrEwtvD/U9+nmK7l7pZ3R/sjwCjznU4y9+VoJdoZ1O/KVD0bnddb8t3TPE89eL8GSA+UqQX0pJuxle2IvUMYcKUS5qciwjlQ6yqcYzZ5UgmGT5epeVw5z7wEwxuR1msbko6sGAzEwJVpBgBwTrJNjgltM2lGAxvYUorHt+WiMcFhcnuhkXAHqO6FYtcKnGFP5FKm6nbHj1QLlJa8C1XqvPKUYWbqf9v/YrMDSfi3XCDJLsKTaEkxwxckR8a4Mjd0pU8a9W4glDf/nvVOJl3T/b8bLVNzxRaq/TShCV00owlrGy9COcTLVYbKodmwh+o13gfI/3oXKPK8CVebL+XunMP1zlCgFATKMLylSJeUVY7xNxSreziIVT12E8g7KVLz9MjRhlwyNr5cp4xSFyoSl+FN8KN8dMpKRjGQkIxkJ4r78Pwv259NnjlZFAAAAAElFTkSuQmCC", import.meta.url).href, y.className = "mjr-mfv-ch-icon", y.alt = "", y.setAttribute("aria-hidden", "true"), b.appendChild(y), n.appendChild(b);
  const g = (M) => {
    if (!M || M === "rgb")
      b.replaceChildren(y);
    else {
      const A = jn[M] || "#e0e0e0", N = On[M] || "500", j = kn[M] || M.toUpperCase(), O = document.createElement("span");
      O.className = "mjr-mfv-ch-label", O.style.color = A, O.style.fontWeight = N, O.textContent = j, b.replaceChildren(O);
    }
  }, C = document.createElement("div");
  C.className = "mjr-mfv-ch-popover", t.element.appendChild(C);
  const S = document.createElement("div");
  S.className = "mjr-menu", S.style.cssText = "display:grid;gap:4px;", C.appendChild(S);
  const x = document.createElement("select");
  x.style.cssText = "position:absolute;opacity:0;pointer-events:none;width:0;height:0;overflow:hidden;", C.appendChild(x);
  const B = [
    { value: "rgb", color: "#e0e0e0", weight: "500", label: "RGB" },
    { value: "r", color: "#ff5555", weight: "700", label: "R" },
    { value: "g", color: "#44dd66", weight: "700", label: "G" },
    { value: "b", color: "#5599ff", weight: "700", label: "B" },
    { value: "a", color: "#ffffff", weight: "700", label: "A" },
    { value: "l", color: "#bbbbbb", weight: "400", label: "L" }
  ], L = [];
  for (const M of B) {
    const A = document.createElement("option");
    A.value = M.value, x.appendChild(A);
    const N = document.createElement("button");
    N.type = "button", N.className = "mjr-menu-item", N.dataset.value = M.value;
    const j = document.createElement("span");
    j.className = "mjr-menu-item-label";
    const O = document.createElement("span");
    O.textContent = M.label, O.style.color = M.color, O.style.fontWeight = M.weight, j.appendChild(O);
    const Y = document.createElement("i");
    Y.className = "pi pi-check mjr-menu-item-check", Y.style.opacity = M.value === _ ? "1" : "0", N.appendChild(j), N.appendChild(Y), S.appendChild(N), L.push(N), M.value === _ && N.classList.add("is-active");
  }
  x.value = _, g(_), b.classList.toggle("is-on", _ !== "rgb"), t._channelSelect = x, t._chBtn = b, t._chPopover = C;
  const F = () => {
    const M = b.getBoundingClientRect(), A = t.element.getBoundingClientRect();
    C.style.left = `${M.left - A.left}px`, C.style.top = `${M.bottom - A.top + 4}px`, C.classList.add("is-open"), b.setAttribute("aria-expanded", "true");
  };
  t._closeChPopover = () => {
    C.classList.remove("is-open"), b.setAttribute("aria-expanded", "false");
  }, b.addEventListener("click", (M) => {
    var A;
    M.stopPropagation(), C.classList.contains("is-open") ? t._closeChPopover() : ((A = t._closeAllToolbarPopovers) == null || A.call(t), F());
  }), S.addEventListener("click", (M) => {
    const A = M.target.closest(".mjr-menu-item");
    if (!A) return;
    const N = A.dataset.value;
    x.value = N, x.dispatchEvent(new Event("change", { bubbles: !0 })), L.forEach((j) => {
      const O = j.dataset.value === N;
      j.classList.toggle("is-active", O), j.querySelector(".mjr-menu-item-check").style.opacity = O ? "1" : "0";
    }), g(N), b.classList.toggle("is-on", N !== "rgb"), t._closeChPopover();
  }), t._closeAllToolbarPopovers = () => {
    var M, A, N, j, O;
    (M = t._closeChPopover) == null || M.call(t), (A = t._closeGuidePopover) == null || A.call(t), (N = t._closePinPopover) == null || N.call(t), (j = t._closeFormatPopover) == null || j.call(t), (O = t._closeGenDropdown) == null || O.call(t);
  }, t._exposureCtl = e("Exposure (EV)", {
    min: -10,
    max: 10,
    step: 0.1,
    value: Number(t._exposureEV || 0)
  }), t._exposureCtl.out.textContent = `${Number(t._exposureEV || 0).toFixed(1)}EV`, t._exposureCtl.out.title = "Click to reset to 0 EV", t._exposureCtl.out.style.cursor = "pointer", t._exposureCtl.wrap.classList.toggle("is-active", (t._exposureEV || 0) !== 0), n.appendChild(t._exposureCtl.wrap), t._formatToggle = document.createElement("button"), t._formatToggle.type = "button", t._formatToggle.className = "mjr-icon-btn mjr-mfv-format-trigger", t._formatToggle.setAttribute("aria-haspopup", "dialog"), t._formatToggle.setAttribute("aria-expanded", "false"), t._formatToggle.setAttribute("aria-pressed", "false"), t._formatToggle.title = "Format mask", t._formatToggle.innerHTML = '<i class="pi pi-stop" aria-hidden="true"></i>', n.appendChild(t._formatToggle);
  const P = document.createElement("div");
  P.className = "mjr-mfv-format-popover", t.element.appendChild(P);
  const I = document.createElement("div");
  I.className = "mjr-menu", I.style.cssText = "display:grid;gap:4px;", P.appendChild(I);
  const G = document.createElement("select");
  G.style.cssText = "position:absolute;opacity:0;pointer-events:none;width:0;height:0;overflow:hidden;", P.appendChild(G);
  const U = [
    { value: "off", label: "Off" },
    { value: "image", label: "Image" },
    { value: "16:9", label: "16:9" },
    { value: "1:1", label: "1:1" },
    { value: "4:3", label: "4:3" },
    { value: "9:16", label: "9:16" },
    { value: "2.39", label: "2.39" }
  ], q = [], $ = t._overlayMaskEnabled ? String(t._overlayFormat || "image") : "off";
  for (const M of U) {
    const A = document.createElement("option");
    A.value = M.value, G.appendChild(A);
    const N = document.createElement("button");
    N.type = "button", N.className = "mjr-menu-item", N.dataset.value = M.value;
    const j = document.createElement("span");
    j.className = "mjr-menu-item-label", j.textContent = M.label;
    const O = document.createElement("i");
    O.className = "pi pi-check mjr-menu-item-check", O.style.opacity = M.value === $ ? "1" : "0", N.appendChild(j), N.appendChild(O), I.appendChild(N), q.push(N), M.value === $ && N.classList.add("is-active");
  }
  G.value = $;
  const Z = document.createElement("div");
  Z.className = "mjr-mfv-format-sep", P.appendChild(Z);
  const K = document.createElement("div");
  K.className = "mjr-mfv-format-slider-row", P.appendChild(K);
  const st = document.createElement("span");
  st.className = "mjr-mfv-format-slider-label", st.textContent = "Opacity", K.appendChild(st), t._maskOpacityCtl = e("Mask opacity", {
    min: 0,
    max: 0.9,
    step: 0.01,
    value: Number(t._overlayMaskOpacity ?? 0.65)
  }), K.appendChild(t._maskOpacityCtl.input), K.appendChild(t._maskOpacityCtl.out), t._formatSelect = G, t._formatPopover = P;
  const it = () => {
    const M = t._formatToggle.getBoundingClientRect(), A = t.element.getBoundingClientRect();
    P.style.left = `${M.left - A.left}px`, P.style.top = `${M.bottom - A.top + 4}px`, P.classList.add("is-open"), t._formatToggle.setAttribute("aria-expanded", "true");
  };
  t._closeFormatPopover = () => {
    P.classList.remove("is-open"), t._formatToggle.setAttribute("aria-expanded", "false");
  }, t._formatToggle.addEventListener("click", (M) => {
    var A;
    M.stopPropagation(), P.classList.contains("is-open") ? t._closeFormatPopover() : ((A = t._closeAllToolbarPopovers) == null || A.call(t), it());
  }), I.addEventListener("click", (M) => {
    const A = M.target.closest(".mjr-menu-item");
    if (!A) return;
    const N = A.dataset.value;
    G.value = N, G.dispatchEvent(new Event("change", { bubbles: !0 })), q.forEach((j) => {
      const O = j.dataset.value === N;
      j.classList.toggle("is-active", O), j.querySelector(".mjr-menu-item-check").style.opacity = O ? "1" : "0";
    }), t._closeFormatPopover();
  });
  const at = document.createElement("div");
  at.className = "mjr-mfv-toolbar-sep", at.setAttribute("aria-hidden", "true"), n.appendChild(at), t._liveBtn = document.createElement("button"), t._liveBtn.type = "button", t._liveBtn.className = "mjr-icon-btn", t._liveBtn.innerHTML = '<i class="pi pi-circle" aria-hidden="true"></i>', t._liveBtn.setAttribute("aria-pressed", "false"), yt(
    t._liveBtn,
    H("tooltip.liveStreamOff", "Live Stream: OFF - click to follow final generation outputs"),
    de
  ), n.appendChild(t._liveBtn), t._previewBtn = document.createElement("button"), t._previewBtn.type = "button", t._previewBtn.className = "mjr-icon-btn", t._previewBtn.innerHTML = '<i class="pi pi-eye" aria-hidden="true"></i>', t._previewBtn.setAttribute("aria-pressed", "false"), yt(
    t._previewBtn,
    H(
      "tooltip.previewStreamOff",
      "KSampler Preview: OFF - click to stream sampler denoising frames"
    ),
    ue
  ), n.appendChild(t._previewBtn), t._nodeStreamBtn = document.createElement("button"), t._nodeStreamBtn.type = "button", t._nodeStreamBtn.className = "mjr-icon-btn", t._nodeStreamBtn.innerHTML = '<i class="pi pi-sitemap" aria-hidden="true"></i>', t._nodeStreamBtn.setAttribute("aria-pressed", "false"), yt(
    t._nodeStreamBtn,
    H(
      "tooltip.nodeStreamOff",
      "Node Stream: OFF - click to follow selected node previews, including ImageOps live canvases"
    ),
    pe
  ), n.appendChild(t._nodeStreamBtn), t._genBtn = document.createElement("button"), t._genBtn.type = "button", t._genBtn.className = "mjr-icon-btn", t._genBtn.setAttribute("aria-haspopup", "dialog"), t._genBtn.setAttribute("aria-expanded", "false");
  const rt = document.createElement("i");
  rt.className = "pi pi-info-circle", rt.setAttribute("aria-hidden", "true"), t._genBtn.appendChild(rt), n.appendChild(t._genBtn), t._updateGenBtnUI(), t._popoutBtn = document.createElement("button"), t._popoutBtn.type = "button", t._popoutBtn.className = "mjr-icon-btn";
  const lt = H("tooltip.popOutViewer", "Pop out viewer to separate window");
  t._popoutBtn.title = lt, t._popoutBtn.setAttribute("aria-label", lt), t._popoutBtn.setAttribute("aria-pressed", "false");
  const E = document.createElement("i");
  E.className = "pi pi-external-link", E.setAttribute("aria-hidden", "true"), t._popoutBtn.appendChild(E), n.appendChild(t._popoutBtn), t._captureBtn = document.createElement("button"), t._captureBtn.type = "button", t._captureBtn.className = "mjr-icon-btn";
  const k = H("tooltip.captureView", "Save view as image");
  t._captureBtn.title = k, t._captureBtn.setAttribute("aria-label", k);
  const V = document.createElement("i");
  V.className = "pi pi-download", V.setAttribute("aria-hidden", "true"), t._captureBtn.appendChild(V), n.appendChild(t._captureBtn);
  const R = document.createElement("div");
  R.className = "mjr-mfv-toolbar-sep", R.style.marginLeft = "auto", R.setAttribute("aria-hidden", "true"), n.appendChild(R), t._settingsBtn = document.createElement("button"), t._settingsBtn.type = "button", t._settingsBtn.className = "mjr-icon-btn mjr-mfv-settings-btn";
  const z = H("tooltip.nodeParams", "Node Parameters");
  t._settingsBtn.title = z, t._settingsBtn.setAttribute("aria-label", z), t._settingsBtn.setAttribute("aria-pressed", "false");
  const J = document.createElement("i");
  return J.className = "pi pi-sliders-h", J.setAttribute("aria-hidden", "true"), t._settingsBtn.appendChild(J), n.appendChild(t._settingsBtn), t._runHandle = Pn(), n.appendChild(t._runHandle.el), t._handleDocClick = (M) => {
    var N, j, O, Y, W, w, jt, kt, Ot, mt, Gt, Vt, Rt, Ht, ht, vt, Dt, Ut, zt, ft, Wt, Yt, Qt, _t, qt;
    const A = M == null ? void 0 : M.target;
    t._genDropdown && !((j = (N = t._genBtn) == null ? void 0 : N.contains) != null && j.call(N, A)) && !t._genDropdown.contains(A) && t._closeGenDropdown(), (Y = (O = t._chPopover) == null ? void 0 : O.classList) != null && Y.contains("is-open") && !((w = (W = t._chBtn) == null ? void 0 : W.contains) != null && w.call(W, A)) && !t._chPopover.contains(A) && ((jt = t._closeChPopover) == null || jt.call(t)), (Ot = (kt = t._guidePopover) == null ? void 0 : kt.classList) != null && Ot.contains("is-open") && !((Gt = (mt = t._guideBtn) == null ? void 0 : mt.contains) != null && Gt.call(mt, A)) && !t._guidePopover.contains(A) && ((Vt = t._closeGuidePopover) == null || Vt.call(t)), (Ht = (Rt = t._pinPopover) == null ? void 0 : Rt.classList) != null && Ht.contains("is-open") && !((vt = (ht = t._pinBtn) == null ? void 0 : ht.contains) != null && vt.call(ht, A)) && !t._pinPopover.contains(A) && ((Dt = t._closePinPopover) == null || Dt.call(t)), (zt = (Ut = t._formatPopover) == null ? void 0 : Ut.classList) != null && zt.contains("is-open") && !((Wt = (ft = t._formatToggle) == null ? void 0 : ft.contains) != null && Wt.call(ft, A)) && !t._formatPopover.contains(A) && ((Yt = t._closeFormatPopover) == null || Yt.call(t)), (Qt = A == null ? void 0 : A.closest) != null && Qt.call(A, ".mjr-mfv-idrop") || (qt = (_t = t.element) == null ? void 0 : _t.querySelectorAll) == null || qt.call(_t, ".mjr-mfv-idrop-menu.is-open").forEach((Ee) => Ee.classList.remove("is-open"));
  }, t._bindDocumentUiHandlers(), n;
}
function Hn(t) {
  var n, o, s, i, r, l, u, a, d, c, m, h, f, p, _, b, y, g, C, S, x;
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
      t._dispatchControllerAction("close", ct.MFV_CLOSE);
    },
    { signal: e }
  ), (i = t._modeBtn) == null || i.addEventListener("click", () => t._cycleMode(), { signal: e }), (r = t._pinGroup) == null || r.addEventListener(
    "click",
    (B) => {
      var P, I;
      const L = (I = (P = B.target) == null ? void 0 : P.closest) == null ? void 0 : I.call(P, ".mjr-mfv-pin-btn");
      if (!L) return;
      const F = L.dataset.slot;
      F && (t._pinnedSlots.has(F) ? t._pinnedSlots.delete(F) : t._pinnedSlots.add(F), t._pinnedSlots.has("C") || t._pinnedSlots.has("D") ? t._mode !== T.GRID && t.setMode(T.GRID) : t._pinnedSlots.size > 0 && t._mode === T.SIMPLE && t.setMode(T.AB), t._updatePinUI());
    },
    { signal: e }
  ), (l = t._liveBtn) == null || l.addEventListener(
    "click",
    () => {
      t._dispatchControllerAction("toggleLive", ct.MFV_LIVE_TOGGLE);
    },
    { signal: e }
  ), (u = t._previewBtn) == null || u.addEventListener(
    "click",
    () => {
      t._dispatchControllerAction("togglePreview", ct.MFV_PREVIEW_TOGGLE);
    },
    { signal: e }
  ), (a = t._nodeStreamBtn) == null || a.addEventListener(
    "click",
    () => {
      t._dispatchControllerAction("toggleNodeStream", ct.MFV_NODESTREAM_TOGGLE);
    },
    { signal: e }
  ), (d = t._genBtn) == null || d.addEventListener(
    "click",
    (B) => {
      var L, F, P;
      B.stopPropagation(), (F = (L = t._genDropdown) == null ? void 0 : L.classList) != null && F.contains("is-visible") ? t._closeGenDropdown() : ((P = t._closeAllToolbarPopovers) == null || P.call(t), t._openGenDropdown());
    },
    { signal: e }
  ), (c = t._popoutBtn) == null || c.addEventListener(
    "click",
    () => {
      t._dispatchControllerAction("popOut", ct.MFV_POPOUT);
    },
    { signal: e }
  ), (m = t._captureBtn) == null || m.addEventListener("click", () => t._captureView(), { signal: e }), (h = t._settingsBtn) == null || h.addEventListener(
    "click",
    () => {
      var B, L;
      (B = t._sidebar) == null || B.toggle(), t._updateSettingsBtnState(((L = t._sidebar) == null ? void 0 : L.isVisible) ?? !1);
    },
    { signal: e }
  ), (f = t._guidesSelect) == null || f.addEventListener(
    "change",
    () => {
      var B, L;
      t._gridMode = Number(t._guidesSelect.value) || 0, (B = t._guideBtn) == null || B.classList.toggle("is-on", t._gridMode !== 0), (L = t._redrawOverlayGuides) == null || L.call(t);
    },
    { signal: e }
  ), (p = t._channelSelect) == null || p.addEventListener(
    "change",
    () => {
      var B, L;
      t._channel = String(t._channelSelect.value || "rgb"), (B = t._chBtn) == null || B.classList.toggle("is-on", t._channel !== "rgb"), (L = t._applyMediaToneControls) == null || L.call(t);
    },
    { signal: e }
  ), (b = (_ = t._exposureCtl) == null ? void 0 : _.input) == null || b.addEventListener(
    "input",
    () => {
      var L;
      const B = Math.max(-10, Math.min(10, Number(t._exposureCtl.input.value) || 0));
      t._exposureEV = Math.round(B * 10) / 10, t._exposureCtl.out.textContent = `${t._exposureEV.toFixed(1)}EV`, t._exposureCtl.wrap.classList.toggle("is-active", t._exposureEV !== 0), (L = t._applyMediaToneControls) == null || L.call(t);
    },
    { signal: e }
  ), (g = (y = t._exposureCtl) == null ? void 0 : y.out) == null || g.addEventListener(
    "click",
    () => {
      var B;
      t._exposureEV = 0, t._exposureCtl.input.value = "0", t._exposureCtl.out.textContent = "0.0EV", t._exposureCtl.wrap.classList.remove("is-active"), (B = t._applyMediaToneControls) == null || B.call(t);
    },
    { signal: e }
  ), (C = t._formatSelect) == null || C.addEventListener(
    "change",
    () => {
      var L, F, P;
      const B = String(t._formatSelect.value || "image");
      B === "off" ? t._overlayMaskEnabled = !1 : (t._overlayMaskEnabled = !0, t._overlayFormat = B), (L = t._formatToggle) == null || L.classList.toggle("is-on", !!t._overlayMaskEnabled), (F = t._formatToggle) == null || F.setAttribute(
        "aria-pressed",
        String(!!t._overlayMaskEnabled)
      ), (P = t._redrawOverlayGuides) == null || P.call(t);
    },
    { signal: e }
  ), (x = (S = t._maskOpacityCtl) == null ? void 0 : S.input) == null || x.addEventListener(
    "input",
    () => {
      var F;
      const B = Number(t._maskOpacityCtl.input.value), L = Math.max(0, Math.min(0.9, Number.isFinite(B) ? B : 0.65));
      t._overlayMaskOpacity = Math.round(L * 100) / 100, t._maskOpacityCtl.out.textContent = t._overlayMaskOpacity.toFixed(2), (F = t._redrawOverlayGuides) == null || F.call(t);
    },
    { signal: e }
  );
}
function vn(t, e) {
  t._settingsBtn && (t._settingsBtn.classList.toggle("active", !!e), t._settingsBtn.setAttribute("aria-pressed", String(!!e)));
}
function Dn(t) {
  var n;
  if (!t._contentWrapper) return;
  const e = pt.MFV_SIDEBAR_POSITION || "right";
  t._contentWrapper.setAttribute("data-sidebar-pos", e), (n = t._sidebar) != null && n.el && t._contentEl && (e === "left" ? t._contentWrapper.insertBefore(t._sidebar.el, t._contentEl) : t._contentWrapper.appendChild(t._sidebar.el));
}
function Un(t) {
  var e, n, o;
  t._closeGenDropdown();
  try {
    (n = (e = t._genDropdown) == null ? void 0 : e.remove) == null || n.call(e);
  } catch (s) {
    (o = console.debug) == null || o.call(console, s);
  }
  t._genDropdown = null, t._updateGenBtnUI();
}
function zn(t) {
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
function Wn(t) {
  var e, n;
  try {
    (e = t._docAC) == null || e.abort();
  } catch (o) {
    (n = console.debug) == null || n.call(console, o);
  }
  t._docAC = new AbortController(), t._docClickHost = null;
}
function Yn(t) {
  var e, n;
  return !!((n = (e = t._genDropdown) == null ? void 0 : e.classList) != null && n.contains("is-visible"));
}
function Qn(t) {
  if (!t.element) return;
  t._genDropdown || (t._genDropdown = t._buildGenDropdown(), t.element.appendChild(t._genDropdown)), t._bindDocumentUiHandlers();
  const e = t._genBtn.getBoundingClientRect(), n = t.element.getBoundingClientRect(), o = e.left - n.left, s = e.bottom - n.top + 6;
  t._genDropdown.style.left = `${o}px`, t._genDropdown.style.top = `${s}px`, t._genDropdown.classList.add("is-visible"), t._updateGenBtnUI();
}
function qn(t) {
  t._genDropdown && (t._genDropdown.classList.remove("is-visible"), t._updateGenBtnUI());
}
function Xn(t) {
  if (!t._genBtn) return;
  const e = t._genInfoSelections.size, n = e > 0, o = t._isGenDropdownOpen();
  t._genBtn.classList.toggle("is-on", n), t._genBtn.classList.toggle("is-open", o);
  const s = n ? `Gen Info (${e} field${e > 1 ? "s" : ""} shown)${o ? " — open" : " — click to configure"}` : `Gen Info${o ? " — open" : " — click to show overlay"}`;
  t._genBtn.title = s, t._genBtn.setAttribute("aria-label", s), t._genBtn.setAttribute("aria-expanded", String(o)), t._genDropdown ? t._genBtn.setAttribute("aria-controls", t._genDropdownId) : t._genBtn.removeAttribute("aria-controls");
}
function Zn(t) {
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
function Kn(t) {
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
function Jn(t, e) {
  var i, r, l, u;
  if (!e) return {};
  try {
    const a = e.geninfo ? { geninfo: e.geninfo } : e.metadata || e.metadata_raw || e, d = ke(a) || null, c = {
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
      d.prompt && (c.prompt = Mt(String(d.prompt))), d.seed != null && (c.seed = String(d.seed)), d.model && (c.model = Array.isArray(d.model) ? d.model.join(", ") : String(d.model)), Array.isArray(d.loras) && (c.lora = d.loras.map(
        (h) => typeof h == "string" ? h : (h == null ? void 0 : h.name) || (h == null ? void 0 : h.lora_name) || (h == null ? void 0 : h.model_name) || ""
      ).filter(Boolean).join(", ")), d.sampler && (c.sampler = String(d.sampler)), d.scheduler && (c.scheduler = String(d.scheduler)), d.cfg != null && (c.cfg = String(d.cfg)), d.steps != null && (c.step = String(d.steps)), !c.prompt && (a != null && a.prompt) && (c.prompt = Mt(String(a.prompt || "")));
      const m = e.generation_time_ms ?? ((i = e.metadata_raw) == null ? void 0 : i.generation_time_ms) ?? (a == null ? void 0 : a.generation_time_ms) ?? ((r = a == null ? void 0 : a.geninfo) == null ? void 0 : r.generation_time_ms) ?? 0;
      return m && Number.isFinite(Number(m)) && m > 0 && m < 864e5 && (c.genTime = oe(Number(m) / 1e3)), c;
    }
  } catch (a) {
    (l = console.debug) == null || l.call(console, "[MFV] geninfo normalize failed", a);
  }
  const n = (e == null ? void 0 : e.metadata) || (e == null ? void 0 : e.metadata_raw) || e || {}, o = {
    prompt: Mt(String((n == null ? void 0 : n.prompt) || (n == null ? void 0 : n.positive) || "")),
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
function wn(t, e) {
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
      const d = Kn(r);
      let c = "#4CAF50";
      d >= 60 ? c = "#FF9800" : d >= 30 ? c = "#FFC107" : d >= 10 && (c = "#8BC34A");
      const m = document.createElement("span");
      m.style.color = c, m.style.fontWeight = "600", m.textContent = r, u.appendChild(m);
    } else
      u.appendChild(document.createTextNode(r));
    o.appendChild(u);
  }
  return o.childNodes.length > 0 ? o : null;
}
function $n(t) {
  var e, n, o;
  try {
    (n = (e = t._controller) == null ? void 0 : e.onModeChanged) == null || n.call(e, t._mode);
  } catch (s) {
    (o = console.debug) == null || o.call(console, s);
  }
}
function to(t) {
  const e = [T.SIMPLE, T.AB, T.SIDE, T.GRID];
  t._mode = e[(e.indexOf(t._mode) + 1) % e.length], t._updateModeBtnUI(), t._refresh(), t._notifyModeChanged();
}
function eo(t, e) {
  Object.values(T).includes(e) && (t._mode = e, t._updateModeBtnUI(), t._refresh(), t._notifyModeChanged());
}
function no(t) {
  return t._pinnedSlots;
}
function oo(t) {
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
function so(t) {
  if (!t._modeBtn) return;
  const e = {
    [T.SIMPLE]: { icon: "pi-image", label: "Mode: Simple - click to switch" },
    [T.AB]: { icon: "pi-clone", label: "Mode: A/B Compare - click to switch" },
    [T.SIDE]: { icon: "pi-table", label: "Mode: Side-by-Side - click to switch" },
    [T.GRID]: {
      icon: "pi-th-large",
      label: "Mode: Grid Compare (up to 4) - click to switch"
    }
  }, { icon: n = "pi-image", label: o = "" } = e[t._mode] || {}, s = St(o, He), i = document.createElement("i");
  i.className = `pi ${n}`, i.setAttribute("aria-hidden", "true"), t._modeBtn.replaceChildren(i), t._modeBtn.title = s, t._modeBtn.setAttribute("aria-label", s), t._modeBtn.removeAttribute("aria-pressed"), t._modeBtn.classList.toggle("is-on", t._mode !== T.SIMPLE);
}
function io(t, e) {
  if (!t._liveBtn) return;
  const n = !!e;
  t._liveBtn.classList.toggle("mjr-live-active", n);
  const o = n ? H(
    "tooltip.liveStreamOn",
    "Live Stream: ON - follows final generation outputs after execution"
  ) : H("tooltip.liveStreamOff", "Live Stream: OFF - click to follow final generation outputs"), s = St(o, de);
  t._liveBtn.setAttribute("aria-pressed", String(n)), t._liveBtn.setAttribute("aria-label", s);
  const i = document.createElement("i");
  i.className = n ? "pi pi-circle-fill" : "pi pi-circle", i.setAttribute("aria-hidden", "true"), t._liveBtn.replaceChildren(i), t._liveBtn.title = s;
}
function ao(t, e) {
  if (t._previewActive = !!e, !t._previewBtn) return;
  t._previewBtn.classList.toggle("mjr-preview-active", t._previewActive);
  const n = t._previewActive ? H(
    "tooltip.previewStreamOn",
    "KSampler Preview: ON - streams sampler denoising frames during execution"
  ) : H(
    "tooltip.previewStreamOff",
    "KSampler Preview: OFF - click to stream sampler denoising frames"
  ), o = St(n, ue);
  t._previewBtn.setAttribute("aria-pressed", String(t._previewActive)), t._previewBtn.setAttribute("aria-label", o);
  const s = document.createElement("i");
  s.className = t._previewActive ? "pi pi-eye" : "pi pi-eye-slash", s.setAttribute("aria-hidden", "true"), t._previewBtn.replaceChildren(s), t._previewBtn.title = o, t._previewActive || t._revokePreviewBlob();
}
function ro(t, e, n = {}) {
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
function lo(t) {
  if (t._previewBlobUrl) {
    try {
      URL.revokeObjectURL(t._previewBlobUrl);
    } catch {
    }
    t._previewBlobUrl = null;
  }
}
function co(t, e) {
  var i;
  if (t._nodeStreamActive = !!e, t._nodeStreamActive || (i = t.setNodeStreamSelection) == null || i.call(t, null), !t._nodeStreamBtn) return;
  t._nodeStreamBtn.classList.toggle("mjr-nodestream-active", t._nodeStreamActive);
  const n = t._nodeStreamActive ? H(
    "tooltip.nodeStreamOn",
    "Node Stream: ON - follows the selected node preview when frontend media exists"
  ) : H(
    "tooltip.nodeStreamOff",
    "Node Stream: OFF - click to follow selected node previews, including ImageOps live canvases"
  ), o = St(n, pe);
  t._nodeStreamBtn.setAttribute("aria-pressed", String(t._nodeStreamActive)), t._nodeStreamBtn.setAttribute("aria-label", o);
  const s = document.createElement("i");
  s.className = "pi pi-sitemap", s.setAttribute("aria-hidden", "true"), t._nodeStreamBtn.replaceChildren(s), t._nodeStreamBtn.title = o;
}
const uo = [
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
function po() {
  var t, e, n, o, s;
  try {
    const i = typeof window < "u" ? window : globalThis, r = (e = (t = i == null ? void 0 : i.process) == null ? void 0 : t.versions) == null ? void 0 : e.electron;
    if (typeof r == "string" && r.trim() || i != null && i.electron || i != null && i.ipcRenderer || i != null && i.electronAPI)
      return !0;
    const l = String(
      ((n = i == null ? void 0 : i.navigator) == null ? void 0 : n.userAgent) || ((o = globalThis == null ? void 0 : globalThis.navigator) == null ? void 0 : o.userAgent) || ""
    ), u = /\bElectron\//i.test(l), a = /\bCode\//i.test(l);
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
    for (const a of uo)
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
function mo(t) {
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
function Se(t) {
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
function ho(t, e) {
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
function fo(t, e) {
  var n;
  t._desktopPopoutUnsupported = !0, D(
    "electron-in-app-fallback",
    { message: (e == null ? void 0 : e.message) || String(e || "unknown error") },
    "warn"
  ), t._setDesktopExpanded(!0);
  try {
    Oe(
      H(
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
function _o(t, e, n, o, s) {
  return D(
    "electron-popup-fallback-attempt",
    { reason: (s == null ? void 0 : s.message) || String(s || "unknown") },
    "warn"
  ), t._fallbackPopout(e, n, o), t._popoutWindow ? (t._desktopPopoutUnsupported = !1, D("electron-popup-fallback-opened", null), !0) : !1;
}
function go(t) {
  var l, u;
  if (t._isPopped || !t.element) return;
  const e = t.element;
  t._stopEdgeResize();
  const n = po(), o = typeof window < "u" && "documentPictureInPicture" in window, s = String(
    ((l = window == null ? void 0 : window.navigator) == null ? void 0 : l.userAgent) || ((u = globalThis == null ? void 0 : globalThis.navigator) == null ? void 0 : u.userAgent) || ""
  ), i = Math.max(e.offsetWidth || 520, 400), r = Math.max(e.offsetHeight || 420, 300);
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
        var f, p, _;
        D("electron-pip-opened", {
          hasDocument: !!(a != null && a.document)
        }), t._popoutWindow = a, t._isPopped = !0, t._popoutRestoreGuard = !1;
        try {
          (f = t._popoutAC) == null || f.abort();
        } catch (b) {
          (p = console.debug) == null || p.call(console, b);
        }
        t._popoutAC = new AbortController();
        const d = t._popoutAC.signal, c = () => t._schedulePopInFromPopupClose();
        t._popoutCloseHandler = c;
        const m = a.document;
        m.title = "Majoor Viewer", t._installPopoutStyles(m);
        const h = Se(m);
        if (!h) {
          t._activateDesktopExpandedFallback(
            new Error("Popup root creation failed")
          );
          return;
        }
        try {
          const b = typeof m.adoptNode == "function" ? m.adoptNode(e) : e;
          h.appendChild(b), D("electron-pip-adopted", {
            usedAdoptNode: typeof m.adoptNode == "function"
          });
        } catch (b) {
          D(
            "electron-pip-adopt-failed",
            { message: (b == null ? void 0 : b.message) || String(b) },
            "warn"
          ), console.warn("[MFV] PiP adoptNode failed", b), t._isPopped = !1, t._popoutWindow = null;
          try {
            a.close();
          } catch (y) {
            (_ = console.debug) == null || _.call(console, y);
          }
          t._activateDesktopExpandedFallback(b);
          return;
        }
        e.classList.add("is-visible"), t.isVisible = !0, t._resetGenDropdownForCurrentDocument(), t._rebindControlHandlers(), t._bindDocumentUiHandlers(), t._updatePopoutBtnUI(), D("electron-pip-ready", { isPopped: t._isPopped }), a.addEventListener("pagehide", c, {
          signal: d
        }), t._startPopoutCloseWatch(), t._popoutKeydownHandler = (b) => {
          var g, C;
          const y = String(((g = b == null ? void 0 : b.target) == null ? void 0 : g.tagName) || "").toLowerCase();
          b != null && b.defaultPrevented || (C = b == null ? void 0 : b.target) != null && C.isContentEditable || y === "input" || y === "textarea" || y === "select" || t._forwardKeydownToController(b);
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
function bo(t, e, n, o) {
  var c, m, h, f;
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
    (m = console.debug) == null || m.call(console, p);
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
    const _ = Se(p);
    if (_) {
      try {
        _.appendChild(p.adoptNode(e));
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
    } catch (_) {
      (f = console.debug) == null || f.call(console, "[MFV] pop-out page load listener failed", _);
    }
  }
  l.addEventListener("beforeunload", a, { signal: u }), l.addEventListener("pagehide", a, { signal: u }), l.addEventListener("unload", a, { signal: u }), t._startPopoutCloseWatch(), t._popoutKeydownHandler = (p) => {
    var b, y;
    const _ = String(((b = p == null ? void 0 : p.target) == null ? void 0 : b.tagName) || "").toLowerCase();
    p != null && p.defaultPrevented || (y = p == null ? void 0 : p.target) != null && y.isContentEditable || _ === "input" || _ === "textarea" || _ === "select" || t._forwardKeydownToController(p);
  }, l.addEventListener("keydown", t._popoutKeydownHandler, { signal: u });
}
function yo(t) {
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
function Co(t) {
  t._clearPopoutCloseWatch(), t._popoutCloseTimer = window.setInterval(() => {
    if (!t._isPopped) {
      t._clearPopoutCloseWatch();
      return;
    }
    const e = t._popoutWindow;
    (!e || e.closed) && (t._clearPopoutCloseWatch(), t._schedulePopInFromPopupClose());
  }, 250);
}
function Ao(t) {
  !t._isPopped || t._popoutRestoreGuard || (t._popoutRestoreGuard = !0, window.setTimeout(() => {
    try {
      t.popIn({ closePopupWindow: !1 });
    } finally {
      t._popoutRestoreGuard = !1;
    }
  }, 0));
}
function So(t, e) {
  var o, s, i;
  if (!(e != null && e.head)) return;
  try {
    for (const r of e.head.querySelectorAll("[data-mjr-popout-cloned-style='1']"))
      r.remove();
  } catch (r) {
    (o = console.debug) == null || o.call(console, r);
  }
  mo(e);
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
function Eo(t, { closePopupWindow: e = !0 } = {}) {
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
function Mo(t) {
  if (!t._popoutBtn) return;
  const e = t._isPopped || t._desktopExpanded;
  t.element && t.element.classList.toggle("mjr-mfv--popped", e), t._popoutBtn.classList.toggle("mjr-popin-active", e);
  const n = t._popoutBtn.querySelector("i") || document.createElement("i"), o = e ? H("tooltip.popInViewer", "Return to floating panel") : H("tooltip.popOutViewer", "Pop out viewer to separate window");
  n.className = e ? "pi pi-sign-in" : "pi pi-external-link", t._popoutBtn.title = o, t._popoutBtn.setAttribute("aria-label", o), t._popoutBtn.setAttribute("aria-pressed", String(e)), t._popoutBtn.contains(n) || t._popoutBtn.replaceChildren(n);
}
function Bo(t) {
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
function No(t, e, n) {
  if (!n) return "";
  const o = t <= n.left + bt, s = t >= n.right - bt, i = e <= n.top + bt, r = e >= n.bottom - bt;
  return i && o ? "nw" : i && s ? "ne" : r && o ? "sw" : r && s ? "se" : i ? "n" : r ? "s" : o ? "w" : s ? "e" : "";
}
function xo(t) {
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
function Po(t) {
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
function Lo(t, e) {
  var l;
  if (!e) return;
  const n = (u) => {
    if (!t.element || t._isPopped) return "";
    const a = t.element.getBoundingClientRect();
    return t._getResizeDirectionFromPoint(u.clientX, u.clientY, a);
  }, o = (l = t._panelAC) == null ? void 0 : l.signal, s = (u) => {
    var f;
    if (u.button !== 0 || !t.element || t._isPopped) return;
    const a = n(u);
    if (!a) return;
    u.preventDefault(), u.stopPropagation();
    const d = t.element.getBoundingClientRect(), c = window.getComputedStyle(t.element), m = Math.max(120, Number.parseFloat(c.minWidth) || 0), h = Math.max(100, Number.parseFloat(c.minHeight) || 0);
    t._resizeState = {
      pointerId: u.pointerId,
      dir: a,
      startX: u.clientX,
      startY: u.clientY,
      startLeft: d.left,
      startTop: d.top,
      startWidth: d.width,
      startHeight: d.height,
      minWidth: m,
      minHeight: h
    }, t.element.style.left = `${Math.round(d.left)}px`, t.element.style.top = `${Math.round(d.top)}px`, t.element.style.right = "auto", t.element.style.bottom = "auto", t.element.classList.add("mjr-mfv--resizing"), t.element.style.cursor = t._resizeCursorForDirection(a);
    try {
      t.element.setPointerCapture(u.pointerId);
    } catch (p) {
      (f = console.debug) == null || f.call(console, p);
    }
  }, i = (u) => {
    if (!t.element || t._isPopped) return;
    const a = t._resizeState;
    if (!a) {
      const _ = n(u);
      t.element.style.cursor = _ ? t._resizeCursorForDirection(_) : "";
      return;
    }
    if (a.pointerId !== u.pointerId) return;
    const d = u.clientX - a.startX, c = u.clientY - a.startY;
    let m = a.startWidth, h = a.startHeight, f = a.startLeft, p = a.startTop;
    a.dir.includes("e") && (m = a.startWidth + d), a.dir.includes("s") && (h = a.startHeight + c), a.dir.includes("w") && (m = a.startWidth - d, f = a.startLeft + d), a.dir.includes("n") && (h = a.startHeight - c, p = a.startTop + c), m < a.minWidth && (a.dir.includes("w") && (f -= a.minWidth - m), m = a.minWidth), h < a.minHeight && (a.dir.includes("n") && (p -= a.minHeight - h), h = a.minHeight), m = Math.min(m, Math.max(a.minWidth, window.innerWidth)), h = Math.min(h, Math.max(a.minHeight, window.innerHeight)), f = Math.min(Math.max(0, f), Math.max(0, window.innerWidth - m)), p = Math.min(Math.max(0, p), Math.max(0, window.innerHeight - h)), t.element.style.width = `${Math.round(m)}px`, t.element.style.height = `${Math.round(h)}px`, t.element.style.left = `${Math.round(f)}px`, t.element.style.top = `${Math.round(p)}px`, t.element.style.right = "auto", t.element.style.bottom = "auto";
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
function Io(t, e) {
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
      const l = o.signal, u = t.element, a = u.getBoundingClientRect(), d = i.clientX - a.left, c = i.clientY - a.top, m = (f) => {
        const p = Math.min(
          window.innerWidth - u.offsetWidth,
          Math.max(0, f.clientX - d)
        ), _ = Math.min(
          window.innerHeight - u.offsetHeight,
          Math.max(0, f.clientY - c)
        );
        u.style.left = `${p}px`, u.style.top = `${_}px`, u.style.right = "auto", u.style.bottom = "auto";
      }, h = () => {
        try {
          o == null || o.abort();
        } catch {
        }
      };
      e.addEventListener("pointermove", m, { signal: l }), e.addEventListener("pointerup", h, { signal: l });
    },
    n ? { signal: n } : void 0
  );
}
async function Fo(t, e, n, o, s, i, r, l) {
  var h, f, p, _, b;
  if (!n) return;
  const u = X(n);
  let a = null;
  if (u === "video" && (a = l instanceof HTMLVideoElement ? l : ((h = t._contentEl) == null ? void 0 : h.querySelector("video")) || null), !a && u === "model3d") {
    const y = (n == null ? void 0 : n.id) != null ? String(n.id) : "";
    y && (a = ((p = (f = t._contentEl) == null ? void 0 : f.querySelector) == null ? void 0 : p.call(
      f,
      `.mjr-model3d-render-canvas[data-mjr-asset-id="${y}"]`
    )) || null), a || (a = ((b = (_ = t._contentEl) == null ? void 0 : _.querySelector) == null ? void 0 : b.call(_, ".mjr-model3d-render-canvas")) || null);
  }
  if (!a) {
    const y = fe(n);
    if (!y) return;
    a = await new Promise((g) => {
      const C = new Image();
      C.crossOrigin = "anonymous", C.onload = () => g(C), C.onerror = () => g(null), C.src = y;
    });
  }
  if (!a) return;
  const d = a.videoWidth || a.naturalWidth || i, c = a.videoHeight || a.naturalHeight || r;
  if (!d || !c) return;
  const m = Math.min(i / d, r / c);
  e.drawImage(
    a,
    o + (i - d * m) / 2,
    s + (r - c * m) / 2,
    d * m,
    c * m
  );
}
function To(t, e, n, o) {
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
    const m = s[c] != null ? String(s[c]) : "";
    if (!m) continue;
    let h = c.charAt(0).toUpperCase() + c.slice(1);
    c === "lora" ? h = "LoRA" : c === "cfg" ? h = "CFG" : c === "genTime" && (h = "Gen Time");
    const f = `${h}: `;
    e.font = `bold ${r}px system-ui, sans-serif`;
    const p = e.measureText(f).width;
    e.font = `${r}px system-ui, sans-serif`;
    const _ = Math.max(32, a - u * 2 - p);
    let b = 0, y = "";
    for (const g of m.split(" ")) {
      const C = y ? y + " " + g : g;
      e.measureText(C).width > _ && y ? (b += 1, y = g) : y = C;
    }
    y && (b += 1), d += b;
  }
  return d > 0 ? d * l + u * 2 : 0;
}
function jo(t, e, n, o, s, i, r) {
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
  const c = 11, m = 16, h = 8, f = Math.max(100, i - h * 2);
  e.save();
  const p = [];
  for (const { label: S, value: x, color: B } of d) {
    e.font = `bold ${c}px system-ui, sans-serif`;
    const L = e.measureText(S).width;
    e.font = `${c}px system-ui, sans-serif`;
    const F = f - h * 2 - L, P = [];
    let I = "";
    for (const G of x.split(" ")) {
      const U = I ? I + " " + G : G;
      e.measureText(U).width > F && I ? (P.push(I), I = G) : I = U;
    }
    I && P.push(I), p.push({ label: S, labelW: L, lines: P, color: B });
  }
  const b = p.reduce((S, x) => S + x.lines.length, 0) * m + h * 2, y = o + h, g = s + r - b - h;
  e.globalAlpha = 0.72, e.fillStyle = "#000", _e(e, y, g, f, b, 6), e.fill(), e.globalAlpha = 1;
  let C = g + h + c;
  for (const { label: S, labelW: x, lines: B, color: L } of p)
    for (let F = 0; F < B.length; F++)
      F === 0 ? (e.font = `bold ${c}px system-ui, sans-serif`, e.fillStyle = L, e.fillText(S, y + h, C), e.font = `${c}px system-ui, sans-serif`, e.fillStyle = "rgba(255,255,255,0.88)", e.fillText(B[F], y + h + x, C)) : (e.font = `${c}px system-ui, sans-serif`, e.fillStyle = "rgba(255,255,255,0.88)", e.fillText(B[F], y + h + x, C)), C += m;
  e.restore();
}
async function ko(t) {
  var u;
  if (!t._contentEl) return;
  t._captureBtn && (t._captureBtn.disabled = !0, t._captureBtn.setAttribute("aria-label", H("tooltip.capturingView", "Capturing…")));
  const e = t._contentEl.clientWidth || 480, n = t._contentEl.clientHeight || 360;
  let o = n;
  if (t._mode === T.SIMPLE && t._mediaA && t._genInfoSelections.size) {
    const a = document.createElement("canvas");
    a.width = e, a.height = n;
    const d = a.getContext("2d"), c = t._estimateGenInfoOverlayHeight(d, t._mediaA, e);
    if (c > 0) {
      const m = Math.max(n, c + 24);
      o = Math.min(m, n * 4);
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
      t._mediaA && await t._drawMediaFit(i, t._mediaA, 0, 0, e, o, d), t._mediaB && (i.save(), i.beginPath(), i.rect(a, 0, e - a, o), i.clip(), await t._drawMediaFit(i, t._mediaB, 0, 0, e, o, c), i.restore()), i.save(), i.strokeStyle = "rgba(255,255,255,0.88)", i.lineWidth = 2, i.beginPath(), i.moveTo(a, 0), i.lineTo(a, o), i.stroke(), i.restore(), dt(i, "A", 8, 8), dt(i, "B", a + 8, 8), t._mediaA && t._drawGenInfoOverlay(i, t._mediaA, 0, 0, a, o), t._mediaB && t._drawGenInfoOverlay(i, t._mediaB, a, 0, e - a, o);
    } else if (t._mode === T.SIDE) {
      const a = Math.floor(e / 2), d = t._contentEl.querySelector(".mjr-mfv-side-panel:first-child video"), c = t._contentEl.querySelector(".mjr-mfv-side-panel:last-child video");
      t._mediaA && (await t._drawMediaFit(i, t._mediaA, 0, 0, a, o, d), t._drawGenInfoOverlay(i, t._mediaA, 0, 0, a, o)), i.fillStyle = "#111", i.fillRect(a, 0, 2, o), t._mediaB && (await t._drawMediaFit(i, t._mediaB, a, 0, a, o, c), t._drawGenInfoOverlay(i, t._mediaB, a, 0, a, o)), dt(i, "A", 8, 8), dt(i, "B", a + 8, 8);
    } else if (t._mode === T.GRID) {
      const a = Math.floor(e / 2), d = Math.floor(o / 2), c = 1, m = [
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
      for (let f = 0; f < m.length; f++) {
        const p = m[f], _ = ((u = h[f]) == null ? void 0 : u.querySelector("video")) || null;
        p.media && (await t._drawMediaFit(i, p.media, p.x, p.y, p.w, p.h, _), t._drawGenInfoOverlay(i, p.media, p.x, p.y, p.w, p.h)), dt(i, p.label, p.x + 8, p.y + 8);
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
    t._captureBtn && (t._captureBtn.disabled = !1, t._captureBtn.setAttribute(
      "aria-label",
      H("tooltip.captureView", "Save view as image")
    ));
  }
}
const Oo = "imageops-live-preview";
function re(t) {
  return String((t == null ? void 0 : t._source) || "") === Oo;
}
function Go(t, e, { autoMode: n = !1 } = {}) {
  const o = t._mediaA || null, s = re(e), i = s && re(o) && String((o == null ? void 0 : o._nodeId) || "") === String((e == null ? void 0 : e._nodeId) || "");
  if (t._mediaA = e || null, i || t._resetMfvZoom(), n && t._mode !== T.SIMPLE && (t._mode = T.SIMPLE, t._updateModeBtnUI()), t._mediaA && !s && typeof Ct == "function") {
    const r = ++t._refreshGen;
    (async () => {
      var l;
      try {
        const u = await Ct(t._mediaA, {
          getAssetMetadata: Ft,
          getFileMetadataScoped: It
        });
        if (t._refreshGen !== r) return;
        u && typeof u == "object" && (t._mediaA = u, t._refresh());
      } catch (u) {
        (l = console.debug) == null || l.call(console, "[MFV] metadata enrich error", u);
      }
    })();
  } else
    t._refresh();
}
function Vo(t, e, n) {
  t._mediaA = e || null, t._mediaB = n || null, t._resetMfvZoom(), t._mode === T.SIMPLE && (t._mode = T.AB, t._updateModeBtnUI());
  const o = ++t._refreshGen, s = async (i) => {
    if (!i) return i;
    try {
      return await Ct(i, {
        getAssetMetadata: Ft,
        getFileMetadataScoped: It
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
function Ro(t, e, n, o, s) {
  t._mediaA = e || null, t._mediaB = n || null, t._mediaC = o || null, t._mediaD = s || null, t._resetMfvZoom(), t._mode !== T.GRID && (t._mode = T.GRID, t._updateModeBtnUI());
  const i = ++t._refreshGen, r = async (l) => {
    if (!l) return l;
    try {
      return await Ct(l, {
        getAssetMetadata: Ft,
        getFileMetadataScoped: It
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
function nt(t) {
  var e, n, o, s;
  try {
    return !!((e = t == null ? void 0 : t.classList) != null && e.contains("mjr-mfv-simple-player")) || !!((n = t == null ? void 0 : t.classList) != null && n.contains("mjr-mfv-player-host")) || !!((o = t == null ? void 0 : t.querySelector) != null && o.call(t, ".mjr-video-controls, .mjr-mfv-simple-player-controls"));
  } catch (i) {
    return (s = console.debug) == null || s.call(console, i), !1;
  }
}
let Ho = 0;
class Uo {
  constructor({ controller: e = null } = {}) {
    this._instanceId = ++Ho, this._controller = e && typeof e == "object" ? { ...e } : null, this.element = null, this.isVisible = !1, this._contentEl = null, this._closeBtn = null, this._modeBtn = null, this._pinGroup = null, this._pinBtns = null, this._liveBtn = null, this._genBtn = null, this._genDropdown = null, this._captureBtn = null, this._genInfoSelections = /* @__PURE__ */ new Set(["genTime"]), this._mode = T.SIMPLE, this._mediaA = null, this._mediaB = null, this._mediaC = null, this._mediaD = null, this._pinnedSlots = /* @__PURE__ */ new Set(), this._abDividerX = 0.5, this._zoom = 1, this._panX = 0, this._panY = 0, this._panzoomAC = null, this._dragging = !1, this._compareSyncAC = null, this._btnAC = null, this._refreshGen = 0, this._popoutWindow = null, this._popoutBtn = null, this._isPopped = !1, this._desktopExpanded = !1, this._desktopExpandRestore = null, this._desktopPopoutUnsupported = !1, this._popoutCloseHandler = null, this._popoutKeydownHandler = null, this._popoutCloseTimer = null, this._popoutRestoreGuard = !1, this._previewBtn = null, this._previewBlobUrl = null, this._previewActive = !1, this._nodeStreamBtn = null, this._nodeStreamActive = !1, this._nodeStreamSelection = null, this._nodeStreamOverlayEl = null, this._docAC = new AbortController(), this._popoutAC = null, this._panelAC = new AbortController(), this._resizeState = null, this._titleId = `mjr-mfv-title-${this._instanceId}`, this._genDropdownId = `mjr-mfv-gen-dropdown-${this._instanceId}`, this._progressEl = null, this._progressNodesEl = null, this._progressStepsEl = null, this._progressTextEl = null, this._mediaProgressEl = null, this._mediaProgressTextEl = null, this._progressUpdateHandler = null, this._progressCurrentNodeId = null, this._docClickHost = null, this._handleDocClick = null, this._mediaControlHandles = [], this._layoutObserver = null, this._channel = "rgb", this._exposureEV = 0, this._gridMode = 0, this._overlayMaskEnabled = !1, this._overlayMaskOpacity = 0.65, this._overlayFormat = "image";
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
    return Gn(this);
  }
  _buildHeader() {
    return Vn(this);
  }
  _buildToolbar() {
    return Rn(this);
  }
  _rebindControlHandlers() {
    return Hn(this);
  }
  _updateSettingsBtnState(e) {
    return vn(this, e);
  }
  _applySidebarPosition() {
    return Dn(this);
  }
  refreshSidebar() {
    var e;
    (e = this._sidebar) == null || e.refresh();
  }
  _resetGenDropdownForCurrentDocument() {
    return Un(this);
  }
  _bindDocumentUiHandlers() {
    return zn(this);
  }
  _unbindDocumentUiHandlers() {
    return Wn(this);
  }
  _isGenDropdownOpen() {
    return Yn(this);
  }
  _openGenDropdown() {
    return Qn(this);
  }
  _closeGenDropdown() {
    return qn(this);
  }
  _updateGenBtnUI() {
    return Xn(this);
  }
  _buildGenDropdown() {
    return Zn(this);
  }
  _getGenFields(e) {
    return Jn(this, e);
  }
  _buildGenInfoDOM(e) {
    return wn(this, e);
  }
  _notifyModeChanged() {
    return $n(this);
  }
  _cycleMode() {
    return to(this);
  }
  setMode(e) {
    return eo(this, e);
  }
  getPinnedSlots() {
    return no(this);
  }
  _updatePinUI() {
    return oo(this);
  }
  _updateModeBtnUI() {
    return so(this);
  }
  setLiveActive(e) {
    return io(this, e);
  }
  setPreviewActive(e) {
    return ao(this, e);
  }
  loadPreviewBlob(e, n = {}) {
    return ro(this, e, n);
  }
  _revokePreviewBlob() {
    return lo(this);
  }
  setNodeStreamActive(e) {
    return co(this, e);
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
    const o = n.nodeId ? `#${n.nodeId}` : "", s = n.classType || "Node", i = n.title && n.title !== n.classType ? ` — ${n.title}` : "";
    this._nodeStreamOverlayEl.textContent = `${o} · ${s}${i}`.trim();
  }
  loadMediaA(e, { autoMode: n = !1 } = {}) {
    return Go(this, e, { autoMode: n });
  }
  /**
   * Load two assets for compare modes.
   * Auto-switches from SIMPLE → AB on first call.
   */
  loadMediaPair(e, n) {
    return Vo(this, e, n);
  }
  /**
   * Load up to 4 assets for grid compare mode.
   * Auto-switches to GRID mode if not already.
   */
  loadMediaQuad(e, n, o, s) {
    return Ro(this, e, n, o, s);
  }
  /** Apply current zoom+pan state to all media elements (img/video only — divider/overlays unaffected). */
  _applyTransform() {
    if (!this._contentEl) return;
    const e = Math.max(Nt, Math.min(xt, this._zoom)), n = this._contentEl.clientWidth || 0, o = this._contentEl.clientHeight || 0, s = Math.max(0, (e - 1) * n / 2), i = Math.max(0, (e - 1) * o / 2);
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
      [
        "mjr-mfv-ch-l",
        "0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0"
      ]
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
    var h, f, p, _, b, y;
    const e = this._overlayCanvas, n = this._contentEl;
    if (!e || !n) return;
    const o = (h = e.getContext) == null ? void 0 : h.call(e, "2d");
    if (!o) return;
    const s = Math.max(1, Math.min(3, Number(window.devicePixelRatio) || 1)), i = n.clientWidth || 0, r = n.clientHeight || 0;
    if (e.width = Math.max(1, Math.floor(i * s)), e.height = Math.max(1, Math.floor(r * s)), e.style.width = `${i}px`, e.style.height = `${r}px`, o.clearRect(0, 0, e.width, e.height), !(this._gridMode || this._overlayMaskEnabled)) return;
    const l = (f = n.getBoundingClientRect) == null ? void 0 : f.call(n);
    if (!l) return;
    const u = Array.from(
      ((p = n.querySelectorAll) == null ? void 0 : p.call(
        n,
        ".mjr-mfv-simple-container, .mjr-mfv-side-panel, .mjr-mfv-grid-cell, .mjr-mfv-ab-layer"
      )) || []
    ), a = u.length ? u : [n], d = [];
    for (const g of a) {
      const C = (_ = g.querySelector) == null ? void 0 : _.call(g, ".mjr-mfv-media");
      if (!C) continue;
      const S = (b = g.getBoundingClientRect) == null ? void 0 : b.call(g);
      if (!(S != null && S.width) || !(S != null && S.height)) continue;
      const x = Number(S.width) || 0, B = Number(S.height) || 0, L = this._getOverlayAspect(this._overlayFormat, C, S), F = this._fitAspectInBox(x, B, L), P = S.left - l.left + x / 2, I = S.top - l.top + B / 2, G = Math.max(0.1, Math.min(16, Number(this._zoom) || 1)), U = {
        x: P + F.x * G - x * G / 2 + (Number(this._panX) || 0),
        y: I + F.y * G - B * G / 2 + (Number(this._panY) || 0),
        w: F.w * G,
        h: F.h * G
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
      this._drawMaskOutside(o, e, d, this._overlayMaskOpacity), o.save(), (y = o.setLineDash) == null || y.call(o, [Math.max(2, 4 * s), Math.max(2, 3 * s)]), o.strokeStyle = "rgba(255,255,255,0.22)", o.lineWidth = Math.max(1, Math.floor(s));
      for (const g of d)
        o.strokeRect(g.x + 0.5, g.y + 0.5, g.w - 1, g.h - 1);
      o.restore();
    }
    if (this._mode !== T.SIMPLE || !this._gridMode) return;
    const c = d[0];
    if (!c) return;
    o.save(), o.translate(c.x, c.y), o.strokeStyle = "rgba(255,255,255,0.22)", o.lineWidth = Math.max(2, Math.round(1.25 * s));
    const m = (g, C, S, x) => {
      o.beginPath(), o.moveTo(Math.round(g) + 0.5, Math.round(C) + 0.5), o.lineTo(Math.round(S) + 0.5, Math.round(x) + 0.5), o.stroke();
    };
    this._gridMode === 1 ? (m(c.w / 3, 0, c.w / 3, c.h), m(2 * c.w / 3, 0, 2 * c.w / 3, c.h), m(0, c.h / 3, c.w, c.h / 3), m(0, 2 * c.h / 3, c.w, 2 * c.h / 3)) : this._gridMode === 2 ? (m(c.w / 2, 0, c.w / 2, c.h), m(0, c.h / 2, c.w, c.h / 2)) : this._gridMode === 3 && (o.strokeRect(
      c.w * 0.1 + 0.5,
      c.h * 0.1 + 0.5,
      c.w * 0.8 - 1,
      c.h * 0.8 - 1
    ), o.strokeRect(
      c.w * 0.05 + 0.5,
      c.h * 0.05 + 0.5,
      c.w * 0.9 - 1,
      c.h * 0.9 - 1
    )), o.restore();
  }
  /**
   * Set zoom, optionally centered at (clientX, clientY).
   * Keeps the image point under the cursor stationary.
   */
  _setMfvZoom(e, n, o) {
    const s = Math.max(Nt, Math.min(xt, this._zoom)), i = Math.max(Nt, Math.min(xt, Number(e) || 1));
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
        var h, f, p, _;
        if ((f = (h = a.target) == null ? void 0 : h.closest) != null && f.call(h, "audio") || (_ = (p = a.target) == null ? void 0 : p.closest) != null && _.call(p, ".mjr-video-controls, .mjr-mfv-simple-player-controls") || Bt(a.target)) return;
        const d = Je(a.target, e);
        if (d && we(
          d,
          Number(a.deltaX || 0),
          Number(a.deltaY || 0)
        ))
          return;
        a.preventDefault();
        const m = 1 - (a.deltaY || a.deltaX || 0) * Re;
        this._setMfvZoom(this._zoom * m, a.clientX, a.clientY);
      },
      { ...n, passive: !1 }
    );
    let o = !1, s = 0, i = 0, r = 0, l = 0;
    e.addEventListener(
      "pointerdown",
      (a) => {
        var d, c, m, h, f, p, _, b, y;
        if (!(a.button !== 0 && a.button !== 1) && !(this._zoom <= 1.01) && !((c = (d = a.target) == null ? void 0 : d.closest) != null && c.call(d, "video")) && !((h = (m = a.target) == null ? void 0 : m.closest) != null && h.call(m, "audio")) && !((p = (f = a.target) == null ? void 0 : f.closest) != null && p.call(f, ".mjr-video-controls, .mjr-mfv-simple-player-controls")) && !((b = (_ = a.target) == null ? void 0 : _.closest) != null && b.call(_, ".mjr-mfv-ab-divider")) && !Bt(a.target)) {
          a.preventDefault(), o = !0, this._dragging = !0, s = a.clientX, i = a.clientY, r = this._panX, l = this._panY;
          try {
            e.setPointerCapture(a.pointerId);
          } catch (g) {
            (y = console.debug) == null || y.call(console, g);
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
        var c, m, h, f, p, _;
        if ((m = (c = a.target) == null ? void 0 : c.closest) != null && m.call(c, "video") || (f = (h = a.target) == null ? void 0 : h.closest) != null && f.call(h, "audio") || (_ = (p = a.target) == null ? void 0 : p.closest) != null && _.call(p, ".mjr-video-controls, .mjr-mfv-simple-player-controls") || Bt(a.target)) return;
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
        this._compareSyncAC = Ge(o, s, { threshold: 0.08 });
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
    e && this._contentEl.appendChild(e), this._nodeStreamSelection && this._updateNodeStreamOverlay(), this._mediaProgressEl && this._contentEl.appendChild(this._mediaProgressEl), this._applyMediaToneControls(), this._applyTransform(), this._initPanZoom(this._contentEl), this._initCompareSync();
  }
  _renderSimple() {
    var i;
    if (!this._mediaA) {
      this._contentEl.appendChild(Q());
      return;
    }
    const e = X(this._mediaA), n = et(this._mediaA), o = ((i = this._trackMediaControls) == null ? void 0 : i.call(this, n)) || n;
    if (!o) {
      this._contentEl.appendChild(Q("Could not load media"));
      return;
    }
    const s = document.createElement("div");
    if (s.className = "mjr-mfv-simple-container", s.appendChild(o), e !== "audio") {
      const r = this._buildGenInfoDOM(this._mediaA);
      if (r) {
        const l = document.createElement("div");
        l.className = "mjr-mfv-geninfo", nt(o) && l.classList.add("mjr-mfv-geninfo--above-player"), l.appendChild(r), s.appendChild(l);
      }
    }
    this._contentEl.appendChild(s);
  }
  _renderAB() {
    var b, y, g;
    const e = this._mediaA ? et(this._mediaA, { fill: !0 }) : null, n = this._mediaB ? et(this._mediaB, { fill: !0 }) : null, o = ((b = this._trackMediaControls) == null ? void 0 : b.call(this, e)) || e, s = ((y = this._trackMediaControls) == null ? void 0 : y.call(this, n)) || n, i = this._mediaA ? X(this._mediaA) : "", r = this._mediaB ? X(this._mediaB) : "";
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
    const m = this._buildGenInfoDOM(this._mediaA);
    let h = null;
    m && (h = document.createElement("div"), h.className = "mjr-mfv-geninfo-a", nt(o) && h.classList.add("mjr-mfv-geninfo--above-player"), h.appendChild(m), h.style.right = `calc(${100 - d}% + 8px)`);
    const f = this._buildGenInfoDOM(this._mediaB);
    let p = null;
    f && (p = document.createElement("div"), p.className = "mjr-mfv-geninfo-b", nt(s) && p.classList.add("mjr-mfv-geninfo--above-player"), p.appendChild(f), p.style.left = `calc(${d}% + 8px)`);
    let _ = null;
    c.addEventListener(
      "pointerdown",
      (C) => {
        C.preventDefault(), c.setPointerCapture(C.pointerId);
        try {
          _ == null || _.abort();
        } catch {
        }
        _ = new AbortController();
        const S = _.signal, x = l.getBoundingClientRect(), B = (F) => {
          const P = Math.max(0.02, Math.min(0.98, (F.clientX - x.left) / x.width));
          this._abDividerX = P;
          const I = Math.round(P * 100);
          a.style.clipPath = `inset(0 0 0 ${I}%)`, c.style.left = `${I}%`, h && (h.style.right = `calc(${100 - I}% + 8px)`), p && (p.style.left = `calc(${I}% + 8px)`);
        }, L = () => {
          try {
            _ == null || _.abort();
          } catch {
          }
        };
        c.addEventListener("pointermove", B, { signal: S }), c.addEventListener("pointerup", L, { signal: S });
      },
      (g = this._panelAC) != null && g.signal ? { signal: this._panelAC.signal } : void 0
    ), l.appendChild(u), l.appendChild(a), l.appendChild(c), h && l.appendChild(h), p && l.appendChild(p), l.appendChild(tt("A", "left")), l.appendChild(tt("B", "right")), this._contentEl.appendChild(l);
  }
  _renderSide() {
    var m, h;
    const e = this._mediaA ? et(this._mediaA) : null, n = this._mediaB ? et(this._mediaB) : null, o = ((m = this._trackMediaControls) == null ? void 0 : m.call(this, e)) || e, s = ((h = this._trackMediaControls) == null ? void 0 : h.call(this, n)) || n, i = this._mediaA ? X(this._mediaA) : "", r = this._mediaB ? X(this._mediaB) : "";
    if (!o && !s) {
      this._contentEl.appendChild(Q("Select 2 assets for Side-by-Side"));
      return;
    }
    const l = document.createElement("div");
    l.className = "mjr-mfv-side-container";
    const u = document.createElement("div");
    u.className = "mjr-mfv-side-panel", o ? u.appendChild(o) : u.appendChild(Q("—")), u.appendChild(tt("A", "left"));
    const a = i === "audio" ? null : this._buildGenInfoDOM(this._mediaA);
    if (a) {
      const f = document.createElement("div");
      f.className = "mjr-mfv-geninfo-a", nt(o) && f.classList.add("mjr-mfv-geninfo--above-player"), f.appendChild(a), u.appendChild(f);
    }
    const d = document.createElement("div");
    d.className = "mjr-mfv-side-panel", s ? d.appendChild(s) : d.appendChild(Q("—")), d.appendChild(tt("B", "right"));
    const c = r === "audio" ? null : this._buildGenInfoDOM(this._mediaB);
    if (c) {
      const f = document.createElement("div");
      f.className = "mjr-mfv-geninfo-b", nt(s) && f.classList.add("mjr-mfv-geninfo--above-player"), f.appendChild(c), d.appendChild(f);
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
        const u = X(i), a = et(i), d = ((s = this._trackMediaControls) == null ? void 0 : s.call(this, a)) || a;
        if (d ? l.appendChild(d) : l.appendChild(Q("—")), l.appendChild(
          tt(r, r === "A" || r === "C" ? "left" : "right")
        ), u !== "audio") {
          const c = this._buildGenInfoDOM(i);
          if (c) {
            const m = document.createElement("div");
            m.className = `mjr-mfv-geninfo-${r.toLowerCase()}`, nt(d) && m.classList.add("mjr-mfv-geninfo--above-player"), m.appendChild(c), l.appendChild(m);
          }
        }
      } else
        l.appendChild(Q("—")), l.appendChild(
          tt(r, r === "A" || r === "C" ? "left" : "right")
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
    this.element && (this._destroyPanZoom(), this._destroyCompareSync(), this._stopEdgeResize(), this._closeGenDropdown(), $e(this.element), this.element.classList.remove("is-visible"), this.element.setAttribute("aria-hidden", "true"), this.isVisible = !1);
  }
  // ── Pop-out / Pop-in (separate OS window for second monitor) ────────────
  _setDesktopExpanded(e) {
    return ho(this, e);
  }
  _activateDesktopExpandedFallback(e) {
    return fo(this, e);
  }
  _tryElectronPopupFallback(e, n, o, s) {
    return _o(this, e, n, o, s);
  }
  popOut() {
    return go(this);
  }
  _fallbackPopout(e, n, o) {
    return bo(this, e, n, o);
  }
  _clearPopoutCloseWatch() {
    return yo(this);
  }
  _startPopoutCloseWatch() {
    return Co(this);
  }
  _schedulePopInFromPopupClose() {
    return Ao(this);
  }
  _installPopoutStyles(e) {
    return So(this, e);
  }
  popIn(e) {
    return Eo(this, e);
  }
  _updatePopoutBtnUI() {
    return Mo(this);
  }
  get isPopped() {
    return this._isPopped || this._desktopExpanded;
  }
  _resizeCursorForDirection(e) {
    return Bo(e);
  }
  _getResizeDirectionFromPoint(e, n, o) {
    return No(e, n, o);
  }
  _stopEdgeResize() {
    return xo(this);
  }
  _bindPanelInteractions() {
    return Po(this);
  }
  _initEdgeResize(e) {
    return Lo(this, e);
  }
  _initDrag(e) {
    return Io(this, e);
  }
  async _drawMediaFit(e, n, o, s, i, r, l) {
    return Fo(this, e, n, o, s, i, r, l);
  }
  _estimateGenInfoOverlayHeight(e, n, o) {
    return To(this, e, n, o);
  }
  _drawGenInfoOverlay(e, n, o, s, i, r) {
    return jo(this, e, n, o, s, i, r);
  }
  async _captureView() {
    return ko(this);
  }
  dispose() {
    var e, n, o, s, i, r, l, u, a, d, c, m, h, f, p, _, b, y;
    Ve(this), this._destroyPanZoom(), this._destroyCompareSync(), this._destroyMediaControls(), this._unbindLayoutObserver(), this._stopEdgeResize(), this._clearPopoutCloseWatch();
    try {
      (e = this._panelAC) == null || e.abort(), this._panelAC = null;
    } catch (g) {
      (n = console.debug) == null || n.call(console, g);
    }
    try {
      (o = this._btnAC) == null || o.abort(), this._btnAC = null;
    } catch (g) {
      (s = console.debug) == null || s.call(console, g);
    }
    try {
      (i = this._docAC) == null || i.abort(), this._docAC = null;
    } catch (g) {
      (r = console.debug) == null || r.call(console, g);
    }
    try {
      (l = this._popoutAC) == null || l.abort(), this._popoutAC = null;
    } catch (g) {
      (u = console.debug) == null || u.call(console, g);
    }
    try {
      (a = this._panzoomAC) == null || a.abort(), this._panzoomAC = null;
    } catch (g) {
      (d = console.debug) == null || d.call(console, g);
    }
    try {
      (m = (c = this._compareSyncAC) == null ? void 0 : c.abort) == null || m.call(c), this._compareSyncAC = null;
    } catch (g) {
      (h = console.debug) == null || h.call(console, g);
    }
    try {
      this._isPopped && this.popIn();
    } catch (g) {
      (f = console.debug) == null || f.call(console, g);
    }
    this._revokePreviewBlob(), this._onSidebarPosChanged && (window.removeEventListener("mjr-settings-changed", this._onSidebarPosChanged), this._onSidebarPosChanged = null);
    try {
      (p = this.element) == null || p.remove();
    } catch (g) {
      (_ = console.debug) == null || _.call(console, g);
    }
    this.element = null, this._contentEl = null, this._closeBtn = null, this._modeBtn = null, this._pinGroup = null, this._pinBtns = null, this._liveBtn = null, this._nodeStreamBtn = null, this._popoutBtn = null, this._captureBtn = null, this._unbindDocumentUiHandlers();
    try {
      (b = this._genDropdown) == null || b.remove();
    } catch (g) {
      (y = console.debug) == null || y.call(console, g);
    }
    this._mediaA = null, this._mediaB = null, this._mediaC = null, this._mediaD = null, this.isVisible = !1;
  }
}
export {
  Uo as FloatingViewer,
  T as MFV_MODES
};
