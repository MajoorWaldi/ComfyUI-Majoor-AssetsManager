import { $t as e, P as t, a as n, g as r, i, x as a, y as o } from "./viewerRuntimeHosts-CW2DfHq_.js";
import { at as s, m as c, mt as l, r as u, t as d } from "./events-cBMXVULQ.js";
import { c as f, d as p, f as m, l as h, o as g, r as _, s as v, u as y } from "./viewerOpenRequest-_DqD1rXA.js";
import { i as b, n as x, t as S, tt as C } from "./SidebarWorkflowSection-F3hoMYG1.js";
import { i as w, r as T } from "./floatingViewerManager-CKeu6wKp.js";
import { A as E, B as D, C as O, D as k, E as A, H as j, K as ee, N as M, O as N, R as te, S as ne, T as P, V as F, W as I, X as L, Y as R, b as z, dt as B, ft as V, it as H, j as U, k as W, ot as re, pt as G, q as K, rt as ie, ut as q, w as ae, z as oe } from "./mjr-primevue-3mpaVb1C.js";
import { n as se, t as ce } from "./TagsEditor-qDIeaA8P.js";
import { a as J, i as le, n as ue, r as de, t as fe } from "./StudioPlayer-DXSy5UA5.js";
import { t as pe } from "./genInfo-B3LeL9TU.js";
// ui/vue/components/viewer/FloatingViewerHost.vue
var me = /* @__PURE__ */ M({
	__name: "FloatingViewerHost",
	setup(e) {
		let t = H(null), n = null;
		return D(() => {
			n = i(t.value);
		}), F(() => {
			n?.(), n = null;
		}), (e, n) => (j(), W("div", {
			ref_key: "hostRef",
			ref: t,
			class: "mjr-viewer-runtime-host mjr-viewer-runtime-host--floating",
			style: {
				position: "fixed",
				inset: "0",
				"pointer-events": "none",
				overflow: "visible"
			}
		}, null, 512));
	}
}), he = /* @__PURE__ */ M({
	__name: "ViewerOverlayHost",
	setup(e) {
		let t = H(null), r = null;
		return D(() => {
			r = n(t.value);
		}), F(() => {
			r?.(), r = null;
		}), (e, n) => (j(), W("div", {
			ref_key: "hostRef",
			ref: t,
			class: "mjr-viewer-runtime-host mjr-viewer-runtime-host--main",
			style: {
				position: "fixed",
				inset: "0",
				"pointer-events": "none",
				overflow: "visible"
			}
		}, null, 512));
	}
}), ge = {
	key: 0,
	class: "mjr-context-menu-separator"
}, _e = { class: "mjr-context-menu-item-left" }, ve = { class: "mjr-context-menu-item-right" }, ye = {
	key: 0,
	class: "mjr-context-menu-hint"
}, Y = {
	key: 1,
	class: "mjr-context-menu-submenu-arrow"
}, be = {
	key: 0,
	class: "mjr-context-menu-separator"
}, xe = { class: "mjr-context-menu-item-left" }, Se = {
	key: 0,
	class: "mjr-context-menu-hint"
}, Ce = /* @__PURE__ */ M({
	__name: "ViewerContextMenu",
	setup(e) {
		let t = H(null), n = H(null), r = H(null), i = null, a = null, o = P(() => l(m.main, 10041)), s = P(() => l(m.submenu, 10042)), c = P(() => l(m.tags, 10043));
		function l(e, t) {
			return {
				position: "fixed",
				left: `${Math.round(Number(e?.x) || 0)}px`,
				top: `${Math.round(Number(e?.y) || 0)}px`,
				display: "block",
				zIndex: String(t)
			};
		}
		function u() {
			i &&= (clearTimeout(i), null);
		}
		function d() {
			u(), i = setTimeout(() => {
				f();
			}, 180);
		}
		function p(e, t) {
			if (!e?.open || !t) return;
			let n = t.getBoundingClientRect(), r = Number(window.innerWidth || 0), i = Number(window.innerHeight || 0), a = Number(e.x) || 0, o = Number(e.y) || 0;
			a + n.width > r && (a = Math.max(8, r - n.width - 10)), o + n.height > i && (o = Math.max(8, i - n.height - 10)), a < 8 && (a = 8), o < 8 && (o = 8), e.x = a, e.y = o;
		}
		async function h(e, t) {
			await te(), p(e, t?.value || null);
		}
		function g(e) {
			try {
				e?.value?.querySelector?.(".mjr-context-menu-item:not([aria-disabled=\"true\"])")?.focus?.();
			} catch (e) {
				console.debug?.(e);
			}
		}
		function _(e, t) {
			if (!Array.isArray(e?.submenu) || !e.submenu.length) {
				f();
				return;
			}
			u();
			let n = (t?.currentTarget)?.getBoundingClientRect?.();
			y({
				x: Math.round((n?.right || m.main.x || 0) + 6),
				y: Math.round((n?.top || m.main.y || 0) - 4),
				items: e.submenu,
				title: e.label || ""
			});
		}
		async function b(e, t, n = "main") {
			if (e && e.type === "item" && !e.disabled) {
				if (Array.isArray(e.submenu) && e.submenu.length) _(e, t);
				else try {
					await e.action?.();
				} catch (e) {
					console.error("[ViewerContextMenu.vue] Action failed:", e);
				} finally {
					e.closeOnSelect === !1 ? n === "submenu" && f() : v();
				}
			}
		}
		function x(e, t) {
			Array.isArray(e?.submenu) && e.submenu.length ? _(e, t) : f();
		}
		function S(e) {
			Array.isArray(e?.submenu) && e.submenu.length && d();
		}
		function C() {
			u();
		}
		function w() {
			d();
		}
		function T(e) {
			let i = e?.target;
			t.value?.contains?.(i) || n.value?.contains?.(i) || r.value?.contains?.(i) || v();
		}
		function E(e) {
			e?.key === "Escape" && v();
		}
		function M() {
			v();
		}
		function ne(e) {
			let t = e?.detail;
			String(t?.source || "") !== "viewer" && v();
		}
		function L(e) {
			let t = m.tags.asset;
			t && (t.tags = Array.isArray(e) ? [...e] : []);
		}
		function z(e) {
			let t = Array.isArray(e?.tags) ? e.tags : [];
			try {
				m.tags.onChanged?.(t);
			} catch (e) {
				console.debug?.(e);
			}
		}
		return K(() => m.main.open, async (e) => {
			e && (await h(m.main, t), g(t));
		}), K(() => m.submenu.open, async (e) => {
			e && (await h(m.submenu, n), g(n));
		}), K(() => m.tags.open, async (e) => {
			e && await h(m.tags, r);
		}), D(() => {
			a = new AbortController();
			let e = {
				capture: !0,
				passive: !0,
				signal: a.signal
			};
			window.addEventListener("pointerdown", T, e), window.addEventListener("keydown", E, {
				capture: !0,
				signal: a.signal
			}), window.addEventListener("scroll", M, e), window.addEventListener("wheel", M, e), window.addEventListener("resize", M, {
				passive: !0,
				signal: a.signal
			}), window.addEventListener("mjr-close-all-menus", ne, { signal: a.signal });
		}), F(() => {
			u();
			try {
				a?.abort();
			} catch (e) {
				console.debug?.(e);
			}
			a = null, v();
		}), (e, i) => {
			let a = ee("MButton");
			return j(), k(ae, { to: "body" }, [
				q(m).main.open ? (j(), W("div", {
					key: 0,
					ref_key: "mainMenuRef",
					ref: t,
					class: "mjr-viewer-context-menu mjr-context-menu",
					style: V(o.value),
					role: "menu",
					"aria-label": "Viewer context menu"
				}, [(j(!0), W(O, null, I(q(m).main.items, (e) => (j(), W(O, { key: e.id }, [e.type === "separator" ? (j(), W("div", ge)) : (j(), k(a, {
					key: 1,
					type: "button",
					class: B(["mjr-context-menu-item", {
						"is-disabled": e.disabled,
						"has-submenu": Array.isArray(e.submenu) && e.submenu.length
					}]),
					severity: "secondary",
					text: "",
					role: "menuitem",
					"aria-disabled": e.disabled ? "true" : "false",
					tabindex: e.disabled ? -1 : 0,
					onClick: (t) => b(e, t),
					onMouseenter: (t) => x(e, t),
					onMouseleave: (t) => S(e)
				}, {
					default: R(() => [A("span", _e, [e.iconClass ? (j(), W("i", {
						key: 0,
						class: B(e.iconClass)
					}, null, 2)) : N("", !0), A("span", null, G(e.label), 1)]), A("span", ve, [e.rightHint ? (j(), W("span", ye, G(e.rightHint), 1)) : N("", !0), Array.isArray(e.submenu) && e.submenu.length ? (j(), W("span", Y, " > ")) : N("", !0)])]),
					_: 2
				}, 1032, [
					"class",
					"aria-disabled",
					"tabindex",
					"onClick",
					"onMouseenter",
					"onMouseleave"
				]))], 64))), 128))], 4)) : N("", !0),
				q(m).submenu.open ? (j(), W("div", {
					key: 1,
					ref_key: "submenuRef",
					ref: n,
					class: "mjr-viewer-rating-submenu mjr-context-menu",
					style: V(s.value),
					role: "menu",
					"aria-label": "Viewer context submenu",
					onMouseenter: C,
					onMouseleave: w
				}, [(j(!0), W(O, null, I(q(m).submenu.items, (e) => (j(), W(O, { key: e.id }, [e.type === "separator" ? (j(), W("div", be)) : (j(), k(a, {
					key: 1,
					type: "button",
					class: B(["mjr-context-menu-item", { "is-disabled": e.disabled }]),
					severity: "secondary",
					text: "",
					role: "menuitem",
					"aria-disabled": e.disabled ? "true" : "false",
					tabindex: e.disabled ? -1 : 0,
					onClick: (t) => b(e, t, "submenu")
				}, {
					default: R(() => [A("span", xe, [e.iconClass ? (j(), W("i", {
						key: 0,
						class: B(e.iconClass)
					}, null, 2)) : N("", !0), A("span", null, G(e.label), 1)]), e.rightHint ? (j(), W("span", Se, G(e.rightHint), 1)) : N("", !0)]),
					_: 2
				}, 1032, [
					"class",
					"aria-disabled",
					"tabindex",
					"onClick"
				]))], 64))), 128))], 36)) : N("", !0),
				q(m).tags.open && q(m).tags.asset ? (j(), W("div", {
					key: 2,
					ref_key: "tagsPopoverRef",
					ref: r,
					class: "mjr-viewer-popover",
					style: V(c.value)
				}, [U(ce, {
					asset: q(m).tags.asset,
					"model-value": q(m).tags.asset?.tags || [],
					"onUpdate:modelValue": L,
					onTagsChange: z
				}, null, 8, ["asset", "model-value"])], 4)) : N("", !0)
			]);
		};
	}
}), X = /* @__PURE__ */ M({
	__name: "ViewerContextMenuPortal",
	setup(e) {
		let t = H(""), n = P(() => h(t.value));
		return D(() => {
			t.value = g();
		}), F(() => {
			p(t.value), t.value = "";
		}), (e, t) => n.value ? (j(), k(Ce, { key: 0 })) : N("", !0);
	}
}), Z = ie({
	open: !1,
	assets: [],
	index: 0,
	session: 0
});
function we(e, t = 0) {
	let n = (Array.isArray(e) ? e : []).filter(Boolean);
	return n.length ? (Z.assets = n, Z.index = Math.max(0, Math.min(Number(t) || 0, n.length - 1)), Z.session += 1, Z.open = !0, !0) : !1;
}
function Te() {
	Z.open = !1;
}
function Q(e) {
	let t = Z.assets.length;
	t && (Z.index = (Math.floor(e) % t + t) % t);
}
function $(e) {
	Q(Z.index + e);
}
function Ee(e, t, n = "") {
	let r = String(n || "").trim().toLowerCase();
	if (r === "ab" || r === "sidebyside") return !1;
	try {
		if (C()?.viewer?.classic === !0) return !1;
	} catch (e) {
		console.debug?.(e);
	}
	let i = Array.isArray(e) ? e : [], a = i[Math.max(0, Math.min(Number(t) || 0, i.length - 1))];
	return !!a && J(a) !== "model3d";
}
// ui/vue/components/viewer/studio/StudioImageStage.vue?vue&type=script&setup=true&lang.ts
var De = ["src", "alt"], Oe = {
	key: 0,
	class: "mjr-studio-stage__error"
}, ke = .05, Ae = 32, je = /* @__PURE__ */ M({
	__name: "StudioImageStage",
	props: {
		src: {},
		alt: {},
		checker: { type: Boolean }
	},
	emits: ["zoom", "loaded"],
	setup(e, { expose: t, emit: n }) {
		let r = e, i = n, a = H(null), o = H({
			w: 0,
			h: 0
		}), s = H(1), c = H({
			x: 0,
			y: 0
		}), l = H(!0), u = H(!1), d = H(!1), f = null, p = null;
		function m() {
			let e = a.value?.getBoundingClientRect();
			return {
				w: e?.width || 0,
				h: e?.height || 0
			};
		}
		function h() {
			let { w: e, h: t } = m();
			return !o.value.w || !o.value.h || !e || !t ? 1 : Math.min(e / o.value.w, t / o.value.h);
		}
		function g() {
			l.value = !0, s.value = h(), c.value = {
				x: 0,
				y: 0
			}, i("zoom", s.value);
		}
		function _(e, t) {
			let n = Math.max(ke, Math.min(Ae, e)), { w: r, h: a } = m(), o = t ? t.x - r / 2 : 0, u = t ? t.y - a / 2 : 0, d = n / s.value;
			c.value = {
				x: o - (o - c.value.x) * d,
				y: u - (u - c.value.y) * d
			}, s.value = n, l.value = !1, i("zoom", s.value);
		}
		function v(e) {
			_(s.value * e);
		}
		function y() {
			_(1), c.value = {
				x: 0,
				y: 0
			};
		}
		function b() {
			l.value ? y() : g();
		}
		function x(e) {
			e.preventDefault();
			let t = a.value?.getBoundingClientRect(), n = Math.exp(-e.deltaY * .0015);
			_(s.value * n, t ? {
				x: e.clientX - t.left,
				y: e.clientY - t.top
			} : void 0);
		}
		function S(e) {
			e.button === 0 && (f = {
				x: e.clientX,
				y: e.clientY,
				ox: c.value.x,
				oy: c.value.y,
				id: e.pointerId
			}, d.value = !0, e.currentTarget?.setPointerCapture?.(e.pointerId));
		}
		function C(e) {
			f && (c.value = {
				x: f.ox + e.clientX - f.x,
				y: f.oy + e.clientY - f.y
			}, Math.abs(e.clientX - f.x) + Math.abs(e.clientY - f.y) > 2 && (l.value = !1));
		}
		function w(e) {
			f && e.currentTarget?.releasePointerCapture?.(f.id), f = null, d.value = !1;
		}
		function T(e) {
			let t = e.target;
			o.value = {
				w: t.naturalWidth,
				h: t.naturalHeight
			}, u.value = !1, i("loaded", {
				width: t.naturalWidth,
				height: t.naturalHeight
			}), g();
		}
		let E = P(() => ({
			width: `${o.value.w}px`,
			height: `${o.value.h}px`,
			transform: `translate(-50%, -50%) translate(${c.value.x}px, ${c.value.y}px) scale(${s.value})`,
			imageRendering: s.value >= 2 ? "pixelated" : "auto"
		}));
		return K(() => r.src, () => {
			o.value = {
				w: 0,
				h: 0
			}, u.value = !1;
		}), D(() => {
			try {
				p = new ResizeObserver(() => {
					l.value && g();
				}), a.value && p.observe(a.value);
			} catch (e) {
				console.debug?.(e);
			}
		}), oe(() => p?.disconnect()), t({
			zoomBy: v,
			fit: g,
			actualSize: y,
			toggleFitActual: b
		}), (t, n) => (j(), W("div", {
			ref_key: "stage",
			ref: a,
			class: B(["mjr-studio-stage", {
				"is-checker": e.checker,
				"is-dragging": d.value
			}]),
			onWheel: x,
			onPointerdown: S,
			onPointermove: C,
			onPointerup: w,
			onPointercancel: w,
			onDblclick: b
		}, [L((j(), W("img", {
			key: e.src,
			class: "mjr-studio-stage__img",
			src: e.src,
			alt: e.alt || "",
			draggable: "false",
			style: V(E.value),
			onLoad: T,
			onError: n[0] ||= (e) => u.value = !0
		}, null, 44, De)), [[z, !u.value]]), u.value ? (j(), W("div", Oe, [n[1] ||= A("i", {
			class: "pi pi-image",
			"aria-hidden": "true"
		}, null, -1), A("span", null, G(e.alt), 1)])) : N("", !0)], 34));
	}
}), Me = ["aria-label"], Ne = { class: "mjr-studio__header" }, Pe = { class: "mjr-studio__nav" }, Fe = { class: "mjr-studio__counter" }, Ie = { class: "mjr-studio__title" }, Le = ["title"], Re = { class: "mjr-studio__summary" }, ze = { class: "mjr-studio__actions" }, Be = ["title"], Ve = { class: "mjr-studio__body" }, He = { class: "mjr-studio__stage" }, Ue = {
	key: 2,
	class: "mjr-studio__unsupported"
}, We = { class: "mjr-studio__review" }, Ge = { class: "mjr-studio__review-row" }, Ke = { class: "mjr-studio__label" }, qe = {
	class: "mjr-studio__tabs",
	role: "tablist"
}, Je = { class: "mjr-studio__tab-body" }, Ye = ["aria-label"], Xe = ["src"], Ze = {
	key: 1,
	class: "pi pi-file",
	"aria-hidden": "true"
}, Qe = {
	key: 2,
	class: "pi pi-play mjr-studio__thumb-badge",
	"aria-hidden": "true"
}, $e = /* @__PURE__ */ M({
	__name: "StudioViewer",
	emits: ["open-classic"],
	setup(n, { emit: i }) {
		let u = i, f = H(null), p = H(null), m = H(null), h = H(!0), g = H("generation"), _ = H(!1), v = H(1), y = re(null), C = re(null), w = null, T = P(() => Z.assets[Z.index] ?? null), D = P(() => y.value ?? T.value), M = P(() => J(T.value)), F = P(() => T.value ? s(T.value) : ""), L = P(() => Z.assets.length), z = P(() => ue(D.value)), V = P(() => le(D.value, C.value)), ie = P(() => Number(C.value?.frame_count) || null), me = P(() => Number(D.value?.rating) || 0), he = P(() => Array.isArray(D.value?.tags) ? D.value.tags : []), ge = P(() => {
			let { start: e, end: t } = de(L.value, Z.index);
			return Z.assets.slice(e, t).map((t, n) => ({
				asset: t,
				index: e + n
			}));
		}), _e = P(() => L.value >= 2);
		async function ve(e) {
			if (w?.abort(), y.value = null, C.value = null, !e) return;
			let t = typeof AbortController < "u" ? new AbortController() : null;
			w = t;
			try {
				let n = await pe(e, {
					getAssetMetadata: r,
					getFileMetadataScoped: o,
					signal: t?.signal
				});
				w === t && T.value === e && (y.value = n && typeof n == "object" ? n : e);
			} catch (e) {
				console.debug?.(e);
			}
			let n = J(e);
			if ((n === "video" || n === "audio") && e?.id != null) try {
				let n = await a(e.id, t ? { signal: t.signal } : {});
				w === t && n?.ok && (C.value = n.data || null);
			} catch (e) {
				console.debug?.(e);
			}
		}
		K(T, (e) => void ve(e), { immediate: !0 }), K(() => Z.open, async (e) => {
			e ? (await te(), f.value?.focus?.(), window.addEventListener("keydown", X, !0)) : (window.removeEventListener("keydown", X, !0), m.value?.release?.(), w?.abort(), document.fullscreenElement && f.value?.contains(document.fullscreenElement) && document.exitFullscreen?.());
		}, { immediate: !0 }), oe(() => {
			window.removeEventListener("keydown", X, !0), w?.abort();
		});
		function ye() {
			Te();
		}
		function Y(e = "") {
			let t = {
				assets: Z.assets.slice(),
				index: Z.index,
				mode: e
			};
			Te(), u("open-classic", t);
		}
		function be() {
			document.fullscreenElement ? document.exitFullscreen?.() : f.value?.requestFullscreen?.();
		}
		function xe() {
			if (!F.value) return;
			let e = document.createElement("a");
			e.href = F.value, e.download = String(T.value?.filename || ""), e.click();
		}
		async function Se(n) {
			let r = T.value;
			if (!r) return;
			let i = Math.max(0, Math.min(5, n)), a = await t(r, i);
			a?.ok ? (r.rating = i, y.value = y.value ? {
				...y.value,
				rating: i
			} : r, window.dispatchEvent(new CustomEvent(d, { detail: {
				assetId: r.id == null ? "" : String(r.id),
				rating: i
			} }))) : e(a?.error || c("toast.ratingUpdateFailed", "Rating update failed"), "error");
		}
		function Ce(e) {
			return !!e?.closest?.("input, textarea, select, [contenteditable='true']");
		}
		function X(e) {
			if (!Z.open) return;
			if (Ce(e.target)) {
				e.key === "Escape" && e.target?.blur?.();
				return;
			}
			let t = M.value === "video" || M.value === "audio", n = e.key, r = !0;
			n === "Escape" ? ye() : n === "ArrowLeft" && !e.shiftKey ? $(-1) : n === "ArrowRight" && !e.shiftKey ? $(1) : n === "ArrowLeft" && e.shiftKey && t ? m.value?.seekBy?.(-5) : n === "ArrowRight" && e.shiftKey && t ? m.value?.seekBy?.(5) : n === "Home" ? Q(0) : n === "End" ? Q(L.value - 1) : n === " " && t ? m.value?.togglePlay?.() : n === "," && t ? m.value?.stepFrame?.(-1) : n === "." && t ? m.value?.stepFrame?.(1) : (n === "i" || n === "I") && t ? m.value?.setLoopA?.() : (n === "o" || n === "O") && t ? m.value?.setLoopB?.() : (n === "u" || n === "U") && t ? m.value?.clearLoop?.() : (n === "m" || n === "M") && t ? m.value?.toggleMute?.() : n === "]" && t ? m.value?.cycleRate?.(1) : n === "[" && t ? m.value?.cycleRate?.(-1) : n === "Tab" ? h.value = !h.value : n === "f" || n === "F" ? be() : (n === "+" || n === "=") && M.value === "image" ? p.value?.zoomBy?.(1.25) : n === "-" && M.value === "image" ? p.value?.zoomBy?.(.8) : n === "0" && M.value === "image" && e.altKey ? p.value?.fit?.() : /^[0-5]$/.test(n) && !e.ctrlKey && !e.metaKey && !e.altKey ? Se(Number(n)) : (n === "c" || n === "C") && _e.value ? Y("ab") : r = !1, r && (e.preventDefault(), e.stopPropagation(), e.stopImmediatePropagation?.());
		}
		function we(e) {
			return l(e, 192) || "";
		}
		return (e, t) => {
			let n = ee("MButton");
			return j(), k(ae, { to: "body" }, [q(Z).open ? (j(), W("div", {
				key: 0,
				ref_key: "overlay",
				ref: f,
				class: B(["mjr-assets-manager mjr-studio", { "is-inspector-closed": !h.value }]),
				role: "dialog",
				"aria-modal": "true",
				"aria-label": q(c)("viewer.studio.title", "Viewer"),
				tabindex: "-1"
			}, [
				A("header", Ne, [
					A("div", Pe, [
						U(n, {
							type: "button",
							class: "mjr-studio-btn",
							title: q(c)("viewer.studio.prev", "Previous (←)"),
							disabled: L.value < 2,
							onClick: t[0] ||= (e) => q($)(-1)
						}, {
							default: R(() => [...t[14] ||= [A("i", {
								class: "pi pi-chevron-left",
								"aria-hidden": "true"
							}, null, -1)]]),
							_: 1
						}, 8, ["title", "disabled"]),
						A("span", Fe, G(q(Z).index + 1) + " / " + G(L.value), 1),
						U(n, {
							type: "button",
							class: "mjr-studio-btn",
							title: q(c)("viewer.studio.next", "Next (→)"),
							disabled: L.value < 2,
							onClick: t[1] ||= (e) => q($)(1)
						}, {
							default: R(() => [...t[15] ||= [A("i", {
								class: "pi pi-chevron-right",
								"aria-hidden": "true"
							}, null, -1)]]),
							_: 1
						}, 8, ["title", "disabled"])
					]),
					A("div", Ie, [A("span", {
						class: "mjr-studio__filename",
						title: D.value?.filepath || D.value?.filename
					}, G(D.value?.filename), 9, Le), A("span", Re, G(z.value), 1)]),
					A("div", ze, [
						M.value === "image" ? (j(), W(O, { key: 0 }, [
							A("span", {
								class: "mjr-studio-chip",
								title: q(c)("viewer.studio.zoomHint", "Wheel to zoom, double-click for fit / 100 %")
							}, G(Math.round(v.value * 100)) + "%", 9, Be),
							U(n, {
								type: "button",
								class: "mjr-studio-btn",
								title: q(c)("viewer.studio.fit", "Fit"),
								onClick: t[2] ||= (e) => p.value?.fit()
							}, {
								default: R(() => [...t[16] ||= [A("i", {
									class: "pi pi-arrows-alt",
									"aria-hidden": "true"
								}, null, -1)]]),
								_: 1
							}, 8, ["title"]),
							U(n, {
								type: "button",
								class: "mjr-studio-btn is-text",
								title: q(c)("viewer.studio.actualSize", "Actual size"),
								onClick: t[3] ||= (e) => p.value?.actualSize()
							}, {
								default: R(() => [...t[17] ||= [E("1:1", -1)]]),
								_: 1
							}, 8, ["title"]),
							U(n, {
								type: "button",
								class: B(["mjr-studio-btn", { "is-on": _.value }]),
								title: q(c)("viewer.studio.checker", "Transparency checkerboard"),
								onClick: t[4] ||= (e) => _.value = !_.value
							}, {
								default: R(() => [...t[18] ||= [A("i", {
									class: "pi pi-th-large",
									"aria-hidden": "true"
								}, null, -1)]]),
								_: 1
							}, 8, ["class", "title"])
						], 64)) : N("", !0),
						_e.value ? (j(), k(n, {
							key: 1,
							type: "button",
							class: "mjr-studio-btn",
							title: q(c)("viewer.studio.compare", "Compare with next (C)"),
							onClick: t[5] ||= (e) => Y("ab")
						}, {
							default: R(() => [...t[19] ||= [A("i", {
								class: "pi pi-clone",
								"aria-hidden": "true"
							}, null, -1)]]),
							_: 1
						}, 8, ["title"])) : N("", !0),
						U(n, {
							type: "button",
							class: "mjr-studio-btn",
							title: q(c)("viewer.studio.download", "Download"),
							onClick: xe
						}, {
							default: R(() => [...t[20] ||= [A("i", {
								class: "pi pi-download",
								"aria-hidden": "true"
							}, null, -1)]]),
							_: 1
						}, 8, ["title"]),
						U(n, {
							type: "button",
							class: "mjr-studio-btn",
							title: q(c)("viewer.studio.classic", "Open in classic viewer (tools: scopes, loupe, grading)"),
							onClick: t[6] ||= (e) => Y("")
						}, {
							default: R(() => [...t[21] ||= [A("i", {
								class: "pi pi-sliders-h",
								"aria-hidden": "true"
							}, null, -1)]]),
							_: 1
						}, 8, ["title"]),
						U(n, {
							type: "button",
							class: B(["mjr-studio-btn", { "is-on": h.value }]),
							title: q(c)("viewer.studio.inspector", "Generation info (Tab)"),
							onClick: t[7] ||= (e) => h.value = !h.value
						}, {
							default: R(() => [...t[22] ||= [A("i", {
								class: "pi pi-info-circle",
								"aria-hidden": "true"
							}, null, -1)]]),
							_: 1
						}, 8, ["class", "title"]),
						U(n, {
							type: "button",
							class: "mjr-studio-btn",
							title: q(c)("viewer.studio.fullscreen", "Fullscreen (F)"),
							onClick: be
						}, {
							default: R(() => [...t[23] ||= [A("i", {
								class: "pi pi-window-maximize",
								"aria-hidden": "true"
							}, null, -1)]]),
							_: 1
						}, 8, ["title"]),
						U(n, {
							type: "button",
							class: "mjr-studio-btn is-close",
							title: q(c)("viewer.studio.close", "Close (Esc)"),
							onClick: ye
						}, {
							default: R(() => [...t[24] ||= [A("i", {
								class: "pi pi-times",
								"aria-hidden": "true"
							}, null, -1)]]),
							_: 1
						}, 8, ["title"])
					])
				]),
				A("main", Ve, [A("section", He, [M.value === "image" ? (j(), k(je, {
					ref_key: "imageStage",
					ref: p,
					key: `img:${F.value}`,
					src: F.value,
					alt: T.value?.filename,
					checker: _.value,
					onZoom: t[8] ||= (e) => v.value = e
				}, null, 8, [
					"src",
					"alt",
					"checker"
				])) : M.value === "video" || M.value === "audio" ? (j(), k(fe, {
					ref_key: "player",
					ref: m,
					key: `media:${F.value}`,
					src: F.value,
					kind: M.value,
					fps: V.value,
					"frame-count": ie.value,
					filename: T.value?.filename
				}, null, 8, [
					"src",
					"kind",
					"fps",
					"frame-count",
					"filename"
				])) : (j(), W("div", Ue, [
					t[25] ||= A("i", {
						class: "pi pi-file",
						"aria-hidden": "true"
					}, null, -1),
					A("span", null, G(q(c)("viewer.studio.unsupported", "No preview for this file type.")), 1),
					U(n, {
						type: "button",
						class: "mjr-studio-btn is-text",
						onClick: t[9] ||= (e) => Y("")
					}, {
						default: R(() => [E(G(q(c)("viewer.studio.classicShort", "Classic viewer")), 1)]),
						_: 1
					})
				]))]), h.value && D.value ? (j(), W("aside", {
					key: 0,
					class: "mjr-studio__inspector",
					onKeydown: t[13] ||= ne(() => {}, ["stop"])
				}, [
					A("div", We, [A("div", Ge, [A("span", Ke, G(q(c)("sidebar.rating", "Rating")), 1), (j(), k(se, {
						key: `r:${D.value.id}`,
						asset: D.value,
						"model-value": me.value,
						size: 40
					}, null, 8, ["asset", "model-value"]))]), (j(), k(ce, {
						key: `t:${D.value.id}`,
						asset: D.value,
						"model-value": he.value
					}, null, 8, ["asset", "model-value"]))]),
					A("nav", qe, [
						U(n, {
							type: "button",
							role: "tab",
							class: B({ "is-active": g.value === "generation" }),
							onClick: t[10] ||= (e) => g.value = "generation"
						}, {
							default: R(() => [E(G(q(c)("viewer.studio.tabGeneration", "Generation")), 1)]),
							_: 1
						}, 8, ["class"]),
						U(n, {
							type: "button",
							role: "tab",
							class: B({ "is-active": g.value === "workflow" }),
							onClick: t[11] ||= (e) => g.value = "workflow"
						}, {
							default: R(() => [E(G(q(c)("viewer.studio.tabWorkflow", "Workflow")), 1)]),
							_: 1
						}, 8, ["class"]),
						U(n, {
							type: "button",
							role: "tab",
							class: B({ "is-active": g.value === "file" }),
							onClick: t[12] ||= (e) => g.value = "file"
						}, {
							default: R(() => [E(G(q(c)("viewer.studio.tabFile", "File")), 1)]),
							_: 1
						}, 8, ["class"])
					]),
					A("div", Je, [g.value === "generation" ? (j(), k(x, {
						key: `g:${D.value.id}`,
						asset: D.value
					}, null, 8, ["asset"])) : g.value === "workflow" ? (j(), k(S, {
						key: `w:${D.value.id}`,
						asset: D.value
					}, null, 8, ["asset"])) : (j(), k(b, {
						key: `f:${D.value.id}`,
						asset: D.value
					}, null, 8, ["asset"]))])
				], 32)) : N("", !0)]),
				L.value > 1 ? (j(), W("footer", {
					key: 0,
					class: "mjr-studio__filmstrip",
					role: "listbox",
					"aria-label": q(c)("viewer.studio.filmstrip", "Filmstrip")
				}, [(j(!0), W(O, null, I(ge.value, (e) => (j(), k(n, {
					key: `${e.index}:${e.asset?.id ?? e.asset?.filename}`,
					type: "button",
					role: "option",
					class: B(["mjr-studio__thumb", { "is-current": e.index === q(Z).index }]),
					"aria-selected": e.index === q(Z).index,
					title: e.asset?.filename,
					onClick: (t) => q(Q)(e.index)
				}, {
					default: R(() => [we(e.asset) ? (j(), W("img", {
						key: 0,
						src: we(e.asset),
						alt: "",
						loading: "lazy",
						draggable: "false"
					}, null, 8, Xe)) : (j(), W("i", Ze)), q(J)(e.asset) === "video" ? (j(), W("i", Qe)) : N("", !0)]),
					_: 2
				}, 1032, [
					"class",
					"aria-selected",
					"title",
					"onClick"
				]))), 128))], 8, Ye)) : N("", !0)
			], 10, Me)) : N("", !0)]);
		};
	}
}), et = /* @__PURE__ */ M({
	__name: "ViewerPortal",
	setup(e) {
		let t = null;
		function n(e) {
			let n = e?.detail || {}, i = Array.isArray(n?.assets) ? n.assets.filter(Boolean) : n?.asset ? [n.asset] : [];
			if (!i.length) return;
			let a = Math.max(0, Math.min(Number(n?.index) || 0, i.length - 1)), o = String(n?.mode || "").trim().toLowerCase();
			if (Ee(i, a, o) && we(i, a)) {
				try {
					t?.close?.();
				} catch (e) {
					console.debug?.(e);
				}
				n.handled = !0;
			} else r(i, a, o, n);
		}
		function r(e, n, r, i = null) {
			Te();
			try {
				t ||= _(), t.open?.(e, n), (r === "ab" || r === "sidebyside") && t.setMode?.(r), i && (i.handled = !0);
			} catch (e) {
				console.debug?.(e);
			}
		}
		return D(() => {
			try {
				T();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				t = _();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				window.addEventListener(u.OPEN_VIEWER, n);
			} catch (e) {
				console.debug?.(e);
			}
		}), F(() => {
			try {
				window.removeEventListener(u.OPEN_VIEWER, n);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				w();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				t?.dispose?.();
			} catch (e) {
				console.debug?.(e);
			}
			t = null;
		}), (e, t) => (j(), W(O, null, [
			U($e, { onOpenClassic: t[0] ||= (e) => r(e.assets, e.index, e.mode) }),
			U(he),
			U(me),
			U(X)
		], 64));
	}
});
export { et as default };
