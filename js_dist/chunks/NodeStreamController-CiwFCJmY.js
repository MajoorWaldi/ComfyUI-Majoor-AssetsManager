import { createAdapter as B } from "./BaseAdapter-Dv004G6c.js";
import { KnownNodesAdapter as K } from "./KnownNodesAdapter-_fJO77oP.js";
const _ = [];
let M = !1;
function z() {
  M && (_.sort((e, n) => (n.priority ?? 0) - (e.priority ?? 0)), M = !1);
}
function x(e) {
  if (!(e != null && e.name)) {
    console.warn("[NodeStream] Cannot register adapter without a name");
    return;
  }
  const n = _.findIndex((t) => t.name === e.name);
  n >= 0 && _.splice(n, 1), _.push(e), M = !0, console.debug(
    `[NodeStream] Adapter registered: ${e.name} (priority ${e.priority ?? 0})`
  );
}
function Me() {
  return z(), _.map((e) => ({
    name: e.name,
    priority: e.priority ?? 0,
    description: e.description ?? ""
  }));
}
const q = /* @__PURE__ */ new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".bmp", ".tiff"]);
function Y(e) {
  if (!e) return !1;
  const n = String(e).lastIndexOf(".");
  return n >= 0 && q.has(String(e).slice(n).toLowerCase());
}
const Z = B({
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
        kind: Y(o.filename) ? "image" : void 0,
        _nodeId: t,
        _classType: e
      });
    return i.length ? i : null;
  }
}), J = /* @__PURE__ */ new Set([".mp4", ".webm", ".mov", ".avi", ".mkv"]);
function Q(e) {
  if (!e) return !1;
  const n = String(e).lastIndexOf(".");
  return n >= 0 && J.has(String(e).slice(n).toLowerCase());
}
function P(e) {
  var r, i;
  const n = e == null ? void 0 : e.gifs;
  if (Array.isArray(n) && n.length && ((r = n[0]) != null && r.filename)) return n;
  const t = e == null ? void 0 : e.videos;
  return Array.isArray(t) && t.length && ((i = t[0]) != null && i.filename) ? t : null;
}
const R = B({
  name: "video-output",
  priority: 10,
  description: "Video output (gifs/videos: [{filename, subfolder, type}])",
  canHandle(e, n) {
    return !!P(n);
  },
  extractMedia(e, n, t) {
    const r = P(n);
    if (!r) return null;
    const i = [];
    for (const o of r)
      o != null && o.filename && i.push({
        filename: o.filename,
        subfolder: o.subfolder || "",
        type: o.type || "output",
        kind: Q(o.filename) ? "video" : "image",
        _nodeId: t,
        _classType: e
      });
    return i.length ? i : null;
  }
}), D = "__imageops_state", ee = "imageops-live-preview";
function ne(e) {
  return typeof HTMLCanvasElement < "u" && e instanceof HTMLCanvasElement;
}
function te(e) {
  return ne(e) && Number(e.width) > 0 && Number(e.height) > 0;
}
function re(e) {
  let n = 2166136261;
  const t = String(e || "");
  for (let r = 0; r < t.length; r += 1)
    n ^= t.charCodeAt(r), n = Math.imul(n, 16777619);
  return (n >>> 0).toString(16);
}
function ie(e, n) {
  const t = Number(e == null ? void 0 : e.previewSourceWidth) || 0, r = Number(e == null ? void 0 : e.previewSourceHeight) || 0, i = Number(n == null ? void 0 : n.width) || 0, o = Number(n == null ? void 0 : n.height) || 0;
  if (t <= 0 || r <= 0 || i <= 0 || o <= 0) return null;
  const u = Number(e == null ? void 0 : e.previewZoom), l = Number(e == null ? void 0 : e.previewPanX) || 0, c = Number(e == null ? void 0 : e.previewPanY) || 0;
  if (Number.isFinite(u) && Math.abs(u - 1) > 1e-3 || l !== 0 || c !== 0)
    return null;
  const f = Math.min(i / t, o / r), b = Math.max(1, Math.round(t * f)), v = Math.max(1, Math.round(r * f)), L = Math.max(0, Math.round((i - b) / 2)), O = Math.max(0, Math.round((o - v) / 2));
  return L === 0 && O === 0 && b === i && v === o ? null : { dx: L, dy: O, w: b, h: v };
}
function oe(e, n, t, r) {
  const i = r ? `${r.dx},${r.dy},${r.w}x${r.h}` : "full", o = [
    String((e == null ? void 0 : e.id) ?? ""),
    String((n == null ? void 0 : n.lastKey) ?? ""),
    String((n == null ? void 0 : n.lastRenderTick) ?? ""),
    String(n != null && n.nativeDirty ? 1 : 0),
    `${Number(t == null ? void 0 : t.width) || 0}x${Number(t == null ? void 0 : t.height) || 0}`,
    i
  ];
  return re(o.join("|"));
}
function le(e, n) {
  const t = document.createElement("canvas");
  t.width = n.w, t.height = n.h;
  const r = t.getContext("2d");
  return r ? (r.drawImage(e, n.dx, n.dy, n.w, n.h, 0, 0, n.w, n.h), t.toDataURL("image/png")) : "";
}
const W = /* @__PURE__ */ new WeakMap(), j = /* @__PURE__ */ new WeakMap();
function ue(e) {
  if (!e) return null;
  const n = e[D], t = n == null ? void 0 : n.canvas;
  if (!te(t)) return null;
  const r = ie(n, t), i = oe(e, n, t, r);
  let o = W.get(e) === i ? j.get(e) : "";
  if (!o) {
    try {
      o = r ? le(t, r) : t.toDataURL("image/png");
    } catch (f) {
      return console.warn("[NodeStream] ImageOps canvas export failed:", f), null;
    }
    if (!o) return null;
    W.set(e, i), j.set(e, o);
  }
  const u = r ? r.w : Number(t.width) || void 0, l = r ? r.h : Number(t.height) || void 0, c = e.comfyClass || e.type || "ImageOps";
  return {
    filename: `imageops_${e.id ?? "node"}_${i}.png`,
    subfolder: "",
    type: "temp",
    kind: "image",
    url: o,
    width: u,
    height: l,
    _nodeId: String(e.id ?? ""),
    _classType: c,
    _source: ee,
    _signature: i
  };
}
x(Z), x(K), x(R);
let d = "selected", w = null, g = null, a = !1, S = null, m = null, s = null, p = null, T = null, k = null;
const H = /* @__PURE__ */ new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".bmp", ".tiff"]), $ = /* @__PURE__ */ new Set([".mp4", ".webm", ".mov", ".avi", ".mkv"]), se = 12, ce = 96;
function y(e) {
  return (e == null ? void 0 : e.comfyClass) || (e == null ? void 0 : e.type) || null;
}
function E(e) {
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
function fe(e) {
  if (e == null || typeof e != "string") return null;
  const n = e.trim().replace(/\\/g, "/");
  if (!n) return null;
  const t = n.lastIndexOf("/");
  return {
    filename: t >= 0 ? n.slice(t + 1) : n,
    subfolder: t >= 0 ? n.slice(0, t) : ""
  };
}
function F(e) {
  if (!e) return "";
  const n = String(e).lastIndexOf(".");
  return n >= 0 ? String(e).slice(n).toLowerCase() : "";
}
function V(e, n = "") {
  const t = F(n);
  return $.has(t) ? "video" : H.has(t) ? "image" : String(y(e) || "").toLowerCase().includes("video") ? "video" : "image";
}
function N(e, n, t) {
  return {
    ...n,
    kind: (n == null ? void 0 : n.kind) || V(e, n == null ? void 0 : n.filename),
    _nodeId: String((e == null ? void 0 : e.id) ?? ""),
    _classType: y(e) || "",
    _source: t
  };
}
function X() {
  var n, t;
  const e = ((n = s == null ? void 0 : s.canvas) == null ? void 0 : n.selected_nodes) ?? ((t = s == null ? void 0 : s.canvas) == null ? void 0 : t.selectedNodes) ?? null;
  return e ? Array.isArray(e) ? e.filter(Boolean) : e instanceof Map ? Array.from(e.values()).filter(Boolean) : typeof e == "object" ? Object.values(e).filter(Boolean) : [] : [];
}
function U(e) {
  if (e == null || !(s != null && s.graph)) return null;
  try {
    return s.graph.getNodeById(Number(e)) || null;
  } catch {
    return null;
  }
}
function ae() {
  const e = s == null ? void 0 : s.graph;
  return e ? Array.isArray(e._nodes) ? e._nodes.filter(Boolean) : e._nodes_by_id instanceof Map ? Array.from(e._nodes_by_id.values()).filter(Boolean) : e._nodes_by_id && typeof e._nodes_by_id == "object" ? Object.values(e._nodes_by_id).filter(Boolean) : [] : [];
}
function de(e) {
  if (e == null) return null;
  const n = String(e);
  for (const t of ae())
    if (Array.isArray(t == null ? void 0 : t.inputs)) {
      for (const r of t.inputs)
        if ((r == null ? void 0 : r.link) != null && String(r.link) === n)
          return String(t.id ?? "");
    }
  return null;
}
function ge(e) {
  var i, o;
  if (e == null) return null;
  const n = ((i = s == null ? void 0 : s.graph) == null ? void 0 : i.links) ?? ((o = s == null ? void 0 : s.graph) == null ? void 0 : o._links) ?? null;
  if (!n) return null;
  const t = Number(e), r = String(e);
  if (n instanceof Map)
    return n.get(e) || n.get(t) || n.get(r) || null;
  if (Array.isArray(n)) {
    const u = n[t];
    if (u) return u;
    for (const l of n) {
      if (!l) continue;
      if (Array.isArray(l) && String(l[0]) === r) return l;
      const c = l.id ?? l.link_id ?? l.linkId ?? null;
      if (c != null && String(c) === r) return l;
    }
    return null;
  }
  return typeof n == "object" && (n[e] || n[t] || n[r]) || null;
}
function me(e) {
  const n = ge(e);
  if (Array.isArray(n) && n.length >= 4)
    return String(n[3] ?? "");
  if (n && typeof n == "object") {
    const t = n.target_id ?? n.targetId ?? n.to ?? null;
    if (t != null)
      return String(t);
  }
  return de(e);
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
function ye(e) {
  const n = [], t = /* @__PURE__ */ new Set();
  for (const r of he(e)) {
    const i = me(r);
    if (!i || t.has(i)) continue;
    const o = U(i);
    o && (t.add(i), n.push(o));
  }
  return n;
}
function A() {
  const e = X(), n = e[0] || null, t = n ? String(n.id ?? "") : null;
  return t !== g ? (g = t, t && (m == null || m(t, y(n) || ""))) : t || (g = null), e;
}
function pe(e) {
  var i, o;
  if (!e) return null;
  const n = e.imgs;
  if (!Array.isArray(n) || n.length === 0) return null;
  const t = ((i = n[n.length - 1]) == null ? void 0 : i.src) || ((o = n[0]) == null ? void 0 : o.src);
  if (!t) return null;
  const r = E(t);
  return r != null && r.filename ? N(e, { ...r, kind: "image" }, "canvas") : null;
}
function _e(e) {
  var n, t;
  if (!e || !Array.isArray(e.widgets)) return null;
  for (const r of e.widgets) {
    const i = r == null ? void 0 : r.element;
    if (!i) continue;
    const o = typeof HTMLVideoElement < "u" && i instanceof HTMLVideoElement ? i : (n = i.querySelector) == null ? void 0 : n.call(i, "video");
    if (o != null && o.src) {
      const c = E(o.src);
      if (c != null && c.filename)
        return N(e, { ...c, kind: "video" }, "widget");
    }
    const u = typeof HTMLImageElement < "u" && i instanceof HTMLImageElement ? i : (t = i.querySelector) == null ? void 0 : t.call(i, "img");
    if (!(u != null && u.src)) continue;
    const l = E(u.src);
    if (l != null && l.filename)
      return N(e, { ...l, kind: "image" }, "widget");
  }
  return null;
}
function we(e) {
  var l;
  if (!e || !Array.isArray(e.widgets) || !e.widgets.length) return null;
  const n = String(y(e) || "").toLowerCase(), t = (l = e.widgets[0]) == null ? void 0 : l.value;
  if (typeof t != "string") return null;
  const r = fe(t);
  if (!(r != null && r.filename)) return null;
  const i = F(r.filename), o = H.has(i) || $.has(i), u = /(load|upload|loader|fromurl|folder|input)/.test(n);
  return !o && !u ? null : N(
    e,
    {
      ...r,
      type: "input",
      kind: V(e, r.filename)
    },
    "widget-value"
  );
}
function Se(e) {
  return ue(e) || pe(e) || _e(e) || we(e);
}
function Ne(e) {
  if (!e) return null;
  const n = String(e.id ?? ""), t = y(e) || "", r = [{ node: e, depth: 0 }], i = new Set(n ? [n] : []);
  let o = 0;
  for (; r.length > 0 && o < ce; ) {
    const u = r.shift();
    if (!(u != null && u.node)) continue;
    o += 1;
    const l = Se(u.node);
    if (l) {
      const c = l._nodeId || String(u.node.id ?? ""), f = l._classType || y(u.node) || "";
      return {
        ...l,
        _nodeId: n || c,
        _classType: t || f,
        _previewNodeId: c,
        _previewClassType: f,
        _source: c === n ? l._source || "canvas" : "graph-downstream"
      };
    }
    if (!(u.depth >= se))
      for (const c of ye(u.node)) {
        const f = String((c == null ? void 0 : c.id) ?? "");
        !f || i.has(f) || (i.add(f), r.push({ node: c, depth: u.depth + 1 }));
      }
  }
  return null;
}
function Ie(e) {
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
function h() {
  T = null, k = null;
}
function Ae() {
  return d === "pinned" ? U(w) : X()[0] || null;
}
function I({ force: e = !1 } = {}) {
  if (!a || !S || !(s != null && s.graph)) return;
  const n = Ae(), t = n ? String(n.id ?? "") : null;
  if (!t) {
    h();
    return;
  }
  d === "pinned" && (m == null || m(t, y(n) || ""));
  const r = Ne(n);
  if (!r) {
    h();
    return;
  }
  const i = Ie(r);
  !e && !(t !== k) && i === T || (k = t, T = i, S(r));
}
function C() {
  const e = g;
  A();
  const n = g !== e;
  if (!a) {
    h();
    return;
  }
  I({ force: d !== "pinned" && n });
}
function be() {
  p || (p = setInterval(C, 150), C());
}
function G() {
  p && (clearInterval(p), p = null), h();
}
function Te(e, n) {
}
function ke({ app: e, onOutput: n, onStatus: t } = {}) {
  S = n || null, m = t || null, s = e || null, e && A(), console.debug("[NodeStream] Controller initialized (selection-only preview mode)");
}
function Ee(e) {
  if (a = !!e, !a) {
    g = null, G();
    return;
  }
  if (h(), A(), p) {
    C();
    return;
  }
  be();
}
function Ce() {
  return a;
}
function Le(e) {
  (e === "selected" || e === "pinned" || e === "all") && (d = e, h(), a && I({ force: !0 }));
}
function Oe() {
  return d;
}
function Pe(e) {
  if (e == null) {
    w = null, d === "pinned" && (d = "selected"), h(), a && I({ force: !0 });
    return;
  }
  w = String(e), d = "pinned", h(), a && I({ force: !0 });
}
function We() {
  return w;
}
function je() {
  return A(), g;
}
function Be(e) {
  a = !1, g = null, w = null, S = null, m = null, s = null, G(), console.debug("[NodeStream] Controller torn down");
}
export {
  Ce as getNodeStreamActive,
  We as getPinnedNodeId,
  je as getSelectedNodeId,
  Oe as getWatchMode,
  ke as initNodeStream,
  Me as listAdapters,
  Te as onNodeOutputs,
  Pe as pinNode,
  x as registerAdapter,
  Ee as setNodeStreamActive,
  Le as setWatchMode,
  Be as teardownNodeStream
};
