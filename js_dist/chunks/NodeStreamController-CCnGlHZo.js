import { c as $, K as q } from "./KnownNodesAdapter-BF_XlWla.js";
const h = [];
let k = !1;
function R() {
  k && (h.sort((e, n) => (n.priority ?? 0) - (e.priority ?? 0)), k = !1);
}
function T(e) {
  if (!(e != null && e.name)) {
    console.warn("[NodeStream] Cannot register adapter without a name");
    return;
  }
  const n = h.findIndex((t) => t.name === e.name);
  n >= 0 && h.splice(n, 1), h.push(e), k = !0, console.debug(
    `[NodeStream] Adapter registered: ${e.name} (priority ${e.priority ?? 0})`
  );
}
function Te() {
  return R(), h.map((e) => ({
    name: e.name,
    priority: e.priority ?? 0,
    description: e.description ?? ""
  }));
}
const Y = /* @__PURE__ */ new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".bmp", ".tiff"]);
function Z(e) {
  if (!e) return !1;
  const n = String(e).lastIndexOf(".");
  return n >= 0 && Y.has(String(e).slice(n).toLowerCase());
}
const J = $({
  name: "default-image",
  priority: 0,
  description: "Standard image output (images: [{filename, subfolder, type}])",
  canHandle(e, n) {
    var r;
    const t = n == null ? void 0 : n.images;
    return Array.isArray(t) && t.length > 0 && !!((r = t[0]) != null && r.filename);
  },
  extractMedia(e, n, t) {
    const r = n == null ? void 0 : n.images;
    if (!Array.isArray(r) || !r.length) return null;
    const i = [];
    for (const o of r)
      o != null && o.filename && i.push({
        filename: o.filename,
        subfolder: o.subfolder || "",
        type: o.type || "output",
        kind: Z(o.filename) ? "image" : void 0,
        _nodeId: t,
        _classType: e
      });
    return i.length ? i : null;
  }
}), Q = /* @__PURE__ */ new Set([".mp4", ".webm", ".mov", ".avi", ".mkv"]);
function D(e) {
  if (!e) return !1;
  const n = String(e).lastIndexOf(".");
  return n >= 0 && Q.has(String(e).slice(n).toLowerCase());
}
function j(e) {
  var r, i;
  const n = e == null ? void 0 : e.gifs;
  if (Array.isArray(n) && n.length && ((r = n[0]) != null && r.filename)) return n;
  const t = e == null ? void 0 : e.videos;
  return Array.isArray(t) && t.length && ((i = t[0]) != null && i.filename) ? t : null;
}
const ee = $({
  name: "video-output",
  priority: 10,
  description: "Video output (gifs/videos: [{filename, subfolder, type}])",
  canHandle(e, n) {
    return !!j(n);
  },
  extractMedia(e, n, t) {
    const r = j(n);
    if (!r) return null;
    const i = [];
    for (const o of r)
      o != null && o.filename && i.push({
        filename: o.filename,
        subfolder: o.subfolder || "",
        type: o.type || "output",
        kind: D(o.filename) ? "video" : "image",
        _nodeId: t,
        _classType: e
      });
    return i.length ? i : null;
  }
}), ne = "__imageops_state", te = "imageops-live-preview";
function re(e) {
  return typeof HTMLCanvasElement < "u" && e instanceof HTMLCanvasElement;
}
function ie(e) {
  return re(e) && Number(e.width) > 0 && Number(e.height) > 0;
}
function oe(e) {
  let n = 2166136261;
  const t = String(e || "");
  for (let r = 0; r < t.length; r += 1)
    n ^= t.charCodeAt(r), n = Math.imul(n, 16777619);
  return (n >>> 0).toString(16);
}
function le(e, n) {
  const t = Number(e == null ? void 0 : e.previewSourceWidth) || 0, r = Number(e == null ? void 0 : e.previewSourceHeight) || 0, i = Number(n == null ? void 0 : n.width) || 0, o = Number(n == null ? void 0 : n.height) || 0;
  if (t <= 0 || r <= 0 || i <= 0 || o <= 0) return null;
  const l = Number(e == null ? void 0 : e.previewZoom), u = Number(e == null ? void 0 : e.previewPanX) || 0, s = Number(e == null ? void 0 : e.previewPanY) || 0;
  if (Number.isFinite(l) && Math.abs(l - 1) > 1e-3 || u !== 0 || s !== 0)
    return null;
  const a = Math.min(i / t, o / r), x = Math.max(1, Math.round(t * a)), M = Math.max(1, Math.round(r * a)), P = Math.max(0, Math.round((i - x) / 2)), W = Math.max(0, Math.round((o - M) / 2));
  return P === 0 && W === 0 && x === i && M === o ? null : { dx: P, dy: W, w: x, h: M };
}
function ue(e, n, t, r) {
  const i = r ? `${r.dx},${r.dy},${r.w}x${r.h}` : "full", o = [
    String((e == null ? void 0 : e.id) ?? ""),
    String((n == null ? void 0 : n.lastKey) ?? ""),
    String((n == null ? void 0 : n.lastRenderTick) ?? ""),
    String(n != null && n.nativeDirty ? 1 : 0),
    `${Number(t == null ? void 0 : t.width) || 0}x${Number(t == null ? void 0 : t.height) || 0}`,
    i
  ];
  return oe(o.join("|"));
}
function se(e, n) {
  const t = document.createElement("canvas");
  t.width = n.w, t.height = n.h;
  const r = t.getContext("2d");
  return r ? (r.drawImage(e, n.dx, n.dy, n.w, n.h, 0, 0, n.w, n.h), t.toDataURL("image/png")) : "";
}
const B = /* @__PURE__ */ new WeakMap(), H = /* @__PURE__ */ new WeakMap();
function ce(e) {
  if (!e) return null;
  const n = e[ne], t = n == null ? void 0 : n.canvas;
  if (!ie(t)) return null;
  const r = le(n, t), i = ue(e, n, t, r);
  let o = B.get(e) === i ? H.get(e) : "";
  if (!o) {
    try {
      o = r ? se(t, r) : t.toDataURL("image/png");
    } catch (a) {
      return console.warn("[NodeStream] ImageOps canvas export failed:", a), null;
    }
    if (!o) return null;
    B.set(e, i), H.set(e, o);
  }
  const l = r ? r.w : Number(t.width) || void 0, u = r ? r.h : Number(t.height) || void 0, s = e.comfyClass || e.type || "ImageOps";
  return {
    filename: `imageops_${e.id ?? "node"}_${i}.png`,
    subfolder: "",
    type: "temp",
    kind: "image",
    url: o,
    width: l,
    height: u,
    _nodeId: String(e.id ?? ""),
    _classType: s,
    _source: te,
    _signature: i
  };
}
T(J), T(q), T(ee);
let f = "selected", S = null, g = null, d = !1, w = null, _ = null, c = null, p = null, C = null, E = null;
const F = /* @__PURE__ */ new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".bmp", ".tiff"]), V = /* @__PURE__ */ new Set([".mp4", ".webm", ".mov", ".avi", ".mkv"]), ae = 12, fe = 96;
function y(e) {
  return (e == null ? void 0 : e.comfyClass) || (e == null ? void 0 : e.type) || null;
}
function L(e) {
  try {
    const n = new URL(e, window.location.href), t = n.searchParams.get("filename") || "";
    return t ? {
      filename: t,
      subfolder: n.searchParams.get("subfolder") || "",
      type: n.searchParams.get("type") || "output"
    } : null;
  } catch {
    return null;
  }
}
function de(e) {
  if (e == null || typeof e != "string") return null;
  const n = e.trim().replace(/\\/g, "/");
  if (!n) return null;
  const t = n.lastIndexOf("/");
  return {
    filename: t >= 0 ? n.slice(t + 1) : n,
    subfolder: t >= 0 ? n.slice(0, t) : ""
  };
}
function X(e) {
  if (!e) return "";
  const n = String(e).lastIndexOf(".");
  return n >= 0 ? String(e).slice(n).toLowerCase() : "";
}
function G(e, n = "") {
  const t = X(n);
  return V.has(t) ? "video" : F.has(t) ? "image" : String(y(e) || "").toLowerCase().includes("video") ? "video" : "image";
}
function N(e, n, t) {
  return {
    ...n,
    kind: (n == null ? void 0 : n.kind) || G(e, n == null ? void 0 : n.filename),
    _nodeId: String((e == null ? void 0 : e.id) ?? ""),
    _classType: y(e) || "",
    _source: t
  };
}
function K() {
  var n, t;
  const e = ((n = c == null ? void 0 : c.canvas) == null ? void 0 : n.selected_nodes) ?? ((t = c == null ? void 0 : c.canvas) == null ? void 0 : t.selectedNodes) ?? null;
  return e ? Array.isArray(e) ? e.filter(Boolean) : e instanceof Map ? Array.from(e.values()).filter(Boolean) : typeof e == "object" ? Object.values(e).filter(Boolean) : [] : [];
}
function b() {
  var e;
  return (c == null ? void 0 : c.graph) ?? ((e = c == null ? void 0 : c.canvas) == null ? void 0 : e.graph) ?? null;
}
function U(e) {
  var t;
  const n = b();
  if (e == null || !n) return null;
  try {
    return ((t = n.getNodeById) == null ? void 0 : t.call(n, Number(e))) || null;
  } catch {
    return null;
  }
}
function ge() {
  const e = b();
  return e ? Array.isArray(e._nodes) ? e._nodes.filter(Boolean) : e._nodes_by_id instanceof Map ? Array.from(e._nodes_by_id.values()).filter(Boolean) : e._nodes_by_id && typeof e._nodes_by_id == "object" ? Object.values(e._nodes_by_id).filter(Boolean) : [] : [];
}
function me(e) {
  if (e == null) return null;
  const n = String(e);
  for (const t of ge())
    if (Array.isArray(t == null ? void 0 : t.inputs)) {
      for (const r of t.inputs)
        if ((r == null ? void 0 : r.link) != null && String(r.link) === n)
          return String(t.id ?? "");
    }
  return null;
}
function pe(e) {
  if (e == null) return null;
  const n = b(), t = (n == null ? void 0 : n.links) ?? (n == null ? void 0 : n._links) ?? null;
  if (!t) return null;
  const r = Number(e), i = String(e);
  if (t instanceof Map)
    return t.get(e) || t.get(r) || t.get(i) || null;
  if (Array.isArray(t)) {
    const o = t[r];
    if (o) return o;
    for (const l of t) {
      if (!l) continue;
      if (Array.isArray(l) && String(l[0]) === i) return l;
      const u = l.id ?? l.link_id ?? l.linkId ?? null;
      if (u != null && String(u) === i) return l;
    }
    return null;
  }
  return typeof t == "object" && (t[e] || t[r] || t[i]) || null;
}
function ye(e) {
  const n = pe(e);
  if (Array.isArray(n) && n.length >= 4)
    return String(n[3] ?? "");
  if (n && typeof n == "object") {
    const t = n.target_id ?? n.targetId ?? n.to ?? null;
    if (t != null)
      return String(t);
  }
  return me(e);
}
function he(e) {
  if (!Array.isArray(e == null ? void 0 : e.outputs)) return [];
  const n = [];
  for (const t of e.outputs) {
    const r = t == null ? void 0 : t.links;
    if (Array.isArray(r))
      for (const i of r)
        i != null && n.push(i);
    else r != null && n.push(r);
    (t == null ? void 0 : t.link) != null && n.push(t.link);
  }
  return Array.from(new Set(n.map((t) => String(t))));
}
function _e(e) {
  const n = [], t = /* @__PURE__ */ new Set();
  for (const r of he(e)) {
    const i = ye(r);
    if (!i || t.has(i)) continue;
    const o = U(i);
    o && (t.add(i), n.push(o));
  }
  return n;
}
function I(e) {
  const n = e ? String(e.id ?? "") : "", t = e && y(e) || "";
  _ == null || _(n, t);
}
function v() {
  const e = K(), n = e[0] || null, t = n ? String(n.id ?? "") : null;
  return t !== g ? (g = t, I(n)) : t || (g = null), e;
}
function Se(e) {
  var i, o;
  if (!e) return null;
  const n = e.imgs;
  if (!Array.isArray(n) || n.length === 0) return null;
  const t = ((i = n[n.length - 1]) == null ? void 0 : i.src) || ((o = n[0]) == null ? void 0 : o.src);
  if (!t) return null;
  const r = L(t);
  return r != null && r.filename ? N(e, { ...r, kind: "image" }, "canvas") : null;
}
function we(e) {
  var n, t;
  if (!e || !Array.isArray(e.widgets)) return null;
  for (const r of e.widgets) {
    const i = r == null ? void 0 : r.element;
    if (!i) continue;
    const o = typeof HTMLVideoElement < "u" && i instanceof HTMLVideoElement ? i : (n = i.querySelector) == null ? void 0 : n.call(i, "video");
    if (o != null && o.src) {
      const s = L(o.src);
      if (s != null && s.filename)
        return N(e, { ...s, kind: "video" }, "widget");
    }
    const l = typeof HTMLImageElement < "u" && i instanceof HTMLImageElement ? i : (t = i.querySelector) == null ? void 0 : t.call(i, "img");
    if (!(l != null && l.src)) continue;
    const u = L(l.src);
    if (u != null && u.filename)
      return N(e, { ...u, kind: "image" }, "widget");
  }
  return null;
}
function Ne(e) {
  var u;
  if (!e || !Array.isArray(e.widgets) || !e.widgets.length) return null;
  const n = String(y(e) || "").toLowerCase(), t = (u = e.widgets[0]) == null ? void 0 : u.value;
  if (typeof t != "string") return null;
  const r = de(t);
  if (!(r != null && r.filename)) return null;
  const i = X(r.filename), o = F.has(i) || V.has(i), l = /(load|upload|loader|fromurl|folder|input)/.test(n);
  return !o && !l ? null : N(
    e,
    {
      ...r,
      type: "input",
      kind: G(e, r.filename)
    },
    "widget-value"
  );
}
function Ie(e) {
  return ce(e) || Se(e) || we(e) || Ne(e);
}
function Ae(e) {
  if (!e) return null;
  const n = String(e.id ?? ""), t = y(e) || "", r = [{ node: e, depth: 0 }], i = new Set(n ? [n] : []);
  let o = 0;
  for (; r.length > 0 && o < fe; ) {
    const l = r.shift();
    if (!(l != null && l.node)) continue;
    o += 1;
    const u = Ie(l.node);
    if (u) {
      const s = u._nodeId || String(l.node.id ?? ""), a = u._classType || y(l.node) || "";
      return {
        ...u,
        _nodeId: n || s,
        _classType: t || a,
        _previewNodeId: s,
        _previewClassType: a,
        _source: s === n ? u._source || "canvas" : "graph-downstream"
      };
    }
    if (!(l.depth >= ae))
      for (const s of _e(l.node)) {
        const a = String((s == null ? void 0 : s.id) ?? "");
        !a || i.has(a) || (i.add(a), r.push({ node: s, depth: l.depth + 1 }));
      }
  }
  return null;
}
function be(e) {
  return e ? [
    e._nodeId || "",
    e._signature || "",
    e.kind || "",
    e.type || "",
    e.subfolder || "",
    e.filename || "",
    e.url || ""
  ].join("|") : "";
}
function m() {
  C = null, E = null;
}
function ve() {
  return f === "pinned" ? U(S) : K()[0] || null;
}
function A({ force: e = !1 } = {}) {
  if (!d || !w || !b()) return;
  const n = ve(), t = n ? String(n.id ?? "") : null;
  if (!t) {
    I(null), m();
    return;
  }
  f === "pinned" && I(n);
  const r = Ae(n);
  if (!r) {
    m();
    return;
  }
  const i = be(r);
  !e && !(t !== E) && i === C || (E = t, C = i, w(r));
}
function O() {
  const e = g;
  v();
  const n = g !== e;
  if (!d) {
    m();
    return;
  }
  A({ force: f !== "pinned" && n });
}
function xe() {
  p || (p = setInterval(O, 150), O());
}
function z() {
  p && (clearInterval(p), p = null), m();
}
function ke(e, n) {
}
function Ce({ app: e, onOutput: n, onStatus: t } = {}) {
  w = n || null, _ = t || null, c = e || null, e && v(), console.debug("[NodeStream] Controller initialized (selection-only preview mode)");
}
function Ee(e) {
  if (d = !!e, !d) {
    g = null, z();
    return;
  }
  if (m(), v(), p) {
    O();
    return;
  }
  xe();
}
function Le() {
  return d;
}
function Oe(e) {
  const n = e === "pinned" ? "pinned" : "selected";
  f !== n && (f = n, m(), d && A({ force: !0 }));
}
function Pe() {
  return f;
}
function We(e) {
  if (e == null) {
    S = null, f === "pinned" && (f = "selected"), m(), d && A({ force: !0 });
    return;
  }
  S = String(e), f = "pinned", m(), d && A({ force: !0 });
}
function je() {
  return S;
}
function Be() {
  return v(), g;
}
function He(e) {
  d = !1, g = null, S = null, I(null), w = null, _ = null, c = null, z(), console.debug("[NodeStream] Controller torn down");
}
export {
  Le as getNodeStreamActive,
  je as getPinnedNodeId,
  Be as getSelectedNodeId,
  Pe as getWatchMode,
  Ce as initNodeStream,
  Te as listAdapters,
  ke as onNodeOutputs,
  We as pinNode,
  Ee as setNodeStreamActive,
  Oe as setWatchMode,
  He as teardownNodeStream
};
