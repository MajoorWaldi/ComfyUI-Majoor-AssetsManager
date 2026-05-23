import { KnownNodesAdapter as e, t } from "./KnownNodesAdapter-DFCvuyQ-.js";
//#region js/features/viewer/nodeStream/NodeStreamRegistry.js
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
//#region js/features/viewer/nodeStream/adapters/DefaultImageAdapter.js
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
function h(e) {
	return m(e) && Number(e.width) > 0 && Number(e.height) > 0;
}
function g(e) {
	let t = 2166136261, n = String(e || "");
	for (let e = 0; e < n.length; e += 1) t ^= n.charCodeAt(e), t = Math.imul(t, 16777619);
	return (t >>> 0).toString(16);
}
function ne(e, t) {
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
function re(e, t, n, r) {
	let i = r ? `${r.dx},${r.dy},${r.w}x${r.h}` : "full";
	return g([
		String(e?.id ?? ""),
		String(t?.lastKey ?? ""),
		String(t?.lastRenderTick ?? ""),
		String(+!!t?.nativeDirty),
		`${Number(n?.width) || 0}x${Number(n?.height) || 0}`,
		i
	].join("|"));
}
function ie(e, t) {
	let n = document.createElement("canvas");
	n.width = t.w, n.height = t.h;
	let r = n.getContext("2d");
	return r ? (r.drawImage(e, t.dx, t.dy, t.w, t.h, 0, 0, t.w, t.h), n.toDataURL("image/png")) : "";
}
var _ = /* @__PURE__ */ new WeakMap(), v = /* @__PURE__ */ new WeakMap();
function y(e) {
	if (!e) return null;
	let t = e[ee], n = t?.canvas;
	if (!h(n)) return null;
	let r = ne(t, n), i = re(e, t, n, r), a = _.get(e) === i ? v.get(e) : "";
	if (!a) {
		try {
			a = r ? ie(n, r) : n.toDataURL("image/png");
		} catch (e) {
			return console.warn("[NodeStream] ImageOps canvas export failed:", e), null;
		}
		if (!a) return null;
		_.set(e, i), v.set(e, a);
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
a(l), a(e), a(p);
var b = "selected", x = null, S = null, C = !1, w = null, T = null, E = null, D = null, O = null, k = null, A = new Set([
	".png",
	".jpg",
	".jpeg",
	".webp",
	".avif",
	".gif",
	".bmp",
	".tiff"
]), j = new Set([
	".mp4",
	".webm",
	".mov",
	".avi",
	".mkv"
]), ae = 12, M = 96;
function N(e) {
	return e?.comfyClass || e?.type || null;
}
function P(e) {
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
function oe(e) {
	if (e == null || typeof e != "string") return null;
	let t = e.trim().replace(/\\/g, "/");
	if (!t) return null;
	let n = t.lastIndexOf("/");
	return {
		filename: n >= 0 ? t.slice(n + 1) : t,
		subfolder: n >= 0 ? t.slice(0, n) : ""
	};
}
function F(e) {
	if (!e) return "";
	let t = String(e).lastIndexOf(".");
	return t >= 0 ? String(e).slice(t).toLowerCase() : "";
}
function I(e, t = "") {
	let n = F(t);
	return j.has(n) ? "video" : A.has(n) ? "image" : String(N(e) || "").toLowerCase().includes("video") ? "video" : "image";
}
function L(e, t, n) {
	return {
		...t,
		kind: t?.kind || I(e, t?.filename),
		_nodeId: String(e?.id ?? ""),
		_classType: N(e) || "",
		_source: n
	};
}
function R() {
	let e = E?.canvas?.selected_nodes ?? E?.canvas?.selectedNodes ?? null;
	return e ? Array.isArray(e) ? e.filter(Boolean) : e instanceof Map ? Array.from(e.values()).filter(Boolean) : typeof e == "object" ? Object.values(e).filter(Boolean) : [] : [];
}
function z() {
	return E?.graph ?? E?.canvas?.graph ?? null;
}
function B(e) {
	let t = z();
	if (e == null || !t) return null;
	try {
		return t.getNodeById?.(Number(e)) || null;
	} catch {
		return null;
	}
}
function V() {
	let e = z();
	return e ? Array.isArray(e._nodes) ? e._nodes.filter(Boolean) : e._nodes_by_id instanceof Map ? Array.from(e._nodes_by_id.values()).filter(Boolean) : e._nodes_by_id && typeof e._nodes_by_id == "object" ? Object.values(e._nodes_by_id).filter(Boolean) : [] : [];
}
function H(e) {
	if (e == null) return null;
	let t = String(e);
	for (let e of V()) if (Array.isArray(e?.inputs)) {
		for (let n of e.inputs) if (n?.link != null && String(n.link) === t) return String(e.id ?? "");
	}
	return null;
}
function U(e) {
	if (e == null) return null;
	let t = z(), n = t?.links ?? t?._links ?? null;
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
function W(e) {
	let t = U(e);
	if (Array.isArray(t) && t.length >= 4) return String(t[3] ?? "");
	if (t && typeof t == "object") {
		let e = t.target_id ?? t.targetId ?? t.to ?? null;
		if (e != null) return String(e);
	}
	return H(e);
}
function G(e) {
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
function K(e) {
	let t = [], n = /* @__PURE__ */ new Set();
	for (let r of G(e)) {
		let e = W(r);
		if (!e || n.has(e)) continue;
		let i = B(e);
		i && (n.add(e), t.push(i));
	}
	return t;
}
function q(e) {
	let t = e ? String(e.id ?? "") : "", n = e && N(e) || "";
	T?.(t, n);
}
function J() {
	let e = R(), t = e[0] || null, n = t ? String(t.id ?? "") : null;
	return n === S ? n || (S = null) : (S = n, q(t)), e;
}
function se(e) {
	if (!e) return null;
	let t = e.imgs;
	if (!Array.isArray(t) || t.length === 0) return null;
	let n = t[t.length - 1]?.src || t[0]?.src;
	if (!n) return null;
	let r = P(n);
	return r?.filename ? L(e, {
		...r,
		kind: "image"
	}, "canvas") : null;
}
function ce(e) {
	if (!e || !Array.isArray(e.widgets)) return null;
	for (let t of e.widgets) {
		let n = t?.element;
		if (!n) continue;
		let r = typeof HTMLVideoElement < "u" && n instanceof HTMLVideoElement ? n : n.querySelector?.("video");
		if (r?.src) {
			let t = P(r.src);
			if (t?.filename) return L(e, {
				...t,
				kind: "video"
			}, "widget");
		}
		let i = typeof HTMLImageElement < "u" && n instanceof HTMLImageElement ? n : n.querySelector?.("img");
		if (!i?.src) continue;
		let a = P(i.src);
		if (a?.filename) return L(e, {
			...a,
			kind: "image"
		}, "widget");
	}
	return null;
}
function le(e) {
	if (!e || !Array.isArray(e.widgets) || !e.widgets.length) return null;
	let t = String(N(e) || "").toLowerCase(), n = e.widgets[0]?.value;
	if (typeof n != "string") return null;
	let r = oe(n);
	if (!r?.filename) return null;
	let i = F(r.filename), a = A.has(i) || j.has(i), o = /(load|upload|loader|fromurl|folder|input)/.test(t);
	return !a && !o ? null : L(e, {
		...r,
		type: "input",
		kind: I(e, r.filename)
	}, "widget-value");
}
function ue(e) {
	return y(e) || se(e) || ce(e) || le(e);
}
function de(e) {
	if (!e) return null;
	let t = String(e.id ?? ""), n = N(e) || "", r = [{
		node: e,
		depth: 0
	}], i = new Set(t ? [t] : []), a = 0;
	for (; r.length > 0 && a < M;) {
		let e = r.shift();
		if (!e?.node) continue;
		a += 1;
		let o = ue(e.node);
		if (o) {
			let r = o._nodeId || String(e.node.id ?? ""), i = o._classType || N(e.node) || "";
			return {
				...o,
				_nodeId: t || r,
				_classType: n || i,
				_previewNodeId: r,
				_previewClassType: i,
				_source: r === t ? o._source || "canvas" : "graph-downstream"
			};
		}
		if (!(e.depth >= ae)) for (let t of K(e.node)) {
			let n = String(t?.id ?? "");
			!n || i.has(n) || (i.add(n), r.push({
				node: t,
				depth: e.depth + 1
			}));
		}
	}
	return null;
}
function fe(e) {
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
function Y() {
	O = null, k = null;
}
function pe() {
	return b === "pinned" ? B(x) : R()[0] || null;
}
function X({ force: e = !1 } = {}) {
	if (!C || !w || !z()) return;
	let t = pe(), n = t ? String(t.id ?? "") : null;
	if (!n) {
		q(null), Y();
		return;
	}
	b === "pinned" && q(t);
	let r = de(t);
	if (!r) {
		Y();
		return;
	}
	let i = fe(r);
	!e && n === k && i === O || (k = n, O = i, w(r));
}
function Z() {
	let e = S;
	J();
	let t = S !== e;
	if (!C) {
		Y();
		return;
	}
	X({ force: b !== "pinned" && t });
}
function me() {
	D || (D = setInterval(Z, 150), Z());
}
function Q() {
	D &&= (clearInterval(D), null), Y();
}
function he(e, t) {}
function $({ app: e, onOutput: t, onStatus: n } = {}) {
	w = t || null, T = n || null, E = e || null, e && J(), console.debug("[NodeStream] Controller initialized (selection-only preview mode)");
}
function ge(e) {
	if (C = !!e, !C) {
		S = null, Q();
		return;
	}
	if (Y(), J(), D) {
		Z();
		return;
	}
	me();
}
function _e() {
	return C;
}
function ve(e) {
	let t = e === "pinned" ? "pinned" : "selected";
	b !== t && (b = t, Y(), C && X({ force: !0 }));
}
function ye() {
	return b;
}
function be(e) {
	if (e == null) {
		x = null, b === "pinned" && (b = "selected"), Y(), C && X({ force: !0 });
		return;
	}
	x = String(e), b = "pinned", Y(), C && X({ force: !0 });
}
function xe() {
	return x;
}
function Se() {
	return J(), S;
}
function Ce(e) {
	C = !1, S = null, x = null, q(null), w = null, T = null, E = null, Q(), console.debug("[NodeStream] Controller torn down");
}
//#endregion
export { _e as getNodeStreamActive, xe as getPinnedNodeId, Se as getSelectedNodeId, ye as getWatchMode, $ as initNodeStream, o as listAdapters, he as onNodeOutputs, be as pinNode, ge as setNodeStreamActive, ve as setWatchMode, Ce as teardownNodeStream };
