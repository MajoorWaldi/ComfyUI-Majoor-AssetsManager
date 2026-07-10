import { P as e, V as t, Yt as n, _ as r, c as i, d as a, g as o, gt as s, mt as c, n as l, o as u, r as d, s as f, x as p, y as m } from "./viewerRuntimeHosts-BeyPtIl9.js";
import { Ct as h, D as g, a as _, ct as v, h as y, i as b, j as x, k as S, m as C, n as w, o as T, pt as E, r as D, rt as O, t as k } from "./events-DSLVC_8W.js";
import { T as A, nt as j, tt as M } from "./mjr-primevue-n1rsQYJg.js";
import { n as N, r as ee } from "./mjr-vue-vendor-D2GeV7Qd.js";
import { n as P, r as te, t as F } from "./state-DPiaUMw1.js";
import { a as ne, c as re, i as ie, o as ae, r as oe, s as se } from "./model3dRenderer-C7vE1AWS.js";
//#region ui/utils/events.ts
function ce(e, t, { target: n = null, warnPrefix: r = "[Majoor]" } = {}) {
	let i = n || (typeof window < "u" ? window : null);
	if (!i || typeof i.dispatchEvent != "function") return !1;
	try {
		return i.dispatchEvent(new CustomEvent(e, { detail: t }));
	} catch (t) {
		try {
			console.warn(`${r} Failed to dispatch event: ${e}`, t);
		} catch (e) {
			console.debug?.(e);
		}
		return !1;
	}
}
//#endregion
//#region ui/app/DialogTemplates.ts
var le = async (e, t = "Majoor", n = {}) => {
	let r = de();
	if (r && typeof r.alert == "function") try {
		await r.alert({
			title: String(t || "Majoor"),
			message: String(e || "")
		});
		return;
	} catch (e) {
		console.debug?.(e);
	}
	let i = R();
	if (i) try {
		let n = String(e || "");
		typeof i.addAlert == "function" ? i.addAlert(n) : i.add({
			severity: "info",
			summary: String(t || "Majoor"),
			detail: n,
			life: 5e3
		});
		return;
	} catch (e) {
		console.debug?.(e);
	}
	if (n?.native !== !1) {
		let n = z();
		if (n) try {
			n.show(fe(e, t));
			try {
				n.element?.style?.setProperty?.("z-index", "1100");
			} catch (e) {
				console.debug?.(e);
			}
			return;
		} catch (e) {
			console.debug?.(e);
		}
	}
	let a = me();
	if (!a) {
		try {
			window.alert(e);
		} catch (e) {
			console.debug?.(e);
		}
		return;
	}
	return new Promise((n) => {
		let r = new a();
		W(r);
		let i = U("div", { style: {
			display: "flex",
			flexDirection: "column",
			gap: "18px",
			padding: "18px 20px 18px 20px"
		} }, [
			U("div", { style: {
				display: "flex",
				alignItems: "center",
				justifyContent: "flex-start"
			} }, [U("div", {
				textContent: t,
				style: {
					fontWeight: "700",
					fontSize: "30px",
					color: "rgba(255,255,255,0.96)",
					lineHeight: "1.2"
				}
			})]),
			U("div", {
				textContent: String(e || ""),
				style: {
					fontSize: "22px",
					color: "rgba(255,255,255,0.86)",
					whiteSpace: "pre-wrap",
					lineHeight: "1.45"
				}
			}),
			U("div", { style: {
				display: "flex",
				justifyContent: "flex-end",
				gap: "10px"
			} }, [U("button", {
				textContent: C("dialog.confirm", "Confirm"),
				onclick: () => {
					try {
						r.close();
					} catch (e) {
						console.debug?.(e);
					}
					n();
				},
				style: {
					padding: "10px 16px",
					borderRadius: "10px",
					border: "1px solid rgba(17,132,255,0.75)",
					background: "#1184ff",
					color: "rgba(255,255,255,0.98)",
					fontWeight: "600",
					cursor: "pointer"
				}
			})])
		]);
		try {
			r.show(i), setTimeout(() => G(r), 0);
		} catch {
			try {
				window.alert(e);
			} catch (e) {
				console.debug?.(e);
			}
			n();
		}
	});
}, I = async (e, t = "Majoor") => {
	let n = de();
	if (n) try {
		let r = {
			title: String(t || C("dialog.confirm", "Confirm")),
			message: String(e || "")
		};
		return !!(typeof n.confirm == "function" && await n.confirm(r));
	} catch (e) {
		console.debug?.(e);
	}
	let r = me();
	if (!r) try {
		return window.confirm(e);
	} catch {
		return !1;
	}
	return new Promise((n) => {
		let i = new r();
		W(i);
		let a = (e) => {
			try {
				i.close();
			} catch (e) {
				console.debug?.(e);
			}
			n(!!e);
		}, o = U("div", { style: {
			display: "flex",
			flexDirection: "column",
			gap: "18px",
			padding: "18px 20px 18px 20px"
		} }, [
			U("div", { style: {
				display: "flex",
				alignItems: "center",
				justifyContent: "flex-start"
			} }, [U("div", {
				textContent: t,
				style: {
					fontWeight: "700",
					fontSize: "30px",
					color: "rgba(255,255,255,0.96)",
					lineHeight: "1.2"
				}
			})]),
			U("div", {
				textContent: String(e || ""),
				style: {
					fontSize: "22px",
					color: "rgba(255,255,255,0.86)",
					whiteSpace: "pre-wrap",
					lineHeight: "1.45"
				}
			}),
			U("div", { style: {
				display: "flex",
				justifyContent: "flex-end",
				gap: "10px"
			} }, [U("button", {
				textContent: C("dialog.cancel", "Cancel"),
				onclick: () => a(!1),
				style: {
					padding: "10px 16px",
					borderRadius: "10px",
					border: "1px solid rgba(255,255,255,0.18)",
					background: "rgba(255,255,255,0.06)",
					color: "rgba(255,255,255,0.85)",
					fontWeight: "600",
					cursor: "pointer"
				}
			}), U("button", {
				textContent: C("dialog.confirm", "Confirm"),
				onclick: () => a(!0),
				style: {
					padding: "10px 16px",
					borderRadius: "10px",
					border: "1px solid rgba(17,132,255,0.75)",
					background: "#1184ff",
					color: "rgba(255,255,255,0.98)",
					fontWeight: "600",
					cursor: "pointer"
				}
			})])
		]);
		try {
			i.show(o), setTimeout(() => G(i), 0);
		} catch {
			try {
				n(!!window.confirm(e));
			} catch {
				n(!1);
			}
		}
	});
}, L = async (e, t = "", n = "Majoor") => {
	let r = de();
	if (r) try {
		let i = {
			title: String(n || C("dialog.prompt", "Prompt")),
			message: String(e || ""),
			defaultValue: String(t ?? "")
		}, a = typeof r.prompt == "function" ? await r.prompt(i) : null;
		return a == null ? null : String(a);
	} catch (e) {
		console.debug?.(e);
	}
	let i = me();
	if (!i) try {
		return window.prompt(e, t);
	} catch {
		return null;
	}
	return new Promise((r) => {
		let a = new i();
		W(a);
		let o = (e) => {
			try {
				a.close();
			} catch (e) {
				console.debug?.(e);
			}
			r(e ?? null);
		}, s = U("input", {
			type: "text",
			value: String(t ?? ""),
			style: {
				width: "100%",
				padding: "10px 10px",
				borderRadius: "10px",
				border: "1px solid rgba(255,255,255,0.12)",
				background: "rgba(0,0,0,0.25)",
				color: "rgba(255,255,255,0.9)",
				outline: "none",
				boxSizing: "border-box"
			},
			onkeydown: (e) => {
				e.key === "Enter" && o(s.value), e.key === "Escape" && o(null), e.stopPropagation();
			}
		}), c = U("div", { style: {
			display: "flex",
			flexDirection: "column",
			gap: "12px",
			padding: "16px"
		} }, [
			U("div", {
				textContent: n,
				style: {
					fontWeight: "600",
					fontSize: "14px",
					color: "rgba(255,255,255,0.95)"
				}
			}),
			U("div", {
				textContent: String(e || ""),
				style: {
					fontSize: "13px",
					color: "rgba(255,255,255,0.80)",
					whiteSpace: "pre-wrap",
					lineHeight: "1.4"
				}
			}),
			s,
			U("div", { style: {
				display: "flex",
				justifyContent: "flex-end",
				gap: "10px"
			} }, [U("button", {
				textContent: C("dialog.cancel", "Cancel"),
				onclick: () => o(null),
				style: {
					padding: "8px 12px",
					borderRadius: "8px",
					border: "1px solid rgba(255,255,255,0.12)",
					background: "rgba(0,0,0,0.25)",
					color: "rgba(255,255,255,0.85)",
					cursor: "pointer"
				}
			}), U("button", {
				textContent: C("dialog.ok", "OK"),
				onclick: () => o(s.value),
				style: {
					padding: "8px 12px",
					borderRadius: "8px",
					border: "1px solid rgba(95,179,255,0.45)",
					background: "rgba(95,179,255,0.18)",
					color: "rgba(255,255,255,0.95)",
					cursor: "pointer"
				}
			})])
		]);
		try {
			a.show(c), setTimeout(() => G(a), 0), setTimeout(() => {
				try {
					s.focus(), s.select();
				} catch (e) {
					console.debug?.(e);
				}
			}, 0);
		} catch {
			try {
				r(window.prompt(e, t));
			} catch {
				r(null);
			}
		}
	});
}, ue = () => {
	try {
		return x()?.ui || null;
	} catch {
		return null;
	}
}, de = () => {
	let e = (e) => !!e && (typeof e.alert == "function" || typeof e.confirm == "function" || typeof e.prompt == "function");
	try {
		let t = g();
		if (e(t)) return t;
	} catch (e) {
		console.debug?.(e);
	}
	return null;
}, R = () => {
	try {
		let e = S();
		if (e && typeof e.add == "function") return e;
	} catch (e) {
		console.debug?.(e);
	}
	return null;
}, z = () => {
	try {
		let e = ue();
		if (e?.dialog && typeof e.dialog.show == "function") return e.dialog;
	} catch (e) {
		console.debug?.(e);
	}
	return null;
}, fe = (e, t = "Majoor") => {
	let n = String(e ?? ""), r = String(t ?? "").trim();
	return !r || r.toLowerCase() === "majoor" ? n : `${r}<br><br>${n}`;
}, B = new Set(/* @__PURE__ */ "abort.blur.change.click.close.contextmenu.dblclick.dragend.dragenter.dragleave.dragover.dragstart.drop.error.focus.input.keydown.keypress.keyup.load.mousedown.mouseenter.mouseleave.mousemove.mouseout.mouseover.mouseup.reset.resize.scroll.select.submit.touchcancel.touchend.touchmove.touchstart.transitionend.unload.wheel".split(".")), V = new Set([
	"__proto__",
	"constructor",
	"prototype",
	"innerHTML",
	"outerHTML",
	"srcdoc",
	"__defineGetter__",
	"__defineSetter__",
	"__lookupGetter__",
	"__lookupSetter__"
]), H = new Set([
	"id",
	"name",
	"value",
	"type",
	"checked",
	"disabled",
	"placeholder",
	"title",
	"textContent",
	"htmlFor",
	"role",
	"tabIndex"
]), pe = (e, t = {}, n = []) => {
	let r = document.createElement(e);
	return Object.entries(t || {}).forEach(([e, t]) => {
		let n = String(e || "");
		if (!(!n || V.has(n))) {
			if (e === "style" && t && typeof t == "object") {
				Object.assign(r.style, t);
				return;
			}
			if (e === "className") {
				r.className = String(t);
				return;
			}
			if (n.startsWith("on")) {
				if (typeof t == "function") {
					let e = n.slice(2).toLowerCase();
					B.has(e) && r.addEventListener(e, t);
				}
				return;
			}
			if (H.has(n)) try {
				r[n] = t;
				return;
			} catch (e) {
				console.debug?.(e);
			}
			try {
				r.setAttribute(n, String(t));
			} catch (e) {
				console.debug?.(e);
			}
		}
	}), (Array.isArray(n) ? n : [n]).filter(Boolean).forEach((e) => {
		try {
			r.appendChild(e);
		} catch {
			r.appendChild(document.createTextNode(String(e)));
		}
	}), r;
}, U = (e, t, n) => {
	let r = ue();
	if (r?.$el) try {
		return r.$el(e, t, n);
	} catch {}
	return pe(e, t, n);
}, me = () => ue()?.ComfyDialog || null, he = 999999, ge = 560, _e = 12, W = (e) => {
	try {
		e.element.style.zIndex = String(he), e.element.style.width = `${ge}px`, e.element.style.padding = "0", e.element.style.backgroundColor = "var(--comfy-menu-bg, #131722)", e.element.style.border = "1px solid rgba(255,255,255,0.14)", e.element.style.borderRadius = `${_e}px`, e.element.style.boxSizing = "border-box", e.element.style.overflow = "hidden", e.element.style.boxShadow = "0 18px 48px rgba(0,0,0,0.48)";
	} catch (e) {
		console.debug?.(e);
	}
}, G = (e) => {
	try {
		let t = e?.element;
		if (!t) return;
		let n = t.querySelectorAll("button,[role='button']");
		for (let e of n) {
			let t = String(e?.textContent || "").trim().toLowerCase(), n = String(e?.getAttribute?.("aria-label") || "").trim().toLowerCase();
			if (t === "close" || n === "close") try {
				e.style.display = "none";
			} catch (e) {
				console.debug?.(e);
			}
		}
	} catch (e) {
		console.debug?.(e);
	}
};
//#endregion
//#region ui/features/status/AssetStatusDotTheme.ts
function K(e) {
	return String(e || "").trim().toLowerCase();
}
function ve({ dot: e = null, asset: t = null, scope: n = "" } = {}) {
	let r = K(n);
	if (r) return r === "custom";
	let i = K(t?.type || t?.scope);
	if (i) return i === "custom";
	try {
		let t = K(e?.closest?.(".mjr-grid")?.dataset?.mjrScope);
		if (t) return t === "custom";
	} catch (e) {
		console.debug?.(e);
	}
	return !1;
}
function ye(e, t = {}) {
	let n = K(e);
	return ve(t) ? n === "pending" || n === "info" ? "var(--mjr-browser-status-info, #4DB6AC)" : n === "success" ? "var(--mjr-browser-status-success, #2E7D32)" : n === "warning" ? "var(--mjr-browser-status-warning, #FFB74D)" : n === "error" ? "var(--mjr-browser-status-error, #EF5350)" : "var(--mjr-browser-status-neutral, #90A4AE)" : n === "pending" || n === "info" ? "var(--mjr-status-info, #64B5F6)" : n === "success" ? "var(--mjr-status-success, #4CAF50)" : n === "warning" ? "var(--mjr-status-warning, #FFA726)" : n === "error" ? "var(--mjr-status-error, #f44336)" : "var(--mjr-status-neutral, #666)";
}
//#endregion
//#region ui/stores/useRuntimeStore.ts
var q = N("mjr-runtime", () => {
	let e = j(null), t = j(null), n = j(!1), r = j(0), i = j(null), a = j(null), o = j(null), s = j(null), c = j(null), l = j([]), u = A(() => !!i.value), d = A(() => {
		let e = s.value, t = c.value;
		return !t || t <= 0 || e == null ? 0 : Math.round(e / t * 100);
	});
	function f(t) {
		e.value = t;
	}
	function p(e) {
		t.value = e;
	}
	function m(e, t) {
		n.value = !!e, r.value = Math.max(0, Number(t || 0) || 0);
	}
	function h() {
		return {
			active: n.value,
			queueLength: r.value
		};
	}
	function g(e = {}) {
		e.active_prompt_id !== void 0 && (i.value = e.active_prompt_id), e.queue_remaining !== void 0 && (a.value = e.queue_remaining), e.progress_node !== void 0 && (o.value = e.progress_node), e.progress_value !== void 0 && (s.value = e.progress_value), e.progress_max !== void 0 && (c.value = e.progress_max), e.cached_nodes !== void 0 && (l.value = e.cached_nodes ?? []);
	}
	function _() {
		i.value = null, a.value = null, o.value = null, s.value = null, c.value = null, l.value = [];
	}
	return {
		comfyApp: e,
		comfyApi: t,
		enrichmentActive: n,
		enrichmentQueueLength: r,
		activePromptId: i,
		queueRemaining: a,
		progressNode: o,
		progressValue: s,
		progressMax: c,
		cachedNodes: l,
		isExecuting: u,
		progressPercent: d,
		setComfyApp: f,
		setComfyApi: p,
		setEnrichmentState: m,
		getEnrichmentState: h,
		applyExecutionStatus: g,
		resetExecution: _
	};
});
//#endregion
//#region ui/stores/getOptionalRuntimeStore.ts
function be() {
	try {
		return ee() ? q() : null;
	} catch {
		return null;
	}
}
//#endregion
//#region ui/stores/runtimeEnrichmentState.ts
var xe = Symbol.for("majoor.assets_manager.runtime_state");
function Se() {
	return {
		api: null,
		assetsDeletedHandler: null,
		enrichmentActive: !1,
		enrichmentQueueLength: 0
	};
}
function Ce() {
	try {
		let e = typeof globalThis < "u" ? globalThis : {};
		return (!e[xe] || typeof e[xe] != "object") && (e[xe] = Se()), e[xe];
	} catch {
		return Se();
	}
}
function we(e, t) {
	let n = be();
	if (n) {
		n.setEnrichmentState(e, t);
		return;
	}
	let r = Ce();
	r.enrichmentActive = !!e, r.enrichmentQueueLength = Math.max(0, Number(t || 0) || 0);
}
function Te() {
	let e = be();
	if (e) return e.getEnrichmentState();
	let t = Ce();
	return {
		active: !!t.enrichmentActive,
		queueLength: Math.max(0, Number(t.enrichmentQueueLength || 0) || 0)
	};
}
//#endregion
//#region ui/features/grid/AssetCardRenderer.ts
function Ee(e) {
	try {
		return String(e || "").trim().toLowerCase();
	} catch {
		return "";
	}
}
function De(e) {
	try {
		return (String(e || "").split(".").pop() || "").toUpperCase();
	} catch {
		return "";
	}
}
function Oe(e) {
	try {
		let t = String(e || ""), n = t.lastIndexOf("."), r = n > 0 ? t.slice(0, n) : t;
		return String(r || "").trim().toLowerCase();
	} catch {
		return "";
	}
}
function ke(e) {
	try {
		if (String(e?.kind || "").toLowerCase() !== "video") return !1;
		let t = String(e?.filename || "").toLowerCase();
		return t.includes("-audio") || t.includes("_audio");
	} catch {
		return !1;
	}
}
function Ae(e) {
	try {
		let t = String(e?.kind || "").toLowerCase(), n = 0;
		ke(e) ? n = 2 : t === "video" && (n = 1);
		let r = +(Number(e?.has_generation_data || 0) > 0), i = Number(e?.size || 0), a = Number(e?.mtime || 0);
		return [
			n,
			a,
			r,
			i
		];
	} catch {
		return [
			0,
			0,
			0,
			0
		];
	}
}
function je(e, t) {
	for (let n = 0; n < Math.max(e.length, t.length); n++) {
		let r = (e[n] || 0) - (t[n] || 0);
		if (r !== 0) return r;
	}
	return 0;
}
function Me(e) {
	if (!Array.isArray(e) || e.length === 0) return null;
	if (e.length === 1) return e[0];
	let t = e[0], n = Ae(t);
	for (let r = 1; r < e.length; r++) {
		let i = e[r], a = Ae(i);
		je(a, n) > 0 && (t = i, n = a);
	}
	return t;
}
function Ne(e, t) {
	if (!e || !Array.isArray(t) || t.length === 0 || (Number(e?.generation_time_ms ?? e?.metadata?.generation_time_ms ?? 0) || 0) > 0) return e;
	let n = t.find((e) => (Number(e?.generation_time_ms ?? e?.metadata?.generation_time_ms ?? 0) || 0) > 0);
	if (!n) return e;
	let r = Number(n?.generation_time_ms ?? n?.metadata?.generation_time_ms ?? 0) || 0;
	return r <= 0 ? e : (e.generation_time_ms = r, !e.has_generation_data && n?.has_generation_data && (e.has_generation_data = n.has_generation_data), e);
}
function Pe(e, t) {
	let n = String(e?.kind || "").toLowerCase();
	if (n) return n;
	let r = new Set([
		"PNG",
		"JPG",
		"JPEG",
		"WEBP",
		"GIF",
		"BMP",
		"TIF",
		"TIFF"
	]), i = new Set([
		"MP4",
		"WEBM",
		"MOV",
		"AVI",
		"MKV"
	]), a = new Set([
		"MP3",
		"WAV",
		"OGG",
		"FLAC"
	]), o = new Set([
		"OBJ",
		"FBX",
		"GLB",
		"GLTF",
		"STL",
		"PLY",
		"SPLAT",
		"KSPLAT",
		"SPZ"
	]);
	return r.has(t) ? "image" : i.has(t) ? "video" : a.has(t) ? "audio" : o.has(t) ? "model3d" : "unknown";
}
function Fe(e) {
	try {
		return !!e()?.siblings?.hidePngSiblings;
	} catch {
		return !1;
	}
}
function Ie(e) {
	return `${String(e?.source || e?.type || "").trim().toLowerCase()}|${String(e?.root_id || e?.custom_root_id || "").trim().toLowerCase()}|${String(e?.subfolder || "").trim().toLowerCase()}`;
}
function J(e) {
	let t = Ee(e?.filename);
	return t ? `${Ie(e)}|${t}` : "";
}
function Le(e, t = De(e?.filename || "")) {
	let n = Pe(e, t), r = String(e?.filename || "").trim();
	if (!r) return "";
	let i = Ie(e);
	if (n === "model3d") return `${i}|model3d|${r.toLowerCase()}`;
	let a = Oe(r);
	return a ? `${i}|media|${a}` : "";
}
function Re(e) {
	let t = e.nonImageSiblingKeys || /* @__PURE__ */ new Set();
	e.nonImageSiblingKeys = t;
	let n = e.stemMap || /* @__PURE__ */ new Map();
	e.stemMap = n;
	let r = e.assetIdSet || /* @__PURE__ */ new Set();
	e.assetIdSet = r;
	let i = e.seenKeys || /* @__PURE__ */ new Set();
	return e.seenKeys = i, e.hiddenPngSiblings ??= 0, {
		nonImageSiblingKeys: t,
		stemMap: n,
		assetIdSet: r,
		seenKeys: i
	};
}
function ze(e, t = [], { assetKey: n = null, preserveHiddenCount: r = !1 } = {}) {
	let i = Number(e?.hiddenPngSiblings || 0) || 0;
	e.seenKeys = /* @__PURE__ */ new Set(), e.assetIdSet = /* @__PURE__ */ new Set(), e.filenameCounts = /* @__PURE__ */ new Map(), e.nonImageSiblingKeys = /* @__PURE__ */ new Set(), e.stemMap = /* @__PURE__ */ new Map(), e.renderedFilenameMap = /* @__PURE__ */ new Map(), e.hiddenPngSiblings = r ? i : 0, typeof n == "function" && (e.assetKeyFn = n);
	let a = Re(e);
	for (let r of Array.isArray(t) ? t : []) if (!(!r || typeof r != "object")) {
		try {
			let e = r?.id == null ? "" : String(r.id);
			e && a.assetIdSet.add(e);
		} catch (e) {
			console.debug?.(e);
		}
		try {
			let t = typeof n == "function" ? n(r) : e?.assetKeyFn?.(r);
			t && a.seenKeys.add(t);
		} catch (e) {
			console.debug?.(e);
		}
		try {
			let t = J(r);
			t && e.filenameCounts.set(t, (Number(e.filenameCounts.get(t) || 0) || 0) + 1);
		} catch (e) {
			console.debug?.(e);
		}
		try {
			let e = De(r?.filename || ""), t = Le(r, e);
			if (!t) continue;
			let n = a.stemMap.get(t);
			n || (n = [], a.stemMap.set(t, n)), n.push(r);
			let i = Pe(r, e);
			(i === "video" || i === "audio" || i === "model3d" || e === "WEBP") && a.nonImageSiblingKeys.add(t);
		} catch (e) {
			console.debug?.(e);
		}
	}
}
function Be(e, t, n) {
	try {
		t?.id != null && n.assetIdSet.delete(String(t.id));
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let r = e?.assetKeyFn?.(t);
		r && n.seenKeys.delete(r);
	} catch (e) {
		console.debug?.(e);
	}
}
function Ve(e, t, n, r) {
	let i = n.stemMap.get(t);
	if (!i?.length) return [];
	let a = [];
	for (let e = i.length - 1; e >= 0; e--) r(i[e]) && (a.push(i[e]), i.splice(e, 1));
	return i.length || n.stemMap.delete(t), a;
}
function He(e, t, n) {
	if (!Fe(n)) return {
		hidden: !1,
		hideEnabled: !1,
		removed: []
	};
	let r = Re(t), i = String(e?.filename || ""), a = De(i), o = Pe(e, a), s = Le(e, a);
	if (!s) return {
		hidden: !1,
		hideEnabled: !0,
		removed: []
	};
	if (o === "video" || o === "audio" || o === "model3d" || a === "WEBP") return r.nonImageSiblingKeys.add(s), {
		hidden: !1,
		hideEnabled: !0,
		removed: Ve(t, s, r, (e) => De(e?.filename || "") === "PNG")
	};
	if (a === "PNG") {
		let t = `${Ie(e)}|model3d|${Oe(i)}`;
		if (r.nonImageSiblingKeys.has(s) || r.nonImageSiblingKeys.has(t)) return {
			hidden: !0,
			hideEnabled: !0,
			removed: []
		};
	}
	return {
		hidden: !1,
		hideEnabled: !0,
		removed: []
	};
}
function Ue(e, t, n, r) {
	let i = Fe(r.loadMajoorSettings), a = n.filenameCounts || /* @__PURE__ */ new Map();
	n.filenameCounts = a, r.clearGridMessage(e);
	let o = r.ensureVirtualGrid(e, n);
	if (!o) return 0;
	i || (n.hiddenPngSiblings = 0), n.assetKeyFn = r.assetKey;
	let s = Re(n), c = /* @__PURE__ */ new Map();
	for (let e of n.assets || []) {
		let t = J(e);
		if (!t) continue;
		let n = c.get(t);
		n || (n = [], c.set(t, n)), n.push(e);
	}
	let l = 0, u = !1, d = [], f = /* @__PURE__ */ new Set(), p = () => {
		try {
			let t = new Set((Array.isArray(n.assets) ? n.assets : []).map((e) => String(e?.id || "")).filter(Boolean));
			for (let [i, o] of c.entries()) {
				let s = (Array.isArray(o) ? o : []).filter((e) => {
					let n = String(e?.id || "");
					return n ? t.has(n) : !1;
				}), c = s.length;
				if (a.set(i, c), c < 2) {
					for (let e of s) e._mjrNameCollision = !1, delete e._mjrNameCollisionCount, delete e._mjrNameCollisionPaths, e._mjrDupStack && (e._mjrDupStack = !1, e._mjrDupMembers = null, e._mjrDupCount = 0);
					let t = n.renderedFilenameMap?.get(i);
					if (t) for (let n of t) {
						let t = n.querySelector?.(".mjr-file-badge");
						r.setFileBadgeCollision(t, !1);
						try {
							r.ensureDupStackCard?.(e, n, n._mjrAsset);
						} catch (e) {
							console.debug?.(e);
						}
					}
					continue;
				}
				let l = Ne(Me(s), s), u = s.filter((e) => e !== l);
				for (let e of s) e._mjrNameCollision = !1, delete e._mjrNameCollisionCount, delete e._mjrNameCollisionPaths, e !== l && (e._mjrDupStack = !1, e._mjrDupMembers = null, e._mjrDupCount = 0);
				let d = Array.isArray(l._mjrDupMembers) ? l._mjrDupMembers : [], f = new Set(d.map((e) => String(e?.id || ""))), p = [...d, ...s.filter((e) => !f.has(String(e?.id || "")))];
				l._mjrDupStack = !0, l._mjrDupMembers = p, l._mjrDupCount = p.length, l._mjrNameCollision = !1;
				let m = new Set(u.map((e) => String(e?.id || "")));
				m.size > 0 && (n.assets = n.assets.filter((e) => !m.has(String(e?.id || ""))));
				let h = n.renderedFilenameMap?.get(i);
				if (h) for (let t of h) {
					let n = t._mjrAsset, i = t.querySelector?.(".mjr-file-badge");
					if (n === l || String(n?.id || "") === String(l?.id || "")) {
						r.setFileBadgeCollision(i, !1);
						try {
							r.ensureDupStackCard?.(e, t, l);
						} catch (e) {
							console.debug?.(e);
						}
					}
				}
			}
		} catch (e) {
			console.debug?.(e);
		}
	};
	for (let e of t || []) {
		try {
			if (e?.id == null || String(e.id).trim() === "") {
				let t = String(e?.kind || "").toLowerCase(), n = String(e?.filepath || "").trim(), r = String(e?.subfolder || "").trim(), i = String(e?.filename || "").trim();
				e.id = `asset:${`${String(e?.type || "").trim().toLowerCase()}|${t}|${n}|${r}|${i}` || "unknown"}`;
			}
		} catch (e) {
			console.debug?.(e);
		}
		let t = De(String(e?.filename || "")), i = He(e, n, r.loadMajoorSettings);
		for (let e of i.removed || []) f.add(e);
		if (i.hidden) {
			n.hiddenPngSiblings += 1;
			continue;
		}
		let a = J(e);
		if (a) {
			let t = c.get(a);
			t || (t = [], c.set(a, t)), t.push(e);
		}
		let o = r.assetKey(e);
		if (!o || s.seenKeys.has(o) || e.id != null && s.assetIdSet.has(String(e.id))) continue;
		s.seenKeys.add(o), e.id != null && s.assetIdSet.add(String(e.id)), d.push(e);
		let u = Le(e, t);
		if (u) {
			let t = s.stemMap.get(u);
			t || (t = [], s.stemMap.set(u, t)), t.push(e);
		}
		l++;
	}
	if (f.size > 0) {
		n.hiddenPngSiblings += f.size, n.assets = n.assets.filter((e) => !f.has(e));
		for (let e = d.length - 1; e >= 0; e--) f.has(d[e]) && (d.splice(e, 1), l = Math.max(0, l - 1));
		for (let e of f) Be(n, e, s);
		try {
			for (let e of f) {
				let t = J(e);
				if (!t) continue;
				let n = c.get(t);
				if (!n) continue;
				let r = n.indexOf(e);
				r > -1 && n.splice(r, 1), n.length || c.delete(t);
			}
		} catch (e) {
			console.debug?.(e);
		}
		u = !0;
	}
	d.length > 0 && (n.assets.push(...d), u = !0), u && (p(), o.setItems(n.assets), n.sentinel && e.appendChild(n.sentinel));
	try {
		e.dataset.mjrHidePngSiblingsEnabled = i ? "1" : "0", e.dataset.mjrHiddenPngSiblings = String(Number(n.hiddenPngSiblings || 0) || 0);
	} catch (e) {
		console.debug?.(e);
	}
	return l;
}
//#endregion
//#region ui/components/Badges.ts
function We({ ext: e = "", filename: t = "", count: n = 0, paths: r = [] } = {}) {
	let i = String(e || "").trim(), a = String(t || "").trim(), o = Math.max(0, Number(n) || 0), s = Array.isArray(r) ? r.map((e) => String(e || "").trim()).filter(Boolean) : [];
	if (o < 2) return `${i} file`;
	let c = [`${i}+ name collision in current view (${o})`];
	if (a && c.push(`Name: ${a}`), s.length) {
		c.push("Paths:");
		for (let e of s.slice(0, 4)) c.push(`- ${e}`);
		s.length > 4 && c.push(`- ... +${s.length - 4} more`);
	}
	return c.push("Click to select collisions in current view"), c.join("\n");
}
function Ge(e, t, n = !1, r = null) {
	let i = document.createElement("div");
	i.className = "mjr-file-badge";
	let a = String(e || "").split(".").pop()?.toUpperCase?.() || "";
	try {
		i.dataset.mjrExt = a;
	} catch (e) {
		console.debug?.(e);
	}
	let o = {
		image: "--mjr-badge-image",
		video: "--mjr-badge-video",
		audio: "--mjr-badge-audio",
		model3d: "--mjr-badge-model3d"
	}[Pe({ kind: t }, a)], s = o ? `var(${o}, #607D8B)` : "#607D8B", c = n ? "var(--mjr-badge-duplicate-alert, #ff1744)" : s;
	i.textContent = a + (n ? "+" : ""), i.title = n ? We({
		ext: a,
		filename: e,
		count: r?.count,
		paths: r?.paths
	}) : `${a} file`, i.style.cssText = `
        position: absolute;
        top: 6px;
        left: 6px;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 700;
        background: ${c};
        opacity: 0.85;
        color: white;
        text-transform: uppercase;
        pointer-events: auto;
        z-index: 10;
        letter-spacing: 0.5px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        cursor: ${n ? "pointer" : "default"};
    `;
	try {
		i.dataset.mjrBadgeBg = s;
	} catch (e) {
		console.debug?.(e);
	}
	return i;
}
function Ke(e, t, n = null) {
	if (e) try {
		let r = e.dataset?.mjrExt || "", i = e.dataset?.mjrBadgeBg || "var(--mjr-badge-image, #607D8B)";
		e.textContent = String(r || "") + (t ? "+" : ""), e.title = t ? We({
			ext: r,
			filename: n?.filename || "",
			count: n?.count,
			paths: n?.paths
		}) : `${r} file`, e.style.background = t ? "var(--mjr-badge-duplicate-alert, #ff1744)" : i, e.style.cursor = t ? "pointer" : "default";
	} catch (e) {
		console.debug?.(e);
	}
}
function qe(e) {
	return e === !0 ? !0 : e === !1 ? !1 : e === 1 || e === "1" ? !0 : e === 0 || e === "0" ? !1 : null;
}
function Je(e, t = []) {
	if (!e || typeof e != "object") return null;
	for (let n of t) if (e[n] != null) return e[n];
	return null;
}
function Ye(e) {
	return typeof e == "string" && e.trim().length > 0;
}
function Xe(e) {
	if (Array.isArray(e)) return e.some((e) => String(e ?? "").trim().length > 0);
	if (e && typeof e == "object") return Object.keys(e).length > 0;
	if (typeof e != "string") return !1;
	let t = e.trim();
	if (!t || t === "[]" || t === "[ ]" || /^(null|none)$/i.test(t)) return !1;
	if (t.startsWith("[") && t.endsWith("]") || t.startsWith("{") && t.endsWith("}")) try {
		let e = JSON.parse(t);
		return Array.isArray(e) ? e.some((e) => String(e ?? "").trim().length > 0) : e && typeof e == "object" ? Object.keys(e).length > 0 : !!e;
	} catch (e) {
		console.debug?.(e);
	}
	return !0;
}
function Y(e) {
	let t = Je(e, [
		"auto_tags",
		"autoTags",
		"ai_auto_tags",
		"aiAutoTags",
		"suggested_tags",
		"suggestedTags"
	]), n = Je(e, [
		"enhanced_caption",
		"enhancedCaption",
		"enhanced_prompt",
		"enhancedPrompt",
		"ai_enhanced_prompt",
		"aiEnhancedPrompt"
	]), r = qe(Je(e, [
		"has_ai_auto_tags",
		"hasAiAutoTags",
		"ai_has_auto_tags",
		"aiHasAutoTags"
	])), i = qe(Je(e, [
		"has_ai_enhanced_caption",
		"hasAiEnhancedCaption",
		"ai_has_enhanced_caption",
		"aiHasEnhancedCaption"
	])), a = qe(Je(e, [
		"has_ai_vector",
		"hasAiVector",
		"has_vector_embedding",
		"hasVectorEmbedding",
		"vector_indexed",
		"vectorIndexed"
	])), o = qe(Je(e, [
		"has_ai_info",
		"hasAiInfo",
		"ai_indexed",
		"aiIndexed"
	])), s = r === !0 || r === null && Xe(t), c = i === !0 || i === null && Ye(n), l = a === !0 || o === !0;
	return {
		hasAiInfo: o === !0 || s || c || l,
		hasAutoTags: s,
		hasEnhancedPrompt: c,
		hasVectorIndexed: l
	};
}
function Ze(e) {
	let t = document.createElement("span");
	t.className = "mjr-workflow-dot mjr-asset-status-dot";
	let n = qe(e?.has_workflow ?? e?.hasWorkflow), r = qe(e?.has_generation_data ?? e?.hasGenerationData), i = Te(), a = i.queueLength, o = i.active || a > 0, s = "Pending: parsing metadata...", c = n === !0 || r === !0, l = n === !1 || r === !1, u = n === null || r === null;
	n === !0 && r === !0 ? s = "Complete: workflow + generation data detected" : c ? s = n === !0 ? "Partial: workflow only (generation data missing)" : "Partial: generation data only (workflow missing)" : l && !c && !u ? s = "None: no workflow or generation data found" : u && (s = "Pending: metadata not parsed yet");
	let d = u ? "pending" : n === !0 && r === !0 ? "success" : c ? "warning" : "error";
	o && d !== "success" && (d = "pending", s = a > 0 ? `Pending: database metadata enrichment in progress (${a} queued)` : "Pending: database metadata enrichment in progress"), Qe(t, d, s, { asset: e });
	let f = Y(e);
	if (f.hasAiInfo) {
		let e = [];
		f.hasVectorIndexed && e.push("vector indexed"), f.hasAutoTags && e.push("AI tag suggestions"), f.hasEnhancedPrompt && e.push("enhanced prompt"), t.textContent = "";
		let n = document.createElement("i");
		n.className = "pi pi-sparkles", n.setAttribute("aria-hidden", "true"), n.style.fontSize = "11px", n.style.lineHeight = "1", t.appendChild(n);
		try {
			t.dataset.mjrAi = "1";
		} catch (e) {
			console.debug?.(e);
		}
		t.title = `${s}\nAI: ${e.length ? e.join(", ") : "indexed"}\nClick to rescan this file`;
	} else {
		try {
			t.dataset.mjrAi = "0";
		} catch (e) {
			console.debug?.(e);
		}
		t.textContent = "●", t.title = `${s}\nClick to rescan this file`;
	}
	return t;
}
function Qe(e, t, n = "", r = {}) {
	if (!e) return;
	let i = String(t || "").toLowerCase(), a = ye(i, {
		dot: e,
		...r || {}
	});
	try {
		e.dataset.mjrStatus = i || "neutral";
	} catch (e) {
		console.debug?.(e);
	}
	if (e.style.cssText = `
        color: ${a};
        margin-left: 4px;
        font-size: 12px;
        line-height: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: color 0.25s ease, opacity 0.25s ease;
    `, n) try {
		e.title = String(n);
	} catch (e) {
		console.debug?.(e);
	}
}
function $e(e) {
	let t = Math.max(0, Math.min(5, Number(e) || 0));
	if (t <= 0) return null;
	let n = document.createElement("div");
	n.className = "mjr-rating-badge", n.title = `Rating: ${t} star${t > 1 ? "s" : ""}`, n.style.cssText = "\n        position: absolute;\n        top: 6px;\n        right: 6px;\n        background: rgba(0, 0, 0, 0.55);\n        border: 1px solid rgba(255, 255, 255, 0.12);\n        padding: 2px 6px;\n        border-radius: 6px;\n        font-size: 13px;\n        letter-spacing: 1px;\n        display: inline-flex;\n        align-items: center;\n        justify-content: center;\n        pointer-events: none;\n        z-index: 10;\n        text-shadow: 0 2px 6px rgba(0,0,0,0.6);\n        box-shadow: 0 6px 18px rgba(0,0,0,0.25);\n    ";
	for (let e = 1; e <= t; e++) {
		let r = document.createElement("span");
		r.textContent = "★", r.style.color = "var(--mjr-rating-color, var(--mjr-star-active, #FFD45A))", r.style.marginRight = e < t ? "2px" : "0", n.appendChild(r);
	}
	return n;
}
function et(e) {
	if (Array.isArray(e)) return e.map((e) => String(e ?? "").trim()).filter(Boolean);
	if (typeof e == "string") {
		let t = e.trim();
		if (!t) return [];
		try {
			let e = JSON.parse(t);
			if (Array.isArray(e)) return e.map((e) => String(e ?? "").trim()).filter(Boolean);
		} catch {}
		return t.split(",").map((e) => e.trim()).filter(Boolean);
	}
	return [];
}
function tt(e) {
	let t = Number(e) / 1e3;
	return t >= 60 ? "#FF9800" : t >= 30 ? "#FFC107" : t >= 10 ? "#8BC34A" : "#4CAF50";
}
function nt(e) {
	let t = e / 1e3;
	if (t >= 60) {
		let e = (t / 60).toFixed(1);
		return {
			text: `${e}m`,
			title: `Generation time: ${e} minutes (${t.toFixed(1)}s)`
		};
	}
	let n = t.toFixed(1);
	return {
		text: `${n}s`,
		title: `Generation time: ${n} seconds`
	};
}
function rt(e, { maxMs: t = 864e5 } = {}) {
	let n;
	if (e == null) return 0;
	if (typeof e == "string") {
		let t = e.trim().toLowerCase();
		if (!t) return 0;
		let r = t.match(/^(-?\d+(?:[.,]\d+)?)\s*(s|sec|secs|second|seconds)$/i);
		if (r) n = Number(r[1].replace(",", ".")) * 1e3;
		else {
			let e = t.match(/^(-?\d+(?:[.,]\d+)?)\s*(ms|msec|millisecond|milliseconds)$/i);
			n = Number(e ? e[1].replace(",", ".") : t.replace(",", "."));
		}
	} else n = Number(e);
	return !Number.isFinite(n) || n <= 0 || n >= Number(t) ? 0 : n;
}
function it(e) {
	let t = document.createElement("div");
	t.className = "mjr-tags-badge";
	let n = et(e);
	return n.length === 0 ? (t.style.display = "none", t) : (t.textContent = n.join(", "), t.title = `Tags: ${n.join(", ")}`, t.style.cssText = "\n        position: absolute;\n        bottom: 6px;\n        left: 6px;\n        padding: 3px 6px;\n        border-radius: 4px;\n        background: rgba(0,0,0,0.8);\n        color: var(--mjr-tag-color, #90CAF9);\n        font-size: 9px;\n        max-width: 80%;\n        overflow: hidden;\n        text-overflow: ellipsis;\n        white-space: nowrap;\n        pointer-events: none;\n        z-index: 10;\n        box-shadow: 0 2px 4px rgba(0,0,0,0.3);\n    ", t);
}
//#endregion
//#region ui/utils/filenames.ts
var at = new Set([
	"CON",
	"PRN",
	"AUX",
	"NUL",
	"COM1",
	"COM2",
	"COM3",
	"COM4",
	"COM5",
	"COM6",
	"COM7",
	"COM8",
	"COM9",
	"LPT1",
	"LPT2",
	"LPT3",
	"LPT4",
	"LPT5",
	"LPT6",
	"LPT7",
	"LPT8",
	"LPT9"
]), ot = 255;
function st(e) {
	try {
		let t = String(e ?? "").trim();
		if (!t) return {
			valid: !1,
			reason: "Filename cannot be empty"
		};
		if (t.length > ot) return {
			valid: !1,
			reason: `Filename is too long (max ${ot} characters)`
		};
		if (t.includes("/") || t.includes("\\")) return {
			valid: !1,
			reason: "Filename cannot contain path separators"
		};
		if (t.includes("\0")) return {
			valid: !1,
			reason: "Filename cannot contain null bytes"
		};
		for (let e of t) if (e.charCodeAt(0) < 32) return {
			valid: !1,
			reason: "Filename cannot contain control characters"
		};
		if (t.startsWith(".") || t.startsWith(" ")) return {
			valid: !1,
			reason: "Filename cannot start with a dot or space"
		};
		if (t.endsWith(".") || t.endsWith(" ")) return {
			valid: !1,
			reason: "Filename cannot end with a dot or space"
		};
		let n = t.split(".")[0].toUpperCase();
		return at.has(n) ? {
			valid: !1,
			reason: "Filename uses a reserved Windows name"
		} : {
			valid: !0,
			reason: ""
		};
	} catch (e) {
		return {
			valid: !1,
			reason: String(e || "Invalid filename")
		};
	}
}
function ct(e) {
	try {
		return String(e ?? "").trim();
	} catch {
		return "";
	}
}
function lt(e) {
	let t = ct(e);
	if (!t) return {
		stem: "",
		ext: ""
	};
	let n = t.lastIndexOf(".");
	return n <= 0 || n === t.length - 1 ? {
		stem: t,
		ext: ""
	} : {
		stem: t.slice(0, n),
		ext: t.slice(n)
	};
}
function ut(e, t) {
	let n = ct(e);
	if (!n) return "";
	let r = lt(t);
	return !lt(n).ext && r.ext ? `${n}${r.ext}` : n;
}
//#endregion
//#region ui/utils/dom.ts
function dt(e, t) {
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
function ft(e) {
	let t = String(e ?? "");
	try {
		if (typeof CSS?.escape == "function") return CSS.escape(t);
	} catch (e) {
		console.debug?.(e);
	}
	return t.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, "\\$1");
}
async function pt(e) {
	try {
		return navigator?.clipboard?.writeText ? (await navigator.clipboard.writeText(String(e ?? "")), !0) : !1;
	} catch {
		return !1;
	}
}
//#endregion
//#region ui/utils/deleteGuard.ts
async function mt(e, t) {
	return T.DELETE_CONFIRMATION ? !!await I(e > 1 ? C("dialog.deleteSelectedFiles", "Delete {count} selected files?", { count: e }) : C("dialog.deleteSingleFile", "Delete \"{label}\"?", { label: String(t || C("label.thisFile", "this file")) }), C("dialog.confirmDeleteTitle", "Majoor: Confirm delete")) : !0;
}
//#endregion
//#region ui/features/collections/contextmenu/addToCollectionMenuState.ts
var ht = M({
	open: !1,
	x: 0,
	y: 0,
	assets: []
});
function gt() {
	try {
		window.dispatchEvent(new CustomEvent("mjr-close-all-menus"));
	} catch (e) {
		console.debug?.(e);
	}
}
function _t({ x: e = 0, y: t = 0, assets: n = [] } = {}) {
	gt(), ht.open = Array.isArray(n) && n.length > 0, ht.x = Number(e) || 0, ht.y = Number(t) || 0, ht.assets = Array.isArray(n) ? [...n] : [];
}
function vt() {
	ht.open = !1, ht.x = 0, ht.y = 0, ht.assets = [];
}
//#endregion
//#region ui/features/collections/contextmenu/addToCollectionMenu.ts
function yt(e) {
	if (!e || typeof e != "object") return null;
	let t = e.filepath || e.path || e?.file_info?.filepath || "";
	return t ? {
		filepath: t,
		filename: e.filename || "",
		subfolder: e.subfolder || "",
		type: (e.type || "output").toLowerCase(),
		root_id: h(e),
		kind: e.kind || ""
	} : null;
}
async function bt({ x: e, y: t, assets: r }) {
	let i = Array.isArray(r) ? r.map(yt).filter(Boolean) : [];
	if (!i.length) {
		n(C("toast.noValidAssetsSelected", "No valid assets selected."), "warning");
		return;
	}
	_t({
		x: Number(e) || 0,
		y: Number(t) || 0,
		assets: i
	});
}
//#endregion
//#region ui/features/contextmenu/ratingUpdater.ts
var xt = 350, St = /* @__PURE__ */ new Map();
function Ct(e) {
	let t = St.get(e);
	if (t) {
		try {
			clearTimeout(t.timer);
		} catch (e) {
			console.debug?.(e);
		}
		try {
			t.controller?.abort?.();
		} catch (e) {
			console.debug?.(e);
		}
		St.delete(e);
	}
}
function wt(e) {
	e && Ct(String(e));
}
function Tt() {
	for (let e of Array.from(St.keys())) wt(e);
}
function Et(t, r, { onSuccess: i, onFailure: o, successMessage: s = null, errorMessage: c = null, warnPrefix: l = "[RatingUpdater]" } = {}) {
	if (!t) return;
	wt(t);
	let u = new AbortController(), d = setTimeout(async () => {
		St.delete(String(t));
		try {
			let a = await e(t, r, { signal: u.signal });
			if (!a?.ok) {
				n(a?.error || c || "Failed to update rating", "error"), o?.(a);
				return;
			}
			s && n(s, "success", 1500), i?.(a);
		} catch (e) {
			a(e, l, { showToast: !0 }), o?.(e);
		}
	}, xt);
	St.set(String(t), {
		timer: d,
		controller: u
	});
}
//#endregion
//#region ui/utils/tooltipShortcuts.ts
function Dt(e, t) {
	let n = String(e || "").trim(), r = String(t || "").trim();
	if (!r) return n;
	if (!n) return r;
	if (r.length === 1) {
		let e = r.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		if (RegExp(`\\(${e}\\)|\\b${e}\\b`, "i").test(n)) return n;
	} else if (n.toLowerCase().includes(r.toLowerCase())) return n;
	return `${n} (${r})`;
}
function Ot(e, t, n, { setAriaLabel: r = !0, ariaLabel: i = null } = {}) {
	if (!e) return "";
	let a = Dt(t, n);
	if (e.title = a, r) {
		let r = i ?? t;
		e.setAttribute("aria-label", Dt(r, n));
	}
	return a;
}
//#endregion
//#region ui/utils/safeCall.ts
var kt = () => {};
function At(e) {
	try {
		return !!T?.[e];
	} catch {
		return !1;
	}
}
function jt(e, t) {
	try {
		console.warn(`[Majoor] ${e}`, t);
	} catch (e) {
		console.debug?.(e);
	}
}
function X(e, t = "safeCall") {
	try {
		return e?.();
	} catch (e) {
		At("DEBUG_SAFE_CALL") && jt(t, e);
		return;
	}
}
function Z(e, t, n, r, i = "safeAddListener") {
	try {
		return e?.addEventListener?.(t, n, r), () => {
			try {
				e?.removeEventListener?.(t, n, r);
			} catch (e) {
				At("DEBUG_SAFE_LISTENERS") && jt(`${i}:remove:${String(t || "")}`, e);
			}
		};
	} catch (e) {
		return At("DEBUG_SAFE_LISTENERS") && jt(`${i}:add:${String(t || "")}`, e), kt;
	}
}
//#endregion
//#region ui/utils/mediaFps.ts
function Mt(e) {
	try {
		let t = Number(e);
		if (Number.isFinite(t) && t > 0) return t;
		let n = String(e || "").trim();
		if (!n) return null;
		if (n.includes("/")) {
			let [e, t] = n.split("/"), r = Number(e), i = Number(t);
			if (Number.isFinite(r) && Number.isFinite(i) && i !== 0) {
				let e = r / i;
				return Number.isFinite(e) && e > 0 ? e : null;
			}
		}
		let r = Number.parseFloat(n);
		return Number.isFinite(r) && r > 0 ? r : null;
	} catch {
		return null;
	}
}
function Nt(e) {
	try {
		let t = e, n = t.metadata_raw || {}, r = (n.raw_ffprobe || {}).video_stream || {};
		return Mt(r.avg_frame_rate) ?? Mt(r.r_frame_rate) ?? Mt(n.fps_raw) ?? Mt(n.fps) ?? Mt(n.frame_rate) ?? Mt(t.fps);
	} catch {
		return null;
	}
}
function Pt(e, t) {
	try {
		let n = e, r = n.metadata_raw || {}, i = (r.raw_ffprobe || {}).video_stream || {}, a = Number(n.frame_count) || Number(r.frame_count) || Number(r.frames) || Number(i.nb_frames) || Number(i.nb_read_frames) || 0;
		if (Number.isFinite(a) && a > 0) return Math.floor(a);
		let o = Number(n.duration ?? r.duration ?? i.duration);
		if (Number.isFinite(o) && o > 0 && t != null && Number.isFinite(t) && t > 0) return Math.max(1, Math.round(o * t));
	} catch (e) {
		console.debug?.(e);
	}
	return null;
}
function Ft(e) {
	let t = Number(e);
	return !Number.isFinite(t) || t <= 0 ? "" : Math.abs(t - Math.round(t)) < .001 ? `${Math.round(t)} fps` : `${t.toFixed(3).replace(/\.?0+$/, "")} fps`;
}
function It(e, t = 30) {
	let n = Mt(e);
	if (n != null) return Math.max(1, Math.round(n * 1e3) / 1e3);
	let r = Mt(t);
	return r == null ? 30 : Math.max(1, Math.round(r * 1e3) / 1e3);
}
//#endregion
//#region ui/components/VideoControls.ts
var Lt = 400, Rt = 1e3, zt = 220, Bt = .001;
function Vt(e, t) {
	let n = Number(e), r = Math.max(1, Number(t) || 1);
	if (!Number.isFinite(n) || n <= 0) return 1;
	let i = n / r, a = 10 ** Math.floor(Math.log10(Math.max(i, .001))), o = i / a;
	return Math.max(.001, (o <= 1 ? 1 : o <= 2 ? 2 : o <= 5 ? 5 : 10) * a);
}
function Ht(e, t, n) {
	try {
		if (e?.aborted) return kt;
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
		return kt;
	}
}
function Ut(e) {
	let t = Math.floor(Number(e) || 0);
	return t < 10 ? `0${t}` : String(t);
}
function Wt(e) {
	let t = Number(e);
	if (!Number.isFinite(t) || t < 0) return "0:00";
	let n = Math.floor(t), r = Math.floor(n / 3600), i = Math.floor(n % 3600 / 60), a = n % 60;
	return r > 0 ? `${r}:${Ut(i)}:${Ut(a)}` : `${i}:${Ut(a)}`;
}
function Gt(e, t, n) {
	let r = document.createElement("button");
	r.type = "button", r.className = `mjr-video-btn ${e || ""}`.trim(), n && (r.title = n);
	try {
		r.setAttribute("aria-label", n || t || "Button");
	} catch (e) {
		console.debug?.(e);
	}
	return r.textContent = t, r;
}
function Kt(e, t, n, r) {
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
function qt(e, { min: t, max: n, step: r, value: i, title: a, ariaLabel: o, widthPx: s } = {}) {
	let c = document.createElement("input");
	return c.type = "number", c.className = `mjr-video-num ${e || ""}`.trim(), a && (c.title = a), o && c.setAttribute("aria-label", o), t != null && (c.min = String(t)), n != null && (c.max = String(n)), r != null && (c.step = String(r)), i != null && (c.value = String(i)), s != null && (c.style.width = `${s}px`), c;
}
function Jt(e) {
	try {
		return e?.variant === "preview" ? "preview" : e?.variant === "viewerbar" ? "viewerbar" : "viewer";
	} catch {
		return "viewer";
	}
}
function Yt(e) {
	try {
		let t = Number(e?.initialFps);
		return Number.isFinite(t) && t > 0 ? t : null;
	} catch {
		return null;
	}
}
function Xt(e, t) {
	let n = Number(e), r = Number(t);
	return Number.isFinite(n) && Number.isFinite(r) && Math.abs(n - r) <= Bt;
}
function Zt(e, t) {
	let n = [];
	try {
		e.controls = !1, e.loop = !0, e.muted = !0, e.playsInline = !0, e.autoplay = !0;
	} catch (e) {
		console.debug?.(e);
	}
	let r = document.createElement("div");
	r.className = "mjr-video-controls mjr-video-controls--preview";
	try {
		r.setAttribute("role", "group"), r.setAttribute("aria-label", C("video.previewControls", "Video preview controls"));
	} catch (e) {
		console.debug?.(e);
	}
	let i = document.createElement("button");
	i.type = "button", i.className = "mjr-video-preview-btn", i.title = C("video.playPause", "Play/Pause");
	try {
		i.setAttribute("aria-label", C("video.playPause", "Play/Pause"));
	} catch (e) {
		console.debug?.(e);
	}
	let a = document.createElement("span");
	a.className = "pi pi-play";
	try {
		a.setAttribute("aria-hidden", "true");
	} catch (e) {
		console.debug?.(e);
	}
	i.appendChild(a), r.appendChild(i);
	let o = () => {
		try {
			a.className = `pi ${e?.paused ? "pi-play" : "pi-pause"}`;
		} catch (e) {
			console.debug?.(e);
		}
	}, s = () => {
		try {
			let t = e.play?.();
			t && typeof t.catch == "function" && t.catch(() => {});
		} catch (e) {
			console.debug?.(e);
		}
	}, c = (t) => {
		try {
			t?.stopPropagation?.();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			e.paused ? s() : e.pause?.();
		} catch (e) {
			console.debug?.(e);
		}
		o();
	};
	try {
		t.appendChild(r);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		s();
	} catch (e) {
		console.debug?.(e);
	}
	n.push(Z(e, "loadedmetadata", () => s(), { passive: !0 })), n.push(Z(e, "canplay", () => s(), { passive: !0 })), n.push(Z(i, "click", c)), n.push(Z(e, "play", o, { passive: !0 })), n.push(Z(e, "pause", o, { passive: !0 })), n.push(Z(e, "ended", () => s(), { passive: !0 }));
	try {
		o();
	} catch (e) {
		console.debug?.(e);
	}
	return {
		controlsEl: r,
		destroy: () => {
			try {
				for (let e of n) X(() => e?.());
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
function Qt(e, t = {}) {
	try {
		let n = Jt(t), r = String(t?.mediaKind || "video").toLowerCase() === "audio", i = n === "viewerbar", a = n !== "preview", o = a, s = Yt(t), c = t?.hostEl || e?.parentElement;
		if (!e || !c) return {
			controlsEl: null,
			destroy: kt
		};
		if (n === "preview") return Zt(e, c);
		try {
			e.loop = !1;
		} catch (e) {
			console.debug?.(e);
		}
		X(() => c.classList?.add("mjr-video-host")), X(() => e.classList?.add("mjr-video-el")), X(() => {
			window.getComputedStyle?.(c)?.position === "static" && (c.style.position = "relative");
		});
		let l = document.createElement("div");
		l.className = `mjr-video-controls mjr-video-controls--${n}`, i && l.classList.add("mjr-video-controls--modern"), r && l.classList.add("mjr-video-controls--audio"), l.dataset.mjrLayout = "regular", l.setAttribute("role", "group"), l.setAttribute("aria-label", r ? C("video.audioControls", "Audio controls") : C("video.controls", "Video controls"));
		let u = document.createElement("div");
		u.className = "mjr-video-row mjr-video-row--top";
		let d = document.createElement("div");
		d.className = "mjr-video-row mjr-video-row--bottom", l.appendChild(u), l.appendChild(d);
		let f = document.createElement("div");
		f.className = "mjr-video-seek-wrap";
		let p = document.createElement("input");
		p.className = "mjr-video-range mjr-video-range--seek", p.type = "range", p.min = "0", p.max = String(Rt), p.step = "1", p.value = "0", p.setAttribute("aria-label", C("video.seek", "Seek")), p.title = r ? C("video.seekThroughAudio", "Seek through audio") : C("video.seekThrough", "Seek through video");
		let m = document.createElement("div");
		m.className = "mjr-video-seek-overlay";
		let h = null, g = null, _ = null, v = null;
		o && (h = document.createElement("div"), h.className = "mjr-video-seek-zones", g = document.createElement("div"), g.className = "mjr-video-seek-zone mjr-video-seek-zone--leftTrim", _ = document.createElement("div"), _.className = "mjr-video-seek-zone mjr-video-seek-zone--selected", v = document.createElement("div"), v.className = "mjr-video-seek-zone mjr-video-seek-zone--rightTrim", h.appendChild(g), h.appendChild(_), h.appendChild(v));
		let y = document.createElement("div");
		y.className = "mjr-video-seek-ticks";
		let b = document.createElement("div");
		b.className = "mjr-video-seek-labels";
		let x = document.createElement("div");
		x.className = "mjr-video-seek-mark mjr-video-seek-mark--in";
		let S = document.createElement("div");
		S.className = "mjr-video-seek-mark mjr-video-seek-mark--out";
		let w = document.createElement("div");
		w.className = "mjr-video-seek-playhead";
		let T = document.createElement("div");
		T.className = "mjr-video-seek-playhead-label", m.appendChild(y), m.appendChild(b), m.appendChild(w), m.appendChild(T);
		let E = document.createElement("div");
		E.className = "mjr-video-seek-handle mjr-video-seek-handle--in", E.title = C("video.dragSetIn", "Drag to set In"), E.setAttribute("aria-label", C("video.dragSetIn", "Drag to set In"));
		let D = document.createElement("div");
		D.className = "mjr-video-seek-handle mjr-video-seek-handle--out", D.title = C("video.dragSetOut", "Drag to set Out"), D.setAttribute("aria-label", C("video.dragSetOut", "Drag to set Out")), f.appendChild(p), h && f.appendChild(h), f.appendChild(m), o && (f.appendChild(x), f.appendChild(S), f.appendChild(E), f.appendChild(D));
		let O = document.createElement("span");
		O.className = "mjr-video-time", O.textContent = "0:00 / 0:00", O.title = C("video.currentTimeTotal", "Current time / Total duration");
		let k = document.createElement("span");
		k.className = "mjr-video-range-count", k.textContent = "";
		try {
			k.style.display = "none";
		} catch (e) {
			console.debug?.(e);
		}
		let A = document.createElement("div");
		A.className = "mjr-video-timegroup", A.appendChild(O), o && A.appendChild(k);
		let j = document.createElement("span");
		j.className = "mjr-video-frame", j.textContent = "F: 0", j.title = C("video.currentFrame", "Current frame number");
		let M = Gt("mjr-video-btn--play", C("btn.play", "Play"), C("video.playPauseSpace", "Play/Pause (Space)")), N = Gt("mjr-video-btn--step", "<", C("video.stepBack", "Step back")), ee = Gt("mjr-video-btn--step", ">", C("video.stepForward", "Step forward")), te = Gt("mjr-video-btn--jump mjr-video-btn--in", "|<", C("video.goToIn", "Go to In")), ne = Gt("mjr-video-btn--jump mjr-video-btn--out", ">|", C("video.goToOut", "Go to Out")), re = Gt("mjr-video-btn--mark mjr-video-btn--in", "I", C("video.setInFromCurrent", "Set In from current frame")), ie = Gt("mjr-video-btn--mark mjr-video-btn--out", "O", C("video.setOutFromCurrent", "Set Out from current frame")), ae = Kt("mjr-video-btn--toggle", "pi-refresh", C("video.loopPlaybackInRange", "Loop playback in range"), C("video.loop", "Loop")), oe = ae.btn, se = qt("mjr-video-num--in", {
			min: 0,
			step: 1,
			value: 0,
			title: C("video.inFrame", "In frame"),
			ariaLabel: C("video.inFrame", "In frame"),
			widthPx: 72
		}), ce = qt("mjr-video-num--out", {
			min: 0,
			step: 1,
			value: 0,
			title: C("video.outFrame", "Out frame"),
			ariaLabel: C("video.outFrame", "Out frame"),
			widthPx: 72
		}), le = qt("mjr-video-num--step", {
			min: 1,
			step: 1,
			value: 1,
			title: C("video.frameIncrement", "Frame increment"),
			ariaLabel: C("video.frameIncrement", "Frame increment"),
			widthPx: 56
		}), I = qt("mjr-video-num--fps", {
			min: 1,
			step: .001,
			value: It(s || 30),
			title: C("video.fpsStepping", "FPS (used for frame stepping)"),
			ariaLabel: C("video.fps", "FPS"),
			widthPx: 56
		}), L = document.createElement("select");
		L.className = "mjr-video-num mjr-video-num--speed", L.title = C("video.playbackSpeed", "Playback speed"), L.setAttribute("aria-label", C("video.playbackSpeed", "Playback speed")), L.style.width = "74px";
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
			t.value = String(e), t.textContent = `${e}x`, L.appendChild(t);
		}
		let ue = Kt("mjr-video-btn--mute", "pi-volume-up", C("video.mute", "Mute"), C("video.mute", "Mute")), de = ue.btn, R = document.createElement("div");
		R.className = "mjr-video-volume-wrap", R.style.cssText = "display:none; align-items:center; position:relative;";
		let z = null;
		z = document.createElement("input"), z.className = "mjr-video-range mjr-video-range--volume", z.type = "range", z.min = "0", z.max = "1", z.step = "0.02", z.value = String(P(Number(e.volume) || 0)), z.setAttribute("aria-label", C("video.volume", "Volume")), z.title = C("video.volume", "Volume");
		try {
			z.style.width = "120px";
		} catch (e) {
			console.debug?.(e);
		}
		R.appendChild(z);
		let fe = document.createElement("div");
		fe.className = "mjr-video-group mjr-video-group--in";
		let B = document.createElement("span");
		B.textContent = "In", B.title = C("video.resetInToStart", "Reset In to start"), B.style.cssText = "cursor:pointer; user-select:none;", o && (fe.appendChild(B), fe.appendChild(se));
		let V = document.createElement("div");
		V.className = "mjr-video-group mjr-video-group--out";
		let H = document.createElement("span");
		H.textContent = "Out", H.title = C("video.resetOutToEnd", "Reset Out to end"), H.style.cssText = "cursor:pointer; user-select:none;", o && (V.appendChild(H), V.appendChild(ce));
		let pe = document.createElement("div");
		pe.className = "mjr-video-group mjr-video-group--adjust-left", o && (pe.appendChild(re), r || (pe.appendChild(document.createTextNode(C("video.step", "Step"))), pe.appendChild(le), pe.appendChild(document.createTextNode(C("video.fps", "FPS"))), pe.appendChild(I)), pe.appendChild(j));
		let U = document.createElement("div");
		U.className = "mjr-video-group mjr-video-group--adjust-right", o && (U.appendChild(A), U.appendChild(oe));
		let me = document.createElement("div");
		me.className = "mjr-video-group mjr-video-group--speed", me.appendChild(document.createTextNode(C("video.speed", "Speed"))), me.appendChild(L);
		let he = document.createElement("div");
		he.className = "mjr-video-bottom mjr-video-bottom--left";
		let ge = document.createElement("div");
		ge.className = "mjr-video-transport";
		let _e = document.createElement("div");
		if (_e.className = "mjr-video-bottom mjr-video-bottom--right", ge.appendChild(te), r || ge.appendChild(N), ge.appendChild(M), r || ge.appendChild(ee), ge.appendChild(ne), o && he.appendChild(pe), o && _e.appendChild(U), _e.appendChild(me), _e.appendChild(de), o && _e.appendChild(ie), z && _e.appendChild(R), i) {
			let e = document.createElement("div");
			e.className = "mjr-video-bar-timeline", o && e.appendChild(fe), e.appendChild(f), o && e.appendChild(V);
			let t = document.createElement("div");
			t.className = "mjr-video-bar-actions";
			let n = document.createElement("div");
			n.className = "mjr-video-bar-side mjr-video-bar-side--left", o && n.appendChild(pe);
			let r = document.createElement("div");
			r.className = "mjr-video-bar-center", r.appendChild(ge);
			let i = document.createElement("div");
			i.className = "mjr-video-bar-side mjr-video-bar-side--right", o && i.appendChild(U), i.appendChild(me), i.appendChild(de), o && i.appendChild(ie), z && i.appendChild(R), t.appendChild(n), t.appendChild(r), t.appendChild(i), l.replaceChildren(e, t);
		} else o && u.appendChild(j), o && u.appendChild(fe), u.appendChild(f), o && u.appendChild(V), u.appendChild(A), d.appendChild(he), d.appendChild(ge), d.appendChild(_e);
		let W = (e) => {
			try {
				e.stopPropagation?.();
			} catch (e) {
				console.debug?.(e);
			}
		}, G = (e) => {
			try {
				e.preventDefault?.();
			} catch (e) {
				console.debug?.(e);
			}
			W(e);
		}, K = [], ve = (() => {
			try {
				return new AbortController();
			} catch {
				return {
					signal: {
						aborted: !1,
						addEventListener: kt,
						removeEventListener: kt
					},
					abort: kt
				};
			}
		})();
		K.push(() => {
			try {
				ve.abort();
			} catch (e) {
				console.debug?.(e);
			}
		});
		let ye = () => {
			try {
				let e = Number(c?.clientWidth) || Number(l?.clientWidth) || 0, t = "regular";
				e > 0 && e < 560 ? t = "stacked" : e > 0 && e < 860 && (t = "compact"), l.dataset.mjrLayout = t;
			} catch (e) {
				console.debug?.(e);
			}
		};
		ye();
		try {
			if (typeof ResizeObserver == "function" && c) {
				let e = typeof requestAnimationFrame == "function" ? requestAnimationFrame : null, t = typeof cancelAnimationFrame == "function" ? cancelAnimationFrame : null, n = 0, r = new ResizeObserver(e ? () => {
					n ||= e(() => {
						n = 0, ye();
					});
				} : () => ye());
				r.observe(c), K.push(() => {
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
		K.push(Z(l, "pointerdown", W)), K.push(Z(l, "dblclick", G, { capture: !0 })), K.push(Z(l, "wheel", G, {
			capture: !0,
			passive: !1
		})), K.push(Z(window, "dblclick", (e) => {
			try {
				l.contains?.(e?.target) && G(e);
			} catch (e) {
				console.debug?.(e);
			}
		}, { capture: !0 })), K.push(Z(window, "wheel", (e) => {
			try {
				l.contains?.(e?.target) && G(e);
			} catch (e) {
				console.debug?.(e);
			}
		}, {
			capture: !0,
			passive: !1
		}));
		let q = {
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
		q.nativeFps = s ? It(s, 30) : null, q.fps = q.nativeFps || It(I.value, 30);
		let be = () => {
			let e = Number(q.nativeFps), t = Number(q.fps);
			return Number.isFinite(e) && e > 0 && !Xt(t, e);
		}, xe = (e = !1) => {
			try {
				if (!I || r) return;
				let t = Number(q.nativeFps), n = be(), i = C("video.fpsStepping", "FPS (used for frame stepping)");
				I.classList.toggle("is-overridden", n), Number.isFinite(t) && t > 0 ? (I.dataset.defaultFps = String(t), I.title = `${i} - Source FPS: ${t}`, n && (I.title += " - Modified")) : (delete I.dataset.defaultFps, I.title = i), e && !I.matches?.(":focus") && (I.value = String(It(q.fps, q.nativeFps || 30)));
			} catch (e) {
				console.debug?.(e);
			}
		};
		xe(!0);
		let Se = () => {
			if (!q._userInteracted) {
				q._userInteracted = !0;
				try {
					e.muted && (e.muted = !1, Ge?.());
				} catch (e) {
					console.debug?.(e);
				}
			}
		}, Ce = null, we = () => {
			if (o) try {
				j.classList.add("is-step");
				try {
					Ce?.();
				} catch (e) {
					console.debug?.(e);
				}
				Ce = Ht(ve.signal, zt, () => {
					try {
						j.classList.remove("is-step");
					} catch (e) {
						console.debug?.(e);
					}
				});
			} catch (e) {
				console.debug?.(e);
			}
		};
		K.push(() => {
			try {
				Ce?.();
			} catch (e) {
				console.debug?.(e);
			}
			Ce = null;
			try {
				j?.classList?.remove?.("is-step");
			} catch (e) {
				console.debug?.(e);
			}
		});
		let Te = (e, t) => {
			try {
				if (!e) return;
				t ? e.classList.add("is-on") : e.classList.remove("is-on");
			} catch (e) {
				console.debug?.(e);
			}
		}, Ee = (t) => {
			try {
				let n = Number(t);
				if (!Number.isFinite(n) || n <= 0) return q.playbackRate;
				let r = Math.max(.25, Math.min(10, Math.round(n * 100) / 100));
				q.playbackRate = r;
				try {
					e.playbackRate = r;
				} catch (e) {
					console.debug?.(e);
				}
				try {
					L.matches?.(":focus") || (L.value = String(r));
				} catch (e) {
					console.debug?.(e);
				}
				return r;
			} catch {
				return q.playbackRate;
			}
		}, De = () => {
			try {
				Te(oe, !!(q.loop || q.pingpong));
				try {
					ae?.icon && (q.pingpong ? (ae.icon.className = "pi pi-sort-alt", oe.title = C("video.pingpongPlayback", "Ping-pong playback (forward then reverse)")) : (ae.icon.className = "pi pi-refresh", oe.title = C("video.loopPlaybackInRange", "Loop playback in range")));
				} catch (e) {
					console.debug?.(e);
				}
			} catch (e) {
				console.debug?.(e);
			}
		}, Oe = () => {
			try {
				let t = Number(q.frameCount);
				if (Number.isFinite(t) && t > 0) return Math.max(1, Math.floor(t));
				let n = Number(e?.duration), r = It(q.fps, 30);
				return !Number.isFinite(n) || n <= 0 ? 0 : Math.max(0, Math.floor(n * r));
			} catch {
				return 0;
			}
		}, ke = (t = null) => {
			try {
				let n = t ?? e?.currentTime, r = Number(n), i = It(q.fps, 30);
				return !Number.isFinite(r) || r < 0 ? 0 : Math.max(0, Math.floor(r * i + 1e-6));
			} catch {
				return 0;
			}
		}, Ae = (e) => {
			let t = It(q.fps, 30);
			return Math.max(0, Number(e) || 0) / t;
		}, je = () => {
			try {
				let e = Oe();
				if (e <= 0) return;
				let t = q.inFrame == null ? 0 : F(q.inFrame, 0, e), n = q.outFrame == null ? e : F(q.outFrame, 0, e);
				n < t ? (q.inFrame = n, q.outFrame = t) : (q.inFrame = t, q.outFrame = n);
			} catch (e) {
				console.debug?.(e);
			}
		}, Me = () => {
			try {
				let e = Oe();
				return {
					inF: q.inFrame == null ? 0 : F(q.inFrame, 0, e),
					outF: q.outFrame == null ? e : F(q.outFrame, 0, e),
					maxF: e
				};
			} catch {
				return {
					inF: 0,
					outF: 0,
					maxF: 0
				};
			}
		}, Ne = () => {
			try {
				if (!o || r) return Rt;
				let e = Oe();
				if (Number.isFinite(e) && e > Rt) return Math.max(Rt, Math.floor(e));
			} catch (e) {
				console.debug?.(e);
			}
			return Rt;
		}, Pe = () => {
			try {
				p.max = String(Ne());
			} catch (e) {
				console.debug?.(e);
			}
		}, Fe = () => {
			try {
				M.textContent = !e?.paused || q._ppReverse ? C("video.pause", "Pause") : C("video.play", "Play");
			} catch (e) {
				console.debug?.(e);
			}
		}, Ie = () => {
			try {
				let t = !!e?.muted || (Number(e?.volume) || 0) <= .001;
				try {
					ue.icon.className = `pi ${t ? "pi-volume-off" : "pi-volume-up"}`;
				} catch (e) {
					console.debug?.(e);
				}
				let n = t ? C("video.unmute", "Unmute") : C("video.mute", "Mute");
				de.title = n, de.setAttribute("aria-label", n);
			} catch (e) {
				console.debug?.(e);
			}
		}, J = (t = null) => {
			try {
				let n = Number(e?.duration), i = t ?? e?.currentTime, s = Number(i), c = Number.isFinite(n) && n > 0;
				if (O.textContent = `${Wt(s)} / ${c ? Wt(n) : "0:00"}`, p.disabled = !c, c) {
					let e = P((s || 0) / n);
					Pe();
					let t = Math.round(e * Ne());
					!Number.isNaN(t) && !q._seeking && !p.matches?.(":active") && (p.value = String(t));
					try {
						w.style.left = `${e * 100}%`;
					} catch (e) {
						console.debug?.(e);
					}
				} else {
					p.value = "0";
					try {
						w.style.left = "0%";
					} catch (e) {
						console.debug?.(e);
					}
				}
				let l = o ? Oe() : 0, u = o ? ke(s) : 0;
				if (a) {
					o && (j.textContent = r ? `T: ${Wt(s)} / ${Wt(n)}` : `F: ${u} / ${l}`);
					try {
						if (Number.isFinite(n) && n > 0) {
							let e = P((s || 0) / n);
							T.style.left = `${e * 100}%`, T.textContent = r ? Wt(s) : String(u), T.style.display = "";
						} else T.style.display = "none";
					} catch (e) {
						console.debug?.(e);
					}
				}
				if (o) {
					se.matches?.(":focus") || (se.value = String(q.inFrame ?? 0)), ce.matches?.(":focus") || (ce.value = String(q.outFrame ?? l));
					try {
						let { inF: e, outF: t, maxF: n } = Me(), i = e <= 0 && t >= n, a = Math.max(0, Math.floor(t) - Math.floor(e) + 1);
						!i && n > 0 ? (k.textContent = r ? `R: ${Wt(a / It(q.fps, 30))}` : `R: ${a}f`, k.style.display = "") : k.style.display = "none";
					} catch (e) {
						console.debug?.(e);
					}
				}
			} catch (e) {
				console.debug?.(e);
			}
		}, Le = () => {
			if (!(!a || !r)) try {
				let t = Number(e?.duration);
				if (!Number.isFinite(t) || t <= 0) {
					y.style.backgroundImage = "", b.replaceChildren();
					try {
						b.dataset.mjrLabelKey = "";
					} catch (e) {
						console.debug?.(e);
					}
					return;
				}
				let n = Vt(t, 80), r = Vt(t, 8), i = n / t * 100, a = r / t * 100;
				if (Number.isFinite(i) && i > .02) {
					let e = `repeating-linear-gradient(to right, rgba(255,255,255,0.16) 0, rgba(255,255,255,0.16) 1px, transparent 1px, transparent ${i}%)`, t = `repeating-linear-gradient(to right, rgba(255,255,255,0.3) 0, rgba(255,255,255,0.3) 1px, transparent 1px, transparent ${a}%)`;
					y.style.backgroundImage = `${t}, ${e}`;
				} else y.style.backgroundImage = "";
				let o = `audio|${Math.round(t * 1e3)}|${Math.round(r * 1e3)}`;
				if (b?.dataset?.mjrLabelKey === o) return;
				b.dataset.mjrLabelKey = o, b.replaceChildren();
				let s = (e) => {
					let n = document.createElement("span");
					n.className = "mjr-video-seek-label";
					let r = Math.max(0, Math.min(t, Number(e) || 0));
					return n.style.left = `${P(r / t) * 100}%`, n.textContent = Wt(r), n;
				};
				b.appendChild(s(0));
				for (let e = r; e < t; e += r) b.appendChild(s(e));
				b.appendChild(s(t));
			} catch (e) {
				console.debug?.(e);
			}
		}, Re = () => {
			if (!o) {
				Le();
				return;
			}
			try {
				let { inF: e, outF: t, maxF: n } = Me();
				if (!Number.isFinite(n) || n <= 0) return;
				let i = P(e / n) * 100, a = P(t / n) * 100, o = e <= 0 && t >= n;
				try {
					p.style.background = "";
				} catch (e) {
					console.debug?.(e);
				}
				try {
					let e = P(i / 100) * 100, t = P(a / 100) * 100, n = Math.min(e, t), r = Math.max(e, t);
					if (h && g && _ && v) {
						g.style.left = "0%", g.style.width = `${n}%`, _.style.left = `${n}%`, _.style.width = `${Math.max(0, r - n)}%`, v.style.left = `${r}%`, v.style.width = `${Math.max(0, 100 - r)}%`;
						try {
							h.classList.toggle("is-trimmed", !o), h.classList.toggle("is-fullrange", o);
						} catch (e) {
							console.debug?.(e);
						}
					}
				} catch (e) {
					console.debug?.(e);
				}
				try {
					x.style.left = `${i}%`, S.style.left = `${a}%`;
				} catch (e) {
					console.debug?.(e);
				}
				try {
					E.style.left = `${i}%`, D.style.left = `${a}%`;
				} catch (e) {
					console.debug?.(e);
				}
				if (r) {
					Le();
					return;
				}
				try {
					let e = Math.max(1, Math.floor(n / Lt)), t = Math.max(e, Math.floor(Number(q.step) || 1)), r = t / n * 100, i = r * 10;
					if (Number.isFinite(r) && r > .02) {
						let e = `repeating-linear-gradient(to right, rgba(255,255,255,0.16) 0, rgba(255,255,255,0.16) 1px, transparent 1px, transparent ${r}%)`, t = `repeating-linear-gradient(to right, rgba(255,255,255,0.28) 0, rgba(255,255,255,0.28) 1px, transparent 1px, transparent ${i}%)`;
						y.style.backgroundImage = `${t}, ${e}`;
					} else y.style.backgroundImage = "";
					(() => {
						try {
							let e = `${n}|${t}`;
							if (b?.dataset?.mjrLabelKey === e) return;
							b.dataset.mjrLabelKey = e;
						} catch (e) {
							console.debug?.(e);
						}
						try {
							b.replaceChildren();
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
							let r = P(e / n) * 100;
							return t.style.left = `${r}%`, t.textContent = String(Math.floor(e)), t;
						};
						try {
							b.appendChild(r(0));
						} catch (e) {
							console.debug?.(e);
						}
						for (let t = e; t < n; t += e) try {
							b.appendChild(r(t));
						} catch (e) {
							console.debug?.(e);
						}
						try {
							b.appendChild(r(n));
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
		}, ze = ({ prefer: e = null } = {}) => {
			if (o) try {
				je();
				let { inF: t, outF: n } = Me(), r = ke();
				e === "in" ? Ke(t) : e === "out" ? r > n && Ke(n) : r < t ? Ke(t) : r > n && Ke(n);
			} catch (e) {
				console.debug?.(e);
			}
		}, Be = () => {
			try {
				q.inFrame = 0, je(), J(), Re(), ze({ prefer: "in" });
			} catch (e) {
				console.debug?.(e);
			}
		}, Ve = () => {
			try {
				let { maxF: e } = Me();
				q.outFrame = Math.max(0, Number(e) || 0), je(), J(), Re(), ze({ prefer: "out" });
			} catch (e) {
				console.debug?.(e);
			}
		}, He = () => {
			try {
				q._ppRafId != null && (cancelAnimationFrame(q._ppRafId), q._ppRafId = null);
			} catch (e) {
				console.debug?.(e);
			}
		};
		K.push(He);
		let Ue = () => {
			try {
				He(), q._ppReverse = !0, e.pause?.(), Fe();
				let t = 1e3 / (It(q.fps, 30) * Math.max(.25, Number(q.playbackRate) || 1)), n = performance.now(), r = (i) => {
					try {
						if (!q._ppReverse || !q.pingpong) {
							q._ppReverse = !1, Fe();
							return;
						}
						let a = i - n;
						if (a >= t) {
							n = i - a % t;
							let { inF: r } = Me(), o = ke();
							if (o <= r) {
								q._ppReverse = !1, Ke(r);
								let t = e.play?.();
								t && typeof t.catch == "function" && t.catch(() => {}), Fe(), J();
								return;
							}
							Ke(o - Math.max(1, Math.floor(Number(q.step) || 1))), J();
						}
						q._ppRafId = requestAnimationFrame(r);
					} catch (e) {
						console.debug?.(e), q._ppReverse = !1, Fe();
					}
				};
				q._ppRafId = requestAnimationFrame(r);
			} catch (e) {
				console.debug?.(e), q._ppReverse = !1;
			}
		}, We = () => {
			try {
				let e = Oe();
				q.inFrame = 0, q.outFrame = e > 0 ? e : null, q.step = 1, q.loop = !!o, q.pingpong = !1, q._ppReverse = !1, He(), q.once = !1, Ee(1);
				try {
					le.value = "1";
				} catch (e) {
					console.debug?.(e);
				}
				try {
					L.matches?.(":focus") || (L.value = "1");
				} catch (e) {
					console.debug?.(e);
				}
				je(), De(), J(), Re(), ze({ prefer: "in" });
			} catch (e) {
				console.debug?.(e);
			}
		}, Ge = () => {
			try {
				let t = P(Number(e?.volume) || 0);
				try {
					z && !z.matches?.(":active") && (z.value = String(t));
				} catch (e) {
					console.debug?.(e);
				}
				Ie();
			} catch (e) {
				console.debug?.(e);
			}
		}, Ke = (t) => {
			try {
				let { maxF: n } = Me();
				e.currentTime = Ae(F(t, 0, n > 0 ? n : Infinity));
			} catch (e) {
				console.debug?.(e);
			}
			J();
		}, qe = (t) => {
			Se();
			try {
				let n = Math.max(1, Math.floor(Number(q.step) || 1)), { inF: r, outF: i } = Me(), a = ke() + t * n;
				q.loop ? (a < r && (a = i), a > i && (a = r)) : a = F(a, r, i);
				try {
					e.pause?.();
				} catch (e) {
					console.debug?.(e);
				}
				Ke(a), we();
			} catch (e) {
				console.debug?.(e);
			}
		}, Je = () => {
			if (o) try {
				je();
				let { inF: e, outF: t } = Me(), n = ke();
				(n < e || n > t) && Ke(e);
			} catch (e) {
				console.debug?.(e);
			}
		}, Ye = () => {
			Se();
			try {
				if (q._ppReverse) {
					q._ppReverse = !1, He(), Fe();
					return;
				}
				if (e.paused) {
					Je();
					let t = e.play?.();
					t && typeof t.catch == "function" && t.catch(() => {});
				} else e.pause?.();
			} catch (e) {
				console.debug?.(e);
			}
			Fe();
		};
		K.push(Z(e, "click", (t) => {
			try {
				if (t?.target !== e) return;
			} catch (e) {
				console.debug?.(e);
			}
			Ye();
		})), K.push(Z(M, "click", (e) => {
			W(e), Ye();
		})), K.push(Z(N, "click", (e) => {
			W(e), qe(-1);
		})), K.push(Z(ee, "click", (e) => {
			W(e), qe(1);
		})), K.push(Z(te, "click", (e) => {
			W(e);
			let { inF: t } = Me();
			Ke(t), we();
		})), K.push(Z(ne, "click", (e) => {
			W(e);
			let { outF: t } = Me();
			Ke(t), we();
		}));
		let Xe = (t) => {
			try {
				let n = Number(e?.duration);
				if (!Number.isFinite(n) || n <= 0) return !1;
				let r = f.getBoundingClientRect?.(), i = Number(r?.width) || 0;
				if (!(i > 0)) return !1;
				let a = P(F((Number(t) || 0) - Number(r.left || 0), 0, i) / i), o = a * n;
				return e.currentTime = o, Pe(), p.value = String(Math.round(a * Ne())), J(o), !0;
			} catch (e) {
				return console.debug?.(e), !1;
			}
		}, Y = {
			active: !1,
			pointerId: null,
			ac: null
		}, Ze = (e = null) => {
			if (Y.active) {
				e && G(e), Y.active = !1, q._seeking = !1;
				try {
					f.releasePointerCapture?.(Y.pointerId);
				} catch (e) {
					console.debug?.(e);
				}
				Y.pointerId = null;
				try {
					Y.ac?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				Y.ac = null, J();
			}
		}, Qe = (e) => {
			Y.active && (G(e), Xe(e.clientX));
		};
		if (K.push(() => Ze()), K.push(Z(f, "pointerdown", (e) => {
			try {
				if (e?.button != null && e.button !== 0 || e?.target?.closest?.(".mjr-video-seek-handle, .mjr-video-seek-mark")) return;
			} catch (e) {
				console.debug?.(e);
			}
			G(e), Se(), q._seeking = !0, Y.active = !0, Y.pointerId = e?.pointerId ?? null, Xe(e?.clientX);
			try {
				f.setPointerCapture?.(Y.pointerId);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				Y.ac?.abort?.();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				let e = new AbortController();
				Y.ac = e, window.addEventListener("pointermove", Qe, {
					passive: !1,
					capture: !0,
					signal: e.signal
				}), window.addEventListener("pointerup", Ze, {
					passive: !1,
					capture: !0,
					signal: e.signal
				}), window.addEventListener("pointercancel", Ze, {
					passive: !1,
					capture: !0,
					signal: e.signal
				}), window.addEventListener("blur", Ze, { signal: e.signal });
			} catch (e) {
				console.debug?.(e);
			}
		}, { passive: !1 })), K.push(Z(p, "pointerdown", () => {
			q._seeking = !0;
		})), K.push(Z(p, "pointerup", () => {
			Y.active || (q._seeking = !1);
		})), K.push(Z(p, "pointercancel", () => {
			Y.active || (q._seeking = !1);
		})), K.push(Z(p, "input", (t) => {
			W(t), Se();
			try {
				let t = Number(e?.duration);
				if (!Number.isFinite(t) || t <= 0) return;
				let n = Number(p.value);
				e.currentTime = P((Number.isFinite(n) ? n : 0) / Ne()) * t;
			} catch (e) {
				console.debug?.(e);
			}
			J();
		})), o) {
			K.push(Z(re, "click", (e) => {
				W(e), q.inFrame = ke(), je(), J(), Re(), ze({ prefer: "in" });
			})), K.push(Z(ie, "click", (e) => {
				W(e), q.outFrame = ke(), je(), J(), Re(), ze({ prefer: "out" });
			})), K.push(Z(se, "change", (e) => {
				W(e);
				try {
					let e = Number(se.value);
					q.inFrame = Number.isFinite(e) ? Math.max(0, Math.floor(e)) : null, je();
				} catch (e) {
					console.debug?.(e);
				}
				J(), Re(), ze({ prefer: "in" });
			})), K.push(Z(ce, "change", (e) => {
				W(e);
				try {
					let e = Number(ce.value);
					q.outFrame = Number.isFinite(e) ? Math.max(0, Math.floor(e)) : null, je();
				} catch (e) {
					console.debug?.(e);
				}
				J(), Re(), ze({ prefer: "out" });
			})), K.push(Z(le, "change", (e) => {
				W(e);
				try {
					q.step = Math.max(1, Math.floor(Number(le.value) || 1)), le.value = String(q.step);
				} catch (e) {
					console.debug?.(e);
				}
			})), K.push(Z(I, "change", (e) => {
				W(e);
				try {
					q.fps = It(I.value, 30), I.value = String(q.fps), xe(!1), je();
				} catch (e) {
					console.debug?.(e);
				}
				J(), Re();
			})), K.push(Z(oe, "click", (e) => {
				W(e), !q.loop && !q.pingpong ? (q.loop = !0, q.pingpong = !1) : q.loop && !q.pingpong ? (q.loop = !1, q.pingpong = !0) : (q.loop = !1, q.pingpong = !1), (q.loop || q.pingpong) && (q.once = !1), q.pingpong || (q._ppReverse = !1, He()), De();
			})), K.push(Z(B, "click", (e) => {
				W(e), Be();
			})), K.push(Z(H, "click", (e) => {
				W(e), Ve();
			})), K.push(Z(k, "click", (e) => {
				W(e), We();
			}));
			try {
				k.title = C("video.resetPlayerControls", "Reset player controls"), k.style.cursor = "pointer", k.style.userSelect = "none";
			} catch (e) {
				console.debug?.(e);
			}
		}
		K.push(Z(de, "click", (t) => {
			W(t);
			try {
				e.muted = !e.muted, R && (R.style.display = e.muted ? "none" : "inline-flex");
			} catch (e) {
				console.debug?.(e);
			}
			Ge();
		})), K.push(Z(de, "contextmenu", (e) => {
			G(e);
			try {
				if (!R) return;
				let e = R.style.display !== "none";
				R.style.display = e ? "none" : "inline-flex";
			} catch (e) {
				console.debug?.(e);
			}
			Ge();
		})), K.push(Z(window, "pointerdown", (e) => {
			try {
				if (!R || R.style.display === "none" || de.contains?.(e?.target) || R.contains?.(e?.target)) return;
				R.style.display = "none";
			} catch (e) {
				console.debug?.(e);
			}
		}, { capture: !0 })), z && K.push(Z(z, "input", (t) => {
			W(t);
			try {
				let t = P(Number(z.value) || 0);
				e.volume = t, t > .001 && (e.muted = !1);
			} catch (e) {
				console.debug?.(e);
			}
			Ge();
		})), K.push(Z(L, "change", (e) => {
			W(e);
			try {
				Ee(Number(L.value) || 1);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				L.blur?.();
			} catch (e) {
				console.debug?.(e);
			}
		})), K.push(Z(e, "ratechange", () => {
			try {
				Ee(Number(e.playbackRate) || q.playbackRate || 1);
			} catch (e) {
				console.debug?.(e);
			}
		}));
		let $e = () => {
			if (o) try {
				if (q._seeking || e?.paused) return;
				let { inF: t, outF: n, maxF: r } = Me();
				if (r <= 0 || t <= 0 && n >= r && !q.loop && !q.pingpong && !q.once || q._ppReverse) return;
				let i = ke();
				if (i >= n - Math.max(1, Math.floor(Number(q.step) || 1))) if (q.pingpong) {
					Ue();
					return;
				} else if (q.loop) {
					Ke(t);
					try {
						let t = e.play?.();
						t && typeof t.catch == "function" && t.catch(() => {});
					} catch (e) {
						console.debug?.(e);
					}
				} else if (q.once) {
					try {
						e.pause?.();
					} catch (e) {
						console.debug?.(e);
					}
					Ke(n);
				} else {
					try {
						e.pause?.();
					} catch (e) {
						console.debug?.(e);
					}
					Ke(n);
				}
				else i < t && Ke(t);
			} catch (e) {
				console.debug?.(e);
			}
		}, et = {
			rafId: null,
			rvfcId: null
		}, tt = () => {
			try {
				et.rvfcId != null && typeof e?.cancelVideoFrameCallback == "function" && e.cancelVideoFrameCallback(et.rvfcId);
			} catch (e) {
				console.debug?.(e);
			}
			et.rvfcId = null;
			try {
				et.rafId != null && typeof cancelAnimationFrame == "function" && cancelAnimationFrame(et.rafId);
			} catch (e) {
				console.debug?.(e);
			}
			et.rafId = null;
		}, nt = (t = 0, n = null) => {
			et.rafId = null, et.rvfcId = null;
			try {
				X(J, n?.mediaTime), X($e);
			} catch (e) {
				console.debug?.(e);
			}
			if (!(!(q._ppReverse || !e?.paused) || ve.signal?.aborted)) {
				try {
					if (typeof e?.requestVideoFrameCallback == "function" && !q._ppReverse) {
						et.rvfcId = e.requestVideoFrameCallback(nt);
						return;
					}
				} catch (e) {
					console.debug?.(e);
				}
				try {
					typeof requestAnimationFrame == "function" && (et.rafId = requestAnimationFrame((t) => {
						nt(t, { mediaTime: Number(e?.currentTime) || 0 });
					}));
				} catch (e) {
					console.debug?.(e);
				}
			}
		}, rt = () => {
			tt(), !(!(q._ppReverse || !e?.paused) || ve.signal?.aborted) && nt(0, { mediaTime: Number(e?.currentTime) || 0 });
		};
		K.push(tt), K.push(Z(e, "play", () => {
			X(Fe), rt();
		}));
		for (let t of ["pause", "ended"]) K.push(Z(e, t, () => {
			tt(), X(Fe), X(J);
		}));
		for (let t of [
			"timeupdate",
			"loadedmetadata",
			"durationchange",
			"seeked"
		]) K.push(Z(e, t, () => X(J)));
		K.push(Z(e, "timeupdate", $e)), K.push(Z(e, "ended", () => {
			if (o) try {
				let { inF: t, outF: n, maxF: r } = Me(), i = t <= 0 && n >= r;
				if (q.pingpong && !q._ppReverse) {
					Ue();
					return;
				}
				if (!q.loop && !i) return;
				Ke(t);
				try {
					let t = e.play?.();
					t && typeof t.catch == "function" && t.catch(() => {});
				} catch (e) {
					console.debug?.(e);
				}
			} catch (e) {
				console.debug?.(e);
			}
		}, { passive: !0 })), a && (K.push(Z(e, "loadedmetadata", () => {
			if (!o) {
				Re();
				return;
			}
			try {
				let e = Oe();
				e > 0 && q.inFrame == null && q.outFrame == null && (q.inFrame = 0, q.outFrame = e, je());
			} catch (e) {
				console.debug?.(e);
			}
			Re();
		})), K.push(Z(e, "durationchange", () => X(Re)))), o && K.push(Z(e, "mjr:frameStep", () => {
			X(we);
		}));
		for (let t of ["volumechange"]) K.push(Z(e, t, () => X(Ge)));
		try {
			q.fps = It(I.value, q.nativeFps || 30), xe(!0), q.step = Math.max(1, Math.floor(Number(le.value) || 1)), je(), De(), Ee(q.playbackRate);
		} catch (e) {
			console.debug?.(e);
		}
		X(Fe), X(J), X(Re), X(Ge);
		try {
			(!e?.paused || q._ppReverse) && rt();
		} catch (e) {
			console.debug?.(e);
		}
		let it = (e = {}) => {
			let t = 0, n = !1;
			try {
				t = Math.max(0, Oe()), n = t > 0 && q.outFrame != null && q.outFrame >= t - 1;
			} catch (e) {
				console.debug?.(e);
			}
			try {
				let t = Number(e?.fps);
				if (Number.isFinite(t) && t > 0) {
					if (String(e?.fpsSource || e?.source || "") === "rvfc" && Number(q.nativeFps) > 0) return;
					let n = be();
					q.nativeFps = It(t, q.nativeFps || 30), n || (q.fps = q.nativeFps);
					try {
						xe(!0);
					} catch (e) {
						console.debug?.(e);
					}
				}
			} catch (e) {
				console.debug?.(e);
			}
			try {
				let t = Number(e?.frameCount);
				q.frameCount = Number.isFinite(t) && t > 0 ? Math.floor(t) : null;
			} catch {
				q.frameCount = null;
			}
			try {
				let e = Math.max(0, Oe());
				n && e > t + .5 && (q.outFrame = null), je(), De(), J(), Re();
			} catch (e) {
				console.debug?.(e);
			}
		};
		try {
			if (o) {
				let e = Number(t?.initialFps), n = Number(t?.initialFrameCount);
				(Number.isFinite(e) || Number.isFinite(n)) && it({
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
					let t = f.getBoundingClientRect(), n = F((Number(e) || 0) - t.left, 0, t.width || 1), r = t.width > 0 ? n / t.width : 0, { maxF: i } = Me();
					return F(Math.round(r * i), 0, i);
				} catch {
					return 0;
				}
			}, n = (n, a) => {
				G(n);
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
					f.setPointerCapture?.(n.pointerId);
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
				a === "in" ? q.inFrame = o : q.outFrame = o, je(), J(), Re(), ze({ prefer: a });
			}, r = (n) => {
				if (!e.active) return;
				G(n);
				let r = t(n.clientX);
				e.which === "in" ? q.inFrame = r : q.outFrame = r, je(), J(), Re();
			}, i = (t) => {
				if (e.active) {
					G(t), e.active = !1;
					try {
						f.releasePointerCapture?.(e.pointerId);
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
						ze({ prefer: e.which });
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
			K.push(Z(E, "pointerdown", (e) => n(e, "in"), { passive: !1 })), K.push(Z(D, "pointerdown", (e) => n(e, "out"), { passive: !1 })), K.push(Z(x, "pointerdown", (e) => n(e, "in"), { passive: !1 })), K.push(Z(S, "pointerdown", (e) => n(e, "out"), { passive: !1 })), K.push(Z(f, "pointermove", r, { passive: !1 })), K.push(Z(f, "pointerup", i, { passive: !1 })), K.push(Z(f, "pointercancel", i, { passive: !1 }));
		}
		return X(() => c.appendChild(l)), {
			controlsEl: l,
			setMediaInfo: it,
			setPlaybackRate: (e) => {
				try {
					return Ee(e);
				} catch {
					return q.playbackRate || 1;
				}
			},
			getPlaybackRate: () => {
				try {
					return Number(q.playbackRate) || 1;
				} catch {
					return 1;
				}
			},
			adjustPlaybackRate: (e) => {
				try {
					let t = Number(e);
					return Number.isFinite(t) ? Ee((Number(q.playbackRate) || 1) + t) : q.playbackRate || 1;
				} catch {
					return q.playbackRate || 1;
				}
			},
			togglePlay: () => {
				try {
					return Ye(), !0;
				} catch {
					return !1;
				}
			},
			stepFrames: (e) => {
				try {
					return qe(e), !0;
				} catch {
					return !1;
				}
			},
			setInPoint: () => {
				if (!o) return !1;
				try {
					return q.inFrame = ke(), je(), J(), Re(), ze({ prefer: "in" }), !0;
				} catch {
					return !1;
				}
			},
			setOutPoint: () => {
				if (!o) return !1;
				try {
					return q.outFrame = ke(), je(), J(), Re(), ze({ prefer: "out" }), !0;
				} catch {
					return !1;
				}
			},
			goToIn: () => {
				if (!o) return !1;
				try {
					let { inF: e } = Me();
					return Ke(e), we(), !0;
				} catch {
					return !1;
				}
			},
			goToOut: () => {
				if (!o) return !1;
				try {
					let { outF: e } = Me();
					return Ke(e), we(), !0;
				} catch {
					return !1;
				}
			},
			destroy: () => {
				for (let e of K) X(e);
				X(() => l.remove());
			}
		};
	} catch {
		return {
			controlsEl: null,
			destroy: kt
		};
	}
}
//#endregion
//#region ui/features/contextmenu/viewerContextMenuState.ts
function $t() {
	return {
		open: !1,
		x: 0,
		y: 0,
		items: [],
		title: ""
	};
}
var Q = M({
	portalOwnerId: "",
	mountedPortalIds: [],
	main: $t(),
	submenu: $t(),
	tags: {
		open: !1,
		x: 0,
		y: 0,
		asset: null,
		onChanged: null
	}
}), en = 1;
function tn(e) {
	e && (e.open = !1, e.x = 0, e.y = 0, e.items = [], e.title = "");
}
function nn(e = "") {
	try {
		window.dispatchEvent(new CustomEvent("mjr-close-all-menus", { detail: { source: String(e || "") } }));
	} catch (e) {
		console.debug?.(e);
	}
}
function rn() {
	let e = `mjr-viewer-context-menu-portal-${en++}`;
	return Q.mountedPortalIds.push(e), Q.portalOwnerId ||= e, e;
}
function an(e) {
	let t = Q.mountedPortalIds.filter((t) => t !== e);
	Q.mountedPortalIds.splice(0, Q.mountedPortalIds.length, ...t), Q.portalOwnerId === e && (Q.portalOwnerId = Q.mountedPortalIds[0] || "");
}
function on(e) {
	return String(Q.portalOwnerId || "") === String(e || "");
}
function sn({ x: e = 0, y: t = 0, items: n = [], title: r = "" } = {}) {
	nn("viewer"), fn(), un(), Q.main.open = !0, Q.main.x = Number(e) || 0, Q.main.y = Number(t) || 0, Q.main.items = Array.isArray(n) ? n.filter(Boolean) : [], Q.main.title = String(r || "");
}
function cn() {
	tn(Q.main), un();
}
function ln({ x: e = 0, y: t = 0, items: n = [], title: r = "" } = {}) {
	Q.submenu.open = !0, Q.submenu.x = Number(e) || 0, Q.submenu.y = Number(t) || 0, Q.submenu.items = Array.isArray(n) ? n.filter(Boolean) : [], Q.submenu.title = String(r || "");
}
function un() {
	tn(Q.submenu);
}
function dn({ x: e = 0, y: t = 0, asset: n = null, onChanged: r = null } = {}) {
	cn(), Q.tags.open = !!n, Q.tags.x = Number(e) || 0, Q.tags.y = Number(t) || 0, Q.tags.asset = n || null, Q.tags.onChanged = typeof r == "function" ? r : null;
}
function fn() {
	Q.tags.open = !1, Q.tags.x = 0, Q.tags.y = 0, Q.tags.asset = null, Q.tags.onChanged = null;
}
function pn() {
	cn(), fn();
}
//#endregion
//#region ui/features/viewer/ViewerContextMenu.ts
var mn = {
	COPY_PATH: "Ctrl+Shift+C",
	DOWNLOAD: "S",
	OPEN_IN_FOLDER: "Ctrl+Shift+E",
	ADD_TO_COLLECTION: "B",
	EDIT_TAGS: "T",
	RATING_SUBMENU: "1-5",
	RENAME: "F2",
	DELETE: "Del"
}, hn = [
	"B",
	"KB",
	"MB",
	"GB",
	"TB"
], gn = /* @__PURE__ */ new WeakMap(), _n = 1;
function vn(e = "viewer-menu-item") {
	return `${e}-${_n++}`;
}
function yn(e, t, n, r, i = {}) {
	return {
		id: vn(),
		type: "item",
		label: String(e || ""),
		iconClass: t ? String(t) : "",
		rightHint: n ? String(n) : "",
		action: typeof r == "function" ? r : null,
		disabled: !!i.disabled,
		closeOnSelect: i.closeOnSelect !== !1,
		submenu: Array.isArray(i.submenu) ? i.submenu.filter(Boolean) : null
	};
}
function bn() {
	return {
		id: vn("viewer-menu-separator"),
		type: "separator"
	};
}
function xn(e) {
	let t = String(e || "").trim();
	if (!t) return !1;
	if (t.startsWith("/")) return !0;
	try {
		let e = new URL(t);
		return e.protocol === "http:" || e.protocol === "https:";
	} catch {
		return !1;
	}
}
function Sn(t, n, r) {
	let i = t?.id;
	try {
		t.rating = n;
	} catch (e) {
		console.debug?.(e);
	}
	try {
		r?.();
	} catch (e) {
		console.debug?.(e);
	}
	if (i) {
		Et(String(i), n, {
			successMessage: n > 0 ? `Rating set to ${n} stars` : "Rating cleared",
			errorMessage: "Failed to update rating",
			warnPrefix: "[ViewerContextMenu]",
			onSuccess: () => {
				ce(k, {
					assetId: String(i),
					rating: n
				}, { warnPrefix: "[ViewerContextMenu]" });
			},
			onFailure: (e) => {
				a(e, "[ViewerContextMenu] Rating update", { showToast: !0 });
			}
		});
		return;
	}
	e(t, n).catch((e) => {
		a(e, "[ViewerContextMenu] Rating update", { showToast: !0 });
	});
}
function Cn(e) {
	let t = Number(e);
	if (!Number.isFinite(t) || t < 0) return "";
	let n = 0;
	for (; t >= 1024 && n < hn.length - 1;) t /= 1024, n += 1;
	return `${n === 0 ? `${Math.round(t)}` : t.toFixed(2)} ${hn[n]}`;
}
function wn(e, t, n) {
	let r = [
		5,
		4,
		3,
		2,
		1
	].map((r) => yn(`${r} Stars`, "pi pi-star", null, async () => {
		Sn(e, r, t);
	}, { disabled: !n }));
	return r.push(bn()), r.push(yn(C("ctx.resetRating", "Reset rating"), "pi pi-star", "0", async () => {
		Sn(e, 0, t);
	}, { disabled: !n })), r;
}
function Tn({ asset: e, event: r, getCurrentViewUrl: i, onAssetChanged: o }) {
	let l = typeof i == "function" ? i(e) : O(e), u = !!(e?.id || e?.filepath);
	return [
		yn(C("ctx.openInNewTab", "Open in New Tab"), "pi pi-external-link", null, async () => {
			xn(l) && window.open(l, "_blank", "noopener,noreferrer");
		}),
		yn(C("ctx.copyPath", "Copy path"), "pi pi-copy", mn.COPY_PATH, async () => {
			let t = e?.filepath ? String(e.filepath) : "";
			if (!t) {
				n(C("toast.noFilePath"), "error");
				return;
			}
			try {
				await navigator.clipboard.writeText(t), n(C("toast.pathCopied"), "success", 2e3);
			} catch (e) {
				console.error("[ViewerContextMenu] Copy failed:", e), n(C("toast.pathCopyFailed"), "error");
			}
		}),
		yn(C("ctx.downloadOriginal", "Download Original"), "pi pi-download", mn.DOWNLOAD, async () => {
			if (!e || !e.filepath) return;
			let t = v(e.filepath), r = document.createElement("a");
			r.href = t, r.download = e.filename, document.body.appendChild(r), r.click(), document.body.removeChild(r), n(C("toast.downloadingFile", "Downloading {filename}...", { filename: e.filename }), "info", 3e3);
		}, { disabled: !e?.filepath }),
		yn(C("ctx.openInFolder", "Open in folder"), "pi pi-folder-open", mn.OPEN_IN_FOLDER, async () => {
			let t = await c(e);
			t?.ok ? n(C("toast.openedInFolder"), "info", 2e3) : n(t?.error || C("toast.openFolderFailed"), "error");
		}, { disabled: !(e?.id || e?.filepath) }),
		yn(C("ctx.addToCollection", "Add to collection"), "pi pi-bookmark", mn.ADD_TO_COLLECTION, async () => {
			try {
				await bt({
					x: r?.clientX,
					y: r?.clientY,
					assets: [e]
				});
			} catch (e) {
				console.error("[ViewerContextMenu] Add to collection failed:", e);
			}
		}),
		bn(),
		yn(C("ctx.editTags", "Edit tags"), "pi pi-tags", mn.EDIT_TAGS, async () => {
			dn({
				x: (Number(r?.clientX) || 0) + 6,
				y: (Number(r?.clientY) || 0) + 6,
				asset: e,
				onChanged: ((...t) => {
					let n = t[0];
					e.tags = n, ce(w, {
						assetId: String(e.id),
						tags: n
					}, { warnPrefix: "[ViewerContextMenu]" });
					try {
						o?.();
					} catch (e) {
						console.debug?.(e);
					}
				})
			});
		}, { closeOnSelect: !1 }),
		bn(),
		yn(C("ctx.setRating", "Set rating"), "pi pi-star", `${mn.RATING_SUBMENU} >`, null, {
			disabled: !u,
			closeOnSelect: !1,
			submenu: wn(e, o, u)
		}),
		yn(C("ctx.refreshMetadata", "Refresh metadata"), "pi pi-sync", "R", async () => {
			if (e?.id) try {
				let t = await p(e.id, { refresh: !0 });
				if (!t?.ok || !t?.data) {
					n(t?.error || C("toast.metadataRefreshFailed", "Failed to refresh metadata."), "error");
					return;
				}
				let r = t.data;
				try {
					ce(_, {
						assetId: String(e.id),
						info: r
					}, { warnPrefix: "[ViewerContextMenu]" });
				} catch (e) {
					console.debug?.(e);
				}
				let i = [], a = Cn(r?.size_bytes);
				a && i.push(a), r?.mime && i.push(r.mime), n(C("toast.metadataRefreshed", "Metadata refreshed{suffix}", { suffix: i.length ? ` (${i.join(", ")})` : "" }), "success", 3e3);
			} catch (e) {
				a(e, "[ViewerContextMenu] Metadata refresh", { showToast: !0 });
			}
		}, { disabled: !e?.id }),
		bn(),
		yn(C("ctx.rename", "Rename"), "pi pi-pencil", mn.RENAME, async () => {
			if (!(e?.id || e?.filepath)) return;
			let t = e.filename || "", r = ut(await L(C("dialog.rename.title", "Rename file"), t), t);
			if (!r || r === t) return;
			let i = st(r);
			if (!i.valid) {
				n(i.reason, "error");
				return;
			}
			try {
				let t = await s(e, r);
				if (t?.ok) {
					let i = t?.data?.asset;
					i && typeof i == "object" ? Object.assign(e, i) : (e.filename = r, e.filepath = e.filepath.replace(/[^\\/]+$/, r), e.path &&= String(e.path).replace(/[^\\/]+$/, r), e.file_info && typeof e.file_info == "object" && (e.file_info.filename = r, e.file_info.filepath && (e.file_info.filepath = String(e.file_info.filepath).replace(/[^\\/]+$/, r)), e.file_info.path && (e.file_info.path = String(e.file_info.path).replace(/[^\\/]+$/, r)))), n(C("toast.fileRenamedSuccess"), "success");
					try {
						window.dispatchEvent(new CustomEvent("mjr:reload-grid", { detail: { reason: "viewer-rename" } }));
					} catch (e) {
						console.debug?.(e);
					}
					o?.();
				} else n(t?.error || C("toast.fileRenameFailed"), "error");
			} catch (e) {
				n(C("toast.errorRenaming", "Error renaming file: {error}", { error: e?.message || String(e || "") }), "error");
			}
		}, { disabled: !(e?.id || e?.filepath) }),
		yn(C("ctx.delete", "Delete"), "pi pi-trash", mn.DELETE, async () => {
			if ((e?.id || e?.filepath) && await mt(1, e?.filename)) try {
				let r = await t(e);
				r?.ok ? (n(C("toast.fileDeletedSuccess"), "success"), o?.()) : n(r?.error || C("toast.fileDeleteFailed"), "error");
			} catch (e) {
				n(C("toast.errorDeleting", "Error deleting file: {error}", { error: e?.message || String(e || "") }), "error");
			}
		}, { disabled: !(e?.id || e?.filepath) })
	];
}
function En({ overlayEl: e, getCurrentAsset: t, getCurrentViewUrl: n, onAssetChanged: r } = {}) {
	if (!e || typeof t != "function") return;
	let i = gn.get(e);
	if (typeof i?.unbind == "function") return i.unbind;
	let a = async (i) => {
		if (!e.contains(i.target)) return;
		i.preventDefault(), i.stopPropagation();
		let a = t();
		a && sn({
			x: i.clientX,
			y: i.clientY,
			items: Tn({
				asset: a,
				event: i,
				getCurrentViewUrl: n,
				onAssetChanged: r
			})
		});
	};
	try {
		e.addEventListener("contextmenu", a);
	} catch (e) {
		console.error("[ViewerContextMenu] Failed to bind:", e);
	}
	let o = () => {
		try {
			e.removeEventListener("contextmenu", a);
		} catch (e) {
			console.debug?.(e);
		}
		try {
			Tt();
			let e = globalThis?._ratingDebounceTimers;
			e && typeof e.clear == "function" && e.clear();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			pn();
		} catch (e) {
			console.debug?.(e);
		}
		gn.delete(e);
	};
	return gn.set(e, { unbind: o }), o;
}
function Dn(e) {
	let t = e ? gn.get(e) : null;
	try {
		t?.unbind?.();
	} catch (e) {
		console.debug?.(e);
	}
}
//#endregion
//#region ui/features/viewer/mediaPlayer.ts
function On(e) {
	let t = String(e || "").toLowerCase();
	return t === "video" || t === "audio";
}
function kn({ mode: e, VIEWER_MODES: t, singleView: n, abView: r, sideView: i } = {}) {
	try {
		let a = n;
		return e === t?.AB_COMPARE ? a = r : e === t?.SIDE_BY_SIDE && (a = i), a ? Array.from(a.querySelectorAll?.(".mjr-viewer-video-src, .mjr-viewer-audio-src") || []) : [];
	} catch {
		return [];
	}
}
function An(e) {
	try {
		let t = Array.isArray(e) ? e : [];
		return t.find((e) => String(e?.dataset?.mjrCompareRole || "") === "A") || t[0] || null;
	} catch {
		return null;
	}
}
function jn(e, t = {}) {
	try {
		if (!e) return null;
		let n = String(t?.mediaKind || "").toLowerCase();
		return Qt(e, {
			...t,
			mediaKind: n
		});
	} catch {
		return null;
	}
}
//#endregion
//#region ui/features/viewer/ViewerState.ts
var Mn = "mjr_viewer_prefs_v1";
function Nn() {
	try {
		let e = y.get(Mn);
		if (!e) return {};
		let t = JSON.parse(e);
		return t && typeof t == "object" ? t : {};
	} catch {
		return {};
	}
}
function Pn(e) {
	try {
		if (!e) return;
		let t = {
			analysisMode: String(e.analysisMode || "none"),
			loupeEnabled: !!e.loupeEnabled,
			probeEnabled: !!e.probeEnabled,
			hudEnabled: !!e.hudEnabled,
			genInfoOpen: !!e.genInfoOpen,
			audioVisualizerMode: String(e.audioVisualizerMode || "artistic"),
			abWipePercent: Number.isFinite(Number(e._abWipePercent)) ? Number(e._abWipePercent) : 50
		};
		y.set(Mn, JSON.stringify(t));
	} catch (e) {
		console.debug?.(e);
	}
}
//#endregion
//#region ui/features/viewer/lifecycle.ts
function Fn(e) {
	if (e) {
		try {
			e._mjrSyncAbort?.abort?.();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			e._mjrSyncAbort = null;
		} catch (e) {
			console.debug?.(e);
		}
		try {
			let t = e.querySelectorAll?.("video, audio");
			if (t && t.length) for (let e of t) {
				try {
					e.pause?.();
				} catch (e) {
					console.debug?.(e);
				}
				try {
					e?._mjrAudioViz?.destroy?.();
				} catch (e) {
					console.debug?.(e);
				}
				try {
					e._mjrAudioViz = null;
				} catch (e) {
					console.debug?.(e);
				}
				try {
					e.currentTime = 0;
				} catch (e) {
					console.debug?.(e);
				}
				try {
					e.removeAttribute?.("src");
				} catch (e) {
					console.debug?.(e);
				}
				try {
					e.load?.();
				} catch (e) {
					console.debug?.(e);
				}
			}
		} catch (e) {
			console.debug?.(e);
		}
		try {
			let t = e.querySelectorAll?.(".mjr-viewer-media, .mjr-viewer-audio-viz");
			if (t && t.length) for (let e of t) {
				try {
					e?._mjrProc?.destroy?.();
				} catch (e) {
					console.debug?.(e);
				}
				try {
					e._mjrProc = null;
				} catch (e) {
					console.debug?.(e);
				}
				try {
					e.width = 0, e.height = 0;
				} catch (e) {
					console.debug?.(e);
				}
			}
		} catch (e) {
			console.debug?.(e);
		}
	}
}
function In(e) {
	let t = [];
	try {
		e._mjrViewerUnsubs = t;
	} catch (e) {
		console.debug?.(e);
	}
	let n = {
		unsubs: t,
		safeAddListener: Z,
		safeCall: X,
		destroyMediaProcessorsIn: Fn,
		_observer: null,
		disposeAll: () => {
			try {
				n._observer?.disconnect?.();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				for (let e of t) X(e);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				t.length = 0;
			} catch (e) {
				console.debug?.(e);
			}
		}
	};
	try {
		if (e && typeof MutationObserver < "u") {
			let t = new MutationObserver(() => {
				try {
					if (!document.contains(e)) {
						try {
							t.disconnect();
						} catch (e) {
							console.debug?.(e);
						}
						X(() => n.disposeAll?.(), "lifecycle:autoDispose");
					}
				} catch (e) {
					console.debug?.(e);
				}
			}), r = e?.parentElement;
			r ? t.observe(r, { childList: !0 }) : t.observe(document.body, { childList: !0 }), n._observer = t;
		}
	} catch (e) {
		console.debug?.(e);
	}
	try {
		e._mjrViewerLifecycle = n;
	} catch (e) {
		console.debug?.(e);
	}
	return n;
}
//#endregion
//#region ui/components/buttons.ts
function Ln(e, t) {
	let n = document.createElement("button");
	n.textContent = e, n.title = t || "";
	try {
		n.setAttribute("aria-label", t || e || "Button");
	} catch (e) {
		console.debug?.(e);
	}
	return n.style.cssText = "\n        padding: 6px 12px;\n        background: transparent;\n        border: 1px solid rgba(255, 255, 255, 0.3);\n        color: white;\n        border-radius: 4px;\n        cursor: pointer;\n        font-size: 14px;\n        transition: all 0.2s;\n        display: inline-flex;\n        align-items: center;\n        justify-content: center;\n    ", n.onmouseenter = () => {
		n.disabled || (n.style.background = "rgba(255, 255, 255, 0.1)");
	}, n.onmouseleave = () => {
		n.disabled || (n.style.background = "transparent");
	}, n;
}
function Rn(e, t) {
	let n = document.createElement("button");
	n.textContent = e, n.dataset.mode = t;
	try {
		n.setAttribute("aria-label", e), n.setAttribute("aria-pressed", "false");
	} catch (e) {
		console.debug?.(e);
	}
	return n.style.cssText = "\n        padding: 4px 12px;\n        background: linear-gradient(180deg, rgba(206, 211, 218, 0.1), rgba(206, 211, 218, 0.03));\n        border: 0.8px solid rgba(196, 202, 210, 0.3);\n        color: rgba(230, 233, 238, 0.95);\n        border-radius: 4px;\n        cursor: pointer;\n        font-size: 12px;\n        transition: all 0.16s;\n    ", n;
}
//#endregion
//#region ui/features/viewer/toolbarControls.ts
function zn({ VIEWER_MODES: e, state: t, onToolsChanged: n, onCompareModeChanged: r, onExportFrame: i, onCopyFrame: a, onAudioVizModeChanged: o, getCanAB: s } = {}) {
	let c = {
		channel: "rgb",
		exposureEV: 0,
		gamma: 1,
		analysisMode: "none",
		scopesMode: "off",
		gridMode: 0,
		overlayMaskEnabled: !1,
		overlayMaskOpacity: .65,
		overlayFormat: "image",
		probeEnabled: !1,
		loupeEnabled: !1,
		hudEnabled: !0,
		distractionFree: !1,
		genInfoOpen: !0,
		abCompareMode: "wipe",
		audioVisualizerMode: "artistic"
	}, l = document.createElement("div");
	l.className = "mjr-viewer-tools", l.style.cssText = "\n        display: block;\n        padding: 8px 8px 6px;\n        border-top: 0.8px solid rgba(196, 202, 210, 0.16);\n        background: rgba(12, 14, 19, 0.22);\n    ";
	let u = document.createElement("div");
	u.className = "mjr-viewer-tools-deck", u.style.cssText = "display:flex; flex-wrap:nowrap; gap:8px; align-items:center; min-width:0; overflow-x:auto; overflow-y:hidden;";
	let d = ({ key: e, eyebrow: t, title: n } = {}) => {
		let r = document.createElement("section");
		r.className = "mjr-viewer-tools-panel", e && (r.dataset.panel = String(e)), r.style.cssText = "display:flex; flex-direction:column; gap:4px; min-width:0; padding:5px 6px; border-radius:10px; border:1px solid rgba(255,255,255,0.08); background:linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.02)); box-shadow:inset 0 1px 0 rgba(255,255,255,0.04); flex:0 0 auto;";
		let i = document.createElement("div");
		i.className = "mjr-viewer-tools-panel-head", i.style.cssText = "display:none; align-items:flex-start; justify-content:space-between; gap:6px; min-width:0;";
		let a = document.createElement("div");
		a.className = "mjr-viewer-tools-panel-heading", a.style.cssText = "display:flex; flex-direction:column; gap:1px; min-width:0;";
		let o = document.createElement("span");
		o.className = "mjr-viewer-tools-panel-eyebrow", o.textContent = t || "";
		let s = document.createElement("span");
		s.className = "mjr-viewer-tools-panel-title", s.textContent = n || "";
		let c = document.createElement("div");
		return c.className = "mjr-viewer-tools-panel-body", c.style.cssText = "display:flex; align-items:center; flex-wrap:nowrap; gap:6px; min-width:0;", a.appendChild(o), a.appendChild(s), i.appendChild(a), r.appendChild(i), r.appendChild(c), {
			panel: r,
			body: c,
			head: i,
			heading: a,
			eyebrowEl: o,
			titleEl: s
		};
	}, f = d({
		key: "grade",
		eyebrow: "Image",
		title: "Adjustments"
	}), p = d({
		key: "overlay",
		eyebrow: "Viewer",
		title: "Guides & Compare"
	}), m = d({
		key: "inspect",
		eyebrow: "Inspect",
		title: "Probe"
	}), h = d({
		key: "actions",
		eyebrow: "Actions",
		title: "Reset & Export"
	}), g = d({
		key: "info",
		eyebrow: "Infos",
		title: "Help"
	}), _ = document.createElement("div");
	_.className = "mjr-viewer-tools-actions", _.style.cssText = "display:flex; align-items:center; justify-content:flex-start; gap:6px; flex-wrap:wrap; min-width:0;";
	let v = document.createElement("div");
	v.className = "mjr-viewer-tools-meta", v.style.cssText = "display:flex; align-items:center; justify-content:flex-start; gap:6px; flex-wrap:nowrap; min-width:0;";
	let y = ({ key: e, label: t, accentRgb: n } = {}) => {
		let r = document.createElement("div");
		if (r.className = "mjr-viewer-tools-group", e && (r.dataset.group = String(e)), n && r.style.setProperty("--mjr-group-accent", String(n)), r.style.cssText = "display:flex; align-items:center; gap:6px; padding:2px 6px; border-radius:8px; border:1px solid rgba(196,202,210,0.14); background:rgba(10,12,16,0.22);", t) {
			let e = document.createElement("span");
			e.className = "mjr-viewer-tools-group-label", e.textContent = t, e.style.cssText = "font-size: 10px; color: rgba(255,255,255,0.7);", r.appendChild(e);
		}
		return r;
	}, b = (e, t) => {
		let n = document.createElement("select");
		n.title = e || "", n.className = "mjr-viewer-tools-select", n.style.cssText = "\n            height: 24px;\n            padding: 0 6px;\n            border-radius: 6px;\n            border: 0.8px solid rgba(196, 202, 210, 0.24);\n            background: linear-gradient(180deg, rgba(210, 214, 220, 0.06), rgba(210, 214, 220, 0.02));\n            color: rgba(230,233,238,0.92);\n            font-size: 11px;\n            outline: none;\n        ";
		for (let e of t || []) {
			let t = document.createElement("option");
			t.value = String(e.value), t.textContent = String(e.label), n.appendChild(t);
		}
		return n;
	}, x = (e, { min: t, max: n, step: r, value: i }) => {
		let a = document.createElement("div");
		a.className = "mjr-viewer-tools-range", a.style.cssText = "display:flex; align-items:center; gap:6px;";
		let o = document.createElement("input");
		o.type = "range", o.className = "mjr-viewer-tools-range-input", o.min = String(t), o.max = String(n), o.step = String(r), o.value = String(i), o.title = e || "", o.style.cssText = "\n            width: 92px;\n            accent-color: rgba(255,255,255,0.85);\n        ";
		let s = document.createElement("span");
		return s.style.cssText = "font-size: 11px; color: rgba(255,255,255,0.9); min-width: 38px; text-align: right;", s.textContent = String(i), a.appendChild(o), a.appendChild(s), {
			wrap: a,
			input: o,
			out: s
		};
	}, S = (e, t, { iconClass: n = null, accentRgb: r = null } = {}) => {
		let i = document.createElement("button");
		if (i.type = "button", i.className = "mjr-viewer-tool-btn", i.setAttribute("aria-label", t || e || "Toggle"), i.setAttribute("aria-pressed", "false"), r) try {
			i.dataset.accentRgb = String(r);
		} catch (e) {
			console.debug?.(e);
		}
		if (n) {
			let t = document.createElement("span");
			t.className = `pi ${n}`.trim(), t.setAttribute("aria-hidden", "true"), t.style.fontSize = "14px", i.appendChild(t);
			let r = document.createElement("span");
			r.textContent = e || "", r.style.cssText = "position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0;", i.appendChild(r);
		} else i.textContent = e;
		i.title = t || "", i.style.cssText = "\n            height: 24px;\n            padding: 0 8px;\n            border-radius: 6px;\n            border: 0.8px solid rgba(196, 202, 210, 0.24);\n            background: linear-gradient(180deg, rgba(210,214,220,0.06), rgba(210,214,220,0.02));\n            color: rgba(230,233,238,0.92);\n            cursor: pointer;\n            font-size: 11px;\n            user-select: none;\n            display: inline-flex;\n            align-items: center;\n            justify-content: center;\n            gap: 6px;\n            position: relative;\n        ", i.dataset.active = "0";
		let a = (e) => {
			let t = !!e;
			i.dataset.active = t ? "1" : "0";
			try {
				i.setAttribute("aria-pressed", t ? "true" : "false");
			} catch (e) {
				console.debug?.(e);
			}
			let n = String(i.dataset?.accentRgb || "").trim();
			t && n ? (i.style.background = `rgba(${n}, 0.12)`, i.style.borderColor = `rgba(${n}, 0.38)`, i.style.boxShadow = `0 0 0 0.8px rgba(${n}, 0.12) inset`) : (i.style.background = t ? "rgba(214,218,224,0.12)" : "rgba(210,214,220,0.06)", i.style.borderColor = t ? "rgba(214,218,224,0.38)" : "rgba(196,202,210,0.24)", i.style.boxShadow = "");
		};
		return a(!1), {
			b: i,
			setActive: a
		};
	}, w = b("Channel View", [
		{
			value: "rgb",
			label: "RGB"
		},
		{
			value: "r",
			label: "R"
		},
		{
			value: "g",
			label: "G"
		},
		{
			value: "b",
			label: "B"
		},
		{
			value: "a",
			label: "Alpha"
		},
		{
			value: "l",
			label: "Luma"
		}
	]);
	w.title = C("tooltip.colorChannels", "View color channels or luminance");
	let T = x("Exposure (EV)", {
		min: -10,
		max: 10,
		step: .1,
		value: 0
	}), E = x("Gamma", {
		min: .1,
		max: 3,
		step: .01,
		value: 1
	}), D = Object.freeze({
		channel: "120, 180, 255",
		exposure: "255, 200, 70",
		gamma: "190, 150, 255",
		analysis: "255, 140, 80",
		zebra: "255, 90, 90",
		overlay: "110, 240, 190",
		probe: "120, 255, 170",
		loupe: "180, 140, 255",
		compare: "90, 220, 220",
		geninfo: "200, 170, 255",
		audioviz: "255, 150, 80"
	}), O = Object.freeze({
		borderColor: "rgba(255,255,255,0.14)",
		background: "rgba(255,255,255,0.08)",
		boxShadow: ""
	}), k = (e, { accentRgb: t, active: n, title: r } = {}) => {
		try {
			if (!e) return;
			if (r && (e.title = String(r)), !n) {
				e.style.borderColor = O.borderColor, e.style.background = O.background, e.style.boxShadow = O.boxShadow;
				return;
			}
			let i = String(t || "").trim();
			if (!i) return;
			e.style.borderColor = `rgba(${i},0.55)`, e.style.background = `rgba(${i},0.14)`, e.style.boxShadow = `0 0 0 1px rgba(${i},0.14) inset`;
		} catch (e) {
			console.debug?.(e);
		}
	}, A = (e) => {
		try {
			let t = String(e || "rgb");
			if (w.style.boxShadow = "", t === "r") {
				w.style.borderColor = "rgba(255,90,90,0.60)", w.style.background = "rgba(255,90,90,0.14)", w.style.boxShadow = "0 0 0 1px rgba(255,90,90,0.14) inset";
				return;
			}
			if (t === "g") {
				w.style.borderColor = "rgba(90,255,140,0.55)", w.style.background = "rgba(90,255,140,0.12)", w.style.boxShadow = "0 0 0 1px rgba(90,255,140,0.12) inset";
				return;
			}
			if (t === "b") {
				w.style.borderColor = "rgba(90,160,255,0.60)", w.style.background = "rgba(90,160,255,0.12)", w.style.boxShadow = "0 0 0 1px rgba(90,160,255,0.12) inset";
				return;
			}
			if (t === "l") {
				w.style.borderColor = "rgba(255,210,90,0.60)", w.style.background = "rgba(255,210,90,0.12)", w.style.boxShadow = "0 0 0 1px rgba(255,210,90,0.12) inset";
				return;
			}
			if (t === "a") {
				w.style.borderColor = "rgba(220,220,220,0.35)", w.style.background = "rgba(255,255,255,0.10)", w.style.boxShadow = "0 0 0 1px rgba(255,255,255,0.08) inset";
				return;
			}
			if (t === "rgb") {
				w.style.borderColor = "rgba(255,255,255,0.22)", w.style.background = "linear-gradient(90deg, rgba(255,90,90,0.16), rgba(90,255,140,0.14), rgba(90,160,255,0.16))", w.style.boxShadow = "0 0 0 1px rgba(255,255,255,0.10) inset";
				return;
			}
			w.style.borderColor = "rgba(255,255,255,0.14)", w.style.background = "rgba(255,255,255,0.08)";
		} catch (e) {
			console.debug?.(e);
		}
	}, j = (e, { accentRgb: t, active: n } = {}) => {
		try {
			if (!e) return;
			if (!n) {
				e.style.color = "rgba(255,255,255,0.9)";
				return;
			}
			let r = String(t || "").trim();
			if (!r) return;
			e.style.color = `rgb(${r})`;
		} catch (e) {
			console.debug?.(e);
		}
	}, M = (e, { accentRgb: t, active: n } = {}) => {
		try {
			if (!e) return;
			if (!n) {
				e.style.background = "", e.style.borderColor = "transparent", e.style.boxShadow = "";
				return;
			}
			let r = String(t || "").trim();
			if (!r) return;
			e.style.background = `rgba(${r},0.10)`, e.style.borderColor = `rgba(${r},0.38)`, e.style.boxShadow = `0 0 0 1px rgba(${r},0.12) inset`;
		} catch (e) {
			console.debug?.(e);
		}
	}, N = S("Zebra", "Zebra Highlights (Z)", {
		iconClass: "pi-bars",
		accentRgb: D.zebra
	}), ee = S("Scopes", "Scopes overlay", {
		iconClass: "pi-chart-bar",
		accentRgb: D.analysis
	}), P = b("Scopes", [
		{
			value: "off",
			label: "Off"
		},
		{
			value: "hist",
			label: "Histogram"
		},
		{
			value: "wave",
			label: "Waveform"
		},
		{
			value: "both",
			label: "Both"
		}
	]);
	P.title = C("tooltip.scopesHistogram", "Show histogram/waveform scopes");
	let te = S("Grid", "Grid (G)", {
		iconClass: "pi-th-large",
		accentRgb: D.overlay
	}), F = b("Grid Overlay", [
		{
			value: 0,
			label: "Off"
		},
		{
			value: 1,
			label: "Thirds"
		},
		{
			value: 2,
			label: "Center"
		},
		{
			value: 3,
			label: "Safe"
		},
		{
			value: 4,
			label: "Golden"
		}
	]);
	F.title = Dt(C("tooltip.gridOverlay", "Grid overlay (rule of thirds, center)"), "G");
	let ne = S("Mask", "Format mask (dim outside)", {
		iconClass: "pi-stop",
		accentRgb: D.overlay
	}), re = b("Format", [
		{
			value: "image",
			label: "Image"
		},
		{
			value: "16:9",
			label: "16:9"
		},
		{
			value: "1:1",
			label: "1:1"
		},
		{
			value: "4:3",
			label: "4:3"
		},
		{
			value: "2.39",
			label: "2.39"
		},
		{
			value: "9:16",
			label: "9:16"
		}
	]);
	re.title = C("tooltip.aspectRatioMask", "Aspect ratio overlay mask");
	let ie = x("Mask Opacity", {
		min: 0,
		max: .9,
		step: .05,
		value: .65
	}), ae = S("Probe", "Pixel Probe (I)", {
		iconClass: "pi-eye",
		accentRgb: D.probe
	}), oe = S("Loupe", "Loupe (L)", {
		iconClass: "pi-search-plus",
		accentRgb: D.loupe
	}), se = S("HUD", "Viewer HUD", {
		iconClass: "pi-info-circle",
		accentRgb: D.overlay
	}), ce = S("Focus", "Distraction-free mode (X)", {
		iconClass: "pi-window-maximize",
		accentRgb: D.overlay
	}), le = S("Gen", Dt("Generation info (prompt/model)", "D"), {
		iconClass: "pi-book",
		accentRgb: D.geninfo
	}), I = b("A/B Compare Mode", [
		{
			value: "wipe",
			label: "Wipe (H)"
		},
		{
			value: "wipeV",
			label: "Wipe (V)"
		},
		{
			value: "difference",
			label: "Difference"
		},
		{
			value: "absdiff",
			label: "AbsDiff"
		},
		{
			value: "add",
			label: "Add"
		},
		{
			value: "subtract",
			label: "Subtract"
		},
		{
			value: "multiply",
			label: "Multiply"
		},
		{
			value: "screen",
			label: "Screen"
		}
	]);
	I.title = C("tooltip.compareBlendMode", "Compare blend mode");
	let L = b("Audio Visualizer", [{
		value: "simple",
		label: "Simple"
	}, {
		value: "artistic",
		label: "Artistic"
	}]);
	L.title = C("tooltip.audioVisualizer", "Audio visualizer mode");
	let ue = Ln("Reset", C("tooltip.resetPlayerControls", "Reset all viewer controls"));
	ue.style.height = "26px", ue.style.fontSize = "11px", ue.style.padding = "0 8px", ue.classList?.add?.("mjr-viewer-tool-btn", "mjr-viewer-tool-btn--reset"), ue.classList?.add?.("mjr-viewer-tools-action", "mjr-viewer-tools-action--primary"), ue.style.marginLeft = "auto";
	let de = document.createElement("button");
	de.type = "button", de.title = C("tooltip.exportFrame", "Save current frame as PNG"), de.setAttribute("aria-label", C("tooltip.exportFrame", "Save frame as PNG")), de.className = "mjr-viewer-tool-btn mjr-viewer-tool-btn--reset", de.style.cssText = "height:24px; padding:0 8px; display:inline-flex; align-items:center; justify-content:center;";
	let R = document.createElement("span");
	R.className = "pi pi-download", R.setAttribute("aria-hidden", "true"), R.style.fontSize = "14px", de.appendChild(R), de.classList?.add?.("mjr-viewer-tools-action");
	try {
		de.style.display = "none";
	} catch (e) {
		console.debug?.(e);
	}
	let z = document.createElement("button");
	z.type = "button", z.title = C("tooltip.copyFrame", "Copy current frame to clipboard"), z.setAttribute("aria-label", C("tooltip.copyFrame", "Copy frame to clipboard")), z.className = "mjr-viewer-tool-btn mjr-viewer-tool-btn--reset", z.style.cssText = "height:24px; padding:0 8px; display:inline-flex; align-items:center; justify-content:center;";
	let fe = document.createElement("span");
	fe.className = "pi pi-copy", fe.setAttribute("aria-hidden", "true"), fe.style.fontSize = "14px", z.appendChild(fe), z.classList?.add?.("mjr-viewer-tools-action");
	try {
		z.style.display = "none";
	} catch (e) {
		console.debug?.(e);
	}
	let B = y({
		key: "channel",
		label: "Channel",
		accentRgb: D.channel
	});
	B.appendChild(w), f.body.appendChild(B);
	let V = y({
		key: "exposure",
		label: "EV",
		accentRgb: D.exposure
	});
	V.appendChild(T.wrap), f.body.appendChild(V);
	let H = y({
		key: "gamma",
		label: "Gamma",
		accentRgb: D.gamma
	});
	H.appendChild(E.wrap), f.body.appendChild(H);
	let pe = () => {
		try {
			t.exposureEV = 0;
		} catch (e) {
			console.debug?.(e);
		}
		try {
			T.input.value = "0", T.out.textContent = "0.0EV";
		} catch (e) {
			console.debug?.(e);
		}
		X(n);
	}, U = () => {
		try {
			t.gamma = 1;
		} catch (e) {
			console.debug?.(e);
		}
		try {
			E.input.value = "1", E.out.textContent = "1.00";
		} catch (e) {
			console.debug?.(e);
		}
		X(n);
	}, me = () => {
		try {
			Object.assign(t, c);
		} catch (e) {
			console.debug?.(e);
		}
		X(r), X(o), X(n);
	};
	try {
		let e = V.querySelector?.(".mjr-viewer-tools-group-label");
		e && (e.title = C("tooltip.resetExposure", "Reset EV to 0"), e.style.cursor = "pointer", e.style.userSelect = "none");
	} catch (e) {
		console.debug?.(e);
	}
	try {
		T.out.title = C("tooltip.resetExposure", "Reset EV to 0"), T.out.style.cursor = "pointer", T.out.style.userSelect = "none";
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let e = H.querySelector?.(".mjr-viewer-tools-group-label");
		e && (e.title = C("tooltip.resetGamma", "Reset Gamma to 1.00"), e.style.cursor = "pointer", e.style.userSelect = "none");
	} catch (e) {
		console.debug?.(e);
	}
	try {
		E.out.title = C("tooltip.resetGamma", "Reset Gamma to 1.00"), E.out.style.cursor = "pointer", E.out.style.userSelect = "none";
	} catch (e) {
		console.debug?.(e);
	}
	let he = y({
		key: "analysis",
		label: "Analysis",
		accentRgb: D.analysis
	});
	he.appendChild(N.b), he.appendChild(ee.b), he.appendChild(P), f.body.appendChild(he);
	let ge = y({
		key: "overlay-guides",
		label: "Guides",
		accentRgb: D.overlay
	});
	ge.appendChild(te.b), ge.appendChild(F), ge.appendChild(ne.b), ge.appendChild(re), ge.appendChild(ie.wrap), p.body.appendChild(ge);
	let _e = y({
		key: "overlay-inspect",
		label: "Inspect",
		accentRgb: D.overlay
	});
	[
		ae.b,
		oe.b,
		se.b,
		ce.b,
		le.b
	].forEach((e, t) => {
		t > 0 && (e.style.marginLeft = "4px"), _e.appendChild(e);
	}), m.body.appendChild(_e);
	let W = y({
		key: "compare",
		label: "Compare",
		accentRgb: D.compare
	});
	W.style.borderRadius = "8px", W.style.padding = "4px 6px", W.style.border = "1px solid transparent", W.style.transition = "background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease", W.appendChild(I), p.body.appendChild(W);
	let G = y({
		key: "audio-viz",
		label: "Audio Viz",
		accentRgb: D.audioviz
	});
	G.appendChild(L), p.body.appendChild(G), _.appendChild(ue), _.appendChild(de), _.appendChild(z);
	let K = document.createElement("div");
	K.className = "mjr-viewer-tools-group mjr-viewer-tools-group--3d", K.textContent = "LMB rotate | RMB pan | Scroll zoom", K.style.cssText = [
		"display:none",
		"align-items:center",
		"padding:2px 8px",
		"border-radius:999px",
		"border:1px solid rgba(255,255,255,0.12)",
		"background:rgba(255,255,255,0.06)",
		"color:rgba(255,255,255,0.55)",
		"font-size:10px",
		"font-weight:400",
		"letter-spacing:0.01em"
	].join(";"), v.appendChild(K);
	let ve = document.createElement("div");
	ve.style.cssText = "position: relative; display:inline-flex; align-items:center;", ve.className = "mjr-viewer-tools-action", ve.style.marginLeft = "4px";
	let ye = document.createElement("button");
	ye.type = "button", ye.title = C("tooltip.viewerShortcuts", "Viewer shortcuts"), ye.setAttribute("aria-label", C("tooltip.viewerShortcuts", "Viewer shortcuts")), ye.style.cssText = "\n        height: 24px;\n        padding: 0 8px;\n        border-radius: 6px;\n        border: 1px solid rgba(255,255,255,0.14);\n        background: rgba(255,255,255,0.08);\n        color: rgba(255,255,255,0.92);\n        cursor: pointer;\n        display: inline-flex;\n        align-items: center;\n        justify-content: center;\n    ";
	let q = document.createElement("span");
	q.className = "pi pi-question-circle", q.setAttribute("aria-hidden", "true"), q.style.fontSize = "14px", ye.appendChild(q);
	let be = document.createElement("div");
	be.className = "mjr-viewer-help", be.style.cssText = "\n        position: absolute;\n        right: 0;\n        top: 32px;\n        min-width: 260px;\n        max-width: 360px;\n        padding: 10px 12px;\n        border-radius: 8px;\n        background: rgba(0,0,0,0.88);\n        border: 1px solid rgba(255,255,255,0.16);\n        color: rgba(255,255,255,0.92);\n        font-size: 12px;\n        line-height: 1.4;\n        box-shadow: 0 8px 24px rgba(0,0,0,0.35);\n        display: none;\n        z-index: 10002;\n    ";
	try {
		let e = document.createElement("div");
		e.textContent = "Shortcuts", e.style.cssText = "font-weight:600; margin-bottom:6px;";
		let t = document.createElement("div");
		t.style.cssText = "display:grid; grid-template-columns: 1fr 1fr; gap: 4px 10px;";
		let n = (e, n) => {
			let r = document.createElement("div"), i = document.createElement("span");
			i.style.cssText = "opacity:.75;", i.textContent = String(e || ""), r.appendChild(i), r.appendChild(document.createTextNode(` ${String(n || "")}`)), t.appendChild(r);
		};
		n("Esc", "Close"), n("Space", "Play/Pause"), n("+", "Zoom In"), n("-", "Zoom Out"), n("Alt+1", "1:1 Zoom"), n("G", "Grid"), n("D", "Gen Info"), n("Z", "Zebra"), n("I", "Probe"), n("L", "Loupe"), n("X", "Focus Mode"), n("C", "Copy Color"), n("[ / ]", "Speed -/+"), n("\\", "Speed 1x"), n("< / >", "Prev/Next"), n("0-5", "Rating"), be.appendChild(e), be.appendChild(t);
	} catch (e) {
		console.debug?.(e);
	}
	return ve.appendChild(ye), ve.appendChild(be), v.appendChild(ve), h.body.appendChild(_), g.body.appendChild(v), u.appendChild(f.panel), u.appendChild(p.panel), u.appendChild(m.panel), u.appendChild(h.panel), u.appendChild(g.panel), l.appendChild(u), {
		toolsRow: l,
		gradePanel: f,
		overlayPanel: p,
		inspectPanel: m,
		actionPanel: h,
		infoPanel: g,
		toolsActions: _,
		toolsMeta: v,
		chGroup: B,
		expGroup: V,
		gamGroup: H,
		anaGroup: he,
		ovGuidesGroup: ge,
		ovInspectGroup: _e,
		cmpGroup: W,
		audGroup: G,
		model3dHint: K,
		helpWrap: ve,
		helpBtn: ye,
		helpPop: be,
		channelsSelect: w,
		exposureCtl: T,
		gammaCtl: E,
		zebraToggle: N,
		scopesToggle: ee,
		scopesSelect: P,
		gridToggle: te,
		gridModeSelect: F,
		maskToggle: ne,
		formatSelect: re,
		maskOpacityCtl: ie,
		probeToggle: ae,
		loupeToggle: oe,
		hudToggle: se,
		focusToggle: ce,
		genInfoToggle: le,
		compareModeSelect: I,
		audioVizModeSelect: L,
		resetGradeBtn: ue,
		exportBtn: de,
		copyBtn: z,
		resetExposure: pe,
		resetGamma: U,
		resetViewerTools: me,
		ACCENT: D,
		setSelectHighlighted: k,
		setChannelSelectStyle: A,
		setValueHighlighted: j,
		setGroupHighlighted: M,
		DEFAULT_TOOL_STATE: c
	};
}
//#endregion
//#region ui/features/viewer/toolbarActions.ts
function Bn({ unsubs: e, state: t, VIEWER_MODES: n, onMode: r, onClose: i, onToolsChanged: a, onCompareModeChanged: o, onAudioVizModeChanged: s, onExportFrame: c, onCopyFrame: l, singleBtn: u, abBtn: d, sideBtn: f, closeBtn: p, channelsSelect: m, compareModeSelect: h, audioVizModeSelect: g, exposureCtl: _, gammaCtl: v, zebraToggle: y, scopesToggle: b, scopesSelect: x, gridToggle: S, gridModeSelect: C, maskToggle: w, formatSelect: T, maskOpacityCtl: E, probeToggle: D, loupeToggle: O, hudToggle: k, focusToggle: A, genInfoToggle: j, resetGradeBtn: M, exportBtn: N, copyBtn: ee, resetExposure: P, resetGamma: te, resetViewerTools: F, expGroup: ne, gamGroup: re }) {
	e.push(Z(u, "click", () => r?.(n.SINGLE))), e.push(Z(d, "click", () => r?.(n.AB_COMPARE))), e.push(Z(f, "click", () => r?.(n.SIDE_BY_SIDE))), e.push(Z(p, "click", () => i?.())), e.push(Z(m, "change", () => {
		try {
			t.channel = String(m.value || "rgb");
		} catch (e) {
			console.debug?.(e);
		}
		X(a);
	})), e.push(Z(h, "change", () => {
		try {
			t.abCompareMode = String(h.value || "wipe");
		} catch (e) {
			console.debug?.(e);
		}
		X(o), X(a);
	})), e.push(Z(g, "change", () => {
		try {
			t.audioVisualizerMode = String(g.value || "artistic");
		} catch (e) {
			console.debug?.(e);
		}
		X(s), X(a);
	})), e.push(Z(_.input, "input", () => {
		let e = Math.max(-10, Math.min(10, Number(_.input.value) || 0));
		t.exposureEV = Math.round(e * 10) / 10;
		try {
			_.out.textContent = `${t.exposureEV.toFixed(1)}EV`;
		} catch (e) {
			console.debug?.(e);
		}
		X(a);
	})), e.push(Z(_.input, "dblclick", P)), e.push(Z(_.out, "click", P)), e.push(Z(ne.querySelector?.(".mjr-viewer-tools-group-label"), "click", P)), e.push(Z(v.input, "input", () => {
		let e = Math.max(.1, Math.min(3, Number(v.input.value) || 1));
		t.gamma = Math.round(e * 100) / 100;
		try {
			v.out.textContent = t.gamma.toFixed(2);
		} catch (e) {
			console.debug?.(e);
		}
		X(a);
	})), e.push(Z(v.input, "dblclick", te)), e.push(Z(v.out, "click", te)), e.push(Z(re.querySelector?.(".mjr-viewer-tools-group-label"), "click", te)), e.push(Z(y.b, "click", () => {
		t.analysisMode = t.analysisMode === "zebra" ? "none" : "zebra", X(a);
	})), e.push(Z(b.b, "click", () => {
		try {
			let e = String(t.scopesMode || "off") === "off" ? "both" : "off";
			t.scopesMode = e;
			try {
				x.value = String(e);
			} catch (e) {
				console.debug?.(e);
			}
		} catch (e) {
			console.debug?.(e);
		}
		X(a);
	})), e.push(Z(x, "change", () => {
		try {
			t.scopesMode = String(x.value || "off");
		} catch {
			try {
				t.scopesMode = "off";
			} catch (e) {
				console.debug?.(e);
			}
		}
		X(a);
	})), e.push(Z(S.b, "click", () => {
		t.gridMode = +!Number(t.gridMode), X(a);
	})), e.push(Z(C, "change", () => {
		try {
			let e = Number(C.value);
			t.gridMode = Number.isFinite(e) ? e : 0;
		} catch {
			try {
				t.gridMode = 0;
			} catch (e) {
				console.debug?.(e);
			}
		}
		X(a);
	})), e.push(Z(w.b, "click", () => {
		try {
			t.overlayMaskEnabled = !t.overlayMaskEnabled;
		} catch (e) {
			console.debug?.(e);
		}
		X(a);
	})), e.push(Z(T, "change", () => {
		try {
			t.overlayFormat = String(T.value || "image");
		} catch {
			try {
				t.overlayFormat = "image";
			} catch (e) {
				console.debug?.(e);
			}
		}
		X(a);
	})), e.push(Z(E.input, "input", () => {
		try {
			let e = Number(E.input.value);
			t.overlayMaskOpacity = Math.round(Math.max(0, Math.min(.9, Number.isFinite(e) ? e : .65)) * 100) / 100, E.out.textContent = t.overlayMaskOpacity.toFixed(2);
		} catch (e) {
			console.debug?.(e);
		}
		X(a);
	})), e.push(Z(D.b, "click", () => {
		t.probeEnabled = !t.probeEnabled, X(a);
	})), e.push(Z(O.b, "click", () => {
		t.loupeEnabled = !t.loupeEnabled, X(a);
	})), e.push(Z(k.b, "click", () => {
		t.hudEnabled = !t.hudEnabled, X(a);
	})), e.push(Z(A.b, "click", () => {
		t.distractionFree = !t.distractionFree, X(a);
	})), e.push(Z(j.b, "click", () => {
		try {
			t.genInfoOpen = !t.genInfoOpen;
		} catch (e) {
			console.debug?.(e);
		}
		X(a);
	})), e.push(Z(M, "click", () => {
		F();
	})), e.push(Z(N, "click", () => {
		try {
			c?.();
		} catch (e) {
			console.debug?.(e);
		}
	})), e.push(Z(ee, "click", () => {
		try {
			l?.();
		} catch (e) {
			console.debug?.(e);
		}
	}));
}
function Vn({ state: e, VIEWER_MODES: t, getCanAB: n, header: r, toolsRow: i, chGroup: a, expGroup: o, gamGroup: s, anaGroup: c, gradePanel: l, overlayPanel: u, inspectPanel: d, infoPanel: f, actionPanel: p, ovGuidesGroup: m, ovInspectGroup: h, model3dHint: g, helpWrap: _, channelsSelect: v, compareModeSelect: y, audioVizModeSelect: b, exposureCtl: x, gammaCtl: S, zebraToggle: C, scopesToggle: w, scopesSelect: T, gridToggle: E, gridModeSelect: D, maskToggle: O, formatSelect: k, maskOpacityCtl: A, probeToggle: j, loupeToggle: M, hudToggle: N, focusToggle: ee, genInfoToggle: P, exportBtn: te, copyBtn: F, resetGradeBtn: ne, cmpGroup: re, audGroup: ie, ACCENT: ae, setSelectHighlighted: oe, setChannelSelectStyle: se, setValueHighlighted: ce, setGroupHighlighted: le }) {
	let I = e?.assets?.[e?.currentIndex] || null, L = String(I?.kind || "").toLowerCase() === "model3d";
	try {
		let e = L ? "none" : "";
		a.style.display = e, o.style.display = e, s.style.display = e, c.style.display = e, ne.style.display = e, g.style.display = L ? "inline-flex" : "none", l.panel.style.display = L ? "none" : "", u.panel.style.display = L ? "none" : "", f.panel.style.display = "", p.panel.style.display = "";
		let t = h.querySelector?.(".mjr-viewer-tools-group-label");
		if (L) {
			m.style.display = "none", h.style.display = "", t && (t.style.display = "none"), _.style.display = "none", r.style.padding = "10px 16px", r.style.gap = "6px", i.style.padding = "6px 8px 6px";
			for (let e of [
				E.b,
				D,
				O.b,
				k,
				A.wrap,
				j.b,
				M.b,
				N.b
			]) try {
				e.style.display = "none";
			} catch {}
		} else {
			m.style.display = "", h.style.display = "", t && (t.style.display = ""), _.style.display = "", l.panel.style.display = "", u.panel.style.display = "", f.panel.style.display = "", p.panel.style.display = "", r.style.padding = "8px 16px", r.style.gap = "6px", i.style.padding = "8px 8px 6px";
			for (let e of [
				E.b,
				D,
				O.b,
				k,
				A.wrap,
				j.b,
				M.b,
				N.b
			]) try {
				e.style.display = "";
			} catch {}
		}
	} catch (e) {
		console.debug?.(e);
	}
	try {
		v.value = String(e.channel || "rgb");
	} catch (e) {
		console.debug?.(e);
	}
	try {
		y.value = String(e.abCompareMode || "wipe");
		let r = typeof n == "function" ? !!n() : !1, i = e.mode === t.AB_COMPARE && r, a = e.mode === t.SIDE_BY_SIDE, o = i || a;
		y.disabled = !i;
		try {
			re.dataset.active = o ? "1" : "0", re.style.display = o ? "" : "none", le(re, {
				accentRgb: ae.compare,
				active: o
			}), re.title = o ? "Compare tools (active)" : "Compare tools";
		} catch (e) {
			console.debug?.(e);
		}
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let t = String(I?.kind || "") === "audio";
		ie.style.display = t ? "" : "none", b.disabled = !t, b.value = String(e.audioVisualizerMode || "artistic");
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let t = Math.round((Number(e.exposureEV) || 0) * 10) / 10;
		x.input.value = String(t), x.out.textContent = `${t.toFixed(1)}EV`;
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let t = Math.max(.1, Math.min(3, Number(e.gamma) || 1));
		S.input.value = String(t), S.out.textContent = t.toFixed(2);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		C.setActive(e.analysisMode === "zebra");
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let t = String(e.scopesMode || "off");
		w.setActive(t !== "off"), T.value = t;
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let e = String(I?.kind || ""), t = e === "video" || e === "model3d";
		te.style.display = t ? "" : "none", F.style.display = t ? "" : "none";
		let n = !!(globalThis?.ClipboardItem && navigator?.clipboard?.write);
		F.style.display = t && n ? "" : "none";
	} catch (e) {
		console.debug?.(e);
	}
	try {
		E.setActive((Number(e.gridMode) || 0) !== 0);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		D.value = String(Number(e.gridMode) || 0);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		O.setActive(!!e.overlayMaskEnabled), k.value = String(e.overlayFormat || "image"), A.input.value = String(Number(e.overlayMaskOpacity ?? .65)), A.out.textContent = Number(e.overlayMaskOpacity ?? .65).toFixed(2);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		j.setActive(!!e.probeEnabled), M.setActive(!!e.loupeEnabled);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		N.setActive(!!e.hudEnabled);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		ee.setActive(!!e.distractionFree);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		P.setActive(!!e.genInfoOpen);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		se(String(e.channel || "rgb"));
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let t = Math.round((Number(e.exposureEV) || 0) * 10) / 10;
		ce(x.out, {
			accentRgb: ae.exposure,
			active: Math.abs(t) > 1e-4
		});
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let t = Math.round((Number(e.gamma) || 1) * 100) / 100;
		ce(S.out, {
			accentRgb: ae.gamma,
			active: Math.abs(t - 1) > 1e-4
		});
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let t = String(e.scopesMode || "off");
		oe(T, {
			accentRgb: ae.analysis,
			active: t !== "off",
			title: t === "off" ? "Scopes" : "Scopes (active)"
		});
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let t = Number(e.gridMode) || 0;
		oe(D, {
			accentRgb: ae.overlay,
			active: t !== 0,
			title: t === 0 ? "Grid Overlay" : "Grid Overlay (active)"
		});
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let t = String(e.overlayFormat || "image");
		oe(k, {
			accentRgb: ae.overlay,
			active: t !== "image",
			title: t === "image" ? "Format" : "Format (active)"
		});
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let r = typeof n == "function" ? !!n() : !1, i = e.mode === t.AB_COMPARE && r, a = String(e.abCompareMode || "wipe");
		oe(y, {
			accentRgb: ae.compare,
			active: i && a !== "wipe",
			title: i && a !== "wipe" ? "Compare Mode (modified)" : "A/B Compare Mode"
		});
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let t = String(I?.kind || "") === "audio", n = String(e.audioVisualizerMode || "artistic");
		oe(b, {
			accentRgb: ae.audioviz,
			active: t && n !== "simple",
			title: "Audio visualizer mode"
		});
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let t = !!e.genInfoOpen, n = P?.b;
		n && t && (n.style.borderColor = `rgba(${ae.geninfo},0.55)`, n.style.background = `rgba(${ae.geninfo},0.14)`);
	} catch (e) {
		console.debug?.(e);
	}
}
function Hn({ state: e, VIEWER_MODES: t, singleBtn: n, abBtn: r, sideBtn: i, canAB: a, canSide: o }) {
	try {
		let s = !!a?.(), c = !!o?.();
		r.disabled = !s, i.disabled = !c, r.style.opacity = r.disabled ? "0.35" : e.mode === t.AB_COMPARE ? "1" : "0.6", i.style.opacity = i.disabled ? "0.35" : e.mode === t.SIDE_BY_SIDE ? "1" : "0.6", n.style.opacity = e.mode === t.SINGLE ? "1" : "0.6", n.style.fontWeight = e.mode === t.SINGLE ? "600" : "400";
		try {
			n.setAttribute("aria-pressed", e.mode === t.SINGLE ? "true" : "false"), r.setAttribute("aria-pressed", e.mode === t.AB_COMPARE ? "true" : "false"), i.setAttribute("aria-pressed", e.mode === t.SIDE_BY_SIDE ? "true" : "false");
		} catch (e) {
			console.debug?.(e);
		}
	} catch (e) {
		console.debug?.(e);
	}
}
//#endregion
//#region ui/features/viewer/toolbar.ts
function Un({ VIEWER_MODES: e, state: t, lifecycle: n, onClose: r, _onZoomIn: i, _onZoomOut: a, _onZoomReset: o, _onZoomOneToOne: s, onMode: c, onToolsChanged: l, onCompareModeChanged: u, onExportFrame: d, onCopyFrame: f, onAudioVizModeChanged: p, onToggleFullscreen: m, getCanAB: h } = {}) {
	let g = n?.unsubs || [], _ = document.createElement("div");
	_.className = "mjr-viewer-header", _.style.cssText = "\n        display: flex;\n        flex-direction: column;\n        gap: 6px;\n        padding: 8px 16px;\n        background: linear-gradient(170deg, rgba(24, 27, 33, 0.96), rgba(17, 19, 25, 0.97));\n        border-bottom: 0.8px solid rgba(196, 202, 210, 0.2);\n        color: white;\n        box-sizing: border-box;\n    ";
	let v = document.createElement("div");
	v.className = "mjr-viewer-header-top", v.style.cssText = "\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        gap: 12px;\n        position: relative;\n        padding-right: 84px;\n        padding-left: 12px;\n        min-width: 0;\n        box-sizing: border-box;\n    ";
	let y = document.createElement("div");
	y.className = "mjr-viewer-header-meta mjr-viewer-header-meta--left", y.style.cssText = "display:flex; align-items:center; gap:10px; min-width:0; overflow:hidden;";
	let b = document.createElement("div");
	b.className = "mjr-viewer-title-line", b.style.cssText = "display:flex; align-items:center; justify-content:center; gap:8px; min-width:0; flex-wrap:nowrap; overflow:hidden;";
	let x = document.createElement("div");
	x.className = "mjr-viewer-title-wrap", x.style.cssText = "display:flex; align-items:center; justify-content:center; gap:12px; min-width:0; max-width:min(100%, calc(100vw - 220px)); text-align:center;";
	let S = document.createElement("span");
	S.className = "mjr-viewer-filename", S.style.cssText = "font-size: 13px; font-weight: 600; min-width:0; max-width:min(60vw, 820px); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-align:center;";
	let w = document.createElement("div");
	w.className = "mjr-viewer-badges", w.style.cssText = "display:flex; gap:6px; align-items:center; flex-wrap:nowrap; min-width:0;";
	let T = document.createElement("div");
	T.className = "mjr-viewer-header-meta mjr-viewer-header-meta--right", T.style.cssText = "display:none; align-items:center; gap:10px; min-width:0; justify-content:flex-end; overflow:hidden;";
	let E = document.createElement("span");
	E.className = "mjr-viewer-filename mjr-viewer-filename--right", E.style.cssText = "font-size: 14px; font-weight: 500; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-align:right;";
	let D = document.createElement("div");
	D.className = "mjr-viewer-badges mjr-viewer-badges--right", D.style.cssText = "display:flex; gap:8px; align-items:center; flex-wrap:wrap; justify-content:flex-end;", b.appendChild(S), b.appendChild(w), x.appendChild(b), T.appendChild(D), T.appendChild(E);
	let O = document.createElement("div");
	O.className = "mjr-viewer-mode-buttons", O.style.cssText = "display: flex; gap: 4px;";
	let k = Rn("Single", e.SINGLE);
	k.title = C("tooltip.singleViewMode", "Single view mode (one image)");
	let A = Rn("A/B", e.AB_COMPARE);
	A.title = C("tooltip.compareOverlayMode", "A/B compare mode (overlay)");
	let j = Rn("Side", e.SIDE_BY_SIDE);
	j.title = C("tooltip.compareSideBySide", "Side-by-side comparison mode"), O.appendChild(k), O.appendChild(A), O.appendChild(j);
	let M = Ln("X", "Close (Esc)");
	M.style.fontSize = "18px";
	try {
		M.classList.add("mjr-viewer-close"), M.textContent = "";
		let e = document.createElement("span");
		e.className = "pi pi-times", e.setAttribute("aria-hidden", "true"), M.appendChild(e);
	} catch (e) {
		console.debug?.(e);
	}
	let N = Ln("[ ]", "Toggle Fullscreen (F)");
	try {
		N.classList.add("mjr-viewer-fs");
	} catch (e) {
		console.debug?.(e);
	}
	N.style.fontSize = "16px";
	try {
		N.style.position = "absolute", N.style.top = "8px", N.style.left = "", N.style.right = "48px", N.style.zIndex = "10002", N.style.width = "34px", N.style.height = "34px", N.style.padding = "0", N.style.display = "inline-flex", N.style.alignItems = "center", N.style.justifyContent = "center", N.style.borderRadius = "8px";
		let e = document.createElement("span");
		e.className = "pi pi-window-maximize", e.setAttribute("aria-hidden", "true"), N.textContent = "", N.appendChild(e);
		let t = () => {
			try {
				let t = document.fullscreenElement != null;
				e.className = t ? "pi pi-window-minimize" : "pi pi-window-maximize", N.title = t ? "Exit Fullscreen (F)" : "Enter Fullscreen (F)";
			} catch (e) {
				console.debug?.(e);
			}
		};
		if (N.onclick = (e) => {
			e.stopPropagation(), m?.();
		}, n?.safeAddListener) n.safeAddListener(document, "fullscreenchange", t);
		else try {
			document.addEventListener("fullscreenchange", t);
			let e = () => {
				try {
					document.removeEventListener("fullscreenchange", t);
				} catch (e) {
					console.debug?.(e);
				}
			};
			_._mjrCleanup ? _._mjrCleanup.push(e) : _._mjrCleanup = [e];
		} catch (e) {
			console.debug?.(e);
		}
		t();
	} catch (e) {
		console.debug?.(e);
	}
	let ee = document.createElement("div");
	ee.className = "mjr-viewer-header-area mjr-viewer-header-area--left", ee.style.cssText = "display:none; align-items:center; gap:12px; min-width:0; flex:1 1 0; overflow:hidden;", ee.appendChild(y);
	let P = document.createElement("div");
	P.className = "mjr-viewer-header-area mjr-viewer-header-area--center", P.style.cssText = "display:flex; align-items:center; justify-content:center; gap:12px; flex:1 1 auto; min-width:0;", x.appendChild(O), P.appendChild(x);
	let te = document.createElement("div");
	te.className = "mjr-viewer-header-area mjr-viewer-header-area--right", te.style.cssText = "display:none; align-items:center; justify-content:flex-end; gap:12px; min-width:0; flex:1 1 0; overflow:hidden;", te.appendChild(T), v.appendChild(ee), v.appendChild(P), v.appendChild(te);
	try {
		M.style.position = "absolute", M.style.top = "8px", M.style.left = "", M.style.right = "8px", M.style.transform = "", M.style.zIndex = "10002", M.style.width = "34px", M.style.height = "34px", M.style.padding = "0", M.style.display = "inline-flex", M.style.alignItems = "center", M.style.justifyContent = "center", M.style.borderRadius = "8px";
	} catch (e) {
		console.debug?.(e);
	}
	_.appendChild(v), _.appendChild(N), _.appendChild(M);
	let { toolsRow: F, gradePanel: ne, overlayPanel: re, inspectPanel: ie, actionPanel: ae, infoPanel: oe, toolsActions: se, toolsMeta: ce, chGroup: le, expGroup: I, gamGroup: L, anaGroup: ue, ovGuidesGroup: de, ovInspectGroup: R, cmpGroup: z, audGroup: fe, model3dHint: B, helpWrap: V, helpBtn: H, helpPop: pe, channelsSelect: U, exposureCtl: me, gammaCtl: he, zebraToggle: ge, scopesToggle: _e, scopesSelect: W, gridToggle: G, gridModeSelect: K, maskToggle: ve, formatSelect: ye, maskOpacityCtl: q, probeToggle: be, loupeToggle: xe, hudToggle: Se, focusToggle: Ce, genInfoToggle: we, compareModeSelect: Te, audioVizModeSelect: Ee, resetGradeBtn: De, exportBtn: Oe, copyBtn: ke, resetExposure: Ae, resetGamma: je, resetViewerTools: Me, ACCENT: Ne, setSelectHighlighted: Pe, setChannelSelectStyle: Fe, setValueHighlighted: Ie, setGroupHighlighted: J } = zn({
		VIEWER_MODES: e,
		state: t,
		onToolsChanged: l,
		onCompareModeChanged: u,
		onExportFrame: d,
		onCopyFrame: f,
		onAudioVizModeChanged: p,
		getCanAB: h
	});
	_.appendChild(F), Bn({
		unsubs: g,
		state: t,
		VIEWER_MODES: e,
		onMode: c,
		onClose: r,
		onToolsChanged: l,
		onCompareModeChanged: u,
		onAudioVizModeChanged: p,
		onExportFrame: d,
		onCopyFrame: f,
		singleBtn: k,
		abBtn: A,
		sideBtn: j,
		closeBtn: M,
		channelsSelect: U,
		compareModeSelect: Te,
		audioVizModeSelect: Ee,
		exposureCtl: me,
		gammaCtl: he,
		zebraToggle: ge,
		scopesToggle: _e,
		scopesSelect: W,
		gridToggle: G,
		gridModeSelect: K,
		maskToggle: ve,
		formatSelect: ye,
		maskOpacityCtl: q,
		probeToggle: be,
		loupeToggle: xe,
		hudToggle: Se,
		focusToggle: Ce,
		genInfoToggle: we,
		resetGradeBtn: De,
		exportBtn: Oe,
		copyBtn: ke,
		resetExposure: Ae,
		resetGamma: je,
		resetViewerTools: Me,
		expGroup: I,
		gamGroup: L
	});
	let Le = () => Vn({
		state: t,
		VIEWER_MODES: e,
		getCanAB: h,
		header: _,
		toolsRow: F,
		chGroup: le,
		expGroup: I,
		gamGroup: L,
		anaGroup: ue,
		gradePanel: ne,
		overlayPanel: re,
		inspectPanel: ie,
		infoPanel: oe,
		actionPanel: ae,
		ovGuidesGroup: de,
		ovInspectGroup: R,
		model3dHint: B,
		helpWrap: V,
		channelsSelect: U,
		compareModeSelect: Te,
		audioVizModeSelect: Ee,
		exposureCtl: me,
		gammaCtl: he,
		zebraToggle: ge,
		scopesToggle: _e,
		scopesSelect: W,
		gridToggle: G,
		gridModeSelect: K,
		maskToggle: ve,
		formatSelect: ye,
		maskOpacityCtl: q,
		probeToggle: be,
		loupeToggle: xe,
		hudToggle: Se,
		focusToggle: Ce,
		genInfoToggle: we,
		exportBtn: Oe,
		copyBtn: ke,
		resetGradeBtn: De,
		cmpGroup: z,
		audGroup: fe,
		ACCENT: Ne,
		setSelectHighlighted: Pe,
		setChannelSelectStyle: Fe,
		setValueHighlighted: Ie,
		setGroupHighlighted: J
	}), Re = ({ canAB: n, canSide: r } = {}) => Hn({
		state: t,
		VIEWER_MODES: e,
		singleBtn: k,
		abBtn: A,
		sideBtn: j,
		canAB: n,
		canSide: r
	});
	try {
		let e = null, t = () => {
			try {
				e?.abort?.();
			} catch (e) {
				console.debug?.(e);
			}
			e = null;
			try {
				pe.style.display = "none";
			} catch (e) {
				console.debug?.(e);
			}
		}, n = () => {
			t(), e = new AbortController();
			try {
				pe.style.display = "";
			} catch (e) {
				console.debug?.(e);
			}
			try {
				document.addEventListener("mousedown", (e) => {
					V.contains(e.target) || t();
				}, {
					capture: !0,
					signal: e.signal
				}), document.addEventListener("keydown", (e) => {
					e.key === "Escape" && t();
				}, {
					capture: !0,
					signal: e.signal
				}), document.addEventListener("scroll", t, {
					capture: !0,
					passive: !0,
					signal: e.signal
				});
			} catch (e) {
				console.debug?.(e);
			}
		};
		g.push(() => t()), g.push(Z(H, "click", () => {
			pe.style.display === "none" ? n() : t();
		}));
	} catch (e) {
		console.debug?.(e);
	}
	return {
		headerEl: _,
		headerTopEl: v,
		filenameEl: S,
		badgesBarEl: w,
		filenameRightEl: E,
		badgesBarRightEl: D,
		leftAreaEl: ee,
		leftMetaEl: y,
		centerAreaEl: P,
		rightMetaEl: T,
		rightAreaEl: te,
		titleLineEl: b,
		titleWrapEl: x,
		modeButtonsEl: O,
		syncToolsUIFromState: Le,
		syncModeButtons: Re
	};
}
//#endregion
//#region ui/features/viewer/keyboard.ts
function Wn(e) {
	if (!e) return null;
	try {
		if (typeof e.prompt == "string" && e.prompt.trim()) return e.prompt.trim();
		if (e.geninfo) {
			let t = e.geninfo;
			if (typeof t.prompt == "string" && t.prompt.trim()) return t.prompt.trim();
			if (typeof t.positive_prompt == "string" && t.positive_prompt.trim()) {
				let e = t.positive_prompt.trim();
				return typeof t.negative_prompt == "string" && t.negative_prompt.trim() && (e += "\n\nNegative prompt: " + t.negative_prompt.trim()), e;
			}
		}
		let t = e.metadata_raw;
		if (t && typeof t == "object") {
			if (typeof t.prompt == "string" && t.prompt.trim()) return t.prompt.trim();
			let e = t.geninfo || t.GenInfo || t.generation;
			if (e && typeof e == "object") {
				if (typeof e.prompt == "string" && e.prompt.trim()) return e.prompt.trim();
				if (typeof e.positive_prompt == "string" && e.positive_prompt.trim()) {
					let t = e.positive_prompt.trim();
					return typeof e.negative_prompt == "string" && e.negative_prompt.trim() && (t += "\n\nNegative prompt: " + e.negative_prompt.trim()), t;
				}
			}
		}
		if (typeof t == "string" && t.includes("Negative prompt:")) return t.trim();
	} catch (e) {
		console.debug?.(e);
	}
	return null;
}
function Gn({ overlay: e, _content: t, singleView: r, state: i, VIEWER_MODES: a, computeOneToOneZoom: o, setZoom: s, scheduleOverlayRedraw: c, scheduleApplyGrade: l, syncToolsUIFromState: u, applyDistractionFreeUI: d, navigateViewerAssets: p, closeViewer: m, renderBadges: h, updateAssetRating: g, safeDispatchCustomEvent: _, ASSET_RATING_CHANGED_EVENT: v, probeTooltip: y, loupeWrap: b, getVideoControls: x, lifecycle: S, renderGenInfoPanel: T } = {}) {
	let E = S?.unsubs || [], D = null, O = null, k = () => {
		try {
			D && clearTimeout(D);
		} catch (e) {
			console.debug?.(e);
		}
		D = null, O = null;
	}, A = (e, t) => {
		k(), O = {
			assetId: e,
			rating: t
		}, D = setTimeout(async () => {
			let e = O;
			if (D = null, O = null, e?.assetId) try {
				let t = await g?.(e.assetId, e.rating);
				if (!t?.ok) {
					n(t?.error || C("toast.ratingUpdateFailed"), "error");
					return;
				}
				n(C("toast.ratingSetN", { n: e.rating }), "success", 1500), _?.(v, {
					assetId: String(e.assetId),
					rating: e.rating
				}, { warnPrefix: "[Viewer]" });
			} catch {
				n(C("toast.ratingUpdateError"), "error");
			}
		}, 300);
	}, j = () => {
		try {
			document.fullscreenElement ? document?.exitFullscreen?.() : e?.requestFullscreen?.();
		} catch (e) {
			console.debug?.(e);
		}
	}, M = (t) => {
		let g = () => {
			try {
				t.preventDefault(), t.stopPropagation(), t.stopImmediatePropagation?.();
			} catch (e) {
				console.debug?.(e);
			}
		}, v = i?.mode === a?.SINGLE, S = i?.assets?.[i?.currentIndex], E = () => {
			try {
				return !!t?.target?.closest?.(".mjr-viewer-playerbar");
			} catch {
				return !1;
			}
		}, D = () => {
			let e = String(t?.key || "");
			return e === " " || e === "Spacebar" || e === "ArrowLeft" || e === "ArrowRight" || e === "Home" || e === "End" || e === "[" || e === "{" || e === "]" || e === "}" || e === "\\" || e === "|" || e === "i" || e === "I" || e === "o" || e === "O";
		};
		if (f()) return;
		try {
			if (e?.style?.display === "none") return;
		} catch (e) {
			console.debug?.(e);
		}
		try {
			let e = t?.target;
			if (e && (e.tagName === "INPUT" || e.tagName === "TEXTAREA" || e.isContentEditable) && !(v && S?.kind === "video" && E() && D())) {
				if (t.key === "f" || t.key === "F") {
					g(), j();
					return;
				}
				t.key === "Escape" && (g(), Q.tags.open ? fn() : X(m));
				return;
			}
		} catch (e) {
			console.debug?.(e);
		}
		let O = async (e) => {
			if (!v || !S?.id || e !== "0" && e !== "1" && e !== "2" && e !== "3" && e !== "4" && e !== "5") return !1;
			let t = e === "0" ? 0 : Number(e);
			if (!Number.isFinite(t)) return !1;
			try {
				return S.rating = t, X(h), A(S.id, t), !0;
			} catch {
				return !0;
			}
		}, k = () => {
			try {
				return x?.() || null;
			} catch {
				return null;
			}
		}, M = async (e) => {
			if (!v || S?.kind !== "video") return !1;
			try {
				let t = k();
				if (t?.stepFrames) return t.stepFrames(e), !0;
			} catch (e) {
				console.debug?.(e);
			}
			let t = r?.querySelector?.("video");
			if (!t) return !1;
			try {
				t.pause?.();
			} catch (e) {
				console.debug?.(e);
			}
			let n = 1 / 30 * e;
			try {
				let r = Number(t.duration), i = Math.max(0, Math.min(Number.isFinite(r) ? r : Infinity, (t.currentTime || 0) + n));
				t.currentTime = i;
				try {
					t.dispatchEvent?.(new CustomEvent("mjr:frameStep", { detail: {
						direction: e,
						time: i
					} }));
				} catch (e) {
					console.debug?.(e);
				}
				return !0;
			} catch {
				return !0;
			}
		}, N = (e, { absolute: t = !1 } = {}) => {
			try {
				let r = k();
				if (!r) return !1;
				if (t) {
					let t = r.setPlaybackRate?.(e);
					return Number.isFinite(Number(t)) ? (i.playbackRate = Number(t), n(C("toast.playbackRate", "Playback {rate}x", { rate: Number(t).toFixed(2) }), "info", 1200), !0) : !1;
				}
				let a = r.adjustPlaybackRate?.(e);
				return Number.isFinite(Number(a)) ? (i.playbackRate = Number(a), n(C("toast.playbackRate", "Playback {rate}x", { rate: Number(a).toFixed(2) }), "info", 1200), !0) : !1;
			} catch {
				return !1;
			}
		};
		if ((t.ctrlKey || t.metaKey) && (t.key === "c" || t.key === "C")) try {
			let e = Wn(S);
			if (e) {
				g(), navigator.clipboard?.writeText?.(e).then(() => n(C("toast.promptCopied", "Prompt copied to clipboard"), "success", 1500)).catch(() => n(C("toast.copyFailed", "Copy failed"), "error", 1500));
				return;
			}
		} catch (e) {
			console.debug?.(e);
		}
		if (v && !t.altKey && !t.ctrlKey && !t.metaKey && (t.key === "0" || t.key === "1" || t.key === "2" || t.key === "3" || t.key === "4" || t.key === "5")) {
			g(), O(t.key);
			return;
		}
		switch (t.key) {
			case "1": {
				if (!t.altKey) break;
				let e = X(o);
				if (e == null) break;
				g();
				try {
					let t = Math.abs((Number(i?.zoom) || 1) - e) < .01;
					s?.(t ? 1 : e, {
						clientX: i?._lastPointerX,
						clientY: i?._lastPointerY
					});
				} catch (e) {
					console.debug?.(e);
				}
				break;
			}
			case "g":
			case "G":
				g();
				try {
					i.gridMode = ((Number(i.gridMode) || 0) + 1) % 5;
				} catch (e) {
					console.debug?.(e);
				}
				X(c), X(u);
				break;
			case "f":
			case "F":
				g(), j();
				break;
			case "d":
			case "D":
				g();
				try {
					i.genInfoOpen = !i.genInfoOpen;
				} catch (e) {
					console.debug?.(e);
				}
				X(u), X(T);
				break;
			case "t":
			case "T":
				if (!S?.id) break;
				g(), dn({
					x: Number(i?._lastPointerX) || Math.round((e?.clientWidth || 0) / 2),
					y: Number(i?._lastPointerY) || Math.round((e?.clientHeight || 0) / 2),
					asset: S,
					onChanged: ((...e) => {
						let t = e[0];
						S.tags = t, _(w, {
							assetId: String(S.id),
							tags: t
						}, { warnPrefix: "[ViewerKeyboard]" }), X(h);
					})
				});
				break;
			case "z":
			case "Z":
				g();
				try {
					i.analysisMode = i.analysisMode === "zebra" ? "none" : "zebra";
				} catch (e) {
					console.debug?.(e);
				}
				X(u), X(l);
				break;
			case "i":
			case "I":
				if (v && S?.kind === "video" && k()?.setInPoint?.()) {
					g(), n(C("toast.inPointSet", "In point set"), "info", 1200);
					break;
				}
				g();
				try {
					i.probeEnabled = !i.probeEnabled;
				} catch (e) {
					console.debug?.(e);
				}
				try {
					i.probeEnabled || (y.style.display = "none");
				} catch (e) {
					console.debug?.(e);
				}
				X(u);
				break;
			case "o":
			case "O":
				if (v && S?.kind === "video" && k()?.setOutPoint?.()) {
					g(), n(C("toast.outPointSet", "Out point set"), "info", 1200);
					break;
				}
				break;
			case "Home":
				if (v && S?.kind === "video" && k()?.goToIn?.()) {
					g();
					break;
				}
				break;
			case "End":
				if (v && S?.kind === "video" && k()?.goToOut?.()) {
					g();
					break;
				}
				break;
			case "l":
			case "L":
				g();
				try {
					i.loupeEnabled = !i.loupeEnabled;
				} catch (e) {
					console.debug?.(e);
				}
				try {
					i.loupeEnabled || (b.style.display = "none");
				} catch (e) {
					console.debug?.(e);
				}
				X(u);
				break;
			case "x":
			case "X":
				g();
				try {
					i.distractionFree = !i.distractionFree;
				} catch (e) {
					console.debug?.(e);
				}
				X(u), X(d), X(T);
				break;
			case "c":
			case "C": {
				let e = i?._probe;
				if (!e || e.r == null || e.g == null || e.b == null) break;
				let t = `#${[
					e.r,
					e.g,
					e.b
				].map((e) => Math.max(0, Math.min(255, Number(e) || 0)).toString(16).padStart(2, "0")).join("")}`;
				try {
					let e = navigator?.clipboard;
					e?.writeText && (g(), e.writeText(t).catch(() => {}));
				} catch (e) {
					console.debug?.(e);
				}
				break;
			}
			case " ":
			case "Spacebar":
				if (v && S?.kind === "video") {
					let e = r?.querySelector?.("video");
					if (e) {
						g();
						try {
							let e = k();
							if (e?.togglePlay) {
								e.togglePlay();
								break;
							}
						} catch (e) {
							console.debug?.(e);
						}
						try {
							if (e.paused) {
								let t = e.play?.();
								t && typeof t.catch == "function" && t.catch(() => {});
							} else e.pause?.();
						} catch (e) {
							console.debug?.(e);
						}
						break;
					}
				}
				break;
			case "Tab":
				g();
				try {
					e?.contains?.(document.activeElement) || e?.focus?.();
				} catch (e) {
					console.debug?.(e);
				}
				break;
			case "Escape":
				g(), Q.tags.open ? fn() : X(m);
				break;
			case "ArrowLeft":
				if (v && t.target?.closest?.(".mjr-viewer-playerbar")) {
					g(), M(-1);
					break;
				}
				g(), X(() => p?.(-1));
				break;
			case "ArrowRight":
				if (v && t.target?.closest?.(".mjr-viewer-playerbar")) {
					g(), M(1);
					break;
				}
				g(), X(() => p?.(1));
				break;
			case "[":
			case "{":
				g(), N(-.25) || n(C("toast.playbackVideoOnly"), "warning", 1400);
				break;
			case "]":
			case "}":
				g(), N(.25) || n(C("toast.playbackVideoOnly"), "warning", 1400);
				break;
			case "\\":
			case "|":
				g(), N(1, { absolute: !0 }) || n(C("toast.playbackVideoOnly"), "warning", 1400);
				break;
			case "+":
			case "=":
				g();
				try {
					s?.((Number(i?.zoom) || 1) + .25, {
						clientX: i?._lastPointerX,
						clientY: i?._lastPointerY
					});
				} catch (e) {
					console.debug?.(e);
				}
				break;
			case "-":
			case "_":
				g();
				try {
					s?.((Number(i?.zoom) || 1) - .25, {
						clientX: i?._lastPointerX,
						clientY: i?._lastPointerY
					});
				} catch (e) {
					console.debug?.(e);
				}
				break;
		}
	}, N = null, ee = () => {
		try {
			if (N) return;
			N = Z(window, "keydown", M, !0);
		} catch (e) {
			console.debug?.(e);
		}
	}, P = () => {
		try {
			X(N);
		} catch (e) {
			console.debug?.(e);
		}
		N = null;
	};
	return E.push(() => k()), E.push(() => P()), {
		bind: ee,
		unbind: P,
		dispose: () => {
			k(), P();
		}
	};
}
//#endregion
//#region ui/features/viewer/videoSync.ts
var Kn = () => {
	try {
		return !!T?.DEBUG_VIEWER;
	} catch {
		return !1;
	}
};
function qn(e, t, { threshold: n = .15, correctionCooldownMs: r = 250 } = {}) {
	let i = new AbortController();
	try {
		if (!e) return i;
		let a = Array.isArray(t) ? t.filter((t) => t && t !== e) : [];
		if (!a.length) return i;
		let o = [e, ...a].filter(Boolean), s = !1, c = /* @__PURE__ */ new WeakSet(), l = {
			source: null,
			rafId: null,
			rvfcId: null
		}, u = 0, d = () => {
			try {
				let e = l.source;
				l.rvfcId != null && typeof e?.cancelVideoFrameCallback == "function" && e.cancelVideoFrameCallback(l.rvfcId);
			} catch (e) {
				console.debug?.(e);
			}
			l.rvfcId = null;
			try {
				l.rafId != null && typeof cancelAnimationFrame == "function" && cancelAnimationFrame(l.rafId);
			} catch (e) {
				console.debug?.(e);
			}
			l.rafId = null, l.source = null;
		}, f = (e) => {
			try {
				if (e && e.paused === !1) return;
				try {
					c.add(e);
				} catch (e) {
					console.debug?.(e);
				}
				let t = e.play?.();
				t && typeof t.catch == "function" && t.catch(() => {});
			} catch (e) {
				console.debug?.(e);
			}
		}, p = () => {
			try {
				return typeof performance < "u" && typeof performance.now == "function" ? performance.now() : Date.now();
			} catch {
				return Date.now();
			}
		}, m = (e, { force: t = !1 } = {}) => {
			if (!s) try {
				let i = Number(e?.currentTime) || 0, a = e?.paused === !1, c = p(), l = Math.max(0, Number(r) || 0), d = t || !a || !u || c - u >= l, f = !1;
				for (let t of o) if (!(!t || t === e)) try {
					Math.abs((Number(t.currentTime) || 0) - i) > n && d && (s = !0, t.currentTime = i, s = !1, f = !0);
				} catch {
					s = !1;
				}
				a && f && (u = c);
			} catch {
				s = !1;
			}
		}, h = () => {
			let t = l.source || e;
			if (l.rafId = null, l.rvfcId = null, !(!t || i.signal.aborted || t.paused)) {
				m(t);
				try {
					if (typeof t?.requestVideoFrameCallback == "function") {
						l.rvfcId = t.requestVideoFrameCallback(h);
						return;
					}
				} catch (e) {
					console.debug?.(e);
				}
				try {
					typeof requestAnimationFrame == "function" && (l.rafId = requestAnimationFrame(h));
				} catch (e) {
					console.debug?.(e);
				}
			}
		}, g = (t = e) => {
			d(), l.source = t || e, !(!l.source || l.source.paused || i.signal.aborted) && h();
		};
		try {
			i.signal.addEventListener("abort", d, { once: !0 });
		} catch (e) {
			console.debug?.(e);
		}
		let _ = (t = {}) => m(e, t), v = (t, n = e) => {
			if (!s) {
				for (let e of o) if (!(!e || e === n)) try {
					if (t) f(e);
					else {
						try {
							c.add(e);
						} catch (e) {
							console.debug?.(e);
						}
						e.pause?.();
					}
				} catch (e) {
					console.debug?.(e);
				}
			}
		}, y = (t = e) => {
			if (!s) {
				for (let e of o) if (!(!e || e === t)) try {
					e.muted = !!t.muted, e.volume = Number(t.volume) || 0;
				} catch (e) {
					console.debug?.(e);
				}
			}
		}, b = (t = e) => {
			if (!s) {
				for (let e of o) if (!(!e || e === t)) try {
					e.playbackRate = Number(t.playbackRate) || 1;
				} catch (e) {
					console.debug?.(e);
				}
			}
		};
		try {
			for (let e of a) {
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
			y(), b(), _(), e.paused || (v(!0), g(e));
		} catch (e) {
			console.debug?.(e);
		}
		e.addEventListener("play", () => v(!0), {
			signal: i.signal,
			passive: !0
		}), e.addEventListener("play", () => g(e), {
			signal: i.signal,
			passive: !0
		}), e.addEventListener("pause", () => {
			d(), v(!1);
		}, {
			signal: i.signal,
			passive: !0
		}), e.addEventListener("timeupdate", () => _(), {
			signal: i.signal,
			passive: !0
		}), e.addEventListener("seeking", () => _({ force: !0 }), {
			signal: i.signal,
			passive: !0
		}), e.addEventListener("seeked", () => _({ force: !0 }), {
			signal: i.signal,
			passive: !0
		}), e.addEventListener("ended", () => _({ force: !0 }), {
			signal: i.signal,
			passive: !0
		}), e.addEventListener("volumechange", y, {
			signal: i.signal,
			passive: !0
		}), e.addEventListener("ratechange", b, {
			signal: i.signal,
			passive: !0
		});
		for (let t of a) try {
			t.addEventListener("play", () => {
				if (c.has(t)) {
					c.delete(t), g(e);
					return;
				}
				m(t, { force: !0 }), b(t), v(!0, t), g(t);
			}, {
				signal: i.signal,
				passive: !0
			}), t.addEventListener("pause", () => {
				if (c.has(t)) {
					c.delete(t);
					return;
				}
				t?.ended || (d(), v(!1, t));
			}, {
				signal: i.signal,
				passive: !0
			}), t.addEventListener("seeking", () => m(t, { force: !0 }), {
				signal: i.signal,
				passive: !0
			}), t.addEventListener("seeked", () => m(t, { force: !0 }), {
				signal: i.signal,
				passive: !0
			}), t.addEventListener("ratechange", () => b(t), {
				signal: i.signal,
				passive: !0
			});
		} catch (e) {
			console.debug?.(e);
		}
		try {
			for (let t of a) try {
				t.addEventListener("ended", () => {
					if (!s) {
						try {
							s = !0, t.currentTime = Number(e.currentTime) || 0;
						} catch (e) {
							console.debug?.(e);
						} finally {
							s = !1;
						}
						try {
							e.paused || f(t);
						} catch (e) {
							console.debug?.(e);
						}
					}
				}, {
					signal: i.signal,
					passive: !0
				});
			} catch (e) {
				console.debug?.(e);
			}
		} catch (e) {
			console.debug?.(e);
		}
		try {
			for (let e of a) try {
				e.addEventListener("loadedmetadata", () => _({ force: !0 }), {
					signal: i.signal,
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
		if (Kn()) try {
			console.warn("[Viewer] follower video sync setup failed", e);
		} catch (e) {
			console.debug?.(e);
		}
	}
	return i;
}
//#endregion
//#region ui/features/viewer/grid.ts
function Jn({ gridCanvas: e, content: t, state: n, VIEWER_MODES: r, getPrimaryMedia: i, getViewportRect: a, clearCanvas: o } = {}) {
	let s = () => {
		try {
			let e = n?.mode;
			return e === r?.AB_COMPARE ? t?.querySelector?.(".mjr-viewer-ab") || t || null : e === r?.SIDE_BY_SIDE ? t?.querySelector?.(".mjr-viewer-sidebyside") || t || null : t?.querySelector?.(".mjr-viewer-single") || t || null;
		} catch {
			return t || null;
		}
	}, c = (e, i) => {
		try {
			if (!e) return i || null;
			let a = n?.mode;
			if (a === r?.SIDE_BY_SIDE || a === r?.AB_COMPARE) {
				let t = e;
				for (; t && t !== i && t.parentElement;) {
					if (t.parentElement === i) return t;
					t = t.parentElement;
				}
				return i || null;
			}
			return i || t || null;
		} catch {
			return i || t || null;
		}
	}, l = (e) => {
		try {
			let t = e?.dataset?.mjrAssetId;
			if (t == null || t === "") return n?.assets?.[n?.currentIndex] || null;
			let r = Array.isArray(n?.assets) ? n.assets : [];
			for (let e of r) try {
				if (e?.id != null && String(e.id) === String(t)) return e;
			} catch (e) {
				console.debug?.(e);
			}
			return n?.assets?.[n?.currentIndex] || null;
		} catch {
			return n?.assets?.[n?.currentIndex] || null;
		}
	}, u = (e, t = null) => {
		try {
			if (!e) return {
				w: 0,
				h: 0
			};
			if (e instanceof HTMLCanvasElement) {
				let t = Number(e._mjrNaturalW) || Number(e.width) || 0, n = Number(e._mjrNaturalH) || Number(e.height) || 0;
				if (t > 0 && n > 0) return {
					w: t,
					h: n
				};
			}
			let r = Number(e.videoWidth) || Number(e.naturalWidth) || 0, i = Number(e.videoHeight) || Number(e.naturalHeight) || 0;
			if (r > 0 && i > 0) return {
				w: r,
				h: i
			};
			try {
				let e = Number(t?.width) || 0, n = Number(t?.height) || 0;
				if (e > 0 && n > 0) return {
					w: e,
					h: n
				};
			} catch (e) {
				console.debug?.(e);
			}
			try {
				let e = Number(n?._mediaW) || 0, t = Number(n?._mediaH) || 0;
				if (e > 0 && t > 0) return {
					w: e,
					h: t
				};
			} catch (e) {
				console.debug?.(e);
			}
			try {
				let e = n?.assets?.[n?.currentIndex] || null, t = Number(e?.width) || 0, r = Number(e?.height) || 0;
				if (t > 0 && r > 0) return {
					w: t,
					h: r
				};
			} catch (e) {
				console.debug?.(e);
			}
			return {
				w: 0,
				h: 0
			};
		} catch {
			return {
				w: 0,
				h: 0
			};
		}
	}, d = (e, t, n, r) => {
		try {
			let i = Number(e) || 0, a = Number(t) || 0, o = Number(n) || 0, s = Number(r) || 0;
			if (!(i > 0 && a > 0 && o > 0 && s > 0)) return {
				x: 0,
				y: 0,
				w: i,
				h: a
			};
			let c = o / s;
			if (!Number.isFinite(c) || c <= 0) return {
				x: 0,
				y: 0,
				w: i,
				h: a
			};
			let l = a, u = a * c;
			return {
				x: (i - u) / 2,
				y: 0,
				w: u,
				h: l
			};
		} catch {
			return {
				x: 0,
				y: 0,
				w: Number(e) || 0,
				h: Number(t) || 0
			};
		}
	}, f = (e, t, n, r, i) => {
		try {
			let a = Math.max(.1, Math.min(16, Number(n) || 1)), o = Number(t?.x) || 0, s = Number(t?.y) || 0, c = Number(e?.x) || 0, l = Number(e?.y) || 0, u = Number(e?.w) || 0, d = Number(e?.h) || 0, f = Number(r) || 0, p = Number(i) || 0;
			return {
				x: o + (c - o) * a + f,
				y: s + (l - s) * a + p,
				w: u * a,
				h: d * a
			};
		} catch {
			return {
				x: 0,
				y: 0,
				w: 0,
				h: 0
			};
		}
	}, p = (e, t, n, r) => {
		try {
			let i = t || {}, a = Number(i.x) || 0, o = Number(i.y) || 0, s = Number(i.w) || 0, c = Number(i.h) || 0;
			if (!(s > 8 && c > 8)) return;
			let l = String(n || "");
			if (!l) return;
			let u = Math.max(6, Math.round(6 * r)), d = Math.max(3, Math.round(3 * r)), f = Math.max(11, Math.round(11 * r));
			e.save(), e.font = `${f}px var(--comfy-font, ui-sans-serif, system-ui)`, e.textAlign = "left", e.textBaseline = "top";
			let p = Math.ceil(e.measureText(l).width) + u * 2, m = f + d * 2, h = a + Math.max(2, Math.round(8 * r)), g = o + Math.max(2, Math.round(8 * r));
			e.fillStyle = "rgba(0,0,0,0.55)", e.strokeStyle = "rgba(255,255,255,0.18)", e.lineWidth = Math.max(1, Math.round(1 * r)), e.beginPath();
			let _ = Math.max(6, Math.round(8 * r));
			e.moveTo(h + _, g), e.arcTo(h + p, g, h + p, g + m, _), e.arcTo(h + p, g + m, h, g + m, _), e.arcTo(h, g + m, h, g, _), e.arcTo(h, g, h + p, g, _), e.closePath(), e.fill(), e.stroke(), e.fillStyle = "rgba(255,255,255,0.92)", e.fillText(l, h + u, g + d), e.restore();
		} catch {
			try {
				e.restore();
			} catch (e) {
				console.debug?.(e);
			}
		}
	}, m = () => {
		try {
			let t = a?.();
			if (!t) return {
				w: 0,
				h: 0,
				dpr: 1
			};
			let n = Math.max(1, Math.min(3, Number(window.devicePixelRatio) || 1)), r = Math.max(1, Math.floor(t.width * n)), i = Math.max(1, Math.floor(t.height * n));
			try {
				e?.width !== r && (e.width = r), e?.height !== i && (e.height = i);
			} catch (e) {
				console.debug?.(e);
			}
			return {
				w: r,
				h: i,
				dpr: n
			};
		} catch {
			return {
				w: 0,
				h: 0,
				dpr: 1
			};
		}
	}, h = (e, t, n) => {
		try {
			let r = String(e || "image");
			if (r === "image") {
				let e = u(t), r = (Number(e.w) || 0) / (Number(e.h) || 1);
				if (Number.isFinite(r) && r > 0) return r;
				let i = (Number(n?.width) || 0) / (Number(n?.height) || 1);
				return Number.isFinite(i) && i > 0 ? i : 1;
			}
			return r === "16:9" ? 16 / 9 : r === "9:16" ? 9 / 16 : r === "1:1" ? 1 : r === "4:3" ? 4 / 3 : r === "2.39" ? 2.39 : 1;
		} catch {
			return 1;
		}
	}, g = (e, t, n) => {
		try {
			let r = Number(e) || 0, i = Number(t) || 0, a = Number(n) || 1;
			if (!(r > 0 && i > 0 && a > 0)) return {
				x: 0,
				y: 0,
				w: r,
				h: i
			};
			let o = r / i, s = r, c = i;
			return a >= o ? (s = r, c = r / a) : (c = i, s = i * a), {
				x: (r - s) / 2,
				y: (i - c) / 2,
				w: s,
				h: c
			};
		} catch {
			return {
				x: 0,
				y: 0,
				w: Number(e) || 0,
				h: Number(t) || 0
			};
		}
	}, _ = (t, n, r) => {
		try {
			let i = Math.max(0, Math.min(.92, Number(r)));
			if (!(i > 0)) return;
			t.save(), t.globalCompositeOperation = "source-over", t.fillStyle = `rgba(0,0,0,${i})`, t.fillRect(0, 0, e.width, e.height), t.globalCompositeOperation = "destination-out", t.fillStyle = "rgba(0,0,0,1)";
			let a = Array.isArray(n) ? n : [n];
			for (let e of a) {
				if (!e) continue;
				let n = Number(e.x) || 0, r = Number(e.y) || 0, i = Number(e.w) || 0, a = Number(e.h) || 0;
				i > 1 && a > 1 && t.fillRect(n, r, i, a);
			}
			t.restore();
		} catch {
			try {
				t.restore();
			} catch (e) {
				console.debug?.(e);
			}
		}
	}, v = (e, t, n) => {
		try {
			e.save();
			try {
				e.setLineDash?.([Math.max(2, 4 * n), Math.max(2, 3 * n)]);
			} catch (e) {
				console.debug?.(e);
			}
			e.strokeStyle = "rgba(255,255,255,0.22)", e.lineWidth = Math.max(1, Math.floor(1 * n)), e.strokeRect(t.x + .5, t.y + .5, t.w - 1, t.h - 1), e.restore();
		} catch {
			try {
				e.restore();
			} catch (e) {
				console.debug?.(e);
			}
		}
	};
	return {
		ensureCanvasSize: m,
		redrawGrid: ({ w: t, h: m, dpr: y } = {}) => {
			try {
				let b = e?.getContext?.("2d");
				if (!b) return;
				try {
					o?.(b, t, m);
				} catch (e) {
					console.debug?.(e);
				}
				let x = a?.();
				if (!x) return;
				let S = Number(x.width) || 0, C = Number(x.height) || 0;
				if (!(S > 1 && C > 1)) return;
				let w = s(), T = n?.mode, E = (() => {
					try {
						if (T === r?.SINGLE) return [i?.()].filter(Boolean);
						let e = w?.querySelectorAll?.(".mjr-viewer-media") || [];
						return Array.from(e || []).filter(Boolean);
					} catch {
						return [i?.()].filter(Boolean);
					}
				})();
				if (!E.length) return;
				let D = [], O = [];
				for (let e of E) try {
					let t = c(e, w)?.getBoundingClientRect?.() || null;
					if (!t) continue;
					let r = Number(t.width) || 0, i = Number(t.height) || 0;
					if (!(r > 1 && i > 1)) continue;
					let a = l(e), o = u(e, a), s = d(r, i, o.w, o.h), p = h(n?.overlayFormat, e, {
						width: s.w,
						height: s.h
					}), m = g(s.w, s.h, p), _ = (Number(t.left) || 0) - (Number(x.left) || 0), v = (Number(t.top) || 0) - (Number(x.top) || 0), b = {
						x: _ + (s.x || 0),
						y: v + (s.y || 0),
						w: s.w || r,
						h: s.h || i
					}, S = {
						x: b.x + (m.x || 0),
						y: b.y + (m.y || 0),
						w: m.w || b.w,
						h: m.h || b.h
					}, C = {
						x: _ + r / 2,
						y: v + i / 2
					}, T = Number(n?.zoom) || 1, E = (Number(n?.panX) || 0) / T, k = (Number(n?.panY) || 0) / T, A = f(b, C, T, E, k), j = f(S, C, T, E, k), M = {
						x: A.x * y,
						y: A.y * y,
						w: A.w * y,
						h: A.h * y,
						_sizeLabel: (() => {
							try {
								let e = Number(a?.width) || Number(o.w) || 0, t = Number(a?.height) || Number(o.h) || 0;
								if (e > 0 && t > 0) return `${e}x${t}`;
							} catch (e) {
								console.debug?.(e);
							}
							return "";
						})()
					}, N = {
						x: j.x * y,
						y: j.y * y,
						w: j.w * y,
						h: j.h * y
					};
					M.w > 1 && M.h > 1 && O.push(M), N.w > 1 && N.h > 1 && D.push(N);
				} catch (e) {
					console.debug?.(e);
				}
				if (!D.length && !O.length) return;
				let k = D.length ? D : O, A = k[0] || null;
				try {
					if (n?.overlayMaskEnabled) {
						_(b, k, n?.overlayMaskOpacity ?? .65);
						for (let e of k) try {
							v(b, e, y);
						} catch (e) {
							console.debug?.(e);
						}
					}
				} catch (e) {
					console.debug?.(e);
				}
				try {
					if (n?.hudEnabled && n?.mode === r?.SINGLE) for (let e of O) {
						try {
							b.save(), b.strokeStyle = "rgba(255,255,255,0.22)", b.lineWidth = Math.max(1, Math.floor(1 * y)), b.strokeRect(e.x + .5, e.y + .5, e.w - 1, e.h - 1), b.restore();
						} catch {
							try {
								b.restore();
							} catch (e) {
								console.debug?.(e);
							}
						}
						try {
							p(b, e, e._sizeLabel || "", y);
						} catch (e) {
							console.debug?.(e);
						}
					}
				} catch (e) {
					console.debug?.(e);
				}
				if (n?.mode !== r?.SINGLE || (n?.gridMode || 0) === 0 || !A) return;
				try {
					b.save(), b.translate(A.x, A.y), b.strokeStyle = "rgba(255, 255, 255, 0.22)", b.lineWidth = Math.max(2, Math.round(1.25 * y));
					let e = (e, t, n, r) => {
						try {
							b.beginPath(), b.moveTo(Math.round(e) + .5, Math.round(t) + .5), b.lineTo(Math.round(n) + .5, Math.round(r) + .5), b.stroke();
						} catch (e) {
							console.debug?.(e);
						}
					};
					if (n.gridMode === 1) e(A.w / 3, 0, A.w / 3, A.h), e(2 * A.w / 3, 0, 2 * A.w / 3, A.h), e(0, A.h / 3, A.w, A.h / 3), e(0, 2 * A.h / 3, A.w, 2 * A.h / 3);
					else if (n.gridMode === 2) e(A.w / 2, 0, A.w / 2, A.h), e(0, A.h / 2, A.w, A.h / 2);
					else if (n.gridMode === 3) {
						let e = (e, t) => {
							try {
								b.save(), b.strokeStyle = `rgba(255,255,255,${t})`;
								let n = Math.round(A.w * e), r = Math.round(A.h * e), i = Math.round(A.w * (1 - e * 2)), a = Math.round(A.h * (1 - e * 2));
								b.strokeRect(n + .5, r + .5, i, a);
							} catch (e) {
								console.debug?.(e);
							} finally {
								try {
									b.restore();
								} catch (e) {
									console.debug?.(e);
								}
							}
						};
						e(.05, .24), e(.1, .18);
					} else if (n.gridMode === 4) {
						let t = .382, n = 1 - t;
						e(A.w * t, 0, A.w * t, A.h), e(A.w * n, 0, A.w * n, A.h), e(0, A.h * t, A.w, A.h * t), e(0, A.h * n, A.w, A.h * n);
					}
				} catch (e) {
					console.debug?.(e);
				} finally {
					try {
						b.restore();
					} catch (e) {
						console.debug?.(e);
					}
				}
			} catch (e) {
				console.debug?.(e);
			}
		}
	};
}
//#endregion
//#region ui/features/viewer/probe.ts
function Yn({ overlay: e, content: t, state: n, VIEWER_MODES: r, getPrimaryMedia: i, getMediaNaturalSize: a, _getViewportRect: o, positionOverlayBox: s, probeTooltip: c, loupeWrap: l, onLoupeRedraw: u, lifecycle: d } = {}) {
	let f = d?.unsubs || [], p = document.createElement("canvas");
	p.width = 1, p.height = 1;
	let m = null;
	try {
		m = p.getContext("2d", { willReadFrequently: !0 });
	} catch (e) {
		console.debug?.(e);
	}
	let h = null, g = null, _ = null, v = () => {
		try {
			c.style.display = "none";
		} catch (e) {
			console.debug?.(e);
		}
		try {
			l.style.display = "none";
		} catch (e) {
			console.debug?.(e);
		}
		try {
			n._probe = null;
		} catch (e) {
			console.debug?.(e);
		}
	}, y = (e) => {
		try {
			let t = e?.x, n = e?.y, r = e?.r, i = e?.g, a = e?.b, o = e?.a, s = Array.isArray(e?.raw) ? e.raw : null, c = Array.isArray(e?.lin) ? e.lin : null, l = Number(e?.scale), u = (e) => {
				let t = Number(e);
				return Number.isFinite(t) ? t.toFixed(3) : "?";
			}, d = r != null && i != null && a != null ? `#${[
				r,
				i,
				a
			].map((e) => Math.max(0, Math.min(255, Number(e) || 0)).toString(16).padStart(2, "0")).join("")}` : "", f = Number.isFinite(l) && l > 0 && l < .999 ? ` (proc ${(l * 100).toFixed(0)}%)` : "", p = [];
			return p.push(`X: ${t ?? "?"}  Y: ${n ?? "?"}${f}`), p.push(`RGBA8: ${r ?? "?"} ${i ?? "?"} ${a ?? "?"} ${o ?? "?"}`), s && s.length >= 3 && p.push(`RGB: ${u(s[0])} ${u(s[1])} ${u(s[2])}`), c && c.length >= 3 && p.push(`HDR: ${u(c[0])} ${u(c[1])} ${u(c[2])}`), d && p.push(d), p.join("\n");
		} catch {
			return "";
		}
	}, b = (e, t, n) => {
		if (!m) return null;
		try {
			m.clearRect(0, 0, 1, 1);
		} catch (e) {
			console.debug?.(e);
		}
		try {
			let r = Number(t) || 0, i = Number(n) || 0;
			if (e?.tagName === "CANVAS") {
				let t = Number(e._mjrPixelScale) || 1;
				r = Math.floor(r * t), i = Math.floor(i * t);
			}
			m.drawImage(e, r, i, 1, 1, 0, 0, 1, 1);
			let a = m.getImageData(0, 0, 1, 1)?.data;
			return !a || a.length < 4 ? null : {
				r: a[0],
				g: a[1],
				b: a[2],
				a: a[3]
			};
		} catch {
			return null;
		}
	}, x = (t, o) => {
		try {
			if (e?.style?.display === "none" || n?.mode !== r?.SINGLE || !n?.probeEnabled && !n?.loupeEnabled) return v();
			let d = i?.();
			if (!d) return v();
			let f = d.getBoundingClientRect();
			if (!f || !(f.width > 2 && f.height > 2)) return v();
			let p = (Number(t) || 0) - f.left, m = (Number(o) || 0) - f.top;
			if (p < 0 || m < 0 || p > f.width || m > f.height) return v();
			let { w: h, h: g } = a?.(d) || {
				w: 0,
				h: 0
			};
			if (!(h > 0 && g > 0)) return v();
			let _ = p / f.width, x = m / f.height, S = Math.max(0, Math.min(h - 1, Math.floor(_ * h))), C = Math.max(0, Math.min(g - 1, Math.floor(x * g))), w = null;
			if (n?.probeEnabled) {
				try {
					let e = d?._mjrProc;
					if (e?.sampleAtOriginal) {
						let t = e.sampleAtOriginal(S, C);
						t && (w = {
							x: S,
							y: C,
							...t
						});
					}
				} catch (e) {
					console.debug?.(e);
				}
				if (!w) {
					let e = b(d, S, C);
					e && (w = {
						x: S,
						y: C,
						...e
					});
				}
			}
			w ||= {
				x: S,
				y: C
			};
			try {
				n._probe = w;
			} catch (e) {
				console.debug?.(e);
			}
			if (n?.probeEnabled) {
				try {
					c.textContent = y(w), c.style.display = "";
				} catch (e) {
					console.debug?.(e);
				}
				X(() => s?.(c, t, o, {
					offsetX: 18,
					offsetY: 18
				}));
			} else try {
				c.style.display = "none";
			} catch (e) {
				console.debug?.(e);
			}
			if (n?.loupeEnabled) X(() => u?.(d, S, C, t, o));
			else try {
				l.style.display = "none";
			} catch (e) {
				console.debug?.(e);
			}
		} catch (e) {
			console.debug?.(e);
		}
	}, S = (e, t) => {
		g = e, _ = t;
		try {
			if (h != null) return;
			h = requestAnimationFrame(() => {
				h = null, x(g, _);
			});
		} catch (e) {
			console.debug?.(e);
		}
	};
	try {
		t && !t._mjrProbeBound && (f.push(Z(t, "mousemove", (e) => {
			try {
				S(e.clientX, e.clientY);
			} catch (e) {
				console.debug?.(e);
			}
		}, {
			passive: !0,
			capture: !0
		})), f.push(Z(t, "mouseleave", () => {
			v();
		}, {
			passive: !0,
			capture: !0
		})), t._mjrProbeBound = !0);
	} catch (e) {
		console.debug?.(e);
	}
	return {
		hide: v,
		dispose: () => {
			try {
				h != null && cancelAnimationFrame(h);
			} catch (e) {
				console.debug?.(e);
			}
			h = null, v();
		}
	};
}
//#endregion
//#region ui/features/viewer/loupe.ts
function Xn({ state: e, loupeCanvas: t, loupeWrap: n, getMediaNaturalSize: r, positionOverlayBox: i } = {}) {
	let a = null;
	try {
		a = t?.getContext?.("2d", { willReadFrequently: !0 });
	} catch (e) {
		console.debug?.(e);
	}
	return {
		redraw: (o, s, c, l, u) => {
			try {
				if (!e?.loupeEnabled || !a || !o) return;
				let { w: d, h: f } = r?.(o) || {
					w: 0,
					h: 0
				};
				if (!(d > 0 && f > 0)) return;
				let p = Math.max(48, Math.min(240, Number(e.loupeSize) || 120)), m = Math.max(2, Math.min(20, Number(e.loupeMagnification) || 8));
				try {
					t.width !== p && (t.width = p), t.height !== p && (t.height = p);
				} catch (e) {
					console.debug?.(e);
				}
				let h = Math.max(3, Math.floor(p / m)), g = o?.tagName === "CANVAS" && Number(o._mjrPixelScale) || 1, _ = o?.tagName === "CANVAS" ? Number(o.width) || 0 : d, v = o?.tagName === "CANVAS" ? Number(o.height) || 0 : f;
				if (!(_ > 0 && v > 0)) return;
				let y = Math.max(1, Math.floor(h * g)), b = Math.floor(y / 2), x = Math.floor((Number(s) || 0) * g), S = Math.floor((Number(c) || 0) * g), C = Math.max(0, Math.min(_ - y, x - b)), w = Math.max(0, Math.min(v - y, S - b));
				a.imageSmoothingEnabled = !1, a.clearRect(0, 0, p, p), a.drawImage(o, C, w, y, y, 0, 0, p, p), a.strokeStyle = "rgba(255,255,255,0.75)", a.lineWidth = 1, a.beginPath(), a.moveTo(p / 2 + .5, 0), a.lineTo(p / 2 + .5, p), a.moveTo(0, p / 2 + .5), a.lineTo(p, p / 2 + .5), a.stroke();
				try {
					n.style.display = "", n.style.width = `${p}px`, n.style.height = `${p}px`;
				} catch (e) {
					console.debug?.(e);
				}
				try {
					i?.(n, l, u, {
						offsetX: 18,
						offsetY: -p - 18
					});
				} catch (e) {
					console.debug?.(e);
				}
			} catch (e) {
				console.debug?.(e);
			}
		},
		hide: () => {
			try {
				n.style.display = "none";
			} catch (e) {
				console.debug?.(e);
			}
		}
	};
}
//#endregion
//#region ui/features/viewer/metadata.ts
function Zn({ state: e, VIEWER_MODES: t, APP_CONFIG: n, getAssetMetadata: r, getAssetsBatch: i } = {}) {
	let a = /* @__PURE__ */ new Map(), o = n?.VIEWER_META_TTL_MS ?? 3e4, s = n?.VIEWER_META_MAX_ENTRIES ?? 500, c = 0, l = null, u = () => {
		if (a.size <= s) return;
		let e = Date.now();
		try {
			for (let [t, n] of a.entries()) n && e - (n.at || 0) > o && a.delete(t);
		} catch (e) {
			console.debug?.(e);
		}
		if (!(a.size <= s)) try {
			let e = Array.from(a.entries()).sort((e, t) => (e?.[1]?.at || 0) - (t?.[1]?.at || 0)), t = a.size - s;
			for (let n = 0; n < t; n++) {
				let t = e[n]?.[0];
				t != null && a.delete(t);
			}
		} catch (e) {
			console.debug?.(e);
		}
	}, d = (e, t) => {
		if (!(!e || !t || typeof t != "object")) {
			try {
				t.rating !== void 0 && (e.rating = t.rating);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				t.tags !== void 0 && (e.tags = t.tags);
			} catch (e) {
				console.debug?.(e);
			}
		}
	}, f = async (e, { signal: t } = {}) => {
		let n = Array.isArray(e) ? e : [], r = Date.now(), s = [];
		for (let e of n) {
			let t = e?.id;
			if (t == null) continue;
			let n = String(t), i = a.get(n);
			if (i && r - (i.at || 0) < o) {
				d(e, i.data);
				continue;
			}
			s.push(t);
		}
		if (s.length) try {
			let e = await i?.(s, t ? { signal: t } : {}), o = Array.isArray(e?.data) ? e.data : [];
			for (let e of o) {
				let t = e?.id;
				if (t == null) continue;
				let n = String(t);
				a.set(n, {
					at: r,
					data: e
				});
			}
			u();
			for (let e of n) {
				let t = e?.id;
				if (t == null) continue;
				let n = a.get(String(t));
				n && n.data && d(e, n.data);
			}
		} catch (e) {
			console.debug?.(e);
		}
	};
	return {
		hydrateVisibleMetadata: async () => {
			let n = e?.assets?.[e?.currentIndex], r = e?.compareAsset, i = e?.mode;
			++c;
			try {
				l?.abort?.();
			} catch (e) {
				console.debug?.(e);
			}
			l = new AbortController();
			let a = l.signal;
			try {
				if (i === t?.SINGLE) return n && await f([n], { signal: a }), void 0;
				let o = (Array.isArray(e?.assets) ? e.assets.slice(0, 4) : []).slice();
				r && o.push(r), await f(o, { signal: a });
			} catch (e) {
				console.debug?.(e);
			}
		},
		hydrateAssetMetadata: async (e, { signal: t } = {}) => {
			let n = e?.id;
			if (n == null) return;
			let i = String(n), s = Date.now(), c = a.get(i);
			if (c && s - (c.at || 0) < o) {
				d(e, c.data);
				return;
			}
			try {
				let o = await r?.(n, t ? { signal: t } : {});
				o?.ok && o.data && (a.set(i, {
					at: s,
					data: o.data
				}), u(), d(e, o.data));
			} catch (e) {
				console.debug?.(e);
			}
		},
		hydrateAssetsMetadataBatch: f,
		getCached: (e) => {
			try {
				return a.get(String(e));
			} catch {
				return null;
			}
		},
		setCached: (e, t) => {
			try {
				a.set(String(e), {
					at: Date.now(),
					data: t
				}), u();
			} catch (e) {
				console.debug?.(e);
			}
		},
		deleteCached: (e) => {
			try {
				a.delete(String(e));
			} catch (e) {
				console.debug?.(e);
			}
		},
		abort: () => {
			X(() => l?.abort?.()), l = null;
		},
		dispose: () => {
			X(() => l?.abort?.()), l = null, X(() => a.clear());
		},
		cleanupCache: () => {
			X(u);
		},
		_noop: kt
	};
}
//#endregion
//#region ui/features/viewer/constants.ts
var Qn = Object.freeze({
	MIN: .1,
	MAX: 16
});
//#endregion
//#region ui/features/viewer/panzoom.ts
function $n({ overlay: e, content: t, singleView: n, abView: r, sideView: i, state: a, VIEWER_MODES: o, scheduleOverlayRedraw: s, lifecycle: c } = {}) {
	let l = c?.safeCall || X, u = c?.safeAddListener || Z, d = c?.unsubs || [], f = () => {
		try {
			return a?.mode === o?.SINGLE && n?.querySelector?.(".mjr-viewer-media") || null;
		} catch {
			return null;
		}
	}, p = (e) => {
		try {
			if (!e) return {
				w: 0,
				h: 0
			};
			let t = Number(e?._mjrNaturalW) || 0, n = Number(e?._mjrNaturalH) || 0;
			if (t > 0 && n > 0) return {
				w: t,
				h: n
			};
			if (e.tagName === "IMG") return {
				w: Number(e.naturalWidth) || 0,
				h: Number(e.naturalHeight) || 0
			};
			if (e.tagName === "VIDEO") return {
				w: Number(e.videoWidth) || 0,
				h: Number(e.videoHeight) || 0
			};
			if (e.tagName === "CANVAS") return {
				w: Number(e._mjrNaturalW) || Number(e.width) || 0,
				h: Number(e._mjrNaturalH) || Number(e.height) || 0
			};
		} catch (e) {
			console.debug?.(e);
		}
		return {
			w: 0,
			h: 0
		};
	}, m = () => {
		try {
			let e = t?.getBoundingClientRect?.();
			return e && e.width > 0 && e.height > 0 ? e : null;
		} catch {
			return null;
		}
	}, h = () => {
		try {
			let e = n;
			a?.mode === o?.AB_COMPARE ? e = r : a?.mode === o?.SIDE_BY_SIDE && (e = i);
			let t = e?.querySelector?.(".mjr-viewer-media");
			if (!t) return;
			let { w: s, h: c } = p(t);
			s > 0 && c > 0 && (a._mediaW = s, a._mediaH = c);
		} catch (e) {
			console.debug?.(e);
		}
	}, g = (e, { clampPanToBounds: t, applyTransform: n } = {}) => {
		if (!e || e._mjrMediaSizeBound) return;
		e._mjrMediaSizeBound = !0;
		let r = () => {
			h();
			try {
				t?.();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				n?.();
			} catch (e) {
				console.debug?.(e);
			}
		};
		try {
			e.tagName === "IMG" ? e.addEventListener("load", () => requestAnimationFrame(r), { once: !0 }) : e.tagName === "VIDEO" && e.addEventListener("loadedmetadata", () => requestAnimationFrame(r), { once: !0 });
		} catch (e) {
			console.debug?.(e);
		}
	}, _ = () => {
		try {
			if (!e || e.style.display === "none") return;
			let s = Math.max(Qn.MIN, Math.min(Qn.MAX, Number(a?.zoom) || 1)), c = a?.assets?.[a?.currentIndex], l = Number(c?.width) || 0, u = Number(c?.height) || 0;
			if (l > 0 && u > 0 || (h(), l = Number(a?._mediaW) || 0, u = Number(a?._mediaH) || 0), !(l > 0 && u > 0)) return;
			let d = l / u;
			if (!Number.isFinite(d) || d <= 0) return;
			let { w: f, h: p } = (() => {
				let s = Date.now();
				try {
					let e = a?._viewportCache;
					if (e && e.mode === a?.mode && s - (e.at || 0) < 250) {
						let t = Number(e.w) || 0, n = Number(e.h) || 0;
						if (t > 0 && n > 0) return {
							w: t,
							h: n
						};
					}
				} catch (e) {
					console.debug?.(e);
				}
				let c = Math.max(Number(t?.clientWidth) || 0, Number(e?.clientWidth) || 0), l = Math.max(Number(t?.clientHeight) || 0, Number(e?.clientHeight) || 0), u = (e, t) => ({
					w: Math.max(Number(e) || 0, c),
					h: Math.max(Number(t) || 0, l)
				}), d = null;
				if (a?.mode === o?.SINGLE) d = u(n?.clientWidth, n?.clientHeight);
				else if (a?.mode === o?.AB_COMPARE) d = u(r?.clientWidth, r?.clientHeight);
				else {
					let e = Array.from(i?.children || []).filter((e) => e && e.nodeType === 1);
					if (e.length) {
						let t = Infinity, n = Infinity;
						for (let r of e) {
							let e = Number(r.clientWidth) || 0, i = Number(r.clientHeight) || 0;
							e > 0 && (t = Math.min(t, e)), i > 0 && (n = Math.min(n, i));
						}
						Number.isFinite(t) && Number.isFinite(n) && (d = u(t, n));
					}
					d ||= u(i?.clientWidth, i?.clientHeight);
				}
				try {
					a._viewportCache = {
						mode: a?.mode,
						w: d.w,
						h: d.h,
						at: s
					};
				} catch (e) {
					console.debug?.(e);
				}
				return d;
			})();
			if (!(f > 0 && p > 0)) {
				e?.style?.display !== "none" && requestAnimationFrame(_);
				return;
			}
			let m = f / p, g = 0, v = 0;
			d > m ? (g = f, v = f / d) : (v = p, g = p * d);
			let y = g * s, b = v * s, x = y > f + 1 || b > p + 1;
			if (!(s > 1.001) && !x) {
				a.panX = 0, a.panY = 0;
				return;
			}
			let S = Math.max(0, y - f), C = Math.max(0, b - p), w = S / 2 * s, T = C / 2 * s;
			a.panX = Math.max(-w, Math.min(w, Number(a?.panX) || 0)), a.panY = Math.max(-T, Math.min(T, Number(a?.panY) || 0));
		} catch (e) {
			console.debug?.(e);
		}
	}, v = () => {
		let e = Math.max(Qn.MIN, Math.min(Qn.MAX, Number(a?.zoom) || 1)), t = Number(a?.panX) || 0, n = Number(a?.panY) || 0;
		return `translate3d(${t / e}px, ${n / e}px, 0) scale(${e})`;
	}, y = () => {
		try {
			if (!t) return;
			if (!e || e.style.display === "none") {
				t.style.cursor = "";
				return;
			}
			let n = Number(a?.zoom) || 1, { w: r, h: i } = p(f()) || {
				w: 0,
				h: 0
			}, o = m(), s = o && r > 0 && i > 0 ? E(r, i, o.width, o.height, n) : !1;
			if (!(n > 1.01 || s)) {
				t.style.cursor = "";
				return;
			}
			t.style.cursor = "grab";
		} catch (e) {
			console.debug?.(e);
		}
	}, b = ({ skipFit: t = !1 } = {}) => {
		try {
			_();
			let n = v(), r = C(), i = e?.querySelectorAll?.(".mjr-viewer-media") || [];
			for (let e of i) try {
				if (e?._mjrDisableViewerTransform) continue;
				if (!t) {
					let t = w(e, r)?.getBoundingClientRect?.() || null;
					if (t) {
						let n = Number(t.width) || 0, r = Number(t.height) || 0;
						if (n > 1 && r > 1) {
							let { w: t, h: i } = p(e) || {
								w: 0,
								h: 0
							};
							if (t > 0 && i > 0) {
								let a = S(t, i, n, r);
								a.w > 1 && a.h > 1 && (e.style.width = `${Math.round(a.w)}px`, e.style.height = `${Math.round(a.h)}px`);
							}
						}
					}
				}
				e.style.transform = n;
			} catch (e) {
				console.debug?.(e);
			}
			try {
				s?.();
			} catch (e) {
				console.debug?.(e);
			}
		} catch (e) {
			console.debug?.(e);
		}
	}, x = (e, { clientX: n = null, clientY: r = null } = {}) => {
		try {
			let i = Math.max(Qn.MIN, Math.min(Qn.MAX, Number(a?.zoom) || 1)), o = Math.max(Qn.MIN, Math.min(Qn.MAX, Number(e) || i));
			try {
				a._userInteracted = !0;
			} catch (e) {
				console.debug?.(e);
			}
			let s = Number(a?.panX) || 0, c = Number(a?.panY) || 0;
			if (n != null && r != null && Number.isFinite(Number(n)) && Number.isFinite(Number(r))) try {
				let e = t?.getBoundingClientRect?.();
				if (e && e.width > 0 && e.height > 0) {
					let t = e.left + e.width / 2, l = e.top + e.height / 2, u = (Number(n) || 0) - t, d = (Number(r) || 0) - l, f = o / i;
					s = Math.round(((Number(a?.panX) || 0) * f + (1 - f) * u) * 10) / 10, c = Math.round(((Number(a?.panY) || 0) * f + (1 - f) * d) * 10) / 10;
				}
			} catch (e) {
				console.debug?.(e);
			}
			else if (o !== i) {
				let e = o / i;
				s = Math.round((Number(a?.panX) || 0) * e * 10) / 10, c = Math.round((Number(a?.panY) || 0) * e * 10) / 10;
			}
			a.zoom = o, a.panX = s, a.panY = c, Math.abs(a.zoom - 1) < .001 && (a.zoom = 1, a.panX = 0, a.panY = 0), a.targetZoom = a.zoom, b({ skipFit: !0 }), y();
		} catch (e) {
			console.debug?.(e);
		}
	}, S = (e, t, n, r) => {
		try {
			let i = Number(e) || 0, a = Number(t) || 0, o = Number(n) || 0, s = Number(r) || 0;
			if (!(i > 0 && a > 0 && o > 0 && s > 0)) return {
				w: 0,
				h: 0
			};
			let c = i / a;
			return !Number.isFinite(c) || c <= 0 ? {
				w: 0,
				h: 0
			} : {
				w: s * c,
				h: s
			};
		} catch {
			return {
				w: 0,
				h: 0
			};
		}
	}, C = () => {
		try {
			let e = a?.mode;
			return e === o?.AB_COMPARE ? r || t || null : e === o?.SIDE_BY_SIDE ? i || t || null : n || t || null;
		} catch {
			return t || null;
		}
	}, w = (e, n) => {
		try {
			if (!e) return n || null;
			let r = a?.mode;
			if (r === o?.SIDE_BY_SIDE || r === o?.AB_COMPARE) {
				let t = e;
				for (; t && t !== n && t.parentElement;) {
					if (t.parentElement === n) return t;
					t = t.parentElement;
				}
				return n || null;
			}
			return n || t || null;
		} catch {
			return n || t || null;
		}
	}, E = (e, t, n, r, i) => {
		try {
			let a = S(e, t, n, r);
			if (!(a.w > 0 && a.h > 0)) return !1;
			let o = Math.max(Qn.MIN, Math.min(Qn.MAX, Number(i) || 1)), s = a.w * o, c = a.h * o;
			return s > (Number(n) || 0) + 1 || c > (Number(r) || 0) + 1;
		} catch {
			return !1;
		}
	}, D = () => {
		try {
			let e = f();
			if (!e) return null;
			let { w: t, h: n } = p(e);
			if (!(t > 0 && n > 0)) return null;
			let r = m();
			if (!r) return null;
			let i = S(t, n, r.width, r.height);
			if (!(i.w > 0 && i.h > 0)) return null;
			let a = t / i.w;
			return !Number.isFinite(a) || a <= 0 ? null : Math.max(Qn.MIN, Math.min(Qn.MAX, a));
		} catch {
			return null;
		}
	}, O = {
		active: !1,
		pointerId: null,
		startX: 0,
		startY: 0,
		startPanX: 0,
		startPanY: 0,
		raf: 0
	}, k = () => {
		O.raf ||= requestAnimationFrame(() => {
			O.raf = 0, b({ skipFit: !0 }), y();
		});
	}, A = (n) => {
		if (!e || e.style.display === "none" || ne(n?.target)) return;
		let r = Number(a?.zoom) || 1, i = (() => {
			try {
				return !!T?.VIEWER_ALLOW_PAN_AT_ZOOM_1;
			} catch {
				return !1;
			}
		})();
		if (!(() => {
			try {
				if (i) return !0;
				let { w: e, h: t } = p(f()) || {
					w: 0,
					h: 0
				}, n = m();
				return !n || !(e > 0 && t > 0) ? r > 1.01 : r > 1.01 || E(e, t, n.width, n.height, r);
			} catch {
				return r > 1.01;
			}
		})()) {
			try {
				a._panHintAt = Date.now(), a._panHintX = n?.clientX ?? null, a._panHintY = n?.clientY ?? null;
			} catch (e) {
				console.debug?.(e);
			}
			try {
				a._panHintTimer && clearTimeout(a._panHintTimer);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				a._panHintTimer = setTimeout(() => {
					try {
						a._panHintAt = 0;
					} catch (e) {
						console.debug?.(e);
					}
					l(s);
				}, 950);
			} catch (e) {
				console.debug?.(e);
			}
			l(s);
			return;
		}
		let o = n.button === 0, c = n.button === 1;
		if (!(!o && !c)) {
			try {
				let e = n.target;
				if (e && (e.tagName === "INPUT" || e.tagName === "TEXTAREA" || e.tagName === "SELECT" || e.isContentEditable)) return;
			} catch (e) {
				console.debug?.(e);
			}
			try {
				if (n?.target?.closest?.(".mjr-video-controls") || n?.target?.closest?.(".mjr-context-menu") || n?.target?.closest?.(".mjr-ab-slider") || ne(n?.target)) return;
			} catch (e) {
				console.debug?.(e);
			}
			try {
				if (!t?.contains?.(n.target)) return;
			} catch {
				return;
			}
			O.active = !0;
			try {
				a._userInteracted = !0;
			} catch (e) {
				console.debug?.(e);
			}
			O.pointerId = n.pointerId;
			try {
				a._lastPointerX = n.clientX, a._lastPointerY = n.clientY;
			} catch (e) {
				console.debug?.(e);
			}
			O.startX = n.clientX, O.startY = n.clientY, O.startPanX = Number(a?.panX) || 0, O.startPanY = Number(a?.panY) || 0;
			try {
				n.preventDefault(), n.stopPropagation(), n.stopImmediatePropagation?.();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				t?.setPointerCapture?.(n.pointerId);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				t && (t.style.cursor = "grabbing");
			} catch (e) {
				console.debug?.(e);
			}
		}
	}, j = (e) => {
		if (!O.active) return;
		try {
			if (e?.target?.closest?.(".mjr-video-controls")) return;
		} catch (e) {
			console.debug?.(e);
		}
		try {
			e.preventDefault(), e.stopPropagation(), e.stopImmediatePropagation?.();
		} catch (e) {
			console.debug?.(e);
		}
		let t = (Number(e.clientX) || 0) - O.startX, n = (Number(e.clientY) || 0) - O.startY, r = Math.max(Qn.MIN, Math.min(Qn.MAX, Number(a?.zoom) || 1)), i = Math.max(1, r);
		a.panX = O.startPanX + t * i, a.panY = O.startPanY + n * i;
		try {
			a._lastPointerX = e.clientX, a._lastPointerY = e.clientY;
		} catch (e) {
			console.debug?.(e);
		}
		k();
	}, M = (e) => {
		if (O.active) {
			O.active = !1, O.pointerId = null;
			try {
				O.raf && cancelAnimationFrame(O.raf);
			} catch (e) {
				console.debug?.(e);
			}
			O.raf = 0, b({ skipFit: !1 });
			try {
				t?.releasePointerCapture?.(e.pointerId);
			} catch (e) {
				console.debug?.(e);
			}
			y();
		}
	}, N = (n) => {
		if (!(!e || e.style.display === "none")) {
			try {
				if (!t?.contains?.(n.target)) return;
			} catch (e) {
				console.debug?.(e);
			}
			try {
				if (ne(n?.target)) return;
			} catch (e) {
				console.debug?.(e);
			}
			try {
				n.preventDefault(), n.stopPropagation(), n.stopImmediatePropagation?.();
			} catch (e) {
				console.debug?.(e);
			}
			Math.abs((Number(a?.targetZoom) || 1) - 1) < .01 ? x(Math.min(8, (Number(a?.targetZoom) || 1) * 4), {
				clientX: n.clientX,
				clientY: n.clientY
			}) : x(1, {
				clientX: n.clientX,
				clientY: n.clientY
			});
		}
	};
	try {
		t && !t._mjrPanBound && (d.push(u(t, "pointerdown", A, {
			passive: !1,
			capture: !0
		})), d.push(u(t, "pointermove", j, {
			passive: !1,
			capture: !0
		})), d.push(u(t, "pointerup", M, {
			passive: !0,
			capture: !0
		})), d.push(u(t, "pointercancel", M, {
			passive: !0,
			capture: !0
		})), t._mjrPanBound = !0);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		t && !t._mjrDblClickResetBound && (d.push(u(t, "dblclick", N, {
			passive: !1,
			capture: !0
		})), t._mjrDblClickResetBound = !0);
	} catch (e) {
		console.debug?.(e);
	}
	return {
		getPrimaryMedia: f,
		getMediaNaturalSize: p,
		getViewportRect: m,
		updateMediaNaturalSize: h,
		attachMediaLoadHandlers: g,
		clampPanToBounds: _,
		mediaTransform: v,
		applyTransform: b,
		setZoom: x,
		computeOneToOneZoom: D,
		updatePanCursor: y,
		dispose: () => {
			l(() => {
				O.active = !1, O.pointerId = null, O.raf && cancelAnimationFrame(O.raf), O.raf = 0;
			});
		}
	};
}
//#endregion
//#region ui/features/viewer/videoProcessorWebGL.ts
var er = "\nattribute vec2 a_position;\nvarying vec2 v_uv;\nvoid main() {\n    // Quad covers -1..1\n    gl_Position = vec4(a_position, 0, 1);\n    // Map -1..1 to 0..1\n    v_uv = a_position * 0.5 + 0.5;\n    // In WebGL, textures are usually flipped relative to Image/Video elements if not handled.\n    // We'll flip Y in fragment shader or here.\n    v_uv.y = 1.0 - v_uv.y;\n}\n", tr = "\nprecision mediump float;\nvarying vec2 v_uv;\nuniform sampler2D u_image;\nuniform float u_exposure_scale;\nuniform float u_gamma_inv;\nuniform int u_channel; // 0=RGB, 1=R, 2=G, 3=B\nuniform int u_analysis; // 0=None, 1=Zebra\nuniform float u_zebra_threshold;\nuniform vec2 u_resolution;\n\nfloat getLuma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }\n\nvoid main() {\n    vec4 texColor = texture2D(u_image, v_uv);\n    vec3 color = texColor.rgb;\n\n    // Exposure\n    color *= u_exposure_scale;\n\n    // Analysis (Zebra) or Gamma\n    bool isZebra = false;\n    if (u_analysis == 1) {\n        float luma = getLuma(color);\n        if (luma >= u_zebra_threshold) {\n            isZebra = true;\n            // Stripe pattern: (x + y) % 16 < 8\n            // gl_FragCoord is in window pixels\n            float stripe = mod(gl_FragCoord.x + gl_FragCoord.y, 32.0);\n            if (stripe < 16.0) {\n                 gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); // Black\n            } else {\n                 gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); // White\n            }\n        }\n    }\n\n    if (!isZebra) {\n        // Gamma\n        // fast pow?\n        color = pow(clamp(color, 0.0, 1.0), vec3(u_gamma_inv));\n\n        // Channel Selector\n        if (u_channel == 1) color = vec3(color.r);\n        else if (u_channel == 2) color = vec3(color.g);\n        else if (u_channel == 3) color = vec3(color.b);\n\n        gl_FragColor = vec4(color, texColor.a);\n    }\n}\n";
function nr(e, t, n) {
	let r = e.createShader(t);
	return e.shaderSource(r, n), e.compileShader(r), e.getShaderParameter(r, e.COMPILE_STATUS) ? r : (console.warn("WebGL Shader Error:", e.getShaderInfoLog(r)), e.deleteShader(r), null);
}
function rr(e, t, n) {
	let r = e.createProgram();
	if (e.attachShader(r, t), e.attachShader(r, n), e.linkProgram(r), !e.getProgramParameter(r, e.LINK_STATUS)) {
		console.warn("WebGL Program Error:", e.getProgramInfoLog(r));
		try {
			e.deleteProgram(r);
		} catch (e) {
			console.debug?.(e);
		}
		return null;
	}
	return r;
}
function ir() {
	try {
		let e = document.createElement("canvas");
		return !!(window.WebGLRenderingContext && (e.getContext("webgl") || e.getContext("experimental-webgl")));
	} catch {
		return !1;
	}
}
function ar(e) {
	let { canvas: t, videoEl: n, getGradeParams: r } = e, i = null, a = null, o = 4096, s = !1, c = {
		type: "webgl",
		ready: !1,
		naturalW: 0,
		naturalH: 0,
		scale: 1,
		_destroyed: !1
	};
	function l() {
		let e = null;
		try {
			e = t.getContext("webgl", {
				alpha: !1,
				preserveDrawingBuffer: !0
			});
		} catch (e) {
			console.debug?.(e);
		}
		if (!e) try {
			e = t.getContext("experimental-webgl", {
				alpha: !1,
				preserveDrawingBuffer: !0
			});
		} catch (e) {
			console.debug?.(e);
		}
		return e && (o = e.getParameter(e.MAX_TEXTURE_SIZE) || 4096), e;
	}
	if (i = l(), !i) return null;
	let u = (e = "") => {
		if (!i) return;
		let t = i.getError();
		t !== i.NO_ERROR && console.error(`WebGL Error [${e}]: ${t}`);
	}, d = () => {
		if (!i || !a) return;
		let { positionBuffer: e, texture: t, program: n } = a;
		try {
			i.bindTexture(i.TEXTURE_2D, null);
		} catch (e) {
			console.debug?.(e);
		}
		try {
			i.bindBuffer(i.ARRAY_BUFFER, null);
		} catch (e) {
			console.debug?.(e);
		}
		try {
			i.useProgram(null);
		} catch (e) {
			console.debug?.(e);
		}
		try {
			i.deleteTexture(t);
		} catch (e) {
			console.debug?.(e);
		}
		try {
			i.deleteBuffer(e);
		} catch (e) {
			console.debug?.(e);
		}
		try {
			i.deleteProgram(n);
		} catch (e) {
			console.debug?.(e);
		}
		a = null;
	}, f = () => {
		if (!i) return null;
		d();
		let e = nr(i, i.VERTEX_SHADER, er), t = nr(i, i.FRAGMENT_SHADER, tr);
		if (!e || !t) return e && i.deleteShader(e), t && i.deleteShader(t), null;
		let n = rr(i, e, t);
		if (i.deleteShader(e), i.deleteShader(t), !n) return null;
		u("setupResources:createProgram");
		let r = {
			position: i.getAttribLocation(n, "a_position"),
			u_image: i.getUniformLocation(n, "u_image"),
			u_exposure: i.getUniformLocation(n, "u_exposure_scale"),
			u_gamma: i.getUniformLocation(n, "u_gamma_inv"),
			u_channel: i.getUniformLocation(n, "u_channel"),
			u_analysis: i.getUniformLocation(n, "u_analysis"),
			u_thresh: i.getUniformLocation(n, "u_zebra_threshold"),
			u_res: i.getUniformLocation(n, "u_resolution")
		}, a = i.createBuffer();
		i.bindBuffer(i.ARRAY_BUFFER, a), i.bufferData(i.ARRAY_BUFFER, new Float32Array([
			-1,
			-1,
			1,
			-1,
			-1,
			1,
			-1,
			1,
			1,
			-1,
			1,
			1
		]), i.STATIC_DRAW), u("setupResources:bufferData");
		let o = i.createTexture();
		return i.bindTexture(i.TEXTURE_2D, o), i.texParameteri(i.TEXTURE_2D, i.TEXTURE_WRAP_S, i.CLAMP_TO_EDGE), i.texParameteri(i.TEXTURE_2D, i.TEXTURE_WRAP_T, i.CLAMP_TO_EDGE), i.texParameteri(i.TEXTURE_2D, i.TEXTURE_MIN_FILTER, i.LINEAR), i.texParameteri(i.TEXTURE_2D, i.TEXTURE_MAG_FILTER, i.LINEAR), u("setupResources:texSetup"), {
			program: n,
			loc: r,
			positionBuffer: a,
			texture: o
		};
	}, p = () => s || c._destroyed || (i ||= l(), !i) ? !1 : (a ||= f(), !!a), m = () => {
		if (!s && i && n?.videoWidth) {
			let e = n.videoWidth, r = n.videoHeight, a = o || i.getParameter(i.MAX_TEXTURE_SIZE) || 4096;
			if (e > a || r > a) {
				let t = Math.min(a / e, a / r);
				e = Math.floor(e * t), r = Math.floor(r * t);
			}
			return (t.width !== e || t.height !== r) && (t.width = e, t.height = r, i.viewport(0, 0, e, r)), !0;
		}
		return !1;
	}, h = (e) => {
		if (!s && p() && m()) {
			let { program: o, loc: s, positionBuffer: c, texture: l } = a;
			i.useProgram(o), i.activeTexture(i.TEXTURE0), i.bindTexture(i.TEXTURE_2D, l);
			try {
				i.texImage2D(i.TEXTURE_2D, 0, i.RGBA, i.RGBA, i.UNSIGNED_BYTE, n);
			} catch (e) {
				console.warn("WebGL texImage2D failed", e), u("texImage2D");
				return;
			}
			u("texImage2D"), i.uniform1i(s.u_image, 0);
			let d = e || (r ? r() : {}), f = Number(d.exposureEV) || 0, p = Math.max(.1, Math.min(3, Number(d.gamma) || 1)), m = +(d.analysisMode === "zebra"), h = 0;
			d.channel === "r" && (h = 1), d.channel === "g" && (h = 2), d.channel === "b" && (h = 3), i.uniform1f(s.u_exposure, 2 ** f), i.uniform1f(s.u_gamma, 1 / p), i.uniform1i(s.u_channel, h), i.uniform1i(s.u_analysis, m), i.uniform1f(s.u_thresh, d.zebraThreshold ?? .95), i.uniform2f(s.u_res, t.width, t.height), i.enableVertexAttribArray(s.position), i.bindBuffer(i.ARRAY_BUFFER, c), i.vertexAttribPointer(s.position, 2, i.FLOAT, !1, 0, 0), i.drawArrays(i.TRIANGLES, 0, 6), u("drawArrays");
		}
	}, g = (e) => {
		e.preventDefault(), s = !0, d();
	}, _ = () => {
		i = l(), s = !1, a = null, p();
	};
	return t.addEventListener("webglcontextlost", g), t.addEventListener("webglcontextrestored", _), {
		update: h,
		destroy: () => {
			if (c._destroyed = !0, c.ready = !1, d(), i) try {
				i.getExtension("WEBGL_lose_context")?.loseContext?.();
			} catch (e) {
				console.debug?.(e);
			}
			t.removeEventListener("webglcontextlost", g), t.removeEventListener("webglcontextrestored", _);
		}
	};
}
//#endregion
//#region ui/features/viewer/videoProcessor.ts
function or({ canvas: e, videoEl: t, disableWebGL: n, pauseDuringExecution: r = null, getGradeParams: i, isDefaultGrade: a, _tonemap: o, maxProcPixelsVideo: s, throttleFps: c, safeAddListener: l, safeCall: u, onReady: d } = {}) {
	let f = r == null ? !!T?.VIEWER_PAUSE_DURING_EXECUTION : !!r, p = null;
	if (!n && ir()) try {
		p = ar({
			canvas: e,
			videoEl: t,
			getGradeParams: i,
			isDefaultGrade: a,
			maxProcPixelsVideo: s
		});
	} catch (e) {
		console.warn("WebGL Init failed, falling back to 2D", e), p = null;
	}
	let m = p ? null : (() => {
		try {
			return e.getContext("2d", {
				willReadFrequently: !0,
				alpha: !0
			});
		} catch {
			return null;
		}
	})(), h = document.createElement("canvas"), g = (() => {
		try {
			return h.getContext("2d", {
				willReadFrequently: !0,
				alpha: !1
			});
		} catch {
			return null;
		}
	})(), _ = document.createElement("canvas");
	_.width = 1, _.height = 1;
	let v = (() => {
		try {
			return _.getContext("2d", {
				willReadFrequently: !0,
				alpha: !1
			});
		} catch {
			return null;
		}
	})(), y = {
		ready: !1,
		_rendering: !1,
		_destroyed: !1,
		_rvfc: null,
		_rafIdLoop: null,
		_rafIdSchedule: null,
		_seekRaf: null,
		_lastHeavyRenderAt: 0,
		_throttleTimer: null,
		_connectRAF: null,
		_connectTries: 0,
		_buffer: null,
		_lut: null,
		_lutKey: "",
		_lastFrameTime: -1,
		_lastHeavySig: "",
		_runtimePaused: !1
	}, b = [], x = (e, t) => re(s, e, t), S = () => {
		try {
			let n = Number(t?.videoWidth) || 0, r = Number(t?.videoHeight) || 0;
			if (!(n > 0 && r > 0)) return !1;
			y.naturalW = n, y.naturalH = r, y.scale = x(n, r);
			let i = Math.max(1, Math.round(n * y.scale)), a = Math.max(1, Math.round(r * y.scale));
			return h.width !== i && (h.width = i), h.height !== a && (h.height = a), p || (e.width !== i && (e.width = i), e.height !== a && (e.height = a)), e._mjrNaturalW = n, e._mjrNaturalH = r, e._mjrPixelScale = y.scale, y.ready = !0, !0;
		} catch {
			return !1;
		}
	}, C = () => {
		if (!g || !y.ready) return !1;
		try {
			return g.drawImage(t, 0, 0, h.width, h.height), !0;
		} catch {
			return !1;
		}
	}, w = () => {
		if (!y.ready) return;
		let n = y.lastParams || i?.() || {};
		if (p) {
			p.update(n);
			return;
		}
		if (!m || !g) return;
		if (a?.(n)) {
			try {
				m.clearRect(0, 0, e.width, e.height), m.drawImage(t, 0, 0, e.width, e.height);
			} catch (e) {
				console.debug?.(e);
			}
			return;
		}
		if (!C()) return;
		let r;
		try {
			r = g.getImageData(0, 0, h.width, h.height);
		} catch {
			try {
				m.clearRect(0, 0, e.width, e.height), m.drawImage(t, 0, 0, e.width, e.height);
			} catch (e) {
				console.debug?.(e);
			}
			return;
		}
		let o = h.width, s = h.height, c = y._buffer;
		if (!c || c.width !== o || c.height !== s) try {
			c = m.createImageData(o, s), y._buffer = c;
		} catch {
			try {
				c = new ImageData(o, s), y._buffer = c;
			} catch {
				return;
			}
		}
		if (!c) return;
		let l = Number(n.exposureEV) || 0, u = 1 / Math.max(.1, Math.min(3, Number(n.gamma) || 1)), d = String(n.channel || "rgb"), f = String(n.analysisMode || "none"), _ = P(n.zebraThreshold ?? .95), v = 2 ** l, b = r.data, x = c.data, S = f !== "zebra" && d === "rgb", w = null;
		if (S) {
			let e = `${v.toFixed(6)}|${u.toFixed(6)}`;
			if (!y._lut || y._lutKey !== e) {
				let t = new Uint8ClampedArray(256);
				for (let e = 0; e < 256; e += 1) {
					let n = e / 255;
					t[e] = Math.round(P(n * v) ** +u * 255);
				}
				y._lut = t, y._lutKey = e;
			}
			w = y._lut;
		}
		if (w) for (let e = 0; e < x.length; e += 4) x[e] = w[b[e] ?? 0], x[e + 1] = w[b[e + 1] ?? 0], x[e + 2] = w[b[e + 2] ?? 0], x[e + 3] = 255;
		else for (let e = 0; e < x.length; e += 4) {
			let t = (b[e] ?? 0) / 255, n = (b[e + 1] ?? 0) / 255, r = (b[e + 2] ?? 0) / 255, i = (b[e + 3] ?? 255) / 255, a = t * v, s = n * v, c = r * v, l = .2126 * a + .7152 * s + .0722 * c;
			if (f === "zebra") if (P(l) >= _) {
				let t = (Math.floor(e / 4) % o + Math.floor(e / 4 / o) & 7) < 3;
				a = +!!t, s = +!!t, c = +!!t;
			} else a = P(a) ** +u, s = P(s) ** +u, c = P(c) ** +u;
			else a = P(a) ** +u, s = P(s) ** +u, c = P(c) ** +u;
			if (d === "r") s = a, c = a;
			else if (d === "g") a = s, c = s;
			else if (d === "b") a = c, s = c;
			else if (d === "a") a = i, s = i, c = i;
			else if (d === "l") {
				let e = P(l) ** +u;
				a = e, s = e, c = e;
			}
			x[e] = Math.round(P(a) * 255), x[e + 1] = Math.round(P(s) * 255), x[e + 2] = Math.round(P(c) * 255), x[e + 3] = 255;
		}
		try {
			m.putImageData(c, 0, 0);
		} catch (e) {
			console.debug?.(e);
		}
	}, E = () => {
		if (!y._destroyed && e?.isConnected && (y.ready || S(), y.ready)) {
			try {
				let e = y.lastParams || i?.() || {};
				if (!a?.(e)) {
					let n = Number(t?.currentTime) || 0, r = `${Number(e.exposureEV) || 0}|${Number(e.gamma) || 1}|${String(e.channel || "rgb")}|${String(e.analysisMode || "none")}|${Number(e.zebraThreshold ?? .95)}`;
					if (Math.abs(n - (Number(y._lastFrameTime) || 0)) < 1e-6 && r === String(y._lastHeavySig || "")) return;
					y._lastFrameTime = n, y._lastHeavySig = r;
				}
			} catch (e) {
				console.debug?.(e);
			}
			w();
		}
	}, O = () => {
		if (!y._destroyed) {
			try {
				if (e?.isConnected) {
					y._connectRAF = null, y._connectTries = 0, A();
					return;
				}
			} catch (e) {
				console.debug?.(e);
			}
			if (y._connectRAF == null) {
				if (y._connectTries = (Number(y._connectTries) || 0) + 1, y._connectTries > 20) {
					y._connectRAF = null, y._connectTries = 0;
					return;
				}
				try {
					y._connectRAF = requestAnimationFrame(() => {
						y._connectRAF = null, O();
					});
				} catch {
					y._connectRAF = null;
				}
			}
		}
	}, k = () => {
		try {
			let e = Number(c);
			return !Number.isFinite(e) || e <= 0 ? 0 : Math.max(0, Math.floor(1e3 / Math.max(1, e)));
		} catch {
			return 0;
		}
	}, A = () => {
		if (y._destroyed || y._runtimePaused || y._rendering) return;
		if (!e?.isConnected) {
			O();
			return;
		}
		let n = y.lastParams || i?.() || {}, r = !a?.(n), o = r && !t?.paused ? k() : 0;
		if (o > 0) {
			let e = Date.now(), t = (Number(y._lastHeavyRenderAt) || 0) + o;
			if (e < t) {
				try {
					y._throttleTimer && clearTimeout(y._throttleTimer);
				} catch (e) {
					console.debug?.(e);
				}
				try {
					y._throttleTimer = setTimeout(() => {
						try {
							y._throttleTimer = null;
						} catch (e) {
							console.debug?.(e);
						}
						A();
					}, Math.min(250, Math.max(0, t - e)));
				} catch (e) {
					console.debug?.(e);
				}
				return;
			}
		}
		y._rendering = !0;
		try {
			y._rafIdSchedule = requestAnimationFrame(() => {
				y._rafIdSchedule = null, y._rendering = !1, E();
				try {
					r && (y._lastHeavyRenderAt = Date.now());
				} catch (e) {
					console.debug?.(e);
				}
			});
		} catch {
			y._rendering = !1;
		}
	}, j = () => {
		if (y._destroyed || y._runtimePaused) return;
		try {
			y._rvfc != null && typeof t?.cancelVideoFrameCallback == "function" && (t.cancelVideoFrameCallback(y._rvfc), y._rvfc = null);
		} catch (e) {
			console.debug?.(e);
		}
		try {
			y._rafIdLoop != null && (cancelAnimationFrame(y._rafIdLoop), y._rafIdLoop = null);
		} catch (e) {
			console.debug?.(e);
		}
		try {
			if (typeof t?.requestVideoFrameCallback == "function") {
				let n = () => {
					if (!y._destroyed && e?.isConnected && (A(), !t.paused)) try {
						y._rvfc = t.requestVideoFrameCallback(n);
					} catch (e) {
						console.debug?.(e);
					}
				};
				try {
					y._rvfc = t.requestVideoFrameCallback(n);
				} catch (e) {
					console.debug?.(e);
				}
				return;
			}
		} catch (e) {
			console.debug?.(e);
		}
		let n = () => {
			if (!y._destroyed && e?.isConnected && (A(), !t.paused)) try {
				y._rafIdLoop = requestAnimationFrame(n);
			} catch (e) {
				console.debug?.(e);
			}
		};
		try {
			y._rafIdLoop = requestAnimationFrame(n);
		} catch (e) {
			console.debug?.(e);
		}
	}, M = (e) => {
		y.lastParams = e || y.lastParams || i?.(), A();
	}, N = () => {
		y._runtimePaused = !0;
		try {
			y._throttleTimer && clearTimeout(y._throttleTimer);
		} catch (e) {
			console.debug?.(e);
		}
		y._throttleTimer = null;
		try {
			y._rvfc != null && typeof t?.cancelVideoFrameCallback == "function" && t.cancelVideoFrameCallback(y._rvfc);
		} catch (e) {
			console.debug?.(e);
		}
		y._rvfc = null;
		try {
			y._rafIdLoop != null && cancelAnimationFrame(y._rafIdLoop);
		} catch (e) {
			console.debug?.(e);
		}
		y._rafIdLoop = null;
		try {
			y._rafIdSchedule != null && cancelAnimationFrame(y._rafIdSchedule);
		} catch (e) {
			console.debug?.(e);
		}
		y._rafIdSchedule = null;
		try {
			y._seekRaf != null && cancelAnimationFrame(y._seekRaf);
		} catch (e) {
			console.debug?.(e);
		}
		y._seekRaf = null, y._rendering = !1;
	}, ee = () => {
		if (y._runtimePaused = !1, t?.paused) {
			A();
			return;
		}
		j(), A();
	}, te = (e, t) => {
		try {
			if (y.ready || S(), !y.ready) return null;
			C();
			let n = y.scale || 1, r = Math.max(0, Math.min(h.width - 1, Math.floor((Number(e) || 0) * n))), i = Math.max(0, Math.min(h.height - 1, Math.floor((Number(t) || 0) * n)));
			if (!v) return null;
			v.clearRect(0, 0, 1, 1), v.drawImage(h, r, i, 1, 1, 0, 0, 1, 1);
			let a = v.getImageData(0, 0, 1, 1)?.data;
			if (!a || a.length < 4) return null;
			let o = a[0] ?? 0, s = a[1] ?? 0, c = a[2] ?? 0, l = a[3] ?? 255, u = [
				o / 255,
				s / 255,
				c / 255,
				l / 255
			], d = 2 ** (Number(y.lastParams?.exposureEV) || 0);
			return {
				r: o,
				g: s,
				b: c,
				a: l,
				raw: u,
				lin: [
					u[0] * d,
					u[1] * d,
					u[2] * d,
					u[3]
				],
				scale: y.scale
			};
		} catch {
			return null;
		}
	}, F = () => {
		S(), A();
		try {
			d?.({
				naturalW: y.naturalW,
				naturalH: y.naturalH,
				pixelScale: y.scale
			});
		} catch (e) {
			console.debug?.(e);
		}
	}, ne = (e) => {
		if (f) {
			if (String(e?.detail?.active_prompt_id || "").trim()) {
				N();
				return;
			}
			ee();
		}
	};
	try {
		let n = () => {
			y._runtimePaused || j();
		}, r = () => {
			try {
				y._seekRaf != null && cancelAnimationFrame(y._seekRaf);
			} catch (e) {
				console.debug?.(e);
			}
			y._seekRaf = null;
		};
		b.push(l?.(t, "loadedmetadata", F, { once: !0 }) || (() => {})), b.push(l?.(t, "seeking", () => {
			if (y._destroyed || y._runtimePaused) return;
			try {
				if (!t?.paused) {
					A();
					return;
				}
			} catch (e) {
				console.debug?.(e);
			}
			if (y._seekRaf != null) return;
			let n = () => {
				if (y._seekRaf = null, y._destroyed || !e?.isConnected) return;
				A();
				let r = !1;
				try {
					r = !!t?.seeking;
				} catch (e) {
					console.debug?.(e);
				}
				if (r) try {
					y._seekRaf = requestAnimationFrame(n);
				} catch (e) {
					console.debug?.(e);
				}
			};
			try {
				y._seekRaf = requestAnimationFrame(n);
			} catch (e) {
				console.debug?.(e);
			}
		}, { passive: !0 }) || (() => {})), b.push(l?.(t, "seeked", () => {
			r(), A();
		}, { passive: !0 }) || (() => {})), b.push(l?.(t, "pause", A, { passive: !0 }) || (() => {})), b.push(l?.(t, "play", n, { passive: !0 }) || (() => {})), b.push(l?.(t, "timeupdate", () => {
			try {
				if (!t?.paused && typeof t?.requestVideoFrameCallback == "function") return;
			} catch (e) {
				console.debug?.(e);
			}
			A();
		}, { passive: !0 }) || (() => {})), b.push(l?.(t, "error", () => {
			y.ready = !1;
			try {
				let n = t?.error?.code, r = t?.error?.message || "", i, a;
				n === 2 ? (i = "Failed to load video (network / path error)", a = "Check file permissions / path, or try re-indexing.") : n === 3 ? (i = "Failed to load video (decode error - unsupported codec?)", a = "Browser may not support this codec (e.g. H.265/HEVC). Try converting to H.264/MP4.") : n === 4 ? (i = "Failed to load video (unsupported format or codec)", a = "Browser cannot decode this file (e.g. H.265/HEVC). Try converting to H.264/MP4.") : (i = "Failed to load video", a = r || "Check file permissions / path, or try re-indexing."), console.warn("[MJR] Video load error", {
					code: n,
					message: r,
					src: t?.src
				}), se(e, i, a);
			} catch (e) {
				console.debug?.(e);
			}
		}, { passive: !0 }) || (() => {})), f && (window.addEventListener(D.RUNTIME_STATUS, ne), String(window?.__MJR_EXECUTION_RUNTIME__?.active_prompt_id || "").trim() && N());
	} catch (e) {
		console.debug?.(e);
	}
	return {
		setParams: M,
		sampleAtOriginal: te,
		getInfo: () => ({
			...y,
			renderer: p ? "webgl" : "2d"
		}),
		pause: N,
		resume: ee,
		destroy: () => {
			p && p.destroy(), y._destroyed = !0;
			try {
				window.removeEventListener(D.RUNTIME_STATUS, ne);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				y._throttleTimer && clearTimeout(y._throttleTimer);
			} catch (e) {
				console.debug?.(e);
			}
			y._throttleTimer = null;
			try {
				y._connectRAF != null && cancelAnimationFrame(y._connectRAF);
			} catch (e) {
				console.debug?.(e);
			}
			y._connectRAF = null, y._connectTries = 0;
			try {
				y._rvfc != null && typeof t?.cancelVideoFrameCallback == "function" && t.cancelVideoFrameCallback(y._rvfc);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				y._rafIdLoop != null && cancelAnimationFrame(y._rafIdLoop);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				y._rafIdSchedule != null && cancelAnimationFrame(y._rafIdSchedule);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				y._seekRaf != null && cancelAnimationFrame(y._seekRaf);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				for (let e of b) u?.(e);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				h.width = 0, h.height = 0;
			} catch (e) {
				console.debug?.(e);
			}
			try {
				e.width = 0, e.height = 0;
			} catch (e) {
				console.debug?.(e);
			}
			y._buffer = null;
		}
	};
}
//#endregion
//#region ui/features/viewer/audioVisualizer.ts
function sr(e, t, n) {
	let r = Number(e);
	return Number.isFinite(r) ? Math.max(t, Math.min(n, r)) : t;
}
function cr(e) {
	try {
		let t = String(e || "").toLowerCase();
		if (t === "simple" || t === "artistic") return t;
		if (t === "webgl" || t === "webgl3d") return "simple";
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let e = String(T?.VIEWER_AUDIO_VISUALIZER_MODE || "simple").toLowerCase();
		if (e === "artistic") return "artistic";
		if (e === "webgl3d" || e === "webgl") return "simple";
	} catch (e) {
		console.debug?.(e);
	}
	return "simple";
}
function lr(e) {
	let t = e.getContext("2d");
	if (!t) return null;
	let n = (e, t) => {
		try {
			let n = Math.max(0, Math.min(e.length - 1, Math.floor(t * (e.length - 1))));
			return (Number(e[n]) || 0) / 255;
		} catch {
			return 0;
		}
	}, r = (e, t) => {
		let r = n(e, .18 + t * .18), i = n(e, .28 + t * .16), a = n(e, .4 + t * .06), o = n(e, .46 + t * .03);
		return r * .28 + i * .36 + a * .24 + o * .12;
	}, i = (e, t) => {
		let r = n(e, .01 + t * .06), i = n(e, .04 + t * .07), a = n(e, .09 + t * .04);
		return r * .45 + i * .35 + a * .2;
	}, a = (e, t) => {
		let r = n(e, .64 + t * .18), i = n(e, .78 + t * .12), a = n(e, .92 + t * .06);
		return r * .34 + i * .38 + a * .28;
	};
	return {
		draw(n, o, s = 0) {
			try {
				let o = e.width || 0, c = e.height || 0;
				if (!(o > 1 && c > 1)) return;
				let l = Number(s) * .001 * .12 % 1;
				t.clearRect(0, 0, o, c);
				let u = o * .5, d = c * .52, f = Math.max(36, Math.min(140, Math.floor(o / 12))), p = Math.min(o * .56, f * 8), m = p / Math.max(1, f - 1), h = u - p * .5, g = d - c * .08;
				t.fillStyle = "rgba(255,255,255,0.95)";
				for (let e = 0; e < f; e++) {
					let i = h + e * m, a = r(n, (e / Math.max(1, f - 1) + l) % 1), o = g - a * c * .11, s = 1.2 + a * 1.2;
					t.beginPath(), t.arc(i, o, s, 0, Math.PI * 2), t.fill();
				}
				t.fillStyle = "rgba(255,255,255,0.9)";
				for (let e = 0; e < f; e++) {
					let n = h + e * m;
					t.beginPath(), t.arc(n, d, 1.6, 0, Math.PI * 2), t.fill();
				}
				let _ = Math.max(1.5, m * .45);
				for (let e = 0; e < f; e++) {
					let r = h + e * m, o = e / Math.max(1, f - 1), s = (o + l) % 1, u = i(n, s), p = a(n, s), g = 1 - Math.abs(o * 2 - 1), v = ((u * .62 + p * .38) * .84 + g * .16) ** 1.1 * c * .32;
					t.fillStyle = "rgba(255,255,255,0.96)", t.fillRect(r - _ * .5, d + 1, _, v);
				}
			} catch (e) {
				console.debug?.(e);
			}
		},
		destroy() {}
	};
}
function ur(e, { pseudo3d: t = !1 } = {}) {
	let n = null;
	try {
		n = e.getContext("webgl", {
			antialias: !0,
			alpha: !0,
			preserveDrawingBuffer: !0
		});
	} catch {
		n = null;
	}
	if (!n) return null;
	let r = (e, t) => {
		let r = n.createShader(e);
		return r ? (n.shaderSource(r, t), n.compileShader(r), n.getShaderParameter(r, n.COMPILE_STATUS) ? r : (n.deleteShader(r), null)) : null;
	}, i = r(n.VERTEX_SHADER, "\nattribute vec2 aPos;\nvoid main() {\n  gl_Position = vec4(aPos, 0.0, 1.0);\n}\n"), a = r(n.FRAGMENT_SHADER, "\nprecision mediump float;\nuniform vec4 uColor;\nvoid main() {\n  gl_FragColor = uColor;\n}\n");
	if (!i || !a) return null;
	let o = n.createProgram();
	if (!o || (n.attachShader(o, i), n.attachShader(o, a), n.linkProgram(o), !n.getProgramParameter(o, n.LINK_STATUS))) return null;
	n.useProgram(o);
	let s = n.getAttribLocation(o, "aPos"), c = n.getUniformLocation(o, "uColor"), l = n.createBuffer();
	if (!l || s < 0 || !c) return null;
	let u = (e, t) => {
		n.bindBuffer(n.ARRAY_BUFFER, l), n.bufferData(n.ARRAY_BUFFER, e, n.DYNAMIC_DRAW), n.enableVertexAttribArray(s), n.vertexAttribPointer(s, 2, n.FLOAT, !1, 0, 0), n.uniform4f(c, t[0], t[1], t[2], t[3]), n.drawArrays(n.LINE_STRIP, 0, Math.floor(e.length / 2));
	}, d = (e, t) => {
		try {
			let n = Math.max(0, Math.min(e.length - 1, Math.floor(t * (e.length - 1))));
			return (Number(e[n]) || 0) / 255;
		} catch {
			return 0;
		}
	}, f = (e, t) => {
		let n = d(e, .18 + t * .18), r = d(e, .28 + t * .16), i = d(e, .4 + t * .06), a = d(e, .46 + t * .03);
		return n * .28 + r * .36 + i * .24 + a * .12;
	}, p = (e, t) => {
		let n = d(e, .01 + t * .06), r = d(e, .04 + t * .07), i = d(e, .09 + t * .04);
		return n * .45 + r * .35 + i * .2;
	}, m = (e, t) => {
		let n = d(e, .64 + t * .18), r = d(e, .78 + t * .12), i = d(e, .92 + t * .06);
		return n * .34 + r * .38 + i * .28;
	};
	return {
		draw(r, i, a = 0) {
			try {
				n.viewport(0, 0, e.width || 1, e.height || 1), n.clearColor(0, 0, 0, 0), n.clear(n.COLOR_BUFFER_BIT);
				let i = Math.max(48, Math.min(180, Math.floor((e.width || 640) / 7))), o = Number(a) * .001, s = new Float32Array(i * 2);
				for (let e = 0; e < i; e++) {
					let n = e / Math.max(1, i - 1), a = n * 2 - 1, c = f(r, n), l = t ? Math.sin(n * Math.PI * 4 + o * 1.1) * .18 : 0, u = t ? 1 / (1 + Math.max(-.7, l) * .8) : 1, d = sr((.18 + c * .32) * u, -.95, .95);
					s[e * 2] = a, s[e * 2 + 1] = d;
				}
				u(s, [
					1,
					1,
					1,
					.95
				]);
				let c = new Float32Array(i * 2);
				for (let e = 0; e < i; e++) {
					let n = e / Math.max(1, i - 1), a = n * 2 - 1, s = p(r, n), l = m(r, n), u = s * .62 + l * .38, d = t ? Math.sin(n * Math.PI * 3 + o * 1) * .14 : 0, f = t ? 1 / (1 + Math.max(-.7, d) * .8) : 1, h = sr(-u * .62 * f, -.95, 0);
					c[e * 2] = a, c[e * 2 + 1] = h;
				}
				u(c, [
					1,
					1,
					1,
					.9
				]);
			} catch (e) {
				console.debug?.(e);
			}
		},
		destroy() {
			try {
				n.deleteBuffer(l);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				n.deleteProgram(o);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				n.deleteShader(i);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				n.deleteShader(a);
			} catch (e) {
				console.debug?.(e);
			}
		}
	};
}
function dr({ canvas: e, audioEl: t, mode: n, pauseDuringExecution: r = null } = {}) {
	if (!e || !t) return { destroy() {} };
	let i = r == null ? !!T?.VIEWER_PAUSE_DURING_EXECUTION : !!r, a = null, o = !1, s = null, c = null, l = null, u = null, d = null, f = null, p = 0, m = !1, h = 1e3 / sr(T?.VIEWER_AUDIO_VIS_FPS ?? 24, 8, 60), g = cr(n), _ = () => {
		try {
			let t = sr(window.devicePixelRatio || 1, 1, 2), n = Math.max(32, Math.floor((e.clientWidth || 640) * t)), r = Math.max(24, Math.floor((e.clientHeight || 140) * t));
			e.width !== n && (e.width = n), e.height !== r && (e.height = r);
		} catch (e) {
			console.debug?.(e);
		}
	}, v = (t = g) => {
		g = cr(t);
		try {
			f?.destroy?.();
		} catch (e) {
			console.debug?.(e);
		}
		f = null;
		try {
			_();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			g === "artistic" && !T?.VIEWER_DISABLE_WEBGL_AUDIO && (f = ur(e, { pseudo3d: !0 }));
		} catch (e) {
			console.debug?.(e);
		}
		if (!f) try {
			f = lr(e);
		} catch (e) {
			console.debug?.(e), f = null;
		}
		return p = 0, g;
	}, y = () => {
		if (!(o || l)) try {
			let e = window.AudioContext || window.webkitAudioContext;
			if (!e) return;
			s = new e(), c = s.createMediaElementSource(t), l = s.createAnalyser(), l.fftSize = 1024, l.smoothingTimeConstant = .8, c.connect(l), l.connect(s.destination), u = new Uint8Array(l.frequencyBinCount), d = new Uint8Array(l.fftSize), f || v(g);
		} catch {
			l = null;
		}
	}, b = (e) => {
		if (!o) {
			try {
				a = requestAnimationFrame(b);
			} catch {
				a = null;
				return;
			}
			if (!m && !(!l || !f) && !(e - p < h)) {
				p = e;
				try {
					_(), l.getByteFrequencyData(u), l.getByteTimeDomainData(d), f.draw(u, d, e);
				} catch (e) {
					console.debug?.(e);
				}
			}
		}
	}, x = async () => {
		try {
			if (m || (y(), !s)) return;
			if (s.state === "suspended") try {
				await s.resume();
			} catch (e) {
				console.debug?.(e);
			}
			a ??= requestAnimationFrame(b);
		} catch (e) {
			console.debug?.(e);
		}
	}, S = () => {
		try {
			a != null && cancelAnimationFrame(a);
		} catch (e) {
			console.debug?.(e);
		}
		a = null;
	}, C = () => {
		x();
	}, w = () => S(), E = () => S(), O = () => _(), k = (e) => {
		if (i) {
			if (m = !!String(e?.detail?.active_prompt_id || "").trim(), m) {
				S();
				return;
			}
			t?.paused || x();
		}
	};
	try {
		_(), v(g);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		t.addEventListener("play", C, { passive: !0 }), t.addEventListener("pause", w, { passive: !0 }), t.addEventListener("ended", E, { passive: !0 }), window.addEventListener("resize", O, { passive: !0 }), i && (window.addEventListener(D.RUNTIME_STATUS, k), String(window?.__MJR_EXECUTION_RUNTIME__?.active_prompt_id || "").trim() && (m = !0));
	} catch (e) {
		console.debug?.(e);
	}
	return {
		setMode(e) {
			return o ? g : v(e);
		},
		destroy() {
			if (!o) {
				o = !0, S();
				try {
					t.removeEventListener("play", C), t.removeEventListener("pause", w), t.removeEventListener("ended", E), window.removeEventListener("resize", O), window.removeEventListener(D.RUNTIME_STATUS, k);
				} catch (e) {
					console.debug?.(e);
				}
				try {
					f?.destroy?.();
				} catch (e) {
					console.debug?.(e);
				}
				try {
					c?.disconnect?.();
				} catch (e) {
					console.debug?.(e);
				}
				try {
					l?.disconnect?.();
				} catch (e) {
					console.debug?.(e);
				}
				try {
					s?.close?.();
				} catch (e) {
					console.debug?.(e);
				}
				c = null, l = null, s = null, f = null;
			}
		}
	};
}
//#endregion
//#region ui/features/viewer/mediaFactory.ts
function fr({ overlay: e, state: t, mediaTransform: n, updateMediaNaturalSize: r, clampPanToBounds: i, applyTransform: a, scheduleOverlayRedraw: o, getGradeParams: s, isDefaultGrade: c, tonemap: l, maxProcPixels: u, maxProcPixelsVideo: d, disableWebGL: f, videoGradeThrottleFps: p, safeAddListener: m, safeCall: h } = {}) {
	let g = h || X, _ = m || Z, v = (e) => {
		try {
			let t = String(e?.ext || "").trim().toLowerCase();
			if (t) return t.startsWith(".") ? t : `.${t}`;
		} catch (e) {
			console.debug?.(e);
		}
		try {
			let t = String(e?.filename || e?.filepath || "").trim(), n = t.lastIndexOf(".");
			if (n >= 0) return t.slice(n).toLowerCase();
		} catch (e) {
			console.debug?.(e);
		}
		return "";
	}, y = (e) => {
		let t = v(e);
		return t === ".gif" || t === ".webp";
	}, b = (e, s) => {
		let c = document.createElement("img");
		c.className = "mjr-viewer-media";
		try {
			e?.id != null && c?.dataset && (c.dataset.mjrAssetId = String(e.id));
		} catch (e) {
			console.debug?.(e);
		}
		c.alt = String(e?.filename || "") || "image";
		try {
			c.decoding = "async";
		} catch (e) {
			console.debug?.(e);
		}
		try {
			c.loading = "eager";
		} catch (e) {
			console.debug?.(e);
		}
		try {
			c.draggable = !1;
		} catch (e) {
			console.debug?.(e);
		}
		c.src = s, c.style.cssText = `
            max-width: 100%;
            max-height: 100%;
            display: block;
            transform: ${n?.() || ""};
            transform-origin: center center;
        `;
		let l = () => {
			try {
				requestAnimationFrame(() => {
					try {
						t?._userInteracted || (r?.(), i?.(), a?.());
					} catch (e) {
						console.debug?.(e);
					}
				});
			} catch (e) {
				console.debug?.(e);
			}
			try {
				o?.();
			} catch (e) {
				console.debug?.(e);
			}
		}, u = () => {
			try {
				let t = document.createElement("canvas");
				t.className = "mjr-viewer-media";
				try {
					e?.id != null && t?.dataset && (t.dataset.mjrAssetId = String(e.id));
				} catch (e) {
					console.debug?.(e);
				}
				x(t, e), t.style.cssText = `
                    max-width: 100%;
                    max-height: 100%;
                    display: block;
                    transform: ${n?.() || ""};
                    transform-origin: center center;
                `, se(t, "Failed to load image"), c.replaceWith(t);
			} catch (e) {
				console.debug?.(e);
			}
		};
		try {
			c.addEventListener("load", l, { once: !0 });
		} catch (e) {
			console.debug?.(e);
		}
		try {
			c.addEventListener("error", u, { once: !0 });
		} catch (e) {
			console.debug?.(e);
		}
		return c;
	}, x = (e, t) => {
		try {
			if (!e || !(e instanceof HTMLCanvasElement)) return;
			let n = Number(t?.width) || 0, r = Number(t?.height) || 0;
			if (!(n > 0 && r > 0)) return;
			!Number(e._mjrNaturalW) && !Number(e._mjrNaturalH) && (e._mjrNaturalW = n, e._mjrNaturalH = r);
		} catch (e) {
			console.debug?.(e);
		}
	}, S = (e) => {
		try {
			return Nt(e);
		} catch {
			return null;
		}
	}, C = (e, t, n, r = "metadata") => {
		try {
			let i = Number(n);
			if (!Number.isFinite(i) || i <= 0) return;
			let a = Math.round(i * 1e3) / 1e3, o = String(e?._mjrDetectedFpsSource || "");
			if (r === "rvfc" && o && o !== "rvfc") return;
			let s = Number(e?._mjrDetectedFps || 0) || 0;
			if (s > 0 && Math.abs(s - a) < .01) return;
			e._mjrDetectedFps = a, e._mjrDetectedFpsSource = String(r || "metadata"), window.dispatchEvent(new CustomEvent("mjr:viewer-fps-detected", { detail: {
				fps: a,
				source: String(r || "metadata"),
				assetId: t?.id == null ? "" : String(t.id)
			} }));
		} catch (e) {
			console.debug?.(e);
		}
	}, w = (e, t) => {
		let n = !1;
		try {
			let r = S(t);
			r && (n = !0, C(e, t, r, "asset-metadata"));
		} catch (e) {
			console.debug?.(e);
		}
		try {
			e.addEventListener("loadedmetadata", () => {
				try {
					let r = S(t);
					r && (n = !0, C(e, t, r, "loadedmetadata"));
				} catch (e) {
					console.debug?.(e);
				}
			}, { once: !0 });
		} catch (e) {
			console.debug?.(e);
		}
		try {
			if (n || typeof e?.requestVideoFrameCallback != "function") return;
			let r = null, i = 0, a = 0, o = !1, s = (c, l) => {
				try {
					if (n || o) return;
					let c = Number(l?.mediaTime);
					if (Number.isFinite(c) && c >= 0) {
						if (r != null) {
							let e = c - r;
							e > 0 && e < 1 && (a += e, i += 1);
						}
						r = c;
					}
					if (i >= 10) {
						let n = a / Math.max(1, i), r = n > 0 ? 1 / n : 0;
						Number.isFinite(r) && r > 1 && (o = !0, C(e, t, r, "rvfc"));
					}
					i < 10 && !o && e.requestVideoFrameCallback(s);
				} catch (e) {
					console.debug?.(e);
				}
			};
			e.requestVideoFrameCallback(s);
		} catch (e) {
			console.debug?.(e);
		}
	}, E = (e, n, { compare: r = !1 } = {}) => {
		let i = document.createElement("div");
		if (i.className = "mjr-viewer-audio-shell", !r) {
			let t = document.createElement("div");
			t.className = "mjr-viewer-audio-header";
			let n = document.createElement("span");
			n.className = "mjr-viewer-audio-icon", n.innerHTML = "<i class=\"pi pi-volume-up\" aria-hidden=\"true\"></i>";
			let r = document.createElement("div");
			r.className = "mjr-viewer-audio-title-wrap";
			let a = document.createElement("div");
			a.className = "mjr-viewer-audio-title", a.textContent = String(e?.display_name || e?.displayName || e?.filename || "Audio");
			let o = document.createElement("div");
			o.className = "mjr-viewer-audio-meta";
			let s = String(e?.filename || "").split(".").pop() || "audio";
			o.textContent = String(s || "audio").toUpperCase(), r.appendChild(a), r.appendChild(o), t.appendChild(n), t.appendChild(r), i.appendChild(t);
		}
		let a = document.createElement("canvas");
		a.className = "mjr-viewer-audio-viz";
		let o = document.createElement("audio");
		o.className = "mjr-viewer-audio-src", o.src = n, o.controls = !1, o.autoplay = !0, o.preload = "metadata";
		try {
			let e = dr({
				canvas: a,
				audioEl: o,
				mode: t?.audioVisualizerMode,
				pauseDuringExecution: !0
			});
			o._mjrAudioViz = e, a._mjrProc = e;
		} catch {
			o._mjrAudioViz = null, a._mjrProc = null;
		}
		return i.appendChild(a), i.appendChild(o), i;
	};
	function D(e, m) {
		let h = document.createElement("div");
		h.className = "mjr-video-host", h.style.cssText = "\n            width: 100%;\n            height: 100%;\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            position: relative;\n        ";
		let v = String(e?.kind || "").toLowerCase();
		if (ie(e) || v === "model3d") return oe(e, m, {
			hostClassName: "mjr-model3d-host mjr-viewer-model3d-host",
			canvasClassName: "mjr-viewer-media mjr-model3d-render-canvas",
			pauseDuringExecution: !0,
			scheduleOverlayRedraw: o,
			onReady: () => {
				try {
					requestAnimationFrame(() => {
						try {
							t?._userInteracted || (r?.(), i?.(), a?.());
						} catch (e) {
							console.debug?.(e);
						}
					});
				} catch (e) {
					console.debug?.(e);
				}
				try {
					o?.();
				} catch (e) {
					console.debug?.(e);
				}
			}
		});
		if (v && v !== "image" && v !== "video" && v !== "audio") {
			let t = document.createElement("canvas");
			t.className = "mjr-viewer-media";
			try {
				e?.id != null && t?.dataset && (t.dataset.mjrAssetId = String(e.id));
			} catch (e) {
				console.debug?.(e);
			}
			x(t, e), t.style.cssText = `
                max-width: 100%;
                max-height: 100%;
                display: block;
                transform: ${n?.() || ""};
                transform-origin: center center;
            `;
			try {
				se(t, `Unsupported file type: ${v}`);
			} catch (e) {
				console.debug?.(e);
			}
			return t;
		}
		if (v === "audio") return E(e, m, { compare: !1 });
		if (v === "video") {
			let u = document.createElement("canvas");
			u.className = "mjr-viewer-media";
			try {
				e?.id != null && u?.dataset && (u.dataset.mjrAssetId = String(e.id));
			} catch (e) {
				console.debug?.(e);
			}
			x(u, e), u.style.cssText = `
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
                display: block;
                transform: ${n?.() || ""};
                transform-origin: center center;
            `;
			let v = document.createElement("video");
			v.className = "mjr-viewer-video-src", v.src = m, v.controls = !1, v.loop = !0, v.playsInline = !0, v.muted = !0, v.autoplay = !0, v.preload = "auto";
			try {
				"decode" in HTMLVideoElement.prototype && (v.decoding = "async");
			} catch {}
			v.style.cssText = "position:absolute; width:1px; height:1px; opacity:0; pointer-events:none;", w(v, e);
			try {
				u._mjrProc = or({
					canvas: u,
					videoEl: v,
					disableWebGL: f || !!T.VIEWER_DISABLE_WEBGL_VIDEO,
					pauseDuringExecution: T.VIEWER_PAUSE_DURING_EXECUTION,
					getGradeParams: s,
					isDefaultGrade: c,
					tonemap: l,
					maxProcPixelsVideo: d,
					throttleFps: p,
					safeAddListener: _,
					safeCall: g,
					onReady: () => {
						try {
							requestAnimationFrame(() => {
								try {
									t?._userInteracted || (r?.(), i?.(), a?.());
								} catch (e) {
									console.debug?.(e);
								}
							});
						} catch (e) {
							console.debug?.(e);
						}
						try {
							o?.();
						} catch (e) {
							console.debug?.(e);
						}
					}
				}), u._mjrProc?.setParams?.(s?.());
			} catch (e) {
				console.debug?.(e);
			}
			try {
				v.addEventListener("canplay", () => {
					try {
						let e = v.play?.();
						e && typeof e.catch == "function" && e.catch(() => {
							try {
								se(u, "Autoplay blocked (press Space / Play)");
							} catch (e) {
								console.debug?.(e);
							}
						});
					} catch {
						try {
							se(u, "Autoplay blocked (press Space / Play)");
						} catch (e) {
							console.debug?.(e);
						}
					}
				}, { once: !0 });
			} catch (e) {
				console.debug?.(e);
			}
			return h.appendChild(u), h.appendChild(v), h;
		}
		if (y(e)) return b(e, m);
		let S = document.createElement("canvas");
		S.className = "mjr-viewer-media";
		try {
			e?.id != null && S?.dataset && (S.dataset.mjrAssetId = String(e.id));
		} catch (e) {
			console.debug?.(e);
		}
		x(S, e), S.style.cssText = `
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            display: block;
            transform: ${n?.() || ""};
            transform-origin: center center;
        `;
		try {
			S._mjrProc = ae({
				canvas: S,
				url: m,
				getGradeParams: s,
				isDefaultGrade: c,
				tonemap: l,
				maxProcPixels: u,
				onReady: () => {
					try {
						requestAnimationFrame(() => {
							try {
								t?._userInteracted || (r?.(), i?.(), a?.());
							} catch (e) {
								console.debug?.(e);
							}
						});
					} catch (e) {
						console.debug?.(e);
					}
					try {
						o?.();
					} catch (e) {
						console.debug?.(e);
					}
				}
			}), S._mjrProc?.setParams?.(s?.());
		} catch (e) {
			console.debug?.(e);
		}
		return S;
	}
	function O(e, f) {
		let m = String(e?.kind || "").toLowerCase();
		if (ie(e) || m === "model3d") return oe(e, f, {
			hostClassName: "mjr-model3d-host mjr-viewer-model3d-host",
			canvasClassName: "mjr-viewer-media mjr-model3d-render-canvas",
			pauseDuringExecution: !0,
			scheduleOverlayRedraw: o,
			onReady: () => {
				try {
					requestAnimationFrame(() => {
						try {
							t?._userInteracted || (r?.(), i?.(), a?.());
						} catch (e) {
							console.debug?.(e);
						}
					});
				} catch (e) {
					console.debug?.(e);
				}
				try {
					o?.();
				} catch (e) {
					console.debug?.(e);
				}
			}
		});
		if (m && m !== "image" && m !== "video" && m !== "audio") {
			let t = document.createElement("canvas");
			t.className = "mjr-viewer-media";
			try {
				e?.id != null && t?.dataset && (t.dataset.mjrAssetId = String(e.id));
			} catch (e) {
				console.debug?.(e);
			}
			x(t, e), t.style.cssText = `
                max-width: 100%;
                max-height: 100%;
                display: block;
                transform: ${n?.() || ""};
                transform-origin: center center;
            `;
			try {
				se(t, `Unsupported file type: ${m}`);
			} catch (e) {
				console.debug?.(e);
			}
			return t;
		}
		if (m === "audio") return E(e, f, { compare: !0 });
		if (m === "video") {
			let u = document.createElement("div");
			u.style.cssText = "width:100%; height:100%; position:relative; display:flex; align-items:center; justify-content:center;";
			let m = document.createElement("canvas");
			m.className = "mjr-viewer-media";
			try {
				e?.id != null && m?.dataset && (m.dataset.mjrAssetId = String(e.id));
			} catch (e) {
				console.debug?.(e);
			}
			x(m, e), m.style.cssText = `
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
                display: block;
                transform: ${n?.() || ""};
                transform-origin: center center;
            `;
			let h = document.createElement("video");
			h.className = "mjr-viewer-video-src", h.src = f, h.controls = !1, h.loop = !0, h.muted = !0, h.playsInline = !0, h.autoplay = !0, h.preload = "auto";
			try {
				"decode" in HTMLVideoElement.prototype && (h.decoding = "async");
			} catch {}
			h.style.cssText = "position:absolute; width:1px; height:1px; opacity:0; pointer-events:none;", w(h, e);
			try {
				m._mjrProc = or({
					canvas: m,
					videoEl: h,
					pauseDuringExecution: T.VIEWER_PAUSE_DURING_EXECUTION,
					getGradeParams: s,
					isDefaultGrade: c,
					tonemap: l,
					maxProcPixelsVideo: d,
					throttleFps: p,
					safeAddListener: _,
					safeCall: g,
					onReady: () => {
						try {
							requestAnimationFrame(() => {
								try {
									t?._userInteracted || (r?.(), i?.(), a?.());
								} catch (e) {
									console.debug?.(e);
								}
							});
						} catch (e) {
							console.debug?.(e);
						}
						try {
							o?.();
						} catch (e) {
							console.debug?.(e);
						}
					}
				}), m._mjrProc?.setParams?.(s?.());
			} catch (e) {
				console.debug?.(e);
			}
			return u.appendChild(m), u.appendChild(h), u;
		}
		if (y(e)) return b(e, f);
		let h = document.createElement("canvas");
		h.className = "mjr-viewer-media";
		try {
			e?.id != null && h?.dataset && (h.dataset.mjrAssetId = String(e.id));
		} catch (e) {
			console.debug?.(e);
		}
		x(h, e), h.style.cssText = `
            max-width: 100%;
            max-height: 100%;
            display: block;
            transform: ${n?.() || ""};
            transform-origin: center center;
        `;
		try {
			h._mjrProc = ae({
				canvas: h,
				url: f,
				getGradeParams: s,
				isDefaultGrade: c,
				tonemap: l,
				maxProcPixels: u,
				onReady: () => {
					try {
						requestAnimationFrame(() => {
							try {
								t?._userInteracted || (r?.(), i?.(), a?.());
							} catch (e) {
								console.debug?.(e);
							}
						});
					} catch (e) {
						console.debug?.(e);
					}
					try {
						o?.();
					} catch (e) {
						console.debug?.(e);
					}
				}
			}), h._mjrProc?.setParams?.(s?.());
		} catch (e) {
			console.debug?.(e);
		}
		return h;
	}
	return {
		createMediaElement: D,
		createCompareMediaElement: O,
		applyTransformToVisibleMedia: () => {
			try {
				let t = n?.() || "", r = e?.querySelectorAll?.(".mjr-viewer-media") || [];
				for (let e of r) try {
					if (e?._mjrDisableViewerTransform) continue;
					e.style.transform = t;
				} catch (e) {
					console.debug?.(e);
				}
			} catch (e) {
				console.debug?.(e);
			}
		}
	};
}
//#endregion
//#region ui/features/viewer/imagePreloader.ts
function pr({ buildAssetViewURL: e, IMAGE_PRELOAD_EXTENSIONS: t, state: n }) {
	function r(e) {
		if (!e) return null;
		if (e.id != null) return `id:${e.id}`;
		let t = e.filepath || e.path || e.filename;
		return t ? `path:${t}` : null;
	}
	function i(e) {
		if (!e) return !1;
		let n = String(e.kind || "").toLowerCase();
		if (n === "image" || n.startsWith("image/")) return !0;
		let r = String(e.filepath || e.path || e.filename || "").split(".").pop()?.toLowerCase() || "";
		return t.has(r);
	}
	function a(e) {
		if (e) try {
			n._preloadRefs = n._preloadRefs || /* @__PURE__ */ new Set(), n._preloadRefs.add(e);
			let t = () => {
				try {
					n._preloadRefs?.delete?.(e);
				} catch (e) {
					console.debug?.(e);
				}
			};
			e.addEventListener("load", t, {
				once: !0,
				passive: !0
			}), e.addEventListener("error", t, {
				once: !0,
				passive: !0
			});
		} catch (e) {
			console.debug?.(e);
		}
	}
	function o(e, t) {
		if (!e || !t || !i(e)) return;
		let o = r(e) || t;
		if (o) {
			if (n._preloadedAssetKeys = n._preloadedAssetKeys || /* @__PURE__ */ new Set(), n._preloadedAssetKeys.has(o)) return;
			if (n._preloadedAssetKeys.add(o), n._preloadedAssetKeys.size > 250) try {
				n._preloadedAssetKeys.clear();
			} catch (e) {
				console.debug?.(e);
			}
		}
		try {
			let e = new Image();
			e.decoding = "async";
			try {
				e.loading = "lazy";
			} catch (e) {
				console.debug?.(e);
			}
			e.alt = "", e.src = t, a(e);
		} catch (e) {
			console.debug?.(e);
		}
	}
	function s(t, n) {
		let r = Array.isArray(t) ? t : [];
		if (!r.length) return;
		let i = [
			n - 1,
			n + 1,
			n - 2,
			n + 2,
			n - 3,
			n + 3
		];
		for (let t of i) {
			if (t < 0 || t >= r.length) continue;
			let n = r[t];
			n && o(n, e(n));
		}
	}
	return {
		preloadAdjacentAssets: s,
		preloadImageForAsset: o,
		trackPreloadRef: a
	};
}
//#endregion
//#region ui/features/metadata/genInfoCompare.ts
function mr(e, t) {
	for (let n of t) {
		let t = n.split("."), r = e;
		for (let e of t) {
			if (r == null) break;
			r = r?.[e];
		}
		if (r != null && String(r).trim?.() !== "") return r;
	}
	return "";
}
function hr(e) {
	if (e == null) return "";
	if (typeof e == "string") return e.trim();
	if (typeof e == "number" || typeof e == "boolean") return String(e);
	try {
		return JSON.stringify(e);
	} catch {
		return String(e);
	}
}
var gr = [
	{
		key: "positive",
		label: "Positive Prompt",
		paths: [
			"geninfo.positive.value",
			"positive_prompt",
			"prompt"
		]
	},
	{
		key: "negative",
		label: "Negative Prompt",
		paths: ["geninfo.negative.value", "negative_prompt"]
	},
	{
		key: "model",
		label: "Model",
		paths: [
			"geninfo.checkpoint.name",
			"model",
			"checkpoint"
		]
	},
	{
		key: "lora",
		label: "LoRA",
		paths: [
			"geninfo.loras",
			"loras",
			"lora"
		]
	},
	{
		key: "sampler",
		label: "Sampler",
		paths: ["geninfo.sampler.name", "sampler"]
	},
	{
		key: "scheduler",
		label: "Scheduler",
		paths: ["geninfo.scheduler.name", "scheduler"]
	},
	{
		key: "steps",
		label: "Steps",
		paths: ["geninfo.steps.value", "steps"]
	},
	{
		key: "cfg",
		label: "CFG",
		paths: ["geninfo.cfg.value", "cfg"]
	},
	{
		key: "denoise",
		label: "Denoise",
		paths: ["geninfo.denoise.value", "denoise"]
	},
	{
		key: "seed",
		label: "Seed",
		paths: ["geninfo.seed.value", "seed"]
	},
	{
		key: "workflow_nodes",
		label: "Workflow Nodes",
		paths: ["geninfo.workflow_nodes", "workflow.nodes"]
	}
];
function _r(e, t) {
	return gr.map((n) => {
		let r = hr(mr(e, n.paths)), i = hr(mr(t, n.paths));
		return {
			key: n.key,
			label: n.label,
			left: r,
			right: i,
			changed: r !== i
		};
	}).filter((e) => e.left || e.right);
}
//#endregion
//#region ui/features/viewer/metadataCompare.ts
function vr(e) {
	return String(e ?? "").trim() || "-";
}
function yr(e, t) {
	let n = document.createElement("div");
	return n.textContent = vr(e), n.style.cssText = [
		"min-width:0",
		"white-space:pre-wrap",
		"overflow-wrap:anywhere",
		"font-size:11px",
		"line-height:1.35",
		"color:rgba(255,255,255,0.84)",
		t ? "background:rgba(255,193,7,0.10)" : "background:rgba(255,255,255,0.035)",
		"border:1px solid rgba(255,255,255,0.08)",
		"border-radius:6px",
		"padding:6px 7px"
	].join(";"), n;
}
function br(e, t) {
	let n = _r(e, t).filter((e) => vr(e?.left) !== "-" || vr(e?.right) !== "-");
	if (!n.length) return null;
	let r = document.createElement("div");
	r.style.cssText = "display:flex;flex-direction:column;gap:8px;margin:0 0 14px 0;padding:10px;border:1px solid rgba(144,220,220,0.22);border-radius:10px;background:rgba(90,220,220,0.06);";
	let i = document.createElement("div");
	i.textContent = C("viewer.metadataCompare", "Metadata compare"), i.style.cssText = "font-size:12px;font-weight:700;color:rgba(255,255,255,0.9);letter-spacing:0.02em", r.appendChild(i);
	for (let e of n.slice(0, 24)) {
		let t = document.createElement("div");
		t.style.cssText = "display:grid;grid-template-columns:minmax(74px,0.42fr) 1fr 1fr;gap:6px;align-items:start";
		let n = document.createElement("div");
		n.textContent = String(e?.label || e?.key || "").trim(), n.style.cssText = "font-size:11px;font-weight:650;color:rgba(255,255,255,0.70);padding-top:6px;overflow-wrap:anywhere", t.appendChild(n);
		let i = !!e?.changed;
		t.appendChild(yr(e?.left, i)), t.appendChild(yr(e?.right, i)), r.appendChild(t);
	}
	return r;
}
//#endregion
//#region ui/features/viewer/viewerInstanceManager.ts
function xr(e) {
	let t = d();
	if (t.length) {
		let e = t[t.length - 1];
		for (let n of t) if (n !== e) {
			try {
				n?._mjrViewerAPI?.dispose?.();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				n.remove?.();
			} catch (e) {
				console.debug?.(e);
			}
		}
		if (e && e._mjrViewerAPI) return e._mjrViewerAPI;
		try {
			e?.remove?.();
		} catch (e) {
			console.debug?.(e);
		}
	}
	let n = e();
	return l(n), n._mjrViewerAPI;
}
//#endregion
//#region ui/features/viewer/playerBarManager.ts
function Sr({ state: e, APP_CONFIG: t, VIEWER_MODES: n, overlay: r, navBar: i, playerBarHost: a, singleView: o, abView: s, sideView: c, metadataHydrator: l, isPlayableViewerKind: u, collectPlayableMediaElements: d, pickPrimaryPlayableMedia: f, mountUnifiedMediaControls: p, installFollowerVideoSync: m, getViewerInfo: h, scheduleOverlayRedraw: g, viewerInfoCacheGet: _, viewerInfoCacheSet: v }) {
	function y() {
		try {
			e._videoControlsDestroy && e._videoControlsDestroy();
		} catch (e) {
			console.debug?.(e);
		}
		e._videoControlsDestroy = null, e._videoControlsMounted = null, e._activeVideoEl = null, e._activeVideoAssetId = null, e.nativeFps = null;
		try {
			e._videoSyncAbort?.abort?.();
		} catch (e) {
			console.debug?.(e);
		}
		e._videoSyncAbort = null;
		try {
			e._videoRateAbort?.abort?.();
		} catch (e) {
			console.debug?.(e);
		}
		e._videoRateAbort = null;
		try {
			e._videoMetaAbort?.abort?.();
		} catch (e) {
			console.debug?.(e);
		}
		e._videoMetaAbort = null;
		try {
			e._videoFpsEventAbort?.abort?.();
		} catch (e) {
			console.debug?.(e);
		}
		e._videoFpsEventAbort = null;
		try {
			e._scopesVideoAbort?.abort?.();
		} catch (e) {
			console.debug?.(e);
		}
		e._scopesVideoAbort = null;
		try {
			a.innerHTML = "";
		} catch (e) {
			console.debug?.(e);
		}
		try {
			a.style.display = "none";
		} catch (e) {
			console.debug?.(e);
		}
		try {
			i.style.display = "";
		} catch (e) {
			console.debug?.(e);
		}
	}
	async function b() {
		try {
			let b = e.assets[e.currentIndex], x = b?.id ?? null;
			if (!u(b?.kind)) {
				y();
				return;
			}
			let S = null, C = [];
			try {
				C = d({
					mode: e.mode,
					VIEWER_MODES: n,
					singleView: o,
					abView: s,
					sideView: c
				});
			} catch {
				C = [];
			}
			try {
				S = f(C);
			} catch {
				S = C[0] || null;
			}
			if (!S) {
				y();
				return;
			}
			if (e._activeVideoEl && e._activeVideoEl === S && e._activeVideoAssetId === x && e._videoControlsDestroy) {
				try {
					i.style.display = "none", a.style.display = "";
				} catch (e) {
					console.debug?.(e);
				}
				return;
			}
			y();
			try {
				i.style.display = "none";
			} catch (e) {
				console.debug?.(e);
			}
			try {
				a.style.display = "";
			} catch (e) {
				console.debug?.(e);
			}
			let w, T;
			try {
				let e = (e) => {
					try {
						let t = Nt(e);
						return {
							fps: t,
							frameCount: Pt(e, t)
						};
					} catch {
						return {
							fps: null,
							frameCount: null
						};
					}
				}, t = e(b);
				if (t.fps != null && (w = t.fps), t.frameCount != null && (T = t.frameCount), w == null || T == null) {
					let t = l?.getCached?.(b?.id), n = t?.data ? e(t.data) : {
						fps: null,
						frameCount: null
					};
					w == null && n.fps != null && (w = n.fps), T == null && n.frameCount != null && (T = n.frameCount);
				}
			} catch (e) {
				console.debug?.(e);
			}
			try {
				if (w == null) {
					let e = Number(S?._mjrDetectedFps);
					Number.isFinite(e) && e > 0 && (w = e);
				}
			} catch (e) {
				console.debug?.(e);
			}
			let E = String(b?.kind || "").toLowerCase() === "audio" ? "audio" : "video", D = p(S, {
				variant: "viewerbar",
				hostEl: a,
				fullscreenEl: r,
				initialFps: w,
				initialFrameCount: T,
				initialPlaybackRate: Number(e?.playbackRate) || 1,
				mediaKind: E
			});
			e._videoControlsMounted = D || null, e._videoControlsDestroy = D?.destroy || null, e._activeVideoEl = S, e._activeVideoAssetId = x;
			try {
				e._videoRateAbort?.abort?.();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				let t = new AbortController();
				e._videoRateAbort = t, S.addEventListener("ratechange", () => {
					try {
						let t = Number(S.playbackRate);
						Number.isFinite(t) && t > 0 && (e.playbackRate = t);
					} catch (e) {
						console.debug?.(e);
					}
				}, {
					signal: t.signal,
					passive: !0
				});
			} catch (e) {
				console.debug?.(e);
			}
			try {
				e.nativeFps = Number(w) > 0 ? Number(w) : null;
			} catch (e) {
				console.debug?.(e);
			}
			try {
				if (E === "audio") {
					let e = S.play?.();
					e && typeof e.catch == "function" && e.catch(() => {});
				}
			} catch (e) {
				console.debug?.(e);
			}
			try {
				if (E === "video" && e.mode === n?.SINGLE) {
					S.muted = !1;
					let e = S.play?.();
					e && typeof e.catch == "function" && e.catch(() => {});
				}
			} catch (e) {
				console.debug?.(e);
			}
			try {
				e._scopesVideoAbort?.abort?.();
			} catch (e) {
				console.debug?.(e);
			}
			if (E === "video") try {
				let n = new AbortController();
				e._scopesVideoAbort = n;
				let i = () => {
					try {
						if (String(e?.scopesMode || "off") === "off") return;
					} catch (e) {
						console.debug?.(e);
					}
					g();
				};
				S.addEventListener("seeked", i, {
					signal: n.signal,
					passive: !0
				}), S.addEventListener("loadeddata", i, {
					signal: n.signal,
					passive: !0
				}), S.addEventListener("play", i, {
					signal: n.signal,
					passive: !0
				}), S.addEventListener("pause", i, {
					signal: n.signal,
					passive: !0
				});
				let a = 1e3 / Math.max(1, Math.min(30, Math.floor(Number(t.VIEWER_SCOPES_FPS) || 10))), o = () => {
					if (!n.signal.aborted) {
						try {
							if (document?.hidden) return;
						} catch (e) {
							console.debug?.(e);
						}
						try {
							if (r.style.display === "none") return;
						} catch (e) {
							console.debug?.(e);
						}
						try {
							if (String(e?.scopesMode || "off") !== "off" && !S.paused) {
								let t = performance.now();
								t - (Number(e?._scopesLastAt) || 0) >= a && (e._scopesLastAt = t, g());
							}
						} catch (e) {
							console.debug?.(e);
						}
						try {
							requestAnimationFrame(o);
						} catch (e) {
							console.debug?.(e);
						}
					}
				};
				try {
					requestAnimationFrame(o);
				} catch (e) {
					console.debug?.(e);
				}
			} catch (e) {
				console.debug?.(e);
			}
			else e._scopesVideoAbort = null;
			try {
				e._videoSyncAbort?.abort?.();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				if (e._videoSyncAbort = null, E === "video" && C.length > 1) {
					let t = C.filter((e) => e && e !== S);
					e._videoSyncAbort = m(S, t);
				}
			} catch (e) {
				console.debug?.(e);
			}
			if (E === "video") {
				try {
					let t = (e) => Mt(e), n = (e) => {
						let t = Number(e);
						return !Number.isFinite(t) || t <= 0 ? null : Math.floor(t);
					}, r = (r) => {
						try {
							if (!r || typeof r != "object") return;
							let i = t(r?.fps_raw ?? r?.fps ?? r?.frame_rate), a = n(r?.frame_count);
							i != null && (e.nativeFps = i), (i != null || a != null) && D?.setMediaInfo?.({
								fps: i,
								frameCount: a
							});
						} catch (e) {
							console.debug?.(e);
						}
					};
					try {
						let e = _(b?.id);
						e && r(e);
					} catch (e) {
						console.debug?.(e);
					}
					try {
						e._videoMetaAbort?.abort?.();
					} catch (e) {
						console.debug?.(e);
					}
					let i = new AbortController();
					e._videoMetaAbort = i, (async () => {
						try {
							let t = await h(b?.id, { signal: i.signal });
							if (!t?.ok || !t.data || e._activeVideoEl !== S) return;
							try {
								v(b?.id, t.data);
							} catch (e) {
								console.debug?.(e);
							}
							r(t.data);
						} catch (e) {
							console.debug?.(e);
						}
					})();
				} catch (e) {
					console.debug?.(e);
				}
				try {
					e._videoFpsEventAbort?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				try {
					let t = new AbortController();
					e._videoFpsEventAbort = t, window.addEventListener("mjr:viewer-fps-detected", (t) => {
						try {
							let n = t?.detail || {}, r = String(n?.assetId || ""), i = String(b?.id ?? "");
							if (!r || !i || r !== i || e._activeVideoEl !== S) return;
							let a = Number(n?.fps);
							if (!Number.isFinite(a) || a <= 0) return;
							let o = String(n?.source || "");
							(o !== "rvfc" || !(Number(e.nativeFps) > 0)) && (e.nativeFps = a), D?.setMediaInfo?.({
								fps: a,
								fpsSource: o
							});
						} catch (e) {
							console.debug?.(e);
						}
					}, {
						signal: t.signal,
						passive: !0
					});
				} catch (e) {
					console.debug?.(e);
				}
			} else {
				try {
					e._videoMetaAbort?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				e._videoMetaAbort = null;
				try {
					e._videoFpsEventAbort?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				e._videoFpsEventAbort = null;
			}
		} catch {
			y();
		}
	}
	return {
		destroyPlayerBar: y,
		syncPlayerBar: b
	};
}
//#endregion
//#region ui/features/viewer/viewerThemeStyles.ts
var Cr = "min(400px, 42vw)", wr = `calc(${Cr} + 24px)`, Tr = "mjr-viewer-modern-theme";
function Er() {
	try {
		if (document.getElementById(Tr)) return;
		let e = document.createElement("style");
		e.id = Tr, e.textContent = `
            .mjr-viewer-overlay {
                --mjr-viewer-surface: rgba(14, 18, 24, 0.78);
                --mjr-viewer-surface-strong: rgba(10, 13, 18, 0.9);
                --mjr-viewer-surface-soft: rgba(255, 255, 255, 0.045);
                --mjr-viewer-border: rgba(255, 255, 255, 0.11);
                --mjr-viewer-border-strong: rgba(255, 255, 255, 0.18);
                --mjr-viewer-shadow: 0 24px 80px rgba(0, 0, 0, 0.42);
                --mjr-viewer-shadow-soft: 0 14px 40px rgba(0, 0, 0, 0.22);
                --mjr-viewer-radius: 22px;
                isolation: isolate;
            }

            .mjr-viewer-overlay::before {
                content: "";
                position: absolute;
                inset: 0;
                pointer-events: none;
                background:
                    radial-gradient(circle at top left, rgba(87, 153, 255, 0.14), transparent 34%),
                    radial-gradient(circle at top right, rgba(78, 224, 196, 0.12), transparent 28%),
                    radial-gradient(circle at bottom center, rgba(255, 184, 107, 0.08), transparent 28%);
                opacity: 0.95;
                z-index: 0;
            }

            .mjr-viewer-overlay > * {
                position: relative;
                z-index: 1;
            }

            .mjr-viewer-header,
            .mjr-viewer-content-row,
            .mjr-filmstrip,
            .mjr-viewer-footer,
            .mjr-viewer-geninfo {
                box-shadow: var(--mjr-viewer-shadow-soft);
            }

            .mjr-viewer-header {
                margin: 18px 18px 0;
                border-radius: calc(var(--mjr-viewer-radius) - 2px);
                border: 1px solid var(--mjr-viewer-border) !important;
                backdrop-filter: blur(20px) saturate(140%);
            }

            .mjr-viewer-header-top {
                min-height: 42px;
            }

            .mjr-viewer-header-area--center {
                padding-inline: 8px;
            }

            .mjr-viewer-mode-buttons {
                padding: 4px;
                border-radius: 999px;
                background: rgba(255, 255, 255, 0.045);
                border: 1px solid rgba(255, 255, 255, 0.08);
                box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
            }

            .mjr-viewer-close,
            .mjr-viewer-fs,
            .mjr-viewer-nav-btn {
                border-color: rgba(255, 255, 255, 0.14) !important;
                background: rgba(255, 255, 255, 0.05) !important;
                backdrop-filter: blur(16px) saturate(140%);
                box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
                transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease;
            }

            .mjr-viewer-close:hover,
            .mjr-viewer-fs:hover,
            .mjr-viewer-nav-btn:hover {
                transform: translateY(-1px);
                background: rgba(255, 255, 255, 0.085) !important;
                border-color: rgba(255, 255, 255, 0.22) !important;
            }

            .mjr-viewer-content-row {
                margin: 14px 18px 0;
                border-radius: calc(var(--mjr-viewer-radius) + 2px);
                border: 1px solid var(--mjr-viewer-border);
                background:
                    linear-gradient(180deg, rgba(19, 24, 31, 0.78), rgba(10, 14, 20, 0.88)),
                    radial-gradient(circle at top, rgba(255, 255, 255, 0.04), transparent 42%);
                overflow: hidden;
                box-shadow: var(--mjr-viewer-shadow);
            }

            .mjr-viewer-content {
                background:
                    radial-gradient(circle at center, rgba(255, 255, 255, 0.035), transparent 55%),
                    linear-gradient(180deg, rgba(7, 10, 14, 0.28), rgba(7, 10, 14, 0.62));
            }

            .mjr-viewer-probe,
            .mjr-viewer-loupe {
                backdrop-filter: blur(14px) saturate(125%);
            }

            .mjr-viewer-geninfo {
                width: ${Cr} !important;
                top: 16px !important;
                bottom: 16px !important;
                border-radius: 20px;
                border: 1px solid var(--mjr-viewer-border-strong);
                background: linear-gradient(180deg, rgba(15, 19, 24, 0.92), rgba(9, 12, 16, 0.94)) !important;
                backdrop-filter: blur(22px) saturate(140%);
            }

            .mjr-viewer-geninfo--right {
                right: 16px !important;
            }

            .mjr-viewer-geninfo--left {
                left: 16px !important;
            }

            .mjr-viewer-footer {
                margin: 12px 18px 18px;
                border-radius: 18px;
                border: 1px solid var(--mjr-viewer-border) !important;
                backdrop-filter: blur(18px) saturate(135%);
                justify-content: space-between !important;
                flex-wrap: wrap;
                align-content: center;
            }

            .mjr-viewer-nav {
                padding: 6px;
                border-radius: 999px;
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid rgba(255, 255, 255, 0.08);
            }

            .mjr-viewer-nav-btn {
                width: 42px;
                height: 42px;
                padding: 0 !important;
                border-radius: 999px !important;
                font-size: 22px !important;
                line-height: 1;
            }

            .mjr-viewer-index {
                min-height: 36px;
                padding: 0 14px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 999px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.08);
                letter-spacing: 0.02em;
            }

            .mjr-viewer-playerbar {
                flex: 1 1 320px;
                min-width: 260px;
            }

            @media (max-width: 960px) {
                .mjr-viewer-header,
                .mjr-viewer-content-row,
                .mjr-filmstrip,
                .mjr-viewer-footer {
                    margin-left: 10px;
                    margin-right: 10px;
                }

                .mjr-viewer-header {
                    margin-top: 10px;
                }

                .mjr-viewer-footer {
                    margin-bottom: 10px;
                    justify-content: center !important;
                }

                .mjr-viewer-playerbar {
                    min-width: 100%;
                }

                .mjr-viewer-geninfo {
                    width: min(100vw - 24px, 420px) !important;
                    left: 12px !important;
                    right: 12px !important;
                }

                .mjr-viewer-geninfo--left {
                    left: 12px !important;
                }
            }
        `, document.head.appendChild(e);
	} catch (e) {
		console.debug?.(e);
	}
}
//#endregion
//#region ui/features/viewer/filmstrip.ts
var Dr = 84, Or = 56, kr = 74, Ar = .45, jr = "0px 240px 0px 240px", Mr = 3500;
function Nr(e) {
	let t = 2166136261, n = String(e || "");
	for (let e = 0; e < n.length; e += 1) t ^= n.charCodeAt(e), t = Math.imul(t, 16777619);
	return t >>> 0;
}
function Pr(e, t, n = 18) {
	let r = document.createElement("div");
	r.className = "mjr-filmstrip-audio-waveform";
	let i = Nr(t) || 1;
	for (let e = 0; e < n; e += 1) {
		i = Math.imul(i ^ i >>> 15, 2246822519) >>> 0;
		let t = i % 1e3 / 1e3, a = Math.sin(e / Math.max(1, n - 1) * Math.PI), o = document.createElement("span");
		o.style.height = `${Math.max(16, Math.min(92, Math.round(20 + a * 52 + t * 22)))}%`, o.style.opacity = String(.45 + t * .45), r.appendChild(o);
	}
	e.appendChild(r);
}
function Fr(e) {
	try {
		e?._mjrFilmstripReleaseTimer && (clearTimeout(e._mjrFilmstripReleaseTimer), e._mjrFilmstripReleaseTimer = null);
	} catch (e) {
		console.debug?.(e);
	}
}
function Ir(e) {
	if (!e) return;
	let t = String(e.dataset.lazySrc || "").trim();
	if (t) try {
		String(e.getAttribute("src") || "").trim() || (e.src = t, e.load());
	} catch (e) {
		console.debug?.(e);
	}
}
function Lr(e) {
	if (e) try {
		let t = e.play?.();
		t && typeof t.catch == "function" && t.catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
}
function Rr(e) {
	if (e) try {
		e.pause?.();
	} catch (e) {
		console.debug?.(e);
	}
}
function zr(e, { releaseSrc: t = !0 } = {}) {
	if (e) {
		Fr(e), Rr(e);
		try {
			e._mjrFilmstripInView = !1;
		} catch (e) {
			console.debug?.(e);
		}
		if (t) try {
			e.getAttribute("src") && (e.removeAttribute("src"), e.load());
		} catch (e) {
			console.debug?.(e);
		}
	}
}
function Br({ state: e, buildAssetViewURL: t, onNavigate: n, onCompare: r }) {
	let i = document.createElement("div");
	i.className = "mjr-filmstrip", i.style.cssText = `
        width: 100%;
        height: ${kr}px;
        overflow-x: auto;
        overflow-y: hidden;
        background: linear-gradient(180deg, rgba(16, 20, 27, 0.82), rgba(10, 13, 18, 0.92));
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 18px;
        flex-shrink: 0;
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,0.14) transparent;
        box-sizing: border-box;
        display: none;
        box-shadow: 0 16px 36px rgba(0, 0, 0, 0.22);
    `;
	let a = document.createElement("div");
	a.className = "mjr-filmstrip-track", a.style.cssText = "\n        display: inline-flex;\n        align-items: center;\n        gap: 8px;\n        padding: 9px 12px;\n        min-height: 100%;\n        box-sizing: border-box;\n    ", i.appendChild(a);
	let o = [], s = null, c = /* @__PURE__ */ new Set(), l = -1, u = -1, d = () => {
		try {
			return new IntersectionObserver((e) => {
				let t = i.style.display !== "none", n = !document.hidden;
				for (let r of e) {
					let e = r.target;
					if (!(e instanceof HTMLVideoElement)) continue;
					let i = r.isIntersecting || r.intersectionRatio > 0;
					try {
						e._mjrFilmstripInView = i;
					} catch (e) {
						console.debug?.(e);
					}
					if (i && (Fr(e), Ir(e)), i && r.intersectionRatio >= Ar && t && n ? Lr(e) : Rr(e), !i) {
						Fr(e);
						try {
							e._mjrFilmstripReleaseTimer = setTimeout(() => {
								try {
									if (!e.isConnected) {
										zr(e, { releaseSrc: !0 });
										return;
									}
									e._mjrFilmstripInView || zr(e, { releaseSrc: !0 });
								} catch (e) {
									console.debug?.(e);
								}
							}, Mr);
						} catch (e) {
							console.debug?.(e);
						}
					}
				}
			}, {
				root: i,
				rootMargin: jr,
				threshold: [0, Ar]
			});
		} catch {
			return null;
		}
	}, f = (e) => {
		if (e) {
			try {
				e._mjrFilmstripInView = !1;
			} catch (e) {
				console.debug?.(e);
			}
			c.add(e);
			try {
				s ||= d(), s?.observe?.(e);
			} catch (e) {
				console.debug?.(e);
			}
		}
	}, p = ({ releaseSrc: e = !1 } = {}) => {
		for (let t of Array.from(c)) zr(t, { releaseSrc: e });
	}, m = () => {
		for (let e of Array.from(c)) try {
			if (!e?._mjrFilmstripInView || !e?.isConnected) continue;
			Ir(e), Lr(e);
		} catch (e) {
			console.debug?.(e);
		}
	}, h = ({ releaseSrc: e = !0 } = {}) => {
		try {
			s?.disconnect?.();
		} catch (e) {
			console.debug?.(e);
		}
		s = null, p({ releaseSrc: e }), c.clear();
	}, g = () => {
		try {
			return !!window?.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
		} catch {
			return !1;
		}
	}, _ = (e, t = 1.08) => {
		if (!(!e || g())) {
			try {
				e._mjrFilmstripBounce?.cancel?.();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				if (typeof e.animate != "function") return;
				let n = Math.min(1.18, t + .07), r = Math.max(1, t - .03), i = e.animate([
					{ transform: `scale(${t})` },
					{ transform: `scale(${n})` },
					{ transform: `scale(${r})` },
					{ transform: `scale(${t})` }
				], {
					duration: 420,
					easing: "cubic-bezier(0.22, 0.9, 0.32, 1.15)"
				});
				e._mjrFilmstripBounce = i, i.onfinish = () => {
					try {
						e._mjrFilmstripBounce === i && (e._mjrFilmstripBounce = null);
					} catch (e) {
						console.debug?.(e);
					}
				};
			} catch (e) {
				console.debug?.(e);
			}
		}
	}, v = (e, n) => {
		let r = document.createElement("div");
		r.className = "mjr-filmstrip-item", r.dataset.fidx = String(n), r._mjrAsset = e, r.style.cssText = `
            position: relative;
            width: ${Dr}px;
            height: ${Or}px;
            border-radius: 14px;
            overflow: hidden;
            cursor: pointer;
            flex-shrink: 0;
            border: 2px solid transparent;
            box-sizing: border-box;
            background: rgba(255,255,255,0.06);
            opacity: 0.58;
            transform: scale(1);
            transition: border-color 0.16s ease, opacity 0.16s ease, transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
        `;
		let a = String(e?.kind || "").toLowerCase(), o = t(e);
		if (o && a === "video") {
			let e = document.createElement("video");
			e.className = "mjr-filmstrip-thumb", e.muted = !0, e.loop = !0, e.autoplay = !0, e.controls = !1, e.playsInline = !0, e.preload = "none", e.dataset.lazySrc = o, e.style.cssText = "\n                width: 100%;\n                height: 100%;\n                object-fit: cover;\n                display: block;\n                pointer-events: none;\n            ";
			try {
				e.disablePictureInPicture = !0;
			} catch (e) {
				console.debug?.(e);
			}
			return e.addEventListener("loadeddata", () => {
				try {
					e._mjrFilmstripInView && i.style.display !== "none" && !document.hidden && Lr(e);
				} catch (e) {
					console.debug?.(e);
				}
			}, { passive: !0 }), e.addEventListener("error", () => {
				try {
					e.style.display = "none";
				} catch (e) {
					console.debug?.(e);
				}
				zr(e, { releaseSrc: !0 }), y(r);
			}, { once: !0 }), r.appendChild(e), S(r), f(e), r;
		}
		if (a === "audio") {
			let t = String(e?.thumbnail_url || e?.thumb_url || "").trim();
			if (t) {
				let n = document.createElement("img");
				n.className = "mjr-filmstrip-thumb", n.loading = "lazy", n.decoding = "async", n.src = t, n.alt = String(e?.filename || "Audio"), n.draggable = !1, n.style.cssText = "\n                    width: 100%;\n                    height: 100%;\n                    object-fit: cover;\n                    display: block;\n                    pointer-events: none;\n                ", n.addEventListener("error", () => {
					try {
						n.style.display = "none";
					} catch (e) {
						console.debug?.(e);
					}
					b(r);
				}, { once: !0 }), r.appendChild(n);
			} else b(r);
			return T(r), r;
		}
		if (a === "model3d") {
			let n = (() => {
				try {
					let n = String(e?.filename || "").trim();
					if (!n) return "";
					let r = n + ".png", i = String(e?.subfolder || "").trim(), a = String(e?.type || "output").trim();
					return e?.root_id ? t({
						...e,
						filename: r,
						kind: "image"
					}) : E(r, i || null, a);
				} catch {
					return "";
				}
			})();
			if (n) {
				let t = document.createElement("img");
				t.className = "mjr-filmstrip-thumb", t.loading = "lazy", t.decoding = "async", t.src = n, t.alt = String(e?.filename || "3D Model"), t.draggable = !1, t.style.cssText = "\n                    width: 100%;\n                    height: 100%;\n                    object-fit: cover;\n                    display: block;\n                    pointer-events: none;\n                ", t.addEventListener("error", () => {
					try {
						t.style.display = "none";
					} catch (e) {
						console.debug?.(e);
					}
					C(r);
				}, { once: !0 }), r.appendChild(t);
			} else C(r);
			return w(r), r;
		}
		if (o) {
			let e = document.createElement("img");
			return e.className = "mjr-filmstrip-thumb", e.loading = "lazy", e.decoding = "async", e.src = o, e.style.cssText = "\n                width: 100%;\n                height: 100%;\n                object-fit: cover;\n                display: block;\n                pointer-events: none;\n            ", e.addEventListener("error", () => {
				try {
					e.style.display = "none";
				} catch (e) {
					console.debug?.(e);
				}
			}, { once: !0 }), r.appendChild(e), r;
		}
		return x(r), r;
	};
	function y(e) {
		let t = document.createElement("div");
		t.style.cssText = "\n            position: absolute; inset: 0;\n            display: flex; align-items: center; justify-content: center;\n            font-size: 10px; font-weight: 700;\n            color: rgba(255,255,255,0.55);\n            pointer-events: none;\n            letter-spacing: 0.04em;\n        ", t.textContent = "VIDEO";
		try {
			e.appendChild(t);
		} catch (e) {
			console.debug?.(e);
		}
	}
	function b(e) {
		let t = document.createElement("div");
		t.className = "mjr-filmstrip-audio-thumb";
		let n = document.createElement("span");
		n.className = "mjr-filmstrip-audio-label", n.textContent = "AUDIO", Pr(t, e?._mjrAsset?.filename || e?.dataset?.mjrId || "audio"), t.appendChild(n);
		try {
			e.appendChild(t);
		} catch (e) {
			console.debug?.(e);
		}
	}
	function x(e) {
		let t = document.createElement("div");
		t.style.cssText = "\n            position: absolute; inset: 0;\n            display: flex; align-items: center; justify-content: center;\n            font-size: 18px; color: rgba(255,255,255,0.25);\n            pointer-events: none;\n        ", t.textContent = "?";
		try {
			e.appendChild(t);
		} catch (e) {
			console.debug?.(e);
		}
	}
	function S(e) {
		let t = document.createElement("div");
		t.style.cssText = "\n            position: absolute; bottom: 2px; right: 2px;\n            font-size: 7px; line-height: 1;\n            background: rgba(0,0,0,0.55); color: rgba(255,255,255,0.85);\n            padding: 2px 3px; border-radius: 2px;\n            pointer-events: none;\n            letter-spacing: 0.02em;\n        ", t.textContent = "VID", e.appendChild(t);
	}
	function C(e) {
		let t = document.createElement("div");
		t.style.cssText = "\n            position: absolute; inset: 0;\n            display: flex; align-items: center; justify-content: center;\n            font-size: 10px; font-weight: 700;\n            color: rgba(76, 175, 80, 0.7);\n            pointer-events: none;\n            letter-spacing: 0.04em;\n        ", t.textContent = "3D";
		try {
			e.appendChild(t);
		} catch (e) {
			console.debug?.(e);
		}
	}
	function w(e) {
		let t = document.createElement("div");
		t.style.cssText = "\n            position: absolute; bottom: 2px; right: 2px;\n            font-size: 7px; line-height: 1;\n            background: rgba(0,0,0,0.55); color: rgba(76, 175, 80, 0.95);\n            padding: 2px 3px; border-radius: 2px;\n            pointer-events: none;\n            letter-spacing: 0.02em;\n            font-weight: 700;\n        ", t.textContent = "3D", e.appendChild(t);
	}
	function T(e) {
		let t = document.createElement("div");
		t.style.cssText = "\n            position: absolute; bottom: 2px; right: 2px;\n            font-size: 7px; line-height: 1;\n            background: rgba(0,0,0,0.55); color: rgba(255,255,255,0.85);\n            padding: 2px 3px; border-radius: 2px;\n            pointer-events: none;\n            letter-spacing: 0.02em;\n        ", t.textContent = "AUD", e.appendChild(t);
	}
	let D = () => {
		h({ releaseSrc: !0 }), a.innerHTML = "", o = [];
		let t = Array.isArray(e.assets) ? e.assets : [];
		if (t.length < 2) {
			i.style.display = "none";
			return;
		}
		i.style.display = "";
		for (let e = 0; e < t.length; e++) {
			let n = v(t[e], e);
			a.appendChild(n), o.push(n);
		}
		k(!1);
	}, O = (t = {}) => {
		let n = t.isSingle !== !1, a = r != null && e.compareAsset != null, o = Array.isArray(e.assets) ? e.assets : [];
		if (!n && !a || o.length < 2) {
			i.style.display = "none", p({ releaseSrc: !1 });
			return;
		}
		i.style.display = "", m(), k(!0);
	};
	function k(t) {
		let n = Number(e.currentIndex) || 0, a = -1;
		r && e.compareAsset != null && (a = (Array.isArray(e.assets) ? e.assets : []).indexOf(e.compareAsset));
		for (let e = 0; e < o.length; e++) e === n ? (o[e].style.borderColor = "rgba(255, 255, 255, 0.98)", o[e].style.opacity = "1", o[e].style.transform = "scale(1.08)", o[e].style.filter = "saturate(1.12) brightness(1.08)", o[e].style.boxShadow = "0 0 0 1px rgba(255,255,255,0.45), 0 0 18px rgba(160,220,255,0.38), 0 8px 16px rgba(0,0,0,0.38)") : e === a ? (o[e].style.borderColor = "rgba(120, 186, 255, 0.98)", o[e].style.opacity = "0.96", o[e].style.transform = "scale(1.04)", o[e].style.filter = "saturate(1.07) brightness(1.03)", o[e].style.boxShadow = "0 0 0 1px rgba(120,186,255,0.38), 0 0 14px rgba(120,186,255,0.32), 0 6px 14px rgba(0,0,0,0.32)") : (o[e].style.borderColor = "transparent", o[e].style.opacity = "0.5", o[e].style.transform = "scale(1)", o[e].style.filter = "none", o[e].style.boxShadow = "none");
		n !== l && o[n] && _(o[n], 1.08), a >= 0 && a !== u && o[a] && _(o[a], 1.04), l = n, u = a;
		let s = o[n];
		if (s) try {
			s.scrollIntoView({
				behavior: t ? "smooth" : "instant",
				block: "nearest",
				inline: "center"
			});
		} catch {
			try {
				let e = s.offsetLeft - i.clientWidth / 2 + s.offsetWidth / 2;
				i.scrollTo({
					left: Math.max(0, e),
					behavior: t ? "smooth" : "instant"
				});
			} catch (e) {
				console.debug?.(e);
			}
		}
	}
	return i.addEventListener("click", (t) => {
		try {
			t.stopPropagation();
			let i = t.target.closest("[data-fidx]");
			if (!i) return;
			let a = Number(i.dataset.fidx);
			if (!Number.isFinite(a) || a < 0 || a >= (Array.isArray(e.assets) ? e.assets : []).length) return;
			r && (t.ctrlKey || t.metaKey) ? r(a) : n(a);
		} catch (e) {
			console.debug?.(e);
		}
	}, !0), i.addEventListener("wheel", (e) => {
		try {
			e.stopPropagation();
		} catch (e) {
			console.debug?.(e);
		}
	}, {
		passive: !0,
		capture: !0
	}), {
		el: i,
		rebuild: D,
		sync: O
	};
}
//#endregion
//#region ui/features/viewer/viewerShell.ts
function Vr() {
	let e = document.createElement("div");
	return e.className = "mjr-viewer-overlay mjr-assets-manager", e.style.cssText = "\n        position: fixed;\n        top: 0;\n        left: 0;\n        right: 0;\n        bottom: 0;\n        background: linear-gradient(180deg, rgba(6, 8, 12, 0.94), rgba(5, 7, 10, 0.985));\n        z-index: 10000;\n        pointer-events: auto;\n        display: none;\n        flex-direction: column;\n        box-sizing: border-box;\n        overflow: hidden;\n    ", e.tabIndex = -1, e.setAttribute("role", "dialog"), e;
}
function Hr({ state: e, buildAssetViewURL: t, onNavigate: n, onCompare: r }) {
	let i = document.createElement("div");
	i.className = "mjr-viewer-content-row", i.style.cssText = "\n        flex: 1;\n        display: flex;\n        min-height: 0;\n        overflow: hidden;\n        min-width: 0;\n    ";
	let a = document.createElement("div");
	a.className = "mjr-viewer-content", a.style.cssText = "\n        flex: 1;\n        min-width: 0;\n        position: relative;\n        overflow: hidden;\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        isolation: isolate;\n    ";
	let o = document.createElement("div");
	o.className = "mjr-viewer-single", o.style.cssText = "\n        width: 100%;\n        height: 100%;\n        display: flex;\n        align-items: center;\n        justify-content: center;\n    ";
	let s = document.createElement("div");
	s.className = "mjr-viewer-ab", s.style.cssText = "\n        width: 100%;\n        height: 100%;\n        display: none;\n        position: relative;\n    ";
	let c = document.createElement("div");
	c.className = "mjr-viewer-sidebyside", c.style.cssText = "\n        width: 100%;\n        height: 100%;\n        display: none;\n        flex-direction: row;\n        gap: 2px;\n    ", a.appendChild(o), a.appendChild(s), a.appendChild(c);
	let l = document.createElement("div");
	l.className = "mjr-viewer-overlay-layer", l.style.cssText = "\n        position: absolute;\n        inset: 0;\n        pointer-events: none;\n        z-index: 50;\n    ";
	let u = document.createElement("canvas");
	u.className = "mjr-viewer-grid-canvas", u.style.cssText = "\n        position: absolute;\n        inset: 0;\n        width: 100%;\n        height: 100%;\n        display: none;\n    ";
	let d = document.createElement("div");
	d.className = "mjr-viewer-probe", d.style.cssText = "\n        position: absolute;\n        display: none;\n        padding: 7px 10px;\n        border-radius: 10px;\n        background: rgba(11, 14, 19, 0.78);\n        border: 1px solid rgba(255, 255, 255, 0.12);\n        color: rgba(255, 255, 255, 0.92);\n        font-size: 11px;\n        line-height: 1.2;\n        white-space: pre;\n        max-width: 280px;\n        transform: translate3d(0,0,0);\n        box-shadow: 0 18px 34px rgba(0,0,0,0.28);\n    ";
	let f = document.createElement("div");
	f.className = "mjr-viewer-loupe", f.style.cssText = "\n        position: absolute;\n        display: none;\n        width: 120px;\n        height: 120px;\n        border-radius: 14px;\n        overflow: hidden;\n        border: 1px solid rgba(255,255,255,0.14);\n        box-shadow: 0 18px 34px rgba(0,0,0,0.34);\n        background: rgba(9,12,16,0.72);\n        transform: translate3d(0,0,0);\n    ";
	let p = document.createElement("canvas");
	p.width = 120, p.height = 120, p.style.cssText = "width:100%; height:100%; display:block; image-rendering: pixelated;", f.appendChild(p), l.appendChild(u), l.appendChild(d), l.appendChild(f), a.appendChild(l);
	let m = document.createElement("div");
	m.className = "mjr-viewer-geninfo mjr-viewer-geninfo--right", m.style.cssText = `
        position: absolute;
        top: 16px;
        right: 16px;
        bottom: 16px;
        width: ${Cr};
        display: none;
        flex-direction: column;
        overflow: hidden;
        background: rgba(12, 15, 20, 0.9);
        border-left: 1px solid rgba(255,255,255,0.12);
        pointer-events: auto;
        backdrop-filter: blur(10px);
        z-index: 10001;
    `;
	let h = document.createElement("div");
	h.style.cssText = "\n        display: flex;\n        align-items: center;\n        justify-content: space-between;\n        gap: 10px;\n        padding: 10px 12px;\n        border-bottom: 1px solid rgba(255,255,255,0.10);\n        color: rgba(255,255,255,0.92);\n    ";
	let g = document.createElement("div");
	g.textContent = "Generation Info", g.style.cssText = "font-size: 13px; font-weight: 600;", h.appendChild(g);
	let _ = document.createElement("div");
	_.style.cssText = "\n        flex: 1;\n        overflow: auto;\n        padding: 14px;\n        color: rgba(255,255,255,0.92);\n    ", m.appendChild(h), m.appendChild(_);
	let v = document.createElement("div");
	v.className = "mjr-viewer-geninfo mjr-viewer-geninfo--left", v.style.cssText = `
        position: absolute;
        top: 16px;
        left: 16px;
        bottom: 16px;
        width: ${Cr};
        display: none;
        flex-direction: column;
        overflow: hidden;
        background: rgba(12, 15, 20, 0.9);
        border-right: 1px solid rgba(255,255,255,0.12);
        pointer-events: auto;
        backdrop-filter: blur(10px);
        z-index: 10001;
    `;
	let y = h.cloneNode(!0);
	y.replaceChildren();
	let b = document.createElement("div");
	b.textContent = "Generation Info (A)", b.style.cssText = "font-size: 13px; font-weight: 600;", y.appendChild(b);
	let x = document.createElement("div");
	x.style.cssText = "\n        flex: 1;\n        overflow: auto;\n        padding: 14px;\n        color: rgba(255,255,255,0.92);\n    ", v.appendChild(y), v.appendChild(x), i.appendChild(a);
	let S = document.createElement("div");
	S.className = "mjr-viewer-footer", S.style.cssText = "\n        display: flex;\n        justify-content: space-between;\n        align-items: center;\n        padding: 12px 20px;\n        background: rgba(13, 16, 22, 0.78);\n        border-top: 1px solid rgba(255, 255, 255, 0.1);\n        color: white;\n        gap: 14px 20px;\n        flex-wrap: wrap;\n    ";
	let C = Ln("<", "Previous (Left Arrow)");
	C.classList.add("mjr-viewer-nav-btn", "mjr-viewer-nav-btn--prev"), C.style.fontSize = "24px";
	let w = document.createElement("span");
	w.className = "mjr-viewer-index", w.style.cssText = "font-size: 14px; font-weight: 500;";
	let T = Ln(">", "Next (Right Arrow)");
	T.classList.add("mjr-viewer-nav-btn", "mjr-viewer-nav-btn--next"), T.style.fontSize = "24px";
	let E = document.createElement("div");
	E.className = "mjr-viewer-nav", E.style.cssText = "display:flex; align-items:center; gap:20px;", E.appendChild(C), E.appendChild(w), E.appendChild(T);
	let D = document.createElement("div");
	return D.className = "mjr-viewer-playerbar", D.style.cssText = "display:none; width: 100%;", S.appendChild(E), S.appendChild(D), {
		contentRow: i,
		content: a,
		singleView: o,
		abView: s,
		sideView: c,
		overlayLayer: l,
		gridCanvas: u,
		probeTooltip: d,
		loupeWrap: f,
		loupeCanvas: p,
		genInfoOverlay: m,
		genInfoTitle: g,
		genInfoBody: _,
		genInfoOverlayLeft: v,
		genInfoTitleLeft: b,
		genInfoBodyLeft: x,
		footer: S,
		prevBtn: C,
		indexInfo: w,
		nextBtn: T,
		navBar: E,
		playerBarHost: D,
		filmstrip: Br({
			state: e,
			buildAssetViewURL: t,
			onNavigate: n,
			onCompare: r
		})
	};
}
//#endregion
//#region ui/features/viewer/viewerOverlayDismiss.ts
function Ur({ overlay: e, requestClose: t }) {
	try {
		let n = null;
		e.addEventListener("pointerdown", (e) => {
			e.isPrimary !== !1 && (n = {
				x: e.clientX,
				y: e.clientY,
				t: Date.now()
			});
		}, {
			capture: !0,
			passive: !0
		}), e.addEventListener("click", (e) => {
			try {
				if (e.defaultPrevented || e.button !== 0) return;
				if (n) {
					let t = e.clientX - n.x, r = e.clientY - n.y;
					if (Math.hypot(t, r) > 6 || Date.now() - n.t > 600) return;
				}
				let r = e.target;
				if (dt(r, ".mjr-viewer-header") || dt(r, ".mjr-viewer-footer") || dt(r, ".mjr-viewer-geninfo") || dt(r, ".mjr-video-controls") || dt(r, ".mjr-context-menu") || dt(r, ".mjr-ab-slider") || dt(r, ".mjr-viewer-loupe") || dt(r, ".mjr-viewer-probe") || dt(r, ".mjr-viewer-media") || r && (r.tagName === "IMG" || r.tagName === "VIDEO" || r.tagName === "CANVAS")) return;
				t?.();
			} catch (e) {
				console.debug?.(e);
			}
		});
	} catch (e) {
		console.debug?.(e);
	}
}
//#endregion
//#region ui/components/ViewerRuntime.ts
var Wr = null, Gr = null, Kr = null, qr = null, Jr = null, Yr = null;
function Xr() {
	Wr || import("./abCompare-BXOoRlmV.js").then((e) => {
		Wr = e;
	}), Gr || import("./sideBySide-Cpno2qKL.js").then((e) => {
		Gr = e;
	}), Kr || import("./model3dRenderer-C7vE1AWS.js").then((e) => e.t).then((e) => {
		Kr = e;
	}), qr || import("./scopes-X1iFrTle.js").then((e) => {
		qr = e;
	}), Jr || import("./genInfo-BcSUiLW5.js").then((e) => e.n).then((e) => {
		Jr = e;
	}), Yr || import("./frameExport-tksSZ7sb.js").then((e) => {
		Yr = e;
	});
}
var $ = {
	SINGLE: "single",
	AB_COMPARE: "ab",
	SIDE_BY_SIDE: "sidebyside"
};
function Zr() {
	Xr(), Er();
	let t = Vr(), n = In(t), a = n.unsubs || [], s = te();
	s.mode = $.SINGLE;
	try {
		let e = Nn();
		e && typeof e == "object" && (typeof e.analysisMode == "string" && (s.analysisMode = e.analysisMode || "none"), typeof e.loupeEnabled == "boolean" && (s.loupeEnabled = e.loupeEnabled), typeof e.probeEnabled == "boolean" && (s.probeEnabled = e.probeEnabled), typeof e.hudEnabled == "boolean" && (s.hudEnabled = e.hudEnabled), typeof e.genInfoOpen == "boolean" && (s.genInfoOpen = e.genInfoOpen), typeof e.audioVisualizerMode == "string" && (s.audioVisualizerMode = e.audioVisualizerMode || "artistic"), typeof e.abWipePercent == "number" && Number.isFinite(e.abWipePercent) && e.abWipePercent >= 0 && e.abWipePercent <= 100 && (s._abWipePercent = e.abWipePercent));
	} catch (e) {
		console.debug?.(e);
	}
	let c = new Set([
		"png",
		"jpg",
		"jpeg",
		"webp",
		"gif",
		"bmp",
		"tiff",
		"avif",
		"jxl",
		"heic",
		"hdr",
		"svg",
		"apng"
	]), l = null, d = null;
	function f() {
		try {
			return l?.mediaTransform?.() || "";
		} catch {
			return "";
		}
	}
	function h() {
		try {
			l?.clampPanToBounds?.();
		} catch (e) {
			console.debug?.(e);
		}
	}
	function g() {
		try {
			l?.applyTransform?.();
		} catch (e) {
			console.debug?.(e);
		}
	}
	function _(e, t) {
		try {
			l?.setZoom?.(e, t);
		} catch (e) {
			console.debug?.(e);
		}
	}
	function v() {
		try {
			l?.updatePanCursor?.();
		} catch (e) {
			console.debug?.(e);
		}
	}
	function y() {
		try {
			return l?.getPrimaryMedia?.() || null;
		} catch {
			return null;
		}
	}
	function x(e) {
		try {
			return l?.getMediaNaturalSize?.(e) || {
				w: 0,
				h: 0
			};
		} catch {
			return {
				w: 0,
				h: 0
			};
		}
	}
	function S() {
		try {
			return l?.getViewportRect?.() || null;
		} catch {
			return null;
		}
	}
	function E() {
		try {
			return l?.computeOneToOneZoom?.() ?? null;
		} catch {
			return null;
		}
	}
	function D() {
		try {
			l?.updateMediaNaturalSize?.();
		} catch (e) {
			console.debug?.(e);
		}
	}
	function A(e, t) {
		try {
			return d?.createMediaElement?.(e, t) || document.createElement("div");
		} catch {
			return document.createElement("div");
		}
	}
	function j(e, t) {
		try {
			return d?.createCompareMediaElement?.(e, t) || document.createElement("div");
		} catch {
			return document.createElement("div");
		}
	}
	function M() {
		let e = !1;
		try {
			let t = s.mode === $.AB_COMPARE ? V : s.mode === $.SIDE_BY_SIDE ? H : B, n = Array.from(t?.querySelectorAll?.(".mjr-viewer-audio-viz") || []);
			for (let t of n) try {
				let n = t?._mjrProc || null;
				if (!n?.setMode) continue;
				n.setMode(s.audioVisualizerMode), e = !0;
			} catch (e) {
				console.debug?.(e);
			}
		} catch (e) {
			console.debug?.(e);
		}
		return e;
	}
	let N = null, ee = () => Tt(), P = document.createElement("div");
	P.className = "mjr-viewer-header", P.style.cssText = "\n        display: flex;\n        flex-direction: column;\n        gap: 8px;\n        padding: 12px 20px;\n        background: var(--mjr-surface-0, rgba(0, 0, 0, 0.8));\n        border-bottom: 1px solid rgba(255, 255, 255, 0.1);\n        color: white;\n        box-sizing: border-box;\n    ";
	let F = document.createElement("span");
	F.className = "mjr-viewer-filename", F.style.cssText = "font-size: 14px; font-weight: 500; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;";
	let ne = document.createElement("div");
	ne.className = "mjr-viewer-badges", ne.style.cssText = "display:flex; gap:8px; align-items:center; flex-wrap:wrap;";
	let re = null, ie = null, ae = null, oe = null, se = null, le = null, I = null, L = null, ue = null, de = null, R = null;
	try {
		P.appendChild(F), P.appendChild(ne);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		N = Un({
			VIEWER_MODES: $,
			state: s,
			lifecycle: n,
			getCanAB: () => Xe(),
			onToggleFullscreen: () => {
				try {
					if (document.fullscreenElement) try {
						document.exitFullscreen();
					} catch (e) {
						console.debug?.(e);
					}
					else try {
						t.requestFullscreen();
					} catch (e) {
						console.debug?.(e);
					}
				} catch (e) {
					console.debug?.(e);
				}
			},
			onClose: () => ee?.(),
			onMode: (e) => {
				try {
					if (e === $.AB_COMPARE && !Xe() || e === $.SIDE_BY_SIDE && !Y()) return;
					s.mode = e, Qe();
					try {
						N?.syncToolsUIFromState?.();
					} catch (e) {
						console.debug?.(e);
					}
				} catch (e) {
					console.debug?.(e);
				}
			},
			onZoomIn: () => {
				try {
					_((Number(s.zoom) || 1) + .25, {
						clientX: s._lastPointerX,
						clientY: s._lastPointerY
					});
				} catch (e) {
					console.debug?.(e);
				}
			},
			onZoomOut: () => {
				try {
					_((Number(s.zoom) || 1) - .25, {
						clientX: s._lastPointerX,
						clientY: s._lastPointerY
					});
				} catch (e) {
					console.debug?.(e);
				}
			},
			onZoomReset: () => {
				try {
					_(1);
				} catch (e) {
					console.debug?.(e);
				}
			},
			onZoomOneToOne: () => {
				try {
					let e = () => {
						let e = E();
						return e == null ? !1 : (_(Math.abs((Number(s.zoom) || 1) - e) < .01 ? 1 : e, {
							clientX: s._lastPointerX,
							clientY: s._lastPointerY
						}), !0);
					};
					if (e()) return;
					try {
						requestAnimationFrame(() => {
							try {
								D();
							} catch (e) {
								console.debug?.(e);
							}
							try {
								e();
							} catch (e) {
								console.debug?.(e);
							}
						});
					} catch (e) {
						console.debug?.(e);
					}
				} catch (e) {
					console.debug?.(e);
				}
			},
			onCompareModeChanged: () => {
				try {
					s.mode === $.AB_COMPARE && (et(), st());
				} catch (e) {
					console.debug?.(e);
				}
			},
			onExportFrame: () => {
				try {
					Je({ toClipboard: !1 });
				} catch (e) {
					console.debug?.(e);
				}
			},
			onCopyFrame: () => {
				try {
					Je({ toClipboard: !0 });
				} catch (e) {
					console.debug?.(e);
				}
			},
			onAudioVizModeChanged: () => {
				try {
					let e = s.assets[s.currentIndex];
					if (String(e?.kind || "") !== "audio") return;
					M() || (et(), st());
				} catch (e) {
					console.debug?.(e);
				}
			},
			onToolsChanged: () => {
				try {
					N?.syncToolsUIFromState?.();
				} catch (e) {
					console.debug?.(e);
				}
				try {
					Pn(s);
				} catch (e) {
					console.debug?.(e);
				}
				try {
					Ze();
				} catch (e) {
					console.debug?.(e);
				}
				try {
					if (s.mode === $.AB_COMPARE) {
						let e = String(s.abCompareMode || "wipe");
						e !== "wipe" && e !== "wipeV" && V?._mjrDiffRequest?.();
					}
				} catch (e) {
					console.debug?.(e);
				}
				try {
					s.probeEnabled || (me.style.display = "none");
				} catch (e) {
					console.debug?.(e);
				}
				try {
					s.loupeEnabled || (he.style.display = "none");
				} catch (e) {
					console.debug?.(e);
				}
				try {
					J();
				} catch (e) {
					console.debug?.(e);
				}
				try {
					ht?.();
				} catch (e) {
					console.debug?.(e);
				}
				try {
					Ke();
				} catch (e) {
					console.debug?.(e);
				}
			}
		}), N?.headerEl && (P = N.headerEl), N?.headerTopEl && (R = N.headerTopEl), N?.filenameEl && (F = N.filenameEl), N?.badgesBarEl && (ne = N.badgesBarEl), N?.filenameRightEl && (re = N.filenameRightEl), N?.badgesBarRightEl && (ie = N.badgesBarRightEl), N?.leftAreaEl && (se = N.leftAreaEl), N?.leftMetaEl && (le = N.leftMetaEl), N?.centerAreaEl && (I = N.centerAreaEl), N?.rightMetaEl && (ae = N.rightMetaEl), N?.rightAreaEl && (oe = N.rightAreaEl), N?.titleLineEl && (L = N.titleLineEl), N?.titleWrapEl && (ue = N.titleWrapEl), N?.modeButtonsEl && (de = N.modeButtonsEl);
	} catch (e) {
		console.debug?.(e);
	}
	let { contentRow: z, content: fe, singleView: B, abView: V, sideView: H, overlayLayer: pe, gridCanvas: U, probeTooltip: me, loupeWrap: he, loupeCanvas: ge, genInfoOverlay: _e, genInfoTitle: W, genInfoBody: G, genInfoOverlayLeft: K, genInfoTitleLeft: ve, genInfoBodyLeft: ye, footer: q, prevBtn: be, indexInfo: xe, nextBtn: Se, navBar: Ce, playerBarHost: we, filmstrip: Te } = Hr({
		state: s,
		buildAssetViewURL: O,
		onNavigate: (e) => {
			try {
				s.compareAsset != null && (s.compareAsset = null, s.mode = $.SINGLE), s.currentIndex = e, Qe();
			} catch (e) {
				console.debug?.(e);
			}
		},
		onCompare: (e) => {
			try {
				let t = Array.isArray(s.assets) ? s.assets : [], n = t[e];
				if (!n || n === t[s.currentIndex]) return;
				if (n === s.compareAsset) {
					s.compareAsset = null, s.mode = $.SINGLE, Qe();
					return;
				}
				t.length === 2 ? (s.compareAsset = t[1 - s.currentIndex], s.mode = De() ? $.SIDE_BY_SIDE : $.AB_COMPARE) : (s.compareAsset = n, s.mode = Y() ? $.SIDE_BY_SIDE : $.AB_COMPARE), Qe();
			} catch (e) {
				console.debug?.(e);
			}
		}
	});
	t.appendChild(P), t.appendChild(z);
	function Ee() {
		try {
			if (s.compareAsset) return s.compareAsset;
			let e = Array.isArray(s.assets) ? s.assets : [];
			if (e.length === 2) return e[1 - (s.currentIndex || 0)] || null;
		} catch (e) {
			console.debug?.(e);
		}
		return null;
	}
	function De() {
		try {
			let e = s.assets?.[s.currentIndex] || null;
			return (Kr?.isModel3DAsset?.(e) ?? !1) || (Kr?.isModel3DAsset?.(Ee()) ?? !1);
		} catch (e) {
			console.debug?.(e);
		}
		return !1;
	}
	t.appendChild(Te.el), t.appendChild(q), t.appendChild(_e), t.appendChild(K), Ur({
		overlay: t,
		requestClose: () => ee()
	});
	let Oe = Zn({
		state: s,
		VIEWER_MODES: $,
		APP_CONFIG: T,
		getAssetMetadata: o,
		getAssetsBatch: r
	}), ke = 300 * 1e3, Ae = /* @__PURE__ */ new Map(), je = () => {
		try {
			let e = Date.now();
			for (let [t, n] of Ae.entries()) {
				let r = Number(n?.at) || 0;
				(!r || e - r > ke) && Ae.delete(t);
			}
			if (Ae.size <= 256) return;
			let t = Array.from(Ae.entries()).sort((e, t) => (Number(e?.[1]?.at) || 0) - (Number(t?.[1]?.at) || 0)), n = Ae.size - 256;
			for (let e = 0; e < n; e += 1) {
				let n = t?.[e]?.[0];
				n != null && Ae.delete(n);
			}
		} catch (e) {
			console.debug?.(e);
		}
	}, Me = (e) => {
		try {
			let t = String(e ?? "");
			if (!t) return null;
			let n = Ae.get(t);
			if (!n || typeof n != "object") return null;
			let r = Number(n?.at) || 0;
			return !r || Date.now() - r > ke ? (Ae.delete(t), null) : n?.data || null;
		} catch {
			return null;
		}
	}, Ne = (e, t) => {
		try {
			let n = String(e ?? "");
			if (!n || !t) return;
			Ae.set(n, {
				data: t,
				at: Date.now()
			}), je();
		} catch (e) {
			console.debug?.(e);
		}
	}, Pe = async () => {
		try {
			await Oe?.hydrateVisibleMetadata?.();
		} catch (e) {
			console.debug?.(e);
		}
	};
	try {
		l = $n({
			overlay: t,
			content: fe,
			singleView: B,
			abView: V,
			sideView: H,
			state: s,
			VIEWER_MODES: $,
			scheduleOverlayRedraw: J,
			lifecycle: n
		});
	} catch {
		l = null;
	}
	let Fe = (e, t, n) => {
		try {
			e.clearRect(0, 0, t, n);
		} catch (e) {
			console.debug?.(e);
		}
	}, Ie = null;
	function J(e) {
		try {
			if (t.style.display === "none") return;
			if (e === !0) {
				Ie != null && (cancelAnimationFrame(Ie), Ie = null);
				try {
					Re();
				} catch (e) {
					console.debug?.(e);
				}
				return;
			}
			if (Ie != null) return;
			Ie = requestAnimationFrame(() => {
				Ie = null;
				try {
					Re();
				} catch (e) {
					console.debug?.(e);
				}
			});
		} catch (e) {
			console.debug?.(e);
		}
	}
	let Le = Jn({
		gridCanvas: U,
		content: fe,
		state: s,
		VIEWER_MODES: $,
		getPrimaryMedia: () => {
			try {
				if (s?.mode === $.SINGLE) return B?.querySelector?.(".mjr-viewer-media") || null;
				if (s?.mode === $.AB_COMPARE) return V?.querySelector?.(".mjr-viewer-media") || null;
				if (s?.mode === $.SIDE_BY_SIDE) return H?.querySelector?.(".mjr-viewer-media") || null;
			} catch (e) {
				console.debug?.(e);
			}
			return null;
		},
		getViewportRect: S,
		clearCanvas: Fe
	}), Re = () => {
		let e = (() => {
			try {
				let e = Number(s?._panHintAt) || 0;
				return e > 0 && Date.now() - e < 900;
			} catch {
				return !1;
			}
		})();
		try {
			let t = s?.mode === $.SINGLE && !!s?.hudEnabled, n = String(s?.scopesMode || "off") !== "off", r = !!s?.overlayMaskEnabled;
			U.style.display = s.gridMode === 0 && !r && !e && !t && !n ? "none" : "";
		} catch (e) {
			console.debug?.(e);
		}
		let n = Le.ensureCanvasSize();
		if (n.w > 0 && n.h > 0) {
			if ((() => {
				let e = s?.mode === $.SINGLE && !!s?.hudEnabled;
				return (Number(s.gridMode) || 0) !== 0 || !!s?.overlayMaskEnabled || e;
			})()) Le.redrawGrid(n);
			else try {
				let e = U.getContext("2d");
				e && Fe(e, n.w, n.h);
			} catch (e) {
				console.debug?.(e);
			}
			if (e) try {
				let e = U.getContext("2d");
				if (e) {
					let t = fe?.getBoundingClientRect?.(), r = Number(s?._panHintX), i = Number(s?._panHintY), a = t && Number.isFinite(r) ? r - t.left : n.w / 2, o = t && Number.isFinite(i) ? i - t.top : n.h * .78, c = Math.max(10, Math.min(n.w - 10, a)), l = Math.max(10, Math.min(n.h - 10, o));
					e.save(), e.font = "12px var(--comfy-font, ui-sans-serif, system-ui)", e.textAlign = "center", e.textBaseline = "middle";
					let u = "Zoom in to pan", d = e.measureText(u), f = Math.min(n.w - 20, Math.max(140, d.width + 26));
					e.fillStyle = "rgba(0,0,0,0.65)", e.strokeStyle = "rgba(255,255,255,0.18)", e.lineWidth = 1, e.beginPath();
					let p = c - f / 2, m = l - 26 / 2;
					e.moveTo(p + 10, m), e.arcTo(p + f, m, p + f, m + 26, 10), e.arcTo(p + f, m + 26, p, m + 26, 10), e.arcTo(p, m + 26, p, m, 10), e.arcTo(p, m, p + f, m, 10), e.closePath(), e.fill(), e.stroke(), e.fillStyle = "rgba(255,255,255,0.92)", e.fillText(u, c, l), e.restore();
				}
			} catch (e) {
				console.debug?.(e);
			}
			try {
				let e = String(s?.scopesMode || "off");
				if (e !== "off") {
					let r = U.getContext("2d");
					if (r) {
						let i = B;
						s?.mode === $.AB_COMPARE ? i = V : s?.mode === $.SIDE_BY_SIDE && (i = H);
						let a = i?.querySelector?.("canvas.mjr-viewer-media") || t?.querySelector?.("canvas.mjr-viewer-media");
						a && a instanceof HTMLCanvasElement && qr?.drawScopesLight?.(r, {
							w: n.w,
							h: n.h
						}, a, {
							mode: e,
							channel: s?.channel
						});
					}
				}
			} catch (e) {
				console.debug?.(e);
			}
			if (s.mode !== $.SINGLE) {
				try {
					me.style.display = "none";
				} catch (e) {
					console.debug?.(e);
				}
				try {
					he.style.display = "none";
				} catch (e) {
					console.debug?.(e);
				}
			}
		}
	}, ze = (e) => {
		if (e) {
			try {
				for (let t of Array.from(e.childNodes || [])) try {
					t?._mjrDispose?.();
				} catch (e) {
					console.debug?.(e);
				}
			} catch (e) {
				console.debug?.(e);
			}
			try {
				e.replaceChildren();
			} catch (e) {
				console.debug?.(e);
			}
		}
	}, Be = () => {
		try {
			s._genInfoAbort?.abort?.();
		} catch (e) {
			console.debug?.(e);
		}
		s._genInfoAbort = null;
		try {
			s._genInfoReqId = (Number(s._genInfoReqId) || 0) + 1;
		} catch (e) {
			console.debug?.(e);
		}
	}, Ve = async (e, { signal: t } = {}) => {
		try {
			return await Jr?.ensureViewerMetadataAsset?.(e, {
				getAssetMetadata: o,
				getFileMetadataScoped: m,
				metadataCache: Oe,
				signal: t
			});
		} catch {
			return e;
		}
	}, He = (e) => {
		try {
			if (!e || typeof e != "object" || e?.geninfo || e?.prompt || e?.workflow || e?.metadata) return !1;
			if (String(e?.mime || e?.mimetype || e?.type || "").toLowerCase().startsWith("video/")) return !0;
			let t = String(e?.filepath || e?.path || e?.filename || e?.name || "").toLowerCase().split(".").pop() || "";
			return [
				"mp4",
				"webm",
				"mov",
				"mkv",
				"avi",
				"m4v",
				"gif"
			].includes(t), !0;
		} catch {
			return !1;
		}
	}, Ue = (e) => {
		try {
			if (!e || typeof e != "object") return "";
			if (e.id != null) return `id:${e.id}`;
			let t = String(e.filepath || e.path || e?.file_info?.filepath || "").trim();
			if (t) return `fp:${t}`;
			let n = String(e.source || e.type || "output").trim().toLowerCase(), r = String(e.subfolder || e?.file_info?.subfolder || "").trim(), i = String(e.filename || e.name || e?.file_info?.filename || "").trim();
			return i ? `file:${n}:${r}:${i}` : "";
		} catch {
			return "";
		}
	}, We = () => {
		try {
			return !!(G?.childNodes?.length || ye?.childNodes?.length);
		} catch {
			return !1;
		}
	}, Ke = async () => {
		let e = Xe(), n = Y(), r = s.mode, i = !!s?.genInfoOpen && !s?.distractionFree, a = s?.assets?.[s?.currentIndex] || null, o = i && (r === $.AB_COMPARE && e || r === $.SIDE_BY_SIDE && n), c = o && r === $.SIDE_BY_SIDE && !s?.compareAsset && (s?.assets?.length ?? 0) > 2;
		try {
			if (_e.style.display = i ? "flex" : "none", K.style.display = o ? "flex" : "none", t.style.paddingRight = i ? wr : "0px", t.style.paddingLeft = o ? wr : "0px", !i) {
				Be();
				try {
					s._genInfoRenderSignature = "";
				} catch (e) {
					console.debug?.(e);
				}
				try {
					ze(G);
				} catch (e) {
					console.debug?.(e);
				}
				try {
					ze(ye);
				} catch (e) {
					console.debug?.(e);
				}
				return;
			}
		} catch {
			return;
		}
		let l = "";
		try {
			let e = Array.isArray(s?.assets) ? s.assets : [], t = s?.compareAsset ? Ue(s.compareAsset) : "", n = e.slice(0, 4).map(Ue).join("|");
			l = [
				"open",
				r,
				Number(s?.currentIndex) || 0,
				Ue(a),
				t,
				n,
				o ? "dual" : "single",
				c ? "grid" : ""
			].join("::");
			let i = s?._genInfoAbort?.signal;
			if (l && s?._genInfoRenderSignature === l && i && !i.aborted && We()) return;
			s._genInfoRenderSignature = l;
		} catch (e) {
			console.debug?.(e);
		}
		Be();
		let u = (Number(s?._genInfoReqId) || 0) + 1;
		try {
			s._genInfoReqId = u;
		} catch (e) {
			console.debug?.(e);
		}
		let d = new AbortController();
		s._genInfoAbort = d;
		let f = ({ left: e = null, leftExtra: t = null, right: n = null, rightExtra: r = null, single: i = null } = {}) => {
			try {
				if (s._genInfoReqId !== u) return;
				ze(G);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				if (s._genInfoReqId !== u) return;
				ze(ye);
			} catch (e) {
				console.debug?.(e);
			}
			if (s._genInfoReqId !== u) return;
			let a = () => {
				try {
					s?.genInfoOpen || (s.genInfoOpen = !0), s._genInfoRenderSignature = "", Ke();
				} catch (e) {
					console.debug?.(e);
				}
			}, l = (e, t, n, r) => {
				if (e) try {
					try {
						let i = Jr?.buildViewerMetadataBlocks?.({
							title: t,
							asset: n,
							ui: {
								loading: !!r,
								onRetry: a
							}
						});
						if (i) {
							e.appendChild(i);
							return;
						}
					} catch (e) {
						console.debug?.(e);
					}
					let i = document.createElement("div");
					if (i.style.cssText = "display:flex; flex-direction:column; gap:10px; margin-bottom: 14px;", t) {
						let e = document.createElement("div");
						e.textContent = t, e.style.cssText = "font-size: 12px; font-weight: 600; letter-spacing: 0.02em; color: rgba(255,255,255,0.86);", i.appendChild(e);
					}
					let o = document.createElement("div");
					o.style.cssText = "padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.72);", o.textContent = C("viewer.noGenerationDataFile", "No generation data found for this file."), i.appendChild(o);
					try {
						let e = n?.metadata_raw;
						if (e != null) {
							let t = document.createElement("details");
							t.style.cssText = "border: 1px solid rgba(255,255,255,0.10); border-radius: 10px; background: rgba(255,255,255,0.04); overflow: hidden;";
							let n = document.createElement("summary");
							n.textContent = C("msg.rawMetadata", "Raw metadata"), n.style.cssText = "cursor: pointer; padding: 10px 12px; color: rgba(255,255,255,0.78); user-select: none;";
							let r = document.createElement("pre");
							r.style.cssText = "margin:0; padding: 10px 12px; max-height: 280px; overflow:auto; font-size: 11px; line-height: 1.35; color: rgba(255,255,255,0.86);";
							let a = "";
							try {
								a = typeof e == "string" ? e : JSON.stringify(e, null, 2);
							} catch {
								a = String(e);
							}
							a.length > 4e4 && (a = `${a.slice(0, 4e4)}\n...(truncated)...`), r.textContent = a, t.appendChild(n), t.appendChild(r), i.appendChild(t);
						}
					} catch (e) {
						console.debug?.(e);
					}
					e.appendChild(i);
				} catch (e) {
					console.debug?.(e);
				}
			};
			if (o) {
				if (e && (ve.textContent = e.title || "Asset A", l(ye, t ? "Asset A" : "", e.asset, e.loading)), t && l(ye, "Asset C", t.asset, t.loading), n && (W.textContent = n.title || "Asset B", l(G, r ? "Asset B" : "", n.asset, n.loading)), r && l(G, "Asset D", r.asset, r.loading), !c && e?.asset && n?.asset && !e.loading && !n.loading) try {
					let t = br(e.asset, n.asset);
					t && G.insertBefore(t, G.firstChild || null);
				} catch (e) {
					console.debug?.(e);
				}
			} else i && (W.textContent = i.title || "Generation Info", l(G, "", i.asset, i.loading));
		};
		try {
			if (!a) {
				f({});
				return;
			}
			let e = null, t = null, n = null, i = null, l = null;
			o ? r === $.SIDE_BY_SIDE ? s?.compareAsset ? (e = a, t = s.compareAsset) : (e = s.assets[0] || null, t = s.assets[1] || null, c && (n = s.assets[2] || null, i = s.assets[3] || null)) : (e = a, t = s?.compareAsset || (s.assets.length === 2 ? s.assets[1 - s.currentIndex] : null)) : l = a;
			let p = (e) => e ? Oe?.getCached?.(e.id)?.data || e : null;
			if (f({
				left: o ? {
					title: c ? "Assets A & C" : "Asset A",
					asset: p(e),
					loading: He(p(e))
				} : null,
				leftExtra: c && n ? {
					asset: p(n),
					loading: He(p(n))
				} : null,
				right: o ? {
					title: c ? "Assets B & D" : "Asset B",
					asset: p(t),
					loading: He(p(t))
				} : null,
				rightExtra: c && i ? {
					asset: p(i),
					loading: He(p(i))
				} : null,
				single: o ? null : {
					title: "Generation Info",
					asset: p(l),
					loading: He(p(l))
				}
			}), s._genInfoReqId !== u) return;
			if (o) {
				let r = e ? await Ve(e, { signal: d.signal }) : null, a = t ? await Ve(t, { signal: d.signal }) : null, o = n ? await Ve(n, { signal: d.signal }) : null, l = i ? await Ve(i, { signal: d.signal }) : null;
				if (s._genInfoReqId !== u) return;
				f({
					left: {
						title: c ? "Assets A & C" : "Asset A",
						asset: r,
						loading: !1
					},
					leftExtra: c && o ? {
						asset: o,
						loading: !1
					} : null,
					right: {
						title: c ? "Assets B & D" : "Asset B",
						asset: a,
						loading: !1
					},
					rightExtra: c && l ? {
						asset: l,
						loading: !1
					} : null
				});
			} else {
				let e = l ? await Ve(l, { signal: d.signal }) : null;
				if (s._genInfoReqId !== u) return;
				f({ single: {
					title: "Generation Info",
					asset: e,
					loading: !1
				} });
			}
		} catch (e) {
			console.debug?.(e);
		}
	}, qe = null;
	function Je(e) {
		try {
			return !qe && Yr && (qe = Yr.createFrameExporter({
				state: s,
				VIEWER_MODES: $,
				singleView: B,
				abView: V,
				sideView: H
			})), qe?.exportCurrentFrame?.(e);
		} catch (e) {
			console.debug?.(e);
		}
	}
	let Ye = () => {
		let e = (e) => {
			try {
				e && e.replaceChildren();
			} catch (e) {
				console.debug?.(e);
			}
		};
		e(ne), e(ie);
		let t = (e, { showName: t } = {}) => {
			if (!e) return null;
			let n = document.createElement("div");
			n.className = "mjr-viewer-asset-pill", n.style.cssText = "\n                display: inline-flex;\n                align-items: center;\n                gap: 8px;\n                padding: 2px 8px;\n                border-radius: 999px;\n                border: 1px solid rgba(255,255,255,0.14);\n                background: rgba(255,255,255,0.08);\n                font-size: 12px;\n                max-width: 360px;\n                overflow: hidden;\n            ";
			let r = document.createElement("span");
			r.textContent = String(e.filename || ""), r.style.cssText = "max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; opacity:0.95;";
			let i = Ge(e.filename, e.kind, !!e?._mjrNameCollision);
			try {
				i.style.position = "static", i.style.top = "", i.style.left = "", i.style.padding = "2px 6px", i.style.fontSize = "10px", i.style.borderRadius = "6px", i.style.pointerEvents = "none";
			} catch (e) {
				console.debug?.(e);
			}
			let a = $e(e.rating || 0);
			if (a) try {
				a.style.position = "static", a.style.top = "", a.style.right = "", a.style.padding = "2px 6px", a.style.fontSize = "12px";
			} catch (e) {
				console.debug?.(e);
			}
			let o = it(Array.isArray(e.tags) ? e.tags : []);
			if (o) try {
				o.style.position = "static", o.style.bottom = "", o.style.left = "", o.style.maxWidth = "220px", o.style.pointerEvents = "none";
			} catch (e) {
				console.debug?.(e);
			}
			n.appendChild(i), t && n.appendChild(r), a && n.appendChild(a), o && o.style.display !== "none" && n.appendChild(o);
			try {
				e.filepath && (n.title = String(e.filepath));
			} catch (e) {
				console.debug?.(e);
			}
			return n;
		}, n = s.mode === $.SINGLE, r = s.mode === $.AB_COMPARE && Xe(), i = s.mode === $.SIDE_BY_SIDE && Y();
		if ((r || i) && ie) {
			let e = s.assets?.[s.currentIndex] || null, n = i && s.compareAsset != null, a = r ? s.compareAsset == null ? s.assets?.[0] || null : e : n ? e : s.assets?.[0] || null, o = r ? s.compareAsset == null ? s.assets?.[1] || null : s.compareAsset : n ? s.compareAsset : s.assets?.[Math.max(0, (s.assets?.length || 1) - 1)] || null, c = t(a, { showName: !1 }), l = t(o, { showName: !1 });
			try {
				c && ne.appendChild(c);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				l && ie.appendChild(l);
			} catch (e) {
				console.debug?.(e);
			}
			return;
		}
		let a = n ? [s.assets[s.currentIndex]].filter(Boolean) : Array.isArray(s.assets) ? s.assets.slice(0, 4) : [];
		for (let e of a) {
			let r = t(e, { showName: !n });
			if (r) try {
				ne.appendChild(r);
			} catch (e) {
				console.debug?.(e);
			}
		}
	};
	function Xe() {
		return (s.assets.length === 2 || s.compareAsset != null) && !De();
	}
	function Y() {
		let e = s.assets.length;
		return e >= 2 && e <= 4 || e >= 1 && s.compareAsset != null;
	}
	function Ze() {
		let e = !!s?.distractionFree;
		try {
			P.style.display = e ? "none" : "";
		} catch (e) {
			console.debug?.(e);
		}
		try {
			q.style.display = e ? "none" : "";
		} catch (e) {
			console.debug?.(e);
		}
		try {
			t.classList.toggle("mjr-viewer-focus", e);
		} catch (e) {
			console.debug?.(e);
		}
		try {
			e && (t.style.paddingRight = "0px", t.style.paddingLeft = "0px", _e.style.display = "none", K.style.display = "none");
		} catch (e) {
			console.debug?.(e);
		}
	}
	function Qe() {
		s.zoom = 1, s.panX = 0, s.panY = 0, s.targetZoom = 1;
		try {
			s.mode !== $.AB_COMPARE && s.mode !== $.SIDE_BY_SIDE && s.compareAsset != null && (s.compareAsset = null);
		} catch (e) {
			console.debug?.(e);
		}
		let e = s.assets[s.currentIndex], t = s.mode === $.AB_COMPARE && Xe(), n = s.mode === $.SIDE_BY_SIDE && Y(), r = t && s.compareAsset != null, i = n && s.compareAsset != null, a = t ? (r ? e : s.assets?.[0]) || null : n ? (i ? e : s.assets?.[0]) || null : e || null, o = t ? (r ? s.compareAsset : s.assets?.[1]) || null : n ? i ? s.compareAsset : Array.isArray(s.assets) && s.assets.length >= 2 ? s.assets[s.assets.length - 1] : null : null;
		try {
			F.textContent = a?.filename || "";
		} catch (e) {
			console.debug?.(e);
		}
		try {
			ae && re && o && o !== a ? (ae.style.display = "flex", oe && (oe.style.display = "flex"), re.textContent = o?.filename || "", se && le && L && (se.style.display = "flex", le.appendChild(L), L.style.justifyContent = "flex-start"), R && (R.style.justifyContent = "center", R.style.paddingLeft = "84px"), I && (I.style.flex = "0 0 auto"), ue && (ue.style.flex = "0 0 auto"), F && (F.style.textAlign = "left")) : ae && re && (ae.style.display = "none", oe && (oe.style.display = "none"), re.textContent = "", se && (se.style.display = "none"), ue && L && de && (ue.insertBefore(L, de), L.style.justifyContent = "center"), R && (R.style.justifyContent = "center", R.style.paddingLeft = "12px"), I && (I.style.flex = "1 1 auto"), ue && (ue.style.flex = ""), F && (F.style.textAlign = "center"));
		} catch (e) {
			console.debug?.(e);
		}
		s.mode === $.AB_COMPARE && Xe() ? xe.textContent = "2 selected" : s.mode === $.SIDE_BY_SIDE && Y() ? xe.textContent = s.compareAsset == null ? `${s.assets.length} selected` : "2 selected" : xe.textContent = `${s.currentIndex + 1} / ${s.assets.length}`, s.mode === $.AB_COMPARE && !Xe() && (s.mode = Y() ? $.SIDE_BY_SIDE : $.SINGLE), s.mode === $.SIDE_BY_SIDE && !Y() && (s.mode = $.SINGLE);
		try {
			N?.syncModeButtons?.({
				canAB: Xe,
				canSide: Y
			});
		} catch (e) {
			console.debug?.(e);
		}
		B.style.display = s.mode === $.SINGLE ? "flex" : "none", V.style.display = s.mode === $.AB_COMPARE ? "block" : "none", H.style.display = s.mode === $.SIDE_BY_SIDE ? "flex" : "none";
		try {
			s.mode !== $.SINGLE && (Fn(B), B.replaceChildren());
		} catch (e) {
			console.debug?.(e);
		}
		try {
			s.mode !== $.AB_COMPARE && (Fn(V), V.replaceChildren());
		} catch (e) {
			console.debug?.(e);
		}
		try {
			s.mode !== $.SIDE_BY_SIDE && (Fn(H), H.replaceChildren());
		} catch (e) {
			console.debug?.(e);
		}
		Ye();
		let c = s.mode === $.AB_COMPARE && Xe() || s.mode === $.SIDE_BY_SIDE && Y();
		try {
			be.style.display = c ? "none" : "", Se.style.display = c ? "none" : "";
		} catch (e) {
			console.debug?.(e);
		}
		et(), tt(s.assets, s.currentIndex), st();
		try {
			N?.syncToolsUIFromState?.();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			Ze();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			ht?.();
		} catch (e) {
			console.debug?.(e);
		}
		J();
		try {
			Ke();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			Pe().then(() => {
				try {
					Ye();
				} catch (e) {
					console.debug?.(e);
				}
			});
		} catch (e) {
			console.debug?.(e);
		}
		try {
			let e = s.mode === $.SINGLE;
			Te.sync({ isSingle: e });
		} catch (e) {
			console.debug?.(e);
		}
	}
	function et() {
		let e = s.assets[s.currentIndex];
		if (!e) return;
		let t = O(e);
		if (!t) {
			try {
				Fn(B);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				B.replaceChildren();
				let e = document.createElement("div");
				e.className = "mjr-viewer-media", e.style.cssText = "color:#ff9a9a; font-size:13px; padding:16px; text-align:center;", e.textContent = "Cannot open asset: missing or invalid filename/path.", B.appendChild(e);
			} catch (e) {
				console.debug?.(e);
			}
			return;
		}
		if (s.mode === $.SINGLE) {
			try {
				Fn(B);
			} catch (e) {
				console.debug?.(e);
			}
			B.innerHTML = "", s._mediaW = 0, s._mediaH = 0;
			let n = A(e, t);
			B.appendChild(n);
		} else s.mode === $.AB_COMPARE ? Xe() && Wr?.renderABCompareView?.({
			abView: V,
			state: s,
			currentAsset: e,
			viewUrl: t,
			buildAssetViewURL: O,
			createCompareMediaElement: j,
			destroyMediaProcessorsIn: Fn
		}) : s.mode === $.SIDE_BY_SIDE && Y() && Gr?.renderSideBySideView?.({
			sideView: H,
			state: s,
			currentAsset: e,
			viewUrl: t,
			buildAssetViewURL: O,
			createMediaElement: A,
			destroyMediaProcessorsIn: Fn
		});
		g(), v();
	}
	let { preloadAdjacentAssets: tt, preloadImageForAsset: nt, trackPreloadRef: rt } = pr({
		buildAssetViewURL: O,
		IMAGE_PRELOAD_EXTENSIONS: c,
		state: s
	}), { destroyPlayerBar: at, syncPlayerBar: ot } = Sr({
		state: s,
		APP_CONFIG: T,
		VIEWER_MODES: $,
		overlay: t,
		navBar: Ce,
		playerBarHost: we,
		singleView: B,
		abView: V,
		sideView: H,
		metadataHydrator: Oe,
		isPlayableViewerKind: On,
		collectPlayableMediaElements: kn,
		pickPrimaryPlayableMedia: An,
		mountUnifiedMediaControls: jn,
		installFollowerVideoSync: qn,
		getViewerInfo: p,
		scheduleOverlayRedraw: J,
		viewerInfoCacheGet: Me,
		viewerInfoCacheSet: Ne
	}), st = () => ot(), ct = T.VIEWER_MAX_PROC_PIXELS ?? 12e6, lt = () => ({
		exposureEV: Number(s.exposureEV) || 0,
		gamma: Math.max(.1, Math.min(3, Number(s.gamma) || 1)),
		channel: s.channel || "rgb",
		analysisMode: s.analysisMode || "none",
		zebraThreshold: Math.max(0, Math.min(1, Number(s.zebraThreshold) || .95))
	}), ut = () => {
		let e = lt();
		try {
			let n = t.querySelectorAll(".mjr-viewer-media");
			for (let t of n) try {
				let n = t?._mjrProc;
				n?.setParams && n.setParams(e);
			} catch (e) {
				console.debug?.(e);
			}
		} catch (e) {
			console.debug?.(e);
		}
		try {
			s?.mode === $.AB_COMPARE && V?._mjrDiffRequest?.();
		} catch (e) {
			console.debug?.(e);
		}
	}, dt = (e) => {
		try {
			if (!e) return !0;
			let t = Number(e.exposureEV) || 0, n = Number(e.gamma) || 1, r = String(e.channel || "rgb"), i = String(e.analysisMode || "none");
			return Math.abs(t) < 1e-4 && Math.abs(n - 1) < 1e-4 && r === "rgb" && i === "none";
		} catch {
			return !0;
		}
	}, ft = T.VIEWER_MAX_PROC_PIXELS_VIDEO ?? 3e6, pt = T.VIEWER_VIDEO_GRADE_THROTTLE_FPS ?? 15;
	try {
		d = fr({
			overlay: t,
			state: s,
			mediaTransform: f,
			updateMediaNaturalSize: D,
			clampPanToBounds: h,
			applyTransform: g,
			scheduleOverlayRedraw: J,
			getGradeParams: lt,
			isDefaultGrade: dt,
			tonemap: null,
			maxProcPixels: ct,
			maxProcPixelsVideo: ft,
			disableWebGL: !!T.VIEWER_DISABLE_WEBGL_VIDEO,
			videoGradeThrottleFps: pt,
			safeAddListener: Z,
			safeCall: X
		});
	} catch {
		d = null;
	}
	a.push(Z(be, "click", () => {
		s.currentIndex > 0 && (s.currentIndex--, Qe());
	})), a.push(Z(Se, "click", () => {
		s.currentIndex < s.assets.length - 1 && (s.currentIndex++, Qe());
	}));
	let mt = null, ht = () => {
		try {
			if (mt != null) return;
			mt = requestAnimationFrame(() => {
				mt = null;
				try {
					ut();
				} catch (e) {
					console.debug?.(e);
				}
			});
		} catch (e) {
			console.debug?.(e);
		}
	}, gt = () => {
		try {
			N?.syncToolsUIFromState?.();
		} catch (e) {
			console.debug?.(e);
		}
	}, _t = (e) => {
		if (!Array.isArray(s.assets) || s.assets.length === 0) return !1;
		let t = s.currentIndex + e;
		return t < 0 || t >= s.assets.length ? !1 : (s.currentIndex = t, Qe(), !0);
	}, vt = (e) => {
		if (t.style.display === "none") return;
		try {
			let t = e.target;
			if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
		} catch (e) {
			console.debug?.(e);
		}
		try {
			if (!fe.contains(e.target)) return;
		} catch (e) {
			console.debug?.(e);
		}
		try {
			if (Kr?.isModel3DInteractionTarget?.(e?.target)) return;
		} catch (e) {
			console.debug?.(e);
		}
		try {
			e.preventDefault(), e.stopPropagation(), e.stopImmediatePropagation?.();
		} catch (e) {
			console.debug?.(e);
		}
		let n = Number(e.deltaX) || 0, r = Number(e.deltaY) || 0;
		if (e.shiftKey && r && _t(r > 0 ? 1 : -1) || Math.abs(n) > Math.abs(r) && Math.abs(n) > 30 && _t(n > 0 ? 1 : -1) || !r) return;
		let i = Math.exp(-r * .0015);
		_((Number(s.zoom) || 1) * i, {
			clientX: e.clientX,
			clientY: e.clientY
		});
	}, yt = (e, t, n, { offsetX: r = 16, offsetY: i = 16 } = {}) => {
		try {
			let a = S();
			if (!a) return;
			let o = fe.getBoundingClientRect(), s = (Number(t) || 0) - o.left, c = (Number(n) || 0) - o.top, l = Number(e.offsetWidth) || 0, u = Number(e.offsetHeight) || 0, d = s + r, f = c + i;
			d = Math.max(10, Math.min(d, a.width - l - 10)), f = Math.max(10, Math.min(f, a.height - u - 10)), e.style.left = `${Math.round(d)}px`, e.style.top = `${Math.round(f)}px`;
		} catch (e) {
			console.debug?.(e);
		}
	}, bt = Yn({
		overlay: t,
		content: fe,
		state: s,
		VIEWER_MODES: $,
		getPrimaryMedia: y,
		getMediaNaturalSize: x,
		getViewportRect: S,
		positionOverlayBox: yt,
		probeTooltip: me,
		loupeWrap: he,
		onLoupeRedraw: Xn({
			state: s,
			loupeCanvas: ge,
			loupeWrap: he,
			getMediaNaturalSize: x,
			positionOverlayBox: yt
		}).redraw,
		lifecycle: n
	});
	try {
		if (!fe._mjrOverlayResizeBound && "ResizeObserver" in window) {
			try {
				t._mjrResizeObserver?.disconnect?.();
			} catch (e) {
				console.debug?.(e);
			}
			let e = new ResizeObserver(() => {
				try {
					s._viewportCache = null;
				} catch (e) {
					console.debug?.(e);
				}
				J();
			});
			try {
				e.observe(fe);
			} catch (e) {
				console.debug?.(e);
			}
			t._mjrResizeObserver = e, a.push(() => {
				try {
					e.disconnect();
				} catch (e) {
					console.debug?.(e);
				}
			}), fe._mjrOverlayResizeBound = !0;
		}
	} catch (e) {
		console.debug?.(e);
	}
	let xt = Gn({
		overlay: t,
		content: fe,
		singleView: B,
		state: s,
		VIEWER_MODES: $,
		computeOneToOneZoom: E,
		setZoom: _,
		scheduleOverlayRedraw: J,
		scheduleApplyGrade: ht,
		syncToolsUIFromState: gt,
		applyDistractionFreeUI: Ze,
		navigateViewerAssets: _t,
		closeViewer: Tt,
		renderBadges: Ye,
		updateAssetRating: e,
		safeDispatchCustomEvent: ce,
		ASSET_RATING_CHANGED_EVENT: k,
		probeTooltip: me,
		loupeWrap: he,
		renderGenInfoPanel: Ke,
		getVideoControls: () => {
			try {
				return s?._videoControlsMounted || null;
			} catch {
				return null;
			}
		},
		lifecycle: n
	}), St = [], Ct = () => {
		try {
			for (let e of St) X(e);
		} catch (e) {
			console.debug?.(e);
		}
		St = [];
		try {
			xt?.unbind?.();
		} catch (e) {
			console.debug?.(e);
		}
	}, wt = () => {
		Ct();
		try {
			St.push(Z(t, "click", (e) => {
				try {
					if (e.target !== t) return;
				} catch (e) {
					console.debug?.(e);
				}
				Tt();
			}));
		} catch (e) {
			console.debug?.(e);
		}
		try {
			St.push(Z(fe, "wheel", vt, {
				passive: !1,
				capture: !0
			}));
		} catch (e) {
			console.debug?.(e);
		}
		try {
			let e = null;
			St.push(Z(fe, "touchstart", (t) => {
				try {
					if (t.touches?.length !== 1) return;
					let n = t.touches[0];
					e = {
						x: n.clientX,
						y: n.clientY,
						t: Date.now()
					};
				} catch (e) {
					console.debug?.(e);
				}
			}, { passive: !0 })), St.push(Z(fe, "touchend", (t) => {
				try {
					if (!e) return;
					if (t.changedTouches?.length !== 1) {
						e = null;
						return;
					}
					let n = t.changedTouches[0], r = n.clientX - e.x, i = n.clientY - e.y, a = Date.now() - e.t;
					if (e = null, a > 600 || Math.abs(i) > 80) return;
					Math.abs(r) >= 60 && _t(r < 0 ? 1 : -1);
				} catch (e) {
					console.debug?.(e);
				}
			}, { passive: !0 })), St.push(Z(fe, "touchcancel", () => {
				e = null;
			}, { passive: !0 }));
		} catch (e) {
			console.debug?.(e);
		}
		try {
			St.push(Z(fe, "mousemove", (e) => {
				try {
					s._lastPointerX = e.clientX, s._lastPointerY = e.clientY;
				} catch (e) {
					console.debug?.(e);
				}
			}, {
				passive: !0,
				capture: !0
			}));
		} catch (e) {
			console.debug?.(e);
		}
		try {
			xt?.bind?.();
		} catch (e) {
			console.debug?.(e);
		}
	};
	try {
		t._mjrBadgeSyncBound ||= (a.push(Z(window, k, (e) => {
			try {
				let t = e?.detail?.assetId, n = e?.detail?.rating;
				if (t == null) return;
				for (let e of s.assets || []) e?.id != null && String(e.id) === String(t) && (e.rating = n);
				try {
					Oe?.deleteCached?.(t);
				} catch (e) {
					console.debug?.(e);
				}
				Ye();
			} catch (e) {
				console.debug?.(e);
			}
		}, { passive: !0 })), a.push(Z(window, w, (e) => {
			try {
				let t = e?.detail?.assetId, n = e?.detail?.tags;
				if (t == null) return;
				for (let e of s.assets || []) e?.id != null && String(e.id) === String(t) && (e.tags = n);
				try {
					Oe?.deleteCached?.(t);
				} catch (e) {
					console.debug?.(e);
				}
				Ye();
			} catch (e) {
				console.debug?.(e);
			}
		}, { passive: !0 })), !0);
	} catch (e) {
		console.debug?.(e);
	}
	function Tt() {
		try {
			let e = s.assets?.[s.currentIndex];
			e?.id && ce(b, { assetId: String(e.id) }, { warnPrefix: "[ViewerRuntime]" });
		} catch (e) {
			console.debug?.(e);
		}
		try {
			s.distractionFree = !1, Ze();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			Oe?.abort?.();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			at();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			s._scopesVideoAbort?.abort?.();
		} catch (e) {
			console.debug?.(e);
		}
		s._scopesVideoAbort = null;
		try {
			s._panHintTimer && clearTimeout(s._panHintTimer);
		} catch (e) {
			console.debug?.(e);
		}
		s._panHintTimer = null;
		try {
			s._panHintAt = 0;
		} catch (e) {
			console.debug?.(e);
		}
		try {
			V?._mjrSyncAbort?.abort?.();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			V?._mjrDiffAbort?.abort?.();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			V._mjrSyncAbort = null;
		} catch (e) {
			console.debug?.(e);
		}
		try {
			V._mjrDiffAbort = null;
		} catch (e) {
			console.debug?.(e);
		}
		try {
			H?._mjrSyncAbort?.abort?.();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			H._mjrSyncAbort = null;
		} catch (e) {
			console.debug?.(e);
		}
		try {
			V?._mjrSliderAbort?.abort?.();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			V._mjrSliderAbort = null;
		} catch (e) {
			console.debug?.(e);
		}
		try {
			let e = t.querySelectorAll?.("video, audio");
			if (e && e.length) for (let t of e) {
				try {
					t.muted = !0;
				} catch (e) {
					console.debug?.(e);
				}
				try {
					t.pause?.();
				} catch (e) {
					console.debug?.(e);
				}
				try {
					t.currentTime = 0;
				} catch (e) {
					console.debug?.(e);
				}
				try {
					let e = t.querySelectorAll?.("source");
					if (e && e.length) for (let t of e) try {
						t.remove();
					} catch (e) {
						console.debug?.(e);
					}
				} catch (e) {
					console.debug?.(e);
				}
				try {
					t.removeAttribute?.("src");
				} catch (e) {
					console.debug?.(e);
				}
				try {
					t.load?.();
				} catch (e) {
					console.debug?.(e);
				}
			}
		} catch (e) {
			console.debug?.(e);
		}
		try {
			Fn(B), B.replaceChildren();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			Fn(V), V.replaceChildren();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			Fn(H), H.replaceChildren();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			s.genInfoOpen = !1;
		} catch (e) {
			console.debug?.(e);
		}
		try {
			Be();
		} catch (e) {
			console.debug?.(e);
		}
		try {
			_e.style.display = "none", ze(G);
		} catch (e) {
			console.debug?.(e);
		}
		try {
			K.style.display = "none", ze(ye);
		} catch (e) {
			console.debug?.(e);
		}
		t.style.display = "none", t.style.pointerEvents = "none", Ct();
		try {
			document.body.style.overflow = s._prevBodyOverflow ?? "";
		} catch {
			document.body.style.overflow = "";
		}
		try {
			s._prevFocusedElement && typeof s._prevFocusedElement.focus == "function" && s._prevFocusedElement.focus(), s._prevFocusedElement = null;
		} catch (e) {
			console.debug?.(e);
		}
		let e = s?._prevHotkeyScope;
		i(e || "panel"), s._prevHotkeyScope = null;
	}
	let Et = {
		open(e, n = 0, r = null) {
			wt(), s.assets = Array.isArray(e) ? e : [e], s.currentIndex = Math.max(0, Math.min(n, s.assets.length - 1)), s.distractionFree = !1;
			try {
				Te.rebuild();
			} catch (e) {
				console.debug?.(e);
			}
			s.zoom = 1, s.panX = 0, s.panY = 0, s.targetZoom = 1, s._userInteracted = !1, s._panHintAt = 0;
			try {
				s._panHintTimer && clearTimeout(s._panHintTimer);
			} catch (e) {
				console.debug?.(e);
			}
			s._panHintTimer = null, s._lastPointerX = null, s._lastPointerY = null, s._mediaW = 0, s._mediaH = 0, s.compareAsset = r, s.gridMode = 0, Be(), s._probe = null;
			try {
				me.style.display = "none";
			} catch (e) {
				console.debug?.(e);
			}
			try {
				he.style.display = "none";
			} catch (e) {
				console.debug?.(e);
			}
			t.style.display = "flex", t.style.pointerEvents = "auto";
			try {
				s._prevFocusedElement = document.activeElement;
			} catch {
				s._prevFocusedElement = null;
			}
			t.focus();
			try {
				s._prevBodyOverflow = document.body.style.overflow;
			} catch {
				s._prevBodyOverflow = "";
			}
			document.body.style.overflow = "hidden", s._prevHotkeyScope = u().scope || null, i("viewer"), Qe();
			try {
				gt();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				ht();
			} catch (e) {
				console.debug?.(e);
			}
			J();
		},
		close() {
			Tt();
		},
		setMode(e) {
			Object.values($).includes(e) && (s.mode = e, Qe());
		},
		setCompareAsset(e) {
			s.compareAsset = e, Qe();
		},
		dispose() {
			try {
				Tt();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				Ae.clear();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				Fn(B);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				Fn(V);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				Fn(H);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				Ie != null && cancelAnimationFrame(Ie);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				mt != null && cancelAnimationFrame(mt);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				bt?.dispose?.();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				xt?.dispose?.();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				t._mjrResizeObserver?.disconnect?.();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				t._mjrResizeObserver = null;
			} catch (e) {
				console.debug?.(e);
			}
			try {
				Oe?.dispose?.();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				Dn(t);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				for (let e of t._mjrViewerUnsubs || []) X(e);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				t._mjrViewerUnsubs = [];
			} catch (e) {
				console.debug?.(e);
			}
			try {
				s._preloadRefs?.clear?.();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				s._preloadedAssetKeys?.clear?.();
			} catch (e) {
				console.debug?.(e);
			}
			try {
				t.remove?.();
			} catch (e) {
				console.debug?.(e);
			}
		}
	};
	try {
		ee = () => Et.close();
	} catch (e) {
		console.debug?.(e);
	}
	t._mjrViewerAPI = Et;
	try {
		En({
			overlayEl: t,
			getCurrentAsset: () => s.assets[s.currentIndex],
			getCurrentViewUrl: (e) => O(e),
			onAssetChanged: () => {
				try {
					Ye();
				} catch (e) {
					console.debug?.(e);
				}
			}
		});
	} catch (e) {
		console.debug?.(e);
	}
	return t;
}
function Qr() {
	return xr(Zr);
}
//#endregion
export { $e as A, ze as B, mt as C, ut as D, ft as E, rt as F, we as G, He as H, Ke as I, L as J, le as K, Ue as L, Ze as M, nt as N, st as O, tt as P, Ee as R, vt as S, dt as T, Be as U, Me as V, Te as W, ce as Y, Ot as _, pn as a, bt as b, ln as c, Qt as d, Ft as f, Dt as g, X as h, rn as i, it as j, Qe as k, an as l, Pt as m, qn as n, un as o, Nt as p, I as q, jn as r, on as s, Qr as t, Q as u, Tt as v, pt as w, ht as x, Et as y, Ne as z };
