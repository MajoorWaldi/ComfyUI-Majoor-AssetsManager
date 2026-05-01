import { createAdapter as H } from "./BaseAdapter-Dv004G6c.js";
import { KnownNodesAdapter as z } from "./KnownNodesAdapter-_fJO77oP.js";
const _ = [];
let T = !1;
function q() {
  T && (_.sort((e, n) => (n.priority ?? 0) - (e.priority ?? 0)), T = !1);
}
function M(e) {
  if (!(e != null && e.name)) {
    console.warn("[NodeStream] Cannot register adapter without a name");
    return;
  }
  const n = _.findIndex((t) => t.name === e.name);
  n >= 0 && _.splice(n, 1), _.push(e), T = !0, console.debug(
    `[NodeStream] Adapter registered: ${e.name} (priority ${e.priority ?? 0})`
  );
}
function Te() {
  return q(), _.map((e) => ({
    name: e.name,
    priority: e.priority ?? 0,
    description: e.description ?? ""
  }));
}
const R = /* @__PURE__ */ new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".bmp", ".tiff"]);
function Y(e) {
  if (!e) return !1;
  const n = String(e).lastIndexOf(".");
  return n >= 0 && R.has(String(e).slice(n).toLowerCase());
}
const Z = H({
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
function W(e) {
  var r, i;
  const n = e == null ? void 0 : e.gifs;
  if (Array.isArray(n) && n.length && ((r = n[0]) != null && r.filename)) return n;
  const t = e == null ? void 0 : e.videos;
  return Array.isArray(t) && t.length && ((i = t[0]) != null && i.filename) ? t : null;
}
const D = H({
  name: "video-output",
  priority: 10,
  description: "Video output (gifs/videos: [{filename, subfolder, type}])",
  canHandle(e, n) {
    return !!W(n);
  },
  extractMedia(e, n, t) {
    const r = W(n);
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
}), ee = "__imageops_state", ne = "imageops-live-preview";
function te(e) {
  return typeof HTMLCanvasElement < "u" && e instanceof HTMLCanvasElement;
}
function re(e) {
  return te(e) && Number(e.width) > 0 && Number(e.height) > 0;
}
function ie(e) {
  let n = 2166136261;
  const t = String(e || "");
  for (let r = 0; r < t.length; r += 1)
    n ^= t.charCodeAt(r), n = Math.imul(n, 16777619);
  return (n >>> 0).toString(16);
}
function oe(e, n) {
  const t = Number(e == null ? void 0 : e.previewSourceWidth) || 0, r = Number(e == null ? void 0 : e.previewSourceHeight) || 0, i = Number(n == null ? void 0 : n.width) || 0, o = Number(n == null ? void 0 : n.height) || 0;
  if (t <= 0 || r <= 0 || i <= 0 || o <= 0) return null;
  const l = Number(e == null ? void 0 : e.previewZoom), u = Number(e == null ? void 0 : e.previewPanX) || 0, s = Number(e == null ? void 0 : e.previewPanY) || 0;
  if (Number.isFinite(l) && Math.abs(l - 1) > 1e-3 || u !== 0 || s !== 0)
    return null;
  const f = Math.min(i / t, o / r), b = Math.max(1, Math.round(t * f)), x = Math.max(1, Math.round(r * f)), O = Math.max(0, Math.round((i - b) / 2)), P = Math.max(0, Math.round((o - x) / 2));
  return O === 0 && P === 0 && b === i && x === o ? null : { dx: O, dy: P, w: b, h: x };
}
function le(e, n, t, r) {
  const i = r ? `${r.dx},${r.dy},${r.w}x${r.h}` : "full", o = [
    String((e == null ? void 0 : e.id) ?? ""),
    String((n == null ? void 0 : n.lastKey) ?? ""),
    String((n == null ? void 0 : n.lastRenderTick) ?? ""),
    String(n != null && n.nativeDirty ? 1 : 0),
    `${Number(t == null ? void 0 : t.width) || 0}x${Number(t == null ? void 0 : t.height) || 0}`,
    i
  ];
  return ie(o.join("|"));
}
function ue(e, n) {
  const t = document.createElement("canvas");
  t.width = n.w, t.height = n.h;
  const r = t.getContext("2d");
  return r ? (r.drawImage(e, n.dx, n.dy, n.w, n.h, 0, 0, n.w, n.h), t.toDataURL("image/png")) : "";
}
const j = /* @__PURE__ */ new WeakMap(), B = /* @__PURE__ */ new WeakMap();
function se(e) {
  if (!e) return null;
  const n = e[ee], t = n == null ? void 0 : n.canvas;
  if (!re(t)) return null;
  const r = oe(n, t), i = le(e, n, t, r);
  let o = j.get(e) === i ? B.get(e) : "";
  if (!o) {
    try {
      o = r ? ue(t, r) : t.toDataURL("image/png");
    } catch (f) {
      return console.warn("[NodeStream] ImageOps canvas export failed:", f), null;
    }
    if (!o) return null;
    j.set(e, i), B.set(e, o);
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
    _source: ne,
    _signature: i
  };
}
M(Z), M(z), M(D);
let d = "selected", w = null, g = null, a = !1, S = null, m = null, c = null, h = null, k = null, E = null;
const $ = /* @__PURE__ */ new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".bmp", ".tiff"]), F = /* @__PURE__ */ new Set([".mp4", ".webm", ".mov", ".avi", ".mkv"]), ce = 12, fe = 96;
function y(e) {
  return (e == null ? void 0 : e.comfyClass) || (e == null ? void 0 : e.type) || null;
}
function C(e) {
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
function ae(e) {
  if (e == null || typeof e != "string") return null;
  const n = e.trim().replace(/\\/g, "/");
  if (!n) return null;
  const t = n.lastIndexOf("/");
  return {
    filename: t >= 0 ? n.slice(t + 1) : n,
    subfolder: t >= 0 ? n.slice(0, t) : ""
  };
}
function V(e) {
  if (!e) return "";
  const n = String(e).lastIndexOf(".");
  return n >= 0 ? String(e).slice(n).toLowerCase() : "";
}
function X(e, n = "") {
  const t = V(n);
  return F.has(t) ? "video" : $.has(t) ? "image" : String(y(e) || "").toLowerCase().includes("video") ? "video" : "image";
}
function N(e, n, t) {
  return {
    ...n,
    kind: (n == null ? void 0 : n.kind) || X(e, n == null ? void 0 : n.filename),
    _nodeId: String((e == null ? void 0 : e.id) ?? ""),
    _classType: y(e) || "",
    _source: t
  };
}
function G() {
  var n, t;
  const e = ((n = c == null ? void 0 : c.canvas) == null ? void 0 : n.selected_nodes) ?? ((t = c == null ? void 0 : c.canvas) == null ? void 0 : t.selectedNodes) ?? null;
  return e ? Array.isArray(e) ? e.filter(Boolean) : e instanceof Map ? Array.from(e.values()).filter(Boolean) : typeof e == "object" ? Object.values(e).filter(Boolean) : [] : [];
}
function A() {
  var e;
  return (c == null ? void 0 : c.graph) ?? ((e = c == null ? void 0 : c.canvas) == null ? void 0 : e.graph) ?? null;
}
function U(e) {
  var t;
  const n = A();
  if (e == null || !n) return null;
  try {
    return ((t = n.getNodeById) == null ? void 0 : t.call(n, Number(e))) || null;
  } catch {
    return null;
  }
}
function de() {
  const e = A();
  return e ? Array.isArray(e._nodes) ? e._nodes.filter(Boolean) : e._nodes_by_id instanceof Map ? Array.from(e._nodes_by_id.values()).filter(Boolean) : e._nodes_by_id && typeof e._nodes_by_id == "object" ? Object.values(e._nodes_by_id).filter(Boolean) : [] : [];
}
function ge(e) {
  if (e == null) return null;
  const n = String(e);
  for (const t of de())
    if (Array.isArray(t == null ? void 0 : t.inputs)) {
      for (const r of t.inputs)
        if ((r == null ? void 0 : r.link) != null && String(r.link) === n)
          return String(t.id ?? "");
    }
  return null;
}
function me(e) {
  if (e == null) return null;
  const n = A(), t = (n == null ? void 0 : n.links) ?? (n == null ? void 0 : n._links) ?? null;
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
function pe(e) {
  const n = me(e);
  if (Array.isArray(n) && n.length >= 4)
    return String(n[3] ?? "");
  if (n && typeof n == "object") {
    const t = n.target_id ?? n.targetId ?? n.to ?? null;
    if (t != null)
      return String(t);
  }
  return ge(e);
}
function ye(e) {
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
function he(e) {
  const n = [], t = /* @__PURE__ */ new Set();
  for (const r of ye(e)) {
    const i = pe(r);
    if (!i || t.has(i)) continue;
    const o = U(i);
    o && (t.add(i), n.push(o));
  }
  return n;
}
function v() {
  const e = G(), n = e[0] || null, t = n ? String(n.id ?? "") : null;
  return t !== g ? (g = t, t && (m == null || m(t, y(n) || ""))) : t || (g = null), e;
}
function _e(e) {
  var i, o;
  if (!e) return null;
  const n = e.imgs;
  if (!Array.isArray(n) || n.length === 0) return null;
  const t = ((i = n[n.length - 1]) == null ? void 0 : i.src) || ((o = n[0]) == null ? void 0 : o.src);
  if (!t) return null;
  const r = C(t);
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
      const s = C(o.src);
      if (s != null && s.filename)
        return N(e, { ...s, kind: "video" }, "widget");
    }
    const l = typeof HTMLImageElement < "u" && i instanceof HTMLImageElement ? i : (t = i.querySelector) == null ? void 0 : t.call(i, "img");
    if (!(l != null && l.src)) continue;
    const u = C(l.src);
    if (u != null && u.filename)
      return N(e, { ...u, kind: "image" }, "widget");
  }
  return null;
}
function Se(e) {
  var u;
  if (!e || !Array.isArray(e.widgets) || !e.widgets.length) return null;
  const n = String(y(e) || "").toLowerCase(), t = (u = e.widgets[0]) == null ? void 0 : u.value;
  if (typeof t != "string") return null;
  const r = ae(t);
  if (!(r != null && r.filename)) return null;
  const i = V(r.filename), o = $.has(i) || F.has(i), l = /(load|upload|loader|fromurl|folder|input)/.test(n);
  return !o && !l ? null : N(
    e,
    {
      ...r,
      type: "input",
      kind: X(e, r.filename)
    },
    "widget-value"
  );
}
function Ne(e) {
  return se(e) || _e(e) || we(e) || Se(e);
}
function Ie(e) {
  if (!e) return null;
  const n = String(e.id ?? ""), t = y(e) || "", r = [{ node: e, depth: 0 }], i = new Set(n ? [n] : []);
  let o = 0;
  for (; r.length > 0 && o < fe; ) {
    const l = r.shift();
    if (!(l != null && l.node)) continue;
    o += 1;
    const u = Ne(l.node);
    if (u) {
      const s = u._nodeId || String(l.node.id ?? ""), f = u._classType || y(l.node) || "";
      return {
        ...u,
        _nodeId: n || s,
        _classType: t || f,
        _previewNodeId: s,
        _previewClassType: f,
        _source: s === n ? u._source || "canvas" : "graph-downstream"
      };
    }
    if (!(l.depth >= ce))
      for (const s of he(l.node)) {
        const f = String((s == null ? void 0 : s.id) ?? "");
        !f || i.has(f) || (i.add(f), r.push({ node: s, depth: l.depth + 1 }));
      }
  }
  return null;
}
function Ae(e) {
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
function p() {
  k = null, E = null;
}
function ve() {
  return d === "pinned" ? U(w) : G()[0] || null;
}
function I({ force: e = !1 } = {}) {
  if (!a || !S || !A()) return;
  const n = ve(), t = n ? String(n.id ?? "") : null;
  if (!t) {
    p();
    return;
  }
  d === "pinned" && (m == null || m(t, y(n) || ""));
  const r = Ie(n);
  if (!r) {
    p();
    return;
  }
  const i = Ae(r);
  !e && !(t !== E) && i === k || (E = t, k = i, S(r));
}
function L() {
  const e = g;
  v();
  const n = g !== e;
  if (!a) {
    p();
    return;
  }
  I({ force: d !== "pinned" && n });
}
function be() {
  h || (h = setInterval(L, 150), L());
}
function K() {
  h && (clearInterval(h), h = null), p();
}
function ke(e, n) {
}
function Ee({ app: e, onOutput: n, onStatus: t } = {}) {
  S = n || null, m = t || null, c = e || null, e && v(), console.debug("[NodeStream] Controller initialized (selection-only preview mode)");
}
function Ce(e) {
  if (a = !!e, !a) {
    g = null, K();
    return;
  }
  if (p(), v(), h) {
    L();
    return;
  }
  be();
}
function Le() {
  return a;
}
function Oe(e) {
  (e === "selected" || e === "pinned" || e === "all") && (d = e, p(), a && I({ force: !0 }));
}
function Pe() {
  return d;
}
function We(e) {
  if (e == null) {
    w = null, d === "pinned" && (d = "selected"), p(), a && I({ force: !0 });
    return;
  }
  w = String(e), d = "pinned", p(), a && I({ force: !0 });
}
function je() {
  return w;
}
function Be() {
  return v(), g;
}
function He(e) {
  a = !1, g = null, w = null, S = null, m = null, c = null, K(), console.debug("[NodeStream] Controller torn down");
}
export {
  Le as getNodeStreamActive,
  je as getPinnedNodeId,
  Be as getSelectedNodeId,
  Pe as getWatchMode,
  Ee as initNodeStream,
  Te as listAdapters,
  ke as onNodeOutputs,
  We as pinNode,
  M as registerAdapter,
  Ce as setNodeStreamActive,
  Oe as setWatchMode,
  He as teardownNodeStream
};
