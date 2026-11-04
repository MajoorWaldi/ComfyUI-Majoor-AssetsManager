import { m as e } from "./events-CttACGx4.js";
import { g as t, h as n } from "./viewerOpenRequest-CZXk8yvU.js";
import { $ as r, B as i, C as a, D as o, E as s, H as c, J as ee, M as l, O as u, P as te, Q as d, S as f, T as p, V as ne, W as m, X as re, b as ie, gt as h, ht as g, j as _, k as v, mt as y, pt as b, q as ae, st as x } from "./mjr-primevue-C07IsEdU.js";
// ui/features/viewer/studio/studioFx.ts
function S() {
	return {
		channel: "rgb",
		exposure: 0,
		gamma: 1,
		zebra: !1,
		zebraThreshold: .95,
		scopes: "off",
		grid: "off",
		aspect: "off",
		maskOpacity: .65,
		probe: !1,
		loupe: !1,
		loupeSize: 140,
		loupeZoom: 8,
		compare: "off",
		wipe: 50
	};
}
var C = .2126, w = .7152, oe = .0722;
function se(e) {
	let t = (e, t, n, r = 0) => [
		e,
		t,
		n,
		r,
		0,
		e,
		t,
		n,
		r,
		0,
		e,
		t,
		n,
		r,
		0
	].join(" ");
	switch (e) {
		case "r": return `${t(1, 0, 0)} 0 0 0 1 0`;
		case "g": return `${t(0, 1, 0)} 0 0 0 1 0`;
		case "b": return `${t(0, 0, 1)} 0 0 0 1 0`;
		case "l": return `${t(C, w, oe)} 0 0 0 1 0`;
		case "a": return `${t(0, 0, 0, 1)} 0 0 0 0 1`;
		default: return null;
	}
}
function T(e) {
	return 2 ** (Number.isFinite(e) ? Math.max(-10, Math.min(10, e)) : 0);
}
function E(e) {
	return 1 / (Number.isFinite(e) && e > 0 ? e : 1);
}
function D(e) {
	return e.channel !== "rgb" || Math.abs(e.exposure) > .001 || Math.abs(e.gamma - 1) > .001;
}
function O(e) {
	switch (e) {
		case "16:9": return 16 / 9;
		case "1:1": return 1;
		case "4:3": return 4 / 3;
		case "2.39": return 2.39;
		case "9:16": return 9 / 16;
		default: return null;
	}
}
function ce(e, t, n) {
	let r = O(n);
	if (!r || e <= 0 || t <= 0) return null;
	let i = e, a = e / r;
	return a > t && (a = t, i = t * r), {
		x: (e - i) / 2,
		y: (t - a) / 2,
		w: i,
		h: a
	};
}
function le(e, t, n) {
	let r = [], i = [];
	if (e <= 0 || t <= 0 || n === "off") return {
		lines: r,
		rects: i
	};
	let a = (n) => r.push({
		x1: e * n,
		y1: 0,
		x2: e * n,
		y2: t
	}), o = (n) => r.push({
		x1: 0,
		y1: t * n,
		x2: e,
		y2: t * n
	});
	if (n === "thirds") a(1 / 3), a(2 / 3), o(1 / 3), o(2 / 3);
	else if (n === "golden") {
		let e = .381966;
		a(e), a(.618034), o(e), o(.618034);
	} else if (n === "center") a(.5), o(.5);
	else if (n === "safe") {
		for (let n of [.9, .8]) i.push({
			x: e * (1 - n) / 2,
			y: t * (1 - n) / 2,
			w: e * n,
			h: t * n
		});
		a(.5), o(.5);
	}
	return {
		lines: r,
		rects: i
	};
}
function k(e, t, n) {
	return C * e + w * t + oe * n;
}
function A(e) {
	let t = /* @__PURE__ */ new Uint32Array(256), n = /* @__PURE__ */ new Uint32Array(256), r = /* @__PURE__ */ new Uint32Array(256), i = /* @__PURE__ */ new Uint32Array(256);
	for (let a = 0; a + 3 < e.length; a += 4) e[a + 3] !== 0 && (t[e[a]] += 1, n[e[a + 1]] += 1, r[e[a + 2]] += 1, i[Math.round(k(e[a], e[a + 1], e[a + 2]))] += 1);
	let a = 1;
	for (let e = 1; e < 255; e++) a = Math.max(a, t[e], n[e], r[e], i[e]);
	return {
		r: t,
		g: n,
		b: r,
		l: i,
		max: a
	};
}
function j(e, t, n, r = 256) {
	let i = Math.max(1, Math.min(r, t)), a = new Uint32Array(i * 256), o = 1;
	for (let r = 0; r < n; r++) for (let n = 0; n < t; n++) {
		let s = (r * t + n) * 4;
		if (e[s + 3] === 0) continue;
		let c = Math.min(i - 1, Math.floor(n * i / t)), ee = Math.round(k(e[s], e[s + 1], e[s + 2])), l = c * 256 + ee;
		a[l] += 1, a[l] > o && (o = a[l]);
	}
	return {
		columns: i,
		bins: a,
		max: o
	};
}
function ue(e, t, n, r, i = 0) {
	let a = new Uint8ClampedArray(/* @__PURE__ */ new ArrayBuffer(t * n * 4)), o = Math.max(0, Math.min(1, r)) * 255;
	for (let r = 0; r < n; r++) for (let n = 0; n < t; n++) {
		let s = (r * t + n) * 4;
		if (k(e[s], e[s + 1], e[s + 2]) < o) continue;
		let c = Math.floor((n + r + i) / 4) % 2 == 0;
		a[s] = c ? 255 : 20, a[s + 1] = c ? 40 : 20, a[s + 2] = c ? 40 : 20, a[s + 3] = 200;
	}
	return a;
}
function de(e, t, n = 256) {
	if (e <= 0 || t <= 0) return {
		w: 0,
		h: 0
	};
	let r = Math.min(1, n / Math.max(e, t));
	return {
		w: Math.max(1, Math.round(e * r)),
		h: Math.max(1, Math.round(t * r))
	};
}
function fe(e, t, n, r) {
	return {
		hex: `#${[
			e,
			t,
			n
		].map((e) => Math.round(e).toString(16).padStart(2, "0")).join("")}`.toUpperCase(),
		rgb: `${e}, ${t}, ${n}${r < 255 ? ` · α ${r}` : ""}`,
		luma: `${Math.round(k(e, t, n) / 255 * 100)}%`
	};
}
function pe(e) {
	switch (e) {
		case "difference": return "difference";
		case "add": return "plus-lighter";
		case "multiply": return "multiply";
		case "screen": return "screen";
		default: return null;
	}
}
var M = [
	{
		value: "wipe",
		label: "Wipe ↔"
	},
	{
		value: "wipeV",
		label: "Wipe ↕"
	},
	{
		value: "side",
		label: "Side by side"
	},
	{
		value: "difference",
		label: "Difference"
	},
	{
		value: "add",
		label: "Add"
	},
	{
		value: "subtract",
		label: "Subtract",
		imageOnly: !0
	},
	{
		value: "multiply",
		label: "Multiply"
	},
	{
		value: "screen",
		label: "Screen"
	}
];
function N(e, t, n, r = () => !0) {
	let i = e.length;
	if (i < 2) return null;
	let a = n < 0 ? -1 : 1;
	for (let n = 1; n < i; n++) {
		let o = ((t + a * n) % i + i) % i;
		if (o !== t && r(e[o], o)) return o;
	}
	return null;
}
// ui/features/viewer/studio/studioMedia.ts
var P = /* @__PURE__ */ new Set([
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
]), F = /* @__PURE__ */ new Set([
	"mp4",
	"webm",
	"mov",
	"mkv",
	"avi",
	"m4v"
]), I = /* @__PURE__ */ new Set([
	"mp3",
	"wav",
	"flac",
	"ogg",
	"opus",
	"m4a",
	"aac",
	"aiff"
]), L = /* @__PURE__ */ new Set([
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
function R(e) {
	let t = String(e?.filename || e?.name || e?.filepath || "").trim(), n = t.lastIndexOf(".");
	return n >= 0 ? t.slice(n + 1).toLowerCase() : "";
}
function z(e) {
	let t = String(e?.kind || "").trim().toLowerCase();
	if (t === "image" || t === "video" || t === "audio" || t === "model3d") return t;
	let n = R(e);
	return P.has(n) ? "image" : F.has(n) ? "video" : I.has(n) ? "audio" : L.has(n) ? "model3d" : "other";
}
function me(e, { withCentis: t = !0 } = {}) {
	let n = Math.floor((Number.isFinite(e) && e > 0 ? e : 0) * 100 + 1e-6), r = n % 100, i = Math.floor(n / 100), a = i % 60, o = Math.floor(i / 60) % 60, s = Math.floor(i / 3600), c = s > 0 ? String(o).padStart(2, "0") : String(o), ee = `${s > 0 ? `${s}:` : ""}${c}:${String(a).padStart(2, "0")}`;
	return t ? `${ee}.${String(r).padStart(2, "0")}` : ee;
}
function he(e, t) {
	return !t || !Number.isFinite(t) || t <= 0 ? 0 : Math.max(0, Math.floor(Math.max(0, e) * t + 1e-6));
}
function B(e, t) {
	return !t || !Number.isFinite(t) || t <= 0 ? 0 : Math.max(0, (Math.max(0, Math.floor(e)) + .25) / t);
}
function ge(e, t, n, r) {
	let i = t && Number.isFinite(t) && t > 0 ? t : 24, a = B(he(e, i) + n, i);
	return Math.min(Math.max(0, a), Math.max(0, (Number.isFinite(r) && r > 0 ? r : a) - .5 / i));
}
function _e(e, t, n) {
	let r = Number(n);
	return Number.isFinite(r) && r > 0 ? Math.floor(r) : !t || !Number.isFinite(e) || e <= 0 ? null : Math.max(1, Math.round(e * t));
}
function ve(e, t) {
	if (e.a == null || e.b == null) return null;
	let n = Number.isFinite(t) && t > 0 ? t : Math.max(e.a, e.b), r = Math.min(Math.max(0, Math.min(e.a, e.b)), n), i = Math.min(Math.max(0, Math.max(e.a, e.b)), n);
	return i - r >= .02 ? {
		a: r,
		b: i
	} : null;
}
function ye(e, t, n) {
	let r = ve(t, n);
	return r && (e >= r.b || e < r.a - .05) ? r.a : null;
}
var be = [
	.25,
	.5,
	1,
	1.5,
	2
];
function V(e, r) {
	return t(e) ?? n(r?.fps_raw ?? r?.fps ?? r?.frame_rate) ?? n(e?.fps);
}
function H(e) {
	let t = [], n = Number(e?.width), r = Number(e?.height);
	n > 0 && r > 0 && t.push(`${n}×${r}`);
	let i = R(e);
	i && t.push(i.toUpperCase());
	let a = Number(e?.duration);
	a > 0 && t.push(me(a, { withCentis: !1 }));
	let o = Number(e?.size);
	return o > 0 && t.push(U(o)), t.join(" · ");
}
function U(e) {
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
function W(e, t, n = 40) {
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
// ui/vue/components/viewer/studio/StudioPlayer.vue?vue&type=script&setup=true&lang.ts
var xe = ["src"], Se = ["src"], Ce = {
	key: 0,
	class: "mjr-studio-stage__ab"
}, we = { class: "is-sep" }, Te = {
	class: "pi pi-volume-up",
	"aria-hidden": "true"
}, Ee = ["src"], De = {
	key: 3,
	class: "mjr-studio-player__error"
}, Oe = [
	"aria-label",
	"aria-valuemax",
	"aria-valuenow"
], ke = { class: "mjr-studio-player__row" }, Ae = { class: "mjr-studio-player__time" }, je = { class: "is-dim" }, Me = ["title"], Ne = ["title"], Pe = { class: "mjr-studio-player__group" }, Fe = ["aria-label", "aria-valuenow"], G = /* @__PURE__ */ te({
	__name: "StudioPlayer",
	props: {
		src: {},
		kind: {},
		fps: {},
		frameCount: {},
		filename: {},
		initialMuted: { type: Boolean },
		initialRate: {},
		compact: { type: Boolean },
		mediaFilter: {},
		compareSrc: {},
		compare: {},
		wipe: {}
	},
	emits: ["ended", "update:wipe"],
	setup(t, { expose: n, emit: te }) {
		let S = t, C = te, w = x(null), oe = x(null), se = x(null), T = x(null), E = x(null), D = x({
			x: 0,
			y: 0,
			w: 0,
			h: 0
		}), O = x(!1), ce = null, le = x(null), k = x(!1), A = null, j = null, ue = 0;
		async function de() {
			if (S.kind !== "audio" || j || A) return;
			let e = X(), t = window.AudioContext || window.webkitAudioContext;
			if (e && t) try {
				if (A = new t(), await A.resume?.(), A.state !== "running") {
					A.close?.(), A = null;
					return;
				}
				let n = A.createMediaElementSource(e);
				j = A.createAnalyser(), j.fftSize = 256, j.smoothingTimeConstant = .78, n.connect(j), j.connect(A.destination), k.value = !0, fe();
			} catch (e) {
				console.debug?.(e);
			}
		}
		function fe() {
			cancelAnimationFrame(ue);
			let e = le.value, t = e?.getContext("2d");
			if (!e || !t || !j) return;
			let n = e.width = e.clientWidth || 480, r = e.height = e.clientHeight || 160, i = new Uint8Array(j.frequencyBinCount);
			j.getByteFrequencyData(i), t.clearRect(0, 0, n, r);
			let a = Math.min(64, i.length), o = Math.max(2, (n - 3 * (a - 1)) / a);
			t.fillStyle = getComputedStyle(e).getPropertyValue("--mjr-accent").trim() || "#4fa3ff";
			for (let e = 0; e < a; e++) {
				let n = i[Math.min(i.length - 1, Math.floor((e / a) ** 1.6 * i.length))] / 255, s = Math.max(2, n * r);
				t.globalAlpha = .35 + n * .65, t.fillRect(e * (o + 3), r - s, o, s);
			}
			t.globalAlpha = 1, M.value && (ue = requestAnimationFrame(fe));
		}
		let M = x(!1), N = x(0), P = x(0), F = x(0), I = x(1), L = x(!!S.initialMuted), R = x(Number(S.initialRate) > 0 ? Number(S.initialRate) : 1), z = x(!0), B = x(null), V = x(null), H = x(null), U = x(!1), W = x(!0), G = x(""), K = null, q = 0, J = p(() => S.fps && S.fps > 0 ? S.fps : null), Ie = p(() => he(N.value, J.value)), Le = p(() => _e(P.value, J.value, S.frameCount)), Re = p(() => P.value > 0 ? N.value / P.value * 100 : 0), ze = p(() => P.value > 0 ? F.value / P.value * 100 : 0), Y = p(() => ve({
			a: B.value,
			b: V.value
		}, P.value)), Be = p(() => {
			if (!Y.value || P.value <= 0) return null;
			let e = Y.value.a / P.value * 100, t = (Y.value.b - Y.value.a) / P.value * 100;
			return {
				left: `${e}%`,
				width: `${t}%`
			};
		}), Ve = p(() => H.value == null || P.value <= 0 ? null : H.value / 100 * P.value);
		function X() {
			return w.value;
		}
		let Z = p(() => S.kind === "video" && !!S.compareSrc && !!S.compare && S.compare !== "off"), He = p(() => Z.value && S.compare === "side"), Ue = p(() => Z.value && (S.compare === "wipe" || S.compare === "wipeV")), We = p(() => Math.max(0, Math.min(100, Number(S.wipe ?? 50)))), Ge = p(() => {
			let e = Z.value ? pe(S.compare || "off") : null;
			if (e) return { mixBlendMode: e };
			if (Ue.value) {
				let e = D.value;
				return S.compare === "wipeV" ? { clipPath: `inset(${e.y + e.h * We.value / 100}px 0 0 0)` } : { clipPath: `inset(0 0 0 ${e.x + e.w * We.value / 100}px)` };
			}
			return {};
		}), Ke = p(() => ({
			left: `${D.value.x}px`,
			top: `${D.value.y}px`,
			width: `${D.value.w}px`,
			height: `${D.value.h}px`
		}));
		function qe() {
			let e = w.value;
			if (!(e instanceof HTMLVideoElement) || !T.value) return;
			let t = e.clientWidth, n = e.clientHeight, r = e.videoWidth, i = e.videoHeight;
			if (!t || !n || !r || !i) {
				D.value = {
					x: e.offsetLeft,
					y: e.offsetTop,
					w: t,
					h: n
				};
				return;
			}
			let a = Math.min(t / r, n / i), o = r * a, s = i * a;
			D.value = {
				x: e.offsetLeft + (t - o) / 2,
				y: e.offsetTop + (n - s) / 2,
				w: o,
				h: s
			};
		}
		function Q(e = !1) {
			let t = X(), n = E.value;
			if (!t || !n || !Z.value) return;
			n.muted = !0, n.playbackRate !== t.playbackRate && (n.playbackRate = t.playbackRate);
			let r = Math.min(t.currentTime || 0, Number.isFinite(n.duration) ? n.duration : Infinity);
			if (e || Math.abs((n.currentTime || 0) - r) > .08) try {
				n.currentTime = r;
			} catch (e) {
				console.debug?.(e);
			}
			t.paused && !n.paused ? n.pause() : !t.paused && n.paused && n.play()?.catch?.(() => {});
		}
		function Je(e) {
			let t = T.value?.getBoundingClientRect(), n = D.value;
			if (!t || n.w <= 0 || n.h <= 0) return;
			let r = S.compare === "wipeV" ? (e.clientY - t.top - n.y) / n.h : (e.clientX - t.left - n.x) / n.w;
			C("update:wipe", Math.round(Math.max(0, Math.min(1, r)) * 1e3) / 10);
		}
		function Ye(e) {
			O.value = !0, e.currentTarget?.setPointerCapture?.(e.pointerId), Je(e);
		}
		function Xe(e) {
			O.value && Je(e);
		}
		function Ze() {
			let e = X();
			if (e) {
				N.value = e.currentTime || 0;
				let t = ye(N.value, {
					a: B.value,
					b: V.value
				}, P.value);
				t != null && M.value && (e.currentTime = t, N.value = t), Q(t != null);
			}
			M.value && (q = requestAnimationFrame(Ze));
		}
		function Qe() {
			M.value = !0, cancelAnimationFrame(q), q = requestAnimationFrame(Ze), Q(!0), S.kind === "audio" && (j ? fe() : de()), Ct();
		}
		function $e() {
			M.value = !1, cancelAnimationFrame(q), Q(!0), St();
		}
		function et() {
			let e = X();
			P.value = Number.isFinite(e?.duration) ? Number(e?.duration) : 0, G.value = "", e && (e.volume = I.value, e.muted = L.value, e.playbackRate = R.value), i(qe);
		}
		function tt() {
			let e = X();
			if (e) {
				M.value || (N.value = e.currentTime || 0);
				try {
					let t = e.buffered;
					F.value = t.length ? t.end(t.length - 1) : 0;
				} catch {
					F.value = 0;
				}
			}
		}
		function nt() {
			if (z.value && !Y.value) {
				let e = X();
				e && (e.currentTime = 0, e.play()?.catch?.(() => {}));
			} else C("ended");
		}
		function rt() {
			G.value = e("viewer.studio.mediaError", "This file cannot be played by the browser.");
		}
		function $() {
			let e = X();
			e && (e.paused ? e.play()?.catch?.(() => {}) : e.pause());
		}
		function it(e) {
			let t = X();
			if (!t || !Number.isFinite(e)) return;
			let n = P.value > 0 ? P.value : e;
			t.currentTime = Math.max(0, Math.min(e, n)), N.value = t.currentTime, Q(!0);
		}
		function at(e) {
			let t = X();
			t && (t.paused || t.pause(), it(ge(t.currentTime || 0, J.value, e, P.value)));
		}
		function ot(e) {
			it((X()?.currentTime || 0) + e);
		}
		function st(e) {
			let t = se.value?.getBoundingClientRect();
			return !t || t.width <= 0 ? 0 : Math.max(0, Math.min(100, (e.clientX - t.left) / t.width * 100));
		}
		function ct(e) {
			P.value <= 0 || (U.value = !0, e.currentTarget?.setPointerCapture?.(e.pointerId), it(st(e) / 100 * P.value));
		}
		function lt(e) {
			H.value = st(e), U.value && it(H.value / 100 * P.value);
		}
		function ut(e) {
			U.value = !1, e.currentTarget?.releasePointerCapture?.(e.pointerId);
		}
		function dt(e) {
			R.value = e;
			let t = X();
			t && (t.playbackRate = e);
		}
		function ft(e = 1, t = !1) {
			let n = be, r = n.indexOf(R.value), i = (r < 0 ? n.indexOf(1) : r) + e;
			t && (i = (i + n.length) % n.length), dt(n[Math.max(0, Math.min(n.length - 1, i))]);
		}
		function pt() {
			L.value = !L.value;
			let e = X();
			e && (e.muted = L.value);
		}
		let mt = x(!1);
		function ht(e) {
			if (e.type === "pointerdown") mt.value = !0, e.currentTarget?.setPointerCapture?.(e.pointerId);
			else if (!mt.value) return;
			let t = e.currentTarget.getBoundingClientRect(), n = t.width > 0 ? (e.clientX - t.left) / t.width : 1;
			gt(Math.round(Math.max(0, Math.min(1, n)) * 20) / 20);
		}
		function gt(e) {
			I.value = e;
			let t = X();
			t && (t.volume = I.value, I.value > 0 && L.value && (L.value = !1, t.muted = !1));
		}
		function _t() {
			B.value = N.value, V.value != null && V.value <= B.value && (V.value = null);
		}
		function vt() {
			V.value = N.value, B.value ??= 0;
		}
		function yt() {
			B.value = null, V.value = null;
		}
		function bt() {
			let e = oe.value;
			e && (document.fullscreenElement ? document.exitFullscreen?.() : e.requestFullscreen?.());
		}
		async function xt() {
			let e = X();
			if (S.kind !== "video" || !(e instanceof HTMLVideoElement) || !e.videoWidth) return;
			let t = document.createElement("canvas");
			t.width = e.videoWidth, t.height = e.videoHeight, t.getContext("2d")?.drawImage(e, 0, 0);
			let n = await new Promise((e) => t.toBlob(e, "image/png"));
			if (!n) return;
			let r = URL.createObjectURL(n), i = String(S.filename || "frame").replace(/\.[^.]+$/, ""), a = document.createElement("a");
			a.href = r, a.download = `${i}_f${String(Ie.value).padStart(5, "0")}.png`, a.click(), setTimeout(() => URL.revokeObjectURL(r), 1e3);
		}
		function St() {
			W.value = !0, Ct();
		}
		function Ct() {
			K && clearTimeout(K), K = setTimeout(() => {
				M.value && !U.value && S.kind === "video" && (W.value = !1);
			}, 2200);
		}
		function wt(e) {
			if (e) try {
				e.pause(), e.removeAttribute("src"), e.load();
			} catch (e) {
				console.debug?.(e);
			}
		}
		function Tt() {
			wt(E.value), wt(X());
		}
		re(() => S.src, () => {
			yt(), N.value = 0, P.value = 0, F.value = 0, G.value = "";
		});
		function Et() {
			let e = X();
			if (!e) return;
			e.muted = L.value, e.playbackRate = R.value;
			let t = e.play?.();
			t && typeof t.catch == "function" && t.catch(() => {
				e.muted || (L.value = !0, e.muted = !0, e.play?.()?.catch?.(() => {}));
			});
		}
		return re([
			Z,
			() => S.compareSrc,
			() => S.compare
		], () => void i(() => {
			qe(), Q(!0);
		})), c(() => {
			Et();
			try {
				ce = new ResizeObserver(() => qe()), T.value && ce.observe(T.value);
			} catch (e) {
				console.debug?.(e);
			}
		}), ne(() => {
			ce?.disconnect(), cancelAnimationFrame(ue);
			try {
				A?.close?.();
			} catch (e) {
				console.debug?.(e);
			}
			A = null, j = null, cancelAnimationFrame(q), K && clearTimeout(K), Tt();
		}), n({
			togglePlay: $,
			play: Et,
			stepFrame: at,
			seekBy: ot,
			cycleRate: ft,
			toggleMute: pt,
			setLoopA: _t,
			setLoopB: vt,
			clearLoop: yt,
			toggleFullscreen: bt,
			exportFrame: xt,
			release: Tt,
			getSource: () => w.value instanceof HTMLVideoElement ? w.value : null,
			getBox: () => S.kind === "video" ? T.value?.querySelector(".mjr-studio-player__box") : null,
			isPlaying: () => M.value
		}), (n, i) => {
			let c = ee("MButton");
			return m(), v("div", {
				ref_key: "root",
				ref: oe,
				class: y(["mjr-studio-player", {
					"is-audio": t.kind === "audio",
					"is-compact": t.compact,
					"controls-hidden": !W.value
				}]),
				onPointermove: St
			}, [
				t.kind === "video" ? (m(), v("div", {
					key: 0,
					ref_key: "screen",
					ref: T,
					class: y(["mjr-studio-player__screen", { "is-side": He.value }]),
					onClick: $,
					onDblclick: bt
				}, [
					s("div", {
						class: "mjr-studio-player__layers",
						style: g(t.mediaFilter ? { filter: t.mediaFilter } : void 0)
					}, [s("video", {
						ref_key: "media",
						ref: w,
						class: "mjr-studio-player__media",
						src: t.src,
						playsinline: "",
						preload: "auto",
						onPlay: Qe,
						onPause: $e,
						onLoadedmetadata: et,
						onTimeupdate: tt,
						onProgress: tt,
						onEnded: nt,
						onError: rt
					}, null, 40, xe), Z.value ? (m(), v("video", {
						ref_key: "mediaB",
						ref: E,
						key: `b:${t.compareSrc}`,
						class: "mjr-studio-player__media is-b",
						src: t.compareSrc || "",
						playsinline: "",
						muted: "",
						preload: "auto",
						style: g(Ge.value),
						onLoadedmetadata: i[0] ||= (e) => Q(!0)
					}, null, 44, Se)) : u("", !0)], 4),
					s("div", {
						class: "mjr-studio-player__box",
						style: g(Ke.value)
					}, [ae(n.$slots, "overlay", {
						width: D.value.w,
						height: D.value.h
					}), Ue.value ? (m(), v("div", {
						key: 0,
						class: y(["mjr-studio-stage__divider", {
							"is-vertical": t.compare === "wipeV",
							"is-active": O.value
						}]),
						style: g(t.compare === "wipeV" ? { top: `${We.value}%` } : { left: `${We.value}%` }),
						onClick: i[1] ||= f(() => {}, ["stop"]),
						onDblclick: i[2] ||= f((e) => C("update:wipe", 50), ["stop"]),
						onPointerdown: f(Ye, ["stop"]),
						onPointermove: Xe,
						onPointerup: i[3] ||= (e) => O.value = !1,
						onPointercancel: i[4] ||= (e) => O.value = !1
					}, [...i[12] ||= [s("span", { class: "mjr-studio-stage__divider-grip" }, null, -1)]], 38)) : u("", !0)], 4),
					Z.value ? (m(), v("div", Ce, [
						i[13] ||= s("span", null, "A", -1),
						s("span", we, h(t.compare === "wipeV" ? "/" : "|"), 1),
						i[14] ||= s("span", null, "B", -1)
					])) : u("", !0)
				], 34)) : (m(), v("div", {
					key: 1,
					class: y(["mjr-studio-player__audio-art", { "has-spectrum": k.value }]),
					onClick: $
				}, [
					r(s("canvas", {
						ref_key: "spectrum",
						ref: le,
						class: "mjr-studio-player__spectrum",
						"aria-hidden": "true"
					}, null, 512), [[ie, k.value]]),
					r(s("i", Te, null, 512), [[ie, !k.value]]),
					s("span", null, h(t.filename), 1),
					s("audio", {
						ref_key: "media",
						ref: w,
						src: t.src,
						preload: "auto",
						onPlay: Qe,
						onPause: $e,
						onLoadedmetadata: et,
						onTimeupdate: tt,
						onProgress: tt,
						onEnded: nt,
						onError: rt
					}, null, 40, Ee)
				], 2)),
				!M.value && !G.value ? (m(), o(c, {
					key: 2,
					type: "button",
					class: "mjr-studio-player__big-play",
					"aria-label": b(e)("viewer.studio.play", "Play"),
					onClick: $
				}, {
					default: d(() => [...i[15] ||= [s("i", {
						class: "pi pi-play",
						"aria-hidden": "true"
					}, null, -1)]]),
					_: 1
				}, 8, ["aria-label"])) : u("", !0),
				G.value ? (m(), v("div", De, h(G.value), 1)) : u("", !0),
				s("div", {
					class: "mjr-studio-player__controls",
					onPointerdown: i[11] ||= f(() => {}, ["stop"])
				}, [s("div", {
					ref_key: "track",
					ref: se,
					class: "mjr-studio-player__track",
					role: "slider",
					"aria-label": b(e)("viewer.studio.seek", "Seek"),
					"aria-valuemin": 0,
					"aria-valuemax": P.value,
					"aria-valuenow": N.value,
					onPointerdown: ct,
					onPointermove: lt,
					onPointerup: ut,
					onPointerleave: i[5] ||= (e) => H.value = null
				}, [
					s("div", {
						class: "mjr-studio-player__buffered",
						style: g({ width: `${ze.value}%` })
					}, null, 4),
					Be.value ? (m(), v("div", {
						key: 0,
						class: "mjr-studio-player__loop",
						style: g(Be.value)
					}, null, 4)) : u("", !0),
					s("div", {
						class: "mjr-studio-player__progress",
						style: g({ width: `${Re.value}%` })
					}, null, 4),
					s("div", {
						class: "mjr-studio-player__thumb",
						style: g({ left: `${Re.value}%` })
					}, null, 4),
					Ve.value == null ? u("", !0) : (m(), v("div", {
						key: 1,
						class: "mjr-studio-player__hover",
						style: g({ left: `${H.value}%` })
					}, [_(h(b(me)(Ve.value)), 1), J.value ? (m(), v(a, { key: 0 }, [_(" · f" + h(b(he)(Ve.value, J.value)), 1)], 64)) : u("", !0)], 4))
				], 40, Oe), s("div", ke, [
					l(c, {
						type: "button",
						class: "mjr-studio-btn",
						title: b(e)("viewer.studio.playPause", "Play / pause (Space)"),
						onClick: $
					}, {
						default: d(() => [s("i", {
							class: y(M.value ? "pi pi-pause" : "pi pi-play"),
							"aria-hidden": "true"
						}, null, 2)]),
						_: 1
					}, 8, ["title"]),
					t.kind === "video" ? (m(), v(a, { key: 0 }, [l(c, {
						type: "button",
						class: "mjr-studio-btn",
						title: b(e)("viewer.studio.prevFrame", "Previous frame (,)"),
						onClick: i[6] ||= (e) => at(-1)
					}, {
						default: d(() => [...i[16] ||= [s("i", {
							class: "pi pi-step-backward",
							"aria-hidden": "true"
						}, null, -1)]]),
						_: 1
					}, 8, ["title"]), l(c, {
						type: "button",
						class: "mjr-studio-btn",
						title: b(e)("viewer.studio.nextFrame", "Next frame (.)"),
						onClick: i[7] ||= (e) => at(1)
					}, {
						default: d(() => [...i[17] ||= [s("i", {
							class: "pi pi-step-forward",
							"aria-hidden": "true"
						}, null, -1)]]),
						_: 1
					}, 8, ["title"])], 64)) : u("", !0),
					s("span", Ae, [_(h(b(me)(N.value)) + " ", 1), s("span", je, "/ " + h(b(me)(P.value)), 1)]),
					t.kind === "video" && J.value ? (m(), v("span", {
						key: 1,
						class: "mjr-studio-chip",
						title: b(e)("viewer.studio.frame", "Frame")
					}, [
						_(" f " + h(Ie.value), 1),
						Le.value ? (m(), v(a, { key: 0 }, [_(" / " + h(Le.value - 1), 1)], 64)) : u("", !0),
						_(" · " + h(Math.round(J.value * 100) / 100) + " fps ", 1)
					], 8, Me)) : u("", !0),
					i[24] ||= s("span", { class: "mjr-studio-player__spacer" }, null, -1),
					s("div", {
						class: "mjr-studio-player__group",
						title: b(e)("viewer.studio.abLoop", "A-B loop (I / O, U to clear)")
					}, [
						l(c, {
							type: "button",
							class: y(["mjr-studio-btn is-text", { "is-on": B.value != null }]),
							onClick: _t
						}, {
							default: d(() => [...i[18] ||= [_("A", -1)]]),
							_: 1
						}, 8, ["class"]),
						l(c, {
							type: "button",
							class: y(["mjr-studio-btn is-text", { "is-on": V.value != null }]),
							onClick: vt
						}, {
							default: d(() => [...i[19] ||= [_("B", -1)]]),
							_: 1
						}, 8, ["class"]),
						B.value != null || V.value != null ? (m(), o(c, {
							key: 0,
							type: "button",
							class: "mjr-studio-btn",
							title: b(e)("viewer.studio.clearLoop", "Clear A-B loop"),
							onClick: yt
						}, {
							default: d(() => [...i[20] ||= [s("i", {
								class: "pi pi-times",
								"aria-hidden": "true"
							}, null, -1)]]),
							_: 1
						}, 8, ["title"])) : u("", !0)
					], 8, Ne),
					l(c, {
						type: "button",
						class: y(["mjr-studio-btn", { "is-on": z.value }]),
						title: b(e)("viewer.studio.loop", "Loop"),
						onClick: i[8] ||= (e) => z.value = !z.value
					}, {
						default: d(() => [...i[21] ||= [s("i", {
							class: "pi pi-replay",
							"aria-hidden": "true"
						}, null, -1)]]),
						_: 1
					}, 8, ["class", "title"]),
					l(c, {
						type: "button",
						class: y(["mjr-studio-btn is-text", { "is-on": R.value !== 1 }]),
						title: b(e)("viewer.studio.speed", "Speed ([ / ])"),
						onClick: i[9] ||= (e) => ft(1, !0)
					}, {
						default: d(() => [_(h(R.value) + "×", 1)]),
						_: 1
					}, 8, ["class", "title"]),
					s("div", Pe, [l(c, {
						type: "button",
						class: "mjr-studio-btn",
						title: b(e)("viewer.studio.mute", "Mute (M)"),
						onClick: pt
					}, {
						default: d(() => [s("i", {
							class: y(L.value || I.value === 0 ? "pi pi-volume-off" : "pi pi-volume-up"),
							"aria-hidden": "true"
						}, null, 2)]),
						_: 1
					}, 8, ["title"]), s("div", {
						class: "mjr-studio-player__volume",
						role: "slider",
						"aria-label": b(e)("viewer.studio.volume", "Volume"),
						"aria-valuemin": 0,
						"aria-valuemax": 1,
						"aria-valuenow": L.value ? 0 : I.value,
						onPointerdown: ht,
						onPointermove: ht,
						onPointerup: i[10] ||= (e) => mt.value = !1
					}, [s("div", {
						class: "mjr-studio-player__volume-fill",
						style: g({ width: `${(L.value ? 0 : I.value) * 100}%` })
					}, null, 4)], 40, Fe)]),
					t.kind === "video" ? (m(), o(c, {
						key: 2,
						type: "button",
						class: "mjr-studio-btn",
						title: b(e)("viewer.studio.exportFrame", "Save this frame as PNG"),
						onClick: xt
					}, {
						default: d(() => [...i[22] ||= [s("i", {
							class: "pi pi-camera",
							"aria-hidden": "true"
						}, null, -1)]]),
						_: 1
					}, 8, ["title"])) : u("", !0),
					t.kind === "video" ? (m(), o(c, {
						key: 3,
						type: "button",
						class: "mjr-studio-btn",
						title: b(e)("viewer.studio.fullscreen", "Fullscreen (F)"),
						onClick: bt
					}, {
						default: d(() => [...i[23] ||= [s("i", {
							class: "pi pi-window-maximize",
							"aria-hidden": "true"
						}, null, -1)]]),
						_: 1
					}, 8, ["title"])) : u("", !0)
				])], 32)
			], 34);
		};
	}
});
export { le as _, z as a, de as b, se as c, j as d, ue as f, E as g, fe as h, V as i, pe as l, T as m, H as n, M as o, S as p, W as r, ce as s, G as t, A as u, D as v, N as y };
