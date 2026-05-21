import { _ as oo, j as no, k as to, A as $, l as eo, m as ro, o as io } from "./entry-GsSiDCM7.js";
import { o as E, c as R, t as z, a as O, b as I, n as co, d as A, e as j } from "./mjr-vue-vendor-LmyMh4Y4.js";
const lo = { style: { display: "flex", "flex-direction": "column", gap: "10px", "margin-bottom": "14px" } }, uo = {
  key: 0,
  style: { "font-size": "12px", "font-weight": "600", "letter-spacing": "0.02em", color: "rgba(255,255,255,0.86)" }
}, fo = {
  key: 1,
  style: { padding: "10px 12px", "border-radius": "10px", border: "1px solid rgba(33,150,243,0.35)", background: "rgba(33,150,243,0.08)", color: "rgba(255,255,255,0.86)", "white-space": "pre-wrap" }
}, po = { style: { "font-size": "12px", opacity: "0.9" } }, go = {
  key: 6,
  style: { padding: "10px 12px", "border-radius": "10px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.72)" }
}, yo = {
  key: 7,
  style: { border: "1px solid rgba(255,255,255,0.10)", "border-radius": "10px", background: "rgba(255,255,255,0.04)", overflow: "hidden" }
}, _o = { style: { margin: "0", padding: "10px 12px", "max-height": "280px", overflow: "auto", "font-size": "11px", "line-height": "1.35", color: "rgba(255,255,255,0.86)" } }, ao = {
  __name: "ViewerMetadataBlock",
  props: {
    title: { type: String, default: "" },
    asset: { type: Object, default: null },
    loading: { type: Boolean, default: !1 },
    onRetry: { type: Function, default: null }
  },
  setup(o) {
    const t = o;
    function e(i) {
      try {
        if (!i || typeof i != "object") return null;
        const r = i == null ? void 0 : i.metadata_raw;
        return r && typeof r == "object" && r.geninfo_status && typeof r.geninfo_status == "object" ? r.geninfo_status : i != null && i.geninfo_status && typeof i.geninfo_status == "object" ? i.geninfo_status : null;
      } catch {
        return null;
      }
    }
    function c(i) {
      const r = (i == null ? void 0 : i.metadata_raw) ?? null;
      if (!r) return null;
      if (typeof r == "object") return r;
      if (typeof r != "string") return null;
      const y = r.trim();
      if (!y) return null;
      try {
        const a = JSON.parse(y);
        return a && typeof a == "object" ? a : null;
      } catch {
        return null;
      }
    }
    function u(i) {
      try {
        const r = Object.entries(i || {});
        if (!r.length) return !1;
        let y = 0;
        for (const [, a] of r.slice(0, 50))
          if (!(!a || typeof a != "object") && (a.inputs && typeof a.inputs == "object" && (y += 1), y >= 2))
            return !0;
      } catch {
        return !1;
      }
      return !1;
    }
    function d(i) {
      const r = c(i), y = (i == null ? void 0 : i.workflow) || (i == null ? void 0 : i.Workflow) || (i == null ? void 0 : i.comfy_workflow) || (r == null ? void 0 : r.workflow) || (r == null ? void 0 : r.Workflow) || (r == null ? void 0 : r.comfy_workflow) || null;
      if (!y) return null;
      if (typeof y == "object") return y;
      if (typeof y != "string") return null;
      const a = y.trim();
      if (!a) return null;
      try {
        return JSON.parse(a);
      } catch {
        return null;
      }
    }
    function l(i) {
      const r = c(i), y = (i == null ? void 0 : i.prompt) || (i == null ? void 0 : i.Prompt) || (r == null ? void 0 : r.prompt) || (r == null ? void 0 : r.Prompt) || null;
      if (!y) return null;
      if (typeof y == "object") return u(y) ? y : null;
      if (typeof y != "string") return null;
      const a = y.trim();
      if (!a) return null;
      try {
        const f = JSON.parse(a);
        return u(f) ? f : null;
      } catch {
        return null;
      }
    }
    function n(i) {
      return !!(d(i) || l(i));
    }
    function g(i) {
      var a, f, h, F;
      const r = i || {}, y = r.generation_time || r.file_creation_time || r.mtime || r.created_at;
      return !!(r.width && r.height || r.duration && r.duration > 0 || y || r.size && r.size > 0 || r.id != null || r.job_id || (a = r.file_info) != null && a.job_id || r.source_node_id || (f = r.file_info) != null && f.source_node_id || r.source_node_type || (h = r.file_info) != null && h.source_node_type || r.workflow_id || (F = r.file_info) != null && F.workflow_id);
    }
    function _(i) {
      if (i == null) return "";
      const r = typeof i == "string" ? i : JSON.stringify(i, null, 2);
      return r ? r.length > 4e4 ? `${r.slice(0, 4e4)}
...(truncated)` : r : "";
    }
    function p() {
      typeof t.onRetry == "function" && t.onRetry();
    }
    const b = j(() => e(t.asset)), v = j(() => eo(t.asset)), G = j(() => v.value.kind !== "empty"), T = j(() => g(t.asset)), m = j(
      () => $.WORKFLOW_MINIMAP_ENABLED !== !1 && n(t.asset)
    ), N = j(
      () => b.value && typeof b.value == "object" && b.value.kind === "fetch_error"
    ), k = j(() => {
      var i;
      return _((i = t.asset) == null ? void 0 : i.metadata_raw);
    }), x = j(
      () => !t.loading && !N.value && !T.value && !G.value && !m.value
    ), S = j(() => {
      var y, a, f, h;
      if (!N.value) return "";
      const i = String(
        ((y = b.value) == null ? void 0 : y.message) || ((a = b.value) == null ? void 0 : a.error) || "Failed to load generation data."
      ), r = String(((f = b.value) == null ? void 0 : f.code) || ((h = b.value) == null ? void 0 : h.stage) || "").trim();
      return r ? `${i}

Code: ${r}
Click to retry.` : `${i}

Click to retry.`;
    });
    return (i, r) => (E(), R("div", lo, [
      t.title ? (E(), R("div", uo, z(t.title), 1)) : O("", !0),
      t.loading ? (E(), R("div", fo, [...r[0] || (r[0] = [
        I("div", { style: { "font-size": "12px", "font-weight": "700", "margin-bottom": "6px" } }, "Loading", -1),
        I("div", { style: { "font-size": "12px", opacity: "0.88" } }, "Loading generation data...", -1)
      ])])) : O("", !0),
      N.value ? (E(), R("div", {
        key: 2,
        style: co([{ padding: "10px 12px", "border-radius": "10px", border: "1px solid rgba(244,67,54,0.35)", background: "rgba(244,67,54,0.08)", color: "rgba(255,255,255,0.9)", "white-space": "pre-wrap" }, { cursor: t.onRetry ? "pointer" : "default" }]),
        onClick: p
      }, [
        r[1] || (r[1] = I("div", { style: { "font-size": "12px", "font-weight": "700", "margin-bottom": "6px" } }, "Error Loading Metadata", -1)),
        I("div", po, z(S.value), 1)
      ], 4)) : O("", !0),
      T.value ? (E(), A(oo, {
        key: 3,
        asset: t.asset
      }, null, 8, ["asset"])) : O("", !0),
      G.value ? (E(), A(no, {
        key: 4,
        asset: t.asset
      }, null, 8, ["asset"])) : O("", !0),
      m.value ? (E(), A(to, {
        key: 5,
        asset: t.asset
      }, null, 8, ["asset"])) : O("", !0),
      x.value ? (E(), R("div", go, " No generation data found for this file. ")) : O("", !0),
      k.value ? (E(), R("details", yo, [
        r[2] || (r[2] = I("summary", { style: { cursor: "pointer", padding: "10px 12px", color: "rgba(255,255,255,0.78)", "user-select": "none" } }, " Raw metadata ", -1)),
        I("pre", _o, z(k.value), 1)
      ])) : O("", !0)
    ]));
  }
}, L = (o, t = null) => {
  const e = ro(o);
  return e === void 0 ? t : e;
};
var X;
const M = ((X = $) == null ? void 0 : X.VIEWER_GENINFO_TTL_MS) ?? 3e4;
var U;
const P = ((U = $) == null ? void 0 : U.VIEWER_GENINFO_ERROR_TTL_MS) ?? 8e3;
var q;
const V = ((q = $) == null ? void 0 : q.VIEWER_GENINFO_MAX_ENTRIES) ?? 300, W = /* @__PURE__ */ new Map(), D = /* @__PURE__ */ new Map(), C = /* @__PURE__ */ new Map(), mo = (o, t, e) => {
  var c, u;
  try {
    const d = Date.now();
    for (const [g, _] of o.entries()) {
      if (!_) {
        o.delete(g);
        continue;
      }
      d - (_.at || 0) > t && o.delete(g);
    }
    if (o.size <= e) return;
    const l = Array.from(o.entries()).sort(
      (g, _) => {
        var p, b;
        return (((p = g == null ? void 0 : g[1]) == null ? void 0 : p.at) || 0) - (((b = _ == null ? void 0 : _[1]) == null ? void 0 : b.at) || 0);
      }
    ), n = o.size - e;
    for (let g = 0; g < n; g++) {
      const _ = (c = l[g]) == null ? void 0 : c[0];
      _ != null && o.delete(_);
    }
  } catch (d) {
    (u = console.debug) == null || u.call(console, d);
  }
}, H = (o, t, e) => {
  try {
    const c = o.get(t);
    return c ? Date.now() - (c.at || 0) > e ? (o.delete(t), null) : c.data ?? null : null;
  } catch {
    return null;
  }
}, J = (o, t, e, c, u) => {
  var d;
  try {
    o.set(t, { at: Date.now(), data: e }), mo(o, c, u);
  } catch (l) {
    (d = console.debug) == null || d.call(console, l);
  }
}, bo = (o) => {
  var t;
  try {
    const e = o == null ? void 0 : o.id;
    if (e != null) return `id:${e}`;
    const c = Q(o);
    if (c) return `fp:${c}`;
    const u = String((o == null ? void 0 : o.filename) || (o == null ? void 0 : o.name) || "").trim(), d = String((o == null ? void 0 : o.subfolder) || "").trim(), l = String((o == null ? void 0 : o.source) || (o == null ? void 0 : o.type) || "output").trim().toLowerCase();
    if (u) return `name:${l}:${d}:${u}`;
  } catch (e) {
    (t = console.debug) == null || t.call(console, e);
  }
  return null;
}, wo = (o) => {
  try {
    if (!o || typeof o != "object") return null;
    const t = o == null ? void 0 : o.metadata_raw;
    return t && typeof t == "object" && t.geninfo_status && typeof t.geninfo_status == "object" ? t.geninfo_status : o != null && o.geninfo_status && typeof o.geninfo_status == "object" ? o.geninfo_status : null;
  } catch {
    return null;
  }
}, K = (o, t) => {
  var e, c, u, d;
  try {
    if (!o || typeof o != "object" || !t || typeof t != "object") return;
    try {
      o.geninfo_status = t;
    } catch (l) {
      (e = console.debug) == null || e.call(console, l);
    }
    try {
      const l = o.metadata_raw;
      if (l && typeof l == "object") {
        l.geninfo_status = t, o.metadata_raw = l;
        return;
      }
      if (typeof l == "string") return;
    } catch (l) {
      (c = console.debug) == null || c.call(console, l);
    }
    try {
      o.metadata_raw = { geninfo_status: t };
    } catch (l) {
      (u = console.debug) == null || u.call(console, l);
    }
  } catch (l) {
    (d = console.debug) == null || d.call(console, l);
  }
}, B = (o) => {
  try {
    if (!o || typeof o != "object") return !1;
    if (o.geninfo && typeof o.geninfo == "object" && Object.keys(o.geninfo).length || o.prompt != null || o.workflow != null || o.metadata != null || o.exif != null) return !0;
    const t = o.metadata_raw;
    if (t && typeof t == "object") {
      const e = [
        "geninfo",
        "GenInfo",
        "generation",
        "prompt",
        "Prompt",
        "negative_prompt",
        "workflow",
        "Workflow",
        "comfy_workflow",
        "geninfo_status"
      ];
      for (const c of e)
        if (t[c] != null) return !0;
      return !1;
    }
    if (typeof t == "string") {
      const e = t.trim();
      if (!e || e === "{}" || e === "null" || e === "[]" || e === "{{}}") return !1;
      const c = [
        "Negative prompt:",
        '"prompt"',
        '"negative_prompt"',
        '"geninfo"',
        '"workflow"',
        '"comfy_workflow"'
      ];
      for (const u of c)
        if (e.includes(u)) return !0;
      return !1;
    }
    return !1;
  } catch {
    return !1;
  }
}, Q = (o) => {
  var c, u;
  const t = (o == null ? void 0 : o.filepath) || (o == null ? void 0 : o.path) || ((c = o == null ? void 0 : o.file_info) == null ? void 0 : c.filepath) || ((u = o == null ? void 0 : o.file_info) == null ? void 0 : u.path) || (o == null ? void 0 : o.filePath) || null;
  if (typeof t != "string") return null;
  const e = t.trim();
  return e || null;
}, ho = (o) => {
  var t, e;
  try {
    if (String((o == null ? void 0 : o.mime) || (o == null ? void 0 : o.mimetype) || (o == null ? void 0 : o.type) || "").toLowerCase().startsWith("video/")) return !0;
    const d = ((e = (t = (Q(o) || String((o == null ? void 0 : o.filename) || (o == null ? void 0 : o.name) || "")).split(".").pop()) == null ? void 0 : t.toLowerCase) == null ? void 0 : e.call(t)) || "";
    return ["mp4", "webm", "mov", "mkv", "avi", "m4v", "gif"].includes(d);
  } catch {
    return !1;
  }
}, Y = (o) => {
  if (!o) return null;
  if (typeof o == "object") return o;
  if (typeof o != "string") return null;
  const t = o.trim();
  return t ? L(() => {
    const e = JSON.parse(t);
    return e && typeof e == "object" ? e : null;
  }, null) : null;
}, xo = (o) => {
  var t;
  try {
    if (!ho(o) || o != null && o.geninfo || o != null && o.prompt || o != null && o.workflow || o != null && o.metadata) return;
    const e = Y(o == null ? void 0 : o.metadata_raw) || {};
    if (e.geninfo_status) return;
    if (o != null && o.geninfo_status) {
      e.geninfo_status = o.geninfo_status, o.metadata_raw = e;
      return;
    }
    e.geninfo_status = { kind: "media_pipeline" }, o.metadata_raw = e;
  } catch (e) {
    (t = console.debug) == null || t.call(console, e);
  }
}, ko = (o, t) => {
  var c, u, d, l, n, g, _;
  const e = t && typeof t == "object" ? t : null;
  if (!e) return o;
  try {
    o.prompt = o.prompt ?? e.prompt;
  } catch (p) {
    (c = console.debug) == null || c.call(console, p);
  }
  try {
    o.workflow = o.workflow ?? e.workflow;
  } catch (p) {
    (u = console.debug) == null || u.call(console, p);
  }
  try {
    o.geninfo = o.geninfo ?? e.geninfo;
  } catch (p) {
    (d = console.debug) == null || d.call(console, p);
  }
  try {
    o.geninfo_status = o.geninfo_status ?? e.geninfo_status;
  } catch (p) {
    (l = console.debug) == null || l.call(console, p);
  }
  try {
    o.exif = o.exif ?? e.exif;
  } catch (p) {
    (n = console.debug) == null || n.call(console, p);
  }
  try {
    o.ffprobe = o.ffprobe ?? e.ffprobe;
  } catch (p) {
    (g = console.debug) == null || g.call(console, p);
  }
  try {
    if (o.metadata_raw == null)
      o.metadata_raw = e;
    else {
      const p = Y(o.metadata_raw);
      if (p && typeof p == "object") {
        const b = ["geninfo_status", "workflow", "prompt", "geninfo"];
        for (const v of b)
          p[v] == null && e[v] != null && (p[v] = e[v]);
        o.metadata_raw = p;
      }
    }
  } catch (p) {
    (_ = console.debug) == null || _.call(console, p);
  }
  return o;
};
async function jo(o, { getAssetMetadata: t, getFileMetadataScoped: e, metadataCache: c, signal: u } = {}) {
  var b, v, G, T;
  if (!o || typeof o != "object") return o;
  const d = (o == null ? void 0 : o.id) ?? null, l = bo(o);
  let n = o;
  const g = l ? H(W, l, M) : null;
  if (g && typeof g == "object")
    return { ...o, ...g };
  const _ = l ? H(D, l, P) : null;
  if (_) {
    try {
      K(n, _);
    } catch (m) {
      (b = console.debug) == null || b.call(console, m);
    }
    return n;
  }
  if (l && C.has(l))
    try {
      const m = C.get(l);
      if (m && typeof m.then == "function")
        return await m;
    } catch (m) {
      (v = console.debug) == null || v.call(console, m);
    }
  const p = async () => {
    var S, i, r, y, a;
    const m = d != null ? L(() => {
      var f, h;
      return ((h = (f = c == null ? void 0 : c.getCached) == null ? void 0 : f.call(c, d)) == null ? void 0 : h.data) || null;
    }, null) : null;
    m && typeof m == "object" && (n = { ...o, ...m });
    const N = !!(n != null && n.has_generation_data || n != null && n.has_workflow || n != null && n.has_generation || n != null && n.has_generation_info), k = !!(n != null && n.geninfo || n != null && n.prompt || n != null && n.workflow || n != null && n.metadata);
    let x = null;
    if (d != null && (!B(n) || N && !k)) {
      const f = await L(
        () => t == null ? void 0 : t(d, u ? { signal: u } : {}),
        null
      );
      f != null && f.ok && f.data && typeof f.data == "object" ? (n = { ...n, ...f.data }, L(() => {
        var h;
        return (h = c == null ? void 0 : c.setCached) == null ? void 0 : h.call(c, d, f.data);
      })) : f && (f == null ? void 0 : f.code) !== "ABORTED" && (x = {
        kind: "fetch_error",
        stage: "asset",
        code: (f == null ? void 0 : f.code) || "FETCH_ERROR",
        message: (f == null ? void 0 : f.error) || "Failed to load asset metadata"
      });
    }
    if (!B(n))
      try {
        const f = String((n == null ? void 0 : n.source) || (n == null ? void 0 : n.type) || "output").trim().toLowerCase() || "output", h = String(
          (n == null ? void 0 : n.filename) || (n == null ? void 0 : n.name) || ((S = n == null ? void 0 : n.file_info) == null ? void 0 : S.filename) || ""
        ).trim(), F = String(
          (n == null ? void 0 : n.subfolder) || ((i = n == null ? void 0 : n.file_info) == null ? void 0 : i.subfolder) || ""
        ).trim(), Z = String(
          (n == null ? void 0 : n.root_id) || (n == null ? void 0 : n.rootId) || ((r = n == null ? void 0 : n.file_info) == null ? void 0 : r.root_id) || ""
        ).trim(), s = String(
          (n == null ? void 0 : n.filepath) || (n == null ? void 0 : n.path) || ((y = n == null ? void 0 : n.file_info) == null ? void 0 : y.filepath) || ""
        ).trim();
        if (h) {
          const w = await L(
            () => e == null ? void 0 : e(
              {
                type: f,
                filename: h,
                subfolder: F,
                root_id: Z,
                filepath: s
              },
              u ? { signal: u } : {}
            ),
            null
          );
          w != null && w.ok && w.data ? n = ko({ ...n }, w.data) : w && (w == null ? void 0 : w.code) !== "ABORTED" && (x = {
            kind: "fetch_error",
            stage: "file_scoped",
            code: (w == null ? void 0 : w.code) || "FETCH_ERROR",
            message: (w == null ? void 0 : w.error) || "Failed to extract file metadata"
          });
        }
      } catch (f) {
        (a = console.debug) == null || a.call(console, f);
      }
    if (xo(n), !B(n) && x) {
      const f = wo(n);
      f && f.kind === "media_pipeline" || K(n, x);
    }
    return B(n) && l ? J(W, l, n, M, V) : x && l && J(
      D,
      l,
      x,
      P,
      V
    ), n;
  };
  if (l) {
    const m = () => {
      var k;
      try {
        C.delete(l);
      } catch (x) {
        (k = console.debug) == null || k.call(console, x);
      }
    };
    try {
      (G = u == null ? void 0 : u.addEventListener) == null || G.call(u, "abort", m, { once: !0 });
    } catch (k) {
      (T = console.debug) == null || T.call(console, k);
    }
    const N = p().finally(() => {
      var k, x, S;
      try {
        (k = u == null ? void 0 : u.removeEventListener) == null || k.call(u, "abort", m);
      } catch (i) {
        (x = console.debug) == null || x.call(console, i);
      }
      try {
        C.delete(l);
      } catch (i) {
        (S = console.debug) == null || S.call(console, i);
      }
    });
    return C.set(l, N), await N;
  }
  return await p();
}
function No({ title: o, asset: t, ui: e } = {}) {
  var l;
  const c = document.createElement("div");
  try {
    const { app: n } = io(ao, {
      title: o,
      asset: t,
      loading: !!(e != null && e.loading),
      onRetry: typeof (e == null ? void 0 : e.onRetry) == "function" ? e.onRetry : null
    });
    return n.mount(c), c._mjrDispose = () => {
      var g;
      try {
        n.unmount();
      } catch (_) {
        (g = console.debug) == null || g.call(console, _);
      }
    }, c;
  } catch (n) {
    (l = console.debug) == null || l.call(console, n);
  }
  const u = document.createElement("div");
  if (u.style.cssText = "display:flex; flex-direction:column; gap:10px; margin-bottom: 14px;", o) {
    const n = document.createElement("div");
    n.textContent = o, n.style.cssText = "font-size: 12px; font-weight: 600; letter-spacing: 0.02em; color: rgba(255,255,255,0.86);", u.appendChild(n);
  }
  const d = t == null ? void 0 : t.metadata_raw;
  if (d != null) {
    const n = document.createElement("details");
    n.style.cssText = "border: 1px solid rgba(255,255,255,0.10); border-radius: 10px; background: rgba(255,255,255,0.04); overflow: hidden;";
    const g = document.createElement("summary");
    g.textContent = "Raw metadata", g.style.cssText = "cursor: pointer; padding: 10px 12px; color: rgba(255,255,255,0.78); user-select: none;";
    const _ = document.createElement("pre");
    _.style.cssText = "margin:0; padding: 10px 12px; max-height: 280px; overflow:auto; font-size: 11px; line-height: 1.35; color: rgba(255,255,255,0.86);";
    let p = typeof d == "string" ? d : JSON.stringify(d, null, 2);
    p.length > 4e4 && (p = `${p.slice(0, 4e4)}
...(truncated)`), _.textContent = p, n.appendChild(g), n.appendChild(_), u.appendChild(n);
  }
  return u;
}
export {
  No as buildViewerMetadataBlocks,
  jo as ensureViewerMetadataAsset
};
