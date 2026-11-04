import { ar as e, rn as t } from "./client-BvjF14km.js";
import { t as n } from "./config-BFDzOF1N.js";
import { _ as r, f as i, p as a } from "./generationSectionState-C3QjLGhL.js";
import { r as o } from "./events-1iwo5blr.js";
import { $ as s, B as c, C as l, D as u, E as d, H as ee, J as te, M as f, O as p, P as m, Q as h, S as g, T as _, V as v, W as y, X as ne, b, gt as x, ht as S, j as C, k as w, mt as T, pt as E, q as re, st as D } from "./mjr-primevue-C07IsEdU.js";
// ui/features/viewer/model3dCore.ts
function ie(e, t) {
	if (e && typeof t == "function") try {
		e.traverse?.((e) => {
			(e?.isMesh || e?.isPoints || e?.isLine) && t(e);
		});
	} catch (e) {
		console.debug?.(e);
	}
}
function ae(e) {
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
function oe(e) {
	let t = /* @__PURE__ */ new Map();
	return ie(e, (e) => {
		t.set(e.uuid, e.material);
	}), t;
}
function O(e, t, n, r, i) {
	ie(t, (t) => {
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
function se(e) {
	if (e) {
		for (let t of e) try {
			t?.dispose?.();
		} catch (e) {
			console.debug?.(e);
		}
		e.clear();
	}
}
function ce(e, t) {
	try {
		if (t === "gltf" || t === "fbx") return Array.isArray(e?.animations) ? e.animations : [];
	} catch (e) {
		console.debug?.(e);
	}
	return [];
}
function le(e, t) {
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
function ue(e, t, n, r) {
	if (!r || !t || !n) return;
	let i = t.fov * (Math.PI / 180), a = r.maxDim / (2 * Math.tan(i / 2)) * 1.55, o = new e.Vector3(1, .8, 1).normalize();
	t.position.copy(r.center).addScaledVector(o, a), t.near = Math.max(.01, a / 250), t.far = Math.max(1e3, a * 60), t.updateProjectionMatrix(), n.target.copy(r.center), n.minDistance = Math.max(.01, a / 25), n.maxDistance = Math.max(10, a * 12), n.minZoom = .25, n.maxZoom = 12, n.update();
}
function k(e, t, n, r) {
	if (!n || !e || !t) return null;
	let i = Math.max(1e-4, Number(r) || 1), a = Math.max(n.maxDim * 1.9, 2), o = a * i;
	return e.left = -o / 2, e.right = o / 2, e.top = a / 2, e.bottom = -a / 2, e.near = -Math.max(1e3, n.maxDim * 40), e.far = Math.max(1e3, n.maxDim * 40), e.zoom = 1, e.position.copy(n.center).add({
		x: n.radius * 2.1,
		y: n.radius * 1.6,
		z: n.radius * 2.1
	}), e.updateProjectionMatrix(), t.target.copy(n.center), t.minZoom = .25, t.maxZoom = 12, t.minDistance = 0, t.maxDistance = Math.max(10, n.maxDim * 12), t.update(), a;
}
function A(e, t, n) {
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
var j = "/mjr/am/vendor/three", de = null;
function fe(e, t, n) {
	switch (t) {
		case "gltf": return new e.GLTFLoader(n);
		case "obj": return new e.OBJLoader(n);
		case "fbx": return new e.FBXLoader(n);
		case "stl": return new e.STLLoader(n);
		case "ply": return new e.PLYLoader(n);
		default: return null;
	}
}
function M(e, t, n) {
	return new Promise((t, r) => {
		!e || !n ? r(/* @__PURE__ */ Error("Missing loader or URL")) : typeof e.loadAsync == "function" ? e.loadAsync(n).then(t).catch(r) : e.load(n, t, void 0, r);
	});
}
function N() {
	return de || (de = Promise.all([
		import(
			/* @vite-ignore */
			`${j}/three.module.js`
),
		import(
			/* @vite-ignore */
			`${j}/addons/controls/OrbitControls.js`
),
		import(
			/* @vite-ignore */
			`${j}/addons/loaders/GLTFLoader.js`
),
		import(
			/* @vite-ignore */
			`${j}/addons/loaders/FBXLoader.js`
),
		import(
			/* @vite-ignore */
			`${j}/addons/loaders/OBJLoader.js`
),
		import(
			/* @vite-ignore */
			`${j}/addons/loaders/MTLLoader.js`
),
		import(
			/* @vite-ignore */
			`${j}/addons/loaders/STLLoader.js`
),
		import(
			/* @vite-ignore */
			`${j}/addons/loaders/PLYLoader.js`
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
	})), de);
}
// ui/features/viewer/imageProcessor.ts
function P(e, t, n) {
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
var F = [
	.25,
	.5,
	1,
	1.5,
	2
], I = 44;
function L(e, { preventDefault: t = !1, immediate: n = !1 } = {}) {
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
function R(e) {
	let t = Math.max(0, Number(e) || 0), n = Math.floor(t / 60), r = Math.floor(t % 60);
	return n > 0 ? `${n}:${String(r).padStart(2, "0")}` : `${Math.floor(t)}s`;
}
function z(e, n) {
	let r = document.createElement("button");
	return r.type = "button", r.textContent = String(e || ""), r.title = String(n || e || ""), r.setAttribute("aria-label", String(n || e || t("model3d.viewportAction", "3D viewport action"))), r.style.cssText = "height:28px;padding:0 10px;border-radius:999px;border:1px solid rgba(255,255,255,0.16);background:rgba(13,15,20,0.78);color:rgba(255,255,255,0.92);font:600 11px system-ui,sans-serif;letter-spacing:0.02em;cursor:pointer;backdrop-filter:blur(8px);display:inline-flex;align-items:center;justify-content:center;box-shadow:0 4px 18px rgba(0,0,0,0.24)", r;
}
function B(e, t) {
	if (!e) return;
	let n = !!t;
	e.dataset.active = n ? "1" : "0", e.style.background = n ? "rgba(76,175,80,0.18)" : "rgba(13,15,20,0.78)", e.style.borderColor = n ? "rgba(76,175,80,0.42)" : "rgba(255,255,255,0.16)", e.style.color = n ? "rgba(230,255,235,0.96)" : "rgba(255,255,255,0.92)";
}
function V(e, n, r = "", i = "#4CAF50") {
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
			P(e, n, r || t("model3d.unavailable", "3D viewer unavailable"));
		} catch (e) {
			console.debug?.(e);
		}
	}
}
function pe({ defaultBgColor: e, defaultFov: n, defaultLightIntensity: r, hasSkeleton: i } = {}) {
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
		a.addEventListener(e, (e) => L(e, { preventDefault: !1 }));
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
	u.type = "color", u.value = e || "#282828", u.style.cssText = "width:34px;height:24px;cursor:pointer;border:1px solid rgba(255,255,255,0.18);border-radius:4px;padding:1px;background:none;flex-shrink:0;", s(t("model3d.background", "Background"), u), o("Model");
	let d = c([
		["original", "Original"],
		["normal", "Normal map"],
		["depth", "Depth"],
		["wireframe", "Wireframe"],
		["pointcloud", "Point cloud"]
	], "original");
	s(t("model3d.material", "Material"), d);
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
	i && (f = document.createElement("input"), f.type = "checkbox", f.checked = !1, f.style.cssText = "cursor:pointer;accent-color:#4CAF50;flex-shrink:0;", te = s(t("model3d.skeleton", "Skeleton"), f)), o("Camera");
	let p = l(15, 120, 1, n ?? 75);
	s("FOV", p.wrap), o(t("model3d.lights", "Lights"));
	let m = l(0, 5, .1, r ?? 1);
	return s(t("model3d.intensity", "Intensity"), m.wrap), {
		panel: a,
		bgInput: u,
		materialSel: d,
		upSel: ee,
		skeletonToggle: f,
		skeletonRow: te,
		fovSlider: p.slider,
		fovValLbl: p.valLbl,
		lightSlider: m.slider,
		lightValLbl: m.valLbl
	};
}
function me() {
	let e = document.createElement("div");
	e.className = "mjr-model3d-anim-bar", e.style.cssText = [
		"position:absolute",
		"bottom:0",
		"left:0",
		"right:0",
		`height:${I}px`,
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
		e.addEventListener(t, (e) => L(e, { preventDefault: !1 }));
	});
	let n = document.createElement("button");
	n.type = "button", n.textContent = t("model3d.play", "Play"), n.title = t("model3d.playPause", "Play / Pause"), n.style.cssText = "width:28px;height:28px;border-radius:50%;border:1px solid rgba(255,255,255,0.18);background:rgba(76,175,80,0.14);color:rgba(255,255,255,0.92);font:600 12px system-ui,sans-serif;cursor:pointer;flex-shrink:0;padding:0;line-height:1;display:flex;align-items:center;justify-content:center";
	let r = document.createElement("select");
	r.title = t("model3d.playbackSpeed", "Playback speed"), r.style.cssText = "background:rgba(20,24,34,0.9);color:rgba(255,255,255,0.8);border:1px solid rgba(255,255,255,0.14);border-radius:6px;padding:3px 4px;font:11px system-ui,sans-serif;cursor:pointer;width:52px;flex-shrink:0";
	for (let e of F) {
		let t = document.createElement("option");
		t.value = String(e), t.textContent = `${e}x`, e === 1 && (t.selected = !0), r.appendChild(t);
	}
	let i = document.createElement("select");
	i.title = "Animation clip", i.style.cssText = "background:rgba(20,24,34,0.9);color:rgba(255,255,255,0.8);border:1px solid rgba(255,255,255,0.14);border-radius:6px;padding:3px 5px;font:11px system-ui,sans-serif;cursor:pointer;max-width:130px;flex-shrink:1;min-width:0";
	let a = document.createElement("input");
	a.type = "range", a.min = "0", a.max = "1000", a.value = "0", a.style.cssText = "flex:1;min-width:50px;cursor:pointer;accent-color:#4CAF50;height:3px;";
	let o = document.createElement("span");
	return o.style.cssText = "font:500 11px system-ui,sans-serif;color:rgba(255,255,255,0.45);white-space:nowrap;flex-shrink:0", o.textContent = "0s / 0s", e.appendChild(n), e.appendChild(r), e.appendChild(i), e.appendChild(a), e.appendChild(o), {
		bar: e,
		playBtn: n,
		speedSel: r,
		animSel: i,
		progressSlider: a,
		timeLbl: o
	};
}
// ui/features/viewer/model3dRenderer.impl.ts
var H = Object.freeze({
	".gltf": "gltf",
	".glb": "gltf",
	".obj": "obj",
	".fbx": "fbx",
	".stl": "stl",
	".ply": "ply",
	".splat": "splat",
	".ksplat": "splat",
	".spz": "splat"
}), U = new Set(Object.keys(H)), he = /* @__PURE__ */ new Set([
	"gltf",
	"obj",
	"fbx",
	"stl",
	"ply"
]), ge = "#282828", W = t("model3d.controlHint", "Rotate: left drag  Pan: right drag  Zoom: wheel"), G = Object.freeze({
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
var _e = Object.freeze({
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
}), ve = 75, ye = 1, K = Object.freeze({
	ambient: .5,
	main: .8,
	fill: .3,
	back: .3,
	rim: .3,
	bottom: .2
});
function be(e) {
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
function xe(e) {
	let t = String(e || "").trim();
	return t ? t.startsWith("/") || /^[a-z][\w+\-.]*:/i.test(t) : !1;
}
function q(e) {
	return String(e?.loader || e?.viewer_info?.loader || "").trim().toLowerCase() || H[be(e)] || "";
}
function Se(e) {
	return q(e) || "gltf";
}
function Ce(e) {
	try {
		return !!e?.closest?.(".mjr-model3d-host, .mjr-viewer-model3d-host, .mjr-mfv-model3d-host");
	} catch {
		return !1;
	}
}
function we(e, t) {
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
function Te(r, i, a = {}) {
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
	let d = be(r).replace(".", "").toUpperCase();
	if (d) {
		let e = document.createElement("div");
		e.className = "mjr-model3d-badge", e.textContent = d, e.style.cssText = "position:absolute;top:10px;left:10px;padding:4px 8px;border-radius:999px;font:700 10px system-ui,sans-serif;letter-spacing:0.08em;color:#fff;background:rgba(76,175,80,0.9);pointer-events:none;z-index:2", c.appendChild(e);
	}
	let ee = document.createElement("div");
	ee.className = "mjr-model3d-toolbar", ee.style.cssText = "position:absolute;top:10px;right:10px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;pointer-events:none;z-index:5";
	let te = document.createElement("div");
	te.style.cssText = "display:flex;align-items:center;gap:6px;flex-wrap:wrap;pointer-events:auto;";
	let f = z(t("model3d.reset", "Reset"), t("model3d.resetView", "Reset 3D view")), p = z(t("model3d.grid", "Grid"), t("model3d.toggleGrid", "Toggle grid")), m = z(t("model3d.persp", "Persp"), t("model3d.switchCamera", "Switch perspective / orthographic")), h = z(t("model3d.settings", "Settings"), t("model3d.settings", "Settings"));
	te.append(f, p, m, h), ee.appendChild(te), c.appendChild(ee);
	let g = document.createElement("div");
	g.className = "mjr-model3d-hint", g.textContent = a.hintText || W, g.style.cssText = "position:absolute;right:10px;bottom:10px;padding:5px 10px;border-radius:999px;font:500 11px system-ui,sans-serif;color:rgba(255,255,255,0.75);background:rgba(0,0,0,0.35);backdrop-filter:blur(6px);pointer-events:none;z-index:2;transition:bottom 0.2s", c.appendChild(g);
	let _ = pe({
		defaultBgColor: ge,
		defaultFov: ve,
		defaultLightIntensity: ye,
		hasSkeleton: !1
	});
	c.appendChild(_.panel);
	let v = me();
	c.appendChild(v.bar);
	let y = !1, ne = null, b = null, x = null, S = null, C = null, w = null, T = null, E = null, re = null, D = null, ie = !1, j = null, de = null, P = null, F = null, I = null, H = null, U = 0, q = G.PERSPECTIVE, Ce = /* @__PURE__ */ new Map(), Te = /* @__PURE__ */ new Set(), Ee = null, De = !1, Oe = null, ke = [], Ae = ye, J = null, je = null, Y = [], X = [], Z = 0, Me = 1, Q = !1, Ne = !1, Pe = !1, Fe = String(r?.filename || "3D model"), Ie = () => {
		try {
			a.scheduleOverlayRedraw?.();
		} catch (e) {
			console.debug?.(e);
		}
	}, $ = (e, t = "", n = "#4CAF50") => {
		j = {
			title: e,
			hintText: t,
			accent: n
		}, u.style.display = "block", V(u, e, t, n);
	}, Le = () => {
		j = null, u.style.display = "none";
	}, Re = () => {
		try {
			let e = c.getBoundingClientRect();
			l._mjrNaturalW = Math.max(1, Math.round(e.width || l.width || 1)), l._mjrNaturalH = Math.max(1, Math.round(e.height || l.height || 1));
		} catch (e) {
			console.debug?.(e);
		}
		try {
			j && V(u, j.title, j.hintText, j.accent);
		} catch (e) {
			console.debug?.(e);
		}
	}, ze = (e, t) => {
		if (!T || !(U > 0)) return;
		let n = Math.max(1e-4, (Number(e) || 1) / Math.max(1, Number(t) || 1)), r = U * n;
		T.left = -r / 2, T.right = r / 2, T.top = U / 2, T.bottom = -U / 2, T.updateProjectionMatrix();
	}, Be = () => {
		if (F && E && H) {
			if (q === G.ORTHOGRAPHIC) {
				let e = c.getBoundingClientRect();
				U = k(T, E, H, Math.max(1e-4, (e.width || 1) / Math.max(1, e.height || 1))) || U, C = T;
			} else ue(b, w, E, H), C = w;
			try {
				E.object = C, E.update();
			} catch (e) {
				console.debug?.(e);
			}
		}
	}, Ve = (e, { refit: t = !0 } = {}) => {
		q = e === G.ORTHOGRAPHIC ? G.ORTHOGRAPHIC : G.PERSPECTIVE, C = q === G.ORTHOGRAPHIC ? T : w;
		try {
			E && (E.object = C);
		} catch (e) {
			console.debug?.(e);
		}
		if (t) Be();
		else {
			try {
				C?.updateProjectionMatrix?.();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				E?.update?.();
			} catch (e) {
				console.debug?.(e);
			}
		}
		Xe(), Ie();
	}, He = (e) => {
		Ae = Math.max(0, Math.min(10, Number(e) || 0));
		try {
			Oe && (Oe.intensity = K.ambient * Ae);
		} catch (e) {
			console.debug?.(e);
		}
		let t = [
			K.main,
			K.back,
			K.fill,
			K.fill,
			K.bottom
		];
		ke.forEach((e, n) => {
			try {
				e && (e.intensity = (t[n] ?? K.fill) * Ae);
			} catch (e) {
				console.debug?.(e);
			}
		});
	}, Ue = (e) => {
		I && b && (se(Te), O(b, I, e, Ce, Te), Ie());
	}, We = (e) => {
		if (!F) return;
		let t = _e[e] || [
			0,
			0,
			0
		];
		try {
			F.rotation.set(t[0], t[1], t[2]), F.updateMatrixWorld(!0);
		} catch (e) {
			console.debug?.(e);
		}
		b && (H = le(b, F)), Be();
	}, Ge = (e) => {
		if (Ee) try {
			Ee.visible = !!e;
		} catch (e) {
			console.debug?.(e);
		}
	}, Ke = () => {
		if (!J || Y.length === 0) return;
		let e = X[Z];
		if (!e) return;
		let t = Y[Z]?.duration || 0, n = e.time || 0;
		try {
			v.timeLbl.textContent = `${R(n)} / ${R(t)}`;
		} catch (e) {
			console.debug?.(e);
		}
		if (!Ne && t > 0) try {
			let e = Number(v.progressSlider.max) || 1e3;
			v.progressSlider.value = String(Math.round(n / t * e));
		} catch (e) {
			console.debug?.(e);
		}
	}, qe = (e) => {
		if (!J || !Y.length) return;
		let n = Y[e];
		if (!n) return;
		X.forEach((e) => {
			try {
				e?.stop();
			} catch (e) {
				console.debug?.(e);
			}
		});
		let r = J.clipAction(n);
		r.timeScale = Me, r.clampWhenFinished = !1, r.loop = b?.LoopRepeat ?? 2201, r.play(), X[e] = r, Z = e, Q = !0, v.playBtn.textContent = t("model3d.pause", "Pause");
		try {
			let e = Math.max(100, Math.min(1e4, Math.round((n.duration || 1) * 100)));
			v.progressSlider.max = String(e);
		} catch {}
	}, Je = () => {
		J && Y.length && (Q ? (J.timeScale = 0, Q = !1, v.playBtn.textContent = t("model3d.play", "Play")) : (J.timeScale = Me, X[Z]?.isRunning?.() ? (Q = !0, v.playBtn.textContent = t("model3d.pause", "Pause")) : qe(Z)));
	}, Ye = (e, t) => {
		e && e.length !== 0 && b && (Y = e, J = new b.AnimationMixer(t), je = new b.Clock(), X = Array(e.length).fill(null), v.animSel.innerHTML = "", e.forEach((e, t) => {
			let n = document.createElement("option");
			n.value = String(t), n.textContent = e.name || `Animation ${t + 1}`, v.animSel.appendChild(n);
		}), v.animSel.style.display = e.length > 1 ? "" : "none", v.bar.style.display = "flex", g.style.bottom = "54px", qe(0), v.playBtn.addEventListener("click", (e) => {
			L(e), Je();
		}), v.speedSel.addEventListener("change", () => {
			Me = Number(v.speedSel.value) || 1, J.timeScale = Q ? Me : 0;
			let e = X[Z];
			e && (e.timeScale = Me);
		}), v.animSel.addEventListener("change", () => {
			let e = Number(v.animSel.value) || 0;
			qe(e);
		}), v.progressSlider.addEventListener("pointerdown", () => {
			Ne = !0;
		}), v.progressSlider.addEventListener("pointerup", () => {
			Ne = !1;
			let e = X[Z], t = Y[Z];
			if (e && t) {
				let n = Number(v.progressSlider.max) || 1e3, r = Number(v.progressSlider.value) / n * t.duration;
				e.time = Math.max(0, Math.min(r, t.duration));
			}
		}), v.progressSlider.addEventListener("input", () => {
			let e = X[Z], t = Y[Z];
			if (e && t && Ne) {
				let n = Number(v.progressSlider.max) || 1e3, r = Number(v.progressSlider.value) / n * t.duration;
				e.time = Math.max(0, Math.min(r, t.duration)), v.timeLbl.textContent = `${R(r)} / ${R(t.duration)}`;
			}
		}));
	}, Xe = () => {
		B(p, !!P?.visible), B(m, q === G.ORTHOGRAPHIC), m.textContent = q === G.ORTHOGRAPHIC ? t("model3d.ortho", "Ortho") : t("model3d.persp", "Persp"), B(h, Pe);
	};
	_.bgInput.addEventListener("input", () => {
		let e = _.bgInput.value;
		try {
			S && (S.background = new ((b?.Color) || Object)(e));
		} catch (e) {
			console.debug?.(e);
		}
	}), _.materialSel.addEventListener("change", () => {
		Ue(_.materialSel.value);
	}), _.upSel.addEventListener("change", () => {
		We(_.upSel.value);
	}), _.skeletonToggle && _.skeletonToggle.addEventListener("change", () => {
		Ge(_.skeletonToggle.checked);
	}), _.fovSlider.addEventListener("input", () => {
		let e = Math.max(1, Math.min(179, Number(_.fovSlider.value) || ve));
		try {
			w && (w.fov = e, w.updateProjectionMatrix());
		} catch (e) {
			console.debug?.(e);
		}
	}), _.lightSlider.addEventListener("input", () => {
		He(Number(_.lightSlider.value));
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
		}), t(c, "wheel", (e) => L(e)), t(c, "contextmenu", (e) => L(e, { preventDefault: !0 })), t(c, "dragstart", (e) => L(e, { preventDefault: !0 })), t(c, "dragover", (e) => L(e, { preventDefault: !0 })), t(c, "dragleave", (e) => L(e)), t(c, "drop", (e) => L(e, { preventDefault: !0 })), () => {
			for (let t of e) try {
				t();
			} catch (e) {
				console.debug?.(e);
			}
		};
	}, Qe = () => {
		y = !0;
		try {
			window.removeEventListener(o.RUNTIME_STATUS, tt);
		} catch {}
		try {
			c._mjr3D = null;
		} catch {}
		try {
			re != null && cancelAnimationFrame(re);
		} catch (e) {
			console.debug?.(e);
		}
		re = null;
		try {
			de?.();
		} catch (e) {
			console.debug?.(e);
		}
		de = null;
		try {
			ne?.disconnect?.();
		} catch (e) {
			console.debug?.(e);
		}
		ne = null;
		try {
			E?.dispose?.();
		} catch (e) {
			console.debug?.(e);
		}
		E = null;
		try {
			J?.stopAllAction?.(), J?.uncacheRoot?.(J.getRoot?.());
		} catch (e) {
			console.debug?.(e);
		}
		try {
			for (let e of X) try {
				J?.uncacheAction?.(e);
			} catch {}
		} catch (e) {
			console.debug?.(e);
		}
		try {
			for (let e of Y) try {
				e?.dispose?.();
			} catch {}
		} catch (e) {
			console.debug?.(e);
		}
		J = null, X = [], Y = [], se(Te);
		try {
			Ee && (S?.remove?.(Ee), Ee.dispose?.());
		} catch (e) {
			console.debug?.(e);
		}
		Ee = null;
		try {
			S?.traverse?.((e) => {
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
			x?.dispose?.();
		} catch (e) {
			console.debug?.(e);
		}
		x = null, S = null, C = null, w = null, T = null, I = null, F = null, H = null, D = null;
		try {
			let e = l.getContext("webgl2") || l.getContext("webgl");
			e && e.getExtension("WEBGL_lose_context")?.loseContext?.();
		} catch (e) {
			console.debug?.(e);
		}
	}, $e = () => {
		ie = !0;
		try {
			re != null && cancelAnimationFrame(re);
		} catch (e) {
			console.debug?.(e);
		}
		re = null;
	}, et = () => {
		if (ie = !1, !(y || re != null || typeof D != "function")) try {
			re = requestAnimationFrame(D);
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
		s && (window.addEventListener(o.RUNTIME_STATUS, tt), String(window.__MJR_EXECUTION_RUNTIME__?.active_prompt_id || "").trim() && (ie = !0));
	} catch (e) {
		console.debug?.(e);
	}
	return $("Preparing 3D preview", Fe), Promise.resolve().then(async () => {
		let n = Se(r);
		if (he.has(n)) try {
			let t = await N();
			if (y) return;
			let o = t.THREE;
			b = o;
			let s = new o.LoadingManager();
			s.setURLModifier((t) => {
				if (!t || xe(t)) return t;
				let n = e(r, t);
				if (n) return n;
				try {
					return new URL(t, i).href;
				} catch {
					return t;
				}
			}), x = new o.WebGLRenderer({
				canvas: l,
				antialias: !0,
				alpha: !0,
				preserveDrawingBuffer: !0
			}), x.outputColorSpace = o.SRGBColorSpace, x.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)), S = new o.Scene(), S.background = new o.Color(ge), w = new o.PerspectiveCamera(ve, 16 / 9, .01, 1e4), T = new o.OrthographicCamera(-1, 1, 1, -1, -1e4, 1e4), C = w, E = new t.OrbitControls(C, l), E.enableDamping = !0, E.dampingFactor = .08, E.rotateSpeed = .82, E.zoomSpeed = 1, E.panSpeed = .9, E.screenSpacePanning = !0, E.mouseButtons = we(null, o.MOUSE), de = Ze(), Oe = new o.AmbientLight(16777215, K.ambient * Ae), S.add(Oe);
			let u = new o.DirectionalLight(16777215, K.main * Ae);
			u.position.set(0, 10, 10);
			let d = new o.DirectionalLight(16777215, K.back * Ae);
			d.position.set(-10, 0, -10);
			let ee = new o.DirectionalLight(15266047, K.fill * Ae);
			ee.position.set(10, 5, -5);
			let te = new o.DirectionalLight(16773352, K.fill * Ae);
			te.position.set(-10, 5, 5);
			let v = new o.DirectionalLight(16777215, K.bottom * Ae);
			v.position.set(0, -10, 0), ke = [
				u,
				d,
				ee,
				te,
				v
			], ke.forEach((e) => S.add(e)), P = new o.GridHelper(20, 20, 5068128, 3094338), S.add(P);
			let O = () => {
				if (y || !x || !C) return;
				let e = c.getBoundingClientRect(), t = Math.max(1, Math.round(e.width || l.clientWidth || 1)), n = Math.max(1, Math.round(e.height || l.clientHeight || 1));
				x.setSize(t, n, !1), w && (w.aspect = t / n, w.updateProjectionMatrix()), ze(t, n), Re(), Ie();
			};
			typeof ResizeObserver < "u" && (ne = new ResizeObserver(() => O()), ne.observe(c));
			let se = fe(t, n, s);
			if (!se) {
				$("3D loader unavailable", `${n.toUpperCase()} loader could not be created.`), g.style.display = "none";
				return;
			}
			if (n === "obj" && t.MTLLoader) try {
				let e = i.replace(/\.obj(\?.*)?$/i, (e, t) => `.mtl${t || ""}`), n = new t.MTLLoader(s), r = await new Promise((t) => {
					n.load(e, t, void 0, () => t(null));
				});
				r && !y && (r.preload(), se.setMaterials(r));
			} catch (e) {
				console.debug?.("[MJR 3D] MTL load skipped:", e?.message);
			}
			let ue = await M(se, n, i);
			if (y) return;
			let k = A(o, n, ue);
			if (!k) {
				$("Empty 3D scene", "The loader returned no renderable object."), g.style.display = "none";
				return;
			}
			try {
				let e = new o.Box3().setFromObject(k);
				if (!e.isEmpty()) {
					let t = e.getSize(new o.Vector3()), n = e.getCenter(new o.Vector3()), r = 5 / Math.max(t.x, t.y, t.z, .001);
					k.scale.multiplyScalar(r), e.setFromObject(k), e.getCenter(n), k.position.set(-n.x, -e.min.y, -n.z);
				}
			} catch (e) {
				console.debug?.("[MJR 3D] normalize skipped:", e);
			}
			if (I = k, F = new o.Group(), F.add(k), S.add(F), Ce = oe(k), De = ae(k), De) {
				Ee = new o.SkeletonHelper(k), Ee.visible = !1, S.add(Ee);
				let e = pe({
					defaultBgColor: ge,
					defaultFov: ve,
					defaultLightIntensity: ye,
					hasSkeleton: !0
				});
				c.replaceChild(e.panel, _.panel), Object.assign(_, e), _.bgInput.addEventListener("input", () => {
					try {
						S && (S.background = new o.Color(_.bgInput.value));
					} catch (e) {
						console.debug?.(e);
					}
				}), _.materialSel.addEventListener("change", () => {
					Ue(_.materialSel.value);
				}), _.upSel.addEventListener("change", () => {
					We(_.upSel.value);
				}), _.skeletonToggle && _.skeletonToggle.addEventListener("change", () => {
					Ge(_.skeletonToggle.checked);
				}), _.fovSlider.addEventListener("input", () => {
					let e = Math.max(1, Math.min(179, Number(_.fovSlider.value) || ve));
					try {
						w && (w.fov = e, w.updateProjectionMatrix());
					} catch (e) {
						console.debug?.(e);
					}
				}), _.lightSlider.addEventListener("input", () => {
					He(Number(_.lightSlider.value));
				});
			}
			H = le(o, F), H && (P.position.y = H.box.min.y), q = G.PERSPECTIVE, Be(), O(), Le(), Xe();
			let j = ce(ue, n);
			j.length > 0 && Ye(j, k);
			let R = new o.Scene();
			c._mjrAxisScene = R;
			let z = new o.PerspectiveCamera(50, 1, .1, 100);
			z.position.set(0, 0, 3.2), z.lookAt(0, 0, 0);
			let B = [
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
			], V = new o.SphereGeometry(.1, 12, 8), me = new o.SphereGeometry(.08, 10, 6), U = new o.MeshBasicMaterial({ color: 13421772 });
			R.add(new o.Mesh(me, U));
			for (let { dir: e, color: t } of B) {
				let n = new o.LineBasicMaterial({ color: t }), r = [new o.Vector3(0, 0, 0), new o.Vector3(e[0], e[1], e[2])], i = new o.BufferGeometry().setFromPoints(r);
				R.add(new o.Line(i, n));
				let a = new o.MeshBasicMaterial({ color: t }), s = new o.Mesh(V, a);
				s.position.set(e[0], e[1], e[2]), R.add(s);
			}
			c._mjr3D = {
				controls: E,
				get camera() {
					return C;
				}
			};
			try {
				a.onReady?.({
					canvas: l,
					host: c,
					object: F,
					renderer: x,
					camera: C,
					controls: E
				});
			} catch (e) {
				console.debug?.(e);
			}
			Ie();
			let he = () => {
				if (!y && !ie && x && S && C) {
					try {
						if (E?.update?.(), J && je) {
							let e = je.getDelta();
							Q && J.update(e), Ke();
						}
						x.setScissorTest(!1), x.setViewport(0, 0, l.width, l.height), x.render(S, C);
						let e = Math.min(2, window.devicePixelRatio || 1), t = Math.round(96 * e);
						x.setScissorTest(!0), x.setScissor(0, 0, t, t), x.setViewport(0, 0, t, t), x.setClearColor(0, 0), x.clear(!0, !0, !1);
						let n = C.quaternion;
						z.position.set(0, 0, 3.2).applyQuaternion(n), z.quaternion.copy(n), x.render(R, z), x.setScissorTest(!1);
						try {
							x.setClearColor(S.background || 0, 1);
						} catch {}
						Re();
					} catch (e) {
						console.debug?.(e);
					}
					ie || (re = requestAnimationFrame(he));
				}
			};
			D = he;
			let W = (e) => L(e, { preventDefault: !0 });
			f.addEventListener("click", (e) => {
				W(e), Be(), Xe();
			}), p.addEventListener("click", (e) => {
				W(e), P && (P.visible = !P.visible), Xe(), Ie();
			}), m.addEventListener("click", (e) => {
				W(e), Ve(q === G.PERSPECTIVE ? G.ORTHOGRAPHIC : G.PERSPECTIVE);
			}), h.addEventListener("click", (e) => {
				W(e), Pe = !Pe, _.panel.style.display = Pe ? "block" : "none", Xe();
			}), ie || he();
		} catch (e) {
			console.warn("[MJR 3D] preview init failed", e), $("Failed to load 3D preview", String(e?.message || "Three.js initialization failed.")), g.style.display = "none";
		}
		else if ($("3D preview unavailable", `${n.toUpperCase()} is not supported in the embedded viewer.`), g.style.display = "none", i) try {
			let e = document.createElement("a");
			e.href = i, e.download = String(r?.filename || "model"), e.textContent = t("model3d.downloadFile", "Download {file}", { file: String(r?.filename || "file") }), e.style.cssText = "position:absolute;bottom:18px;left:50%;transform:translateX(-50%);padding:7px 16px;border-radius:8px;font:600 12px system-ui,sans-serif;color:#fff;background:rgba(76,175,80,0.85);text-decoration:none;pointer-events:auto;z-index:3", c.appendChild(e);
		} catch {}
	}).catch((e) => {
		if (!y) {
			console.warn("[MJR 3D] preview init unhandled error", e);
			try {
				$("Failed to load 3D preview", String(e?.message || "Initialization failed."));
			} catch {}
			try {
				g.style.display = "none";
			} catch {}
		}
	}), c;
}
// ui/features/viewer/studio/studioFx.ts
function Ee() {
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
function Ae(e) {
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
function J(e) {
	return 2 ** (Number.isFinite(e) ? Math.max(-10, Math.min(10, e)) : 0);
}
function je(e) {
	return 1 / (Number.isFinite(e) && e > 0 ? e : 1);
}
function Y(e) {
	return e.channel !== "rgb" || Math.abs(e.exposure) > .001 || Math.abs(e.gamma - 1) > .001;
}
function X(e) {
	switch (e) {
		case "16:9": return 16 / 9;
		case "1:1": return 1;
		case "4:3": return 4 / 3;
		case "2.39": return 2.39;
		case "9:16": return 9 / 16;
		default: return null;
	}
}
function Z(e, t, n) {
	let r = X(n);
	if (!r || e <= 0 || t <= 0) return null;
	let i = e, a = e / r;
	return a > t && (a = t, i = t * r), {
		x: (e - i) / 2,
		y: (t - a) / 2,
		w: i,
		h: a
	};
}
function Me(e, t, n) {
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
function Q(e, t, n) {
	return De * e + Oe * t + ke * n;
}
function Ne(e) {
	let t = /* @__PURE__ */ new Uint32Array(256), n = /* @__PURE__ */ new Uint32Array(256), r = /* @__PURE__ */ new Uint32Array(256), i = /* @__PURE__ */ new Uint32Array(256);
	for (let a = 0; a + 3 < e.length; a += 4) e[a + 3] !== 0 && (t[e[a]] += 1, n[e[a + 1]] += 1, r[e[a + 2]] += 1, i[Math.round(Q(e[a], e[a + 1], e[a + 2]))] += 1);
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
function Pe(e, t, n, r = 256) {
	let i = Math.max(1, Math.min(r, t)), a = new Uint32Array(i * 256), o = 1;
	for (let r = 0; r < n; r++) for (let n = 0; n < t; n++) {
		let s = (r * t + n) * 4;
		if (e[s + 3] === 0) continue;
		let c = Math.min(i - 1, Math.floor(n * i / t)), l = Math.round(Q(e[s], e[s + 1], e[s + 2])), u = c * 256 + l;
		a[u] += 1, a[u] > o && (o = a[u]);
	}
	return {
		columns: i,
		bins: a,
		max: o
	};
}
function Fe(e, t, n, r, i = 0) {
	let a = new Uint8ClampedArray(/* @__PURE__ */ new ArrayBuffer(t * n * 4)), o = Math.max(0, Math.min(1, r)) * 255;
	for (let r = 0; r < n; r++) for (let n = 0; n < t; n++) {
		let s = (r * t + n) * 4;
		if (Q(e[s], e[s + 1], e[s + 2]) < o) continue;
		let c = Math.floor((n + r + i) / 4) % 2 == 0;
		a[s] = c ? 255 : 20, a[s + 1] = c ? 40 : 20, a[s + 2] = c ? 40 : 20, a[s + 3] = 200;
	}
	return a;
}
function Ie(e, t, n = 256) {
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
function $(e, t, n, r) {
	return {
		hex: `#${[
			e,
			t,
			n
		].map((e) => Math.round(e).toString(16).padStart(2, "0")).join("")}`.toUpperCase(),
		rgb: `${e}, ${t}, ${n}${r < 255 ? ` · α ${r}` : ""}`,
		luma: `${Math.round(Q(e, t, n) / 255 * 100)}%`
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
	return a(e) ?? i(t?.fps_raw ?? t?.fps ?? t?.frame_rate) ?? i(e?.fps);
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
], ft = { class: "mjr-studio-player__row" }, pt = { class: "mjr-studio-player__time" }, mt = { class: "is-dim" }, ht = ["title"], gt = ["title"], _t = { class: "mjr-studio-player__group" }, vt = ["aria-label", "aria-valuenow"], yt = /* @__PURE__ */ m({
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
		wipe: {},
		lightDismiss: { type: Boolean },
		mediaClass: {}
	},
	emits: [
		"ended",
		"update:wipe",
		"dismiss"
	],
	setup(e, { expose: n, emit: r }) {
		let i = e, a = r, o = D(null), m = D(null), ie = D(null), ae = D(null), oe = D(null), O = D({
			x: 0,
			y: 0,
			w: 0,
			h: 0
		}), se = D(!1), ce = null, le = D(null), ue = D(!1), k = null, A = null, j = 0;
		async function de() {
			if (i.kind !== "audio" || A || k) return;
			let e = q(), t = window.AudioContext || window.webkitAudioContext;
			if (e && t) try {
				if (k = new t(), await k.resume?.(), k.state !== "running") {
					k.close?.(), k = null;
					return;
				}
				let n = k.createMediaElementSource(e);
				A = k.createAnalyser(), A.fftSize = 256, A.smoothingTimeConstant = .78, n.connect(A), A.connect(k.destination), ue.value = !0, fe();
			} catch (e) {
				console.debug?.(e);
			}
		}
		function fe() {
			cancelAnimationFrame(j);
			let e = le.value, t = e?.getContext("2d");
			if (!e || !t || !A) return;
			let n = e.width = e.clientWidth || 480, r = e.height = e.clientHeight || 160, i = new Uint8Array(A.frequencyBinCount);
			A.getByteFrequencyData(i), t.clearRect(0, 0, n, r);
			let a = Math.min(64, i.length), o = Math.max(2, (n - 3 * (a - 1)) / a);
			t.fillStyle = getComputedStyle(e).getPropertyValue("--mjr-accent").trim() || "#4fa3ff";
			for (let e = 0; e < a; e++) {
				let n = i[Math.min(i.length - 1, Math.floor((e / a) ** 1.6 * i.length))] / 255, s = Math.max(2, n * r);
				t.globalAlpha = .35 + n * .65, t.fillRect(e * (o + 3), r - s, o, s);
			}
			t.globalAlpha = 1, M.value && (j = requestAnimationFrame(fe));
		}
		let M = D(!1), N = D(0), P = D(0), F = D(0), I = D(1), L = D(!!i.initialMuted), R = D(Number(i.initialRate) > 0 ? Number(i.initialRate) : 1), z = D(!0), B = D(null), V = D(null), pe = D(null), me = D(!1), H = D(!0), U = D(""), he = null, ge = 0, W = _(() => i.fps && i.fps > 0 ? i.fps : null), G = _(() => qe(N.value, W.value)), _e = _(() => Xe(P.value, W.value, i.frameCount)), ve = _(() => P.value > 0 ? N.value / P.value * 100 : 0), ye = _(() => P.value > 0 ? F.value / P.value * 100 : 0), K = _(() => Ze({
			a: B.value,
			b: V.value
		}, P.value)), be = _(() => {
			if (!K.value || P.value <= 0) return null;
			let e = K.value.a / P.value * 100, t = (K.value.b - K.value.a) / P.value * 100;
			return {
				left: `${e}%`,
				width: `${t}%`
			};
		}), xe = _(() => pe.value == null || P.value <= 0 ? null : pe.value / 100 * P.value);
		function q() {
			return o.value;
		}
		let Se = _(() => i.kind === "video" && !!i.compareSrc && !!i.compare && i.compare !== "off"), Ce = _(() => Se.value && i.compare === "side"), we = _(() => Se.value && (i.compare === "wipe" || i.compare === "wipeV")), Te = _(() => Math.max(0, Math.min(100, Number(i.wipe ?? 50)))), Ee = _(() => {
			let e = Se.value ? Le(i.compare || "off") : null;
			if (e) return { mixBlendMode: e };
			if (we.value) {
				let e = O.value;
				return i.compare === "wipeV" ? { clipPath: `inset(${e.y + e.h * Te.value / 100}px 0 0 0)` } : { clipPath: `inset(0 0 0 ${e.x + e.w * Te.value / 100}px)` };
			}
			return {};
		}), De = _(() => ({
			left: `${O.value.x}px`,
			top: `${O.value.y}px`,
			width: `${O.value.w}px`,
			height: `${O.value.h}px`
		}));
		function Oe() {
			let e = o.value;
			if (!(e instanceof HTMLVideoElement) || !ae.value) return;
			let t = e.clientWidth, n = e.clientHeight, r = e.videoWidth, i = e.videoHeight;
			if (!t || !n || !r || !i) {
				O.value = {
					x: e.offsetLeft,
					y: e.offsetTop,
					w: t,
					h: n
				};
				return;
			}
			let a = Math.min(t / r, n / i), s = r * a, c = i * a;
			O.value = {
				x: e.offsetLeft + (t - s) / 2,
				y: e.offsetTop + (n - c) / 2,
				w: s,
				h: c
			};
		}
		function ke(e = !1) {
			let t = q(), n = oe.value;
			if (!t || !n || !Se.value) return;
			n.muted = !0, n.playbackRate !== t.playbackRate && (n.playbackRate = t.playbackRate);
			let r = Math.min(t.currentTime || 0, Number.isFinite(n.duration) ? n.duration : Infinity);
			if (e || Math.abs((n.currentTime || 0) - r) > .08) try {
				n.currentTime = r;
			} catch (e) {
				console.debug?.(e);
			}
			t.paused && !n.paused ? n.pause() : !t.paused && n.paused && n.play()?.catch?.(() => {});
		}
		function Ae(e) {
			let t = ae.value?.getBoundingClientRect(), n = O.value, r = e.target?.tagName === "VIDEO" && (Ce.value || !t || e.clientX >= t.left + n.x && e.clientX <= t.left + n.x + n.w && e.clientY >= t.top + n.y && e.clientY <= t.top + n.y + n.h);
			i.lightDismiss && !r ? a("dismiss") : $();
		}
		function J(e) {
			i.lightDismiss && e.target === m.value && a("dismiss");
		}
		function je(e) {
			let t = ae.value?.getBoundingClientRect(), n = O.value;
			if (!t || n.w <= 0 || n.h <= 0) return;
			let r = i.compare === "wipeV" ? (e.clientY - t.top - n.y) / n.h : (e.clientX - t.left - n.x) / n.w;
			a("update:wipe", Math.round(Math.max(0, Math.min(1, r)) * 1e3) / 10);
		}
		function Y(e) {
			se.value = !0, e.currentTarget?.setPointerCapture?.(e.pointerId), je(e);
		}
		function X(e) {
			se.value && je(e);
		}
		function Z() {
			let e = q();
			if (e) {
				N.value = e.currentTime || 0;
				let t = Qe(N.value, {
					a: B.value,
					b: V.value
				}, P.value);
				t != null && M.value && (e.currentTime = t, N.value = t), ke(t != null);
			}
			M.value && (ge = requestAnimationFrame(Z));
		}
		function Me() {
			M.value = !0, cancelAnimationFrame(ge), ge = requestAnimationFrame(Z), ke(!0), i.kind === "audio" && (A ? fe() : de()), Tt();
		}
		function Q() {
			M.value = !1, cancelAnimationFrame(ge), ke(!0), wt();
		}
		function Ne() {
			let e = q();
			P.value = Number.isFinite(e?.duration) ? Number(e?.duration) : 0, U.value = "", e && (e.volume = I.value, e.muted = L.value, e.playbackRate = R.value), c(Oe);
		}
		function Pe() {
			let e = q();
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
		function Fe() {
			if (z.value && !K.value) {
				let e = q();
				e && (e.currentTime = 0, e.play()?.catch?.(() => {}));
			} else a("ended");
		}
		function Ie() {
			U.value = t("viewer.studio.mediaError", "This file cannot be played by the browser.");
		}
		function $() {
			let e = q();
			e && (e.paused ? e.play()?.catch?.(() => {}) : e.pause());
		}
		function Re(e) {
			let t = q();
			if (!t || !Number.isFinite(e)) return;
			let n = P.value > 0 ? P.value : e;
			t.currentTime = Math.max(0, Math.min(e, n)), N.value = t.currentTime, ke(!0);
		}
		function ze(e) {
			let t = q();
			t && (t.paused || t.pause(), Re(Ye(t.currentTime || 0, W.value, e, P.value)));
		}
		function Be(e) {
			Re((q()?.currentTime || 0) + e);
		}
		function Ve(e) {
			let t = ie.value?.getBoundingClientRect();
			return !t || t.width <= 0 ? 0 : Math.max(0, Math.min(100, (e.clientX - t.left) / t.width * 100));
		}
		function He(e) {
			P.value <= 0 || (me.value = !0, e.currentTarget?.setPointerCapture?.(e.pointerId), Re(Ve(e) / 100 * P.value));
		}
		function Ue(e) {
			pe.value = Ve(e), me.value && Re(pe.value / 100 * P.value);
		}
		function We(e) {
			me.value = !1, e.currentTarget?.releasePointerCapture?.(e.pointerId);
		}
		function Ge(e) {
			R.value = e;
			let t = q();
			t && (t.playbackRate = e);
		}
		function Je(e = 1, t = !1) {
			let n = $e, r = n.indexOf(R.value), i = (r < 0 ? n.indexOf(1) : r) + e;
			t && (i = (i + n.length) % n.length), Ge(n[Math.max(0, Math.min(n.length - 1, i))]);
		}
		function et() {
			L.value = !L.value;
			let e = q();
			e && (e.muted = L.value);
		}
		let tt = D(!1);
		function nt(e) {
			if (e.type === "pointerdown") tt.value = !0, e.currentTarget?.setPointerCapture?.(e.pointerId);
			else if (!tt.value) return;
			let t = e.currentTarget.getBoundingClientRect(), n = t.width > 0 ? (e.clientX - t.left) / t.width : 1;
			rt(Math.round(Math.max(0, Math.min(1, n)) * 20) / 20);
		}
		function rt(e) {
			I.value = e;
			let t = q();
			t && (t.volume = I.value, I.value > 0 && L.value && (L.value = !1, t.muted = !1));
		}
		function yt() {
			B.value = N.value, V.value != null && V.value <= B.value && (V.value = null);
		}
		function bt() {
			V.value = N.value, B.value ??= 0;
		}
		function xt() {
			B.value = null, V.value = null;
		}
		function St() {
			let e = m.value;
			e && (document.fullscreenElement ? document.exitFullscreen?.() : e.requestFullscreen?.());
		}
		async function Ct() {
			let e = q();
			if (i.kind !== "video" || !(e instanceof HTMLVideoElement) || !e.videoWidth) return;
			let t = document.createElement("canvas");
			t.width = e.videoWidth, t.height = e.videoHeight, t.getContext("2d")?.drawImage(e, 0, 0);
			let n = await new Promise((e) => t.toBlob(e, "image/png"));
			if (!n) return;
			let r = URL.createObjectURL(n), a = String(i.filename || "frame").replace(/\.[^.]+$/, ""), o = document.createElement("a");
			o.href = r, o.download = `${a}_f${String(G.value).padStart(5, "0")}.png`, o.click(), setTimeout(() => URL.revokeObjectURL(r), 1e3);
		}
		function wt() {
			H.value = !0, Tt();
		}
		function Tt() {
			he && clearTimeout(he), he = setTimeout(() => {
				M.value && !me.value && i.kind === "video" && (H.value = !1);
			}, 2200);
		}
		function Et(e) {
			if (e) try {
				e.pause(), e.removeAttribute("src"), e.load();
			} catch (e) {
				console.debug?.(e);
			}
		}
		function Dt() {
			Et(oe.value), Et(q());
		}
		ne(() => i.src, () => {
			xt(), N.value = 0, P.value = 0, F.value = 0, U.value = "";
		});
		function Ot() {
			let e = q();
			if (!e) return;
			e.muted = L.value, e.playbackRate = R.value;
			let t = e.play?.();
			t && typeof t.catch == "function" && t.catch(() => {
				e.muted || (L.value = !0, e.muted = !0, e.play?.()?.catch?.(() => {}));
			});
		}
		return ne([
			Se,
			() => i.compareSrc,
			() => i.compare
		], () => void c(() => {
			Oe(), ke(!0);
		})), ee(() => {
			Ot();
			try {
				ce = new ResizeObserver(() => Oe()), ae.value && ce.observe(ae.value);
			} catch (e) {
				console.debug?.(e);
			}
		}), v(() => {
			ce?.disconnect(), cancelAnimationFrame(j);
			try {
				k?.close?.();
			} catch (e) {
				console.debug?.(e);
			}
			k = null, A = null, cancelAnimationFrame(ge), he && clearTimeout(he), Dt();
		}), n({
			togglePlay: $,
			play: Ot,
			stepFrame: ze,
			seekBy: Be,
			cycleRate: Je,
			toggleMute: et,
			setLoopA: yt,
			setLoopB: bt,
			clearLoop: xt,
			toggleFullscreen: St,
			exportFrame: Ct,
			release: Dt,
			getSource: () => o.value instanceof HTMLVideoElement ? o.value : null,
			getBox: () => i.kind === "video" ? ae.value?.querySelector(".mjr-studio-player__box") : null,
			isPlaying: () => M.value
		}), (n, r) => {
			let i = te("MButton");
			return y(), w("div", {
				ref_key: "root",
				ref: m,
				class: T(["mjr-studio-player", {
					"is-audio": e.kind === "audio",
					"is-compact": e.compact,
					"controls-hidden": !H.value
				}]),
				onPointermove: wt,
				onClick: J
			}, [
				e.kind === "video" ? (y(), w("div", {
					key: 0,
					ref_key: "screen",
					ref: ae,
					class: T(["mjr-studio-player__screen", { "is-side": Ce.value }]),
					onClick: Ae,
					onDblclick: St
				}, [
					d("div", {
						class: "mjr-studio-player__layers",
						style: S(e.mediaFilter ? { filter: e.mediaFilter } : void 0)
					}, [d("video", {
						ref_key: "media",
						ref: o,
						class: T(["mjr-studio-player__media", e.mediaClass]),
						src: e.src,
						playsinline: "",
						preload: "auto",
						onPlay: Me,
						onPause: Q,
						onLoadedmetadata: Ne,
						onTimeupdate: Pe,
						onProgress: Pe,
						onEnded: Fe,
						onError: Ie
					}, null, 42, it), Se.value ? (y(), w("video", {
						ref_key: "mediaB",
						ref: oe,
						key: `b:${e.compareSrc}`,
						class: "mjr-studio-player__media is-b",
						src: e.compareSrc || "",
						playsinline: "",
						muted: "",
						preload: "auto",
						style: S(Ee.value),
						onLoadedmetadata: r[0] ||= (e) => ke(!0)
					}, null, 44, at)) : p("", !0)], 4),
					d("div", {
						class: "mjr-studio-player__box",
						style: S(De.value)
					}, [re(n.$slots, "overlay", {
						width: O.value.w,
						height: O.value.h
					}), we.value ? (y(), w("div", {
						key: 0,
						class: T(["mjr-studio-stage__divider", {
							"is-vertical": e.compare === "wipeV",
							"is-active": se.value
						}]),
						style: S(e.compare === "wipeV" ? { top: `${Te.value}%` } : { left: `${Te.value}%` }),
						onClick: r[1] ||= g(() => {}, ["stop"]),
						onDblclick: r[2] ||= g((e) => a("update:wipe", 50), ["stop"]),
						onPointerdown: g(Y, ["stop"]),
						onPointermove: X,
						onPointerup: r[3] ||= (e) => se.value = !1,
						onPointercancel: r[4] ||= (e) => se.value = !1
					}, [...r[12] ||= [d("span", { class: "mjr-studio-stage__divider-grip" }, null, -1)]], 38)) : p("", !0)], 4),
					Se.value ? (y(), w("div", ot, [
						r[13] ||= d("span", null, "A", -1),
						d("span", st, x(e.compare === "wipeV" ? "/" : "|"), 1),
						r[14] ||= d("span", null, "B", -1)
					])) : p("", !0)
				], 34)) : (y(), w("div", {
					key: 1,
					class: T(["mjr-studio-player__audio-art", { "has-spectrum": ue.value }]),
					onClick: $
				}, [
					s(d("canvas", {
						ref_key: "spectrum",
						ref: le,
						class: "mjr-studio-player__spectrum",
						"aria-hidden": "true"
					}, null, 512), [[b, ue.value]]),
					s(d("i", ct, null, 512), [[b, !ue.value]]),
					d("span", null, x(e.filename), 1),
					d("audio", {
						ref_key: "media",
						ref: o,
						src: e.src,
						preload: "auto",
						onPlay: Me,
						onPause: Q,
						onLoadedmetadata: Ne,
						onTimeupdate: Pe,
						onProgress: Pe,
						onEnded: Fe,
						onError: Ie
					}, null, 40, lt)
				], 2)),
				!M.value && !U.value ? (y(), u(i, {
					key: 2,
					type: "button",
					class: "mjr-studio-player__big-play",
					"aria-label": E(t)("viewer.studio.play", "Play"),
					onClick: $
				}, {
					default: h(() => [...r[15] ||= [d("i", {
						class: "pi pi-play",
						"aria-hidden": "true"
					}, null, -1)]]),
					_: 1
				}, 8, ["aria-label"])) : p("", !0),
				U.value ? (y(), w("div", ut, x(U.value), 1)) : p("", !0),
				d("div", {
					class: "mjr-studio-player__controls",
					onPointerdown: r[11] ||= g(() => {}, ["stop"])
				}, [d("div", {
					ref_key: "track",
					ref: ie,
					class: "mjr-studio-player__track",
					role: "slider",
					"aria-label": E(t)("viewer.studio.seek", "Seek"),
					"aria-valuemin": 0,
					"aria-valuemax": P.value,
					"aria-valuenow": N.value,
					onPointerdown: He,
					onPointermove: Ue,
					onPointerup: We,
					onPointerleave: r[5] ||= (e) => pe.value = null
				}, [
					d("div", {
						class: "mjr-studio-player__buffered",
						style: S({ width: `${ye.value}%` })
					}, null, 4),
					be.value ? (y(), w("div", {
						key: 0,
						class: "mjr-studio-player__loop",
						style: S(be.value)
					}, null, 4)) : p("", !0),
					d("div", {
						class: "mjr-studio-player__progress",
						style: S({ width: `${ve.value}%` })
					}, null, 4),
					d("div", {
						class: "mjr-studio-player__thumb",
						style: S({ left: `${ve.value}%` })
					}, null, 4),
					xe.value == null ? p("", !0) : (y(), w("div", {
						key: 1,
						class: "mjr-studio-player__hover",
						style: S({ left: `${pe.value}%` })
					}, [C(x(E(Ke)(xe.value)), 1), W.value ? (y(), w(l, { key: 0 }, [C(" · f" + x(E(qe)(xe.value, W.value)), 1)], 64)) : p("", !0)], 4))
				], 40, dt), d("div", ft, [
					f(i, {
						type: "button",
						class: "mjr-studio-btn",
						title: E(t)("viewer.studio.playPause", "Play / pause (Space)"),
						onClick: $
					}, {
						default: h(() => [d("i", {
							class: T(M.value ? "pi pi-pause" : "pi pi-play"),
							"aria-hidden": "true"
						}, null, 2)]),
						_: 1
					}, 8, ["title"]),
					e.kind === "video" ? (y(), w(l, { key: 0 }, [f(i, {
						type: "button",
						class: "mjr-studio-btn",
						title: E(t)("viewer.studio.prevFrame", "Previous frame (,)"),
						onClick: r[6] ||= (e) => ze(-1)
					}, {
						default: h(() => [...r[16] ||= [d("i", {
							class: "pi pi-step-backward",
							"aria-hidden": "true"
						}, null, -1)]]),
						_: 1
					}, 8, ["title"]), f(i, {
						type: "button",
						class: "mjr-studio-btn",
						title: E(t)("viewer.studio.nextFrame", "Next frame (.)"),
						onClick: r[7] ||= (e) => ze(1)
					}, {
						default: h(() => [...r[17] ||= [d("i", {
							class: "pi pi-step-forward",
							"aria-hidden": "true"
						}, null, -1)]]),
						_: 1
					}, 8, ["title"])], 64)) : p("", !0),
					d("span", pt, [C(x(E(Ke)(N.value)) + " ", 1), d("span", mt, "/ " + x(E(Ke)(P.value)), 1)]),
					e.kind === "video" && W.value ? (y(), w("span", {
						key: 1,
						class: "mjr-studio-chip",
						title: E(t)("viewer.studio.frame", "Frame")
					}, [
						C(" f " + x(G.value), 1),
						_e.value ? (y(), w(l, { key: 0 }, [C(" / " + x(_e.value - 1), 1)], 64)) : p("", !0),
						C(" · " + x(Math.round(W.value * 100) / 100) + " fps ", 1)
					], 8, ht)) : p("", !0),
					r[24] ||= d("span", { class: "mjr-studio-player__spacer" }, null, -1),
					d("div", {
						class: "mjr-studio-player__group",
						title: E(t)("viewer.studio.abLoop", "A-B loop (I / O, U to clear)")
					}, [
						f(i, {
							type: "button",
							class: T(["mjr-studio-btn is-text", { "is-on": B.value != null }]),
							onClick: yt
						}, {
							default: h(() => [...r[18] ||= [C("A", -1)]]),
							_: 1
						}, 8, ["class"]),
						f(i, {
							type: "button",
							class: T(["mjr-studio-btn is-text", { "is-on": V.value != null }]),
							onClick: bt
						}, {
							default: h(() => [...r[19] ||= [C("B", -1)]]),
							_: 1
						}, 8, ["class"]),
						B.value != null || V.value != null ? (y(), u(i, {
							key: 0,
							type: "button",
							class: "mjr-studio-btn",
							title: E(t)("viewer.studio.clearLoop", "Clear A-B loop"),
							onClick: xt
						}, {
							default: h(() => [...r[20] ||= [d("i", {
								class: "pi pi-times",
								"aria-hidden": "true"
							}, null, -1)]]),
							_: 1
						}, 8, ["title"])) : p("", !0)
					], 8, gt),
					f(i, {
						type: "button",
						class: T(["mjr-studio-btn", { "is-on": z.value }]),
						title: E(t)("viewer.studio.loop", "Loop"),
						onClick: r[8] ||= (e) => z.value = !z.value
					}, {
						default: h(() => [...r[21] ||= [d("i", {
							class: "pi pi-replay",
							"aria-hidden": "true"
						}, null, -1)]]),
						_: 1
					}, 8, ["class", "title"]),
					f(i, {
						type: "button",
						class: T(["mjr-studio-btn is-text", { "is-on": R.value !== 1 }]),
						title: E(t)("viewer.studio.speed", "Speed ([ / ])"),
						onClick: r[9] ||= (e) => Je(1, !0)
					}, {
						default: h(() => [C(x(R.value) + "×", 1)]),
						_: 1
					}, 8, ["class", "title"]),
					d("div", _t, [f(i, {
						type: "button",
						class: "mjr-studio-btn",
						title: E(t)("viewer.studio.mute", "Mute (M)"),
						onClick: et
					}, {
						default: h(() => [d("i", {
							class: T(L.value || I.value === 0 ? "pi pi-volume-off" : "pi pi-volume-up"),
							"aria-hidden": "true"
						}, null, 2)]),
						_: 1
					}, 8, ["title"]), d("div", {
						class: "mjr-studio-player__volume",
						role: "slider",
						"aria-label": E(t)("viewer.studio.volume", "Volume"),
						"aria-valuemin": 0,
						"aria-valuemax": 1,
						"aria-valuenow": L.value ? 0 : I.value,
						onPointerdown: nt,
						onPointermove: nt,
						onPointerup: r[10] ||= (e) => tt.value = !1
					}, [d("div", {
						class: "mjr-studio-player__volume-fill",
						style: S({ width: `${(L.value ? 0 : I.value) * 100}%` })
					}, null, 4)], 40, vt)]),
					e.kind === "video" ? (y(), u(i, {
						key: 2,
						type: "button",
						class: "mjr-studio-btn",
						title: E(t)("viewer.studio.exportFrame", "Save this frame as PNG"),
						onClick: Ct
					}, {
						default: h(() => [...r[22] ||= [d("i", {
							class: "pi pi-camera",
							"aria-hidden": "true"
						}, null, -1)]]),
						_: 1
					}, 8, ["title"])) : p("", !0),
					e.kind === "video" ? (y(), u(i, {
						key: 3,
						type: "button",
						class: "mjr-studio-btn",
						title: E(t)("viewer.studio.fullscreen", "Fullscreen (F)"),
						onClick: St
					}, {
						default: h(() => [...r[23] ||= [d("i", {
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
	let n = r(e);
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
export { Te as C, U as S, je as _, et as a, ze as b, Z as c, Ne as d, Pe as f, $ as g, J as h, rt as i, Ae as l, Ee as m, yt as n, Ge as o, Fe as p, tt as r, Re as s, Vt as t, Le as u, Me as v, Ce as w, Ie as x, Y as y };
