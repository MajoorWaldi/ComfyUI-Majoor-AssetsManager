import { t as e } from "./rolldown-runtime-Dy4uBu1J.js";
import { An as t, Wt as n, c as r, t as i } from "./config-_5PaNI90.js";
import { r as a } from "./events-CKNQKBLk.js";
//#region ui/utils/logging.ts
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
//#endregion
//#region ui/features/panel/panelRuntimeRefs.ts
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
	(!e || c === e) && (c = null);
}
function p() {
	return l(c) ? c : (c = null, u());
}
//#endregion
//#region ui/features/grid/GridSelectionManager.ts
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
function ee(e, t, { activeId: n = "" } = {}, r) {
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
//#endregion
//#region ui/features/panel/controllers/hotkeysState.ts
var _ = {
	suspended: !1,
	scope: null,
	ratingHotkeysActive: !1
};
function te() {
	return _;
}
function ne(e) {
	_.scope = e == null ? null : String(e);
}
function re() {
	return !!_.suspended;
}
function ie(e) {
	_.ratingHotkeysActive = !!e;
}
//#endregion
//#region ui/features/viewer/viewerRuntimeHosts.ts
var v = null, ae = ".mjr-mfv";
function oe(e) {
	return !!e && typeof e.appendChild == "function";
}
function y() {
	return typeof document > "u" ? null : document?.body || null;
}
function se() {
	return typeof document > "u" ? null : document?.body || document?.documentElement || null;
}
function b(e) {
	return oe(e) ? e === y() || typeof e?.isConnected != "boolean" || e.isConnected : !1;
}
function ce(e) {
	return oe(e) ? e : null;
}
function x(e) {
	return b(e) ? e : y();
}
function le(e) {
	let t = se();
	return b(t) ? t : x(e);
}
function ue(e, t, n = x) {
	let r = [], i = /* @__PURE__ */ new Set();
	for (let a of [
		n(t),
		y(),
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
	return v = ce(e), de(ae, v, le), () => pe(e);
}
function pe(e) {
	(!e || v === e) && (v = null);
}
function me(e) {
	let t = le(v);
	try {
		t?.appendChild?.(e);
	} catch (e) {
		console.debug?.(e);
	}
	return t;
}
//#endregion
//#region ui/features/viewer/floatingViewerManager.ts
var he = /* @__PURE__ */ e({
	floatingViewerManager: () => X,
	installFloatingViewerGlobalHandlers: () => $,
	removeFloatingViewerGlobalHandlers: () => He,
	teardownFloatingViewerManager: () => Ue
}), S = null, C = null;
async function ge() {
	return S || (C ||= import("./FloatingViewer-C0LFs3sU.js").then((e) => (S = e.FloatingViewer, S)), C);
}
var w = null, _e = null;
async function ve() {
	if (!w) return _e ||= import("./NodeStreamController-DpGjUOfx.js").then((e) => {
		w = e.setNodeStreamActive;
	}), _e;
}
var T = Object.freeze({
	SIMPLE: "simple",
	AB: "ab",
	SIDE: "side",
	GRID: "grid",
	GRAPH: "graph"
});
function ye(e) {
	let t = String(e || "").trim().toLowerCase();
	return t === "sidebyside" ? T.SIDE : Object.values(T).includes(t) ? t : "";
}
var E = null;
function D() {
	return i.MFV_LIVE_DEFAULT !== !1;
}
function O() {
	return i.MFV_PREVIEW_DEFAULT !== !1;
}
var k = D(), A = O(), j = !1, M = null, N = !1, P = null, F = 0;
function be() {
	k = D(), A = O(), E?.setLiveActive(k), E?.setPreviewActive(A);
}
async function I() {
	if (!E) {
		let e = await ge();
		E || (E = new e({ controller: {
			close: () => X.close(),
			toggle: () => X.toggle(),
			toggleLive: () => X.toggleLive(),
			togglePreview: () => X.togglePreview(),
			toggleNodeStream: () => X.toggleNodeStream(),
			popOut: () => X.popOut(),
			onModeChanged: (e) => {
				E?.isVisible && e !== T.SIMPLE && U();
			},
			handleForwardedKeydown: (e) => Q(e, { forwarded: !0 })
		} }), me(E.render()));
	}
	try {
		let e = E?.element || null;
		e?.isConnected === !1 && me(e);
	} catch (e) {
		console.debug?.(e);
	}
	return E;
}
function L() {
	try {
		P?.abort();
	} catch (e) {
		console.debug?.(e);
	}
	P = null;
}
function R() {
	try {
		let e = window.__MJR_LAST_SELECTION_GRID__;
		if (e?.isConnected) return e;
	} catch (e) {
		console.debug?.(e);
	}
	return p();
}
function xe() {
	if (E) {
		try {
			E.dispose?.();
		} catch (e) {
			console.debug?.(e);
		}
		E = null;
	}
}
function z(e) {
	typeof window > "u" || window.dispatchEvent(new CustomEvent(a.MFV_VISIBILITY_CHANGED, { detail: { visible: !!e } }));
}
function B(e) {
	e && (e.setLiveActive(k), e.setPreviewActive(A), e.setNodeStreamActive?.(j));
}
function V(e) {
	e?.setNodeStreamSelection && e.setNodeStreamSelection(M || null);
}
function Se(e, t) {
	if (!e) return;
	let n = e._mode;
	if (n !== T.AB && n !== T.SIDE && n !== T.GRID) {
		e.loadMediaA(t, { autoMode: !0 });
		return;
	}
	let r = e.getPinnedSlots();
	if (n === T.GRID) {
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
function Ce(e) {
	try {
		let t = R();
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
	if (!e.length || !E) return;
	L();
	let n = ++F, i = typeof AbortController < "u" ? new AbortController() : null;
	P = i;
	try {
		let a = E.getPinnedSlots(), o = a.size > 0, s = E._mode, c = s === T.GRID, l = s === T.AB || s === T.SIDE, u = c ? 4 : 2, d = e.slice(0, u);
		if (o && (l || c)) {
			let e = u - a.size;
			d = d.slice(0, Math.max(1, e));
		} else if (d.length === 1 && l) {
			let e = Ce(d[0]);
			e && (d = [d[0], e]);
		}
		let f = R(), p = f?._mjrGetAssets?.() || f?._mjrGetSelectedAssets?.() || [], m = new Map([...p, ...t].filter((e) => e && e.kind !== "folder").map((e) => [String(e.id), e])), h = d.filter((e) => Number.isSafeInteger(Number(e)) && Number(e) > 0), g = h.length ? await r(h, i ? { signal: i.signal } : {}) : {
			ok: !0,
			data: []
		};
		if (i?.signal.aborted || F !== n || !E) return;
		let ee = new Map((g?.ok && Array.isArray(g.data) ? g.data : []).map((e) => [String(e.id), e])), _ = d.map((e) => ee.get(String(e)) || m.get(String(e))).filter(Boolean);
		if (!_.length) return;
		if (c) {
			if (o) {
				let e = {
					A: E._mediaA,
					B: E._mediaB,
					C: E._mediaC,
					D: E._mediaD
				}, t = [
					"A",
					"B",
					"C",
					"D"
				].filter((e) => !a.has(e)), n = 0;
				for (let r of t) n < _.length && (e[r] = _[n++]);
				E.loadMediaQuad(e.A, e.B, e.C, e.D);
			} else _.length >= 3 ? E.loadMediaQuad(_[0], _[1], _[2], _[3] || null) : _.length >= 2 ? E.loadMediaPair(_[0], _[1]) : E.loadMediaA(_[0], { autoMode: !0 });
			return;
		}
		if (a.has("A") && a.has("B") && E._mediaA && E._mediaB) return;
		a.has("A") && E._mediaA ? E.loadMediaPair(E._mediaA, _[0]) : a.has("B") && E._mediaB ? E.loadMediaPair(_[0], E._mediaB) : d.length >= 2 && _.length >= 2 ? E.loadMediaPair(_[0], _[1]) : E.loadMediaA(_[0], { autoMode: !0 });
	} catch (e) {
		e?.name !== "AbortError" && s(e, "floatingViewerManager._loadFromIds");
	} finally {
		P === i && (P = null);
	}
}
function U() {
	try {
		let e = R();
		if (!e) return;
		let t = m(e);
		if (!t.size) return;
		H(Array.from(t));
	} catch (e) {
		console.debug?.("[MFV] Error reading current grid selection", e);
	}
}
function we(e) {
	if (!E?.isVisible || E._mode === T.GRAPH) return;
	let t = Array.isArray(e?.detail?.selectedAssets) ? e.detail.selectedAssets : [], n = new Set(t.filter((e) => String(e?.kind || "").toLowerCase() === "folder").map((e) => String(e?.id || "")).filter(Boolean)), r = Array.isArray(e?.detail?.selectedIds) ? e.detail.selectedIds.map(String).filter((e) => !!e && !n.has(e)) : [];
	if (r.length) {
		H(r, t);
		return;
	}
	try {
		let e = R();
		if (!e) return;
		let t = Array.from(m(e)).map(String).filter(Boolean);
		if (!t.length) return;
		H(t);
	} catch (e) {
		console.debug?.("[MFV] selection fallback failed", e);
	}
}
function W() {
	N || typeof window > "u" || (window.addEventListener(a.SELECTION_CHANGED, we), N = !0);
}
function Te() {
	typeof window < "u" && window.removeEventListener(a.SELECTION_CHANGED, we), N = !1, L();
}
var G = !1, K = null, q = null, J = "";
function Ee() {
	E?.isVisible && E.refreshSidebar?.();
}
function De() {
	Oe();
	let e = typeof window < "u" ? window : globalThis;
	if (typeof e.requestAnimationFrame == "function") {
		J = "raf", q = e.requestAnimationFrame(() => {
			q = null, J = "", Ee();
		});
		return;
	}
	J = "timeout", q = e.setTimeout(() => {
		q = null, J = "", Ee();
	}, 16);
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
		return !!(E?.isVisible && E?._mode === T.GRAPH);
	},
	async openAssets({ assets: e = [], asset: t = null, index: n = 0, mode: r = "" } = {}) {
		let i = Array.isArray(e) ? e.filter(Boolean) : t ? [t] : [];
		if (!i.length) return !1;
		let a = await I(), o = !!a.isVisible, s = Math.max(0, Math.min(Number(n) || 0, i.length - 1)), c = ye(r);
		c && a.setMode(c), a.show(), B(a), W(), Y();
		let l = a._mode;
		return l === T.GRID && i.length >= 3 ? a.loadMediaQuad(i[0], i[1], i[2], i[3] || null) : (l === T.AB || l === T.SIDE) && i.length >= 2 ? a.loadMediaPair(i[0], i[1]) : a.loadMediaA(i[s], { autoMode: !1 }), o || z(!0), !0;
	},
	async open() {
		let e = await I();
		e.show(), B(e), W(), Y(), G || requestAnimationFrame(() => Y()), U(), j && V(e), z(!0);
	},
	close() {
		if (E) try {
			E.isPopped && E.popIn(), E.hide();
		} catch (e) {
			console.debug?.(e);
		}
		Te(), E?.setNodeStreamSelection?.(null), ke(), z(!1);
	},
	async toggle() {
		E?.isVisible ? X.close() : await X.open();
	},
	toggleLive() {
		X.setLiveActive(!k);
	},
	togglePreview() {
		X.setPreviewActive(!A);
	},
	async toggleCompareAB() {
		let e = await I();
		if (!e.isVisible) {
			e.setMode(T.AB), e.show(), B(e), W(), U(), z(!0);
			return;
		}
		let t = {
			[T.AB]: T.SIDE,
			[T.SIDE]: T.SIMPLE,
			[T.GRID]: T.SIMPLE,
			[T.SIMPLE]: T.AB
		}[e._mode] || T.AB;
		e.setMode(t), t !== T.SIMPLE && U();
	},
	async upsertWithContent(e) {
		let t = await I(), n = !!t.isVisible;
		!n && i.MFV_LIVE_AUTO_OPEN === !1 || (t.show(), B(t), W(), Se(t, e), n || z(!0));
	},
	setLiveActive(e) {
		k = !!e, E?.setLiveActive(k);
	},
	getLiveActive() {
		return k;
	},
	async popOut() {
		let e = await I();
		e.isPopped ? e.popIn() : (e.isVisible || await X.open(), e.popOut());
	},
	setPreviewActive(e) {
		A = !!e, E?.setPreviewActive(A);
	},
	getPreviewActive() {
		return A;
	},
	canAcceptPreviewBlob() {
		return A ? E?.isVisible ? !0 : i.MFV_PREVIEW_AUTO_OPEN !== !1 : !1;
	},
	async feedPreviewBlob(e, t = {}) {
		if (!X.canAcceptPreviewBlob()) return;
		let n = await I(), r = !!n.isVisible;
		!r && i.MFV_PREVIEW_AUTO_OPEN === !1 || (n.isVisible || n.show(), B(n), n.loadPreviewBlob(e, ...Object.keys(t).length ? [t] : []), r || z(!0));
	},
	toggleNodeStream() {
		X.setNodeStreamActive(!j);
	},
	setNodeStreamActive(e) {
		j = !!e, j || (M = null), ve().then(() => {
			w && w(j);
		}), E?.setNodeStreamActive?.(j), j ? E && V(E) : E?.setNodeStreamSelection?.(null);
	},
	getNodeStreamActive() {
		return j;
	},
	setNodeStreamSelection(e, t, n) {
		M = e == null || e === "" ? null : {
			nodeId: e,
			classType: t,
			title: n
		};
		let r = E;
		r && V(r);
	},
	async feedNodeStream(e) {
		if (!j) return;
		let t = await I(), n = !!t.isVisible;
		!n && i.MFV_NODE_STREAM_AUTO_OPEN === !1 || (t.isVisible || (t.show(), W()), B(t), V(t), Se(t, e), n || z(!0));
	}
}, Z = !1, Ae = () => X.open(), je = () => X.close(), Me = () => X.toggle(), Ne = () => X.toggleLive(), Pe = () => X.togglePreview(), Fe = () => X.toggleNodeStream(), Ie = () => X.popOut(), Le = () => {
	try {
		E?.isPopped && E.popIn();
	} catch {}
}, Re = (e) => {
	let t = String(e?.detail?.key || "");
	(!t || t === "viewer" || t === "viewer.mfvLiveDefault" || t === "viewer.mfvPreviewDefault") && be();
};
function ze(e) {
	let t = String(e?.key || "");
	return t === " " || t === "Spacebar" || t === "ArrowLeft" || t === "ArrowRight";
}
function Be(e) {
	if (!E?.isVisible || !ze(e)) return !1;
	try {
		let t = e?.target, n = E?.element || null, r = !!n?.contains?.(t), i = (t?.closest?.(".mjr-mfv-simple-player") || (r || t == null ? n?.querySelector?.(".mjr-mfv-simple-player") : null))?._mjrSimplePlayerHandleKeydown;
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
	let n = E?.element;
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
	if (!E?.isVisible || re() || te().scope === "viewer") return;
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
		return;
	}
};
function $() {
	Z || typeof window > "u" || !window?.addEventListener || (window.addEventListener(a.MFV_OPEN, Ae), window.addEventListener(a.MFV_CLOSE, je), window.addEventListener(a.MFV_TOGGLE, Me), window.addEventListener(a.MFV_LIVE_TOGGLE, Ne), window.addEventListener(a.MFV_PREVIEW_TOGGLE, Pe), window.addEventListener(a.MFV_NODESTREAM_TOGGLE, Fe), window.addEventListener(a.MFV_POPOUT, Ie), window.addEventListener(a.SETTINGS_CHANGED, Re), window.addEventListener("keydown", Q, !0), window.addEventListener("beforeunload", Le), Z = !0);
}
function He() {
	if (typeof window > "u" || !window?.removeEventListener) {
		Z = !1;
		return;
	}
	window.removeEventListener(a.MFV_OPEN, Ae), window.removeEventListener(a.MFV_CLOSE, je), window.removeEventListener(a.MFV_TOGGLE, Me), window.removeEventListener(a.MFV_LIVE_TOGGLE, Ne), window.removeEventListener(a.MFV_PREVIEW_TOGGLE, Pe), window.removeEventListener(a.MFV_NODESTREAM_TOGGLE, Fe), window.removeEventListener(a.MFV_POPOUT, Ie), window.removeEventListener(a.SETTINGS_CHANGED, Re), window.removeEventListener("keydown", Q, !0), window.removeEventListener("beforeunload", Le), Z = !1;
}
function Ue({ reinstallGlobalHandlers: e = !1 } = {}) {
	let t = !!E?.isVisible;
	try {
		E?.isPopped && E.popIn();
	} catch (e) {
		console.debug?.(e);
	}
	He(), Te(), ke(), L(), F += 1, k = D(), A = O(), j = !1;
	try {
		w && w(!1);
	} catch (e) {
		console.debug?.(e);
	}
	xe(), t && z(!1), e && $();
}
//#endregion
export { s as _, fe as a, ne as c, h as d, ee as f, o as g, d as h, Ue as i, ie as l, p as m, he as n, te as o, f as p, $ as r, re as s, X as t, m as u };
