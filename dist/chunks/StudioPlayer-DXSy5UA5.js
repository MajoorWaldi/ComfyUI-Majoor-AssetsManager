import { m as e } from "./events-cBMXVULQ.js";
import { g as t, h as n } from "./viewerOpenRequest-_DqD1rXA.js";
import { A as r, B as i, C as a, D as o, E as s, H as c, K as l, N as u, O as d, S as ee, T as f, Y as p, dt as m, ft as h, it as g, j as _, k as v, pt as y, q as te, ut as b, z as ne } from "./mjr-primevue-3mpaVb1C.js";
// ui/features/viewer/studio/studioMedia.ts
var x = /* @__PURE__ */ new Set([
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
]), re = /* @__PURE__ */ new Set([
	"mp4",
	"webm",
	"mov",
	"mkv",
	"avi",
	"m4v"
]), S = /* @__PURE__ */ new Set([
	"mp3",
	"wav",
	"flac",
	"ogg",
	"opus",
	"m4a",
	"aac",
	"aiff"
]), C = /* @__PURE__ */ new Set([
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
function w(e) {
	let t = String(e?.filename || e?.name || e?.filepath || "").trim(), n = t.lastIndexOf(".");
	return n >= 0 ? t.slice(n + 1).toLowerCase() : "";
}
function T(e) {
	let t = String(e?.kind || "").trim().toLowerCase();
	if (t === "image" || t === "video" || t === "audio" || t === "model3d") return t;
	let n = w(e);
	return x.has(n) ? "image" : re.has(n) ? "video" : S.has(n) ? "audio" : C.has(n) ? "model3d" : "other";
}
function E(e, { withCentis: t = !0 } = {}) {
	let n = Math.floor((Number.isFinite(e) && e > 0 ? e : 0) * 100 + 1e-6), r = n % 100, i = Math.floor(n / 100), a = i % 60, o = Math.floor(i / 60) % 60, s = Math.floor(i / 3600), c = s > 0 ? String(o).padStart(2, "0") : String(o), l = `${s > 0 ? `${s}:` : ""}${c}:${String(a).padStart(2, "0")}`;
	return t ? `${l}.${String(r).padStart(2, "0")}` : l;
}
function D(e, t) {
	return !t || !Number.isFinite(t) || t <= 0 ? 0 : Math.max(0, Math.floor(Math.max(0, e) * t + 1e-6));
}
function O(e, t) {
	return !t || !Number.isFinite(t) || t <= 0 ? 0 : Math.max(0, (Math.max(0, Math.floor(e)) + .25) / t);
}
function ie(e, t, n, r) {
	let i = t && Number.isFinite(t) && t > 0 ? t : 24, a = O(D(e, i) + n, i);
	return Math.min(Math.max(0, a), Math.max(0, (Number.isFinite(r) && r > 0 ? r : a) - .5 / i));
}
function ae(e, t, n) {
	let r = Number(n);
	return Number.isFinite(r) && r > 0 ? Math.floor(r) : !t || !Number.isFinite(e) || e <= 0 ? null : Math.max(1, Math.round(e * t));
}
function oe(e, t) {
	if (e.a == null || e.b == null) return null;
	let n = Number.isFinite(t) && t > 0 ? t : Math.max(e.a, e.b), r = Math.min(Math.max(0, Math.min(e.a, e.b)), n), i = Math.min(Math.max(0, Math.max(e.a, e.b)), n);
	return i - r >= .02 ? {
		a: r,
		b: i
	} : null;
}
function se(e, t, n) {
	let r = oe(t, n);
	return r && (e >= r.b || e < r.a - .05) ? r.a : null;
}
var ce = [
	.25,
	.5,
	1,
	1.5,
	2
];
function k(e, r) {
	return t(e) ?? n(r?.fps_raw ?? r?.fps ?? r?.frame_rate) ?? n(e?.fps);
}
function A(e) {
	let t = [], n = Number(e?.width), r = Number(e?.height);
	n > 0 && r > 0 && t.push(`${n}×${r}`);
	let i = w(e);
	i && t.push(i.toUpperCase());
	let a = Number(e?.duration);
	a > 0 && t.push(E(a, { withCentis: !1 }));
	let o = Number(e?.size);
	return o > 0 && t.push(j(o)), t.join(" · ");
}
function j(e) {
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
function M(e, t, n = 40) {
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
var le = ["src"], ue = ["src"], de = {
	key: 3,
	class: "mjr-studio-player__error"
}, fe = [
	"aria-label",
	"aria-valuemax",
	"aria-valuenow"
], pe = { class: "mjr-studio-player__row" }, me = { class: "mjr-studio-player__time" }, he = { class: "is-dim" }, ge = ["title"], _e = ["title"], ve = { class: "mjr-studio-player__group" }, ye = ["aria-label", "aria-valuenow"], N = /* @__PURE__ */ u({
	__name: "StudioPlayer",
	props: {
		src: {},
		kind: {},
		fps: {},
		frameCount: {},
		filename: {},
		initialMuted: { type: Boolean },
		initialRate: {},
		compact: { type: Boolean }
	},
	emits: ["ended"],
	setup(t, { expose: n, emit: u }) {
		let x = t, re = u, S = g(null), C = g(null), w = g(null), T = g(!1), O = g(0), k = g(0), A = g(0), j = g(1), M = g(!!x.initialMuted), N = g(Number(x.initialRate) > 0 ? Number(x.initialRate) : 1), P = g(!0), F = g(null), I = g(null), L = g(null), R = g(!1), z = g(!0), B = g(""), V = null, H = 0, U = f(() => x.fps && x.fps > 0 ? x.fps : null), be = f(() => D(O.value, U.value)), xe = f(() => ae(k.value, U.value, x.frameCount)), Se = f(() => k.value > 0 ? O.value / k.value * 100 : 0), Ce = f(() => k.value > 0 ? A.value / k.value * 100 : 0), W = f(() => oe({
			a: F.value,
			b: I.value
		}, k.value)), we = f(() => {
			if (!W.value || k.value <= 0) return null;
			let e = W.value.a / k.value * 100, t = (W.value.b - W.value.a) / k.value * 100;
			return {
				left: `${e}%`,
				width: `${t}%`
			};
		}), G = f(() => L.value == null || k.value <= 0 ? null : L.value / 100 * k.value);
		function K() {
			return S.value;
		}
		function Te() {
			let e = K();
			if (e) {
				O.value = e.currentTime || 0;
				let t = se(O.value, {
					a: F.value,
					b: I.value
				}, k.value);
				t != null && T.value && (e.currentTime = t, O.value = t);
			}
			T.value && (H = requestAnimationFrame(Te));
		}
		function Ee() {
			T.value = !0, cancelAnimationFrame(H), H = requestAnimationFrame(Te), Ge();
		}
		function De() {
			T.value = !1, cancelAnimationFrame(H), We();
		}
		function Oe() {
			let e = K();
			k.value = Number.isFinite(e?.duration) ? Number(e?.duration) : 0, B.value = "", e && (e.volume = j.value, e.muted = M.value, e.playbackRate = N.value);
		}
		function q() {
			let e = K();
			if (e) {
				T.value || (O.value = e.currentTime || 0);
				try {
					let t = e.buffered;
					A.value = t.length ? t.end(t.length - 1) : 0;
				} catch {
					A.value = 0;
				}
			}
		}
		function ke() {
			if (P.value && !W.value) {
				let e = K();
				e && (e.currentTime = 0, e.play()?.catch?.(() => {}));
			} else re("ended");
		}
		function Ae() {
			B.value = e("viewer.studio.mediaError", "This file cannot be played by the browser.");
		}
		function J() {
			let e = K();
			e && (e.paused ? e.play()?.catch?.(() => {}) : e.pause());
		}
		function Y(e) {
			let t = K();
			if (!t || !Number.isFinite(e)) return;
			let n = k.value > 0 ? k.value : e;
			t.currentTime = Math.max(0, Math.min(e, n)), O.value = t.currentTime;
		}
		function X(e) {
			let t = K();
			t && (t.paused || t.pause(), Y(ie(t.currentTime || 0, U.value, e, k.value)));
		}
		function je(e) {
			Y((K()?.currentTime || 0) + e);
		}
		function Me(e) {
			let t = w.value?.getBoundingClientRect();
			return !t || t.width <= 0 ? 0 : Math.max(0, Math.min(100, (e.clientX - t.left) / t.width * 100));
		}
		function Ne(e) {
			k.value <= 0 || (R.value = !0, e.currentTarget?.setPointerCapture?.(e.pointerId), Y(Me(e) / 100 * k.value));
		}
		function Pe(e) {
			L.value = Me(e), R.value && Y(L.value / 100 * k.value);
		}
		function Fe(e) {
			R.value = !1, e.currentTarget?.releasePointerCapture?.(e.pointerId);
		}
		function Ie(e) {
			N.value = e;
			let t = K();
			t && (t.playbackRate = e);
		}
		function Le(e = 1, t = !1) {
			let n = ce, r = n.indexOf(N.value), i = (r < 0 ? n.indexOf(1) : r) + e;
			t && (i = (i + n.length) % n.length), Ie(n[Math.max(0, Math.min(n.length - 1, i))]);
		}
		function Re() {
			M.value = !M.value;
			let e = K();
			e && (e.muted = M.value);
		}
		let Z = g(!1);
		function ze(e) {
			if (e.type === "pointerdown") Z.value = !0, e.currentTarget?.setPointerCapture?.(e.pointerId);
			else if (!Z.value) return;
			let t = e.currentTarget.getBoundingClientRect(), n = t.width > 0 ? (e.clientX - t.left) / t.width : 1;
			Be(Math.round(Math.max(0, Math.min(1, n)) * 20) / 20);
		}
		function Be(e) {
			j.value = e;
			let t = K();
			t && (t.volume = j.value, j.value > 0 && M.value && (M.value = !1, t.muted = !1));
		}
		function Ve() {
			F.value = O.value, I.value != null && I.value <= F.value && (I.value = null);
		}
		function He() {
			I.value = O.value, F.value ??= 0;
		}
		function Q() {
			F.value = null, I.value = null;
		}
		function $() {
			let e = C.value;
			e && (document.fullscreenElement ? document.exitFullscreen?.() : e.requestFullscreen?.());
		}
		async function Ue() {
			let e = K();
			if (x.kind !== "video" || !(e instanceof HTMLVideoElement) || !e.videoWidth) return;
			let t = document.createElement("canvas");
			t.width = e.videoWidth, t.height = e.videoHeight, t.getContext("2d")?.drawImage(e, 0, 0);
			let n = await new Promise((e) => t.toBlob(e, "image/png"));
			if (!n) return;
			let r = URL.createObjectURL(n), i = String(x.filename || "frame").replace(/\.[^.]+$/, ""), a = document.createElement("a");
			a.href = r, a.download = `${i}_f${String(be.value).padStart(5, "0")}.png`, a.click(), setTimeout(() => URL.revokeObjectURL(r), 1e3);
		}
		function We() {
			z.value = !0, Ge();
		}
		function Ge() {
			V && clearTimeout(V), V = setTimeout(() => {
				T.value && !R.value && x.kind === "video" && (z.value = !1);
			}, 2200);
		}
		function Ke() {
			let e = K();
			if (e) try {
				e.pause(), e.removeAttribute("src"), e.load();
			} catch (e) {
				console.debug?.(e);
			}
		}
		te(() => x.src, () => {
			Q(), O.value = 0, k.value = 0, A.value = 0, B.value = "";
		});
		function qe() {
			let e = K();
			if (!e) return;
			e.muted = M.value, e.playbackRate = N.value;
			let t = e.play?.();
			t && typeof t.catch == "function" && t.catch(() => {
				e.muted || (M.value = !0, e.muted = !0, e.play?.()?.catch?.(() => {}));
			});
		}
		return i(qe), ne(() => {
			cancelAnimationFrame(H), V && clearTimeout(V), Ke();
		}), n({
			togglePlay: J,
			play: qe,
			stepFrame: X,
			seekBy: je,
			cycleRate: Le,
			toggleMute: Re,
			setLoopA: Ve,
			setLoopB: He,
			clearLoop: Q,
			toggleFullscreen: $,
			exportFrame: Ue,
			release: Ke
		}), (n, i) => {
			let u = l("MButton");
			return c(), v("div", {
				ref_key: "root",
				ref: C,
				class: m(["mjr-studio-player", {
					"is-audio": t.kind === "audio",
					"is-compact": t.compact,
					"controls-hidden": !z.value
				}]),
				onPointermove: We
			}, [
				t.kind === "video" ? (c(), v("video", {
					key: 0,
					ref_key: "media",
					ref: S,
					class: "mjr-studio-player__media",
					src: t.src,
					playsinline: "",
					preload: "auto",
					onClick: J,
					onDblclick: $,
					onPlay: Ee,
					onPause: De,
					onLoadedmetadata: Oe,
					onTimeupdate: q,
					onProgress: q,
					onEnded: ke,
					onError: Ae
				}, null, 40, le)) : (c(), v("div", {
					key: 1,
					class: "mjr-studio-player__audio-art",
					onClick: J
				}, [
					i[7] ||= s("i", {
						class: "pi pi-volume-up",
						"aria-hidden": "true"
					}, null, -1),
					s("span", null, y(t.filename), 1),
					s("audio", {
						ref_key: "media",
						ref: S,
						src: t.src,
						preload: "auto",
						onPlay: Ee,
						onPause: De,
						onLoadedmetadata: Oe,
						onTimeupdate: q,
						onProgress: q,
						onEnded: ke,
						onError: Ae
					}, null, 40, ue)
				])),
				!T.value && !B.value ? (c(), o(u, {
					key: 2,
					type: "button",
					class: "mjr-studio-player__big-play",
					"aria-label": b(e)("viewer.studio.play", "Play"),
					onClick: J
				}, {
					default: p(() => [...i[8] ||= [s("i", {
						class: "pi pi-play",
						"aria-hidden": "true"
					}, null, -1)]]),
					_: 1
				}, 8, ["aria-label"])) : d("", !0),
				B.value ? (c(), v("div", de, y(B.value), 1)) : d("", !0),
				s("div", {
					class: "mjr-studio-player__controls",
					onPointerdown: i[6] ||= ee(() => {}, ["stop"])
				}, [s("div", {
					ref_key: "track",
					ref: w,
					class: "mjr-studio-player__track",
					role: "slider",
					"aria-label": b(e)("viewer.studio.seek", "Seek"),
					"aria-valuemin": 0,
					"aria-valuemax": k.value,
					"aria-valuenow": O.value,
					onPointerdown: Ne,
					onPointermove: Pe,
					onPointerup: Fe,
					onPointerleave: i[0] ||= (e) => L.value = null
				}, [
					s("div", {
						class: "mjr-studio-player__buffered",
						style: h({ width: `${Ce.value}%` })
					}, null, 4),
					we.value ? (c(), v("div", {
						key: 0,
						class: "mjr-studio-player__loop",
						style: h(we.value)
					}, null, 4)) : d("", !0),
					s("div", {
						class: "mjr-studio-player__progress",
						style: h({ width: `${Se.value}%` })
					}, null, 4),
					s("div", {
						class: "mjr-studio-player__thumb",
						style: h({ left: `${Se.value}%` })
					}, null, 4),
					G.value == null ? d("", !0) : (c(), v("div", {
						key: 1,
						class: "mjr-studio-player__hover",
						style: h({ left: `${L.value}%` })
					}, [r(y(b(E)(G.value)), 1), U.value ? (c(), v(a, { key: 0 }, [r(" · f" + y(b(D)(G.value, U.value)), 1)], 64)) : d("", !0)], 4))
				], 40, fe), s("div", pe, [
					_(u, {
						type: "button",
						class: "mjr-studio-btn",
						title: b(e)("viewer.studio.playPause", "Play / pause (Space)"),
						onClick: J
					}, {
						default: p(() => [s("i", {
							class: m(T.value ? "pi pi-pause" : "pi pi-play"),
							"aria-hidden": "true"
						}, null, 2)]),
						_: 1
					}, 8, ["title"]),
					t.kind === "video" ? (c(), v(a, { key: 0 }, [_(u, {
						type: "button",
						class: "mjr-studio-btn",
						title: b(e)("viewer.studio.prevFrame", "Previous frame (,)"),
						onClick: i[1] ||= (e) => X(-1)
					}, {
						default: p(() => [...i[9] ||= [s("i", {
							class: "pi pi-step-backward",
							"aria-hidden": "true"
						}, null, -1)]]),
						_: 1
					}, 8, ["title"]), _(u, {
						type: "button",
						class: "mjr-studio-btn",
						title: b(e)("viewer.studio.nextFrame", "Next frame (.)"),
						onClick: i[2] ||= (e) => X(1)
					}, {
						default: p(() => [...i[10] ||= [s("i", {
							class: "pi pi-step-forward",
							"aria-hidden": "true"
						}, null, -1)]]),
						_: 1
					}, 8, ["title"])], 64)) : d("", !0),
					s("span", me, [r(y(b(E)(O.value)) + " ", 1), s("span", he, "/ " + y(b(E)(k.value)), 1)]),
					t.kind === "video" && U.value ? (c(), v("span", {
						key: 1,
						class: "mjr-studio-chip",
						title: b(e)("viewer.studio.frame", "Frame")
					}, [
						r(" f " + y(be.value), 1),
						xe.value ? (c(), v(a, { key: 0 }, [r(" / " + y(xe.value - 1), 1)], 64)) : d("", !0),
						r(" · " + y(Math.round(U.value * 100) / 100) + " fps ", 1)
					], 8, ge)) : d("", !0),
					i[17] ||= s("span", { class: "mjr-studio-player__spacer" }, null, -1),
					s("div", {
						class: "mjr-studio-player__group",
						title: b(e)("viewer.studio.abLoop", "A-B loop (I / O, U to clear)")
					}, [
						_(u, {
							type: "button",
							class: m(["mjr-studio-btn is-text", { "is-on": F.value != null }]),
							onClick: Ve
						}, {
							default: p(() => [...i[11] ||= [r("A", -1)]]),
							_: 1
						}, 8, ["class"]),
						_(u, {
							type: "button",
							class: m(["mjr-studio-btn is-text", { "is-on": I.value != null }]),
							onClick: He
						}, {
							default: p(() => [...i[12] ||= [r("B", -1)]]),
							_: 1
						}, 8, ["class"]),
						F.value != null || I.value != null ? (c(), o(u, {
							key: 0,
							type: "button",
							class: "mjr-studio-btn",
							title: b(e)("viewer.studio.clearLoop", "Clear A-B loop"),
							onClick: Q
						}, {
							default: p(() => [...i[13] ||= [s("i", {
								class: "pi pi-times",
								"aria-hidden": "true"
							}, null, -1)]]),
							_: 1
						}, 8, ["title"])) : d("", !0)
					], 8, _e),
					_(u, {
						type: "button",
						class: m(["mjr-studio-btn", { "is-on": P.value }]),
						title: b(e)("viewer.studio.loop", "Loop"),
						onClick: i[3] ||= (e) => P.value = !P.value
					}, {
						default: p(() => [...i[14] ||= [s("i", {
							class: "pi pi-replay",
							"aria-hidden": "true"
						}, null, -1)]]),
						_: 1
					}, 8, ["class", "title"]),
					_(u, {
						type: "button",
						class: m(["mjr-studio-btn is-text", { "is-on": N.value !== 1 }]),
						title: b(e)("viewer.studio.speed", "Speed ([ / ])"),
						onClick: i[4] ||= (e) => Le(1, !0)
					}, {
						default: p(() => [r(y(N.value) + "×", 1)]),
						_: 1
					}, 8, ["class", "title"]),
					s("div", ve, [_(u, {
						type: "button",
						class: "mjr-studio-btn",
						title: b(e)("viewer.studio.mute", "Mute (M)"),
						onClick: Re
					}, {
						default: p(() => [s("i", {
							class: m(M.value || j.value === 0 ? "pi pi-volume-off" : "pi pi-volume-up"),
							"aria-hidden": "true"
						}, null, 2)]),
						_: 1
					}, 8, ["title"]), s("div", {
						class: "mjr-studio-player__volume",
						role: "slider",
						"aria-label": b(e)("viewer.studio.volume", "Volume"),
						"aria-valuemin": 0,
						"aria-valuemax": 1,
						"aria-valuenow": M.value ? 0 : j.value,
						onPointerdown: ze,
						onPointermove: ze,
						onPointerup: i[5] ||= (e) => Z.value = !1
					}, [s("div", {
						class: "mjr-studio-player__volume-fill",
						style: h({ width: `${(M.value ? 0 : j.value) * 100}%` })
					}, null, 4)], 40, ye)]),
					t.kind === "video" ? (c(), o(u, {
						key: 2,
						type: "button",
						class: "mjr-studio-btn",
						title: b(e)("viewer.studio.exportFrame", "Save this frame as PNG"),
						onClick: Ue
					}, {
						default: p(() => [...i[15] ||= [s("i", {
							class: "pi pi-camera",
							"aria-hidden": "true"
						}, null, -1)]]),
						_: 1
					}, 8, ["title"])) : d("", !0),
					t.kind === "video" ? (c(), o(u, {
						key: 3,
						type: "button",
						class: "mjr-studio-btn",
						title: b(e)("viewer.studio.fullscreen", "Fullscreen (F)"),
						onClick: $
					}, {
						default: p(() => [...i[16] ||= [s("i", {
							class: "pi pi-window-maximize",
							"aria-hidden": "true"
						}, null, -1)]]),
						_: 1
					}, 8, ["title"])) : d("", !0)
				])], 32)
			], 34);
		};
	}
});
export { T as a, k as i, A as n, M as r, N as t };
