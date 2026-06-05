import { t as e } from "./rolldown-runtime-Dy4uBu1J.js";
import { it as t, l as n, t as r } from "./config-eqarUfKd.js";
import { r as i } from "./events-BnkL6-b6.js";
import { n as a } from "./state-DPiaUMw1.js";
//#region ui/features/viewer/model3dCore.ts
function o(e, t) {
	if (!(!e || typeof t != "function")) try {
		e.traverse?.((e) => {
			(e?.isMesh || e?.isPoints || e?.isLine) && t(e);
		});
	} catch (e) {
		console.debug?.(e);
	}
}
function s(e) {
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
function c(e) {
	let t = /* @__PURE__ */ new Map();
	return o(e, (e) => {
		t.set(e.uuid, e.material);
	}), t;
}
function l(e, t, n, r, i) {
	o(t, (t) => {
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
function u(e) {
	if (e) {
		for (let t of e) try {
			t?.dispose?.();
		} catch (e) {
			console.debug?.(e);
		}
		e.clear();
	}
}
function d(e, t) {
	try {
		if (t === "gltf" || t === "fbx") return Array.isArray(e?.animations) ? e.animations : [];
	} catch (e) {
		console.debug?.(e);
	}
	return [];
}
function f(e, t) {
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
function p(e, t, n, r) {
	if (!r || !t || !n) return;
	let i = t.fov * (Math.PI / 180), a = r.maxDim / (2 * Math.tan(i / 2)) * 1.55, o = new e.Vector3(1, .8, 1).normalize();
	t.position.copy(r.center).addScaledVector(o, a), t.near = Math.max(.01, a / 250), t.far = Math.max(1e3, a * 60), t.updateProjectionMatrix(), n.target.copy(r.center), n.minDistance = Math.max(.01, a / 25), n.maxDistance = Math.max(10, a * 12), n.minZoom = .25, n.maxZoom = 12, n.update();
}
function m(e, t, n, r) {
	if (!n || !e || !t) return null;
	let i = Math.max(1e-4, Number(r) || 1), a = Math.max(n.maxDim * 1.9, 2), o = a * i;
	return e.left = -o / 2, e.right = o / 2, e.top = a / 2, e.bottom = -a / 2, e.near = -Math.max(1e3, n.maxDim * 40), e.far = Math.max(1e3, n.maxDim * 40), e.zoom = 1, e.position.copy(n.center).add({
		x: n.radius * 2.1,
		y: n.radius * 1.6,
		z: n.radius * 2.1
	}), e.updateProjectionMatrix(), t.target.copy(n.center), t.minZoom = .25, t.maxZoom = 12, t.minDistance = 0, t.maxDistance = Math.max(10, n.maxDim * 12), t.update(), a;
}
function h(e, t, n) {
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
var g = "/mjr/am/vendor/three", _ = null;
function v(e, t, n) {
	switch (t) {
		case "gltf": return new e.GLTFLoader(n);
		case "obj": return new e.OBJLoader(n);
		case "fbx": return new e.FBXLoader(n);
		case "stl": return new e.STLLoader(n);
		case "ply": return new e.PLYLoader(n);
		default: return null;
	}
}
function ee(e, t, n) {
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
	return _ || (_ = Promise.all([
		import(
			/* @vite-ignore */
			`${g}/three.module.js`
),
		import(
			/* @vite-ignore */
			`${g}/addons/controls/OrbitControls.js`
),
		import(
			/* @vite-ignore */
			`${g}/addons/loaders/GLTFLoader.js`
),
		import(
			/* @vite-ignore */
			`${g}/addons/loaders/FBXLoader.js`
),
		import(
			/* @vite-ignore */
			`${g}/addons/loaders/OBJLoader.js`
),
		import(
			/* @vite-ignore */
			`${g}/addons/loaders/MTLLoader.js`
),
		import(
			/* @vite-ignore */
			`${g}/addons/loaders/STLLoader.js`
),
		import(
			/* @vite-ignore */
			`${g}/addons/loaders/PLYLoader.js`
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
	})), _);
}
//#endregion
//#region ui/features/viewer/processorUtils.ts
function y(e, t, n) {
	try {
		let r = Number(e) || 0, i = (Number(t) || 0) * (Number(n) || 0);
		return !(i > 0) || !(r > 0) || i <= r ? 1 : Math.max(.05, Math.min(1, Math.sqrt(r / i)));
	} catch {
		return 1;
	}
}
//#endregion
//#region ui/features/viewer/imageProcessor.ts
function b(e, t, n) {
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
function x({ canvas: e, url: t, getGradeParams: n, isDefaultGrade: r, _tonemap: i, maxProcPixels: o, onReady: s } = {}) {
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
	}, m = (e, t) => y(o, e, t), h = () => {
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
		let o = h();
		if (!o?.data) return;
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
		let m = i || n?.() || {}, g = Number(m.exposureEV) || 0, _ = 1 / Math.max(.1, Math.min(3, Number(m.gamma) || 1)), v = String(m.channel || "rgb"), ee = String(m.analysisMode || "none"), te = a(m.zebraThreshold ?? .95), y = 2 ** g, b = new Float32Array(256);
		for (let e = 0; e < 256; e++) b[e] = (e / 255) ** _;
		let x = d.data, S = o.data, C = s * c * 4, w = 0, T = () => {
			if (f._destroyed || !e?.isConnected || t !== f.jobId) return;
			let n = Math.min(C, w + 22e4);
			for (; w < n; w += 4) {
				let e = (S[w] ?? 0) / 255, t = (S[w + 1] ?? 0) / 255, n = (S[w + 2] ?? 0) / 255, r = (S[w + 3] ?? 255) / 255, i = e * y, o = t * y, c = n * y, l = .2126 * i + .7152 * o + .0722 * c;
				if (ee === "zebra") if (a(l) >= te) {
					let e = (Math.floor(w / 4) % s + Math.floor(w / 4 / s) & 7) < 3;
					i = +!!e, o = +!!e, c = +!!e;
				} else i = b[a(i) * 255 + .5 | 0], o = b[a(o) * 255 + .5 | 0], c = b[a(c) * 255 + .5 | 0];
				else i = b[a(i) * 255 + .5 | 0], o = b[a(o) * 255 + .5 | 0], c = b[a(c) * 255 + .5 | 0];
				if (v === "r") o = i, c = i;
				else if (v === "g") i = o, c = o;
				else if (v === "b") i = c, o = c;
				else if (v === "a") i = r, o = r, c = r;
				else if (v === "l") {
					let e = b[a(l) * 255 + .5 | 0];
					i = e, o = e, c = e;
				}
				x[w] = Math.round(a(i) * 255), x[w + 1] = Math.round(a(o) * 255), x[w + 2] = Math.round(a(c) * 255), x[w + 3] = 255;
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
	}, ee = () => {
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
	}, te = () => {
		f.ready = !1;
		try {
			b(e, "Failed to load image");
		} catch (e) {
			console.debug?.(e);
		}
	};
	try {
		c.onload = ee, c.onerror = te;
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
var S = [
	.25,
	.5,
	1,
	1.5,
	2
], C = 44;
function w(e, { preventDefault: t = !1, immediate: n = !1 } = {}) {
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
function T(e) {
	let t = Math.max(0, Number(e) || 0), n = Math.floor(t / 60), r = Math.floor(t % 60);
	return n > 0 ? `${n}:${String(r).padStart(2, "0")}` : `${Math.floor(t)}s`;
}
function E(e, t) {
	let r = document.createElement("button");
	return r.type = "button", r.textContent = String(e || ""), r.title = String(t || e || ""), r.setAttribute("aria-label", String(t || e || n("model3d.viewportAction", "3D viewport action"))), r.style.cssText = [
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
function O(e, t, r = "", i = "#4CAF50") {
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
		e.addColorStop(0, "#0f1419"), e.addColorStop(1, "#11181f"), a.fillStyle = e, a.fillRect(0, 0, o, s), a.save(), a.translate(c, l - 32), a.strokeStyle = i, a.lineWidth = 3, a.globalAlpha = .95, a.beginPath(), a.moveTo(0, -44), a.lineTo(42, -22), a.lineTo(42, 22), a.lineTo(0, 44), a.lineTo(-42, 22), a.lineTo(-42, -22), a.closePath(), a.stroke(), a.beginPath(), a.moveTo(0, -44), a.lineTo(0, 0), a.lineTo(42, 22), a.moveTo(0, 0), a.lineTo(-42, 22), a.moveTo(-42, -22), a.lineTo(0, 0), a.moveTo(42, -22), a.lineTo(0, 0), a.stroke(), a.restore(), a.fillStyle = "rgba(255,255,255,0.94)", a.font = "600 18px system-ui, sans-serif", a.textAlign = "center", a.textBaseline = "middle", a.fillText(String(t || n("model3d.preview", "3D preview")), c, l + 44), r && (a.fillStyle = "rgba(255,255,255,0.62)", a.font = "13px system-ui, sans-serif", a.fillText(String(r), c, l + 72));
	} catch (i) {
		console.debug?.(i);
		try {
			b(e, t, r || n("model3d.unavailable", "3D viewer unavailable"));
		} catch (e) {
			console.debug?.(e);
		}
	}
}
function ne({ defaultBgColor: e, defaultFov: t, defaultLightIntensity: r, hasSkeleton: i } = {}) {
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
		a.addEventListener(e, (e) => w(e, { preventDefault: !1 }));
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
	u.type = "color", u.value = e || "#282828", u.style.cssText = "width:34px;height:24px;cursor:pointer;border:1px solid rgba(255,255,255,0.18);border-radius:4px;padding:1px;background:none;flex-shrink:0;", s(n("model3d.background", "Background"), u), o("Model");
	let d = c([
		["original", "Original"],
		["normal", "Normal map"],
		["depth", "Depth"],
		["wireframe", "Wireframe"],
		["pointcloud", "Point cloud"]
	], "original");
	s(n("model3d.material", "Material"), d);
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
	i && (m = document.createElement("input"), m.type = "checkbox", m.checked = !1, m.style.cssText = "cursor:pointer;accent-color:#4CAF50;flex-shrink:0;", p = s(n("model3d.skeleton", "Skeleton"), m)), o("Camera");
	let h = l(15, 120, 1, t ?? 75);
	s("FOV", h.wrap), o(n("model3d.lights", "Lights"));
	let g = l(0, 5, .1, r ?? 1);
	return s(n("model3d.intensity", "Intensity"), g.wrap), {
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
function re() {
	let e = document.createElement("div");
	e.className = "mjr-model3d-anim-bar", e.style.cssText = [
		"position:absolute",
		"bottom:0",
		"left:0",
		"right:0",
		`height:${C}px`,
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
		e.addEventListener(t, (e) => w(e, { preventDefault: !1 }));
	});
	let t = document.createElement("button");
	t.type = "button", t.textContent = n("model3d.play", "Play"), t.title = n("model3d.playPause", "Play / Pause"), t.style.cssText = [
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
	r.title = n("model3d.playbackSpeed", "Playback speed"), r.style.cssText = [
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
	for (let e of S) {
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
	].join(";"), o.textContent = "0s / 0s", e.appendChild(t), e.appendChild(r), e.appendChild(i), e.appendChild(a), e.appendChild(o), {
		bar: e,
		playBtn: t,
		speedSel: r,
		animSel: i,
		progressSlider: a,
		timeLbl: o
	};
}
//#endregion
//#region ui/features/viewer/model3dRenderer.impl.ts
var ie = Object.freeze({
	".gltf": "gltf",
	".glb": "gltf",
	".obj": "obj",
	".fbx": "fbx",
	".stl": "stl",
	".ply": "ply",
	".splat": "splat",
	".ksplat": "splat",
	".spz": "splat"
}), k = new Set(Object.keys(ie)), ae = new Set([
	"gltf",
	"obj",
	"fbx",
	"stl",
	"ply"
]), oe = "#282828", se = n("model3d.controlHint", "Rotate: left drag  Pan: right drag  Zoom: wheel"), A = Object.freeze({
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
var ce = Object.freeze({
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
}), le = 75, ue = 1, j = Object.freeze({
	ambient: .5,
	main: .8,
	fill: .3,
	back: .3,
	rim: .3,
	bottom: .2
});
function de(e) {
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
function fe(e) {
	let t = String(e || "").trim();
	return t ? t.startsWith("/") || /^[a-z][\w+\-.]*:/i.test(t) : !1;
}
function pe(e) {
	return String(e?.loader || e?.viewer_info?.loader || "").trim().toLowerCase() || ie[de(e)] || "";
}
function me(e) {
	return String(e?.kind || "").toLowerCase() === "model3d" ? !0 : k.has(de(e));
}
function he(e) {
	return pe(e) || "gltf";
}
function M() {
	return se;
}
function N(e) {
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
function P(e) {
	try {
		return !!e?.closest?.(".mjr-model3d-host, .mjr-viewer-model3d-host, .mjr-mfv-model3d-host");
	} catch {
		return !1;
	}
}
function ge(e, t) {
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
function F(e, a, o = {}) {
	let g = o?.pauseDuringExecution == null ? !!r?.VIEWER_PAUSE_DURING_EXECUTION : !!o.pauseDuringExecution, _ = document.createElement("div");
	_.className = o.hostClassName || "mjr-model3d-host mjr-viewer-model3d-host", _.style.cssText = o.hostStyle || [
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
	].join(";"), _.setAttribute("data-capture-wheel", "true"), _.tabIndex = -1;
	let y = document.createElement("canvas");
	y.className = o.canvasClassName || "mjr-viewer-media mjr-model3d-render-canvas", y.style.cssText = o.canvasStyle || [
		"display:block",
		"width:100%",
		"height:100%",
		"max-width:100%",
		"max-height:100%",
		"outline:none",
		"touch-action:none"
	].join(";"), y.tabIndex = 0, y._mjrDisableViewerTransform = o.disableViewerTransform !== !1;
	try {
		e?.id != null && (y.dataset.mjrAssetId = String(e.id));
	} catch (e) {
		console.debug?.(e);
	}
	_.appendChild(y);
	let b = document.createElement("canvas");
	b.className = "mjr-model3d-status", b.style.cssText = [
		"position:absolute",
		"inset:0",
		"display:block",
		"width:100%",
		"height:100%",
		"pointer-events:none",
		"z-index:1"
	].join(";"), _.appendChild(b);
	let x = de(e).replace(".", "").toUpperCase();
	if (x) {
		let e = document.createElement("div");
		e.className = "mjr-model3d-badge", e.textContent = x, e.style.cssText = [
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
		].join(";"), _.appendChild(e);
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
	let ie = E(n("model3d.reset", "Reset"), n("model3d.resetView", "Reset 3D view")), k = E(n("model3d.grid", "Grid"), n("model3d.toggleGrid", "Toggle grid")), pe = E(n("model3d.persp", "Persp"), n("model3d.switchCamera", "Switch perspective / orthographic")), me = E(n("model3d.settings", "Settings"), n("model3d.settings", "Settings"));
	C.append(ie, k, pe, me), S.appendChild(C), _.appendChild(S);
	let M = document.createElement("div");
	M.className = "mjr-model3d-hint", M.textContent = o.hintText || se, M.style.cssText = [
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
	].join(";"), _.appendChild(M);
	let N = ne({
		defaultBgColor: oe,
		defaultFov: le,
		defaultLightIntensity: ue,
		hasSkeleton: !1
	});
	_.appendChild(N.panel);
	let P = re();
	_.appendChild(P.bar);
	let F = !1, _e = null, I = null, L = null, R = null, z = null, B = null, V = null, H = null, U = null, ve = null, ye = !1, be = null, xe = null, W = null, G = null, Se = null, K = null, Ce = 0, q = A.PERSPECTIVE, we = /* @__PURE__ */ new Map(), Te = /* @__PURE__ */ new Set(), J = null, Ee = !1, De = null, Oe = [], Y = ue, X = null, ke = null, Z = [], Q = [], $ = 0, Ae = 1, je = !1, Me = !1, Ne = !1, Pe = String(e?.filename || "3D model"), Fe = () => {
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
		}, b.style.display = "block", O(b, e, t, n);
	}, Le = () => {
		be = null, b.style.display = "none";
	}, Re = () => {
		try {
			let e = _.getBoundingClientRect();
			y._mjrNaturalW = Math.max(1, Math.round(e.width || y.width || 1)), y._mjrNaturalH = Math.max(1, Math.round(e.height || y.height || 1));
		} catch (e) {
			console.debug?.(e);
		}
		try {
			be && O(b, be.title, be.hintText, be.accent);
		} catch (e) {
			console.debug?.(e);
		}
	}, ze = (e, t) => {
		if (!V || !(Ce > 0)) return;
		let n = Math.max(1e-4, (Number(e) || 1) / Math.max(1, Number(t) || 1)), r = Ce * n;
		V.left = -r / 2, V.right = r / 2, V.top = Ce / 2, V.bottom = -Ce / 2, V.updateProjectionMatrix();
	}, Be = () => {
		if (!(!G || !H || !K)) {
			if (q === A.ORTHOGRAPHIC) {
				let e = _.getBoundingClientRect();
				Ce = m(V, H, K, Math.max(1e-4, (e.width || 1) / Math.max(1, e.height || 1))) || Ce, z = V;
			} else p(I, B, H, K), z = B;
			try {
				H.object = z, H.update();
			} catch (e) {
				console.debug?.(e);
			}
		}
	}, Ve = (e, { refit: t = !0 } = {}) => {
		q = e === A.ORTHOGRAPHIC ? A.ORTHOGRAPHIC : A.PERSPECTIVE, z = q === A.ORTHOGRAPHIC ? V : B;
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
			De && (De.intensity = j.ambient * Y);
		} catch (e) {
			console.debug?.(e);
		}
		let t = [
			j.main,
			j.back,
			j.fill,
			j.fill,
			j.bottom
		];
		Oe.forEach((e, n) => {
			try {
				e && (e.intensity = (t[n] ?? j.fill) * Y);
			} catch (e) {
				console.debug?.(e);
			}
		});
	}, Ue = (e) => {
		!Se || !I || (u(Te), l(I, Se, e, we, Te), Fe());
	}, We = (e) => {
		if (!G) return;
		let t = ce[e] || [
			0,
			0,
			0
		];
		try {
			G.rotation.set(t[0], t[1], t[2]), G.updateMatrixWorld(!0);
		} catch (e) {
			console.debug?.(e);
		}
		I && (K = f(I, G)), Be();
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
			P.timeLbl.textContent = `${T(n)} / ${T(t)}`;
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
		let t = Z[e];
		if (!t) return;
		Q.forEach((e) => {
			try {
				e?.stop();
			} catch (e) {
				console.debug?.(e);
			}
		});
		let r = X.clipAction(t);
		r.timeScale = Ae, r.clampWhenFinished = !1, r.loop = I?.LoopRepeat ?? 2201, r.play(), Q[e] = r, $ = e, je = !0, P.playBtn.textContent = n("model3d.pause", "Pause");
		try {
			let e = Math.max(100, Math.min(1e4, Math.round((t.duration || 1) * 100)));
			P.progressSlider.max = String(e);
		} catch {}
	}, Je = () => {
		!X || !Z.length || (je ? (X.timeScale = 0, je = !1, P.playBtn.textContent = n("model3d.play", "Play")) : (X.timeScale = Ae, Q[$]?.isRunning?.() ? (je = !0, P.playBtn.textContent = n("model3d.pause", "Pause")) : qe($)));
	}, Ye = (e, t) => {
		!e || e.length === 0 || !I || (Z = e, X = new I.AnimationMixer(t), ke = new I.Clock(), Q = Array(e.length).fill(null), P.animSel.innerHTML = "", e.forEach((e, t) => {
			let n = document.createElement("option");
			n.value = String(t), n.textContent = e.name || `Animation ${t + 1}`, P.animSel.appendChild(n);
		}), P.animSel.style.display = e.length > 1 ? "" : "none", P.bar.style.display = "flex", M.style.bottom = "54px", qe(0), P.playBtn.addEventListener("click", (e) => {
			w(e), Je();
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
				e.time = Math.max(0, Math.min(r, t.duration)), P.timeLbl.textContent = `${T(r)} / ${T(t.duration)}`;
			}
		}));
	}, Xe = () => {
		D(k, !!W?.visible), D(pe, q === A.ORTHOGRAPHIC), pe.textContent = q === A.ORTHOGRAPHIC ? n("model3d.ortho", "Ortho") : n("model3d.persp", "Persp"), D(me, Ne);
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
		let e = Math.max(1, Math.min(179, Number(N.fovSlider.value) || le));
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
		return t(_, "pointerdown", () => {
			try {
				y.focus?.();
			} catch (e) {
				console.debug?.(e);
			}
		}), t(_, "wheel", (e) => w(e)), t(_, "contextmenu", (e) => w(e, { preventDefault: !0 })), t(_, "dragstart", (e) => w(e, { preventDefault: !0 })), t(_, "dragover", (e) => w(e, { preventDefault: !0 })), t(_, "dragleave", (e) => w(e)), t(_, "drop", (e) => w(e, { preventDefault: !0 })), () => {
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
			_._mjr3D = null;
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
			_e?.disconnect?.();
		} catch (e) {
			console.debug?.(e);
		}
		_e = null;
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
		X = null, Q = [], Z = [], u(Te);
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
			_._mjrAxisScene &&= (_._mjrAxisScene.traverse?.((e) => {
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
			let e = y.getContext("webgl2") || y.getContext("webgl");
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
		if (g) {
			if (String(e?.detail?.active_prompt_id || "").trim()) {
				$e();
				return;
			}
			et();
		}
	};
	y._mjrProc = {
		setParams: () => {},
		destroy: Qe,
		captureCanvas: () => y,
		pause: $e,
		resume: et
	};
	try {
		g && (window.addEventListener(i.RUNTIME_STATUS, tt), String(window.__MJR_EXECUTION_RUNTIME__?.active_prompt_id || "").trim() && (ye = !0));
	} catch (e) {
		console.debug?.(e);
	}
	return Ie("Preparing 3D preview", Pe), Promise.resolve().then(async () => {
		let r = he(e);
		if (!ae.has(r)) {
			if (Ie("3D preview unavailable", `${r.toUpperCase()} is not supported in the embedded viewer.`), M.style.display = "none", a) try {
				let t = document.createElement("a");
				t.href = a, t.download = String(e?.filename || "model"), t.textContent = n("model3d.downloadFile", "Download {file}", { file: String(e?.filename || "file") }), t.style.cssText = [
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
				].join(";"), _.appendChild(t);
			} catch {}
			return;
		}
		try {
			let n = await te();
			if (F) return;
			let i = n.THREE;
			I = i;
			let l = new i.LoadingManager();
			l.setURLModifier((n) => {
				if (!n || fe(n)) return n;
				let r = t(e, n);
				if (r) return r;
				try {
					return new URL(n, a).href;
				} catch {
					return n;
				}
			}), L = new i.WebGLRenderer({
				canvas: y,
				antialias: !0,
				alpha: !0,
				preserveDrawingBuffer: !0
			}), L.outputColorSpace = i.SRGBColorSpace, L.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)), R = new i.Scene(), R.background = new i.Color(oe), B = new i.PerspectiveCamera(le, 16 / 9, .01, 1e4), V = new i.OrthographicCamera(-1, 1, 1, -1, -1e4, 1e4), z = B, H = new n.OrbitControls(z, y), H.enableDamping = !0, H.dampingFactor = .08, H.rotateSpeed = .82, H.zoomSpeed = 1, H.panSpeed = .9, H.screenSpacePanning = !0, H.mouseButtons = ge(null, i.MOUSE), xe = Ze(), De = new i.AmbientLight(16777215, j.ambient * Y), R.add(De);
			let u = new i.DirectionalLight(16777215, j.main * Y);
			u.position.set(0, 10, 10);
			let p = new i.DirectionalLight(16777215, j.back * Y);
			p.position.set(-10, 0, -10);
			let m = new i.DirectionalLight(15266047, j.fill * Y);
			m.position.set(10, 5, -5);
			let g = new i.DirectionalLight(16773352, j.fill * Y);
			g.position.set(-10, 5, 5);
			let b = new i.DirectionalLight(16777215, j.bottom * Y);
			b.position.set(0, -10, 0), Oe = [
				u,
				p,
				m,
				g,
				b
			], Oe.forEach((e) => R.add(e)), W = new i.GridHelper(20, 20, 5068128, 3094338), R.add(W);
			let x = () => {
				if (F || !L || !z) return;
				let e = _.getBoundingClientRect(), t = Math.max(1, Math.round(e.width || y.clientWidth || 1)), n = Math.max(1, Math.round(e.height || y.clientHeight || 1));
				L.setSize(t, n, !1), B && (B.aspect = t / n, B.updateProjectionMatrix()), ze(t, n), Re(), Fe();
			};
			typeof ResizeObserver < "u" && (_e = new ResizeObserver(() => x()), _e.observe(_));
			let S = v(n, r, l);
			if (!S) {
				Ie("3D loader unavailable", `${r.toUpperCase()} loader could not be created.`), M.style.display = "none";
				return;
			}
			if (r === "obj" && n.MTLLoader) try {
				let e = a.replace(/\.obj(\?.*)?$/i, (e, t) => `.mtl${t || ""}`), t = new n.MTLLoader(l), r = await new Promise((n) => {
					t.load(e, n, void 0, () => n(null));
				});
				r && !F && (r.preload(), S.setMaterials(r));
			} catch (e) {
				console.debug?.("[MJR 3D] MTL load skipped:", e?.message);
			}
			let C = await ee(S, r, a);
			if (F) return;
			let T = h(i, r, C);
			if (!T) {
				Ie("Empty 3D scene", "The loader returned no renderable object."), M.style.display = "none";
				return;
			}
			try {
				let e = new i.Box3().setFromObject(T);
				if (!e.isEmpty()) {
					let t = e.getSize(new i.Vector3()), n = e.getCenter(new i.Vector3()), r = 5 / Math.max(t.x, t.y, t.z, .001);
					T.scale.multiplyScalar(r), e.setFromObject(T), e.getCenter(n), T.position.set(-n.x, -e.min.y, -n.z);
				}
			} catch (e) {
				console.debug?.("[MJR 3D] normalize skipped:", e);
			}
			if (Se = T, G = new i.Group(), G.add(T), R.add(G), we = c(T), Ee = s(T), Ee) {
				J = new i.SkeletonHelper(T), J.visible = !1, R.add(J);
				let e = ne({
					defaultBgColor: oe,
					defaultFov: le,
					defaultLightIntensity: ue,
					hasSkeleton: !0
				});
				_.replaceChild(e.panel, N.panel), Object.assign(N, e), N.bgInput.addEventListener("input", () => {
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
					let e = Math.max(1, Math.min(179, Number(N.fovSlider.value) || le));
					try {
						B && (B.fov = e, B.updateProjectionMatrix());
					} catch (e) {
						console.debug?.(e);
					}
				}), N.lightSlider.addEventListener("input", () => {
					He(Number(N.lightSlider.value));
				});
			}
			K = f(i, G), K && (W.position.y = K.box.min.y), q = A.PERSPECTIVE, Be(), x(), Le(), Xe();
			let E = d(C, r);
			E.length > 0 && Ye(E, T);
			let D = new i.Scene();
			_._mjrAxisScene = D;
			let O = new i.PerspectiveCamera(50, 1, .1, 100);
			O.position.set(0, 0, 3.2), O.lookAt(0, 0, 0);
			let re = [
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
			], ae = new i.SphereGeometry(.1, 12, 8), se = new i.SphereGeometry(.08, 10, 6), ce = new i.MeshBasicMaterial({ color: 13421772 });
			D.add(new i.Mesh(se, ce));
			for (let { dir: e, color: t } of re) {
				let n = new i.LineBasicMaterial({ color: t }), r = [new i.Vector3(0, 0, 0), new i.Vector3(e[0], e[1], e[2])], a = new i.BufferGeometry().setFromPoints(r);
				D.add(new i.Line(a, n));
				let o = new i.MeshBasicMaterial({ color: t }), s = new i.Mesh(ae, o);
				s.position.set(e[0], e[1], e[2]), D.add(s);
			}
			_._mjr3D = {
				controls: H,
				get camera() {
					return z;
				}
			};
			try {
				o.onReady?.({
					canvas: y,
					host: _,
					object: G,
					renderer: L,
					camera: z,
					controls: H
				});
			} catch (e) {
				console.debug?.(e);
			}
			Fe();
			let de = () => {
				if (!(F || ye || !L || !R || !z)) {
					try {
						if (H?.update?.(), X && ke) {
							let e = ke.getDelta();
							je && X.update(e), Ke();
						}
						L.setScissorTest(!1), L.setViewport(0, 0, y.width, y.height), L.render(R, z);
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
					ye || (U = requestAnimationFrame(de));
				}
			};
			ve = de;
			let he = (e) => w(e, { preventDefault: !0 });
			ie.addEventListener("click", (e) => {
				he(e), Be(), Xe();
			}), k.addEventListener("click", (e) => {
				he(e), W && (W.visible = !W.visible), Xe(), Fe();
			}), pe.addEventListener("click", (e) => {
				he(e), Ve(q === A.PERSPECTIVE ? A.ORTHOGRAPHIC : A.PERSPECTIVE);
			}), me.addEventListener("click", (e) => {
				he(e), Ne = !Ne, N.panel.style.display = Ne ? "block" : "none", Xe();
			}), ye || de();
		} catch (e) {
			console.warn("[MJR 3D] preview init failed", e), Ie("Failed to load 3D preview", String(e?.message || "Three.js initialization failed.")), M.style.display = "none";
		}
	}).catch((e) => {
		if (!F) {
			console.warn("[MJR 3D] preview init unhandled error", e);
			try {
				Ie("Failed to load 3D preview", String(e?.message || "Initialization failed."));
			} catch {}
			try {
				M.style.display = "none";
			} catch {}
		}
	}), _;
}
//#endregion
//#region ui/features/viewer/model3dRenderer.ts
var _e = /* @__PURE__ */ e({
	MODEL3D_EXTS: () => k,
	MODEL3D_EXT_TO_LOADER: () => ie,
	PREVIEWABLE_MODEL3D_LOADERS: () => ae,
	buildModel3DMouseButtons: () => ge,
	createModel3DMediaElement: () => F,
	findModel3DCanvas: () => N,
	getModel3DDefaultControlHint: () => M,
	isModel3DAsset: () => me,
	isModel3DInteractionTarget: () => P,
	resolveModel3DLoader: () => he
});
//#endregion
export { P as a, y as c, me as i, k as n, x as o, F as r, b as s, _e as t };
