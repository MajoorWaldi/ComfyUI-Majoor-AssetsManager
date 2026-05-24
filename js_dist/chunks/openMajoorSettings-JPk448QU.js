import { Ht as e, a as t, i as n, l as r, zt as i } from "./hostAdapter-DB5MNPEp.js";
import { t as a } from "./config-DscKvsiP.js";
import { B as o, S as s, b as c, g as l, x as u } from "./SidebarWorkflowSection-BubHcTdI.js";
import { n as d, t as f } from "./state-IBRtThFE.js";
//#region js/features/viewer/floatingViewerProgress.ts
var p = "progress-update", m = Symbol.for("mjr.mfv.progress.queuePromptPatch"), h = "__MJR_MFV_PROGRESS_SERVICE__";
function g() {
	return typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : {};
}
function ee(e, t) {
	if (typeof CustomEvent == "function") return new CustomEvent(e, { detail: t });
	let n = typeof Event == "function" ? new Event(e) : { type: e };
	return n.detail = t, n;
}
var _ = class {
	constructor(e, n = () => t()) {
		this.id = String(e || ""), this.promptApi = null, this.executedNodeIds = [], this.totalNodes = 0, this.currentlyExecuting = null, this.errorDetails = null, this._getApp = typeof n == "function" ? n : () => null;
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
			let t = this._getApp?.()?.graph?.getNodeById?.(Number(e));
			n = t?.title || t?.type || "";
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
}, v = class extends EventTarget {
	constructor({ getApi: e = (e) => n(e), getApp: i = () => t(), waitForApi: a = (e) => r(e) } = {}) {
		super(), this._getApi = e, this._getApp = i, this._waitForApi = a, this.promptsMap = /* @__PURE__ */ new Map(), this.currentExecution = null, this.lastQueueRemaining = 0, this._api = null, this._listenerEntries = [], this._initPromise = null;
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
		return n || (n = new _(t, this._getApp), this.promptsMap.set(t, n)), n;
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
		let t = e.queuePrompt?.[m];
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
				e.setPrompt(t), r.currentExecution ||= e, r.dispatchEvent(ee("queue-prompt", { prompt: e })), r.dispatchProgressUpdate();
			}
			return a;
		};
		Object.defineProperty(i, m, {
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
		this.dispatchEvent(ee(p, this.getSnapshot()));
	}
	dispose({ resetPatchedQueuePrompt: e = !1, keepState: t = !1 } = {}) {
		for (let { api: e, type: t, handler: n } of this._listenerEntries.splice(0)) try {
			e?.removeEventListener?.(t, n);
		} catch (e) {
			console.debug?.(e);
		}
		if (e && this._api?.queuePrompt?.[m]?.service === this) try {
			let e = this._api.queuePrompt[m]?.originalQueuePrompt || null;
			typeof e == "function" && (this._api.queuePrompt = e);
		} catch (e) {
			console.debug?.(e);
		}
		this._api = null, t || (this.promptsMap.clear(), this.currentExecution = null, this.lastQueueRemaining = 0);
	}
}, y = g(), b = y[h] || new v();
y[h] || (y[h] = b);
function x(e = {}) {
	return b.ensureInitialized(e);
}
function S(e) {
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
		return (a || i) && (r += ` - ${a || "???"}${i ? ` (${i})` : ""}`), r;
	}
	return t > 0 ? `(${t}) Running... in another tab` : "Idle";
}
function te(e) {
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
function C(e, t) {
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
	if (e._progressCurrentNodeId = r || null, e._progressEl && (e._progressNodesEl.style.width = i, e._progressStepsEl.style.width = a, e._progressTextEl.textContent = S(t), e._progressEl.classList.toggle("is-error", o), e._progressEl.classList.toggle("is-clickable", !!r), e._progressEl.title = r ? "Execution progress - click to center active node" : "Execution progress"), e._mediaProgressEl) {
		let n = te(t);
		e._mediaProgressTextEl.textContent = n, e._mediaProgressEl.title = n || "", e._mediaProgressEl.classList.toggle("is-error", o), e._mediaProgressEl.classList.toggle("is-visible", !!n);
	}
}
function w(e, n) {
	let r = String(n || "").trim();
	if (!r) return !1;
	try {
		let e = t(), n = e?.graph || null, i = e?.canvas || null, a = n?.getNodeById?.(Number(r)) || null;
		return !a || typeof i?.centerOnNode != "function" ? !1 : (i.centerOnNode(a), !0);
	} catch (e) {
		return console.debug?.(e), !1;
	}
}
function ne(e) {
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
		t.button === 0 && w(e, e._progressCurrentNodeId) && (t.preventDefault(), t.stopPropagation());
	}), e._progressEl = t, e._progressNodesEl = n, e._progressStepsEl = r, e._progressTextEl = a, e._progressUpdateHandler && b.removeEventListener(p, e._progressUpdateHandler), e._progressUpdateHandler = (t) => {
		C(e, t?.detail || b.getSnapshot());
	}, b.addEventListener(p, e._progressUpdateHandler), x({ timeoutMs: 4e3 }).catch((e) => {
		console.debug?.(e);
	}), C(e, b.getSnapshot()), t;
}
function re(e) {
	let t = document.createElement("div");
	t.className = "mjr-mfv-media-progress", t.setAttribute("aria-hidden", "true");
	let n = document.createElement("span");
	return n.className = "mjr-mfv-media-progress-text", t.appendChild(n), e._mediaProgressEl = t, e._mediaProgressTextEl = n, C(e, b.getSnapshot()), t;
}
function ie(e) {
	if (e?._progressUpdateHandler) try {
		b.removeEventListener(p, e._progressUpdateHandler);
	} catch (e) {
		console.debug?.(e);
	}
	e._progressUpdateHandler = null, e._progressCurrentNodeId = null, e._progressEl = null, e._progressNodesEl = null, e._progressStepsEl = null, e._progressTextEl = null, e._mediaProgressEl = null, e._mediaProgressTextEl = null;
}
//#endregion
//#region js/components/VideoControls.ts
var ae = 400, oe = 1e3, se = 220;
function ce(e, t, n) {
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
function T(e) {
	let t = Math.floor(Number(e) || 0);
	return t < 10 ? `0${t}` : String(t);
}
function le(e) {
	let t = Number(e);
	if (!Number.isFinite(t) || t < 0) return "0:00";
	let n = Math.floor(t), r = Math.floor(n / 3600), i = Math.floor(n % 3600 / 60), a = n % 60;
	return r > 0 ? `${r}:${T(i)}:${T(a)}` : `${i}:${T(a)}`;
}
function E(e, t, n) {
	let r = document.createElement("button");
	r.type = "button", r.className = `mjr-video-btn ${e || ""}`.trim(), n && (r.title = n);
	try {
		r.setAttribute("aria-label", n || t || "Button");
	} catch (e) {
		console.debug?.(e);
	}
	return r.textContent = t, r;
}
function ue(e, t, n, r) {
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
function de(e, { min: t, max: n, step: r, value: i, title: a, ariaLabel: o, widthPx: s } = {}) {
	let c = document.createElement("input");
	return c.type = "number", c.className = `mjr-video-num ${e || ""}`.trim(), a && (c.title = a), o && c.setAttribute("aria-label", o), t != null && (c.min = String(t)), n != null && (c.max = String(n)), r != null && (c.step = String(r)), i != null && (c.value = String(i)), s != null && (c.style.width = `${s}px`), c;
}
function fe(e) {
	try {
		return e?.variant === "preview" ? "preview" : e?.variant === "viewerbar" ? "viewerbar" : "viewer";
	} catch {
		return "viewer";
	}
}
function pe(e) {
	try {
		let t = Number(e?.initialFps);
		return Number.isFinite(t) && t > 0 ? t : null;
	} catch {
		return null;
	}
}
function me(e, t) {
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
	let c = () => {
		try {
			o.className = `pi ${e?.paused ? "pi-play" : "pi-pause"}`;
		} catch (e) {
			console.debug?.(e);
		}
	}, l = () => {
		try {
			let t = e.play?.();
			t && typeof t.catch == "function" && t.catch(() => {});
		} catch (e) {
			console.debug?.(e);
		}
	}, d = (t) => {
		try {
			t?.stopPropagation?.();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			e.paused ? l() : e.pause?.();
		} catch (e) {
			console.debug?.(e);
		}
		c();
	};
	try {
		t.appendChild(r);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		l();
	} catch (e) {
		console.debug?.(e);
	}
	n.push(u(e, "loadedmetadata", () => l(), { passive: !0 })), n.push(u(e, "canplay", () => l(), { passive: !0 })), n.push(u(a, "click", d)), n.push(u(e, "play", c, { passive: !0 })), n.push(u(e, "pause", c, { passive: !0 })), n.push(u(e, "ended", () => l(), { passive: !0 }));
	try {
		c();
	} catch (e) {
		console.debug?.(e);
	}
	return {
		controlsEl: r,
		destroy: () => {
			try {
				for (let e of n) s(() => e?.());
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
function D(e, t = {}) {
	try {
		let n = fe(t), r = String(t?.mediaKind || "video").toLowerCase() === "audio", a = n === "viewerbar", o = n !== "preview" && !r, p = pe(t), m = t?.hostEl || e?.parentElement;
		if (!e || !m) return {
			controlsEl: null,
			destroy: c
		};
		if (n === "preview") return me(e, m);
		try {
			e.loop = !1;
		} catch (e) {
			console.debug?.(e);
		}
		s(() => m.classList?.add("mjr-video-host")), s(() => e.classList?.add("mjr-video-el")), s(() => {
			window.getComputedStyle?.(m)?.position === "static" && (m.style.position = "relative");
		});
		let h = document.createElement("div");
		h.className = `mjr-video-controls mjr-video-controls--${n}`, a && h.classList.add("mjr-video-controls--modern"), h.dataset.mjrLayout = "regular", h.setAttribute("role", "group"), h.setAttribute("aria-label", r ? i("video.audioControls", "Audio controls") : i("video.controls", "Video controls"));
		let g = document.createElement("div");
		g.className = "mjr-video-row mjr-video-row--top";
		let ee = document.createElement("div");
		ee.className = "mjr-video-row mjr-video-row--bottom", h.appendChild(g), h.appendChild(ee);
		let _ = document.createElement("div");
		_.className = "mjr-video-seek-wrap";
		let v = document.createElement("input");
		v.className = "mjr-video-range mjr-video-range--seek", v.type = "range", v.min = "0", v.max = String(oe), v.step = "1", v.value = "0", v.setAttribute("aria-label", i("video.seek", "Seek")), v.title = r ? i("video.seekThroughAudio", "Seek through audio") : i("video.seekThrough", "Seek through video");
		let y = document.createElement("div");
		y.className = "mjr-video-seek-overlay";
		let b = null, x = null, S = null, te = null;
		o && (b = document.createElement("div"), b.className = "mjr-video-seek-zones", x = document.createElement("div"), x.className = "mjr-video-seek-zone mjr-video-seek-zone--leftTrim", S = document.createElement("div"), S.className = "mjr-video-seek-zone mjr-video-seek-zone--selected", te = document.createElement("div"), te.className = "mjr-video-seek-zone mjr-video-seek-zone--rightTrim", b.appendChild(x), b.appendChild(S), b.appendChild(te));
		let C = document.createElement("div");
		C.className = "mjr-video-seek-ticks";
		let w = document.createElement("div");
		w.className = "mjr-video-seek-labels";
		let ne = document.createElement("div");
		ne.className = "mjr-video-seek-mark mjr-video-seek-mark--in";
		let re = document.createElement("div");
		re.className = "mjr-video-seek-mark mjr-video-seek-mark--out";
		let ie = document.createElement("div");
		ie.className = "mjr-video-seek-playhead";
		let T = document.createElement("div");
		T.className = "mjr-video-seek-playhead-label", y.appendChild(C), y.appendChild(w), y.appendChild(ie), y.appendChild(T);
		let D = document.createElement("div");
		D.className = "mjr-video-seek-handle mjr-video-seek-handle--in", D.title = i("video.dragSetIn", "Drag to set In"), D.setAttribute("aria-label", i("video.dragSetIn", "Drag to set In"));
		let he = document.createElement("div");
		he.className = "mjr-video-seek-handle mjr-video-seek-handle--out", he.title = i("video.dragSetOut", "Drag to set Out"), he.setAttribute("aria-label", i("video.dragSetOut", "Drag to set Out")), _.appendChild(v), b && _.appendChild(b), _.appendChild(y), _.appendChild(ne), _.appendChild(re), _.appendChild(D), _.appendChild(he);
		let ge = document.createElement("span");
		ge.className = "mjr-video-time", ge.textContent = "0:00 / 0:00", ge.title = i("video.currentTimeTotal", "Current time / Total duration");
		let O = document.createElement("span");
		O.className = "mjr-video-range-count", O.textContent = "";
		try {
			O.style.display = "none";
		} catch (e) {
			console.debug?.(e);
		}
		let _e = document.createElement("div");
		_e.className = "mjr-video-timegroup", _e.appendChild(ge), o && _e.appendChild(O);
		let k = document.createElement("span");
		k.className = "mjr-video-frame", k.textContent = "F: 0", k.title = i("video.currentFrame", "Current frame number");
		let ve = E("mjr-video-btn--play", i("btn.play", "Play"), i("video.playPauseSpace", "Play/Pause (Space)")), ye = E("mjr-video-btn--step", "<", i("video.stepBack", "Step back")), be = E("mjr-video-btn--step", ">", i("video.stepForward", "Step forward")), xe = E("mjr-video-btn--jump mjr-video-btn--in", "|<", i("video.goToIn", "Go to In")), Se = E("mjr-video-btn--jump mjr-video-btn--out", ">|", i("video.goToOut", "Go to Out")), Ce = E("mjr-video-btn--mark mjr-video-btn--in", "I", i("video.setInFromCurrent", "Set In from current frame")), A = E("mjr-video-btn--mark mjr-video-btn--out", "O", i("video.setOutFromCurrent", "Set Out from current frame")), we = ue("mjr-video-btn--toggle", "pi-refresh", i("video.loopPlaybackInRange", "Loop playback in range"), i("video.loop", "Loop")), j = we.btn, Te = de("mjr-video-num--in", {
			min: 0,
			step: 1,
			value: 0,
			title: i("video.inFrame", "In frame"),
			ariaLabel: i("video.inFrame", "In frame"),
			widthPx: 72
		}), Ee = de("mjr-video-num--out", {
			min: 0,
			step: 1,
			value: 0,
			title: i("video.outFrame", "Out frame"),
			ariaLabel: i("video.outFrame", "Out frame"),
			widthPx: 72
		}), M = de("mjr-video-num--step", {
			min: 1,
			step: 1,
			value: 1,
			title: i("video.frameIncrement", "Frame increment"),
			ariaLabel: i("video.frameIncrement", "Frame increment"),
			widthPx: 56
		}), N = de("mjr-video-num--fps", {
			min: 1,
			step: .001,
			value: l(p || 30),
			title: i("video.fpsStepping", "FPS (used for frame stepping)"),
			ariaLabel: i("video.fps", "FPS"),
			widthPx: 56
		}), P = document.createElement("select");
		P.className = "mjr-video-num mjr-video-num--speed", P.title = i("video.playbackSpeed", "Playback speed"), P.setAttribute("aria-label", i("video.playbackSpeed", "Playback speed")), P.style.width = "74px";
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
			t.value = String(e), t.textContent = `${e}x`, P.appendChild(t);
		}
		let De = ue("mjr-video-btn--mute", "pi-volume-up", i("video.mute", "Mute"), i("video.mute", "Mute")), F = De.btn, I = document.createElement("div");
		I.className = "mjr-video-volume-wrap", I.style.cssText = "display:none; align-items:center; position:relative;";
		let L = null;
		L = document.createElement("input"), L.className = "mjr-video-range mjr-video-range--volume", L.type = "range", L.min = "0", L.max = "1", L.step = "0.02", L.value = String(d(Number(e.volume) || 0)), L.setAttribute("aria-label", i("video.volume", "Volume")), L.title = i("video.volume", "Volume");
		try {
			L.style.width = "120px";
		} catch (e) {
			console.debug?.(e);
		}
		I.appendChild(L);
		let Oe = document.createElement("div");
		Oe.className = "mjr-video-group mjr-video-group--in";
		let ke = document.createElement("span");
		ke.textContent = "In", ke.title = i("video.resetInToStart", "Reset In to start"), ke.style.cssText = "cursor:pointer; user-select:none;", o && (Oe.appendChild(ke), Oe.appendChild(Te));
		let Ae = document.createElement("div");
		Ae.className = "mjr-video-group mjr-video-group--out";
		let je = document.createElement("span");
		je.textContent = "Out", je.title = i("video.resetOutToEnd", "Reset Out to end"), je.style.cssText = "cursor:pointer; user-select:none;", o && (Ae.appendChild(je), Ae.appendChild(Ee));
		let R = document.createElement("div");
		R.className = "mjr-video-group mjr-video-group--adjust-left", o && (R.appendChild(Ce), R.appendChild(document.createTextNode(i("video.step", "Step"))), R.appendChild(M), R.appendChild(document.createTextNode(i("video.fps", "FPS"))), R.appendChild(N), R.appendChild(k));
		let Me = document.createElement("div");
		Me.className = "mjr-video-group mjr-video-group--adjust-right", o && (Me.appendChild(_e), Me.appendChild(j));
		let Ne = document.createElement("div");
		Ne.className = "mjr-video-group mjr-video-group--speed", Ne.appendChild(document.createTextNode(i("video.speed", "Speed"))), Ne.appendChild(P);
		let Pe = document.createElement("div");
		Pe.className = "mjr-video-bottom mjr-video-bottom--left";
		let z = document.createElement("div");
		z.className = "mjr-video-transport";
		let Fe = document.createElement("div");
		if (Fe.className = "mjr-video-bottom mjr-video-bottom--right", r || (z.appendChild(xe), z.appendChild(ye)), z.appendChild(ve), r || (z.appendChild(be), z.appendChild(Se)), o && Pe.appendChild(R), o && Fe.appendChild(Me), Fe.appendChild(Ne), Fe.appendChild(F), o && Fe.appendChild(A), L && Fe.appendChild(I), a) {
			let e = document.createElement("div");
			e.className = "mjr-video-bar-timeline", o && e.appendChild(Oe), e.appendChild(_), o && e.appendChild(Ae);
			let t = document.createElement("div");
			t.className = "mjr-video-bar-actions";
			let n = document.createElement("div");
			n.className = "mjr-video-bar-side mjr-video-bar-side--left", o && n.appendChild(R);
			let r = document.createElement("div");
			r.className = "mjr-video-bar-center", r.appendChild(z);
			let i = document.createElement("div");
			i.className = "mjr-video-bar-side mjr-video-bar-side--right", o && i.appendChild(Me), i.appendChild(Ne), i.appendChild(F), o && i.appendChild(A), L && i.appendChild(I), t.appendChild(n), t.appendChild(r), t.appendChild(i), h.replaceChildren(e, t);
		} else o && g.appendChild(k), o && g.appendChild(Oe), g.appendChild(_), o && g.appendChild(Ae), g.appendChild(_e), ee.appendChild(Pe), ee.appendChild(z), ee.appendChild(Fe);
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
				let e = Number(m?.clientWidth) || Number(h?.clientWidth) || 0, t = "regular";
				e > 0 && e < 560 ? t = "stacked" : e > 0 && e < 860 && (t = "compact"), h.dataset.mjrLayout = t;
			} catch (e) {
				console.debug?.(e);
			}
		};
		Le();
		try {
			if (typeof ResizeObserver == "function" && m) {
				let e = typeof requestAnimationFrame == "function" ? requestAnimationFrame : null, t = typeof cancelAnimationFrame == "function" ? cancelAnimationFrame : null, n = 0, r = new ResizeObserver(e ? () => {
					n ||= e(() => {
						n = 0, Le();
					});
				} : () => Le());
				r.observe(m), H.push(() => {
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
			playbackRate: Math.max(.25, Math.min(2, Number(t?.initialPlaybackRate) || 1)),
			_seeking: !1,
			_ppReverse: !1,
			_ppRafId: null,
			_userInteracted: !1
		}, Re = () => {
			if (!U._userInteracted) {
				U._userInteracted = !0;
				try {
					e.muted && (e.muted = !1, Qe?.());
				} catch (e) {
					console.debug?.(e);
				}
			}
		}, ze = null, Be = () => {
			if (o) try {
				k.classList.add("is-step");
				try {
					ze?.();
				} catch (e) {
					console.debug?.(e);
				}
				ze = ce(Ie.signal, se, () => {
					try {
						k.classList.remove("is-step");
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
				k?.classList?.remove?.("is-step");
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
		}, He = (t) => {
			try {
				let n = Number(t);
				if (!Number.isFinite(n) || n <= 0) return U.playbackRate;
				let r = Math.max(.25, Math.min(2, Math.round(n * 100) / 100));
				U.playbackRate = r;
				try {
					e.playbackRate = r;
				} catch (e) {
					console.debug?.(e);
				}
				try {
					P.matches?.(":focus") || (P.value = String(r));
				} catch (e) {
					console.debug?.(e);
				}
				return r;
			} catch {
				return U.playbackRate;
			}
		}, Ue = () => {
			try {
				Ve(j, !!(U.loop || U.pingpong));
				try {
					we?.icon && (U.pingpong ? (we.icon.className = "pi pi-sort-alt", j.title = i("video.pingpongPlayback", "Ping-pong playback (forward then reverse)")) : (we.icon.className = "pi pi-refresh", j.title = i("video.loopPlaybackInRange", "Loop playback in range")));
				} catch (e) {
					console.debug?.(e);
				}
			} catch (e) {
				console.debug?.(e);
			}
		}, We = () => {
			try {
				let t = Number(U.frameCount);
				if (Number.isFinite(t) && t > 0) return Math.max(1, Math.floor(t));
				let n = Number(e?.duration), r = l(U.fps, 30);
				return !Number.isFinite(n) || n <= 0 ? 0 : Math.max(0, Math.floor(n * r));
			} catch {
				return 0;
			}
		}, W = (t = null) => {
			try {
				let n = t ?? e?.currentTime, r = Number(n), i = l(U.fps, 30);
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
				let t = U.inFrame == null ? 0 : f(U.inFrame, 0, e), n = U.outFrame == null ? e : f(U.outFrame, 0, e);
				n < t ? (U.inFrame = n, U.outFrame = t) : (U.inFrame = t, U.outFrame = n);
			} catch (e) {
				console.debug?.(e);
			}
		}, K = () => {
			try {
				let e = We();
				return {
					inF: U.inFrame == null ? 0 : f(U.inFrame, 0, e),
					outF: U.outFrame == null ? e : f(U.outFrame, 0, e),
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
				ve.textContent = !e?.paused || U._ppReverse ? i("video.pause", "Pause") : i("video.play", "Play");
			} catch (e) {
				console.debug?.(e);
			}
		}, Ke = () => {
			try {
				let t = !!e?.muted || (Number(e?.volume) || 0) <= .001;
				try {
					De.icon.className = `pi ${t ? "pi-volume-off" : "pi-volume-up"}`;
				} catch (e) {
					console.debug?.(e);
				}
				let n = t ? i("video.unmute", "Unmute") : i("video.mute", "Mute");
				F.title = n, F.setAttribute("aria-label", n);
			} catch (e) {
				console.debug?.(e);
			}
		}, J = (t = null) => {
			try {
				let n = Number(e?.duration), r = t ?? e?.currentTime, i = Number(r), a = Number.isFinite(n) && n > 0;
				if (ge.textContent = `${le(i)} / ${a ? le(n) : "0:00"}`, v.disabled = !a, a) {
					let e = d((i || 0) / n), t = Math.round(e * 1e3);
					!Number.isNaN(t) && !U._seeking && !v.matches?.(":active") && (v.value = String(t));
					try {
						ie.style.left = `${e * 100}%`;
					} catch (e) {
						console.debug?.(e);
					}
				} else {
					v.value = "0";
					try {
						ie.style.left = "0%";
					} catch (e) {
						console.debug?.(e);
					}
				}
				if (o) {
					let e = We(), t = W(i);
					k.textContent = `F: ${t} / ${e}`;
					try {
						if (Number.isFinite(n) && n > 0) {
							let e = d((i || 0) / n);
							T.style.left = `${e * 100}%`, T.textContent = String(t), T.style.display = "";
						} else T.style.display = "none";
					} catch (e) {
						console.debug?.(e);
					}
					Te.matches?.(":focus") || (Te.value = String(U.inFrame ?? 0)), Ee.matches?.(":focus") || (Ee.value = String(U.outFrame ?? e));
					try {
						let { inF: e, outF: t, maxF: n } = K(), r = e <= 0 && t >= n, i = Math.max(0, Math.floor(t) - Math.floor(e) + 1);
						!r && n > 0 ? (O.textContent = `R: ${i}f`, O.style.display = "") : O.style.display = "none";
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
				let r = d(e / n) * 100, i = d(t / n) * 100, a = e <= 0 && t >= n;
				try {
					v.style.background = "";
				} catch (e) {
					console.debug?.(e);
				}
				try {
					let e = d(r / 100) * 100, t = d(i / 100) * 100, n = Math.min(e, t), o = Math.max(e, t);
					if (b && x && S && te) {
						x.style.left = "0%", x.style.width = `${n}%`, S.style.left = `${n}%`, S.style.width = `${Math.max(0, o - n)}%`, te.style.left = `${o}%`, te.style.width = `${Math.max(0, 100 - o)}%`;
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
					ne.style.left = `${r}%`, re.style.left = `${i}%`;
				} catch (e) {
					console.debug?.(e);
				}
				try {
					D.style.left = `${r}%`, he.style.left = `${i}%`;
				} catch (e) {
					console.debug?.(e);
				}
				try {
					let e = Math.max(1, Math.floor(n / ae)), t = Math.max(e, Math.floor(Number(U.step) || 1)), r = t / n * 100, i = r * 10;
					if (Number.isFinite(r) && r > .02) {
						let e = `repeating-linear-gradient(to right, rgba(255,255,255,0.16) 0, rgba(255,255,255,0.16) 1px, transparent 1px, transparent ${r}%)`, t = `repeating-linear-gradient(to right, rgba(255,255,255,0.28) 0, rgba(255,255,255,0.28) 1px, transparent 1px, transparent ${i}%)`;
						C.style.backgroundImage = `${t}, ${e}`;
					} else C.style.backgroundImage = "";
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
							let r = d(e / n) * 100;
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
				Ye(), U._ppReverse = !0, e.pause?.(), q();
				let t = 1e3 / (l(U.fps, 30) * Math.max(.25, Number(U.playbackRate) || 1)), n = performance.now(), r = (i) => {
					try {
						if (!U._ppReverse || !U.pingpong) {
							U._ppReverse = !1, q();
							return;
						}
						let a = i - n;
						if (a >= t) {
							n = i - a % t;
							let { inF: r } = K(), o = W();
							if (o <= r) {
								U._ppReverse = !1, Z(r);
								let t = e.play?.();
								t && typeof t.catch == "function" && t.catch(() => {}), q(), J();
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
					M.value = "1";
				} catch (e) {
					console.debug?.(e);
				}
				try {
					P.matches?.(":focus") || (P.value = "1");
				} catch (e) {
					console.debug?.(e);
				}
				G(), Ue(), J(), Y(), X({ prefer: "in" });
			} catch (e) {
				console.debug?.(e);
			}
		}, Qe = () => {
			try {
				let t = d(Number(e?.volume) || 0);
				try {
					L && !L.matches?.(":active") && (L.value = String(t));
				} catch (e) {
					console.debug?.(e);
				}
				Ke();
			} catch (e) {
				console.debug?.(e);
			}
		}, Z = (t) => {
			try {
				let { maxF: n } = K();
				e.currentTime = Ge(f(t, 0, n > 0 ? n : Infinity));
			} catch (e) {
				console.debug?.(e);
			}
			J();
		}, $e = (t) => {
			Re();
			try {
				let n = Math.max(1, Math.floor(Number(U.step) || 1)), { inF: r, outF: i } = K(), a = W() + t * n;
				U.loop ? (a < r && (a = i), a > i && (a = r)) : a = f(a, r, i);
				try {
					e.pause?.();
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
				if (e.paused) {
					et();
					let t = e.play?.();
					t && typeof t.catch == "function" && t.catch(() => {});
				} else e.pause?.();
			} catch (e) {
				console.debug?.(e);
			}
			q();
		};
		H.push(u(e, "click", (t) => {
			try {
				if (t?.target !== e) return;
			} catch (e) {
				console.debug?.(e);
			}
			tt();
		})), H.push(u(ve, "click", (e) => {
			B(e), tt();
		})), H.push(u(ye, "click", (e) => {
			B(e), $e(-1);
		})), H.push(u(be, "click", (e) => {
			B(e), $e(1);
		})), H.push(u(xe, "click", (e) => {
			B(e);
			let { inF: t } = K();
			Z(t), Be();
		})), H.push(u(Se, "click", (e) => {
			B(e);
			let { outF: t } = K();
			Z(t), Be();
		}));
		let nt = (t) => {
			try {
				let n = Number(e?.duration);
				if (!Number.isFinite(n) || n <= 0) return !1;
				let r = _.getBoundingClientRect?.(), i = Number(r?.width) || 0;
				if (!(i > 0)) return !1;
				let a = d(f((Number(t) || 0) - Number(r.left || 0), 0, i) / i), o = a * n;
				return e.currentTime = o, v.value = String(Math.round(a * oe)), J(o), !0;
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
					_.releasePointerCapture?.(Q.pointerId);
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
		if (H.push(() => rt()), H.push(u(_, "pointerdown", (e) => {
			try {
				if (e?.button != null && e.button !== 0 || e?.target?.closest?.(".mjr-video-seek-handle, .mjr-video-seek-mark")) return;
			} catch (e) {
				console.debug?.(e);
			}
			V(e), Re(), U._seeking = !0, Q.active = !0, Q.pointerId = e?.pointerId ?? null, nt(e?.clientX);
			try {
				_.setPointerCapture?.(Q.pointerId);
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
		}, { passive: !1 })), H.push(u(v, "pointerdown", () => {
			U._seeking = !0;
		})), H.push(u(v, "pointerup", () => {
			Q.active || (U._seeking = !1);
		})), H.push(u(v, "pointercancel", () => {
			Q.active || (U._seeking = !1);
		})), H.push(u(v, "input", (t) => {
			B(t), Re();
			try {
				let t = Number(e?.duration);
				if (!Number.isFinite(t) || t <= 0) return;
				let n = Number(v.value);
				e.currentTime = d((Number.isFinite(n) ? n : 0) / 1e3) * t;
			} catch (e) {
				console.debug?.(e);
			}
			J();
		})), o) {
			H.push(u(Ce, "click", (e) => {
				B(e), U.inFrame = W(), G(), J(), Y(), X({ prefer: "in" });
			})), H.push(u(A, "click", (e) => {
				B(e), U.outFrame = W(), G(), J(), Y(), X({ prefer: "out" });
			})), H.push(u(Te, "change", (e) => {
				B(e);
				try {
					let e = Number(Te.value);
					U.inFrame = Number.isFinite(e) ? Math.max(0, Math.floor(e)) : null, G();
				} catch (e) {
					console.debug?.(e);
				}
				J(), Y(), X({ prefer: "in" });
			})), H.push(u(Ee, "change", (e) => {
				B(e);
				try {
					let e = Number(Ee.value);
					U.outFrame = Number.isFinite(e) ? Math.max(0, Math.floor(e)) : null, G();
				} catch (e) {
					console.debug?.(e);
				}
				J(), Y(), X({ prefer: "out" });
			})), H.push(u(M, "change", (e) => {
				B(e);
				try {
					U.step = Math.max(1, Math.floor(Number(M.value) || 1)), M.value = String(U.step);
				} catch (e) {
					console.debug?.(e);
				}
			})), H.push(u(N, "change", (e) => {
				B(e);
				try {
					U.fps = l(N.value, 30), N.value = String(U.fps), G();
				} catch (e) {
					console.debug?.(e);
				}
				J(), Y();
			})), H.push(u(j, "click", (e) => {
				B(e), !U.loop && !U.pingpong ? (U.loop = !0, U.pingpong = !1) : U.loop && !U.pingpong ? (U.loop = !1, U.pingpong = !0) : (U.loop = !1, U.pingpong = !1), (U.loop || U.pingpong) && (U.once = !1), U.pingpong || (U._ppReverse = !1, Ye()), Ue();
			})), H.push(u(ke, "click", (e) => {
				B(e), qe();
			})), H.push(u(je, "click", (e) => {
				B(e), Je();
			})), H.push(u(O, "click", (e) => {
				B(e), Ze();
			}));
			try {
				O.title = i("video.resetPlayerControls", "Reset player controls"), O.style.cursor = "pointer", O.style.userSelect = "none";
			} catch (e) {
				console.debug?.(e);
			}
		}
		H.push(u(F, "click", (t) => {
			B(t);
			try {
				e.muted = !e.muted, I && (I.style.display = e.muted ? "none" : "inline-flex");
			} catch (e) {
				console.debug?.(e);
			}
			Qe();
		})), H.push(u(F, "contextmenu", (e) => {
			V(e);
			try {
				if (!I) return;
				let e = I.style.display !== "none";
				I.style.display = e ? "none" : "inline-flex";
			} catch (e) {
				console.debug?.(e);
			}
			Qe();
		})), H.push(u(window, "pointerdown", (e) => {
			try {
				if (!I || I.style.display === "none" || F.contains?.(e?.target) || I.contains?.(e?.target)) return;
				I.style.display = "none";
			} catch (e) {
				console.debug?.(e);
			}
		}, { capture: !0 })), L && H.push(u(L, "input", (t) => {
			B(t);
			try {
				let t = d(Number(L.value) || 0);
				e.volume = t, t > .001 && (e.muted = !1);
			} catch (e) {
				console.debug?.(e);
			}
			Qe();
		})), H.push(u(P, "change", (e) => {
			B(e);
			try {
				He(Number(P.value) || 1);
			} catch (e) {
				console.debug?.(e);
			}
		})), H.push(u(e, "ratechange", () => {
			try {
				He(Number(e.playbackRate) || U.playbackRate || 1);
			} catch (e) {
				console.debug?.(e);
			}
		}));
		let at = () => {
			if (o) try {
				if (U._seeking || e?.paused) return;
				let { inF: t, outF: n, maxF: r } = K();
				if (r <= 0 || t <= 0 && n >= r && !U.loop && !U.pingpong && !U.once || U._ppReverse) return;
				let i = W();
				if (i >= n - Math.max(1, Math.floor(Number(U.step) || 1))) if (U.pingpong) {
					Xe();
					return;
				} else if (U.loop) {
					Z(t);
					try {
						let t = e.play?.();
						t && typeof t.catch == "function" && t.catch(() => {});
					} catch (e) {
						console.debug?.(e);
					}
				} else if (U.once) {
					try {
						e.pause?.();
					} catch (e) {
						console.debug?.(e);
					}
					Z(n);
				} else {
					try {
						e.pause?.();
					} catch (e) {
						console.debug?.(e);
					}
					Z(n);
				}
				else i < t && Z(t);
			} catch (e) {
				console.debug?.(e);
			}
		}, $ = {
			rafId: null,
			rvfcId: null
		}, ot = () => {
			try {
				$.rvfcId != null && typeof e?.cancelVideoFrameCallback == "function" && e.cancelVideoFrameCallback($.rvfcId);
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
		}, st = (t = 0, n = null) => {
			$.rafId = null, $.rvfcId = null;
			try {
				s(J, n?.mediaTime), s(at);
			} catch (e) {
				console.debug?.(e);
			}
			if (!(!(U._ppReverse || !e?.paused) || Ie.signal?.aborted)) {
				try {
					if (typeof e?.requestVideoFrameCallback == "function" && !U._ppReverse) {
						$.rvfcId = e.requestVideoFrameCallback(st);
						return;
					}
				} catch (e) {
					console.debug?.(e);
				}
				try {
					typeof requestAnimationFrame == "function" && ($.rafId = requestAnimationFrame((t) => {
						st(t, { mediaTime: Number(e?.currentTime) || 0 });
					}));
				} catch (e) {
					console.debug?.(e);
				}
			}
		}, ct = () => {
			ot(), !(!(U._ppReverse || !e?.paused) || Ie.signal?.aborted) && st(0, { mediaTime: Number(e?.currentTime) || 0 });
		};
		H.push(ot), H.push(u(e, "play", () => {
			s(q), ct();
		}));
		for (let t of ["pause", "ended"]) H.push(u(e, t, () => {
			ot(), s(q), s(J);
		}));
		for (let t of [
			"timeupdate",
			"loadedmetadata",
			"durationchange",
			"seeked"
		]) H.push(u(e, t, () => s(J)));
		H.push(u(e, "timeupdate", at)), H.push(u(e, "ended", () => {
			if (o) try {
				let { inF: t, outF: n, maxF: r } = K(), i = t <= 0 && n >= r;
				if (U.pingpong && !U._ppReverse) {
					Xe();
					return;
				}
				if (!U.loop && !i) return;
				Z(t);
				try {
					let t = e.play?.();
					t && typeof t.catch == "function" && t.catch(() => {});
				} catch (e) {
					console.debug?.(e);
				}
			} catch (e) {
				console.debug?.(e);
			}
		}, { passive: !0 })), o && H.push(u(e, "mjr:frameStep", () => {
			s(Be);
		})), o && (H.push(u(e, "loadedmetadata", () => {
			try {
				let e = We();
				e > 0 && U.inFrame == null && U.outFrame == null && (U.inFrame = 0, U.outFrame = e, G());
			} catch (e) {
				console.debug?.(e);
			}
			Y();
		})), H.push(u(e, "durationchange", () => s(Y))));
		for (let t of ["volumechange"]) H.push(u(e, t, () => s(Qe)));
		try {
			U.fps = l(N.value, 30), U.step = Math.max(1, Math.floor(Number(M.value) || 1)), G(), Ue(), He(U.playbackRate);
		} catch (e) {
			console.debug?.(e);
		}
		s(q), s(J), s(Y), s(Qe);
		try {
			(!e?.paused || U._ppReverse) && ct();
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
						N?.matches?.(":focus") || (N.value = String(U.fps));
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
				let e = Number(t?.initialFps), n = Number(t?.initialFrameCount);
				(Number.isFinite(e) || Number.isFinite(n)) && lt({
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
					let t = _.getBoundingClientRect(), n = f((Number(e) || 0) - t.left, 0, t.width || 1), r = t.width > 0 ? n / t.width : 0, { maxF: i } = K();
					return f(Math.round(r * i), 0, i);
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
					_.setPointerCapture?.(n.pointerId);
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
						_.releasePointerCapture?.(e.pointerId);
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
			H.push(u(D, "pointerdown", (e) => n(e, "in"), { passive: !1 })), H.push(u(he, "pointerdown", (e) => n(e, "out"), { passive: !1 })), H.push(u(ne, "pointerdown", (e) => n(e, "in"), { passive: !1 })), H.push(u(re, "pointerdown", (e) => n(e, "out"), { passive: !1 })), H.push(u(_, "pointermove", r, { passive: !1 })), H.push(u(_, "pointerup", i, { passive: !1 })), H.push(u(_, "pointercancel", i, { passive: !1 }));
		}
		return s(() => m.appendChild(h)), {
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
//#region js/features/viewer/mediaPlayer.ts
function he(e) {
	let t = String(e || "").toLowerCase();
	return t === "video" || t === "audio";
}
function ge({ mode: e, VIEWER_MODES: t, singleView: n, abView: r, sideView: i } = {}) {
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
function _e(e, t = {}) {
	try {
		if (!e) return null;
		let n = String(t?.mediaKind || "").toLowerCase();
		return D(e, {
			...t,
			mediaKind: n
		});
	} catch {
		return null;
	}
}
//#endregion
//#region js/utils/tooltipShortcuts.ts
function k(e, t) {
	let n = String(e || "").trim(), r = String(t || "").trim();
	if (!r) return n;
	if (!n) return r;
	if (r.length === 1) {
		let e = r.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		if (RegExp(`\\(${e}\\)|\\b${e}\\b`, "i").test(n)) return n;
	} else if (n.toLowerCase().includes(r.toLowerCase())) return n;
	return `${n} (${r})`;
}
function ve(e, t, n, { setAriaLabel: r = !0, ariaLabel: i = null } = {}) {
	if (!e) return "";
	let a = k(t, n);
	if (e.title = a, r) {
		let r = i ?? t;
		e.setAttribute("aria-label", k(r, n));
	}
	return a;
}
//#endregion
//#region js/features/viewer/videoSync.ts
var ye = () => {
	try {
		return !!a?.DEBUG_VIEWER;
	} catch {
		return !1;
	}
};
function be(e, t, { threshold: n = .15 } = {}) {
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
		if (ye()) try {
			console.warn("[Viewer] follower video sync setup failed", e);
		} catch (e) {
			console.debug?.(e);
		}
	}
	return r;
}
//#endregion
//#region js/utils/dom.ts
function xe(e, t) {
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
function Se(e) {
	let t = String(e ?? "");
	try {
		if (typeof CSS?.escape == "function") return CSS.escape(t);
	} catch (e) {
		console.debug?.(e);
	}
	return t.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, "\\$1");
}
async function Ce(e) {
	try {
		return navigator?.clipboard?.writeText ? (await navigator.clipboard.writeText(String(e ?? "")), !0) : !1;
	} catch {
		return !1;
	}
}
//#endregion
//#region js/app/settings/MajoorSettingsDialog.ts
var A = "mjr-settings-dialog", we = "mjr-settings-dialog-style", j = null, Te = {
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
function Ee() {
	if (typeof document > "u" || document.getElementById(we)) return;
	let e = document.createElement("style");
	e.id = we, e.textContent = `
#${A} {
    position: fixed;
    inset: 0;
    z-index: 10080;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.48);
    color: var(--fg-color, #ddd);
    font: 13px/1.4 system-ui, -apple-system, Segoe UI, sans-serif;
}
#${A}[hidden] { display: none; }
#${A} .mjr-settings-panel {
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
#${A} .mjr-settings-head,
#${A} .mjr-settings-tools {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.10);
}
#${A} .mjr-settings-title {
    font-weight: 700;
    font-size: 14px;
    flex: 1;
}
#${A} .mjr-settings-close,
#${A} .mjr-settings-reset {
    border: 1px solid rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.06);
    color: inherit;
    border-radius: 6px;
    min-height: 30px;
    padding: 0 10px;
    cursor: pointer;
}
#${A} .mjr-settings-close {
    width: 30px;
    padding: 0;
}
#${A} .mjr-settings-search {
    flex: 1;
    min-width: 160px;
    height: 30px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    background: rgba(0, 0, 0, 0.22);
    color: inherit;
    padding: 0 10px;
}
#${A} .mjr-settings-body {
    overflow: auto;
    padding: 12px;
}
#${A} .mjr-settings-stack {
    display: grid;
    gap: 10px;
}
#${A} .mjr-settings-group {
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.035);
    overflow: hidden;
}
#${A} .mjr-settings-group summary {
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
#${A} .mjr-settings-group summary::-webkit-details-marker {
    display: none;
}
#${A} .mjr-settings-group-icon {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.07);
    color: var(--input-text, #fff);
}
#${A} .mjr-settings-group-title {
    color: var(--input-text, #fff);
    font-weight: 700;
}
#${A} .mjr-settings-group-meta {
    opacity: 0.68;
    font-size: 12px;
}
#${A} .mjr-settings-chevron {
    transition: transform 0.16s ease;
}
#${A} details[open] > summary .mjr-settings-chevron {
    transform: rotate(90deg);
}
#${A} .mjr-settings-group-body {
    padding: 4px 11px 11px;
}
#${A} .mjr-settings-subgroup {
    margin-top: 8px;
}
#${A} .mjr-settings-subgroup-title {
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
#${A} .mjr-settings-subgroup-title::after {
    content: "";
    height: 1px;
    flex: 1;
    background: rgba(255, 255, 255, 0.10);
}
#${A} .mjr-settings-row {
    display: grid;
    grid-template-columns: minmax(220px, 1fr) minmax(180px, 280px);
    align-items: center;
    gap: 16px;
    padding: 9px 0;
    border-top: 1px solid rgba(255, 255, 255, 0.07);
}
#${A} .mjr-settings-name {
    font-weight: 600;
    color: var(--p-primary-color, var(--comfy-accent, #8ab4f8));
}
#${A} .mjr-settings-tip {
    margin-top: 2px;
    opacity: 0.72;
    font-size: 12px;
}
#${A} input,
#${A} select {
    min-height: 30px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    background: rgba(0, 0, 0, 0.22);
    color: inherit;
    padding: 0 8px;
}
#${A} input[type="checkbox"] {
    justify-self: end;
    width: 18px;
    min-height: 18px;
}
#${A} input[type="color"] {
    padding: 2px;
    width: 56px;
    justify-self: end;
}
@media (max-width: 620px) {
    #${A} .mjr-settings-row {
        grid-template-columns: 1fr;
        gap: 8px;
    }
}
`, document.head.appendChild(e);
}
function M(e) {
	return String(e || "").replace(/^\s*Majoor:\s*/i, "").trim();
}
function N(e) {
	let t = Array.isArray(e?.category) ? e.category : [];
	return String(t[1] || "General").trim() || "General";
}
function P(e) {
	return (Array.isArray(e?.category) ? e.category : []).slice(2).filter(Boolean).join(" / ") || "General";
}
function De(e) {
	return Te[e] || {
		icon: "pi pi-sliders-h",
		label: e || "General"
	};
}
function F(e, t) {
	return t ? [
		e?.id,
		e?.name,
		e?.tooltip,
		...Array.isArray(e?.category) ? e.category : []
	].join(" ").toLowerCase().includes(t) : !0;
}
function I(e, t) {
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
function L(e) {
	let t = String(e?.type || "text").toLowerCase(), n = e?.defaultValue, r;
	if (t === "boolean") return r = document.createElement("input"), r.type = "checkbox", r.checked = !!n, r.addEventListener("change", () => I(e, r.checked)), r;
	if (t === "combo") {
		r = document.createElement("select");
		for (let t of e?.options || []) {
			let e = document.createElement("option"), n = t && typeof t == "object" ? t.value ?? t.text ?? t.label : t;
			e.value = String(n ?? ""), e.textContent = String(t && typeof t == "object" ? t.text ?? t.label ?? t.value : t), r.appendChild(e);
		}
		return r.value = String(n ?? ""), r.addEventListener("change", () => I(e, r.value)), r;
	}
	if (r = document.createElement("input"), r.type = t === "color" ? "color" : t === "number" ? "number" : t === "password" ? "password" : "text", e?.attrs && typeof e.attrs == "object") for (let [t, n] of Object.entries(e.attrs)) n != null && r.setAttribute(t, String(n));
	r.value = String(n ?? "");
	let i = t === "color" ? "input" : "change";
	return r.addEventListener(i, () => {
		I(e, t === "number" ? Number(r.value) : r.value);
	}), r;
}
function Oe(e, t, n = "") {
	e.replaceChildren();
	let r = document.createElement("div");
	r.className = "mjr-settings-stack", e.appendChild(r);
	let i = /* @__PURE__ */ new Map();
	for (let e of t || []) {
		if (!F(e, n)) continue;
		let t = N(e), r = P(e);
		i.has(t) || i.set(t, /* @__PURE__ */ new Map());
		let a = i.get(t);
		a.has(r) || a.set(r, []), a.get(r).push(e);
	}
	for (let [e, t] of i.entries()) {
		let i = Array.from(t.values()).flat(), a = De(e), o = document.createElement("details");
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
				if (i.className = "mjr-settings-name", i.textContent = M(e?.name) || e?.id || "Setting", r.appendChild(i), e?.tooltip) {
					let t = document.createElement("div");
					t.className = "mjr-settings-tip", t.textContent = String(e.tooltip), r.appendChild(t);
				}
				n.appendChild(r), n.appendChild(L(e)), t.appendChild(n);
			}
			p.appendChild(t);
		}
		o.appendChild(p), r.appendChild(o);
	}
}
function ke() {
	Ee();
	let e = document.createElement("div");
	e.id = A, e.hidden = !0, e.addEventListener("click", (t) => {
		t.target === e && Ae();
	});
	let t = document.createElement("div");
	t.className = "mjr-settings-panel", t.setAttribute("role", "dialog"), t.setAttribute("aria-modal", "true");
	let n = document.createElement("div");
	n.className = "mjr-settings-head";
	let r = document.createElement("div");
	r.className = "mjr-settings-title", r.textContent = i("settings.majoor.title", "Majoor Assets Manager Settings");
	let a = document.createElement("button");
	a.type = "button", a.className = "mjr-settings-close", a.textContent = "X", a.setAttribute("aria-label", i("btn.close", "Close")), a.addEventListener("click", Ae), n.append(r, a);
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
function Ae() {
	j?.root && (j.root.hidden = !0);
}
function je(t = e()) {
	if (typeof document > "u") return !1;
	j?.root?.isConnected || (j = ke());
	let n = o(t), r = () => Oe(j.body, n, String(j.search.value || "").trim().toLowerCase());
	return j.search.oninput = r, j.search.value = "", r(), j.root.hidden = !1, setTimeout(() => j?.search?.focus?.(), 0), !0;
}
//#endregion
//#region js/app/openMajoorSettings.ts
function R(t = e()) {
	return je(t);
}
try {
	typeof window < "u" && (window.MajoorAssetsManager = window.MajoorAssetsManager || {}, window.MajoorAssetsManager.openSettings = R);
} catch (e) {
	console.debug?.(e);
}
//#endregion
export { b as _, be as a, ge as c, O as d, D as f, x as g, ie as h, Se as i, he as l, ne as m, Ce as n, k as o, re as p, xe as r, ve as s, R as t, _e as u };
