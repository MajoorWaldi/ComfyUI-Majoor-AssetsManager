import { $ as e, A as t, C as n, D as r, E as i, Et as a, F as o, J as s, K as c, N as l, O as u, P as d, Q as f, S as p, T as m, Tt as h, X as g, Y as _, Z as v, _t as y, ct as b, dt as x, et as ee, f as S, gt as C, j as w, k as T, mt as te, nt as ne, ot as re, q as ie, rt as ae, st as oe, tt as se, ut as ce, vt as le, w as E, y as D } from "./client-DTWulbWC.js";
import { C as ue, D as de, L as fe, T as pe, a as me, c as he, i as ge, l as O, m as _e, n as k, o as ve, r as ye, rt as be, s as xe, t as A, u as Se, x as Ce, y as we } from "./config-eqarUfKd.js";
import { B as Te, C as Ee, D as De, E as Oe, F as j, H as ke, L as M, M as Ae, N as je, S as N, T as P, U as Me, Z as F, _ as Ne, a as Pe, at as I, c as Fe, d as Ie, f as Le, g as Re, h as ze, i as Be, it as Ve, l as He, m as Ue, n as We, o as Ge, ot as L, p as Ke, r as qe, rt as R, s as Je, t as Ye, u as Xe, v as Ze, w as z, x as B, y as V, z as Qe } from "./mjr-primevue-DeVPqKdl.js";
import { n as $e, r as et, t as tt } from "./mjr-vue-vendor--o0qJuos.js";
import { a as nt, i as rt, n as it, o as at, r as ot, t as st } from "./geninfoParser-5vKgjqjD.js";
//#region ui/utils/events.ts
function ct(e, t, { target: n = null, warnPrefix: r = "[Majoor]" } = {}) {
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
}, lt = (e, t, n) => {
	let r = typeof e == "string" ? e.trim() : String(e ?? "");
	return t.includes(r) ? r : n;
}, ut = (e) => e === "__proto__" || e === "prototype" || e === "constructor", dt = (e, t) => {
	let n = { ...e };
	return !t || typeof t != "object" || Object.keys(t).forEach((r) => {
		if (ut(r)) return;
		let i = t[r];
		i && typeof i == "object" && !Array.isArray(i) ? n[r] = dt(e[r] || {}, i) : i !== void 0 && (n[r] = i);
	}), n;
}, ft = Object.freeze({
	small: 80,
	medium: 120,
	large: 180
}), pt = Object.freeze([
	"small",
	"medium",
	"large"
]), mt = (e, t) => Math.max(60, Math.min(600, Math.round(U(e, t)))), ht = (e = {}) => {
	let t = Number(e?.minSize);
	if (Number.isFinite(t)) return mt(t, k.GRID_MIN_SIZE);
	let n = lt(String(e?.minSizePreset || "").toLowerCase(), pt, "");
	return n ? ft[n] : mt(e?.minSize, k.GRID_MIN_SIZE);
}, gt = (e = {}) => mt(e?.minSize, k.FEED_GRID_MIN_SIZE), _t = (e) => {
	let t = Math.round(U(e, k.GRID_MIN_SIZE));
	return t <= 100 ? "small" : t >= 150 ? "large" : "medium";
}, vt = async (e, t = "Majoor", n = {}) => {
	let r = St();
	if (r && typeof r.alert == "function") try {
		await r.alert({
			title: String(t || "Majoor"),
			message: String(e || "")
		});
		return;
	} catch (e) {
		console.debug?.(e);
	}
	let i = Ct();
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
		let n = wt();
		if (n) try {
			n.show(Tt(e, t));
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
	let a = At();
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
		Pt(r);
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
				textContent: O("dialog.confirm", "Confirm"),
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
			r.show(i), setTimeout(() => Ft(r), 0);
		} catch {
			try {
				window.alert(e);
			} catch (e) {
				console.debug?.(e);
			}
			n();
		}
	});
}, yt = async (e, t = "Majoor") => {
	let n = St();
	if (n) try {
		let r = {
			title: String(t || O("dialog.confirm", "Confirm")),
			message: String(e || "")
		};
		return !!(typeof n.confirm == "function" && await n.confirm(r));
	} catch (e) {
		console.debug?.(e);
	}
	let r = At();
	if (!r) try {
		return window.confirm(e);
	} catch {
		return !1;
	}
	return new Promise((n) => {
		let i = new r();
		Pt(i);
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
				textContent: O("dialog.cancel", "Cancel"),
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
				textContent: O("dialog.confirm", "Confirm"),
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
			i.show(o), setTimeout(() => Ft(i), 0);
		} catch {
			try {
				n(!!window.confirm(e));
			} catch {
				n(!1);
			}
		}
	});
}, bt = async (e, t = "", n = "Majoor") => {
	let r = St();
	if (r) try {
		let i = {
			title: String(n || O("dialog.prompt", "Prompt")),
			message: String(e || ""),
			defaultValue: String(t ?? "")
		}, a = typeof r.prompt == "function" ? await r.prompt(i) : null;
		return a == null ? null : String(a);
	} catch (e) {
		console.debug?.(e);
	}
	let i = At();
	if (!i) try {
		return window.prompt(e, t);
	} catch {
		return null;
	}
	return new Promise((r) => {
		let a = new i();
		Pt(a);
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
				textContent: O("dialog.cancel", "Cancel"),
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
				textContent: O("dialog.ok", "OK"),
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
			a.show(c), setTimeout(() => Ft(a), 0), setTimeout(() => {
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
}, xt = () => {
	try {
		return pe()?.ui || null;
	} catch {
		return null;
	}
}, St = () => {
	let e = (e) => !!e && (typeof e.alert == "function" || typeof e.confirm == "function" || typeof e.prompt == "function");
	try {
		let t = Ce();
		if (e(t)) return t;
	} catch (e) {
		console.debug?.(e);
	}
	return null;
}, Ct = () => {
	try {
		let e = ue();
		if (e && typeof e.add == "function") return e;
	} catch (e) {
		console.debug?.(e);
	}
	return null;
}, wt = () => {
	try {
		let e = xt();
		if (e?.dialog && typeof e.dialog.show == "function") return e.dialog;
	} catch (e) {
		console.debug?.(e);
	}
	return null;
}, Tt = (e, t = "Majoor") => {
	let n = String(e ?? ""), r = String(t ?? "").trim();
	return !r || r.toLowerCase() === "majoor" ? n : `${r}<br><br>${n}`;
}, Et = new Set(/* @__PURE__ */ "abort.blur.change.click.close.contextmenu.dblclick.dragend.dragenter.dragleave.dragover.dragstart.drop.error.focus.input.keydown.keypress.keyup.load.mousedown.mouseenter.mouseleave.mousemove.mouseout.mouseover.mouseup.reset.resize.scroll.select.submit.touchcancel.touchend.touchmove.touchstart.transitionend.unload.wheel".split(".")), Dt = new Set([
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
]), Ot = new Set([
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
]), kt = (e, t = {}, n = []) => {
	let r = document.createElement(e);
	return Object.entries(t || {}).forEach(([e, t]) => {
		let n = String(e || "");
		if (!(!n || Dt.has(n))) {
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
					Et.has(e) && r.addEventListener(e, t);
				}
				return;
			}
			if (Ot.has(n)) try {
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
	let r = xt();
	if (r?.$el) try {
		return r.$el(e, t, n);
	} catch {}
	return kt(e, t, n);
}, At = () => xt()?.ComfyDialog || null, jt = 999999, Mt = 560, Nt = 12, Pt = (e) => {
	try {
		e.element.style.zIndex = String(jt), e.element.style.width = `${Mt}px`, e.element.style.padding = "0", e.element.style.backgroundColor = "var(--comfy-menu-bg, #131722)", e.element.style.border = "1px solid rgba(255,255,255,0.14)", e.element.style.borderRadius = `${Nt}px`, e.element.style.boxSizing = "border-box", e.element.style.overflow = "hidden", e.element.style.boxShadow = "0 18px 48px rgba(0,0,0,0.48)";
	} catch (e) {
		console.debug?.(e);
	}
}, Ft = (e) => {
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
		minSizePreset: "medium",
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
		let e = Se.get(a);
		if (!e) return { ...G };
		let t = JSON.parse(e), n = t && typeof t == "object" && Number.isInteger(t.version) && t.data && typeof t.data == "object";
		if (!n && !(t && typeof t == "object" && !Array.isArray(t))) return { ...G };
		if (n && Number(t.version) > 1) return console.warn("[Majoor] settings schema version is newer than this build, using defaults"), { ...G };
		let r = n ? t.data : t, i = new Set(/* @__PURE__ */ "debug.grid.infiniteScroll.siblings.autoScan.scan.watcher.status.viewer.rtHydrate.observability.feed.sidebar.probeBackend.i18n.paths.db.ratingTagsSync.cache.search.ai.executionGrouping.workflowMinimap.ui.security.safety".split(".")), o = {};
		if (r && typeof r == "object") for (let [e, t] of Object.entries(r)) i.has(e) && (o[e] = t);
		let s = dt(G, o);
		if (!n) try {
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
		let t = JSON.parse(JSON.stringify(e || {}));
		t?.security && typeof t.security == "object" && (t.security.apiToken = "");
		let n = {
			version: 1,
			data: t
		};
		if (!Se.set("mjrSettings", JSON.stringify(n))) throw Error("SettingsStore rejected the write");
	} catch (e) {
		console.warn("[Majoor] settings save failed", e);
		try {
			let e = Date.now();
			e - (Number(window?._mjrSettingsSaveFailAt || 0) || 0) > 3e4 && (window._mjrSettingsSaveFailAt = e, vt(O("dialog.settingsSaveFailed", "Majoor: Failed to save settings (browser storage full or blocked).")));
		} catch (e) {
			console.debug?.(e);
		}
		try {
			ct("mjr-settings-save-failed", { error: String(e?.message || e || "") }, { warnPrefix: "[Majoor]" });
		} catch (e) {
			console.debug?.(e);
		}
	}
}, J = (e) => {
	let t = Number(k.MAX_PAGE_SIZE) || 2e3;
	A.DEFAULT_PAGE_SIZE = Math.max(50, Math.min(t, Number(e.grid?.pageSize) || k.DEFAULT_PAGE_SIZE)), A.AUTO_SCAN_ON_STARTUP = !!e.autoScan?.onStartup, A.EXECUTION_GROUPING_ENABLED = !!(e.executionGrouping?.enabled ?? k.EXECUTION_GROUPING_ENABLED), A.STATUS_POLL_INTERVAL = Math.max(1e3, Number(e.status?.pollInterval) || k.STATUS_POLL_INTERVAL), A.DEBUG_SAFE_CALL = !!e.debug?.safeCall, A.DEBUG_SAFE_LISTENERS = !!e.debug?.safeListeners, A.DEBUG_VIEWER = !!e.debug?.viewer, A.GRID_MIN_SIZE = ht(e.grid), A.FEED_GRID_MIN_SIZE = gt(e.feed), A.GRID_GAP = Math.max(0, Math.min(40, Math.round(U(e.grid?.gap, k.GRID_GAP)))), A.GRID_SHOW_BADGES_EXTENSION = !!(e.grid?.showExtBadge ?? k.GRID_SHOW_BADGES_EXTENSION), A.GRID_SHOW_BADGES_RATING = !!(e.grid?.showRatingBadge ?? k.GRID_SHOW_BADGES_RATING), A.GRID_SHOW_BADGES_TAGS = !!(e.grid?.showTagsBadge ?? k.GRID_SHOW_BADGES_TAGS), A.GRID_SHOW_DETAILS = !!(e.grid?.showDetails ?? k.GRID_SHOW_DETAILS), A.GRID_SHOW_DETAILS_FILENAME = !!(e.grid?.showFilename ?? k.GRID_SHOW_DETAILS_FILENAME), A.GRID_SHOW_DETAILS_DATE = !!(e.grid?.showDate ?? k.GRID_SHOW_DETAILS_DATE), A.GRID_SHOW_DETAILS_DIMENSIONS = !!(e.grid?.showDimensions ?? k.GRID_SHOW_DETAILS_DIMENSIONS), A.GRID_SHOW_DETAILS_GENTIME = !!(e.grid?.showGenTime ?? k.GRID_SHOW_DETAILS_GENTIME), A.GRID_SHOW_HOVER_INFO = !!(e.grid?.showHoverInfo ?? k.GRID_SHOW_HOVER_INFO), A.GRID_SHOW_WORKFLOW_DOT = !!(e.grid?.showWorkflowDot ?? k.GRID_SHOW_WORKFLOW_DOT), A.FEED_SHOW_INFO = !!(e.feed?.showInfo ?? k.FEED_SHOW_INFO), A.FEED_SHOW_FILENAME = !!(e.feed?.showFilename ?? k.FEED_SHOW_FILENAME), A.FEED_SHOW_DIMENSIONS = !!(e.feed?.showDimensions ?? k.FEED_SHOW_DIMENSIONS), A.FEED_SHOW_DATE = !!(e.feed?.showDate ?? k.FEED_SHOW_DATE), A.FEED_SHOW_GENTIME = !!(e.feed?.showGenTime ?? k.FEED_SHOW_GENTIME), A.FEED_SHOW_WORKFLOW_DOT = !!(e.feed?.showWorkflowDot ?? k.FEED_SHOW_WORKFLOW_DOT), A.FEED_SHOW_BADGES_EXTENSION = !!(e.feed?.showExtBadge ?? k.FEED_SHOW_BADGES_EXTENSION), A.FEED_SHOW_BADGES_RATING = !!(e.feed?.showRatingBadge ?? k.FEED_SHOW_BADGES_RATING), A.FEED_SHOW_BADGES_TAGS = !!(e.feed?.showTagsBadge ?? k.FEED_SHOW_BADGES_TAGS);
	{
		let t = e.grid?.videoAutoplayMode ?? k.GRID_VIDEO_AUTOPLAY_MODE;
		t ??= e.grid?.videoHoverAutoplay === !1 ? "off" : "hover", t === !0 && (t = "hover"), t === !1 && (t = "off"), t !== "hover" && t !== "always" && t !== "off" && (t = "hover"), A.GRID_VIDEO_AUTOPLAY_MODE = t;
	}
	let n = (e, t) => {
		let n = String(e || "").trim();
		return /^[0-9a-fA-F]{6}$/.test(n) && (n = `#${n}`), /^#[0-9a-fA-F]{3,8}$/.test(n) ? n : t;
	};
	A.BADGE_STAR_COLOR = n(e.grid?.starColor, k.BADGE_STAR_COLOR), A.BADGE_IMAGE_COLOR = n(e.grid?.badgeImageColor, k.BADGE_IMAGE_COLOR), A.BADGE_VIDEO_COLOR = n(e.grid?.badgeVideoColor, k.BADGE_VIDEO_COLOR), A.BADGE_AUDIO_COLOR = n(e.grid?.badgeAudioColor, k.BADGE_AUDIO_COLOR), A.BADGE_MODEL3D_COLOR = n(e.grid?.badgeModel3dColor, k.BADGE_MODEL3D_COLOR), A.BADGE_DUPLICATE_ALERT_COLOR = n(e.grid?.badgeDuplicateAlertColor, k.BADGE_DUPLICATE_ALERT_COLOR), A.UI_CARD_HOVER_COLOR = n(e.ui?.cardHoverColor, k.UI_CARD_HOVER_COLOR), A.UI_CARD_SELECTION_COLOR = n(e.ui?.cardSelectionColor, k.UI_CARD_SELECTION_COLOR), A.UI_RATING_COLOR = n(e.ui?.ratingColor, k.UI_RATING_COLOR), A.UI_TAG_COLOR = n(e.ui?.tagColor, k.UI_TAG_COLOR);
	try {
		let e = Array.from(document.querySelectorAll(".mjr-assets-manager"));
		for (let t of e) t.style.setProperty("--mjr-star-active", A.BADGE_STAR_COLOR), t.style.setProperty("--mjr-badge-image", A.BADGE_IMAGE_COLOR), t.style.setProperty("--mjr-badge-video", A.BADGE_VIDEO_COLOR), t.style.setProperty("--mjr-badge-audio", A.BADGE_AUDIO_COLOR), t.style.setProperty("--mjr-badge-model3d", A.BADGE_MODEL3D_COLOR), t.style.setProperty("--mjr-badge-duplicate-alert", A.BADGE_DUPLICATE_ALERT_COLOR), t.style.setProperty("--mjr-card-hover-color", A.UI_CARD_HOVER_COLOR), t.style.setProperty("--mjr-card-selection-color", A.UI_CARD_SELECTION_COLOR), t.style.setProperty("--mjr-rating-color", A.UI_RATING_COLOR), t.style.setProperty("--mjr-tag-color", A.UI_TAG_COLOR);
	} catch (e) {
		console.debug?.(e);
	}
	A.INFINITE_SCROLL_ENABLED = !!e.infiniteScroll?.enabled, A.INFINITE_SCROLL_ROOT_MARGIN = String(e.infiniteScroll?.rootMargin || k.INFINITE_SCROLL_ROOT_MARGIN), A.INFINITE_SCROLL_THRESHOLD = Math.max(0, Math.min(1, U(e.infiniteScroll?.threshold, k.INFINITE_SCROLL_THRESHOLD))), A.BOTTOM_GAP_PX = Math.max(0, Math.min(5e3, Math.round(U(e.infiniteScroll?.bottomGapPx, k.BOTTOM_GAP_PX)))), A.VIEWER_ALLOW_PAN_AT_ZOOM_1 = !!e.viewer?.allowPanAtZoom1, A.VIEWER_DISABLE_WEBGL_VIDEO = !!e.viewer?.disableWebGL, A.VIEWER_PAUSE_DURING_EXECUTION = !!(e.viewer?.pauseDuringExecution ?? k.VIEWER_PAUSE_DURING_EXECUTION), A.FLOATING_VIEWER_PAUSE_DURING_EXECUTION = !!(e.viewer?.floatingPauseDuringExecution ?? k.FLOATING_VIEWER_PAUSE_DURING_EXECUTION), A.MFV_LIVE_DEFAULT = e.viewer?.mfvLiveDefault ?? k.MFV_LIVE_DEFAULT, A.MFV_PREVIEW_DEFAULT = e.viewer?.mfvPreviewDefault ?? k.MFV_PREVIEW_DEFAULT, A.MFV_LIVE_AUTO_OPEN = !1, A.MFV_PREVIEW_AUTO_OPEN = !1, A.MFV_NODE_STREAM_AUTO_OPEN = !1;
	{
		let t = String(e.viewer?.mfvPreviewMethod || k.MFV_PREVIEW_METHOD).toLowerCase();
		A.MFV_PREVIEW_METHOD = [
			"default",
			"auto",
			"latent2rgb",
			"taesd",
			"none"
		].includes(t) ? t : k.MFV_PREVIEW_METHOD;
	}
	{
		let t = String(e.viewer?.mfvSidebarPosition || "right").toLowerCase();
		A.MFV_SIDEBAR_POSITION = [
			"left",
			"right",
			"bottom"
		].includes(t) ? t : "right";
	}
	A.VIEWER_VIDEO_GRADE_THROTTLE_FPS = Math.max(1, Math.min(60, Math.round(U(e.viewer?.videoGradeThrottleFps, k.VIEWER_VIDEO_GRADE_THROTTLE_FPS)))), A.VIEWER_SCOPES_FPS = Math.max(1, Math.min(60, Math.round(U(e.viewer?.scopesFps, k.VIEWER_SCOPES_FPS)))), A.VIEWER_META_TTL_MS = Math.max(1e3, Math.min(10 * 6e4, Math.round(U(e.viewer?.metaTtlMs, k.VIEWER_META_TTL_MS)))), A.VIEWER_META_MAX_ENTRIES = Math.max(50, Math.min(5e3, Math.round(U(e.viewer?.metaMaxEntries, k.VIEWER_META_MAX_ENTRIES)))), A.WORKFLOW_MINIMAP_ENABLED = !!(e.workflowMinimap?.enabled ?? !1), A.RT_HYDRATE_CONCURRENCY = Math.max(1, Math.min(16, Math.round(U(e.rtHydrate?.concurrency, k.RT_HYDRATE_CONCURRENCY)))), A.RT_HYDRATE_QUEUE_MAX = Math.max(10, Math.min(5e3, Math.round(U(e.rtHydrate?.queueMax, k.RT_HYDRATE_QUEUE_MAX)))), A.RT_HYDRATE_SEEN_MAX = Math.max(1e3, Math.min(2e5, Math.round(U(e.rtHydrate?.seenMax, k.RT_HYDRATE_SEEN_MAX)))), A.RT_HYDRATE_PRUNE_BUDGET = Math.max(10, Math.min(1e4, Math.round(U(e.rtHydrate?.pruneBudget, k.RT_HYDRATE_PRUNE_BUDGET)))), A.RT_HYDRATE_SEEN_TTL_MS = Math.max(5e3, Math.min(360 * 6e4, Math.round(U(e.rtHydrate?.seenTtlMs, k.RT_HYDRATE_SEEN_TTL_MS)))), A.DELETE_CONFIRMATION = !!e.safety?.confirmDeletion, A.DEBUG_VERBOSE_ERRORS = !!e.observability?.verboseErrors, A.WATCHER_MAX_PENDING = Math.max(10, Math.min(5e3, Math.round(U(e.watcher?.maxPending, 500)))), A.WATCHER_MIN_SIZE = Math.max(0, Math.min(1e6, Math.round(U(e.watcher?.minSize, 100)))), A.WATCHER_MAX_SIZE = Math.max(1e5, Math.min(17179869184, Math.round(U(e.watcher?.maxSize, 4294967296)))), A.DB_TIMEOUT_MS = Math.max(1e3, Math.min(3e4, Math.round(U(e.db?.timeoutMs, 5e3)))), A.DB_MAX_CONNECTIONS = Math.max(1, Math.min(100, Math.round(U(e.db?.maxConnections, 10)))), A.DB_QUERY_TIMEOUT_MS = Math.max(500, Math.min(1e4, Math.round(U(e.db?.queryTimeoutMs, 1e3)))), A.SEARCH_REQUEST_LIMIT = Math.max(10, Math.min(k.MAX_PAGE_SIZE || 2e3, Math.round(U(e.search?.maxResults, k.SEARCH_DEFAULT_LIMIT))));
};
async function It() {
	try {
		let e = await t();
		if (!e?.ok) return;
		let n = e.data?.prefs;
		if (!n || typeof n != "object") return;
		let r = K();
		if (r.security = r.security || {}, r.security.safeMode = H(n.safe_mode, r.security.safeMode), r.security.allowWrite = H(n.allow_write, r.security.allowWrite), r.security.requireAuth = H(n.require_auth, r.security.requireAuth), r.security.allowRemoteWrite = H(n.allow_remote_write, r.security.allowRemoteWrite), r.security.allowInsecureTokenTransport = H(n.allow_insecure_token_transport, r.security.allowInsecureTokenTransport), r.security.allowDelete = H(n.allow_delete, r.security.allowDelete), r.security.allowRename = H(n.allow_rename, r.security.allowRename), r.security.allowOpenInFolder = H(n.allow_open_in_folder, r.security.allowOpenInFolder), r.security.allowResetIndex = H(n.allow_reset_index, r.security.allowResetIndex), r.security.tokenConfigured = H(n.token_configured, r.security.tokenConfigured), r.security.tokenHint = String(n.token_hint || "").trim(), !String(r.security.apiToken || "").trim()) try {
			let e = await S(), t = String(e?.data?.token || "").trim();
			e?.ok && t && (r.security.apiToken = t);
		} catch (e) {
			console.debug?.(e);
		}
		q(r), J(r), ct("mjr-settings-changed", { key: "security" }, { warnPrefix: "[Majoor]" });
	} catch (e) {
		console.warn("[Majoor] failed to sync backend security settings", e);
	}
}
async function Lt() {
	try {
		let e = await l();
		if (!e?.ok) return;
		let t = e.data?.prefs;
		if (!t || typeof t != "object") return;
		let n = K();
		n.ai = n.ai || {}, n.ai.vectorSearchEnabled = H(t.enabled, n.ai.vectorSearchEnabled ?? !0), n.ai.vectorCaptionOnIndex = H(t.caption_on_index ?? t.captionOnIndex, n.ai.vectorCaptionOnIndex ?? !1), q(n), J(n), ct("mjr-settings-changed", { key: "ai.vectorSearch" }, { warnPrefix: "[Majoor]" });
	} catch (e) {
		console.warn("[Majoor] failed to sync backend vector search settings", e);
	}
}
async function Rt() {
	try {
		let e = await p();
		if (!e?.ok) return;
		let t = e.data?.prefs;
		if (!t || typeof t != "object") return;
		let n = K();
		n.executionGrouping = n.executionGrouping || {}, n.executionGrouping.enabled = H(t.enabled, n.executionGrouping.enabled ?? k.EXECUTION_GROUPING_ENABLED), q(n), J(n), ct("mjr-settings-changed", { key: "executionGrouping.enabled" }, { warnPrefix: "[Majoor]" });
	} catch (e) {
		console.warn("[Majoor] failed to sync backend execution grouping settings", e);
	}
}
//#endregion
//#region ui/app/settings/settingsRuntime.ts
var zt = "mjr-runtime-status-dashboard", Bt = "__mjr_write_token", Vt = 3e4;
function Ht() {
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
function Ut() {
	try {
		document.getElementById(zt)?.remove?.();
	} catch (e) {
		console.debug?.(e);
	}
}
function Wt() {
	try {
		window.__MJR_RUNTIME_STATUS_HIDE_TIMEOUT__ && (clearTimeout(window.__MJR_RUNTIME_STATUS_HIDE_TIMEOUT__), window.__MJR_RUNTIME_STATUS_HIDE_TIMEOUT__ = null);
	} catch (e) {
		console.debug?.(e);
	}
}
function Gt() {
	try {
		return String(sessionStorage?.getItem?.(Bt) || "").trim();
	} catch {
		return "";
	}
}
function Kt(e, t) {
	let n = t === "auth" ? "__mjrAuthLine" : "__mjrMetricsLine";
	if (e?.[n]) return e[n];
	let r = document.createElement("div");
	return r.style.whiteSpace = "nowrap", r.style.lineHeight = "1.35", t === "auth" && (r.style.marginTop = "4px", r.style.fontWeight = "600"), e.appendChild(r), e[n] = r, r;
}
function qt(e) {
	let t = Gt(), n = String(e?.token_hint || "").trim() || (t ? `...${t.slice(-4)}` : ""), r = e?.allow_write !== !1, i = e?.require_auth === !0, a = e?.token_configured === !0;
	return r ? t ? {
		text: O("runtime.writeAuthActive", "Write auth: active {tokenHint}", { tokenHint: n || "(session)" }),
		color: "#7ee0a0"
	} : i && a ? {
		text: O("runtime.writeAuthMissing", "Write auth: missing in this browser {tokenHint}", { tokenHint: n || "(server token configured)" }),
		color: "#f1c36d"
	} : i ? {
		text: O("runtime.writeAuthRequired", "Write auth: required"),
		color: "#f1c36d"
	} : e && typeof e == "object" ? {
		text: O("runtime.writeAuthNotRequired", "Write auth: not required"),
		color: "#8fd0ff"
	} : {
		text: O("runtime.writeAuthUnknown", "Write auth: unknown"),
		color: "#c8ced8"
	} : {
		text: O("runtime.writeAuthBlocked", "Write auth: writes blocked by server"),
		color: "#ff9b9b"
	};
}
function Jt() {
	try {
		if (Ht() === "hidden" || window.__MJR_RUNTIME_STATUS_HIDDEN__) return Ut(), null;
		let e = document.querySelector(".mjr-assets-manager.mjr-am-container"), t = document.getElementById(zt);
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
		let n = document.getElementById(zt);
		return n ? n.parentElement !== e && e.appendChild(n) : (n = document.createElement("div"), n.id = zt, n.style.position = "absolute", n.style.bottom = "10px", n.style.right = "10px", n.style.zIndex = "9999", n.style.padding = "6px 10px", n.style.borderRadius = "10px", n.style.border = "1px solid rgba(255,255,255,0.16)", n.style.background = "rgba(0,0,0,0.45)", n.style.backdropFilter = "blur(4px)", n.style.color = "var(--content-fg, #fff)", n.style.fontSize = "11px", n.style.pointerEvents = "none", n.style.display = "flex", n.style.flexDirection = "column", e.appendChild(n)), n;
	} catch {
		return null;
	}
}
async function Yt() {
	let e = Jt();
	if (!e) return !1;
	let n = Kt(e, "metrics"), r = Kt(e, "auth");
	try {
		let [i, a] = await Promise.all([T(), t()]), o = O("runtime.unavailable", "Runtime: unavailable");
		if (!i?.ok || !i?.data) n.textContent = o;
		else {
			let e = i.data.db || {}, t = i.data.index || {}, r = i.data.watcher || {}, a = Number(e.active_connections || 0), s = Number(t.enrichment_queue_length || 0), c = Number(r.pending_files || 0);
			n.textContent = O("runtime.metricsLine", "DB active: {active} | Enrich Q: {enrichQ} | Watcher pending: {pending}", {
				active: a,
				enrichQ: s,
				pending: c
			}), o = O("runtime.metricsTitle", "Runtime Metrics\nDB active connections: {active}\nEnrichment queue: {enrichQ}\nWatcher pending files: {pending}", {
				active: a,
				enrichQ: s,
				pending: c
			});
		}
		let s = qt(a?.data?.prefs || null);
		return r.textContent = s.text, r.style.color = s.color, e.title = `${o}\n${s.text}`, !0;
	} catch {
		return n.textContent = O("runtime.unavailable", "Runtime: unavailable"), r.textContent = O("runtime.writeAuthUnknown", "Write auth: unknown"), r.style.color = "#c8ced8", e.title = `${O("runtime.unavailable", "Runtime: unavailable")}\n${r.textContent}`, !0;
	}
}
function Xt() {
	try {
		let e = Ht();
		if (e === "hidden") {
			window.__MJR_RUNTIME_STATUS_HIDDEN__ = !0, Wt(), Ut();
			return;
		}
		window.__MJR_RUNTIME_STATUS_SETTINGS_LISTENER__ || (window.__MJR_RUNTIME_STATUS_SETTINGS_LISTENER__ = (e) => {
			if (e?.detail?.key !== "observability.runtimeDashboardMode") return;
			let t = Ht();
			window.__MJR_RUNTIME_STATUS_HIDDEN__ = t === "hidden", Wt(), Ut(), t !== "hidden" && Xt();
		}, window.addEventListener?.("mjr-settings-changed", window.__MJR_RUNTIME_STATUS_SETTINGS_LISTENER__)), window.__MJR_RUNTIME_STATUS_HIDDEN__ = !1, Wt(), e === "autoHide30" && (window.__MJR_RUNTIME_STATUS_HIDE_TIMEOUT__ = setTimeout(() => {
			window.__MJR_RUNTIME_STATUS_HIDDEN__ = !0, Ut();
		}, Vt)), Yt().catch(() => {}), window.__MJR_RUNTIME_STATUS_INFLIGHT__ ?? (window.__MJR_RUNTIME_STATUS_INFLIGHT__ = !1), window.__MJR_RUNTIME_STATUS_MISS_COUNT__ ?? (window.__MJR_RUNTIME_STATUS_MISS_COUNT__ = 0), window.__MJR_RUNTIME_STATUS_INTERVAL__ || (window.__MJR_RUNTIME_STATUS_INTERVAL__ = setInterval(() => {
			window.__MJR_RUNTIME_STATUS_INFLIGHT__ || (window.__MJR_RUNTIME_STATUS_INFLIGHT__ = !0, Yt().then((e) => {
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
var Zt = 300;
function Qt(e, t = Zt) {
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
var Y = "Majoor", $t = "Majoor Assets Manager";
function en(e, t, n) {
	let r = (e, t) => [
		$t,
		e,
		t
	], i = (e) => [
		$t,
		O("cat.cards", "Cards"),
		e
	], a = (e) => [
		$t,
		O("cat.badges", "Badges"),
		e
	], o = (e) => [
		$t,
		O("cat.badges", "Badges"),
		e
	], s = (e, t) => {
		let n = String(e || "").trim();
		return /^[0-9a-fA-F]{6}$/.test(n) && (n = `#${n}`), /^#[0-9a-fA-F]{6}$/.test(n) ? n.toUpperCase() : t;
	};
	t.grid?.minSizePreset || (t.grid = t.grid || {}, t.grid.minSizePreset = _t(t.grid.minSize), q(t)), e({
		id: `${Y}.Cards.ThumbSize`,
		category: i(O("setting.grid.cardSize.group", "Card size")),
		name: O("setting.grid.cardSize.name", "Majoor: Card Size"),
		tooltip: O("setting.grid.cardSize.desc", "Choose the card size preset used by the grid layout."),
		type: "combo",
		defaultValue: (() => {
			let e = lt(String(t.grid?.minSizePreset || "").toLowerCase(), pt, _t(t.grid?.minSize)), n = {
				small: O("setting.grid.cardSize.small", "Small"),
				medium: O("setting.grid.cardSize.medium", "Medium"),
				large: O("setting.grid.cardSize.large", "Large")
			};
			return n[e] || n.medium;
		})(),
		options: [
			O("setting.grid.cardSize.small", "Small"),
			O("setting.grid.cardSize.medium", "Medium"),
			O("setting.grid.cardSize.large", "Large")
		],
		onChange: (e) => {
			let r = String(e || "").trim().toLowerCase(), i = O("setting.grid.cardSize.small", "Small").toLowerCase(), a = O("setting.grid.cardSize.medium", "Medium").toLowerCase(), o = O("setting.grid.cardSize.large", "Large").toLowerCase(), s = "medium";
			r === i || r === "small" || r === "petit" ? s = "small" : r === o || r === "large" || r === "grand" ? s = "large" : (r === a || r === "medium" || r === "moyen") && (s = "medium"), t.grid.minSizePreset = s, t.grid.minSize = ft[s], q(t), J(t), n("grid.minSizePreset");
		}
	}), e({
		id: `${Y}.Cards.CustomThumbSize`,
		category: i(O("setting.grid.cardSize.group", "Card size")),
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
			t.grid.minSize = r, t.grid.minSizePreset = _t(r), q(t), J(t), n("grid.minSize");
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
		category: o(O("setting.starColor", "Star color")),
		name: O("setting.starColor", "Majoor: Star color"),
		tooltip: O("setting.starColor.tooltip", "Color of rating stars on thumbnails (hex, e.g. #FFD45A)"),
		type: "color",
		defaultValue: s(t.grid?.starColor, k.BADGE_STAR_COLOR),
		onChange: (e) => {
			t.grid.starColor = s(e, k.BADGE_STAR_COLOR), q(t), J(t), n("grid.starColor");
		}
	}), e({
		id: `${Y}.Badges.ImageColor`,
		category: o(O("setting.badgeImageColor", "Image badge color")),
		name: O("setting.badgeImageColor", "Majoor: Image badge color"),
		tooltip: O("setting.badgeImageColor.tooltip", "Color for image badges: PNG, JPG, WEBP, GIF, BMP, TIF (hex)"),
		type: "color",
		defaultValue: s(t.grid?.badgeImageColor, k.BADGE_IMAGE_COLOR),
		onChange: (e) => {
			t.grid.badgeImageColor = s(e, k.BADGE_IMAGE_COLOR), q(t), J(t), n("grid.badgeImageColor");
		}
	}), e({
		id: `${Y}.Badges.VideoColor`,
		category: o(O("setting.badgeVideoColor", "Video badge color")),
		name: O("setting.badgeVideoColor", "Majoor: Video badge color"),
		tooltip: O("setting.badgeVideoColor.tooltip", "Color for video badges: MP4, WEBM, MOV, AVI, MKV (hex)"),
		type: "color",
		defaultValue: s(t.grid?.badgeVideoColor, k.BADGE_VIDEO_COLOR),
		onChange: (e) => {
			t.grid.badgeVideoColor = s(e, k.BADGE_VIDEO_COLOR), q(t), J(t), n("grid.badgeVideoColor");
		}
	}), e({
		id: `${Y}.Badges.AudioColor`,
		category: o(O("setting.badgeAudioColor", "Audio badge color")),
		name: O("setting.badgeAudioColor", "Majoor: Audio badge color"),
		tooltip: O("setting.badgeAudioColor.tooltip", "Color for audio badges: MP3, WAV, OGG, FLAC (hex)"),
		type: "color",
		defaultValue: s(t.grid?.badgeAudioColor, k.BADGE_AUDIO_COLOR),
		onChange: (e) => {
			t.grid.badgeAudioColor = s(e, k.BADGE_AUDIO_COLOR), q(t), J(t), n("grid.badgeAudioColor");
		}
	}), e({
		id: `${Y}.Badges.Model3dColor`,
		category: o(O("setting.badgeModel3dColor", "3D model badge color")),
		name: O("setting.badgeModel3dColor", "Majoor: 3D model badge color"),
		tooltip: O("setting.badgeModel3dColor.tooltip", "Color for 3D model badges: OBJ, FBX, GLB, GLTF (hex)"),
		type: "color",
		defaultValue: s(t.grid?.badgeModel3dColor, k.BADGE_MODEL3D_COLOR),
		onChange: (e) => {
			t.grid.badgeModel3dColor = s(e, k.BADGE_MODEL3D_COLOR), q(t), J(t), n("grid.badgeModel3dColor");
		}
	}), e({
		id: `${Y}.Badges.DuplicateAlertColor`,
		category: o(O("setting.badgeDuplicateAlertColor", "Duplicate alert badge color")),
		name: O("setting.badgeDuplicateAlertColor", "Majoor: Duplicate alert badge color"),
		tooltip: O("setting.badgeDuplicateAlertColor.tooltip", "Color for duplicate extension badges (PNG+, JPG+, etc)."),
		type: "color",
		defaultValue: s(t.grid?.badgeDuplicateAlertColor, k.BADGE_DUPLICATE_ALERT_COLOR),
		onChange: (e) => {
			t.grid.badgeDuplicateAlertColor = s(e, k.BADGE_DUPLICATE_ALERT_COLOR), q(t), J(t), n("grid.badgeDuplicateAlertColor");
		}
	}), e({
		id: `${Y}.Grid.PageSize`,
		category: r(O("cat.grid"), O("setting.grid.pagesize.name").replace("Majoor: ", "")),
		name: O("setting.grid.pagesize.name"),
		tooltip: O("setting.grid.pagesize.desc"),
		type: "number",
		defaultValue: t.grid.pageSize,
		attrs: {
			min: 50,
			max: Number(A.MAX_PAGE_SIZE) || 2e3,
			step: 50
		},
		onChange: (e) => {
			let r = Number(A.MAX_PAGE_SIZE) || 2e3;
			t.grid.pageSize = Math.max(50, Math.min(r, Number(e) || k.DEFAULT_PAGE_SIZE)), q(t), J(t), n("grid.pageSize");
		}
	}), e({
		id: `${Y}.InfiniteScroll.Enabled`,
		category: r(O("cat.grid"), O("setting.nav.infinite.name").replace("Majoor: ", "")),
		name: O("setting.nav.infinite.name"),
		tooltip: O("setting.nav.infinite.desc"),
		type: "boolean",
		defaultValue: !!t.infiniteScroll?.enabled,
		onChange: (e) => {
			t.infiniteScroll = t.infiniteScroll || {}, t.infiniteScroll.enabled = !!e, q(t), J(t), n("infiniteScroll.enabled");
		}
	}), e({
		id: `${Y}.Sidebar.Position`,
		category: r(O("cat.grid"), O("setting.sidebar.pos.name").replace("Majoor: ", "")),
		name: O("setting.sidebar.pos.name"),
		tooltip: O("setting.sidebar.pos.desc"),
		type: "combo",
		defaultValue: t.sidebar?.position || "right",
		options: ["left", "right"],
		onChange: (e) => {
			t.sidebar = t.sidebar || {}, t.sidebar.position = e === "left" ? "left" : "right", q(t), n("sidebar.position");
		}
	}), e({
		id: `${Y}.Sidebar.ShowPreviewThumb`,
		category: r(O("cat.grid"), "Sidebar preview"),
		name: "Show sidebar preview thumb",
		tooltip: "Show/hide the large media preview at the top of the sidebar metadata panel.",
		type: "boolean",
		defaultValue: !!(t.sidebar?.showPreviewThumb ?? !0),
		onChange: (e) => {
			t.sidebar = t.sidebar || {}, t.sidebar.showPreviewThumb = !!e, q(t), n("sidebar.showPreviewThumb");
		}
	}), e({
		id: `${Y}.Sidebar.WidthPx`,
		category: r(O("cat.grid"), "Sidebar width"),
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
		category: r(O("cat.grid"), O("setting.siblings.hide.name").replace("Majoor: ", "")),
		name: O("setting.siblings.hide.name"),
		tooltip: O("setting.siblings.hide.desc"),
		type: "boolean",
		defaultValue: !!t.siblings?.hidePngSiblings,
		onChange: (e) => {
			t.siblings = t.siblings || {}, t.siblings.hidePngSiblings = !!e, q(t), n("siblings.hidePngSiblings");
		}
	}), e({
		id: `${Y}.Grid.VideoAutoplayMode`,
		category: r(O("cat.grid"), O("setting.grid.videoAutoplayMode.name", "Video autoplay").replace("Majoor: ", "")),
		name: O("setting.grid.videoAutoplayMode.name", "Majoor: Video autoplay"),
		tooltip: O("setting.grid.videoAutoplayMode.desc", "Controls video thumbnail playback in the grid. Off: static frame. Hover: play on mouse hover. Always: loop while visible."),
		type: "combo",
		defaultValue: (() => {
			let e = t.grid?.videoAutoplayMode;
			e ??= t.grid?.videoHoverAutoplay === !1 ? "off" : "hover", e === !0 && (e = "hover"), e === !1 && (e = "off"), e !== "hover" && e !== "always" && e !== "off" && (e = "hover");
			let n = {
				off: O("setting.grid.videoAutoplayMode.off", "Off"),
				hover: O("setting.grid.videoAutoplayMode.hover", "Hover"),
				always: O("setting.grid.videoAutoplayMode.always", "Always")
			};
			return n[e] || n.off;
		})(),
		options: [
			O("setting.grid.videoAutoplayMode.off", "Off"),
			O("setting.grid.videoAutoplayMode.hover", "Hover"),
			O("setting.grid.videoAutoplayMode.always", "Always")
		],
		onChange: (e) => {
			let r = {
				[O("setting.grid.videoAutoplayMode.off", "Off")]: "off",
				[O("setting.grid.videoAutoplayMode.hover", "Hover")]: "hover",
				[O("setting.grid.videoAutoplayMode.always", "Always")]: "always"
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
var tn = "Majoor", nn = "Majoor Assets Manager";
function rn(e, t, n) {
	let r = (e, t) => [
		nn,
		e,
		t
	], i = (e) => r(O("cat.viewer", "Viewer"), e), a = (e) => r(O("cat.floatingViewer", "Floating Viewer"), e);
	e({
		id: `${tn}.Viewer.AllowPanAtZoom1`,
		category: i(O("setting.viewer.pan.name").replace("Majoor: ", "")),
		name: O("setting.viewer.pan.name"),
		tooltip: O("setting.viewer.pan.desc"),
		type: "boolean",
		defaultValue: !!t.viewer?.allowPanAtZoom1,
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.allowPanAtZoom1 = !!e, q(t), J(t), n("viewer.allowPanAtZoom1");
		}
	}), e({
		id: `${tn}.Viewer.DisableWebGL`,
		category: i("Disable WebGL Video"),
		name: "Disable WebGL Video",
		tooltip: "Use CPU rendering (Canvas 2D) for video playback. Fixes 'black screen' issues on incompatible hardware/browsers.",
		type: "boolean",
		defaultValue: !!t.viewer?.disableWebGL,
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.disableWebGL = !!e, q(t), J(t), n("viewer.disableWebGL");
		}
	}), e({
		id: `${tn}.Viewer.PauseDuringExecution`,
		category: i(O("setting.viewer.pauseExecution.name").replace("Majoor: ", "")),
		name: O("setting.viewer.pauseExecution.name"),
		tooltip: O("setting.viewer.pauseExecution.desc"),
		type: "boolean",
		defaultValue: !!t.viewer?.pauseDuringExecution,
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.pauseDuringExecution = !!e, q(t), J(t), n("viewer.pauseDuringExecution");
		}
	}), e({
		id: `${tn}.Viewer.FloatingPauseDuringExecution`,
		category: a(O("setting.viewer.floatingPauseExecution.name").replace("Majoor: ", "")),
		name: O("setting.viewer.floatingPauseExecution.name"),
		tooltip: O("setting.viewer.floatingPauseExecution.desc"),
		type: "boolean",
		defaultValue: !!t.viewer?.floatingPauseDuringExecution,
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.floatingPauseDuringExecution = !!e, q(t), J(t), n("viewer.floatingPauseDuringExecution");
		}
	}), e({
		id: `${tn}.Viewer.MfvLiveDefault`,
		category: a(O("setting.viewer.mfvLiveDefault.name").replace("Majoor: ", "")),
		name: O("setting.viewer.mfvLiveDefault.name"),
		tooltip: O("setting.viewer.mfvLiveDefault.desc"),
		type: "boolean",
		defaultValue: !!(t.viewer?.mfvLiveDefault ?? k.MFV_LIVE_DEFAULT),
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.mfvLiveDefault = !!e, q(t), J(t), n("viewer.mfvLiveDefault");
		}
	}), e({
		id: `${tn}.Viewer.MfvPreviewDefault`,
		category: a(O("setting.viewer.mfvPreviewDefault.name").replace("Majoor: ", "")),
		name: O("setting.viewer.mfvPreviewDefault.name"),
		tooltip: O("setting.viewer.mfvPreviewDefault.desc"),
		type: "boolean",
		defaultValue: !!(t.viewer?.mfvPreviewDefault ?? k.MFV_PREVIEW_DEFAULT),
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.mfvPreviewDefault = !!e, q(t), J(t), n("viewer.mfvPreviewDefault");
		}
	}), e({
		id: `${tn}.Viewer.MfvSidebarPosition`,
		category: a("Node Parameters sidebar position"),
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
		id: `${tn}.Viewer.MfvPreviewMethod`,
		category: a(O("setting.viewer.mfvPreviewMethod.name").replace("Majoor: ", "")),
		name: O("setting.viewer.mfvPreviewMethod.name"),
		tooltip: O("setting.viewer.mfvPreviewMethod.desc"),
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
		id: `${tn}.Viewer.LtxavRgbFallback`,
		category: a("LTXAV preview fallback"),
		name: "Majoor: LTXAV RGB Preview Fallback (experimental)",
		tooltip: "Reuse LTXV RGB projection for LTXAV when native latent preview is unavailable. Experimental; quality may be approximate.",
		type: "boolean",
		defaultValue: !!t.viewer?.ltxavRgbFallback,
		onChange: async (e) => {
			let r = !!e, i = !!t.viewer?.ltxavRgbFallback;
			t.viewer = t.viewer || {}, t.viewer.ltxavRgbFallback = r, q(t), J(t), n("viewer.ltxavRgbFallback");
			try {
				let e = await g(r);
				if (!e?.ok) throw Error(e?.error || "Failed to update LTXAV RGB preview fallback setting");
			} catch (e) {
				t.viewer.ltxavRgbFallback = i, q(t), J(t), n("viewer.ltxavRgbFallback"), y(e?.message || "Failed to update LTXAV RGB preview fallback setting", "error");
			}
		}
	});
	try {
		m().then((e) => {
			if (!e?.ok) return;
			let r = !!e?.data?.prefs?.enabled, i = K();
			i.viewer = i.viewer || {}, !!i.viewer.ltxavRgbFallback !== r && (i.viewer.ltxavRgbFallback = r, Object.assign(t, i), q(i), J(i), n("viewer.ltxavRgbFallback"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	((r, a, o, s) => {
		e({
			id: `${tn}.WorkflowMinimap.${r}`,
			category: i(O(o).replace("Majoor: ", "")),
			name: O(o),
			tooltip: O(s),
			type: "boolean",
			defaultValue: !!t.workflowMinimap?.[a],
			onChange: (e) => {
				t.workflowMinimap = t.workflowMinimap || {}, t.workflowMinimap[a] = !!e, q(t), n(`workflowMinimap.${a}`);
			}
		});
	})("Enabled", "enabled", "setting.minimap.enabled.name", "setting.minimap.enabled.desc");
}
//#endregion
//#region ui/app/settings/settingsScanning.ts
var an = "Majoor", on = "Majoor Assets Manager";
function sn(e, t, n) {
	let r = (e, t) => [
		on,
		e,
		t
	];
	e({
		id: `${an}.ExecutionGrouping.Enabled`,
		category: r(O("cat.scanning"), "Execution grouping"),
		name: "Execution job/stack grouping",
		tooltip: "Enable or disable all live job_id / stack_id tracking, grouping, and stack finalization logic.",
		type: "boolean",
		defaultValue: !!(t.executionGrouping?.enabled ?? k.EXECUTION_GROUPING_ENABLED),
		onChange: async (e) => {
			let r = !!(t.executionGrouping?.enabled ?? k.EXECUTION_GROUPING_ENABLED), i = !!e;
			t.executionGrouping = t.executionGrouping || {}, t.executionGrouping.enabled = i, q(t), J(t), n("executionGrouping.enabled");
			try {
				let e = await ie(i);
				if (!e?.ok) throw Error(e?.error || "Failed to update execution grouping setting");
				t.executionGrouping.enabled = !!e?.data?.prefs?.enabled, q(t), J(t), n("executionGrouping.enabled");
			} catch (e) {
				t.executionGrouping.enabled = r, q(t), J(t), n("executionGrouping.enabled"), y(e?.message || "Failed to update execution grouping setting", "error");
			}
		}
	}), e({
		id: `${an}.AutoScan.OnStartup`,
		category: r(O("cat.scanning"), O("setting.scan.startup.name").replace("Majoor: ", "")),
		name: O("setting.scan.startup.name"),
		tooltip: O("setting.scan.startup.desc"),
		type: "boolean",
		defaultValue: !!t.autoScan?.onStartup,
		onChange: (e) => {
			t.autoScan = t.autoScan || {}, t.autoScan.onStartup = !!e, q(t), J(t), n("autoScan.onStartup");
		}
	}), e({
		id: `${an}.Scan.FastMode`,
		category: r(O("cat.scanning"), "Scan mode"),
		name: "Fast scan mode",
		tooltip: "Use fast scan mode for manual backfill scans (skip heavier metadata work during scan).",
		type: "boolean",
		defaultValue: !!(t.scan?.fastMode ?? !0),
		onChange: (e) => {
			t.scan = t.scan || {}, t.scan.fastMode = !!e, q(t), n("scan.fastMode");
		}
	}), e({
		id: `${an}.RtHydrate.Concurrency`,
		category: r(O("cat.scanning"), "Hydration"),
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
			let e = await d();
			if (!e?.ok) return;
			a(e.data || {});
		} catch (e) {
			console.debug?.(e);
		}
	};
	e({
		id: `${an}.Watcher.Enabled`,
		category: r(O("cat.scanning"), O("setting.watcher.enabled.label", "Enable watcher")),
		name: O("setting.watcher.name"),
		tooltip: O("setting.watcher.desc") + " (env: MJR_ENABLE_WATCHER)",
		type: "boolean",
		defaultValue: !!t.watcher?.enabled,
		onChange: async (e) => {
			t.watcher = t.watcher || {}, t.watcher.enabled = !!e, q(t), n("watcher.enabled");
			try {
				let r = await re(!!e);
				r?.ok || (t.watcher.enabled = !e, q(t), n("watcher.enabled"), y(r?.error || O("toast.failedToggleWatcher", "Failed to toggle watcher"), "error"));
			} catch {
				t.watcher.enabled = !e, q(t), n("watcher.enabled");
			}
		}
	}), e({
		id: `${an}.Watcher.DebounceDelay`,
		category: r(O("cat.scanning"), O("setting.watcher.debounce.label", "Watcher debounce delay")),
		name: O("setting.watcher.debounce.name"),
		tooltip: O("setting.watcher.debounce.desc") + " (env: MJR_WATCHER_DEBOUNCE_MS)",
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
					let e = await oe({ debounce_ms: a });
					if (!e?.ok) throw Error(e?.error || O("setting.watcher.debounce.error"));
					let r = Math.round(Number(e?.data?.debounce_ms ?? a));
					t.watcher.debounceMs = r, q(t), n("watcher.debounceMs");
				} catch (e) {
					t.watcher.debounceMs = o, q(t), n("watcher.debounceMs"), y(e?.message || O("setting.watcher.debounce.error"), "error");
				}
			}
		}
	}), e({
		id: `${an}.Watcher.DedupeWindow`,
		category: r(O("cat.scanning"), O("setting.watcher.dedupe.label", "Watcher dedupe window")),
		name: O("setting.watcher.dedupe.name"),
		tooltip: O("setting.watcher.dedupe.desc") + " (env: MJR_WATCHER_DEDUPE_TTL_MS)",
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
					let e = await oe({ dedupe_ttl_ms: a });
					if (!e?.ok) throw Error(e?.error || O("setting.watcher.dedupe.error"));
					let r = Math.round(Number(e?.data?.dedupe_ttl_ms ?? a));
					t.watcher.dedupeTtlMs = r, q(t), n("watcher.dedupeTtlMs");
				} catch (e) {
					t.watcher.dedupeTtlMs = o, q(t), n("watcher.dedupeTtlMs"), y(e?.message || O("setting.watcher.dedupe.error"), "error");
				}
			}
		}
	}), e({
		id: `${an}.Watcher.MaxPending`,
		category: r(O("cat.scanning"), "Watcher queue"),
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
		id: `${an}.Watcher.MinSize`,
		category: r(O("cat.scanning"), "Watcher file size"),
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
		id: `${an}.Watcher.MaxSize`,
		category: r(O("cat.scanning"), "Watcher file size"),
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
		id: `${an}.RatingTagsSync.Enabled`,
		category: r(O("cat.scanning"), O("setting.sync.rating.name").replace("Majoor: ", "")),
		name: O("setting.sync.rating.name"),
		tooltip: O("setting.sync.rating.desc"),
		type: "boolean",
		defaultValue: !!t.ratingTagsSync?.enabled,
		onChange: (e) => {
			t.ratingTagsSync = t.ratingTagsSync || {}, t.ratingTagsSync.enabled = !!e, q(t), n("ratingTagsSync.enabled");
		}
	});
}
//#endregion
//#region ui/app/settings/settingsFeed.ts
var cn = "Majoor", ln = "Majoor Assets Manager";
function un(e, t, n) {
	let r = (e) => [
		ln,
		O("cat.feed", "Generated Feed"),
		e
	], i = () => {
		t.feed = t.feed || {};
	};
	e({
		id: `${cn}.Feed.CardSize`,
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
		id: `${cn}.Feed.ShowInfo`,
		category: r("Show info section"),
		name: "Show card info section",
		tooltip: "Show or hide the entire info section (filename, metadata, dots) below thumbnails in the Generated Feed.",
		type: "boolean",
		defaultValue: !!(t.feed?.showInfo ?? k.FEED_SHOW_INFO),
		onChange: (e) => {
			i(), t.feed.showInfo = !!e, q(t), J(t), n("feed.showInfo");
		}
	}), e({
		id: `${cn}.Feed.ShowFilename`,
		category: r("Show filename"),
		name: "Show filename",
		tooltip: "Display the filename on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showFilename ?? k.FEED_SHOW_FILENAME),
		onChange: (e) => {
			i(), t.feed.showFilename = !!e, q(t), J(t), n("feed.showFilename");
		}
	}), e({
		id: `${cn}.Feed.ShowDimensions`,
		category: r("Show dimensions"),
		name: "Show dimensions",
		tooltip: "Display resolution (WxH) and duration on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showDimensions ?? k.FEED_SHOW_DIMENSIONS),
		onChange: (e) => {
			i(), t.feed.showDimensions = !!e, q(t), J(t), n("feed.showDimensions");
		}
	}), e({
		id: `${cn}.Feed.ShowDate`,
		category: r("Show date/time"),
		name: "Show date/time",
		tooltip: "Display date and time on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showDate ?? k.FEED_SHOW_DATE),
		onChange: (e) => {
			i(), t.feed.showDate = !!e, q(t), J(t), n("feed.showDate");
		}
	}), e({
		id: `${cn}.Feed.ShowGenTime`,
		category: r("Show generation time"),
		name: "Show generation time",
		tooltip: "Display the generation time badge on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showGenTime ?? k.FEED_SHOW_GENTIME),
		onChange: (e) => {
			i(), t.feed.showGenTime = !!e, q(t), J(t), n("feed.showGenTime");
		}
	}), e({
		id: `${cn}.Feed.ShowWorkflowDot`,
		category: r("Show workflow dot"),
		name: "Show workflow indicator",
		tooltip: "Display the workflow availability dot on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showWorkflowDot ?? k.FEED_SHOW_WORKFLOW_DOT),
		onChange: (e) => {
			i(), t.feed.showWorkflowDot = !!e, q(t), J(t), n("feed.showWorkflowDot");
		}
	}), e({
		id: `${cn}.Feed.ShowExtBadge`,
		category: r("Show format badges"),
		name: "Show format badges",
		tooltip: "Display format badges (e.g. JPG, MP4) on feed card thumbnails.",
		type: "boolean",
		defaultValue: !!(t.feed?.showExtBadge ?? k.FEED_SHOW_BADGES_EXTENSION),
		onChange: (e) => {
			i(), t.feed.showExtBadge = !!e, q(t), J(t), n("feed.showExtBadge");
		}
	}), e({
		id: `${cn}.Feed.ShowRatingBadge`,
		category: r("Show rating badges"),
		name: "Show ratings",
		tooltip: "Display star ratings on feed card thumbnails.",
		type: "boolean",
		defaultValue: !!(t.feed?.showRatingBadge ?? k.FEED_SHOW_BADGES_RATING),
		onChange: (e) => {
			i(), t.feed.showRatingBadge = !!e, q(t), J(t), n("feed.showRatingBadge");
		}
	}), e({
		id: `${cn}.Feed.ShowTagsBadge`,
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
var dn = "Majoor", fn = "Majoor Assets Manager", pn = 16, mn = {
	safeMode: !1,
	allowWrite: !0,
	allowDelete: !0,
	allowRename: !0,
	allowOpenInFolder: !0,
	allowResetIndex: !0
};
function hn(e) {
	return !!e;
}
function gn(e, t) {
	return hn(e) === hn(t);
}
function _n(e) {
	return typeof e == "string" ? e.trim() : "";
}
function vn(e) {
	let t = String(e || "").trim().toLowerCase();
	return t === "localhost" || t === "127.0.0.1" || t === "::1";
}
function yn() {
	return globalThis.location || globalThis.window?.location || null;
}
function bn() {
	let e = yn();
	if (!e) return !1;
	let t = String(e.protocol || "").toLowerCase(), n = String(e.hostname || "").trim();
	return t === "http:" && !vn(n);
}
function xn(e) {
	let t = globalThis.crypto;
	if (!t?.getRandomValues) throw Error("Secure token generation requires crypto.getRandomValues().");
	return t.getRandomValues(e);
}
function Sn(e) {
	let t = Math.max(4, Number(e) || 0), n = new Uint8Array(t);
	return xn(n), Array.from(n, (e) => e.toString(16).padStart(2, "0")).join("");
}
function Cn() {
	return `mjr_${Sn(18)}`;
}
function wn(e) {
	return String(e?.apiToken || "").trim().length >= pn && H(e?.allowWrite, !0) && H(e?.requireAuth, !1) && !H(e?.allowRemoteWrite, !1);
}
function Tn(e) {
	let t = String((e && typeof e == "object" ? e : {}).apiToken || "").trim();
	return {
		apiToken: t.length >= pn ? t : Cn(),
		allowWrite: !0,
		requireAuth: !0,
		allowRemoteWrite: !1,
		allowInsecureTokenTransport: bn()
	};
}
function En(e) {
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
function Dn(e) {
	return se(En(e));
}
function On(e) {
	let t = String(e?.security?.tokenHint || "").trim();
	return t ? O("setting.sec.token.placeholderConfigured", "Token configured on server ({tokenHint}). Leave blank to keep the current server token.", { tokenHint: t }) : e?.security?.tokenConfigured ? O("setting.sec.token.placeholderConfiguredGeneric", "Token configured on server. Leave blank to keep the current server token.") : O("setting.sec.token.placeholder", "Auto-generated for this browser session.");
}
function kn(e, t, n) {
	let r = (e, t) => [
		fn,
		e,
		t
	];
	e({
		id: `${dn}.Safety.ConfirmDeletion`,
		category: r(O("cat.security"), "Confirm before deleting"),
		name: "Confirm before deleting",
		tooltip: "Show a confirmation dialog before deleting files. Disabling this allows instant deletion.",
		type: "boolean",
		defaultValue: t.safety?.confirmDeletion !== !1,
		onChange: (e) => {
			gn(t.safety?.confirmDeletion !== !1, e) || (t.safety = t.safety || {}, t.safety.confirmDeletion = !!e, q(t), J(t), n("safety.confirmDeletion"));
		}
	});
	let i = (i, a, o, s = "cat.security") => {
		e({
			id: `${dn}.Security.${i}`,
			category: r(O(s), O(a).replace("Majoor: ", "")),
			name: O(a),
			tooltip: O(o),
			type: "boolean",
			defaultValue: H(t.security?.[i], mn[i] ?? !1),
			onChange: (e) => {
				if (!gn(t.security?.[i], e)) {
					t.security = t.security || {}, t.security[i] = !!e, q(t), n(`security.${i}`);
					try {
						Dn(t.security).then((e) => {
							e?.ok && e.data?.prefs ? It() : e && e.ok === !1 && console.warn("[Majoor] backend security settings update failed", e.error || e);
						}).catch(() => {});
					} catch (e) {
						console.debug?.(e);
					}
				}
			}
		});
	};
	i("safeMode", "setting.sec.safe.name", "setting.sec.safe.desc"), i("allowWrite", "setting.sec.write.name", "setting.sec.write.desc"), i("allowDelete", "setting.sec.del.name", "setting.sec.del.desc"), i("allowRename", "setting.sec.ren.name", "setting.sec.ren.desc"), i("allowOpenInFolder", "setting.sec.open.name", "setting.sec.open.desc"), i("allowResetIndex", "setting.sec.reset.name", "setting.sec.reset.desc"), e({
		id: `${dn}.Security.RemoteLanPreset`,
		category: r(O("cat.remote"), O("setting.sec.remoteLanPreset.name").replace("Majoor: ", "")),
		name: O("setting.sec.remoteLanPreset.name"),
		tooltip: O("setting.sec.remoteLanPreset.desc"),
		type: "boolean",
		defaultValue: wn(t.security),
		onChange: (e) => {
			if (t.security = t.security || {}, gn(t.security.remoteLanPreset, e)) return;
			if (t.security.remoteLanPreset = !!e, !e) {
				q(t), n("security.remoteLanPreset");
				return;
			}
			let r;
			try {
				r = Tn(t.security);
			} catch (e) {
				y(e?.message || O("toast.remoteLanPresetFailed", "Failed to apply the recommended remote LAN setup."), "error");
				return;
			}
			Object.assign(t.security, r), t.security.tokenConfigured = !0, t.security.tokenHint = String(r.apiToken || "").trim() ? `...${String(r.apiToken).trim().slice(-4)}` : "", r.apiToken && C(r.apiToken), q(t), n("security.remoteLanPreset"), n("security.apiToken"), n("security.allowWrite"), n("security.requireAuth"), n("security.allowRemoteWrite"), n("security.allowInsecureTokenTransport");
			try {
				Dn(t.security).then((e) => {
					e?.ok && e.data?.prefs ? (It(), y(O("toast.remoteLanPresetApplied", "Recommended remote LAN setup applied. This browser session is now authorized for Majoor write operations."), "success")) : e && e.ok === !1 && (y(e.error || O("toast.remoteLanPresetFailed", "Failed to apply the recommended remote LAN setup."), "error"), console.warn("[Majoor] backend remote LAN preset update failed", e.error || e));
				}).catch((e) => {
					y(e?.message || O("toast.remoteLanPresetFailed", "Failed to apply the recommended remote LAN setup."), "error");
				});
			} catch (e) {
				console.debug?.(e);
			}
		}
	}), e({
		id: `${dn}.Security.ApiToken`,
		category: r(O("cat.remote"), O("setting.sec.token.name").replace("Majoor: ", "")),
		name: O("setting.sec.token.name", "Majoor: API Token"),
		tooltip: O("setting.sec.token.desc", "Store the API token used for write operations. Majoor sends it via X-MJR-Token and Authorization headers."),
		type: "text",
		defaultValue: t.security?.apiToken || "",
		attrs: { placeholder: On(t) },
		onChange: (e) => {
			t.security = t.security || {};
			let r = _n(e);
			if (_n(t.security.apiToken) !== r && (t.security.apiToken = r, t.security.apiToken && (t.security.tokenConfigured = !0, t.security.tokenHint = `...${t.security.apiToken.slice(-4)}`, C(t.security.apiToken)), q(t), n("security.apiToken"), t.security.apiToken)) try {
				se({ api_token: t.security.apiToken }).then((e) => {
					e?.ok && e.data?.prefs ? It() : e && e.ok === !1 && console.warn("[Majoor] backend token update failed", e.error || e);
				}).catch(() => {});
			} catch (e) {
				console.debug?.(e);
			}
		}
	}), i("requireAuth", "setting.sec.requireAuth.name", "setting.sec.requireAuth.desc", "cat.remote"), i("allowRemoteWrite", "setting.sec.remote.name", "setting.sec.remote.desc", "cat.remote"), i("allowInsecureTokenTransport", "setting.sec.insecureTransport.name", "setting.sec.insecureTransport.desc", "cat.remote");
}
//#endregion
//#region ui/app/settings/settingsAdvanced.ts
var X = "Majoor", An = "Majoor Assets Manager";
function jn(t, a, o, l) {
	let d = (e, t) => [
		An,
		e,
		t
	], p = String(a.paths?.outputDirectory || ""), m = null, h = 0, g = null;
	t({
		id: `${X}.Paths.OutputDirectory`,
		category: d(O("cat.advanced"), "Paths / Output"),
		name: "Majoor: Generation Output Directory",
		tooltip: "Override the ComfyUI generation output directory used by Majoor (equivalent to --output-directory). Leave empty to keep the current backend default.",
		type: "text",
		defaultValue: String(a.paths?.outputDirectory || ""),
		attrs: { placeholder: "D:\\\\____COMFY_OUTPUTS" },
		onChange: async (e) => {
			let t = String(e || "").trim();
			a.paths = a.paths || {}, a.paths.outputDirectory = t, q(a);
			try {
				m &&= (clearTimeout(m), null);
			} catch (e) {
				console.debug?.(e);
			}
			m = setTimeout(async () => {
				m = null;
				let e = ++h;
				try {
					g?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				g = typeof AbortController < "u" ? new AbortController() : null;
				try {
					let n = await f(t, g ? { signal: g.signal } : {});
					if (e !== h) return;
					if (!n?.ok) throw Error(n?.error || O("toast.failedSetOutputDirectory", "Failed to set output directory"));
					let r = String(n?.data?.output_directory || t).trim();
					a.paths.outputDirectory = r, p = r, q(a), o("paths.outputDirectory");
				} catch (t) {
					if (e !== h || String(t?.name || "") === "AbortError" || String(t?.code || "") === "ABORTED") return;
					a.paths.outputDirectory = p, q(a), o("paths.outputDirectory"), y(t?.message || O("toast.failedSetOutputDirectory", "Failed to set output directory"), "error");
				}
			}, 700);
		}
	});
	try {
		r().then((e) => {
			if (!e?.ok) return;
			let t = String(e?.data?.output_directory || "").trim();
			a.paths = a.paths || {}, a.paths.outputDirectory !== t && (a.paths.outputDirectory = t, p = t, q(a), o("paths.outputDirectory"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	let x = String(a.paths?.indexDirectory || ""), S = null, C = 0, T = null;
	t({
		id: `${X}.Paths.IndexDirectory`,
		category: d(O("cat.advanced"), "Paths / Index"),
		name: "Majoor: Index Database Directory",
		tooltip: "Override the Majoor index database directory. Use this to keep the SQLite index on a different local disk. Requires restart.",
		type: "text",
		defaultValue: String(a.paths?.indexDirectory || ""),
		attrs: { placeholder: "D:\\MajoorIndex" },
		onChange: async (e) => {
			let t = String(e || "").trim();
			a.paths = a.paths || {}, a.paths.indexDirectory = t, q(a);
			try {
				S &&= (clearTimeout(S), null);
			} catch (e) {
				console.debug?.(e);
			}
			S = setTimeout(async () => {
				S = null;
				let e = ++C;
				try {
					T?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				T = typeof AbortController < "u" ? new AbortController() : null;
				try {
					let n = await _(t, T ? { signal: T.signal } : {});
					if (e !== C) return;
					if (!n?.ok) throw Error(n?.error || O("toast.failedSetIndexDirectory", "Failed to set index directory"));
					let r = String(n?.data?.index_directory || t).trim(), i = r !== x;
					a.paths.indexDirectory = r, x = r, q(a), o("paths.indexDirectory"), i && y(O("toast.indexDirectorySavedRestart", "Index directory saved. Restart ComfyUI to apply."), "success", void 0, { history: { trackId: "settings:index-directory-saved" } });
				} catch (t) {
					if (e !== C || String(t?.name || "") === "AbortError" || String(t?.code || "") === "ABORTED") return;
					a.paths.indexDirectory = x, q(a), o("paths.indexDirectory"), y(t?.message || O("toast.failedSetIndexDirectory", "Failed to set index directory"), "error");
				}
			}, 700);
		}
	});
	try {
		E().then((e) => {
			if (!e?.ok) return;
			let t = String(e?.data?.index_directory || "").trim();
			a.paths = a.paths || {}, a.paths.indexDirectory !== t && (a.paths.indexDirectory = t, x = t, q(a), o("paths.indexDirectory"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	let re = ge().map((e) => e.code), ie = ["auto", ...re];
	t({
		id: `${X}.Language`,
		category: d(O("cat.advanced"), O("setting.language.name", "Language")),
		name: O("setting.language.name", "Majoor: Language"),
		tooltip: "Use auto to detect and follow ComfyUI language. Or choose a fixed language for Majoor only.",
		type: "combo",
		defaultValue: a.i18n?.followComfyLanguage ? "auto" : ye(),
		options: ie,
		onChange: (e) => {
			if (a.i18n = a.i18n || {}, e === "auto") {
				a.i18n.followComfyLanguage = !0, ve(!0), me(l), q(a), o("language");
				return;
			}
			re.includes(e) && (a.i18n.followComfyLanguage = !1, ve(!1), xe(e), q(a), o("language"));
		}
	}), t({
		id: `${X}.ProbeBackend.Mode`,
		category: d(O("cat.advanced"), O("setting.probe.mode.name").replace("Majoor: ", "")),
		name: O("setting.probe.mode.name"),
		tooltip: O("setting.probe.mode.desc") + " (env: MAJOOR_MEDIA_PROBE_BACKEND)",
		type: "combo",
		defaultValue: a.probeBackend?.mode || G.probeBackend.mode,
		options: [
			"auto",
			"exiftool",
			"ffprobe",
			"both"
		],
		onChange: (t) => {
			let n = lt(t, [
				"auto",
				"exiftool",
				"ffprobe",
				"both"
			], G.probeBackend.mode);
			a.probeBackend = a.probeBackend || {}, a.probeBackend.mode = n, q(a), J(a), o("probeBackend.mode"), e(n).catch(() => {});
		}
	}), t({
		id: `${X}.MetadataFallback.Image`,
		category: d(O("cat.advanced"), "Metadata"),
		name: "Majoor: Metadata Fallback (Images)",
		tooltip: "Enable Pillow fallback when ExifTool is missing or fails.",
		type: "boolean",
		defaultValue: a.metadataFallback?.image ?? G.metadataFallback.image,
		onChange: async (e) => {
			let t = !!e, n = !!(a.metadataFallback?.image ?? G.metadataFallback.image);
			a.metadataFallback = a.metadataFallback || {}, a.metadataFallback.image = t, q(a), o("metadataFallback.image");
			try {
				let e = await v({
					image: t,
					media: a.metadataFallback?.media ?? G.metadataFallback.media
				});
				if (!e?.ok) throw Error(e?.error || O("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"));
			} catch (e) {
				a.metadataFallback.image = n, q(a), o("metadataFallback.image"), y(e?.message || O("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"), "error");
			}
		}
	}), t({
		id: `${X}.MetadataFallback.Media`,
		category: d(O("cat.advanced"), "Metadata"),
		name: "Majoor: Metadata Fallback (Audio/Video)",
		tooltip: "Enable hachoir fallback when ffprobe is missing or fails.",
		type: "boolean",
		defaultValue: a.metadataFallback?.media ?? G.metadataFallback.media,
		onChange: async (e) => {
			let t = !!e, n = !!(a.metadataFallback?.media ?? G.metadataFallback.media);
			a.metadataFallback = a.metadataFallback || {}, a.metadataFallback.media = t, q(a), o("metadataFallback.media");
			try {
				let e = await v({
					image: a.metadataFallback?.image ?? G.metadataFallback.image,
					media: t
				});
				if (!e?.ok) throw Error(e?.error || O("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"));
			} catch (e) {
				a.metadataFallback.media = n, q(a), o("metadataFallback.media"), y(e?.message || O("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"), "error");
			}
		}
	});
	try {
		i().then((e) => {
			if (!e?.ok || !e?.data?.prefs) return;
			let t = e.data.prefs || {}, n = !!(t.image ?? G.metadataFallback.image), r = !!(t.media ?? G.metadataFallback.media);
			a.metadataFallback = a.metadataFallback || {};
			let i = !1;
			a.metadataFallback.image !== n && (a.metadataFallback.image = n, i = !0), a.metadataFallback.media !== r && (a.metadataFallback.media = r, i = !0), i && (q(a), o("metadataFallback"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	t({
		id: `${X}.Db.Timeout`,
		category: d(O("cat.advanced"), "Database"),
		name: "DB Timeout (ms)",
		tooltip: "Client-side DB timeout preference (stored locally).",
		type: "number",
		defaultValue: Number(a.db?.timeoutMs || 5e3),
		attrs: {
			min: 1e3,
			max: 3e4,
			step: 1e3
		},
		onChange: (e) => {
			a.db = a.db || {}, a.db.timeoutMs = Math.max(1e3, Math.min(3e4, Math.round(U(e, 5e3)))), q(a), J(a), o("db.timeoutMs");
		}
	}), t({
		id: `${X}.Db.MaxConnections`,
		category: d(O("cat.advanced"), "Database"),
		name: "DB Max Connections",
		tooltip: "Client-side DB max connections preference (stored locally).",
		type: "number",
		defaultValue: Number(a.db?.maxConnections || 10),
		attrs: {
			min: 1,
			max: 100,
			step: 1
		},
		onChange: (e) => {
			a.db = a.db || {}, a.db.maxConnections = Math.max(1, Math.min(100, Math.round(U(e, 10)))), q(a), J(a), o("db.maxConnections");
		}
	}), t({
		id: `${X}.Db.QueryTimeout`,
		category: d(O("cat.advanced"), "Database"),
		name: "DB Query Timeout (ms)",
		tooltip: "Client-side DB query timeout preference (stored locally).",
		type: "number",
		defaultValue: Number(a.db?.queryTimeoutMs || 1e3),
		attrs: {
			min: 500,
			max: 1e4,
			step: 500
		},
		onChange: (e) => {
			a.db = a.db || {}, a.db.queryTimeoutMs = Math.max(500, Math.min(1e4, Math.round(U(e, 1e3)))), q(a), J(a), o("db.queryTimeoutMs");
		}
	}), t({
		id: `${X}.Observability.Enabled`,
		category: d(O("cat.advanced"), O("setting.obs.enabled.name").replace("Majoor: ", "")),
		name: O("setting.obs.enabled.name"),
		tooltip: O("setting.obs.enabled.desc"),
		type: "boolean",
		defaultValue: !!a.observability?.enabled,
		onChange: (e) => {
			a.observability = a.observability || {}, a.observability.enabled = !!e, q(a), J(a), o("observability.enabled");
		}
	}), t({
		id: `${X}.Observability.RuntimeDashboardMode`,
		category: d(O("cat.advanced"), "Runtime metrics badge"),
		name: "Majoor: Runtime metrics badge",
		tooltip: "Controls the small DB/enrichment/watcher metrics badge in the Assets Manager panel.",
		type: "combo",
		defaultValue: a.observability?.runtimeDashboardMode || G.observability.runtimeDashboardMode,
		options: [
			"autoHide30",
			"always",
			"hidden"
		],
		onChange: (e) => {
			let t = lt(e, [
				"autoHide30",
				"always",
				"hidden"
			], G.observability.runtimeDashboardMode);
			a.observability = a.observability || {}, a.observability.runtimeDashboardMode = t, q(a), o("observability.runtimeDashboardMode");
		}
	}), t({
		id: `${X}.Observability.VerboseErrors`,
		category: d(O("cat.advanced"), "Verbose error logging"),
		name: "Verbose error logging",
		tooltip: "Show detailed error messages in toasts and console. Useful for debugging.",
		type: "boolean",
		defaultValue: !!a.observability?.verboseErrors,
		onChange: (e) => {
			a.observability = a.observability || {}, a.observability.verboseErrors = !!e, q(a), J(a), o("observability.verboseErrors");
		}
	}), t({
		id: `${X}.Observability.VerboseRouteRegistrationLogs`,
		category: d(O("cat.advanced"), "Logs"),
		name: "Majoor: Verbose route registration logs",
		tooltip: "When disabled, Majoor prints a compact startup summary instead of listing every registered API route. Takes effect on the next backend restart.",
		type: "boolean",
		defaultValue: !!(a.observability?.verboseRouteRegistrationLogs ?? G.observability?.verboseRouteRegistrationLogs ?? !1),
		onChange: async (e) => {
			let t = !!e, n = !!(a.observability?.verboseRouteRegistrationLogs ?? G.observability?.verboseRouteRegistrationLogs ?? !1);
			a.observability = a.observability || {}, a.observability.verboseRouteRegistrationLogs = t, q(a), o("observability.verboseRouteRegistrationLogs");
			try {
				let e = await ee(t);
				if (!e?.ok) throw Error(e?.error || "Failed to update route logging settings");
			} catch (e) {
				a.observability.verboseRouteRegistrationLogs = n, q(a), o("observability.verboseRouteRegistrationLogs"), y(e?.message || "Failed to update route logging settings", "error");
			}
		}
	}), (async () => {
		try {
			let e = !!(await u())?.data?.prefs?.enabled;
			a.observability = a.observability || {}, a.observability.verboseRouteRegistrationLogs !== e && (a.observability.verboseRouteRegistrationLogs = e, q(a), o("observability.verboseRouteRegistrationLogs"));
		} catch (e) {
			console.debug?.(e);
		}
	})(), t({
		id: `${X}.Observability.VerboseStartupLogs`,
		category: d(O("cat.advanced"), "Logs"),
		name: "Majoor: Verbose startup logs",
		tooltip: "When disabled, Majoor suppresses most informational bootstrap logs during backend startup while keeping warnings and errors. Takes effect on the next backend restart.",
		type: "boolean",
		defaultValue: !!(a.observability?.verboseStartupLogs ?? G.observability?.verboseStartupLogs ?? !1),
		onChange: async (e) => {
			let t = !!e, n = !!(a.observability?.verboseStartupLogs ?? G.observability?.verboseStartupLogs ?? !1);
			a.observability = a.observability || {}, a.observability.verboseStartupLogs = t, q(a), o("observability.verboseStartupLogs");
			try {
				let e = await ne(t);
				if (!e?.ok) throw Error(e?.error || "Failed to update startup logging settings");
			} catch (e) {
				a.observability.verboseStartupLogs = n, q(a), o("observability.verboseStartupLogs"), y(e?.message || "Failed to update startup logging settings", "error");
			}
		}
	}), (async () => {
		try {
			let e = !!(await w())?.data?.prefs?.enabled;
			a.observability = a.observability || {}, a.observability.verboseStartupLogs !== e && (a.observability.verboseStartupLogs = e, q(a), o("observability.verboseStartupLogs"));
		} catch (e) {
			console.debug?.(e);
		}
	})();
	{
		let e = "HuggingFace Token", r = "", i = null, l = 0, u = !!a.ai?.huggingFaceTokenVisible, f = () => {
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
		}, p = (e) => {
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
			category: d(O("cat.advanced"), e),
			name: "Show HuggingFace token",
			tooltip: "Show or hide the HuggingFace token while editing.",
			type: "boolean",
			defaultValue: u,
			onChange: (e) => {
				let t = !!e;
				u = t, a.ai = a.ai || {}, a.ai.huggingFaceTokenVisible = t, q(a), o("ai.huggingFaceTokenVisible"), setTimeout(f, 0);
			}
		}), t({
			id: `${X}.AI.HuggingFaceToken`,
			category: d(O("cat.advanced"), e),
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
				if (t !== r) {
					try {
						i &&= (clearTimeout(i), null);
					} catch (e) {
						console.debug?.(e);
					}
					i = setTimeout(async () => {
						i = null;
						let e = ++l;
						try {
							let n = await s(t);
							if (e !== l) return;
							if (!n?.ok) throw Error(n?.error || "Failed to update HuggingFace token");
							r = t, o("ai.huggingFaceToken"), t ? y("HuggingFace token saved", "success") : y("HuggingFace token cleared", "success", void 0, { noHistory: !0 });
						} catch (t) {
							if (e !== l) return;
							y(t?.message || "Failed to update HuggingFace token", "error");
						}
					}, 900);
				}
			}
		}), setTimeout(f, 0), (async () => {
			try {
				let e = (await n())?.data?.prefs || {}, t = !!e?.has_token, r = String(e?.token_hint || "").trim();
				p(t ? `Configured ${r || "(saved)"}` : "Paste HuggingFace token (hf_...)");
			} catch (e) {
				console.debug?.(e);
			}
		})(), t({
			id: `${X}.AI.VerboseLogs`,
			category: d(O("cat.advanced"), e),
			name: "Majoor: Verbose AI logs",
			tooltip: "Enable detailed HuggingFace/SigLIP2/X-CLIP logs and progress bars during model download/loading.",
			type: "boolean",
			defaultValue: !!(a.ai?.verboseAiLogs ?? G.ai?.verboseAiLogs ?? !1),
			onChange: async (e) => {
				let t = !!e, n = !!(a.ai?.verboseAiLogs ?? G.ai?.verboseAiLogs ?? !1);
				a.ai = a.ai || {}, a.ai.verboseAiLogs = t, q(a), o("ai.verboseAiLogs");
				try {
					let e = await c(t);
					if (!e?.ok) throw Error(e?.error || "Failed to update AI logging settings");
				} catch (e) {
					a.ai.verboseAiLogs = n, q(a), o("ai.verboseAiLogs"), y(e?.message || "Failed to update AI logging settings", "error");
				}
			}
		}), (async () => {
			try {
				let e = !!(await D())?.data?.prefs?.enabled;
				a.ai = a.ai || {}, a.ai.verboseAiLogs !== e && (a.ai.verboseAiLogs = e, q(a), o("ai.verboseAiLogs"));
			} catch (e) {
				console.debug?.(e);
			}
		})();
	}
	t({
		id: `${X}.AI.VectorStats`,
		category: d(O("cat.advanced"), "AI / Vector Search"),
		name: "Vector Index Status",
		tooltip: "Current status of the SigLIP2/X-CLIP vector index used for semantic search",
		type: "text",
		defaultValue: "Loading vector status..."
	}), (async () => {
		try {
			let e = await te();
			e?.ok ? console.debug?.("[Majoor] Vector status:", `${e.data?.total || 0} assets indexed | Model: ${e.data?.model || "N/A"}`) : console.debug?.("[Majoor] Vector status unavailable");
		} catch (e) {
			console.debug?.("[Majoor] Vector status fetch failed", e);
		}
	})(), t({
		id: `${X}.AI.VectorBackfillAction`,
		category: d(O("cat.advanced"), "AI / Vector Search"),
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
				y(O("toast.vectorBackfillStarting", "Starting vector backfill... This may take a while."), "info", void 0, { history: {
					...t.history,
					status: "started",
					detail: "Starting vector backfill... This may take a while."
				} });
				let e = await b(64, { onProgress: (e) => {
					let n = String(e?.status || "running").toLowerCase() || "running", r = e?.progress || e?.result || {}, i = Number(r?.candidates ?? r?.processed ?? 0), a = Number(r?.indexed ?? 0), o = Number(r?.skipped ?? 0), s = Number(r?.errors ?? 0), c = Math.max(i, a + o + s), l = c > 0 ? Math.round((a + o + s) / c * 100) : null, u = n === "queued" ? "Vector backfill queued" : `Candidates ${i}, indexed ${a}, skipped ${o}, errors ${s}`;
					le({
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
					].includes(r), a = n?.progress || {}, o = Number(n?.processed ?? a?.candidates ?? 0), s = Number(n?.indexed ?? a?.indexed ?? 0), c = Number(n?.skipped ?? a?.skipped ?? 0);
					if (i) {
						let e = String(n?.job_id || "").trim();
						y(O("toast.vectorBackfillRunning", "Vector backfill still running in background{job}.", { job: e ? ` (job ${e.slice(0, 8)})` : "" }), "info", void 0, { history: {
							...t.history,
							status: "running",
							detail: `Vector backfill still running in background${e ? ` (${e.slice(0, 8)})` : ""}.`,
							progress: {
								current: s + c,
								total: Math.max(o, s + c),
								percent: Math.max(o, s + c) > 0 ? Math.round((s + c) / Math.max(o, s + c) * 100) : null,
								indexed: s,
								skipped: c,
								label: "running"
							}
						} });
					} else y(O("toast.vectorBackfillComplete", "Vector backfill complete! Processed: {processed}, Indexed: {indexed}, Skipped: {skipped}", {
						processed: o,
						indexed: s,
						skipped: c
					}), "success", void 0, { history: {
						...t.history,
						status: "succeeded",
						detail: `Processed ${o}, indexed ${s}, skipped ${c}`,
						progress: {
							current: o,
							total: o,
							percent: o > 0 ? 100 : null,
							indexed: s,
							skipped: c,
							label: "done"
						}
					} });
					try {
						let e = await te();
						e?.ok && console.debug?.("[Majoor] Vector stats after backfill:", e.data);
					} catch (e) {
						console.debug?.("[Majoor] Failed to refresh vector stats:", e);
					}
				} else throw Error(e?.error || O("toast.vectorBackfillFailedGeneric", "Backfill failed"));
			} catch (e) {
				let n = e?.message || String(e || O("status.unknown", "unknown"));
				y(O("toast.vectorBackfillFailedDetail", "Vector backfill failed: {error}", { error: n }), "error", void 0, { history: {
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
var Mn = "Majoor", Nn = "Majoor Assets Manager";
function Pn(e, t, n) {
	let r = (e, t) => [
		Nn,
		e,
		t
	];
	e({
		id: `${Mn}.AI.VectorSearchEnabled`,
		category: r(O("cat.search", "Search"), "AI"),
		name: O("setting.ai.vector.enabled.name", "Enable AI semantic search"),
		tooltip: O("setting.ai.vector.enabled.desc", "Enable/disable AI vector search features (SigLIP2/X-CLIP: description search, prompt alignment, AI tag suggestions, smart collections)."),
		type: "boolean",
		defaultValue: !!(t.ai?.vectorSearchEnabled ?? !0),
		onChange: async (e) => {
			t.ai = t.ai || {};
			let r = !!(t.ai.vectorSearchEnabled ?? !0), i = !!e;
			t.ai.vectorSearchEnabled = i, q(t), J(t), n("ai.vectorSearchEnabled");
			try {
				let e = await ae(i);
				if (!e?.ok) {
					t.ai.vectorSearchEnabled = r, q(t), J(t), n("ai.vectorSearchEnabled"), y(e?.error || "Failed to update AI vector search setting", "error");
					return;
				}
				y(i ? "AI semantic search enabled" : "AI semantic search disabled", "info", 2200);
			} catch (e) {
				t.ai.vectorSearchEnabled = r, q(t), J(t), n("ai.vectorSearchEnabled"), y(e?.message || "Failed to update AI vector search setting", "error");
			}
		}
	}), e({
		id: `${Mn}.AI.VectorCaptionOnIndex`,
		category: r(O("cat.search", "Search"), "AI"),
		name: O("setting.ai.vector.captionOnIndex.name", "Generate AI captions during indexing"),
		tooltip: O("setting.ai.vector.captionOnIndex.desc", "Allow automatic vector indexing and backfill to run Florence-2 captions for image assets. This is slower and can use significant VRAM/CPU; leave it off for faster grid startup."),
		type: "boolean",
		defaultValue: !!(t.ai?.vectorCaptionOnIndex ?? !1),
		onChange: async (e) => {
			t.ai = t.ai || {};
			let r = !!(t.ai.vectorCaptionOnIndex ?? !1), i = !!e;
			t.ai.vectorCaptionOnIndex = i, q(t), J(t), n("ai.vectorCaptionOnIndex");
			try {
				let e = await ae({ caption_on_index: i });
				if (!e?.ok) {
					t.ai.vectorCaptionOnIndex = r, q(t), J(t), n("ai.vectorCaptionOnIndex"), y(e?.error || "Failed to update AI caption indexing setting", "error");
					return;
				}
				i && y("AI captions during indexing enabled", "info", 2600);
			} catch (e) {
				t.ai.vectorCaptionOnIndex = r, q(t), J(t), n("ai.vectorCaptionOnIndex"), y(e?.message || "Failed to update AI caption indexing setting", "error");
			}
		}
	}), e({
		id: `${Mn}.Search.MaxResults`,
		category: r(O("cat.search", "Search")),
		name: O("setting.search.maxResults.name", "Max search results (client)"),
		tooltip: O("setting.search.maxResults.desc", "Maximum number of results requested per search. The backend still enforces MAJOOR_SEARCH_MAX_LIMIT; increase that env var if you need a higher hard cap."),
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
		id: `${Mn}.EnvVars.Reference`,
		category: r(O("cat.advanced"), "Environment variables"),
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
var Fn = "Majoor Assets Manager", In = /^\s*Majoor:\s*/i, Z = Object.freeze({
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
]), Rn = "Majoor.General.ResetAllSettings", zn = "mjr-settings-reset-btn", Bn = null, Vn = null;
function Hn(e) {
	let t = String(e || "").trim();
	return t ? /^Majoor\.(Safety|Security)\./.test(t) ? Z.SECURITY : /^Majoor\.(Paths|ProbeBackend|MetadataFallback|Db|Observability)\./.test(t) || t === "Majoor.EnvVars.Reference" || t === "Majoor.AI.HuggingFaceTokenVisible" || t === "Majoor.AI.HuggingFaceToken" || t === "Majoor.AI.VerboseLogs" || t === "Majoor.AI.VectorStats" || t === "Majoor.AI.VectorBackfillAction" ? Z.ADVANCED : /^Majoor\.(Viewer|WorkflowMinimap)\./.test(t) ? Z.VIEWER : /^Majoor\.Feed\./.test(t) ? Z.GENERATED_FEED : /^Majoor\.(AutoScan|Scan|Watcher|ExecutionGrouping|RatingTagsSync)\./.test(t) ? Z.INDEXING : t === "Majoor.RtHydrate.Concurrency" ? Z.ADVANCED : t === "Majoor.AI.VectorSearchEnabled" || t === "Majoor.AI.VectorCaptionOnIndex" || /^Majoor\.Search\./.test(t) ? Z.SEARCH_AI : /^Majoor\.(Grid|Cards|Badges|Sidebar|InfiniteScroll|General)\./.test(t) ? Z.ASSETS_PANEL : Z.GENERAL : Z.GENERAL;
}
function Un(e) {
	let t = Array.isArray(e?.category) ? e.category.filter(Boolean) : [], n = Hn(e?.id), r = String(t[1] || t[0] || "").trim(), i = String(t[2] || "").trim(), a = String(e?.name || "").replace(In, "").trim();
	return [
		Fn,
		n,
		i || r || a || n
	];
}
var Wn = !1, Gn = null, Kn = null, qn = !1, Jn = /* @__PURE__ */ new Set();
function Yn(e) {
	if (!e || typeof e != "object") return null;
	let t = { ...e };
	try {
		typeof t.name == "string" && (t.name = t.name.replace(In, "").trim());
	} catch (e) {
		console.debug?.(e);
	}
	try {
		t.category = Un(t);
	} catch {
		t.category = [Fn, Z.GENERAL];
	}
	return !t.tooltip && typeof t.name == "string" && t.name.trim() && (t.tooltip = t.name.trim()), t;
}
function Xn(e, t, n) {
	let r = String(t?.id || "").trim();
	if (!r || Jn.has(r)) return !1;
	Jn.add(r);
	try {
		return fe(e, r, n);
	} finally {
		Jn.delete(r);
	}
}
function Zn(e, t) {
	if (!t || typeof t != "object") return t;
	let n = { ...t };
	Xn(e, n, n.defaultValue);
	let r = n.onChange;
	return n.onChange = (t, ...i) => {
		if (Xn(e, n, t), typeof r == "function") return r(t, ...i);
		n.defaultValue = t;
	}, n;
}
function Qn(e) {
	try {
		return JSON.parse(JSON.stringify(e || {}));
	} catch {
		return { ...G };
	}
}
function $n(e, t, n, { wrapForComfy: r = !0 } = {}) {
	let i = [], a = (e) => {
		let n = Yn(e);
		n && i.push(r ? Zn(t, n) : n);
	};
	return en(a, e, n), un(a, e, n), rn(a, e, n), sn(a, e, n), kn(a, e, n), jn(a, e, n, t), Pn(a, e, n), i;
}
function er(e, t) {
	if (e === t) return !0;
	try {
		return JSON.stringify(e) === JSON.stringify(t);
	} catch {
		return !1;
	}
}
function tr(e) {
	return e ? e.querySelector(".form-input") || e.querySelector(".p-inputgroup") || e.querySelector(".setting-input") || e.querySelector("[class*='input']") : null;
}
function nr(e, t) {
	let n = document.createElement("button");
	return n.type = "button", n.className = zn, n.textContent = e, n.title = t, n.style.marginLeft = "8px", n.style.minWidth = e.length > 2 ? "auto" : "24px", n.style.height = "24px", n.style.padding = e.length > 2 ? "0 10px" : "0", n.style.borderRadius = "6px", n.style.border = "1px solid var(--border-color, #555)", n.style.background = "var(--comfy-input-bg, #2b2b2b)", n.style.color = "var(--input-text, inherit)", n.style.cursor = "pointer", n.style.fontSize = "12px", n.style.lineHeight = "22px", n.style.flexShrink = "0", n;
}
function rr(e, t, n) {
	String(e?.id || "").trim() && (Xn(n, e, t), typeof e?.onChange == "function" && e.onChange(t));
}
function ir(e, t, n, r) {
	let i = !er(de(r, t.id, t.defaultValue), n);
	e.disabled = !i, e.style.opacity = i ? "1" : "0.45";
}
function ar() {
	if (typeof document > "u" || !Vn) return;
	let { app: e, definitions: t, defaultValues: n } = Vn, r = document.querySelector(`[data-setting-id="${Rn}"]`), i = tr(r);
	if (r && i && !r.getAttribute("data-mjr-reset-injected")) {
		r.setAttribute("data-mjr-reset-injected", "true"), i.innerHTML = "";
		let a = nr("Reset all settings", "Reset all Majoor settings to defaults");
		a.onclick = (r) => {
			r.preventDefault(), r.stopPropagation();
			for (let r of t) r.id !== Rn && n.has(r.id) && rr(r, n.get(r.id), e);
			ar();
		}, i.appendChild(a);
	}
	for (let r of t) {
		if (!r?.id || r.id === Rn || !n.has(r.id)) continue;
		let t = document.querySelector(`[data-setting-id="${r.id}"]`);
		if (!t || t.getAttribute("data-mjr-reset-injected")) continue;
		let i = tr(t);
		if (!i) continue;
		t.setAttribute("data-mjr-reset-injected", "true");
		let a = nr("Reset", "Reset this setting to default");
		ir(a, r, n.get(r.id), e), a.onclick = (t) => {
			t.preventDefault(), t.stopPropagation();
			let i = n.get(r.id);
			rr(r, i, e), ir(a, r, i, e);
		}, i.appendChild(a);
	}
}
function or(e, t, n) {
	typeof document > "u" || typeof MutationObserver > "u" || (Vn = {
		app: e,
		definitions: t,
		defaultValues: new Map(n.filter((e) => e?.id && e.id !== Rn).map((e) => [e.id, e.defaultValue]))
	}, ar(), !Bn && (Bn = new MutationObserver(() => ar()), Bn.observe(document.body, {
		childList: !0,
		subtree: !0
	})));
}
function sr(e, t, { initRuntime: n = !1 } = {}) {
	if (Kn) typeof t == "function" && Kn.onAppliedListeners.add(t), e && !Kn.app && (Kn.app = e);
	else {
		let n = K();
		n.i18n = n.i18n || {}, typeof n.i18n.followComfyLanguage == "boolean" ? ve(!!n.i18n.followComfyLanguage) : (n.i18n.followComfyLanguage = !0, ve(!0), q(n));
		let r = /* @__PURE__ */ new Set();
		typeof t == "function" && r.add(t);
		let i = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set(), o = () => {
			if (!i.size) return;
			let e = Array.from(i);
			i.clear();
			for (let t of e) ct("mjr-settings-changed", { key: t }, { warnPrefix: "[Majoor]" });
		}, s = () => {
			if (!a.size) return;
			let e = Array.from(a);
			a.clear();
			for (let t of e) ct("mjr-settings-changed", { key: t }, { warnPrefix: "[Majoor]" });
		}, c = Qt(o, 120), l = Qt(s, 450), u = (e) => {
			typeof e == "string" && i.add(e), c();
		}, d = (e) => {
			typeof e == "string" && a.add(e), l();
		}, f = () => {
			let e = K();
			Object.assign(n, e), J(n), u("storage");
		}, p = (e) => {
			!e || e.key !== "mjrSettings" || e.newValue !== e.oldValue && f();
		};
		if (!Wn) {
			if (Gn && typeof window < "u") try {
				window.removeEventListener("storage", Gn);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				window.addEventListener("storage", p), Wn = !0, Gn = p;
			} catch (e) {
				console.debug?.(e);
			}
		}
		Kn = {
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
	if (n && !qn) {
		let t = e || Kn.app, n = Kn.settings;
		me(t), J(n), he(t), It(), Lt(), Rt(), n?.watcher && typeof n.watcher.enabled == "boolean" && re(!!n.watcher.enabled).catch(() => {}), Xt(), qn = !0;
	}
	return Kn;
}
var cr = (e, t) => sr(e, t, { initRuntime: !0 }).settings, lr = (e, t) => {
	let n = sr(e, t, { initRuntime: !1 });
	Object.assign(n.settings, K());
	let r = e || n.app, i = $n(n.settings, r, n.notifyApplied), a = $n(Qn(G), r, () => {}, { wrapForComfy: !1 });
	return i.unshift(Zn(r, {
		id: Rn,
		category: [
			Fn,
			Z.GENERAL,
			"Reset"
		],
		name: "Reset all settings to defaults",
		tooltip: "Reset every Majoor Assets Manager setting to its default value.",
		type: "text",
		defaultValue: ""
	})), or(r, i, a), i;
};
try {
	let e = K();
	e?.watcher && typeof e.watcher.enabled == "boolean" && o().then((e) => {
		let t = !!e?.ok && !!e?.data?.enabled, n = K();
		n.watcher = n.watcher || {}, typeof t == "boolean" && t !== !!n.watcher.enabled && (n.watcher.enabled = t, q(n), ct("mjr-settings-changed", { key: "watcher.enabled" }, { warnPrefix: "[Majoor]" }));
	}).catch(() => {});
} catch (e) {
	console.debug?.(e);
}
//#endregion
//#region ui/features/status/AssetStatusDotTheme.ts
function ur(e) {
	return String(e || "").trim().toLowerCase();
}
function dr({ dot: e = null, asset: t = null, scope: n = "" } = {}) {
	let r = ur(n);
	if (r) return r === "custom";
	let i = ur(t?.type || t?.scope);
	if (i) return i === "custom";
	try {
		let t = ur(e?.closest?.(".mjr-grid")?.dataset?.mjrScope);
		if (t) return t === "custom";
	} catch (e) {
		console.debug?.(e);
	}
	return !1;
}
function fr(e, t = {}) {
	let n = ur(e);
	return dr(t) ? n === "pending" || n === "info" ? "var(--mjr-browser-status-info, #4DB6AC)" : n === "success" ? "var(--mjr-browser-status-success, #2E7D32)" : n === "warning" ? "var(--mjr-browser-status-warning, #FFB74D)" : n === "error" ? "var(--mjr-browser-status-error, #EF5350)" : "var(--mjr-browser-status-neutral, #90A4AE)" : n === "pending" || n === "info" ? "var(--mjr-status-info, #64B5F6)" : n === "success" ? "var(--mjr-status-success, #4CAF50)" : n === "warning" ? "var(--mjr-status-warning, #FFA726)" : n === "error" ? "var(--mjr-status-error, #f44336)" : "var(--mjr-status-neutral, #666)";
}
//#endregion
//#region ui/stores/useRuntimeStore.ts
var pr = $e("mjr-runtime", () => {
	let e = F(null), t = F(null), n = F(!1), r = F(0), i = F(null), a = F(null), o = F(null), s = F(null), c = F(null), l = F([]), u = B(() => !!i.value), d = B(() => {
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
function mr() {
	try {
		return et() ? pr() : null;
	} catch {
		return null;
	}
}
//#endregion
//#region ui/stores/runtimeEnrichmentState.ts
var hr = Symbol.for("majoor.assets_manager.runtime_state");
function gr() {
	return {
		api: null,
		assetsDeletedHandler: null,
		enrichmentActive: !1,
		enrichmentQueueLength: 0
	};
}
function _r() {
	try {
		let e = typeof globalThis < "u" ? globalThis : {};
		return (!e[hr] || typeof e[hr] != "object") && (e[hr] = gr()), e[hr];
	} catch {
		return gr();
	}
}
function vr(e, t) {
	let n = mr();
	if (n) {
		n.setEnrichmentState(e, t);
		return;
	}
	let r = _r();
	r.enrichmentActive = !!e, r.enrichmentQueueLength = Math.max(0, Number(t || 0) || 0);
}
function yr() {
	let e = mr();
	if (e) return e.getEnrichmentState();
	let t = _r();
	return {
		active: !!t.enrichmentActive,
		queueLength: Math.max(0, Number(t.enrichmentQueueLength || 0) || 0)
	};
}
//#endregion
//#region ui/features/grid/AssetCardRenderer.ts
function br(e) {
	try {
		return String(e || "").trim().toLowerCase();
	} catch {
		return "";
	}
}
function xr(e) {
	try {
		return (String(e || "").split(".").pop() || "").toUpperCase();
	} catch {
		return "";
	}
}
function Sr(e) {
	try {
		let t = String(e || ""), n = t.lastIndexOf("."), r = n > 0 ? t.slice(0, n) : t;
		return String(r || "").trim().toLowerCase();
	} catch {
		return "";
	}
}
function Cr(e) {
	try {
		if (String(e?.kind || "").toLowerCase() !== "video") return !1;
		let t = String(e?.filename || "").toLowerCase();
		return t.includes("-audio") || t.includes("_audio");
	} catch {
		return !1;
	}
}
function wr(e) {
	try {
		let t = String(e?.kind || "").toLowerCase(), n = 0;
		Cr(e) ? n = 2 : t === "video" && (n = 1);
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
function Tr(e, t) {
	for (let n = 0; n < Math.max(e.length, t.length); n++) {
		let r = (e[n] || 0) - (t[n] || 0);
		if (r !== 0) return r;
	}
	return 0;
}
function Er(e) {
	if (!Array.isArray(e) || e.length === 0) return null;
	if (e.length === 1) return e[0];
	let t = e[0], n = wr(t);
	for (let r = 1; r < e.length; r++) {
		let i = e[r], a = wr(i);
		Tr(a, n) > 0 && (t = i, n = a);
	}
	return t;
}
function Dr(e, t) {
	if (!e || !Array.isArray(t) || t.length === 0 || (Number(e?.generation_time_ms ?? e?.metadata?.generation_time_ms ?? 0) || 0) > 0) return e;
	let n = t.find((e) => (Number(e?.generation_time_ms ?? e?.metadata?.generation_time_ms ?? 0) || 0) > 0);
	if (!n) return e;
	let r = Number(n?.generation_time_ms ?? n?.metadata?.generation_time_ms ?? 0) || 0;
	return r <= 0 ? e : (e.generation_time_ms = r, !e.has_generation_data && n?.has_generation_data && (e.has_generation_data = n.has_generation_data), e);
}
function Or(e, t) {
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
function kr(e) {
	try {
		return !!e()?.siblings?.hidePngSiblings;
	} catch {
		return !1;
	}
}
function Ar(e) {
	return `${String(e?.source || e?.type || "").trim().toLowerCase()}|${String(e?.root_id || e?.custom_root_id || "").trim().toLowerCase()}|${String(e?.subfolder || "").trim().toLowerCase()}`;
}
function jr(e) {
	let t = br(e?.filename);
	return t ? `${Ar(e)}|${t}` : "";
}
function Mr(e, t = xr(e?.filename || "")) {
	let n = Or(e, t), r = String(e?.filename || "").trim();
	if (!r) return "";
	let i = Ar(e);
	if (n === "model3d") return `${i}|model3d|${r.toLowerCase()}`;
	let a = Sr(r);
	return a ? `${i}|media|${a}` : "";
}
function Nr(e) {
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
function Pr(e, t, n) {
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
function Fr(e, t, n, r) {
	let i = n.stemMap.get(t);
	if (!i?.length) return [];
	let a = [];
	for (let e = i.length - 1; e >= 0; e--) r(i[e]) && (a.push(i[e]), i.splice(e, 1));
	return i.length || n.stemMap.delete(t), a;
}
function Ir(e, t, n) {
	if (!kr(n)) return {
		hidden: !1,
		hideEnabled: !1,
		removed: []
	};
	let r = Nr(t), i = String(e?.filename || ""), a = xr(i), o = Or(e, a), s = Mr(e, a);
	if (!s) return {
		hidden: !1,
		hideEnabled: !0,
		removed: []
	};
	if (o === "video" || o === "audio" || o === "model3d" || a === "WEBP") return r.nonImageSiblingKeys.add(s), {
		hidden: !1,
		hideEnabled: !0,
		removed: Fr(t, s, r, (e) => xr(e?.filename || "") === "PNG")
	};
	if (a === "PNG") {
		let t = `${Ar(e)}|model3d|${Sr(i)}`;
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
function Lr(e, t, n, r) {
	let i = kr(r.loadMajoorSettings), a = n.filenameCounts || /* @__PURE__ */ new Map();
	n.filenameCounts = a, r.clearGridMessage(e);
	let o = r.ensureVirtualGrid(e, n);
	if (!o) return 0;
	i || (n.hiddenPngSiblings = 0), n.assetKeyFn = r.assetKey;
	let s = Nr(n), c = /* @__PURE__ */ new Map();
	for (let e of n.assets || []) {
		let t = jr(e);
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
				let l = Dr(Er(s), s), u = s.filter((e) => e !== l);
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
		let t = xr(String(e?.filename || "")), i = Ir(e, n, r.loadMajoorSettings);
		for (let e of i.removed || []) f.add(e);
		if (i.hidden) {
			n.hiddenPngSiblings += 1;
			continue;
		}
		let a = jr(e);
		if (a) {
			let t = c.get(a);
			t || (t = [], c.set(a, t)), t.push(e);
		}
		let o = r.assetKey(e);
		if (!o || s.seenKeys.has(o) || e.id != null && s.assetIdSet.has(String(e.id))) continue;
		s.seenKeys.add(o), e.id != null && s.assetIdSet.add(String(e.id)), d.push(e);
		let u = Mr(e, t);
		if (u) {
			let t = s.stemMap.get(u);
			t || (t = [], s.stemMap.set(u, t)), t.push(e);
		}
		l++;
	}
	if (f.size > 0) {
		n.hiddenPngSiblings += f.size, n.assets = n.assets.filter((e) => !f.has(e));
		for (let e = d.length - 1; e >= 0; e--) f.has(d[e]) && (d.splice(e, 1), l = Math.max(0, l - 1));
		for (let e of f) Pr(n, e, s);
		try {
			for (let e of f) {
				let t = jr(e);
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
function Rr({ ext: e = "", filename: t = "", count: n = 0, paths: r = [] } = {}) {
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
function zr(e, t, n = !1, r = null) {
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
	}[Or({ kind: t }, a)], s = o ? `var(${o}, #607D8B)` : "#607D8B", c = n ? "var(--mjr-badge-duplicate-alert, #ff1744)" : s;
	i.textContent = a + (n ? "+" : ""), i.title = n ? Rr({
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
function Br(e, t, n = null) {
	if (e) try {
		let r = e.dataset?.mjrExt || "", i = e.dataset?.mjrBadgeBg || "var(--mjr-badge-image, #607D8B)";
		e.textContent = String(r || "") + (t ? "+" : ""), e.title = t ? Rr({
			ext: r,
			filename: n?.filename || "",
			count: n?.count,
			paths: n?.paths
		}) : `${r} file`, e.style.background = t ? "var(--mjr-badge-duplicate-alert, #ff1744)" : i, e.style.cursor = t ? "pointer" : "default";
	} catch (e) {
		console.debug?.(e);
	}
}
function Vr(e) {
	return e === !0 ? !0 : e === !1 ? !1 : e === 1 || e === "1" ? !0 : e === 0 || e === "0" ? !1 : null;
}
function Hr(e, t = []) {
	if (!e || typeof e != "object") return null;
	for (let n of t) if (e[n] != null) return e[n];
	return null;
}
function Ur(e) {
	return typeof e == "string" && e.trim().length > 0;
}
function Wr(e) {
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
function Gr(e) {
	let t = Hr(e, [
		"auto_tags",
		"autoTags",
		"ai_auto_tags",
		"aiAutoTags",
		"suggested_tags",
		"suggestedTags"
	]), n = Hr(e, [
		"enhanced_caption",
		"enhancedCaption",
		"enhanced_prompt",
		"enhancedPrompt",
		"ai_enhanced_prompt",
		"aiEnhancedPrompt"
	]), r = Vr(Hr(e, [
		"has_ai_auto_tags",
		"hasAiAutoTags",
		"ai_has_auto_tags",
		"aiHasAutoTags"
	])), i = Vr(Hr(e, [
		"has_ai_enhanced_caption",
		"hasAiEnhancedCaption",
		"ai_has_enhanced_caption",
		"aiHasEnhancedCaption"
	])), a = Vr(Hr(e, [
		"has_ai_vector",
		"hasAiVector",
		"has_vector_embedding",
		"hasVectorEmbedding",
		"vector_indexed",
		"vectorIndexed"
	])), o = Vr(Hr(e, [
		"has_ai_info",
		"hasAiInfo",
		"ai_indexed",
		"aiIndexed"
	])), s = r === !0 || r === null && Wr(t), c = i === !0 || i === null && Ur(n), l = a === !0 || o === !0;
	return {
		hasAiInfo: o === !0 || s || c || l,
		hasAutoTags: s,
		hasEnhancedPrompt: c,
		hasVectorIndexed: l
	};
}
function Kr(e) {
	let t = document.createElement("span");
	t.className = "mjr-workflow-dot mjr-asset-status-dot";
	let n = Vr(e?.has_workflow ?? e?.hasWorkflow), r = Vr(e?.has_generation_data ?? e?.hasGenerationData), i = yr(), a = i.queueLength, o = i.active || a > 0, s = "Pending: parsing metadata...", c = n === !0 || r === !0, l = n === !1 || r === !1, u = n === null || r === null;
	n === !0 && r === !0 ? s = "Complete: workflow + generation data detected" : c ? s = n === !0 ? "Partial: workflow only (generation data missing)" : "Partial: generation data only (workflow missing)" : l && !c && !u ? s = "None: no workflow or generation data found" : u && (s = "Pending: metadata not parsed yet");
	let d = u ? "pending" : n === !0 && r === !0 ? "success" : c ? "warning" : "error";
	o && d !== "success" && (d = "pending", s = a > 0 ? `Pending: database metadata enrichment in progress (${a} queued)` : "Pending: database metadata enrichment in progress"), qr(t, d, s, { asset: e });
	let f = Gr(e);
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
function qr(e, t, n = "", r = {}) {
	if (!e) return;
	let i = String(t || "").toLowerCase(), a = fr(i, {
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
function Jr(e) {
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
function Yr(e) {
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
function Xr(e) {
	let t = Number(e) / 1e3;
	return t >= 60 ? "#FF9800" : t >= 30 ? "#FFC107" : t >= 10 ? "#8BC34A" : "#4CAF50";
}
function Zr(e) {
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
function Qr(e, { maxMs: t = 864e5 } = {}) {
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
function $r(e) {
	let t = document.createElement("div");
	t.className = "mjr-tags-badge";
	let n = Yr(e);
	return n.length === 0 ? (t.style.display = "none", t) : (t.textContent = n.join(", "), t.title = `Tags: ${n.join(", ")}`, t.style.cssText = "\n        position: absolute;\n        bottom: 6px;\n        left: 6px;\n        padding: 3px 6px;\n        border-radius: 4px;\n        background: rgba(0,0,0,0.8);\n        color: var(--mjr-tag-color, #90CAF9);\n        font-size: 9px;\n        max-width: 80%;\n        overflow: hidden;\n        text-overflow: ellipsis;\n        white-space: nowrap;\n        pointer-events: none;\n        z-index: 10;\n        box-shadow: 0 2px 4px rgba(0,0,0,0.3);\n    ", t);
}
//#endregion
//#region ui/utils/safeCall.ts
var ei = () => {};
function ti(e) {
	try {
		return !!A?.[e];
	} catch {
		return !1;
	}
}
function ni(e, t) {
	try {
		console.warn(`[Majoor] ${e}`, t);
	} catch (e) {
		console.debug?.(e);
	}
}
function ri(e, t = "safeCall") {
	try {
		return e?.();
	} catch (e) {
		ti("DEBUG_SAFE_CALL") && ni(t, e);
		return;
	}
}
function ii(e, t, n, r, i = "safeAddListener") {
	try {
		return e?.addEventListener?.(t, n, r), () => {
			try {
				e?.removeEventListener?.(t, n, r);
			} catch (e) {
				ti("DEBUG_SAFE_LISTENERS") && ni(`${i}:remove:${String(t || "")}`, e);
			}
		};
	} catch (e) {
		return ti("DEBUG_SAFE_LISTENERS") && ni(`${i}:add:${String(t || "")}`, e), ei;
	}
}
//#endregion
//#region ui/utils/mediaFps.ts
function ai(e) {
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
function oi(e) {
	try {
		let t = e, n = t.metadata_raw || {}, r = (n.raw_ffprobe || {}).video_stream || {};
		return ai(t.fps) ?? ai(n.fps) ?? ai(n.frame_rate) ?? ai(r.avg_frame_rate) ?? ai(r.r_frame_rate);
	} catch {
		return null;
	}
}
function si(e, t) {
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
function ci(e) {
	let t = Number(e);
	return !Number.isFinite(t) || t <= 0 ? "" : Math.abs(t - Math.round(t)) < .001 ? `${Math.round(t)} fps` : `${t.toFixed(3).replace(/\.?0+$/, "")} fps`;
}
function li(e, t = 30) {
	let n = ai(e);
	if (n != null) return Math.max(1, Math.round(n * 1e3) / 1e3);
	let r = ai(t);
	return r == null ? 30 : Math.max(1, Math.round(r * 1e3) / 1e3);
}
//#endregion
//#region ui/vue/majoorPrimeVue.ts
var ui = {
	Button: Ie,
	Checkbox: Xe,
	InputText: He,
	Select: Je,
	ToggleButton: Ge,
	Badge: Le,
	Tag: Pe,
	Dialog: Be,
	Menu: qe,
	Listbox: We,
	Tree: Ye,
	VirtualScroller: Fe
};
function di(e) {
	return e.use(ze, {
		ripple: !1,
		unstyled: !0,
		zIndex: { overlay: 10100 }
	}), e.use(Ue), e.use(Ke), Object.entries(ui).forEach(([t, n]) => {
		e.component(`M${t}`, n);
	}), e;
}
//#endregion
//#region ui/vue/createVueApp.ts
function fi(e, t = void 0) {
	let n = tt(), r = Re(e, t);
	return r.use(n), di(r), {
		app: r,
		pinia: n
	};
}
var pi = /* @__PURE__ */ new Map();
function mi(e, t, n) {
	try {
		window.dispatchEvent(new CustomEvent("mjr:keepalive-attached", { detail: {
			mountKey: String(e || "_mjrVueApp"),
			host: t || null,
			container: n || null
		} }));
	} catch {}
}
function hi(e) {
	let t = document.createElement("div");
	return t.dataset.mjrKeepAliveHost = String(e || "_mjrVueApp"), t.style.height = "100%", t.style.width = "100%", t.style.minHeight = "0", t.style.display = "flex", t.style.flexDirection = "column", t.style.overflow = "hidden", t;
}
function gi(e, t) {
	!e || !t || (e.style.height = "100%", e.style.minHeight = "0", e.style.display = "flex", e.style.flexDirection = "column", e.style.overflow = "hidden", !(e.firstChild === t && e.childNodes.length === 1) && (e.replaceChildren(t), mi(t?.dataset?.mjrKeepAliveHost, t, e)));
}
function _i(e, t, n = "_mjrVueApp") {
	if (!e) return !1;
	let r = pi.get(n), i = !1;
	if (!r) {
		let e = hi(n), { app: a } = fi(t);
		a.mount(e), r = {
			app: a,
			host: e,
			container: null
		}, pi.set(n, r), i = !0;
	}
	return gi(e, r.host), r.container = e, i;
}
function vi(e, t = "_mjrVueApp") {
	let n = pi.get(t);
	if (n?.app) {
		try {
			n.app.unmount();
		} catch {}
		try {
			n.host?.remove?.();
		} catch {}
		pi.delete(t);
	}
}
//#endregion
//#region ui/utils/format.ts
function yi(e) {
	if (!e) return null;
	let t = Number(e);
	if (!isNaN(t)) return /* @__PURE__ */ new Date(t * 1e3);
	let n = new Date(e);
	return isNaN(n.getTime()) ? null : n;
}
function bi(e) {
	let t = yi(e);
	return t ? `${t.getDate().toString().padStart(2, "0")}/${(t.getMonth() + 1).toString().padStart(2, "0")}` : "";
}
function xi(e) {
	let t = yi(e);
	return t ? `${t.getHours().toString().padStart(2, "0")}:${t.getMinutes().toString().padStart(2, "0")}` : "";
}
function Si(e) {
	return e ? e < 60 ? `${Math.round(e)}s` : `${Math.floor(e / 60)}m ${Math.round(e % 60)}s` : "";
}
//#endregion
//#region ui/vue/components/panel/sidebar/SidebarFileInfoSection.vue
var Ci = {
	key: 0,
	class: "mjr-sidebar-section",
	style: {
		background: "rgba(255, 255, 255, 0.03)",
		border: "1px solid var(--mjr-border, rgba(255, 255, 255, 0.12))",
		"border-radius": "8px",
		padding: "10px"
	}
}, wi = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "6px"
} }, Ti = ["title"], Ei = ["title"], Di = {
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
				value: `${e.width} x ${e.height}`,
				tooltip: "Image/video resolution in pixels"
			}), e.duration && e.duration > 0 && a.push({
				label: "Duration",
				value: Si(e.duration),
				tooltip: "Video duration"
			}), r(e)) {
				let t = oi(e);
				t != null && a.push({
					label: "FPS",
					value: ci(t),
					tooltip: "Native frame rate"
				});
				let n = si(e, t);
				n != null && a.push({
					label: "Length",
					value: `${Math.max(0, Math.floor(n))} frames`,
					tooltip: "Total frame count"
				});
			}
			let o = Qr(e.generation_time_ms ?? e.metadata?.generation_time_ms ?? 0);
			o > 0 && a.push({
				label: "Generation Time",
				value: `${(Number(o) / 1e3).toFixed(1)}s`,
				tooltip: "Time taken to generate this asset (workflow execution time)",
				valueStyle: `color: ${Xr(o)}; font-weight: 600;`
			});
			let s = e.generation_time || e.file_creation_time || e.mtime || e.created_at;
			if (s) {
				let e = bi(s), t = xi(s);
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
		return (e, t) => a.value.length ? (j(), P("div", Ci, [t[0] ||= N("div", { style: {
			"font-size": "12px",
			"font-weight": "700",
			color: "#607d8b",
			"margin-bottom": "8px",
			"text-transform": "uppercase",
			"letter-spacing": "0.4px"
		} }, " File Info ", -1), N("div", wi, [(j(!0), P(V, null, M(a.value, (e) => (j(), P("div", {
			key: e.label,
			style: {
				display: "flex",
				gap: "10px",
				"align-items": "flex-start",
				"justify-content": "space-between"
			}
		}, [N("div", {
			title: e.tooltip || "",
			style: {
				"font-size": "12px",
				opacity: "0.68",
				"min-width": "92px"
			}
		}, L(e.label), 9, Ti), N("div", {
			style: I(e.valueStyle || "font-size: 12px; text-align: right; word-break: break-word"),
			title: String(e.value || "")
		}, L(e.value), 13, Ei)]))), 128))])])) : z("", !0);
	}
}, Oi = new Set([
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
function ki(e) {
	let t = String(e?.filename || e?.name || e?.filepath || e?.path || "").trim().toLowerCase();
	return !t || !t.includes(".") ? "" : t.split(".").pop() || "";
}
function Ai(e) {
	return String(e?.kind || "").trim().toLowerCase() === "image" || String(e?.mime || e?.mimetype || "").trim().toLowerCase().startsWith("image/") ? !0 : Oi.has(ki(e));
}
function ji(e) {
	let t = ki(e);
	return t === "jpg" || t === "jpeg";
}
function Mi() {
	try {
		return !!(K()?.ai?.vectorSearchEnabled ?? !0);
	} catch {
		return !0;
	}
}
function Ni(e) {
	return e >= .75 ? "#4CAF50" : e >= .5 ? "#8BC34A" : e >= .3 ? "#FF9800" : "#F44336";
}
function Pi(e) {
	return e >= .85 ? "Excellent" : e >= .7 ? "Good" : e >= .5 ? "Fair" : e >= .3 ? "Low" : "Very Low";
}
function Fi(e) {
	let t = String(e || "").trim();
	if (!t) return "";
	let n = [];
	for (let e of t.replace(/\r\n/g, "\n").split("\n")) {
		let t = String(e || "").trim();
		t && (/^title\s*:/i.test(t) || (/^caption\s*:/i.test(t) && (t = t.replace(/^caption\s*:/i, "").trim()), t && n.push(t)));
	}
	return (n.length ? n.join(" ") : t).replace(/\s+/g, " ").replace(/:{2,}\s*$/, "").trim();
}
function Ii(e) {
	let t = String(e?.filename || "").trim();
	if (!t) return [];
	let n = String(e?.subfolder || "").trim(), r = String(e?.folder_type || "input").trim().toLowerCase(), i = [], a = (e) => {
		if (!e) return;
		let r = be(t, n, e);
		r && !i.includes(r) && i.push(r);
	};
	return (r === "input" || r === "output") && a(r), a("input"), a("output"), i;
}
function Li(e) {
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
function Ri(e, t) {
	let n = String(e?.pass_stage || e?.stage || e?.kind || "").trim().toLowerCase();
	if (n === "txt2img" || n === "text_to_image" || n === "text-to-image") return O("sidebar.generation.stageTextToImage", "Text-to-Image");
	if (n === "img2img" || n === "image_to_image" || n === "image-to-image") return O("sidebar.generation.stageImageToImage", "Image-to-Image");
	if (n === "inpaint" || n === "inpainting") return O("sidebar.generation.stageInpaint", "Inpaint");
	if (n === "upscale" || n === "upscaling") return O("sidebar.generation.stageUpscale", "Upscale");
	if (n === "refine" || n === "refiner") return O("sidebar.generation.stageRefine", "Refine");
	let r = String(e?.pass_name || "").trim();
	if (r && r.toLowerCase() !== "base") return r;
	let i = Number(e?.denoise);
	return t === 0 || i === 1 ? O("sidebar.generation.stageBase", "Base") : Number.isFinite(i) && i < 1 ? O("sidebar.generation.stageRefineUpscale", "Refine / Upscale") : O("sidebar.generation.stagePassN", "Pass {n}", { n: t + 1 });
}
function zi(e) {
	return e?.geninfo && typeof e.geninfo == "object" ? { geninfo: e.geninfo } : e?.metadata && (typeof e.metadata == "object" || typeof e.metadata == "string") ? e.metadata : e?.prompt && (typeof e.prompt == "object" || typeof e.prompt == "string") ? e.prompt : e?.metadata_raw ? e.metadata_raw : e?.exif ? e.exif : null;
}
function Bi(e) {
	try {
		if (!e || typeof e != "object") return !1;
		if (e.is_override || typeof e.workflow_notes == "string" && e.workflow_notes.trim() || typeof e.notes == "string" && e.notes.trim() || Array.isArray(e.custom_info) && e.custom_info.length > 0 || e.engine && typeof e.engine == "object" && e.engine.type || at(e.prompt) || typeof (e.negative_prompt || e.negativePrompt) == "string" && at(e.negative_prompt || e.negativePrompt) || e.models || e.model || e.checkpoint || e.loras || e.sampler || e.sampler_name || e.steps || e.cfg || e.cfg_scale || e.cfg_high_noise || e.cfg_low_noise || e.scheduler || Array.isArray(e.chained_passes) && e.chained_passes.length > 0 || Array.isArray(e.all_samplers) && e.all_samplers.length > 0 || e.seed || e.denoise || e.denoising || e.clip_skip || e.voice || e.language || e.temperature || e.top_k || e.top_p || e.repetition_penalty || e.max_new_tokens || e.device || e.voice_preset || e.instruct || e.dtype || e.attn_implementation || e.enable_chunking !== void 0 || e.max_chars_per_chunk || e.chunk_combination_method || e.silence_between_chunks_ms || e.enable_audio_cache !== void 0 || e.batch_size !== void 0 || e.use_torch_compile !== void 0 || e.use_cuda_graphs !== void 0 || e.compile_mode || typeof e.lyrics == "string" && e.lyrics.trim()) return !0;
	} catch {
		return !1;
	}
	return !1;
}
function Vi(e) {
	return e ? typeof e == "string" ? ot(e) : typeof e == "object" ? ot(e.name || e.value || "") : "" : "";
}
function Hi(e, t, n, r) {
	let i = String(r || "").trim();
	if (!i) return;
	let a = `${n}::${i}`;
	t.has(a) || (t.add(a), e.push({
		label: n,
		value: i
	}));
}
function Ui(e) {
	let t = `${String(e?.source || "").toLowerCase()} ${String(e?.name || e?.lora_name || "").toLowerCase()}`;
	return t.includes("high_noise") || t.includes("high noise") ? "high_noise" : t.includes("low_noise") || t.includes("low noise") ? "low_noise" : "";
}
function Wi(e) {
	let t = [], n = Array.isArray(e.model_groups) ? e.model_groups : [];
	if (n.length) return n.forEach((e) => {
		if (!e || typeof e != "object") return;
		let n = Vi(e.model), r = Array.isArray(e.loras) ? e.loras.map((e) => it(e)).filter(Boolean) : [];
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
		label: O("sidebar.generation.highNoise", "High Noise"),
		model: Vi(r.unet_high_noise)
	}, {
		key: "low_noise",
		label: O("sidebar.generation.lowNoise", "Low Noise"),
		model: Vi(r.unet_low_noise)
	}].forEach((e) => {
		let n = i.filter((t) => Ui(t) === e.key).map((e) => it(e)).filter(Boolean);
		!e.model && !n.length || t.push({
			...e,
			loras: n
		});
	}), t;
}
function Gi(e, t) {
	return t == null ? null : {
		label: e,
		value: t ? O("state.on", "on") : O("state.off", "off")
	};
}
function Ki(e) {
	return e != null && String(e).trim() !== "";
}
function qi(e) {
	return new Set(Array.isArray(e.override_fields) ? e.override_fields.map((e) => String(e || "").trim()).filter(Boolean) : []);
}
function $(e, ...t) {
	return t.some((t) => e.has(t));
}
function Ji(e) {
	return Array.isArray(e) ? e.filter((e) => e && typeof e == "object").map((e, t) => ({
		title: String(e.title || O("sidebar.generation.customInfoN", "Custom Info {n}", { n: t + 1 })).trim(),
		content: String(e.content ?? e.value ?? "").trim(),
		color: /^#[0-9a-fA-F]{6}$/.test(String(e.color || "").trim()) ? String(e.color).trim() : "#2196F3"
	})).filter((e) => e.content) : [];
}
function Yi(e) {
	let t = rt(zi(e)), n = {
		kind: "empty",
		title: O("sidebar.generation.title", "Generation"),
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
		captionLabel: O("sidebar.generation.imageDescription", "Image Description"),
		emptyCaptionText: O("sidebar.generation.noImageDescription", "No image description yet."),
		isImageAsset: Ai(e),
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
	if (!t || typeof t == "object" && Object.keys(t).length === 0 || !Bi(t)) {
		let t = e?.metadata_raw?.geninfo_status || e?.geninfo_status;
		return t && typeof t == "object" && t.kind === "media_pipeline" ? {
			...n,
			kind: "media-only",
			mediaOnlyMessage: O("sidebar.generation.mediaOnlyPipeline", "This file looks like a media-only pipeline (e.g. LoadVideo/VideoCombine) and does not contain generation parameters.")
		} : Ai(e) || ji(e) ? {
			...n,
			kind: "caption-only",
			showAlignment: !1
		} : n;
	}
	let r = t, i = qi(r), a = r.engine && typeof r.engine == "object" ? r.engine : null, o = !!(r.is_override || a?.mode === "override" || a?.parser_version === "geninfo-override-v1" || a?.source === "majoor_geninfo"), s = st(r), c = nt(typeof r.prompt == "string" ? r.prompt : null, typeof (r.negative_prompt || r.negativePrompt) == "string" ? r.negative_prompt || r.negativePrompt : null), l = Array.isArray(r.all_positive_prompts) && r.all_positive_prompts.length > 1 ? r.all_positive_prompts.map((e, t) => {
		let n = nt(typeof e == "string" ? e : "", typeof r.all_negative_prompts?.[t] == "string" ? r.all_negative_prompts[t] : "");
		return {
			label: O("sidebar.generation.promptN", "Prompt {n}", { n: t + 1 }),
			positive: at(n.positive),
			negative: at(n.negative)
		};
	}).filter((e) => e.positive) : [], u = [], d = /* @__PURE__ */ new Set(), f = r.models && typeof r.models == "object" ? r.models : null, p = Wi(r), m = new Set(p.map((e) => String(e.model || "").trim()).filter(Boolean)), h = Array.isArray(r.all_checkpoints) && r.all_checkpoints.length > 1 ? r.all_checkpoints : null;
	if (f) {
		let e = new Set([
			Vi(f.unet_high_noise),
			Vi(f.unet_low_noise),
			...m
		].filter(Boolean));
		if (h) h.forEach((e, t) => {
			let n = Vi(e);
			Hi(u, d, O("sidebar.generation.checkpointN", "Checkpoint {n}", { n: t + 1 }), n);
		});
		else {
			let t = Vi(f.checkpoint);
			t && !e.has(t) && Hi(u, d, O("sidebar.generation.checkpoint", "Checkpoint"), t);
		}
		[
			["UNet", Vi(f.unet)],
			["Diffusion", Vi(f.diffusion)],
			[O("sidebar.generation.upscaler", "Upscaler"), Vi(f.upscaler)],
			["CLIP", Vi(f.clip)],
			["VAE", Vi(f.vae)]
		].forEach(([t, n]) => {
			e.has(n) || Hi(u, d, t, n);
		});
	} else (r.model || r.checkpoint) && Hi(u, d, O("sidebar.generation.model", "Model"), ot(r.model || r.checkpoint));
	if (Array.isArray(r.loras) && r.loras.length > 0) {
		let e = r.loras.map((e) => it(e)).filter(Boolean).join("\n");
		e && Hi(u, d, r.loras.length > 1 ? O("sidebar.generation.loras", "LoRAs") : "LoRA", e);
	}
	!f && r.clip && Hi(u, d, "CLIP", ot(r.clip)), !f && r.vae && Hi(u, d, "VAE", ot(r.vae)), !f && r.unet && Hi(u, d, "UNet", ot(r.unet)), !f && r.diffusion && Hi(u, d, "Diffusion", ot(r.diffusion)), f && r.clip && Hi(u, d, "CLIP", ot(r.clip)), f && r.vae && Hi(u, d, "VAE", ot(r.vae));
	for (let e of u) {
		let t = String(e.label || "").toLowerCase();
		(t.includes("checkpoint") || t === "model") && (e.override = $(i, "checkpoint", "model")), t === "clip" && (e.override = $(i, "clip")), t === "vae" && (e.override = $(i, "vae")), t.includes("lora") && (e.override = $(i, "loras"));
	}
	let g = [];
	Ki(r.seed) && g.push({
		label: O("sidebar.generation.seed", "Seed"),
		value: r.seed,
		override: $(i, "seed")
	}), (r.sampler || r.sampler_name) && g.push({
		label: O("sidebar.generation.sampler", "Sampler"),
		value: r.sampler || r.sampler_name,
		override: $(i, "sampler", "sampler_name")
	}), Ki(r.steps) && g.push({
		label: O("sidebar.generation.steps", "Steps"),
		value: r.steps,
		override: $(i, "steps")
	});
	let _ = Ki(r.cfg) ? r.cfg : r.cfg_scale;
	Ki(_) && g.push({
		label: O("sidebar.generation.cfgScale", "CFG Scale"),
		value: _,
		override: $(i, "cfg", "cfg_scale")
	}), r.cfg_high_noise !== void 0 && r.cfg_high_noise !== null && g.push({
		label: O("sidebar.generation.cfgHighNoise", "CFG High Noise"),
		value: r.cfg_high_noise
	}), r.cfg_low_noise !== void 0 && r.cfg_low_noise !== null && g.push({
		label: O("sidebar.generation.cfgLowNoise", "CFG Low Noise"),
		value: r.cfg_low_noise
	}), r.scheduler && g.push({
		label: O("sidebar.generation.scheduler", "Scheduler"),
		value: r.scheduler,
		override: $(i, "scheduler")
	});
	let v = Ki(r.denoise) ? r.denoise : r.denoising;
	Ki(v) && g.push({
		label: O("sidebar.generation.denoise", "Denoise"),
		value: v,
		override: $(i, "denoise", "denoising")
	});
	let y = [];
	Array.isArray(r.chained_passes) && r.chained_passes.length > 1 ? y = r.chained_passes.filter((e) => e && typeof e == "object").map((e, t) => ({
		label: Ri(e, t),
		fields: [
			{
				label: O("sidebar.generation.model", "Model"),
				value: Q(e?.model)
			},
			{
				label: O("sidebar.generation.sampler", "Sampler"),
				value: Q(e?.sampler_name || e?.sampler)
			},
			{
				label: O("sidebar.generation.scheduler", "Scheduler"),
				value: Q(e?.scheduler)
			},
			{
				label: O("sidebar.generation.steps", "Steps"),
				value: Q(e?.steps)
			},
			{
				label: "CFG",
				value: Q(e?.cfg)
			},
			{
				label: O("sidebar.generation.denoise", "Denoise"),
				value: Q(e?.denoise)
			},
			{
				label: O("sidebar.generation.seed", "Seed"),
				value: Q(e?.seed_val || e?.seed)
			}
		]
	})) : Array.isArray(r.all_samplers) && r.all_samplers.length > 1 && (y = r.all_samplers.filter((e) => e && typeof e == "object").map((e, t) => ({
		label: Ri(e, t),
		fields: [
			{
				label: O("sidebar.generation.model", "Model"),
				value: Q(e?.model)
			},
			{
				label: O("sidebar.generation.sampler", "Sampler"),
				value: Q(e?.sampler_name || e?.sampler)
			},
			{
				label: O("sidebar.generation.scheduler", "Scheduler"),
				value: Q(e?.scheduler)
			},
			{
				label: O("sidebar.generation.steps", "Steps"),
				value: Q(e?.steps)
			},
			{
				label: "CFG",
				value: Q(e?.cfg)
			},
			{
				label: O("sidebar.generation.denoise", "Denoise"),
				value: Q(e?.denoise)
			},
			{
				label: O("sidebar.generation.seed", "Seed"),
				value: Q(e?.seed_val || e?.seed)
			}
		]
	})));
	let b = [];
	r.voice && b.push({
		label: O("sidebar.generation.narratorVoice", "Narrator Voice"),
		value: r.voice
	}), r.language && b.push({
		label: O("sidebar.generation.language", "Language"),
		value: r.language
	}), r.top_k !== void 0 && r.top_k !== null && b.push({
		label: "Top-k",
		value: r.top_k
	}), r.top_p !== void 0 && r.top_p !== null && b.push({
		label: "Top-p",
		value: r.top_p
	}), r.temperature !== void 0 && r.temperature !== null && b.push({
		label: O("sidebar.generation.temperature", "Temperature"),
		value: r.temperature
	}), r.repetition_penalty !== void 0 && r.repetition_penalty !== null && b.push({
		label: O("sidebar.generation.repetitionPenalty", "Repetition Penalty"),
		value: r.repetition_penalty
	}), r.max_new_tokens !== void 0 && r.max_new_tokens !== null && b.push({
		label: O("sidebar.generation.maxNewTokens", "Max New Tokens"),
		value: r.max_new_tokens
	});
	let x = [];
	r.device && x.push({
		label: O("sidebar.generation.device", "Device"),
		value: r.device
	}), r.voice_preset && x.push({
		label: O("sidebar.generation.voicePreset", "Voice Preset"),
		value: r.voice_preset
	}), r.dtype && x.push({
		label: O("sidebar.generation.dtype", "Dtype"),
		value: r.dtype
	}), r.attn_implementation && x.push({
		label: O("sidebar.generation.attention", "Attention"),
		value: r.attn_implementation
	}), r.compile_mode && x.push({
		label: O("sidebar.generation.compileMode", "Compile Mode"),
		value: r.compile_mode
	}), [
		Gi(O("sidebar.generation.torchCompile", "Torch Compile"), r.use_torch_compile),
		Gi(O("sidebar.generation.cudaGraphs", "CUDA Graphs"), r.use_cuda_graphs),
		Gi(O("sidebar.generation.xVectorOnly", "X-Vector Only"), r.x_vector_only_mode)
	].filter(Boolean).forEach((e) => x.push(e));
	let ee = [];
	[
		Gi(O("sidebar.generation.chunking", "Chunking"), r.enable_chunking),
		r.max_chars_per_chunk !== void 0 && r.max_chars_per_chunk !== null ? {
			label: O("sidebar.generation.maxCharsChunk", "Max Chars/Chunk"),
			value: r.max_chars_per_chunk
		} : null,
		r.chunk_combination_method ? {
			label: O("sidebar.generation.chunkMethod", "Chunk Method"),
			value: r.chunk_combination_method
		} : null,
		r.silence_between_chunks_ms !== void 0 && r.silence_between_chunks_ms !== null ? {
			label: O("sidebar.generation.silenceBetweenChunks", "Silence Between Chunks (ms)"),
			value: r.silence_between_chunks_ms
		} : null,
		Gi(O("sidebar.generation.audioCache", "Audio Cache"), r.enable_audio_cache),
		r.batch_size !== void 0 && r.batch_size !== null ? {
			label: O("sidebar.generation.batchSize", "Batch Size"),
			value: r.batch_size
		} : null
	].filter(Boolean).forEach((e) => ee.push(e));
	let S = [];
	r.lyrics_strength !== void 0 && r.lyrics_strength !== null && S.push({
		label: O("sidebar.generation.lyricsStrength", "Lyrics Strength"),
		value: r.lyrics_strength
	});
	let C = [];
	Ki(v) && !g.some((e) => e.label === "Denoise") && C.push({
		label: O("sidebar.generation.denoise", "Denoise"),
		value: v
	}), Ki(r.clip_skip) && C.push({
		label: O("sidebar.generation.clipSkip", "Clip Skip"),
		value: r.clip_skip
	});
	let w = [], T = String(r.workflow_notes || r.notes || "").trim();
	T && w.push({
		label: O("sidebar.generation.workflowNotes", "Workflow Notes"),
		value: T,
		override: $(i, "workflow_notes", "notes")
	});
	let te = Ji(r.custom_info), ne = Array.isArray(r.inputs) ? r.inputs.filter((e) => e && typeof e == "object" && e.filename).map((e, t) => ({
		id: `${e.filename}-${t}`,
		filename: String(e.filename || "").trim(),
		filepath: String(e.filepath || e.filename || "").trim(),
		role: String(e.role || "").trim(),
		roleLabel: String(e.role || "").trim().replace(/_/g, " "),
		isVideo: String(e.type || "").toLowerCase() === "video" || /\.(mp4|mov|webm)$/i.test(String(e.filename || "")),
		previewCandidates: Ii(e)
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
		isImageAsset: Ai(e),
		lyrics: String(r.lyrics || "").trim(),
		modelFields: u,
		modelGroups: p,
		pipelineTabs: y,
		samplingFields: g,
		ttsFields: b,
		ttsEngineFields: x,
		ttsInstruction: String(r.instruct || "").trim(),
		ttsRuntimeFields: ee,
		audioFields: S,
		seed: r.seed ?? null,
		imageFields: C,
		inputFiles: ne,
		isOverride: o,
		overrideLabel: o ? "Gen Info Override" : "",
		notesFields: w,
		customInfoBlocks: te
	};
}
//#endregion
//#region ui/vue/components/panel/sidebar/GenerationInputThumb.vue
var Xi = ["title"], Zi = ["src"], Qi = ["src"], $i = {
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
}, ea = {
	key: 3,
	title: "Video file",
	style: {
		position: "absolute",
		color: "white",
		opacity: "0.7",
		"font-size": "16px",
		"pointer-events": "none"
	}
}, ta = {
	__name: "GenerationInputThumb",
	props: { inputFile: {
		type: Object,
		required: !0
	} },
	setup(e) {
		let t = e, n = F(0), r = F(!1);
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
			if (Li(t)) try {
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
		return (t, n) => (j(), P("div", {
			title: `${e.inputFile.filename} (click to copy, double-click to open in new tab)`,
			style: I({
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
		}, [e.inputFile.isVideo ? (j(), P("video", {
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
		}, null, 40, Zi)) : (j(), P("img", {
			key: 1,
			src: i(),
			style: {
				width: "100%",
				height: "100%",
				"object-fit": "cover"
			},
			onError: a
		}, null, 40, Qi)), e.inputFile.role && e.inputFile.role !== "secondary" ? (j(), P("div", $i, L(e.inputFile.roleLabel), 1)) : e.inputFile.isVideo ? (j(), P("div", ea, " Play ")) : z("", !0)], 44, Xi));
	}
}, na = {
	key: 0,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "12px"
	}
}, ra = {
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
}, ia = { style: { opacity: "0.85" } }, aa = { style: {
	display: "flex",
	"align-items": "center",
	gap: "8px",
	"flex-wrap": "wrap",
	"justify-content": "flex-end"
} }, oa = ["title"], sa = ["title"], ca = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px"
} }, la = { style: {
	"font-size": "11px",
	"font-weight": "700",
	color: "#00BCD4",
	"text-transform": "uppercase",
	"letter-spacing": "0.6px"
} }, ua = { style: {
	"font-size": "11px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"font-weight": "600"
} }, da = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#FF9800",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, fa = { style: {
	"font-size": "12px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"line-height": "1.5",
	"white-space": "pre-wrap",
	"word-break": "break-word"
} }, pa = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#9E9E9E",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, ma = { style: {
	"font-size": "12px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"line-height": "1.5",
	"white-space": "pre-wrap",
	"word-break": "break-word"
} }, ha = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#4CAF50",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, ga = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "6px",
	"margin-bottom": "10px"
} }, _a = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "#4CAF50",
	"letter-spacing": "0.4px"
} }, va = ["onClick"], ya = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "#F44336",
	"letter-spacing": "0.4px",
	"margin-top": "4px"
} }, ba = ["onClick"], xa = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#4CAF50",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, Sa = ["title"], Ca = ["title"], wa = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#F44336",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, Ta = ["title"], Ea = ["title"], Da = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#00BCD4",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between"
} }, Oa = ["title"], ka = { style: {
	display: "flex",
	"align-items": "center",
	gap: "10px"
} }, Aa = { style: {
	flex: "1",
	height: "8px",
	background: "rgba(255,255,255,0.1)",
	"border-radius": "4px",
	overflow: "hidden"
} }, ja = {
	key: 0,
	style: {
		"font-size": "10px",
		color: "rgba(255,255,255,0.65)",
		border: "1px dashed rgba(255,255,255,0.25)",
		"border-radius": "4px",
		padding: "6px 8px",
		background: "rgba(255,255,255,0.04)"
	}
}, Ma = { style: {
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
} }, Na = ["title"], Pa = { style: {
	display: "flex",
	"align-items": "center",
	gap: "6px"
} }, Fa = ["title"], Ia = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#00BCD4",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, La = { style: {
	"font-size": "12px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"line-height": "1.5",
	"white-space": "pre-wrap",
	"word-break": "break-word"
} }, Ra = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#FF9800",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, za = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "6px",
	"margin-bottom": "10px"
} }, Ba = { style: {
	"font-size": "10px",
	"font-weight": "600",
	color: "rgba(255,255,255,0.6)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, Va = ["onClick"], Ha = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#9C27B0",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, Ua = { style: {
	display: "grid",
	"grid-template-columns": "repeat(auto-fit, minmax(220px, 1fr))",
	gap: "10px"
} }, Wa = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px"
} }, Ga = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "4px"
} }, Ka = ["onClick"], qa = {
	key: 0,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "6px"
	}
}, Ja = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.58)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, Ya = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "5px"
} }, Xa = ["onClick"], Za = { style: {
	display: "grid",
	"grid-template-columns": "auto 1fr",
	gap: "8px 12px",
	"align-items": "start"
} }, Qa = ["title"], $a = ["title"], eo = ["title", "onClick"], to = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#4CAF50",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, no = ["title", "onClick"], ro = ["title", "onClick"], io = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#26A69A",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, ao = ["title"], oo = { style: {
	"font-size": "11px",
	"font-weight": "700",
	color: "#E91E63",
	"text-transform": "uppercase",
	"letter-spacing": "1px"
} }, so = ["title"], co = ["title"], lo = { style: {
	display: "flex",
	gap: "8px",
	"flex-wrap": "wrap"
} }, uo = {
	__name: "SidebarGenerationSection",
	props: { asset: {
		type: Object,
		required: !0
	} },
	setup(e) {
		let t = e, n = F(0), r = F(0), i = F(""), a = F(O("action.copy", "Copy")), o = F(O("action.generate", "Generate")), s = F(!1), c = F(u()), l = 0;
		function u() {
			return {
				scoreText: "...",
				scoreColor: "#888",
				qualityText: O("status.loading", "Loading"),
				qualityColor: "#888",
				qualityBackground: "rgba(127,127,127,0.3)",
				fillWidth: "0%",
				fillColor: "#666",
				aiStatusVisible: !1,
				aiStatusText: O("sidebar.generation.aiDisabledEnv", "AI features are disabled (enable vector search env var).")
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
		let h = B(() => Yi(t.asset)), g = B(() => Mi()), _ = B(() => h.value.kind === "full" || h.value.kind === "caption-only"), v = B(() => Fi(i.value) || h.value.emptyCaptionText), y = B(() => g.value && h.value.isImageAsset && !!t.asset?.id), b = B(() => g.value && !!Fi(v.value) && v.value !== h.value.emptyCaptionText), ee = B(() => {
			let e = [];
			return h.value.modelFields.length && e.push({
				key: "model",
				title: O("sidebar.generation.modelLora", "Model & LoRA"),
				accent: "#9C27B0",
				emphasis: !0,
				fields: h.value.modelFields
			}), !h.value.pipelineTabs.length && h.value.samplingFields.length && e.push({
				key: "sampling",
				title: O("sidebar.generation.sampling", "Sampling"),
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
				title: O("sidebar.generation.audio", "Audio"),
				accent: "#00BCD4",
				emphasis: !1,
				fields: h.value.audioFields
			}), h.value.imageFields.length && e.push({
				key: "image",
				title: O("sidebar.generation.image", "Image"),
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
		function te() {
			c.value = {
				scoreText: "AI OFF",
				scoreColor: "#9E9E9E",
				qualityText: O("status.disabled", "Disabled"),
				qualityColor: "#BDBDBD",
				qualityBackground: "rgba(158,158,158,0.25)",
				fillWidth: "0%",
				fillColor: "#777",
				aiStatusVisible: !0,
				aiStatusText: O("sidebar.generation.aiDisabledSettings", "AI features are disabled in settings.")
			};
		}
		function ne() {
			c.value = u();
		}
		async function re() {
			l += 1;
			let e = l;
			if (!h.value.showAlignment || !t.asset?.id) {
				ne();
				return;
			}
			if (!g.value) {
				te();
				return;
			}
			ne();
			try {
				let n = await x(t.asset.id);
				if (e !== l) return;
				if (!n?.ok && (String(n?.code || "").toUpperCase() === "SERVICE_UNAVAILABLE" || /vector search is not enabled/i.test(String(n?.error || "")))) {
					te();
					return;
				}
				let r = n?.ok && n.data != null ? Number(n.data) : null;
				if (!Number.isFinite(r)) {
					c.value = {
						scoreText: "N/A",
						scoreColor: "#888",
						qualityText: O("status.na", "N/A"),
						qualityColor: "#888",
						qualityBackground: "rgba(127,127,127,0.3)",
						fillWidth: "0%",
						fillColor: "#666",
						aiStatusVisible: !1,
						aiStatusText: ""
					};
					return;
				}
				let i = Math.round(r * 100), a = Ni(r);
				c.value = {
					scoreText: `${i}%`,
					scoreColor: a,
					qualityText: Pi(r),
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
					qualityText: O("status.unavailable", "Unavailable"),
					qualityColor: "#888",
					qualityBackground: "rgba(127,127,127,0.3)",
					fillWidth: "0%",
					fillColor: "#666",
					aiStatusVisible: !1,
					aiStatusText: ""
				};
			}
		}
		async function ie() {
			if (!(!y.value || s.value)) {
				s.value = !0, o.value = O("status.generating", "Generating...");
				try {
					let e = await ce(t.asset.id);
					e?.ok && (i.value = String(e?.data || "").trim());
				} catch (e) {
					console.debug?.(e);
				} finally {
					s.value = !1, o.value = O("action.generate", "Generate");
				}
			}
		}
		async function ae() {
			if (b.value) try {
				await navigator.clipboard.writeText(v.value), a.value = O("viewer.copySuccessShort", "Copied!"), setTimeout(() => {
					a.value = O("action.copy", "Copy");
				}, 900);
			} catch (e) {
				console.debug?.(e);
			}
		}
		return Te(() => t.asset, () => {
			n.value = 0, r.value = 0, i.value = String(t.asset?.enhanced_caption || "").trim(), a.value = O("action.copy", "Copy"), o.value = O("action.generate", "Generate");
		}, { immediate: !0 }), Te(() => [
			t.asset?.id,
			h.value.kind,
			h.value.showAlignment,
			g.value
		], () => {
			re();
		}, { immediate: !0 }), (e, t) => {
			let i = Qe("MButton");
			return h.value.kind === "empty" ? z("", !0) : (j(), P("div", na, [
				h.value.workflowType ? (j(), P("div", ra, [N("span", ia, L(R(O)("viewer.workflow", "Workflow")), 1), N("div", aa, [N("span", {
					title: R(O)("sidebar.generation.workflowEngine", "Workflow engine: {value}", { value: h.value.workflowType }),
					style: {
						background: "#2196F3",
						color: "white",
						padding: "2px 8px",
						"border-radius": "999px",
						"font-weight": "bold",
						"font-size": "10px",
						"letter-spacing": "0.2px"
					}
				}, L(h.value.workflowLabel || h.value.workflowType), 9, oa), h.value.workflowBadge ? (j(), P("span", {
					key: 0,
					title: R(O)("sidebar.generation.apiProvider", "API provider: {value}", { value: h.value.workflowBadge }),
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
				}, L(h.value.workflowBadge), 9, sa)) : z("", !0)])])) : z("", !0),
				h.value.isOverride ? (j(), P("div", {
					key: 1,
					style: I(f("#00BCD4", {
						emphasis: !0,
						startAlpha: .14,
						endAlpha: .08
					}))
				}, [N("div", ca, [N("span", la, L(R(O)("sidebar.generation.override", "Override")), 1), N("span", ua, L(h.value.overrideLabel), 1)])], 4)) : z("", !0),
				h.value.isTruncated ? (j(), P("div", {
					key: 2,
					style: I(f("#FF9800", {
						emphasis: !0,
						startAlpha: .12,
						endAlpha: .08
					}))
				}, [N("div", da, L(R(O)("sidebar.generation.metadataTruncated", "Metadata Truncated")), 1), N("div", fa, L(R(O)("sidebar.generation.metadataTruncatedBody", "Generation data is incomplete because it exceeded the size limit.")), 1)], 4)) : z("", !0),
				h.value.kind === "media-only" ? (j(), P("div", {
					key: 3,
					style: I(f("#9E9E9E", {
						emphasis: !0,
						startAlpha: .1,
						endAlpha: .06
					}))
				}, [N("div", pa, L(R(O)("sidebar.generation.generationData", "Generation Data")), 1), N("div", ma, L(h.value.mediaOnlyMessage), 1)], 4)) : z("", !0),
				h.value.kind === "full" ? (j(), P(V, { key: 4 }, [h.value.promptTabs.length ? (j(), P("div", {
					key: 0,
					style: I(f("#4CAF50", {
						emphasis: !0,
						startAlpha: .16,
						endAlpha: .1
					}))
				}, [
					N("div", ha, L(R(O)("sidebar.generation.promptPipeline", "Prompt Pipeline ({count} variants)", { count: h.value.promptTabs.length })), 1),
					N("div", ga, [(j(!0), P(V, null, M(h.value.promptTabs, (e, t) => (j(), Ee(i, {
						key: e.label,
						type: "button",
						severity: "secondary",
						text: "",
						rounded: "",
						style: I({
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
						default: ke(() => [Oe(L(e.label), 1)]),
						_: 2
					}, 1032, ["style", "onClick"]))), 128))]),
					(j(!0), P(V, null, M(h.value.promptTabs, (e, t) => Me((j(), P("div", {
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
						N("div", _a, L(R(O)("sidebar.generation.positive", "POSITIVE")), 1),
						N("div", {
							style: {
								"font-size": "12px",
								color: "var(--fg-color, #ddd)",
								"white-space": "pre-wrap",
								"line-height": "1.35",
								cursor: "pointer"
							},
							onClick: (t) => T(e.positive, t.currentTarget)
						}, L(e.positive), 9, va),
						e.negative ? (j(), P(V, { key: 0 }, [N("div", ya, L(R(O)("sidebar.generation.negative", "NEGATIVE")), 1), N("div", {
							style: {
								"font-size": "12px",
								color: "var(--fg-color, #ddd)",
								"white-space": "pre-wrap",
								"line-height": "1.35",
								cursor: "pointer"
							},
							onClick: (t) => T(e.negative, t.currentTarget)
						}, L(e.negative), 9, ba)], 64)) : z("", !0)
					])), [[Ne, n.value === t]])), 128))
				], 4)) : h.value.positivePrompt ? (j(), P("div", {
					key: 1,
					style: I(f("#4CAF50", {
						emphasis: !0,
						startAlpha: .16,
						endAlpha: .1
					}))
				}, [N("div", xa, [N("span", null, L(R(O)("sidebar.generation.positivePrompt", "Positive Prompt")), 1), h.value.positivePromptOverride ? (j(), P("span", {
					key: 0,
					style: I(m()),
					title: R(O)("sidebar.generation.overrideTooltip", "This field was forced by Majoor Gen Info Override")
				}, L(R(O)("sidebar.generation.override", "override")), 13, Sa)) : z("", !0)]), N("div", {
					title: R(O)("action.clickToCopy", "Click to copy"),
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.9))",
						"line-height": "1.5",
						"white-space": "pre-wrap",
						"word-break": "break-word",
						cursor: "pointer"
					},
					onClick: t[0] ||= (e) => T(h.value.positivePrompt, e.currentTarget)
				}, L(h.value.positivePrompt), 9, Ca)], 4)) : z("", !0), !h.value.promptTabs.length && h.value.negativePrompt ? (j(), P("div", {
					key: 2,
					style: I(f("#F44336", {
						emphasis: !0,
						startAlpha: .16,
						endAlpha: .1
					}))
				}, [N("div", wa, [N("span", null, L(R(O)("sidebar.generation.negativePrompt", "Negative Prompt")), 1), h.value.negativePromptOverride ? (j(), P("span", {
					key: 0,
					style: I(m()),
					title: R(O)("sidebar.generation.overrideTooltip", "This field was forced by Majoor Gen Info Override")
				}, L(R(O)("sidebar.generation.override", "override")), 13, Ta)) : z("", !0)]), N("div", {
					title: R(O)("action.clickToCopy", "Click to copy"),
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.9))",
						"line-height": "1.5",
						"white-space": "pre-wrap",
						"word-break": "break-word",
						cursor: "pointer"
					},
					onClick: t[1] ||= (e) => T(h.value.negativePrompt, e.currentTarget)
				}, L(h.value.negativePrompt), 9, Ea)], 4)) : z("", !0)], 64)) : z("", !0),
				_.value ? (j(), P("div", {
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
					class: Ve({ "mjr-ai-disabled-block": !g.value })
				}, [
					h.value.showAlignment ? (j(), P(V, { key: 0 }, [
						N("div", Da, [N("span", { title: R(O)("sidebar.generation.promptAlignmentTooltip", "How closely the generated image matches the prompt (SigLIP2 score)") }, L(R(O)("sidebar.generation.promptAlignment", "Prompt Alignment")), 9, Oa)]),
						N("div", ka, [
							N("div", Aa, [N("div", { style: I({
								height: "100%",
								width: c.value.fillWidth,
								background: c.value.fillColor,
								borderRadius: "4px",
								transition: "width 0.6s ease, background 0.4s ease"
							}) }, null, 4)]),
							N("span", { style: I({
								fontSize: "13px",
								fontWeight: "700",
								color: c.value.scoreColor,
								minWidth: "60px",
								textAlign: "right",
								fontFamily: "'Consolas', 'Monaco', monospace"
							}) }, L(c.value.scoreText), 5),
							N("span", { style: I({
								fontSize: "9px",
								fontWeight: "700",
								padding: "2px 6px",
								borderRadius: "3px",
								background: c.value.qualityBackground,
								color: c.value.qualityColor,
								textTransform: "uppercase",
								letterSpacing: "0.5px"
							}) }, L(c.value.qualityText), 5)
						]),
						c.value.aiStatusVisible ? (j(), P("div", ja, L(c.value.aiStatusText), 1)) : z("", !0)
					], 64)) : z("", !0),
					N("div", Ma, [N("span", { title: R(O)("sidebar.generation.aiCaptionTooltip", "AI caption generated by Florence-2") }, L(h.value.captionLabel), 9, Na), N("div", Pa, [De(i, {
						type: "button",
						class: "mjr-ai-control",
						severity: "secondary",
						text: "",
						disabled: !y.value || s.value,
						style: I([{
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
						onClick: Ze(ie, ["stop"])
					}, {
						default: ke(() => [Oe(L(o.value), 1)]),
						_: 1
					}, 8, ["disabled", "style"]), De(i, {
						type: "button",
						class: "mjr-ai-control",
						severity: "secondary",
						text: "",
						disabled: !b.value,
						style: I([{
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
						onClick: Ze(ae, ["stop"])
					}, {
						default: ke(() => [Oe(L(a.value), 1)]),
						_: 1
					}, 8, ["disabled", "style"])])]),
					N("div", {
						title: g.value ? R(O)("sidebar.generation.copyCaptionTooltip", "Click to copy caption") : R(O)("sidebar.generation.aiCaptionDisabled", "AI caption controls are disabled"),
						style: I({
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
						onClick: ae
					}, L(v.value), 13, Fa)
				], 2)) : z("", !0),
				h.value.lyrics ? (j(), P("div", {
					key: 6,
					style: I(f("#00BCD4", { emphasis: !1 }))
				}, [N("div", Ia, [N("span", null, L(R(O)("sidebar.generation.lyrics", "Lyrics")), 1)]), N("div", La, L(h.value.lyrics), 1)], 4)) : z("", !0),
				h.value.pipelineTabs.length ? (j(), P("div", {
					key: 7,
					style: I(f("#FF9800", {
						emphasis: !0,
						startAlpha: .16,
						endAlpha: .1
					}))
				}, [
					N("div", Ra, L(R(O)("sidebar.generation.pipeline", "Generation Pipeline")), 1),
					N("div", za, [(j(!0), P(V, null, M(h.value.pipelineTabs, (e, t) => (j(), Ee(i, {
						key: e.label,
						type: "button",
						severity: "secondary",
						text: "",
						rounded: "",
						style: I({
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
						default: ke(() => [Oe(L(e.label), 1)]),
						_: 2
					}, 1032, ["style", "onClick"]))), 128))]),
					(j(!0), P(V, null, M(h.value.pipelineTabs, (e, t) => Me((j(), P("div", {
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
					}, [(j(!0), P(V, null, M(e.fields, (t) => (j(), P("div", {
						key: `${e.label}-${t.label}`,
						style: {
							display: "flex",
							"flex-direction": "column",
							gap: "2px",
							"min-width": "0"
						}
					}, [N("span", Ba, L(t.label), 1), N("span", {
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
					}, L(t.value), 9, Va)]))), 128))])), [[Ne, r.value === t]])), 128))
				], 4)) : z("", !0),
				h.value.modelGroups.length ? (j(), P("div", {
					key: 8,
					style: I(f("#9C27B0", {
						emphasis: !0,
						startAlpha: .18,
						endAlpha: .1
					}))
				}, [N("div", Ha, L(R(O)("sidebar.generation.modelBranches", "Model Branches")), 1), N("div", Ua, [(j(!0), P(V, null, M(h.value.modelGroups, (e) => (j(), P("div", {
					key: `model-group-${e.key}`,
					style: I(C(w(e.key), !0))
				}, [
					N("div", Wa, [N("div", { style: I({
						fontSize: "10px",
						fontWeight: "800",
						color: w(e.key),
						letterSpacing: "0.6px",
						textTransform: "uppercase"
					}) }, L(e.label), 5), N("span", { style: I({
						fontSize: "9px",
						fontWeight: "700",
						color: "#fff",
						background: d(w(e.key), .22),
						border: `1px solid ${d(w(e.key), .48)}`,
						borderRadius: "999px",
						padding: "2px 8px",
						letterSpacing: "0.4px",
						textTransform: "uppercase"
					}) }, L(e.loras?.length || 0) + " LoRA ", 5)]),
					N("div", Ga, [t[4] ||= N("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.58)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, " UNet ", -1), N("div", {
						style: {
							"font-size": "12px",
							color: "var(--fg-color, rgba(255,255,255,0.96))",
							"line-height": "1.45",
							"word-break": "break-word",
							cursor: "pointer"
						},
						onClick: (t) => T(e.model, t.currentTarget)
					}, L(e.model || "-"), 9, Ka)]),
					e.loras?.length ? (j(), P("div", qa, [N("div", Ja, L(R(O)("sidebar.generation.loraStack", "LoRA Stack")), 1), N("div", Ya, [(j(!0), P(V, null, M(e.loras, (t, n) => (j(), P("div", {
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
					}, L(t), 9, Xa))), 128))])])) : z("", !0)
				], 4))), 128))])], 4)) : z("", !0),
				(j(!0), P(V, null, M(ee.value, (e) => (j(), P("div", {
					key: e.key,
					style: I(f(e.accent, { emphasis: e.emphasis }))
				}, [N("div", { style: I({
					fontSize: "11px",
					fontWeight: "600",
					color: e.accent,
					textTransform: "uppercase",
					letterSpacing: "0.5px",
					marginBottom: "10px"
				}) }, L(e.title), 5), N("div", Za, [(j(!0), P(V, null, M(e.fields, (t) => (j(), P(V, { key: `${e.key}-${t.label}` }, [N("div", {
					title: t.label,
					style: {
						"font-size": "11px",
						color: "var(--mjr-muted, rgba(127,127,127,0.9))",
						"font-weight": "500",
						display: "flex",
						"align-items": "center",
						gap: "6px"
					}
				}, [N("span", null, L(t.label) + ":", 1), t.override ? (j(), P("span", {
					key: 0,
					style: I(m()),
					title: R(O)("sidebar.generation.overrideTooltip", "This field was forced by Majoor Gen Info Override")
				}, L(R(O)("sidebar.generation.override", "override")), 13, $a)) : z("", !0)], 8, Qa), N("div", {
					title: `${t.label}: ${t.value}`,
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.95))",
						"word-break": "break-word",
						"white-space": "pre-wrap",
						cursor: "pointer"
					},
					onClick: (e) => T(t.value, e.currentTarget)
				}, L(t.value), 9, eo)], 64))), 128))])], 4))), 128)),
				h.value.notesFields.length ? (j(), P("div", {
					key: 9,
					style: I(f("#4CAF50", { emphasis: !1 }))
				}, [N("div", to, L(R(O)("sidebar.generation.notes", "Notes")), 1), (j(!0), P(V, null, M(h.value.notesFields, (e) => (j(), P("div", {
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
				}, L(e.value), 9, no))), 128))], 4)) : z("", !0),
				(j(!0), P(V, null, M(h.value.customInfoBlocks, (e) => (j(), P("div", {
					key: `${e.title}-${e.content}`,
					style: I(f(e.color, { emphasis: !1 }))
				}, [N("div", { style: I({
					fontSize: "11px",
					fontWeight: "600",
					color: e.color,
					textTransform: "uppercase",
					letterSpacing: "0.5px",
					marginBottom: "8px"
				}) }, L(e.title), 5), N("div", {
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
				}, L(e.content), 9, ro)], 4))), 128)),
				h.value.ttsInstruction ? (j(), P("div", {
					key: 10,
					style: I(f("#26A69A", { emphasis: !1 }))
				}, [N("div", io, [N("span", null, L(R(O)("sidebar.generation.ttsInstruction", "TTS Instruction")), 1)]), N("div", {
					title: R(O)("action.clickToCopy", "Click to copy"),
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.9))",
						"line-height": "1.5",
						"white-space": "pre-wrap",
						"word-break": "break-word",
						cursor: "pointer"
					},
					onClick: t[2] ||= (e) => T(h.value.ttsInstruction, e.currentTarget)
				}, L(h.value.ttsInstruction), 9, ao)], 4)) : z("", !0),
				h.value.seed !== null && h.value.seed !== void 0 && h.value.seed !== "" ? (j(), P("div", {
					key: 11,
					style: I(p())
				}, [N("div", oo, L(R(O)("sidebar.generation.seed", "SEED")), 1), N("div", {
					title: R(O)("sidebar.generation.copySeedTooltip", "Click to copy seed: {seed}", { seed: h.value.seed }),
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
				}, L(h.value.seed), 9, so)], 4)) : z("", !0),
				h.value.inputFiles.length ? (j(), P("div", {
					key: 12,
					style: I(f("#4CAF50", {
						emphasis: !0,
						startAlpha: .16,
						endAlpha: .1
					}))
				}, [N("div", {
					title: R(O)("tooltip.generationInputs", "Input files used in generation"),
					style: {
						"font-size": "11px",
						"font-weight": "600",
						color: "#4CAF50",
						"text-transform": "uppercase",
						"letter-spacing": "0.5px",
						"margin-bottom": "8px"
					}
				}, L(R(O)("sidebar.generation.sourceFiles", "Source Files")), 9, co), N("div", lo, [(j(!0), P(V, null, M(h.value.inputFiles, (e) => (j(), Ee(ta, {
					key: e.id,
					"input-file": e
				}, null, 8, ["input-file"]))), 128))])], 4)) : z("", !0)
			]));
		};
	}
}, fo = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, po = /^[0-9a-f]{20,}$/i;
function mo(...e) {
	for (let t of e) {
		let e = String(t || "").trim();
		if (e) return e;
	}
	return "";
}
function ho(e) {
	let t = String(e || "").trim();
	return !!t && (fo.test(t) || po.test(t));
}
function go(e) {
	return String(e?.type || e?.class_type || e?.comfyClass || e?.classType || "").trim();
}
function _o(e) {
	return mo(e?.properties?.subgraph_name, e?.title, e?.properties?.title, e?.properties?.name, e?.properties?.label, e?.name, e?.subgraph?.name, e?.subgraph_instance?.name);
}
function vo(e) {
	let t = go(e), n = _o(e);
	return n && (!t || ho(t) || n !== t) ? n : t && !ho(t) ? t : n || (t ? "Subgraph" : String(e?.id || "Node").trim() || "Node");
}
function yo(e) {
	let t = go(e);
	return t && !ho(t) ? t : t ? "Subgraph" : "Node";
}
//#endregion
//#region ui/components/sidebar/utils/minimap.ts
var bo = 6, xo = 1, So = 8, Co = 74, wo = 42, To = [
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
], Eo = (e, t, n) => {
	let r = Number(e);
	return Number.isFinite(r) ? Math.max(t, Math.min(n, r)) : t;
}, Do = (e, t = !1) => {
	let n = String(e || "").toUpperCase();
	return n.includes("IMAGE") ? "rgba(145,198,99,0.9)" : n.includes("LATENT") ? "rgba(89,178,118,0.9)" : n.includes("MODEL") ? "rgba(112,155,255,0.9)" : n.includes("CONDITIONING") ? "rgba(191,123,226,0.9)" : n.includes("CLIP") ? "rgba(220,178,77,0.9)" : n.includes("VAE") ? "rgba(72,184,214,0.9)" : n.includes("MASK") ? "rgba(190,190,190,0.88)" : n.includes("STRING") || n.includes("TEXT") ? "rgba(230,230,230,0.86)" : n.includes("INT") || n.includes("FLOAT") || n.includes("NUMBER") ? "rgba(130,210,220,0.88)" : t ? "rgba(170,220,255,0.82)" : "rgba(255,255,255,0.72)";
}, Oo = (e, t, n) => {
	let r = String(t || "").replace(/\s+/g, " ").trim(), i = Math.max(1, Number(n) || 1);
	if (!r || e.measureText(r).width <= i) return r;
	let a = r;
	for (; a.length > 3 && e.measureText(`${a}...`).width > i;) a = a.slice(0, -1);
	return a.length > 3 ? `${a}...` : r.slice(0, 3);
};
function ko(e, t, n = null) {
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
	}, a = i.expandSubgraphs === !1 ? t : Ao(t), o = Array.isArray(a?.nodes) ? a.nodes : [], s = Array.isArray(a?.groups) && a.groups || Array.isArray(a?.extra?.groups) && a.extra.groups || Array.isArray(a?.extra?.groupNodes) && a.extra.groupNodes || Array.isArray(a?.extra?.group_nodes) && a.extra.group_nodes || [], c = Array.isArray(a?.links) && a.links || Array.isArray(a?.extra?.links) && a.extra.links || [], l = Math.max(1, e.clientWidth || e.width || 1), u = Math.max(1, e.clientHeight || e.height || 1);
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
		for (let [e, t] of To) if (n.includes(e)) return t;
		let r = 0;
		for (let e = 0; e < n.length; e += 1) r = r * 31 + n.charCodeAt(e) | 0;
		return `hsl(${Math.abs(r) % 360} 42% 42%)`;
	}, p = (e) => {
		let t = [], n = e?.inputs && typeof e.inputs == "object" && !Array.isArray(e.inputs) ? e.inputs : null;
		if (n) {
			for (let [e, r] of Object.entries(n)) if (!(Array.isArray(r) || r && typeof r == "object") && (t.push([e, r]), t.length >= 3)) return t;
		}
		let r = Array.isArray(e?.widgets_values) ? e.widgets_values : [], i = Array.isArray(e?.widgets) ? e.widgets : [], a = Array.isArray(e?.inputs) ? e.inputs : [], o = a.filter((e) => e?.widget === !0 || e?.widget && typeof e.widget == "object" || typeof e?.widget == "string" && e.widget.trim()), s = a.filter((e) => e?.link == null && Ro(e?.type)), c = (o.length ? o : s.length ? s : a).map((e) => String(e?.label || e?.localized_name || e?.name || e?.widget?.name || e?.widget?.label || "").trim());
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
		let d = Number(e?.mode), v = d === 2 || d === 4, y = a?.extra?.errors || a?.extra?.node_errors || null, b = !!(y && typeof y == "object" && n && y[n] || e?.error || e?.errors || e?.flags?.error || e?.properties?.error), x = f(e), ee = Array.isArray(e?.inputs) ? e.inputs : [], S = Array.isArray(e?.outputs) ? e.outputs : [];
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
			inputs: ee,
			outputs: S,
			inputCount: ee.length || (e?.inputs && typeof e.inputs == "object" ? Object.keys(e.inputs).length : 0),
			outputCount: S.length,
			label: vo(e).replace(/\s+/g, " ").trim()
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
	let ee = Math.max(1, b - v), S = Math.max(1, x - y), C = v + ee / 2, w = y + S / 2, T = i.view && typeof i.view == "object" ? i.view : Object.create(null), te = Eo(T.zoom ?? 1, xo, So), ne = Math.max(1, ee / te), re = Math.max(1, S / te), ie = ne / 2, ae = re / 2, oe = ne >= ee ? C : Eo(T.centerX ?? C, v + ie, b - ie), se = re >= S ? w : Eo(T.centerY ?? w, y + ae, x - ae), ce = oe - ie, le = se - ae, E = bo, D = Math.min((l - E * 2) / ne, (u - E * 2) / re), ue = T.hoveredNodeId !== null && T.hoveredNodeId !== void 0 ? String(T.hoveredNodeId) : null;
	r.clearRect(0, 0, l, u), r.fillStyle = "rgba(0,0,0,0.22)", r.fillRect(0, 0, l, u);
	let de = (e, t) => ({
		x: E + (e - ce) * D,
		y: E + (t - le) * D
	}), fe = (e, t) => ({
		x: Eo(ce + (Number(e) - E) / D, v, b),
		y: Eo(le + (Number(t) - E) / D, y, x)
	}), pe = (e) => ({
		x: E + (e.x - ce) * D,
		y: E + (e.y - le) * D,
		w: Math.max(1, e.w * D),
		h: Math.max(1, e.h * D)
	}), me = (e) => Math.max(10, Math.min(24, Math.floor(Number(e) * .2))), he = (e, t, n) => {
		let r = pe(e), i = me(r.h), a = n === "output" ? e.outputs : e.inputs, o = Math.max(1, Array.isArray(a) ? a.length : Number(e[`${n}Count`]) || 0), s = Eo(t, 0, Math.max(0, o - 1));
		return r.y + i + (r.h - i) * (s + 1) / (o + 1);
	}, ge = (e) => Array.isArray(e) && e.length >= 5 ? {
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
	} : null, O = (e) => {
		let t = String(e || "").toUpperCase();
		return t.includes("IMAGE") ? "rgba(145,198,99,0.38)" : t.includes("LATENT") ? "rgba(89,178,118,0.38)" : t.includes("MODEL") ? "rgba(112,155,255,0.38)" : t.includes("CONDITIONING") ? "rgba(191,123,226,0.38)" : t.includes("CLIP") ? "rgba(220,178,77,0.38)" : t.includes("VAE") ? "rgba(72,184,214,0.38)" : t.includes("MASK") ? "rgba(190,190,190,0.36)" : "rgba(255,255,255,0.2)";
	}, _e = () => {
		if (i.showLinks && !(!c || c.length === 0)) {
			r.save(), r.globalAlpha = 1, r.lineWidth = 1;
			for (let e of c) {
				let t = ge(e), n = t?.originId, i = t?.targetId;
				if (n === null || i === null) continue;
				let a = h.get(String(n)), o = h.get(String(i));
				if (!a || !o) continue;
				let s = pe(a), c = pe(o), l = {
					x: s.x + s.w,
					y: he(a, t?.originSlot ?? 0, "output")
				}, u = {
					x: c.x,
					y: he(o, t?.targetSlot ?? 0, "input")
				}, d = Math.max(12, Math.min(80, Math.abs(u.x - l.x) * .35));
				r.strokeStyle = O(t?.type), r.beginPath(), r.moveTo(l.x, l.y), r.bezierCurveTo(l.x + d, l.y, u.x - d, u.y, u.x, u.y), r.stroke();
			}
			r.restore();
		}
	}, k = (e) => {
		let { x: t, y: n, w: a, h: o } = pe(e), s = e.kind === "node", c = e.kind === "group", l = !!e.bypassed, u = !!e.errored, f = c ? .18 : l && i.renderBypassState ? .14 : .62, p = c ? .55 : l && i.renderBypassState ? .32 : .8, m = d(e.fill, f), h = d(e.stroke, p), g = s && i.showNodeLabels && a >= Co && o >= wo, _ = Math.max(2, Math.min(g ? 7 : 8, Math.floor(Math.min(a, o) * .08))), v = s ? me(o) : 0;
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
				let n = he(e, i, "input");
				r.fillStyle = Do(e.inputs?.[i]?.type, !1), r.beginPath(), r.arc(t, n, g ? 3 : 2.2, 0, Math.PI * 2), r.fill(), r.stroke();
			}
			for (let n = 0; n < i; n += 1) {
				let i = he(e, n, "output");
				r.fillStyle = Do(e.outputs?.[n]?.type, !0), r.beginPath(), r.arc(t + a, i, g ? 3 : 2.2, 0, Math.PI * 2), r.fill(), r.stroke();
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
				s && r.fillText(Oo(r, s, i), t + 7, he(e, a, "input") + n * .35, i);
			}
			for (let o = 0; o < Math.min(8, e.outputs?.length || 0); o += 1) {
				let s = e.outputs[o], c = String(s?.label || s?.localized_name || s?.name || "").trim();
				if (!c) continue;
				let l = Oo(r, c, i);
				r.fillText(l, t + a - 7 - Math.min(i, r.measureText(l).width), he(e, o, "output") + n * .35, i);
			}
			r.restore();
		}
	};
	for (let e of m.filter((e) => e.kind === "group")) k(e);
	_e();
	for (let e of m.filter((e) => e.kind === "node")) k(e);
	if (i.showViewport) try {
		let e = we();
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
			width: ee,
			height: S
		},
		resolvedView: {
			zoom: te,
			centerX: oe,
			centerY: se,
			visibleW: ne,
			visibleH: re,
			viewMinX: ce,
			viewMinY: le,
			pad: E,
			renderScale: D
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
function Ao(e) {
	if (!e || typeof e != "object") return e;
	let t = Array.isArray(e.nodes) ? e.nodes.filter(Boolean) : [], n = jo(e);
	if (!t.length) return e;
	let r = [], i = Array.isArray(e.links) ? [...e.links] : [], a = [...Array.isArray(e.groups) ? e.groups : [], ...Array.isArray(e.extra?.groups) ? e.extra.groups : []];
	for (let e of t) {
		r.push(e);
		let t = Mo(e, n);
		if (!t || !Array.isArray(t.nodes) || !t.nodes.length) continue;
		let o = Po(e, Ao(t));
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
function jo(e) {
	let t = [
		...Array.isArray(e?.definitions?.subgraphs) ? e.definitions.subgraphs : [],
		...Array.isArray(e?.subgraphs) ? e.subgraphs : [],
		...Array.isArray(e?.rootGraph?.subgraphs) ? e.rootGraph.subgraphs : []
	], n = /* @__PURE__ */ new Map();
	for (let e of t) for (let t of No(e)) t != null && n.set(String(t), e);
	return n;
}
function Mo(e, t) {
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
function No(e) {
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
function Po(e, t) {
	let n = String(e?.id ?? e?.ID ?? ""), r = Io(e?.pos) || [0, 0], i = Lo(e?.size) || [260, 180], a = t.nodes.filter(Boolean), o = Fo(a), s = Math.min(22, Math.max(8, i[0] * .08)), c = Math.min(34, Math.max(18, i[1] * .18)), l = Math.min(18, Math.max(8, i[1] * .08)), u = Math.max(40, i[0] - s * 2), d = Math.max(34, i[1] - c - l), f = Math.min(1, u / o.width, d / o.height), p = r[0] + s + (u - o.width * f) / 2, m = r[1] + c + (d - o.height * f) / 2, h = a.map((r) => {
		let i = Io(r?.pos) || [o.minX, o.minY], a = Lo(r?.size) || [140, 60];
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
function Fo(e) {
	let t = Infinity, n = Infinity, r = -Infinity, i = -Infinity;
	for (let a of e) {
		let e = Io(a?.pos);
		if (!e) continue;
		let o = Lo(a?.size) || [140, 60];
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
function Io(e) {
	if (Array.isArray(e) && e.length >= 2) return [Number(e[0]), Number(e[1])];
	if (e && typeof e == "object") {
		let t = e[0] ?? e[0] ?? e.x ?? e.left ?? null, n = e[1] ?? e[1] ?? e.y ?? e.top ?? null;
		if (t !== null && n !== null) return [Number(t), Number(n)];
	}
	return null;
}
function Lo(e) {
	if (Array.isArray(e) && e.length >= 2) return [Number(e[0]), Number(e[1])];
	if (e && typeof e == "object") {
		let t = e[0] ?? e[0] ?? e.w ?? e.width ?? null, n = e[1] ?? e[1] ?? e.h ?? e.height ?? null;
		if (t !== null && n !== null) return [Number(t), Number(n)];
	}
	return null;
}
function Ro(e) {
	if (Array.isArray(e)) return !0;
	let t = String(e || "").trim().toUpperCase();
	return t === "INT" || t === "FLOAT" || t === "STRING" || t === "BOOLEAN" || t === "BOOL" || t === "COMBO" || t === "ENUM";
}
function zo(e, t = null) {
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
var Bo = {
	key: 0,
	class: "mjr-sidebar-section",
	style: {
		background: "var(--comfy-menu-bg, rgba(0,0,0,0.2))",
		border: "1px solid var(--border-color, rgba(255,255,255,0.14))",
		"border-radius": "8px",
		padding: "12px",
		"min-width": "300px"
	}
}, Vo = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "8px",
	"margin-bottom": "10px"
} }, Ho = { style: {
	padding: "4px 9px",
	"border-radius": "999px",
	background: "rgba(33,150,243,0.14)",
	border: "1px solid rgba(33,150,243,0.30)",
	"font-size": "11px",
	"font-weight": "700",
	color: "#90CAF9",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, Uo = {
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
}, Wo = { style: {
	display: "grid",
	"grid-template-columns": "repeat(3, minmax(0, 1fr))",
	gap: "8px",
	"margin-bottom": "12px"
} }, Go = { style: {
	padding: "8px 10px",
	"border-radius": "10px",
	background: "rgba(255,255,255,0.04)",
	border: "1px solid rgba(255,255,255,0.10)"
} }, Ko = { style: {
	"font-size": "18px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.94)",
	"margin-top": "2px"
} }, qo = { style: {
	padding: "8px 10px",
	"border-radius": "10px",
	background: "rgba(255,255,255,0.04)",
	border: "1px solid rgba(255,255,255,0.10)"
} }, Jo = { style: {
	"font-size": "18px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.94)",
	"margin-top": "2px"
} }, Yo = { style: {
	padding: "8px 10px",
	"border-radius": "10px",
	background: "rgba(255,255,255,0.04)",
	border: "1px solid rgba(255,255,255,0.10)"
} }, Xo = { style: {
	"font-size": "18px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.94)",
	"margin-top": "2px"
} }, Zo = {
	key: 0,
	class: "mjr-workflow-tree-wrap"
}, Qo = { class: "mjr-workflow-tree-node" }, $o = { class: "mjr-workflow-tree-node-name" }, es = {
	key: 0,
	class: "mjr-workflow-tree-node-type"
}, ts = { class: "mjr-menu-item-hint" }, ns = {
	key: 0,
	class: "mjr-section-hint"
}, rs = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px",
	"margin-top": "8px"
} }, is = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "6px",
	"align-items": "center"
} }, as = {
	key: 1,
	style: {
		display: "grid",
		"grid-template-columns": "repeat(auto-fit, minmax(180px, 1fr))",
		gap: "8px",
		"align-items": "stretch",
		"margin-top": "10px",
		"margin-bottom": "10px"
	}
}, os = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "2px",
	"min-width": "0"
} }, ss = { style: {
	"font-size": "13px",
	"font-weight": "600"
} }, cs = { style: {
	"font-size": "11px",
	color: "rgba(255,255,255,0.58)"
} }, ls = { style: {
	display: "flex",
	gap: "10px",
	"align-items": "stretch",
	"margin-top": "10px"
} }, us = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	gap: "10px",
	"margin-top": "8px",
	"font-size": "11px",
	color: "rgba(255,255,255,0.58)"
} }, ds = ["open"], fs = { style: {
	background: "rgba(0,0,0,0.5)",
	padding: "10px",
	"border-radius": "6px",
	"font-size": "11px",
	overflow: "auto",
	"max-height": "180px",
	margin: "10px 0 0 0",
	color: "#90CAF9",
	"font-family": "'Consolas', 'Monaco', monospace"
} }, ps = 1, ms = 8, hs = 250, gs = {
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
		]), a = F(null), o = F(!1), s = F(!1), c = F(S()), l = F({ ...r }), u = F("crosshair"), d = F(""), f = null, p = null, m = null;
		function g(e, t, n) {
			let r = Number(e);
			return Number.isFinite(r) ? Math.max(t, Math.min(n, r)) : t;
		}
		function _(e) {
			!e || typeof e != "object" || (l.value = {
				...l.value,
				zoom: g(e.zoom ?? l.value.zoom, ps, ms),
				centerX: Number.isFinite(Number(e.centerX)) ? Number(e.centerX) : null,
				centerY: Number.isFinite(Number(e.centerY)) ? Number(e.centerY) : null
			});
		}
		function v() {
			l.value = { ...r }, d.value = "";
		}
		function y(e) {
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
		function b(e) {
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
		function x(e) {
			let t = y(e), n = e?.workflow || e?.Workflow || e?.comfy_workflow || t?.workflow || t?.Workflow || t?.comfy_workflow || null;
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
		function ee(e) {
			let t = y(e), n = e?.prompt || e?.Prompt || t?.prompt || t?.Prompt || null;
			if (!n) return null;
			if (typeof n == "object") return b(n) ? n : null;
			if (typeof n == "string") {
				let e = n.trim();
				if (!e) return null;
				try {
					let t = JSON.parse(e);
					return b(t) ? t : null;
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
				let e = localStorage?.getItem?.(h);
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
					}, q(e), localStorage?.removeItem?.(h);
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
			let e = x(t.asset), n = ee(t.asset);
			return !e && !n ? null : e || zo(n);
		}), T = B(() => t.asset?.has_generation_data ? "Complete" : "Partial"), te = B(() => w.value ? JSON.stringify(w.value, null, 2) : "");
		function ne(e, t) {
			let n = e?.id ?? e?.key ?? t + 1;
			return String(e?.title || e?._meta?.title || e?.type || e?.class_type || e?.name || `Node ${n}`);
		}
		function re(e) {
			return String(e?.type || e?.class_type || e?.name || "").trim();
		}
		let ie = B(() => (Array.isArray(w.value?.nodes) ? w.value.nodes : []).slice(0, hs).map((e, t) => {
			let n = e?.id ?? e?.key ?? t + 1, r = re(e);
			return {
				key: String(n),
				label: ne(e, t),
				icon: "pi pi-circle-fill",
				data: {
					id: n,
					type: r
				}
			};
		})), ae = B(() => Math.max(0, Number(oe.value.nodes || 0) - ie.value.length)), oe = B(() => {
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
		}), se = B(() => {
			let e = String(c.value?.size || "comfortable");
			return i.find((t) => t.key === e) || i[1];
		}), ce = B(() => `${se.value.height}px`), le = B(() => [
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
		function E() {
			let e = a.value, t = w.value;
			if (!e || !t) return;
			let n = Math.max(1, e.clientWidth || 320), r = Math.max(1, e.clientHeight || 120), i = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
			e.width = Math.floor(n * i), e.height = Math.floor(r * i);
			let o = e.getContext("2d");
			o && o.setTransform(i, 0, 0, i, 0, 0), p = ko(e, t, {
				...c.value,
				view: l.value
			}) || null, _(p?.resolvedView);
		}
		function D(e) {
			_e(e);
		}
		function ue(e) {
			let t = a.value;
			if (!t) return null;
			let n = t.getBoundingClientRect?.();
			return n ? {
				x: Number(e?.clientX) - n.left,
				y: Number(e?.clientY) - n.top
			} : null;
		}
		function de(e) {
			let t = ue(e);
			return !t || !p?.canvasToWorld ? null : {
				local: t,
				world: p.canvasToWorld(t.x, t.y)
			};
		}
		function fe(e) {
			let t = ue(e), n = t && p?.hitTestNode ? p.hitTestNode(t.x, t.y) : null, r = n?.id !== null && n?.id !== void 0 ? String(n.id) : null, i = l.value.hoveredNodeId !== null && l.value.hoveredNodeId !== void 0 ? String(l.value.hoveredNodeId) : null;
			d.value = n?.label || "", r !== i && (l.value = {
				...l.value,
				hoveredNodeId: r
			}, E());
		}
		function pe(e) {
			e && (D(e), l.value = {
				...l.value,
				centerX: Number(e.x),
				centerY: Number(e.y)
			}, E());
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
			}, E()));
		}
		function k(e) {
			let t = de(e), n = p?.resolvedView;
			if (!t || !n) return;
			let r = g(Number(e?.deltaY) || 0, -240, 240), i = Math.exp(-r * .0025), a = g((Number(l.value.zoom) || 1) * i, ps, ms);
			if (Math.abs(a - (Number(l.value.zoom) || 1)) < .001) {
				e.preventDefault?.(), e.stopPropagation?.();
				return;
			}
			let o = Math.max(1, Number(p?.bounds?.width || 1) / a), s = Math.max(1, Number(p?.bounds?.height || 1) / a), c = g((Number(t.world.x) - Number(n.viewMinX || 0)) / Math.max(1, Number(n.visibleW || 1)), 0, 1), u = g((Number(t.world.y) - Number(n.viewMinY || 0)) / Math.max(1, Number(n.visibleH || 1)), 0, 1);
			l.value = {
				...l.value,
				zoom: a,
				centerX: Number(t.world.x) + (.5 - c) * o,
				centerY: Number(t.world.y) + (.5 - u) * s
			}, E(), fe(e), e.preventDefault?.(), e.stopPropagation?.();
		}
		function ve(e) {
			let t = de(e);
			v(), t && D(t.world), E(), e.preventDefault?.(), e.stopPropagation?.();
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
		return je(() => {
			a.value && typeof ResizeObserver == "function" && (f = new ResizeObserver(() => E()), f.observe(a.value)), E();
		}), Te(w, () => {
			v(), E();
		}, { flush: "post" }), Te(c, () => {
			E();
		}, {
			deep: !0,
			flush: "post"
		}), Te(o, () => {
			E();
		}, { flush: "post" }), Ae(() => {
			try {
				f?.disconnect?.();
			} catch (e) {
				console.debug?.(e);
			}
			f = null, m = null;
		}), (e, t) => {
			let n = Qe("MTree"), r = Qe("MButton");
			return w.value ? (j(), P("div", Bo, [
				t[8] ||= N("div", { style: {
					"font-size": "13px",
					"font-weight": "600",
					color: "var(--fg-color, #eaeaea)",
					"margin-bottom": "12px",
					"text-transform": "uppercase",
					"letter-spacing": "0.5px"
				} }, " ComfyUI Workflow ", -1),
				N("div", Vo, [N("div", Ho, L(T.value), 1), oe.value.source ? (j(), P("div", Uo, L(oe.value.source), 1)) : z("", !0)]),
				N("div", Wo, [
					N("div", Go, [t[2] ||= N("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Nodes", -1), N("div", Ko, L(oe.value.nodes), 1)]),
					N("div", qo, [t[3] ||= N("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Links", -1), N("div", Jo, L(oe.value.links), 1)]),
					N("div", Yo, [t[4] ||= N("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Groups", -1), N("div", Xo, L(oe.value.groups), 1)])
				]),
				ie.value.length ? (j(), P("div", Zo, [
					t[5] ||= N("div", { class: "mjr-section-title" }, " Workflow Nodes ", -1),
					De(n, {
						value: ie.value,
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
						default: ke(({ node: e }) => [N("span", Qo, [
							N("span", $o, L(e.label), 1),
							e.data?.type ? (j(), P("span", es, L(e.data.type), 1)) : z("", !0),
							N("span", ts, "#" + L(e.data?.id), 1)
						])]),
						_: 1
					}, 8, ["value"]),
					ae.value ? (j(), P("div", ns, " +" + L(ae.value) + " more nodes ", 1)) : z("", !0)
				])) : z("", !0),
				N("div", rs, [N("div", is, [(j(!0), P(V, null, M(R(i), (e) => (j(), Ee(r, {
					key: e.key,
					type: "button",
					severity: "secondary",
					text: "",
					rounded: "",
					title: `${e.label} minimap`,
					style: I({
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
					default: ke(() => [Oe(L(e.label), 1)]),
					_: 2
				}, 1032, [
					"title",
					"style",
					"onClick"
				]))), 128))]), De(r, {
					type: "button",
					class: "mjr-btn mjr-icon-btn",
					severity: "secondary",
					text: "",
					rounded: "",
					title: R(O)("tooltip.minimapSettings", "Minimap settings"),
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
					default: ke(() => [...t[6] ||= [N("i", { class: "pi pi-sliders-h" }, null, -1)]]),
					_: 1
				}, 8, ["title"])]),
				o.value ? (j(), P("div", as, [(j(!0), P(V, null, M(le.value, (e) => (j(), Ee(r, {
					key: e.key,
					type: "button",
					severity: "secondary",
					text: "",
					style: I({
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
					default: ke(() => [
						N("span", { style: I({
							width: "22px",
							height: "22px",
							borderRadius: "6px",
							display: "inline-flex",
							alignItems: "center",
							justifyContent: "center",
							background: c.value?.[e.key] ? "rgba(76,175,80,0.95)" : "rgba(255,255,255,0.08)",
							border: c.value?.[e.key] ? "1px solid rgba(76,175,80,0.35)" : "1px solid rgba(255,255,255,0.12)",
							flex: "0 0 auto"
						}) }, [N("i", {
							class: "pi pi-check",
							style: I({
								fontSize: "12px",
								opacity: c.value?.[e.key] ? "1" : "0"
							})
						}, null, 4)], 4),
						N("i", {
							class: Ve(e.iconClass),
							style: {
								"font-size": "18px",
								opacity: "0.9",
								width: "18px"
							}
						}, null, 2),
						N("div", os, [N("div", ss, L(e.label), 1), N("div", cs, L(c.value?.[e.key] ? "On" : "Off"), 1)])
					]),
					_: 2
				}, 1032, ["style", "onClick"]))), 128))])) : z("", !0),
				N("div", ls, [N("canvas", {
					ref_key: "canvasRef",
					ref: a,
					style: I({
						width: "100%",
						height: ce.value,
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
					onWheel: k,
					onDblclick: ve
				}, null, 36)]),
				N("div", us, [N("span", null, L(d.value || "Click/drag to navigate | wheel to zoom"), 1), N("span", null, L(Math.round((l.value.zoom || 1) * 100)) + "% | " + L(se.value.label), 1)]),
				N("details", {
					open: s.value,
					style: { "margin-top": "10px" },
					onToggle: t[1] ||= (e) => s.value = e.target.open
				}, [t[7] ||= N("summary", { style: {
					cursor: "pointer",
					color: "var(--mjr-muted, rgba(255,255,255,0.65))",
					"font-size": "12px",
					"user-select": "none"
				} }, " Show raw JSON ", -1), N("pre", fs, L(te.value), 1)], 40, ds)
			])) : z("", !0);
		};
	}
};
//#endregion
export { Qr as A, lr as B, qr as C, Kr as D, $r as E, Er as F, q as G, Qt as H, Ir as I, ct as J, yt as K, Pr as L, Lr as M, br as N, Zr as O, Dr as P, yr as R, ri as S, Jr as T, J as U, cr as V, K as W, ai as _, go as a, ei as b, Yi as c, Si as d, xi as f, li as g, vi as h, vo as i, Br as j, Xr as k, Di as l, _i as m, ko as n, yo as o, fi as p, bt as q, zo as r, uo as s, gs as t, bi as u, oi as v, zr as w, ii as x, si as y, vr as z };
