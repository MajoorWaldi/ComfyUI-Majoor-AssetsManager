import { Bt as e, Wt as t, a as n, o as r, u as i } from "./hostAdapter-D6BwD-lN.js";
import { t as a } from "./config-dvcltBqE.js";
import { B as o, S as s, b as c, g as l, x as u } from "./SidebarWorkflowSection-CxD2u7Bb.js";
import { a as d, n as f } from "./graphTraversal-HdtD9lDa.js";
import { n as p, t as m } from "./state-DPiaUMw1.js";
//#region ui/features/viewer/floatingViewerProgress.ts
var h = "progress-update", g = Symbol.for("mjr.mfv.progress.queuePromptPatch"), _ = "__MJR_MFV_PROGRESS_SERVICE__";
function v() {
	return typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : {};
}
function y(e, t) {
	if (typeof CustomEvent == "function") return new CustomEvent(e, { detail: t });
	let n = typeof Event == "function" ? new Event(e) : { type: e };
	return n.detail = t, n;
}
var ee = class {
	constructor(e, t = () => r()) {
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
			let t = this._getApp?.(), r = f(d(t), e);
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
}, b = class extends EventTarget {
	constructor({ getApi: e = (e) => n(e), getApp: t = () => r(), waitForApi: a = (e) => i(e) } = {}) {
		super(), this._getApi = e, this._getApp = t, this._waitForApi = a, this.promptsMap = /* @__PURE__ */ new Map(), this.currentExecution = null, this.lastQueueRemaining = 0, this._api = null, this._listenerEntries = [], this._initPromise = null;
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
		return n || (n = new ee(t, this._getApp), this.promptsMap.set(t, n)), n;
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
		if (!e || typeof e.queuePrompt != "function") return;
		let t = e.queuePrompt?.[g];
		if (t?.service === this || t?.service && t.service !== this) return;
		let n = e.queuePrompt, r = this, i = async function(e, t, ...i) {
			let a;
			try {
				a = await n.apply(this, [
					e,
					t,
					...i
				]);
			} catch (e) {
				let t = r.getOrMakePrompt("error");
				throw t.error({ exception_type: "Unknown." }), r.currentExecution = t, r.dispatchProgressUpdate(), e;
			}
			let o = String(a?.prompt_id || a?.promptId || "").trim();
			if (o) {
				let e = r.getOrMakePrompt(o);
				e.setPrompt(t), r.currentExecution ||= e, r.dispatchEvent(y("queue-prompt", { prompt: e })), r.dispatchProgressUpdate();
			}
			return a;
		};
		Object.defineProperty(i, g, {
			configurable: !0,
			value: {
				service: r,
				originalQueuePrompt: n
			}
		}), e.queuePrompt = i;
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
		this.dispatchEvent(y(h, this.getSnapshot()));
	}
	dispose({ resetPatchedQueuePrompt: e = !1, keepState: t = !1 } = {}) {
		for (let { api: e, type: t, handler: n } of this._listenerEntries.splice(0)) try {
			e?.removeEventListener?.(t, n);
		} catch (e) {
			console.debug?.(e);
		}
		if (e && this._api?.queuePrompt?.[g]?.service === this) try {
			let e = this._api.queuePrompt[g]?.originalQueuePrompt || null;
			typeof e == "function" && (this._api.queuePrompt = e);
		} catch (e) {
			console.debug?.(e);
		}
		this._api = null, t || (this.promptsMap.clear(), this.currentExecution = null, this.lastQueueRemaining = 0);
	}
}, x = v(), S = x[_] || new b();
x[_] || (x[_] = S);
function C(e = {}) {
	return S.ensureInitialized(e);
}
function te(e) {
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
function w(e) {
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
function T(e, t) {
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
	if (e._progressCurrentNodeId = r || null, e._progressEl && (e._progressNodesEl.style.width = i, e._progressStepsEl.style.width = a, e._progressTextEl.textContent = te(t), e._progressEl.classList.toggle("is-error", o), e._progressEl.classList.toggle("is-clickable", !!r), e._progressEl.title = r ? "Execution progress - click to center active node" : "Execution progress"), e._mediaProgressEl) {
		let n = w(t);
		e._mediaProgressTextEl.textContent = n, e._mediaProgressEl.title = n || "", e._mediaProgressEl.classList.toggle("is-error", o), e._mediaProgressEl.classList.toggle("is-visible", !!n);
	}
}
function ne(e, t) {
	let n = String(t || "").trim();
	if (!n) return !1;
	try {
		let e = r(), t = e?.canvas || null, i = f(d(e), n);
		return !i || typeof t?.centerOnNode != "function" ? !1 : (t.centerOnNode(i), !0);
	} catch (e) {
		return console.debug?.(e), !1;
	}
}
function re(e) {
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
		t.button === 0 && ne(e, e._progressCurrentNodeId) && (t.preventDefault(), t.stopPropagation());
	}), e._progressEl = t, e._progressNodesEl = n, e._progressStepsEl = r, e._progressTextEl = a, e._progressUpdateHandler && S.removeEventListener(h, e._progressUpdateHandler), e._progressUpdateHandler = (t) => {
		T(e, t?.detail || S.getSnapshot());
	}, S.addEventListener(h, e._progressUpdateHandler), C({ timeoutMs: 4e3 }).catch((e) => {
		console.debug?.(e);
	}), T(e, S.getSnapshot()), t;
}
function ie(e) {
	let t = document.createElement("div");
	t.className = "mjr-mfv-media-progress", t.setAttribute("aria-hidden", "true");
	let n = document.createElement("span");
	return n.className = "mjr-mfv-media-progress-text", t.appendChild(n), e._mediaProgressEl = t, e._mediaProgressTextEl = n, T(e, S.getSnapshot()), t;
}
function ae(e) {
	if (e?._progressUpdateHandler) try {
		S.removeEventListener(h, e._progressUpdateHandler);
	} catch (e) {
		console.debug?.(e);
	}
	e._progressUpdateHandler = null, e._progressCurrentNodeId = null, e._progressEl = null, e._progressNodesEl = null, e._progressStepsEl = null, e._progressTextEl = null, e._mediaProgressEl = null, e._mediaProgressTextEl = null;
}
//#endregion
//#region ui/components/VideoControls.ts
var oe = 400, se = 1e3, ce = 220;
function le(e, t, n) {
	try {
		if (e?.aborted) return c;
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
		return c;
	}
}
function E(e) {
	let t = Math.floor(Number(e) || 0);
	return t < 10 ? `0${t}` : String(t);
}
function ue(e) {
	let t = Number(e);
	if (!Number.isFinite(t) || t < 0) return "0:00";
	let n = Math.floor(t), r = Math.floor(n / 3600), i = Math.floor(n % 3600 / 60), a = n % 60;
	return r > 0 ? `${r}:${E(i)}:${E(a)}` : `${i}:${E(a)}`;
}
function de(e, t, n) {
	let r = document.createElement("button");
	r.type = "button", r.className = `mjr-video-btn ${e || ""}`.trim(), n && (r.title = n);
	try {
		r.setAttribute("aria-label", n || t || "Button");
	} catch (e) {
		console.debug?.(e);
	}
	return r.textContent = t, r;
}
function fe(e, t, n, r) {
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
function pe(e, { min: t, max: n, step: r, value: i, title: a, ariaLabel: o, widthPx: s } = {}) {
	let c = document.createElement("input");
	return c.type = "number", c.className = `mjr-video-num ${e || ""}`.trim(), a && (c.title = a), o && c.setAttribute("aria-label", o), t != null && (c.min = String(t)), n != null && (c.max = String(n)), r != null && (c.step = String(r)), i != null && (c.value = String(i)), s != null && (c.style.width = `${s}px`), c;
}
function me(e) {
	try {
		return e?.variant === "preview" ? "preview" : e?.variant === "viewerbar" ? "viewerbar" : "viewer";
	} catch {
		return "viewer";
	}
}
function he(e) {
	try {
		let t = Number(e?.initialFps);
		return Number.isFinite(t) && t > 0 ? t : null;
	} catch {
		return null;
	}
}
function ge(t, n) {
	let r = [];
	try {
		t.controls = !1, t.loop = !0, t.muted = !0, t.playsInline = !0, t.autoplay = !0;
	} catch (e) {
		console.debug?.(e);
	}
	let i = document.createElement("div");
	i.className = "mjr-video-controls mjr-video-controls--preview";
	try {
		i.setAttribute("role", "group"), i.setAttribute("aria-label", e("video.previewControls", "Video preview controls"));
	} catch (e) {
		console.debug?.(e);
	}
	let a = document.createElement("button");
	a.type = "button", a.className = "mjr-video-preview-btn", a.title = e("video.playPause", "Play/Pause");
	try {
		a.setAttribute("aria-label", e("video.playPause", "Play/Pause"));
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
	a.appendChild(o), i.appendChild(a);
	let c = () => {
		try {
			o.className = `pi ${t?.paused ? "pi-play" : "pi-pause"}`;
		} catch (e) {
			console.debug?.(e);
		}
	}, l = () => {
		try {
			let e = t.play?.();
			e && typeof e.catch == "function" && e.catch(() => {});
		} catch (e) {
			console.debug?.(e);
		}
	}, d = (e) => {
		try {
			e?.stopPropagation?.();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			t.paused ? l() : t.pause?.();
		} catch (e) {
			console.debug?.(e);
		}
		c();
	};
	try {
		n.appendChild(i);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		l();
	} catch (e) {
		console.debug?.(e);
	}
	r.push(u(t, "loadedmetadata", () => l(), { passive: !0 })), r.push(u(t, "canplay", () => l(), { passive: !0 })), r.push(u(a, "click", d)), r.push(u(t, "play", c, { passive: !0 })), r.push(u(t, "pause", c, { passive: !0 })), r.push(u(t, "ended", () => l(), { passive: !0 }));
	try {
		c();
	} catch (e) {
		console.debug?.(e);
	}
	return {
		controlsEl: i,
		destroy: () => {
			try {
				for (let e of r) s(() => e?.());
			} catch (e) {
				console.debug?.(e);
			}
			try {
				i.remove?.();
			} catch (e) {
				console.debug?.(e);
			}
		}
	};
}
function _e(t, n = {}) {
	try {
		let r = me(n), i = String(n?.mediaKind || "video").toLowerCase() === "audio", a = r === "viewerbar", o = r !== "preview" && !i, d = he(n), f = n?.hostEl || t?.parentElement;
		if (!t || !f) return {
			controlsEl: null,
			destroy: c
		};
		if (r === "preview") return ge(t, f);
		try {
			t.loop = !1;
		} catch (e) {
			console.debug?.(e);
		}
		s(() => f.classList?.add("mjr-video-host")), s(() => t.classList?.add("mjr-video-el")), s(() => {
			window.getComputedStyle?.(f)?.position === "static" && (f.style.position = "relative");
		});
		let h = document.createElement("div");
		h.className = `mjr-video-controls mjr-video-controls--${r}`, a && h.classList.add("mjr-video-controls--modern"), h.dataset.mjrLayout = "regular", h.setAttribute("role", "group"), h.setAttribute("aria-label", i ? e("video.audioControls", "Audio controls") : e("video.controls", "Video controls"));
		let g = document.createElement("div");
		g.className = "mjr-video-row mjr-video-row--top";
		let _ = document.createElement("div");
		_.className = "mjr-video-row mjr-video-row--bottom", h.appendChild(g), h.appendChild(_);
		let v = document.createElement("div");
		v.className = "mjr-video-seek-wrap";
		let y = document.createElement("input");
		y.className = "mjr-video-range mjr-video-range--seek", y.type = "range", y.min = "0", y.max = String(se), y.step = "1", y.value = "0", y.setAttribute("aria-label", e("video.seek", "Seek")), y.title = i ? e("video.seekThroughAudio", "Seek through audio") : e("video.seekThrough", "Seek through video");
		let ee = document.createElement("div");
		ee.className = "mjr-video-seek-overlay";
		let b = null, x = null, S = null, C = null;
		o && (b = document.createElement("div"), b.className = "mjr-video-seek-zones", x = document.createElement("div"), x.className = "mjr-video-seek-zone mjr-video-seek-zone--leftTrim", S = document.createElement("div"), S.className = "mjr-video-seek-zone mjr-video-seek-zone--selected", C = document.createElement("div"), C.className = "mjr-video-seek-zone mjr-video-seek-zone--rightTrim", b.appendChild(x), b.appendChild(S), b.appendChild(C));
		let te = document.createElement("div");
		te.className = "mjr-video-seek-ticks";
		let w = document.createElement("div");
		w.className = "mjr-video-seek-labels";
		let T = document.createElement("div");
		T.className = "mjr-video-seek-mark mjr-video-seek-mark--in";
		let ne = document.createElement("div");
		ne.className = "mjr-video-seek-mark mjr-video-seek-mark--out";
		let re = document.createElement("div");
		re.className = "mjr-video-seek-playhead";
		let ie = document.createElement("div");
		ie.className = "mjr-video-seek-playhead-label", ee.appendChild(te), ee.appendChild(w), ee.appendChild(re), ee.appendChild(ie);
		let ae = document.createElement("div");
		ae.className = "mjr-video-seek-handle mjr-video-seek-handle--in", ae.title = e("video.dragSetIn", "Drag to set In"), ae.setAttribute("aria-label", e("video.dragSetIn", "Drag to set In"));
		let E = document.createElement("div");
		E.className = "mjr-video-seek-handle mjr-video-seek-handle--out", E.title = e("video.dragSetOut", "Drag to set Out"), E.setAttribute("aria-label", e("video.dragSetOut", "Drag to set Out")), v.appendChild(y), b && v.appendChild(b), v.appendChild(ee), v.appendChild(T), v.appendChild(ne), v.appendChild(ae), v.appendChild(E);
		let _e = document.createElement("span");
		_e.className = "mjr-video-time", _e.textContent = "0:00 / 0:00", _e.title = e("video.currentTimeTotal", "Current time / Total duration");
		let D = document.createElement("span");
		D.className = "mjr-video-range-count", D.textContent = "";
		try {
			D.style.display = "none";
		} catch (e) {
			console.debug?.(e);
		}
		let ve = document.createElement("div");
		ve.className = "mjr-video-timegroup", ve.appendChild(_e), o && ve.appendChild(D);
		let O = document.createElement("span");
		O.className = "mjr-video-frame", O.textContent = "F: 0", O.title = e("video.currentFrame", "Current frame number");
		let ye = de("mjr-video-btn--play", e("btn.play", "Play"), e("video.playPauseSpace", "Play/Pause (Space)")), be = de("mjr-video-btn--step", "<", e("video.stepBack", "Step back")), xe = de("mjr-video-btn--step", ">", e("video.stepForward", "Step forward")), Se = de("mjr-video-btn--jump mjr-video-btn--in", "|<", e("video.goToIn", "Go to In")), Ce = de("mjr-video-btn--jump mjr-video-btn--out", ">|", e("video.goToOut", "Go to Out")), we = de("mjr-video-btn--mark mjr-video-btn--in", "I", e("video.setInFromCurrent", "Set In from current frame")), Te = de("mjr-video-btn--mark mjr-video-btn--out", "O", e("video.setOutFromCurrent", "Set Out from current frame")), Ee = fe("mjr-video-btn--toggle", "pi-refresh", e("video.loopPlaybackInRange", "Loop playback in range"), e("video.loop", "Loop")), De = Ee.btn, k = pe("mjr-video-num--in", {
			min: 0,
			step: 1,
			value: 0,
			title: e("video.inFrame", "In frame"),
			ariaLabel: e("video.inFrame", "In frame"),
			widthPx: 72
		}), Oe = pe("mjr-video-num--out", {
			min: 0,
			step: 1,
			value: 0,
			title: e("video.outFrame", "Out frame"),
			ariaLabel: e("video.outFrame", "Out frame"),
			widthPx: 72
		}), A = pe("mjr-video-num--step", {
			min: 1,
			step: 1,
			value: 1,
			title: e("video.frameIncrement", "Frame increment"),
			ariaLabel: e("video.frameIncrement", "Frame increment"),
			widthPx: 56
		}), j = pe("mjr-video-num--fps", {
			min: 1,
			step: .001,
			value: l(d || 30),
			title: e("video.fpsStepping", "FPS (used for frame stepping)"),
			ariaLabel: e("video.fps", "FPS"),
			widthPx: 56
		}), M = document.createElement("select");
		M.className = "mjr-video-num mjr-video-num--speed", M.title = e("video.playbackSpeed", "Playback speed"), M.setAttribute("aria-label", e("video.playbackSpeed", "Playback speed")), M.style.width = "74px";
		for (let e of [
			.25,
			.5,
			.75,
			1,
			1.25,
			1.5,
			2
		]) {
			let t = document.createElement("option");
			t.value = String(e), t.textContent = `${e}x`, M.appendChild(t);
		}
		let ke = fe("mjr-video-btn--mute", "pi-volume-up", e("video.mute", "Mute"), e("video.mute", "Mute")), N = ke.btn, P = document.createElement("div");
		P.className = "mjr-video-volume-wrap", P.style.cssText = "display:none; align-items:center; position:relative;";
		let F = null;
		F = document.createElement("input"), F.className = "mjr-video-range mjr-video-range--volume", F.type = "range", F.min = "0", F.max = "1", F.step = "0.02", F.value = String(p(Number(t.volume) || 0)), F.setAttribute("aria-label", e("video.volume", "Volume")), F.title = e("video.volume", "Volume");
		try {
			F.style.width = "120px";
		} catch (e) {
			console.debug?.(e);
		}
		P.appendChild(F);
		let I = document.createElement("div");
		I.className = "mjr-video-group mjr-video-group--in";
		let Ae = document.createElement("span");
		Ae.textContent = "In", Ae.title = e("video.resetInToStart", "Reset In to start"), Ae.style.cssText = "cursor:pointer; user-select:none;", o && (I.appendChild(Ae), I.appendChild(k));
		let je = document.createElement("div");
		je.className = "mjr-video-group mjr-video-group--out";
		let Me = document.createElement("span");
		Me.textContent = "Out", Me.title = e("video.resetOutToEnd", "Reset Out to end"), Me.style.cssText = "cursor:pointer; user-select:none;", o && (je.appendChild(Me), je.appendChild(Oe));
		let L = document.createElement("div");
		L.className = "mjr-video-group mjr-video-group--adjust-left", o && (L.appendChild(we), L.appendChild(document.createTextNode(e("video.step", "Step"))), L.appendChild(A), L.appendChild(document.createTextNode(e("video.fps", "FPS"))), L.appendChild(j), L.appendChild(O));
		let Ne = document.createElement("div");
		Ne.className = "mjr-video-group mjr-video-group--adjust-right", o && (Ne.appendChild(ve), Ne.appendChild(De));
		let Pe = document.createElement("div");
		Pe.className = "mjr-video-group mjr-video-group--speed", Pe.appendChild(document.createTextNode(e("video.speed", "Speed"))), Pe.appendChild(M);
		let Fe = document.createElement("div");
		Fe.className = "mjr-video-bottom mjr-video-bottom--left";
		let R = document.createElement("div");
		R.className = "mjr-video-transport";
		let z = document.createElement("div");
		if (z.className = "mjr-video-bottom mjr-video-bottom--right", i || (R.appendChild(Se), R.appendChild(be)), R.appendChild(ye), i || (R.appendChild(xe), R.appendChild(Ce)), o && Fe.appendChild(L), o && z.appendChild(Ne), z.appendChild(Pe), z.appendChild(N), o && z.appendChild(Te), F && z.appendChild(P), a) {
			let e = document.createElement("div");
			e.className = "mjr-video-bar-timeline", o && e.appendChild(I), e.appendChild(v), o && e.appendChild(je);
			let t = document.createElement("div");
			t.className = "mjr-video-bar-actions";
			let n = document.createElement("div");
			n.className = "mjr-video-bar-side mjr-video-bar-side--left", o && n.appendChild(L);
			let r = document.createElement("div");
			r.className = "mjr-video-bar-center", r.appendChild(R);
			let i = document.createElement("div");
			i.className = "mjr-video-bar-side mjr-video-bar-side--right", o && i.appendChild(Ne), i.appendChild(Pe), i.appendChild(N), o && i.appendChild(Te), F && i.appendChild(P), t.appendChild(n), t.appendChild(r), t.appendChild(i), h.replaceChildren(e, t);
		} else o && g.appendChild(O), o && g.appendChild(I), g.appendChild(v), o && g.appendChild(je), g.appendChild(ve), _.appendChild(Fe), _.appendChild(R), _.appendChild(z);
		let B = (e) => {
			try {
				e.stopPropagation?.();
			} catch (e) {
				console.debug?.(e);
			}
		}, V = (e) => {
			try {
				e.preventDefault?.();
			} catch (e) {
				console.debug?.(e);
			}
			B(e);
		}, H = [], Ie = (() => {
			try {
				return new AbortController();
			} catch {
				return {
					signal: {
						aborted: !1,
						addEventListener: c,
						removeEventListener: c
					},
					abort: c
				};
			}
		})();
		H.push(() => {
			try {
				Ie.abort();
			} catch (e) {
				console.debug?.(e);
			}
		});
		let Le = () => {
			try {
				let e = Number(f?.clientWidth) || Number(h?.clientWidth) || 0, t = "regular";
				e > 0 && e < 560 ? t = "stacked" : e > 0 && e < 860 && (t = "compact"), h.dataset.mjrLayout = t;
			} catch (e) {
				console.debug?.(e);
			}
		};
		Le();
		try {
			if (typeof ResizeObserver == "function" && f) {
				let e = typeof requestAnimationFrame == "function" ? requestAnimationFrame : null, t = typeof cancelAnimationFrame == "function" ? cancelAnimationFrame : null, n = 0, r = new ResizeObserver(e ? () => {
					n ||= e(() => {
						n = 0, Le();
					});
				} : () => Le());
				r.observe(f), H.push(() => {
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
		H.push(u(h, "pointerdown", B)), H.push(u(h, "dblclick", V, { capture: !0 })), H.push(u(h, "wheel", V, {
			capture: !0,
			passive: !1
		})), H.push(u(window, "dblclick", (e) => {
			try {
				h.contains?.(e?.target) && V(e);
			} catch (e) {
				console.debug?.(e);
			}
		}, { capture: !0 })), H.push(u(window, "wheel", (e) => {
			try {
				h.contains?.(e?.target) && V(e);
			} catch (e) {
				console.debug?.(e);
			}
		}, {
			capture: !0,
			passive: !1
		}));
		let U = {
			outFrame: null,
			frameCount: null,
			loop: o,
			pingpong: !1,
			once: !1,
			playbackRate: Math.max(.25, Math.min(2, Number(n?.initialPlaybackRate) || 1)),
			_seeking: !1,
			_ppReverse: !1,
			_ppRafId: null,
			_userInteracted: !1
		}, Re = () => {
			if (!U._userInteracted) {
				U._userInteracted = !0;
				try {
					t.muted && (t.muted = !1, Qe?.());
				} catch (e) {
					console.debug?.(e);
				}
			}
		}, ze = null, Be = () => {
			if (o) try {
				O.classList.add("is-step");
				try {
					ze?.();
				} catch (e) {
					console.debug?.(e);
				}
				ze = le(Ie.signal, ce, () => {
					try {
						O.classList.remove("is-step");
					} catch (e) {
						console.debug?.(e);
					}
				});
			} catch (e) {
				console.debug?.(e);
			}
		};
		H.push(() => {
			try {
				ze?.();
			} catch (e) {
				console.debug?.(e);
			}
			ze = null;
			try {
				O?.classList?.remove?.("is-step");
			} catch (e) {
				console.debug?.(e);
			}
		});
		let Ve = (e, t) => {
			try {
				if (!e) return;
				t ? e.classList.add("is-on") : e.classList.remove("is-on");
			} catch (e) {
				console.debug?.(e);
			}
		}, He = (e) => {
			try {
				let n = Number(e);
				if (!Number.isFinite(n) || n <= 0) return U.playbackRate;
				let r = Math.max(.25, Math.min(2, Math.round(n * 100) / 100));
				U.playbackRate = r;
				try {
					t.playbackRate = r;
				} catch (e) {
					console.debug?.(e);
				}
				try {
					M.matches?.(":focus") || (M.value = String(r));
				} catch (e) {
					console.debug?.(e);
				}
				return r;
			} catch {
				return U.playbackRate;
			}
		}, Ue = () => {
			try {
				Ve(De, !!(U.loop || U.pingpong));
				try {
					Ee?.icon && (U.pingpong ? (Ee.icon.className = "pi pi-sort-alt", De.title = e("video.pingpongPlayback", "Ping-pong playback (forward then reverse)")) : (Ee.icon.className = "pi pi-refresh", De.title = e("video.loopPlaybackInRange", "Loop playback in range")));
				} catch (e) {
					console.debug?.(e);
				}
			} catch (e) {
				console.debug?.(e);
			}
		}, We = () => {
			try {
				let e = Number(U.frameCount);
				if (Number.isFinite(e) && e > 0) return Math.max(1, Math.floor(e));
				let n = Number(t?.duration), r = l(U.fps, 30);
				return !Number.isFinite(n) || n <= 0 ? 0 : Math.max(0, Math.floor(n * r));
			} catch {
				return 0;
			}
		}, W = (e = null) => {
			try {
				let n = e ?? t?.currentTime, r = Number(n), i = l(U.fps, 30);
				return !Number.isFinite(r) || r < 0 ? 0 : Math.max(0, Math.floor(r * i + 1e-6));
			} catch {
				return 0;
			}
		}, Ge = (e) => {
			let t = l(U.fps, 30);
			return Math.max(0, Number(e) || 0) / t;
		}, G = () => {
			try {
				let e = We();
				if (e <= 0) return;
				let t = U.inFrame == null ? 0 : m(U.inFrame, 0, e), n = U.outFrame == null ? e : m(U.outFrame, 0, e);
				n < t ? (U.inFrame = n, U.outFrame = t) : (U.inFrame = t, U.outFrame = n);
			} catch (e) {
				console.debug?.(e);
			}
		}, K = () => {
			try {
				let e = We();
				return {
					inF: U.inFrame == null ? 0 : m(U.inFrame, 0, e),
					outF: U.outFrame == null ? e : m(U.outFrame, 0, e),
					maxF: e
				};
			} catch {
				return {
					inF: 0,
					outF: 0,
					maxF: 0
				};
			}
		}, q = () => {
			try {
				ye.textContent = !t?.paused || U._ppReverse ? e("video.pause", "Pause") : e("video.play", "Play");
			} catch (e) {
				console.debug?.(e);
			}
		}, Ke = () => {
			try {
				let n = !!t?.muted || (Number(t?.volume) || 0) <= .001;
				try {
					ke.icon.className = `pi ${n ? "pi-volume-off" : "pi-volume-up"}`;
				} catch (e) {
					console.debug?.(e);
				}
				let r = n ? e("video.unmute", "Unmute") : e("video.mute", "Mute");
				N.title = r, N.setAttribute("aria-label", r);
			} catch (e) {
				console.debug?.(e);
			}
		}, J = (e = null) => {
			try {
				let n = Number(t?.duration), r = e ?? t?.currentTime, i = Number(r), a = Number.isFinite(n) && n > 0;
				if (_e.textContent = `${ue(i)} / ${a ? ue(n) : "0:00"}`, y.disabled = !a, a) {
					let e = p((i || 0) / n), t = Math.round(e * 1e3);
					!Number.isNaN(t) && !U._seeking && !y.matches?.(":active") && (y.value = String(t));
					try {
						re.style.left = `${e * 100}%`;
					} catch (e) {
						console.debug?.(e);
					}
				} else {
					y.value = "0";
					try {
						re.style.left = "0%";
					} catch (e) {
						console.debug?.(e);
					}
				}
				if (o) {
					let e = We(), t = W(i);
					O.textContent = `F: ${t} / ${e}`;
					try {
						if (Number.isFinite(n) && n > 0) {
							let e = p((i || 0) / n);
							ie.style.left = `${e * 100}%`, ie.textContent = String(t), ie.style.display = "";
						} else ie.style.display = "none";
					} catch (e) {
						console.debug?.(e);
					}
					k.matches?.(":focus") || (k.value = String(U.inFrame ?? 0)), Oe.matches?.(":focus") || (Oe.value = String(U.outFrame ?? e));
					try {
						let { inF: e, outF: t, maxF: n } = K(), r = e <= 0 && t >= n, i = Math.max(0, Math.floor(t) - Math.floor(e) + 1);
						!r && n > 0 ? (D.textContent = `R: ${i}f`, D.style.display = "") : D.style.display = "none";
					} catch (e) {
						console.debug?.(e);
					}
				}
			} catch (e) {
				console.debug?.(e);
			}
		}, Y = () => {
			if (o) try {
				let { inF: e, outF: t, maxF: n } = K();
				if (!Number.isFinite(n) || n <= 0) return;
				let r = p(e / n) * 100, i = p(t / n) * 100, a = e <= 0 && t >= n;
				try {
					y.style.background = "";
				} catch (e) {
					console.debug?.(e);
				}
				try {
					let e = p(r / 100) * 100, t = p(i / 100) * 100, n = Math.min(e, t), o = Math.max(e, t);
					if (b && x && S && C) {
						x.style.left = "0%", x.style.width = `${n}%`, S.style.left = `${n}%`, S.style.width = `${Math.max(0, o - n)}%`, C.style.left = `${o}%`, C.style.width = `${Math.max(0, 100 - o)}%`;
						try {
							b.classList.toggle("is-trimmed", !a), b.classList.toggle("is-fullrange", a);
						} catch (e) {
							console.debug?.(e);
						}
					}
				} catch (e) {
					console.debug?.(e);
				}
				try {
					T.style.left = `${r}%`, ne.style.left = `${i}%`;
				} catch (e) {
					console.debug?.(e);
				}
				try {
					ae.style.left = `${r}%`, E.style.left = `${i}%`;
				} catch (e) {
					console.debug?.(e);
				}
				try {
					let e = Math.max(1, Math.floor(n / oe)), t = Math.max(e, Math.floor(Number(U.step) || 1)), r = t / n * 100, i = r * 10;
					if (Number.isFinite(r) && r > .02) {
						let e = `repeating-linear-gradient(to right, rgba(255,255,255,0.16) 0, rgba(255,255,255,0.16) 1px, transparent 1px, transparent ${r}%)`, t = `repeating-linear-gradient(to right, rgba(255,255,255,0.28) 0, rgba(255,255,255,0.28) 1px, transparent 1px, transparent ${i}%)`;
						te.style.backgroundImage = `${t}, ${e}`;
					} else te.style.backgroundImage = "";
					(() => {
						try {
							let e = `${n}|${t}`;
							if (w?.dataset?.mjrLabelKey === e) return;
							w.dataset.mjrLabelKey = e;
						} catch (e) {
							console.debug?.(e);
						}
						try {
							w.replaceChildren();
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
							let r = p(e / n) * 100;
							return t.style.left = `${r}%`, t.textContent = String(Math.floor(e)), t;
						};
						try {
							w.appendChild(r(0));
						} catch (e) {
							console.debug?.(e);
						}
						for (let t = e; t < n; t += e) try {
							w.appendChild(r(t));
						} catch (e) {
							console.debug?.(e);
						}
						try {
							w.appendChild(r(n));
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
		}, X = ({ prefer: e = null } = {}) => {
			if (o) try {
				G();
				let { inF: t, outF: n } = K(), r = W();
				e === "in" ? Z(t) : e === "out" ? r > n && Z(n) : r < t ? Z(t) : r > n && Z(n);
			} catch (e) {
				console.debug?.(e);
			}
		}, qe = () => {
			try {
				U.inFrame = 0, G(), J(), Y(), X({ prefer: "in" });
			} catch (e) {
				console.debug?.(e);
			}
		}, Je = () => {
			try {
				let { maxF: e } = K();
				U.outFrame = Math.max(0, Number(e) || 0), G(), J(), Y(), X({ prefer: "out" });
			} catch (e) {
				console.debug?.(e);
			}
		}, Ye = () => {
			try {
				U._ppRafId != null && (cancelAnimationFrame(U._ppRafId), U._ppRafId = null);
			} catch (e) {
				console.debug?.(e);
			}
		};
		H.push(Ye);
		let Xe = () => {
			try {
				Ye(), U._ppReverse = !0, t.pause?.(), q();
				let e = 1e3 / (l(U.fps, 30) * Math.max(.25, Number(U.playbackRate) || 1)), n = performance.now(), r = (i) => {
					try {
						if (!U._ppReverse || !U.pingpong) {
							U._ppReverse = !1, q();
							return;
						}
						let a = i - n;
						if (a >= e) {
							n = i - a % e;
							let { inF: r } = K(), o = W();
							if (o <= r) {
								U._ppReverse = !1, Z(r);
								let e = t.play?.();
								e && typeof e.catch == "function" && e.catch(() => {}), q(), J();
								return;
							}
							Z(o - Math.max(1, Math.floor(Number(U.step) || 1))), J();
						}
						U._ppRafId = requestAnimationFrame(r);
					} catch (e) {
						console.debug?.(e), U._ppReverse = !1, q();
					}
				};
				U._ppRafId = requestAnimationFrame(r);
			} catch (e) {
				console.debug?.(e), U._ppReverse = !1;
			}
		}, Ze = () => {
			try {
				let e = We();
				U.inFrame = 0, U.outFrame = e > 0 ? e : null, U.step = 1, U.loop = !!o, U.pingpong = !1, U._ppReverse = !1, Ye(), U.once = !1, He(1);
				try {
					A.value = "1";
				} catch (e) {
					console.debug?.(e);
				}
				try {
					M.matches?.(":focus") || (M.value = "1");
				} catch (e) {
					console.debug?.(e);
				}
				G(), Ue(), J(), Y(), X({ prefer: "in" });
			} catch (e) {
				console.debug?.(e);
			}
		}, Qe = () => {
			try {
				let e = p(Number(t?.volume) || 0);
				try {
					F && !F.matches?.(":active") && (F.value = String(e));
				} catch (e) {
					console.debug?.(e);
				}
				Ke();
			} catch (e) {
				console.debug?.(e);
			}
		}, Z = (e) => {
			try {
				let { maxF: n } = K();
				t.currentTime = Ge(m(e, 0, n > 0 ? n : Infinity));
			} catch (e) {
				console.debug?.(e);
			}
			J();
		}, $e = (e) => {
			Re();
			try {
				let n = Math.max(1, Math.floor(Number(U.step) || 1)), { inF: r, outF: i } = K(), a = W() + e * n;
				U.loop ? (a < r && (a = i), a > i && (a = r)) : a = m(a, r, i);
				try {
					t.pause?.();
				} catch (e) {
					console.debug?.(e);
				}
				Z(a), Be();
			} catch (e) {
				console.debug?.(e);
			}
		}, et = () => {
			if (o) try {
				G();
				let { inF: e, outF: t } = K(), n = W();
				(n < e || n > t) && Z(e);
			} catch (e) {
				console.debug?.(e);
			}
		}, tt = () => {
			Re();
			try {
				if (U._ppReverse) {
					U._ppReverse = !1, Ye(), q();
					return;
				}
				if (t.paused) {
					et();
					let e = t.play?.();
					e && typeof e.catch == "function" && e.catch(() => {});
				} else t.pause?.();
			} catch (e) {
				console.debug?.(e);
			}
			q();
		};
		H.push(u(t, "click", (e) => {
			try {
				if (e?.target !== t) return;
			} catch (e) {
				console.debug?.(e);
			}
			tt();
		})), H.push(u(ye, "click", (e) => {
			B(e), tt();
		})), H.push(u(be, "click", (e) => {
			B(e), $e(-1);
		})), H.push(u(xe, "click", (e) => {
			B(e), $e(1);
		})), H.push(u(Se, "click", (e) => {
			B(e);
			let { inF: t } = K();
			Z(t), Be();
		})), H.push(u(Ce, "click", (e) => {
			B(e);
			let { outF: t } = K();
			Z(t), Be();
		}));
		let nt = (e) => {
			try {
				let n = Number(t?.duration);
				if (!Number.isFinite(n) || n <= 0) return !1;
				let r = v.getBoundingClientRect?.(), i = Number(r?.width) || 0;
				if (!(i > 0)) return !1;
				let a = p(m((Number(e) || 0) - Number(r.left || 0), 0, i) / i), o = a * n;
				return t.currentTime = o, y.value = String(Math.round(a * se)), J(o), !0;
			} catch (e) {
				return console.debug?.(e), !1;
			}
		}, Q = {
			active: !1,
			pointerId: null,
			ac: null
		}, rt = (e = null) => {
			if (Q.active) {
				e && V(e), Q.active = !1, U._seeking = !1;
				try {
					v.releasePointerCapture?.(Q.pointerId);
				} catch (e) {
					console.debug?.(e);
				}
				Q.pointerId = null;
				try {
					Q.ac?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				Q.ac = null, J();
			}
		}, it = (e) => {
			Q.active && (V(e), nt(e.clientX));
		};
		if (H.push(() => rt()), H.push(u(v, "pointerdown", (e) => {
			try {
				if (e?.button != null && e.button !== 0 || e?.target?.closest?.(".mjr-video-seek-handle, .mjr-video-seek-mark")) return;
			} catch (e) {
				console.debug?.(e);
			}
			V(e), Re(), U._seeking = !0, Q.active = !0, Q.pointerId = e?.pointerId ?? null, nt(e?.clientX);
			try {
				v.setPointerCapture?.(Q.pointerId);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				Q.ac?.abort?.();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				let e = new AbortController();
				Q.ac = e, window.addEventListener("pointermove", it, {
					passive: !1,
					capture: !0,
					signal: e.signal
				}), window.addEventListener("pointerup", rt, {
					passive: !1,
					capture: !0,
					signal: e.signal
				}), window.addEventListener("pointercancel", rt, {
					passive: !1,
					capture: !0,
					signal: e.signal
				}), window.addEventListener("blur", rt, { signal: e.signal });
			} catch (e) {
				console.debug?.(e);
			}
		}, { passive: !1 })), H.push(u(y, "pointerdown", () => {
			U._seeking = !0;
		})), H.push(u(y, "pointerup", () => {
			Q.active || (U._seeking = !1);
		})), H.push(u(y, "pointercancel", () => {
			Q.active || (U._seeking = !1);
		})), H.push(u(y, "input", (e) => {
			B(e), Re();
			try {
				let e = Number(t?.duration);
				if (!Number.isFinite(e) || e <= 0) return;
				let n = Number(y.value);
				t.currentTime = p((Number.isFinite(n) ? n : 0) / 1e3) * e;
			} catch (e) {
				console.debug?.(e);
			}
			J();
		})), o) {
			H.push(u(we, "click", (e) => {
				B(e), U.inFrame = W(), G(), J(), Y(), X({ prefer: "in" });
			})), H.push(u(Te, "click", (e) => {
				B(e), U.outFrame = W(), G(), J(), Y(), X({ prefer: "out" });
			})), H.push(u(k, "change", (e) => {
				B(e);
				try {
					let e = Number(k.value);
					U.inFrame = Number.isFinite(e) ? Math.max(0, Math.floor(e)) : null, G();
				} catch (e) {
					console.debug?.(e);
				}
				J(), Y(), X({ prefer: "in" });
			})), H.push(u(Oe, "change", (e) => {
				B(e);
				try {
					let e = Number(Oe.value);
					U.outFrame = Number.isFinite(e) ? Math.max(0, Math.floor(e)) : null, G();
				} catch (e) {
					console.debug?.(e);
				}
				J(), Y(), X({ prefer: "out" });
			})), H.push(u(A, "change", (e) => {
				B(e);
				try {
					U.step = Math.max(1, Math.floor(Number(A.value) || 1)), A.value = String(U.step);
				} catch (e) {
					console.debug?.(e);
				}
			})), H.push(u(j, "change", (e) => {
				B(e);
				try {
					U.fps = l(j.value, 30), j.value = String(U.fps), G();
				} catch (e) {
					console.debug?.(e);
				}
				J(), Y();
			})), H.push(u(De, "click", (e) => {
				B(e), !U.loop && !U.pingpong ? (U.loop = !0, U.pingpong = !1) : U.loop && !U.pingpong ? (U.loop = !1, U.pingpong = !0) : (U.loop = !1, U.pingpong = !1), (U.loop || U.pingpong) && (U.once = !1), U.pingpong || (U._ppReverse = !1, Ye()), Ue();
			})), H.push(u(Ae, "click", (e) => {
				B(e), qe();
			})), H.push(u(Me, "click", (e) => {
				B(e), Je();
			})), H.push(u(D, "click", (e) => {
				B(e), Ze();
			}));
			try {
				D.title = e("video.resetPlayerControls", "Reset player controls"), D.style.cursor = "pointer", D.style.userSelect = "none";
			} catch (e) {
				console.debug?.(e);
			}
		}
		H.push(u(N, "click", (e) => {
			B(e);
			try {
				t.muted = !t.muted, P && (P.style.display = t.muted ? "none" : "inline-flex");
			} catch (e) {
				console.debug?.(e);
			}
			Qe();
		})), H.push(u(N, "contextmenu", (e) => {
			V(e);
			try {
				if (!P) return;
				let e = P.style.display !== "none";
				P.style.display = e ? "none" : "inline-flex";
			} catch (e) {
				console.debug?.(e);
			}
			Qe();
		})), H.push(u(window, "pointerdown", (e) => {
			try {
				if (!P || P.style.display === "none" || N.contains?.(e?.target) || P.contains?.(e?.target)) return;
				P.style.display = "none";
			} catch (e) {
				console.debug?.(e);
			}
		}, { capture: !0 })), F && H.push(u(F, "input", (e) => {
			B(e);
			try {
				let e = p(Number(F.value) || 0);
				t.volume = e, e > .001 && (t.muted = !1);
			} catch (e) {
				console.debug?.(e);
			}
			Qe();
		})), H.push(u(M, "change", (e) => {
			B(e);
			try {
				He(Number(M.value) || 1);
			} catch (e) {
				console.debug?.(e);
			}
		})), H.push(u(t, "ratechange", () => {
			try {
				He(Number(t.playbackRate) || U.playbackRate || 1);
			} catch (e) {
				console.debug?.(e);
			}
		}));
		let at = () => {
			if (o) try {
				if (U._seeking || t?.paused) return;
				let { inF: e, outF: n, maxF: r } = K();
				if (r <= 0 || e <= 0 && n >= r && !U.loop && !U.pingpong && !U.once || U._ppReverse) return;
				let i = W();
				if (i >= n - Math.max(1, Math.floor(Number(U.step) || 1))) if (U.pingpong) {
					Xe();
					return;
				} else if (U.loop) {
					Z(e);
					try {
						let e = t.play?.();
						e && typeof e.catch == "function" && e.catch(() => {});
					} catch (e) {
						console.debug?.(e);
					}
				} else if (U.once) {
					try {
						t.pause?.();
					} catch (e) {
						console.debug?.(e);
					}
					Z(n);
				} else {
					try {
						t.pause?.();
					} catch (e) {
						console.debug?.(e);
					}
					Z(n);
				}
				else i < e && Z(e);
			} catch (e) {
				console.debug?.(e);
			}
		}, $ = {
			rafId: null,
			rvfcId: null
		}, ot = () => {
			try {
				$.rvfcId != null && typeof t?.cancelVideoFrameCallback == "function" && t.cancelVideoFrameCallback($.rvfcId);
			} catch (e) {
				console.debug?.(e);
			}
			$.rvfcId = null;
			try {
				$.rafId != null && typeof cancelAnimationFrame == "function" && cancelAnimationFrame($.rafId);
			} catch (e) {
				console.debug?.(e);
			}
			$.rafId = null;
		}, st = (e = 0, n = null) => {
			$.rafId = null, $.rvfcId = null;
			try {
				s(J, n?.mediaTime), s(at);
			} catch (e) {
				console.debug?.(e);
			}
			if (!(!(U._ppReverse || !t?.paused) || Ie.signal?.aborted)) {
				try {
					if (typeof t?.requestVideoFrameCallback == "function" && !U._ppReverse) {
						$.rvfcId = t.requestVideoFrameCallback(st);
						return;
					}
				} catch (e) {
					console.debug?.(e);
				}
				try {
					typeof requestAnimationFrame == "function" && ($.rafId = requestAnimationFrame((e) => {
						st(e, { mediaTime: Number(t?.currentTime) || 0 });
					}));
				} catch (e) {
					console.debug?.(e);
				}
			}
		}, ct = () => {
			ot(), !(!(U._ppReverse || !t?.paused) || Ie.signal?.aborted) && st(0, { mediaTime: Number(t?.currentTime) || 0 });
		};
		H.push(ot), H.push(u(t, "play", () => {
			s(q), ct();
		}));
		for (let e of ["pause", "ended"]) H.push(u(t, e, () => {
			ot(), s(q), s(J);
		}));
		for (let e of [
			"timeupdate",
			"loadedmetadata",
			"durationchange",
			"seeked"
		]) H.push(u(t, e, () => s(J)));
		H.push(u(t, "timeupdate", at)), H.push(u(t, "ended", () => {
			if (o) try {
				let { inF: e, outF: n, maxF: r } = K(), i = e <= 0 && n >= r;
				if (U.pingpong && !U._ppReverse) {
					Xe();
					return;
				}
				if (!U.loop && !i) return;
				Z(e);
				try {
					let e = t.play?.();
					e && typeof e.catch == "function" && e.catch(() => {});
				} catch (e) {
					console.debug?.(e);
				}
			} catch (e) {
				console.debug?.(e);
			}
		}, { passive: !0 })), o && H.push(u(t, "mjr:frameStep", () => {
			s(Be);
		})), o && (H.push(u(t, "loadedmetadata", () => {
			try {
				let e = We();
				e > 0 && U.inFrame == null && U.outFrame == null && (U.inFrame = 0, U.outFrame = e, G());
			} catch (e) {
				console.debug?.(e);
			}
			Y();
		})), H.push(u(t, "durationchange", () => s(Y))));
		for (let e of ["volumechange"]) H.push(u(t, e, () => s(Qe)));
		try {
			U.fps = l(j.value, 30), U.step = Math.max(1, Math.floor(Number(A.value) || 1)), G(), Ue(), He(U.playbackRate);
		} catch (e) {
			console.debug?.(e);
		}
		s(q), s(J), s(Y), s(Qe);
		try {
			(!t?.paused || U._ppReverse) && ct();
		} catch (e) {
			console.debug?.(e);
		}
		let lt = (e = {}) => {
			let t = 0, n = !1;
			try {
				t = Math.max(0, We()), n = t > 0 && U.outFrame != null && U.outFrame >= t - 1;
			} catch (e) {
				console.debug?.(e);
			}
			try {
				let t = Number(e?.fps);
				if (Number.isFinite(t) && t > 0) {
					U.fps = l(t, U.fps || 30);
					try {
						j?.matches?.(":focus") || (j.value = String(U.fps));
					} catch (e) {
						console.debug?.(e);
					}
				}
			} catch (e) {
				console.debug?.(e);
			}
			try {
				let t = Number(e?.frameCount);
				U.frameCount = Number.isFinite(t) && t > 0 ? Math.floor(t) : null;
			} catch {
				U.frameCount = null;
			}
			try {
				let e = Math.max(0, We());
				n && e > t + .5 && (U.outFrame = null), G(), Ue(), J(), Y();
			} catch (e) {
				console.debug?.(e);
			}
		};
		try {
			if (o) {
				let e = Number(n?.initialFps), t = Number(n?.initialFrameCount);
				(Number.isFinite(e) || Number.isFinite(t)) && lt({
					fps: e,
					frameCount: t
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
					let t = v.getBoundingClientRect(), n = m((Number(e) || 0) - t.left, 0, t.width || 1), r = t.width > 0 ? n / t.width : 0, { maxF: i } = K();
					return m(Math.round(r * i), 0, i);
				} catch {
					return 0;
				}
			}, n = (n, a) => {
				V(n);
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
					v.setPointerCapture?.(n.pointerId);
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
				a === "in" ? U.inFrame = o : U.outFrame = o, G(), J(), Y(), X({ prefer: a });
			}, r = (n) => {
				if (!e.active) return;
				V(n);
				let r = t(n.clientX);
				e.which === "in" ? U.inFrame = r : U.outFrame = r, G(), J(), Y();
			}, i = (t) => {
				if (e.active) {
					V(t), e.active = !1;
					try {
						v.releasePointerCapture?.(e.pointerId);
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
						X({ prefer: e.which });
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
			H.push(u(ae, "pointerdown", (e) => n(e, "in"), { passive: !1 })), H.push(u(E, "pointerdown", (e) => n(e, "out"), { passive: !1 })), H.push(u(T, "pointerdown", (e) => n(e, "in"), { passive: !1 })), H.push(u(ne, "pointerdown", (e) => n(e, "out"), { passive: !1 })), H.push(u(v, "pointermove", r, { passive: !1 })), H.push(u(v, "pointerup", i, { passive: !1 })), H.push(u(v, "pointercancel", i, { passive: !1 }));
		}
		return s(() => f.appendChild(h)), {
			controlsEl: h,
			setMediaInfo: lt,
			setPlaybackRate: (e) => {
				try {
					return He(e);
				} catch {
					return U.playbackRate || 1;
				}
			},
			getPlaybackRate: () => {
				try {
					return Number(U.playbackRate) || 1;
				} catch {
					return 1;
				}
			},
			adjustPlaybackRate: (e) => {
				try {
					let t = Number(e);
					return Number.isFinite(t) ? He((Number(U.playbackRate) || 1) + t) : U.playbackRate || 1;
				} catch {
					return U.playbackRate || 1;
				}
			},
			togglePlay: () => {
				try {
					return tt(), !0;
				} catch {
					return !1;
				}
			},
			stepFrames: (e) => {
				try {
					return $e(e), !0;
				} catch {
					return !1;
				}
			},
			setInPoint: () => {
				if (!o) return !1;
				try {
					return U.inFrame = W(), G(), J(), Y(), X({ prefer: "in" }), !0;
				} catch {
					return !1;
				}
			},
			setOutPoint: () => {
				if (!o) return !1;
				try {
					return U.outFrame = W(), G(), J(), Y(), X({ prefer: "out" }), !0;
				} catch {
					return !1;
				}
			},
			goToIn: () => {
				if (!o) return !1;
				try {
					let { inF: e } = K();
					return Z(e), Be(), !0;
				} catch {
					return !1;
				}
			},
			goToOut: () => {
				if (!o) return !1;
				try {
					let { outF: e } = K();
					return Z(e), Be(), !0;
				} catch {
					return !1;
				}
			},
			destroy: () => {
				for (let e of H) s(e);
				s(() => h.remove());
			}
		};
	} catch {
		return {
			controlsEl: null,
			destroy: c
		};
	}
}
//#endregion
//#region ui/features/viewer/mediaPlayer.ts
function D(e) {
	let t = String(e || "").toLowerCase();
	return t === "video" || t === "audio";
}
function ve({ mode: e, VIEWER_MODES: t, singleView: n, abView: r, sideView: i } = {}) {
	try {
		let a = n;
		return e === t?.AB_COMPARE ? a = r : e === t?.SIDE_BY_SIDE && (a = i), a ? Array.from(a.querySelectorAll?.(".mjr-viewer-video-src, .mjr-viewer-audio-src") || []) : [];
	} catch {
		return [];
	}
}
function O(e) {
	try {
		let t = Array.isArray(e) ? e : [];
		return t.find((e) => String(e?.dataset?.mjrCompareRole || "") === "A") || t[0] || null;
	} catch {
		return null;
	}
}
function ye(e, t = {}) {
	try {
		if (!e) return null;
		let n = String(t?.mediaKind || "").toLowerCase();
		return _e(e, {
			...t,
			mediaKind: n
		});
	} catch {
		return null;
	}
}
//#endregion
//#region ui/utils/tooltipShortcuts.ts
function be(e, t) {
	let n = String(e || "").trim(), r = String(t || "").trim();
	if (!r) return n;
	if (!n) return r;
	if (r.length === 1) {
		let e = r.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		if (RegExp(`\\(${e}\\)|\\b${e}\\b`, "i").test(n)) return n;
	} else if (n.toLowerCase().includes(r.toLowerCase())) return n;
	return `${n} (${r})`;
}
function xe(e, t, n, { setAriaLabel: r = !0, ariaLabel: i = null } = {}) {
	if (!e) return "";
	let a = be(t, n);
	if (e.title = a, r) {
		let r = i ?? t;
		e.setAttribute("aria-label", be(r, n));
	}
	return a;
}
//#endregion
//#region ui/features/viewer/videoSync.ts
var Se = () => {
	try {
		return !!a?.DEBUG_VIEWER;
	} catch {
		return !1;
	}
};
function Ce(e, t, { threshold: n = .15 } = {}) {
	let r = new AbortController();
	try {
		if (!e) return r;
		let i = Array.isArray(t) ? t.filter((t) => t && t !== e) : [];
		if (!i.length) return r;
		let a = !1, o = (e) => {
			try {
				let t = e.play?.();
				t && typeof t.catch == "function" && t.catch(() => {});
			} catch (e) {
				console.debug?.(e);
			}
		}, s = () => {
			if (!a) try {
				let t = Number(e.currentTime) || 0;
				for (let e of i) try {
					Math.abs((Number(e.currentTime) || 0) - t) > n && (a = !0, e.currentTime = t, a = !1);
				} catch {
					a = !1;
				}
			} catch {
				a = !1;
			}
		}, c = (e) => {
			if (!a) for (let t of i) try {
				e ? o(t) : t.pause?.();
			} catch (e) {
				console.debug?.(e);
			}
		}, l = () => {
			if (!a) for (let t of i) try {
				t.muted = !!e.muted, t.volume = Number(e.volume) || 0;
			} catch (e) {
				console.debug?.(e);
			}
		}, u = () => {
			if (!a) for (let t of i) try {
				t.playbackRate = Number(e.playbackRate) || 1;
			} catch (e) {
				console.debug?.(e);
			}
		};
		try {
			for (let e of i) {
				try {
					e.muted = !0;
				} catch (e) {
					console.debug?.(e);
				}
				try {
					e.loop = !1;
				} catch (e) {
					console.debug?.(e);
				}
			}
		} catch (e) {
			console.debug?.(e);
		}
		try {
			l(), u(), s(), e.paused || c(!0);
		} catch (e) {
			console.debug?.(e);
		}
		e.addEventListener("play", () => c(!0), {
			signal: r.signal,
			passive: !0
		}), e.addEventListener("pause", () => c(!1), {
			signal: r.signal,
			passive: !0
		}), e.addEventListener("timeupdate", s, {
			signal: r.signal,
			passive: !0
		}), e.addEventListener("seeking", s, {
			signal: r.signal,
			passive: !0
		}), e.addEventListener("seeked", s, {
			signal: r.signal,
			passive: !0
		}), e.addEventListener("ended", s, {
			signal: r.signal,
			passive: !0
		}), e.addEventListener("volumechange", l, {
			signal: r.signal,
			passive: !0
		}), e.addEventListener("ratechange", u, {
			signal: r.signal,
			passive: !0
		});
		try {
			for (let t of i) try {
				t.addEventListener("ended", () => {
					if (!a) {
						try {
							a = !0, t.currentTime = Number(e.currentTime) || 0;
						} catch (e) {
							console.debug?.(e);
						} finally {
							a = !1;
						}
						try {
							e.paused || o(t);
						} catch (e) {
							console.debug?.(e);
						}
					}
				}, {
					signal: r.signal,
					passive: !0
				});
			} catch (e) {
				console.debug?.(e);
			}
		} catch (e) {
			console.debug?.(e);
		}
		try {
			for (let e of i) try {
				e.addEventListener("loadedmetadata", s, {
					signal: r.signal,
					passive: !0,
					once: !0
				});
			} catch (e) {
				console.debug?.(e);
			}
		} catch (e) {
			console.debug?.(e);
		}
	} catch (e) {
		if (Se()) try {
			console.warn("[Viewer] follower video sync setup failed", e);
		} catch (e) {
			console.debug?.(e);
		}
	}
	return r;
}
//#endregion
//#region ui/utils/dom.ts
function we(e, t) {
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
function Te(e) {
	let t = String(e ?? "");
	try {
		if (typeof CSS?.escape == "function") return CSS.escape(t);
	} catch (e) {
		console.debug?.(e);
	}
	return t.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, "\\$1");
}
async function Ee(e) {
	try {
		return navigator?.clipboard?.writeText ? (await navigator.clipboard.writeText(String(e ?? "")), !0) : !1;
	} catch {
		return !1;
	}
}
//#endregion
//#region ui/features/viewer/workflowSidebar/widgetAdapters.ts
function De(e, t, n = null) {
	switch (String(e?.type || "").toLowerCase()) {
		case "number":
		case "int":
		case "float": return A(e, t, n);
		case "combo": return j(e, t, n);
		case "text":
		case "string":
		case "customtext": return M(e, t, n);
		case "toggle":
		case "boolean": return ke(e, t, n);
		default: return N(e);
	}
}
function k(e, t, n = null) {
	if (!e) return !1;
	let i = String(e.type || "").toLowerCase();
	if (i === "number" || i === "int" || i === "float") {
		let n = Number(t);
		if (Number.isNaN(n)) return !1;
		let r = e.options ?? {}, a = r.min ?? -Infinity, o = r.max ?? Infinity, s = Math.min(o, Math.max(a, n));
		(i === "int" || r.precision === 0 || r.round === 1) && (s = Math.round(s)), e.value = s;
	} else i === "toggle" || i === "boolean" ? e.value = !!t : e.value = t;
	try {
		let t = r(), a = t?.canvas ?? null, o = n ?? e?.parent ?? null, s = e.value;
		e.callback?.(e.value, a, o, null, e), (i === "number" || i === "int" || i === "float") && (e.value = s), Oe(e), a?.setDirty?.(!0, !0), a?.draw?.(!0, !0);
		let c = o?.graph ?? null;
		c && c !== t?.graph && (c.setDirtyCanvas?.(!0, !0), c.change?.()), t?.graph?.setDirtyCanvas?.(!0, !0), t?.graph?.change?.();
	} catch (e) {
		console.debug?.("[MFV] writeWidgetValue", e);
	}
	return !0;
}
function Oe(e) {
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
		i === "" || i === "-" || i === "." || i.endsWith(".") || (k(e, i, n), t?.(e.value));
	}), r.addEventListener("change", () => {
		k(e, r.value, n) && (r.value = String(e.value), t?.(e.value));
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
		k(e, r.value, n) && t?.(e.value);
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
		k(e, i.value, n) && t?.(e.value);
	}), i.addEventListener("input", () => {
		k(e, i.value, n), t?.(e.value), a();
	}), r.appendChild(i), r._mjrAutoFit = a, i._mjrAutoFit = a, requestAnimationFrame(a), r;
}
function ke(e, t, n = null) {
	let r = document.createElement("label");
	r.className = "mjr-ws-toggle-label";
	let i = document.createElement("input");
	return i.type = "checkbox", i.className = "mjr-ws-checkbox", i.checked = !!e.value, i.addEventListener("change", () => {
		k(e, i.checked, n) && t?.(e.value);
	}), r.appendChild(i), r;
}
function N(e) {
	let t = document.createElement("input");
	return t.type = "text", t.className = "mjr-ws-input mjr-ws-readonly", t.value = e.value == null ? "" : String(e.value), t.readOnly = !0, t.tabIndex = -1, t;
}
//#endregion
//#region ui/app/settings/MajoorSettingsDialog.ts
var P = "mjr-settings-dialog", F = "mjr-settings-dialog-style", I = null, Ae = {
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
function je() {
	if (typeof document > "u" || document.getElementById(F)) return;
	let e = document.createElement("style");
	e.id = F, e.textContent = `
#${P} {
    position: fixed;
    inset: 0;
    z-index: 10080;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.48);
    color: var(--fg-color, #ddd);
    font: 13px/1.4 system-ui, -apple-system, Segoe UI, sans-serif;
}
#${P}[hidden] { display: none; }
#${P} .mjr-settings-panel {
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
#${P} .mjr-settings-head,
#${P} .mjr-settings-tools {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.10);
}
#${P} .mjr-settings-title {
    font-weight: 700;
    font-size: 14px;
    flex: 1;
}
#${P} .mjr-settings-close,
#${P} .mjr-settings-reset {
    border: 1px solid rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.06);
    color: inherit;
    border-radius: 6px;
    min-height: 30px;
    padding: 0 10px;
    cursor: pointer;
}
#${P} .mjr-settings-close {
    width: 30px;
    padding: 0;
}
#${P} .mjr-settings-search {
    flex: 1;
    min-width: 160px;
    height: 30px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    background: rgba(0, 0, 0, 0.22);
    color: inherit;
    padding: 0 10px;
}
#${P} .mjr-settings-body {
    overflow: auto;
    padding: 12px;
}
#${P} .mjr-settings-stack {
    display: grid;
    gap: 10px;
}
#${P} .mjr-settings-group {
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.035);
    overflow: hidden;
}
#${P} .mjr-settings-group summary {
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
#${P} .mjr-settings-group summary::-webkit-details-marker {
    display: none;
}
#${P} .mjr-settings-group-icon {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.07);
    color: var(--input-text, #fff);
}
#${P} .mjr-settings-group-title {
    color: var(--input-text, #fff);
    font-weight: 700;
}
#${P} .mjr-settings-group-meta {
    opacity: 0.68;
    font-size: 12px;
}
#${P} .mjr-settings-chevron {
    transition: transform 0.16s ease;
}
#${P} details[open] > summary .mjr-settings-chevron {
    transform: rotate(90deg);
}
#${P} .mjr-settings-group-body {
    padding: 4px 11px 11px;
}
#${P} .mjr-settings-subgroup {
    margin-top: 8px;
}
#${P} .mjr-settings-subgroup-title {
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
#${P} .mjr-settings-subgroup-title::after {
    content: "";
    height: 1px;
    flex: 1;
    background: rgba(255, 255, 255, 0.10);
}
#${P} .mjr-settings-row {
    display: grid;
    grid-template-columns: minmax(220px, 1fr) minmax(180px, 280px);
    align-items: center;
    gap: 16px;
    padding: 9px 0;
    border-top: 1px solid rgba(255, 255, 255, 0.07);
}
#${P} .mjr-settings-name {
    font-weight: 600;
    color: var(--p-primary-color, var(--comfy-accent, #8ab4f8));
}
#${P} .mjr-settings-tip {
    margin-top: 2px;
    opacity: 0.72;
    font-size: 12px;
}
#${P} input,
#${P} select {
    min-height: 30px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    background: rgba(0, 0, 0, 0.22);
    color: inherit;
    padding: 0 8px;
}
#${P} input[type="checkbox"] {
    justify-self: end;
    width: 18px;
    min-height: 18px;
}
#${P} input[type="color"] {
    padding: 2px;
    width: 56px;
    justify-self: end;
}
@media (max-width: 620px) {
    #${P} .mjr-settings-row {
        grid-template-columns: 1fr;
        gap: 8px;
    }
}
`, document.head.appendChild(e);
}
function Me(e) {
	return String(e || "").replace(/^\s*Majoor:\s*/i, "").trim();
}
function L(e) {
	let t = Array.isArray(e?.category) ? e.category : [];
	return String(t[1] || "General").trim() || "General";
}
function Ne(e) {
	return (Array.isArray(e?.category) ? e.category : []).slice(2).filter(Boolean).join(" / ") || "General";
}
function Pe(e) {
	return Ae[e] || {
		icon: "pi pi-sliders-h",
		label: e || "General"
	};
}
function Fe(e, t) {
	return t ? [
		e?.id,
		e?.name,
		e?.tooltip,
		...Array.isArray(e?.category) ? e.category : []
	].join(" ").toLowerCase().includes(t) : !0;
}
function R(e, t) {
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
function z(e) {
	let t = String(e?.type || "text").toLowerCase(), n = e?.defaultValue, r;
	if (t === "boolean") return r = document.createElement("input"), r.type = "checkbox", r.checked = !!n, r.addEventListener("change", () => R(e, r.checked)), r;
	if (t === "combo") {
		r = document.createElement("select");
		for (let t of e?.options || []) {
			let e = document.createElement("option"), n = t && typeof t == "object" ? t.value ?? t.text ?? t.label : t;
			e.value = String(n ?? ""), e.textContent = String(t && typeof t == "object" ? t.text ?? t.label ?? t.value : t), r.appendChild(e);
		}
		return r.value = String(n ?? ""), r.addEventListener("change", () => R(e, r.value)), r;
	}
	if (r = document.createElement("input"), r.type = t === "color" ? "color" : t === "number" ? "number" : t === "password" ? "password" : "text", e?.attrs && typeof e.attrs == "object") for (let [t, n] of Object.entries(e.attrs)) n != null && r.setAttribute(t, String(n));
	r.value = String(n ?? "");
	let i = t === "color" ? "input" : "change";
	return r.addEventListener(i, () => {
		R(e, t === "number" ? Number(r.value) : r.value);
	}), r;
}
function B(e, t, n = "") {
	e.replaceChildren();
	let r = document.createElement("div");
	r.className = "mjr-settings-stack", e.appendChild(r);
	let i = /* @__PURE__ */ new Map();
	for (let e of t || []) {
		if (!Fe(e, n)) continue;
		let t = L(e), r = Ne(e);
		i.has(t) || i.set(t, /* @__PURE__ */ new Map());
		let a = i.get(t);
		a.has(r) || a.set(r, []), a.get(r).push(e);
	}
	for (let [e, t] of i.entries()) {
		let i = Array.from(t.values()).flat(), a = Pe(e), o = document.createElement("details");
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
				if (i.className = "mjr-settings-name", i.textContent = Me(e?.name) || e?.id || "Setting", r.appendChild(i), e?.tooltip) {
					let t = document.createElement("div");
					t.className = "mjr-settings-tip", t.textContent = String(e.tooltip), r.appendChild(t);
				}
				n.appendChild(r), n.appendChild(z(e)), t.appendChild(n);
			}
			p.appendChild(t);
		}
		o.appendChild(p), r.appendChild(o);
	}
}
function V() {
	je();
	let t = document.createElement("div");
	t.id = P, t.hidden = !0, t.addEventListener("click", (e) => {
		e.target === t && H();
	});
	let n = document.createElement("div");
	n.className = "mjr-settings-panel", n.setAttribute("role", "dialog"), n.setAttribute("aria-modal", "true");
	let r = document.createElement("div");
	r.className = "mjr-settings-head";
	let i = document.createElement("div");
	i.className = "mjr-settings-title", i.textContent = e("settings.majoor.title", "Majoor Assets Manager Settings");
	let a = document.createElement("button");
	a.type = "button", a.className = "mjr-settings-close", a.textContent = "X", a.setAttribute("aria-label", e("btn.close", "Close")), a.addEventListener("click", H), r.append(i, a);
	let o = document.createElement("div");
	o.className = "mjr-settings-tools";
	let s = document.createElement("input");
	s.type = "search", s.className = "mjr-settings-search", s.placeholder = e("placeholder.searchSettings", "Search settings"), o.appendChild(s);
	let c = document.createElement("div");
	return c.className = "mjr-settings-body", n.append(r, o, c), t.appendChild(n), document.body.appendChild(t), {
		body: c,
		root: t,
		search: s
	};
}
function H() {
	I?.root && (I.root.hidden = !0);
}
function Ie(e = t()) {
	if (typeof document > "u") return !1;
	I?.root?.isConnected || (I = V());
	let n = o(e), r = () => B(I.body, n, String(I.search.value || "").trim().toLowerCase());
	return I.search.oninput = r, I.search.value = "", r(), I.root.hidden = !1, setTimeout(() => I?.search?.focus?.(), 0), !0;
}
//#endregion
//#region ui/app/openMajoorSettings.ts
function Le(e = t()) {
	return Ie(e);
}
try {
	typeof window < "u" && (window.MajoorAssetsManager = window.MajoorAssetsManager || {}, window.MajoorAssetsManager.openSettings = Le);
} catch (e) {
	console.debug?.(e);
}
//#endregion
export { ae as _, we as a, be as c, D as d, ye as f, re as g, ie as h, Ee as i, xe as l, _e as m, De as n, Te as o, O as p, k as r, Ce as s, Le as t, ve as u, C as v, S as y };
