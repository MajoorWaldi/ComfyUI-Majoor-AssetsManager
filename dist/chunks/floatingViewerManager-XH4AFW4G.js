import { t as e } from "./rolldown-runtime-Dy4uBu1J.js";
import { _ as t, d as n, o as r, s as i, t as a } from "./viewerRuntimeHosts-BBd8uK6j.js";
import { o, r as s, z as c } from "./events-CoI83paj.js";
//#region ui/features/panel/panelRuntimeRefs.ts
var l = null;
function u(e) {
	return e ? typeof e?.isConnected != "boolean" || e.isConnected : !1;
}
function d() {
	try {
		let e = document.getElementById("mjr-assets-grid") || document.querySelector(".mjr-grid");
		if (u(e)) return e;
	} catch (e) {
		console.debug?.(e);
	}
	return null;
}
function f(e) {
	return l = e || null, l;
}
function p(e = null) {
	(!e || l === e) && (l = null);
}
function m() {
	return u(l) ? l : (l = null, d());
}
//#endregion
//#region ui/features/grid/GridSelectionManager.ts
function h(e) {
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
function g(e, t, n = "") {
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
function _(e, t, { activeId: n = "" } = {}, r) {
	if (!e) return [];
	let i = new Set(Array.from(t || []).map(String).filter(Boolean)), a = g(e, i, n);
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
//#region ui/features/viewer/floatingViewerManager.ts
var te = /* @__PURE__ */ e({
	floatingViewerManager: () => Y,
	installFloatingViewerGlobalHandlers: () => $,
	removeFloatingViewerGlobalHandlers: () => Ce,
	teardownFloatingViewerManager: () => we
}), v = null, y = null;
async function ne() {
	return v || (y ||= import("./FloatingViewer-38MC8yxJ.js").then((e) => (v = e.FloatingViewer, v)), y);
}
var b = null, re = null;
async function ie() {
	if (!b) return re ||= import("./NodeStreamController-DaqaPtXc.js").then((e) => {
		b = e.setNodeStreamActive;
	}), re;
}
var x = Object.freeze({
	SIMPLE: "simple",
	AB: "ab",
	SIDE: "side",
	GRID: "grid",
	GRAPH: "graph"
});
function ae(e) {
	let t = String(e || "").trim().toLowerCase();
	return t === "sidebyside" ? x.SIDE : Object.values(x).includes(t) ? t : "";
}
var S = null;
function C() {
	return o.MFV_LIVE_DEFAULT !== !1;
}
function w() {
	return o.MFV_PREVIEW_DEFAULT !== !1;
}
var T = C(), E = w(), D = !1, O = null, k = !1, A = null, j = 0;
function oe() {
	T = C(), E = w(), S?.setLiveActive(T), S?.setPreviewActive(E);
}
async function M() {
	if (!S) {
		let e = await ne();
		S || (S = new e({ controller: {
			close: () => Y.close(),
			toggle: () => Y.toggle(),
			toggleLive: () => Y.toggleLive(),
			togglePreview: () => Y.togglePreview(),
			toggleNodeStream: () => Y.toggleNodeStream(),
			popOut: () => Y.popOut(),
			onModeChanged: (e) => {
				S?.isVisible && e !== x.SIMPLE && z();
			},
			handleForwardedKeydown: (e) => Q(e)
		} }), a(S.render()));
	}
	try {
		let e = S?.element || null;
		e?.isConnected === !1 && a(e);
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
	return m();
}
function se() {
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
	typeof window < "u" && window.dispatchEvent(new CustomEvent(s.MFV_VISIBILITY_CHANGED, { detail: { visible: !!e } }));
}
function I(e) {
	e && (e.setLiveActive(T), e.setPreviewActive(E), e.setNodeStreamActive?.(D));
}
function L(e) {
	e?.setNodeStreamSelection && e.setNodeStreamSelection(O || null);
}
function ce(e, t) {
	if (!e) return;
	let n = e._mode;
	if (n !== x.AB && n !== x.SIDE && n !== x.GRID) {
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
function le(e) {
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
async function R(e, r = []) {
	if (!e.length || !S) return;
	N();
	let i = ++j, a = typeof AbortController < "u" ? new AbortController() : null;
	A = a;
	try {
		let n = S.getPinnedSlots(), o = n.size > 0, s = S._mode, c = s === x.GRID, l = s === x.AB || s === x.SIDE, u = c ? 4 : 2, d = e.slice(0, u);
		if (o && (l || c)) {
			let e = u - n.size;
			d = d.slice(0, Math.max(1, e));
		} else if (d.length === 1 && l) {
			let e = le(d[0]);
			e && (d = [d[0], e]);
		}
		let f = P(), p = f?._mjrGetAssets?.() || f?._mjrGetSelectedAssets?.() || [], m = new Map([...p, ...r].filter((e) => e && e.kind !== "folder").map((e) => [String(e.id), e])), h = d.filter((e) => Number.isSafeInteger(Number(e)) && Number(e) > 0), g = h.length ? await t(h, a ? { signal: a.signal } : {}) : {
			ok: !0,
			data: []
		};
		if (a?.signal.aborted || j !== i || !S) return;
		let ee = new Map((g?.ok && Array.isArray(g.data) ? g.data : []).map((e) => [String(e.id), e])), _ = d.map((e) => ee.get(String(e)) || m.get(String(e))).filter(Boolean);
		if (!_.length) return;
		if (c) {
			if (o) {
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
				].filter((e) => !n.has(e)), r = 0;
				for (let n of t) r < _.length && (e[n] = _[r++]);
				S.loadMediaQuad(e.A, e.B, e.C, e.D);
			} else _.length >= 3 ? S.loadMediaQuad(_[0], _[1], _[2], _[3] || null) : _.length >= 2 ? S.loadMediaPair(_[0], _[1]) : S.loadMediaA(_[0], { autoMode: !0 });
			return;
		}
		if (n.has("A") && n.has("B") && S._mediaA && S._mediaB) return;
		n.has("A") && S._mediaA ? S.loadMediaPair(S._mediaA, _[0]) : n.has("B") && S._mediaB ? S.loadMediaPair(_[0], S._mediaB) : d.length >= 2 && _.length >= 2 ? S.loadMediaPair(_[0], _[1]) : S.loadMediaA(_[0], { autoMode: !0 });
	} catch (e) {
		e?.name !== "AbortError" && n(e, "floatingViewerManager._loadFromIds");
	} finally {
		A === a && (A = null);
	}
}
function z() {
	try {
		let e = P();
		if (!e) return;
		let t = h(e);
		if (!t.size) return;
		R(Array.from(t));
	} catch (e) {
		console.debug?.("[MFV] Error reading current grid selection", e);
	}
}
function B(e) {
	if (!S?.isVisible || S._mode === x.GRAPH) return;
	let t = Array.isArray(e?.detail?.selectedAssets) ? e.detail.selectedAssets : [], n = new Set(t.filter((e) => String(e?.kind || "").toLowerCase() === "folder").map((e) => String(e?.id || "")).filter(Boolean)), r = Array.isArray(e?.detail?.selectedIds) ? e.detail.selectedIds.map(String).filter((e) => !!e && !n.has(e)) : [];
	if (r.length) {
		R(r, t);
		return;
	}
	try {
		let e = P();
		if (!e) return;
		let t = Array.from(h(e)).map(String).filter(Boolean);
		if (!t.length) return;
		R(t);
	} catch (e) {
		console.debug?.("[MFV] selection fallback failed", e);
	}
}
function V() {
	k || typeof window < "u" && (window.addEventListener(s.SELECTION_CHANGED, B), k = !0);
}
function H() {
	typeof window < "u" && window.removeEventListener(s.SELECTION_CHANGED, B), k = !1, N();
}
var U = !1, W = null, G = null, K = "";
function q() {
	S?.isVisible && S.refreshSidebar?.();
}
function ue() {
	de();
	let e = typeof window < "u" ? window : globalThis;
	if (typeof e.requestAnimationFrame == "function") {
		K = "raf", G = e.requestAnimationFrame(() => {
			G = null, K = "", q();
		});
		return;
	}
	K = "timeout", G = e.setTimeout(() => {
		G = null, K = "", q();
	}, 16);
}
function de() {
	if (G == null) return;
	let e = typeof window < "u" ? window : globalThis;
	try {
		K === "raf" && typeof e.cancelAnimationFrame == "function" ? e.cancelAnimationFrame(G) : typeof e.clearTimeout == "function" && e.clearTimeout(G);
	} catch (e) {
		console.debug?.(e);
	}
	G = null, K = "";
}
function J() {
	if (!U) try {
		W = c(ue, { includePointerFallback: !0 }), U = typeof W == "function";
	} catch (e) {
		console.debug?.("[MFV] _bindNodeSelectionListener error", e);
	}
}
function fe() {
	if (U) {
		de();
		try {
			W?.();
		} catch (e) {
			console.debug?.("[MFV] _unbindNodeSelectionListener error", e);
		}
		W = null, U = !1;
	}
}
var Y = {
	isGraphModeVisible() {
		return !!(S?.isVisible && S?._mode === x.GRAPH);
	},
	async openAssets({ assets: e = [], asset: t = null, index: n = 0, mode: r = "" } = {}) {
		let i = Array.isArray(e) ? e.filter(Boolean) : t ? [t] : [];
		if (!i.length) return !1;
		let a = await M(), o = !!a.isVisible, s = Math.max(0, Math.min(Number(n) || 0, i.length - 1)), c = ae(r);
		c && a.setMode(c), a.show(), I(a), V(), J();
		let l = a._mode;
		return l === x.GRID && i.length >= 3 ? a.loadMediaQuad(i[0], i[1], i[2], i[3] || null) : (l === x.AB || l === x.SIDE) && i.length >= 2 ? a.loadMediaPair(i[0], i[1]) : a.loadMediaA(i[s], { autoMode: !1 }), o || F(!0), !0;
	},
	async open() {
		let e = await M();
		e.show(), I(e), V(), J(), U || requestAnimationFrame(() => J()), z(), D && L(e), F(!0);
	},
	close() {
		if (S) try {
			S.isPopped && S.popIn(), S.hide();
		} catch (e) {
			console.debug?.(e);
		}
		H(), S?.setNodeStreamSelection?.(null), fe(), F(!1);
	},
	async toggle() {
		S?.isVisible ? Y.close() : await Y.open();
	},
	toggleLive() {
		Y.setLiveActive(!T);
	},
	togglePreview() {
		Y.setPreviewActive(!E);
	},
	async toggleCompareAB() {
		let e = await M();
		if (!e.isVisible) {
			e.setMode(x.AB), e.show(), I(e), V(), z(), F(!0);
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
		(n || o.MFV_LIVE_AUTO_OPEN !== !1) && (t.show(), I(t), V(), ce(t, e), n || F(!0));
	},
	setLiveActive(e) {
		T = !!e, S?.setLiveActive(T);
	},
	getLiveActive() {
		return T;
	},
	async popOut() {
		let e = await M();
		e.isPopped ? e.popIn() : (e.isVisible || await Y.open(), e.popOut());
	},
	setPreviewActive(e) {
		E = !!e, S?.setPreviewActive(E);
	},
	getPreviewActive() {
		return E;
	},
	canAcceptPreviewBlob() {
		return E ? S?.isVisible ? !0 : o.MFV_PREVIEW_AUTO_OPEN !== !1 : !1;
	},
	async feedPreviewBlob(e, t = {}) {
		if (!Y.canAcceptPreviewBlob()) return;
		let n = await M(), r = !!n.isVisible;
		(r || o.MFV_PREVIEW_AUTO_OPEN !== !1) && (n.isVisible || n.show(), I(n), n.loadPreviewBlob(e, ...Object.keys(t).length ? [t] : []), r || F(!0));
	},
	toggleNodeStream() {
		Y.setNodeStreamActive(!D);
	},
	setNodeStreamActive(e) {
		D = !!e, D || (O = null), ie().then(() => {
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
		(n || o.MFV_NODE_STREAM_AUTO_OPEN !== !1) && (t.isVisible || (t.show(), V()), I(t), L(t), ce(t, e), n || F(!0));
	}
}, X = !1, pe = () => Y.open(), me = () => Y.close(), he = () => Y.toggle(), Z = () => Y.toggleLive(), ge = () => Y.togglePreview(), _e = () => Y.toggleNodeStream(), ve = () => Y.popOut(), ye = () => {
	try {
		S?.isPopped && S.popIn();
	} catch {}
}, be = (e) => {
	let t = String(e?.detail?.key || "");
	(!t || t === "viewer" || t === "viewer.mfvLiveDefault" || t === "viewer.mfvPreviewDefault") && oe();
};
function xe(e) {
	let t = String(e?.key || "");
	return t === " " || t === "Spacebar" || t === "ArrowLeft" || t === "ArrowRight";
}
function Se(e) {
	if (!S?.isVisible || !xe(e)) return !1;
	try {
		let t = e?.target, n = S?.element || null, r = !!n?.contains?.(t), i = (t?.closest?.(".mjr-mfv-simple-player") || (r || t == null ? n?.querySelector?.(".mjr-mfv-simple-player") : null))?._mjrSimplePlayerHandleKeydown;
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
var Q = (e) => {
	if (!S?.isVisible || i() || r().scope === "viewer") return;
	let t = e?.key?.toLowerCase?.() || "", n = e?.target?.isContentEditable || e?.target?.closest?.("input, textarea, select, [contenteditable='true']");
	if (n && Se(e) || n || Se(e)) return;
	let a = () => {
		e.preventDefault?.(), e.stopPropagation?.(), e.stopImmediatePropagation?.();
	};
	if (!e?.ctrlKey && !e?.metaKey && !e?.altKey && !e?.shiftKey) {
		if (t === "v") {
			a(), Y.toggle();
			return;
		}
		if (t === "k") {
			a(), Y.togglePreview();
			return;
		}
		if (t === "l") {
			a(), Y.toggleLive();
			return;
		}
		if (t === "n") {
			a(), Y.toggleNodeStream();
			return;
		}
		t === "c" && (a(), Y.toggleCompareAB());
		return;
	}
};
function $() {
	X || typeof window < "u" && window?.addEventListener && (window.addEventListener(s.MFV_OPEN, pe), window.addEventListener(s.MFV_CLOSE, me), window.addEventListener(s.MFV_TOGGLE, he), window.addEventListener(s.MFV_LIVE_TOGGLE, Z), window.addEventListener(s.MFV_PREVIEW_TOGGLE, ge), window.addEventListener(s.MFV_NODESTREAM_TOGGLE, _e), window.addEventListener(s.MFV_POPOUT, ve), window.addEventListener(s.SETTINGS_CHANGED, be), window.addEventListener("keydown", Q, !0), window.addEventListener("beforeunload", ye), X = !0);
}
function Ce() {
	if (typeof window > "u" || !window?.removeEventListener) {
		X = !1;
		return;
	}
	window.removeEventListener(s.MFV_OPEN, pe), window.removeEventListener(s.MFV_CLOSE, me), window.removeEventListener(s.MFV_TOGGLE, he), window.removeEventListener(s.MFV_LIVE_TOGGLE, Z), window.removeEventListener(s.MFV_PREVIEW_TOGGLE, ge), window.removeEventListener(s.MFV_NODESTREAM_TOGGLE, _e), window.removeEventListener(s.MFV_POPOUT, ve), window.removeEventListener(s.SETTINGS_CHANGED, be), window.removeEventListener("keydown", Q, !0), window.removeEventListener("beforeunload", ye), X = !1;
}
function we({ reinstallGlobalHandlers: e = !1 } = {}) {
	let t = !!S?.isVisible;
	try {
		S?.isPopped && S.popIn();
	} catch (e) {
		console.debug?.(e);
	}
	Ce(), H(), fe(), N(), j += 1, T = C(), E = w(), D = !1;
	try {
		b && b(!1);
	} catch (e) {
		console.debug?.(e);
	}
	se(), t && F(!1), e && $();
}
//#endregion
export { h as a, p as c, we as i, m as l, te as n, g as o, $ as r, _ as s, Y as t, f as u };
