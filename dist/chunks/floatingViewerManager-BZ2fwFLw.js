import { _t as e, r as t } from "./client-DTWulbWC.js";
import { j as n, t as r } from "./config-eqarUfKd.js";
import { r as i } from "./events-BnkL6-b6.js";
//#region ui/utils/logging.ts
function a(e, ...t) {
	try {
		r.DEBUG_VERBOSE_ERRORS && console.debug(e, ...t);
	} catch {}
}
function o(t, n = "Majoor", { showToast: i = !1, toastType: a = "error" } = {}) {
	let o = t?.message || String(t || "Unknown error");
	try {
		r.DEBUG_VERBOSE_ERRORS ? console.error(`[Majoor][${n}]`, o, t) : console.debug(`[Majoor][${n}]`, o);
	} catch (e) {
		console.debug?.(e);
	}
	if (i && r.DEBUG_VERBOSE_ERRORS) try {
		e(`${n}: ${o}`, a, 4e3);
	} catch (e) {
		console.debug?.(e);
	}
}
//#endregion
//#region ui/features/panel/panelRuntimeRefs.ts
var s = null;
function c(e) {
	return e ? typeof e?.isConnected == "boolean" ? e.isConnected : !0 : !1;
}
function l() {
	try {
		let e = document.getElementById("mjr-assets-grid") || document.querySelector(".mjr-grid");
		if (c(e)) return e;
	} catch (e) {
		console.debug?.(e);
	}
	return null;
}
function u(e) {
	return s = e || null, s;
}
function d(e = null) {
	(!e || s === e) && (s = null);
}
function f() {
	return c(s) ? s : (s = null, l());
}
//#endregion
//#region ui/features/grid/GridSelectionManager.ts
function p(e) {
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
function m(e, t, n = "") {
	let r = Array.from(t || []), i = n ? String(n) : r[0] ? String(r[0]) : "";
	try {
		r.length ? (e.dataset.mjrSelectedAssetIds = JSON.stringify(r), i ? e.dataset.mjrSelectedAssetId = String(i) : delete e.dataset.mjrSelectedAssetId) : (delete e.dataset.mjrSelectedAssetIds, delete e.dataset.mjrSelectedAssetId);
	} catch (e) {
		console.debug?.(e);
	}
	return r;
}
function ee(e, t, n) {
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
function te(e, t, { activeId: n = "" } = {}, r) {
	if (!e) return [];
	let i = new Set(Array.from(t || []).map(String).filter(Boolean)), a = m(e, i, n);
	ee(e, i, r);
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
//#endregion
//#region ui/features/panel/controllers/hotkeysState.ts
var h = {
	suspended: !1,
	scope: null,
	ratingHotkeysActive: !1
};
function ne() {
	return h;
}
function re(e) {
	h.scope = e == null ? null : String(e);
}
function ie() {
	return !!h.suspended;
}
function ae(e) {
	h.ratingHotkeysActive = !!e;
}
//#endregion
//#region ui/features/viewer/viewerRuntimeHosts.ts
var g = null, _ = null, v = ".mjr-viewer-overlay", oe = ".mjr-mfv";
function y(e) {
	return !!e && typeof e.appendChild == "function";
}
function b() {
	return typeof document > "u" ? null : document?.body || null;
}
function se() {
	return typeof document > "u" ? null : document?.body || document?.documentElement || null;
}
function ce(e) {
	return y(e) ? e === b() ? !0 : typeof e?.isConnected == "boolean" ? e.isConnected : !0 : !1;
}
function le(e) {
	return y(e) ? e : null;
}
function x(e) {
	return ce(e) ? e : b();
}
function ue(e) {
	let t = se();
	return ce(t) ? t : x(e);
}
function de(e, t, n = x) {
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
		for (let e of t) !e || r.includes(e) || r.push(e);
	}
	return r;
}
function fe(e, t, n = x) {
	let r = n(t);
	if (!r) return;
	let i = de(e, t, n);
	for (let e of i) if (e && e.parentNode !== r) try {
		r.appendChild(e);
	} catch (e) {
		console.debug?.(e);
	}
}
function pe(e) {
	return g = le(e), fe(v, g), () => me(e);
}
function me(e) {
	(!e || g === e) && (g = null);
}
function he(e) {
	return _ = le(e), fe(oe, _, ue), () => ge(e);
}
function ge(e) {
	(!e || _ === e) && (_ = null);
}
function _e(e) {
	let t = x(g);
	try {
		t?.appendChild?.(e);
	} catch (e) {
		console.debug?.(e);
	}
	return t;
}
function ve(e) {
	let t = ue(_);
	try {
		t?.appendChild?.(e);
	} catch (e) {
		console.debug?.(e);
	}
	return t;
}
function ye() {
	return de(v, g);
}
//#endregion
//#region ui/features/viewer/floatingViewerManager.ts
var S = null, be = null;
async function xe() {
	return S || (be ||= import("./FloatingViewer-DADBol7-.js").then((e) => (S = e.FloatingViewer, S)), be);
}
var C = null, Se = null;
async function Ce() {
	if (!C) return Se ||= import("./NodeStreamController-EQygLyLg.js").then((e) => {
		C = e.setNodeStreamActive;
	}), Se;
}
var w = Object.freeze({
	SIMPLE: "simple",
	AB: "ab",
	SIDE: "side",
	GRID: "grid",
	GRAPH: "graph"
});
function we(e) {
	let t = String(e || "").trim().toLowerCase();
	return t === "sidebyside" ? w.SIDE : Object.values(w).includes(t) ? t : "";
}
var T = null;
function E() {
	return r.MFV_LIVE_DEFAULT !== !1;
}
function D() {
	return r.MFV_PREVIEW_DEFAULT !== !1;
}
var O = E(), k = D(), A = !1, j = null, M = !1, N = null, P = 0;
function Te() {
	O = E(), k = D(), T?.setLiveActive(O), T?.setPreviewActive(k);
}
async function F() {
	if (!T) {
		let e = await xe();
		T || (T = new e({ controller: {
			close: () => Y.close(),
			toggle: () => Y.toggle(),
			toggleLive: () => Y.toggleLive(),
			togglePreview: () => Y.togglePreview(),
			toggleNodeStream: () => Y.toggleNodeStream(),
			popOut: () => Y.popOut(),
			onModeChanged: (e) => {
				T?.isVisible && e !== w.SIMPLE && H();
			},
			handleForwardedKeydown: (e) => Q(e)
		} }), ve(T.render()));
	}
	try {
		let e = T?.element || null;
		e?.isConnected === !1 && ve(e);
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
	return f();
}
function Ee() {
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
	typeof window > "u" || window.dispatchEvent(new CustomEvent(i.MFV_VISIBILITY_CHANGED, { detail: { visible: !!e } }));
}
function z(e) {
	e && (e.setLiveActive(O), e.setPreviewActive(k), e.setNodeStreamActive?.(A));
}
function B(e) {
	e?.setNodeStreamSelection && e.setNodeStreamSelection(j || null);
}
function De(e, t) {
	if (!e) return;
	let n = e._mode;
	if (!(n === w.AB || n === w.SIDE || n === w.GRID)) {
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
	if (!(i && a)) {
		if (a) {
			e.loadMediaPair(t, e._mediaB);
			return;
		}
		e.loadMediaPair(e._mediaA, t);
	}
}
function Oe(e) {
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
async function V(e) {
	if (!e.length || !T) return;
	I();
	let n = ++P, r = typeof AbortController < "u" ? new AbortController() : null;
	N = r;
	try {
		let i = T.getPinnedSlots(), a = i.size > 0, o = T._mode, s = o === w.GRID, c = o === w.AB || o === w.SIDE, l = s ? 4 : 2, u = e.slice(0, l);
		if (a && (c || s)) {
			let e = l - i.size;
			u = u.slice(0, Math.max(1, e));
		} else if (u.length === 1 && c) {
			let e = Oe(u[0]);
			e && (u = [u[0], e]);
		}
		let d = await t(u, r ? { signal: r.signal } : {});
		if (r?.signal.aborted || P !== n || !d?.ok || !Array.isArray(d.data) || !d.data.length || !T) return;
		let f = d.data;
		if (s) {
			if (a) {
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
				].filter((e) => !i.has(e)), n = 0;
				for (let r of t) n < f.length && (e[r] = f[n++]);
				T.loadMediaQuad(e.A, e.B, e.C, e.D);
			} else f.length >= 3 ? T.loadMediaQuad(f[0], f[1], f[2], f[3] || null) : f.length >= 2 ? T.loadMediaPair(f[0], f[1]) : T.loadMediaA(f[0], { autoMode: !0 });
			return;
		}
		if (i.has("A") && i.has("B") && T._mediaA && T._mediaB) return;
		i.has("A") && T._mediaA ? T.loadMediaPair(T._mediaA, f[0]) : i.has("B") && T._mediaB ? T.loadMediaPair(f[0], T._mediaB) : u.length >= 2 && f.length >= 2 ? T.loadMediaPair(f[0], f[1]) : T.loadMediaA(f[0], { autoMode: !0 });
	} catch (e) {
		e?.name !== "AbortError" && o(e, "floatingViewerManager._loadFromIds");
	} finally {
		N === r && (N = null);
	}
}
function H() {
	try {
		let e = L();
		if (!e) return;
		let t = p(e);
		if (!t.size) return;
		V(Array.from(t));
	} catch (e) {
		console.debug?.("[MFV] Error reading current grid selection", e);
	}
}
function ke(e) {
	if (!T?.isVisible) return;
	let t = Array.isArray(e?.detail?.selectedAssets) ? e.detail.selectedAssets : [], n = new Set(t.filter((e) => String(e?.kind || "").toLowerCase() === "folder").map((e) => String(e?.id || "")).filter(Boolean)), r = Array.isArray(e?.detail?.selectedIds) ? e.detail.selectedIds.map(String).filter((e) => !!e && !n.has(e)) : [];
	if (r.length) {
		V(r);
		return;
	}
	try {
		let e = L();
		if (!e) return;
		let t = Array.from(p(e)).map(String).filter(Boolean);
		if (!t.length) return;
		V(t);
	} catch (e) {
		console.debug?.("[MFV] selection fallback failed", e);
	}
}
function U() {
	M || typeof window > "u" || (window.addEventListener(i.SELECTION_CHANGED, ke), M = !0);
}
function Ae() {
	typeof window < "u" && window.removeEventListener(i.SELECTION_CHANGED, ke), M = !1, I();
}
var W = !1, G = null, K = null, q = "";
function je() {
	T?.isVisible && T.refreshSidebar?.();
}
function Me() {
	Ne();
	let e = typeof window < "u" ? window : globalThis;
	if (typeof e.requestAnimationFrame == "function") {
		q = "raf", K = e.requestAnimationFrame(() => {
			K = null, q = "", je();
		});
		return;
	}
	q = "timeout", K = e.setTimeout(() => {
		K = null, q = "", je();
	}, 16);
}
function Ne() {
	if (K == null) return;
	let e = typeof window < "u" ? window : globalThis;
	try {
		q === "raf" && typeof e.cancelAnimationFrame == "function" ? e.cancelAnimationFrame(K) : typeof e.clearTimeout == "function" && e.clearTimeout(K);
	} catch (e) {
		console.debug?.(e);
	}
	K = null, q = "";
}
function J() {
	if (!W) try {
		G = n(Me, { includePointerFallback: !0 }), W = typeof G == "function";
	} catch (e) {
		console.debug?.("[MFV] _bindNodeSelectionListener error", e);
	}
}
function Pe() {
	if (W) {
		Ne();
		try {
			G?.();
		} catch (e) {
			console.debug?.("[MFV] _unbindNodeSelectionListener error", e);
		}
		G = null, W = !1;
	}
}
var Y = {
	async openAssets({ assets: e = [], asset: t = null, index: n = 0, mode: r = "" } = {}) {
		let i = Array.isArray(e) ? e.filter(Boolean) : t ? [t] : [];
		if (!i.length) return !1;
		let a = await F(), o = !!a.isVisible, s = Math.max(0, Math.min(Number(n) || 0, i.length - 1)), c = we(r);
		c && a.setMode(c), a.show(), z(a), U(), J();
		let l = a._mode;
		return l === w.GRID && i.length >= 3 ? a.loadMediaQuad(i[0], i[1], i[2], i[3] || null) : (l === w.AB || l === w.SIDE) && i.length >= 2 ? a.loadMediaPair(i[0], i[1]) : a.loadMediaA(i[s], { autoMode: !1 }), o || R(!0), !0;
	},
	async open() {
		let e = await F();
		e.show(), z(e), U(), J(), W || requestAnimationFrame(() => J()), H(), A && B(e), R(!0);
	},
	close() {
		if (T) try {
			T.isPopped && T.popIn(), T.hide();
		} catch (e) {
			console.debug?.(e);
		}
		Ae(), T?.setNodeStreamSelection?.(null), Pe(), R(!1);
	},
	async toggle() {
		T?.isVisible ? Y.close() : await Y.open();
	},
	toggleLive() {
		Y.setLiveActive(!O);
	},
	togglePreview() {
		Y.setPreviewActive(!k);
	},
	async toggleCompareAB() {
		let e = await F();
		if (!e.isVisible) {
			e.setMode(w.AB), e.show(), z(e), U(), H(), R(!0);
			return;
		}
		let t = {
			[w.AB]: w.SIDE,
			[w.SIDE]: w.SIMPLE,
			[w.GRID]: w.SIMPLE,
			[w.SIMPLE]: w.AB
		}[e._mode] || w.AB;
		e.setMode(t), t !== w.SIMPLE && H();
	},
	async upsertWithContent(e) {
		let t = await F(), n = !!t.isVisible;
		!n && r.MFV_LIVE_AUTO_OPEN === !1 || (t.show(), z(t), U(), De(t, e), n || R(!0));
	},
	setLiveActive(e) {
		O = !!e, T?.setLiveActive(O);
	},
	getLiveActive() {
		return O;
	},
	async popOut() {
		let e = await F();
		e.isPopped ? e.popIn() : (e.isVisible || await Y.open(), e.popOut());
	},
	setPreviewActive(e) {
		k = !!e, T?.setPreviewActive(k);
	},
	getPreviewActive() {
		return k;
	},
	async feedPreviewBlob(e, t = {}) {
		if (!k) return;
		let n = await F(), i = !!n.isVisible;
		!i && r.MFV_PREVIEW_AUTO_OPEN === !1 || (n.isVisible || n.show(), z(n), n.loadPreviewBlob(e, ...Object.keys(t).length ? [t] : []), i || R(!0));
	},
	toggleNodeStream() {
		Y.setNodeStreamActive(!A);
	},
	setNodeStreamActive(e) {
		A = !!e, A || (j = null), Ce().then(() => {
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
		!n && r.MFV_NODE_STREAM_AUTO_OPEN === !1 || (t.isVisible || (t.show(), U()), z(t), B(t), De(t, e), n || R(!0));
	}
}, X = !1, Fe = () => Y.open(), Ie = () => Y.close(), Le = () => Y.toggle(), Re = () => Y.toggleLive(), ze = () => Y.togglePreview(), Be = () => Y.toggleNodeStream(), Z = () => Y.popOut(), Ve = () => {
	try {
		T?.isPopped && T.popIn();
	} catch {}
}, He = (e) => {
	let t = String(e?.detail?.key || "");
	(!t || t === "viewer" || t === "viewer.mfvLiveDefault" || t === "viewer.mfvPreviewDefault") && Te();
}, Q = (e) => {
	if (!T?.isVisible || ie() || ne().scope === "viewer") return;
	let t = e?.key?.toLowerCase?.() || "";
	if (e?.target?.isContentEditable || e?.target?.closest?.("input, textarea, select, [contenteditable='true']")) return;
	let n = () => {
		e.preventDefault?.(), e.stopPropagation?.(), e.stopImmediatePropagation?.();
	};
	if (!e?.ctrlKey && !e?.metaKey && !e?.altKey && !e?.shiftKey) {
		if (t === "v") {
			n(), Y.toggle();
			return;
		}
		if (t === "k") {
			n(), Y.togglePreview();
			return;
		}
		if (t === "l") {
			n(), Y.toggleLive();
			return;
		}
		if (t === "n") {
			n(), Y.toggleNodeStream();
			return;
		}
		t === "c" && (n(), Y.toggleCompareAB());
		return;
	}
};
function $() {
	X || typeof window > "u" || !window?.addEventListener || (window.addEventListener(i.MFV_OPEN, Fe), window.addEventListener(i.MFV_CLOSE, Ie), window.addEventListener(i.MFV_TOGGLE, Le), window.addEventListener(i.MFV_LIVE_TOGGLE, Re), window.addEventListener(i.MFV_PREVIEW_TOGGLE, ze), window.addEventListener(i.MFV_NODESTREAM_TOGGLE, Be), window.addEventListener(i.MFV_POPOUT, Z), window.addEventListener(i.SETTINGS_CHANGED, He), window.addEventListener("keydown", Q, !0), window.addEventListener("beforeunload", Ve), X = !0);
}
function Ue() {
	if (typeof window > "u" || !window?.removeEventListener) {
		X = !1;
		return;
	}
	window.removeEventListener(i.MFV_OPEN, Fe), window.removeEventListener(i.MFV_CLOSE, Ie), window.removeEventListener(i.MFV_TOGGLE, Le), window.removeEventListener(i.MFV_LIVE_TOGGLE, Re), window.removeEventListener(i.MFV_PREVIEW_TOGGLE, ze), window.removeEventListener(i.MFV_NODESTREAM_TOGGLE, Be), window.removeEventListener(i.MFV_POPOUT, Z), window.removeEventListener(i.SETTINGS_CHANGED, He), window.removeEventListener("keydown", Q, !0), window.removeEventListener("beforeunload", Ve), X = !1;
}
function We({ reinstallGlobalHandlers: e = !1 } = {}) {
	let t = !!T?.isVisible;
	try {
		T?.isPopped && T.popIn();
	} catch (e) {
		console.debug?.(e);
	}
	Ue(), Ae(), Pe(), I(), P += 1, O = E(), k = D(), A = !1;
	try {
		C && C(!1);
	} catch (e) {
		console.debug?.(e);
	}
	Ee(), t && R(!1), e && $();
}
//#endregion
export { u as _, ye as a, ne as c, ae as d, p as f, f as g, d as h, _e as i, ie as l, te as m, $ as n, he as o, m as p, We as r, pe as s, Y as t, re as u, a as v, o as y };
