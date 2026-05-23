import { n as e } from "./state-B8eTxorm.js";
//#region js/features/viewer/scopes.js
function t(e, t, n) {
	return .2126 * e + .7152 * t + .0722 * n;
}
var n = 256, r = 3, i = 220, a = 110, o = 2, s = 10, c = 1, l = "12px var(--comfy-font, ui-sans-serif, system-ui)", u = 10, d = 8, f = 10, p = 28, m = 10, h = 1.2, g = 1, _ = 420, v = 240, y = 32, b = 24, x = .06, S = .9, C = .9, w = null, T = null;
function E(e, t) {
	try {
		let n = Math.max(1, Math.floor(Number(e) || 1)), r = Math.max(1, Math.floor(Number(t) || 1));
		return w ||= document.createElement("canvas"), w.width !== n && (w.width = n), w.height !== r && (w.height = r), T ||= w.getContext("2d", { willReadFrequently: !0 }), T || null;
	} catch {
		return null;
	}
}
function D(e, t, n) {
	try {
		return e.getImageData(0, 0, t, n);
	} catch {
		return null;
	}
}
function O(e, { x: t, y: n, w: r, h: i, title: a }) {
	try {
		e.save(), e.fillStyle = "rgba(0,0,0,0.55)", e.strokeStyle = "rgba(255,255,255,0.14)", e.lineWidth = c;
		let o = s;
		e.beginPath(), e.moveTo(t + o, n), e.arcTo(t + r, n, t + r, n + i, o), e.arcTo(t + r, n + i, t, n + i, o), e.arcTo(t, n + i, t, n, o), e.arcTo(t, n, t + r, n, o), e.closePath(), e.fill(), e.stroke(), a && (e.font = l, e.textAlign = "left", e.textBaseline = "top", e.fillStyle = "rgba(255,255,255,0.86)", e.fillText(String(a), t + u, n + d)), e.restore();
	} catch (e) {
		console.debug?.(e);
	}
}
function k(e, { sampleStep: i = r } = {}) {
	let a = n, o = new Uint32Array(a), s = new Uint32Array(a), c = new Uint32Array(a), l = new Uint32Array(a);
	try {
		let n = e?.data;
		if (!n) return {
			hr: o,
			hg: s,
			hb: c,
			hl: l,
			max: 1
		};
		let r = Math.max(1, Math.floor(i));
		for (let e = 0; e < n.length; e += 4 * r) {
			let r = n[e] ?? 0, i = n[e + 1] ?? 0, a = n[e + 2] ?? 0;
			o[r] += 1, s[i] += 1, c[a] += 1;
			let u = Math.max(0, Math.min(255, Math.round(t(r, i, a))));
			l[u] += 1;
		}
		let u = 1;
		for (let e = 0; e < a; e++) u = Math.max(u, o[e], s[e], c[e], l[e]);
		return {
			hr: o,
			hg: s,
			hb: c,
			hl: l,
			max: u
		};
	} catch {
		return {
			hr: o,
			hg: s,
			hb: c,
			hl: l,
			max: 1
		};
	}
}
function A(e, t, r, { channel: i = "rgb" } = {}) {
	try {
		let { x: a, y: o, w: s, h: l } = t, u = p, d = f, _ = a + d, v = o + u, y = s - d * 2, b = l - u - d;
		if (!(y > m && b > m)) return;
		e.save(), e.globalCompositeOperation = "source-over", e.strokeStyle = "rgba(255,255,255,0.10)", e.lineWidth = c, e.beginPath(), e.rect(_, v, y, b), e.stroke();
		let x = Number(r?.max) || 1, S = (t, r) => {
			e.strokeStyle = r, e.beginPath();
			for (let r = 0; r < n; r++) {
				let n = (t?.[r] || 0) / x, i = _ + r / 255 * y, a = v + b - n * b;
				r === 0 ? e.moveTo(i, a) : e.lineTo(i, a);
			}
			e.stroke();
		}, C = String(i || "rgb");
		e.lineWidth = h, C === "r" ? S(r.hr, "rgba(255,90,90,0.95)") : C === "g" ? S(r.hg, "rgba(90,255,140,0.95)") : C === "b" ? S(r.hb, "rgba(90,160,255,0.95)") : C === "l" ? S(r.hl, "rgba(255,210,90,0.95)") : (S(r.hr, "rgba(255,90,90,0.95)"), S(r.hg, "rgba(90,255,140,0.95)"), S(r.hb, "rgba(90,160,255,0.95)")), C !== "l" && (e.lineWidth = g, S(r.hl, "rgba(255,255,255,0.45)")), e.restore();
	} catch (e) {
		console.debug?.(e);
	}
}
function j(n, { columns: r = i, rows: s = a, sampleStep: c = o } = {}) {
	let l = Math.max(y, Math.floor(r)), u = Math.max(b, Math.floor(s)), d = new Uint16Array(l * u);
	try {
		let r = n?.data, i = n?.width || 0, a = n?.height || 0;
		if (!r || !(i > 0 && a > 0)) return {
			out: d,
			gridW: l,
			gridH: u,
			max: 1
		};
		let o = Math.max(1, Math.floor(c));
		for (let n = 0; n < a; n += o) {
			let a = n * i * 4;
			for (let n = 0; n < i; n += o) {
				let o = n / (i - 1 || 1), s = Math.max(0, Math.min(l - 1, Math.floor(o * (l - 1)))), c = a + n * 4, f = r[c] ?? 0, p = r[c + 1] ?? 0, m = r[c + 2] ?? 0, h = e(t(f / 255, p / 255, m / 255)), g = Math.max(0, Math.min(u - 1, Math.round((1 - h) * (u - 1))));
				d[g * l + s] += 1;
			}
		}
		let s = 1;
		for (let e = 0; e < d.length; e++) s = Math.max(s, d[e]);
		return {
			out: d,
			gridW: l,
			gridH: u,
			max: s
		};
	} catch {
		return {
			out: d,
			gridW: l,
			gridH: u,
			max: 1
		};
	}
}
function M(e, t, n) {
	try {
		let { x: r, y: i, w: a, h: o } = t, s = p, l = f, u = r + l, d = i + s, h = a - l * 2, g = o - s - l;
		if (!(h > m && g > m)) return;
		e.save(), e.strokeStyle = "rgba(255,255,255,0.10)", e.lineWidth = c, e.beginPath(), e.rect(u, d, h, g), e.stroke();
		let _ = n?.gridW || 0, v = n?.gridH || 0, y = n?.out, b = Number(n?.max) || 1;
		if (!y || !(_ > 0 && v > 0)) return;
		for (let t = 0; t < v; t++) for (let n = 0; n < _; n++) {
			let r = (y[t * _ + n] || 0) / b;
			if (r <= 0) continue;
			let i = u + n / (_ - 1 || 1) * h, a = d + t / (v - 1 || 1) * g;
			e.fillStyle = `rgba(255,255,255,${Math.min(S, x + r * C)})`, e.fillRect(i, a, Math.max(1, h / _), Math.max(1, g / v));
		}
		e.restore();
	} catch (e) {
		console.debug?.(e);
	}
}
function N(e, t, n, r = {}) {
	try {
		let i = String(r?.mode || "both"), a = String(r?.channel || "rgb");
		if (!e || !t || !n || i === "off") return;
		let o = Number(n.width) || 0, s = Number(n.height) || 0;
		if (!(o > 1 && s > 1)) return;
		let c = Math.max(o / _, s / v, 1), l = Math.max(1, Math.floor(o / c)), u = Math.max(1, Math.floor(s / c)), d = E(l, u);
		if (!d) return;
		try {
			d.clearRect(0, 0, l, u), d.drawImage(n, 0, 0, l, u);
		} catch {
			return;
		}
		let f = D(d, l, u);
		if (!f) return;
		let p = Math.min(520, Math.max(320, Math.floor(t.w * .36))), m = Math.min(260, Math.max(160, Math.floor(t.h * .22))), h = t.w - p - 10, g = t.h - m - 10;
		if (i === "hist" || i === "both") {
			let t = {
				x: h,
				y: g,
				w: p,
				h: m
			}, n = a === "r" ? "Histogram (R)" : a === "g" ? "Histogram (G)" : a === "b" ? "Histogram (B)" : a === "l" ? "Histogram (Luma)" : "Histogram (RGB + Luma)";
			O(e, {
				...t,
				title: n
			}), A(e, t, k(f, { sampleStep: Math.max(2, Math.floor(Math.max(l, u) / 180)) }), { channel: a });
		}
		if (i === "wave" || i === "both") {
			let t = {
				x: h,
				y: i === "both" ? g - m - 8 : g,
				w: p,
				h: m
			};
			O(e, {
				...t,
				title: "Waveform (Luma)"
			}), M(e, t, j(f, {
				columns: 180,
				rows: 96,
				sampleStep: Math.max(2, Math.floor(Math.max(l, u) / 180))
			}));
		}
	} catch (e) {
		console.debug?.(e);
	}
}
//#endregion
export { N as drawScopesLight };
