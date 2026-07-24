import { a as e, i as t } from "./viewerRuntimeHosts-B0n5DSKG.js";
import { r as n } from "./events-CwzwyUFJ.js";
import { a as r, c as i, i as a, l as o, o as s, s as c, t as l, u } from "./Viewer--Cuhs0TQ.js";
import { i as d, r as f } from "./floatingViewerManager-CGdpmtv-.js";
import { B as p, C as m, D as h, E as g, G as _, H as v, I as y, O as b, R as x, T as S, W as C, ct as w, dt as T, j as E, k as D, lt as O, nt as k, q as A, ut as j, w as M, z as N } from "./mjr-primevue-n1rsQYJg.js";
import { t as P } from "./TagsEditor-Ba8mdFJF.js";
//#region ui/vue/components/viewer/FloatingViewerHost.vue
var F = {
	__name: "FloatingViewerHost",
	setup(e) {
		let n = k(null), r = null;
		return x(() => {
			r = t(n.value);
		}), N(() => {
			r?.(), r = null;
		}), (e, t) => (p(), D("div", {
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
		let n = k(null), r = null;
		return x(() => {
			r = e(n.value);
		}), N(() => {
			r?.(), r = null;
		}), (e, t) => (p(), D("div", {
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
}, R = { class: "mjr-context-menu-item-left" }, ee = { class: "mjr-context-menu-item-right" }, te = {
	key: 0,
	class: "mjr-context-menu-hint"
}, z = {
	key: 1,
	class: "mjr-context-menu-submenu-arrow"
}, B = {
	key: 0,
	class: "mjr-context-menu-separator"
}, V = { class: "mjr-context-menu-item-left" }, H = {
	key: 0,
	class: "mjr-context-menu-hint"
}, U = {
	__name: "ViewerContextMenu",
	setup(e) {
		let t = k(null), n = k(null), a = k(null), o = null, c = null, l = S(() => F(u.main, 10041)), d = S(() => F(u.submenu, 10042)), f = S(() => F(u.tags, 10043));
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
			o &&= (clearTimeout(o), null);
		}
		function U() {
			I(), o = setTimeout(() => {
				s();
			}, 180);
		}
		function W(e, t) {
			if (!e?.open || !t) return;
			let n = t.getBoundingClientRect(), r = Number(window.innerWidth || 0), i = Number(window.innerHeight || 0), a = Number(e.x) || 0, o = Number(e.y) || 0;
			a + n.width > r && (a = Math.max(8, r - n.width - 10)), o + n.height > i && (o = Math.max(8, i - n.height - 10)), a < 8 && (a = 8), o < 8 && (o = 8), e.x = a, e.y = o;
		}
		async function G(e, t) {
			await y(), W(e, t?.value || null);
		}
		function K(e) {
			try {
				e?.value?.querySelector?.(".mjr-context-menu-item:not([aria-disabled=\"true\"])")?.focus?.();
			} catch (e) {
				console.debug?.(e);
			}
		}
		function q(e, t) {
			if (!Array.isArray(e?.submenu) || !e.submenu.length) {
				s();
				return;
			}
			I();
			let n = (t?.currentTarget)?.getBoundingClientRect?.();
			i({
				x: Math.round((n?.right || u.main.x || 0) + 6),
				y: Math.round((n?.top || u.main.y || 0) - 4),
				items: e.submenu,
				title: e.label || ""
			});
		}
		async function J(e, t, n = "main") {
			if (!(!e || e.type !== "item" || e.disabled)) {
				if (Array.isArray(e.submenu) && e.submenu.length) {
					q(e, t);
					return;
				}
				try {
					await e.action?.();
				} catch (e) {
					console.error("[ViewerContextMenu.vue] Action failed:", e);
				} finally {
					e.closeOnSelect === !1 ? n === "submenu" && s() : r();
				}
			}
		}
		function Y(e, t) {
			if (Array.isArray(e?.submenu) && e.submenu.length) {
				q(e, t);
				return;
			}
			s();
		}
		function X(e) {
			Array.isArray(e?.submenu) && e.submenu.length && U();
		}
		function Z() {
			I();
		}
		function ne() {
			U();
		}
		function Q(e) {
			let i = e?.target;
			t.value?.contains?.(i) || n.value?.contains?.(i) || a.value?.contains?.(i) || r();
		}
		function re(e) {
			e?.key === "Escape" && r();
		}
		function $() {
			r();
		}
		function ie(e) {
			String(e?.detail?.source || "") !== "viewer" && r();
		}
		function ae(e) {
			let t = u.tags.asset;
			t && (t.tags = Array.isArray(e) ? [...e] : []);
		}
		function oe(e) {
			let t = Array.isArray(e?.tags) ? e.tags : [];
			try {
				u.tags.onChanged?.(t);
			} catch (e) {
				console.debug?.(e);
			}
		}
		return _(() => u.main.open, async (e) => {
			e && (await G(u.main, t), K(t));
		}), _(() => u.submenu.open, async (e) => {
			e && (await G(u.submenu, n), K(n));
		}), _(() => u.tags.open, async (e) => {
			e && await G(u.tags, a);
		}), x(() => {
			c = new AbortController();
			let e = {
				capture: !0,
				passive: !0,
				signal: c.signal
			};
			window.addEventListener("pointerdown", Q, e), window.addEventListener("keydown", re, {
				capture: !0,
				signal: c.signal
			}), window.addEventListener("scroll", $, e), window.addEventListener("wheel", $, e), window.addEventListener("resize", $, {
				passive: !0,
				signal: c.signal
			}), window.addEventListener("mjr-close-all-menus", ie, { signal: c.signal });
		}), N(() => {
			I();
			try {
				c?.abort();
			} catch (e) {
				console.debug?.(e);
			}
			c = null, r();
		}), (e, r) => {
			let i = C("MButton");
			return p(), h(M, { to: "body" }, [
				w(u).main.open ? (p(), D("div", {
					key: 0,
					ref_key: "mainMenuRef",
					ref: t,
					class: "mjr-viewer-context-menu mjr-context-menu",
					style: j(l.value),
					role: "menu",
					"aria-label": "Viewer context menu"
				}, [(p(!0), D(m, null, v(w(u).main.items, (e) => (p(), D(m, { key: e.id }, [e.type === "separator" ? (p(), D("div", L)) : (p(), h(i, {
					key: 1,
					type: "button",
					class: O(["mjr-context-menu-item", {
						"is-disabled": e.disabled,
						"has-submenu": Array.isArray(e.submenu) && e.submenu.length
					}]),
					severity: "secondary",
					text: "",
					role: "menuitem",
					"aria-disabled": e.disabled ? "true" : "false",
					tabindex: e.disabled ? -1 : 0,
					onClick: (t) => J(e, t),
					onMouseenter: (t) => Y(e, t),
					onMouseleave: (t) => X(e)
				}, {
					default: A(() => [g("span", R, [e.iconClass ? (p(), D("i", {
						key: 0,
						class: O(e.iconClass)
					}, null, 2)) : b("", !0), g("span", null, T(e.label), 1)]), g("span", ee, [e.rightHint ? (p(), D("span", te, T(e.rightHint), 1)) : b("", !0), Array.isArray(e.submenu) && e.submenu.length ? (p(), D("span", z, " > ")) : b("", !0)])]),
					_: 2
				}, 1032, [
					"class",
					"aria-disabled",
					"tabindex",
					"onClick",
					"onMouseenter",
					"onMouseleave"
				]))], 64))), 128))], 4)) : b("", !0),
				w(u).submenu.open ? (p(), D("div", {
					key: 1,
					ref_key: "submenuRef",
					ref: n,
					class: "mjr-viewer-rating-submenu mjr-context-menu",
					style: j(d.value),
					role: "menu",
					"aria-label": "Viewer context submenu",
					onMouseenter: Z,
					onMouseleave: ne
				}, [(p(!0), D(m, null, v(w(u).submenu.items, (e) => (p(), D(m, { key: e.id }, [e.type === "separator" ? (p(), D("div", B)) : (p(), h(i, {
					key: 1,
					type: "button",
					class: O(["mjr-context-menu-item", { "is-disabled": e.disabled }]),
					severity: "secondary",
					text: "",
					role: "menuitem",
					"aria-disabled": e.disabled ? "true" : "false",
					tabindex: e.disabled ? -1 : 0,
					onClick: (t) => J(e, t, "submenu")
				}, {
					default: A(() => [g("span", V, [e.iconClass ? (p(), D("i", {
						key: 0,
						class: O(e.iconClass)
					}, null, 2)) : b("", !0), g("span", null, T(e.label), 1)]), e.rightHint ? (p(), D("span", H, T(e.rightHint), 1)) : b("", !0)]),
					_: 2
				}, 1032, [
					"class",
					"aria-disabled",
					"tabindex",
					"onClick"
				]))], 64))), 128))], 36)) : b("", !0),
				w(u).tags.open && w(u).tags.asset ? (p(), D("div", {
					key: 2,
					ref_key: "tagsPopoverRef",
					ref: a,
					class: "mjr-viewer-popover",
					style: j(f.value)
				}, [E(P, {
					asset: w(u).tags.asset,
					"model-value": w(u).tags.asset?.tags || [],
					"onUpdate:modelValue": ae,
					onTagsChange: oe
				}, null, 8, ["asset", "model-value"])], 4)) : b("", !0)
			]);
		};
	}
}, W = {
	__name: "ViewerContextMenuPortal",
	setup(e) {
		let t = k(""), n = S(() => c(t.value));
		return x(() => {
			t.value = a();
		}), N(() => {
			o(t.value), t.value = "";
		}), (e, t) => n.value ? (p(), h(U, { key: 0 })) : b("", !0);
	}
}, G = {
	__name: "ViewerPortal",
	setup(e) {
		let t = null;
		function r(e) {
			let n = e?.detail || {}, r = Array.isArray(n?.assets) ? n.assets.filter(Boolean) : n?.asset ? [n.asset] : [];
			if (!r.length) return;
			let i = Math.max(0, Math.min(Number(n?.index) || 0, r.length - 1)), a = String(n?.mode || "").trim().toLowerCase();
			try {
				t ||= l(), t.open?.(r, i), (a === "ab" || a === "sidebyside") && t.setMode?.(a), n.handled = !0;
			} catch (e) {
				console.debug?.(e);
			}
		}
		return x(() => {
			try {
				f();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				t = l();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				window.addEventListener(n.OPEN_VIEWER, r);
			} catch (e) {
				console.debug?.(e);
			}
		}), N(() => {
			try {
				window.removeEventListener(n.OPEN_VIEWER, r);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				d();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				t?.dispose?.();
			} catch (e) {
				console.debug?.(e);
			}
			t = null;
		}), (e, t) => (p(), D(m, null, [
			E(I),
			E(F),
			E(W)
		], 64));
	}
};
//#endregion
export { G as default };
