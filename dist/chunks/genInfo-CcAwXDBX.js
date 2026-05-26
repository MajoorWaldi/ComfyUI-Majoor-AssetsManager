import { t as e } from "./rolldown-runtime-DMoxecvO.js";
import { t } from "./config-DC_DVuJE.js";
import { S as n, c as r, l as i, p as a, s as o, t as s } from "./SidebarWorkflowSection-DrDtvSOj.js";
import { C as c, F as l, S as u, T as d, at as f, ot as p, w as m, x as h } from "./mjr-primevue-CgcK2pj6.js";
//#region ui/vue/components/viewer/ViewerMetadataBlock.vue
var g = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "10px",
	"margin-bottom": "14px"
} }, _ = {
	key: 0,
	style: {
		"font-size": "12px",
		"font-weight": "600",
		"letter-spacing": "0.02em",
		color: "rgba(255,255,255,0.86)"
	}
}, v = {
	key: 1,
	style: {
		padding: "10px 12px",
		"border-radius": "10px",
		border: "1px solid rgba(33,150,243,0.35)",
		background: "rgba(33,150,243,0.08)",
		color: "rgba(255,255,255,0.86)",
		"white-space": "pre-wrap"
	}
}, y = { style: {
	"font-size": "12px",
	opacity: "0.9"
} }, b = {
	key: 6,
	style: {
		padding: "10px 12px",
		"border-radius": "10px",
		border: "1px solid rgba(255,255,255,0.12)",
		background: "rgba(255,255,255,0.06)",
		color: "rgba(255,255,255,0.72)"
	}
}, x = {
	key: 7,
	style: {
		border: "1px solid rgba(255,255,255,0.10)",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.04)",
		overflow: "hidden"
	}
}, S = { style: {
	margin: "0",
	padding: "10px 12px",
	"max-height": "280px",
	overflow: "auto",
	"font-size": "11px",
	"line-height": "1.35",
	color: "rgba(255,255,255,0.86)"
} }, C = {
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
		let n = e;
		function a(e) {
			try {
				if (!e || typeof e != "object") return null;
				let t = e?.metadata_raw;
				return t && typeof t == "object" && t.geninfo_status && typeof t.geninfo_status == "object" ? t.geninfo_status : e?.geninfo_status && typeof e.geninfo_status == "object" ? e.geninfo_status : null;
			} catch {
				return null;
			}
		}
		function C(e) {
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
		function w(e) {
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
		function T(e) {
			let t = C(e), n = e?.workflow || e?.Workflow || e?.comfy_workflow || t?.workflow || t?.Workflow || t?.comfy_workflow || null;
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
		function E(e) {
			let t = C(e), n = e?.prompt || e?.Prompt || t?.prompt || t?.Prompt || null;
			if (!n) return null;
			if (typeof n == "object") return w(n) ? n : null;
			if (typeof n != "string") return null;
			let r = n.trim();
			if (!r) return null;
			try {
				let e = JSON.parse(r);
				return w(e) ? e : null;
			} catch {
				return null;
			}
		}
		function D(e) {
			return !!(T(e) || E(e));
		}
		function O(e) {
			let t = e || {}, n = t.generation_time || t.file_creation_time || t.mtime || t.created_at;
			return !!(t.width && t.height || t.duration && t.duration > 0 || n || t.size && t.size > 0 || t.id != null || t.job_id || t.file_info?.job_id || t.source_node_id || t.file_info?.source_node_id || t.source_node_type || t.file_info?.source_node_type || t.workflow_id || t.file_info?.workflow_id || t.user_metadata?.workflow?.id || t.metadata?.workflow_id);
		}
		function k(e) {
			if (e == null) return "";
			let t = typeof e == "string" ? e : JSON.stringify(e, null, 2);
			return t ? t.length > 4e4 ? `${t.slice(0, 4e4)}\n...(truncated)` : t : "";
		}
		function A() {
			typeof n.onRetry == "function" && n.onRetry();
		}
		let j = h(() => a(n.asset)), M = h(() => r(n.asset)), N = h(() => M.value.kind !== "empty"), P = h(() => O(n.asset)), F = h(() => t.WORKFLOW_MINIMAP_ENABLED !== !1 && D(n.asset)), I = h(() => j.value && typeof j.value == "object" && j.value.kind === "fetch_error"), L = h(() => k(n.asset?.metadata_raw)), R = h(() => !n.loading && !I.value && !P.value && !N.value && !F.value), z = h(() => {
			if (!I.value) return "";
			let e = String(j.value?.message || j.value?.error || "Failed to load generation data."), t = String(j.value?.code || j.value?.stage || "").trim();
			return t ? `${e}\n\nCode: ${t}\nClick to retry.` : `${e}\n\nClick to retry.`;
		});
		return (e, t) => (l(), d("div", g, [
			n.title ? (l(), d("div", _, p(n.title), 1)) : m("", !0),
			n.loading ? (l(), d("div", v, [...t[0] ||= [u("div", { style: {
				"font-size": "12px",
				"font-weight": "700",
				"margin-bottom": "6px"
			} }, "Loading", -1), u("div", { style: {
				"font-size": "12px",
				opacity: "0.88"
			} }, "Loading generation data...", -1)]])) : m("", !0),
			I.value ? (l(), d("div", {
				key: 2,
				style: f([{
					padding: "10px 12px",
					"border-radius": "10px",
					border: "1px solid rgba(244,67,54,0.35)",
					background: "rgba(244,67,54,0.08)",
					color: "rgba(255,255,255,0.9)",
					"white-space": "pre-wrap"
				}, { cursor: n.onRetry ? "pointer" : "default" }]),
				onClick: A
			}, [t[1] ||= u("div", { style: {
				"font-size": "12px",
				"font-weight": "700",
				"margin-bottom": "6px"
			} }, "Error Loading Metadata", -1), u("div", y, p(z.value), 1)], 4)) : m("", !0),
			P.value ? (l(), c(i, {
				key: 3,
				asset: n.asset
			}, null, 8, ["asset"])) : m("", !0),
			N.value ? (l(), c(o, {
				key: 4,
				asset: n.asset
			}, null, 8, ["asset"])) : m("", !0),
			F.value ? (l(), c(s, {
				key: 5,
				asset: n.asset
			}, null, 8, ["asset"])) : m("", !0),
			R.value ? (l(), d("div", b, " No generation data found for this file. ")) : m("", !0),
			L.value ? (l(), d("details", x, [t[2] ||= u("summary", { style: {
				cursor: "pointer",
				padding: "10px 12px",
				color: "rgba(255,255,255,0.78)",
				"user-select": "none"
			} }, " Raw metadata ", -1), u("pre", S, p(L.value), 1)])) : m("", !0)
		]));
	}
}, w = /* @__PURE__ */ e({
	buildViewerMetadataBlocks: () => G,
	ensureViewerMetadataAsset: () => W
}), T = (e, t = null) => {
	let r = n(e);
	return r === void 0 ? t : r;
}, E = t?.VIEWER_GENINFO_TTL_MS ?? 3e4, D = t?.VIEWER_GENINFO_ERROR_TTL_MS ?? 8e3, O = t?.VIEWER_GENINFO_MAX_ENTRIES ?? 300, k = /* @__PURE__ */ new Map(), A = /* @__PURE__ */ new Map(), j = /* @__PURE__ */ new Map(), M = (e, t, n) => {
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
}, N = (e, t, n) => {
	try {
		let r = e.get(t);
		return r ? Date.now() - (r.at || 0) > n ? (e.delete(t), null) : r.data ?? null : null;
	} catch {
		return null;
	}
}, P = (e, t, n, r, i) => {
	try {
		e.set(t, {
			at: Date.now(),
			data: n
		}), M(e, r, i);
	} catch (e) {
		console.debug?.(e);
	}
}, F = (e) => {
	try {
		let t = e?.id;
		if (t != null) return `id:${t}`;
		let n = z(e);
		if (n) return `fp:${n}`;
		let r = String(e?.filename || e?.name || "").trim(), i = String(e?.subfolder || "").trim(), a = String(e?.source || e?.type || "output").trim().toLowerCase();
		if (r) return `name:${a}:${i}:${r}`;
	} catch (e) {
		console.debug?.(e);
	}
	return null;
}, I = (e) => {
	try {
		if (!e || typeof e != "object") return null;
		let t = e?.metadata_raw;
		return t && typeof t == "object" && t.geninfo_status && typeof t.geninfo_status == "object" ? t.geninfo_status : e?.geninfo_status && typeof e.geninfo_status == "object" ? e.geninfo_status : null;
	} catch {
		return null;
	}
}, L = (e, t) => {
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
}, R = (e) => {
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
}, z = (e) => {
	let t = e?.filepath || e?.path || e?.file_info?.filepath || e?.file_info?.path || e?.filePath || null;
	return typeof t == "string" && t.trim() || null;
}, B = (e) => {
	try {
		if (String(e?.mime || e?.mimetype || e?.type || "").toLowerCase().startsWith("video/")) return !0;
		let t = (z(e) || String(e?.filename || e?.name || "")).split(".").pop()?.toLowerCase?.() || "";
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
}, V = (e) => {
	if (!e) return null;
	if (typeof e == "object") return e;
	if (typeof e != "string") return null;
	let t = e.trim();
	return t ? T(() => {
		let e = JSON.parse(t);
		return e && typeof e == "object" ? e : null;
	}, null) : null;
}, H = (e) => {
	try {
		if (!B(e) || e?.geninfo || e?.prompt || e?.workflow || e?.metadata) return;
		let t = V(e?.metadata_raw) || {};
		if (t.geninfo_status) return;
		if (e?.geninfo_status) {
			t.geninfo_status = e.geninfo_status, e.metadata_raw = t;
			return;
		}
		t.geninfo_status = { kind: "media_pipeline" }, e.metadata_raw = t;
	} catch (e) {
		console.debug?.(e);
	}
}, U = (e, t) => {
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
			let t = V(e.metadata_raw);
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
async function W(e, { getAssetMetadata: t, getFileMetadataScoped: n, metadataCache: r, signal: i } = {}) {
	if (!e || typeof e != "object") return e;
	let a = e?.id ?? null, o = F(e), s = e, c = o ? N(k, o, E) : null;
	if (c && typeof c == "object") return {
		...e,
		...c
	};
	let l = o ? N(A, o, D) : null;
	if (l) {
		try {
			L(s, l);
		} catch (e) {
			console.debug?.(e);
		}
		return s;
	}
	if (o && j.has(o)) try {
		let e = j.get(o);
		if (e && typeof e.then == "function") return await e;
	} catch (e) {
		console.debug?.(e);
	}
	let u = async () => {
		let c = a == null ? null : T(() => r?.getCached?.(a)?.data || null, null);
		c && typeof c == "object" && (s = {
			...e,
			...c
		});
		let l = !!(s?.has_generation_data || s?.has_workflow || s?.has_generation || s?.has_generation_info), u = !!(s?.geninfo || s?.prompt || s?.workflow || s?.metadata), d = null;
		if (a != null && (!R(s) || l && !u)) {
			let e = await T(() => t?.(a, i ? { signal: i } : {}), null);
			e?.ok && e.data && typeof e.data == "object" ? (s = {
				...s,
				...e.data
			}, T(() => r?.setCached?.(a, e.data))) : e && e?.code !== "ABORTED" && (d = {
				kind: "fetch_error",
				stage: "asset",
				code: e?.code || "FETCH_ERROR",
				message: e?.error || "Failed to load asset metadata"
			});
		}
		if (!R(s)) try {
			let e = String(s?.source || s?.type || "output").trim().toLowerCase() || "output", t = String(s?.filename || s?.name || s?.file_info?.filename || "").trim(), r = String(s?.subfolder || s?.file_info?.subfolder || "").trim(), a = String(s?.root_id || s?.rootId || s?.file_info?.root_id || "").trim(), o = String(s?.filepath || s?.path || s?.file_info?.filepath || "").trim();
			if (t) {
				let c = await T(() => n?.({
					type: e,
					filename: t,
					subfolder: r,
					root_id: a,
					filepath: o
				}, i ? { signal: i } : {}), null);
				c?.ok && c.data ? s = U({ ...s }, c.data) : c && c?.code !== "ABORTED" && (d = {
					kind: "fetch_error",
					stage: "file_scoped",
					code: c?.code || "FETCH_ERROR",
					message: c?.error || "Failed to extract file metadata"
				});
			}
		} catch (e) {
			console.debug?.(e);
		}
		if (H(s), !R(s) && d) {
			let e = I(s);
			e && e.kind === "media_pipeline" || L(s, d);
		}
		return R(s) && o ? P(k, o, s, E, O) : d && o && P(A, o, d, D, O), s;
	};
	if (o) {
		let e = () => {
			try {
				j.delete(o);
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
				j.delete(o);
			} catch (e) {
				console.debug?.(e);
			}
		});
		return j.set(o, t), await t;
	}
	return await u();
}
function G({ title: e, asset: t, ui: n } = {}) {
	let r = document.createElement("div");
	try {
		let { app: i } = a(C, {
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
	let o = t?.metadata_raw;
	if (o != null) {
		let e = document.createElement("details");
		e.style.cssText = "border: 1px solid rgba(255,255,255,0.10); border-radius: 10px; background: rgba(255,255,255,0.04); overflow: hidden;";
		let t = document.createElement("summary");
		t.textContent = "Raw metadata", t.style.cssText = "cursor: pointer; padding: 10px 12px; color: rgba(255,255,255,0.78); user-select: none;";
		let n = document.createElement("pre");
		n.style.cssText = "margin:0; padding: 10px 12px; max-height: 280px; overflow:auto; font-size: 11px; line-height: 1.35; color: rgba(255,255,255,0.86);";
		let r = typeof o == "string" ? o : JSON.stringify(o, null, 2);
		r.length > 4e4 && (r = `${r.slice(0, 4e4)}\n...(truncated)`), n.textContent = r, e.appendChild(t), e.appendChild(n), i.appendChild(e);
	}
	return i;
}
//#endregion
export { w as n, W as t };
