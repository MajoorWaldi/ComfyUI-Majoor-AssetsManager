import { Vn as e, bn as t, fn as n, gn as r, in as i, kn as a, un as o, xn as s } from "./config-C9a-wT5M.js";
import { a as c, n as l } from "./graphTraversal-DTdQWkn5.js";
import { C as u, S as d, _ as f, b as p, f as m, g as ee, v as h, w as g, x as te } from "./generationSectionState-BQ1Yzk6L.js";
import { _, a as ne, c as re, d as ie, f as ae, g as v, h as oe, i as se, l as ce, m as le, n as ue, o as de, p as fe, r as y, s as pe, t as b, u as me } from "./mjr-primevue-C07IsEdU.js";
import { t as he } from "./mjr-vue-vendor-CEDOnn2t.js";
// ui/features/viewer/floatingViewerProgress.ts
var ge = "progress-update", _e = "__MJR_MFV_PROGRESS_SERVICE__";
function ve() {
	return typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : {};
}
function ye(e, t) {
	if (typeof CustomEvent == "function") return new CustomEvent(e, { detail: t });
	let n = typeof Event == "function" ? new Event(e) : { type: e };
	return n.detail = t, n;
}
var be = class {
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
			let t = this._getApp?.(), r = l(c(t), e);
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
}, xe = class extends EventTarget {
	constructor({ getApi: n = (e) => t(e), getApp: r = () => s(), waitForApi: i = (t) => e(t) } = {}) {
		super(), this._getApi = n, this._getApp = r, this._waitForApi = i, this.promptsMap = /* @__PURE__ */ new Map(), this.currentExecution = null, this.lastQueueRemaining = 0, this._api = null, this._listenerEntries = [], this._initPromise = null, this._hydrations = /* @__PURE__ */ new Map();
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
		return n || (n = new be(t, this._getApp), this.promptsMap.set(t, n)), n;
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
		e && typeof e.addEventListener == "function" && this._api !== e && (this.dispose({ keepState: !0 }), this._api = e, this._attachApiListeners(e));
	}
	async _hydratePrompt(e, t) {
		let n = String(t?.id || "").trim();
		if (!n || n === "unknown" || t.promptApi || !e) return;
		if (this._hydrations.has(n)) return this._hydrations.get(n);
		let r = (async () => {
			let r = await this._findPromptInJob(e, n) || await this._findPromptInQueue(e, n) || await this._findPromptInHistory(e, n);
			if (r && !t.promptApi) {
				t.setPrompt({ output: r });
				let e = t.currentlyExecuting;
				e?.nodeId && (e.nodeLabel = t.getNodeLabel(e.nodeId) || e.nodeLabel), this.promptsMap.get(n) === t && this.dispatchProgressUpdate();
			}
		})().catch((e) => console.debug?.(e)).finally(() => this._hydrations.delete(n));
		return this._hydrations.set(n, r), r;
	}
	async _findPromptInJob(e, t) {
		if (typeof e.getJobDetail != "function") return null;
		try {
			let n = (await e.getJobDetail(t))?.workflow?.prompt;
			return n && typeof n == "object" && !Array.isArray(n) ? n : null;
		} catch (e) {
			return console.debug?.(e), null;
		}
	}
	async _fetchJson(e, t) {
		if (typeof e.fetchApi != "function") return null;
		let n = await e.fetchApi(t, { cache: "no-store" });
		return !n?.ok || typeof n.json != "function" ? null : n.json();
	}
	async _findPromptInQueue(e, t) {
		let n = await this._fetchJson(e, "/queue"), r = [...Array.isArray(n?.queue_running) ? n.queue_running : [], ...Array.isArray(n?.queue_pending) ? n.queue_pending : []];
		for (let e of r) if (Array.isArray(e) && String(e[1] || "") === t) return e[2] && typeof e[2] == "object" ? e[2] : null;
		return null;
	}
	async _findPromptInHistory(e, t) {
		let n = (await this._fetchJson(e, `/history/${encodeURIComponent(t)}`))?.[t]?.prompt;
		return Array.isArray(n) && n[2] && typeof n[2] == "object" ? n[2] : null;
	}
	_attachApiListeners(e) {
		this._attachListener(e, "status", (e) => {
			e?.detail?.exec_info && (this.lastQueueRemaining = Number(e.detail.exec_info.queue_remaining) || 0, this.dispatchProgressUpdate());
		}), this._attachListener(e, "execution_start", (t) => {
			let n = String(t?.detail?.prompt_id || t?.detail?.promptId || "").trim();
			n && (this.currentExecution = this.getOrMakePrompt(n), this.dispatchProgressUpdate(), this._hydratePrompt(e, this.currentExecution));
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
		this.dispatchEvent(ye(ge, this.getSnapshot()));
	}
	dispose({ keepState: e = !1 } = {}) {
		for (let { api: e, type: t, handler: n } of this._listenerEntries.splice(0)) try {
			e?.removeEventListener?.(t, n);
		} catch (e) {
			console.debug?.(e);
		}
		this._api = null, e || (this.promptsMap.clear(), this.currentExecution = null, this.lastQueueRemaining = 0);
	}
}, x = ve(), S = x[_e] || new xe();
x[_e] || (x[_e] = S);
function Se(e = {}) {
	return S.ensureInitialized(e);
}
function Ce(e) {
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
function C(e) {
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
function w(e, t) {
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
	if (e._progressCurrentNodeId = r || null, e._progressEl && (e._progressNodesEl.style.width = i, e._progressStepsEl.style.width = a, e._progressTextEl.textContent = Ce(t), e._progressEl.classList.toggle("is-error", o), e._progressEl.classList.toggle("is-clickable", !!r), e._progressEl.title = r ? "Execution progress - click to center active node" : "Execution progress"), e._mediaProgressEl) {
		let n = C(t);
		e._mediaProgressTextEl.textContent = n, e._mediaProgressEl.title = n || "", e._mediaProgressEl.classList.toggle("is-error", o), e._mediaProgressEl.classList.toggle("is-visible", !!n);
	}
}
function we(e, t) {
	let n = String(t || "").trim();
	if (!n) return !1;
	try {
		return o(n, s());
	} catch (e) {
		return console.debug?.(e), !1;
	}
}
function Te(e) {
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
		t.button === 0 && we(e, e._progressCurrentNodeId) && (t.preventDefault(), t.stopPropagation());
	}), e._progressEl = t, e._progressNodesEl = n, e._progressStepsEl = r, e._progressTextEl = a, e._progressUpdateHandler && S.removeEventListener(ge, e._progressUpdateHandler), e._progressUpdateHandler = (t) => {
		w(e, t?.detail || S.getSnapshot());
	}, S.addEventListener(ge, e._progressUpdateHandler), Se({ timeoutMs: 4e3 }).catch((e) => {
		console.debug?.(e);
	}), w(e, S.getSnapshot()), t;
}
function T(e) {
	let t = document.createElement("div");
	t.className = "mjr-mfv-media-progress", t.setAttribute("aria-hidden", "true");
	let n = document.createElement("span");
	return n.className = "mjr-mfv-media-progress-text", t.appendChild(n), e._mediaProgressEl = t, e._mediaProgressTextEl = n, w(e, S.getSnapshot()), t;
}
function E(e) {
	if (e?._progressUpdateHandler) try {
		S.removeEventListener(ge, e._progressUpdateHandler);
	} catch (e) {
		console.debug?.(e);
	}
	e._progressUpdateHandler = null, e._progressCurrentNodeId = null, e._progressEl = null, e._progressNodesEl = null, e._progressStepsEl = null, e._progressTextEl = null, e._mediaProgressEl = null, e._mediaProgressTextEl = null;
}
// ui/utils/dom.ts
function Ee(e, t) {
	if (!t) return null;
	try {
		if (!e) return null;
		if (e instanceof Element && typeof e.closest == "function") return e.closest(t);
		let n = e?.parentElement;
		if (n && typeof n.closest == "function") return n.closest(t);
	} catch (e) {
		console.debug?.(e);
	}
	return null;
}
function De(e) {
	let t = String(e ?? "");
	try {
		if (typeof CSS?.escape == "function") return CSS.escape(t);
	} catch (e) {
		console.debug?.(e);
	}
	return t.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, "\\$1");
}
async function Oe(e) {
	try {
		return navigator?.clipboard?.writeText ? (await navigator.clipboard.writeText(String(e ?? "")), !0) : !1;
	} catch {
		return !1;
	}
}
// ui/features/viewer/workflowGraphMap/workflowGraphMapData.ts
var D = /* @__PURE__ */ new Map(), O = null;
async function ke(e) {
	let t = Array.from(new Set(je(e).map((e) => j(e)).filter(Boolean)));
	if (t.length && t.filter((e) => !D.has(e)).length) try {
		O ||= n("/object_info").then((e) => e?.ok ? e.json() : null).then((e) => {
			if (e && typeof e == "object") for (let [t, n] of Object.entries(e)) D.set(String(t), n);
			return e;
		}).catch(() => null), await O;
	} catch {}
}
function Ae(e) {
	let t = z(e), n = He(e);
	for (let e of t) {
		let t = B(Ue(e));
		if (t) return Ge(t, n), V(t), t;
	}
	return null;
}
function je(e, t = null) {
	let n = t?.includeSubgraphs !== !1, r = Array.isArray(e?.nodes) ? e.nodes.filter(Boolean) : [];
	if (!n) return r;
	let i = [...r], a = K(e);
	for (let n of r) {
		let r = J(e, n, a);
		r && i.push(...je(r, t));
	}
	return i;
}
function k(e, t, n = null) {
	let r = n?.includeSubgraphs !== !1, i = String(t ?? "");
	if (!i) return null;
	if (!r) return (Array.isArray(e?.nodes) ? e.nodes : []).find((e) => String(e?.id ?? e?.ID ?? "") === i) || null;
	if (i.includes("::")) return et(e, i.split("::").filter(Boolean));
	let a = (Array.isArray(e?.nodes) ? e.nodes : []).find((e) => String(e?.id ?? e?.ID ?? "") === i) || null;
	if (a) return a;
	for (let t of Array.isArray(e?.nodes) ? e.nodes : []) {
		let n = J(e, t, K(e)), r = n ? k(n, i) : null;
		if (r) return r;
	}
	return null;
}
function A(e) {
	return te(e);
}
function j(e) {
	return d(e);
}
function M(e) {
	return u(e);
}
function N(e) {
	let t = Me(e), n = e?.properties && typeof e.properties == "object" ? e.properties : null;
	if (Array.isArray(e?._mjrSubgraphProxyParams)) for (let n of e._mjrSubgraphProxyParams) {
		let e = String(n?.label || n?.key || "").trim();
		e && !t.some(([t]) => String(t) === e) && t.push([e, n?.value]);
	}
	if (n) for (let [e, r] of Object.entries(n)) Re(e) || r != null && typeof r != "object" && t.push([e, r]);
	return t.slice(0, 160);
}
function Me(e) {
	let t = [], n = e?._mjrPromptInputs && typeof e._mjrPromptInputs == "object" ? e._mjrPromptInputs : null, r = e?.inputs && typeof e.inputs == "object" ? e.inputs : null;
	if (n && !Array.isArray(n)) for (let [e, r] of Object.entries(n)) Le(r) || t.push([e, r]);
	if (r && !Array.isArray(r)) for (let [e, n] of Object.entries(r)) Le(n) || t.some(([t]) => String(t) === String(e)) || t.push([e, n]);
	for (let { label: n, value: r } of Ne(e)) t.some(([e]) => String(e) === String(n)) || t.push([n, r]);
	return t;
}
function Ne(e) {
	let t = e?.widgets_values;
	if (P(t)) return Object.entries(t).map(([e, t], n) => ({
		label: e,
		value: t,
		index: n
	}));
	let n = Pe(t), r = Array.isArray(e?.widgets) ? e.widgets : [], i = Be(ze(e)), a = Ie(e);
	return n.map((t, n) => {
		let o = R(e, n, t);
		return {
			label: a[n] || r[n]?.name || r[n]?.label || i[n] || o || `param ${n + 1}`,
			value: t,
			index: n
		};
	});
}
function P(e) {
	return !(!e || typeof e != "object" || Array.isArray(e) || Fe(e));
}
function Pe(e) {
	if (Array.isArray(e)) return e;
	if (!Fe(e)) return [];
	let t = Math.max(0, Math.floor(Number(e.length) || 0)), n = [];
	for (let r = 0; r < t; r += 1) n.push(e[r]);
	return n;
}
function Fe(e) {
	if (!e || typeof e != "object" || Array.isArray(e)) return !1;
	let t = Number(e.length);
	return !(!Number.isFinite(t) || t < 0);
}
function Ie(e) {
	let t = (Array.isArray(e?.inputs) ? e.inputs : []).filter(I), n = [], r = /* @__PURE__ */ new Set(), i = (e) => {
		let t = `${String(e?.name || "")}\u0000${String(e?.label || "")}\u0000${String(e?.link ?? "")}`;
		r.has(t) || (r.add(t), n.push(e));
	};
	for (let e of t) i(e);
	return n.map((e) => String(e?.label || e?.localized_name || e?.name || e?.widget?.name || e?.widget?.label || "").trim());
}
function Le(e) {
	return Array.isArray(e) && e.length === 2 && String(e[0] ?? "").trim() !== "" && Number.isFinite(Number(e[1]));
}
function Re(e) {
	let t = G(String(e ?? "").trim());
	return !t || t === "cnr_id" || t === "ver" || t === "node_name_for_s&r" || t === "subgraph_name" || t === "subgraph_id" || t === "enabletabs" || t === "tabwidth" || t === "tabxoffset" || t === "hassecondtab" || t === "secondtabtext" || t === "secondtaboffset" || t === "secondtabwidth" || t.startsWith("ue_");
}
function ze(e) {
	let t = j(e);
	return t && D.get(t) || null;
}
function F(e) {
	let t = e?.input_order;
	if (t && typeof t == "object") return [...Array.isArray(t.required) ? t.required : [], ...Array.isArray(t.optional) ? t.optional : []].filter(Boolean);
	let n = e?.input;
	return n && typeof n == "object" ? ["required", "optional"].flatMap((e) => n[e] && typeof n[e] == "object" ? Object.keys(n[e]) : []).filter(Boolean) : [];
}
function Be(e) {
	let t = e?.input;
	if (!t || typeof t != "object") return F(e);
	let n = [];
	for (let e of ["required", "optional"]) {
		let r = t[e];
		if (r && typeof r == "object") for (let [e, t] of Object.entries(r)) L(t) && n.push(e);
	}
	return n.length ? n : F(e);
}
function I(e) {
	return !e || typeof e != "object" ? !1 : !!(e.widget === !0 || e.widget && typeof e.widget == "object" || typeof e.widget == "string" && e.widget.trim() || e.widget_index != null || e.widgetIndex != null);
}
function L(e) {
	let t = Array.isArray(e) ? e : [], n = t[0], r = t[1] && typeof t[1] == "object" && !Array.isArray(t[1]) ? t[1] : null;
	return r?.forceInput === !0 || r?.rawLink === !0 ? !1 : r?.widgetType && String(r.widgetType).trim() ? !0 : Ve(n);
}
function Ve(e) {
	if (Array.isArray(e)) return !0;
	let t = String(e || "").trim().toUpperCase();
	return t ? t === "INT" || t === "FLOAT" || t === "STRING" || t === "BOOLEAN" || t === "BOOL" || t === "COMBO" || t === "ENUM" : !1;
}
function R(e, t, n) {
	let r = j(e), i = A(e), a = `${r} ${i}`.toLowerCase(), o = String(n ?? "").toLowerCase();
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
		let e = G(i);
		return e && e !== G(r) ? e : "value";
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
function z(e) {
	let t = Ue(e?.metadata_raw), n = Ue(e?.metadata);
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
function He(e) {
	let t = Ue(e?.metadata_raw), n = Ue(e?.metadata), r = [
		e?.prompt,
		e?.Prompt,
		t?.prompt,
		t?.Prompt,
		n?.prompt,
		n?.Prompt
	];
	for (let e of r) {
		let t = Ue(e);
		if (t && typeof t == "object" && !Array.isArray(t)) return t;
	}
	return null;
}
function Ue(e) {
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
function B(e) {
	if (!e || typeof e != "object") return null;
	if (Array.isArray(e.nodes)) return e;
	let t = We(e);
	if (t) return t;
	if (e.prompt && typeof e.prompt == "object") return p(e.prompt);
	let n = p(e);
	return n && Array.isArray(n.nodes) ? n : null;
}
function We(e) {
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
function V(e, t = /* @__PURE__ */ new WeakSet()) {
	if (!e || typeof e != "object" || t.has(e)) return;
	t.add(e);
	let n = K(e);
	for (let r of Array.isArray(e?.nodes) ? e.nodes : []) {
		Je(r, n);
		let i = J(e, r, n);
		i && (Ye(r, i), V(i, t));
	}
}
function Ge(e, t) {
	if (!e || typeof e != "object" || !t || typeof t != "object") return;
	let n = U(t);
	n.length && H(e, n, /* @__PURE__ */ new WeakSet());
}
function H(e, t, n) {
	if (!e || typeof e != "object" || n.has(e)) return;
	n.add(e);
	let r = K(e);
	for (let i of Array.isArray(e?.nodes) ? e.nodes : []) {
		let a = Ke(i, t);
		a?.inputs && typeof a.inputs == "object" && !Array.isArray(a.inputs) && (i._mjrPromptInputs = a.inputs);
		let o = J(e, i, r);
		o && H(o, t, n);
	}
}
function U(e) {
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
function Ke(e, t) {
	let n = String(e?.id ?? e?.ID ?? "").trim(), r = qe(j(e));
	if (!n || !r) return null;
	let i = t.find((e) => e.id === n && qe(e.classType) === r);
	if (i) return i;
	let a = t.filter((e) => e.leafId === n && qe(e.classType) === r);
	return a.length === 1 ? a[0] : null;
}
function qe(e) {
	return String(e || "").trim().toLowerCase();
}
function Je(e, t) {
	if (!e || typeof e != "object") return;
	let n = q(e).find((e) => t.has(String(e)));
	if (!n) return;
	let r = t.get(String(n)), i = String(r?.name || r?.title || e?.subgraph?.name || e?.subgraph_instance?.name || "").trim();
	if (!i) return;
	let a = e?.properties && typeof e.properties == "object" ? e.properties : e.properties = {};
	String(a.subgraph_name || "").trim() || (a.subgraph_name = i), String(a.subgraph_id || "").trim() || (a.subgraph_id = n);
}
function Ye(e, t) {
	let n = Array.isArray(e?.properties?.proxyWidgets) ? e.properties.proxyWidgets : [];
	if (!n.length || !Array.isArray(t?.nodes)) return;
	let r = new Map(t.nodes.filter(Boolean).map((e) => [String(e?.id ?? e?.ID ?? ""), e])), i = Xe(e), a = Ze(t), o = [];
	for (let e = 0; e < n.length; e += 1) {
		let t = n[e], s = Array.isArray(t) ? t[0] : t?.nodeId ?? t?.node_id ?? t?.id, c = Array.isArray(t) ? t[1] : t?.widget ?? t?.name ?? t?.widgetName, l = r.get(String(s ?? ""));
		if (!l) continue;
		let u = N(l);
		if (!u.length) continue;
		let d = u.find(([e]) => G(e) === G(c)) || u.find(([e]) => G(e) === "value") || (u.length === 1 ? u[0] : null);
		if (!d) continue;
		let f = `${String(s)}:${W(t, c, d[0])}`, p = a.get(f) || a.get(String(s)) || Qe(l, d[0], c);
		(!i.size || i.has(G(p))) && o.push({
			label: p,
			value: d[1],
			innerNodeId: s,
			widgetName: c
		});
	}
	o.length && (e._mjrSubgraphProxyParams = o);
}
function Xe(e) {
	let t = Array.isArray(e?.inputs) ? e.inputs : [], n = /* @__PURE__ */ new Set();
	for (let e of t) {
		if (!I(e)) continue;
		let t = String(e?.label || e?.localized_name || e?.name || "").trim();
		t && n.add(G(t));
	}
	return n;
}
function Ze(e) {
	let t = Array.isArray(e?.inputs) ? e.inputs : [], n = Array.isArray(e?.links) ? e.links : [], r = /* @__PURE__ */ new Map();
	for (let e of n) {
		let n = Array.isArray(e) ? e[1] : e?.origin_id ?? e?.originId ?? e?.from;
		if (String(n) !== "-10") continue;
		let i = Number(Array.isArray(e) ? e[2] : e?.origin_slot ?? e?.originSlot ?? e?.fromSlot), a = Array.isArray(e) ? e[3] : e?.target_id ?? e?.targetId ?? e?.to, o = Number(Array.isArray(e) ? e[4] : e?.target_slot ?? e?.targetSlot ?? e?.toSlot), s = Number.isFinite(i) ? t[i] : null, c = String(s?.label || s?.localized_name || s?.name || "").trim();
		c && a != null && G(c) !== "value" && (r.set(String(a), c), Number.isFinite(o) && r.set(`${String(a)}:${o}`, c));
	}
	return r;
}
function W(e, t, n) {
	if (e && typeof e == "object" && !Array.isArray(e)) {
		let t = e.target_slot ?? e.targetSlot ?? e.slot;
		if (Number.isFinite(Number(t))) return Number(t);
	}
	return 0;
}
function Qe(e, t, n) {
	let r = String(A(e) || "").trim(), i = String(t || n || "").trim();
	return r && i && G(i) !== "value" ? `${r} ${i}` : r || i || "param";
}
function G(e) {
	return String(e ?? "").trim().toLowerCase().replace(/\s+/g, "_");
}
function K(e) {
	let t = [
		...Array.isArray(e?.definitions?.subgraphs) ? e.definitions.subgraphs : [],
		...Array.isArray(e?.subgraphs) ? e.subgraphs : [],
		...Array.isArray(e?.rootGraph?.subgraphs) ? e.rootGraph.subgraphs : []
	], n = /* @__PURE__ */ new Map();
	for (let e of t) for (let t of $e(e)) t != null && n.set(String(t), e);
	return n;
}
function $e(e) {
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
function q(e) {
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
function J(e, t, n = K(e)) {
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
		...q(t).map((e) => n.get(String(e)))
	];
	for (let e of r) if (e && typeof e == "object" && Array.isArray(e.nodes)) return e;
	return Array.isArray(t?.nodes) ? { nodes: t.nodes } : null;
}
function et(e, t) {
	let n = e, r = null;
	for (let e = 0; e < t.length; e += 1) {
		let i = String(t[e] ?? "").trim();
		if (!i || (r = (Array.isArray(n?.nodes) ? n.nodes : []).find((e) => String(e?.id ?? e?.ID ?? "") === i) || null, !r)) return null;
		if (e >= t.length - 1) break;
		let a = J(n, r, K(n));
		if (!a) return null;
		n = a;
	}
	return r;
}
// ui/vue/majoorPrimeVue.ts
var tt = {
	Button: ae,
	Checkbox: ie,
	InputText: me,
	Textarea: ce,
	Select: pe,
	ToggleButton: de,
	Badge: fe,
	Tag: ne,
	Dialog: se,
	Menu: y,
	Listbox: ue,
	Tree: b,
	VirtualScroller: re
};
function Y(e) {
	return e.use(v, {
		ripple: !1,
		unstyled: !0,
		zIndex: { overlay: 10100 }
	}), e.use(oe), e.use(le), Object.entries(tt).forEach(([t, n]) => {
		e.component(`M${t}`, n);
	}), e;
}
// ui/vue/createVueApp.ts
function nt(e, t = void 0) {
	let n = he(), r = _(e, t);
	return r.use(n), Y(r), {
		app: r,
		pinia: n
	};
}
var rt = /* @__PURE__ */ new Map();
function it(e, t, n) {
	try {
		window.dispatchEvent(new CustomEvent("mjr:keepalive-attached", { detail: {
			mountKey: String(e || "_mjrVueApp"),
			host: t || null,
			container: n || null
		} }));
	} catch {}
}
function at(e) {
	let t = document.createElement("div");
	return t.dataset.mjrKeepAliveHost = String(e || "_mjrVueApp"), t.style.height = "100%", t.style.width = "100%", t.style.minHeight = "0", t.style.display = "flex", t.style.flexDirection = "column", t.style.overflow = "hidden", t;
}
function ot(e, t) {
	e && t && (e.style.height = "100%", e.style.minHeight = "0", e.style.display = "flex", e.style.flexDirection = "column", e.style.overflow = "hidden", (e.firstChild !== t || e.childNodes.length !== 1) && (e.replaceChildren(t), it(t?.dataset?.mjrKeepAliveHost, t, e)));
}
function st(e, t, n = "_mjrVueApp", { attachIfExists: r = !0 } = {}) {
	if (!e) return !1;
	let i = rt.get(n), a = !1;
	if (!i) {
		let e = at(n), { app: r } = nt(t);
		r.mount(e), i = {
			app: r,
			host: e,
			container: null
		}, rt.set(n, i), a = !0;
	}
	return (a || r) && (ot(e, i.host), i.container = e), a;
}
function ct(e = "_mjrVueApp") {
	return rt.has(e);
}
function lt(e, t = "_mjrVueApp") {
	let n = rt.get(t);
	if (n?.app) {
		try {
			n.app.unmount();
		} catch {}
		try {
			n.host?.remove?.();
		} catch {}
		rt.delete(t);
	}
}
// ui/features/viewer/workflowSidebar/widgetAdapters.ts
function ut(e, t, n = null) {
	switch (String(e?.type || "").toLowerCase()) {
		case "number":
		case "int":
		case "float": return pt(e, t, n);
		case "combo": return mt(e, t, n);
		case "text":
		case "string":
		case "customtext": return ht(e, t, n);
		case "toggle":
		case "boolean": return gt(e, t, n);
		default: return _t(e);
	}
}
function dt(e, t, n = null) {
	if (!e) return !1;
	let i = String(e.type || "").toLowerCase();
	if (i === "number" || i === "int" || i === "float") {
		let n = Number(t);
		if (Number.isNaN(n)) return !1;
		let r = e.options ?? {}, a = r.min ?? -Infinity, o = r.max ?? Infinity, s = Math.min(o, Math.max(a, n));
		(i === "int" || r.precision === 0 || r.round === 1) && (s = Math.round(s)), e.value = s;
	} else e.value = i === "toggle" || i === "boolean" ? !!t : t;
	try {
		let t = r(), o = n ?? e?.parent ?? null, s = e.value;
		e.callback?.(e.value, t, o, null, e), (i === "number" || i === "int" || i === "float") && (e.value = s), ft(e), a(o);
	} catch (e) {
		console.debug?.("[MFV] writeWidgetValue", e);
	}
	return !0;
}
function ft(e) {
	let t = String(e.value ?? ""), n = e?.inputEl ?? e?.element ?? e?.el ?? e?.cachedDeepestByFrame?.widget?.inputEl ?? e?.cachedDeepestByFrame?.widget?.element ?? e?.cachedDeepestByFrame?.widget?.el ?? null;
	n != null && "value" in n && n.value !== t && (n.value = t);
}
function pt(e, t, n = null) {
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
		i === "" || i === "-" || i === "." || i.endsWith(".") || (dt(e, i, n), t?.(e.value));
	}), r.addEventListener("change", () => {
		dt(e, r.value, n) && (r.value = String(e.value), t?.(e.value));
	}), r;
}
function mt(e, t, n = null) {
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
		dt(e, r.value, n) && t?.(e.value);
	}), r;
}
function ht(e, t, n = null) {
	let r = document.createElement("div");
	r.className = "mjr-ws-text-wrapper";
	let i = document.createElement("textarea");
	i.className = "mjr-ws-input mjr-ws-textarea", i.value = e.value ?? "", i.rows = 2;
	let a = () => {
		i.style.height = "auto", i.style.height = i.scrollHeight + "px";
	};
	return i.addEventListener("change", () => {
		dt(e, i.value, n) && t?.(e.value);
	}), i.addEventListener("input", () => {
		dt(e, i.value, n), t?.(e.value), a();
	}), r.appendChild(i), r._mjrAutoFit = a, i._mjrAutoFit = a, requestAnimationFrame(a), r;
}
function gt(e, t, n = null) {
	let r = document.createElement("label");
	r.className = "mjr-ws-toggle-label";
	let i = document.createElement("input");
	return i.type = "checkbox", i.className = "mjr-ws-checkbox", i.checked = !!e.value, i.addEventListener("change", () => {
		dt(e, i.checked, n) && t?.(e.value);
	}), r.appendChild(i), r;
}
function _t(e) {
	let t = document.createElement("input");
	return t.type = "text", t.className = "mjr-ws-input mjr-ws-readonly", t.value = e.value == null ? "" : String(e.value), t.readOnly = !0, t.tabIndex = -1, t;
}
// ui/app/settings/MajoorSettingsDialog.ts
var X = "mjr-settings-dialog", vt = "mjr-settings-dialog-style", yt = "mjr:settings-dialog-visibility", Z = null, bt = {
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
function xt() {
	if (typeof document > "u" || document.getElementById(vt)) return;
	let e = document.createElement("style");
	e.id = vt, e.textContent = `
#${X} {
    position: fixed;
    inset: 0;
    z-index: 10080;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.48);
    color: var(--fg-color, #ddd);
    font: 13px/1.4 system-ui, -apple-system, Segoe UI, sans-serif;
}
#${X}[hidden] { display: none; }
#${X} .mjr-settings-panel {
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
#${X} .mjr-settings-head,
#${X} .mjr-settings-tools {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.10);
}
#${X} .mjr-settings-title {
    font-weight: 700;
    font-size: 14px;
    flex: 1;
}
#${X} .mjr-settings-close,
#${X} .mjr-settings-reset {
    border: 1px solid rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.06);
    color: inherit;
    border-radius: 6px;
    min-height: 30px;
    padding: 0 10px;
    cursor: pointer;
}
#${X} .mjr-settings-close {
    width: 30px;
    padding: 0;
}
#${X} .mjr-settings-search {
    flex: 1;
    min-width: 160px;
    height: 30px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    background: rgba(0, 0, 0, 0.22);
    color: inherit;
    padding: 0 10px;
}
#${X} .mjr-settings-body {
    overflow: auto;
    padding: 12px;
}
#${X} .mjr-settings-stack {
    display: grid;
    gap: 10px;
}
#${X} .mjr-settings-group {
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.035);
    overflow: hidden;
}
#${X} .mjr-settings-group summary {
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
#${X} .mjr-settings-group summary::-webkit-details-marker {
    display: none;
}
#${X} .mjr-settings-group-icon {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.07);
    color: var(--input-text, #fff);
}
#${X} .mjr-settings-group-title {
    color: var(--input-text, #fff);
    font-weight: 700;
}
#${X} .mjr-settings-group-meta {
    opacity: 0.68;
    font-size: 12px;
}
#${X} .mjr-settings-chevron {
    transition: transform 0.16s ease;
}
#${X} details[open] > summary .mjr-settings-chevron {
    transform: rotate(90deg);
}
#${X} .mjr-settings-group-body {
    padding: 4px 11px 11px;
}
#${X} .mjr-settings-subgroup {
    margin-top: 8px;
}
#${X} .mjr-settings-subgroup-title {
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
#${X} .mjr-settings-subgroup-title::after {
    content: "";
    height: 1px;
    flex: 1;
    background: rgba(255, 255, 255, 0.10);
}
#${X} .mjr-settings-row {
    display: grid;
    grid-template-columns: minmax(220px, 1fr) minmax(180px, 280px);
    align-items: center;
    gap: 16px;
    padding: 9px 0;
    border-top: 1px solid rgba(255, 255, 255, 0.07);
}
#${X} .mjr-settings-name {
    font-weight: 600;
    color: var(--p-primary-color, var(--comfy-accent, #8ab4f8));
}
#${X} .mjr-settings-tip {
    margin-top: 2px;
    opacity: 0.72;
    font-size: 12px;
}
#${X} input,
#${X} select {
    min-height: 30px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    background: rgba(0, 0, 0, 0.22);
    color: inherit;
    padding: 0 8px;
}
#${X} input[type="checkbox"] {
    justify-self: end;
    width: 18px;
    min-height: 18px;
}
#${X} input[type="color"] {
    padding: 2px;
    width: 56px;
    justify-self: end;
}
@media (max-width: 620px) {
    #${X} .mjr-settings-row {
        grid-template-columns: 1fr;
        gap: 8px;
    }
}
`, document.head.appendChild(e);
}
function St(e) {
	return String(e || "").replace(/^\s*Majoor:\s*/i, "").trim();
}
function Ct(e) {
	let t = Array.isArray(e?.category) ? e.category : [];
	return String(t[1] || "General").trim() || "General";
}
function wt(e) {
	return (Array.isArray(e?.category) ? e.category : []).slice(2).filter(Boolean).join(" / ") || "General";
}
function Tt(e) {
	return bt[e] || {
		icon: "pi pi-sliders-h",
		label: e || "General"
	};
}
function Et(e, t) {
	return !t || [
		e?.id,
		e?.name,
		e?.tooltip,
		...Array.isArray(e?.category) ? e.category : []
	].join(" ").toLowerCase().includes(t);
}
function Dt(e, t) {
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
function Ot(e) {
	let t = String(e?.type || "text").toLowerCase(), n = e?.defaultValue, r;
	if (t === "boolean") return r = document.createElement("input"), r.type = "checkbox", r.checked = !!n, r.addEventListener("change", () => Dt(e, r.checked)), r;
	if (t === "combo") {
		r = document.createElement("select");
		for (let t of e?.options || []) {
			let e = document.createElement("option"), n = t && typeof t == "object" ? t.value ?? t.text ?? t.label : t;
			e.value = String(n ?? ""), e.textContent = String(t && typeof t == "object" ? t.text ?? t.label ?? t.value : t), r.appendChild(e);
		}
		return r.value = String(n ?? ""), r.addEventListener("change", () => Dt(e, r.value)), r;
	}
	if (r = document.createElement("input"), r.type = t === "color" ? "color" : t === "number" ? "number" : t === "password" ? "password" : "text", e?.attrs && typeof e.attrs == "object") for (let [t, n] of Object.entries(e.attrs)) n != null && r.setAttribute(t, String(n));
	r.value = String(n ?? "");
	let i = t === "color" ? "input" : "change";
	return r.addEventListener(i, () => {
		Dt(e, t === "number" ? Number(r.value) : r.value);
	}), r;
}
function kt(e, t, n = "") {
	e.replaceChildren();
	let r = document.createElement("div");
	r.className = "mjr-settings-stack", e.appendChild(r);
	let i = /* @__PURE__ */ new Map();
	for (let e of t || []) {
		if (!Et(e, n)) continue;
		let t = Ct(e), r = wt(e);
		i.has(t) || i.set(t, /* @__PURE__ */ new Map());
		let a = i.get(t);
		a.has(r) || a.set(r, []), a.get(r).push(e);
	}
	for (let [e, t] of i.entries()) {
		let i = Array.from(t.values()).flat(), a = Tt(e), o = document.createElement("details");
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
				if (i.className = "mjr-settings-name", i.textContent = St(e?.name) || e?.id || "Setting", r.appendChild(i), e?.tooltip) {
					let t = document.createElement("div");
					t.className = "mjr-settings-tip", t.textContent = String(e.tooltip), r.appendChild(t);
				}
				n.appendChild(r), n.appendChild(Ot(e)), t.appendChild(n);
			}
			p.appendChild(t);
		}
		o.appendChild(p), r.appendChild(o);
	}
}
function At() {
	xt();
	let e = document.createElement("div");
	e.id = X, e.hidden = !0, e.addEventListener("click", (t) => {
		t.target === e && jt();
	});
	let t = document.createElement("div");
	t.className = "mjr-settings-panel", t.setAttribute("role", "dialog"), t.setAttribute("aria-modal", "true");
	let n = document.createElement("div");
	n.className = "mjr-settings-head";
	let r = document.createElement("div");
	r.className = "mjr-settings-title", r.textContent = i("settings.majoor.title", "Majoor Assets Manager Settings");
	let a = document.createElement("button");
	a.type = "button", a.className = "mjr-settings-close", a.textContent = "X", a.setAttribute("aria-label", i("btn.close", "Close")), a.addEventListener("click", jt), n.append(r, a);
	let o = document.createElement("div");
	o.className = "mjr-settings-tools";
	let s = document.createElement("input");
	s.type = "search", s.className = "mjr-settings-search", s.placeholder = i("placeholder.searchSettings", "Search settings"), o.appendChild(s);
	let c = document.createElement("div");
	return c.className = "mjr-settings-body", t.append(n, o, c), e.appendChild(t), document.body.appendChild(e), {
		body: c,
		root: e,
		search: s
	};
}
function jt() {
	if (Z?.root) {
		Z.root.hidden = !0;
		try {
			window.dispatchEvent(new CustomEvent(yt, { detail: { open: !1 } }));
		} catch (e) {
			console.debug?.(e);
		}
	}
}
function Mt(e = s()) {
	if (typeof document > "u") return !1;
	Z?.root?.isConnected || (Z = At());
	let t = g(e), n = () => kt(Z.body, t, String(Z.search.value || "").trim().toLowerCase());
	Z.search.oninput = n, Z.search.value = "", n(), Z.root.hidden = !1;
	try {
		window.dispatchEvent(new CustomEvent(yt, { detail: { open: !0 } }));
	} catch (e) {
		console.debug?.(e);
	}
	return setTimeout(() => Z?.search?.focus?.(), 0), !0;
}
// ui/app/openMajoorSettings.ts
function Nt(e = s()) {
	return Mt(e);
}
try {
	typeof window < "u" && (window.MajoorAssetsManager = window.MajoorAssetsManager || {}, window.MajoorAssetsManager.openSettings = Nt);
} catch (e) {
	console.debug?.(e);
}
// ui/utils/tooltipShortcuts.ts
function Pt(e, t) {
	let n = String(e || "").trim(), r = String(t || "").trim();
	if (!r) return n;
	if (!n) return r;
	if (r.length === 1) {
		let e = r.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		if (RegExp(`\\(${e}\\)|\\b${e}\\b`, "i").test(n)) return n;
	} else if (n.toLowerCase().includes(r.toLowerCase())) return n;
	return `${n} (${r})`;
}
function Ft(e, t, n, { setAriaLabel: r = !0, ariaLabel: i = null } = {}) {
	if (!e) return "";
	let a = Pt(t, n);
	if (e.title = a, r) {
		let r = i ?? t;
		e.setAttribute("aria-label", Pt(r, n));
	}
	return a;
}
// ui/features/viewer/state.ts
function Q(e) {
	let t = Number(e);
	return Number.isFinite(t) ? Math.max(0, Math.min(1, t)) : 0;
}
function $(e, t, n) {
	let r = Number(e);
	return Number.isFinite(r) ? Math.max(Number(t), Math.min(Number(n), r)) : Number(t);
}
// ui/components/VideoControls.ts
var It = 400, Lt = 1e3, Rt = 220, zt = .001;
function Bt(e, t) {
	let n = Number(e), r = Math.max(1, Number(t) || 1);
	if (!Number.isFinite(n) || n <= 0) return 1;
	let i = n / r, a = 10 ** Math.floor(Math.log10(Math.max(i, .001))), o = i / a;
	return Math.max(.001, (o <= 1 ? 1 : o <= 2 ? 2 : o <= 5 ? 5 : 10) * a);
}
function Vt(e, t, n) {
	try {
		if (e?.aborted) return ee;
		let r = setTimeout(() => {
			try {
				if (e?.aborted) return;
				n?.();
			} catch (e) {
				console.debug?.(e);
			}
		}, Math.max(0, Math.floor(Number(t) || 0))), i = () => {
			try {
				clearTimeout(r);
			} catch (e) {
				console.debug?.(e);
			}
		};
		try {
			e?.addEventListener?.("abort", i, { once: !0 });
		} catch (e) {
			console.debug?.(e);
		}
		return () => {
			try {
				clearTimeout(r);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				e?.removeEventListener?.("abort", i);
			} catch (e) {
				console.debug?.(e);
			}
		};
	} catch {
		return ee;
	}
}
function Ht(e) {
	let t = Math.floor(Number(e) || 0);
	return t < 10 ? `0${t}` : String(t);
}
function Ut(e) {
	let t = Number(e);
	if (!Number.isFinite(t) || t < 0) return "0:00";
	let n = Math.floor(t), r = Math.floor(n / 3600), i = Math.floor(n % 3600 / 60), a = n % 60;
	return r > 0 ? `${r}:${Ht(i)}:${Ht(a)}` : `${i}:${Ht(a)}`;
}
function Wt(e, t, n) {
	let r = document.createElement("button");
	r.type = "button", r.className = `mjr-video-btn ${e || ""}`.trim(), n && (r.title = n);
	try {
		r.setAttribute("aria-label", n || t || "Button");
	} catch (e) {
		console.debug?.(e);
	}
	return r.textContent = t, r;
}
function Gt(e, t, n, r) {
	let i = document.createElement("button");
	i.type = "button", i.className = `mjr-video-btn ${e || ""}`.trim(), n && (i.title = n);
	try {
		i.setAttribute("aria-label", r || n || "Button");
	} catch (e) {
		console.debug?.(e);
	}
	let a = document.createElement("span");
	return a.className = `pi ${t || ""}`.trim(), a.setAttribute("aria-hidden", "true"), i.appendChild(a), {
		btn: i,
		icon: a
	};
}
function Kt(e, { min: t, max: n, step: r, value: i, title: a, ariaLabel: o, widthPx: s } = {}) {
	let c = document.createElement("input");
	return c.type = "number", c.className = `mjr-video-num ${e || ""}`.trim(), a && (c.title = a), o && c.setAttribute("aria-label", o), t != null && (c.min = String(t)), n != null && (c.max = String(n)), r != null && (c.step = String(r)), i != null && (c.value = String(i)), s != null && (c.style.width = `${s}px`), c;
}
function qt(e) {
	try {
		return e?.variant === "preview" ? "preview" : "viewer";
	} catch {
		return "viewer";
	}
}
function Jt(e) {
	try {
		let t = Number(e?.initialFps);
		return Number.isFinite(t) && t > 0 ? t : null;
	} catch {
		return null;
	}
}
function Yt(e, t) {
	let n = Number(e), r = Number(t);
	return Number.isFinite(n) && Number.isFinite(r) && Math.abs(n - r) <= zt;
}
function Xt(e, t) {
	let n = [];
	try {
		e.controls = !1, e.loop = !0, e.muted = !0, e.playsInline = !0, e.autoplay = !0;
	} catch (e) {
		console.debug?.(e);
	}
	let r = document.createElement("div");
	r.className = "mjr-video-controls mjr-video-controls--preview";
	try {
		r.setAttribute("role", "group"), r.setAttribute("aria-label", i("video.previewControls", "Video preview controls"));
	} catch (e) {
		console.debug?.(e);
	}
	let a = document.createElement("button");
	a.type = "button", a.className = "mjr-video-preview-btn", a.title = i("video.playPause", "Play/Pause");
	try {
		a.setAttribute("aria-label", i("video.playPause", "Play/Pause"));
	} catch (e) {
		console.debug?.(e);
	}
	let o = document.createElement("span");
	o.className = "pi pi-play";
	try {
		o.setAttribute("aria-hidden", "true");
	} catch (e) {
		console.debug?.(e);
	}
	a.appendChild(o), r.appendChild(a);
	let s = () => {
		try {
			let t = !!e?.paused;
			o.className = `pi ${t ? "pi-play" : "pi-pause"}`;
		} catch (e) {
			console.debug?.(e);
		}
	}, c = () => {
		try {
			let t = e.play?.();
			t && typeof t.catch == "function" && t.catch(() => {});
		} catch (e) {
			console.debug?.(e);
		}
	}, l = (t) => {
		try {
			t?.stopPropagation?.();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			e.paused ? c() : e.pause?.();
		} catch (e) {
			console.debug?.(e);
		}
		s();
	};
	try {
		t.appendChild(r);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		c();
	} catch (e) {
		console.debug?.(e);
	}
	n.push(f(e, "loadedmetadata", () => c(), { passive: !0 })), n.push(f(e, "canplay", () => c(), { passive: !0 })), n.push(f(a, "click", l)), n.push(f(e, "play", s, { passive: !0 })), n.push(f(e, "pause", s, { passive: !0 })), n.push(f(e, "ended", () => c(), { passive: !0 }));
	try {
		s();
	} catch (e) {
		console.debug?.(e);
	}
	return {
		controlsEl: r,
		destroy: () => {
			try {
				for (let e of n) h(() => e?.());
			} catch (e) {
				console.debug?.(e);
			}
			try {
				r.remove?.();
			} catch (e) {
				console.debug?.(e);
			}
		}
	};
}
function Zt(e, t = {}) {
	try {
		let n = qt(t), r = String(t?.mediaKind || "video").toLowerCase() === "audio", a = n !== "preview", o = a, s = Jt(t), c = t?.hostEl || e?.parentElement;
		if (!e || !c) return {
			controlsEl: null,
			destroy: ee
		};
		if (n === "preview") return Xt(e, c);
		try {
			e.loop = !1;
		} catch (e) {
			console.debug?.(e);
		}
		h(() => c.classList?.add("mjr-video-host")), h(() => e.classList?.add("mjr-video-el")), h(() => {
			window.getComputedStyle?.(c)?.position === "static" && (c.style.position = "relative");
		});
		let l = document.createElement("div");
		l.className = `mjr-video-controls mjr-video-controls--${n}`, r && l.classList.add("mjr-video-controls--audio"), l.dataset.mjrLayout = "regular", l.setAttribute("role", "group"), l.setAttribute("aria-label", r ? i("video.audioControls", "Audio controls") : i("video.controls", "Video controls"));
		let u = document.createElement("div");
		u.className = "mjr-video-row mjr-video-row--top";
		let d = document.createElement("div");
		d.className = "mjr-video-row mjr-video-row--bottom", l.appendChild(u), l.appendChild(d);
		let p = document.createElement("div");
		p.className = "mjr-video-seek-wrap";
		let g = document.createElement("input");
		g.className = "mjr-video-range mjr-video-range--seek", g.type = "range", g.min = "0", g.max = String(Lt), g.step = "1", g.value = "0", g.setAttribute("aria-label", i("video.seek", "Seek")), g.title = r ? i("video.seekThroughAudio", "Seek through audio") : i("video.seekThrough", "Seek through video");
		let te = document.createElement("div");
		te.className = "mjr-video-seek-overlay";
		let _ = null, ne = null, re = null, ie = null;
		o && (_ = document.createElement("div"), _.className = "mjr-video-seek-zones", ne = document.createElement("div"), ne.className = "mjr-video-seek-zone mjr-video-seek-zone--leftTrim", re = document.createElement("div"), re.className = "mjr-video-seek-zone mjr-video-seek-zone--selected", ie = document.createElement("div"), ie.className = "mjr-video-seek-zone mjr-video-seek-zone--rightTrim", _.appendChild(ne), _.appendChild(re), _.appendChild(ie));
		let ae = document.createElement("div");
		ae.className = "mjr-video-seek-ticks";
		let v = document.createElement("div");
		v.className = "mjr-video-seek-labels";
		let oe = document.createElement("div");
		oe.className = "mjr-video-seek-mark mjr-video-seek-mark--in";
		let se = document.createElement("div");
		se.className = "mjr-video-seek-mark mjr-video-seek-mark--out";
		let ce = document.createElement("div");
		ce.className = "mjr-video-seek-playhead";
		let le = document.createElement("div");
		le.className = "mjr-video-seek-playhead-label", te.appendChild(ae), te.appendChild(v), te.appendChild(ce), te.appendChild(le);
		let ue = document.createElement("div");
		ue.className = "mjr-video-seek-handle mjr-video-seek-handle--in", ue.title = i("video.dragSetIn", "Drag to set In"), ue.setAttribute("aria-label", i("video.dragSetIn", "Drag to set In"));
		let de = document.createElement("div");
		de.className = "mjr-video-seek-handle mjr-video-seek-handle--out", de.title = i("video.dragSetOut", "Drag to set Out"), de.setAttribute("aria-label", i("video.dragSetOut", "Drag to set Out")), p.appendChild(g), _ && p.appendChild(_), p.appendChild(te), o && (p.appendChild(oe), p.appendChild(se), p.appendChild(ue), p.appendChild(de));
		let fe = document.createElement("span");
		fe.className = "mjr-video-time", fe.textContent = "0:00 / 0:00", fe.title = i("video.currentTimeTotal", "Current time / Total duration");
		let y = document.createElement("span");
		y.className = "mjr-video-range-count", y.textContent = "";
		try {
			y.style.display = "none";
		} catch (e) {
			console.debug?.(e);
		}
		let pe = document.createElement("div");
		pe.className = "mjr-video-timegroup", pe.appendChild(fe), o && pe.appendChild(y);
		let b = document.createElement("span");
		b.className = "mjr-video-frame", b.textContent = "F: 0", b.title = i("video.currentFrame", "Current frame number");
		let me = Wt("mjr-video-btn--play", i("btn.play", "Play"), i("video.playPauseSpace", "Play/Pause (Space)")), he = Wt("mjr-video-btn--step", "<", i("video.stepBack", "Step back")), ge = Wt("mjr-video-btn--step", ">", i("video.stepForward", "Step forward")), _e = Wt("mjr-video-btn--jump mjr-video-btn--in", "|<", i("video.goToIn", "Go to In")), ve = Wt("mjr-video-btn--jump mjr-video-btn--out", ">|", i("video.goToOut", "Go to Out")), ye = Wt("mjr-video-btn--mark mjr-video-btn--in", "I", i("video.setInFromCurrent", "Set In from current frame")), be = Wt("mjr-video-btn--mark mjr-video-btn--out", "O", i("video.setOutFromCurrent", "Set Out from current frame")), xe = Gt("mjr-video-btn--toggle", "pi-refresh", i("video.loopPlaybackInRange", "Loop playback in range"), i("video.loop", "Loop")), x = xe.btn, S = Kt("mjr-video-num--in", {
			min: 0,
			step: 1,
			value: 0,
			title: i("video.inFrame", "In frame"),
			ariaLabel: i("video.inFrame", "In frame"),
			widthPx: 72
		}), Se = Kt("mjr-video-num--out", {
			min: 0,
			step: 1,
			value: 0,
			title: i("video.outFrame", "Out frame"),
			ariaLabel: i("video.outFrame", "Out frame"),
			widthPx: 72
		}), Ce = Kt("mjr-video-num--step", {
			min: 1,
			step: 1,
			value: 1,
			title: i("video.frameIncrement", "Frame increment"),
			ariaLabel: i("video.frameIncrement", "Frame increment"),
			widthPx: 56
		}), C = Kt("mjr-video-num--fps", {
			min: 1,
			step: .001,
			value: m(s || 30),
			title: i("video.fpsStepping", "FPS (used for frame stepping)"),
			ariaLabel: i("video.fps", "FPS"),
			widthPx: 56
		}), w = document.createElement("select");
		w.className = "mjr-video-num mjr-video-num--speed", w.title = i("video.playbackSpeed", "Playback speed"), w.setAttribute("aria-label", i("video.playbackSpeed", "Playback speed")), w.style.width = "74px";
		for (let e of [
			.25,
			.5,
			.75,
			1,
			1.25,
			1.5,
			2,
			3,
			5,
			10
		]) {
			let t = document.createElement("option");
			t.value = String(e), t.textContent = `${e}x`, w.appendChild(t);
		}
		let we = Gt("mjr-video-btn--mute", "pi-volume-up", i("video.mute", "Mute"), i("video.mute", "Mute")), Te = we.btn, T = document.createElement("div");
		T.className = "mjr-video-volume-wrap", T.style.cssText = "display:none; align-items:center; position:relative;";
		let E = null;
		E = document.createElement("input"), E.className = "mjr-video-range mjr-video-range--volume", E.type = "range", E.min = "0", E.max = "1", E.step = "0.02", E.value = String(Q(Number(e.volume) || 0)), E.setAttribute("aria-label", i("video.volume", "Volume")), E.title = i("video.volume", "Volume");
		try {
			E.style.width = "120px";
		} catch (e) {
			console.debug?.(e);
		}
		T.appendChild(E);
		let Ee = document.createElement("div");
		Ee.className = "mjr-video-group mjr-video-group--in";
		let De = document.createElement("span");
		De.textContent = "In", De.title = i("video.resetInToStart", "Reset In to start"), De.style.cssText = "cursor:pointer; user-select:none;", o && (Ee.appendChild(De), Ee.appendChild(S));
		let Oe = document.createElement("div");
		Oe.className = "mjr-video-group mjr-video-group--out";
		let D = document.createElement("span");
		D.textContent = "Out", D.title = i("video.resetOutToEnd", "Reset Out to end"), D.style.cssText = "cursor:pointer; user-select:none;", o && (Oe.appendChild(D), Oe.appendChild(Se));
		let O = document.createElement("div");
		O.className = "mjr-video-group mjr-video-group--adjust-left", o && (O.appendChild(ye), r || (O.appendChild(document.createTextNode(i("video.step", "Step"))), O.appendChild(Ce), O.appendChild(document.createTextNode(i("video.fps", "FPS"))), O.appendChild(C)), O.appendChild(b));
		let ke = document.createElement("div");
		ke.className = "mjr-video-group mjr-video-group--adjust-right", o && (ke.appendChild(pe), ke.appendChild(x));
		let Ae = document.createElement("div");
		Ae.className = "mjr-video-group mjr-video-group--speed", Ae.appendChild(document.createTextNode(i("video.speed", "Speed"))), Ae.appendChild(w);
		let je = document.createElement("div");
		je.className = "mjr-video-bottom mjr-video-bottom--left";
		let k = document.createElement("div");
		k.className = "mjr-video-transport";
		let A = document.createElement("div");
		A.className = "mjr-video-bottom mjr-video-bottom--right", k.appendChild(_e), r || k.appendChild(he), k.appendChild(me), r || k.appendChild(ge), k.appendChild(ve), o && je.appendChild(O), o && A.appendChild(ke), A.appendChild(Ae), A.appendChild(Te), o && A.appendChild(be), E && A.appendChild(T), o && u.appendChild(b), o && u.appendChild(Ee), u.appendChild(p), o && u.appendChild(Oe), u.appendChild(pe), d.appendChild(je), d.appendChild(k), d.appendChild(A);
		let j = (e) => {
			try {
				e.stopPropagation?.();
			} catch (e) {
				console.debug?.(e);
			}
		}, M = (e) => {
			try {
				e.preventDefault?.();
			} catch (e) {
				console.debug?.(e);
			}
			j(e);
		}, N = [], Me = (() => {
			try {
				return new AbortController();
			} catch {
				return {
					signal: {
						aborted: !1,
						addEventListener: ee,
						removeEventListener: ee
					},
					abort: ee
				};
			}
		})();
		N.push(() => {
			try {
				Me.abort();
			} catch (e) {
				console.debug?.(e);
			}
		});
		let Ne = () => {
			try {
				let e = Number(c?.clientWidth) || Number(l?.clientWidth) || 0, t = "regular";
				e > 0 && e < 560 ? t = "stacked" : e > 0 && e < 860 && (t = "compact"), l.dataset.mjrLayout = t;
			} catch (e) {
				console.debug?.(e);
			}
		};
		Ne();
		try {
			if (typeof ResizeObserver == "function" && c) {
				let e = typeof requestAnimationFrame == "function" ? requestAnimationFrame : null, t = typeof cancelAnimationFrame == "function" ? cancelAnimationFrame : null, n = 0, r = new ResizeObserver(e ? () => {
					n ||= e(() => {
						n = 0, Ne();
					});
				} : () => Ne());
				r.observe(c), N.push(() => {
					try {
						n && t && t(n), r.disconnect();
					} catch (e) {
						console.debug?.(e);
					}
				});
			}
		} catch (e) {
			console.debug?.(e);
		}
		N.push(f(l, "pointerdown", j)), N.push(f(l, "dblclick", M, { capture: !0 })), N.push(f(l, "wheel", M, {
			capture: !0,
			passive: !1
		})), N.push(f(window, "dblclick", (e) => {
			try {
				l.contains?.(e?.target) && M(e);
			} catch (e) {
				console.debug?.(e);
			}
		}, { capture: !0 })), N.push(f(window, "wheel", (e) => {
			try {
				l.contains?.(e?.target) && M(e);
			} catch (e) {
				console.debug?.(e);
			}
		}, {
			capture: !0,
			passive: !1
		}));
		let P = {
			outFrame: null,
			frameCount: null,
			loop: o,
			pingpong: !1,
			once: !1,
			playbackRate: Math.max(.25, Math.min(10, Number(t?.initialPlaybackRate) || 1)),
			_seeking: !1,
			_ppReverse: !1,
			_ppRafId: null,
			_userInteracted: !1
		};
		P.nativeFps = s ? m(s, 30) : null, P.fps = P.nativeFps || m(C.value, 30);
		let Pe = () => {
			let e = Number(P.nativeFps), t = Number(P.fps);
			return Number.isFinite(e) && e > 0 && !Yt(t, e);
		}, Fe = (e = !1) => {
			try {
				if (!C || r) return;
				let t = Number(P.nativeFps), n = Pe(), a = i("video.fpsStepping", "FPS (used for frame stepping)");
				C.classList.toggle("is-overridden", n), Number.isFinite(t) && t > 0 ? (C.dataset.defaultFps = String(t), C.title = `${a} - Source FPS: ${t}`, n && (C.title += " - Modified")) : (delete C.dataset.defaultFps, C.title = a), e && !C.matches?.(":focus") && (C.value = String(m(P.fps, P.nativeFps || 30)));
			} catch (e) {
				console.debug?.(e);
			}
		};
		Fe(!0);
		let Ie = () => {
			if (!P._userInteracted) {
				P._userInteracted = !0;
				try {
					e.muted && (e.muted = !1, Ze?.());
				} catch (e) {
					console.debug?.(e);
				}
			}
		}, Le = null, Re = () => {
			if (o) try {
				b.classList.add("is-step");
				try {
					Le?.();
				} catch (e) {
					console.debug?.(e);
				}
				Le = Vt(Me.signal, Rt, () => {
					try {
						b.classList.remove("is-step");
					} catch (e) {
						console.debug?.(e);
					}
				});
			} catch (e) {
				console.debug?.(e);
			}
		};
		N.push(() => {
			try {
				Le?.();
			} catch (e) {
				console.debug?.(e);
			}
			Le = null;
			try {
				b?.classList?.remove?.("is-step");
			} catch (e) {
				console.debug?.(e);
			}
		});
		let ze = (e, t) => {
			try {
				if (!e) return;
				t ? e.classList.add("is-on") : e.classList.remove("is-on");
			} catch (e) {
				console.debug?.(e);
			}
		}, F = (t) => {
			try {
				let n = Number(t);
				if (!Number.isFinite(n) || n <= 0) return P.playbackRate;
				let r = Math.max(.25, Math.min(10, Math.round(n * 100) / 100));
				P.playbackRate = r;
				try {
					e.playbackRate = r;
				} catch (e) {
					console.debug?.(e);
				}
				try {
					w.matches?.(":focus") || (w.value = String(r));
				} catch (e) {
					console.debug?.(e);
				}
				return r;
			} catch {
				return P.playbackRate;
			}
		}, Be = () => {
			try {
				ze(x, !!(P.loop || P.pingpong));
				try {
					xe?.icon && (P.pingpong ? (xe.icon.className = "pi pi-sort-alt", x.title = i("video.pingpongPlayback", "Ping-pong playback (forward then reverse)")) : (xe.icon.className = "pi pi-refresh", x.title = i("video.loopPlaybackInRange", "Loop playback in range")));
				} catch (e) {
					console.debug?.(e);
				}
			} catch (e) {
				console.debug?.(e);
			}
		}, I = () => {
			try {
				let t = Number(P.frameCount);
				if (Number.isFinite(t) && t > 0) return Math.max(1, Math.floor(t));
				let n = Number(e?.duration), r = m(P.fps, 30);
				return !Number.isFinite(n) || n <= 0 ? 0 : Math.max(0, Math.floor(n * r));
			} catch {
				return 0;
			}
		}, L = (t = null) => {
			try {
				let n = t ?? e?.currentTime, r = Number(n), i = m(P.fps, 30);
				return !Number.isFinite(r) || r < 0 ? 0 : Math.max(0, Math.floor(r * i + 1e-6));
			} catch {
				return 0;
			}
		}, Ve = (e) => {
			let t = m(P.fps, 30);
			return Math.max(0, Number(e) || 0) / t;
		}, R = () => {
			try {
				let e = I();
				if (e <= 0) return;
				let t = P.inFrame == null ? 0 : $(P.inFrame, 0, e), n = P.outFrame == null ? e : $(P.outFrame, 0, e);
				n < t ? (P.inFrame = n, P.outFrame = t) : (P.inFrame = t, P.outFrame = n);
			} catch (e) {
				console.debug?.(e);
			}
		}, z = () => {
			try {
				let e = I();
				return {
					inF: P.inFrame == null ? 0 : $(P.inFrame, 0, e),
					outF: P.outFrame == null ? e : $(P.outFrame, 0, e),
					maxF: e
				};
			} catch {
				return {
					inF: 0,
					outF: 0,
					maxF: 0
				};
			}
		}, He = () => {
			try {
				if (!o || r) return Lt;
				let e = I();
				if (Number.isFinite(e) && e > Lt) return Math.max(Lt, Math.floor(e));
			} catch (e) {
				console.debug?.(e);
			}
			return Lt;
		}, Ue = () => {
			try {
				g.max = String(He());
			} catch (e) {
				console.debug?.(e);
			}
		}, B = () => {
			try {
				let t = !e?.paused || P._ppReverse;
				me.textContent = t ? i("video.pause", "Pause") : i("video.play", "Play");
			} catch (e) {
				console.debug?.(e);
			}
		}, We = () => {
			try {
				let t = !!e?.muted || (Number(e?.volume) || 0) <= .001;
				try {
					we.icon.className = `pi ${t ? "pi-volume-off" : "pi-volume-up"}`;
				} catch (e) {
					console.debug?.(e);
				}
				let n = t ? i("video.unmute", "Unmute") : i("video.mute", "Mute");
				Te.title = n, Te.setAttribute("aria-label", n);
			} catch (e) {
				console.debug?.(e);
			}
		}, V = (t = null) => {
			try {
				let n = Number(e?.duration), i = t ?? e?.currentTime, s = Number(i), c = Number.isFinite(n) && n > 0;
				if (fe.textContent = `${Ut(s)} / ${c ? Ut(n) : "0:00"}`, g.disabled = !c, c) {
					let e = Q((s || 0) / n);
					Ue();
					let t = Math.round(e * He());
					Number.isNaN(t) || P._seeking || g.matches?.(":active") || (g.value = String(t));
					try {
						ce.style.left = `${e * 100}%`;
					} catch (e) {
						console.debug?.(e);
					}
				} else {
					g.value = "0";
					try {
						ce.style.left = "0%";
					} catch (e) {
						console.debug?.(e);
					}
				}
				let l = o ? I() : 0, u = o ? L(s) : 0;
				if (a) {
					o && (b.textContent = r ? `T: ${Ut(s)} / ${Ut(n)}` : `F: ${u} / ${l}`);
					try {
						if (Number.isFinite(n) && n > 0) {
							let e = Q((s || 0) / n);
							le.style.left = `${e * 100}%`, le.textContent = r ? Ut(s) : String(u), le.style.display = "";
						} else le.style.display = "none";
					} catch (e) {
						console.debug?.(e);
					}
				}
				if (o) {
					S.matches?.(":focus") || (S.value = String(P.inFrame ?? 0)), Se.matches?.(":focus") || (Se.value = String(P.outFrame ?? l));
					try {
						let { inF: e, outF: t, maxF: n } = z(), i = e <= 0 && t >= n, a = Math.max(0, Math.floor(t) - Math.floor(e) + 1);
						!i && n > 0 ? (y.textContent = r ? `R: ${Ut(a / m(P.fps, 30))}` : `R: ${a}f`, y.style.display = "") : y.style.display = "none";
					} catch (e) {
						console.debug?.(e);
					}
				}
			} catch (e) {
				console.debug?.(e);
			}
		}, Ge = () => {
			if (a && r) try {
				let t = Number(e?.duration);
				if (!Number.isFinite(t) || t <= 0) {
					ae.style.backgroundImage = "", v.replaceChildren();
					try {
						v.dataset.mjrLabelKey = "";
					} catch (e) {
						console.debug?.(e);
					}
					return;
				}
				let n = Bt(t, 80), r = Bt(t, 8), i = n / t * 100, a = r / t * 100;
				if (Number.isFinite(i) && i > .02) {
					let e = `repeating-linear-gradient(to right, rgba(255,255,255,0.16) 0, rgba(255,255,255,0.16) 1px, transparent 1px, transparent ${i}%)`, t = `repeating-linear-gradient(to right, rgba(255,255,255,0.3) 0, rgba(255,255,255,0.3) 1px, transparent 1px, transparent ${a}%)`;
					ae.style.backgroundImage = `${t}, ${e}`;
				} else ae.style.backgroundImage = "";
				let o = `audio|${Math.round(t * 1e3)}|${Math.round(r * 1e3)}`;
				if (v?.dataset?.mjrLabelKey === o) return;
				v.dataset.mjrLabelKey = o, v.replaceChildren();
				let s = (e) => {
					let n = document.createElement("span");
					n.className = "mjr-video-seek-label";
					let r = Math.max(0, Math.min(t, Number(e) || 0));
					return n.style.left = `${Q(r / t) * 100}%`, n.textContent = Ut(r), n;
				};
				v.appendChild(s(0));
				for (let e = r; e < t; e += r) v.appendChild(s(e));
				v.appendChild(s(t));
			} catch (e) {
				console.debug?.(e);
			}
		}, H = () => {
			if (!o) Ge();
			else try {
				let { inF: e, outF: t, maxF: n } = z();
				if (!Number.isFinite(n) || n <= 0) return;
				let i = Q(e / n) * 100, a = Q(t / n) * 100, o = e <= 0 && t >= n;
				try {
					g.style.background = "";
				} catch (e) {
					console.debug?.(e);
				}
				try {
					let e = Q(i / 100) * 100, t = Q(a / 100) * 100, n = Math.min(e, t), r = Math.max(e, t);
					if (_ && ne && re && ie) {
						ne.style.left = "0%", ne.style.width = `${n}%`, re.style.left = `${n}%`, re.style.width = `${Math.max(0, r - n)}%`, ie.style.left = `${r}%`, ie.style.width = `${Math.max(0, 100 - r)}%`;
						try {
							_.classList.toggle("is-trimmed", !o), _.classList.toggle("is-fullrange", o);
						} catch (e) {
							console.debug?.(e);
						}
					}
				} catch (e) {
					console.debug?.(e);
				}
				try {
					oe.style.left = `${i}%`, se.style.left = `${a}%`;
				} catch (e) {
					console.debug?.(e);
				}
				try {
					ue.style.left = `${i}%`, de.style.left = `${a}%`;
				} catch (e) {
					console.debug?.(e);
				}
				if (r) {
					Ge();
					return;
				}
				try {
					let e = Math.max(1, Math.floor(n / It)), t = Math.max(e, Math.floor(Number(P.step) || 1)), r = t / n * 100, i = r * 10;
					if (Number.isFinite(r) && r > .02) {
						let e = `repeating-linear-gradient(to right, rgba(255,255,255,0.16) 0, rgba(255,255,255,0.16) 1px, transparent 1px, transparent ${r}%)`, t = `repeating-linear-gradient(to right, rgba(255,255,255,0.28) 0, rgba(255,255,255,0.28) 1px, transparent 1px, transparent ${i}%)`;
						ae.style.backgroundImage = `${t}, ${e}`;
					} else ae.style.backgroundImage = "";
					(() => {
						try {
							let e = `${n}|${t}`;
							if (v?.dataset?.mjrLabelKey === e) return;
							v.dataset.mjrLabelKey = e;
						} catch (e) {
							console.debug?.(e);
						}
						try {
							v.replaceChildren();
						} catch (e) {
							console.debug?.(e);
						}
						let e = Math.max(1, t * 10);
						try {
							for (; e > 0 && Math.ceil(n / e) > 22;) e *= 2;
						} catch (e) {
							console.debug?.(e);
						}
						let r = (e) => {
							let t = document.createElement("span");
							t.className = "mjr-video-seek-label";
							let r = Q(e / n) * 100;
							return t.style.left = `${r}%`, t.textContent = String(Math.floor(e)), t;
						};
						try {
							v.appendChild(r(0));
						} catch (e) {
							console.debug?.(e);
						}
						for (let t = e; t < n; t += e) try {
							v.appendChild(r(t));
						} catch (e) {
							console.debug?.(e);
						}
						try {
							v.appendChild(r(n));
						} catch (e) {
							console.debug?.(e);
						}
					})();
				} catch (e) {
					console.debug?.(e);
				}
			} catch (e) {
				console.debug?.(e);
			}
		}, U = ({ prefer: e = null } = {}) => {
			if (o) try {
				R();
				let { inF: t, outF: n } = z(), r = L();
				e === "in" ? W(t) : e === "out" ? r > n && W(n) : r < t ? W(t) : r > n && W(n);
			} catch (e) {
				console.debug?.(e);
			}
		}, Ke = () => {
			try {
				P.inFrame = 0, R(), V(), H(), U({ prefer: "in" });
			} catch (e) {
				console.debug?.(e);
			}
		}, qe = () => {
			try {
				let { maxF: e } = z();
				P.outFrame = Math.max(0, Number(e) || 0), R(), V(), H(), U({ prefer: "out" });
			} catch (e) {
				console.debug?.(e);
			}
		}, Je = () => {
			try {
				P._ppRafId != null && (cancelAnimationFrame(P._ppRafId), P._ppRafId = null);
			} catch (e) {
				console.debug?.(e);
			}
		};
		N.push(Je);
		let Ye = () => {
			try {
				Je(), P._ppReverse = !0, e.pause?.(), B();
				let t = 1e3 / (m(P.fps, 30) * Math.max(.25, Number(P.playbackRate) || 1)), n = performance.now(), r = (i) => {
					try {
						if (!P._ppReverse || !P.pingpong) {
							P._ppReverse = !1, B();
							return;
						}
						let a = i - n;
						if (a >= t) {
							n = i - a % t;
							let { inF: r } = z(), o = L();
							if (o <= r) {
								P._ppReverse = !1, W(r);
								let t = e.play?.();
								t && typeof t.catch == "function" && t.catch(() => {}), B(), V();
								return;
							}
							let s = Math.max(1, Math.floor(Number(P.step) || 1));
							W(o - s), V();
						}
						P._ppRafId = requestAnimationFrame(r);
					} catch (e) {
						console.debug?.(e), P._ppReverse = !1, B();
					}
				};
				P._ppRafId = requestAnimationFrame(r);
			} catch (e) {
				console.debug?.(e), P._ppReverse = !1;
			}
		}, Xe = () => {
			try {
				let e = I();
				P.inFrame = 0, P.outFrame = e > 0 ? e : null, P.step = 1, P.loop = !!o, P.pingpong = !1, P._ppReverse = !1, Je(), P.once = !1, F(1);
				try {
					Ce.value = "1";
				} catch (e) {
					console.debug?.(e);
				}
				try {
					w.matches?.(":focus") || (w.value = "1");
				} catch (e) {
					console.debug?.(e);
				}
				R(), Be(), V(), H(), U({ prefer: "in" });
			} catch (e) {
				console.debug?.(e);
			}
		}, Ze = () => {
			try {
				let t = Q(Number(e?.volume) || 0);
				try {
					E && !E.matches?.(":active") && (E.value = String(t));
				} catch (e) {
					console.debug?.(e);
				}
				We();
			} catch (e) {
				console.debug?.(e);
			}
		}, W = (t) => {
			try {
				let { maxF: n } = z(), r = $(t, 0, n > 0 ? n : Infinity);
				e.currentTime = Ve(r);
			} catch (e) {
				console.debug?.(e);
			}
			V();
		}, Qe = (t) => {
			Ie();
			try {
				let n = Math.max(1, Math.floor(Number(P.step) || 1)), { inF: r, outF: i } = z(), a = L() + t * n;
				P.loop ? (a < r && (a = i), a > i && (a = r)) : a = $(a, r, i);
				try {
					e.pause?.();
				} catch (e) {
					console.debug?.(e);
				}
				W(a), Re();
			} catch (e) {
				console.debug?.(e);
			}
		}, G = () => {
			if (o) try {
				R();
				let { inF: e, outF: t } = z(), n = L();
				(n < e || n > t) && W(e);
			} catch (e) {
				console.debug?.(e);
			}
		}, K = () => {
			Ie();
			try {
				if (P._ppReverse) {
					P._ppReverse = !1, Je(), B();
					return;
				}
				if (e.paused) {
					G();
					let t = e.play?.();
					t && typeof t.catch == "function" && t.catch(() => {});
				} else e.pause?.();
			} catch (e) {
				console.debug?.(e);
			}
			B();
		};
		N.push(f(e, "click", (t) => {
			try {
				if (t?.target !== e) return;
			} catch (e) {
				console.debug?.(e);
			}
			K();
		})), N.push(f(me, "click", (e) => {
			j(e), K();
		})), N.push(f(he, "click", (e) => {
			j(e), Qe(-1);
		})), N.push(f(ge, "click", (e) => {
			j(e), Qe(1);
		})), N.push(f(_e, "click", (e) => {
			j(e);
			let { inF: t } = z();
			W(t), Re();
		})), N.push(f(ve, "click", (e) => {
			j(e);
			let { outF: t } = z();
			W(t), Re();
		}));
		let $e = (t) => {
			try {
				let n = Number(e?.duration);
				if (!Number.isFinite(n) || n <= 0) return !1;
				let r = p.getBoundingClientRect?.(), i = Number(r?.width) || 0;
				if (!(i > 0)) return !1;
				let a = Q($((Number(t) || 0) - Number(r.left || 0), 0, i) / i), o = a * n;
				return e.currentTime = o, Ue(), g.value = String(Math.round(a * He())), V(o), !0;
			} catch (e) {
				return console.debug?.(e), !1;
			}
		}, q = {
			active: !1,
			pointerId: null,
			ac: null
		}, J = (e = null) => {
			if (q.active) {
				e && M(e), q.active = !1, P._seeking = !1;
				try {
					p.releasePointerCapture?.(q.pointerId);
				} catch (e) {
					console.debug?.(e);
				}
				q.pointerId = null;
				try {
					q.ac?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				q.ac = null, V();
			}
		}, et = (e) => {
			q.active && (M(e), $e(e.clientX));
		};
		if (N.push(() => J()), N.push(f(p, "pointerdown", (e) => {
			try {
				if (e?.button != null && e.button !== 0 || e?.target?.closest?.(".mjr-video-seek-handle, .mjr-video-seek-mark")) return;
			} catch (e) {
				console.debug?.(e);
			}
			M(e), Ie(), P._seeking = !0, q.active = !0, q.pointerId = e?.pointerId ?? null, $e(e?.clientX);
			try {
				p.setPointerCapture?.(q.pointerId);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				q.ac?.abort?.();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				let e = new AbortController();
				q.ac = e, window.addEventListener("pointermove", et, {
					passive: !1,
					capture: !0,
					signal: e.signal
				}), window.addEventListener("pointerup", J, {
					passive: !1,
					capture: !0,
					signal: e.signal
				}), window.addEventListener("pointercancel", J, {
					passive: !1,
					capture: !0,
					signal: e.signal
				}), window.addEventListener("blur", J, { signal: e.signal });
			} catch (e) {
				console.debug?.(e);
			}
		}, { passive: !1 })), N.push(f(g, "pointerdown", () => {
			P._seeking = !0;
		})), N.push(f(g, "pointerup", () => {
			q.active || (P._seeking = !1);
		})), N.push(f(g, "pointercancel", () => {
			q.active || (P._seeking = !1);
		})), N.push(f(g, "input", (t) => {
			j(t), Ie();
			try {
				let t = Number(e?.duration);
				if (!Number.isFinite(t) || t <= 0) return;
				let n = Number(g.value);
				e.currentTime = Q((Number.isFinite(n) ? n : 0) / He()) * t;
			} catch (e) {
				console.debug?.(e);
			}
			V();
		})), o) {
			N.push(f(ye, "click", (e) => {
				j(e), P.inFrame = L(), R(), V(), H(), U({ prefer: "in" });
			})), N.push(f(be, "click", (e) => {
				j(e), P.outFrame = L(), R(), V(), H(), U({ prefer: "out" });
			})), N.push(f(S, "change", (e) => {
				j(e);
				try {
					let e = Number(S.value);
					P.inFrame = Number.isFinite(e) ? Math.max(0, Math.floor(e)) : null, R();
				} catch (e) {
					console.debug?.(e);
				}
				V(), H(), U({ prefer: "in" });
			})), N.push(f(Se, "change", (e) => {
				j(e);
				try {
					let e = Number(Se.value);
					P.outFrame = Number.isFinite(e) ? Math.max(0, Math.floor(e)) : null, R();
				} catch (e) {
					console.debug?.(e);
				}
				V(), H(), U({ prefer: "out" });
			})), N.push(f(Ce, "change", (e) => {
				j(e);
				try {
					P.step = Math.max(1, Math.floor(Number(Ce.value) || 1)), Ce.value = String(P.step);
				} catch (e) {
					console.debug?.(e);
				}
			})), N.push(f(C, "change", (e) => {
				j(e);
				try {
					P.fps = m(C.value, 30), C.value = String(P.fps), Fe(!1), R();
				} catch (e) {
					console.debug?.(e);
				}
				V(), H();
			})), N.push(f(x, "click", (e) => {
				j(e), !P.loop && !P.pingpong ? (P.loop = !0, P.pingpong = !1) : P.loop && !P.pingpong ? (P.loop = !1, P.pingpong = !0) : (P.loop = !1, P.pingpong = !1), (P.loop || P.pingpong) && (P.once = !1), P.pingpong || (P._ppReverse = !1, Je()), Be();
			})), N.push(f(De, "click", (e) => {
				j(e), Ke();
			})), N.push(f(D, "click", (e) => {
				j(e), qe();
			})), N.push(f(y, "click", (e) => {
				j(e), Xe();
			}));
			try {
				y.title = i("video.resetPlayerControls", "Reset player controls"), y.style.cursor = "pointer", y.style.userSelect = "none";
			} catch (e) {
				console.debug?.(e);
			}
		}
		N.push(f(Te, "click", (t) => {
			j(t);
			try {
				e.muted = !e.muted, T && (T.style.display = e.muted ? "none" : "inline-flex");
			} catch (e) {
				console.debug?.(e);
			}
			Ze();
		})), N.push(f(Te, "contextmenu", (e) => {
			M(e);
			try {
				if (!T) return;
				let e = T.style.display !== "none";
				T.style.display = e ? "none" : "inline-flex";
			} catch (e) {
				console.debug?.(e);
			}
			Ze();
		})), N.push(f(window, "pointerdown", (e) => {
			try {
				if (!T || T.style.display === "none" || Te.contains?.(e?.target) || T.contains?.(e?.target)) return;
				T.style.display = "none";
			} catch (e) {
				console.debug?.(e);
			}
		}, { capture: !0 })), E && N.push(f(E, "input", (t) => {
			j(t);
			try {
				let t = Q(Number(E.value) || 0);
				e.volume = t, t > .001 && (e.muted = !1);
			} catch (e) {
				console.debug?.(e);
			}
			Ze();
		})), N.push(f(w, "change", (e) => {
			j(e);
			try {
				F(Number(w.value) || 1);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				w.blur?.();
			} catch (e) {
				console.debug?.(e);
			}
		})), N.push(f(e, "ratechange", () => {
			try {
				F(Number(e.playbackRate) || P.playbackRate || 1);
			} catch (e) {
				console.debug?.(e);
			}
		}));
		let tt = () => {
			if (o) try {
				if (P._seeking || e?.paused) return;
				let { inF: t, outF: n, maxF: r } = z();
				if (r <= 0 || t <= 0 && n >= r && !P.loop && !P.pingpong && !P.once || P._ppReverse) return;
				let i = L();
				if (i >= n - Math.max(1, Math.floor(Number(P.step) || 1))) {
					if (P.pingpong) {
						Ye();
						return;
					}
					if (P.loop) {
						W(t);
						try {
							let t = e.play?.();
							t && typeof t.catch == "function" && t.catch(() => {});
						} catch (e) {
							console.debug?.(e);
						}
					} else if (P.once) {
						try {
							e.pause?.();
						} catch (e) {
							console.debug?.(e);
						}
						W(n);
					} else {
						try {
							e.pause?.();
						} catch (e) {
							console.debug?.(e);
						}
						W(n);
					}
				} else i < t && W(t);
			} catch (e) {
				console.debug?.(e);
			}
		}, Y = {
			rafId: null,
			rvfcId: null
		}, nt = () => {
			try {
				Y.rvfcId != null && typeof e?.cancelVideoFrameCallback == "function" && e.cancelVideoFrameCallback(Y.rvfcId);
			} catch (e) {
				console.debug?.(e);
			}
			Y.rvfcId = null;
			try {
				Y.rafId != null && typeof cancelAnimationFrame == "function" && cancelAnimationFrame(Y.rafId);
			} catch (e) {
				console.debug?.(e);
			}
			Y.rafId = null;
		}, rt = (t = 0, n = null) => {
			Y.rafId = null, Y.rvfcId = null;
			try {
				h(V, n?.mediaTime), h(tt);
			} catch (e) {
				console.debug?.(e);
			}
			if (!(!P._ppReverse && e?.paused || Me.signal?.aborted)) {
				try {
					if (typeof e?.requestVideoFrameCallback == "function" && !P._ppReverse) {
						Y.rvfcId = e.requestVideoFrameCallback(rt);
						return;
					}
				} catch (e) {
					console.debug?.(e);
				}
				try {
					typeof requestAnimationFrame == "function" && (Y.rafId = requestAnimationFrame((t) => {
						rt(t, { mediaTime: Number(e?.currentTime) || 0 });
					}));
				} catch (e) {
					console.debug?.(e);
				}
			}
		}, it = () => {
			nt(), !(!P._ppReverse && e?.paused || Me.signal?.aborted) && rt(0, { mediaTime: Number(e?.currentTime) || 0 });
		};
		N.push(nt), N.push(f(e, "play", () => {
			h(B), it();
		}));
		for (let t of ["pause", "ended"]) N.push(f(e, t, () => {
			nt(), h(B), h(V);
		}));
		for (let t of [
			"timeupdate",
			"loadedmetadata",
			"durationchange",
			"seeked"
		]) N.push(f(e, t, () => h(V)));
		N.push(f(e, "timeupdate", tt)), N.push(f(e, "ended", () => {
			if (o) try {
				let { inF: t, outF: n, maxF: r } = z(), i = t <= 0 && n >= r;
				if (P.pingpong && !P._ppReverse) {
					Ye();
					return;
				}
				if (!P.loop && !i) return;
				W(t);
				try {
					let t = e.play?.();
					t && typeof t.catch == "function" && t.catch(() => {});
				} catch (e) {
					console.debug?.(e);
				}
			} catch (e) {
				console.debug?.(e);
			}
		}, { passive: !0 })), a && (N.push(f(e, "loadedmetadata", () => {
			if (!o) H();
			else {
				try {
					let e = I();
					e > 0 && P.inFrame == null && P.outFrame == null && (P.inFrame = 0, P.outFrame = e, R());
				} catch (e) {
					console.debug?.(e);
				}
				H();
			}
		})), N.push(f(e, "durationchange", () => h(H)))), o && N.push(f(e, "mjr:frameStep", () => {
			h(Re);
		}));
		for (let t of ["volumechange"]) N.push(f(e, t, () => h(Ze)));
		try {
			P.fps = m(C.value, P.nativeFps || 30), Fe(!0), P.step = Math.max(1, Math.floor(Number(Ce.value) || 1)), R(), Be(), F(P.playbackRate);
		} catch (e) {
			console.debug?.(e);
		}
		h(B), h(V), h(H), h(Ze);
		try {
			(!e?.paused || P._ppReverse) && it();
		} catch (e) {
			console.debug?.(e);
		}
		let at = (e = {}) => {
			let t = 0, n = !1;
			try {
				t = Math.max(0, I()), n = t > 0 && P.outFrame != null && P.outFrame >= t - 1;
			} catch (e) {
				console.debug?.(e);
			}
			try {
				let t = Number(e?.fps);
				if (Number.isFinite(t) && t > 0) {
					if (String(e?.fpsSource || e?.source || "") === "rvfc" && Number(P.nativeFps) > 0) return;
					let n = Pe();
					P.nativeFps = m(t, P.nativeFps || 30), n || (P.fps = P.nativeFps);
					try {
						Fe(!0);
					} catch (e) {
						console.debug?.(e);
					}
				}
			} catch (e) {
				console.debug?.(e);
			}
			try {
				let t = Number(e?.frameCount);
				P.frameCount = Number.isFinite(t) && t > 0 ? Math.floor(t) : null;
			} catch {
				P.frameCount = null;
			}
			try {
				let e = Math.max(0, I());
				n && e > t + .5 && (P.outFrame = null), R(), Be(), V(), H();
			} catch (e) {
				console.debug?.(e);
			}
		};
		try {
			if (o) {
				let e = Number(t?.initialFps), n = Number(t?.initialFrameCount);
				(Number.isFinite(e) || Number.isFinite(n)) && at({
					fps: e,
					frameCount: n
				});
			}
		} catch (e) {
			console.debug?.(e);
		}
		if (o) {
			let e = {
				active: !1,
				which: null,
				pointerId: null,
				ac: null,
				captureEl: null
			}, t = (e) => {
				try {
					let t = p.getBoundingClientRect(), n = $((Number(e) || 0) - t.left, 0, t.width || 1), r = t.width > 0 ? n / t.width : 0, { maxF: i } = z();
					return $(Math.round(r * i), 0, i);
				} catch {
					return 0;
				}
			}, n = (n, a) => {
				M(n);
				try {
					e.ac?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				e.ac = null, e.active = !0, e.which = a, e.pointerId = n.pointerId;
				try {
					e.captureEl = n.currentTarget || null;
				} catch {
					e.captureEl = null;
				}
				try {
					e.captureEl?.setPointerCapture?.(n.pointerId);
				} catch (e) {
					console.debug?.(e);
				}
				try {
					p.setPointerCapture?.(n.pointerId);
				} catch (e) {
					console.debug?.(e);
				}
				try {
					let t = new AbortController();
					e.ac = t, window.addEventListener("pointermove", r, {
						passive: !1,
						capture: !0,
						signal: t.signal
					}), window.addEventListener("pointerup", i, {
						passive: !1,
						capture: !0,
						signal: t.signal
					}), window.addEventListener("pointercancel", i, {
						passive: !1,
						capture: !0,
						signal: t.signal
					});
				} catch (e) {
					console.debug?.(e);
				}
				let o = t(n.clientX);
				a === "in" ? P.inFrame = o : P.outFrame = o, R(), V(), H(), U({ prefer: a });
			}, r = (n) => {
				if (!e.active) return;
				M(n);
				let r = t(n.clientX);
				e.which === "in" ? P.inFrame = r : P.outFrame = r, R(), V(), H();
			}, i = (t) => {
				if (e.active) {
					M(t), e.active = !1;
					try {
						p.releasePointerCapture?.(e.pointerId);
					} catch (e) {
						console.debug?.(e);
					}
					try {
						e.captureEl?.releasePointerCapture?.(e.pointerId);
					} catch (e) {
						console.debug?.(e);
					}
					e.captureEl = null, e.pointerId = null;
					try {
						U({ prefer: e.which });
					} catch (e) {
						console.debug?.(e);
					}
					try {
						e.ac?.abort?.();
					} catch (e) {
						console.debug?.(e);
					}
					e.ac = null;
				}
			};
			N.push(f(ue, "pointerdown", (e) => n(e, "in"), { passive: !1 })), N.push(f(de, "pointerdown", (e) => n(e, "out"), { passive: !1 })), N.push(f(oe, "pointerdown", (e) => n(e, "in"), { passive: !1 })), N.push(f(se, "pointerdown", (e) => n(e, "out"), { passive: !1 })), N.push(f(p, "pointermove", r, { passive: !1 })), N.push(f(p, "pointerup", i, { passive: !1 })), N.push(f(p, "pointercancel", i, { passive: !1 }));
		}
		return h(() => c.appendChild(l)), {
			controlsEl: l,
			setMediaInfo: at,
			setPlaybackRate: (e) => {
				try {
					return F(e);
				} catch {
					return P.playbackRate || 1;
				}
			},
			getPlaybackRate: () => {
				try {
					return Number(P.playbackRate) || 1;
				} catch {
					return 1;
				}
			},
			adjustPlaybackRate: (e) => {
				try {
					let t = Number(e);
					return Number.isFinite(t) ? F((Number(P.playbackRate) || 1) + t) : P.playbackRate || 1;
				} catch {
					return P.playbackRate || 1;
				}
			},
			togglePlay: () => {
				try {
					return K(), !0;
				} catch {
					return !1;
				}
			},
			stepFrames: (e) => {
				try {
					return Qe(e), !0;
				} catch {
					return !1;
				}
			},
			setInPoint: () => {
				if (!o) return !1;
				try {
					return P.inFrame = L(), R(), V(), H(), U({ prefer: "in" }), !0;
				} catch {
					return !1;
				}
			},
			setOutPoint: () => {
				if (!o) return !1;
				try {
					return P.outFrame = L(), R(), V(), H(), U({ prefer: "out" }), !0;
				} catch {
					return !1;
				}
			},
			goToIn: () => {
				if (!o) return !1;
				try {
					let { inF: e } = z();
					return W(e), Re(), !0;
				} catch {
					return !1;
				}
			},
			goToOut: () => {
				if (!o) return !1;
				try {
					let { outF: e } = z();
					return W(e), Re(), !0;
				} catch {
					return !1;
				}
			},
			destroy: () => {
				for (let e of N) h(e);
				h(() => l.remove());
			}
		};
	} catch {
		return {
			controlsEl: null,
			destroy: ee
		};
	}
}
export { De as C, Se as D, E, S as O, Ee as S, Te as T, M as _, yt as a, Ae as b, nt as c, lt as d, ke as f, j as g, N as h, Nt as i, ct as l, A as m, Pt as n, ut as o, k as p, Ft as r, dt as s, Zt as t, st as u, Ne as v, T as w, Oe as x, je as y };
