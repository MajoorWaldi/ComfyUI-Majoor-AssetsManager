import { t as e } from "./rolldown-runtime-CGnMp29N.js";
import { An as t, Wt as n, c as r, t as i } from "./config-DuYSTOIQ.js";
import { r as a } from "./events-1iwo5blr.js";
// ui/utils/logging.ts
function o(e, ...t) {
	try {
		i.DEBUG_VERBOSE_ERRORS && console.debug(e, ...t);
	} catch {}
}
function s(e, t = "Majoor", { showToast: r = !1, toastType: a = "error" } = {}) {
	let o = e?.message || String(e || "Unknown error");
	try {
		i.DEBUG_VERBOSE_ERRORS ? console.error(`[Majoor][${t}]`, o, e) : console.debug(`[Majoor][${t}]`, o);
	} catch (e) {
		console.debug?.(e);
	}
	if (r && i.DEBUG_VERBOSE_ERRORS) try {
		n(`${t}: ${o}`, a, 4e3);
	} catch (e) {
		console.debug?.(e);
	}
}
// ui/features/panel/panelRuntimeRefs.ts
var c = null;
function l(e) {
	return e ? typeof e?.isConnected != "boolean" || e.isConnected : !1;
}
function u() {
	try {
		let e = document.getElementById("mjr-assets-grid") || document.querySelector(".mjr-grid");
		if (l(e)) return e;
	} catch (e) {
		console.debug?.(e);
	}
	return null;
}
function d(e) {
	return c = e || null, c;
}
function f(e = null) {
	e && c !== e || (c = null);
}
function p() {
	return l(c) ? c : (c = null, u());
}
// ui/features/grid/GridSelectionManager.ts
function m(e) {
	let t = /* @__PURE__ */ new Set();
	if (!e) return t;
	try {
		let n = e.dataset?.mjrSelectedAssetIds;
		if (n) {
			let e = JSON.parse(n);
			if (Array.isArray(e)) for (let n of e) n != null && t.add(String(n));
			return t;
		}
	} catch (e) {
		console.warn("[MJR] selection state parse error:", e);
	}
	try {
		let n = e.dataset?.mjrSelectedAssetId;
		n && t.add(String(n));
	} catch (e) {
		console.debug?.(e);
	}
	return t;
}
function h(e, t, n = "") {
	let r = Array.from(t || []), i = n ? String(n) : r[0] ? String(r[0]) : "";
	try {
		r.length ? (e.dataset.mjrSelectedAssetIds = JSON.stringify(r), i ? e.dataset.mjrSelectedAssetId = String(i) : delete e.dataset.mjrSelectedAssetId) : (delete e.dataset.mjrSelectedAssetIds, delete e.dataset.mjrSelectedAssetId);
	} catch (e) {
		console.debug?.(e);
	}
	return r;
}
function g(e, t, n) {
	if (!e) return;
	let r = t instanceof Set ? t : new Set(Array.from(t || []).map(String));
	try {
		let t = typeof n == "function" ? n(e) : [];
		for (let e of t) {
			let t = e?.dataset?.mjrAssetId;
			t && r.has(String(t)) ? (e.classList.add("is-selected"), e.setAttribute("aria-selected", "true")) : (e.classList.remove("is-selected"), e.setAttribute("aria-selected", "false"));
		}
	} catch (e) {
		console.debug?.(e);
	}
}
function _(e, t, { activeId: n = "" } = {}, r) {
	if (!e) return [];
	let i = new Set(Array.from(t || []).map(String).filter(Boolean)), a = h(e, i, n);
	g(e, i, r);
	let o = {
		selectedIds: a,
		activeId: n || a[0] || ""
	};
	try {
		e.dispatchEvent?.(new CustomEvent("mjr:selection-changed", { detail: o }));
	} catch (e) {
		console.debug?.(e);
	}
	try {
		window.dispatchEvent(new CustomEvent("mjr:selection-changed", { detail: o }));
	} catch (e) {
		console.debug?.(e);
	}
	return a;
}
// ui/features/panel/controllers/hotkeysState.ts
var v = {
	suspended: !1,
	scope: null,
	ratingHotkeysActive: !1
};
function ee() {
	return v;
}
function te(e) {
	v.scope = e == null ? null : String(e);
}
function ne() {
	return !!v.suspended;
}
function re(e) {
	v.ratingHotkeysActive = !!e;
}
// ui/features/viewer/viewerRuntimeHosts.ts
var y = null, ie = ".mjr-mfv";
function ae(e) {
	return !!e && typeof e.appendChild == "function";
}
function b() {
	return typeof document > "u" ? null : document?.body || null;
}
function oe() {
	return typeof document > "u" ? null : document?.body || document?.documentElement || null;
}
function se(e) {
	return ae(e) ? e === b() || typeof e?.isConnected != "boolean" || e.isConnected : !1;
}
function ce(e) {
	return ae(e) ? e : null;
}
function x(e) {
	return se(e) ? e : b();
}
function le(e) {
	let t = oe();
	return se(t) ? t : x(e);
}
function ue(e, t, n = x) {
	let r = [], i = /* @__PURE__ */ new Set();
	for (let a of [
		n(t),
		b(),
		t
	]) {
		if (!a || i.has(a)) continue;
		i.add(a);
		let t = [];
		try {
			t = Array.from(a.querySelectorAll?.(e) || []);
		} catch (e) {
			console.debug?.(e);
		}
		for (let e of t) e && !r.includes(e) && r.push(e);
	}
	return r;
}
function de(e, t, n = x) {
	let r = n(t);
	if (!r) return;
	let i = ue(e, t, n);
	for (let e of i) if (e && e.parentNode !== r) try {
		r.appendChild(e);
	} catch (e) {
		console.debug?.(e);
	}
}
function fe(e) {
	return y = ce(e), de(ie, y, le), () => pe(e);
}
function pe(e) {
	e && y !== e || (y = null);
}
function me(e) {
	let t = le(y);
	try {
		t?.appendChild?.(e);
	} catch (e) {
		console.debug?.(e);
	}
	return t;
}
// ui/features/viewer/floatingViewerManager.ts
var he = /* @__PURE__ */ e({
	floatingViewerManager: () => X,
	installFloatingViewerGlobalHandlers: () => $,
	removeFloatingViewerGlobalHandlers: () => He,
	teardownFloatingViewerManager: () => Ue
}), S = null, ge = null;
async function _e() {
	return S || (ge ||= import("./FloatingViewer-dFzuANLb.js").then((e) => (S = e.FloatingViewer, S)), ge);
}
var C = null, ve = null;
async function ye() {
	if (!C) return ve ||= import("./NodeStreamController-CIKDDXJT.js").then((e) => {
		C = e.setNodeStreamActive;
	}), ve;
}
var w = Object.freeze({
	SIMPLE: "simple",
	AB: "ab",
	SIDE: "side",
	GRID: "grid",
	GRAPH: "graph"
});
function be(e) {
	let t = String(e || "").trim().toLowerCase();
	return t === "sidebyside" ? w.SIDE : Object.values(w).includes(t) ? t : "";
}
var T = null;
function E() {
	return i.MFV_LIVE_DEFAULT !== !1;
}
function D() {
	return i.MFV_PREVIEW_DEFAULT !== !1;
}
var O = E(), k = D(), A = !1, j = null, M = !1, N = null, P = 0;
function xe() {
	O = E(), k = D(), T?.setLiveActive(O), T?.setPreviewActive(k);
}
async function F() {
	if (!T) {
		let e = await _e();
		T || (T = new e({ controller: {
			close: () => X.close(),
			toggle: () => X.toggle(),
			toggleLive: () => X.toggleLive(),
			togglePreview: () => X.togglePreview(),
			toggleNodeStream: () => X.toggleNodeStream(),
			popOut: () => X.popOut(),
			onModeChanged: (e) => {
				T?.isVisible && e !== w.SIMPLE && U();
			},
			handleForwardedKeydown: (e) => Q(e, { forwarded: !0 })
		} }), me(T.render()));
	}
	try {
		let e = T?.element || null;
		e?.isConnected === !1 && me(e);
	} catch (e) {
		console.debug?.(e);
	}
	return T;
}
function I() {
	try {
		N?.abort();
	} catch (e) {
		console.debug?.(e);
	}
	N = null;
}
function L() {
	try {
		let e = window.__MJR_LAST_SELECTION_GRID__;
		if (e?.isConnected) return e;
	} catch (e) {
		console.debug?.(e);
	}
	return p();
}
function Se() {
	if (T) {
		try {
			T.dispose?.();
		} catch (e) {
			console.debug?.(e);
		}
		T = null;
	}
}
function R(e) {
	typeof window < "u" && window.dispatchEvent(new CustomEvent(a.MFV_VISIBILITY_CHANGED, { detail: { visible: !!e } }));
}
function z(e) {
	e && (e.setLiveActive(O), e.setPreviewActive(k), e.setNodeStreamActive?.(A));
}
function B(e) {
	e?.setNodeStreamSelection && e.setNodeStreamSelection(j || null);
}
function V(e, t) {
	if (!e) return;
	let n = e._mode;
	if (n !== w.AB && n !== w.SIDE && n !== w.GRID) {
		e.loadMediaA(t, { autoMode: !0 });
		return;
	}
	let r = e.getPinnedSlots();
	if (n === w.GRID) {
		let n = [
			"A",
			"B",
			"C",
			"D"
		].find((e) => !r.has(e));
		if (!n) return;
		let i = {
			A: e._mediaA,
			B: e._mediaB,
			C: e._mediaC,
			D: e._mediaD
		};
		i[n] = t, e.loadMediaQuad(i.A, i.B, i.C, i.D);
		return;
	}
	let i = r.has("A"), a = r.has("B");
	i && a || (a ? e.loadMediaPair(t, e._mediaB) : e.loadMediaPair(e._mediaA, t));
}
function Ce(e) {
	try {
		let t = L();
		if (!t) return null;
		let n = Array.from(t.querySelectorAll("[data-mjr-asset-id]")), r = n.findIndex((t) => t.dataset.mjrAssetId === String(e));
		if (r < 0) return null;
		let i = (n[r + 1] ?? n[r - 1] ?? null)?.dataset?.mjrAssetId ?? null;
		return i && i !== String(e) ? i : null;
	} catch (e) {
		return console.debug?.("[MFV] _findAdjacentGridId error", e), null;
	}
}
async function H(e, t = []) {
	if (!e.length || !T) return;
	I();
	let n = ++P, i = typeof AbortController < "u" ? new AbortController() : null;
	N = i;
	try {
		let a = T.getPinnedSlots(), o = a.size > 0, s = T._mode, c = s === w.GRID, l = s === w.AB || s === w.SIDE, u = c ? 4 : 2, d = e.slice(0, u);
		if (o && (l || c)) {
			let e = u - a.size;
			d = d.slice(0, Math.max(1, e));
		} else if (d.length === 1 && l) {
			let e = Ce(d[0]);
			e && (d = [d[0], e]);
		}
		let f = L(), p = f?._mjrGetAssets?.() || f?._mjrGetSelectedAssets?.() || [], m = new Map([...p, ...t].filter((e) => e && e.kind !== "folder").map((e) => [String(e.id), e])), h = d.filter((e) => Number.isSafeInteger(Number(e)) && Number(e) > 0), g = h.length ? await r(h, i ? { signal: i.signal } : {}) : {
			ok: !0,
			data: []
		};
		if (i?.signal.aborted || P !== n || !T) return;
		let _ = new Map((g?.ok && Array.isArray(g.data) ? g.data : []).map((e) => [String(e.id), e])), v = d.map((e) => _.get(String(e)) || m.get(String(e))).filter(Boolean);
		if (!v.length) return;
		if (c) {
			if (o) {
				let e = {
					A: T._mediaA,
					B: T._mediaB,
					C: T._mediaC,
					D: T._mediaD
				}, t = [
					"A",
					"B",
					"C",
					"D"
				].filter((e) => !a.has(e)), n = 0;
				for (let r of t) n < v.length && (e[r] = v[n++]);
				T.loadMediaQuad(e.A, e.B, e.C, e.D);
			} else v.length >= 3 ? T.loadMediaQuad(v[0], v[1], v[2], v[3] || null) : v.length >= 2 ? T.loadMediaPair(v[0], v[1]) : T.loadMediaA(v[0], { autoMode: !0 });
			return;
		}
		if (a.has("A") && a.has("B") && T._mediaA && T._mediaB) return;
		a.has("A") && T._mediaA ? T.loadMediaPair(T._mediaA, v[0]) : a.has("B") && T._mediaB ? T.loadMediaPair(v[0], T._mediaB) : d.length >= 2 && v.length >= 2 ? T.loadMediaPair(v[0], v[1]) : T.loadMediaA(v[0], { autoMode: !0 });
	} catch (e) {
		e?.name !== "AbortError" && s(e, "floatingViewerManager._loadFromIds");
	} finally {
		N === i && (N = null);
	}
}
function U() {
	try {
		let e = L();
		if (!e) return;
		let t = m(e);
		if (!t.size) return;
		H(Array.from(t));
	} catch (e) {
		console.debug?.("[MFV] Error reading current grid selection", e);
	}
}
function we(e) {
	if (!T?.isVisible || T._mode === w.GRAPH) return;
	let t = Array.isArray(e?.detail?.selectedAssets) ? e.detail.selectedAssets : [], n = new Set(t.filter((e) => String(e?.kind || "").toLowerCase() === "folder").map((e) => String(e?.id || "")).filter(Boolean)), r = Array.isArray(e?.detail?.selectedIds) ? e.detail.selectedIds.map(String).filter((e) => !!e && !n.has(e)) : [];
	if (r.length) H(r, t);
	else try {
		let e = L();
		if (!e) return;
		let t = Array.from(m(e)).map(String).filter(Boolean);
		if (!t.length) return;
		H(t);
	} catch (e) {
		console.debug?.("[MFV] selection fallback failed", e);
	}
}
function W() {
	M || typeof window < "u" && (window.addEventListener(a.SELECTION_CHANGED, we), M = !0);
}
function Te() {
	typeof window < "u" && window.removeEventListener(a.SELECTION_CHANGED, we), M = !1, I();
}
var G = !1, K = null, q = null, J = "";
function Ee() {
	T?.isVisible && T.refreshSidebar?.();
}
function De() {
	Oe();
	let e = typeof window < "u" ? window : globalThis;
	typeof e.requestAnimationFrame == "function" ? (J = "raf", q = e.requestAnimationFrame(() => {
		q = null, J = "", Ee();
	})) : (J = "timeout", q = e.setTimeout(() => {
		q = null, J = "", Ee();
	}, 16));
}
function Oe() {
	if (q == null) return;
	let e = typeof window < "u" ? window : globalThis;
	try {
		J === "raf" && typeof e.cancelAnimationFrame == "function" ? e.cancelAnimationFrame(q) : typeof e.clearTimeout == "function" && e.clearTimeout(q);
	} catch (e) {
		console.debug?.(e);
	}
	q = null, J = "";
}
function Y() {
	if (!G) try {
		K = t(De, { includePointerFallback: !0 }), G = typeof K == "function";
	} catch (e) {
		console.debug?.("[MFV] _bindNodeSelectionListener error", e);
	}
}
function ke() {
	if (G) {
		Oe();
		try {
			K?.();
		} catch (e) {
			console.debug?.("[MFV] _unbindNodeSelectionListener error", e);
		}
		K = null, G = !1;
	}
}
var X = {
	isGraphModeVisible() {
		return !!(T?.isVisible && T?._mode === w.GRAPH);
	},
	async openAssets({ assets: e = [], asset: t = null, index: n = 0, mode: r = "" } = {}) {
		let i = Array.isArray(e) ? e.filter(Boolean) : t ? [t] : [];
		if (!i.length) return !1;
		let a = await F(), o = !!a.isVisible, s = Math.max(0, Math.min(Number(n) || 0, i.length - 1)), c = be(r);
		c && a.setMode(c), a.show(), z(a), W(), Y();
		let l = a._mode;
		return l === w.GRID && i.length >= 3 ? a.loadMediaQuad(i[0], i[1], i[2], i[3] || null) : (l === w.AB || l === w.SIDE) && i.length >= 2 ? a.loadMediaPair(i[0], i[1]) : a.loadMediaA(i[s], { autoMode: !1 }), o || R(!0), !0;
	},
	async open() {
		let e = await F();
		e.show(), z(e), W(), Y(), G || requestAnimationFrame(() => Y()), U(), A && B(e), R(!0);
	},
	close() {
		if (T) try {
			T.isPopped && T.popIn(), T.hide();
		} catch (e) {
			console.debug?.(e);
		}
		Te(), T?.setNodeStreamSelection?.(null), ke(), R(!1);
	},
	async toggle() {
		T?.isVisible ? X.close() : await X.open();
	},
	toggleLive() {
		X.setLiveActive(!O);
	},
	togglePreview() {
		X.setPreviewActive(!k);
	},
	async toggleCompareAB() {
		let e = await F();
		if (!e.isVisible) {
			e.setMode(w.AB), e.show(), z(e), W(), U(), R(!0);
			return;
		}
		let t = {
			[w.AB]: w.SIDE,
			[w.SIDE]: w.SIMPLE,
			[w.GRID]: w.SIMPLE,
			[w.SIMPLE]: w.AB
		}[e._mode] || w.AB;
		e.setMode(t), t !== w.SIMPLE && U();
	},
	async upsertWithContent(e) {
		let t = await F(), n = !!t.isVisible;
		(n || i.MFV_LIVE_AUTO_OPEN !== !1) && (t.show(), z(t), W(), V(t, e), n || R(!0));
	},
	setLiveActive(e) {
		O = !!e, T?.setLiveActive(O);
	},
	getLiveActive() {
		return O;
	},
	async popOut() {
		let e = await F();
		e.isPopped ? e.popIn() : (e.isVisible || await X.open(), e.popOut());
	},
	setPreviewActive(e) {
		k = !!e, T?.setPreviewActive(k);
	},
	getPreviewActive() {
		return k;
	},
	canAcceptPreviewBlob() {
		return k ? T?.isVisible ? !0 : i.MFV_PREVIEW_AUTO_OPEN !== !1 : !1;
	},
	async feedPreviewBlob(e, t = {}) {
		if (!X.canAcceptPreviewBlob()) return;
		let n = await F(), r = !!n.isVisible;
		(r || i.MFV_PREVIEW_AUTO_OPEN !== !1) && (n.isVisible || n.show(), z(n), n.loadPreviewBlob(e, ...Object.keys(t).length ? [t] : []), r || R(!0));
	},
	toggleNodeStream() {
		X.setNodeStreamActive(!A);
	},
	setNodeStreamActive(e) {
		A = !!e, A || (j = null), ye().then(() => {
			C && C(A);
		}), T?.setNodeStreamActive?.(A), A ? T && B(T) : T?.setNodeStreamSelection?.(null);
	},
	getNodeStreamActive() {
		return A;
	},
	setNodeStreamSelection(e, t, n) {
		j = e == null || e === "" ? null : {
			nodeId: e,
			classType: t,
			title: n
		};
		let r = T;
		r && B(r);
	},
	async feedNodeStream(e) {
		if (!A) return;
		let t = await F(), n = !!t.isVisible;
		(n || i.MFV_NODE_STREAM_AUTO_OPEN !== !1) && (t.isVisible || (t.show(), W()), z(t), B(t), V(t, e), n || R(!0));
	}
}, Z = !1, Ae = () => X.open(), je = () => X.close(), Me = () => X.toggle(), Ne = () => X.toggleLive(), Pe = () => X.togglePreview(), Fe = () => X.toggleNodeStream(), Ie = () => X.popOut(), Le = () => {
	try {
		T?.isPopped && T.popIn();
	} catch {}
}, Re = (e) => {
	let t = String(e?.detail?.key || "");
	t && t !== "viewer" && t !== "viewer.mfvLiveDefault" && t !== "viewer.mfvPreviewDefault" || xe();
};
function ze(e) {
	let t = String(e?.key || "");
	return t === " " || t === "Spacebar" || t === "ArrowLeft" || t === "ArrowRight";
}
function Be(e) {
	if (!T?.isVisible || !ze(e)) return !1;
	try {
		let t = e?.target, n = T?.element || null, r = !!n?.contains?.(t), i = (t?.closest?.(".mjr-mfv-simple-player") || (r || t == null ? n?.querySelector?.(".mjr-mfv-simple-player") : null))?._mjrSimplePlayerHandleKeydown;
		if (typeof i == "function") return i(e), !!e?.defaultPrevented;
		let a = (t?.closest?.(".mjr-mfv-player-host") || (r || t == null ? n?.querySelector?.(".mjr-mfv-player-host") : null))?._mjrMediaControlsHandle;
		if (a && typeof a == "object") {
			let t = String(e?.key || ""), n = () => {
				e.preventDefault?.(), e.stopPropagation?.(), e.stopImmediatePropagation?.();
			};
			if ((t === " " || t === "Spacebar") && typeof a.togglePlay == "function") return a.togglePlay(), n(), !0;
			if (t === "ArrowLeft" && typeof a.stepFrames == "function") return a.stepFrames(-1), n(), !0;
			if (t === "ArrowRight" && typeof a.stepFrames == "function") return a.stepFrames(1), n(), !0;
		}
		return !1;
	} catch (e) {
		return console.debug?.(e), !1;
	}
}
function Ve(e, t) {
	if (t) return !0;
	let n = T?.element;
	if (!n) return !1;
	try {
		if (e?.target && n.contains?.(e.target)) return !0;
		let t = typeof document < "u" ? document.activeElement : null;
		return t && t !== document.body && n.contains?.(t) ? !0 : !!n.matches?.(":hover");
	} catch {
		return !1;
	}
}
var Q = (e, { forwarded: t = !1 } = {}) => {
	if (!T?.isVisible || ne() || ee().scope === "viewer") return;
	let n = e?.key?.toLowerCase?.() || "", r = e?.target?.isContentEditable || e?.target?.closest?.("input, textarea, select, [contenteditable='true']");
	if (r && Be(e) || r || Be(e)) return;
	let i = () => {
		e.preventDefault?.(), e.stopPropagation?.(), e.stopImmediatePropagation?.();
	};
	if (!e?.ctrlKey && !e?.metaKey && !e?.altKey && !e?.shiftKey) {
		if (!Ve(e, t)) return;
		if (n === "v") {
			i(), X.toggle();
			return;
		}
		if (n === "k") {
			i(), X.togglePreview();
			return;
		}
		if (n === "l") {
			i(), X.toggleLive();
			return;
		}
		if (n === "n") {
			i(), X.toggleNodeStream();
			return;
		}
		n === "c" && (i(), X.toggleCompareAB());
	}
};
function $() {
	Z || typeof window < "u" && window?.addEventListener && (window.addEventListener(a.MFV_OPEN, Ae), window.addEventListener(a.MFV_CLOSE, je), window.addEventListener(a.MFV_TOGGLE, Me), window.addEventListener(a.MFV_LIVE_TOGGLE, Ne), window.addEventListener(a.MFV_PREVIEW_TOGGLE, Pe), window.addEventListener(a.MFV_NODESTREAM_TOGGLE, Fe), window.addEventListener(a.MFV_POPOUT, Ie), window.addEventListener(a.SETTINGS_CHANGED, Re), window.addEventListener("keydown", Q, !0), window.addEventListener("beforeunload", Le), Z = !0);
}
function He() {
	typeof window > "u" || !window?.removeEventListener || (window.removeEventListener(a.MFV_OPEN, Ae), window.removeEventListener(a.MFV_CLOSE, je), window.removeEventListener(a.MFV_TOGGLE, Me), window.removeEventListener(a.MFV_LIVE_TOGGLE, Ne), window.removeEventListener(a.MFV_PREVIEW_TOGGLE, Pe), window.removeEventListener(a.MFV_NODESTREAM_TOGGLE, Fe), window.removeEventListener(a.MFV_POPOUT, Ie), window.removeEventListener(a.SETTINGS_CHANGED, Re), window.removeEventListener("keydown", Q, !0), window.removeEventListener("beforeunload", Le)), Z = !1;
}
function Ue({ reinstallGlobalHandlers: e = !1 } = {}) {
	let t = !!T?.isVisible;
	try {
		T?.isPopped && T.popIn();
	} catch (e) {
		console.debug?.(e);
	}
	He(), Te(), ke(), I(), P += 1, O = E(), k = D(), A = !1;
	try {
		C && C(!1);
	} catch (e) {
		console.debug?.(e);
	}
	Se(), t && R(!1), e && $();
}
export { s as _, fe as a, te as c, h as d, _ as f, o as g, d as h, Ue as i, re as l, p as m, he as n, ee as o, f as p, $ as r, ne as s, X as t, m as u };
