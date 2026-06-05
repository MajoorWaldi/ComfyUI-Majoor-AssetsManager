import { t as e } from "./rolldown-runtime-Dy4uBu1J.js";
import { l as t, t as n } from "./config-eqarUfKd.js";
import { S as r, c as i, l as a, p as o, s, t as c } from "./SidebarWorkflowSection-Caxdr0um.js";
import { C as l, F as u, S as d, T as f, at as p, ot as m, rt as h, w as g, x as _ } from "./mjr-primevue-DeVPqKdl.js";
//#region ui/vue/components/viewer/ViewerMetadataBlock.vue
var v = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "10px",
	"margin-bottom": "14px"
} }, y = {
	key: 0,
	style: {
		"font-size": "12px",
		"font-weight": "600",
		"letter-spacing": "0.02em",
		color: "rgba(255,255,255,0.86)"
	}
}, b = {
	key: 1,
	style: {
		padding: "10px 12px",
		"border-radius": "10px",
		border: "1px solid rgba(33,150,243,0.35)",
		background: "rgba(33,150,243,0.08)",
		color: "rgba(255,255,255,0.86)",
		"white-space": "pre-wrap"
	}
}, x = { style: {
	"font-size": "12px",
	"font-weight": "700",
	"margin-bottom": "6px"
} }, S = { style: {
	"font-size": "12px",
	opacity: "0.88"
} }, C = { style: {
	"font-size": "12px",
	"font-weight": "700",
	"margin-bottom": "6px"
} }, w = { style: {
	"font-size": "12px",
	opacity: "0.9"
} }, T = {
	key: 6,
	style: {
		padding: "10px 12px",
		"border-radius": "10px",
		border: "1px solid rgba(255,255,255,0.12)",
		background: "rgba(255,255,255,0.06)",
		color: "rgba(255,255,255,0.72)"
	}
}, E = {
	key: 7,
	style: {
		border: "1px solid rgba(255,255,255,0.10)",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.04)",
		overflow: "hidden"
	}
}, D = { style: {
	cursor: "pointer",
	padding: "10px 12px",
	color: "rgba(255,255,255,0.78)",
	"user-select": "none"
} }, O = { style: {
	margin: "0",
	padding: "10px 12px",
	"max-height": "280px",
	overflow: "auto",
	"font-size": "11px",
	"line-height": "1.35",
	color: "rgba(255,255,255,0.86)"
} }, k = {
	__name: "ViewerMetadataBlock",
	props: {
		title: {
			type: String,
			default: ""
		},
		asset: {
			type: Object,
			default: null
		},
		loading: {
			type: Boolean,
			default: !1
		},
		onRetry: {
			type: Function,
			default: null
		}
	},
	setup(e) {
		let r = e;
		function o(e) {
			try {
				if (!e || typeof e != "object") return null;
				let t = e?.metadata_raw;
				return t && typeof t == "object" && t.geninfo_status && typeof t.geninfo_status == "object" ? t.geninfo_status : e?.geninfo_status && typeof e.geninfo_status == "object" ? e.geninfo_status : null;
			} catch {
				return null;
			}
		}
		function k(e) {
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
			let t = k(e), n = e?.workflow || e?.Workflow || e?.comfy_workflow || t?.workflow || t?.Workflow || t?.comfy_workflow || null;
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
			let t = k(e), n = e?.prompt || e?.Prompt || t?.prompt || t?.Prompt || null;
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
			return !!(t.width && t.height || t.duration && t.duration > 0 || n || t.size && t.size > 0 || t.id != null || t.job_id || t.file_info?.job_id || t.source_node_id || t.file_info?.source_node_id || t.source_node_type || t.file_info?.source_node_type || t.workflow_id || t.file_info?.workflow_id || t.user_metadata?.workflow?.id || t.metadata?.workflow_id);
		}
		function F(e) {
			if (e == null) return "";
			let t = typeof e == "string" ? e : JSON.stringify(e, null, 2);
			return t ? t.length > 4e4 ? `${t.slice(0, 4e4)}\n...(truncated)` : t : "";
		}
		function I() {
			typeof r.onRetry == "function" && r.onRetry();
		}
		let L = _(() => o(r.asset)), R = _(() => i(r.asset)), z = _(() => R.value.kind !== "empty"), B = _(() => P(r.asset)), V = _(() => n.WORKFLOW_MINIMAP_ENABLED !== !1 && N(r.asset)), H = _(() => L.value && typeof L.value == "object" && L.value.kind === "fetch_error"), U = _(() => F(r.asset?.metadata_raw)), W = _(() => !r.loading && !H.value && !B.value && !z.value && !V.value), G = _(() => {
			if (!H.value) return "";
			let e = String(L.value?.message || L.value?.error || "Failed to load generation data."), n = String(L.value?.code || L.value?.stage || "").trim();
			return n ? t("viewer.metadataErrorWithCode", "{message}\n\nCode: {code}\nClick to retry.", {
				message: e,
				code: n
			}) : t("viewer.metadataErrorRetry", "{message}\n\nClick to retry.", { message: e });
		});
		return (e, n) => (u(), f("div", v, [
			r.title ? (u(), f("div", y, m(r.title), 1)) : g("", !0),
			r.loading ? (u(), f("div", b, [d("div", x, m(h(t)("status.loading", "Loading")), 1), d("div", S, m(h(t)("viewer.loadingGenerationData", "Loading generation data...")), 1)])) : g("", !0),
			H.value ? (u(), f("div", {
				key: 2,
				style: p([{
					padding: "10px 12px",
					"border-radius": "10px",
					border: "1px solid rgba(244,67,54,0.35)",
					background: "rgba(244,67,54,0.08)",
					color: "rgba(255,255,255,0.9)",
					"white-space": "pre-wrap"
				}, { cursor: r.onRetry ? "pointer" : "default" }]),
				onClick: I
			}, [d("div", C, m(h(t)("viewer.errorLoadingMetadata", "Error Loading Metadata")), 1), d("div", w, m(G.value), 1)], 4)) : g("", !0),
			B.value ? (u(), l(a, {
				key: 3,
				asset: r.asset
			}, null, 8, ["asset"])) : g("", !0),
			z.value ? (u(), l(s, {
				key: 4,
				asset: r.asset
			}, null, 8, ["asset"])) : g("", !0),
			V.value ? (u(), l(c, {
				key: 5,
				asset: r.asset
			}, null, 8, ["asset"])) : g("", !0),
			W.value ? (u(), f("div", T, m(h(t)("viewer.noGenerationDataFile", "No generation data found for this file.")), 1)) : g("", !0),
			U.value ? (u(), f("details", E, [d("summary", D, m(h(t)("msg.rawMetadata", "Raw metadata")), 1), d("pre", O, m(U.value), 1)])) : g("", !0)
		]));
	}
}, A = /* @__PURE__ */ e({
	buildViewerMetadataBlocks: () => Z,
	ensureViewerMetadataAsset: () => X
}), j = (e, t = null) => {
	let n = r(e);
	return n === void 0 ? t : n;
}, M = n?.VIEWER_GENINFO_TTL_MS ?? 3e4, N = n?.VIEWER_GENINFO_ERROR_TTL_MS ?? 8e3, P = n?.VIEWER_GENINFO_MAX_ENTRIES ?? 300, F = /* @__PURE__ */ new Map(), I = /* @__PURE__ */ new Map(), L = /* @__PURE__ */ new Map(), R = (e, t, n) => {
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
}, z = (e, t, n) => {
	try {
		let r = e.get(t);
		return r ? Date.now() - (r.at || 0) > n ? (e.delete(t), null) : r.data ?? null : null;
	} catch {
		return null;
	}
}, B = (e, t, n, r, i) => {
	try {
		e.set(t, {
			at: Date.now(),
			data: n
		}), R(e, r, i);
	} catch (e) {
		console.debug?.(e);
	}
}, V = (e) => {
	try {
		let t = e?.id;
		if (t != null) return `id:${t}`;
		let n = G(e);
		if (n) return `fp:${n}`;
		let r = String(e?.filename || e?.name || "").trim(), i = String(e?.subfolder || "").trim(), a = String(e?.source || e?.type || "output").trim().toLowerCase();
		if (r) return `name:${a}:${i}:${r}`;
	} catch (e) {
		console.debug?.(e);
	}
	return null;
}, H = (e) => {
	try {
		if (!e || typeof e != "object") return null;
		let t = e?.metadata_raw;
		return t && typeof t == "object" && t.geninfo_status && typeof t.geninfo_status == "object" ? t.geninfo_status : e?.geninfo_status && typeof e.geninfo_status == "object" ? e.geninfo_status : null;
	} catch {
		return null;
	}
}, U = (e, t) => {
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
}, W = (e) => {
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
}, G = (e) => {
	let t = e?.filepath || e?.path || e?.file_info?.filepath || e?.file_info?.path || e?.filePath || null;
	return typeof t == "string" && t.trim() || null;
}, K = (e) => {
	try {
		if (String(e?.mime || e?.mimetype || e?.type || "").toLowerCase().startsWith("video/")) return !0;
		let t = (G(e) || String(e?.filename || e?.name || "")).split(".").pop()?.toLowerCase?.() || "";
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
}, q = (e) => {
	if (!e) return null;
	if (typeof e == "object") return e;
	if (typeof e != "string") return null;
	let t = e.trim();
	return t ? j(() => {
		let e = JSON.parse(t);
		return e && typeof e == "object" ? e : null;
	}, null) : null;
}, J = (e) => {
	try {
		if (!K(e) || e?.geninfo || e?.prompt || e?.workflow || e?.metadata) return;
		let t = q(e?.metadata_raw) || {};
		if (t.geninfo_status) return;
		if (e?.geninfo_status) {
			t.geninfo_status = e.geninfo_status, e.metadata_raw = t;
			return;
		}
		t.geninfo_status = { kind: "media_pipeline" }, e.metadata_raw = t;
	} catch (e) {
		console.debug?.(e);
	}
}, Y = (e, t) => {
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
			let t = q(e.metadata_raw);
			if (t && typeof t == "object") {
				for (let e of [
					"geninfo_status",
					"workflow",
					"prompt",
					"geninfo"
				]) t[e] == null && n[e] != null && (t[e] = n[e]);
				e.metadata_raw = t;
			}
		}
	} catch (e) {
		console.debug?.(e);
	}
	return e;
};
async function X(e, { getAssetMetadata: t, getFileMetadataScoped: n, metadataCache: r, signal: i } = {}) {
	if (!e || typeof e != "object") return e;
	let a = e?.id ?? null, o = V(e), s = e, c = o ? z(F, o, M) : null;
	if (c && typeof c == "object") return {
		...e,
		...c
	};
	let l = o ? z(I, o, N) : null;
	if (l) {
		try {
			U(s, l);
		} catch (e) {
			console.debug?.(e);
		}
		return s;
	}
	if (o && L.has(o)) try {
		let e = L.get(o);
		if (e && typeof e.then == "function") return await e;
	} catch (e) {
		console.debug?.(e);
	}
	let u = async () => {
		let c = a == null ? null : j(() => r?.getCached?.(a)?.data || null, null);
		c && typeof c == "object" && (s = {
			...e,
			...c
		});
		let l = !!(s?.has_generation_data || s?.has_workflow || s?.has_generation || s?.has_generation_info), u = !!(s?.geninfo || s?.prompt || s?.workflow || s?.metadata), d = null;
		if (a != null && (!W(s) || l && !u)) {
			let e = await j(() => t?.(a, i ? { signal: i } : {}), null);
			e?.ok && e.data && typeof e.data == "object" ? (s = {
				...s,
				...e.data
			}, j(() => r?.setCached?.(a, e.data))) : e && e?.code !== "ABORTED" && (d = {
				kind: "fetch_error",
				stage: "asset",
				code: e?.code || "FETCH_ERROR",
				message: e?.error || "Failed to load asset metadata"
			});
		}
		if (!W(s)) try {
			let e = String(s?.source || s?.type || "output").trim().toLowerCase() || "output", t = String(s?.filename || s?.name || s?.file_info?.filename || "").trim(), r = String(s?.subfolder || s?.file_info?.subfolder || "").trim(), a = String(s?.root_id || s?.rootId || s?.file_info?.root_id || "").trim(), o = String(s?.filepath || s?.path || s?.file_info?.filepath || "").trim();
			if (t) {
				let c = await j(() => n?.({
					type: e,
					filename: t,
					subfolder: r,
					root_id: a,
					filepath: o
				}, i ? { signal: i } : {}), null);
				c?.ok && c.data ? s = Y({ ...s }, c.data) : c && c?.code !== "ABORTED" && (d = {
					kind: "fetch_error",
					stage: "file_scoped",
					code: c?.code || "FETCH_ERROR",
					message: c?.error || "Failed to extract file metadata"
				});
			}
		} catch (e) {
			console.debug?.(e);
		}
		if (J(s), !W(s) && d) {
			let e = H(s);
			e && e.kind === "media_pipeline" || U(s, d);
		}
		return W(s) && o ? B(F, o, s, M, P) : d && o && B(I, o, d, N, P), s;
	};
	if (o) {
		let e = () => {
			try {
				L.delete(o);
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
				L.delete(o);
			} catch (e) {
				console.debug?.(e);
			}
		});
		return L.set(o, t), await t;
	}
	return await u();
}
function Z({ title: e, asset: t, ui: n } = {}) {
	let r = document.createElement("div");
	try {
		let { app: i } = o(k, {
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
export { A as n, X as t };
