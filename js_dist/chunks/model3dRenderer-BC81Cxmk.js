import { t as e } from "./rolldown-runtime-DMoxecvO.js";
import { h as t, t as n } from "./config-VsGZ1HHP.js";
import { r } from "./events-BAVTWdux.js";
import { n as i } from "./state-B8eTxorm.js";
//#region js/features/viewer/model3dCore.js
function a(e, t) {
	if (!(!e || typeof t != "function")) try {
		e.traverse?.((e) => {
			(e?.isMesh || e?.isPoints || e?.isLine) && t(e);
		});
	} catch (e) {
		console.debug?.(e);
	}
}
function o(e) {
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
function s(e) {
	let t = /* @__PURE__ */ new Map();
	return a(e, (e) => {
		t.set(e.uuid, e.material);
	}), t;
}
function c(e, t, n, r, i) {
	a(t, (t) => {
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
function l(e) {
	if (e) {
		for (let t of e) try {
			t?.dispose?.();
		} catch (e) {
			console.debug?.(e);
		}
		e.clear();
	}
}
function u(e, t) {
	try {
		if (t === "gltf" || t === "fbx") return Array.isArray(e?.animations) ? e.animations : [];
	} catch (e) {
		console.debug?.(e);
	}
	return [];
}
function d(e, t) {
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
function f(e, t, n, r) {
	if (!r || !t || !n) return;
	let i = t.fov * (Math.PI / 180), a = r.maxDim / (2 * Math.tan(i / 2)) * 1.55, o = new e.Vector3(1, .8, 1).normalize();
	t.position.copy(r.center).addScaledVector(o, a), t.near = Math.max(.01, a / 250), t.far = Math.max(1e3, a * 60), t.updateProjectionMatrix(), n.target.copy(r.center), n.minDistance = Math.max(.01, a / 25), n.maxDistance = Math.max(10, a * 12), n.minZoom = .25, n.maxZoom = 12, n.update();
}
function p(e, t, n, r) {
	if (!n || !e || !t) return null;
	let i = Math.max(1e-4, Number(r) || 1), a = Math.max(n.maxDim * 1.9, 2), o = a * i;
	return e.left = -o / 2, e.right = o / 2, e.top = a / 2, e.bottom = -a / 2, e.near = -Math.max(1e3, n.maxDim * 40), e.far = Math.max(1e3, n.maxDim * 40), e.zoom = 1, e.position.copy(n.center).add({
		x: n.radius * 2.1,
		y: n.radius * 1.6,
		z: n.radius * 2.1
	}), e.updateProjectionMatrix(), t.target.copy(n.center), t.minZoom = .25, t.maxZoom = 12, t.minDistance = 0, t.maxDistance = Math.max(10, n.maxDim * 12), t.update(), a;
}
function m(e, t, n) {
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
//#region js/features/viewer/model3dLoaders.js
var h = "/mjr/am/vendor/three", g = null;
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
function _(e, t, n) {
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
	return g || (g = Promise.all([
		import(
			/* @vite-ignore */
			`${h}/three.module.js`
),
		import(
			/* @vite-ignore */
			`${h}/addons/controls/OrbitControls.js`
),
		import(
			/* @vite-ignore */
			`${h}/addons/loaders/GLTFLoader.js`
),
		import(
			/* @vite-ignore */
			`${h}/addons/loaders/FBXLoader.js`
),
		import(
			/* @vite-ignore */
			`${h}/addons/loaders/OBJLoader.js`
),
		import(
			/* @vite-ignore */
			`${h}/addons/loaders/MTLLoader.js`
),
		import(
			/* @vite-ignore */
			`${h}/addons/loaders/STLLoader.js`
),
		import(
			/* @vite-ignore */
			`${h}/addons/loaders/PLYLoader.js`
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
	})), g);
}
//#endregion
//#region js/features/viewer/processorUtils.js
function v(e, t, n) {
	try {
		let r = Number(e) || 0, i = (Number(t) || 0) * (Number(n) || 0);
		return !(i > 0) || !(r > 0) || i <= r ? 1 : Math.max(.05, Math.min(1, Math.sqrt(r / i)));
	} catch {
		return 1;
	}
}
//#endregion
//#region js/features/viewer/imageProcessor.js
function y(e, t, n) {
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
function b({ canvas: e, url: t, getGradeParams: n, isDefaultGrade: r, _tonemap: a, maxProcPixels: o, onReady: s } = {}) {
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
		naturalW: 0,
		naturalH: 0,
		scale: 1,
		srcData: null,
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
					f._pendingParams = null, e && _(e);
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
	}, m = (e, t) => v(o, e, t), h = () => {
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
	}, ee = (t, a) => {
		if (!l || f._destroyed) return;
		if (!e?.isConnected) {
			try {
				f._pendingParams = a || f.lastParams || n?.() || null;
			} catch (e) {
				console.debug?.(e);
			}
			p();
			return;
		}
		if (t !== f.jobId) return;
		let o = h();
		if (!o?.data) return;
		let s = u.width, c = u.height;
		if (!(s > 0 && c > 0)) return;
		try {
			let t = a || n?.() || {};
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
		let m = a || n?.() || {}, g = Number(m.exposureEV) || 0, ee = 1 / Math.max(.1, Math.min(3, Number(m.gamma) || 1)), _ = String(m.channel || "rgb"), te = String(m.analysisMode || "none"), v = i(m.zebraThreshold ?? .95), y = 2 ** g, b = new Float32Array(256);
		for (let e = 0; e < 256; e++) b[e] = (e / 255) ** ee;
		let x = d.data, S = o.data, C = s * c * 4, w = 0, T = () => {
			if (f._destroyed || !e?.isConnected || t !== f.jobId) return;
			let n = Math.min(C, w + 22e4);
			for (; w < n; w += 4) {
				let e = (S[w] ?? 0) / 255, t = (S[w + 1] ?? 0) / 255, n = (S[w + 2] ?? 0) / 255, r = (S[w + 3] ?? 255) / 255, a = e * y, o = t * y, c = n * y, l = .2126 * a + .7152 * o + .0722 * c;
				if (te === "zebra") if (i(l) >= v) {
					let e = (Math.floor(w / 4) % s + Math.floor(w / 4 / s) & 7) < 3;
					a = +!!e, o = +!!e, c = +!!e;
				} else a = b[i(a) * 255 + .5 | 0], o = b[i(o) * 255 + .5 | 0], c = b[i(c) * 255 + .5 | 0];
				else a = b[i(a) * 255 + .5 | 0], o = b[i(o) * 255 + .5 | 0], c = b[i(c) * 255 + .5 | 0];
				if (_ === "r") o = a, c = a;
				else if (_ === "g") a = o, c = o;
				else if (_ === "b") a = c, o = c;
				else if (_ === "a") a = r, o = r, c = r;
				else if (_ === "l") {
					let e = b[i(l) * 255 + .5 | 0];
					a = e, o = e, c = e;
				}
				x[w] = Math.round(i(a) * 255), x[w + 1] = Math.round(i(o) * 255), x[w + 2] = Math.round(i(c) * 255), x[w + 3] = 255;
			}
			if (w < C) {
				try {
					f._rafId = requestAnimationFrame(T);
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
			f._rafId = requestAnimationFrame(T);
		} catch (e) {
			console.debug?.(e);
		}
	}, _ = (t) => {
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
			ee(r, f.lastParams);
		} catch (e) {
			console.debug?.(e);
		}
	}, te = () => {
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
			f.ready = !0, f.srcData = null, h(), _(f.lastParams || n?.());
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
			y(e, "Failed to load image");
		} catch (e) {
			console.debug?.(e);
		}
	};
	try {
		c.onload = te, c.onerror = b;
	} catch (e) {
		console.debug?.(e);
	}
	try {
		c.src = t;
	} catch (e) {
		console.debug?.(e);
	}
	return {
		setParams: _,
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
//#region js/features/viewer/model3dSupport.js
var x = [
	.25,
	.5,
	1,
	1.5,
	2
], S = 44;
function C(e, { preventDefault: t = !1, immediate: n = !1 } = {}) {
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
function w(e) {
	let t = Math.max(0, Number(e) || 0), n = Math.floor(t / 60), r = Math.floor(t % 60);
	return n > 0 ? `${n}:${String(r).padStart(2, "0")}` : `${Math.floor(t)}s`;
}
function T(e, t) {
	let n = document.createElement("button");
	return n.type = "button", n.textContent = String(e || ""), n.title = String(t || e || ""), n.setAttribute("aria-label", String(t || e || "3D viewport action")), n.style.cssText = [
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
	].join(";"), n;
}
function ne(e, t) {
	if (!e) return;
	let n = !!t;
	e.dataset.active = n ? "1" : "0", e.style.background = n ? "rgba(76,175,80,0.18)" : "rgba(13,15,20,0.78)", e.style.borderColor = n ? "rgba(76,175,80,0.42)" : "rgba(255,255,255,0.16)", e.style.color = n ? "rgba(230,255,235,0.96)" : "rgba(255,255,255,0.92)";
}
function E(e, t, n = "", r = "#4CAF50") {
	if (!e) return;
	try {
		let t = Math.max(480, Number(e.width) || 960), n = Math.max(270, Number(e.height) || 540);
		e.width = t, e.height = n;
	} catch (e) {
		console.debug?.(e);
	}
	let i = (() => {
		try {
			return e.getContext("2d");
		} catch {
			return null;
		}
	})();
	if (!i) return;
	let a = Number(e.width) || 960, o = Number(e.height) || 540, s = a / 2, c = o / 2;
	try {
		let e = i.createLinearGradient(0, 0, a, o);
		e.addColorStop(0, "#0f1419"), e.addColorStop(1, "#11181f"), i.fillStyle = e, i.fillRect(0, 0, a, o), i.save(), i.translate(s, c - 32), i.strokeStyle = r, i.lineWidth = 3, i.globalAlpha = .95, i.beginPath(), i.moveTo(0, -44), i.lineTo(42, -22), i.lineTo(42, 22), i.lineTo(0, 44), i.lineTo(-42, 22), i.lineTo(-42, -22), i.closePath(), i.stroke(), i.beginPath(), i.moveTo(0, -44), i.lineTo(0, 0), i.lineTo(42, 22), i.moveTo(0, 0), i.lineTo(-42, 22), i.moveTo(-42, -22), i.lineTo(0, 0), i.moveTo(42, -22), i.lineTo(0, 0), i.stroke(), i.restore(), i.fillStyle = "rgba(255,255,255,0.94)", i.font = "600 18px system-ui, sans-serif", i.textAlign = "center", i.textBaseline = "middle", i.fillText(String(t || "3D preview"), s, c + 44), n && (i.fillStyle = "rgba(255,255,255,0.62)", i.font = "13px system-ui, sans-serif", i.fillText(String(n), s, c + 72));
	} catch (r) {
		console.debug?.(r);
		try {
			y(e, t, n || "3D viewer unavailable");
		} catch (e) {
			console.debug?.(e);
		}
	}
}
function re({ defaultBgColor: e, defaultFov: t, defaultLightIntensity: n, hasSkeleton: r } = {}) {
	let i = document.createElement("div");
	i.className = "mjr-model3d-settings", i.style.cssText = [
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
		i.addEventListener(e, (e) => C(e, { preventDefault: !1 }));
	});
	let a = (e) => {
		let t = document.createElement("div");
		t.style.cssText = [
			"font:700 10px system-ui,sans-serif",
			"letter-spacing:0.08em",
			"color:rgba(255,255,255,0.40)",
			"text-transform:uppercase",
			"margin:10px 0 6px 0"
		].join(";"), t.textContent = e, i.appendChild(t);
		let n = document.createElement("div");
		n.style.cssText = "height:1px;background:rgba(255,255,255,0.07);margin-bottom:8px;", i.appendChild(n);
	}, o = (e, t) => {
		let n = document.createElement("div");
		n.style.cssText = "display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:6px;";
		let r = document.createElement("span");
		return r.style.cssText = "font:500 11px system-ui,sans-serif;color:rgba(255,255,255,0.65);white-space:nowrap;flex-shrink:0;", r.textContent = e, n.appendChild(r), n.appendChild(t), i.appendChild(n), n;
	}, s = (e, t) => {
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
	}, c = (e, t, n, r) => {
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
	a("Scene");
	let l = document.createElement("input");
	l.type = "color", l.value = e || "#282828", l.style.cssText = "width:34px;height:24px;cursor:pointer;border:1px solid rgba(255,255,255,0.18);border-radius:4px;padding:1px;background:none;flex-shrink:0;", o("Background", l), a("Model");
	let u = s([
		["original", "Original"],
		["normal", "Normal map"],
		["depth", "Depth"],
		["wireframe", "Wireframe"],
		["pointcloud", "Point cloud"]
	], "original");
	o("Material", u);
	let d = s([
		["original", "Original"],
		["+y", "+Y (default)"],
		["-y", "-Y"],
		["+z", "+Z (CAD)"],
		["-z", "-Z"],
		["+x", "+X"],
		["-x", "-X"]
	], "original");
	o("Up", d);
	let f = null, p = null;
	r && (p = document.createElement("input"), p.type = "checkbox", p.checked = !1, p.style.cssText = "cursor:pointer;accent-color:#4CAF50;flex-shrink:0;", f = o("Skeleton", p)), a("Camera");
	let m = c(15, 120, 1, t ?? 75);
	o("FOV", m.wrap), a("Lights");
	let h = c(0, 5, .1, n ?? 1);
	return o("Intensity", h.wrap), {
		panel: i,
		bgInput: l,
		materialSel: u,
		upSel: d,
		skeletonToggle: p,
		skeletonRow: f,
		fovSlider: m.slider,
		fovValLbl: m.valLbl,
		lightSlider: h.slider,
		lightValLbl: h.valLbl
	};
}
function ie() {
	let e = document.createElement("div");
	e.className = "mjr-model3d-anim-bar", e.style.cssText = [
		"position:absolute",
		"bottom:0",
		"left:0",
		"right:0",
		`height:${S}px`,
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
		e.addEventListener(t, (e) => C(e, { preventDefault: !1 }));
	});
	let t = document.createElement("button");
	t.type = "button", t.textContent = "▶", t.title = "Play / Pause", t.style.cssText = [
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
	let n = document.createElement("select");
	n.title = "Playback speed", n.style.cssText = [
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
	for (let e of x) {
		let t = document.createElement("option");
		t.value = String(e), t.textContent = `${e}×`, e === 1 && (t.selected = !0), n.appendChild(t);
	}
	let r = document.createElement("select");
	r.title = "Animation clip", r.style.cssText = [
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
	let i = document.createElement("input");
	i.type = "range", i.min = "0", i.max = "1000", i.value = "0", i.style.cssText = "flex:1;min-width:50px;cursor:pointer;accent-color:#4CAF50;height:3px;";
	let a = document.createElement("span");
	return a.style.cssText = [
		"font:500 11px system-ui,sans-serif",
		"color:rgba(255,255,255,0.45)",
		"white-space:nowrap",
		"flex-shrink:0"
	].join(";"), a.textContent = "0s / 0s", e.appendChild(t), e.appendChild(n), e.appendChild(r), e.appendChild(i), e.appendChild(a), {
		bar: e,
		playBtn: t,
		speedSel: n,
		animSel: r,
		progressSlider: i,
		timeLbl: a
	};
}
//#endregion
//#region js/features/viewer/model3dRenderer.impl.js
var ae = Object.freeze({
	".gltf": "gltf",
	".glb": "gltf",
	".obj": "obj",
	".fbx": "fbx",
	".stl": "stl",
	".ply": "ply",
	".splat": "splat",
	".ksplat": "splat",
	".spz": "splat"
}), oe = new Set(Object.keys(ae)), se = new Set([
	"gltf",
	"obj",
	"fbx",
	"stl",
	"ply"
]), ce = "#282828", le = "Rotate: left drag  Pan: right drag  Zoom: wheel", D = Object.freeze({
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
}), de = 44, fe = 75, pe = 1, O = Object.freeze({
	ambient: .5,
	main: .8,
	fill: .3,
	back: .3,
	rim: .3,
	bottom: .2
});
function k(e) {
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
function he(e) {
	return String(e?.loader || e?.viewer_info?.loader || "").trim().toLowerCase() || ae[k(e)] || "";
}
function ge(e) {
	return String(e?.kind || "").toLowerCase() === "model3d" ? !0 : oe.has(k(e));
}
function _e(e) {
	return he(e) || "gltf";
}
function A() {
	return le;
}
function j(e) {
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
function M(e) {
	try {
		return !!e?.closest?.(".mjr-model3d-host, .mjr-viewer-model3d-host, .mjr-mfv-model3d-host");
	} catch {
		return !1;
	}
}
function ve(e, t) {
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
function N(e, i, a = {}) {
	let h = a?.pauseDuringExecution == null ? !!n?.VIEWER_PAUSE_DURING_EXECUTION : !!a.pauseDuringExecution, g = document.createElement("div");
	g.className = a.hostClassName || "mjr-model3d-host mjr-viewer-model3d-host", g.style.cssText = a.hostStyle || [
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
	].join(";"), g.setAttribute("data-capture-wheel", "true"), g.tabIndex = -1;
	let v = document.createElement("canvas");
	v.className = a.canvasClassName || "mjr-viewer-media mjr-model3d-render-canvas", v.style.cssText = a.canvasStyle || [
		"display:block",
		"width:100%",
		"height:100%",
		"max-width:100%",
		"max-height:100%",
		"outline:none",
		"touch-action:none"
	].join(";"), v.tabIndex = 0, v._mjrDisableViewerTransform = a.disableViewerTransform !== !1;
	try {
		e?.id != null && (v.dataset.mjrAssetId = String(e.id));
	} catch (e) {
		console.debug?.(e);
	}
	g.appendChild(v);
	let y = document.createElement("canvas");
	y.className = "mjr-model3d-status", y.style.cssText = [
		"position:absolute",
		"inset:0",
		"display:block",
		"width:100%",
		"height:100%",
		"pointer-events:none",
		"z-index:1"
	].join(";"), g.appendChild(y);
	let b = k(e).replace(".", "").toUpperCase();
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
		].join(";"), g.appendChild(e);
	}
	let x = document.createElement("div");
	x.className = "mjr-model3d-toolbar", x.style.cssText = [
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
	let S = document.createElement("div");
	S.style.cssText = "display:flex;align-items:center;gap:6px;flex-wrap:wrap;pointer-events:auto;";
	let ae = T("Reset", "Reset 3D view"), oe = T("Grid", "Toggle grid"), he = T("Persp", "Switch perspective / orthographic"), ge = T("⚙", "Settings");
	S.append(ae, oe, he, ge), x.appendChild(S), g.appendChild(x);
	let A = document.createElement("div");
	A.className = "mjr-model3d-hint", A.textContent = a.hintText || le, A.style.cssText = [
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
	].join(";"), g.appendChild(A);
	let j = re({
		defaultBgColor: ce,
		defaultFov: fe,
		defaultLightIntensity: pe,
		hasSkeleton: !1
	});
	g.appendChild(j.panel);
	let M = ie();
	g.appendChild(M.bar);
	let N = !1, ye = null, P = null, F = null, I = null, L = null, R = null, z = null, B = null, V = null, be = null, H = !1, U = null, xe = null, W = null, G = null, Se = null, K = null, Ce = 0, q = D.PERSPECTIVE, we = /* @__PURE__ */ new Map(), Te = /* @__PURE__ */ new Set(), J = null, Ee = !1, De = null, Oe = [], Y = pe, X = null, ke = null, Z = [], Q = [], $ = 0, Ae = 1, je = !1, Me = !1, Ne = !1, Pe = String(e?.filename || "3D model"), Fe = () => {
		try {
			a.scheduleOverlayRedraw?.();
		} catch (e) {
			console.debug?.(e);
		}
	}, Ie = (e, t = "", n = "#4CAF50") => {
		U = {
			title: e,
			hintText: t,
			accent: n
		}, y.style.display = "block", E(y, e, t, n);
	}, Le = () => {
		U = null, y.style.display = "none";
	}, Re = () => {
		try {
			let e = g.getBoundingClientRect();
			v._mjrNaturalW = Math.max(1, Math.round(e.width || v.width || 1)), v._mjrNaturalH = Math.max(1, Math.round(e.height || v.height || 1));
		} catch (e) {
			console.debug?.(e);
		}
		try {
			U && E(y, U.title, U.hintText, U.accent);
		} catch (e) {
			console.debug?.(e);
		}
	}, ze = (e, t) => {
		if (!z || !(Ce > 0)) return;
		let n = Math.max(1e-4, (Number(e) || 1) / Math.max(1, Number(t) || 1)), r = Ce * n;
		z.left = -r / 2, z.right = r / 2, z.top = Ce / 2, z.bottom = -Ce / 2, z.updateProjectionMatrix();
	}, Be = () => {
		if (!(!G || !B || !K)) {
			if (q === D.ORTHOGRAPHIC) {
				let e = g.getBoundingClientRect();
				Ce = p(z, B, K, Math.max(1e-4, (e.width || 1) / Math.max(1, e.height || 1))) || Ce, L = z;
			} else f(P, R, B, K), L = R;
			try {
				B.object = L, B.update();
			} catch (e) {
				console.debug?.(e);
			}
		}
	}, Ve = (e, { refit: t = !0 } = {}) => {
		q = e === D.ORTHOGRAPHIC ? D.ORTHOGRAPHIC : D.PERSPECTIVE, L = q === D.ORTHOGRAPHIC ? z : R;
		try {
			B && (B.object = L);
		} catch (e) {
			console.debug?.(e);
		}
		if (t) Be();
		else {
			try {
				L?.updateProjectionMatrix?.();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				B?.update?.();
			} catch (e) {
				console.debug?.(e);
			}
		}
		Xe(), Fe();
	}, He = (e) => {
		Y = Math.max(0, Math.min(10, Number(e) || 0));
		try {
			De && (De.intensity = O.ambient * Y);
		} catch (e) {
			console.debug?.(e);
		}
		let t = [
			O.main,
			O.back,
			O.fill,
			O.fill,
			O.bottom
		];
		Oe.forEach((e, n) => {
			try {
				e && (e.intensity = (t[n] ?? O.fill) * Y);
			} catch (e) {
				console.debug?.(e);
			}
		});
	}, Ue = (e) => {
		!Se || !P || (l(Te), c(P, Se, e, we, Te), Fe());
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
		P && (K = d(P, G)), Be();
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
			M.timeLbl.textContent = `${w(n)} / ${w(t)}`;
		} catch (e) {
			console.debug?.(e);
		}
		if (!Me && t > 0) try {
			let e = Number(M.progressSlider.max) || 1e3;
			M.progressSlider.value = String(Math.round(n / t * e));
		} catch (e) {
			console.debug?.(e);
		}
	}, qe = (e) => {
		if (!X || !Z.length) return;
		let t = Z[e];
		if (!t) return;
		Q.forEach((e) => {
			try {
				e?.stop();
			} catch (e) {
				console.debug?.(e);
			}
		});
		let n = X.clipAction(t);
		n.timeScale = Ae, n.clampWhenFinished = !1, n.loop = P?.LoopRepeat ?? 2201, n.play(), Q[e] = n, $ = e, je = !0, M.playBtn.textContent = "⏸";
		try {
			let e = Math.max(100, Math.min(1e4, Math.round((t.duration || 1) * 100)));
			M.progressSlider.max = String(e);
		} catch {}
	}, Je = () => {
		!X || !Z.length || (je ? (X.timeScale = 0, je = !1, M.playBtn.textContent = "▶") : (X.timeScale = Ae, Q[$]?.isRunning?.() ? (je = !0, M.playBtn.textContent = "⏸") : qe($)));
	}, Ye = (e, t) => {
		!e || e.length === 0 || !P || (Z = e, X = new P.AnimationMixer(t), ke = new P.Clock(), Q = Array(e.length).fill(null), M.animSel.innerHTML = "", e.forEach((e, t) => {
			let n = document.createElement("option");
			n.value = String(t), n.textContent = e.name || `Animation ${t + 1}`, M.animSel.appendChild(n);
		}), M.animSel.style.display = e.length > 1 ? "" : "none", M.bar.style.display = "flex", A.style.bottom = `${de + 10}px`, qe(0), M.playBtn.addEventListener("click", (e) => {
			C(e), Je();
		}), M.speedSel.addEventListener("change", () => {
			Ae = Number(M.speedSel.value) || 1, X.timeScale = je ? Ae : 0;
			let e = Q[$];
			e && (e.timeScale = Ae);
		}), M.animSel.addEventListener("change", () => {
			qe(Number(M.animSel.value) || 0);
		}), M.progressSlider.addEventListener("pointerdown", () => {
			Me = !0;
		}), M.progressSlider.addEventListener("pointerup", () => {
			Me = !1;
			let e = Q[$], t = Z[$];
			if (e && t) {
				let n = Number(M.progressSlider.max) || 1e3, r = Number(M.progressSlider.value) / n * t.duration;
				e.time = Math.max(0, Math.min(r, t.duration));
			}
		}), M.progressSlider.addEventListener("input", () => {
			let e = Q[$], t = Z[$];
			if (e && t && Me) {
				let n = Number(M.progressSlider.max) || 1e3, r = Number(M.progressSlider.value) / n * t.duration;
				e.time = Math.max(0, Math.min(r, t.duration)), M.timeLbl.textContent = `${w(r)} / ${w(t.duration)}`;
			}
		}));
	}, Xe = () => {
		ne(oe, !!W?.visible), ne(he, q === D.ORTHOGRAPHIC), he.textContent = q === D.ORTHOGRAPHIC ? "Ortho" : "Persp", ne(ge, Ne);
	};
	j.bgInput.addEventListener("input", () => {
		let e = j.bgInput.value;
		try {
			I && (I.background = new (P?.Color || Object)(e));
		} catch (e) {
			console.debug?.(e);
		}
	}), j.materialSel.addEventListener("change", () => {
		Ue(j.materialSel.value);
	}), j.upSel.addEventListener("change", () => {
		We(j.upSel.value);
	}), j.skeletonToggle && j.skeletonToggle.addEventListener("change", () => {
		Ge(j.skeletonToggle.checked);
	}), j.fovSlider.addEventListener("input", () => {
		let e = Math.max(1, Math.min(179, Number(j.fovSlider.value) || fe));
		try {
			R && (R.fov = e, R.updateProjectionMatrix());
		} catch (e) {
			console.debug?.(e);
		}
	}), j.lightSlider.addEventListener("input", () => {
		He(Number(j.lightSlider.value));
	});
	let Ze = () => {
		let e = [], t = (t, n, r, i) => {
			t.addEventListener(n, r, i), e.push(() => t.removeEventListener(n, r, i));
		};
		return t(g, "pointerdown", () => {
			try {
				v.focus?.();
			} catch (e) {
				console.debug?.(e);
			}
		}), t(g, "wheel", (e) => C(e)), t(g, "contextmenu", (e) => C(e, { preventDefault: !0 })), t(g, "dragstart", (e) => C(e, { preventDefault: !0 })), t(g, "dragover", (e) => C(e, { preventDefault: !0 })), t(g, "dragleave", (e) => C(e)), t(g, "drop", (e) => C(e, { preventDefault: !0 })), () => {
			for (let t of e) try {
				t();
			} catch (e) {
				console.debug?.(e);
			}
		};
	}, Qe = () => {
		N = !0;
		try {
			window.removeEventListener(r.RUNTIME_STATUS, tt);
		} catch {}
		try {
			g._mjr3D = null;
		} catch {}
		try {
			V != null && cancelAnimationFrame(V);
		} catch (e) {
			console.debug?.(e);
		}
		V = null;
		try {
			xe?.();
		} catch (e) {
			console.debug?.(e);
		}
		xe = null;
		try {
			ye?.disconnect?.();
		} catch (e) {
			console.debug?.(e);
		}
		ye = null;
		try {
			B?.dispose?.();
		} catch (e) {
			console.debug?.(e);
		}
		B = null;
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
		X = null, Q = [], Z = [], l(Te);
		try {
			J && (I?.remove?.(J), J.dispose?.());
		} catch (e) {
			console.debug?.(e);
		}
		J = null;
		try {
			I?.traverse?.((e) => {
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
			g._mjrAxisScene &&= (g._mjrAxisScene.traverse?.((e) => {
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
			F?.dispose?.();
		} catch (e) {
			console.debug?.(e);
		}
		F = null, I = null, L = null, R = null, z = null, Se = null, G = null, K = null, be = null;
		try {
			let e = v.getContext("webgl2") || v.getContext("webgl");
			e && e.getExtension("WEBGL_lose_context")?.loseContext?.();
		} catch (e) {
			console.debug?.(e);
		}
	}, $e = () => {
		H = !0;
		try {
			V != null && cancelAnimationFrame(V);
		} catch (e) {
			console.debug?.(e);
		}
		V = null;
	}, et = () => {
		if (H = !1, !(N || V != null || typeof be != "function")) try {
			V = requestAnimationFrame(be);
		} catch (e) {
			console.debug?.(e);
		}
	}, tt = (e) => {
		if (h) {
			if (String(e?.detail?.active_prompt_id || "").trim()) {
				$e();
				return;
			}
			et();
		}
	};
	v._mjrProc = {
		setParams: () => {},
		destroy: Qe,
		captureCanvas: () => v,
		pause: $e,
		resume: et
	};
	try {
		h && (window.addEventListener(r.RUNTIME_STATUS, tt), String(window?.__MJR_EXECUTION_RUNTIME__?.active_prompt_id || "").trim() && (H = !0));
	} catch (e) {
		console.debug?.(e);
	}
	return Ie("Preparing 3D preview", Pe), Promise.resolve().then(async () => {
		let n = _e(e);
		if (!se.has(n)) {
			if (Ie("3D preview unavailable", `${n.toUpperCase()} is not supported in the embedded viewer.`), A.style.display = "none", i) try {
				let t = document.createElement("a");
				t.href = i, t.download = String(e?.filename || "model"), t.textContent = `Download ${String(e?.filename || "file")}`, t.style.cssText = [
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
				].join(";"), g.appendChild(t);
			} catch {}
			return;
		}
		try {
			let r = await te();
			if (N) return;
			let c = r.THREE;
			P = c;
			let l = new c.LoadingManager();
			l.setURLModifier((n) => {
				if (!n || me(n)) return n;
				let r = t(e, n);
				if (r) return r;
				try {
					return new URL(n, i).href;
				} catch {
					return n;
				}
			}), F = new c.WebGLRenderer({
				canvas: v,
				antialias: !0,
				alpha: !0,
				preserveDrawingBuffer: !0
			}), F.outputColorSpace = c.SRGBColorSpace, F.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)), I = new c.Scene(), I.background = new c.Color(ce), R = new c.PerspectiveCamera(fe, 16 / 9, .01, 1e4), z = new c.OrthographicCamera(-1, 1, 1, -1, -1e4, 1e4), L = R, B = new r.OrbitControls(L, v), B.enableDamping = !0, B.dampingFactor = .08, B.rotateSpeed = .82, B.zoomSpeed = 1, B.panSpeed = .9, B.screenSpacePanning = !0, B.mouseButtons = ve(null, c.MOUSE), xe = Ze(), De = new c.AmbientLight(16777215, O.ambient * Y), I.add(De);
			let f = new c.DirectionalLight(16777215, O.main * Y);
			f.position.set(0, 10, 10);
			let p = new c.DirectionalLight(16777215, O.back * Y);
			p.position.set(-10, 0, -10);
			let h = new c.DirectionalLight(15266047, O.fill * Y);
			h.position.set(10, 5, -5);
			let y = new c.DirectionalLight(16773352, O.fill * Y);
			y.position.set(-10, 5, 5);
			let b = new c.DirectionalLight(16777215, O.bottom * Y);
			b.position.set(0, -10, 0), Oe = [
				f,
				p,
				h,
				y,
				b
			], Oe.forEach((e) => I.add(e)), W = new c.GridHelper(20, 20, 5068128, 3094338), I.add(W);
			let x = () => {
				if (N || !F || !L) return;
				let e = g.getBoundingClientRect(), t = Math.max(1, Math.round(e.width || v.clientWidth || 1)), n = Math.max(1, Math.round(e.height || v.clientHeight || 1));
				F.setSize(t, n, !1), R && (R.aspect = t / n, R.updateProjectionMatrix()), ze(t, n), Re(), Fe();
			};
			typeof ResizeObserver < "u" && (ye = new ResizeObserver(() => x()), ye.observe(g));
			let S = ee(r, n, l);
			if (!S) {
				Ie("3D loader unavailable", `${n.toUpperCase()} loader could not be created.`), A.style.display = "none";
				return;
			}
			if (n === "obj" && r.MTLLoader) try {
				let e = i.replace(/\.obj(\?.*)?$/i, (e, t) => `.mtl${t || ""}`), t = new r.MTLLoader(l), n = await new Promise((n) => {
					t.load(e, n, void 0, () => n(null));
				});
				n && !N && (n.preload(), S.setMaterials(n));
			} catch (e) {
				console.debug?.("[MJR 3D] MTL load skipped:", e?.message);
			}
			let w = await _(S, n, i);
			if (N) return;
			let T = m(c, n, w);
			if (!T) {
				Ie("Empty 3D scene", "The loader returned no renderable object."), A.style.display = "none";
				return;
			}
			try {
				let e = new c.Box3().setFromObject(T);
				if (!e.isEmpty()) {
					let t = e.getSize(new c.Vector3()), n = e.getCenter(new c.Vector3()), r = 5 / Math.max(t.x, t.y, t.z, .001);
					T.scale.multiplyScalar(r), e.setFromObject(T), e.getCenter(n), T.position.set(-n.x, -e.min.y, -n.z);
				}
			} catch (e) {
				console.debug?.("[MJR 3D] normalize skipped:", e);
			}
			if (Se = T, G = new c.Group(), G.add(T), I.add(G), we = s(T), Ee = o(T), Ee) {
				J = new c.SkeletonHelper(T), J.visible = !1, I.add(J);
				let e = re({
					defaultBgColor: ce,
					defaultFov: fe,
					defaultLightIntensity: pe,
					hasSkeleton: !0
				});
				g.replaceChild(e.panel, j.panel), Object.assign(j, e), j.bgInput.addEventListener("input", () => {
					try {
						I && (I.background = new c.Color(j.bgInput.value));
					} catch (e) {
						console.debug?.(e);
					}
				}), j.materialSel.addEventListener("change", () => {
					Ue(j.materialSel.value);
				}), j.upSel.addEventListener("change", () => {
					We(j.upSel.value);
				}), j.skeletonToggle && j.skeletonToggle.addEventListener("change", () => {
					Ge(j.skeletonToggle.checked);
				}), j.fovSlider.addEventListener("input", () => {
					let e = Math.max(1, Math.min(179, Number(j.fovSlider.value) || fe));
					try {
						R && (R.fov = e, R.updateProjectionMatrix());
					} catch (e) {
						console.debug?.(e);
					}
				}), j.lightSlider.addEventListener("input", () => {
					He(Number(j.lightSlider.value));
				});
			}
			K = d(c, G), K && (W.position.y = K.box.min.y), q = D.PERSPECTIVE, Be(), x(), Le(), Xe();
			let ne = u(w, n);
			ne.length > 0 && Ye(ne, T);
			let E = new c.Scene();
			g._mjrAxisScene = E;
			let ie = new c.PerspectiveCamera(50, 1, .1, 100);
			ie.position.set(0, 0, 3.2), ie.lookAt(0, 0, 0);
			let se = [
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
			], le = new c.SphereGeometry(.1, 12, 8), ue = new c.SphereGeometry(.08, 10, 6), de = new c.MeshBasicMaterial({ color: 13421772 });
			E.add(new c.Mesh(ue, de));
			for (let { dir: e, color: t } of se) {
				let n = new c.LineBasicMaterial({ color: t }), r = [new c.Vector3(0, 0, 0), new c.Vector3(e[0], e[1], e[2])], i = new c.BufferGeometry().setFromPoints(r);
				E.add(new c.Line(i, n));
				let a = new c.MeshBasicMaterial({ color: t }), o = new c.Mesh(le, a);
				o.position.set(e[0], e[1], e[2]), E.add(o);
			}
			g._mjr3D = {
				controls: B,
				get camera() {
					return L;
				}
			};
			try {
				a.onReady?.({
					canvas: v,
					host: g,
					object: G,
					renderer: F,
					camera: L,
					controls: B
				});
			} catch (e) {
				console.debug?.(e);
			}
			Fe();
			let k = () => {
				if (!(N || H || !F || !I || !L)) {
					try {
						if (B?.update?.(), X && ke) {
							let e = ke.getDelta();
							je && X.update(e), Ke();
						}
						F.setScissorTest(!1), F.setViewport(0, 0, v.width, v.height), F.render(I, L);
						let e = Math.min(2, window.devicePixelRatio || 1), t = Math.round(96 * e);
						F.setScissorTest(!0), F.setScissor(0, 0, t, t), F.setViewport(0, 0, t, t), F.setClearColor(0, 0), F.clear(!0, !0, !1);
						let n = L.quaternion;
						ie.position.set(0, 0, 3.2).applyQuaternion(n), ie.quaternion.copy(n), F.render(E, ie), F.setScissorTest(!1);
						try {
							F.setClearColor(I.background || 0, 1);
						} catch {}
						Re();
					} catch (e) {
						console.debug?.(e);
					}
					H || (V = requestAnimationFrame(k));
				}
			};
			be = k;
			let _e = (e) => C(e, { preventDefault: !0 });
			ae.addEventListener("click", (e) => {
				_e(e), Be(), Xe();
			}), oe.addEventListener("click", (e) => {
				_e(e), W && (W.visible = !W.visible), Xe(), Fe();
			}), he.addEventListener("click", (e) => {
				_e(e), Ve(q === D.PERSPECTIVE ? D.ORTHOGRAPHIC : D.PERSPECTIVE);
			}), ge.addEventListener("click", (e) => {
				_e(e), Ne = !Ne, j.panel.style.display = Ne ? "block" : "none", Xe();
			}), H || k();
		} catch (e) {
			console.warn("[MJR 3D] preview init failed", e), Ie("Failed to load 3D preview", String(e?.message || "Three.js initialization failed.")), A.style.display = "none";
		}
	}).catch((e) => {
		if (!N) {
			console.warn("[MJR 3D] preview init unhandled error", e);
			try {
				Ie("Failed to load 3D preview", String(e?.message || "Initialization failed."));
			} catch {}
			try {
				A.style.display = "none";
			} catch {}
		}
	}), g;
}
//#endregion
//#region js/features/viewer/model3dRenderer.js
var ye = /* @__PURE__ */ e({
	MODEL3D_EXTS: () => oe,
	MODEL3D_EXT_TO_LOADER: () => ae,
	PREVIEWABLE_MODEL3D_LOADERS: () => se,
	buildModel3DMouseButtons: () => ve,
	createModel3DMediaElement: () => N,
	findModel3DCanvas: () => j,
	getModel3DDefaultControlHint: () => A,
	isModel3DAsset: () => ge,
	isModel3DInteractionTarget: () => M,
	resolveModel3DLoader: () => _e
});
//#endregion
export { M as a, v as c, ge as i, oe as n, b as o, N as r, y as s, ye as t };
