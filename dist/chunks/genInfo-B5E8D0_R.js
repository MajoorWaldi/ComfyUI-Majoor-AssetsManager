import { in as e, or as t, t as n } from "./config-C9a-wT5M.js";
import { m as r, p as i, v as a } from "./generationSectionState-BQ1Yzk6L.js";
import { r as o } from "./events-1iwo5blr.js";
import { $ as s, B as c, C as l, D as u, E as d, H as ee, J as te, M as f, O as p, P as ne, Q as m, S as h, T as g, V as _, W as v, X as re, b as y, gt as b, ht as x, j as S, k as C, mt as w, pt as T, q as ie, st as E } from "./mjr-primevue-C07IsEdU.js";
// ui/features/viewer/model3dCore.ts
function ae(e, t) {
	if (e && typeof t == "function") try {
		e.traverse?.((e) => {
			(e?.isMesh || e?.isPoints || e?.isLine) && t(e);
		});
	} catch (e) {
		console.debug?.(e);
	}
}
function oe(e) {
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
function se(e) {
	let t = /* @__PURE__ */ new Map();
	return ae(e, (e) => {
		t.set(e.uuid, e.material);
	}), t;
}
function D(e, t, n, r, i) {
	ae(t, (t) => {
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
function ce(e) {
	if (e) {
		for (let t of e) try {
			t?.dispose?.();
		} catch (e) {
			console.debug?.(e);
		}
		e.clear();
	}
}
function le(e, t) {
	try {
		if (t === "gltf" || t === "fbx") return Array.isArray(e?.animations) ? e.animations : [];
	} catch (e) {
		console.debug?.(e);
	}
	return [];
}
function ue(e, t) {
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
function de(e, t, n, r) {
	if (!r || !t || !n) return;
	let i = t.fov * (Math.PI / 180), a = r.maxDim / (2 * Math.tan(i / 2)) * 1.55, o = new e.Vector3(1, .8, 1).normalize();
	t.position.copy(r.center).addScaledVector(o, a), t.near = Math.max(.01, a / 250), t.far = Math.max(1e3, a * 60), t.updateProjectionMatrix(), n.target.copy(r.center), n.minDistance = Math.max(.01, a / 25), n.maxDistance = Math.max(10, a * 12), n.minZoom = .25, n.maxZoom = 12, n.update();
}
function O(e, t, n, r) {
	if (!n || !e || !t) return null;
	let i = Math.max(1e-4, Number(r) || 1), a = Math.max(n.maxDim * 1.9, 2), o = a * i;
	return e.left = -o / 2, e.right = o / 2, e.top = a / 2, e.bottom = -a / 2, e.near = -Math.max(1e3, n.maxDim * 40), e.far = Math.max(1e3, n.maxDim * 40), e.zoom = 1, e.position.copy(n.center).add({
		x: n.radius * 2.1,
		y: n.radius * 1.6,
		z: n.radius * 2.1
	}), e.updateProjectionMatrix(), t.target.copy(n.center), t.minZoom = .25, t.maxZoom = 12, t.minDistance = 0, t.maxDistance = Math.max(10, n.maxDim * 12), t.update(), a;
}
function k(e, t, n) {
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
// ui/features/viewer/model3dLoaders.ts
var A = "/mjr/am/vendor/three", fe = null;
function pe(e, t, n) {
	switch (t) {
		case "gltf": return new e.GLTFLoader(n);
		case "obj": return new e.OBJLoader(n);
		case "fbx": return new e.FBXLoader(n);
		case "stl": return new e.STLLoader(n);
		case "ply": return new e.PLYLoader(n);
		default: return null;
	}
}
function j(e, t, n) {
	return new Promise((t, r) => {
		!e || !n ? r(/* @__PURE__ */ Error("Missing loader or URL")) : typeof e.loadAsync == "function" ? e.loadAsync(n).then(t).catch(r) : e.load(n, t, void 0, r);
	});
}
function M() {
	return fe || (fe = Promise.all([
		import(
			/* @vite-ignore */
			`${A}/three.module.js`
),
		import(
			/* @vite-ignore */
			`${A}/addons/controls/OrbitControls.js`
),
		import(
			/* @vite-ignore */
			`${A}/addons/loaders/GLTFLoader.js`
),
		import(
			/* @vite-ignore */
			`${A}/addons/loaders/FBXLoader.js`
),
		import(
			/* @vite-ignore */
			`${A}/addons/loaders/OBJLoader.js`
),
		import(
			/* @vite-ignore */
			`${A}/addons/loaders/MTLLoader.js`
),
		import(
			/* @vite-ignore */
			`${A}/addons/loaders/STLLoader.js`
),
		import(
			/* @vite-ignore */
			`${A}/addons/loaders/PLYLoader.js`
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
	})), fe);
}
// ui/features/viewer/imageProcessor.ts
function N(e, t, n) {
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
// ui/features/viewer/model3dSupport.ts
var P = [
	.25,
	.5,
	1,
	1.5,
	2
], F = 44;
function I(e, { preventDefault: t = !1, immediate: n = !1 } = {}) {
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
function L(e) {
	let t = Math.max(0, Number(e) || 0), n = Math.floor(t / 60), r = Math.floor(t % 60);
	return n > 0 ? `${n}:${String(r).padStart(2, "0")}` : `${Math.floor(t)}s`;
}
function R(t, n) {
	let r = document.createElement("button");
	return r.type = "button", r.textContent = String(t || ""), r.title = String(n || t || ""), r.setAttribute("aria-label", String(n || t || e("model3d.viewportAction", "3D viewport action"))), r.style.cssText = "height:28px;padding:0 10px;border-radius:999px;border:1px solid rgba(255,255,255,0.16);background:rgba(13,15,20,0.78);color:rgba(255,255,255,0.92);font:600 11px system-ui,sans-serif;letter-spacing:0.02em;cursor:pointer;backdrop-filter:blur(8px);display:inline-flex;align-items:center;justify-content:center;box-shadow:0 4px 18px rgba(0,0,0,0.24)", r;
}
function z(e, t) {
	if (!e) return;
	let n = !!t;
	e.dataset.active = n ? "1" : "0", e.style.background = n ? "rgba(76,175,80,0.18)" : "rgba(13,15,20,0.78)", e.style.borderColor = n ? "rgba(76,175,80,0.42)" : "rgba(255,255,255,0.16)", e.style.color = n ? "rgba(230,255,235,0.96)" : "rgba(255,255,255,0.92)";
}
function B(t, n, r = "", i = "#4CAF50") {
	if (!t) return;
	try {
		let e = Math.max(480, Number(t.width) || 960), n = Math.max(270, Number(t.height) || 540);
		t.width = e, t.height = n;
	} catch (e) {
		console.debug?.(e);
	}
	let a = (() => {
		try {
			return t.getContext("2d");
		} catch {
			return null;
		}
	})();
	if (!a) return;
	let o = Number(t.width) || 960, s = Number(t.height) || 540, c = o / 2, l = s / 2;
	try {
		let t = a.createLinearGradient(0, 0, o, s);
		t.addColorStop(0, "#0f1419"), t.addColorStop(1, "#11181f"), a.fillStyle = t, a.fillRect(0, 0, o, s), a.save(), a.translate(c, l - 32), a.strokeStyle = i, a.lineWidth = 3, a.globalAlpha = .95, a.beginPath(), a.moveTo(0, -44), a.lineTo(42, -22), a.lineTo(42, 22), a.lineTo(0, 44), a.lineTo(-42, 22), a.lineTo(-42, -22), a.closePath(), a.stroke(), a.beginPath(), a.moveTo(0, -44), a.lineTo(0, 0), a.lineTo(42, 22), a.moveTo(0, 0), a.lineTo(-42, 22), a.moveTo(-42, -22), a.lineTo(0, 0), a.moveTo(42, -22), a.lineTo(0, 0), a.stroke(), a.restore(), a.fillStyle = "rgba(255,255,255,0.94)", a.font = "600 18px system-ui, sans-serif", a.textAlign = "center", a.textBaseline = "middle", a.fillText(String(n || e("model3d.preview", "3D preview")), c, l + 44), r && (a.fillStyle = "rgba(255,255,255,0.62)", a.font = "13px system-ui, sans-serif", a.fillText(String(r), c, l + 72));
	} catch (i) {
		console.debug?.(i);
		try {
			N(t, n, r || e("model3d.unavailable", "3D viewer unavailable"));
		} catch (e) {
			console.debug?.(e);
		}
	}
}
function me({ defaultBgColor: t, defaultFov: n, defaultLightIntensity: r, hasSkeleton: i } = {}) {
	let a = document.createElement("div");
	a.className = "mjr-model3d-settings", a.style.cssText = "position:absolute;right:0;top:44px;width:210px;max-height:calc(100% - 100px);overflow-y:auto;background:rgba(14,18,26,0.96);border:1px solid rgba(255,255,255,0.10);border-right:none;border-radius:10px 0 0 10px;padding:10px 10px 12px 10px;z-index:4;display:none;box-shadow:-6px 4px 24px rgba(0,0,0,0.5);backdrop-filter:blur(12px);font:13px system-ui,sans-serif;color:rgba(255,255,255,0.88);scrollbar-width:thin", [
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
		a.addEventListener(e, (e) => I(e, { preventDefault: !1 }));
	});
	let o = (e) => {
		let t = document.createElement("div");
		t.style.cssText = "font:700 10px system-ui,sans-serif;letter-spacing:0.08em;color:rgba(255,255,255,0.40);text-transform:uppercase;margin:10px 0 6px 0", t.textContent = e, a.appendChild(t);
		let n = document.createElement("div");
		n.style.cssText = "height:1px;background:rgba(255,255,255,0.07);margin-bottom:8px;", a.appendChild(n);
	}, s = (e, t) => {
		let n = document.createElement("div");
		n.style.cssText = "display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:6px;";
		let r = document.createElement("span");
		return r.style.cssText = "font:500 11px system-ui,sans-serif;color:rgba(255,255,255,0.65);white-space:nowrap;flex-shrink:0;", r.textContent = e, n.appendChild(r), n.appendChild(t), a.appendChild(n), n;
	}, c = (e, t) => {
		let n = document.createElement("select");
		n.style.cssText = "background:rgba(25,30,42,0.95);color:rgba(255,255,255,0.88);border:1px solid rgba(255,255,255,0.14);border-radius:6px;padding:3px 5px;font:11px system-ui,sans-serif;cursor:pointer;flex:1;min-width:0";
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
	u.type = "color", u.value = t || "#282828", u.style.cssText = "width:34px;height:24px;cursor:pointer;border:1px solid rgba(255,255,255,0.18);border-radius:4px;padding:1px;background:none;flex-shrink:0;", s(e("model3d.background", "Background"), u), o("Model");
	let d = c([
		["original", "Original"],
		["normal", "Normal map"],
		["depth", "Depth"],
		["wireframe", "Wireframe"],
		["pointcloud", "Point cloud"]
	], "original");
	s(e("model3d.material", "Material"), d);
	let ee = c([
		["original", "Original"],
		["+y", "+Y (default)"],
		["-y", "-Y"],
		["+z", "+Z (CAD)"],
		["-z", "-Z"],
		["+x", "+X"],
		["-x", "-X"]
	], "original");
	s("Up", ee);
	let te = null, f = null;
	i && (f = document.createElement("input"), f.type = "checkbox", f.checked = !1, f.style.cssText = "cursor:pointer;accent-color:#4CAF50;flex-shrink:0;", te = s(e("model3d.skeleton", "Skeleton"), f)), o("Camera");
	let p = l(15, 120, 1, n ?? 75);
	s("FOV", p.wrap), o(e("model3d.lights", "Lights"));
	let ne = l(0, 5, .1, r ?? 1);
	return s(e("model3d.intensity", "Intensity"), ne.wrap), {
		panel: a,
		bgInput: u,
		materialSel: d,
		upSel: ee,
		skeletonToggle: f,
		skeletonRow: te,
		fovSlider: p.slider,
		fovValLbl: p.valLbl,
		lightSlider: ne.slider,
		lightValLbl: ne.valLbl
	};
}
function he() {
	let t = document.createElement("div");
	t.className = "mjr-model3d-anim-bar", t.style.cssText = [
		"position:absolute",
		"bottom:0",
		"left:0",
		"right:0",
		`height:${F}px`,
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
	].forEach((e) => {
		t.addEventListener(e, (e) => I(e, { preventDefault: !1 }));
	});
	let n = document.createElement("button");
	n.type = "button", n.textContent = e("model3d.play", "Play"), n.title = e("model3d.playPause", "Play / Pause"), n.style.cssText = "width:28px;height:28px;border-radius:50%;border:1px solid rgba(255,255,255,0.18);background:rgba(76,175,80,0.14);color:rgba(255,255,255,0.92);font:600 12px system-ui,sans-serif;cursor:pointer;flex-shrink:0;padding:0;line-height:1;display:flex;align-items:center;justify-content:center";
	let r = document.createElement("select");
	r.title = e("model3d.playbackSpeed", "Playback speed"), r.style.cssText = "background:rgba(20,24,34,0.9);color:rgba(255,255,255,0.8);border:1px solid rgba(255,255,255,0.14);border-radius:6px;padding:3px 4px;font:11px system-ui,sans-serif;cursor:pointer;width:52px;flex-shrink:0";
	for (let e of P) {
		let t = document.createElement("option");
		t.value = String(e), t.textContent = `${e}x`, e === 1 && (t.selected = !0), r.appendChild(t);
	}
	let i = document.createElement("select");
	i.title = "Animation clip", i.style.cssText = "background:rgba(20,24,34,0.9);color:rgba(255,255,255,0.8);border:1px solid rgba(255,255,255,0.14);border-radius:6px;padding:3px 5px;font:11px system-ui,sans-serif;cursor:pointer;max-width:130px;flex-shrink:1;min-width:0";
	let a = document.createElement("input");
	a.type = "range", a.min = "0", a.max = "1000", a.value = "0", a.style.cssText = "flex:1;min-width:50px;cursor:pointer;accent-color:#4CAF50;height:3px;";
	let o = document.createElement("span");
	return o.style.cssText = "font:500 11px system-ui,sans-serif;color:rgba(255,255,255,0.45);white-space:nowrap;flex-shrink:0", o.textContent = "0s / 0s", t.appendChild(n), t.appendChild(r), t.appendChild(i), t.appendChild(a), t.appendChild(o), {
		bar: t,
		playBtn: n,
		speedSel: r,
		animSel: i,
		progressSlider: a,
		timeLbl: o
	};
}
// ui/features/viewer/model3dRenderer.impl.ts
var V = Object.freeze({
	".gltf": "gltf",
	".glb": "gltf",
	".obj": "obj",
	".fbx": "fbx",
	".stl": "stl",
	".ply": "ply",
	".splat": "splat",
	".ksplat": "splat",
	".spz": "splat"
}), H = new Set(Object.keys(V)), ge = /* @__PURE__ */ new Set([
	"gltf",
	"obj",
	"fbx",
	"stl",
	"ply"
]), _e = "#282828", U = e("model3d.controlHint", "Rotate: left drag  Pan: right drag  Zoom: wheel"), W = Object.freeze({
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
var ve = Object.freeze({
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
}), ye = 75, be = 1, G = Object.freeze({
	ambient: .5,
	main: .8,
	fill: .3,
	back: .3,
	rim: .3,
	bottom: .2
});
function xe(e) {
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
function Se(e) {
	let t = String(e || "").trim();
	return t ? t.startsWith("/") || /^[a-z][\w+\-.]*:/i.test(t) : !1;
}
function K(e) {
	return String(e?.loader || e?.viewer_info?.loader || "").trim().toLowerCase() || V[xe(e)] || "";
}
function Ce(e) {
	return K(e) || "gltf";
}
function we(e) {
	try {
		return !!e?.closest?.(".mjr-model3d-host, .mjr-viewer-model3d-host, .mjr-mfv-model3d-host");
	} catch {
		return !1;
	}
}
function Te(e, t) {
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
function Ee(r, i, a = {}) {
	let s = a?.pauseDuringExecution == null ? !!n?.VIEWER_PAUSE_DURING_EXECUTION : !!a.pauseDuringExecution, c = document.createElement("div");
	c.className = a.hostClassName || "mjr-model3d-host mjr-viewer-model3d-host", c.style.cssText = a.hostStyle || "width:100%;height:100%;display:flex;align-items:stretch;justify-content:stretch;position:relative;overflow:hidden;border-radius:12px;background:radial-gradient(circle at top, rgba(76,175,80,0.10), rgba(0,0,0,0) 42%), linear-gradient(180deg, rgba(40,40,40,0.98), rgba(19,22,28,0.99));box-shadow:inset 0 0 0 1px rgba(255,255,255,0.06)", c.setAttribute("data-capture-wheel", "true"), c.tabIndex = -1;
	let l = document.createElement("canvas");
	l.className = a.canvasClassName || "mjr-viewer-media mjr-model3d-render-canvas", l.style.cssText = a.canvasStyle || "display:block;width:100%;height:100%;max-width:100%;max-height:100%;outline:none;touch-action:none", l.tabIndex = 0, l._mjrDisableViewerTransform = a.disableViewerTransform !== !1;
	try {
		r?.id != null && (l.dataset.mjrAssetId = String(r.id));
	} catch (e) {
		console.debug?.(e);
	}
	c.appendChild(l);
	let u = document.createElement("canvas");
	u.className = "mjr-model3d-status", u.style.cssText = "position:absolute;inset:0;display:block;width:100%;height:100%;pointer-events:none;z-index:1", c.appendChild(u);
	let d = xe(r).replace(".", "").toUpperCase();
	if (d) {
		let e = document.createElement("div");
		e.className = "mjr-model3d-badge", e.textContent = d, e.style.cssText = "position:absolute;top:10px;left:10px;padding:4px 8px;border-radius:999px;font:700 10px system-ui,sans-serif;letter-spacing:0.08em;color:#fff;background:rgba(76,175,80,0.9);pointer-events:none;z-index:2", c.appendChild(e);
	}
	let ee = document.createElement("div");
	ee.className = "mjr-model3d-toolbar", ee.style.cssText = "position:absolute;top:10px;right:10px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;pointer-events:none;z-index:5";
	let te = document.createElement("div");
	te.style.cssText = "display:flex;align-items:center;gap:6px;flex-wrap:wrap;pointer-events:auto;";
	let f = R(e("model3d.reset", "Reset"), e("model3d.resetView", "Reset 3D view")), p = R(e("model3d.grid", "Grid"), e("model3d.toggleGrid", "Toggle grid")), ne = R(e("model3d.persp", "Persp"), e("model3d.switchCamera", "Switch perspective / orthographic")), m = R(e("model3d.settings", "Settings"), e("model3d.settings", "Settings"));
	te.append(f, p, ne, m), ee.appendChild(te), c.appendChild(ee);
	let h = document.createElement("div");
	h.className = "mjr-model3d-hint", h.textContent = a.hintText || U, h.style.cssText = "position:absolute;right:10px;bottom:10px;padding:5px 10px;border-radius:999px;font:500 11px system-ui,sans-serif;color:rgba(255,255,255,0.75);background:rgba(0,0,0,0.35);backdrop-filter:blur(6px);pointer-events:none;z-index:2;transition:bottom 0.2s", c.appendChild(h);
	let g = me({
		defaultBgColor: _e,
		defaultFov: ye,
		defaultLightIntensity: be,
		hasSkeleton: !1
	});
	c.appendChild(g.panel);
	let _ = he();
	c.appendChild(_.bar);
	let v = !1, re = null, y = null, b = null, x = null, S = null, C = null, w = null, T = null, ie = null, E = null, ae = !1, A = null, fe = null, N = null, P = null, F = null, V = null, H = 0, K = W.PERSPECTIVE, we = /* @__PURE__ */ new Map(), Ee = /* @__PURE__ */ new Set(), q = null, De = !1, Oe = null, ke = [], J = be, Y = null, Ae = null, X = [], Z = [], Q = 0, je = 1, $ = !1, Me = !1, Ne = !1, Pe = String(r?.filename || "3D model"), Fe = () => {
		try {
			a.scheduleOverlayRedraw?.();
		} catch (e) {
			console.debug?.(e);
		}
	}, Ie = (e, t = "", n = "#4CAF50") => {
		A = {
			title: e,
			hintText: t,
			accent: n
		}, u.style.display = "block", B(u, e, t, n);
	}, Le = () => {
		A = null, u.style.display = "none";
	}, Re = () => {
		try {
			let e = c.getBoundingClientRect();
			l._mjrNaturalW = Math.max(1, Math.round(e.width || l.width || 1)), l._mjrNaturalH = Math.max(1, Math.round(e.height || l.height || 1));
		} catch (e) {
			console.debug?.(e);
		}
		try {
			A && B(u, A.title, A.hintText, A.accent);
		} catch (e) {
			console.debug?.(e);
		}
	}, ze = (e, t) => {
		if (!w || !(H > 0)) return;
		let n = Math.max(1e-4, (Number(e) || 1) / Math.max(1, Number(t) || 1)), r = H * n;
		w.left = -r / 2, w.right = r / 2, w.top = H / 2, w.bottom = -H / 2, w.updateProjectionMatrix();
	}, Be = () => {
		if (P && T && V) {
			if (K === W.ORTHOGRAPHIC) {
				let e = c.getBoundingClientRect();
				H = O(w, T, V, Math.max(1e-4, (e.width || 1) / Math.max(1, e.height || 1))) || H, S = w;
			} else de(y, C, T, V), S = C;
			try {
				T.object = S, T.update();
			} catch (e) {
				console.debug?.(e);
			}
		}
	}, Ve = (e, { refit: t = !0 } = {}) => {
		K = e === W.ORTHOGRAPHIC ? W.ORTHOGRAPHIC : W.PERSPECTIVE, S = K === W.ORTHOGRAPHIC ? w : C;
		try {
			T && (T.object = S);
		} catch (e) {
			console.debug?.(e);
		}
		if (t) Be();
		else {
			try {
				S?.updateProjectionMatrix?.();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				T?.update?.();
			} catch (e) {
				console.debug?.(e);
			}
		}
		Xe(), Fe();
	}, He = (e) => {
		J = Math.max(0, Math.min(10, Number(e) || 0));
		try {
			Oe && (Oe.intensity = G.ambient * J);
		} catch (e) {
			console.debug?.(e);
		}
		let t = [
			G.main,
			G.back,
			G.fill,
			G.fill,
			G.bottom
		];
		ke.forEach((e, n) => {
			try {
				e && (e.intensity = (t[n] ?? G.fill) * J);
			} catch (e) {
				console.debug?.(e);
			}
		});
	}, Ue = (e) => {
		F && y && (ce(Ee), D(y, F, e, we, Ee), Fe());
	}, We = (e) => {
		if (!P) return;
		let t = ve[e] || [
			0,
			0,
			0
		];
		try {
			P.rotation.set(t[0], t[1], t[2]), P.updateMatrixWorld(!0);
		} catch (e) {
			console.debug?.(e);
		}
		y && (V = ue(y, P)), Be();
	}, Ge = (e) => {
		if (q) try {
			q.visible = !!e;
		} catch (e) {
			console.debug?.(e);
		}
	}, Ke = () => {
		if (!Y || X.length === 0) return;
		let e = Z[Q];
		if (!e) return;
		let t = X[Q]?.duration || 0, n = e.time || 0;
		try {
			_.timeLbl.textContent = `${L(n)} / ${L(t)}`;
		} catch (e) {
			console.debug?.(e);
		}
		if (!Me && t > 0) try {
			let e = Number(_.progressSlider.max) || 1e3;
			_.progressSlider.value = String(Math.round(n / t * e));
		} catch (e) {
			console.debug?.(e);
		}
	}, qe = (t) => {
		if (!Y || !X.length) return;
		let n = X[t];
		if (!n) return;
		Z.forEach((e) => {
			try {
				e?.stop();
			} catch (e) {
				console.debug?.(e);
			}
		});
		let r = Y.clipAction(n);
		r.timeScale = je, r.clampWhenFinished = !1, r.loop = y?.LoopRepeat ?? 2201, r.play(), Z[t] = r, Q = t, $ = !0, _.playBtn.textContent = e("model3d.pause", "Pause");
		try {
			let e = Math.max(100, Math.min(1e4, Math.round((n.duration || 1) * 100)));
			_.progressSlider.max = String(e);
		} catch {}
	}, Je = () => {
		Y && X.length && ($ ? (Y.timeScale = 0, $ = !1, _.playBtn.textContent = e("model3d.play", "Play")) : (Y.timeScale = je, Z[Q]?.isRunning?.() ? ($ = !0, _.playBtn.textContent = e("model3d.pause", "Pause")) : qe(Q)));
	}, Ye = (e, t) => {
		e && e.length !== 0 && y && (X = e, Y = new y.AnimationMixer(t), Ae = new y.Clock(), Z = Array(e.length).fill(null), _.animSel.innerHTML = "", e.forEach((e, t) => {
			let n = document.createElement("option");
			n.value = String(t), n.textContent = e.name || `Animation ${t + 1}`, _.animSel.appendChild(n);
		}), _.animSel.style.display = e.length > 1 ? "" : "none", _.bar.style.display = "flex", h.style.bottom = "54px", qe(0), _.playBtn.addEventListener("click", (e) => {
			I(e), Je();
		}), _.speedSel.addEventListener("change", () => {
			je = Number(_.speedSel.value) || 1, Y.timeScale = $ ? je : 0;
			let e = Z[Q];
			e && (e.timeScale = je);
		}), _.animSel.addEventListener("change", () => {
			let e = Number(_.animSel.value) || 0;
			qe(e);
		}), _.progressSlider.addEventListener("pointerdown", () => {
			Me = !0;
		}), _.progressSlider.addEventListener("pointerup", () => {
			Me = !1;
			let e = Z[Q], t = X[Q];
			if (e && t) {
				let n = Number(_.progressSlider.max) || 1e3, r = Number(_.progressSlider.value) / n * t.duration;
				e.time = Math.max(0, Math.min(r, t.duration));
			}
		}), _.progressSlider.addEventListener("input", () => {
			let e = Z[Q], t = X[Q];
			if (e && t && Me) {
				let n = Number(_.progressSlider.max) || 1e3, r = Number(_.progressSlider.value) / n * t.duration;
				e.time = Math.max(0, Math.min(r, t.duration)), _.timeLbl.textContent = `${L(r)} / ${L(t.duration)}`;
			}
		}));
	}, Xe = () => {
		z(p, !!N?.visible), z(ne, K === W.ORTHOGRAPHIC), ne.textContent = K === W.ORTHOGRAPHIC ? e("model3d.ortho", "Ortho") : e("model3d.persp", "Persp"), z(m, Ne);
	};
	g.bgInput.addEventListener("input", () => {
		let e = g.bgInput.value;
		try {
			x && (x.background = new ((y?.Color) || Object)(e));
		} catch (e) {
			console.debug?.(e);
		}
	}), g.materialSel.addEventListener("change", () => {
		Ue(g.materialSel.value);
	}), g.upSel.addEventListener("change", () => {
		We(g.upSel.value);
	}), g.skeletonToggle && g.skeletonToggle.addEventListener("change", () => {
		Ge(g.skeletonToggle.checked);
	}), g.fovSlider.addEventListener("input", () => {
		let e = Math.max(1, Math.min(179, Number(g.fovSlider.value) || ye));
		try {
			C && (C.fov = e, C.updateProjectionMatrix());
		} catch (e) {
			console.debug?.(e);
		}
	}), g.lightSlider.addEventListener("input", () => {
		He(Number(g.lightSlider.value));
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
		}), t(c, "wheel", (e) => I(e)), t(c, "contextmenu", (e) => I(e, { preventDefault: !0 })), t(c, "dragstart", (e) => I(e, { preventDefault: !0 })), t(c, "dragover", (e) => I(e, { preventDefault: !0 })), t(c, "dragleave", (e) => I(e)), t(c, "drop", (e) => I(e, { preventDefault: !0 })), () => {
			for (let t of e) try {
				t();
			} catch (e) {
				console.debug?.(e);
			}
		};
	}, Qe = () => {
		v = !0;
		try {
			window.removeEventListener(o.RUNTIME_STATUS, tt);
		} catch {}
		try {
			c._mjr3D = null;
		} catch {}
		try {
			ie != null && cancelAnimationFrame(ie);
		} catch (e) {
			console.debug?.(e);
		}
		ie = null;
		try {
			fe?.();
		} catch (e) {
			console.debug?.(e);
		}
		fe = null;
		try {
			re?.disconnect?.();
		} catch (e) {
			console.debug?.(e);
		}
		re = null;
		try {
			T?.dispose?.();
		} catch (e) {
			console.debug?.(e);
		}
		T = null;
		try {
			Y?.stopAllAction?.(), Y?.uncacheRoot?.(Y.getRoot?.());
		} catch (e) {
			console.debug?.(e);
		}
		try {
			for (let e of Z) try {
				Y?.uncacheAction?.(e);
			} catch {}
		} catch (e) {
			console.debug?.(e);
		}
		try {
			for (let e of X) try {
				e?.dispose?.();
			} catch {}
		} catch (e) {
			console.debug?.(e);
		}
		Y = null, Z = [], X = [], ce(Ee);
		try {
			q && (x?.remove?.(q), q.dispose?.());
		} catch (e) {
			console.debug?.(e);
		}
		q = null;
		try {
			x?.traverse?.((e) => {
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
			b?.dispose?.();
		} catch (e) {
			console.debug?.(e);
		}
		b = null, x = null, S = null, C = null, w = null, F = null, P = null, V = null, E = null;
		try {
			let e = l.getContext("webgl2") || l.getContext("webgl");
			e && e.getExtension("WEBGL_lose_context")?.loseContext?.();
		} catch (e) {
			console.debug?.(e);
		}
	}, $e = () => {
		ae = !0;
		try {
			ie != null && cancelAnimationFrame(ie);
		} catch (e) {
			console.debug?.(e);
		}
		ie = null;
	}, et = () => {
		if (ae = !1, !(v || ie != null || typeof E != "function")) try {
			ie = requestAnimationFrame(E);
		} catch (e) {
			console.debug?.(e);
		}
	}, tt = (e) => {
		s && (String(e?.detail?.active_prompt_id || "").trim() ? $e() : et());
	};
	l._mjrProc = {
		setParams: () => {},
		destroy: Qe,
		captureCanvas: () => l,
		pause: $e,
		resume: et
	};
	try {
		s && (window.addEventListener(o.RUNTIME_STATUS, tt), String(window.__MJR_EXECUTION_RUNTIME__?.active_prompt_id || "").trim() && (ae = !0));
	} catch (e) {
		console.debug?.(e);
	}
	return Ie("Preparing 3D preview", Pe), Promise.resolve().then(async () => {
		let n = Ce(r);
		if (ge.has(n)) try {
			let e = await M();
			if (v) return;
			let o = e.THREE;
			y = o;
			let s = new o.LoadingManager();
			s.setURLModifier((e) => {
				if (!e || Se(e)) return e;
				let n = t(r, e);
				if (n) return n;
				try {
					return new URL(e, i).href;
				} catch {
					return e;
				}
			}), b = new o.WebGLRenderer({
				canvas: l,
				antialias: !0,
				alpha: !0,
				preserveDrawingBuffer: !0
			}), b.outputColorSpace = o.SRGBColorSpace, b.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)), x = new o.Scene(), x.background = new o.Color(_e), C = new o.PerspectiveCamera(ye, 16 / 9, .01, 1e4), w = new o.OrthographicCamera(-1, 1, 1, -1, -1e4, 1e4), S = C, T = new e.OrbitControls(S, l), T.enableDamping = !0, T.dampingFactor = .08, T.rotateSpeed = .82, T.zoomSpeed = 1, T.panSpeed = .9, T.screenSpacePanning = !0, T.mouseButtons = Te(null, o.MOUSE), fe = Ze(), Oe = new o.AmbientLight(16777215, G.ambient * J), x.add(Oe);
			let u = new o.DirectionalLight(16777215, G.main * J);
			u.position.set(0, 10, 10);
			let d = new o.DirectionalLight(16777215, G.back * J);
			d.position.set(-10, 0, -10);
			let ee = new o.DirectionalLight(15266047, G.fill * J);
			ee.position.set(10, 5, -5);
			let te = new o.DirectionalLight(16773352, G.fill * J);
			te.position.set(-10, 5, 5);
			let _ = new o.DirectionalLight(16777215, G.bottom * J);
			_.position.set(0, -10, 0), ke = [
				u,
				d,
				ee,
				te,
				_
			], ke.forEach((e) => x.add(e)), N = new o.GridHelper(20, 20, 5068128, 3094338), x.add(N);
			let D = () => {
				if (v || !b || !S) return;
				let e = c.getBoundingClientRect(), t = Math.max(1, Math.round(e.width || l.clientWidth || 1)), n = Math.max(1, Math.round(e.height || l.clientHeight || 1));
				b.setSize(t, n, !1), C && (C.aspect = t / n, C.updateProjectionMatrix()), ze(t, n), Re(), Fe();
			};
			typeof ResizeObserver < "u" && (re = new ResizeObserver(() => D()), re.observe(c));
			let ce = pe(e, n, s);
			if (!ce) {
				Ie("3D loader unavailable", `${n.toUpperCase()} loader could not be created.`), h.style.display = "none";
				return;
			}
			if (n === "obj" && e.MTLLoader) try {
				let t = i.replace(/\.obj(\?.*)?$/i, (e, t) => `.mtl${t || ""}`), n = new e.MTLLoader(s), r = await new Promise((e) => {
					n.load(t, e, void 0, () => e(null));
				});
				r && !v && (r.preload(), ce.setMaterials(r));
			} catch (e) {
				console.debug?.("[MJR 3D] MTL load skipped:", e?.message);
			}
			let de = await j(ce, n, i);
			if (v) return;
			let O = k(o, n, de);
			if (!O) {
				Ie("Empty 3D scene", "The loader returned no renderable object."), h.style.display = "none";
				return;
			}
			try {
				let e = new o.Box3().setFromObject(O);
				if (!e.isEmpty()) {
					let t = e.getSize(new o.Vector3()), n = e.getCenter(new o.Vector3()), r = 5 / Math.max(t.x, t.y, t.z, .001);
					O.scale.multiplyScalar(r), e.setFromObject(O), e.getCenter(n), O.position.set(-n.x, -e.min.y, -n.z);
				}
			} catch (e) {
				console.debug?.("[MJR 3D] normalize skipped:", e);
			}
			if (F = O, P = new o.Group(), P.add(O), x.add(P), we = se(O), De = oe(O), De) {
				q = new o.SkeletonHelper(O), q.visible = !1, x.add(q);
				let e = me({
					defaultBgColor: _e,
					defaultFov: ye,
					defaultLightIntensity: be,
					hasSkeleton: !0
				});
				c.replaceChild(e.panel, g.panel), Object.assign(g, e), g.bgInput.addEventListener("input", () => {
					try {
						x && (x.background = new o.Color(g.bgInput.value));
					} catch (e) {
						console.debug?.(e);
					}
				}), g.materialSel.addEventListener("change", () => {
					Ue(g.materialSel.value);
				}), g.upSel.addEventListener("change", () => {
					We(g.upSel.value);
				}), g.skeletonToggle && g.skeletonToggle.addEventListener("change", () => {
					Ge(g.skeletonToggle.checked);
				}), g.fovSlider.addEventListener("input", () => {
					let e = Math.max(1, Math.min(179, Number(g.fovSlider.value) || ye));
					try {
						C && (C.fov = e, C.updateProjectionMatrix());
					} catch (e) {
						console.debug?.(e);
					}
				}), g.lightSlider.addEventListener("input", () => {
					He(Number(g.lightSlider.value));
				});
			}
			V = ue(o, P), V && (N.position.y = V.box.min.y), K = W.PERSPECTIVE, Be(), D(), Le(), Xe();
			let A = le(de, n);
			A.length > 0 && Ye(A, O);
			let L = new o.Scene();
			c._mjrAxisScene = L;
			let R = new o.PerspectiveCamera(50, 1, .1, 100);
			R.position.set(0, 0, 3.2), R.lookAt(0, 0, 0);
			let z = [
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
			], B = new o.SphereGeometry(.1, 12, 8), he = new o.SphereGeometry(.08, 10, 6), H = new o.MeshBasicMaterial({ color: 13421772 });
			L.add(new o.Mesh(he, H));
			for (let { dir: e, color: t } of z) {
				let n = new o.LineBasicMaterial({ color: t }), r = [new o.Vector3(0, 0, 0), new o.Vector3(e[0], e[1], e[2])], i = new o.BufferGeometry().setFromPoints(r);
				L.add(new o.Line(i, n));
				let a = new o.MeshBasicMaterial({ color: t }), s = new o.Mesh(B, a);
				s.position.set(e[0], e[1], e[2]), L.add(s);
			}
			c._mjr3D = {
				controls: T,
				get camera() {
					return S;
				}
			};
			try {
				a.onReady?.({
					canvas: l,
					host: c,
					object: P,
					renderer: b,
					camera: S,
					controls: T
				});
			} catch (e) {
				console.debug?.(e);
			}
			Fe();
			let ge = () => {
				if (!v && !ae && b && x && S) {
					try {
						if (T?.update?.(), Y && Ae) {
							let e = Ae.getDelta();
							$ && Y.update(e), Ke();
						}
						b.setScissorTest(!1), b.setViewport(0, 0, l.width, l.height), b.render(x, S);
						let e = Math.min(2, window.devicePixelRatio || 1), t = Math.round(96 * e);
						b.setScissorTest(!0), b.setScissor(0, 0, t, t), b.setViewport(0, 0, t, t), b.setClearColor(0, 0), b.clear(!0, !0, !1);
						let n = S.quaternion;
						R.position.set(0, 0, 3.2).applyQuaternion(n), R.quaternion.copy(n), b.render(L, R), b.setScissorTest(!1);
						try {
							b.setClearColor(x.background || 0, 1);
						} catch {}
						Re();
					} catch (e) {
						console.debug?.(e);
					}
					ae || (ie = requestAnimationFrame(ge));
				}
			};
			E = ge;
			let U = (e) => I(e, { preventDefault: !0 });
			f.addEventListener("click", (e) => {
				U(e), Be(), Xe();
			}), p.addEventListener("click", (e) => {
				U(e), N && (N.visible = !N.visible), Xe(), Fe();
			}), ne.addEventListener("click", (e) => {
				U(e), Ve(K === W.PERSPECTIVE ? W.ORTHOGRAPHIC : W.PERSPECTIVE);
			}), m.addEventListener("click", (e) => {
				U(e), Ne = !Ne, g.panel.style.display = Ne ? "block" : "none", Xe();
			}), ae || ge();
		} catch (e) {
			console.warn("[MJR 3D] preview init failed", e), Ie("Failed to load 3D preview", String(e?.message || "Three.js initialization failed.")), h.style.display = "none";
		}
		else if (Ie("3D preview unavailable", `${n.toUpperCase()} is not supported in the embedded viewer.`), h.style.display = "none", i) try {
			let t = document.createElement("a");
			t.href = i, t.download = String(r?.filename || "model"), t.textContent = e("model3d.downloadFile", "Download {file}", { file: String(r?.filename || "file") }), t.style.cssText = "position:absolute;bottom:18px;left:50%;transform:translateX(-50%);padding:7px 16px;border-radius:8px;font:600 12px system-ui,sans-serif;color:#fff;background:rgba(76,175,80,0.85);text-decoration:none;pointer-events:auto;z-index:3", c.appendChild(t);
		} catch {}
	}).catch((e) => {
		if (!v) {
			console.warn("[MJR 3D] preview init unhandled error", e);
			try {
				Ie("Failed to load 3D preview", String(e?.message || "Initialization failed."));
			} catch {}
			try {
				h.style.display = "none";
			} catch {}
		}
	}), c;
}
// ui/features/viewer/studio/studioFx.ts
function q() {
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
var De = .2126, Oe = .7152, ke = .0722;
function J(e) {
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
		case "l": return `${t(De, Oe, ke)} 0 0 0 1 0`;
		case "a": return `${t(0, 0, 0, 1)} 0 0 0 0 1`;
		default: return null;
	}
}
function Y(e) {
	return 2 ** (Number.isFinite(e) ? Math.max(-10, Math.min(10, e)) : 0);
}
function Ae(e) {
	return 1 / (Number.isFinite(e) && e > 0 ? e : 1);
}
function X(e) {
	return e.channel !== "rgb" || Math.abs(e.exposure) > .001 || Math.abs(e.gamma - 1) > .001;
}
function Z(e) {
	switch (e) {
		case "16:9": return 16 / 9;
		case "1:1": return 1;
		case "4:3": return 4 / 3;
		case "2.39": return 2.39;
		case "9:16": return 9 / 16;
		default: return null;
	}
}
function Q(e, t, n) {
	let r = Z(n);
	if (!r || e <= 0 || t <= 0) return null;
	let i = e, a = e / r;
	return a > t && (a = t, i = t * r), {
		x: (e - i) / 2,
		y: (t - a) / 2,
		w: i,
		h: a
	};
}
function je(e, t, n) {
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
function $(e, t, n) {
	return De * e + Oe * t + ke * n;
}
function Me(e) {
	let t = /* @__PURE__ */ new Uint32Array(256), n = /* @__PURE__ */ new Uint32Array(256), r = /* @__PURE__ */ new Uint32Array(256), i = /* @__PURE__ */ new Uint32Array(256);
	for (let a = 0; a + 3 < e.length; a += 4) e[a + 3] !== 0 && (t[e[a]] += 1, n[e[a + 1]] += 1, r[e[a + 2]] += 1, i[Math.round($(e[a], e[a + 1], e[a + 2]))] += 1);
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
function Ne(e, t, n, r = 256) {
	let i = Math.max(1, Math.min(r, t)), a = new Uint32Array(i * 256), o = 1;
	for (let r = 0; r < n; r++) for (let n = 0; n < t; n++) {
		let s = (r * t + n) * 4;
		if (e[s + 3] === 0) continue;
		let c = Math.min(i - 1, Math.floor(n * i / t)), l = Math.round($(e[s], e[s + 1], e[s + 2])), u = c * 256 + l;
		a[u] += 1, a[u] > o && (o = a[u]);
	}
	return {
		columns: i,
		bins: a,
		max: o
	};
}
function Pe(e, t, n, r, i = 0) {
	let a = new Uint8ClampedArray(/* @__PURE__ */ new ArrayBuffer(t * n * 4)), o = Math.max(0, Math.min(1, r)) * 255;
	for (let r = 0; r < n; r++) for (let n = 0; n < t; n++) {
		let s = (r * t + n) * 4;
		if ($(e[s], e[s + 1], e[s + 2]) < o) continue;
		let c = Math.floor((n + r + i) / 4) % 2 == 0;
		a[s] = c ? 255 : 20, a[s + 1] = c ? 40 : 20, a[s + 2] = c ? 40 : 20, a[s + 3] = 200;
	}
	return a;
}
function Fe(e, t, n = 256) {
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
function Ie(e, t, n, r) {
	return {
		hex: `#${[
			e,
			t,
			n
		].map((e) => Math.round(e).toString(16).padStart(2, "0")).join("")}`.toUpperCase(),
		rgb: `${e}, ${t}, ${n}${r < 255 ? ` · α ${r}` : ""}`,
		luma: `${Math.round($(e, t, n) / 255 * 100)}%`
	};
}
function Le(e) {
	switch (e) {
		case "difference": return "difference";
		case "add": return "plus-lighter";
		case "multiply": return "multiply";
		case "screen": return "screen";
		default: return null;
	}
}
var Re = [
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
function ze(e, t, n, r = () => !0) {
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
var Be = /* @__PURE__ */ new Set([
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
]), Ve = /* @__PURE__ */ new Set([
	"mp4",
	"webm",
	"mov",
	"mkv",
	"avi",
	"m4v"
]), He = /* @__PURE__ */ new Set([
	"mp3",
	"wav",
	"flac",
	"ogg",
	"opus",
	"m4a",
	"aac",
	"aiff"
]), Ue = /* @__PURE__ */ new Set([
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
function We(e) {
	let t = String(e?.filename || e?.name || e?.filepath || "").trim(), n = t.lastIndexOf(".");
	return n >= 0 ? t.slice(n + 1).toLowerCase() : "";
}
function Ge(e) {
	let t = String(e?.kind || "").trim().toLowerCase();
	if (t === "image" || t === "video" || t === "audio" || t === "model3d") return t;
	let n = We(e);
	return Be.has(n) ? "image" : Ve.has(n) ? "video" : He.has(n) ? "audio" : Ue.has(n) ? "model3d" : "other";
}
function Ke(e, { withCentis: t = !0 } = {}) {
	let n = Math.floor((Number.isFinite(e) && e > 0 ? e : 0) * 100 + 1e-6), r = n % 100, i = Math.floor(n / 100), a = i % 60, o = Math.floor(i / 60) % 60, s = Math.floor(i / 3600), c = s > 0 ? String(o).padStart(2, "0") : String(o), l = `${s > 0 ? `${s}:` : ""}${c}:${String(a).padStart(2, "0")}`;
	return t ? `${l}.${String(r).padStart(2, "0")}` : l;
}
function qe(e, t) {
	return !t || !Number.isFinite(t) || t <= 0 ? 0 : Math.max(0, Math.floor(Math.max(0, e) * t + 1e-6));
}
function Je(e, t) {
	return !t || !Number.isFinite(t) || t <= 0 ? 0 : Math.max(0, (Math.max(0, Math.floor(e)) + .25) / t);
}
function Ye(e, t, n, r) {
	let i = t && Number.isFinite(t) && t > 0 ? t : 24, a = Je(qe(e, i) + n, i);
	return Math.min(Math.max(0, a), Math.max(0, (Number.isFinite(r) && r > 0 ? r : a) - .5 / i));
}
function Xe(e, t, n) {
	let r = Number(n);
	return Number.isFinite(r) && r > 0 ? Math.floor(r) : !t || !Number.isFinite(e) || e <= 0 ? null : Math.max(1, Math.round(e * t));
}
function Ze(e, t) {
	if (e.a == null || e.b == null) return null;
	let n = Number.isFinite(t) && t > 0 ? t : Math.max(e.a, e.b), r = Math.min(Math.max(0, Math.min(e.a, e.b)), n), i = Math.min(Math.max(0, Math.max(e.a, e.b)), n);
	return i - r >= .02 ? {
		a: r,
		b: i
	} : null;
}
function Qe(e, t, n) {
	let r = Ze(t, n);
	return r && (e >= r.b || e < r.a - .05) ? r.a : null;
}
var $e = [
	.25,
	.5,
	1,
	1.5,
	2
];
function et(e, t) {
	return r(e) ?? i(t?.fps_raw ?? t?.fps ?? t?.frame_rate) ?? i(e?.fps);
}
function tt(e) {
	let t = [], n = Number(e?.width), r = Number(e?.height);
	n > 0 && r > 0 && t.push(`${n}×${r}`);
	let i = We(e);
	i && t.push(i.toUpperCase());
	let a = Number(e?.duration);
	a > 0 && t.push(Ke(a, { withCentis: !1 }));
	let o = Number(e?.size);
	return o > 0 && t.push(nt(o)), t.join(" · ");
}
function nt(e) {
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
function rt(e, t, n = 40) {
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
var it = ["src"], at = ["src"], ot = {
	key: 0,
	class: "mjr-studio-stage__ab"
}, st = { class: "is-sep" }, ct = {
	class: "pi pi-volume-up",
	"aria-hidden": "true"
}, lt = ["src"], ut = {
	key: 3,
	class: "mjr-studio-player__error"
}, dt = [
	"aria-label",
	"aria-valuemax",
	"aria-valuenow"
], ft = { class: "mjr-studio-player__row" }, pt = { class: "mjr-studio-player__time" }, mt = { class: "is-dim" }, ht = ["title"], gt = ["title"], _t = { class: "mjr-studio-player__group" }, vt = ["aria-label", "aria-valuenow"], yt = /* @__PURE__ */ ne({
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
	setup(t, { expose: n, emit: r }) {
		let i = t, a = r, o = E(null), ne = E(null), ae = E(null), oe = E(null), se = E(null), D = E({
			x: 0,
			y: 0,
			w: 0,
			h: 0
		}), ce = E(!1), le = null, ue = E(null), de = E(!1), O = null, k = null, A = 0;
		async function fe() {
			if (i.kind !== "audio" || k || O) return;
			let e = K(), t = window.AudioContext || window.webkitAudioContext;
			if (e && t) try {
				if (O = new t(), await O.resume?.(), O.state !== "running") {
					O.close?.(), O = null;
					return;
				}
				let n = O.createMediaElementSource(e);
				k = O.createAnalyser(), k.fftSize = 256, k.smoothingTimeConstant = .78, n.connect(k), k.connect(O.destination), de.value = !0, pe();
			} catch (e) {
				console.debug?.(e);
			}
		}
		function pe() {
			cancelAnimationFrame(A);
			let e = ue.value, t = e?.getContext("2d");
			if (!e || !t || !k) return;
			let n = e.width = e.clientWidth || 480, r = e.height = e.clientHeight || 160, i = new Uint8Array(k.frequencyBinCount);
			k.getByteFrequencyData(i), t.clearRect(0, 0, n, r);
			let a = Math.min(64, i.length), o = Math.max(2, (n - 3 * (a - 1)) / a);
			t.fillStyle = getComputedStyle(e).getPropertyValue("--mjr-accent").trim() || "#4fa3ff";
			for (let e = 0; e < a; e++) {
				let n = i[Math.min(i.length - 1, Math.floor((e / a) ** 1.6 * i.length))] / 255, s = Math.max(2, n * r);
				t.globalAlpha = .35 + n * .65, t.fillRect(e * (o + 3), r - s, o, s);
			}
			t.globalAlpha = 1, j.value && (A = requestAnimationFrame(pe));
		}
		let j = E(!1), M = E(0), N = E(0), P = E(0), F = E(1), I = E(!!i.initialMuted), L = E(Number(i.initialRate) > 0 ? Number(i.initialRate) : 1), R = E(!0), z = E(null), B = E(null), me = E(null), he = E(!1), V = E(!0), H = E(""), ge = null, _e = 0, U = g(() => i.fps && i.fps > 0 ? i.fps : null), W = g(() => qe(M.value, U.value)), ve = g(() => Xe(N.value, U.value, i.frameCount)), ye = g(() => N.value > 0 ? M.value / N.value * 100 : 0), be = g(() => N.value > 0 ? P.value / N.value * 100 : 0), G = g(() => Ze({
			a: z.value,
			b: B.value
		}, N.value)), xe = g(() => {
			if (!G.value || N.value <= 0) return null;
			let e = G.value.a / N.value * 100, t = (G.value.b - G.value.a) / N.value * 100;
			return {
				left: `${e}%`,
				width: `${t}%`
			};
		}), Se = g(() => me.value == null || N.value <= 0 ? null : me.value / 100 * N.value);
		function K() {
			return o.value;
		}
		let Ce = g(() => i.kind === "video" && !!i.compareSrc && !!i.compare && i.compare !== "off"), we = g(() => Ce.value && i.compare === "side"), Te = g(() => Ce.value && (i.compare === "wipe" || i.compare === "wipeV")), Ee = g(() => Math.max(0, Math.min(100, Number(i.wipe ?? 50)))), q = g(() => {
			let e = Ce.value ? Le(i.compare || "off") : null;
			if (e) return { mixBlendMode: e };
			if (Te.value) {
				let e = D.value;
				return i.compare === "wipeV" ? { clipPath: `inset(${e.y + e.h * Ee.value / 100}px 0 0 0)` } : { clipPath: `inset(0 0 0 ${e.x + e.w * Ee.value / 100}px)` };
			}
			return {};
		}), De = g(() => ({
			left: `${D.value.x}px`,
			top: `${D.value.y}px`,
			width: `${D.value.w}px`,
			height: `${D.value.h}px`
		}));
		function Oe() {
			let e = o.value;
			if (!(e instanceof HTMLVideoElement) || !oe.value) return;
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
			let a = Math.min(t / r, n / i), s = r * a, c = i * a;
			D.value = {
				x: e.offsetLeft + (t - s) / 2,
				y: e.offsetTop + (n - c) / 2,
				w: s,
				h: c
			};
		}
		function ke(e = !1) {
			let t = K(), n = se.value;
			if (!t || !n || !Ce.value) return;
			n.muted = !0, n.playbackRate !== t.playbackRate && (n.playbackRate = t.playbackRate);
			let r = Math.min(t.currentTime || 0, Number.isFinite(n.duration) ? n.duration : Infinity);
			if (e || Math.abs((n.currentTime || 0) - r) > .08) try {
				n.currentTime = r;
			} catch (e) {
				console.debug?.(e);
			}
			t.paused && !n.paused ? n.pause() : !t.paused && n.paused && n.play()?.catch?.(() => {});
		}
		function J(e) {
			let t = oe.value?.getBoundingClientRect(), n = D.value;
			if (!t || n.w <= 0 || n.h <= 0) return;
			let r = i.compare === "wipeV" ? (e.clientY - t.top - n.y) / n.h : (e.clientX - t.left - n.x) / n.w;
			a("update:wipe", Math.round(Math.max(0, Math.min(1, r)) * 1e3) / 10);
		}
		function Y(e) {
			ce.value = !0, e.currentTarget?.setPointerCapture?.(e.pointerId), J(e);
		}
		function Ae(e) {
			ce.value && J(e);
		}
		function X() {
			let e = K();
			if (e) {
				M.value = e.currentTime || 0;
				let t = Qe(M.value, {
					a: z.value,
					b: B.value
				}, N.value);
				t != null && j.value && (e.currentTime = t, M.value = t), ke(t != null);
			}
			j.value && (_e = requestAnimationFrame(X));
		}
		function Z() {
			j.value = !0, cancelAnimationFrame(_e), _e = requestAnimationFrame(X), ke(!0), i.kind === "audio" && (k ? pe() : fe()), Ct();
		}
		function Q() {
			j.value = !1, cancelAnimationFrame(_e), ke(!0), St();
		}
		function je() {
			let e = K();
			N.value = Number.isFinite(e?.duration) ? Number(e?.duration) : 0, H.value = "", e && (e.volume = F.value, e.muted = I.value, e.playbackRate = L.value), c(Oe);
		}
		function $() {
			let e = K();
			if (e) {
				j.value || (M.value = e.currentTime || 0);
				try {
					let t = e.buffered;
					P.value = t.length ? t.end(t.length - 1) : 0;
				} catch {
					P.value = 0;
				}
			}
		}
		function Me() {
			if (R.value && !G.value) {
				let e = K();
				e && (e.currentTime = 0, e.play()?.catch?.(() => {}));
			} else a("ended");
		}
		function Ne() {
			H.value = e("viewer.studio.mediaError", "This file cannot be played by the browser.");
		}
		function Pe() {
			let e = K();
			e && (e.paused ? e.play()?.catch?.(() => {}) : e.pause());
		}
		function Fe(e) {
			let t = K();
			if (!t || !Number.isFinite(e)) return;
			let n = N.value > 0 ? N.value : e;
			t.currentTime = Math.max(0, Math.min(e, n)), M.value = t.currentTime, ke(!0);
		}
		function Ie(e) {
			let t = K();
			t && (t.paused || t.pause(), Fe(Ye(t.currentTime || 0, U.value, e, N.value)));
		}
		function Re(e) {
			Fe((K()?.currentTime || 0) + e);
		}
		function ze(e) {
			let t = ae.value?.getBoundingClientRect();
			return !t || t.width <= 0 ? 0 : Math.max(0, Math.min(100, (e.clientX - t.left) / t.width * 100));
		}
		function Be(e) {
			N.value <= 0 || (he.value = !0, e.currentTarget?.setPointerCapture?.(e.pointerId), Fe(ze(e) / 100 * N.value));
		}
		function Ve(e) {
			me.value = ze(e), he.value && Fe(me.value / 100 * N.value);
		}
		function He(e) {
			he.value = !1, e.currentTarget?.releasePointerCapture?.(e.pointerId);
		}
		function Ue(e) {
			L.value = e;
			let t = K();
			t && (t.playbackRate = e);
		}
		function We(e = 1, t = !1) {
			let n = $e, r = n.indexOf(L.value), i = (r < 0 ? n.indexOf(1) : r) + e;
			t && (i = (i + n.length) % n.length), Ue(n[Math.max(0, Math.min(n.length - 1, i))]);
		}
		function Ge() {
			I.value = !I.value;
			let e = K();
			e && (e.muted = I.value);
		}
		let Je = E(!1);
		function et(e) {
			if (e.type === "pointerdown") Je.value = !0, e.currentTarget?.setPointerCapture?.(e.pointerId);
			else if (!Je.value) return;
			let t = e.currentTarget.getBoundingClientRect(), n = t.width > 0 ? (e.clientX - t.left) / t.width : 1;
			tt(Math.round(Math.max(0, Math.min(1, n)) * 20) / 20);
		}
		function tt(e) {
			F.value = e;
			let t = K();
			t && (t.volume = F.value, F.value > 0 && I.value && (I.value = !1, t.muted = !1));
		}
		function nt() {
			z.value = M.value, B.value != null && B.value <= z.value && (B.value = null);
		}
		function rt() {
			B.value = M.value, z.value ??= 0;
		}
		function yt() {
			z.value = null, B.value = null;
		}
		function bt() {
			let e = ne.value;
			e && (document.fullscreenElement ? document.exitFullscreen?.() : e.requestFullscreen?.());
		}
		async function xt() {
			let e = K();
			if (i.kind !== "video" || !(e instanceof HTMLVideoElement) || !e.videoWidth) return;
			let t = document.createElement("canvas");
			t.width = e.videoWidth, t.height = e.videoHeight, t.getContext("2d")?.drawImage(e, 0, 0);
			let n = await new Promise((e) => t.toBlob(e, "image/png"));
			if (!n) return;
			let r = URL.createObjectURL(n), a = String(i.filename || "frame").replace(/\.[^.]+$/, ""), o = document.createElement("a");
			o.href = r, o.download = `${a}_f${String(W.value).padStart(5, "0")}.png`, o.click(), setTimeout(() => URL.revokeObjectURL(r), 1e3);
		}
		function St() {
			V.value = !0, Ct();
		}
		function Ct() {
			ge && clearTimeout(ge), ge = setTimeout(() => {
				j.value && !he.value && i.kind === "video" && (V.value = !1);
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
			wt(se.value), wt(K());
		}
		re(() => i.src, () => {
			yt(), M.value = 0, N.value = 0, P.value = 0, H.value = "";
		});
		function Et() {
			let e = K();
			if (!e) return;
			e.muted = I.value, e.playbackRate = L.value;
			let t = e.play?.();
			t && typeof t.catch == "function" && t.catch(() => {
				e.muted || (I.value = !0, e.muted = !0, e.play?.()?.catch?.(() => {}));
			});
		}
		return re([
			Ce,
			() => i.compareSrc,
			() => i.compare
		], () => void c(() => {
			Oe(), ke(!0);
		})), ee(() => {
			Et();
			try {
				le = new ResizeObserver(() => Oe()), oe.value && le.observe(oe.value);
			} catch (e) {
				console.debug?.(e);
			}
		}), _(() => {
			le?.disconnect(), cancelAnimationFrame(A);
			try {
				O?.close?.();
			} catch (e) {
				console.debug?.(e);
			}
			O = null, k = null, cancelAnimationFrame(_e), ge && clearTimeout(ge), Tt();
		}), n({
			togglePlay: Pe,
			play: Et,
			stepFrame: Ie,
			seekBy: Re,
			cycleRate: We,
			toggleMute: Ge,
			setLoopA: nt,
			setLoopB: rt,
			clearLoop: yt,
			toggleFullscreen: bt,
			exportFrame: xt,
			release: Tt,
			getSource: () => o.value instanceof HTMLVideoElement ? o.value : null,
			getBox: () => i.kind === "video" ? oe.value?.querySelector(".mjr-studio-player__box") : null,
			isPlaying: () => j.value
		}), (n, r) => {
			let i = te("MButton");
			return v(), C("div", {
				ref_key: "root",
				ref: ne,
				class: w(["mjr-studio-player", {
					"is-audio": t.kind === "audio",
					"is-compact": t.compact,
					"controls-hidden": !V.value
				}]),
				onPointermove: St
			}, [
				t.kind === "video" ? (v(), C("div", {
					key: 0,
					ref_key: "screen",
					ref: oe,
					class: w(["mjr-studio-player__screen", { "is-side": we.value }]),
					onClick: Pe,
					onDblclick: bt
				}, [
					d("div", {
						class: "mjr-studio-player__layers",
						style: x(t.mediaFilter ? { filter: t.mediaFilter } : void 0)
					}, [d("video", {
						ref_key: "media",
						ref: o,
						class: "mjr-studio-player__media",
						src: t.src,
						playsinline: "",
						preload: "auto",
						onPlay: Z,
						onPause: Q,
						onLoadedmetadata: je,
						onTimeupdate: $,
						onProgress: $,
						onEnded: Me,
						onError: Ne
					}, null, 40, it), Ce.value ? (v(), C("video", {
						ref_key: "mediaB",
						ref: se,
						key: `b:${t.compareSrc}`,
						class: "mjr-studio-player__media is-b",
						src: t.compareSrc || "",
						playsinline: "",
						muted: "",
						preload: "auto",
						style: x(q.value),
						onLoadedmetadata: r[0] ||= (e) => ke(!0)
					}, null, 44, at)) : p("", !0)], 4),
					d("div", {
						class: "mjr-studio-player__box",
						style: x(De.value)
					}, [ie(n.$slots, "overlay", {
						width: D.value.w,
						height: D.value.h
					}), Te.value ? (v(), C("div", {
						key: 0,
						class: w(["mjr-studio-stage__divider", {
							"is-vertical": t.compare === "wipeV",
							"is-active": ce.value
						}]),
						style: x(t.compare === "wipeV" ? { top: `${Ee.value}%` } : { left: `${Ee.value}%` }),
						onClick: r[1] ||= h(() => {}, ["stop"]),
						onDblclick: r[2] ||= h((e) => a("update:wipe", 50), ["stop"]),
						onPointerdown: h(Y, ["stop"]),
						onPointermove: Ae,
						onPointerup: r[3] ||= (e) => ce.value = !1,
						onPointercancel: r[4] ||= (e) => ce.value = !1
					}, [...r[12] ||= [d("span", { class: "mjr-studio-stage__divider-grip" }, null, -1)]], 38)) : p("", !0)], 4),
					Ce.value ? (v(), C("div", ot, [
						r[13] ||= d("span", null, "A", -1),
						d("span", st, b(t.compare === "wipeV" ? "/" : "|"), 1),
						r[14] ||= d("span", null, "B", -1)
					])) : p("", !0)
				], 34)) : (v(), C("div", {
					key: 1,
					class: w(["mjr-studio-player__audio-art", { "has-spectrum": de.value }]),
					onClick: Pe
				}, [
					s(d("canvas", {
						ref_key: "spectrum",
						ref: ue,
						class: "mjr-studio-player__spectrum",
						"aria-hidden": "true"
					}, null, 512), [[y, de.value]]),
					s(d("i", ct, null, 512), [[y, !de.value]]),
					d("span", null, b(t.filename), 1),
					d("audio", {
						ref_key: "media",
						ref: o,
						src: t.src,
						preload: "auto",
						onPlay: Z,
						onPause: Q,
						onLoadedmetadata: je,
						onTimeupdate: $,
						onProgress: $,
						onEnded: Me,
						onError: Ne
					}, null, 40, lt)
				], 2)),
				!j.value && !H.value ? (v(), u(i, {
					key: 2,
					type: "button",
					class: "mjr-studio-player__big-play",
					"aria-label": T(e)("viewer.studio.play", "Play"),
					onClick: Pe
				}, {
					default: m(() => [...r[15] ||= [d("i", {
						class: "pi pi-play",
						"aria-hidden": "true"
					}, null, -1)]]),
					_: 1
				}, 8, ["aria-label"])) : p("", !0),
				H.value ? (v(), C("div", ut, b(H.value), 1)) : p("", !0),
				d("div", {
					class: "mjr-studio-player__controls",
					onPointerdown: r[11] ||= h(() => {}, ["stop"])
				}, [d("div", {
					ref_key: "track",
					ref: ae,
					class: "mjr-studio-player__track",
					role: "slider",
					"aria-label": T(e)("viewer.studio.seek", "Seek"),
					"aria-valuemin": 0,
					"aria-valuemax": N.value,
					"aria-valuenow": M.value,
					onPointerdown: Be,
					onPointermove: Ve,
					onPointerup: He,
					onPointerleave: r[5] ||= (e) => me.value = null
				}, [
					d("div", {
						class: "mjr-studio-player__buffered",
						style: x({ width: `${be.value}%` })
					}, null, 4),
					xe.value ? (v(), C("div", {
						key: 0,
						class: "mjr-studio-player__loop",
						style: x(xe.value)
					}, null, 4)) : p("", !0),
					d("div", {
						class: "mjr-studio-player__progress",
						style: x({ width: `${ye.value}%` })
					}, null, 4),
					d("div", {
						class: "mjr-studio-player__thumb",
						style: x({ left: `${ye.value}%` })
					}, null, 4),
					Se.value == null ? p("", !0) : (v(), C("div", {
						key: 1,
						class: "mjr-studio-player__hover",
						style: x({ left: `${me.value}%` })
					}, [S(b(T(Ke)(Se.value)), 1), U.value ? (v(), C(l, { key: 0 }, [S(" · f" + b(T(qe)(Se.value, U.value)), 1)], 64)) : p("", !0)], 4))
				], 40, dt), d("div", ft, [
					f(i, {
						type: "button",
						class: "mjr-studio-btn",
						title: T(e)("viewer.studio.playPause", "Play / pause (Space)"),
						onClick: Pe
					}, {
						default: m(() => [d("i", {
							class: w(j.value ? "pi pi-pause" : "pi pi-play"),
							"aria-hidden": "true"
						}, null, 2)]),
						_: 1
					}, 8, ["title"]),
					t.kind === "video" ? (v(), C(l, { key: 0 }, [f(i, {
						type: "button",
						class: "mjr-studio-btn",
						title: T(e)("viewer.studio.prevFrame", "Previous frame (,)"),
						onClick: r[6] ||= (e) => Ie(-1)
					}, {
						default: m(() => [...r[16] ||= [d("i", {
							class: "pi pi-step-backward",
							"aria-hidden": "true"
						}, null, -1)]]),
						_: 1
					}, 8, ["title"]), f(i, {
						type: "button",
						class: "mjr-studio-btn",
						title: T(e)("viewer.studio.nextFrame", "Next frame (.)"),
						onClick: r[7] ||= (e) => Ie(1)
					}, {
						default: m(() => [...r[17] ||= [d("i", {
							class: "pi pi-step-forward",
							"aria-hidden": "true"
						}, null, -1)]]),
						_: 1
					}, 8, ["title"])], 64)) : p("", !0),
					d("span", pt, [S(b(T(Ke)(M.value)) + " ", 1), d("span", mt, "/ " + b(T(Ke)(N.value)), 1)]),
					t.kind === "video" && U.value ? (v(), C("span", {
						key: 1,
						class: "mjr-studio-chip",
						title: T(e)("viewer.studio.frame", "Frame")
					}, [
						S(" f " + b(W.value), 1),
						ve.value ? (v(), C(l, { key: 0 }, [S(" / " + b(ve.value - 1), 1)], 64)) : p("", !0),
						S(" · " + b(Math.round(U.value * 100) / 100) + " fps ", 1)
					], 8, ht)) : p("", !0),
					r[24] ||= d("span", { class: "mjr-studio-player__spacer" }, null, -1),
					d("div", {
						class: "mjr-studio-player__group",
						title: T(e)("viewer.studio.abLoop", "A-B loop (I / O, U to clear)")
					}, [
						f(i, {
							type: "button",
							class: w(["mjr-studio-btn is-text", { "is-on": z.value != null }]),
							onClick: nt
						}, {
							default: m(() => [...r[18] ||= [S("A", -1)]]),
							_: 1
						}, 8, ["class"]),
						f(i, {
							type: "button",
							class: w(["mjr-studio-btn is-text", { "is-on": B.value != null }]),
							onClick: rt
						}, {
							default: m(() => [...r[19] ||= [S("B", -1)]]),
							_: 1
						}, 8, ["class"]),
						z.value != null || B.value != null ? (v(), u(i, {
							key: 0,
							type: "button",
							class: "mjr-studio-btn",
							title: T(e)("viewer.studio.clearLoop", "Clear A-B loop"),
							onClick: yt
						}, {
							default: m(() => [...r[20] ||= [d("i", {
								class: "pi pi-times",
								"aria-hidden": "true"
							}, null, -1)]]),
							_: 1
						}, 8, ["title"])) : p("", !0)
					], 8, gt),
					f(i, {
						type: "button",
						class: w(["mjr-studio-btn", { "is-on": R.value }]),
						title: T(e)("viewer.studio.loop", "Loop"),
						onClick: r[8] ||= (e) => R.value = !R.value
					}, {
						default: m(() => [...r[21] ||= [d("i", {
							class: "pi pi-replay",
							"aria-hidden": "true"
						}, null, -1)]]),
						_: 1
					}, 8, ["class", "title"]),
					f(i, {
						type: "button",
						class: w(["mjr-studio-btn is-text", { "is-on": L.value !== 1 }]),
						title: T(e)("viewer.studio.speed", "Speed ([ / ])"),
						onClick: r[9] ||= (e) => We(1, !0)
					}, {
						default: m(() => [S(b(L.value) + "×", 1)]),
						_: 1
					}, 8, ["class", "title"]),
					d("div", _t, [f(i, {
						type: "button",
						class: "mjr-studio-btn",
						title: T(e)("viewer.studio.mute", "Mute (M)"),
						onClick: Ge
					}, {
						default: m(() => [d("i", {
							class: w(I.value || F.value === 0 ? "pi pi-volume-off" : "pi pi-volume-up"),
							"aria-hidden": "true"
						}, null, 2)]),
						_: 1
					}, 8, ["title"]), d("div", {
						class: "mjr-studio-player__volume",
						role: "slider",
						"aria-label": T(e)("viewer.studio.volume", "Volume"),
						"aria-valuemin": 0,
						"aria-valuemax": 1,
						"aria-valuenow": I.value ? 0 : F.value,
						onPointerdown: et,
						onPointermove: et,
						onPointerup: r[10] ||= (e) => Je.value = !1
					}, [d("div", {
						class: "mjr-studio-player__volume-fill",
						style: x({ width: `${(I.value ? 0 : F.value) * 100}%` })
					}, null, 4)], 40, vt)]),
					t.kind === "video" ? (v(), u(i, {
						key: 2,
						type: "button",
						class: "mjr-studio-btn",
						title: T(e)("viewer.studio.exportFrame", "Save this frame as PNG"),
						onClick: xt
					}, {
						default: m(() => [...r[22] ||= [d("i", {
							class: "pi pi-camera",
							"aria-hidden": "true"
						}, null, -1)]]),
						_: 1
					}, 8, ["title"])) : p("", !0),
					t.kind === "video" ? (v(), u(i, {
						key: 3,
						type: "button",
						class: "mjr-studio-btn",
						title: T(e)("viewer.studio.fullscreen", "Fullscreen (F)"),
						onClick: bt
					}, {
						default: m(() => [...r[23] ||= [d("i", {
							class: "pi pi-window-maximize",
							"aria-hidden": "true"
						}, null, -1)]]),
						_: 1
					}, 8, ["title"])) : p("", !0)
				])], 32)
			], 34);
		};
	}
}), bt = (e, t = null) => {
	let n = a(e);
	return n === void 0 ? t : n;
}, xt = n?.VIEWER_GENINFO_TTL_MS ?? 3e4, St = n?.VIEWER_GENINFO_ERROR_TTL_MS ?? 8e3, Ct = n?.VIEWER_GENINFO_MAX_ENTRIES ?? 300, wt = /* @__PURE__ */ new Map(), Tt = /* @__PURE__ */ new Map(), Et = /* @__PURE__ */ new Map(), Dt = (e, t, n) => {
	try {
		let r = Date.now();
		for (let [n, i] of e.entries()) i ? r - (i.at || 0) > t && e.delete(n) : e.delete(n);
		if (e.size <= n) return;
		let i = Array.from(e.entries()).sort((e, t) => (e?.[1]?.at || 0) - (t?.[1]?.at || 0)), a = e.size - n;
		for (let t = 0; t < a; t++) {
			let n = i[t]?.[0];
			n != null && e.delete(n);
		}
	} catch (e) {
		console.debug?.(e);
	}
}, Ot = (e, t, n) => {
	try {
		let r = e.get(t);
		return r ? Date.now() - (r.at || 0) > n ? (e.delete(t), null) : r.data ?? null : null;
	} catch {
		return null;
	}
}, kt = (e, t, n, r, i) => {
	try {
		e.set(t, {
			at: Date.now(),
			data: n
		}), Dt(e, r, i);
	} catch (e) {
		console.debug?.(e);
	}
}, At = (e) => {
	try {
		let t = e?.id;
		if (t != null) return `id:${t}`;
		let n = It(e);
		if (n) return `fp:${n}`;
		let r = String(e?.filename || e?.name || "").trim(), i = String(e?.subfolder || "").trim(), a = String(e?.source || e?.type || "output").trim().toLowerCase();
		if (r) return `name:${a}:${i}:${r}`;
	} catch (e) {
		console.debug?.(e);
	}
	return null;
}, jt = (e) => {
	try {
		if (!e || typeof e != "object") return null;
		let t = e?.metadata_raw;
		return t && typeof t == "object" && t.geninfo_status && typeof t.geninfo_status == "object" ? t.geninfo_status : e?.geninfo_status && typeof e.geninfo_status == "object" ? e.geninfo_status : null;
	} catch {
		return null;
	}
}, Mt = (e, t) => {
	try {
		if (!e || typeof e != "object" || !t || typeof t != "object") return;
		try {
			e.geninfo_status = t;
		} catch (e) {
			console.debug?.(e);
		}
		try {
			let n = e.metadata_raw;
			if (n && typeof n == "object") {
				n.geninfo_status = t, e.metadata_raw = n;
				return;
			}
			if (typeof n == "string") return;
		} catch (e) {
			console.debug?.(e);
		}
		try {
			e.metadata_raw = { geninfo_status: t };
		} catch (e) {
			console.debug?.(e);
		}
	} catch (e) {
		console.debug?.(e);
	}
}, Nt = (e) => {
	try {
		if (!e || typeof e != "object") return !1;
		if (e.geninfo && typeof e.geninfo == "object" && Object.keys(e.geninfo).length || e.prompt != null || e.workflow != null || e.metadata != null || e.exif != null) return !0;
		let t = e.metadata_raw;
		if (t && typeof t == "object") {
			for (let e of [
				"geninfo",
				"GenInfo",
				"generation",
				"prompt",
				"Prompt",
				"negative_prompt",
				"workflow",
				"Workflow",
				"comfy_workflow",
				"geninfo_status"
			]) if (t[e] != null) return !0;
			return !1;
		}
		if (typeof t == "string") {
			let e = t.trim();
			if (!e || e === "{}" || e === "null" || e === "[]" || e === "{{}}") return !1;
			for (let t of [
				"Negative prompt:",
				"\"prompt\"",
				"\"negative_prompt\"",
				"\"geninfo\"",
				"\"workflow\"",
				"\"comfy_workflow\""
			]) if (e.includes(t)) return !0;
			return !1;
		}
		return !1;
	} catch {
		return !1;
	}
}, Pt = (e) => {
	let t = typeof e == "string" ? e.trim() : "";
	if (!t || t.includes("\n")) return !1;
	if (/^[A-Za-z]:[\\/]/.test(t)) return !0;
	let n = t.replace(/\\/g, "/");
	return /(?:^|\/)[^/\n]+\.(?:png|jpe?g|webp|gif|bmp|tiff?|avif|heic|heif|apng|hdr|svg|mp4|webm|mov|mkv|avi|m4v|mp3|wav|flac|ogg)$/i.test(n);
}, Ft = (e) => {
	try {
		if (!e || typeof e != "object") return !1;
		if (e.geninfo && typeof e.geninfo == "object" && Object.keys(e.geninfo).length) return !0;
		if (e.metadata_raw && typeof e.metadata_raw == "object") {
			let t = e.metadata_raw;
			if (t.geninfo || t.GenInfo || t.generation || t.parameters || typeof t.prompt == "string" && t.prompt.trim() && !Pt(t.prompt) || t.prompt && typeof t.prompt == "object") return !0;
			let n = t.raw_ffprobe?.format?.tags || t.ffprobe?.format?.tags || null;
			if (n && typeof n == "object") {
				let e = n.prompt || n["comfyui:prompt"] || n.comfy_prompt;
				if (e && !Pt(e)) return !0;
			}
		}
		return !!(e.prompt && typeof e.prompt == "object" || typeof e.prompt == "string" && e.prompt.trim() && !Pt(e.prompt));
	} catch {
		return !1;
	}
}, It = (e) => {
	let t = e?.filepath || e?.path || e?.file_info?.filepath || e?.file_info?.path || e?.filePath || null;
	return typeof t == "string" && t.trim() || null;
}, Lt = (e) => {
	try {
		if (String(e?.mime || e?.mimetype || e?.type || "").toLowerCase().startsWith("video/")) return !0;
		let t = (It(e) || String(e?.filename || e?.name || "")).split(".").pop()?.toLowerCase?.() || "";
		return [
			"mp4",
			"webm",
			"mov",
			"mkv",
			"avi",
			"m4v",
			"gif"
		].includes(t);
	} catch {
		return !1;
	}
}, Rt = (e) => {
	if (!e) return null;
	if (typeof e == "object") return e;
	if (typeof e != "string") return null;
	let t = e.trim();
	return t ? bt(() => {
		let e = JSON.parse(t);
		return e && typeof e == "object" ? e : null;
	}, null) : null;
}, zt = (e) => {
	try {
		if (!Lt(e) || e?.geninfo || e?.prompt || e?.workflow || e?.metadata) return;
		let t = Rt(e?.metadata_raw) || {};
		if (t.geninfo_status) return;
		if (e?.geninfo_status) {
			t.geninfo_status = e.geninfo_status, e.metadata_raw = t;
			return;
		}
		t.geninfo_status = { kind: "media_pipeline" }, e.metadata_raw = t;
	} catch (e) {
		console.debug?.(e);
	}
}, Bt = (e, t) => {
	let n = t && typeof t == "object" ? t : null;
	if (!n) return e;
	try {
		e.prompt = e.prompt ?? n.prompt;
	} catch (e) {
		console.debug?.(e);
	}
	try {
		e.workflow = e.workflow ?? n.workflow;
	} catch (e) {
		console.debug?.(e);
	}
	try {
		e.geninfo = e.geninfo ?? n.geninfo;
	} catch (e) {
		console.debug?.(e);
	}
	try {
		e.geninfo_status = e.geninfo_status ?? n.geninfo_status;
	} catch (e) {
		console.debug?.(e);
	}
	try {
		e.exif = e.exif ?? n.exif;
	} catch (e) {
		console.debug?.(e);
	}
	try {
		e.ffprobe = e.ffprobe ?? n.ffprobe;
	} catch (e) {
		console.debug?.(e);
	}
	try {
		if (e.metadata_raw == null) e.metadata_raw = n;
		else {
			let t = Rt(e.metadata_raw);
			if (t && typeof t == "object") {
				for (let e of [
					"geninfo_status",
					"workflow",
					"prompt",
					"geninfo"
				]) (t[e] == null && n[e] != null || e === "prompt" && Pt(t[e]) && n[e] != null) && (t[e] = n[e]);
				n.raw_ffprobe && t.raw_ffprobe == null && (t.raw_ffprobe = n.raw_ffprobe), n.ffprobe && t.ffprobe == null && (t.ffprobe = n.ffprobe), e.metadata_raw = t;
			}
		}
	} catch (e) {
		console.debug?.(e);
	}
	return e;
};
async function Vt(e, { getAssetMetadata: t, getFileMetadataScoped: n, metadataCache: r, signal: i } = {}) {
	if (!e || typeof e != "object") return e;
	let a = e?.id ?? null, o = At(e), s = e, c = o ? Ot(wt, o, xt) : null;
	if (c && typeof c == "object") return {
		...e,
		...c
	};
	let l = o ? Ot(Tt, o, St) : null;
	if (l) {
		try {
			Mt(s, l);
		} catch (e) {
			console.debug?.(e);
		}
		return s;
	}
	if (o && Et.has(o)) try {
		let e = Et.get(o);
		if (e && typeof e.then == "function") return await e;
	} catch (e) {
		console.debug?.(e);
	}
	let u = async () => {
		let c = a == null ? null : bt(() => r?.getCached?.(a)?.data || null, null);
		c && typeof c == "object" && (s = {
			...e,
			...c
		});
		let l = !!(s?.has_generation_data || s?.has_workflow || s?.has_generation || s?.has_generation_info), u = !!(s?.geninfo || s?.prompt || s?.workflow || s?.metadata), d = null;
		if (a != null && (!Ft(s) || l && !u)) {
			let e = await bt(() => t?.(a, i ? { signal: i } : {}), null);
			e?.ok && e.data && typeof e.data == "object" ? (s = {
				...s,
				...e.data
			}, bt(() => r?.setCached?.(a, e.data))) : e && e?.code !== "ABORTED" && (d = {
				kind: "fetch_error",
				stage: "asset",
				code: e?.code || "FETCH_ERROR",
				message: e?.error || "Failed to load asset metadata"
			});
		}
		if (!Ft(s)) try {
			let e = String(s?.source || s?.type || "output").trim().toLowerCase() || "output", t = String(s?.filename || s?.name || s?.file_info?.filename || "").trim(), r = String(s?.subfolder || s?.file_info?.subfolder || "").trim(), a = String(s?.root_id || s?.rootId || s?.file_info?.root_id || "").trim(), o = String(s?.filepath || s?.path || s?.file_info?.filepath || "").trim();
			if (t) {
				let c = await bt(() => n?.({
					type: e,
					filename: t,
					subfolder: r,
					root_id: a,
					filepath: o
				}, i ? { signal: i } : {}), null);
				c?.ok && c.data ? s = Bt({ ...s }, c.data) : c && c?.code !== "ABORTED" && (d = {
					kind: "fetch_error",
					stage: "file_scoped",
					code: c?.code || "FETCH_ERROR",
					message: c?.error || "Failed to extract file metadata"
				});
			}
		} catch (e) {
			console.debug?.(e);
		}
		if (zt(s), !Nt(s) && d) {
			let e = jt(s);
			e && e.kind === "media_pipeline" || Mt(s, d);
		}
		return Ft(s) && o ? kt(wt, o, s, xt, Ct) : d && o && kt(Tt, o, d, St, Ct), s;
	};
	if (o) {
		let e = () => {
			try {
				Et.delete(o);
			} catch (e) {
				console.debug?.(e);
			}
		};
		try {
			i?.addEventListener?.("abort", e, { once: !0 });
		} catch (e) {
			console.debug?.(e);
		}
		let t = u().finally(() => {
			try {
				i?.removeEventListener?.("abort", e);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				Et.delete(o);
			} catch (e) {
				console.debug?.(e);
			}
		});
		return Et.set(o, t), await t;
	}
	return await u();
}
export { Ee as C, H as S, Ae as _, et as a, ze as b, Q as c, Me as d, Ne as f, Ie as g, Y as h, rt as i, J as l, q as m, yt as n, Ge as o, Pe as p, tt as r, Re as s, Vt as t, Le as u, je as v, we as w, Fe as x, X as y };
