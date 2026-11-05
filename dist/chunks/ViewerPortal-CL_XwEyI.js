import { Gt as e, T as t, Xn as n, an as r, ar as i, f as a, s as o, u as s } from "./config-CFn_k7fR.js";
import { a as c, i as l, r as u } from "./floatingViewerManager-DbPLStm0.js";
import { i as d, r as f, t as p } from "./events-1iwo5blr.js";
import { a as ee, i as m, n as h, r as g, t as _ } from "./TagsEditor-D_lUmuL4.js";
import { $ as te, A as v, B as ne, C as y, D as b, E as x, H as S, J as re, K as C, M as w, O as T, P as E, Q as D, S as O, T as k, U as A, V as ie, W as j, X as M, Y as N, b as ae, gt as P, ht as F, j as I, k as L, lt as oe, mt as R, ot as se, pt as z, q as B, rt as ce, st as V, w as le, z as H } from "./mjr-primevue-C07IsEdU.js";
import { C as U, _ as W, a as ue, b as de, c as G, d as fe, f as pe, g as me, h as he, i as ge, l as _e, m as ve, n as ye, o as K, p as be, r as xe, s as q, t as Se, u as Ce, v as we, x as Te, y as Ee } from "./genInfo-CchPcwTU.js";
// ui/vue/components/viewer/FloatingViewerHost.vue
var De = /* @__PURE__ */ E({
	__name: "FloatingViewerHost",
	setup(e) {
		let t = V(null), n = null;
		return S(() => {
			n = c(t.value);
		}), A(() => {
			n?.(), n = null;
		}), (e, n) => (j(), L("div", {
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
}), Oe = null, J = null;
function Y(e, t, n) {
	let r = e || document.createElement("canvas");
	return r.width !== t && (r.width = t), r.height !== n && (r.height = n), {
		c: r,
		ctx: r.getContext("2d", { willReadFrequently: !0 })
	};
}
function X(e) {
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
function Z(e) {
	return e ? e instanceof HTMLVideoElement ? e.readyState >= 2 && e.videoWidth > 0 : e instanceof HTMLImageElement ? e.complete && e.naturalWidth > 0 : e.width > 0 : !1;
}
function ke(e, t = 256) {
	if (!Z(e)) return null;
	let { w: n, h: r } = X(e), i = Te(n, r, t);
	if (!i.w || !i.h) return null;
	try {
		let { c: t, ctx: n } = Y(Oe, i.w, i.h);
		return Oe = t, n ? (n.clearRect(0, 0, i.w, i.h), n.drawImage(e, 0, 0, i.w, i.h), {
			data: n.getImageData(0, 0, i.w, i.h).data,
			width: i.w,
			height: i.h
		}) : null;
	} catch {
		return null;
	}
}
function Ae(e, t, n) {
	if (!Z(e)) return null;
	let { w: r, h: i } = X(e), a = Math.floor(t), o = Math.floor(n);
	if (a < 0 || o < 0 || a >= r || o >= i) return null;
	try {
		let { c: t, ctx: n } = Y(J, 1, 1);
		if (J = t, !n) return null;
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
function je(e, t, n, r, i) {
	if (!Z(t)) return !1;
	let a = e.getContext("2d");
	if (!a) return !1;
	let o = e.width / Math.max(1, i);
	try {
		return a.imageSmoothingEnabled = !1, a.fillStyle = "#111", a.fillRect(0, 0, e.width, e.height), a.drawImage(t, Math.floor(n - o / 2), Math.floor(r - o / 2), Math.ceil(o), Math.ceil(o), 0, 0, e.width, e.height), !0;
	} catch {
		return !1;
	}
}
async function Me(e) {
	if (!Z(e)) return null;
	let { w: t, h: n } = X(e), r = document.createElement("canvas");
	r.width = t, r.height = n;
	try {
		return r.getContext("2d")?.drawImage(e, 0, 0), await new Promise((e) => r.toBlob(e, "image/png"));
	} catch {
		return null;
	}
}
// ui/features/viewer/studio/studioViewerState.ts
var Q = se({
	open: !1,
	assets: [],
	index: 0,
	session: 0,
	compare: ""
});
function Ne(e = "") {
	let t = String(e || "").trim().toLowerCase();
	return t === "ab" ? "wipe" : t === "sidebyside" ? "side" : "";
}
function Pe(e, t = 0, n = "") {
	let r = (Array.isArray(e) ? e : []).filter(Boolean);
	return r.length ? (Q.assets = r, Q.index = Math.max(0, Math.min(Number(t) || 0, r.length - 1)), Q.compare = r.length > 1 ? Ne(n) : "", Q.session += 1, Q.open = !0, !0) : !1;
}
function Fe() {
	Q.open = !1;
}
function Ie(e) {
	let t = Q.assets.length;
	t && (Q.index = (Math.floor(e) % t + t) % t);
}
function Le(e) {
	Ie(Q.index + e);
}
// ui/vue/components/viewer/studio/StudioFxDefs.vue?vue&type=script&setup=true&lang.ts
var Re = {
	class: "mjr-studio-fx-defs",
	width: "0",
	height: "0",
	"aria-hidden": "true",
	focusable: "false"
}, ze = ["id"], Be = ["href"], Ve = ["in"], He = ["slope"], Ue = ["slope"], We = ["slope"], Ge = {
	in: "mjrExposed",
	result: "mjrGamma"
}, Ke = ["exponent"], qe = ["exponent"], Je = ["exponent"], Ye = ["values"], Xe = /* @__PURE__ */ E({
	__name: "StudioFxDefs",
	props: {
		filterId: {},
		channel: {},
		exposure: {},
		gamma: {},
		subtractSrc: {}
	},
	setup(e) {
		let t = e, n = k(() => _e(t.channel)), r = k(() => he(t.exposure)), i = k(() => W(t.gamma));
		return (t, a) => (j(), L("svg", Re, [x("defs", null, [x("filter", {
			id: e.filterId,
			x: "0",
			y: "0",
			width: "1",
			height: "1",
			filterUnits: "objectBoundingBox",
			primitiveUnits: "objectBoundingBox",
			"color-interpolation-filters": "sRGB"
		}, [
			e.subtractSrc ? (j(), L(y, { key: 0 }, [x("feImage", {
				href: e.subtractSrc,
				x: "0",
				y: "0",
				width: "1",
				height: "1",
				preserveAspectRatio: "none",
				result: "mjrB"
			}, null, 8, Be), a[0] ||= v("<feComponentTransfer in=\"mjrB\" result=\"mjrInvB\"><feFuncR type=\"table\" tableValues=\"1 0\"></feFuncR><feFuncG type=\"table\" tableValues=\"1 0\"></feFuncG><feFuncB type=\"table\" tableValues=\"1 0\"></feFuncB></feComponentTransfer><feComposite in=\"SourceGraphic\" in2=\"mjrInvB\" operator=\"arithmetic\" k1=\"0\" k2=\"1\" k3=\"1\" k4=\"-1\" result=\"mjrBase\"></feComposite>", 2)], 64)) : T("", !0),
			x("feComponentTransfer", {
				in: e.subtractSrc ? "mjrBase" : "SourceGraphic",
				result: "mjrExposed"
			}, [
				x("feFuncR", {
					type: "linear",
					slope: r.value
				}, null, 8, He),
				x("feFuncG", {
					type: "linear",
					slope: r.value
				}, null, 8, Ue),
				x("feFuncB", {
					type: "linear",
					slope: r.value
				}, null, 8, We)
			], 8, Ve),
			x("feComponentTransfer", Ge, [
				x("feFuncR", {
					type: "gamma",
					amplitude: "1",
					exponent: i.value,
					offset: "0"
				}, null, 8, Ke),
				x("feFuncG", {
					type: "gamma",
					amplitude: "1",
					exponent: i.value,
					offset: "0"
				}, null, 8, qe),
				x("feFuncB", {
					type: "gamma",
					amplitude: "1",
					exponent: i.value,
					offset: "0"
				}, null, 8, Je)
			]),
			n.value ? (j(), L("feColorMatrix", {
				key: 1,
				in: "mjrGamma",
				type: "matrix",
				values: n.value
			}, null, 8, Ye)) : T("", !0)
		], 8, ze)])]));
	}
}), Ze = ["viewBox"], Qe = ["d", "fill"], $e = [
	"x",
	"y",
	"width",
	"height"
], et = [
	"x1",
	"y1",
	"x2",
	"y2"
], tt = [
	"x",
	"y",
	"width",
	"height"
], nt = /* @__PURE__ */ E({
	__name: "StudioGuides",
	props: {
		width: {},
		height: {},
		grid: {},
		aspect: {},
		maskOpacity: {}
	},
	setup(e) {
		let t = e, n = k(() => we(t.width, t.height, t.grid)), r = k(() => G(t.width, t.height, t.aspect)), i = k(() => {
			let e = r.value;
			if (!e) return "";
			let { width: n, height: i } = t;
			return `M0 0H${n}V${i}H0Z M${e.x} ${e.y}V${e.y + e.h}H${e.x + e.w}V${e.y}Z`;
		}), a = k(() => t.width > 0 && t.height > 0 && (t.grid !== "off" || !!r.value));
		return (t, o) => a.value ? (j(), L("svg", {
			key: 0,
			class: "mjr-studio-guides",
			viewBox: `0 0 ${e.width} ${e.height}`,
			preserveAspectRatio: "none",
			"aria-hidden": "true"
		}, [
			i.value ? (j(), L("path", {
				key: 0,
				d: i.value,
				"fill-rule": "evenodd",
				fill: `rgba(0,0,0,${e.maskOpacity})`
			}, null, 8, Qe)) : T("", !0),
			r.value ? (j(), L("rect", {
				key: 1,
				x: r.value.x,
				y: r.value.y,
				width: r.value.w,
				height: r.value.h,
				fill: "none",
				class: "mjr-studio-guides__mask-edge",
				"vector-effect": "non-scaling-stroke"
			}, null, 8, $e)) : T("", !0),
			(j(!0), L(y, null, C(n.value.lines, (e, t) => (j(), L("line", {
				key: `l${t}`,
				x1: e.x1,
				y1: e.y1,
				x2: e.x2,
				y2: e.y2,
				class: "mjr-studio-guides__line",
				"vector-effect": "non-scaling-stroke"
			}, null, 8, et))), 128)),
			(j(!0), L(y, null, C(n.value.rects, (e, t) => (j(), L("rect", {
				key: `r${t}`,
				x: e.x,
				y: e.y,
				width: e.w,
				height: e.h,
				fill: "none",
				class: "mjr-studio-guides__safe",
				"vector-effect": "non-scaling-stroke"
			}, null, 8, tt))), 128))
		], 8, Ze)) : T("", !0);
	}
}), rt = ["src", "alt"], it = ["src"], at = ["src"], ot = {
	key: 0,
	class: "mjr-studio-stage__ab"
}, st = { class: "is-sep" }, ct = {
	key: 1,
	class: "mjr-studio-stage__error"
}, lt = .05, ut = 32, dt = 16, ft = /* @__PURE__ */ E({
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
		"update:wipe",
		"dismiss"
	],
	setup(e, { expose: t, emit: n }) {
		let r = e, i = n, a = V(null), o = V(null), s = V(null), c = V({
			w: 0,
			h: 0
		}), l = V(1), u = V({
			x: 0,
			y: 0
		}), d = V(!0), f = V(!1), p = V(!1), ee = V(!1), m = null, h = null, g = k(() => !!r.compareSrc && r.compare !== "off"), _ = k(() => g.value && r.compare === "side"), v = k(() => g.value && (r.compare === "wipe" || r.compare === "wipeV")), ne = k(() => g.value ? Ce(r.compare) : null), y = k(() => g.value && r.compare !== "subtract");
		function b() {
			return _.value ? c.value.w * 2 + dt : c.value.w;
		}
		function re() {
			let e = a.value?.getBoundingClientRect();
			return {
				w: e?.width || 0,
				h: e?.height || 0
			};
		}
		function C() {
			let { w: e, h: t } = re();
			return !c.value.w || !c.value.h || !e || !t ? 1 : Math.min(e / b(), t / c.value.h);
		}
		function w() {
			d.value = !0, l.value = C(), u.value = {
				x: _.value ? -((c.value.w + dt) / 2) * l.value : 0,
				y: 0
			}, i("zoom", l.value);
		}
		function E(e, t) {
			let n = Math.max(lt, Math.min(ut, e)), { w: r, h: a } = re(), o = t ? t.x - r / 2 : 0, s = t ? t.y - a / 2 : 0, c = n / l.value;
			u.value = {
				x: o - (o - u.value.x) * c,
				y: s - (s - u.value.y) * c
			}, l.value = n, d.value = !1, i("zoom", l.value);
		}
		function D(e) {
			E(l.value * e);
		}
		function A() {
			E(1), u.value = {
				x: 0,
				y: 0
			};
		}
		function N() {
			d.value ? A() : w();
		}
		function I(e) {
			e.preventDefault();
			let t = a.value?.getBoundingClientRect(), n = Math.exp(-e.deltaY * .0015);
			E(l.value * n, t ? {
				x: e.clientX - t.left,
				y: e.clientY - t.top
			} : void 0);
		}
		function oe(e) {
			e.button === 0 && (m = {
				x: e.clientX,
				y: e.clientY,
				ox: u.value.x,
				oy: u.value.y,
				id: e.pointerId,
				t: Date.now()
			}, p.value = !0, e.currentTarget?.setPointerCapture?.(e.pointerId));
		}
		function se(e) {
			m && (u.value = {
				x: m.ox + e.clientX - m.x,
				y: m.oy + e.clientY - m.y
			}, Math.abs(e.clientX - m.x) + Math.abs(e.clientY - m.y) > 2 && (d.value = !1));
		}
		function z(e) {
			let t = m;
			t && e.currentTarget?.releasePointerCapture?.(t.id), m = null, p.value = !1, t && e.type === "pointerup" && e.button === 0 && Math.hypot(e.clientX - t.x, e.clientY - t.y) <= 6 && Date.now() - t.t <= 600 && document.elementFromPoint(e.clientX, e.clientY) === a.value && i("dismiss");
		}
		function ce(e) {
			let t = o.value?.getBoundingClientRect();
			if (!t || t.width <= 0 || t.height <= 0) return;
			let n = r.compare === "wipeV" ? (e.clientY - t.top) / t.height : (e.clientX - t.left) / t.width;
			i("update:wipe", Math.round(Math.max(0, Math.min(1, n)) * 1e3) / 10);
		}
		function le(e) {
			ee.value = !0, e.currentTarget?.setPointerCapture?.(e.pointerId), ce(e);
		}
		function H(e) {
			ee.value && ce(e);
		}
		function U() {
			ee.value = !1;
		}
		function W(e) {
			let t = e.target;
			c.value = {
				w: t.naturalWidth,
				h: t.naturalHeight
			}, f.value = !1, i("loaded", {
				width: t.naturalWidth,
				height: t.naturalHeight
			}), w();
		}
		let ue = k(() => ({
			width: `${c.value.w}px`,
			height: `${c.value.h}px`,
			transform: `translate(-50%, -50%) translate(${u.value.x}px, ${u.value.y}px) scale(${l.value})`,
			imageRendering: l.value >= 2 ? "pixelated" : "auto",
			"--mjr-inv-scale": String(1 / (l.value || 1))
		})), de = k(() => r.mediaFilter ? { filter: r.mediaFilter } : {}), G = k(() => {
			if (ne.value) return { mixBlendMode: ne.value };
			if (v.value) {
				let e = Math.max(0, Math.min(100, r.wipe));
				return { clipPath: r.compare === "wipeV" ? `inset(${e}% 0 0 0)` : `inset(0 0 0 ${e}%)` };
			}
			return {};
		}), fe = k(() => r.compare === "wipeV" ? { top: `${r.wipe}%` } : { left: `${r.wipe}%` });
		return M(() => r.src, () => {
			c.value = {
				w: 0,
				h: 0
			}, f.value = !1;
		}), M(_, () => {
			d.value && w();
		}), S(() => {
			try {
				h = new ResizeObserver(() => {
					d.value && w();
				}), a.value && h.observe(a.value);
			} catch (e) {
				console.debug?.(e);
			}
		}), ie(() => h?.disconnect()), t({
			zoomBy: D,
			fit: w,
			actualSize: A,
			toggleFitActual: N,
			getSource: () => s.value && !f.value ? s.value : null,
			getBox: () => o.value,
			naturalSize: () => ({ ...c.value })
		}), (t, n) => (j(), L("div", {
			ref_key: "stage",
			ref: a,
			class: R(["mjr-studio-stage", {
				"is-checker": e.checker,
				"is-dragging": p.value
			}]),
			onWheel: I,
			onPointerdown: oe,
			onPointermove: se,
			onPointerup: z,
			onPointercancel: z,
			onDblclick: N
		}, [
			te(x("div", {
				class: "mjr-studio-stage__box",
				style: F(ue.value)
			}, [
				x("div", {
					ref_key: "box",
					ref: o,
					class: "mjr-studio-stage__layers",
					style: F(de.value)
				}, [(j(), L("img", {
					ref_key: "img",
					ref: s,
					key: e.src,
					class: "mjr-studio-stage__img",
					src: e.src,
					alt: e.alt,
					draggable: "false",
					onLoad: W,
					onError: n[0] ||= (e) => f.value = !0
				}, null, 40, rt)), y.value && !_.value ? (j(), L("img", {
					key: `b:${e.compareSrc}`,
					class: "mjr-studio-stage__img is-b",
					src: e.compareSrc || "",
					alt: "",
					draggable: "false",
					style: F(G.value)
				}, null, 12, it)) : T("", !0)], 4),
				B(t.$slots, "overlay", {
					width: c.value.w,
					height: c.value.h
				}),
				v.value ? (j(), L("div", {
					key: 0,
					class: R(["mjr-studio-stage__divider", {
						"is-vertical": e.compare === "wipeV",
						"is-active": ee.value
					}]),
					style: F(fe.value),
					onPointerdown: O(le, ["stop"]),
					onPointermove: H,
					onPointerup: U,
					onPointercancel: U,
					onDblclick: n[1] ||= O((e) => i("update:wipe", 50), ["stop"])
				}, [...n[2] ||= [x("span", { class: "mjr-studio-stage__divider-grip" }, null, -1)]], 38)) : T("", !0),
				y.value && _.value ? (j(), L("div", {
					key: 1,
					class: "mjr-studio-stage__side",
					style: F({
						left: `calc(100% + ${dt}px)`,
						filter: e.mediaFilter || void 0
					})
				}, [(j(), L("img", {
					key: `side:${e.compareSrc}`,
					class: "mjr-studio-stage__img",
					src: e.compareSrc || "",
					alt: "",
					draggable: "false"
				}, null, 8, at))], 4)) : T("", !0)
			], 4), [[ae, !f.value]]),
			g.value ? (j(), L("div", ot, [
				n[3] ||= x("span", null, "A", -1),
				x("span", st, P(e.compare === "wipeV" ? "/" : "|"), 1),
				n[4] ||= x("span", null, "B", -1)
			])) : T("", !0),
			f.value ? (j(), L("div", ct, [n[5] ||= x("i", {
				class: "pi pi-image",
				"aria-hidden": "true"
			}, null, -1), x("span", null, P(e.alt), 1)])) : T("", !0)
		], 34));
	}
}), pt = /* @__PURE__ */ E({
	__name: "StudioModel3D",
	props: {
		asset: {},
		src: {}
	},
	setup(e) {
		let t = e, n = V(null), r = null;
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
		return S(() => {
			if (n.value && t.src) try {
				r = U(t.asset, t.src, {
					hostClassName: "mjr-model3d-host mjr-studio-model3d__host",
					canvasClassName: "mjr-model3d-render-canvas mjr-studio-model3d__canvas",
					hintText: "Rotate: left drag  Pan: right drag  Zoom: wheel or middle drag",
					disableViewerTransform: !0
				}), r && n.value.appendChild(r);
			} catch (e) {
				console.debug?.(e);
			}
		}), ie(i), (e, t) => (j(), L("div", {
			ref_key: "host",
			ref: n,
			class: "mjr-studio-model3d",
			onWheel: t[0] ||= O(() => {}, ["stop"]),
			onPointerdown: t[1] ||= O(() => {}, ["stop"]),
			onContextmenu: t[2] ||= O(() => {}, ["prevent"])
		}, null, 544));
	}
}), mt = {
	key: 0,
	class: "mjr-studio-probe",
	"aria-hidden": "true"
}, ht = ["width", "height"], gt = { class: "is-dim" }, _t = { class: "is-dim" }, vt = /* @__PURE__ */ E({
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
		let t = e, n = V(null), r = V(null), i = oe(null), a = 0, o = null;
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
			let { w: u, h: d } = X(c), f = (e.clientX - l.left) / l.width * u, p = (e.clientY - l.top) / l.height * d;
			if (r.value = {
				x: e.clientX,
				y: e.clientY
			}, t.loupe && n.value && je(n.value, c, f, p, t.loupeZoom), t.probe) {
				let e = Ae(c, f, p);
				i.value = e ? {
					x: Math.floor(f),
					y: Math.floor(p),
					...me(e[0], e[1], e[2], e[3])
				} : null;
			}
		}
		function c(e) {
			o = e, a ||= requestAnimationFrame(s);
		}
		return S(() => window.addEventListener("pointermove", c, { passive: !0 })), ie(() => {
			window.removeEventListener("pointermove", c), a && cancelAnimationFrame(a);
		}), (t, a) => r.value ? (j(), L("div", mt, [e.loupe ? (j(), L("div", {
			key: 0,
			class: "mjr-studio-probe__loupe",
			style: F({
				left: `${r.value.x + 18}px`,
				top: `${r.value.y + 18}px`,
				width: `${e.loupeSize}px`,
				height: `${e.loupeSize}px`
			})
		}, [x("canvas", {
			ref_key: "loupeCanvas",
			ref: n,
			width: e.loupeSize,
			height: e.loupeSize,
			style: F(e.mediaFilter ? { filter: e.mediaFilter } : void 0)
		}, null, 12, ht), a[0] ||= x("span", { class: "mjr-studio-probe__cross" }, null, -1)], 4)) : T("", !0), e.probe && i.value ? (j(), L("div", {
			key: 1,
			class: "mjr-studio-probe__chip",
			style: F({
				left: `${r.value.x + 18}px`,
				top: `${r.value.y + (e.loupe ? e.loupeSize + 26 : 18)}px`
			})
		}, [
			x("span", {
				class: "mjr-studio-probe__swatch",
				style: F({ background: i.value.hex })
			}, null, 4),
			x("span", null, P(i.value.hex), 1),
			x("span", gt, P(i.value.rgb), 1),
			x("span", _t, "L " + P(i.value.luma) + " · " + P(i.value.x) + "," + P(i.value.y), 1)
		], 4)) : T("", !0)])) : T("", !0);
	}
}), yt = {
	class: "mjr-studio-scopes",
	"aria-label": "Scopes"
}, bt = {
	key: 0,
	class: "mjr-studio-scopes__panel"
}, xt = { class: "mjr-studio-scopes__label" }, St = {
	key: 1,
	class: "mjr-studio-scopes__panel"
}, Ct = { class: "mjr-studio-scopes__label" }, wt = /* @__PURE__ */ E({
	__name: "StudioScopes",
	props: {
		getSource: { type: Function },
		mode: {},
		tick: {}
	},
	setup(e) {
		let t = e, n = V(null), i = V(null);
		function a(e) {
			let t = n.value, r = t?.getContext("2d");
			if (!t || !r) return;
			let i = fe(e);
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
		function o(e, t, n) {
			let r = i.value, a = r?.getContext("2d");
			if (!r || !a) return;
			let o = pe(e, t, n, 256), s = a.createImageData(o.columns, 256);
			for (let e = 0; e < o.columns; e++) for (let t = 0; t < 256; t++) {
				let n = o.bins[e * 256 + t];
				if (!n) continue;
				let r = Math.min(255, 40 + n / o.max * 1200), i = ((255 - t) * o.columns + e) * 4;
				s.data[i] = 120, s.data[i + 1] = 255, s.data[i + 2] = 150, s.data[i + 3] = r;
			}
			r.width = o.columns, r.height = 256, a.putImageData(s, 0, 0);
		}
		function s() {
			if (t.mode === "off") return;
			let e = ke(t.getSource(), 256);
			e && ((t.mode === "hist" || t.mode === "both") && a(e.data), (t.mode === "wave" || t.mode === "both") && o(e.data, e.width, e.height));
		}
		return M(() => [t.tick, t.mode], () => requestAnimationFrame(s)), S(s), (t, a) => (j(), L("div", yt, [e.mode === "hist" || e.mode === "both" ? (j(), L("div", bt, [x("span", xt, P(z(r)("viewer.studio.histogram", "Histogram")), 1), x("canvas", {
			ref_key: "hist",
			ref: n,
			width: "256",
			height: "110"
		}, null, 512)])) : T("", !0), e.mode === "wave" || e.mode === "both" ? (j(), L("div", St, [x("span", Ct, P(z(r)("viewer.studio.waveform", "Waveform")), 1), x("canvas", {
			ref_key: "wave",
			ref: i,
			width: "256",
			height: "256",
			class: "is-wave"
		}, null, 512)])) : T("", !0)]));
	}
}), Tt = ["title"], Et = { class: "mjr-studio-slider__head" }, Dt = { class: "mjr-studio-slider__value" }, Ot = [
	"aria-label",
	"aria-valuemin",
	"aria-valuemax",
	"aria-valuenow"
], $ = /* @__PURE__ */ E({
	__name: "StudioSlider",
	props: /*@__PURE__*/ H({
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
		let t = e, n = N(e, "modelValue"), r = V(null), i = V(!1), a = k(() => (n.value - t.min) / (t.max - t.min) * 100), o = k(() => t.format ? t.format(n.value) : String(n.value));
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
		return (t, i) => (j(), L("div", {
			class: "mjr-studio-slider",
			title: e.defaultValue == null ? void 0 : "Double-click to reset",
			onDblclick: p
		}, [x("div", Et, [x("span", null, P(e.label), 1), x("span", Dt, P(o.value), 1)]), x("div", {
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
		}, [x("div", {
			class: "mjr-studio-slider__fill",
			style: F({ width: `${a.value}%` })
		}, null, 4), x("div", {
			class: "mjr-studio-slider__knob",
			style: F({ left: `${a.value}%` })
		}, null, 4)], 40, Ot)], 40, Tt));
	}
}), kt = ["aria-label"], At = {
	key: 0,
	class: "mjr-studio-rail__tag"
}, jt = { class: "mjr-studio-rail__title" }, Mt = { class: "mjr-studio-seg" }, Nt = { class: "mjr-studio-rail__title" }, Pt = { class: "mjr-studio-rail__title" }, Ft = { class: "mjr-studio-seg" }, It = { class: "mjr-studio-rail__title" }, Lt = { class: "mjr-studio-seg is-wrap" }, Rt = { class: "mjr-studio-rail__title" }, zt = { class: "mjr-studio-seg is-wrap" }, Bt = { class: "mjr-studio-rail__title" }, Vt = { class: "mjr-studio-seg is-wrap" }, Ht = { class: "mjr-studio-rail__title" }, Ut = { class: "mjr-studio-rail__title" }, Wt = { class: "mjr-studio-seg is-wrap" }, Gt = { class: "mjr-studio-rail__b" }, Kt = ["title"], qt = { class: "mjr-studio-seg" }, Jt = /* @__PURE__ */ E({
	__name: "StudioToolRail",
	props: /*@__PURE__*/ H({
		isVideo: { type: Boolean },
		canAnalyse: { type: Boolean },
		canCompare: { type: Boolean },
		compareName: {}
	}, {
		tools: { required: !0 },
		toolsModifiers: {}
	}),
	emits: /*@__PURE__*/ H([
		"cycle-b",
		"pin-b",
		"swap",
		"copy"
	], ["update:tools"]),
	setup(e, { expose: t, emit: n }) {
		let i = N(e, "tools"), a = e, o = n, s = V(null), c = V(0), l = V(null), u = [
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
		], ee = k(() => q.filter((e) => !(a.isVideo && e.imageOnly))), m = k(() => Math.abs(i.value.exposure) > .001 || Math.abs(i.value.gamma - 1) > .001);
		function h(e, t) {
			if (s.value === e) {
				s.value = null;
				return;
			}
			let n = t.currentTarget, r = l.value?.getBoundingClientRect().top ?? 0;
			c.value = Math.max(0, (n?.getBoundingClientRect().top ?? r) - r), s.value = e;
		}
		function g() {
			let e = ve();
			i.value.exposure = e.exposure, i.value.gamma = e.gamma;
		}
		function _() {
			let e = ve();
			Object.assign(i.value, {
				...e,
				loupeSize: i.value.loupeSize,
				loupeZoom: i.value.loupeZoom
			}), s.value = null;
		}
		function te(e) {
			i.value.compare = i.value.compare === e ? "off" : e;
		}
		function v(e) {
			s.value && (l.value?.contains(e.target) || (s.value = null));
		}
		S(() => {
			document.addEventListener("pointerdown", v, !0);
		}), ie(() => {
			document.removeEventListener("pointerdown", v, !0);
		});
		let ne = (e) => `${e > 0 ? "+" : ""}${e.toFixed(2)} EV`, E = (e) => e.toFixed(2), A = (e) => `${Math.round(e * 100)}%`, M = (e) => `${e}×`, ae = (e) => `${e}px`;
		function oe() {
			return s.value ? (s.value = null, !0) : !1;
		}
		return t({ closePanel: oe }), (t, n) => {
			let a = re("MButton");
			return j(), L("div", {
				ref_key: "rail",
				ref: l,
				class: "mjr-studio-rail",
				onPointerdown: n[24] ||= O(() => {}, ["stop"]),
				onWheel: n[25] ||= O(() => {}, ["stop"]),
				onDblclick: n[26] ||= O(() => {}, ["stop"])
			}, [x("div", {
				class: "mjr-studio-rail__bar",
				role: "toolbar",
				"aria-label": z(r)("viewer.studio.tools", "Review tools")
			}, [
				e.canAnalyse ? (j(), L(y, { key: 0 }, [
					w(a, {
						type: "button",
						class: R(["mjr-studio-rail__btn", {
							"is-on": i.value.channel !== "rgb",
							"is-open": s.value === "channels"
						}]),
						title: z(r)("viewer.studio.channels", "Channels"),
						onClick: n[0] ||= (e) => h("channels", e)
					}, {
						default: D(() => [n[27] ||= x("i", {
							class: "pi pi-palette",
							"aria-hidden": "true"
						}, null, -1), i.value.channel === "rgb" ? T("", !0) : (j(), L("span", At, P(i.value.channel.toUpperCase()), 1))]),
						_: 1
					}, 8, ["class", "title"]),
					w(a, {
						type: "button",
						class: R(["mjr-studio-rail__btn", {
							"is-on": m.value,
							"is-open": s.value === "exposure"
						}]),
						title: z(r)("viewer.studio.exposure", "Exposure / gamma"),
						onClick: n[1] ||= (e) => h("exposure", e)
					}, {
						default: D(() => [...n[28] ||= [x("i", {
							class: "pi pi-bolt",
							"aria-hidden": "true"
						}, null, -1)]]),
						_: 1
					}, 8, ["class", "title"]),
					w(a, {
						type: "button",
						class: R(["mjr-studio-rail__btn", {
							"is-on": i.value.zebra,
							"is-open": s.value === "zebra"
						}]),
						title: z(r)("viewer.studio.zebra", "Zebra highlights (Z)"),
						onClick: n[2] ||= (e) => h("zebra", e)
					}, {
						default: D(() => [...n[29] ||= [x("i", {
							class: "pi pi-exclamation-triangle",
							"aria-hidden": "true"
						}, null, -1)]]),
						_: 1
					}, 8, ["class", "title"]),
					w(a, {
						type: "button",
						class: R(["mjr-studio-rail__btn", {
							"is-on": i.value.scopes !== "off",
							"is-open": s.value === "scopes"
						}]),
						title: z(r)("viewer.studio.scopes", "Scopes (S)"),
						onClick: n[3] ||= (e) => h("scopes", e)
					}, {
						default: D(() => [...n[30] ||= [x("i", {
							class: "pi pi-chart-bar",
							"aria-hidden": "true"
						}, null, -1)]]),
						_: 1
					}, 8, ["class", "title"]),
					n[31] ||= x("span", { class: "mjr-studio-rail__sep" }, null, -1)
				], 64)) : T("", !0),
				w(a, {
					type: "button",
					class: R(["mjr-studio-rail__btn", {
						"is-on": i.value.grid !== "off",
						"is-open": s.value === "grid"
					}]),
					title: z(r)("viewer.studio.grid", "Guides (G)"),
					onClick: n[4] ||= (e) => h("grid", e)
				}, {
					default: D(() => [...n[32] ||= [x("i", {
						class: "pi pi-th-large",
						"aria-hidden": "true"
					}, null, -1)]]),
					_: 1
				}, 8, ["class", "title"]),
				w(a, {
					type: "button",
					class: R(["mjr-studio-rail__btn", {
						"is-on": i.value.aspect !== "off",
						"is-open": s.value === "aspect"
					}]),
					title: z(r)("viewer.studio.aspect", "Aspect ratio mask"),
					onClick: n[5] ||= (e) => h("aspect", e)
				}, {
					default: D(() => [...n[33] ||= [x("i", {
						class: "pi pi-stop",
						"aria-hidden": "true"
					}, null, -1)]]),
					_: 1
				}, 8, ["class", "title"]),
				e.canAnalyse ? (j(), L(y, { key: 1 }, [
					n[36] ||= x("span", { class: "mjr-studio-rail__sep" }, null, -1),
					w(a, {
						type: "button",
						class: R(["mjr-studio-rail__btn", { "is-on": i.value.probe }]),
						title: z(r)("viewer.studio.probe", "Pixel probe (P)"),
						onClick: n[6] ||= (e) => i.value.probe = !i.value.probe
					}, {
						default: D(() => [...n[34] ||= [x("i", {
							class: "pi pi-map-marker",
							"aria-hidden": "true"
						}, null, -1)]]),
						_: 1
					}, 8, ["class", "title"]),
					w(a, {
						type: "button",
						class: R(["mjr-studio-rail__btn", {
							"is-on": i.value.loupe,
							"is-open": s.value === "loupe"
						}]),
						title: z(r)("viewer.studio.loupe", "Loupe (L) - right-click for settings"),
						onClick: n[7] ||= (e) => i.value.loupe = !i.value.loupe,
						onContextmenu: n[8] ||= O((e) => h("loupe", e), ["prevent"])
					}, {
						default: D(() => [...n[35] ||= [x("i", {
							class: "pi pi-search-plus",
							"aria-hidden": "true"
						}, null, -1)]]),
						_: 1
					}, 8, ["class", "title"])
				], 64)) : T("", !0),
				e.canCompare ? (j(), L(y, { key: 2 }, [n[38] ||= x("span", { class: "mjr-studio-rail__sep" }, null, -1), w(a, {
					type: "button",
					class: R(["mjr-studio-rail__btn", {
						"is-on": i.value.compare !== "off",
						"is-open": s.value === "compare"
					}]),
					title: z(r)("viewer.studio.compareTool", "Compare A/B (C)"),
					onClick: n[9] ||= (e) => h("compare", e)
				}, {
					default: D(() => [...n[37] ||= [x("i", {
						class: "pi pi-clone",
						"aria-hidden": "true"
					}, null, -1)]]),
					_: 1
				}, 8, ["class", "title"])], 64)) : T("", !0),
				n[41] ||= x("span", { class: "mjr-studio-rail__sep" }, null, -1),
				e.canAnalyse ? (j(), b(a, {
					key: 3,
					type: "button",
					class: "mjr-studio-rail__btn",
					title: z(r)("viewer.studio.copy", "Copy image / frame to clipboard"),
					onClick: n[10] ||= (e) => o("copy")
				}, {
					default: D(() => [...n[39] ||= [x("i", {
						class: "pi pi-copy",
						"aria-hidden": "true"
					}, null, -1)]]),
					_: 1
				}, 8, ["title"])) : T("", !0),
				w(a, {
					type: "button",
					class: "mjr-studio-rail__btn",
					title: z(r)("viewer.studio.resetTools", "Reset all tools (R)"),
					onClick: _
				}, {
					default: D(() => [...n[40] ||= [x("i", {
						class: "pi pi-refresh",
						"aria-hidden": "true"
					}, null, -1)]]),
					_: 1
				}, 8, ["title"])
			], 8, kt), s.value ? (j(), L("div", {
				key: 0,
				class: "mjr-studio-rail__panel",
				style: F({ top: `${c.value}px` }),
				role: "dialog"
			}, [s.value === "channels" ? (j(), L(y, { key: 0 }, [x("div", jt, P(z(r)("viewer.studio.channels", "Channels")), 1), x("div", Mt, [(j(), L(y, null, C(u, (e) => w(a, {
				key: e.value,
				type: "button",
				class: R({ "is-on": i.value.channel === e.value }),
				onClick: (t) => i.value.channel = e.value
			}, {
				default: D(() => [I(P(e.label), 1)]),
				_: 2
			}, 1032, ["class", "onClick"])), 64))])], 64)) : s.value === "exposure" ? (j(), L(y, { key: 1 }, [
				x("div", Nt, P(z(r)("viewer.studio.exposure", "Exposure / gamma")), 1),
				w($, {
					modelValue: i.value.exposure,
					"onUpdate:modelValue": n[11] ||= (e) => i.value.exposure = e,
					label: z(r)("viewer.studio.ev", "Exposure"),
					min: -5,
					max: 5,
					step: .05,
					"default-value": 0,
					format: ne
				}, null, 8, ["modelValue", "label"]),
				w($, {
					modelValue: i.value.gamma,
					"onUpdate:modelValue": n[12] ||= (e) => i.value.gamma = e,
					label: z(r)("viewer.studio.gamma", "Gamma"),
					min: .1,
					max: 3,
					step: .01,
					"default-value": 1,
					format: E
				}, null, 8, ["modelValue", "label"]),
				w(a, {
					type: "button",
					class: "mjr-studio-btn is-text",
					onClick: g
				}, {
					default: D(() => [I(P(z(r)("viewer.studio.reset", "Reset")), 1)]),
					_: 1
				})
			], 64)) : s.value === "zebra" ? (j(), L(y, { key: 2 }, [
				x("div", Pt, P(z(r)("viewer.studio.zebra", "Zebra highlights (Z)")), 1),
				x("div", Ft, [w(a, {
					type: "button",
					class: R({ "is-on": !i.value.zebra }),
					onClick: n[13] ||= (e) => i.value.zebra = !1
				}, {
					default: D(() => [...n[42] ||= [I("Off", -1)]]),
					_: 1
				}, 8, ["class"]), w(a, {
					type: "button",
					class: R({ "is-on": i.value.zebra }),
					onClick: n[14] ||= (e) => i.value.zebra = !0
				}, {
					default: D(() => [...n[43] ||= [I("On", -1)]]),
					_: 1
				}, 8, ["class"])]),
				w($, {
					modelValue: i.value.zebraThreshold,
					"onUpdate:modelValue": n[15] ||= (e) => i.value.zebraThreshold = e,
					label: z(r)("viewer.studio.threshold", "Threshold"),
					min: .5,
					max: 1,
					step: .01,
					"default-value": .95,
					format: A
				}, null, 8, ["modelValue", "label"])
			], 64)) : s.value === "scopes" ? (j(), L(y, { key: 3 }, [x("div", It, P(z(r)("viewer.studio.scopes", "Scopes (S)")), 1), x("div", Lt, [(j(), L(y, null, C(d, (e) => w(a, {
				key: e.value,
				type: "button",
				class: R({ "is-on": i.value.scopes === e.value }),
				onClick: (t) => i.value.scopes = e.value
			}, {
				default: D(() => [I(P(e.label), 1)]),
				_: 2
			}, 1032, ["class", "onClick"])), 64))])], 64)) : s.value === "grid" ? (j(), L(y, { key: 4 }, [x("div", Rt, P(z(r)("viewer.studio.grid", "Guides (G)")), 1), x("div", zt, [(j(), L(y, null, C(f, (e) => w(a, {
				key: e.value,
				type: "button",
				class: R({ "is-on": i.value.grid === e.value }),
				onClick: (t) => i.value.grid = e.value
			}, {
				default: D(() => [I(P(e.label), 1)]),
				_: 2
			}, 1032, ["class", "onClick"])), 64))])], 64)) : s.value === "aspect" ? (j(), L(y, { key: 5 }, [
				x("div", Bt, P(z(r)("viewer.studio.aspect", "Aspect ratio mask")), 1),
				x("div", Vt, [(j(), L(y, null, C(p, (e) => w(a, {
					key: e.value,
					type: "button",
					class: R({ "is-on": i.value.aspect === e.value }),
					onClick: (t) => i.value.aspect = e.value
				}, {
					default: D(() => [I(P(e.label), 1)]),
					_: 2
				}, 1032, ["class", "onClick"])), 64))]),
				w($, {
					modelValue: i.value.maskOpacity,
					"onUpdate:modelValue": n[16] ||= (e) => i.value.maskOpacity = e,
					label: z(r)("viewer.studio.opacity", "Opacity"),
					min: 0,
					max: 1,
					step: .05,
					"default-value": .65,
					format: A
				}, null, 8, ["modelValue", "label"])
			], 64)) : s.value === "loupe" ? (j(), L(y, { key: 6 }, [
				x("div", Ht, P(z(r)("viewer.studio.loupeTitle", "Loupe")), 1),
				w($, {
					modelValue: i.value.loupeZoom,
					"onUpdate:modelValue": n[17] ||= (e) => i.value.loupeZoom = e,
					label: z(r)("viewer.studio.magnification", "Magnification"),
					min: 2,
					max: 32,
					step: 1,
					"default-value": 8,
					format: M
				}, null, 8, ["modelValue", "label"]),
				w($, {
					modelValue: i.value.loupeSize,
					"onUpdate:modelValue": n[18] ||= (e) => i.value.loupeSize = e,
					label: z(r)("viewer.studio.size", "Size"),
					min: 80,
					max: 320,
					step: 10,
					"default-value": 140,
					format: ae
				}, null, 8, ["modelValue", "label"])
			], 64)) : s.value === "compare" ? (j(), L(y, { key: 7 }, [
				x("div", Ut, P(z(r)("viewer.studio.compareTool", "Compare A/B (C)")), 1),
				x("div", Wt, [(j(!0), L(y, null, C(ee.value, (e) => (j(), b(a, {
					key: e.value,
					type: "button",
					class: R({ "is-on": i.value.compare === e.value }),
					onClick: (t) => te(e.value)
				}, {
					default: D(() => [I(P(e.label), 1)]),
					_: 2
				}, 1032, ["class", "onClick"]))), 128))]),
				x("div", Gt, [
					n[46] ||= x("span", { class: "mjr-studio-rail__b-label" }, "B", -1),
					w(a, {
						type: "button",
						class: "mjr-studio-btn",
						title: z(r)("viewer.studio.prevB", "Previous B"),
						onClick: n[19] ||= (e) => o("cycle-b", -1)
					}, {
						default: D(() => [...n[44] ||= [x("i", {
							class: "pi pi-chevron-left",
							"aria-hidden": "true"
						}, null, -1)]]),
						_: 1
					}, 8, ["title"]),
					x("span", {
						class: "mjr-studio-rail__b-name",
						title: e.compareName
					}, P(e.compareName || "—"), 9, Kt),
					w(a, {
						type: "button",
						class: "mjr-studio-btn",
						title: z(r)("viewer.studio.nextB", "Next B"),
						onClick: n[20] ||= (e) => o("cycle-b", 1)
					}, {
						default: D(() => [...n[45] ||= [x("i", {
							class: "pi pi-chevron-right",
							"aria-hidden": "true"
						}, null, -1)]]),
						_: 1
					}, 8, ["title"])
				]),
				x("div", qt, [w(a, {
					type: "button",
					title: z(r)("viewer.studio.pinB", "Use the current asset as B (B)"),
					onClick: n[21] ||= (e) => o("pin-b")
				}, {
					default: D(() => [n[47] ||= x("i", {
						class: "pi pi-bookmark",
						"aria-hidden": "true"
					}, null, -1), I(" " + P(z(r)("viewer.studio.pinBShort", "Set B")), 1)]),
					_: 1
				}, 8, ["title"]), w(a, {
					type: "button",
					title: z(r)("viewer.studio.swap", "Swap A and B (X)"),
					onClick: n[22] ||= (e) => o("swap")
				}, {
					default: D(() => [n[48] ||= x("i", {
						class: "pi pi-arrow-right-arrow-left",
						"aria-hidden": "true"
					}, null, -1), I(" " + P(z(r)("viewer.studio.swapShort", "Swap")), 1)]),
					_: 1
				}, 8, ["title"])]),
				i.value.compare === "wipe" || i.value.compare === "wipeV" ? (j(), b($, {
					key: 0,
					modelValue: i.value.wipe,
					"onUpdate:modelValue": n[23] ||= (e) => i.value.wipe = e,
					label: z(r)("viewer.studio.wipe", "Wipe"),
					min: 0,
					max: 100,
					step: 1,
					"default-value": 50,
					format: (e) => `${e}%`
				}, null, 8, [
					"modelValue",
					"label",
					"format"
				])) : T("", !0)
			], 64)) : T("", !0)], 4)) : T("", !0)], 544);
		};
	}
}), Yt = /* @__PURE__ */ E({
	__name: "StudioZebra",
	props: {
		getSource: { type: Function },
		threshold: {},
		tick: {}
	},
	setup(e) {
		let t = e, n = V(null), r = 0;
		function i() {
			let e = n.value, i = ke(t.getSource(), 480);
			if (!e || !i) return;
			e.width = i.width, e.height = i.height, r = (r + 1) % 8;
			let a = be(i.data, i.width, i.height, t.threshold, r);
			e.getContext("2d")?.putImageData(new ImageData(a, i.width, i.height), 0, 0);
		}
		return M(() => [t.tick, t.threshold], i), S(i), (e, t) => (j(), L("canvas", {
			ref_key: "canvas",
			ref: n,
			class: "mjr-studio-zebra",
			"aria-hidden": "true"
		}, null, 512));
	}
}), Xt = ["aria-label"], Zt = { class: "mjr-studio__header" }, Qt = { class: "mjr-studio__nav" }, $t = { class: "mjr-studio__counter" }, en = { class: "mjr-studio__title" }, tn = ["title"], nn = { class: "mjr-studio__summary" }, rn = { class: "mjr-studio__actions" }, an = ["title"], on = { class: "mjr-studio__body" }, sn = {
	key: 4,
	class: "mjr-studio__unsupported"
}, cn = { class: "mjr-studio__review" }, ln = { class: "mjr-studio__review-row" }, un = { class: "mjr-studio__label" }, dn = {
	class: "mjr-studio__tabs",
	role: "tablist"
}, fn = { class: "mjr-studio__tab-body" }, pn = ["aria-label"], mn = ["src"], hn = {
	key: 1,
	class: "pi pi-file",
	"aria-hidden": "true"
}, gn = {
	key: 2,
	class: "pi pi-play mjr-studio__thumb-badge",
	"aria-hidden": "true"
}, _n = /* @__PURE__ */ E({
	__name: "StudioViewer",
	setup(c) {
		let l = V(null), u = V(null), f = V(null), te = V(null), v = V(!0), S = V("generation"), E = V(!1), A = V(1), N = oe(null), ae = oe(null), F = null, B = k(() => Q.assets[Q.index] ?? null), H = k(() => N.value ?? B.value), U = k(() => K(B.value)), W = k(() => B.value ? n(B.value) : ""), G = k(() => Q.assets.length), fe = k(() => xe(H.value)), pe = k(() => ue(H.value, ae.value)), me = k(() => Number(ae.value?.frame_count) || null), he = k(() => Number(H.value?.rating) || 0), _e = k(() => Array.isArray(H.value?.tags) ? H.value.tags : []), be = k(() => {
			let { start: e, end: t } = ge(G.value, Q.index);
			return Q.assets.slice(e, t).map((t, n) => ({
				asset: t,
				index: e + n
			}));
		}), q = se(ve()), Ce = `mjr-studio-fx-${Math.random().toString(36).slice(2, 9)}`, we = V(null), Te = V(0), De = null, Oe = -1, J = k(() => U.value === "image" || U.value === "video"), Y = k(() => {
			if (!J.value) return null;
			let e = we.value, t = Q.assets, n = Q.index;
			return e != null && e !== n && t[e] && K(t[e]) === U.value ? e : de(t, n, 1, (e) => K(e) === U.value);
		}), X = k(() => Y.value != null), Z = k(() => Y.value == null ? null : Q.assets[Y.value]), ke = k(() => q.compare !== "off" && !!Z.value), Ae = k(() => ke.value && Z.value ? n(Z.value) : null), je = k(() => ke.value && q.compare === "subtract" && U.value === "image" ? Ae.value : null), Ne = k(() => J.value && (Ee(q) || je.value) ? `url(#${Ce})` : ""), Pe = k(() => J.value && (q.zebra || q.scopes !== "off"));
		function Re() {
			return U.value === "image" ? u.value?.getSource?.() ?? null : U.value === "video" ? f.value?.getSource?.() ?? null : null;
		}
		function ze() {
			return U.value === "image" ? u.value?.getBox?.() ?? null : U.value === "video" ? f.value?.getBox?.() ?? null : null;
		}
		function Be() {
			Te.value += 1;
		}
		function Ve() {
			De && clearInterval(De), De = null;
		}
		M([
			Pe,
			U,
			() => Q.open
		], ([e, t, n]) => {
			Ve(), e && n && t === "video" && (Oe = -1, De = setInterval(() => {
				let e = Re()?.currentTime ?? -1;
				e !== Oe && (Oe = e, Be());
			}, 120));
		}, { immediate: !0 }), M(Pe, (e) => {
			e && ne(Be);
		});
		function He(e) {
			let t = Y.value ?? Q.index, n = de(Q.assets, t, e, (e, t) => t !== Q.index && K(e) === U.value);
			n != null && (we.value = n);
		}
		function Ue() {
			we.value = Q.index;
			let e = de(Q.assets, Q.index, 1, (e) => K(e) === U.value);
			e != null && Ie(e), q.compare === "off" && (q.compare = "wipe");
		}
		function We() {
			let e = Y.value;
			e != null && (we.value = Q.index, Ie(e));
		}
		function Ge() {
			X.value && (q.compare = q.compare === "off" ? "wipe" : "off");
		}
		async function Ke() {
			let t = await Me(Re()), n = window.ClipboardItem;
			if (!t || !n || !navigator.clipboard?.write) e(r("viewer.studio.copyFailed", "Could not copy this image"), "error");
			else try {
				await navigator.clipboard.write([new n({ "image/png": t })]), e(r("viewer.studio.copied", "Copied to clipboard"), "success");
			} catch (t) {
				console.debug?.(t), e(r("viewer.studio.copyFailed", "Could not copy this image"), "error");
			}
		}
		let qe = [
			"off",
			"hist",
			"wave",
			"both"
		], Je = [
			"off",
			"thirds",
			"golden",
			"center",
			"safe"
		];
		function Ye(e, t) {
			return e[(e.indexOf(t) + 1) % e.length];
		}
		M(() => Q.session, () => {
			we.value = null, q.compare = Q.compare || "off", ne(() => {
				let e = document.activeElement;
				e && l.value?.contains(e) && rt(e) && e.blur(), l.value?.focus?.({ preventScroll: !0 });
			});
		}, { immediate: !0 });
		async function Ze(e) {
			if (F?.abort(), N.value = null, ae.value = null, !e) return;
			let t = typeof AbortController < "u" ? new AbortController() : null;
			F = t;
			try {
				let n = await Se(e, {
					getAssetMetadata: o,
					getFileMetadataScoped: s,
					signal: t?.signal
				});
				F === t && B.value === e && (N.value = n && typeof n == "object" ? n : e);
			} catch (e) {
				console.debug?.(e);
			}
			let n = K(e);
			if ((n === "video" || n === "audio") && e?.id != null) try {
				let n = await a(e.id, t ? { signal: t.signal } : {});
				F === t && n?.ok && (ae.value = n.data || null);
			} catch (e) {
				console.debug?.(e);
			}
		}
		M(B, (e) => void Ze(e), { immediate: !0 }), M(() => Q.open, async (e) => {
			e ? (await ne(), l.value?.focus?.(), window.addEventListener("keydown", it, !0)) : (window.removeEventListener("keydown", it, !0), Ve(), f.value?.release?.(), F?.abort(), document.fullscreenElement && l.value?.contains(document.fullscreenElement) && document.exitFullscreen?.());
		}, { immediate: !0 }), ie(() => {
			window.removeEventListener("keydown", it, !0), Ve(), F?.abort();
		});
		function Qe() {
			let e = B.value;
			Fe(), e?.id != null && window.dispatchEvent(new CustomEvent(d, { detail: { assetId: String(e.id) } }));
		}
		function $e() {
			document.fullscreenElement ? document.exitFullscreen?.() : l.value?.requestFullscreen?.();
		}
		function et() {
			if (!W.value) return;
			let e = document.createElement("a");
			e.href = W.value, e.download = String(B.value?.filename || ""), e.click();
		}
		async function tt(n) {
			let i = B.value;
			if (!i) return;
			let a = Math.max(0, Math.min(5, n)), o = await t(i, a);
			o?.ok ? (i.rating = a, N.value = N.value ? {
				...N.value,
				rating: a
			} : i, window.dispatchEvent(new CustomEvent(p, { detail: {
				assetId: i.id == null ? "" : String(i.id),
				rating: a
			} }))) : e(o?.error || r("toast.ratingUpdateFailed", "Rating update failed"), "error");
		}
		function rt(e) {
			return !!e?.closest?.("input, textarea, select, [contenteditable='true']");
		}
		function it(e) {
			if (!Q.open) return;
			if (rt(e.target)) {
				e.key === "Escape" && e.target?.blur?.();
				return;
			}
			let t = U.value === "video" || U.value === "audio", n = e.key, r = n.length === 1 ? n.toLowerCase() : n, i = !e.ctrlKey && !e.metaKey && !e.altKey, a = J.value && i, o = !0;
			n === "Escape" && te.value?.closePanel?.() || (n === "Escape" ? Qe() : r === "c" && (e.ctrlKey || e.metaKey) && J.value ? Ke() : n === "ArrowLeft" && !e.shiftKey ? Le(-1) : n === "ArrowRight" && !e.shiftKey ? Le(1) : n === "ArrowLeft" && e.shiftKey && t ? f.value?.seekBy?.(-5) : n === "ArrowRight" && e.shiftKey && t ? f.value?.seekBy?.(5) : n === "Home" ? Ie(0) : n === "End" ? Ie(G.value - 1) : n === " " && t ? f.value?.togglePlay?.() : n === "," && t ? f.value?.stepFrame?.(-1) : n === "." && t ? f.value?.stepFrame?.(1) : (n === "i" || n === "I") && t ? f.value?.setLoopA?.() : (n === "o" || n === "O") && t ? f.value?.setLoopB?.() : (n === "u" || n === "U") && t ? f.value?.clearLoop?.() : (n === "m" || n === "M") && t ? f.value?.toggleMute?.() : n === "]" && t ? f.value?.cycleRate?.(1) : n === "[" && t ? f.value?.cycleRate?.(-1) : n === "Tab" ? v.value = !v.value : n === "f" || n === "F" ? $e() : (n === "+" || n === "=") && U.value === "image" ? u.value?.zoomBy?.(1.25) : n === "-" && U.value === "image" ? u.value?.zoomBy?.(.8) : n === "0" && U.value === "image" && e.altKey ? u.value?.fit?.() : /^[0-5]$/.test(n) && !e.ctrlKey && !e.metaKey && !e.altKey ? tt(Number(n)) : r === "c" && i && X.value ? Ge() : r === "b" && i && X.value ? Ue() : r === "x" && i && ke.value ? We() : r === "z" && a ? q.zebra = !q.zebra : r === "s" && a ? q.scopes = Ye(qe, q.scopes) : r === "g" && i && J.value ? q.grid = Ye(Je, q.grid) : r === "p" && a ? q.probe = !q.probe : r === "l" && a ? q.loupe = !q.loupe : r === "r" && a ? Object.assign(q, ve(), {
				loupeSize: q.loupeSize,
				loupeZoom: q.loupeZoom
			}) : o = !1), o && (e.preventDefault(), e.stopPropagation(), e.stopImmediatePropagation?.());
		}
		function at(e) {
			return i(e, 192) || "";
		}
		return (e, t) => {
			let n = re("MButton");
			return j(), b(le, { to: "body" }, [z(Q).open ? (j(), L("div", {
				key: 0,
				ref_key: "overlay",
				ref: l,
				class: R(["mjr-assets-manager mjr-studio", { "is-inspector-closed": !v.value }]),
				role: "dialog",
				"aria-modal": "true",
				"aria-label": z(r)("viewer.studio.title", "Viewer"),
				tabindex: "-1"
			}, [
				x("header", Zt, [
					x("div", Qt, [
						w(n, {
							type: "button",
							class: "mjr-studio-btn",
							title: z(r)("viewer.studio.prev", "Previous (←)"),
							disabled: G.value < 2,
							onClick: t[0] ||= (e) => z(Le)(-1)
						}, {
							default: D(() => [...t[14] ||= [x("i", {
								class: "pi pi-chevron-left",
								"aria-hidden": "true"
							}, null, -1)]]),
							_: 1
						}, 8, ["title", "disabled"]),
						x("span", $t, P(z(Q).index + 1) + " / " + P(G.value), 1),
						w(n, {
							type: "button",
							class: "mjr-studio-btn",
							title: z(r)("viewer.studio.next", "Next (→)"),
							disabled: G.value < 2,
							onClick: t[1] ||= (e) => z(Le)(1)
						}, {
							default: D(() => [...t[15] ||= [x("i", {
								class: "pi pi-chevron-right",
								"aria-hidden": "true"
							}, null, -1)]]),
							_: 1
						}, 8, ["title", "disabled"])
					]),
					x("div", en, [x("span", {
						class: "mjr-studio__filename",
						title: H.value?.filepath || H.value?.filename
					}, P(H.value?.filename), 9, tn), x("span", nn, P(fe.value), 1)]),
					x("div", rn, [
						U.value === "image" ? (j(), L(y, { key: 0 }, [
							x("span", {
								class: "mjr-studio-chip",
								title: z(r)("viewer.studio.zoomHint", "Wheel to zoom, double-click for fit / 100 %")
							}, P(Math.round(A.value * 100)) + "%", 9, an),
							w(n, {
								type: "button",
								class: "mjr-studio-btn",
								title: z(r)("viewer.studio.fit", "Fit"),
								onClick: t[2] ||= (e) => u.value?.fit()
							}, {
								default: D(() => [...t[16] ||= [x("i", {
									class: "pi pi-arrows-alt",
									"aria-hidden": "true"
								}, null, -1)]]),
								_: 1
							}, 8, ["title"]),
							w(n, {
								type: "button",
								class: "mjr-studio-btn is-text",
								title: z(r)("viewer.studio.actualSize", "Actual size"),
								onClick: t[3] ||= (e) => u.value?.actualSize()
							}, {
								default: D(() => [...t[17] ||= [I("1:1", -1)]]),
								_: 1
							}, 8, ["title"]),
							w(n, {
								type: "button",
								class: R(["mjr-studio-btn", { "is-on": E.value }]),
								title: z(r)("viewer.studio.checker", "Transparency checkerboard"),
								onClick: t[4] ||= (e) => E.value = !E.value
							}, {
								default: D(() => [...t[18] ||= [x("i", {
									class: "pi pi-th-large",
									"aria-hidden": "true"
								}, null, -1)]]),
								_: 1
							}, 8, ["class", "title"])
						], 64)) : T("", !0),
						X.value ? (j(), b(n, {
							key: 1,
							type: "button",
							class: R(["mjr-studio-btn", { "is-on": ke.value }]),
							title: z(r)("viewer.studio.compare", "Compare A/B (C)"),
							onClick: Ge
						}, {
							default: D(() => [...t[19] ||= [x("i", {
								class: "pi pi-clone",
								"aria-hidden": "true"
							}, null, -1)]]),
							_: 1
						}, 8, ["class", "title"])) : T("", !0),
						w(n, {
							type: "button",
							class: "mjr-studio-btn",
							title: z(r)("viewer.studio.download", "Download"),
							onClick: et
						}, {
							default: D(() => [...t[20] ||= [x("i", {
								class: "pi pi-download",
								"aria-hidden": "true"
							}, null, -1)]]),
							_: 1
						}, 8, ["title"]),
						w(n, {
							type: "button",
							class: R(["mjr-studio-btn", { "is-on": v.value }]),
							title: z(r)("viewer.studio.inspector", "Generation info (Tab)"),
							onClick: t[5] ||= (e) => v.value = !v.value
						}, {
							default: D(() => [...t[21] ||= [x("i", {
								class: "pi pi-info-circle",
								"aria-hidden": "true"
							}, null, -1)]]),
							_: 1
						}, 8, ["class", "title"]),
						w(n, {
							type: "button",
							class: "mjr-studio-btn",
							title: z(r)("viewer.studio.fullscreen", "Fullscreen (F)"),
							onClick: $e
						}, {
							default: D(() => [...t[22] ||= [x("i", {
								class: "pi pi-window-maximize",
								"aria-hidden": "true"
							}, null, -1)]]),
							_: 1
						}, 8, ["title"]),
						w(n, {
							type: "button",
							class: "mjr-studio-btn is-close",
							title: z(r)("viewer.studio.close", "Close (Esc)"),
							onClick: Qe
						}, {
							default: D(() => [...t[23] ||= [x("i", {
								class: "pi pi-times",
								"aria-hidden": "true"
							}, null, -1)]]),
							_: 1
						}, 8, ["title"])
					])
				]),
				x("main", on, [x("section", { class: R(["mjr-studio__stage", { "has-rail": J.value }]) }, [
					Ne.value ? (j(), b(Xe, {
						key: 0,
						"filter-id": Ce,
						channel: z(q).channel,
						exposure: z(q).exposure,
						gamma: z(q).gamma,
						"subtract-src": je.value
					}, null, 8, [
						"channel",
						"exposure",
						"gamma",
						"subtract-src"
					])) : T("", !0),
					U.value === "image" ? (j(), b(ft, {
						ref_key: "imageStage",
						ref: u,
						key: `img:${W.value}`,
						wipe: z(q).wipe,
						"onUpdate:wipe": t[6] ||= (e) => z(q).wipe = e,
						src: W.value,
						alt: B.value?.filename,
						checker: E.value,
						"media-filter": Ne.value,
						"compare-src": Ae.value,
						compare: z(q).compare,
						class: R({ "is-probing": z(q).probe || z(q).loupe }),
						onZoom: t[7] ||= (e) => A.value = e,
						onLoaded: Be,
						onDismiss: Qe
					}, {
						overlay: D(({ width: e, height: t }) => [z(q).zebra ? (j(), b(Yt, {
							key: 0,
							"get-source": Re,
							threshold: z(q).zebraThreshold,
							tick: Te.value
						}, null, 8, ["threshold", "tick"])) : T("", !0), w(nt, {
							width: e,
							height: t,
							grid: z(q).grid,
							aspect: z(q).aspect,
							"mask-opacity": z(q).maskOpacity
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
					])) : U.value === "video" || U.value === "audio" ? (j(), b(ye, {
						ref_key: "player",
						ref: f,
						key: `media:${W.value}`,
						wipe: z(q).wipe,
						"onUpdate:wipe": t[8] ||= (e) => z(q).wipe = e,
						src: W.value,
						kind: U.value,
						fps: pe.value,
						"frame-count": me.value,
						filename: B.value?.filename,
						"media-filter": Ne.value,
						"compare-src": Ae.value,
						compare: z(q).compare,
						class: R({ "is-probing": z(q).probe || z(q).loupe }),
						"light-dismiss": "",
						onDismiss: Qe
					}, {
						overlay: D(({ width: e, height: t }) => [z(q).zebra ? (j(), b(Yt, {
							key: 0,
							"get-source": Re,
							threshold: z(q).zebraThreshold,
							tick: Te.value
						}, null, 8, ["threshold", "tick"])) : T("", !0), w(nt, {
							width: e,
							height: t,
							grid: z(q).grid,
							aspect: z(q).aspect,
							"mask-opacity": z(q).maskOpacity
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
					])) : U.value === "model3d" ? (j(), b(pt, {
						key: `3d:${W.value}`,
						asset: B.value,
						src: W.value
					}, null, 8, ["asset", "src"])) : (j(), L("div", sn, [t[24] ||= x("i", {
						class: "pi pi-file",
						"aria-hidden": "true"
					}, null, -1), x("span", null, P(z(r)("viewer.studio.unsupported", "No preview for this file type.")), 1)])),
					J.value ? (j(), b(Jt, {
						key: 5,
						ref_key: "toolRail",
						ref: te,
						tools: z(q),
						"onUpdate:tools": t[9] ||= (e) => ce(q) ? q.value = e : q = e,
						"is-video": U.value === "video",
						"can-analyse": J.value,
						"can-compare": X.value,
						"compare-name": Z.value?.filename,
						onCycleB: He,
						onPinB: Ue,
						onSwap: We,
						onCopy: Ke
					}, null, 8, [
						"tools",
						"is-video",
						"can-analyse",
						"can-compare",
						"compare-name"
					])) : T("", !0),
					J.value && z(q).scopes !== "off" ? (j(), b(wt, {
						key: 6,
						"get-source": Re,
						mode: z(q).scopes,
						tick: Te.value
					}, null, 8, ["mode", "tick"])) : T("", !0),
					J.value && (z(q).probe || z(q).loupe) ? (j(), b(vt, {
						key: 7,
						"get-source": Re,
						"get-box": ze,
						probe: z(q).probe,
						loupe: z(q).loupe,
						"loupe-size": z(q).loupeSize,
						"loupe-zoom": z(q).loupeZoom,
						"media-filter": je.value ? "" : Ne.value
					}, null, 8, [
						"probe",
						"loupe",
						"loupe-size",
						"loupe-zoom",
						"media-filter"
					])) : T("", !0)
				], 2), v.value && H.value ? (j(), L("aside", {
					key: 0,
					class: "mjr-studio__inspector",
					onKeydown: t[13] ||= O(() => {}, ["stop"])
				}, [
					x("div", cn, [x("div", ln, [x("span", un, P(z(r)("sidebar.rating", "Rating")), 1), (j(), b(h, {
						key: `r:${H.value.id}`,
						asset: H.value,
						"model-value": he.value,
						size: 40
					}, null, 8, ["asset", "model-value"]))]), (j(), b(_, {
						key: `t:${H.value.id}`,
						asset: H.value,
						"model-value": _e.value,
						autofocus: !1
					}, null, 8, ["asset", "model-value"]))]),
					x("nav", dn, [
						w(n, {
							type: "button",
							role: "tab",
							class: R({ "is-active": S.value === "generation" }),
							onClick: t[10] ||= (e) => S.value = "generation"
						}, {
							default: D(() => [I(P(z(r)("viewer.studio.tabGeneration", "Generation")), 1)]),
							_: 1
						}, 8, ["class"]),
						w(n, {
							type: "button",
							role: "tab",
							class: R({ "is-active": S.value === "workflow" }),
							onClick: t[11] ||= (e) => S.value = "workflow"
						}, {
							default: D(() => [I(P(z(r)("viewer.studio.tabWorkflow", "Workflow")), 1)]),
							_: 1
						}, 8, ["class"]),
						w(n, {
							type: "button",
							role: "tab",
							class: R({ "is-active": S.value === "file" }),
							onClick: t[12] ||= (e) => S.value = "file"
						}, {
							default: D(() => [I(P(z(r)("viewer.studio.tabFile", "File")), 1)]),
							_: 1
						}, 8, ["class"])
					]),
					x("div", fn, [S.value === "generation" ? (j(), b(m, {
						key: `g:${H.value.id}`,
						asset: H.value
					}, null, 8, ["asset"])) : S.value === "workflow" ? (j(), b(g, {
						key: `w:${H.value.id}`,
						asset: H.value
					}, null, 8, ["asset"])) : (j(), b(ee, {
						key: `f:${H.value.id}`,
						asset: H.value
					}, null, 8, ["asset"]))])
				], 32)) : T("", !0)]),
				G.value > 1 ? (j(), L("footer", {
					key: 0,
					class: "mjr-studio__filmstrip",
					role: "listbox",
					"aria-label": z(r)("viewer.studio.filmstrip", "Filmstrip")
				}, [(j(!0), L(y, null, C(be.value, (e) => (j(), b(n, {
					key: `${e.index}:${e.asset?.id ?? e.asset?.filename}`,
					type: "button",
					role: "option",
					class: R(["mjr-studio__thumb", { "is-current": e.index === z(Q).index }]),
					"aria-selected": e.index === z(Q).index,
					title: e.asset?.filename,
					onClick: (t) => z(Ie)(e.index)
				}, {
					default: D(() => [at(e.asset) ? (j(), L("img", {
						key: 0,
						src: at(e.asset),
						alt: "",
						loading: "lazy",
						draggable: "false"
					}, null, 8, mn)) : (j(), L("i", hn)), z(K)(e.asset) === "video" ? (j(), L("i", gn)) : T("", !0)]),
					_: 2
				}, 1032, [
					"class",
					"aria-selected",
					"title",
					"onClick"
				]))), 128))], 8, pn)) : T("", !0)
			], 10, Xt)) : T("", !0)]);
		};
	}
}), vn = /* @__PURE__ */ E({
	__name: "ViewerPortal",
	setup(e) {
		function t(e) {
			let t = e?.detail || {}, n = Array.isArray(t?.assets) ? t.assets.filter(Boolean) : t?.asset ? [t.asset] : [];
			n.length && Pe(n, Math.max(0, Math.min(Number(t?.index) || 0, n.length - 1)), String(t?.mode || "").trim().toLowerCase()) && (t.handled = !0);
		}
		return S(() => {
			try {
				u();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				window.addEventListener(f.OPEN_VIEWER, t);
			} catch (e) {
				console.debug?.(e);
			}
		}), A(() => {
			try {
				window.removeEventListener(f.OPEN_VIEWER, t);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				l();
			} catch (e) {
				console.debug?.(e);
			}
		}), (e, t) => (j(), L(y, null, [w(_n), w(De)], 64));
	}
});
export { vn as default };
