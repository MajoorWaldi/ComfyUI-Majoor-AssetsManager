import { A as e, E as t, J as n, R as r, S as i, Y as a, b as o, j as s, m as c } from "./events-CrhYyn_G.js";
import { a as l, n as u } from "./graphTraversal-Sruu0ipL.js";
import { S as d, b as f, v as p, x as ee, y as te } from "./SidebarWorkflowSection-Ck029fwe.js";
//#region ui/features/viewer/floatingViewerProgress.ts
var m = "progress-update", h = "__MJR_MFV_PROGRESS_SERVICE__";
function ne() {
	return typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : {};
}
function g(e, t) {
	if (typeof CustomEvent == "function") return new CustomEvent(e, { detail: t });
	let n = typeof Event == "function" ? new Event(e) : { type: e };
	return n.detail = t, n;
}
var re = class {
	constructor(e, t = () => s()) {
		this.id = String(e || ""), this.promptApi = null, this.executedNodeIds = [], this.totalNodes = 0, this.currentlyExecuting = null, this.errorDetails = null, this._getApp = typeof t == "function" ? t : () => null;
	}
	setPrompt(e) {
		let t = e && typeof e == "object" ? e.output : null;
		this.promptApi = t && typeof t == "object" ? t : null, this.totalNodes = this.promptApi ? Object.keys(this.promptApi).length : 0;
	}
	getApiNode(e) {
		return this.promptApi?.[String(e)] || null;
	}
	getNodeLabel(e) {
		let t = this.getApiNode(e), n = t?._meta?.title || t?.class_type || "";
		if (!n) {
			let t = this._getApp?.(), r = u(l(t), e);
			n = r?.title || r?.type || "";
		}
		return String(n || "").trim();
	}
	markExecuted(e) {
		let t = String(e || "").trim();
		t && (this.executedNodeIds.includes(t) || this.executedNodeIds.push(t));
	}
	executing(e, t, n) {
		if (e == null) {
			this.currentlyExecuting = null;
			return;
		}
		let r = String(e || "").trim();
		if (r) {
			if (this.currentlyExecuting?.nodeId !== r) {
				this.currentlyExecuting != null && this.markExecuted(this.currentlyExecuting.nodeId), this.currentlyExecuting = {
					nodeId: r,
					nodeLabel: this.getNodeLabel(r),
					pass: 0
				};
				let e = this.getApiNode(r);
				this.currentlyExecuting.nodeLabel || (this.currentlyExecuting.nodeLabel = this.getNodeLabel(r)), e?.class_type === "UltimateSDUpscale" ? (--this.currentlyExecuting.pass, this.currentlyExecuting.maxPasses = -1) : e?.class_type === "IterativeImageUpscale" && (this.currentlyExecuting.maxPasses = Number(e?.inputs?.steps) || -1);
			}
			if (t != null) {
				let e = Number(t), r = Number(n);
				if (!Number.isFinite(e)) return;
				(!this.currentlyExecuting.step || e < Number(this.currentlyExecuting.step)) && (this.currentlyExecuting.pass += 1), this.currentlyExecuting.step = e, this.currentlyExecuting.maxSteps = Number.isFinite(r) ? r : null;
			}
		}
	}
	error(e) {
		this.errorDetails = e || null;
	}
}, _ = class extends EventTarget {
	constructor({ getApi: t = (t) => e(t), getApp: r = () => s(), waitForApi: i = (e) => n(e) } = {}) {
		super(), this._getApi = t, this._getApp = r, this._waitForApi = i, this.promptsMap = /* @__PURE__ */ new Map(), this.currentExecution = null, this.lastQueueRemaining = 0, this._api = null, this._listenerEntries = [], this._initPromise = null, this._queuePromptBinding = null;
	}
	getSnapshot() {
		return {
			queue: this.lastQueueRemaining,
			prompt: this.currentExecution
		};
	}
	getCurrentNodeId() {
		let e = this.currentExecution;
		return String(e?.errorDetails?.node_id || e?.currentlyExecuting?.nodeId || "").trim();
	}
	getOrMakePrompt(e) {
		let t = String(e || "").trim() || "unknown", n = this.promptsMap.get(t);
		return n || (n = new re(t, this._getApp), this.promptsMap.set(t, n)), n;
	}
	async ensureInitialized({ api: e = null, app: t = null, timeoutMs: n = 0 } = {}) {
		return e && this._api === e ? e : !e && this._api ? this._api : (this._initPromise ||= this._ensureInitializedInternal({
			api: e,
			app: t,
			timeoutMs: n
		}).finally(() => {
			this._initPromise = null;
		}), this._initPromise);
	}
	async _ensureInitializedInternal({ api: e = null, app: t = null, timeoutMs: n = 0 } = {}) {
		let r = e || this._getApi?.(t) || null;
		if (!r && n > 0 && typeof this._waitForApi == "function") try {
			r = await this._waitForApi({
				app: t,
				timeoutMs: n
			});
		} catch (e) {
			console.debug?.(e);
		}
		return r ? (this._attachApi(r), r) : null;
	}
	_attachApi(e) {
		!e || typeof e.addEventListener != "function" || this._api !== e && (this.dispose({
			resetPatchedQueuePrompt: !1,
			keepState: !0
		}), this._api = e, this._patchQueuePrompt(e), this._attachApiListeners(e));
	}
	_patchQueuePrompt(e) {
		let t = this;
		this._queuePromptBinding = a({
			api: e,
			owner: this,
			createWrapper(e) {
				return async function(n, r, ...i) {
					let a;
					try {
						a = await e.apply(this, [
							n,
							r,
							...i
						]);
					} catch (e) {
						let n = t.getOrMakePrompt("error");
						throw n.error({ exception_type: "Unknown." }), t.currentExecution = n, t.dispatchProgressUpdate(), e;
					}
					let o = String(a?.prompt_id || a?.promptId || "").trim();
					if (o) {
						let e = t.getOrMakePrompt(o);
						e.setPrompt(r), t.currentExecution ||= e, t.dispatchEvent(g("queue-prompt", { prompt: e })), t.dispatchProgressUpdate();
					}
					return a;
				};
			}
		});
	}
	_attachApiListeners(e) {
		this._attachListener(e, "status", (e) => {
			e?.detail?.exec_info && (this.lastQueueRemaining = Number(e.detail.exec_info.queue_remaining) || 0, this.dispatchProgressUpdate());
		}), this._attachListener(e, "execution_start", (e) => {
			let t = String(e?.detail?.prompt_id || e?.detail?.promptId || "").trim();
			t && (this.currentExecution = this.getOrMakePrompt(t), this.dispatchProgressUpdate());
		}), this._attachListener(e, "executing", (e) => {
			this.currentExecution ||= this.getOrMakePrompt("unknown"), this.currentExecution.executing(e?.detail), e?.detail ?? (this.currentExecution = null), this.dispatchProgressUpdate();
		}), this._attachListener(e, "progress", (e) => {
			let t = e?.detail || {};
			this.currentExecution ||= this.getOrMakePrompt(t.prompt_id || t.promptId), this.currentExecution.executing(t.node, t.value, t.max), this.dispatchProgressUpdate();
		}), this._attachListener(e, "execution_cached", (e) => {
			let t = e?.detail || {};
			this.currentExecution ||= this.getOrMakePrompt(t.prompt_id || t.promptId);
			for (let e of Array.isArray(t.nodes) ? t.nodes : []) this.currentExecution.markExecuted(e);
			this.dispatchProgressUpdate();
		}), this._attachListener(e, "executed", (e) => {
			let t = e?.detail || {};
			if (!this.currentExecution) {
				let e = String(t.prompt_id || t.promptId || "").trim();
				e && (this.currentExecution = this.getOrMakePrompt(e));
			}
		}), this._attachListener(e, "execution_error", (e) => {
			let t = e?.detail || {};
			this.currentExecution ||= this.getOrMakePrompt(t.prompt_id || t.promptId), this.currentExecution?.error(t), this.dispatchProgressUpdate();
		});
		let t = () => {
			this.currentExecution && this.currentExecution.executing(null), this.currentExecution = null, this.dispatchProgressUpdate();
		};
		this._attachListener(e, "execution_success", t), this._attachListener(e, "execution_interrupted", t);
	}
	_attachListener(e, t, n) {
		e.addEventListener(t, n), this._listenerEntries.push({
			api: e,
			type: t,
			handler: n
		});
	}
	dispatchProgressUpdate() {
		this.dispatchEvent(g(m, this.getSnapshot()));
	}
	dispose({ resetPatchedQueuePrompt: e = !1, keepState: t = !1 } = {}) {
		for (let { api: e, type: t, handler: n } of this._listenerEntries.splice(0)) try {
			e?.removeEventListener?.(t, n);
		} catch (e) {
			console.debug?.(e);
		}
		if (e && this._queuePromptBinding?.owner === this) try {
			this._queuePromptBinding.restore?.();
		} catch (e) {
			console.debug?.(e);
		}
		this._queuePromptBinding = null, this._api = null, t || (this.promptsMap.clear(), this.currentExecution = null, this.lastQueueRemaining = 0);
	}
}, v = ne(), y = v[h] || new _();
v[h] || (v[h] = y);
function b(e = {}) {
	return y.ensureInitialized(e);
}
function ie(e) {
	let t = Math.max(0, Number(e?.queue) || 0), n = e?.prompt || null;
	if (n?.errorDetails) return [
		String(n.errorDetails?.exception_type || "Execution error").trim(),
		String(n.errorDetails?.node_id || "").trim(),
		String(n.errorDetails?.node_type || "").trim()
	].filter(Boolean).join(" ");
	if (n?.currentlyExecuting) {
		let e = n.currentlyExecuting, r = `(${t}) `;
		if (!n.totalNodes) r += "??%";
		else {
			let e = n.executedNodeIds.length / n.totalNodes * 100;
			r += `${Math.round(e)}%`;
		}
		let i = "";
		if (e.step != null && e.maxSteps) {
			let t = Number(e.step) / Number(e.maxSteps) * 100;
			(e.pass > 1 || e.maxPasses != null) && (i += `#${e.pass}`, e.maxPasses && e.maxPasses > 0 && (i += `/${e.maxPasses}`), i += " - "), i += `${Math.round(t)}%`;
		}
		let a = String(e.nodeLabel || "").trim();
		return (a || i) && (r += ` - ${a || "Unknown node"}${i ? ` (${i})` : ""}`), r;
	}
	return t > 0 ? `(${t}) Running... in another tab` : "Idle";
}
function ae(e) {
	let t = e?.prompt || null;
	if (t?.errorDetails) {
		let e = t?.errorDetails || {}, n = String(t?.currentlyExecuting?.nodeLabel || e?.node_type || e?.node_id || "Execution").trim(), r = e?.exception_message ?? e?.error ?? e?.message ?? e?.detail ?? e?.reason ?? "", i = (Array.isArray(r) ? r.map((e) => String(e || "").trim()).filter(Boolean).join(" | ") : String(r || "").trim()).replace(/\s+/g, " ").trim();
		return i ? `${n} - ${i}` : `${n} - Error`;
	}
	let n = t?.currentlyExecuting || null;
	if (!n) return "";
	let r = String(n.nodeLabel || n.nodeId || "Node").trim(), i = Number(n.step), a = Number(n.maxSteps);
	return Number.isFinite(i) && Number.isFinite(a) && a > 0 ? n.pass > 1 ? `${r} #${n.pass} - ${i}/${a}` : `${r} - ${i}/${a}` : r;
}
function x(e, t) {
	if (!e?._progressEl && !e?._mediaProgressEl) return;
	let n = t?.prompt || null, r = String(n?.errorDetails?.node_id || n?.currentlyExecuting?.nodeId || "").trim(), i = "0%", a = "0%", o = !!n?.errorDetails;
	if (n?.currentlyExecuting) {
		if (n.totalNodes > 0) {
			let e = n.executedNodeIds.length / n.totalNodes * 100;
			i = `${Math.max(2, Math.round(e * 100) / 100)}%`;
		}
		let e = Number(n.currentlyExecuting?.step), t = Number(n.currentlyExecuting?.maxSteps);
		Number.isFinite(e) && Number.isFinite(t) && t > 0 && (a = `${Math.max(0, Math.min(100, e / t * 100))}%`);
	} else o && (i = "100%", a = "100%");
	if (e._progressCurrentNodeId = r || null, e._progressEl && (e._progressNodesEl.style.width = i, e._progressStepsEl.style.width = a, e._progressTextEl.textContent = ie(t), e._progressEl.classList.toggle("is-error", o), e._progressEl.classList.toggle("is-clickable", !!r), e._progressEl.title = r ? "Execution progress - click to center active node" : "Execution progress"), e._mediaProgressEl) {
		let n = ae(t);
		e._mediaProgressTextEl.textContent = n, e._mediaProgressEl.title = n || "", e._mediaProgressEl.classList.toggle("is-error", o), e._mediaProgressEl.classList.toggle("is-visible", !!n);
	}
}
function oe(e, t) {
	let n = String(t || "").trim();
	if (!n) return !1;
	try {
		return o(n, s());
	} catch (e) {
		return console.debug?.(e), !1;
	}
}
function se(e) {
	let t = document.createElement("div");
	t.className = "mjr-mfv-progress", t.setAttribute("role", "status"), t.setAttribute("aria-live", "polite");
	let n = document.createElement("div");
	n.className = "mjr-mfv-progress-bar mjr-mfv-progress-bar--nodes";
	let r = document.createElement("div");
	r.className = "mjr-mfv-progress-bar mjr-mfv-progress-bar--steps";
	let i = document.createElement("div");
	i.className = "mjr-mfv-progress-overlay", i.setAttribute("aria-hidden", "true");
	let a = document.createElement("span");
	return a.className = "mjr-mfv-progress-text", a.textContent = "Idle", t.appendChild(n), t.appendChild(r), t.appendChild(i), t.appendChild(a), t.addEventListener("pointerdown", (t) => {
		t.button === 0 && oe(e, e._progressCurrentNodeId) && (t.preventDefault(), t.stopPropagation());
	}), e._progressEl = t, e._progressNodesEl = n, e._progressStepsEl = r, e._progressTextEl = a, e._progressUpdateHandler && y.removeEventListener(m, e._progressUpdateHandler), e._progressUpdateHandler = (t) => {
		x(e, t?.detail || y.getSnapshot());
	}, y.addEventListener(m, e._progressUpdateHandler), b({ timeoutMs: 4e3 }).catch((e) => {
		console.debug?.(e);
	}), x(e, y.getSnapshot()), t;
}
function ce(e) {
	let t = document.createElement("div");
	t.className = "mjr-mfv-media-progress", t.setAttribute("aria-hidden", "true");
	let n = document.createElement("span");
	return n.className = "mjr-mfv-media-progress-text", t.appendChild(n), e._mediaProgressEl = t, e._mediaProgressTextEl = n, x(e, y.getSnapshot()), t;
}
function S(e) {
	if (e?._progressUpdateHandler) try {
		y.removeEventListener(m, e._progressUpdateHandler);
	} catch (e) {
		console.debug?.(e);
	}
	e._progressUpdateHandler = null, e._progressCurrentNodeId = null, e._progressEl = null, e._progressNodesEl = null, e._progressStepsEl = null, e._progressTextEl = null, e._mediaProgressEl = null, e._mediaProgressTextEl = null;
}
//#endregion
//#region ui/features/viewer/workflowGraphMap/workflowGraphMapData.ts
var C = /* @__PURE__ */ new Map(), w = null;
async function le(e) {
	let t = Array.from(new Set(T(e).map((e) => O(e)).filter(Boolean)));
	if (t.length && t.filter((e) => !C.has(e)).length) try {
		w ||= i("/object_info").then((e) => e?.ok ? e.json() : null).then((e) => {
			if (e && typeof e == "object") for (let [t, n] of Object.entries(e)) C.set(String(t), n);
			return e;
		}).catch(() => null), await w;
	} catch {}
}
function ue(e) {
	let t = ye(e), n = be(e);
	for (let e of t) {
		let t = xe(R(e));
		if (t) return Ce(t, n), z(t), t;
	}
	return null;
}
function T(e, t = null) {
	let n = t?.includeSubgraphs !== !1, r = Array.isArray(e?.nodes) ? e.nodes.filter(Boolean) : [];
	if (!n) return r;
	let i = [...r], a = U(e);
	for (let n of r) {
		let r = G(e, n, a);
		r && i.push(...T(r, t));
	}
	return i;
}
function E(e, t, n = null) {
	let r = n?.includeSubgraphs !== !1, i = String(t ?? "");
	if (!i) return null;
	if (!r) return (Array.isArray(e?.nodes) ? e.nodes : []).find((e) => String(e?.id ?? e?.ID ?? "") === i) || null;
	if (i.includes("::")) return Ne(e, i.split("::").filter(Boolean));
	let a = (Array.isArray(e?.nodes) ? e.nodes : []).find((e) => String(e?.id ?? e?.ID ?? "") === i) || null;
	if (a) return a;
	for (let t of Array.isArray(e?.nodes) ? e.nodes : []) {
		let n = G(e, t, U(e)), r = n ? E(n, i) : null;
		if (r) return r;
	}
	return null;
}
function D(e) {
	return te(e);
}
function O(e) {
	return f(e);
}
function de(e) {
	return ee(e);
}
function k(e) {
	let t = fe(e), n = e?.properties && typeof e.properties == "object" ? e.properties : null;
	if (Array.isArray(e?._mjrSubgraphProxyParams)) for (let n of e._mjrSubgraphProxyParams) {
		let e = String(n?.label || n?.key || "").trim();
		!e || t.some(([t]) => String(t) === e) || t.push([e, n?.value]);
	}
	if (n) for (let [e, r] of Object.entries(n)) ge(e) || r == null || typeof r == "object" || t.push([e, r]);
	return t.slice(0, 160);
}
function fe(e) {
	let t = [], n = e?._mjrPromptInputs && typeof e._mjrPromptInputs == "object" ? e._mjrPromptInputs : null, r = e?.inputs && typeof e.inputs == "object" ? e.inputs : null;
	if (n && !Array.isArray(n)) for (let [e, r] of Object.entries(n)) M(r) || t.push([e, r]);
	if (r && !Array.isArray(r)) for (let [e, n] of Object.entries(r)) M(n) || t.some(([t]) => String(t) === String(e)) || t.push([e, n]);
	for (let { label: n, value: r } of A(e)) t.some(([e]) => String(e) === String(n)) || t.push([n, r]);
	return t;
}
function A(e) {
	let t = e?.widgets_values;
	if (pe(t)) return Object.entries(t).map(([e, t], n) => ({
		label: e,
		value: t,
		index: n
	}));
	let n = me(t), r = Array.isArray(e?.widgets) ? e.widgets : [], i = F(N(e)), a = he(e);
	return n.map((t, n) => {
		let o = ve(e, n, t);
		return {
			label: a[n] || r[n]?.name || r[n]?.label || i[n] || o || `param ${n + 1}`,
			value: t,
			index: n
		};
	});
}
function pe(e) {
	return !!(e && typeof e == "object" && !Array.isArray(e) && !j(e));
}
function me(e) {
	if (Array.isArray(e)) return e;
	if (!j(e)) return [];
	let t = Math.max(0, Math.floor(Number(e.length) || 0)), n = [];
	for (let r = 0; r < t; r += 1) n.push(e[r]);
	return n;
}
function j(e) {
	if (!e || typeof e != "object" || Array.isArray(e)) return !1;
	let t = Number(e.length);
	return !(!Number.isFinite(t) || t < 0);
}
function he(e) {
	let t = (Array.isArray(e?.inputs) ? e.inputs : []).filter(I), n = [], r = /* @__PURE__ */ new Set(), i = (e) => {
		let t = `${String(e?.name || "")}\u0000${String(e?.label || "")}\u0000${String(e?.link ?? "")}`;
		r.has(t) || (r.add(t), n.push(e));
	};
	for (let e of t) i(e);
	return n.map((e) => String(e?.label || e?.localized_name || e?.name || e?.widget?.name || e?.widget?.label || "").trim());
}
function M(e) {
	return Array.isArray(e) && e.length === 2 && String(e[0] ?? "").trim() !== "" && Number.isFinite(Number(e[1]));
}
function ge(e) {
	let t = H(String(e ?? "").trim());
	return t ? t === "cnr_id" || t === "ver" || t === "node_name_for_s&r" || t === "subgraph_name" || t === "subgraph_id" || t === "enabletabs" || t === "tabwidth" || t === "tabxoffset" || t === "hassecondtab" || t === "secondtabtext" || t === "secondtaboffset" || t === "secondtabwidth" || t.startsWith("ue_") : !0;
}
function N(e) {
	let t = O(e);
	return t && C.get(t) || null;
}
function P(e) {
	let t = e?.input_order;
	if (t && typeof t == "object") return [...Array.isArray(t.required) ? t.required : [], ...Array.isArray(t.optional) ? t.optional : []].filter(Boolean);
	let n = e?.input;
	return n && typeof n == "object" ? ["required", "optional"].flatMap((e) => n[e] && typeof n[e] == "object" ? Object.keys(n[e]) : []).filter(Boolean) : [];
}
function F(e) {
	let t = e?.input;
	if (!t || typeof t != "object") return P(e);
	let n = [];
	for (let e of ["required", "optional"]) {
		let r = t[e];
		if (!(!r || typeof r != "object")) for (let [e, t] of Object.entries(r)) L(t) && n.push(e);
	}
	return n.length ? n : P(e);
}
function I(e) {
	return !e || typeof e != "object" ? !1 : !!(e.widget === !0 || e.widget && typeof e.widget == "object" || typeof e.widget == "string" && e.widget.trim() || e.widget_index != null || e.widgetIndex != null);
}
function L(e) {
	let t = Array.isArray(e) ? e : [], n = t[0], r = t[1] && typeof t[1] == "object" && !Array.isArray(t[1]) ? t[1] : null;
	return r?.forceInput === !0 || r?.rawLink === !0 ? !1 : r?.widgetType && String(r.widgetType).trim() ? !0 : _e(n);
}
function _e(e) {
	if (Array.isArray(e)) return !0;
	let t = String(e || "").trim().toUpperCase();
	return t ? t === "INT" || t === "FLOAT" || t === "STRING" || t === "BOOLEAN" || t === "BOOL" || t === "COMBO" || t === "ENUM" : !1;
}
function ve(e, t, n) {
	let r = O(e), i = D(e), a = `${r} ${i}`.toLowerCase(), o = String(n ?? "").toLowerCase();
	if (a.includes("ksamplerselect")) return "sampler_name";
	if (a.includes("ksampler")) return [
		"seed",
		"control_after_generate",
		"steps",
		"cfg",
		"sampler_name",
		"scheduler",
		"denoise"
	][t] || null;
	if (a.includes("manualsigmas")) return "sigmas";
	if (a.includes("randomnoise")) return t === 0 ? "noise_seed" : t === 1 ? "control_after_generate" : null;
	if (a.includes("cfgguider")) return "cfg";
	if (a.includes("loraloadermodelonly")) return t === 0 ? "lora_name" : t === 1 ? "strength_model" : null;
	if (a.includes("resizeimagesbylongeredge")) return "longer_edge";
	if (a.includes("vaedecodetiled")) return [
		"tile_size",
		"overlap",
		"temporal_size",
		"temporal_overlap"
	][t] || null;
	if (a.includes("textencoderloader") || a.includes("text encoder loader")) {
		if (t === 0) return "text_encoder";
		if (t === 1) return "ckpt_name";
		if (t === 2) return "device";
	}
	if (/primitive(?:int|float|string|boolean)|constant/.test(a) && t === 0) {
		let e = H(i);
		return e && e !== H(r) ? e : "value";
	}
	if (a.includes("cliptext") || a.includes("prompt")) return t === 0 ? "text" : null;
	if (o.includes(".safetensors") || o.includes(".ckpt")) return "model";
	if (typeof n == "number") {
		if (a.includes("sampler") && t === 0) return "seed";
		if (a.includes("sampler") && t === 1) return "steps";
		if (a.includes("latent") && t === 0) return "width";
		if (a.includes("latent") && t === 1) return "height";
	}
	return null;
}
function ye(e) {
	let t = R(e?.metadata_raw), n = R(e?.metadata);
	return [
		e?.workflow,
		e?.Workflow,
		e?.comfy_workflow,
		e?.workflow_json,
		e?.template,
		e?.Template,
		e?.comfy_template,
		e?.subgraph,
		e?.Subgraph,
		e?.comfy_subgraph,
		t?.workflow,
		t?.Workflow,
		t?.comfy_workflow,
		t?.workflow_json,
		t?.template,
		t?.Template,
		t?.comfy_template,
		t?.subgraph,
		t?.Subgraph,
		t?.comfy_subgraph,
		t?.comfyui,
		t?.ComfyUI,
		n?.workflow,
		n?.Workflow,
		n?.comfy_workflow,
		n?.workflow_json,
		n?.template,
		n?.Template,
		n?.comfy_template,
		n?.subgraph,
		n?.Subgraph,
		n?.comfy_subgraph,
		e?.prompt,
		t?.prompt,
		t?.Prompt,
		n?.prompt,
		n?.Prompt
	].filter((e) => e != null);
}
function be(e) {
	let t = R(e?.metadata_raw), n = R(e?.metadata), r = [
		e?.prompt,
		e?.Prompt,
		t?.prompt,
		t?.Prompt,
		n?.prompt,
		n?.Prompt
	];
	for (let e of r) {
		let t = R(e);
		if (t && typeof t == "object" && !Array.isArray(t)) return t;
	}
	return null;
}
function R(e) {
	if (!e) return null;
	if (typeof e == "object") return e;
	if (typeof e != "string") return null;
	let t = e.trim();
	if (!t || !/^[{[]/.test(t)) return null;
	try {
		return JSON.parse(t);
	} catch {
		return null;
	}
}
function xe(e) {
	if (!e || typeof e != "object") return null;
	if (Array.isArray(e.nodes)) return e;
	let t = Se(e);
	if (t) return t;
	if (e.prompt && typeof e.prompt == "object") return p(e.prompt);
	let n = p(e);
	return n && Array.isArray(n.nodes) ? n : null;
}
function Se(e) {
	for (let t of [
		"workflow",
		"Workflow",
		"template",
		"Template",
		"subgraph",
		"Subgraph",
		"graph",
		"lgraph"
	]) {
		let n = e?.[t];
		if (n && typeof n == "object" && Array.isArray(n.nodes)) return n;
	}
	return null;
}
function z(e, t = /* @__PURE__ */ new WeakSet()) {
	if (!e || typeof e != "object" || t.has(e)) return;
	t.add(e);
	let n = U(e);
	for (let r of Array.isArray(e?.nodes) ? e.nodes : []) {
		Ee(r, n);
		let i = G(e, r, n);
		i && (De(r, i), z(i, t));
	}
}
function Ce(e, t) {
	if (!e || typeof e != "object" || !t || typeof t != "object") return;
	let n = we(t);
	n.length && B(e, n, /* @__PURE__ */ new WeakSet());
}
function B(e, t, n) {
	if (!e || typeof e != "object" || n.has(e)) return;
	n.add(e);
	let r = U(e);
	for (let i of Array.isArray(e?.nodes) ? e.nodes : []) {
		let a = Te(i, t);
		a?.inputs && typeof a.inputs == "object" && !Array.isArray(a.inputs) && (i._mjrPromptInputs = a.inputs);
		let o = G(e, i, r);
		o && B(o, t, n);
	}
}
function we(e) {
	if (!e || typeof e != "object" || Array.isArray(e)) return [];
	let t = [];
	for (let [n, r] of Object.entries(e)) {
		if (!r || typeof r != "object" || Array.isArray(r)) continue;
		let e = String(r.class_type || r.type || "").trim(), i = r.inputs;
		if (!e || !i || typeof i != "object" || Array.isArray(i)) continue;
		let a = String(n).split(":").pop() || String(n);
		t.push({
			id: String(n),
			leafId: a,
			classType: e,
			inputs: i
		});
	}
	return t;
}
function Te(e, t) {
	let n = String(e?.id ?? e?.ID ?? "").trim(), r = V(O(e));
	if (!n || !r) return null;
	let i = t.find((e) => e.id === n && V(e.classType) === r);
	if (i) return i;
	let a = t.filter((e) => e.leafId === n && V(e.classType) === r);
	return a.length === 1 ? a[0] : null;
}
function V(e) {
	return String(e || "").trim().toLowerCase();
}
function Ee(e, t) {
	if (!e || typeof e != "object") return;
	let n = W(e).find((e) => t.has(String(e)));
	if (!n) return;
	let r = t.get(String(n)), i = String(r?.name || r?.title || e?.subgraph?.name || e?.subgraph_instance?.name || "").trim();
	if (!i) return;
	let a = e?.properties && typeof e.properties == "object" ? e.properties : e.properties = {};
	String(a.subgraph_name || "").trim() || (a.subgraph_name = i), String(a.subgraph_id || "").trim() || (a.subgraph_id = n);
}
function De(e, t) {
	let n = Array.isArray(e?.properties?.proxyWidgets) ? e.properties.proxyWidgets : [];
	if (!n.length || !Array.isArray(t?.nodes)) return;
	let r = new Map(t.nodes.filter(Boolean).map((e) => [String(e?.id ?? e?.ID ?? ""), e])), i = Oe(e), a = ke(t), o = [];
	for (let e = 0; e < n.length; e += 1) {
		let t = n[e], s = Array.isArray(t) ? t[0] : t?.nodeId ?? t?.node_id ?? t?.id, c = Array.isArray(t) ? t[1] : t?.widget ?? t?.name ?? t?.widgetName, l = r.get(String(s ?? ""));
		if (!l) continue;
		let u = k(l);
		if (!u.length) continue;
		let d = u.find(([e]) => H(e) === H(c)) || u.find(([e]) => H(e) === "value") || (u.length === 1 ? u[0] : null);
		if (!d) continue;
		let f = `${String(s)}:${Ae(t, c, d[0])}`, p = a.get(f) || a.get(String(s)) || je(l, d[0], c);
		i.size && !i.has(H(p)) || o.push({
			label: p,
			value: d[1],
			innerNodeId: s,
			widgetName: c
		});
	}
	o.length && (e._mjrSubgraphProxyParams = o);
}
function Oe(e) {
	let t = Array.isArray(e?.inputs) ? e.inputs : [], n = /* @__PURE__ */ new Set();
	for (let e of t) {
		if (!I(e)) continue;
		let t = String(e?.label || e?.localized_name || e?.name || "").trim();
		t && n.add(H(t));
	}
	return n;
}
function ke(e) {
	let t = Array.isArray(e?.inputs) ? e.inputs : [], n = Array.isArray(e?.links) ? e.links : [], r = /* @__PURE__ */ new Map();
	for (let e of n) {
		let n = Array.isArray(e) ? e[1] : e?.origin_id ?? e?.originId ?? e?.from;
		if (String(n) !== "-10") continue;
		let i = Number(Array.isArray(e) ? e[2] : e?.origin_slot ?? e?.originSlot ?? e?.fromSlot), a = Array.isArray(e) ? e[3] : e?.target_id ?? e?.targetId ?? e?.to, o = Number(Array.isArray(e) ? e[4] : e?.target_slot ?? e?.targetSlot ?? e?.toSlot), s = Number.isFinite(i) ? t[i] : null, c = String(s?.label || s?.localized_name || s?.name || "").trim();
		!c || a == null || H(c) !== "value" && (r.set(String(a), c), Number.isFinite(o) && r.set(`${String(a)}:${o}`, c));
	}
	return r;
}
function Ae(e, t, n) {
	if (e && typeof e == "object" && !Array.isArray(e)) {
		let t = e.target_slot ?? e.targetSlot ?? e.slot;
		if (Number.isFinite(Number(t))) return Number(t);
	}
	return 0;
}
function je(e, t, n) {
	let r = String(D(e) || "").trim(), i = String(t || n || "").trim();
	return r && i && H(i) !== "value" ? `${r} ${i}` : r || i || "param";
}
function H(e) {
	return String(e ?? "").trim().toLowerCase().replace(/\s+/g, "_");
}
function U(e) {
	let t = [
		...Array.isArray(e?.definitions?.subgraphs) ? e.definitions.subgraphs : [],
		...Array.isArray(e?.subgraphs) ? e.subgraphs : [],
		...Array.isArray(e?.rootGraph?.subgraphs) ? e.rootGraph.subgraphs : []
	], n = /* @__PURE__ */ new Map();
	for (let e of t) for (let t of Me(e)) t != null && n.set(String(t), e);
	return n;
}
function Me(e) {
	let t = e?.properties && typeof e.properties == "object" ? e.properties : {};
	return [
		e?.id,
		e?.name,
		e?.title,
		e?.type,
		e?.uuid,
		e?.workflowId,
		e?.workflow_id,
		t.subgraph_id,
		t.subgraphId
	].filter((e) => e != null && String(e).trim());
}
function W(e) {
	let t = e?.properties && typeof e.properties == "object" ? e.properties : {};
	return [
		e?.type,
		e?.class_type,
		e?.subgraph_id,
		e?.subgraphId,
		t.subgraph_id,
		t.subgraphId,
		t.subgraph_name
	].filter((e) => e != null && String(e).trim());
}
function G(e, t, n = U(e)) {
	let r = [
		t?.subgraph,
		t?._subgraph,
		t?.subgraph?.graph,
		t?.subgraph?.lgraph,
		t?.properties?.subgraph,
		t?.subgraph_instance,
		t?.subgraph_instance?.graph,
		t?.inner_graph,
		t?.subgraph_graph,
		...W(t).map((e) => n.get(String(e)))
	];
	for (let e of r) if (e && typeof e == "object" && Array.isArray(e.nodes)) return e;
	return Array.isArray(t?.nodes) ? { nodes: t.nodes } : null;
}
function Ne(e, t) {
	let n = e, r = null;
	for (let e = 0; e < t.length; e += 1) {
		let i = String(t[e] ?? "").trim();
		if (!i || (r = (Array.isArray(n?.nodes) ? n.nodes : []).find((e) => String(e?.id ?? e?.ID ?? "") === i) || null, !r)) return null;
		if (e >= t.length - 1) break;
		let a = G(n, r, U(n));
		if (!a) return null;
		n = a;
	}
	return r;
}
//#endregion
//#region ui/features/viewer/workflowSidebar/widgetAdapters.ts
function Pe(e, t, n = null) {
	switch (String(e?.type || "").toLowerCase()) {
		case "number":
		case "int":
		case "float": return Ie(e, t, n);
		case "combo": return Le(e, t, n);
		case "text":
		case "string":
		case "customtext": return Re(e, t, n);
		case "toggle":
		case "boolean": return ze(e, t, n);
		default: return Be(e);
	}
}
function K(e, n, i = null) {
	if (!e) return !1;
	let a = String(e.type || "").toLowerCase();
	if (a === "number" || a === "int" || a === "float") {
		let t = Number(n);
		if (Number.isNaN(t)) return !1;
		let r = e.options ?? {}, i = r.min ?? -Infinity, o = r.max ?? Infinity, s = Math.min(o, Math.max(i, t));
		(a === "int" || r.precision === 0 || r.round === 1) && (s = Math.round(s)), e.value = s;
	} else a === "toggle" || a === "boolean" ? e.value = !!n : e.value = n;
	try {
		let n = t(), o = i ?? e?.parent ?? null, s = e.value;
		e.callback?.(e.value, n, o, null, e), (a === "number" || a === "int" || a === "float") && (e.value = s), Fe(e), r(o);
	} catch (e) {
		console.debug?.("[MFV] writeWidgetValue", e);
	}
	return !0;
}
function Fe(e) {
	let t = String(e.value ?? ""), n = e?.inputEl ?? e?.element ?? e?.el ?? e?.cachedDeepestByFrame?.widget?.inputEl ?? e?.cachedDeepestByFrame?.widget?.element ?? e?.cachedDeepestByFrame?.widget?.el ?? null;
	n != null && "value" in n && n.value !== t && (n.value = t);
}
function Ie(e, t, n = null) {
	let r = document.createElement("input");
	r.type = "number", r.className = "mjr-ws-input", r.value = e.value ?? "";
	let i = e.options ?? {}, a = String(e?.type || "").toLowerCase() === "int" || i.precision === 0 || i.round === 1;
	if (i.min != null && (r.min = String(i.min)), i.max != null && (r.max = String(i.max)), a) r.step = "1";
	else {
		let e = i.precision;
		r.step = e == null ? "any" : String(10 ** -e);
	}
	return r.addEventListener("input", () => {
		let i = r.value;
		i === "" || i === "-" || i === "." || i.endsWith(".") || (K(e, i, n), t?.(e.value));
	}), r.addEventListener("change", () => {
		K(e, r.value, n) && (r.value = String(e.value), t?.(e.value));
	}), r;
}
function Le(e, t, n = null) {
	let r = document.createElement("select");
	r.className = "mjr-ws-input";
	let i = e.options?.values ?? [];
	if (typeof i == "function") try {
		i = i() ?? [];
	} catch {
		i = [];
	}
	Array.isArray(i) || (i = []);
	for (let t of i) {
		let n = document.createElement("option"), i = typeof t == "string" ? t : t?.content ?? t?.value ?? t?.text ?? String(t);
		n.value = i, n.textContent = i, i === String(e.value) && (n.selected = !0), r.appendChild(n);
	}
	return r.addEventListener("change", () => {
		K(e, r.value, n) && t?.(e.value);
	}), r;
}
function Re(e, t, n = null) {
	let r = document.createElement("div");
	r.className = "mjr-ws-text-wrapper";
	let i = document.createElement("textarea");
	i.className = "mjr-ws-input mjr-ws-textarea", i.value = e.value ?? "", i.rows = 2;
	let a = () => {
		i.style.height = "auto", i.style.height = i.scrollHeight + "px";
	};
	return i.addEventListener("change", () => {
		K(e, i.value, n) && t?.(e.value);
	}), i.addEventListener("input", () => {
		K(e, i.value, n), t?.(e.value), a();
	}), r.appendChild(i), r._mjrAutoFit = a, i._mjrAutoFit = a, requestAnimationFrame(a), r;
}
function ze(e, t, n = null) {
	let r = document.createElement("label");
	r.className = "mjr-ws-toggle-label";
	let i = document.createElement("input");
	return i.type = "checkbox", i.className = "mjr-ws-checkbox", i.checked = !!e.value, i.addEventListener("change", () => {
		K(e, i.checked, n) && t?.(e.value);
	}), r.appendChild(i), r;
}
function Be(e) {
	let t = document.createElement("input");
	return t.type = "text", t.className = "mjr-ws-input mjr-ws-readonly", t.value = e.value == null ? "" : String(e.value), t.readOnly = !0, t.tabIndex = -1, t;
}
//#endregion
//#region ui/app/settings/MajoorSettingsDialog.ts
var q = "mjr-settings-dialog", J = "mjr-settings-dialog-style", Y = null, Ve = {
	Cards: {
		icon: "pi pi-th-large",
		label: "Cards"
	},
	Badges: {
		icon: "pi pi-tags",
		label: "Badges"
	},
	Grid: {
		icon: "pi pi-table",
		label: "Grid"
	},
	Sidebar: {
		icon: "pi pi-window-maximize",
		label: "Sidebar"
	},
	Viewer: {
		icon: "pi pi-images",
		label: "Viewer"
	},
	"Floating Viewer": {
		icon: "pi pi-window-maximize",
		label: "Floating Viewer"
	},
	"Generated Feed": {
		icon: "pi pi-bolt",
		label: "Generated Feed"
	},
	Search: {
		icon: "pi pi-search",
		label: "Search"
	},
	Scanning: {
		icon: "pi pi-sync",
		label: "Scanning"
	},
	Security: {
		icon: "pi pi-shield",
		label: "Security"
	},
	Advanced: {
		icon: "pi pi-cog",
		label: "Advanced"
	},
	Remote: {
		icon: "pi pi-cloud",
		label: "Remote"
	},
	General: {
		icon: "pi pi-sliders-h",
		label: "General"
	}
};
function He() {
	if (typeof document > "u" || document.getElementById(J)) return;
	let e = document.createElement("style");
	e.id = J, e.textContent = `
#${q} {
    position: fixed;
    inset: 0;
    z-index: 10080;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.48);
    color: var(--fg-color, #ddd);
    font: 13px/1.4 system-ui, -apple-system, Segoe UI, sans-serif;
}
#${q}[hidden] { display: none; }
#${q} .mjr-settings-panel {
    width: min(860px, calc(100vw - 32px));
    max-height: min(780px, calc(100vh - 32px));
    display: grid;
    grid-template-rows: auto auto 1fr;
    background: var(--comfy-menu-bg, #252525);
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 8px;
    box-shadow: 0 18px 60px rgba(0, 0, 0, 0.45);
    overflow: hidden;
}
#${q} .mjr-settings-head,
#${q} .mjr-settings-tools {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.10);
}
#${q} .mjr-settings-title {
    font-weight: 700;
    font-size: 14px;
    flex: 1;
}
#${q} .mjr-settings-close,
#${q} .mjr-settings-reset {
    border: 1px solid rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.06);
    color: inherit;
    border-radius: 6px;
    min-height: 30px;
    padding: 0 10px;
    cursor: pointer;
}
#${q} .mjr-settings-close {
    width: 30px;
    padding: 0;
}
#${q} .mjr-settings-search {
    flex: 1;
    min-width: 160px;
    height: 30px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    background: rgba(0, 0, 0, 0.22);
    color: inherit;
    padding: 0 10px;
}
#${q} .mjr-settings-body {
    overflow: auto;
    padding: 12px;
}
#${q} .mjr-settings-stack {
    display: grid;
    gap: 10px;
}
#${q} .mjr-settings-group {
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.035);
    overflow: hidden;
}
#${q} .mjr-settings-group summary {
    min-height: 42px;
    display: grid;
    grid-template-columns: 28px 1fr auto 18px;
    align-items: center;
    gap: 10px;
    padding: 8px 11px;
    cursor: pointer;
    user-select: none;
    background: rgba(255, 255, 255, 0.045);
}
#${q} .mjr-settings-group summary::-webkit-details-marker {
    display: none;
}
#${q} .mjr-settings-group-icon {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.07);
    color: var(--input-text, #fff);
}
#${q} .mjr-settings-group-title {
    color: var(--input-text, #fff);
    font-weight: 700;
}
#${q} .mjr-settings-group-meta {
    opacity: 0.68;
    font-size: 12px;
}
#${q} .mjr-settings-chevron {
    transition: transform 0.16s ease;
}
#${q} details[open] > summary .mjr-settings-chevron {
    transform: rotate(90deg);
}
#${q} .mjr-settings-group-body {
    padding: 4px 11px 11px;
}
#${q} .mjr-settings-subgroup {
    margin-top: 8px;
}
#${q} .mjr-settings-subgroup-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 10px 0 2px;
    color: var(--input-text, #fff);
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    opacity: 0.86;
}
#${q} .mjr-settings-subgroup-title::after {
    content: "";
    height: 1px;
    flex: 1;
    background: rgba(255, 255, 255, 0.10);
}
#${q} .mjr-settings-row {
    display: grid;
    grid-template-columns: minmax(220px, 1fr) minmax(180px, 280px);
    align-items: center;
    gap: 16px;
    padding: 9px 0;
    border-top: 1px solid rgba(255, 255, 255, 0.07);
}
#${q} .mjr-settings-name {
    font-weight: 600;
    color: var(--p-primary-color, var(--comfy-accent, #8ab4f8));
}
#${q} .mjr-settings-tip {
    margin-top: 2px;
    opacity: 0.72;
    font-size: 12px;
}
#${q} input,
#${q} select {
    min-height: 30px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    background: rgba(0, 0, 0, 0.22);
    color: inherit;
    padding: 0 8px;
}
#${q} input[type="checkbox"] {
    justify-self: end;
    width: 18px;
    min-height: 18px;
}
#${q} input[type="color"] {
    padding: 2px;
    width: 56px;
    justify-self: end;
}
@media (max-width: 620px) {
    #${q} .mjr-settings-row {
        grid-template-columns: 1fr;
        gap: 8px;
    }
}
`, document.head.appendChild(e);
}
function Ue(e) {
	return String(e || "").replace(/^\s*Majoor:\s*/i, "").trim();
}
function We(e) {
	let t = Array.isArray(e?.category) ? e.category : [];
	return String(t[1] || "General").trim() || "General";
}
function X(e) {
	return (Array.isArray(e?.category) ? e.category : []).slice(2).filter(Boolean).join(" / ") || "General";
}
function Ge(e) {
	return Ve[e] || {
		icon: "pi pi-sliders-h",
		label: e || "General"
	};
}
function Ke(e, t) {
	return t ? [
		e?.id,
		e?.name,
		e?.tooltip,
		...Array.isArray(e?.category) ? e.category : []
	].join(" ").toLowerCase().includes(t) : !0;
}
function Z(e, t) {
	if (typeof e?.onChange == "function") {
		e.defaultValue = t;
		try {
			let n = e.onChange(t);
			n && typeof n.catch == "function" && n.catch((e) => {
				console.error?.("[Majoor] settings change failed", e);
			});
		} catch (e) {
			console.error?.("[Majoor] settings change failed", e);
		}
	}
}
function qe(e) {
	let t = String(e?.type || "text").toLowerCase(), n = e?.defaultValue, r;
	if (t === "boolean") return r = document.createElement("input"), r.type = "checkbox", r.checked = !!n, r.addEventListener("change", () => Z(e, r.checked)), r;
	if (t === "combo") {
		r = document.createElement("select");
		for (let t of e?.options || []) {
			let e = document.createElement("option"), n = t && typeof t == "object" ? t.value ?? t.text ?? t.label : t;
			e.value = String(n ?? ""), e.textContent = String(t && typeof t == "object" ? t.text ?? t.label ?? t.value : t), r.appendChild(e);
		}
		return r.value = String(n ?? ""), r.addEventListener("change", () => Z(e, r.value)), r;
	}
	if (r = document.createElement("input"), r.type = t === "color" ? "color" : t === "number" ? "number" : t === "password" ? "password" : "text", e?.attrs && typeof e.attrs == "object") for (let [t, n] of Object.entries(e.attrs)) n != null && r.setAttribute(t, String(n));
	r.value = String(n ?? "");
	let i = t === "color" ? "input" : "change";
	return r.addEventListener(i, () => {
		Z(e, t === "number" ? Number(r.value) : r.value);
	}), r;
}
function Je(e, t, n = "") {
	e.replaceChildren();
	let r = document.createElement("div");
	r.className = "mjr-settings-stack", e.appendChild(r);
	let i = /* @__PURE__ */ new Map();
	for (let e of t || []) {
		if (!Ke(e, n)) continue;
		let t = We(e), r = X(e);
		i.has(t) || i.set(t, /* @__PURE__ */ new Map());
		let a = i.get(t);
		a.has(r) || a.set(r, []), a.get(r).push(e);
	}
	for (let [e, t] of i.entries()) {
		let i = Array.from(t.values()).flat(), a = Ge(e), o = document.createElement("details");
		o.className = "mjr-settings-group", o.open = !!n;
		let s = document.createElement("summary"), c = document.createElement("span");
		c.className = "mjr-settings-group-icon";
		let l = document.createElement("i");
		l.className = a.icon, l.setAttribute("aria-hidden", "true"), c.appendChild(l);
		let u = document.createElement("span");
		u.className = "mjr-settings-group-title", u.textContent = a.label || e;
		let d = document.createElement("span");
		d.className = "mjr-settings-group-meta", d.textContent = `${i.length} setting${i.length === 1 ? "" : "s"}`;
		let f = document.createElement("i");
		f.className = "pi pi-chevron-right mjr-settings-chevron", f.setAttribute("aria-hidden", "true"), s.append(c, u, d, f), o.appendChild(s);
		let p = document.createElement("div");
		p.className = "mjr-settings-group-body";
		for (let [e, n] of t.entries()) {
			let t = document.createElement("section");
			t.className = "mjr-settings-subgroup";
			let r = document.createElement("div");
			r.className = "mjr-settings-subgroup-title", r.textContent = e, t.appendChild(r);
			for (let e of n) {
				let n = document.createElement("label");
				n.className = "mjr-settings-row";
				let r = document.createElement("div"), i = document.createElement("div");
				if (i.className = "mjr-settings-name", i.textContent = Ue(e?.name) || e?.id || "Setting", r.appendChild(i), e?.tooltip) {
					let t = document.createElement("div");
					t.className = "mjr-settings-tip", t.textContent = String(e.tooltip), r.appendChild(t);
				}
				n.appendChild(r), n.appendChild(qe(e)), t.appendChild(n);
			}
			p.appendChild(t);
		}
		o.appendChild(p), r.appendChild(o);
	}
}
function Ye() {
	He();
	let e = document.createElement("div");
	e.id = q, e.hidden = !0, e.addEventListener("click", (t) => {
		t.target === e && Q();
	});
	let t = document.createElement("div");
	t.className = "mjr-settings-panel", t.setAttribute("role", "dialog"), t.setAttribute("aria-modal", "true");
	let n = document.createElement("div");
	n.className = "mjr-settings-head";
	let r = document.createElement("div");
	r.className = "mjr-settings-title", r.textContent = c("settings.majoor.title", "Majoor Assets Manager Settings");
	let i = document.createElement("button");
	i.type = "button", i.className = "mjr-settings-close", i.textContent = "X", i.setAttribute("aria-label", c("btn.close", "Close")), i.addEventListener("click", Q), n.append(r, i);
	let a = document.createElement("div");
	a.className = "mjr-settings-tools";
	let o = document.createElement("input");
	o.type = "search", o.className = "mjr-settings-search", o.placeholder = c("placeholder.searchSettings", "Search settings"), a.appendChild(o);
	let s = document.createElement("div");
	return s.className = "mjr-settings-body", t.append(n, a, s), e.appendChild(t), document.body.appendChild(e), {
		body: s,
		root: e,
		search: o
	};
}
function Q() {
	Y?.root && (Y.root.hidden = !0);
}
function Xe(e = s()) {
	if (typeof document > "u") return !1;
	Y?.root?.isConnected || (Y = Ye());
	let t = d(e), n = () => Je(Y.body, t, String(Y.search.value || "").trim().toLowerCase());
	return Y.search.oninput = n, Y.search.value = "", n(), Y.root.hidden = !1, setTimeout(() => Y?.search?.focus?.(), 0), !0;
}
//#endregion
//#region ui/app/openMajoorSettings.ts
function $(e = s()) {
	return Xe(e);
}
try {
	typeof window < "u" && (window.MajoorAssetsManager = window.MajoorAssetsManager || {}, window.MajoorAssetsManager.openSettings = $);
} catch (e) {
	console.debug?.(e);
}
//#endregion
export { y as _, E as a, O as c, T as d, ue as f, b as g, S as h, le as i, de as l, se as m, Pe as n, D as o, ce as p, K as r, k as s, $ as t, A as u };
