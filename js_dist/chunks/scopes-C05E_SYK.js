import { h as C } from "./entry-YHP42UEM.js";
function H(t, n, o) {
  return 0.2126 * t + 0.7152 * n + 0.0722 * o;
}
const N = 256, U = 3, F = 220, O = 110, k = 2, v = 10, p = 1, X = "12px var(--comfy-font, ui-sans-serif, system-ui)", B = 10, G = 8, D = 10, R = 28, y = 10, V = 1.2, w = 1, Y = 420, q = 240, Z = 32, $ = 24, j = 0.06, x = 0.9, z = 0.9;
let E = null, W = null;
function J(t, n) {
  try {
    const o = Math.max(1, Math.floor(Number(t) || 1)), s = Math.max(1, Math.floor(Number(n) || 1));
    return E || (E = document.createElement("canvas")), E.width !== o && (E.width = o), E.height !== s && (E.height = s), W || (W = E.getContext("2d", { willReadFrequently: !0 })), W || null;
  } catch {
    return null;
  }
}
function K(t, n, o) {
  try {
    return t.getImageData(0, 0, n, o);
  } catch {
    return null;
  }
}
function I(t, { x: n, y: o, w: s, h: r, title: a }) {
  var l;
  try {
    t.save(), t.fillStyle = "rgba(0,0,0,0.55)", t.strokeStyle = "rgba(255,255,255,0.14)", t.lineWidth = p;
    const c = v;
    t.beginPath(), t.moveTo(n + c, o), t.arcTo(n + s, o, n + s, o + r, c), t.arcTo(n + s, o + r, n, o + r, c), t.arcTo(n, o + r, n, o, c), t.arcTo(n, o, n + s, o, c), t.closePath(), t.fill(), t.stroke(), a && (t.font = X, t.textAlign = "left", t.textBaseline = "top", t.fillStyle = "rgba(255,255,255,0.86)", t.fillText(String(a), n + B, o + G)), t.restore();
  } catch (c) {
    (l = console.debug) == null || l.call(console, c);
  }
}
function Q(t, { sampleStep: n = U } = {}) {
  const o = N, s = new Uint32Array(o), r = new Uint32Array(o), a = new Uint32Array(o), l = new Uint32Array(o);
  try {
    const c = t == null ? void 0 : t.data;
    if (!c) return { hr: s, hg: r, hb: a, hl: l, max: 1 };
    const f = Math.max(1, Math.floor(n));
    for (let e = 0; e < c.length; e += 4 * f) {
      const m = c[e] ?? 0, h = c[e + 1] ?? 0, g = c[e + 2] ?? 0;
      s[m] += 1, r[h] += 1, a[g] += 1;
      const i = Math.max(0, Math.min(255, Math.round(H(m, h, g))));
      l[i] += 1;
    }
    let _ = 1;
    for (let e = 0; e < o; e++)
      _ = Math.max(_, s[e], r[e], a[e], l[e]);
    return { hr: s, hg: r, hb: a, hl: l, max: _ };
  } catch {
    return { hr: s, hg: r, hb: a, hl: l, max: 1 };
  }
}
function tt(t, n, o, { channel: s = "rgb" } = {}) {
  var r;
  try {
    const { x: a, y: l, w: c, h: f } = n, _ = R, e = D, m = a + e, h = l + _, g = c - e * 2, i = f - _ - e;
    if (!(g > y && i > y)) return;
    t.save(), t.globalCompositeOperation = "source-over", t.strokeStyle = "rgba(255,255,255,0.10)", t.lineWidth = p, t.beginPath(), t.rect(m, h, g, i), t.stroke();
    const L = Number(o == null ? void 0 : o.max) || 1, u = (b, A) => {
      t.strokeStyle = A, t.beginPath();
      for (let d = 0; d < N; d++) {
        const S = ((b == null ? void 0 : b[d]) || 0) / L, T = m + d / 255 * g, P = h + i - S * i;
        d === 0 ? t.moveTo(T, P) : t.lineTo(T, P);
      }
      t.stroke();
    }, M = String(s || "rgb");
    t.lineWidth = V, M === "r" ? u(o.hr, "rgba(255,90,90,0.95)") : M === "g" ? u(o.hg, "rgba(90,255,140,0.95)") : M === "b" ? u(o.hb, "rgba(90,160,255,0.95)") : M === "l" ? u(o.hl, "rgba(255,210,90,0.95)") : (u(o.hr, "rgba(255,90,90,0.95)"), u(o.hg, "rgba(90,255,140,0.95)"), u(o.hb, "rgba(90,160,255,0.95)")), M !== "l" && (t.lineWidth = w, u(o.hl, "rgba(255,255,255,0.45)")), t.restore();
  } catch (a) {
    (r = console.debug) == null || r.call(console, a);
  }
}
function ot(t, {
  columns: n = F,
  rows: o = O,
  sampleStep: s = k
} = {}) {
  const r = Math.max(Z, Math.floor(n)), a = Math.max($, Math.floor(o)), l = new Uint16Array(r * a);
  try {
    const c = t == null ? void 0 : t.data, f = (t == null ? void 0 : t.width) || 0, _ = (t == null ? void 0 : t.height) || 0;
    if (!c || !(f > 0 && _ > 0)) return { out: l, gridW: r, gridH: a, max: 1 };
    const e = Math.max(1, Math.floor(s));
    for (let h = 0; h < _; h += e) {
      const g = h * f * 4;
      for (let i = 0; i < f; i += e) {
        const L = i / (f - 1 || 1), u = Math.max(0, Math.min(r - 1, Math.floor(L * (r - 1)))), M = g + i * 4, b = c[M] ?? 0, A = c[M + 1] ?? 0, d = c[M + 2] ?? 0, S = C(H(b / 255, A / 255, d / 255)), T = Math.max(0, Math.min(a - 1, Math.round((1 - S) * (a - 1))));
        l[T * r + u] += 1;
      }
    }
    let m = 1;
    for (let h = 0; h < l.length; h++) m = Math.max(m, l[h]);
    return { out: l, gridW: r, gridH: a, max: m };
  } catch {
    return { out: l, gridW: r, gridH: a, max: 1 };
  }
}
function nt(t, n, o) {
  var s;
  try {
    const { x: r, y: a, w: l, h: c } = n, f = R, _ = D, e = r + _, m = a + f, h = l - _ * 2, g = c - f - _;
    if (!(h > y && g > y)) return;
    t.save(), t.strokeStyle = "rgba(255,255,255,0.10)", t.lineWidth = p, t.beginPath(), t.rect(e, m, h, g), t.stroke();
    const i = (o == null ? void 0 : o.gridW) || 0, L = (o == null ? void 0 : o.gridH) || 0, u = o == null ? void 0 : o.out, M = Number(o == null ? void 0 : o.max) || 1;
    if (!u || !(i > 0 && L > 0)) return;
    for (let b = 0; b < L; b++)
      for (let A = 0; A < i; A++) {
        const d = (u[b * i + A] || 0) / M;
        if (d <= 0) continue;
        const S = e + A / (i - 1 || 1) * h, T = m + b / (L - 1 || 1) * g, P = Math.min(
          x,
          j + d * z
        );
        t.fillStyle = `rgba(255,255,255,${P})`, t.fillRect(S, T, Math.max(1, h / i), Math.max(1, g / L));
      }
    t.restore();
  } catch (r) {
    (s = console.debug) == null || s.call(console, r);
  }
}
function et(t, n, o, s = {}) {
  var r;
  try {
    const a = String((s == null ? void 0 : s.mode) || "both"), l = String((s == null ? void 0 : s.channel) || "rgb");
    if (!t || !n || !o || a === "off") return;
    const c = Number(o.width) || 0, f = Number(o.height) || 0;
    if (!(c > 1 && f > 1)) return;
    const _ = Math.max(c / Y, f / q, 1), e = Math.max(1, Math.floor(c / _)), m = Math.max(1, Math.floor(f / _)), h = J(e, m);
    if (!h) return;
    try {
      h.clearRect(0, 0, e, m), h.drawImage(o, 0, 0, e, m);
    } catch {
      return;
    }
    const g = K(h, e, m);
    if (!g) return;
    const i = 10, L = Math.min(520, Math.max(320, Math.floor(n.w * 0.36))), u = Math.min(260, Math.max(160, Math.floor(n.h * 0.22))), M = n.w - L - i, b = n.h - u - i;
    if (a === "hist" || a === "both") {
      const A = { x: M, y: b, w: L, h: u };
      I(t, { ...A, title: l === "r" ? "Histogram (R)" : l === "g" ? "Histogram (G)" : l === "b" ? "Histogram (B)" : l === "l" ? "Histogram (Luma)" : "Histogram (RGB + Luma)" });
      const S = Math.max(2, Math.floor(Math.max(e, m) / 180)), T = Q(g, { sampleStep: S });
      tt(t, A, T, { channel: l });
    }
    if (a === "wave" || a === "both") {
      const A = a === "both" ? b - u - 8 : b, d = { x: M, y: A, w: L, h: u };
      I(t, { ...d, title: "Waveform (Luma)" });
      const S = Math.max(2, Math.floor(Math.max(e, m) / 180)), T = ot(g, { columns: 180, rows: 96, sampleStep: S });
      nt(t, d, T);
    }
  } catch (a) {
    (r = console.debug) == null || r.call(console, a);
  }
}
export {
  et as drawScopesLight
};
