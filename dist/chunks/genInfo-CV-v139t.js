import { t as e } from "./rolldown-runtime-Dy4uBu1J.js";
import { m as t, o as n } from "./events-DjjLASfV.js";
import { h as r } from "./Viewer-DDNDTRcP.js";
import { i, n as a, r as o, t as s, u as c } from "./SidebarWorkflowSection-B_P-QZwl.js";
import { D as l, E as u, N as d, O as f, T as p, V as m, dt as h, ft as g, k as _, lt as v } from "./mjr-primevue-C955bvXT.js";
//#region ui/vue/components/viewer/ViewerMetadataBlock.vue?vue&type=script&setup=true&lang.ts
var y = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "10px",
	"margin-bottom": "14px"
} }, b = {
	key: 0,
	style: {
		"font-size": "12px",
		"font-weight": "600",
		"letter-spacing": "0.02em",
		color: "rgba(255,255,255,0.86)"
	}
}, x = {
	key: 1,
	style: {
		padding: "10px 12px",
		"border-radius": "10px",
		border: "1px solid rgba(33,150,243,0.35)",
		background: "rgba(33,150,243,0.08)",
		color: "rgba(255,255,255,0.86)",
		"white-space": "pre-wrap"
	}
}, S = { style: {
	"font-size": "12px",
	"font-weight": "700",
	"margin-bottom": "6px"
} }, C = { style: {
	"font-size": "12px",
	opacity: "0.88"
} }, w = { style: {
	"font-size": "12px",
	"font-weight": "700",
	"margin-bottom": "6px"
} }, T = { style: {
	"font-size": "12px",
	opacity: "0.9"
} }, E = {
	key: 6,
	style: {
		padding: "10px 12px",
		"border-radius": "10px",
		border: "1px solid rgba(255,255,255,0.12)",
		background: "rgba(255,255,255,0.06)",
		color: "rgba(255,255,255,0.72)"
	}
}, D = {
	key: 7,
	style: {
		border: "1px solid rgba(255,255,255,0.10)",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.04)",
		overflow: "hidden"
	}
}, O = { style: {
	cursor: "pointer",
	padding: "10px 12px",
	color: "rgba(255,255,255,0.78)",
	"user-select": "none"
} }, k = { style: {
	margin: "0",
	padding: "10px 12px",
	"max-height": "280px",
	overflow: "auto",
	"font-size": "11px",
	"line-height": "1.35",
	color: "rgba(255,255,255,0.86)"
} }, A = /* @__PURE__ */ d({
	__name: "ViewerMetadataBlock",
	props: {
		title: {},
		asset: {},
		loading: { type: Boolean },
		onRetry: { type: [Function, null] }
	},
	setup(e) {
		let r = e;
		function c(e) {
			try {
				if (!e || typeof e != "object") return null;
				let t = e?.metadata_raw;
				return t && typeof t == "object" && t.geninfo_status && typeof t.geninfo_status == "object" ? t.geninfo_status : e?.geninfo_status && typeof e.geninfo_status == "object" ? e.geninfo_status : null;
			} catch {
				return null;
			}
		}
		function d(e) {
			let t = e?.metadata_raw ?? null;
			if (!t) return null;
			if (typeof t == "object") return t;
			if (typeof t != "string") return null;
			let n = t.trim();
			if (!n) return null;
			try {
				let e = JSON.parse(n);
				return e && typeof e == "object" ? e : null;
			} catch {
				return null;
			}
		}
		function A(e) {
			try {
				let t = Object.entries(e || {});
				if (!t.length) return !1;
				let n = 0;
				for (let [, e] of t.slice(0, 50)) if (!(!e || typeof e != "object") && (e.inputs && typeof e.inputs == "object" && (n += 1), n >= 2)) return !0;
			} catch {
				return !1;
			}
			return !1;
		}
		function j(e) {
			let t = d(e), n = e?.workflow || e?.Workflow || e?.comfy_workflow || t?.workflow || t?.Workflow || t?.comfy_workflow || null;
			if (!n) return null;
			if (typeof n == "object") return n;
			if (typeof n != "string") return null;
			let r = n.trim();
			if (!r) return null;
			try {
				return JSON.parse(r);
			} catch {
				return null;
			}
		}
		function M(e) {
			let t = d(e), n = e?.prompt || e?.Prompt || t?.prompt || t?.Prompt || null;
			if (!n) return null;
			if (typeof n == "object") return A(n) ? n : null;
			if (typeof n != "string") return null;
			let r = n.trim();
			if (!r) return null;
			try {
				let e = JSON.parse(r);
				return A(e) ? e : null;
			} catch {
				return null;
			}
		}
		function N(e) {
			return !!(j(e) || M(e));
		}
		function P(e) {
			let t = e || {}, n = t.generation_time || t.file_creation_time || t.mtime || t.created_at;
			return !!(t.width && t.height || t.duration && t.duration > 0 || n || t.size && t.size > 0 || t.size_bytes && t.size_bytes >= 0 || t.metadata_raw?.raw_ffprobe || t.id != null || t.job_id || t.file_info?.job_id || t.source_node_id || t.file_info?.source_node_id || t.source_node_type || t.file_info?.source_node_type || t.workflow_id || t.file_info?.workflow_id || t.user_metadata?.workflow?.id || t.metadata?.workflow_id);
		}
		function F(e) {
			if (e == null) return "";
			let t = typeof e == "string" ? e : JSON.stringify(e, null, 2);
			return t ? t.length > 4e4 ? `${t.slice(0, 4e4)}\n...(truncated)` : t : "";
		}
		function I() {
			typeof r.onRetry == "function" && r.onRetry();
		}
		let L = p(() => c(r.asset)), R = p(() => o(r.asset)), z = p(() => R.value.kind !== "empty"), B = p(() => P(r.asset)), V = p(() => n.WORKFLOW_MINIMAP_ENABLED !== !1 && N(r.asset)), H = p(() => L.value && typeof L.value == "object" && L.value.kind === "fetch_error"), U = p(() => F(r.asset?.metadata_raw)), W = p(() => !r.loading && !H.value && !B.value && !z.value && !V.value), G = p(() => {
			if (!H.value) return "";
			let e = String(L.value?.message || L.value?.error || "Failed to load generation data."), n = String(L.value?.code || L.value?.stage || "").trim();
			return n ? t("viewer.metadataErrorWithCode", "{message}\n\nCode: {code}\nClick to retry.", {
				message: e,
				code: n
			}) : t("viewer.metadataErrorRetry", "{message}\n\nClick to retry.", { message: e });
		});
		return (e, n) => (m(), _("div", y, [
			r.title ? (m(), _("div", b, g(r.title), 1)) : f("", !0),
			r.loading ? (m(), _("div", x, [u("div", S, g(v(t)("status.loading", "Loading")), 1), u("div", C, g(v(t)("viewer.loadingGenerationData", "Loading generation data...")), 1)])) : f("", !0),
			H.value ? (m(), _("div", {
				key: 2,
				style: h([{
					padding: "10px 12px",
					"border-radius": "10px",
					border: "1px solid rgba(244,67,54,0.35)",
					background: "rgba(244,67,54,0.08)",
					color: "rgba(255,255,255,0.9)",
					"white-space": "pre-wrap"
				}, { cursor: r.onRetry ? "pointer" : "default" }]),
				onClick: I
			}, [u("div", w, g(v(t)("viewer.errorLoadingMetadata", "Error Loading Metadata")), 1), u("div", T, g(G.value), 1)], 4)) : f("", !0),
			B.value ? (m(), l(i, {
				key: 3,
				asset: r.asset
			}, null, 8, ["asset"])) : f("", !0),
			z.value ? (m(), l(a, {
				key: 4,
				asset: r.asset
			}, null, 8, ["asset"])) : f("", !0),
			V.value ? (m(), l(s, {
				key: 5,
				asset: r.asset
			}, null, 8, ["asset"])) : f("", !0),
			W.value ? (m(), _("div", E, g(v(t)("viewer.noGenerationDataFile", "No generation data found for this file.")), 1)) : f("", !0),
			U.value ? (m(), _("details", D, [u("summary", O, g(v(t)("msg.rawMetadata", "Raw metadata")), 1), u("pre", k, g(U.value), 1)])) : f("", !0)
		]));
	}
}), j = /* @__PURE__ */ e({
	buildViewerMetadataBlocks: () => ee,
	ensureViewerMetadataAsset: () => $
}), M = (e, t = null) => {
	let n = r(e);
	return n === void 0 ? t : n;
}, N = n?.VIEWER_GENINFO_TTL_MS ?? 3e4, P = n?.VIEWER_GENINFO_ERROR_TTL_MS ?? 8e3, F = n?.VIEWER_GENINFO_MAX_ENTRIES ?? 300, I = /* @__PURE__ */ new Map(), L = /* @__PURE__ */ new Map(), R = /* @__PURE__ */ new Map(), z = (e, t, n) => {
	try {
		let r = Date.now();
		for (let [n, i] of e.entries()) {
			if (!i) {
				e.delete(n);
				continue;
			}
			r - (i.at || 0) > t && e.delete(n);
		}
		if (e.size <= n) return;
		let i = Array.from(e.entries()).sort((e, t) => (e?.[1]?.at || 0) - (t?.[1]?.at || 0)), a = e.size - n;
		for (let t = 0; t < a; t++) {
			let n = i[t]?.[0];
			n != null && e.delete(n);
		}
	} catch (e) {
		console.debug?.(e);
	}
}, B = (e, t, n) => {
	try {
		let r = e.get(t);
		return r ? Date.now() - (r.at || 0) > n ? (e.delete(t), null) : r.data ?? null : null;
	} catch {
		return null;
	}
}, V = (e, t, n, r, i) => {
	try {
		e.set(t, {
			at: Date.now(),
			data: n
		}), z(e, r, i);
	} catch (e) {
		console.debug?.(e);
	}
}, H = (e) => {
	try {
		let t = e?.id;
		if (t != null) return `id:${t}`;
		let n = J(e);
		if (n) return `fp:${n}`;
		let r = String(e?.filename || e?.name || "").trim(), i = String(e?.subfolder || "").trim(), a = String(e?.source || e?.type || "output").trim().toLowerCase();
		if (r) return `name:${a}:${i}:${r}`;
	} catch (e) {
		console.debug?.(e);
	}
	return null;
}, U = (e) => {
	try {
		if (!e || typeof e != "object") return null;
		let t = e?.metadata_raw;
		return t && typeof t == "object" && t.geninfo_status && typeof t.geninfo_status == "object" ? t.geninfo_status : e?.geninfo_status && typeof e.geninfo_status == "object" ? e.geninfo_status : null;
	} catch {
		return null;
	}
}, W = (e, t) => {
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
}, G = (e) => {
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
}, K = (e) => {
	let t = typeof e == "string" ? e.trim() : "";
	if (!t || t.includes("\n")) return !1;
	if (/^[A-Za-z]:[\\/]/.test(t)) return !0;
	let n = t.replace(/\\/g, "/");
	return /(?:^|\/)[^/\n]+\.(?:png|jpe?g|webp|gif|bmp|tiff?|avif|heic|heif|apng|hdr|svg|mp4|webm|mov|mkv|avi|m4v|mp3|wav|flac|ogg)$/i.test(n);
}, q = (e) => {
	try {
		if (!e || typeof e != "object") return !1;
		if (e.geninfo && typeof e.geninfo == "object" && Object.keys(e.geninfo).length) return !0;
		if (e.metadata_raw && typeof e.metadata_raw == "object") {
			let t = e.metadata_raw;
			if (t.geninfo || t.GenInfo || t.generation || t.parameters || typeof t.prompt == "string" && t.prompt.trim() && !K(t.prompt) || t.prompt && typeof t.prompt == "object") return !0;
			let n = t.raw_ffprobe?.format?.tags || t.ffprobe?.format?.tags || null;
			if (n && typeof n == "object") {
				let e = n.prompt || n["comfyui:prompt"] || n.comfy_prompt;
				if (e && !K(e)) return !0;
			}
		}
		return !!(e.prompt && typeof e.prompt == "object" || typeof e.prompt == "string" && e.prompt.trim() && !K(e.prompt));
	} catch {
		return !1;
	}
}, J = (e) => {
	let t = e?.filepath || e?.path || e?.file_info?.filepath || e?.file_info?.path || e?.filePath || null;
	return typeof t == "string" && t.trim() || null;
}, Y = (e) => {
	try {
		if (String(e?.mime || e?.mimetype || e?.type || "").toLowerCase().startsWith("video/")) return !0;
		let t = (J(e) || String(e?.filename || e?.name || "")).split(".").pop()?.toLowerCase?.() || "";
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
}, X = (e) => {
	if (!e) return null;
	if (typeof e == "object") return e;
	if (typeof e != "string") return null;
	let t = e.trim();
	return t ? M(() => {
		let e = JSON.parse(t);
		return e && typeof e == "object" ? e : null;
	}, null) : null;
}, Z = (e) => {
	try {
		if (!Y(e) || e?.geninfo || e?.prompt || e?.workflow || e?.metadata) return;
		let t = X(e?.metadata_raw) || {};
		if (t.geninfo_status) return;
		if (e?.geninfo_status) {
			t.geninfo_status = e.geninfo_status, e.metadata_raw = t;
			return;
		}
		t.geninfo_status = { kind: "media_pipeline" }, e.metadata_raw = t;
	} catch (e) {
		console.debug?.(e);
	}
}, Q = (e, t) => {
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
			let t = X(e.metadata_raw);
			if (t && typeof t == "object") {
				for (let e of [
					"geninfo_status",
					"workflow",
					"prompt",
					"geninfo"
				]) (t[e] == null && n[e] != null || e === "prompt" && K(t[e]) && n[e] != null) && (t[e] = n[e]);
				n.raw_ffprobe && t.raw_ffprobe == null && (t.raw_ffprobe = n.raw_ffprobe), n.ffprobe && t.ffprobe == null && (t.ffprobe = n.ffprobe), e.metadata_raw = t;
			}
		}
	} catch (e) {
		console.debug?.(e);
	}
	return e;
};
async function $(e, { getAssetMetadata: t, getFileMetadataScoped: n, metadataCache: r, signal: i } = {}) {
	if (!e || typeof e != "object") return e;
	let a = e?.id ?? null, o = H(e), s = e, c = o ? B(I, o, N) : null;
	if (c && typeof c == "object") return {
		...e,
		...c
	};
	let l = o ? B(L, o, P) : null;
	if (l) {
		try {
			W(s, l);
		} catch (e) {
			console.debug?.(e);
		}
		return s;
	}
	if (o && R.has(o)) try {
		let e = R.get(o);
		if (e && typeof e.then == "function") return await e;
	} catch (e) {
		console.debug?.(e);
	}
	let u = async () => {
		let c = a == null ? null : M(() => r?.getCached?.(a)?.data || null, null);
		c && typeof c == "object" && (s = {
			...e,
			...c
		});
		let l = !!(s?.has_generation_data || s?.has_workflow || s?.has_generation || s?.has_generation_info), u = !!(s?.geninfo || s?.prompt || s?.workflow || s?.metadata), d = null;
		if (a != null && (!q(s) || l && !u)) {
			let e = await M(() => t?.(a, i ? { signal: i } : {}), null);
			e?.ok && e.data && typeof e.data == "object" ? (s = {
				...s,
				...e.data
			}, M(() => r?.setCached?.(a, e.data))) : e && e?.code !== "ABORTED" && (d = {
				kind: "fetch_error",
				stage: "asset",
				code: e?.code || "FETCH_ERROR",
				message: e?.error || "Failed to load asset metadata"
			});
		}
		if (!q(s)) try {
			let e = String(s?.source || s?.type || "output").trim().toLowerCase() || "output", t = String(s?.filename || s?.name || s?.file_info?.filename || "").trim(), r = String(s?.subfolder || s?.file_info?.subfolder || "").trim(), a = String(s?.root_id || s?.rootId || s?.file_info?.root_id || "").trim(), o = String(s?.filepath || s?.path || s?.file_info?.filepath || "").trim();
			if (t) {
				let c = await M(() => n?.({
					type: e,
					filename: t,
					subfolder: r,
					root_id: a,
					filepath: o
				}, i ? { signal: i } : {}), null);
				c?.ok && c.data ? s = Q({ ...s }, c.data) : c && c?.code !== "ABORTED" && (d = {
					kind: "fetch_error",
					stage: "file_scoped",
					code: c?.code || "FETCH_ERROR",
					message: c?.error || "Failed to extract file metadata"
				});
			}
		} catch (e) {
			console.debug?.(e);
		}
		if (Z(s), !G(s) && d) {
			let e = U(s);
			e && e.kind === "media_pipeline" || W(s, d);
		}
		return q(s) && o ? V(I, o, s, N, F) : d && o && V(L, o, d, P, F), s;
	};
	if (o) {
		let e = () => {
			try {
				R.delete(o);
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
				R.delete(o);
			} catch (e) {
				console.debug?.(e);
			}
		});
		return R.set(o, t), await t;
	}
	return await u();
}
function ee({ title: e, asset: t, ui: n } = {}) {
	let r = document.createElement("div");
	try {
		let { app: i } = c(A, {
			title: e,
			asset: t,
			loading: !!n?.loading,
			onRetry: typeof n?.onRetry == "function" ? n.onRetry : null
		});
		return i.mount(r), r._mjrDispose = () => {
			try {
				i.unmount();
			} catch (e) {
				console.debug?.(e);
			}
		}, r;
	} catch (e) {
		console.debug?.(e);
	}
	let i = document.createElement("div");
	if (i.style.cssText = "display:flex; flex-direction:column; gap:10px; margin-bottom: 14px;", e) {
		let t = document.createElement("div");
		t.textContent = e, t.style.cssText = "font-size: 12px; font-weight: 600; letter-spacing: 0.02em; color: rgba(255,255,255,0.86);", i.appendChild(t);
	}
	let a = t?.metadata_raw;
	if (a != null) {
		let e = document.createElement("details");
		e.style.cssText = "border: 1px solid rgba(255,255,255,0.10); border-radius: 10px; background: rgba(255,255,255,0.04); overflow: hidden;";
		let t = document.createElement("summary");
		t.textContent = "Raw metadata", t.style.cssText = "cursor: pointer; padding: 10px 12px; color: rgba(255,255,255,0.78); user-select: none;";
		let n = document.createElement("pre");
		n.style.cssText = "margin:0; padding: 10px 12px; max-height: 280px; overflow:auto; font-size: 11px; line-height: 1.35; color: rgba(255,255,255,0.86);";
		let r = typeof a == "string" ? a : JSON.stringify(a, null, 2);
		r.length > 4e4 && (r = `${r.slice(0, 4e4)}\n...(truncated)`), n.textContent = r, e.appendChild(t), e.appendChild(n), i.appendChild(e);
	}
	return i;
}
//#endregion
export { j as n, $ as t };
