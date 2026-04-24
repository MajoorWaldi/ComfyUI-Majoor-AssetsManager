import { E as h, w as m, e as c } from "./entry-CQliMTUY.js";
let b = !1, a = null, u = null, s = null, w = !1, d = null, f = null, v = 0;
async function L(e) {
  var r;
  const i = ++v;
  try {
    g();
    const t = await m({ app: e, timeoutMs: 8e3 });
    if (i !== v) return;
    if (!t) {
      console.debug("[Majoor] MFV: ComfyUI API not found - preview streaming disabled");
      return;
    }
    d = t, s = (o) => {
      var l;
      w = !0;
      try {
        const { blob: n, nodeId: p, jobId: _ } = o.detail || {};
        if (!n || !(n instanceof Blob) || f && _ && _ !== f) return;
        c.feedPreviewBlob(n, {
          sourceLabel: p ? `Node ${p}` : null
        });
      } catch (n) {
        (l = console.debug) == null || l.call(console, "[MFV] b_preview_with_metadata error", n);
      }
    }, t.addEventListener("b_preview_with_metadata", s), u = (o) => {
      var l;
      try {
        if (w) return;
        const n = o.detail;
        if (!n || !(n instanceof Blob)) return;
        c.feedPreviewBlob(n);
      } catch (n) {
        (l = console.debug) == null || l.call(console, "[MFV] preview blob error", n);
      }
    }, t.addEventListener("b_preview", u), console.debug(
      "[Majoor] MFV preview stream hooked to ComfyUI API (b_preview_with_metadata + b_preview fallback)"
    );
  } catch (t) {
    (r = console.debug) == null || r.call(console, "[Majoor] MFV preview hook failed - preview streaming disabled", t);
  }
}
function g() {
  var e, i;
  if (d) {
    if (u)
      try {
        d.removeEventListener("b_preview", u);
      } catch (r) {
        (e = console.debug) == null || e.call(console, r);
      }
    if (s)
      try {
        d.removeEventListener("b_preview_with_metadata", s);
      } catch (r) {
        (i = console.debug) == null || i.call(console, r);
      }
  }
  u = null, s = null, w = !1, d = null;
}
function y(e) {
  f = e || null;
}
function E(e) {
  if (!Array.isArray(e) || !e.length) return null;
  const i = e.filter((r) => {
    const t = String((r == null ? void 0 : r.filename) || "").toLowerCase();
    return t.endsWith(".png") || t.endsWith(".jpg") || t.endsWith(".jpeg") || t.endsWith(".webp") || t.endsWith(".avif");
  });
  return i[i.length - 1] ?? e[e.length - 1];
}
function k(e) {
  a || (b = !0, a = (i) => {
    var r, t;
    try {
      if (!c.getLiveActive()) return;
      const o = E((r = i.detail) == null ? void 0 : r.files);
      if (!o) return;
      c.upsertWithContent(o);
    } catch (o) {
      (t = console.debug) == null || t.call(console, "[MFV] generation output error", o);
    }
  }, typeof window < "u" && window.addEventListener(h.NEW_GENERATION_OUTPUT, a), L(e), console.debug("[Majoor] LiveStreamTracker initialized"));
}
function T(e) {
  a && (typeof window < "u" && window.removeEventListener(h.NEW_GENERATION_OUTPUT, a), a = null), v += 1, g(), f = null, b = !1, console.debug("[Majoor] LiveStreamTracker torn down");
}
function I() {
  return b;
}
export {
  k as initLiveStreamTracker,
  I as isLiveStreamTrackerInitialized,
  y as setCurrentJobId,
  T as teardownLiveStreamTracker
};
