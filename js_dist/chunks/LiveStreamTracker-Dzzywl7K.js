import { E as g, w as E, e as l } from "./entry-DCb7bl3f.js";
let p = !1, i = null, u = null, c = null, s = null, w = null, v = 0, _ = 0;
const f = 400, M = /* @__PURE__ */ new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".bmp"]), S = /* @__PURE__ */ new Set([".mp4", ".webm", ".mov", ".avi", ".mkv", ".m4v"]), L = /* @__PURE__ */ new Set([".mp3", ".wav", ".flac", ".ogg", ".m4a", ".aac", ".opus"]), I = /* @__PURE__ */ new Set([".glb", ".gltf", ".obj", ".fbx", ".stl", ".usdz"]);
function y(e) {
  const n = String(e || "").trim().toLowerCase(), t = n.lastIndexOf(".");
  return t >= 0 ? n.slice(t) : "";
}
function T(e) {
  const n = String(
    (e == null ? void 0 : e.kind) || (e == null ? void 0 : e.asset_type) || (e == null ? void 0 : e.media_type) || (e == null ? void 0 : e.type) || ""
  ).toLowerCase();
  if (n === "image" || n === "video" || n === "audio" || n === "model3d")
    return !0;
  const t = y((e == null ? void 0 : e.filename) || (e == null ? void 0 : e.name) || "");
  return M.has(t) || S.has(t) || L.has(t) || I.has(t);
}
function k() {
  return Date.now() - _ <= f;
}
async function A(e) {
  var t;
  const n = ++v;
  try {
    h();
    const o = await E({ app: e, timeoutMs: 8e3 });
    if (n !== v) return;
    if (!o) {
      console.debug("[Majoor] MFV: ComfyUI API not found - preview streaming disabled");
      return;
    }
    s = o, c = (a) => {
      var d;
      _ = Date.now();
      try {
        const { blob: r, nodeId: b, jobId: m } = a.detail || {};
        if (!r || !(r instanceof Blob) || w && m && m !== w) return;
        l.feedPreviewBlob(r, {
          sourceLabel: b ? `Node ${b}` : null
        });
      } catch (r) {
        (d = console.debug) == null || d.call(console, "[MFV] b_preview_with_metadata error", r);
      }
    }, o.addEventListener("b_preview_with_metadata", c), u = (a) => {
      var d;
      try {
        if (k()) return;
        const r = a.detail;
        if (!r || !(r instanceof Blob)) return;
        l.feedPreviewBlob(r);
      } catch (r) {
        (d = console.debug) == null || d.call(console, "[MFV] preview blob error", r);
      }
    }, o.addEventListener("b_preview", u), console.debug(
      "[Majoor] MFV preview stream hooked to ComfyUI API (b_preview_with_metadata + b_preview fallback)"
    );
  } catch (o) {
    (t = console.debug) == null || t.call(console, "[Majoor] MFV preview hook failed - preview streaming disabled", o);
  }
}
function h() {
  var e, n;
  if (s) {
    if (u)
      try {
        s.removeEventListener("b_preview", u);
      } catch (t) {
        (e = console.debug) == null || e.call(console, t);
      }
    if (c)
      try {
        s.removeEventListener("b_preview_with_metadata", c);
      } catch (t) {
        (n = console.debug) == null || n.call(console, t);
      }
  }
  u = null, c = null, _ = 0, s = null;
}
function O(e) {
  w = e || null;
}
function P(e) {
  if (!Array.isArray(e) || !e.length) return null;
  for (let n = e.length - 1; n >= 0; n -= 1) {
    const t = e[n];
    if (T(t)) return t;
  }
  return e[e.length - 1];
}
function V(e) {
  i || (p = !0, i = (n) => {
    var t, o;
    try {
      if (!l.getLiveActive()) return;
      const a = P((t = n.detail) == null ? void 0 : t.files);
      if (!a) return;
      l.upsertWithContent(a);
    } catch (a) {
      (o = console.debug) == null || o.call(console, "[MFV] generation output error", a);
    }
  }, typeof window < "u" && window.addEventListener(g.NEW_GENERATION_OUTPUT, i), A(e), console.debug("[Majoor] LiveStreamTracker initialized"));
}
function j(e) {
  i && (typeof window < "u" && window.removeEventListener(g.NEW_GENERATION_OUTPUT, i), i = null), v += 1, h(), w = null, p = !1, console.debug("[Majoor] LiveStreamTracker torn down");
}
function F() {
  return p;
}
export {
  V as initLiveStreamTracker,
  F as isLiveStreamTrackerInitialized,
  O as setCurrentJobId,
  j as teardownLiveStreamTracker
};
