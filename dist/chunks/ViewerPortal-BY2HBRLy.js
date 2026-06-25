import { a as e, i as t } from "./viewerRuntimeHosts-C-9ryYS-.js";
import { r as n } from "./events-iWiZ-Zty.js";
import { i as r, r as i } from "./floatingViewerManager-eCmg8OTF.js";
import { B as a, C as o, D as s, E as c, G as l, H as u, I as d, L as f, P as p, R as m, S as h, T as g, U as _, ct as v, et as y, k as b, lt as x, ot as S, st as C, w, x as T } from "./mjr-primevue-BP853pmn.js";
import { t as E } from "./TagsEditor-WNqtBVY4.js";
import { a as D, c as O, i as k, n as A, o as j, r as M, s as N, t as P } from "./Viewer-Ce0uoLSH.js";
//#region ui/vue/components/viewer/FloatingViewerHost.vue
var F = {
	__name: "FloatingViewerHost",
	setup(e) {
		let n = y(null), r = null;
		return d(() => {
			r = t(n.value);
		}), f(() => {
			r?.(), r = null;
		}), (e, t) => (m(), s("div", {
			ref_key: "hostRef",
			ref: n,
			class: "mjr-viewer-runtime-host mjr-viewer-runtime-host--floating",
			style: {
				position: "fixed",
				inset: "0",
				"pointer-events": "none",
				overflow: "visible"
			}
		}, null, 512));
	}
}, I = {
	__name: "ViewerOverlayHost",
	setup(t) {
		let n = y(null), r = null;
		return d(() => {
			r = e(n.value);
		}), f(() => {
			r?.(), r = null;
		}), (e, t) => (m(), s("div", {
			ref_key: "hostRef",
			ref: n,
			class: "mjr-viewer-runtime-host mjr-viewer-runtime-host--main",
			style: {
				position: "fixed",
				inset: "0",
				"pointer-events": "none",
				overflow: "visible"
			}
		}, null, 512));
	}
}, L = {
	key: 0,
	class: "mjr-context-menu-separator"
}, R = { class: "mjr-context-menu-item-left" }, z = { class: "mjr-context-menu-item-right" }, B = {
	key: 0,
	class: "mjr-context-menu-hint"
}, V = {
	key: 1,
	class: "mjr-context-menu-submenu-arrow"
}, H = {
	key: 0,
	class: "mjr-context-menu-separator"
}, U = { class: "mjr-context-menu-item-left" }, W = {
	key: 0,
	class: "mjr-context-menu-hint"
}, G = {
	__name: "ViewerContextMenu",
	setup(e) {
		let t = y(null), n = y(null), r = y(null), i = null, D = null, A = o(() => F(O.main, 10041)), N = o(() => F(O.submenu, 10042)), P = o(() => F(O.tags, 10043));
		function F(e, t) {
			return {
				position: "fixed",
				left: `${Math.round(Number(e?.x) || 0)}px`,
				top: `${Math.round(Number(e?.y) || 0)}px`,
				display: "block",
				zIndex: String(t)
			};
		}
		function I() {
			i &&= (clearTimeout(i), null);
		}
		function G() {
			I(), i = setTimeout(() => {
				k();
			}, 180);
		}
		function K(e, t) {
			if (!e?.open || !t) return;
			let n = t.getBoundingClientRect(), r = Number(window.innerWidth || 0), i = Number(window.innerHeight || 0), a = Number(e.x) || 0, o = Number(e.y) || 0;
			a + n.width > r && (a = Math.max(8, r - n.width - 10)), o + n.height > i && (o = Math.max(8, i - n.height - 10)), a < 8 && (a = 8), o < 8 && (o = 8), e.x = a, e.y = o;
		}
		async function q(e, t) {
			await p(), K(e, t?.value || null);
		}
		function J(e) {
			try {
				e?.value?.querySelector?.(".mjr-context-menu-item:not([aria-disabled=\"true\"])")?.focus?.();
			} catch (e) {
				console.debug?.(e);
			}
		}
		function Y(e, t) {
			if (!Array.isArray(e?.submenu) || !e.submenu.length) {
				k();
				return;
			}
			I();
			let n = (t?.currentTarget)?.getBoundingClientRect?.();
			j({
				x: Math.round((n?.right || O.main.x || 0) + 6),
				y: Math.round((n?.top || O.main.y || 0) - 4),
				items: e.submenu,
				title: e.label || ""
			});
		}
		async function X(e, t, n = "main") {
			if (!(!e || e.type !== "item" || e.disabled)) {
				if (Array.isArray(e.submenu) && e.submenu.length) {
					Y(e, t);
					return;
				}
				try {
					await e.action?.();
				} catch (e) {
					console.error("[ViewerContextMenu.vue] Action failed:", e);
				} finally {
					e.closeOnSelect === !1 ? n === "submenu" && k() : M();
				}
			}
		}
		function Z(e, t) {
			if (Array.isArray(e?.submenu) && e.submenu.length) {
				Y(e, t);
				return;
			}
			k();
		}
		function Q(e) {
			Array.isArray(e?.submenu) && e.submenu.length && G();
		}
		function ee() {
			I();
		}
		function te() {
			G();
		}
		function ne(e) {
			let i = e?.target;
			t.value?.contains?.(i) || n.value?.contains?.(i) || r.value?.contains?.(i) || M();
		}
		function re(e) {
			e?.key === "Escape" && M();
		}
		function $() {
			M();
		}
		function ie(e) {
			String(e?.detail?.source || "") !== "viewer" && M();
		}
		function ae(e) {
			let t = O.tags.asset;
			t && (t.tags = Array.isArray(e) ? [...e] : []);
		}
		function oe(e) {
			let t = Array.isArray(e?.tags) ? e.tags : [];
			try {
				O.tags.onChanged?.(t);
			} catch (e) {
				console.debug?.(e);
			}
		}
		return _(() => O.main.open, async (e) => {
			e && (await q(O.main, t), J(t));
		}), _(() => O.submenu.open, async (e) => {
			e && (await q(O.submenu, n), J(n));
		}), _(() => O.tags.open, async (e) => {
			e && await q(O.tags, r);
		}), d(() => {
			D = new AbortController();
			let e = {
				capture: !0,
				passive: !0,
				signal: D.signal
			};
			window.addEventListener("pointerdown", ne, e), window.addEventListener("keydown", re, {
				capture: !0,
				signal: D.signal
			}), window.addEventListener("scroll", $, e), window.addEventListener("wheel", $, e), window.addEventListener("resize", $, {
				passive: !0,
				signal: D.signal
			}), window.addEventListener("mjr-close-all-menus", ie, { signal: D.signal });
		}), f(() => {
			I();
			try {
				D?.abort();
			} catch (e) {
				console.debug?.(e);
			}
			D = null, M();
		}), (e, i) => {
			let o = u("MButton");
			return m(), g(h, { to: "body" }, [
				S(O).main.open ? (m(), s("div", {
					key: 0,
					ref_key: "mainMenuRef",
					ref: t,
					class: "mjr-viewer-context-menu mjr-context-menu",
					style: v(A.value),
					role: "menu",
					"aria-label": "Viewer context menu"
				}, [(m(!0), s(T, null, a(S(O).main.items, (e) => (m(), s(T, { key: e.id }, [e.type === "separator" ? (m(), s("div", L)) : (m(), g(o, {
					key: 1,
					type: "button",
					class: C(["mjr-context-menu-item", {
						"is-disabled": e.disabled,
						"has-submenu": Array.isArray(e.submenu) && e.submenu.length
					}]),
					severity: "secondary",
					text: "",
					role: "menuitem",
					"aria-disabled": e.disabled ? "true" : "false",
					tabindex: e.disabled ? -1 : 0,
					onClick: (t) => X(e, t),
					onMouseenter: (t) => Z(e, t),
					onMouseleave: (t) => Q(e)
				}, {
					default: l(() => [w("span", R, [e.iconClass ? (m(), s("i", {
						key: 0,
						class: C(e.iconClass)
					}, null, 2)) : c("", !0), w("span", null, x(e.label), 1)]), w("span", z, [e.rightHint ? (m(), s("span", B, x(e.rightHint), 1)) : c("", !0), Array.isArray(e.submenu) && e.submenu.length ? (m(), s("span", V, " > ")) : c("", !0)])]),
					_: 2
				}, 1032, [
					"class",
					"aria-disabled",
					"tabindex",
					"onClick",
					"onMouseenter",
					"onMouseleave"
				]))], 64))), 128))], 4)) : c("", !0),
				S(O).submenu.open ? (m(), s("div", {
					key: 1,
					ref_key: "submenuRef",
					ref: n,
					class: "mjr-viewer-rating-submenu mjr-context-menu",
					style: v(N.value),
					role: "menu",
					"aria-label": "Viewer context submenu",
					onMouseenter: ee,
					onMouseleave: te
				}, [(m(!0), s(T, null, a(S(O).submenu.items, (e) => (m(), s(T, { key: e.id }, [e.type === "separator" ? (m(), s("div", H)) : (m(), g(o, {
					key: 1,
					type: "button",
					class: C(["mjr-context-menu-item", { "is-disabled": e.disabled }]),
					severity: "secondary",
					text: "",
					role: "menuitem",
					"aria-disabled": e.disabled ? "true" : "false",
					tabindex: e.disabled ? -1 : 0,
					onClick: (t) => X(e, t, "submenu")
				}, {
					default: l(() => [w("span", U, [e.iconClass ? (m(), s("i", {
						key: 0,
						class: C(e.iconClass)
					}, null, 2)) : c("", !0), w("span", null, x(e.label), 1)]), e.rightHint ? (m(), s("span", W, x(e.rightHint), 1)) : c("", !0)]),
					_: 2
				}, 1032, [
					"class",
					"aria-disabled",
					"tabindex",
					"onClick"
				]))], 64))), 128))], 36)) : c("", !0),
				S(O).tags.open && S(O).tags.asset ? (m(), s("div", {
					key: 2,
					ref_key: "tagsPopoverRef",
					ref: r,
					class: "mjr-viewer-popover",
					style: v(P.value)
				}, [b(E, {
					asset: S(O).tags.asset,
					"model-value": S(O).tags.asset?.tags || [],
					"onUpdate:modelValue": ae,
					onTagsChange: oe
				}, null, 8, ["asset", "model-value"])], 4)) : c("", !0)
			]);
		};
	}
}, K = {
	__name: "ViewerContextMenuPortal",
	setup(e) {
		let t = y(""), n = o(() => D(t.value));
		return d(() => {
			t.value = A();
		}), f(() => {
			N(t.value), t.value = "";
		}), (e, t) => n.value ? (m(), g(G, { key: 0 })) : c("", !0);
	}
}, q = {
	__name: "ViewerPortal",
	setup(e) {
		let t = null;
		function a(e) {
			let n = e?.detail || {}, r = Array.isArray(n?.assets) ? n.assets.filter(Boolean) : n?.asset ? [n.asset] : [];
			if (!r.length) return;
			let i = Math.max(0, Math.min(Number(n?.index) || 0, r.length - 1)), a = String(n?.mode || "").trim().toLowerCase();
			try {
				t ||= P(), t.open?.(r, i), (a === "ab" || a === "sidebyside") && t.setMode?.(a), n.handled = !0;
			} catch (e) {
				console.debug?.(e);
			}
		}
		return d(() => {
			try {
				i();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				t = P();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				window.addEventListener(n.OPEN_VIEWER, a);
			} catch (e) {
				console.debug?.(e);
			}
		}), f(() => {
			try {
				window.removeEventListener(n.OPEN_VIEWER, a);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				r();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				t?.dispose?.();
			} catch (e) {
				console.debug?.(e);
			}
			t = null;
		}), (e, t) => (m(), s(T, null, [
			b(I),
			b(F),
			b(K)
		], 64));
	}
};
//#endregion
export { q as default };
