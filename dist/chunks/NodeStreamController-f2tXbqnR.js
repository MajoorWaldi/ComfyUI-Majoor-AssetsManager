import { a as e, n as t, r as n, s as r } from "./graphTraversal-Sruu0ipL.js";
import { KnownNodesAdapter as i, t as a } from "./KnownNodesAdapter-Csi3_LhH.js";
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
	".jxl",
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
}), ee = new Set([
	".mp4",
	".webm",
	".mov",
	".avi",
	".mkv"
]);
function m(e) {
	if (!e) return !1;
	let t = String(e).lastIndexOf(".");
	return t >= 0 && ee.has(String(e).slice(t).toLowerCase());
}
function h(e) {
	let t = e?.gifs;
	if (Array.isArray(t) && t.length && t[0]?.filename) return t;
	let n = e?.videos;
	return Array.isArray(n) && n.length && n[0]?.filename ? n : null;
}
var te = a({
	name: "video-output",
	priority: 10,
	description: "Video output (gifs/videos: [{filename, subfolder, type}])",
	canHandle(e, t) {
		return !!h(t);
	},
	extractMedia(e, t, n) {
		let r = h(t);
		if (!r) return null;
		let i = [];
		for (let t of r) t?.filename && i.push({
			filename: t.filename,
			subfolder: t.subfolder || "",
			type: t.type || "output",
			kind: m(t.filename) ? "video" : "image",
			_nodeId: n,
			_classType: e
		});
		return i.length ? i : null;
	}
}), ne = "__imageops_state", re = "imageops-live-preview";
function ie(e) {
	return typeof HTMLCanvasElement < "u" && e instanceof HTMLCanvasElement;
}
function ae(e) {
	return ie(e) && Number(e.width) > 0 && Number(e.height) > 0;
}
function oe(e) {
	let t = 2166136261, n = String(e || "");
	for (let e = 0; e < n.length; e += 1) t ^= n.charCodeAt(e), t = Math.imul(t, 16777619);
	return (t >>> 0).toString(16);
}
function se(e, t) {
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
function ce(e, t, n, r) {
	let i = r ? `${r.dx},${r.dy},${r.w}x${r.h}` : "full";
	return oe([
		String(e?.id ?? ""),
		String(t?.lastKey ?? ""),
		String(t?.lastRenderTick ?? ""),
		String(+!!t?.nativeDirty),
		`${Number(n?.width) || 0}x${Number(n?.height) || 0}`,
		i
	].join("|"));
}
function g(e, t) {
	let n = document.createElement("canvas");
	n.width = t.w, n.height = t.h;
	let r = n.getContext("2d");
	return r ? (r.drawImage(e, t.dx, t.dy, t.w, t.h, 0, 0, t.w, t.h), n.toDataURL("image/png")) : "";
}
var _ = /* @__PURE__ */ new WeakMap(), v = /* @__PURE__ */ new WeakMap();
function le(e) {
	if (!e) return null;
	let t = e[ne], n = t?.canvas;
	if (!ae(n)) return null;
	let r = se(t, n), i = ce(e, t, n, r), a = _.get(e) === i ? v.get(e) : "";
	if (!a) {
		try {
			a = r ? g(n, r) : n.toDataURL("image/png");
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
		_source: re,
		_signature: i
	};
}
//#endregion
//#region ui/features/viewer/nodeStream/ltxDirectorPreviewBridge.ts
var ue = "ltx-director-live-preview";
function de(e) {
	return typeof HTMLCanvasElement < "u" && e instanceof HTMLCanvasElement;
}
function y(e) {
	return de(e) && Number(e.width) > 0 && Number(e.height) > 0;
}
function b(e) {
	let t = 2166136261, n = String(e || "");
	for (let e = 0; e < n.length; e++) t ^= n.charCodeAt(e), t = Math.imul(t, 16777619);
	return (t >>> 0).toString(16);
}
function fe(e) {
	let t = e?._ed?.canvas;
	if (y(t)) return t;
	let n = e?._timelineEditor?.canvas;
	return y(n) ? n : null;
}
function pe(e, t) {
	let n = e._ed;
	return b([
		String(e?.id ?? ""),
		`${Number(t?.width) || 0}x${Number(t?.height) || 0}`,
		String(+!!n?.dirty),
		b(JSON.stringify(n?.splines ?? []))
	].join("|"));
}
var x = /* @__PURE__ */ new WeakMap(), S = /* @__PURE__ */ new WeakMap();
function me(e) {
	if (!e) return null;
	let t = fe(e);
	if (!t) return null;
	let n = pe(e, t), r = x.get(e) === n ? S.get(e) : "";
	if (!r) {
		try {
			r = t.toDataURL("image/png");
		} catch (e) {
			return console.warn("[NodeStream] LTX Director canvas export failed:", e), null;
		}
		if (!r) return null;
		x.set(e, n), S.set(e, r);
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
		_source: ue,
		_signature: n
	};
}
l(p), l(i), l(te);
var C = "selected", w = null, T = null, E = !1, D = null, O = null, k = null, A = null, j = null, M = null, N = new Set([
	".png",
	".jpg",
	".jpeg",
	".webp",
	".avif",
	".jxl",
	".gif",
	".bmp",
	".tiff"
]), P = new Set([
	".mp4",
	".webm",
	".mov",
	".avi",
	".mkv"
]), F = 12, I = 96;
function L(e) {
	return e?.comfyClass || e?.type || null;
}
function R(e) {
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
function z(e) {
	if (e == null || typeof e != "string") return null;
	let t = e.trim().replace(/\\/g, "/");
	if (!t) return null;
	let n = t.lastIndexOf("/");
	return {
		filename: n >= 0 ? t.slice(n + 1) : t,
		subfolder: n >= 0 ? t.slice(0, n) : ""
	};
}
function B(e) {
	if (!e) return "";
	let t = String(e).lastIndexOf(".");
	return t >= 0 ? String(e).slice(t).toLowerCase() : "";
}
function V(e, t = "") {
	let n = B(t);
	return P.has(n) ? "video" : N.has(n) ? "image" : String(L(e) || "").toLowerCase().includes("video") ? "video" : "image";
}
function H(e, t, n) {
	return {
		...t,
		kind: t?.kind || V(e, t?.filename),
		_nodeId: String(e?.id ?? ""),
		_classType: L(e) || "",
		_source: n
	};
}
function U() {
	let e = k?.canvas?.selected_nodes ?? k?.canvas?.selectedNodes ?? null;
	return e ? Array.isArray(e) ? e.filter(Boolean) : e instanceof Map ? Array.from(e.values()).filter(Boolean) : typeof e == "object" ? Object.values(e).filter(Boolean) : [] : [];
}
function W() {
	return e(k);
}
function G(e) {
	let n = W();
	if (e == null || !n) return null;
	try {
		return n.getNodeById?.(Number(e)) || t(n, e);
	} catch {
		return t(n, e);
	}
}
function he() {
	let e = W();
	if (!e) return [];
	let t = [];
	return r(e, ({ node: e }) => t.push(e)), t;
}
function K(e, t = W()) {
	if (e == null) return null;
	let n = String(e), i = t ? [] : he();
	t && r(t, ({ node: e }) => i.push(e));
	for (let e of i) if (Array.isArray(e?.inputs)) {
		for (let t of e.inputs) if (t?.link != null && String(t.link) === n) return String(e.id ?? "");
	}
	return null;
}
function ge(e, t = W()) {
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
function _e(e, t = W()) {
	let n = ge(e, t);
	if (Array.isArray(n) && n.length >= 4) return String(n[3] ?? "");
	if (n && typeof n == "object") {
		let e = n.target_id ?? n.targetId ?? n.to ?? null;
		if (e != null) return String(e);
	}
	return K(e, t);
}
function ve(e) {
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
function ye(e) {
	let t = [], n = /* @__PURE__ */ new Set();
	for (let r of ve(e)) {
		let i = _e(r, e?.graph ?? W());
		if (!i || n.has(i)) continue;
		let a = G(i);
		a && (n.add(i), t.push(a));
	}
	return t;
}
function q(e) {
	let t = e ? String(e.id ?? "") : "", n = e && L(e) || "";
	O?.(t, n);
}
function J() {
	let e = U(), t = e[0] || null, n = t ? String(t.id ?? "") : null;
	return n === T ? n || (T = null) : (T = n, q(t)), e;
}
function be(e) {
	if (!e) return null;
	let t = e.imgs;
	if (!Array.isArray(t) || t.length === 0) return null;
	let n = t[t.length - 1]?.src || t[0]?.src;
	if (!n) return null;
	let r = R(n);
	return r?.filename ? H(e, {
		...r,
		kind: "image"
	}, "canvas") : null;
}
function xe(e) {
	if (!e || !Array.isArray(e.widgets)) return null;
	for (let t of e.widgets) {
		let n = t?.element;
		if (!n) continue;
		let r = typeof HTMLVideoElement < "u" && n instanceof HTMLVideoElement ? n : n.querySelector?.("video");
		if (r?.src) {
			let t = R(r.src);
			if (t?.filename) return H(e, {
				...t,
				kind: "video"
			}, "widget");
		}
		let i = typeof HTMLImageElement < "u" && n instanceof HTMLImageElement ? n : n.querySelector?.("img");
		if (!i?.src) continue;
		let a = R(i.src);
		if (a?.filename) return H(e, {
			...a,
			kind: "image"
		}, "widget");
	}
	return null;
}
function Se(e) {
	if (!e || !Array.isArray(e.widgets) || !e.widgets.length) return null;
	let t = String(L(e) || "").toLowerCase(), n = e.widgets[0]?.value;
	if (typeof n != "string") return null;
	let r = z(n);
	if (!r?.filename) return null;
	let i = B(r.filename), a = N.has(i) || P.has(i), o = /(load|upload|loader|fromurl|folder|input)/.test(t);
	return !a && !o ? null : H(e, {
		...r,
		type: "input",
		kind: V(e, r.filename)
	}, "widget-value");
}
function Y(e) {
	return le(e) || me(e) || be(e) || xe(e) || Se(e);
}
function Ce(e) {
	if (!e) return null;
	let t = String(e.id ?? ""), n = L(e) || "", r = [{
		node: e,
		depth: 0
	}], i = new Set(t ? [t] : []), a = 0;
	for (; r.length > 0 && a < I;) {
		let e = r.shift();
		if (!e?.node) continue;
		a += 1;
		let o = Y(e.node);
		if (o) {
			let r = o._nodeId || String(e.node.id ?? ""), i = o._classType || L(e.node) || "";
			return {
				...o,
				_nodeId: t || r,
				_classType: n || i,
				_previewNodeId: r,
				_previewClassType: i,
				_source: r === t ? o._source || "canvas" : "graph-downstream"
			};
		}
		if (!(e.depth >= F)) for (let t of ye(e.node)) {
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
	j = null, M = null;
}
function Te() {
	return C === "pinned" ? G(w) : U()[0] || null;
}
function Z({ force: e = !1 } = {}) {
	if (!E || !D || !W()) return;
	let t = Te(), n = t ? String(t.id ?? "") : null;
	if (!n) {
		q(null), X();
		return;
	}
	C === "pinned" && q(t);
	let r = Ce(t);
	if (!r) {
		X();
		return;
	}
	let i = we(r);
	!e && n === M && i === j || (M = n, j = i, D(r));
}
function Q() {
	let e = T;
	J();
	let t = T !== e;
	if (!E) {
		X();
		return;
	}
	Z({ force: C !== "pinned" && t });
}
function Ee() {
	A || (A = setInterval(Q, 150), Q());
}
function $() {
	A &&= (clearInterval(A), null), X();
}
function De(e) {
	try {
		return Y(e) || null;
	} catch {
		return null;
	}
}
function Oe(e, t) {}
function ke({ app: e, onOutput: t, onStatus: n } = {}) {
	D = t || null, O = n || null, k = e || null, e && J(), console.debug("[NodeStream] Controller initialized (selection-only preview mode)");
}
function Ae(e) {
	if (E = !!e, !E) {
		T = null, $();
		return;
	}
	if (X(), J(), A) {
		Q();
		return;
	}
	Ee();
}
function je() {
	return E;
}
function Me(e) {
	let t = e === "pinned" ? "pinned" : "selected";
	C !== t && (C = t, X(), E && Z({ force: !0 }));
}
function Ne() {
	return C;
}
function Pe(e) {
	if (e == null) {
		w = null, C === "pinned" && (C = "selected"), X(), E && Z({ force: !0 });
		return;
	}
	w = String(e), C = "pinned", X(), E && Z({ force: !0 });
}
function Fe() {
	return w;
}
function Ie() {
	return J(), T;
}
function Le(e) {
	E = !1, T = null, w = null, q(null), D = null, O = null, k = null, $(), console.debug("[NodeStream] Controller torn down");
}
//#endregion
export { De as extractNodeFileData, je as getNodeStreamActive, Fe as getPinnedNodeId, Ie as getSelectedNodeId, Ne as getWatchMode, ke as initNodeStream, u as listAdapters, Oe as onNodeOutputs, Pe as pinNode, Ae as setNodeStreamActive, Me as setWatchMode, Le as teardownNodeStream };
