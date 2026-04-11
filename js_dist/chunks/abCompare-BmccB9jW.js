function ne({
  abView: u,
  state: E,
  currentAsset: Y,
  viewUrl: Ht,
  buildAssetViewURL: Z,
  createCompareMediaElement: L,
  destroyMediaProcessorsIn: G
} = {}) {
  var nt, rt, O, ot, ct, W, st, lt, H, it, at, ut, yt, gt, ht, ft, dt, pt, mt, vt, xt, _t, Ct, St, wt, bt, At, Et, It, Rt, Dt, Pt, jt, qt, Tt, Nt, Lt, Ft, $t, Xt, kt, Bt, Ot, Wt;
  const zt = 83.33333333333333, Q = 1, Yt = 10, U = 40;
  try {
    G == null || G(u);
  } catch (t) {
    (nt = console.debug) == null || nt.call(console, t);
  }
  try {
    u && (u.innerHTML = "");
  } catch (t) {
    (rt = console.debug) == null || rt.call(console, t);
  }
  try {
    (ot = (O = u == null ? void 0 : u._mjrSyncAbort) == null ? void 0 : O.abort) == null || ot.call(O);
  } catch (t) {
    (ct = console.debug) == null || ct.call(console, t);
  }
  try {
    (st = (W = u == null ? void 0 : u._mjrDiffAbort) == null ? void 0 : W.abort) == null || st.call(W);
  } catch (t) {
    (lt = console.debug) == null || lt.call(console, t);
  }
  try {
    (it = (H = u == null ? void 0 : u._mjrSliderAbort) == null ? void 0 : H.abort) == null || it.call(H);
  } catch (t) {
    (at = console.debug) == null || at.call(console, t);
  }
  try {
    u._mjrDiffRequest = null;
  } catch (t) {
    (ut = console.debug) == null || ut.call(console, t);
  }
  try {
    u._mjrSliderAbort = null;
  } catch (t) {
    (yt = console.debug) == null || yt.call(console, t);
  }
  if (!u || !E || !Y) return;
  const V = (t, r) => {
    var a, l, g, s, b;
    try {
      const R = ((a = t == null ? void 0 : t.querySelector) == null ? void 0 : a.call(t, ".mjr-viewer-audio-src")) || ((l = t == null ? void 0 : t.querySelector) == null ? void 0 : l.call(t, "audio"));
      if (!R) return;
      const e = String(r || "").toUpperCase() === "A";
      if (R.muted = !e, !e)
        try {
          (g = R.pause) == null || g.call(R);
        } catch (i) {
          (s = console.debug) == null || s.call(console, i);
        }
    } catch (R) {
      (b = console.debug) == null || b.call(console, R);
    }
  }, D = (() => {
    try {
      const t = String(E.abCompareMode || "wipe");
      return t === "wipeH" ? "wipe" : t;
    } catch {
      return "wipe";
    }
  })(), J = D === "wipe" || D === "wipeV", F = D === "wipeV" ? "y" : "x", M = E.compareAsset || (Array.isArray(E.assets) && E.assets.length === 2 ? E.assets[1 - (E.currentIndex || 0)] : null) || Y, Zt = (() => {
    try {
      return Z == null ? void 0 : Z(M);
    } catch {
      return "";
    }
  })(), X = document.createElement("div");
  X.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
  const o = L == null ? void 0 : L(M, Zt);
  o && X.appendChild(o);
  try {
    const t = ((gt = o == null ? void 0 : o.querySelector) == null ? void 0 : gt.call(o, ".mjr-viewer-video-src")) || ((ht = o == null ? void 0 : o.querySelector) == null ? void 0 : ht.call(o, "video"));
    t != null && t.dataset && (t.dataset.mjrCompareRole = "B");
    const r = ((ft = o == null ? void 0 : o.querySelector) == null ? void 0 : ft.call(o, ".mjr-viewer-audio-src")) || ((dt = o == null ? void 0 : o.querySelector) == null ? void 0 : dt.call(o, "audio"));
    r != null && r.dataset && (r.dataset.mjrCompareRole = "B");
  } catch (t) {
    (pt = console.debug) == null || pt.call(console, t);
  }
  V(o, "B");
  try {
    const t = ((mt = o == null ? void 0 : o.querySelector) == null ? void 0 : mt.call(o, "canvas.mjr-viewer-media")) || (o instanceof HTMLCanvasElement ? o : null);
    t != null && t.dataset && (t.dataset.mjrCompareRole = "B");
  } catch (t) {
    (vt = console.debug) == null || vt.call(console, t);
  }
  const P = document.createElement("div");
  P.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
  const Gt = (() => {
    var t, r;
    try {
      return !!((r = (t = window.CSS) == null ? void 0 : t.supports) != null && r.call(t, "clip-path: inset(0 50% 0 0)"));
    } catch {
      return !1;
    }
  })(), K = (t) => {
    var r;
    try {
      const a = Math.max(0, Math.min(100, Number(t) || 0));
      if (Gt) {
        const b = F === "y" ? `inset(0 0 ${100 - a}% 0)` : `inset(0 ${100 - a}% 0 0)`;
        P.style.clipPath = b, P.style.webkitClipPath = b;
        return;
      }
      const l = u.getBoundingClientRect(), g = l.width || 1, s = l.height || 1;
      if (F === "y") {
        const b = Math.round(s * a / 100);
        P.style.clip = `rect(0px, ${g}px, ${b}px, 0px)`;
      } else {
        const b = Math.round(g * a / 100);
        P.style.clip = `rect(0px, ${b}px, ${s}px, 0px)`;
      }
    } catch (a) {
      (r = console.debug) == null || r.call(console, a);
    }
  }, k = (() => {
    var t;
    if (!J) return 100;
    try {
      const r = Number(E._abWipePercent);
      if (Number.isFinite(r) && r >= 0 && r <= 100) return r;
    } catch (r) {
      (t = console.debug) == null || t.call(console, r);
    }
    return 50;
  })();
  K(k);
  try {
    J && (E._abWipePercent = k);
  } catch (t) {
    (xt = console.debug) == null || xt.call(console, t);
  }
  const n = L == null ? void 0 : L(Y, Ht);
  n && P.appendChild(n);
  try {
    const t = ((_t = n == null ? void 0 : n.querySelector) == null ? void 0 : _t.call(n, ".mjr-viewer-video-src")) || ((Ct = n == null ? void 0 : n.querySelector) == null ? void 0 : Ct.call(n, "video"));
    t != null && t.dataset && (t.dataset.mjrCompareRole = "A");
    const r = ((St = n == null ? void 0 : n.querySelector) == null ? void 0 : St.call(n, ".mjr-viewer-audio-src")) || ((wt = n == null ? void 0 : n.querySelector) == null ? void 0 : wt.call(n, "audio"));
    r != null && r.dataset && (r.dataset.mjrCompareRole = "A");
  } catch (t) {
    (bt = console.debug) == null || bt.call(console, t);
  }
  V(n, "A");
  try {
    const t = ((At = n == null ? void 0 : n.querySelector) == null ? void 0 : At.call(n, "canvas.mjr-viewer-media")) || (n instanceof HTMLCanvasElement ? n : null);
    t != null && t.dataset && (t.dataset.mjrCompareRole = "A");
  } catch (t) {
    (Et = console.debug) == null || Et.call(console, t);
  }
  const y = document.createElement("div");
  y.className = "mjr-ab-slider", y.style.cssText = `
        position: absolute;
        z-index: ${Yt};
        touch-action: none;
        user-select: none;
    `;
  const I = document.createElement("div");
  I.style.cssText = `
        position: absolute;
        background: white;
        pointer-events: none;
        box-shadow: 0 0 4px rgba(0,0,0,0.5);
    `, y.appendChild(I);
  const Jt = (t) => t === "multiply" || t === "screen" || t === "add";
  try {
    if (J) {
      y.style.display = "";
      try {
        const t = (($t = n == null ? void 0 : n.querySelector) == null ? void 0 : $t.call(n, ".mjr-viewer-media")) || n;
        t && (t.style.mixBlendMode = "");
      } catch (t) {
        (Xt = console.debug) == null || Xt.call(console, t);
      }
    } else {
      K(100), y.style.display = "none";
      try {
        P.style.opacity = "0", X.style.opacity = "0", P.style.pointerEvents = "none", X.style.pointerEvents = "none";
      } catch (e) {
        (It = console.debug) == null || It.call(console, e);
      }
      const t = document.createElement("div");
      t.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                overflow: hidden;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
      const r = document.createElement("canvas");
      r.className = "mjr-viewer-media";
      try {
        r.dataset.mjrCompareRole = "D";
      } catch (e) {
        (Rt = console.debug) == null || Rt.call(console, e);
      }
      r.style.cssText = `
                max-width: 100%;
                max-height: 100%;
                display: block;
            `, t.appendChild(r);
      const a = (e) => {
        var i, A;
        try {
          return e ? e instanceof HTMLCanvasElement ? e : ((i = e.querySelector) == null ? void 0 : i.call(e, "canvas.mjr-viewer-media")) || ((A = e.querySelector) == null ? void 0 : A.call(e, "canvas")) || null : null;
        } catch {
          return null;
        }
      }, l = a(n), g = a(o), s = (() => {
        try {
          return r.getContext("2d", { willReadFrequently: !0 });
        } catch {
          return null;
        }
      })(), b = () => {
        try {
          const e = (l == null ? void 0 : l.width) || 0, i = (l == null ? void 0 : l.height) || 0, A = (g == null ? void 0 : g.width) || 0, v = (g == null ? void 0 : g.height) || 0, T = Math.max(1, Math.min(e || A, A || e)), d = Math.max(1, Math.min(i || v, v || i));
          return r.width !== T && (r.width = T), r.height !== d && (r.height = d), { w: T, h: d };
        } catch {
          return { w: 0, h: 0 };
        }
      }, R = () => {
        var v, T, d, m, C, z;
        if (!s) return !1;
        const { w: e, h: i } = b();
        if (!(e > 1 && i > 1)) return !1;
        let A = !1;
        try {
          s.save(), A = !0;
        } catch (_) {
          (v = console.debug) == null || v.call(console, _);
        }
        try {
          try {
            s.clearRect(0, 0, e, i);
          } catch (S) {
            (T = console.debug) == null || T.call(console, S);
          }
          const _ = e * i, $ = !!((d = n == null ? void 0 : n.querySelector) != null && d.call(n, "video") || (m = o == null ? void 0 : o.querySelector) != null && m.call(o, "video")), p = (S) => {
            try {
              return s.globalCompositeOperation = "copy", s.drawImage(g, 0, 0, e, i), s.globalCompositeOperation = S, s.drawImage(l, 0, 0, e, i), s.globalCompositeOperation = "source-over", !0;
            } catch {
              return !1;
            }
          }, N = () => {
            if ($ || !(_ > 0 && _ <= 75e4)) return p("difference");
            try {
              s.globalCompositeOperation = "copy", s.drawImage(l, 0, 0, e, i);
              const S = s.getImageData(0, 0, e, i);
              s.clearRect(0, 0, e, i), s.globalCompositeOperation = "copy", s.drawImage(g, 0, 0, e, i);
              const x = s.getImageData(0, 0, e, i), w = S.data, c = x.data;
              for (let h = 0; h < c.length; h += 4)
                c[h] = Math.max(0, (c[h] || 0) - (w[h] || 0)), c[h + 1] = Math.max(0, (c[h + 1] || 0) - (w[h + 1] || 0)), c[h + 2] = Math.max(0, (c[h + 2] || 0) - (w[h + 2] || 0)), c[h + 3] = 255;
              return s.putImageData(x, 0, 0), s.globalCompositeOperation = "source-over", !0;
            } catch {
              return p("difference");
            }
          };
          if (Jt(D))
            return p(D === "add" ? "lighter" : D);
          if (D === "subtract")
            return N();
          const Qt = () => {
            if ($ || !(_ > 0 && _ <= 1e6)) return p("difference");
            try {
              s.globalCompositeOperation = "copy", s.drawImage(l, 0, 0, e, i);
              const S = s.getImageData(0, 0, e, i);
              s.clearRect(0, 0, e, i), s.drawImage(g, 0, 0, e, i);
              const x = s.getImageData(0, 0, e, i), w = S.data, c = x.data;
              let h = 0;
              for (let f = 0; f < w.length; f += 4)
                c[f] = Math.abs((w[f] || 0) - (c[f] || 0)), c[f + 1] = Math.abs((w[f + 1] || 0) - (c[f + 1] || 0)), c[f + 2] = Math.abs((w[f + 2] || 0) - (c[f + 2] || 0)), c[f + 3] = 255, c[f] > h && (h = c[f]), c[f + 1] > h && (h = c[f + 1]), c[f + 2] > h && (h = c[f + 2]);
              if (h > 0 && h < 255) {
                const f = 255 / h;
                for (let q = 0; q < c.length; q += 4)
                  c[q] = Math.min(255, Math.round(c[q] * f)), c[q + 1] = Math.min(255, Math.round(c[q + 1] * f)), c[q + 2] = Math.min(255, Math.round(c[q + 2] * f));
              }
              return s.putImageData(x, 0, 0), s.globalCompositeOperation = "source-over", !0;
            } catch {
              return p("difference");
            }
          };
          if (D === "absdiff")
            return Qt();
          if (!p("difference")) return !1;
          if (D === "difference")
            try {
              if (_ > 0 && _ <= 1e6) {
                const S = s.getImageData(0, 0, e, i), x = S.data, w = 4;
                for (let c = 0; c < x.length; c += 4)
                  x[c] = Math.min(255, (x[c] || 0) * w), x[c + 1] = Math.min(255, (x[c + 1] || 0) * w), x[c + 2] = Math.min(255, (x[c + 2] || 0) * w), x[c + 3] = 255;
                s.putImageData(S, 0, 0);
              }
            } catch (S) {
              (C = console.debug) == null || C.call(console, S);
            }
          return !0;
        } finally {
          if (A)
            try {
              s.restore();
            } catch (_) {
              (z = console.debug) == null || z.call(console, _);
            }
        }
      };
      try {
        u.appendChild(t);
      } catch (e) {
        (Dt = console.debug) == null || Dt.call(console, e);
      }
      try {
        const e = new AbortController();
        u._mjrDiffAbort = e;
        let i = 0;
        const A = () => {
          const d = performance.now();
          return d - i < zt ? !1 : (i = d, !0);
        }, v = () => {
          var d;
          if (!e.signal.aborted)
            try {
              requestAnimationFrame(() => {
                var m;
                if (!e.signal.aborted)
                  try {
                    l && g && A() && R();
                  } catch (C) {
                    (m = console.debug) == null || m.call(console, C);
                  }
              });
            } catch (m) {
              (d = console.debug) == null || d.call(console, m);
            }
        };
        if (u._mjrDiffRequest = v, !!((Pt = n == null ? void 0 : n.querySelector) != null && Pt.call(n, "video") || (jt = o == null ? void 0 : o.querySelector) != null && jt.call(o, "video"))) {
          let d = null;
          const m = ((qt = n == null ? void 0 : n.querySelector) == null ? void 0 : qt.call(n, "video")) || null, C = ((Tt = o == null ? void 0 : o.querySelector) == null ? void 0 : Tt.call(o, "video")) || null, z = () => {
            try {
              const p = m ? !m.paused : !1, N = C ? !C.paused : !1;
              return p || N;
            } catch {
              return !0;
            }
          }, _ = () => {
            var p;
            if (!e.signal.aborted) {
              try {
                l && g && A() && R();
              } catch (N) {
                (p = console.debug) == null || p.call(console, N);
              }
              if (!z()) {
                d = null;
                return;
              }
              try {
                d = requestAnimationFrame(_);
              } catch {
                d = null;
              }
            }
          }, $ = () => {
            if (!e.signal.aborted && d == null)
              try {
                d = requestAnimationFrame(_);
              } catch {
                d = null;
              }
          };
          try {
            m && (m.addEventListener("play", $, {
              signal: e.signal,
              passive: !0
            }), m.addEventListener("seeking", v, {
              signal: e.signal,
              passive: !0
            }), m.addEventListener("seeked", v, {
              signal: e.signal,
              passive: !0
            }), m.addEventListener("timeupdate", v, {
              signal: e.signal,
              passive: !0
            }));
          } catch (p) {
            (Nt = console.debug) == null || Nt.call(console, p);
          }
          try {
            C && (C.addEventListener("play", $, {
              signal: e.signal,
              passive: !0
            }), C.addEventListener("seeking", v, {
              signal: e.signal,
              passive: !0
            }), C.addEventListener("seeked", v, {
              signal: e.signal,
              passive: !0
            }), C.addEventListener("timeupdate", v, {
              signal: e.signal,
              passive: !0
            }));
          } catch (p) {
            (Lt = console.debug) == null || Lt.call(console, p);
          }
          $(), e.signal.addEventListener(
            "abort",
            () => {
              var p;
              try {
                d != null && cancelAnimationFrame(d);
              } catch (N) {
                (p = console.debug) == null || p.call(console, N);
              }
            },
            { once: !0 }
          );
        } else
          v();
      } catch (e) {
        (Ft = console.debug) == null || Ft.call(console, e);
      }
    }
  } catch (t) {
    (kt = console.debug) == null || kt.call(console, t);
  }
  let B = !1, j = null;
  const Kt = (t) => {
    var r, a;
    try {
      const l = Math.max(0, Math.min(100, t));
      K(l);
      try {
        E._abWipePercent = l;
      } catch (g) {
        (r = console.debug) == null || r.call(console, g);
      }
      F === "y" ? y.style.top = `${l}%` : y.style.left = `${l}%`;
    } catch (l) {
      (a = console.debug) == null || a.call(console, l);
    }
  }, tt = (t) => {
    var r;
    if (B)
      try {
        t.preventDefault(), t.stopPropagation(), j || (j = u.getBoundingClientRect());
        let a = 50;
        F === "y" ? a = ((Number(t.clientY) || 0) - j.top) / j.height * 100 : a = ((Number(t.clientX) || 0) - j.left) / j.width * 100, Kt(a);
      } catch (a) {
        (r = console.debug) == null || r.call(console, a);
      }
  }, et = (t) => {
    var r;
    if (B) {
      B = !1, j = null;
      try {
        y.releasePointerCapture(t.pointerId), y.style.cursor = F === "y" ? "ns-resize" : "ew-resize";
      } catch (a) {
        (r = console.debug) == null || r.call(console, a);
      }
    }
  };
  try {
    const t = new AbortController();
    u._mjrSliderAbort = t, y.addEventListener(
      "pointerdown",
      (r) => {
        var a, l;
        if (r.button === 0) {
          B = !0, r.preventDefault(), r.stopPropagation();
          try {
            j = u.getBoundingClientRect();
          } catch (g) {
            (a = console.debug) == null || a.call(console, g);
          }
          try {
            y.setPointerCapture(r.pointerId), y.style.cursor = "grabbing";
          } catch (g) {
            (l = console.debug) == null || l.call(console, g);
          }
          tt(r);
        }
      },
      { signal: t.signal, passive: !1 }
    ), window.addEventListener("pointermove", tt, {
      signal: t.signal,
      passive: !1
    }), window.addEventListener("pointerup", et, { signal: t.signal, passive: !0 }), window.addEventListener("pointercancel", et, {
      signal: t.signal,
      passive: !0
    });
  } catch (t) {
    (Bt = console.debug) == null || Bt.call(console, t);
  }
  try {
    F === "y" ? (y.style.width = "100%", y.style.height = `${U}px`, y.style.left = "0", y.style.top = `${k}%`, y.style.transform = "translate(0, -50%)", y.style.cursor = "ns-resize", I.style.width = "100%", I.style.height = `${Q}px`, I.style.top = "50%", I.style.transform = "translate(0, -50%)") : (y.style.height = "100%", y.style.width = `${U}px`, y.style.top = "0", y.style.left = `${k}%`, y.style.transform = "translate(-50%, 0)", y.style.cursor = "ew-resize", I.style.height = "100%", I.style.width = `${Q}px`, I.style.left = "50%", I.style.transform = "translate(-50%, 0)");
  } catch (t) {
    (Ot = console.debug) == null || Ot.call(console, t);
  }
  try {
    u.appendChild(X), u.appendChild(P), u.appendChild(y);
  } catch (t) {
    (Wt = console.debug) == null || Wt.call(console, t);
  }
}
export {
  ne as renderABCompareView
};
