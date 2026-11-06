import { C as e, D as t, It as n, Jn as r, Lt as i, T as a, Wt as o, c as s, dn as c, dr as l, f as u, fr as d, h as f, in as p, ln as m, m as h, r as g, st as _, ur as v, v as y, w as b, xn as x, y as S } from "./client-Cpp57JNr.js";
import { t as C } from "./floatingViewerManager-DEAOVwEA.js";
import { A as ee, N as w, a as T, d as E, i as te, k as D, m as O, n as k, o as ne, p as A, r as j, t as M, v as re, y as N } from "./generationSectionState-CPiwiIRF.js";
import { n as P, t as ie } from "./events-1iwo5blr.js";
import { $ as ae, B as oe, C as F, D as se, E as I, H as ce, J as le, K as L, M as R, O as z, P as B, Q as V, S as ue, T as H, V as de, W as U, X as W, b as fe, gt as G, ht as K, j as pe, k as q, mt as me, ot as he, pt as J, st as Y, y as ge } from "./mjr-primevue-CE8VjDUg.js";
import { n as _e, r as ve } from "./mjr-vue-vendor-pJNm95sb.js";
import { t as ye } from "./viewerOpenRequest-WOJE90Gn.js";
// ui/features/status/AssetStatusDotTheme.ts
function X(e) {
	return String(e || "").trim().toLowerCase();
}
function be({ dot: e = null, asset: t = null, scope: n = "" } = {}) {
	let r = X(n);
	if (r) return r === "custom";
	let i = X(t?.type || t?.scope);
	if (i) return i === "custom";
	try {
		let t = X(e?.closest?.(".mjr-grid")?.dataset?.mjrScope);
		if (t) return t === "custom";
	} catch (e) {
		console.debug?.(e);
	}
	return !1;
}
function xe(e, t = {}) {
	let n = X(e);
	return be(t) ? n === "pending" || n === "info" ? "var(--mjr-browser-status-info, #4DB6AC)" : n === "success" ? "var(--mjr-browser-status-success, #2E7D32)" : n === "warning" ? "var(--mjr-browser-status-warning, #FFB74D)" : n === "error" ? "var(--mjr-browser-status-error, #EF5350)" : "var(--mjr-browser-status-neutral, #90A4AE)" : n === "pending" || n === "info" ? "var(--mjr-status-info, #64B5F6)" : n === "success" ? "var(--mjr-status-success, #4CAF50)" : n === "warning" ? "var(--mjr-status-warning, #FFA726)" : n === "error" ? "var(--mjr-status-error, #f44336)" : "var(--mjr-status-neutral, #666)";
}
// ui/stores/useRuntimeStore.ts
var Se = _e("mjr-runtime", () => {
	let e = Y(null), t = Y(null), n = Y(!1), r = Y(0), i = Y(null), a = Y(null), o = Y(null), s = Y(null), c = Y(null), l = Y([]), u = H(() => !!i.value), d = H(() => {
		let e = s.value, t = c.value;
		return !t || t <= 0 || e == null ? 0 : Math.round(e / t * 100);
	});
	function f(t) {
		e.value = t;
	}
	function p(e) {
		t.value = e;
	}
	function m(e, t) {
		n.value = !!e, r.value = Math.max(0, Number(t || 0) || 0);
	}
	function h() {
		return {
			active: n.value,
			queueLength: r.value
		};
	}
	function g(e = {}) {
		e.active_prompt_id !== void 0 && (i.value = e.active_prompt_id), e.queue_remaining !== void 0 && (a.value = e.queue_remaining), e.progress_node !== void 0 && (o.value = e.progress_node), e.progress_value !== void 0 && (s.value = e.progress_value), e.progress_max !== void 0 && (c.value = e.progress_max), e.cached_nodes !== void 0 && (l.value = e.cached_nodes ?? []);
	}
	function _() {
		i.value = null, a.value = null, o.value = null, s.value = null, c.value = null, l.value = [];
	}
	return {
		comfyApp: e,
		comfyApi: t,
		enrichmentActive: n,
		enrichmentQueueLength: r,
		activePromptId: i,
		queueRemaining: a,
		progressNode: o,
		progressValue: s,
		progressMax: c,
		cachedNodes: l,
		isExecuting: u,
		progressPercent: d,
		setComfyApp: f,
		setComfyApi: p,
		setEnrichmentState: m,
		getEnrichmentState: h,
		applyExecutionStatus: g,
		resetExecution: _
	};
});
// ui/stores/getOptionalRuntimeStore.ts
function Ce() {
	try {
		return ve() ? Se() : null;
	} catch {
		return null;
	}
}
// ui/stores/runtimeEnrichmentState.ts
var we = Symbol.for("majoor.assets_manager.runtime_state");
function Te() {
	return {
		api: null,
		assetsDeletedHandler: null,
		enrichmentActive: !1,
		enrichmentQueueLength: 0
	};
}
function Ee() {
	try {
		let e = typeof globalThis < "u" ? globalThis : {};
		return e[we] && typeof e[we] == "object" || (e[we] = Te()), e[we];
	} catch {
		return Te();
	}
}
function De(e, t) {
	let n = Ce();
	if (n) {
		n.setEnrichmentState(e, t);
		return;
	}
	let r = Ee();
	r.enrichmentActive = !!e, r.enrichmentQueueLength = Math.max(0, Number(t || 0) || 0);
}
function Oe() {
	let e = Ce();
	if (e) return e.getEnrichmentState();
	let t = Ee();
	return {
		active: !!t.enrichmentActive,
		queueLength: Math.max(0, Number(t.enrichmentQueueLength || 0) || 0)
	};
}
// ui/components/Badges.ts
function ke({ ext: e = "", filename: t = "", count: n = 0, paths: r = [] } = {}) {
	let i = String(e || "").trim(), a = String(t || "").trim(), o = Math.max(0, Number(n) || 0), s = Array.isArray(r) ? r.map((e) => String(e || "").trim()).filter(Boolean) : [];
	if (o < 2) return `${i} file`;
	let c = [`${i}+ name collision in current view (${o})`];
	if (a && c.push(`Name: ${a}`), s.length) {
		c.push("Paths:");
		for (let e of s.slice(0, 4)) c.push(`- ${e}`);
		s.length > 4 && c.push(`- ... +${s.length - 4} more`);
	}
	return c.push("Click to select collisions in current view"), c.join("\n");
}
function Ae(e, t, n = null) {
	if (e) try {
		let r = e.dataset?.mjrExt || "", i = e.dataset?.mjrBadgeBg || "var(--mjr-badge-image, #607D8B)";
		e.textContent = String(r || "") + (t ? "+" : ""), e.title = t ? ke({
			ext: r,
			filename: n?.filename || "",
			count: n?.count,
			paths: n?.paths
		}) : `${r} file`, e.style.background = t ? "var(--mjr-badge-duplicate-alert, #ff1744)" : i, e.style.cursor = t ? "pointer" : "default";
	} catch (e) {
		console.debug?.(e);
	}
}
function je(e) {
	return e === !0 ? !0 : e === !1 ? !1 : e === 1 || e === "1" ? !0 : e === 0 || e === "0" ? !1 : null;
}
function Me(e, t = []) {
	if (!e || typeof e != "object") return null;
	for (let n of t) if (e[n] != null) return e[n];
	return null;
}
function Ne(e) {
	return typeof e == "string" && e.trim().length > 0;
}
function Pe(e) {
	if (Array.isArray(e)) return e.some((e) => String(e ?? "").trim().length > 0);
	if (e && typeof e == "object") return Object.keys(e).length > 0;
	if (typeof e != "string") return !1;
	let t = e.trim();
	if (!t || t === "[]" || t === "[ ]" || /^(null|none)$/i.test(t)) return !1;
	if (t.startsWith("[") && t.endsWith("]") || t.startsWith("{") && t.endsWith("}")) try {
		let e = JSON.parse(t);
		return Array.isArray(e) ? e.some((e) => String(e ?? "").trim().length > 0) : e && typeof e == "object" ? Object.keys(e).length > 0 : !!e;
	} catch (e) {
		console.debug?.(e);
	}
	return !0;
}
function Fe(e) {
	let t = Me(e, [
		"auto_tags",
		"autoTags",
		"ai_auto_tags",
		"aiAutoTags",
		"suggested_tags",
		"suggestedTags"
	]), n = Me(e, [
		"enhanced_caption",
		"enhancedCaption",
		"enhanced_prompt",
		"enhancedPrompt",
		"ai_enhanced_prompt",
		"aiEnhancedPrompt"
	]), r = je(Me(e, [
		"has_ai_auto_tags",
		"hasAiAutoTags",
		"ai_has_auto_tags",
		"aiHasAutoTags"
	])), i = je(Me(e, [
		"has_ai_enhanced_caption",
		"hasAiEnhancedCaption",
		"ai_has_enhanced_caption",
		"aiHasEnhancedCaption"
	])), a = je(Me(e, [
		"has_ai_vector",
		"hasAiVector",
		"has_vector_embedding",
		"hasVectorEmbedding",
		"vector_indexed",
		"vectorIndexed"
	])), o = je(Me(e, [
		"has_ai_info",
		"hasAiInfo",
		"ai_indexed",
		"aiIndexed"
	])), s = r === !0 || r === null && Pe(t), c = i === !0 || i === null && Ne(n), l = a === !0 || o === !0;
	return {
		hasAiInfo: o === !0 || s || c || l,
		hasAutoTags: s,
		hasEnhancedPrompt: c,
		hasVectorIndexed: l
	};
}
function Ie(e) {
	let t = document.createElement("span");
	t.className = "mjr-workflow-dot mjr-asset-status-dot";
	let n = je(e?.has_workflow ?? e?.hasWorkflow), r = je(e?.has_generation_data ?? e?.hasGenerationData), i = Oe(), a = i.queueLength, o = i.active || a > 0, s = "Pending: parsing metadata...", c = n === !0 || r === !0, l = n === !1 || r === !1, u = n === null || r === null;
	n === !0 && r === !0 ? s = "Complete: workflow + generation data detected" : c ? s = n === !0 ? "Partial: workflow only (generation data missing)" : "Partial: generation data only (workflow missing)" : l && !c && !u ? s = "None: no workflow or generation data found" : u && (s = "Pending: metadata not parsed yet");
	let d = u ? "pending" : n === !0 && r === !0 ? "success" : c ? "warning" : "error";
	o && d !== "success" && (d = "pending", s = a > 0 ? `Pending: database metadata enrichment in progress (${a} queued)` : "Pending: database metadata enrichment in progress"), Le(t, d, s, { asset: e });
	let f = Fe(e);
	if (f.hasAiInfo) {
		let e = [];
		f.hasVectorIndexed && e.push("vector indexed"), f.hasAutoTags && e.push("AI tag suggestions"), f.hasEnhancedPrompt && e.push("enhanced prompt"), t.textContent = "";
		let n = document.createElement("i");
		n.className = "pi pi-sparkles", n.setAttribute("aria-hidden", "true"), n.style.fontSize = "11px", n.style.lineHeight = "1", t.appendChild(n);
		try {
			t.dataset.mjrAi = "1";
		} catch (e) {
			console.debug?.(e);
		}
		t.title = `${s}\nAI: ${e.length ? e.join(", ") : "indexed"}\nClick to rescan this file`;
	} else {
		try {
			t.dataset.mjrAi = "0";
		} catch (e) {
			console.debug?.(e);
		}
		t.textContent = "●", t.title = `${s}\nClick to rescan this file`;
	}
	return t;
}
function Le(e, t, n = "", r = {}) {
	if (!e) return;
	let i = String(t || "").toLowerCase(), a = xe(i, {
		dot: e,
		...r || {}
	});
	try {
		e.dataset.mjrStatus = i || "neutral";
	} catch (e) {
		console.debug?.(e);
	}
	if (e.style.cssText = `
        color: ${a};
        margin-left: 4px;
        font-size: 12px;
        line-height: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: color 0.25s ease, opacity 0.25s ease;
    `, n) try {
		e.title = String(n);
	} catch (e) {
		console.debug?.(e);
	}
}
function Re(e) {
	let t = Math.max(0, Math.min(5, Number(e) || 0));
	if (t <= 0) return null;
	let n = document.createElement("div");
	n.className = "mjr-rating-badge", n.title = `Rating: ${t} star${t > 1 ? "s" : ""}`, n.style.cssText = "\n        position: absolute;\n        top: 6px;\n        right: 6px;\n        background: rgba(0, 0, 0, 0.55);\n        border: 1px solid rgba(255, 255, 255, 0.12);\n        padding: 2px 6px;\n        border-radius: 6px;\n        font-size: 13px;\n        letter-spacing: 1px;\n        display: inline-flex;\n        align-items: center;\n        justify-content: center;\n        pointer-events: none;\n        z-index: 10;\n        text-shadow: 0 2px 6px rgba(0,0,0,0.6);\n        box-shadow: 0 6px 18px rgba(0,0,0,0.25);\n    ";
	for (let e = 1; e <= t; e++) {
		let r = document.createElement("span");
		r.textContent = "★", r.style.color = "var(--mjr-rating-color, var(--mjr-star-active, #FFD45A))", r.style.marginRight = e < t ? "2px" : "0", n.appendChild(r);
	}
	return n;
}
function ze(e) {
	if (Array.isArray(e)) return e.map((e) => String(e ?? "").trim()).filter(Boolean);
	if (typeof e == "string") {
		let t = e.trim();
		if (!t) return [];
		try {
			let e = JSON.parse(t);
			if (Array.isArray(e)) return e.map((e) => String(e ?? "").trim()).filter(Boolean);
		} catch {}
		return t.split(",").map((e) => e.trim()).filter(Boolean);
	}
	return [];
}
function Be(e) {
	let t = Number(e) / 1e3;
	return t >= 60 ? "#FF9800" : t >= 30 ? "#FFC107" : t >= 10 ? "#8BC34A" : "#4CAF50";
}
function Ve(e) {
	let t = e / 1e3;
	if (t >= 60) {
		let e = (t / 60).toFixed(1);
		return {
			text: `${e}m`,
			title: `Generation time: ${e} minutes (${t.toFixed(1)}s)`
		};
	}
	let n = t.toFixed(1);
	return {
		text: `${n}s`,
		title: `Generation time: ${n} seconds`
	};
}
function He(e, { maxMs: t = 864e5 } = {}) {
	let n;
	if (e == null) return 0;
	if (typeof e == "string") {
		let t = e.trim().toLowerCase();
		if (!t) return 0;
		let r = t.match(/^(-?\d+(?:[.,]\d+)?)\s*(s|sec|secs|second|seconds)$/i);
		if (r) n = Number(r[1].replace(",", ".")) * 1e3;
		else {
			let e = t.match(/^(-?\d+(?:[.,]\d+)?)\s*(ms|msec|millisecond|milliseconds)$/i);
			n = Number(e ? e[1].replace(",", ".") : t.replace(",", "."));
		}
	} else n = Number(e);
	return !Number.isFinite(n) || n <= 0 || n >= Number(t) ? 0 : n;
}
function Ue(e) {
	let t = document.createElement("div");
	t.className = "mjr-tags-badge";
	let n = ze(e);
	return n.length === 0 ? (t.style.display = "none", t) : (t.textContent = n.join(", "), t.title = `Tags: ${n.join(", ")}`, t.style.cssText = "\n        position: absolute;\n        bottom: 6px;\n        left: 6px;\n        padding: 3px 6px;\n        border-radius: 4px;\n        background: rgba(0,0,0,0.8);\n        color: var(--mjr-tag-color, #90CAF9);\n        font-size: 9px;\n        max-width: 80%;\n        overflow: hidden;\n        text-overflow: ellipsis;\n        white-space: nowrap;\n        pointer-events: none;\n        z-index: 10;\n        box-shadow: 0 2px 4px rgba(0,0,0,0.3);\n    ", t);
}
// ui/features/contextmenu/gridContextMenuState.ts
function We() {
	return {
		open: !1,
		x: 0,
		y: 0,
		items: [],
		title: ""
	};
}
var Z = he({
	portalOwnerId: "",
	mountedPortalIds: [],
	main: We(),
	submenu: We(),
	tags: {
		open: !1,
		x: 0,
		y: 0,
		asset: null,
		assets: null,
		onChanged: null
	}
}), Ge = 1;
function Ke(e) {
	e && (e.open = !1, e.x = 0, e.y = 0, e.items = [], e.title = "");
}
function qe(e = "") {
	try {
		window.dispatchEvent(new CustomEvent("mjr-close-all-menus", { detail: { source: String(e || "") } }));
	} catch (e) {
		console.debug?.(e);
	}
}
function Je() {
	let e = `mjr-grid-context-menu-portal-${Ge++}`;
	return Z.mountedPortalIds.push(e), Z.portalOwnerId ||= e, e;
}
function Ye(e) {
	let t = Z.mountedPortalIds.filter((t) => t !== e);
	Z.mountedPortalIds.splice(0, Z.mountedPortalIds.length, ...t), Z.portalOwnerId === e && (Z.portalOwnerId = Z.mountedPortalIds[0] || "");
}
function Xe(e) {
	return String(Z.portalOwnerId || "") === String(e || "");
}
function Ze({ x: e = 0, y: t = 0, items: n = [], title: r = "" } = {}) {
	qe("grid"), nt(), et(), Z.main.open = !0, Z.main.x = Number(e) || 0, Z.main.y = Number(t) || 0, Z.main.items = Array.isArray(n) ? n.filter(Boolean) : [], Z.main.title = String(r || "");
}
function Qe() {
	Ke(Z.main), et();
}
function $e({ x: e = 0, y: t = 0, items: n = [], title: r = "" } = {}) {
	Z.submenu.open = !0, Z.submenu.x = Number(e) || 0, Z.submenu.y = Number(t) || 0, Z.submenu.items = Array.isArray(n) ? n.filter(Boolean) : [], Z.submenu.title = String(r || "");
}
function et() {
	Ke(Z.submenu);
}
function tt({ x: e = 0, y: t = 0, asset: n = null, assets: r = null, onChanged: i = null } = {}) {
	Qe();
	let a = Array.isArray(r) && r.length > 1 ? r : null;
	Z.tags.open = !!(n || a), Z.tags.x = Number(e) || 0, Z.tags.y = Number(t) || 0, Z.tags.asset = a ? a[0] || null : n || null, Z.tags.assets = a, Z.tags.onChanged = typeof i == "function" ? i : null;
}
function nt() {
	Z.tags.open = !1, Z.tags.x = 0, Z.tags.y = 0, Z.tags.asset = null, Z.tags.assets = null, Z.tags.onChanged = null;
}
function rt() {
	Qe(), nt();
}
// ui/features/dnd/utils/constants.ts
var it = "application/x-mjr-asset", at = "application/x-mjr-assets", ot = "application/x-comfy-asset-info", st = /* @__PURE__ */ new Set([
	".png",
	".jpg",
	".jpeg",
	".webp",
	".gif",
	".bmp",
	".tif",
	".tiff",
	".avif",
	".jxl"
]), ct = /* @__PURE__ */ new Set([
	".mp4",
	".mov",
	".mkv",
	".webm",
	".avi",
	".m4v"
]), lt = /* @__PURE__ */ new Set([
	".wav",
	".mp3",
	".flac",
	".ogg",
	".m4a",
	".aac",
	".opus"
]), ut = /* @__PURE__ */ new Set([
	".obj",
	".fbx",
	".glb",
	".gltf",
	".stl",
	".ply",
	".splat",
	".ksplat",
	".spz"
]), dt = (e) => {
	if (!e) return !1;
	let t = e.lastIndexOf(".");
	return t !== -1 && st.has(e.slice(t).toLowerCase());
}, ft = (e) => e ? String(e.kind || "").toLowerCase() === "image" || dt(e.filename) : !1, Q = (e) => {
	if (!e) return !1;
	let t = e.lastIndexOf(".");
	return t !== -1 && ct.has(e.slice(t).toLowerCase());
}, pt = (e) => e ? String(e.kind || "").toLowerCase() === "video" || Q(e.filename) : !1, mt = (e) => {
	if (!e) return !1;
	let t = e.lastIndexOf(".");
	return t !== -1 && lt.has(e.slice(t).toLowerCase());
}, ht = (e) => e ? String(e.kind || "").toLowerCase() === "audio" || mt(e.filename) : !1, gt = (e) => {
	if (!e) return !1;
	let t = e.lastIndexOf(".");
	return t !== -1 && ut.has(e.slice(t).toLowerCase());
}, _t = (e) => e ? String(e.kind || "").toLowerCase() === "model3d" || gt(e.filename) : !1, vt = (e) => ft(e) || pt(e) || ht(e) || _t(e) || String(e?.kind || "").toLowerCase() === "workflow", yt = {
	mp4: "video/mp4",
	mov: "video/quicktime",
	webm: "video/webm",
	mkv: "video/x-matroska",
	glb: "model/gltf-binary",
	gltf: "model/gltf+json",
	obj: "model/obj",
	stl: "model/stl",
	ply: "application/ply"
}, bt = (e) => yt[String(e || "").split(".").pop()?.toLowerCase()] ?? "application/octet-stream", xt = (e, t) => {
	if (typeof e != "string") return !1;
	let n = e.trim().toLowerCase();
	if (!n) return !1;
	let r = (n.split(/[?#]/)[0].split(".").pop() || "").toLowerCase();
	return r ? t && r === String(t).toLowerCase() ? !0 : ct.has(`.${r}`) : !1;
}, St = (e, t, n) => {
	if (!e || e.type !== "combo" || !e.options) return !1;
	let r = Array.isArray(e.options.values) && e.options.values || e.options.values && Array.isArray(e.options.values.values) && e.options.values.values || null;
	return Array.isArray(r) ? r.some((e) => n(typeof e == "string" ? e : e?.content ?? e?.value ?? e?.text, t)) : !1;
}, Ct = (e, t) => St(e, t, xt), wt = (e, t) => {
	if (typeof e != "string") return !1;
	let n = e.trim().toLowerCase();
	if (!n) return !1;
	let r = (n.split(/[?#]/)[0].split(".").pop() || "").toLowerCase();
	return r ? t && r === String(t).toLowerCase() ? !0 : st.has(`.${r}`) : !1;
}, Tt = (e, t) => St(e, t, wt), Et = (e, t) => {
	if (typeof e != "string") return !1;
	let n = e.trim().toLowerCase();
	if (!n) return !1;
	let r = (n.split(/[?#]/)[0].split(".").pop() || "").toLowerCase();
	return r ? t && r === String(t).toLowerCase() ? !0 : lt.has(`.${r}`) : !1;
}, Dt = (e, t) => St(e, t, Et), Ot = (e, t) => {
	if (typeof e != "string") return !1;
	let n = e.trim().toLowerCase();
	if (!n) return !1;
	let r = (n.split(/[?#]/)[0].split(".").pop() || "").toLowerCase();
	return r ? t && r === String(t).toLowerCase() ? !0 : ut.has(`.${r}`) : !1;
}, kt = (e, t) => St(e, t, Ot), At = /* @__PURE__ */ new WeakMap(), jt = (e) => {
	if (!e || typeof e != "object") return {
		node: null,
		prev: null
	};
	let t = At.get(e);
	return t || (t = {
		node: null,
		prev: null
	}, At.set(e, t)), t;
}, Mt = (e, t, n) => {
	let r = e?.canvas?.canvas || document.querySelector("canvas"), i = e?.canvas?.graph, a = e?.canvas?.ds;
	if (!r || !i || !a) return null;
	let o = r.getBoundingClientRect();
	if (t < o.left || t > o.right || n < o.top || n > o.bottom) return null;
	let s = Number(a.scale) || 1, c = a.offset || [0, 0], l = Array.isArray(c) ? Number(c[0]) || 0 : Number(c?.x) || 0, u = Array.isArray(c) ? Number(c[1]) || 0 : Number(c?.y) || 0, d = (t - o.left) / s - l, f = (n - o.top) / s - u;
	if (typeof i.getNodeOnPos == "function") return i.getNodeOnPos(d, f);
	let p = i._nodes || [];
	for (let e = p.length - 1; e >= 0; e--) {
		let t = p[e];
		if (!t?.pos || !t?.size) continue;
		let n = t.size[0], r = t.size[1];
		if (t.flags && t.flags.collapsed && (r = 30), d >= t.pos[0] && f >= t.pos[1] && d <= t.pos[0] + n && f <= t.pos[1] + r) return t;
	}
	return null;
}, Nt = (e, t, n) => {
	let r = jt(e);
	t && r.node !== t && (Pt(e, n), r.node = t, r.prev = {
		color: t.color,
		bgcolor: t.bgcolor
	}, t.bgcolor = "#3355ff", t.color = "#a9c4ff", n(e));
}, Pt = (e, t) => {
	let n = jt(e);
	if (n.node) {
		try {
			n.prev && (n.node.color = n.prev.color, n.node.bgcolor = n.prev.bgcolor);
		} catch (e) {
			console.debug?.(e);
		}
		n.node = null, n.prev = null, t(e);
	}
}, Ft = (e, t) => {
	if (!e || e.type !== "combo" || !e.options) return;
	let n = e.options.values, r = e.options;
	if (typeof n != "function") {
		if (!Array.isArray(n)) {
			if (n && typeof n == "object" && Array.isArray(n.values)) r = n, n = n.values;
			else return;
		}
		n.some((e) => typeof e == "string" ? e === t : (e?.content ?? e?.value ?? e?.text) === t) || (n.length === 0 || typeof n[0] == "string" ? n.unshift(t) : n.unshift({
			content: t,
			text: t,
			value: t
		}), r.values = n);
	}
}, It = /* @__PURE__ */ new Set([
	"number",
	"int",
	"float",
	"boolean",
	"toggle",
	"checkbox",
	"button",
	"hidden"
]), Lt = [
	"output",
	"save",
	"export",
	"folder",
	"dir"
], Rt = ["file", "path"], zt = [
	"path",
	"file",
	"input",
	"src",
	"source"
], Bt = (e, t, n) => {
	let r = e?.widgets;
	if (!Array.isArray(r) || !r.length) return null;
	let i = String(t || "").toLowerCase().replace(/^\./, ""), a = String(e?.type || "").toLowerCase(), o = n.knownNodeIncludes.some((e) => a.includes(e)), s = [];
	for (let e of r) {
		if (!e) continue;
		let t = String(e?.type || "").toLowerCase(), r = e?.value;
		if (It.has(t) || typeof r == "number" || typeof r == "boolean") continue;
		let a = t === "text" || t === "string" || t === "combo", c = typeof e?.callback == "function" && typeof r == "string";
		if (!a && !c) continue;
		let l = String(e?.name || e?.label || "").toLowerCase().trim(), u = 0;
		n.exactNames.has(l) && (u += 100), l === "file" && o && t === "combo" && n.comboChecker(e, i) && (u += 100);
		let d = n.mediaTerms.some((e) => l.includes(e)), f = zt.some((e) => l.includes(e));
		d && f && (u += 80), Rt.some((e) => l.includes(e)) && (u += 35);
		for (let { terms: e, score: t } of n.extraTerms) e.some((e) => l.includes(e)) && (u += t);
		Lt.some((e) => l.includes(e)) && (u -= 90), n.exactSingleNames.has(l) && (typeof r == "string" && r.trim() === "" || n.looksLikeFn(r, i) ? u += 25 : u -= 10), o && (u += 15);
		let p = typeof r == "string" && r.trim() === "";
		p && (u += 3), t === "combo" && n.comboChecker(e, i) && (u += 12), s.push({
			w: e,
			score: u,
			emptyValue: p,
			combo: t === "combo"
		});
	}
	if (!s.length) return null;
	s.sort((e, t) => t.score === e.score ? t.emptyValue === e.emptyValue ? t.combo === e.combo ? 0 : t.combo ? 1 : -1 : t.emptyValue ? 1 : -1 : t.score - e.score);
	let c = s[0];
	if (!c || c.score < 20) return null;
	try {
		c.w[n.scoreKey] = c.score;
	} catch (e) {
		console.debug?.(e);
	}
	return c.w;
}, Vt = {
	exactNames: /* @__PURE__ */ new Set([
		"video_path",
		"input_video",
		"source_video",
		"video",
		"driven_video",
		"footage",
		"input_path",
		"directory",
		"folder_path",
		"folder",
		"path",
		"video_directory"
	]),
	knownNodeIncludes: [
		"loadvideo",
		"vhs_loadvideo",
		"videoloader",
		"sadtalker",
		"wav2lip",
		"reactor",
		"multiimageloader",
		"ltxdirector",
		"ltxsequencer",
		"ltxkeyframer"
	],
	mediaTerms: [
		"video",
		"footage",
		"clip",
		"movie"
	],
	extraTerms: [{
		terms: [
			"media",
			"clip",
			"footage",
			"drive"
		],
		score: 45
	}],
	exactSingleNames: /* @__PURE__ */ new Set(["video"]),
	looksLikeFn: xt,
	comboChecker: Ct,
	scoreKey: "__mjrVideoPickScore"
}, Ht = {
	exactNames: /* @__PURE__ */ new Set([
		"image",
		"image_path",
		"input_image",
		"source_image",
		"ref_image",
		"pose_image",
		"hint_image",
		"target_image",
		"ipadapter_image",
		"input_path",
		"directory",
		"folder_path",
		"folder",
		"path",
		"image_directory"
	]),
	knownNodeIncludes: [
		"loadimage",
		"loadimagemask",
		"imageloader",
		"reactor",
		"roop",
		"ipadapter",
		"controlnet",
		"instantid",
		"pulid",
		"multiimageloader",
		"ltxdirector",
		"ltxsequencer",
		"ltxkeyframer"
	],
	mediaTerms: [
		"image",
		"img",
		"mask",
		"frame",
		"photo",
		"picture",
		"face",
		"ipadapter"
	],
	extraTerms: [{
		terms: [
			"media",
			"source",
			"first",
			"last",
			"target",
			"reference"
		],
		score: 35
	}],
	exactSingleNames: /* @__PURE__ */ new Set(["image", "face"]),
	looksLikeFn: wt,
	comboChecker: Tt,
	scoreKey: "__mjrImagePickScore"
}, Ut = {
	exactNames: /* @__PURE__ */ new Set([
		"audio_path",
		"input_audio",
		"source_audio",
		"audio",
		"driven_audio",
		"voice",
		"bgm",
		"soundtrack",
		"input_path",
		"directory",
		"folder_path",
		"folder",
		"path",
		"audio_directory"
	]),
	knownNodeIncludes: [
		"loadaudio",
		"vhs_loadaudioupload",
		"vhs_loadaudio",
		"audioloader",
		"inputaudio",
		"sadtalker",
		"wav2lip",
		"multiimageloader",
		"ltxdirector",
		"ltxsequencer",
		"ltxkeyframer"
	],
	mediaTerms: [
		"audio",
		"sound",
		"music",
		"voice",
		"speech",
		"wav",
		"mp3"
	],
	extraTerms: [{
		terms: [
			"media",
			"track",
			"drive"
		],
		score: 45
	}],
	exactSingleNames: /* @__PURE__ */ new Set(["audio", "voice"]),
	looksLikeFn: Et,
	comboChecker: Dt,
	scoreKey: "__mjrAudioPickScore"
}, Wt = {
	exactNames: /* @__PURE__ */ new Set([
		"model_path",
		"input_model",
		"source_model",
		"mesh_path",
		"input_mesh",
		"geometry_path",
		"scene_path",
		"point_cloud_path",
		"splat_path",
		"model",
		"mesh",
		"geometry",
		"input_path",
		"directory",
		"folder_path",
		"folder",
		"path",
		"model_directory"
	]),
	knownNodeIncludes: [
		"load3d",
		"loadmodel",
		"loadmesh",
		"loadobj",
		"loadgltf",
		"loadglb",
		"loadstl",
		"loadply",
		"pointcloud",
		"meshloader",
		"modelloader",
		"tripo3d",
		"unique3d",
		"multiimageloader",
		"ltxdirector",
		"ltxsequencer",
		"ltxkeyframer"
	],
	mediaTerms: [
		"model",
		"mesh",
		"geometry",
		"scene",
		"object",
		"point",
		"cloud",
		"splat"
	],
	extraTerms: [{
		terms: ["asset", "resource"],
		score: 30
	}],
	exactSingleNames: /* @__PURE__ */ new Set([
		"model",
		"mesh",
		"geometry"
	]),
	looksLikeFn: Ot,
	comboChecker: kt,
	scoreKey: "__mjrModel3DPickScore"
}, Gt = (e, t, n) => {
	let r = String(t?.kind || "").toLowerCase();
	return Bt(e, n, r === "model3d" ? Wt : r === "audio" ? Ut : r === "image" ? Ht : Vt);
}, Kt = (e, t, n, r) => {
	if (!t || !t.inputs || !t.inputs.length) return null;
	let i = e?.canvas?.canvas || document.querySelector("canvas"), a = e?.canvas?.ds;
	if (!i || !a) return null;
	let o = i.getBoundingClientRect(), s = Number(a.scale) || 1, c = a.offset || [0, 0], l = Array.isArray(c) ? Number(c[0]) || 0 : Number(c?.x) || 0, u = Array.isArray(c) ? Number(c[1]) || 0 : Number(c?.y) || 0, d = (n - o.left) / s - l, f = (r - o.top) / s - u, p = t.pos[0], m = t.pos[1], h = t.constructor.title_height || 30;
	for (let e = 0; e < t.inputs.length; e++) {
		let n = t.inputs[e], r = m + h + e * 20 + 10, i = d - p, a = f - r;
		if (Math.abs(i) <= 18 && Math.abs(a) <= 12) return {
			index: e,
			input: n
		};
	}
	return null;
}, qt = (e) => {
	let t = e?.canvas?.canvas || document.querySelector("canvas");
	return t ? t.getBoundingClientRect() : null;
}, Jt = (e, t) => {
	let n = qt(e);
	if (!n) return !1;
	let r = t.clientX, i = t.clientY;
	return r >= n.left && r <= n.right && i >= n.top && i <= n.bottom;
}, Yt = (e) => {
	try {
		e?.graph?.setDirtyCanvas?.(!0, !0);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		e?.canvas?.setDirty?.(!0, !0);
	} catch (e) {
		console.debug?.(e);
	}
}, Xt = (e) => {
	let t = String(e?.filename || ""), n = t.lastIndexOf(".");
	return n >= 0 ? t.slice(n).toLowerCase() : "";
}, Zt = (e) => {
	let t = String(e?.kind || "").toLowerCase(), n = Xt(e);
	return t === "image" || st.has(n) ? ["LoadImage"] : t === "video" || ct.has(n) ? [
		"LoadVideo",
		"VHS_LoadVideo",
		"VideoLoader"
	] : t === "audio" || lt.has(n) ? [
		"LoadAudio",
		"VHS_LoadAudioUpload",
		"VHS_LoadAudio",
		"AudioLoader"
	] : t === "model3d" || ut.has(n) ? [
		"Load3D",
		"LoadModel",
		"LoadMesh",
		"LoadGLB",
		"LoadOBJ",
		"LoadSTL",
		"LoadPLY"
	] : [];
}, Qt = (e, t) => {
	if (e) {
		e.type === "combo" && Ft(e, t), e.value = t;
		try {
			e.callback?.(e.value);
		} catch (e) {
			console.debug?.(e);
		}
		try {
			typeof e.onchange == "function" && e.onchange(t);
		} catch (e) {
			console.debug?.(e);
		}
	}
}, $t = (e) => {
	let t = e?.canvas?.canvas || document.querySelector("canvas"), n = t?.getBoundingClientRect?.(), r = n ? Number(n.width || n.right - n.left) : 0, i = n ? Number(n.height || n.bottom - n.top) : 0, a = Number(r || t?.width || 800), o = Number(i || t?.height || 600);
	if (!n) return [Math.max(0, a / 2), Math.max(0, o / 2)];
	let s = n && Number(n.left) || 0, c = n && Number(n.top) || 0;
	return en(e, s + Math.max(0, a / 2), c + Math.max(0, o / 2));
}, en = (e, t, n) => {
	let r = (e?.canvas?.canvas || document.querySelector("canvas"))?.getBoundingClientRect?.(), i = e?.canvas?.ds || {}, a = Number(i.scale) || 1, o = i.offset || [0, 0], s = Array.isArray(o) ? Number(o[0]) || 0 : Number(o?.x) || 0, c = Array.isArray(o) ? Number(o[1]) || 0 : Number(o?.y) || 0;
	return !r || !Number.isFinite(Number(t)) || !Number.isFinite(Number(n)) ? $t(e) : [(Number(t) - r.left) / a - s, (Number(n) - r.top) / a - c];
}, tn = (e, t = null) => {
	if (Number.isFinite(Number(t?.clientX)) && Number.isFinite(Number(t?.clientY))) return en(e, t.clientX, t.clientY);
	try {
		let n = e?.canvas?.convertEventToCanvasOffset?.(t);
		if (Array.isArray(n)) return [Number(n[0]) || 0, Number(n[1]) || 0];
	} catch (e) {
		console.debug?.(e);
	}
	return en(e, t?.clientX, t?.clientY);
}, nn = ({ app: e, payload: t, relativePath: n, event: r = null, droppedExt: i = "", position: a = null }) => {
	let o = e?.graph ?? e?.canvas?.graph ?? null;
	if (!o || typeof o.add != "function") return !1;
	let s = null;
	for (let n of Zt(t)) try {
		if (s = c(n, e), s) break;
	} catch (e) {
		console.debug?.(e);
	}
	if (!s) return !1;
	s.pos = Array.isArray(a) ? [Number(a[0]) || 0, Number(a[1]) || 0] : tn(e, r), o.add(s);
	let l = Gt(s, t, i);
	return l && Qt(l, n), Yt(e), !0;
}, rn = ({ app: e, items: t = [], event: n = null, gap: r = 90 }) => {
	let i = Array.isArray(t) ? t.filter(Boolean) : [];
	if (!i.length) return 0;
	let a = tn(e, n), o = 0;
	for (let t of i) nn({
		app: e,
		payload: t.payload,
		relativePath: t.relativePath,
		event: n,
		droppedExt: t.droppedExt,
		position: [a[0] + o * Number(r || 90), a[1]]
	}) && (o += 1);
	return o;
}, an = Qt, on = ({ app: e, payload: t, relativePath: n, targetNode: r, inputSlotIndex: i, event: a = null }) => {
	let o = e?.graph ?? e?.canvas?.graph ?? null;
	if (!o || typeof o.add != "function" || !r) return !1;
	let s = null;
	for (let n of Zt(t)) try {
		if (s = c(n, e), s) break;
	} catch (e) {
		console.debug?.(e);
	}
	if (!s) return !1;
	let l = Number(r.pos[0]) || 0, u = Number(r.pos[1]) || 0, d = Array.isArray(s.size) && Number(s.size[0]) || 220;
	s.pos = [l - d - 60, u + Number(i) * 20], o.add(s);
	let f = Xt(t), p = Gt(s, t, f);
	p && Qt(p, n);
	try {
		s.connect(0, r, i);
	} catch (e) {
		console.debug?.(e);
	}
	return Yt(e), !0;
}, sn = async ({ post: e, endpoint: t, payload: n, index: r = !0, purpose: i = null }) => {
	let a = {
		index: !!r,
		files: [{
			filename: n.filename,
			subfolder: n.subfolder || "",
			dest_subfolder: "",
			type: n.type || "output",
			root_id: l(n) || void 0
		}]
	};
	return i && (a.purpose = i), e(t, a);
}, cn = async ({ post: e, endpoint: t, payload: n, index: r = !0, purpose: i = null }) => {
	let a = await sn({
		post: e,
		endpoint: t,
		payload: n,
		index: r,
		purpose: i
	});
	if (!a?.ok) return console.warn("Majoor: stage-to-input failed", a?.error || a), null;
	let o = Array.isArray(a.data?.staged) ? a.data.staged[0] : null;
	return o ? {
		relativePath: (o?.subfolder ? `${o.subfolder}/${o.name}` : o?.name) || null,
		absPath: o?.path || null,
		name: o?.name || null,
		subfolder: o?.subfolder || ""
	} : null;
}, ln = async ({ post: e, endpoint: t, payload: n, index: r = !0, purpose: i = null }) => (await cn({
	post: e,
	endpoint: t,
	payload: n,
	index: r,
	purpose: i
}))?.relativePath || null, $ = he({
	open: !1,
	mode: "workflow",
	title: "",
	sourceAsset: null,
	workflow: null,
	items: [],
	resolve: null
});
function un({ title: e = "Select workflow", sourceAsset: t = null } = {}) {
	return fn(null), $.open = !0, $.mode = "workflow", $.title = String(e || "Select workflow"), $.sourceAsset = t || null, $.workflow = null, $.items = [], new Promise((e) => {
		$.resolve = e;
	});
}
function dn({ title: e = "Select asset", workflow: t = null, items: n = [] } = {}) {
	return fn(null), $.open = !0, $.mode = "asset", $.title = String(e || "Select asset"), $.sourceAsset = null, $.workflow = t || null, $.items = Array.isArray(n) ? n.filter(Boolean) : [], new Promise((e) => {
		$.resolve = e;
	});
}
function fn(e = null) {
	let t = $.resolve;
	if ($.open = !1, $.mode = "workflow", $.title = "", $.sourceAsset = null, $.workflow = null, $.items = [], $.resolve = null, typeof t == "function") try {
		t(e || null);
	} catch (e) {
		console.debug?.(e);
	}
}
// ui/utils/format.ts
function pn(e) {
	if (!e) return null;
	let t = Number(e);
	if (!isNaN(t)) return /* @__PURE__ */ new Date(t * 1e3);
	let n = new Date(e);
	return isNaN(n.getTime()) ? null : n;
}
function mn(e) {
	let t = pn(e);
	return t ? `${t.getDate().toString().padStart(2, "0")}/${(t.getMonth() + 1).toString().padStart(2, "0")}` : "";
}
function hn(e) {
	let t = pn(e);
	return t ? `${t.getHours().toString().padStart(2, "0")}:${t.getMinutes().toString().padStart(2, "0")}` : "";
}
function gn(e) {
	return e ? e < 60 ? `${Math.round(e)}s` : `${Math.floor(e / 60)}m ${Math.round(e % 60)}s` : "";
}
var _n = {
	version: 1,
	parser_family_version: "geninfo-catalog-v1",
	sections: [
		{
			key: "file_info",
			title: "File Info",
			searchField: "file",
			aliases: [
				"filename",
				"path",
				"size",
				"resolution"
			]
		},
		{
			key: "prompt",
			title: "Prompt",
			searchField: "prompt",
			aliases: [
				"positive",
				"negative",
				"text"
			]
		},
		{
			key: "model",
			title: "Models",
			searchField: "model",
			aliases: [
				"checkpoint",
				"ckpt",
				"vae",
				"clip"
			]
		},
		{
			key: "sampler",
			title: "Sampling",
			searchField: "sampler",
			aliases: [
				"sampling",
				"scheduler",
				"steps",
				"cfg",
				"seed",
				"denoise"
			]
		},
		{
			key: "lora",
			title: "LoRAs",
			searchField: "lora",
			aliases: ["loras", "lycoris"]
		},
		{
			key: "control",
			title: "Control",
			searchField: "control",
			aliases: [
				"controlnet",
				"adapter",
				"ipadapter"
			]
		},
		{
			key: "upscale",
			title: "Upscaling",
			searchField: "upscale",
			aliases: [
				"upscaler",
				"upscaling",
				"scale"
			]
		},
		{
			key: "workflow_nodes",
			title: "Workflow Nodes",
			searchField: "node",
			aliases: [
				"nodes",
				"workflow_node",
				"workflow_nodes"
			]
		},
		{
			key: "tags",
			title: "Tags",
			searchField: "tag",
			aliases: ["tags", "rating"]
		}
	]
};
function vn() {
	let e = {};
	for (let t of _n.sections) {
		e[t.key] = t.searchField, e[t.searchField] = t.searchField;
		for (let n of t.aliases || []) e[String(n).toLowerCase()] = t.searchField;
	}
	return e;
}
function yn(e) {
	let t = String(e || "").trim().toLowerCase();
	return vn()[t] || "";
}
function bn(e) {
	let t = String(e || "").trim().toLowerCase();
	return t && _n.sections.find((e) => e.key === t) || null;
}
// ui/vue/components/panel/sidebar/SidebarFileInfoSection.vue?vue&type=script&setup=true&lang.ts
var xn = {
	key: 0,
	class: "mjr-sidebar-section",
	style: {
		background: "rgba(255, 255, 255, 0.03)",
		border: "1px solid var(--mjr-border, rgba(255, 255, 255, 0.12))",
		"border-radius": "8px",
		padding: "10px"
	}
}, Sn = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "6px"
} }, Cn = ["title"], wn = ["title"], Tn = /* @__PURE__ */ B({
	__name: "SidebarFileInfoSection",
	props: { asset: {} },
	setup(e) {
		let t = e;
		function n(e) {
			let t = Number(e);
			if (!Number.isFinite(t) || t < 0) return "N/A";
			if (t === 0) return "0 bytes";
			let n = [
				"B",
				"KB",
				"MB",
				"GB"
			], r = 0, i = t;
			for (; i >= 1024 && r < n.length - 1;) i /= 1024, r += 1;
			return r === 0 ? `${Math.round(i)} bytes` : `${i.toFixed(1)} ${n[r]}`;
		}
		function r(e) {
			let t = e?.metadata_raw;
			if (t && typeof t == "object") return t;
			if (typeof t != "string" || !t.trim()) return {};
			try {
				let e = JSON.parse(t);
				return e && typeof e == "object" ? e : {};
			} catch {
				return {};
			}
		}
		function i(...e) {
			return e.find((e) => e != null && e !== "");
		}
		function a(e) {
			if (e == null) return !1;
			let t = String(e).trim();
			return t !== "" && t.toUpperCase() !== "N/A";
		}
		function o(e, t) {
			let n = i(e.bits_per_raw_sample, e.bits_per_sample, t.bits_per_channel, t.bitsperchannel, t.bit_depth), r = String(i(e.pix_fmt, t.pixel_format, t.pix_fmt) || ""), a = Number(r.match(/(?:p|gray|gbrp)(\d+)(?:le|be)?$/i)?.[1]), o = Number(n) || (a >= 8 ? a : 0), s = String(i(e.sample_fmt, t.sample_format) || "").toLowerCase(), c = s.includes("flt") || s.includes("dbl") || /(?:16|32)f\b/i.test(r);
			return o > 0 ? `${o}-bit ${c ? "float" : "fixed"}` : r ? `8-bit ${c ? "float" : "fixed"}` : c ? "float" : "N/A";
		}
		function s(e, t) {
			let n = e?.[t] ?? e?.file_info?.[t];
			return n != null && n !== "" ? n : t === "workflow_id" ? e?.user_metadata?.workflow?.id ?? e?.metadata?.workflow_id ?? "" : "";
		}
		let c = H(() => {
			let e = t.asset || {}, c = r(e), l = c?.raw_ffprobe && typeof c.raw_ffprobe == "object" ? c.raw_ffprobe : {}, u = l?.video_stream && typeof l.video_stream == "object" ? l.video_stream : {}, d = l?.format && typeof l.format == "object" ? l.format : {}, f = [];
			e.width && e.height && f.push({
				label: "Dimensions",
				value: `${e.width} x ${e.height}`,
				tooltip: "Image/video resolution in pixels"
			}), e.duration && e.duration > 0 && f.push({
				label: "Duration",
				value: gn(e.duration),
				tooltip: "Video duration"
			});
			let p = A(e);
			p != null && f.push({
				label: "FPS",
				value: E(p),
				tooltip: "Native frame rate"
			});
			let m = O(e, p);
			f.push({
				label: "Frames",
				value: m == null ? "N/A" : String(Math.max(0, Math.floor(m))),
				tooltip: "Total frame count"
			}), f.push({
				label: "Bits / Channel",
				value: o(u, c),
				tooltip: "Channel precision and numeric representation"
			}), f.push({
				label: "Pixel Aspect",
				value: String(i(u.sample_aspect_ratio, c.pixel_aspect_ratio) || "N/A"),
				tooltip: "Pixel sample aspect ratio"
			}), f.push({
				label: "Codec ID",
				value: String(i(u.codec_tag_string, u.codec_tag, c.codec_id) || "N/A"),
				tooltip: "Container codec identifier"
			}), f.push({
				label: "Codec Name",
				value: String(i(u.codec_long_name, u.codec_name, c.codec_name) || "N/A"),
				tooltip: "Video codec name"
			}), f.push({
				label: "Encoder",
				value: String(i(u.tags?.encoder, d.tags?.encoder, c.encoder) || "N/A"),
				tooltip: "Encoder recorded in file metadata"
			}), f.push({
				label: "Pixel Format",
				value: String(i(u.pix_fmt, c.pixel_format, c.pix_fmt) || "N/A"),
				tooltip: "Stored pixel format"
			}), f.push({
				label: "Color Space",
				value: String(i(u.color_space, c.color_space, c.colorspace) || "N/A"),
				tooltip: "Encoded color space"
			});
			let h = He(e.generation_time_ms ?? e.metadata?.generation_time_ms ?? 0);
			h > 0 && f.push({
				label: "Generation Time",
				value: `${(Number(h) / 1e3).toFixed(1)}s`,
				tooltip: "Time taken to generate this asset (workflow execution time)",
				valueStyle: `color: ${Be(h)}; font-weight: 600;`
			});
			let g = e.generation_time || e.file_creation_time || e.mtime || e.created_at;
			if (g) {
				let e = mn(g), t = hn(g);
				e && f.push({
					label: "Date",
					value: e,
					tooltip: "File creation/generation date"
				}), t && f.push({
					label: "Time",
					value: t,
					tooltip: "File creation/generation time"
				});
			}
			f.push({
				label: "File Size",
				value: n(i(e.size_bytes, e.size, e.file_info?.size_bytes, e.file_info?.size)),
				tooltip: "File size on disk"
			}), e.id != null && f.push({
				label: "Asset ID",
				value: String(e.id),
				tooltip: "Internal database asset identifier"
			});
			let _ = String(s(e, "job_id") || "").trim();
			_ && f.push({
				label: "Job ID",
				value: _,
				tooltip: "Workflow execution job identifier (prompt_id)"
			});
			let v = String(s(e, "source_node_id") || "").trim();
			v && f.push({
				label: "Source Node",
				value: v,
				tooltip: "ComfyUI node id that produced this file"
			});
			let y = String(s(e, "source_node_type") || "").trim();
			y && f.push({
				label: "Node Type",
				value: y,
				tooltip: "ComfyUI node class that produced this file"
			});
			let b = String(s(e, "workflow_id") || "").trim();
			return b && f.push({
				label: "Workflow ID",
				value: b,
				tooltip: "ComfyUI workflow identifier (from workflow.id in extra_data)"
			}), f.filter((e) => a(e.value));
		});
		return (e, t) => c.value.length ? (U(), q("div", xn, [t[0] ||= I("div", { style: {
			"font-size": "12px",
			"font-weight": "700",
			color: "#607d8b",
			"margin-bottom": "8px",
			"text-transform": "uppercase",
			"letter-spacing": "0.4px"
		} }, " File Info ", -1), I("div", Sn, [(U(!0), q(F, null, L(c.value, (e) => (U(), q("div", {
			key: e.label,
			style: {
				display: "flex",
				gap: "10px",
				"align-items": "flex-start",
				"justify-content": "space-between"
			}
		}, [I("div", {
			title: e.tooltip || "",
			style: {
				"font-size": "12px",
				opacity: "0.68",
				"min-width": "92px"
			}
		}, G(e.label), 9, Cn), I("div", {
			style: K(e.valueStyle || "font-size: 12px; text-align: right; word-break: break-word"),
			title: String(e.value || "")
		}, G(e.value), 13, wn)]))), 128))])])) : z("", !0);
	}
}), En = ["title"], Dn = ["src"], On = {
	key: 1,
	style: {
		width: "100%",
		height: "100%",
		display: "flex",
		"flex-direction": "column",
		"align-items": "center",
		"justify-content": "center",
		gap: "4px",
		background: "linear-gradient(135deg, rgba(0,188,212,0.28), rgba(156,39,176,0.20))",
		color: "white",
		padding: "6px",
		"text-align": "center"
	}
}, kn = { style: {
	"font-size": "8px",
	"font-weight": "700",
	"max-width": "54px",
	"white-space": "nowrap",
	overflow: "hidden",
	"text-overflow": "ellipsis"
} }, An = ["src"], jn = {
	key: 3,
	style: {
		position: "absolute",
		bottom: "0",
		left: "0",
		right: "0",
		background: "rgba(0,0,0,0.7)",
		color: "white",
		"font-size": "8px",
		padding: "2px",
		"text-align": "center",
		"white-space": "nowrap",
		overflow: "hidden",
		"text-overflow": "ellipsis"
	}
}, Mn = {
	key: 4,
	title: "Video file",
	style: {
		position: "absolute",
		color: "white",
		opacity: "0.7",
		"font-size": "16px",
		"pointer-events": "none"
	}
}, Nn = /* @__PURE__ */ B({
	__name: "GenerationInputThumb",
	props: { inputFile: {} },
	setup(e) {
		let t = e, n = Y(0), i = Y(!1), a = null;
		function s() {
			return a ||= import("./floatingViewerManager-DEAOVwEA.js").then((e) => e.n), a;
		}
		function c() {
			return (Array.isArray(t.inputFile?.previewCandidates) ? t.inputFile.previewCandidates : [])[n.value] || "";
		}
		function l() {
			let e = Array.isArray(t.inputFile?.previewCandidates) ? t.inputFile.previewCandidates : [];
			n.value < e.length - 1 && (n.value += 1);
		}
		async function u(e) {
			e?.stopPropagation?.();
			let n = String(t.inputFile?.filepath || t.inputFile?.filename || "").trim();
			if (n) try {
				await navigator.clipboard.writeText(n), i.value = !0, setTimeout(() => {
					i.value = !1;
				}, 350);
			} catch (e) {
				console.debug?.(e);
			}
		}
		function d(e) {
			e?.stopPropagation?.(), y();
		}
		function f() {
			let e = t.inputFile || {}, n = String(e.filepath || "").trim();
			return {
				filename: e.filename || "",
				name: e.filename || "",
				filepath: n,
				path: n,
				subfolder: e.subfolder || "",
				type: e.type || "input",
				source: e.type || "input",
				kind: m(e),
				root_id: e.root_id || "",
				preview_url: c()
			};
		}
		function m(e = t.inputFile || {}) {
			let n = String(e.kind || "").trim().toLowerCase();
			if (n === "image" || n === "video" || n === "audio" || n === "model3d") return n;
			if (e.isVideo) return "video";
			if (e.isAudio) return "audio";
			let r = String(e.filename || "").toLowerCase();
			return /\.(mp4|mov|webm|mkv|avi|m4v)$/i.test(r) ? "video" : /\.(wav|mp3|flac|ogg|m4a|aac|opus)$/i.test(r) ? "audio" : /\.(glb|gltf|obj|stl|ply|fbx)$/i.test(r) ? "model3d" : "image";
		}
		function h(e, t, n, { disabled: r = !1 } = {}) {
			return {
				id: `mjr-generation-source-${String(e).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
				type: "item",
				label: e,
				iconClass: t,
				rightHint: "",
				tone: String(e).toLowerCase().includes("floating") ? "floating-viewer" : "",
				disabled: r,
				action: n
			};
		}
		function g() {
			return {
				id: "mjr-generation-source-separator",
				type: "separator"
			};
		}
		function v() {
			return T(c()) || !!t.inputFile?.filename || !!t.inputFile?.filepath;
		}
		function y() {
			let e = f();
			if (ye({
				asset: e,
				index: 0
			})) return;
			let t = c();
			if (T(t)) try {
				window.open(t, "_blank", "noopener,noreferrer");
			} catch (e) {
				console.debug?.(e);
			}
		}
		async function b() {
			try {
				let { floatingViewerManager: e } = await s();
				await e.openAssets({
					assets: [f()],
					index: 0
				});
			} catch (e) {
				console.debug?.(e), o(p("toast.viewerOpenFailed", "Failed to open viewer."), "error");
			}
		}
		async function C() {
			let e = await _(f());
			e?.ok ? o(p("toast.openedInFolder", "Opened in folder"), "info", 1600) : o(e?.error || p("toast.openFolderFailed", "Failed to open folder."), "error");
		}
		async function ee() {
			let e = f(), t = {
				filename: e.filename,
				subfolder: e.subfolder,
				type: e.type || "input",
				root_id: e.root_id || void 0,
				kind: e.kind
			}, n = await cn({
				post: S,
				endpoint: r.STAGE_TO_INPUT,
				payload: t,
				index: !1
			});
			if (!n?.relativePath || !rn({
				app: x(),
				items: [{
					payload: t,
					relativePath: n.relativePath,
					droppedExt: String(t.filename || "").split(".").pop() || ""
				}],
				event: null
			})) {
				o(p("toast.loadAssetFailed", "Failed to load asset."), "error");
				return;
			}
			let i = e.kind ? e.kind.charAt(0).toUpperCase() + e.kind.slice(1) : "Asset";
			o(p("toast.assetLoadedToCanvas", "{kind} loader added to canvas.", { kind: i }), "success", 1800);
		}
		function w(e) {
			e?.preventDefault?.(), e?.stopPropagation?.();
			let n = m(), r = n === "video" ? p("ctx.loadVideo", "Load video") : n === "audio" ? p("ctx.loadAudio", "Load audio") : n === "model3d" ? p("ctx.loadModel3d", "Load 3D model") : p("ctx.loadImage", "Load image");
			Ze({
				x: e?.clientX || 0,
				y: e?.clientY || 0,
				items: [
					h(p("ctx.openInViewer", "Open in viewer"), "pi pi-eye", y, { disabled: !v() }),
					h(p("ctx.openInFloatingViewer", "Open in Floating Viewer"), "pi pi-window-maximize", b, { disabled: !v() }),
					h(p("ctx.openInFolder", "Open in folder"), "pi pi-folder-open", C, { disabled: !t.inputFile?.filepath }),
					g(),
					h(r, "pi pi-plus-circle", ee, { disabled: !t.inputFile?.filename }),
					h(p("ctx.copyPath", "Copy path"), "pi pi-copy", u, { disabled: !(t.inputFile?.filepath || t.inputFile?.filename) })
				]
			});
		}
		function E(e) {
			e.target?.play?.().catch?.(() => {});
		}
		function te(e) {
			try {
				e.target?.pause?.();
			} catch (e) {
				console.debug?.(e);
			}
		}
		function D() {
			return !!t.inputFile?.isAudio;
		}
		return (t, n) => (U(), q("div", {
			title: `${e.inputFile.filename} (click to copy, double-click to open in new tab)`,
			style: K({
				width: "64px",
				height: "64px",
				background: "#222",
				borderRadius: "4px",
				overflow: "hidden",
				position: "relative",
				cursor: "pointer",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				outline: i.value ? "2px solid rgba(76, 175, 80, 0.9)" : "",
				outlineOffset: i.value ? "1px" : ""
			}),
			onClick: u,
			onDblclick: d,
			onContextmenu: w
		}, [e.inputFile.isVideo ? (U(), q("video", {
			key: 0,
			src: c(),
			muted: "",
			loop: "",
			playsinline: "",
			preload: "metadata",
			style: {
				width: "100%",
				height: "100%",
				"object-fit": "cover"
			},
			onError: l,
			onMouseover: E,
			onMouseout: te
		}, null, 40, Dn)) : D() ? (U(), q("div", On, [n[0] ||= I("div", { style: {
			"font-size": "18px",
			"line-height": "1"
		} }, "♪", -1), I("div", kn, G(e.inputFile.filename), 1)])) : (U(), q("img", {
			key: 2,
			src: c(),
			style: {
				width: "100%",
				height: "100%",
				"object-fit": "cover"
			},
			onError: l
		}, null, 40, An)), e.inputFile.role && e.inputFile.role !== "secondary" ? (U(), q("div", jn, G(e.inputFile.roleLabel), 1)) : e.inputFile.isVideo ? (U(), q("div", Mn, " Play ")) : z("", !0)], 44, En));
	}
}), Pn = {
	key: 0,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "12px"
	}
}, Fn = {
	key: 0,
	style: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		padding: "10px 12px",
		background: "linear-gradient(135deg, rgba(33, 150, 243, 0.18) 0%, rgba(0, 188, 212, 0.10) 100%)",
		borderLeft: "3px solid #2196F3",
		border: "1px solid rgba(33, 150, 243, 0.45)",
		boxShadow: "0 0 0 1px rgba(33, 150, 243, 0.15) inset",
		borderRadius: "6px",
		fontSize: "11px",
		color: "var(--fg-color, #ccc)"
	}
}, In = { style: { opacity: "0.85" } }, Ln = { style: {
	display: "flex",
	"align-items": "center",
	gap: "8px",
	"flex-wrap": "wrap",
	"justify-content": "flex-end"
} }, Rn = ["title"], zn = ["title"], Bn = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px"
} }, Vn = { style: {
	"font-size": "11px",
	"font-weight": "700",
	color: "#00BCD4",
	"text-transform": "uppercase",
	"letter-spacing": "0.6px"
} }, Hn = { style: {
	"font-size": "11px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"font-weight": "600"
} }, Un = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#FF9800",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, Wn = { style: {
	"font-size": "12px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"line-height": "1.5",
	"white-space": "pre-wrap",
	"word-break": "break-word"
} }, Gn = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#9E9E9E",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, Kn = { style: {
	"font-size": "12px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"line-height": "1.5",
	"white-space": "pre-wrap",
	"word-break": "break-word"
} }, qn = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "8px",
	"margin-bottom": "10px"
} }, Jn = { style: {
	"font-size": "11px",
	"font-weight": "800",
	color: "#26C6DA",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px"
} }, Yn = {
	key: 0,
	style: {
		display: "grid",
		"grid-template-columns": "repeat(auto-fit,minmax(92px,1fr))",
		gap: "8px",
		"margin-bottom": "10px"
	}
}, Xn = { style: {
	"font-size": "9px",
	"font-weight": "800",
	color: "rgba(255,255,255,0.55)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, Zn = { style: {
	"font-size": "12px",
	color: "var(--fg-color,#eee)",
	"font-weight": "650",
	"word-break": "break-word"
} }, Qn = {
	key: 1,
	style: {
		border: "1px solid rgba(76,175,80,0.36)",
		"border-radius": "6px",
		background: "rgba(76,175,80,0.10)",
		padding: "10px",
		"margin-bottom": "10px"
	}
}, $n = ["title"], er = {
	key: 2,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "8px"
	}
}, tr = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "8px",
	"margin-bottom": "7px"
} }, nr = { style: {
	"font-size": "10px",
	"font-weight": "800",
	color: "#26C6DA",
	"text-transform": "uppercase",
	"letter-spacing": "0.45px"
} }, rr = { style: {
	display: "flex",
	"align-items": "center",
	gap: "5px",
	"flex-wrap": "wrap",
	"justify-content": "flex-end"
} }, ir = {
	key: 0,
	style: {
		"font-size": "10px",
		color: "#A7FFEB",
		background: "rgba(0,150,136,0.16)",
		border: "1px solid rgba(0,150,136,0.30)",
		"border-radius": "4px",
		padding: "2px 6px",
		"font-weight": "700"
	}
}, ar = {
	key: 1,
	style: {
		"font-size": "10px",
		color: "#FFE082",
		background: "rgba(255,193,7,0.14)",
		border: "1px solid rgba(255,193,7,0.30)",
		"border-radius": "4px",
		padding: "2px 6px",
		"font-weight": "700"
	}
}, or = { style: {
	display: "flex",
	gap: "10px",
	"align-items": "flex-start",
	"min-width": "0"
} }, sr = { style: {
	"min-width": "0",
	flex: "1"
} }, cr = ["title", "onClick"], lr = {
	key: 1,
	style: {
		"font-size": "10px",
		color: "rgba(255,255,255,0.58)",
		"margin-top": "7px",
		display: "flex",
		gap: "6px",
		"flex-wrap": "wrap"
	}
}, ur = { key: 0 }, dr = { key: 1 }, fr = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "8px",
	"margin-bottom": "10px"
} }, pr = { style: {
	"font-size": "11px",
	"font-weight": "800",
	color: "#FFB300",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px"
} }, mr = {
	key: 0,
	style: {
		display: "grid",
		"grid-template-columns": "repeat(auto-fit,minmax(100px,1fr))",
		gap: "8px",
		"margin-bottom": "10px"
	}
}, hr = { style: {
	"font-size": "9px",
	"font-weight": "800",
	color: "rgba(255,255,255,0.55)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, gr = { style: {
	"font-size": "12px",
	color: "var(--fg-color,#eee)",
	"font-weight": "650",
	"word-break": "break-word"
} }, _r = {
	key: 1,
	style: {
		border: "1px solid rgba(76,175,80,0.34)",
		"border-radius": "6px",
		background: "rgba(76,175,80,0.09)",
		padding: "10px",
		"margin-bottom": "10px"
	}
}, vr = ["title"], yr = {
	key: 2,
	style: {
		border: "1px solid rgba(33,150,243,0.32)",
		"border-radius": "6px",
		background: "rgba(33,150,243,0.08)",
		padding: "10px",
		"margin-bottom": "10px"
	}
}, br = ["title"], xr = {
	key: 3,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "8px",
		"margin-bottom": "10px"
	}
}, Sr = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "8px",
	"margin-bottom": "7px"
} }, Cr = { style: {
	"font-size": "10px",
	"font-weight": "800",
	color: "#FFCA28",
	"text-transform": "uppercase",
	"letter-spacing": "0.45px"
} }, wr = {
	key: 0,
	style: {
		"font-size": "10px",
		color: "#FFE082",
		background: "rgba(255,193,7,0.14)",
		border: "1px solid rgba(255,193,7,0.30)",
		"border-radius": "4px",
		padding: "2px 6px",
		"font-weight": "700"
	}
}, Tr = ["title", "onClick"], Er = {
	key: 1,
	style: {
		display: "flex",
		"flex-wrap": "wrap",
		gap: "5px",
		"margin-top": "8px"
	}
}, Dr = ["title", "onClick"], Or = { style: {
	border: "1px solid rgba(255,179,0,0.30)",
	"border-radius": "6px",
	background: "rgba(0,0,0,0.16)",
	overflow: "hidden"
} }, kr = ["title"], Ar = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#4CAF50",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, jr = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "6px",
	"margin-bottom": "10px"
} }, Mr = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "#4CAF50",
	"letter-spacing": "0.4px"
} }, Nr = ["onClick"], Pr = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "#F44336",
	"letter-spacing": "0.4px",
	"margin-top": "4px"
} }, Fr = ["onClick"], Ir = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#4CAF50",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, Lr = ["title"], Rr = ["title"], zr = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#F44336",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, Br = ["title"], Vr = ["title"], Hr = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#00BCD4",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between"
} }, Ur = ["title"], Wr = { style: {
	display: "flex",
	"align-items": "center",
	gap: "10px"
} }, Gr = { style: {
	flex: "1",
	height: "8px",
	background: "rgba(255,255,255,0.1)",
	"border-radius": "4px",
	overflow: "hidden"
} }, Kr = {
	key: 0,
	style: {
		"font-size": "10px",
		color: "rgba(255,255,255,0.65)",
		border: "1px dashed rgba(255,255,255,0.25)",
		"border-radius": "4px",
		padding: "6px 8px",
		background: "rgba(255,255,255,0.04)"
	}
}, qr = { style: {
	"font-size": "10px",
	"font-weight": "600",
	color: "rgba(0, 188, 212, 0.75)",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-top": "8px",
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "8px"
} }, Jr = ["title"], Yr = { style: {
	display: "flex",
	"align-items": "center",
	gap: "6px"
} }, Xr = ["title"], Zr = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#9C27B0",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, Qr = { style: {
	display: "grid",
	"grid-template-columns": "repeat(auto-fit, minmax(190px, 1fr))",
	gap: "10px"
} }, $r = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.58)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, ei = ["onClick"], ti = {
	key: 0,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "5px"
	}
}, ni = ["onClick"], ri = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#00BCD4",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, ii = { style: {
	"font-size": "12px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"line-height": "1.5",
	"white-space": "pre-wrap",
	"word-break": "break-word"
} }, ai = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#FF9800",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, oi = { style: {
	display: "grid",
	"grid-template-columns": "repeat(auto-fit, minmax(130px, 1fr))",
	gap: "8px"
} }, si = ["onClick"], ci = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#9C27B0",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, li = { style: {
	display: "grid",
	"grid-template-columns": "repeat(auto-fit, minmax(220px, 1fr))",
	gap: "10px"
} }, ui = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px"
} }, di = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "4px"
} }, fi = ["onClick"], pi = {
	key: 0,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "6px"
	}
}, mi = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.58)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, hi = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "5px"
} }, gi = ["onClick"], _i = { style: {
	display: "grid",
	"grid-template-columns": "auto 1fr",
	gap: "8px 12px",
	"align-items": "start"
} }, vi = ["title"], yi = ["title"], bi = ["title", "onClick"], xi = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#4CAF50",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, Si = ["title", "onClick"], Ci = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#26C6DA",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, wi = { style: {
	display: "grid",
	"grid-template-columns": "repeat(auto-fit, minmax(190px, 1fr))",
	gap: "10px"
} }, Ti = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.58)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, Ei = ["title", "onClick"], Di = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#26A69A",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, Oi = ["title"], ki = { style: {
	"font-size": "11px",
	"font-weight": "700",
	color: "#E91E63",
	"text-transform": "uppercase",
	"letter-spacing": "1px"
} }, Ai = ["title"], ji = ["title"], Mi = { style: {
	display: "flex",
	gap: "8px",
	"flex-wrap": "wrap"
} }, Ni = /* @__PURE__ */ B({
	__name: "SidebarGenerationSection",
	props: { asset: {} },
	setup(e) {
		let t = e, r = Y(0), a = Y(0), o = Y(""), s = Y(p("action.copy", "Copy")), c = Y(p("action.generate", "Generate")), l = Y(!1), u = Y(f()), d = 0;
		function f() {
			return {
				scoreText: "...",
				scoreColor: "#888",
				qualityText: p("status.loading", "Loading"),
				qualityColor: "#888",
				qualityBackground: "rgba(127,127,127,0.3)",
				fillWidth: "0%",
				fillColor: "#666",
				aiStatusVisible: !1,
				aiStatusText: p("sidebar.generation.aiDisabledEnv", "AI features are disabled (enable vector search env var).")
			};
		}
		function m(e, t) {
			let n = String(e || "").trim().replace(/^#/, "");
			return /^[0-9a-fA-F]{6}$/.test(n) ? `rgba(${Number.parseInt(n.slice(0, 2), 16)}, ${Number.parseInt(n.slice(2, 4), 16)}, ${Number.parseInt(n.slice(4, 6), 16)}, ${t})` : `rgba(255,255,255,${t})`;
		}
		function h(e, { emphasis: t = !1, startAlpha: n = .16, endAlpha: r = .08 } = {}) {
			return {
				background: t ? `linear-gradient(135deg, ${m(e, n)} 0%, ${m(e, r)} 100%)` : "var(--comfy-menu-bg, rgba(0,0,0,0.3))",
				borderLeft: `3px solid ${e}`,
				border: t ? `1px solid ${m(e, .45)}` : "1px solid var(--border-color, rgba(255,255,255,0.12))",
				boxShadow: t ? `0 0 0 1px ${m(e, .15)} inset` : "none",
				borderRadius: "6px",
				padding: "12px"
			};
		}
		function g() {
			return {
				background: "linear-gradient(135deg, rgba(233, 30, 99, 0.15) 0%, rgba(156, 39, 176, 0.15) 100%)",
				border: "2px solid #E91E63",
				borderRadius: "8px",
				padding: "12px 16px",
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				gap: "12px"
			};
		}
		function _() {
			return {
				display: "inline-flex",
				alignItems: "center",
				borderRadius: "999px",
				border: "1px solid rgba(0, 188, 212, 0.55)",
				background: "rgba(0, 188, 212, 0.16)",
				color: "#4DD0E1",
				fontSize: "9px",
				fontWeight: "700",
				lineHeight: "1",
				padding: "2px 6px",
				letterSpacing: "0.2px",
				textTransform: "uppercase",
				whiteSpace: "nowrap"
			};
		}
		let v = H(() => M(t.asset)), y = H(() => te()), b = H(() => v.value.kind === "full" || v.value.kind === "caption-only"), x = H(() => ne(o.value) || v.value.emptyCaptionText), S = H(() => y.value && v.value.isImageAsset && !!t.asset?.id), C = H(() => y.value && !!ne(x.value) && x.value !== v.value.emptyCaptionText), ee = H(() => v.value.branchCards.filter((e) => e.modelFields.length || e.loras.length)), w = H(() => v.value.branchCards.filter((e) => e.samplingFields.length));
		H(() => v.value.branchCards.filter((e) => e.loras.length));
		let T = H(() => {
			let e = [], t = (e, t) => bn(e)?.title || t;
			return !ee.value.length && v.value.modelFields.length && e.push({
				key: "model",
				title: t("model", p("sidebar.generation.modelLora", "Model & LoRA")),
				accent: "#9C27B0",
				emphasis: !0,
				fields: v.value.modelFields
			}), !w.value.length && v.value.samplingFields.length && e.push({
				key: "sampling",
				title: t("sampler", p("sidebar.generation.sampling", "Sampling")),
				accent: "#FF9800",
				emphasis: !0,
				fields: v.value.samplingFields
			}), (v.value.ttsFields.length || v.value.workflowType.toLowerCase() === "tts") && e.push({
				key: "tts",
				title: "TTS",
				accent: "#26A69A",
				emphasis: !0,
				fields: v.value.ttsFields
			}), v.value.ttsEngineFields.length && e.push({
				key: "tts-engine",
				title: "TTS Engine",
				accent: "#00897B",
				emphasis: !1,
				fields: v.value.ttsEngineFields
			}), v.value.ttsRuntimeFields.length && e.push({
				key: "tts-runtime",
				title: "TTS Runtime",
				accent: "#00796B",
				emphasis: !1,
				fields: v.value.ttsRuntimeFields
			}), v.value.audioFields.length && e.push({
				key: "audio",
				title: p("sidebar.generation.audio", "Audio"),
				accent: "#00BCD4",
				emphasis: !1,
				fields: v.value.audioFields
			}), v.value.imageFields.length && e.push({
				key: "image",
				title: p("sidebar.generation.image", "Image"),
				accent: "#2196F3",
				emphasis: !1,
				fields: v.value.imageFields
			}), e;
		});
		function E(e, t, n = 450) {
			if (!e) return;
			let r = e.style.background;
			e.style.background = t, setTimeout(() => {
				e.style.background = r || "";
			}, n);
		}
		function D(e, t = !0) {
			return {
				background: t ? `linear-gradient(135deg, ${m(e, .16)} 0%, ${m(e, .08)} 100%)` : "var(--comfy-menu-bg, rgba(0,0,0,0.3))",
				border: `1px solid ${m(e, .42)}`,
				boxShadow: `0 0 0 1px ${m(e, .14)} inset`,
				borderRadius: "8px",
				padding: "12px",
				display: "flex",
				flexDirection: "column",
				gap: "10px"
			};
		}
		function O(e) {
			return "#CE6DE0";
		}
		function A(e) {
			let t = String(e?.key || "").toLowerCase();
			return t.includes("high") ? "#FFC107" : t.includes("low") ? "#FFB300" : t.includes("base") ? "#FF9800" : t.includes("upscale") || t.includes("refine") ? "#FFCA28" : t.includes("pass") ? "#FDD835" : "#FF9800";
		}
		function re(e) {
			return e === "high_noise" ? "#FF7043" : e === "low_noise" ? "#29B6F6" : "#AB47BC";
		}
		async function N(e, t = null, n = "rgba(76, 175, 80, 0.35)") {
			let r = String(e ?? "").trim();
			if (r && r !== "-") try {
				await navigator.clipboard.writeText(r), E(t, n);
			} catch (e) {
				console.debug?.(e);
			}
		}
		function P() {
			u.value = {
				scoreText: "AI OFF",
				scoreColor: "#9E9E9E",
				qualityText: p("status.disabled", "Disabled"),
				qualityColor: "#BDBDBD",
				qualityBackground: "rgba(158,158,158,0.25)",
				fillWidth: "0%",
				fillColor: "#777",
				aiStatusVisible: !0,
				aiStatusText: p("sidebar.generation.aiDisabledSettings", "AI features are disabled in settings.")
			};
		}
		function ie() {
			u.value = f();
		}
		async function oe() {
			d += 1;
			let e = d;
			if (!v.value.showAlignment || !t.asset?.id) ie();
			else if (!y.value) P();
			else {
				ie();
				try {
					let n = await i(t.asset.id);
					if (e !== d) return;
					if (!n?.ok && (String(n?.code || "").toUpperCase() === "SERVICE_UNAVAILABLE" || /vector search is not enabled/i.test(String(n?.error || "")))) {
						P();
						return;
					}
					let r = n?.ok && n.data != null ? Number(n.data) : null;
					if (!Number.isFinite(r)) {
						u.value = {
							scoreText: "N/A",
							scoreColor: "#888",
							qualityText: p("status.na", "N/A"),
							qualityColor: "#888",
							qualityBackground: "rgba(127,127,127,0.3)",
							fillWidth: "0%",
							fillColor: "#666",
							aiStatusVisible: !1,
							aiStatusText: ""
						};
						return;
					}
					let a = Math.round(r * 100), o = k(r);
					u.value = {
						scoreText: `${a}%`,
						scoreColor: o,
						qualityText: j(r),
						qualityColor: o,
						qualityBackground: `${o}33`,
						fillWidth: `${a}%`,
						fillColor: o,
						aiStatusVisible: !1,
						aiStatusText: ""
					};
				} catch (t) {
					if (console.debug?.(t), e !== d) return;
					u.value = {
						scoreText: "-",
						scoreColor: "#888",
						qualityText: p("status.unavailable", "Unavailable"),
						qualityColor: "#888",
						qualityBackground: "rgba(127,127,127,0.3)",
						fillWidth: "0%",
						fillColor: "#666",
						aiStatusVisible: !1,
						aiStatusText: ""
					};
				}
			}
		}
		async function ce() {
			if (S.value && !l.value) {
				l.value = !0, c.value = p("status.generating", "Generating...");
				try {
					let e = await n(t.asset.id);
					e?.ok && (o.value = String(e?.data || "").trim());
				} catch (e) {
					console.debug?.(e);
				} finally {
					l.value = !1, c.value = p("action.generate", "Generate");
				}
			}
		}
		async function B() {
			if (C.value) try {
				await navigator.clipboard.writeText(x.value), s.value = p("viewer.copySuccessShort", "Copied!"), setTimeout(() => {
					s.value = p("action.copy", "Copy");
				}, 900);
			} catch (e) {
				console.debug?.(e);
			}
		}
		return W(() => t.asset, () => {
			r.value = 0, a.value = 0, o.value = String(t.asset?.enhanced_caption || "").trim(), s.value = p("action.copy", "Copy"), c.value = p("action.generate", "Generate");
		}, { immediate: !0 }), W(() => [
			t.asset?.id,
			v.value.kind,
			v.value.showAlignment,
			y.value
		], () => {
			oe();
		}, { immediate: !0 }), (e, t) => {
			let n = le("MButton");
			return v.value.kind === "empty" ? z("", !0) : (U(), q("div", Pn, [
				v.value.workflowType ? (U(), q("div", Fn, [I("span", In, G(J(p)("viewer.workflow", "Workflow")), 1), I("div", Ln, [I("span", {
					title: J(p)("sidebar.generation.workflowEngine", "Workflow engine: {value}", { value: v.value.workflowType }),
					style: {
						background: "#2196F3",
						color: "white",
						padding: "2px 8px",
						"border-radius": "999px",
						"font-weight": "bold",
						"font-size": "10px",
						"letter-spacing": "0.2px"
					}
				}, G(v.value.workflowLabel || v.value.workflowType), 9, Rn), v.value.workflowBadge ? (U(), q("span", {
					key: 0,
					title: J(p)("sidebar.generation.apiProvider", "API provider: {value}", { value: v.value.workflowBadge }),
					style: {
						background: "rgba(255,255,255,0.08)",
						color: "var(--fg-color, #eee)",
						padding: "2px 8px",
						"border-radius": "999px",
						border: "1px solid rgba(255,255,255,0.14)",
						"font-weight": "600",
						"font-size": "10px",
						"letter-spacing": "0.2px"
					}
				}, G(v.value.workflowBadge), 9, zn)) : z("", !0)])])) : z("", !0),
				v.value.isOverride ? (U(), q("div", {
					key: 1,
					style: K(h("#00BCD4", {
						emphasis: !0,
						startAlpha: .14,
						endAlpha: .08
					}))
				}, [I("div", Bn, [I("span", Vn, G(J(p)("sidebar.generation.override", "Override")), 1), I("span", Hn, G(v.value.overrideLabel), 1)])], 4)) : z("", !0),
				v.value.isTruncated ? (U(), q("div", {
					key: 2,
					style: K(h("#FF9800", {
						emphasis: !0,
						startAlpha: .12,
						endAlpha: .08
					}))
				}, [I("div", Un, G(J(p)("sidebar.generation.metadataTruncated", "Metadata Truncated")), 1), I("div", Wn, G(J(p)("sidebar.generation.metadataTruncatedBody", "Generation data is incomplete because it exceeded the size limit.")), 1)], 4)) : z("", !0),
				v.value.kind === "media-only" ? (U(), q("div", {
					key: 3,
					style: K(h("#9E9E9E", {
						emphasis: !0,
						startAlpha: .1,
						endAlpha: .06
					}))
				}, [I("div", Gn, G(J(p)("sidebar.generation.generationData", "Generation Data")), 1), I("div", Kn, G(v.value.mediaOnlyMessage), 1)], 4)) : z("", !0),
				v.value.kind === "full" ? (U(), q(F, { key: 4 }, [
					v.value.ltxDirector ? (U(), q("div", {
						key: 0,
						style: K(h("#26C6DA", {
							emphasis: !0,
							startAlpha: .15,
							endAlpha: .08
						}))
					}, [
						I("div", qn, [I("div", Jn, G(v.value.ltxDirector.title || "LTX Director"), 1), t[8] ||= I("span", { style: {
							"font-size": "10px",
							"font-weight": "700",
							color: "#26C6DA",
							background: "rgba(38,198,218,0.14)",
							border: "1px solid rgba(38,198,218,0.32)",
							"border-radius": "999px",
							padding: "2px 8px"
						} }, " Director ", -1)]),
						v.value.ltxDirector.fields.length ? (U(), q("div", Yn, [(U(!0), q(F, null, L(v.value.ltxDirector.fields, (e) => (U(), q("div", {
							key: `ltx-field-${e.label}`,
							style: {
								border: "1px solid rgba(255,255,255,0.10)",
								"border-radius": "6px",
								background: "rgba(255,255,255,0.045)",
								padding: "7px 8px",
								"min-width": "0"
							}
						}, [I("div", Xn, G(e.label), 1), I("div", Zn, G(e.value), 1)]))), 128))])) : z("", !0),
						v.value.ltxDirector.globalPrompt ? (U(), q("div", Qn, [t[9] ||= I("div", { style: {
							"font-size": "10px",
							"font-weight": "800",
							color: "#66BB6A",
							"text-transform": "uppercase",
							"letter-spacing": "0.45px",
							"margin-bottom": "6px"
						} }, " Global Prompt ", -1), I("div", {
							title: J(p)("action.clickToCopy", "Click to copy"),
							style: {
								"font-size": "12px",
								color: "var(--fg-color,#eee)",
								"line-height": "1.45",
								"white-space": "pre-wrap",
								"word-break": "break-word",
								cursor: "pointer"
							},
							onClick: t[0] ||= (e) => N(v.value.ltxDirector.globalPrompt, e.currentTarget)
						}, G(v.value.ltxDirector.globalPrompt), 9, $n)])) : z("", !0),
						v.value.ltxDirector.segments.length ? (U(), q("div", er, [(U(!0), q(F, null, L(v.value.ltxDirector.segments, (e) => (U(), q("div", {
							key: e.key,
							style: {
								border: "1px solid rgba(38,198,218,0.30)",
								"border-radius": "6px",
								background: "rgba(38,198,218,0.075)",
								padding: "10px"
							}
						}, [I("div", tr, [I("div", nr, G(e.label), 1), I("div", rr, [e.inLabel ? (U(), q("span", ir, " in " + G(e.inLabel), 1)) : z("", !0), e.outLabel ? (U(), q("span", ar, " out " + G(e.outLabel), 1)) : z("", !0)])]), I("div", or, [e.filename ? (U(), se(Nn, {
							key: 0,
							"input-file": {
								filename: e.filename,
								filepath: e.filepath || e.filename,
								role: e.type || "segment",
								roleLabel: e.type || "segment",
								isVideo: e.isVideo,
								isAudio: e.isAudio,
								previewCandidates: e.previewCandidates
							}
						}, null, 8, ["input-file"])) : z("", !0), I("div", sr, [e.prompt ? (U(), q("div", {
							key: 0,
							title: J(p)("action.clickToCopy", "Click to copy"),
							style: {
								"font-size": "12px",
								color: "var(--fg-color,#eee)",
								"line-height": "1.45",
								"white-space": "pre-wrap",
								"word-break": "break-word",
								cursor: "pointer"
							},
							onClick: (t) => N(e.prompt, t.currentTarget)
						}, G(e.prompt), 9, cr)) : z("", !0), e.filename || e.type ? (U(), q("div", lr, [e.type ? (U(), q("span", ur, G(e.type), 1)) : z("", !0), e.filename ? (U(), q("span", dr, G(e.filename), 1)) : z("", !0)])) : z("", !0)])])]))), 128))])) : z("", !0)
					], 4)) : z("", !0),
					v.value.ideogram ? (U(), q("div", {
						key: 1,
						style: K(h("#FFB300", {
							emphasis: !0,
							startAlpha: .15,
							endAlpha: .08
						}))
					}, [
						I("div", fr, [I("div", pr, G(v.value.ideogram.title || "Ideogram 4"), 1), t[10] ||= I("span", { style: {
							"font-size": "10px",
							"font-weight": "700",
							color: "#FFCA28",
							background: "rgba(255,179,0,0.14)",
							border: "1px solid rgba(255,179,0,0.32)",
							"border-radius": "999px",
							padding: "2px 8px"
						} }, " Prompt JSON ", -1)]),
						v.value.ideogram.fields.length ? (U(), q("div", mr, [(U(!0), q(F, null, L(v.value.ideogram.fields, (e) => (U(), q("div", {
							key: `ideogram-field-${e.label}`,
							style: {
								border: "1px solid rgba(255,255,255,0.10)",
								"border-radius": "6px",
								background: "rgba(255,255,255,0.045)",
								padding: "7px 8px",
								"min-width": "0"
							}
						}, [I("div", hr, G(e.label), 1), I("div", gr, G(e.value), 1)]))), 128))])) : z("", !0),
						v.value.ideogram.highLevelDescription ? (U(), q("div", _r, [t[11] ||= I("div", { style: {
							"font-size": "10px",
							"font-weight": "800",
							color: "#81C784",
							"text-transform": "uppercase",
							"letter-spacing": "0.45px",
							"margin-bottom": "6px"
						} }, " High Level Description ", -1), I("div", {
							title: J(p)("action.clickToCopy", "Click to copy"),
							style: {
								"font-size": "12px",
								color: "var(--fg-color,#eee)",
								"line-height": "1.45",
								"white-space": "pre-wrap",
								"word-break": "break-word",
								cursor: "pointer"
							},
							onClick: t[1] ||= (e) => N(v.value.ideogram.highLevelDescription, e.currentTarget)
						}, G(v.value.ideogram.highLevelDescription), 9, vr)])) : z("", !0),
						v.value.ideogram.background ? (U(), q("div", yr, [t[12] ||= I("div", { style: {
							"font-size": "10px",
							"font-weight": "800",
							color: "#64B5F6",
							"text-transform": "uppercase",
							"letter-spacing": "0.45px",
							"margin-bottom": "6px"
						} }, " Background ", -1), I("div", {
							title: J(p)("action.clickToCopy", "Click to copy"),
							style: {
								"font-size": "12px",
								color: "var(--fg-color,#eee)",
								"line-height": "1.45",
								"white-space": "pre-wrap",
								"word-break": "break-word",
								cursor: "pointer"
							},
							onClick: t[2] ||= (e) => N(v.value.ideogram.background, e.currentTarget)
						}, G(v.value.ideogram.background), 9, br)])) : z("", !0),
						v.value.ideogram.elements.length ? (U(), q("div", xr, [(U(!0), q(F, null, L(v.value.ideogram.elements, (e) => (U(), q("div", {
							key: e.key,
							style: {
								border: "1px solid rgba(255,179,0,0.30)",
								"border-radius": "6px",
								background: "rgba(255,179,0,0.075)",
								padding: "10px"
							}
						}, [
							I("div", Sr, [I("div", Cr, G(e.label), 1), e.bbox ? (U(), q("span", wr, " bbox " + G(e.bbox), 1)) : z("", !0)]),
							e.description ? (U(), q("div", {
								key: 0,
								title: J(p)("action.clickToCopy", "Click to copy"),
								style: {
									"font-size": "12px",
									color: "var(--fg-color,#eee)",
									"line-height": "1.45",
									"white-space": "pre-wrap",
									"word-break": "break-word",
									cursor: "pointer"
								},
								onClick: (t) => N(e.description, t.currentTarget)
							}, G(e.description), 9, Tr)) : z("", !0),
							e.palette.length ? (U(), q("div", Er, [(U(!0), q(F, null, L(e.palette, (t) => (U(), q("span", {
								key: `${e.key}-${t}`,
								title: t,
								style: K({
									width: "18px",
									height: "18px",
									borderRadius: "4px",
									border: "1px solid rgba(255,255,255,0.28)",
									background: t
								}),
								onClick: (e) => N(t, e.currentTarget)
							}, null, 12, Dr))), 128))])) : z("", !0)
						]))), 128))])) : z("", !0),
						I("details", Or, [t[13] ||= I("summary", { style: {
							cursor: "pointer",
							padding: "8px 10px",
							"font-size": "10px",
							"font-weight": "800",
							color: "#FFCA28",
							"text-transform": "uppercase",
							"letter-spacing": "0.45px"
						} }, " JSON sent to text encoder ", -1), I("pre", {
							title: J(p)("action.clickToCopy", "Click to copy"),
							style: {
								margin: "0",
								padding: "10px",
								"max-height": "260px",
								overflow: "auto",
								"font-size": "11px",
								"line-height": "1.35",
								color: "rgba(255,255,255,0.9)",
								"white-space": "pre-wrap",
								"word-break": "break-word",
								cursor: "pointer"
							},
							onClick: t[3] ||= (e) => N(v.value.ideogram.json, e.currentTarget)
						}, G(v.value.ideogram.json), 9, kr)])
					], 4)) : z("", !0),
					!v.value.ltxDirector && !v.value.ideogram && v.value.promptTabs.length ? (U(), q("div", {
						key: 2,
						style: K(h("#4CAF50", {
							emphasis: !0,
							startAlpha: .16,
							endAlpha: .1
						}))
					}, [
						I("div", Ar, G(J(p)("sidebar.generation.promptPipeline", "Prompt Pipeline ({count} variants)", { count: v.value.promptTabs.length })), 1),
						I("div", jr, [(U(!0), q(F, null, L(v.value.promptTabs, (e, t) => (U(), se(n, {
							key: e.label,
							type: "button",
							severity: "secondary",
							text: "",
							rounded: "",
							style: K({
								appearance: "none",
								border: r.value === t ? "1px solid #4CAF50" : "1px solid var(--border-color, rgba(255,255,255,0.12))",
								borderRadius: "999px",
								background: r.value === t ? "#4CAF5033" : "rgba(127,127,127,0.12)",
								color: r.value === t ? "#4CAF50" : "var(--fg-color, #ddd)",
								fontSize: "11px",
								padding: "4px 10px",
								cursor: "pointer",
								fontWeight: r.value === t ? "700" : "500",
								boxShadow: r.value === t ? "0 0 0 1px #4CAF5055 inset" : "none"
							}),
							onClick: (e) => r.value = t
						}, {
							default: V(() => [pe(G(e.label), 1)]),
							_: 2
						}, 1032, ["style", "onClick"]))), 128))]),
						(U(!0), q(F, null, L(v.value.promptTabs, (e, t) => ae((U(), q("div", {
							key: `${e.label}-panel`,
							style: {
								display: "flex",
								"flex-direction": "column",
								gap: "8px",
								border: "1px solid rgba(76, 175, 80, 0.35)",
								"border-radius": "6px",
								background: "linear-gradient(135deg, rgba(76, 175, 80, 0.12) 0%, rgba(33, 150, 243, 0.08) 100%)",
								"box-shadow": "0 0 0 1px rgba(76, 175, 80, 0.12) inset",
								padding: "10px"
							}
						}, [
							I("div", Mr, G(J(p)("sidebar.generation.positive", "POSITIVE")), 1),
							I("div", {
								style: {
									"font-size": "12px",
									color: "var(--fg-color, #ddd)",
									"white-space": "pre-wrap",
									"line-height": "1.35",
									cursor: "pointer"
								},
								onClick: (t) => N(e.positive, t.currentTarget)
							}, G(e.positive), 9, Nr),
							e.negative ? (U(), q(F, { key: 0 }, [I("div", Pr, G(J(p)("sidebar.generation.negative", "NEGATIVE")), 1), I("div", {
								style: {
									"font-size": "12px",
									color: "var(--fg-color, #ddd)",
									"white-space": "pre-wrap",
									"line-height": "1.35",
									cursor: "pointer"
								},
								onClick: (t) => N(e.negative, t.currentTarget)
							}, G(e.negative), 9, Fr)], 64)) : z("", !0)
						])), [[fe, r.value === t]])), 128))
					], 4)) : !v.value.ltxDirector && !v.value.ideogram && v.value.positivePrompt ? (U(), q("div", {
						key: 3,
						style: K(h("#4CAF50", {
							emphasis: !0,
							startAlpha: .16,
							endAlpha: .1
						}))
					}, [I("div", Ir, [I("span", null, G(J(p)("sidebar.generation.positivePrompt", "Positive Prompt")), 1), v.value.positivePromptOverride ? (U(), q("span", {
						key: 0,
						style: K(_()),
						title: J(p)("sidebar.generation.overrideTooltip", "This field was forced by Majoor Gen Info Override")
					}, G(J(p)("sidebar.generation.override", "override")), 13, Lr)) : z("", !0)]), I("div", {
						title: J(p)("action.clickToCopy", "Click to copy"),
						style: {
							"font-size": "12px",
							color: "var(--fg-color, rgba(255,255,255,0.9))",
							"line-height": "1.5",
							"white-space": "pre-wrap",
							"word-break": "break-word",
							cursor: "pointer"
						},
						onClick: t[4] ||= (e) => N(v.value.positivePrompt, e.currentTarget)
					}, G(v.value.positivePrompt), 9, Rr)], 4)) : z("", !0),
					!v.value.ltxDirector && !v.value.ideogram && !v.value.promptTabs.length && v.value.negativePrompt ? (U(), q("div", {
						key: 4,
						style: K(h("#F44336", {
							emphasis: !0,
							startAlpha: .16,
							endAlpha: .1
						}))
					}, [I("div", zr, [I("span", null, G(J(p)("sidebar.generation.negativePrompt", "Negative Prompt")), 1), v.value.negativePromptOverride ? (U(), q("span", {
						key: 0,
						style: K(_()),
						title: J(p)("sidebar.generation.overrideTooltip", "This field was forced by Majoor Gen Info Override")
					}, G(J(p)("sidebar.generation.override", "override")), 13, Br)) : z("", !0)]), I("div", {
						title: J(p)("action.clickToCopy", "Click to copy"),
						style: {
							"font-size": "12px",
							color: "var(--fg-color, rgba(255,255,255,0.9))",
							"line-height": "1.5",
							"white-space": "pre-wrap",
							"word-break": "break-word",
							cursor: "pointer"
						},
						onClick: t[5] ||= (e) => N(v.value.negativePrompt, e.currentTarget)
					}, G(v.value.negativePrompt), 9, Vr)], 4)) : z("", !0)
				], 64)) : z("", !0),
				b.value ? (U(), q("div", {
					key: 5,
					style: {
						background: "linear-gradient(135deg, rgba(0, 188, 212, 0.14) 0%, rgba(33, 150, 243, 0.10) 100%)",
						border: "1px solid rgba(0, 188, 212, 0.40)",
						"border-radius": "6px",
						padding: "12px",
						display: "flex",
						"flex-direction": "column",
						gap: "10px"
					},
					class: me({ "mjr-ai-disabled-block": !y.value })
				}, [
					v.value.showAlignment ? (U(), q(F, { key: 0 }, [
						I("div", Hr, [I("span", { title: J(p)("sidebar.generation.promptAlignmentTooltip", "How closely the generated image matches the prompt (SigLIP2 score)") }, G(J(p)("sidebar.generation.promptAlignment", "Prompt Alignment")), 9, Ur)]),
						I("div", Wr, [
							I("div", Gr, [I("div", { style: K({
								height: "100%",
								width: u.value.fillWidth,
								background: u.value.fillColor,
								borderRadius: "4px",
								transition: "width 0.6s ease, background 0.4s ease"
							}) }, null, 4)]),
							I("span", { style: K({
								fontSize: "13px",
								fontWeight: "700",
								color: u.value.scoreColor,
								minWidth: "60px",
								textAlign: "right",
								fontFamily: "'Consolas', 'Monaco', monospace"
							}) }, G(u.value.scoreText), 5),
							I("span", { style: K({
								fontSize: "9px",
								fontWeight: "700",
								padding: "2px 6px",
								borderRadius: "3px",
								background: u.value.qualityBackground,
								color: u.value.qualityColor,
								textTransform: "uppercase",
								letterSpacing: "0.5px"
							}) }, G(u.value.qualityText), 5)
						]),
						u.value.aiStatusVisible ? (U(), q("div", Kr, G(u.value.aiStatusText), 1)) : z("", !0)
					], 64)) : z("", !0),
					I("div", qr, [I("span", { title: J(p)("sidebar.generation.aiCaptionTooltip", "AI caption generated by Florence-2") }, G(v.value.captionLabel), 9, Jr), I("div", Yr, [R(n, {
						type: "button",
						class: "mjr-ai-control",
						severity: "secondary",
						text: "",
						disabled: !S.value || l.value,
						style: K([{
							border: "1px solid rgba(0,188,212,0.45)",
							background: "rgba(0,188,212,0.12)",
							color: "#00BCD4",
							"border-radius": "4px",
							"font-size": "10px",
							"font-weight": "600",
							padding: "2px 8px",
							cursor: "pointer"
						}, {
							opacity: S.value ? "1" : "0.6",
							cursor: S.value ? "pointer" : "default"
						}]),
						onClick: ue(ce, ["stop"])
					}, {
						default: V(() => [pe(G(c.value), 1)]),
						_: 1
					}, 8, ["disabled", "style"]), R(n, {
						type: "button",
						class: "mjr-ai-control",
						severity: "secondary",
						text: "",
						disabled: !C.value,
						style: K([{
							border: "1px solid rgba(0,188,212,0.45)",
							background: "rgba(0,188,212,0.12)",
							color: "#00BCD4",
							"border-radius": "4px",
							"font-size": "10px",
							"font-weight": "600",
							padding: "2px 8px",
							cursor: "pointer"
						}, {
							opacity: C.value ? "1" : "0.6",
							cursor: C.value ? "pointer" : "default"
						}]),
						onClick: ue(B, ["stop"])
					}, {
						default: V(() => [pe(G(s.value), 1)]),
						_: 1
					}, 8, ["disabled", "style"])])]),
					I("div", {
						title: y.value ? J(p)("sidebar.generation.copyCaptionTooltip", "Click to copy caption") : J(p)("sidebar.generation.aiCaptionDisabled", "AI caption controls are disabled"),
						style: K({
							marginTop: "4px",
							padding: "8px",
							borderRadius: "6px",
							border: "1px solid rgba(0, 188, 212, 0.30)",
							background: "rgba(0, 188, 212, 0.08)",
							color: "rgba(230, 250, 255, 0.95)",
							fontSize: "11px",
							lineHeight: "1.45",
							whiteSpace: "pre-wrap",
							wordBreak: "break-word",
							cursor: C.value ? "copy" : "default"
						}),
						onClick: B
					}, G(x.value), 13, Xr)
				], 2)) : z("", !0),
				ee.value.length ? (U(), q("div", {
					key: 6,
					style: K(h("#9C27B0", {
						emphasis: !0,
						startAlpha: .18,
						endAlpha: .1
					}))
				}, [I("div", Zr, G(J(p)("sidebar.generation.models", "Models")), 1), I("div", Qr, [(U(!0), q(F, null, L(ee.value, (e) => (U(), q("div", {
					key: `models-top-${e.key}`,
					style: K(D(O(e), !0))
				}, [
					I("div", { style: K({
						fontSize: "10px",
						fontWeight: "800",
						color: O(e),
						letterSpacing: "0.6px",
						textTransform: "uppercase"
					}) }, G(e.label), 5),
					(U(!0), q(F, null, L(e.modelFields, (t) => (U(), q("div", {
						key: `model-top-${e.key}-${t.label}`,
						style: {
							display: "flex",
							"flex-direction": "column",
							gap: "3px",
							"min-width": "0"
						}
					}, [I("span", $r, G(t.label), 1), I("span", {
						style: {
							"font-size": "12px",
							color: "var(--fg-color, rgba(255,255,255,0.96))",
							"line-height": "1.35",
							"word-break": "break-word",
							cursor: "pointer"
						},
						onClick: (e) => N(t.value, e.currentTarget)
					}, G(t.value || "-"), 9, ei)]))), 128)),
					e.loras.length ? (U(), q("div", ti, [t[14] ||= I("span", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.58)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "LoRA", -1), (U(!0), q(F, null, L(e.loras, (t, n) => (U(), q("span", {
						key: `model-top-${e.key}-lora-${n}`,
						style: {
							"font-size": "12px",
							color: "var(--fg-color, rgba(255,255,255,0.92))",
							"line-height": "1.35",
							"word-break": "break-word",
							padding: "6px 8px",
							"border-radius": "6px",
							background: "rgba(255,255,255,0.05)",
							border: "1px solid rgba(255,255,255,0.08)",
							cursor: "pointer"
						},
						onClick: (e) => N(t, e.currentTarget)
					}, G(t), 9, ni))), 128))])) : z("", !0)
				], 4))), 128))])], 4)) : z("", !0),
				v.value.lyrics ? (U(), q("div", {
					key: 7,
					style: K(h("#00BCD4", { emphasis: !1 }))
				}, [I("div", ri, [I("span", null, G(J(p)("sidebar.generation.lyrics", "Lyrics")), 1)]), I("div", ii, G(v.value.lyrics), 1)], 4)) : z("", !0),
				v.value.branchCards.length ? (U(), q(F, { key: 8 }, [
					z("", !0),
					w.value.length ? (U(), q("div", {
						key: 1,
						style: K(h("#FF9800", {
							emphasis: !0,
							startAlpha: .16,
							endAlpha: .1
						}))
					}, [I("div", ai, G(J(p)("sidebar.generation.sampling", "Sampling")), 1), I("div", oi, [(U(!0), q(F, null, L(w.value, (e) => (U(), q("div", {
						key: `sampling-${e.key}`,
						style: K(D(A(e), !0))
					}, [I("div", { style: K({
						fontSize: "10px",
						fontWeight: "800",
						color: A(e),
						letterSpacing: "0.6px",
						textTransform: "uppercase"
					}) }, G(e.label), 5), (U(!0), q(F, null, L(e.samplingFields, (t) => (U(), q("div", {
						key: `sampling-row-${e.key}-${t.label}`,
						style: {
							display: "grid",
							"grid-template-columns": "minmax(48px,0.8fr) minmax(0,1fr)",
							gap: "8px",
							"font-size": "11px",
							color: "rgba(255,255,255,0.72)",
							"align-items": "start"
						}
					}, [I("span", null, G(t.label), 1), I("span", {
						style: {
							color: "var(--fg-color, #ddd)",
							"word-break": "break-word",
							"text-align": "right",
							cursor: "pointer"
						},
						onClick: (e) => N(t.value, e.currentTarget)
					}, G(t.value), 9, si)]))), 128))], 4))), 128))])], 4)) : z("", !0),
					z("", !0)
				], 64)) : v.value.modelGroups.length ? (U(), q("div", {
					key: 9,
					style: K(h("#9C27B0", {
						emphasis: !0,
						startAlpha: .18,
						endAlpha: .1
					}))
				}, [I("div", ci, G(J(p)("sidebar.generation.models", "Models")), 1), I("div", li, [(U(!0), q(F, null, L(v.value.modelGroups, (e) => (U(), q("div", {
					key: `model-group-${e.key}`,
					style: K(D(re(e.key), !0))
				}, [
					I("div", ui, [I("div", { style: K({
						fontSize: "10px",
						fontWeight: "800",
						color: re(e.key),
						letterSpacing: "0.6px",
						textTransform: "uppercase"
					}) }, G(e.label), 5), I("span", { style: K({
						fontSize: "9px",
						fontWeight: "700",
						color: "#fff",
						background: m(re(e.key), .22),
						border: `1px solid ${m(re(e.key), .48)}`,
						borderRadius: "999px",
						padding: "2px 8px",
						letterSpacing: "0.4px",
						textTransform: "uppercase"
					}) }, G(e.loras?.length || 0) + " LoRA ", 5)]),
					I("div", di, [t[15] ||= I("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.58)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, " UNet ", -1), I("div", {
						style: {
							"font-size": "12px",
							color: "var(--fg-color, rgba(255,255,255,0.96))",
							"line-height": "1.45",
							"word-break": "break-word",
							cursor: "pointer"
						},
						onClick: (t) => N(e.model, t.currentTarget)
					}, G(e.model || "-"), 9, fi)]),
					e.loras?.length ? (U(), q("div", pi, [I("div", mi, G(J(p)("sidebar.generation.loraStack", "LoRA Stack")), 1), I("div", hi, [(U(!0), q(F, null, L(e.loras, (t, n) => (U(), q("div", {
						key: `${e.key}-lora-${n}`,
						style: {
							"font-size": "12px",
							color: "var(--fg-color, rgba(255,255,255,0.92))",
							"line-height": "1.4",
							"word-break": "break-word",
							padding: "6px 8px",
							"border-radius": "6px",
							background: "rgba(255,255,255,0.05)",
							border: "1px solid rgba(255,255,255,0.08)",
							cursor: "pointer"
						},
						onClick: (e) => N(t, e.currentTarget)
					}, G(t), 9, gi))), 128))])])) : z("", !0)
				], 4))), 128))])], 4)) : z("", !0),
				(U(!0), q(F, null, L(T.value, (e) => (U(), q("div", {
					key: e.key,
					style: K(h(e.accent, { emphasis: e.emphasis }))
				}, [I("div", { style: K({
					fontSize: "11px",
					fontWeight: "600",
					color: e.accent,
					textTransform: "uppercase",
					letterSpacing: "0.5px",
					marginBottom: "10px"
				}) }, G(e.title), 5), I("div", _i, [(U(!0), q(F, null, L(e.fields, (t) => (U(), q(F, { key: `${e.key}-${t.label}` }, [I("div", {
					title: t.label,
					style: {
						"font-size": "11px",
						color: "var(--mjr-muted, rgba(127,127,127,0.9))",
						"font-weight": "500",
						display: "flex",
						"align-items": "center",
						gap: "6px"
					}
				}, [I("span", null, G(t.label) + ":", 1), t.override ? (U(), q("span", {
					key: 0,
					style: K(_()),
					title: J(p)("sidebar.generation.overrideTooltip", "This field was forced by Majoor Gen Info Override")
				}, G(J(p)("sidebar.generation.override", "override")), 13, yi)) : z("", !0)], 8, vi), I("div", {
					title: `${t.label}: ${t.value}`,
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.95))",
						"word-break": "break-word",
						"white-space": "pre-wrap",
						cursor: "pointer"
					},
					onClick: (e) => N(t.value, e.currentTarget)
				}, G(t.value), 9, bi)], 64))), 128))])], 4))), 128)),
				v.value.notesFields.length ? (U(), q("div", {
					key: 10,
					style: K(h("#4CAF50", { emphasis: !1 }))
				}, [I("div", xi, G(J(p)("sidebar.generation.notes", "Notes")), 1), (U(!0), q(F, null, L(v.value.notesFields, (e) => (U(), q("div", {
					key: e.label,
					title: `${e.label}: ${e.value}`,
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.9))",
						"line-height": "1.5",
						"white-space": "pre-wrap",
						"word-break": "break-word",
						cursor: "pointer"
					},
					onClick: (t) => N(e.value, t.currentTarget)
				}, G(e.value), 9, Si))), 128))], 4)) : z("", !0),
				v.value.moduleBlocks.length ? (U(), q("div", {
					key: 11,
					style: K(h("#26C6DA", {
						emphasis: !0,
						startAlpha: .14,
						endAlpha: .08
					}))
				}, [I("div", Ci, G(J(p)("sidebar.generation.modules", "Modules")), 1), I("div", wi, [(U(!0), q(F, null, L(v.value.moduleBlocks, (e) => (U(), q("div", {
					key: `module-${e.key}-${e.title}`,
					style: K(D(e.accent, !1))
				}, [I("div", { style: K({
					fontSize: "10px",
					fontWeight: "800",
					color: e.accent,
					letterSpacing: "0.6px",
					textTransform: "uppercase"
				}) }, G(e.title), 5), (U(!0), q(F, null, L(e.fields, (t) => (U(), q("div", {
					key: `module-${e.key}-${t.label}`,
					style: {
						display: "flex",
						"flex-direction": "column",
						gap: "3px",
						"min-width": "0"
					}
				}, [I("span", Ti, G(t.label), 1), I("span", {
					title: `${t.label}: ${t.value}`,
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.9))",
						"line-height": "1.35",
						"white-space": "pre-wrap",
						"word-break": "break-word",
						cursor: "pointer"
					},
					onClick: (e) => N(t.value, e.currentTarget)
				}, G(t.value), 9, Ei)]))), 128))], 4))), 128))])], 4)) : z("", !0),
				v.value.ttsInstruction ? (U(), q("div", {
					key: 12,
					style: K(h("#26A69A", { emphasis: !1 }))
				}, [I("div", Di, [I("span", null, G(J(p)("sidebar.generation.ttsInstruction", "TTS Instruction")), 1)]), I("div", {
					title: J(p)("action.clickToCopy", "Click to copy"),
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.9))",
						"line-height": "1.5",
						"white-space": "pre-wrap",
						"word-break": "break-word",
						cursor: "pointer"
					},
					onClick: t[6] ||= (e) => N(v.value.ttsInstruction, e.currentTarget)
				}, G(v.value.ttsInstruction), 9, Oi)], 4)) : z("", !0),
				v.value.seed !== null && v.value.seed !== void 0 && v.value.seed !== "" ? (U(), q("div", {
					key: 13,
					style: K(g())
				}, [I("div", ki, G(J(p)("sidebar.generation.seed", "SEED")), 1), I("div", {
					title: J(p)("sidebar.generation.copySeedTooltip", "Click to copy seed: {seed}", { seed: v.value.seed }),
					style: {
						"font-size": "18px",
						"font-weight": "700",
						color: "#fff",
						"font-family": "'Consolas', 'Monaco', monospace",
						"letter-spacing": "1px",
						cursor: "pointer",
						padding: "4px 8px",
						"border-radius": "4px",
						transition: "background 0.2s"
					},
					onClick: t[7] ||= (e) => N(v.value.seed, e.currentTarget, "rgba(76, 175, 80, 0.4)")
				}, G(v.value.seed), 9, Ai)], 4)) : z("", !0),
				v.value.inputFiles.length ? (U(), q("div", {
					key: 14,
					style: K(h("#4CAF50", {
						emphasis: !0,
						startAlpha: .16,
						endAlpha: .1
					}))
				}, [I("div", {
					title: J(p)("tooltip.generationInputs", "Input files used in generation"),
					style: {
						"font-size": "11px",
						"font-weight": "600",
						color: "#4CAF50",
						"text-transform": "uppercase",
						"letter-spacing": "0.5px",
						"margin-bottom": "8px"
					}
				}, G(J(p)("sidebar.generation.sourceFiles", "Source Files")), 9, ji), I("div", Mi, [(U(!0), q(F, null, L(v.value.inputFiles, (e) => (U(), se(Nn, {
					key: e.id,
					"input-file": e
				}, null, 8, ["input-file"]))), 128))])], 4)) : z("", !0)
			]));
		};
	}
}), Pi = {
	key: 0,
	class: "mjr-sidebar-section",
	style: {
		background: "var(--comfy-menu-bg, rgba(0,0,0,0.2))",
		border: "1px solid var(--border-color, rgba(255,255,255,0.14))",
		"border-radius": "8px",
		padding: "12px",
		"min-width": "300px"
	}
}, Fi = { style: { "margin-bottom": "12px" } }, Ii = { style: {
	"font-size": "16px",
	"font-weight": "800",
	color: "rgba(255,255,255,0.94)",
	"line-height": "1.25",
	overflow: "hidden",
	"text-overflow": "ellipsis"
} }, Li = ["title"], Ri = {
	key: 1,
	style: {
		display: "flex",
		"flex-wrap": "wrap",
		gap: "6px",
		"margin-top": "8px",
		"min-width": "0"
	},
	"aria-label": "Workflow metadata badges"
}, zi = ["title"], Bi = { style: {
	overflow: "hidden",
	"text-overflow": "ellipsis",
	"white-space": "nowrap"
} }, Vi = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "8px",
	"margin-bottom": "10px"
} }, Hi = { style: {
	padding: "4px 9px",
	"border-radius": "999px",
	background: "rgba(33,150,243,0.14)",
	border: "1px solid rgba(33,150,243,0.30)",
	"font-size": "11px",
	"font-weight": "700",
	color: "#90CAF9",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, Ui = {
	key: 0,
	style: {
		padding: "4px 9px",
		"border-radius": "999px",
		background: "rgba(255,255,255,0.06)",
		border: "1px solid rgba(255,255,255,0.12)",
		"font-size": "11px",
		"font-weight": "600",
		color: "rgba(255,255,255,0.82)"
	}
}, Wi = { style: {
	display: "grid",
	"grid-template-columns": "repeat(2, minmax(0, 1fr))",
	gap: "8px",
	"margin-bottom": "12px"
} }, Gi = {
	key: 0,
	style: {
		padding: "8px 10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.04)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, Ki = { style: {
	"font-size": "13px",
	"font-weight": "750",
	color: "rgba(255,255,255,0.92)",
	"margin-top": "3px"
} }, qi = {
	key: 1,
	style: {
		padding: "8px 10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.04)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, Ji = { style: {
	"font-size": "13px",
	"font-weight": "750",
	color: "rgba(255,255,255,0.92)",
	"margin-top": "3px"
} }, Yi = {
	key: 2,
	style: {
		padding: "8px 10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.04)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, Xi = { style: {
	"font-size": "13px",
	"font-weight": "750",
	color: "rgba(255,255,255,0.92)",
	"margin-top": "3px"
} }, Zi = {
	key: 3,
	style: {
		padding: "8px 10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.04)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, Qi = { style: {
	"font-size": "12px",
	"font-weight": "650",
	color: "rgba(255,255,255,0.84)",
	"margin-top": "3px"
} }, $i = {
	key: 0,
	style: {
		"font-size": "11px",
		color: "rgba(255,255,255,0.54)",
		"margin-top": "2px"
	}
}, ea = {
	key: 0,
	style: {
		"margin-bottom": "12px",
		padding: "10px",
		"border-radius": "10px",
		background: "rgba(244,67,54,0.08)",
		border: "1px solid rgba(244,67,54,0.25)"
	}
}, ta = {
	key: 1,
	style: {
		display: "flex",
		"flex-wrap": "wrap",
		gap: "5px"
	}
}, na = {
	key: 1,
	style: {
		"margin-bottom": "12px",
		padding: "10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.035)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, ra = {
	key: 0,
	style: {
		"font-size": "12px",
		"line-height": "1.45",
		color: "rgba(255,255,255,0.82)",
		"white-space": "pre-wrap"
	}
}, ia = { style: {
	display: "grid",
	"grid-template-columns": "repeat(3, minmax(0, 1fr))",
	gap: "8px",
	"margin-bottom": "12px"
} }, aa = {
	key: 2,
	style: {
		"margin-bottom": "12px",
		padding: "10px",
		"border-radius": "10px",
		background: "rgba(76,175,80,0.07)",
		border: "1px solid rgba(76,175,80,0.22)"
	}
}, oa = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "8px",
	"margin-bottom": "7px"
} }, sa = { style: {
	"font-size": "11px",
	color: "rgba(255,255,255,0.62)"
} }, ca = {
	key: 0,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "6px"
	}
}, la = {
	key: 0,
	style: {
		display: "flex",
		"flex-wrap": "wrap",
		gap: "5px"
	}
}, ua = {
	key: 1,
	style: {
		display: "flex",
		"flex-wrap": "wrap",
		gap: "5px"
	}
}, da = {
	key: 1,
	style: {
		"font-size": "12px",
		color: "rgba(255,255,255,0.78)"
	}
}, fa = {
	key: 2,
	style: {
		"margin-top": "7px",
		"font-size": "11px",
		color: "rgba(255,255,255,0.58)"
	}
}, pa = {
	key: 3,
	style: {
		"margin-top": "8px",
		"font-size": "11px",
		color: "rgba(255,255,255,0.62)"
	}
}, ma = { key: 0 }, ha = { style: {
	display: "grid",
	"grid-template-columns": "repeat(3, minmax(0, 1fr))",
	gap: "8px",
	"margin-bottom": "12px"
} }, ga = { style: {
	padding: "8px 10px",
	"border-radius": "10px",
	background: "rgba(255,255,255,0.04)",
	border: "1px solid rgba(255,255,255,0.10)"
} }, _a = { style: {
	"font-size": "18px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.94)",
	"margin-top": "2px"
} }, va = { style: {
	padding: "8px 10px",
	"border-radius": "10px",
	background: "rgba(255,255,255,0.04)",
	border: "1px solid rgba(255,255,255,0.10)"
} }, ya = { style: {
	"font-size": "18px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.94)",
	"margin-top": "2px"
} }, ba = { style: {
	padding: "8px 10px",
	"border-radius": "10px",
	background: "rgba(255,255,255,0.04)",
	border: "1px solid rgba(255,255,255,0.10)"
} }, xa = { style: {
	"font-size": "18px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.94)",
	"margin-top": "2px"
} }, Sa = {
	key: 3,
	style: {
		"margin-bottom": "12px",
		padding: "10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.03)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, Ca = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px",
	"margin-bottom": "8px",
	"min-width": "0"
} }, wa = { style: {
	"min-width": "0",
	flex: "1 1 auto"
} }, Ta = ["title"], Ea = ["title"], Da = { style: {
	display: "flex",
	gap: "8px",
	"align-items": "center"
} }, Oa = ["placeholder"], ka = {
	key: 4,
	class: "mjr-workflow-tree-wrap"
}, Aa = { class: "mjr-workflow-tree-node" }, ja = { class: "mjr-workflow-tree-node-name" }, Ma = {
	key: 0,
	class: "mjr-workflow-tree-node-type"
}, Na = { class: "mjr-menu-item-hint" }, Pa = {
	key: 0,
	class: "mjr-section-hint"
}, Fa = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px",
	"margin-top": "8px"
} }, Ia = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "6px",
	"align-items": "center"
} }, La = {
	key: 5,
	style: {
		display: "grid",
		"grid-template-columns": "repeat(auto-fit, minmax(180px, 1fr))",
		gap: "8px",
		"align-items": "stretch",
		"margin-top": "10px",
		"margin-bottom": "10px"
	}
}, Ra = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "2px",
	"min-width": "0"
} }, za = { style: {
	"font-size": "13px",
	"font-weight": "600"
} }, Ba = { style: {
	"font-size": "11px",
	color: "rgba(255,255,255,0.58)"
} }, Va = { style: {
	display: "flex",
	gap: "10px",
	"align-items": "stretch",
	"margin-top": "10px"
} }, Ha = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	gap: "10px",
	"margin-top": "8px",
	"font-size": "11px",
	color: "rgba(255,255,255,0.58)"
} }, Ua = ["open"], Wa = { style: {
	background: "rgba(0,0,0,0.5)",
	padding: "10px",
	"border-radius": "6px",
	"font-size": "11px",
	overflow: "auto",
	"max-height": "180px",
	margin: "10px 0 0 0",
	color: "#90CAF9",
	"font-family": "'Consolas', 'Monaco', monospace"
} }, Ga = 1, Ka = 8, qa = 250, Ja = /* @__PURE__ */ B({
	__name: "SidebarWorkflowSection",
	props: { asset: {} },
	setup(n) {
		let r = n, i = Object.freeze({
			nodeColors: !0,
			showLinks: !0,
			showGroups: !0,
			renderBypassState: !0,
			renderErrorState: !0,
			showViewport: !0,
			showNodeLabels: !1,
			size: "comfortable"
		}), a = Object.freeze({
			zoom: 1,
			centerX: null,
			centerY: null,
			hoveredNodeId: null
		}), s = Object.freeze([
			{
				key: "compact",
				label: "Compact",
				height: 120
			},
			{
				key: "comfortable",
				label: "Comfort",
				height: 160
			},
			{
				key: "expanded",
				label: "Expanded",
				height: 220
			}
		]), c = Y(null), l = Y(""), _ = Y(!1), v = Y(!1), b = Y(null), x = Y(!1), S = Y(null), w = Y([]), T = Y(null), E = Y(!1), te = Y(!1), O = Y(ve()), k = Y({ ...a }), ne = Y("crosshair"), A = Y(""), j = null, M = null, P = null;
		function ie(e, t, n) {
			let r = Number(e);
			return Number.isFinite(r) ? Math.max(t, Math.min(n, r)) : t;
		}
		function oe(e) {
			e && typeof e == "object" && (k.value = {
				...k.value,
				zoom: ie(e.zoom ?? k.value.zoom, Ga, Ka),
				centerX: Number.isFinite(Number(e.centerX)) ? Number(e.centerX) : null,
				centerY: Number.isFinite(Number(e.centerY)) ? Number(e.centerY) : null
			});
		}
		function B() {
			k.value = { ...a }, A.value = "";
		}
		function ue(e) {
			let t = e?.metadata_raw ?? null;
			if (!t) return null;
			if (typeof t == "object") return t;
			if (typeof t == "string") {
				let e = t.trim();
				if (!e) return null;
				try {
					let t = JSON.parse(e);
					return t && typeof t == "object" ? t : null;
				} catch {
					return null;
				}
			}
			return null;
		}
		function fe(e) {
			try {
				let t = Object.entries(e || {});
				if (!t.length) return !1;
				let n = 0;
				for (let [, e] of t.slice(0, 50)) if (e && typeof e == "object" && (e.inputs && typeof e.inputs == "object" && (n += 1), n >= 2)) return !0;
			} catch {
				return !1;
			}
			return !1;
		}
		function he(e) {
			let t = ue(e), n = e?.workflow || e?.Workflow || e?.comfy_workflow || t?.workflow || t?.Workflow || t?.comfy_workflow || null;
			if (!n) return null;
			if (typeof n == "object") return n;
			if (typeof n == "string") {
				let e = n.trim();
				if (!e) return null;
				try {
					return JSON.parse(e);
				} catch {
					return null;
				}
			}
			return null;
		}
		function _e(e) {
			let t = ue(e), n = e?.prompt || e?.Prompt || t?.prompt || t?.Prompt || null;
			if (!n) return null;
			if (typeof n == "object") return fe(n) ? n : null;
			if (typeof n == "string") {
				let e = n.trim();
				if (!e) return null;
				try {
					let t = JSON.parse(e);
					return fe(t) ? t : null;
				} catch {
					return null;
				}
			}
			return null;
		}
		function ve() {
			try {
				let e = D?.()?.workflowMinimap;
				if (e && typeof e == "object") return {
					...i,
					...e
				};
			} catch (e) {
				console.debug?.(e);
			}
			try {
				let e = localStorage?.getItem?.(d);
				if (!e) return { ...i };
				let t = JSON.parse(e);
				if (!t || typeof t != "object") return { ...i };
				let n = {
					...i,
					...t
				};
				try {
					let e = D();
					e.workflowMinimap = {
						...e.workflowMinimap,
						...n
					}, ee(e), localStorage?.removeItem?.(d);
				} catch (e) {
					console.debug?.(e);
				}
				return n;
			} catch {
				return { ...i };
			}
		}
		function ye(e) {
			try {
				let t = D();
				t.workflowMinimap = {
					...t.workflowMinimap,
					...e
				}, ee(t);
			} catch (e) {
				console.debug?.(e);
			}
		}
		let X = H(() => {
			let e = he(r.asset) || he(b.value), t = _e(r.asset) || _e(b.value);
			return !e && !t ? null : e || N(t);
		}), be = H(() => String(r.asset?.filepath || r.asset?.path || r.asset?.file_info?.filepath || "").trim()), xe = H(() => {
			if (be.value.toLowerCase().endsWith(".json")) return !0;
			let e = String(r.asset?.kind || "").trim().toLowerCase(), t = String(r.asset?.source || "").trim().toLowerCase();
			return e === "workflow" || t === "workflow";
		}), Se = H(() => String(r.asset?.display_name || r.asset?.name || r.asset?.filename || r.asset?.title || "Workflow").trim()), Ce = H(() => String(r.asset?.task || r.asset?.workflow_task || "").trim()), we = H(() => String(r.asset?.model_family || r.asset?.workflow_model_family || "").trim()), Te = H(() => String(r.asset?.provider || r.asset?.workflow_provider || "").trim()), Ee = H(() => String(r.asset?.runs_on || r.asset?.runsOn || "").trim().toLowerCase()), De = H(() => {
			let e = Ee.value, t = Te.value;
			return e === "api" && t ? `API · ${t}` : e ? t && t.toLowerCase() !== e ? `${e} · ${t}` : e : t;
		}), Oe = H(() => String(r.asset?.notes || "").trim()), ke = H(() => [
			r.asset?.detected_task ? `detected: ${r.asset.detected_task}` : "",
			r.asset?.detected_model_family ? r.asset.detected_model_family : "",
			r.asset?.detected_provider ? r.asset.detected_provider : ""
		].filter(Boolean).join(" · ")), Ae = H(() => Ge(r.asset?.missing_nodes || r.asset?.missingNodes)), je = H(() => Ge(r.asset?.missing_models || r.asset?.missingModels)), Me = H(() => Ge(r.asset?.tags || r.asset?.workflow_tags || r.asset?.tags_json)), Ne = H(() => Me.value.slice(0, 3)), Pe = H(() => Math.max(0, Me.value.length - Ne.value.length)), Fe = H(() => Ge(S.value?.missing_nodes)), Ie = H(() => Ge(S.value?.missing_models)), Le = H(() => Ge(S.value?.warnings)), Re = H(() => {
			let e = S.value;
			return e ? `${Number(e.node_count || 0)} nodes | ${Number(e.subgraph_count || 0)} subgraphs | ${Array.isArray(e.required_nodes) ? e.required_nodes.length : 0} node types` : "";
		}), ze = H(() => {
			let e = w.value?.[0];
			return e ? String(e.filename || "").replace(/\.json$/i, "") : "";
		}), Be = H(() => {
			let e = T.value;
			return e ? `${Number(e.changed?.length || 0)} changed | ${Number(e.added?.length || 0)} added | ${Number(e.removed?.length || 0)} removed` : "";
		}), Ve = H(() => {
			let e = Number(r.asset?.usage_count || r.asset?.usageCount || 0);
			return !Number.isFinite(e) || e <= 0 ? "" : `${Math.floor(e)} use${e === 1 ? "" : "s"}`;
		}), He = H(() => Ke(r.asset?.last_loaded_at || r.asset?.lastLoadedAt)), Ue = H(() => Ke(r.asset?.mtime || r.asset?.modified_at || r.asset?.updated_at)), We = H(() => {
			let e = [];
			r.asset?.favorite && e.push({
				key: "favorite",
				label: "Favorite",
				icon: "pi pi-star-fill",
				tone: "favorite"
			}), Ve.value && e.push({
				key: "usage",
				label: Ve.value,
				icon: "pi pi-play-circle",
				tone: "usage"
			}), He.value && e.push({
				key: "last-loaded",
				label: `Loaded ${He.value}`,
				icon: "pi pi-clock",
				tone: "loaded"
			});
			for (let t of Ne.value) e.push({
				key: `tag-${t}`,
				label: t,
				icon: "pi pi-tag",
				tone: "tag"
			});
			return Pe.value && e.push({
				key: "tags-more",
				label: `+${Pe.value} tags`,
				icon: "pi pi-tags",
				tone: "tag"
			}), e;
		});
		function Z(e) {
			let t = "display:inline-flex;align-items:center;gap:5px;max-width:100%;padding:4px 8px;border-radius:999px;font-size:10px;font-weight:750;line-height:1.1;overflow:hidden";
			return e === "favorite" ? `${t};background:rgba(255,193,7,0.15);border:1px solid rgba(255,193,7,0.34);color:#ffe082` : e === "usage" ? `${t};background:rgba(33,150,243,0.14);border:1px solid rgba(33,150,243,0.30);color:#90caf9` : e === "loaded" ? `${t};background:rgba(76,175,80,0.13);border:1px solid rgba(76,175,80,0.28);color:#a5d6a7` : `${t};background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.14);color:rgba(255,255,255,0.82)`;
		}
		function Ge(e) {
			if (Array.isArray(e)) return e.map((e) => String(e || "").trim()).filter(Boolean);
			if (typeof e == "string") {
				let t = e.trim();
				if (!t) return [];
				try {
					let e = JSON.parse(t);
					if (Array.isArray(e)) return Ge(e);
				} catch {
					return t.split(/[,\n]/).map((e) => e.trim()).filter(Boolean);
				}
			}
			return [];
		}
		function Ke(e) {
			let t = Number(e);
			if (!Number.isFinite(t) || t <= 0) return "";
			let n = t > 1e10 ? t : t * 1e3;
			try {
				return new Date(n).toLocaleString();
			} catch {
				return "";
			}
		}
		async function qe() {
			if (X.value) return;
			let e = be.value;
			if (e && !v.value) {
				v.value = !0;
				try {
					let t = await u(e, { timeoutMs: 25e3 });
					if (!t?.ok) return;
					let n = t?.data?.workflow || t?.workflow || null, r = t?.data?.prompt || t?.prompt || null;
					if (!n && !r) return;
					b.value = {
						workflow: n,
						prompt: r
					};
				} catch (e) {
					console.debug?.(e);
				} finally {
					v.value = !1;
				}
			}
		}
		let Je = H(() => r.asset?.has_generation_data ? "Complete" : "Partial"), Ye = H(() => X.value ? JSON.stringify(X.value, null, 2) : ""), Xe = H(() => String(r.asset?.category || r.asset?.subfolder || r.asset?.folder || "").trim().replace(/^\/+|\/+$/g, "")), Ze = H(() => Xe.value ? Xe.value.split(/[\\/]+/).filter(Boolean) : []), Qe = H(() => Ze.value.at(-1) || Xe.value || "Root"), $e = H(() => Ze.value.slice(-1));
		function et(e, t) {
			let n = e?.id ?? e?.key ?? t + 1;
			return String(e?.title || e?._meta?.title || e?.type || e?.class_type || e?.name || `Node ${n}`);
		}
		function tt(e) {
			return String(e?.type || e?.class_type || e?.name || "").trim();
		}
		function nt() {
			l.value = Xe.value;
		}
		async function rt() {
			if (!xe.value) return;
			let e = String(r.asset?.filepath || r.asset?.path || r.asset?.file_info?.filepath || "").trim();
			if (!e) {
				o(p("toast.workflowMissingPath", "Workflow file path is missing."), "error");
				return;
			}
			let t = String(l.value || "").trim();
			if (t !== Xe.value) {
				_.value = !0;
				try {
					let n = await y({
						filepath: e,
						category: t
					}, { timeoutMs: 3e4 });
					if (!n?.ok) {
						o(n?.error || p("toast.workflowMoveFailed", "Failed to move workflow."), "error");
						return;
					}
					l.value = String(n?.data?.workflow?.category || t || "").trim(), o(p("toast.workflowCategoryUpdated", "Workflow category updated"), "success", 1800);
				} catch {
					o(p("toast.workflowMoveFailed", "Failed to move workflow."), "error");
				} finally {
					_.value = !1;
				}
			}
		}
		async function it() {
			let t = be.value;
			if (!t) {
				o(p("toast.workflowMissingPath", "Workflow file path is missing."), "error");
				return;
			}
			let n = await h({
				filepath: t,
				limit: 12
			}, { timeoutMs: 15e3 });
			if (!n?.ok) {
				o(n?.error || p("toast.workflowLoadFailed", "Failed to load workflow."), "error");
				return;
			}
			let i = Array.isArray(n.data) ? n.data : [];
			if (!i.length) {
				o(p("toast.workflowThumbnailNoCandidates", "No linked outputs are available for this workflow yet."), "warning", 2600);
				return;
			}
			let a = await dn({
				title: p("ctx.setWorkflowThumbnail", "Set workflow thumbnail"),
				workflow: r.asset,
				items: i
			});
			if (!a?.filepath) return;
			let s = await e({
				filepath: t,
				source_filepath: a.filepath
			}, { timeoutMs: 3e4 });
			s?.ok ? (o(p("toast.workflowUpdated", "Workflow updated"), "success", 1800), window?.dispatchEvent?.(new CustomEvent("mjr:reload-grid", { detail: { reason: "workflow-thumbnail-sidebar" } }))) : o(s?.error || p("toast.workflowSaveFailed", "Failed to save workflow."), "error");
		}
		async function at() {
			if (await qe(), !X.value) o(p("toast.workflowLoadFailed", "Failed to load workflow."), "error");
			else try {
				await C.openAssets({
					assets: [{
						...r.asset,
						workflow: X.value,
						Workflow: X.value
					}],
					index: 0,
					mode: "graph"
				});
			} catch (e) {
				console.debug?.(e), o(p("toast.workflowLoadFailed", "Failed to load workflow."), "error");
			}
		}
		async function ot() {
			let e = be.value;
			if (!e) o(p("toast.workflowMissingPath", "Workflow file path is missing."), "error");
			else {
				x.value = !0, S.value = null, w.value = [], T.value = null;
				try {
					let [n, r] = await Promise.all([t(e, { timeoutMs: 2e4 }), f(e, { timeoutMs: 15e3 })]);
					if (!n?.ok) {
						o(n?.error || p("toast.workflowLoadFailed", "Failed to load workflow."), "error");
						return;
					}
					S.value = n.data || {}, w.value = Array.isArray(r?.data?.versions) ? r.data.versions : [];
					let i = w.value[0];
					if (i?.filepath) {
						let t = await g(e, i.filepath, { timeoutMs: 15e3 });
						t?.ok && (T.value = t.data || null);
					}
				} catch (e) {
					console.debug?.(e), o(p("toast.workflowLoadFailed", "Failed to load workflow."), "error");
				} finally {
					x.value = !1;
				}
			}
		}
		let st = H(() => (Array.isArray(X.value?.nodes) ? X.value.nodes : []).slice(0, qa).map((e, t) => {
			let n = e?.id ?? e?.key ?? t + 1, r = tt(e);
			return {
				key: String(n),
				label: et(e, t),
				icon: "pi pi-circle-fill",
				data: {
					id: n,
					type: r
				}
			};
		})), ct = H(() => Math.max(0, Number(lt.value.nodes || 0) - st.value.length)), lt = H(() => {
			let e = X.value;
			return e ? {
				nodes: Array.isArray(e?.nodes) ? e.nodes.length : 0,
				links: Array.isArray(e?.links) && e.links.length || Array.isArray(e?.extra?.links) && e.extra.links.length || 0,
				groups: Array.isArray(e?.groups) && e.groups.length || Array.isArray(e?.extra?.groups) && e.extra.groups.length || Array.isArray(e?.extra?.groupNodes) && e.extra.groupNodes.length || Array.isArray(e?.extra?.group_nodes) && e.extra.group_nodes.length || 0,
				source: e?.extra?.synthetic ? "Synthetic" : "Embedded"
			} : {
				nodes: 0,
				links: 0,
				groups: 0,
				source: ""
			};
		}), ut = H(() => {
			let e = String(O.value?.size || "comfortable");
			return s.find((t) => t.key === e) || s[1];
		}), dt = H(() => `${ut.value.height}px`), ft = H(() => [
			{
				key: "showNodeLabels",
				label: "Node Labels",
				iconClass: "pi pi-tag"
			},
			{
				key: "nodeColors",
				label: "Node Colors",
				iconClass: "pi pi-palette"
			},
			{
				key: "showLinks",
				label: "Show Links",
				iconClass: "pi pi-share-alt"
			},
			{
				key: "showGroups",
				label: "Show Frames/Groups",
				iconClass: "pi pi-th-large"
			},
			{
				key: "renderBypassState",
				label: "Render Bypass State",
				iconClass: "pi pi-ban"
			},
			{
				key: "renderErrorState",
				label: "Render Error State",
				iconClass: "pi pi-exclamation-triangle"
			},
			{
				key: "showViewport",
				label: "Show Viewport",
				iconClass: "pi pi-window-maximize"
			}
		]);
		function Q() {
			let e = c.value, t = X.value;
			if (!e || !t) return;
			let n = Math.max(1, e.clientWidth || 320), r = Math.max(1, e.clientHeight || 120), i = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
			e.width = Math.floor(n * i), e.height = Math.floor(r * i);
			let a = e.getContext("2d");
			a && a.setTransform(i, 0, 0, i, 0, 0), M = re(e, t, {
				...O.value,
				view: k.value
			}) || null, oe(M?.resolvedView);
		}
		function pt(e) {
			m(e);
		}
		function mt(e) {
			let t = c.value;
			if (!t) return null;
			let n = t.getBoundingClientRect?.();
			return n ? {
				x: Number(e?.clientX) - n.left,
				y: Number(e?.clientY) - n.top
			} : null;
		}
		function ht(e) {
			let t = mt(e);
			return !t || !M?.canvasToWorld ? null : {
				local: t,
				world: M.canvasToWorld(t.x, t.y)
			};
		}
		function gt(e) {
			let t = mt(e), n = t && M?.hitTestNode ? M.hitTestNode(t.x, t.y) : null, r = n?.id !== null && n?.id !== void 0 ? String(n.id) : null, i = k.value.hoveredNodeId !== null && k.value.hoveredNodeId !== void 0 ? String(k.value.hoveredNodeId) : null;
			A.value = n?.label || "", r !== i && (k.value = {
				...k.value,
				hoveredNodeId: r
			}, Q());
		}
		function _t(e) {
			e && (pt(e), k.value = {
				...k.value,
				centerX: Number(e.x),
				centerY: Number(e.y)
			}, Q());
		}
		function vt(e) {
			if (Number(e?.button ?? 0) !== 0) return;
			let t = ht(e);
			t && (P = e.pointerId ?? 1, ne.value = "grabbing", c.value?.setPointerCapture?.(P), _t(t.world), gt(e), e.preventDefault?.(), e.stopPropagation?.());
		}
		function yt(e) {
			if (P !== null && e.pointerId === P) {
				let t = ht(e);
				t && _t(t.world), e.preventDefault?.(), e.stopPropagation?.();
			} else gt(e);
		}
		function bt(e) {
			P !== null && e?.pointerId === P && (c.value?.releasePointerCapture?.(P), P = null, ne.value = "crosshair"), e?.type === "pointerleave" && (A.value = "", k.value.hoveredNodeId !== null && (k.value = {
				...k.value,
				hoveredNodeId: null
			}, Q()));
		}
		function xt(e) {
			let t = ht(e), n = M?.resolvedView;
			if (!t || !n) return;
			let r = ie(Number(e?.deltaY) || 0, -240, 240), i = Math.exp(-r * .0025), a = ie((Number(k.value.zoom) || 1) * i, Ga, Ka);
			if (Math.abs(a - (Number(k.value.zoom) || 1)) < .001) {
				e.preventDefault?.(), e.stopPropagation?.();
				return;
			}
			let o = Math.max(1, Number(M?.bounds?.width || 1) / a), s = Math.max(1, Number(M?.bounds?.height || 1) / a), c = ie((Number(t.world.x) - Number(n.viewMinX || 0)) / Math.max(1, Number(n.visibleW || 1)), 0, 1), l = ie((Number(t.world.y) - Number(n.viewMinY || 0)) / Math.max(1, Number(n.visibleH || 1)), 0, 1);
			k.value = {
				...k.value,
				zoom: a,
				centerX: Number(t.world.x) + (.5 - c) * o,
				centerY: Number(t.world.y) + (.5 - l) * s
			}, Q(), gt(e), e.preventDefault?.(), e.stopPropagation?.();
		}
		function St(e) {
			let t = ht(e);
			B(), t && pt(t.world), Q(), e.preventDefault?.(), e.stopPropagation?.();
		}
		function Ct(e) {
			O.value = {
				...O.value,
				[e]: !O.value?.[e]
			}, ye(O.value);
		}
		function wt(e) {
			s.some((t) => t.key === e) && (O.value = {
				...O.value,
				size: e
			}, ye(O.value));
		}
		return ce(() => {
			c.value && typeof ResizeObserver == "function" && (j = new ResizeObserver(() => Q()), j.observe(c.value)), nt(), qe(), Q();
		}), W(X, () => {
			B(), Q();
		}, { flush: "post" }), W(be, () => {
			b.value = null, qe();
		}, { immediate: !0 }), W(Xe, () => {
			nt();
		}), W(O, () => {
			Q();
		}, {
			deep: !0,
			flush: "post"
		}), W(E, () => {
			Q();
		}, { flush: "post" }), de(() => {
			try {
				j?.disconnect?.();
			} catch (e) {
				console.debug?.(e);
			}
			j = null, P = null;
		}), (e, t) => {
			let n = le("MButton"), r = le("MTree");
			return X.value ? (U(), q("div", Pi, [
				t[18] ||= I("div", { style: {
					"font-size": "13px",
					"font-weight": "600",
					color: "var(--fg-color, #eaeaea)",
					"margin-bottom": "12px",
					"text-transform": "uppercase",
					"letter-spacing": "0.5px"
				} }, " ComfyUI Workflow ", -1),
				I("div", Fi, [
					I("div", Ii, G(Se.value), 1),
					be.value ? (U(), q("div", {
						key: 0,
						style: {
							"font-size": "11px",
							color: "rgba(255,255,255,0.48)",
							"margin-top": "4px",
							overflow: "hidden",
							"text-overflow": "ellipsis",
							"white-space": "nowrap"
						},
						title: be.value
					}, G(be.value), 9, Li)) : z("", !0),
					We.value.length ? (U(), q("div", Ri, [(U(!0), q(F, null, L(We.value, (e) => (U(), q("span", {
						key: e.key,
						style: K(Z(e.tone)),
						title: e.label
					}, [I("i", {
						class: me(e.icon),
						style: {
							"font-size": "10px",
							flex: "0 0 auto"
						}
					}, null, 2), I("span", Bi, G(e.label), 1)], 12, zi))), 128))])) : z("", !0)
				]),
				I("div", Vi, [I("div", Hi, G(Je.value), 1), lt.value.source ? (U(), q("div", Ui, G(lt.value.source), 1)) : z("", !0)]),
				I("div", Wi, [
					Ce.value ? (U(), q("div", Gi, [t[3] ||= I("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Task", -1), I("div", Ki, G(Ce.value), 1)])) : z("", !0),
					we.value ? (U(), q("div", qi, [t[4] ||= I("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Model", -1), I("div", Ji, G(we.value), 1)])) : z("", !0),
					De.value ? (U(), q("div", Yi, [t[5] ||= I("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Runs on", -1), I("div", Xi, G(De.value), 1)])) : z("", !0),
					Ve.value || Ue.value ? (U(), q("div", Zi, [
						t[6] ||= I("div", { style: {
							"font-size": "10px",
							"font-weight": "700",
							color: "rgba(255,255,255,0.55)",
							"text-transform": "uppercase",
							"letter-spacing": "0.4px"
						} }, "Library", -1),
						I("div", Qi, G(Ve.value || Ue.value), 1),
						Ve.value && Ue.value ? (U(), q("div", $i, G(Ue.value), 1)) : z("", !0)
					])) : z("", !0)
				]),
				Ae.value.length || je.value.length ? (U(), q("div", ea, [
					t[7] ||= I("div", { style: {
						"font-size": "10px",
						"font-weight": "800",
						color: "#ef9a9a",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px",
						"margin-bottom": "6px"
					} }, "Missing dependencies", -1),
					Ae.value.length ? (U(), q("div", {
						key: 0,
						style: K({
							display: "flex",
							flexWrap: "wrap",
							gap: "5px",
							marginBottom: je.value.length ? "7px" : "0"
						})
					}, [(U(!0), q(F, null, L(Ae.value, (e) => (U(), q("span", {
						key: `node-${e}`,
						style: {
							padding: "3px 7px",
							"border-radius": "999px",
							background: "rgba(244,67,54,0.16)",
							"font-size": "10px",
							"font-weight": "700",
							color: "#ffcdd2"
						}
					}, G(e), 1))), 128))], 4)) : z("", !0),
					je.value.length ? (U(), q("div", ta, [(U(!0), q(F, null, L(je.value, (e) => (U(), q("span", {
						key: `model-${e}`,
						style: {
							padding: "3px 7px",
							"border-radius": "999px",
							background: "rgba(255,152,0,0.16)",
							"font-size": "10px",
							"font-weight": "700",
							color: "#ffe0b2"
						}
					}, G(e), 1))), 128))])) : z("", !0)
				])) : z("", !0),
				Oe.value || ke.value ? (U(), q("div", na, [Oe.value ? (U(), q("div", ra, G(Oe.value), 1)) : z("", !0), ke.value ? (U(), q("div", {
					key: 1,
					style: K({
						fontSize: "11px",
						color: "rgba(255,255,255,0.48)",
						marginTop: Oe.value ? "7px" : "0"
					})
				}, G(ke.value), 5)) : z("", !0)])) : z("", !0),
				I("div", ia, [
					R(n, {
						type: "button",
						severity: "secondary",
						text: "",
						rounded: "",
						style: {
							height: "34px",
							"border-radius": "9px",
							border: "1px solid rgba(255,255,255,0.12)",
							background: "rgba(33,150,243,0.14)",
							color: "rgba(255,255,255,0.92)",
							"font-size": "12px",
							"font-weight": "750",
							display: "inline-flex",
							"align-items": "center",
							"justify-content": "center",
							gap: "7px"
						},
						onClick: it
					}, {
						default: V(() => [t[8] ||= I("i", { class: "pi pi-image" }, null, -1), I("span", null, G(J(p)("ctx.setWorkflowThumbnail", "Set workflow thumbnail")), 1)]),
						_: 1
					}),
					R(n, {
						type: "button",
						severity: "secondary",
						text: "",
						rounded: "",
						style: {
							height: "34px",
							"border-radius": "9px",
							border: "1px solid rgba(255,255,255,0.12)",
							background: "rgba(255,255,255,0.06)",
							color: "rgba(255,255,255,0.92)",
							"font-size": "12px",
							"font-weight": "750",
							display: "inline-flex",
							"align-items": "center",
							"justify-content": "center",
							gap: "7px"
						},
						onClick: at
					}, {
						default: V(() => [t[9] ||= I("i", { class: "pi pi-search" }, null, -1), I("span", null, G(J(p)("ctx.inspect", "Inspect")), 1)]),
						_: 1
					}),
					R(n, {
						type: "button",
						severity: "secondary",
						text: "",
						rounded: "",
						disabled: x.value,
						style: {
							height: "34px",
							"border-radius": "9px",
							border: "1px solid rgba(255,255,255,0.12)",
							background: "rgba(76,175,80,0.12)",
							color: "rgba(255,255,255,0.92)",
							"font-size": "12px",
							"font-weight": "750",
							display: "inline-flex",
							"align-items": "center",
							"justify-content": "center",
							gap: "7px"
						},
						onClick: ot
					}, {
						default: V(() => [I("i", { class: me(x.value ? "pi pi-spin pi-spinner" : "pi pi-check-circle") }, null, 2), I("span", null, G(x.value ? "Checking" : "Validate"), 1)]),
						_: 1
					}, 8, ["disabled"])
				]),
				S.value ? (U(), q("div", aa, [
					I("div", oa, [t[10] ||= I("div", { style: {
						"font-size": "10px",
						"font-weight": "800",
						color: "#a5d6a7",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Workflow diagnostics", -1), I("div", sa, G(Re.value), 1)]),
					Fe.value.length || Ie.value.length ? (U(), q("div", ca, [Fe.value.length ? (U(), q("div", la, [(U(!0), q(F, null, L(Fe.value, (e) => (U(), q("span", {
						key: `diag-node-${e}`,
						style: {
							padding: "3px 7px",
							"border-radius": "999px",
							background: "rgba(244,67,54,0.16)",
							"font-size": "10px",
							"font-weight": "700",
							color: "#ffcdd2"
						}
					}, " Missing node: " + G(e), 1))), 128))])) : z("", !0), Ie.value.length ? (U(), q("div", ua, [(U(!0), q(F, null, L(Ie.value, (e) => (U(), q("span", {
						key: `diag-model-${e}`,
						style: {
							padding: "3px 7px",
							"border-radius": "999px",
							background: "rgba(255,152,0,0.16)",
							"font-size": "10px",
							"font-weight": "700",
							color: "#ffe0b2"
						}
					}, " Missing model: " + G(e), 1))), 128))])) : z("", !0)])) : (U(), q("div", da, " No missing dependencies detected by the current ComfyUI runtime. ")),
					Le.value.length ? (U(), q("div", fa, G(Le.value.join(" | ")), 1)) : z("", !0),
					ze.value || Be.value ? (U(), q("div", pa, [pe(" Latest version: " + G(ze.value || "none"), 1), Be.value ? (U(), q("span", ma, " | Diff: " + G(Be.value), 1)) : z("", !0)])) : z("", !0)
				])) : z("", !0),
				I("div", ha, [
					I("div", ga, [t[11] ||= I("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Nodes", -1), I("div", _a, G(lt.value.nodes), 1)]),
					I("div", va, [t[12] ||= I("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Links", -1), I("div", ya, G(lt.value.links), 1)]),
					I("div", ba, [t[13] ||= I("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Groups", -1), I("div", xa, G(lt.value.groups), 1)])
				]),
				xe.value ? (U(), q("div", Sa, [I("div", Ca, [I("div", wa, [t[14] ||= I("div", { style: {
					"font-size": "10px",
					"font-weight": "700",
					color: "rgba(255,255,255,0.55)",
					"text-transform": "uppercase",
					"letter-spacing": "0.4px"
				} }, "Category", -1), I("div", {
					title: Xe.value || "Root",
					style: {
						"font-size": "12px",
						color: "rgba(255,255,255,0.8)",
						"margin-top": "2px",
						overflow: "hidden",
						"text-overflow": "ellipsis",
						"white-space": "nowrap",
						"max-width": "100%"
					}
				}, G(Qe.value), 9, Ta)]), $e.value.length ? (U(), q("div", {
					key: 0,
					title: Xe.value,
					style: {
						display: "flex",
						"flex-wrap": "wrap",
						gap: "4px",
						"justify-content": "flex-end",
						"min-width": "0",
						"max-width": "45%"
					}
				}, [(U(!0), q(F, null, L($e.value, (e) => (U(), q("span", {
					key: e,
					style: {
						padding: "3px 7px",
						"border-radius": "999px",
						background: "rgba(33,150,243,0.12)",
						border: "1px solid rgba(33,150,243,0.22)",
						"font-size": "10px",
						"font-weight": "700",
						color: "#90CAF9",
						"text-transform": "uppercase",
						"letter-spacing": "0.3px",
						"max-width": "100%",
						overflow: "hidden",
						"text-overflow": "ellipsis",
						"white-space": "nowrap"
					}
				}, G(e), 1))), 128))], 8, Ea)) : z("", !0)]), I("div", Da, [ae(I("input", {
					"onUpdate:modelValue": t[0] ||= (e) => l.value = e,
					type: "text",
					placeholder: J(p)("dialog.workflowCategory", "Workflow category"),
					style: {
						flex: "1",
						"min-width": "0",
						padding: "9px 10px",
						"border-radius": "8px",
						border: "1px solid rgba(255,255,255,0.12)",
						background: "rgba(0,0,0,0.22)",
						color: "rgba(255,255,255,0.92)",
						"font-size": "12px"
					}
				}, null, 8, Oa), [[ge, l.value]]), R(n, {
					type: "button",
					severity: "secondary",
					text: "",
					rounded: "",
					disabled: _.value,
					style: K({
						padding: "8px 12px",
						borderRadius: "8px",
						border: "1px solid rgba(255,255,255,0.12)",
						background: _.value ? "rgba(255,255,255,0.06)" : "rgba(33,150,243,0.16)",
						color: "rgba(255,255,255,0.92)",
						cursor: _.value ? "wait" : "pointer",
						fontSize: "12px",
						fontWeight: "700",
						whiteSpace: "nowrap"
					}),
					onClick: rt
				}, {
					default: V(() => [pe(G(_.value ? "Saving..." : "Move"), 1)]),
					_: 1
				}, 8, ["disabled", "style"])])])) : z("", !0),
				st.value.length ? (U(), q("div", ka, [
					t[15] ||= I("div", { class: "mjr-section-title" }, " Workflow Nodes ", -1),
					R(r, {
						value: st.value,
						class: "mjr-workflow-tree",
						"scroll-height": "180px",
						pt: {
							wrapper: { class: "mjr-workflow-tree-scroll" },
							rootChildren: { class: "mjr-workflow-tree-list" },
							nodeContent: { class: "mjr-workflow-tree-node-content" },
							nodeToggleButton: { class: "mjr-workflow-tree-toggle" },
							nodeIcon: { class: "mjr-workflow-tree-icon" },
							nodeLabel: { class: "mjr-workflow-tree-label" }
						}
					}, {
						default: V(({ node: e }) => [I("span", Aa, [
							I("span", ja, G(e.label), 1),
							e.data?.type ? (U(), q("span", Ma, G(e.data.type), 1)) : z("", !0),
							I("span", Na, "#" + G(e.data?.id), 1)
						])]),
						_: 1
					}, 8, ["value"]),
					ct.value ? (U(), q("div", Pa, " +" + G(ct.value) + " more nodes ", 1)) : z("", !0)
				])) : z("", !0),
				I("div", Fa, [I("div", Ia, [(U(!0), q(F, null, L(J(s), (e) => (U(), se(n, {
					key: e.key,
					type: "button",
					severity: "secondary",
					text: "",
					rounded: "",
					title: `${e.label} minimap`,
					style: K({
						appearance: "none",
						border: O.value.size === e.key ? "1px solid rgba(33,150,243,0.55)" : "1px solid rgba(255,255,255,0.12)",
						borderRadius: "999px",
						padding: "4px 10px",
						background: O.value.size === e.key ? "rgba(33,150,243,0.18)" : "rgba(255,255,255,0.04)",
						color: O.value.size === e.key ? "#90CAF9" : "rgba(255,255,255,0.78)",
						fontSize: "11px",
						fontWeight: O.value.size === e.key ? "700" : "600",
						cursor: "pointer"
					}),
					onClick: (t) => wt(e.key)
				}, {
					default: V(() => [pe(G(e.label), 1)]),
					_: 2
				}, 1032, [
					"title",
					"style",
					"onClick"
				]))), 128))]), R(n, {
					type: "button",
					class: "mjr-btn mjr-icon-btn",
					severity: "secondary",
					text: "",
					rounded: "",
					title: J(p)("tooltip.minimapSettings", "Minimap settings"),
					style: {
						width: "28px",
						height: "28px",
						"border-radius": "8px",
						display: "inline-flex",
						"align-items": "center",
						"justify-content": "center",
						border: "1px solid var(--mjr-border, rgba(255,255,255,0.12))",
						background: "rgba(255,255,255,0.06)",
						color: "rgba(255,255,255,0.9)",
						cursor: "pointer"
					},
					onClick: t[1] ||= (e) => E.value = !E.value
				}, {
					default: V(() => [...t[16] ||= [I("i", { class: "pi pi-sliders-h" }, null, -1)]]),
					_: 1
				}, 8, ["title"])]),
				E.value ? (U(), q("div", La, [(U(!0), q(F, null, L(ft.value, (e) => (U(), se(n, {
					key: e.key,
					type: "button",
					severity: "secondary",
					text: "",
					style: K({
						display: "flex",
						alignItems: "center",
						gap: "10px",
						padding: "9px 10px",
						borderRadius: "10px",
						border: O.value?.[e.key] ? "1px solid rgba(76,175,80,0.40)" : "1px solid rgba(255,255,255,0.12)",
						background: O.value?.[e.key] ? "rgba(76,175,80,0.10)" : "rgba(255,255,255,0.04)",
						cursor: "pointer",
						color: "rgba(255,255,255,0.92)",
						textAlign: "left"
					}),
					onClick: (t) => Ct(e.key)
				}, {
					default: V(() => [
						I("span", { style: K({
							width: "22px",
							height: "22px",
							borderRadius: "6px",
							display: "inline-flex",
							alignItems: "center",
							justifyContent: "center",
							background: O.value?.[e.key] ? "rgba(76,175,80,0.95)" : "rgba(255,255,255,0.08)",
							border: O.value?.[e.key] ? "1px solid rgba(76,175,80,0.35)" : "1px solid rgba(255,255,255,0.12)",
							flex: "0 0 auto"
						}) }, [I("i", {
							class: "pi pi-check",
							style: K({
								fontSize: "12px",
								opacity: O.value?.[e.key] ? "1" : "0"
							})
						}, null, 4)], 4),
						I("i", {
							class: me(e.iconClass),
							style: {
								"font-size": "18px",
								opacity: "0.9",
								width: "18px"
							}
						}, null, 2),
						I("div", Ra, [I("div", za, G(e.label), 1), I("div", Ba, G(O.value?.[e.key] ? "On" : "Off"), 1)])
					]),
					_: 2
				}, 1032, ["style", "onClick"]))), 128))])) : z("", !0),
				I("div", Va, [I("canvas", {
					ref_key: "canvasRef",
					ref: c,
					style: K({
						width: "100%",
						height: dt.value,
						cursor: ne.value,
						touchAction: "none",
						borderRadius: "10px",
						marginTop: "0",
						background: "linear-gradient(180deg, rgba(7, 12, 18, 0.95) 0%, rgba(10, 16, 24, 0.92) 100%)",
						border: "1px solid var(--mjr-border, rgba(255,255,255,0.12))",
						boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.03)"
					}),
					onPointerdown: vt,
					onPointermove: yt,
					onPointerup: bt,
					onPointercancel: bt,
					onPointerleave: bt,
					onWheel: xt,
					onDblclick: St
				}, null, 36)]),
				I("div", Ha, [I("span", null, G(A.value || "Click/drag to navigate | wheel to zoom"), 1), I("span", null, G(Math.round((k.value.zoom || 1) * 100)) + "% | " + G(ut.value.label), 1)]),
				I("details", {
					open: te.value,
					style: { "margin-top": "10px" },
					onToggle: t[2] ||= (e) => te.value = e.target.open
				}, [t[17] ||= I("summary", { style: {
					cursor: "pointer",
					color: "var(--mjr-muted, rgba(255,255,255,0.65))",
					"font-size": "12px",
					"user-select": "none"
				} }, " Show raw JSON ", -1), I("pre", Wa, G(Ye.value), 1)], 40, Ua)
			])) : z("", !0);
		};
	}
}), Ya = [
	"aria-busy",
	"aria-disabled",
	"aria-label",
	"aria-valuenow",
	"tabindex"
], Xa = /* @__PURE__ */ B({
	__name: "RatingEditor",
	props: {
		asset: {},
		modelValue: {},
		disabled: { type: Boolean },
		size: {}
	},
	emits: ["update:modelValue", "rating-change"],
	setup(e, { emit: t }) {
		function n(e) {
			return Math.max(0, Math.min(5, Number(e) || 0));
		}
		let r = e, i = t, a = n(r.asset?.rating ?? r.modelValue), s = Y(a), c = Y(0), l = Y(!1), u = a, d = a, f = null, m = H(() => c.value > 0 ? c.value : s.value), h = (e) => e <= m.value ? "#FFD45A" : "#555", g = (e) => e <= m.value ? "scale(1.1)" : "scale(1)", _ = H(() => {
			let e = r.size;
			return typeof e == "number" ? `${Math.max(8, e)}px` : String(e || "").trim() || "16px";
		}), y = (e) => Math.min(100 * 2 ** Math.max(0, e - 1), 2e3), x = (e) => new Promise((t) => setTimeout(t, e));
		function S(e) {
			if (l.value) return;
			let t = n(e);
			u = t, d = t, t !== s.value && (s.value = t);
		}
		function C(e = null) {
			s.value = u, d = u, i("update:modelValue", u), e && o(e, "error");
		}
		async function ee() {
			if (l.value) return;
			l.value = !0;
			let e = Date.now();
			try {
				let t = 0;
				for (; t < 10;) {
					if (Date.now() - e > 3e4) {
						C(p("toast.ratingUpdateFailed", "Rating update failed"));
						break;
					}
					t > 0 && await x(y(t)), t += 1;
					let a = n(d), c = typeof AbortController < "u" ? new AbortController() : null;
					f = c;
					let l = null;
					try {
						l = await b(r.asset, a, c ? { signal: c.signal } : {});
					} catch (e) {
						console.error("Failed to update rating:", e);
					}
					if (!l?.ok) {
						if (l?.code === "ABORTED" && d !== a) continue;
						C(l?.error || p("toast.ratingUpdateFailed", "Rating update failed"));
						break;
					}
					try {
						let e = l?.data?.asset_id ?? null;
						e != null && !v(r.asset.id) && (r.asset.id = e);
					} catch (e) {
						console.debug?.(e);
					}
					u = a, s.value = a;
					try {
						r.asset.rating = a;
					} catch (e) {
						console.debug?.(e);
					}
					if (i("update:modelValue", a), i("rating-change", {
						assetId: r.asset?.id,
						rating: a
					}), w(ie, {
						assetId: r.asset?.id == null ? "" : String(r.asset.id),
						rating: a
					}), d === a) {
						o(p("toast.ratingSetN", { n: a }), "success", 1e3);
						break;
					}
				}
				t >= 10 && C(p("toast.ratingUpdateFailed", "Rating update failed"));
			} finally {
				f = null, l.value = !1;
			}
		}
		function T(e) {
			if (r.disabled) return;
			let t = n(e);
			d = t, s.value = t, c.value = 0, i("update:modelValue", t);
			try {
				f?.abort?.();
			} catch (e) {
				console.debug?.(e);
			}
			ee();
		}
		function E(e) {
			T(e);
		}
		function te(e) {
			r.disabled || (c.value = e);
		}
		function D() {
			c.value = 0;
		}
		function O(e) {
			if (r.disabled) return;
			let t = null;
			switch (e.key) {
				case "ArrowRight":
				case "ArrowUp":
					e.preventDefault(), t = Math.min(5, s.value + 1);
					break;
				case "ArrowLeft":
				case "ArrowDown":
					e.preventDefault(), t = Math.max(0, s.value - 1);
					break;
				case "Home":
					e.preventDefault(), t = 0;
					break;
				case "End":
					e.preventDefault(), t = 5;
					break;
				default: e.key >= "0" && e.key <= "5" && (e.preventDefault(), t = parseInt(e.key, 10));
			}
			t !== null && t !== s.value && T(t);
		}
		return de(() => {
			try {
				f?.abort?.();
			} catch (e) {
				console.debug?.(e);
			}
		}), W(() => r.modelValue, (e) => {
			S(e);
		}), W(() => r.asset?.rating, (e) => {
			S(e);
		}), (t, n) => {
			let r = le("MButton");
			return U(), q("div", {
				class: "mjr-rating-editor",
				style: K({
					display: "inline-flex",
					gap: "2px",
					pointerEvents: e.disabled ? "none" : "auto",
					opacity: e.disabled ? .6 : 1
				}),
				"aria-busy": l.value,
				"aria-disabled": e.disabled,
				role: "slider",
				"aria-label": J(p)("rating.label", "Rating"),
				"aria-valuemin": 0,
				"aria-valuemax": 5,
				"aria-valuenow": s.value,
				tabindex: e.disabled ? -1 : 0,
				onKeydown: O
			}, [(U(), q(F, null, L(5, (t) => R(r, {
				key: t,
				type: "button",
				class: "mjr-rating-star",
				severity: "secondary",
				text: "",
				rounded: "",
				style: K({
					color: h(t),
					transform: g(t),
					fontSize: _.value,
					background: "none",
					border: "none",
					cursor: e.disabled ? "default" : "pointer",
					padding: "0",
					transition: "all 0.15s ease"
				}),
				"aria-label": J(p)("rating.setN", { n: t }),
				"aria-pressed": t <= s.value,
				disabled: e.disabled,
				onClick: (e) => E(t),
				onMouseenter: (e) => te(t),
				onMouseleave: D
			}, {
				default: V(() => [...n[0] ||= [pe(" ★ ", -1)]]),
				_: 1
			}, 8, [
				"style",
				"aria-label",
				"aria-pressed",
				"disabled",
				"onClick",
				"onMouseenter"
			])), 64))], 44, Ya);
		};
	}
}), Za = ["aria-busy"], Qa = ["aria-label"], $a = {
	key: 0,
	class: "mjr-tags-empty"
}, eo = { class: "mjr-tags-input-wrap" }, to = ["aria-selected", "onMouseenter"], no = 100, ro = 200, io = /* @__PURE__ */ B({
	__name: "TagsEditor",
	props: {
		asset: {},
		modelValue: { default: void 0 },
		disabled: {
			type: Boolean,
			default: !1
		},
		autofocus: {
			type: Boolean,
			default: !0
		}
	},
	emits: ["update:modelValue", "tags-change"],
	setup(e, { emit: t }) {
		function n(e) {
			try {
				let t = String(e ?? "").trim();
				if (!t || t.length > no) return null;
				for (let e = 0; e < t.length; e += 1) {
					let n = t.charCodeAt(e);
					if (n <= 31 || n === 127) return null;
				}
				return /[;,]/.test(t) ? null : t;
			} catch {
				return null;
			}
		}
		function r(e) {
			try {
				return String(e ?? "").replace(/[\x00-\x1f\x7f]/g, "").trim() || null;
			} catch {
				return null;
			}
		}
		function i(e) {
			let t = r(e);
			return t ? t.toLowerCase() : "";
		}
		function c(e) {
			let t = [], n = /* @__PURE__ */ new Set();
			for (let i of Array.isArray(e) ? e : []) {
				let e = r(i);
				if (!e) continue;
				let a = e.toLowerCase();
				if (!n.has(a) && (n.add(a), t.push(e), t.length >= ro)) break;
			}
			return t;
		}
		function l(e) {
			if (Array.isArray(e)) return c(e);
			if (typeof e == "string") {
				let t = e.trim();
				if (!t) return [];
				try {
					let e = JSON.parse(t);
					if (Array.isArray(e)) return c(e);
				} catch {
					return c(t.split(","));
				}
			}
			return [];
		}
		function u(e, t) {
			if (!Array.isArray(e) || !Array.isArray(t) || e.length !== t.length) return !1;
			for (let n = 0; n < e.length; n += 1) if (e[n] !== t[n]) return !1;
			return !0;
		}
		let d = e, f = t, m = l(d.asset?.tags ?? d.modelValue ?? []), h = Y([...m]), g = Y(null), _ = Y(""), y = Y(!1), b = Y(-1), x = Y(null), S = Y([]), C = Y(!1), ee = (e) => e?.$el || e || null, T = !1, E = !1, te = null, D = [...m], O = (e) => Math.min(100 * 2 ** Math.max(0, e - 1), 2e3), k = (e) => new Promise((t) => setTimeout(t, e)), ne = () => setTimeout(() => y.value = !1, 200), A = H(() => {
			let e = _.value.toLowerCase().trim();
			if (!e) return [];
			let t = new Set(h.value.map((e) => i(e)).filter(Boolean));
			return S.value.filter((n) => {
				let r = i(n);
				return n.toLowerCase().includes(e) && (!r || !t.has(r));
			}).slice(0, 10);
		}), j = H(() => A.value.length > 0);
		function M(e) {
			if (T) return;
			let t = l(e);
			D = [...t], u(t, h.value) || (h.value = [...t]);
		}
		function re(e) {
			let t = [...e], n = d.asset?.id == null ? "" : String(d.asset.id);
			f("update:modelValue", t), f("tags-change", {
				assetId: d.asset?.id,
				tags: t
			}), w(P, {
				assetId: n,
				tags: t
			});
		}
		async function N() {
			if (d.disabled) return;
			if (T) {
				E = !0;
				try {
					te?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				return;
			}
			T = !0, C.value = !0;
			let e = 0;
			for (; e < 10;) {
				e > 0 && await k(O(e)), e += 1;
				let t = l(h.value), n = typeof AbortController < "u" ? new AbortController() : null;
				te = n;
				let r = null;
				try {
					r = await a(d.asset, t, n ? { signal: n.signal } : {});
				} catch (e) {
					console.error("Failed to update tags:", e);
				}
				if (!r?.ok) {
					if (r?.code === "ABORTED") {
						if (E) {
							E = !1;
							continue;
						}
						break;
					}
					let e = [...D];
					h.value = e, f("update:modelValue", e), o(r?.error || p("toast.tagsUpdateFailed", "Failed to update tags"), "error"), T = !1, te = null, C.value = !1;
					return;
				}
				try {
					let e = r?.data?.asset_id ?? null;
					e != null && !v(d.asset.id) && (d.asset.id = e);
				} catch (e) {
					console.debug?.(e);
				}
				let i = l(Array.isArray(r?.data?.tags) ? r.data.tags : t);
				D = [...i];
				try {
					d.asset.tags = [...i];
				} catch (e) {
					console.debug?.(e);
				}
				if (E || (h.value = [...i]), re(i), o(p("toast.tagsUpdated", "Tags updated"), "success", 1e3), !E) break;
				E = !1;
			}
			if (e >= 10) {
				let e = [...D];
				h.value = e;
				try {
					d.asset.tags = [...e];
				} catch (e) {
					console.debug?.(e);
				}
				f("update:modelValue", e), o(p("toast.tagsUpdateFailed", "Failed to update tags"), "error");
			}
			T = !1, te = null, C.value = !1;
		}
		ce(async () => {
			try {
				await oe(), d.autofocus && ee(g.value)?.focus();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				let e = await s();
				e?.ok && Array.isArray(e?.data) && (S.value = c(e.data));
			} catch (e) {
				console.warn("Failed to load available tags:", e);
			}
		}), de(() => {
			try {
				te?.abort?.();
			} catch (e) {
				console.debug?.(e);
			}
		});
		function ie(e) {
			if (d.disabled) return;
			let t = n(e);
			if (!t) return;
			let r = i(t);
			r && (h.value.some((e) => i(e) === r) || (h.value.length >= ro ? o(p("toast.maxTagsReached", "Maximum number of tags reached"), "warning") : (h.value = [...h.value, t], N())));
		}
		function se(e) {
			if (d.disabled || e < 0 || e >= h.value.length) return;
			let t = [...h.value];
			t.splice(e, 1), h.value = t, N();
		}
		function z(e) {
			if (e.key === "Enter" || e.key === ",") {
				e.preventDefault();
				let t = (y.value && j.value && b.value >= 0 ? A.value[b.value] : null) || _.value.trim();
				t && (ie(t), _.value = "", y.value = !1, b.value = -1, x.value = null);
			} else if (e.key === "Escape") y.value = !1, b.value = -1, x.value = null;
			else if (e.key === "ArrowDown") e.preventDefault(), j.value && (b.value = Math.min(b.value + 1, A.value.length - 1));
			else if (e.key === "ArrowUp") e.preventDefault(), b.value = Math.max(b.value - 1, 0);
			else if (e.key === "Tab" && j.value) {
				e.preventDefault();
				let t = A.value[b.value] || A.value[0];
				t && (_.value = t);
			}
		}
		function B(e) {
			ie(e), _.value = "", y.value = !1, b.value = -1, x.value = null, ee(g.value)?.focus();
		}
		function ue(e) {
			let t = e?.value ?? x.value;
			t && B(t);
		}
		return W(() => d.modelValue, (e) => {
			M(e);
		}), W(() => d.asset?.tags, (e) => {
			M(e);
		}), (t, n) => {
			let r = le("MButton"), i = le("MInputText"), a = le("MListbox");
			return U(), q("div", {
				class: me(["mjr-tags-editor", { "is-disabled": e.disabled }]),
				"aria-busy": C.value
			}, [I("div", {
				class: "mjr-tags-display",
				role: "list",
				"aria-label": J(p)("tags.label", "Tags")
			}, [h.value.length === 0 ? (U(), q("span", $a, G(J(p)("msg.noTagsYet", "No tags yet...")), 1)) : (U(!0), q(F, { key: 1 }, L(h.value, (t, i) => (U(), q("div", {
				key: t,
				class: "mjr-tag-chip",
				role: "listitem"
			}, [pe(G(t) + " ", 1), R(r, {
				type: "button",
				class: "mjr-tag-chip-remove",
				severity: "secondary",
				text: "",
				rounded: "",
				"aria-label": J(p)("tags.remove", "Remove tag"),
				disabled: e.disabled,
				onClick: (e) => se(i)
			}, {
				default: V(() => [...n[4] ||= [pe(" x ", -1)]]),
				_: 1
			}, 8, [
				"aria-label",
				"disabled",
				"onClick"
			])]))), 128))], 8, Qa), I("div", eo, [R(i, {
				ref_key: "inputRef",
				ref: g,
				modelValue: _.value,
				"onUpdate:modelValue": n[0] ||= (e) => _.value = e,
				type: "text",
				class: "mjr-tag-input",
				placeholder: J(p)("sidebar.addTag", "Add tag..."),
				disabled: e.disabled,
				"aria-label": J(p)("tags.addLabel", "Add tag"),
				"aria-autocomplete": j.value ? "list" : "none",
				"aria-expanded": y.value,
				"aria-haspopup": j.value ? "listbox" : void 0,
				onFocus: n[1] ||= (e) => y.value = _.value.length > 0,
				onInput: n[2] ||= (e) => y.value = _.value.length > 0,
				onKeydown: z,
				onBlur: ne
			}, null, 8, [
				"modelValue",
				"placeholder",
				"disabled",
				"aria-label",
				"aria-autocomplete",
				"aria-expanded",
				"aria-haspopup"
			]), ae(R(a, {
				modelValue: x.value,
				"onUpdate:modelValue": n[3] ||= (e) => x.value = e,
				options: A.value,
				class: "mjr-tags-dropdown",
				"scroll-height": "150px",
				"aria-label": J(p)("tags.suggestions", "Tag suggestions"),
				onChange: ue
			}, {
				option: V(({ option: e, index: t }) => [I("div", {
					class: me(["mjr-tag-suggestion", { "is-active": t === b.value }]),
					"aria-selected": t === b.value,
					onMouseenter: (e) => b.value = t
				}, G(e), 43, to)]),
				_: 1
			}, 8, [
				"modelValue",
				"options",
				"aria-label"
			]), [[fe, y.value && j.value]])])], 10, Za);
		};
	}
});
export { it as A, Ye as B, Pt as C, bt as D, Gt as E, Z as F, Ve as G, Re as H, Xe as I, Ae as J, Be as K, Ze as L, Je as M, rt as N, vt as O, et as P, $e as R, Nt as S, Mt as T, Ue as U, Le as V, Ie as W, De as X, Oe as Y, rn as _, Tn as a, Jt as b, mn as c, fn as d, dn as f, cn as g, ln as h, Ni as i, at as j, ot as k, gn as l, $ as m, Xa as n, vn as o, un as p, He as q, Ja as r, yn as s, io as t, hn as u, on as v, Kt as w, Yt as x, an as y, tt as z };
