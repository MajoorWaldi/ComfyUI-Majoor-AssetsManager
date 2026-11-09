import { Hn as e } from "./client-ClvOFaLi.js";
import { t } from "./config-BFDzOF1N.js";
import { t as n } from "./floatingViewerManager-BnuXdkGW.js";
import { r } from "./events-1iwo5blr.js";
// ui/features/viewer/LiveStreamTracker.ts
var i = !1, a = null, o = null, s = null, c = null, l = null, u = null, d = null, f = null, p = 0, m = 0, h = !1, g = 400, _ = "kj_preview_override", v = /* @__PURE__ */ new Set([
	"image/jpeg",
	"image/png",
	"image/webp",
	"video/mp4"
]), y = /* @__PURE__ */ new Set([
	".png",
	".jpg",
	".jpeg",
	".webp",
	".avif",
	".jxl",
	".gif",
	".bmp"
]), b = /* @__PURE__ */ new Set([
	".mp4",
	".webm",
	".mov",
	".avi",
	".mkv",
	".m4v"
]), x = /* @__PURE__ */ new Set([
	".mp3",
	".wav",
	".flac",
	".ogg",
	".m4a",
	".aac",
	".opus"
]), S = /* @__PURE__ */ new Set([
	".glb",
	".gltf",
	".obj",
	".fbx",
	".stl",
	".usdz"
]);
function C(e) {
	let t = String(e || "").trim().toLowerCase(), n = t.lastIndexOf(".");
	return n >= 0 ? t.slice(n) : "";
}
function w(e) {
	let t = String(e?.kind || e?.asset_type || e?.media_type || e?.type || "").toLowerCase();
	if (t === "image" || t === "video" || t === "audio" || t === "model3d") return !0;
	let n = C(e?.filename || e?.name || "");
	return y.has(n) || b.has(n) || x.has(n) || S.has(n);
}
function T() {
	return Date.now() - m <= g;
}
function E(e) {
	let t = String(e || "image/jpeg").trim().toLowerCase();
	return v.has(t) ? t : null;
}
function D(e) {
	let t = E(e?.mime), n = String(e?.image || "").trim();
	if (!t || !n || typeof globalThis.atob != "function") return null;
	try {
		let e = globalThis.atob(n), r = [], i = 32768;
		for (let t = 0; t < e.length; t += i) {
			let n = e.slice(t, t + i), a = new ArrayBuffer(n.length), o = new Uint8Array(a);
			for (let e = 0; e < n.length; e += 1) o[e] = n.charCodeAt(e);
			r.push(a);
		}
		return new Blob(r, { type: t });
	} catch {
		return null;
	}
}
function O(e) {
	let t = String(e?.node_id ?? "").trim(), n = Number(e?.step), r = Number(e?.total), i = Number.isFinite(n) && Number.isFinite(r) && r > 0 ? ` · ${n}/${r}` : "";
	return `KJ Preview Override${t ? ` · Node ${t}` : ""}${i}`;
}
async function k(r) {
	let i = ++p;
	try {
		A();
		let a = await e({
			app: r,
			timeoutMs: 8e3
		});
		if (i !== p) return;
		if (!a) {
			console.debug("[Majoor] MFV: ComfyUI API not found - preview streaming disabled");
			return;
		}
		d = a, l = () => {
			h = !1;
		}, u = () => {
			h = !1;
		}, a.addEventListener("execution_start", l), a.addEventListener("executing", l), a.addEventListener("execution_success", u), a.addEventListener("execution_error", u), a.addEventListener("execution_interrupted", u), c = (e) => {
			try {
				if (t.MFV_KJ_PREVIEW_OVERRIDE_ENABLED === !1) {
					h = !1;
					return;
				}
				if (!n.canAcceptPreviewBlob()) return;
				let r = e?.detail || null, i = D(r);
				if (!i) return;
				h = !0;
				let a = String(r?.node_id ?? "").trim();
				n.feedPreviewBlob(i, {
					source: "kj-preview-override",
					sourceLabel: O(r),
					nodeId: a || null,
					mime: i.type,
					width: Number(r?.w) || void 0,
					height: Number(r?.h) || void 0,
					fps: Number(r?.fps) || void 0,
					step: Number.isFinite(Number(r?.step)) ? Number(r.step) : null,
					total: Number.isFinite(Number(r?.total)) ? Number(r.total) : null
				});
			} catch (e) {
				console.debug?.("[MFV] KJNodes preview override error", e);
			}
		}, a.addEventListener(_, c), s = (e) => {
			try {
				if (h && t.MFV_KJ_PREVIEW_OVERRIDE_ENABLED !== !1 || !n.canAcceptPreviewBlob()) return;
				let { blob: r, nodeId: i, jobId: a } = e.detail || {};
				if (!r || !(r instanceof Blob) || (m = Date.now(), f && a && a !== f)) return;
				n.feedPreviewBlob(r, { sourceLabel: i ? `Node ${i}` : null });
			} catch (e) {
				console.debug?.("[MFV] b_preview_with_metadata error", e);
			}
		}, a.addEventListener("b_preview_with_metadata", s), o = (e) => {
			try {
				if (h && t.MFV_KJ_PREVIEW_OVERRIDE_ENABLED !== !1 || T() || !n.canAcceptPreviewBlob()) return;
				let r = e.detail;
				if (!r || !(r instanceof Blob)) return;
				n.feedPreviewBlob(r);
			} catch (e) {
				console.debug?.("[MFV] preview blob error", e);
			}
		}, a.addEventListener("b_preview", o), console.debug("[Majoor] MFV preview stream hooked to ComfyUI API (KJ Preview Override + binary previews)");
	} catch (e) {
		console.debug?.("[Majoor] MFV preview hook failed - preview streaming disabled", e);
	}
}
function A() {
	if (d) {
		if (c) try {
			d.removeEventListener(_, c);
		} catch (e) {
			console.debug?.(e);
		}
		if (l) for (let e of ["execution_start", "executing"]) try {
			d.removeEventListener(e, l);
		} catch (e) {
			console.debug?.(e);
		}
		if (u) for (let e of [
			"execution_success",
			"execution_error",
			"execution_interrupted"
		]) try {
			d.removeEventListener(e, u);
		} catch (e) {
			console.debug?.(e);
		}
		if (o) try {
			d.removeEventListener("b_preview", o);
		} catch (e) {
			console.debug?.(e);
		}
		if (s) try {
			d.removeEventListener("b_preview_with_metadata", s);
		} catch (e) {
			console.debug?.(e);
		}
	}
	c = null, l = null, u = null, o = null, s = null, m = 0, h = !1, d = null;
}
function j(e) {
	f = e || null;
}
function M(e) {
	if (!Array.isArray(e) || !e.length) return null;
	for (let t = e.length - 1; t >= 0; --t) {
		let n = e[t];
		if (w(n)) return n;
	}
	return e[e.length - 1];
}
function N(e) {
	a || (i = !0, a = (e) => {
		try {
			if (!n.getLiveActive()) return;
			let t = M(e.detail?.files);
			if (!t) return;
			n.upsertWithContent(t);
		} catch (e) {
			console.debug?.("[MFV] generation output error", e);
		}
	}, typeof window < "u" && window.addEventListener(r.NEW_GENERATION_OUTPUT, a), k(e), console.debug("[Majoor] LiveStreamTracker initialized"));
}
function P(e) {
	a &&= (typeof window < "u" && window.removeEventListener(r.NEW_GENERATION_OUTPUT, a), null), p += 1, A(), f = null, i = !1, console.debug("[Majoor] LiveStreamTracker torn down");
}
function F() {
	return i;
}
export { D as decodeKjPreviewPayload, N as initLiveStreamTracker, F as isLiveStreamTrackerInitialized, j as setCurrentJobId, P as teardownLiveStreamTracker };
