import { KnownNodesAdapter as e, t } from "./KnownNodesAdapter-C80doIOz.js";
//#region js/features/viewer/nodeStream/NodeStreamRegistry.ts
var n = [], r = !1;
function i() {
	r &&= (n.sort((e, t) => (t.priority ?? 0) - (e.priority ?? 0)), !1);
}
function a(e) {
	if (!e?.name) {
		console.warn("[NodeStream] Cannot register adapter without a name");
		return;
	}
	let t = n.findIndex((t) => t.name === e.name);
	t >= 0 && n.splice(t, 1), n.push(e), r = !0, console.debug(`[NodeStream] Adapter registered: ${e.name} (priority ${e.priority ?? 0})`);
}
function o() {
	return i(), n.map((e) => ({
		name: e.name,
		priority: e.priority ?? 0,
		description: e.description ?? ""
	}));
}
//#endregion
//#region js/features/viewer/nodeStream/adapters/DefaultImageAdapter.ts
var s = new Set([
	".png",
	".jpg",
	".jpeg",
	".webp",
	".avif",
	".gif",
	".bmp",
	".tiff"
]);
function c(e) {
	if (!e) return !1;
	let t = String(e).lastIndexOf(".");
	return t >= 0 && s.has(String(e).slice(t).toLowerCase());
}
var l = t({
	name: "default-image",
	priority: 0,
	description: "Standard image output (images: [{filename, subfolder, type}])",
	canHandle(e, t) {
		let n = t?.images;
		return Array.isArray(n) && n.length > 0 && !!n[0]?.filename;
	},
	extractMedia(e, t, n) {
		let r = t?.images;
		if (!Array.isArray(r) || !r.length) return null;
		let i = [];
		for (let t of r) t?.filename && i.push({
			filename: t.filename,
			subfolder: t.subfolder || "",
			type: t.type || "output",
			kind: c(t.filename) ? "image" : void 0,
			_nodeId: n,
			_classType: e
		});
		return i.length ? i : null;
	}
}), u = new Set([
	".mp4",
	".webm",
	".mov",
	".avi",
	".mkv"
]);
function d(e) {
	if (!e) return !1;
	let t = String(e).lastIndexOf(".");
	return t >= 0 && u.has(String(e).slice(t).toLowerCase());
}
function f(e) {
	let t = e?.gifs;
	if (Array.isArray(t) && t.length && t[0]?.filename) return t;
	let n = e?.videos;
	return Array.isArray(n) && n.length && n[0]?.filename ? n : null;
}
var p = t({
	name: "video-output",
	priority: 10,
	description: "Video output (gifs/videos: [{filename, subfolder, type}])",
	canHandle(e, t) {
		return !!f(t);
	},
	extractMedia(e, t, n) {
		let r = f(t);
		if (!r) return null;
		let i = [];
		for (let t of r) t?.filename && i.push({
			filename: t.filename,
			subfolder: t.subfolder || "",
			type: t.type || "output",
			kind: d(t.filename) ? "video" : "image",
			_nodeId: n,
			_classType: e
		});
		return i.length ? i : null;
	}
}), ee = "__imageops_state", te = "imageops-live-preview";
function m(e) {
	return typeof HTMLCanvasElement < "u" && e instanceof HTMLCanvasElement;
}
function ne(e) {
	return m(e) && Number(e.width) > 0 && Number(e.height) > 0;
}
function re(e) {
	let t = 2166136261, n = String(e || "");
	for (let e = 0; e < n.length; e += 1) t ^= n.charCodeAt(e), t = Math.imul(t, 16777619);
	return (t >>> 0).toString(16);
}
function h(e, t) {
	let n = Number(e?.previewSourceWidth) || 0, r = Number(e?.previewSourceHeight) || 0, i = Number(t?.width) || 0, a = Number(t?.height) || 0;
	if (n <= 0 || r <= 0 || i <= 0 || a <= 0) return null;
	let o = Number(e?.previewZoom), s = Number(e?.previewPanX) || 0, c = Number(e?.previewPanY) || 0;
	if (Number.isFinite(o) && Math.abs(o - 1) > .001 || s !== 0 || c !== 0) return null;
	let l = Math.min(i / n, a / r), u = Math.max(1, Math.round(n * l)), d = Math.max(1, Math.round(r * l)), f = Math.max(0, Math.round((i - u) / 2)), p = Math.max(0, Math.round((a - d) / 2));
	return f === 0 && p === 0 && u === i && d === a ? null : {
		dx: f,
		dy: p,
		w: u,
		h: d
	};
}
function g(e, t, n, r) {
	let i = r ? `${r.dx},${r.dy},${r.w}x${r.h}` : "full";
	return re([
		String(e?.id ?? ""),
		String(t?.lastKey ?? ""),
		String(t?.lastRenderTick ?? ""),
		String(+!!t?.nativeDirty),
		`${Number(n?.width) || 0}x${Number(n?.height) || 0}`,
		i
	].join("|"));
}
function _(e, t) {
	let n = document.createElement("canvas");
	n.width = t.w, n.height = t.h;
	let r = n.getContext("2d");
	return r ? (r.drawImage(e, t.dx, t.dy, t.w, t.h, 0, 0, t.w, t.h), n.toDataURL("image/png")) : "";
}
var v = /* @__PURE__ */ new WeakMap(), y = /* @__PURE__ */ new WeakMap();
function ie(e) {
	if (!e) return null;
	let t = e[ee], n = t?.canvas;
	if (!ne(n)) return null;
	let r = h(t, n), i = g(e, t, n, r), a = v.get(e) === i ? y.get(e) : "";
	if (!a) {
		try {
			a = r ? _(n, r) : n.toDataURL("image/png");
		} catch (e) {
			return console.warn("[NodeStream] ImageOps canvas export failed:", e), null;
		}
		if (!a) return null;
		v.set(e, i), y.set(e, a);
	}
	let o = r ? r.w : Number(n.width) || void 0, s = r ? r.h : Number(n.height) || void 0, c = e.comfyClass || e.type || "ImageOps";
	return {
		filename: `imageops_${e.id ?? "node"}_${i}.png`,
		subfolder: "",
		type: "temp",
		kind: "image",
		url: a,
		width: o,
		height: s,
		_nodeId: String(e.id ?? ""),
		_classType: c,
		_source: te,
		_signature: i
	};
}
//#endregion
//#region js/features/viewer/nodeStream/ltxDirectorPreviewBridge.ts
var b = "ltx-director-live-preview";
function x(e) {
	return typeof HTMLCanvasElement < "u" && e instanceof HTMLCanvasElement;
}
function S(e) {
	return x(e) && Number(e.width) > 0 && Number(e.height) > 0;
}
function C(e) {
	let t = 2166136261, n = String(e || "");
	for (let e = 0; e < n.length; e++) t ^= n.charCodeAt(e), t = Math.imul(t, 16777619);
	return (t >>> 0).toString(16);
}
function ae(e) {
	let t = e?._ed?.canvas;
	if (S(t)) return t;
	let n = e?._timelineEditor?.canvas;
	return S(n) ? n : null;
}
function oe(e, t) {
	let n = e._ed;
	return C([
		String(e?.id ?? ""),
		`${Number(t?.width) || 0}x${Number(t?.height) || 0}`,
		String(+!!n?.dirty),
		C(JSON.stringify(n?.splines ?? []))
	].join("|"));
}
var w = /* @__PURE__ */ new WeakMap(), T = /* @__PURE__ */ new WeakMap();
function se(e) {
	if (!e) return null;
	let t = ae(e);
	if (!t) return null;
	let n = oe(e, t), r = w.get(e) === n ? T.get(e) : "";
	if (!r) {
		try {
			r = t.toDataURL("image/png");
		} catch (e) {
			return console.warn("[NodeStream] LTX Director canvas export failed:", e), null;
		}
		if (!r) return null;
		w.set(e, n), T.set(e, r);
	}
	let i = e.comfyClass || e.type || "LTXVSparseTrackEditor";
	return {
		filename: `ltx_director_${e.id ?? "node"}_${n}.png`,
		subfolder: "",
		type: "temp",
		kind: "image",
		url: r,
		width: Number(t.width) || void 0,
		height: Number(t.height) || void 0,
		_nodeId: String(e.id ?? ""),
		_classType: i,
		_source: b,
		_signature: n
	};
}
a(l), a(e), a(p);
var E = "selected", D = null, O = null, k = !1, A = null, j = null, M = null, N = null, P = null, F = null, I = new Set([
	".png",
	".jpg",
	".jpeg",
	".webp",
	".avif",
	".gif",
	".bmp",
	".tiff"
]), L = new Set([
	".mp4",
	".webm",
	".mov",
	".avi",
	".mkv"
]), ce = 12, le = 96;
function R(e) {
	return e?.comfyClass || e?.type || null;
}
function z(e) {
	try {
		let t = new URL(e, window.location.href), n = t.searchParams.get("filename") || "";
		return n ? {
			filename: n,
			subfolder: t.searchParams.get("subfolder") || "",
			type: t.searchParams.get("type") || "output"
		} : null;
	} catch {
		return null;
	}
}
function B(e) {
	if (e == null || typeof e != "string") return null;
	let t = e.trim().replace(/\\/g, "/");
	if (!t) return null;
	let n = t.lastIndexOf("/");
	return {
		filename: n >= 0 ? t.slice(n + 1) : t,
		subfolder: n >= 0 ? t.slice(0, n) : ""
	};
}
function V(e) {
	if (!e) return "";
	let t = String(e).lastIndexOf(".");
	return t >= 0 ? String(e).slice(t).toLowerCase() : "";
}
function H(e, t = "") {
	let n = V(t);
	return L.has(n) ? "video" : I.has(n) ? "image" : String(R(e) || "").toLowerCase().includes("video") ? "video" : "image";
}
function U(e, t, n) {
	return {
		...t,
		kind: t?.kind || H(e, t?.filename),
		_nodeId: String(e?.id ?? ""),
		_classType: R(e) || "",
		_source: n
	};
}
function W() {
	let e = M?.canvas?.selected_nodes ?? M?.canvas?.selectedNodes ?? null;
	return e ? Array.isArray(e) ? e.filter(Boolean) : e instanceof Map ? Array.from(e.values()).filter(Boolean) : typeof e == "object" ? Object.values(e).filter(Boolean) : [] : [];
}
function G() {
	return M?.graph ?? M?.canvas?.graph ?? null;
}
function K(e) {
	let t = G();
	if (e == null || !t) return null;
	try {
		return t.getNodeById?.(Number(e)) || null;
	} catch {
		return null;
	}
}
function ue() {
	let e = G();
	return e ? Array.isArray(e._nodes) ? e._nodes.filter(Boolean) : e._nodes_by_id instanceof Map ? Array.from(e._nodes_by_id.values()).filter(Boolean) : e._nodes_by_id && typeof e._nodes_by_id == "object" ? Object.values(e._nodes_by_id).filter(Boolean) : [] : [];
}
function q(e) {
	if (e == null) return null;
	let t = String(e);
	for (let e of ue()) if (Array.isArray(e?.inputs)) {
		for (let n of e.inputs) if (n?.link != null && String(n.link) === t) return String(e.id ?? "");
	}
	return null;
}
function de(e) {
	if (e == null) return null;
	let t = G(), n = t?.links ?? t?._links ?? null;
	if (!n) return null;
	let r = Number(e), i = String(e);
	if (n instanceof Map) return n.get(e) || n.get(r) || n.get(i) || null;
	if (Array.isArray(n)) {
		let e = n[r];
		if (e) return e;
		for (let e of n) {
			if (!e) continue;
			if (Array.isArray(e) && String(e[0]) === i) return e;
			let t = e.id ?? e.link_id ?? e.linkId ?? null;
			if (t != null && String(t) === i) return e;
		}
		return null;
	}
	return typeof n == "object" && (n[e] || n[r] || n[i]) || null;
}
function fe(e) {
	let t = de(e);
	if (Array.isArray(t) && t.length >= 4) return String(t[3] ?? "");
	if (t && typeof t == "object") {
		let e = t.target_id ?? t.targetId ?? t.to ?? null;
		if (e != null) return String(e);
	}
	return q(e);
}
function pe(e) {
	if (!Array.isArray(e?.outputs)) return [];
	let t = [];
	for (let n of e.outputs) {
		let e = n?.links;
		if (Array.isArray(e)) for (let n of e) n != null && t.push(n);
		else e != null && t.push(e);
		n?.link != null && t.push(n.link);
	}
	return Array.from(new Set(t.map((e) => String(e))));
}
function me(e) {
	let t = [], n = /* @__PURE__ */ new Set();
	for (let r of pe(e)) {
		let e = fe(r);
		if (!e || n.has(e)) continue;
		let i = K(e);
		i && (n.add(e), t.push(i));
	}
	return t;
}
function J(e) {
	let t = e ? String(e.id ?? "") : "", n = e && R(e) || "";
	j?.(t, n);
}
function Y() {
	let e = W(), t = e[0] || null, n = t ? String(t.id ?? "") : null;
	return n === O ? n || (O = null) : (O = n, J(t)), e;
}
function he(e) {
	if (!e) return null;
	let t = e.imgs;
	if (!Array.isArray(t) || t.length === 0) return null;
	let n = t[t.length - 1]?.src || t[0]?.src;
	if (!n) return null;
	let r = z(n);
	return r?.filename ? U(e, {
		...r,
		kind: "image"
	}, "canvas") : null;
}
function ge(e) {
	if (!e || !Array.isArray(e.widgets)) return null;
	for (let t of e.widgets) {
		let n = t?.element;
		if (!n) continue;
		let r = typeof HTMLVideoElement < "u" && n instanceof HTMLVideoElement ? n : n.querySelector?.("video");
		if (r?.src) {
			let t = z(r.src);
			if (t?.filename) return U(e, {
				...t,
				kind: "video"
			}, "widget");
		}
		let i = typeof HTMLImageElement < "u" && n instanceof HTMLImageElement ? n : n.querySelector?.("img");
		if (!i?.src) continue;
		let a = z(i.src);
		if (a?.filename) return U(e, {
			...a,
			kind: "image"
		}, "widget");
	}
	return null;
}
function _e(e) {
	if (!e || !Array.isArray(e.widgets) || !e.widgets.length) return null;
	let t = String(R(e) || "").toLowerCase(), n = e.widgets[0]?.value;
	if (typeof n != "string") return null;
	let r = B(n);
	if (!r?.filename) return null;
	let i = V(r.filename), a = I.has(i) || L.has(i), o = /(load|upload|loader|fromurl|folder|input)/.test(t);
	return !a && !o ? null : U(e, {
		...r,
		type: "input",
		kind: H(e, r.filename)
	}, "widget-value");
}
function ve(e) {
	return ie(e) || se(e) || he(e) || ge(e) || _e(e);
}
function ye(e) {
	if (!e) return null;
	let t = String(e.id ?? ""), n = R(e) || "", r = [{
		node: e,
		depth: 0
	}], i = new Set(t ? [t] : []), a = 0;
	for (; r.length > 0 && a < le;) {
		let e = r.shift();
		if (!e?.node) continue;
		a += 1;
		let o = ve(e.node);
		if (o) {
			let r = o._nodeId || String(e.node.id ?? ""), i = o._classType || R(e.node) || "";
			return {
				...o,
				_nodeId: t || r,
				_classType: n || i,
				_previewNodeId: r,
				_previewClassType: i,
				_source: r === t ? o._source || "canvas" : "graph-downstream"
			};
		}
		if (!(e.depth >= ce)) for (let t of me(e.node)) {
			let n = String(t?.id ?? "");
			!n || i.has(n) || (i.add(n), r.push({
				node: t,
				depth: e.depth + 1
			}));
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
function X() {
	P = null, F = null;
}
function xe() {
	return E === "pinned" ? K(D) : W()[0] || null;
}
function Z({ force: e = !1 } = {}) {
	if (!k || !A || !G()) return;
	let t = xe(), n = t ? String(t.id ?? "") : null;
	if (!n) {
		J(null), X();
		return;
	}
	E === "pinned" && J(t);
	let r = ye(t);
	if (!r) {
		X();
		return;
	}
	let i = be(r);
	!e && n === F && i === P || (F = n, P = i, A(r));
}
function Q() {
	let e = O;
	Y();
	let t = O !== e;
	if (!k) {
		X();
		return;
	}
	Z({ force: E !== "pinned" && t });
}
function Se() {
	N || (N = setInterval(Q, 150), Q());
}
function $() {
	N &&= (clearInterval(N), null), X();
}
function Ce(e, t) {}
function we({ app: e, onOutput: t, onStatus: n } = {}) {
	A = t || null, j = n || null, M = e || null, e && Y(), console.debug("[NodeStream] Controller initialized (selection-only preview mode)");
}
function Te(e) {
	if (k = !!e, !k) {
		O = null, $();
		return;
	}
	if (X(), Y(), N) {
		Q();
		return;
	}
	Se();
}
function Ee() {
	return k;
}
function De(e) {
	let t = e === "pinned" ? "pinned" : "selected";
	E !== t && (E = t, X(), k && Z({ force: !0 }));
}
function Oe() {
	return E;
}
function ke(e) {
	if (e == null) {
		D = null, E === "pinned" && (E = "selected"), X(), k && Z({ force: !0 });
		return;
	}
	D = String(e), E = "pinned", X(), k && Z({ force: !0 });
}
function Ae() {
	return D;
}
function je() {
	return Y(), O;
}
function Me(e) {
	k = !1, O = null, D = null, J(null), A = null, j = null, M = null, $(), console.debug("[NodeStream] Controller torn down");
}
//#endregion
export { Ee as getNodeStreamActive, Ae as getPinnedNodeId, je as getSelectedNodeId, Oe as getWatchMode, we as initNodeStream, o as listAdapters, Ce as onNodeOutputs, ke as pinNode, Te as setNodeStreamActive, De as setWatchMode, Me as teardownNodeStream };
