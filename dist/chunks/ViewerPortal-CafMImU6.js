import { a as e, i as t } from "./viewerRuntimeHosts-B9wQ_Nxj.js";
import { r as n } from "./events-BpkKbGZs.js";
import { i as r, r as i } from "./floatingViewerManager-pz1ceTHv.js";
import { B as a, C as o, D as s, E as c, G as l, H as u, I as d, O as f, R as p, T as m, W as h, ct as g, dt as _, j as v, k as y, lt as b, nt as x, q as S, ut as C, w, z as T } from "./mjr-primevue-n1rsQYJg.js";
import { t as E } from "./TagsEditor-DtmqPU71.js";
import { a as D, c as O, i as k, n as A, o as ee, r as j, s as M, t as N } from "./Viewer-BG31OAT8.js";
//#region ui/vue/components/viewer/FloatingViewerHost.vue
var P = {
	__name: "FloatingViewerHost",
	setup(e) {
		let n = x(null), r = null;
		return p(() => {
			r = t(n.value);
		}), T(() => {
			r?.(), r = null;
		}), (e, t) => (a(), y("div", {
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
}, F = {
	__name: "ViewerOverlayHost",
	setup(t) {
		let n = x(null), r = null;
		return p(() => {
			r = e(n.value);
		}), T(() => {
			r?.(), r = null;
		}), (e, t) => (a(), y("div", {
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
}, I = {
	key: 0,
	class: "mjr-context-menu-separator"
}, L = { class: "mjr-context-menu-item-left" }, R = { class: "mjr-context-menu-item-right" }, z = {
	key: 0,
	class: "mjr-context-menu-hint"
}, B = {
	key: 1,
	class: "mjr-context-menu-submenu-arrow"
}, V = {
	key: 0,
	class: "mjr-context-menu-separator"
}, H = { class: "mjr-context-menu-item-left" }, U = {
	key: 0,
	class: "mjr-context-menu-hint"
}, W = {
	__name: "ViewerContextMenu",
	setup(e) {
		let t = x(null), n = x(null), r = x(null), i = null, D = null, A = m(() => P(O.main, 10041)), M = m(() => P(O.submenu, 10042)), N = m(() => P(O.tags, 10043));
		function P(e, t) {
			return {
				position: "fixed",
				left: `${Math.round(Number(e?.x) || 0)}px`,
				top: `${Math.round(Number(e?.y) || 0)}px`,
				display: "block",
				zIndex: String(t)
			};
		}
		function F() {
			i &&= (clearTimeout(i), null);
		}
		function W() {
			F(), i = setTimeout(() => {
				k();
			}, 180);
		}
		function G(e, t) {
			if (!e?.open || !t) return;
			let n = t.getBoundingClientRect(), r = Number(window.innerWidth || 0), i = Number(window.innerHeight || 0), a = Number(e.x) || 0, o = Number(e.y) || 0;
			a + n.width > r && (a = Math.max(8, r - n.width - 10)), o + n.height > i && (o = Math.max(8, i - n.height - 10)), a < 8 && (a = 8), o < 8 && (o = 8), e.x = a, e.y = o;
		}
		async function K(e, t) {
			await d(), G(e, t?.value || null);
		}
		function q(e) {
			try {
				e?.value?.querySelector?.(".mjr-context-menu-item:not([aria-disabled=\"true\"])")?.focus?.();
			} catch (e) {
				console.debug?.(e);
			}
		}
		function J(e, t) {
			if (!Array.isArray(e?.submenu) || !e.submenu.length) {
				k();
				return;
			}
			F();
			let n = (t?.currentTarget)?.getBoundingClientRect?.();
			ee({
				x: Math.round((n?.right || O.main.x || 0) + 6),
				y: Math.round((n?.top || O.main.y || 0) - 4),
				items: e.submenu,
				title: e.label || ""
			});
		}
		async function Y(e, t, n = "main") {
			if (!(!e || e.type !== "item" || e.disabled)) {
				if (Array.isArray(e.submenu) && e.submenu.length) {
					J(e, t);
					return;
				}
				try {
					await e.action?.();
				} catch (e) {
					console.error("[ViewerContextMenu.vue] Action failed:", e);
				} finally {
					e.closeOnSelect === !1 ? n === "submenu" && k() : j();
				}
			}
		}
		function X(e, t) {
			if (Array.isArray(e?.submenu) && e.submenu.length) {
				J(e, t);
				return;
			}
			k();
		}
		function Z(e) {
			Array.isArray(e?.submenu) && e.submenu.length && W();
		}
		function Q() {
			F();
		}
		function te() {
			W();
		}
		function ne(e) {
			let i = e?.target;
			t.value?.contains?.(i) || n.value?.contains?.(i) || r.value?.contains?.(i) || j();
		}
		function re(e) {
			e?.key === "Escape" && j();
		}
		function $() {
			j();
		}
		function ie(e) {
			String(e?.detail?.source || "") !== "viewer" && j();
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
		return l(() => O.main.open, async (e) => {
			e && (await K(O.main, t), q(t));
		}), l(() => O.submenu.open, async (e) => {
			e && (await K(O.submenu, n), q(n));
		}), l(() => O.tags.open, async (e) => {
			e && await K(O.tags, r);
		}), p(() => {
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
		}), T(() => {
			F();
			try {
				D?.abort();
			} catch (e) {
				console.debug?.(e);
			}
			D = null, j();
		}), (e, i) => {
			let l = h("MButton");
			return a(), s(w, { to: "body" }, [
				g(O).main.open ? (a(), y("div", {
					key: 0,
					ref_key: "mainMenuRef",
					ref: t,
					class: "mjr-viewer-context-menu mjr-context-menu",
					style: C(A.value),
					role: "menu",
					"aria-label": "Viewer context menu"
				}, [(a(!0), y(o, null, u(g(O).main.items, (e) => (a(), y(o, { key: e.id }, [e.type === "separator" ? (a(), y("div", I)) : (a(), s(l, {
					key: 1,
					type: "button",
					class: b(["mjr-context-menu-item", {
						"is-disabled": e.disabled,
						"has-submenu": Array.isArray(e.submenu) && e.submenu.length
					}]),
					severity: "secondary",
					text: "",
					role: "menuitem",
					"aria-disabled": e.disabled ? "true" : "false",
					tabindex: e.disabled ? -1 : 0,
					onClick: (t) => Y(e, t),
					onMouseenter: (t) => X(e, t),
					onMouseleave: (t) => Z(e)
				}, {
					default: S(() => [c("span", L, [e.iconClass ? (a(), y("i", {
						key: 0,
						class: b(e.iconClass)
					}, null, 2)) : f("", !0), c("span", null, _(e.label), 1)]), c("span", R, [e.rightHint ? (a(), y("span", z, _(e.rightHint), 1)) : f("", !0), Array.isArray(e.submenu) && e.submenu.length ? (a(), y("span", B, " > ")) : f("", !0)])]),
					_: 2
				}, 1032, [
					"class",
					"aria-disabled",
					"tabindex",
					"onClick",
					"onMouseenter",
					"onMouseleave"
				]))], 64))), 128))], 4)) : f("", !0),
				g(O).submenu.open ? (a(), y("div", {
					key: 1,
					ref_key: "submenuRef",
					ref: n,
					class: "mjr-viewer-rating-submenu mjr-context-menu",
					style: C(M.value),
					role: "menu",
					"aria-label": "Viewer context submenu",
					onMouseenter: Q,
					onMouseleave: te
				}, [(a(!0), y(o, null, u(g(O).submenu.items, (e) => (a(), y(o, { key: e.id }, [e.type === "separator" ? (a(), y("div", V)) : (a(), s(l, {
					key: 1,
					type: "button",
					class: b(["mjr-context-menu-item", { "is-disabled": e.disabled }]),
					severity: "secondary",
					text: "",
					role: "menuitem",
					"aria-disabled": e.disabled ? "true" : "false",
					tabindex: e.disabled ? -1 : 0,
					onClick: (t) => Y(e, t, "submenu")
				}, {
					default: S(() => [c("span", H, [e.iconClass ? (a(), y("i", {
						key: 0,
						class: b(e.iconClass)
					}, null, 2)) : f("", !0), c("span", null, _(e.label), 1)]), e.rightHint ? (a(), y("span", U, _(e.rightHint), 1)) : f("", !0)]),
					_: 2
				}, 1032, [
					"class",
					"aria-disabled",
					"tabindex",
					"onClick"
				]))], 64))), 128))], 36)) : f("", !0),
				g(O).tags.open && g(O).tags.asset ? (a(), y("div", {
					key: 2,
					ref_key: "tagsPopoverRef",
					ref: r,
					class: "mjr-viewer-popover",
					style: C(N.value)
				}, [v(E, {
					asset: g(O).tags.asset,
					"model-value": g(O).tags.asset?.tags || [],
					"onUpdate:modelValue": ae,
					onTagsChange: oe
				}, null, 8, ["asset", "model-value"])], 4)) : f("", !0)
			]);
		};
	}
}, G = {
	__name: "ViewerContextMenuPortal",
	setup(e) {
		let t = x(""), n = m(() => D(t.value));
		return p(() => {
			t.value = A();
		}), T(() => {
			M(t.value), t.value = "";
		}), (e, t) => n.value ? (a(), s(W, { key: 0 })) : f("", !0);
	}
}, K = {
	__name: "ViewerPortal",
	setup(e) {
		let t = null;
		function s(e) {
			let n = e?.detail || {}, r = Array.isArray(n?.assets) ? n.assets.filter(Boolean) : n?.asset ? [n.asset] : [];
			if (!r.length) return;
			let i = Math.max(0, Math.min(Number(n?.index) || 0, r.length - 1)), a = String(n?.mode || "").trim().toLowerCase();
			try {
				t ||= N(), t.open?.(r, i), (a === "ab" || a === "sidebyside") && t.setMode?.(a), n.handled = !0;
			} catch (e) {
				console.debug?.(e);
			}
		}
		return p(() => {
			try {
				i();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				t = N();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				window.addEventListener(n.OPEN_VIEWER, s);
			} catch (e) {
				console.debug?.(e);
			}
		}), T(() => {
			try {
				window.removeEventListener(n.OPEN_VIEWER, s);
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
		}), (e, t) => (a(), y(o, null, [
			v(F),
			v(P),
			v(G)
		], 64));
	}
};
//#endregion
export { K as default };
