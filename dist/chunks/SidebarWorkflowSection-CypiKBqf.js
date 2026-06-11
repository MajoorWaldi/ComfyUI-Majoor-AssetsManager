import { $ as e, At as t, Ct as n, Dt as r, Et as i, Gt as a, Ht as o, Jt as s, Lt as c, Mt as l, Nt as u, Ot as d, P as f, Pt as p, Rt as m, Tt as h, U as g, Vt as _, X as v, Yt as y, at as b, ct as x, dt as S, et as ee, ft as C, it as te, j as w, jt as T, k as ne, kt as re, nn as ie, nt as ae, ot as oe, qt as E, rn as se, rt as ce, st as D, t as le, tt as ue, ut as de, wt as fe, z as pe, zt as me } from "./floatingViewerManager-PlZ0qAhM.js";
import { C as he, D as ge, T as _e, W as ve, a as O, c as ye, d as be, f as xe, j as Se, k as Ce, l as we, m as Te, o as k, p as A, s as Ee, u as De, ut as Oe, v as ke } from "./events-DhWnn1NH.js";
import { $ as j, C as M, D as N, E as P, F as Ae, G as je, H as Me, L as F, O as Ne, P as Pe, Q as Fe, T as Ie, V as Le, W as Re, a as ze, at as I, b as Be, c as Ve, ct as L, d as He, f as Ue, g as We, h as Ge, i as Ke, k as qe, l as Je, m as Ye, n as Xe, o as Ze, ot as Qe, p as $e, r as et, s as tt, st as R, t as nt, u as rt, v as it, w as z, x as B, y as at, z as V } from "./mjr-primevue-CJ2E0Gsv.js";
import { n as ot, r as st, t as ct } from "./mjr-vue-vendor-DRftM6R3.js";
import { a as lt, i as ut, n as dt, o as ft, r as pt, t as mt } from "./geninfoParser-5vKgjqjD.js";
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
	if (Number.isFinite(t)) return xt(t, k.GRID_MIN_SIZE);
	let n = gt(String(e?.minSizePreset || "").toLowerCase(), bt, "");
	return n ? yt[n] : xt(e?.minSize, k.GRID_MIN_SIZE);
}, Ct = (e = {}) => xt(e?.minSize, k.FEED_GRID_MIN_SIZE), wt = (e) => {
	let t = Math.round(U(e, k.GRID_MIN_SIZE));
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
				textContent: A("dialog.confirm", "Confirm"),
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
			title: String(t || A("dialog.confirm", "Confirm")),
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
				textContent: A("dialog.cancel", "Cancel"),
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
				textContent: A("dialog.confirm", "Confirm"),
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
			title: String(n || A("dialog.prompt", "Prompt")),
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
				textContent: A("dialog.cancel", "Cancel"),
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
				textContent: A("dialog.ok", "OK"),
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
		return Ce()?.ui || null;
	} catch {
		return null;
	}
}, kt = () => {
	let e = (e) => !!e && (typeof e.alert == "function" || typeof e.confirm == "function" || typeof e.prompt == "function");
	try {
		let t = _e();
		if (e(t)) return t;
	} catch (e) {
		console.debug?.(e);
	}
	return null;
}, At = () => {
	try {
		let e = ge();
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
		safeCall: k.DEBUG_SAFE_CALL,
		safeListeners: k.DEBUG_SAFE_LISTENERS,
		viewer: k.DEBUG_VIEWER
	},
	grid: {
		pageSize: k.DEFAULT_PAGE_SIZE,
		minSize: k.GRID_MIN_SIZE,
		minSizePreset: wt(k.GRID_MIN_SIZE),
		gap: k.GRID_GAP,
		showExtBadge: k.GRID_SHOW_BADGES_EXTENSION,
		showRatingBadge: k.GRID_SHOW_BADGES_RATING,
		showTagsBadge: k.GRID_SHOW_BADGES_TAGS,
		showDetails: k.GRID_SHOW_DETAILS,
		showFilename: k.GRID_SHOW_DETAILS_FILENAME,
		showDate: k.GRID_SHOW_DETAILS_DATE,
		showDimensions: k.GRID_SHOW_DETAILS_DIMENSIONS,
		showGenTime: k.GRID_SHOW_DETAILS_GENTIME,
		showHoverInfo: k.GRID_SHOW_HOVER_INFO,
		showWorkflowDot: k.GRID_SHOW_WORKFLOW_DOT,
		workflowGroupBy: k.WORKFLOW_GRID_GROUP_BY,
		videoAutoplayMode: k.GRID_VIDEO_AUTOPLAY_MODE,
		starColor: k.BADGE_STAR_COLOR,
		badgeImageColor: k.BADGE_IMAGE_COLOR,
		badgeVideoColor: k.BADGE_VIDEO_COLOR,
		badgeAudioColor: k.BADGE_AUDIO_COLOR,
		badgeModel3dColor: k.BADGE_MODEL3D_COLOR,
		badgeDuplicateAlertColor: k.BADGE_DUPLICATE_ALERT_COLOR
	},
	infiniteScroll: {
		enabled: k.INFINITE_SCROLL_ENABLED,
		rootMargin: k.INFINITE_SCROLL_ROOT_MARGIN,
		threshold: k.INFINITE_SCROLL_THRESHOLD,
		bottomGapPx: k.BOTTOM_GAP_PX
	},
	siblings: { hidePngSiblings: !0 },
	autoScan: { onStartup: k.AUTO_SCAN_ON_STARTUP },
	scan: { fastMode: !0 },
	watcher: {
		enabled: !0,
		debounceMs: k.WATCHER_DEBOUNCE_MS,
		dedupeTtlMs: k.WATCHER_DEDUPE_TTL_MS,
		maxPending: 500,
		minSize: 100,
		maxSize: 4294967296
	},
	safety: { confirmDeletion: !0 },
	status: { pollInterval: k.STATUS_POLL_INTERVAL },
	viewer: {
		allowPanAtZoom1: k.VIEWER_ALLOW_PAN_AT_ZOOM_1,
		disableWebGL: k.VIEWER_DISABLE_WEBGL_VIDEO,
		pauseDuringExecution: k.VIEWER_PAUSE_DURING_EXECUTION,
		floatingPauseDuringExecution: k.FLOATING_VIEWER_PAUSE_DURING_EXECUTION,
		mfvLiveDefault: k.MFV_LIVE_DEFAULT,
		mfvPreviewDefault: k.MFV_PREVIEW_DEFAULT,
		videoGradeThrottleFps: k.VIEWER_VIDEO_GRADE_THROTTLE_FPS,
		scopesFps: k.VIEWER_SCOPES_FPS,
		metaTtlMs: k.VIEWER_META_TTL_MS,
		metaMaxEntries: k.VIEWER_META_MAX_ENTRIES,
		mfvSidebarPosition: "right",
		mfvPreviewMethod: k.MFV_PREVIEW_METHOD,
		ltxavRgbFallback: !1
	},
	rtHydrate: {
		concurrency: k.RT_HYDRATE_CONCURRENCY,
		queueMax: k.RT_HYDRATE_QUEUE_MAX,
		seenMax: k.RT_HYDRATE_SEEN_MAX,
		pruneBudget: k.RT_HYDRATE_PRUNE_BUDGET,
		seenTtlMs: k.RT_HYDRATE_SEEN_TTL_MS
	},
	observability: {
		enabled: !1,
		runtimeDashboardMode: "autoHide30",
		verboseErrors: !1,
		verboseRouteRegistrationLogs: !1,
		verboseStartupLogs: !1
	},
	feed: {
		minSize: k.FEED_GRID_MIN_SIZE,
		showInfo: k.FEED_SHOW_INFO,
		showFilename: k.FEED_SHOW_FILENAME,
		showDimensions: k.FEED_SHOW_DIMENSIONS,
		showDate: k.FEED_SHOW_DATE,
		showGenTime: k.FEED_SHOW_GENTIME,
		showWorkflowDot: k.FEED_SHOW_WORKFLOW_DOT,
		showExtBadge: k.FEED_SHOW_BADGES_EXTENSION,
		showRatingBadge: k.FEED_SHOW_BADGES_RATING,
		showTagsBadge: k.FEED_SHOW_BADGES_TAGS
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
	search: { maxResults: k.SEARCH_DEFAULT_LIMIT },
	ai: {
		vectorSearchEnabled: !0,
		vectorCaptionOnIndex: !1,
		verboseAiLogs: !1
	},
	executionGrouping: { enabled: k.EXECUTION_GROUPING_ENABLED },
	workflowMinimap: {
		enabled: k.WORKFLOW_MINIMAP_ENABLED,
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
		cardHoverColor: k.UI_CARD_HOVER_COLOR,
		cardSelectionColor: k.UI_CARD_SELECTION_COLOR,
		ratingColor: k.UI_RATING_COLOR,
		tagColor: k.UI_TAG_COLOR
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
		let e = Te.get(se);
		if (!e) return { ...G };
		let t = JSON.parse(e), n = t && typeof t == "object" && Number.isInteger(t.version) && t.data && typeof t.data == "object";
		if (!n && !(t && typeof t == "object" && !Array.isArray(t))) return { ...G };
		if (n && Number(t.version) > 1) return console.warn("[Majoor] settings schema version is newer than this build, using defaults"), { ...G };
		let r = n ? t.data : t, i = new Set(/* @__PURE__ */ "debug.grid.infiniteScroll.siblings.autoScan.scan.watcher.status.viewer.rtHydrate.observability.feed.sidebar.probeBackend.i18n.paths.db.ratingTagsSync.cache.search.ai.executionGrouping.workflowMinimap.ui.security.safety".split(".")), a = {};
		if (r && typeof r == "object") for (let [e, t] of Object.entries(r)) i.has(e) && (a[e] = t);
		let o = vt(G, a);
		if (!n) try {
			q(o);
		} catch (e) {
			console.debug?.(e);
		}
		return o;
	} catch (e) {
		return console.warn("[Majoor] settings load failed, using defaults", e), { ...G };
	}
}, q = (e) => {
	try {
		let t = JSON.parse(JSON.stringify(e || {}));
		t?.security && typeof t.security == "object" && (t.security.apiToken = "");
		let n = {
			version: 1,
			data: t
		};
		if (!Te.set("mjrSettings", JSON.stringify(n))) throw Error("SettingsStore rejected the write");
	} catch (e) {
		console.warn("[Majoor] settings save failed", e);
		try {
			let e = Date.now();
			e - (Number(window?._mjrSettingsSaveFailAt || 0) || 0) > 3e4 && (window._mjrSettingsSaveFailAt = e, Tt(A("dialog.settingsSaveFailed", "Majoor: Failed to save settings (browser storage full or blocked).")));
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
	let t = Number(k.MAX_PAGE_SIZE) || 2e3;
	O.DEFAULT_PAGE_SIZE = Math.max(50, Math.min(t, Number(e.grid?.pageSize) || k.DEFAULT_PAGE_SIZE)), O.AUTO_SCAN_ON_STARTUP = !!e.autoScan?.onStartup, O.EXECUTION_GROUPING_ENABLED = !!(e.executionGrouping?.enabled ?? k.EXECUTION_GROUPING_ENABLED), O.STATUS_POLL_INTERVAL = Math.max(1e3, Number(e.status?.pollInterval) || k.STATUS_POLL_INTERVAL), O.DEBUG_SAFE_CALL = !!e.debug?.safeCall, O.DEBUG_SAFE_LISTENERS = !!e.debug?.safeListeners, O.DEBUG_VIEWER = !!e.debug?.viewer, O.GRID_MIN_SIZE = St(e.grid), O.FEED_GRID_MIN_SIZE = Ct(e.feed), O.GRID_GAP = Math.max(0, Math.min(40, Math.round(U(e.grid?.gap, k.GRID_GAP)))), O.GRID_SHOW_BADGES_EXTENSION = !!(e.grid?.showExtBadge ?? k.GRID_SHOW_BADGES_EXTENSION), O.GRID_SHOW_BADGES_RATING = !!(e.grid?.showRatingBadge ?? k.GRID_SHOW_BADGES_RATING), O.GRID_SHOW_BADGES_TAGS = !!(e.grid?.showTagsBadge ?? k.GRID_SHOW_BADGES_TAGS), O.GRID_SHOW_DETAILS = !!(e.grid?.showDetails ?? k.GRID_SHOW_DETAILS), O.GRID_SHOW_DETAILS_FILENAME = !!(e.grid?.showFilename ?? k.GRID_SHOW_DETAILS_FILENAME), O.GRID_SHOW_DETAILS_DATE = !!(e.grid?.showDate ?? k.GRID_SHOW_DETAILS_DATE), O.GRID_SHOW_DETAILS_DIMENSIONS = !!(e.grid?.showDimensions ?? k.GRID_SHOW_DETAILS_DIMENSIONS), O.GRID_SHOW_DETAILS_GENTIME = !!(e.grid?.showGenTime ?? k.GRID_SHOW_DETAILS_GENTIME), O.GRID_SHOW_HOVER_INFO = !!(e.grid?.showHoverInfo ?? k.GRID_SHOW_HOVER_INFO), O.GRID_SHOW_WORKFLOW_DOT = !!(e.grid?.showWorkflowDot ?? k.GRID_SHOW_WORKFLOW_DOT);
	{
		let t = String(e.grid?.workflowGroupBy ?? k.WORKFLOW_GRID_GROUP_BY).toLowerCase();
		O.WORKFLOW_GRID_GROUP_BY = [
			"none",
			"task",
			"model",
			"category"
		].includes(t) ? t : k.WORKFLOW_GRID_GROUP_BY;
	}
	O.FEED_SHOW_INFO = !!(e.feed?.showInfo ?? k.FEED_SHOW_INFO), O.FEED_SHOW_FILENAME = !!(e.feed?.showFilename ?? k.FEED_SHOW_FILENAME), O.FEED_SHOW_DIMENSIONS = !!(e.feed?.showDimensions ?? k.FEED_SHOW_DIMENSIONS), O.FEED_SHOW_DATE = !!(e.feed?.showDate ?? k.FEED_SHOW_DATE), O.FEED_SHOW_GENTIME = !!(e.feed?.showGenTime ?? k.FEED_SHOW_GENTIME), O.FEED_SHOW_WORKFLOW_DOT = !!(e.feed?.showWorkflowDot ?? k.FEED_SHOW_WORKFLOW_DOT), O.FEED_SHOW_BADGES_EXTENSION = !!(e.feed?.showExtBadge ?? k.FEED_SHOW_BADGES_EXTENSION), O.FEED_SHOW_BADGES_RATING = !!(e.feed?.showRatingBadge ?? k.FEED_SHOW_BADGES_RATING), O.FEED_SHOW_BADGES_TAGS = !!(e.feed?.showTagsBadge ?? k.FEED_SHOW_BADGES_TAGS);
	{
		let t = e.grid?.videoAutoplayMode ?? k.GRID_VIDEO_AUTOPLAY_MODE;
		t ??= e.grid?.videoHoverAutoplay === !1 ? "off" : "hover", t === !0 && (t = "hover"), t === !1 && (t = "off"), t !== "hover" && t !== "always" && t !== "off" && (t = "hover"), O.GRID_VIDEO_AUTOPLAY_MODE = t;
	}
	let n = (e, t) => {
		let n = String(e || "").trim();
		return /^[0-9a-fA-F]{6}$/.test(n) && (n = `#${n}`), /^#[0-9a-fA-F]{3,8}$/.test(n) ? n : t;
	};
	O.BADGE_STAR_COLOR = n(e.grid?.starColor, k.BADGE_STAR_COLOR), O.BADGE_IMAGE_COLOR = n(e.grid?.badgeImageColor, k.BADGE_IMAGE_COLOR), O.BADGE_VIDEO_COLOR = n(e.grid?.badgeVideoColor, k.BADGE_VIDEO_COLOR), O.BADGE_AUDIO_COLOR = n(e.grid?.badgeAudioColor, k.BADGE_AUDIO_COLOR), O.BADGE_MODEL3D_COLOR = n(e.grid?.badgeModel3dColor, k.BADGE_MODEL3D_COLOR), O.BADGE_DUPLICATE_ALERT_COLOR = n(e.grid?.badgeDuplicateAlertColor, k.BADGE_DUPLICATE_ALERT_COLOR), O.UI_CARD_HOVER_COLOR = n(e.ui?.cardHoverColor, k.UI_CARD_HOVER_COLOR), O.UI_CARD_SELECTION_COLOR = n(e.ui?.cardSelectionColor, k.UI_CARD_SELECTION_COLOR), O.UI_RATING_COLOR = n(e.ui?.ratingColor, k.UI_RATING_COLOR), O.UI_TAG_COLOR = n(e.ui?.tagColor, k.UI_TAG_COLOR);
	try {
		let e = Array.from(document.querySelectorAll(".mjr-assets-manager"));
		for (let t of e) t.style.setProperty("--mjr-star-active", O.BADGE_STAR_COLOR), t.style.setProperty("--mjr-badge-image", O.BADGE_IMAGE_COLOR), t.style.setProperty("--mjr-badge-video", O.BADGE_VIDEO_COLOR), t.style.setProperty("--mjr-badge-audio", O.BADGE_AUDIO_COLOR), t.style.setProperty("--mjr-badge-model3d", O.BADGE_MODEL3D_COLOR), t.style.setProperty("--mjr-badge-duplicate-alert", O.BADGE_DUPLICATE_ALERT_COLOR), t.style.setProperty("--mjr-card-hover-color", O.UI_CARD_HOVER_COLOR), t.style.setProperty("--mjr-card-selection-color", O.UI_CARD_SELECTION_COLOR), t.style.setProperty("--mjr-rating-color", O.UI_RATING_COLOR), t.style.setProperty("--mjr-tag-color", O.UI_TAG_COLOR);
	} catch (e) {
		console.debug?.(e);
	}
	O.INFINITE_SCROLL_ENABLED = !!e.infiniteScroll?.enabled, O.INFINITE_SCROLL_ROOT_MARGIN = String(e.infiniteScroll?.rootMargin || k.INFINITE_SCROLL_ROOT_MARGIN), O.INFINITE_SCROLL_THRESHOLD = Math.max(0, Math.min(1, U(e.infiniteScroll?.threshold, k.INFINITE_SCROLL_THRESHOLD))), O.BOTTOM_GAP_PX = Math.max(0, Math.min(5e3, Math.round(U(e.infiniteScroll?.bottomGapPx, k.BOTTOM_GAP_PX)))), O.VIEWER_ALLOW_PAN_AT_ZOOM_1 = !!e.viewer?.allowPanAtZoom1, O.VIEWER_DISABLE_WEBGL_VIDEO = !!e.viewer?.disableWebGL, O.VIEWER_PAUSE_DURING_EXECUTION = !!(e.viewer?.pauseDuringExecution ?? k.VIEWER_PAUSE_DURING_EXECUTION), O.FLOATING_VIEWER_PAUSE_DURING_EXECUTION = !!(e.viewer?.floatingPauseDuringExecution ?? k.FLOATING_VIEWER_PAUSE_DURING_EXECUTION), O.MFV_LIVE_DEFAULT = e.viewer?.mfvLiveDefault ?? k.MFV_LIVE_DEFAULT, O.MFV_PREVIEW_DEFAULT = e.viewer?.mfvPreviewDefault ?? k.MFV_PREVIEW_DEFAULT, O.MFV_LIVE_AUTO_OPEN = !1, O.MFV_PREVIEW_AUTO_OPEN = !1, O.MFV_NODE_STREAM_AUTO_OPEN = !1;
	{
		let t = String(e.viewer?.mfvPreviewMethod || k.MFV_PREVIEW_METHOD).toLowerCase();
		O.MFV_PREVIEW_METHOD = [
			"default",
			"auto",
			"latent2rgb",
			"taesd",
			"none"
		].includes(t) ? t : k.MFV_PREVIEW_METHOD;
	}
	{
		let t = String(e.viewer?.mfvSidebarPosition || "right").toLowerCase();
		O.MFV_SIDEBAR_POSITION = [
			"left",
			"right",
			"bottom"
		].includes(t) ? t : "right";
	}
	O.VIEWER_VIDEO_GRADE_THROTTLE_FPS = Math.max(1, Math.min(60, Math.round(U(e.viewer?.videoGradeThrottleFps, k.VIEWER_VIDEO_GRADE_THROTTLE_FPS)))), O.VIEWER_SCOPES_FPS = Math.max(1, Math.min(60, Math.round(U(e.viewer?.scopesFps, k.VIEWER_SCOPES_FPS)))), O.VIEWER_META_TTL_MS = Math.max(1e3, Math.min(10 * 6e4, Math.round(U(e.viewer?.metaTtlMs, k.VIEWER_META_TTL_MS)))), O.VIEWER_META_MAX_ENTRIES = Math.max(50, Math.min(5e3, Math.round(U(e.viewer?.metaMaxEntries, k.VIEWER_META_MAX_ENTRIES)))), O.WORKFLOW_MINIMAP_ENABLED = !!(e.workflowMinimap?.enabled ?? k.WORKFLOW_MINIMAP_ENABLED), O.RT_HYDRATE_CONCURRENCY = Math.max(1, Math.min(16, Math.round(U(e.rtHydrate?.concurrency, k.RT_HYDRATE_CONCURRENCY)))), O.RT_HYDRATE_QUEUE_MAX = Math.max(10, Math.min(5e3, Math.round(U(e.rtHydrate?.queueMax, k.RT_HYDRATE_QUEUE_MAX)))), O.RT_HYDRATE_SEEN_MAX = Math.max(1e3, Math.min(2e5, Math.round(U(e.rtHydrate?.seenMax, k.RT_HYDRATE_SEEN_MAX)))), O.RT_HYDRATE_PRUNE_BUDGET = Math.max(10, Math.min(1e4, Math.round(U(e.rtHydrate?.pruneBudget, k.RT_HYDRATE_PRUNE_BUDGET)))), O.RT_HYDRATE_SEEN_TTL_MS = Math.max(5e3, Math.min(360 * 6e4, Math.round(U(e.rtHydrate?.seenTtlMs, k.RT_HYDRATE_SEEN_TTL_MS)))), O.DELETE_CONFIRMATION = !!e.safety?.confirmDeletion, O.DEBUG_VERBOSE_ERRORS = !!e.observability?.verboseErrors, O.WATCHER_MAX_PENDING = Math.max(10, Math.min(5e3, Math.round(U(e.watcher?.maxPending, 500)))), O.WATCHER_MIN_SIZE = Math.max(0, Math.min(1e6, Math.round(U(e.watcher?.minSize, 100)))), O.WATCHER_MAX_SIZE = Math.max(1e5, Math.min(17179869184, Math.round(U(e.watcher?.maxSize, 4294967296)))), O.DB_TIMEOUT_MS = Math.max(1e3, Math.min(3e4, Math.round(U(e.db?.timeoutMs, 5e3)))), O.DB_MAX_CONNECTIONS = Math.max(1, Math.min(100, Math.round(U(e.db?.maxConnections, 10)))), O.DB_QUERY_TIMEOUT_MS = Math.max(500, Math.min(1e4, Math.round(U(e.db?.queryTimeoutMs, 1e3)))), O.SEARCH_REQUEST_LIMIT = Math.max(10, Math.min(k.MAX_PAGE_SIZE || 2e3, Math.round(U(e.search?.maxResults, k.SEARCH_DEFAULT_LIMIT))));
};
async function Ut() {
	try {
		let e = await D();
		if (!e?.ok) return;
		let t = e.data?.prefs;
		if (!t || typeof t != "object") return;
		let n = K();
		if (n.security = n.security || {}, n.security.safeMode = H(t.safe_mode, n.security.safeMode), n.security.allowWrite = H(t.allow_write, n.security.allowWrite), n.security.requireAuth = H(t.require_auth, n.security.requireAuth), n.security.allowRemoteWrite = H(t.allow_remote_write, n.security.allowRemoteWrite), n.security.allowInsecureTokenTransport = H(t.allow_insecure_token_transport, n.security.allowInsecureTokenTransport), n.security.allowDelete = H(t.allow_delete, n.security.allowDelete), n.security.allowRename = H(t.allow_rename, n.security.allowRename), n.security.allowOpenInFolder = H(t.allow_open_in_folder, n.security.allowOpenInFolder), n.security.allowResetIndex = H(t.allow_reset_index, n.security.allowResetIndex), n.security.tokenConfigured = H(t.token_configured, n.security.tokenConfigured), n.security.tokenHint = String(t.token_hint || "").trim(), !String(n.security.apiToken || "").trim()) try {
			let e = await g(), t = String(e?.data?.token || "").trim();
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
		let e = await de();
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
		let t = await e();
		if (!t?.ok) return;
		let n = t.data?.prefs;
		if (!n || typeof n != "object") return;
		let r = K();
		r.executionGrouping = r.executionGrouping || {}, r.executionGrouping.enabled = H(n.enabled, r.executionGrouping.enabled ?? k.EXECUTION_GROUPING_ENABLED), q(r), J(r), ht("mjr-settings-changed", { key: "executionGrouping.enabled" }, { warnPrefix: "[Majoor]" });
	} catch (e) {
		console.warn("[Majoor] failed to sync backend execution grouping settings", e);
	}
}
//#endregion
//#region ui/app/settings/settingsRuntime.ts
var Kt = "mjr-runtime-status-dashboard", qt = "__mjr_write_token", Jt = 3e4;
function Yt() {
	try {
		let e = K(), t = String(e?.observability?.runtimeDashboardMode || G.observability.runtimeDashboardMode);
		return [
			"autoHide30",
			"always",
			"hidden"
		].includes(t) ? t : "autoHide30";
	} catch {
		return "autoHide30";
	}
}
function Xt() {
	try {
		document.getElementById(Kt)?.remove?.();
	} catch (e) {
		console.debug?.(e);
	}
}
function Zt() {
	try {
		window.__MJR_RUNTIME_STATUS_HIDE_TIMEOUT__ && (clearTimeout(window.__MJR_RUNTIME_STATUS_HIDE_TIMEOUT__), window.__MJR_RUNTIME_STATUS_HIDE_TIMEOUT__ = null);
	} catch (e) {
		console.debug?.(e);
	}
}
function Qt() {
	try {
		return String(sessionStorage?.getItem?.(qt) || "").trim();
	} catch {
		return "";
	}
}
function $t(e, t) {
	let n = t === "auth" ? "__mjrAuthLine" : "__mjrMetricsLine";
	if (e?.[n]) return e[n];
	let r = document.createElement("div");
	return r.style.whiteSpace = "nowrap", r.style.lineHeight = "1.35", t === "auth" && (r.style.marginTop = "4px", r.style.fontWeight = "600"), e.appendChild(r), e[n] = r, r;
}
function en(e) {
	let t = Qt(), n = String(e?.token_hint || "").trim() || (t ? `...${t.slice(-4)}` : ""), r = e?.allow_write !== !1, i = e?.require_auth === !0, a = e?.token_configured === !0;
	return r ? t ? {
		text: A("runtime.writeAuthActive", "Write auth: active {tokenHint}", { tokenHint: n || "(session)" }),
		color: "#7ee0a0"
	} : i && a ? {
		text: A("runtime.writeAuthMissing", "Write auth: missing in this browser {tokenHint}", { tokenHint: n || "(server token configured)" }),
		color: "#f1c36d"
	} : i ? {
		text: A("runtime.writeAuthRequired", "Write auth: required"),
		color: "#f1c36d"
	} : e && typeof e == "object" ? {
		text: A("runtime.writeAuthNotRequired", "Write auth: not required"),
		color: "#8fd0ff"
	} : {
		text: A("runtime.writeAuthUnknown", "Write auth: unknown"),
		color: "#c8ced8"
	} : {
		text: A("runtime.writeAuthBlocked", "Write auth: writes blocked by server"),
		color: "#ff9b9b"
	};
}
function tn() {
	try {
		if (Yt() === "hidden" || window.__MJR_RUNTIME_STATUS_HIDDEN__) return Xt(), null;
		let e = document.querySelector(".mjr-assets-manager.mjr-am-container"), t = document.getElementById(Kt);
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
		let n = document.getElementById(Kt);
		return n ? n.parentElement !== e && e.appendChild(n) : (n = document.createElement("div"), n.id = Kt, n.style.position = "absolute", n.style.bottom = "10px", n.style.right = "10px", n.style.zIndex = "9999", n.style.padding = "6px 10px", n.style.borderRadius = "10px", n.style.border = "1px solid rgba(255,255,255,0.16)", n.style.background = "rgba(0,0,0,0.45)", n.style.backdropFilter = "blur(4px)", n.style.color = "var(--content-fg, #fff)", n.style.fontSize = "11px", n.style.pointerEvents = "none", n.style.display = "flex", n.style.flexDirection = "column", e.appendChild(n)), n;
	} catch {
		return null;
	}
}
async function nn() {
	let e = tn();
	if (!e) return !1;
	let t = $t(e, "metrics"), n = $t(e, "auth");
	try {
		let [r, i] = await Promise.all([oe(), D()]), a = A("runtime.unavailable", "Runtime: unavailable");
		if (!r?.ok || !r?.data) t.textContent = a;
		else {
			let e = r.data.db || {}, n = r.data.index || {}, i = r.data.watcher || {}, o = Number(e.active_connections || 0), s = Number(n.enrichment_queue_length || 0), c = Number(i.pending_files || 0);
			t.textContent = A("runtime.metricsLine", "DB active: {active} | Enrich Q: {enrichQ} | Watcher pending: {pending}", {
				active: o,
				enrichQ: s,
				pending: c
			}), a = A("runtime.metricsTitle", "Runtime Metrics\nDB active connections: {active}\nEnrichment queue: {enrichQ}\nWatcher pending files: {pending}", {
				active: o,
				enrichQ: s,
				pending: c
			});
		}
		let o = en(i?.data?.prefs || null);
		return n.textContent = o.text, n.style.color = o.color, e.title = `${a}\n${o.text}`, !0;
	} catch {
		return t.textContent = A("runtime.unavailable", "Runtime: unavailable"), n.textContent = A("runtime.writeAuthUnknown", "Write auth: unknown"), n.style.color = "#c8ced8", e.title = `${A("runtime.unavailable", "Runtime: unavailable")}\n${n.textContent}`, !0;
	}
}
function rn() {
	try {
		let e = Yt();
		if (e === "hidden") {
			window.__MJR_RUNTIME_STATUS_HIDDEN__ = !0, Zt(), Xt();
			return;
		}
		window.__MJR_RUNTIME_STATUS_SETTINGS_LISTENER__ || (window.__MJR_RUNTIME_STATUS_SETTINGS_LISTENER__ = (e) => {
			if (e?.detail?.key !== "observability.runtimeDashboardMode") return;
			let t = Yt();
			window.__MJR_RUNTIME_STATUS_HIDDEN__ = t === "hidden", Zt(), Xt(), t !== "hidden" && rn();
		}, window.addEventListener?.("mjr-settings-changed", window.__MJR_RUNTIME_STATUS_SETTINGS_LISTENER__)), window.__MJR_RUNTIME_STATUS_HIDDEN__ = !1, Zt(), e === "autoHide30" && (window.__MJR_RUNTIME_STATUS_HIDE_TIMEOUT__ = setTimeout(() => {
			window.__MJR_RUNTIME_STATUS_HIDDEN__ = !0, Xt();
		}, Jt)), nn().catch(() => {}), window.__MJR_RUNTIME_STATUS_INFLIGHT__ ?? (window.__MJR_RUNTIME_STATUS_INFLIGHT__ = !1), window.__MJR_RUNTIME_STATUS_MISS_COUNT__ ?? (window.__MJR_RUNTIME_STATUS_MISS_COUNT__ = 0), window.__MJR_RUNTIME_STATUS_INTERVAL__ || (window.__MJR_RUNTIME_STATUS_INTERVAL__ = setInterval(() => {
			window.__MJR_RUNTIME_STATUS_INFLIGHT__ || (window.__MJR_RUNTIME_STATUS_INFLIGHT__ = !0, nn().then((e) => {
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
//#region ui/utils/debounce.ts
var an = 300;
function on(e, t = an) {
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
var Y = "Majoor", sn = "Majoor Assets Manager";
function cn(e, t, n) {
	let r = (e, t) => [
		sn,
		e,
		t
	], i = (e) => [
		sn,
		A("cat.cards", "Cards"),
		e
	], a = (e) => [
		sn,
		A("cat.badges", "Badges"),
		e
	], o = (e) => [
		sn,
		A("cat.badges", "Badges"),
		e
	], s = (e, t) => {
		let n = String(e || "").trim();
		return /^[0-9a-fA-F]{6}$/.test(n) && (n = `#${n}`), /^#[0-9a-fA-F]{6}$/.test(n) ? n.toUpperCase() : t;
	};
	t.grid?.minSizePreset || (t.grid = t.grid || {}, t.grid.minSizePreset = wt(t.grid.minSize), q(t)), e({
		id: `${Y}.Cards.ThumbSize`,
		category: i(A("setting.grid.cardSize.group", "Card size")),
		name: A("setting.grid.cardSize.name", "Majoor: Card Size"),
		tooltip: A("setting.grid.cardSize.desc", "Choose the card size preset used by the grid layout."),
		type: "combo",
		defaultValue: (() => {
			let e = gt(String(t.grid?.minSizePreset || "").toLowerCase(), bt, wt(t.grid?.minSize)), n = {
				small: A("setting.grid.cardSize.small", "Small"),
				medium: A("setting.grid.cardSize.medium", "Medium"),
				large: A("setting.grid.cardSize.large", "Large")
			};
			return n[e] || n.medium;
		})(),
		options: [
			A("setting.grid.cardSize.small", "Small"),
			A("setting.grid.cardSize.medium", "Medium"),
			A("setting.grid.cardSize.large", "Large")
		],
		onChange: (e) => {
			let r = String(e || "").trim().toLowerCase(), i = A("setting.grid.cardSize.small", "Small").toLowerCase(), a = A("setting.grid.cardSize.medium", "Medium").toLowerCase(), o = A("setting.grid.cardSize.large", "Large").toLowerCase(), s = "medium";
			r === i || r === "small" || r === "petit" ? s = "small" : r === o || r === "large" || r === "grand" ? s = "large" : (r === a || r === "medium" || r === "moyen") && (s = "medium"), t.grid.minSizePreset = s, t.grid.minSize = yt[s], q(t), J(t), n("grid.minSizePreset");
		}
	}), e({
		id: `${Y}.Cards.CustomThumbSize`,
		category: i(A("setting.grid.cardSize.group", "Card size")),
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
		defaultValue: !!(t.grid?.showGenTime ?? k.GRID_SHOW_DETAILS_GENTIME),
		onChange: (e) => {
			t.grid.showGenTime = !!e, q(t), J(t), n("grid.showGenTime");
		}
	}), e({
		id: `${Y}.Grid.ShowHoverInfo`,
		category: i("Show prompt on hover"),
		name: "Show prompt on hover",
		tooltip: "Show positive prompt and generation time as a tooltip overlay when hovering over a card thumbnail. Does not block video play-on-hover.",
		type: "boolean",
		defaultValue: !!(t.grid?.showHoverInfo ?? k.GRID_SHOW_HOVER_INFO),
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
		category: o(A("setting.starColor", "Star color")),
		name: A("setting.starColor", "Majoor: Star color"),
		tooltip: A("setting.starColor.tooltip", "Color of rating stars on thumbnails (hex, e.g. #FFD45A)"),
		type: "color",
		defaultValue: s(t.grid?.starColor, k.BADGE_STAR_COLOR),
		onChange: (e) => {
			t.grid.starColor = s(e, k.BADGE_STAR_COLOR), q(t), J(t), n("grid.starColor");
		}
	}), e({
		id: `${Y}.Badges.ImageColor`,
		category: o(A("setting.badgeImageColor", "Image badge color")),
		name: A("setting.badgeImageColor", "Majoor: Image badge color"),
		tooltip: A("setting.badgeImageColor.tooltip", "Color for image badges: PNG, JPG, WEBP, GIF, BMP, TIF (hex)"),
		type: "color",
		defaultValue: s(t.grid?.badgeImageColor, k.BADGE_IMAGE_COLOR),
		onChange: (e) => {
			t.grid.badgeImageColor = s(e, k.BADGE_IMAGE_COLOR), q(t), J(t), n("grid.badgeImageColor");
		}
	}), e({
		id: `${Y}.Badges.VideoColor`,
		category: o(A("setting.badgeVideoColor", "Video badge color")),
		name: A("setting.badgeVideoColor", "Majoor: Video badge color"),
		tooltip: A("setting.badgeVideoColor.tooltip", "Color for video badges: MP4, WEBM, MOV, AVI, MKV (hex)"),
		type: "color",
		defaultValue: s(t.grid?.badgeVideoColor, k.BADGE_VIDEO_COLOR),
		onChange: (e) => {
			t.grid.badgeVideoColor = s(e, k.BADGE_VIDEO_COLOR), q(t), J(t), n("grid.badgeVideoColor");
		}
	}), e({
		id: `${Y}.Badges.AudioColor`,
		category: o(A("setting.badgeAudioColor", "Audio badge color")),
		name: A("setting.badgeAudioColor", "Majoor: Audio badge color"),
		tooltip: A("setting.badgeAudioColor.tooltip", "Color for audio badges: MP3, WAV, OGG, FLAC (hex)"),
		type: "color",
		defaultValue: s(t.grid?.badgeAudioColor, k.BADGE_AUDIO_COLOR),
		onChange: (e) => {
			t.grid.badgeAudioColor = s(e, k.BADGE_AUDIO_COLOR), q(t), J(t), n("grid.badgeAudioColor");
		}
	}), e({
		id: `${Y}.Badges.Model3dColor`,
		category: o(A("setting.badgeModel3dColor", "3D model badge color")),
		name: A("setting.badgeModel3dColor", "Majoor: 3D model badge color"),
		tooltip: A("setting.badgeModel3dColor.tooltip", "Color for 3D model badges: OBJ, FBX, GLB, GLTF (hex)"),
		type: "color",
		defaultValue: s(t.grid?.badgeModel3dColor, k.BADGE_MODEL3D_COLOR),
		onChange: (e) => {
			t.grid.badgeModel3dColor = s(e, k.BADGE_MODEL3D_COLOR), q(t), J(t), n("grid.badgeModel3dColor");
		}
	}), e({
		id: `${Y}.Badges.DuplicateAlertColor`,
		category: o(A("setting.badgeDuplicateAlertColor", "Duplicate alert badge color")),
		name: A("setting.badgeDuplicateAlertColor", "Majoor: Duplicate alert badge color"),
		tooltip: A("setting.badgeDuplicateAlertColor.tooltip", "Color for duplicate extension badges (PNG+, JPG+, etc)."),
		type: "color",
		defaultValue: s(t.grid?.badgeDuplicateAlertColor, k.BADGE_DUPLICATE_ALERT_COLOR),
		onChange: (e) => {
			t.grid.badgeDuplicateAlertColor = s(e, k.BADGE_DUPLICATE_ALERT_COLOR), q(t), J(t), n("grid.badgeDuplicateAlertColor");
		}
	}), e({
		id: `${Y}.Grid.PageSize`,
		category: r(A("cat.grid"), A("setting.grid.pagesize.name").replace("Majoor: ", "")),
		name: A("setting.grid.pagesize.name"),
		tooltip: A("setting.grid.pagesize.desc"),
		type: "number",
		defaultValue: t.grid.pageSize,
		attrs: {
			min: 50,
			max: Number(O.MAX_PAGE_SIZE) || 2e3,
			step: 50
		},
		onChange: (e) => {
			let r = Number(O.MAX_PAGE_SIZE) || 2e3;
			t.grid.pageSize = Math.max(50, Math.min(r, Number(e) || k.DEFAULT_PAGE_SIZE)), q(t), J(t), n("grid.pageSize");
		}
	}), e({
		id: `${Y}.Grid.WorkflowGroupBy`,
		category: r(A("cat.grid"), "Workflow grouping"),
		name: "Workflow grid grouping",
		tooltip: "In Workflow scope, insert titled separators and group cards by Task, Model, or Category.",
		type: "combo",
		defaultValue: (() => {
			let e = String(t.grid?.workflowGroupBy || k.WORKFLOW_GRID_GROUP_BY).trim().toLowerCase(), n = {
				none: "None",
				task: "Task",
				model: "Model",
				category: "Category"
			};
			return n[e] || n.none;
		})(),
		options: [
			"None",
			"Task",
			"Model",
			"Category"
		],
		onChange: (e) => {
			let r = {
				None: "none",
				Task: "task",
				Model: "model",
				Category: "category"
			}[String(e || "")] || "none";
			t.grid = t.grid || {}, t.grid.workflowGroupBy = r, q(t), J(t), n("grid.workflowGroupBy");
		}
	}), e({
		id: `${Y}.InfiniteScroll.Enabled`,
		category: r(A("cat.grid"), A("setting.nav.infinite.name").replace("Majoor: ", "")),
		name: A("setting.nav.infinite.name"),
		tooltip: A("setting.nav.infinite.desc"),
		type: "boolean",
		defaultValue: !!t.infiniteScroll?.enabled,
		onChange: (e) => {
			t.infiniteScroll = t.infiniteScroll || {}, t.infiniteScroll.enabled = !!e, q(t), J(t), n("infiniteScroll.enabled");
		}
	}), e({
		id: `${Y}.Sidebar.Position`,
		category: r(A("cat.grid"), A("setting.sidebar.pos.name").replace("Majoor: ", "")),
		name: A("setting.sidebar.pos.name"),
		tooltip: A("setting.sidebar.pos.desc"),
		type: "combo",
		defaultValue: t.sidebar?.position || "right",
		options: ["left", "right"],
		onChange: (e) => {
			t.sidebar = t.sidebar || {}, t.sidebar.position = e === "left" ? "left" : "right", q(t), n("sidebar.position");
		}
	}), e({
		id: `${Y}.Sidebar.ShowPreviewThumb`,
		category: r(A("cat.grid"), "Sidebar preview"),
		name: "Show sidebar preview thumb",
		tooltip: "Show/hide the large media preview at the top of the sidebar metadata panel.",
		type: "boolean",
		defaultValue: !!(t.sidebar?.showPreviewThumb ?? !0),
		onChange: (e) => {
			t.sidebar = t.sidebar || {}, t.sidebar.showPreviewThumb = !!e, q(t), n("sidebar.showPreviewThumb");
		}
	}), e({
		id: `${Y}.Sidebar.WidthPx`,
		category: r(A("cat.grid"), "Sidebar width"),
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
		category: r(A("cat.grid"), A("setting.siblings.hide.name").replace("Majoor: ", "")),
		name: A("setting.siblings.hide.name"),
		tooltip: A("setting.siblings.hide.desc"),
		type: "boolean",
		defaultValue: !!t.siblings?.hidePngSiblings,
		onChange: (e) => {
			t.siblings = t.siblings || {}, t.siblings.hidePngSiblings = !!e, q(t), n("siblings.hidePngSiblings");
		}
	}), e({
		id: `${Y}.Grid.VideoAutoplayMode`,
		category: r(A("cat.grid"), A("setting.grid.videoAutoplayMode.name", "Video autoplay").replace("Majoor: ", "")),
		name: A("setting.grid.videoAutoplayMode.name", "Majoor: Video autoplay"),
		tooltip: A("setting.grid.videoAutoplayMode.desc", "Controls video thumbnail playback in the grid. Off: static frame. Hover: play on mouse hover. Always: loop while visible."),
		type: "combo",
		defaultValue: (() => {
			let e = t.grid?.videoAutoplayMode;
			e ??= t.grid?.videoHoverAutoplay === !1 ? "off" : "hover", e === !0 && (e = "hover"), e === !1 && (e = "off"), e !== "hover" && e !== "always" && e !== "off" && (e = "hover");
			let n = {
				off: A("setting.grid.videoAutoplayMode.off", "Off"),
				hover: A("setting.grid.videoAutoplayMode.hover", "Hover"),
				always: A("setting.grid.videoAutoplayMode.always", "Always")
			};
			return n[e] || n.off;
		})(),
		options: [
			A("setting.grid.videoAutoplayMode.off", "Off"),
			A("setting.grid.videoAutoplayMode.hover", "Hover"),
			A("setting.grid.videoAutoplayMode.always", "Always")
		],
		onChange: (e) => {
			let r = {
				[A("setting.grid.videoAutoplayMode.off", "Off")]: "off",
				[A("setting.grid.videoAutoplayMode.hover", "Hover")]: "hover",
				[A("setting.grid.videoAutoplayMode.always", "Always")]: "always"
			}[e] || "off";
			t.grid = t.grid || {}, t.grid.videoAutoplayMode = r, delete t.grid.videoHoverAutoplay, q(t), J(t), n("grid.videoAutoplayMode");
		}
	}), e({
		id: `${Y}.Cards.HoverColor`,
		category: i("Hover color"),
		name: "Majoor: Card hover color",
		tooltip: "Background tint used when hovering a card (hex, e.g. #3D3D3D).",
		type: "color",
		defaultValue: s(t.ui?.cardHoverColor, k.UI_CARD_HOVER_COLOR),
		onChange: (e) => {
			t.ui = t.ui || {}, t.ui.cardHoverColor = s(e, k.UI_CARD_HOVER_COLOR), q(t), J(t), n("ui.cardHoverColor");
		}
	}), e({
		id: `${Y}.Cards.SelectionColor`,
		category: i("Selection color"),
		name: "Majoor: Card selection color",
		tooltip: "Outline/accent color used for selected cards (hex, e.g. #4A90E2).",
		type: "color",
		defaultValue: s(t.ui?.cardSelectionColor, k.UI_CARD_SELECTION_COLOR),
		onChange: (e) => {
			t.ui = t.ui || {}, t.ui.cardSelectionColor = s(e, k.UI_CARD_SELECTION_COLOR), q(t), J(t), n("ui.cardSelectionColor");
		}
	}), e({
		id: `${Y}.Badges.RatingColor`,
		category: a("Rating color"),
		name: "Majoor: Rating badge color",
		tooltip: "Color used for rating badge text/accent (hex, e.g. #FF9500).",
		type: "color",
		defaultValue: s(t.ui?.ratingColor, k.UI_RATING_COLOR),
		onChange: (e) => {
			t.ui = t.ui || {}, t.ui.ratingColor = s(e, k.UI_RATING_COLOR), q(t), J(t), n("ui.ratingColor");
		}
	}), e({
		id: `${Y}.Badges.TagColor`,
		category: a("Tag color"),
		name: "Majoor: Tags badge color",
		tooltip: "Color used for tags badge text/accent (hex, e.g. #4A90E2).",
		type: "color",
		defaultValue: s(t.ui?.tagColor, k.UI_TAG_COLOR),
		onChange: (e) => {
			t.ui = t.ui || {}, t.ui.tagColor = s(e, k.UI_TAG_COLOR), q(t), J(t), n("ui.tagColor");
		}
	});
}
//#endregion
//#region ui/app/settings/settingsViewer.ts
var ln = "Majoor", un = "Majoor Assets Manager";
function dn(e, t, n) {
	let i = (e, t) => [
		un,
		e,
		t
	], a = (e) => i(A("cat.viewer", "Viewer"), e), o = (e) => i(A("cat.floatingViewer", "Floating Viewer"), e);
	e({
		id: `${ln}.Viewer.AllowPanAtZoom1`,
		category: a(A("setting.viewer.pan.name").replace("Majoor: ", "")),
		name: A("setting.viewer.pan.name"),
		tooltip: A("setting.viewer.pan.desc"),
		type: "boolean",
		defaultValue: !!t.viewer?.allowPanAtZoom1,
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.allowPanAtZoom1 = !!e, q(t), J(t), n("viewer.allowPanAtZoom1");
		}
	}), e({
		id: `${ln}.Viewer.DisableWebGL`,
		category: a("Disable WebGL Video"),
		name: "Disable WebGL Video",
		tooltip: "Use CPU rendering (Canvas 2D) for video playback. Fixes 'black screen' issues on incompatible hardware/browsers.",
		type: "boolean",
		defaultValue: !!t.viewer?.disableWebGL,
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.disableWebGL = !!e, q(t), J(t), n("viewer.disableWebGL");
		}
	}), e({
		id: `${ln}.Viewer.PauseDuringExecution`,
		category: a(A("setting.viewer.pauseExecution.name").replace("Majoor: ", "")),
		name: A("setting.viewer.pauseExecution.name"),
		tooltip: A("setting.viewer.pauseExecution.desc"),
		type: "boolean",
		defaultValue: !!t.viewer?.pauseDuringExecution,
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.pauseDuringExecution = !!e, q(t), J(t), n("viewer.pauseDuringExecution");
		}
	}), e({
		id: `${ln}.Viewer.FloatingPauseDuringExecution`,
		category: o(A("setting.viewer.floatingPauseExecution.name").replace("Majoor: ", "")),
		name: A("setting.viewer.floatingPauseExecution.name"),
		tooltip: A("setting.viewer.floatingPauseExecution.desc"),
		type: "boolean",
		defaultValue: !!t.viewer?.floatingPauseDuringExecution,
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.floatingPauseDuringExecution = !!e, q(t), J(t), n("viewer.floatingPauseDuringExecution");
		}
	}), e({
		id: `${ln}.Viewer.MfvLiveDefault`,
		category: o(A("setting.viewer.mfvLiveDefault.name").replace("Majoor: ", "")),
		name: A("setting.viewer.mfvLiveDefault.name"),
		tooltip: A("setting.viewer.mfvLiveDefault.desc"),
		type: "boolean",
		defaultValue: !!(t.viewer?.mfvLiveDefault ?? k.MFV_LIVE_DEFAULT),
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.mfvLiveDefault = !!e, q(t), J(t), n("viewer.mfvLiveDefault");
		}
	}), e({
		id: `${ln}.Viewer.MfvPreviewDefault`,
		category: o(A("setting.viewer.mfvPreviewDefault.name").replace("Majoor: ", "")),
		name: A("setting.viewer.mfvPreviewDefault.name"),
		tooltip: A("setting.viewer.mfvPreviewDefault.desc"),
		type: "boolean",
		defaultValue: !!(t.viewer?.mfvPreviewDefault ?? k.MFV_PREVIEW_DEFAULT),
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.mfvPreviewDefault = !!e, q(t), J(t), n("viewer.mfvPreviewDefault");
		}
	}), e({
		id: `${ln}.Viewer.MfvSidebarPosition`,
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
		id: `${ln}.Viewer.MfvPreviewMethod`,
		category: o(A("setting.viewer.mfvPreviewMethod.name").replace("Majoor: ", "")),
		name: A("setting.viewer.mfvPreviewMethod.name"),
		tooltip: A("setting.viewer.mfvPreviewMethod.desc"),
		type: "combo",
		defaultValue: t.viewer?.mfvPreviewMethod || k.MFV_PREVIEW_METHOD,
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
			].includes(e) ? e : k.MFV_PREVIEW_METHOD;
			t.viewer = t.viewer || {}, t.viewer.mfvPreviewMethod = r, q(t), J(t), n("viewer.mfvPreviewMethod");
		}
	}), e({
		id: `${ln}.Viewer.LtxavRgbFallback`,
		category: o("LTXAV preview fallback"),
		name: "Majoor: LTXAV RGB Preview Fallback (experimental)",
		tooltip: "Reuse LTXV RGB projection for LTXAV when native latent preview is unavailable. Experimental; quality may be approximate.",
		type: "boolean",
		defaultValue: !!t.viewer?.ltxavRgbFallback,
		onChange: async (e) => {
			let i = !!e, a = !!t.viewer?.ltxavRgbFallback;
			t.viewer = t.viewer || {}, t.viewer.ltxavRgbFallback = i, q(t), J(t), n("viewer.ltxavRgbFallback");
			try {
				let e = await r(i);
				if (!e?.ok) throw Error(e?.error || "Failed to update LTXAV RGB preview fallback setting");
			} catch (e) {
				t.viewer.ltxavRgbFallback = a, q(t), J(t), n("viewer.ltxavRgbFallback"), s(e?.message || "Failed to update LTXAV RGB preview fallback setting", "error");
			}
		}
	});
	try {
		ae().then((e) => {
			if (!e?.ok) return;
			let r = !!e?.data?.prefs?.enabled, i = K();
			i.viewer = i.viewer || {}, !!i.viewer.ltxavRgbFallback !== r && (i.viewer.ltxavRgbFallback = r, Object.assign(t, i), q(i), J(i), n("viewer.ltxavRgbFallback"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	((r, i, o, s) => {
		e({
			id: `${ln}.WorkflowMinimap.${r}`,
			category: a(A(o).replace("Majoor: ", "")),
			name: A(o),
			tooltip: A(s),
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
var fn = "Majoor", pn = "Majoor Assets Manager";
function mn(e, t, n) {
	let r = (e, t) => [
		pn,
		e,
		t
	];
	e({
		id: `${fn}.ExecutionGrouping.Enabled`,
		category: r(A("cat.scanning"), "Execution grouping"),
		name: "Execution job/stack grouping",
		tooltip: "Enable or disable all live job_id / stack_id tracking, grouping, and stack finalization logic.",
		type: "boolean",
		defaultValue: !!(t.executionGrouping?.enabled ?? k.EXECUTION_GROUPING_ENABLED),
		onChange: async (e) => {
			let r = !!(t.executionGrouping?.enabled ?? k.EXECUTION_GROUPING_ENABLED), i = !!e;
			t.executionGrouping = t.executionGrouping || {}, t.executionGrouping.enabled = i, q(t), J(t), n("executionGrouping.enabled");
			try {
				let e = await fe(i);
				if (!e?.ok) throw Error(e?.error || "Failed to update execution grouping setting");
				t.executionGrouping.enabled = !!e?.data?.prefs?.enabled, q(t), J(t), n("executionGrouping.enabled");
			} catch (e) {
				t.executionGrouping.enabled = r, q(t), J(t), n("executionGrouping.enabled"), s(e?.message || "Failed to update execution grouping setting", "error");
			}
		}
	}), e({
		id: `${fn}.AutoScan.OnStartup`,
		category: r(A("cat.scanning"), A("setting.scan.startup.name").replace("Majoor: ", "")),
		name: A("setting.scan.startup.name"),
		tooltip: A("setting.scan.startup.desc"),
		type: "boolean",
		defaultValue: !!t.autoScan?.onStartup,
		onChange: (e) => {
			t.autoScan = t.autoScan || {}, t.autoScan.onStartup = !!e, q(t), J(t), n("autoScan.onStartup");
		}
	}), e({
		id: `${fn}.Scan.FastMode`,
		category: r(A("cat.scanning"), "Scan mode"),
		name: "Fast scan mode",
		tooltip: "Use fast scan mode for manual backfill scans (skip heavier metadata work during scan).",
		type: "boolean",
		defaultValue: !!(t.scan?.fastMode ?? !0),
		onChange: (e) => {
			t.scan = t.scan || {}, t.scan.fastMode = !!e, q(t), n("scan.fastMode");
		}
	}), e({
		id: `${fn}.RtHydrate.Concurrency`,
		category: r(A("cat.scanning"), "Hydration"),
		name: "Hydrate Concurrency",
		tooltip: "Maximum concurrent hydration requests for rating/tags.",
		type: "number",
		defaultValue: Number(t.rtHydrate?.concurrency || k.RT_HYDRATE_CONCURRENCY || 5),
		attrs: {
			min: 1,
			max: 20,
			step: 1
		},
		onChange: (e) => {
			t.rtHydrate = t.rtHydrate || {}, t.rtHydrate.concurrency = Math.max(1, Math.min(20, Math.round(U(e, k.RT_HYDRATE_CONCURRENCY || 5)))), q(t), J(t), n("rtHydrate.concurrency");
		}
	});
	let i = (e, t, n, r) => {
		let i = Math.round(U(e, t));
		return Math.max(n, Math.min(r, i));
	}, a = (e = {}) => {
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
	}, o = async () => {
		try {
			let e = await S();
			if (!e?.ok) return;
			a(e.data || {});
		} catch (e) {
			console.debug?.(e);
		}
	};
	e({
		id: `${fn}.Watcher.Enabled`,
		category: r(A("cat.scanning"), A("setting.watcher.enabled.label", "Enable watcher")),
		name: A("setting.watcher.name"),
		tooltip: A("setting.watcher.desc") + " (env: MJR_ENABLE_WATCHER)",
		type: "boolean",
		defaultValue: !!t.watcher?.enabled,
		onChange: async (e) => {
			t.watcher = t.watcher || {}, t.watcher.enabled = !!e, q(t), n("watcher.enabled");
			try {
				let r = await c(!!e);
				r?.ok || (t.watcher.enabled = !e, q(t), n("watcher.enabled"), s(r?.error || A("toast.failedToggleWatcher", "Failed to toggle watcher"), "error"));
			} catch {
				t.watcher.enabled = !e, q(t), n("watcher.enabled");
			}
		}
	}), e({
		id: `${fn}.Watcher.DebounceDelay`,
		category: r(A("cat.scanning"), A("setting.watcher.debounce.label", "Watcher debounce delay")),
		name: A("setting.watcher.debounce.name"),
		tooltip: A("setting.watcher.debounce.desc") + " (env: MJR_WATCHER_DEBOUNCE_MS)",
		type: "number",
		defaultValue: t.watcher?.debounceMs ?? k.WATCHER_DEBOUNCE_MS,
		attrs: {
			min: 50,
			max: 6e4,
			step: 50
		},
		onChange: async (e) => {
			let r = k.WATCHER_DEBOUNCE_MS, a = i(e, r, 50, 6e4), o = t.watcher?.debounceMs ?? r;
			if (a !== o) {
				t.watcher = t.watcher || {}, t.watcher.debounceMs = a, q(t);
				try {
					let e = await m({ debounce_ms: a });
					if (!e?.ok) throw Error(e?.error || A("setting.watcher.debounce.error"));
					let r = Math.round(Number(e?.data?.debounce_ms ?? a));
					t.watcher.debounceMs = r, q(t), n("watcher.debounceMs");
				} catch (e) {
					t.watcher.debounceMs = o, q(t), n("watcher.debounceMs"), s(e?.message || A("setting.watcher.debounce.error"), "error");
				}
			}
		}
	}), e({
		id: `${fn}.Watcher.DedupeWindow`,
		category: r(A("cat.scanning"), A("setting.watcher.dedupe.label", "Watcher dedupe window")),
		name: A("setting.watcher.dedupe.name"),
		tooltip: A("setting.watcher.dedupe.desc") + " (env: MJR_WATCHER_DEDUPE_TTL_MS)",
		type: "number",
		defaultValue: t.watcher?.dedupeTtlMs ?? k.WATCHER_DEDUPE_TTL_MS,
		attrs: {
			min: 100,
			max: 12e4,
			step: 100
		},
		onChange: async (e) => {
			let r = k.WATCHER_DEDUPE_TTL_MS, a = i(e, r, 100, 12e4), o = t.watcher?.dedupeTtlMs ?? r;
			if (a !== o) {
				t.watcher = t.watcher || {}, t.watcher.dedupeTtlMs = a, q(t);
				try {
					let e = await m({ dedupe_ttl_ms: a });
					if (!e?.ok) throw Error(e?.error || A("setting.watcher.dedupe.error"));
					let r = Math.round(Number(e?.data?.dedupe_ttl_ms ?? a));
					t.watcher.dedupeTtlMs = r, q(t), n("watcher.dedupeTtlMs");
				} catch (e) {
					t.watcher.dedupeTtlMs = o, q(t), n("watcher.dedupeTtlMs"), s(e?.message || A("setting.watcher.dedupe.error"), "error");
				}
			}
		}
	}), e({
		id: `${fn}.Watcher.MaxPending`,
		category: r(A("cat.scanning"), "Watcher queue"),
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
		id: `${fn}.Watcher.MinSize`,
		category: r(A("cat.scanning"), "Watcher file size"),
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
		id: `${fn}.Watcher.MaxSize`,
		category: r(A("cat.scanning"), "Watcher file size"),
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
		o().catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	e({
		id: `${fn}.RatingTagsSync.Enabled`,
		category: r(A("cat.scanning"), A("setting.sync.rating.name").replace("Majoor: ", "")),
		name: A("setting.sync.rating.name"),
		tooltip: A("setting.sync.rating.desc"),
		type: "boolean",
		defaultValue: !!t.ratingTagsSync?.enabled,
		onChange: (e) => {
			t.ratingTagsSync = t.ratingTagsSync || {}, t.ratingTagsSync.enabled = !!e, q(t), n("ratingTagsSync.enabled");
		}
	});
}
//#endregion
//#region ui/app/settings/settingsFeed.ts
var hn = "Majoor", gn = "Majoor Assets Manager";
function _n(e, t, n) {
	let r = (e) => [
		gn,
		A("cat.feed", "Generated Feed"),
		e
	], i = () => {
		t.feed = t.feed || {};
	};
	e({
		id: `${hn}.Feed.CardSize`,
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
		id: `${hn}.Feed.ShowInfo`,
		category: r("Show info section"),
		name: "Show card info section",
		tooltip: "Show or hide the entire info section (filename, metadata, dots) below thumbnails in the Generated Feed.",
		type: "boolean",
		defaultValue: !!(t.feed?.showInfo ?? k.FEED_SHOW_INFO),
		onChange: (e) => {
			i(), t.feed.showInfo = !!e, q(t), J(t), n("feed.showInfo");
		}
	}), e({
		id: `${hn}.Feed.ShowFilename`,
		category: r("Show filename"),
		name: "Show filename",
		tooltip: "Display the filename on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showFilename ?? k.FEED_SHOW_FILENAME),
		onChange: (e) => {
			i(), t.feed.showFilename = !!e, q(t), J(t), n("feed.showFilename");
		}
	}), e({
		id: `${hn}.Feed.ShowDimensions`,
		category: r("Show dimensions"),
		name: "Show dimensions",
		tooltip: "Display resolution (WxH) and duration on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showDimensions ?? k.FEED_SHOW_DIMENSIONS),
		onChange: (e) => {
			i(), t.feed.showDimensions = !!e, q(t), J(t), n("feed.showDimensions");
		}
	}), e({
		id: `${hn}.Feed.ShowDate`,
		category: r("Show date/time"),
		name: "Show date/time",
		tooltip: "Display date and time on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showDate ?? k.FEED_SHOW_DATE),
		onChange: (e) => {
			i(), t.feed.showDate = !!e, q(t), J(t), n("feed.showDate");
		}
	}), e({
		id: `${hn}.Feed.ShowGenTime`,
		category: r("Show generation time"),
		name: "Show generation time",
		tooltip: "Display the generation time badge on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showGenTime ?? k.FEED_SHOW_GENTIME),
		onChange: (e) => {
			i(), t.feed.showGenTime = !!e, q(t), J(t), n("feed.showGenTime");
		}
	}), e({
		id: `${hn}.Feed.ShowWorkflowDot`,
		category: r("Show workflow dot"),
		name: "Show workflow indicator",
		tooltip: "Display the workflow availability dot on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showWorkflowDot ?? k.FEED_SHOW_WORKFLOW_DOT),
		onChange: (e) => {
			i(), t.feed.showWorkflowDot = !!e, q(t), J(t), n("feed.showWorkflowDot");
		}
	}), e({
		id: `${hn}.Feed.ShowExtBadge`,
		category: r("Show format badges"),
		name: "Show format badges",
		tooltip: "Display format badges (e.g. JPG, MP4) on feed card thumbnails.",
		type: "boolean",
		defaultValue: !!(t.feed?.showExtBadge ?? k.FEED_SHOW_BADGES_EXTENSION),
		onChange: (e) => {
			i(), t.feed.showExtBadge = !!e, q(t), J(t), n("feed.showExtBadge");
		}
	}), e({
		id: `${hn}.Feed.ShowRatingBadge`,
		category: r("Show rating badges"),
		name: "Show ratings",
		tooltip: "Display star ratings on feed card thumbnails.",
		type: "boolean",
		defaultValue: !!(t.feed?.showRatingBadge ?? k.FEED_SHOW_BADGES_RATING),
		onChange: (e) => {
			i(), t.feed.showRatingBadge = !!e, q(t), J(t), n("feed.showRatingBadge");
		}
	}), e({
		id: `${hn}.Feed.ShowTagsBadge`,
		category: r("Show tags badges"),
		name: "Show tags",
		tooltip: "Display tag indicators on feed card thumbnails.",
		type: "boolean",
		defaultValue: !!(t.feed?.showTagsBadge ?? k.FEED_SHOW_BADGES_TAGS),
		onChange: (e) => {
			i(), t.feed.showTagsBadge = !!e, q(t), J(t), n("feed.showTagsBadge");
		}
	});
}
//#endregion
//#region ui/app/settings/settingsSecurity.ts
var vn = "Majoor", yn = "Majoor Assets Manager", bn = 16, xn = {
	safeMode: !1,
	allowWrite: !0,
	allowDelete: !0,
	allowRename: !0,
	allowOpenInFolder: !0,
	allowResetIndex: !0
};
function Sn(e) {
	return !!e;
}
function Cn(e, t) {
	return Sn(e) === Sn(t);
}
function wn(e) {
	return typeof e == "string" ? e.trim() : "";
}
function Tn(e) {
	let t = String(e || "").trim().toLowerCase();
	return t === "localhost" || t === "127.0.0.1" || t === "::1";
}
function En() {
	return globalThis.location || globalThis.window?.location || null;
}
function Dn() {
	let e = En();
	if (!e) return !1;
	let t = String(e.protocol || "").toLowerCase(), n = String(e.hostname || "").trim();
	return t === "http:" && !Tn(n);
}
function On(e) {
	let t = globalThis.crypto;
	if (!t?.getRandomValues) throw Error("Secure token generation requires crypto.getRandomValues().");
	return t.getRandomValues(e);
}
function kn(e) {
	let t = Math.max(4, Number(e) || 0), n = new Uint8Array(t);
	return On(n), Array.from(n, (e) => e.toString(16).padStart(2, "0")).join("");
}
function An() {
	return `mjr_${kn(18)}`;
}
function jn(e) {
	return String(e?.apiToken || "").trim().length >= bn && H(e?.allowWrite, !0) && H(e?.requireAuth, !1) && !H(e?.allowRemoteWrite, !1);
}
function Mn(e) {
	let t = String((e && typeof e == "object" ? e : {}).apiToken || "").trim();
	return {
		apiToken: t.length >= bn ? t : An(),
		allowWrite: !0,
		requireAuth: !0,
		allowRemoteWrite: !1,
		allowInsecureTokenTransport: Dn()
	};
}
function Nn(e) {
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
		allow_reset_index: H(t.allowResetIndex, !0),
		...String(t.apiToken || "").trim() ? { api_token: String(t.apiToken || "").trim() } : {}
	};
}
function Pn(e) {
	return l(Nn(e));
}
function Fn(e) {
	let t = String(e?.security?.tokenHint || "").trim();
	return t ? A("setting.sec.token.placeholderConfigured", "Token configured on server ({tokenHint}). Leave blank to keep the current server token.", { tokenHint: t }) : e?.security?.tokenConfigured ? A("setting.sec.token.placeholderConfiguredGeneric", "Token configured on server. Leave blank to keep the current server token.") : A("setting.sec.token.placeholder", "Auto-generated for this browser session.");
}
function In(e, t, n) {
	let r = (e, t) => [
		yn,
		e,
		t
	];
	e({
		id: `${vn}.Safety.ConfirmDeletion`,
		category: r(A("cat.security"), "Confirm before deleting"),
		name: "Confirm before deleting",
		tooltip: "Show a confirmation dialog before deleting files. Disabling this allows instant deletion.",
		type: "boolean",
		defaultValue: t.safety?.confirmDeletion !== !1,
		onChange: (e) => {
			Cn(t.safety?.confirmDeletion !== !1, e) || (t.safety = t.safety || {}, t.safety.confirmDeletion = !!e, q(t), J(t), n("safety.confirmDeletion"));
		}
	});
	let i = (i, a, o, s = "cat.security") => {
		e({
			id: `${vn}.Security.${i}`,
			category: r(A(s), A(a).replace("Majoor: ", "")),
			name: A(a),
			tooltip: A(o),
			type: "boolean",
			defaultValue: H(t.security?.[i], xn[i] ?? !1),
			onChange: (e) => {
				if (!Cn(t.security?.[i], e)) {
					t.security = t.security || {}, t.security[i] = !!e, q(t), n(`security.${i}`);
					try {
						Pn(t.security).then((e) => {
							e?.ok && e.data?.prefs ? Ut() : e && e.ok === !1 && console.warn("[Majoor] backend security settings update failed", e.error || e);
						}).catch(() => {});
					} catch (e) {
						console.debug?.(e);
					}
				}
			}
		});
	};
	i("safeMode", "setting.sec.safe.name", "setting.sec.safe.desc"), i("allowWrite", "setting.sec.write.name", "setting.sec.write.desc"), i("allowDelete", "setting.sec.del.name", "setting.sec.del.desc"), i("allowRename", "setting.sec.ren.name", "setting.sec.ren.desc"), i("allowOpenInFolder", "setting.sec.open.name", "setting.sec.open.desc"), i("allowResetIndex", "setting.sec.reset.name", "setting.sec.reset.desc"), e({
		id: `${vn}.Security.RemoteLanPreset`,
		category: r(A("cat.remote"), A("setting.sec.remoteLanPreset.name").replace("Majoor: ", "")),
		name: A("setting.sec.remoteLanPreset.name"),
		tooltip: A("setting.sec.remoteLanPreset.desc"),
		type: "boolean",
		defaultValue: jn(t.security),
		onChange: (e) => {
			if (t.security = t.security || {}, Cn(t.security.remoteLanPreset, e)) return;
			if (t.security.remoteLanPreset = !!e, !e) {
				q(t), n("security.remoteLanPreset");
				return;
			}
			let r;
			try {
				r = Mn(t.security);
			} catch (e) {
				s(e?.message || A("toast.remoteLanPresetFailed", "Failed to apply the recommended remote LAN setup."), "error");
				return;
			}
			Object.assign(t.security, r), t.security.tokenConfigured = !0, t.security.tokenHint = String(r.apiToken || "").trim() ? `...${String(r.apiToken).trim().slice(-4)}` : "", r.apiToken && E(r.apiToken), q(t), n("security.remoteLanPreset"), n("security.apiToken"), n("security.allowWrite"), n("security.requireAuth"), n("security.allowRemoteWrite"), n("security.allowInsecureTokenTransport");
			try {
				Pn(t.security).then((e) => {
					e?.ok && e.data?.prefs ? (Ut(), s(A("toast.remoteLanPresetApplied", "Recommended remote LAN setup applied. This browser session is now authorized for Majoor write operations."), "success")) : e && e.ok === !1 && (s(e.error || A("toast.remoteLanPresetFailed", "Failed to apply the recommended remote LAN setup."), "error"), console.warn("[Majoor] backend remote LAN preset update failed", e.error || e));
				}).catch((e) => {
					s(e?.message || A("toast.remoteLanPresetFailed", "Failed to apply the recommended remote LAN setup."), "error");
				});
			} catch (e) {
				console.debug?.(e);
			}
		}
	}), e({
		id: `${vn}.Security.ApiToken`,
		category: r(A("cat.remote"), A("setting.sec.token.name").replace("Majoor: ", "")),
		name: A("setting.sec.token.name", "Majoor: API Token"),
		tooltip: A("setting.sec.token.desc", "Store the API token used for write operations. Majoor sends it via X-MJR-Token and Authorization headers."),
		type: "text",
		defaultValue: t.security?.apiToken || "",
		attrs: { placeholder: Fn(t) },
		onChange: (e) => {
			t.security = t.security || {};
			let r = wn(e);
			if (wn(t.security.apiToken) !== r && (t.security.apiToken = r, t.security.apiToken && (t.security.tokenConfigured = !0, t.security.tokenHint = `...${t.security.apiToken.slice(-4)}`, E(t.security.apiToken)), q(t), n("security.apiToken"), t.security.apiToken)) try {
				l({ api_token: t.security.apiToken }).then((e) => {
					e?.ok && e.data?.prefs ? Ut() : e && e.ok === !1 && console.warn("[Majoor] backend token update failed", e.error || e);
				}).catch(() => {});
			} catch (e) {
				console.debug?.(e);
			}
		}
	}), i("requireAuth", "setting.sec.requireAuth.name", "setting.sec.requireAuth.desc", "cat.remote"), i("allowRemoteWrite", "setting.sec.remote.name", "setting.sec.remote.desc", "cat.remote"), i("allowInsecureTokenTransport", "setting.sec.insecureTransport.name", "setting.sec.insecureTransport.desc", "cat.remote");
}
//#endregion
//#region ui/app/settings/settingsAdvanced.ts
var X = "Majoor", Ln = "Majoor Assets Manager";
function Rn(e, r, o, c) {
	let l = (e, t) => [
		Ln,
		e,
		t
	], f = String(r.paths?.outputDirectory || ""), p = null, m = 0, g = null;
	e({
		id: `${X}.Paths.OutputDirectory`,
		category: l(A("cat.advanced"), "Paths / Output"),
		name: "Majoor: Generation Output Directory",
		tooltip: "Override the ComfyUI generation output directory used by Majoor (equivalent to --output-directory). Leave empty to keep the current backend default.",
		type: "text",
		defaultValue: String(r.paths?.outputDirectory || ""),
		attrs: { placeholder: "D:\\\\____COMFY_OUTPUTS" },
		onChange: async (e) => {
			let t = String(e || "").trim();
			r.paths = r.paths || {}, r.paths.outputDirectory = t, q(r);
			try {
				p &&= (clearTimeout(p), null);
			} catch (e) {
				console.debug?.(e);
			}
			p = setTimeout(async () => {
				p = null;
				let e = ++m;
				try {
					g?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				g = typeof AbortController < "u" ? new AbortController() : null;
				try {
					let n = await re(t, g ? { signal: g.signal } : {});
					if (e !== m) return;
					if (!n?.ok) throw Error(n?.error || A("toast.failedSetOutputDirectory", "Failed to set output directory"));
					let i = String(n?.data?.output_directory || t).trim();
					r.paths.outputDirectory = i, f = i, q(r), o("paths.outputDirectory");
				} catch (t) {
					if (e !== m || String(t?.name || "") === "AbortError" || String(t?.code || "") === "ABORTED") return;
					r.paths.outputDirectory = f, q(r), o("paths.outputDirectory"), s(t?.message || A("toast.failedSetOutputDirectory", "Failed to set output directory"), "error");
				}
			}, 700);
		}
	});
	try {
		te().then((e) => {
			if (!e?.ok) return;
			let t = String(e?.data?.output_directory || "").trim();
			r.paths = r.paths || {}, r.paths.outputDirectory !== t && (r.paths.outputDirectory = t, f = t, q(r), o("paths.outputDirectory"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	let _ = String(r.paths?.indexDirectory || ""), S = null, C = 0, w = null;
	e({
		id: `${X}.Paths.IndexDirectory`,
		category: l(A("cat.advanced"), "Paths / Index"),
		name: "Majoor: Index Database Directory",
		tooltip: "Override the Majoor index database directory. Use this to keep the SQLite index on a different local disk. Requires restart.",
		type: "text",
		defaultValue: String(r.paths?.indexDirectory || ""),
		attrs: { placeholder: "D:\\MajoorIndex" },
		onChange: async (e) => {
			let t = String(e || "").trim();
			r.paths = r.paths || {}, r.paths.indexDirectory = t, q(r);
			try {
				S &&= (clearTimeout(S), null);
			} catch (e) {
				console.debug?.(e);
			}
			S = setTimeout(async () => {
				S = null;
				let e = ++C;
				try {
					w?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				w = typeof AbortController < "u" ? new AbortController() : null;
				try {
					let n = await i(t, w ? { signal: w.signal } : {});
					if (e !== C) return;
					if (!n?.ok) throw Error(n?.error || A("toast.failedSetIndexDirectory", "Failed to set index directory"));
					let a = String(n?.data?.index_directory || t).trim(), c = a !== _;
					r.paths.indexDirectory = a, _ = a, q(r), o("paths.indexDirectory"), c && s(A("toast.indexDirectorySavedRestart", "Index directory saved. Restart ComfyUI to apply."), "success", void 0, { history: { trackId: "settings:index-directory-saved" } });
				} catch (t) {
					if (e !== C || String(t?.name || "") === "AbortError" || String(t?.code || "") === "ABORTED") return;
					r.paths.indexDirectory = _, q(r), o("paths.indexDirectory"), s(t?.message || A("toast.failedSetIndexDirectory", "Failed to set index directory"), "error");
				}
			}, 700);
		}
	});
	try {
		ue().then((e) => {
			if (!e?.ok) return;
			let t = String(e?.data?.index_directory || "").trim();
			r.paths = r.paths || {}, r.paths.indexDirectory !== t && (r.paths.indexDirectory = t, _ = t, q(r), o("paths.indexDirectory"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	let ne = ye().map((e) => e.code), ie = ["auto", ...ne];
	e({
		id: `${X}.Language`,
		category: l(A("cat.advanced"), A("setting.language.name", "Language")),
		name: A("setting.language.name", "Majoor: Language"),
		tooltip: "Use auto to detect and follow ComfyUI language. Or choose a fixed language for Majoor only.",
		type: "combo",
		defaultValue: r.i18n?.followComfyLanguage ? "auto" : Ee(),
		options: ie,
		onChange: (e) => {
			if (r.i18n = r.i18n || {}, e === "auto") {
				r.i18n.followComfyLanguage = !0, De(!0), we(c), q(r), o("language");
				return;
			}
			ne.includes(e) && (r.i18n.followComfyLanguage = !1, De(!1), be(e), q(r), o("language"));
		}
	}), e({
		id: `${X}.ProbeBackend.Mode`,
		category: l(A("cat.advanced"), A("setting.probe.mode.name").replace("Majoor: ", "")),
		name: A("setting.probe.mode.name"),
		tooltip: A("setting.probe.mode.desc") + " (env: MAJOOR_MEDIA_PROBE_BACKEND)",
		type: "combo",
		defaultValue: r.probeBackend?.mode || G.probeBackend.mode,
		options: [
			"auto",
			"exiftool",
			"ffprobe",
			"both"
		],
		onChange: (e) => {
			let n = gt(e, [
				"auto",
				"exiftool",
				"ffprobe",
				"both"
			], G.probeBackend.mode);
			r.probeBackend = r.probeBackend || {}, r.probeBackend.mode = n, q(r), J(r), o("probeBackend.mode"), t(n).catch(() => {});
		}
	}), e({
		id: `${X}.MetadataFallback.Image`,
		category: l(A("cat.advanced"), "Metadata"),
		name: "Majoor: Metadata Fallback (Images)",
		tooltip: "Enable Pillow fallback when ExifTool is missing or fails.",
		type: "boolean",
		defaultValue: r.metadataFallback?.image ?? G.metadataFallback.image,
		onChange: async (e) => {
			let t = !!e, n = !!(r.metadataFallback?.image ?? G.metadataFallback.image);
			r.metadataFallback = r.metadataFallback || {}, r.metadataFallback.image = t, q(r), o("metadataFallback.image");
			try {
				let e = await d({
					image: t,
					media: r.metadataFallback?.media ?? G.metadataFallback.media
				});
				if (!e?.ok) throw Error(e?.error || A("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"));
			} catch (e) {
				r.metadataFallback.image = n, q(r), o("metadataFallback.image"), s(e?.message || A("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"), "error");
			}
		}
	}), e({
		id: `${X}.MetadataFallback.Media`,
		category: l(A("cat.advanced"), "Metadata"),
		name: "Majoor: Metadata Fallback (Audio/Video)",
		tooltip: "Enable hachoir fallback when ffprobe is missing or fails.",
		type: "boolean",
		defaultValue: r.metadataFallback?.media ?? G.metadataFallback.media,
		onChange: async (e) => {
			let t = !!e, n = !!(r.metadataFallback?.media ?? G.metadataFallback.media);
			r.metadataFallback = r.metadataFallback || {}, r.metadataFallback.media = t, q(r), o("metadataFallback.media");
			try {
				let e = await d({
					image: r.metadataFallback?.image ?? G.metadataFallback.image,
					media: t
				});
				if (!e?.ok) throw Error(e?.error || A("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"));
			} catch (e) {
				r.metadataFallback.media = n, q(r), o("metadataFallback.media"), s(e?.message || A("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"), "error");
			}
		}
	});
	try {
		ce().then((e) => {
			if (!e?.ok || !e?.data?.prefs) return;
			let t = e.data.prefs || {}, n = !!(t.image ?? G.metadataFallback.image), i = !!(t.media ?? G.metadataFallback.media);
			r.metadataFallback = r.metadataFallback || {};
			let a = !1;
			r.metadataFallback.image !== n && (r.metadataFallback.image = n, a = !0), r.metadataFallback.media !== i && (r.metadataFallback.media = i, a = !0), a && (q(r), o("metadataFallback"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	e({
		id: `${X}.Db.Timeout`,
		category: l(A("cat.advanced"), "Database"),
		name: "DB Timeout (ms)",
		tooltip: "Client-side DB timeout preference (stored locally).",
		type: "number",
		defaultValue: Number(r.db?.timeoutMs || 5e3),
		attrs: {
			min: 1e3,
			max: 3e4,
			step: 1e3
		},
		onChange: (e) => {
			r.db = r.db || {}, r.db.timeoutMs = Math.max(1e3, Math.min(3e4, Math.round(U(e, 5e3)))), q(r), J(r), o("db.timeoutMs");
		}
	}), e({
		id: `${X}.Db.MaxConnections`,
		category: l(A("cat.advanced"), "Database"),
		name: "DB Max Connections",
		tooltip: "Client-side DB max connections preference (stored locally).",
		type: "number",
		defaultValue: Number(r.db?.maxConnections || 10),
		attrs: {
			min: 1,
			max: 100,
			step: 1
		},
		onChange: (e) => {
			r.db = r.db || {}, r.db.maxConnections = Math.max(1, Math.min(100, Math.round(U(e, 10)))), q(r), J(r), o("db.maxConnections");
		}
	}), e({
		id: `${X}.Db.QueryTimeout`,
		category: l(A("cat.advanced"), "Database"),
		name: "DB Query Timeout (ms)",
		tooltip: "Client-side DB query timeout preference (stored locally).",
		type: "number",
		defaultValue: Number(r.db?.queryTimeoutMs || 1e3),
		attrs: {
			min: 500,
			max: 1e4,
			step: 500
		},
		onChange: (e) => {
			r.db = r.db || {}, r.db.queryTimeoutMs = Math.max(500, Math.min(1e4, Math.round(U(e, 1e3)))), q(r), J(r), o("db.queryTimeoutMs");
		}
	}), e({
		id: `${X}.Observability.Enabled`,
		category: l(A("cat.advanced"), A("setting.obs.enabled.name").replace("Majoor: ", "")),
		name: A("setting.obs.enabled.name"),
		tooltip: A("setting.obs.enabled.desc"),
		type: "boolean",
		defaultValue: !!r.observability?.enabled,
		onChange: (e) => {
			r.observability = r.observability || {}, r.observability.enabled = !!e, q(r), J(r), o("observability.enabled");
		}
	}), e({
		id: `${X}.Observability.RuntimeDashboardMode`,
		category: l(A("cat.advanced"), "Runtime metrics badge"),
		name: "Majoor: Runtime metrics badge",
		tooltip: "Controls the small DB/enrichment/watcher metrics badge in the Assets Manager panel.",
		type: "combo",
		defaultValue: r.observability?.runtimeDashboardMode || G.observability.runtimeDashboardMode,
		options: [
			"autoHide30",
			"always",
			"hidden"
		],
		onChange: (e) => {
			let t = gt(e, [
				"autoHide30",
				"always",
				"hidden"
			], G.observability.runtimeDashboardMode);
			r.observability = r.observability || {}, r.observability.runtimeDashboardMode = t, q(r), o("observability.runtimeDashboardMode");
		}
	}), e({
		id: `${X}.Observability.VerboseErrors`,
		category: l(A("cat.advanced"), "Verbose error logging"),
		name: "Verbose error logging",
		tooltip: "Show detailed error messages in toasts and console. Useful for debugging.",
		type: "boolean",
		defaultValue: !!r.observability?.verboseErrors,
		onChange: (e) => {
			r.observability = r.observability || {}, r.observability.verboseErrors = !!e, q(r), J(r), o("observability.verboseErrors");
		}
	}), e({
		id: `${X}.Observability.VerboseRouteRegistrationLogs`,
		category: l(A("cat.advanced"), "Logs"),
		name: "Majoor: Verbose route registration logs",
		tooltip: "When disabled, Majoor prints a compact startup summary instead of listing every registered API route. Takes effect on the next backend restart.",
		type: "boolean",
		defaultValue: !!(r.observability?.verboseRouteRegistrationLogs ?? G.observability?.verboseRouteRegistrationLogs ?? !1),
		onChange: async (e) => {
			let t = !!e, n = !!(r.observability?.verboseRouteRegistrationLogs ?? G.observability?.verboseRouteRegistrationLogs ?? !1);
			r.observability = r.observability || {}, r.observability.verboseRouteRegistrationLogs = t, q(r), o("observability.verboseRouteRegistrationLogs");
			try {
				let e = await T(t);
				if (!e?.ok) throw Error(e?.error || "Failed to update route logging settings");
			} catch (e) {
				r.observability.verboseRouteRegistrationLogs = n, q(r), o("observability.verboseRouteRegistrationLogs"), s(e?.message || "Failed to update route logging settings", "error");
			}
		}
	}), (async () => {
		try {
			let e = !!(await b())?.data?.prefs?.enabled;
			r.observability = r.observability || {}, r.observability.verboseRouteRegistrationLogs !== e && (r.observability.verboseRouteRegistrationLogs = e, q(r), o("observability.verboseRouteRegistrationLogs"));
		} catch (e) {
			console.debug?.(e);
		}
	})(), e({
		id: `${X}.Observability.VerboseStartupLogs`,
		category: l(A("cat.advanced"), "Logs"),
		name: "Majoor: Verbose startup logs",
		tooltip: "When disabled, Majoor suppresses most informational bootstrap logs during backend startup while keeping warnings and errors. Takes effect on the next backend restart.",
		type: "boolean",
		defaultValue: !!(r.observability?.verboseStartupLogs ?? G.observability?.verboseStartupLogs ?? !1),
		onChange: async (e) => {
			let t = !!e, n = !!(r.observability?.verboseStartupLogs ?? G.observability?.verboseStartupLogs ?? !1);
			r.observability = r.observability || {}, r.observability.verboseStartupLogs = t, q(r), o("observability.verboseStartupLogs");
			try {
				let e = await u(t);
				if (!e?.ok) throw Error(e?.error || "Failed to update startup logging settings");
			} catch (e) {
				r.observability.verboseStartupLogs = n, q(r), o("observability.verboseStartupLogs"), s(e?.message || "Failed to update startup logging settings", "error");
			}
		}
	}), (async () => {
		try {
			let e = !!(await x())?.data?.prefs?.enabled;
			r.observability = r.observability || {}, r.observability.verboseStartupLogs !== e && (r.observability.verboseStartupLogs = e, q(r), o("observability.verboseStartupLogs"));
		} catch (e) {
			console.debug?.(e);
		}
	})();
	{
		let t = "HuggingFace Token", i = "", a = null, c = 0, u = !!r.ai?.huggingFaceTokenVisible, d = () => {
			try {
				let e = Array.from(document.querySelectorAll("input[data-mjr-hf-token=\"1\"]"));
				for (let t of e) try {
					t.type = u ? "text" : "password";
				} catch (e) {
					console.debug?.(e);
				}
			} catch (e) {
				console.debug?.(e);
			}
		}, f = (e) => {
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
		e({
			id: `${X}.AI.HuggingFaceTokenVisible`,
			category: l(A("cat.advanced"), t),
			name: "Show HuggingFace token",
			tooltip: "Show or hide the HuggingFace token while editing.",
			type: "boolean",
			defaultValue: u,
			onChange: (e) => {
				let t = !!e;
				u = t, r.ai = r.ai || {}, r.ai.huggingFaceTokenVisible = t, q(r), o("ai.huggingFaceTokenVisible"), setTimeout(d, 0);
			}
		}), e({
			id: `${X}.AI.HuggingFaceToken`,
			category: l(A("cat.advanced"), t),
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
				type: u ? "text" : "password",
				autocomplete: "new-password",
				name: "mjr_huggingface_token",
				"data-mjr-hf-token": "1"
			},
			onChange: (e) => {
				let t = String(e || "").trim();
				if (t !== i) {
					try {
						a &&= (clearTimeout(a), null);
					} catch (e) {
						console.debug?.(e);
					}
					a = setTimeout(async () => {
						a = null;
						let e = ++c;
						try {
							let n = await h(t);
							if (e !== c) return;
							if (!n?.ok) throw Error(n?.error || "Failed to update HuggingFace token");
							i = t, o("ai.huggingFaceToken"), t ? s("HuggingFace token saved", "success") : s("HuggingFace token cleared", "success", void 0, { noHistory: !0 });
						} catch (t) {
							if (e !== c) return;
							s(t?.message || "Failed to update HuggingFace token", "error");
						}
					}, 900);
				}
			}
		}), setTimeout(d, 0), (async () => {
			try {
				let e = (await ee())?.data?.prefs || {}, t = !!e?.has_token, n = String(e?.token_hint || "").trim();
				f(t ? `Configured ${n || "(saved)"}` : "Paste HuggingFace token (hf_...)");
			} catch (e) {
				console.debug?.(e);
			}
		})(), e({
			id: `${X}.AI.VerboseLogs`,
			category: l(A("cat.advanced"), t),
			name: "Majoor: Verbose AI logs",
			tooltip: "Enable detailed HuggingFace/SigLIP2/X-CLIP logs and progress bars during model download/loading.",
			type: "boolean",
			defaultValue: !!(r.ai?.verboseAiLogs ?? G.ai?.verboseAiLogs ?? !1),
			onChange: async (e) => {
				let t = !!e, i = !!(r.ai?.verboseAiLogs ?? G.ai?.verboseAiLogs ?? !1);
				r.ai = r.ai || {}, r.ai.verboseAiLogs = t, q(r), o("ai.verboseAiLogs");
				try {
					let e = await n(t);
					if (!e?.ok) throw Error(e?.error || "Failed to update AI logging settings");
				} catch (e) {
					r.ai.verboseAiLogs = i, q(r), o("ai.verboseAiLogs"), s(e?.message || "Failed to update AI logging settings", "error");
				}
			}
		}), (async () => {
			try {
				let e = !!(await v())?.data?.prefs?.enabled;
				r.ai = r.ai || {}, r.ai.verboseAiLogs !== e && (r.ai.verboseAiLogs = e, q(r), o("ai.verboseAiLogs"));
			} catch (e) {
				console.debug?.(e);
			}
		})();
	}
	e({
		id: `${X}.AI.VectorStats`,
		category: l(A("cat.advanced"), "AI / Vector Search"),
		name: "Vector Index Status",
		tooltip: "Current status of the SigLIP2/X-CLIP vector index used for semantic search",
		type: "text",
		defaultValue: "Loading vector status..."
	}), (async () => {
		try {
			let e = await a();
			e?.ok ? console.debug?.("[Majoor] Vector status:", `${e.data?.total || 0} assets indexed | Model: ${e.data?.model || "N/A"}`) : console.debug?.("[Majoor] Vector status unavailable");
		} catch (e) {
			console.debug?.("[Majoor] Vector status fetch failed", e);
		}
	})(), e({
		id: `${X}.AI.VectorBackfillAction`,
		category: l(A("cat.advanced"), "AI / Vector Search"),
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
				s(A("toast.vectorBackfillStarting", "Starting vector backfill... This may take a while."), "info", void 0, { history: {
					...t.history,
					status: "started",
					detail: "Starting vector backfill... This may take a while."
				} });
				let e = await me(64, { onProgress: (e) => {
					let n = String(e?.status || "running").toLowerCase() || "running", r = e?.progress || e?.result || {}, i = Number(r?.candidates ?? r?.processed ?? 0), a = Number(r?.indexed ?? 0), o = Number(r?.skipped ?? 0), s = Number(r?.errors ?? 0), c = Math.max(i, a + o + s), l = c > 0 ? Math.round((a + o + s) / c * 100) : null, u = n === "queued" ? "Vector backfill queued" : `Candidates ${i}, indexed ${a}, skipped ${o}, errors ${s}`;
					y({
						summary: "Vector Backfill",
						detail: u
					}, n === "failed" ? "error" : n === "succeeded" ? "success" : "info", 0, { history: {
						...t.history,
						status: n,
						detail: u,
						progress: {
							current: a + o + s,
							total: c,
							percent: l,
							indexed: a,
							skipped: o,
							errors: s,
							label: n
						}
					} });
				} });
				if (e?.ok) {
					let n = e.data || {}, r = String(n?.status || "").toLowerCase(), i = !!n?.pending || [
						"queued",
						"running",
						"pending"
					].includes(r), o = n?.progress || {}, c = Number(n?.processed ?? o?.candidates ?? 0), l = Number(n?.indexed ?? o?.indexed ?? 0), u = Number(n?.skipped ?? o?.skipped ?? 0);
					if (i) {
						let e = String(n?.job_id || "").trim();
						s(A("toast.vectorBackfillRunning", "Vector backfill still running in background{job}.", { job: e ? ` (job ${e.slice(0, 8)})` : "" }), "info", void 0, { history: {
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
					} else s(A("toast.vectorBackfillComplete", "Vector backfill complete! Processed: {processed}, Indexed: {indexed}, Skipped: {skipped}", {
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
						let e = await a();
						e?.ok && console.debug?.("[Majoor] Vector stats after backfill:", e.data);
					} catch (e) {
						console.debug?.("[Majoor] Failed to refresh vector stats:", e);
					}
				} else throw Error(e?.error || A("toast.vectorBackfillFailedGeneric", "Backfill failed"));
			} catch (e) {
				let n = e?.message || String(e || A("status.unknown", "unknown"));
				s(A("toast.vectorBackfillFailedDetail", "Vector backfill failed: {error}", { error: n }), "error", void 0, { history: {
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
var zn = "Majoor", Bn = "Majoor Assets Manager";
function Vn(e, t, n) {
	let r = (e, t) => [
		Bn,
		e,
		t
	];
	e({
		id: `${zn}.AI.VectorSearchEnabled`,
		category: r(A("cat.search", "Search"), "AI"),
		name: A("setting.ai.vector.enabled.name", "Enable AI semantic search"),
		tooltip: A("setting.ai.vector.enabled.desc", "Enable/disable AI vector search features (SigLIP2/X-CLIP: description search, prompt alignment, AI tag suggestions, smart collections)."),
		type: "boolean",
		defaultValue: !!(t.ai?.vectorSearchEnabled ?? !0),
		onChange: async (e) => {
			t.ai = t.ai || {};
			let r = !!(t.ai.vectorSearchEnabled ?? !0), i = !!e;
			t.ai.vectorSearchEnabled = i, q(t), J(t), n("ai.vectorSearchEnabled");
			try {
				let e = await p(i);
				if (!e?.ok) {
					t.ai.vectorSearchEnabled = r, q(t), J(t), n("ai.vectorSearchEnabled"), s(e?.error || "Failed to update AI vector search setting", "error");
					return;
				}
				s(i ? "AI semantic search enabled" : "AI semantic search disabled", "info", 2200);
			} catch (e) {
				t.ai.vectorSearchEnabled = r, q(t), J(t), n("ai.vectorSearchEnabled"), s(e?.message || "Failed to update AI vector search setting", "error");
			}
		}
	}), e({
		id: `${zn}.AI.VectorCaptionOnIndex`,
		category: r(A("cat.search", "Search"), "AI"),
		name: A("setting.ai.vector.captionOnIndex.name", "Generate AI captions during indexing"),
		tooltip: A("setting.ai.vector.captionOnIndex.desc", "Allow automatic vector indexing and backfill to run Florence-2 captions for image assets. This is slower and can use significant VRAM/CPU; leave it off for faster grid startup."),
		type: "boolean",
		defaultValue: !!(t.ai?.vectorCaptionOnIndex ?? !1),
		onChange: async (e) => {
			t.ai = t.ai || {};
			let r = !!(t.ai.vectorCaptionOnIndex ?? !1), i = !!e;
			t.ai.vectorCaptionOnIndex = i, q(t), J(t), n("ai.vectorCaptionOnIndex");
			try {
				let e = await p({ caption_on_index: i });
				if (!e?.ok) {
					t.ai.vectorCaptionOnIndex = r, q(t), J(t), n("ai.vectorCaptionOnIndex"), s(e?.error || "Failed to update AI caption indexing setting", "error");
					return;
				}
				i && s("AI captions during indexing enabled", "info", 2600);
			} catch (e) {
				t.ai.vectorCaptionOnIndex = r, q(t), J(t), n("ai.vectorCaptionOnIndex"), s(e?.message || "Failed to update AI caption indexing setting", "error");
			}
		}
	}), e({
		id: `${zn}.Search.MaxResults`,
		category: r(A("cat.search", "Search")),
		name: A("setting.search.maxResults.name", "Max search results (client)"),
		tooltip: A("setting.search.maxResults.desc", "Maximum number of results requested per search. The backend still enforces MAJOOR_SEARCH_MAX_LIMIT; increase that env var if you need a higher hard cap."),
		type: "number",
		defaultValue: Number(t.search?.maxResults || k.SEARCH_DEFAULT_LIMIT),
		attrs: {
			min: 10,
			max: k.MAX_PAGE_SIZE || 2e3,
			step: 1
		},
		onChange: (e) => {
			t.search = t.search || {}, t.search.maxResults = Math.max(10, Math.min(k.MAX_PAGE_SIZE || 2e3, Number(e) || k.SEARCH_DEFAULT_LIMIT)), q(t), J(t), n("search.maxResults");
		}
	}), e({
		id: `${zn}.EnvVars.Reference`,
		category: r(A("cat.advanced"), "Environment variables"),
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
var Hn = "Majoor Assets Manager", Un = /^\s*Majoor:\s*/i, Wn = Object.freeze({
	ASSETS_PANEL: "Assets Panel",
	GENERATED_FEED: "Generated Feed",
	VIEWER: "Viewer & Floating Viewer",
	INDEXING: "Indexing & Watcher",
	SEARCH_AI: "Search & AI",
	GENERAL: "General",
	ADVANCED: "Advanced",
	SECURITY: "Security"
}), Gn = new Set([
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
]), Kn = "Majoor.General.ResetAllSettings", qn = "mjr-settings-reset-btn", Jn = null, Yn = null;
function Xn(e) {
	let t = String(e || "").trim();
	return t ? /^Majoor\.(Safety|Security)\./.test(t) ? Wn.SECURITY : /^Majoor\.(Paths|ProbeBackend|MetadataFallback|Db|Observability)\./.test(t) || t === "Majoor.EnvVars.Reference" || t === "Majoor.AI.HuggingFaceTokenVisible" || t === "Majoor.AI.HuggingFaceToken" || t === "Majoor.AI.VerboseLogs" || t === "Majoor.AI.VectorStats" || t === "Majoor.AI.VectorBackfillAction" ? Wn.ADVANCED : /^Majoor\.(Viewer|WorkflowMinimap)\./.test(t) ? Wn.VIEWER : /^Majoor\.Feed\./.test(t) ? Wn.GENERATED_FEED : /^Majoor\.(AutoScan|Scan|Watcher|ExecutionGrouping|RatingTagsSync)\./.test(t) ? Wn.INDEXING : t === "Majoor.RtHydrate.Concurrency" ? Wn.ADVANCED : t === "Majoor.AI.VectorSearchEnabled" || t === "Majoor.AI.VectorCaptionOnIndex" || /^Majoor\.Search\./.test(t) ? Wn.SEARCH_AI : /^Majoor\.(Grid|Cards|Badges|Sidebar|InfiniteScroll|General)\./.test(t) ? Wn.ASSETS_PANEL : Wn.GENERAL : Wn.GENERAL;
}
function Zn(e) {
	let t = Array.isArray(e?.category) ? e.category.filter(Boolean) : [], n = Xn(e?.id), r = String(t[1] || t[0] || "").trim(), i = String(t[2] || "").trim(), a = String(e?.name || "").replace(Un, "").trim();
	return [
		Hn,
		n,
		i || r || a || n
	];
}
var Qn = !1, $n = null, er = null, tr = !1, nr = /* @__PURE__ */ new Set();
function rr(e) {
	if (!e || typeof e != "object") return null;
	let t = { ...e };
	try {
		typeof t.name == "string" && (t.name = t.name.replace(Un, "").trim());
	} catch (e) {
		console.debug?.(e);
	}
	try {
		t.category = Zn(t);
	} catch {
		t.category = [Hn, Wn.GENERAL];
	}
	return !t.tooltip && typeof t.name == "string" && t.name.trim() && (t.tooltip = t.name.trim()), t;
}
function ir(e, t, n) {
	let r = String(t?.id || "").trim();
	if (!r || nr.has(r)) return !1;
	nr.add(r);
	try {
		return ve(e, r, n);
	} finally {
		nr.delete(r);
	}
}
function ar(e, t) {
	if (!t || typeof t != "object") return t;
	let n = { ...t };
	ir(e, n, n.defaultValue);
	let r = n.onChange;
	return n.onChange = (t, ...i) => {
		if (ir(e, n, t), typeof r == "function") return r(t, ...i);
		n.defaultValue = t;
	}, n;
}
function or(e) {
	try {
		return JSON.parse(JSON.stringify(e || {}));
	} catch {
		return { ...G };
	}
}
function sr(e, t, n, { wrapForComfy: r = !0 } = {}) {
	let i = [], a = (e) => {
		let n = rr(e);
		n && i.push(r ? ar(t, n) : n);
	};
	return cn(a, e, n), _n(a, e, n), dn(a, e, n), mn(a, e, n), In(a, e, n), Rn(a, e, n, t), Vn(a, e, n), i;
}
function cr(e, t) {
	if (e === t) return !0;
	try {
		return JSON.stringify(e) === JSON.stringify(t);
	} catch {
		return !1;
	}
}
function lr(e) {
	return e ? e.querySelector(".form-input") || e.querySelector(".p-inputgroup") || e.querySelector(".setting-input") || e.querySelector("[class*='input']") : null;
}
function ur(e, t) {
	let n = document.createElement("button");
	return n.type = "button", n.className = qn, n.textContent = e, n.title = t, n.style.marginLeft = "8px", n.style.minWidth = e.length > 2 ? "auto" : "24px", n.style.height = "24px", n.style.padding = e.length > 2 ? "0 10px" : "0", n.style.borderRadius = "6px", n.style.border = "1px solid var(--border-color, #555)", n.style.background = "var(--comfy-input-bg, #2b2b2b)", n.style.color = "var(--input-text, inherit)", n.style.cursor = "pointer", n.style.fontSize = "12px", n.style.lineHeight = "22px", n.style.flexShrink = "0", n;
}
function dr(e, t, n) {
	String(e?.id || "").trim() && (ir(n, e, t), typeof e?.onChange == "function" && e.onChange(t));
}
function fr(e, t, n, r) {
	let i = !cr(Se(r, t.id, t.defaultValue), n);
	e.disabled = !i, e.style.opacity = i ? "1" : "0.45";
}
function pr() {
	if (typeof document > "u" || !Yn) return;
	let { app: e, definitions: t, defaultValues: n } = Yn, r = document.querySelector(`[data-setting-id="${Kn}"]`), i = lr(r);
	if (r && i && !r.getAttribute("data-mjr-reset-injected")) {
		r.setAttribute("data-mjr-reset-injected", "true"), i.innerHTML = "";
		let a = ur("Reset all settings", "Reset all Majoor settings to defaults");
		a.onclick = (r) => {
			r.preventDefault(), r.stopPropagation();
			for (let r of t) r.id !== Kn && n.has(r.id) && dr(r, n.get(r.id), e);
			pr();
		}, i.appendChild(a);
	}
	for (let r of t) {
		if (!r?.id || r.id === Kn || !n.has(r.id)) continue;
		let t = document.querySelector(`[data-setting-id="${r.id}"]`);
		if (!t || t.getAttribute("data-mjr-reset-injected")) continue;
		let i = lr(t);
		if (!i) continue;
		t.setAttribute("data-mjr-reset-injected", "true");
		let a = ur("Reset", "Reset this setting to default");
		fr(a, r, n.get(r.id), e), a.onclick = (t) => {
			t.preventDefault(), t.stopPropagation();
			let i = n.get(r.id);
			dr(r, i, e), fr(a, r, i, e);
		}, i.appendChild(a);
	}
}
function mr(e, t, n) {
	typeof document > "u" || typeof MutationObserver > "u" || (Yn = {
		app: e,
		definitions: t,
		defaultValues: new Map(n.filter((e) => e?.id && e.id !== Kn).map((e) => [e.id, e.defaultValue]))
	}, pr(), !Jn && (Jn = new MutationObserver(() => pr()), Jn.observe(document.body, {
		childList: !0,
		subtree: !0
	})));
}
function hr(e, t, { initRuntime: n = !1 } = {}) {
	if (er) typeof t == "function" && er.onAppliedListeners.add(t), e && !er.app && (er.app = e);
	else {
		let n = K();
		n.i18n = n.i18n || {}, typeof n.i18n.followComfyLanguage == "boolean" ? De(!!n.i18n.followComfyLanguage) : (n.i18n.followComfyLanguage = !0, De(!0), q(n));
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
		}, c = on(o, 120), l = on(s, 450), u = (e) => {
			typeof e == "string" && i.add(e), c();
		}, d = (e) => {
			typeof e == "string" && a.add(e), l();
		}, f = () => {
			let e = K();
			Object.assign(n, e), J(n), u("storage");
		}, p = (e) => {
			!e || e.key !== "mjrSettings" || e.newValue !== e.oldValue && f();
		};
		if (!Qn) {
			if ($n && typeof window < "u") try {
				window.removeEventListener("storage", $n);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				window.addEventListener("storage", p), Qn = !0, $n = p;
			} catch (e) {
				console.debug?.(e);
			}
		}
		er = {
			app: e,
			notifyApplied: (e) => {
				for (let t of r) try {
					t(n, e);
				} catch (e) {
					console.debug?.(e);
				}
				Gn.has(String(e || "")) ? d(e) : u(e);
			},
			onAppliedListeners: r,
			refreshFromStorage: f,
			settings: n
		};
	}
	if (n && !tr) {
		let t = e || er.app, n = er.settings;
		we(t), J(n), xe(t), Ut(), Wt(), Gt(), n?.watcher && typeof n.watcher.enabled == "boolean" && c(!!n.watcher.enabled).catch(() => {}), rn(), tr = !0;
	}
	return er;
}
var gr = (e, t) => hr(e, t, { initRuntime: !0 }).settings, _r = (e, t) => {
	let n = hr(e, t, { initRuntime: !1 });
	Object.assign(n.settings, K());
	let r = e || n.app, i = sr(n.settings, r, n.notifyApplied), a = sr(or(G), r, () => {}, { wrapForComfy: !1 });
	return i.unshift(ar(r, {
		id: Kn,
		category: [
			Hn,
			Wn.GENERAL,
			"Reset"
		],
		name: "Reset all settings to defaults",
		tooltip: "Reset every Majoor Assets Manager setting to its default value.",
		type: "text",
		defaultValue: ""
	})), mr(r, i, a), i;
};
try {
	let e = K();
	e?.watcher && typeof e.watcher.enabled == "boolean" && C().then((e) => {
		let t = !!e?.ok && !!e?.data?.enabled, n = K();
		n.watcher = n.watcher || {}, typeof t == "boolean" && t !== !!n.watcher.enabled && (n.watcher.enabled = t, q(n), ht("mjr-settings-changed", { key: "watcher.enabled" }, { warnPrefix: "[Majoor]" }));
	}).catch(() => {});
} catch (e) {
	console.debug?.(e);
}
//#endregion
//#region ui/features/status/AssetStatusDotTheme.ts
function vr(e) {
	return String(e || "").trim().toLowerCase();
}
function yr({ dot: e = null, asset: t = null, scope: n = "" } = {}) {
	let r = vr(n);
	if (r) return r === "custom";
	let i = vr(t?.type || t?.scope);
	if (i) return i === "custom";
	try {
		let t = vr(e?.closest?.(".mjr-grid")?.dataset?.mjrScope);
		if (t) return t === "custom";
	} catch (e) {
		console.debug?.(e);
	}
	return !1;
}
function br(e, t = {}) {
	let n = vr(e);
	return yr(t) ? n === "pending" || n === "info" ? "var(--mjr-browser-status-info, #4DB6AC)" : n === "success" ? "var(--mjr-browser-status-success, #2E7D32)" : n === "warning" ? "var(--mjr-browser-status-warning, #FFB74D)" : n === "error" ? "var(--mjr-browser-status-error, #EF5350)" : "var(--mjr-browser-status-neutral, #90A4AE)" : n === "pending" || n === "info" ? "var(--mjr-status-info, #64B5F6)" : n === "success" ? "var(--mjr-status-success, #4CAF50)" : n === "warning" ? "var(--mjr-status-warning, #FFA726)" : n === "error" ? "var(--mjr-status-error, #f44336)" : "var(--mjr-status-neutral, #666)";
}
//#endregion
//#region ui/stores/useRuntimeStore.ts
var xr = ot("mjr-runtime", () => {
	let e = j(null), t = j(null), n = j(!1), r = j(0), i = j(null), a = j(null), o = j(null), s = j(null), c = j(null), l = j([]), u = M(() => !!i.value), d = M(() => {
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
function Sr() {
	try {
		return st() ? xr() : null;
	} catch {
		return null;
	}
}
//#endregion
//#region ui/stores/runtimeEnrichmentState.ts
var Cr = Symbol.for("majoor.assets_manager.runtime_state");
function wr() {
	return {
		api: null,
		assetsDeletedHandler: null,
		enrichmentActive: !1,
		enrichmentQueueLength: 0
	};
}
function Tr() {
	try {
		let e = typeof globalThis < "u" ? globalThis : {};
		return (!e[Cr] || typeof e[Cr] != "object") && (e[Cr] = wr()), e[Cr];
	} catch {
		return wr();
	}
}
function Er(e, t) {
	let n = Sr();
	if (n) {
		n.setEnrichmentState(e, t);
		return;
	}
	let r = Tr();
	r.enrichmentActive = !!e, r.enrichmentQueueLength = Math.max(0, Number(t || 0) || 0);
}
function Dr() {
	let e = Sr();
	if (e) return e.getEnrichmentState();
	let t = Tr();
	return {
		active: !!t.enrichmentActive,
		queueLength: Math.max(0, Number(t.enrichmentQueueLength || 0) || 0)
	};
}
//#endregion
//#region ui/features/grid/AssetCardRenderer.ts
function Or(e) {
	try {
		return String(e || "").trim().toLowerCase();
	} catch {
		return "";
	}
}
function kr(e) {
	try {
		return (String(e || "").split(".").pop() || "").toUpperCase();
	} catch {
		return "";
	}
}
function Ar(e) {
	try {
		let t = String(e || ""), n = t.lastIndexOf("."), r = n > 0 ? t.slice(0, n) : t;
		return String(r || "").trim().toLowerCase();
	} catch {
		return "";
	}
}
function jr(e) {
	try {
		if (String(e?.kind || "").toLowerCase() !== "video") return !1;
		let t = String(e?.filename || "").toLowerCase();
		return t.includes("-audio") || t.includes("_audio");
	} catch {
		return !1;
	}
}
function Mr(e) {
	try {
		let t = String(e?.kind || "").toLowerCase(), n = 0;
		jr(e) ? n = 2 : t === "video" && (n = 1);
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
function Nr(e, t) {
	for (let n = 0; n < Math.max(e.length, t.length); n++) {
		let r = (e[n] || 0) - (t[n] || 0);
		if (r !== 0) return r;
	}
	return 0;
}
function Pr(e) {
	if (!Array.isArray(e) || e.length === 0) return null;
	if (e.length === 1) return e[0];
	let t = e[0], n = Mr(t);
	for (let r = 1; r < e.length; r++) {
		let i = e[r], a = Mr(i);
		Nr(a, n) > 0 && (t = i, n = a);
	}
	return t;
}
function Fr(e, t) {
	if (!e || !Array.isArray(t) || t.length === 0 || (Number(e?.generation_time_ms ?? e?.metadata?.generation_time_ms ?? 0) || 0) > 0) return e;
	let n = t.find((e) => (Number(e?.generation_time_ms ?? e?.metadata?.generation_time_ms ?? 0) || 0) > 0);
	if (!n) return e;
	let r = Number(n?.generation_time_ms ?? n?.metadata?.generation_time_ms ?? 0) || 0;
	return r <= 0 ? e : (e.generation_time_ms = r, !e.has_generation_data && n?.has_generation_data && (e.has_generation_data = n.has_generation_data), e);
}
function Ir(e, t) {
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
function Lr(e) {
	try {
		return !!e()?.siblings?.hidePngSiblings;
	} catch {
		return !1;
	}
}
function Rr(e) {
	return `${String(e?.source || e?.type || "").trim().toLowerCase()}|${String(e?.root_id || e?.custom_root_id || "").trim().toLowerCase()}|${String(e?.subfolder || "").trim().toLowerCase()}`;
}
function zr(e) {
	let t = Or(e?.filename);
	return t ? `${Rr(e)}|${t}` : "";
}
function Br(e, t = kr(e?.filename || "")) {
	let n = Ir(e, t), r = String(e?.filename || "").trim();
	if (!r) return "";
	let i = Rr(e);
	if (n === "model3d") return `${i}|model3d|${r.toLowerCase()}`;
	let a = Ar(r);
	return a ? `${i}|media|${a}` : "";
}
function Vr(e) {
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
function Hr(e, t, n) {
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
function Ur(e, t, n, r) {
	let i = n.stemMap.get(t);
	if (!i?.length) return [];
	let a = [];
	for (let e = i.length - 1; e >= 0; e--) r(i[e]) && (a.push(i[e]), i.splice(e, 1));
	return i.length || n.stemMap.delete(t), a;
}
function Wr(e, t, n) {
	if (!Lr(n)) return {
		hidden: !1,
		hideEnabled: !1,
		removed: []
	};
	let r = Vr(t), i = String(e?.filename || ""), a = kr(i), o = Ir(e, a), s = Br(e, a);
	if (!s) return {
		hidden: !1,
		hideEnabled: !0,
		removed: []
	};
	if (o === "video" || o === "audio" || o === "model3d" || a === "WEBP") return r.nonImageSiblingKeys.add(s), {
		hidden: !1,
		hideEnabled: !0,
		removed: Ur(t, s, r, (e) => kr(e?.filename || "") === "PNG")
	};
	if (a === "PNG") {
		let t = `${Rr(e)}|model3d|${Ar(i)}`;
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
function Gr(e, t, n, r) {
	let i = Lr(r.loadMajoorSettings), a = n.filenameCounts || /* @__PURE__ */ new Map();
	n.filenameCounts = a, r.clearGridMessage(e);
	let o = r.ensureVirtualGrid(e, n);
	if (!o) return 0;
	i || (n.hiddenPngSiblings = 0), n.assetKeyFn = r.assetKey;
	let s = Vr(n), c = /* @__PURE__ */ new Map();
	for (let e of n.assets || []) {
		let t = zr(e);
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
				let l = Fr(Pr(s), s), u = s.filter((e) => e !== l);
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
		let t = kr(String(e?.filename || "")), i = Wr(e, n, r.loadMajoorSettings);
		for (let e of i.removed || []) f.add(e);
		if (i.hidden) {
			n.hiddenPngSiblings += 1;
			continue;
		}
		let a = zr(e);
		if (a) {
			let t = c.get(a);
			t || (t = [], c.set(a, t)), t.push(e);
		}
		let o = r.assetKey(e);
		if (!o || s.seenKeys.has(o) || e.id != null && s.assetIdSet.has(String(e.id))) continue;
		s.seenKeys.add(o), e.id != null && s.assetIdSet.add(String(e.id)), d.push(e);
		let u = Br(e, t);
		if (u) {
			let t = s.stemMap.get(u);
			t || (t = [], s.stemMap.set(u, t)), t.push(e);
		}
		l++;
	}
	if (f.size > 0) {
		n.hiddenPngSiblings += f.size, n.assets = n.assets.filter((e) => !f.has(e));
		for (let e = d.length - 1; e >= 0; e--) f.has(d[e]) && (d.splice(e, 1), l = Math.max(0, l - 1));
		for (let e of f) Hr(n, e, s);
		try {
			for (let e of f) {
				let t = zr(e);
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
function Kr({ ext: e = "", filename: t = "", count: n = 0, paths: r = [] } = {}) {
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
function qr(e, t, n = !1, r = null) {
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
	}[Ir({ kind: t }, a)], s = o ? `var(${o}, #607D8B)` : "#607D8B", c = n ? "var(--mjr-badge-duplicate-alert, #ff1744)" : s;
	i.textContent = a + (n ? "+" : ""), i.title = n ? Kr({
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
function Jr(e, t, n = null) {
	if (e) try {
		let r = e.dataset?.mjrExt || "", i = e.dataset?.mjrBadgeBg || "var(--mjr-badge-image, #607D8B)";
		e.textContent = String(r || "") + (t ? "+" : ""), e.title = t ? Kr({
			ext: r,
			filename: n?.filename || "",
			count: n?.count,
			paths: n?.paths
		}) : `${r} file`, e.style.background = t ? "var(--mjr-badge-duplicate-alert, #ff1744)" : i, e.style.cursor = t ? "pointer" : "default";
	} catch (e) {
		console.debug?.(e);
	}
}
function Yr(e) {
	return e === !0 ? !0 : e === !1 ? !1 : e === 1 || e === "1" ? !0 : e === 0 || e === "0" ? !1 : null;
}
function Xr(e, t = []) {
	if (!e || typeof e != "object") return null;
	for (let n of t) if (e[n] != null) return e[n];
	return null;
}
function Zr(e) {
	return typeof e == "string" && e.trim().length > 0;
}
function Qr(e) {
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
function $r(e) {
	let t = Xr(e, [
		"auto_tags",
		"autoTags",
		"ai_auto_tags",
		"aiAutoTags",
		"suggested_tags",
		"suggestedTags"
	]), n = Xr(e, [
		"enhanced_caption",
		"enhancedCaption",
		"enhanced_prompt",
		"enhancedPrompt",
		"ai_enhanced_prompt",
		"aiEnhancedPrompt"
	]), r = Yr(Xr(e, [
		"has_ai_auto_tags",
		"hasAiAutoTags",
		"ai_has_auto_tags",
		"aiHasAutoTags"
	])), i = Yr(Xr(e, [
		"has_ai_enhanced_caption",
		"hasAiEnhancedCaption",
		"ai_has_enhanced_caption",
		"aiHasEnhancedCaption"
	])), a = Yr(Xr(e, [
		"has_ai_vector",
		"hasAiVector",
		"has_vector_embedding",
		"hasVectorEmbedding",
		"vector_indexed",
		"vectorIndexed"
	])), o = Yr(Xr(e, [
		"has_ai_info",
		"hasAiInfo",
		"ai_indexed",
		"aiIndexed"
	])), s = r === !0 || r === null && Qr(t), c = i === !0 || i === null && Zr(n), l = a === !0 || o === !0;
	return {
		hasAiInfo: o === !0 || s || c || l,
		hasAutoTags: s,
		hasEnhancedPrompt: c,
		hasVectorIndexed: l
	};
}
function ei(e) {
	let t = document.createElement("span");
	t.className = "mjr-workflow-dot mjr-asset-status-dot";
	let n = Yr(e?.has_workflow ?? e?.hasWorkflow), r = Yr(e?.has_generation_data ?? e?.hasGenerationData), i = Dr(), a = i.queueLength, o = i.active || a > 0, s = "Pending: parsing metadata...", c = n === !0 || r === !0, l = n === !1 || r === !1, u = n === null || r === null;
	n === !0 && r === !0 ? s = "Complete: workflow + generation data detected" : c ? s = n === !0 ? "Partial: workflow only (generation data missing)" : "Partial: generation data only (workflow missing)" : l && !c && !u ? s = "None: no workflow or generation data found" : u && (s = "Pending: metadata not parsed yet");
	let d = u ? "pending" : n === !0 && r === !0 ? "success" : c ? "warning" : "error";
	o && d !== "success" && (d = "pending", s = a > 0 ? `Pending: database metadata enrichment in progress (${a} queued)` : "Pending: database metadata enrichment in progress"), ti(t, d, s, { asset: e });
	let f = $r(e);
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
function ti(e, t, n = "", r = {}) {
	if (!e) return;
	let i = String(t || "").toLowerCase(), a = br(i, {
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
function ni(e) {
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
function ri(e) {
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
function ii(e) {
	let t = Number(e) / 1e3;
	return t >= 60 ? "#FF9800" : t >= 30 ? "#FFC107" : t >= 10 ? "#8BC34A" : "#4CAF50";
}
function ai(e) {
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
function oi(e, { maxMs: t = 864e5 } = {}) {
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
function si(e) {
	let t = document.createElement("div");
	t.className = "mjr-tags-badge";
	let n = ri(e);
	return n.length === 0 ? (t.style.display = "none", t) : (t.textContent = n.join(", "), t.title = `Tags: ${n.join(", ")}`, t.style.cssText = "\n        position: absolute;\n        bottom: 6px;\n        left: 6px;\n        padding: 3px 6px;\n        border-radius: 4px;\n        background: rgba(0,0,0,0.8);\n        color: var(--mjr-tag-color, #90CAF9);\n        font-size: 9px;\n        max-width: 80%;\n        overflow: hidden;\n        text-overflow: ellipsis;\n        white-space: nowrap;\n        pointer-events: none;\n        z-index: 10;\n        box-shadow: 0 2px 4px rgba(0,0,0,0.3);\n    ", t);
}
//#endregion
//#region ui/utils/safeCall.ts
var ci = () => {};
function li(e) {
	try {
		return !!O?.[e];
	} catch {
		return !1;
	}
}
function ui(e, t) {
	try {
		console.warn(`[Majoor] ${e}`, t);
	} catch (e) {
		console.debug?.(e);
	}
}
function di(e, t = "safeCall") {
	try {
		return e?.();
	} catch (e) {
		li("DEBUG_SAFE_CALL") && ui(t, e);
		return;
	}
}
function fi(e, t, n, r, i = "safeAddListener") {
	try {
		return e?.addEventListener?.(t, n, r), () => {
			try {
				e?.removeEventListener?.(t, n, r);
			} catch (e) {
				li("DEBUG_SAFE_LISTENERS") && ui(`${i}:remove:${String(t || "")}`, e);
			}
		};
	} catch (e) {
		return li("DEBUG_SAFE_LISTENERS") && ui(`${i}:add:${String(t || "")}`, e), ci;
	}
}
//#endregion
//#region ui/utils/mediaFps.ts
function pi(e) {
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
function mi(e) {
	try {
		let t = e, n = t.metadata_raw || {}, r = (n.raw_ffprobe || {}).video_stream || {};
		return pi(t.fps) ?? pi(n.fps) ?? pi(n.frame_rate) ?? pi(r.avg_frame_rate) ?? pi(r.r_frame_rate);
	} catch {
		return null;
	}
}
function hi(e, t) {
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
function gi(e) {
	let t = Number(e);
	return !Number.isFinite(t) || t <= 0 ? "" : Math.abs(t - Math.round(t)) < .001 ? `${Math.round(t)} fps` : `${t.toFixed(3).replace(/\.?0+$/, "")} fps`;
}
function _i(e, t = 30) {
	let n = pi(e);
	if (n != null) return Math.max(1, Math.round(n * 1e3) / 1e3);
	let r = pi(t);
	return r == null ? 30 : Math.max(1, Math.round(r * 1e3) / 1e3);
}
//#endregion
//#region ui/features/workflows/workflowPickerState.ts
var Z = Fe({
	open: !1,
	mode: "workflow",
	title: "",
	sourceAsset: null,
	workflow: null,
	items: [],
	resolve: null
});
function vi({ title: e = "Select workflow", sourceAsset: t = null } = {}) {
	return bi(null), Z.open = !0, Z.mode = "workflow", Z.title = String(e || "Select workflow"), Z.sourceAsset = t || null, Z.workflow = null, Z.items = [], new Promise((e) => {
		Z.resolve = e;
	});
}
function yi({ title: e = "Select asset", workflow: t = null, items: n = [] } = {}) {
	return bi(null), Z.open = !0, Z.mode = "asset", Z.title = String(e || "Select asset"), Z.sourceAsset = null, Z.workflow = t || null, Z.items = Array.isArray(n) ? n.filter(Boolean) : [], new Promise((e) => {
		Z.resolve = e;
	});
}
function bi(e = null) {
	let t = Z.resolve;
	if (Z.open = !1, Z.mode = "workflow", Z.title = "", Z.sourceAsset = null, Z.workflow = null, Z.items = [], Z.resolve = null, typeof t == "function") try {
		t(e || null);
	} catch (e) {
		console.debug?.(e);
	}
}
//#endregion
//#region ui/vue/majoorPrimeVue.ts
var xi = {
	Button: He,
	Checkbox: rt,
	InputText: Je,
	Select: tt,
	ToggleButton: Ze,
	Badge: Ue,
	Tag: ze,
	Dialog: Ke,
	Menu: et,
	Listbox: Xe,
	Tree: nt,
	VirtualScroller: Ve
};
function Si(e) {
	return e.use(Ge, {
		ripple: !1,
		unstyled: !0,
		zIndex: { overlay: 10100 }
	}), e.use(Ye), e.use($e), Object.entries(xi).forEach(([t, n]) => {
		e.component(`M${t}`, n);
	}), e;
}
//#endregion
//#region ui/vue/createVueApp.ts
function Ci(e, t = void 0) {
	let n = ct(), r = We(e, t);
	return r.use(n), Si(r), {
		app: r,
		pinia: n
	};
}
var wi = /* @__PURE__ */ new Map();
function Ti(e, t, n) {
	try {
		window.dispatchEvent(new CustomEvent("mjr:keepalive-attached", { detail: {
			mountKey: String(e || "_mjrVueApp"),
			host: t || null,
			container: n || null
		} }));
	} catch {}
}
function Ei(e) {
	let t = document.createElement("div");
	return t.dataset.mjrKeepAliveHost = String(e || "_mjrVueApp"), t.style.height = "100%", t.style.width = "100%", t.style.minHeight = "0", t.style.display = "flex", t.style.flexDirection = "column", t.style.overflow = "hidden", t;
}
function Di(e, t) {
	!e || !t || (e.style.height = "100%", e.style.minHeight = "0", e.style.display = "flex", e.style.flexDirection = "column", e.style.overflow = "hidden", !(e.firstChild === t && e.childNodes.length === 1) && (e.replaceChildren(t), Ti(t?.dataset?.mjrKeepAliveHost, t, e)));
}
function Oi(e, t, n = "_mjrVueApp") {
	if (!e) return !1;
	let r = wi.get(n), i = !1;
	if (!r) {
		let e = Ei(n), { app: a } = Ci(t);
		a.mount(e), r = {
			app: a,
			host: e,
			container: null
		}, wi.set(n, r), i = !0;
	}
	return Di(e, r.host), r.container = e, i;
}
function ki(e, t = "_mjrVueApp") {
	let n = wi.get(t);
	if (n?.app) {
		try {
			n.app.unmount();
		} catch {}
		try {
			n.host?.remove?.();
		} catch {}
		wi.delete(t);
	}
}
//#endregion
//#region ui/utils/format.ts
function Ai(e) {
	if (!e) return null;
	let t = Number(e);
	if (!isNaN(t)) return /* @__PURE__ */ new Date(t * 1e3);
	let n = new Date(e);
	return isNaN(n.getTime()) ? null : n;
}
function ji(e) {
	let t = Ai(e);
	return t ? `${t.getDate().toString().padStart(2, "0")}/${(t.getMonth() + 1).toString().padStart(2, "0")}` : "";
}
function Mi(e) {
	let t = Ai(e);
	return t ? `${t.getHours().toString().padStart(2, "0")}:${t.getMinutes().toString().padStart(2, "0")}` : "";
}
function Ni(e) {
	return e ? e < 60 ? `${Math.round(e)}s` : `${Math.floor(e / 60)}m ${Math.round(e % 60)}s` : "";
}
//#endregion
//#region ui/vue/components/panel/sidebar/SidebarFileInfoSection.vue
var Pi = {
	key: 0,
	class: "mjr-sidebar-section",
	style: {
		background: "rgba(255, 255, 255, 0.03)",
		border: "1px solid var(--mjr-border, rgba(255, 255, 255, 0.12))",
		"border-radius": "8px",
		padding: "10px"
	}
}, Fi = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "6px"
} }, Ii = ["title"], Li = ["title"], Ri = {
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
		let a = M(() => {
			let e = t.asset || {}, a = [];
			if (e.width && e.height && a.push({
				label: "Dimensions",
				value: `${e.width} x ${e.height}`,
				tooltip: "Image/video resolution in pixels"
			}), e.duration && e.duration > 0 && a.push({
				label: "Duration",
				value: Ni(e.duration),
				tooltip: "Video duration"
			}), r(e)) {
				let t = mi(e);
				t != null && a.push({
					label: "FPS",
					value: gi(t),
					tooltip: "Native frame rate"
				});
				let n = hi(e, t);
				n != null && a.push({
					label: "Length",
					value: `${Math.max(0, Math.floor(n))} frames`,
					tooltip: "Total frame count"
				});
			}
			let o = oi(e.generation_time_ms ?? e.metadata?.generation_time_ms ?? 0);
			o > 0 && a.push({
				label: "Generation Time",
				value: `${(Number(o) / 1e3).toFixed(1)}s`,
				tooltip: "Time taken to generate this asset (workflow execution time)",
				valueStyle: `color: ${ii(o)}; font-weight: 600;`
			});
			let s = e.generation_time || e.file_creation_time || e.mtime || e.created_at;
			if (s) {
				let e = ji(s), t = Mi(s);
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
		return (e, t) => a.value.length ? (F(), N("div", Pi, [t[0] ||= z("div", { style: {
			"font-size": "12px",
			"font-weight": "700",
			color: "#607d8b",
			"margin-bottom": "8px",
			"text-transform": "uppercase",
			"letter-spacing": "0.4px"
		} }, " File Info ", -1), z("div", Fi, [(F(!0), N(B, null, V(a.value, (e) => (F(), N("div", {
			key: e.label,
			style: {
				display: "flex",
				gap: "10px",
				"align-items": "flex-start",
				"justify-content": "space-between"
			}
		}, [z("div", {
			title: e.tooltip || "",
			style: {
				"font-size": "12px",
				opacity: "0.68",
				"min-width": "92px"
			}
		}, L(e.label), 9, Ii), z("div", {
			style: R(e.valueStyle || "font-size: 12px; text-align: right; word-break: break-word"),
			title: String(e.value || "")
		}, L(e.value), 13, Li)]))), 128))])])) : P("", !0);
	}
}, zi = new Set([
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
function Bi(e) {
	let t = String(e?.filename || e?.name || e?.filepath || e?.path || "").trim().toLowerCase();
	return !t || !t.includes(".") ? "" : t.split(".").pop() || "";
}
function Vi(e) {
	return String(e?.kind || "").trim().toLowerCase() === "image" || String(e?.mime || e?.mimetype || "").trim().toLowerCase().startsWith("image/") ? !0 : zi.has(Bi(e));
}
function Hi(e) {
	let t = Bi(e);
	return t === "jpg" || t === "jpeg";
}
function Ui() {
	try {
		return !!(K()?.ai?.vectorSearchEnabled ?? !0);
	} catch {
		return !0;
	}
}
function Wi(e) {
	return e >= .75 ? "#4CAF50" : e >= .5 ? "#8BC34A" : e >= .3 ? "#FF9800" : "#F44336";
}
function Gi(e) {
	return e >= .85 ? "Excellent" : e >= .7 ? "Good" : e >= .5 ? "Fair" : e >= .3 ? "Low" : "Very Low";
}
function Ki(e) {
	let t = String(e || "").trim();
	if (!t) return "";
	let n = [];
	for (let e of t.replace(/\r\n/g, "\n").split("\n")) {
		let t = String(e || "").trim();
		t && (/^title\s*:/i.test(t) || (/^caption\s*:/i.test(t) && (t = t.replace(/^caption\s*:/i, "").trim()), t && n.push(t)));
	}
	return (n.length ? n.join(" ") : t).replace(/\s+/g, " ").replace(/:{2,}\s*$/, "").trim();
}
function qi(e) {
	let t = String(e?.filename || "").trim();
	if (!t) return [];
	let n = String(e?.subfolder || "").trim(), r = String(e?.folder_type || "input").trim().toLowerCase(), i = [], a = (e) => {
		if (!e) return;
		let r = Oe(t, n, e);
		r && !i.includes(r) && i.push(r);
	};
	return (r === "input" || r === "output") && a(r), a("input"), a("output"), i;
}
function Ji(e) {
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
function Q(e) {
	return e == null || e === "" ? "-" : String(e);
}
function Yi(e, t) {
	let n = String(e?.pass_stage || e?.stage || e?.kind || "").trim().toLowerCase();
	if (n === "txt2img" || n === "text_to_image" || n === "text-to-image") return A("sidebar.generation.stageTextToImage", "Text-to-Image");
	if (n === "img2img" || n === "image_to_image" || n === "image-to-image") return A("sidebar.generation.stageImageToImage", "Image-to-Image");
	if (n === "inpaint" || n === "inpainting") return A("sidebar.generation.stageInpaint", "Inpaint");
	if (n === "upscale" || n === "upscaling") return A("sidebar.generation.stageUpscale", "Upscale");
	if (n === "refine" || n === "refiner") return A("sidebar.generation.stageRefine", "Refine");
	let r = String(e?.pass_name || "").trim();
	if (r && r.toLowerCase() !== "base") return r;
	let i = Number(e?.denoise);
	return t === 0 || i === 1 ? A("sidebar.generation.stageBase", "Base") : Number.isFinite(i) && i < 1 ? A("sidebar.generation.stageRefineUpscale", "Refine / Upscale") : A("sidebar.generation.stagePassN", "Pass {n}", { n: t + 1 });
}
function Xi(e) {
	return e?.geninfo && typeof e.geninfo == "object" ? { geninfo: e.geninfo } : e?.metadata && (typeof e.metadata == "object" || typeof e.metadata == "string") ? e.metadata : e?.prompt && (typeof e.prompt == "object" || typeof e.prompt == "string") ? e.prompt : e?.metadata_raw ? e.metadata_raw : e?.exif ? e.exif : null;
}
function Zi(e) {
	try {
		if (!e || typeof e != "object") return !1;
		if (e.is_override || typeof e.workflow_notes == "string" && e.workflow_notes.trim() || typeof e.notes == "string" && e.notes.trim() || Array.isArray(e.custom_info) && e.custom_info.length > 0 || e.engine && typeof e.engine == "object" && e.engine.type || ft(e.prompt) || typeof (e.negative_prompt || e.negativePrompt) == "string" && ft(e.negative_prompt || e.negativePrompt) || e.models || e.model || e.checkpoint || e.loras || e.sampler || e.sampler_name || e.steps || e.cfg || e.cfg_scale || e.cfg_high_noise || e.cfg_low_noise || e.scheduler || Array.isArray(e.chained_passes) && e.chained_passes.length > 0 || Array.isArray(e.all_samplers) && e.all_samplers.length > 0 || e.seed || e.denoise || e.denoising || e.clip_skip || e.voice || e.language || e.temperature || e.top_k || e.top_p || e.repetition_penalty || e.max_new_tokens || e.device || e.voice_preset || e.instruct || e.dtype || e.attn_implementation || e.enable_chunking !== void 0 || e.max_chars_per_chunk || e.chunk_combination_method || e.silence_between_chunks_ms || e.enable_audio_cache !== void 0 || e.batch_size !== void 0 || e.use_torch_compile !== void 0 || e.use_cuda_graphs !== void 0 || e.compile_mode || typeof e.lyrics == "string" && e.lyrics.trim()) return !0;
	} catch {
		return !1;
	}
	return !1;
}
function Qi(e) {
	return e ? typeof e == "string" ? pt(e) : typeof e == "object" ? pt(e.name || e.value || "") : "" : "";
}
function $i(e, t, n, r) {
	let i = String(r || "").trim();
	if (!i) return;
	let a = `${n}::${i}`;
	t.has(a) || (t.add(a), e.push({
		label: n,
		value: i
	}));
}
function ea(e) {
	let t = `${String(e?.source || "").toLowerCase()} ${String(e?.name || e?.lora_name || "").toLowerCase()}`;
	return t.includes("high_noise") || t.includes("high noise") ? "high_noise" : t.includes("low_noise") || t.includes("low noise") ? "low_noise" : "";
}
function ta(e) {
	let t = [], n = Array.isArray(e.model_groups) ? e.model_groups : [];
	if (n.length) return n.forEach((e) => {
		if (!e || typeof e != "object") return;
		let n = Qi(e.model), r = Array.isArray(e.loras) ? e.loras.map((e) => dt(e)).filter(Boolean) : [];
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
		label: A("sidebar.generation.highNoise", "High Noise"),
		model: Qi(r.unet_high_noise)
	}, {
		key: "low_noise",
		label: A("sidebar.generation.lowNoise", "Low Noise"),
		model: Qi(r.unet_low_noise)
	}].forEach((e) => {
		let n = i.filter((t) => ea(t) === e.key).map((e) => dt(e)).filter(Boolean);
		!e.model && !n.length || t.push({
			...e,
			loras: n
		});
	}), t;
}
function na(e, t) {
	return t == null ? null : {
		label: e,
		value: t ? A("state.on", "on") : A("state.off", "off")
	};
}
function ra(e) {
	return e != null && String(e).trim() !== "";
}
function ia(e) {
	return new Set(Array.isArray(e.override_fields) ? e.override_fields.map((e) => String(e || "").trim()).filter(Boolean) : []);
}
function $(e, ...t) {
	return t.some((t) => e.has(t));
}
function aa(e) {
	return Array.isArray(e) ? e.filter((e) => e && typeof e == "object").map((e, t) => ({
		title: String(e.title || A("sidebar.generation.customInfoN", "Custom Info {n}", { n: t + 1 })).trim(),
		content: String(e.content ?? e.value ?? "").trim(),
		color: /^#[0-9a-fA-F]{6}$/.test(String(e.color || "").trim()) ? String(e.color).trim() : "#2196F3"
	})).filter((e) => e.content) : [];
}
function oa(e) {
	let t = ut(Xi(e)), n = {
		kind: "empty",
		title: A("sidebar.generation.title", "Generation"),
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
		captionLabel: A("sidebar.generation.imageDescription", "Image Description"),
		emptyCaptionText: A("sidebar.generation.noImageDescription", "No image description yet."),
		isImageAsset: Vi(e),
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
	if (!t || typeof t == "object" && Object.keys(t).length === 0 || !Zi(t)) {
		let t = e?.metadata_raw?.geninfo_status || e?.geninfo_status;
		return t && typeof t == "object" && t.kind === "media_pipeline" ? {
			...n,
			kind: "media-only",
			mediaOnlyMessage: A("sidebar.generation.mediaOnlyPipeline", "This file looks like a media-only pipeline (e.g. LoadVideo/VideoCombine) and does not contain generation parameters.")
		} : Vi(e) || Hi(e) ? {
			...n,
			kind: "caption-only",
			showAlignment: !1
		} : n;
	}
	let r = t, i = ia(r), a = r.engine && typeof r.engine == "object" ? r.engine : null, o = !!(r.is_override || a?.mode === "override" || a?.parser_version === "geninfo-override-v1" || a?.source === "majoor_geninfo"), s = mt(r), c = lt(typeof r.prompt == "string" ? r.prompt : null, typeof (r.negative_prompt || r.negativePrompt) == "string" ? r.negative_prompt || r.negativePrompt : null), l = Array.isArray(r.all_positive_prompts) && r.all_positive_prompts.length > 1 ? r.all_positive_prompts.map((e, t) => {
		let n = lt(typeof e == "string" ? e : "", typeof r.all_negative_prompts?.[t] == "string" ? r.all_negative_prompts[t] : "");
		return {
			label: A("sidebar.generation.promptN", "Prompt {n}", { n: t + 1 }),
			positive: ft(n.positive),
			negative: ft(n.negative)
		};
	}).filter((e) => e.positive) : [], u = [], d = /* @__PURE__ */ new Set(), f = r.models && typeof r.models == "object" ? r.models : null, p = ta(r), m = new Set(p.map((e) => String(e.model || "").trim()).filter(Boolean)), h = Array.isArray(r.all_checkpoints) && r.all_checkpoints.length > 1 ? r.all_checkpoints : null;
	if (f) {
		let e = new Set([
			Qi(f.unet_high_noise),
			Qi(f.unet_low_noise),
			...m
		].filter(Boolean));
		if (h) h.forEach((e, t) => {
			let n = Qi(e);
			$i(u, d, A("sidebar.generation.checkpointN", "Checkpoint {n}", { n: t + 1 }), n);
		});
		else {
			let t = Qi(f.checkpoint);
			t && !e.has(t) && $i(u, d, A("sidebar.generation.checkpoint", "Checkpoint"), t);
		}
		[
			["UNet", Qi(f.unet)],
			["Diffusion", Qi(f.diffusion)],
			[A("sidebar.generation.upscaler", "Upscaler"), Qi(f.upscaler)],
			["CLIP", Qi(f.clip)],
			["VAE", Qi(f.vae)]
		].forEach(([t, n]) => {
			e.has(n) || $i(u, d, t, n);
		});
	} else (r.model || r.checkpoint) && $i(u, d, A("sidebar.generation.model", "Model"), pt(r.model || r.checkpoint));
	if (Array.isArray(r.loras) && r.loras.length > 0) {
		let e = r.loras.map((e) => dt(e)).filter(Boolean).join("\n");
		e && $i(u, d, r.loras.length > 1 ? A("sidebar.generation.loras", "LoRAs") : "LoRA", e);
	}
	!f && r.clip && $i(u, d, "CLIP", pt(r.clip)), !f && r.vae && $i(u, d, "VAE", pt(r.vae)), !f && r.unet && $i(u, d, "UNet", pt(r.unet)), !f && r.diffusion && $i(u, d, "Diffusion", pt(r.diffusion)), f && r.clip && $i(u, d, "CLIP", pt(r.clip)), f && r.vae && $i(u, d, "VAE", pt(r.vae));
	for (let e of u) {
		let t = String(e.label || "").toLowerCase();
		(t.includes("checkpoint") || t === "model") && (e.override = $(i, "checkpoint", "model")), t === "clip" && (e.override = $(i, "clip")), t === "vae" && (e.override = $(i, "vae")), t.includes("lora") && (e.override = $(i, "loras"));
	}
	let g = [];
	ra(r.seed) && g.push({
		label: A("sidebar.generation.seed", "Seed"),
		value: r.seed,
		override: $(i, "seed")
	}), (r.sampler || r.sampler_name) && g.push({
		label: A("sidebar.generation.sampler", "Sampler"),
		value: r.sampler || r.sampler_name,
		override: $(i, "sampler", "sampler_name")
	}), ra(r.steps) && g.push({
		label: A("sidebar.generation.steps", "Steps"),
		value: r.steps,
		override: $(i, "steps")
	});
	let _ = ra(r.cfg) ? r.cfg : r.cfg_scale;
	ra(_) && g.push({
		label: A("sidebar.generation.cfgScale", "CFG Scale"),
		value: _,
		override: $(i, "cfg", "cfg_scale")
	}), r.cfg_high_noise !== void 0 && r.cfg_high_noise !== null && g.push({
		label: A("sidebar.generation.cfgHighNoise", "CFG High Noise"),
		value: r.cfg_high_noise
	}), r.cfg_low_noise !== void 0 && r.cfg_low_noise !== null && g.push({
		label: A("sidebar.generation.cfgLowNoise", "CFG Low Noise"),
		value: r.cfg_low_noise
	}), r.scheduler && g.push({
		label: A("sidebar.generation.scheduler", "Scheduler"),
		value: r.scheduler,
		override: $(i, "scheduler")
	});
	let v = ra(r.denoise) ? r.denoise : r.denoising;
	ra(v) && g.push({
		label: A("sidebar.generation.denoise", "Denoise"),
		value: v,
		override: $(i, "denoise", "denoising")
	});
	let y = [];
	Array.isArray(r.chained_passes) && r.chained_passes.length > 1 ? y = r.chained_passes.filter((e) => e && typeof e == "object").map((e, t) => ({
		label: Yi(e, t),
		fields: [
			{
				label: A("sidebar.generation.model", "Model"),
				value: Q(e?.model)
			},
			{
				label: A("sidebar.generation.sampler", "Sampler"),
				value: Q(e?.sampler_name || e?.sampler)
			},
			{
				label: A("sidebar.generation.scheduler", "Scheduler"),
				value: Q(e?.scheduler)
			},
			{
				label: A("sidebar.generation.steps", "Steps"),
				value: Q(e?.steps)
			},
			{
				label: "CFG",
				value: Q(e?.cfg)
			},
			{
				label: A("sidebar.generation.denoise", "Denoise"),
				value: Q(e?.denoise)
			},
			{
				label: A("sidebar.generation.seed", "Seed"),
				value: Q(e?.seed_val || e?.seed)
			}
		]
	})) : Array.isArray(r.all_samplers) && r.all_samplers.length > 1 && (y = r.all_samplers.filter((e) => e && typeof e == "object").map((e, t) => ({
		label: Yi(e, t),
		fields: [
			{
				label: A("sidebar.generation.model", "Model"),
				value: Q(e?.model)
			},
			{
				label: A("sidebar.generation.sampler", "Sampler"),
				value: Q(e?.sampler_name || e?.sampler)
			},
			{
				label: A("sidebar.generation.scheduler", "Scheduler"),
				value: Q(e?.scheduler)
			},
			{
				label: A("sidebar.generation.steps", "Steps"),
				value: Q(e?.steps)
			},
			{
				label: "CFG",
				value: Q(e?.cfg)
			},
			{
				label: A("sidebar.generation.denoise", "Denoise"),
				value: Q(e?.denoise)
			},
			{
				label: A("sidebar.generation.seed", "Seed"),
				value: Q(e?.seed_val || e?.seed)
			}
		]
	})));
	let b = [];
	r.voice && b.push({
		label: A("sidebar.generation.narratorVoice", "Narrator Voice"),
		value: r.voice
	}), r.language && b.push({
		label: A("sidebar.generation.language", "Language"),
		value: r.language
	}), r.top_k !== void 0 && r.top_k !== null && b.push({
		label: "Top-k",
		value: r.top_k
	}), r.top_p !== void 0 && r.top_p !== null && b.push({
		label: "Top-p",
		value: r.top_p
	}), r.temperature !== void 0 && r.temperature !== null && b.push({
		label: A("sidebar.generation.temperature", "Temperature"),
		value: r.temperature
	}), r.repetition_penalty !== void 0 && r.repetition_penalty !== null && b.push({
		label: A("sidebar.generation.repetitionPenalty", "Repetition Penalty"),
		value: r.repetition_penalty
	}), r.max_new_tokens !== void 0 && r.max_new_tokens !== null && b.push({
		label: A("sidebar.generation.maxNewTokens", "Max New Tokens"),
		value: r.max_new_tokens
	});
	let x = [];
	r.device && x.push({
		label: A("sidebar.generation.device", "Device"),
		value: r.device
	}), r.voice_preset && x.push({
		label: A("sidebar.generation.voicePreset", "Voice Preset"),
		value: r.voice_preset
	}), r.dtype && x.push({
		label: A("sidebar.generation.dtype", "Dtype"),
		value: r.dtype
	}), r.attn_implementation && x.push({
		label: A("sidebar.generation.attention", "Attention"),
		value: r.attn_implementation
	}), r.compile_mode && x.push({
		label: A("sidebar.generation.compileMode", "Compile Mode"),
		value: r.compile_mode
	}), [
		na(A("sidebar.generation.torchCompile", "Torch Compile"), r.use_torch_compile),
		na(A("sidebar.generation.cudaGraphs", "CUDA Graphs"), r.use_cuda_graphs),
		na(A("sidebar.generation.xVectorOnly", "X-Vector Only"), r.x_vector_only_mode)
	].filter(Boolean).forEach((e) => x.push(e));
	let S = [];
	[
		na(A("sidebar.generation.chunking", "Chunking"), r.enable_chunking),
		r.max_chars_per_chunk !== void 0 && r.max_chars_per_chunk !== null ? {
			label: A("sidebar.generation.maxCharsChunk", "Max Chars/Chunk"),
			value: r.max_chars_per_chunk
		} : null,
		r.chunk_combination_method ? {
			label: A("sidebar.generation.chunkMethod", "Chunk Method"),
			value: r.chunk_combination_method
		} : null,
		r.silence_between_chunks_ms !== void 0 && r.silence_between_chunks_ms !== null ? {
			label: A("sidebar.generation.silenceBetweenChunks", "Silence Between Chunks (ms)"),
			value: r.silence_between_chunks_ms
		} : null,
		na(A("sidebar.generation.audioCache", "Audio Cache"), r.enable_audio_cache),
		r.batch_size !== void 0 && r.batch_size !== null ? {
			label: A("sidebar.generation.batchSize", "Batch Size"),
			value: r.batch_size
		} : null
	].filter(Boolean).forEach((e) => S.push(e));
	let ee = [];
	r.lyrics_strength !== void 0 && r.lyrics_strength !== null && ee.push({
		label: A("sidebar.generation.lyricsStrength", "Lyrics Strength"),
		value: r.lyrics_strength
	});
	let C = [];
	ra(v) && !g.some((e) => e.label === "Denoise") && C.push({
		label: A("sidebar.generation.denoise", "Denoise"),
		value: v
	}), ra(r.clip_skip) && C.push({
		label: A("sidebar.generation.clipSkip", "Clip Skip"),
		value: r.clip_skip
	});
	let te = [], w = String(r.workflow_notes || r.notes || "").trim();
	w && te.push({
		label: A("sidebar.generation.workflowNotes", "Workflow Notes"),
		value: w,
		override: $(i, "workflow_notes", "notes")
	});
	let T = aa(r.custom_info), ne = Array.isArray(r.inputs) ? r.inputs.filter((e) => e && typeof e == "object" && e.filename).map((e, t) => ({
		id: `${e.filename}-${t}`,
		filename: String(e.filename || "").trim(),
		filepath: String(e.filepath || e.filename || "").trim(),
		role: String(e.role || "").trim(),
		roleLabel: String(e.role || "").trim().replace(/_/g, " "),
		isVideo: String(e.type || "").toLowerCase() === "video" || /\.(mp4|mov|webm)$/i.test(String(e.filename || "")),
		previewCandidates: qi(e)
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
		isImageAsset: Vi(e),
		lyrics: String(r.lyrics || "").trim(),
		modelFields: u,
		modelGroups: p,
		pipelineTabs: y,
		samplingFields: g,
		ttsFields: b,
		ttsEngineFields: x,
		ttsInstruction: String(r.instruct || "").trim(),
		ttsRuntimeFields: S,
		audioFields: ee,
		seed: r.seed ?? null,
		imageFields: C,
		inputFiles: ne,
		isOverride: o,
		overrideLabel: o ? "Gen Info Override" : "",
		notesFields: te,
		customInfoBlocks: T
	};
}
//#endregion
//#region ui/vue/components/panel/sidebar/GenerationInputThumb.vue
var sa = ["title"], ca = ["src"], la = ["src"], ua = {
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
}, da = {
	key: 3,
	title: "Video file",
	style: {
		position: "absolute",
		color: "white",
		opacity: "0.7",
		"font-size": "16px",
		"pointer-events": "none"
	}
}, fa = {
	__name: "GenerationInputThumb",
	props: { inputFile: {
		type: Object,
		required: !0
	} },
	setup(e) {
		let t = e, n = j(0), r = j(!1);
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
			if (Ji(t)) try {
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
		return (t, n) => (F(), N("div", {
			title: `${e.inputFile.filename} (click to copy, double-click to open in new tab)`,
			style: R({
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
		}, [e.inputFile.isVideo ? (F(), N("video", {
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
		}, null, 40, ca)) : (F(), N("img", {
			key: 1,
			src: i(),
			style: {
				width: "100%",
				height: "100%",
				"object-fit": "cover"
			},
			onError: a
		}, null, 40, la)), e.inputFile.role && e.inputFile.role !== "secondary" ? (F(), N("div", ua, L(e.inputFile.roleLabel), 1)) : e.inputFile.isVideo ? (F(), N("div", da, " Play ")) : P("", !0)], 44, sa));
	}
}, pa = {
	key: 0,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "12px"
	}
}, ma = {
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
}, ha = { style: { opacity: "0.85" } }, ga = { style: {
	display: "flex",
	"align-items": "center",
	gap: "8px",
	"flex-wrap": "wrap",
	"justify-content": "flex-end"
} }, _a = ["title"], va = ["title"], ya = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px"
} }, ba = { style: {
	"font-size": "11px",
	"font-weight": "700",
	color: "#00BCD4",
	"text-transform": "uppercase",
	"letter-spacing": "0.6px"
} }, xa = { style: {
	"font-size": "11px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"font-weight": "600"
} }, Sa = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#FF9800",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, Ca = { style: {
	"font-size": "12px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"line-height": "1.5",
	"white-space": "pre-wrap",
	"word-break": "break-word"
} }, wa = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#9E9E9E",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, Ta = { style: {
	"font-size": "12px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"line-height": "1.5",
	"white-space": "pre-wrap",
	"word-break": "break-word"
} }, Ea = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#4CAF50",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, Da = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "6px",
	"margin-bottom": "10px"
} }, Oa = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "#4CAF50",
	"letter-spacing": "0.4px"
} }, ka = ["onClick"], Aa = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "#F44336",
	"letter-spacing": "0.4px",
	"margin-top": "4px"
} }, ja = ["onClick"], Ma = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#4CAF50",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, Na = ["title"], Pa = ["title"], Fa = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#F44336",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, Ia = ["title"], La = ["title"], Ra = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#00BCD4",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between"
} }, za = ["title"], Ba = { style: {
	display: "flex",
	"align-items": "center",
	gap: "10px"
} }, Va = { style: {
	flex: "1",
	height: "8px",
	background: "rgba(255,255,255,0.1)",
	"border-radius": "4px",
	overflow: "hidden"
} }, Ha = {
	key: 0,
	style: {
		"font-size": "10px",
		color: "rgba(255,255,255,0.65)",
		border: "1px dashed rgba(255,255,255,0.25)",
		"border-radius": "4px",
		padding: "6px 8px",
		background: "rgba(255,255,255,0.04)"
	}
}, Ua = { style: {
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
} }, Wa = ["title"], Ga = { style: {
	display: "flex",
	"align-items": "center",
	gap: "6px"
} }, Ka = ["title"], qa = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#00BCD4",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, Ja = { style: {
	"font-size": "12px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"line-height": "1.5",
	"white-space": "pre-wrap",
	"word-break": "break-word"
} }, Ya = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#FF9800",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, Xa = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "6px",
	"margin-bottom": "10px"
} }, Za = { style: {
	"font-size": "10px",
	"font-weight": "600",
	color: "rgba(255,255,255,0.6)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, Qa = ["onClick"], $a = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#9C27B0",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, eo = { style: {
	display: "grid",
	"grid-template-columns": "repeat(auto-fit, minmax(220px, 1fr))",
	gap: "10px"
} }, to = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px"
} }, no = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "4px"
} }, ro = ["onClick"], io = {
	key: 0,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "6px"
	}
}, ao = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.58)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, oo = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "5px"
} }, so = ["onClick"], co = { style: {
	display: "grid",
	"grid-template-columns": "auto 1fr",
	gap: "8px 12px",
	"align-items": "start"
} }, lo = ["title"], uo = ["title"], fo = ["title", "onClick"], po = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#4CAF50",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, mo = ["title", "onClick"], ho = ["title", "onClick"], go = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#26A69A",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, _o = ["title"], vo = { style: {
	"font-size": "11px",
	"font-weight": "700",
	color: "#E91E63",
	"text-transform": "uppercase",
	"letter-spacing": "1px"
} }, yo = ["title"], bo = ["title"], xo = { style: {
	display: "flex",
	gap: "8px",
	"flex-wrap": "wrap"
} }, So = {
	__name: "SidebarGenerationSection",
	props: { asset: {
		type: Object,
		required: !0
	} },
	setup(e) {
		let t = e, n = j(0), r = j(0), i = j(""), a = j(A("action.copy", "Copy")), s = j(A("action.generate", "Generate")), c = j(!1), l = j(d()), u = 0;
		function d() {
			return {
				scoreText: "...",
				scoreColor: "#888",
				qualityText: A("status.loading", "Loading"),
				qualityColor: "#888",
				qualityBackground: "rgba(127,127,127,0.3)",
				fillWidth: "0%",
				fillColor: "#666",
				aiStatusVisible: !1,
				aiStatusText: A("sidebar.generation.aiDisabledEnv", "AI features are disabled (enable vector search env var).")
			};
		}
		function f(e, t) {
			let n = String(e || "").trim().replace(/^#/, "");
			return /^[0-9a-fA-F]{6}$/.test(n) ? `rgba(${Number.parseInt(n.slice(0, 2), 16)}, ${Number.parseInt(n.slice(2, 4), 16)}, ${Number.parseInt(n.slice(4, 6), 16)}, ${t})` : `rgba(255,255,255,${t})`;
		}
		function p(e, { emphasis: t = !1, startAlpha: n = .16, endAlpha: r = .08 } = {}) {
			return {
				background: t ? `linear-gradient(135deg, ${f(e, n)} 0%, ${f(e, r)} 100%)` : "var(--comfy-menu-bg, rgba(0,0,0,0.3))",
				borderLeft: `3px solid ${e}`,
				border: t ? `1px solid ${f(e, .45)}` : "1px solid var(--border-color, rgba(255,255,255,0.12))",
				boxShadow: t ? `0 0 0 1px ${f(e, .15)} inset` : "none",
				borderRadius: "6px",
				padding: "12px"
			};
		}
		function m() {
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
		function h() {
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
		let g = M(() => oa(t.asset)), v = M(() => Ui()), y = M(() => g.value.kind === "full" || g.value.kind === "caption-only"), b = M(() => Ki(i.value) || g.value.emptyCaptionText), x = M(() => v.value && g.value.isImageAsset && !!t.asset?.id), S = M(() => v.value && !!Ki(b.value) && b.value !== g.value.emptyCaptionText), ee = M(() => {
			let e = [];
			return g.value.modelFields.length && e.push({
				key: "model",
				title: A("sidebar.generation.modelLora", "Model & LoRA"),
				accent: "#9C27B0",
				emphasis: !0,
				fields: g.value.modelFields
			}), !g.value.pipelineTabs.length && g.value.samplingFields.length && e.push({
				key: "sampling",
				title: A("sidebar.generation.sampling", "Sampling"),
				accent: "#FF9800",
				emphasis: !0,
				fields: g.value.samplingFields
			}), (g.value.ttsFields.length || g.value.workflowType.toLowerCase() === "tts") && e.push({
				key: "tts",
				title: "TTS",
				accent: "#26A69A",
				emphasis: !0,
				fields: g.value.ttsFields
			}), g.value.ttsEngineFields.length && e.push({
				key: "tts-engine",
				title: "TTS Engine",
				accent: "#00897B",
				emphasis: !1,
				fields: g.value.ttsEngineFields
			}), g.value.ttsRuntimeFields.length && e.push({
				key: "tts-runtime",
				title: "TTS Runtime",
				accent: "#00796B",
				emphasis: !1,
				fields: g.value.ttsRuntimeFields
			}), g.value.audioFields.length && e.push({
				key: "audio",
				title: A("sidebar.generation.audio", "Audio"),
				accent: "#00BCD4",
				emphasis: !1,
				fields: g.value.audioFields
			}), g.value.imageFields.length && e.push({
				key: "image",
				title: A("sidebar.generation.image", "Image"),
				accent: "#2196F3",
				emphasis: !1,
				fields: g.value.imageFields
			}), e;
		});
		function C(e, t, n = 450) {
			if (!e) return;
			let r = e.style.background;
			e.style.background = t, setTimeout(() => {
				e.style.background = r || "";
			}, n);
		}
		function te(e, t = !0) {
			return {
				background: t ? `linear-gradient(135deg, ${f(e, .16)} 0%, ${f(e, .08)} 100%)` : "var(--comfy-menu-bg, rgba(0,0,0,0.3))",
				border: `1px solid ${f(e, .42)}`,
				boxShadow: `0 0 0 1px ${f(e, .14)} inset`,
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
				await navigator.clipboard.writeText(r), C(t, n);
			} catch (e) {
				console.debug?.(e);
			}
		}
		function ne() {
			l.value = {
				scoreText: "AI OFF",
				scoreColor: "#9E9E9E",
				qualityText: A("status.disabled", "Disabled"),
				qualityColor: "#BDBDBD",
				qualityBackground: "rgba(158,158,158,0.25)",
				fillWidth: "0%",
				fillColor: "#777",
				aiStatusVisible: !0,
				aiStatusText: A("sidebar.generation.aiDisabledSettings", "AI features are disabled in settings.")
			};
		}
		function re() {
			l.value = d();
		}
		async function ie() {
			u += 1;
			let e = u;
			if (!g.value.showAlignment || !t.asset?.id) {
				re();
				return;
			}
			if (!v.value) {
				ne();
				return;
			}
			re();
			try {
				let n = await o(t.asset.id);
				if (e !== u) return;
				if (!n?.ok && (String(n?.code || "").toUpperCase() === "SERVICE_UNAVAILABLE" || /vector search is not enabled/i.test(String(n?.error || "")))) {
					ne();
					return;
				}
				let r = n?.ok && n.data != null ? Number(n.data) : null;
				if (!Number.isFinite(r)) {
					l.value = {
						scoreText: "N/A",
						scoreColor: "#888",
						qualityText: A("status.na", "N/A"),
						qualityColor: "#888",
						qualityBackground: "rgba(127,127,127,0.3)",
						fillWidth: "0%",
						fillColor: "#666",
						aiStatusVisible: !1,
						aiStatusText: ""
					};
					return;
				}
				let i = Math.round(r * 100), a = Wi(r);
				l.value = {
					scoreText: `${i}%`,
					scoreColor: a,
					qualityText: Gi(r),
					qualityColor: a,
					qualityBackground: `${a}33`,
					fillWidth: `${i}%`,
					fillColor: a,
					aiStatusVisible: !1,
					aiStatusText: ""
				};
			} catch (t) {
				if (console.debug?.(t), e !== u) return;
				l.value = {
					scoreText: "-",
					scoreColor: "#888",
					qualityText: A("status.unavailable", "Unavailable"),
					qualityColor: "#888",
					qualityBackground: "rgba(127,127,127,0.3)",
					fillWidth: "0%",
					fillColor: "#666",
					aiStatusVisible: !1,
					aiStatusText: ""
				};
			}
		}
		async function ae() {
			if (!(!x.value || c.value)) {
				c.value = !0, s.value = A("status.generating", "Generating...");
				try {
					let e = await _(t.asset.id);
					e?.ok && (i.value = String(e?.data || "").trim());
				} catch (e) {
					console.debug?.(e);
				} finally {
					c.value = !1, s.value = A("action.generate", "Generate");
				}
			}
		}
		async function oe() {
			if (S.value) try {
				await navigator.clipboard.writeText(b.value), a.value = A("viewer.copySuccessShort", "Copied!"), setTimeout(() => {
					a.value = A("action.copy", "Copy");
				}, 900);
			} catch (e) {
				console.debug?.(e);
			}
		}
		return Me(() => t.asset, () => {
			n.value = 0, r.value = 0, i.value = String(t.asset?.enhanced_caption || "").trim(), a.value = A("action.copy", "Copy"), s.value = A("action.generate", "Generate");
		}, { immediate: !0 }), Me(() => [
			t.asset?.id,
			g.value.kind,
			g.value.showAlignment,
			v.value
		], () => {
			ie();
		}, { immediate: !0 }), (e, t) => {
			let i = Le("MButton");
			return g.value.kind === "empty" ? P("", !0) : (F(), N("div", pa, [
				g.value.workflowType ? (F(), N("div", ma, [z("span", ha, L(I(A)("viewer.workflow", "Workflow")), 1), z("div", ga, [z("span", {
					title: I(A)("sidebar.generation.workflowEngine", "Workflow engine: {value}", { value: g.value.workflowType }),
					style: {
						background: "#2196F3",
						color: "white",
						padding: "2px 8px",
						"border-radius": "999px",
						"font-weight": "bold",
						"font-size": "10px",
						"letter-spacing": "0.2px"
					}
				}, L(g.value.workflowLabel || g.value.workflowType), 9, _a), g.value.workflowBadge ? (F(), N("span", {
					key: 0,
					title: I(A)("sidebar.generation.apiProvider", "API provider: {value}", { value: g.value.workflowBadge }),
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
				}, L(g.value.workflowBadge), 9, va)) : P("", !0)])])) : P("", !0),
				g.value.isOverride ? (F(), N("div", {
					key: 1,
					style: R(p("#00BCD4", {
						emphasis: !0,
						startAlpha: .14,
						endAlpha: .08
					}))
				}, [z("div", ya, [z("span", ba, L(I(A)("sidebar.generation.override", "Override")), 1), z("span", xa, L(g.value.overrideLabel), 1)])], 4)) : P("", !0),
				g.value.isTruncated ? (F(), N("div", {
					key: 2,
					style: R(p("#FF9800", {
						emphasis: !0,
						startAlpha: .12,
						endAlpha: .08
					}))
				}, [z("div", Sa, L(I(A)("sidebar.generation.metadataTruncated", "Metadata Truncated")), 1), z("div", Ca, L(I(A)("sidebar.generation.metadataTruncatedBody", "Generation data is incomplete because it exceeded the size limit.")), 1)], 4)) : P("", !0),
				g.value.kind === "media-only" ? (F(), N("div", {
					key: 3,
					style: R(p("#9E9E9E", {
						emphasis: !0,
						startAlpha: .1,
						endAlpha: .06
					}))
				}, [z("div", wa, L(I(A)("sidebar.generation.generationData", "Generation Data")), 1), z("div", Ta, L(g.value.mediaOnlyMessage), 1)], 4)) : P("", !0),
				g.value.kind === "full" ? (F(), N(B, { key: 4 }, [g.value.promptTabs.length ? (F(), N("div", {
					key: 0,
					style: R(p("#4CAF50", {
						emphasis: !0,
						startAlpha: .16,
						endAlpha: .1
					}))
				}, [
					z("div", Ea, L(I(A)("sidebar.generation.promptPipeline", "Prompt Pipeline ({count} variants)", { count: g.value.promptTabs.length })), 1),
					z("div", Da, [(F(!0), N(B, null, V(g.value.promptTabs, (e, t) => (F(), Ie(i, {
						key: e.label,
						type: "button",
						severity: "secondary",
						text: "",
						rounded: "",
						style: R({
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
						default: Re(() => [Ne(L(e.label), 1)]),
						_: 2
					}, 1032, ["style", "onClick"]))), 128))]),
					(F(!0), N(B, null, V(g.value.promptTabs, (e, t) => je((F(), N("div", {
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
						z("div", Oa, L(I(A)("sidebar.generation.positive", "POSITIVE")), 1),
						z("div", {
							style: {
								"font-size": "12px",
								color: "var(--fg-color, #ddd)",
								"white-space": "pre-wrap",
								"line-height": "1.35",
								cursor: "pointer"
							},
							onClick: (t) => T(e.positive, t.currentTarget)
						}, L(e.positive), 9, ka),
						e.negative ? (F(), N(B, { key: 0 }, [z("div", Aa, L(I(A)("sidebar.generation.negative", "NEGATIVE")), 1), z("div", {
							style: {
								"font-size": "12px",
								color: "var(--fg-color, #ddd)",
								"white-space": "pre-wrap",
								"line-height": "1.35",
								cursor: "pointer"
							},
							onClick: (t) => T(e.negative, t.currentTarget)
						}, L(e.negative), 9, ja)], 64)) : P("", !0)
					])), [[at, n.value === t]])), 128))
				], 4)) : g.value.positivePrompt ? (F(), N("div", {
					key: 1,
					style: R(p("#4CAF50", {
						emphasis: !0,
						startAlpha: .16,
						endAlpha: .1
					}))
				}, [z("div", Ma, [z("span", null, L(I(A)("sidebar.generation.positivePrompt", "Positive Prompt")), 1), g.value.positivePromptOverride ? (F(), N("span", {
					key: 0,
					style: R(h()),
					title: I(A)("sidebar.generation.overrideTooltip", "This field was forced by Majoor Gen Info Override")
				}, L(I(A)("sidebar.generation.override", "override")), 13, Na)) : P("", !0)]), z("div", {
					title: I(A)("action.clickToCopy", "Click to copy"),
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.9))",
						"line-height": "1.5",
						"white-space": "pre-wrap",
						"word-break": "break-word",
						cursor: "pointer"
					},
					onClick: t[0] ||= (e) => T(g.value.positivePrompt, e.currentTarget)
				}, L(g.value.positivePrompt), 9, Pa)], 4)) : P("", !0), !g.value.promptTabs.length && g.value.negativePrompt ? (F(), N("div", {
					key: 2,
					style: R(p("#F44336", {
						emphasis: !0,
						startAlpha: .16,
						endAlpha: .1
					}))
				}, [z("div", Fa, [z("span", null, L(I(A)("sidebar.generation.negativePrompt", "Negative Prompt")), 1), g.value.negativePromptOverride ? (F(), N("span", {
					key: 0,
					style: R(h()),
					title: I(A)("sidebar.generation.overrideTooltip", "This field was forced by Majoor Gen Info Override")
				}, L(I(A)("sidebar.generation.override", "override")), 13, Ia)) : P("", !0)]), z("div", {
					title: I(A)("action.clickToCopy", "Click to copy"),
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.9))",
						"line-height": "1.5",
						"white-space": "pre-wrap",
						"word-break": "break-word",
						cursor: "pointer"
					},
					onClick: t[1] ||= (e) => T(g.value.negativePrompt, e.currentTarget)
				}, L(g.value.negativePrompt), 9, La)], 4)) : P("", !0)], 64)) : P("", !0),
				y.value ? (F(), N("div", {
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
					class: Qe({ "mjr-ai-disabled-block": !v.value })
				}, [
					g.value.showAlignment ? (F(), N(B, { key: 0 }, [
						z("div", Ra, [z("span", { title: I(A)("sidebar.generation.promptAlignmentTooltip", "How closely the generated image matches the prompt (SigLIP2 score)") }, L(I(A)("sidebar.generation.promptAlignment", "Prompt Alignment")), 9, za)]),
						z("div", Ba, [
							z("div", Va, [z("div", { style: R({
								height: "100%",
								width: l.value.fillWidth,
								background: l.value.fillColor,
								borderRadius: "4px",
								transition: "width 0.6s ease, background 0.4s ease"
							}) }, null, 4)]),
							z("span", { style: R({
								fontSize: "13px",
								fontWeight: "700",
								color: l.value.scoreColor,
								minWidth: "60px",
								textAlign: "right",
								fontFamily: "'Consolas', 'Monaco', monospace"
							}) }, L(l.value.scoreText), 5),
							z("span", { style: R({
								fontSize: "9px",
								fontWeight: "700",
								padding: "2px 6px",
								borderRadius: "3px",
								background: l.value.qualityBackground,
								color: l.value.qualityColor,
								textTransform: "uppercase",
								letterSpacing: "0.5px"
							}) }, L(l.value.qualityText), 5)
						]),
						l.value.aiStatusVisible ? (F(), N("div", Ha, L(l.value.aiStatusText), 1)) : P("", !0)
					], 64)) : P("", !0),
					z("div", Ua, [z("span", { title: I(A)("sidebar.generation.aiCaptionTooltip", "AI caption generated by Florence-2") }, L(g.value.captionLabel), 9, Wa), z("div", Ga, [qe(i, {
						type: "button",
						class: "mjr-ai-control",
						severity: "secondary",
						text: "",
						disabled: !x.value || c.value,
						style: R([{
							border: "1px solid rgba(0,188,212,0.45)",
							background: "rgba(0,188,212,0.12)",
							color: "#00BCD4",
							"border-radius": "4px",
							"font-size": "10px",
							"font-weight": "600",
							padding: "2px 8px",
							cursor: "pointer"
						}, {
							opacity: x.value ? "1" : "0.6",
							cursor: x.value ? "pointer" : "default"
						}]),
						onClick: Be(ae, ["stop"])
					}, {
						default: Re(() => [Ne(L(s.value), 1)]),
						_: 1
					}, 8, ["disabled", "style"]), qe(i, {
						type: "button",
						class: "mjr-ai-control",
						severity: "secondary",
						text: "",
						disabled: !S.value,
						style: R([{
							border: "1px solid rgba(0,188,212,0.45)",
							background: "rgba(0,188,212,0.12)",
							color: "#00BCD4",
							"border-radius": "4px",
							"font-size": "10px",
							"font-weight": "600",
							padding: "2px 8px",
							cursor: "pointer"
						}, {
							opacity: S.value ? "1" : "0.6",
							cursor: S.value ? "pointer" : "default"
						}]),
						onClick: Be(oe, ["stop"])
					}, {
						default: Re(() => [Ne(L(a.value), 1)]),
						_: 1
					}, 8, ["disabled", "style"])])]),
					z("div", {
						title: v.value ? I(A)("sidebar.generation.copyCaptionTooltip", "Click to copy caption") : I(A)("sidebar.generation.aiCaptionDisabled", "AI caption controls are disabled"),
						style: R({
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
							cursor: S.value ? "copy" : "default"
						}),
						onClick: oe
					}, L(b.value), 13, Ka)
				], 2)) : P("", !0),
				g.value.lyrics ? (F(), N("div", {
					key: 6,
					style: R(p("#00BCD4", { emphasis: !1 }))
				}, [z("div", qa, [z("span", null, L(I(A)("sidebar.generation.lyrics", "Lyrics")), 1)]), z("div", Ja, L(g.value.lyrics), 1)], 4)) : P("", !0),
				g.value.pipelineTabs.length ? (F(), N("div", {
					key: 7,
					style: R(p("#FF9800", {
						emphasis: !0,
						startAlpha: .16,
						endAlpha: .1
					}))
				}, [
					z("div", Ya, L(I(A)("sidebar.generation.pipeline", "Generation Pipeline")), 1),
					z("div", Xa, [(F(!0), N(B, null, V(g.value.pipelineTabs, (e, t) => (F(), Ie(i, {
						key: e.label,
						type: "button",
						severity: "secondary",
						text: "",
						rounded: "",
						style: R({
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
						default: Re(() => [Ne(L(e.label), 1)]),
						_: 2
					}, 1032, ["style", "onClick"]))), 128))]),
					(F(!0), N(B, null, V(g.value.pipelineTabs, (e, t) => je((F(), N("div", {
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
					}, [(F(!0), N(B, null, V(e.fields, (t) => (F(), N("div", {
						key: `${e.label}-${t.label}`,
						style: {
							display: "flex",
							"flex-direction": "column",
							gap: "2px",
							"min-width": "0"
						}
					}, [z("span", Za, L(t.label), 1), z("span", {
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
					}, L(t.value), 9, Qa)]))), 128))])), [[at, r.value === t]])), 128))
				], 4)) : P("", !0),
				g.value.modelGroups.length ? (F(), N("div", {
					key: 8,
					style: R(p("#9C27B0", {
						emphasis: !0,
						startAlpha: .18,
						endAlpha: .1
					}))
				}, [z("div", $a, L(I(A)("sidebar.generation.modelBranches", "Model Branches")), 1), z("div", eo, [(F(!0), N(B, null, V(g.value.modelGroups, (e) => (F(), N("div", {
					key: `model-group-${e.key}`,
					style: R(te(w(e.key), !0))
				}, [
					z("div", to, [z("div", { style: R({
						fontSize: "10px",
						fontWeight: "800",
						color: w(e.key),
						letterSpacing: "0.6px",
						textTransform: "uppercase"
					}) }, L(e.label), 5), z("span", { style: R({
						fontSize: "9px",
						fontWeight: "700",
						color: "#fff",
						background: f(w(e.key), .22),
						border: `1px solid ${f(w(e.key), .48)}`,
						borderRadius: "999px",
						padding: "2px 8px",
						letterSpacing: "0.4px",
						textTransform: "uppercase"
					}) }, L(e.loras?.length || 0) + " LoRA ", 5)]),
					z("div", no, [t[4] ||= z("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.58)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, " UNet ", -1), z("div", {
						style: {
							"font-size": "12px",
							color: "var(--fg-color, rgba(255,255,255,0.96))",
							"line-height": "1.45",
							"word-break": "break-word",
							cursor: "pointer"
						},
						onClick: (t) => T(e.model, t.currentTarget)
					}, L(e.model || "-"), 9, ro)]),
					e.loras?.length ? (F(), N("div", io, [z("div", ao, L(I(A)("sidebar.generation.loraStack", "LoRA Stack")), 1), z("div", oo, [(F(!0), N(B, null, V(e.loras, (t, n) => (F(), N("div", {
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
					}, L(t), 9, so))), 128))])])) : P("", !0)
				], 4))), 128))])], 4)) : P("", !0),
				(F(!0), N(B, null, V(ee.value, (e) => (F(), N("div", {
					key: e.key,
					style: R(p(e.accent, { emphasis: e.emphasis }))
				}, [z("div", { style: R({
					fontSize: "11px",
					fontWeight: "600",
					color: e.accent,
					textTransform: "uppercase",
					letterSpacing: "0.5px",
					marginBottom: "10px"
				}) }, L(e.title), 5), z("div", co, [(F(!0), N(B, null, V(e.fields, (t) => (F(), N(B, { key: `${e.key}-${t.label}` }, [z("div", {
					title: t.label,
					style: {
						"font-size": "11px",
						color: "var(--mjr-muted, rgba(127,127,127,0.9))",
						"font-weight": "500",
						display: "flex",
						"align-items": "center",
						gap: "6px"
					}
				}, [z("span", null, L(t.label) + ":", 1), t.override ? (F(), N("span", {
					key: 0,
					style: R(h()),
					title: I(A)("sidebar.generation.overrideTooltip", "This field was forced by Majoor Gen Info Override")
				}, L(I(A)("sidebar.generation.override", "override")), 13, uo)) : P("", !0)], 8, lo), z("div", {
					title: `${t.label}: ${t.value}`,
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.95))",
						"word-break": "break-word",
						"white-space": "pre-wrap",
						cursor: "pointer"
					},
					onClick: (e) => T(t.value, e.currentTarget)
				}, L(t.value), 9, fo)], 64))), 128))])], 4))), 128)),
				g.value.notesFields.length ? (F(), N("div", {
					key: 9,
					style: R(p("#4CAF50", { emphasis: !1 }))
				}, [z("div", po, L(I(A)("sidebar.generation.notes", "Notes")), 1), (F(!0), N(B, null, V(g.value.notesFields, (e) => (F(), N("div", {
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
				}, L(e.value), 9, mo))), 128))], 4)) : P("", !0),
				(F(!0), N(B, null, V(g.value.customInfoBlocks, (e) => (F(), N("div", {
					key: `${e.title}-${e.content}`,
					style: R(p(e.color, { emphasis: !1 }))
				}, [z("div", { style: R({
					fontSize: "11px",
					fontWeight: "600",
					color: e.color,
					textTransform: "uppercase",
					letterSpacing: "0.5px",
					marginBottom: "8px"
				}) }, L(e.title), 5), z("div", {
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
				}, L(e.content), 9, ho)], 4))), 128)),
				g.value.ttsInstruction ? (F(), N("div", {
					key: 10,
					style: R(p("#26A69A", { emphasis: !1 }))
				}, [z("div", go, [z("span", null, L(I(A)("sidebar.generation.ttsInstruction", "TTS Instruction")), 1)]), z("div", {
					title: I(A)("action.clickToCopy", "Click to copy"),
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.9))",
						"line-height": "1.5",
						"white-space": "pre-wrap",
						"word-break": "break-word",
						cursor: "pointer"
					},
					onClick: t[2] ||= (e) => T(g.value.ttsInstruction, e.currentTarget)
				}, L(g.value.ttsInstruction), 9, _o)], 4)) : P("", !0),
				g.value.seed !== null && g.value.seed !== void 0 && g.value.seed !== "" ? (F(), N("div", {
					key: 11,
					style: R(m())
				}, [z("div", vo, L(I(A)("sidebar.generation.seed", "SEED")), 1), z("div", {
					title: I(A)("sidebar.generation.copySeedTooltip", "Click to copy seed: {seed}", { seed: g.value.seed }),
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
					onClick: t[3] ||= (e) => T(g.value.seed, e.currentTarget, "rgba(76, 175, 80, 0.4)")
				}, L(g.value.seed), 9, yo)], 4)) : P("", !0),
				g.value.inputFiles.length ? (F(), N("div", {
					key: 12,
					style: R(p("#4CAF50", {
						emphasis: !0,
						startAlpha: .16,
						endAlpha: .1
					}))
				}, [z("div", {
					title: I(A)("tooltip.generationInputs", "Input files used in generation"),
					style: {
						"font-size": "11px",
						"font-weight": "600",
						color: "#4CAF50",
						"text-transform": "uppercase",
						"letter-spacing": "0.5px",
						"margin-bottom": "8px"
					}
				}, L(I(A)("sidebar.generation.sourceFiles", "Source Files")), 9, bo), z("div", xo, [(F(!0), N(B, null, V(g.value.inputFiles, (e) => (F(), Ie(fa, {
					key: e.id,
					"input-file": e
				}, null, 8, ["input-file"]))), 128))])], 4)) : P("", !0)
			]));
		};
	}
}, Co = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, wo = /^[0-9a-f]{20,}$/i;
function To(...e) {
	for (let t of e) {
		let e = String(t || "").trim();
		if (e) return e;
	}
	return "";
}
function Eo(e) {
	let t = String(e || "").trim();
	return !!t && (Co.test(t) || wo.test(t));
}
function Do(e) {
	return String(e?.type || e?.class_type || e?.comfyClass || e?.classType || "").trim();
}
function Oo(e) {
	return To(e?.properties?.subgraph_name, e?.title, e?.properties?.title, e?.properties?.name, e?.properties?.label, e?.name, e?.subgraph?.name, e?.subgraph_instance?.name);
}
function ko(e) {
	let t = Do(e), n = Oo(e);
	return n && (!t || Eo(t) || n !== t) ? n : t && !Eo(t) ? t : n || (t ? "Subgraph" : String(e?.id || "Node").trim() || "Node");
}
function Ao(e) {
	let t = Do(e);
	return t && !Eo(t) ? t : t ? "Subgraph" : "Node";
}
//#endregion
//#region ui/components/sidebar/utils/minimap.ts
var jo = 6, Mo = 1, No = 8, Po = 74, Fo = 42, Io = [
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
], Lo = (e, t, n) => {
	let r = Number(e);
	return Number.isFinite(r) ? Math.max(t, Math.min(n, r)) : t;
}, Ro = (e, t = !1) => {
	let n = String(e || "").toUpperCase();
	return n.includes("IMAGE") ? "rgba(145,198,99,0.9)" : n.includes("LATENT") ? "rgba(89,178,118,0.9)" : n.includes("MODEL") ? "rgba(112,155,255,0.9)" : n.includes("CONDITIONING") ? "rgba(191,123,226,0.9)" : n.includes("CLIP") ? "rgba(220,178,77,0.9)" : n.includes("VAE") ? "rgba(72,184,214,0.9)" : n.includes("MASK") ? "rgba(190,190,190,0.88)" : n.includes("STRING") || n.includes("TEXT") ? "rgba(230,230,230,0.86)" : n.includes("INT") || n.includes("FLOAT") || n.includes("NUMBER") ? "rgba(130,210,220,0.88)" : t ? "rgba(170,220,255,0.82)" : "rgba(255,255,255,0.72)";
}, zo = (e, t, n) => {
	let r = String(t || "").replace(/\s+/g, " ").trim(), i = Math.max(1, Number(n) || 1);
	if (!r || e.measureText(r).width <= i) return r;
	let a = r;
	for (; a.length > 3 && e.measureText(`${a}...`).width > i;) a = a.slice(0, -1);
	return a.length > 3 ? `${a}...` : r.slice(0, 3);
};
function Bo(e, t, n = null) {
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
		expandSubgraphs: !0,
		...n && typeof n == "object" ? n : {}
	}, a = i.expandSubgraphs === !1 ? t : Vo(t), o = Array.isArray(a?.nodes) ? a.nodes : [], s = Array.isArray(a?.groups) && a.groups || Array.isArray(a?.extra?.groups) && a.extra.groups || Array.isArray(a?.extra?.groupNodes) && a.extra.groupNodes || Array.isArray(a?.extra?.group_nodes) && a.extra.group_nodes || [], c = Array.isArray(a?.links) && a.links || Array.isArray(a?.extra?.links) && a.extra.links || [], l = Math.max(1, e.clientWidth || e.width || 1), u = Math.max(1, e.clientHeight || e.height || 1);
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
		for (let [e, t] of Io) if (n.includes(e)) return t;
		let r = 0;
		for (let e = 0; e < n.length; e += 1) r = r * 31 + n.charCodeAt(e) | 0;
		return `hsl(${Math.abs(r) % 360} 42% 42%)`;
	}, p = (e) => {
		let t = [], n = e?.inputs && typeof e.inputs == "object" && !Array.isArray(e.inputs) ? e.inputs : null;
		if (n) {
			for (let [e, r] of Object.entries(n)) if (!(Array.isArray(r) || r && typeof r == "object") && (t.push([e, r]), t.length >= 3)) return t;
		}
		let r = Array.isArray(e?.widgets_values) ? e.widgets_values : [], i = Array.isArray(e?.widgets) ? e.widgets : [], a = Array.isArray(e?.inputs) ? e.inputs : [], o = a.filter((e) => e?.widget === !0 || e?.widget && typeof e.widget == "object" || typeof e?.widget == "string" && e.widget.trim()), s = a.filter((e) => e?.link == null && Yo(e?.type)), c = (o.length ? o : s.length ? s : a).map((e) => String(e?.label || e?.localized_name || e?.name || e?.widget?.name || e?.widget?.label || "").trim());
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
		let d = Number(e?.mode), v = d === 2 || d === 4, y = a?.extra?.errors || a?.extra?.node_errors || null, b = !!(y && typeof y == "object" && n && y[n] || e?.error || e?.errors || e?.flags?.error || e?.properties?.error), x = f(e), S = Array.isArray(e?.inputs) ? e.inputs : [], ee = Array.isArray(e?.outputs) ? e.outputs : [];
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
			inputs: S,
			outputs: ee,
			inputCount: S.length || (e?.inputs && typeof e.inputs == "object" ? Object.keys(e.inputs).length : 0),
			outputCount: ee.length,
			label: ko(e).replace(/\s+/g, " ").trim()
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
	let S = Math.max(1, b - v), ee = Math.max(1, x - y), C = v + S / 2, te = y + ee / 2, w = i.view && typeof i.view == "object" ? i.view : Object.create(null), T = Lo(w.zoom ?? 1, Mo, No), ne = Math.max(1, S / T), re = Math.max(1, ee / T), ie = ne / 2, ae = re / 2, oe = ne >= S ? C : Lo(w.centerX ?? C, v + ie, b - ie), E = re >= ee ? te : Lo(w.centerY ?? te, y + ae, x - ae), se = oe - ie, ce = E - ae, D = jo, le = Math.min((l - D * 2) / ne, (u - D * 2) / re), ue = w.hoveredNodeId !== null && w.hoveredNodeId !== void 0 ? String(w.hoveredNodeId) : null;
	r.clearRect(0, 0, l, u), r.fillStyle = "rgba(0,0,0,0.22)", r.fillRect(0, 0, l, u);
	let de = (e, t) => ({
		x: D + (e - se) * le,
		y: D + (t - ce) * le
	}), fe = (e, t) => ({
		x: Lo(se + (Number(e) - D) / le, v, b),
		y: Lo(ce + (Number(t) - D) / le, y, x)
	}), pe = (e) => ({
		x: D + (e.x - se) * le,
		y: D + (e.y - ce) * le,
		w: Math.max(1, e.w * le),
		h: Math.max(1, e.h * le)
	}), me = (e) => Math.max(10, Math.min(24, Math.floor(Number(e) * .2))), ge = (e, t, n) => {
		let r = pe(e), i = me(r.h), a = n === "output" ? e.outputs : e.inputs, o = Math.max(1, Array.isArray(a) ? a.length : Number(e[`${n}Count`]) || 0), s = Lo(t, 0, Math.max(0, o - 1));
		return r.y + i + (r.h - i) * (s + 1) / (o + 1);
	}, _e = (e) => Array.isArray(e) && e.length >= 5 ? {
		originId: e[1],
		originSlot: Number(e[2]) || 0,
		targetId: e[3],
		targetSlot: Number(e[4]) || 0,
		type: e[5]
	} : e && typeof e == "object" ? {
		originId: e.origin_id ?? e.originId ?? e.from ?? null,
		originSlot: Number(e.origin_slot ?? e.originSlot ?? e.fromSlot ?? 0) || 0,
		targetId: e.target_id ?? e.targetId ?? e.to ?? null,
		targetSlot: Number(e.target_slot ?? e.targetSlot ?? e.toSlot ?? 0) || 0,
		type: e.type
	} : null, ve = (e) => {
		let t = String(e || "").toUpperCase();
		return t.includes("IMAGE") ? "rgba(145,198,99,0.38)" : t.includes("LATENT") ? "rgba(89,178,118,0.38)" : t.includes("MODEL") ? "rgba(112,155,255,0.38)" : t.includes("CONDITIONING") ? "rgba(191,123,226,0.38)" : t.includes("CLIP") ? "rgba(220,178,77,0.38)" : t.includes("VAE") ? "rgba(72,184,214,0.38)" : t.includes("MASK") ? "rgba(190,190,190,0.36)" : "rgba(255,255,255,0.2)";
	}, O = () => {
		if (i.showLinks && !(!c || c.length === 0)) {
			r.save(), r.globalAlpha = 1, r.lineWidth = 1;
			for (let e of c) {
				let t = _e(e), n = t?.originId, i = t?.targetId;
				if (n === null || i === null) continue;
				let a = h.get(String(n)), o = h.get(String(i));
				if (!a || !o) continue;
				let s = pe(a), c = pe(o), l = {
					x: s.x + s.w,
					y: ge(a, t?.originSlot ?? 0, "output")
				}, u = {
					x: c.x,
					y: ge(o, t?.targetSlot ?? 0, "input")
				}, d = Math.max(12, Math.min(80, Math.abs(u.x - l.x) * .35));
				r.strokeStyle = ve(t?.type), r.beginPath(), r.moveTo(l.x, l.y), r.bezierCurveTo(l.x + d, l.y, u.x - d, u.y, u.x, u.y), r.stroke();
			}
			r.restore();
		}
	}, ye = (e) => {
		let { x: t, y: n, w: a, h: o } = pe(e), s = e.kind === "node", c = e.kind === "group", l = !!e.bypassed, u = !!e.errored, f = c ? .18 : l && i.renderBypassState ? .14 : .62, p = c ? .55 : l && i.renderBypassState ? .32 : .8, m = d(e.fill, f), h = d(e.stroke, p), g = s && i.showNodeLabels && a >= Po && o >= Fo, _ = Math.max(2, Math.min(g ? 7 : 8, Math.floor(Math.min(a, o) * .08))), v = s ? me(o) : 0;
		if (r.save(), r.globalAlpha = 1, typeof m == "string" && (m.startsWith("#") || m.startsWith("rgb") || m.startsWith("hsl")) ? (r.fillStyle = m, r.globalAlpha = f) : (r.fillStyle = typeof m == "string" ? m : "rgba(82,88,96,0.72)", r.globalAlpha = f), typeof r.roundRect == "function" ? (r.beginPath(), r.roundRect(t, n, a, o, _), r.fill()) : r.fillRect(t, n, a, o), r.restore(), s && (r.save(), r.fillStyle = d(e.stroke || e.fill, l ? .34 : .9), typeof r.roundRect == "function" ? (r.beginPath(), r.roundRect(t, n, a, v, [
			_,
			_,
			0,
			0
		]), r.fill()) : r.fillRect(t, n, a, v), r.restore()), r.globalAlpha = 1, r.strokeStyle = "rgba(255,255,255,0.22)", typeof h == "string" && (h.startsWith("#") || h.startsWith("rgb") || h.startsWith("hsl")) && (r.save(), r.globalAlpha = p, r.strokeStyle = h, r.restore()), s && l && i.renderBypassState) try {
			r.setLineDash([3, 2]);
		} catch (e) {
			console.debug?.(e);
		}
		else try {
			r.setLineDash([]);
		} catch (e) {
			console.debug?.(e);
		}
		if (r.lineWidth = 1, typeof r.roundRect == "function" ? (r.beginPath(), r.roundRect(t, n, a, o, _), r.stroke()) : r.strokeRect(t, n, a, o), s && a >= 24 && o >= 20) {
			let n = Math.min(g ? 16 : 6, Number(e.inputCount) || 0), i = Math.min(g ? 16 : 6, Number(e.outputCount) || 0);
			r.save(), r.strokeStyle = "rgba(0,0,0,0.48)", r.lineWidth = 1;
			for (let i = 0; i < n; i += 1) {
				let n = ge(e, i, "input");
				r.fillStyle = Ro(e.inputs?.[i]?.type, !1), r.beginPath(), r.arc(t, n, g ? 3 : 2.2, 0, Math.PI * 2), r.fill(), r.stroke();
			}
			for (let n = 0; n < i; n += 1) {
				let i = ge(e, n, "output");
				r.fillStyle = Ro(e.outputs?.[n]?.type, !0), r.beginPath(), r.arc(t + a, i, g ? 3 : 2.2, 0, Math.PI * 2), r.fill(), r.stroke();
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
		if (s && ue && String(e.id || "") === ue) {
			try {
				r.setLineDash([]);
			} catch (e) {
				console.debug?.(e);
			}
			r.strokeStyle = "rgba(255,224,130,0.96)", r.lineWidth = 2, r.strokeRect(t - 1, n - 1, a + 2, o + 2);
		}
		if (s && i.showNodeLabels && e.label && a >= 42 && o >= 12) {
			let i = Math.max(8, Math.min(12, Math.floor(v * .58))), o = n + Math.max(8, Math.floor((v + i) / 2) - 1), s = Math.max(20, a - 6), c = e.label;
			for (r.save(), r.beginPath(), r.rect(t + 2, n + 1, a - 4, v - 1), r.clip(), r.font = `600 ${i}px sans-serif`; c.length > 3 && r.measureText(`${c}...`).width > s;) c = c.slice(0, -1);
			let l = c === e.label ? c : `${c}...`;
			r.fillStyle = "rgba(255,255,255,0.92)", r.shadowColor = "rgba(0,0,0,0.5)", r.shadowBlur = 2, r.fillText(l, t + 3, o, s), r.restore();
		}
		if (s && i.showNodeLabels && Array.isArray(e.rows) && a >= 76 && o >= 46) {
			let i = Math.max(7, Math.min(10, Math.floor(o * .12))), s = Math.max(9, i + 4), c = n + v + 4;
			r.save(), r.font = `500 ${i}px sans-serif`, r.fillStyle = "rgba(255,255,255,0.62)";
			for (let l = 0; l < e.rows.length; l += 1) {
				let u = c + l * s;
				if (u + s > n + o - 2) break;
				let [d, f] = e.rows[l], p = `${String(d)}: ${String(f).replace(/\s+/g, " ").slice(0, 42)}`;
				r.fillText(p, t + 5, u + i, Math.max(20, a - 10));
			}
			r.restore();
		}
		if (g && a >= 110) {
			let n = Math.max(7, Math.min(9, Math.floor(o * .09)));
			r.save(), r.font = `500 ${n}px sans-serif`, r.fillStyle = "rgba(255,255,255,0.5)";
			let i = Math.max(24, a * .34);
			for (let a = 0; a < Math.min(8, e.inputs?.length || 0); a += 1) {
				let o = e.inputs[a], s = String(o?.label || o?.localized_name || o?.name || "").trim();
				s && r.fillText(zo(r, s, i), t + 7, ge(e, a, "input") + n * .35, i);
			}
			for (let o = 0; o < Math.min(8, e.outputs?.length || 0); o += 1) {
				let s = e.outputs[o], c = String(s?.label || s?.localized_name || s?.name || "").trim();
				if (!c) continue;
				let l = zo(r, c, i);
				r.fillText(l, t + a - 7 - Math.min(i, r.measureText(l).width), ge(e, o, "output") + n * .35, i);
			}
			r.restore();
		}
	};
	for (let e of m.filter((e) => e.kind === "group")) ye(e);
	O();
	for (let e of m.filter((e) => e.kind === "node")) ye(e);
	if (i.showViewport) try {
		let e = he();
		if (e) {
			let t = de(e.x0, e.y0), n = de(e.x1, e.y1), i = Math.min(t.x, n.x), a = Math.min(t.y, n.y), o = Math.abs(n.x - t.x), s = Math.abs(n.y - t.y);
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
			height: ee
		},
		resolvedView: {
			zoom: T,
			centerX: oe,
			centerY: E,
			visibleW: ne,
			visibleH: re,
			viewMinX: se,
			viewMinY: ce,
			pad: D,
			renderScale: le
		},
		canvasToWorld: fe,
		worldToCanvas: de,
		hitTestNode: (e, t) => {
			let n = fe(e, t);
			for (let e = m.length - 1; e >= 0; --e) {
				let t = m[e];
				if (t.kind === "node" && n.x >= t.x && n.x <= t.x + t.w && n.y >= t.y && n.y <= t.y + t.h) return t;
			}
			return null;
		}
	};
}
function Vo(e) {
	if (!e || typeof e != "object") return e;
	let t = Array.isArray(e.nodes) ? e.nodes.filter(Boolean) : [], n = Ho(e);
	if (!t.length) return e;
	let r = [], i = Array.isArray(e.links) ? [...e.links] : [], a = [...Array.isArray(e.groups) ? e.groups : [], ...Array.isArray(e.extra?.groups) ? e.extra.groups : []];
	for (let e of t) {
		r.push(e);
		let t = Uo(e, n);
		if (!t || !Array.isArray(t.nodes) || !t.nodes.length) continue;
		let o = Go(e, Vo(t));
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
function Ho(e) {
	let t = [
		...Array.isArray(e?.definitions?.subgraphs) ? e.definitions.subgraphs : [],
		...Array.isArray(e?.subgraphs) ? e.subgraphs : [],
		...Array.isArray(e?.rootGraph?.subgraphs) ? e.rootGraph.subgraphs : []
	], n = /* @__PURE__ */ new Map();
	for (let e of t) for (let t of Wo(e)) t != null && n.set(String(t), e);
	return n;
}
function Uo(e, t) {
	let n = [
		e?.type,
		e?.comfyClass,
		e?.class_type,
		e?.properties?.subgraph_id,
		e?.properties?.subgraphId,
		e?.subgraph?.id,
		e?._subgraph?.id,
		e?.subgraph_instance?.id
	];
	for (let e of n) {
		if (e == null) continue;
		let n = t.get(String(e));
		if (n) return n;
	}
	return [
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
function Wo(e) {
	return [
		e?.id,
		e?.name,
		e?.type,
		e?.uuid,
		e?.workflowId,
		e?.workflow_id,
		e?.properties?.subgraph_id,
		e?.properties?.subgraphId
	].filter((e) => e != null && String(e).trim());
}
function Go(e, t) {
	let n = String(e?.id ?? e?.ID ?? ""), r = qo(e?.pos) || [0, 0], i = Jo(e?.size) || [260, 180], a = t.nodes.filter(Boolean), o = Ko(a), s = Math.min(22, Math.max(8, i[0] * .08)), c = Math.min(34, Math.max(18, i[1] * .18)), l = Math.min(18, Math.max(8, i[1] * .08)), u = Math.max(40, i[0] - s * 2), d = Math.max(34, i[1] - c - l), f = Math.min(1, u / o.width, d / o.height), p = r[0] + s + (u - o.width * f) / 2, m = r[1] + c + (d - o.height * f) / 2, h = a.map((r) => {
		let i = qo(r?.pos) || [o.minX, o.minY], a = Jo(r?.size) || [140, 60];
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
function Ko(e) {
	let t = Infinity, n = Infinity, r = -Infinity, i = -Infinity;
	for (let a of e) {
		let e = qo(a?.pos);
		if (!e) continue;
		let o = Jo(a?.size) || [140, 60];
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
function qo(e) {
	if (Array.isArray(e) && e.length >= 2) return [Number(e[0]), Number(e[1])];
	if (e && typeof e == "object") {
		let t = e[0] ?? e[0] ?? e.x ?? e.left ?? null, n = e[1] ?? e[1] ?? e.y ?? e.top ?? null;
		if (t !== null && n !== null) return [Number(t), Number(n)];
	}
	return null;
}
function Jo(e) {
	if (Array.isArray(e) && e.length >= 2) return [Number(e[0]), Number(e[1])];
	if (e && typeof e == "object") {
		let t = e[0] ?? e[0] ?? e.w ?? e.width ?? null, n = e[1] ?? e[1] ?? e.h ?? e.height ?? null;
		if (t !== null && n !== null) return [Number(t), Number(n)];
	}
	return null;
}
function Yo(e) {
	if (Array.isArray(e)) return !0;
	let t = String(e || "").trim().toUpperCase();
	return t === "INT" || t === "FLOAT" || t === "STRING" || t === "BOOLEAN" || t === "BOOL" || t === "COMBO" || t === "ENUM";
}
function Xo(e, t = null) {
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
var Zo = {
	key: 0,
	class: "mjr-sidebar-section",
	style: {
		background: "var(--comfy-menu-bg, rgba(0,0,0,0.2))",
		border: "1px solid var(--border-color, rgba(255,255,255,0.14))",
		"border-radius": "8px",
		padding: "12px",
		"min-width": "300px"
	}
}, Qo = { style: { "margin-bottom": "12px" } }, $o = { style: {
	"font-size": "16px",
	"font-weight": "800",
	color: "rgba(255,255,255,0.94)",
	"line-height": "1.25",
	overflow: "hidden",
	"text-overflow": "ellipsis"
} }, es = ["title"], ts = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "8px",
	"margin-bottom": "10px"
} }, ns = { style: {
	padding: "4px 9px",
	"border-radius": "999px",
	background: "rgba(33,150,243,0.14)",
	border: "1px solid rgba(33,150,243,0.30)",
	"font-size": "11px",
	"font-weight": "700",
	color: "#90CAF9",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, rs = {
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
}, is = { style: {
	display: "grid",
	"grid-template-columns": "repeat(2, minmax(0, 1fr))",
	gap: "8px",
	"margin-bottom": "12px"
} }, as = {
	key: 0,
	style: {
		padding: "8px 10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.04)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, os = { style: {
	"font-size": "13px",
	"font-weight": "750",
	color: "rgba(255,255,255,0.92)",
	"margin-top": "3px"
} }, ss = {
	key: 1,
	style: {
		padding: "8px 10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.04)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, cs = { style: {
	"font-size": "13px",
	"font-weight": "750",
	color: "rgba(255,255,255,0.92)",
	"margin-top": "3px"
} }, ls = {
	key: 2,
	style: {
		padding: "8px 10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.04)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, us = { style: {
	"font-size": "13px",
	"font-weight": "750",
	color: "rgba(255,255,255,0.92)",
	"margin-top": "3px"
} }, ds = {
	key: 3,
	style: {
		padding: "8px 10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.04)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, fs = { style: {
	"font-size": "12px",
	"font-weight": "650",
	color: "rgba(255,255,255,0.84)",
	"margin-top": "3px"
} }, ps = {
	key: 0,
	style: {
		"font-size": "11px",
		color: "rgba(255,255,255,0.54)",
		"margin-top": "2px"
	}
}, ms = {
	key: 0,
	style: {
		"margin-bottom": "12px",
		padding: "10px",
		"border-radius": "10px",
		background: "rgba(244,67,54,0.08)",
		border: "1px solid rgba(244,67,54,0.25)"
	}
}, hs = {
	key: 1,
	style: {
		display: "flex",
		"flex-wrap": "wrap",
		gap: "5px"
	}
}, gs = {
	key: 1,
	style: {
		"margin-bottom": "12px",
		padding: "10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.035)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, _s = {
	key: 0,
	style: {
		"font-size": "12px",
		"line-height": "1.45",
		color: "rgba(255,255,255,0.82)",
		"white-space": "pre-wrap"
	}
}, vs = { style: {
	display: "grid",
	"grid-template-columns": "repeat(2, minmax(0, 1fr))",
	gap: "8px",
	"margin-bottom": "12px"
} }, ys = { style: {
	display: "grid",
	"grid-template-columns": "repeat(3, minmax(0, 1fr))",
	gap: "8px",
	"margin-bottom": "12px"
} }, bs = { style: {
	padding: "8px 10px",
	"border-radius": "10px",
	background: "rgba(255,255,255,0.04)",
	border: "1px solid rgba(255,255,255,0.10)"
} }, xs = { style: {
	"font-size": "18px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.94)",
	"margin-top": "2px"
} }, Ss = { style: {
	padding: "8px 10px",
	"border-radius": "10px",
	background: "rgba(255,255,255,0.04)",
	border: "1px solid rgba(255,255,255,0.10)"
} }, Cs = { style: {
	"font-size": "18px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.94)",
	"margin-top": "2px"
} }, ws = { style: {
	padding: "8px 10px",
	"border-radius": "10px",
	background: "rgba(255,255,255,0.04)",
	border: "1px solid rgba(255,255,255,0.10)"
} }, Ts = { style: {
	"font-size": "18px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.94)",
	"margin-top": "2px"
} }, Es = { style: {
	"margin-bottom": "12px",
	padding: "10px",
	"border-radius": "10px",
	background: "rgba(255,255,255,0.03)",
	border: "1px solid rgba(255,255,255,0.10)"
} }, Ds = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px",
	"margin-bottom": "8px"
} }, Os = { style: {
	"font-size": "12px",
	color: "rgba(255,255,255,0.8)",
	"margin-top": "2px"
} }, ks = {
	key: 0,
	style: {
		display: "flex",
		"flex-wrap": "wrap",
		gap: "4px",
		"justify-content": "flex-end"
	}
}, As = { style: {
	display: "flex",
	gap: "8px",
	"align-items": "center"
} }, js = ["placeholder"], Ms = {
	key: 2,
	class: "mjr-workflow-tree-wrap"
}, Ns = { class: "mjr-workflow-tree-node" }, Ps = { class: "mjr-workflow-tree-node-name" }, Fs = {
	key: 0,
	class: "mjr-workflow-tree-node-type"
}, Is = { class: "mjr-menu-item-hint" }, Ls = {
	key: 0,
	class: "mjr-section-hint"
}, Rs = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px",
	"margin-top": "8px"
} }, zs = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "6px",
	"align-items": "center"
} }, Bs = {
	key: 3,
	style: {
		display: "grid",
		"grid-template-columns": "repeat(auto-fit, minmax(180px, 1fr))",
		gap: "8px",
		"align-items": "stretch",
		"margin-top": "10px",
		"margin-bottom": "10px"
	}
}, Vs = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "2px",
	"min-width": "0"
} }, Hs = { style: {
	"font-size": "13px",
	"font-weight": "600"
} }, Us = { style: {
	"font-size": "11px",
	color: "rgba(255,255,255,0.58)"
} }, Ws = { style: {
	display: "flex",
	gap: "10px",
	"align-items": "stretch",
	"margin-top": "10px"
} }, Gs = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	gap: "10px",
	"margin-top": "8px",
	"font-size": "11px",
	color: "rgba(255,255,255,0.58)"
} }, Ks = ["open"], qs = { style: {
	background: "rgba(0,0,0,0.5)",
	padding: "10px",
	"border-radius": "6px",
	"font-size": "11px",
	overflow: "auto",
	"max-height": "180px",
	margin: "10px 0 0 0",
	color: "#90CAF9",
	"font-family": "'Consolas', 'Monaco', monospace"
} }, Js = 1, Ys = 8, Xs = 250, Zs = {
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
		]), a = j(null), o = j(""), c = j(!1), l = j(!1), u = j(null), d = j(!1), p = j(!1), m = j(ae()), h = j({ ...r }), g = j("crosshair"), _ = j(""), v = null, y = null, b = null;
		function x(e, t, n) {
			let r = Number(e);
			return Number.isFinite(r) ? Math.max(t, Math.min(n, r)) : t;
		}
		function S(e) {
			!e || typeof e != "object" || (h.value = {
				...h.value,
				zoom: x(e.zoom ?? h.value.zoom, Js, Ys),
				centerX: Number.isFinite(Number(e.centerX)) ? Number(e.centerX) : null,
				centerY: Number.isFinite(Number(e.centerY)) ? Number(e.centerY) : null
			});
		}
		function ee() {
			h.value = { ...r }, _.value = "";
		}
		function C(e) {
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
		function te(e) {
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
		function re(e) {
			let t = C(e), n = e?.prompt || e?.Prompt || t?.prompt || t?.Prompt || null;
			if (!n) return null;
			if (typeof n == "object") return te(n) ? n : null;
			if (typeof n == "string") {
				let e = n.trim();
				if (!e) return null;
				try {
					let t = JSON.parse(e);
					return te(t) ? t : null;
				} catch {
					return null;
				}
			}
			return null;
		}
		function ae() {
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
				let e = localStorage?.getItem?.(ie);
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
					}, q(e), localStorage?.removeItem?.(ie);
				} catch (e) {
					console.debug?.(e);
				}
				return r;
			} catch {
				return { ...n };
			}
		}
		function oe(e) {
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
		let E = M(() => {
			let e = T(t.asset) || T(u.value), n = re(t.asset) || re(u.value);
			return !e && !n ? null : e || Xo(n);
		}), se = M(() => String(t.asset?.filepath || t.asset?.path || t.asset?.file_info?.filepath || "").trim()), ce = M(() => String(t.asset?.display_name || t.asset?.name || t.asset?.filename || t.asset?.title || "Workflow").trim()), D = M(() => String(t.asset?.task || t.asset?.workflow_task || "").trim()), ue = M(() => String(t.asset?.model_family || t.asset?.workflow_model_family || "").trim()), de = M(() => String(t.asset?.provider || t.asset?.workflow_provider || "").trim()), fe = M(() => String(t.asset?.runs_on || t.asset?.runsOn || "").trim().toLowerCase()), me = M(() => {
			let e = fe.value, t = de.value;
			return e === "api" && t ? `API · ${t}` : e ? t && t.toLowerCase() !== e ? `${e} · ${t}` : e : t;
		}), he = M(() => String(t.asset?.notes || "").trim()), ge = M(() => [
			t.asset?.detected_task ? `detected: ${t.asset.detected_task}` : "",
			t.asset?.detected_model_family ? t.asset.detected_model_family : "",
			t.asset?.detected_provider ? t.asset.detected_provider : ""
		].filter(Boolean).join(" · ")), _e = M(() => be(t.asset?.missing_nodes || t.asset?.missingNodes)), ve = M(() => be(t.asset?.missing_models || t.asset?.missingModels)), O = M(() => {
			let e = Number(t.asset?.usage_count || t.asset?.usageCount || 0);
			return !Number.isFinite(e) || e <= 0 ? "" : `${Math.floor(e)} use${e === 1 ? "" : "s"}`;
		}), ye = M(() => xe(t.asset?.mtime || t.asset?.modified_at || t.asset?.updated_at));
		function be(e) {
			if (Array.isArray(e)) return e.map((e) => String(e || "").trim()).filter(Boolean);
			if (typeof e == "string") {
				let t = e.trim();
				if (!t) return [];
				try {
					let e = JSON.parse(t);
					if (Array.isArray(e)) return be(e);
				} catch {
					return t.split(/[,\n]/).map((e) => e.trim()).filter(Boolean);
				}
			}
			return [];
		}
		function xe(e) {
			let t = Number(e);
			if (!Number.isFinite(t) || t <= 0) return "";
			let n = t > 1e10 ? t : t * 1e3;
			try {
				return new Date(n).toLocaleString();
			} catch {
				return "";
			}
		}
		async function Se() {
			if (E.value) return;
			let e = se.value;
			if (e && !l.value) {
				l.value = !0;
				try {
					let t = await ne(e, { timeoutMs: 25e3 });
					if (!t?.ok) return;
					let n = t?.data?.workflow || t?.workflow || null, r = t?.data?.prompt || t?.prompt || null;
					if (!n && !r) return;
					u.value = {
						workflow: n,
						prompt: r
					};
				} catch (e) {
					console.debug?.(e);
				} finally {
					l.value = !1;
				}
			}
		}
		let Ce = M(() => t.asset?.has_generation_data ? "Complete" : "Partial"), we = M(() => E.value ? JSON.stringify(E.value, null, 2) : ""), Te = M(() => String(t.asset?.category || t.asset?.subfolder || t.asset?.folder || "").trim().replace(/^\/+|\/+$/g, "")), k = M(() => Te.value ? Te.value.split(/[\\/]+/).filter(Boolean) : []);
		function Ee(e, t) {
			let n = e?.id ?? e?.key ?? t + 1;
			return String(e?.title || e?._meta?.title || e?.type || e?.class_type || e?.name || `Node ${n}`);
		}
		function De(e) {
			return String(e?.type || e?.class_type || e?.name || "").trim();
		}
		function Oe() {
			o.value = Te.value;
		}
		async function Fe() {
			let e = String(t.asset?.filepath || t.asset?.path || t.asset?.file_info?.filepath || "").trim();
			if (!e) {
				s(A("toast.workflowMissingPath", "Workflow file path is missing."), "error");
				return;
			}
			let n = String(o.value || "").trim();
			if (n !== Te.value) {
				c.value = !0;
				try {
					let t = await f({
						filepath: e,
						category: n
					}, { timeoutMs: 3e4 });
					if (!t?.ok) {
						s(t?.error || A("toast.workflowMoveFailed", "Failed to move workflow."), "error");
						return;
					}
					o.value = String(t?.data?.workflow?.category || n || "").trim(), s(A("toast.workflowCategoryUpdated", "Workflow category updated"), "success", 1800);
				} catch {
					s(A("toast.workflowMoveFailed", "Failed to move workflow."), "error");
				} finally {
					c.value = !1;
				}
			}
		}
		async function ze() {
			let e = se.value;
			if (!e) {
				s(A("toast.workflowMissingPath", "Workflow file path is missing."), "error");
				return;
			}
			let n = await w({
				filepath: e,
				limit: 12
			}, { timeoutMs: 15e3 });
			if (!n?.ok) {
				s(n?.error || A("toast.workflowLoadFailed", "Failed to load workflow."), "error");
				return;
			}
			let r = Array.isArray(n.data) ? n.data : [];
			if (!r.length) {
				s(A("toast.workflowThumbnailNoCandidates", "No linked outputs are available for this workflow yet."), "warning", 2600);
				return;
			}
			let i = await yi({
				title: A("ctx.setWorkflowThumbnail", "Set workflow thumbnail"),
				workflow: t.asset,
				items: r
			});
			if (!i?.filepath) return;
			let a = await pe({
				filepath: e,
				source_filepath: i.filepath
			}, { timeoutMs: 3e4 });
			if (!a?.ok) {
				s(a?.error || A("toast.workflowSaveFailed", "Failed to save workflow."), "error");
				return;
			}
			s(A("toast.workflowUpdated", "Workflow updated"), "success", 1800), window?.dispatchEvent?.(new CustomEvent("mjr:reload-grid", { detail: { reason: "workflow-thumbnail-sidebar" } }));
		}
		async function Be() {
			if (await Se(), !E.value) {
				s(A("toast.workflowLoadFailed", "Failed to load workflow."), "error");
				return;
			}
			try {
				await le.openAssets({
					assets: [{
						...t.asset,
						workflow: E.value,
						Workflow: E.value
					}],
					index: 0,
					mode: "graph"
				});
			} catch (e) {
				console.debug?.(e), s(A("toast.workflowLoadFailed", "Failed to load workflow."), "error");
			}
		}
		let Ve = M(() => (Array.isArray(E.value?.nodes) ? E.value.nodes : []).slice(0, Xs).map((e, t) => {
			let n = e?.id ?? e?.key ?? t + 1, r = De(e);
			return {
				key: String(n),
				label: Ee(e, t),
				icon: "pi pi-circle-fill",
				data: {
					id: n,
					type: r
				}
			};
		})), He = M(() => Math.max(0, Number(Ue.value.nodes || 0) - Ve.value.length)), Ue = M(() => {
			let e = E.value;
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
		}), We = M(() => {
			let e = String(m.value?.size || "comfortable");
			return i.find((t) => t.key === e) || i[1];
		}), Ge = M(() => `${We.value.height}px`), Ke = M(() => [
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
		function Je() {
			let e = a.value, t = E.value;
			if (!e || !t) return;
			let n = Math.max(1, e.clientWidth || 320), r = Math.max(1, e.clientHeight || 120), i = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
			e.width = Math.floor(n * i), e.height = Math.floor(r * i);
			let o = e.getContext("2d");
			o && o.setTransform(i, 0, 0, i, 0, 0), y = Bo(e, t, {
				...m.value,
				view: h.value
			}) || null, S(y?.resolvedView);
		}
		function Ye(e) {
			ke(e);
		}
		function Xe(e) {
			let t = a.value;
			if (!t) return null;
			let n = t.getBoundingClientRect?.();
			return n ? {
				x: Number(e?.clientX) - n.left,
				y: Number(e?.clientY) - n.top
			} : null;
		}
		function Ze(e) {
			let t = Xe(e);
			return !t || !y?.canvasToWorld ? null : {
				local: t,
				world: y.canvasToWorld(t.x, t.y)
			};
		}
		function $e(e) {
			let t = Xe(e), n = t && y?.hitTestNode ? y.hitTestNode(t.x, t.y) : null, r = n?.id !== null && n?.id !== void 0 ? String(n.id) : null, i = h.value.hoveredNodeId !== null && h.value.hoveredNodeId !== void 0 ? String(h.value.hoveredNodeId) : null;
			_.value = n?.label || "", r !== i && (h.value = {
				...h.value,
				hoveredNodeId: r
			}, Je());
		}
		function et(e) {
			e && (Ye(e), h.value = {
				...h.value,
				centerX: Number(e.x),
				centerY: Number(e.y)
			}, Je());
		}
		function tt(e) {
			if (Number(e?.button ?? 0) !== 0) return;
			let t = Ze(e);
			t && (b = e.pointerId ?? 1, g.value = "grabbing", a.value?.setPointerCapture?.(b), et(t.world), $e(e), e.preventDefault?.(), e.stopPropagation?.());
		}
		function nt(e) {
			if (b !== null && e.pointerId === b) {
				let t = Ze(e);
				t && et(t.world), e.preventDefault?.(), e.stopPropagation?.();
				return;
			}
			$e(e);
		}
		function rt(e) {
			b !== null && e?.pointerId === b && (a.value?.releasePointerCapture?.(b), b = null, g.value = "crosshair"), e?.type === "pointerleave" && (_.value = "", h.value.hoveredNodeId !== null && (h.value = {
				...h.value,
				hoveredNodeId: null
			}, Je()));
		}
		function at(e) {
			let t = Ze(e), n = y?.resolvedView;
			if (!t || !n) return;
			let r = x(Number(e?.deltaY) || 0, -240, 240), i = Math.exp(-r * .0025), a = x((Number(h.value.zoom) || 1) * i, Js, Ys);
			if (Math.abs(a - (Number(h.value.zoom) || 1)) < .001) {
				e.preventDefault?.(), e.stopPropagation?.();
				return;
			}
			let o = Math.max(1, Number(y?.bounds?.width || 1) / a), s = Math.max(1, Number(y?.bounds?.height || 1) / a), c = x((Number(t.world.x) - Number(n.viewMinX || 0)) / Math.max(1, Number(n.visibleW || 1)), 0, 1), l = x((Number(t.world.y) - Number(n.viewMinY || 0)) / Math.max(1, Number(n.visibleH || 1)), 0, 1);
			h.value = {
				...h.value,
				zoom: a,
				centerX: Number(t.world.x) + (.5 - c) * o,
				centerY: Number(t.world.y) + (.5 - l) * s
			}, Je(), $e(e), e.preventDefault?.(), e.stopPropagation?.();
		}
		function ot(e) {
			let t = Ze(e);
			ee(), t && Ye(t.world), Je(), e.preventDefault?.(), e.stopPropagation?.();
		}
		function st(e) {
			m.value = {
				...m.value,
				[e]: !m.value?.[e]
			}, oe(m.value);
		}
		function ct(e) {
			i.some((t) => t.key === e) && (m.value = {
				...m.value,
				size: e
			}, oe(m.value));
		}
		return Ae(() => {
			a.value && typeof ResizeObserver == "function" && (v = new ResizeObserver(() => Je()), v.observe(a.value)), Oe(), Se(), Je();
		}), Me(E, () => {
			ee(), Je();
		}, { flush: "post" }), Me(se, () => {
			u.value = null, Se();
		}, { immediate: !0 }), Me(Te, () => {
			Oe();
		}), Me(m, () => {
			Je();
		}, {
			deep: !0,
			flush: "post"
		}), Me(d, () => {
			Je();
		}, { flush: "post" }), Pe(() => {
			try {
				v?.disconnect?.();
			} catch (e) {
				console.debug?.(e);
			}
			v = null, b = null;
		}), (e, t) => {
			let n = Le("MButton"), r = Le("MTree");
			return E.value ? (F(), N("div", Zo, [
				t[17] ||= z("div", { style: {
					"font-size": "13px",
					"font-weight": "600",
					color: "var(--fg-color, #eaeaea)",
					"margin-bottom": "12px",
					"text-transform": "uppercase",
					"letter-spacing": "0.5px"
				} }, " ComfyUI Workflow ", -1),
				z("div", Qo, [z("div", $o, L(ce.value), 1), se.value ? (F(), N("div", {
					key: 0,
					style: {
						"font-size": "11px",
						color: "rgba(255,255,255,0.48)",
						"margin-top": "4px",
						overflow: "hidden",
						"text-overflow": "ellipsis",
						"white-space": "nowrap"
					},
					title: se.value
				}, L(se.value), 9, es)) : P("", !0)]),
				z("div", ts, [z("div", ns, L(Ce.value), 1), Ue.value.source ? (F(), N("div", rs, L(Ue.value.source), 1)) : P("", !0)]),
				z("div", is, [
					D.value ? (F(), N("div", as, [t[3] ||= z("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Task", -1), z("div", os, L(D.value), 1)])) : P("", !0),
					ue.value ? (F(), N("div", ss, [t[4] ||= z("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Model", -1), z("div", cs, L(ue.value), 1)])) : P("", !0),
					me.value ? (F(), N("div", ls, [t[5] ||= z("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Runs on", -1), z("div", us, L(me.value), 1)])) : P("", !0),
					O.value || ye.value ? (F(), N("div", ds, [
						t[6] ||= z("div", { style: {
							"font-size": "10px",
							"font-weight": "700",
							color: "rgba(255,255,255,0.55)",
							"text-transform": "uppercase",
							"letter-spacing": "0.4px"
						} }, "Library", -1),
						z("div", fs, L(O.value || ye.value), 1),
						O.value && ye.value ? (F(), N("div", ps, L(ye.value), 1)) : P("", !0)
					])) : P("", !0)
				]),
				_e.value.length || ve.value.length ? (F(), N("div", ms, [
					t[7] ||= z("div", { style: {
						"font-size": "10px",
						"font-weight": "800",
						color: "#ef9a9a",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px",
						"margin-bottom": "6px"
					} }, "Missing dependencies", -1),
					_e.value.length ? (F(), N("div", {
						key: 0,
						style: R({
							display: "flex",
							flexWrap: "wrap",
							gap: "5px",
							marginBottom: ve.value.length ? "7px" : "0"
						})
					}, [(F(!0), N(B, null, V(_e.value, (e) => (F(), N("span", {
						key: `node-${e}`,
						style: {
							padding: "3px 7px",
							"border-radius": "999px",
							background: "rgba(244,67,54,0.16)",
							"font-size": "10px",
							"font-weight": "700",
							color: "#ffcdd2"
						}
					}, L(e), 1))), 128))], 4)) : P("", !0),
					ve.value.length ? (F(), N("div", hs, [(F(!0), N(B, null, V(ve.value, (e) => (F(), N("span", {
						key: `model-${e}`,
						style: {
							padding: "3px 7px",
							"border-radius": "999px",
							background: "rgba(255,152,0,0.16)",
							"font-size": "10px",
							"font-weight": "700",
							color: "#ffe0b2"
						}
					}, L(e), 1))), 128))])) : P("", !0)
				])) : P("", !0),
				he.value || ge.value ? (F(), N("div", gs, [he.value ? (F(), N("div", _s, L(he.value), 1)) : P("", !0), ge.value ? (F(), N("div", {
					key: 1,
					style: R({
						fontSize: "11px",
						color: "rgba(255,255,255,0.48)",
						marginTop: he.value ? "7px" : "0"
					})
				}, L(ge.value), 5)) : P("", !0)])) : P("", !0),
				z("div", vs, [qe(n, {
					type: "button",
					severity: "secondary",
					text: "",
					rounded: "",
					style: {
						height: "34px",
						"border-radius": "9px",
						border: "1px solid rgba(255,255,255,0.12)",
						background: "rgba(33,150,243,0.14)",
						color: "rgba(255,255,255,0.92)",
						"font-size": "12px",
						"font-weight": "750",
						display: "inline-flex",
						"align-items": "center",
						"justify-content": "center",
						gap: "7px"
					},
					onClick: ze
				}, {
					default: Re(() => [t[8] ||= z("i", { class: "pi pi-image" }, null, -1), z("span", null, L(I(A)("ctx.setWorkflowThumbnail", "Set workflow thumbnail")), 1)]),
					_: 1
				}), qe(n, {
					type: "button",
					severity: "secondary",
					text: "",
					rounded: "",
					style: {
						height: "34px",
						"border-radius": "9px",
						border: "1px solid rgba(255,255,255,0.12)",
						background: "rgba(255,255,255,0.06)",
						color: "rgba(255,255,255,0.92)",
						"font-size": "12px",
						"font-weight": "750",
						display: "inline-flex",
						"align-items": "center",
						"justify-content": "center",
						gap: "7px"
					},
					onClick: Be
				}, {
					default: Re(() => [t[9] ||= z("i", { class: "pi pi-search" }, null, -1), z("span", null, L(I(A)("ctx.inspect", "Inspect")), 1)]),
					_: 1
				})]),
				z("div", ys, [
					z("div", bs, [t[10] ||= z("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Nodes", -1), z("div", xs, L(Ue.value.nodes), 1)]),
					z("div", Ss, [t[11] ||= z("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Links", -1), z("div", Cs, L(Ue.value.links), 1)]),
					z("div", ws, [t[12] ||= z("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Groups", -1), z("div", Ts, L(Ue.value.groups), 1)])
				]),
				z("div", Es, [z("div", Ds, [z("div", null, [t[13] ||= z("div", { style: {
					"font-size": "10px",
					"font-weight": "700",
					color: "rgba(255,255,255,0.55)",
					"text-transform": "uppercase",
					"letter-spacing": "0.4px"
				} }, "Category", -1), z("div", Os, L(Te.value || "Root"), 1)]), k.value.length ? (F(), N("div", ks, [(F(!0), N(B, null, V(k.value, (e) => (F(), N("span", {
					key: e,
					style: {
						padding: "3px 7px",
						"border-radius": "999px",
						background: "rgba(33,150,243,0.12)",
						border: "1px solid rgba(33,150,243,0.22)",
						"font-size": "10px",
						"font-weight": "700",
						color: "#90CAF9",
						"text-transform": "uppercase",
						"letter-spacing": "0.3px"
					}
				}, L(e), 1))), 128))])) : P("", !0)]), z("div", As, [je(z("input", {
					"onUpdate:modelValue": t[0] ||= (e) => o.value = e,
					type: "text",
					placeholder: I(A)("dialog.workflowCategory", "Workflow category"),
					style: {
						flex: "1",
						"min-width": "0",
						padding: "9px 10px",
						"border-radius": "8px",
						border: "1px solid rgba(255,255,255,0.12)",
						background: "rgba(0,0,0,0.22)",
						color: "rgba(255,255,255,0.92)",
						"font-size": "12px"
					}
				}, null, 8, js), [[it, o.value]]), qe(n, {
					type: "button",
					severity: "secondary",
					text: "",
					rounded: "",
					disabled: c.value,
					style: R({
						padding: "8px 12px",
						borderRadius: "8px",
						border: "1px solid rgba(255,255,255,0.12)",
						background: c.value ? "rgba(255,255,255,0.06)" : "rgba(33,150,243,0.16)",
						color: "rgba(255,255,255,0.92)",
						cursor: c.value ? "wait" : "pointer",
						fontSize: "12px",
						fontWeight: "700",
						whiteSpace: "nowrap"
					}),
					onClick: Fe
				}, {
					default: Re(() => [Ne(L(c.value ? "Saving..." : "Move"), 1)]),
					_: 1
				}, 8, ["disabled", "style"])])]),
				Ve.value.length ? (F(), N("div", Ms, [
					t[14] ||= z("div", { class: "mjr-section-title" }, " Workflow Nodes ", -1),
					qe(r, {
						value: Ve.value,
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
						default: Re(({ node: e }) => [z("span", Ns, [
							z("span", Ps, L(e.label), 1),
							e.data?.type ? (F(), N("span", Fs, L(e.data.type), 1)) : P("", !0),
							z("span", Is, "#" + L(e.data?.id), 1)
						])]),
						_: 1
					}, 8, ["value"]),
					He.value ? (F(), N("div", Ls, " +" + L(He.value) + " more nodes ", 1)) : P("", !0)
				])) : P("", !0),
				z("div", Rs, [z("div", zs, [(F(!0), N(B, null, V(I(i), (e) => (F(), Ie(n, {
					key: e.key,
					type: "button",
					severity: "secondary",
					text: "",
					rounded: "",
					title: `${e.label} minimap`,
					style: R({
						appearance: "none",
						border: m.value.size === e.key ? "1px solid rgba(33,150,243,0.55)" : "1px solid rgba(255,255,255,0.12)",
						borderRadius: "999px",
						padding: "4px 10px",
						background: m.value.size === e.key ? "rgba(33,150,243,0.18)" : "rgba(255,255,255,0.04)",
						color: m.value.size === e.key ? "#90CAF9" : "rgba(255,255,255,0.78)",
						fontSize: "11px",
						fontWeight: m.value.size === e.key ? "700" : "600",
						cursor: "pointer"
					}),
					onClick: (t) => ct(e.key)
				}, {
					default: Re(() => [Ne(L(e.label), 1)]),
					_: 2
				}, 1032, [
					"title",
					"style",
					"onClick"
				]))), 128))]), qe(n, {
					type: "button",
					class: "mjr-btn mjr-icon-btn",
					severity: "secondary",
					text: "",
					rounded: "",
					title: I(A)("tooltip.minimapSettings", "Minimap settings"),
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
					onClick: t[1] ||= (e) => d.value = !d.value
				}, {
					default: Re(() => [...t[15] ||= [z("i", { class: "pi pi-sliders-h" }, null, -1)]]),
					_: 1
				}, 8, ["title"])]),
				d.value ? (F(), N("div", Bs, [(F(!0), N(B, null, V(Ke.value, (e) => (F(), Ie(n, {
					key: e.key,
					type: "button",
					severity: "secondary",
					text: "",
					style: R({
						display: "flex",
						alignItems: "center",
						gap: "10px",
						padding: "9px 10px",
						borderRadius: "10px",
						border: m.value?.[e.key] ? "1px solid rgba(76,175,80,0.40)" : "1px solid rgba(255,255,255,0.12)",
						background: m.value?.[e.key] ? "rgba(76,175,80,0.10)" : "rgba(255,255,255,0.04)",
						cursor: "pointer",
						color: "rgba(255,255,255,0.92)",
						textAlign: "left"
					}),
					onClick: (t) => st(e.key)
				}, {
					default: Re(() => [
						z("span", { style: R({
							width: "22px",
							height: "22px",
							borderRadius: "6px",
							display: "inline-flex",
							alignItems: "center",
							justifyContent: "center",
							background: m.value?.[e.key] ? "rgba(76,175,80,0.95)" : "rgba(255,255,255,0.08)",
							border: m.value?.[e.key] ? "1px solid rgba(76,175,80,0.35)" : "1px solid rgba(255,255,255,0.12)",
							flex: "0 0 auto"
						}) }, [z("i", {
							class: "pi pi-check",
							style: R({
								fontSize: "12px",
								opacity: m.value?.[e.key] ? "1" : "0"
							})
						}, null, 4)], 4),
						z("i", {
							class: Qe(e.iconClass),
							style: {
								"font-size": "18px",
								opacity: "0.9",
								width: "18px"
							}
						}, null, 2),
						z("div", Vs, [z("div", Hs, L(e.label), 1), z("div", Us, L(m.value?.[e.key] ? "On" : "Off"), 1)])
					]),
					_: 2
				}, 1032, ["style", "onClick"]))), 128))])) : P("", !0),
				z("div", Ws, [z("canvas", {
					ref_key: "canvasRef",
					ref: a,
					style: R({
						width: "100%",
						height: Ge.value,
						cursor: g.value,
						touchAction: "none",
						borderRadius: "10px",
						marginTop: "0",
						background: "linear-gradient(180deg, rgba(7, 12, 18, 0.95) 0%, rgba(10, 16, 24, 0.92) 100%)",
						border: "1px solid var(--mjr-border, rgba(255,255,255,0.12))",
						boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.03)"
					}),
					onPointerdown: tt,
					onPointermove: nt,
					onPointerup: rt,
					onPointercancel: rt,
					onPointerleave: rt,
					onWheel: at,
					onDblclick: ot
				}, null, 36)]),
				z("div", Gs, [z("span", null, L(_.value || "Click/drag to navigate | wheel to zoom"), 1), z("span", null, L(Math.round((h.value.zoom || 1) * 100)) + "% | " + L(We.value.label), 1)]),
				z("details", {
					open: p.value,
					style: { "margin-top": "10px" },
					onToggle: t[2] ||= (e) => p.value = e.target.open
				}, [t[16] ||= z("summary", { style: {
					cursor: "pointer",
					color: "var(--mjr-muted, rgba(255,255,255,0.65))",
					"font-size": "12px",
					"user-select": "none"
				} }, " Show raw JSON ", -1), z("pre", qs, L(we.value), 1)], 40, Ks)
			])) : P("", !0);
		};
	}
};
//#endregion
export { si as A, Wr as B, hi as C, ti as D, di as E, Jr as F, gr as G, Dr as H, Gr as I, K as J, on as K, Or as L, ai as M, ii as N, qr as O, oi as P, ht as Q, Fr as R, mi as S, fi as T, Er as U, Hr as V, _r as W, Et as X, q as Y, Dt as Z, yi as _, Do as a, _i as b, oa as c, Ni as d, Mi as f, bi as g, ki as h, ko as i, ei as j, ni as k, Ri as l, Oi as m, Bo as n, Ao as o, Ci as p, J as q, Xo as r, So as s, Zs as t, ji as u, vi as v, ci as w, pi as x, Z as y, Pr as z };
