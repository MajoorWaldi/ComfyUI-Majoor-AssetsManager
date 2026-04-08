import { E as S, w as L, f as s } from "./entry-DQ7UexEB.js";
let l = null, c = null, d = null, m = !1, u = null, g = null, h = 0, _ = 0, f = null;
const v = /* @__PURE__ */ new WeakMap();
function k() {
  f && (clearTimeout(f), f = null);
}
const T = /* @__PURE__ */ new Set(["loadimage", "loadimagemask", "loadimageoutput"]), V = /* @__PURE__ */ new Set([
  "vhs_loadvideo",
  "vhs_loadvideoffmpeg",
  "vhs_loadvideobatch",
  "vhs_loadimages",
  // VHS batch image loader
  "loadvideoupload",
  "loadvideo",
  "videoloader",
  "imagefromurl"
]), C = /* @__PURE__ */ new Set([
  "saveimage",
  "previewimage",
  "saveanimatedwebp",
  "saveanimatedpng",
  "imagepreview"
  // some community nodes
]), F = /* @__PURE__ */ new Set([
  "vhs_videocombine",
  // VHS combine + preview
  "vhs_savevideo",
  "previewvideo",
  "savevideo",
  "videopreview"
]);
function I(e) {
  const t = String((e == null ? void 0 : e.type) || "").toLowerCase().replace(/\s+/g, "");
  return T.has(t) ? "load-image" : V.has(t) ? "load-video" : C.has(t) ? "save-image" : F.has(t) ? "save-video" : t.includes("loadimage") || t.includes("image_loader") ? "load-image" : t.includes("loadvideo") || t.includes("videoload") ? "load-video" : t.includes("saveimage") || t.includes("previewimage") ? "save-image" : t.includes("savevideo") || t.includes("videocombine") || t.includes("previewvideo") ? "save-video" : null;
}
function P(e) {
  if (e == null || typeof e != "string") return null;
  const t = e.trim().replace(/\\/g, "/");
  if (!t) return null;
  const n = t.lastIndexOf("/");
  return {
    filename: n >= 0 ? t.slice(n + 1) : t,
    subfolder: n >= 0 ? t.slice(0, n) : ""
  };
}
function p(e, t) {
  var a;
  const n = e == null ? void 0 : e.widgets;
  if (!Array.isArray(n) || !n.length) return null;
  const i = (a = n[0]) == null ? void 0 : a.value;
  if (!i || typeof i != "string") return null;
  const r = P(i);
  return r != null && r.filename ? {
    filename: r.filename,
    subfolder: r.subfolder,
    type: "input",
    kind: t
  } : null;
}
function E(e) {
  try {
    const t = new URL(e, window.location.href), n = t.searchParams.get("filename") || "";
    return n ? {
      filename: n,
      subfolder: t.searchParams.get("subfolder") || "",
      type: t.searchParams.get("type") || "output"
    } : null;
  } catch {
    return null;
  }
}
function y(e, t) {
  var a, o;
  const n = e == null ? void 0 : e.imgs;
  if (!Array.isArray(n) || !n.length) return null;
  const i = ((a = n[n.length - 1]) == null ? void 0 : a.src) || ((o = n[0]) == null ? void 0 : o.src);
  if (!i) return null;
  const r = E(i);
  return r != null && r.filename ? { ...r, kind: t } : null;
}
function W(e) {
  var n;
  const t = e == null ? void 0 : e.widgets;
  if (!Array.isArray(t)) return null;
  for (const i of t) {
    const r = i == null ? void 0 : i.element;
    if (!r) continue;
    const a = r instanceof HTMLVideoElement ? r : (n = r.querySelector) == null ? void 0 : n.call(r, "video");
    if (!(a != null && a.src)) continue;
    const o = E(a.src);
    if (o != null && o.filename) return { ...o, kind: "video" };
  }
  return null;
}
function M(e) {
  var t;
  try {
    if (!s.getLiveActive()) return;
    const n = I(e);
    if (!n) return;
    let i = null;
    if (n === "save-image" ? i = y(e, "image") : n === "save-video" ? i = y(e, "video") ?? W(e) : n === "load-image" ? i = p(e, "image") : i = p(e, "video"), !i) return;
    s.upsertWithContent(i);
  } catch (n) {
    (t = console.debug) == null || t.call(console, "[MFV] graph node selected error", n);
  }
}
function N(e) {
  if (!e || v.has(e)) return;
  const t = e.onNodeSelected, n = e.onSelectionChange;
  v.set(e, { onNodeSelected: t, onSelectionChange: n }), e.onNodeSelected = function(i) {
    var r;
    try {
      t == null || t.call(this, i);
    } catch (a) {
      (r = console.debug) == null || r.call(console, a);
    }
    M(i);
  }, e.onSelectionChange = function(i) {
    var r, a;
    try {
      n == null || n.call(this, i);
    } catch (o) {
      (r = console.debug) == null || r.call(console, o);
    }
    try {
      const o = Object.values(i || {});
      o.length === 1 && M(o[0]);
    } catch (o) {
      (a = console.debug) == null || a.call(console, o);
    }
  }, console.debug("[Majoor] MFV canvas hooks installed");
}
function j(e) {
  if (!e || !v.has(e)) return;
  const t = v.get(e);
  e.onNodeSelected = t.onNodeSelected, e.onSelectionChange = t.onSelectionChange, v.delete(e), console.debug("[Majoor] MFV canvas hooks removed");
}
function O(e) {
  if (!e) return;
  const t = ++_;
  k();
  const n = 30;
  let i = 0;
  const r = () => {
    if (t !== _) return;
    const a = e.canvas;
    if (a) {
      f = null, N(a);
      return;
    }
    ++i < n ? f = setTimeout(r, 300) : console.debug(
      "[Majoor] MFV: canvas not ready after retries — graph node tracking disabled"
    );
  };
  r();
}
async function G(e) {
  var n;
  const t = ++h;
  try {
    A();
    const i = await L({ app: e, timeoutMs: 8e3 });
    if (t !== h) return;
    if (!i) {
      console.debug("[Majoor] MFV: ComfyUI API not found — preview streaming disabled");
      return;
    }
    u = i, d = (r) => {
      var a;
      m = !0;
      try {
        const { blob: o, nodeId: b, jobId: w } = r.detail || {};
        if (!o || !(o instanceof Blob) || g && w && w !== g) return;
        s.feedPreviewBlob(o, {
          sourceLabel: b ? `Node ${b}` : null
        });
      } catch (o) {
        (a = console.debug) == null || a.call(console, "[MFV] b_preview_with_metadata error", o);
      }
    }, i.addEventListener("b_preview_with_metadata", d), c = (r) => {
      var a;
      try {
        if (m) return;
        const o = r.detail;
        if (!o || !(o instanceof Blob)) return;
        s.feedPreviewBlob(o);
      } catch (o) {
        (a = console.debug) == null || a.call(console, "[MFV] preview blob error", o);
      }
    }, i.addEventListener("b_preview", c), console.debug(
      "[Majoor] MFV preview stream hooked to ComfyUI API (b_preview_with_metadata + b_preview fallback)"
    );
  } catch (i) {
    (n = console.debug) == null || n.call(console, "[Majoor] MFV preview hook failed — preview streaming disabled", i);
  }
}
function A() {
  var e, t;
  if (u) {
    if (c)
      try {
        u.removeEventListener("b_preview", c);
      } catch (n) {
        (e = console.debug) == null || e.call(console, n);
      }
    if (d)
      try {
        u.removeEventListener("b_preview_with_metadata", d);
      } catch (n) {
        (t = console.debug) == null || t.call(console, n);
      }
  }
  c = null, d = null, m = !1, u = null;
}
function U(e) {
  g = e || null;
}
function H(e) {
  if (!Array.isArray(e) || !e.length) return null;
  const t = e.filter((n) => {
    const i = String((n == null ? void 0 : n.filename) || "").toLowerCase();
    return i.endsWith(".png") || i.endsWith(".jpg") || i.endsWith(".jpeg") || i.endsWith(".webp") || i.endsWith(".avif");
  });
  return t[t.length - 1] ?? e[e.length - 1];
}
function R(e) {
  l || (l = (t) => {
    var n, i;
    try {
      if (!s.getLiveActive()) return;
      const r = H((n = t.detail) == null ? void 0 : n.files);
      if (!r) return;
      s.upsertWithContent(r);
    } catch (r) {
      (i = console.debug) == null || i.call(console, "[MFV] generation output error", r);
    }
  }, window.addEventListener(S.NEW_GENERATION_OUTPUT, l), O(e), G(e), console.debug("[Majoor] LiveStreamTracker initialized"));
}
function B(e) {
  var t;
  l && (window.removeEventListener(S.NEW_GENERATION_OUTPUT, l), l = null), h += 1, A(), _ += 1, k(), g = null;
  try {
    e != null && e.canvas && j(e.canvas);
  } catch (n) {
    (t = console.debug) == null || t.call(console, n);
  }
  console.debug("[Majoor] LiveStreamTracker torn down");
}
export {
  R as initLiveStreamTracker,
  U as setCurrentJobId,
  B as teardownLiveStreamTracker
};
