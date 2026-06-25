import { q as e, r as t } from "./events-N36HM6KP.js";
import { t as n } from "./floatingViewerManager-BSPxKA3H.js";
//#region ui/features/viewer/LiveStreamTracker.ts
var r = !1, i = null, a = null, o = null, s = null, c = null, l = 0, u = 0, d = 400, f = new Set([
	".png",
	".jpg",
	".jpeg",
	".webp",
	".avif",
	".gif",
	".bmp"
]), p = new Set([
	".mp4",
	".webm",
	".mov",
	".avi",
	".mkv",
	".m4v"
]), m = new Set([
	".mp3",
	".wav",
	".flac",
	".ogg",
	".m4a",
	".aac",
	".opus"
]), h = new Set([
	".glb",
	".gltf",
	".obj",
	".fbx",
	".stl",
	".usdz"
]);
function g(e) {
	let t = String(e || "").trim().toLowerCase(), n = t.lastIndexOf(".");
	return n >= 0 ? t.slice(n) : "";
}
function _(e) {
	let t = String(e?.kind || e?.asset_type || e?.media_type || e?.type || "").toLowerCase();
	if (t === "image" || t === "video" || t === "audio" || t === "model3d") return !0;
	let n = g(e?.filename || e?.name || "");
	return f.has(n) || p.has(n) || m.has(n) || h.has(n);
}
function v() {
	return Date.now() - u <= d;
}
async function y(t) {
	let r = ++l;
	try {
		b();
		let i = await e({
			app: t,
			timeoutMs: 8e3
		});
		if (r !== l) return;
		if (!i) {
			console.debug("[Majoor] MFV: ComfyUI API not found - preview streaming disabled");
			return;
		}
		s = i, o = (e) => {
			try {
				let { blob: t, nodeId: r, jobId: i } = e.detail || {};
				if (!t || !(t instanceof Blob) || (u = Date.now(), c && i && i !== c)) return;
				n.feedPreviewBlob(t, { sourceLabel: r ? `Node ${r}` : null });
			} catch (e) {
				console.debug?.("[MFV] b_preview_with_metadata error", e);
			}
		}, i.addEventListener("b_preview_with_metadata", o), a = (e) => {
			try {
				if (v()) return;
				let t = e.detail;
				if (!t || !(t instanceof Blob)) return;
				n.feedPreviewBlob(t);
			} catch (e) {
				console.debug?.("[MFV] preview blob error", e);
			}
		}, i.addEventListener("b_preview", a), console.debug("[Majoor] MFV preview stream hooked to ComfyUI API (b_preview_with_metadata + b_preview fallback)");
	} catch (e) {
		console.debug?.("[Majoor] MFV preview hook failed - preview streaming disabled", e);
	}
}
function b() {
	if (s) {
		if (a) try {
			s.removeEventListener("b_preview", a);
		} catch (e) {
			console.debug?.(e);
		}
		if (o) try {
			s.removeEventListener("b_preview_with_metadata", o);
		} catch (e) {
			console.debug?.(e);
		}
	}
	a = null, o = null, u = 0, s = null;
}
function x(e) {
	c = e || null;
}
function S(e) {
	if (!Array.isArray(e) || !e.length) return null;
	for (let t = e.length - 1; t >= 0; --t) {
		let n = e[t];
		if (_(n)) return n;
	}
	return e[e.length - 1];
}
function C(e) {
	i || (r = !0, i = (e) => {
		try {
			if (!n.getLiveActive()) return;
			let t = S(e.detail?.files);
			if (!t) return;
			n.upsertWithContent(t);
		} catch (e) {
			console.debug?.("[MFV] generation output error", e);
		}
	}, typeof window < "u" && window.addEventListener(t.NEW_GENERATION_OUTPUT, i), y(e), console.debug("[Majoor] LiveStreamTracker initialized"));
}
function w(e) {
	i &&= (typeof window < "u" && window.removeEventListener(t.NEW_GENERATION_OUTPUT, i), null), l += 1, b(), c = null, r = !1, console.debug("[Majoor] LiveStreamTracker torn down");
}
function T() {
	return r;
}
//#endregion
export { C as initLiveStreamTracker, T as isLiveStreamTrackerInitialized, x as setCurrentJobId, w as teardownLiveStreamTracker };
