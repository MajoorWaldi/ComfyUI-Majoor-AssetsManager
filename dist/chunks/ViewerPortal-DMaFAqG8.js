import { $t as e, P as t, a as n, g as r, i, x as a, y as o } from "./viewerRuntimeHosts-XPTU8ZhU.js";
import { at as s, m as c, mt as l, r as u, t as d } from "./events-CttACGx4.js";
import { c as f, d as p, f as m, l as h, o as g, r as _, s as v, u as ee } from "./viewerOpenRequest-CZXk8yvU.js";
import { i as y, n as te, t as ne, tt as b } from "./SidebarWorkflowSection-DrSf3i6L.js";
import { i as x, r as S } from "./floatingViewerManager-CLgIT9uN.js";
import { $ as C, A as w, B as re, C as T, D as E, E as D, H as O, J as ie, K as k, M as A, O as j, P as M, Q as N, S as P, T as F, U as I, V as ae, W as L, X as R, Y as oe, b as se, gt as z, ht as B, j as V, k as H, lt as ce, mt as U, ot as le, pt as W, q as ue, rt as de, st as G, w as fe, z as pe } from "./mjr-primevue-C07IsEdU.js";
import { r as me } from "./model3dRenderer-CIUrxTBK.js";
import { n as he, t as ge } from "./TagsEditor-CZP7xeZ3.js";
import { _ as K, a as q, b as _e, c as J, d as ve, f as ye, g as be, h as Y, i as xe, l as Se, m as X, n as Ce, o as we, p as Te, r as Ee, s as De, t as Oe, u as ke, v as Ae, y as je } from "./StudioPlayer-ZPvmvcGX.js";
import { t as Me } from "./genInfo-B9wv7JDq.js";
// ui/vue/components/viewer/FloatingViewerHost.vue
var Ne = /* @__PURE__ */ M({
	__name: "FloatingViewerHost",
	setup(e) {
		let t = G(null), n = null;
		return O(() => {
			n = i(t.value);
		}), I(() => {
			n?.(), n = null;
		}), (e, n) => (L(), H("div", {
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
}), Pe = /* @__PURE__ */ M({
	__name: "ViewerOverlayHost",
	setup(e) {
		let t = G(null), r = null;
		return O(() => {
			r = n(t.value);
		}), I(() => {
			r?.(), r = null;
		}), (e, n) => (L(), H("div", {
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
}), Fe = {
	key: 0,
	class: "mjr-context-menu-separator"
}, Z = { class: "mjr-context-menu-item-left" }, Ie = { class: "mjr-context-menu-item-right" }, Le = {
	key: 0,
	class: "mjr-context-menu-hint"
}, Re = {
	key: 1,
	class: "mjr-context-menu-submenu-arrow"
}, ze = {
	key: 0,
	class: "mjr-context-menu-separator"
}, Be = { class: "mjr-context-menu-item-left" }, Ve = {
	key: 0,
	class: "mjr-context-menu-hint"
}, He = /* @__PURE__ */ M({
	__name: "ViewerContextMenu",
	setup(e) {
		let t = G(null), n = G(null), r = G(null), i = null, a = null, o = F(() => l(m.main, 10041)), s = F(() => l(m.submenu, 10042)), c = F(() => l(m.tags, 10043));
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
			await re(), p(e, t?.value || null);
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
			ee({
				x: Math.round((n?.right || m.main.x || 0) + 6),
				y: Math.round((n?.top || m.main.y || 0) - 4),
				items: e.submenu,
				title: e.label || ""
			});
		}
		async function y(e, t, n = "main") {
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
		function te(e, t) {
			Array.isArray(e?.submenu) && e.submenu.length ? _(e, t) : f();
		}
		function ne(e) {
			Array.isArray(e?.submenu) && e.submenu.length && d();
		}
		function b() {
			u();
		}
		function x() {
			d();
		}
		function S(e) {
			let i = e?.target;
			t.value?.contains?.(i) || n.value?.contains?.(i) || r.value?.contains?.(i) || v();
		}
		function C(e) {
			e?.key === "Escape" && v();
		}
		function w() {
			v();
		}
		function M(e) {
			let t = e?.detail;
			String(t?.source || "") !== "viewer" && v();
		}
		function P(e) {
			let t = m.tags.asset;
			t && (t.tags = Array.isArray(e) ? [...e] : []);
		}
		function ae(e) {
			let t = Array.isArray(e?.tags) ? e.tags : [];
			try {
				m.tags.onChanged?.(t);
			} catch (e) {
				console.debug?.(e);
			}
		}
		return R(() => m.main.open, async (e) => {
			e && (await h(m.main, t), g(t));
		}), R(() => m.submenu.open, async (e) => {
			e && (await h(m.submenu, n), g(n));
		}), R(() => m.tags.open, async (e) => {
			e && await h(m.tags, r);
		}), O(() => {
			a = new AbortController();
			let e = {
				capture: !0,
				passive: !0,
				signal: a.signal
			};
			window.addEventListener("pointerdown", S, e), window.addEventListener("keydown", C, {
				capture: !0,
				signal: a.signal
			}), window.addEventListener("scroll", w, e), window.addEventListener("wheel", w, e), window.addEventListener("resize", w, {
				passive: !0,
				signal: a.signal
			}), window.addEventListener("mjr-close-all-menus", M, { signal: a.signal });
		}), I(() => {
			u();
			try {
				a?.abort();
			} catch (e) {
				console.debug?.(e);
			}
			a = null, v();
		}), (e, i) => {
			let a = ie("MButton");
			return L(), E(fe, { to: "body" }, [
				W(m).main.open ? (L(), H("div", {
					key: 0,
					ref_key: "mainMenuRef",
					ref: t,
					class: "mjr-viewer-context-menu mjr-context-menu",
					style: B(o.value),
					role: "menu",
					"aria-label": "Viewer context menu"
				}, [(L(!0), H(T, null, k(W(m).main.items, (e) => (L(), H(T, { key: e.id }, [e.type === "separator" ? (L(), H("div", Fe)) : (L(), E(a, {
					key: 1,
					type: "button",
					class: U(["mjr-context-menu-item", {
						"is-disabled": e.disabled,
						"has-submenu": Array.isArray(e.submenu) && e.submenu.length
					}]),
					severity: "secondary",
					text: "",
					role: "menuitem",
					"aria-disabled": e.disabled ? "true" : "false",
					tabindex: e.disabled ? -1 : 0,
					onClick: (t) => y(e, t),
					onMouseenter: (t) => te(e, t),
					onMouseleave: (t) => ne(e)
				}, {
					default: N(() => [D("span", Z, [e.iconClass ? (L(), H("i", {
						key: 0,
						class: U(e.iconClass)
					}, null, 2)) : j("", !0), D("span", null, z(e.label), 1)]), D("span", Ie, [e.rightHint ? (L(), H("span", Le, z(e.rightHint), 1)) : j("", !0), Array.isArray(e.submenu) && e.submenu.length ? (L(), H("span", Re, " > ")) : j("", !0)])]),
					_: 2
				}, 1032, [
					"class",
					"aria-disabled",
					"tabindex",
					"onClick",
					"onMouseenter",
					"onMouseleave"
				]))], 64))), 128))], 4)) : j("", !0),
				W(m).submenu.open ? (L(), H("div", {
					key: 1,
					ref_key: "submenuRef",
					ref: n,
					class: "mjr-viewer-rating-submenu mjr-context-menu",
					style: B(s.value),
					role: "menu",
					"aria-label": "Viewer context submenu",
					onMouseenter: b,
					onMouseleave: x
				}, [(L(!0), H(T, null, k(W(m).submenu.items, (e) => (L(), H(T, { key: e.id }, [e.type === "separator" ? (L(), H("div", ze)) : (L(), E(a, {
					key: 1,
					type: "button",
					class: U(["mjr-context-menu-item", { "is-disabled": e.disabled }]),
					severity: "secondary",
					text: "",
					role: "menuitem",
					"aria-disabled": e.disabled ? "true" : "false",
					tabindex: e.disabled ? -1 : 0,
					onClick: (t) => y(e, t, "submenu")
				}, {
					default: N(() => [D("span", Be, [e.iconClass ? (L(), H("i", {
						key: 0,
						class: U(e.iconClass)
					}, null, 2)) : j("", !0), D("span", null, z(e.label), 1)]), e.rightHint ? (L(), H("span", Ve, z(e.rightHint), 1)) : j("", !0)]),
					_: 2
				}, 1032, [
					"class",
					"aria-disabled",
					"tabindex",
					"onClick"
				]))], 64))), 128))], 36)) : j("", !0),
				W(m).tags.open && W(m).tags.asset ? (L(), H("div", {
					key: 2,
					ref_key: "tagsPopoverRef",
					ref: r,
					class: "mjr-viewer-popover",
					style: B(c.value)
				}, [A(ge, {
					asset: W(m).tags.asset,
					"model-value": W(m).tags.asset?.tags || [],
					"onUpdate:modelValue": P,
					onTagsChange: ae
				}, null, 8, ["asset", "model-value"])], 4)) : j("", !0)
			]);
		};
	}
}), Ue = /* @__PURE__ */ M({
	__name: "ViewerContextMenuPortal",
	setup(e) {
		let t = G(""), n = F(() => h(t.value));
		return O(() => {
			t.value = g();
		}), I(() => {
			p(t.value), t.value = "";
		}), (e, t) => n.value ? (L(), E(He, { key: 0 })) : j("", !0);
	}
}), We = null, Ge = null;
function Ke(e, t, n) {
	let r = e || document.createElement("canvas");
	return r.width !== t && (r.width = t), r.height !== n && (r.height = n), {
		c: r,
		ctx: r.getContext("2d", { willReadFrequently: !0 })
	};
}
function qe(e) {
	return e ? e instanceof HTMLVideoElement ? {
		w: e.videoWidth || 0,
		h: e.videoHeight || 0
	} : e instanceof HTMLImageElement ? {
		w: e.naturalWidth || 0,
		h: e.naturalHeight || 0
	} : {
		w: e.width || 0,
		h: e.height || 0
	} : {
		w: 0,
		h: 0
	};
}
function Je(e) {
	return e ? e instanceof HTMLVideoElement ? e.readyState >= 2 && e.videoWidth > 0 : e instanceof HTMLImageElement ? e.complete && e.naturalWidth > 0 : e.width > 0 : !1;
}
function Ye(e, t = 256) {
	if (!Je(e)) return null;
	let { w: n, h: r } = qe(e), i = _e(n, r, t);
	if (!i.w || !i.h) return null;
	try {
		let { c: t, ctx: n } = Ke(We, i.w, i.h);
		return We = t, n ? (n.clearRect(0, 0, i.w, i.h), n.drawImage(e, 0, 0, i.w, i.h), {
			data: n.getImageData(0, 0, i.w, i.h).data,
			width: i.w,
			height: i.h
		}) : null;
	} catch {
		return null;
	}
}
function Xe(e, t, n) {
	if (!Je(e)) return null;
	let { w: r, h: i } = qe(e), a = Math.floor(t), o = Math.floor(n);
	if (a < 0 || o < 0 || a >= r || o >= i) return null;
	try {
		let { c: t, ctx: n } = Ke(Ge, 1, 1);
		if (Ge = t, !n) return null;
		n.clearRect(0, 0, 1, 1), n.drawImage(e, a, o, 1, 1, 0, 0, 1, 1);
		let r = n.getImageData(0, 0, 1, 1).data;
		return [
			r[0],
			r[1],
			r[2],
			r[3]
		];
	} catch {
		return null;
	}
}
function Ze(e, t, n, r, i) {
	if (!Je(t)) return !1;
	let a = e.getContext("2d");
	if (!a) return !1;
	let o = e.width / Math.max(1, i);
	try {
		return a.imageSmoothingEnabled = !1, a.fillStyle = "#111", a.fillRect(0, 0, e.width, e.height), a.drawImage(t, Math.floor(n - o / 2), Math.floor(r - o / 2), Math.ceil(o), Math.ceil(o), 0, 0, e.width, e.height), !0;
	} catch {
		return !1;
	}
}
async function Qe(e) {
	if (!Je(e)) return null;
	let { w: t, h: n } = qe(e), r = document.createElement("canvas");
	r.width = t, r.height = n;
	try {
		return r.getContext("2d")?.drawImage(e, 0, 0), await new Promise((e) => r.toBlob(e, "image/png"));
	} catch {
		return null;
	}
}
// ui/features/viewer/studio/studioViewerState.ts
var Q = le({
	open: !1,
	assets: [],
	index: 0,
	session: 0,
	compare: ""
});
function $e(e = "") {
	let t = String(e || "").trim().toLowerCase();
	return t === "ab" ? "wipe" : t === "sidebyside" ? "side" : "";
}
function et(e, t = 0, n = "") {
	let r = (Array.isArray(e) ? e : []).filter(Boolean);
	return r.length ? (Q.assets = r, Q.index = Math.max(0, Math.min(Number(t) || 0, r.length - 1)), Q.compare = r.length > 1 ? $e(n) : "", Q.session += 1, Q.open = !0, !0) : !1;
}
function tt() {
	Q.open = !1;
}
function nt(e) {
	let t = Q.assets.length;
	t && (Q.index = (Math.floor(e) % t + t) % t);
}
function rt(e) {
	nt(Q.index + e);
}
function it(e, t, n = "") {
	try {
		if (b()?.viewer?.classic === !0) return !1;
	} catch (e) {
		console.debug?.(e);
	}
	let r = Array.isArray(e) ? e : [];
	return !!r[Math.max(0, Math.min(Number(t) || 0, r.length - 1))];
}
// ui/vue/components/viewer/studio/StudioFxDefs.vue?vue&type=script&setup=true&lang.ts
var at = {
	class: "mjr-studio-fx-defs",
	width: "0",
	height: "0",
	"aria-hidden": "true",
	focusable: "false"
}, ot = ["id"], st = ["href"], ct = ["in"], lt = ["slope"], ut = ["slope"], dt = ["slope"], ft = {
	in: "mjrExposed",
	result: "mjrGamma"
}, pt = ["exponent"], mt = ["exponent"], ht = ["exponent"], gt = ["values"], _t = /* @__PURE__ */ M({
	__name: "StudioFxDefs",
	props: {
		filterId: {},
		channel: {},
		exposure: {},
		gamma: {},
		subtractSrc: {}
	},
	setup(e) {
		let t = e, n = F(() => J(t.channel)), r = F(() => X(t.exposure)), i = F(() => be(t.gamma));
		return (t, a) => (L(), H("svg", at, [D("defs", null, [D("filter", {
			id: e.filterId,
			x: "0",
			y: "0",
			width: "1",
			height: "1",
			filterUnits: "objectBoundingBox",
			primitiveUnits: "objectBoundingBox",
			"color-interpolation-filters": "sRGB"
		}, [
			e.subtractSrc ? (L(), H(T, { key: 0 }, [D("feImage", {
				href: e.subtractSrc,
				x: "0",
				y: "0",
				width: "1",
				height: "1",
				preserveAspectRatio: "none",
				result: "mjrB"
			}, null, 8, st), a[0] ||= w("<feComponentTransfer in=\"mjrB\" result=\"mjrInvB\"><feFuncR type=\"table\" tableValues=\"1 0\"></feFuncR><feFuncG type=\"table\" tableValues=\"1 0\"></feFuncG><feFuncB type=\"table\" tableValues=\"1 0\"></feFuncB></feComponentTransfer><feComposite in=\"SourceGraphic\" in2=\"mjrInvB\" operator=\"arithmetic\" k1=\"0\" k2=\"1\" k3=\"1\" k4=\"-1\" result=\"mjrBase\"></feComposite>", 2)], 64)) : j("", !0),
			D("feComponentTransfer", {
				in: e.subtractSrc ? "mjrBase" : "SourceGraphic",
				result: "mjrExposed"
			}, [
				D("feFuncR", {
					type: "linear",
					slope: r.value
				}, null, 8, lt),
				D("feFuncG", {
					type: "linear",
					slope: r.value
				}, null, 8, ut),
				D("feFuncB", {
					type: "linear",
					slope: r.value
				}, null, 8, dt)
			], 8, ct),
			D("feComponentTransfer", ft, [
				D("feFuncR", {
					type: "gamma",
					amplitude: "1",
					exponent: i.value,
					offset: "0"
				}, null, 8, pt),
				D("feFuncG", {
					type: "gamma",
					amplitude: "1",
					exponent: i.value,
					offset: "0"
				}, null, 8, mt),
				D("feFuncB", {
					type: "gamma",
					amplitude: "1",
					exponent: i.value,
					offset: "0"
				}, null, 8, ht)
			]),
			n.value ? (L(), H("feColorMatrix", {
				key: 1,
				in: "mjrGamma",
				type: "matrix",
				values: n.value
			}, null, 8, gt)) : j("", !0)
		], 8, ot)])]));
	}
}), vt = ["viewBox"], yt = ["d", "fill"], bt = [
	"x",
	"y",
	"width",
	"height"
], xt = [
	"x1",
	"y1",
	"x2",
	"y2"
], St = [
	"x",
	"y",
	"width",
	"height"
], Ct = /* @__PURE__ */ M({
	__name: "StudioGuides",
	props: {
		width: {},
		height: {},
		grid: {},
		aspect: {},
		maskOpacity: {}
	},
	setup(e) {
		let t = e, n = F(() => K(t.width, t.height, t.grid)), r = F(() => De(t.width, t.height, t.aspect)), i = F(() => {
			let e = r.value;
			if (!e) return "";
			let { width: n, height: i } = t;
			return `M0 0H${n}V${i}H0Z M${e.x} ${e.y}V${e.y + e.h}H${e.x + e.w}V${e.y}Z`;
		}), a = F(() => t.width > 0 && t.height > 0 && (t.grid !== "off" || !!r.value));
		return (t, o) => a.value ? (L(), H("svg", {
			key: 0,
			class: "mjr-studio-guides",
			viewBox: `0 0 ${e.width} ${e.height}`,
			preserveAspectRatio: "none",
			"aria-hidden": "true"
		}, [
			i.value ? (L(), H("path", {
				key: 0,
				d: i.value,
				"fill-rule": "evenodd",
				fill: `rgba(0,0,0,${e.maskOpacity})`
			}, null, 8, yt)) : j("", !0),
			r.value ? (L(), H("rect", {
				key: 1,
				x: r.value.x,
				y: r.value.y,
				width: r.value.w,
				height: r.value.h,
				fill: "none",
				class: "mjr-studio-guides__mask-edge",
				"vector-effect": "non-scaling-stroke"
			}, null, 8, bt)) : j("", !0),
			(L(!0), H(T, null, k(n.value.lines, (e, t) => (L(), H("line", {
				key: `l${t}`,
				x1: e.x1,
				y1: e.y1,
				x2: e.x2,
				y2: e.y2,
				class: "mjr-studio-guides__line",
				"vector-effect": "non-scaling-stroke"
			}, null, 8, xt))), 128)),
			(L(!0), H(T, null, k(n.value.rects, (e, t) => (L(), H("rect", {
				key: `r${t}`,
				x: e.x,
				y: e.y,
				width: e.w,
				height: e.h,
				fill: "none",
				class: "mjr-studio-guides__safe",
				"vector-effect": "non-scaling-stroke"
			}, null, 8, St))), 128))
		], 8, vt)) : j("", !0);
	}
}), wt = ["src", "alt"], Tt = ["src"], Et = ["src"], Dt = {
	key: 0,
	class: "mjr-studio-stage__ab"
}, Ot = { class: "is-sep" }, kt = {
	key: 1,
	class: "mjr-studio-stage__error"
}, At = .05, jt = 32, Mt = 16, Nt = /* @__PURE__ */ M({
	__name: "StudioImageStage",
	props: {
		src: {},
		alt: { default: "" },
		checker: {
			type: Boolean,
			default: !1
		},
		mediaFilter: { default: "" },
		compareSrc: { default: null },
		compare: { default: "off" },
		wipe: { default: 50 }
	},
	emits: [
		"zoom",
		"loaded",
		"update:wipe"
	],
	setup(e, { expose: t, emit: n }) {
		let r = e, i = n, a = G(null), o = G(null), s = G(null), c = G({
			w: 0,
			h: 0
		}), l = G(1), u = G({
			x: 0,
			y: 0
		}), d = G(!0), f = G(!1), p = G(!1), m = G(!1), h = null, g = null, _ = F(() => !!r.compareSrc && r.compare !== "off"), v = F(() => _.value && r.compare === "side"), ee = F(() => _.value && (r.compare === "wipe" || r.compare === "wipeV")), y = F(() => _.value ? Se(r.compare) : null), te = F(() => _.value && r.compare !== "subtract");
		function ne() {
			return v.value ? c.value.w * 2 + Mt : c.value.w;
		}
		function b() {
			let e = a.value?.getBoundingClientRect();
			return {
				w: e?.width || 0,
				h: e?.height || 0
			};
		}
		function x() {
			let { w: e, h: t } = b();
			return !c.value.w || !c.value.h || !e || !t ? 1 : Math.min(e / ne(), t / c.value.h);
		}
		function S() {
			d.value = !0, l.value = x(), u.value = {
				x: v.value ? -((c.value.w + Mt) / 2) * l.value : 0,
				y: 0
			}, i("zoom", l.value);
		}
		function w(e, t) {
			let n = Math.max(At, Math.min(jt, e)), { w: r, h: a } = b(), o = t ? t.x - r / 2 : 0, s = t ? t.y - a / 2 : 0, c = n / l.value;
			u.value = {
				x: o - (o - u.value.x) * c,
				y: s - (s - u.value.y) * c
			}, l.value = n, d.value = !1, i("zoom", l.value);
		}
		function re(e) {
			w(l.value * e);
		}
		function T() {
			w(1), u.value = {
				x: 0,
				y: 0
			};
		}
		function E() {
			d.value ? T() : S();
		}
		function ie(e) {
			e.preventDefault();
			let t = a.value?.getBoundingClientRect(), n = Math.exp(-e.deltaY * .0015);
			w(l.value * n, t ? {
				x: e.clientX - t.left,
				y: e.clientY - t.top
			} : void 0);
		}
		function k(e) {
			e.button === 0 && (h = {
				x: e.clientX,
				y: e.clientY,
				ox: u.value.x,
				oy: u.value.y,
				id: e.pointerId
			}, p.value = !0, e.currentTarget?.setPointerCapture?.(e.pointerId));
		}
		function A(e) {
			h && (u.value = {
				x: h.ox + e.clientX - h.x,
				y: h.oy + e.clientY - h.y
			}, Math.abs(e.clientX - h.x) + Math.abs(e.clientY - h.y) > 2 && (d.value = !1));
		}
		function M(e) {
			h && e.currentTarget?.releasePointerCapture?.(h.id), h = null, p.value = !1;
		}
		function N(e) {
			let t = o.value?.getBoundingClientRect();
			if (!t || t.width <= 0 || t.height <= 0) return;
			let n = r.compare === "wipeV" ? (e.clientY - t.top) / t.height : (e.clientX - t.left) / t.width;
			i("update:wipe", Math.round(Math.max(0, Math.min(1, n)) * 1e3) / 10);
		}
		function I(e) {
			m.value = !0, e.currentTarget?.setPointerCapture?.(e.pointerId), N(e);
		}
		function oe(e) {
			m.value && N(e);
		}
		function V() {
			m.value = !1;
		}
		function ce(e) {
			let t = e.target;
			c.value = {
				w: t.naturalWidth,
				h: t.naturalHeight
			}, f.value = !1, i("loaded", {
				width: t.naturalWidth,
				height: t.naturalHeight
			}), S();
		}
		let le = F(() => ({
			width: `${c.value.w}px`,
			height: `${c.value.h}px`,
			transform: `translate(-50%, -50%) translate(${u.value.x}px, ${u.value.y}px) scale(${l.value})`,
			imageRendering: l.value >= 2 ? "pixelated" : "auto",
			"--mjr-inv-scale": String(1 / (l.value || 1))
		})), W = F(() => r.mediaFilter ? { filter: r.mediaFilter } : {}), de = F(() => {
			if (y.value) return { mixBlendMode: y.value };
			if (ee.value) {
				let e = Math.max(0, Math.min(100, r.wipe));
				return { clipPath: r.compare === "wipeV" ? `inset(${e}% 0 0 0)` : `inset(0 0 0 ${e}%)` };
			}
			return {};
		}), fe = F(() => r.compare === "wipeV" ? { top: `${r.wipe}%` } : { left: `${r.wipe}%` });
		return R(() => r.src, () => {
			c.value = {
				w: 0,
				h: 0
			}, f.value = !1;
		}), R(v, () => {
			d.value && S();
		}), O(() => {
			try {
				g = new ResizeObserver(() => {
					d.value && S();
				}), a.value && g.observe(a.value);
			} catch (e) {
				console.debug?.(e);
			}
		}), ae(() => g?.disconnect()), t({
			zoomBy: re,
			fit: S,
			actualSize: T,
			toggleFitActual: E,
			getSource: () => s.value && !f.value ? s.value : null,
			getBox: () => o.value,
			naturalSize: () => ({ ...c.value })
		}), (t, n) => (L(), H("div", {
			ref_key: "stage",
			ref: a,
			class: U(["mjr-studio-stage", {
				"is-checker": e.checker,
				"is-dragging": p.value
			}]),
			onWheel: ie,
			onPointerdown: k,
			onPointermove: A,
			onPointerup: M,
			onPointercancel: M,
			onDblclick: E
		}, [
			C(D("div", {
				class: "mjr-studio-stage__box",
				style: B(le.value)
			}, [
				D("div", {
					ref_key: "box",
					ref: o,
					class: "mjr-studio-stage__layers",
					style: B(W.value)
				}, [(L(), H("img", {
					ref_key: "img",
					ref: s,
					key: e.src,
					class: "mjr-studio-stage__img",
					src: e.src,
					alt: e.alt,
					draggable: "false",
					onLoad: ce,
					onError: n[0] ||= (e) => f.value = !0
				}, null, 40, wt)), te.value && !v.value ? (L(), H("img", {
					key: `b:${e.compareSrc}`,
					class: "mjr-studio-stage__img is-b",
					src: e.compareSrc || "",
					alt: "",
					draggable: "false",
					style: B(de.value)
				}, null, 12, Tt)) : j("", !0)], 4),
				ue(t.$slots, "overlay", {
					width: c.value.w,
					height: c.value.h
				}),
				ee.value ? (L(), H("div", {
					key: 0,
					class: U(["mjr-studio-stage__divider", {
						"is-vertical": e.compare === "wipeV",
						"is-active": m.value
					}]),
					style: B(fe.value),
					onPointerdown: P(I, ["stop"]),
					onPointermove: oe,
					onPointerup: V,
					onPointercancel: V,
					onDblclick: n[1] ||= P((e) => i("update:wipe", 50), ["stop"])
				}, [...n[2] ||= [D("span", { class: "mjr-studio-stage__divider-grip" }, null, -1)]], 38)) : j("", !0),
				te.value && v.value ? (L(), H("div", {
					key: 1,
					class: "mjr-studio-stage__side",
					style: B({
						left: `calc(100% + ${Mt}px)`,
						filter: e.mediaFilter || void 0
					})
				}, [(L(), H("img", {
					key: `side:${e.compareSrc}`,
					class: "mjr-studio-stage__img",
					src: e.compareSrc || "",
					alt: "",
					draggable: "false"
				}, null, 8, Et))], 4)) : j("", !0)
			], 4), [[se, !f.value]]),
			_.value ? (L(), H("div", Dt, [
				n[3] ||= D("span", null, "A", -1),
				D("span", Ot, z(e.compare === "wipeV" ? "/" : "|"), 1),
				n[4] ||= D("span", null, "B", -1)
			])) : j("", !0),
			f.value ? (L(), H("div", kt, [n[5] ||= D("i", {
				class: "pi pi-image",
				"aria-hidden": "true"
			}, null, -1), D("span", null, z(e.alt), 1)])) : j("", !0)
		], 34));
	}
}), Pt = /* @__PURE__ */ M({
	__name: "StudioModel3D",
	props: {
		asset: {},
		src: {}
	},
	setup(e) {
		let t = e, n = G(null), r = null;
		function i() {
			try {
				r?.querySelectorAll?.("canvas").forEach((e) => {
					e?._mjrProc?.destroy?.(), e._mjrProc = null;
				});
			} catch (e) {
				console.debug?.(e);
			}
			r?.remove(), r = null;
		}
		return O(() => {
			if (n.value && t.src) try {
				r = me(t.asset, t.src, {
					hostClassName: "mjr-model3d-host mjr-studio-model3d__host",
					canvasClassName: "mjr-model3d-render-canvas mjr-studio-model3d__canvas",
					hintText: "Rotate: left drag  Pan: right drag  Zoom: wheel or middle drag",
					disableViewerTransform: !0
				}), r && n.value.appendChild(r);
			} catch (e) {
				console.debug?.(e);
			}
		}), ae(i), (e, t) => (L(), H("div", {
			ref_key: "host",
			ref: n,
			class: "mjr-studio-model3d",
			onWheel: t[0] ||= P(() => {}, ["stop"]),
			onPointerdown: t[1] ||= P(() => {}, ["stop"]),
			onContextmenu: t[2] ||= P(() => {}, ["prevent"])
		}, null, 544));
	}
}), Ft = {
	key: 0,
	class: "mjr-studio-probe",
	"aria-hidden": "true"
}, It = ["width", "height"], Lt = { class: "is-dim" }, Rt = { class: "is-dim" }, zt = /* @__PURE__ */ M({
	__name: "StudioProbe",
	props: {
		getSource: { type: Function },
		getBox: { type: Function },
		probe: { type: Boolean },
		loupe: { type: Boolean },
		loupeSize: {},
		loupeZoom: {},
		mediaFilter: {}
	},
	setup(e) {
		let t = e, n = G(null), r = G(null), i = ce(null), a = 0, o = null;
		function s() {
			a = 0;
			let e = o;
			o = null;
			let s = t.getBox(), c = t.getSource();
			if (!e || !s || !c) return;
			let l = s.getBoundingClientRect();
			if (!(e.clientX >= l.left && e.clientX <= l.right && e.clientY >= l.top && e.clientY <= l.bottom) || l.width <= 0 || l.height <= 0) {
				r.value = null, i.value = null;
				return;
			}
			let { w: u, h: d } = qe(c), f = (e.clientX - l.left) / l.width * u, p = (e.clientY - l.top) / l.height * d;
			if (r.value = {
				x: e.clientX,
				y: e.clientY
			}, t.loupe && n.value && Ze(n.value, c, f, p, t.loupeZoom), t.probe) {
				let e = Xe(c, f, p);
				i.value = e ? {
					x: Math.floor(f),
					y: Math.floor(p),
					...Y(e[0], e[1], e[2], e[3])
				} : null;
			}
		}
		function c(e) {
			o = e, a ||= requestAnimationFrame(s);
		}
		return O(() => window.addEventListener("pointermove", c, { passive: !0 })), ae(() => {
			window.removeEventListener("pointermove", c), a && cancelAnimationFrame(a);
		}), (t, a) => r.value ? (L(), H("div", Ft, [e.loupe ? (L(), H("div", {
			key: 0,
			class: "mjr-studio-probe__loupe",
			style: B({
				left: `${r.value.x + 18}px`,
				top: `${r.value.y + 18}px`,
				width: `${e.loupeSize}px`,
				height: `${e.loupeSize}px`
			})
		}, [D("canvas", {
			ref_key: "loupeCanvas",
			ref: n,
			width: e.loupeSize,
			height: e.loupeSize,
			style: B(e.mediaFilter ? { filter: e.mediaFilter } : void 0)
		}, null, 12, It), a[0] ||= D("span", { class: "mjr-studio-probe__cross" }, null, -1)], 4)) : j("", !0), e.probe && i.value ? (L(), H("div", {
			key: 1,
			class: "mjr-studio-probe__chip",
			style: B({
				left: `${r.value.x + 18}px`,
				top: `${r.value.y + (e.loupe ? e.loupeSize + 26 : 18)}px`
			})
		}, [
			D("span", {
				class: "mjr-studio-probe__swatch",
				style: B({ background: i.value.hex })
			}, null, 4),
			D("span", null, z(i.value.hex), 1),
			D("span", Lt, z(i.value.rgb), 1),
			D("span", Rt, "L " + z(i.value.luma) + " · " + z(i.value.x) + "," + z(i.value.y), 1)
		], 4)) : j("", !0)])) : j("", !0);
	}
}), Bt = {
	class: "mjr-studio-scopes",
	"aria-label": "Scopes"
}, Vt = {
	key: 0,
	class: "mjr-studio-scopes__panel"
}, Ht = { class: "mjr-studio-scopes__label" }, Ut = {
	key: 1,
	class: "mjr-studio-scopes__panel"
}, Wt = { class: "mjr-studio-scopes__label" }, Gt = /* @__PURE__ */ M({
	__name: "StudioScopes",
	props: {
		getSource: { type: Function },
		mode: {},
		tick: {}
	},
	setup(e) {
		let t = e, n = G(null), r = G(null);
		function i(e) {
			let t = n.value, r = t?.getContext("2d");
			if (!t || !r) return;
			let i = ke(e);
			r.clearRect(0, 0, t.width, t.height), r.globalCompositeOperation = "lighter";
			let a = (e, n) => {
				r.fillStyle = n;
				for (let n = 0; n < 256; n++) {
					let a = Math.min(1, e[n] / i.max) * t.height;
					r.fillRect(n / 256 * t.width, t.height - a, t.width / 256 + .5, a);
				}
			};
			a(i.r, "rgba(255,70,70,0.75)"), a(i.g, "rgba(70,255,90,0.75)"), a(i.b, "rgba(80,140,255,0.75)"), r.globalCompositeOperation = "source-over", r.strokeStyle = "rgba(255,255,255,0.85)", r.beginPath();
			for (let e = 0; e < 256; e++) {
				let n = t.height - Math.min(1, i.l[e] / i.max) * t.height;
				e === 0 ? r.moveTo(0, n) : r.lineTo(e / 255 * t.width, n);
			}
			r.stroke();
		}
		function a(e, t, n) {
			let i = r.value, a = i?.getContext("2d");
			if (!i || !a) return;
			let o = ve(e, t, n, 256), s = a.createImageData(o.columns, 256);
			for (let e = 0; e < o.columns; e++) for (let t = 0; t < 256; t++) {
				let n = o.bins[e * 256 + t];
				if (!n) continue;
				let r = Math.min(255, 40 + n / o.max * 1200), i = ((255 - t) * o.columns + e) * 4;
				s.data[i] = 120, s.data[i + 1] = 255, s.data[i + 2] = 150, s.data[i + 3] = r;
			}
			i.width = o.columns, i.height = 256, a.putImageData(s, 0, 0);
		}
		function o() {
			if (t.mode === "off") return;
			let e = Ye(t.getSource(), 256);
			e && ((t.mode === "hist" || t.mode === "both") && i(e.data), (t.mode === "wave" || t.mode === "both") && a(e.data, e.width, e.height));
		}
		return R(() => [t.tick, t.mode], () => requestAnimationFrame(o)), O(o), (t, i) => (L(), H("div", Bt, [e.mode === "hist" || e.mode === "both" ? (L(), H("div", Vt, [D("span", Ht, z(W(c)("viewer.studio.histogram", "Histogram")), 1), D("canvas", {
			ref_key: "hist",
			ref: n,
			width: "256",
			height: "110"
		}, null, 512)])) : j("", !0), e.mode === "wave" || e.mode === "both" ? (L(), H("div", Ut, [D("span", Wt, z(W(c)("viewer.studio.waveform", "Waveform")), 1), D("canvas", {
			ref_key: "wave",
			ref: r,
			width: "256",
			height: "256",
			class: "is-wave"
		}, null, 512)])) : j("", !0)]));
	}
}), Kt = ["title"], qt = { class: "mjr-studio-slider__head" }, Jt = { class: "mjr-studio-slider__value" }, Yt = [
	"aria-label",
	"aria-valuemin",
	"aria-valuemax",
	"aria-valuenow"
], $ = /* @__PURE__ */ M({
	__name: "StudioSlider",
	props: /*@__PURE__*/ pe({
		label: {},
		min: {},
		max: {},
		step: { default: .01 },
		defaultValue: { default: void 0 },
		format: {
			type: Function,
			default: void 0
		}
	}, {
		modelValue: { required: !0 },
		modelModifiers: {}
	}),
	emits: ["update:modelValue"],
	setup(e) {
		let t = e, n = oe(e, "modelValue"), r = G(null), i = G(!1), a = F(() => (n.value - t.min) / (t.max - t.min) * 100), o = F(() => t.format ? t.format(n.value) : String(n.value));
		function s(e) {
			let n = Math.round((e - t.min) / t.step) * t.step + t.min;
			return Number(Math.max(t.min, Math.min(t.max, n)).toFixed(4));
		}
		function c(e) {
			let i = r.value?.getBoundingClientRect();
			if (!i || i.width <= 0) return;
			let a = Math.max(0, Math.min(1, (e.clientX - i.left) / i.width));
			n.value = s(t.min + a * (t.max - t.min));
		}
		function l(e) {
			i.value = !0, e.currentTarget?.setPointerCapture?.(e.pointerId), c(e);
		}
		function u(e) {
			i.value && c(e);
		}
		function d() {
			i.value = !1;
		}
		function f(e) {
			let r = e.shiftKey ? 10 : 1;
			if (e.key === "ArrowLeft" || e.key === "ArrowDown") n.value = s(n.value - t.step * r);
			else if (e.key === "ArrowRight" || e.key === "ArrowUp") n.value = s(n.value + t.step * r);
			else return;
			e.preventDefault(), e.stopPropagation();
		}
		function p() {
			t.defaultValue != null && (n.value = t.defaultValue);
		}
		return (t, i) => (L(), H("div", {
			class: "mjr-studio-slider",
			title: e.defaultValue == null ? void 0 : "Double-click to reset",
			onDblclick: p
		}, [D("div", qt, [D("span", null, z(e.label), 1), D("span", Jt, z(o.value), 1)]), D("div", {
			ref_key: "track",
			ref: r,
			class: "mjr-studio-slider__track",
			role: "slider",
			tabindex: "0",
			"aria-label": e.label,
			"aria-valuemin": e.min,
			"aria-valuemax": e.max,
			"aria-valuenow": n.value,
			onPointerdown: l,
			onPointermove: u,
			onPointerup: d,
			onPointercancel: d,
			onKeydown: f
		}, [D("div", {
			class: "mjr-studio-slider__fill",
			style: B({ width: `${a.value}%` })
		}, null, 4), D("div", {
			class: "mjr-studio-slider__knob",
			style: B({ left: `${a.value}%` })
		}, null, 4)], 40, Yt)], 40, Kt));
	}
}), Xt = ["aria-label"], Zt = {
	key: 0,
	class: "mjr-studio-rail__tag"
}, Qt = { class: "mjr-studio-rail__title" }, $t = { class: "mjr-studio-seg" }, en = { class: "mjr-studio-rail__title" }, tn = { class: "mjr-studio-rail__title" }, nn = { class: "mjr-studio-seg" }, rn = { class: "mjr-studio-rail__title" }, an = { class: "mjr-studio-seg is-wrap" }, on = { class: "mjr-studio-rail__title" }, sn = { class: "mjr-studio-seg is-wrap" }, cn = { class: "mjr-studio-rail__title" }, ln = { class: "mjr-studio-seg is-wrap" }, un = { class: "mjr-studio-rail__title" }, dn = { class: "mjr-studio-rail__title" }, fn = { class: "mjr-studio-seg is-wrap" }, pn = { class: "mjr-studio-rail__b" }, mn = ["title"], hn = { class: "mjr-studio-seg" }, gn = /* @__PURE__ */ M({
	__name: "StudioToolRail",
	props: /*@__PURE__*/ pe({
		isVideo: { type: Boolean },
		canAnalyse: { type: Boolean },
		canCompare: { type: Boolean },
		compareName: {}
	}, {
		tools: { required: !0 },
		toolsModifiers: {}
	}),
	emits: /*@__PURE__*/ pe([
		"cycle-b",
		"pin-b",
		"swap",
		"copy"
	], ["update:tools"]),
	setup(e, { expose: t, emit: n }) {
		let r = oe(e, "tools"), i = e, a = n, o = G(null), s = G(0), l = G(null), u = [
			{
				value: "rgb",
				label: "RGB"
			},
			{
				value: "r",
				label: "R"
			},
			{
				value: "g",
				label: "G"
			},
			{
				value: "b",
				label: "B"
			},
			{
				value: "a",
				label: "A"
			},
			{
				value: "l",
				label: "Luma"
			}
		], d = [
			{
				value: "off",
				label: "Off"
			},
			{
				value: "hist",
				label: "Histogram"
			},
			{
				value: "wave",
				label: "Waveform"
			},
			{
				value: "both",
				label: "Both"
			}
		], f = [
			{
				value: "off",
				label: "Off"
			},
			{
				value: "thirds",
				label: "Thirds"
			},
			{
				value: "golden",
				label: "Golden"
			},
			{
				value: "center",
				label: "Center"
			},
			{
				value: "safe",
				label: "Safe areas"
			}
		], p = [
			{
				value: "off",
				label: "Off"
			},
			{
				value: "16:9",
				label: "16:9"
			},
			{
				value: "9:16",
				label: "9:16"
			},
			{
				value: "1:1",
				label: "1:1"
			},
			{
				value: "4:3",
				label: "4:3"
			},
			{
				value: "2.39",
				label: "2.39"
			}
		], m = F(() => we.filter((e) => !(i.isVideo && e.imageOnly))), h = F(() => Math.abs(r.value.exposure) > .001 || Math.abs(r.value.gamma - 1) > .001);
		function g(e, t) {
			if (o.value === e) {
				o.value = null;
				return;
			}
			let n = t.currentTarget, r = l.value?.getBoundingClientRect().top ?? 0;
			s.value = Math.max(0, (n?.getBoundingClientRect().top ?? r) - r), o.value = e;
		}
		function _() {
			let e = Te();
			r.value.exposure = e.exposure, r.value.gamma = e.gamma;
		}
		function v() {
			let e = Te();
			Object.assign(r.value, {
				...e,
				loupeSize: r.value.loupeSize,
				loupeZoom: r.value.loupeZoom
			}), o.value = null;
		}
		function ee(e) {
			r.value.compare = r.value.compare === e ? "off" : e;
		}
		function y(e) {
			o.value && (l.value?.contains(e.target) || (o.value = null));
		}
		O(() => {
			document.addEventListener("pointerdown", y, !0);
		}), ae(() => {
			document.removeEventListener("pointerdown", y, !0);
		});
		let te = (e) => `${e > 0 ? "+" : ""}${e.toFixed(2)} EV`, ne = (e) => e.toFixed(2), b = (e) => `${Math.round(e * 100)}%`, x = (e) => `${e}×`, S = (e) => `${e}px`;
		function C() {
			return o.value ? (o.value = null, !0) : !1;
		}
		return t({ closePanel: C }), (t, n) => {
			let i = ie("MButton");
			return L(), H("div", {
				ref_key: "rail",
				ref: l,
				class: "mjr-studio-rail",
				onPointerdown: n[24] ||= P(() => {}, ["stop"]),
				onWheel: n[25] ||= P(() => {}, ["stop"]),
				onDblclick: n[26] ||= P(() => {}, ["stop"])
			}, [D("div", {
				class: "mjr-studio-rail__bar",
				role: "toolbar",
				"aria-label": W(c)("viewer.studio.tools", "Review tools")
			}, [
				e.canAnalyse ? (L(), H(T, { key: 0 }, [
					A(i, {
						type: "button",
						class: U(["mjr-studio-rail__btn", {
							"is-on": r.value.channel !== "rgb",
							"is-open": o.value === "channels"
						}]),
						title: W(c)("viewer.studio.channels", "Channels"),
						onClick: n[0] ||= (e) => g("channels", e)
					}, {
						default: N(() => [n[27] ||= D("i", {
							class: "pi pi-palette",
							"aria-hidden": "true"
						}, null, -1), r.value.channel === "rgb" ? j("", !0) : (L(), H("span", Zt, z(r.value.channel.toUpperCase()), 1))]),
						_: 1
					}, 8, ["class", "title"]),
					A(i, {
						type: "button",
						class: U(["mjr-studio-rail__btn", {
							"is-on": h.value,
							"is-open": o.value === "exposure"
						}]),
						title: W(c)("viewer.studio.exposure", "Exposure / gamma"),
						onClick: n[1] ||= (e) => g("exposure", e)
					}, {
						default: N(() => [...n[28] ||= [D("i", {
							class: "pi pi-bolt",
							"aria-hidden": "true"
						}, null, -1)]]),
						_: 1
					}, 8, ["class", "title"]),
					A(i, {
						type: "button",
						class: U(["mjr-studio-rail__btn", {
							"is-on": r.value.zebra,
							"is-open": o.value === "zebra"
						}]),
						title: W(c)("viewer.studio.zebra", "Zebra highlights (Z)"),
						onClick: n[2] ||= (e) => g("zebra", e)
					}, {
						default: N(() => [...n[29] ||= [D("i", {
							class: "pi pi-exclamation-triangle",
							"aria-hidden": "true"
						}, null, -1)]]),
						_: 1
					}, 8, ["class", "title"]),
					A(i, {
						type: "button",
						class: U(["mjr-studio-rail__btn", {
							"is-on": r.value.scopes !== "off",
							"is-open": o.value === "scopes"
						}]),
						title: W(c)("viewer.studio.scopes", "Scopes (S)"),
						onClick: n[3] ||= (e) => g("scopes", e)
					}, {
						default: N(() => [...n[30] ||= [D("i", {
							class: "pi pi-chart-bar",
							"aria-hidden": "true"
						}, null, -1)]]),
						_: 1
					}, 8, ["class", "title"]),
					n[31] ||= D("span", { class: "mjr-studio-rail__sep" }, null, -1)
				], 64)) : j("", !0),
				A(i, {
					type: "button",
					class: U(["mjr-studio-rail__btn", {
						"is-on": r.value.grid !== "off",
						"is-open": o.value === "grid"
					}]),
					title: W(c)("viewer.studio.grid", "Guides (G)"),
					onClick: n[4] ||= (e) => g("grid", e)
				}, {
					default: N(() => [...n[32] ||= [D("i", {
						class: "pi pi-th-large",
						"aria-hidden": "true"
					}, null, -1)]]),
					_: 1
				}, 8, ["class", "title"]),
				A(i, {
					type: "button",
					class: U(["mjr-studio-rail__btn", {
						"is-on": r.value.aspect !== "off",
						"is-open": o.value === "aspect"
					}]),
					title: W(c)("viewer.studio.aspect", "Aspect ratio mask"),
					onClick: n[5] ||= (e) => g("aspect", e)
				}, {
					default: N(() => [...n[33] ||= [D("i", {
						class: "pi pi-stop",
						"aria-hidden": "true"
					}, null, -1)]]),
					_: 1
				}, 8, ["class", "title"]),
				e.canAnalyse ? (L(), H(T, { key: 1 }, [
					n[36] ||= D("span", { class: "mjr-studio-rail__sep" }, null, -1),
					A(i, {
						type: "button",
						class: U(["mjr-studio-rail__btn", { "is-on": r.value.probe }]),
						title: W(c)("viewer.studio.probe", "Pixel probe (P)"),
						onClick: n[6] ||= (e) => r.value.probe = !r.value.probe
					}, {
						default: N(() => [...n[34] ||= [D("i", {
							class: "pi pi-map-marker",
							"aria-hidden": "true"
						}, null, -1)]]),
						_: 1
					}, 8, ["class", "title"]),
					A(i, {
						type: "button",
						class: U(["mjr-studio-rail__btn", {
							"is-on": r.value.loupe,
							"is-open": o.value === "loupe"
						}]),
						title: W(c)("viewer.studio.loupe", "Loupe (L) - right-click for settings"),
						onClick: n[7] ||= (e) => r.value.loupe = !r.value.loupe,
						onContextmenu: n[8] ||= P((e) => g("loupe", e), ["prevent"])
					}, {
						default: N(() => [...n[35] ||= [D("i", {
							class: "pi pi-search-plus",
							"aria-hidden": "true"
						}, null, -1)]]),
						_: 1
					}, 8, ["class", "title"])
				], 64)) : j("", !0),
				e.canCompare ? (L(), H(T, { key: 2 }, [n[38] ||= D("span", { class: "mjr-studio-rail__sep" }, null, -1), A(i, {
					type: "button",
					class: U(["mjr-studio-rail__btn", {
						"is-on": r.value.compare !== "off",
						"is-open": o.value === "compare"
					}]),
					title: W(c)("viewer.studio.compareTool", "Compare A/B (C)"),
					onClick: n[9] ||= (e) => g("compare", e)
				}, {
					default: N(() => [...n[37] ||= [D("i", {
						class: "pi pi-clone",
						"aria-hidden": "true"
					}, null, -1)]]),
					_: 1
				}, 8, ["class", "title"])], 64)) : j("", !0),
				n[41] ||= D("span", { class: "mjr-studio-rail__sep" }, null, -1),
				e.canAnalyse ? (L(), E(i, {
					key: 3,
					type: "button",
					class: "mjr-studio-rail__btn",
					title: W(c)("viewer.studio.copy", "Copy image / frame to clipboard"),
					onClick: n[10] ||= (e) => a("copy")
				}, {
					default: N(() => [...n[39] ||= [D("i", {
						class: "pi pi-copy",
						"aria-hidden": "true"
					}, null, -1)]]),
					_: 1
				}, 8, ["title"])) : j("", !0),
				A(i, {
					type: "button",
					class: "mjr-studio-rail__btn",
					title: W(c)("viewer.studio.resetTools", "Reset all tools (R)"),
					onClick: v
				}, {
					default: N(() => [...n[40] ||= [D("i", {
						class: "pi pi-refresh",
						"aria-hidden": "true"
					}, null, -1)]]),
					_: 1
				}, 8, ["title"])
			], 8, Xt), o.value ? (L(), H("div", {
				key: 0,
				class: "mjr-studio-rail__panel",
				style: B({ top: `${s.value}px` }),
				role: "dialog"
			}, [o.value === "channels" ? (L(), H(T, { key: 0 }, [D("div", Qt, z(W(c)("viewer.studio.channels", "Channels")), 1), D("div", $t, [(L(), H(T, null, k(u, (e) => A(i, {
				key: e.value,
				type: "button",
				class: U({ "is-on": r.value.channel === e.value }),
				onClick: (t) => r.value.channel = e.value
			}, {
				default: N(() => [V(z(e.label), 1)]),
				_: 2
			}, 1032, ["class", "onClick"])), 64))])], 64)) : o.value === "exposure" ? (L(), H(T, { key: 1 }, [
				D("div", en, z(W(c)("viewer.studio.exposure", "Exposure / gamma")), 1),
				A($, {
					modelValue: r.value.exposure,
					"onUpdate:modelValue": n[11] ||= (e) => r.value.exposure = e,
					label: W(c)("viewer.studio.ev", "Exposure"),
					min: -5,
					max: 5,
					step: .05,
					"default-value": 0,
					format: te
				}, null, 8, ["modelValue", "label"]),
				A($, {
					modelValue: r.value.gamma,
					"onUpdate:modelValue": n[12] ||= (e) => r.value.gamma = e,
					label: W(c)("viewer.studio.gamma", "Gamma"),
					min: .1,
					max: 3,
					step: .01,
					"default-value": 1,
					format: ne
				}, null, 8, ["modelValue", "label"]),
				A(i, {
					type: "button",
					class: "mjr-studio-btn is-text",
					onClick: _
				}, {
					default: N(() => [V(z(W(c)("viewer.studio.reset", "Reset")), 1)]),
					_: 1
				})
			], 64)) : o.value === "zebra" ? (L(), H(T, { key: 2 }, [
				D("div", tn, z(W(c)("viewer.studio.zebra", "Zebra highlights (Z)")), 1),
				D("div", nn, [A(i, {
					type: "button",
					class: U({ "is-on": !r.value.zebra }),
					onClick: n[13] ||= (e) => r.value.zebra = !1
				}, {
					default: N(() => [...n[42] ||= [V("Off", -1)]]),
					_: 1
				}, 8, ["class"]), A(i, {
					type: "button",
					class: U({ "is-on": r.value.zebra }),
					onClick: n[14] ||= (e) => r.value.zebra = !0
				}, {
					default: N(() => [...n[43] ||= [V("On", -1)]]),
					_: 1
				}, 8, ["class"])]),
				A($, {
					modelValue: r.value.zebraThreshold,
					"onUpdate:modelValue": n[15] ||= (e) => r.value.zebraThreshold = e,
					label: W(c)("viewer.studio.threshold", "Threshold"),
					min: .5,
					max: 1,
					step: .01,
					"default-value": .95,
					format: b
				}, null, 8, ["modelValue", "label"])
			], 64)) : o.value === "scopes" ? (L(), H(T, { key: 3 }, [D("div", rn, z(W(c)("viewer.studio.scopes", "Scopes (S)")), 1), D("div", an, [(L(), H(T, null, k(d, (e) => A(i, {
				key: e.value,
				type: "button",
				class: U({ "is-on": r.value.scopes === e.value }),
				onClick: (t) => r.value.scopes = e.value
			}, {
				default: N(() => [V(z(e.label), 1)]),
				_: 2
			}, 1032, ["class", "onClick"])), 64))])], 64)) : o.value === "grid" ? (L(), H(T, { key: 4 }, [D("div", on, z(W(c)("viewer.studio.grid", "Guides (G)")), 1), D("div", sn, [(L(), H(T, null, k(f, (e) => A(i, {
				key: e.value,
				type: "button",
				class: U({ "is-on": r.value.grid === e.value }),
				onClick: (t) => r.value.grid = e.value
			}, {
				default: N(() => [V(z(e.label), 1)]),
				_: 2
			}, 1032, ["class", "onClick"])), 64))])], 64)) : o.value === "aspect" ? (L(), H(T, { key: 5 }, [
				D("div", cn, z(W(c)("viewer.studio.aspect", "Aspect ratio mask")), 1),
				D("div", ln, [(L(), H(T, null, k(p, (e) => A(i, {
					key: e.value,
					type: "button",
					class: U({ "is-on": r.value.aspect === e.value }),
					onClick: (t) => r.value.aspect = e.value
				}, {
					default: N(() => [V(z(e.label), 1)]),
					_: 2
				}, 1032, ["class", "onClick"])), 64))]),
				A($, {
					modelValue: r.value.maskOpacity,
					"onUpdate:modelValue": n[16] ||= (e) => r.value.maskOpacity = e,
					label: W(c)("viewer.studio.opacity", "Opacity"),
					min: 0,
					max: 1,
					step: .05,
					"default-value": .65,
					format: b
				}, null, 8, ["modelValue", "label"])
			], 64)) : o.value === "loupe" ? (L(), H(T, { key: 6 }, [
				D("div", un, z(W(c)("viewer.studio.loupeTitle", "Loupe")), 1),
				A($, {
					modelValue: r.value.loupeZoom,
					"onUpdate:modelValue": n[17] ||= (e) => r.value.loupeZoom = e,
					label: W(c)("viewer.studio.magnification", "Magnification"),
					min: 2,
					max: 32,
					step: 1,
					"default-value": 8,
					format: x
				}, null, 8, ["modelValue", "label"]),
				A($, {
					modelValue: r.value.loupeSize,
					"onUpdate:modelValue": n[18] ||= (e) => r.value.loupeSize = e,
					label: W(c)("viewer.studio.size", "Size"),
					min: 80,
					max: 320,
					step: 10,
					"default-value": 140,
					format: S
				}, null, 8, ["modelValue", "label"])
			], 64)) : o.value === "compare" ? (L(), H(T, { key: 7 }, [
				D("div", dn, z(W(c)("viewer.studio.compareTool", "Compare A/B (C)")), 1),
				D("div", fn, [(L(!0), H(T, null, k(m.value, (e) => (L(), E(i, {
					key: e.value,
					type: "button",
					class: U({ "is-on": r.value.compare === e.value }),
					onClick: (t) => ee(e.value)
				}, {
					default: N(() => [V(z(e.label), 1)]),
					_: 2
				}, 1032, ["class", "onClick"]))), 128))]),
				D("div", pn, [
					n[46] ||= D("span", { class: "mjr-studio-rail__b-label" }, "B", -1),
					A(i, {
						type: "button",
						class: "mjr-studio-btn",
						title: W(c)("viewer.studio.prevB", "Previous B"),
						onClick: n[19] ||= (e) => a("cycle-b", -1)
					}, {
						default: N(() => [...n[44] ||= [D("i", {
							class: "pi pi-chevron-left",
							"aria-hidden": "true"
						}, null, -1)]]),
						_: 1
					}, 8, ["title"]),
					D("span", {
						class: "mjr-studio-rail__b-name",
						title: e.compareName
					}, z(e.compareName || "—"), 9, mn),
					A(i, {
						type: "button",
						class: "mjr-studio-btn",
						title: W(c)("viewer.studio.nextB", "Next B"),
						onClick: n[20] ||= (e) => a("cycle-b", 1)
					}, {
						default: N(() => [...n[45] ||= [D("i", {
							class: "pi pi-chevron-right",
							"aria-hidden": "true"
						}, null, -1)]]),
						_: 1
					}, 8, ["title"])
				]),
				D("div", hn, [A(i, {
					type: "button",
					title: W(c)("viewer.studio.pinB", "Use the current asset as B (B)"),
					onClick: n[21] ||= (e) => a("pin-b")
				}, {
					default: N(() => [n[47] ||= D("i", {
						class: "pi pi-bookmark",
						"aria-hidden": "true"
					}, null, -1), V(" " + z(W(c)("viewer.studio.pinBShort", "Set B")), 1)]),
					_: 1
				}, 8, ["title"]), A(i, {
					type: "button",
					title: W(c)("viewer.studio.swap", "Swap A and B (X)"),
					onClick: n[22] ||= (e) => a("swap")
				}, {
					default: N(() => [n[48] ||= D("i", {
						class: "pi pi-arrow-right-arrow-left",
						"aria-hidden": "true"
					}, null, -1), V(" " + z(W(c)("viewer.studio.swapShort", "Swap")), 1)]),
					_: 1
				}, 8, ["title"])]),
				r.value.compare === "wipe" || r.value.compare === "wipeV" ? (L(), E($, {
					key: 0,
					modelValue: r.value.wipe,
					"onUpdate:modelValue": n[23] ||= (e) => r.value.wipe = e,
					label: W(c)("viewer.studio.wipe", "Wipe"),
					min: 0,
					max: 100,
					step: 1,
					"default-value": 50,
					format: (e) => `${e}%`
				}, null, 8, [
					"modelValue",
					"label",
					"format"
				])) : j("", !0)
			], 64)) : j("", !0)], 4)) : j("", !0)], 544);
		};
	}
}), _n = /* @__PURE__ */ M({
	__name: "StudioZebra",
	props: {
		getSource: { type: Function },
		threshold: {},
		tick: {}
	},
	setup(e) {
		let t = e, n = G(null), r = 0;
		function i() {
			let e = n.value, i = Ye(t.getSource(), 480);
			if (!e || !i) return;
			e.width = i.width, e.height = i.height, r = (r + 1) % 8;
			let a = ye(i.data, i.width, i.height, t.threshold, r);
			e.getContext("2d")?.putImageData(new ImageData(a, i.width, i.height), 0, 0);
		}
		return R(() => [t.tick, t.threshold], i), O(i), (e, t) => (L(), H("canvas", {
			ref_key: "canvas",
			ref: n,
			class: "mjr-studio-zebra",
			"aria-hidden": "true"
		}, null, 512));
	}
}), vn = ["aria-label"], yn = { class: "mjr-studio__header" }, bn = { class: "mjr-studio__nav" }, xn = { class: "mjr-studio__counter" }, Sn = { class: "mjr-studio__title" }, Cn = ["title"], wn = { class: "mjr-studio__summary" }, Tn = { class: "mjr-studio__actions" }, En = ["title"], Dn = { class: "mjr-studio__body" }, On = {
	key: 4,
	class: "mjr-studio__unsupported"
}, kn = { class: "mjr-studio__review" }, An = { class: "mjr-studio__review-row" }, jn = { class: "mjr-studio__label" }, Mn = {
	class: "mjr-studio__tabs",
	role: "tablist"
}, Nn = { class: "mjr-studio__tab-body" }, Pn = ["aria-label"], Fn = ["src"], In = {
	key: 1,
	class: "pi pi-file",
	"aria-hidden": "true"
}, Ln = {
	key: 2,
	class: "pi pi-play mjr-studio__thumb-badge",
	"aria-hidden": "true"
}, Rn = /* @__PURE__ */ M({
	__name: "StudioViewer",
	emits: ["open-classic"],
	setup(n, { emit: i }) {
		let u = i, f = G(null), p = G(null), m = G(null), h = G(null), g = G(!0), _ = G("generation"), v = G(!1), ee = G(1), b = ce(null), x = ce(null), S = null, C = F(() => Q.assets[Q.index] ?? null), w = F(() => b.value ?? C.value), O = F(() => q(C.value)), M = F(() => C.value ? s(C.value) : ""), I = F(() => Q.assets.length), oe = F(() => Ce(w.value)), se = F(() => xe(w.value, x.value)), B = F(() => Number(x.value?.frame_count) || null), ue = F(() => Number(w.value?.rating) || 0), pe = F(() => Array.isArray(w.value?.tags) ? w.value.tags : []), me = F(() => {
			let { start: e, end: t } = Ee(I.value, Q.index);
			return Q.assets.slice(e, t).map((t, n) => ({
				asset: t,
				index: e + n
			}));
		}), K = le(Te()), _e = `mjr-studio-fx-${Math.random().toString(36).slice(2, 9)}`, J = G(null), ve = G(0), ye = null, be = -1, Y = F(() => O.value === "image" || O.value === "video"), Se = F(() => {
			if (!Y.value) return null;
			let e = J.value, t = Q.assets, n = Q.index;
			return e != null && e !== n && t[e] && q(t[e]) === O.value ? e : je(t, n, 1, (e) => q(e) === O.value);
		}), X = F(() => Se.value != null), we = F(() => Se.value == null ? null : Q.assets[Se.value]), De = F(() => K.compare !== "off" && !!we.value), ke = F(() => De.value && we.value ? s(we.value) : null), Ne = F(() => De.value && K.compare === "subtract" && O.value === "image" ? ke.value : null), Pe = F(() => Y.value && (Ae(K) || Ne.value) ? `url(#${_e})` : ""), Fe = F(() => Y.value && (K.zebra || K.scopes !== "off"));
		function Z() {
			return O.value === "image" ? p.value?.getSource?.() ?? null : O.value === "video" ? m.value?.getSource?.() ?? null : null;
		}
		function Ie() {
			return O.value === "image" ? p.value?.getBox?.() ?? null : O.value === "video" ? m.value?.getBox?.() ?? null : null;
		}
		function Le() {
			ve.value += 1;
		}
		function Re() {
			ye && clearInterval(ye), ye = null;
		}
		R([
			Fe,
			O,
			() => Q.open
		], ([e, t, n]) => {
			Re(), e && n && t === "video" && (be = -1, ye = setInterval(() => {
				let e = Z()?.currentTime ?? -1;
				e !== be && (be = e, Le());
			}, 120));
		}, { immediate: !0 }), R(Fe, (e) => {
			e && re(Le);
		});
		function ze(e) {
			let t = Se.value ?? Q.index, n = je(Q.assets, t, e, (e, t) => t !== Q.index && q(e) === O.value);
			n != null && (J.value = n);
		}
		function Be() {
			J.value = Q.index;
			let e = je(Q.assets, Q.index, 1, (e) => q(e) === O.value);
			e != null && nt(e), K.compare === "off" && (K.compare = "wipe");
		}
		function Ve() {
			let e = Se.value;
			e != null && (J.value = Q.index, nt(e));
		}
		function He() {
			X.value && (K.compare = K.compare === "off" ? "wipe" : "off");
		}
		async function Ue() {
			let t = await Qe(Z()), n = window.ClipboardItem;
			if (!t || !n || !navigator.clipboard?.write) e(c("viewer.studio.copyFailed", "Could not copy this image"), "error");
			else try {
				await navigator.clipboard.write([new n({ "image/png": t })]), e(c("viewer.studio.copied", "Copied to clipboard"), "success");
			} catch (t) {
				console.debug?.(t), e(c("viewer.studio.copyFailed", "Could not copy this image"), "error");
			}
		}
		let We = [
			"off",
			"hist",
			"wave",
			"both"
		], Ge = [
			"off",
			"thirds",
			"golden",
			"center",
			"safe"
		];
		function Ke(e, t) {
			return e[(e.indexOf(t) + 1) % e.length];
		}
		R(() => Q.session, () => {
			J.value = null, K.compare = Q.compare || "off", re(() => {
				let e = document.activeElement;
				e && f.value?.contains(e) && et(e) && e.blur(), f.value?.focus?.({ preventScroll: !0 });
			});
		}, { immediate: !0 });
		async function qe(e) {
			if (S?.abort(), b.value = null, x.value = null, !e) return;
			let t = typeof AbortController < "u" ? new AbortController() : null;
			S = t;
			try {
				let n = await Me(e, {
					getAssetMetadata: r,
					getFileMetadataScoped: o,
					signal: t?.signal
				});
				S === t && C.value === e && (b.value = n && typeof n == "object" ? n : e);
			} catch (e) {
				console.debug?.(e);
			}
			let n = q(e);
			if ((n === "video" || n === "audio") && e?.id != null) try {
				let n = await a(e.id, t ? { signal: t.signal } : {});
				S === t && n?.ok && (x.value = n.data || null);
			} catch (e) {
				console.debug?.(e);
			}
		}
		R(C, (e) => void qe(e), { immediate: !0 }), R(() => Q.open, async (e) => {
			e ? (await re(), f.value?.focus?.(), window.addEventListener("keydown", it, !0)) : (window.removeEventListener("keydown", it, !0), Re(), m.value?.release?.(), S?.abort(), document.fullscreenElement && f.value?.contains(document.fullscreenElement) && document.exitFullscreen?.());
		}, { immediate: !0 }), ae(() => {
			window.removeEventListener("keydown", it, !0), Re(), S?.abort();
		});
		function Je() {
			tt();
		}
		function Ye(e = "") {
			let t = {
				assets: Q.assets.slice(),
				index: Q.index,
				mode: e
			};
			tt(), u("open-classic", t);
		}
		function Xe() {
			document.fullscreenElement ? document.exitFullscreen?.() : f.value?.requestFullscreen?.();
		}
		function Ze() {
			if (!M.value) return;
			let e = document.createElement("a");
			e.href = M.value, e.download = String(C.value?.filename || ""), e.click();
		}
		async function $e(n) {
			let r = C.value;
			if (!r) return;
			let i = Math.max(0, Math.min(5, n)), a = await t(r, i);
			a?.ok ? (r.rating = i, b.value = b.value ? {
				...b.value,
				rating: i
			} : r, window.dispatchEvent(new CustomEvent(d, { detail: {
				assetId: r.id == null ? "" : String(r.id),
				rating: i
			} }))) : e(a?.error || c("toast.ratingUpdateFailed", "Rating update failed"), "error");
		}
		function et(e) {
			return !!e?.closest?.("input, textarea, select, [contenteditable='true']");
		}
		function it(e) {
			if (!Q.open) return;
			if (et(e.target)) {
				e.key === "Escape" && e.target?.blur?.();
				return;
			}
			let t = O.value === "video" || O.value === "audio", n = e.key, r = n.length === 1 ? n.toLowerCase() : n, i = !e.ctrlKey && !e.metaKey && !e.altKey, a = Y.value && i, o = !0;
			n === "Escape" && h.value?.closePanel?.() || (n === "Escape" ? Je() : r === "c" && (e.ctrlKey || e.metaKey) && Y.value ? Ue() : n === "ArrowLeft" && !e.shiftKey ? rt(-1) : n === "ArrowRight" && !e.shiftKey ? rt(1) : n === "ArrowLeft" && e.shiftKey && t ? m.value?.seekBy?.(-5) : n === "ArrowRight" && e.shiftKey && t ? m.value?.seekBy?.(5) : n === "Home" ? nt(0) : n === "End" ? nt(I.value - 1) : n === " " && t ? m.value?.togglePlay?.() : n === "," && t ? m.value?.stepFrame?.(-1) : n === "." && t ? m.value?.stepFrame?.(1) : (n === "i" || n === "I") && t ? m.value?.setLoopA?.() : (n === "o" || n === "O") && t ? m.value?.setLoopB?.() : (n === "u" || n === "U") && t ? m.value?.clearLoop?.() : (n === "m" || n === "M") && t ? m.value?.toggleMute?.() : n === "]" && t ? m.value?.cycleRate?.(1) : n === "[" && t ? m.value?.cycleRate?.(-1) : n === "Tab" ? g.value = !g.value : n === "f" || n === "F" ? Xe() : (n === "+" || n === "=") && O.value === "image" ? p.value?.zoomBy?.(1.25) : n === "-" && O.value === "image" ? p.value?.zoomBy?.(.8) : n === "0" && O.value === "image" && e.altKey ? p.value?.fit?.() : /^[0-5]$/.test(n) && !e.ctrlKey && !e.metaKey && !e.altKey ? $e(Number(n)) : r === "c" && i && X.value ? He() : r === "b" && i && X.value ? Be() : r === "x" && i && De.value ? Ve() : r === "z" && a ? K.zebra = !K.zebra : r === "s" && a ? K.scopes = Ke(We, K.scopes) : r === "g" && i && Y.value ? K.grid = Ke(Ge, K.grid) : r === "p" && a ? K.probe = !K.probe : r === "l" && a ? K.loupe = !K.loupe : r === "r" && a ? Object.assign(K, Te(), {
				loupeSize: K.loupeSize,
				loupeZoom: K.loupeZoom
			}) : o = !1), o && (e.preventDefault(), e.stopPropagation(), e.stopImmediatePropagation?.());
		}
		function at(e) {
			return l(e, 192) || "";
		}
		return (e, t) => {
			let n = ie("MButton");
			return L(), E(fe, { to: "body" }, [W(Q).open ? (L(), H("div", {
				key: 0,
				ref_key: "overlay",
				ref: f,
				class: U(["mjr-assets-manager mjr-studio", { "is-inspector-closed": !g.value }]),
				role: "dialog",
				"aria-modal": "true",
				"aria-label": W(c)("viewer.studio.title", "Viewer"),
				tabindex: "-1"
			}, [
				D("header", yn, [
					D("div", bn, [
						A(n, {
							type: "button",
							class: "mjr-studio-btn",
							title: W(c)("viewer.studio.prev", "Previous (←)"),
							disabled: I.value < 2,
							onClick: t[0] ||= (e) => W(rt)(-1)
						}, {
							default: N(() => [...t[16] ||= [D("i", {
								class: "pi pi-chevron-left",
								"aria-hidden": "true"
							}, null, -1)]]),
							_: 1
						}, 8, ["title", "disabled"]),
						D("span", xn, z(W(Q).index + 1) + " / " + z(I.value), 1),
						A(n, {
							type: "button",
							class: "mjr-studio-btn",
							title: W(c)("viewer.studio.next", "Next (→)"),
							disabled: I.value < 2,
							onClick: t[1] ||= (e) => W(rt)(1)
						}, {
							default: N(() => [...t[17] ||= [D("i", {
								class: "pi pi-chevron-right",
								"aria-hidden": "true"
							}, null, -1)]]),
							_: 1
						}, 8, ["title", "disabled"])
					]),
					D("div", Sn, [D("span", {
						class: "mjr-studio__filename",
						title: w.value?.filepath || w.value?.filename
					}, z(w.value?.filename), 9, Cn), D("span", wn, z(oe.value), 1)]),
					D("div", Tn, [
						O.value === "image" ? (L(), H(T, { key: 0 }, [
							D("span", {
								class: "mjr-studio-chip",
								title: W(c)("viewer.studio.zoomHint", "Wheel to zoom, double-click for fit / 100 %")
							}, z(Math.round(ee.value * 100)) + "%", 9, En),
							A(n, {
								type: "button",
								class: "mjr-studio-btn",
								title: W(c)("viewer.studio.fit", "Fit"),
								onClick: t[2] ||= (e) => p.value?.fit()
							}, {
								default: N(() => [...t[18] ||= [D("i", {
									class: "pi pi-arrows-alt",
									"aria-hidden": "true"
								}, null, -1)]]),
								_: 1
							}, 8, ["title"]),
							A(n, {
								type: "button",
								class: "mjr-studio-btn is-text",
								title: W(c)("viewer.studio.actualSize", "Actual size"),
								onClick: t[3] ||= (e) => p.value?.actualSize()
							}, {
								default: N(() => [...t[19] ||= [V("1:1", -1)]]),
								_: 1
							}, 8, ["title"]),
							A(n, {
								type: "button",
								class: U(["mjr-studio-btn", { "is-on": v.value }]),
								title: W(c)("viewer.studio.checker", "Transparency checkerboard"),
								onClick: t[4] ||= (e) => v.value = !v.value
							}, {
								default: N(() => [...t[20] ||= [D("i", {
									class: "pi pi-th-large",
									"aria-hidden": "true"
								}, null, -1)]]),
								_: 1
							}, 8, ["class", "title"])
						], 64)) : j("", !0),
						X.value ? (L(), E(n, {
							key: 1,
							type: "button",
							class: U(["mjr-studio-btn", { "is-on": De.value }]),
							title: W(c)("viewer.studio.compare", "Compare A/B (C)"),
							onClick: He
						}, {
							default: N(() => [...t[21] ||= [D("i", {
								class: "pi pi-clone",
								"aria-hidden": "true"
							}, null, -1)]]),
							_: 1
						}, 8, ["class", "title"])) : j("", !0),
						A(n, {
							type: "button",
							class: "mjr-studio-btn",
							title: W(c)("viewer.studio.download", "Download"),
							onClick: Ze
						}, {
							default: N(() => [...t[22] ||= [D("i", {
								class: "pi pi-download",
								"aria-hidden": "true"
							}, null, -1)]]),
							_: 1
						}, 8, ["title"]),
						A(n, {
							type: "button",
							class: "mjr-studio-btn",
							title: W(c)("viewer.studio.classic", "Open in the classic viewer"),
							onClick: t[5] ||= (e) => Ye("")
						}, {
							default: N(() => [...t[23] ||= [D("i", {
								class: "pi pi-sliders-h",
								"aria-hidden": "true"
							}, null, -1)]]),
							_: 1
						}, 8, ["title"]),
						A(n, {
							type: "button",
							class: U(["mjr-studio-btn", { "is-on": g.value }]),
							title: W(c)("viewer.studio.inspector", "Generation info (Tab)"),
							onClick: t[6] ||= (e) => g.value = !g.value
						}, {
							default: N(() => [...t[24] ||= [D("i", {
								class: "pi pi-info-circle",
								"aria-hidden": "true"
							}, null, -1)]]),
							_: 1
						}, 8, ["class", "title"]),
						A(n, {
							type: "button",
							class: "mjr-studio-btn",
							title: W(c)("viewer.studio.fullscreen", "Fullscreen (F)"),
							onClick: Xe
						}, {
							default: N(() => [...t[25] ||= [D("i", {
								class: "pi pi-window-maximize",
								"aria-hidden": "true"
							}, null, -1)]]),
							_: 1
						}, 8, ["title"]),
						A(n, {
							type: "button",
							class: "mjr-studio-btn is-close",
							title: W(c)("viewer.studio.close", "Close (Esc)"),
							onClick: Je
						}, {
							default: N(() => [...t[26] ||= [D("i", {
								class: "pi pi-times",
								"aria-hidden": "true"
							}, null, -1)]]),
							_: 1
						}, 8, ["title"])
					])
				]),
				D("main", Dn, [D("section", { class: U(["mjr-studio__stage", { "has-rail": Y.value }]) }, [
					Pe.value ? (L(), E(_t, {
						key: 0,
						"filter-id": _e,
						channel: W(K).channel,
						exposure: W(K).exposure,
						gamma: W(K).gamma,
						"subtract-src": Ne.value
					}, null, 8, [
						"channel",
						"exposure",
						"gamma",
						"subtract-src"
					])) : j("", !0),
					O.value === "image" ? (L(), E(Nt, {
						ref_key: "imageStage",
						ref: p,
						key: `img:${M.value}`,
						wipe: W(K).wipe,
						"onUpdate:wipe": t[7] ||= (e) => W(K).wipe = e,
						src: M.value,
						alt: C.value?.filename,
						checker: v.value,
						"media-filter": Pe.value,
						"compare-src": ke.value,
						compare: W(K).compare,
						class: U({ "is-probing": W(K).probe || W(K).loupe }),
						onZoom: t[8] ||= (e) => ee.value = e,
						onLoaded: Le
					}, {
						overlay: N(({ width: e, height: t }) => [W(K).zebra ? (L(), E(_n, {
							key: 0,
							"get-source": Z,
							threshold: W(K).zebraThreshold,
							tick: ve.value
						}, null, 8, ["threshold", "tick"])) : j("", !0), A(Ct, {
							width: e,
							height: t,
							grid: W(K).grid,
							aspect: W(K).aspect,
							"mask-opacity": W(K).maskOpacity
						}, null, 8, [
							"width",
							"height",
							"grid",
							"aspect",
							"mask-opacity"
						])]),
						_: 1
					}, 8, [
						"wipe",
						"src",
						"alt",
						"checker",
						"media-filter",
						"compare-src",
						"compare",
						"class"
					])) : O.value === "video" || O.value === "audio" ? (L(), E(Oe, {
						ref_key: "player",
						ref: m,
						key: `media:${M.value}`,
						wipe: W(K).wipe,
						"onUpdate:wipe": t[9] ||= (e) => W(K).wipe = e,
						src: M.value,
						kind: O.value,
						fps: se.value,
						"frame-count": B.value,
						filename: C.value?.filename,
						"media-filter": Pe.value,
						"compare-src": ke.value,
						compare: W(K).compare,
						class: U({ "is-probing": W(K).probe || W(K).loupe })
					}, {
						overlay: N(({ width: e, height: t }) => [W(K).zebra ? (L(), E(_n, {
							key: 0,
							"get-source": Z,
							threshold: W(K).zebraThreshold,
							tick: ve.value
						}, null, 8, ["threshold", "tick"])) : j("", !0), A(Ct, {
							width: e,
							height: t,
							grid: W(K).grid,
							aspect: W(K).aspect,
							"mask-opacity": W(K).maskOpacity
						}, null, 8, [
							"width",
							"height",
							"grid",
							"aspect",
							"mask-opacity"
						])]),
						_: 1
					}, 8, [
						"wipe",
						"src",
						"kind",
						"fps",
						"frame-count",
						"filename",
						"media-filter",
						"compare-src",
						"compare",
						"class"
					])) : O.value === "model3d" ? (L(), E(Pt, {
						key: `3d:${M.value}`,
						asset: C.value,
						src: M.value
					}, null, 8, ["asset", "src"])) : (L(), H("div", On, [
						t[27] ||= D("i", {
							class: "pi pi-file",
							"aria-hidden": "true"
						}, null, -1),
						D("span", null, z(W(c)("viewer.studio.unsupported", "No preview for this file type.")), 1),
						A(n, {
							type: "button",
							class: "mjr-studio-btn is-text",
							onClick: t[10] ||= (e) => Ye("")
						}, {
							default: N(() => [V(z(W(c)("viewer.studio.classicShort", "Classic viewer")), 1)]),
							_: 1
						})
					])),
					Y.value ? (L(), E(gn, {
						key: 5,
						ref_key: "toolRail",
						ref: h,
						tools: W(K),
						"onUpdate:tools": t[11] ||= (e) => de(K) ? K.value = e : K = e,
						"is-video": O.value === "video",
						"can-analyse": Y.value,
						"can-compare": X.value,
						"compare-name": we.value?.filename,
						onCycleB: ze,
						onPinB: Be,
						onSwap: Ve,
						onCopy: Ue
					}, null, 8, [
						"tools",
						"is-video",
						"can-analyse",
						"can-compare",
						"compare-name"
					])) : j("", !0),
					Y.value && W(K).scopes !== "off" ? (L(), E(Gt, {
						key: 6,
						"get-source": Z,
						mode: W(K).scopes,
						tick: ve.value
					}, null, 8, ["mode", "tick"])) : j("", !0),
					Y.value && (W(K).probe || W(K).loupe) ? (L(), E(zt, {
						key: 7,
						"get-source": Z,
						"get-box": Ie,
						probe: W(K).probe,
						loupe: W(K).loupe,
						"loupe-size": W(K).loupeSize,
						"loupe-zoom": W(K).loupeZoom,
						"media-filter": Ne.value ? "" : Pe.value
					}, null, 8, [
						"probe",
						"loupe",
						"loupe-size",
						"loupe-zoom",
						"media-filter"
					])) : j("", !0)
				], 2), g.value && w.value ? (L(), H("aside", {
					key: 0,
					class: "mjr-studio__inspector",
					onKeydown: t[15] ||= P(() => {}, ["stop"])
				}, [
					D("div", kn, [D("div", An, [D("span", jn, z(W(c)("sidebar.rating", "Rating")), 1), (L(), E(he, {
						key: `r:${w.value.id}`,
						asset: w.value,
						"model-value": ue.value,
						size: 40
					}, null, 8, ["asset", "model-value"]))]), (L(), E(ge, {
						key: `t:${w.value.id}`,
						asset: w.value,
						"model-value": pe.value,
						autofocus: !1
					}, null, 8, ["asset", "model-value"]))]),
					D("nav", Mn, [
						A(n, {
							type: "button",
							role: "tab",
							class: U({ "is-active": _.value === "generation" }),
							onClick: t[12] ||= (e) => _.value = "generation"
						}, {
							default: N(() => [V(z(W(c)("viewer.studio.tabGeneration", "Generation")), 1)]),
							_: 1
						}, 8, ["class"]),
						A(n, {
							type: "button",
							role: "tab",
							class: U({ "is-active": _.value === "workflow" }),
							onClick: t[13] ||= (e) => _.value = "workflow"
						}, {
							default: N(() => [V(z(W(c)("viewer.studio.tabWorkflow", "Workflow")), 1)]),
							_: 1
						}, 8, ["class"]),
						A(n, {
							type: "button",
							role: "tab",
							class: U({ "is-active": _.value === "file" }),
							onClick: t[14] ||= (e) => _.value = "file"
						}, {
							default: N(() => [V(z(W(c)("viewer.studio.tabFile", "File")), 1)]),
							_: 1
						}, 8, ["class"])
					]),
					D("div", Nn, [_.value === "generation" ? (L(), E(te, {
						key: `g:${w.value.id}`,
						asset: w.value
					}, null, 8, ["asset"])) : _.value === "workflow" ? (L(), E(ne, {
						key: `w:${w.value.id}`,
						asset: w.value
					}, null, 8, ["asset"])) : (L(), E(y, {
						key: `f:${w.value.id}`,
						asset: w.value
					}, null, 8, ["asset"]))])
				], 32)) : j("", !0)]),
				I.value > 1 ? (L(), H("footer", {
					key: 0,
					class: "mjr-studio__filmstrip",
					role: "listbox",
					"aria-label": W(c)("viewer.studio.filmstrip", "Filmstrip")
				}, [(L(!0), H(T, null, k(me.value, (e) => (L(), E(n, {
					key: `${e.index}:${e.asset?.id ?? e.asset?.filename}`,
					type: "button",
					role: "option",
					class: U(["mjr-studio__thumb", { "is-current": e.index === W(Q).index }]),
					"aria-selected": e.index === W(Q).index,
					title: e.asset?.filename,
					onClick: (t) => W(nt)(e.index)
				}, {
					default: N(() => [at(e.asset) ? (L(), H("img", {
						key: 0,
						src: at(e.asset),
						alt: "",
						loading: "lazy",
						draggable: "false"
					}, null, 8, Fn)) : (L(), H("i", In)), W(q)(e.asset) === "video" ? (L(), H("i", Ln)) : j("", !0)]),
					_: 2
				}, 1032, [
					"class",
					"aria-selected",
					"title",
					"onClick"
				]))), 128))], 8, Pn)) : j("", !0)
			], 10, vn)) : j("", !0)]);
		};
	}
}), zn = /* @__PURE__ */ M({
	__name: "ViewerPortal",
	setup(e) {
		let t = null;
		function n(e) {
			let n = e?.detail || {}, i = Array.isArray(n?.assets) ? n.assets.filter(Boolean) : n?.asset ? [n.asset] : [];
			if (!i.length) return;
			let a = Math.max(0, Math.min(Number(n?.index) || 0, i.length - 1)), o = String(n?.mode || "").trim().toLowerCase();
			if (it(i, a, o) && et(i, a, o)) {
				try {
					t?.close?.();
				} catch (e) {
					console.debug?.(e);
				}
				n.handled = !0;
			} else r(i, a, o, n);
		}
		function r(e, n, r, i = null) {
			tt();
			try {
				t ||= _(), t.open?.(e, n), (r === "ab" || r === "sidebyside") && t.setMode?.(r), i && (i.handled = !0);
			} catch (e) {
				console.debug?.(e);
			}
		}
		return O(() => {
			try {
				S();
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
		}), I(() => {
			try {
				window.removeEventListener(u.OPEN_VIEWER, n);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				x();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				t?.dispose?.();
			} catch (e) {
				console.debug?.(e);
			}
			t = null;
		}), (e, t) => (L(), H(T, null, [
			A(Rn, { onOpenClassic: t[0] ||= (e) => r(e.assets, e.index, e.mode) }),
			A(Pe),
			A(Ne),
			A(Ue)
		], 64));
	}
});
export { zn as default };
