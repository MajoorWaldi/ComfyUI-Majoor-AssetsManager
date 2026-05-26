import { B as e, Bt as t, Ct as n, Dt as r, Et as i, F as a, Ft as o, H as s, Ht as c, I as l, It as u, L as d, Lt as f, M as p, N as m, Nt as h, O as g, P as _, Pt as v, Qt as y, R as b, Rt as x, Tt as S, U as C, Ut as w, W as T, Wt as E, Zt as ee, _t as te, at as ne, bt as re, ct as ie, dt as ae, ft as oe, gt as se, ht as ce, it as D, j as O, lt as le, n as ue, nt as de, ot as fe, qt as pe, r as me, rt as he, st as ge, tt as _e, ut as ve, x as ye, yt as be, z as xe, zt as k } from "./hostAdapter-Fz6J-dy6.js";
import { m as Se, n as A, t as j } from "./config-CXns6XwM.js";
import { B as Ce, C as we, D as Te, E as Ee, F as M, H as De, L as N, M as Oe, N as ke, S as P, T as F, U as Ae, Z as I, _ as je, a as Me, at as L, c as Ne, d as Pe, f as Fe, g as Ie, h as Le, i as Re, it as ze, l as Be, m as Ve, n as He, o as Ue, ot as R, p as We, r as Ge, rt as Ke, s as qe, t as Je, u as Ye, v as Xe, w as z, x as B, y as V, z as Ze } from "./mjr-primevue-DeVPqKdl.js";
import { n as Qe, r as $e, t as et } from "./mjr-vue-vendor--o0qJuos.js";
import { a as tt, i as nt, n as rt, o as it, r as at, t as ot } from "./geninfoParser-s-OHjo5D.js";
//#region ui/app/settings/settingsRuntime.ts
var st = "mjr-runtime-status-dashboard", ct = "__mjr_write_token";
function lt() {
	try {
		return String(sessionStorage?.getItem?.(ct) || "").trim();
	} catch {
		return "";
	}
}
function ut(e, t) {
	let n = t === "auth" ? "__mjrAuthLine" : "__mjrMetricsLine";
	if (e?.[n]) return e[n];
	let r = document.createElement("div");
	return r.style.whiteSpace = "nowrap", r.style.lineHeight = "1.35", t === "auth" && (r.style.marginTop = "4px", r.style.fontWeight = "600"), e.appendChild(r), e[n] = r, r;
}
function dt(e) {
	let t = lt(), n = String(e?.token_hint || "").trim() || (t ? `...${t.slice(-4)}` : ""), r = e?.allow_write !== !1, i = e?.require_auth === !0, a = e?.token_configured === !0;
	return r ? t ? {
		text: k("runtime.writeAuthActive", "Write auth: active {tokenHint}", { tokenHint: n || "(session)" }),
		color: "#7ee0a0"
	} : i && a ? {
		text: k("runtime.writeAuthMissing", "Write auth: missing in this browser {tokenHint}", { tokenHint: n || "(server token configured)" }),
		color: "#f1c36d"
	} : i ? {
		text: k("runtime.writeAuthRequired", "Write auth: required"),
		color: "#f1c36d"
	} : e && typeof e == "object" ? {
		text: k("runtime.writeAuthNotRequired", "Write auth: not required"),
		color: "#8fd0ff"
	} : {
		text: k("runtime.writeAuthUnknown", "Write auth: unknown"),
		color: "#c8ced8"
	} : {
		text: k("runtime.writeAuthBlocked", "Write auth: writes blocked by server"),
		color: "#ff9b9b"
	};
}
function ft() {
	try {
		let e = document.querySelector(".mjr-assets-manager.mjr-am-container"), t = document.getElementById(st);
		if (!e) {
			try {
				t?.remove?.();
			} catch (e) {
				console.debug?.(e);
			}
			return null;
		}
		try {
			let t = String(getComputedStyle(e).position || "").toLowerCase();
			(!t || t === "static") && (e.style.position = "relative");
		} catch (e) {
			console.debug?.(e);
		}
		let n = document.getElementById(st);
		return n ? n.parentElement !== e && e.appendChild(n) : (n = document.createElement("div"), n.id = st, n.style.position = "absolute", n.style.bottom = "10px", n.style.right = "10px", n.style.zIndex = "9999", n.style.padding = "6px 10px", n.style.borderRadius = "10px", n.style.border = "1px solid rgba(255,255,255,0.16)", n.style.background = "rgba(0,0,0,0.45)", n.style.backdropFilter = "blur(4px)", n.style.color = "var(--content-fg, #fff)", n.style.fontSize = "11px", n.style.pointerEvents = "none", n.style.display = "flex", n.style.flexDirection = "column", e.appendChild(n)), n;
	} catch {
		return null;
	}
}
async function pt() {
	let e = ft();
	if (!e) return !1;
	let t = ut(e, "metrics"), n = ut(e, "auth");
	try {
		let [r, i] = await Promise.all([b(), xe()]), a = k("runtime.unavailable", "Runtime: unavailable");
		if (!r?.ok || !r?.data) t.textContent = a;
		else {
			let e = r.data.db || {}, n = r.data.index || {}, i = r.data.watcher || {}, o = Number(e.active_connections || 0), s = Number(n.enrichment_queue_length || 0), c = Number(i.pending_files || 0);
			t.textContent = k("runtime.metricsLine", "DB active: {active} | Enrich Q: {enrichQ} | Watcher pending: {pending}", {
				active: o,
				enrichQ: s,
				pending: c
			}), a = k("runtime.metricsTitle", "Runtime Metrics\nDB active connections: {active}\nEnrichment queue: {enrichQ}\nWatcher pending files: {pending}", {
				active: o,
				enrichQ: s,
				pending: c
			});
		}
		let o = dt(i?.data?.prefs || null);
		return n.textContent = o.text, n.style.color = o.color, e.title = `${a}\n${o.text}`, !0;
	} catch {
		return t.textContent = k("runtime.unavailable", "Runtime: unavailable"), n.textContent = k("runtime.writeAuthUnknown", "Write auth: unknown"), n.style.color = "#c8ced8", e.title = `${k("runtime.unavailable", "Runtime: unavailable")}\n${n.textContent}`, !0;
	}
}
function mt() {
	try {
		pt().catch(() => {}), window.__MJR_RUNTIME_STATUS_INFLIGHT__ ?? (window.__MJR_RUNTIME_STATUS_INFLIGHT__ = !1), window.__MJR_RUNTIME_STATUS_MISS_COUNT__ ?? (window.__MJR_RUNTIME_STATUS_MISS_COUNT__ = 0), window.__MJR_RUNTIME_STATUS_INTERVAL__ || (window.__MJR_RUNTIME_STATUS_INTERVAL__ = setInterval(() => {
			window.__MJR_RUNTIME_STATUS_INFLIGHT__ || (window.__MJR_RUNTIME_STATUS_INFLIGHT__ = !0, pt().then((e) => {
				if (e) {
					window.__MJR_RUNTIME_STATUS_MISS_COUNT__ = 0;
					return;
				}
				window.__MJR_RUNTIME_STATUS_MISS_COUNT__ = Number(window.__MJR_RUNTIME_STATUS_MISS_COUNT__ || 0) + 1;
			}).catch(() => {}).finally(() => {
				window.__MJR_RUNTIME_STATUS_INFLIGHT__ = !1;
			}));
		}, 1e4));
	} catch (e) {
		console.debug?.(e);
	}
}
//#endregion
//#region ui/utils/events.ts
function ht(e, t, { target: n = null, warnPrefix: r = "[Majoor]" } = {}) {
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
//#region ui/app/settings/settingsUtils.ts
var H = (e, t) => {
	if (typeof e == "boolean") return e;
	if (typeof e == "string") {
		let t = e.trim().toLowerCase();
		if ([
			"1",
			"true",
			"yes",
			"on"
		].includes(t)) return !0;
		if ([
			"0",
			"false",
			"no",
			"off"
		].includes(t)) return !1;
	}
	return !!t;
}, U = (e, t) => {
	let n = Number(e);
	return Number.isFinite(n) ? n : Number(t);
}, gt = (e, t, n) => {
	let r = typeof e == "string" ? e.trim() : String(e ?? "");
	return t.includes(r) ? r : n;
}, _t = (e) => e === "__proto__" || e === "prototype" || e === "constructor", vt = (e, t) => {
	let n = { ...e };
	return !t || typeof t != "object" || Object.keys(t).forEach((r) => {
		if (_t(r)) return;
		let i = t[r];
		i && typeof i == "object" && !Array.isArray(i) ? n[r] = vt(e[r] || {}, i) : i !== void 0 && (n[r] = i);
	}), n;
}, yt = Object.freeze({
	small: 80,
	medium: 120,
	large: 180
}), bt = Object.freeze([
	"small",
	"medium",
	"large"
]), xt = (e, t) => Math.max(60, Math.min(600, Math.round(U(e, t)))), St = (e = {}) => {
	let t = Number(e?.minSize);
	if (Number.isFinite(t)) return xt(t, A.GRID_MIN_SIZE);
	let n = gt(String(e?.minSizePreset || "").toLowerCase(), bt, "");
	return n ? yt[n] : xt(e?.minSize, A.GRID_MIN_SIZE);
}, Ct = (e = {}) => xt(e?.minSize, A.FEED_GRID_MIN_SIZE), wt = (e) => {
	let t = Math.round(U(e, A.GRID_MIN_SIZE));
	return t <= 100 ? "small" : t >= 150 ? "large" : "medium";
}, Tt = async (e, t = "Majoor", n = {}) => {
	let r = kt();
	if (r && typeof r.alert == "function") try {
		await r.alert({
			title: String(t || "Majoor"),
			message: String(e || "")
		});
		return;
	} catch (e) {
		console.debug?.(e);
	}
	let i = At();
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
		let n = jt();
		if (n) try {
			n.show(Mt(e, t));
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
	let a = Lt();
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
		Vt(r);
		let i = W("div", { style: {
			display: "flex",
			flexDirection: "column",
			gap: "18px",
			padding: "18px 20px 18px 20px"
		} }, [
			W("div", { style: {
				display: "flex",
				alignItems: "center",
				justifyContent: "flex-start"
			} }, [W("div", {
				textContent: t,
				style: {
					fontWeight: "700",
					fontSize: "30px",
					color: "rgba(255,255,255,0.96)",
					lineHeight: "1.2"
				}
			})]),
			W("div", {
				textContent: String(e || ""),
				style: {
					fontSize: "22px",
					color: "rgba(255,255,255,0.86)",
					whiteSpace: "pre-wrap",
					lineHeight: "1.45"
				}
			}),
			W("div", { style: {
				display: "flex",
				justifyContent: "flex-end",
				gap: "10px"
			} }, [W("button", {
				textContent: k("dialog.confirm", "Confirm"),
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
			r.show(i), setTimeout(() => Ht(r), 0);
		} catch {
			try {
				window.alert(e);
			} catch (e) {
				console.debug?.(e);
			}
			n();
		}
	});
}, Et = async (e, t = "Majoor") => {
	let n = kt();
	if (n) try {
		let r = {
			title: String(t || k("dialog.confirm", "Confirm")),
			message: String(e || "")
		};
		return !!(typeof n.confirm == "function" && await n.confirm(r));
	} catch (e) {
		console.debug?.(e);
	}
	let r = Lt();
	if (!r) try {
		return window.confirm(e);
	} catch {
		return !1;
	}
	return new Promise((n) => {
		let i = new r();
		Vt(i);
		let a = (e) => {
			try {
				i.close();
			} catch (e) {
				console.debug?.(e);
			}
			n(!!e);
		}, o = W("div", { style: {
			display: "flex",
			flexDirection: "column",
			gap: "18px",
			padding: "18px 20px 18px 20px"
		} }, [
			W("div", { style: {
				display: "flex",
				alignItems: "center",
				justifyContent: "flex-start"
			} }, [W("div", {
				textContent: t,
				style: {
					fontWeight: "700",
					fontSize: "30px",
					color: "rgba(255,255,255,0.96)",
					lineHeight: "1.2"
				}
			})]),
			W("div", {
				textContent: String(e || ""),
				style: {
					fontSize: "22px",
					color: "rgba(255,255,255,0.86)",
					whiteSpace: "pre-wrap",
					lineHeight: "1.45"
				}
			}),
			W("div", { style: {
				display: "flex",
				justifyContent: "flex-end",
				gap: "10px"
			} }, [W("button", {
				textContent: k("dialog.cancel", "Cancel"),
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
			}), W("button", {
				textContent: k("dialog.confirm", "Confirm"),
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
			i.show(o), setTimeout(() => Ht(i), 0);
		} catch {
			try {
				n(!!window.confirm(e));
			} catch {
				n(!1);
			}
		}
	});
}, Dt = async (e, t = "", n = "Majoor") => {
	let r = kt();
	if (r) try {
		let i = {
			title: String(n || k("dialog.prompt", "Prompt")),
			message: String(e || ""),
			defaultValue: String(t ?? "")
		}, a = typeof r.prompt == "function" ? await r.prompt(i) : null;
		return a == null ? null : String(a);
	} catch (e) {
		console.debug?.(e);
	}
	let i = Lt();
	if (!i) try {
		return window.prompt(e, t);
	} catch {
		return null;
	}
	return new Promise((r) => {
		let a = new i();
		Vt(a);
		let o = (e) => {
			try {
				a.close();
			} catch (e) {
				console.debug?.(e);
			}
			r(e ?? null);
		}, s = W("input", {
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
		}), c = W("div", { style: {
			display: "flex",
			flexDirection: "column",
			gap: "12px",
			padding: "16px"
		} }, [
			W("div", {
				textContent: n,
				style: {
					fontWeight: "600",
					fontSize: "14px",
					color: "rgba(255,255,255,0.95)"
				}
			}),
			W("div", {
				textContent: String(e || ""),
				style: {
					fontSize: "13px",
					color: "rgba(255,255,255,0.80)",
					whiteSpace: "pre-wrap",
					lineHeight: "1.4"
				}
			}),
			s,
			W("div", { style: {
				display: "flex",
				justifyContent: "flex-end",
				gap: "10px"
			} }, [W("button", {
				textContent: k("dialog.cancel", "Cancel"),
				onclick: () => o(null),
				style: {
					padding: "8px 12px",
					borderRadius: "8px",
					border: "1px solid rgba(255,255,255,0.12)",
					background: "rgba(0,0,0,0.25)",
					color: "rgba(255,255,255,0.85)",
					cursor: "pointer"
				}
			}), W("button", {
				textContent: k("dialog.ok", "OK"),
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
			a.show(c), setTimeout(() => Ht(a), 0), setTimeout(() => {
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
}, Ot = () => {
	try {
		return c()?.ui || null;
	} catch {
		return null;
	}
}, kt = () => {
	let e = (e) => !!e && (typeof e.alert == "function" || typeof e.confirm == "function" || typeof e.prompt == "function");
	try {
		let t = w(c());
		if (e(t)) return t;
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let t = (typeof window < "u" ? window?.app : null)?.extensionManager?.dialog || null;
		if (e(t)) return t;
	} catch (e) {
		console.debug?.(e);
	}
	return null;
}, At = () => {
	try {
		let e = E(c());
		if (e && typeof e.add == "function") return e;
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let e = (typeof window < "u" ? window?.app : null)?.extensionManager?.toast || null;
		if (e && typeof e.add == "function") return e;
	} catch (e) {
		console.debug?.(e);
	}
	return null;
}, jt = () => {
	try {
		let e = Ot();
		if (e?.dialog && typeof e.dialog.show == "function") return e.dialog;
	} catch (e) {
		console.debug?.(e);
	}
	return null;
}, Mt = (e, t = "Majoor") => {
	let n = String(e ?? ""), r = String(t ?? "").trim();
	return !r || r.toLowerCase() === "majoor" ? n : `${r}<br><br>${n}`;
}, Nt = new Set(/* @__PURE__ */ "abort.blur.change.click.close.contextmenu.dblclick.dragend.dragenter.dragleave.dragover.dragstart.drop.error.focus.input.keydown.keypress.keyup.load.mousedown.mouseenter.mouseleave.mousemove.mouseout.mouseover.mouseup.reset.resize.scroll.select.submit.touchcancel.touchend.touchmove.touchstart.transitionend.unload.wheel".split(".")), Pt = new Set([
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
]), Ft = new Set([
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
]), It = (e, t = {}, n = []) => {
	let r = document.createElement(e);
	return Object.entries(t || {}).forEach(([e, t]) => {
		let n = String(e || "");
		if (!(!n || Pt.has(n))) {
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
					Nt.has(e) && r.addEventListener(e, t);
				}
				return;
			}
			if (Ft.has(n)) try {
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
}, W = (e, t, n) => {
	let r = Ot();
	if (r?.$el) try {
		return r.$el(e, t, n);
	} catch {}
	return It(e, t, n);
}, Lt = () => Ot()?.ComfyDialog || null, Rt = 999999, zt = 560, Bt = 12, Vt = (e) => {
	try {
		e.element.style.zIndex = String(Rt), e.element.style.width = `${zt}px`, e.element.style.padding = "0", e.element.style.backgroundColor = "var(--comfy-menu-bg, #131722)", e.element.style.border = "1px solid rgba(255,255,255,0.14)", e.element.style.borderRadius = `${Bt}px`, e.element.style.boxSizing = "border-box", e.element.style.overflow = "hidden", e.element.style.boxShadow = "0 18px 48px rgba(0,0,0,0.48)";
	} catch (e) {
		console.debug?.(e);
	}
}, Ht = (e) => {
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
}, G = {
	debug: {
		safeCall: A.DEBUG_SAFE_CALL,
		safeListeners: A.DEBUG_SAFE_LISTENERS,
		viewer: A.DEBUG_VIEWER
	},
	grid: {
		pageSize: A.DEFAULT_PAGE_SIZE,
		minSize: A.GRID_MIN_SIZE,
		minSizePreset: "medium",
		gap: A.GRID_GAP,
		showExtBadge: A.GRID_SHOW_BADGES_EXTENSION,
		showRatingBadge: A.GRID_SHOW_BADGES_RATING,
		showTagsBadge: A.GRID_SHOW_BADGES_TAGS,
		showDetails: A.GRID_SHOW_DETAILS,
		showFilename: A.GRID_SHOW_DETAILS_FILENAME,
		showDate: A.GRID_SHOW_DETAILS_DATE,
		showDimensions: A.GRID_SHOW_DETAILS_DIMENSIONS,
		showGenTime: A.GRID_SHOW_DETAILS_GENTIME,
		showHoverInfo: A.GRID_SHOW_HOVER_INFO,
		showWorkflowDot: A.GRID_SHOW_WORKFLOW_DOT,
		videoAutoplayMode: A.GRID_VIDEO_AUTOPLAY_MODE,
		starColor: A.BADGE_STAR_COLOR,
		badgeImageColor: A.BADGE_IMAGE_COLOR,
		badgeVideoColor: A.BADGE_VIDEO_COLOR,
		badgeAudioColor: A.BADGE_AUDIO_COLOR,
		badgeModel3dColor: A.BADGE_MODEL3D_COLOR,
		badgeDuplicateAlertColor: A.BADGE_DUPLICATE_ALERT_COLOR
	},
	infiniteScroll: {
		enabled: A.INFINITE_SCROLL_ENABLED,
		rootMargin: A.INFINITE_SCROLL_ROOT_MARGIN,
		threshold: A.INFINITE_SCROLL_THRESHOLD,
		bottomGapPx: A.BOTTOM_GAP_PX
	},
	siblings: { hidePngSiblings: !0 },
	autoScan: { onStartup: A.AUTO_SCAN_ON_STARTUP },
	scan: { fastMode: !0 },
	watcher: {
		enabled: !0,
		debounceMs: A.WATCHER_DEBOUNCE_MS,
		dedupeTtlMs: A.WATCHER_DEDUPE_TTL_MS,
		maxPending: 500,
		minSize: 100,
		maxSize: 4294967296
	},
	safety: { confirmDeletion: !0 },
	status: { pollInterval: A.STATUS_POLL_INTERVAL },
	viewer: {
		allowPanAtZoom1: A.VIEWER_ALLOW_PAN_AT_ZOOM_1,
		disableWebGL: A.VIEWER_DISABLE_WEBGL_VIDEO,
		pauseDuringExecution: A.VIEWER_PAUSE_DURING_EXECUTION,
		floatingPauseDuringExecution: A.FLOATING_VIEWER_PAUSE_DURING_EXECUTION,
		mfvLiveDefault: A.MFV_LIVE_DEFAULT,
		mfvPreviewDefault: A.MFV_PREVIEW_DEFAULT,
		videoGradeThrottleFps: A.VIEWER_VIDEO_GRADE_THROTTLE_FPS,
		scopesFps: A.VIEWER_SCOPES_FPS,
		metaTtlMs: A.VIEWER_META_TTL_MS,
		metaMaxEntries: A.VIEWER_META_MAX_ENTRIES,
		mfvSidebarPosition: "right",
		mfvPreviewMethod: A.MFV_PREVIEW_METHOD,
		ltxavRgbFallback: !1
	},
	rtHydrate: {
		concurrency: A.RT_HYDRATE_CONCURRENCY,
		queueMax: A.RT_HYDRATE_QUEUE_MAX,
		seenMax: A.RT_HYDRATE_SEEN_MAX,
		pruneBudget: A.RT_HYDRATE_PRUNE_BUDGET,
		seenTtlMs: A.RT_HYDRATE_SEEN_TTL_MS
	},
	observability: {
		enabled: !1,
		verboseErrors: !1,
		verboseRouteRegistrationLogs: !1,
		verboseStartupLogs: !1
	},
	feed: {
		minSize: A.FEED_GRID_MIN_SIZE,
		showInfo: A.FEED_SHOW_INFO,
		showFilename: A.FEED_SHOW_FILENAME,
		showDimensions: A.FEED_SHOW_DIMENSIONS,
		showDate: A.FEED_SHOW_DATE,
		showGenTime: A.FEED_SHOW_GENTIME,
		showWorkflowDot: A.FEED_SHOW_WORKFLOW_DOT,
		showExtBadge: A.FEED_SHOW_BADGES_EXTENSION,
		showRatingBadge: A.FEED_SHOW_BADGES_RATING,
		showTagsBadge: A.FEED_SHOW_BADGES_TAGS
	},
	sidebar: {
		position: "right",
		showPreviewThumb: !0,
		widthPx: 360
	},
	probeBackend: { mode: "auto" },
	i18n: { followComfyLanguage: !0 },
	metadataFallback: {
		image: !0,
		media: !0
	},
	paths: {
		outputDirectory: "",
		indexDirectory: ""
	},
	db: {
		timeoutMs: 5e3,
		maxConnections: 10,
		queryTimeoutMs: 1e3
	},
	ratingTagsSync: { enabled: !0 },
	cache: { tagsTTLms: 3e4 },
	search: { maxResults: A.SEARCH_DEFAULT_LIMIT },
	ai: {
		vectorSearchEnabled: !0,
		vectorCaptionOnIndex: !1,
		verboseAiLogs: !1
	},
	executionGrouping: { enabled: A.EXECUTION_GROUPING_ENABLED },
	workflowMinimap: {
		enabled: !1,
		nodeColors: !0,
		showLinks: !0,
		showGroups: !0,
		renderBypassState: !0,
		renderErrorState: !0,
		showViewport: !0,
		showNodeLabels: !1,
		size: "comfortable"
	},
	ui: {
		cardHoverColor: A.UI_CARD_HOVER_COLOR,
		cardSelectionColor: A.UI_CARD_SELECTION_COLOR,
		ratingColor: A.UI_RATING_COLOR,
		tagColor: A.UI_TAG_COLOR
	},
	security: {
		safeMode: !1,
		allowWrite: !0,
		allowRemoteWrite: !0,
		allowDelete: !0,
		allowRename: !0,
		allowOpenInFolder: !0,
		allowResetIndex: !0,
		apiToken: "",
		tokenConfigured: !1,
		tokenHint: ""
	}
}, K = () => {
	try {
		let e = t.get(y);
		if (!e) return { ...G };
		let n = JSON.parse(e), r = n && typeof n == "object" && Number.isInteger(n.version) && n.data && typeof n.data == "object";
		if (!r && !(n && typeof n == "object" && !Array.isArray(n))) return { ...G };
		if (r && Number(n.version) > 1) return console.warn("[Majoor] settings schema version is newer than this build, using defaults"), { ...G };
		let i = r ? n.data : n, a = new Set(/* @__PURE__ */ "debug.grid.infiniteScroll.siblings.autoScan.scan.watcher.status.viewer.rtHydrate.observability.feed.sidebar.probeBackend.i18n.paths.db.ratingTagsSync.cache.search.ai.executionGrouping.workflowMinimap.ui.security.safety".split(".")), o = {};
		if (i && typeof i == "object") for (let [e, t] of Object.entries(i)) a.has(e) && (o[e] = t);
		let s = vt(G, o);
		if (!r) try {
			q(s);
		} catch (e) {
			console.debug?.(e);
		}
		return s;
	} catch (e) {
		return console.warn("[Majoor] settings load failed, using defaults", e), { ...G };
	}
}, q = (e) => {
	try {
		let n = JSON.parse(JSON.stringify(e || {}));
		n?.security && typeof n.security == "object" && (n.security.apiToken = "");
		let r = {
			version: 1,
			data: n
		};
		if (!t.set("mjrSettings", JSON.stringify(r))) throw Error("SettingsStore rejected the write");
	} catch (e) {
		console.warn("[Majoor] settings save failed", e);
		try {
			let e = Date.now();
			e - (Number(window?._mjrSettingsSaveFailAt || 0) || 0) > 3e4 && (window._mjrSettingsSaveFailAt = e, Tt(k("dialog.settingsSaveFailed", "Majoor: Failed to save settings (browser storage full or blocked).")));
		} catch (e) {
			console.debug?.(e);
		}
		try {
			ht("mjr-settings-save-failed", { error: String(e?.message || e || "") }, { warnPrefix: "[Majoor]" });
		} catch (e) {
			console.debug?.(e);
		}
	}
}, J = (e) => {
	let t = Number(A.MAX_PAGE_SIZE) || 2e3;
	j.DEFAULT_PAGE_SIZE = Math.max(50, Math.min(t, Number(e.grid?.pageSize) || A.DEFAULT_PAGE_SIZE)), j.AUTO_SCAN_ON_STARTUP = !!e.autoScan?.onStartup, j.EXECUTION_GROUPING_ENABLED = !!(e.executionGrouping?.enabled ?? A.EXECUTION_GROUPING_ENABLED), j.STATUS_POLL_INTERVAL = Math.max(1e3, Number(e.status?.pollInterval) || A.STATUS_POLL_INTERVAL), j.DEBUG_SAFE_CALL = !!e.debug?.safeCall, j.DEBUG_SAFE_LISTENERS = !!e.debug?.safeListeners, j.DEBUG_VIEWER = !!e.debug?.viewer, j.GRID_MIN_SIZE = St(e.grid), j.FEED_GRID_MIN_SIZE = Ct(e.feed), j.GRID_GAP = Math.max(0, Math.min(40, Math.round(U(e.grid?.gap, A.GRID_GAP)))), j.GRID_SHOW_BADGES_EXTENSION = !!(e.grid?.showExtBadge ?? A.GRID_SHOW_BADGES_EXTENSION), j.GRID_SHOW_BADGES_RATING = !!(e.grid?.showRatingBadge ?? A.GRID_SHOW_BADGES_RATING), j.GRID_SHOW_BADGES_TAGS = !!(e.grid?.showTagsBadge ?? A.GRID_SHOW_BADGES_TAGS), j.GRID_SHOW_DETAILS = !!(e.grid?.showDetails ?? A.GRID_SHOW_DETAILS), j.GRID_SHOW_DETAILS_FILENAME = !!(e.grid?.showFilename ?? A.GRID_SHOW_DETAILS_FILENAME), j.GRID_SHOW_DETAILS_DATE = !!(e.grid?.showDate ?? A.GRID_SHOW_DETAILS_DATE), j.GRID_SHOW_DETAILS_DIMENSIONS = !!(e.grid?.showDimensions ?? A.GRID_SHOW_DETAILS_DIMENSIONS), j.GRID_SHOW_DETAILS_GENTIME = !!(e.grid?.showGenTime ?? A.GRID_SHOW_DETAILS_GENTIME), j.GRID_SHOW_HOVER_INFO = !!(e.grid?.showHoverInfo ?? A.GRID_SHOW_HOVER_INFO), j.GRID_SHOW_WORKFLOW_DOT = !!(e.grid?.showWorkflowDot ?? A.GRID_SHOW_WORKFLOW_DOT), j.FEED_SHOW_INFO = !!(e.feed?.showInfo ?? A.FEED_SHOW_INFO), j.FEED_SHOW_FILENAME = !!(e.feed?.showFilename ?? A.FEED_SHOW_FILENAME), j.FEED_SHOW_DIMENSIONS = !!(e.feed?.showDimensions ?? A.FEED_SHOW_DIMENSIONS), j.FEED_SHOW_DATE = !!(e.feed?.showDate ?? A.FEED_SHOW_DATE), j.FEED_SHOW_GENTIME = !!(e.feed?.showGenTime ?? A.FEED_SHOW_GENTIME), j.FEED_SHOW_WORKFLOW_DOT = !!(e.feed?.showWorkflowDot ?? A.FEED_SHOW_WORKFLOW_DOT), j.FEED_SHOW_BADGES_EXTENSION = !!(e.feed?.showExtBadge ?? A.FEED_SHOW_BADGES_EXTENSION), j.FEED_SHOW_BADGES_RATING = !!(e.feed?.showRatingBadge ?? A.FEED_SHOW_BADGES_RATING), j.FEED_SHOW_BADGES_TAGS = !!(e.feed?.showTagsBadge ?? A.FEED_SHOW_BADGES_TAGS);
	{
		let t = e.grid?.videoAutoplayMode ?? A.GRID_VIDEO_AUTOPLAY_MODE;
		t ??= e.grid?.videoHoverAutoplay === !1 ? "off" : "hover", t === !0 && (t = "hover"), t === !1 && (t = "off"), t !== "hover" && t !== "always" && t !== "off" && (t = "hover"), j.GRID_VIDEO_AUTOPLAY_MODE = t;
	}
	let n = (e, t) => {
		let n = String(e || "").trim();
		return /^[0-9a-fA-F]{6}$/.test(n) && (n = `#${n}`), /^#[0-9a-fA-F]{3,8}$/.test(n) ? n : t;
	};
	j.BADGE_STAR_COLOR = n(e.grid?.starColor, A.BADGE_STAR_COLOR), j.BADGE_IMAGE_COLOR = n(e.grid?.badgeImageColor, A.BADGE_IMAGE_COLOR), j.BADGE_VIDEO_COLOR = n(e.grid?.badgeVideoColor, A.BADGE_VIDEO_COLOR), j.BADGE_AUDIO_COLOR = n(e.grid?.badgeAudioColor, A.BADGE_AUDIO_COLOR), j.BADGE_MODEL3D_COLOR = n(e.grid?.badgeModel3dColor, A.BADGE_MODEL3D_COLOR), j.BADGE_DUPLICATE_ALERT_COLOR = n(e.grid?.badgeDuplicateAlertColor, A.BADGE_DUPLICATE_ALERT_COLOR), j.UI_CARD_HOVER_COLOR = n(e.ui?.cardHoverColor, A.UI_CARD_HOVER_COLOR), j.UI_CARD_SELECTION_COLOR = n(e.ui?.cardSelectionColor, A.UI_CARD_SELECTION_COLOR), j.UI_RATING_COLOR = n(e.ui?.ratingColor, A.UI_RATING_COLOR), j.UI_TAG_COLOR = n(e.ui?.tagColor, A.UI_TAG_COLOR);
	try {
		let e = Array.from(document.querySelectorAll(".mjr-assets-manager"));
		for (let t of e) t.style.setProperty("--mjr-star-active", j.BADGE_STAR_COLOR), t.style.setProperty("--mjr-badge-image", j.BADGE_IMAGE_COLOR), t.style.setProperty("--mjr-badge-video", j.BADGE_VIDEO_COLOR), t.style.setProperty("--mjr-badge-audio", j.BADGE_AUDIO_COLOR), t.style.setProperty("--mjr-badge-model3d", j.BADGE_MODEL3D_COLOR), t.style.setProperty("--mjr-badge-duplicate-alert", j.BADGE_DUPLICATE_ALERT_COLOR), t.style.setProperty("--mjr-card-hover-color", j.UI_CARD_HOVER_COLOR), t.style.setProperty("--mjr-card-selection-color", j.UI_CARD_SELECTION_COLOR), t.style.setProperty("--mjr-rating-color", j.UI_RATING_COLOR), t.style.setProperty("--mjr-tag-color", j.UI_TAG_COLOR);
	} catch (e) {
		console.debug?.(e);
	}
	j.INFINITE_SCROLL_ENABLED = !!e.infiniteScroll?.enabled, j.INFINITE_SCROLL_ROOT_MARGIN = String(e.infiniteScroll?.rootMargin || A.INFINITE_SCROLL_ROOT_MARGIN), j.INFINITE_SCROLL_THRESHOLD = Math.max(0, Math.min(1, U(e.infiniteScroll?.threshold, A.INFINITE_SCROLL_THRESHOLD))), j.BOTTOM_GAP_PX = Math.max(0, Math.min(5e3, Math.round(U(e.infiniteScroll?.bottomGapPx, A.BOTTOM_GAP_PX)))), j.VIEWER_ALLOW_PAN_AT_ZOOM_1 = !!e.viewer?.allowPanAtZoom1, j.VIEWER_DISABLE_WEBGL_VIDEO = !!e.viewer?.disableWebGL, j.VIEWER_PAUSE_DURING_EXECUTION = !!(e.viewer?.pauseDuringExecution ?? A.VIEWER_PAUSE_DURING_EXECUTION), j.FLOATING_VIEWER_PAUSE_DURING_EXECUTION = !!(e.viewer?.floatingPauseDuringExecution ?? A.FLOATING_VIEWER_PAUSE_DURING_EXECUTION), j.MFV_LIVE_DEFAULT = e.viewer?.mfvLiveDefault ?? A.MFV_LIVE_DEFAULT, j.MFV_PREVIEW_DEFAULT = e.viewer?.mfvPreviewDefault ?? A.MFV_PREVIEW_DEFAULT, j.MFV_LIVE_AUTO_OPEN = !1, j.MFV_PREVIEW_AUTO_OPEN = !1, j.MFV_NODE_STREAM_AUTO_OPEN = !1;
	{
		let t = String(e.viewer?.mfvPreviewMethod || A.MFV_PREVIEW_METHOD).toLowerCase();
		j.MFV_PREVIEW_METHOD = [
			"default",
			"auto",
			"latent2rgb",
			"taesd",
			"none"
		].includes(t) ? t : A.MFV_PREVIEW_METHOD;
	}
	{
		let t = String(e.viewer?.mfvSidebarPosition || "right").toLowerCase();
		j.MFV_SIDEBAR_POSITION = [
			"left",
			"right",
			"bottom"
		].includes(t) ? t : "right";
	}
	j.VIEWER_VIDEO_GRADE_THROTTLE_FPS = Math.max(1, Math.min(60, Math.round(U(e.viewer?.videoGradeThrottleFps, A.VIEWER_VIDEO_GRADE_THROTTLE_FPS)))), j.VIEWER_SCOPES_FPS = Math.max(1, Math.min(60, Math.round(U(e.viewer?.scopesFps, A.VIEWER_SCOPES_FPS)))), j.VIEWER_META_TTL_MS = Math.max(1e3, Math.min(10 * 6e4, Math.round(U(e.viewer?.metaTtlMs, A.VIEWER_META_TTL_MS)))), j.VIEWER_META_MAX_ENTRIES = Math.max(50, Math.min(5e3, Math.round(U(e.viewer?.metaMaxEntries, A.VIEWER_META_MAX_ENTRIES)))), j.WORKFLOW_MINIMAP_ENABLED = !!(e.workflowMinimap?.enabled ?? !1), j.RT_HYDRATE_CONCURRENCY = Math.max(1, Math.min(16, Math.round(U(e.rtHydrate?.concurrency, A.RT_HYDRATE_CONCURRENCY)))), j.RT_HYDRATE_QUEUE_MAX = Math.max(10, Math.min(5e3, Math.round(U(e.rtHydrate?.queueMax, A.RT_HYDRATE_QUEUE_MAX)))), j.RT_HYDRATE_SEEN_MAX = Math.max(1e3, Math.min(2e5, Math.round(U(e.rtHydrate?.seenMax, A.RT_HYDRATE_SEEN_MAX)))), j.RT_HYDRATE_PRUNE_BUDGET = Math.max(10, Math.min(1e4, Math.round(U(e.rtHydrate?.pruneBudget, A.RT_HYDRATE_PRUNE_BUDGET)))), j.RT_HYDRATE_SEEN_TTL_MS = Math.max(5e3, Math.min(360 * 6e4, Math.round(U(e.rtHydrate?.seenTtlMs, A.RT_HYDRATE_SEEN_TTL_MS)))), j.DELETE_CONFIRMATION = !!e.safety?.confirmDeletion, j.DEBUG_VERBOSE_ERRORS = !!e.observability?.verboseErrors, j.WATCHER_MAX_PENDING = Math.max(10, Math.min(5e3, Math.round(U(e.watcher?.maxPending, 500)))), j.WATCHER_MIN_SIZE = Math.max(0, Math.min(1e6, Math.round(U(e.watcher?.minSize, 100)))), j.WATCHER_MAX_SIZE = Math.max(1e5, Math.min(17179869184, Math.round(U(e.watcher?.maxSize, 4294967296)))), j.DB_TIMEOUT_MS = Math.max(1e3, Math.min(3e4, Math.round(U(e.db?.timeoutMs, 5e3)))), j.DB_MAX_CONNECTIONS = Math.max(1, Math.min(100, Math.round(U(e.db?.maxConnections, 10)))), j.DB_QUERY_TIMEOUT_MS = Math.max(500, Math.min(1e4, Math.round(U(e.db?.queryTimeoutMs, 1e3)))), j.SEARCH_REQUEST_LIMIT = Math.max(10, Math.min(A.MAX_PAGE_SIZE || 2e3, Math.round(U(e.search?.maxResults, A.SEARCH_DEFAULT_LIMIT))));
};
async function Ut() {
	try {
		let e = await xe();
		if (!e?.ok) return;
		let t = e.data?.prefs;
		if (!t || typeof t != "object") return;
		let n = K();
		if (n.security = n.security || {}, n.security.safeMode = H(t.safe_mode, n.security.safeMode), n.security.allowWrite = H(t.allow_write, n.security.allowWrite), n.security.requireAuth = H(t.require_auth, n.security.requireAuth), n.security.allowRemoteWrite = H(t.allow_remote_write, n.security.allowRemoteWrite), n.security.allowInsecureTokenTransport = H(t.allow_insecure_token_transport, n.security.allowInsecureTokenTransport), n.security.allowDelete = H(t.allow_delete, n.security.allowDelete), n.security.allowRename = H(t.allow_rename, n.security.allowRename), n.security.allowOpenInFolder = H(t.allow_open_in_folder, n.security.allowOpenInFolder), n.security.allowResetIndex = H(t.allow_reset_index, n.security.allowResetIndex), n.security.tokenConfigured = H(t.token_configured, n.security.tokenConfigured), n.security.tokenHint = String(t.token_hint || "").trim(), !String(n.security.apiToken || "").trim()) try {
			let e = await ye(), t = String(e?.data?.token || "").trim();
			e?.ok && t && (n.security.apiToken = t);
		} catch (e) {
			console.debug?.(e);
		}
		q(n), J(n), ht("mjr-settings-changed", { key: "security" }, { warnPrefix: "[Majoor]" });
	} catch (e) {
		console.warn("[Majoor] failed to sync backend security settings", e);
	}
}
async function Wt() {
	try {
		let e = await s();
		if (!e?.ok) return;
		let t = e.data?.prefs;
		if (!t || typeof t != "object") return;
		let n = K();
		n.ai = n.ai || {}, n.ai.vectorSearchEnabled = H(t.enabled, n.ai.vectorSearchEnabled ?? !0), n.ai.vectorCaptionOnIndex = H(t.caption_on_index ?? t.captionOnIndex, n.ai.vectorCaptionOnIndex ?? !1), q(n), J(n), ht("mjr-settings-changed", { key: "ai.vectorSearch" }, { warnPrefix: "[Majoor]" });
	} catch (e) {
		console.warn("[Majoor] failed to sync backend vector search settings", e);
	}
}
async function Gt() {
	try {
		let e = await O();
		if (!e?.ok) return;
		let t = e.data?.prefs;
		if (!t || typeof t != "object") return;
		let n = K();
		n.executionGrouping = n.executionGrouping || {}, n.executionGrouping.enabled = H(t.enabled, n.executionGrouping.enabled ?? A.EXECUTION_GROUPING_ENABLED), q(n), J(n), ht("mjr-settings-changed", { key: "executionGrouping.enabled" }, { warnPrefix: "[Majoor]" });
	} catch (e) {
		console.warn("[Majoor] failed to sync backend execution grouping settings", e);
	}
}
//#endregion
//#region ui/utils/debounce.ts
var Kt = 300;
function qt(e, t = Kt) {
	let n, r = (...r) => {
		clearTimeout(n), n = setTimeout(() => e(...r), t);
	};
	return r.cancel = () => {
		clearTimeout(n);
	}, r.flush = (...t) => {
		clearTimeout(n), e(...t);
	}, r;
}
//#endregion
//#region ui/app/settings/settingsGrid.ts
var Y = "Majoor", Jt = "Majoor Assets Manager";
function Yt(e, t, n) {
	let r = (e, t) => [
		Jt,
		e,
		t
	], i = (e) => [
		Jt,
		k("cat.cards", "Cards"),
		e
	], a = (e) => [
		Jt,
		k("cat.badges", "Badges"),
		e
	], o = (e) => [
		Jt,
		k("cat.badges", "Badges"),
		e
	], s = (e, t) => {
		let n = String(e || "").trim();
		return /^[0-9a-fA-F]{6}$/.test(n) && (n = `#${n}`), /^#[0-9a-fA-F]{6}$/.test(n) ? n.toUpperCase() : t;
	};
	t.grid?.minSizePreset || (t.grid = t.grid || {}, t.grid.minSizePreset = wt(t.grid.minSize), q(t)), e({
		id: `${Y}.Cards.ThumbSize`,
		category: i(k("setting.grid.cardSize.group", "Card size")),
		name: k("setting.grid.cardSize.name", "Majoor: Card Size"),
		tooltip: k("setting.grid.cardSize.desc", "Choose the card size preset used by the grid layout."),
		type: "combo",
		defaultValue: (() => {
			let e = gt(String(t.grid?.minSizePreset || "").toLowerCase(), bt, wt(t.grid?.minSize)), n = {
				small: k("setting.grid.cardSize.small", "Small"),
				medium: k("setting.grid.cardSize.medium", "Medium"),
				large: k("setting.grid.cardSize.large", "Large")
			};
			return n[e] || n.medium;
		})(),
		options: [
			k("setting.grid.cardSize.small", "Small"),
			k("setting.grid.cardSize.medium", "Medium"),
			k("setting.grid.cardSize.large", "Large")
		],
		onChange: (e) => {
			let r = String(e || "").trim().toLowerCase(), i = k("setting.grid.cardSize.small", "Small").toLowerCase(), a = k("setting.grid.cardSize.medium", "Medium").toLowerCase(), o = k("setting.grid.cardSize.large", "Large").toLowerCase(), s = "medium";
			r === i || r === "small" || r === "petit" ? s = "small" : r === o || r === "large" || r === "grand" ? s = "large" : (r === a || r === "medium" || r === "moyen") && (s = "medium"), t.grid.minSizePreset = s, t.grid.minSize = yt[s], q(t), J(t), n("grid.minSizePreset");
		}
	}), e({
		id: `${Y}.Cards.CustomThumbSize`,
		category: i(k("setting.grid.cardSize.group", "Card size")),
		name: "Majoor: Custom Card Size (px)",
		tooltip: "Set the minimum card width used by the main grid layout (60-600 px).",
		type: "number",
		defaultValue: Math.max(60, Math.min(600, Number(t.grid?.minSize) || 120)),
		attrs: {
			min: 60,
			max: 600,
			step: 10
		},
		onChange: (e) => {
			let r = Math.max(60, Math.min(600, Math.round(Number(e) || 120)));
			t.grid.minSize = r, t.grid.minSizePreset = wt(r), q(t), J(t), n("grid.minSize");
		}
	}), e({
		id: `${Y}.Grid.ShowDetails`,
		category: i("Show card details"),
		name: "Show metadata panel",
		tooltip: "Show the bottom details panel on asset cards (filename, date, etc.)",
		type: "boolean",
		defaultValue: !!t.grid?.showDetails,
		onChange: (e) => {
			t.grid.showDetails = !!e, q(t), J(t), n("grid.showDetails");
		}
	}), e({
		id: `${Y}.Grid.ShowFilename`,
		category: i("Show filename"),
		name: "Show filename",
		tooltip: "Display filename in details panel",
		type: "boolean",
		defaultValue: !!t.grid?.showFilename,
		onChange: (e) => {
			t.grid.showFilename = !!e, q(t), J(t), n("grid.showFilename");
		}
	}), e({
		id: `${Y}.Grid.ShowDate`,
		category: i("Show date/time"),
		name: "Show date/time",
		tooltip: "Display date and time in details panel",
		type: "boolean",
		defaultValue: !!t.grid?.showDate,
		onChange: (e) => {
			t.grid.showDate = !!e, q(t), J(t), n("grid.showDate");
		}
	}), e({
		id: `${Y}.Grid.ShowDimensions`,
		category: i("Show dimensions"),
		name: "Show dimensions",
		tooltip: "Display resolution (WxH) in details panel",
		type: "boolean",
		defaultValue: !!t.grid?.showDimensions,
		onChange: (e) => {
			t.grid.showDimensions = !!e, q(t), J(t), n("grid.showDimensions");
		}
	}), e({
		id: `${Y}.Grid.ShowGenTime`,
		category: i("Show generation time"),
		name: "Show generation time",
		tooltip: "Display seconds taken to generate the asset (if available)",
		type: "boolean",
		defaultValue: !!t.grid?.showGenTime,
		onChange: (e) => {
			t.grid.showGenTime = !!e, q(t), J(t), n("grid.showGenTime");
		}
	}), e({
		id: `${Y}.Grid.ShowHoverInfo`,
		category: i("Show prompt on hover"),
		name: "Show prompt on hover",
		tooltip: "Show positive prompt and generation time as a tooltip overlay when hovering over a card thumbnail. Does not block video play-on-hover.",
		type: "boolean",
		defaultValue: !!(t.grid?.showHoverInfo ?? A.GRID_SHOW_HOVER_INFO),
		onChange: (e) => {
			t.grid.showHoverInfo = !!e, q(t), J(t), n("grid.showHoverInfo");
		}
	}), e({
		id: `${Y}.Grid.ShowWorkflowDot`,
		category: i("Show workflow dot"),
		name: "Show workflow indicator",
		tooltip: "Display the green dot indicating workflow metadata availability (bottom right of card)",
		type: "boolean",
		defaultValue: !!t.grid?.showWorkflowDot,
		onChange: (e) => {
			t.grid.showWorkflowDot = !!e, q(t), J(t), n("grid.showWorkflowDot");
		}
	}), e({
		id: `${Y}.Grid.ShowExtBadge`,
		category: a("Show format badges"),
		name: "Show format badges",
		tooltip: "Display format badges (e.g. JPG, MP4) on thumbnails",
		type: "boolean",
		defaultValue: !!t.grid?.showExtBadge,
		onChange: (e) => {
			t.grid.showExtBadge = !!e, q(t), J(t), n("grid.showExtBadge");
		}
	}), e({
		id: `${Y}.Grid.ShowRatingBadge`,
		category: a("Show rating badges"),
		name: "Show ratings",
		tooltip: "Display star ratings on thumbnails",
		type: "boolean",
		defaultValue: !!t.grid?.showRatingBadge,
		onChange: (e) => {
			t.grid.showRatingBadge = !!e, q(t), J(t), n("grid.showRatingBadge");
		}
	}), e({
		id: `${Y}.Grid.ShowTagsBadge`,
		category: a("Show tags badges"),
		name: "Show tags",
		tooltip: "Display a small indicator if an asset has tags",
		type: "boolean",
		defaultValue: !!t.grid?.showTagsBadge,
		onChange: (e) => {
			t.grid.showTagsBadge = !!e, q(t), J(t), n("grid.showTagsBadge");
		}
	}), e({
		id: `${Y}.Badges.StarColor`,
		category: o(k("setting.starColor", "Star color")),
		name: k("setting.starColor", "Majoor: Star color"),
		tooltip: k("setting.starColor.tooltip", "Color of rating stars on thumbnails (hex, e.g. #FFD45A)"),
		type: "color",
		defaultValue: s(t.grid?.starColor, A.BADGE_STAR_COLOR),
		onChange: (e) => {
			t.grid.starColor = s(e, A.BADGE_STAR_COLOR), q(t), J(t), n("grid.starColor");
		}
	}), e({
		id: `${Y}.Badges.ImageColor`,
		category: o(k("setting.badgeImageColor", "Image badge color")),
		name: k("setting.badgeImageColor", "Majoor: Image badge color"),
		tooltip: k("setting.badgeImageColor.tooltip", "Color for image badges: PNG, JPG, WEBP, GIF, BMP, TIF (hex)"),
		type: "color",
		defaultValue: s(t.grid?.badgeImageColor, A.BADGE_IMAGE_COLOR),
		onChange: (e) => {
			t.grid.badgeImageColor = s(e, A.BADGE_IMAGE_COLOR), q(t), J(t), n("grid.badgeImageColor");
		}
	}), e({
		id: `${Y}.Badges.VideoColor`,
		category: o(k("setting.badgeVideoColor", "Video badge color")),
		name: k("setting.badgeVideoColor", "Majoor: Video badge color"),
		tooltip: k("setting.badgeVideoColor.tooltip", "Color for video badges: MP4, WEBM, MOV, AVI, MKV (hex)"),
		type: "color",
		defaultValue: s(t.grid?.badgeVideoColor, A.BADGE_VIDEO_COLOR),
		onChange: (e) => {
			t.grid.badgeVideoColor = s(e, A.BADGE_VIDEO_COLOR), q(t), J(t), n("grid.badgeVideoColor");
		}
	}), e({
		id: `${Y}.Badges.AudioColor`,
		category: o(k("setting.badgeAudioColor", "Audio badge color")),
		name: k("setting.badgeAudioColor", "Majoor: Audio badge color"),
		tooltip: k("setting.badgeAudioColor.tooltip", "Color for audio badges: MP3, WAV, OGG, FLAC (hex)"),
		type: "color",
		defaultValue: s(t.grid?.badgeAudioColor, A.BADGE_AUDIO_COLOR),
		onChange: (e) => {
			t.grid.badgeAudioColor = s(e, A.BADGE_AUDIO_COLOR), q(t), J(t), n("grid.badgeAudioColor");
		}
	}), e({
		id: `${Y}.Badges.Model3dColor`,
		category: o(k("setting.badgeModel3dColor", "3D model badge color")),
		name: k("setting.badgeModel3dColor", "Majoor: 3D model badge color"),
		tooltip: k("setting.badgeModel3dColor.tooltip", "Color for 3D model badges: OBJ, FBX, GLB, GLTF (hex)"),
		type: "color",
		defaultValue: s(t.grid?.badgeModel3dColor, A.BADGE_MODEL3D_COLOR),
		onChange: (e) => {
			t.grid.badgeModel3dColor = s(e, A.BADGE_MODEL3D_COLOR), q(t), J(t), n("grid.badgeModel3dColor");
		}
	}), e({
		id: `${Y}.Badges.DuplicateAlertColor`,
		category: o(k("setting.badgeDuplicateAlertColor", "Duplicate alert badge color")),
		name: k("setting.badgeDuplicateAlertColor", "Majoor: Duplicate alert badge color"),
		tooltip: k("setting.badgeDuplicateAlertColor.tooltip", "Color for duplicate extension badges (PNG+, JPG+, etc)."),
		type: "color",
		defaultValue: s(t.grid?.badgeDuplicateAlertColor, A.BADGE_DUPLICATE_ALERT_COLOR),
		onChange: (e) => {
			t.grid.badgeDuplicateAlertColor = s(e, A.BADGE_DUPLICATE_ALERT_COLOR), q(t), J(t), n("grid.badgeDuplicateAlertColor");
		}
	}), e({
		id: `${Y}.Grid.PageSize`,
		category: r(k("cat.grid"), k("setting.grid.pagesize.name").replace("Majoor: ", "")),
		name: k("setting.grid.pagesize.name"),
		tooltip: k("setting.grid.pagesize.desc"),
		type: "number",
		defaultValue: t.grid.pageSize,
		attrs: {
			min: 50,
			max: Number(j.MAX_PAGE_SIZE) || 2e3,
			step: 50
		},
		onChange: (e) => {
			let r = Number(j.MAX_PAGE_SIZE) || 2e3;
			t.grid.pageSize = Math.max(50, Math.min(r, Number(e) || A.DEFAULT_PAGE_SIZE)), q(t), J(t), n("grid.pageSize");
		}
	}), e({
		id: `${Y}.InfiniteScroll.Enabled`,
		category: r(k("cat.grid"), k("setting.nav.infinite.name").replace("Majoor: ", "")),
		name: k("setting.nav.infinite.name"),
		tooltip: k("setting.nav.infinite.desc"),
		type: "boolean",
		defaultValue: !!t.infiniteScroll?.enabled,
		onChange: (e) => {
			t.infiniteScroll = t.infiniteScroll || {}, t.infiniteScroll.enabled = !!e, q(t), J(t), n("infiniteScroll.enabled");
		}
	}), e({
		id: `${Y}.Sidebar.Position`,
		category: r(k("cat.grid"), k("setting.sidebar.pos.name").replace("Majoor: ", "")),
		name: k("setting.sidebar.pos.name"),
		tooltip: k("setting.sidebar.pos.desc"),
		type: "combo",
		defaultValue: t.sidebar?.position || "right",
		options: ["left", "right"],
		onChange: (e) => {
			t.sidebar = t.sidebar || {}, t.sidebar.position = e === "left" ? "left" : "right", q(t), n("sidebar.position");
		}
	}), e({
		id: `${Y}.Sidebar.ShowPreviewThumb`,
		category: r(k("cat.grid"), "Sidebar preview"),
		name: "Show sidebar preview thumb",
		tooltip: "Show/hide the large media preview at the top of the sidebar metadata panel.",
		type: "boolean",
		defaultValue: !!(t.sidebar?.showPreviewThumb ?? !0),
		onChange: (e) => {
			t.sidebar = t.sidebar || {}, t.sidebar.showPreviewThumb = !!e, q(t), n("sidebar.showPreviewThumb");
		}
	}), e({
		id: `${Y}.Sidebar.WidthPx`,
		category: r(k("cat.grid"), "Sidebar width"),
		name: "Sidebar width (px)",
		tooltip: "Set the details sidebar width in pixels (240-640).",
		type: "number",
		defaultValue: Math.max(240, Math.min(640, Number(t.sidebar?.widthPx) || 360)),
		attrs: {
			min: 240,
			max: 640,
			step: 10
		},
		onChange: (e) => {
			t.sidebar = t.sidebar || {}, t.sidebar.widthPx = Math.max(240, Math.min(640, Math.round(Number(e) || 360))), q(t), n("sidebar.widthPx");
		}
	}), e({
		id: `${Y}.General.HideSiblings`,
		category: r(k("cat.grid"), k("setting.siblings.hide.name").replace("Majoor: ", "")),
		name: k("setting.siblings.hide.name"),
		tooltip: k("setting.siblings.hide.desc"),
		type: "boolean",
		defaultValue: !!t.siblings?.hidePngSiblings,
		onChange: (e) => {
			t.siblings = t.siblings || {}, t.siblings.hidePngSiblings = !!e, q(t), n("siblings.hidePngSiblings");
		}
	}), e({
		id: `${Y}.Grid.VideoAutoplayMode`,
		category: r(k("cat.grid"), k("setting.grid.videoAutoplayMode.name", "Video autoplay").replace("Majoor: ", "")),
		name: k("setting.grid.videoAutoplayMode.name", "Majoor: Video autoplay"),
		tooltip: k("setting.grid.videoAutoplayMode.desc", "Controls video thumbnail playback in the grid. Off: static frame. Hover: play on mouse hover. Always: loop while visible."),
		type: "combo",
		defaultValue: (() => {
			let e = t.grid?.videoAutoplayMode;
			e ??= t.grid?.videoHoverAutoplay === !1 ? "off" : "hover", e === !0 && (e = "hover"), e === !1 && (e = "off"), e !== "hover" && e !== "always" && e !== "off" && (e = "hover");
			let n = {
				off: k("setting.grid.videoAutoplayMode.off", "Off"),
				hover: k("setting.grid.videoAutoplayMode.hover", "Hover"),
				always: k("setting.grid.videoAutoplayMode.always", "Always")
			};
			return n[e] || n.off;
		})(),
		options: [
			k("setting.grid.videoAutoplayMode.off", "Off"),
			k("setting.grid.videoAutoplayMode.hover", "Hover"),
			k("setting.grid.videoAutoplayMode.always", "Always")
		],
		onChange: (e) => {
			let r = {
				[k("setting.grid.videoAutoplayMode.off", "Off")]: "off",
				[k("setting.grid.videoAutoplayMode.hover", "Hover")]: "hover",
				[k("setting.grid.videoAutoplayMode.always", "Always")]: "always"
			}[e] || "off";
			t.grid = t.grid || {}, t.grid.videoAutoplayMode = r, delete t.grid.videoHoverAutoplay, q(t), J(t), n("grid.videoAutoplayMode");
		}
	}), e({
		id: `${Y}.Cards.HoverColor`,
		category: i("Hover color"),
		name: "Majoor: Card hover color",
		tooltip: "Background tint used when hovering a card (hex, e.g. #3D3D3D).",
		type: "color",
		defaultValue: s(t.ui?.cardHoverColor, A.UI_CARD_HOVER_COLOR),
		onChange: (e) => {
			t.ui = t.ui || {}, t.ui.cardHoverColor = s(e, A.UI_CARD_HOVER_COLOR), q(t), J(t), n("ui.cardHoverColor");
		}
	}), e({
		id: `${Y}.Cards.SelectionColor`,
		category: i("Selection color"),
		name: "Majoor: Card selection color",
		tooltip: "Outline/accent color used for selected cards (hex, e.g. #4A90E2).",
		type: "color",
		defaultValue: s(t.ui?.cardSelectionColor, A.UI_CARD_SELECTION_COLOR),
		onChange: (e) => {
			t.ui = t.ui || {}, t.ui.cardSelectionColor = s(e, A.UI_CARD_SELECTION_COLOR), q(t), J(t), n("ui.cardSelectionColor");
		}
	}), e({
		id: `${Y}.Badges.RatingColor`,
		category: a("Rating color"),
		name: "Majoor: Rating badge color",
		tooltip: "Color used for rating badge text/accent (hex, e.g. #FF9500).",
		type: "color",
		defaultValue: s(t.ui?.ratingColor, A.UI_RATING_COLOR),
		onChange: (e) => {
			t.ui = t.ui || {}, t.ui.ratingColor = s(e, A.UI_RATING_COLOR), q(t), J(t), n("ui.ratingColor");
		}
	}), e({
		id: `${Y}.Badges.TagColor`,
		category: a("Tag color"),
		name: "Majoor: Tags badge color",
		tooltip: "Color used for tags badge text/accent (hex, e.g. #4A90E2).",
		type: "color",
		defaultValue: s(t.ui?.tagColor, A.UI_TAG_COLOR),
		onChange: (e) => {
			t.ui = t.ui || {}, t.ui.tagColor = s(e, A.UI_TAG_COLOR), q(t), J(t), n("ui.tagColor");
		}
	});
}
//#endregion
//#region ui/app/settings/settingsViewer.ts
var Xt = "Majoor", Zt = "Majoor Assets Manager";
function Qt(e, t, n) {
	let r = (e, t) => [
		Zt,
		e,
		t
	], a = (e) => r(k("cat.viewer", "Viewer"), e), o = (e) => r(k("cat.floatingViewer", "Floating Viewer"), e);
	e({
		id: `${Xt}.Viewer.AllowPanAtZoom1`,
		category: a(k("setting.viewer.pan.name").replace("Majoor: ", "")),
		name: k("setting.viewer.pan.name"),
		tooltip: k("setting.viewer.pan.desc"),
		type: "boolean",
		defaultValue: !!t.viewer?.allowPanAtZoom1,
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.allowPanAtZoom1 = !!e, q(t), J(t), n("viewer.allowPanAtZoom1");
		}
	}), e({
		id: `${Xt}.Viewer.DisableWebGL`,
		category: a("Disable WebGL Video"),
		name: "Disable WebGL Video",
		tooltip: "Use CPU rendering (Canvas 2D) for video playback. Fixes 'black screen' issues on incompatible hardware/browsers.",
		type: "boolean",
		defaultValue: !!t.viewer?.disableWebGL,
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.disableWebGL = !!e, q(t), J(t), n("viewer.disableWebGL");
		}
	}), e({
		id: `${Xt}.Viewer.PauseDuringExecution`,
		category: a(k("setting.viewer.pauseExecution.name").replace("Majoor: ", "")),
		name: k("setting.viewer.pauseExecution.name"),
		tooltip: k("setting.viewer.pauseExecution.desc"),
		type: "boolean",
		defaultValue: !!t.viewer?.pauseDuringExecution,
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.pauseDuringExecution = !!e, q(t), J(t), n("viewer.pauseDuringExecution");
		}
	}), e({
		id: `${Xt}.Viewer.FloatingPauseDuringExecution`,
		category: o(k("setting.viewer.floatingPauseExecution.name").replace("Majoor: ", "")),
		name: k("setting.viewer.floatingPauseExecution.name"),
		tooltip: k("setting.viewer.floatingPauseExecution.desc"),
		type: "boolean",
		defaultValue: !!t.viewer?.floatingPauseDuringExecution,
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.floatingPauseDuringExecution = !!e, q(t), J(t), n("viewer.floatingPauseDuringExecution");
		}
	}), e({
		id: `${Xt}.Viewer.MfvLiveDefault`,
		category: o(k("setting.viewer.mfvLiveDefault.name").replace("Majoor: ", "")),
		name: k("setting.viewer.mfvLiveDefault.name"),
		tooltip: k("setting.viewer.mfvLiveDefault.desc"),
		type: "boolean",
		defaultValue: !!(t.viewer?.mfvLiveDefault ?? A.MFV_LIVE_DEFAULT),
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.mfvLiveDefault = !!e, q(t), J(t), n("viewer.mfvLiveDefault");
		}
	}), e({
		id: `${Xt}.Viewer.MfvPreviewDefault`,
		category: o(k("setting.viewer.mfvPreviewDefault.name").replace("Majoor: ", "")),
		name: k("setting.viewer.mfvPreviewDefault.name"),
		tooltip: k("setting.viewer.mfvPreviewDefault.desc"),
		type: "boolean",
		defaultValue: !!(t.viewer?.mfvPreviewDefault ?? A.MFV_PREVIEW_DEFAULT),
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.mfvPreviewDefault = !!e, q(t), J(t), n("viewer.mfvPreviewDefault");
		}
	}), e({
		id: `${Xt}.Viewer.MfvSidebarPosition`,
		category: o("Node Parameters sidebar position"),
		name: "Node Parameters sidebar position",
		tooltip: "Position of the Node Parameters sidebar in the Floating Viewer (right, left, or bottom).",
		type: "combo",
		defaultValue: t.viewer?.mfvSidebarPosition || "right",
		options: [
			"right",
			"left",
			"bottom"
		],
		onChange: (e) => {
			let r = [
				"left",
				"right",
				"bottom"
			].includes(e) ? e : "right";
			t.viewer = t.viewer || {}, t.viewer.mfvSidebarPosition = r, q(t), J(t), n("viewer.mfvSidebarPosition");
		}
	}), e({
		id: `${Xt}.Viewer.MfvPreviewMethod`,
		category: o(k("setting.viewer.mfvPreviewMethod.name").replace("Majoor: ", "")),
		name: k("setting.viewer.mfvPreviewMethod.name"),
		tooltip: k("setting.viewer.mfvPreviewMethod.desc"),
		type: "combo",
		defaultValue: t.viewer?.mfvPreviewMethod || "taesd",
		options: [
			"taesd",
			"latent2rgb",
			"auto",
			"default",
			"none"
		],
		onChange: (e) => {
			let r = [
				"taesd",
				"latent2rgb",
				"auto",
				"default",
				"none"
			].includes(e) ? e : "taesd";
			t.viewer = t.viewer || {}, t.viewer.mfvPreviewMethod = r, q(t), J(t), n("viewer.mfvPreviewMethod");
		}
	}), e({
		id: `${Xt}.Viewer.LtxavRgbFallback`,
		category: o("LTXAV preview fallback"),
		name: "Majoor: LTXAV RGB Preview Fallback (experimental)",
		tooltip: "Reuse LTXV RGB projection for LTXAV when native latent preview is unavailable. Experimental; quality may be approximate.",
		type: "boolean",
		defaultValue: !!t.viewer?.ltxavRgbFallback,
		onChange: async (e) => {
			let r = !!e, a = !!t.viewer?.ltxavRgbFallback;
			t.viewer = t.viewer || {}, t.viewer.ltxavRgbFallback = r, q(t), J(t), n("viewer.ltxavRgbFallback");
			try {
				let e = await ne(r);
				if (!e?.ok) throw Error(e?.error || "Failed to update LTXAV RGB preview fallback setting");
			} catch (e) {
				t.viewer.ltxavRgbFallback = a, q(t), J(t), n("viewer.ltxavRgbFallback"), i(e?.message || "Failed to update LTXAV RGB preview fallback setting", "error");
			}
		}
	});
	try {
		_().then((e) => {
			if (!e?.ok) return;
			let r = !!e?.data?.prefs?.enabled, i = K();
			i.viewer = i.viewer || {}, !!i.viewer.ltxavRgbFallback !== r && (i.viewer.ltxavRgbFallback = r, Object.assign(t, i), q(i), J(i), n("viewer.ltxavRgbFallback"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	((r, i, o, s) => {
		e({
			id: `${Xt}.WorkflowMinimap.${r}`,
			category: a(k(o).replace("Majoor: ", "")),
			name: k(o),
			tooltip: k(s),
			type: "boolean",
			defaultValue: !!t.workflowMinimap?.[i],
			onChange: (e) => {
				t.workflowMinimap = t.workflowMinimap || {}, t.workflowMinimap[i] = !!e, q(t), n(`workflowMinimap.${i}`);
			}
		});
	})("Enabled", "enabled", "setting.minimap.enabled.name", "setting.minimap.enabled.desc");
}
//#endregion
//#region ui/app/settings/settingsScanning.ts
var $t = "Majoor", en = "Majoor Assets Manager";
function tn(e, t, n) {
	let r = (e, t) => [
		en,
		e,
		t
	];
	e({
		id: `${$t}.ExecutionGrouping.Enabled`,
		category: r(k("cat.scanning"), "Execution grouping"),
		name: "Execution job/stack grouping",
		tooltip: "Enable or disable all live job_id / stack_id tracking, grouping, and stack finalization logic.",
		type: "boolean",
		defaultValue: !!(t.executionGrouping?.enabled ?? A.EXECUTION_GROUPING_ENABLED),
		onChange: async (e) => {
			let r = !!(t.executionGrouping?.enabled ?? A.EXECUTION_GROUPING_ENABLED), a = !!e;
			t.executionGrouping = t.executionGrouping || {}, t.executionGrouping.enabled = a, q(t), J(t), n("executionGrouping.enabled");
			try {
				let e = await de(a);
				if (!e?.ok) throw Error(e?.error || "Failed to update execution grouping setting");
				t.executionGrouping.enabled = !!e?.data?.prefs?.enabled, q(t), J(t), n("executionGrouping.enabled");
			} catch (e) {
				t.executionGrouping.enabled = r, q(t), J(t), n("executionGrouping.enabled"), i(e?.message || "Failed to update execution grouping setting", "error");
			}
		}
	}), e({
		id: `${$t}.AutoScan.OnStartup`,
		category: r(k("cat.scanning"), k("setting.scan.startup.name").replace("Majoor: ", "")),
		name: k("setting.scan.startup.name"),
		tooltip: k("setting.scan.startup.desc"),
		type: "boolean",
		defaultValue: !!t.autoScan?.onStartup,
		onChange: (e) => {
			t.autoScan = t.autoScan || {}, t.autoScan.onStartup = !!e, q(t), J(t), n("autoScan.onStartup");
		}
	}), e({
		id: `${$t}.Scan.FastMode`,
		category: r(k("cat.scanning"), "Scan mode"),
		name: "Fast scan mode",
		tooltip: "Use fast scan mode for manual backfill scans (skip heavier metadata work during scan).",
		type: "boolean",
		defaultValue: !!(t.scan?.fastMode ?? !0),
		onChange: (e) => {
			t.scan = t.scan || {}, t.scan.fastMode = !!e, q(t), n("scan.fastMode");
		}
	}), e({
		id: `${$t}.RtHydrate.Concurrency`,
		category: r(k("cat.scanning"), "Hydration"),
		name: "Hydrate Concurrency",
		tooltip: "Maximum concurrent hydration requests for rating/tags.",
		type: "number",
		defaultValue: Number(t.rtHydrate?.concurrency || A.RT_HYDRATE_CONCURRENCY || 5),
		attrs: {
			min: 1,
			max: 20,
			step: 1
		},
		onChange: (e) => {
			t.rtHydrate = t.rtHydrate || {}, t.rtHydrate.concurrency = Math.max(1, Math.min(20, Math.round(U(e, A.RT_HYDRATE_CONCURRENCY || 5)))), q(t), J(t), n("rtHydrate.concurrency");
		}
	});
	let a = (e, t, n, r) => {
		let i = Math.round(U(e, t));
		return Math.max(n, Math.min(r, i));
	}, o = (e = {}) => {
		let r = [];
		if (t.watcher = t.watcher || {}, typeof e.debounce_ms == "number") {
			let n = Math.max(50, Math.min(5e3, Math.round(e.debounce_ms)));
			t.watcher.debounceMs !== n && (t.watcher.debounceMs = n, r.push("watcher.debounceMs"));
		}
		if (typeof e.dedupe_ttl_ms == "number") {
			let n = Math.max(100, Math.min(3e4, Math.round(e.dedupe_ttl_ms)));
			t.watcher.dedupeTtlMs !== n && (t.watcher.dedupeTtlMs = n, r.push("watcher.dedupeTtlMs"));
		}
		r.length && (q(t), r.forEach((e) => n(e)));
	}, s = async () => {
		try {
			let e = await C();
			if (!e?.ok) return;
			o(e.data || {});
		} catch (e) {
			console.debug?.(e);
		}
	};
	e({
		id: `${$t}.Watcher.Enabled`,
		category: r(k("cat.scanning"), k("setting.watcher.enabled.label", "Enable watcher")),
		name: k("setting.watcher.name"),
		tooltip: k("setting.watcher.desc") + " (env: MJR_ENABLE_WATCHER)",
		type: "boolean",
		defaultValue: !!t.watcher?.enabled,
		onChange: async (e) => {
			t.watcher = t.watcher || {}, t.watcher.enabled = !!e, q(t), n("watcher.enabled");
			try {
				let r = await ce(!!e);
				r?.ok || (t.watcher.enabled = !e, q(t), n("watcher.enabled"), i(r?.error || k("toast.failedToggleWatcher", "Failed to toggle watcher"), "error"));
			} catch {
				t.watcher.enabled = !e, q(t), n("watcher.enabled");
			}
		}
	}), e({
		id: `${$t}.Watcher.DebounceDelay`,
		category: r(k("cat.scanning"), k("setting.watcher.debounce.label", "Watcher debounce delay")),
		name: k("setting.watcher.debounce.name"),
		tooltip: k("setting.watcher.debounce.desc") + " (env: MJR_WATCHER_DEBOUNCE_MS)",
		type: "number",
		defaultValue: t.watcher?.debounceMs ?? A.WATCHER_DEBOUNCE_MS,
		attrs: {
			min: 50,
			max: 6e4,
			step: 50
		},
		onChange: async (e) => {
			let r = A.WATCHER_DEBOUNCE_MS, o = a(e, r, 50, 6e4), s = t.watcher?.debounceMs ?? r;
			if (o !== s) {
				t.watcher = t.watcher || {}, t.watcher.debounceMs = o, q(t);
				try {
					let e = await se({ debounce_ms: o });
					if (!e?.ok) throw Error(e?.error || k("setting.watcher.debounce.error"));
					let r = Math.round(Number(e?.data?.debounce_ms ?? o));
					t.watcher.debounceMs = r, q(t), n("watcher.debounceMs");
				} catch (e) {
					t.watcher.debounceMs = s, q(t), n("watcher.debounceMs"), i(e?.message || k("setting.watcher.debounce.error"), "error");
				}
			}
		}
	}), e({
		id: `${$t}.Watcher.DedupeWindow`,
		category: r(k("cat.scanning"), k("setting.watcher.dedupe.label", "Watcher dedupe window")),
		name: k("setting.watcher.dedupe.name"),
		tooltip: k("setting.watcher.dedupe.desc") + " (env: MJR_WATCHER_DEDUPE_TTL_MS)",
		type: "number",
		defaultValue: t.watcher?.dedupeTtlMs ?? A.WATCHER_DEDUPE_TTL_MS,
		attrs: {
			min: 100,
			max: 12e4,
			step: 100
		},
		onChange: async (e) => {
			let r = A.WATCHER_DEDUPE_TTL_MS, o = a(e, r, 100, 12e4), s = t.watcher?.dedupeTtlMs ?? r;
			if (o !== s) {
				t.watcher = t.watcher || {}, t.watcher.dedupeTtlMs = o, q(t);
				try {
					let e = await se({ dedupe_ttl_ms: o });
					if (!e?.ok) throw Error(e?.error || k("setting.watcher.dedupe.error"));
					let r = Math.round(Number(e?.data?.dedupe_ttl_ms ?? o));
					t.watcher.dedupeTtlMs = r, q(t), n("watcher.dedupeTtlMs");
				} catch (e) {
					t.watcher.dedupeTtlMs = s, q(t), n("watcher.dedupeTtlMs"), i(e?.message || k("setting.watcher.dedupe.error"), "error");
				}
			}
		}
	}), e({
		id: `${$t}.Watcher.MaxPending`,
		category: r(k("cat.scanning"), "Watcher queue"),
		name: "Watcher: max pending files",
		tooltip: "Maximum number of pending watcher files kept in memory.",
		type: "number",
		defaultValue: Number(t.watcher?.maxPending ?? 500),
		attrs: {
			min: 10,
			max: 5e3,
			step: 10
		},
		onChange: (e) => {
			t.watcher = t.watcher || {}, t.watcher.maxPending = Math.max(10, Math.min(5e3, Math.round(U(e, 500)))), q(t), J(t), n("watcher.maxPending");
		}
	}), e({
		id: `${$t}.Watcher.MinSize`,
		category: r(k("cat.scanning"), "Watcher file size"),
		name: "Watcher: min size (bytes)",
		tooltip: "Minimum file size indexed by watcher.",
		type: "number",
		defaultValue: Number(t.watcher?.minSize ?? 100),
		attrs: {
			min: 0,
			max: 1e6,
			step: 100
		},
		onChange: (e) => {
			t.watcher = t.watcher || {}, t.watcher.minSize = Math.max(0, Math.min(1e6, Math.round(U(e, 100)))), q(t), J(t), n("watcher.minSize");
		}
	}), e({
		id: `${$t}.Watcher.MaxSize`,
		category: r(k("cat.scanning"), "Watcher file size"),
		name: "Watcher: max size (bytes)",
		tooltip: "Maximum file size indexed by watcher.",
		type: "number",
		defaultValue: Number(t.watcher?.maxSize ?? 4294967296),
		attrs: {
			min: 1e5,
			max: 17179869184,
			step: 1e5
		},
		onChange: (e) => {
			t.watcher = t.watcher || {}, t.watcher.maxSize = Math.max(1e5, Math.min(17179869184, Math.round(U(e, 4294967296)))), q(t), J(t), n("watcher.maxSize");
		}
	});
	try {
		s().catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	e({
		id: `${$t}.RatingTagsSync.Enabled`,
		category: r(k("cat.scanning"), k("setting.sync.rating.name").replace("Majoor: ", "")),
		name: k("setting.sync.rating.name"),
		tooltip: k("setting.sync.rating.desc"),
		type: "boolean",
		defaultValue: !!t.ratingTagsSync?.enabled,
		onChange: (e) => {
			t.ratingTagsSync = t.ratingTagsSync || {}, t.ratingTagsSync.enabled = !!e, q(t), n("ratingTagsSync.enabled");
		}
	});
}
//#endregion
//#region ui/app/settings/settingsFeed.ts
var nn = "Majoor", rn = "Majoor Assets Manager";
function an(e, t, n) {
	let r = (e) => [
		rn,
		k("cat.feed", "Generated Feed"),
		e
	], i = () => {
		t.feed = t.feed || {};
	};
	e({
		id: `${nn}.Feed.CardSize`,
		category: r("Card size"),
		name: "Feed card size (px)",
		tooltip: "Set the minimum card width used by the Generated Feed layout (60-600 px).",
		type: "number",
		defaultValue: Math.max(60, Math.min(600, Number(t.feed?.minSize) || 120)),
		attrs: {
			min: 60,
			max: 600,
			step: 10
		},
		onChange: (e) => {
			i(), t.feed.minSize = Math.max(60, Math.min(600, Math.round(Number(e) || 120))), q(t), J(t), n("feed.minSize");
		}
	}), e({
		id: `${nn}.Feed.ShowInfo`,
		category: r("Show info section"),
		name: "Show card info section",
		tooltip: "Show or hide the entire info section (filename, metadata, dots) below thumbnails in the Generated Feed.",
		type: "boolean",
		defaultValue: !!(t.feed?.showInfo ?? A.FEED_SHOW_INFO),
		onChange: (e) => {
			i(), t.feed.showInfo = !!e, q(t), J(t), n("feed.showInfo");
		}
	}), e({
		id: `${nn}.Feed.ShowFilename`,
		category: r("Show filename"),
		name: "Show filename",
		tooltip: "Display the filename on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showFilename ?? A.FEED_SHOW_FILENAME),
		onChange: (e) => {
			i(), t.feed.showFilename = !!e, q(t), J(t), n("feed.showFilename");
		}
	}), e({
		id: `${nn}.Feed.ShowDimensions`,
		category: r("Show dimensions"),
		name: "Show dimensions",
		tooltip: "Display resolution (WxH) and duration on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showDimensions ?? A.FEED_SHOW_DIMENSIONS),
		onChange: (e) => {
			i(), t.feed.showDimensions = !!e, q(t), J(t), n("feed.showDimensions");
		}
	}), e({
		id: `${nn}.Feed.ShowDate`,
		category: r("Show date/time"),
		name: "Show date/time",
		tooltip: "Display date and time on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showDate ?? A.FEED_SHOW_DATE),
		onChange: (e) => {
			i(), t.feed.showDate = !!e, q(t), J(t), n("feed.showDate");
		}
	}), e({
		id: `${nn}.Feed.ShowGenTime`,
		category: r("Show generation time"),
		name: "Show generation time",
		tooltip: "Display the generation time badge on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showGenTime ?? A.FEED_SHOW_GENTIME),
		onChange: (e) => {
			i(), t.feed.showGenTime = !!e, q(t), J(t), n("feed.showGenTime");
		}
	}), e({
		id: `${nn}.Feed.ShowWorkflowDot`,
		category: r("Show workflow dot"),
		name: "Show workflow indicator",
		tooltip: "Display the workflow availability dot on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showWorkflowDot ?? A.FEED_SHOW_WORKFLOW_DOT),
		onChange: (e) => {
			i(), t.feed.showWorkflowDot = !!e, q(t), J(t), n("feed.showWorkflowDot");
		}
	}), e({
		id: `${nn}.Feed.ShowExtBadge`,
		category: r("Show format badges"),
		name: "Show format badges",
		tooltip: "Display format badges (e.g. JPG, MP4) on feed card thumbnails.",
		type: "boolean",
		defaultValue: !!(t.feed?.showExtBadge ?? A.FEED_SHOW_BADGES_EXTENSION),
		onChange: (e) => {
			i(), t.feed.showExtBadge = !!e, q(t), J(t), n("feed.showExtBadge");
		}
	}), e({
		id: `${nn}.Feed.ShowRatingBadge`,
		category: r("Show rating badges"),
		name: "Show ratings",
		tooltip: "Display star ratings on feed card thumbnails.",
		type: "boolean",
		defaultValue: !!(t.feed?.showRatingBadge ?? A.FEED_SHOW_BADGES_RATING),
		onChange: (e) => {
			i(), t.feed.showRatingBadge = !!e, q(t), J(t), n("feed.showRatingBadge");
		}
	}), e({
		id: `${nn}.Feed.ShowTagsBadge`,
		category: r("Show tags badges"),
		name: "Show tags",
		tooltip: "Display tag indicators on feed card thumbnails.",
		type: "boolean",
		defaultValue: !!(t.feed?.showTagsBadge ?? A.FEED_SHOW_BADGES_TAGS),
		onChange: (e) => {
			i(), t.feed.showTagsBadge = !!e, q(t), J(t), n("feed.showTagsBadge");
		}
	});
}
//#endregion
//#region ui/app/settings/settingsSecurity.ts
var on = "Majoor", sn = "Majoor Assets Manager", cn = 16;
function ln(e) {
	return !!e;
}
function un(e, t) {
	return ln(e) === ln(t);
}
function dn(e) {
	return typeof e == "string" ? e.trim() : "";
}
function fn(e) {
	let t = String(e || "").trim().toLowerCase();
	return t === "localhost" || t === "127.0.0.1" || t === "::1";
}
function pn() {
	return globalThis.location || globalThis.window?.location || null;
}
function mn() {
	let e = pn();
	if (!e) return !1;
	let t = String(e.protocol || "").toLowerCase(), n = String(e.hostname || "").trim();
	return t === "http:" && !fn(n);
}
function hn(e) {
	let t = globalThis.crypto;
	if (!t?.getRandomValues) throw Error("Secure token generation requires crypto.getRandomValues().");
	return t.getRandomValues(e);
}
function gn(e) {
	let t = Math.max(4, Number(e) || 0), n = new Uint8Array(t);
	return hn(n), Array.from(n, (e) => e.toString(16).padStart(2, "0")).join("");
}
function _n() {
	return `mjr_${gn(18)}`;
}
function vn(e) {
	return String(e?.apiToken || "").trim().length >= cn && H(e?.allowWrite, !0) && H(e?.requireAuth, !1) && !H(e?.allowRemoteWrite, !1);
}
function yn(e) {
	let t = String((e && typeof e == "object" ? e : {}).apiToken || "").trim();
	return {
		apiToken: t.length >= cn ? t : _n(),
		allowWrite: !0,
		requireAuth: !0,
		allowRemoteWrite: !1,
		allowInsecureTokenTransport: mn()
	};
}
function bn(e) {
	let t = e || {};
	return {
		safe_mode: H(t.safeMode, !1),
		allow_write: H(t.allowWrite, !0),
		require_auth: H(t.requireAuth, !1),
		allow_remote_write: H(t.allowRemoteWrite, !1),
		allow_insecure_token_transport: H(t.allowInsecureTokenTransport, !1),
		allow_delete: H(t.allowDelete, !0),
		allow_rename: H(t.allowRename, !0),
		allow_open_in_folder: H(t.allowOpenInFolder, !0),
		allow_reset_index: H(t.allowResetIndex, !1),
		...String(t.apiToken || "").trim() ? { api_token: String(t.apiToken || "").trim() } : {}
	};
}
function xn(e) {
	return ve(bn(e));
}
function Sn(e) {
	let t = String(e?.security?.tokenHint || "").trim();
	return t ? k("setting.sec.token.placeholderConfigured", "Token configured on server ({tokenHint}). Leave blank to keep the current server token.", { tokenHint: t }) : e?.security?.tokenConfigured ? k("setting.sec.token.placeholderConfiguredGeneric", "Token configured on server. Leave blank to keep the current server token.") : k("setting.sec.token.placeholder", "Auto-generated for this browser session.");
}
function Cn(e, t, n) {
	let r = (e, t) => [
		sn,
		e,
		t
	];
	e({
		id: `${on}.Safety.ConfirmDeletion`,
		category: r(k("cat.security"), "Confirm before deleting"),
		name: "Confirm before deleting",
		tooltip: "Show a confirmation dialog before deleting files. Disabling this allows instant deletion.",
		type: "boolean",
		defaultValue: t.safety?.confirmDeletion !== !1,
		onChange: (e) => {
			un(t.safety?.confirmDeletion !== !1, e) || (t.safety = t.safety || {}, t.safety.confirmDeletion = !!e, q(t), J(t), n("safety.confirmDeletion"));
		}
	});
	let a = (i, a, o, s = "cat.security") => {
		e({
			id: `${on}.Security.${i}`,
			category: r(k(s), k(a).replace("Majoor: ", "")),
			name: k(a),
			tooltip: k(o),
			type: "boolean",
			defaultValue: !!t.security?.[i],
			onChange: (e) => {
				if (!un(t.security?.[i], e)) {
					t.security = t.security || {}, t.security[i] = !!e, q(t), n(`security.${i}`);
					try {
						xn(t.security).then((e) => {
							e?.ok && e.data?.prefs ? Ut() : e && e.ok === !1 && console.warn("[Majoor] backend security settings update failed", e.error || e);
						}).catch(() => {});
					} catch (e) {
						console.debug?.(e);
					}
				}
			}
		});
	};
	a("safeMode", "setting.sec.safe.name", "setting.sec.safe.desc"), a("allowWrite", "setting.sec.write.name", "setting.sec.write.desc"), a("allowDelete", "setting.sec.del.name", "setting.sec.del.desc"), a("allowRename", "setting.sec.ren.name", "setting.sec.ren.desc"), a("allowOpenInFolder", "setting.sec.open.name", "setting.sec.open.desc"), a("allowResetIndex", "setting.sec.reset.name", "setting.sec.reset.desc"), e({
		id: `${on}.Security.RemoteLanPreset`,
		category: r(k("cat.remote"), k("setting.sec.remoteLanPreset.name").replace("Majoor: ", "")),
		name: k("setting.sec.remoteLanPreset.name"),
		tooltip: k("setting.sec.remoteLanPreset.desc"),
		type: "boolean",
		defaultValue: vn(t.security),
		onChange: (e) => {
			if (t.security = t.security || {}, un(t.security.remoteLanPreset, e)) return;
			if (t.security.remoteLanPreset = !!e, !e) {
				q(t), n("security.remoteLanPreset");
				return;
			}
			let r;
			try {
				r = yn(t.security);
			} catch (e) {
				i(e?.message || k("toast.remoteLanPresetFailed", "Failed to apply the recommended remote LAN setup."), "error");
				return;
			}
			Object.assign(t.security, r), t.security.tokenConfigured = !0, t.security.tokenHint = String(r.apiToken || "").trim() ? `...${String(r.apiToken).trim().slice(-4)}` : "", r.apiToken && S(r.apiToken), q(t), n("security.remoteLanPreset"), n("security.apiToken"), n("security.allowWrite"), n("security.requireAuth"), n("security.allowRemoteWrite"), n("security.allowInsecureTokenTransport");
			try {
				xn(t.security).then((e) => {
					e?.ok && e.data?.prefs ? (Ut(), i(k("toast.remoteLanPresetApplied", "Recommended remote LAN setup applied. This browser session is now authorized for Majoor write operations."), "success")) : e && e.ok === !1 && (i(e.error || k("toast.remoteLanPresetFailed", "Failed to apply the recommended remote LAN setup."), "error"), console.warn("[Majoor] backend remote LAN preset update failed", e.error || e));
				}).catch((e) => {
					i(e?.message || k("toast.remoteLanPresetFailed", "Failed to apply the recommended remote LAN setup."), "error");
				});
			} catch (e) {
				console.debug?.(e);
			}
		}
	}), e({
		id: `${on}.Security.ApiToken`,
		category: r(k("cat.remote"), k("setting.sec.token.name").replace("Majoor: ", "")),
		name: k("setting.sec.token.name", "Majoor: API Token"),
		tooltip: k("setting.sec.token.desc", "Store the API token used for write operations. Majoor sends it via X-MJR-Token and Authorization headers."),
		type: "text",
		defaultValue: t.security?.apiToken || "",
		attrs: { placeholder: Sn(t) },
		onChange: (e) => {
			t.security = t.security || {};
			let r = dn(e);
			if (dn(t.security.apiToken) !== r && (t.security.apiToken = r, t.security.apiToken && (t.security.tokenConfigured = !0, t.security.tokenHint = `...${t.security.apiToken.slice(-4)}`, S(t.security.apiToken)), q(t), n("security.apiToken"), t.security.apiToken)) try {
				ve({ api_token: t.security.apiToken }).then((e) => {
					e?.ok && e.data?.prefs ? Ut() : e && e.ok === !1 && console.warn("[Majoor] backend token update failed", e.error || e);
				}).catch(() => {});
			} catch (e) {
				console.debug?.(e);
			}
		}
	}), a("requireAuth", "setting.sec.requireAuth.name", "setting.sec.requireAuth.desc", "cat.remote"), a("allowRemoteWrite", "setting.sec.remote.name", "setting.sec.remote.desc", "cat.remote"), a("allowInsecureTokenTransport", "setting.sec.insecureTransport.name", "setting.sec.insecureTransport.desc", "cat.remote");
}
//#endregion
//#region ui/app/settings/settingsAdvanced.ts
var X = "Majoor", wn = "Majoor Assets Manager";
function Tn(t, s, c, _) {
	let y = (e, t) => [
		wn,
		e,
		t
	], b = String(s.paths?.outputDirectory || ""), x = null, S = 0, C = null;
	t({
		id: `${X}.Paths.OutputDirectory`,
		category: y(k("cat.advanced"), "Paths / Output"),
		name: "Majoor: Generation Output Directory",
		tooltip: "Override the ComfyUI generation output directory used by Majoor (equivalent to --output-directory). Leave empty to keep the current backend default.",
		type: "text",
		defaultValue: String(s.paths?.outputDirectory || ""),
		attrs: { placeholder: "D:\\\\____COMFY_OUTPUTS" },
		onChange: async (e) => {
			let t = String(e || "").trim();
			s.paths = s.paths || {}, s.paths.outputDirectory = t, q(s);
			try {
				x &&= (clearTimeout(x), null);
			} catch (e) {
				console.debug?.(e);
			}
			x = setTimeout(async () => {
				x = null;
				let e = ++S;
				try {
					C?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				C = typeof AbortController < "u" ? new AbortController() : null;
				try {
					let n = await ge(t, C ? { signal: C.signal } : {});
					if (e !== S) return;
					if (!n?.ok) throw Error(n?.error || k("toast.failedSetOutputDirectory", "Failed to set output directory"));
					let r = String(n?.data?.output_directory || t).trim();
					s.paths.outputDirectory = r, b = r, q(s), c("paths.outputDirectory");
				} catch (t) {
					if (e !== S || String(t?.name || "") === "AbortError" || String(t?.code || "") === "ABORTED") return;
					s.paths.outputDirectory = b, q(s), c("paths.outputDirectory"), i(t?.message || k("toast.failedSetOutputDirectory", "Failed to set output directory"), "error");
				}
			}, 700);
		}
	});
	try {
		l().then((e) => {
			if (!e?.ok) return;
			let t = String(e?.data?.output_directory || "").trim();
			s.paths = s.paths || {}, s.paths.outputDirectory !== t && (s.paths.outputDirectory = t, b = t, q(s), c("paths.outputDirectory"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	let w = String(s.paths?.indexDirectory || ""), T = null, E = 0, ee = null;
	t({
		id: `${X}.Paths.IndexDirectory`,
		category: y(k("cat.advanced"), "Paths / Index"),
		name: "Majoor: Index Database Directory",
		tooltip: "Override the Majoor index database directory. Use this to keep the SQLite index on a different local disk. Requires restart.",
		type: "text",
		defaultValue: String(s.paths?.indexDirectory || ""),
		attrs: { placeholder: "D:\\MajoorIndex" },
		onChange: async (e) => {
			let t = String(e || "").trim();
			s.paths = s.paths || {}, s.paths.indexDirectory = t, q(s);
			try {
				T &&= (clearTimeout(T), null);
			} catch (e) {
				console.debug?.(e);
			}
			T = setTimeout(async () => {
				T = null;
				let e = ++E;
				try {
					ee?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				ee = typeof AbortController < "u" ? new AbortController() : null;
				try {
					let n = await D(t, ee ? { signal: ee.signal } : {});
					if (e !== E) return;
					if (!n?.ok) throw Error(n?.error || k("toast.failedSetIndexDirectory", "Failed to set index directory"));
					let r = String(n?.data?.index_directory || t).trim(), a = r !== w;
					s.paths.indexDirectory = r, w = r, q(s), c("paths.indexDirectory"), a && i(k("toast.indexDirectorySavedRestart", "Index directory saved. Restart ComfyUI to apply."), "success", void 0, { history: { trackId: "settings:index-directory-saved" } });
				} catch (t) {
					if (e !== E || String(t?.name || "") === "AbortError" || String(t?.code || "") === "ABORTED") return;
					s.paths.indexDirectory = w, q(s), c("paths.indexDirectory"), i(t?.message || k("toast.failedSetIndexDirectory", "Failed to set index directory"), "error");
				}
			}, 700);
		}
	});
	try {
		m().then((e) => {
			if (!e?.ok) return;
			let t = String(e?.data?.index_directory || "").trim();
			s.paths = s.paths || {}, s.paths.indexDirectory !== t && (s.paths.indexDirectory = t, w = t, q(s), c("paths.indexDirectory"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	let ne = v().map((e) => e.code), re = ["auto", ...ne];
	t({
		id: `${X}.Language`,
		category: y(k("cat.advanced"), k("setting.language.name", "Language")),
		name: k("setting.language.name", "Majoor: Language"),
		tooltip: "Use auto to detect and follow ComfyUI language. Or choose a fixed language for Majoor only.",
		type: "combo",
		defaultValue: s.i18n?.followComfyLanguage ? "auto" : h(),
		options: re,
		onChange: (e) => {
			if (s.i18n = s.i18n || {}, e === "auto") {
				s.i18n.followComfyLanguage = !0, u(!0), o(_), q(s), c("language");
				return;
			}
			ne.includes(e) && (s.i18n.followComfyLanguage = !1, u(!1), f(e), q(s), c("language"));
		}
	}), t({
		id: `${X}.ProbeBackend.Mode`,
		category: y(k("cat.advanced"), k("setting.probe.mode.name").replace("Majoor: ", "")),
		name: k("setting.probe.mode.name"),
		tooltip: k("setting.probe.mode.desc") + " (env: MAJOOR_MEDIA_PROBE_BACKEND)",
		type: "combo",
		defaultValue: s.probeBackend?.mode || G.probeBackend.mode,
		options: [
			"auto",
			"exiftool",
			"ffprobe",
			"both"
		],
		onChange: (e) => {
			let t = gt(e, [
				"auto",
				"exiftool",
				"ffprobe",
				"both"
			], G.probeBackend.mode);
			s.probeBackend = s.probeBackend || {}, s.probeBackend.mode = t, q(s), J(s), c("probeBackend.mode"), ie(t).catch(() => {});
		}
	}), t({
		id: `${X}.MetadataFallback.Image`,
		category: y(k("cat.advanced"), "Metadata"),
		name: "Majoor: Metadata Fallback (Images)",
		tooltip: "Enable Pillow fallback when ExifTool is missing or fails.",
		type: "boolean",
		defaultValue: s.metadataFallback?.image ?? G.metadataFallback.image,
		onChange: async (e) => {
			let t = !!e, n = !!(s.metadataFallback?.image ?? G.metadataFallback.image);
			s.metadataFallback = s.metadataFallback || {}, s.metadataFallback.image = t, q(s), c("metadataFallback.image");
			try {
				let e = await fe({
					image: t,
					media: s.metadataFallback?.media ?? G.metadataFallback.media
				});
				if (!e?.ok) throw Error(e?.error || k("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"));
			} catch (e) {
				s.metadataFallback.image = n, q(s), c("metadataFallback.image"), i(e?.message || k("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"), "error");
			}
		}
	}), t({
		id: `${X}.MetadataFallback.Media`,
		category: y(k("cat.advanced"), "Metadata"),
		name: "Majoor: Metadata Fallback (Audio/Video)",
		tooltip: "Enable hachoir fallback when ffprobe is missing or fails.",
		type: "boolean",
		defaultValue: s.metadataFallback?.media ?? G.metadataFallback.media,
		onChange: async (e) => {
			let t = !!e, n = !!(s.metadataFallback?.media ?? G.metadataFallback.media);
			s.metadataFallback = s.metadataFallback || {}, s.metadataFallback.media = t, q(s), c("metadataFallback.media");
			try {
				let e = await fe({
					image: s.metadataFallback?.image ?? G.metadataFallback.image,
					media: t
				});
				if (!e?.ok) throw Error(e?.error || k("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"));
			} catch (e) {
				s.metadataFallback.media = n, q(s), c("metadataFallback.media"), i(e?.message || k("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"), "error");
			}
		}
	});
	try {
		a().then((e) => {
			if (!e?.ok || !e?.data?.prefs) return;
			let t = e.data.prefs || {}, n = !!(t.image ?? G.metadataFallback.image), r = !!(t.media ?? G.metadataFallback.media);
			s.metadataFallback = s.metadataFallback || {};
			let i = !1;
			s.metadataFallback.image !== n && (s.metadataFallback.image = n, i = !0), s.metadataFallback.media !== r && (s.metadataFallback.media = r, i = !0), i && (q(s), c("metadataFallback"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	t({
		id: `${X}.Db.Timeout`,
		category: y(k("cat.advanced"), "Database"),
		name: "DB Timeout (ms)",
		tooltip: "Client-side DB timeout preference (stored locally).",
		type: "number",
		defaultValue: Number(s.db?.timeoutMs || 5e3),
		attrs: {
			min: 1e3,
			max: 3e4,
			step: 1e3
		},
		onChange: (e) => {
			s.db = s.db || {}, s.db.timeoutMs = Math.max(1e3, Math.min(3e4, Math.round(U(e, 5e3)))), q(s), J(s), c("db.timeoutMs");
		}
	}), t({
		id: `${X}.Db.MaxConnections`,
		category: y(k("cat.advanced"), "Database"),
		name: "DB Max Connections",
		tooltip: "Client-side DB max connections preference (stored locally).",
		type: "number",
		defaultValue: Number(s.db?.maxConnections || 10),
		attrs: {
			min: 1,
			max: 100,
			step: 1
		},
		onChange: (e) => {
			s.db = s.db || {}, s.db.maxConnections = Math.max(1, Math.min(100, Math.round(U(e, 10)))), q(s), J(s), c("db.maxConnections");
		}
	}), t({
		id: `${X}.Db.QueryTimeout`,
		category: y(k("cat.advanced"), "Database"),
		name: "DB Query Timeout (ms)",
		tooltip: "Client-side DB query timeout preference (stored locally).",
		type: "number",
		defaultValue: Number(s.db?.queryTimeoutMs || 1e3),
		attrs: {
			min: 500,
			max: 1e4,
			step: 500
		},
		onChange: (e) => {
			s.db = s.db || {}, s.db.queryTimeoutMs = Math.max(500, Math.min(1e4, Math.round(U(e, 1e3)))), q(s), J(s), c("db.queryTimeoutMs");
		}
	}), t({
		id: `${X}.Observability.Enabled`,
		category: y(k("cat.advanced"), k("setting.obs.enabled.name").replace("Majoor: ", "")),
		name: k("setting.obs.enabled.name"),
		tooltip: k("setting.obs.enabled.desc"),
		type: "boolean",
		defaultValue: !!s.observability?.enabled,
		onChange: (e) => {
			s.observability = s.observability || {}, s.observability.enabled = !!e, q(s), J(s), c("observability.enabled");
		}
	}), t({
		id: `${X}.Observability.VerboseErrors`,
		category: y(k("cat.advanced"), "Verbose error logging"),
		name: "Verbose error logging",
		tooltip: "Show detailed error messages in toasts and console. Useful for debugging.",
		type: "boolean",
		defaultValue: !!s.observability?.verboseErrors,
		onChange: (e) => {
			s.observability = s.observability || {}, s.observability.verboseErrors = !!e, q(s), J(s), c("observability.verboseErrors");
		}
	}), t({
		id: `${X}.Observability.VerboseRouteRegistrationLogs`,
		category: y(k("cat.advanced"), "Logs"),
		name: "Majoor: Verbose route registration logs",
		tooltip: "When disabled, Majoor prints a compact startup summary instead of listing every registered API route. Takes effect on the next backend restart.",
		type: "boolean",
		defaultValue: !!(s.observability?.verboseRouteRegistrationLogs ?? G.observability?.verboseRouteRegistrationLogs ?? !1),
		onChange: async (e) => {
			let t = !!e, n = !!(s.observability?.verboseRouteRegistrationLogs ?? G.observability?.verboseRouteRegistrationLogs ?? !1);
			s.observability = s.observability || {}, s.observability.verboseRouteRegistrationLogs = t, q(s), c("observability.verboseRouteRegistrationLogs");
			try {
				let e = await le(t);
				if (!e?.ok) throw Error(e?.error || "Failed to update route logging settings");
			} catch (e) {
				s.observability.verboseRouteRegistrationLogs = n, q(s), c("observability.verboseRouteRegistrationLogs"), i(e?.message || "Failed to update route logging settings", "error");
			}
		}
	}), (async () => {
		try {
			let e = !!(await d())?.data?.prefs?.enabled;
			s.observability = s.observability || {}, s.observability.verboseRouteRegistrationLogs !== e && (s.observability.verboseRouteRegistrationLogs = e, q(s), c("observability.verboseRouteRegistrationLogs"));
		} catch (e) {
			console.debug?.(e);
		}
	})(), t({
		id: `${X}.Observability.VerboseStartupLogs`,
		category: y(k("cat.advanced"), "Logs"),
		name: "Majoor: Verbose startup logs",
		tooltip: "When disabled, Majoor suppresses most informational bootstrap logs during backend startup while keeping warnings and errors. Takes effect on the next backend restart.",
		type: "boolean",
		defaultValue: !!(s.observability?.verboseStartupLogs ?? G.observability?.verboseStartupLogs ?? !1),
		onChange: async (e) => {
			let t = !!e, n = !!(s.observability?.verboseStartupLogs ?? G.observability?.verboseStartupLogs ?? !1);
			s.observability = s.observability || {}, s.observability.verboseStartupLogs = t, q(s), c("observability.verboseStartupLogs");
			try {
				let e = await ae(t);
				if (!e?.ok) throw Error(e?.error || "Failed to update startup logging settings");
			} catch (e) {
				s.observability.verboseStartupLogs = n, q(s), c("observability.verboseStartupLogs"), i(e?.message || "Failed to update startup logging settings", "error");
			}
		}
	}), (async () => {
		try {
			let t = !!(await e())?.data?.prefs?.enabled;
			s.observability = s.observability || {}, s.observability.verboseStartupLogs !== t && (s.observability.verboseStartupLogs = t, q(s), c("observability.verboseStartupLogs"));
		} catch (e) {
			console.debug?.(e);
		}
	})();
	{
		let e = "HuggingFace Token", n = "", r = null, a = 0, o = !!s.ai?.huggingFaceTokenVisible, l = () => {
			try {
				let e = Array.from(document.querySelectorAll("input[data-mjr-hf-token=\"1\"]"));
				for (let t of e) try {
					t.type = o ? "text" : "password";
				} catch (e) {
					console.debug?.(e);
				}
			} catch (e) {
				console.debug?.(e);
			}
		}, u = (e) => {
			try {
				let t = String(e || "").trim();
				if (!t) return;
				let n = Array.from(document.querySelectorAll("input[data-mjr-hf-token=\"1\"]"));
				for (let e of n) try {
					e.placeholder = t;
				} catch (e) {
					console.debug?.(e);
				}
			} catch (e) {
				console.debug?.(e);
			}
		};
		t({
			id: `${X}.AI.HuggingFaceTokenVisible`,
			category: y(k("cat.advanced"), e),
			name: "Show HuggingFace token",
			tooltip: "Show or hide the HuggingFace token while editing.",
			type: "boolean",
			defaultValue: o,
			onChange: (e) => {
				let t = !!e;
				o = t, s.ai = s.ai || {}, s.ai.huggingFaceTokenVisible = t, q(s), c("ai.huggingFaceTokenVisible"), setTimeout(l, 0);
			}
		}), t({
			id: `${X}.AI.HuggingFaceToken`,
			category: y(k("cat.advanced"), e),
			name: "HuggingFace Token",
			tooltip: [
				"Optional token for HuggingFace Hub downloads (higher rate limits).",
				"Saved server-side and used by CLIP model loading.",
				"Leave empty to clear the stored token."
			].join("\n"),
			type: "text",
			defaultValue: "",
			attrs: {
				placeholder: "Paste HuggingFace token (hf_...)",
				type: o ? "text" : "password",
				autocomplete: "new-password",
				name: "mjr_huggingface_token",
				"data-mjr-hf-token": "1"
			},
			onChange: (e) => {
				let t = String(e || "").trim();
				if (t !== n) {
					try {
						r &&= (clearTimeout(r), null);
					} catch (e) {
						console.debug?.(e);
					}
					r = setTimeout(async () => {
						r = null;
						let e = ++a;
						try {
							let r = await he(t);
							if (e !== a) return;
							if (!r?.ok) throw Error(r?.error || "Failed to update HuggingFace token");
							n = t, c("ai.huggingFaceToken"), t ? i("HuggingFace token saved", "success") : i("HuggingFace token cleared", "success", void 0, { noHistory: !0 });
						} catch (t) {
							if (e !== a) return;
							i(t?.message || "Failed to update HuggingFace token", "error");
						}
					}, 900);
				}
			}
		}), setTimeout(l, 0), (async () => {
			try {
				let e = (await p())?.data?.prefs || {}, t = !!e?.has_token, n = String(e?.token_hint || "").trim();
				u(t ? `Configured ${n || "(saved)"}` : "Paste HuggingFace token (hf_...)");
			} catch (e) {
				console.debug?.(e);
			}
		})(), t({
			id: `${X}.AI.VerboseLogs`,
			category: y(k("cat.advanced"), e),
			name: "Majoor: Verbose AI logs",
			tooltip: "Enable detailed HuggingFace/SigLIP2/X-CLIP logs and progress bars during model download/loading.",
			type: "boolean",
			defaultValue: !!(s.ai?.verboseAiLogs ?? G.ai?.verboseAiLogs ?? !1),
			onChange: async (e) => {
				let t = !!e, n = !!(s.ai?.verboseAiLogs ?? G.ai?.verboseAiLogs ?? !1);
				s.ai = s.ai || {}, s.ai.verboseAiLogs = t, q(s), c("ai.verboseAiLogs");
				try {
					let e = await _e(t);
					if (!e?.ok) throw Error(e?.error || "Failed to update AI logging settings");
				} catch (e) {
					s.ai.verboseAiLogs = n, q(s), c("ai.verboseAiLogs"), i(e?.message || "Failed to update AI logging settings", "error");
				}
			}
		}), (async () => {
			try {
				let e = !!(await g())?.data?.prefs?.enabled;
				s.ai = s.ai || {}, s.ai.verboseAiLogs !== e && (s.ai.verboseAiLogs = e, q(s), c("ai.verboseAiLogs"));
			} catch (e) {
				console.debug?.(e);
			}
		})();
	}
	t({
		id: `${X}.AI.VectorStats`,
		category: y(k("cat.advanced"), "AI / Vector Search"),
		name: "Vector Index Status",
		tooltip: "Current status of the SigLIP2/X-CLIP vector index used for semantic search",
		type: "text",
		defaultValue: "Loading vector status..."
	}), (async () => {
		try {
			let e = await n();
			e?.ok ? console.debug?.("[Majoor] Vector status:", `${e.data?.total || 0} assets indexed | Model: ${e.data?.model || "N/A"}`) : console.debug?.("[Majoor] Vector status unavailable");
		} catch (e) {
			console.debug?.("[Majoor] Vector status fetch failed", e);
		}
	})(), t({
		id: `${X}.AI.VectorBackfillAction`,
		category: y(k("cat.advanced"), "AI / Vector Search"),
		name: "Vector Index Action",
		tooltip: [
			"Compute CLIP embeddings for all assets that don't have them yet.",
			"This is required for AI semantic search to work.",
			"",
			"Choose 'Run backfill now' to start indexing.",
			"This may take several minutes for large libraries.",
			"",
			"Note: New assets are indexed automatically during scanning."
		].join("\n"),
		type: "combo",
		defaultValue: "Idle",
		options: ["Idle", "Run backfill now"],
		onChange: async (e) => {
			if (String(e || "") !== "Run backfill now") return;
			let t = { history: {
				trackId: "vector-backfill:advanced-settings",
				title: "Vector Backfill",
				source: "all",
				operation: "vector_backfill",
				forceStore: !0
			} };
			try {
				i(k("toast.vectorBackfillStarting", "Starting vector backfill... This may take a while."), "info", void 0, { history: {
					...t.history,
					status: "started",
					detail: "Starting vector backfill... This may take a while."
				} });
				let e = await te(64, { onProgress: (e) => {
					let n = String(e?.status || "running").toLowerCase() || "running", i = e?.progress || e?.result || {}, a = Number(i?.candidates ?? i?.processed ?? 0), o = Number(i?.indexed ?? 0), s = Number(i?.skipped ?? 0), c = Number(i?.errors ?? 0), l = Math.max(a, o + s + c), u = l > 0 ? Math.round((o + s + c) / l * 100) : null, d = n === "queued" ? "Vector backfill queued" : `Candidates ${a}, indexed ${o}, skipped ${s}, errors ${c}`;
					r({
						summary: "Vector Backfill",
						detail: d
					}, n === "failed" ? "error" : n === "succeeded" ? "success" : "info", 0, { history: {
						...t.history,
						status: n,
						detail: d,
						progress: {
							current: o + s + c,
							total: l,
							percent: u,
							indexed: o,
							skipped: s,
							errors: c,
							label: n
						}
					} });
				} });
				if (e?.ok) {
					let r = e.data || {}, a = String(r?.status || "").toLowerCase(), o = !!r?.pending || [
						"queued",
						"running",
						"pending"
					].includes(a), s = r?.progress || {}, c = Number(r?.processed ?? s?.candidates ?? 0), l = Number(r?.indexed ?? s?.indexed ?? 0), u = Number(r?.skipped ?? s?.skipped ?? 0);
					if (o) {
						let e = String(r?.job_id || "").trim();
						i(k("toast.vectorBackfillRunning", "Vector backfill still running in background{job}.", { job: e ? ` (job ${e.slice(0, 8)})` : "" }), "info", void 0, { history: {
							...t.history,
							status: "running",
							detail: `Vector backfill still running in background${e ? ` (${e.slice(0, 8)})` : ""}.`,
							progress: {
								current: l + u,
								total: Math.max(c, l + u),
								percent: Math.max(c, l + u) > 0 ? Math.round((l + u) / Math.max(c, l + u) * 100) : null,
								indexed: l,
								skipped: u,
								label: "running"
							}
						} });
					} else i(k("toast.vectorBackfillComplete", "Vector backfill complete! Processed: {processed}, Indexed: {indexed}, Skipped: {skipped}", {
						processed: c,
						indexed: l,
						skipped: u
					}), "success", void 0, { history: {
						...t.history,
						status: "succeeded",
						detail: `Processed ${c}, indexed ${l}, skipped ${u}`,
						progress: {
							current: c,
							total: c,
							percent: c > 0 ? 100 : null,
							indexed: l,
							skipped: u,
							label: "done"
						}
					} });
					try {
						let e = await n();
						e?.ok && console.debug?.("[Majoor] Vector stats after backfill:", e.data);
					} catch (e) {
						console.debug?.("[Majoor] Failed to refresh vector stats:", e);
					}
				} else throw Error(e?.error || k("toast.vectorBackfillFailedGeneric", "Backfill failed"));
			} catch (e) {
				let n = e?.message || String(e || k("status.unknown", "unknown"));
				i(k("toast.vectorBackfillFailedDetail", "Vector backfill failed: {error}", { error: n }), "error", void 0, { history: {
					...t.history,
					status: "failed",
					detail: n
				} }), console.error("[Majoor] Vector backfill error:", e);
			}
		}
	});
}
//#endregion
//#region ui/app/settings/settingsSearch.ts
var En = "Majoor", Dn = "Majoor Assets Manager";
function On(e, t, n) {
	let r = (e, t) => [
		Dn,
		e,
		t
	];
	e({
		id: `${En}.AI.VectorSearchEnabled`,
		category: r(k("cat.search", "Search"), "AI"),
		name: k("setting.ai.vector.enabled.name", "Enable AI semantic search"),
		tooltip: k("setting.ai.vector.enabled.desc", "Enable/disable AI vector search features (SigLIP2/X-CLIP: description search, prompt alignment, AI tag suggestions, smart collections)."),
		type: "boolean",
		defaultValue: !!(t.ai?.vectorSearchEnabled ?? !0),
		onChange: async (e) => {
			t.ai = t.ai || {};
			let r = !!(t.ai.vectorSearchEnabled ?? !0), a = !!e;
			t.ai.vectorSearchEnabled = a, q(t), J(t), n("ai.vectorSearchEnabled");
			try {
				let e = await oe(a);
				if (!e?.ok) {
					t.ai.vectorSearchEnabled = r, q(t), J(t), n("ai.vectorSearchEnabled"), i(e?.error || "Failed to update AI vector search setting", "error");
					return;
				}
				i(a ? "AI semantic search enabled" : "AI semantic search disabled", "info", 2200);
			} catch (e) {
				t.ai.vectorSearchEnabled = r, q(t), J(t), n("ai.vectorSearchEnabled"), i(e?.message || "Failed to update AI vector search setting", "error");
			}
		}
	}), e({
		id: `${En}.AI.VectorCaptionOnIndex`,
		category: r(k("cat.search", "Search"), "AI"),
		name: k("setting.ai.vector.captionOnIndex.name", "Generate AI captions during indexing"),
		tooltip: k("setting.ai.vector.captionOnIndex.desc", "Allow automatic vector indexing and backfill to run Florence-2 captions for image assets. This is slower and can use significant VRAM/CPU; leave it off for faster grid startup."),
		type: "boolean",
		defaultValue: !!(t.ai?.vectorCaptionOnIndex ?? !1),
		onChange: async (e) => {
			t.ai = t.ai || {};
			let r = !!(t.ai.vectorCaptionOnIndex ?? !1), a = !!e;
			t.ai.vectorCaptionOnIndex = a, q(t), J(t), n("ai.vectorCaptionOnIndex");
			try {
				let e = await oe({ caption_on_index: a });
				if (!e?.ok) {
					t.ai.vectorCaptionOnIndex = r, q(t), J(t), n("ai.vectorCaptionOnIndex"), i(e?.error || "Failed to update AI caption indexing setting", "error");
					return;
				}
				a && i("AI captions during indexing enabled", "info", 2600);
			} catch (e) {
				t.ai.vectorCaptionOnIndex = r, q(t), J(t), n("ai.vectorCaptionOnIndex"), i(e?.message || "Failed to update AI caption indexing setting", "error");
			}
		}
	}), e({
		id: `${En}.Search.MaxResults`,
		category: r(k("cat.search", "Search")),
		name: k("setting.search.maxResults.name", "Max search results (client)"),
		tooltip: k("setting.search.maxResults.desc", "Maximum number of results requested per search. The backend still enforces MAJOOR_SEARCH_MAX_LIMIT; increase that env var if you need a higher hard cap."),
		type: "number",
		defaultValue: Number(t.search?.maxResults || A.SEARCH_DEFAULT_LIMIT),
		attrs: {
			min: 10,
			max: A.MAX_PAGE_SIZE || 2e3,
			step: 1
		},
		onChange: (e) => {
			t.search = t.search || {}, t.search.maxResults = Math.max(10, Math.min(A.MAX_PAGE_SIZE || 2e3, Number(e) || A.SEARCH_DEFAULT_LIMIT)), q(t), J(t), n("search.maxResults");
		}
	}), e({
		id: `${En}.EnvVars.Reference`,
		category: r(k("cat.advanced"), "Environment variables"),
		name: "Environment variables reference",
		tooltip: [
			"Set these env vars before starting ComfyUI to override defaults:",
			"",
			"MAJOOR_OUTPUT_DIRECTORY - Override output root directory",
			"MAJOOR_EXIFTOOL_PATH - Path to exiftool binary",
			"MAJOOR_FFPROBE_PATH - Path to ffprobe binary",
			"MAJOOR_MEDIA_PROBE_BACKEND - Probe mode: auto|exiftool|ffprobe|both",
			"MAJOOR_EXIFTOOL_TIMEOUT - ExifTool timeout in seconds (default: 15)",
			"MAJOOR_FFPROBE_TIMEOUT - FFprobe timeout in seconds (default: 10)",
			"MAJOOR_DB_TIMEOUT - Database timeout in seconds (default: 30)",
			"MAJOOR_DB_MAX_CONNECTIONS - Max DB connections (default: 8)",
			"MAJOOR_METADATA_CACHE_MAX - Metadata cache max entries (default: 100000)",
			"MAJOOR_METADATA_EXTRACT_CONCURRENCY - Parallel metadata workers (default: 1)",
			"MJR_ENABLE_WATCHER - Enable file watcher: 1|0 (default: 1)",
			"MJR_WATCHER_DEBOUNCE_MS - Watcher debounce delay in ms (default: 3000)",
			"MJR_WATCHER_DEDUPE_TTL_MS - Watcher dedupe window in ms (default: 3000)",
			"MJR_WATCHER_MAX_FILE_SIZE_BYTES - Max file size to index (default: 512MB)",
			"MJR_WATCHER_FLUSH_MAX_FILES - Max files per flush batch (default: 256)",
			"MJR_WATCHER_PENDING_MAX - Max pending watcher queue (default: 5000)",
			"MJR_AM_ENABLE_VECTOR_SEARCH - Enable AI vector/semantic search: 1|0 (default: 1)",
			"MJR_AM_VECTOR_CAPTION_ON_INDEX - Generate Florence captions during vector indexing: 1|0 (default: 0)",
			"MAJOOR_SEARCH_MAX_LIMIT - Max search results (default: 500)",
			"MAJOOR_BG_SCAN_ON_LIST - Scan on directory list: 0|1 (default: 0)"
		].join("\n"),
		type: "text",
		defaultValue: "Hover for full list of environment variables"
	});
}
//#endregion
//#region ui/app/settings/SettingsPanel.ts
var kn = "Majoor Assets Manager", An = /^\s*Majoor:\s*/i, jn = new Set([
	"grid.starColor",
	"grid.badgeImageColor",
	"grid.badgeVideoColor",
	"grid.badgeAudioColor",
	"grid.badgeModel3dColor",
	"grid.badgeDuplicateAlertColor",
	"ui.cardHoverColor",
	"ui.cardSelectionColor",
	"ui.ratingColor",
	"ui.tagColor"
]), Mn = !1, Nn = null, Pn = null, Fn = !1, In = /* @__PURE__ */ new Set();
function Ln(e) {
	if (!e || typeof e != "object") return null;
	let t = { ...e };
	try {
		typeof t.name == "string" && (t.name = t.name.replace(An, "").trim());
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let e = t.category;
		!Array.isArray(e) || !e.length ? t.category = [kn] : String(e[0] || "") === kn ? t.category = e.filter(Boolean) : t.category = [kn, ...e.filter(Boolean)];
	} catch {
		t.category = [kn];
	}
	return !t.tooltip && typeof t.name == "string" && t.name.trim() && (t.tooltip = t.name.trim()), t;
}
function Rn(e, t, n) {
	let r = String(t?.id || "").trim();
	if (!r || In.has(r)) return !1;
	In.add(r);
	try {
		return pe(e, r, n);
	} finally {
		In.delete(r);
	}
}
function zn(e, t) {
	if (!t || typeof t != "object") return t;
	let n = { ...t };
	Rn(e, n, n.defaultValue);
	let r = n.onChange;
	return n.onChange = (t, ...i) => {
		if (Rn(e, n, t), typeof r == "function") return r(t, ...i);
		n.defaultValue = t;
	}, n;
}
function Bn(e, t, { initRuntime: n = !1 } = {}) {
	if (Pn) typeof t == "function" && Pn.onAppliedListeners.add(t), e && !Pn.app && (Pn.app = e);
	else {
		let n = K();
		n.i18n = n.i18n || {}, typeof n.i18n.followComfyLanguage == "boolean" ? u(!!n.i18n.followComfyLanguage) : (n.i18n.followComfyLanguage = !0, u(!0), q(n));
		let r = /* @__PURE__ */ new Set();
		typeof t == "function" && r.add(t);
		let i = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set(), o = () => {
			if (!i.size) return;
			let e = Array.from(i);
			i.clear();
			for (let t of e) ht("mjr-settings-changed", { key: t }, { warnPrefix: "[Majoor]" });
		}, s = () => {
			if (!a.size) return;
			let e = Array.from(a);
			a.clear();
			for (let t of e) ht("mjr-settings-changed", { key: t }, { warnPrefix: "[Majoor]" });
		}, c = qt(o, 120), l = qt(s, 450), d = (e) => {
			typeof e == "string" && i.add(e), c();
		}, f = (e) => {
			typeof e == "string" && a.add(e), l();
		}, p = () => {
			let e = K();
			Object.assign(n, e), J(n), d("storage");
		}, m = (e) => {
			!e || e.key !== "mjrSettings" || e.newValue !== e.oldValue && p();
		};
		if (!Mn) {
			if (Nn && typeof window < "u") try {
				window.removeEventListener("storage", Nn);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				window.addEventListener("storage", m), Mn = !0, Nn = m;
			} catch (e) {
				console.debug?.(e);
			}
		}
		Pn = {
			app: e,
			notifyApplied: (e) => {
				for (let t of r) try {
					t(n, e);
				} catch (e) {
					console.debug?.(e);
				}
				jn.has(String(e || "")) ? f(e) : d(e);
			},
			onAppliedListeners: r,
			refreshFromStorage: p,
			settings: n
		};
	}
	if (n && !Fn) {
		let t = e || Pn.app, n = Pn.settings;
		o(t), J(n), x(t), Ut(), Wt(), Gt(), n?.watcher && typeof n.watcher.enabled == "boolean" && ce(!!n.watcher.enabled).catch(() => {}), mt(), Fn = !0;
	}
	return Pn;
}
var Vn = (e, t) => Bn(e, t, { initRuntime: !0 }).settings, Hn = (e, t) => {
	let n = Bn(e, t, { initRuntime: !1 });
	Object.assign(n.settings, K());
	let r = (t) => {
		let r = Ln(t);
		r && i.push(zn(e || n.app, r));
	}, i = [];
	return Yt(r, n.settings, n.notifyApplied), an(r, n.settings, n.notifyApplied), Qt(r, n.settings, n.notifyApplied), tn(r, n.settings, n.notifyApplied), Cn(r, n.settings, n.notifyApplied), Tn(r, n.settings, n.notifyApplied, e), On(r, n.settings, n.notifyApplied), i;
};
try {
	let e = K();
	e?.watcher && typeof e.watcher.enabled == "boolean" && T().then((e) => {
		let t = !!e?.ok && !!e?.data?.enabled, n = K();
		n.watcher = n.watcher || {}, typeof t == "boolean" && t !== !!n.watcher.enabled && (n.watcher.enabled = t, q(n), ht("mjr-settings-changed", { key: "watcher.enabled" }, { warnPrefix: "[Majoor]" }));
	}).catch(() => {});
} catch (e) {
	console.debug?.(e);
}
//#endregion
//#region ui/features/status/AssetStatusDotTheme.ts
function Un(e) {
	return String(e || "").trim().toLowerCase();
}
function Wn({ dot: e = null, asset: t = null, scope: n = "" } = {}) {
	let r = Un(n);
	if (r) return r === "custom";
	let i = Un(t?.type || t?.scope);
	if (i) return i === "custom";
	try {
		let t = Un(e?.closest?.(".mjr-grid")?.dataset?.mjrScope);
		if (t) return t === "custom";
	} catch (e) {
		console.debug?.(e);
	}
	return !1;
}
function Gn(e, t = {}) {
	let n = Un(e);
	return Wn(t) ? n === "pending" || n === "info" ? "var(--mjr-browser-status-info, #4DB6AC)" : n === "success" ? "var(--mjr-browser-status-success, #2E7D32)" : n === "warning" ? "var(--mjr-browser-status-warning, #FFB74D)" : n === "error" ? "var(--mjr-browser-status-error, #EF5350)" : "var(--mjr-browser-status-neutral, #90A4AE)" : n === "pending" || n === "info" ? "var(--mjr-status-info, #64B5F6)" : n === "success" ? "var(--mjr-status-success, #4CAF50)" : n === "warning" ? "var(--mjr-status-warning, #FFA726)" : n === "error" ? "var(--mjr-status-error, #f44336)" : "var(--mjr-status-neutral, #666)";
}
//#endregion
//#region ui/stores/useRuntimeStore.ts
var Kn = Qe("mjr-runtime", () => {
	let e = I(null), t = I(null), n = I(!1), r = I(0), i = I(null), a = I(null), o = I(null), s = I(null), c = I(null), l = I([]), u = B(() => !!i.value), d = B(() => {
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
function qn() {
	try {
		return $e() ? Kn() : null;
	} catch {
		return null;
	}
}
//#endregion
//#region ui/stores/runtimeEnrichmentState.ts
var Jn = Symbol.for("majoor.assets_manager.runtime_state");
function Yn() {
	return {
		api: null,
		assetsDeletedHandler: null,
		enrichmentActive: !1,
		enrichmentQueueLength: 0
	};
}
function Xn() {
	try {
		let e = typeof globalThis < "u" ? globalThis : {};
		return (!e[Jn] || typeof e[Jn] != "object") && (e[Jn] = Yn()), e[Jn];
	} catch {
		return Yn();
	}
}
function Zn(e, t) {
	let n = qn();
	if (n) {
		n.setEnrichmentState(e, t);
		return;
	}
	let r = Xn();
	r.enrichmentActive = !!e, r.enrichmentQueueLength = Math.max(0, Number(t || 0) || 0);
}
function Qn() {
	let e = qn();
	if (e) return e.getEnrichmentState();
	let t = Xn();
	return {
		active: !!t.enrichmentActive,
		queueLength: Math.max(0, Number(t.enrichmentQueueLength || 0) || 0)
	};
}
//#endregion
//#region ui/features/grid/AssetCardRenderer.ts
function $n(e) {
	try {
		return String(e || "").trim().toLowerCase();
	} catch {
		return "";
	}
}
function er(e) {
	try {
		return (String(e || "").split(".").pop() || "").toUpperCase();
	} catch {
		return "";
	}
}
function tr(e) {
	try {
		let t = String(e || ""), n = t.lastIndexOf("."), r = n > 0 ? t.slice(0, n) : t;
		return String(r || "").trim().toLowerCase();
	} catch {
		return "";
	}
}
function nr(e) {
	try {
		if (String(e?.kind || "").toLowerCase() !== "video") return !1;
		let t = String(e?.filename || "").toLowerCase();
		return t.includes("-audio") || t.includes("_audio");
	} catch {
		return !1;
	}
}
function rr(e) {
	try {
		let t = String(e?.kind || "").toLowerCase(), n = 0;
		nr(e) ? n = 2 : t === "video" && (n = 1);
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
function ir(e, t) {
	for (let n = 0; n < Math.max(e.length, t.length); n++) {
		let r = (e[n] || 0) - (t[n] || 0);
		if (r !== 0) return r;
	}
	return 0;
}
function ar(e) {
	if (!Array.isArray(e) || e.length === 0) return null;
	if (e.length === 1) return e[0];
	let t = e[0], n = rr(t);
	for (let r = 1; r < e.length; r++) {
		let i = e[r], a = rr(i);
		ir(a, n) > 0 && (t = i, n = a);
	}
	return t;
}
function or(e, t) {
	if (!e || !Array.isArray(t) || t.length === 0 || (Number(e?.generation_time_ms ?? e?.metadata?.generation_time_ms ?? 0) || 0) > 0) return e;
	let n = t.find((e) => (Number(e?.generation_time_ms ?? e?.metadata?.generation_time_ms ?? 0) || 0) > 0);
	if (!n) return e;
	let r = Number(n?.generation_time_ms ?? n?.metadata?.generation_time_ms ?? 0) || 0;
	return r <= 0 ? e : (e.generation_time_ms = r, !e.has_generation_data && n?.has_generation_data && (e.has_generation_data = n.has_generation_data), e);
}
function sr(e, t) {
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
function cr(e) {
	try {
		return !!e()?.siblings?.hidePngSiblings;
	} catch {
		return !1;
	}
}
function lr(e) {
	return `${String(e?.source || e?.type || "").trim().toLowerCase()}|${String(e?.root_id || e?.custom_root_id || "").trim().toLowerCase()}|${String(e?.subfolder || "").trim().toLowerCase()}`;
}
function ur(e) {
	let t = $n(e?.filename);
	return t ? `${lr(e)}|${t}` : "";
}
function dr(e, t = er(e?.filename || "")) {
	let n = sr(e, t), r = String(e?.filename || "").trim();
	if (!r) return "";
	let i = lr(e);
	if (n === "model3d") return `${i}|model3d|${r.toLowerCase()}`;
	let a = tr(r);
	return a ? `${i}|media|${a}` : "";
}
function fr(e) {
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
function pr(e, t, n) {
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
function mr(e, t, n, r) {
	let i = n.stemMap.get(t);
	if (!i?.length) return [];
	let a = [];
	for (let e = i.length - 1; e >= 0; e--) r(i[e]) && (a.push(i[e]), i.splice(e, 1));
	return i.length || n.stemMap.delete(t), a;
}
function hr(e, t, n) {
	if (!cr(n)) return {
		hidden: !1,
		hideEnabled: !1,
		removed: []
	};
	let r = fr(t), i = String(e?.filename || ""), a = er(i), o = sr(e, a), s = dr(e, a);
	if (!s) return {
		hidden: !1,
		hideEnabled: !0,
		removed: []
	};
	if (o === "video" || o === "audio" || o === "model3d" || a === "WEBP") return r.nonImageSiblingKeys.add(s), {
		hidden: !1,
		hideEnabled: !0,
		removed: mr(t, s, r, (e) => er(e?.filename || "") === "PNG")
	};
	if (a === "PNG") {
		let t = `${lr(e)}|model3d|${tr(i)}`;
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
function gr(e, t, n, r) {
	let i = cr(r.loadMajoorSettings), a = n.filenameCounts || /* @__PURE__ */ new Map();
	n.filenameCounts = a, r.clearGridMessage(e);
	let o = r.ensureVirtualGrid(e, n);
	if (!o) return 0;
	i || (n.hiddenPngSiblings = 0), n.assetKeyFn = r.assetKey;
	let s = fr(n), c = /* @__PURE__ */ new Map();
	for (let e of n.assets || []) {
		let t = ur(e);
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
				let l = or(ar(s), s), u = s.filter((e) => e !== l);
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
		let t = er(String(e?.filename || "")), i = hr(e, n, r.loadMajoorSettings);
		for (let e of i.removed || []) f.add(e);
		if (i.hidden) {
			n.hiddenPngSiblings += 1;
			continue;
		}
		let a = ur(e);
		if (a) {
			let t = c.get(a);
			t || (t = [], c.set(a, t)), t.push(e);
		}
		let o = r.assetKey(e);
		if (!o || s.seenKeys.has(o) || e.id != null && s.assetIdSet.has(String(e.id))) continue;
		s.seenKeys.add(o), e.id != null && s.assetIdSet.add(String(e.id)), d.push(e);
		let u = dr(e, t);
		if (u) {
			let t = s.stemMap.get(u);
			t || (t = [], s.stemMap.set(u, t)), t.push(e);
		}
		l++;
	}
	if (f.size > 0) {
		n.hiddenPngSiblings += f.size, n.assets = n.assets.filter((e) => !f.has(e));
		for (let e = d.length - 1; e >= 0; e--) f.has(d[e]) && (d.splice(e, 1), l = Math.max(0, l - 1));
		for (let e of f) pr(n, e, s);
		try {
			for (let e of f) {
				let t = ur(e);
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
function _r({ ext: e = "", filename: t = "", count: n = 0, paths: r = [] } = {}) {
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
function vr(e, t, n = !1, r = null) {
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
	}[sr({ kind: t }, a)], s = o ? `var(${o}, #607D8B)` : "#607D8B", c = n ? "var(--mjr-badge-duplicate-alert, #ff1744)" : s;
	i.textContent = a + (n ? "+" : ""), i.title = n ? _r({
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
function yr(e, t, n = null) {
	if (e) try {
		let r = e.dataset?.mjrExt || "", i = e.dataset?.mjrBadgeBg || "var(--mjr-badge-image, #607D8B)";
		e.textContent = String(r || "") + (t ? "+" : ""), e.title = t ? _r({
			ext: r,
			filename: n?.filename || "",
			count: n?.count,
			paths: n?.paths
		}) : `${r} file`, e.style.background = t ? "var(--mjr-badge-duplicate-alert, #ff1744)" : i, e.style.cursor = t ? "pointer" : "default";
	} catch (e) {
		console.debug?.(e);
	}
}
function br(e) {
	return e === !0 ? !0 : e === !1 ? !1 : e === 1 || e === "1" ? !0 : e === 0 || e === "0" ? !1 : null;
}
function xr(e, t = []) {
	if (!e || typeof e != "object") return null;
	for (let n of t) if (e[n] != null) return e[n];
	return null;
}
function Sr(e) {
	return typeof e == "string" && e.trim().length > 0;
}
function Cr(e) {
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
function wr(e) {
	let t = xr(e, [
		"auto_tags",
		"autoTags",
		"ai_auto_tags",
		"aiAutoTags",
		"suggested_tags",
		"suggestedTags"
	]), n = xr(e, [
		"enhanced_caption",
		"enhancedCaption",
		"enhanced_prompt",
		"enhancedPrompt",
		"ai_enhanced_prompt",
		"aiEnhancedPrompt"
	]), r = br(xr(e, [
		"has_ai_auto_tags",
		"hasAiAutoTags",
		"ai_has_auto_tags",
		"aiHasAutoTags"
	])), i = br(xr(e, [
		"has_ai_enhanced_caption",
		"hasAiEnhancedCaption",
		"ai_has_enhanced_caption",
		"aiHasEnhancedCaption"
	])), a = br(xr(e, [
		"has_ai_vector",
		"hasAiVector",
		"has_vector_embedding",
		"hasVectorEmbedding",
		"vector_indexed",
		"vectorIndexed"
	])), o = br(xr(e, [
		"has_ai_info",
		"hasAiInfo",
		"ai_indexed",
		"aiIndexed"
	])), s = r === !0 || r === null && Cr(t), c = i === !0 || i === null && Sr(n), l = a === !0 || o === !0;
	return {
		hasAiInfo: o === !0 || s || c || l,
		hasAutoTags: s,
		hasEnhancedPrompt: c,
		hasVectorIndexed: l
	};
}
function Tr(e) {
	let t = document.createElement("span");
	t.className = "mjr-workflow-dot mjr-asset-status-dot";
	let n = br(e?.has_workflow ?? e?.hasWorkflow), r = br(e?.has_generation_data ?? e?.hasGenerationData), i = Qn(), a = i.queueLength, o = i.active || a > 0, s = "Pending: parsing metadata…", c = n === !0 || r === !0, l = n === !1 || r === !1, u = n === null || r === null;
	n === !0 && r === !0 ? s = "Complete: workflow + generation data detected" : c ? s = n === !0 ? "Partial: workflow only (generation data missing)" : "Partial: generation data only (workflow missing)" : l && !c && !u ? s = "None: no workflow or generation data found" : u && (s = "Pending: metadata not parsed yet");
	let d = u ? "pending" : n === !0 && r === !0 ? "success" : c ? "warning" : "error";
	o && d !== "success" && (d = "pending", s = a > 0 ? `Pending: database metadata enrichment in progress (${a} queued)` : "Pending: database metadata enrichment in progress"), Er(t, d, s, { asset: e });
	let f = wr(e);
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
function Er(e, t, n = "", r = {}) {
	if (!e) return;
	let i = String(t || "").toLowerCase(), a = Gn(i, {
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
function Dr(e) {
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
function Or(e) {
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
function kr(e) {
	let t = Number(e) / 1e3;
	return t >= 60 ? "#FF9800" : t >= 30 ? "#FFC107" : t >= 10 ? "#8BC34A" : "#4CAF50";
}
function Ar(e) {
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
function jr(e, { maxMs: t = 864e5 } = {}) {
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
function Mr(e) {
	let t = document.createElement("div");
	t.className = "mjr-tags-badge";
	let n = Or(e);
	return n.length === 0 ? (t.style.display = "none", t) : (t.textContent = n.join(", "), t.title = `Tags: ${n.join(", ")}`, t.style.cssText = "\n        position: absolute;\n        bottom: 6px;\n        left: 6px;\n        padding: 3px 6px;\n        border-radius: 4px;\n        background: rgba(0,0,0,0.8);\n        color: var(--mjr-tag-color, #90CAF9);\n        font-size: 9px;\n        max-width: 80%;\n        overflow: hidden;\n        text-overflow: ellipsis;\n        white-space: nowrap;\n        pointer-events: none;\n        z-index: 10;\n        box-shadow: 0 2px 4px rgba(0,0,0,0.3);\n    ", t);
}
//#endregion
//#region ui/utils/safeCall.ts
var Nr = () => {};
function Pr(e) {
	try {
		return !!j?.[e];
	} catch {
		return !1;
	}
}
function Fr(e, t) {
	try {
		console.warn(`[Majoor] ${e}`, t);
	} catch (e) {
		console.debug?.(e);
	}
}
function Ir(e, t = "safeCall") {
	try {
		return e?.();
	} catch (e) {
		Pr("DEBUG_SAFE_CALL") && Fr(t, e);
		return;
	}
}
function Lr(e, t, n, r, i = "safeAddListener") {
	try {
		return e?.addEventListener?.(t, n, r), () => {
			try {
				e?.removeEventListener?.(t, n, r);
			} catch (e) {
				Pr("DEBUG_SAFE_LISTENERS") && Fr(`${i}:remove:${String(t || "")}`, e);
			}
		};
	} catch (e) {
		return Pr("DEBUG_SAFE_LISTENERS") && Fr(`${i}:add:${String(t || "")}`, e), Nr;
	}
}
//#endregion
//#region ui/utils/mediaFps.ts
function Rr(e) {
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
function zr(e) {
	try {
		let t = e, n = t.metadata_raw || {}, r = (n.raw_ffprobe || {}).video_stream || {};
		return Rr(t.fps) ?? Rr(n.fps) ?? Rr(n.frame_rate) ?? Rr(r.avg_frame_rate) ?? Rr(r.r_frame_rate);
	} catch {
		return null;
	}
}
function Br(e, t) {
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
function Vr(e) {
	let t = Number(e);
	return !Number.isFinite(t) || t <= 0 ? "" : Math.abs(t - Math.round(t)) < .001 ? `${Math.round(t)} fps` : `${t.toFixed(3).replace(/\.?0+$/, "")} fps`;
}
function Hr(e, t = 30) {
	let n = Rr(e);
	if (n != null) return Math.max(1, Math.round(n * 1e3) / 1e3);
	let r = Rr(t);
	return r == null ? 30 : Math.max(1, Math.round(r * 1e3) / 1e3);
}
//#endregion
//#region ui/vue/majoorPrimeVue.ts
var Ur = {
	Button: Pe,
	Checkbox: Ye,
	InputText: Be,
	Select: qe,
	ToggleButton: Ue,
	Badge: Fe,
	Tag: Me,
	Dialog: Re,
	Menu: Ge,
	Listbox: He,
	Tree: Je,
	VirtualScroller: Ne
};
function Wr(e) {
	return e.use(Le, {
		ripple: !1,
		unstyled: !0,
		zIndex: { overlay: 10100 }
	}), e.use(Ve), e.use(We), Object.entries(Ur).forEach(([t, n]) => {
		e.component(`M${t}`, n);
	}), e;
}
//#endregion
//#region ui/vue/createVueApp.ts
function Gr(e, t = void 0) {
	let n = et(), r = Ie(e, t);
	return r.use(n), Wr(r), {
		app: r,
		pinia: n
	};
}
var Kr = /* @__PURE__ */ new Map();
function qr(e, t, n) {
	try {
		window.dispatchEvent(new CustomEvent("mjr:keepalive-attached", { detail: {
			mountKey: String(e || "_mjrVueApp"),
			host: t || null,
			container: n || null
		} }));
	} catch {}
}
function Jr(e) {
	let t = document.createElement("div");
	return t.dataset.mjrKeepAliveHost = String(e || "_mjrVueApp"), t.style.height = "100%", t.style.width = "100%", t.style.minHeight = "0", t.style.display = "flex", t.style.flexDirection = "column", t.style.overflow = "hidden", t;
}
function Yr(e, t) {
	!e || !t || (e.style.height = "100%", e.style.minHeight = "0", e.style.display = "flex", e.style.flexDirection = "column", e.style.overflow = "hidden", !(e.firstChild === t && e.childNodes.length === 1) && (e.replaceChildren(t), qr(t?.dataset?.mjrKeepAliveHost, t, e)));
}
function Xr(e, t, n = "_mjrVueApp") {
	if (!e) return !1;
	let r = Kr.get(n), i = !1;
	if (!r) {
		let e = Jr(n), { app: a } = Gr(t);
		a.mount(e), r = {
			app: a,
			host: e,
			container: null
		}, Kr.set(n, r), i = !0;
	}
	return Yr(e, r.host), r.container = e, i;
}
function Zr(e, t = "_mjrVueApp") {
	let n = Kr.get(t);
	if (n?.app) {
		try {
			n.app.unmount();
		} catch {}
		try {
			n.host?.remove?.();
		} catch {}
		Kr.delete(t);
	}
}
//#endregion
//#region ui/utils/format.ts
function Qr(e) {
	if (!e) return null;
	let t = Number(e);
	if (!isNaN(t)) return /* @__PURE__ */ new Date(t * 1e3);
	let n = new Date(e);
	return isNaN(n.getTime()) ? null : n;
}
function $r(e) {
	let t = Qr(e);
	return t ? `${t.getDate().toString().padStart(2, "0")}/${(t.getMonth() + 1).toString().padStart(2, "0")}` : "";
}
function ei(e) {
	let t = Qr(e);
	return t ? `${t.getHours().toString().padStart(2, "0")}:${t.getMinutes().toString().padStart(2, "0")}` : "";
}
function ti(e) {
	return e ? e < 60 ? `${Math.round(e)}s` : `${Math.floor(e / 60)}m ${Math.round(e % 60)}s` : "";
}
//#endregion
//#region ui/vue/components/panel/sidebar/SidebarFileInfoSection.vue
var ni = {
	key: 0,
	class: "mjr-sidebar-section",
	style: {
		background: "rgba(255, 255, 255, 0.03)",
		border: "1px solid var(--mjr-border, rgba(255, 255, 255, 0.12))",
		"border-radius": "8px",
		padding: "10px"
	}
}, ri = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "6px"
} }, ii = ["title"], ai = ["title"], oi = {
	__name: "SidebarFileInfoSection",
	props: { asset: {
		type: Object,
		required: !0
	} },
	setup(e) {
		let t = e;
		function n(e) {
			if (!e || e <= 0) return "0 B";
			let t = [
				"B",
				"KB",
				"MB",
				"GB"
			], n = 0, r = e;
			for (; r >= 1024 && n < t.length - 1;) r /= 1024, n += 1;
			return `${r.toFixed(+(n > 0))} ${t[n]}`;
		}
		function r(e) {
			try {
				if (String(e?.kind || "").toLowerCase() === "video") return !0;
				let t = String(e?.filename || e?.filepath || e?.path || "").toLowerCase();
				return /\.(gif|webp|webm)$/.test(t);
			} catch {
				return !1;
			}
		}
		function i(e, t) {
			let n = e?.[t] ?? e?.file_info?.[t];
			return n != null && n !== "" ? n : t === "workflow_id" ? e?.user_metadata?.workflow?.id ?? e?.metadata?.workflow_id ?? "" : "";
		}
		let a = B(() => {
			let e = t.asset || {}, a = [];
			if (e.width && e.height && a.push({
				label: "Dimensions",
				value: `${e.width} × ${e.height}`,
				tooltip: "Image/video resolution in pixels"
			}), e.duration && e.duration > 0 && a.push({
				label: "Duration",
				value: ti(e.duration),
				tooltip: "Video duration"
			}), r(e)) {
				let t = zr(e);
				t != null && a.push({
					label: "FPS",
					value: Vr(t),
					tooltip: "Native frame rate"
				});
				let n = Br(e, t);
				n != null && a.push({
					label: "Length",
					value: `${Math.max(0, Math.floor(n))} frames`,
					tooltip: "Total frame count"
				});
			}
			let o = jr(e.generation_time_ms ?? e.metadata?.generation_time_ms ?? 0);
			o > 0 && a.push({
				label: "Generation Time",
				value: `${(Number(o) / 1e3).toFixed(1)}s`,
				tooltip: "Time taken to generate this asset (workflow execution time)",
				valueStyle: `color: ${kr(o)}; font-weight: 600;`
			});
			let s = e.generation_time || e.file_creation_time || e.mtime || e.created_at;
			if (s) {
				let e = $r(s), t = ei(s);
				e && a.push({
					label: "Date",
					value: e,
					tooltip: "File creation/generation date"
				}), t && a.push({
					label: "Time",
					value: t,
					tooltip: "File creation/generation time"
				});
			}
			e.size && e.size > 0 && a.push({
				label: "File Size",
				value: n(e.size),
				tooltip: "File size on disk"
			}), e.id != null && a.push({
				label: "Asset ID",
				value: String(e.id),
				tooltip: "Internal database asset identifier"
			});
			let c = String(i(e, "job_id") || "").trim();
			c && a.push({
				label: "Job ID",
				value: c,
				tooltip: "Workflow execution job identifier (prompt_id)"
			});
			let l = String(i(e, "source_node_id") || "").trim();
			l && a.push({
				label: "Source Node",
				value: l,
				tooltip: "ComfyUI node id that produced this file"
			});
			let u = String(i(e, "source_node_type") || "").trim();
			u && a.push({
				label: "Node Type",
				value: u,
				tooltip: "ComfyUI node class that produced this file"
			});
			let d = String(i(e, "workflow_id") || "").trim();
			return d && a.push({
				label: "Workflow ID",
				value: d,
				tooltip: "ComfyUI workflow identifier (from workflow.id in extra_data)"
			}), a;
		});
		return (e, t) => a.value.length ? (M(), F("div", ni, [t[0] ||= P("div", { style: {
			"font-size": "12px",
			"font-weight": "700",
			color: "#607d8b",
			"margin-bottom": "8px",
			"text-transform": "uppercase",
			"letter-spacing": "0.4px"
		} }, " File Info ", -1), P("div", ri, [(M(!0), F(V, null, N(a.value, (e) => (M(), F("div", {
			key: e.label,
			style: {
				display: "flex",
				gap: "10px",
				"align-items": "flex-start",
				"justify-content": "space-between"
			}
		}, [P("div", {
			title: e.tooltip || "",
			style: {
				"font-size": "12px",
				opacity: "0.68",
				"min-width": "92px"
			}
		}, R(e.label), 9, ii), P("div", {
			style: L(e.valueStyle || "font-size: 12px; text-align: right; word-break: break-word"),
			title: String(e.value || "")
		}, R(e.value), 13, ai)]))), 128))])])) : z("", !0);
	}
}, si = new Set([
	"png",
	"jpg",
	"jpeg",
	"webp",
	"gif",
	"bmp",
	"tiff",
	"tif",
	"avif",
	"heic",
	"heif",
	"apng",
	"hdr",
	"svg"
]);
function ci(e) {
	let t = String(e?.filename || e?.name || e?.filepath || e?.path || "").trim().toLowerCase();
	return !t || !t.includes(".") ? "" : t.split(".").pop() || "";
}
function li(e) {
	return String(e?.kind || "").trim().toLowerCase() === "image" || String(e?.mime || e?.mimetype || "").trim().toLowerCase().startsWith("image/") ? !0 : si.has(ci(e));
}
function ui(e) {
	let t = ci(e);
	return t === "jpg" || t === "jpeg";
}
function di() {
	try {
		return !!(K()?.ai?.vectorSearchEnabled ?? !0);
	} catch {
		return !0;
	}
}
function fi(e) {
	return e >= .75 ? "#4CAF50" : e >= .5 ? "#8BC34A" : e >= .3 ? "#FF9800" : "#F44336";
}
function pi(e) {
	return e >= .85 ? "Excellent" : e >= .7 ? "Good" : e >= .5 ? "Fair" : e >= .3 ? "Low" : "Very Low";
}
function mi(e) {
	let t = String(e || "").trim();
	if (!t) return "";
	let n = [];
	for (let e of t.replace(/\r\n/g, "\n").split("\n")) {
		let t = String(e || "").trim();
		t && (/^title\s*:/i.test(t) || (/^caption\s*:/i.test(t) && (t = t.replace(/^caption\s*:/i, "").trim()), t && n.push(t)));
	}
	return (n.length ? n.join(" ") : t).replace(/\s+/g, " ").replace(/:{2,}\s*$/, "").trim();
}
function hi(e) {
	let t = String(e?.filename || "").trim();
	if (!t) return [];
	let n = String(e?.subfolder || "").trim(), r = String(e?.folder_type || "input").trim().toLowerCase(), i = [], a = (e) => {
		if (!e) return;
		let r = Se(t, n, e);
		r && !i.includes(r) && i.push(r);
	};
	return (r === "input" || r === "output") && a(r), a("input"), a("output"), i;
}
function gi(e) {
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
function Z(e) {
	return e == null || e === "" ? "-" : String(e);
}
function _i(e, t) {
	let n = String(e?.pass_name || "").trim();
	if (n) return n;
	let r = Number(e?.denoise);
	return t === 0 || r === 1 ? "Base" : Number.isFinite(r) && r < 1 ? "Refine / Upscale" : `Pass ${t + 1}`;
}
function vi(e) {
	return e?.geninfo && typeof e.geninfo == "object" ? { geninfo: e.geninfo } : e?.metadata && (typeof e.metadata == "object" || typeof e.metadata == "string") ? e.metadata : e?.prompt && (typeof e.prompt == "object" || typeof e.prompt == "string") ? e.prompt : e?.metadata_raw ? e.metadata_raw : e?.exif ? e.exif : null;
}
function yi(e) {
	try {
		if (!e || typeof e != "object") return !1;
		if (e.is_override || typeof e.workflow_notes == "string" && e.workflow_notes.trim() || typeof e.notes == "string" && e.notes.trim() || Array.isArray(e.custom_info) && e.custom_info.length > 0 || e.engine && typeof e.engine == "object" && e.engine.type || it(e.prompt) || typeof (e.negative_prompt || e.negativePrompt) == "string" && it(e.negative_prompt || e.negativePrompt) || e.models || e.model || e.checkpoint || e.loras || e.sampler || e.sampler_name || e.steps || e.cfg || e.cfg_scale || e.cfg_high_noise || e.cfg_low_noise || e.scheduler || Array.isArray(e.chained_passes) && e.chained_passes.length > 0 || Array.isArray(e.all_samplers) && e.all_samplers.length > 0 || e.seed || e.denoise || e.denoising || e.clip_skip || e.voice || e.language || e.temperature || e.top_k || e.top_p || e.repetition_penalty || e.max_new_tokens || e.device || e.voice_preset || e.instruct || e.dtype || e.attn_implementation || e.enable_chunking !== void 0 || e.max_chars_per_chunk || e.chunk_combination_method || e.silence_between_chunks_ms || e.enable_audio_cache !== void 0 || e.batch_size !== void 0 || e.use_torch_compile !== void 0 || e.use_cuda_graphs !== void 0 || e.compile_mode || typeof e.lyrics == "string" && e.lyrics.trim()) return !0;
	} catch {
		return !1;
	}
	return !1;
}
function Q(e) {
	return e ? typeof e == "string" ? at(e) : typeof e == "object" ? at(e.name || e.value || "") : "" : "";
}
function bi(e, t, n, r) {
	let i = String(r || "").trim();
	if (!i) return;
	let a = `${n}::${i}`;
	t.has(a) || (t.add(a), e.push({
		label: n,
		value: i
	}));
}
function xi(e) {
	let t = `${String(e?.source || "").toLowerCase()} ${String(e?.name || e?.lora_name || "").toLowerCase()}`;
	return t.includes("high_noise") || t.includes("high noise") ? "high_noise" : t.includes("low_noise") || t.includes("low noise") ? "low_noise" : "";
}
function Si(e) {
	let t = [], n = Array.isArray(e.model_groups) ? e.model_groups : [];
	if (n.length) return n.forEach((e) => {
		if (!e || typeof e != "object") return;
		let n = Q(e.model), r = Array.isArray(e.loras) ? e.loras.map((e) => rt(e)).filter(Boolean) : [];
		!n && !r.length || t.push({
			key: String(e.key || "").trim() || `group-${t.length + 1}`,
			label: String(e.label || "").trim() || `Group ${t.length + 1}`,
			model: n,
			loras: r
		});
	}), t;
	let r = e.models && typeof e.models == "object" ? e.models : null, i = Array.isArray(e.loras) ? e.loras : [];
	return r && [{
		key: "high_noise",
		label: "High Noise",
		model: Q(r.unet_high_noise)
	}, {
		key: "low_noise",
		label: "Low Noise",
		model: Q(r.unet_low_noise)
	}].forEach((e) => {
		let n = i.filter((t) => xi(t) === e.key).map((e) => rt(e)).filter(Boolean);
		!e.model && !n.length || t.push({
			...e,
			loras: n
		});
	}), t;
}
function Ci(e, t) {
	return t == null ? null : {
		label: e,
		value: t ? "on" : "off"
	};
}
function wi(e) {
	return e != null && String(e).trim() !== "";
}
function Ti(e) {
	return new Set(Array.isArray(e.override_fields) ? e.override_fields.map((e) => String(e || "").trim()).filter(Boolean) : []);
}
function $(e, ...t) {
	return t.some((t) => e.has(t));
}
function Ei(e) {
	return Array.isArray(e) ? e.filter((e) => e && typeof e == "object").map((e, t) => ({
		title: String(e.title || `Custom Info ${t + 1}`).trim(),
		content: String(e.content ?? e.value ?? "").trim(),
		color: /^#[0-9a-fA-F]{6}$/.test(String(e.color || "").trim()) ? String(e.color).trim() : "#2196F3"
	})).filter((e) => e.content) : [];
}
function Di(e) {
	let t = nt(vi(e)), n = {
		kind: "empty",
		title: "Generation",
		workflowType: "",
		workflowLabel: "",
		workflowBadge: "",
		isTruncated: !1,
		positivePrompt: "",
		negativePrompt: "",
		positivePromptOverride: !1,
		negativePromptOverride: !1,
		promptTabs: [],
		mediaOnlyMessage: "",
		showAlignment: !1,
		captionLabel: "Image Description",
		emptyCaptionText: "No image description yet.",
		isImageAsset: li(e),
		lyrics: "",
		modelFields: [],
		modelGroups: [],
		pipelineTabs: [],
		samplingFields: [],
		ttsFields: [],
		ttsEngineFields: [],
		ttsInstruction: "",
		ttsRuntimeFields: [],
		audioFields: [],
		seed: null,
		imageFields: [],
		inputFiles: [],
		isOverride: !1,
		overrideLabel: "",
		notesFields: [],
		customInfoBlocks: []
	};
	if (!t || typeof t == "object" && Object.keys(t).length === 0 || !yi(t)) {
		let t = e?.metadata_raw?.geninfo_status || e?.geninfo_status;
		return t && typeof t == "object" && t.kind === "media_pipeline" ? {
			...n,
			kind: "media-only",
			mediaOnlyMessage: "This file looks like a media-only pipeline (e.g. LoadVideo/VideoCombine) and does not contain generation parameters."
		} : li(e) || ui(e) ? {
			...n,
			kind: "caption-only",
			showAlignment: !1
		} : n;
	}
	let r = t, i = Ti(r), a = r.engine && typeof r.engine == "object" ? r.engine : null, o = !!(r.is_override || a?.mode === "override" || a?.parser_version === "geninfo-override-v1" || a?.source === "majoor_geninfo"), s = ot(r), c = tt(typeof r.prompt == "string" ? r.prompt : null, typeof (r.negative_prompt || r.negativePrompt) == "string" ? r.negative_prompt || r.negativePrompt : null), l = Array.isArray(r.all_positive_prompts) && r.all_positive_prompts.length > 1 ? r.all_positive_prompts.map((e, t) => {
		let n = tt(typeof e == "string" ? e : "", typeof r.all_negative_prompts?.[t] == "string" ? r.all_negative_prompts[t] : "");
		return {
			label: `Prompt ${t + 1}`,
			positive: it(n.positive),
			negative: it(n.negative)
		};
	}).filter((e) => e.positive) : [], u = [], d = /* @__PURE__ */ new Set(), f = r.models && typeof r.models == "object" ? r.models : null, p = Si(r), m = new Set(p.map((e) => String(e.model || "").trim()).filter(Boolean)), h = Array.isArray(r.all_checkpoints) && r.all_checkpoints.length > 1 ? r.all_checkpoints : null;
	if (f) {
		let e = new Set([
			Q(f.unet_high_noise),
			Q(f.unet_low_noise),
			...m
		].filter(Boolean));
		if (h) h.forEach((e, t) => {
			let n = Q(e);
			bi(u, d, `Checkpoint ${t + 1}`, n);
		});
		else {
			let t = Q(f.checkpoint);
			t && !e.has(t) && bi(u, d, "Checkpoint", t);
		}
		[
			["UNet", Q(f.unet)],
			["Diffusion", Q(f.diffusion)],
			["Upscaler", Q(f.upscaler)],
			["CLIP", Q(f.clip)],
			["VAE", Q(f.vae)]
		].forEach(([t, n]) => {
			e.has(n) || bi(u, d, t, n);
		});
	} else (r.model || r.checkpoint) && bi(u, d, "Model", at(r.model || r.checkpoint));
	if (Array.isArray(r.loras) && r.loras.length > 0) {
		let e = r.loras.map((e) => rt(e)).filter(Boolean).join("\n");
		e && bi(u, d, r.loras.length > 1 ? "LoRAs" : "LoRA", e);
	}
	!f && r.clip && bi(u, d, "CLIP", at(r.clip)), !f && r.vae && bi(u, d, "VAE", at(r.vae)), !f && r.unet && bi(u, d, "UNet", at(r.unet)), !f && r.diffusion && bi(u, d, "Diffusion", at(r.diffusion)), f && r.clip && bi(u, d, "CLIP", at(r.clip)), f && r.vae && bi(u, d, "VAE", at(r.vae));
	for (let e of u) {
		let t = String(e.label || "").toLowerCase();
		(t.includes("checkpoint") || t === "model") && (e.override = $(i, "checkpoint", "model")), t === "clip" && (e.override = $(i, "clip")), t === "vae" && (e.override = $(i, "vae")), t.includes("lora") && (e.override = $(i, "loras"));
	}
	let g = [];
	wi(r.seed) && g.push({
		label: "Seed",
		value: r.seed,
		override: $(i, "seed")
	}), (r.sampler || r.sampler_name) && g.push({
		label: "Sampler",
		value: r.sampler || r.sampler_name,
		override: $(i, "sampler", "sampler_name")
	}), wi(r.steps) && g.push({
		label: "Steps",
		value: r.steps,
		override: $(i, "steps")
	});
	let _ = wi(r.cfg) ? r.cfg : r.cfg_scale;
	wi(_) && g.push({
		label: "CFG Scale",
		value: _,
		override: $(i, "cfg", "cfg_scale")
	}), r.cfg_high_noise !== void 0 && r.cfg_high_noise !== null && g.push({
		label: "CFG High Noise",
		value: r.cfg_high_noise
	}), r.cfg_low_noise !== void 0 && r.cfg_low_noise !== null && g.push({
		label: "CFG Low Noise",
		value: r.cfg_low_noise
	}), r.scheduler && g.push({
		label: "Scheduler",
		value: r.scheduler,
		override: $(i, "scheduler")
	});
	let v = wi(r.denoise) ? r.denoise : r.denoising;
	wi(v) && g.push({
		label: "Denoise",
		value: v,
		override: $(i, "denoise", "denoising")
	});
	let y = [];
	Array.isArray(r.chained_passes) && r.chained_passes.length > 1 ? y = r.chained_passes.filter((e) => e && typeof e == "object").map((e, t) => ({
		label: _i(e, t),
		fields: [
			{
				label: "Sampler",
				value: Z(e?.sampler_name || e?.sampler)
			},
			{
				label: "Scheduler",
				value: Z(e?.scheduler)
			},
			{
				label: "Steps",
				value: Z(e?.steps)
			},
			{
				label: "CFG",
				value: Z(e?.cfg)
			},
			{
				label: "Denoise",
				value: Z(e?.denoise)
			},
			{
				label: "Seed",
				value: Z(e?.seed_val || e?.seed)
			}
		]
	})) : Array.isArray(r.all_samplers) && r.all_samplers.length > 1 && (y = r.all_samplers.filter((e) => e && typeof e == "object").map((e, t) => ({
		label: _i(e, t),
		fields: [
			{
				label: "Sampler",
				value: Z(e?.sampler_name || e?.sampler)
			},
			{
				label: "Scheduler",
				value: Z(e?.scheduler)
			},
			{
				label: "Steps",
				value: Z(e?.steps)
			},
			{
				label: "CFG",
				value: Z(e?.cfg)
			},
			{
				label: "Denoise",
				value: Z(e?.denoise)
			},
			{
				label: "Seed",
				value: Z(e?.seed_val || e?.seed)
			}
		]
	})));
	let b = [];
	r.voice && b.push({
		label: "Narrator Voice",
		value: r.voice
	}), r.language && b.push({
		label: "Language",
		value: r.language
	}), r.top_k !== void 0 && r.top_k !== null && b.push({
		label: "Top-k",
		value: r.top_k
	}), r.top_p !== void 0 && r.top_p !== null && b.push({
		label: "Top-p",
		value: r.top_p
	}), r.temperature !== void 0 && r.temperature !== null && b.push({
		label: "Temperature",
		value: r.temperature
	}), r.repetition_penalty !== void 0 && r.repetition_penalty !== null && b.push({
		label: "Repetition Penalty",
		value: r.repetition_penalty
	}), r.max_new_tokens !== void 0 && r.max_new_tokens !== null && b.push({
		label: "Max New Tokens",
		value: r.max_new_tokens
	});
	let x = [];
	r.device && x.push({
		label: "Device",
		value: r.device
	}), r.voice_preset && x.push({
		label: "Voice Preset",
		value: r.voice_preset
	}), r.dtype && x.push({
		label: "Dtype",
		value: r.dtype
	}), r.attn_implementation && x.push({
		label: "Attention",
		value: r.attn_implementation
	}), r.compile_mode && x.push({
		label: "Compile Mode",
		value: r.compile_mode
	}), [
		Ci("Torch Compile", r.use_torch_compile),
		Ci("CUDA Graphs", r.use_cuda_graphs),
		Ci("X-Vector Only", r.x_vector_only_mode)
	].filter(Boolean).forEach((e) => x.push(e));
	let S = [];
	[
		Ci("Chunking", r.enable_chunking),
		r.max_chars_per_chunk !== void 0 && r.max_chars_per_chunk !== null ? {
			label: "Max Chars/Chunk",
			value: r.max_chars_per_chunk
		} : null,
		r.chunk_combination_method ? {
			label: "Chunk Method",
			value: r.chunk_combination_method
		} : null,
		r.silence_between_chunks_ms !== void 0 && r.silence_between_chunks_ms !== null ? {
			label: "Silence Between Chunks (ms)",
			value: r.silence_between_chunks_ms
		} : null,
		Ci("Audio Cache", r.enable_audio_cache),
		r.batch_size !== void 0 && r.batch_size !== null ? {
			label: "Batch Size",
			value: r.batch_size
		} : null
	].filter(Boolean).forEach((e) => S.push(e));
	let C = [];
	r.lyrics_strength !== void 0 && r.lyrics_strength !== null && C.push({
		label: "Lyrics Strength",
		value: r.lyrics_strength
	});
	let w = [];
	wi(v) && !g.some((e) => e.label === "Denoise") && w.push({
		label: "Denoise",
		value: v
	}), wi(r.clip_skip) && w.push({
		label: "Clip Skip",
		value: r.clip_skip
	});
	let T = [], E = String(r.workflow_notes || r.notes || "").trim();
	E && T.push({
		label: "Workflow Notes",
		value: E,
		override: $(i, "workflow_notes", "notes")
	});
	let ee = Ei(r.custom_info), te = Array.isArray(r.inputs) ? r.inputs.filter((e) => e && typeof e == "object" && e.filename).map((e, t) => ({
		id: `${e.filename}-${t}`,
		filename: String(e.filename || "").trim(),
		filepath: String(e.filepath || e.filename || "").trim(),
		role: String(e.role || "").trim(),
		roleLabel: String(e.role || "").trim().replace(/_/g, " "),
		isVideo: String(e.type || "").toLowerCase() === "video" || /\.(mp4|mov|webm)$/i.test(String(e.filename || "")),
		previewCandidates: hi(e)
	})) : [];
	return {
		...n,
		kind: "full",
		metadata: r,
		workflowType: s.workflowType,
		workflowLabel: s.workflowLabel,
		workflowBadge: s.workflowBadge,
		isTruncated: !!(e?.geninfo?._truncated || e?.metadata?._truncated || e?.prompt?._truncated),
		positivePrompt: l.length ? "" : String(c.positive || "").trim(),
		negativePrompt: l.length ? "" : String(c.negative || "").trim(),
		positivePromptOverride: $(i, "prompt", "positive", "positive_prompt"),
		negativePromptOverride: $(i, "negative_prompt", "negative", "negativePrompt"),
		promptTabs: l,
		showAlignment: !!e?.id && (!!String(c.positive || "").trim() || l.length > 0),
		isImageAsset: li(e),
		lyrics: String(r.lyrics || "").trim(),
		modelFields: u,
		modelGroups: p,
		pipelineTabs: y,
		samplingFields: g,
		ttsFields: b,
		ttsEngineFields: x,
		ttsInstruction: String(r.instruct || "").trim(),
		ttsRuntimeFields: S,
		audioFields: C,
		seed: r.seed ?? null,
		imageFields: w,
		inputFiles: te,
		isOverride: o,
		overrideLabel: o ? "Gen Info Override" : "",
		notesFields: T,
		customInfoBlocks: ee
	};
}
//#endregion
//#region ui/vue/components/panel/sidebar/GenerationInputThumb.vue
var Oi = ["title"], ki = ["src"], Ai = ["src"], ji = {
	key: 2,
	style: {
		position: "absolute",
		bottom: "0",
		left: "0",
		right: "0",
		background: "rgba(0,0,0,0.7)",
		color: "white",
		"font-size": "8px",
		padding: "2px",
		"text-align": "center",
		"white-space": "nowrap",
		overflow: "hidden",
		"text-overflow": "ellipsis"
	}
}, Mi = {
	key: 3,
	title: "Video file",
	style: {
		position: "absolute",
		color: "white",
		opacity: "0.7",
		"font-size": "16px",
		"pointer-events": "none"
	}
}, Ni = {
	__name: "GenerationInputThumb",
	props: { inputFile: {
		type: Object,
		required: !0
	} },
	setup(e) {
		let t = e, n = I(0), r = I(!1);
		function i() {
			return (Array.isArray(t.inputFile?.previewCandidates) ? t.inputFile.previewCandidates : [])[n.value] || "";
		}
		function a() {
			let e = Array.isArray(t.inputFile?.previewCandidates) ? t.inputFile.previewCandidates : [];
			n.value < e.length - 1 && (n.value += 1);
		}
		async function o(e) {
			e?.stopPropagation?.();
			let n = String(t.inputFile?.filepath || t.inputFile?.filename || "").trim();
			if (n) try {
				await navigator.clipboard.writeText(n), r.value = !0, setTimeout(() => {
					r.value = !1;
				}, 350);
			} catch (e) {
				console.debug?.(e);
			}
		}
		function s(e) {
			e?.stopPropagation?.();
			let t = i();
			if (gi(t)) try {
				window.open(t, "_blank", "noopener,noreferrer");
			} catch (e) {
				console.debug?.(e);
			}
		}
		function c(e) {
			e.target?.play?.().catch?.(() => {});
		}
		function l(e) {
			try {
				e.target?.pause?.();
			} catch (e) {
				console.debug?.(e);
			}
		}
		return (t, n) => (M(), F("div", {
			title: `${e.inputFile.filename} (click to copy, double-click to open in new tab)`,
			style: L({
				width: "64px",
				height: "64px",
				background: "#222",
				borderRadius: "4px",
				overflow: "hidden",
				position: "relative",
				cursor: "pointer",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				outline: r.value ? "2px solid rgba(76, 175, 80, 0.9)" : "",
				outlineOffset: r.value ? "1px" : ""
			}),
			onClick: o,
			onDblclick: s
		}, [e.inputFile.isVideo ? (M(), F("video", {
			key: 0,
			src: i(),
			muted: "",
			loop: "",
			playsinline: "",
			preload: "metadata",
			style: {
				width: "100%",
				height: "100%",
				"object-fit": "cover"
			},
			onError: a,
			onMouseover: c,
			onMouseout: l
		}, null, 40, ki)) : (M(), F("img", {
			key: 1,
			src: i(),
			style: {
				width: "100%",
				height: "100%",
				"object-fit": "cover"
			},
			onError: a
		}, null, 40, Ai)), e.inputFile.role && e.inputFile.role !== "secondary" ? (M(), F("div", ji, R(e.inputFile.roleLabel), 1)) : e.inputFile.isVideo ? (M(), F("div", Mi, " ▶ ")) : z("", !0)], 44, Oi));
	}
}, Pi = {
	key: 0,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "12px"
	}
}, Fi = {
	key: 0,
	style: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		padding: "10px 12px",
		background: "linear-gradient(135deg, rgba(33, 150, 243, 0.18) 0%, rgba(0, 188, 212, 0.10) 100%)",
		borderLeft: "3px solid #2196F3",
		border: "1px solid rgba(33, 150, 243, 0.45)",
		boxShadow: "0 0 0 1px rgba(33, 150, 243, 0.15) inset",
		borderRadius: "6px",
		fontSize: "11px",
		color: "var(--fg-color, #ccc)"
	}
}, Ii = { style: {
	display: "flex",
	"align-items": "center",
	gap: "8px",
	"flex-wrap": "wrap",
	"justify-content": "flex-end"
} }, Li = ["title"], Ri = ["title"], zi = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px"
} }, Bi = { style: {
	"font-size": "11px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"font-weight": "600"
} }, Vi = { style: {
	"font-size": "12px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"line-height": "1.5",
	"white-space": "pre-wrap",
	"word-break": "break-word"
} }, Hi = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#4CAF50",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, Ui = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "6px",
	"margin-bottom": "10px"
} }, Wi = ["onClick"], Gi = ["onClick"], Ki = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#4CAF50",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, qi = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#F44336",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, Ji = { style: {
	display: "flex",
	"align-items": "center",
	gap: "10px"
} }, Yi = { style: {
	flex: "1",
	height: "8px",
	background: "rgba(255,255,255,0.1)",
	"border-radius": "4px",
	overflow: "hidden"
} }, Xi = {
	key: 0,
	style: {
		"font-size": "10px",
		color: "rgba(255,255,255,0.65)",
		border: "1px dashed rgba(255,255,255,0.25)",
		"border-radius": "4px",
		padding: "6px 8px",
		background: "rgba(255,255,255,0.04)"
	}
}, Zi = { style: {
	"font-size": "10px",
	"font-weight": "600",
	color: "rgba(0, 188, 212, 0.75)",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-top": "8px",
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "8px"
} }, Qi = { title: "AI caption generated by Florence-2" }, $i = { style: {
	display: "flex",
	"align-items": "center",
	gap: "6px"
} }, ea = ["title"], ta = { style: {
	"font-size": "12px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"line-height": "1.5",
	"white-space": "pre-wrap",
	"word-break": "break-word"
} }, na = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "6px",
	"margin-bottom": "10px"
} }, ra = { style: {
	"font-size": "10px",
	"font-weight": "600",
	color: "rgba(255,255,255,0.6)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, ia = ["onClick"], aa = { style: {
	display: "grid",
	"grid-template-columns": "repeat(auto-fit, minmax(220px, 1fr))",
	gap: "10px"
} }, oa = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px"
} }, sa = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "4px"
} }, ca = ["onClick"], la = {
	key: 0,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "6px"
	}
}, ua = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "5px"
} }, da = ["onClick"], fa = { style: {
	display: "grid",
	"grid-template-columns": "auto 1fr",
	gap: "8px 12px",
	"align-items": "start"
} }, pa = ["title"], ma = ["title", "onClick"], ha = ["title", "onClick"], ga = ["title", "onClick"], _a = ["title"], va = ["title"], ya = { style: {
	display: "flex",
	gap: "8px",
	"flex-wrap": "wrap"
} }, ba = {
	__name: "SidebarGenerationSection",
	props: { asset: {
		type: Object,
		required: !0
	} },
	setup(e) {
		let t = e, n = I(0), r = I(0), i = I(""), a = I("Copy"), o = I("Generate"), s = I(!1), c = I(u()), l = 0;
		function u() {
			return {
				scoreText: "...",
				scoreColor: "#888",
				qualityText: "Loading",
				qualityColor: "#888",
				qualityBackground: "rgba(127,127,127,0.3)",
				fillWidth: "0%",
				fillColor: "#666",
				aiStatusVisible: !1,
				aiStatusText: "AI features are disabled (enable vector search env var)."
			};
		}
		function d(e, t) {
			let n = String(e || "").trim().replace(/^#/, "");
			return /^[0-9a-fA-F]{6}$/.test(n) ? `rgba(${Number.parseInt(n.slice(0, 2), 16)}, ${Number.parseInt(n.slice(2, 4), 16)}, ${Number.parseInt(n.slice(4, 6), 16)}, ${t})` : `rgba(255,255,255,${t})`;
		}
		function f(e, { emphasis: t = !1, startAlpha: n = .16, endAlpha: r = .08 } = {}) {
			return {
				background: t ? `linear-gradient(135deg, ${d(e, n)} 0%, ${d(e, r)} 100%)` : "var(--comfy-menu-bg, rgba(0,0,0,0.3))",
				borderLeft: `3px solid ${e}`,
				border: t ? `1px solid ${d(e, .45)}` : "1px solid var(--border-color, rgba(255,255,255,0.12))",
				boxShadow: t ? `0 0 0 1px ${d(e, .15)} inset` : "none",
				borderRadius: "6px",
				padding: "12px"
			};
		}
		function p() {
			return {
				background: "linear-gradient(135deg, rgba(233, 30, 99, 0.15) 0%, rgba(156, 39, 176, 0.15) 100%)",
				border: "2px solid #E91E63",
				borderRadius: "8px",
				padding: "12px 16px",
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				gap: "12px"
			};
		}
		function m() {
			return {
				display: "inline-flex",
				alignItems: "center",
				borderRadius: "999px",
				border: "1px solid rgba(0, 188, 212, 0.55)",
				background: "rgba(0, 188, 212, 0.16)",
				color: "#4DD0E1",
				fontSize: "9px",
				fontWeight: "700",
				lineHeight: "1",
				padding: "2px 6px",
				letterSpacing: "0.2px",
				textTransform: "uppercase",
				whiteSpace: "nowrap"
			};
		}
		let h = B(() => Di(t.asset)), g = B(() => di()), _ = B(() => h.value.kind === "full" || h.value.kind === "caption-only"), v = B(() => mi(i.value) || h.value.emptyCaptionText), y = B(() => g.value && h.value.isImageAsset && !!t.asset?.id), b = B(() => g.value && !!mi(v.value) && v.value !== h.value.emptyCaptionText), x = B(() => {
			let e = [];
			return h.value.modelFields.length && e.push({
				key: "model",
				title: "Model & LoRA",
				accent: "#9C27B0",
				emphasis: !0,
				fields: h.value.modelFields
			}), !h.value.pipelineTabs.length && h.value.samplingFields.length && e.push({
				key: "sampling",
				title: "Sampling",
				accent: "#FF9800",
				emphasis: !0,
				fields: h.value.samplingFields
			}), (h.value.ttsFields.length || h.value.workflowType.toLowerCase() === "tts") && e.push({
				key: "tts",
				title: "TTS",
				accent: "#26A69A",
				emphasis: !0,
				fields: h.value.ttsFields
			}), h.value.ttsEngineFields.length && e.push({
				key: "tts-engine",
				title: "TTS Engine",
				accent: "#00897B",
				emphasis: !1,
				fields: h.value.ttsEngineFields
			}), h.value.ttsRuntimeFields.length && e.push({
				key: "tts-runtime",
				title: "TTS Runtime",
				accent: "#00796B",
				emphasis: !1,
				fields: h.value.ttsRuntimeFields
			}), h.value.audioFields.length && e.push({
				key: "audio",
				title: "Audio",
				accent: "#00BCD4",
				emphasis: !1,
				fields: h.value.audioFields
			}), h.value.imageFields.length && e.push({
				key: "image",
				title: "Image",
				accent: "#2196F3",
				emphasis: !1,
				fields: h.value.imageFields
			}), e;
		});
		function S(e, t, n = 450) {
			if (!e) return;
			let r = e.style.background;
			e.style.background = t, setTimeout(() => {
				e.style.background = r || "";
			}, n);
		}
		function C(e, t = !0) {
			return {
				background: t ? `linear-gradient(135deg, ${d(e, .16)} 0%, ${d(e, .08)} 100%)` : "var(--comfy-menu-bg, rgba(0,0,0,0.3))",
				border: `1px solid ${d(e, .42)}`,
				boxShadow: `0 0 0 1px ${d(e, .14)} inset`,
				borderRadius: "8px",
				padding: "12px",
				display: "flex",
				flexDirection: "column",
				gap: "10px"
			};
		}
		function w(e) {
			return e === "high_noise" ? "#FF7043" : e === "low_noise" ? "#29B6F6" : "#AB47BC";
		}
		async function T(e, t = null, n = "rgba(76, 175, 80, 0.35)") {
			let r = String(e ?? "").trim();
			if (!(!r || r === "-")) try {
				await navigator.clipboard.writeText(r), S(t, n);
			} catch (e) {
				console.debug?.(e);
			}
		}
		function E() {
			c.value = {
				scoreText: "AI OFF",
				scoreColor: "#9E9E9E",
				qualityText: "Disabled",
				qualityColor: "#BDBDBD",
				qualityBackground: "rgba(158,158,158,0.25)",
				fillWidth: "0%",
				fillColor: "#777",
				aiStatusVisible: !0,
				aiStatusText: "AI features are disabled in settings."
			};
		}
		function ee() {
			c.value = u();
		}
		async function te() {
			l += 1;
			let e = l;
			if (!h.value.showAlignment || !t.asset?.id) {
				ee();
				return;
			}
			if (!g.value) {
				E();
				return;
			}
			ee();
			try {
				let n = await re(t.asset.id);
				if (e !== l) return;
				if (!n?.ok && (String(n?.code || "").toUpperCase() === "SERVICE_UNAVAILABLE" || /vector search is not enabled/i.test(String(n?.error || "")))) {
					E();
					return;
				}
				let r = n?.ok && n.data != null ? Number(n.data) : null;
				if (!Number.isFinite(r)) {
					c.value = {
						scoreText: "N/A",
						scoreColor: "#888",
						qualityText: "N/A",
						qualityColor: "#888",
						qualityBackground: "rgba(127,127,127,0.3)",
						fillWidth: "0%",
						fillColor: "#666",
						aiStatusVisible: !1,
						aiStatusText: ""
					};
					return;
				}
				let i = Math.round(r * 100), a = fi(r);
				c.value = {
					scoreText: `${i}%`,
					scoreColor: a,
					qualityText: pi(r),
					qualityColor: a,
					qualityBackground: `${a}33`,
					fillWidth: `${i}%`,
					fillColor: a,
					aiStatusVisible: !1,
					aiStatusText: ""
				};
			} catch (t) {
				if (console.debug?.(t), e !== l) return;
				c.value = {
					scoreText: "-",
					scoreColor: "#888",
					qualityText: "Unavailable",
					qualityColor: "#888",
					qualityBackground: "rgba(127,127,127,0.3)",
					fillWidth: "0%",
					fillColor: "#666",
					aiStatusVisible: !1,
					aiStatusText: ""
				};
			}
		}
		async function ne() {
			if (!(!y.value || s.value)) {
				s.value = !0, o.value = "Generating...";
				try {
					let e = await be(t.asset.id);
					e?.ok && (i.value = String(e?.data || "").trim());
				} catch (e) {
					console.debug?.(e);
				} finally {
					s.value = !1, o.value = "Generate";
				}
			}
		}
		async function ie() {
			if (b.value) try {
				await navigator.clipboard.writeText(v.value), a.value = "Copied!", setTimeout(() => {
					a.value = "Copy";
				}, 900);
			} catch (e) {
				console.debug?.(e);
			}
		}
		return Ce(() => t.asset, () => {
			n.value = 0, r.value = 0, i.value = String(t.asset?.enhanced_caption || "").trim(), a.value = "Copy", o.value = "Generate";
		}, { immediate: !0 }), Ce(() => [
			t.asset?.id,
			h.value.kind,
			h.value.showAlignment,
			g.value
		], () => {
			te();
		}, { immediate: !0 }), (e, t) => {
			let i = Ze("MButton");
			return h.value.kind === "empty" ? z("", !0) : (M(), F("div", Pi, [
				h.value.workflowType ? (M(), F("div", Fi, [t[4] ||= P("span", { style: { opacity: "0.85" } }, "Workflow", -1), P("div", Ii, [P("span", {
					title: `Workflow engine: ${h.value.workflowType}`,
					style: {
						background: "#2196F3",
						color: "white",
						padding: "2px 8px",
						"border-radius": "999px",
						"font-weight": "bold",
						"font-size": "10px",
						"letter-spacing": "0.2px"
					}
				}, R(h.value.workflowLabel || h.value.workflowType), 9, Li), h.value.workflowBadge ? (M(), F("span", {
					key: 0,
					title: `API provider: ${h.value.workflowBadge}`,
					style: {
						background: "rgba(255,255,255,0.08)",
						color: "var(--fg-color, #eee)",
						padding: "2px 8px",
						"border-radius": "999px",
						border: "1px solid rgba(255,255,255,0.14)",
						"font-weight": "600",
						"font-size": "10px",
						"letter-spacing": "0.2px"
					}
				}, R(h.value.workflowBadge), 9, Ri)) : z("", !0)])])) : z("", !0),
				h.value.isOverride ? (M(), F("div", {
					key: 1,
					style: L(f("#00BCD4", {
						emphasis: !0,
						startAlpha: .14,
						endAlpha: .08
					}))
				}, [P("div", zi, [t[5] ||= P("span", { style: {
					"font-size": "11px",
					"font-weight": "700",
					color: "#00BCD4",
					"text-transform": "uppercase",
					"letter-spacing": "0.6px"
				} }, " Override ", -1), P("span", Bi, R(h.value.overrideLabel), 1)])], 4)) : z("", !0),
				h.value.isTruncated ? (M(), F("div", {
					key: 2,
					style: L(f("#FF9800", {
						emphasis: !0,
						startAlpha: .12,
						endAlpha: .08
					}))
				}, [...t[6] ||= [P("div", { style: {
					"font-size": "11px",
					"font-weight": "600",
					color: "#FF9800",
					"text-transform": "uppercase",
					"letter-spacing": "0.5px",
					"margin-bottom": "8px"
				} }, " Metadata Truncated ", -1), P("div", { style: {
					"font-size": "12px",
					color: "var(--fg-color, rgba(255,255,255,0.9))",
					"line-height": "1.5",
					"white-space": "pre-wrap",
					"word-break": "break-word"
				} }, " Generation data is incomplete because it exceeded the size limit. ", -1)]], 4)) : z("", !0),
				h.value.kind === "media-only" ? (M(), F("div", {
					key: 3,
					style: L(f("#9E9E9E", {
						emphasis: !0,
						startAlpha: .1,
						endAlpha: .06
					}))
				}, [t[7] ||= P("div", { style: {
					"font-size": "11px",
					"font-weight": "600",
					color: "#9E9E9E",
					"text-transform": "uppercase",
					"letter-spacing": "0.5px",
					"margin-bottom": "8px"
				} }, " Generation Data ", -1), P("div", Vi, R(h.value.mediaOnlyMessage), 1)], 4)) : z("", !0),
				h.value.kind === "full" ? (M(), F(V, { key: 4 }, [h.value.promptTabs.length ? (M(), F("div", {
					key: 0,
					style: L(f("#4CAF50", {
						emphasis: !0,
						startAlpha: .16,
						endAlpha: .1
					}))
				}, [
					P("div", Hi, " Prompt Pipeline (" + R(h.value.promptTabs.length) + " variants) ", 1),
					P("div", Ui, [(M(!0), F(V, null, N(h.value.promptTabs, (e, t) => (M(), we(i, {
						key: e.label,
						type: "button",
						severity: "secondary",
						text: "",
						rounded: "",
						style: L({
							appearance: "none",
							border: n.value === t ? "1px solid #4CAF50" : "1px solid var(--border-color, rgba(255,255,255,0.12))",
							borderRadius: "999px",
							background: n.value === t ? "#4CAF5033" : "rgba(127,127,127,0.12)",
							color: n.value === t ? "#4CAF50" : "var(--fg-color, #ddd)",
							fontSize: "11px",
							padding: "4px 10px",
							cursor: "pointer",
							fontWeight: n.value === t ? "700" : "500",
							boxShadow: n.value === t ? "0 0 0 1px #4CAF5055 inset" : "none"
						}),
						onClick: (e) => n.value = t
					}, {
						default: De(() => [Ee(R(e.label), 1)]),
						_: 2
					}, 1032, ["style", "onClick"]))), 128))]),
					(M(!0), F(V, null, N(h.value.promptTabs, (e, r) => Ae((M(), F("div", {
						key: `${e.label}-panel`,
						style: {
							display: "flex",
							"flex-direction": "column",
							gap: "8px",
							border: "1px solid rgba(76, 175, 80, 0.35)",
							"border-radius": "6px",
							background: "linear-gradient(135deg, rgba(76, 175, 80, 0.12) 0%, rgba(33, 150, 243, 0.08) 100%)",
							"box-shadow": "0 0 0 1px rgba(76, 175, 80, 0.12) inset",
							padding: "10px"
						}
					}, [
						t[9] ||= P("div", { style: {
							"font-size": "10px",
							"font-weight": "700",
							color: "#4CAF50",
							"letter-spacing": "0.4px"
						} }, " POSITIVE ", -1),
						P("div", {
							style: {
								"font-size": "12px",
								color: "var(--fg-color, #ddd)",
								"white-space": "pre-wrap",
								"line-height": "1.35",
								cursor: "pointer"
							},
							onClick: (t) => T(e.positive, t.currentTarget)
						}, R(e.positive), 9, Wi),
						e.negative ? (M(), F(V, { key: 0 }, [t[8] ||= P("div", { style: {
							"font-size": "10px",
							"font-weight": "700",
							color: "#F44336",
							"letter-spacing": "0.4px",
							"margin-top": "4px"
						} }, " NEGATIVE ", -1), P("div", {
							style: {
								"font-size": "12px",
								color: "var(--fg-color, #ddd)",
								"white-space": "pre-wrap",
								"line-height": "1.35",
								cursor: "pointer"
							},
							onClick: (t) => T(e.negative, t.currentTarget)
						}, R(e.negative), 9, Gi)], 64)) : z("", !0)
					])), [[je, n.value === r]])), 128))
				], 4)) : h.value.positivePrompt ? (M(), F("div", {
					key: 1,
					style: L(f("#4CAF50", {
						emphasis: !0,
						startAlpha: .16,
						endAlpha: .1
					}))
				}, [P("div", Ki, [t[10] ||= P("span", null, "Positive Prompt", -1), h.value.positivePromptOverride ? (M(), F("span", {
					key: 0,
					style: L(m()),
					title: "This field was forced by Majoor Gen Info Override"
				}, " override ", 4)) : z("", !0)]), P("div", {
					title: "Click to copy",
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.9))",
						"line-height": "1.5",
						"white-space": "pre-wrap",
						"word-break": "break-word",
						cursor: "pointer"
					},
					onClick: t[0] ||= (e) => T(h.value.positivePrompt, e.currentTarget)
				}, R(h.value.positivePrompt), 1)], 4)) : z("", !0), !h.value.promptTabs.length && h.value.negativePrompt ? (M(), F("div", {
					key: 2,
					style: L(f("#F44336", {
						emphasis: !0,
						startAlpha: .16,
						endAlpha: .1
					}))
				}, [P("div", qi, [t[11] ||= P("span", null, "Negative Prompt", -1), h.value.negativePromptOverride ? (M(), F("span", {
					key: 0,
					style: L(m()),
					title: "This field was forced by Majoor Gen Info Override"
				}, " override ", 4)) : z("", !0)]), P("div", {
					title: "Click to copy",
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.9))",
						"line-height": "1.5",
						"white-space": "pre-wrap",
						"word-break": "break-word",
						cursor: "pointer"
					},
					onClick: t[1] ||= (e) => T(h.value.negativePrompt, e.currentTarget)
				}, R(h.value.negativePrompt), 1)], 4)) : z("", !0)], 64)) : z("", !0),
				_.value ? (M(), F("div", {
					key: 5,
					style: {
						background: "linear-gradient(135deg, rgba(0, 188, 212, 0.14) 0%, rgba(33, 150, 243, 0.10) 100%)",
						border: "1px solid rgba(0, 188, 212, 0.40)",
						"border-radius": "6px",
						padding: "12px",
						display: "flex",
						"flex-direction": "column",
						gap: "10px"
					},
					class: ze({ "mjr-ai-disabled-block": !g.value })
				}, [
					h.value.showAlignment ? (M(), F(V, { key: 0 }, [
						t[12] ||= P("div", { style: {
							"font-size": "11px",
							"font-weight": "600",
							color: "#00BCD4",
							"text-transform": "uppercase",
							"letter-spacing": "0.5px",
							display: "flex",
							"align-items": "center",
							"justify-content": "space-between"
						} }, [P("span", { title: "How closely the generated image matches the prompt (SigLIP2 score)" }, " Prompt Alignment ")], -1),
						P("div", Ji, [
							P("div", Yi, [P("div", { style: L({
								height: "100%",
								width: c.value.fillWidth,
								background: c.value.fillColor,
								borderRadius: "4px",
								transition: "width 0.6s ease, background 0.4s ease"
							}) }, null, 4)]),
							P("span", { style: L({
								fontSize: "13px",
								fontWeight: "700",
								color: c.value.scoreColor,
								minWidth: "60px",
								textAlign: "right",
								fontFamily: "'Consolas', 'Monaco', monospace"
							}) }, R(c.value.scoreText), 5),
							P("span", { style: L({
								fontSize: "9px",
								fontWeight: "700",
								padding: "2px 6px",
								borderRadius: "3px",
								background: c.value.qualityBackground,
								color: c.value.qualityColor,
								textTransform: "uppercase",
								letterSpacing: "0.5px"
							}) }, R(c.value.qualityText), 5)
						]),
						c.value.aiStatusVisible ? (M(), F("div", Xi, R(c.value.aiStatusText), 1)) : z("", !0)
					], 64)) : z("", !0),
					P("div", Zi, [P("span", Qi, R(h.value.captionLabel), 1), P("div", $i, [Te(i, {
						type: "button",
						class: "mjr-ai-control",
						severity: "secondary",
						text: "",
						disabled: !y.value || s.value,
						style: L([{
							border: "1px solid rgba(0,188,212,0.45)",
							background: "rgba(0,188,212,0.12)",
							color: "#00BCD4",
							"border-radius": "4px",
							"font-size": "10px",
							"font-weight": "600",
							padding: "2px 8px",
							cursor: "pointer"
						}, {
							opacity: y.value ? "1" : "0.6",
							cursor: y.value ? "pointer" : "default"
						}]),
						onClick: Xe(ne, ["stop"])
					}, {
						default: De(() => [Ee(R(o.value), 1)]),
						_: 1
					}, 8, ["disabled", "style"]), Te(i, {
						type: "button",
						class: "mjr-ai-control",
						severity: "secondary",
						text: "",
						disabled: !b.value,
						style: L([{
							border: "1px solid rgba(0,188,212,0.45)",
							background: "rgba(0,188,212,0.12)",
							color: "#00BCD4",
							"border-radius": "4px",
							"font-size": "10px",
							"font-weight": "600",
							padding: "2px 8px",
							cursor: "pointer"
						}, {
							opacity: b.value ? "1" : "0.6",
							cursor: b.value ? "pointer" : "default"
						}]),
						onClick: Xe(ie, ["stop"])
					}, {
						default: De(() => [Ee(R(a.value), 1)]),
						_: 1
					}, 8, ["disabled", "style"])])]),
					P("div", {
						title: g.value ? "Click to copy caption" : "AI caption controls are disabled",
						style: L({
							marginTop: "4px",
							padding: "8px",
							borderRadius: "6px",
							border: "1px solid rgba(0, 188, 212, 0.30)",
							background: "rgba(0, 188, 212, 0.08)",
							color: "rgba(230, 250, 255, 0.95)",
							fontSize: "11px",
							lineHeight: "1.45",
							whiteSpace: "pre-wrap",
							wordBreak: "break-word",
							cursor: b.value ? "copy" : "default"
						}),
						onClick: ie
					}, R(v.value), 13, ea)
				], 2)) : z("", !0),
				h.value.lyrics ? (M(), F("div", {
					key: 6,
					style: L(f("#00BCD4", { emphasis: !1 }))
				}, [t[13] ||= P("div", { style: {
					display: "flex",
					"justify-content": "space-between",
					"align-items": "center",
					"font-size": "11px",
					"font-weight": "600",
					color: "#00BCD4",
					"text-transform": "uppercase",
					"letter-spacing": "0.5px",
					"margin-bottom": "8px"
				} }, [P("span", null, "Lyrics")], -1), P("div", ta, R(h.value.lyrics), 1)], 4)) : z("", !0),
				h.value.pipelineTabs.length ? (M(), F("div", {
					key: 7,
					style: L(f("#FF9800", {
						emphasis: !0,
						startAlpha: .16,
						endAlpha: .1
					}))
				}, [
					t[14] ||= P("div", { style: {
						"font-size": "11px",
						"font-weight": "600",
						color: "#FF9800",
						"text-transform": "uppercase",
						"letter-spacing": "0.5px",
						"margin-bottom": "10px"
					} }, " Generation Pipeline ", -1),
					P("div", na, [(M(!0), F(V, null, N(h.value.pipelineTabs, (e, t) => (M(), we(i, {
						key: e.label,
						type: "button",
						severity: "secondary",
						text: "",
						rounded: "",
						style: L({
							appearance: "none",
							border: r.value === t ? "1px solid #FF9800" : "1px solid var(--border-color, rgba(255,255,255,0.12))",
							borderRadius: "999px",
							background: r.value === t ? "#FF980033" : "rgba(127,127,127,0.12)",
							color: r.value === t ? "#FF9800" : "var(--fg-color, #ddd)",
							fontSize: "11px",
							padding: "4px 10px",
							cursor: "pointer",
							fontWeight: r.value === t ? "700" : "500",
							boxShadow: r.value === t ? "0 0 0 1px #FF980055 inset" : "none"
						}),
						onClick: (e) => r.value = t
					}, {
						default: De(() => [Ee(R(e.label), 1)]),
						_: 2
					}, 1032, ["style", "onClick"]))), 128))]),
					(M(!0), F(V, null, N(h.value.pipelineTabs, (e, t) => Ae((M(), F("div", {
						key: `${e.label}-pipeline`,
						style: {
							display: "grid",
							"grid-template-columns": "repeat(auto-fit, minmax(150px, 1fr))",
							gap: "8px",
							padding: "8px",
							border: "1px solid rgba(255, 152, 0, 0.35)",
							"border-radius": "6px",
							background: "linear-gradient(135deg, rgba(255, 152, 0, 0.12) 0%, rgba(255, 193, 7, 0.08) 100%)",
							"box-shadow": "0 0 0 1px rgba(255, 152, 0, 0.12) inset"
						}
					}, [(M(!0), F(V, null, N(e.fields, (t) => (M(), F("div", {
						key: `${e.label}-${t.label}`,
						style: {
							display: "flex",
							"flex-direction": "column",
							gap: "2px",
							"min-width": "0"
						}
					}, [P("span", ra, R(t.label), 1), P("span", {
						style: {
							"font-size": "12px",
							color: "var(--fg-color, #ddd)",
							"word-break": "break-word",
							padding: "1px 3px",
							"border-radius": "3px",
							transition: "background 0.2s ease",
							cursor: "copy"
						},
						onClick: (e) => T(t.value, e.currentTarget)
					}, R(t.value), 9, ia)]))), 128))])), [[je, r.value === t]])), 128))
				], 4)) : z("", !0),
				h.value.modelGroups.length ? (M(), F("div", {
					key: 8,
					style: L(f("#9C27B0", {
						emphasis: !0,
						startAlpha: .18,
						endAlpha: .1
					}))
				}, [t[17] ||= P("div", { style: {
					"font-size": "11px",
					"font-weight": "600",
					color: "#9C27B0",
					"text-transform": "uppercase",
					"letter-spacing": "0.5px",
					"margin-bottom": "10px"
				} }, " Model Branches ", -1), P("div", aa, [(M(!0), F(V, null, N(h.value.modelGroups, (e) => (M(), F("div", {
					key: `model-group-${e.key}`,
					style: L(C(w(e.key), !0))
				}, [
					P("div", oa, [P("div", { style: L({
						fontSize: "10px",
						fontWeight: "800",
						color: w(e.key),
						letterSpacing: "0.6px",
						textTransform: "uppercase"
					}) }, R(e.label), 5), P("span", { style: L({
						fontSize: "9px",
						fontWeight: "700",
						color: "#fff",
						background: d(w(e.key), .22),
						border: `1px solid ${d(w(e.key), .48)}`,
						borderRadius: "999px",
						padding: "2px 8px",
						letterSpacing: "0.4px",
						textTransform: "uppercase"
					}) }, R(e.loras?.length || 0) + " LoRA ", 5)]),
					P("div", sa, [t[15] ||= P("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.58)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, " UNet ", -1), P("div", {
						style: {
							"font-size": "12px",
							color: "var(--fg-color, rgba(255,255,255,0.96))",
							"line-height": "1.45",
							"word-break": "break-word",
							cursor: "pointer"
						},
						onClick: (t) => T(e.model, t.currentTarget)
					}, R(e.model || "-"), 9, ca)]),
					e.loras?.length ? (M(), F("div", la, [t[16] ||= P("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.58)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, " LoRA Stack ", -1), P("div", ua, [(M(!0), F(V, null, N(e.loras, (t, n) => (M(), F("div", {
						key: `${e.key}-lora-${n}`,
						style: {
							"font-size": "12px",
							color: "var(--fg-color, rgba(255,255,255,0.92))",
							"line-height": "1.4",
							"word-break": "break-word",
							padding: "6px 8px",
							"border-radius": "6px",
							background: "rgba(255,255,255,0.05)",
							border: "1px solid rgba(255,255,255,0.08)",
							cursor: "pointer"
						},
						onClick: (e) => T(t, e.currentTarget)
					}, R(t), 9, da))), 128))])])) : z("", !0)
				], 4))), 128))])], 4)) : z("", !0),
				(M(!0), F(V, null, N(x.value, (e) => (M(), F("div", {
					key: e.key,
					style: L(f(e.accent, { emphasis: e.emphasis }))
				}, [P("div", { style: L({
					fontSize: "11px",
					fontWeight: "600",
					color: e.accent,
					textTransform: "uppercase",
					letterSpacing: "0.5px",
					marginBottom: "10px"
				}) }, R(e.title), 5), P("div", fa, [(M(!0), F(V, null, N(e.fields, (t) => (M(), F(V, { key: `${e.key}-${t.label}` }, [P("div", {
					title: t.label,
					style: {
						"font-size": "11px",
						color: "var(--mjr-muted, rgba(127,127,127,0.9))",
						"font-weight": "500",
						display: "flex",
						"align-items": "center",
						gap: "6px"
					}
				}, [P("span", null, R(t.label) + ":", 1), t.override ? (M(), F("span", {
					key: 0,
					style: L(m()),
					title: "This field was forced by Majoor Gen Info Override"
				}, " override ", 4)) : z("", !0)], 8, pa), P("div", {
					title: `${t.label}: ${t.value}`,
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.95))",
						"word-break": "break-word",
						"white-space": "pre-wrap",
						cursor: "pointer"
					},
					onClick: (e) => T(t.value, e.currentTarget)
				}, R(t.value), 9, ma)], 64))), 128))])], 4))), 128)),
				h.value.notesFields.length ? (M(), F("div", {
					key: 9,
					style: L(f("#4CAF50", { emphasis: !1 }))
				}, [t[18] ||= P("div", { style: {
					"font-size": "11px",
					"font-weight": "600",
					color: "#4CAF50",
					"text-transform": "uppercase",
					"letter-spacing": "0.5px",
					"margin-bottom": "10px"
				} }, " Notes ", -1), (M(!0), F(V, null, N(h.value.notesFields, (e) => (M(), F("div", {
					key: e.label,
					title: `${e.label}: ${e.value}`,
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.9))",
						"line-height": "1.5",
						"white-space": "pre-wrap",
						"word-break": "break-word",
						cursor: "pointer"
					},
					onClick: (t) => T(e.value, t.currentTarget)
				}, R(e.value), 9, ha))), 128))], 4)) : z("", !0),
				(M(!0), F(V, null, N(h.value.customInfoBlocks, (e) => (M(), F("div", {
					key: `${e.title}-${e.content}`,
					style: L(f(e.color, { emphasis: !1 }))
				}, [P("div", { style: L({
					fontSize: "11px",
					fontWeight: "600",
					color: e.color,
					textTransform: "uppercase",
					letterSpacing: "0.5px",
					marginBottom: "8px"
				}) }, R(e.title), 5), P("div", {
					title: `${e.title}: ${e.content}`,
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.9))",
						"line-height": "1.5",
						"white-space": "pre-wrap",
						"word-break": "break-word",
						cursor: "pointer"
					},
					onClick: (t) => T(e.content, t.currentTarget)
				}, R(e.content), 9, ga)], 4))), 128)),
				h.value.ttsInstruction ? (M(), F("div", {
					key: 10,
					style: L(f("#26A69A", { emphasis: !1 }))
				}, [t[19] ||= P("div", { style: {
					display: "flex",
					"justify-content": "space-between",
					"align-items": "center",
					"font-size": "11px",
					"font-weight": "600",
					color: "#26A69A",
					"text-transform": "uppercase",
					"letter-spacing": "0.5px",
					"margin-bottom": "8px"
				} }, [P("span", null, "TTS Instruction")], -1), P("div", {
					title: "Click to copy",
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.9))",
						"line-height": "1.5",
						"white-space": "pre-wrap",
						"word-break": "break-word",
						cursor: "pointer"
					},
					onClick: t[2] ||= (e) => T(h.value.ttsInstruction, e.currentTarget)
				}, R(h.value.ttsInstruction), 1)], 4)) : z("", !0),
				h.value.seed !== null && h.value.seed !== void 0 && h.value.seed !== "" ? (M(), F("div", {
					key: 11,
					style: L(p())
				}, [t[20] ||= P("div", { style: {
					"font-size": "11px",
					"font-weight": "700",
					color: "#E91E63",
					"text-transform": "uppercase",
					"letter-spacing": "1px"
				} }, " SEED ", -1), P("div", {
					title: `Click to copy seed: ${h.value.seed}`,
					style: {
						"font-size": "18px",
						"font-weight": "700",
						color: "#fff",
						"font-family": "'Consolas', 'Monaco', monospace",
						"letter-spacing": "1px",
						cursor: "pointer",
						padding: "4px 8px",
						"border-radius": "4px",
						transition: "background 0.2s"
					},
					onClick: t[3] ||= (e) => T(h.value.seed, e.currentTarget, "rgba(76, 175, 80, 0.4)")
				}, R(h.value.seed), 9, _a)], 4)) : z("", !0),
				h.value.inputFiles.length ? (M(), F("div", {
					key: 12,
					style: L(f("#4CAF50", {
						emphasis: !0,
						startAlpha: .16,
						endAlpha: .1
					}))
				}, [P("div", {
					title: Ke(k)("tooltip.generationInputs", "Input files used in generation"),
					style: {
						"font-size": "11px",
						"font-weight": "600",
						color: "#4CAF50",
						"text-transform": "uppercase",
						"letter-spacing": "0.5px",
						"margin-bottom": "8px"
					}
				}, " Source Files ", 8, va), P("div", ya, [(M(!0), F(V, null, N(h.value.inputFiles, (e) => (M(), we(Ni, {
					key: e.id,
					"input-file": e
				}, null, 8, ["input-file"]))), 128))])], 4)) : z("", !0)
			]));
		};
	}
}, xa = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, Sa = /^[0-9a-f]{20,}$/i;
function Ca(...e) {
	for (let t of e) {
		let e = String(t || "").trim();
		if (e) return e;
	}
	return "";
}
function wa(e) {
	let t = String(e || "").trim();
	return !!t && (xa.test(t) || Sa.test(t));
}
function Ta(e) {
	return String(e?.type || e?.class_type || e?.comfyClass || e?.classType || "").trim();
}
function Ea(e) {
	return Ca(e?.properties?.subgraph_name, e?.title, e?.properties?.title, e?.properties?.name, e?.properties?.label, e?.name, e?.subgraph?.name, e?.subgraph_instance?.name);
}
function Da(e) {
	let t = Ta(e), n = Ea(e);
	return n && (!t || wa(t) || n !== t) ? n : t && !wa(t) ? t : n || (t ? "Subgraph" : String(e?.id || "Node").trim() || "Node");
}
function Oa(e) {
	let t = Ta(e);
	return t && !wa(t) ? t : t ? "Subgraph" : "Node";
}
//#endregion
//#region ui/components/sidebar/utils/minimap.ts
var ka = 6, Aa = 1, ja = 8, Ma = [
	["sampler", "#8e5cff"],
	["ksampler", "#8e5cff"],
	["loader", "#4f8cff"],
	["load", "#4f8cff"],
	["clip", "#d4a634"],
	["vae", "#36a7c9"],
	["latent", "#47a56d"],
	["image", "#8fb04a"],
	["video", "#c47b3d"],
	["mask", "#999999"],
	["conditioning", "#b56bd8"],
	["controlnet", "#c44f76"],
	["lora", "#d27a45"],
	["save", "#4aa37c"],
	["preview", "#4aa37c"],
	["api", "#3aa6a6"]
], Na = (e, t, n) => {
	let r = Number(e);
	return Number.isFinite(r) ? Math.max(t, Math.min(n, r)) : t;
};
function Pa(e, t, n = null) {
	if (!e) return;
	let r = e.getContext?.("2d");
	if (!r) return;
	let i = {
		nodeColors: !0,
		showLinks: !0,
		showGroups: !0,
		renderBypassState: !0,
		renderErrorState: !0,
		showViewport: !0,
		showNodeLabels: !1,
		...n && typeof n == "object" ? n : {}
	}, a = Fa(t), o = Array.isArray(a?.nodes) ? a.nodes : [], s = Array.isArray(a?.groups) && a.groups || Array.isArray(a?.extra?.groups) && a.extra.groups || Array.isArray(a?.extra?.groupNodes) && a.extra.groupNodes || Array.isArray(a?.extra?.group_nodes) && a.extra.group_nodes || [], c = Array.isArray(a?.links) && a.links || Array.isArray(a?.extra?.links) && a.extra.links || [], l = Math.max(1, e.clientWidth || e.width || 1), u = Math.max(1, e.clientHeight || e.height || 1);
	if ((!o || o.length === 0) && (!s || s.length === 0)) return r.clearRect(0, 0, l, u), null;
	let d = (e, t) => {
		if (!e || typeof e != "string") return `rgba(255,255,255,${t})`;
		let n = e.trim();
		if (!n) return `rgba(255,255,255,${t})`;
		let r = n.match(/^rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([0-9.]+))?\)\s*$/i);
		if (r) {
			let e = Number(r[1]), n = Number(r[2]), i = Number(r[3]);
			if ([
				e,
				n,
				i
			].every((e) => Number.isFinite(e))) return `rgba(${e},${n},${i},${t})`;
		}
		let i = n.startsWith("#") ? n.slice(1) : "";
		if (i.length === 3) {
			let e = parseInt(i[0] + i[0], 16), n = parseInt(i[1] + i[1], 16), r = parseInt(i[2] + i[2], 16);
			if ([
				e,
				n,
				r
			].every((e) => Number.isFinite(e))) return `rgba(${e},${n},${r},${t})`;
		}
		if (i.length === 6) {
			let e = parseInt(i.slice(0, 2), 16), n = parseInt(i.slice(2, 4), 16), r = parseInt(i.slice(4, 6), 16);
			if ([
				e,
				n,
				r
			].every((e) => Number.isFinite(e))) return `rgba(${e},${n},${r},${t})`;
		}
		return n;
	}, f = (e) => {
		let t = e?.bgcolor || e?.color || null;
		if (t) return t;
		let n = String(e?.category || e?.type || e?.comfyClass || e?.class_type || e?.title || "").toLowerCase();
		for (let [e, t] of Ma) if (n.includes(e)) return t;
		let r = 0;
		for (let e = 0; e < n.length; e += 1) r = r * 31 + n.charCodeAt(e) | 0;
		return `hsl(${Math.abs(r) % 360} 42% 42%)`;
	}, p = (e) => {
		let t = [], n = e?.inputs && typeof e.inputs == "object" && !Array.isArray(e.inputs) ? e.inputs : null;
		if (n) {
			for (let [e, r] of Object.entries(n)) if (!(Array.isArray(r) || r && typeof r == "object") && (t.push([e, r]), t.length >= 3)) return t;
		}
		let r = Array.isArray(e?.widgets_values) ? e.widgets_values : [], i = Array.isArray(e?.widgets) ? e.widgets : [], a = Array.isArray(e?.inputs) ? e.inputs : [], o = a.filter((e) => e?.widget === !0 || e?.widget && typeof e.widget == "object" || typeof e?.widget == "string" && e.widget.trim()), s = a.filter((e) => e?.link == null && Ha(e?.type)), c = (o.length ? o : s.length ? s : a).map((e) => String(e?.label || e?.localized_name || e?.name || e?.widget?.name || e?.widget?.label || "").trim());
		return r.forEach((e, n) => {
			let r = i[n]?.name || i[n]?.label || c[n] || `p${n + 1}`;
			t.push([r, e]);
		}), t.slice(0, 3);
	}, m = [], h = /* @__PURE__ */ new Map(), g = (e) => {
		if (Array.isArray(e) && e.length >= 2) return [Number(e[0]), Number(e[1])];
		if (e && typeof e == "object") {
			let t = e[0] ?? e[0] ?? e.x ?? e.left ?? null, n = e[1] ?? e[1] ?? e.y ?? e.top ?? null;
			if (t !== null && n !== null) return [Number(t), Number(n)];
		}
		return null;
	}, _ = (e) => {
		if (Array.isArray(e) && e.length >= 2) return [Number(e[0]), Number(e[1])];
		if (e && typeof e == "object") {
			let t = e[0] ?? e[0] ?? e.w ?? e.width ?? null, n = e[1] ?? e[1] ?? e.h ?? e.height ?? null;
			if (t !== null && n !== null) return [Number(t), Number(n)];
		}
		return null;
	};
	for (let e of o || []) {
		let t = e?.id ?? e?.ID ?? e?.node_id ?? null, n = t == null ? null : String(t), r = g(e?.pos), o = _(e?.size);
		if (!r || !o) continue;
		let s = Number(r[0]), c = Number(r[1]), l = Math.max(1, Number(o[0])), u = Math.max(1, Number(o[1]));
		if (!Number.isFinite(s) || !Number.isFinite(c) || !Number.isFinite(l) || !Number.isFinite(u)) continue;
		let d = Number(e?.mode), v = d === 2 || d === 4, y = a?.extra?.errors || a?.extra?.node_errors || null, b = !!(y && typeof y == "object" && n && y[n] || e?.error || e?.errors || e?.flags?.error || e?.properties?.error), x = f(e);
		m.push({
			kind: "node",
			id: n,
			x: s,
			y: c,
			w: l,
			h: u,
			fill: i.nodeColors ? x : null,
			stroke: i.nodeColors ? e?.color || x : null,
			bypassed: v,
			errored: b,
			type: String(e?.type || e?.comfyClass || e?.class_type || "").trim(),
			rows: p(e),
			inputCount: Array.isArray(e?.inputs) ? e.inputs.length : e?.inputs && typeof e.inputs == "object" ? Object.keys(e.inputs).length : 0,
			outputCount: Array.isArray(e?.outputs) ? e.outputs.length : 0,
			label: Da(e).replace(/\s+/g, " ").trim()
		}), n && h.set(n, m[m.length - 1]);
	}
	if (i.showGroups) for (let e of s || []) {
		let t = Array.isArray(e?.bounding) && e.bounding.length >= 4 ? e.bounding : null, n = t ? [Number(t[0]), Number(t[1])] : g(e?.pos), r = t ? [Number(t[2]), Number(t[3])] : _(e?.size);
		if (!n || !r) continue;
		let i = Number(n[0]), a = Number(n[1]), o = Math.max(1, Number(r[0])), s = Math.max(1, Number(r[1]));
		!Number.isFinite(i) || !Number.isFinite(a) || !Number.isFinite(o) || !Number.isFinite(s) || m.push({
			kind: "group",
			x: i,
			y: a,
			w: o,
			h: s,
			fill: e?.color || e?.bgcolor || e?.borderColor || null,
			stroke: e?.borderColor || e?.color || e?.bgcolor || null
		});
	}
	if (!m.length) return r.clearRect(0, 0, l, u), null;
	let v = m[0].x, y = m[0].y, b = m[0].x + m[0].w, x = m[0].y + m[0].h;
	for (let e of m) v = Math.min(v, e.x), y = Math.min(y, e.y), b = Math.max(b, e.x + e.w), x = Math.max(x, e.y + e.h);
	let S = Math.max(1, b - v), C = Math.max(1, x - y), w = v + S / 2, T = y + C / 2, E = i.view && typeof i.view == "object" ? i.view : Object.create(null), ee = Na(E.zoom ?? 1, Aa, ja), te = Math.max(1, S / ee), ne = Math.max(1, C / ee), re = te / 2, ie = ne / 2, ae = te >= S ? w : Na(E.centerX ?? w, v + re, b - re), oe = ne >= C ? T : Na(E.centerY ?? T, y + ie, x - ie), se = ae - re, ce = oe - ie, D = ka, O = Math.min((l - D * 2) / te, (u - D * 2) / ne), le = E.hoveredNodeId !== null && E.hoveredNodeId !== void 0 ? String(E.hoveredNodeId) : null;
	r.clearRect(0, 0, l, u), r.fillStyle = "rgba(0,0,0,0.22)", r.fillRect(0, 0, l, u);
	let ue = (e, t) => ({
		x: D + (e - se) * O,
		y: D + (t - ce) * O
	}), de = (e, t) => ({
		x: Na(se + (Number(e) - D) / O, v, b),
		y: Na(ce + (Number(t) - D) / O, y, x)
	}), fe = () => {
		if (i.showLinks && !(!c || c.length === 0)) {
			r.save(), r.globalAlpha = 1, r.strokeStyle = "rgba(255,255,255,0.18)", r.lineWidth = 1;
			for (let e of c) {
				let t = null, n = null;
				if (Array.isArray(e) && e.length >= 4 ? (t = e[1], n = e[3]) : e && typeof e == "object" && (t = e.origin_id ?? e.originId ?? e.from ?? null, n = e.target_id ?? e.targetId ?? e.to ?? null), t === null || n === null) continue;
				let i = h.get(String(t)), a = h.get(String(n));
				if (!i || !a) continue;
				let o = ue(i.x + i.w, i.y + i.h / 2), s = ue(a.x, a.y + a.h / 2), c = Math.max(12, Math.min(80, Math.abs(s.x - o.x) * .35));
				r.beginPath(), r.moveTo(o.x, o.y), r.bezierCurveTo(o.x + c, o.y, s.x - c, s.y, s.x, s.y), r.stroke();
			}
			r.restore();
		}
	}, pe = (e) => {
		let t = D + (e.x - se) * O, n = D + (e.y - ce) * O, a = Math.max(1, e.w * O), o = Math.max(1, e.h * O), s = e.kind === "node", c = e.kind === "group", l = !!e.bypassed, u = !!e.errored, f = c ? .18 : l && i.renderBypassState ? .14 : .62, p = c ? .55 : l && i.renderBypassState ? .32 : .8, m = d(e.fill, f), h = d(e.stroke, p), g = Math.max(2, Math.min(8, Math.floor(Math.min(a, o) * .08))), _ = s ? Math.max(10, Math.min(22, Math.floor(o * .2))) : 0;
		if (r.save(), r.globalAlpha = 1, typeof m == "string" && (m.startsWith("#") || m.startsWith("rgb") || m.startsWith("hsl")) ? (r.fillStyle = m, r.globalAlpha = f) : (r.fillStyle = typeof m == "string" ? m : "rgba(82,88,96,0.72)", r.globalAlpha = f), typeof r.roundRect == "function" ? (r.beginPath(), r.roundRect(t, n, a, o, g), r.fill()) : r.fillRect(t, n, a, o), r.restore(), s && (r.save(), r.fillStyle = d(e.stroke || e.fill, l ? .34 : .9), typeof r.roundRect == "function" ? (r.beginPath(), r.roundRect(t, n, a, _, [
			g,
			g,
			0,
			0
		]), r.fill()) : r.fillRect(t, n, a, _), r.restore()), r.globalAlpha = 1, r.strokeStyle = "rgba(255,255,255,0.22)", typeof h == "string" && (h.startsWith("#") || h.startsWith("rgb") || h.startsWith("hsl")) && (r.save(), r.globalAlpha = p, r.strokeStyle = h, r.restore()), s && l && i.renderBypassState) try {
			r.setLineDash([3, 2]);
		} catch (e) {
			console.debug?.(e);
		}
		else try {
			r.setLineDash([]);
		} catch (e) {
			console.debug?.(e);
		}
		if (r.lineWidth = 1, typeof r.roundRect == "function" ? (r.beginPath(), r.roundRect(t, n, a, o, g), r.stroke()) : r.strokeRect(t, n, a, o), s && a >= 24 && o >= 20) {
			let i = Math.min(6, Number(e.inputCount) || 0), s = Math.min(6, Number(e.outputCount) || 0);
			r.save(), r.fillStyle = "rgba(255,255,255,0.72)";
			for (let e = 0; e < i; e += 1) {
				let a = n + _ + (o - _) * (e + 1) / (i + 1);
				r.beginPath(), r.arc(t, a, 2.2, 0, Math.PI * 2), r.fill();
			}
			r.fillStyle = "rgba(170,220,255,0.82)";
			for (let e = 0; e < s; e += 1) {
				let i = n + _ + (o - _) * (e + 1) / (s + 1);
				r.beginPath(), r.arc(t + a, i, 2.2, 0, Math.PI * 2), r.fill();
			}
			r.restore();
		}
		if (s && u && i.renderErrorState) {
			try {
				r.setLineDash([]);
			} catch (e) {
				console.debug?.(e);
			}
			r.strokeStyle = "rgba(244,67,54,0.95)", r.lineWidth = 1.5, r.strokeRect(t - .5, n - .5, a + 1, o + 1);
		}
		if (s && le && String(e.id || "") === le) {
			try {
				r.setLineDash([]);
			} catch (e) {
				console.debug?.(e);
			}
			r.strokeStyle = "rgba(255,224,130,0.96)", r.lineWidth = 2, r.strokeRect(t - 1, n - 1, a + 2, o + 2);
		}
		if (s && i.showNodeLabels && e.label && a >= 42 && o >= 12) {
			let i = Math.max(8, Math.min(12, Math.floor(_ * .58))), o = n + Math.max(8, Math.floor((_ + i) / 2) - 1), s = Math.max(20, a - 6), c = e.label;
			for (r.save(), r.beginPath(), r.rect(t + 2, n + 1, a - 4, _ - 1), r.clip(), r.font = `600 ${i}px sans-serif`; c.length > 3 && r.measureText(`${c}...`).width > s;) c = c.slice(0, -1);
			let l = c === e.label ? c : `${c}...`;
			r.fillStyle = "rgba(255,255,255,0.92)", r.shadowColor = "rgba(0,0,0,0.5)", r.shadowBlur = 2, r.fillText(l, t + 3, o, s), r.restore();
		}
		if (s && i.showNodeLabels && Array.isArray(e.rows) && a >= 76 && o >= 46) {
			let i = Math.max(7, Math.min(10, Math.floor(o * .12))), s = Math.max(9, i + 4), c = n + _ + 4;
			r.save(), r.font = `500 ${i}px sans-serif`, r.fillStyle = "rgba(255,255,255,0.62)";
			for (let l = 0; l < e.rows.length; l += 1) {
				let u = c + l * s;
				if (u + s > n + o - 2) break;
				let [d, f] = e.rows[l], p = `${String(d)}: ${String(f).replace(/\s+/g, " ").slice(0, 42)}`;
				r.fillText(p, t + 5, u + i, Math.max(20, a - 10));
			}
			r.restore();
		}
	};
	for (let e of m.filter((e) => e.kind === "group")) pe(e);
	fe();
	for (let e of m.filter((e) => e.kind === "node")) pe(e);
	if (i.showViewport) try {
		let e = me();
		if (e) {
			let t = ue(e.x0, e.y0), n = ue(e.x1, e.y1), i = Math.min(t.x, n.x), a = Math.min(t.y, n.y), o = Math.abs(n.x - t.x), s = Math.abs(n.y - t.y);
			r.save(), r.globalAlpha = 1, r.strokeStyle = "rgba(255,255,255,0.9)", r.lineWidth = 1, r.strokeRect(i, a, o, s), r.restore();
		}
	} catch (e) {
		console.debug?.(e);
	}
	return r.globalAlpha = 1, {
		bounds: {
			minX: v,
			minY: y,
			maxX: b,
			maxY: x,
			width: S,
			height: C
		},
		resolvedView: {
			zoom: ee,
			centerX: ae,
			centerY: oe,
			visibleW: te,
			visibleH: ne,
			viewMinX: se,
			viewMinY: ce,
			pad: D,
			renderScale: O
		},
		canvasToWorld: de,
		worldToCanvas: ue,
		hitTestNode: (e, t) => {
			let n = de(e, t);
			for (let e = m.length - 1; e >= 0; --e) {
				let t = m[e];
				if (t.kind === "node" && n.x >= t.x && n.x <= t.x + t.w && n.y >= t.y && n.y <= t.y + t.h) return t;
			}
			return null;
		}
	};
}
function Fa(e) {
	if (!e || typeof e != "object") return e;
	let t = Array.isArray(e.nodes) ? e.nodes.filter(Boolean) : [], n = Ia(e);
	if (!t.length || !n.size) return e;
	let r = [], i = Array.isArray(e.links) ? [...e.links] : [], a = [...Array.isArray(e.groups) ? e.groups : [], ...Array.isArray(e.extra?.groups) ? e.extra.groups : []];
	for (let e of t) {
		r.push(e);
		let t = La(e, n);
		if (!t || !Array.isArray(t.nodes) || !t.nodes.length) continue;
		let o = Ra(e, t);
		r.push(...o.nodes), i.push(...o.links), o.group && a.push(o.group);
	}
	return {
		...e,
		nodes: r,
		links: i,
		groups: a,
		extra: {
			...e.extra || {},
			groups: a
		}
	};
}
function Ia(e) {
	let t = Array.isArray(e?.definitions?.subgraphs) && e.definitions.subgraphs || Array.isArray(e?.subgraphs) && e.subgraphs || [], n = /* @__PURE__ */ new Map();
	for (let e of t) {
		let t = e?.id ?? e?.name ?? null;
		t != null && n.set(String(t), e);
	}
	return n;
}
function La(e, t) {
	return t.get(String(e?.type ?? "")) || [
		e?.subgraph,
		e?._subgraph,
		e?.subgraph?.graph,
		e?.subgraph?.lgraph,
		e?.properties?.subgraph,
		e?.subgraph_instance,
		e?.subgraph_instance?.graph,
		e?.inner_graph,
		e?.subgraph_graph
	].find((e) => e && typeof e == "object" && Array.isArray(e.nodes)) || null;
}
function Ra(e, t) {
	let n = String(e?.id ?? e?.ID ?? ""), r = Ba(e?.pos) || [0, 0], i = Va(e?.size) || [260, 180], a = t.nodes.filter(Boolean), o = za(a), s = Math.min(22, Math.max(8, i[0] * .08)), c = Math.min(34, Math.max(18, i[1] * .18)), l = Math.min(18, Math.max(8, i[1] * .08)), u = Math.max(40, i[0] - s * 2), d = Math.max(34, i[1] - c - l), f = Math.min(1, u / o.width, d / o.height), p = r[0] + s + (u - o.width * f) / 2, m = r[1] + c + (d - o.height * f) / 2, h = a.map((r) => {
		let i = Ba(r?.pos) || [o.minX, o.minY], a = Va(r?.size) || [140, 60];
		return {
			...r,
			id: `${n}::${r?.id ?? r?.ID ?? ""}`,
			pos: [p + (i[0] - o.minX) * f, m + (i[1] - o.minY) * f],
			size: [Math.max(18, a[0] * f), Math.max(14, a[1] * f)],
			_mjrSubgraphParentId: n,
			_mjrSubgraphName: t?.name || e?.title || e?.type || "Subgraph"
		};
	}), g = (e) => `${n}::${e}`;
	return {
		nodes: h,
		links: (Array.isArray(t.links) ? t.links : []).map((e) => {
			if (Array.isArray(e) && e.length >= 4) {
				let t = [...e];
				return t[1] = g(t[1]), t[3] = g(t[3]), t;
			}
			return e && typeof e == "object" ? {
				...e,
				origin_id: e.origin_id == null ? e.origin_id : g(e.origin_id),
				originId: e.originId == null ? e.originId : g(e.originId),
				from: e.from == null ? e.from : g(e.from),
				target_id: e.target_id == null ? e.target_id : g(e.target_id),
				targetId: e.targetId == null ? e.targetId : g(e.targetId),
				to: e.to == null ? e.to : g(e.to)
			} : e;
		}),
		group: {
			title: t?.name || e?.title || "Subgraph",
			bounding: [
				r[0] + 4,
				r[1] + 18,
				Math.max(1, i[0] - 8),
				Math.max(1, i[1] - 22)
			],
			color: e?.color || e?.bgcolor || "#7f8ca3",
			borderColor: "#9fb5d8"
		}
	};
}
function za(e) {
	let t = Infinity, n = Infinity, r = -Infinity, i = -Infinity;
	for (let a of e) {
		let e = Ba(a?.pos);
		if (!e) continue;
		let o = Va(a?.size) || [140, 60];
		t = Math.min(t, e[0]), n = Math.min(n, e[1]), r = Math.max(r, e[0] + o[0]), i = Math.max(i, e[1] + o[1]);
	}
	return Number.isFinite(t) ? {
		minX: t,
		minY: n,
		width: Math.max(1, r - t),
		height: Math.max(1, i - n)
	} : {
		minX: 0,
		minY: 0,
		width: 1,
		height: 1
	};
}
function Ba(e) {
	if (Array.isArray(e) && e.length >= 2) return [Number(e[0]), Number(e[1])];
	if (e && typeof e == "object") {
		let t = e[0] ?? e[0] ?? e.x ?? e.left ?? null, n = e[1] ?? e[1] ?? e.y ?? e.top ?? null;
		if (t !== null && n !== null) return [Number(t), Number(n)];
	}
	return null;
}
function Va(e) {
	if (Array.isArray(e) && e.length >= 2) return [Number(e[0]), Number(e[1])];
	if (e && typeof e == "object") {
		let t = e[0] ?? e[0] ?? e.w ?? e.width ?? null, n = e[1] ?? e[1] ?? e.h ?? e.height ?? null;
		if (t !== null && n !== null) return [Number(t), Number(n)];
	}
	return null;
}
function Ha(e) {
	if (Array.isArray(e)) return !0;
	let t = String(e || "").trim().toUpperCase();
	return t === "INT" || t === "FLOAT" || t === "STRING" || t === "BOOLEAN" || t === "BOOL" || t === "COMBO" || t === "ENUM";
}
function Ua(e, t = null) {
	if (!e || typeof e != "object") return null;
	let n = {
		maxNodes: 220,
		...t && typeof t == "object" ? t : {}
	}, r = Object.entries(e);
	if (!r.length) return null;
	let i = [], a = [], o = /* @__PURE__ */ new Map(), s = (e) => e == null ? null : String(e) || null, c = (e) => Array.isArray(e) && e.length === 2 && s(e[0]) != null && Number.isFinite(Number(e[1]));
	for (let [e, t] of r.slice(0, n.maxNodes)) {
		if (!t || typeof t != "object") continue;
		let n = s(e);
		if (!n) continue;
		let r = String(t.class_type || t.type || t.classType || "").trim(), l = t.inputs && typeof t.inputs == "object" ? t.inputs : {}, u = {}, d = [];
		for (let e of Object.values(l)) {
			if (!c(e)) continue;
			let t = s(e[0]);
			t && (d.push(t), a.push([t, n]));
		}
		for (let [e, t] of Object.entries(l)) c(t) || (u[e] = t);
		o.set(n, d);
		let f = r.toLowerCase(), p = "#3a3a3a", m = "#6b6b6b";
		f.includes("ksampler") || f.includes("sampler") ? (p = "#6a4b1f", m = "#b07a2c") : f.includes("cliptext") || f.includes("textencode") || f.includes("conditioning") ? (p = "#1f5f3a", m = "#2cb06c") : f.includes("checkpoint") || f.includes("loader") || f.includes("model") ? (p = "#243a6a", m = "#3f6fd6") : (f.includes("save") || f.includes("preview") || f.includes("video")) && (p = "#4a2a5f", m = "#8c4cd1"), i.push({
			id: Number.isFinite(Number(n)) ? Number(n) : n,
			type: r || "Node",
			pos: [0, 0],
			size: [180, 80],
			bgcolor: p,
			color: m,
			title: String(t?._meta?.title || t?.title || "").trim() || void 0,
			inputs: u,
			outputs: []
		});
	}
	if (!i.length) return null;
	let l = /* @__PURE__ */ new Map(), u = /* @__PURE__ */ new Set(), d = (e) => {
		if (l.has(e)) return l.get(e);
		if (u.has(e)) return 0;
		u.add(e);
		let t = 0, n = o.get(e) || [];
		for (let e of n) t = Math.max(t, d(e) + 1);
		return u.delete(e), l.set(e, t), t;
	};
	for (let e of i) d(String(e.id));
	let f = /* @__PURE__ */ new Map();
	for (let e of i) {
		let t = l.get(String(e.id)) ?? 0;
		f.has(t) || f.set(t, []), f.get(t).push(e);
	}
	let p = Array.from(f.keys()).sort((e, t) => e - t);
	for (let e of p) {
		let t = f.get(e) || [];
		t.sort((e, t) => Number(e.id) - Number(t.id));
		for (let n = 0; n < t.length; n++) t[n].pos = [e * 220, n * 110];
	}
	let m = 1;
	return {
		id: "synthetic",
		nodes: i,
		links: a.filter(([e, t]) => e !== t).slice(0, 4e3).map(([e, t]) => [
			m++,
			Number.isFinite(Number(e)) ? Number(e) : e,
			0,
			Number.isFinite(Number(t)) ? Number(t) : t,
			0,
			"LINK"
		]),
		extra: { synthetic: !0 }
	};
}
//#endregion
//#region ui/vue/components/panel/sidebar/SidebarWorkflowSection.vue
var Wa = {
	key: 0,
	class: "mjr-sidebar-section",
	style: {
		background: "var(--comfy-menu-bg, rgba(0,0,0,0.2))",
		border: "1px solid var(--border-color, rgba(255,255,255,0.14))",
		"border-radius": "8px",
		padding: "12px",
		"min-width": "300px"
	}
}, Ga = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "8px",
	"margin-bottom": "10px"
} }, Ka = { style: {
	padding: "4px 9px",
	"border-radius": "999px",
	background: "rgba(33,150,243,0.14)",
	border: "1px solid rgba(33,150,243,0.30)",
	"font-size": "11px",
	"font-weight": "700",
	color: "#90CAF9",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, qa = {
	key: 0,
	style: {
		padding: "4px 9px",
		"border-radius": "999px",
		background: "rgba(255,255,255,0.06)",
		border: "1px solid rgba(255,255,255,0.12)",
		"font-size": "11px",
		"font-weight": "600",
		color: "rgba(255,255,255,0.82)"
	}
}, Ja = { style: {
	display: "grid",
	"grid-template-columns": "repeat(3, minmax(0, 1fr))",
	gap: "8px",
	"margin-bottom": "12px"
} }, Ya = { style: {
	padding: "8px 10px",
	"border-radius": "10px",
	background: "rgba(255,255,255,0.04)",
	border: "1px solid rgba(255,255,255,0.10)"
} }, Xa = { style: {
	"font-size": "18px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.94)",
	"margin-top": "2px"
} }, Za = { style: {
	padding: "8px 10px",
	"border-radius": "10px",
	background: "rgba(255,255,255,0.04)",
	border: "1px solid rgba(255,255,255,0.10)"
} }, Qa = { style: {
	"font-size": "18px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.94)",
	"margin-top": "2px"
} }, $a = { style: {
	padding: "8px 10px",
	"border-radius": "10px",
	background: "rgba(255,255,255,0.04)",
	border: "1px solid rgba(255,255,255,0.10)"
} }, eo = { style: {
	"font-size": "18px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.94)",
	"margin-top": "2px"
} }, to = {
	key: 0,
	class: "mjr-workflow-tree-wrap"
}, no = { class: "mjr-workflow-tree-node" }, ro = { class: "mjr-workflow-tree-node-name" }, io = {
	key: 0,
	class: "mjr-workflow-tree-node-type"
}, ao = { class: "mjr-menu-item-hint" }, oo = {
	key: 0,
	class: "mjr-section-hint"
}, so = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px",
	"margin-top": "8px"
} }, co = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "6px",
	"align-items": "center"
} }, lo = {
	key: 1,
	style: {
		display: "grid",
		"grid-template-columns": "repeat(auto-fit, minmax(180px, 1fr))",
		gap: "8px",
		"align-items": "stretch",
		"margin-top": "10px",
		"margin-bottom": "10px"
	}
}, uo = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "2px",
	"min-width": "0"
} }, fo = { style: {
	"font-size": "13px",
	"font-weight": "600"
} }, po = { style: {
	"font-size": "11px",
	color: "rgba(255,255,255,0.58)"
} }, mo = { style: {
	display: "flex",
	gap: "10px",
	"align-items": "stretch",
	"margin-top": "10px"
} }, ho = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	gap: "10px",
	"margin-top": "8px",
	"font-size": "11px",
	color: "rgba(255,255,255,0.58)"
} }, go = ["open"], _o = { style: {
	background: "rgba(0,0,0,0.5)",
	padding: "10px",
	"border-radius": "6px",
	"font-size": "11px",
	overflow: "auto",
	"max-height": "180px",
	margin: "10px 0 0 0",
	color: "#90CAF9",
	"font-family": "'Consolas', 'Monaco', monospace"
} }, vo = 1, yo = 8, bo = 250, xo = {
	__name: "SidebarWorkflowSection",
	props: { asset: {
		type: Object,
		required: !0
	} },
	setup(e) {
		let t = e, n = Object.freeze({
			nodeColors: !0,
			showLinks: !0,
			showGroups: !0,
			renderBypassState: !0,
			renderErrorState: !0,
			showViewport: !0,
			showNodeLabels: !1,
			size: "comfortable"
		}), r = Object.freeze({
			zoom: 1,
			centerX: null,
			centerY: null,
			hoveredNodeId: null
		}), i = Object.freeze([
			{
				key: "compact",
				label: "Compact",
				height: 120
			},
			{
				key: "comfortable",
				label: "Comfort",
				height: 160
			},
			{
				key: "expanded",
				label: "Expanded",
				height: 220
			}
		]), a = I(null), o = I(!1), s = I(!1), c = I(S()), l = I({ ...r }), u = I("crosshair"), d = I(""), f = null, p = null, m = null;
		function h(e, t, n) {
			let r = Number(e);
			return Number.isFinite(r) ? Math.max(t, Math.min(n, r)) : t;
		}
		function g(e) {
			!e || typeof e != "object" || (l.value = {
				...l.value,
				zoom: h(e.zoom ?? l.value.zoom, vo, yo),
				centerX: Number.isFinite(Number(e.centerX)) ? Number(e.centerX) : null,
				centerY: Number.isFinite(Number(e.centerY)) ? Number(e.centerY) : null
			});
		}
		function _() {
			l.value = { ...r }, d.value = "";
		}
		function v(e) {
			let t = e?.metadata_raw ?? null;
			if (!t) return null;
			if (typeof t == "object") return t;
			if (typeof t == "string") {
				let e = t.trim();
				if (!e) return null;
				try {
					let t = JSON.parse(e);
					return t && typeof t == "object" ? t : null;
				} catch {
					return null;
				}
			}
			return null;
		}
		function y(e) {
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
		function b(e) {
			let t = v(e), n = e?.workflow || e?.Workflow || e?.comfy_workflow || t?.workflow || t?.Workflow || t?.comfy_workflow || null;
			if (!n) return null;
			if (typeof n == "object") return n;
			if (typeof n == "string") {
				let e = n.trim();
				if (!e) return null;
				try {
					return JSON.parse(e);
				} catch {
					return null;
				}
			}
			return null;
		}
		function x(e) {
			let t = v(e), n = e?.prompt || e?.Prompt || t?.prompt || t?.Prompt || null;
			if (!n) return null;
			if (typeof n == "object") return y(n) ? n : null;
			if (typeof n == "string") {
				let e = n.trim();
				if (!e) return null;
				try {
					let t = JSON.parse(e);
					return y(t) ? t : null;
				} catch {
					return null;
				}
			}
			return null;
		}
		function S() {
			try {
				let e = K?.()?.workflowMinimap;
				if (e && typeof e == "object") return {
					...n,
					...e
				};
			} catch (e) {
				console.debug?.(e);
			}
			try {
				let e = localStorage?.getItem?.(ee);
				if (!e) return { ...n };
				let t = JSON.parse(e);
				if (!t || typeof t != "object") return { ...n };
				let r = {
					...n,
					...t
				};
				try {
					let e = K();
					e.workflowMinimap = {
						...e.workflowMinimap,
						...r
					}, q(e), localStorage?.removeItem?.(ee);
				} catch (e) {
					console.debug?.(e);
				}
				return r;
			} catch {
				return { ...n };
			}
		}
		function C(e) {
			try {
				let t = K();
				t.workflowMinimap = {
					...t.workflowMinimap,
					...e
				}, q(t);
			} catch (e) {
				console.debug?.(e);
			}
		}
		let w = B(() => {
			let e = b(t.asset), n = x(t.asset);
			return !e && !n ? null : e || Ua(n);
		}), T = B(() => t.asset?.has_generation_data ? "Complete" : "Partial"), E = B(() => w.value ? JSON.stringify(w.value, null, 2) : "");
		function te(e, t) {
			let n = e?.id ?? e?.key ?? t + 1;
			return String(e?.title || e?._meta?.title || e?.type || e?.class_type || e?.name || `Node ${n}`);
		}
		function ne(e) {
			return String(e?.type || e?.class_type || e?.name || "").trim();
		}
		let re = B(() => (Array.isArray(w.value?.nodes) ? w.value.nodes : []).slice(0, bo).map((e, t) => {
			let n = e?.id ?? e?.key ?? t + 1, r = ne(e);
			return {
				key: String(n),
				label: te(e, t),
				icon: "pi pi-circle-fill",
				data: {
					id: n,
					type: r
				}
			};
		})), ie = B(() => Math.max(0, Number(ae.value.nodes || 0) - re.value.length)), ae = B(() => {
			let e = w.value;
			return e ? {
				nodes: Array.isArray(e?.nodes) ? e.nodes.length : 0,
				links: Array.isArray(e?.links) && e.links.length || Array.isArray(e?.extra?.links) && e.extra.links.length || 0,
				groups: Array.isArray(e?.groups) && e.groups.length || Array.isArray(e?.extra?.groups) && e.extra.groups.length || Array.isArray(e?.extra?.groupNodes) && e.extra.groupNodes.length || Array.isArray(e?.extra?.group_nodes) && e.extra.group_nodes.length || 0,
				source: e?.extra?.synthetic ? "Synthetic" : "Embedded"
			} : {
				nodes: 0,
				links: 0,
				groups: 0,
				source: ""
			};
		}), oe = B(() => {
			let e = String(c.value?.size || "comfortable");
			return i.find((t) => t.key === e) || i[1];
		}), se = B(() => `${oe.value.height}px`), ce = B(() => [
			{
				key: "showNodeLabels",
				label: "Node Labels",
				iconClass: "pi pi-tag"
			},
			{
				key: "nodeColors",
				label: "Node Colors",
				iconClass: "pi pi-palette"
			},
			{
				key: "showLinks",
				label: "Show Links",
				iconClass: "pi pi-share-alt"
			},
			{
				key: "showGroups",
				label: "Show Frames/Groups",
				iconClass: "pi pi-th-large"
			},
			{
				key: "renderBypassState",
				label: "Render Bypass State",
				iconClass: "pi pi-ban"
			},
			{
				key: "renderErrorState",
				label: "Render Error State",
				iconClass: "pi pi-exclamation-triangle"
			},
			{
				key: "showViewport",
				label: "Show Viewport",
				iconClass: "pi pi-window-maximize"
			}
		]);
		function D() {
			let e = a.value, t = w.value;
			if (!e || !t) return;
			let n = Math.max(1, e.clientWidth || 320), r = Math.max(1, e.clientHeight || 120), i = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
			e.width = Math.floor(n * i), e.height = Math.floor(r * i);
			let o = e.getContext("2d");
			o && o.setTransform(i, 0, 0, i, 0, 0), p = Pa(e, t, {
				...c.value,
				view: l.value
			}) || null, g(p?.resolvedView);
		}
		function O(e) {
			ue(e);
		}
		function le(e) {
			let t = a.value;
			if (!t) return null;
			let n = t.getBoundingClientRect?.();
			return n ? {
				x: Number(e?.clientX) - n.left,
				y: Number(e?.clientY) - n.top
			} : null;
		}
		function de(e) {
			let t = le(e);
			return !t || !p?.canvasToWorld ? null : {
				local: t,
				world: p.canvasToWorld(t.x, t.y)
			};
		}
		function fe(e) {
			let t = le(e), n = t && p?.hitTestNode ? p.hitTestNode(t.x, t.y) : null, r = n?.id !== null && n?.id !== void 0 ? String(n.id) : null, i = l.value.hoveredNodeId !== null && l.value.hoveredNodeId !== void 0 ? String(l.value.hoveredNodeId) : null;
			d.value = n?.label || "", r !== i && (l.value = {
				...l.value,
				hoveredNodeId: r
			}, D());
		}
		function pe(e) {
			e && (O(e), l.value = {
				...l.value,
				centerX: Number(e.x),
				centerY: Number(e.y)
			}, D());
		}
		function me(e) {
			if (Number(e?.button ?? 0) !== 0) return;
			let t = de(e);
			t && (m = e.pointerId ?? 1, u.value = "grabbing", a.value?.setPointerCapture?.(m), pe(t.world), fe(e), e.preventDefault?.(), e.stopPropagation?.());
		}
		function he(e) {
			if (m !== null && e.pointerId === m) {
				let t = de(e);
				t && pe(t.world), e.preventDefault?.(), e.stopPropagation?.();
				return;
			}
			fe(e);
		}
		function ge(e) {
			m !== null && e?.pointerId === m && (a.value?.releasePointerCapture?.(m), m = null, u.value = "crosshair"), e?.type === "pointerleave" && (d.value = "", l.value.hoveredNodeId !== null && (l.value = {
				...l.value,
				hoveredNodeId: null
			}, D()));
		}
		function _e(e) {
			let t = de(e), n = p?.resolvedView;
			if (!t || !n) return;
			let r = h(Number(e?.deltaY) || 0, -240, 240), i = Math.exp(-r * .0025), a = h((Number(l.value.zoom) || 1) * i, vo, yo);
			if (Math.abs(a - (Number(l.value.zoom) || 1)) < .001) {
				e.preventDefault?.(), e.stopPropagation?.();
				return;
			}
			let o = Math.max(1, Number(p?.bounds?.width || 1) / a), s = Math.max(1, Number(p?.bounds?.height || 1) / a), c = h((Number(t.world.x) - Number(n.viewMinX || 0)) / Math.max(1, Number(n.visibleW || 1)), 0, 1), u = h((Number(t.world.y) - Number(n.viewMinY || 0)) / Math.max(1, Number(n.visibleH || 1)), 0, 1);
			l.value = {
				...l.value,
				zoom: a,
				centerX: Number(t.world.x) + (.5 - c) * o,
				centerY: Number(t.world.y) + (.5 - u) * s
			}, D(), fe(e), e.preventDefault?.(), e.stopPropagation?.();
		}
		function ve(e) {
			let t = de(e);
			_(), t && O(t.world), D(), e.preventDefault?.(), e.stopPropagation?.();
		}
		function ye(e) {
			c.value = {
				...c.value,
				[e]: !c.value?.[e]
			}, C(c.value);
		}
		function be(e) {
			i.some((t) => t.key === e) && (c.value = {
				...c.value,
				size: e
			}, C(c.value));
		}
		return ke(() => {
			a.value && typeof ResizeObserver == "function" && (f = new ResizeObserver(() => D()), f.observe(a.value)), D();
		}), Ce(w, () => {
			_(), D();
		}, { flush: "post" }), Ce(c, () => {
			D();
		}, {
			deep: !0,
			flush: "post"
		}), Ce(o, () => {
			D();
		}, { flush: "post" }), Oe(() => {
			try {
				f?.disconnect?.();
			} catch (e) {
				console.debug?.(e);
			}
			f = null, m = null;
		}), (e, t) => {
			let n = Ze("MTree"), r = Ze("MButton");
			return w.value ? (M(), F("div", Wa, [
				t[8] ||= P("div", { style: {
					"font-size": "13px",
					"font-weight": "600",
					color: "var(--fg-color, #eaeaea)",
					"margin-bottom": "12px",
					"text-transform": "uppercase",
					"letter-spacing": "0.5px"
				} }, " ComfyUI Workflow ", -1),
				P("div", Ga, [P("div", Ka, R(T.value), 1), ae.value.source ? (M(), F("div", qa, R(ae.value.source), 1)) : z("", !0)]),
				P("div", Ja, [
					P("div", Ya, [t[2] ||= P("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Nodes", -1), P("div", Xa, R(ae.value.nodes), 1)]),
					P("div", Za, [t[3] ||= P("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Links", -1), P("div", Qa, R(ae.value.links), 1)]),
					P("div", $a, [t[4] ||= P("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Groups", -1), P("div", eo, R(ae.value.groups), 1)])
				]),
				re.value.length ? (M(), F("div", to, [
					t[5] ||= P("div", { class: "mjr-section-title" }, " Workflow Nodes ", -1),
					Te(n, {
						value: re.value,
						class: "mjr-workflow-tree",
						"scroll-height": "180px",
						pt: {
							wrapper: { class: "mjr-workflow-tree-scroll" },
							rootChildren: { class: "mjr-workflow-tree-list" },
							nodeContent: { class: "mjr-workflow-tree-node-content" },
							nodeToggleButton: { class: "mjr-workflow-tree-toggle" },
							nodeIcon: { class: "mjr-workflow-tree-icon" },
							nodeLabel: { class: "mjr-workflow-tree-label" }
						}
					}, {
						default: De(({ node: e }) => [P("span", no, [
							P("span", ro, R(e.label), 1),
							e.data?.type ? (M(), F("span", io, R(e.data.type), 1)) : z("", !0),
							P("span", ao, "#" + R(e.data?.id), 1)
						])]),
						_: 1
					}, 8, ["value"]),
					ie.value ? (M(), F("div", oo, " +" + R(ie.value) + " more nodes ", 1)) : z("", !0)
				])) : z("", !0),
				P("div", so, [P("div", co, [(M(!0), F(V, null, N(Ke(i), (e) => (M(), we(r, {
					key: e.key,
					type: "button",
					severity: "secondary",
					text: "",
					rounded: "",
					title: `${e.label} minimap`,
					style: L({
						appearance: "none",
						border: c.value.size === e.key ? "1px solid rgba(33,150,243,0.55)" : "1px solid rgba(255,255,255,0.12)",
						borderRadius: "999px",
						padding: "4px 10px",
						background: c.value.size === e.key ? "rgba(33,150,243,0.18)" : "rgba(255,255,255,0.04)",
						color: c.value.size === e.key ? "#90CAF9" : "rgba(255,255,255,0.78)",
						fontSize: "11px",
						fontWeight: c.value.size === e.key ? "700" : "600",
						cursor: "pointer"
					}),
					onClick: (t) => be(e.key)
				}, {
					default: De(() => [Ee(R(e.label), 1)]),
					_: 2
				}, 1032, [
					"title",
					"style",
					"onClick"
				]))), 128))]), Te(r, {
					type: "button",
					class: "mjr-btn mjr-icon-btn",
					severity: "secondary",
					text: "",
					rounded: "",
					title: Ke(k)("tooltip.minimapSettings", "Minimap settings"),
					style: {
						width: "28px",
						height: "28px",
						"border-radius": "8px",
						display: "inline-flex",
						"align-items": "center",
						"justify-content": "center",
						border: "1px solid var(--mjr-border, rgba(255,255,255,0.12))",
						background: "rgba(255,255,255,0.06)",
						color: "rgba(255,255,255,0.9)",
						cursor: "pointer"
					},
					onClick: t[0] ||= (e) => o.value = !o.value
				}, {
					default: De(() => [...t[6] ||= [P("i", { class: "pi pi-sliders-h" }, null, -1)]]),
					_: 1
				}, 8, ["title"])]),
				o.value ? (M(), F("div", lo, [(M(!0), F(V, null, N(ce.value, (e) => (M(), we(r, {
					key: e.key,
					type: "button",
					severity: "secondary",
					text: "",
					style: L({
						display: "flex",
						alignItems: "center",
						gap: "10px",
						padding: "9px 10px",
						borderRadius: "10px",
						border: c.value?.[e.key] ? "1px solid rgba(76,175,80,0.40)" : "1px solid rgba(255,255,255,0.12)",
						background: c.value?.[e.key] ? "rgba(76,175,80,0.10)" : "rgba(255,255,255,0.04)",
						cursor: "pointer",
						color: "rgba(255,255,255,0.92)",
						textAlign: "left"
					}),
					onClick: (t) => ye(e.key)
				}, {
					default: De(() => [
						P("span", { style: L({
							width: "22px",
							height: "22px",
							borderRadius: "6px",
							display: "inline-flex",
							alignItems: "center",
							justifyContent: "center",
							background: c.value?.[e.key] ? "rgba(76,175,80,0.95)" : "rgba(255,255,255,0.08)",
							border: c.value?.[e.key] ? "1px solid rgba(76,175,80,0.35)" : "1px solid rgba(255,255,255,0.12)",
							flex: "0 0 auto"
						}) }, [P("i", {
							class: "pi pi-check",
							style: L({
								fontSize: "12px",
								opacity: c.value?.[e.key] ? "1" : "0"
							})
						}, null, 4)], 4),
						P("i", {
							class: ze(e.iconClass),
							style: {
								"font-size": "18px",
								opacity: "0.9",
								width: "18px"
							}
						}, null, 2),
						P("div", uo, [P("div", fo, R(e.label), 1), P("div", po, R(c.value?.[e.key] ? "On" : "Off"), 1)])
					]),
					_: 2
				}, 1032, ["style", "onClick"]))), 128))])) : z("", !0),
				P("div", mo, [P("canvas", {
					ref_key: "canvasRef",
					ref: a,
					style: L({
						width: "100%",
						height: se.value,
						cursor: u.value,
						touchAction: "none",
						borderRadius: "10px",
						marginTop: "0",
						background: "linear-gradient(180deg, rgba(7, 12, 18, 0.95) 0%, rgba(10, 16, 24, 0.92) 100%)",
						border: "1px solid var(--mjr-border, rgba(255,255,255,0.12))",
						boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.03)"
					}),
					onPointerdown: me,
					onPointermove: he,
					onPointerup: ge,
					onPointercancel: ge,
					onPointerleave: ge,
					onWheel: _e,
					onDblclick: ve
				}, null, 36)]),
				P("div", ho, [P("span", null, R(d.value || "Click/drag to navigate · wheel to zoom"), 1), P("span", null, R(Math.round((l.value.zoom || 1) * 100)) + "% · " + R(oe.value.label), 1)]),
				P("details", {
					open: s.value,
					style: { "margin-top": "10px" },
					onToggle: t[1] ||= (e) => s.value = e.target.open
				}, [t[7] ||= P("summary", { style: {
					cursor: "pointer",
					color: "var(--mjr-muted, rgba(255,255,255,0.65))",
					"font-size": "12px",
					"user-select": "none"
				} }, " Show raw JSON ", -1), P("pre", _o, R(E.value), 1)], 40, go)
			])) : z("", !0);
		};
	}
};
//#endregion
export { jr as A, Hn as B, Er as C, Tr as D, Mr as E, ar as F, q as G, qt as H, hr as I, ht as J, Et as K, pr as L, gr as M, $n as N, Ar as O, or as P, Qn as R, Ir as S, Dr as T, J as U, Vn as V, K as W, Rr as _, Ta as a, Nr as b, Di as c, ti as d, ei as f, Hr as g, Zr as h, Da as i, yr as j, kr as k, oi as l, Xr as m, Pa as n, Oa as o, Gr as p, Dt as q, Ua as r, ba as s, xo as t, $r as u, zr as v, vr as w, Lr as x, Br as y, Zn as z };
