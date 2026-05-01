import { i as q, n as Y, s as k } from "./entry-DxmoXgmi.js";
function Z(o) {
  if (!o) return null;
  try {
    const l = o.geninfo ? { geninfo: o.geninfo } : o.metadata || o.metadata_raw || o, r = Y(l) || null;
    if (r && typeof r == "object") {
      const e = {
        prompt: k(r.prompt) || (l != null && l.prompt ? k(String(l.prompt)) : "") || "",
        seed: r.seed != null ? String(r.seed) : "",
        sampler: r.sampler ? String(r.sampler) : "",
        scheduler: r.scheduler ? String(r.scheduler) : "",
        cfg: r.cfg != null ? String(r.cfg) : "",
        step: r.steps != null ? String(r.steps) : "",
        genTime: ""
      }, p = o.generation_time_ms ?? (l == null ? void 0 : l.generation_time_ms) ?? 0;
      return p && Number.isFinite(Number(p)) && p > 0 && p < 864e5 && (e.genTime = (Number(p) / 1e3).toFixed(1) + "s"), e;
    }
  } catch {
  }
  const t = o.meta || o.metadata || o.parsed_meta || o, g = o.generation_time_ms ?? (t == null ? void 0 : t.generation_time_ms) ?? 0;
  return {
    prompt: k((t == null ? void 0 : t.prompt) || (t == null ? void 0 : t.text) || ""),
    seed: (t == null ? void 0 : t.seed) != null ? String(t.seed) : (t == null ? void 0 : t.noise_seed) != null ? String(t.noise_seed) : "",
    sampler: (t == null ? void 0 : t.sampler) || (t == null ? void 0 : t.sampler_name) || "",
    scheduler: (t == null ? void 0 : t.scheduler) || "",
    cfg: (t == null ? void 0 : t.cfg) != null ? String(t.cfg) : (t == null ? void 0 : t.cfg_scale) != null ? String(t.cfg_scale) : "",
    step: (t == null ? void 0 : t.steps) != null ? String(t.steps) : "",
    genTime: g && Number.isFinite(Number(g)) && g > 0 && g < 864e5 ? (Number(g) / 1e3).toFixed(1) + "s" : ""
  };
}
function A(o, t) {
  const g = Z(o);
  if (!g) return null;
  const { prompt: l, seed: r, sampler: e, scheduler: p, cfg: y, step: m, genTime: u } = g, i = [
    r ? `Seed: ${r}` : "",
    y ? `CFG: ${y}` : "",
    e ? `Sampler: ${e}` : "",
    p ? `Sched: ${p}` : "",
    m ? `Steps: ${m}` : "",
    u ? `Gen: ${u}` : ""
  ].filter(Boolean).join(" · ");
  if (!l && !i) return null;
  const b = document.createElement("div");
  b.style.cssText = [
    "position:absolute",
    "left:6px",
    "right:6px",
    "bottom:6px",
    "background:rgba(0,0,0,0.68)",
    "color:#fff",
    "padding:5px 8px",
    "border-radius:6px",
    "font-size:10px",
    "line-height:1.4",
    "max-height:38%",
    "overflow:hidden",
    "word-break:break-word",
    "backdrop-filter:blur(4px)",
    "-webkit-backdrop-filter:blur(4px)",
    "border:1px solid rgba(255,255,255,0.12)",
    "box-shadow:0 2px 6px rgba(0,0,0,0.45)",
    "pointer-events:none",
    "z-index:2",
    "box-sizing:border-box"
  ].join(";");
  const C = l.length > 160 ? l.slice(0, 160) + "…" : l, c = document.createElement("div");
  c.style.cssText = `display:flex;align-items:baseline;gap:5px;flex-wrap:wrap;margin-bottom:${i ? "3" : "0"}px;`;
  const d = document.createElement("span");
  if (d.style.cssText = "background:rgba(255,255,255,0.2);border-radius:3px;padding:0 4px;font-weight:700;font-size:9px;letter-spacing:0.06em;flex-shrink:0;", d.textContent = t, c.appendChild(d), l) {
    const a = document.createElement("span"), j = document.createElement("span");
    j.style.cssText = "color:#7ec8ff;font-weight:600;", j.textContent = "Prompt:", a.appendChild(j), a.appendChild(document.createTextNode(" " + C)), c.appendChild(a);
  }
  if (b.appendChild(c), i) {
    const a = document.createElement("div");
    a.style.cssText = "color:rgba(255,255,255,0.65);font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;", a.textContent = i, b.appendChild(a);
  }
  return b;
}
function I(o, t) {
  let g = 0;
  const l = 60, r = () => {
    var C, c, d, a, j;
    g++;
    const e = (C = o == null ? void 0 : o.querySelector) == null ? void 0 : C.call(o, ".mjr-model3d-host"), p = (c = t == null ? void 0 : t.querySelector) == null ? void 0 : c.call(t, ".mjr-model3d-host"), y = (d = e == null ? void 0 : e._mjr3D) == null ? void 0 : d.controls, m = (a = p == null ? void 0 : p._mjr3D) == null ? void 0 : a.controls;
    if (!y || !m) {
      g < l && setTimeout(r, 50);
      return;
    }
    let u = !1;
    const i = () => {
      var f;
      if (!u) {
        u = !0;
        try {
          const s = e._mjr3D.camera, _ = p._mjr3D.camera;
          s && _ && (_.position.copy(s.position), _.quaternion.copy(s.quaternion), s.zoom !== void 0 && (_.zoom = s.zoom), _.updateProjectionMatrix()), m.target.copy(y.target), m.update();
        } catch (s) {
          (f = console.debug) == null || f.call(console, s);
        }
        u = !1;
      }
    }, b = () => {
      var f;
      if (!u) {
        u = !0;
        try {
          const s = e._mjr3D.camera, _ = p._mjr3D.camera;
          s && _ && (s.position.copy(_.position), s.quaternion.copy(_.quaternion), _.zoom !== void 0 && (s.zoom = _.zoom), s.updateProjectionMatrix()), y.target.copy(m.target), y.update();
        } catch (s) {
          (f = console.debug) == null || f.call(console, s);
        }
        u = !1;
      }
    };
    y.addEventListener("change", i), m.addEventListener("change", b);
    try {
      const f = o.parentElement;
      f && (f._mjr3DSyncCleanup = () => {
        try {
          y.removeEventListener("change", i);
        } catch {
        }
        try {
          m.removeEventListener("change", b);
        } catch {
        }
      });
    } catch (f) {
      (j = console.debug) == null || j.call(console, f);
    }
  };
  setTimeout(r, 50);
}
function R(o) {
  let t = 0;
  const g = 60, l = () => {
    var m;
    t++;
    const e = Array.from(((m = o == null ? void 0 : o.querySelectorAll) == null ? void 0 : m.call(o, ".mjr-model3d-host")) || []).filter((u) => {
      var i;
      return (i = u._mjr3D) == null ? void 0 : i.controls;
    });
    if (e.length < 2) {
      t < g && setTimeout(l, 50);
      return;
    }
    let p = !1;
    const y = [];
    for (let u = 0; u < e.length; u++) {
      const i = e[u], b = () => {
        var C;
        if (!p) {
          p = !0;
          try {
            const c = i._mjr3D.camera, d = i._mjr3D.controls;
            for (let a = 0; a < e.length; a++) {
              if (a === u) continue;
              const j = e[a], f = j._mjr3D.camera, s = j._mjr3D.controls;
              !f || !s || (f.position.copy(c.position), f.quaternion.copy(c.quaternion), c.zoom !== void 0 && (f.zoom = c.zoom), f.updateProjectionMatrix(), s.target.copy(d.target), s.update());
            }
          } catch (c) {
            (C = console.debug) == null || C.call(console, c);
          }
          p = !1;
        }
      };
      i._mjr3D.controls.addEventListener("change", b), y.push(() => {
        var C, c, d;
        try {
          (d = (c = (C = i._mjr3D) == null ? void 0 : C.controls) == null ? void 0 : c.removeEventListener) == null || d.call(c, "change", b);
        } catch {
        }
      });
    }
    o._mjr3DSyncCleanup = () => {
      for (const u of y) u();
    };
  };
  setTimeout(l, 50);
}
function U({
  sideView: o,
  state: t,
  currentAsset: g,
  viewUrl: l,
  buildAssetViewURL: r,
  createMediaElement: e,
  destroyMediaProcessorsIn: p
} = {}) {
  var f, s, _, F, G, N, $, P, X, B, H, L;
  try {
    (f = o == null ? void 0 : o._mjr3DSyncCleanup) == null || f.call(o);
  } catch (n) {
    (s = console.debug) == null || s.call(console, n);
  }
  try {
    o && (o._mjr3DSyncCleanup = null);
  } catch (n) {
    (_ = console.debug) == null || _.call(console, n);
  }
  try {
    p == null || p(o);
  } catch (n) {
    (F = console.debug) == null || F.call(console, n);
  }
  try {
    o && (o.innerHTML = "");
  } catch (n) {
    (G = console.debug) == null || G.call(console, n);
  }
  if (!o || !t || !g) return;
  const y = (n, h) => {
    var D, T, S, x, O, W, J;
    try {
      const z = ((D = n == null ? void 0 : n.querySelector) == null ? void 0 : D.call(n, ".mjr-viewer-video-src")) || ((T = n == null ? void 0 : n.querySelector) == null ? void 0 : T.call(n, "video")), v = ((S = n == null ? void 0 : n.querySelector) == null ? void 0 : S.call(n, ".mjr-viewer-audio-src")) || ((x = n == null ? void 0 : n.querySelector) == null ? void 0 : x.call(n, "audio"));
      if (z != null && z.dataset && (z.dataset.mjrCompareRole = h), v != null && v.dataset && (v.dataset.mjrCompareRole = h), v) {
        const K = String(h || "").toUpperCase() === "A";
        if (v.muted = !K, !K)
          try {
            (O = v.pause) == null || O.call(v);
          } catch (Q) {
            (W = console.debug) == null || W.call(console, Q);
          }
      }
    } catch (z) {
      (J = console.debug) == null || J.call(console, z);
    }
  }, m = Array.isArray(t.assets) ? t.assets.slice(0, 4) : [], u = m.length, i = !!t.compareAsset;
  if (u > 2 && !i) {
    try {
      o.style.display = "grid", o.style.gridTemplateColumns = "1fr 1fr", o.style.gridTemplateRows = "1fr 1fr", o.style.gap = "2px", o.style.padding = "2px";
    } catch (h) {
      (N = console.debug) == null || N.call(console, h);
    }
    const n = ["A", "B", "C", "D"];
    for (let h = 0; h < 4; h++) {
      const D = document.createElement("div");
      D.style.cssText = `
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(255,255,255,0.05);
                overflow: hidden;
            `;
      const T = m[h];
      if (T) {
        let S = "";
        try {
          S = (r == null ? void 0 : r(T)) || "";
        } catch (x) {
          ($ = console.debug) == null || $.call(console, x);
        }
        try {
          const x = e == null ? void 0 : e(T, S);
          x && D.appendChild(x), y(x, n[h]);
        } catch (x) {
          (P = console.debug) == null || P.call(console, x);
        }
        try {
          const x = A(T, n[h]);
          x && D.appendChild(x);
        } catch (x) {
          (X = console.debug) == null || X.call(console, x);
        }
      } else {
        const S = document.createElement("div");
        S.style.cssText = "position:absolute;top:6px;left:6px;background:rgba(255,255,255,0.12);border-radius:3px;padding:1px 6px;font-size:9px;font-weight:700;color:rgba(255,255,255,0.4);letter-spacing:0.06em;", S.textContent = n[h], D.appendChild(S);
      }
      try {
        o.appendChild(D);
      } catch (S) {
        (B = console.debug) == null || B.call(console, S);
      }
    }
    m.some((h) => h && q(h)) && R(o);
    return;
  }
  const b = t.compareAsset || (Array.isArray(t.assets) && t.assets.length === 2 ? t.assets[1 - (t.currentIndex || 0)] : null) || g, C = (() => {
    try {
      return r == null ? void 0 : r(b);
    } catch {
      return "";
    }
  })(), c = document.createElement("div");
  c.style.cssText = `
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255,255,255,0.05);
        overflow: hidden;
    `;
  const d = e == null ? void 0 : e(g, l);
  d && c.appendChild(d);
  const a = document.createElement("div");
  a.style.cssText = `
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255,255,255,0.05);
        overflow: hidden;
    `;
  const j = e == null ? void 0 : e(b, C);
  j && a.appendChild(j);
  try {
    o.style.display = "flex", o.style.flexDirection = "row", o.style.gap = "2px", o.style.padding = "0";
  } catch (n) {
    (H = console.debug) == null || H.call(console, n);
  }
  try {
    o.appendChild(c), o.appendChild(a);
  } catch (n) {
    (L = console.debug) == null || L.call(console, n);
  }
  y(d, "A"), y(j, "B"), q(g) && q(b) && I(c, a);
}
export {
  U as renderSideBySideView
};
