import { $t as e, B as t, Bt as n, Dt as r, Et as i, F as a, Ft as o, G as s, Gt as c, I as l, It as u, Kt as d, L as f, Lt as p, M as m, N as h, Ot as g, P as _, Pt as v, R as y, Rt as b, S as x, U as S, V as C, Vt as w, W as T, Wt as E, Yt as ee, _t as D, at as te, bt as ne, ct as re, dt as ie, en as ae, ft as oe, gt as se, i as ce, it as O, k, lt as le, nt as ue, ot as de, pt as fe, r as pe, rt as me, st as he, ut as ge, vt as _e, wt as ve, xt as ye, z as be, zt as xe } from "./hostAdapter-D6BwD-lN.js";
import { m as Se, n as A, t as j } from "./config-dvcltBqE.js";
import { B as Ce, C as we, D as Te, E as Ee, F as M, H as De, L as N, M as Oe, N as ke, S as P, T as F, U as Ae, Z as I, _ as je, a as Me, at as L, c as Ne, d as Pe, f as Fe, g as Ie, h as Le, i as Re, it as ze, l as Be, m as Ve, n as He, o as Ue, ot as R, p as We, r as Ge, rt as Ke, s as qe, t as Je, u as Ye, v as Xe, w as z, x as B, y as V, z as Ze } from "./mjr-primevue-DeVPqKdl.js";
import { n as Qe, r as $e, t as et } from "./mjr-vue-vendor--o0qJuos.js";
import { a as tt, i as nt, n as rt, o as it, r as at, t as ot } from "./geninfoParser-BE5lWeGw.js";
//#region ui/utils/events.ts
function st(e, t, { target: n = null, warnPrefix: r = "[Majoor]" } = {}) {
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
}, ct = (e, t, n) => {
	let r = typeof e == "string" ? e.trim() : String(e ?? "");
	return t.includes(r) ? r : n;
}, lt = (e) => e === "__proto__" || e === "prototype" || e === "constructor", ut = (e, t) => {
	let n = { ...e };
	return !t || typeof t != "object" || Object.keys(t).forEach((r) => {
		if (lt(r)) return;
		let i = t[r];
		i && typeof i == "object" && !Array.isArray(i) ? n[r] = ut(e[r] || {}, i) : i !== void 0 && (n[r] = i);
	}), n;
}, dt = Object.freeze({
	small: 80,
	medium: 120,
	large: 180
}), ft = Object.freeze([
	"small",
	"medium",
	"large"
]), pt = (e, t) => Math.max(60, Math.min(600, Math.round(U(e, t)))), mt = (e = {}) => {
	let t = Number(e?.minSize);
	if (Number.isFinite(t)) return pt(t, A.GRID_MIN_SIZE);
	let n = ct(String(e?.minSizePreset || "").toLowerCase(), ft, "");
	return n ? dt[n] : pt(e?.minSize, A.GRID_MIN_SIZE);
}, ht = (e = {}) => pt(e?.minSize, A.FEED_GRID_MIN_SIZE), gt = (e) => {
	let t = Math.round(U(e, A.GRID_MIN_SIZE));
	return t <= 100 ? "small" : t >= 150 ? "large" : "medium";
}, _t = async (e, t = "Majoor", r = {}) => {
	let i = xt();
	if (i && typeof i.alert == "function") try {
		await i.alert({
			title: String(t || "Majoor"),
			message: String(e || "")
		});
		return;
	} catch (e) {
		console.debug?.(e);
	}
	let a = St();
	if (a) try {
		let n = String(e || "");
		typeof a.addAlert == "function" ? a.addAlert(n) : a.add({
			severity: "info",
			summary: String(t || "Majoor"),
			detail: n,
			life: 5e3
		});
		return;
	} catch (e) {
		console.debug?.(e);
	}
	if (r?.native !== !1) {
		let n = Ct();
		if (n) try {
			n.show(wt(e, t));
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
	let o = kt();
	if (!o) {
		try {
			window.alert(e);
		} catch (e) {
			console.debug?.(e);
		}
		return;
	}
	return new Promise((r) => {
		let i = new o();
		Nt(i);
		let a = W("div", { style: {
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
				textContent: n("dialog.confirm", "Confirm"),
				onclick: () => {
					try {
						i.close();
					} catch (e) {
						console.debug?.(e);
					}
					r();
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
			i.show(a), setTimeout(() => Pt(i), 0);
		} catch {
			try {
				window.alert(e);
			} catch (e) {
				console.debug?.(e);
			}
			r();
		}
	});
}, vt = async (e, t = "Majoor") => {
	let r = xt();
	if (r) try {
		let i = {
			title: String(t || n("dialog.confirm", "Confirm")),
			message: String(e || "")
		};
		return !!(typeof r.confirm == "function" && await r.confirm(i));
	} catch (e) {
		console.debug?.(e);
	}
	let i = kt();
	if (!i) try {
		return window.confirm(e);
	} catch {
		return !1;
	}
	return new Promise((r) => {
		let a = new i();
		Nt(a);
		let o = (e) => {
			try {
				a.close();
			} catch (e) {
				console.debug?.(e);
			}
			r(!!e);
		}, s = W("div", { style: {
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
				textContent: n("dialog.cancel", "Cancel"),
				onclick: () => o(!1),
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
				textContent: n("dialog.confirm", "Confirm"),
				onclick: () => o(!0),
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
			a.show(s), setTimeout(() => Pt(a), 0);
		} catch {
			try {
				r(!!window.confirm(e));
			} catch {
				r(!1);
			}
		}
	});
}, yt = async (e, t = "", r = "Majoor") => {
	let i = xt();
	if (i) try {
		let a = {
			title: String(r || n("dialog.prompt", "Prompt")),
			message: String(e || ""),
			defaultValue: String(t ?? "")
		}, o = typeof i.prompt == "function" ? await i.prompt(a) : null;
		return o == null ? null : String(o);
	} catch (e) {
		console.debug?.(e);
	}
	let a = kt();
	if (!a) try {
		return window.prompt(e, t);
	} catch {
		return null;
	}
	return new Promise((i) => {
		let o = new a();
		Nt(o);
		let s = (e) => {
			try {
				o.close();
			} catch (e) {
				console.debug?.(e);
			}
			i(e ?? null);
		}, c = W("input", {
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
				e.key === "Enter" && s(c.value), e.key === "Escape" && s(null), e.stopPropagation();
			}
		}), l = W("div", { style: {
			display: "flex",
			flexDirection: "column",
			gap: "12px",
			padding: "16px"
		} }, [
			W("div", {
				textContent: r,
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
			c,
			W("div", { style: {
				display: "flex",
				justifyContent: "flex-end",
				gap: "10px"
			} }, [W("button", {
				textContent: n("dialog.cancel", "Cancel"),
				onclick: () => s(null),
				style: {
					padding: "8px 12px",
					borderRadius: "8px",
					border: "1px solid rgba(255,255,255,0.12)",
					background: "rgba(0,0,0,0.25)",
					color: "rgba(255,255,255,0.85)",
					cursor: "pointer"
				}
			}), W("button", {
				textContent: n("dialog.ok", "OK"),
				onclick: () => s(c.value),
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
			o.show(l), setTimeout(() => Pt(o), 0), setTimeout(() => {
				try {
					c.focus(), c.select();
				} catch (e) {
					console.debug?.(e);
				}
			}, 0);
		} catch {
			try {
				i(window.prompt(e, t));
			} catch {
				i(null);
			}
		}
	});
}, bt = () => {
	try {
		return E()?.ui || null;
	} catch {
		return null;
	}
}, xt = () => {
	let e = (e) => !!e && (typeof e.alert == "function" || typeof e.confirm == "function" || typeof e.prompt == "function");
	try {
		let t = c(E());
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
}, St = () => {
	try {
		let e = d(E());
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
}, Ct = () => {
	try {
		let e = bt();
		if (e?.dialog && typeof e.dialog.show == "function") return e.dialog;
	} catch (e) {
		console.debug?.(e);
	}
	return null;
}, wt = (e, t = "Majoor") => {
	let n = String(e ?? ""), r = String(t ?? "").trim();
	return !r || r.toLowerCase() === "majoor" ? n : `${r}<br><br>${n}`;
}, Tt = new Set(/* @__PURE__ */ "abort.blur.change.click.close.contextmenu.dblclick.dragend.dragenter.dragleave.dragover.dragstart.drop.error.focus.input.keydown.keypress.keyup.load.mousedown.mouseenter.mouseleave.mousemove.mouseout.mouseover.mouseup.reset.resize.scroll.select.submit.touchcancel.touchend.touchmove.touchstart.transitionend.unload.wheel".split(".")), Et = new Set([
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
]), Dt = new Set([
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
]), Ot = (e, t = {}, n = []) => {
	let r = document.createElement(e);
	return Object.entries(t || {}).forEach(([e, t]) => {
		let n = String(e || "");
		if (!(!n || Et.has(n))) {
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
					Tt.has(e) && r.addEventListener(e, t);
				}
				return;
			}
			if (Dt.has(n)) try {
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
	let r = bt();
	if (r?.$el) try {
		return r.$el(e, t, n);
	} catch {}
	return Ot(e, t, n);
}, kt = () => bt()?.ComfyDialog || null, At = 999999, jt = 560, Mt = 12, Nt = (e) => {
	try {
		e.element.style.zIndex = String(At), e.element.style.width = `${jt}px`, e.element.style.padding = "0", e.element.style.backgroundColor = "var(--comfy-menu-bg, #131722)", e.element.style.border = "1px solid rgba(255,255,255,0.14)", e.element.style.borderRadius = `${Mt}px`, e.element.style.boxSizing = "border-box", e.element.style.overflow = "hidden", e.element.style.boxShadow = "0 18px 48px rgba(0,0,0,0.48)";
	} catch (e) {
		console.debug?.(e);
	}
}, Pt = (e) => {
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
		runtimeDashboardMode: "autoHide30",
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
		let e = w.get(ae);
		if (!e) return { ...G };
		let t = JSON.parse(e), n = t && typeof t == "object" && Number.isInteger(t.version) && t.data && typeof t.data == "object";
		if (!n && !(t && typeof t == "object" && !Array.isArray(t))) return { ...G };
		if (n && Number(t.version) > 1) return console.warn("[Majoor] settings schema version is newer than this build, using defaults"), { ...G };
		let r = n ? t.data : t, i = new Set(/* @__PURE__ */ "debug.grid.infiniteScroll.siblings.autoScan.scan.watcher.status.viewer.rtHydrate.observability.feed.sidebar.probeBackend.i18n.paths.db.ratingTagsSync.cache.search.ai.executionGrouping.workflowMinimap.ui.security.safety".split(".")), a = {};
		if (r && typeof r == "object") for (let [e, t] of Object.entries(r)) i.has(e) && (a[e] = t);
		let o = ut(G, a);
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
		if (!w.set("mjrSettings", JSON.stringify(n))) throw Error("SettingsStore rejected the write");
	} catch (e) {
		console.warn("[Majoor] settings save failed", e);
		try {
			let e = Date.now();
			e - (Number(window?._mjrSettingsSaveFailAt || 0) || 0) > 3e4 && (window._mjrSettingsSaveFailAt = e, _t(n("dialog.settingsSaveFailed", "Majoor: Failed to save settings (browser storage full or blocked).")));
		} catch (e) {
			console.debug?.(e);
		}
		try {
			st("mjr-settings-save-failed", { error: String(e?.message || e || "") }, { warnPrefix: "[Majoor]" });
		} catch (e) {
			console.debug?.(e);
		}
	}
}, J = (e) => {
	let t = Number(A.MAX_PAGE_SIZE) || 2e3;
	j.DEFAULT_PAGE_SIZE = Math.max(50, Math.min(t, Number(e.grid?.pageSize) || A.DEFAULT_PAGE_SIZE)), j.AUTO_SCAN_ON_STARTUP = !!e.autoScan?.onStartup, j.EXECUTION_GROUPING_ENABLED = !!(e.executionGrouping?.enabled ?? A.EXECUTION_GROUPING_ENABLED), j.STATUS_POLL_INTERVAL = Math.max(1e3, Number(e.status?.pollInterval) || A.STATUS_POLL_INTERVAL), j.DEBUG_SAFE_CALL = !!e.debug?.safeCall, j.DEBUG_SAFE_LISTENERS = !!e.debug?.safeListeners, j.DEBUG_VIEWER = !!e.debug?.viewer, j.GRID_MIN_SIZE = mt(e.grid), j.FEED_GRID_MIN_SIZE = ht(e.feed), j.GRID_GAP = Math.max(0, Math.min(40, Math.round(U(e.grid?.gap, A.GRID_GAP)))), j.GRID_SHOW_BADGES_EXTENSION = !!(e.grid?.showExtBadge ?? A.GRID_SHOW_BADGES_EXTENSION), j.GRID_SHOW_BADGES_RATING = !!(e.grid?.showRatingBadge ?? A.GRID_SHOW_BADGES_RATING), j.GRID_SHOW_BADGES_TAGS = !!(e.grid?.showTagsBadge ?? A.GRID_SHOW_BADGES_TAGS), j.GRID_SHOW_DETAILS = !!(e.grid?.showDetails ?? A.GRID_SHOW_DETAILS), j.GRID_SHOW_DETAILS_FILENAME = !!(e.grid?.showFilename ?? A.GRID_SHOW_DETAILS_FILENAME), j.GRID_SHOW_DETAILS_DATE = !!(e.grid?.showDate ?? A.GRID_SHOW_DETAILS_DATE), j.GRID_SHOW_DETAILS_DIMENSIONS = !!(e.grid?.showDimensions ?? A.GRID_SHOW_DETAILS_DIMENSIONS), j.GRID_SHOW_DETAILS_GENTIME = !!(e.grid?.showGenTime ?? A.GRID_SHOW_DETAILS_GENTIME), j.GRID_SHOW_HOVER_INFO = !!(e.grid?.showHoverInfo ?? A.GRID_SHOW_HOVER_INFO), j.GRID_SHOW_WORKFLOW_DOT = !!(e.grid?.showWorkflowDot ?? A.GRID_SHOW_WORKFLOW_DOT), j.FEED_SHOW_INFO = !!(e.feed?.showInfo ?? A.FEED_SHOW_INFO), j.FEED_SHOW_FILENAME = !!(e.feed?.showFilename ?? A.FEED_SHOW_FILENAME), j.FEED_SHOW_DIMENSIONS = !!(e.feed?.showDimensions ?? A.FEED_SHOW_DIMENSIONS), j.FEED_SHOW_DATE = !!(e.feed?.showDate ?? A.FEED_SHOW_DATE), j.FEED_SHOW_GENTIME = !!(e.feed?.showGenTime ?? A.FEED_SHOW_GENTIME), j.FEED_SHOW_WORKFLOW_DOT = !!(e.feed?.showWorkflowDot ?? A.FEED_SHOW_WORKFLOW_DOT), j.FEED_SHOW_BADGES_EXTENSION = !!(e.feed?.showExtBadge ?? A.FEED_SHOW_BADGES_EXTENSION), j.FEED_SHOW_BADGES_RATING = !!(e.feed?.showRatingBadge ?? A.FEED_SHOW_BADGES_RATING), j.FEED_SHOW_BADGES_TAGS = !!(e.feed?.showTagsBadge ?? A.FEED_SHOW_BADGES_TAGS);
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
async function Ft() {
	try {
		let e = await t();
		if (!e?.ok) return;
		let n = e.data?.prefs;
		if (!n || typeof n != "object") return;
		let r = K();
		if (r.security = r.security || {}, r.security.safeMode = H(n.safe_mode, r.security.safeMode), r.security.allowWrite = H(n.allow_write, r.security.allowWrite), r.security.requireAuth = H(n.require_auth, r.security.requireAuth), r.security.allowRemoteWrite = H(n.allow_remote_write, r.security.allowRemoteWrite), r.security.allowInsecureTokenTransport = H(n.allow_insecure_token_transport, r.security.allowInsecureTokenTransport), r.security.allowDelete = H(n.allow_delete, r.security.allowDelete), r.security.allowRename = H(n.allow_rename, r.security.allowRename), r.security.allowOpenInFolder = H(n.allow_open_in_folder, r.security.allowOpenInFolder), r.security.allowResetIndex = H(n.allow_reset_index, r.security.allowResetIndex), r.security.tokenConfigured = H(n.token_configured, r.security.tokenConfigured), r.security.tokenHint = String(n.token_hint || "").trim(), !String(r.security.apiToken || "").trim()) try {
			let e = await x(), t = String(e?.data?.token || "").trim();
			e?.ok && t && (r.security.apiToken = t);
		} catch (e) {
			console.debug?.(e);
		}
		q(r), J(r), st("mjr-settings-changed", { key: "security" }, { warnPrefix: "[Majoor]" });
	} catch (e) {
		console.warn("[Majoor] failed to sync backend security settings", e);
	}
}
async function It() {
	try {
		let e = await S();
		if (!e?.ok) return;
		let t = e.data?.prefs;
		if (!t || typeof t != "object") return;
		let n = K();
		n.ai = n.ai || {}, n.ai.vectorSearchEnabled = H(t.enabled, n.ai.vectorSearchEnabled ?? !0), n.ai.vectorCaptionOnIndex = H(t.caption_on_index ?? t.captionOnIndex, n.ai.vectorCaptionOnIndex ?? !1), q(n), J(n), st("mjr-settings-changed", { key: "ai.vectorSearch" }, { warnPrefix: "[Majoor]" });
	} catch (e) {
		console.warn("[Majoor] failed to sync backend vector search settings", e);
	}
}
async function Lt() {
	try {
		let e = await m();
		if (!e?.ok) return;
		let t = e.data?.prefs;
		if (!t || typeof t != "object") return;
		let n = K();
		n.executionGrouping = n.executionGrouping || {}, n.executionGrouping.enabled = H(t.enabled, n.executionGrouping.enabled ?? A.EXECUTION_GROUPING_ENABLED), q(n), J(n), st("mjr-settings-changed", { key: "executionGrouping.enabled" }, { warnPrefix: "[Majoor]" });
	} catch (e) {
		console.warn("[Majoor] failed to sync backend execution grouping settings", e);
	}
}
//#endregion
//#region ui/app/settings/settingsRuntime.ts
var Rt = "mjr-runtime-status-dashboard", zt = "__mjr_write_token", Bt = 3e4;
function Vt() {
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
function Ht() {
	try {
		document.getElementById(Rt)?.remove?.();
	} catch (e) {
		console.debug?.(e);
	}
}
function Ut() {
	try {
		window.__MJR_RUNTIME_STATUS_HIDE_TIMEOUT__ && (clearTimeout(window.__MJR_RUNTIME_STATUS_HIDE_TIMEOUT__), window.__MJR_RUNTIME_STATUS_HIDE_TIMEOUT__ = null);
	} catch (e) {
		console.debug?.(e);
	}
}
function Wt() {
	try {
		return String(sessionStorage?.getItem?.(zt) || "").trim();
	} catch {
		return "";
	}
}
function Gt(e, t) {
	let n = t === "auth" ? "__mjrAuthLine" : "__mjrMetricsLine";
	if (e?.[n]) return e[n];
	let r = document.createElement("div");
	return r.style.whiteSpace = "nowrap", r.style.lineHeight = "1.35", t === "auth" && (r.style.marginTop = "4px", r.style.fontWeight = "600"), e.appendChild(r), e[n] = r, r;
}
function Kt(e) {
	let t = Wt(), r = String(e?.token_hint || "").trim() || (t ? `...${t.slice(-4)}` : ""), i = e?.allow_write !== !1, a = e?.require_auth === !0, o = e?.token_configured === !0;
	return i ? t ? {
		text: n("runtime.writeAuthActive", "Write auth: active {tokenHint}", { tokenHint: r || "(session)" }),
		color: "#7ee0a0"
	} : a && o ? {
		text: n("runtime.writeAuthMissing", "Write auth: missing in this browser {tokenHint}", { tokenHint: r || "(server token configured)" }),
		color: "#f1c36d"
	} : a ? {
		text: n("runtime.writeAuthRequired", "Write auth: required"),
		color: "#f1c36d"
	} : e && typeof e == "object" ? {
		text: n("runtime.writeAuthNotRequired", "Write auth: not required"),
		color: "#8fd0ff"
	} : {
		text: n("runtime.writeAuthUnknown", "Write auth: unknown"),
		color: "#c8ced8"
	} : {
		text: n("runtime.writeAuthBlocked", "Write auth: writes blocked by server"),
		color: "#ff9b9b"
	};
}
function qt() {
	try {
		if (Vt() === "hidden" || window.__MJR_RUNTIME_STATUS_HIDDEN__) return Ht(), null;
		let e = document.querySelector(".mjr-assets-manager.mjr-am-container"), t = document.getElementById(Rt);
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
		let n = document.getElementById(Rt);
		return n ? n.parentElement !== e && e.appendChild(n) : (n = document.createElement("div"), n.id = Rt, n.style.position = "absolute", n.style.bottom = "10px", n.style.right = "10px", n.style.zIndex = "9999", n.style.padding = "6px 10px", n.style.borderRadius = "10px", n.style.border = "1px solid rgba(255,255,255,0.16)", n.style.background = "rgba(0,0,0,0.45)", n.style.backdropFilter = "blur(4px)", n.style.color = "var(--content-fg, #fff)", n.style.fontSize = "11px", n.style.pointerEvents = "none", n.style.display = "flex", n.style.flexDirection = "column", e.appendChild(n)), n;
	} catch {
		return null;
	}
}
async function Jt() {
	let e = qt();
	if (!e) return !1;
	let r = Gt(e, "metrics"), i = Gt(e, "auth");
	try {
		let [a, o] = await Promise.all([be(), t()]), s = n("runtime.unavailable", "Runtime: unavailable");
		if (!a?.ok || !a?.data) r.textContent = s;
		else {
			let e = a.data.db || {}, t = a.data.index || {}, i = a.data.watcher || {}, o = Number(e.active_connections || 0), c = Number(t.enrichment_queue_length || 0), l = Number(i.pending_files || 0);
			r.textContent = n("runtime.metricsLine", "DB active: {active} | Enrich Q: {enrichQ} | Watcher pending: {pending}", {
				active: o,
				enrichQ: c,
				pending: l
			}), s = n("runtime.metricsTitle", "Runtime Metrics\nDB active connections: {active}\nEnrichment queue: {enrichQ}\nWatcher pending files: {pending}", {
				active: o,
				enrichQ: c,
				pending: l
			});
		}
		let c = Kt(o?.data?.prefs || null);
		return i.textContent = c.text, i.style.color = c.color, e.title = `${s}\n${c.text}`, !0;
	} catch {
		return r.textContent = n("runtime.unavailable", "Runtime: unavailable"), i.textContent = n("runtime.writeAuthUnknown", "Write auth: unknown"), i.style.color = "#c8ced8", e.title = `${n("runtime.unavailable", "Runtime: unavailable")}\n${i.textContent}`, !0;
	}
}
function Yt() {
	try {
		let e = Vt();
		if (e === "hidden") {
			window.__MJR_RUNTIME_STATUS_HIDDEN__ = !0, Ut(), Ht();
			return;
		}
		window.__MJR_RUNTIME_STATUS_SETTINGS_LISTENER__ || (window.__MJR_RUNTIME_STATUS_SETTINGS_LISTENER__ = (e) => {
			if (e?.detail?.key !== "observability.runtimeDashboardMode") return;
			let t = Vt();
			window.__MJR_RUNTIME_STATUS_HIDDEN__ = t === "hidden", Ut(), Ht(), t !== "hidden" && Yt();
		}, window.addEventListener?.("mjr-settings-changed", window.__MJR_RUNTIME_STATUS_SETTINGS_LISTENER__)), window.__MJR_RUNTIME_STATUS_HIDDEN__ = !1, Ut(), e === "autoHide30" && (window.__MJR_RUNTIME_STATUS_HIDE_TIMEOUT__ = setTimeout(() => {
			window.__MJR_RUNTIME_STATUS_HIDDEN__ = !0, Ht();
		}, Bt)), Jt().catch(() => {}), window.__MJR_RUNTIME_STATUS_INFLIGHT__ ?? (window.__MJR_RUNTIME_STATUS_INFLIGHT__ = !1), window.__MJR_RUNTIME_STATUS_MISS_COUNT__ ?? (window.__MJR_RUNTIME_STATUS_MISS_COUNT__ = 0), window.__MJR_RUNTIME_STATUS_INTERVAL__ || (window.__MJR_RUNTIME_STATUS_INTERVAL__ = setInterval(() => {
			window.__MJR_RUNTIME_STATUS_INFLIGHT__ || (window.__MJR_RUNTIME_STATUS_INFLIGHT__ = !0, Jt().then((e) => {
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
var Xt = 300;
function Zt(e, t = Xt) {
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
var Y = "Majoor", Qt = "Majoor Assets Manager";
function $t(e, t, r) {
	let i = (e, t) => [
		Qt,
		e,
		t
	], a = (e) => [
		Qt,
		n("cat.cards", "Cards"),
		e
	], o = (e) => [
		Qt,
		n("cat.badges", "Badges"),
		e
	], s = (e) => [
		Qt,
		n("cat.badges", "Badges"),
		e
	], c = (e, t) => {
		let n = String(e || "").trim();
		return /^[0-9a-fA-F]{6}$/.test(n) && (n = `#${n}`), /^#[0-9a-fA-F]{6}$/.test(n) ? n.toUpperCase() : t;
	};
	t.grid?.minSizePreset || (t.grid = t.grid || {}, t.grid.minSizePreset = gt(t.grid.minSize), q(t)), e({
		id: `${Y}.Cards.ThumbSize`,
		category: a(n("setting.grid.cardSize.group", "Card size")),
		name: n("setting.grid.cardSize.name", "Majoor: Card Size"),
		tooltip: n("setting.grid.cardSize.desc", "Choose the card size preset used by the grid layout."),
		type: "combo",
		defaultValue: (() => {
			let e = ct(String(t.grid?.minSizePreset || "").toLowerCase(), ft, gt(t.grid?.minSize)), r = {
				small: n("setting.grid.cardSize.small", "Small"),
				medium: n("setting.grid.cardSize.medium", "Medium"),
				large: n("setting.grid.cardSize.large", "Large")
			};
			return r[e] || r.medium;
		})(),
		options: [
			n("setting.grid.cardSize.small", "Small"),
			n("setting.grid.cardSize.medium", "Medium"),
			n("setting.grid.cardSize.large", "Large")
		],
		onChange: (e) => {
			let i = String(e || "").trim().toLowerCase(), a = n("setting.grid.cardSize.small", "Small").toLowerCase(), o = n("setting.grid.cardSize.medium", "Medium").toLowerCase(), s = n("setting.grid.cardSize.large", "Large").toLowerCase(), c = "medium";
			i === a || i === "small" || i === "petit" ? c = "small" : i === s || i === "large" || i === "grand" ? c = "large" : (i === o || i === "medium" || i === "moyen") && (c = "medium"), t.grid.minSizePreset = c, t.grid.minSize = dt[c], q(t), J(t), r("grid.minSizePreset");
		}
	}), e({
		id: `${Y}.Cards.CustomThumbSize`,
		category: a(n("setting.grid.cardSize.group", "Card size")),
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
			let n = Math.max(60, Math.min(600, Math.round(Number(e) || 120)));
			t.grid.minSize = n, t.grid.minSizePreset = gt(n), q(t), J(t), r("grid.minSize");
		}
	}), e({
		id: `${Y}.Grid.ShowDetails`,
		category: a("Show card details"),
		name: "Show metadata panel",
		tooltip: "Show the bottom details panel on asset cards (filename, date, etc.)",
		type: "boolean",
		defaultValue: !!t.grid?.showDetails,
		onChange: (e) => {
			t.grid.showDetails = !!e, q(t), J(t), r("grid.showDetails");
		}
	}), e({
		id: `${Y}.Grid.ShowFilename`,
		category: a("Show filename"),
		name: "Show filename",
		tooltip: "Display filename in details panel",
		type: "boolean",
		defaultValue: !!t.grid?.showFilename,
		onChange: (e) => {
			t.grid.showFilename = !!e, q(t), J(t), r("grid.showFilename");
		}
	}), e({
		id: `${Y}.Grid.ShowDate`,
		category: a("Show date/time"),
		name: "Show date/time",
		tooltip: "Display date and time in details panel",
		type: "boolean",
		defaultValue: !!t.grid?.showDate,
		onChange: (e) => {
			t.grid.showDate = !!e, q(t), J(t), r("grid.showDate");
		}
	}), e({
		id: `${Y}.Grid.ShowDimensions`,
		category: a("Show dimensions"),
		name: "Show dimensions",
		tooltip: "Display resolution (WxH) in details panel",
		type: "boolean",
		defaultValue: !!t.grid?.showDimensions,
		onChange: (e) => {
			t.grid.showDimensions = !!e, q(t), J(t), r("grid.showDimensions");
		}
	}), e({
		id: `${Y}.Grid.ShowGenTime`,
		category: a("Show generation time"),
		name: "Show generation time",
		tooltip: "Display seconds taken to generate the asset (if available)",
		type: "boolean",
		defaultValue: !!(t.grid?.showGenTime ?? A.GRID_SHOW_DETAILS_GENTIME),
		onChange: (e) => {
			t.grid.showGenTime = !!e, q(t), J(t), r("grid.showGenTime");
		}
	}), e({
		id: `${Y}.Grid.ShowHoverInfo`,
		category: a("Show prompt on hover"),
		name: "Show prompt on hover",
		tooltip: "Show positive prompt and generation time as a tooltip overlay when hovering over a card thumbnail. Does not block video play-on-hover.",
		type: "boolean",
		defaultValue: !!(t.grid?.showHoverInfo ?? A.GRID_SHOW_HOVER_INFO),
		onChange: (e) => {
			t.grid.showHoverInfo = !!e, q(t), J(t), r("grid.showHoverInfo");
		}
	}), e({
		id: `${Y}.Grid.ShowWorkflowDot`,
		category: a("Show workflow dot"),
		name: "Show workflow indicator",
		tooltip: "Display the green dot indicating workflow metadata availability (bottom right of card)",
		type: "boolean",
		defaultValue: !!t.grid?.showWorkflowDot,
		onChange: (e) => {
			t.grid.showWorkflowDot = !!e, q(t), J(t), r("grid.showWorkflowDot");
		}
	}), e({
		id: `${Y}.Grid.ShowExtBadge`,
		category: o("Show format badges"),
		name: "Show format badges",
		tooltip: "Display format badges (e.g. JPG, MP4) on thumbnails",
		type: "boolean",
		defaultValue: !!t.grid?.showExtBadge,
		onChange: (e) => {
			t.grid.showExtBadge = !!e, q(t), J(t), r("grid.showExtBadge");
		}
	}), e({
		id: `${Y}.Grid.ShowRatingBadge`,
		category: o("Show rating badges"),
		name: "Show ratings",
		tooltip: "Display star ratings on thumbnails",
		type: "boolean",
		defaultValue: !!t.grid?.showRatingBadge,
		onChange: (e) => {
			t.grid.showRatingBadge = !!e, q(t), J(t), r("grid.showRatingBadge");
		}
	}), e({
		id: `${Y}.Grid.ShowTagsBadge`,
		category: o("Show tags badges"),
		name: "Show tags",
		tooltip: "Display a small indicator if an asset has tags",
		type: "boolean",
		defaultValue: !!t.grid?.showTagsBadge,
		onChange: (e) => {
			t.grid.showTagsBadge = !!e, q(t), J(t), r("grid.showTagsBadge");
		}
	}), e({
		id: `${Y}.Badges.StarColor`,
		category: s(n("setting.starColor", "Star color")),
		name: n("setting.starColor", "Majoor: Star color"),
		tooltip: n("setting.starColor.tooltip", "Color of rating stars on thumbnails (hex, e.g. #FFD45A)"),
		type: "color",
		defaultValue: c(t.grid?.starColor, A.BADGE_STAR_COLOR),
		onChange: (e) => {
			t.grid.starColor = c(e, A.BADGE_STAR_COLOR), q(t), J(t), r("grid.starColor");
		}
	}), e({
		id: `${Y}.Badges.ImageColor`,
		category: s(n("setting.badgeImageColor", "Image badge color")),
		name: n("setting.badgeImageColor", "Majoor: Image badge color"),
		tooltip: n("setting.badgeImageColor.tooltip", "Color for image badges: PNG, JPG, WEBP, GIF, BMP, TIF (hex)"),
		type: "color",
		defaultValue: c(t.grid?.badgeImageColor, A.BADGE_IMAGE_COLOR),
		onChange: (e) => {
			t.grid.badgeImageColor = c(e, A.BADGE_IMAGE_COLOR), q(t), J(t), r("grid.badgeImageColor");
		}
	}), e({
		id: `${Y}.Badges.VideoColor`,
		category: s(n("setting.badgeVideoColor", "Video badge color")),
		name: n("setting.badgeVideoColor", "Majoor: Video badge color"),
		tooltip: n("setting.badgeVideoColor.tooltip", "Color for video badges: MP4, WEBM, MOV, AVI, MKV (hex)"),
		type: "color",
		defaultValue: c(t.grid?.badgeVideoColor, A.BADGE_VIDEO_COLOR),
		onChange: (e) => {
			t.grid.badgeVideoColor = c(e, A.BADGE_VIDEO_COLOR), q(t), J(t), r("grid.badgeVideoColor");
		}
	}), e({
		id: `${Y}.Badges.AudioColor`,
		category: s(n("setting.badgeAudioColor", "Audio badge color")),
		name: n("setting.badgeAudioColor", "Majoor: Audio badge color"),
		tooltip: n("setting.badgeAudioColor.tooltip", "Color for audio badges: MP3, WAV, OGG, FLAC (hex)"),
		type: "color",
		defaultValue: c(t.grid?.badgeAudioColor, A.BADGE_AUDIO_COLOR),
		onChange: (e) => {
			t.grid.badgeAudioColor = c(e, A.BADGE_AUDIO_COLOR), q(t), J(t), r("grid.badgeAudioColor");
		}
	}), e({
		id: `${Y}.Badges.Model3dColor`,
		category: s(n("setting.badgeModel3dColor", "3D model badge color")),
		name: n("setting.badgeModel3dColor", "Majoor: 3D model badge color"),
		tooltip: n("setting.badgeModel3dColor.tooltip", "Color for 3D model badges: OBJ, FBX, GLB, GLTF (hex)"),
		type: "color",
		defaultValue: c(t.grid?.badgeModel3dColor, A.BADGE_MODEL3D_COLOR),
		onChange: (e) => {
			t.grid.badgeModel3dColor = c(e, A.BADGE_MODEL3D_COLOR), q(t), J(t), r("grid.badgeModel3dColor");
		}
	}), e({
		id: `${Y}.Badges.DuplicateAlertColor`,
		category: s(n("setting.badgeDuplicateAlertColor", "Duplicate alert badge color")),
		name: n("setting.badgeDuplicateAlertColor", "Majoor: Duplicate alert badge color"),
		tooltip: n("setting.badgeDuplicateAlertColor.tooltip", "Color for duplicate extension badges (PNG+, JPG+, etc)."),
		type: "color",
		defaultValue: c(t.grid?.badgeDuplicateAlertColor, A.BADGE_DUPLICATE_ALERT_COLOR),
		onChange: (e) => {
			t.grid.badgeDuplicateAlertColor = c(e, A.BADGE_DUPLICATE_ALERT_COLOR), q(t), J(t), r("grid.badgeDuplicateAlertColor");
		}
	}), e({
		id: `${Y}.Grid.PageSize`,
		category: i(n("cat.grid"), n("setting.grid.pagesize.name").replace("Majoor: ", "")),
		name: n("setting.grid.pagesize.name"),
		tooltip: n("setting.grid.pagesize.desc"),
		type: "number",
		defaultValue: t.grid.pageSize,
		attrs: {
			min: 50,
			max: Number(j.MAX_PAGE_SIZE) || 2e3,
			step: 50
		},
		onChange: (e) => {
			let n = Number(j.MAX_PAGE_SIZE) || 2e3;
			t.grid.pageSize = Math.max(50, Math.min(n, Number(e) || A.DEFAULT_PAGE_SIZE)), q(t), J(t), r("grid.pageSize");
		}
	}), e({
		id: `${Y}.InfiniteScroll.Enabled`,
		category: i(n("cat.grid"), n("setting.nav.infinite.name").replace("Majoor: ", "")),
		name: n("setting.nav.infinite.name"),
		tooltip: n("setting.nav.infinite.desc"),
		type: "boolean",
		defaultValue: !!t.infiniteScroll?.enabled,
		onChange: (e) => {
			t.infiniteScroll = t.infiniteScroll || {}, t.infiniteScroll.enabled = !!e, q(t), J(t), r("infiniteScroll.enabled");
		}
	}), e({
		id: `${Y}.Sidebar.Position`,
		category: i(n("cat.grid"), n("setting.sidebar.pos.name").replace("Majoor: ", "")),
		name: n("setting.sidebar.pos.name"),
		tooltip: n("setting.sidebar.pos.desc"),
		type: "combo",
		defaultValue: t.sidebar?.position || "right",
		options: ["left", "right"],
		onChange: (e) => {
			t.sidebar = t.sidebar || {}, t.sidebar.position = e === "left" ? "left" : "right", q(t), r("sidebar.position");
		}
	}), e({
		id: `${Y}.Sidebar.ShowPreviewThumb`,
		category: i(n("cat.grid"), "Sidebar preview"),
		name: "Show sidebar preview thumb",
		tooltip: "Show/hide the large media preview at the top of the sidebar metadata panel.",
		type: "boolean",
		defaultValue: !!(t.sidebar?.showPreviewThumb ?? !0),
		onChange: (e) => {
			t.sidebar = t.sidebar || {}, t.sidebar.showPreviewThumb = !!e, q(t), r("sidebar.showPreviewThumb");
		}
	}), e({
		id: `${Y}.Sidebar.WidthPx`,
		category: i(n("cat.grid"), "Sidebar width"),
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
			t.sidebar = t.sidebar || {}, t.sidebar.widthPx = Math.max(240, Math.min(640, Math.round(Number(e) || 360))), q(t), r("sidebar.widthPx");
		}
	}), e({
		id: `${Y}.General.HideSiblings`,
		category: i(n("cat.grid"), n("setting.siblings.hide.name").replace("Majoor: ", "")),
		name: n("setting.siblings.hide.name"),
		tooltip: n("setting.siblings.hide.desc"),
		type: "boolean",
		defaultValue: !!t.siblings?.hidePngSiblings,
		onChange: (e) => {
			t.siblings = t.siblings || {}, t.siblings.hidePngSiblings = !!e, q(t), r("siblings.hidePngSiblings");
		}
	}), e({
		id: `${Y}.Grid.VideoAutoplayMode`,
		category: i(n("cat.grid"), n("setting.grid.videoAutoplayMode.name", "Video autoplay").replace("Majoor: ", "")),
		name: n("setting.grid.videoAutoplayMode.name", "Majoor: Video autoplay"),
		tooltip: n("setting.grid.videoAutoplayMode.desc", "Controls video thumbnail playback in the grid. Off: static frame. Hover: play on mouse hover. Always: loop while visible."),
		type: "combo",
		defaultValue: (() => {
			let e = t.grid?.videoAutoplayMode;
			e ??= t.grid?.videoHoverAutoplay === !1 ? "off" : "hover", e === !0 && (e = "hover"), e === !1 && (e = "off"), e !== "hover" && e !== "always" && e !== "off" && (e = "hover");
			let r = {
				off: n("setting.grid.videoAutoplayMode.off", "Off"),
				hover: n("setting.grid.videoAutoplayMode.hover", "Hover"),
				always: n("setting.grid.videoAutoplayMode.always", "Always")
			};
			return r[e] || r.off;
		})(),
		options: [
			n("setting.grid.videoAutoplayMode.off", "Off"),
			n("setting.grid.videoAutoplayMode.hover", "Hover"),
			n("setting.grid.videoAutoplayMode.always", "Always")
		],
		onChange: (e) => {
			let i = {
				[n("setting.grid.videoAutoplayMode.off", "Off")]: "off",
				[n("setting.grid.videoAutoplayMode.hover", "Hover")]: "hover",
				[n("setting.grid.videoAutoplayMode.always", "Always")]: "always"
			}[e] || "off";
			t.grid = t.grid || {}, t.grid.videoAutoplayMode = i, delete t.grid.videoHoverAutoplay, q(t), J(t), r("grid.videoAutoplayMode");
		}
	}), e({
		id: `${Y}.Cards.HoverColor`,
		category: a("Hover color"),
		name: "Majoor: Card hover color",
		tooltip: "Background tint used when hovering a card (hex, e.g. #3D3D3D).",
		type: "color",
		defaultValue: c(t.ui?.cardHoverColor, A.UI_CARD_HOVER_COLOR),
		onChange: (e) => {
			t.ui = t.ui || {}, t.ui.cardHoverColor = c(e, A.UI_CARD_HOVER_COLOR), q(t), J(t), r("ui.cardHoverColor");
		}
	}), e({
		id: `${Y}.Cards.SelectionColor`,
		category: a("Selection color"),
		name: "Majoor: Card selection color",
		tooltip: "Outline/accent color used for selected cards (hex, e.g. #4A90E2).",
		type: "color",
		defaultValue: c(t.ui?.cardSelectionColor, A.UI_CARD_SELECTION_COLOR),
		onChange: (e) => {
			t.ui = t.ui || {}, t.ui.cardSelectionColor = c(e, A.UI_CARD_SELECTION_COLOR), q(t), J(t), r("ui.cardSelectionColor");
		}
	}), e({
		id: `${Y}.Badges.RatingColor`,
		category: o("Rating color"),
		name: "Majoor: Rating badge color",
		tooltip: "Color used for rating badge text/accent (hex, e.g. #FF9500).",
		type: "color",
		defaultValue: c(t.ui?.ratingColor, A.UI_RATING_COLOR),
		onChange: (e) => {
			t.ui = t.ui || {}, t.ui.ratingColor = c(e, A.UI_RATING_COLOR), q(t), J(t), r("ui.ratingColor");
		}
	}), e({
		id: `${Y}.Badges.TagColor`,
		category: o("Tag color"),
		name: "Majoor: Tags badge color",
		tooltip: "Color used for tags badge text/accent (hex, e.g. #4A90E2).",
		type: "color",
		defaultValue: c(t.ui?.tagColor, A.UI_TAG_COLOR),
		onChange: (e) => {
			t.ui = t.ui || {}, t.ui.tagColor = c(e, A.UI_TAG_COLOR), q(t), J(t), r("ui.tagColor");
		}
	});
}
//#endregion
//#region ui/app/settings/settingsViewer.ts
var en = "Majoor", tn = "Majoor Assets Manager";
function nn(e, t, i) {
	let o = (e, t) => [
		tn,
		e,
		t
	], s = (e) => o(n("cat.viewer", "Viewer"), e), c = (e) => o(n("cat.floatingViewer", "Floating Viewer"), e);
	e({
		id: `${en}.Viewer.AllowPanAtZoom1`,
		category: s(n("setting.viewer.pan.name").replace("Majoor: ", "")),
		name: n("setting.viewer.pan.name"),
		tooltip: n("setting.viewer.pan.desc"),
		type: "boolean",
		defaultValue: !!t.viewer?.allowPanAtZoom1,
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.allowPanAtZoom1 = !!e, q(t), J(t), i("viewer.allowPanAtZoom1");
		}
	}), e({
		id: `${en}.Viewer.DisableWebGL`,
		category: s("Disable WebGL Video"),
		name: "Disable WebGL Video",
		tooltip: "Use CPU rendering (Canvas 2D) for video playback. Fixes 'black screen' issues on incompatible hardware/browsers.",
		type: "boolean",
		defaultValue: !!t.viewer?.disableWebGL,
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.disableWebGL = !!e, q(t), J(t), i("viewer.disableWebGL");
		}
	}), e({
		id: `${en}.Viewer.PauseDuringExecution`,
		category: s(n("setting.viewer.pauseExecution.name").replace("Majoor: ", "")),
		name: n("setting.viewer.pauseExecution.name"),
		tooltip: n("setting.viewer.pauseExecution.desc"),
		type: "boolean",
		defaultValue: !!t.viewer?.pauseDuringExecution,
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.pauseDuringExecution = !!e, q(t), J(t), i("viewer.pauseDuringExecution");
		}
	}), e({
		id: `${en}.Viewer.FloatingPauseDuringExecution`,
		category: c(n("setting.viewer.floatingPauseExecution.name").replace("Majoor: ", "")),
		name: n("setting.viewer.floatingPauseExecution.name"),
		tooltip: n("setting.viewer.floatingPauseExecution.desc"),
		type: "boolean",
		defaultValue: !!t.viewer?.floatingPauseDuringExecution,
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.floatingPauseDuringExecution = !!e, q(t), J(t), i("viewer.floatingPauseDuringExecution");
		}
	}), e({
		id: `${en}.Viewer.MfvLiveDefault`,
		category: c(n("setting.viewer.mfvLiveDefault.name").replace("Majoor: ", "")),
		name: n("setting.viewer.mfvLiveDefault.name"),
		tooltip: n("setting.viewer.mfvLiveDefault.desc"),
		type: "boolean",
		defaultValue: !!(t.viewer?.mfvLiveDefault ?? A.MFV_LIVE_DEFAULT),
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.mfvLiveDefault = !!e, q(t), J(t), i("viewer.mfvLiveDefault");
		}
	}), e({
		id: `${en}.Viewer.MfvPreviewDefault`,
		category: c(n("setting.viewer.mfvPreviewDefault.name").replace("Majoor: ", "")),
		name: n("setting.viewer.mfvPreviewDefault.name"),
		tooltip: n("setting.viewer.mfvPreviewDefault.desc"),
		type: "boolean",
		defaultValue: !!(t.viewer?.mfvPreviewDefault ?? A.MFV_PREVIEW_DEFAULT),
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.mfvPreviewDefault = !!e, q(t), J(t), i("viewer.mfvPreviewDefault");
		}
	}), e({
		id: `${en}.Viewer.MfvSidebarPosition`,
		category: c("Node Parameters sidebar position"),
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
			let n = [
				"left",
				"right",
				"bottom"
			].includes(e) ? e : "right";
			t.viewer = t.viewer || {}, t.viewer.mfvSidebarPosition = n, q(t), J(t), i("viewer.mfvSidebarPosition");
		}
	}), e({
		id: `${en}.Viewer.MfvPreviewMethod`,
		category: c(n("setting.viewer.mfvPreviewMethod.name").replace("Majoor: ", "")),
		name: n("setting.viewer.mfvPreviewMethod.name"),
		tooltip: n("setting.viewer.mfvPreviewMethod.desc"),
		type: "combo",
		defaultValue: t.viewer?.mfvPreviewMethod || A.MFV_PREVIEW_METHOD,
		options: [
			"taesd",
			"latent2rgb",
			"auto",
			"default",
			"none"
		],
		onChange: (e) => {
			let n = [
				"taesd",
				"latent2rgb",
				"auto",
				"default",
				"none"
			].includes(e) ? e : A.MFV_PREVIEW_METHOD;
			t.viewer = t.viewer || {}, t.viewer.mfvPreviewMethod = n, q(t), J(t), i("viewer.mfvPreviewMethod");
		}
	}), e({
		id: `${en}.Viewer.LtxavRgbFallback`,
		category: c("LTXAV preview fallback"),
		name: "Majoor: LTXAV RGB Preview Fallback (experimental)",
		tooltip: "Reuse LTXV RGB projection for LTXAV when native latent preview is unavailable. Experimental; quality may be approximate.",
		type: "boolean",
		defaultValue: !!t.viewer?.ltxavRgbFallback,
		onChange: async (e) => {
			let n = !!e, a = !!t.viewer?.ltxavRgbFallback;
			t.viewer = t.viewer || {}, t.viewer.ltxavRgbFallback = n, q(t), J(t), i("viewer.ltxavRgbFallback");
			try {
				let e = await de(n);
				if (!e?.ok) throw Error(e?.error || "Failed to update LTXAV RGB preview fallback setting");
			} catch (e) {
				t.viewer.ltxavRgbFallback = a, q(t), J(t), i("viewer.ltxavRgbFallback"), r(e?.message || "Failed to update LTXAV RGB preview fallback setting", "error");
			}
		}
	});
	try {
		a().then((e) => {
			if (!e?.ok) return;
			let n = !!e?.data?.prefs?.enabled, r = K();
			r.viewer = r.viewer || {}, !!r.viewer.ltxavRgbFallback !== n && (r.viewer.ltxavRgbFallback = n, Object.assign(t, r), q(r), J(r), i("viewer.ltxavRgbFallback"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	((r, a, o, c) => {
		e({
			id: `${en}.WorkflowMinimap.${r}`,
			category: s(n(o).replace("Majoor: ", "")),
			name: n(o),
			tooltip: n(c),
			type: "boolean",
			defaultValue: !!t.workflowMinimap?.[a],
			onChange: (e) => {
				t.workflowMinimap = t.workflowMinimap || {}, t.workflowMinimap[a] = !!e, q(t), i(`workflowMinimap.${a}`);
			}
		});
	})("Enabled", "enabled", "setting.minimap.enabled.name", "setting.minimap.enabled.desc");
}
//#endregion
//#region ui/app/settings/settingsScanning.ts
var rn = "Majoor", an = "Majoor Assets Manager";
function on(e, t, i) {
	let a = (e, t) => [
		an,
		e,
		t
	];
	e({
		id: `${rn}.ExecutionGrouping.Enabled`,
		category: a(n("cat.scanning"), "Execution grouping"),
		name: "Execution job/stack grouping",
		tooltip: "Enable or disable all live job_id / stack_id tracking, grouping, and stack finalization logic.",
		type: "boolean",
		defaultValue: !!(t.executionGrouping?.enabled ?? A.EXECUTION_GROUPING_ENABLED),
		onChange: async (e) => {
			let n = !!(t.executionGrouping?.enabled ?? A.EXECUTION_GROUPING_ENABLED), a = !!e;
			t.executionGrouping = t.executionGrouping || {}, t.executionGrouping.enabled = a, q(t), J(t), i("executionGrouping.enabled");
			try {
				let e = await me(a);
				if (!e?.ok) throw Error(e?.error || "Failed to update execution grouping setting");
				t.executionGrouping.enabled = !!e?.data?.prefs?.enabled, q(t), J(t), i("executionGrouping.enabled");
			} catch (e) {
				t.executionGrouping.enabled = n, q(t), J(t), i("executionGrouping.enabled"), r(e?.message || "Failed to update execution grouping setting", "error");
			}
		}
	}), e({
		id: `${rn}.AutoScan.OnStartup`,
		category: a(n("cat.scanning"), n("setting.scan.startup.name").replace("Majoor: ", "")),
		name: n("setting.scan.startup.name"),
		tooltip: n("setting.scan.startup.desc"),
		type: "boolean",
		defaultValue: !!t.autoScan?.onStartup,
		onChange: (e) => {
			t.autoScan = t.autoScan || {}, t.autoScan.onStartup = !!e, q(t), J(t), i("autoScan.onStartup");
		}
	}), e({
		id: `${rn}.Scan.FastMode`,
		category: a(n("cat.scanning"), "Scan mode"),
		name: "Fast scan mode",
		tooltip: "Use fast scan mode for manual backfill scans (skip heavier metadata work during scan).",
		type: "boolean",
		defaultValue: !!(t.scan?.fastMode ?? !0),
		onChange: (e) => {
			t.scan = t.scan || {}, t.scan.fastMode = !!e, q(t), i("scan.fastMode");
		}
	}), e({
		id: `${rn}.RtHydrate.Concurrency`,
		category: a(n("cat.scanning"), "Hydration"),
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
			t.rtHydrate = t.rtHydrate || {}, t.rtHydrate.concurrency = Math.max(1, Math.min(20, Math.round(U(e, A.RT_HYDRATE_CONCURRENCY || 5)))), q(t), J(t), i("rtHydrate.concurrency");
		}
	});
	let o = (e, t, n, r) => {
		let i = Math.round(U(e, t));
		return Math.max(n, Math.min(r, i));
	}, s = (e = {}) => {
		let n = [];
		if (t.watcher = t.watcher || {}, typeof e.debounce_ms == "number") {
			let r = Math.max(50, Math.min(5e3, Math.round(e.debounce_ms)));
			t.watcher.debounceMs !== r && (t.watcher.debounceMs = r, n.push("watcher.debounceMs"));
		}
		if (typeof e.dedupe_ttl_ms == "number") {
			let r = Math.max(100, Math.min(3e4, Math.round(e.dedupe_ttl_ms)));
			t.watcher.dedupeTtlMs !== r && (t.watcher.dedupeTtlMs = r, n.push("watcher.dedupeTtlMs"));
		}
		n.length && (q(t), n.forEach((e) => i(e)));
	}, c = async () => {
		try {
			let e = await T();
			if (!e?.ok) return;
			s(e.data || {});
		} catch (e) {
			console.debug?.(e);
		}
	};
	e({
		id: `${rn}.Watcher.Enabled`,
		category: a(n("cat.scanning"), n("setting.watcher.enabled.label", "Enable watcher")),
		name: n("setting.watcher.name"),
		tooltip: n("setting.watcher.desc") + " (env: MJR_ENABLE_WATCHER)",
		type: "boolean",
		defaultValue: !!t.watcher?.enabled,
		onChange: async (e) => {
			t.watcher = t.watcher || {}, t.watcher.enabled = !!e, q(t), i("watcher.enabled");
			try {
				let a = await se(!!e);
				a?.ok || (t.watcher.enabled = !e, q(t), i("watcher.enabled"), r(a?.error || n("toast.failedToggleWatcher", "Failed to toggle watcher"), "error"));
			} catch {
				t.watcher.enabled = !e, q(t), i("watcher.enabled");
			}
		}
	}), e({
		id: `${rn}.Watcher.DebounceDelay`,
		category: a(n("cat.scanning"), n("setting.watcher.debounce.label", "Watcher debounce delay")),
		name: n("setting.watcher.debounce.name"),
		tooltip: n("setting.watcher.debounce.desc") + " (env: MJR_WATCHER_DEBOUNCE_MS)",
		type: "number",
		defaultValue: t.watcher?.debounceMs ?? A.WATCHER_DEBOUNCE_MS,
		attrs: {
			min: 50,
			max: 6e4,
			step: 50
		},
		onChange: async (e) => {
			let a = A.WATCHER_DEBOUNCE_MS, s = o(e, a, 50, 6e4), c = t.watcher?.debounceMs ?? a;
			if (s !== c) {
				t.watcher = t.watcher || {}, t.watcher.debounceMs = s, q(t);
				try {
					let e = await D({ debounce_ms: s });
					if (!e?.ok) throw Error(e?.error || n("setting.watcher.debounce.error"));
					let r = Math.round(Number(e?.data?.debounce_ms ?? s));
					t.watcher.debounceMs = r, q(t), i("watcher.debounceMs");
				} catch (e) {
					t.watcher.debounceMs = c, q(t), i("watcher.debounceMs"), r(e?.message || n("setting.watcher.debounce.error"), "error");
				}
			}
		}
	}), e({
		id: `${rn}.Watcher.DedupeWindow`,
		category: a(n("cat.scanning"), n("setting.watcher.dedupe.label", "Watcher dedupe window")),
		name: n("setting.watcher.dedupe.name"),
		tooltip: n("setting.watcher.dedupe.desc") + " (env: MJR_WATCHER_DEDUPE_TTL_MS)",
		type: "number",
		defaultValue: t.watcher?.dedupeTtlMs ?? A.WATCHER_DEDUPE_TTL_MS,
		attrs: {
			min: 100,
			max: 12e4,
			step: 100
		},
		onChange: async (e) => {
			let a = A.WATCHER_DEDUPE_TTL_MS, s = o(e, a, 100, 12e4), c = t.watcher?.dedupeTtlMs ?? a;
			if (s !== c) {
				t.watcher = t.watcher || {}, t.watcher.dedupeTtlMs = s, q(t);
				try {
					let e = await D({ dedupe_ttl_ms: s });
					if (!e?.ok) throw Error(e?.error || n("setting.watcher.dedupe.error"));
					let r = Math.round(Number(e?.data?.dedupe_ttl_ms ?? s));
					t.watcher.dedupeTtlMs = r, q(t), i("watcher.dedupeTtlMs");
				} catch (e) {
					t.watcher.dedupeTtlMs = c, q(t), i("watcher.dedupeTtlMs"), r(e?.message || n("setting.watcher.dedupe.error"), "error");
				}
			}
		}
	}), e({
		id: `${rn}.Watcher.MaxPending`,
		category: a(n("cat.scanning"), "Watcher queue"),
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
			t.watcher = t.watcher || {}, t.watcher.maxPending = Math.max(10, Math.min(5e3, Math.round(U(e, 500)))), q(t), J(t), i("watcher.maxPending");
		}
	}), e({
		id: `${rn}.Watcher.MinSize`,
		category: a(n("cat.scanning"), "Watcher file size"),
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
			t.watcher = t.watcher || {}, t.watcher.minSize = Math.max(0, Math.min(1e6, Math.round(U(e, 100)))), q(t), J(t), i("watcher.minSize");
		}
	}), e({
		id: `${rn}.Watcher.MaxSize`,
		category: a(n("cat.scanning"), "Watcher file size"),
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
			t.watcher = t.watcher || {}, t.watcher.maxSize = Math.max(1e5, Math.min(17179869184, Math.round(U(e, 4294967296)))), q(t), J(t), i("watcher.maxSize");
		}
	});
	try {
		c().catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	e({
		id: `${rn}.RatingTagsSync.Enabled`,
		category: a(n("cat.scanning"), n("setting.sync.rating.name").replace("Majoor: ", "")),
		name: n("setting.sync.rating.name"),
		tooltip: n("setting.sync.rating.desc"),
		type: "boolean",
		defaultValue: !!t.ratingTagsSync?.enabled,
		onChange: (e) => {
			t.ratingTagsSync = t.ratingTagsSync || {}, t.ratingTagsSync.enabled = !!e, q(t), i("ratingTagsSync.enabled");
		}
	});
}
//#endregion
//#region ui/app/settings/settingsFeed.ts
var sn = "Majoor", cn = "Majoor Assets Manager";
function ln(e, t, r) {
	let i = (e) => [
		cn,
		n("cat.feed", "Generated Feed"),
		e
	], a = () => {
		t.feed = t.feed || {};
	};
	e({
		id: `${sn}.Feed.CardSize`,
		category: i("Card size"),
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
			a(), t.feed.minSize = Math.max(60, Math.min(600, Math.round(Number(e) || 120))), q(t), J(t), r("feed.minSize");
		}
	}), e({
		id: `${sn}.Feed.ShowInfo`,
		category: i("Show info section"),
		name: "Show card info section",
		tooltip: "Show or hide the entire info section (filename, metadata, dots) below thumbnails in the Generated Feed.",
		type: "boolean",
		defaultValue: !!(t.feed?.showInfo ?? A.FEED_SHOW_INFO),
		onChange: (e) => {
			a(), t.feed.showInfo = !!e, q(t), J(t), r("feed.showInfo");
		}
	}), e({
		id: `${sn}.Feed.ShowFilename`,
		category: i("Show filename"),
		name: "Show filename",
		tooltip: "Display the filename on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showFilename ?? A.FEED_SHOW_FILENAME),
		onChange: (e) => {
			a(), t.feed.showFilename = !!e, q(t), J(t), r("feed.showFilename");
		}
	}), e({
		id: `${sn}.Feed.ShowDimensions`,
		category: i("Show dimensions"),
		name: "Show dimensions",
		tooltip: "Display resolution (WxH) and duration on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showDimensions ?? A.FEED_SHOW_DIMENSIONS),
		onChange: (e) => {
			a(), t.feed.showDimensions = !!e, q(t), J(t), r("feed.showDimensions");
		}
	}), e({
		id: `${sn}.Feed.ShowDate`,
		category: i("Show date/time"),
		name: "Show date/time",
		tooltip: "Display date and time on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showDate ?? A.FEED_SHOW_DATE),
		onChange: (e) => {
			a(), t.feed.showDate = !!e, q(t), J(t), r("feed.showDate");
		}
	}), e({
		id: `${sn}.Feed.ShowGenTime`,
		category: i("Show generation time"),
		name: "Show generation time",
		tooltip: "Display the generation time badge on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showGenTime ?? A.FEED_SHOW_GENTIME),
		onChange: (e) => {
			a(), t.feed.showGenTime = !!e, q(t), J(t), r("feed.showGenTime");
		}
	}), e({
		id: `${sn}.Feed.ShowWorkflowDot`,
		category: i("Show workflow dot"),
		name: "Show workflow indicator",
		tooltip: "Display the workflow availability dot on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showWorkflowDot ?? A.FEED_SHOW_WORKFLOW_DOT),
		onChange: (e) => {
			a(), t.feed.showWorkflowDot = !!e, q(t), J(t), r("feed.showWorkflowDot");
		}
	}), e({
		id: `${sn}.Feed.ShowExtBadge`,
		category: i("Show format badges"),
		name: "Show format badges",
		tooltip: "Display format badges (e.g. JPG, MP4) on feed card thumbnails.",
		type: "boolean",
		defaultValue: !!(t.feed?.showExtBadge ?? A.FEED_SHOW_BADGES_EXTENSION),
		onChange: (e) => {
			a(), t.feed.showExtBadge = !!e, q(t), J(t), r("feed.showExtBadge");
		}
	}), e({
		id: `${sn}.Feed.ShowRatingBadge`,
		category: i("Show rating badges"),
		name: "Show ratings",
		tooltip: "Display star ratings on feed card thumbnails.",
		type: "boolean",
		defaultValue: !!(t.feed?.showRatingBadge ?? A.FEED_SHOW_BADGES_RATING),
		onChange: (e) => {
			a(), t.feed.showRatingBadge = !!e, q(t), J(t), r("feed.showRatingBadge");
		}
	}), e({
		id: `${sn}.Feed.ShowTagsBadge`,
		category: i("Show tags badges"),
		name: "Show tags",
		tooltip: "Display tag indicators on feed card thumbnails.",
		type: "boolean",
		defaultValue: !!(t.feed?.showTagsBadge ?? A.FEED_SHOW_BADGES_TAGS),
		onChange: (e) => {
			a(), t.feed.showTagsBadge = !!e, q(t), J(t), r("feed.showTagsBadge");
		}
	});
}
//#endregion
//#region ui/app/settings/settingsSecurity.ts
var un = "Majoor", dn = "Majoor Assets Manager", fn = 16, pn = {
	safeMode: !1,
	allowWrite: !0,
	allowDelete: !0,
	allowRename: !0,
	allowOpenInFolder: !0,
	allowResetIndex: !0
};
function mn(e) {
	return !!e;
}
function hn(e, t) {
	return mn(e) === mn(t);
}
function gn(e) {
	return typeof e == "string" ? e.trim() : "";
}
function _n(e) {
	let t = String(e || "").trim().toLowerCase();
	return t === "localhost" || t === "127.0.0.1" || t === "::1";
}
function vn() {
	return globalThis.location || globalThis.window?.location || null;
}
function yn() {
	let e = vn();
	if (!e) return !1;
	let t = String(e.protocol || "").toLowerCase(), n = String(e.hostname || "").trim();
	return t === "http:" && !_n(n);
}
function bn(e) {
	let t = globalThis.crypto;
	if (!t?.getRandomValues) throw Error("Secure token generation requires crypto.getRandomValues().");
	return t.getRandomValues(e);
}
function xn(e) {
	let t = Math.max(4, Number(e) || 0), n = new Uint8Array(t);
	return bn(n), Array.from(n, (e) => e.toString(16).padStart(2, "0")).join("");
}
function Sn() {
	return `mjr_${xn(18)}`;
}
function Cn(e) {
	return String(e?.apiToken || "").trim().length >= fn && H(e?.allowWrite, !0) && H(e?.requireAuth, !1) && !H(e?.allowRemoteWrite, !1);
}
function wn(e) {
	let t = String((e && typeof e == "object" ? e : {}).apiToken || "").trim();
	return {
		apiToken: t.length >= fn ? t : Sn(),
		allowWrite: !0,
		requireAuth: !0,
		allowRemoteWrite: !1,
		allowInsecureTokenTransport: yn()
	};
}
function Tn(e) {
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
function En(e) {
	return ie(Tn(e));
}
function Dn(e) {
	let t = String(e?.security?.tokenHint || "").trim();
	return t ? n("setting.sec.token.placeholderConfigured", "Token configured on server ({tokenHint}). Leave blank to keep the current server token.", { tokenHint: t }) : e?.security?.tokenConfigured ? n("setting.sec.token.placeholderConfiguredGeneric", "Token configured on server. Leave blank to keep the current server token.") : n("setting.sec.token.placeholder", "Auto-generated for this browser session.");
}
function On(e, t, a) {
	let o = (e, t) => [
		dn,
		e,
		t
	];
	e({
		id: `${un}.Safety.ConfirmDeletion`,
		category: o(n("cat.security"), "Confirm before deleting"),
		name: "Confirm before deleting",
		tooltip: "Show a confirmation dialog before deleting files. Disabling this allows instant deletion.",
		type: "boolean",
		defaultValue: t.safety?.confirmDeletion !== !1,
		onChange: (e) => {
			hn(t.safety?.confirmDeletion !== !1, e) || (t.safety = t.safety || {}, t.safety.confirmDeletion = !!e, q(t), J(t), a("safety.confirmDeletion"));
		}
	});
	let s = (r, i, s, c = "cat.security") => {
		e({
			id: `${un}.Security.${r}`,
			category: o(n(c), n(i).replace("Majoor: ", "")),
			name: n(i),
			tooltip: n(s),
			type: "boolean",
			defaultValue: H(t.security?.[r], pn[r] ?? !1),
			onChange: (e) => {
				if (!hn(t.security?.[r], e)) {
					t.security = t.security || {}, t.security[r] = !!e, q(t), a(`security.${r}`);
					try {
						En(t.security).then((e) => {
							e?.ok && e.data?.prefs ? Ft() : e && e.ok === !1 && console.warn("[Majoor] backend security settings update failed", e.error || e);
						}).catch(() => {});
					} catch (e) {
						console.debug?.(e);
					}
				}
			}
		});
	};
	s("safeMode", "setting.sec.safe.name", "setting.sec.safe.desc"), s("allowWrite", "setting.sec.write.name", "setting.sec.write.desc"), s("allowDelete", "setting.sec.del.name", "setting.sec.del.desc"), s("allowRename", "setting.sec.ren.name", "setting.sec.ren.desc"), s("allowOpenInFolder", "setting.sec.open.name", "setting.sec.open.desc"), s("allowResetIndex", "setting.sec.reset.name", "setting.sec.reset.desc"), e({
		id: `${un}.Security.RemoteLanPreset`,
		category: o(n("cat.remote"), n("setting.sec.remoteLanPreset.name").replace("Majoor: ", "")),
		name: n("setting.sec.remoteLanPreset.name"),
		tooltip: n("setting.sec.remoteLanPreset.desc"),
		type: "boolean",
		defaultValue: Cn(t.security),
		onChange: (e) => {
			if (t.security = t.security || {}, hn(t.security.remoteLanPreset, e)) return;
			if (t.security.remoteLanPreset = !!e, !e) {
				q(t), a("security.remoteLanPreset");
				return;
			}
			let o;
			try {
				o = wn(t.security);
			} catch (e) {
				r(e?.message || n("toast.remoteLanPresetFailed", "Failed to apply the recommended remote LAN setup."), "error");
				return;
			}
			Object.assign(t.security, o), t.security.tokenConfigured = !0, t.security.tokenHint = String(o.apiToken || "").trim() ? `...${String(o.apiToken).trim().slice(-4)}` : "", o.apiToken && i(o.apiToken), q(t), a("security.remoteLanPreset"), a("security.apiToken"), a("security.allowWrite"), a("security.requireAuth"), a("security.allowRemoteWrite"), a("security.allowInsecureTokenTransport");
			try {
				En(t.security).then((e) => {
					e?.ok && e.data?.prefs ? (Ft(), r(n("toast.remoteLanPresetApplied", "Recommended remote LAN setup applied. This browser session is now authorized for Majoor write operations."), "success")) : e && e.ok === !1 && (r(e.error || n("toast.remoteLanPresetFailed", "Failed to apply the recommended remote LAN setup."), "error"), console.warn("[Majoor] backend remote LAN preset update failed", e.error || e));
				}).catch((e) => {
					r(e?.message || n("toast.remoteLanPresetFailed", "Failed to apply the recommended remote LAN setup."), "error");
				});
			} catch (e) {
				console.debug?.(e);
			}
		}
	}), e({
		id: `${un}.Security.ApiToken`,
		category: o(n("cat.remote"), n("setting.sec.token.name").replace("Majoor: ", "")),
		name: n("setting.sec.token.name", "Majoor: API Token"),
		tooltip: n("setting.sec.token.desc", "Store the API token used for write operations. Majoor sends it via X-MJR-Token and Authorization headers."),
		type: "text",
		defaultValue: t.security?.apiToken || "",
		attrs: { placeholder: Dn(t) },
		onChange: (e) => {
			t.security = t.security || {};
			let n = gn(e);
			if (gn(t.security.apiToken) !== n && (t.security.apiToken = n, t.security.apiToken && (t.security.tokenConfigured = !0, t.security.tokenHint = `...${t.security.apiToken.slice(-4)}`, i(t.security.apiToken)), q(t), a("security.apiToken"), t.security.apiToken)) try {
				ie({ api_token: t.security.apiToken }).then((e) => {
					e?.ok && e.data?.prefs ? Ft() : e && e.ok === !1 && console.warn("[Majoor] backend token update failed", e.error || e);
				}).catch(() => {});
			} catch (e) {
				console.debug?.(e);
			}
		}
	}), s("requireAuth", "setting.sec.requireAuth.name", "setting.sec.requireAuth.desc", "cat.remote"), s("allowRemoteWrite", "setting.sec.remote.name", "setting.sec.remote.desc", "cat.remote"), s("allowInsecureTokenTransport", "setting.sec.insecureTransport.name", "setting.sec.insecureTransport.desc", "cat.remote");
}
//#endregion
//#region ui/app/settings/settingsAdvanced.ts
var X = "Majoor", kn = "Majoor Assets Manager";
function An(e, t, i, a) {
	let s = (e, t) => [
		kn,
		e,
		t
	], c = String(t.paths?.outputDirectory || ""), d = null, m = 0, x = null;
	e({
		id: `${X}.Paths.OutputDirectory`,
		category: s(n("cat.advanced"), "Paths / Output"),
		name: "Majoor: Generation Output Directory",
		tooltip: "Override the ComfyUI generation output directory used by Majoor (equivalent to --output-directory). Leave empty to keep the current backend default.",
		type: "text",
		defaultValue: String(t.paths?.outputDirectory || ""),
		attrs: { placeholder: "D:\\\\____COMFY_OUTPUTS" },
		onChange: async (e) => {
			let a = String(e || "").trim();
			t.paths = t.paths || {}, t.paths.outputDirectory = a, q(t);
			try {
				d &&= (clearTimeout(d), null);
			} catch (e) {
				console.debug?.(e);
			}
			d = setTimeout(async () => {
				d = null;
				let e = ++m;
				try {
					x?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				x = typeof AbortController < "u" ? new AbortController() : null;
				try {
					let r = await re(a, x ? { signal: x.signal } : {});
					if (e !== m) return;
					if (!r?.ok) throw Error(r?.error || n("toast.failedSetOutputDirectory", "Failed to set output directory"));
					let o = String(r?.data?.output_directory || a).trim();
					t.paths.outputDirectory = o, c = o, q(t), i("paths.outputDirectory");
				} catch (a) {
					if (e !== m || String(a?.name || "") === "AbortError" || String(a?.code || "") === "ABORTED") return;
					t.paths.outputDirectory = c, q(t), i("paths.outputDirectory"), r(a?.message || n("toast.failedSetOutputDirectory", "Failed to set output directory"), "error");
				}
			}, 700);
		}
	});
	try {
		f().then((e) => {
			if (!e?.ok) return;
			let n = String(e?.data?.output_directory || "").trim();
			t.paths = t.paths || {}, t.paths.outputDirectory !== n && (t.paths.outputDirectory = n, c = n, q(t), i("paths.outputDirectory"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	let S = String(t.paths?.indexDirectory || ""), w = null, T = 0, E = null;
	e({
		id: `${X}.Paths.IndexDirectory`,
		category: s(n("cat.advanced"), "Paths / Index"),
		name: "Majoor: Index Database Directory",
		tooltip: "Override the Majoor index database directory. Use this to keep the SQLite index on a different local disk. Requires restart.",
		type: "text",
		defaultValue: String(t.paths?.indexDirectory || ""),
		attrs: { placeholder: "D:\\MajoorIndex" },
		onChange: async (e) => {
			let a = String(e || "").trim();
			t.paths = t.paths || {}, t.paths.indexDirectory = a, q(t);
			try {
				w &&= (clearTimeout(w), null);
			} catch (e) {
				console.debug?.(e);
			}
			w = setTimeout(async () => {
				w = null;
				let e = ++T;
				try {
					E?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				E = typeof AbortController < "u" ? new AbortController() : null;
				try {
					let o = await te(a, E ? { signal: E.signal } : {});
					if (e !== T) return;
					if (!o?.ok) throw Error(o?.error || n("toast.failedSetIndexDirectory", "Failed to set index directory"));
					let s = String(o?.data?.index_directory || a).trim(), c = s !== S;
					t.paths.indexDirectory = s, S = s, q(t), i("paths.indexDirectory"), c && r(n("toast.indexDirectorySavedRestart", "Index directory saved. Restart ComfyUI to apply."), "success", void 0, { history: { trackId: "settings:index-directory-saved" } });
				} catch (a) {
					if (e !== T || String(a?.name || "") === "AbortError" || String(a?.code || "") === "ABORTED") return;
					t.paths.indexDirectory = S, q(t), i("paths.indexDirectory"), r(a?.message || n("toast.failedSetIndexDirectory", "Failed to set index directory"), "error");
				}
			}, 700);
		}
	});
	try {
		_().then((e) => {
			if (!e?.ok) return;
			let n = String(e?.data?.index_directory || "").trim();
			t.paths = t.paths || {}, t.paths.indexDirectory !== n && (t.paths.indexDirectory = n, S = n, q(t), i("paths.indexDirectory"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	let ee = o().map((e) => e.code), D = ["auto", ...ee];
	e({
		id: `${X}.Language`,
		category: s(n("cat.advanced"), n("setting.language.name", "Language")),
		name: n("setting.language.name", "Majoor: Language"),
		tooltip: "Use auto to detect and follow ComfyUI language. Or choose a fixed language for Majoor only.",
		type: "combo",
		defaultValue: t.i18n?.followComfyLanguage ? "auto" : v(),
		options: D,
		onChange: (e) => {
			if (t.i18n = t.i18n || {}, e === "auto") {
				t.i18n.followComfyLanguage = !0, p(!0), u(a), q(t), i("language");
				return;
			}
			ee.includes(e) && (t.i18n.followComfyLanguage = !1, p(!1), b(e), q(t), i("language"));
		}
	}), e({
		id: `${X}.ProbeBackend.Mode`,
		category: s(n("cat.advanced"), n("setting.probe.mode.name").replace("Majoor: ", "")),
		name: n("setting.probe.mode.name"),
		tooltip: n("setting.probe.mode.desc") + " (env: MAJOOR_MEDIA_PROBE_BACKEND)",
		type: "combo",
		defaultValue: t.probeBackend?.mode || G.probeBackend.mode,
		options: [
			"auto",
			"exiftool",
			"ffprobe",
			"both"
		],
		onChange: (e) => {
			let n = ct(e, [
				"auto",
				"exiftool",
				"ffprobe",
				"both"
			], G.probeBackend.mode);
			t.probeBackend = t.probeBackend || {}, t.probeBackend.mode = n, q(t), J(t), i("probeBackend.mode"), le(n).catch(() => {});
		}
	}), e({
		id: `${X}.MetadataFallback.Image`,
		category: s(n("cat.advanced"), "Metadata"),
		name: "Majoor: Metadata Fallback (Images)",
		tooltip: "Enable Pillow fallback when ExifTool is missing or fails.",
		type: "boolean",
		defaultValue: t.metadataFallback?.image ?? G.metadataFallback.image,
		onChange: async (e) => {
			let a = !!e, o = !!(t.metadataFallback?.image ?? G.metadataFallback.image);
			t.metadataFallback = t.metadataFallback || {}, t.metadataFallback.image = a, q(t), i("metadataFallback.image");
			try {
				let e = await he({
					image: a,
					media: t.metadataFallback?.media ?? G.metadataFallback.media
				});
				if (!e?.ok) throw Error(e?.error || n("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"));
			} catch (e) {
				t.metadataFallback.image = o, q(t), i("metadataFallback.image"), r(e?.message || n("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"), "error");
			}
		}
	}), e({
		id: `${X}.MetadataFallback.Media`,
		category: s(n("cat.advanced"), "Metadata"),
		name: "Majoor: Metadata Fallback (Audio/Video)",
		tooltip: "Enable hachoir fallback when ffprobe is missing or fails.",
		type: "boolean",
		defaultValue: t.metadataFallback?.media ?? G.metadataFallback.media,
		onChange: async (e) => {
			let a = !!e, o = !!(t.metadataFallback?.media ?? G.metadataFallback.media);
			t.metadataFallback = t.metadataFallback || {}, t.metadataFallback.media = a, q(t), i("metadataFallback.media");
			try {
				let e = await he({
					image: t.metadataFallback?.image ?? G.metadataFallback.image,
					media: a
				});
				if (!e?.ok) throw Error(e?.error || n("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"));
			} catch (e) {
				t.metadataFallback.media = o, q(t), i("metadataFallback.media"), r(e?.message || n("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"), "error");
			}
		}
	});
	try {
		l().then((e) => {
			if (!e?.ok || !e?.data?.prefs) return;
			let n = e.data.prefs || {}, r = !!(n.image ?? G.metadataFallback.image), a = !!(n.media ?? G.metadataFallback.media);
			t.metadataFallback = t.metadataFallback || {};
			let o = !1;
			t.metadataFallback.image !== r && (t.metadataFallback.image = r, o = !0), t.metadataFallback.media !== a && (t.metadataFallback.media = a, o = !0), o && (q(t), i("metadataFallback"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	e({
		id: `${X}.Db.Timeout`,
		category: s(n("cat.advanced"), "Database"),
		name: "DB Timeout (ms)",
		tooltip: "Client-side DB timeout preference (stored locally).",
		type: "number",
		defaultValue: Number(t.db?.timeoutMs || 5e3),
		attrs: {
			min: 1e3,
			max: 3e4,
			step: 1e3
		},
		onChange: (e) => {
			t.db = t.db || {}, t.db.timeoutMs = Math.max(1e3, Math.min(3e4, Math.round(U(e, 5e3)))), q(t), J(t), i("db.timeoutMs");
		}
	}), e({
		id: `${X}.Db.MaxConnections`,
		category: s(n("cat.advanced"), "Database"),
		name: "DB Max Connections",
		tooltip: "Client-side DB max connections preference (stored locally).",
		type: "number",
		defaultValue: Number(t.db?.maxConnections || 10),
		attrs: {
			min: 1,
			max: 100,
			step: 1
		},
		onChange: (e) => {
			t.db = t.db || {}, t.db.maxConnections = Math.max(1, Math.min(100, Math.round(U(e, 10)))), q(t), J(t), i("db.maxConnections");
		}
	}), e({
		id: `${X}.Db.QueryTimeout`,
		category: s(n("cat.advanced"), "Database"),
		name: "DB Query Timeout (ms)",
		tooltip: "Client-side DB query timeout preference (stored locally).",
		type: "number",
		defaultValue: Number(t.db?.queryTimeoutMs || 1e3),
		attrs: {
			min: 500,
			max: 1e4,
			step: 500
		},
		onChange: (e) => {
			t.db = t.db || {}, t.db.queryTimeoutMs = Math.max(500, Math.min(1e4, Math.round(U(e, 1e3)))), q(t), J(t), i("db.queryTimeoutMs");
		}
	}), e({
		id: `${X}.Observability.Enabled`,
		category: s(n("cat.advanced"), n("setting.obs.enabled.name").replace("Majoor: ", "")),
		name: n("setting.obs.enabled.name"),
		tooltip: n("setting.obs.enabled.desc"),
		type: "boolean",
		defaultValue: !!t.observability?.enabled,
		onChange: (e) => {
			t.observability = t.observability || {}, t.observability.enabled = !!e, q(t), J(t), i("observability.enabled");
		}
	}), e({
		id: `${X}.Observability.RuntimeDashboardMode`,
		category: s(n("cat.advanced"), "Runtime metrics badge"),
		name: "Majoor: Runtime metrics badge",
		tooltip: "Controls the small DB/enrichment/watcher metrics badge in the Assets Manager panel.",
		type: "combo",
		defaultValue: t.observability?.runtimeDashboardMode || G.observability.runtimeDashboardMode,
		options: [
			"autoHide30",
			"always",
			"hidden"
		],
		onChange: (e) => {
			let n = ct(e, [
				"autoHide30",
				"always",
				"hidden"
			], G.observability.runtimeDashboardMode);
			t.observability = t.observability || {}, t.observability.runtimeDashboardMode = n, q(t), i("observability.runtimeDashboardMode");
		}
	}), e({
		id: `${X}.Observability.VerboseErrors`,
		category: s(n("cat.advanced"), "Verbose error logging"),
		name: "Verbose error logging",
		tooltip: "Show detailed error messages in toasts and console. Useful for debugging.",
		type: "boolean",
		defaultValue: !!t.observability?.verboseErrors,
		onChange: (e) => {
			t.observability = t.observability || {}, t.observability.verboseErrors = !!e, q(t), J(t), i("observability.verboseErrors");
		}
	}), e({
		id: `${X}.Observability.VerboseRouteRegistrationLogs`,
		category: s(n("cat.advanced"), "Logs"),
		name: "Majoor: Verbose route registration logs",
		tooltip: "When disabled, Majoor prints a compact startup summary instead of listing every registered API route. Takes effect on the next backend restart.",
		type: "boolean",
		defaultValue: !!(t.observability?.verboseRouteRegistrationLogs ?? G.observability?.verboseRouteRegistrationLogs ?? !1),
		onChange: async (e) => {
			let n = !!e, a = !!(t.observability?.verboseRouteRegistrationLogs ?? G.observability?.verboseRouteRegistrationLogs ?? !1);
			t.observability = t.observability || {}, t.observability.verboseRouteRegistrationLogs = n, q(t), i("observability.verboseRouteRegistrationLogs");
			try {
				let e = await ge(n);
				if (!e?.ok) throw Error(e?.error || "Failed to update route logging settings");
			} catch (e) {
				t.observability.verboseRouteRegistrationLogs = a, q(t), i("observability.verboseRouteRegistrationLogs"), r(e?.message || "Failed to update route logging settings", "error");
			}
		}
	}), (async () => {
		try {
			let e = !!(await y())?.data?.prefs?.enabled;
			t.observability = t.observability || {}, t.observability.verboseRouteRegistrationLogs !== e && (t.observability.verboseRouteRegistrationLogs = e, q(t), i("observability.verboseRouteRegistrationLogs"));
		} catch (e) {
			console.debug?.(e);
		}
	})(), e({
		id: `${X}.Observability.VerboseStartupLogs`,
		category: s(n("cat.advanced"), "Logs"),
		name: "Majoor: Verbose startup logs",
		tooltip: "When disabled, Majoor suppresses most informational bootstrap logs during backend startup while keeping warnings and errors. Takes effect on the next backend restart.",
		type: "boolean",
		defaultValue: !!(t.observability?.verboseStartupLogs ?? G.observability?.verboseStartupLogs ?? !1),
		onChange: async (e) => {
			let n = !!e, a = !!(t.observability?.verboseStartupLogs ?? G.observability?.verboseStartupLogs ?? !1);
			t.observability = t.observability || {}, t.observability.verboseStartupLogs = n, q(t), i("observability.verboseStartupLogs");
			try {
				let e = await oe(n);
				if (!e?.ok) throw Error(e?.error || "Failed to update startup logging settings");
			} catch (e) {
				t.observability.verboseStartupLogs = a, q(t), i("observability.verboseStartupLogs"), r(e?.message || "Failed to update startup logging settings", "error");
			}
		}
	}), (async () => {
		try {
			let e = !!(await C())?.data?.prefs?.enabled;
			t.observability = t.observability || {}, t.observability.verboseStartupLogs !== e && (t.observability.verboseStartupLogs = e, q(t), i("observability.verboseStartupLogs"));
		} catch (e) {
			console.debug?.(e);
		}
	})();
	{
		let a = "HuggingFace Token", o = "", c = null, l = 0, u = !!t.ai?.huggingFaceTokenVisible, d = () => {
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
			category: s(n("cat.advanced"), a),
			name: "Show HuggingFace token",
			tooltip: "Show or hide the HuggingFace token while editing.",
			type: "boolean",
			defaultValue: u,
			onChange: (e) => {
				let n = !!e;
				u = n, t.ai = t.ai || {}, t.ai.huggingFaceTokenVisible = n, q(t), i("ai.huggingFaceTokenVisible"), setTimeout(d, 0);
			}
		}), e({
			id: `${X}.AI.HuggingFaceToken`,
			category: s(n("cat.advanced"), a),
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
				if (t !== o) {
					try {
						c &&= (clearTimeout(c), null);
					} catch (e) {
						console.debug?.(e);
					}
					c = setTimeout(async () => {
						c = null;
						let e = ++l;
						try {
							let n = await O(t);
							if (e !== l) return;
							if (!n?.ok) throw Error(n?.error || "Failed to update HuggingFace token");
							o = t, i("ai.huggingFaceToken"), t ? r("HuggingFace token saved", "success") : r("HuggingFace token cleared", "success", void 0, { noHistory: !0 });
						} catch (t) {
							if (e !== l) return;
							r(t?.message || "Failed to update HuggingFace token", "error");
						}
					}, 900);
				}
			}
		}), setTimeout(d, 0), (async () => {
			try {
				let e = (await h())?.data?.prefs || {}, t = !!e?.has_token, n = String(e?.token_hint || "").trim();
				f(t ? `Configured ${n || "(saved)"}` : "Paste HuggingFace token (hf_...)");
			} catch (e) {
				console.debug?.(e);
			}
		})(), e({
			id: `${X}.AI.VerboseLogs`,
			category: s(n("cat.advanced"), a),
			name: "Majoor: Verbose AI logs",
			tooltip: "Enable detailed HuggingFace/SigLIP2/X-CLIP logs and progress bars during model download/loading.",
			type: "boolean",
			defaultValue: !!(t.ai?.verboseAiLogs ?? G.ai?.verboseAiLogs ?? !1),
			onChange: async (e) => {
				let n = !!e, a = !!(t.ai?.verboseAiLogs ?? G.ai?.verboseAiLogs ?? !1);
				t.ai = t.ai || {}, t.ai.verboseAiLogs = n, q(t), i("ai.verboseAiLogs");
				try {
					let e = await ue(n);
					if (!e?.ok) throw Error(e?.error || "Failed to update AI logging settings");
				} catch (e) {
					t.ai.verboseAiLogs = a, q(t), i("ai.verboseAiLogs"), r(e?.message || "Failed to update AI logging settings", "error");
				}
			}
		}), (async () => {
			try {
				let e = !!(await k())?.data?.prefs?.enabled;
				t.ai = t.ai || {}, t.ai.verboseAiLogs !== e && (t.ai.verboseAiLogs = e, q(t), i("ai.verboseAiLogs"));
			} catch (e) {
				console.debug?.(e);
			}
		})();
	}
	e({
		id: `${X}.AI.VectorStats`,
		category: s(n("cat.advanced"), "AI / Vector Search"),
		name: "Vector Index Status",
		tooltip: "Current status of the SigLIP2/X-CLIP vector index used for semantic search",
		type: "text",
		defaultValue: "Loading vector status..."
	}), (async () => {
		try {
			let e = await ve();
			e?.ok ? console.debug?.("[Majoor] Vector status:", `${e.data?.total || 0} assets indexed | Model: ${e.data?.model || "N/A"}`) : console.debug?.("[Majoor] Vector status unavailable");
		} catch (e) {
			console.debug?.("[Majoor] Vector status fetch failed", e);
		}
	})(), e({
		id: `${X}.AI.VectorBackfillAction`,
		category: s(n("cat.advanced"), "AI / Vector Search"),
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
				r(n("toast.vectorBackfillStarting", "Starting vector backfill... This may take a while."), "info", void 0, { history: {
					...t.history,
					status: "started",
					detail: "Starting vector backfill... This may take a while."
				} });
				let e = await _e(64, { onProgress: (e) => {
					let n = String(e?.status || "running").toLowerCase() || "running", r = e?.progress || e?.result || {}, i = Number(r?.candidates ?? r?.processed ?? 0), a = Number(r?.indexed ?? 0), o = Number(r?.skipped ?? 0), s = Number(r?.errors ?? 0), c = Math.max(i, a + o + s), l = c > 0 ? Math.round((a + o + s) / c * 100) : null, u = n === "queued" ? "Vector backfill queued" : `Candidates ${i}, indexed ${a}, skipped ${o}, errors ${s}`;
					g({
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
					let i = e.data || {}, a = String(i?.status || "").toLowerCase(), o = !!i?.pending || [
						"queued",
						"running",
						"pending"
					].includes(a), s = i?.progress || {}, c = Number(i?.processed ?? s?.candidates ?? 0), l = Number(i?.indexed ?? s?.indexed ?? 0), u = Number(i?.skipped ?? s?.skipped ?? 0);
					if (o) {
						let e = String(i?.job_id || "").trim();
						r(n("toast.vectorBackfillRunning", "Vector backfill still running in background{job}.", { job: e ? ` (job ${e.slice(0, 8)})` : "" }), "info", void 0, { history: {
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
					} else r(n("toast.vectorBackfillComplete", "Vector backfill complete! Processed: {processed}, Indexed: {indexed}, Skipped: {skipped}", {
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
						let e = await ve();
						e?.ok && console.debug?.("[Majoor] Vector stats after backfill:", e.data);
					} catch (e) {
						console.debug?.("[Majoor] Failed to refresh vector stats:", e);
					}
				} else throw Error(e?.error || n("toast.vectorBackfillFailedGeneric", "Backfill failed"));
			} catch (e) {
				let i = e?.message || String(e || n("status.unknown", "unknown"));
				r(n("toast.vectorBackfillFailedDetail", "Vector backfill failed: {error}", { error: i }), "error", void 0, { history: {
					...t.history,
					status: "failed",
					detail: i
				} }), console.error("[Majoor] Vector backfill error:", e);
			}
		}
	});
}
//#endregion
//#region ui/app/settings/settingsSearch.ts
var jn = "Majoor", Mn = "Majoor Assets Manager";
function Nn(e, t, i) {
	let a = (e, t) => [
		Mn,
		e,
		t
	];
	e({
		id: `${jn}.AI.VectorSearchEnabled`,
		category: a(n("cat.search", "Search"), "AI"),
		name: n("setting.ai.vector.enabled.name", "Enable AI semantic search"),
		tooltip: n("setting.ai.vector.enabled.desc", "Enable/disable AI vector search features (SigLIP2/X-CLIP: description search, prompt alignment, AI tag suggestions, smart collections)."),
		type: "boolean",
		defaultValue: !!(t.ai?.vectorSearchEnabled ?? !0),
		onChange: async (e) => {
			t.ai = t.ai || {};
			let n = !!(t.ai.vectorSearchEnabled ?? !0), a = !!e;
			t.ai.vectorSearchEnabled = a, q(t), J(t), i("ai.vectorSearchEnabled");
			try {
				let e = await fe(a);
				if (!e?.ok) {
					t.ai.vectorSearchEnabled = n, q(t), J(t), i("ai.vectorSearchEnabled"), r(e?.error || "Failed to update AI vector search setting", "error");
					return;
				}
				r(a ? "AI semantic search enabled" : "AI semantic search disabled", "info", 2200);
			} catch (e) {
				t.ai.vectorSearchEnabled = n, q(t), J(t), i("ai.vectorSearchEnabled"), r(e?.message || "Failed to update AI vector search setting", "error");
			}
		}
	}), e({
		id: `${jn}.AI.VectorCaptionOnIndex`,
		category: a(n("cat.search", "Search"), "AI"),
		name: n("setting.ai.vector.captionOnIndex.name", "Generate AI captions during indexing"),
		tooltip: n("setting.ai.vector.captionOnIndex.desc", "Allow automatic vector indexing and backfill to run Florence-2 captions for image assets. This is slower and can use significant VRAM/CPU; leave it off for faster grid startup."),
		type: "boolean",
		defaultValue: !!(t.ai?.vectorCaptionOnIndex ?? !1),
		onChange: async (e) => {
			t.ai = t.ai || {};
			let n = !!(t.ai.vectorCaptionOnIndex ?? !1), a = !!e;
			t.ai.vectorCaptionOnIndex = a, q(t), J(t), i("ai.vectorCaptionOnIndex");
			try {
				let e = await fe({ caption_on_index: a });
				if (!e?.ok) {
					t.ai.vectorCaptionOnIndex = n, q(t), J(t), i("ai.vectorCaptionOnIndex"), r(e?.error || "Failed to update AI caption indexing setting", "error");
					return;
				}
				a && r("AI captions during indexing enabled", "info", 2600);
			} catch (e) {
				t.ai.vectorCaptionOnIndex = n, q(t), J(t), i("ai.vectorCaptionOnIndex"), r(e?.message || "Failed to update AI caption indexing setting", "error");
			}
		}
	}), e({
		id: `${jn}.Search.MaxResults`,
		category: a(n("cat.search", "Search")),
		name: n("setting.search.maxResults.name", "Max search results (client)"),
		tooltip: n("setting.search.maxResults.desc", "Maximum number of results requested per search. The backend still enforces MAJOOR_SEARCH_MAX_LIMIT; increase that env var if you need a higher hard cap."),
		type: "number",
		defaultValue: Number(t.search?.maxResults || A.SEARCH_DEFAULT_LIMIT),
		attrs: {
			min: 10,
			max: A.MAX_PAGE_SIZE || 2e3,
			step: 1
		},
		onChange: (e) => {
			t.search = t.search || {}, t.search.maxResults = Math.max(10, Math.min(A.MAX_PAGE_SIZE || 2e3, Number(e) || A.SEARCH_DEFAULT_LIMIT)), q(t), J(t), i("search.maxResults");
		}
	}), e({
		id: `${jn}.EnvVars.Reference`,
		category: a(n("cat.advanced"), "Environment variables"),
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
var Pn = "Majoor Assets Manager", Fn = /^\s*Majoor:\s*/i, In = Object.freeze({
	ASSETS_PANEL: "Assets Panel",
	GENERATED_FEED: "Generated Feed",
	VIEWER: "Viewer & Floating Viewer",
	INDEXING: "Indexing & Watcher",
	SEARCH_AI: "Search & AI",
	GENERAL: "General",
	ADVANCED: "Advanced",
	SECURITY: "Security"
}), Ln = new Set([
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
]);
function Rn(e) {
	let t = String(e || "").trim();
	return t ? /^Majoor\.(Safety|Security)\./.test(t) ? In.SECURITY : /^Majoor\.(Paths|ProbeBackend|MetadataFallback|Db|Observability)\./.test(t) || t === "Majoor.EnvVars.Reference" || t === "Majoor.AI.HuggingFaceTokenVisible" || t === "Majoor.AI.HuggingFaceToken" || t === "Majoor.AI.VerboseLogs" || t === "Majoor.AI.VectorStats" || t === "Majoor.AI.VectorBackfillAction" ? In.ADVANCED : /^Majoor\.(Viewer|WorkflowMinimap)\./.test(t) ? In.VIEWER : /^Majoor\.Feed\./.test(t) ? In.GENERATED_FEED : /^Majoor\.(AutoScan|Scan|Watcher|ExecutionGrouping|RatingTagsSync)\./.test(t) ? In.INDEXING : t === "Majoor.RtHydrate.Concurrency" ? In.ADVANCED : t === "Majoor.AI.VectorSearchEnabled" || t === "Majoor.AI.VectorCaptionOnIndex" || /^Majoor\.Search\./.test(t) ? In.SEARCH_AI : /^Majoor\.(Grid|Cards|Badges|Sidebar|InfiniteScroll|General)\./.test(t) ? In.ASSETS_PANEL : In.GENERAL : In.GENERAL;
}
function zn(e) {
	let t = Array.isArray(e?.category) ? e.category.filter(Boolean) : [], n = Rn(e?.id), r = String(t[1] || t[0] || "").trim(), i = String(t[2] || "").trim(), a = String(e?.name || "").replace(Fn, "").trim();
	return [
		Pn,
		n,
		i || r || a || n
	];
}
var Bn = !1, Vn = null, Hn = null, Un = !1, Wn = /* @__PURE__ */ new Set();
function Gn(e) {
	if (!e || typeof e != "object") return null;
	let t = { ...e };
	try {
		typeof t.name == "string" && (t.name = t.name.replace(Fn, "").trim());
	} catch (e) {
		console.debug?.(e);
	}
	try {
		t.category = zn(t);
	} catch {
		t.category = [Pn, In.GENERAL];
	}
	return !t.tooltip && typeof t.name == "string" && t.name.trim() && (t.tooltip = t.name.trim()), t;
}
function Kn(e, t, n) {
	let r = String(t?.id || "").trim();
	if (!r || Wn.has(r)) return !1;
	Wn.add(r);
	try {
		return ee(e, r, n);
	} finally {
		Wn.delete(r);
	}
}
function qn(e, t) {
	if (!t || typeof t != "object") return t;
	let n = { ...t };
	Kn(e, n, n.defaultValue);
	let r = n.onChange;
	return n.onChange = (t, ...i) => {
		if (Kn(e, n, t), typeof r == "function") return r(t, ...i);
		n.defaultValue = t;
	}, n;
}
function Jn(e, t, { initRuntime: n = !1 } = {}) {
	if (Hn) typeof t == "function" && Hn.onAppliedListeners.add(t), e && !Hn.app && (Hn.app = e);
	else {
		let n = K();
		n.i18n = n.i18n || {}, typeof n.i18n.followComfyLanguage == "boolean" ? p(!!n.i18n.followComfyLanguage) : (n.i18n.followComfyLanguage = !0, p(!0), q(n));
		let r = /* @__PURE__ */ new Set();
		typeof t == "function" && r.add(t);
		let i = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set(), o = () => {
			if (!i.size) return;
			let e = Array.from(i);
			i.clear();
			for (let t of e) st("mjr-settings-changed", { key: t }, { warnPrefix: "[Majoor]" });
		}, s = () => {
			if (!a.size) return;
			let e = Array.from(a);
			a.clear();
			for (let t of e) st("mjr-settings-changed", { key: t }, { warnPrefix: "[Majoor]" });
		}, c = Zt(o, 120), l = Zt(s, 450), u = (e) => {
			typeof e == "string" && i.add(e), c();
		}, d = (e) => {
			typeof e == "string" && a.add(e), l();
		}, f = () => {
			let e = K();
			Object.assign(n, e), J(n), u("storage");
		}, m = (e) => {
			!e || e.key !== "mjrSettings" || e.newValue !== e.oldValue && f();
		};
		if (!Bn) {
			if (Vn && typeof window < "u") try {
				window.removeEventListener("storage", Vn);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				window.addEventListener("storage", m), Bn = !0, Vn = m;
			} catch (e) {
				console.debug?.(e);
			}
		}
		Hn = {
			app: e,
			notifyApplied: (e) => {
				for (let t of r) try {
					t(n, e);
				} catch (e) {
					console.debug?.(e);
				}
				Ln.has(String(e || "")) ? d(e) : u(e);
			},
			onAppliedListeners: r,
			refreshFromStorage: f,
			settings: n
		};
	}
	if (n && !Un) {
		let t = e || Hn.app, n = Hn.settings;
		u(t), J(n), xe(t), Ft(), It(), Lt(), n?.watcher && typeof n.watcher.enabled == "boolean" && se(!!n.watcher.enabled).catch(() => {}), Yt(), Un = !0;
	}
	return Hn;
}
var Yn = (e, t) => Jn(e, t, { initRuntime: !0 }).settings, Xn = (e, t) => {
	let n = Jn(e, t, { initRuntime: !1 });
	Object.assign(n.settings, K());
	let r = (t) => {
		let r = Gn(t);
		r && i.push(qn(e || n.app, r));
	}, i = [];
	return $t(r, n.settings, n.notifyApplied), ln(r, n.settings, n.notifyApplied), nn(r, n.settings, n.notifyApplied), on(r, n.settings, n.notifyApplied), On(r, n.settings, n.notifyApplied), An(r, n.settings, n.notifyApplied, e), Nn(r, n.settings, n.notifyApplied), i;
};
try {
	let e = K();
	e?.watcher && typeof e.watcher.enabled == "boolean" && s().then((e) => {
		let t = !!e?.ok && !!e?.data?.enabled, n = K();
		n.watcher = n.watcher || {}, typeof t == "boolean" && t !== !!n.watcher.enabled && (n.watcher.enabled = t, q(n), st("mjr-settings-changed", { key: "watcher.enabled" }, { warnPrefix: "[Majoor]" }));
	}).catch(() => {});
} catch (e) {
	console.debug?.(e);
}
//#endregion
//#region ui/features/status/AssetStatusDotTheme.ts
function Zn(e) {
	return String(e || "").trim().toLowerCase();
}
function Qn({ dot: e = null, asset: t = null, scope: n = "" } = {}) {
	let r = Zn(n);
	if (r) return r === "custom";
	let i = Zn(t?.type || t?.scope);
	if (i) return i === "custom";
	try {
		let t = Zn(e?.closest?.(".mjr-grid")?.dataset?.mjrScope);
		if (t) return t === "custom";
	} catch (e) {
		console.debug?.(e);
	}
	return !1;
}
function $n(e, t = {}) {
	let n = Zn(e);
	return Qn(t) ? n === "pending" || n === "info" ? "var(--mjr-browser-status-info, #4DB6AC)" : n === "success" ? "var(--mjr-browser-status-success, #2E7D32)" : n === "warning" ? "var(--mjr-browser-status-warning, #FFB74D)" : n === "error" ? "var(--mjr-browser-status-error, #EF5350)" : "var(--mjr-browser-status-neutral, #90A4AE)" : n === "pending" || n === "info" ? "var(--mjr-status-info, #64B5F6)" : n === "success" ? "var(--mjr-status-success, #4CAF50)" : n === "warning" ? "var(--mjr-status-warning, #FFA726)" : n === "error" ? "var(--mjr-status-error, #f44336)" : "var(--mjr-status-neutral, #666)";
}
//#endregion
//#region ui/stores/useRuntimeStore.ts
var er = Qe("mjr-runtime", () => {
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
function tr() {
	try {
		return $e() ? er() : null;
	} catch {
		return null;
	}
}
//#endregion
//#region ui/stores/runtimeEnrichmentState.ts
var nr = Symbol.for("majoor.assets_manager.runtime_state");
function rr() {
	return {
		api: null,
		assetsDeletedHandler: null,
		enrichmentActive: !1,
		enrichmentQueueLength: 0
	};
}
function ir() {
	try {
		let e = typeof globalThis < "u" ? globalThis : {};
		return (!e[nr] || typeof e[nr] != "object") && (e[nr] = rr()), e[nr];
	} catch {
		return rr();
	}
}
function ar(e, t) {
	let n = tr();
	if (n) {
		n.setEnrichmentState(e, t);
		return;
	}
	let r = ir();
	r.enrichmentActive = !!e, r.enrichmentQueueLength = Math.max(0, Number(t || 0) || 0);
}
function or() {
	let e = tr();
	if (e) return e.getEnrichmentState();
	let t = ir();
	return {
		active: !!t.enrichmentActive,
		queueLength: Math.max(0, Number(t.enrichmentQueueLength || 0) || 0)
	};
}
//#endregion
//#region ui/features/grid/AssetCardRenderer.ts
function sr(e) {
	try {
		return String(e || "").trim().toLowerCase();
	} catch {
		return "";
	}
}
function cr(e) {
	try {
		return (String(e || "").split(".").pop() || "").toUpperCase();
	} catch {
		return "";
	}
}
function lr(e) {
	try {
		let t = String(e || ""), n = t.lastIndexOf("."), r = n > 0 ? t.slice(0, n) : t;
		return String(r || "").trim().toLowerCase();
	} catch {
		return "";
	}
}
function ur(e) {
	try {
		if (String(e?.kind || "").toLowerCase() !== "video") return !1;
		let t = String(e?.filename || "").toLowerCase();
		return t.includes("-audio") || t.includes("_audio");
	} catch {
		return !1;
	}
}
function dr(e) {
	try {
		let t = String(e?.kind || "").toLowerCase(), n = 0;
		ur(e) ? n = 2 : t === "video" && (n = 1);
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
function fr(e, t) {
	for (let n = 0; n < Math.max(e.length, t.length); n++) {
		let r = (e[n] || 0) - (t[n] || 0);
		if (r !== 0) return r;
	}
	return 0;
}
function pr(e) {
	if (!Array.isArray(e) || e.length === 0) return null;
	if (e.length === 1) return e[0];
	let t = e[0], n = dr(t);
	for (let r = 1; r < e.length; r++) {
		let i = e[r], a = dr(i);
		fr(a, n) > 0 && (t = i, n = a);
	}
	return t;
}
function mr(e, t) {
	if (!e || !Array.isArray(t) || t.length === 0 || (Number(e?.generation_time_ms ?? e?.metadata?.generation_time_ms ?? 0) || 0) > 0) return e;
	let n = t.find((e) => (Number(e?.generation_time_ms ?? e?.metadata?.generation_time_ms ?? 0) || 0) > 0);
	if (!n) return e;
	let r = Number(n?.generation_time_ms ?? n?.metadata?.generation_time_ms ?? 0) || 0;
	return r <= 0 ? e : (e.generation_time_ms = r, !e.has_generation_data && n?.has_generation_data && (e.has_generation_data = n.has_generation_data), e);
}
function hr(e, t) {
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
function gr(e) {
	try {
		return !!e()?.siblings?.hidePngSiblings;
	} catch {
		return !1;
	}
}
function _r(e) {
	return `${String(e?.source || e?.type || "").trim().toLowerCase()}|${String(e?.root_id || e?.custom_root_id || "").trim().toLowerCase()}|${String(e?.subfolder || "").trim().toLowerCase()}`;
}
function vr(e) {
	let t = sr(e?.filename);
	return t ? `${_r(e)}|${t}` : "";
}
function yr(e, t = cr(e?.filename || "")) {
	let n = hr(e, t), r = String(e?.filename || "").trim();
	if (!r) return "";
	let i = _r(e);
	if (n === "model3d") return `${i}|model3d|${r.toLowerCase()}`;
	let a = lr(r);
	return a ? `${i}|media|${a}` : "";
}
function br(e) {
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
function xr(e, t, n) {
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
function Sr(e, t, n, r) {
	let i = n.stemMap.get(t);
	if (!i?.length) return [];
	let a = [];
	for (let e = i.length - 1; e >= 0; e--) r(i[e]) && (a.push(i[e]), i.splice(e, 1));
	return i.length || n.stemMap.delete(t), a;
}
function Cr(e, t, n) {
	if (!gr(n)) return {
		hidden: !1,
		hideEnabled: !1,
		removed: []
	};
	let r = br(t), i = String(e?.filename || ""), a = cr(i), o = hr(e, a), s = yr(e, a);
	if (!s) return {
		hidden: !1,
		hideEnabled: !0,
		removed: []
	};
	if (o === "video" || o === "audio" || o === "model3d" || a === "WEBP") return r.nonImageSiblingKeys.add(s), {
		hidden: !1,
		hideEnabled: !0,
		removed: Sr(t, s, r, (e) => cr(e?.filename || "") === "PNG")
	};
	if (a === "PNG") {
		let t = `${_r(e)}|model3d|${lr(i)}`;
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
function wr(e, t, n, r) {
	let i = gr(r.loadMajoorSettings), a = n.filenameCounts || /* @__PURE__ */ new Map();
	n.filenameCounts = a, r.clearGridMessage(e);
	let o = r.ensureVirtualGrid(e, n);
	if (!o) return 0;
	i || (n.hiddenPngSiblings = 0), n.assetKeyFn = r.assetKey;
	let s = br(n), c = /* @__PURE__ */ new Map();
	for (let e of n.assets || []) {
		let t = vr(e);
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
				let l = mr(pr(s), s), u = s.filter((e) => e !== l);
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
		let t = cr(String(e?.filename || "")), i = Cr(e, n, r.loadMajoorSettings);
		for (let e of i.removed || []) f.add(e);
		if (i.hidden) {
			n.hiddenPngSiblings += 1;
			continue;
		}
		let a = vr(e);
		if (a) {
			let t = c.get(a);
			t || (t = [], c.set(a, t)), t.push(e);
		}
		let o = r.assetKey(e);
		if (!o || s.seenKeys.has(o) || e.id != null && s.assetIdSet.has(String(e.id))) continue;
		s.seenKeys.add(o), e.id != null && s.assetIdSet.add(String(e.id)), d.push(e);
		let u = yr(e, t);
		if (u) {
			let t = s.stemMap.get(u);
			t || (t = [], s.stemMap.set(u, t)), t.push(e);
		}
		l++;
	}
	if (f.size > 0) {
		n.hiddenPngSiblings += f.size, n.assets = n.assets.filter((e) => !f.has(e));
		for (let e = d.length - 1; e >= 0; e--) f.has(d[e]) && (d.splice(e, 1), l = Math.max(0, l - 1));
		for (let e of f) xr(n, e, s);
		try {
			for (let e of f) {
				let t = vr(e);
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
function Tr({ ext: e = "", filename: t = "", count: n = 0, paths: r = [] } = {}) {
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
function Er(e, t, n = !1, r = null) {
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
	}[hr({ kind: t }, a)], s = o ? `var(${o}, #607D8B)` : "#607D8B", c = n ? "var(--mjr-badge-duplicate-alert, #ff1744)" : s;
	i.textContent = a + (n ? "+" : ""), i.title = n ? Tr({
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
function Dr(e, t, n = null) {
	if (e) try {
		let r = e.dataset?.mjrExt || "", i = e.dataset?.mjrBadgeBg || "var(--mjr-badge-image, #607D8B)";
		e.textContent = String(r || "") + (t ? "+" : ""), e.title = t ? Tr({
			ext: r,
			filename: n?.filename || "",
			count: n?.count,
			paths: n?.paths
		}) : `${r} file`, e.style.background = t ? "var(--mjr-badge-duplicate-alert, #ff1744)" : i, e.style.cursor = t ? "pointer" : "default";
	} catch (e) {
		console.debug?.(e);
	}
}
function Or(e) {
	return e === !0 ? !0 : e === !1 ? !1 : e === 1 || e === "1" ? !0 : e === 0 || e === "0" ? !1 : null;
}
function kr(e, t = []) {
	if (!e || typeof e != "object") return null;
	for (let n of t) if (e[n] != null) return e[n];
	return null;
}
function Ar(e) {
	return typeof e == "string" && e.trim().length > 0;
}
function jr(e) {
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
function Mr(e) {
	let t = kr(e, [
		"auto_tags",
		"autoTags",
		"ai_auto_tags",
		"aiAutoTags",
		"suggested_tags",
		"suggestedTags"
	]), n = kr(e, [
		"enhanced_caption",
		"enhancedCaption",
		"enhanced_prompt",
		"enhancedPrompt",
		"ai_enhanced_prompt",
		"aiEnhancedPrompt"
	]), r = Or(kr(e, [
		"has_ai_auto_tags",
		"hasAiAutoTags",
		"ai_has_auto_tags",
		"aiHasAutoTags"
	])), i = Or(kr(e, [
		"has_ai_enhanced_caption",
		"hasAiEnhancedCaption",
		"ai_has_enhanced_caption",
		"aiHasEnhancedCaption"
	])), a = Or(kr(e, [
		"has_ai_vector",
		"hasAiVector",
		"has_vector_embedding",
		"hasVectorEmbedding",
		"vector_indexed",
		"vectorIndexed"
	])), o = Or(kr(e, [
		"has_ai_info",
		"hasAiInfo",
		"ai_indexed",
		"aiIndexed"
	])), s = r === !0 || r === null && jr(t), c = i === !0 || i === null && Ar(n), l = a === !0 || o === !0;
	return {
		hasAiInfo: o === !0 || s || c || l,
		hasAutoTags: s,
		hasEnhancedPrompt: c,
		hasVectorIndexed: l
	};
}
function Nr(e) {
	let t = document.createElement("span");
	t.className = "mjr-workflow-dot mjr-asset-status-dot";
	let n = Or(e?.has_workflow ?? e?.hasWorkflow), r = Or(e?.has_generation_data ?? e?.hasGenerationData), i = or(), a = i.queueLength, o = i.active || a > 0, s = "Pending: parsing metadata…", c = n === !0 || r === !0, l = n === !1 || r === !1, u = n === null || r === null;
	n === !0 && r === !0 ? s = "Complete: workflow + generation data detected" : c ? s = n === !0 ? "Partial: workflow only (generation data missing)" : "Partial: generation data only (workflow missing)" : l && !c && !u ? s = "None: no workflow or generation data found" : u && (s = "Pending: metadata not parsed yet");
	let d = u ? "pending" : n === !0 && r === !0 ? "success" : c ? "warning" : "error";
	o && d !== "success" && (d = "pending", s = a > 0 ? `Pending: database metadata enrichment in progress (${a} queued)` : "Pending: database metadata enrichment in progress"), Pr(t, d, s, { asset: e });
	let f = Mr(e);
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
function Pr(e, t, n = "", r = {}) {
	if (!e) return;
	let i = String(t || "").toLowerCase(), a = $n(i, {
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
function Fr(e) {
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
function Ir(e) {
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
function Lr(e) {
	let t = Number(e) / 1e3;
	return t >= 60 ? "#FF9800" : t >= 30 ? "#FFC107" : t >= 10 ? "#8BC34A" : "#4CAF50";
}
function Rr(e) {
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
function zr(e, { maxMs: t = 864e5 } = {}) {
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
function Br(e) {
	let t = document.createElement("div");
	t.className = "mjr-tags-badge";
	let n = Ir(e);
	return n.length === 0 ? (t.style.display = "none", t) : (t.textContent = n.join(", "), t.title = `Tags: ${n.join(", ")}`, t.style.cssText = "\n        position: absolute;\n        bottom: 6px;\n        left: 6px;\n        padding: 3px 6px;\n        border-radius: 4px;\n        background: rgba(0,0,0,0.8);\n        color: var(--mjr-tag-color, #90CAF9);\n        font-size: 9px;\n        max-width: 80%;\n        overflow: hidden;\n        text-overflow: ellipsis;\n        white-space: nowrap;\n        pointer-events: none;\n        z-index: 10;\n        box-shadow: 0 2px 4px rgba(0,0,0,0.3);\n    ", t);
}
//#endregion
//#region ui/utils/safeCall.ts
var Vr = () => {};
function Hr(e) {
	try {
		return !!j?.[e];
	} catch {
		return !1;
	}
}
function Ur(e, t) {
	try {
		console.warn(`[Majoor] ${e}`, t);
	} catch (e) {
		console.debug?.(e);
	}
}
function Wr(e, t = "safeCall") {
	try {
		return e?.();
	} catch (e) {
		Hr("DEBUG_SAFE_CALL") && Ur(t, e);
		return;
	}
}
function Gr(e, t, n, r, i = "safeAddListener") {
	try {
		return e?.addEventListener?.(t, n, r), () => {
			try {
				e?.removeEventListener?.(t, n, r);
			} catch (e) {
				Hr("DEBUG_SAFE_LISTENERS") && Ur(`${i}:remove:${String(t || "")}`, e);
			}
		};
	} catch (e) {
		return Hr("DEBUG_SAFE_LISTENERS") && Ur(`${i}:add:${String(t || "")}`, e), Vr;
	}
}
//#endregion
//#region ui/utils/mediaFps.ts
function Kr(e) {
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
function qr(e) {
	try {
		let t = e, n = t.metadata_raw || {}, r = (n.raw_ffprobe || {}).video_stream || {};
		return Kr(t.fps) ?? Kr(n.fps) ?? Kr(n.frame_rate) ?? Kr(r.avg_frame_rate) ?? Kr(r.r_frame_rate);
	} catch {
		return null;
	}
}
function Jr(e, t) {
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
function Yr(e) {
	let t = Number(e);
	return !Number.isFinite(t) || t <= 0 ? "" : Math.abs(t - Math.round(t)) < .001 ? `${Math.round(t)} fps` : `${t.toFixed(3).replace(/\.?0+$/, "")} fps`;
}
function Xr(e, t = 30) {
	let n = Kr(e);
	if (n != null) return Math.max(1, Math.round(n * 1e3) / 1e3);
	let r = Kr(t);
	return r == null ? 30 : Math.max(1, Math.round(r * 1e3) / 1e3);
}
//#endregion
//#region ui/vue/majoorPrimeVue.ts
var Zr = {
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
function Qr(e) {
	return e.use(Le, {
		ripple: !1,
		unstyled: !0,
		zIndex: { overlay: 10100 }
	}), e.use(Ve), e.use(We), Object.entries(Zr).forEach(([t, n]) => {
		e.component(`M${t}`, n);
	}), e;
}
//#endregion
//#region ui/vue/createVueApp.ts
function $r(e, t = void 0) {
	let n = et(), r = Ie(e, t);
	return r.use(n), Qr(r), {
		app: r,
		pinia: n
	};
}
var ei = /* @__PURE__ */ new Map();
function ti(e, t, n) {
	try {
		window.dispatchEvent(new CustomEvent("mjr:keepalive-attached", { detail: {
			mountKey: String(e || "_mjrVueApp"),
			host: t || null,
			container: n || null
		} }));
	} catch {}
}
function ni(e) {
	let t = document.createElement("div");
	return t.dataset.mjrKeepAliveHost = String(e || "_mjrVueApp"), t.style.height = "100%", t.style.width = "100%", t.style.minHeight = "0", t.style.display = "flex", t.style.flexDirection = "column", t.style.overflow = "hidden", t;
}
function ri(e, t) {
	!e || !t || (e.style.height = "100%", e.style.minHeight = "0", e.style.display = "flex", e.style.flexDirection = "column", e.style.overflow = "hidden", !(e.firstChild === t && e.childNodes.length === 1) && (e.replaceChildren(t), ti(t?.dataset?.mjrKeepAliveHost, t, e)));
}
function ii(e, t, n = "_mjrVueApp") {
	if (!e) return !1;
	let r = ei.get(n), i = !1;
	if (!r) {
		let e = ni(n), { app: a } = $r(t);
		a.mount(e), r = {
			app: a,
			host: e,
			container: null
		}, ei.set(n, r), i = !0;
	}
	return ri(e, r.host), r.container = e, i;
}
function ai(e, t = "_mjrVueApp") {
	let n = ei.get(t);
	if (n?.app) {
		try {
			n.app.unmount();
		} catch {}
		try {
			n.host?.remove?.();
		} catch {}
		ei.delete(t);
	}
}
//#endregion
//#region ui/utils/format.ts
function oi(e) {
	if (!e) return null;
	let t = Number(e);
	if (!isNaN(t)) return /* @__PURE__ */ new Date(t * 1e3);
	let n = new Date(e);
	return isNaN(n.getTime()) ? null : n;
}
function si(e) {
	let t = oi(e);
	return t ? `${t.getDate().toString().padStart(2, "0")}/${(t.getMonth() + 1).toString().padStart(2, "0")}` : "";
}
function ci(e) {
	let t = oi(e);
	return t ? `${t.getHours().toString().padStart(2, "0")}:${t.getMinutes().toString().padStart(2, "0")}` : "";
}
function li(e) {
	return e ? e < 60 ? `${Math.round(e)}s` : `${Math.floor(e / 60)}m ${Math.round(e % 60)}s` : "";
}
//#endregion
//#region ui/vue/components/panel/sidebar/SidebarFileInfoSection.vue
var ui = {
	key: 0,
	class: "mjr-sidebar-section",
	style: {
		background: "rgba(255, 255, 255, 0.03)",
		border: "1px solid var(--mjr-border, rgba(255, 255, 255, 0.12))",
		"border-radius": "8px",
		padding: "10px"
	}
}, di = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "6px"
} }, fi = ["title"], pi = ["title"], mi = {
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
				value: li(e.duration),
				tooltip: "Video duration"
			}), r(e)) {
				let t = qr(e);
				t != null && a.push({
					label: "FPS",
					value: Yr(t),
					tooltip: "Native frame rate"
				});
				let n = Jr(e, t);
				n != null && a.push({
					label: "Length",
					value: `${Math.max(0, Math.floor(n))} frames`,
					tooltip: "Total frame count"
				});
			}
			let o = zr(e.generation_time_ms ?? e.metadata?.generation_time_ms ?? 0);
			o > 0 && a.push({
				label: "Generation Time",
				value: `${(Number(o) / 1e3).toFixed(1)}s`,
				tooltip: "Time taken to generate this asset (workflow execution time)",
				valueStyle: `color: ${Lr(o)}; font-weight: 600;`
			});
			let s = e.generation_time || e.file_creation_time || e.mtime || e.created_at;
			if (s) {
				let e = si(s), t = ci(s);
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
		return (e, t) => a.value.length ? (M(), F("div", ui, [t[0] ||= P("div", { style: {
			"font-size": "12px",
			"font-weight": "700",
			color: "#607d8b",
			"margin-bottom": "8px",
			"text-transform": "uppercase",
			"letter-spacing": "0.4px"
		} }, " File Info ", -1), P("div", di, [(M(!0), F(V, null, N(a.value, (e) => (M(), F("div", {
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
		}, R(e.label), 9, fi), P("div", {
			style: L(e.valueStyle || "font-size: 12px; text-align: right; word-break: break-word"),
			title: String(e.value || "")
		}, R(e.value), 13, pi)]))), 128))])])) : z("", !0);
	}
}, hi = new Set([
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
function gi(e) {
	let t = String(e?.filename || e?.name || e?.filepath || e?.path || "").trim().toLowerCase();
	return !t || !t.includes(".") ? "" : t.split(".").pop() || "";
}
function _i(e) {
	return String(e?.kind || "").trim().toLowerCase() === "image" || String(e?.mime || e?.mimetype || "").trim().toLowerCase().startsWith("image/") ? !0 : hi.has(gi(e));
}
function vi(e) {
	let t = gi(e);
	return t === "jpg" || t === "jpeg";
}
function yi() {
	try {
		return !!(K()?.ai?.vectorSearchEnabled ?? !0);
	} catch {
		return !0;
	}
}
function bi(e) {
	return e >= .75 ? "#4CAF50" : e >= .5 ? "#8BC34A" : e >= .3 ? "#FF9800" : "#F44336";
}
function xi(e) {
	return e >= .85 ? "Excellent" : e >= .7 ? "Good" : e >= .5 ? "Fair" : e >= .3 ? "Low" : "Very Low";
}
function Si(e) {
	let t = String(e || "").trim();
	if (!t) return "";
	let n = [];
	for (let e of t.replace(/\r\n/g, "\n").split("\n")) {
		let t = String(e || "").trim();
		t && (/^title\s*:/i.test(t) || (/^caption\s*:/i.test(t) && (t = t.replace(/^caption\s*:/i, "").trim()), t && n.push(t)));
	}
	return (n.length ? n.join(" ") : t).replace(/\s+/g, " ").replace(/:{2,}\s*$/, "").trim();
}
function Ci(e) {
	let t = String(e?.filename || "").trim();
	if (!t) return [];
	let n = String(e?.subfolder || "").trim(), r = String(e?.folder_type || "input").trim().toLowerCase(), i = [], a = (e) => {
		if (!e) return;
		let r = Se(t, n, e);
		r && !i.includes(r) && i.push(r);
	};
	return (r === "input" || r === "output") && a(r), a("input"), a("output"), i;
}
function wi(e) {
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
function Ti(e, t) {
	let n = String(e?.pass_name || "").trim();
	if (n) return n;
	let r = Number(e?.denoise);
	return t === 0 || r === 1 ? "Base" : Number.isFinite(r) && r < 1 ? "Refine / Upscale" : `Pass ${t + 1}`;
}
function Ei(e) {
	return e?.geninfo && typeof e.geninfo == "object" ? { geninfo: e.geninfo } : e?.metadata && (typeof e.metadata == "object" || typeof e.metadata == "string") ? e.metadata : e?.prompt && (typeof e.prompt == "object" || typeof e.prompt == "string") ? e.prompt : e?.metadata_raw ? e.metadata_raw : e?.exif ? e.exif : null;
}
function Di(e) {
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
function Oi(e, t, n, r) {
	let i = String(r || "").trim();
	if (!i) return;
	let a = `${n}::${i}`;
	t.has(a) || (t.add(a), e.push({
		label: n,
		value: i
	}));
}
function ki(e) {
	let t = `${String(e?.source || "").toLowerCase()} ${String(e?.name || e?.lora_name || "").toLowerCase()}`;
	return t.includes("high_noise") || t.includes("high noise") ? "high_noise" : t.includes("low_noise") || t.includes("low noise") ? "low_noise" : "";
}
function Ai(e) {
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
		let n = i.filter((t) => ki(t) === e.key).map((e) => rt(e)).filter(Boolean);
		!e.model && !n.length || t.push({
			...e,
			loras: n
		});
	}), t;
}
function ji(e, t) {
	return t == null ? null : {
		label: e,
		value: t ? "on" : "off"
	};
}
function Mi(e) {
	return e != null && String(e).trim() !== "";
}
function Ni(e) {
	return new Set(Array.isArray(e.override_fields) ? e.override_fields.map((e) => String(e || "").trim()).filter(Boolean) : []);
}
function $(e, ...t) {
	return t.some((t) => e.has(t));
}
function Pi(e) {
	return Array.isArray(e) ? e.filter((e) => e && typeof e == "object").map((e, t) => ({
		title: String(e.title || `Custom Info ${t + 1}`).trim(),
		content: String(e.content ?? e.value ?? "").trim(),
		color: /^#[0-9a-fA-F]{6}$/.test(String(e.color || "").trim()) ? String(e.color).trim() : "#2196F3"
	})).filter((e) => e.content) : [];
}
function Fi(e) {
	let t = nt(Ei(e)), n = {
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
		isImageAsset: _i(e),
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
	if (!t || typeof t == "object" && Object.keys(t).length === 0 || !Di(t)) {
		let t = e?.metadata_raw?.geninfo_status || e?.geninfo_status;
		return t && typeof t == "object" && t.kind === "media_pipeline" ? {
			...n,
			kind: "media-only",
			mediaOnlyMessage: "This file looks like a media-only pipeline (e.g. LoadVideo/VideoCombine) and does not contain generation parameters."
		} : _i(e) || vi(e) ? {
			...n,
			kind: "caption-only",
			showAlignment: !1
		} : n;
	}
	let r = t, i = Ni(r), a = r.engine && typeof r.engine == "object" ? r.engine : null, o = !!(r.is_override || a?.mode === "override" || a?.parser_version === "geninfo-override-v1" || a?.source === "majoor_geninfo"), s = ot(r), c = tt(typeof r.prompt == "string" ? r.prompt : null, typeof (r.negative_prompt || r.negativePrompt) == "string" ? r.negative_prompt || r.negativePrompt : null), l = Array.isArray(r.all_positive_prompts) && r.all_positive_prompts.length > 1 ? r.all_positive_prompts.map((e, t) => {
		let n = tt(typeof e == "string" ? e : "", typeof r.all_negative_prompts?.[t] == "string" ? r.all_negative_prompts[t] : "");
		return {
			label: `Prompt ${t + 1}`,
			positive: it(n.positive),
			negative: it(n.negative)
		};
	}).filter((e) => e.positive) : [], u = [], d = /* @__PURE__ */ new Set(), f = r.models && typeof r.models == "object" ? r.models : null, p = Ai(r), m = new Set(p.map((e) => String(e.model || "").trim()).filter(Boolean)), h = Array.isArray(r.all_checkpoints) && r.all_checkpoints.length > 1 ? r.all_checkpoints : null;
	if (f) {
		let e = new Set([
			Q(f.unet_high_noise),
			Q(f.unet_low_noise),
			...m
		].filter(Boolean));
		if (h) h.forEach((e, t) => {
			let n = Q(e);
			Oi(u, d, `Checkpoint ${t + 1}`, n);
		});
		else {
			let t = Q(f.checkpoint);
			t && !e.has(t) && Oi(u, d, "Checkpoint", t);
		}
		[
			["UNet", Q(f.unet)],
			["Diffusion", Q(f.diffusion)],
			["Upscaler", Q(f.upscaler)],
			["CLIP", Q(f.clip)],
			["VAE", Q(f.vae)]
		].forEach(([t, n]) => {
			e.has(n) || Oi(u, d, t, n);
		});
	} else (r.model || r.checkpoint) && Oi(u, d, "Model", at(r.model || r.checkpoint));
	if (Array.isArray(r.loras) && r.loras.length > 0) {
		let e = r.loras.map((e) => rt(e)).filter(Boolean).join("\n");
		e && Oi(u, d, r.loras.length > 1 ? "LoRAs" : "LoRA", e);
	}
	!f && r.clip && Oi(u, d, "CLIP", at(r.clip)), !f && r.vae && Oi(u, d, "VAE", at(r.vae)), !f && r.unet && Oi(u, d, "UNet", at(r.unet)), !f && r.diffusion && Oi(u, d, "Diffusion", at(r.diffusion)), f && r.clip && Oi(u, d, "CLIP", at(r.clip)), f && r.vae && Oi(u, d, "VAE", at(r.vae));
	for (let e of u) {
		let t = String(e.label || "").toLowerCase();
		(t.includes("checkpoint") || t === "model") && (e.override = $(i, "checkpoint", "model")), t === "clip" && (e.override = $(i, "clip")), t === "vae" && (e.override = $(i, "vae")), t.includes("lora") && (e.override = $(i, "loras"));
	}
	let g = [];
	Mi(r.seed) && g.push({
		label: "Seed",
		value: r.seed,
		override: $(i, "seed")
	}), (r.sampler || r.sampler_name) && g.push({
		label: "Sampler",
		value: r.sampler || r.sampler_name,
		override: $(i, "sampler", "sampler_name")
	}), Mi(r.steps) && g.push({
		label: "Steps",
		value: r.steps,
		override: $(i, "steps")
	});
	let _ = Mi(r.cfg) ? r.cfg : r.cfg_scale;
	Mi(_) && g.push({
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
	let v = Mi(r.denoise) ? r.denoise : r.denoising;
	Mi(v) && g.push({
		label: "Denoise",
		value: v,
		override: $(i, "denoise", "denoising")
	});
	let y = [];
	Array.isArray(r.chained_passes) && r.chained_passes.length > 1 ? y = r.chained_passes.filter((e) => e && typeof e == "object").map((e, t) => ({
		label: Ti(e, t),
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
		label: Ti(e, t),
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
		ji("Torch Compile", r.use_torch_compile),
		ji("CUDA Graphs", r.use_cuda_graphs),
		ji("X-Vector Only", r.x_vector_only_mode)
	].filter(Boolean).forEach((e) => x.push(e));
	let S = [];
	[
		ji("Chunking", r.enable_chunking),
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
		ji("Audio Cache", r.enable_audio_cache),
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
	Mi(v) && !g.some((e) => e.label === "Denoise") && w.push({
		label: "Denoise",
		value: v
	}), Mi(r.clip_skip) && w.push({
		label: "Clip Skip",
		value: r.clip_skip
	});
	let T = [], E = String(r.workflow_notes || r.notes || "").trim();
	E && T.push({
		label: "Workflow Notes",
		value: E,
		override: $(i, "workflow_notes", "notes")
	});
	let ee = Pi(r.custom_info), D = Array.isArray(r.inputs) ? r.inputs.filter((e) => e && typeof e == "object" && e.filename).map((e, t) => ({
		id: `${e.filename}-${t}`,
		filename: String(e.filename || "").trim(),
		filepath: String(e.filepath || e.filename || "").trim(),
		role: String(e.role || "").trim(),
		roleLabel: String(e.role || "").trim().replace(/_/g, " "),
		isVideo: String(e.type || "").toLowerCase() === "video" || /\.(mp4|mov|webm)$/i.test(String(e.filename || "")),
		previewCandidates: Ci(e)
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
		isImageAsset: _i(e),
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
		inputFiles: D,
		isOverride: o,
		overrideLabel: o ? "Gen Info Override" : "",
		notesFields: T,
		customInfoBlocks: ee
	};
}
//#endregion
//#region ui/vue/components/panel/sidebar/GenerationInputThumb.vue
var Ii = ["title"], Li = ["src"], Ri = ["src"], zi = {
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
}, Bi = {
	key: 3,
	title: "Video file",
	style: {
		position: "absolute",
		color: "white",
		opacity: "0.7",
		"font-size": "16px",
		"pointer-events": "none"
	}
}, Vi = {
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
			if (wi(t)) try {
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
		}, null, 40, Li)) : (M(), F("img", {
			key: 1,
			src: i(),
			style: {
				width: "100%",
				height: "100%",
				"object-fit": "cover"
			},
			onError: a
		}, null, 40, Ri)), e.inputFile.role && e.inputFile.role !== "secondary" ? (M(), F("div", zi, R(e.inputFile.roleLabel), 1)) : e.inputFile.isVideo ? (M(), F("div", Bi, " ▶ ")) : z("", !0)], 44, Ii));
	}
}, Hi = {
	key: 0,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "12px"
	}
}, Ui = {
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
}, Wi = { style: {
	display: "flex",
	"align-items": "center",
	gap: "8px",
	"flex-wrap": "wrap",
	"justify-content": "flex-end"
} }, Gi = ["title"], Ki = ["title"], qi = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px"
} }, Ji = { style: {
	"font-size": "11px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"font-weight": "600"
} }, Yi = { style: {
	"font-size": "12px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"line-height": "1.5",
	"white-space": "pre-wrap",
	"word-break": "break-word"
} }, Xi = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#4CAF50",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, Zi = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "6px",
	"margin-bottom": "10px"
} }, Qi = ["onClick"], $i = ["onClick"], ea = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#4CAF50",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, ta = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#F44336",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, na = { style: {
	display: "flex",
	"align-items": "center",
	gap: "10px"
} }, ra = { style: {
	flex: "1",
	height: "8px",
	background: "rgba(255,255,255,0.1)",
	"border-radius": "4px",
	overflow: "hidden"
} }, ia = {
	key: 0,
	style: {
		"font-size": "10px",
		color: "rgba(255,255,255,0.65)",
		border: "1px dashed rgba(255,255,255,0.25)",
		"border-radius": "4px",
		padding: "6px 8px",
		background: "rgba(255,255,255,0.04)"
	}
}, aa = { style: {
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
} }, oa = { title: "AI caption generated by Florence-2" }, sa = { style: {
	display: "flex",
	"align-items": "center",
	gap: "6px"
} }, ca = ["title"], la = { style: {
	"font-size": "12px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"line-height": "1.5",
	"white-space": "pre-wrap",
	"word-break": "break-word"
} }, ua = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "6px",
	"margin-bottom": "10px"
} }, da = { style: {
	"font-size": "10px",
	"font-weight": "600",
	color: "rgba(255,255,255,0.6)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, fa = ["onClick"], pa = { style: {
	display: "grid",
	"grid-template-columns": "repeat(auto-fit, minmax(220px, 1fr))",
	gap: "10px"
} }, ma = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px"
} }, ha = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "4px"
} }, ga = ["onClick"], _a = {
	key: 0,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "6px"
	}
}, va = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "5px"
} }, ya = ["onClick"], ba = { style: {
	display: "grid",
	"grid-template-columns": "auto 1fr",
	gap: "8px 12px",
	"align-items": "start"
} }, xa = ["title"], Sa = ["title", "onClick"], Ca = ["title", "onClick"], wa = ["title", "onClick"], Ta = ["title"], Ea = ["title"], Da = { style: {
	display: "flex",
	gap: "8px",
	"flex-wrap": "wrap"
} }, Oa = {
	__name: "SidebarGenerationSection",
	props: { asset: {
		type: Object,
		required: !0
	} },
	setup(e) {
		let t = e, r = I(0), i = I(0), a = I(""), o = I("Copy"), s = I("Generate"), c = I(!1), l = I(d()), u = 0;
		function d() {
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
		let g = B(() => Fi(t.asset)), _ = B(() => yi()), v = B(() => g.value.kind === "full" || g.value.kind === "caption-only"), y = B(() => Si(a.value) || g.value.emptyCaptionText), b = B(() => _.value && g.value.isImageAsset && !!t.asset?.id), x = B(() => _.value && !!Si(y.value) && y.value !== g.value.emptyCaptionText), S = B(() => {
			let e = [];
			return g.value.modelFields.length && e.push({
				key: "model",
				title: "Model & LoRA",
				accent: "#9C27B0",
				emphasis: !0,
				fields: g.value.modelFields
			}), !g.value.pipelineTabs.length && g.value.samplingFields.length && e.push({
				key: "sampling",
				title: "Sampling",
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
				title: "Audio",
				accent: "#00BCD4",
				emphasis: !1,
				fields: g.value.audioFields
			}), g.value.imageFields.length && e.push({
				key: "image",
				title: "Image",
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
		function w(e, t = !0) {
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
		function T(e) {
			return e === "high_noise" ? "#FF7043" : e === "low_noise" ? "#29B6F6" : "#AB47BC";
		}
		async function E(e, t = null, n = "rgba(76, 175, 80, 0.35)") {
			let r = String(e ?? "").trim();
			if (!(!r || r === "-")) try {
				await navigator.clipboard.writeText(r), C(t, n);
			} catch (e) {
				console.debug?.(e);
			}
		}
		function ee() {
			l.value = {
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
		function D() {
			l.value = d();
		}
		async function te() {
			u += 1;
			let e = u;
			if (!g.value.showAlignment || !t.asset?.id) {
				D();
				return;
			}
			if (!_.value) {
				ee();
				return;
			}
			D();
			try {
				let n = await ye(t.asset.id);
				if (e !== u) return;
				if (!n?.ok && (String(n?.code || "").toUpperCase() === "SERVICE_UNAVAILABLE" || /vector search is not enabled/i.test(String(n?.error || "")))) {
					ee();
					return;
				}
				let r = n?.ok && n.data != null ? Number(n.data) : null;
				if (!Number.isFinite(r)) {
					l.value = {
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
				let i = Math.round(r * 100), a = bi(r);
				l.value = {
					scoreText: `${i}%`,
					scoreColor: a,
					qualityText: xi(r),
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
		async function re() {
			if (!(!b.value || c.value)) {
				c.value = !0, s.value = "Generating...";
				try {
					let e = await ne(t.asset.id);
					e?.ok && (a.value = String(e?.data || "").trim());
				} catch (e) {
					console.debug?.(e);
				} finally {
					c.value = !1, s.value = "Generate";
				}
			}
		}
		async function ie() {
			if (x.value) try {
				await navigator.clipboard.writeText(y.value), o.value = "Copied!", setTimeout(() => {
					o.value = "Copy";
				}, 900);
			} catch (e) {
				console.debug?.(e);
			}
		}
		return Ce(() => t.asset, () => {
			r.value = 0, i.value = 0, a.value = String(t.asset?.enhanced_caption || "").trim(), o.value = "Copy", s.value = "Generate";
		}, { immediate: !0 }), Ce(() => [
			t.asset?.id,
			g.value.kind,
			g.value.showAlignment,
			_.value
		], () => {
			te();
		}, { immediate: !0 }), (e, t) => {
			let a = Ze("MButton");
			return g.value.kind === "empty" ? z("", !0) : (M(), F("div", Hi, [
				g.value.workflowType ? (M(), F("div", Ui, [t[4] ||= P("span", { style: { opacity: "0.85" } }, "Workflow", -1), P("div", Wi, [P("span", {
					title: `Workflow engine: ${g.value.workflowType}`,
					style: {
						background: "#2196F3",
						color: "white",
						padding: "2px 8px",
						"border-radius": "999px",
						"font-weight": "bold",
						"font-size": "10px",
						"letter-spacing": "0.2px"
					}
				}, R(g.value.workflowLabel || g.value.workflowType), 9, Gi), g.value.workflowBadge ? (M(), F("span", {
					key: 0,
					title: `API provider: ${g.value.workflowBadge}`,
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
				}, R(g.value.workflowBadge), 9, Ki)) : z("", !0)])])) : z("", !0),
				g.value.isOverride ? (M(), F("div", {
					key: 1,
					style: L(p("#00BCD4", {
						emphasis: !0,
						startAlpha: .14,
						endAlpha: .08
					}))
				}, [P("div", qi, [t[5] ||= P("span", { style: {
					"font-size": "11px",
					"font-weight": "700",
					color: "#00BCD4",
					"text-transform": "uppercase",
					"letter-spacing": "0.6px"
				} }, " Override ", -1), P("span", Ji, R(g.value.overrideLabel), 1)])], 4)) : z("", !0),
				g.value.isTruncated ? (M(), F("div", {
					key: 2,
					style: L(p("#FF9800", {
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
				g.value.kind === "media-only" ? (M(), F("div", {
					key: 3,
					style: L(p("#9E9E9E", {
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
				} }, " Generation Data ", -1), P("div", Yi, R(g.value.mediaOnlyMessage), 1)], 4)) : z("", !0),
				g.value.kind === "full" ? (M(), F(V, { key: 4 }, [g.value.promptTabs.length ? (M(), F("div", {
					key: 0,
					style: L(p("#4CAF50", {
						emphasis: !0,
						startAlpha: .16,
						endAlpha: .1
					}))
				}, [
					P("div", Xi, " Prompt Pipeline (" + R(g.value.promptTabs.length) + " variants) ", 1),
					P("div", Zi, [(M(!0), F(V, null, N(g.value.promptTabs, (e, t) => (M(), we(a, {
						key: e.label,
						type: "button",
						severity: "secondary",
						text: "",
						rounded: "",
						style: L({
							appearance: "none",
							border: r.value === t ? "1px solid #4CAF50" : "1px solid var(--border-color, rgba(255,255,255,0.12))",
							borderRadius: "999px",
							background: r.value === t ? "#4CAF5033" : "rgba(127,127,127,0.12)",
							color: r.value === t ? "#4CAF50" : "var(--fg-color, #ddd)",
							fontSize: "11px",
							padding: "4px 10px",
							cursor: "pointer",
							fontWeight: r.value === t ? "700" : "500",
							boxShadow: r.value === t ? "0 0 0 1px #4CAF5055 inset" : "none"
						}),
						onClick: (e) => r.value = t
					}, {
						default: De(() => [Ee(R(e.label), 1)]),
						_: 2
					}, 1032, ["style", "onClick"]))), 128))]),
					(M(!0), F(V, null, N(g.value.promptTabs, (e, n) => Ae((M(), F("div", {
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
							onClick: (t) => E(e.positive, t.currentTarget)
						}, R(e.positive), 9, Qi),
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
							onClick: (t) => E(e.negative, t.currentTarget)
						}, R(e.negative), 9, $i)], 64)) : z("", !0)
					])), [[je, r.value === n]])), 128))
				], 4)) : g.value.positivePrompt ? (M(), F("div", {
					key: 1,
					style: L(p("#4CAF50", {
						emphasis: !0,
						startAlpha: .16,
						endAlpha: .1
					}))
				}, [P("div", ea, [t[10] ||= P("span", null, "Positive Prompt", -1), g.value.positivePromptOverride ? (M(), F("span", {
					key: 0,
					style: L(h()),
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
					onClick: t[0] ||= (e) => E(g.value.positivePrompt, e.currentTarget)
				}, R(g.value.positivePrompt), 1)], 4)) : z("", !0), !g.value.promptTabs.length && g.value.negativePrompt ? (M(), F("div", {
					key: 2,
					style: L(p("#F44336", {
						emphasis: !0,
						startAlpha: .16,
						endAlpha: .1
					}))
				}, [P("div", ta, [t[11] ||= P("span", null, "Negative Prompt", -1), g.value.negativePromptOverride ? (M(), F("span", {
					key: 0,
					style: L(h()),
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
					onClick: t[1] ||= (e) => E(g.value.negativePrompt, e.currentTarget)
				}, R(g.value.negativePrompt), 1)], 4)) : z("", !0)], 64)) : z("", !0),
				v.value ? (M(), F("div", {
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
					class: ze({ "mjr-ai-disabled-block": !_.value })
				}, [
					g.value.showAlignment ? (M(), F(V, { key: 0 }, [
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
						P("div", na, [
							P("div", ra, [P("div", { style: L({
								height: "100%",
								width: l.value.fillWidth,
								background: l.value.fillColor,
								borderRadius: "4px",
								transition: "width 0.6s ease, background 0.4s ease"
							}) }, null, 4)]),
							P("span", { style: L({
								fontSize: "13px",
								fontWeight: "700",
								color: l.value.scoreColor,
								minWidth: "60px",
								textAlign: "right",
								fontFamily: "'Consolas', 'Monaco', monospace"
							}) }, R(l.value.scoreText), 5),
							P("span", { style: L({
								fontSize: "9px",
								fontWeight: "700",
								padding: "2px 6px",
								borderRadius: "3px",
								background: l.value.qualityBackground,
								color: l.value.qualityColor,
								textTransform: "uppercase",
								letterSpacing: "0.5px"
							}) }, R(l.value.qualityText), 5)
						]),
						l.value.aiStatusVisible ? (M(), F("div", ia, R(l.value.aiStatusText), 1)) : z("", !0)
					], 64)) : z("", !0),
					P("div", aa, [P("span", oa, R(g.value.captionLabel), 1), P("div", sa, [Te(a, {
						type: "button",
						class: "mjr-ai-control",
						severity: "secondary",
						text: "",
						disabled: !b.value || c.value,
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
						onClick: Xe(re, ["stop"])
					}, {
						default: De(() => [Ee(R(s.value), 1)]),
						_: 1
					}, 8, ["disabled", "style"]), Te(a, {
						type: "button",
						class: "mjr-ai-control",
						severity: "secondary",
						text: "",
						disabled: !x.value,
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
							opacity: x.value ? "1" : "0.6",
							cursor: x.value ? "pointer" : "default"
						}]),
						onClick: Xe(ie, ["stop"])
					}, {
						default: De(() => [Ee(R(o.value), 1)]),
						_: 1
					}, 8, ["disabled", "style"])])]),
					P("div", {
						title: _.value ? "Click to copy caption" : "AI caption controls are disabled",
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
							cursor: x.value ? "copy" : "default"
						}),
						onClick: ie
					}, R(y.value), 13, ca)
				], 2)) : z("", !0),
				g.value.lyrics ? (M(), F("div", {
					key: 6,
					style: L(p("#00BCD4", { emphasis: !1 }))
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
				} }, [P("span", null, "Lyrics")], -1), P("div", la, R(g.value.lyrics), 1)], 4)) : z("", !0),
				g.value.pipelineTabs.length ? (M(), F("div", {
					key: 7,
					style: L(p("#FF9800", {
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
					P("div", ua, [(M(!0), F(V, null, N(g.value.pipelineTabs, (e, t) => (M(), we(a, {
						key: e.label,
						type: "button",
						severity: "secondary",
						text: "",
						rounded: "",
						style: L({
							appearance: "none",
							border: i.value === t ? "1px solid #FF9800" : "1px solid var(--border-color, rgba(255,255,255,0.12))",
							borderRadius: "999px",
							background: i.value === t ? "#FF980033" : "rgba(127,127,127,0.12)",
							color: i.value === t ? "#FF9800" : "var(--fg-color, #ddd)",
							fontSize: "11px",
							padding: "4px 10px",
							cursor: "pointer",
							fontWeight: i.value === t ? "700" : "500",
							boxShadow: i.value === t ? "0 0 0 1px #FF980055 inset" : "none"
						}),
						onClick: (e) => i.value = t
					}, {
						default: De(() => [Ee(R(e.label), 1)]),
						_: 2
					}, 1032, ["style", "onClick"]))), 128))]),
					(M(!0), F(V, null, N(g.value.pipelineTabs, (e, t) => Ae((M(), F("div", {
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
					}, [P("span", da, R(t.label), 1), P("span", {
						style: {
							"font-size": "12px",
							color: "var(--fg-color, #ddd)",
							"word-break": "break-word",
							padding: "1px 3px",
							"border-radius": "3px",
							transition: "background 0.2s ease",
							cursor: "copy"
						},
						onClick: (e) => E(t.value, e.currentTarget)
					}, R(t.value), 9, fa)]))), 128))])), [[je, i.value === t]])), 128))
				], 4)) : z("", !0),
				g.value.modelGroups.length ? (M(), F("div", {
					key: 8,
					style: L(p("#9C27B0", {
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
				} }, " Model Branches ", -1), P("div", pa, [(M(!0), F(V, null, N(g.value.modelGroups, (e) => (M(), F("div", {
					key: `model-group-${e.key}`,
					style: L(w(T(e.key), !0))
				}, [
					P("div", ma, [P("div", { style: L({
						fontSize: "10px",
						fontWeight: "800",
						color: T(e.key),
						letterSpacing: "0.6px",
						textTransform: "uppercase"
					}) }, R(e.label), 5), P("span", { style: L({
						fontSize: "9px",
						fontWeight: "700",
						color: "#fff",
						background: f(T(e.key), .22),
						border: `1px solid ${f(T(e.key), .48)}`,
						borderRadius: "999px",
						padding: "2px 8px",
						letterSpacing: "0.4px",
						textTransform: "uppercase"
					}) }, R(e.loras?.length || 0) + " LoRA ", 5)]),
					P("div", ha, [t[15] ||= P("div", { style: {
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
						onClick: (t) => E(e.model, t.currentTarget)
					}, R(e.model || "-"), 9, ga)]),
					e.loras?.length ? (M(), F("div", _a, [t[16] ||= P("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.58)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, " LoRA Stack ", -1), P("div", va, [(M(!0), F(V, null, N(e.loras, (t, n) => (M(), F("div", {
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
						onClick: (e) => E(t, e.currentTarget)
					}, R(t), 9, ya))), 128))])])) : z("", !0)
				], 4))), 128))])], 4)) : z("", !0),
				(M(!0), F(V, null, N(S.value, (e) => (M(), F("div", {
					key: e.key,
					style: L(p(e.accent, { emphasis: e.emphasis }))
				}, [P("div", { style: L({
					fontSize: "11px",
					fontWeight: "600",
					color: e.accent,
					textTransform: "uppercase",
					letterSpacing: "0.5px",
					marginBottom: "10px"
				}) }, R(e.title), 5), P("div", ba, [(M(!0), F(V, null, N(e.fields, (t) => (M(), F(V, { key: `${e.key}-${t.label}` }, [P("div", {
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
					style: L(h()),
					title: "This field was forced by Majoor Gen Info Override"
				}, " override ", 4)) : z("", !0)], 8, xa), P("div", {
					title: `${t.label}: ${t.value}`,
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.95))",
						"word-break": "break-word",
						"white-space": "pre-wrap",
						cursor: "pointer"
					},
					onClick: (e) => E(t.value, e.currentTarget)
				}, R(t.value), 9, Sa)], 64))), 128))])], 4))), 128)),
				g.value.notesFields.length ? (M(), F("div", {
					key: 9,
					style: L(p("#4CAF50", { emphasis: !1 }))
				}, [t[18] ||= P("div", { style: {
					"font-size": "11px",
					"font-weight": "600",
					color: "#4CAF50",
					"text-transform": "uppercase",
					"letter-spacing": "0.5px",
					"margin-bottom": "10px"
				} }, " Notes ", -1), (M(!0), F(V, null, N(g.value.notesFields, (e) => (M(), F("div", {
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
					onClick: (t) => E(e.value, t.currentTarget)
				}, R(e.value), 9, Ca))), 128))], 4)) : z("", !0),
				(M(!0), F(V, null, N(g.value.customInfoBlocks, (e) => (M(), F("div", {
					key: `${e.title}-${e.content}`,
					style: L(p(e.color, { emphasis: !1 }))
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
					onClick: (t) => E(e.content, t.currentTarget)
				}, R(e.content), 9, wa)], 4))), 128)),
				g.value.ttsInstruction ? (M(), F("div", {
					key: 10,
					style: L(p("#26A69A", { emphasis: !1 }))
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
					onClick: t[2] ||= (e) => E(g.value.ttsInstruction, e.currentTarget)
				}, R(g.value.ttsInstruction), 1)], 4)) : z("", !0),
				g.value.seed !== null && g.value.seed !== void 0 && g.value.seed !== "" ? (M(), F("div", {
					key: 11,
					style: L(m())
				}, [t[20] ||= P("div", { style: {
					"font-size": "11px",
					"font-weight": "700",
					color: "#E91E63",
					"text-transform": "uppercase",
					"letter-spacing": "1px"
				} }, " SEED ", -1), P("div", {
					title: `Click to copy seed: ${g.value.seed}`,
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
					onClick: t[3] ||= (e) => E(g.value.seed, e.currentTarget, "rgba(76, 175, 80, 0.4)")
				}, R(g.value.seed), 9, Ta)], 4)) : z("", !0),
				g.value.inputFiles.length ? (M(), F("div", {
					key: 12,
					style: L(p("#4CAF50", {
						emphasis: !0,
						startAlpha: .16,
						endAlpha: .1
					}))
				}, [P("div", {
					title: Ke(n)("tooltip.generationInputs", "Input files used in generation"),
					style: {
						"font-size": "11px",
						"font-weight": "600",
						color: "#4CAF50",
						"text-transform": "uppercase",
						"letter-spacing": "0.5px",
						"margin-bottom": "8px"
					}
				}, " Source Files ", 8, Ea), P("div", Da, [(M(!0), F(V, null, N(g.value.inputFiles, (e) => (M(), we(Vi, {
					key: e.id,
					"input-file": e
				}, null, 8, ["input-file"]))), 128))])], 4)) : z("", !0)
			]));
		};
	}
}, ka = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, Aa = /^[0-9a-f]{20,}$/i;
function ja(...e) {
	for (let t of e) {
		let e = String(t || "").trim();
		if (e) return e;
	}
	return "";
}
function Ma(e) {
	let t = String(e || "").trim();
	return !!t && (ka.test(t) || Aa.test(t));
}
function Na(e) {
	return String(e?.type || e?.class_type || e?.comfyClass || e?.classType || "").trim();
}
function Pa(e) {
	return ja(e?.properties?.subgraph_name, e?.title, e?.properties?.title, e?.properties?.name, e?.properties?.label, e?.name, e?.subgraph?.name, e?.subgraph_instance?.name);
}
function Fa(e) {
	let t = Na(e), n = Pa(e);
	return n && (!t || Ma(t) || n !== t) ? n : t && !Ma(t) ? t : n || (t ? "Subgraph" : String(e?.id || "Node").trim() || "Node");
}
function Ia(e) {
	let t = Na(e);
	return t && !Ma(t) ? t : t ? "Subgraph" : "Node";
}
//#endregion
//#region ui/components/sidebar/utils/minimap.ts
var La = 6, Ra = 1, za = 8, Ba = 74, Va = 42, Ha = [
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
], Ua = (e, t, n) => {
	let r = Number(e);
	return Number.isFinite(r) ? Math.max(t, Math.min(n, r)) : t;
}, Wa = (e, t = !1) => {
	let n = String(e || "").toUpperCase();
	return n.includes("IMAGE") ? "rgba(145,198,99,0.9)" : n.includes("LATENT") ? "rgba(89,178,118,0.9)" : n.includes("MODEL") ? "rgba(112,155,255,0.9)" : n.includes("CONDITIONING") ? "rgba(191,123,226,0.9)" : n.includes("CLIP") ? "rgba(220,178,77,0.9)" : n.includes("VAE") ? "rgba(72,184,214,0.9)" : n.includes("MASK") ? "rgba(190,190,190,0.88)" : n.includes("STRING") || n.includes("TEXT") ? "rgba(230,230,230,0.86)" : n.includes("INT") || n.includes("FLOAT") || n.includes("NUMBER") ? "rgba(130,210,220,0.88)" : t ? "rgba(170,220,255,0.82)" : "rgba(255,255,255,0.72)";
}, Ga = (e, t, n) => {
	let r = String(t || "").replace(/\s+/g, " ").trim(), i = Math.max(1, Number(n) || 1);
	if (!r || e.measureText(r).width <= i) return r;
	let a = r;
	for (; a.length > 3 && e.measureText(`${a}...`).width > i;) a = a.slice(0, -1);
	return a.length > 3 ? `${a}...` : r.slice(0, 3);
};
function Ka(e, t, n = null) {
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
	}, a = qa(t), o = Array.isArray(a?.nodes) ? a.nodes : [], s = Array.isArray(a?.groups) && a.groups || Array.isArray(a?.extra?.groups) && a.extra.groups || Array.isArray(a?.extra?.groupNodes) && a.extra.groupNodes || Array.isArray(a?.extra?.group_nodes) && a.extra.group_nodes || [], c = Array.isArray(a?.links) && a.links || Array.isArray(a?.extra?.links) && a.extra.links || [], l = Math.max(1, e.clientWidth || e.width || 1), u = Math.max(1, e.clientHeight || e.height || 1);
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
		for (let [e, t] of Ha) if (n.includes(e)) return t;
		let r = 0;
		for (let e = 0; e < n.length; e += 1) r = r * 31 + n.charCodeAt(e) | 0;
		return `hsl(${Math.abs(r) % 360} 42% 42%)`;
	}, p = (e) => {
		let t = [], n = e?.inputs && typeof e.inputs == "object" && !Array.isArray(e.inputs) ? e.inputs : null;
		if (n) {
			for (let [e, r] of Object.entries(n)) if (!(Array.isArray(r) || r && typeof r == "object") && (t.push([e, r]), t.length >= 3)) return t;
		}
		let r = Array.isArray(e?.widgets_values) ? e.widgets_values : [], i = Array.isArray(e?.widgets) ? e.widgets : [], a = Array.isArray(e?.inputs) ? e.inputs : [], o = a.filter((e) => e?.widget === !0 || e?.widget && typeof e.widget == "object" || typeof e?.widget == "string" && e.widget.trim()), s = a.filter((e) => e?.link == null && to(e?.type)), c = (o.length ? o : s.length ? s : a).map((e) => String(e?.label || e?.localized_name || e?.name || e?.widget?.name || e?.widget?.label || "").trim());
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
		let d = Number(e?.mode), v = d === 2 || d === 4, y = a?.extra?.errors || a?.extra?.node_errors || null, b = !!(y && typeof y == "object" && n && y[n] || e?.error || e?.errors || e?.flags?.error || e?.properties?.error), x = f(e), S = Array.isArray(e?.inputs) ? e.inputs : [], C = Array.isArray(e?.outputs) ? e.outputs : [];
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
			outputs: C,
			inputCount: S.length || (e?.inputs && typeof e.inputs == "object" ? Object.keys(e.inputs).length : 0),
			outputCount: C.length,
			label: Fa(e).replace(/\s+/g, " ").trim()
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
	let S = Math.max(1, b - v), C = Math.max(1, x - y), w = v + S / 2, T = y + C / 2, E = i.view && typeof i.view == "object" ? i.view : Object.create(null), ee = Ua(E.zoom ?? 1, Ra, za), D = Math.max(1, S / ee), te = Math.max(1, C / ee), ne = D / 2, re = te / 2, ie = D >= S ? w : Ua(E.centerX ?? w, v + ne, b - ne), ae = te >= C ? T : Ua(E.centerY ?? T, y + re, x - re), oe = ie - ne, se = ae - re, O = La, k = Math.min((l - O * 2) / D, (u - O * 2) / te), le = E.hoveredNodeId !== null && E.hoveredNodeId !== void 0 ? String(E.hoveredNodeId) : null;
	r.clearRect(0, 0, l, u), r.fillStyle = "rgba(0,0,0,0.22)", r.fillRect(0, 0, l, u);
	let ue = (e, t) => ({
		x: O + (e - oe) * k,
		y: O + (t - se) * k
	}), de = (e, t) => ({
		x: Ua(oe + (Number(e) - O) / k, v, b),
		y: Ua(se + (Number(t) - O) / k, y, x)
	}), fe = (e) => ({
		x: O + (e.x - oe) * k,
		y: O + (e.y - se) * k,
		w: Math.max(1, e.w * k),
		h: Math.max(1, e.h * k)
	}), pe = (e) => Math.max(10, Math.min(24, Math.floor(Number(e) * .2))), me = (e, t, n) => {
		let r = fe(e), i = pe(r.h), a = n === "output" ? e.outputs : e.inputs, o = Math.max(1, Array.isArray(a) ? a.length : Number(e[`${n}Count`]) || 0), s = Ua(t, 0, Math.max(0, o - 1));
		return r.y + i + (r.h - i) * (s + 1) / (o + 1);
	}, he = (e) => Array.isArray(e) && e.length >= 5 ? {
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
	} : null, ge = (e) => {
		let t = String(e || "").toUpperCase();
		return t.includes("IMAGE") ? "rgba(145,198,99,0.38)" : t.includes("LATENT") ? "rgba(89,178,118,0.38)" : t.includes("MODEL") ? "rgba(112,155,255,0.38)" : t.includes("CONDITIONING") ? "rgba(191,123,226,0.38)" : t.includes("CLIP") ? "rgba(220,178,77,0.38)" : t.includes("VAE") ? "rgba(72,184,214,0.38)" : t.includes("MASK") ? "rgba(190,190,190,0.36)" : "rgba(255,255,255,0.2)";
	}, _e = () => {
		if (i.showLinks && !(!c || c.length === 0)) {
			r.save(), r.globalAlpha = 1, r.lineWidth = 1;
			for (let e of c) {
				let t = he(e), n = t?.originId, i = t?.targetId;
				if (n === null || i === null) continue;
				let a = h.get(String(n)), o = h.get(String(i));
				if (!a || !o) continue;
				let s = fe(a), c = fe(o), l = {
					x: s.x + s.w,
					y: me(a, t?.originSlot ?? 0, "output")
				}, u = {
					x: c.x,
					y: me(o, t?.targetSlot ?? 0, "input")
				}, d = Math.max(12, Math.min(80, Math.abs(u.x - l.x) * .35));
				r.strokeStyle = ge(t?.type), r.beginPath(), r.moveTo(l.x, l.y), r.bezierCurveTo(l.x + d, l.y, u.x - d, u.y, u.x, u.y), r.stroke();
			}
			r.restore();
		}
	}, ve = (e) => {
		let { x: t, y: n, w: a, h: o } = fe(e), s = e.kind === "node", c = e.kind === "group", l = !!e.bypassed, u = !!e.errored, f = c ? .18 : l && i.renderBypassState ? .14 : .62, p = c ? .55 : l && i.renderBypassState ? .32 : .8, m = d(e.fill, f), h = d(e.stroke, p), g = s && i.showNodeLabels && a >= Ba && o >= Va, _ = Math.max(2, Math.min(g ? 7 : 8, Math.floor(Math.min(a, o) * .08))), v = s ? pe(o) : 0;
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
				let n = me(e, i, "input");
				r.fillStyle = Wa(e.inputs?.[i]?.type, !1), r.beginPath(), r.arc(t, n, g ? 3 : 2.2, 0, Math.PI * 2), r.fill(), r.stroke();
			}
			for (let n = 0; n < i; n += 1) {
				let i = me(e, n, "output");
				r.fillStyle = Wa(e.outputs?.[n]?.type, !0), r.beginPath(), r.arc(t + a, i, g ? 3 : 2.2, 0, Math.PI * 2), r.fill(), r.stroke();
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
				s && r.fillText(Ga(r, s, i), t + 7, me(e, a, "input") + n * .35, i);
			}
			for (let o = 0; o < Math.min(8, e.outputs?.length || 0); o += 1) {
				let s = e.outputs[o], c = String(s?.label || s?.localized_name || s?.name || "").trim();
				if (!c) continue;
				let l = Ga(r, c, i);
				r.fillText(l, t + a - 7 - Math.min(i, r.measureText(l).width), me(e, o, "output") + n * .35, i);
			}
			r.restore();
		}
	};
	for (let e of m.filter((e) => e.kind === "group")) ve(e);
	_e();
	for (let e of m.filter((e) => e.kind === "node")) ve(e);
	if (i.showViewport) try {
		let e = ce();
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
			centerX: ie,
			centerY: ae,
			visibleW: D,
			visibleH: te,
			viewMinX: oe,
			viewMinY: se,
			pad: O,
			renderScale: k
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
function qa(e) {
	if (!e || typeof e != "object") return e;
	let t = Array.isArray(e.nodes) ? e.nodes.filter(Boolean) : [], n = Ja(e);
	if (!t.length) return e;
	let r = [], i = Array.isArray(e.links) ? [...e.links] : [], a = [...Array.isArray(e.groups) ? e.groups : [], ...Array.isArray(e.extra?.groups) ? e.extra.groups : []];
	for (let e of t) {
		r.push(e);
		let t = Ya(e, n);
		if (!t || !Array.isArray(t.nodes) || !t.nodes.length) continue;
		let o = Za(e, qa(t));
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
function Ja(e) {
	let t = [
		...Array.isArray(e?.definitions?.subgraphs) ? e.definitions.subgraphs : [],
		...Array.isArray(e?.subgraphs) ? e.subgraphs : [],
		...Array.isArray(e?.rootGraph?.subgraphs) ? e.rootGraph.subgraphs : []
	], n = /* @__PURE__ */ new Map();
	for (let e of t) for (let t of Xa(e)) t != null && n.set(String(t), e);
	return n;
}
function Ya(e, t) {
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
function Xa(e) {
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
function Za(e, t) {
	let n = String(e?.id ?? e?.ID ?? ""), r = $a(e?.pos) || [0, 0], i = eo(e?.size) || [260, 180], a = t.nodes.filter(Boolean), o = Qa(a), s = Math.min(22, Math.max(8, i[0] * .08)), c = Math.min(34, Math.max(18, i[1] * .18)), l = Math.min(18, Math.max(8, i[1] * .08)), u = Math.max(40, i[0] - s * 2), d = Math.max(34, i[1] - c - l), f = Math.min(1, u / o.width, d / o.height), p = r[0] + s + (u - o.width * f) / 2, m = r[1] + c + (d - o.height * f) / 2, h = a.map((r) => {
		let i = $a(r?.pos) || [o.minX, o.minY], a = eo(r?.size) || [140, 60];
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
function Qa(e) {
	let t = Infinity, n = Infinity, r = -Infinity, i = -Infinity;
	for (let a of e) {
		let e = $a(a?.pos);
		if (!e) continue;
		let o = eo(a?.size) || [140, 60];
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
function $a(e) {
	if (Array.isArray(e) && e.length >= 2) return [Number(e[0]), Number(e[1])];
	if (e && typeof e == "object") {
		let t = e[0] ?? e[0] ?? e.x ?? e.left ?? null, n = e[1] ?? e[1] ?? e.y ?? e.top ?? null;
		if (t !== null && n !== null) return [Number(t), Number(n)];
	}
	return null;
}
function eo(e) {
	if (Array.isArray(e) && e.length >= 2) return [Number(e[0]), Number(e[1])];
	if (e && typeof e == "object") {
		let t = e[0] ?? e[0] ?? e.w ?? e.width ?? null, n = e[1] ?? e[1] ?? e.h ?? e.height ?? null;
		if (t !== null && n !== null) return [Number(t), Number(n)];
	}
	return null;
}
function to(e) {
	if (Array.isArray(e)) return !0;
	let t = String(e || "").trim().toUpperCase();
	return t === "INT" || t === "FLOAT" || t === "STRING" || t === "BOOLEAN" || t === "BOOL" || t === "COMBO" || t === "ENUM";
}
function no(e, t = null) {
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
var ro = {
	key: 0,
	class: "mjr-sidebar-section",
	style: {
		background: "var(--comfy-menu-bg, rgba(0,0,0,0.2))",
		border: "1px solid var(--border-color, rgba(255,255,255,0.14))",
		"border-radius": "8px",
		padding: "12px",
		"min-width": "300px"
	}
}, io = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "8px",
	"margin-bottom": "10px"
} }, ao = { style: {
	padding: "4px 9px",
	"border-radius": "999px",
	background: "rgba(33,150,243,0.14)",
	border: "1px solid rgba(33,150,243,0.30)",
	"font-size": "11px",
	"font-weight": "700",
	color: "#90CAF9",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, oo = {
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
}, so = { style: {
	display: "grid",
	"grid-template-columns": "repeat(3, minmax(0, 1fr))",
	gap: "8px",
	"margin-bottom": "12px"
} }, co = { style: {
	padding: "8px 10px",
	"border-radius": "10px",
	background: "rgba(255,255,255,0.04)",
	border: "1px solid rgba(255,255,255,0.10)"
} }, lo = { style: {
	"font-size": "18px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.94)",
	"margin-top": "2px"
} }, uo = { style: {
	padding: "8px 10px",
	"border-radius": "10px",
	background: "rgba(255,255,255,0.04)",
	border: "1px solid rgba(255,255,255,0.10)"
} }, fo = { style: {
	"font-size": "18px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.94)",
	"margin-top": "2px"
} }, po = { style: {
	padding: "8px 10px",
	"border-radius": "10px",
	background: "rgba(255,255,255,0.04)",
	border: "1px solid rgba(255,255,255,0.10)"
} }, mo = { style: {
	"font-size": "18px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.94)",
	"margin-top": "2px"
} }, ho = {
	key: 0,
	class: "mjr-workflow-tree-wrap"
}, go = { class: "mjr-workflow-tree-node" }, _o = { class: "mjr-workflow-tree-node-name" }, vo = {
	key: 0,
	class: "mjr-workflow-tree-node-type"
}, yo = { class: "mjr-menu-item-hint" }, bo = {
	key: 0,
	class: "mjr-section-hint"
}, xo = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px",
	"margin-top": "8px"
} }, So = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "6px",
	"align-items": "center"
} }, Co = {
	key: 1,
	style: {
		display: "grid",
		"grid-template-columns": "repeat(auto-fit, minmax(180px, 1fr))",
		gap: "8px",
		"align-items": "stretch",
		"margin-top": "10px",
		"margin-bottom": "10px"
	}
}, wo = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "2px",
	"min-width": "0"
} }, To = { style: {
	"font-size": "13px",
	"font-weight": "600"
} }, Eo = { style: {
	"font-size": "11px",
	color: "rgba(255,255,255,0.58)"
} }, Do = { style: {
	display: "flex",
	gap: "10px",
	"align-items": "stretch",
	"margin-top": "10px"
} }, Oo = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	gap: "10px",
	"margin-top": "8px",
	"font-size": "11px",
	color: "rgba(255,255,255,0.58)"
} }, ko = ["open"], Ao = { style: {
	background: "rgba(0,0,0,0.5)",
	padding: "10px",
	"border-radius": "6px",
	"font-size": "11px",
	overflow: "auto",
	"max-height": "180px",
	margin: "10px 0 0 0",
	color: "#90CAF9",
	"font-family": "'Consolas', 'Monaco', monospace"
} }, jo = 1, Mo = 8, No = 250, Po = {
	__name: "SidebarWorkflowSection",
	props: { asset: {
		type: Object,
		required: !0
	} },
	setup(t) {
		let r = t, i = Object.freeze({
			nodeColors: !0,
			showLinks: !0,
			showGroups: !0,
			renderBypassState: !0,
			renderErrorState: !0,
			showViewport: !0,
			showNodeLabels: !1,
			size: "comfortable"
		}), a = Object.freeze({
			zoom: 1,
			centerX: null,
			centerY: null,
			hoveredNodeId: null
		}), o = Object.freeze([
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
		]), s = I(null), c = I(!1), l = I(!1), u = I(w()), d = I({ ...a }), f = I("crosshair"), p = I(""), m = null, h = null, g = null;
		function _(e, t, n) {
			let r = Number(e);
			return Number.isFinite(r) ? Math.max(t, Math.min(n, r)) : t;
		}
		function v(e) {
			!e || typeof e != "object" || (d.value = {
				...d.value,
				zoom: _(e.zoom ?? d.value.zoom, jo, Mo),
				centerX: Number.isFinite(Number(e.centerX)) ? Number(e.centerX) : null,
				centerY: Number.isFinite(Number(e.centerY)) ? Number(e.centerY) : null
			});
		}
		function y() {
			d.value = { ...a }, p.value = "";
		}
		function b(e) {
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
		function x(e) {
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
		function S(e) {
			let t = b(e), n = e?.workflow || e?.Workflow || e?.comfy_workflow || t?.workflow || t?.Workflow || t?.comfy_workflow || null;
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
		function C(e) {
			let t = b(e), n = e?.prompt || e?.Prompt || t?.prompt || t?.Prompt || null;
			if (!n) return null;
			if (typeof n == "object") return x(n) ? n : null;
			if (typeof n == "string") {
				let e = n.trim();
				if (!e) return null;
				try {
					let t = JSON.parse(e);
					return x(t) ? t : null;
				} catch {
					return null;
				}
			}
			return null;
		}
		function w() {
			try {
				let e = K?.()?.workflowMinimap;
				if (e && typeof e == "object") return {
					...i,
					...e
				};
			} catch (e) {
				console.debug?.(e);
			}
			try {
				let t = localStorage?.getItem?.(e);
				if (!t) return { ...i };
				let n = JSON.parse(t);
				if (!n || typeof n != "object") return { ...i };
				let r = {
					...i,
					...n
				};
				try {
					let t = K();
					t.workflowMinimap = {
						...t.workflowMinimap,
						...r
					}, q(t), localStorage?.removeItem?.(e);
				} catch (e) {
					console.debug?.(e);
				}
				return r;
			} catch {
				return { ...i };
			}
		}
		function T(e) {
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
		let E = B(() => {
			let e = S(r.asset), t = C(r.asset);
			return !e && !t ? null : e || no(t);
		}), ee = B(() => r.asset?.has_generation_data ? "Complete" : "Partial"), D = B(() => E.value ? JSON.stringify(E.value, null, 2) : "");
		function te(e, t) {
			let n = e?.id ?? e?.key ?? t + 1;
			return String(e?.title || e?._meta?.title || e?.type || e?.class_type || e?.name || `Node ${n}`);
		}
		function ne(e) {
			return String(e?.type || e?.class_type || e?.name || "").trim();
		}
		let re = B(() => (Array.isArray(E.value?.nodes) ? E.value.nodes : []).slice(0, No).map((e, t) => {
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
		}), oe = B(() => {
			let e = String(u.value?.size || "comfortable");
			return o.find((t) => t.key === e) || o[1];
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
		function O() {
			let e = s.value, t = E.value;
			if (!e || !t) return;
			let n = Math.max(1, e.clientWidth || 320), r = Math.max(1, e.clientHeight || 120), i = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
			e.width = Math.floor(n * i), e.height = Math.floor(r * i);
			let a = e.getContext("2d");
			a && a.setTransform(i, 0, 0, i, 0, 0), h = Ka(e, t, {
				...u.value,
				view: d.value
			}) || null, v(h?.resolvedView);
		}
		function k(e) {
			pe(e);
		}
		function le(e) {
			let t = s.value;
			if (!t) return null;
			let n = t.getBoundingClientRect?.();
			return n ? {
				x: Number(e?.clientX) - n.left,
				y: Number(e?.clientY) - n.top
			} : null;
		}
		function ue(e) {
			let t = le(e);
			return !t || !h?.canvasToWorld ? null : {
				local: t,
				world: h.canvasToWorld(t.x, t.y)
			};
		}
		function de(e) {
			let t = le(e), n = t && h?.hitTestNode ? h.hitTestNode(t.x, t.y) : null, r = n?.id !== null && n?.id !== void 0 ? String(n.id) : null, i = d.value.hoveredNodeId !== null && d.value.hoveredNodeId !== void 0 ? String(d.value.hoveredNodeId) : null;
			p.value = n?.label || "", r !== i && (d.value = {
				...d.value,
				hoveredNodeId: r
			}, O());
		}
		function fe(e) {
			e && (k(e), d.value = {
				...d.value,
				centerX: Number(e.x),
				centerY: Number(e.y)
			}, O());
		}
		function me(e) {
			if (Number(e?.button ?? 0) !== 0) return;
			let t = ue(e);
			t && (g = e.pointerId ?? 1, f.value = "grabbing", s.value?.setPointerCapture?.(g), fe(t.world), de(e), e.preventDefault?.(), e.stopPropagation?.());
		}
		function he(e) {
			if (g !== null && e.pointerId === g) {
				let t = ue(e);
				t && fe(t.world), e.preventDefault?.(), e.stopPropagation?.();
				return;
			}
			de(e);
		}
		function ge(e) {
			g !== null && e?.pointerId === g && (s.value?.releasePointerCapture?.(g), g = null, f.value = "crosshair"), e?.type === "pointerleave" && (p.value = "", d.value.hoveredNodeId !== null && (d.value = {
				...d.value,
				hoveredNodeId: null
			}, O()));
		}
		function _e(e) {
			let t = ue(e), n = h?.resolvedView;
			if (!t || !n) return;
			let r = _(Number(e?.deltaY) || 0, -240, 240), i = Math.exp(-r * .0025), a = _((Number(d.value.zoom) || 1) * i, jo, Mo);
			if (Math.abs(a - (Number(d.value.zoom) || 1)) < .001) {
				e.preventDefault?.(), e.stopPropagation?.();
				return;
			}
			let o = Math.max(1, Number(h?.bounds?.width || 1) / a), s = Math.max(1, Number(h?.bounds?.height || 1) / a), c = _((Number(t.world.x) - Number(n.viewMinX || 0)) / Math.max(1, Number(n.visibleW || 1)), 0, 1), l = _((Number(t.world.y) - Number(n.viewMinY || 0)) / Math.max(1, Number(n.visibleH || 1)), 0, 1);
			d.value = {
				...d.value,
				zoom: a,
				centerX: Number(t.world.x) + (.5 - c) * o,
				centerY: Number(t.world.y) + (.5 - l) * s
			}, O(), de(e), e.preventDefault?.(), e.stopPropagation?.();
		}
		function ve(e) {
			let t = ue(e);
			y(), t && k(t.world), O(), e.preventDefault?.(), e.stopPropagation?.();
		}
		function ye(e) {
			u.value = {
				...u.value,
				[e]: !u.value?.[e]
			}, T(u.value);
		}
		function be(e) {
			o.some((t) => t.key === e) && (u.value = {
				...u.value,
				size: e
			}, T(u.value));
		}
		return ke(() => {
			s.value && typeof ResizeObserver == "function" && (m = new ResizeObserver(() => O()), m.observe(s.value)), O();
		}), Ce(E, () => {
			y(), O();
		}, { flush: "post" }), Ce(u, () => {
			O();
		}, {
			deep: !0,
			flush: "post"
		}), Ce(c, () => {
			O();
		}, { flush: "post" }), Oe(() => {
			try {
				m?.disconnect?.();
			} catch (e) {
				console.debug?.(e);
			}
			m = null, g = null;
		}), (e, t) => {
			let r = Ze("MTree"), i = Ze("MButton");
			return E.value ? (M(), F("div", ro, [
				t[8] ||= P("div", { style: {
					"font-size": "13px",
					"font-weight": "600",
					color: "var(--fg-color, #eaeaea)",
					"margin-bottom": "12px",
					"text-transform": "uppercase",
					"letter-spacing": "0.5px"
				} }, " ComfyUI Workflow ", -1),
				P("div", io, [P("div", ao, R(ee.value), 1), ae.value.source ? (M(), F("div", oo, R(ae.value.source), 1)) : z("", !0)]),
				P("div", so, [
					P("div", co, [t[2] ||= P("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Nodes", -1), P("div", lo, R(ae.value.nodes), 1)]),
					P("div", uo, [t[3] ||= P("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Links", -1), P("div", fo, R(ae.value.links), 1)]),
					P("div", po, [t[4] ||= P("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Groups", -1), P("div", mo, R(ae.value.groups), 1)])
				]),
				re.value.length ? (M(), F("div", ho, [
					t[5] ||= P("div", { class: "mjr-section-title" }, " Workflow Nodes ", -1),
					Te(r, {
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
						default: De(({ node: e }) => [P("span", go, [
							P("span", _o, R(e.label), 1),
							e.data?.type ? (M(), F("span", vo, R(e.data.type), 1)) : z("", !0),
							P("span", yo, "#" + R(e.data?.id), 1)
						])]),
						_: 1
					}, 8, ["value"]),
					ie.value ? (M(), F("div", bo, " +" + R(ie.value) + " more nodes ", 1)) : z("", !0)
				])) : z("", !0),
				P("div", xo, [P("div", So, [(M(!0), F(V, null, N(Ke(o), (e) => (M(), we(i, {
					key: e.key,
					type: "button",
					severity: "secondary",
					text: "",
					rounded: "",
					title: `${e.label} minimap`,
					style: L({
						appearance: "none",
						border: u.value.size === e.key ? "1px solid rgba(33,150,243,0.55)" : "1px solid rgba(255,255,255,0.12)",
						borderRadius: "999px",
						padding: "4px 10px",
						background: u.value.size === e.key ? "rgba(33,150,243,0.18)" : "rgba(255,255,255,0.04)",
						color: u.value.size === e.key ? "#90CAF9" : "rgba(255,255,255,0.78)",
						fontSize: "11px",
						fontWeight: u.value.size === e.key ? "700" : "600",
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
				]))), 128))]), Te(i, {
					type: "button",
					class: "mjr-btn mjr-icon-btn",
					severity: "secondary",
					text: "",
					rounded: "",
					title: Ke(n)("tooltip.minimapSettings", "Minimap settings"),
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
					onClick: t[0] ||= (e) => c.value = !c.value
				}, {
					default: De(() => [...t[6] ||= [P("i", { class: "pi pi-sliders-h" }, null, -1)]]),
					_: 1
				}, 8, ["title"])]),
				c.value ? (M(), F("div", Co, [(M(!0), F(V, null, N(ce.value, (e) => (M(), we(i, {
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
						border: u.value?.[e.key] ? "1px solid rgba(76,175,80,0.40)" : "1px solid rgba(255,255,255,0.12)",
						background: u.value?.[e.key] ? "rgba(76,175,80,0.10)" : "rgba(255,255,255,0.04)",
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
							background: u.value?.[e.key] ? "rgba(76,175,80,0.95)" : "rgba(255,255,255,0.08)",
							border: u.value?.[e.key] ? "1px solid rgba(76,175,80,0.35)" : "1px solid rgba(255,255,255,0.12)",
							flex: "0 0 auto"
						}) }, [P("i", {
							class: "pi pi-check",
							style: L({
								fontSize: "12px",
								opacity: u.value?.[e.key] ? "1" : "0"
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
						P("div", wo, [P("div", To, R(e.label), 1), P("div", Eo, R(u.value?.[e.key] ? "On" : "Off"), 1)])
					]),
					_: 2
				}, 1032, ["style", "onClick"]))), 128))])) : z("", !0),
				P("div", Do, [P("canvas", {
					ref_key: "canvasRef",
					ref: s,
					style: L({
						width: "100%",
						height: se.value,
						cursor: f.value,
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
				P("div", Oo, [P("span", null, R(p.value || "Click/drag to navigate · wheel to zoom"), 1), P("span", null, R(Math.round((d.value.zoom || 1) * 100)) + "% · " + R(oe.value.label), 1)]),
				P("details", {
					open: l.value,
					style: { "margin-top": "10px" },
					onToggle: t[1] ||= (e) => l.value = e.target.open
				}, [t[7] ||= P("summary", { style: {
					cursor: "pointer",
					color: "var(--mjr-muted, rgba(255,255,255,0.65))",
					"font-size": "12px",
					"user-select": "none"
				} }, " Show raw JSON ", -1), P("pre", Ao, R(D.value), 1)], 40, ko)
			])) : z("", !0);
		};
	}
};
//#endregion
export { zr as A, Xn as B, Pr as C, Nr as D, Br as E, pr as F, q as G, Zt as H, Cr as I, st as J, vt as K, xr as L, wr as M, sr as N, Rr as O, mr as P, or as R, Wr as S, Fr as T, J as U, Yn as V, K as W, Kr as _, Na as a, Vr as b, Fi as c, li as d, ci as f, Xr as g, ai as h, Fa as i, Dr as j, Lr as k, mi as l, ii as m, Ka as n, Ia as o, $r as p, yt as q, no as r, Oa as s, Po as t, si as u, qr as v, Er as w, Gr as x, Jr as y, ar as z };
