import { Dt as e, o as t, p as n } from "./hostAdapter-D6BwD-lN.js";
import { t as r } from "./config-dvcltBqE.js";
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
function ee(e, t, n = "") {
	let r = Array.from(t || []), i = n ? String(n) : r[0] ? String(r[0]) : "";
	try {
		r.length ? (e.dataset.mjrSelectedAssetIds = JSON.stringify(r), i ? e.dataset.mjrSelectedAssetId = String(i) : delete e.dataset.mjrSelectedAssetId) : (delete e.dataset.mjrSelectedAssetIds, delete e.dataset.mjrSelectedAssetId);
	} catch (e) {
		console.debug?.(e);
	}
	return r;
}
function te(e, t, n) {
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
function ne(e, t, { activeId: n = "" } = {}, r) {
	if (!e) return [];
	let i = new Set(Array.from(t || []).map(String).filter(Boolean)), a = ee(e, i, n);
	te(e, i, r);
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
var m = {
	suspended: !1,
	scope: null,
	ratingHotkeysActive: !1
};
function re() {
	return m;
}
function ie(e) {
	m.scope = e == null ? null : String(e);
}
function ae() {
	return !!m.suspended;
}
function oe(e) {
	m.ratingHotkeysActive = !!e;
}
//#endregion
//#region ui/features/viewer/viewerRuntimeHosts.ts
var h = null, g = null, se = ".mjr-viewer-overlay", ce = ".mjr-mfv";
function le(e) {
	return !!e && typeof e.appendChild == "function";
}
function _() {
	return typeof document > "u" ? null : document?.body || null;
}
function ue() {
	return typeof document > "u" ? null : document?.body || document?.documentElement || null;
}
function de(e) {
	return le(e) ? e === _() ? !0 : typeof e?.isConnected == "boolean" ? e.isConnected : !0 : !1;
}
function fe(e) {
	return le(e) ? e : null;
}
function v(e) {
	return de(e) ? e : _();
}
function pe(e) {
	let t = ue();
	return de(t) ? t : v(e);
}
function me(e, t, n = v) {
	let r = [], i = /* @__PURE__ */ new Set();
	for (let a of [
		n(t),
		_(),
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
function he(e, t, n = v) {
	let r = n(t);
	if (!r) return;
	let i = me(e, t, n);
	for (let e of i) if (e && e.parentNode !== r) try {
		r.appendChild(e);
	} catch (e) {
		console.debug?.(e);
	}
}
function ge(e) {
	return h = fe(e), he(se, h), () => _e(e);
}
function _e(e) {
	(!e || h === e) && (h = null);
}
function ve(e) {
	return g = fe(e), he(ce, g, pe), () => ye(e);
}
function ye(e) {
	(!e || g === e) && (g = null);
}
function be(e) {
	let t = v(h);
	try {
		t?.appendChild?.(e);
	} catch (e) {
		console.debug?.(e);
	}
	return t;
}
function xe(e) {
	let t = pe(g);
	try {
		t?.appendChild?.(e);
	} catch (e) {
		console.debug?.(e);
	}
	return t;
}
function Se() {
	return me(se, h);
}
//#endregion
//#region ui/features/viewer/floatingViewerManager.ts
var y = null, Ce = null;
async function we() {
	return y || (Ce ||= import("./FloatingViewer-CY901ToM.js").then((e) => (y = e.FloatingViewer, y)), Ce);
}
var b = null, Te = null;
async function Ee() {
	if (!b) return Te ||= import("./NodeStreamController-_rtriits.js").then((e) => {
		b = e.setNodeStreamActive;
	}), Te;
}
var x = Object.freeze({
	SIMPLE: "simple",
	AB: "ab",
	SIDE: "side",
	GRID: "grid",
	GRAPH: "graph"
});
function De(e) {
	let t = String(e || "").trim().toLowerCase();
	return t === "sidebyside" ? x.SIDE : Object.values(x).includes(t) ? t : "";
}
var S = null;
function C() {
	return r.MFV_LIVE_DEFAULT !== !1;
}
function w() {
	return r.MFV_PREVIEW_DEFAULT !== !1;
}
var T = C(), E = w(), D = !1, O = null, k = !1, A = null, j = 0;
function Oe() {
	T = C(), E = w(), S?.setLiveActive(T), S?.setPreviewActive(E);
}
async function M() {
	if (!S) {
		let e = await we();
		S || (S = new e({ controller: {
			close: () => Q.close(),
			toggle: () => Q.toggle(),
			toggleLive: () => Q.toggleLive(),
			togglePreview: () => Q.togglePreview(),
			toggleNodeStream: () => Q.toggleNodeStream(),
			popOut: () => Q.popOut(),
			onModeChanged: (e) => {
				S?.isVisible && e !== x.SIMPLE && z();
			},
			handleForwardedKeydown: (e) => qe(e)
		} }), xe(S.render()));
	}
	try {
		let e = S?.element || null;
		e?.isConnected === !1 && xe(e);
	} catch (e) {
		console.debug?.(e);
	}
	return S;
}
function N() {
	try {
		A?.abort();
	} catch (e) {
		console.debug?.(e);
	}
	A = null;
}
function P() {
	try {
		let e = window.__MJR_LAST_SELECTION_GRID__;
		if (e?.isConnected) return e;
	} catch (e) {
		console.debug?.(e);
	}
	return f();
}
function ke() {
	if (S) {
		try {
			S.dispose?.();
		} catch (e) {
			console.debug?.(e);
		}
		S = null;
	}
}
function F(e) {
	typeof window > "u" || window.dispatchEvent(new CustomEvent(i.MFV_VISIBILITY_CHANGED, { detail: { visible: !!e } }));
}
function I(e) {
	e && (e.setLiveActive(T), e.setPreviewActive(E), e.setNodeStreamActive?.(D));
}
function L(e) {
	e?.setNodeStreamSelection && e.setNodeStreamSelection(O || null);
}
function Ae(e, t) {
	if (!e) return;
	let n = e._mode;
	if (!(n === x.AB || n === x.SIDE || n === x.GRID)) {
		e.loadMediaA(t, { autoMode: !0 });
		return;
	}
	let r = e.getPinnedSlots();
	if (n === x.GRID) {
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
function je(e) {
	try {
		let t = P();
		if (!t) return null;
		let n = Array.from(t.querySelectorAll("[data-mjr-asset-id]")), r = n.findIndex((t) => t.dataset.mjrAssetId === String(e));
		if (r < 0) return null;
		let i = (n[r + 1] ?? n[r - 1] ?? null)?.dataset?.mjrAssetId ?? null;
		return i && i !== String(e) ? i : null;
	} catch (e) {
		return console.debug?.("[MFV] _findAdjacentGridId error", e), null;
	}
}
async function R(e) {
	if (!e.length || !S) return;
	N();
	let t = ++j, r = typeof AbortController < "u" ? new AbortController() : null;
	A = r;
	try {
		let i = S.getPinnedSlots(), a = i.size > 0, o = S._mode, s = o === x.GRID, c = o === x.AB || o === x.SIDE, l = s ? 4 : 2, u = e.slice(0, l);
		if (a && (c || s)) {
			let e = l - i.size;
			u = u.slice(0, Math.max(1, e));
		} else if (u.length === 1 && c) {
			let e = je(u[0]);
			e && (u = [u[0], e]);
		}
		let d = await n(u, r ? { signal: r.signal } : {});
		if (r?.signal.aborted || j !== t || !d?.ok || !Array.isArray(d.data) || !d.data.length || !S) return;
		let f = d.data;
		if (s) {
			if (a) {
				let e = {
					A: S._mediaA,
					B: S._mediaB,
					C: S._mediaC,
					D: S._mediaD
				}, t = [
					"A",
					"B",
					"C",
					"D"
				].filter((e) => !i.has(e)), n = 0;
				for (let r of t) n < f.length && (e[r] = f[n++]);
				S.loadMediaQuad(e.A, e.B, e.C, e.D);
			} else f.length >= 3 ? S.loadMediaQuad(f[0], f[1], f[2], f[3] || null) : f.length >= 2 ? S.loadMediaPair(f[0], f[1]) : S.loadMediaA(f[0], { autoMode: !0 });
			return;
		}
		if (i.has("A") && i.has("B") && S._mediaA && S._mediaB) return;
		i.has("A") && S._mediaA ? S.loadMediaPair(S._mediaA, f[0]) : i.has("B") && S._mediaB ? S.loadMediaPair(f[0], S._mediaB) : u.length >= 2 && f.length >= 2 ? S.loadMediaPair(f[0], f[1]) : S.loadMediaA(f[0], { autoMode: !0 });
	} catch (e) {
		e?.name !== "AbortError" && o(e, "floatingViewerManager._loadFromIds");
	} finally {
		A === r && (A = null);
	}
}
function z() {
	try {
		let e = P();
		if (!e) return;
		let t = p(e);
		if (!t.size) return;
		R(Array.from(t));
	} catch (e) {
		console.debug?.("[MFV] Error reading current grid selection", e);
	}
}
function Me(e) {
	if (!S?.isVisible) return;
	let t = Array.isArray(e?.detail?.selectedAssets) ? e.detail.selectedAssets : [], n = new Set(t.filter((e) => String(e?.kind || "").toLowerCase() === "folder").map((e) => String(e?.id || "")).filter(Boolean)), r = Array.isArray(e?.detail?.selectedIds) ? e.detail.selectedIds.map(String).filter((e) => !!e && !n.has(e)) : [];
	if (r.length) {
		R(r);
		return;
	}
	try {
		let e = P();
		if (!e) return;
		let t = Array.from(p(e)).map(String).filter(Boolean);
		if (!t.length) return;
		R(t);
	} catch (e) {
		console.debug?.("[MFV] selection fallback failed", e);
	}
}
function B() {
	k || typeof window > "u" || (window.addEventListener(i.SELECTION_CHANGED, Me), k = !0);
}
function Ne() {
	typeof window < "u" && window.removeEventListener(i.SELECTION_CHANGED, Me), k = !1, N();
}
var V = !1, H = null, U = null, W = null, G = !1, K = !1, q = !1, J = null, Y = null, X = "";
function Z() {
	S?.isVisible && S.refreshSidebar?.();
}
function Pe() {
	Fe();
	let e = typeof window < "u" ? window : globalThis;
	if (typeof e.requestAnimationFrame == "function") {
		X = "raf", Y = e.requestAnimationFrame(() => {
			Y = null, X = "", Z();
		});
		return;
	}
	X = "timeout", Y = e.setTimeout(() => {
		Y = null, X = "", Z();
	}, 16);
}
function Fe() {
	if (Y == null) return;
	let e = typeof window < "u" ? window : globalThis;
	try {
		X === "raf" && typeof e.cancelAnimationFrame == "function" ? e.cancelAnimationFrame(Y) : typeof e.clearTimeout == "function" && e.clearTimeout(Y);
	} catch (e) {
		console.debug?.(e);
	}
	Y = null, X = "";
}
function Ie() {
	if (!V) try {
		let e = t()?.canvas;
		if (!e) return;
		G = Object.prototype.hasOwnProperty.call(e, "onNodeSelected"), K = Object.prototype.hasOwnProperty.call(e, "onSelectionChange"), q = Object.prototype.hasOwnProperty.call(e, "onNodeDeselected"), H = e.onNodeSelected, U = e.onSelectionChange, W = e.onNodeDeselected, e.onNodeSelected = function(e) {
			H?.call(this, e), Z();
		}, e.onSelectionChange = function(e) {
			U?.call(this, e), Z();
		}, e.onNodeDeselected = function(e) {
			W?.call(this, e), Z();
		};
		let n = e.canvas;
		n?.addEventListener && (J = Pe, n.addEventListener("pointerup", J)), V = !0;
	} catch (e) {
		console.debug?.("[MFV] _bindNodeSelectionListener error", e);
	}
}
function Le() {
	if (V) {
		Fe();
		try {
			let e = t()?.canvas;
			e && (G ? e.onNodeSelected = H : delete e.onNodeSelected, K ? e.onSelectionChange = U : delete e.onSelectionChange, q ? e.onNodeDeselected = W : delete e.onNodeDeselected, J && e.canvas?.removeEventListener && e.canvas.removeEventListener("pointerup", J));
		} catch (e) {
			console.debug?.("[MFV] _unbindNodeSelectionListener error", e);
		}
		H = null, U = null, W = null, G = !1, K = !1, q = !1, J = null, V = !1;
	}
}
var Q = {
	async openAssets({ assets: e = [], asset: t = null, index: n = 0, mode: r = "" } = {}) {
		let i = Array.isArray(e) ? e.filter(Boolean) : t ? [t] : [];
		if (!i.length) return !1;
		let a = await M(), o = !!a.isVisible, s = Math.max(0, Math.min(Number(n) || 0, i.length - 1)), c = De(r);
		c && a.setMode(c), a.show(), I(a), B(), Ie();
		let l = a._mode;
		return l === x.GRID && i.length >= 3 ? a.loadMediaQuad(i[0], i[1], i[2], i[3] || null) : (l === x.AB || l === x.SIDE) && i.length >= 2 ? a.loadMediaPair(i[0], i[1]) : a.loadMediaA(i[s], { autoMode: !1 }), o || F(!0), !0;
	},
	async open() {
		let e = await M();
		e.show(), I(e), B(), Ie(), V || requestAnimationFrame(() => Ie()), z(), D && L(e), F(!0);
	},
	close() {
		if (S) try {
			S.isPopped && S.popIn(), S.hide();
		} catch (e) {
			console.debug?.(e);
		}
		Ne(), S?.setNodeStreamSelection?.(null), Le(), F(!1);
	},
	async toggle() {
		S?.isVisible ? Q.close() : await Q.open();
	},
	toggleLive() {
		Q.setLiveActive(!T);
	},
	togglePreview() {
		Q.setPreviewActive(!E);
	},
	async toggleCompareAB() {
		let e = await M();
		if (!e.isVisible) {
			e.setMode(x.AB), e.show(), I(e), B(), z(), F(!0);
			return;
		}
		let t = {
			[x.AB]: x.SIDE,
			[x.SIDE]: x.SIMPLE,
			[x.GRID]: x.SIMPLE,
			[x.SIMPLE]: x.AB
		}[e._mode] || x.AB;
		e.setMode(t), t !== x.SIMPLE && z();
	},
	async upsertWithContent(e) {
		let t = await M(), n = !!t.isVisible;
		!n && r.MFV_LIVE_AUTO_OPEN === !1 || (t.show(), I(t), B(), Ae(t, e), n || F(!0));
	},
	setLiveActive(e) {
		T = !!e, S?.setLiveActive(T);
	},
	getLiveActive() {
		return T;
	},
	async popOut() {
		let e = await M();
		e.isPopped ? e.popIn() : (e.isVisible || await Q.open(), e.popOut());
	},
	setPreviewActive(e) {
		E = !!e, S?.setPreviewActive(E);
	},
	getPreviewActive() {
		return E;
	},
	async feedPreviewBlob(e, t = {}) {
		if (!E) return;
		let n = await M(), i = !!n.isVisible;
		!i && r.MFV_PREVIEW_AUTO_OPEN === !1 || (n.isVisible || n.show(), I(n), n.loadPreviewBlob(e, ...Object.keys(t).length ? [t] : []), i || F(!0));
	},
	toggleNodeStream() {
		Q.setNodeStreamActive(!D);
	},
	setNodeStreamActive(e) {
		D = !!e, D || (O = null), Ee().then(() => {
			b && b(D);
		}), S?.setNodeStreamActive?.(D), D ? S && L(S) : S?.setNodeStreamSelection?.(null);
	},
	getNodeStreamActive() {
		return D;
	},
	setNodeStreamSelection(e, t, n) {
		O = e == null || e === "" ? null : {
			nodeId: e,
			classType: t,
			title: n
		};
		let r = S;
		r && L(r);
	},
	async feedNodeStream(e) {
		if (!D) return;
		let t = await M(), n = !!t.isVisible;
		!n && r.MFV_NODE_STREAM_AUTO_OPEN === !1 || (t.isVisible || (t.show(), B()), I(t), L(t), Ae(t, e), n || F(!0));
	}
}, $ = !1, Re = () => Q.open(), ze = () => Q.close(), Be = () => Q.toggle(), Ve = () => Q.toggleLive(), He = () => Q.togglePreview(), Ue = () => Q.toggleNodeStream(), We = () => Q.popOut(), Ge = () => {
	try {
		S?.isPopped && S.popIn();
	} catch {}
}, Ke = (e) => {
	let t = String(e?.detail?.key || "");
	(!t || t === "viewer" || t === "viewer.mfvLiveDefault" || t === "viewer.mfvPreviewDefault") && Oe();
}, qe = (e) => {
	if (!S?.isVisible || ae() || re().scope === "viewer") return;
	let t = e?.key?.toLowerCase?.() || "";
	if (e?.target?.isContentEditable || e?.target?.closest?.("input, textarea, select, [contenteditable='true']")) return;
	let n = () => {
		e.preventDefault?.(), e.stopPropagation?.(), e.stopImmediatePropagation?.();
	};
	if (!e?.ctrlKey && !e?.metaKey && !e?.altKey && !e?.shiftKey) {
		if (t === "v") {
			n(), Q.toggle();
			return;
		}
		if (t === "k") {
			n(), Q.togglePreview();
			return;
		}
		if (t === "l") {
			n(), Q.toggleLive();
			return;
		}
		if (t === "n") {
			n(), Q.toggleNodeStream();
			return;
		}
		t === "c" && (n(), Q.toggleCompareAB());
		return;
	}
};
function Je() {
	$ || typeof window > "u" || !window?.addEventListener || (window.addEventListener(i.MFV_OPEN, Re), window.addEventListener(i.MFV_CLOSE, ze), window.addEventListener(i.MFV_TOGGLE, Be), window.addEventListener(i.MFV_LIVE_TOGGLE, Ve), window.addEventListener(i.MFV_PREVIEW_TOGGLE, He), window.addEventListener(i.MFV_NODESTREAM_TOGGLE, Ue), window.addEventListener(i.MFV_POPOUT, We), window.addEventListener(i.SETTINGS_CHANGED, Ke), window.addEventListener("keydown", qe, !0), window.addEventListener("beforeunload", Ge), $ = !0);
}
function Ye() {
	if (typeof window > "u" || !window?.removeEventListener) {
		$ = !1;
		return;
	}
	window.removeEventListener(i.MFV_OPEN, Re), window.removeEventListener(i.MFV_CLOSE, ze), window.removeEventListener(i.MFV_TOGGLE, Be), window.removeEventListener(i.MFV_LIVE_TOGGLE, Ve), window.removeEventListener(i.MFV_PREVIEW_TOGGLE, He), window.removeEventListener(i.MFV_NODESTREAM_TOGGLE, Ue), window.removeEventListener(i.MFV_POPOUT, We), window.removeEventListener(i.SETTINGS_CHANGED, Ke), window.removeEventListener("keydown", qe, !0), window.removeEventListener("beforeunload", Ge), $ = !1;
}
function Xe({ reinstallGlobalHandlers: e = !1 } = {}) {
	let t = !!S?.isVisible;
	try {
		S?.isPopped && S.popIn();
	} catch (e) {
		console.debug?.(e);
	}
	Ye(), Ne(), Le(), N(), j += 1, T = C(), E = w(), D = !1;
	try {
		b && b(!1);
	} catch (e) {
		console.debug?.(e);
	}
	ke(), t && F(!1), e && Je();
}
//#endregion
export { u as _, Se as a, re as c, oe as d, p as f, f as g, d as h, be as i, ae as l, ne as m, Je as n, ve as o, ee as p, Xe as r, ge as s, Q as t, ie as u, a as v, o as y };
