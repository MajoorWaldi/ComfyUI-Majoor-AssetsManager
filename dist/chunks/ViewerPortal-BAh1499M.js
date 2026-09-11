import { a as e, i as t } from "./viewerRuntimeHosts-CIiyEfr6.js";
import { r as n } from "./events-DjjLASfV.js";
import { a as r, c as i, i as a, l as o, o as s, s as c, t as l, u } from "./Viewer-DDNDTRcP.js";
import { i as d, r as f } from "./floatingViewerManager-Bnd82Qrd.js";
import { B as p, C as m, D as h, E as g, G as _, J as v, K as y, L as b, N as x, O as S, T as C, U as w, V as T, dt as E, ft as D, j as O, k, lt as A, rt as j, ut as M, w as N, z as P } from "./mjr-primevue-C955bvXT.js";
import { t as F } from "./TagsEditor-BHGoWuSC.js";
//#endregion
//#region ui/vue/components/viewer/FloatingViewerHost.vue
var I = /* @__PURE__ */ x({
	__name: "FloatingViewerHost",
	setup(e) {
		let n = j(null), r = null;
		return P(() => {
			r = t(n.value);
		}), p(() => {
			r?.(), r = null;
		}), (e, t) => (T(), k("div", {
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
}), L = /* @__PURE__ */ x({
	__name: "ViewerOverlayHost",
	setup(t) {
		let n = j(null), r = null;
		return P(() => {
			r = e(n.value);
		}), p(() => {
			r?.(), r = null;
		}), (e, t) => (T(), k("div", {
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
}), R = {
	key: 0,
	class: "mjr-context-menu-separator"
}, ee = { class: "mjr-context-menu-item-left" }, te = { class: "mjr-context-menu-item-right" }, z = {
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
}, W = /* @__PURE__ */ x({
	__name: "ViewerContextMenu",
	setup(e) {
		let t = j(null), n = j(null), a = j(null), o = null, c = null, l = C(() => x(u.main, 10041)), d = C(() => x(u.submenu, 10042)), f = C(() => x(u.tags, 10043));
		function x(e, t) {
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
		function L() {
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
			await b(), W(e, t?.value || null);
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
			Array.isArray(e?.submenu) && e.submenu.length && L();
		}
		function Z() {
			I();
		}
		function ne() {
			L();
		}
		function re(e) {
			let i = e?.target;
			t.value?.contains?.(i) || n.value?.contains?.(i) || a.value?.contains?.(i) || r();
		}
		function Q(e) {
			e?.key === "Escape" && r();
		}
		function $() {
			r();
		}
		function ie(e) {
			let t = e?.detail;
			String(t?.source || "") !== "viewer" && r();
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
		return y(() => u.main.open, async (e) => {
			e && (await G(u.main, t), K(t));
		}), y(() => u.submenu.open, async (e) => {
			e && (await G(u.submenu, n), K(n));
		}), y(() => u.tags.open, async (e) => {
			e && await G(u.tags, a);
		}), P(() => {
			c = new AbortController();
			let e = {
				capture: !0,
				passive: !0,
				signal: c.signal
			};
			window.addEventListener("pointerdown", re, e), window.addEventListener("keydown", Q, {
				capture: !0,
				signal: c.signal
			}), window.addEventListener("scroll", $, e), window.addEventListener("wheel", $, e), window.addEventListener("resize", $, {
				passive: !0,
				signal: c.signal
			}), window.addEventListener("mjr-close-all-menus", ie, { signal: c.signal });
		}), p(() => {
			I();
			try {
				c?.abort();
			} catch (e) {
				console.debug?.(e);
			}
			c = null, r();
		}), (e, r) => {
			let i = _("MButton");
			return T(), h(N, { to: "body" }, [
				A(u).main.open ? (T(), k("div", {
					key: 0,
					ref_key: "mainMenuRef",
					ref: t,
					class: "mjr-viewer-context-menu mjr-context-menu",
					style: E(l.value),
					role: "menu",
					"aria-label": "Viewer context menu"
				}, [(T(!0), k(m, null, w(A(u).main.items, (e) => (T(), k(m, { key: e.id }, [e.type === "separator" ? (T(), k("div", R)) : (T(), h(i, {
					key: 1,
					type: "button",
					class: M(["mjr-context-menu-item", {
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
					default: v(() => [g("span", ee, [e.iconClass ? (T(), k("i", {
						key: 0,
						class: M(e.iconClass)
					}, null, 2)) : S("", !0), g("span", null, D(e.label), 1)]), g("span", te, [e.rightHint ? (T(), k("span", z, D(e.rightHint), 1)) : S("", !0), Array.isArray(e.submenu) && e.submenu.length ? (T(), k("span", B, " > ")) : S("", !0)])]),
					_: 2
				}, 1032, [
					"class",
					"aria-disabled",
					"tabindex",
					"onClick",
					"onMouseenter",
					"onMouseleave"
				]))], 64))), 128))], 4)) : S("", !0),
				A(u).submenu.open ? (T(), k("div", {
					key: 1,
					ref_key: "submenuRef",
					ref: n,
					class: "mjr-viewer-rating-submenu mjr-context-menu",
					style: E(d.value),
					role: "menu",
					"aria-label": "Viewer context submenu",
					onMouseenter: Z,
					onMouseleave: ne
				}, [(T(!0), k(m, null, w(A(u).submenu.items, (e) => (T(), k(m, { key: e.id }, [e.type === "separator" ? (T(), k("div", V)) : (T(), h(i, {
					key: 1,
					type: "button",
					class: M(["mjr-context-menu-item", { "is-disabled": e.disabled }]),
					severity: "secondary",
					text: "",
					role: "menuitem",
					"aria-disabled": e.disabled ? "true" : "false",
					tabindex: e.disabled ? -1 : 0,
					onClick: (t) => J(e, t, "submenu")
				}, {
					default: v(() => [g("span", H, [e.iconClass ? (T(), k("i", {
						key: 0,
						class: M(e.iconClass)
					}, null, 2)) : S("", !0), g("span", null, D(e.label), 1)]), e.rightHint ? (T(), k("span", U, D(e.rightHint), 1)) : S("", !0)]),
					_: 2
				}, 1032, [
					"class",
					"aria-disabled",
					"tabindex",
					"onClick"
				]))], 64))), 128))], 36)) : S("", !0),
				A(u).tags.open && A(u).tags.asset ? (T(), k("div", {
					key: 2,
					ref_key: "tagsPopoverRef",
					ref: a,
					class: "mjr-viewer-popover",
					style: E(f.value)
				}, [O(F, {
					asset: A(u).tags.asset,
					"model-value": A(u).tags.asset?.tags || [],
					"onUpdate:modelValue": ae,
					onTagsChange: oe
				}, null, 8, ["asset", "model-value"])], 4)) : S("", !0)
			]);
		};
	}
}), G = /* @__PURE__ */ x({
	__name: "ViewerContextMenuPortal",
	setup(e) {
		let t = j(""), n = C(() => c(t.value));
		return P(() => {
			t.value = a();
		}), p(() => {
			o(t.value), t.value = "";
		}), (e, t) => n.value ? (T(), h(W, { key: 0 })) : S("", !0);
	}
}), K = /* @__PURE__ */ x({
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
		return P(() => {
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
		}), p(() => {
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
		}), (e, t) => (T(), k(m, null, [
			O(L),
			O(I),
			O(G)
		], 64));
	}
});
//#endregion
export { K as default };
