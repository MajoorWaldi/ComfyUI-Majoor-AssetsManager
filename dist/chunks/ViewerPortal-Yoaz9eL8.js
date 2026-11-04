import { $t as e, P as t, a as n, g as r, i, x as a, y as o } from "./viewerRuntimeHosts-CW2DfHq_.js";
import { at as s, m as c, mt as l, r as u, t as d } from "./events-cBMXVULQ.js";
import { c as f, d as p, f as m, g as h, h as g, l as _, o as v, r as y, s as b, u as x } from "./viewerOpenRequest-BN2VAo8C.js";
import { i as S, n as C, t as w, tt as T } from "./SidebarWorkflowSection-D3B5edO6.js";
import { i as E, r as D } from "./floatingViewerManager-BmnIBEYf.js";
import { A as O, B as k, C as A, D as j, E as M, G as ee, J as N, K as P, L as te, N as F, O as I, R as ne, S as re, T as L, U as ie, V as R, Y as ae, at as z, b as oe, dt as B, ft as V, j as H, k as U, lt as W, nt as se, rt as G, ut as K, w as ce, z as q } from "./mjr-primevue-RN5COnJA.js";
import { n as le, t as J } from "./TagsEditor-DxltCjB-.js";
import { t as ue } from "./genInfo-Dj9mJcDf.js";
// ui/vue/components/viewer/FloatingViewerHost.vue
var de = /* @__PURE__ */ F({
	__name: "FloatingViewerHost",
	setup(e) {
		let t = G(null), n = null;
		return q(() => {
			n = i(t.value);
		}), k(() => {
			n?.(), n = null;
		}), (e, n) => (R(), U("div", {
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
}), Y = /* @__PURE__ */ F({
	__name: "ViewerOverlayHost",
	setup(e) {
		let t = G(null), r = null;
		return q(() => {
			r = n(t.value);
		}), k(() => {
			r?.(), r = null;
		}), (e, n) => (R(), U("div", {
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
}), X = {
	key: 0,
	class: "mjr-context-menu-separator"
}, Z = { class: "mjr-context-menu-item-left" }, fe = { class: "mjr-context-menu-item-right" }, pe = {
	key: 0,
	class: "mjr-context-menu-hint"
}, me = {
	key: 1,
	class: "mjr-context-menu-submenu-arrow"
}, he = {
	key: 0,
	class: "mjr-context-menu-separator"
}, ge = { class: "mjr-context-menu-item-left" }, _e = {
	key: 0,
	class: "mjr-context-menu-hint"
}, ve = /* @__PURE__ */ F({
	__name: "ViewerContextMenu",
	setup(e) {
		let t = G(null), n = G(null), r = G(null), i = null, a = null, o = L(() => l(m.main, 10041)), s = L(() => l(m.submenu, 10042)), c = L(() => l(m.tags, 10043));
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
			x({
				x: Math.round((n?.right || m.main.x || 0) + 6),
				y: Math.round((n?.top || m.main.y || 0) - 4),
				items: e.submenu,
				title: e.label || ""
			});
		}
		async function v(e, t, n = "main") {
			if (e && e.type === "item" && !e.disabled) {
				if (Array.isArray(e.submenu) && e.submenu.length) _(e, t);
				else try {
					await e.action?.();
				} catch (e) {
					console.error("[ViewerContextMenu.vue] Action failed:", e);
				} finally {
					e.closeOnSelect === !1 ? n === "submenu" && f() : b();
				}
			}
		}
		function y(e, t) {
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
			t.value?.contains?.(i) || n.value?.contains?.(i) || r.value?.contains?.(i) || b();
		}
		function E(e) {
			e?.key === "Escape" && b();
		}
		function D() {
			b();
		}
		function O(e) {
			let t = e?.detail;
			String(t?.source || "") !== "viewer" && b();
		}
		function F(e) {
			let t = m.tags.asset;
			t && (t.tags = Array.isArray(e) ? [...e] : []);
		}
		function ne(e) {
			let t = Array.isArray(e?.tags) ? e.tags : [];
			try {
				m.tags.onChanged?.(t);
			} catch (e) {
				console.debug?.(e);
			}
		}
		return P(() => m.main.open, async (e) => {
			e && (await h(m.main, t), g(t));
		}), P(() => m.submenu.open, async (e) => {
			e && (await h(m.submenu, n), g(n));
		}), P(() => m.tags.open, async (e) => {
			e && await h(m.tags, r);
		}), q(() => {
			a = new AbortController();
			let e = {
				capture: !0,
				passive: !0,
				signal: a.signal
			};
			window.addEventListener("pointerdown", T, e), window.addEventListener("keydown", E, {
				capture: !0,
				signal: a.signal
			}), window.addEventListener("scroll", D, e), window.addEventListener("wheel", D, e), window.addEventListener("resize", D, {
				passive: !0,
				signal: a.signal
			}), window.addEventListener("mjr-close-all-menus", O, { signal: a.signal });
		}), k(() => {
			u();
			try {
				a?.abort();
			} catch (e) {
				console.debug?.(e);
			}
			a = null, b();
		}), (e, i) => {
			let a = ee("MButton");
			return R(), j(ce, { to: "body" }, [
				W(m).main.open ? (R(), U("div", {
					key: 0,
					ref_key: "mainMenuRef",
					ref: t,
					class: "mjr-viewer-context-menu mjr-context-menu",
					style: B(o.value),
					role: "menu",
					"aria-label": "Viewer context menu"
				}, [(R(!0), U(A, null, ie(W(m).main.items, (e) => (R(), U(A, { key: e.id }, [e.type === "separator" ? (R(), U("div", X)) : (R(), j(a, {
					key: 1,
					type: "button",
					class: K(["mjr-context-menu-item", {
						"is-disabled": e.disabled,
						"has-submenu": Array.isArray(e.submenu) && e.submenu.length
					}]),
					severity: "secondary",
					text: "",
					role: "menuitem",
					"aria-disabled": e.disabled ? "true" : "false",
					tabindex: e.disabled ? -1 : 0,
					onClick: (t) => v(e, t),
					onMouseenter: (t) => y(e, t),
					onMouseleave: (t) => S(e)
				}, {
					default: N(() => [M("span", Z, [e.iconClass ? (R(), U("i", {
						key: 0,
						class: K(e.iconClass)
					}, null, 2)) : I("", !0), M("span", null, V(e.label), 1)]), M("span", fe, [e.rightHint ? (R(), U("span", pe, V(e.rightHint), 1)) : I("", !0), Array.isArray(e.submenu) && e.submenu.length ? (R(), U("span", me, " > ")) : I("", !0)])]),
					_: 2
				}, 1032, [
					"class",
					"aria-disabled",
					"tabindex",
					"onClick",
					"onMouseenter",
					"onMouseleave"
				]))], 64))), 128))], 4)) : I("", !0),
				W(m).submenu.open ? (R(), U("div", {
					key: 1,
					ref_key: "submenuRef",
					ref: n,
					class: "mjr-viewer-rating-submenu mjr-context-menu",
					style: B(s.value),
					role: "menu",
					"aria-label": "Viewer context submenu",
					onMouseenter: C,
					onMouseleave: w
				}, [(R(!0), U(A, null, ie(W(m).submenu.items, (e) => (R(), U(A, { key: e.id }, [e.type === "separator" ? (R(), U("div", he)) : (R(), j(a, {
					key: 1,
					type: "button",
					class: K(["mjr-context-menu-item", { "is-disabled": e.disabled }]),
					severity: "secondary",
					text: "",
					role: "menuitem",
					"aria-disabled": e.disabled ? "true" : "false",
					tabindex: e.disabled ? -1 : 0,
					onClick: (t) => v(e, t, "submenu")
				}, {
					default: N(() => [M("span", ge, [e.iconClass ? (R(), U("i", {
						key: 0,
						class: K(e.iconClass)
					}, null, 2)) : I("", !0), M("span", null, V(e.label), 1)]), e.rightHint ? (R(), U("span", _e, V(e.rightHint), 1)) : I("", !0)]),
					_: 2
				}, 1032, [
					"class",
					"aria-disabled",
					"tabindex",
					"onClick"
				]))], 64))), 128))], 36)) : I("", !0),
				W(m).tags.open && W(m).tags.asset ? (R(), U("div", {
					key: 2,
					ref_key: "tagsPopoverRef",
					ref: r,
					class: "mjr-viewer-popover",
					style: B(c.value)
				}, [H(J, {
					asset: W(m).tags.asset,
					"model-value": W(m).tags.asset?.tags || [],
					"onUpdate:modelValue": F,
					onTagsChange: ne
				}, null, 8, ["asset", "model-value"])], 4)) : I("", !0)
			]);
		};
	}
}), ye = /* @__PURE__ */ F({
	__name: "ViewerContextMenuPortal",
	setup(e) {
		let t = G(""), n = L(() => _(t.value));
		return q(() => {
			t.value = v();
		}), k(() => {
			p(t.value), t.value = "";
		}), (e, t) => n.value ? (R(), j(ve, { key: 0 })) : I("", !0);
	}
}), be = /* @__PURE__ */ new Set([
	"png",
	"jpg",
	"jpeg",
	"webp",
	"gif",
	"bmp",
	"avif",
	"tif",
	"tiff",
	"jxl",
	"exr",
	"svg"
]), xe = /* @__PURE__ */ new Set([
	"mp4",
	"webm",
	"mov",
	"mkv",
	"avi",
	"m4v"
]), Se = /* @__PURE__ */ new Set([
	"mp3",
	"wav",
	"flac",
	"ogg",
	"opus",
	"m4a",
	"aac",
	"aiff"
]), Ce = /* @__PURE__ */ new Set([
	"glb",
	"gltf",
	"obj",
	"fbx",
	"stl",
	"ply",
	"splat",
	"ksplat",
	"spz"
]);
function we(e) {
	let t = String(e?.filename || e?.name || e?.filepath || "").trim(), n = t.lastIndexOf(".");
	return n >= 0 ? t.slice(n + 1).toLowerCase() : "";
}
function Q(e) {
	let t = String(e?.kind || "").trim().toLowerCase();
	if (t === "image" || t === "video" || t === "audio" || t === "model3d") return t;
	let n = we(e);
	return be.has(n) ? "image" : xe.has(n) ? "video" : Se.has(n) ? "audio" : Ce.has(n) ? "model3d" : "other";
}
function Te(e, { withCentis: t = !0 } = {}) {
	let n = Math.floor((Number.isFinite(e) && e > 0 ? e : 0) * 100 + 1e-6), r = n % 100, i = Math.floor(n / 100), a = i % 60, o = Math.floor(i / 60) % 60, s = Math.floor(i / 3600), c = s > 0 ? String(o).padStart(2, "0") : String(o), l = `${s > 0 ? `${s}:` : ""}${c}:${String(a).padStart(2, "0")}`;
	return t ? `${l}.${String(r).padStart(2, "0")}` : l;
}
function Ee(e, t) {
	return !t || !Number.isFinite(t) || t <= 0 ? 0 : Math.max(0, Math.floor(Math.max(0, e) * t + 1e-6));
}
function De(e, t) {
	return !t || !Number.isFinite(t) || t <= 0 ? 0 : Math.max(0, (Math.max(0, Math.floor(e)) + .25) / t);
}
function Oe(e, t, n, r) {
	let i = t && Number.isFinite(t) && t > 0 ? t : 24, a = De(Ee(e, i) + n, i);
	return Math.min(Math.max(0, a), Math.max(0, (Number.isFinite(r) && r > 0 ? r : a) - .5 / i));
}
function ke(e, t, n) {
	let r = Number(n);
	return Number.isFinite(r) && r > 0 ? Math.floor(r) : !t || !Number.isFinite(e) || e <= 0 ? null : Math.max(1, Math.round(e * t));
}
function Ae(e, t) {
	if (e.a == null || e.b == null) return null;
	let n = Number.isFinite(t) && t > 0 ? t : Math.max(e.a, e.b), r = Math.min(Math.max(0, Math.min(e.a, e.b)), n), i = Math.min(Math.max(0, Math.max(e.a, e.b)), n);
	return i - r >= .02 ? {
		a: r,
		b: i
	} : null;
}
function je(e, t, n) {
	let r = Ae(t, n);
	return r && (e >= r.b || e < r.a - .05) ? r.a : null;
}
var Me = [
	.25,
	.5,
	1,
	1.5,
	2
];
function Ne(e, t) {
	return h(e) ?? g(t?.fps_raw ?? t?.fps ?? t?.frame_rate) ?? g(e?.fps);
}
function Pe(e) {
	let t = [], n = Number(e?.width), r = Number(e?.height);
	n > 0 && r > 0 && t.push(`${n}×${r}`);
	let i = we(e);
	i && t.push(i.toUpperCase());
	let a = Number(e?.duration);
	a > 0 && t.push(Te(a, { withCentis: !1 }));
	let o = Number(e?.size);
	return o > 0 && t.push(Fe(o)), t.join(" · ");
}
function Fe(e) {
	if (!Number.isFinite(e) || e <= 0) return "";
	let t = [
		"B",
		"KB",
		"MB",
		"GB"
	], n = e, r = 0;
	for (; n >= 1024 && r < t.length - 1;) n /= 1024, r += 1;
	return `${n >= 10 || r === 0 ? Math.round(n) : n.toFixed(1)} ${t[r]}`;
}
function Ie(e, t, n = 40) {
	if (e <= 0) return {
		start: 0,
		end: 0
	};
	let r = n * 2 + 1;
	if (e <= r) return {
		start: 0,
		end: e
	};
	let i = Math.max(0, t - n), a = i + r;
	return a > e && (a = e, i = e - r), {
		start: i,
		end: a
	};
}
// ui/features/viewer/studio/studioViewerState.ts
var $ = se({
	open: !1,
	assets: [],
	index: 0,
	session: 0
});
function Le(e, t = 0) {
	let n = (Array.isArray(e) ? e : []).filter(Boolean);
	return n.length ? ($.assets = n, $.index = Math.max(0, Math.min(Number(t) || 0, n.length - 1)), $.session += 1, $.open = !0, !0) : !1;
}
function Re() {
	$.open = !1;
}
function ze(e) {
	let t = $.assets.length;
	t && ($.index = (Math.floor(e) % t + t) % t);
}
function Be(e) {
	ze($.index + e);
}
function Ve(e, t, n = "") {
	let r = String(n || "").trim().toLowerCase();
	if (r === "ab" || r === "sidebyside") return !1;
	try {
		if (T()?.viewer?.classic === !0) return !1;
	} catch (e) {
		console.debug?.(e);
	}
	let i = Array.isArray(e) ? e : [], a = i[Math.max(0, Math.min(Number(t) || 0, i.length - 1))];
	return !!a && Q(a) !== "model3d";
}
// ui/vue/components/viewer/studio/StudioImageStage.vue?vue&type=script&setup=true&lang.ts
var He = ["src", "alt"], Ue = {
	key: 0,
	class: "mjr-studio-stage__error"
}, We = .05, Ge = 32, Ke = /* @__PURE__ */ F({
	__name: "StudioImageStage",
	props: {
		src: {},
		alt: {},
		checker: { type: Boolean }
	},
	emits: ["zoom", "loaded"],
	setup(e, { expose: t, emit: n }) {
		let r = e, i = n, a = G(null), o = G({
			w: 0,
			h: 0
		}), s = G(1), c = G({
			x: 0,
			y: 0
		}), l = G(!0), u = G(!1), d = G(!1), f = null, p = null;
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
			let n = Math.max(We, Math.min(Ge, e)), { w: r, h: a } = m(), o = t ? t.x - r / 2 : 0, u = t ? t.y - a / 2 : 0, d = n / s.value;
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
		let E = L(() => ({
			width: `${o.value.w}px`,
			height: `${o.value.h}px`,
			transform: `translate(-50%, -50%) translate(${c.value.x}px, ${c.value.y}px) scale(${s.value})`,
			imageRendering: s.value >= 2 ? "pixelated" : "auto"
		}));
		return P(() => r.src, () => {
			o.value = {
				w: 0,
				h: 0
			}, u.value = !1;
		}), q(() => {
			try {
				p = new ResizeObserver(() => {
					l.value && g();
				}), a.value && p.observe(a.value);
			} catch (e) {
				console.debug?.(e);
			}
		}), ne(() => p?.disconnect()), t({
			zoomBy: v,
			fit: g,
			actualSize: y,
			toggleFitActual: b
		}), (t, n) => (R(), U("div", {
			ref_key: "stage",
			ref: a,
			class: K(["mjr-studio-stage", {
				"is-checker": e.checker,
				"is-dragging": d.value
			}]),
			onWheel: x,
			onPointerdown: S,
			onPointermove: C,
			onPointerup: w,
			onPointercancel: w,
			onDblclick: b
		}, [ae((R(), U("img", {
			key: e.src,
			class: "mjr-studio-stage__img",
			src: e.src,
			alt: e.alt || "",
			draggable: "false",
			style: B(E.value),
			onLoad: T,
			onError: n[0] ||= (e) => u.value = !0
		}, null, 44, He)), [[oe, !u.value]]), u.value ? (R(), U("div", Ue, [n[1] ||= M("i", {
			class: "pi pi-image",
			"aria-hidden": "true"
		}, null, -1), M("span", null, V(e.alt), 1)])) : I("", !0)], 34));
	}
}), qe = ["src"], Je = ["src"], Ye = {
	key: 3,
	class: "mjr-studio-player__error"
}, Xe = [
	"aria-label",
	"aria-valuemax",
	"aria-valuenow"
], Ze = { class: "mjr-studio-player__row" }, Qe = { class: "mjr-studio-player__time" }, $e = { class: "is-dim" }, et = ["title"], tt = ["title"], nt = { class: "mjr-studio-player__group" }, rt = ["aria-label", "aria-valuenow"], it = /* @__PURE__ */ F({
	__name: "StudioPlayer",
	props: {
		src: {},
		kind: {},
		fps: {},
		frameCount: {},
		filename: {}
	},
	emits: ["ended"],
	setup(e, { expose: t, emit: n }) {
		let r = e, i = n, a = G(null), o = G(null), s = G(null), l = G(!1), u = G(0), d = G(0), f = G(0), p = G(1), m = G(!1), h = G(1), g = G(!0), _ = G(null), v = G(null), y = G(null), b = G(!1), x = G(!0), S = G(""), C = null, w = 0, T = L(() => r.fps && r.fps > 0 ? r.fps : null), E = L(() => Ee(u.value, T.value)), D = L(() => ke(d.value, T.value, r.frameCount)), k = L(() => d.value > 0 ? u.value / d.value * 100 : 0), te = L(() => d.value > 0 ? f.value / d.value * 100 : 0), F = L(() => Ae({
			a: _.value,
			b: v.value
		}, d.value)), ie = L(() => {
			if (!F.value || d.value <= 0) return null;
			let e = F.value.a / d.value * 100, t = (F.value.b - F.value.a) / d.value * 100;
			return {
				left: `${e}%`,
				width: `${t}%`
			};
		}), ae = L(() => y.value == null || d.value <= 0 ? null : y.value / 100 * d.value);
		function z() {
			return a.value;
		}
		function oe() {
			let e = z();
			if (e) {
				u.value = e.currentTime || 0;
				let t = je(u.value, {
					a: _.value,
					b: v.value
				}, d.value);
				t != null && l.value && (e.currentTime = t, u.value = t);
			}
			l.value && (w = requestAnimationFrame(oe));
		}
		function se() {
			l.value = !0, cancelAnimationFrame(w), w = requestAnimationFrame(oe), Fe();
		}
		function ce() {
			l.value = !1, cancelAnimationFrame(w), Pe();
		}
		function le() {
			let e = z();
			d.value = Number.isFinite(e?.duration) ? Number(e?.duration) : 0, S.value = "", e && (e.volume = p.value, e.muted = m.value, e.playbackRate = h.value);
		}
		function J() {
			let e = z();
			if (e) {
				l.value || (u.value = e.currentTime || 0);
				try {
					let t = e.buffered;
					f.value = t.length ? t.end(t.length - 1) : 0;
				} catch {
					f.value = 0;
				}
			}
		}
		function ue() {
			if (g.value && !F.value) {
				let e = z();
				e && (e.currentTime = 0, e.play()?.catch?.(() => {}));
			} else i("ended");
		}
		function de() {
			S.value = c("viewer.studio.mediaError", "This file cannot be played by the browser.");
		}
		function Y() {
			let e = z();
			e && (e.paused ? e.play()?.catch?.(() => {}) : e.pause());
		}
		function X(e) {
			let t = z();
			if (!t || !Number.isFinite(e)) return;
			let n = d.value > 0 ? d.value : e;
			t.currentTime = Math.max(0, Math.min(e, n)), u.value = t.currentTime;
		}
		function Z(e) {
			let t = z();
			t && (t.paused || t.pause(), X(Oe(t.currentTime || 0, T.value, e, d.value)));
		}
		function fe(e) {
			X((z()?.currentTime || 0) + e);
		}
		function pe(e) {
			let t = s.value?.getBoundingClientRect();
			return !t || t.width <= 0 ? 0 : Math.max(0, Math.min(100, (e.clientX - t.left) / t.width * 100));
		}
		function me(e) {
			d.value <= 0 || (b.value = !0, e.currentTarget?.setPointerCapture?.(e.pointerId), X(pe(e) / 100 * d.value));
		}
		function he(e) {
			y.value = pe(e), b.value && X(y.value / 100 * d.value);
		}
		function ge(e) {
			b.value = !1, e.currentTarget?.releasePointerCapture?.(e.pointerId);
		}
		function _e(e) {
			h.value = e;
			let t = z();
			t && (t.playbackRate = e);
		}
		function ve(e = 1, t = !1) {
			let n = Me, r = n.indexOf(h.value), i = (r < 0 ? n.indexOf(1) : r) + e;
			t && (i = (i + n.length) % n.length), _e(n[Math.max(0, Math.min(n.length - 1, i))]);
		}
		function ye() {
			m.value = !m.value;
			let e = z();
			e && (e.muted = m.value);
		}
		let be = G(!1);
		function xe(e) {
			if (e.type === "pointerdown") be.value = !0, e.currentTarget?.setPointerCapture?.(e.pointerId);
			else if (!be.value) return;
			let t = e.currentTarget.getBoundingClientRect(), n = t.width > 0 ? (e.clientX - t.left) / t.width : 1;
			Se(Math.round(Math.max(0, Math.min(1, n)) * 20) / 20);
		}
		function Se(e) {
			p.value = e;
			let t = z();
			t && (t.volume = p.value, p.value > 0 && m.value && (m.value = !1, t.muted = !1));
		}
		function Ce() {
			_.value = u.value, v.value != null && v.value <= _.value && (v.value = null);
		}
		function we() {
			v.value = u.value, _.value ??= 0;
		}
		function Q() {
			_.value = null, v.value = null;
		}
		function De() {
			let e = o.value;
			e && (document.fullscreenElement ? document.exitFullscreen?.() : e.requestFullscreen?.());
		}
		async function Ne() {
			let e = z();
			if (r.kind !== "video" || !(e instanceof HTMLVideoElement) || !e.videoWidth) return;
			let t = document.createElement("canvas");
			t.width = e.videoWidth, t.height = e.videoHeight, t.getContext("2d")?.drawImage(e, 0, 0);
			let n = await new Promise((e) => t.toBlob(e, "image/png"));
			if (!n) return;
			let i = URL.createObjectURL(n), a = String(r.filename || "frame").replace(/\.[^.]+$/, ""), o = document.createElement("a");
			o.href = i, o.download = `${a}_f${String(E.value).padStart(5, "0")}.png`, o.click(), setTimeout(() => URL.revokeObjectURL(i), 1e3);
		}
		function Pe() {
			x.value = !0, Fe();
		}
		function Fe() {
			C && clearTimeout(C), C = setTimeout(() => {
				l.value && !b.value && r.kind === "video" && (x.value = !1);
			}, 2200);
		}
		function Ie() {
			let e = z();
			if (e) try {
				e.pause(), e.removeAttribute("src"), e.load();
			} catch (e) {
				console.debug?.(e);
			}
		}
		return P(() => r.src, () => {
			Q(), u.value = 0, d.value = 0, f.value = 0, S.value = "";
		}), q(() => {
			let e = z();
			e && e.play()?.catch?.(() => {});
		}), ne(() => {
			cancelAnimationFrame(w), C && clearTimeout(C), Ie();
		}), t({
			togglePlay: Y,
			stepFrame: Z,
			seekBy: fe,
			cycleRate: ve,
			toggleMute: ye,
			setLoopA: Ce,
			setLoopB: we,
			clearLoop: Q,
			toggleFullscreen: De,
			exportFrame: Ne,
			release: Ie
		}), (t, n) => {
			let r = ee("MButton");
			return R(), U("div", {
				ref_key: "root",
				ref: o,
				class: K(["mjr-studio-player", {
					"is-audio": e.kind === "audio",
					"controls-hidden": !x.value
				}]),
				onPointermove: Pe
			}, [
				e.kind === "video" ? (R(), U("video", {
					key: 0,
					ref_key: "media",
					ref: a,
					class: "mjr-studio-player__media",
					src: e.src,
					playsinline: "",
					preload: "auto",
					onClick: Y,
					onDblclick: De,
					onPlay: se,
					onPause: ce,
					onLoadedmetadata: le,
					onTimeupdate: J,
					onProgress: J,
					onEnded: ue,
					onError: de
				}, null, 40, qe)) : (R(), U("div", {
					key: 1,
					class: "mjr-studio-player__audio-art",
					onClick: Y
				}, [
					n[7] ||= M("i", {
						class: "pi pi-volume-up",
						"aria-hidden": "true"
					}, null, -1),
					M("span", null, V(e.filename), 1),
					M("audio", {
						ref_key: "media",
						ref: a,
						src: e.src,
						preload: "auto",
						onPlay: se,
						onPause: ce,
						onLoadedmetadata: le,
						onTimeupdate: J,
						onProgress: J,
						onEnded: ue,
						onError: de
					}, null, 40, Je)
				])),
				!l.value && !S.value ? (R(), j(r, {
					key: 2,
					type: "button",
					class: "mjr-studio-player__big-play",
					"aria-label": W(c)("viewer.studio.play", "Play"),
					onClick: Y
				}, {
					default: N(() => [...n[8] ||= [M("i", {
						class: "pi pi-play",
						"aria-hidden": "true"
					}, null, -1)]]),
					_: 1
				}, 8, ["aria-label"])) : I("", !0),
				S.value ? (R(), U("div", Ye, V(S.value), 1)) : I("", !0),
				M("div", {
					class: "mjr-studio-player__controls",
					onPointerdown: n[6] ||= re(() => {}, ["stop"])
				}, [M("div", {
					ref_key: "track",
					ref: s,
					class: "mjr-studio-player__track",
					role: "slider",
					"aria-label": W(c)("viewer.studio.seek", "Seek"),
					"aria-valuemin": 0,
					"aria-valuemax": d.value,
					"aria-valuenow": u.value,
					onPointerdown: me,
					onPointermove: he,
					onPointerup: ge,
					onPointerleave: n[0] ||= (e) => y.value = null
				}, [
					M("div", {
						class: "mjr-studio-player__buffered",
						style: B({ width: `${te.value}%` })
					}, null, 4),
					ie.value ? (R(), U("div", {
						key: 0,
						class: "mjr-studio-player__loop",
						style: B(ie.value)
					}, null, 4)) : I("", !0),
					M("div", {
						class: "mjr-studio-player__progress",
						style: B({ width: `${k.value}%` })
					}, null, 4),
					M("div", {
						class: "mjr-studio-player__thumb",
						style: B({ left: `${k.value}%` })
					}, null, 4),
					ae.value == null ? I("", !0) : (R(), U("div", {
						key: 1,
						class: "mjr-studio-player__hover",
						style: B({ left: `${y.value}%` })
					}, [O(V(W(Te)(ae.value)), 1), T.value ? (R(), U(A, { key: 0 }, [O(" · f" + V(W(Ee)(ae.value, T.value)), 1)], 64)) : I("", !0)], 4))
				], 40, Xe), M("div", Ze, [
					H(r, {
						type: "button",
						class: "mjr-studio-btn",
						title: W(c)("viewer.studio.playPause", "Play / pause (Space)"),
						onClick: Y
					}, {
						default: N(() => [M("i", {
							class: K(l.value ? "pi pi-pause" : "pi pi-play"),
							"aria-hidden": "true"
						}, null, 2)]),
						_: 1
					}, 8, ["title"]),
					e.kind === "video" ? (R(), U(A, { key: 0 }, [H(r, {
						type: "button",
						class: "mjr-studio-btn",
						title: W(c)("viewer.studio.prevFrame", "Previous frame (,)"),
						onClick: n[1] ||= (e) => Z(-1)
					}, {
						default: N(() => [...n[9] ||= [M("i", {
							class: "pi pi-step-backward",
							"aria-hidden": "true"
						}, null, -1)]]),
						_: 1
					}, 8, ["title"]), H(r, {
						type: "button",
						class: "mjr-studio-btn",
						title: W(c)("viewer.studio.nextFrame", "Next frame (.)"),
						onClick: n[2] ||= (e) => Z(1)
					}, {
						default: N(() => [...n[10] ||= [M("i", {
							class: "pi pi-step-forward",
							"aria-hidden": "true"
						}, null, -1)]]),
						_: 1
					}, 8, ["title"])], 64)) : I("", !0),
					M("span", Qe, [O(V(W(Te)(u.value)) + " ", 1), M("span", $e, "/ " + V(W(Te)(d.value)), 1)]),
					e.kind === "video" && T.value ? (R(), U("span", {
						key: 1,
						class: "mjr-studio-chip",
						title: W(c)("viewer.studio.frame", "Frame")
					}, [
						O(" f " + V(E.value), 1),
						D.value ? (R(), U(A, { key: 0 }, [O(" / " + V(D.value - 1), 1)], 64)) : I("", !0),
						O(" · " + V(Math.round(T.value * 100) / 100) + " fps ", 1)
					], 8, et)) : I("", !0),
					n[17] ||= M("span", { class: "mjr-studio-player__spacer" }, null, -1),
					M("div", {
						class: "mjr-studio-player__group",
						title: W(c)("viewer.studio.abLoop", "A-B loop (I / O, U to clear)")
					}, [
						H(r, {
							type: "button",
							class: K(["mjr-studio-btn is-text", { "is-on": _.value != null }]),
							onClick: Ce
						}, {
							default: N(() => [...n[11] ||= [O("A", -1)]]),
							_: 1
						}, 8, ["class"]),
						H(r, {
							type: "button",
							class: K(["mjr-studio-btn is-text", { "is-on": v.value != null }]),
							onClick: we
						}, {
							default: N(() => [...n[12] ||= [O("B", -1)]]),
							_: 1
						}, 8, ["class"]),
						_.value != null || v.value != null ? (R(), j(r, {
							key: 0,
							type: "button",
							class: "mjr-studio-btn",
							title: W(c)("viewer.studio.clearLoop", "Clear A-B loop"),
							onClick: Q
						}, {
							default: N(() => [...n[13] ||= [M("i", {
								class: "pi pi-times",
								"aria-hidden": "true"
							}, null, -1)]]),
							_: 1
						}, 8, ["title"])) : I("", !0)
					], 8, tt),
					H(r, {
						type: "button",
						class: K(["mjr-studio-btn", { "is-on": g.value }]),
						title: W(c)("viewer.studio.loop", "Loop"),
						onClick: n[3] ||= (e) => g.value = !g.value
					}, {
						default: N(() => [...n[14] ||= [M("i", {
							class: "pi pi-replay",
							"aria-hidden": "true"
						}, null, -1)]]),
						_: 1
					}, 8, ["class", "title"]),
					H(r, {
						type: "button",
						class: K(["mjr-studio-btn is-text", { "is-on": h.value !== 1 }]),
						title: W(c)("viewer.studio.speed", "Speed ([ / ])"),
						onClick: n[4] ||= (e) => ve(1, !0)
					}, {
						default: N(() => [O(V(h.value) + "×", 1)]),
						_: 1
					}, 8, ["class", "title"]),
					M("div", nt, [H(r, {
						type: "button",
						class: "mjr-studio-btn",
						title: W(c)("viewer.studio.mute", "Mute (M)"),
						onClick: ye
					}, {
						default: N(() => [M("i", {
							class: K(m.value || p.value === 0 ? "pi pi-volume-off" : "pi pi-volume-up"),
							"aria-hidden": "true"
						}, null, 2)]),
						_: 1
					}, 8, ["title"]), M("div", {
						class: "mjr-studio-player__volume",
						role: "slider",
						"aria-label": W(c)("viewer.studio.volume", "Volume"),
						"aria-valuemin": 0,
						"aria-valuemax": 1,
						"aria-valuenow": m.value ? 0 : p.value,
						onPointerdown: xe,
						onPointermove: xe,
						onPointerup: n[5] ||= (e) => be.value = !1
					}, [M("div", {
						class: "mjr-studio-player__volume-fill",
						style: B({ width: `${(m.value ? 0 : p.value) * 100}%` })
					}, null, 4)], 40, rt)]),
					e.kind === "video" ? (R(), j(r, {
						key: 2,
						type: "button",
						class: "mjr-studio-btn",
						title: W(c)("viewer.studio.exportFrame", "Save this frame as PNG"),
						onClick: Ne
					}, {
						default: N(() => [...n[15] ||= [M("i", {
							class: "pi pi-camera",
							"aria-hidden": "true"
						}, null, -1)]]),
						_: 1
					}, 8, ["title"])) : I("", !0),
					e.kind === "video" ? (R(), j(r, {
						key: 3,
						type: "button",
						class: "mjr-studio-btn",
						title: W(c)("viewer.studio.fullscreen", "Fullscreen (F)"),
						onClick: De
					}, {
						default: N(() => [...n[16] ||= [M("i", {
							class: "pi pi-window-maximize",
							"aria-hidden": "true"
						}, null, -1)]]),
						_: 1
					}, 8, ["title"])) : I("", !0)
				])], 32)
			], 34);
		};
	}
}), at = ["aria-label"], ot = { class: "mjr-studio__header" }, st = { class: "mjr-studio__nav" }, ct = { class: "mjr-studio__counter" }, lt = { class: "mjr-studio__title" }, ut = ["title"], dt = { class: "mjr-studio__summary" }, ft = { class: "mjr-studio__actions" }, pt = ["title"], mt = { class: "mjr-studio__body" }, ht = { class: "mjr-studio__stage" }, gt = {
	key: 2,
	class: "mjr-studio__unsupported"
}, _t = { class: "mjr-studio__review" }, vt = { class: "mjr-studio__review-row" }, yt = { class: "mjr-studio__label" }, bt = {
	class: "mjr-studio__tabs",
	role: "tablist"
}, xt = { class: "mjr-studio__tab-body" }, St = ["aria-label"], Ct = ["src"], wt = {
	key: 1,
	class: "pi pi-file",
	"aria-hidden": "true"
}, Tt = {
	key: 2,
	class: "pi pi-play mjr-studio__thumb-badge",
	"aria-hidden": "true"
}, Et = /* @__PURE__ */ F({
	__name: "StudioViewer",
	emits: ["open-classic"],
	setup(n, { emit: i }) {
		let u = i, f = G(null), p = G(null), m = G(null), h = G(!0), g = G("generation"), _ = G(!1), v = G(1), y = z(null), b = z(null), x = null, T = L(() => $.assets[$.index] ?? null), E = L(() => y.value ?? T.value), D = L(() => Q(T.value)), k = L(() => T.value ? s(T.value) : ""), F = L(() => $.assets.length), ae = L(() => Pe(E.value)), oe = L(() => Ne(E.value, b.value)), B = L(() => Number(b.value?.frame_count) || null), se = L(() => Number(E.value?.rating) || 0), q = L(() => Array.isArray(E.value?.tags) ? E.value.tags : []), de = L(() => {
			let { start: e, end: t } = Ie(F.value, $.index);
			return $.assets.slice(e, t).map((t, n) => ({
				asset: t,
				index: e + n
			}));
		}), Y = L(() => F.value >= 2);
		async function X(e) {
			if (x?.abort(), y.value = null, b.value = null, !e) return;
			let t = typeof AbortController < "u" ? new AbortController() : null;
			x = t;
			try {
				let n = await ue(e, {
					getAssetMetadata: r,
					getFileMetadataScoped: o,
					signal: t?.signal
				});
				x === t && T.value === e && (y.value = n && typeof n == "object" ? n : e);
			} catch (e) {
				console.debug?.(e);
			}
			let n = Q(e);
			if ((n === "video" || n === "audio") && e?.id != null) try {
				let n = await a(e.id, t ? { signal: t.signal } : {});
				x === t && n?.ok && (b.value = n.data || null);
			} catch (e) {
				console.debug?.(e);
			}
		}
		P(T, (e) => void X(e), { immediate: !0 }), P(() => $.open, async (e) => {
			e ? (await te(), f.value?.focus?.(), window.addEventListener("keydown", _e, !0)) : (window.removeEventListener("keydown", _e, !0), m.value?.release?.(), x?.abort(), document.fullscreenElement && f.value?.contains(document.fullscreenElement) && document.exitFullscreen?.());
		}, { immediate: !0 }), ne(() => {
			window.removeEventListener("keydown", _e, !0), x?.abort();
		});
		function Z() {
			Re();
		}
		function fe(e = "") {
			let t = {
				assets: $.assets.slice(),
				index: $.index,
				mode: e
			};
			Re(), u("open-classic", t);
		}
		function pe() {
			document.fullscreenElement ? document.exitFullscreen?.() : f.value?.requestFullscreen?.();
		}
		function me() {
			if (!k.value) return;
			let e = document.createElement("a");
			e.href = k.value, e.download = String(T.value?.filename || ""), e.click();
		}
		async function he(n) {
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
		function ge(e) {
			return !!e?.closest?.("input, textarea, select, [contenteditable='true']");
		}
		function _e(e) {
			if (!$.open) return;
			if (ge(e.target)) {
				e.key === "Escape" && e.target?.blur?.();
				return;
			}
			let t = D.value === "video" || D.value === "audio", n = e.key, r = !0;
			n === "Escape" ? Z() : n === "ArrowLeft" && !e.shiftKey ? Be(-1) : n === "ArrowRight" && !e.shiftKey ? Be(1) : n === "ArrowLeft" && e.shiftKey && t ? m.value?.seekBy?.(-5) : n === "ArrowRight" && e.shiftKey && t ? m.value?.seekBy?.(5) : n === "Home" ? ze(0) : n === "End" ? ze(F.value - 1) : n === " " && t ? m.value?.togglePlay?.() : n === "," && t ? m.value?.stepFrame?.(-1) : n === "." && t ? m.value?.stepFrame?.(1) : (n === "i" || n === "I") && t ? m.value?.setLoopA?.() : (n === "o" || n === "O") && t ? m.value?.setLoopB?.() : (n === "u" || n === "U") && t ? m.value?.clearLoop?.() : (n === "m" || n === "M") && t ? m.value?.toggleMute?.() : n === "]" && t ? m.value?.cycleRate?.(1) : n === "[" && t ? m.value?.cycleRate?.(-1) : n === "Tab" ? h.value = !h.value : n === "f" || n === "F" ? pe() : (n === "+" || n === "=") && D.value === "image" ? p.value?.zoomBy?.(1.25) : n === "-" && D.value === "image" ? p.value?.zoomBy?.(.8) : n === "0" && D.value === "image" && e.altKey ? p.value?.fit?.() : /^[0-5]$/.test(n) && !e.ctrlKey && !e.metaKey && !e.altKey ? he(Number(n)) : (n === "c" || n === "C") && Y.value ? fe("ab") : r = !1, r && (e.preventDefault(), e.stopPropagation(), e.stopImmediatePropagation?.());
		}
		function ve(e) {
			return l(e, 192) || "";
		}
		return (e, t) => {
			let n = ee("MButton");
			return R(), j(ce, { to: "body" }, [W($).open ? (R(), U("div", {
				key: 0,
				ref_key: "overlay",
				ref: f,
				class: K(["mjr-assets-manager mjr-studio", { "is-inspector-closed": !h.value }]),
				role: "dialog",
				"aria-modal": "true",
				"aria-label": W(c)("viewer.studio.title", "Viewer"),
				tabindex: "-1"
			}, [
				M("header", ot, [
					M("div", st, [
						H(n, {
							type: "button",
							class: "mjr-studio-btn",
							title: W(c)("viewer.studio.prev", "Previous (←)"),
							disabled: F.value < 2,
							onClick: t[0] ||= (e) => W(Be)(-1)
						}, {
							default: N(() => [...t[14] ||= [M("i", {
								class: "pi pi-chevron-left",
								"aria-hidden": "true"
							}, null, -1)]]),
							_: 1
						}, 8, ["title", "disabled"]),
						M("span", ct, V(W($).index + 1) + " / " + V(F.value), 1),
						H(n, {
							type: "button",
							class: "mjr-studio-btn",
							title: W(c)("viewer.studio.next", "Next (→)"),
							disabled: F.value < 2,
							onClick: t[1] ||= (e) => W(Be)(1)
						}, {
							default: N(() => [...t[15] ||= [M("i", {
								class: "pi pi-chevron-right",
								"aria-hidden": "true"
							}, null, -1)]]),
							_: 1
						}, 8, ["title", "disabled"])
					]),
					M("div", lt, [M("span", {
						class: "mjr-studio__filename",
						title: E.value?.filepath || E.value?.filename
					}, V(E.value?.filename), 9, ut), M("span", dt, V(ae.value), 1)]),
					M("div", ft, [
						D.value === "image" ? (R(), U(A, { key: 0 }, [
							M("span", {
								class: "mjr-studio-chip",
								title: W(c)("viewer.studio.zoomHint", "Wheel to zoom, double-click for fit / 100 %")
							}, V(Math.round(v.value * 100)) + "%", 9, pt),
							H(n, {
								type: "button",
								class: "mjr-studio-btn",
								title: W(c)("viewer.studio.fit", "Fit"),
								onClick: t[2] ||= (e) => p.value?.fit()
							}, {
								default: N(() => [...t[16] ||= [M("i", {
									class: "pi pi-arrows-alt",
									"aria-hidden": "true"
								}, null, -1)]]),
								_: 1
							}, 8, ["title"]),
							H(n, {
								type: "button",
								class: "mjr-studio-btn is-text",
								title: W(c)("viewer.studio.actualSize", "Actual size"),
								onClick: t[3] ||= (e) => p.value?.actualSize()
							}, {
								default: N(() => [...t[17] ||= [O("1:1", -1)]]),
								_: 1
							}, 8, ["title"]),
							H(n, {
								type: "button",
								class: K(["mjr-studio-btn", { "is-on": _.value }]),
								title: W(c)("viewer.studio.checker", "Transparency checkerboard"),
								onClick: t[4] ||= (e) => _.value = !_.value
							}, {
								default: N(() => [...t[18] ||= [M("i", {
									class: "pi pi-th-large",
									"aria-hidden": "true"
								}, null, -1)]]),
								_: 1
							}, 8, ["class", "title"])
						], 64)) : I("", !0),
						Y.value ? (R(), j(n, {
							key: 1,
							type: "button",
							class: "mjr-studio-btn",
							title: W(c)("viewer.studio.compare", "Compare with next (C)"),
							onClick: t[5] ||= (e) => fe("ab")
						}, {
							default: N(() => [...t[19] ||= [M("i", {
								class: "pi pi-clone",
								"aria-hidden": "true"
							}, null, -1)]]),
							_: 1
						}, 8, ["title"])) : I("", !0),
						H(n, {
							type: "button",
							class: "mjr-studio-btn",
							title: W(c)("viewer.studio.download", "Download"),
							onClick: me
						}, {
							default: N(() => [...t[20] ||= [M("i", {
								class: "pi pi-download",
								"aria-hidden": "true"
							}, null, -1)]]),
							_: 1
						}, 8, ["title"]),
						H(n, {
							type: "button",
							class: "mjr-studio-btn",
							title: W(c)("viewer.studio.classic", "Open in classic viewer (tools: scopes, loupe, grading)"),
							onClick: t[6] ||= (e) => fe("")
						}, {
							default: N(() => [...t[21] ||= [M("i", {
								class: "pi pi-sliders-h",
								"aria-hidden": "true"
							}, null, -1)]]),
							_: 1
						}, 8, ["title"]),
						H(n, {
							type: "button",
							class: K(["mjr-studio-btn", { "is-on": h.value }]),
							title: W(c)("viewer.studio.inspector", "Generation info (Tab)"),
							onClick: t[7] ||= (e) => h.value = !h.value
						}, {
							default: N(() => [...t[22] ||= [M("i", {
								class: "pi pi-info-circle",
								"aria-hidden": "true"
							}, null, -1)]]),
							_: 1
						}, 8, ["class", "title"]),
						H(n, {
							type: "button",
							class: "mjr-studio-btn",
							title: W(c)("viewer.studio.fullscreen", "Fullscreen (F)"),
							onClick: pe
						}, {
							default: N(() => [...t[23] ||= [M("i", {
								class: "pi pi-window-maximize",
								"aria-hidden": "true"
							}, null, -1)]]),
							_: 1
						}, 8, ["title"]),
						H(n, {
							type: "button",
							class: "mjr-studio-btn is-close",
							title: W(c)("viewer.studio.close", "Close (Esc)"),
							onClick: Z
						}, {
							default: N(() => [...t[24] ||= [M("i", {
								class: "pi pi-times",
								"aria-hidden": "true"
							}, null, -1)]]),
							_: 1
						}, 8, ["title"])
					])
				]),
				M("main", mt, [M("section", ht, [D.value === "image" ? (R(), j(Ke, {
					ref_key: "imageStage",
					ref: p,
					key: `img:${k.value}`,
					src: k.value,
					alt: T.value?.filename,
					checker: _.value,
					onZoom: t[8] ||= (e) => v.value = e
				}, null, 8, [
					"src",
					"alt",
					"checker"
				])) : D.value === "video" || D.value === "audio" ? (R(), j(it, {
					ref_key: "player",
					ref: m,
					key: `media:${k.value}`,
					src: k.value,
					kind: D.value,
					fps: oe.value,
					"frame-count": B.value,
					filename: T.value?.filename
				}, null, 8, [
					"src",
					"kind",
					"fps",
					"frame-count",
					"filename"
				])) : (R(), U("div", gt, [
					t[25] ||= M("i", {
						class: "pi pi-file",
						"aria-hidden": "true"
					}, null, -1),
					M("span", null, V(W(c)("viewer.studio.unsupported", "No preview for this file type.")), 1),
					H(n, {
						type: "button",
						class: "mjr-studio-btn is-text",
						onClick: t[9] ||= (e) => fe("")
					}, {
						default: N(() => [O(V(W(c)("viewer.studio.classicShort", "Classic viewer")), 1)]),
						_: 1
					})
				]))]), h.value && E.value ? (R(), U("aside", {
					key: 0,
					class: "mjr-studio__inspector",
					onKeydown: t[13] ||= re(() => {}, ["stop"])
				}, [
					M("div", _t, [M("div", vt, [M("span", yt, V(W(c)("sidebar.rating", "Rating")), 1), (R(), j(le, {
						key: `r:${E.value.id}`,
						asset: E.value,
						"model-value": se.value,
						size: 40
					}, null, 8, ["asset", "model-value"]))]), (R(), j(J, {
						key: `t:${E.value.id}`,
						asset: E.value,
						"model-value": q.value
					}, null, 8, ["asset", "model-value"]))]),
					M("nav", bt, [
						H(n, {
							type: "button",
							role: "tab",
							class: K({ "is-active": g.value === "generation" }),
							onClick: t[10] ||= (e) => g.value = "generation"
						}, {
							default: N(() => [O(V(W(c)("viewer.studio.tabGeneration", "Generation")), 1)]),
							_: 1
						}, 8, ["class"]),
						H(n, {
							type: "button",
							role: "tab",
							class: K({ "is-active": g.value === "workflow" }),
							onClick: t[11] ||= (e) => g.value = "workflow"
						}, {
							default: N(() => [O(V(W(c)("viewer.studio.tabWorkflow", "Workflow")), 1)]),
							_: 1
						}, 8, ["class"]),
						H(n, {
							type: "button",
							role: "tab",
							class: K({ "is-active": g.value === "file" }),
							onClick: t[12] ||= (e) => g.value = "file"
						}, {
							default: N(() => [O(V(W(c)("viewer.studio.tabFile", "File")), 1)]),
							_: 1
						}, 8, ["class"])
					]),
					M("div", xt, [g.value === "generation" ? (R(), j(C, {
						key: `g:${E.value.id}`,
						asset: E.value
					}, null, 8, ["asset"])) : g.value === "workflow" ? (R(), j(w, {
						key: `w:${E.value.id}`,
						asset: E.value
					}, null, 8, ["asset"])) : (R(), j(S, {
						key: `f:${E.value.id}`,
						asset: E.value
					}, null, 8, ["asset"]))])
				], 32)) : I("", !0)]),
				F.value > 1 ? (R(), U("footer", {
					key: 0,
					class: "mjr-studio__filmstrip",
					role: "listbox",
					"aria-label": W(c)("viewer.studio.filmstrip", "Filmstrip")
				}, [(R(!0), U(A, null, ie(de.value, (e) => (R(), j(n, {
					key: `${e.index}:${e.asset?.id ?? e.asset?.filename}`,
					type: "button",
					role: "option",
					class: K(["mjr-studio__thumb", { "is-current": e.index === W($).index }]),
					"aria-selected": e.index === W($).index,
					title: e.asset?.filename,
					onClick: (t) => W(ze)(e.index)
				}, {
					default: N(() => [ve(e.asset) ? (R(), U("img", {
						key: 0,
						src: ve(e.asset),
						alt: "",
						loading: "lazy",
						draggable: "false"
					}, null, 8, Ct)) : (R(), U("i", wt)), W(Q)(e.asset) === "video" ? (R(), U("i", Tt)) : I("", !0)]),
					_: 2
				}, 1032, [
					"class",
					"aria-selected",
					"title",
					"onClick"
				]))), 128))], 8, St)) : I("", !0)
			], 10, at)) : I("", !0)]);
		};
	}
}), Dt = /* @__PURE__ */ F({
	__name: "ViewerPortal",
	setup(e) {
		let t = null;
		function n(e) {
			let n = e?.detail || {}, i = Array.isArray(n?.assets) ? n.assets.filter(Boolean) : n?.asset ? [n.asset] : [];
			if (!i.length) return;
			let a = Math.max(0, Math.min(Number(n?.index) || 0, i.length - 1)), o = String(n?.mode || "").trim().toLowerCase();
			if (Ve(i, a, o) && Le(i, a)) {
				try {
					t?.close?.();
				} catch (e) {
					console.debug?.(e);
				}
				n.handled = !0;
			} else r(i, a, o, n);
		}
		function r(e, n, r, i = null) {
			Re();
			try {
				t ||= y(), t.open?.(e, n), (r === "ab" || r === "sidebyside") && t.setMode?.(r), i && (i.handled = !0);
			} catch (e) {
				console.debug?.(e);
			}
		}
		return q(() => {
			try {
				D();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				t = y();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				window.addEventListener(u.OPEN_VIEWER, n);
			} catch (e) {
				console.debug?.(e);
			}
		}), k(() => {
			try {
				window.removeEventListener(u.OPEN_VIEWER, n);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				E();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				t?.dispose?.();
			} catch (e) {
				console.debug?.(e);
			}
			t = null;
		}), (e, t) => (R(), U(A, null, [
			H(Et, { onOpenClassic: t[0] ||= (e) => r(e.assets, e.index, e.mode) }),
			H(Y),
			H(de),
			H(ye)
		], 64));
	}
});
export { Dt as default };
