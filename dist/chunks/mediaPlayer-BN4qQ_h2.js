import { t as e } from "./rolldown-runtime-Dy4uBu1J.js";
import { m as t, o as n, pt as r, r as i } from "./events-CRutpS6F.js";
import { t as a } from "./VideoControls-CpO4V4Qf.js";
import { n as o } from "./state-DPiaUMw1.js";
//#region ui/features/viewer/videoSync.ts
var s = () => {
	try {
		return !!n?.DEBUG_VIEWER;
	} catch {
		return !1;
	}
};
function c(e, t, { threshold: n = .15, correctionCooldownMs: r = 250 } = {}) {
	let i = new AbortController();
	try {
		if (!e) return i;
		let a = Array.isArray(t) ? t.filter((t) => t && t !== e) : [];
		if (!a.length) return i;
		let o = [e, ...a].filter(Boolean), s = !1, c = /* @__PURE__ */ new WeakSet(), l = {
			source: null,
			rafId: null,
			rvfcId: null
		}, u = 0, d = () => {
			try {
				let e = l.source;
				l.rvfcId != null && typeof e?.cancelVideoFrameCallback == "function" && e.cancelVideoFrameCallback(l.rvfcId);
			} catch (e) {
				console.debug?.(e);
			}
			l.rvfcId = null;
			try {
				l.rafId != null && typeof cancelAnimationFrame == "function" && cancelAnimationFrame(l.rafId);
			} catch (e) {
				console.debug?.(e);
			}
			l.rafId = null, l.source = null;
		}, f = (e) => {
			try {
				if (e && e.paused === !1) return;
				try {
					c.add(e);
				} catch (e) {
					console.debug?.(e);
				}
				let t = e.play?.();
				t && typeof t.catch == "function" && t.catch(() => {});
			} catch (e) {
				console.debug?.(e);
			}
		}, p = () => {
			try {
				return typeof performance < "u" && typeof performance.now == "function" ? performance.now() : Date.now();
			} catch {
				return Date.now();
			}
		}, m = (e, { force: t = !1 } = {}) => {
			if (!s) try {
				let i = Number(e?.currentTime) || 0, a = e?.paused === !1, c = p(), l = Math.max(0, Number(r) || 0), d = t || !a || !u || c - u >= l, f = !1;
				for (let t of o) if (!(!t || t === e)) try {
					Math.abs((Number(t.currentTime) || 0) - i) > n && d && (s = !0, t.currentTime = i, s = !1, f = !0);
				} catch {
					s = !1;
				}
				a && f && (u = c);
			} catch {
				s = !1;
			}
		}, h = () => {
			let t = l.source || e;
			if (l.rafId = null, l.rvfcId = null, !(!t || i.signal.aborted || t.paused)) {
				m(t);
				try {
					if (typeof t?.requestVideoFrameCallback == "function") {
						l.rvfcId = t.requestVideoFrameCallback(h);
						return;
					}
				} catch (e) {
					console.debug?.(e);
				}
				try {
					typeof requestAnimationFrame == "function" && (l.rafId = requestAnimationFrame(h));
				} catch (e) {
					console.debug?.(e);
				}
			}
		}, g = (t = e) => {
			d(), l.source = t || e, !(!l.source || l.source.paused || i.signal.aborted) && h();
		};
		try {
			i.signal.addEventListener("abort", d, { once: !0 });
		} catch (e) {
			console.debug?.(e);
		}
		let _ = (t = {}) => m(e, t), v = (t, n = e) => {
			if (!s) {
				for (let e of o) if (!(!e || e === n)) try {
					if (t) f(e);
					else {
						try {
							c.add(e);
						} catch (e) {
							console.debug?.(e);
						}
						e.pause?.();
					}
				} catch (e) {
					console.debug?.(e);
				}
			}
		}, y = (t = e) => {
			if (!s) {
				for (let e of o) if (!(!e || e === t)) try {
					e.muted = !!t.muted, e.volume = Number(t.volume) || 0;
				} catch (e) {
					console.debug?.(e);
				}
			}
		}, b = (t = e) => {
			if (!s) {
				for (let e of o) if (!(!e || e === t)) try {
					e.playbackRate = Number(t.playbackRate) || 1;
				} catch (e) {
					console.debug?.(e);
				}
			}
		};
		try {
			for (let e of a) {
				try {
					e.muted = !0;
				} catch (e) {
					console.debug?.(e);
				}
				try {
					e.loop = !1;
				} catch (e) {
					console.debug?.(e);
				}
			}
		} catch (e) {
			console.debug?.(e);
		}
		try {
			y(), b(), _(), e.paused || (v(!0), g(e));
		} catch (e) {
			console.debug?.(e);
		}
		e.addEventListener("play", () => v(!0), {
			signal: i.signal,
			passive: !0
		}), e.addEventListener("play", () => g(e), {
			signal: i.signal,
			passive: !0
		}), e.addEventListener("pause", () => {
			d(), v(!1);
		}, {
			signal: i.signal,
			passive: !0
		}), e.addEventListener("timeupdate", () => _(), {
			signal: i.signal,
			passive: !0
		}), e.addEventListener("seeking", () => _({ force: !0 }), {
			signal: i.signal,
			passive: !0
		}), e.addEventListener("seeked", () => _({ force: !0 }), {
			signal: i.signal,
			passive: !0
		}), e.addEventListener("ended", () => _({ force: !0 }), {
			signal: i.signal,
			passive: !0
		}), e.addEventListener("volumechange", y, {
			signal: i.signal,
			passive: !0
		}), e.addEventListener("ratechange", b, {
			signal: i.signal,
			passive: !0
		});
		for (let t of a) try {
			t.addEventListener("play", () => {
				if (c.has(t)) {
					c.delete(t), g(e);
					return;
				}
				m(t, { force: !0 }), b(t), v(!0, t), g(t);
			}, {
				signal: i.signal,
				passive: !0
			}), t.addEventListener("pause", () => {
				if (c.has(t)) {
					c.delete(t);
					return;
				}
				t?.ended || (d(), v(!1, t));
			}, {
				signal: i.signal,
				passive: !0
			}), t.addEventListener("seeking", () => m(t, { force: !0 }), {
				signal: i.signal,
				passive: !0
			}), t.addEventListener("seeked", () => m(t, { force: !0 }), {
				signal: i.signal,
				passive: !0
			}), t.addEventListener("ratechange", () => b(t), {
				signal: i.signal,
				passive: !0
			});
		} catch (e) {
			console.debug?.(e);
		}
		try {
			for (let t of a) try {
				t.addEventListener("ended", () => {
					if (!s) {
						try {
							s = !0, t.currentTime = Number(e.currentTime) || 0;
						} catch (e) {
							console.debug?.(e);
						} finally {
							s = !1;
						}
						try {
							e.paused || f(t);
						} catch (e) {
							console.debug?.(e);
						}
					}
				}, {
					signal: i.signal,
					passive: !0
				});
			} catch (e) {
				console.debug?.(e);
			}
		} catch (e) {
			console.debug?.(e);
		}
		try {
			for (let e of a) try {
				e.addEventListener("loadedmetadata", () => _({ force: !0 }), {
					signal: i.signal,
					passive: !0,
					once: !0
				});
			} catch (e) {
				console.debug?.(e);
			}
		} catch (e) {
			console.debug?.(e);
		}
	} catch (e) {
		if (s()) try {
			console.warn("[Viewer] follower video sync setup failed", e);
		} catch (e) {
			console.debug?.(e);
		}
	}
	return i;
}
//#endregion
//#region ui/features/viewer/model3dCore.ts
function l(e, t) {
	if (!(!e || typeof t != "function")) try {
		e.traverse?.((e) => {
			(e?.isMesh || e?.isPoints || e?.isLine) && t(e);
		});
	} catch (e) {
		console.debug?.(e);
	}
}
function u(e) {
	let t = !1;
	try {
		e.traverse?.((e) => {
			!t && e?.isSkinnedMesh && (e.skeleton?.bones?.length ?? 0) > 0 && (t = !0);
		});
	} catch (e) {
		console.debug?.(e);
	}
	return t;
}
function d(e) {
	let t = /* @__PURE__ */ new Map();
	return l(e, (e) => {
		t.set(e.uuid, e.material);
	}), t;
}
function f(e, t, n, r, i) {
	l(t, (t) => {
		try {
			if (n === "original") {
				let e = r?.get(t.uuid);
				e !== void 0 && (t.material = e);
			} else if (n === "normal" && t.isMesh) {
				let n = new e.MeshNormalMaterial({ side: e.DoubleSide });
				i?.add(n), t.material = n;
			} else if (n === "depth" && t.isMesh) {
				let n = new e.MeshDepthMaterial();
				i?.add(n), t.material = n;
			} else if (n === "wireframe" && t.isMesh) {
				let n = new e.MeshBasicMaterial({
					color: 9489145,
					wireframe: !0
				});
				i?.add(n), t.material = n;
			} else if (n === "pointcloud") {
				let n = !!t.geometry?.getAttribute?.("color"), r = new e.PointsMaterial({
					size: .012,
					sizeAttenuation: !0,
					vertexColors: n,
					color: n ? 16777215 : 9489145
				});
				i?.add(r), t.material = r;
			}
		} catch (e) {
			console.debug?.(e);
		}
	});
}
function p(e) {
	if (e) {
		for (let t of e) try {
			t?.dispose?.();
		} catch (e) {
			console.debug?.(e);
		}
		e.clear();
	}
}
function m(e, t) {
	try {
		if (t === "gltf" || t === "fbx") return Array.isArray(e?.animations) ? e.animations : [];
	} catch (e) {
		console.debug?.(e);
	}
	return [];
}
function h(e, t) {
	let n = new e.Box3().setFromObject(t);
	if (n.isEmpty()) return null;
	let r = n.getSize(new e.Vector3()), i = n.getCenter(new e.Vector3()), a = Math.max(r.x, r.y, r.z, .01);
	return {
		box: n,
		size: r,
		center: i,
		maxDim: a,
		radius: Math.max(a * .72, .5)
	};
}
function g(e, t, n, r) {
	if (!r || !t || !n) return;
	let i = t.fov * (Math.PI / 180), a = r.maxDim / (2 * Math.tan(i / 2)) * 1.55, o = new e.Vector3(1, .8, 1).normalize();
	t.position.copy(r.center).addScaledVector(o, a), t.near = Math.max(.01, a / 250), t.far = Math.max(1e3, a * 60), t.updateProjectionMatrix(), n.target.copy(r.center), n.minDistance = Math.max(.01, a / 25), n.maxDistance = Math.max(10, a * 12), n.minZoom = .25, n.maxZoom = 12, n.update();
}
function _(e, t, n, r) {
	if (!n || !e || !t) return null;
	let i = Math.max(1e-4, Number(r) || 1), a = Math.max(n.maxDim * 1.9, 2), o = a * i;
	return e.left = -o / 2, e.right = o / 2, e.top = a / 2, e.bottom = -a / 2, e.near = -Math.max(1e3, n.maxDim * 40), e.far = Math.max(1e3, n.maxDim * 40), e.zoom = 1, e.position.copy(n.center).add({
		x: n.radius * 2.1,
		y: n.radius * 1.6,
		z: n.radius * 2.1
	}), e.updateProjectionMatrix(), t.target.copy(n.center), t.minZoom = .25, t.maxZoom = 12, t.minDistance = 0, t.maxDistance = Math.max(10, n.maxDim * 12), t.update(), a;
}
function v(e, t, n) {
	if (!n) return null;
	if (t === "gltf") return n.scene || null;
	if (t === "obj" || t === "fbx") return n;
	if (t === "stl" || t === "ply") {
		let r = n;
		if (r?.computeVertexNormals) try {
			r.computeVertexNormals();
		} catch (e) {
			console.debug?.(e);
		}
		let i = !!r?.getAttribute?.("normal"), a = !!r?.getAttribute?.("color");
		return t === "ply" && !i ? new e.Points(r, new e.PointsMaterial({
			size: .02,
			sizeAttenuation: !0,
			vertexColors: a,
			color: a ? 16777215 : 9489145
		})) : new e.Mesh(r, new e.MeshStandardMaterial({
			color: a ? 16777215 : 14212841,
			metalness: .08,
			roughness: .72,
			vertexColors: a
		}));
	}
	return null;
}
//#endregion
//#region ui/features/viewer/model3dLoaders.ts
var y = "/mjr/am/vendor/three", b = null;
function ee(e, t, n) {
	switch (t) {
		case "gltf": return new e.GLTFLoader(n);
		case "obj": return new e.OBJLoader(n);
		case "fbx": return new e.FBXLoader(n);
		case "stl": return new e.STLLoader(n);
		case "ply": return new e.PLYLoader(n);
		default: return null;
	}
}
function x(e, t, n) {
	return new Promise((t, r) => {
		if (!e || !n) {
			r(/* @__PURE__ */ Error("Missing loader or URL"));
			return;
		}
		if (typeof e.loadAsync == "function") {
			e.loadAsync(n).then(t).catch(r);
			return;
		}
		e.load(n, t, void 0, r);
	});
}
function te() {
	return b || (b = Promise.all([
		import(
			/* @vite-ignore */
			`${y}/three.module.js`
),
		import(
			/* @vite-ignore */
			`${y}/addons/controls/OrbitControls.js`
),
		import(
			/* @vite-ignore */
			`${y}/addons/loaders/GLTFLoader.js`
),
		import(
			/* @vite-ignore */
			`${y}/addons/loaders/FBXLoader.js`
),
		import(
			/* @vite-ignore */
			`${y}/addons/loaders/OBJLoader.js`
),
		import(
			/* @vite-ignore */
			`${y}/addons/loaders/MTLLoader.js`
),
		import(
			/* @vite-ignore */
			`${y}/addons/loaders/STLLoader.js`
),
		import(
			/* @vite-ignore */
			`${y}/addons/loaders/PLYLoader.js`
)
	]).then(([e, t, n, r, i, a, o, s]) => ({
		THREE: e,
		OrbitControls: t.OrbitControls,
		GLTFLoader: n.GLTFLoader,
		FBXLoader: r.FBXLoader,
		OBJLoader: i.OBJLoader,
		MTLLoader: a.MTLLoader,
		STLLoader: o.STLLoader,
		PLYLoader: s.PLYLoader
	})), b);
}
//#endregion
//#region ui/features/viewer/processorUtils.ts
function S(e, t, n) {
	try {
		let r = Number(e) || 0, i = (Number(t) || 0) * (Number(n) || 0);
		return !(i > 0) || !(r > 0) || i <= r ? 1 : Math.max(.05, Math.min(1, Math.sqrt(r / i)));
	} catch {
		return 1;
	}
}
//#endregion
//#region ui/features/viewer/imageProcessor.ts
function C(e, t, n) {
	if (!e) return;
	try {
		e.width > 1 && e.height > 1 || (e.width = 960, e.height = 540);
	} catch (e) {
		console.debug?.(e);
	}
	let r = (() => {
		try {
			return e.getContext?.("2d");
		} catch {
			return null;
		}
	})();
	if (r) {
		try {
			r.save();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			r.fillStyle = "rgba(0,0,0,0.85)", r.fillRect(0, 0, e.width, e.height);
		} catch (e) {
			console.debug?.(e);
		}
		try {
			r.fillStyle = "rgba(255, 120, 120, 0.95)", r.font = "14px system-ui, -apple-system, Segoe UI, Roboto, sans-serif", r.textBaseline = "top";
			let e = t ? String(t) : "Failed to load media";
			r.fillText(e, 14, 14), r.fillStyle = "rgba(255,255,255,0.7)";
			let i = n == null ? "Check file permissions / path, or try re-indexing." : String(n);
			r.fillText(i, 14, 34);
		} catch (e) {
			console.debug?.(e);
		}
		try {
			r.restore();
		} catch (e) {
			console.debug?.(e);
		}
	}
}
function w({ canvas: e, url: t, getGradeParams: n, isDefaultGrade: r, _tonemap: i, maxProcPixels: a, onReady: s } = {}) {
	let c = new Image();
	try {
		c.decoding = "async";
	} catch (e) {
		console.debug?.(e);
	}
	try {
		c.crossOrigin = "anonymous";
	} catch (e) {
		console.debug?.(e);
	}
	let l = (() => {
		try {
			return e.getContext("2d", { willReadFrequently: !0 });
		} catch {
			return null;
		}
	})(), u = document.createElement("canvas"), d = (() => {
		try {
			return u.getContext("2d", { willReadFrequently: !0 });
		} catch {
			return null;
		}
	})(), f = {
		jobId: 0,
		lastParams: null,
		ready: !1,
		_destroyed: !1,
		_rafId: null,
		_connectRAF: null,
		_connectTries: 0,
		_pendingParams: null,
		_buffer: null
	}, p = () => {
		if (!f._destroyed) {
			try {
				if (e?.isConnected) {
					f._connectRAF = null, f._connectTries = 0;
					let e = f._pendingParams;
					f._pendingParams = null, e && v(e);
					return;
				}
			} catch (e) {
				console.debug?.(e);
			}
			if (f._connectRAF == null) {
				if (f._connectTries = (Number(f._connectTries) || 0) + 1, f._connectTries > 20) {
					f._connectRAF = null, f._connectTries = 0, f._pendingParams = null;
					return;
				}
				try {
					f._connectRAF = requestAnimationFrame(() => {
						f._connectRAF = null, p();
					});
				} catch {
					f._connectRAF = null;
				}
			}
		}
	}, m = (e, t) => S(a, e, t), h = () => {
		if (f.srcData) return f.srcData;
		if (!d || !f.ready) return null;
		try {
			let e = u.width, t = u.height;
			return e > 0 && t > 0 ? (f.srcData = d.getImageData(0, 0, e, t), f.srcData) : null;
		} catch {
			return null;
		}
	}, g = (e, t) => {
		try {
			let n = Number(e) || 0, r = Number(t) || 0;
			if (!(f.naturalW > 0 && f.naturalH > 0)) return null;
			let i = Math.max(0, Math.min(u.width - 1, Math.floor(n * f.scale))), a = Math.max(0, Math.min(u.height - 1, Math.floor(r * f.scale))), o = h();
			if (!o?.data) return null;
			let s = (a * u.width + i) * 4, c = o.data[s] ?? 0, l = o.data[s + 1] ?? 0, d = o.data[s + 2] ?? 0, p = o.data[s + 3] ?? 255, m = [
				c / 255,
				l / 255,
				d / 255,
				p / 255
			], g = 2 ** (Number(f.lastParams?.exposureEV) || 0);
			return {
				r: c,
				g: l,
				b: d,
				a: p,
				raw: m,
				lin: [
					m[0] * g,
					m[1] * g,
					m[2] * g,
					m[3]
				],
				scale: f.scale
			};
		} catch {
			return null;
		}
	}, _ = (t, i) => {
		if (!l || f._destroyed) return;
		if (!e?.isConnected) {
			try {
				f._pendingParams = i || f.lastParams || n?.() || null;
			} catch (e) {
				console.debug?.(e);
			}
			p();
			return;
		}
		if (t !== f.jobId) return;
		let a = h();
		if (!a?.data) return;
		let s = u.width, c = u.height;
		if (!(s > 0 && c > 0)) return;
		try {
			let t = i || n?.() || {};
			if (typeof r == "function" && r(t)) {
				l.clearRect(0, 0, e.width, e.height), l.drawImage(u, 0, 0);
				return;
			}
		} catch (e) {
			console.debug?.(e);
		}
		let d = f._buffer;
		if (!d || d.width !== s || d.height !== c) try {
			d = l.createImageData(s, c), f._buffer = d;
		} catch {
			try {
				d = new ImageData(s, c), f._buffer = d;
			} catch {
				return;
			}
		}
		if (!d) return;
		let m = i || n?.() || {}, g = Number(m.exposureEV) || 0, _ = 1 / Math.max(.1, Math.min(3, Number(m.gamma) || 1)), v = String(m.channel || "rgb"), y = String(m.analysisMode || "none"), b = o(m.zebraThreshold ?? .95), ee = 2 ** g, x = new Float32Array(256);
		for (let e = 0; e < 256; e++) x[e] = (e / 255) ** _;
		let te = d.data, S = a.data, C = s * c * 4, w = 0, ne = () => {
			if (f._destroyed || !e?.isConnected || t !== f.jobId) return;
			let n = Math.min(C, w + 22e4);
			for (; w < n; w += 4) {
				let e = (S[w] ?? 0) / 255, t = (S[w + 1] ?? 0) / 255, n = (S[w + 2] ?? 0) / 255, r = (S[w + 3] ?? 255) / 255, i = e * ee, a = t * ee, c = n * ee, l = .2126 * i + .7152 * a + .0722 * c;
				if (y === "zebra") if (o(l) >= b) {
					let e = (Math.floor(w / 4) % s + Math.floor(w / 4 / s) & 7) < 3;
					i = +!!e, a = +!!e, c = +!!e;
				} else i = x[o(i) * 255 + .5 | 0], a = x[o(a) * 255 + .5 | 0], c = x[o(c) * 255 + .5 | 0];
				else i = x[o(i) * 255 + .5 | 0], a = x[o(a) * 255 + .5 | 0], c = x[o(c) * 255 + .5 | 0];
				if (v === "r") a = i, c = i;
				else if (v === "g") i = a, c = a;
				else if (v === "b") i = c, a = c;
				else if (v === "a") i = r, a = r, c = r;
				else if (v === "l") {
					let e = x[o(l) * 255 + .5 | 0];
					i = e, a = e, c = e;
				}
				te[w] = Math.round(o(i) * 255), te[w + 1] = Math.round(o(a) * 255), te[w + 2] = Math.round(o(c) * 255), te[w + 3] = 255;
			}
			if (w < C) {
				try {
					f._rafId = requestAnimationFrame(ne);
				} catch (e) {
					console.debug?.(e);
				}
				return;
			}
			try {
				l.putImageData(d, 0, 0);
			} catch (e) {
				console.debug?.(e);
			}
		};
		try {
			f._rafId = requestAnimationFrame(ne);
		} catch (e) {
			console.debug?.(e);
		}
	}, v = (t) => {
		if (f._destroyed) return;
		if (f.lastParams = t || f.lastParams || n?.() || null, !e?.isConnected) {
			try {
				f._pendingParams = f.lastParams;
			} catch (e) {
				console.debug?.(e);
			}
			p();
			return;
		}
		f.jobId++;
		let r = f.jobId;
		try {
			_(r, f.lastParams);
		} catch (e) {
			console.debug?.(e);
		}
	}, y = () => {
		if (!f._destroyed) try {
			if (f.naturalW = Number(c.naturalWidth) || 0, f.naturalH = Number(c.naturalHeight) || 0, !(f.naturalW > 0 && f.naturalH > 0)) return;
			f.scale = m(f.naturalW, f.naturalH);
			let t = Math.max(1, Math.round(f.naturalW * f.scale)), r = Math.max(1, Math.round(f.naturalH * f.scale));
			u.width = t, u.height = r, e.width = t, e.height = r, e._mjrNaturalW = f.naturalW, e._mjrNaturalH = f.naturalH, e._mjrPixelScale = f.scale;
			try {
				d?.clearRect(0, 0, t, r), d?.drawImage(c, 0, 0, t, r);
			} catch (e) {
				console.debug?.(e);
			}
			f.ready = !0, f.srcData = null, h(), v(f.lastParams || n?.());
		} finally {
			try {
				s?.({
					naturalW: f.naturalW,
					naturalH: f.naturalH,
					pixelScale: f.scale
				});
			} catch (e) {
				console.debug?.(e);
			}
		}
	}, b = () => {
		f.ready = !1;
		try {
			C(e, "Failed to load image");
		} catch (e) {
			console.debug?.(e);
		}
	};
	try {
		c.onload = y, c.onerror = b;
	} catch (e) {
		console.debug?.(e);
	}
	try {
		c.src = t;
	} catch (e) {
		console.debug?.(e);
	}
	return {
		setParams: v,
		sampleAtOriginal: g,
		getInfo: () => ({ ...f }),
		destroy: () => {
			f._destroyed = !0;
			try {
				f.jobId++;
			} catch (e) {
				console.debug?.(e);
			}
			try {
				f._rafId != null && cancelAnimationFrame(f._rafId);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				f._connectRAF != null && cancelAnimationFrame(f._connectRAF);
			} catch (e) {
				console.debug?.(e);
			}
			f._connectRAF = null, f._connectTries = 0, f._pendingParams = null;
			try {
				c.onload = null, c.onerror = null;
			} catch (e) {
				console.debug?.(e);
			}
			try {
				c.src = "";
			} catch (e) {
				console.debug?.(e);
			}
			try {
				u.width = 0, u.height = 0;
			} catch (e) {
				console.debug?.(e);
			}
			try {
				e.width = 0, e.height = 0;
			} catch (e) {
				console.debug?.(e);
			}
			f.srcData = null, f._buffer = null;
		}
	};
}
//#endregion
//#region ui/features/viewer/model3dSupport.ts
var ne = [
	.25,
	.5,
	1,
	1.5,
	2
], re = 44;
function T(e, { preventDefault: t = !1, immediate: n = !1 } = {}) {
	if (e) {
		try {
			t && e.preventDefault?.();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			e.stopPropagation?.(), n && e.stopImmediatePropagation?.();
		} catch (e) {
			console.debug?.(e);
		}
	}
}
function E(e) {
	let t = Math.max(0, Number(e) || 0), n = Math.floor(t / 60), r = Math.floor(t % 60);
	return n > 0 ? `${n}:${String(r).padStart(2, "0")}` : `${Math.floor(t)}s`;
}
function ie(e, n) {
	let r = document.createElement("button");
	return r.type = "button", r.textContent = String(e || ""), r.title = String(n || e || ""), r.setAttribute("aria-label", String(n || e || t("model3d.viewportAction", "3D viewport action"))), r.style.cssText = [
		"height:28px",
		"padding:0 10px",
		"border-radius:999px",
		"border:1px solid rgba(255,255,255,0.16)",
		"background:rgba(13,15,20,0.78)",
		"color:rgba(255,255,255,0.92)",
		"font:600 11px system-ui,sans-serif",
		"letter-spacing:0.02em",
		"cursor:pointer",
		"backdrop-filter:blur(8px)",
		"display:inline-flex",
		"align-items:center",
		"justify-content:center",
		"box-shadow:0 4px 18px rgba(0,0,0,0.24)"
	].join(";"), r;
}
function D(e, t) {
	if (!e) return;
	let n = !!t;
	e.dataset.active = n ? "1" : "0", e.style.background = n ? "rgba(76,175,80,0.18)" : "rgba(13,15,20,0.78)", e.style.borderColor = n ? "rgba(76,175,80,0.42)" : "rgba(255,255,255,0.16)", e.style.color = n ? "rgba(230,255,235,0.96)" : "rgba(255,255,255,0.92)";
}
function O(e, n, r = "", i = "#4CAF50") {
	if (!e) return;
	try {
		let t = Math.max(480, Number(e.width) || 960), n = Math.max(270, Number(e.height) || 540);
		e.width = t, e.height = n;
	} catch (e) {
		console.debug?.(e);
	}
	let a = (() => {
		try {
			return e.getContext("2d");
		} catch {
			return null;
		}
	})();
	if (!a) return;
	let o = Number(e.width) || 960, s = Number(e.height) || 540, c = o / 2, l = s / 2;
	try {
		let e = a.createLinearGradient(0, 0, o, s);
		e.addColorStop(0, "#0f1419"), e.addColorStop(1, "#11181f"), a.fillStyle = e, a.fillRect(0, 0, o, s), a.save(), a.translate(c, l - 32), a.strokeStyle = i, a.lineWidth = 3, a.globalAlpha = .95, a.beginPath(), a.moveTo(0, -44), a.lineTo(42, -22), a.lineTo(42, 22), a.lineTo(0, 44), a.lineTo(-42, 22), a.lineTo(-42, -22), a.closePath(), a.stroke(), a.beginPath(), a.moveTo(0, -44), a.lineTo(0, 0), a.lineTo(42, 22), a.moveTo(0, 0), a.lineTo(-42, 22), a.moveTo(-42, -22), a.lineTo(0, 0), a.moveTo(42, -22), a.lineTo(0, 0), a.stroke(), a.restore(), a.fillStyle = "rgba(255,255,255,0.94)", a.font = "600 18px system-ui, sans-serif", a.textAlign = "center", a.textBaseline = "middle", a.fillText(String(n || t("model3d.preview", "3D preview")), c, l + 44), r && (a.fillStyle = "rgba(255,255,255,0.62)", a.font = "13px system-ui, sans-serif", a.fillText(String(r), c, l + 72));
	} catch (i) {
		console.debug?.(i);
		try {
			C(e, n, r || t("model3d.unavailable", "3D viewer unavailable"));
		} catch (e) {
			console.debug?.(e);
		}
	}
}
function ae({ defaultBgColor: e, defaultFov: n, defaultLightIntensity: r, hasSkeleton: i } = {}) {
	let a = document.createElement("div");
	a.className = "mjr-model3d-settings", a.style.cssText = [
		"position:absolute",
		"right:0",
		"top:44px",
		"width:210px",
		"max-height:calc(100% - 100px)",
		"overflow-y:auto",
		"background:rgba(14,18,26,0.96)",
		"border:1px solid rgba(255,255,255,0.10)",
		"border-right:none",
		"border-radius:10px 0 0 10px",
		"padding:10px 10px 12px 10px",
		"z-index:4",
		"display:none",
		"box-shadow:-6px 4px 24px rgba(0,0,0,0.5)",
		"backdrop-filter:blur(12px)",
		"font:13px system-ui,sans-serif",
		"color:rgba(255,255,255,0.88)",
		"scrollbar-width:thin"
	].join(";"), [
		"pointerdown",
		"pointermove",
		"pointerup",
		"mousedown",
		"mousemove",
		"mouseup",
		"wheel",
		"click",
		"contextmenu",
		"dragstart",
		"dragover",
		"drop"
	].forEach((e) => {
		a.addEventListener(e, (e) => T(e, { preventDefault: !1 }));
	});
	let o = (e) => {
		let t = document.createElement("div");
		t.style.cssText = [
			"font:700 10px system-ui,sans-serif",
			"letter-spacing:0.08em",
			"color:rgba(255,255,255,0.40)",
			"text-transform:uppercase",
			"margin:10px 0 6px 0"
		].join(";"), t.textContent = e, a.appendChild(t);
		let n = document.createElement("div");
		n.style.cssText = "height:1px;background:rgba(255,255,255,0.07);margin-bottom:8px;", a.appendChild(n);
	}, s = (e, t) => {
		let n = document.createElement("div");
		n.style.cssText = "display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:6px;";
		let r = document.createElement("span");
		return r.style.cssText = "font:500 11px system-ui,sans-serif;color:rgba(255,255,255,0.65);white-space:nowrap;flex-shrink:0;", r.textContent = e, n.appendChild(r), n.appendChild(t), a.appendChild(n), n;
	}, c = (e, t) => {
		let n = document.createElement("select");
		n.style.cssText = [
			"background:rgba(25,30,42,0.95)",
			"color:rgba(255,255,255,0.88)",
			"border:1px solid rgba(255,255,255,0.14)",
			"border-radius:6px",
			"padding:3px 5px",
			"font:11px system-ui,sans-serif",
			"cursor:pointer",
			"flex:1",
			"min-width:0"
		].join(";");
		for (let [r, i] of e) {
			let e = document.createElement("option");
			e.value = r, e.textContent = i, r === t && (e.selected = !0), n.appendChild(e);
		}
		return n;
	}, l = (e, t, n, r) => {
		let i = document.createElement("div");
		i.style.cssText = "display:flex;align-items:center;gap:5px;flex:1;";
		let a = document.createElement("input");
		a.type = "range", a.min = String(e), a.max = String(t), a.step = String(n), a.value = String(r), a.style.cssText = "flex:1;cursor:pointer;accent-color:#4CAF50;height:3px;";
		let o = document.createElement("span");
		return o.style.cssText = "font:11px system-ui,sans-serif;color:rgba(255,255,255,0.45);min-width:26px;text-align:right;", o.textContent = String(r), a.addEventListener("input", () => {
			o.textContent = a.value;
		}), i.appendChild(a), i.appendChild(o), {
			wrap: i,
			slider: a,
			valLbl: o
		};
	};
	o("Scene");
	let u = document.createElement("input");
	u.type = "color", u.value = e || "#282828", u.style.cssText = "width:34px;height:24px;cursor:pointer;border:1px solid rgba(255,255,255,0.18);border-radius:4px;padding:1px;background:none;flex-shrink:0;", s(t("model3d.background", "Background"), u), o("Model");
	let d = c([
		["original", "Original"],
		["normal", "Normal map"],
		["depth", "Depth"],
		["wireframe", "Wireframe"],
		["pointcloud", "Point cloud"]
	], "original");
	s(t("model3d.material", "Material"), d);
	let f = c([
		["original", "Original"],
		["+y", "+Y (default)"],
		["-y", "-Y"],
		["+z", "+Z (CAD)"],
		["-z", "-Z"],
		["+x", "+X"],
		["-x", "-X"]
	], "original");
	s("Up", f);
	let p = null, m = null;
	i && (m = document.createElement("input"), m.type = "checkbox", m.checked = !1, m.style.cssText = "cursor:pointer;accent-color:#4CAF50;flex-shrink:0;", p = s(t("model3d.skeleton", "Skeleton"), m)), o("Camera");
	let h = l(15, 120, 1, n ?? 75);
	s("FOV", h.wrap), o(t("model3d.lights", "Lights"));
	let g = l(0, 5, .1, r ?? 1);
	return s(t("model3d.intensity", "Intensity"), g.wrap), {
		panel: a,
		bgInput: u,
		materialSel: d,
		upSel: f,
		skeletonToggle: m,
		skeletonRow: p,
		fovSlider: h.slider,
		fovValLbl: h.valLbl,
		lightSlider: g.slider,
		lightValLbl: g.valLbl
	};
}
function oe() {
	let e = document.createElement("div");
	e.className = "mjr-model3d-anim-bar", e.style.cssText = [
		"position:absolute",
		"bottom:0",
		"left:0",
		"right:0",
		`height:${re}px`,
		"display:none",
		"align-items:center",
		"gap:7px",
		"padding:0 10px",
		"background:rgba(10,13,20,0.90)",
		"backdrop-filter:blur(10px)",
		"border-top:1px solid rgba(255,255,255,0.07)",
		"z-index:3"
	].join(";"), [
		"pointerdown",
		"pointermove",
		"pointerup",
		"mousedown",
		"mousemove",
		"mouseup",
		"wheel",
		"click"
	].forEach((t) => {
		e.addEventListener(t, (e) => T(e, { preventDefault: !1 }));
	});
	let n = document.createElement("button");
	n.type = "button", n.textContent = t("model3d.play", "Play"), n.title = t("model3d.playPause", "Play / Pause"), n.style.cssText = [
		"width:28px",
		"height:28px",
		"border-radius:50%",
		"border:1px solid rgba(255,255,255,0.18)",
		"background:rgba(76,175,80,0.14)",
		"color:rgba(255,255,255,0.92)",
		"font:600 12px system-ui,sans-serif",
		"cursor:pointer",
		"flex-shrink:0",
		"padding:0",
		"line-height:1",
		"display:flex",
		"align-items:center",
		"justify-content:center"
	].join(";");
	let r = document.createElement("select");
	r.title = t("model3d.playbackSpeed", "Playback speed"), r.style.cssText = [
		"background:rgba(20,24,34,0.9)",
		"color:rgba(255,255,255,0.8)",
		"border:1px solid rgba(255,255,255,0.14)",
		"border-radius:6px",
		"padding:3px 4px",
		"font:11px system-ui,sans-serif",
		"cursor:pointer",
		"width:52px",
		"flex-shrink:0"
	].join(";");
	for (let e of ne) {
		let t = document.createElement("option");
		t.value = String(e), t.textContent = `${e}x`, e === 1 && (t.selected = !0), r.appendChild(t);
	}
	let i = document.createElement("select");
	i.title = "Animation clip", i.style.cssText = [
		"background:rgba(20,24,34,0.9)",
		"color:rgba(255,255,255,0.8)",
		"border:1px solid rgba(255,255,255,0.14)",
		"border-radius:6px",
		"padding:3px 5px",
		"font:11px system-ui,sans-serif",
		"cursor:pointer",
		"max-width:130px",
		"flex-shrink:1",
		"min-width:0"
	].join(";");
	let a = document.createElement("input");
	a.type = "range", a.min = "0", a.max = "1000", a.value = "0", a.style.cssText = "flex:1;min-width:50px;cursor:pointer;accent-color:#4CAF50;height:3px;";
	let o = document.createElement("span");
	return o.style.cssText = [
		"font:500 11px system-ui,sans-serif",
		"color:rgba(255,255,255,0.45)",
		"white-space:nowrap",
		"flex-shrink:0"
	].join(";"), o.textContent = "0s / 0s", e.appendChild(n), e.appendChild(r), e.appendChild(i), e.appendChild(a), e.appendChild(o), {
		bar: e,
		playBtn: n,
		speedSel: r,
		animSel: i,
		progressSlider: a,
		timeLbl: o
	};
}
//#endregion
//#region ui/features/viewer/model3dRenderer.impl.ts
var k = Object.freeze({
	".gltf": "gltf",
	".glb": "gltf",
	".obj": "obj",
	".fbx": "fbx",
	".stl": "stl",
	".ply": "ply",
	".splat": "splat",
	".ksplat": "splat",
	".spz": "splat"
}), A = new Set(Object.keys(k)), se = new Set([
	"gltf",
	"obj",
	"fbx",
	"stl",
	"ply"
]), ce = "#282828", le = t("model3d.controlHint", "Rotate: left drag  Pan: right drag  Zoom: wheel"), j = Object.freeze({
	PERSPECTIVE: "perspective",
	ORTHOGRAPHIC: "orthographic"
});
Object.freeze({
	ORIGINAL: "original",
	NORMAL: "normal",
	DEPTH: "depth",
	WIREFRAME: "wireframe",
	POINTCLOUD: "pointcloud"
});
var ue = Object.freeze({
	original: [
		0,
		0,
		0
	],
	"+y": [
		0,
		0,
		0
	],
	"-y": [
		Math.PI,
		0,
		0
	],
	"+z": [
		-Math.PI / 2,
		0,
		0
	],
	"-z": [
		Math.PI / 2,
		0,
		0
	],
	"+x": [
		0,
		0,
		Math.PI / 2
	],
	"-x": [
		0,
		0,
		-Math.PI / 2
	]
}), de = 75, fe = 1, M = Object.freeze({
	ambient: .5,
	main: .8,
	fill: .3,
	back: .3,
	rim: .3,
	bottom: .2
});
function pe(e) {
	try {
		let t = String(e?.ext || "").trim().toLowerCase();
		if (t) return t.startsWith(".") ? t : `.${t}`;
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let t = String(e?.filename || e?.filepath || e?.path || "").trim(), n = t.lastIndexOf(".");
		return n >= 0 ? t.slice(n).toLowerCase() : "";
	} catch (e) {
		console.debug?.(e);
	}
	return "";
}
function me(e) {
	let t = String(e || "").trim();
	return t ? t.startsWith("/") || /^[a-z][\w+\-.]*:/i.test(t) : !1;
}
function N(e) {
	return String(e?.loader || e?.viewer_info?.loader || "").trim().toLowerCase() || k[pe(e)] || "";
}
function P(e) {
	return String(e?.kind || "").toLowerCase() === "model3d" ? !0 : A.has(pe(e));
}
function he(e) {
	return N(e) || "gltf";
}
function F() {
	return le;
}
function ge(e) {
	try {
		if (e?.classList?.contains?.("mjr-model3d-render-canvas")) return e;
	} catch (e) {
		console.debug?.(e);
	}
	try {
		return e?.querySelector?.(".mjr-model3d-render-canvas") || null;
	} catch {
		return null;
	}
}
function I(e) {
	try {
		return !!e?.closest?.(".mjr-model3d-host, .mjr-viewer-model3d-host, .mjr-mfv-model3d-host");
	} catch {
		return !1;
	}
}
function _e(e, t) {
	let n = t || {
		ROTATE: 0,
		DOLLY: 1,
		PAN: 2
	};
	return {
		LEFT: n.ROTATE,
		MIDDLE: n.DOLLY,
		RIGHT: n.PAN
	};
}
function L(e, a, o = {}) {
	let s = o?.pauseDuringExecution == null ? !!n?.VIEWER_PAUSE_DURING_EXECUTION : !!o.pauseDuringExecution, c = document.createElement("div");
	c.className = o.hostClassName || "mjr-model3d-host mjr-viewer-model3d-host", c.style.cssText = o.hostStyle || [
		"width:100%",
		"height:100%",
		"display:flex",
		"align-items:stretch",
		"justify-content:stretch",
		"position:relative",
		"overflow:hidden",
		"border-radius:12px",
		"background:radial-gradient(circle at top, rgba(76,175,80,0.10), rgba(0,0,0,0) 42%), linear-gradient(180deg, rgba(40,40,40,0.98), rgba(19,22,28,0.99))",
		"box-shadow:inset 0 0 0 1px rgba(255,255,255,0.06)"
	].join(";"), c.setAttribute("data-capture-wheel", "true"), c.tabIndex = -1;
	let l = document.createElement("canvas");
	l.className = o.canvasClassName || "mjr-viewer-media mjr-model3d-render-canvas", l.style.cssText = o.canvasStyle || [
		"display:block",
		"width:100%",
		"height:100%",
		"max-width:100%",
		"max-height:100%",
		"outline:none",
		"touch-action:none"
	].join(";"), l.tabIndex = 0, l._mjrDisableViewerTransform = o.disableViewerTransform !== !1;
	try {
		e?.id != null && (l.dataset.mjrAssetId = String(e.id));
	} catch (e) {
		console.debug?.(e);
	}
	c.appendChild(l);
	let y = document.createElement("canvas");
	y.className = "mjr-model3d-status", y.style.cssText = [
		"position:absolute",
		"inset:0",
		"display:block",
		"width:100%",
		"height:100%",
		"pointer-events:none",
		"z-index:1"
	].join(";"), c.appendChild(y);
	let b = pe(e).replace(".", "").toUpperCase();
	if (b) {
		let e = document.createElement("div");
		e.className = "mjr-model3d-badge", e.textContent = b, e.style.cssText = [
			"position:absolute",
			"top:10px",
			"left:10px",
			"padding:4px 8px",
			"border-radius:999px",
			"font:700 10px system-ui,sans-serif",
			"letter-spacing:0.08em",
			"color:#fff",
			"background:rgba(76,175,80,0.9)",
			"pointer-events:none",
			"z-index:2"
		].join(";"), c.appendChild(e);
	}
	let S = document.createElement("div");
	S.className = "mjr-model3d-toolbar", S.style.cssText = [
		"position:absolute",
		"top:10px",
		"right:10px",
		"display:flex",
		"align-items:center",
		"gap:6px",
		"flex-wrap:wrap",
		"pointer-events:none",
		"z-index:5"
	].join(";");
	let C = document.createElement("div");
	C.style.cssText = "display:flex;align-items:center;gap:6px;flex-wrap:wrap;pointer-events:auto;";
	let w = ie(t("model3d.reset", "Reset"), t("model3d.resetView", "Reset 3D view")), ne = ie(t("model3d.grid", "Grid"), t("model3d.toggleGrid", "Toggle grid")), re = ie(t("model3d.persp", "Persp"), t("model3d.switchCamera", "Switch perspective / orthographic")), k = ie(t("model3d.settings", "Settings"), t("model3d.settings", "Settings"));
	C.append(w, ne, re, k), S.appendChild(C), c.appendChild(S);
	let A = document.createElement("div");
	A.className = "mjr-model3d-hint", A.textContent = o.hintText || le, A.style.cssText = [
		"position:absolute",
		"right:10px",
		"bottom:10px",
		"padding:5px 10px",
		"border-radius:999px",
		"font:500 11px system-ui,sans-serif",
		"color:rgba(255,255,255,0.75)",
		"background:rgba(0,0,0,0.35)",
		"backdrop-filter:blur(6px)",
		"pointer-events:none",
		"z-index:2",
		"transition:bottom 0.2s"
	].join(";"), c.appendChild(A);
	let N = ae({
		defaultBgColor: ce,
		defaultFov: de,
		defaultLightIntensity: fe,
		hasSkeleton: !1
	});
	c.appendChild(N.panel);
	let P = oe();
	c.appendChild(P.bar);
	let F = !1, ge = null, I = null, L = null, R = null, z = null, B = null, V = null, H = null, U = null, ve = null, ye = !1, be = null, xe = null, W = null, G = null, Se = null, K = null, Ce = 0, q = j.PERSPECTIVE, we = /* @__PURE__ */ new Map(), Te = /* @__PURE__ */ new Set(), J = null, Ee = !1, De = null, Oe = [], Y = fe, X = null, ke = null, Z = [], Q = [], $ = 0, Ae = 1, je = !1, Me = !1, Ne = !1, Pe = String(e?.filename || "3D model"), Fe = () => {
		try {
			o.scheduleOverlayRedraw?.();
		} catch (e) {
			console.debug?.(e);
		}
	}, Ie = (e, t = "", n = "#4CAF50") => {
		be = {
			title: e,
			hintText: t,
			accent: n
		}, y.style.display = "block", O(y, e, t, n);
	}, Le = () => {
		be = null, y.style.display = "none";
	}, Re = () => {
		try {
			let e = c.getBoundingClientRect();
			l._mjrNaturalW = Math.max(1, Math.round(e.width || l.width || 1)), l._mjrNaturalH = Math.max(1, Math.round(e.height || l.height || 1));
		} catch (e) {
			console.debug?.(e);
		}
		try {
			be && O(y, be.title, be.hintText, be.accent);
		} catch (e) {
			console.debug?.(e);
		}
	}, ze = (e, t) => {
		if (!V || !(Ce > 0)) return;
		let n = Math.max(1e-4, (Number(e) || 1) / Math.max(1, Number(t) || 1)), r = Ce * n;
		V.left = -r / 2, V.right = r / 2, V.top = Ce / 2, V.bottom = -Ce / 2, V.updateProjectionMatrix();
	}, Be = () => {
		if (!(!G || !H || !K)) {
			if (q === j.ORTHOGRAPHIC) {
				let e = c.getBoundingClientRect();
				Ce = _(V, H, K, Math.max(1e-4, (e.width || 1) / Math.max(1, e.height || 1))) || Ce, z = V;
			} else g(I, B, H, K), z = B;
			try {
				H.object = z, H.update();
			} catch (e) {
				console.debug?.(e);
			}
		}
	}, Ve = (e, { refit: t = !0 } = {}) => {
		q = e === j.ORTHOGRAPHIC ? j.ORTHOGRAPHIC : j.PERSPECTIVE, z = q === j.ORTHOGRAPHIC ? V : B;
		try {
			H && (H.object = z);
		} catch (e) {
			console.debug?.(e);
		}
		if (t) Be();
		else {
			try {
				z?.updateProjectionMatrix?.();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				H?.update?.();
			} catch (e) {
				console.debug?.(e);
			}
		}
		Xe(), Fe();
	}, He = (e) => {
		Y = Math.max(0, Math.min(10, Number(e) || 0));
		try {
			De && (De.intensity = M.ambient * Y);
		} catch (e) {
			console.debug?.(e);
		}
		let t = [
			M.main,
			M.back,
			M.fill,
			M.fill,
			M.bottom
		];
		Oe.forEach((e, n) => {
			try {
				e && (e.intensity = (t[n] ?? M.fill) * Y);
			} catch (e) {
				console.debug?.(e);
			}
		});
	}, Ue = (e) => {
		!Se || !I || (p(Te), f(I, Se, e, we, Te), Fe());
	}, We = (e) => {
		if (!G) return;
		let t = ue[e] || [
			0,
			0,
			0
		];
		try {
			G.rotation.set(t[0], t[1], t[2]), G.updateMatrixWorld(!0);
		} catch (e) {
			console.debug?.(e);
		}
		I && (K = h(I, G)), Be();
	}, Ge = (e) => {
		if (J) try {
			J.visible = !!e;
		} catch (e) {
			console.debug?.(e);
		}
	}, Ke = () => {
		if (!X || Z.length === 0) return;
		let e = Q[$];
		if (!e) return;
		let t = Z[$]?.duration || 0, n = e.time || 0;
		try {
			P.timeLbl.textContent = `${E(n)} / ${E(t)}`;
		} catch (e) {
			console.debug?.(e);
		}
		if (!Me && t > 0) try {
			let e = Number(P.progressSlider.max) || 1e3;
			P.progressSlider.value = String(Math.round(n / t * e));
		} catch (e) {
			console.debug?.(e);
		}
	}, qe = (e) => {
		if (!X || !Z.length) return;
		let n = Z[e];
		if (!n) return;
		Q.forEach((e) => {
			try {
				e?.stop();
			} catch (e) {
				console.debug?.(e);
			}
		});
		let r = X.clipAction(n);
		r.timeScale = Ae, r.clampWhenFinished = !1, r.loop = I?.LoopRepeat ?? 2201, r.play(), Q[e] = r, $ = e, je = !0, P.playBtn.textContent = t("model3d.pause", "Pause");
		try {
			let e = Math.max(100, Math.min(1e4, Math.round((n.duration || 1) * 100)));
			P.progressSlider.max = String(e);
		} catch {}
	}, Je = () => {
		!X || !Z.length || (je ? (X.timeScale = 0, je = !1, P.playBtn.textContent = t("model3d.play", "Play")) : (X.timeScale = Ae, Q[$]?.isRunning?.() ? (je = !0, P.playBtn.textContent = t("model3d.pause", "Pause")) : qe($)));
	}, Ye = (e, t) => {
		!e || e.length === 0 || !I || (Z = e, X = new I.AnimationMixer(t), ke = new I.Clock(), Q = Array(e.length).fill(null), P.animSel.innerHTML = "", e.forEach((e, t) => {
			let n = document.createElement("option");
			n.value = String(t), n.textContent = e.name || `Animation ${t + 1}`, P.animSel.appendChild(n);
		}), P.animSel.style.display = e.length > 1 ? "" : "none", P.bar.style.display = "flex", A.style.bottom = "54px", qe(0), P.playBtn.addEventListener("click", (e) => {
			T(e), Je();
		}), P.speedSel.addEventListener("change", () => {
			Ae = Number(P.speedSel.value) || 1, X.timeScale = je ? Ae : 0;
			let e = Q[$];
			e && (e.timeScale = Ae);
		}), P.animSel.addEventListener("change", () => {
			qe(Number(P.animSel.value) || 0);
		}), P.progressSlider.addEventListener("pointerdown", () => {
			Me = !0;
		}), P.progressSlider.addEventListener("pointerup", () => {
			Me = !1;
			let e = Q[$], t = Z[$];
			if (e && t) {
				let n = Number(P.progressSlider.max) || 1e3, r = Number(P.progressSlider.value) / n * t.duration;
				e.time = Math.max(0, Math.min(r, t.duration));
			}
		}), P.progressSlider.addEventListener("input", () => {
			let e = Q[$], t = Z[$];
			if (e && t && Me) {
				let n = Number(P.progressSlider.max) || 1e3, r = Number(P.progressSlider.value) / n * t.duration;
				e.time = Math.max(0, Math.min(r, t.duration)), P.timeLbl.textContent = `${E(r)} / ${E(t.duration)}`;
			}
		}));
	}, Xe = () => {
		D(ne, !!W?.visible), D(re, q === j.ORTHOGRAPHIC), re.textContent = q === j.ORTHOGRAPHIC ? t("model3d.ortho", "Ortho") : t("model3d.persp", "Persp"), D(k, Ne);
	};
	N.bgInput.addEventListener("input", () => {
		let e = N.bgInput.value;
		try {
			R && (R.background = new (I?.Color || Object)(e));
		} catch (e) {
			console.debug?.(e);
		}
	}), N.materialSel.addEventListener("change", () => {
		Ue(N.materialSel.value);
	}), N.upSel.addEventListener("change", () => {
		We(N.upSel.value);
	}), N.skeletonToggle && N.skeletonToggle.addEventListener("change", () => {
		Ge(N.skeletonToggle.checked);
	}), N.fovSlider.addEventListener("input", () => {
		let e = Math.max(1, Math.min(179, Number(N.fovSlider.value) || de));
		try {
			B && (B.fov = e, B.updateProjectionMatrix());
		} catch (e) {
			console.debug?.(e);
		}
	}), N.lightSlider.addEventListener("input", () => {
		He(Number(N.lightSlider.value));
	});
	let Ze = () => {
		let e = [], t = (t, n, r, i) => {
			t.addEventListener(n, r, i), e.push(() => t.removeEventListener(n, r, i));
		};
		return t(c, "pointerdown", () => {
			try {
				l.focus?.();
			} catch (e) {
				console.debug?.(e);
			}
		}), t(c, "wheel", (e) => T(e)), t(c, "contextmenu", (e) => T(e, { preventDefault: !0 })), t(c, "dragstart", (e) => T(e, { preventDefault: !0 })), t(c, "dragover", (e) => T(e, { preventDefault: !0 })), t(c, "dragleave", (e) => T(e)), t(c, "drop", (e) => T(e, { preventDefault: !0 })), () => {
			for (let t of e) try {
				t();
			} catch (e) {
				console.debug?.(e);
			}
		};
	}, Qe = () => {
		F = !0;
		try {
			window.removeEventListener(i.RUNTIME_STATUS, tt);
		} catch {}
		try {
			c._mjr3D = null;
		} catch {}
		try {
			U != null && cancelAnimationFrame(U);
		} catch (e) {
			console.debug?.(e);
		}
		U = null;
		try {
			xe?.();
		} catch (e) {
			console.debug?.(e);
		}
		xe = null;
		try {
			ge?.disconnect?.();
		} catch (e) {
			console.debug?.(e);
		}
		ge = null;
		try {
			H?.dispose?.();
		} catch (e) {
			console.debug?.(e);
		}
		H = null;
		try {
			X?.stopAllAction?.(), X?.uncacheRoot?.(X.getRoot?.());
		} catch (e) {
			console.debug?.(e);
		}
		try {
			for (let e of Q) try {
				X?.uncacheAction?.(e);
			} catch {}
		} catch (e) {
			console.debug?.(e);
		}
		try {
			for (let e of Z) try {
				e?.dispose?.();
			} catch {}
		} catch (e) {
			console.debug?.(e);
		}
		X = null, Q = [], Z = [], p(Te);
		try {
			J && (R?.remove?.(J), J.dispose?.());
		} catch (e) {
			console.debug?.(e);
		}
		J = null;
		try {
			R?.traverse?.((e) => {
				try {
					e.geometry?.dispose?.();
				} catch {}
				try {
					let t = Array.isArray(e.material) ? e.material : e.material ? [e.material] : [];
					for (let e of t) try {
						if (e) {
							for (let t of Object.keys(e)) try {
								let n = e[t];
								n && typeof n == "object" && typeof n.dispose == "function" && n.isTexture && n.dispose();
							} catch {}
							e.dispose?.();
						}
					} catch {}
				} catch {}
			});
		} catch (e) {
			console.debug?.(e);
		}
		try {
			c._mjrAxisScene &&= (c._mjrAxisScene.traverse?.((e) => {
				try {
					e.geometry?.dispose?.();
				} catch {}
				try {
					e.material?.dispose?.();
				} catch {}
			}), null);
		} catch (e) {
			console.debug?.(e);
		}
		try {
			L?.dispose?.();
		} catch (e) {
			console.debug?.(e);
		}
		L = null, R = null, z = null, B = null, V = null, Se = null, G = null, K = null, ve = null;
		try {
			let e = l.getContext("webgl2") || l.getContext("webgl");
			e && e.getExtension("WEBGL_lose_context")?.loseContext?.();
		} catch (e) {
			console.debug?.(e);
		}
	}, $e = () => {
		ye = !0;
		try {
			U != null && cancelAnimationFrame(U);
		} catch (e) {
			console.debug?.(e);
		}
		U = null;
	}, et = () => {
		if (ye = !1, !(F || U != null || typeof ve != "function")) try {
			U = requestAnimationFrame(ve);
		} catch (e) {
			console.debug?.(e);
		}
	}, tt = (e) => {
		if (s) {
			if (String(e?.detail?.active_prompt_id || "").trim()) {
				$e();
				return;
			}
			et();
		}
	};
	l._mjrProc = {
		setParams: () => {},
		destroy: Qe,
		captureCanvas: () => l,
		pause: $e,
		resume: et
	};
	try {
		s && (window.addEventListener(i.RUNTIME_STATUS, tt), String(window.__MJR_EXECUTION_RUNTIME__?.active_prompt_id || "").trim() && (ye = !0));
	} catch (e) {
		console.debug?.(e);
	}
	return Ie("Preparing 3D preview", Pe), Promise.resolve().then(async () => {
		let n = he(e);
		if (!se.has(n)) {
			if (Ie("3D preview unavailable", `${n.toUpperCase()} is not supported in the embedded viewer.`), A.style.display = "none", a) try {
				let n = document.createElement("a");
				n.href = a, n.download = String(e?.filename || "model"), n.textContent = t("model3d.downloadFile", "Download {file}", { file: String(e?.filename || "file") }), n.style.cssText = [
					"position:absolute",
					"bottom:18px",
					"left:50%",
					"transform:translateX(-50%)",
					"padding:7px 16px",
					"border-radius:8px",
					"font:600 12px system-ui,sans-serif",
					"color:#fff",
					"background:rgba(76,175,80,0.85)",
					"text-decoration:none",
					"pointer-events:auto",
					"z-index:3"
				].join(";"), c.appendChild(n);
			} catch {}
			return;
		}
		try {
			let t = await te();
			if (F) return;
			let i = t.THREE;
			I = i;
			let s = new i.LoadingManager();
			s.setURLModifier((t) => {
				if (!t || me(t)) return t;
				let n = r(e, t);
				if (n) return n;
				try {
					return new URL(t, a).href;
				} catch {
					return t;
				}
			}), L = new i.WebGLRenderer({
				canvas: l,
				antialias: !0,
				alpha: !0,
				preserveDrawingBuffer: !0
			}), L.outputColorSpace = i.SRGBColorSpace, L.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)), R = new i.Scene(), R.background = new i.Color(ce), B = new i.PerspectiveCamera(de, 16 / 9, .01, 1e4), V = new i.OrthographicCamera(-1, 1, 1, -1, -1e4, 1e4), z = B, H = new t.OrbitControls(z, l), H.enableDamping = !0, H.dampingFactor = .08, H.rotateSpeed = .82, H.zoomSpeed = 1, H.panSpeed = .9, H.screenSpacePanning = !0, H.mouseButtons = _e(null, i.MOUSE), xe = Ze(), De = new i.AmbientLight(16777215, M.ambient * Y), R.add(De);
			let f = new i.DirectionalLight(16777215, M.main * Y);
			f.position.set(0, 10, 10);
			let p = new i.DirectionalLight(16777215, M.back * Y);
			p.position.set(-10, 0, -10);
			let g = new i.DirectionalLight(15266047, M.fill * Y);
			g.position.set(10, 5, -5);
			let _ = new i.DirectionalLight(16773352, M.fill * Y);
			_.position.set(-10, 5, 5);
			let y = new i.DirectionalLight(16777215, M.bottom * Y);
			y.position.set(0, -10, 0), Oe = [
				f,
				p,
				g,
				_,
				y
			], Oe.forEach((e) => R.add(e)), W = new i.GridHelper(20, 20, 5068128, 3094338), R.add(W);
			let b = () => {
				if (F || !L || !z) return;
				let e = c.getBoundingClientRect(), t = Math.max(1, Math.round(e.width || l.clientWidth || 1)), n = Math.max(1, Math.round(e.height || l.clientHeight || 1));
				L.setSize(t, n, !1), B && (B.aspect = t / n, B.updateProjectionMatrix()), ze(t, n), Re(), Fe();
			};
			typeof ResizeObserver < "u" && (ge = new ResizeObserver(() => b()), ge.observe(c));
			let S = ee(t, n, s);
			if (!S) {
				Ie("3D loader unavailable", `${n.toUpperCase()} loader could not be created.`), A.style.display = "none";
				return;
			}
			if (n === "obj" && t.MTLLoader) try {
				let e = a.replace(/\.obj(\?.*)?$/i, (e, t) => `.mtl${t || ""}`), n = new t.MTLLoader(s), r = await new Promise((t) => {
					n.load(e, t, void 0, () => t(null));
				});
				r && !F && (r.preload(), S.setMaterials(r));
			} catch (e) {
				console.debug?.("[MJR 3D] MTL load skipped:", e?.message);
			}
			let C = await x(S, n, a);
			if (F) return;
			let E = v(i, n, C);
			if (!E) {
				Ie("Empty 3D scene", "The loader returned no renderable object."), A.style.display = "none";
				return;
			}
			try {
				let e = new i.Box3().setFromObject(E);
				if (!e.isEmpty()) {
					let t = e.getSize(new i.Vector3()), n = e.getCenter(new i.Vector3()), r = 5 / Math.max(t.x, t.y, t.z, .001);
					E.scale.multiplyScalar(r), e.setFromObject(E), e.getCenter(n), E.position.set(-n.x, -e.min.y, -n.z);
				}
			} catch (e) {
				console.debug?.("[MJR 3D] normalize skipped:", e);
			}
			if (Se = E, G = new i.Group(), G.add(E), R.add(G), we = d(E), Ee = u(E), Ee) {
				J = new i.SkeletonHelper(E), J.visible = !1, R.add(J);
				let e = ae({
					defaultBgColor: ce,
					defaultFov: de,
					defaultLightIntensity: fe,
					hasSkeleton: !0
				});
				c.replaceChild(e.panel, N.panel), Object.assign(N, e), N.bgInput.addEventListener("input", () => {
					try {
						R && (R.background = new i.Color(N.bgInput.value));
					} catch (e) {
						console.debug?.(e);
					}
				}), N.materialSel.addEventListener("change", () => {
					Ue(N.materialSel.value);
				}), N.upSel.addEventListener("change", () => {
					We(N.upSel.value);
				}), N.skeletonToggle && N.skeletonToggle.addEventListener("change", () => {
					Ge(N.skeletonToggle.checked);
				}), N.fovSlider.addEventListener("input", () => {
					let e = Math.max(1, Math.min(179, Number(N.fovSlider.value) || de));
					try {
						B && (B.fov = e, B.updateProjectionMatrix());
					} catch (e) {
						console.debug?.(e);
					}
				}), N.lightSlider.addEventListener("input", () => {
					He(Number(N.lightSlider.value));
				});
			}
			K = h(i, G), K && (W.position.y = K.box.min.y), q = j.PERSPECTIVE, Be(), b(), Le(), Xe();
			let ie = m(C, n);
			ie.length > 0 && Ye(ie, E);
			let D = new i.Scene();
			c._mjrAxisScene = D;
			let O = new i.PerspectiveCamera(50, 1, .1, 100);
			O.position.set(0, 0, 3.2), O.lookAt(0, 0, 0);
			let oe = [
				{
					dir: [
						1,
						0,
						0
					],
					color: 16724787
				},
				{
					dir: [
						0,
						1,
						0
					],
					color: 3407667
				},
				{
					dir: [
						0,
						0,
						1
					],
					color: 5605631
				}
			], se = new i.SphereGeometry(.1, 12, 8), le = new i.SphereGeometry(.08, 10, 6), ue = new i.MeshBasicMaterial({ color: 13421772 });
			D.add(new i.Mesh(le, ue));
			for (let { dir: e, color: t } of oe) {
				let n = new i.LineBasicMaterial({ color: t }), r = [new i.Vector3(0, 0, 0), new i.Vector3(e[0], e[1], e[2])], a = new i.BufferGeometry().setFromPoints(r);
				D.add(new i.Line(a, n));
				let o = new i.MeshBasicMaterial({ color: t }), s = new i.Mesh(se, o);
				s.position.set(e[0], e[1], e[2]), D.add(s);
			}
			c._mjr3D = {
				controls: H,
				get camera() {
					return z;
				}
			};
			try {
				o.onReady?.({
					canvas: l,
					host: c,
					object: G,
					renderer: L,
					camera: z,
					controls: H
				});
			} catch (e) {
				console.debug?.(e);
			}
			Fe();
			let pe = () => {
				if (!(F || ye || !L || !R || !z)) {
					try {
						if (H?.update?.(), X && ke) {
							let e = ke.getDelta();
							je && X.update(e), Ke();
						}
						L.setScissorTest(!1), L.setViewport(0, 0, l.width, l.height), L.render(R, z);
						let e = Math.min(2, window.devicePixelRatio || 1), t = Math.round(96 * e);
						L.setScissorTest(!0), L.setScissor(0, 0, t, t), L.setViewport(0, 0, t, t), L.setClearColor(0, 0), L.clear(!0, !0, !1);
						let n = z.quaternion;
						O.position.set(0, 0, 3.2).applyQuaternion(n), O.quaternion.copy(n), L.render(D, O), L.setScissorTest(!1);
						try {
							L.setClearColor(R.background || 0, 1);
						} catch {}
						Re();
					} catch (e) {
						console.debug?.(e);
					}
					ye || (U = requestAnimationFrame(pe));
				}
			};
			ve = pe;
			let P = (e) => T(e, { preventDefault: !0 });
			w.addEventListener("click", (e) => {
				P(e), Be(), Xe();
			}), ne.addEventListener("click", (e) => {
				P(e), W && (W.visible = !W.visible), Xe(), Fe();
			}), re.addEventListener("click", (e) => {
				P(e), Ve(q === j.PERSPECTIVE ? j.ORTHOGRAPHIC : j.PERSPECTIVE);
			}), k.addEventListener("click", (e) => {
				P(e), Ne = !Ne, N.panel.style.display = Ne ? "block" : "none", Xe();
			}), ye || pe();
		} catch (e) {
			console.warn("[MJR 3D] preview init failed", e), Ie("Failed to load 3D preview", String(e?.message || "Three.js initialization failed.")), A.style.display = "none";
		}
	}).catch((e) => {
		if (!F) {
			console.warn("[MJR 3D] preview init unhandled error", e);
			try {
				Ie("Failed to load 3D preview", String(e?.message || "Initialization failed."));
			} catch {}
			try {
				A.style.display = "none";
			} catch {}
		}
	}), c;
}
//#endregion
//#region ui/features/viewer/model3dRenderer.ts
var R = /* @__PURE__ */ e({
	MODEL3D_EXTS: () => A,
	MODEL3D_EXT_TO_LOADER: () => k,
	PREVIEWABLE_MODEL3D_LOADERS: () => se,
	buildModel3DMouseButtons: () => _e,
	createModel3DMediaElement: () => L,
	findModel3DCanvas: () => ge,
	getModel3DDefaultControlHint: () => F,
	isModel3DAsset: () => P,
	isModel3DInteractionTarget: () => I,
	resolveModel3DLoader: () => he
});
//#endregion
//#region ui/features/viewer/mediaPlayer.ts
function z(e) {
	let t = String(e || "").toLowerCase();
	return t === "video" || t === "audio";
}
function B({ mode: e, VIEWER_MODES: t, singleView: n, abView: r, sideView: i } = {}) {
	try {
		let a = n;
		return e === t?.AB_COMPARE ? a = r : e === t?.SIDE_BY_SIDE && (a = i), a ? Array.from(a.querySelectorAll?.(".mjr-viewer-video-src, .mjr-viewer-audio-src") || []) : [];
	} catch {
		return [];
	}
}
function V(e) {
	try {
		let t = Array.isArray(e) ? e : [];
		return t.find((e) => String(e?.dataset?.mjrCompareRole || "") === "A") || t[0] || null;
	} catch {
		return null;
	}
}
function H(e, t = {}) {
	try {
		if (!e) return null;
		let n = String(t?.mediaKind || "").toLowerCase();
		return a(e, {
			...t,
			mediaKind: n
		});
	} catch {
		return null;
	}
}
//#endregion
export { R as a, P as c, C as d, S as f, V as i, I as l, z as n, A as o, c as p, H as r, L as s, B as t, w as u };
