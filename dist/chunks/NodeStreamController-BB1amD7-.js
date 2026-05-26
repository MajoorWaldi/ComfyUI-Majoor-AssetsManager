import { a as e, n as t, r as n, s as r } from "./graphTraversal-BY_wz-NH.js";
import { KnownNodesAdapter as i, t as a } from "./KnownNodesAdapter-BJw7YvR2.js";
//#region ui/features/viewer/nodeStream/NodeStreamRegistry.ts
var o = [], s = !1;
function c() {
	s &&= (o.sort((e, t) => (t.priority ?? 0) - (e.priority ?? 0)), !1);
}
function l(e) {
	if (!e?.name) {
		console.warn("[NodeStream] Cannot register adapter without a name");
		return;
	}
	let t = o.findIndex((t) => t.name === e.name);
	t >= 0 && o.splice(t, 1), o.push(e), s = !0, console.debug(`[NodeStream] Adapter registered: ${e.name} (priority ${e.priority ?? 0})`);
}
function u() {
	return c(), o.map((e) => ({
		name: e.name,
		priority: e.priority ?? 0,
		description: e.description ?? ""
	}));
}
//#endregion
//#region ui/features/viewer/nodeStream/adapters/DefaultImageAdapter.ts
var d = new Set([
	".png",
	".jpg",
	".jpeg",
	".webp",
	".avif",
	".gif",
	".bmp",
	".tiff"
]);
function f(e) {
	if (!e) return !1;
	let t = String(e).lastIndexOf(".");
	return t >= 0 && d.has(String(e).slice(t).toLowerCase());
}
var p = a({
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
			kind: f(t.filename) ? "image" : void 0,
			_nodeId: n,
			_classType: e
		});
		return i.length ? i : null;
	}
}), m = new Set([
	".mp4",
	".webm",
	".mov",
	".avi",
	".mkv"
]);
function h(e) {
	if (!e) return !1;
	let t = String(e).lastIndexOf(".");
	return t >= 0 && m.has(String(e).slice(t).toLowerCase());
}
function g(e) {
	let t = e?.gifs;
	if (Array.isArray(t) && t.length && t[0]?.filename) return t;
	let n = e?.videos;
	return Array.isArray(n) && n.length && n[0]?.filename ? n : null;
}
var ee = a({
	name: "video-output",
	priority: 10,
	description: "Video output (gifs/videos: [{filename, subfolder, type}])",
	canHandle(e, t) {
		return !!g(t);
	},
	extractMedia(e, t, n) {
		let r = g(t);
		if (!r) return null;
		let i = [];
		for (let t of r) t?.filename && i.push({
			filename: t.filename,
			subfolder: t.subfolder || "",
			type: t.type || "output",
			kind: h(t.filename) ? "video" : "image",
			_nodeId: n,
			_classType: e
		});
		return i.length ? i : null;
	}
}), te = "__imageops_state", ne = "imageops-live-preview";
function re(e) {
	return typeof HTMLCanvasElement < "u" && e instanceof HTMLCanvasElement;
}
function ie(e) {
	return re(e) && Number(e.width) > 0 && Number(e.height) > 0;
}
function ae(e) {
	let t = 2166136261, n = String(e || "");
	for (let e = 0; e < n.length; e += 1) t ^= n.charCodeAt(e), t = Math.imul(t, 16777619);
	return (t >>> 0).toString(16);
}
function oe(e, t) {
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
function se(e, t, n, r) {
	let i = r ? `${r.dx},${r.dy},${r.w}x${r.h}` : "full";
	return ae([
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
function ce(e) {
	if (!e) return null;
	let t = e[te], n = t?.canvas;
	if (!ie(n)) return null;
	let r = oe(t, n), i = se(e, t, n, r), a = v.get(e) === i ? y.get(e) : "";
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
		_source: ne,
		_signature: i
	};
}
//#endregion
//#region ui/features/viewer/nodeStream/ltxDirectorPreviewBridge.ts
var le = "ltx-director-live-preview";
function ue(e) {
	return typeof HTMLCanvasElement < "u" && e instanceof HTMLCanvasElement;
}
function b(e) {
	return ue(e) && Number(e.width) > 0 && Number(e.height) > 0;
}
function x(e) {
	let t = 2166136261, n = String(e || "");
	for (let e = 0; e < n.length; e++) t ^= n.charCodeAt(e), t = Math.imul(t, 16777619);
	return (t >>> 0).toString(16);
}
function de(e) {
	let t = e?._ed?.canvas;
	if (b(t)) return t;
	let n = e?._timelineEditor?.canvas;
	return b(n) ? n : null;
}
function fe(e, t) {
	let n = e._ed;
	return x([
		String(e?.id ?? ""),
		`${Number(t?.width) || 0}x${Number(t?.height) || 0}`,
		String(+!!n?.dirty),
		x(JSON.stringify(n?.splines ?? []))
	].join("|"));
}
var S = /* @__PURE__ */ new WeakMap(), C = /* @__PURE__ */ new WeakMap();
function pe(e) {
	if (!e) return null;
	let t = de(e);
	if (!t) return null;
	let n = fe(e, t), r = S.get(e) === n ? C.get(e) : "";
	if (!r) {
		try {
			r = t.toDataURL("image/png");
		} catch (e) {
			return console.warn("[NodeStream] LTX Director canvas export failed:", e), null;
		}
		if (!r) return null;
		S.set(e, n), C.set(e, r);
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
		_source: le,
		_signature: n
	};
}
l(p), l(i), l(ee);
var w = "selected", T = null, E = null, D = !1, O = null, k = null, A = null, j = null, M = null, N = null, P = new Set([
	".png",
	".jpg",
	".jpeg",
	".webp",
	".avif",
	".gif",
	".bmp",
	".tiff"
]), F = new Set([
	".mp4",
	".webm",
	".mov",
	".avi",
	".mkv"
]), I = 12, L = 96;
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
	return F.has(n) ? "video" : P.has(n) ? "image" : String(R(e) || "").toLowerCase().includes("video") ? "video" : "image";
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
	let e = A?.canvas?.selected_nodes ?? A?.canvas?.selectedNodes ?? null;
	return e ? Array.isArray(e) ? e.filter(Boolean) : e instanceof Map ? Array.from(e.values()).filter(Boolean) : typeof e == "object" ? Object.values(e).filter(Boolean) : [] : [];
}
function G() {
	return e(A);
}
function K(e) {
	let n = G();
	if (e == null || !n) return null;
	try {
		return n.getNodeById?.(Number(e)) || t(n, e);
	} catch {
		return t(n, e);
	}
}
function me() {
	let e = G();
	if (!e) return [];
	let t = [];
	return r(e, ({ node: e }) => t.push(e)), t;
}
function q(e, t = G()) {
	if (e == null) return null;
	let n = String(e), i = t ? [] : me();
	t && r(t, ({ node: e }) => i.push(e));
	for (let e of i) if (Array.isArray(e?.inputs)) {
		for (let t of e.inputs) if (t?.link != null && String(t.link) === n) return String(e.id ?? "");
	}
	return null;
}
function he(e, t = G()) {
	if (e == null) return null;
	let r = n(t);
	if (!r) return null;
	let i = Number(e), a = String(e);
	if (r instanceof Map) return r.get(e) || r.get(i) || r.get(a) || null;
	if (Array.isArray(r)) {
		let e = r[i];
		if (e) return e;
		for (let e of r) {
			if (!e) continue;
			if (Array.isArray(e) && String(e[0]) === a) return e;
			let t = e.id ?? e.link_id ?? e.linkId ?? null;
			if (t != null && String(t) === a) return e;
		}
		return null;
	}
	return typeof r == "object" && (r[e] || r[i] || r[a]) || null;
}
function ge(e, t = G()) {
	let n = he(e, t);
	if (Array.isArray(n) && n.length >= 4) return String(n[3] ?? "");
	if (n && typeof n == "object") {
		let e = n.target_id ?? n.targetId ?? n.to ?? null;
		if (e != null) return String(e);
	}
	return q(e, t);
}
function _e(e) {
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
function ve(e) {
	let t = [], n = /* @__PURE__ */ new Set();
	for (let r of _e(e)) {
		let i = ge(r, e?.graph ?? G());
		if (!i || n.has(i)) continue;
		let a = K(i);
		a && (n.add(i), t.push(a));
	}
	return t;
}
function J(e) {
	let t = e ? String(e.id ?? "") : "", n = e && R(e) || "";
	k?.(t, n);
}
function Y() {
	let e = W(), t = e[0] || null, n = t ? String(t.id ?? "") : null;
	return n === E ? n || (E = null) : (E = n, J(t)), e;
}
function ye(e) {
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
function be(e) {
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
function xe(e) {
	if (!e || !Array.isArray(e.widgets) || !e.widgets.length) return null;
	let t = String(R(e) || "").toLowerCase(), n = e.widgets[0]?.value;
	if (typeof n != "string") return null;
	let r = B(n);
	if (!r?.filename) return null;
	let i = V(r.filename), a = P.has(i) || F.has(i), o = /(load|upload|loader|fromurl|folder|input)/.test(t);
	return !a && !o ? null : U(e, {
		...r,
		type: "input",
		kind: H(e, r.filename)
	}, "widget-value");
}
function Se(e) {
	return ce(e) || pe(e) || ye(e) || be(e) || xe(e);
}
function Ce(e) {
	if (!e) return null;
	let t = String(e.id ?? ""), n = R(e) || "", r = [{
		node: e,
		depth: 0
	}], i = new Set(t ? [t] : []), a = 0;
	for (; r.length > 0 && a < L;) {
		let e = r.shift();
		if (!e?.node) continue;
		a += 1;
		let o = Se(e.node);
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
		if (!(e.depth >= I)) for (let t of ve(e.node)) {
			let n = String(t?.id ?? "");
			!n || i.has(n) || (i.add(n), r.push({
				node: t,
				depth: e.depth + 1
			}));
		}
	}
	return null;
}
function we(e) {
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
	M = null, N = null;
}
function Te() {
	return w === "pinned" ? K(T) : W()[0] || null;
}
function Z({ force: e = !1 } = {}) {
	if (!D || !O || !G()) return;
	let t = Te(), n = t ? String(t.id ?? "") : null;
	if (!n) {
		J(null), X();
		return;
	}
	w === "pinned" && J(t);
	let r = Ce(t);
	if (!r) {
		X();
		return;
	}
	let i = we(r);
	!e && n === N && i === M || (N = n, M = i, O(r));
}
function Q() {
	let e = E;
	Y();
	let t = E !== e;
	if (!D) {
		X();
		return;
	}
	Z({ force: w !== "pinned" && t });
}
function Ee() {
	j || (j = setInterval(Q, 150), Q());
}
function $() {
	j &&= (clearInterval(j), null), X();
}
function De(e, t) {}
function Oe({ app: e, onOutput: t, onStatus: n } = {}) {
	O = t || null, k = n || null, A = e || null, e && Y(), console.debug("[NodeStream] Controller initialized (selection-only preview mode)");
}
function ke(e) {
	if (D = !!e, !D) {
		E = null, $();
		return;
	}
	if (X(), Y(), j) {
		Q();
		return;
	}
	Ee();
}
function Ae() {
	return D;
}
function je(e) {
	let t = e === "pinned" ? "pinned" : "selected";
	w !== t && (w = t, X(), D && Z({ force: !0 }));
}
function Me() {
	return w;
}
function Ne(e) {
	if (e == null) {
		T = null, w === "pinned" && (w = "selected"), X(), D && Z({ force: !0 });
		return;
	}
	T = String(e), w = "pinned", X(), D && Z({ force: !0 });
}
function Pe() {
	return T;
}
function Fe() {
	return Y(), E;
}
function Ie(e) {
	D = !1, E = null, T = null, J(null), O = null, k = null, A = null, $(), console.debug("[NodeStream] Controller torn down");
}
//#endregion
export { Ae as getNodeStreamActive, Pe as getPinnedNodeId, Fe as getSelectedNodeId, Me as getWatchMode, Oe as initNodeStream, u as listAdapters, De as onNodeOutputs, Ne as pinNode, ke as setNodeStreamActive, je as setWatchMode, Ie as teardownNodeStream };
