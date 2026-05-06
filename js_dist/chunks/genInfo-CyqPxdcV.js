import { _ as nn, j as on, k as tn, A as B, l as en, m as rn, o as cn } from "./entry-BDwPEAWm.js";
import { o as E, c as R, t as $, a as O, b as I, n as ln, d as z, e as j } from "./mjr-vue-vendor-LmyMh4Y4.js";
const un = { style: { display: "flex", "flex-direction": "column", gap: "10px", "margin-bottom": "14px" } }, fn = {
  key: 0,
  style: { "font-size": "12px", "font-weight": "600", "letter-spacing": "0.02em", color: "rgba(255,255,255,0.86)" }
}, pn = {
  key: 1,
  style: { padding: "10px 12px", "border-radius": "10px", border: "1px solid rgba(33,150,243,0.35)", background: "rgba(33,150,243,0.08)", color: "rgba(255,255,255,0.86)", "white-space": "pre-wrap" }
}, dn = { style: { "font-size": "12px", opacity: "0.9" } }, gn = {
  key: 6,
  style: { padding: "10px 12px", "border-radius": "10px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.72)" }
}, yn = {
  key: 7,
  style: { border: "1px solid rgba(255,255,255,0.10)", "border-radius": "10px", background: "rgba(255,255,255,0.04)", overflow: "hidden" }
}, an = { style: { margin: "0", padding: "10px 12px", "max-height": "280px", overflow: "auto", "font-size": "11px", "line-height": "1.35", color: "rgba(255,255,255,0.86)" } }, _n = {
  __name: "ViewerMetadataBlock",
  props: {
    title: { type: String, default: "" },
    asset: { type: Object, default: null },
    loading: { type: Boolean, default: !1 },
    onRetry: { type: Function, default: null }
  },
  setup(n) {
    const t = n;
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
        const _ = JSON.parse(y);
        return _ && typeof _ == "object" ? _ : null;
      } catch {
        return null;
      }
    }
    function u(i) {
      try {
        const r = Object.entries(i || {});
        if (!r.length) return !1;
        let y = 0;
        for (const [, _] of r.slice(0, 50))
          if (!(!_ || typeof _ != "object") && (_.inputs && typeof _.inputs == "object" && (y += 1), y >= 2))
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
      const _ = y.trim();
      if (!_) return null;
      try {
        return JSON.parse(_);
      } catch {
        return null;
      }
    }
    function l(i) {
      const r = c(i), y = (i == null ? void 0 : i.prompt) || (i == null ? void 0 : i.Prompt) || (r == null ? void 0 : r.prompt) || (r == null ? void 0 : r.Prompt) || null;
      if (!y) return null;
      if (typeof y == "object") return u(y) ? y : null;
      if (typeof y != "string") return null;
      const _ = y.trim();
      if (!_) return null;
      try {
        const f = JSON.parse(_);
        return u(f) ? f : null;
      } catch {
        return null;
      }
    }
    function o(i) {
      return !!(d(i) || l(i));
    }
    function g(i) {
      const r = i || {}, y = r.generation_time || r.file_creation_time || r.mtime || r.created_at;
      return !!(r.width && r.height || r.duration && r.duration > 0 || y || r.size && r.size > 0 || r.id != null || r.job_id);
    }
    function a(i) {
      if (i == null) return "";
      const r = typeof i == "string" ? i : JSON.stringify(i, null, 2);
      return r ? r.length > 4e4 ? `${r.slice(0, 4e4)}
...(truncated)` : r : "";
    }
    function p() {
      typeof t.onRetry == "function" && t.onRetry();
    }
    const b = j(() => e(t.asset)), v = j(() => en(t.asset)), G = j(() => v.value.kind !== "empty"), T = j(() => g(t.asset)), m = j(
      () => B.WORKFLOW_MINIMAP_ENABLED !== !1 && o(t.asset)
    ), N = j(
      () => b.value && typeof b.value == "object" && b.value.kind === "fetch_error"
    ), x = j(() => {
      var i;
      return a((i = t.asset) == null ? void 0 : i.metadata_raw);
    }), h = j(
      () => !t.loading && !N.value && !T.value && !G.value && !m.value
    ), S = j(() => {
      var y, _, f, k;
      if (!N.value) return "";
      const i = String(
        ((y = b.value) == null ? void 0 : y.message) || ((_ = b.value) == null ? void 0 : _.error) || "Failed to load generation data."
      ), r = String(((f = b.value) == null ? void 0 : f.code) || ((k = b.value) == null ? void 0 : k.stage) || "").trim();
      return r ? `${i}

Code: ${r}
Click to retry.` : `${i}

Click to retry.`;
    });
    return (i, r) => (E(), R("div", un, [
      t.title ? (E(), R("div", fn, $(t.title), 1)) : O("", !0),
      t.loading ? (E(), R("div", pn, [...r[0] || (r[0] = [
        I("div", { style: { "font-size": "12px", "font-weight": "700", "margin-bottom": "6px" } }, "Loading", -1),
        I("div", { style: { "font-size": "12px", opacity: "0.88" } }, "Loading generation data...", -1)
      ])])) : O("", !0),
      N.value ? (E(), R("div", {
        key: 2,
        style: ln([{ padding: "10px 12px", "border-radius": "10px", border: "1px solid rgba(244,67,54,0.35)", background: "rgba(244,67,54,0.08)", color: "rgba(255,255,255,0.9)", "white-space": "pre-wrap" }, { cursor: t.onRetry ? "pointer" : "default" }]),
        onClick: p
      }, [
        r[1] || (r[1] = I("div", { style: { "font-size": "12px", "font-weight": "700", "margin-bottom": "6px" } }, "Error Loading Metadata", -1)),
        I("div", dn, $(S.value), 1)
      ], 4)) : O("", !0),
      T.value ? (E(), z(nn, {
        key: 3,
        asset: t.asset
      }, null, 8, ["asset"])) : O("", !0),
      G.value ? (E(), z(on, {
        key: 4,
        asset: t.asset
      }, null, 8, ["asset"])) : O("", !0),
      m.value ? (E(), z(tn, {
        key: 5,
        asset: t.asset
      }, null, 8, ["asset"])) : O("", !0),
      h.value ? (E(), R("div", gn, " No generation data found for this file. ")) : O("", !0),
      x.value ? (E(), R("details", yn, [
        r[2] || (r[2] = I("summary", { style: { cursor: "pointer", padding: "10px 12px", color: "rgba(255,255,255,0.78)", "user-select": "none" } }, " Raw metadata ", -1)),
        I("pre", an, $(x.value), 1)
      ])) : O("", !0)
    ]));
  }
}, L = (n, t = null) => {
  const e = rn(n);
  return e === void 0 ? t : e;
};
var K;
const A = ((K = B) == null ? void 0 : K.VIEWER_GENINFO_TTL_MS) ?? 3e4;
var X;
const M = ((X = B) == null ? void 0 : X.VIEWER_GENINFO_ERROR_TTL_MS) ?? 8e3;
var U;
const P = ((U = B) == null ? void 0 : U.VIEWER_GENINFO_MAX_ENTRIES) ?? 300, V = /* @__PURE__ */ new Map(), W = /* @__PURE__ */ new Map(), C = /* @__PURE__ */ new Map(), mn = (n, t, e) => {
  var c, u;
  try {
    const d = Date.now();
    for (const [g, a] of n.entries()) {
      if (!a) {
        n.delete(g);
        continue;
      }
      d - (a.at || 0) > t && n.delete(g);
    }
    if (n.size <= e) return;
    const l = Array.from(n.entries()).sort(
      (g, a) => {
        var p, b;
        return (((p = g == null ? void 0 : g[1]) == null ? void 0 : p.at) || 0) - (((b = a == null ? void 0 : a[1]) == null ? void 0 : b.at) || 0);
      }
    ), o = n.size - e;
    for (let g = 0; g < o; g++) {
      const a = (c = l[g]) == null ? void 0 : c[0];
      a != null && n.delete(a);
    }
  } catch (d) {
    (u = console.debug) == null || u.call(console, d);
  }
}, D = (n, t, e) => {
  try {
    const c = n.get(t);
    return c ? Date.now() - (c.at || 0) > e ? (n.delete(t), null) : c.data ?? null : null;
  } catch {
    return null;
  }
}, H = (n, t, e, c, u) => {
  var d;
  try {
    n.set(t, { at: Date.now(), data: e }), mn(n, c, u);
  } catch (l) {
    (d = console.debug) == null || d.call(console, l);
  }
}, bn = (n) => {
  var t;
  try {
    const e = n == null ? void 0 : n.id;
    if (e != null) return `id:${e}`;
    const c = q(n);
    if (c) return `fp:${c}`;
    const u = String((n == null ? void 0 : n.filename) || (n == null ? void 0 : n.name) || "").trim(), d = String((n == null ? void 0 : n.subfolder) || "").trim(), l = String((n == null ? void 0 : n.source) || (n == null ? void 0 : n.type) || "output").trim().toLowerCase();
    if (u) return `name:${l}:${d}:${u}`;
  } catch (e) {
    (t = console.debug) == null || t.call(console, e);
  }
  return null;
}, wn = (n) => {
  try {
    if (!n || typeof n != "object") return null;
    const t = n == null ? void 0 : n.metadata_raw;
    return t && typeof t == "object" && t.geninfo_status && typeof t.geninfo_status == "object" ? t.geninfo_status : n != null && n.geninfo_status && typeof n.geninfo_status == "object" ? n.geninfo_status : null;
  } catch {
    return null;
  }
}, J = (n, t) => {
  var e, c, u, d;
  try {
    if (!n || typeof n != "object" || !t || typeof t != "object") return;
    try {
      n.geninfo_status = t;
    } catch (l) {
      (e = console.debug) == null || e.call(console, l);
    }
    try {
      const l = n.metadata_raw;
      if (l && typeof l == "object") {
        l.geninfo_status = t, n.metadata_raw = l;
        return;
      }
      if (typeof l == "string") return;
    } catch (l) {
      (c = console.debug) == null || c.call(console, l);
    }
    try {
      n.metadata_raw = { geninfo_status: t };
    } catch (l) {
      (u = console.debug) == null || u.call(console, l);
    }
  } catch (l) {
    (d = console.debug) == null || d.call(console, l);
  }
}, F = (n) => {
  try {
    if (!n || typeof n != "object") return !1;
    if (n.geninfo && typeof n.geninfo == "object" && Object.keys(n.geninfo).length || n.prompt != null || n.workflow != null || n.metadata != null || n.exif != null) return !0;
    const t = n.metadata_raw;
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
}, q = (n) => {
  var c, u;
  const t = (n == null ? void 0 : n.filepath) || (n == null ? void 0 : n.path) || ((c = n == null ? void 0 : n.file_info) == null ? void 0 : c.filepath) || ((u = n == null ? void 0 : n.file_info) == null ? void 0 : u.path) || (n == null ? void 0 : n.filePath) || null;
  if (typeof t != "string") return null;
  const e = t.trim();
  return e || null;
}, hn = (n) => {
  var t, e;
  try {
    if (String((n == null ? void 0 : n.mime) || (n == null ? void 0 : n.mimetype) || (n == null ? void 0 : n.type) || "").toLowerCase().startsWith("video/")) return !0;
    const d = ((e = (t = (q(n) || String((n == null ? void 0 : n.filename) || (n == null ? void 0 : n.name) || "")).split(".").pop()) == null ? void 0 : t.toLowerCase) == null ? void 0 : e.call(t)) || "";
    return ["mp4", "webm", "mov", "mkv", "avi", "m4v", "gif"].includes(d);
  } catch {
    return !1;
  }
}, Q = (n) => {
  if (!n) return null;
  if (typeof n == "object") return n;
  if (typeof n != "string") return null;
  const t = n.trim();
  return t ? L(() => {
    const e = JSON.parse(t);
    return e && typeof e == "object" ? e : null;
  }, null) : null;
}, xn = (n) => {
  var t;
  try {
    if (!hn(n) || n != null && n.geninfo || n != null && n.prompt || n != null && n.workflow || n != null && n.metadata) return;
    const e = Q(n == null ? void 0 : n.metadata_raw) || {};
    if (e.geninfo_status) return;
    if (n != null && n.geninfo_status) {
      e.geninfo_status = n.geninfo_status, n.metadata_raw = e;
      return;
    }
    e.geninfo_status = { kind: "media_pipeline" }, n.metadata_raw = e;
  } catch (e) {
    (t = console.debug) == null || t.call(console, e);
  }
}, kn = (n, t) => {
  var c, u, d, l, o, g, a;
  const e = t && typeof t == "object" ? t : null;
  if (!e) return n;
  try {
    n.prompt = n.prompt ?? e.prompt;
  } catch (p) {
    (c = console.debug) == null || c.call(console, p);
  }
  try {
    n.workflow = n.workflow ?? e.workflow;
  } catch (p) {
    (u = console.debug) == null || u.call(console, p);
  }
  try {
    n.geninfo = n.geninfo ?? e.geninfo;
  } catch (p) {
    (d = console.debug) == null || d.call(console, p);
  }
  try {
    n.geninfo_status = n.geninfo_status ?? e.geninfo_status;
  } catch (p) {
    (l = console.debug) == null || l.call(console, p);
  }
  try {
    n.exif = n.exif ?? e.exif;
  } catch (p) {
    (o = console.debug) == null || o.call(console, p);
  }
  try {
    n.ffprobe = n.ffprobe ?? e.ffprobe;
  } catch (p) {
    (g = console.debug) == null || g.call(console, p);
  }
  try {
    if (n.metadata_raw == null)
      n.metadata_raw = e;
    else {
      const p = Q(n.metadata_raw);
      if (p && typeof p == "object") {
        const b = ["geninfo_status", "workflow", "prompt", "geninfo"];
        for (const v of b)
          p[v] == null && e[v] != null && (p[v] = e[v]);
        n.metadata_raw = p;
      }
    }
  } catch (p) {
    (a = console.debug) == null || a.call(console, p);
  }
  return n;
};
async function jn(n, { getAssetMetadata: t, getFileMetadataScoped: e, metadataCache: c, signal: u } = {}) {
  var b, v, G, T;
  if (!n || typeof n != "object") return n;
  const d = (n == null ? void 0 : n.id) ?? null, l = bn(n);
  let o = n;
  const g = l ? D(V, l, A) : null;
  if (g && typeof g == "object")
    return { ...n, ...g };
  const a = l ? D(W, l, M) : null;
  if (a) {
    try {
      J(o, a);
    } catch (m) {
      (b = console.debug) == null || b.call(console, m);
    }
    return o;
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
    var S, i, r, y, _;
    const m = d != null ? L(() => {
      var f, k;
      return ((k = (f = c == null ? void 0 : c.getCached) == null ? void 0 : f.call(c, d)) == null ? void 0 : k.data) || null;
    }, null) : null;
    m && typeof m == "object" && (o = { ...n, ...m });
    const N = !!(o != null && o.has_generation_data || o != null && o.has_workflow || o != null && o.has_generation || o != null && o.has_generation_info), x = !!(o != null && o.geninfo || o != null && o.prompt || o != null && o.workflow || o != null && o.metadata);
    let h = null;
    if (d != null && (!F(o) || N && !x)) {
      const f = await L(
        () => t == null ? void 0 : t(d, u ? { signal: u } : {}),
        null
      );
      f != null && f.ok && f.data && typeof f.data == "object" ? (o = { ...o, ...f.data }, L(() => {
        var k;
        return (k = c == null ? void 0 : c.setCached) == null ? void 0 : k.call(c, d, f.data);
      })) : f && (f == null ? void 0 : f.code) !== "ABORTED" && (h = {
        kind: "fetch_error",
        stage: "asset",
        code: (f == null ? void 0 : f.code) || "FETCH_ERROR",
        message: (f == null ? void 0 : f.error) || "Failed to load asset metadata"
      });
    }
    if (!F(o))
      try {
        const f = String((o == null ? void 0 : o.source) || (o == null ? void 0 : o.type) || "output").trim().toLowerCase() || "output", k = String(
          (o == null ? void 0 : o.filename) || (o == null ? void 0 : o.name) || ((S = o == null ? void 0 : o.file_info) == null ? void 0 : S.filename) || ""
        ).trim(), Y = String(
          (o == null ? void 0 : o.subfolder) || ((i = o == null ? void 0 : o.file_info) == null ? void 0 : i.subfolder) || ""
        ).trim(), Z = String(
          (o == null ? void 0 : o.root_id) || (o == null ? void 0 : o.rootId) || ((r = o == null ? void 0 : o.file_info) == null ? void 0 : r.root_id) || ""
        ).trim(), s = String(
          (o == null ? void 0 : o.filepath) || (o == null ? void 0 : o.path) || ((y = o == null ? void 0 : o.file_info) == null ? void 0 : y.filepath) || ""
        ).trim();
        if (k) {
          const w = await L(
            () => e == null ? void 0 : e(
              {
                type: f,
                filename: k,
                subfolder: Y,
                root_id: Z,
                filepath: s
              },
              u ? { signal: u } : {}
            ),
            null
          );
          w != null && w.ok && w.data ? o = kn({ ...o }, w.data) : w && (w == null ? void 0 : w.code) !== "ABORTED" && (h = {
            kind: "fetch_error",
            stage: "file_scoped",
            code: (w == null ? void 0 : w.code) || "FETCH_ERROR",
            message: (w == null ? void 0 : w.error) || "Failed to extract file metadata"
          });
        }
      } catch (f) {
        (_ = console.debug) == null || _.call(console, f);
      }
    if (xn(o), !F(o) && h) {
      const f = wn(o);
      f && f.kind === "media_pipeline" || J(o, h);
    }
    return F(o) && l ? H(V, l, o, A, P) : h && l && H(
      W,
      l,
      h,
      M,
      P
    ), o;
  };
  if (l) {
    const m = () => {
      var x;
      try {
        C.delete(l);
      } catch (h) {
        (x = console.debug) == null || x.call(console, h);
      }
    };
    try {
      (G = u == null ? void 0 : u.addEventListener) == null || G.call(u, "abort", m, { once: !0 });
    } catch (x) {
      (T = console.debug) == null || T.call(console, x);
    }
    const N = p().finally(() => {
      var x, h, S;
      try {
        (x = u == null ? void 0 : u.removeEventListener) == null || x.call(u, "abort", m);
      } catch (i) {
        (h = console.debug) == null || h.call(console, i);
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
function Nn({ title: n, asset: t, ui: e } = {}) {
  var l;
  const c = document.createElement("div");
  try {
    const { app: o } = cn(_n, {
      title: n,
      asset: t,
      loading: !!(e != null && e.loading),
      onRetry: typeof (e == null ? void 0 : e.onRetry) == "function" ? e.onRetry : null
    });
    return o.mount(c), c._mjrDispose = () => {
      var g;
      try {
        o.unmount();
      } catch (a) {
        (g = console.debug) == null || g.call(console, a);
      }
    }, c;
  } catch (o) {
    (l = console.debug) == null || l.call(console, o);
  }
  const u = document.createElement("div");
  if (u.style.cssText = "display:flex; flex-direction:column; gap:10px; margin-bottom: 14px;", n) {
    const o = document.createElement("div");
    o.textContent = n, o.style.cssText = "font-size: 12px; font-weight: 600; letter-spacing: 0.02em; color: rgba(255,255,255,0.86);", u.appendChild(o);
  }
  const d = t == null ? void 0 : t.metadata_raw;
  if (d != null) {
    const o = document.createElement("details");
    o.style.cssText = "border: 1px solid rgba(255,255,255,0.10); border-radius: 10px; background: rgba(255,255,255,0.04); overflow: hidden;";
    const g = document.createElement("summary");
    g.textContent = "Raw metadata", g.style.cssText = "cursor: pointer; padding: 10px 12px; color: rgba(255,255,255,0.78); user-select: none;";
    const a = document.createElement("pre");
    a.style.cssText = "margin:0; padding: 10px 12px; max-height: 280px; overflow:auto; font-size: 11px; line-height: 1.35; color: rgba(255,255,255,0.86);";
    let p = typeof d == "string" ? d : JSON.stringify(d, null, 2);
    p.length > 4e4 && (p = `${p.slice(0, 4e4)}
...(truncated)`), a.textContent = p, o.appendChild(g), o.appendChild(a), u.appendChild(o);
  }
  return u;
}
export {
  Nn as buildViewerMetadataBlocks,
  jn as ensureViewerMetadataAsset
};
