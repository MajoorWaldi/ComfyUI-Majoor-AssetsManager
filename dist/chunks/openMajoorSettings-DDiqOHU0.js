import { A as e, E as t, J as n, R as r, Y as i, b as a, j as o, m as s } from "./events-BpkKbGZs.js";
import { a as c, n as l } from "./graphTraversal-CjIZsRsP.js";
import { S as u } from "./SidebarWorkflowSection-BkH7KoSY.js";
//#region ui/features/viewer/floatingViewerProgress.ts
var d = "progress-update", f = "__MJR_MFV_PROGRESS_SERVICE__";
function p() {
	return typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : {};
}
function m(e, t) {
	if (typeof CustomEvent == "function") return new CustomEvent(e, { detail: t });
	let n = typeof Event == "function" ? new Event(e) : { type: e };
	return n.detail = t, n;
}
var h = class {
	constructor(e, t = () => o()) {
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
}, g = class extends EventTarget {
	constructor({ getApi: t = (t) => e(t), getApp: r = () => o(), waitForApi: i = (e) => n(e) } = {}) {
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
		return n || (n = new h(t, this._getApp), this.promptsMap.set(t, n)), n;
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
		this._queuePromptBinding = i({
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
						e.setPrompt(r), t.currentExecution ||= e, t.dispatchEvent(m("queue-prompt", { prompt: e })), t.dispatchProgressUpdate();
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
		this.dispatchEvent(m(d, this.getSnapshot()));
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
}, _ = p(), v = _[f] || new g();
_[f] || (_[f] = v);
function y(e = {}) {
	return v.ensureInitialized(e);
}
function b(e) {
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
function x(e) {
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
function S(e, t) {
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
	if (e._progressCurrentNodeId = r || null, e._progressEl && (e._progressNodesEl.style.width = i, e._progressStepsEl.style.width = a, e._progressTextEl.textContent = b(t), e._progressEl.classList.toggle("is-error", o), e._progressEl.classList.toggle("is-clickable", !!r), e._progressEl.title = r ? "Execution progress - click to center active node" : "Execution progress"), e._mediaProgressEl) {
		let n = x(t);
		e._mediaProgressTextEl.textContent = n, e._mediaProgressEl.title = n || "", e._mediaProgressEl.classList.toggle("is-error", o), e._mediaProgressEl.classList.toggle("is-visible", !!n);
	}
}
function C(e, t) {
	let n = String(t || "").trim();
	if (!n) return !1;
	try {
		return a(n, o());
	} catch (e) {
		return console.debug?.(e), !1;
	}
}
function w(e) {
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
		t.button === 0 && C(e, e._progressCurrentNodeId) && (t.preventDefault(), t.stopPropagation());
	}), e._progressEl = t, e._progressNodesEl = n, e._progressStepsEl = r, e._progressTextEl = a, e._progressUpdateHandler && v.removeEventListener(d, e._progressUpdateHandler), e._progressUpdateHandler = (t) => {
		S(e, t?.detail || v.getSnapshot());
	}, v.addEventListener(d, e._progressUpdateHandler), y({ timeoutMs: 4e3 }).catch((e) => {
		console.debug?.(e);
	}), S(e, v.getSnapshot()), t;
}
function T(e) {
	let t = document.createElement("div");
	t.className = "mjr-mfv-media-progress", t.setAttribute("aria-hidden", "true");
	let n = document.createElement("span");
	return n.className = "mjr-mfv-media-progress-text", t.appendChild(n), e._mediaProgressEl = t, e._mediaProgressTextEl = n, S(e, v.getSnapshot()), t;
}
function E(e) {
	if (e?._progressUpdateHandler) try {
		v.removeEventListener(d, e._progressUpdateHandler);
	} catch (e) {
		console.debug?.(e);
	}
	e._progressUpdateHandler = null, e._progressCurrentNodeId = null, e._progressEl = null, e._progressNodesEl = null, e._progressStepsEl = null, e._progressTextEl = null, e._mediaProgressEl = null, e._mediaProgressTextEl = null;
}
//#endregion
//#region ui/features/viewer/workflowSidebar/widgetAdapters.ts
function D(e, t, n = null) {
	switch (String(e?.type || "").toLowerCase()) {
		case "number":
		case "int":
		case "float": return A(e, t, n);
		case "combo": return j(e, t, n);
		case "text":
		case "string":
		case "customtext": return M(e, t, n);
		case "toggle":
		case "boolean": return N(e, t, n);
		default: return P(e);
	}
}
function O(e, n, i = null) {
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
		e.callback?.(e.value, n, o, null, e), (a === "number" || a === "int" || a === "float") && (e.value = s), k(e), r(o);
	} catch (e) {
		console.debug?.("[MFV] writeWidgetValue", e);
	}
	return !0;
}
function k(e) {
	let t = String(e.value ?? ""), n = e?.inputEl ?? e?.element ?? e?.el ?? e?.cachedDeepestByFrame?.widget?.inputEl ?? e?.cachedDeepestByFrame?.widget?.element ?? e?.cachedDeepestByFrame?.widget?.el ?? null;
	n != null && "value" in n && n.value !== t && (n.value = t);
}
function A(e, t, n = null) {
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
		i === "" || i === "-" || i === "." || i.endsWith(".") || (O(e, i, n), t?.(e.value));
	}), r.addEventListener("change", () => {
		O(e, r.value, n) && (r.value = String(e.value), t?.(e.value));
	}), r;
}
function j(e, t, n = null) {
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
		O(e, r.value, n) && t?.(e.value);
	}), r;
}
function M(e, t, n = null) {
	let r = document.createElement("div");
	r.className = "mjr-ws-text-wrapper";
	let i = document.createElement("textarea");
	i.className = "mjr-ws-input mjr-ws-textarea", i.value = e.value ?? "", i.rows = 2;
	let a = () => {
		i.style.height = "auto", i.style.height = i.scrollHeight + "px";
	};
	return i.addEventListener("change", () => {
		O(e, i.value, n) && t?.(e.value);
	}), i.addEventListener("input", () => {
		O(e, i.value, n), t?.(e.value), a();
	}), r.appendChild(i), r._mjrAutoFit = a, i._mjrAutoFit = a, requestAnimationFrame(a), r;
}
function N(e, t, n = null) {
	let r = document.createElement("label");
	r.className = "mjr-ws-toggle-label";
	let i = document.createElement("input");
	return i.type = "checkbox", i.className = "mjr-ws-checkbox", i.checked = !!e.value, i.addEventListener("change", () => {
		O(e, i.checked, n) && t?.(e.value);
	}), r.appendChild(i), r;
}
function P(e) {
	let t = document.createElement("input");
	return t.type = "text", t.className = "mjr-ws-input mjr-ws-readonly", t.value = e.value == null ? "" : String(e.value), t.readOnly = !0, t.tabIndex = -1, t;
}
//#endregion
//#region ui/app/settings/MajoorSettingsDialog.ts
var F = "mjr-settings-dialog", I = "mjr-settings-dialog-style", L = null, R = {
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
function z() {
	if (typeof document > "u" || document.getElementById(I)) return;
	let e = document.createElement("style");
	e.id = I, e.textContent = `
#${F} {
    position: fixed;
    inset: 0;
    z-index: 10080;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.48);
    color: var(--fg-color, #ddd);
    font: 13px/1.4 system-ui, -apple-system, Segoe UI, sans-serif;
}
#${F}[hidden] { display: none; }
#${F} .mjr-settings-panel {
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
#${F} .mjr-settings-head,
#${F} .mjr-settings-tools {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.10);
}
#${F} .mjr-settings-title {
    font-weight: 700;
    font-size: 14px;
    flex: 1;
}
#${F} .mjr-settings-close,
#${F} .mjr-settings-reset {
    border: 1px solid rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.06);
    color: inherit;
    border-radius: 6px;
    min-height: 30px;
    padding: 0 10px;
    cursor: pointer;
}
#${F} .mjr-settings-close {
    width: 30px;
    padding: 0;
}
#${F} .mjr-settings-search {
    flex: 1;
    min-width: 160px;
    height: 30px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    background: rgba(0, 0, 0, 0.22);
    color: inherit;
    padding: 0 10px;
}
#${F} .mjr-settings-body {
    overflow: auto;
    padding: 12px;
}
#${F} .mjr-settings-stack {
    display: grid;
    gap: 10px;
}
#${F} .mjr-settings-group {
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.035);
    overflow: hidden;
}
#${F} .mjr-settings-group summary {
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
#${F} .mjr-settings-group summary::-webkit-details-marker {
    display: none;
}
#${F} .mjr-settings-group-icon {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.07);
    color: var(--input-text, #fff);
}
#${F} .mjr-settings-group-title {
    color: var(--input-text, #fff);
    font-weight: 700;
}
#${F} .mjr-settings-group-meta {
    opacity: 0.68;
    font-size: 12px;
}
#${F} .mjr-settings-chevron {
    transition: transform 0.16s ease;
}
#${F} details[open] > summary .mjr-settings-chevron {
    transform: rotate(90deg);
}
#${F} .mjr-settings-group-body {
    padding: 4px 11px 11px;
}
#${F} .mjr-settings-subgroup {
    margin-top: 8px;
}
#${F} .mjr-settings-subgroup-title {
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
#${F} .mjr-settings-subgroup-title::after {
    content: "";
    height: 1px;
    flex: 1;
    background: rgba(255, 255, 255, 0.10);
}
#${F} .mjr-settings-row {
    display: grid;
    grid-template-columns: minmax(220px, 1fr) minmax(180px, 280px);
    align-items: center;
    gap: 16px;
    padding: 9px 0;
    border-top: 1px solid rgba(255, 255, 255, 0.07);
}
#${F} .mjr-settings-name {
    font-weight: 600;
    color: var(--p-primary-color, var(--comfy-accent, #8ab4f8));
}
#${F} .mjr-settings-tip {
    margin-top: 2px;
    opacity: 0.72;
    font-size: 12px;
}
#${F} input,
#${F} select {
    min-height: 30px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    background: rgba(0, 0, 0, 0.22);
    color: inherit;
    padding: 0 8px;
}
#${F} input[type="checkbox"] {
    justify-self: end;
    width: 18px;
    min-height: 18px;
}
#${F} input[type="color"] {
    padding: 2px;
    width: 56px;
    justify-self: end;
}
@media (max-width: 620px) {
    #${F} .mjr-settings-row {
        grid-template-columns: 1fr;
        gap: 8px;
    }
}
`, document.head.appendChild(e);
}
function B(e) {
	return String(e || "").replace(/^\s*Majoor:\s*/i, "").trim();
}
function V(e) {
	let t = Array.isArray(e?.category) ? e.category : [];
	return String(t[1] || "General").trim() || "General";
}
function H(e) {
	return (Array.isArray(e?.category) ? e.category : []).slice(2).filter(Boolean).join(" / ") || "General";
}
function U(e) {
	return R[e] || {
		icon: "pi pi-sliders-h",
		label: e || "General"
	};
}
function W(e, t) {
	return t ? [
		e?.id,
		e?.name,
		e?.tooltip,
		...Array.isArray(e?.category) ? e.category : []
	].join(" ").toLowerCase().includes(t) : !0;
}
function G(e, t) {
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
function K(e) {
	let t = String(e?.type || "text").toLowerCase(), n = e?.defaultValue, r;
	if (t === "boolean") return r = document.createElement("input"), r.type = "checkbox", r.checked = !!n, r.addEventListener("change", () => G(e, r.checked)), r;
	if (t === "combo") {
		r = document.createElement("select");
		for (let t of e?.options || []) {
			let e = document.createElement("option"), n = t && typeof t == "object" ? t.value ?? t.text ?? t.label : t;
			e.value = String(n ?? ""), e.textContent = String(t && typeof t == "object" ? t.text ?? t.label ?? t.value : t), r.appendChild(e);
		}
		return r.value = String(n ?? ""), r.addEventListener("change", () => G(e, r.value)), r;
	}
	if (r = document.createElement("input"), r.type = t === "color" ? "color" : t === "number" ? "number" : t === "password" ? "password" : "text", e?.attrs && typeof e.attrs == "object") for (let [t, n] of Object.entries(e.attrs)) n != null && r.setAttribute(t, String(n));
	r.value = String(n ?? "");
	let i = t === "color" ? "input" : "change";
	return r.addEventListener(i, () => {
		G(e, t === "number" ? Number(r.value) : r.value);
	}), r;
}
function q(e, t, n = "") {
	e.replaceChildren();
	let r = document.createElement("div");
	r.className = "mjr-settings-stack", e.appendChild(r);
	let i = /* @__PURE__ */ new Map();
	for (let e of t || []) {
		if (!W(e, n)) continue;
		let t = V(e), r = H(e);
		i.has(t) || i.set(t, /* @__PURE__ */ new Map());
		let a = i.get(t);
		a.has(r) || a.set(r, []), a.get(r).push(e);
	}
	for (let [e, t] of i.entries()) {
		let i = Array.from(t.values()).flat(), a = U(e), o = document.createElement("details");
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
				if (i.className = "mjr-settings-name", i.textContent = B(e?.name) || e?.id || "Setting", r.appendChild(i), e?.tooltip) {
					let t = document.createElement("div");
					t.className = "mjr-settings-tip", t.textContent = String(e.tooltip), r.appendChild(t);
				}
				n.appendChild(r), n.appendChild(K(e)), t.appendChild(n);
			}
			p.appendChild(t);
		}
		o.appendChild(p), r.appendChild(o);
	}
}
function J() {
	z();
	let e = document.createElement("div");
	e.id = F, e.hidden = !0, e.addEventListener("click", (t) => {
		t.target === e && Y();
	});
	let t = document.createElement("div");
	t.className = "mjr-settings-panel", t.setAttribute("role", "dialog"), t.setAttribute("aria-modal", "true");
	let n = document.createElement("div");
	n.className = "mjr-settings-head";
	let r = document.createElement("div");
	r.className = "mjr-settings-title", r.textContent = s("settings.majoor.title", "Majoor Assets Manager Settings");
	let i = document.createElement("button");
	i.type = "button", i.className = "mjr-settings-close", i.textContent = "X", i.setAttribute("aria-label", s("btn.close", "Close")), i.addEventListener("click", Y), n.append(r, i);
	let a = document.createElement("div");
	a.className = "mjr-settings-tools";
	let o = document.createElement("input");
	o.type = "search", o.className = "mjr-settings-search", o.placeholder = s("placeholder.searchSettings", "Search settings"), a.appendChild(o);
	let c = document.createElement("div");
	return c.className = "mjr-settings-body", t.append(n, a, c), e.appendChild(t), document.body.appendChild(e), {
		body: c,
		root: e,
		search: o
	};
}
function Y() {
	L?.root && (L.root.hidden = !0);
}
function X(e = o()) {
	if (typeof document > "u") return !1;
	L?.root?.isConnected || (L = J());
	let t = u(e), n = () => q(L.body, t, String(L.search.value || "").trim().toLowerCase());
	return L.search.oninput = n, L.search.value = "", n(), L.root.hidden = !1, setTimeout(() => L?.search?.focus?.(), 0), !0;
}
//#endregion
//#region ui/app/openMajoorSettings.ts
function Z(e = o()) {
	return X(e);
}
try {
	typeof window < "u" && (window.MajoorAssetsManager = window.MajoorAssetsManager || {}, window.MajoorAssetsManager.openSettings = Z);
} catch (e) {
	console.debug?.(e);
}
//#endregion
export { w as a, v as c, T as i, D as n, E as o, O as r, y as s, Z as t };
