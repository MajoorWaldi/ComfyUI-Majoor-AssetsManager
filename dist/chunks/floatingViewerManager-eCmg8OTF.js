import { t as e } from "./rolldown-runtime-Dy4uBu1J.js";
import { d as t, g as n, o as r, s as i, t as a } from "./viewerRuntimeHosts-C-9ryYS-.js";
import { R as o, a as s, r as c } from "./events-iWiZ-Zty.js";
//#region ui/features/panel/panelRuntimeRefs.ts
var l = null;
function u(e) {
	return e ? typeof e?.isConnected == "boolean" ? e.isConnected : !0 : !1;
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
function ee(e = null) {
	(!e || l === e) && (l = null);
}
function p() {
	return u(l) ? l : (l = null, d());
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
	let i = new Set(Array.from(t || []).map(String).filter(Boolean)), a = h(e, i, n);
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
//#region ui/features/viewer/floatingViewerManager.ts
var re = /* @__PURE__ */ e({
	floatingViewerManager: () => J,
	installFloatingViewerGlobalHandlers: () => Q,
	removeFloatingViewerGlobalHandlers: () => we,
	teardownFloatingViewerManager: () => $
}), g = null, ie = null;
async function ae() {
	return g || (ie ||= import("./FloatingViewer-DYanyWcs.js").then((e) => (g = e.FloatingViewer, g)), ie);
}
var _ = null, oe = null;
async function se() {
	if (!_) return oe ||= import("./NodeStreamController-EQygLyLg.js").then((e) => {
		_ = e.setNodeStreamActive;
	}), oe;
}
var v = Object.freeze({
	SIMPLE: "simple",
	AB: "ab",
	SIDE: "side",
	GRID: "grid",
	GRAPH: "graph"
});
function ce(e) {
	let t = String(e || "").trim().toLowerCase();
	return t === "sidebyside" ? v.SIDE : Object.values(v).includes(t) ? t : "";
}
var y = null;
function b() {
	return s.MFV_LIVE_DEFAULT !== !1;
}
function x() {
	return s.MFV_PREVIEW_DEFAULT !== !1;
}
var S = b(), C = x(), w = !1, T = null, E = !1, D = null, O = 0;
function le() {
	S = b(), C = x(), y?.setLiveActive(S), y?.setPreviewActive(C);
}
async function k() {
	if (!y) {
		let e = await ae();
		y || (y = new e({ controller: {
			close: () => J.close(),
			toggle: () => J.toggle(),
			toggleLive: () => J.toggleLive(),
			togglePreview: () => J.togglePreview(),
			toggleNodeStream: () => J.toggleNodeStream(),
			popOut: () => J.popOut(),
			onModeChanged: (e) => {
				y?.isVisible && e !== v.SIMPLE && I();
			},
			handleForwardedKeydown: (e) => Z(e)
		} }), a(y.render()));
	}
	try {
		let e = y?.element || null;
		e?.isConnected === !1 && a(e);
	} catch (e) {
		console.debug?.(e);
	}
	return y;
}
function A() {
	try {
		D?.abort();
	} catch (e) {
		console.debug?.(e);
	}
	D = null;
}
function j() {
	try {
		let e = window.__MJR_LAST_SELECTION_GRID__;
		if (e?.isConnected) return e;
	} catch (e) {
		console.debug?.(e);
	}
	return p();
}
function ue() {
	if (y) {
		try {
			y.dispose?.();
		} catch (e) {
			console.debug?.(e);
		}
		y = null;
	}
}
function M(e) {
	typeof window > "u" || window.dispatchEvent(new CustomEvent(c.MFV_VISIBILITY_CHANGED, { detail: { visible: !!e } }));
}
function N(e) {
	e && (e.setLiveActive(S), e.setPreviewActive(C), e.setNodeStreamActive?.(w));
}
function P(e) {
	e?.setNodeStreamSelection && e.setNodeStreamSelection(T || null);
}
function de(e, t) {
	if (!e) return;
	let n = e._mode;
	if (!(n === v.AB || n === v.SIDE || n === v.GRID)) {
		e.loadMediaA(t, { autoMode: !0 });
		return;
	}
	let r = e.getPinnedSlots();
	if (n === v.GRID) {
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
function fe(e) {
	try {
		let t = j();
		if (!t) return null;
		let n = Array.from(t.querySelectorAll("[data-mjr-asset-id]")), r = n.findIndex((t) => t.dataset.mjrAssetId === String(e));
		if (r < 0) return null;
		let i = (n[r + 1] ?? n[r - 1] ?? null)?.dataset?.mjrAssetId ?? null;
		return i && i !== String(e) ? i : null;
	} catch (e) {
		return console.debug?.("[MFV] _findAdjacentGridId error", e), null;
	}
}
async function F(e) {
	if (!e.length || !y) return;
	A();
	let r = ++O, i = typeof AbortController < "u" ? new AbortController() : null;
	D = i;
	try {
		let t = y.getPinnedSlots(), a = t.size > 0, o = y._mode, s = o === v.GRID, c = o === v.AB || o === v.SIDE, l = s ? 4 : 2, u = e.slice(0, l);
		if (a && (c || s)) {
			let e = l - t.size;
			u = u.slice(0, Math.max(1, e));
		} else if (u.length === 1 && c) {
			let e = fe(u[0]);
			e && (u = [u[0], e]);
		}
		let d = await n(u, i ? { signal: i.signal } : {});
		if (i?.signal.aborted || O !== r || !d?.ok || !Array.isArray(d.data) || !d.data.length || !y) return;
		let f = d.data;
		if (s) {
			if (a) {
				let e = {
					A: y._mediaA,
					B: y._mediaB,
					C: y._mediaC,
					D: y._mediaD
				}, n = [
					"A",
					"B",
					"C",
					"D"
				].filter((e) => !t.has(e)), r = 0;
				for (let t of n) r < f.length && (e[t] = f[r++]);
				y.loadMediaQuad(e.A, e.B, e.C, e.D);
			} else f.length >= 3 ? y.loadMediaQuad(f[0], f[1], f[2], f[3] || null) : f.length >= 2 ? y.loadMediaPair(f[0], f[1]) : y.loadMediaA(f[0], { autoMode: !0 });
			return;
		}
		if (t.has("A") && t.has("B") && y._mediaA && y._mediaB) return;
		t.has("A") && y._mediaA ? y.loadMediaPair(y._mediaA, f[0]) : t.has("B") && y._mediaB ? y.loadMediaPair(f[0], y._mediaB) : u.length >= 2 && f.length >= 2 ? y.loadMediaPair(f[0], f[1]) : y.loadMediaA(f[0], { autoMode: !0 });
	} catch (e) {
		e?.name !== "AbortError" && t(e, "floatingViewerManager._loadFromIds");
	} finally {
		D === i && (D = null);
	}
}
function I() {
	try {
		let e = j();
		if (!e) return;
		let t = m(e);
		if (!t.size) return;
		F(Array.from(t));
	} catch (e) {
		console.debug?.("[MFV] Error reading current grid selection", e);
	}
}
function L(e) {
	if (!y?.isVisible || y._mode === v.GRAPH) return;
	let t = Array.isArray(e?.detail?.selectedAssets) ? e.detail.selectedAssets : [], n = new Set(t.filter((e) => String(e?.kind || "").toLowerCase() === "folder").map((e) => String(e?.id || "")).filter(Boolean)), r = Array.isArray(e?.detail?.selectedIds) ? e.detail.selectedIds.map(String).filter((e) => !!e && !n.has(e)) : [];
	if (r.length) {
		F(r);
		return;
	}
	try {
		let e = j();
		if (!e) return;
		let t = Array.from(m(e)).map(String).filter(Boolean);
		if (!t.length) return;
		F(t);
	} catch (e) {
		console.debug?.("[MFV] selection fallback failed", e);
	}
}
function R() {
	E || typeof window > "u" || (window.addEventListener(c.SELECTION_CHANGED, L), E = !0);
}
function z() {
	typeof window < "u" && window.removeEventListener(c.SELECTION_CHANGED, L), E = !1, A();
}
var B = !1, V = null, H = null, U = "";
function W() {
	y?.isVisible && y.refreshSidebar?.();
}
function pe() {
	G();
	let e = typeof window < "u" ? window : globalThis;
	if (typeof e.requestAnimationFrame == "function") {
		U = "raf", H = e.requestAnimationFrame(() => {
			H = null, U = "", W();
		});
		return;
	}
	U = "timeout", H = e.setTimeout(() => {
		H = null, U = "", W();
	}, 16);
}
function G() {
	if (H == null) return;
	let e = typeof window < "u" ? window : globalThis;
	try {
		U === "raf" && typeof e.cancelAnimationFrame == "function" ? e.cancelAnimationFrame(H) : typeof e.clearTimeout == "function" && e.clearTimeout(H);
	} catch (e) {
		console.debug?.(e);
	}
	H = null, U = "";
}
function K() {
	if (!B) try {
		V = o(pe, { includePointerFallback: !0 }), B = typeof V == "function";
	} catch (e) {
		console.debug?.("[MFV] _bindNodeSelectionListener error", e);
	}
}
function q() {
	if (B) {
		G();
		try {
			V?.();
		} catch (e) {
			console.debug?.("[MFV] _unbindNodeSelectionListener error", e);
		}
		V = null, B = !1;
	}
}
var J = {
	isGraphModeVisible() {
		return !!(y?.isVisible && y?._mode === v.GRAPH);
	},
	async openAssets({ assets: e = [], asset: t = null, index: n = 0, mode: r = "" } = {}) {
		let i = Array.isArray(e) ? e.filter(Boolean) : t ? [t] : [];
		if (!i.length) return !1;
		let a = await k(), o = !!a.isVisible, s = Math.max(0, Math.min(Number(n) || 0, i.length - 1)), c = ce(r);
		c && a.setMode(c), a.show(), N(a), R(), K();
		let l = a._mode;
		return l === v.GRID && i.length >= 3 ? a.loadMediaQuad(i[0], i[1], i[2], i[3] || null) : (l === v.AB || l === v.SIDE) && i.length >= 2 ? a.loadMediaPair(i[0], i[1]) : a.loadMediaA(i[s], { autoMode: !1 }), o || M(!0), !0;
	},
	async open() {
		let e = await k();
		e.show(), N(e), R(), K(), B || requestAnimationFrame(() => K()), I(), w && P(e), M(!0);
	},
	close() {
		if (y) try {
			y.isPopped && y.popIn(), y.hide();
		} catch (e) {
			console.debug?.(e);
		}
		z(), y?.setNodeStreamSelection?.(null), q(), M(!1);
	},
	async toggle() {
		y?.isVisible ? J.close() : await J.open();
	},
	toggleLive() {
		J.setLiveActive(!S);
	},
	togglePreview() {
		J.setPreviewActive(!C);
	},
	async toggleCompareAB() {
		let e = await k();
		if (!e.isVisible) {
			e.setMode(v.AB), e.show(), N(e), R(), I(), M(!0);
			return;
		}
		let t = {
			[v.AB]: v.SIDE,
			[v.SIDE]: v.SIMPLE,
			[v.GRID]: v.SIMPLE,
			[v.SIMPLE]: v.AB
		}[e._mode] || v.AB;
		e.setMode(t), t !== v.SIMPLE && I();
	},
	async upsertWithContent(e) {
		let t = await k(), n = !!t.isVisible;
		!n && s.MFV_LIVE_AUTO_OPEN === !1 || (t.show(), N(t), R(), de(t, e), n || M(!0));
	},
	setLiveActive(e) {
		S = !!e, y?.setLiveActive(S);
	},
	getLiveActive() {
		return S;
	},
	async popOut() {
		let e = await k();
		e.isPopped ? e.popIn() : (e.isVisible || await J.open(), e.popOut());
	},
	setPreviewActive(e) {
		C = !!e, y?.setPreviewActive(C);
	},
	getPreviewActive() {
		return C;
	},
	async feedPreviewBlob(e, t = {}) {
		if (!C) return;
		let n = await k(), r = !!n.isVisible;
		!r && s.MFV_PREVIEW_AUTO_OPEN === !1 || (n.isVisible || n.show(), N(n), n.loadPreviewBlob(e, ...Object.keys(t).length ? [t] : []), r || M(!0));
	},
	toggleNodeStream() {
		J.setNodeStreamActive(!w);
	},
	setNodeStreamActive(e) {
		w = !!e, w || (T = null), se().then(() => {
			_ && _(w);
		}), y?.setNodeStreamActive?.(w), w ? y && P(y) : y?.setNodeStreamSelection?.(null);
	},
	getNodeStreamActive() {
		return w;
	},
	setNodeStreamSelection(e, t, n) {
		T = e == null || e === "" ? null : {
			nodeId: e,
			classType: t,
			title: n
		};
		let r = y;
		r && P(r);
	},
	async feedNodeStream(e) {
		if (!w) return;
		let t = await k(), n = !!t.isVisible;
		!n && s.MFV_NODE_STREAM_AUTO_OPEN === !1 || (t.isVisible || (t.show(), R()), N(t), P(t), de(t, e), n || M(!0));
	}
}, Y = !1, me = () => J.open(), he = () => J.close(), ge = () => J.toggle(), X = () => J.toggleLive(), _e = () => J.togglePreview(), ve = () => J.toggleNodeStream(), ye = () => J.popOut(), be = () => {
	try {
		y?.isPopped && y.popIn();
	} catch {}
}, xe = (e) => {
	let t = String(e?.detail?.key || "");
	(!t || t === "viewer" || t === "viewer.mfvLiveDefault" || t === "viewer.mfvPreviewDefault") && le();
};
function Se(e) {
	let t = String(e?.key || "");
	return t === " " || t === "Spacebar" || t === "ArrowLeft" || t === "ArrowRight";
}
function Ce(e) {
	if (!y?.isVisible || !Se(e)) return !1;
	try {
		let t = e?.target, n = t?.closest?.(".mjr-mfv-simple-player") || null, r = y?.element || null, i = !!r?.contains?.(t), a = (n || (i || t == null ? r?.querySelector?.(".mjr-mfv-simple-player") : null))?._mjrSimplePlayerHandleKeydown;
		return typeof a == "function" ? (a(e), !!e?.defaultPrevented) : !1;
	} catch (e) {
		return console.debug?.(e), !1;
	}
}
var Z = (e) => {
	if (!y?.isVisible || i() || r().scope === "viewer") return;
	let t = e?.key?.toLowerCase?.() || "", n = e?.target?.isContentEditable || e?.target?.closest?.("input, textarea, select, [contenteditable='true']");
	if (n && Ce(e) || n || Ce(e)) return;
	let a = () => {
		e.preventDefault?.(), e.stopPropagation?.(), e.stopImmediatePropagation?.();
	};
	if (!e?.ctrlKey && !e?.metaKey && !e?.altKey && !e?.shiftKey) {
		if (t === "v") {
			a(), J.toggle();
			return;
		}
		if (t === "k") {
			a(), J.togglePreview();
			return;
		}
		if (t === "l") {
			a(), J.toggleLive();
			return;
		}
		if (t === "n") {
			a(), J.toggleNodeStream();
			return;
		}
		t === "c" && (a(), J.toggleCompareAB());
		return;
	}
};
function Q() {
	Y || typeof window > "u" || !window?.addEventListener || (window.addEventListener(c.MFV_OPEN, me), window.addEventListener(c.MFV_CLOSE, he), window.addEventListener(c.MFV_TOGGLE, ge), window.addEventListener(c.MFV_LIVE_TOGGLE, X), window.addEventListener(c.MFV_PREVIEW_TOGGLE, _e), window.addEventListener(c.MFV_NODESTREAM_TOGGLE, ve), window.addEventListener(c.MFV_POPOUT, ye), window.addEventListener(c.SETTINGS_CHANGED, xe), window.addEventListener("keydown", Z, !0), window.addEventListener("beforeunload", be), Y = !0);
}
function we() {
	if (typeof window > "u" || !window?.removeEventListener) {
		Y = !1;
		return;
	}
	window.removeEventListener(c.MFV_OPEN, me), window.removeEventListener(c.MFV_CLOSE, he), window.removeEventListener(c.MFV_TOGGLE, ge), window.removeEventListener(c.MFV_LIVE_TOGGLE, X), window.removeEventListener(c.MFV_PREVIEW_TOGGLE, _e), window.removeEventListener(c.MFV_NODESTREAM_TOGGLE, ve), window.removeEventListener(c.MFV_POPOUT, ye), window.removeEventListener(c.SETTINGS_CHANGED, xe), window.removeEventListener("keydown", Z, !0), window.removeEventListener("beforeunload", be), Y = !1;
}
function $({ reinstallGlobalHandlers: e = !1 } = {}) {
	let t = !!y?.isVisible;
	try {
		y?.isPopped && y.popIn();
	} catch (e) {
		console.debug?.(e);
	}
	we(), z(), q(), A(), O += 1, S = b(), C = x(), w = !1;
	try {
		_ && _(!1);
	} catch (e) {
		console.debug?.(e);
	}
	ue(), t && M(!1), e && Q();
}
//#endregion
export { m as a, ee as c, $ as i, p as l, re as n, h as o, Q as r, ne as s, J as t, f as u };
